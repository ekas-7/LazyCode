"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { JudgeResponse } from "@/lib/types";
import { titleForLevel } from "@/lib/game";
import { BerryIcon, HeartIcon } from "@/components/ui/icons";

export function Celebration({
  reward,
  title,
  onClose,
}: {
  reward: NonNullable<JudgeResponse["reward"]>;
  title: string;
  onClose: () => void;
}) {
  const confetti = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: ((i * 53) % 100) / 60,
        duration: 3.2 + ((i * 29) % 30) / 10,
        size: 16 + ((i * 17) % 18),
        heart: i % 4 === 0,
      })),
    [],
  );

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#3b2a2a]/35 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-label="Quest complete"
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        {confetti.map((c, i) => (
          <span
            key={i}
            className="absolute top-0"
            style={{
              left: `${c.left}%`,
              animation: `berry-fall ${c.duration}s ${c.delay}s linear infinite`,
            }}
          >
            {c.heart ? <HeartIcon size={c.size} /> : <BerryIcon size={c.size} />}
          </span>
        ))}
      </div>

      <div className="panel animate-pop relative w-full max-w-md !bg-paper p-8 text-center">
        <p className="eyebrow !text-[0.62rem] text-leaf">Quest complete</p>
        <h2 className="script mt-2 text-[3.4rem] text-ink">Well done!</h2>
        <p className="mt-1 font-serif text-lg italic text-berry-deep">{title}</p>

        <div className="mt-6 flex justify-center gap-3">
          <div className="pill !px-4 !py-2.5 text-base">
            <span className="font-semibold text-berry">+{reward.xp}</span>
            <span className="eyebrow !text-[0.58rem]">xp</span>
          </div>
          <div className="pill !px-4 !py-2.5 text-base">
            <BerryIcon size={20} />
            <span className="font-semibold">+{reward.berries}</span>
          </div>
          <div className="pill !px-4 !py-2.5 text-base" title="Day streak">
            <HeartIcon size={18} />
            <span className="font-semibold">{reward.streak}</span>
          </div>
        </div>

        {reward.levelUp && (
          <p className="animate-pop mt-5 rounded-2xl bg-berry-soft px-4 py-3 font-serif italic text-berry-deep">
            Level up! You&apos;re now level {reward.newLevel}, a {titleForLevel(reward.newLevel)}.
          </p>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {reward.nextSlug ? (
            <Link href={`/quest/${reward.nextSlug}`} className="btn btn-teal">
              Next quest
            </Link>
          ) : (
            <Link href="/world" className="btn btn-teal">
              You finished the journey!
            </Link>
          )}
          <Link href="/world" className="btn btn-ghost">
            Back to the map
          </Link>
        </div>
        <button onClick={onClose} className="eyebrow mt-5 !text-[0.58rem] text-muted transition hover:text-berry">
          Stay here
        </button>
      </div>
    </div>
  );
}
