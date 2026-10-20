import { collections, closeDb } from "../src/lib/db";
import { regions } from "../src/content/regions";
import { problems, rewardFor } from "../src/content/problems";
import { starterCode } from "../src/content/starter";
import type { ProblemDoc } from "../src/lib/types";

async function main() {
  const { regions: regionsCol, problems: problemsCol } = await collections();

  const regionIds = new Set(regions.map((r) => r._id));
  const slugs = new Set<string>();

  const docs: ProblemDoc[] = problems.map((p, i) => {
    if (!regionIds.has(p.regionId)) {
      throw new Error(`Quest ${p.slug} references unknown region ${p.regionId}`);
    }
    if (slugs.has(p.slug)) throw new Error(`Duplicate quest slug ${p.slug}`);
    slugs.add(p.slug);
    const { solution: _solution, params, slug, ...rest } = p;
    void _solution;
    return {
      _id: slug,
      ...rest,
      order: i + 1,
      starterCode: starterCode(p.fn, params),
      ...rewardFor(p.difficulty),
    };
  });

  await Promise.all([
    regionsCol.bulkWrite(
      regions.map((r) => ({
        replaceOne: { filter: { _id: r._id }, replacement: r, upsert: true },
      })),
    ),
    problemsCol.bulkWrite(
      docs.map((d) => ({
        replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true },
      })),
    ),
  ]);

  const staleRegions = await regionsCol.deleteMany({
    _id: { $nin: [...regionIds] },
  });
  const staleProblems = await problemsCol.deleteMany({
    _id: { $nin: [...slugs] },
  });

  console.log(
    `Seeded ${regions.length} regions and ${docs.length} quests` +
      ` (removed ${staleRegions.deletedCount} regions, ${staleProblems.deletedCount} quests).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(closeDb);
