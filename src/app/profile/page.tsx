import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { computeBadges, levelProgress, titleForLevel } from "@/lib/game";
import { collections } from "@/lib/db";
import { getProfile } from "@/server/queries";
import { BerryIcon, HeartIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Journal" };

async function Journal() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  const [profile, { regions }] = await Promise.all([getProfile(user), collections()]);
  const regionDocs = await regions.find().sort({ order: 1 }).toArray();
  const lp = levelProgress(user.xp);
  const badges = computeBadges({
    solvedCount: profile.solvedCount,
    streak: user.streak,
    level: lp.level,
    clearedRegions: profile.clearedRegions,
    totalRegions: profile.totalRegions,
  });

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <section className="panel animate-float-up p-7 sm:p-9">
        <p className="eyebrow !text-[0.62rem] text-muted">Traveller&apos;s journal</p>
        <h1 className="script mt-2 text-[4rem] leading-none">{user.username}</h1>
        <p className="title-serif mt-2 text-xl">
          Level {lp.level} · {titleForLevel(lp.level)}
        </p>

        <div className="mt-6">
          <div className="flex justify-between text-xs text-muted">
            <span>{user.xp.toLocaleString()} xp</span>
            <span>
              {lp.into}/{lp.needed} to level {lp.level + 1}
            </span>
          </div>
          <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-line/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#f08a9a] to-berry transition-all"
              style={{ width: `${lp.ratio * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="pill !px-4 !py-2.5">
            <BerryIcon size={20} /> <b className="font-medium">{user.berries}</b> berries
          </span>
          <span className="pill !px-4 !py-2.5">
            <HeartIcon size={18} /> <b className="font-medium">{user.streak}</b> day streak
          </span>
          <span className="pill !px-4 !py-2.5">
            <b className="font-medium text-berry">{profile.solvedCount}</b> / {profile.totalQuests} solved
          </span>
        </div>

        <h2 className="eyebrow mt-9 !text-[0.65rem]">Regions</h2>
        <ul className="mt-3 space-y-3">
          {regionDocs.map((r) => {
            const t = profile.regionTotals[r._id] ?? { solved: 0, total: 0 };
            return (
              <li key={r._id}>
                <div className="flex justify-between text-sm">
                  <span className="font-serif italic">{r.name}</span>
                  <span className="tabular-nums text-muted">
                    {t.solved}/{t.total}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line/70">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${t.total ? (t.solved / t.total) * 100 : 0}%`, background: r.accent }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="space-y-5">
        <section className="panel animate-float-up p-7">
          <h2 className="eyebrow !text-[0.65rem]">Badges</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {badges.map((b) => (
              <li
                key={b.id}
                className={`rounded-2xl border p-4 text-center transition ${
                  b.earned ? "border-berry/30 bg-berry-soft/40" : "border-line bg-white/30 opacity-55 grayscale"
                }`}
              >
                <div className="text-3xl">{b.emoji}</div>
                <p className="mt-1 font-serif text-[0.95rem] italic">{b.name}</p>
                <p className="mt-0.5 text-[0.72rem] leading-snug text-muted">{b.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel animate-float-up p-7">
          <h2 className="eyebrow !text-[0.65rem]">Recently solved</h2>
          {profile.recent.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Nothing yet. <Link href="/world" className="text-berry underline underline-offset-2">Head to the map</Link> and
              pick your first stone.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line/70">
              {profile.recent.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/quest/${r.slug}`}
                    className="flex items-center justify-between gap-3 py-2.5 transition hover:text-berry"
                  >
                    <span className="font-serif italic">{r.title}</span>
                    <span className="text-xs text-muted">+{r.xp} xp</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-4 sm:px-8">
      <Suspense fallback={<div className="panel h-96 animate-pulse" />}>
        <Journal />
      </Suspense>
    </main>
  );
}
