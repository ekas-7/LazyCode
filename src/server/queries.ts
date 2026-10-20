import "server-only";
import { collections } from "@/lib/db";
import type {
  Difficulty,
  Example,
  ProblemDoc,
  QuestNode,
  RegionDoc,
  TestCase,
  UserDoc,
  WorldData,
} from "@/lib/types";

/** Everything the quest page needs. Hidden tests and unrevealed hints are stripped. */
export interface PublicQuest {
  slug: string;
  title: string;
  regionId: string;
  order: number;
  difficulty: Difficulty;
  tags: string[];
  story: string;
  description: string;
  examples: Example[];
  fn: string;
  starterCode: string;
  xp: number;
  berries: number;
  visibleTests: Pick<TestCase, "args" | "expected">[];
  hiddenTestCount: number;
  totalHints: number;
  revealedHints: string[];
  solved: boolean;
  /** The player's last saved code, if any. */
  savedCode: string | null;
}

export async function getWorld(userId: string | null): Promise<WorldData> {
  const { regions, problems, progress } = await collections();

  const [regionDocs, problemDocs, solvedDocs] = await Promise.all([
    regions.find().sort({ order: 1 }).toArray(),
    problems
      .find({}, { projection: { tests: 0, description: 0, examples: 0, starterCode: 0, hints: 0, story: 0 } })
      .sort({ order: 1 })
      .toArray(),
    userId
      ? progress.find({ userId, solved: true }, { projection: { slug: 1 } }).toArray()
      : Promise.resolve([]),
  ]);

  const solved = new Set(solvedDocs.map((d) => d.slug));
  let foundCurrent = false;

  const quests: QuestNode[] = problemDocs.map((p) => {
    let state: QuestNode["state"];
    if (solved.has(p._id)) state = "solved";
    else if (!foundCurrent) {
      state = "current";
      foundCurrent = true;
    } else state = "locked";

    return {
      slug: p._id,
      title: p.title,
      regionId: p.regionId,
      order: p.order,
      difficulty: p.difficulty,
      xp: p.xp,
      berries: p.berries,
      tags: p.tags,
      state,
    };
  });

  return { regions: regionDocs, quests };
}

/**
 * A quest is playable once every earlier quest on the journey is solved.
 * Returns null when the quest doesn't exist.
 */
export async function getQuestAccess(
  userId: string,
  slug: string,
): Promise<{ problem: ProblemDoc; unlocked: boolean } | null> {
  const { problems, progress } = await collections();
  const problem = await problems.findOne({ _id: slug });
  if (!problem) return null;

  const earlier = await problems
    .find({ order: { $lt: problem.order } }, { projection: { _id: 1 } })
    .toArray();
  const solvedCount = earlier.length
    ? await progress.countDocuments({
        userId,
        solved: true,
        slug: { $in: earlier.map((e) => e._id) },
      })
    : 0;

  return { problem, unlocked: solvedCount === earlier.length };
}

export async function getPublicQuest(
  userId: string,
  slug: string,
): Promise<{ quest: PublicQuest; unlocked: boolean } | null> {
  const access = await getQuestAccess(userId, slug);
  if (!access) return null;
  const { problem, unlocked } = access;
  const { progress } = await collections();
  const prog = await progress.findOne({ _id: `${userId}:${slug}` });

  const visible = problem.tests.filter((t) => !t.hidden);
  const hintsUsed = prog?.hintsUsed ?? 0;

  return {
    unlocked,
    quest: {
      slug: problem._id,
      title: problem.title,
      regionId: problem.regionId,
      order: problem.order,
      difficulty: problem.difficulty,
      tags: problem.tags,
      story: problem.story,
      description: problem.description,
      examples: problem.examples,
      fn: problem.fn,
      starterCode: problem.starterCode,
      xp: problem.xp,
      berries: problem.berries,
      visibleTests: visible.map((t) => ({ args: t.args, expected: t.expected })),
      hiddenTestCount: problem.tests.length - visible.length,
      totalHints: problem.hints.length,
      revealedHints: problem.hints.slice(0, hintsUsed),
      solved: prog?.solved ?? false,
      savedCode: prog?.code ?? null,
    },
  };
}

export async function getRegion(id: string): Promise<RegionDoc | null> {
  const { regions } = await collections();
  return regions.findOne({ _id: id });
}

export interface LeaderboardEntry {
  username: string;
  xp: number;
  streak: number;
  solved: number;
}

export async function getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const { users, progress } = await collections();
  const top = await users
    .find({}, { projection: { username: 1, xp: 1, streak: 1 } })
    .sort({ xp: -1, createdAt: 1 })
    .limit(limit)
    .toArray();

  const counts = await progress
    .aggregate<{ _id: string; n: number }>([
      { $match: { solved: true, userId: { $in: top.map((u) => u._id) } } },
      { $group: { _id: "$userId", n: { $sum: 1 } } },
    ])
    .toArray();
  const byUser = new Map(counts.map((c) => [c._id, c.n]));

  return top.map((u) => ({
    username: u.username,
    xp: u.xp,
    streak: u.streak,
    solved: byUser.get(u._id) ?? 0,
  }));
}

export async function getProfile(user: UserDoc) {
  const { progress, problems } = await collections();
  const [solvedDocs, allProblems] = await Promise.all([
    progress
      .find({ userId: user._id, solved: true })
      .sort({ solvedAt: -1 })
      .toArray(),
    problems
      .find({}, { projection: { title: 1, regionId: 1, difficulty: 1, xp: 1 } })
      .toArray(),
  ]);
  const byId = new Map(allProblems.map((p) => [p._id, p]));
  const solvedSlugs = new Set(solvedDocs.map((d) => d.slug));

  const regionTotals = new Map<string, { total: number; solved: number }>();
  for (const p of allProblems) {
    const r = regionTotals.get(p.regionId) ?? { total: 0, solved: 0 };
    r.total++;
    if (solvedSlugs.has(p._id)) r.solved++;
    regionTotals.set(p.regionId, r);
  }

  return {
    solvedCount: solvedDocs.length,
    totalQuests: allProblems.length,
    regionTotals: Object.fromEntries(regionTotals),
    clearedRegions: [...regionTotals.values()].filter((r) => r.solved === r.total).length,
    totalRegions: regionTotals.size,
    recent: solvedDocs.slice(0, 8).flatMap((d) => {
      const p = byId.get(d.slug);
      return p
        ? [
            {
              slug: d.slug,
              title: p.title,
              difficulty: p.difficulty,
              xp: p.xp,
              solvedAt: d.solvedAt?.toISOString() ?? null,
            },
          ]
        : [];
    }),
  };
}
