"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sparkles } from "@react-three/drei";
import { Bush, CafeTower, Flower, Mascot, PineTree, RoundTree } from "./parts";

const FLOWERS: Array<[number, number, string]> = [
  [-2.2, 3.4, "#f58ea4"],
  [-1.2, 3.9, "#ffffff"],
  [2.6, 3.0, "#f58ea4"],
  [3.4, 1.4, "#ffffff"],
  [-4.2, 1.8, "#f7c948"],
  [4.2, -0.4, "#f58ea4"],
  [0.8, 4.2, "#f7c948"],
];

/** The landing-page diorama: a floating cake-island with the cafe and the mascot. */
export default function HeroScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 34, position: [11.5, 7, 14.5] }}
      gl={{ alpha: true }}
      style={{ background: "transparent" }}
    >
      <hemisphereLight args={["#fff7ea", "#e8c9b0", 1.1]} />
      <directionalLight
        position={[8, 14, 7]}
        intensity={2.2}
        color="#fff1dc"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.0005}
      />

      <group position={[0, -2.3, 0]}>
        {/* island */}
        <mesh position={[0, -0.25, 0]} receiveShadow>
          <cylinderGeometry args={[6, 6, 0.5, 48]} />
          <meshStandardMaterial color="#bfe3a0" roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.62, 0]} receiveShadow>
          <cylinderGeometry args={[6.18, 6.18, 0.28, 48]} />
          <meshStandardMaterial color="#fff8ee" roughness={0.9} />
        </mesh>
        <mesh position={[0, -2.0, 0]} castShadow>
          <cylinderGeometry args={[5.8, 3.4, 2.5, 40]} />
          <meshStandardMaterial color="#cfa982" roughness={0.9} />
        </mesh>

        {/* path of stones to the cafe */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[1.0 + i * 0.5, 0.03, 3.2 - i * 1.1]} rotation={[0, i, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 0.07, 20]} />
            <meshStandardMaterial color="#f6a8b6" roughness={0.9} />
          </mesh>
        ))}

        <group position={[-1.6, 0, -1.8]} rotation={[0, 0.5, 0]}>
          <CafeTower />
        </group>

        <group position={[4.0, 0, -1.8]}>
          <RoundTree scale={1.1} />
        </group>
        <group position={[-4.6, 0, 2.2]}>
          <RoundTree scale={0.9} hue={1} />
        </group>
        <group position={[3.9, 0, -3.6]}>
          <PineTree scale={0.9} />
        </group>
        <group position={[-3.2, 0, 3.7]}>
          <Bush scale={1.1} />
        </group>
        <group position={[2.6, 0, 4.0]}>
          <Bush scale={0.9} />
        </group>
        {FLOWERS.map(([x, z, c], i) => (
          <group key={i} position={[x, 0, z]}>
            <Flower color={c} scale={1.6} />
          </group>
        ))}

        <group position={[-0.1, 0.02, 2.4]} rotation={[0, 0.6, 0]}>
          <Mascot mood="happy" scale={1.5} />
        </group>
      </group>

      <Sparkles count={50} scale={[14, 7, 14]} size={6} speed={0.4} opacity={0.9} color="#ff9fb4" />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.9}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 2.3}
      />
    </Canvas>
  );
}
