export type Difficulty = "easy" | "medium" | "hard";

export interface TestCase {
  /** Arguments passed to the solution function, in order. */
  args: unknown[];
  expected: unknown;
  /** Hidden cases are only evaluated on Submit and never sent to the browser. */
  hidden?: boolean;
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

/** A region of the world map (a chapter of the journey). */
export interface RegionDoc {
  _id: string; // slug
  name: string;
  tagline: string;
  story: string;
  order: number;
  /** Position of the island on the 3D map (x, z). */
  position: [number, number];
  /** Primary ground colour for the island. */
  color: string;
  accent: string;
  scenery: "meadow" | "woods" | "hills" | "lake" | "peak";
}

/** A quest = a coding problem placed on the map. */
export interface ProblemDoc {
  _id: string; // slug
  title: string;
  regionId: string;
  /** Global position in the journey (1-based, strictly increasing). */
  order: number;
  difficulty: Difficulty;
  tags: string[];
  story: string;
  description: string;
  examples: Example[];
  /** Name of the function the player must implement. */
  fn: string;
  starterCode: string;
  hints: string[];
  tests: TestCase[];
  /** When true, arrays are compared ignoring order (e.g. multiple valid answers). */
  orderInsensitive?: boolean;
  xp: number;
  berries: number;
}

export interface UserDoc {
  _id: string; // uuid
  username: string;
  usernameLower: string;
  email: string;
  passwordHash: string;
  xp: number;
  berries: number;
  streak: number;
  /** YYYY-MM-DD (UTC) of the last day a quest was solved. */
  lastSolvedDay: string | null;
  createdAt: Date;
}

export interface ProgressDoc {
  _id: string; // `${userId}:${slug}`
  userId: string;
  slug: string;
  attempts: number;
  hintsUsed: number;
  solved: boolean;
  solvedAt?: Date;
  /** Last code the player wrote, so the editor can restore it. */
  code?: string;
  updatedAt: Date;
}

export interface SubmissionDoc {
  userId: string;
  slug: string;
  status: SubmissionStatus;
  passed: number;
  total: number;
  runtimeMs: number;
  createdAt: Date;
}

export type SubmissionStatus =
  | "accepted"
  | "wrong_answer"
  | "runtime_error"
  | "time_limit"
  | "compile_error";

/* ---------- Shapes sent to the browser ---------- */

export interface PublicUser {
  id: string;
  username: string;
  xp: number;
  berries: number;
  streak: number;
}

export type QuestState = "locked" | "current" | "solved";

export interface QuestNode {
  slug: string;
  title: string;
  regionId: string;
  order: number;
  difficulty: Difficulty;
  xp: number;
  berries: number;
  state: QuestState;
  tags: string[];
}

export interface WorldData {
  regions: RegionDoc[];
  quests: QuestNode[];
}

export interface CaseResult {
  index: number;
  passed: boolean;
  hidden: boolean;
  /** Only populated for visible cases. */
  args?: unknown[];
  expected?: unknown;
  actual?: unknown;
  error?: string;
  logs?: string;
}

export interface JudgeResponse {
  status: SubmissionStatus;
  passed: number;
  total: number;
  runtimeMs: number;
  message?: string;
  cases: CaseResult[];
  /** Present only on the first accepted submission of a quest. */
  reward?: {
    xp: number;
    berries: number;
    levelUp: boolean;
    newLevel: number;
    streak: number;
    nextSlug: string | null;
  };
  user?: PublicUser;
}
