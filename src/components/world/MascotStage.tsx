"use client";

import { Canvas } from "@react-three/fiber";
import { Mascot, type MascotMood } from "./parts";

/** A tiny 3D stage for the strawberry mascot that reacts to how your code is going. */
export default function MascotStage({ mood }: { mood: MascotMood }) {
  return (
    <Canvas
      dpr={[1, 2]}
      shadows
      camera={{ fov: 32, position: [0, 1.6, 5.2] }}
      gl={{ alpha: true }}
      style={{ background: "transparent" }}
    >
      <hemisphereLight args={["#fff7ea", "#e8c9b0", 1.2]} />
      <directionalLight position={[3, 5, 4]} intensity={2} castShadow />
      <group position={[0, -0.3, 0]} rotation={[0, 0.3, 0]}>
        <Mascot mood={mood} scale={1.5} />
      </group>
    </Canvas>
  );
}
