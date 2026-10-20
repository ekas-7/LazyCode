import { z } from "zod";
import { collections } from "@/lib/db";
import { getCurrentUser, toPublicUser } from "@/lib/auth";
import { HINT_COST } from "@/lib/game";
import { getQuestAccess } from "@/server/queries";
import { fail, parseBody } from "@/server/http";

const schema = z.object({ slug: z.string().min(1).max(80) });

/** Reveal the next hint for a quest. Costs berries unless the quest is already solved. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("Sign in first.", 401);

  const body = await parseBody(req, schema);
  if ("error" in body) return body.error;
  const { slug } = body.data;

  const access = await getQuestAccess(user._id, slug);
  if (!access) return fail("Quest not found.", 404);
  if (!access.unlocked) return fail("This quest is still locked.", 403);
  const { problem } = access;

  const { progress, users } = await collections();
  const progressId = `${user._id}:${slug}`;

  await progress.updateOne(
    { _id: progressId },
    {
      $setOnInsert: {
        userId: user._id,
        slug,
        attempts: 0,
        hintsUsed: 0,
        solved: false,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
  const current = (await progress.findOne({ _id: progressId }))!;

  if (current.hintsUsed >= problem.hints.length) {
    return fail("No more hints. You've got this!", 409);
  }

  const free = current.solved;
  if (!free) {
    const paid = await users.updateOne(
      { _id: user._id, berries: { $gte: HINT_COST } },
      { $inc: { berries: -HINT_COST } },
    );
    if (paid.modifiedCount !== 1) {
      return fail(`A hint costs ${HINT_COST} berries. Solve a quest to earn more!`, 402);
    }
  }

  // Guard against two concurrent requests revealing the same hint twice.
  const bumped = await progress.updateOne(
    { _id: progressId, hintsUsed: current.hintsUsed },
    { $inc: { hintsUsed: 1 } },
  );
  if (bumped.modifiedCount !== 1) {
    if (!free) {
      await users.updateOne({ _id: user._id }, { $inc: { berries: HINT_COST } });
    }
    return fail("Hint was already revealed. Refresh and try again.", 409);
  }

  const updated = await users.findOne({ _id: user._id });
  return Response.json({
    hint: problem.hints[current.hintsUsed],
    index: current.hintsUsed,
    remaining: problem.hints.length - current.hintsUsed - 1,
    user: updated ? toPublicUser(updated) : undefined,
  });
}
