import { MongoClient, type Db } from "mongodb";
import type {
  ProblemDoc,
  ProgressDoc,
  RegionDoc,
  SubmissionDoc,
  UserDoc,
} from "./types";

const uri = process.env.MONGODB_URI;

interface Cache {
  client?: Promise<MongoClient>;
  indexes?: Promise<void>;
}

// Reuse the connection across hot reloads in dev (and across requests in prod).
const globalCache = globalThis as unknown as { __berryMongo?: Cache };
const cache: Cache = (globalCache.__berryMongo ??= {});

function getClient(): Promise<MongoClient> {
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env.local and start MongoDB (docker compose up -d).",
    );
  }
  cache.client ??= new MongoClient(uri, { maxPoolSize: 10 })
    .connect()
    .catch((err) => {
      cache.client = undefined;
      throw err;
    });
  return cache.client;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  const db = client.db();
  cache.indexes ??= ensureIndexes(db).catch((err) => {
    cache.indexes = undefined;
    throw err;
  });
  await cache.indexes;
  return db;
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db
      .collection<UserDoc>("users")
      .createIndexes([
        { key: { usernameLower: 1 }, unique: true },
        { key: { email: 1 }, unique: true },
        { key: { xp: -1 } },
      ]),
    db
      .collection<ProgressDoc>("progress")
      .createIndexes([
        { key: { userId: 1, slug: 1 }, unique: true },
        { key: { userId: 1, solved: 1 } },
      ]),
    db
      .collection<SubmissionDoc>("submissions")
      .createIndexes([{ key: { userId: 1, createdAt: -1 } }]),
    db.collection<ProblemDoc>("problems").createIndexes([{ key: { order: 1 } }]),
    db.collection<RegionDoc>("regions").createIndexes([{ key: { order: 1 } }]),
  ]);
}

export async function collections() {
  const db = await getDb();
  return {
    users: db.collection<UserDoc>("users"),
    progress: db.collection<ProgressDoc>("progress"),
    submissions: db.collection<SubmissionDoc>("submissions"),
    problems: db.collection<ProblemDoc>("problems"),
    regions: db.collection<RegionDoc>("regions"),
  };
}

/** For scripts that need to exit cleanly. */
export async function closeDb() {
  if (cache.client) {
    const client = await cache.client;
    await client.close();
    cache.client = undefined;
    cache.indexes = undefined;
  }
}
