import Link from "next/link";
import { HeroStage } from "@/components/world/HeroStage";
import { regions } from "@/content/regions";
import { problems } from "@/content/problems";
import { BerryIcon, HeartIcon } from "@/components/ui/icons";

const STEPS = [
  {
    title: "Walk the map",
    body: "Every puzzle is a stone on a winding path through a 3D world. Solve one to light up the next.",
    icon: <BerryIcon size={30} />,
  },
  {
    title: "Write real code",
    body: "A proper editor, visible and hidden tests, and gentle hints when you're stuck. No timers, no pressure.",
    icon: <span className="font-mono text-xl text-berry">{"{ }"}</span>,
  },
  {
    title: "Grow your garden",
    body: "Earn xp, berries and a daily streak. Spend berries on hints, and watch your strawberry level up.",
    icon: <HeartIcon size={28} />,
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[1500px] flex-1 px-5 sm:px-10">
      <section className="grid items-center gap-6 py-6 lg:min-h-[620px] lg:grid-cols-[1fr_1.15fr] lg:gap-10">
        <div className="animate-float-up">
          <p className="eyebrow !text-[0.66rem] text-muted">A gentle coding adventure</p>
          <h1 className="script mt-4 text-[5.5rem] text-ink sm:text-[7.5rem]">Berry Quest</h1>
          <p className="title-serif mt-4 max-w-md text-[1.6rem] leading-snug sm:text-[1.9rem]">
            Learn to code by walking a little path through a 3D world.
          </p>
          <p className="mt-4 max-w-md text-[1.02rem] leading-relaxed text-ink/75">
            Strawberry Meadow to Dragon&apos;s Peak. Solve LeetCode-style puzzles, collect berries, and take the
            journey one small, satisfying step at a time.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/world" className="btn btn-teal !px-7 !py-3.5">
              Begin the journey
            </Link>
            <Link href="/register" className="btn btn-ghost !px-7 !py-3.5">
              Create account
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <span className="chip">{problems.length} quests</span>
            <span className="chip">{regions.length} regions</span>
            <span className="chip">hidden tests</span>
            <span className="chip">1 sleepy dragon</span>
          </div>
        </div>

        <div className="panel relative h-[460px] overflow-hidden !rounded-[36px] sm:h-[560px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.8),transparent_65%)]" />
          <div className="absolute inset-0">
            <HeroStage />
          </div>
          <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center font-serif text-sm italic text-muted">
            drag to turn it around
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mb-8 text-center">
          <h2 className="script text-[3.2rem]">How it works</h2>
          <p className="eyebrow mt-2 !text-[0.6rem] text-muted">Baked this morning · Poured with love</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.title} className="panel p-7">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-berry-soft/70">{s.icon}</div>
              <h3 className="title-serif text-2xl">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-ink/75">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-8 pt-4">
        <div className="mb-6 text-center">
          <h2 className="script text-[3.2rem]">The road ahead</h2>
        </div>
        <ol className="grid gap-4 md:grid-cols-5">
          {regions.map((r, i) => (
            <li key={r._id} className="panel p-5">
              <span
                className="mb-3 block h-1.5 w-12 rounded-full"
                style={{ background: r.accent }}
                aria-hidden="true"
              />
              <p className="eyebrow !text-[0.58rem] text-muted">Chapter {i + 1}</p>
              <h3 className="mt-1 font-serif text-lg italic text-ink">{r.name}</h3>
              <p className="mt-1 text-sm text-muted">{r.tagline}</p>
              <p className="mt-3 text-xs tabular-nums text-ink/70">
                {problems.filter((p) => p.regionId === r._id).length} quests
              </p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
