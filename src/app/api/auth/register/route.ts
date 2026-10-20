import { z } from "zod";
import { randomUUID } from "node:crypto";
import { collections } from "@/lib/db";
import { createSession, hashPassword, toPublicUser } from "@/lib/auth";
import { clientIp, fail, parseBody, rateLimited } from "@/server/http";
import type { UserDoc } from "@/lib/types";

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username needs at least 3 characters.")
    .max(20, "Username can be at most 20 characters.")
    .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers and underscores."),
  email: z.string().trim().toLowerCase().email("That email doesn't look right."),
  password: z
    .string()
    .min(8, "Password needs at least 8 characters.")
    .max(200),
});

export async function POST(req: Request) {
  if (rateLimited(`register:${clientIp(req)}`, 10, 10 * 60_000)) {
    return fail("Too many attempts. Try again in a few minutes.", 429);
  }
  const body = await parseBody(req, schema);
  if ("error" in body) return body.error;
  const { username, email, password } = body.data;

  const { users } = await collections();
  const user: UserDoc = {
    _id: randomUUID(),
    username,
    usernameLower: username.toLowerCase(),
    email,
    passwordHash: await hashPassword(password),
    xp: 0,
    berries: 25, // a little welcome basket
    streak: 0,
    lastSolvedDay: null,
    createdAt: new Date(),
  };

  try {
    await users.insertOne(user);
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      const key = Object.keys((err as { keyPattern?: object }).keyPattern ?? {})[0];
      return fail(
        key === "email"
          ? "That email is already registered."
          : "That username is taken.",
        409,
      );
    }
    throw err;
  }

  await createSession(user._id);
  return Response.json({ user: toPublicUser(user) }, { status: 201 });
}
