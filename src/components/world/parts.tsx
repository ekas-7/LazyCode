"use client";

import { useMemo, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { QuestState } from "@/lib/types";
import {
  distToSegmentXZ,
  seeded,
  type IslandLayout,
  type NodeLayout,
} from "./layout";

/* ───────────────────────── shared materials ───────────────────────── */

const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });

const M = {
  berry: mat("#e0405a", { roughness: 0.55 }),
  berryDark: mat("#c22e48"),
  leaf: mat("#5fa65f"),
  leafDark: mat("#3f8a55"),
  seed: mat("#ffe7bf"),
  cream: mat("#fff3df"),
  creamDeep: mat("#f6e2c4"),
  trunk: mat("#9b7050"),
  soil: mat("#cfa982"),
  soilDark: mat("#b78c66"),
  frosting: mat("#fff8ee"),
  stone: mat("#d9ccbd"),
  stoneDark: mat("#bcae9e"),
  pink: mat("#f6a8b6"),
  white: mat("#ffffff"),
  eye: mat("#2b1c1c", { roughness: 0.3 }),
  cheek: mat("#ff9fb0"),
  gold: mat("#f2c14e"),
  honey: mat("#f0b73c"),
  honeyDark: mat("#b9852a"),
  rock: mat("#b9aab4", { flatShading: true }),
  rockLight: mat("#d8cbd8", { flatShading: true }),
  snow: mat("#ffffff", { flatShading: true }),
  water: mat("#aedde6", { roughness: 0.2 }),
  lily: mat("#6dbb74"),
  dragon: mat("#a98bd0"),
  dragonDark: mat("#8266b4"),
  teal: mat("#4fae9b"),
  red: mat("#c9473f"),
  awningA: mat("#f4cf5b"),
  awningB: mat("#fff4d6"),
  window: mat("#f8d38a", { emissive: "#f8c46a", emissiveIntensity: 0.35 }),
  glass: mat("#7fb6c9"),
};

const G = {
  sphere: new THREE.SphereGeometry(1, 20, 16),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 24),
  cone: new THREE.ConeGeometry(1, 1, 16),
  box: new THREE.BoxGeometry(1, 1, 1),
  dodeca: new THREE.DodecahedronGeometry(1, 0),
  torus: new THREE.TorusGeometry(1, 0.16, 8, 28),
};

/* ───────────────────────── strawberry ───────────────────────── */

const SEED_POINTS = (() => {
  const pts: THREE.Vector3[] = [];
  const n = 16;
  for (let i = 0; i < n; i++) {
    const y = -0.85 + (i / (n - 1)) * 1.35; // below the leaf cap
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const a = i * 2.399963;
    pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
  }
  return pts;
})();

/** A cute low-poly strawberry. Origin at its centre; radius ~0.5. */
export function Berry({
  scale = 1,
  face = false,
}: {
  scale?: number;
  face?: boolean;
}) {
  return (
    <group scale={scale}>
      <mesh geometry={G.sphere} material={M.berry} scale={[0.5, 0.56, 0.5]} castShadow />
      {SEED_POINTS.map((p, i) => {
        const pos = p.clone().multiply(new THREE.Vector3(0.5, 0.56, 0.5)).multiplyScalar(0.995);
        const q = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          p.clone().normalize(),
        );
        return (
          <mesh
            key={i}
            geometry={G.sphere}
            material={M.seed}
            position={pos}
            quaternion={q}
            scale={[0.035, 0.06, 0.035]}
          />
        );
      })}
      {/* leafy crown */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          geometry={G.sphere}
          material={i % 2 ? M.leaf : M.leafDark}
          position={[
            Math.cos((i / 5) * Math.PI * 2) * 0.17,
            0.5,
            Math.sin((i / 5) * Math.PI * 2) * 0.17,
          ]}
          rotation={[
            Math.sin((i / 5) * Math.PI * 2) * 0.7,
            0,
            -Math.cos((i / 5) * Math.PI * 2) * 0.7,
          ]}
          scale={[0.13, 0.05, 0.2]}
          castShadow
        />
      ))}
      <mesh geometry={G.cylinder} material={M.leafDark} position={[0, 0.6, 0]} scale={[0.03, 0.12, 0.03]} />
      {face && (
        <group position={[0, 0.02, 0.46]}>
          {[-0.15, 0.15].map((x) => (
            <group key={x} position={[x, 0.08, 0]}>
              <mesh geometry={G.sphere} material={M.eye} scale={0.065} />
              <mesh geometry={G.sphere} material={M.white} position={[0.02, 0.025, 0.05]} scale={0.022} />
            </group>
          ))}
          {[-0.27, 0.27].map((x) => (
            <mesh key={x} geometry={G.sphere} material={M.cheek} position={[x, -0.03, -0.02]} scale={[0.07, 0.045, 0.03]} />
          ))}
          <mesh geometry={G.torus} material={M.eye} position={[0, -0.02, 0.01]} rotation={[0, 0, Math.PI]} scale={[0.07, 0.05, 0.06]} />
        </group>
      )}
    </group>
  );
}

export type MascotMood = "idle" | "happy" | "sad";

/** The player's little strawberry sprite. */
export function Mascot({
  mood = "idle",
  walking,
  scale = 1,
}: {
  mood?: MascotMood;
  walking?: RefObject<boolean>;
  scale?: number;
}) {
  const body = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!body.current || !tilt.current) return;
    let y = 0;
    let sx = 1;
    let sy = 1;
    let rz = 0;
    if (walking?.current) {
      const p = Math.abs(Math.sin(t * 9));
      y = p * 0.32;
      sy = 1 + (0.5 - p) * 0.12;
      sx = 1 - (0.5 - p) * 0.1;
      rz = Math.sin(t * 9) * 0.1;
    } else if (mood === "happy") {
      const p = Math.abs(Math.sin(t * 5));
      y = p * 0.7;
      sy = 1 + (0.5 - p) * 0.2;
      sx = 1 - (0.5 - p) * 0.15;
      rz = Math.sin(t * 5) * 0.12;
    } else if (mood === "sad") {
      sy = 0.92 + Math.sin(t * 1.5) * 0.015;
      rz = -0.2;
    } else {
      y = (Math.sin(t * 2.2) * 0.5 + 0.5) * 0.07;
      sy = 1 + Math.sin(t * 2.2) * 0.025;
      sx = 1 - Math.sin(t * 2.2) * 0.02;
    }
    body.current.position.y = 0.55 + y;
    body.current.scale.set(sx, sy, sx);
    tilt.current.rotation.z = rz;
  });

  return (
    <group scale={scale}>
      <group ref={tilt}>
        <group ref={body}>
          <Berry scale={1.15} face />
          {[-0.2, 0.2].map((x) => (
            <mesh key={x} geometry={G.sphere} material={M.trunk} position={[x, -0.55, 0.05]} scale={[0.13, 0.09, 0.17]} castShadow />
          ))}
        </group>
      </group>
      {/* soft blob shadow so it reads as grounded even without a shadow map */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.5, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── scenery props ───────────────────────── */

export function RoundTree({ scale = 1, hue = 0 }: { scale?: number; hue?: number }) {
  const m = hue ? M.leafDark : M.leaf;
  return (
    <group scale={scale}>
      <mesh geometry={G.cylinder} material={M.trunk} position={[0, 0.55, 0]} scale={[0.16, 0.55, 0.16]} castShadow />
      <mesh geometry={G.sphere} material={m} position={[0, 1.5, 0]} scale={[0.85, 0.8, 0.85]} castShadow />
      <mesh geometry={G.sphere} material={m} position={[0.35, 1.15, 0.2]} scale={0.5} castShadow />
      <mesh geometry={G.sphere} material={m} position={[-0.35, 1.2, -0.15]} scale={0.48} castShadow />
      <mesh geometry={G.sphere} material={M.berry} position={[0.5, 1.6, 0.55]} scale={0.1} />
      <mesh geometry={G.sphere} material={M.berry} position={[-0.45, 1.35, 0.55]} scale={0.1} />
    </group>
  );
}

export function PineTree({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh geometry={G.cylinder} material={M.trunk} position={[0, 0.3, 0]} scale={[0.14, 0.3, 0.14]} castShadow />
      <mesh geometry={G.cone} material={M.leafDark} position={[0, 0.95, 0]} scale={[0.85, 1.0, 0.85]} castShadow />
      <mesh geometry={G.cone} material={M.leaf} position={[0, 1.55, 0]} scale={[0.65, 0.9, 0.65]} castShadow />
      <mesh geometry={G.cone} material={M.leafDark} position={[0, 2.1, 0]} scale={[0.45, 0.8, 0.45]} castShadow />
    </group>
  );
}

export function Bush({ scale = 1, berries = true }: { scale?: number; berries?: boolean }) {
  return (
    <group scale={scale}>
      <mesh geometry={G.sphere} material={M.leaf} position={[0, 0.4, 0]} scale={[0.7, 0.5, 0.65]} castShadow />
      <mesh geometry={G.sphere} material={M.leafDark} position={[0.4, 0.3, 0.1]} scale={[0.4, 0.35, 0.4]} castShadow />
      {berries &&
        [
          [0.2, 0.62, 0.45],
          [-0.35, 0.5, 0.4],
          [0.45, 0.45, -0.25],
          [-0.1, 0.78, 0.1],
        ].map((p, i) => (
          <mesh key={i} geometry={G.sphere} material={M.berry} position={p as [number, number, number]} scale={[0.1, 0.12, 0.1]} />
        ))}
    </group>
  );
}

export function Flower({ color = "#f58ea4", scale = 1 }: { color?: string; scale?: number }) {
  const petal = useMemo(() => mat(color), [color]);
  return (
    <group scale={scale}>
      <mesh geometry={G.cylinder} material={M.leaf} position={[0, 0.16, 0]} scale={[0.015, 0.16, 0.015]} />
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          geometry={G.sphere}
          material={petal}
          position={[Math.cos((i / 5) * Math.PI * 2) * 0.07, 0.34, Math.sin((i / 5) * Math.PI * 2) * 0.07]}
          scale={0.058}
        />
      ))}
      <mesh geometry={G.sphere} material={M.gold} position={[0, 0.345, 0]} scale={0.04} />
    </group>
  );
}

export function Rock({ scale = 1, light = false }: { scale?: number; light?: boolean }) {
  return (
    <mesh
      geometry={G.dodeca}
      material={light ? M.rockLight : M.rock}
      scale={[0.6 * scale, 0.42 * scale, 0.5 * scale]}
      position={[0, 0.2 * scale, 0]}
      castShadow
    />
  );
}

export function Beehive({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh geometry={G.sphere} material={M.honey} position={[0, 0.3, 0]} scale={[0.5, 0.3, 0.5]} castShadow />
      <mesh geometry={G.sphere} material={M.honeyDark} position={[0, 0.58, 0]} scale={[0.43, 0.16, 0.43]} />
      <mesh geometry={G.sphere} material={M.honey} position={[0, 0.82, 0]} scale={[0.36, 0.26, 0.36]} castShadow />
      <mesh geometry={G.sphere} material={M.honeyDark} position={[0, 1.04, 0]} scale={[0.28, 0.12, 0.28]} />
      <mesh geometry={G.sphere} material={M.honey} position={[0, 1.2, 0]} scale={[0.2, 0.17, 0.2]} castShadow />
      <mesh geometry={G.sphere} material={M.eye} position={[0, 0.3, 0.46]} scale={[0.14, 0.17, 0.08]} />
    </group>
  );
}

export function Mound({ scale = 1 }: { scale?: number }) {
  return (
    <mesh geometry={G.sphere} material={mat("#ecd38a")} position={[0, -0.1 * scale, 0]} scale={[1.3 * scale, 0.7 * scale, 1.2 * scale]} castShadow receiveShadow />
  );
}

export function Pond({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh geometry={G.cylinder} material={M.frosting} position={[0, 0.03, 0]} scale={[1.75, 0.06, 1.75]} receiveShadow />
      <mesh geometry={G.cylinder} material={M.water} position={[0, 0.07, 0]} scale={[1.5, 0.05, 1.5]} />
      {[
        [0.4, 0.2, 0.5],
        [-0.5, -0.3, 0.45],
        [0.1, -0.6, 0.35],
      ].map(([x, z, s], i) => (
        <group key={i} position={[x, 0.11, z]}>
          <mesh geometry={G.cylinder} material={M.lily} scale={[s, 0.03, s]} />
          {i === 0 && <mesh geometry={G.cone} material={M.pink} position={[0, 0.1, 0]} scale={[0.14, 0.2, 0.14]} />}
        </group>
      ))}
    </group>
  );
}

export function Spire({ scale = 1, snow = true }: { scale?: number; snow?: boolean }) {
  return (
    <group scale={scale}>
      <mesh geometry={G.cone} material={M.rock} position={[0, 1.3, 0]} scale={[0.9, 2.6, 0.9]} rotation={[0, 0.5, 0]} castShadow />
      {snow && (
        <mesh geometry={G.cone} material={M.snow} position={[0, 2.35, 0]} scale={[0.4, 0.8, 0.4]} rotation={[0, 0.5, 0]} />
      )}
    </group>
  );
}

export function SleepyDragon() {
  const z = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (z.current) {
      z.current.children.forEach((c, i) => {
        const p = (t * 0.35 + i * 0.4) % 1.2;
        c.position.y = 1.6 + p * 1.2;
        c.position.x = 0.5 + p * 0.5;
        c.scale.setScalar(0.12 + p * 0.1);
        (c as THREE.Mesh).visible = p < 1;
      });
    }
  });
  return (
    <group>
      <mesh geometry={G.sphere} material={M.dragon} position={[0, 0.7, 0]} scale={[1.3, 0.8, 1]} castShadow />
      <mesh geometry={G.sphere} material={mat("#f0e0f5")} position={[0, 0.5, 0.6]} scale={[0.9, 0.5, 0.45]} />
      <mesh geometry={G.sphere} material={M.dragon} position={[1.25, 0.65, 0.45]} scale={[0.6, 0.45, 0.5]} castShadow />
      {[-0.15, 0.15].map((dz) => (
        <mesh key={dz} geometry={G.cone} material={M.gold} position={[1.4, 1.05, 0.45 + dz * 2]} scale={[0.08, 0.3, 0.08]} />
      ))}
      <mesh geometry={G.sphere} material={M.eye} position={[1.62, 0.7, 0.72]} scale={[0.08, 0.02, 0.05]} />
      <mesh geometry={G.sphere} material={M.eye} position={[1.62, 0.7, 0.2]} scale={[0.08, 0.02, 0.05]} />
      <mesh geometry={G.sphere} material={M.cheek} position={[1.55, 0.55, 0.85]} scale={0.07} />
      <mesh geometry={G.cone} material={M.dragonDark} position={[-1.1, 0.5, 0.2]} rotation={[0, 0, Math.PI / 2 + 0.2]} scale={[0.3, 1.2, 0.3]} castShadow />
      {[-0.5, 0, 0.5].map((x) => (
        <mesh key={x} geometry={G.cone} material={M.dragonDark} position={[x, 1.35, 0]} scale={[0.14, 0.3, 0.14]} />
      ))}
      <mesh geometry={G.sphere} material={M.dragonDark} position={[-0.1, 1.0, -0.8]} rotation={[0.5, 0, 0]} scale={[0.9, 0.08, 0.6]} castShadow />
      <group ref={z}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} geometry={G.torus} material={M.white} scale={0.15} />
        ))}
      </group>
    </group>
  );
}

/** The little corner cafe where the journey starts. */
export function CafeTower() {
  return (
    <group>
      {/* shop front */}
      <mesh geometry={G.box} material={M.red} position={[0, 0.9, 0]} scale={[3.4, 1.8, 2.6]} castShadow receiveShadow />
      <mesh geometry={G.box} material={M.teal} position={[0, 1.65, 1.32]} scale={[3.4, 0.35, 0.1]} />
      {/* windows */}
      {[-1.05, 1.05].map((x) => (
        <mesh key={x} geometry={G.box} material={M.window} position={[x, 0.85, 1.32]} scale={[0.95, 0.9, 0.06]} />
      ))}
      <mesh geometry={G.box} material={M.creamDeep} position={[0, 0.7, 1.33]} scale={[0.6, 1.35, 0.06]} />
      {/* awning */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <mesh
          key={i}
          geometry={G.box}
          material={i % 2 ? M.awningB : M.awningA}
          position={[-1.5 + i * 0.5, 1.45, 1.65]}
          rotation={[0.45, 0, 0]}
          scale={[0.5, 0.06, 0.8]}
          castShadow
        />
      ))}
      {/* tower */}
      <mesh geometry={G.box} material={M.cream} position={[-0.3, 3.1, -0.1]} scale={[2.2, 3.0, 2.0]} castShadow />
      <mesh geometry={G.box} material={M.creamDeep} position={[-0.3, 4.65, -0.1]} scale={[2.5, 0.2, 2.3]} castShadow />
      {[2.4, 3.55].map((y) => (
        <group key={y} position={[-0.3, y, 0.92]}>
          <mesh geometry={G.box} material={M.glass} scale={[0.55, 0.85, 0.05]} />
          <mesh geometry={G.cylinder} material={M.glass} position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.275, 0.05, 0.275]} />
        </group>
      ))}
      {/* the big strawberry on the roof */}
      <group position={[-0.3, 5.45, -0.1]}>
        <Berry scale={1.5} />
      </group>
    </group>
  );
}

/* ───────────────────────── scenery scattering ───────────────────────── */

type Prop =
  | { kind: "round"; scale: number; hue: number }
  | { kind: "pine"; scale: number }
  | { kind: "bush"; scale: number }
  | { kind: "flower"; scale: number; color: string }
  | { kind: "rock"; scale: number; light: boolean }
  | { kind: "hive"; scale: number }
  | { kind: "mound"; scale: number }
  | { kind: "pond"; scale: number }
  | { kind: "spire"; scale: number };

interface Placed {
  prop: Prop;
  x: number;
  z: number;
  rot: number;
  clear: number;
}

function sceneryPlan(scenery: IslandLayout["region"]["scenery"], rnd: () => number): Array<{ prop: Prop; clear: number; count: number }> {
  const r = (a: number, b: number) => a + rnd() * (b - a);
  switch (scenery) {
    case "meadow":
      return [
        { prop: { kind: "round", scale: r(0.8, 1), hue: 0 }, clear: 2.6, count: 3 },
        { prop: { kind: "bush", scale: r(0.8, 1.1) }, clear: 2.0, count: 7 },
        { prop: { kind: "flower", scale: 1.5, color: "#f58ea4" }, clear: 1.5, count: 9 },
        { prop: { kind: "flower", scale: 1.5, color: "#ffffff" }, clear: 1.5, count: 7 },
      ];
    case "woods":
      return [
        { prop: { kind: "pine", scale: r(0.9, 1.3) }, clear: 2.4, count: 11 },
        { prop: { kind: "round", scale: r(0.8, 1), hue: 1 }, clear: 2.6, count: 3 },
        { prop: { kind: "rock", scale: 1, light: false }, clear: 1.8, count: 3 },
        { prop: { kind: "flower", scale: 1.4, color: "#c9a3f0" }, clear: 1.5, count: 7 },
      ];
    case "hills":
      return [
        { prop: { kind: "mound", scale: r(1, 1.5) }, clear: 3.0, count: 4 },
        { prop: { kind: "hive", scale: r(0.9, 1.2) }, clear: 2.0, count: 4 },
        { prop: { kind: "flower", scale: 1.5, color: "#f7c948" }, clear: 1.5, count: 12 },
        { prop: { kind: "round", scale: 0.8, hue: 0 }, clear: 2.4, count: 2 },
      ];
    case "lake":
      return [
        { prop: { kind: "pond", scale: r(0.9, 1.2) }, clear: 3.0, count: 3 },
        { prop: { kind: "flower", scale: 1.5, color: "#9fd6ef" }, clear: 1.5, count: 10 },
        { prop: { kind: "rock", scale: 1, light: true }, clear: 1.8, count: 3 },
        { prop: { kind: "round", scale: 0.85, hue: 1 }, clear: 2.4, count: 2 },
      ];
    case "peak":
      return [
        { prop: { kind: "spire", scale: r(0.9, 1.4) }, clear: 2.4, count: 6 },
        { prop: { kind: "rock", scale: 1.2, light: true }, clear: 1.8, count: 5 },
        { prop: { kind: "pine", scale: 0.9 }, clear: 2.2, count: 3 },
        { prop: { kind: "flower", scale: 1.4, color: "#e3b6ee" }, clear: 1.5, count: 6 },
      ];
  }
}

function useScenery(island: IslandLayout, pathPoints: THREE.Vector3[], extraKeepOut: Array<{ x: number; z: number; r: number }>) {
  return useMemo(() => {
    const rnd = seeded(island.region._id);
    const plan = sceneryPlan(island.region.scenery, rnd);
    const placed: Placed[] = [];
    const R = island.radius - 1.0;

    for (const { prop, clear, count } of plan) {
      for (let c = 0; c < count; c++) {
        for (let attempt = 0; attempt < 60; attempt++) {
          const a = rnd() * Math.PI * 2;
          const d = Math.sqrt(rnd()) * R;
          const x = island.center.x + Math.cos(a) * d;
          const z = island.center.z + Math.sin(a) * d;
          const p = new THREE.Vector3(x, 0, z);

          let ok = true;
          for (let i = 0; i < pathPoints.length - 1 && ok; i++) {
            if (distToSegmentXZ(p, pathPoints[i], pathPoints[i + 1]) < clear) ok = false;
          }
          for (const k of extraKeepOut) {
            if (Math.hypot(x - k.x, z - k.z) < k.r + clear * 0.5) ok = false;
          }
          for (const o of placed) {
            if (Math.hypot(x - o.x, z - o.z) < (clear + o.clear) * 0.45) ok = false;
          }
          if (ok) {
            placed.push({ prop, x, z, rot: rnd() * Math.PI * 2, clear });
            break;
          }
        }
      }
    }
    return placed;
  }, [island, pathPoints, extraKeepOut]);
}

function PropView({ prop }: { prop: Prop }) {
  switch (prop.kind) {
    case "round":
      return <RoundTree scale={prop.scale} hue={prop.hue} />;
    case "pine":
      return <PineTree scale={prop.scale} />;
    case "bush":
      return <Bush scale={prop.scale} />;
    case "flower":
      return <Flower scale={prop.scale} color={prop.color} />;
    case "rock":
      return <Rock scale={prop.scale} light={prop.light} />;
    case "hive":
      return <Beehive scale={prop.scale} />;
    case "mound":
      return <Mound scale={prop.scale} />;
    case "pond":
      return <Pond scale={prop.scale} />;
    case "spire":
      return <Spire scale={prop.scale} />;
  }
}

/* ───────────────────────── island ───────────────────────── */

export function Island({
  island,
  pathPoints,
  isFirst,
  isLast,
}: {
  island: IslandLayout;
  pathPoints: THREE.Vector3[];
  isFirst: boolean;
  isLast: boolean;
}) {
  const { center, radius, region, forward, right } = island;
  const grass = useMemo(() => mat(region.color), [region.color]);

  const cafe = useMemo(
    () =>
      isFirst
        ? {
            x: center.x - right.x * 5.2 - forward.x * 1.2,
            z: center.z - right.y * 5.2 - forward.y * 1.2,
          }
        : null,
    [isFirst, center, right, forward],
  );
  const dragon = useMemo(
    () =>
      isLast
        ? {
            x: center.x + forward.x * 6.2 + right.x * 1.9,
            z: center.z + forward.y * 6.2 + right.y * 1.9,
          }
        : null,
    [isLast, center, forward, right],
  );

  const keepOut = useMemo(
    () => [
      ...(cafe ? [{ x: cafe.x, z: cafe.z, r: 3.2 }] : []),
      ...(dragon ? [{ x: dragon.x, z: dragon.z, r: 2.6 }] : []),
    ],
    [cafe, dragon],
  );
  const items = useScenery(island, pathPoints, keepOut);

  const ripple = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ripple.current) return;
    const p = (clock.getElapsedTime() * 0.18 + island.region.order * 0.31) % 1;
    ripple.current.scale.setScalar(1 + p * 0.45);
    (ripple.current.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.5;
  });

  return (
    <group position={[center.x, 0, center.z]}>
      {/* cake-like island: grass top, frosting rim, soil body */}
      <mesh geometry={G.cylinder} material={grass} position={[0, -0.25, 0]} scale={[radius, 0.5, radius]} receiveShadow />
      <mesh geometry={G.cylinder} material={M.frosting} position={[0, -0.62, 0]} scale={[radius + 0.18, 0.28, radius + 0.18]} receiveShadow />
      <mesh position={[0, -2.1, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[radius - 0.2, radius * 0.62, 2.7, 40]} />
        <primitive object={M.soil} attach="material" />
      </mesh>
      <mesh position={[0, -1.35, 0]}>
        <cylinderGeometry args={[radius - 0.18, radius - 0.1, 0.18, 40]} />
        <primitive object={M.soilDark} attach="material" />
      </mesh>

      <mesh ref={ripple} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.25, 0]}>
        <ringGeometry args={[radius + 0.3, radius + 0.55, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
      </mesh>

      {/* scenery lives in world coordinates, so undo the island offset */}
      <group position={[-center.x, 0, -center.z]}>
        {items.map((it, i) => (
          <group key={i} position={[it.x, 0, it.z]} rotation={[0, it.rot, 0]}>
            <PropView prop={it.prop} />
          </group>
        ))}
        {cafe && (
          <group position={[cafe.x, 0, cafe.z]} rotation={[0, 0.55, 0]}>
            <CafeTower />
          </group>
        )}
        {dragon && (
          <group position={[dragon.x, 0, dragon.z]} rotation={[0, -0.6, 0]} scale={0.85}>
            <SleepyDragon />
          </group>
        )}
      </group>

      <Html position={[0, 0.25, radius + 0.9]} center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap text-center">
          <div
            className="script text-[2rem] leading-none text-ink"
            style={{ textShadow: "0 2px 0 rgba(255,250,240,.9), 0 0 14px rgba(255,250,240,.9)" }}
          >
            {region.name}
          </div>
          <div className="eyebrow mt-1 !text-[0.55rem] !tracking-[0.25em] text-muted" style={{ textShadow: "0 0 8px #fff8ee" }}>
            {island.solved}/{island.total} quests
          </div>
        </div>
      </Html>
    </group>
  );
}

/* ───────────────────────── quest markers ───────────────────────── */

const STATE_COLORS: Record<QuestState, { base: string; ring: string }> = {
  solved: { base: "#f4a1ae", ring: "#e0405a" },
  current: { base: "#fffaf0", ring: "#5db4a0" },
  locked: { base: "#d9cfc3", ring: "#bcae9e" },
};

export function QuestMarker({
  node,
  selected,
  onSelect,
}: {
  node: NodeLayout;
  selected: boolean;
  onSelect: (slug: string) => void;
}) {
  const [hover, setHover] = useState(false);
  const group = useRef<THREE.Group>(null);
  const float = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const flag = useRef<THREE.Mesh>(null);
  const { state } = node.quest;
  const colors = STATE_COLORS[state];
  const baseMat = useMemo(() => mat(colors.base), [colors.base]);
  const ringMat = useMemo(
    () => mat(colors.ring, { emissive: colors.ring, emissiveIntensity: state === "current" ? 0.5 : 0.1 }),
    [colors.ring, state],
  );

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime();
    const target = hover || selected ? 1.12 : 1;
    if (group.current) {
      const s = THREE.MathUtils.damp(group.current.scale.x, target, 10, dt);
      group.current.scale.setScalar(s);
    }
    if (float.current) {
      float.current.position.y = 1.15 + Math.sin(t * 2 + node.index) * 0.08;
      if (state === "solved") float.current.rotation.y = t * 0.8;
    }
    if (ring.current && state === "current") {
      const p = (t * 0.9) % 1;
      ring.current.scale.setScalar(1 + p * 0.5);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.7;
    }
    if (flag.current) flag.current.rotation.y = Math.sin(t * 4) * 0.3;
  });

  return (
    <group
      position={node.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.quest.slug);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
    >
      <group ref={group}>
        {/* stone pedestal */}
        <mesh geometry={G.cylinder} material={baseMat} position={[0, 0.14, 0]} scale={[0.95, 0.28, 0.95]} castShadow receiveShadow />
        <mesh geometry={G.cylinder} material={ringMat} position={[0, 0.3, 0]} scale={[0.72, 0.05, 0.72]} />

        {state === "current" && (
          <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.33, 0]}>
            <ringGeometry args={[0.8, 1.0, 40]} />
            <meshBasicMaterial color="#5db4a0" transparent opacity={0.6} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        )}

        <group ref={float} position={[0, 1.15, 0]}>
          {state === "solved" && <Berry scale={0.9} />}
          {state === "current" && (
            <group position={[0, -0.35, 0]}>
              <mesh geometry={G.cylinder} material={M.trunk} position={[0, 0.5, 0]} scale={[0.045, 0.55, 0.045]} castShadow />
              <mesh ref={flag} position={[0.28, 0.85, 0]} castShadow>
                <boxGeometry args={[0.55, 0.34, 0.04]} />
                <primitive object={M.berry} attach="material" />
              </mesh>
              <mesh geometry={G.sphere} material={M.gold} position={[0, 1.07, 0]} scale={0.07} />
            </group>
          )}
          {state === "locked" && (
            <group position={[0, -0.2, 0]}>
              <mesh geometry={G.box} material={M.stoneDark} position={[0, 0, 0]} scale={[0.5, 0.4, 0.22]} castShadow />
              <mesh geometry={G.torus} material={M.stoneDark} position={[0, 0.2, 0]} scale={[0.18, 0.2, 0.18]} />
              <mesh geometry={G.sphere} material={M.eye} position={[0, 0, 0.12]} scale={[0.04, 0.07, 0.02]} />
            </group>
          )}
        </group>
      </group>

      {/* index tag */}
      <Html position={[0, 0.05, 1.35]} center zIndexRange={[8, 0]} style={{ pointerEvents: "none" }}>
        <div
          className="grid h-6 w-6 place-items-center rounded-full border text-[0.7rem] font-semibold shadow-sm"
          style={{
            background: state === "solved" ? "#e0405a" : state === "current" ? "#5db4a0" : "#f1e7da",
            color: state === "locked" ? "#8f7a6e" : "#fff",
            borderColor: "rgba(255,255,255,.8)",
          }}
        >
          {node.index}
        </div>
      </Html>

      {(hover || selected) && (
        <Html position={[0, 3.1, 0]} center zIndexRange={[20, 10]} style={{ pointerEvents: "none" }}>
          <div className="animate-pop whitespace-nowrap rounded-full border border-line bg-paper/95 px-3 py-1.5 font-serif text-sm italic text-berry-deep shadow-lg">
            {node.quest.title}
          </div>
        </Html>
      )}
    </group>
  );
}

/* ───────────────────────── path ───────────────────────── */

export function StepStones({
  curve,
  nodes,
}: {
  curve: THREE.CatmullRomCurve3;
  nodes: NodeLayout[];
}) {
  const stones = useMemo(() => {
    const total = nodes.length; // segments = nodes.length (spawn→n1, n1→n2, ...)
    const out: Array<{ pos: THREE.Vector3; done: boolean; s: number; rot: number }> = [];
    for (let seg = 0; seg < total; seg++) {
      const a = seg === 0 ? curve.points[0] : nodes[seg - 1].position;
      const b = nodes[seg].position;
      const len = a.distanceTo(b);
      const count = Math.max(1, Math.floor(len / 1.55) - 1);
      const done = nodes[seg].quest.state === "solved";
      for (let k = 1; k <= count; k++) {
        const u = k / (count + 1);
        const t = (seg + u) / total;
        const p = curve.getPoint(t);
        out.push({
          pos: new THREE.Vector3(p.x, 0.03, p.z),
          done,
          s: 0.34 + ((seg * 7 + k * 13) % 5) * 0.03,
          rot: (seg + k) * 1.7,
        });
      }
    }
    return out;
  }, [curve, nodes]);

  return (
    <group>
      {stones.map((s, i) => (
        <mesh
          key={i}
          geometry={G.cylinder}
          material={s.done ? M.pink : M.stone}
          position={s.pos}
          rotation={[0, s.rot, 0]}
          scale={[s.s, 0.07, s.s]}
          receiveShadow
        />
      ))}
    </group>
  );
}

/* ───────────────────────── sky ───────────────────────── */

export function Clouds() {
  const group = useRef<THREE.Group>(null);
  const clouds = useMemo(() => {
    const rnd = seeded("clouds");
    return Array.from({ length: 12 }, (_, i) => ({
      x: -90 + rnd() * 180,
      y: 14 + rnd() * 10,
      z: -130 + rnd() * 150,
      s: 1.5 + rnd() * 2,
      speed: 0.25 + rnd() * 0.35,
      puffs: [0, 1, 2, 3].map((j) => ({
        x: (j - 1.5) * 1.3 + rnd() * 0.4,
        y: rnd() * 0.5,
        r: 1.2 + rnd() * 0.8 - Math.abs(j - 1.5) * 0.25,
      })),
      key: i,
    }));
  }, []);

  useFrame((_, dt) => {
    group.current?.children.forEach((c, i) => {
      c.position.x += clouds[i].speed * dt;
      if (c.position.x > 100) c.position.x = -100;
    });
  });

  return (
    <group ref={group}>
      {clouds.map((c) => (
        <group key={c.key} position={[c.x, c.y, c.z]} scale={c.s}>
          {c.puffs.map((p, j) => (
            <mesh key={j} geometry={G.sphere} position={[p.x, p.y, 0]} scale={[p.r, p.r * 0.7, p.r * 0.8]}>
              <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.92} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
