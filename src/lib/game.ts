/** Pure game rules, shared by the server and the browser. */

const XP_PER_LEVEL_UNIT = 60;

/** Level n starts at 60 * (n-1)^2 XP: 0, 60, 240, 540, 960, ... */
export function levelForXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / XP_PER_LEVEL_UNIT)) + 1;
}

export function xpForLevel(level: number): number {
  return XP_PER_LEVEL_UNIT * (level - 1) ** 2;
}

export function levelProgress(xp: number) {
  const level = levelForXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  return {
    level,
    into: xp - floor,
    needed: ceil - floor,
    ratio: Math.min(1, (xp - floor) / (ceil - floor)),
  };
}

const TITLES = [
  "Seedling",
  "Sprout",
  "Berry Picker",
  "Meadow Walker",
  "Woodland Wanderer",
  "Honey Scout",
  "Lake Keeper",
  "Peak Climber",
  "Berry Sage",
  "Grand Gardener",
];

export function titleForLevel(level: number): string {
  return TITLES[Math.min(TITLES.length - 1, level - 1)];
}

export const HINT_COST = 5;

export function utcDay(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function previousUtcDay(day: string): string {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return utcDay(d);
}

/** Streak after solving a quest today, given the last day a quest was solved. */
export function nextStreak(
  current: number,
  lastSolvedDay: string | null,
  today: string,
): number {
  if (lastSolvedDay === today) return Math.max(1, current);
  if (lastSolvedDay === previousUtcDay(today)) return current + 1;
  return 1;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  earned: boolean;
}

export function computeBadges(input: {
  solvedCount: number;
  streak: number;
  level: number;
  clearedRegions: number;
  totalRegions: number;
}): Badge[] {
  const { solvedCount, streak, level, clearedRegions, totalRegions } = input;
  return [
    {
      id: "first-berry",
      name: "First Berry",
      description: "Solve your first quest",
      emoji: "🍓",
      earned: solvedCount >= 1,
    },
    {
      id: "basket-full",
      name: "Basket Full",
      description: "Solve 10 quests",
      emoji: "🧺",
      earned: solvedCount >= 10,
    },
    {
      id: "warm-heart",
      name: "Warm Heart",
      description: "Reach a 3 day streak",
      emoji: "💗",
      earned: streak >= 3,
    },
    {
      id: "growing",
      name: "Growing Strong",
      description: "Reach level 5",
      emoji: "🌱",
      earned: level >= 5,
    },
    {
      id: "region-cleared",
      name: "Trailblazer",
      description: "Clear an entire region",
      emoji: "🗺️",
      earned: clearedRegions >= 1,
    },
    {
      id: "journey-done",
      name: "Journey's End",
      description: "Clear every region",
      emoji: "🏔️",
      earned: totalRegions > 0 && clearedRegions >= totalRegions,
    },
  ];
}
