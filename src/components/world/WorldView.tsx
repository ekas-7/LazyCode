"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { QuestNode, RegionDoc } from "@/lib/types";
import { BerryIcon, CheckIcon, LockIcon, ArrowLeft } from "@/components/ui/icons";
import { buildLayout } from "./layout";
import type { FocusTarget } from "./Scene";

const WorldScene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <SceneLoading />,
});

function SceneLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex flex-col items-center gap-3 text-muted">
        <div className="animate-bounce">
          <BerryIcon size={44} />
        </div>
        <p className="font-serif italic">Unrolling the map…</p>
      </div>
    </div>
  );
}

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const DIFF_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" } as const;

export function WorldView({
  regions,
  quests,
  userId,
  username,
}: {
  regions: RegionDoc[];
  quests: QuestNode[];
  userId: string | null;
  username: string | null;
}) {
  const layout = useMemo(() => buildLayout(regions, quests), [regions, quests]);
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<FocusTarget | null>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    // Detecting browser capabilities has to happen after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebgl(supportsWebGL());
  }, []);

  const byRegion = useMemo(() => new Map(regions.map((r) => [r._id, r])), [regions]);
  const selectedNode = layout.nodes.find((n) => n.quest.slug === selected) ?? null;
  const currentNode = layout.nodes.find((n) => n.quest.state === "current") ?? null;
  const solvedCount = quests.filter((q) => q.state === "solved").length;
  const allDone = quests.length > 0 && solvedCount === quests.length;

  const select = useCallback(
    (slug: string | null) => {
      setSelected(slug);
      if (!slug) {
        setFocus(null);
        return;
      }
      const node = layout.nodes.find((n) => n.quest.slug === slug);
      if (node) setFocus((f) => ({ x: node.position.x, z: node.position.z, id: (f?.id ?? 0) + 1 }));
    },
    [layout],
  );

  const jumpToRegion = (id: string) => {
    const il = layout.islands.find((i) => i.region._id === id);
    if (!il) return;
    setSelected(null);
    setFocus((f) => ({ x: il.center.x, z: il.center.z, id: (f?.id ?? 0) + 1 }));
  };

  const storageKey = `bq:mascot:${userId ?? "guest"}`;

  return (
    <div className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-2 sm:px-8">
      <div className="panel relative h-[calc(100svh-150px)] min-h-[640px] overflow-hidden !rounded-[34px]">
        {/* 3D canvas */}
        <div className="absolute inset-0 isolate z-0">
          {webgl === false ? (
            <div className="grid h-full place-items-center p-8 text-center">
              <div>
                <p className="title-serif text-2xl">Your browser can&apos;t draw the 3D world</p>
                <p className="mt-2 text-muted">
                  Enable hardware acceleration, or pick a quest from the strip below.
                </p>
              </div>
            </div>
          ) : webgl ? (
            <WorldScene
              layout={layout}
              selectedSlug={selected}
              focus={focus}
              storageKey={storageKey}
              onSelect={select}
            />
          ) : (
            <SceneLoading />
          )}
        </div>

        {/* left: title + regions */}
        <div className="pointer-events-none absolute left-6 top-6 z-10 hidden w-[17rem] lg:block">
          <Link
            href="/"
            className="eyebrow pointer-events-auto inline-flex items-center gap-2 !text-[0.62rem] transition hover:text-berry"
          >
            <ArrowLeft /> Back to the corner
          </Link>
          <h1 className="script mt-4 text-[4rem] text-ink">The Journey</h1>
          <p className="eyebrow mt-3 !text-[0.6rem] text-muted">
            Wander slowly · Solve with love
          </p>

          <ol className="pointer-events-auto mt-6 space-y-2">
            {layout.islands.map((il) => {
              const pct = il.total ? (il.solved / il.total) * 100 : 0;
              return (
                <li key={il.region._id}>
                  <button
                    onClick={() => jumpToRegion(il.region._id)}
                    className="group w-full rounded-2xl border border-transparent bg-paper/70 px-3.5 py-2.5 text-left backdrop-blur transition hover:border-line hover:bg-paper"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-serif text-[0.95rem] italic text-ink group-hover:text-berry">
                        {il.region.name}
                      </span>
                      <span className="text-[0.7rem] tabular-nums text-muted">
                        {il.solved}/{il.total}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line/70">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: il.region.accent }}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* right: quest card */}
        <aside className="absolute z-10 inset-x-3 bottom-[5.25rem] sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-6 sm:w-[23rem]">
          <div className="panel animate-float-up !bg-paper/90 p-5 sm:p-6" key={selected ?? "overview"}>
            {selectedNode ? (
              <QuestCard
                node={selectedNode}
                region={byRegion.get(selectedNode.quest.regionId)}
                signedIn={!!userId}
                previous={layout.nodes[selectedNode.index - 2]?.quest}
                onBack={() => select(null)}
              />
            ) : (
              <Overview
                username={username}
                solved={solvedCount}
                total={quests.length}
                allDone={allDone}
                current={currentNode?.quest ?? null}
                currentRegion={currentNode ? byRegion.get(currentNode.quest.regionId) : undefined}
                onGo={() => currentNode && select(currentNode.quest.slug)}
                signedIn={!!userId}
              />
            )}
          </div>
        </aside>

        {/* bottom strip */}
        <div className="absolute inset-x-3 bottom-3 z-10 sm:inset-x-6">
          <div className="panel flex items-center gap-1.5 overflow-x-auto !rounded-[22px] !bg-paper/85 px-3 py-2.5">
            <span className="eyebrow mr-2 hidden shrink-0 !text-[0.58rem] text-muted sm:block">
              {webgl === false ? "Quests" : "Drag to look around"}
            </span>
            {layout.nodes.map((n) => (
              <QuestDot
                key={n.quest.slug}
                node={n}
                active={selected === n.quest.slug}
                onClick={() => select(n.quest.slug)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestDot({
  node,
  active,
  onClick,
}: {
  node: { quest: QuestNode; index: number };
  active: boolean;
  onClick: () => void;
}) {
  const { state } = node.quest;
  const styles =
    state === "solved"
      ? "bg-berry text-white border-berry"
      : state === "current"
        ? "bg-teal text-white border-teal animate-pulse"
        : "bg-cream-2 text-muted border-line";
  return (
    <button
      onClick={onClick}
      title={`${node.index}. ${node.quest.title} (${state})`}
      aria-label={`Quest ${node.index}: ${node.quest.title}, ${state}`}
      aria-pressed={active}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-xs font-semibold transition hover:-translate-y-0.5 ${styles} ${
        active ? "ring-4 ring-berry/25" : ""
      }`}
    >
      {state === "solved" ? <CheckIcon size={14} /> : state === "locked" ? <LockIcon size={13} /> : node.index}
    </button>
  );
}

function Overview({
  username,
  solved,
  total,
  allDone,
  current,
  currentRegion,
  onGo,
  signedIn,
}: {
  username: string | null;
  solved: number;
  total: number;
  allDone: boolean;
  current: QuestNode | null;
  currentRegion?: RegionDoc;
  onGo: () => void;
  signedIn: boolean;
}) {
  return (
    <div>
      <p className="eyebrow !text-[0.62rem]">{signedIn ? `Welcome back, ${username}` : "Welcome, traveller"}</p>
      <h2 className="title-serif mt-2 text-[1.7rem] leading-[1.05] sm:text-[2.1rem]">
        {allDone ? "You reached the summit!" : "Where to next?"}
      </h2>
      <p className="mt-3 hidden text-[0.95rem] leading-relaxed text-ink/80 sm:block">
        {allDone
          ? "Every quest is solved. The dragon sleeps soundly, and you've earned a long rest (or a replay)."
          : current
            ? `Your little strawberry is waiting at "${current.title}" in ${currentRegion?.name}.`
            : "Pick a stone on the map to read its story."}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
        <span className="chip">{solved} of {total} solved</span>
        <span className="chip hidden sm:inline-flex">Click a stone to explore</span>
      </div>

      {!signedIn && (
        <p className="mt-4 rounded-2xl bg-berry-soft/60 px-4 py-3 text-[0.85rem] text-berry-deep">
          <Link href="/register" className="font-semibold underline underline-offset-2">Create a free account</Link>{" "}
          to save your progress and earn berries.
        </p>
      )}

      {current && !allDone && (
        <button onClick={onGo} className="btn btn-teal mt-4 sm:mt-5">
          Go to next quest
        </button>
      )}
    </div>
  );
}

function QuestCard({
  node,
  region,
  signedIn,
  previous,
  onBack,
}: {
  node: { quest: QuestNode; index: number };
  region?: RegionDoc;
  signedIn: boolean;
  previous?: QuestNode;
  onBack: () => void;
}) {
  const q = node.quest;
  const href = `/quest/${q.slug}`;
  return (
    <div>
      <button onClick={onBack} className="eyebrow inline-flex items-center gap-2 !text-[0.6rem] text-muted transition hover:text-berry">
        <ArrowLeft /> All quests
      </button>

      <p className="eyebrow mt-5 !text-[0.62rem]">
        {region?.name} · Quest {node.index}
      </p>
      <h2 className="title-serif mt-2 text-[2.3rem] leading-[1.05]">{q.title}</h2>

      <p className="mt-2 flex items-center gap-3 font-serif text-lg">
        <span className="inline-flex items-center gap-1.5">
          <span className="text-berry">+{q.xp}</span>
          <span className="text-xs uppercase tracking-widest text-muted">xp</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BerryIcon size={18} />
          <span>{q.berries}</span>
        </span>
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="chip chip-solid">{DIFF_LABEL[q.difficulty]}</span>
        {q.tags.slice(0, 3).map((t) => (
          <span key={t} className="chip">{t}</span>
        ))}
      </div>

      <div className="mt-5">
        {q.state === "locked" ? (
          <>
            <p className="flex items-start gap-2 rounded-2xl bg-cream-2 px-4 py-3 text-[0.88rem] text-muted">
              <LockIcon size={16} />
              <span>
                Solve <b className="font-medium text-ink">{previous?.title ?? "the previous quest"}</b> first to
                unlock this stone.
              </span>
            </p>
          </>
        ) : signedIn ? (
          <Link href={href} className="btn btn-teal">
            {q.state === "solved" ? "Revisit quest" : "Begin quest"}
          </Link>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(href)}`} className="btn btn-teal">
            Sign in to begin
          </Link>
        )}
      </div>

      {q.state === "solved" && (
        <p className="mt-3 flex items-center gap-1.5 text-[0.82rem] text-leaf">
          <CheckIcon size={14} /> Solved. A berry grows here now.
        </p>
      )}
    </div>
  );
}
