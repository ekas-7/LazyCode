import type { RegionDoc } from "@/lib/types";

/**
 * The map. Islands wind away from the starting meadow towards Dragon's Peak.
 * Add a region here (and quests in problems.ts) and run `npm run seed`.
 */
export const regions: RegionDoc[] = [
  {
    _id: "strawberry-meadow",
    name: "Strawberry Meadow",
    tagline: "Where every journey begins",
    story:
      "Warm grass, soft petals, and a little red-roofed cafe at the edge of the path. The berries here are shy but friendly. Learn to count, compare and tidy them.",
    order: 1,
    position: [0, 0],
    color: "#bfe3a0",
    accent: "#e8556a",
    scenery: "meadow",
  },
  {
    _id: "whispering-woods",
    name: "Whispering Woods",
    tagline: "Words, letters and quiet secrets",
    story:
      "The trees here murmur to each other in strings of letters. Listen closely and you can spot palindromes, vowels and secret twins.",
    order: 2,
    position: [19, -24],
    color: "#9fd3a6",
    accent: "#4f9d78",
    scenery: "woods",
  },
  {
    _id: "honey-hills",
    name: "Honey Hills",
    tagline: "Lookups, maps and searching",
    story:
      "Golden hills dotted with beehives. The bees remember everything, and they find what you need in a single hop.",
    order: 3,
    position: [-6, -50],
    color: "#f1dc9b",
    accent: "#e0a43a",
    scenery: "hills",
  },
  {
    _id: "crystal-lake",
    name: "Crystal Lake",
    tagline: "Stacks, patterns and stepping stones",
    story:
      "A mirror-still lake where lily pads open and close in pairs, and every stepping stone builds on the ones before it.",
    order: 4,
    position: [17, -76],
    color: "#bfe6e8",
    accent: "#4fa3b8",
    scenery: "lake",
  },
  {
    _id: "dragons-peak",
    name: "Dragon's Peak",
    tagline: "The final climb",
    story:
      "Above the clouds the air is thin and the puzzles are sharp. The sleepy dragon at the top only wakes for the cleverest solutions.",
    order: 5,
    position: [-4, -102],
    color: "#e6d3e8",
    accent: "#a469b8",
    scenery: "peak",
  },
];
