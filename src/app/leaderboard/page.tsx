import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { levelForXp, titleForLevel } from "@/lib/game";
import { getLeaderboard } from "@/server/queries";
import { BerryIcon, HeartIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Leaderboard" };

const MEDALS = ["#f2c14e", "#c9ced6", "#d9a273"];

async function Board() {
  await connection(); // render at request time, before any DB I/O
  const [entries, me] = await Promise.all([getLeaderboard(25), getCurrentUser()]);

  if (entries.length === 0) {
    return (
      <p className="py-10 text-center font-serif italic text-muted">
        Nobody has set out yet. Be the first!
      </p>
    );
  }

  return (
    <ol className="divide-y divide-line/70">
      {entries.map((e, i) => {
        const level = levelForXp(e.xp);
        const mine = me?.username === e.username;
        return (
          <li
            key={e.username}
            className={`flex items-center gap-4 px-3 py-3.5 sm:px-5 ${mine ? "rounded-2xl bg-berry-soft/50" : ""}`}
          >
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
              style={{ background: MEDALS[i] ?? "#e7d9cc", color: i < 3 ? "#fff" : "#8f7a6e" }}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-lg italic">
                {e.username}
                {mine && <span className="ml-2 text-xs not-italic text-berry">you</span>}
              </p>
              <p className="text-xs text-muted">
                Lv {level} · {titleForLevel(level)}
              </p>
            </div>
            <div className="hidden items-center gap-1.5 text-sm text-muted sm:flex">
              <BerryIcon size={16} /> {e.solved} solved
            </div>
            <div className="hidden items-center gap-1.5 text-sm text-muted sm:flex">
              <HeartIcon size={15} /> {e.streak}
            </div>
            <div className="w-20 text-right font-medium tabular-nums">
              <span className="text-berry">{e.xp.toLocaleString()}</span>{" "}
              <span className="text-[0.62rem] uppercase tracking-widest text-muted">xp</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function LeaderboardPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-8">
      <div className="mb-8 text-center">
        <h1 className="script text-[4.2rem]">Leaderboard</h1>
        <p className="eyebrow mt-2 !text-[0.6rem] text-muted">The most berries in the garden</p>
      </div>
      <div className="panel animate-float-up p-3 sm:p-5">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/40" />}>
          <Board />
        </Suspense>
      </div>
    </main>
  );
}
