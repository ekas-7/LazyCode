"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CaseResult, JudgeResponse } from "@/lib/types";
import type { PublicQuest } from "@/server/queries";
import { HINT_COST } from "@/lib/game";
import { RichText } from "@/components/RichText";
import { ArrowLeft, BerryIcon, CheckIcon, SparkleIcon } from "@/components/ui/icons";
import type { MascotMood } from "@/components/world/parts";
import { Celebration } from "./Celebration";

const CodeEditor = dynamic(() => import("./CodeEditor"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-muted">Loading editor…</div>,
});
const MascotStage = dynamic(() => import("@/components/world/MascotStage"), {
  ssr: false,
  loading: () => null,
});

const DIFF_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" } as const;

function fmt(value: unknown, max = 140) {
  let s: string;
  try {
    s = value === undefined ? "undefined" : JSON.stringify(value);
  } catch {
    s = String(value);
  }
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

type ApiError = { error: string };

export function QuestWorkspace({
  quest,
  regionName,
  userId,
  berries: initialBerries,
}: {
  quest: PublicQuest;
  regionName: string;
  userId: string;
  berries: number;
}) {
  const router = useRouter();
  const draftKey = `bq:draft:${userId}:${quest.slug}`;

  const [code, setCode] = useState(() => {
    // Only the browser has a draft; skip storage entirely while server-rendering.
    if (typeof window !== "undefined") {
      try {
        const draft = window.localStorage.getItem(draftKey);
        if (draft) return draft;
      } catch {
        /* storage blocked */
      }
    }
    return quest.savedCode ?? quest.starterCode;
  });
  const [busy, setBusy] = useState<"run" | "submit" | "hint" | null>(null);
  const [result, setResult] = useState<(JudgeResponse & { mode: "run" | "submit" }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hints, setHints] = useState(quest.revealedHints);
  const [berries, setBerries] = useState(initialBerries);
  const [solved, setSolved] = useState(quest.solved);
  const [reward, setReward] = useState<JudgeResponse["reward"] | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Keep the latest code in a ref so the editor's key bindings never go stale.
  const codeRef = useRef(code);
  useEffect(() => {
    codeRef.current = code;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, code);
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(id);
  }, [code, draftKey]);

  const busyRef = useRef(busy);
  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  const judge = useCallback(
    async (mode: "run" | "submit") => {
      if (busyRef.current) return;
      setBusy(mode);
      setError(null);
      try {
        const res = await fetch("/api/judge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: quest.slug, code: codeRef.current, mode }),
        });
        const data = (await res.json()) as JudgeResponse | ApiError;
        if (res.status === 401) {
          router.push(`/login?next=${encodeURIComponent(`/quest/${quest.slug}`)}`);
          return;
        }
        if (!res.ok || "error" in data) {
          setError("error" in data ? data.error : "Something went wrong.");
          return;
        }
        setResult({ ...data, mode });
        if (data.user) setBerries(data.user.berries);
        if (data.reward) {
          setSolved(true);
          setReward(data.reward);
          setShowCelebration(true);
          router.refresh(); // update the header counters
        } else if (mode === "submit" && data.status === "accepted") {
          setSolved(true);
        }
      } catch {
        setError("Couldn't reach the server. Check your connection and try again.");
      } finally {
        setBusy(null);
      }
    },
    [quest.slug, router],
  );

  const run = useCallback(() => void judge("run"), [judge]);
  const submit = useCallback(() => void judge("submit"), [judge]);

  async function revealHint() {
    if (busy) return;
    setBusy("hint");
    setError(null);
    try {
      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: quest.slug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't fetch a hint.");
        return;
      }
      setHints((h) => [...h, data.hint]);
      if (data.user) setBerries(data.user.berries);
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(null);
    }
  }

  function resetCode() {
    if (window.confirm("Reset to the starter code? Your current code will be replaced.")) {
      setCode(quest.starterCode);
    }
  }

  const mood: MascotMood =
    result && !busy ? (result.status === "accepted" ? "happy" : "sad") : "idle";
  const canAffordHint = solved || berries >= HINT_COST;
  const hintsLeft = quest.totalHints - hints.length;

  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-2 sm:px-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* ───────── story & description ───────── */}
        <section className="panel animate-float-up relative overflow-y-auto p-6 sm:p-8 lg:h-[calc(100svh-150px)] lg:min-h-[600px]">
          <Link
            href="/world"
            className="eyebrow inline-flex items-center gap-2 !text-[0.62rem] transition hover:text-berry"
          >
            <ArrowLeft /> Back to the map
          </Link>

          <div className="pointer-events-none absolute right-3 top-3 h-36 w-36 sm:right-6 sm:top-5 sm:h-44 sm:w-44">
            <MascotStage mood={mood} />
          </div>

          <p className="eyebrow mt-6 max-w-[60%] !text-[0.62rem] sm:max-w-none">
            {regionName} · Quest {quest.order}
          </p>
          <h1 className="title-serif mt-2 max-w-[75%] text-[2.4rem] leading-[1.05] sm:text-[2.9rem]">
            {quest.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="chip chip-solid">{DIFF_LABEL[quest.difficulty]}</span>
            {quest.tags.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
            {solved && (
              <span className="chip !border-solid !border-leaf/60 !text-leaf">
                <CheckIcon size={12} />
                &nbsp;Solved
              </span>
            )}
          </div>

          <p className="mt-5 flex items-center gap-4 font-serif text-lg">
            <span>
              <span className="text-berry">+{quest.xp}</span>{" "}
              <span className="text-xs uppercase tracking-widest text-muted">xp</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BerryIcon size={18} /> {quest.berries}
            </span>
          </p>

          <p className="mt-5 border-l-2 border-berry/40 pl-4 font-serif text-[1.05rem] italic leading-relaxed text-ink/80">
            {quest.story}
          </p>

          <RichText text={quest.description} className="mt-5 text-[0.98rem] text-ink/90" />

          <h2 className="eyebrow mt-7 !text-[0.65rem]">Examples</h2>
          <div className="mt-3 space-y-3">
            {quest.examples.map((ex, i) => (
              <div key={i} className="rounded-2xl border border-line bg-white/55 p-4 font-mono text-[0.82rem] leading-relaxed">
                <div>
                  <span className="text-muted">input&nbsp;&nbsp;</span> {ex.input}
                </div>
                <div>
                  <span className="text-muted">output&nbsp;</span> <span className="text-berry-deep">{ex.output}</span>
                </div>
                {ex.explanation && (
                  <div className="mt-1 font-sans text-[0.8rem] italic text-muted">{ex.explanation}</div>
                )}
              </div>
            ))}
          </div>

          <p className="mt-4 text-[0.82rem] text-muted">
            {quest.visibleTests.length} visible test{quest.visibleTests.length === 1 ? "" : "s"} ·{" "}
            {quest.hiddenTestCount} hidden test{quest.hiddenTestCount === 1 ? "" : "s"} checked on submit
          </p>

          {/* hints */}
          <div className="mt-7 border-t border-dashed border-line pt-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="eyebrow !text-[0.65rem]">Hints</h2>
              {hintsLeft > 0 ? (
                <button
                  onClick={revealHint}
                  disabled={busy !== null || !canAffordHint}
                  className="btn btn-ghost !px-4 !py-2 !text-[0.6rem]"
                  title={canAffordHint ? undefined : "Not enough berries"}
                >
                  <SparkleIcon size={12} />
                  {solved ? "Reveal a hint" : `Reveal a hint · ${HINT_COST}`}
                  {!solved && <BerryIcon size={14} />}
                </button>
              ) : (
                <span className="text-xs text-muted">No more hints</span>
              )}
            </div>
            {hints.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Stuck? Hints nudge you in the right direction without giving the answer away.
              </p>
            ) : (
              <ol className="mt-3 space-y-2.5">
                {hints.map((h, i) => (
                  <li
                    key={i}
                    className="animate-float-up flex gap-3 rounded-2xl bg-honey/15 px-4 py-3 text-[0.92rem]"
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-honey/80 text-[0.68rem] font-semibold text-white">
                      {i + 1}
                    </span>
                    <RichText text={h} />
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        {/* ───────── editor & results ───────── */}
        <section className="flex min-h-0 flex-col gap-4 lg:h-[calc(100svh-150px)] lg:min-h-[600px]">
          <div className="panel flex min-h-[340px] flex-1 flex-col overflow-hidden !rounded-[26px]">
            <div className="flex items-center justify-between border-b border-line/70 bg-paper/70 px-5 py-3">
              <span className="font-mono text-[0.78rem] text-muted">
                solution.js · <span className="text-berry-deep">{quest.fn}()</span>
              </span>
              <button
                onClick={resetCode}
                className="eyebrow !text-[0.58rem] text-muted transition hover:text-berry"
              >
                Reset
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <CodeEditor value={code} onChange={setCode} onRun={run} onSubmit={submit} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={run} disabled={busy !== null} className="btn btn-ghost">
              {busy === "run" ? "Running…" : "Run tests"}
            </button>
            <button onClick={submit} disabled={busy !== null} className="btn btn-teal">
              {busy === "submit" ? "Judging…" : solved ? "Submit again" : "Submit"}
            </button>
            <span className="ml-auto hidden text-[0.72rem] text-muted md:block">
              <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono">⌘/Ctrl</kbd> +{" "}
              <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono">Enter</kbd> run ·{" "}
              <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono">Shift</kbd> submit
            </span>
          </div>

          <Results result={result} error={error} busy={busy} quest={quest} />
        </section>
      </div>

      {showCelebration && reward && (
        <Celebration reward={reward} title={quest.title} onClose={() => setShowCelebration(false)} />
      )}
    </main>
  );
}

function Results({
  result,
  error,
  busy,
  quest,
}: {
  result: (JudgeResponse & { mode: "run" | "submit" }) | null;
  error: string | null;
  busy: "run" | "submit" | "hint" | null;
  quest: PublicQuest;
}) {
  const box = "panel max-h-[34%] min-h-[130px] overflow-y-auto !rounded-[22px] p-5";

  if (error) {
    return (
      <div className={box} role="alert">
        <p className="text-sm text-berry-deep">{error}</p>
      </div>
    );
  }
  if (!result) {
    return (
      <div className={box}>
        <p className="font-serif italic text-muted">
          {busy
            ? "Counting berries…"
            : `Run your code against ${quest.visibleTests.length} visible tests, or submit to be judged on all ${
                quest.visibleTests.length + quest.hiddenTestCount
              }.`}
        </p>
      </div>
    );
  }

  const ok = result.status === "accepted";
  const headline = ok
    ? result.mode === "submit"
      ? "Accepted. Every test passed!"
      : `All ${result.total} visible tests passed. Submit to try the hidden ones.`
    : result.status === "wrong_answer"
      ? `${result.passed} of ${result.total} tests passed`
      : result.status === "compile_error"
        ? "Your code couldn't be loaded"
        : result.status === "time_limit"
          ? "Time limit exceeded"
          : "Runtime error";

  return (
    <div className={box} aria-live="polite">
      <div className="flex items-baseline justify-between gap-3">
        <p className={`font-serif text-lg italic ${ok ? "text-leaf" : "text-berry-deep"}`}>{headline}</p>
        <span className="shrink-0 text-xs text-muted">
          {result.mode === "submit" ? "Submitted" : "Test run"} · {result.runtimeMs}ms
        </span>
      </div>

      {result.message && !ok && (
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-berry-soft/60 px-3 py-2 font-mono text-[0.78rem] text-berry-deep">
          {result.message}
        </pre>
      )}

      {result.cases.length > 0 && (
        <ul className="mt-3 space-y-2">
          {result.cases.map((c) => (
            <CaseRow key={c.index} c={c} fn={quest.fn} />
          ))}
        </ul>
      )}
    </div>
  );
}

function CaseRow({ c, fn }: { c: CaseResult; fn: string }) {
  return (
    <li
      className={`rounded-2xl border px-3.5 py-2.5 text-[0.8rem] ${
        c.passed ? "border-leaf/30 bg-leaf/8" : "border-berry/30 bg-berry-soft/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-white ${
            c.passed ? "bg-leaf" : "bg-berry"
          }`}
        >
          {c.passed ? <CheckIcon size={12} /> : <span className="text-[0.7rem] font-bold leading-none">×</span>}
        </span>
        <span className="font-medium">
          {c.hidden ? `Hidden test ${c.index + 1}` : `Test ${c.index + 1}`}
        </span>
        {c.hidden && <span className="text-muted">{c.passed ? "passed" : "failed"}</span>}
      </div>

      {!c.hidden && c.args && (
        <div className="mt-2 space-y-0.5 font-mono text-[0.76rem] leading-relaxed">
          <div className="break-all">
            <span className="text-muted">call&nbsp;&nbsp;&nbsp;&nbsp;</span>
            {fn}({c.args.map((a) => fmt(a)).join(", ")})
          </div>
          {!c.passed && (
            <>
              <div className="break-all">
                <span className="text-muted">expect&nbsp;&nbsp;</span>
                <span className="text-leaf">{fmt(c.expected)}</span>
              </div>
              <div className="break-all">
                <span className="text-muted">got&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                <span className="text-berry-deep">{c.error ?? fmt(c.actual)}</span>
              </div>
            </>
          )}
          {c.logs && (
            <div className="mt-1 whitespace-pre-wrap break-all rounded-lg bg-ink/5 px-2 py-1 text-muted">
              {c.logs}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
