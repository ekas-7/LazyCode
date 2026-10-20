"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementRef,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import type { WorldLayout } from "./layout";
import {
  Clouds,
  Island,
  Mascot,
  QuestMarker,
  StepStones,
} from "./parts";

const SKY = "#fdeedd";

export interface FocusTarget {
  x: number;
  z: number;
  /** Changes whenever the same point should be re-focused. */
  id: number;
}

interface SceneProps {
  layout: WorldLayout;
  selectedSlug: string | null;
  focus: FocusTarget | null;
  /** Key used to remember where the mascot was last seen, so it can walk to new quests. */
  storageKey: string;
  onSelect: (slug: string | null) => void;
}

/** Sun that follows the camera target so shadows stay crisp near the player. */
function SunRig({ target }: { target: THREE.Vector3 }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    l.position.set(target.x + 14, 26, target.z + 12);
    dummy.position.copy(target);
    l.target = dummy;
    dummy.updateMatrixWorld();
  });
  return (
    <directionalLight
      ref={light}
      intensity={2.1}
      color="#fff1dc"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-28}
      shadow-camera-right={28}
      shadow-camera-top={28}
      shadow-camera-bottom={-28}
      shadow-camera-near={1}
      shadow-camera-far={80}
      shadow-bias={-0.0004}
      shadow-normalBias={0.04}
    />
  );
}

function JourneyMascot({
  layout,
  storageKey,
  pos,
}: {
  layout: WorldLayout;
  storageKey: string;
  /** Shared, mutable position that the camera and sun follow. */
  pos: THREE.Vector3;
}) {
  const group = useRef<THREE.Group>(null);
  const walking = useRef(false);
  const heading = useRef(0);
  const { curve, curvePoints } = layout;
  const targetIdx = layout.currentIndex + 1; // curvePoints[0] is the spawn
  const lastIdx = curvePoints.length - 1;

  const s = useRef<number | null>(null);
  if (s.current === null) {
    let start = targetIdx;
    try {
      const stored = Number(localStorage.getItem(storageKey));
      if (Number.isFinite(stored) && stored >= 0 && stored < targetIdx) start = stored;
    } catch {
      /* storage unavailable */
    }
    s.current = start;
  }

  useFrame((_, rawDt) => {
    const g = group.current;
    if (!g || !curve || lastIdx < 1) return;
    const dt = Math.min(rawDt, 0.05);
    const cur = s.current!;

    if (Math.abs(cur - targetIdx) > 0.002) {
      const dir = Math.sign(targetIdx - cur);
      const seg = Math.min(lastIdx - 1, Math.max(0, dir > 0 ? Math.floor(cur) : Math.ceil(cur) - 1));
      const segLen = Math.max(1, curvePoints[seg].distanceTo(curvePoints[seg + 1]));
      let next = cur + (dir * 4.6 * dt) / segLen;
      if ((dir > 0 && next > targetIdx) || (dir < 0 && next < targetIdx)) next = targetIdx;
      s.current = next;
      walking.current = true;
      if (next === targetIdx) {
        try {
          localStorage.setItem(storageKey, String(targetIdx));
        } catch {
          /* ignore */
        }
      }
    } else {
      walking.current = false;
    }

    const t = THREE.MathUtils.clamp(s.current! / lastIdx, 0, 1);
    const p = curve.getPoint(t);
    g.position.set(p.x, 0.02, p.z);
    pos.set(p.x, 0, p.z);

    if (walking.current) {
      const tan = curve.getTangent(t);
      const want = Math.atan2(tan.x, tan.z);
      let diff = want - heading.current;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      heading.current += diff * Math.min(1, dt * 10);
    } else {
      // idle: face the camera-ish (towards +z)
      let diff = 0.35 - heading.current;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      heading.current += diff * Math.min(1, dt * 4);
    }
    g.rotation.y = heading.current;
  });

  // Persist on unmount too, so leaving mid-walk resumes sensibly.
  useEffect(
    () => () => {
      try {
        if (s.current !== null) localStorage.setItem(storageKey, String(s.current));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  return (
    <group ref={group}>
      <Mascot walking={walking} scale={1.15} />
    </group>
  );
}

function CameraRig({
  mascotPos,
  focus,
  hasSelection,
}: {
  mascotPos: THREE.Vector3;
  focus: FocusTarget | null;
  hasSelection: boolean;
}) {
  const controls = useRef<ElementRef<typeof OrbitControls>>(null);
  const camera = useThree((s) => s.camera);
  const goal = useRef(new THREE.Vector3());
  const initialised = useRef(false);

  useFrame((_, dt) => {
    const c = controls.current;
    if (!c) return;
    if (focus) goal.current.set(focus.x, 0, focus.z);
    else goal.current.copy(mascotPos);

    if (!initialised.current) {
      // Snap on the first frame so we don't fly across the whole map on load.
      initialised.current = true;
      c.target.copy(goal.current);
      camera.position.set(goal.current.x + 2, 11, goal.current.z + 17);
      c.update();
      return;
    }

    const k = 1 - Math.exp(-(focus ? 3.2 : 2.2) * dt);
    const delta = goal.current.clone().sub(c.target).multiplyScalar(k);
    c.target.add(delta);
    camera.position.add(delta);
    c.update();
  });

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={9}
      maxDistance={hasSelection ? 34 : 42}
      minPolarAngle={0.35}
      maxPolarAngle={1.32}
      rotateSpeed={0.6}
      zoomSpeed={0.7}
    />
  );
}

function World({
  layout,
  selectedSlug,
  focus,
  storageKey,
  onSelect,
}: {
  layout: WorldLayout;
  selectedSlug: string | null;
  focus: FocusTarget | null;
  storageKey: string;
  onSelect: (slug: string | null) => void;
}) {
  // Where the mascot is right now. Seeded at the current quest so the first frame is sensible.
  const [mascotPos] = useState(() =>
    (layout.nodes[layout.currentIndex]?.position ?? layout.spawn).clone(),
  );

  const sparkleGroup = useRef<THREE.Group>(null);
  useFrame(() => {
    sparkleGroup.current?.position.set(mascotPos.x, 3, mascotPos.z);
  });

  return (
    <>
      <color attach="background" args={[SKY]} />
      <fog attach="fog" args={[SKY, 45, 150]} />

      <hemisphereLight args={["#fff7ea", "#e8c9b0", 1.05]} />
      <SunRig target={mascotPos} />

      {/* water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.3, -50]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#bfe4ea" roughness={0.25} />
      </mesh>

      {layout.islands.map((island, i) => (
        <Island
          key={island.region._id}
          island={island}
          pathPoints={layout.curvePoints}
          isFirst={i === 0}
          isLast={i === layout.islands.length - 1}
        />
      ))}

      {layout.curve && <StepStones curve={layout.curve} nodes={layout.nodes} />}

      {layout.nodes.map((n) => (
        <QuestMarker
          key={n.quest.slug}
          node={n}
          selected={selectedSlug === n.quest.slug}
          onSelect={onSelect}
        />
      ))}

      <JourneyMascot layout={layout} storageKey={storageKey} pos={mascotPos} />

      <group ref={sparkleGroup}>
        <Sparkles count={70} scale={[46, 9, 46]} size={7} speed={0.35} opacity={0.9} color="#ff9fb4" noise={1.2} />
      </group>

      <Clouds />
      <CameraRig mascotPos={mascotPos} focus={focus} hasSelection={!!selectedSlug} />
    </>
  );
}

export default function WorldScene({
  layout,
  selectedSlug,
  focus,
  storageKey,
  onSelect,
}: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 38, near: 0.5, far: 400, position: [0, 11, 17] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onPointerMissed={() => onSelect(null)}
      aria-label="3D map of your coding journey. Use the quest list for keyboard access."
    >
      <Suspense fallback={null}>
        <World
          layout={layout}
          selectedSlug={selectedSlug}
          focus={focus}
          storageKey={storageKey}
          onSelect={onSelect}
        />
      </Suspense>
    </Canvas>
  );
}
