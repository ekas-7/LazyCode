/**
 * Runs every quest's reference solution (and its starter code) through the real
 * judge, to prove the hand-written expected outputs are right and the judge works.
 */
import { problems } from "../src/content/problems";
import { judge } from "../src/server/judge";
import { starterCode } from "../src/content/starter";

async function main() {
  let failures = 0;

  for (const p of problems) {
    const doc = {
      fn: p.fn,
      tests: p.tests,
      orderInsensitive: p.orderInsensitive,
    };

    const ref = await judge(doc, p.solution, "submit");
    const starter = await judge(doc, starterCode(p.fn, p.params), "submit");

    const refOk = ref.status === "accepted" && ref.passed === ref.total;
    const starterOk = starter.status !== "accepted";
    const hidden = p.tests.filter((t) => t.hidden).length;

    console.log(
      `${refOk && starterOk ? "ok  " : "FAIL"} ${p.slug.padEnd(24)} ` +
        `${ref.passed}/${ref.total} tests (${hidden} hidden) ${ref.runtimeMs}ms`,
    );
    if (!refOk) {
      failures++;
      console.log("  reference:", ref.status, ref.message ?? "");
      for (const c of ref.cases.filter((c) => !c.passed)) {
        console.log("  case", c.index, JSON.stringify(c));
      }
    }
    if (!starterOk) {
      failures++;
      console.log("  starter code unexpectedly passes!");
    }
  }

  if (failures) {
    console.error(`\n${failures} problem(s) failed verification`);
    process.exit(1);
  }
  console.log(`\nAll ${problems.length} quests verified.`);
}

main();
