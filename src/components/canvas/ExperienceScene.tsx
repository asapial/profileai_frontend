"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useStoryStore } from "@/store/useStoryStore";
import { CareerConstellation } from "./CareerConstellation";

function StudioScene() {
  const docked = useStoryStore((s) => s.docked);
  const width = useThree((state) => state.size.width);
  return (
    <>
      <ambientLight intensity={0.35} color="#ede7ff" />
      <Environment resolution={128}>
        <Lightformer intensity={2.4} color="#ffffff" scale={[10, 5, 1]} position={[0, 6, 3]} rotation-x={Math.PI / 2} />
        <Lightformer intensity={1.6} color="#e9d5ff" scale={[6, 6, 1]} position={[-6, 2, 2]} rotation-y={Math.PI / 2} />
        <Lightformer intensity={2.8} color="#c4b5fd" scale={[4, 8, 1]} position={[6, 1, -3]} rotation-y={-Math.PI / 2} />
        <Lightformer intensity={1.2} color="#fff8eb" scale={[3, 3, 1]} position={[0, -4, 4]} rotation-x={-Math.PI / 2} />
      </Environment>
      <CareerConstellation />
      <ContactShadows frames={1} resolution={256} position={[0, -2.5, 0]} opacity={0.28} scale={11} blur={2.8} far={5} color="#1e1038" />
      {width > 900 && !docked ? (
        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={1.1} luminanceSmoothing={0.62} mipmapBlur intensity={0.24} />
        </EffectComposer>
      ) : null}
    </>
  );
}

export function ExperienceScene() {
  const docked = useStoryStore((s) => s.docked);
  const motionEnabled = useStoryStore((s) => s.motionEnabled);
  return (
    <div className={`story-canvas ${docked ? "story-canvas--docked" : ""}`} aria-hidden="true">
      <Canvas frameloop={docked || !motionEnabled ? "demand" : "always"} dpr={[1, 1.4]} performance={{ min: 0.7 }} camera={{ position: [0, 0, 8.6], fov: 38, near: 0.1, far: 80 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
        <StudioScene />
      </Canvas>
    </div>
  );
}
