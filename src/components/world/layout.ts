import * as THREE from "three";
import type { QuestNode, RegionDoc } from "@/lib/types";

export const ISLAND_RADIUS = 8.4;

export interface NodeLayout {
  quest: QuestNode;
  position: THREE.Vector3;
  /** 1-based index along the whole journey */
  index: number;
}

export interface IslandLayout {
  region: RegionDoc;
  center: THREE.Vector3;
  radius: number;
  forward: THREE.Vector2;
  right: THREE.Vector2;
  nodes: NodeLayout[];
  solved: number;
  total: number;
}

export interface WorldLayout {
  islands: IslandLayout[];
  nodes: NodeLayout[];
  /** Where the mascot starts (in front of the cafe). */
  spawn: THREE.Vector3;
  /** Smooth curve through spawn + every node. points[0] is the spawn. */
  curve: THREE.CatmullRomCurve3 | null;
  /** curvePoints[i] = position of node i-1 (i=0 is the spawn). */
  curvePoints: THREE.Vector3[];
  /** Index of the quest the player should do next, or last quest if all done. */
  currentIndex: number;
}

export function buildLayout(
  regions: RegionDoc[],
  quests: QuestNode[],
): WorldLayout {
  const islands: IslandLayout[] = regions.map((region, i) => {
    const center = new THREE.Vector3(region.position[0], 0, region.position[1]);
    const next = regions[i + 1];
    const prev = regions[i - 1];
    const dir = next
      ? new THREE.Vector2(
          next.position[0] - region.position[0],
          next.position[1] - region.position[1],
        )
      : prev
        ? new THREE.Vector2(
            region.position[0] - prev.position[0],
            region.position[1] - prev.position[1],
          )
        : new THREE.Vector2(0, -1);
    const forward = dir.normalize();
    const right = new THREE.Vector2(-forward.y, forward.x);
    return {
      region,
      center,
      radius: ISLAND_RADIUS,
      forward,
      right,
      nodes: [],
      solved: 0,
      total: 0,
    };
  });

  const byRegion = new Map(islands.map((il) => [il.region._id, il]));
  const sorted = [...quests].sort((a, b) => a.order - b.order);

  sorted.forEach((q) => {
    const il = byRegion.get(q.regionId);
    if (il) il.total++;
  });

  const placed = new Map<string, number>();
  const nodes: NodeLayout[] = sorted.map((quest, i) => {
    const il = byRegion.get(quest.regionId)!;
    const j = placed.get(il.region._id) ?? 0;
    placed.set(il.region._id, j + 1);
    const m = il.total;
    const t = m === 1 ? 0.5 : j / (m - 1);
    const along = -5.4 + 10.8 * t;
    const side = Math.sin(t * Math.PI * 2) * 2.6;
    const position = new THREE.Vector3(
      il.center.x + il.forward.x * along + il.right.x * side,
      0,
      il.center.z + il.forward.y * along + il.right.y * side,
    );
    const layout: NodeLayout = { quest, position, index: i + 1 };
    il.nodes.push(layout);
    if (quest.state === "solved") il.solved++;
    return layout;
  });

  const first = islands[0];
  const spawn = first
    ? new THREE.Vector3(
        first.center.x - first.forward.x * 6.8,
        0,
        first.center.z - first.forward.y * 6.8,
      )
    : new THREE.Vector3();

  const curvePoints = [spawn, ...nodes.map((n) => n.position)];
  const curve =
    curvePoints.length >= 2
      ? new THREE.CatmullRomCurve3(curvePoints, false, "centripetal")
      : null;

  let currentIndex = nodes.findIndex((n) => n.quest.state === "current");
  if (currentIndex === -1) currentIndex = Math.max(0, nodes.length - 1);

  return { islands, nodes, spawn, curve, curvePoints, currentIndex };
}

/** Deterministic PRNG so scenery doesn't jump around between renders. */
export function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Squared distance from point p to segment ab, in the XZ plane. */
export function distToSegmentXZ(
  p: THREE.Vector3,
  a: THREE.Vector3,
  b: THREE.Vector3,
) {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const len2 = abx * abx + abz * abz || 1;
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * abx + (p.z - a.z) * abz) / len2),
  );
  const dx = p.x - (a.x + abx * t);
  const dz = p.z - (a.z + abz * t);
  return Math.sqrt(dx * dx + dz * dz);
}
