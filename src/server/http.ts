import "server-only";
import { z } from "zod";

export function fail(message: string, status = 400, extra?: object) {
  return Response.json({ error: message, ...extra }, { status });
}

export async function parseBody<S extends z.ZodType>(
  req: Request,
  schema: S,
): Promise<{ data: z.infer<S> } | { error: Response }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { error: fail("Request body must be valid JSON.") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: fail(first?.message ?? "Invalid request.", 422) };
  }
  return { data: parsed.data };
}

/** Very small in-memory limiter: allow `limit` hits per `windowMs` per key. */
const hits = new Map<string, number[]>();
export function rateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return false;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}
