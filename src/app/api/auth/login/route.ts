import { z } from "zod";
import { collections } from "@/lib/db";
import {
  DUMMY_HASH,
  createSession,
  toPublicUser,
  verifyPassword,
} from "@/lib/auth";
import { clientIp, fail, parseBody, rateLimited } from "@/server/http";

const schema = z.object({
  identifier: z.string().trim().min(1, "Enter your username or email."),
  password: z.string().min(1, "Enter your password.").max(200),
});

export async function POST(req: Request) {
  if (rateLimited(`login:${clientIp(req)}`, 15, 10 * 60_000)) {
    return fail("Too many attempts. Try again in a few minutes.", 429);
  }
  const body = await parseBody(req, schema);
  if ("error" in body) return body.error;
  const { identifier, password } = body.data;

  const { users } = await collections();
  const user = await users.findOne(
    identifier.includes("@")
      ? { email: identifier.toLowerCase() }
      : { usernameLower: identifier.toLowerCase() },
  );

  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return fail("Wrong username/email or password.", 401);

  await createSession(user._id);
  return Response.json({ user: toPublicUser(user) });
}
