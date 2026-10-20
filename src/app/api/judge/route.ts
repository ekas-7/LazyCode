import { z } from "zod";
import { collections } from "@/lib/db";
import { getCurrentUser, toPublicUser } from "@/lib/auth";
import { levelForXp, nextStreak, utcDay } from "@/lib/game";
import { judge } from "@/server/judge";
import { getQuestAccess } from "@/server/queries";
import { fail, parseBody, rateLimited } from "@/server/http";
import type { JudgeResponse, UserDoc } from "@/lib/types";

const schema = z.object({
  slug: z.string().min(1).max(80),
  code: z.string().max(20_000, "Solution is too long."),
  mode: z.enum(["run", "submit"]),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("Sign in to run your code.", 401);

  const body = await parseBody(req, schema);
  if ("error" in body) return body.error;
  const { slug, code, mode } = body.data;

  if (rateLimited(`judge:${user._id}`, 20, 60_000)) {
    return fail("Easy there! Take a breath and try again in a moment.", 429);
  }

  const access = await getQuestAccess(user._id, slug);
  if (!access) return fail("Quest not found.", 404);
  if (!access.unlocked) return fail("This quest is still locked.", 403);
  const { problem } = access;

  const result = await judge(problem, code, mode);
  const { progress, submissions, users, problems } = await collections();
  const progressId = `${user._id}:${slug}`;
  const now = new Date();

  await progress.updateOne(
    { _id: progressId },
    {
      $set: { code, updatedAt: now },
      $inc: { attempts: mode === "submit" ? 1 : 0 },
      $setOnInsert: {
        userId: user._id,
        slug,
        hintsUsed: 0,
        solved: false,
      },
    },
    { upsert: true },
  );

  const response: JudgeResponse = { ...result };

  if (mode === "submit") {
    await submissions.insertOne({
      userId: user._id,
      slug,
      status: result.status,
      passed: result.passed,
      total: result.total,
      runtimeMs: result.runtimeMs,
      createdAt: now,
    });

    if (result.status === "accepted") {
      // Atomic claim: only the request that flips solved false -> true pays out.
      const claim = await progress.updateOne(
        { _id: progressId, solved: false },
        { $set: { solved: true, solvedAt: now } },
      );

      if (claim.modifiedCount === 1) {
        const today = utcDay(now);
        const fresh = (await users.findOne({ _id: user._id })) as UserDoc;
        const streak = nextStreak(fresh.streak, fresh.lastSolvedDay, today);

        const updated = await users.findOneAndUpdate(
          { _id: user._id },
          {
            $inc: { xp: problem.xp, berries: problem.berries },
            $set: { streak, lastSolvedDay: today },
          },
          { returnDocument: "after" },
        );

        const before = levelForXp(fresh.xp);
        const after = levelForXp(updated?.xp ?? fresh.xp + problem.xp);
        const next = await problems.findOne(
          { order: { $gt: problem.order } },
          { sort: { order: 1 }, projection: { _id: 1 } },
        );

        response.reward = {
          xp: problem.xp,
          berries: problem.berries,
          levelUp: after > before,
          newLevel: after,
          streak,
          nextSlug: next?._id ?? null,
        };
        if (updated) response.user = toPublicUser(updated);
      }
    }
  }

  return Response.json(response);
}
