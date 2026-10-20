import "server-only";
import { spawn } from "node:child_process";
import type {
  CaseResult,
  JudgeResponse,
  ProblemDoc,
  SubmissionStatus,
  TestCase,
} from "@/lib/types";

/**
 * Judge design (defence in depth):
 *  1. Code runs in a separate Node process started with `--permission`, which
 *     denies filesystem, network, child-process and worker access.
 *  2. Inside it, code is evaluated in a fresh `vm` context that has no `process`,
 *     `require`, or host objects, and with eval / new Function disabled.
 *  3. Only JSON *arguments* go in; only JSON *results* come out. Expected values
 *     stay in this (parent) process, so hidden tests can't be read or spoofed.
 *  4. Per-test CPU timeout (vm), process wall-clock timeout, and a heap cap.
 *
 * This is good for a trusted/small community. For a hostile public deployment,
 * run the judge in a container / microVM as well.
 */

const PER_TEST_TIMEOUT_MS = 1000;
const TOTAL_TIMEOUT_MS = 10_000;
const MAX_RESULT_CHARS = 50_000;
const MAX_CONCURRENT_RUNS = 4;

// Tiny semaphore so a burst of submissions can't fork-bomb the server.
let active = 0;
const waiting: Array<() => void> = [];
async function acquire() {
  if (active < MAX_CONCURRENT_RUNS) {
    active++;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve));
}
function release() {
  const next = waiting.shift();
  if (next) next(); // hand the slot straight to the next waiter
  else active--;
}

const RUNNER = String.raw`
const vm = require("node:vm");
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  const { code, fn, cases, timeout } = JSON.parse(input);
  const out = { compileError: null, results: [] };
  const ctx = vm.createContext(Object.create(null), {
    codeGeneration: { strings: false, wasm: false },
  });
  const finish = () => process.stdout.write(JSON.stringify(out));
  try {
    vm.runInContext(
      "const __J = { parse: JSON.parse, stringify: JSON.stringify };" +
        "const __bq = { logs: [] };" +
        "globalThis.console = { log: (...a) => { __bq.logs.push(a.map((x) => { try { return typeof x === 'string' ? x : __J.stringify(x); } catch (e) { return String(x); } }).join(' ')); } };",
      ctx,
    );
    new vm.Script(code, { filename: "solution.js" }).runInContext(ctx, { timeout });
    const t = vm.runInContext("typeof " + fn, ctx);
    if (t !== "function") {
      out.compileError = "Expected a function named " + fn + " but found " + t + ".";
      return finish();
    }
  } catch (e) {
    out.compileError = String((e && e.message) || e);
    return finish();
  }
  for (const argsJson of cases) {
    const started = Date.now();
    const script =
      "(function(){ __bq.logs.length = 0; let o;" +
      "try { const r = " + fn + "(...__J.parse(" + JSON.stringify(argsJson) + "));" +
      "o = { ok: true, r: r === undefined ? '__undefined__' : __J.stringify(r) }; }" +
      "catch (e) { o = { ok: false, e: String((e && e.message) || e) }; }" +
      "o.logs = __bq.logs.join('\\n').slice(0, 2000); return __J.stringify(o); })()";
    try {
      const raw = vm.runInContext(script, ctx, { timeout });
      const parsed = JSON.parse(raw);
      out.results.push({ ...parsed, ms: Date.now() - started });
    } catch (e) {
      const timedOut = e && e.code === "ERR_SCRIPT_EXECUTION_TIMEOUT";
      out.results.push({ ok: false, e: timedOut ? "Time limit exceeded" : String((e && e.message) || e), timeout: !!timedOut, ms: Date.now() - started });
      if (timedOut) break;
    }
  }
  finish();
});
`;

interface RunnerOutput {
  compileError: string | null;
  results: Array<{
    ok: boolean;
    r?: string;
    e?: string;
    logs?: string;
    timeout?: boolean;
    ms: number;
  }>;
}

type RunnerFailure = { failure: "timeout" | "crash"; detail: string };

function execRunner(
  code: string,
  fn: string,
  argsJson: string[],
): Promise<RunnerOutput | RunnerFailure> {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ["--permission", "--max-old-space-size=96", "-e", RUNNER],
      { env: {} as NodeJS.ProcessEnv, stdio: ["pipe", "pipe", "pipe"] },
    );

    let stdout = "";
    let stderr = "";
    let settled = false;
    const done = (value: RunnerOutput | RunnerFailure) => {
      if (settled) return;
      settled = true;
      clearTimeout(killer);
      resolve(value);
    };

    const killer = setTimeout(() => {
      child.kill("SIGKILL");
      done({ failure: "timeout", detail: "Time limit exceeded" });
    }, TOTAL_TIMEOUT_MS);

    child.stdout.on("data", (c) => {
      stdout += c;
      if (stdout.length > MAX_RESULT_CHARS * 40) child.kill("SIGKILL");
    });
    child.stderr.on("data", (c) => {
      if (stderr.length < 2000) stderr += c;
    });
    child.on("error", (err) =>
      done({ failure: "crash", detail: `Judge failed to start: ${err.message}` }),
    );
    child.on("close", () => {
      try {
        done(JSON.parse(stdout) as RunnerOutput);
      } catch {
        const oom = /heap|memory/i.test(stderr);
        done({
          failure: "crash",
          detail: oom
            ? "Your code used too much memory."
            : "Your code crashed the runner.",
        });
      }
    });

    child.stdin.on("error", () => {});
    child.stdin.end(
      JSON.stringify({ code, fn, cases: argsJson, timeout: PER_TEST_TIMEOUT_MS }),
    );
  });
}

function normalize(value: unknown, orderInsensitive: boolean): unknown {
  if (orderInsensitive && Array.isArray(value)) {
    return [...value].sort((a, b) =>
      JSON.stringify(a) < JSON.stringify(b) ? -1 : 1,
    );
  }
  return value;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a)) {
    return (
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((v, i) => deepEqual(v, b[i]))
    );
  }
  if (typeof a === "object") {
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    const ak = Object.keys(ao);
    return (
      ak.length === Object.keys(bo).length &&
      ak.every((k) => k in bo && deepEqual(ao[k], bo[k]))
    );
  }
  return false;
}

export async function judge(
  problem: Pick<ProblemDoc, "fn" | "tests" | "orderInsensitive">,
  code: string,
  mode: "run" | "submit",
): Promise<Omit<JudgeResponse, "reward" | "user">> {
  const tests: TestCase[] =
    mode === "run" ? problem.tests.filter((t) => !t.hidden) : problem.tests;
  const total = tests.length;
  const started = Date.now();

  const base = (
    status: SubmissionStatus,
    message: string,
  ): Omit<JudgeResponse, "reward" | "user"> => ({
    status,
    passed: 0,
    total,
    runtimeMs: Date.now() - started,
    message,
    cases: [],
  });

  if (code.length > 20_000) {
    return base("compile_error", "Solution is too long (20,000 characters max).");
  }

  await acquire();
  let output: Awaited<ReturnType<typeof execRunner>>;
  try {
    output = await execRunner(
      code,
      problem.fn,
      tests.map((t) => JSON.stringify(t.args)),
    );
  } finally {
    release();
  }

  if ("failure" in output) {
    return base(
      output.failure === "timeout" ? "time_limit" : "runtime_error",
      output.detail,
    );
  }
  if (output.compileError) {
    return base("compile_error", output.compileError);
  }

  const ins = problem.orderInsensitive ?? false;
  const cases: CaseResult[] = [];
  let passed = 0;
  let status: SubmissionStatus = "accepted";
  let message: string | undefined;

  tests.forEach((test, index) => {
    const res = output.results[index];
    const hidden = !!test.hidden;
    const visible = hidden
      ? {}
      : { args: test.args, expected: test.expected };

    if (!res) {
      // Runner stopped early (time limit on an earlier case).
      cases.push({ index, passed: false, hidden, ...visible });
      return;
    }

    if (!res.ok) {
      const timeout = !!res.timeout;
      if (status === "accepted") {
        status = timeout ? "time_limit" : "runtime_error";
        message = res.e;
      }
      cases.push({
        index,
        passed: false,
        hidden,
        ...visible,
        error: hidden && !timeout ? "Runtime error" : res.e,
        logs: hidden ? undefined : res.logs,
      });
      return;
    }

    let actual: unknown;
    let ok = false;
    if (res.r === "__undefined__") {
      actual = undefined;
    } else {
      try {
        const text = res.r ?? "null";
        actual = text.length > MAX_RESULT_CHARS ? "[output too large]" : JSON.parse(text);
        ok = deepEqual(
          normalize(actual, ins),
          normalize(JSON.parse(JSON.stringify(test.expected)), ins),
        );
      } catch {
        ok = false;
      }
    }

    if (ok) passed += 1;
    else if (status === "accepted") status = "wrong_answer";

    cases.push({
      index,
      passed: ok,
      hidden,
      ...visible,
      actual: hidden ? undefined : actual === undefined ? "undefined (did you forget to return?)" : actual,
      logs: hidden ? undefined : res.logs,
    });
  });

  return {
    status,
    passed,
    total,
    runtimeMs: Date.now() - started,
    message,
    cases,
  };
}
