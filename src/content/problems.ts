import "server-only";
import type { Difficulty, Example, TestCase } from "@/lib/types";

export interface ProblemSeed {
  slug: string;
  title: string;
  regionId: string;
  difficulty: Difficulty;
  tags: string[];
  story: string;
  description: string;
  examples: Example[];
  fn: string;
  /** Parameter list shown in the starter code, e.g. "nums, target". */
  params: string;
  hints: string[];
  tests: TestCase[];
  orderInsensitive?: boolean;
  /** Reference solution. Used by `npm run verify` to validate the tests. Never stored in the DB. */
  solution: string;
}

const REWARD: Record<Difficulty, { xp: number; berries: number }> = {
  easy: { xp: 20, berries: 10 },
  medium: { xp: 45, berries: 20 },
  hard: { xp: 80, berries: 40 },
};
export const rewardFor = (d: Difficulty) => REWARD[d];

const t = (args: unknown[], expected: unknown, hidden = false): TestCase => ({
  args,
  expected,
  hidden,
});
const h = (args: unknown[], expected: unknown) => t(args, expected, true);

/** Quests in journey order. The index in this array is the unlock order. */
export const problems: ProblemSeed[] = [
  /* ───────────── Strawberry Meadow ───────────── */
  {
    slug: "sum-the-berries",
    title: "Sum the Berries",
    regionId: "strawberry-meadow",
    difficulty: "easy",
    tags: ["array", "loop"],
    story:
      "The cafe owner left baskets of berries by the path. Each basket holds a different number. How many berries are there in total?",
    description:
      "Write `sumBerries(nums)` that returns the sum of all numbers in the array `nums`.\n\nAn empty array has a sum of `0`.",
    examples: [
      { input: "sumBerries([1, 2, 3])", output: "6" },
      { input: "sumBerries([])", output: "0" },
    ],
    fn: "sumBerries",
    params: "nums",
    hints: [
      "Start with a variable `total = 0`.",
      "Loop through the array and add each number to `total`, then return it.",
      "`for (const n of nums) total += n;`",
    ],
    tests: [
      t([[1, 2, 3]], 6),
      t([[]], 0),
      t([[-1, 5, 10]], 14),
      t([[100]], 100),
      h([[1, 1, 1, 1, 1, 1, 1, 1, 1, 1]], 10),
      h([[-5, -5]], -10),
    ],
    solution: `function sumBerries(nums){ let s=0; for(const n of nums) s+=n; return s; }`,
  },
  {
    slug: "biggest-berry",
    title: "The Biggest Berry",
    regionId: "strawberry-meadow",
    difficulty: "easy",
    tags: ["array", "loop"],
    story:
      "A contest is on! Every berry has a size, and the biggest one wins a little golden ribbon.",
    description:
      "Write `biggestBerry(sizes)` that returns the largest number in the non-empty array `sizes`.",
    examples: [
      { input: "biggestBerry([3, 9, 2])", output: "9" },
      { input: "biggestBerry([-4, -2, -8])", output: "-2" },
    ],
    fn: "biggestBerry",
    params: "sizes",
    hints: [
      "Don't start your 'best so far' at 0, the numbers can be negative.",
      "Start with the first element, then compare each remaining element to it.",
    ],
    tests: [
      t([[3, 9, 2]], 9),
      t([[-4, -2, -8]], -2),
      t([[7]], 7),
      h([[1, 5, 5, 2]], 5),
      h([[0, -1]], 0),
      h([[10, 20, 30, 40, 50]], 50),
    ],
    solution: `function biggestBerry(a){ let m=a[0]; for(const x of a) if(x>m) m=x; return m; }`,
  },
  {
    slug: "berry-fizzbuzz",
    title: "Fizz Buzz Basket",
    regionId: "strawberry-meadow",
    difficulty: "easy",
    tags: ["math", "loop", "classic"],
    story:
      "The bees in the meadow hum a counting song. Every third beat is a 'Fizz' and every fifth beat is a 'Buzz'.",
    description:
      "Write `berryFizzBuzz(n)` that returns an array of strings for the numbers `1` to `n`:\n\n- `\"FizzBuzz\"` if the number is divisible by both 3 and 5\n- `\"Fizz\"` if divisible by 3\n- `\"Buzz\"` if divisible by 5\n- otherwise the number itself as a string\n\nIf `n` is `0`, return an empty array.",
    examples: [
      {
        input: "berryFizzBuzz(5)",
        output: '["1","2","Fizz","4","Buzz"]',
      },
    ],
    fn: "berryFizzBuzz",
    params: "n",
    hints: [
      "The remainder operator `%` tells you if a number divides evenly.",
      "Check the 'both' case (`i % 15 === 0`) first, or you'll never reach it.",
    ],
    tests: [
      t([1], ["1"]),
      t([5], ["1", "2", "Fizz", "4", "Buzz"]),
      t(
        [15],
        [
          "1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz",
          "11", "Fizz", "13", "14", "FizzBuzz",
        ],
      ),
      h([0], []),
      h([3], ["1", "2", "Fizz"]),
    ],
    solution: `function berryFizzBuzz(n){ const r=[]; for(let i=1;i<=n;i++){ r.push(i%15===0?'FizzBuzz':i%3===0?'Fizz':i%5===0?'Buzz':String(i)); } return r; }`,
  },
  {
    slug: "shy-berries",
    title: "Shy Berries",
    regionId: "strawberry-meadow",
    difficulty: "easy",
    tags: ["array", "two-pointers"],
    story:
      "Some berries are shy and hide behind the others. Gently nudge every zero to the back of the line without upsetting the order of the rest.",
    description:
      "Write `moveZeroes(nums)` that returns an array with all `0`s moved to the end, keeping the relative order of the non-zero numbers.",
    examples: [
      { input: "moveZeroes([0, 1, 0, 3, 12])", output: "[1,3,12,0,0]" },
    ],
    fn: "moveZeroes",
    params: "nums",
    hints: [
      "Collect the non-zero values first, then fill the rest with zeros.",
      "For an extra challenge: keep a 'write' index and swap in place as you scan.",
    ],
    tests: [
      t([[0, 1, 0, 3, 12]], [1, 3, 12, 0, 0]),
      t([[0]], [0]),
      t([[1, 2]], [1, 2]),
      h([[0, 0, 1]], [1, 0, 0]),
      h([[4, 0, 5, 0, 6]], [4, 5, 6, 0, 0]),
      h([[]], []),
    ],
    solution: `function moveZeroes(a){ const nz=a.filter(x=>x!==0); while(nz.length<a.length) nz.push(0); return nz; }`,
  },

  /* ───────────── Whispering Woods ───────────── */
  {
    slug: "tidy-palindrome",
    title: "The Tidy Palindrome",
    regionId: "whispering-woods",
    difficulty: "easy",
    tags: ["string", "two-pointers"],
    story:
      "A signpost at the forest edge reads the same forwards and backwards, if you ignore the spaces and punctuation, of course.",
    description:
      "Write `isPalindrome(s)` that returns `true` if `s` reads the same forwards and backwards after you remove every character that isn't a letter or digit and ignore upper/lower case.\n\nAn empty (or all-punctuation) string counts as a palindrome.",
    examples: [
      {
        input: 'isPalindrome("A man, a plan, a canal: Panama")',
        output: "true",
      },
      { input: 'isPalindrome("race a car")', output: "false" },
    ],
    fn: "isPalindrome",
    params: "s",
    hints: [
      "First build a cleaned-up string: lower-case, letters and digits only (`/[a-z0-9]/`).",
      "Then compare it with its reverse, or walk two pointers inwards.",
    ],
    tests: [
      t(["A man, a plan, a canal: Panama"], true),
      t(["race a car"], false),
      t([" "], true),
      h(["0P"], false),
      h(["Was it a car or a cat I saw?"], true),
      h(["ab"], false),
      h(["a."], true),
    ],
    solution: `function isPalindrome(s){ const c=s.toLowerCase().replace(/[^a-z0-9]/g,''); return c===c.split('').reverse().join(''); }`,
  },
  {
    slug: "count-the-vowels",
    title: "Count the Vowels",
    regionId: "whispering-woods",
    difficulty: "easy",
    tags: ["string", "counting"],
    story:
      "The owls of the woods only speak in vowels. Help the young owl count how many it hears in each word.",
    description:
      "Write `countVowels(s)` that returns how many vowels (`a e i o u`, upper or lower case) appear in `s`.",
    examples: [
      { input: 'countVowels("Strawberry")', output: "2" },
      { input: 'countVowels("AEIOU")', output: "5" },
    ],
    fn: "countVowels",
    params: "s",
    hints: [
      "Convert to lower case so you only compare against `aeiou`.",
      "`'aeiou'.includes(ch)` is a quick membership check.",
    ],
    tests: [
      t(["Strawberry"], 2),
      t(["AEIOU"], 5),
      t([""], 0),
      h(["rhythm"], 0),
      h(["Whispering Woods"], 5),
      h(["queue"], 4),
    ],
    solution: `function countVowels(s){ let c=0; for(const ch of s.toLowerCase()) if('aeiou'.includes(ch)) c++; return c; }`,
  },
  {
    slug: "reverse-the-words",
    title: "Reverse the Words",
    regionId: "whispering-woods",
    difficulty: "easy",
    tags: ["string", "split"],
    story:
      "A mischievous breeze has swapped the order of the words on the trail markers. Put them right.",
    description:
      "Write `reverseWords(s)` that returns the words of `s` in reverse order, separated by a single space.\n\nIgnore leading, trailing and repeated spaces in the input.",
    examples: [
      { input: 'reverseWords("the sky is blue")', output: '"blue is sky the"' },
      { input: 'reverseWords("  hello world  ")', output: '"world hello"' },
    ],
    fn: "reverseWords",
    params: "s",
    hints: [
      "`s.trim().split(/\\s+/)` splits on any run of whitespace.",
      "Beware: splitting an empty string gives `['']`. The result for `\"\"` should be `\"\"`.",
    ],
    tests: [
      t(["the sky is blue"], "blue is sky the"),
      t(["  hello world  "], "world hello"),
      t(["a good   example"], "example good a"),
      h(["single"], "single"),
      h([""], ""),
    ],
    solution: `function reverseWords(s){ const w=s.trim().split(/\\s+/).filter(Boolean); return w.reverse().join(' '); }`,
  },
  {
    slug: "whispering-twins",
    title: "Whispering Twins",
    regionId: "whispering-woods",
    difficulty: "easy",
    tags: ["string", "hash-map", "sorting"],
    story:
      "Two saplings whisper to each other using exactly the same letters, just in a different order. Are they twins?",
    description:
      "Write `isAnagram(a, b)` that returns `true` if `b` can be formed by rearranging the letters of `a` (using every letter exactly once). Comparison is case-sensitive.",
    examples: [
      { input: 'isAnagram("listen", "silent")', output: "true" },
      { input: 'isAnagram("rat", "car")', output: "false" },
    ],
    fn: "isAnagram",
    params: "a, b",
    hints: [
      "If the lengths differ, they can't be anagrams.",
      "Count letters of `a`, then subtract the letters of `b`. Everything should end at zero.",
    ],
    tests: [
      t(["listen", "silent"], true),
      t(["rat", "car"], false),
      t(["a", "ab"], false),
      h(["anagram", "nagaram"], true),
      h(["", ""], true),
      h(["aacc", "ccac"], false),
    ],
    solution: `function isAnagram(a,b){ if(a.length!==b.length) return false; const m={}; for(const c of a) m[c]=(m[c]||0)+1; for(const c of b){ if(!m[c]) return false; m[c]--; } return true; }`,
  },

  /* ───────────── Honey Hills ───────────── */
  {
    slug: "two-berry-sum",
    title: "Two Berry Sum",
    regionId: "honey-hills",
    difficulty: "easy",
    tags: ["array", "hash-map", "classic"],
    story:
      "The bees want to make a jar of exactly the right weight. Find the two berries whose weights add up to the target.",
    description:
      "Write `twoSum(nums, target)` that returns the indices `[i, j]` (with `i < j`) of the two numbers in `nums` that add up to `target`.\n\nExactly one valid pair exists, and you may not use the same element twice.",
    examples: [
      {
        input: "twoSum([2, 7, 11, 15], 9)",
        output: "[0, 1]",
        explanation: "2 + 7 = 9",
      },
    ],
    fn: "twoSum",
    params: "nums, target",
    orderInsensitive: true,
    hints: [
      "Two nested loops work, but they're slow for big arrays.",
      "Remember the numbers you've already seen in a `Map` (value → index).",
      "For each `n`, check whether `target - n` is already in the map.",
    ],
    tests: [
      t([[2, 7, 11, 15], 9], [0, 1]),
      t([[3, 2, 4], 6], [1, 2]),
      t([[3, 3], 6], [0, 1]),
      h([[-1, -2, -3, -4, -5], -8], [2, 4]),
      h([[0, 4, 3, 0], 0], [0, 3]),
      h([[1, 5, 9, 13], 22], [2, 3]),
    ],
    solution: `function twoSum(nums,target){ const m=new Map(); for(let i=0;i<nums.length;i++){ const need=target-nums[i]; if(m.has(need)) return [m.get(need),i]; m.set(nums[i],i); } return []; }`,
  },
  {
    slug: "double-berry",
    title: "The Double Berry",
    regionId: "honey-hills",
    difficulty: "easy",
    tags: ["array", "hash-set"],
    story:
      "Somebody planted two berries in the same pot! Check whether any value shows up more than once.",
    description:
      "Write `containsDuplicate(nums)` that returns `true` if any value appears at least twice in `nums`, and `false` if every element is distinct.",
    examples: [
      { input: "containsDuplicate([1, 2, 3, 1])", output: "true" },
      { input: "containsDuplicate([1, 2, 3, 4])", output: "false" },
    ],
    fn: "containsDuplicate",
    params: "nums",
    hints: [
      "A `Set` only stores each value once.",
      "Compare `new Set(nums).size` with `nums.length`.",
    ],
    tests: [
      t([[1, 2, 3, 1]], true),
      t([[1, 2, 3, 4]], false),
      t([[]], false),
      h([[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], true),
      h([[5]], false),
      h([[0, -1, 0]], true),
    ],
    solution: `function containsDuplicate(n){ return new Set(n).size!==n.length; }`,
  },
  {
    slug: "lonely-letter",
    title: "The Lonely Letter",
    regionId: "honey-hills",
    difficulty: "easy",
    tags: ["string", "hash-map"],
    story:
      "In a field of paired-up flowers, one letter stands alone. Find the first one with no twin.",
    description:
      "Write `firstUniqChar(s)` that returns the index of the first character in `s` that appears exactly once, or `-1` if there isn't one.",
    examples: [
      { input: 'firstUniqChar("leetcode")', output: "0" },
      { input: 'firstUniqChar("loveleetcode")', output: "2" },
      { input: 'firstUniqChar("aabb")', output: "-1" },
    ],
    fn: "firstUniqChar",
    params: "s",
    hints: [
      "Pass one: count every character.",
      "Pass two: return the first index whose count is 1.",
    ],
    tests: [
      t(["leetcode"], 0),
      t(["loveleetcode"], 2),
      t(["aabb"], -1),
      h(["z"], 0),
      h([""], -1),
      h(["abcabcd"], 6),
    ],
    solution: `function firstUniqChar(s){ const m={}; for(const c of s) m[c]=(m[c]||0)+1; for(let i=0;i<s.length;i++) if(m[s[i]]===1) return i; return -1; }`,
  },
  {
    slug: "hive-search",
    title: "Hive Search",
    regionId: "honey-hills",
    difficulty: "easy",
    tags: ["array", "binary-search", "classic"],
    story:
      "The beehives are numbered in sorted order. Rather than knock on every door, the queen bee halves the search each time.",
    description:
      "Write `binarySearch(nums, target)` that finds `target` in the **sorted** (ascending) array `nums` and returns its index, or `-1` if it isn't there.\n\nAim for O(log n) time, because the hidden tests include big hives.",
    examples: [
      { input: "binarySearch([-1, 0, 3, 5, 9, 12], 9)", output: "4" },
      { input: "binarySearch([-1, 0, 3, 5, 9, 12], 2)", output: "-1" },
    ],
    fn: "binarySearch",
    params: "nums, target",
    hints: [
      "Keep two pointers `lo` and `hi` around the part of the array that could still contain the target.",
      "Look at the middle: too small → move `lo` up, too big → move `hi` down.",
      "Loop while `lo <= hi` and use `Math.floor((lo + hi) / 2)`.",
    ],
    tests: [
      t([[-1, 0, 3, 5, 9, 12], 9], 4),
      t([[-1, 0, 3, 5, 9, 12], 2], -1),
      t([[5], 5], 0),
      h([[], 1], -1),
      h([[1, 3, 5, 7], 7], 3),
      h([[1, 3, 5, 7], 1], 0),
      h([[2, 4, 6, 8, 10, 12, 14], 10], 4),
    ],
    solution: `function binarySearch(a,x){ let lo=0,hi=a.length-1; while(lo<=hi){ const m=(lo+hi)>>1; if(a[m]===x) return m; if(a[m]<x) lo=m+1; else hi=m-1; } return -1; }`,
  },

  /* ───────────── Crystal Lake ───────────── */
  {
    slug: "matching-lily-pads",
    title: "Matching Lily Pads",
    regionId: "crystal-lake",
    difficulty: "medium",
    tags: ["string", "stack", "classic"],
    story:
      "Lily pads on the lake open with ( [ { and must close in the right order with ) ] }. A tangled pond makes the frogs grumpy.",
    description:
      "Write `isValid(s)` for a string containing only `()[]{}` characters. Return `true` if every opening bracket is closed by the same type of bracket, in the correct order.\n\nAn empty string is valid.",
    examples: [
      { input: 'isValid("()[]{}")', output: "true" },
      { input: 'isValid("(]")', output: "false" },
      { input: 'isValid("([)]")', output: "false" },
    ],
    fn: "isValid",
    params: "s",
    hints: [
      "The most recently opened bracket must be the first one closed. That's a stack.",
      "Push openers. On a closer, pop and check it matches. At the end the stack must be empty.",
    ],
    tests: [
      t(["()"], true),
      t(["()[]{}"], true),
      t(["(]"], false),
      h(["([)]"], false),
      h(["{[]}"], true),
      h([""], true),
      h(["(("], false),
      h(["]"], false),
    ],
    solution: `function isValid(s){ const st=[]; const p={')':'(',']':'[','}':'{'}; for(const c of s){ if(c==='('||c==='['||c==='{') st.push(c); else if(st.pop()!==p[c]) return false; } return st.length===0; }`,
  },
  {
    slug: "stepping-stones",
    title: "Stepping Stones",
    regionId: "crystal-lake",
    difficulty: "medium",
    tags: ["dp", "math", "classic"],
    story:
      "To cross the lake you can hop one stone or two stones at a time. How many different ways are there to reach the far shore?",
    description:
      "Write `climbStairs(n)` that returns the number of distinct ways to hop across `n` stones, taking 1 or 2 stones per hop.\n\n`n` is between 1 and 45. A naive recursive solution will be too slow, so try remembering your answers.",
    examples: [
      { input: "climbStairs(2)", output: "2", explanation: "1+1 or 2" },
      { input: "climbStairs(3)", output: "3", explanation: "1+1+1, 1+2, 2+1" },
    ],
    fn: "climbStairs",
    params: "n",
    hints: [
      "To land on stone `n` you came from `n-1` or `n-2`.",
      "So ways(n) = ways(n-1) + ways(n-2). Sounds familiar?",
      "Keep just the last two values in a loop. No recursion needed.",
    ],
    tests: [
      t([1], 1),
      t([2], 2),
      t([3], 3),
      t([5], 8),
      h([10], 89),
      h([20], 10946),
      h([45], 1836311903),
    ],
    solution: `function climbStairs(n){ let a=1,b=1; for(let i=2;i<=n;i++){ [a,b]=[b,a+b]; } return b; }`,
  },
  {
    slug: "best-berry-streak",
    title: "Best Berry Streak",
    regionId: "crystal-lake",
    difficulty: "medium",
    tags: ["array", "dp", "kadane"],
    story:
      "Some days of berry picking are great, others are rainy. Find the best stretch of consecutive days.",
    description:
      "Write `maxSubArray(nums)` that returns the largest sum of any non-empty contiguous slice of `nums`.",
    examples: [
      {
        input: "maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4])",
        output: "6",
        explanation: "The slice [4, -1, 2, 1] sums to 6.",
      },
    ],
    fn: "maxSubArray",
    params: "nums",
    hints: [
      "At each position, decide: extend the previous run, or start fresh here.",
      "`current = Math.max(n, current + n)`, and track the best `current` you've seen.",
    ],
    tests: [
      t([[-2, 1, -3, 4, -1, 2, 1, -5, 4]], 6),
      t([[1]], 1),
      t([[5, 4, -1, 7, 8]], 23),
      h([[-3, -2, -1]], -1),
      h([[-2, -1]], -1),
      h([[8, -19, 5, -4, 20]], 21),
    ],
    solution: `function maxSubArray(a){ let cur=a[0],best=a[0]; for(let i=1;i<a.length;i++){ cur=Math.max(a[i],cur+a[i]); best=Math.max(best,cur); } return best; }`,
  },
  {
    slug: "fewest-coins",
    title: "Fewest Coins",
    regionId: "crystal-lake",
    difficulty: "medium",
    tags: ["dp", "classic"],
    story:
      "The lake ferryman only accepts exact change. Using as few shiny coins as possible, can you pay the fare?",
    description:
      "Write `coinChange(coins, amount)` that returns the fewest coins needed to make exactly `amount`, using any number of each coin value. Return `-1` if it's impossible. An `amount` of `0` needs `0` coins.",
    examples: [
      {
        input: "coinChange([1, 2, 5], 11)",
        output: "3",
        explanation: "5 + 5 + 1",
      },
      { input: "coinChange([2], 3)", output: "-1" },
    ],
    fn: "coinChange",
    params: "coins, amount",
    hints: [
      "Greedy (always take the biggest coin) fails for some coin sets, like `[1, 3, 4]` and 6.",
      "Let `best[a]` be the fewest coins for amount `a`. Build it up from 0.",
      "`best[a] = min(best[a - coin] + 1)` over all coins that fit.",
    ],
    tests: [
      t([[1, 2, 5], 11], 3),
      t([[2], 3], -1),
      t([[1], 0], 0),
      h([[186, 419, 83, 408], 6249], 20),
      h([[1, 3, 4], 6], 2),
      h([[2, 5, 10, 1], 27], 4),
    ],
    solution: `function coinChange(coins,amount){ const d=new Array(amount+1).fill(Infinity); d[0]=0; for(let a=1;a<=amount;a++) for(const c of coins) if(c<=a && d[a-c]+1<d[a]) d[a]=d[a-c]+1; return d[amount]===Infinity?-1:d[amount]; }`,
  },

  /* ───────────── Dragon's Peak ───────────── */
  {
    slug: "merge-the-trails",
    title: "Merge the Trails",
    regionId: "dragons-peak",
    difficulty: "medium",
    tags: ["array", "sorting", "intervals"],
    story:
      "Mountain trails overlap on the map. Merge the ones that touch so the dragon's route is easy to read.",
    description:
      "Write `mergeIntervals(intervals)` where each interval is `[start, end]`. Merge all overlapping intervals (touching ends count as overlapping) and return the result sorted by start.",
    examples: [
      {
        input: "mergeIntervals([[1,3],[2,6],[8,10],[15,18]])",
        output: "[[1,6],[8,10],[15,18]]",
      },
      { input: "mergeIntervals([[1,4],[4,5]])", output: "[[1,5]]" },
    ],
    fn: "mergeIntervals",
    params: "intervals",
    hints: [
      "Sort the intervals by start first. Overlaps become neighbours.",
      "Compare each interval with the last merged one: if `start <= last.end`, extend `last.end`.",
    ],
    tests: [
      t([[[1, 3], [2, 6], [8, 10], [15, 18]]], [[1, 6], [8, 10], [15, 18]]),
      t([[[1, 4], [4, 5]]], [[1, 5]]),
      h([[[1, 4], [0, 4]]], [[0, 4]]),
      h([[[1, 4], [2, 3]]], [[1, 4]]),
      h([[[5, 6], [1, 2]]], [[1, 2], [5, 6]]),
      h([[]], []),
    ],
    solution: `function mergeIntervals(iv){ const s=iv.map(x=>[x[0],x[1]]).sort((a,b)=>a[0]-b[0]); const r=[]; for(const x of s){ const l=r[r.length-1]; if(l&&x[0]<=l[1]) l[1]=Math.max(l[1],x[1]); else r.push(x); } return r; }`,
  },
  {
    slug: "longest-fresh-path",
    title: "Longest Fresh Path",
    regionId: "dragons-peak",
    difficulty: "medium",
    tags: ["string", "sliding-window", "hash-map"],
    story:
      "Walk the ridge without stepping on any flower you've already seen. How long can your path be?",
    description:
      "Write `lengthOfLongestSubstring(s)` that returns the length of the longest substring of `s` that has no repeated characters.",
    examples: [
      {
        input: 'lengthOfLongestSubstring("abcabcbb")',
        output: "3",
        explanation: '"abc"',
      },
      { input: 'lengthOfLongestSubstring("bbbbb")', output: "1" },
    ],
    fn: "lengthOfLongestSubstring",
    params: "s",
    hints: [
      "Use a sliding window `[left, right]` that never contains duplicates.",
      "Store the last index where each character was seen. When you meet a repeat inside the window, jump `left` past it.",
      "Careful with `\"abba\"`: `left` must never move backwards.",
    ],
    tests: [
      t(["abcabcbb"], 3),
      t(["bbbbb"], 1),
      t(["pwwkew"], 3),
      h([""], 0),
      h(["dvdf"], 3),
      h(["abba"], 2),
      h(["abcdefghijklmnopqrstuvwxyz".repeat(400)], 26),
    ],
    solution: `function lengthOfLongestSubstring(s){ const m=new Map(); let l=0,b=0; for(let r=0;r<s.length;r++){ const c=s[r]; if(m.has(c)&&m.get(c)>=l) l=m.get(c)+1; m.set(c,r); b=Math.max(b,r-l+1); } return b; }`,
  },
  {
    slug: "dragons-rain-pools",
    title: "The Dragon's Rain Pools",
    regionId: "dragons-peak",
    difficulty: "hard",
    tags: ["array", "two-pointers", "classic"],
    story:
      "After the storm, rain collects between the rocky ridges. The dragon wants to know exactly how much water is waiting for him.",
    description:
      "Write `trap(height)` where `height[i]` is the height of a bar of width 1. Return how many units of water are trapped between the bars after it rains.",
    examples: [
      {
        input: "trap([0,1,0,2,1,0,1,3,2,1,2,1])",
        output: "6",
      },
      { input: "trap([4,2,0,3,2,5])", output: "9" },
    ],
    fn: "trap",
    params: "height",
    hints: [
      "Water above a bar = min(tallest bar to its left, tallest bar to its right) − its own height.",
      "Precompute `leftMax` and `rightMax` arrays, then sum the water for each index.",
      "Or use two pointers moving inwards, always advancing the side with the smaller max.",
    ],
    tests: [
      t([[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], 6),
      t([[4, 2, 0, 3, 2, 5]], 9),
      t([[]], 0),
      h([[3, 0, 3]], 3),
      h([[1, 2, 3]], 0),
      h([[5, 4, 1, 2]], 1),
    ],
    solution: `function trap(h){ let l=0,r=h.length-1,lm=0,rm=0,w=0; while(l<r){ if(h[l]<h[r]){ lm=Math.max(lm,h[l]); w+=lm-h[l]; l++; } else { rm=Math.max(rm,h[r]); w+=rm-h[r]; r--; } } return w; }`,
  },
];
