import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { collections } from "./db";
import type { PublicUser, UserDoc } from "./types";

const COOKIE = "bq_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set (16+ chars) in production.");
    }
    return new TextEncoder().encode("dev-only-insecure-secret-change-me");
  }
  return new TextEncoder().encode(secret);
}

/** Compared against when a user is unknown, so response time doesn't reveal which accounts exist. */
export const DUMMY_HASH = bcrypt.hashSync(crypto.randomUUID(), 10);

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function toPublicUser(user: UserDoc): PublicUser {
  return {
    id: user._id,
    username: user.username,
    xp: user.xp,
    berries: user.berries,
    streak: user.streak,
  };
}

export async function createSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

async function readUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** The signed-in user (full document), or null. */
export async function getCurrentUser(): Promise<UserDoc | null> {
  const id = await readUserId();
  if (!id) return null;
  const { users } = await collections();
  return users.findOne({ _id: id });
}
