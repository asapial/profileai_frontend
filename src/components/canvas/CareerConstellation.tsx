"use client";

import { useEffect, useMemo, useRef } from "react";
import { PresentationControls, RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import * as THREE from "three";
import { useStoryStore, type TemplateKey } from "@/store/useStoryStore";
import { createResumeTexture } from "@/utils/createResumeTexture";

const NODE_COUNT = 48;
const THREAD_COUNT = 13;
const THREAD_SEGMENTS = 34;
const templateKeys: TemplateKey[] = ["editorial", "technical", "minimal", "grid"];
const selectedSignalList = [1, 3, 5, 8, 11, 14, 17, 20, 24, 28, 33, 39, 44];
const selectedSignals = new Set(selectedSignalList);
const careerSignals: Array<{ index: number; label: string; offset: [number, number, number]; hero: [number, number, number] }> = [
  { index: 3, label: "REACT", offset: [0.85, 0.54, 0.24], hero: [0.05, 1.55, 0.5] },
  { index: 8, label: "AWS CERTIFIED", offset: [-0.95, 0.5, 0.22], hero: [1.75, 1.02, 0.42] },
  { index: 14, label: "LCP ↓31%", offset: [0.96, -0.48, 0.24], hero: [0.05, 0.42, 0.48] },
  { index: 24, label: "LED 5-PERSON TEAM", offset: [-1.04, -0.52, 0.22], hero: [1.75, -0.12, 0.4] },
  { index: 33, label: "DESIGN SYSTEM", offset: [0.96, 0.5, 0.2], hero: [0.05, -0.72, 0.46] },
  { index: 39, label: "PR #412", offset: [-0.9, -0.48, 0.24], hero: [1.75, -1.28, 0.44] },
];

const smooth = (value: number, from: number, to: number) => THREE.MathUtils.smoothstep(value, from, to);

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createTagTexture(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d")!;
  context.scale(0.5, 0.5);
  context.fillStyle = "rgba(20, 11, 38, .86)";
  context.beginPath();
  context.roundRect(5, 5, 1014, 246, 58);
  context.fill();
  context.strokeStyle = "rgba(196, 181, 253, .65)";
  context.lineWidth = 4;
  context.stroke();
  context.fillStyle = "#a78bfa";
  context.beginPath();
  context.arc(88, 128, 17, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#fff8eb";
  context.font = "700 54px Arial";
  context.letterSpacing = "4px";
  context.textBaseline = "middle";
  context.fillText(text, 140, 132);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPanelTexture(eyebrow: string, title: string, lines: string[], accent = "#a78bfa") {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 384;
  const context = canvas.getContext("2d")!;
  context.scale(0.6, 0.6);
  context.fillStyle = "rgba(20, 11, 38, .94)";
  context.beginPath();
  context.roundRect(8, 8, 1264, 624, 58);
  context.fill();
  context.strokeStyle = "rgba(196, 181, 253, .62)";
  context.lineWidth = 5;
  context.stroke();
  context.fillStyle = accent;
  context.font = "700 33px Arial";
  context.letterSpacing = "7px";
  context.fillText(eyebrow.toUpperCase(), 70, 92);
  context.fillStyle = "#fffaf1";
  context.font = "600 60px Georgia";
  context.letterSpacing = "0px";
  context.fillText(title, 70, 182);
  context.fillStyle = "#c8bdd5";
  context.font = "32px Arial";
  lines.forEach((line, index) => context.fillText(line, 70, 280 + index * 62));
  context.fillStyle = accent;
  context.beginPath();
  context.arc(1180, 84, 12, 0, Math.PI * 2);
  context.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function EvidenceTag({ index, label, offset, hero, livePositions, visualProgress }: { index: number; label: string; offset: [number, number, number]; hero: [number, number, number]; livePositions: React.MutableRefObject<THREE.Vector3[]>; visualProgress: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const { viewport } = useThree();
  const texture = useMemo(() => createTagTexture(label), [label]);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame((_, delta) => {
    if (!group.current || !material.current) return;
    const p = visualProgress.current;
    const point = livePositions.current[index];
    if (point) {
      const graphBlend = smooth(p, 0.27, 0.36);
      const heroX = viewport.width < 7 ? hero[0] * 0.52 - 0.45 : hero[0];
      const targetX = THREE.MathUtils.lerp(heroX, point.x + offset[0], graphBlend);
      const targetY = THREE.MathUtils.lerp(hero[1] * (viewport.width < 7 ? 0.72 : 1), point.y + offset[1], graphBlend);
      const targetZ = THREE.MathUtils.lerp(hero[2], point.z + offset[2], graphBlend);
      easing.damp3(group.current.position, [targetX, targetY, targetZ], 0.18, delta);
    }
    const opacity = (1 - smooth(p, 0.235, 0.29)) * (0.68 + smooth(p, 0.015, 0.1) * 0.32);
    material.current.opacity = opacity;
    group.current.scale.setScalar((viewport.width < 7 ? 0.58 : 0.82) + opacity * 0.14);
  });
  return (
    <group ref={group}>
      <mesh renderOrder={10}>
        <planeGeometry args={[1.9, 0.48]} />
        <meshBasicMaterial ref={material} map={texture} transparent depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function SignalField() {
  const root = useRef<THREE.Group>(null);
  const nodes = useRef<THREE.InstancedMesh>(null);
  const nodeMaterial = useRef<THREE.MeshPhysicalMaterial>(null);
  const links = useRef<THREE.LineSegments>(null);
  const linkMaterial = useRef<THREE.LineBasicMaterial>(null);
  const signalPulses = useRef<THREE.InstancedMesh>(null);
  const signalPulseMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const signalHalos = useRef<THREE.InstancedMesh>(null);
  const signalHaloMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const threads = useRef<THREE.LineSegments>(null);
  const threadMaterial = useRef<THREE.LineBasicMaterial>(null);
  const roleField = useRef<THREE.Group>(null);
  const roleMaterials = useRef<THREE.Material[]>([]);
  const privacyRing = useRef<THREE.Mesh>(null);
  const privacyMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const visualProgress = useRef(useStoryStore.getState().scrollProgress);
  const { viewport } = useThree();
  const livePositions = useRef(Array.from({ length: NODE_COUNT }, () => new THREE.Vector3()));
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  const field = useMemo(() => {
    const random = seededRandom(420412);
    const starts: THREE.Vector3[] = [];
    const constellation: THREE.Vector3[] = [];
    const loom: THREE.Vector3[] = [];
    const gravityTargets: Array<THREE.Vector3 | null> = Array.from({ length: NODE_COUNT }, () => null);
    for (let index = 0; index < NODE_COUNT; index += 1) {
      const angle = random() * Math.PI * 2;
      const radius = 1.5 + random() * 2.2;
      starts.push(new THREE.Vector3(
        Math.cos(angle) * radius + (random() - 0.5) * 1.3,
        Math.sin(angle) * radius * 0.72 + (random() - 0.5) * 0.7,
        (random() - 0.5) * 2.6,
      ));
      const arm = index % 4;
      const armAngle = arm * Math.PI * 0.5 + index * 0.12;
      const armRadius = 0.55 + Math.floor(index / 4) * 0.19;
      constellation.push(new THREE.Vector3(
        Math.cos(armAngle) * armRadius,
        Math.sin(armAngle) * armRadius * 0.78,
        Math.sin(index * 1.7) * 0.38,
      ));
      loom.push(new THREE.Vector3(
        -2.85 + (index % 12) * 0.51,
        1.65 - Math.floor(index / 12) * 1.02,
        Math.sin(index * 0.9) * 0.18,
      ));
    }
    selectedSignalList.forEach((signalIndex, rank) => {
      const orbit = rank / selectedSignalList.length * Math.PI * 2;
      gravityTargets[signalIndex] = new THREE.Vector3(0.72 + Math.cos(orbit) * 0.78, Math.sin(orbit) * 0.68, Math.sin(orbit * 2) * 0.28);
    });
    const edges: [number, number][] = [];
    for (let arm = 0; arm < 4; arm += 1) {
      for (let row = 0; row < 11; row += 1) {
        edges.push([arm + row * 4, arm + (row + 1) * 4]);
      }
    }
    edges.push([3, 14], [14, 28], [28, 39], [5, 20], [20, 33], [8, 24]);
    return { starts, constellation, loom, gravityTargets, edges };
  }, []);

  const linkPositions = useMemo(() => new Float32Array(field.edges.length * 6), [field.edges.length]);
  const linkColors = useMemo(() => {
    const values = new Float32Array(field.edges.length * 6);
    const quiet = new THREE.Color("#432d65");
    const verified = new THREE.Color("#d8cced");
    field.edges.forEach(([from, to], index) => {
      const color = selectedSignals.has(from) || selectedSignals.has(to) ? verified : quiet;
      values.set([color.r, color.g, color.b, color.r, color.g, color.b], index * 6);
    });
    return values;
  }, [field.edges]);
  const nodeGeometry = useMemo(() => new THREE.IcosahedronGeometry(0.092, 1), []);

  useFrame((state, delta) => {
    if (!root.current || !nodes.current || !nodeMaterial.current || !links.current || !linkMaterial.current || !threads.current || !threadMaterial.current) return;
    const { scrollProgress: rawProgress, motionEnabled } = useStoryStore.getState();
    const p = motionEnabled ? THREE.MathUtils.damp(visualProgress.current, rawProgress, 10, delta) : rawProgress;
    visualProgress.current = p;
    const constellationIn = smooth(p, 0.09, 0.2);
    const truthConnection = smooth(p, 0.13, 0.24);
    const atomIn = smooth(p, 0.25, 0.34);
    const roleMatch = smooth(p, 0.38, 0.47);
    const workspace = smooth(p, 0.49, 0.55);
    const time = motionEnabled ? state.clock.elapsedTime : 0;
    const desktopTargets = [2.15, -1.55, 1.25, -0.75, 0, 0, 0, 0];
    const scenePosition = Math.min(7, p * 8);
    const sceneIndex = Math.floor(scenePosition);
    const nextSceneIndex = Math.min(7, sceneIndex + 1);
    const sceneBlend = smooth(scenePosition - sceneIndex, 0.52, 0.98);
    const targetX = viewport.width < 7 ? 0 : THREE.MathUtils.lerp(desktopTargets[sceneIndex], desktopTargets[nextSceneIndex], sceneBlend);
    easing.damp3(root.current.position, [targetX, workspace * -0.08, workspace * -0.2], 0.32, delta);
    const pointerX = motionEnabled ? state.pointer.x : 0;
    const pointerY = motionEnabled ? state.pointer.y : 0;
    easing.dampE(root.current.rotation, [0.02 + Math.sin(time * 0.15) * 0.02 - pointerY * 0.025, -0.05 + Math.sin(time * 0.11) * 0.04 + pointerX * 0.05, 0], 0.4, delta);

    for (let index = 0; index < NODE_COUNT; index += 1) {
      const position = livePositions.current[index];
      position.lerpVectors(field.starts[index], field.constellation[index], constellationIn);
      if (selectedSignals.has(index)) {
        position.lerp(field.loom[index], atomIn * (1 - roleMatch));
        position.lerp(field.gravityTargets[index]!, roleMatch);
      } else if (atomIn > 0) {
        position.multiplyScalar(1 + atomIn * 0.28);
      }
      const pulse = 1 + Math.sin(time * 1.5 + index) * 0.08 * (1 - workspace);
      tempObject.position.copy(position);
      const isSelected = selectedSignals.has(index);
      const signalScale = isSelected ? 1.45 + roleMatch * 0.22 : 0.85 * (1 - atomIn * 0.72);
      tempObject.scale.setScalar(signalScale * pulse * (1 - workspace * 0.72));
      tempObject.updateMatrix();
      nodes.current.setMatrixAt(index, tempObject.matrix);
      tempColor.set(isSelected ? (roleMatch > 0.2 ? "#fff8eb" : "#b997ff") : atomIn > 0.2 ? "#3d285d" : index % 3 ? "#6d42a4" : "#d8cced");
      nodes.current.setColorAt(index, tempColor);
    }
    nodes.current.instanceMatrix.needsUpdate = true;
    if (nodes.current.instanceColor) nodes.current.instanceColor.needsUpdate = true;
    nodeMaterial.current.opacity = 1 - workspace * 0.82;
    nodeMaterial.current.emissiveIntensity = 0.36 + roleMatch * 0.48;

    field.edges.forEach(([from, to], edgeIndex) => {
      const a = livePositions.current[from];
      const b = livePositions.current[to];
      const offset = edgeIndex * 6;
      linkPositions[offset] = a.x;
      linkPositions[offset + 1] = a.y;
      linkPositions[offset + 2] = a.z;
      linkPositions[offset + 3] = b.x;
      linkPositions[offset + 4] = b.y;
      linkPositions[offset + 5] = b.z;
    });
    const linkAttribute = links.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    linkAttribute.needsUpdate = true;
    linkMaterial.current.opacity = truthConnection * (1 - atomIn * 0.88) * (0.34 + roleMatch * 0.08);

    const graphEnergy = Math.min(1, truthConnection * (1 - smooth(p, 0.36, 0.43)) + roleMatch * (1 - workspace));
    if (signalPulses.current && signalPulseMaterial.current && graphEnergy > 0.01) {
      for (let index = 0; index < 12; index += 1) {
        const [from, to] = field.edges[(index * 5) % field.edges.length];
        const travel = (time * 0.19 + index * 0.087) % 1;
        tempObject.position.lerpVectors(livePositions.current[from], livePositions.current[to], travel);
        tempObject.scale.setScalar(0.72 + Math.sin(travel * Math.PI) * 0.7);
        tempObject.updateMatrix();
        signalPulses.current.setMatrixAt(index, tempObject.matrix);
      }
      signalPulses.current.instanceMatrix.needsUpdate = true;
      signalPulseMaterial.current.opacity = graphEnergy * 0.92;
      signalPulses.current.visible = true;
    } else if (signalPulses.current) {
      signalPulses.current.visible = false;
    }
    if (signalHalos.current && signalHaloMaterial.current && graphEnergy > 0.01) {
      selectedSignalList.forEach((signalIndex, index) => {
        tempObject.position.copy(livePositions.current[signalIndex]);
        tempObject.quaternion.copy(state.camera.quaternion);
        tempObject.scale.setScalar(0.78 + Math.sin(time * 1.25 + index * 0.8) * 0.1);
        tempObject.updateMatrix();
        signalHalos.current!.setMatrixAt(index, tempObject.matrix);
      });
      signalHalos.current.instanceMatrix.needsUpdate = true;
      signalHaloMaterial.current.opacity = graphEnergy * 0.48;
      signalHalos.current.visible = true;
    } else if (signalHalos.current) {
      signalHalos.current.visible = false;
    }

    const threadOpacity = atomIn * (1 - workspace) * 0.46;
    if (threadOpacity > 0.005) {
      const threadAttribute = threads.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const threadPositions = threadAttribute.array as Float32Array;
      let writeIndex = 0;
      for (let thread = 0; thread < THREAD_COUNT; thread += 1) {
        const threadOffset = Math.sin(thread * 2.1) * 0.035;
        const z = Math.sin(thread * 0.83) * 0.24 * (1 - workspace);
        for (let segment = 0; segment < THREAD_SEGMENTS; segment += 1) {
          const x1 = -3.25 + segment / THREAD_SEGMENTS * 6.5;
          const x2 = -3.25 + (segment + 1) / THREAD_SEGMENTS * 6.5;
          const baseY = 1.8 - thread * 0.3;
          const wave1 = Math.sin(x1 * 1.45 + thread * 0.68 + time * 0.42) * 0.16 * (1 - workspace) + threadOffset;
          const wave2 = Math.sin(x2 * 1.45 + thread * 0.68 + time * 0.42) * 0.16 * (1 - workspace) + threadOffset;
          threadPositions[writeIndex] = x1;
          threadPositions[writeIndex + 1] = baseY + wave1;
          threadPositions[writeIndex + 2] = z;
          threadPositions[writeIndex + 3] = x2;
          threadPositions[writeIndex + 4] = baseY + wave2;
          threadPositions[writeIndex + 5] = z;
          writeIndex += 6;
        }
      }
      threadAttribute.needsUpdate = true;
    }
    threadMaterial.current.opacity = threadOpacity;

    if (roleField.current) {
      roleField.current.visible = roleMatch > 0.01 && workspace < 0.99;
      roleField.current.rotation.z += motionEnabled ? delta * 0.13 : 0;
      roleField.current.rotation.y -= motionEnabled ? delta * 0.09 : 0;
      roleField.current.scale.setScalar(0.65 + roleMatch * 0.45);
      roleMaterials.current.forEach((material) => {
        material.opacity = roleMatch * (1 - workspace) * 0.48;
      });
    }
    if (privacyRing.current && privacyMaterial.current) {
      privacyRing.current.rotation.x = 1.18 + Math.sin(time * 0.22) * 0.08;
      privacyRing.current.rotation.z += motionEnabled ? delta * 0.1 : 0;
      privacyMaterial.current.opacity = roleMatch * (1 - workspace) * 0.3;
    }
  });

  return (
    <group ref={root}>
      <instancedMesh ref={nodes} args={[nodeGeometry, undefined, NODE_COUNT]} frustumCulled={false}>
        <meshPhysicalMaterial ref={nodeMaterial} vertexColors transparent color="#ffffff" emissive="#8b5cf6" emissiveIntensity={0.5} metalness={0.18} roughness={0.18} clearcoat={1} clearcoatRoughness={0.12} />
      </instancedMesh>
      <lineSegments ref={links} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linkPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[linkColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial ref={linkMaterial} vertexColors transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <instancedMesh ref={signalPulses} args={[undefined, undefined, 12]} visible={false} renderOrder={6}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial ref={signalPulseMaterial} color="#fff8eb" transparent opacity={0} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </instancedMesh>
      <instancedMesh ref={signalHalos} args={[undefined, undefined, selectedSignalList.length]} visible={false} renderOrder={5}>
        <ringGeometry args={[0.13, 0.19, 24]} />
        <meshBasicMaterial ref={signalHaloMaterial} color="#a78bfa" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </instancedMesh>
      <lineSegments ref={threads} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(THREAD_COUNT * THREAD_SEGMENTS * 6), 3]} />
        </bufferGeometry>
        <lineBasicMaterial ref={threadMaterial} color="#8b5cf6" transparent opacity={0} depthWrite={false} />
      </lineSegments>

      <group ref={roleField} position={[0.72, 0, 0]} visible={false}>
        {[0, 1, 2].map((index) => (
          <mesh key={index} rotation={[index * 0.62, index * 0.88, index * 0.4]}>
            <torusGeometry args={[0.98 + index * 0.31, 0.018 + index * 0.006, 12, 96]} />
            <meshBasicMaterial ref={(material) => { if (material) roleMaterials.current[index] = material; }} color={index === 1 ? "#fff8eb" : "#8b5cf6"} transparent opacity={0} toneMapped={false} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.28, 32, 32]} />
          <meshPhysicalMaterial color="#9f7aea" emissive="#6d28d9" emissiveIntensity={0.72} metalness={0.08} roughness={0.16} clearcoat={1} clearcoatRoughness={0.08} transparent opacity={0.88} />
        </mesh>
        <mesh scale={1.3}>
          <sphereGeometry args={[0.28, 24, 24]} />
          <meshBasicMaterial color="#c4b5fd" transparent opacity={0.13} side={THREE.BackSide} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      <mesh ref={privacyRing} position={[0, 0, -0.2]}>
        <torusGeometry args={[2.45, 0.045, 16, 140]} />
        <meshStandardMaterial ref={privacyMaterial} color="#c4b5fd" transparent opacity={0} wireframe metalness={0.74} roughness={0.2} />
      </mesh>

      {careerSignals.map((signal) => <EvidenceTag key={signal.label} {...signal} livePositions={livePositions} visualProgress={visualProgress} />)}
    </group>
  );
}

const resumeAtomCopy = [
  { eyebrow: "PROFESSIONAL SUMMARY", title: "Design-minded engineer", lines: ["Clear positioning from verified", "experience and career direction."] },
  { eyebrow: "EXPERIENCE BULLET", title: "Improved LCP by 31%", lines: ["React architecture work connected", "to a measured product outcome."] },
  { eyebrow: "SKILL GROUP", title: "Frontend systems", lines: ["React · Design systems", "Accessibility · Performance"] },
  { eyebrow: "STAR STORY", title: "Led the migration", lines: ["A five-person team moved toward", "shared, accessible patterns."] },
];

function NarrativeObjects() {
  const atomGroups = useRef<(THREE.Group | null)[]>([]);
  const atomMaterials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const jobGroup = useRef<THREE.Group>(null);
  const jobMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const roleLineMaterial = useRef<THREE.LineBasicMaterial>(null);
  const assemblyLineMaterial = useRef<THREE.LineBasicMaterial>(null);
  const pulseMesh = useRef<THREE.InstancedMesh>(null);
  const pulseMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const readyGroup = useRef<THREE.Group>(null);
  const readyMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const visualProgress = useRef(useStoryStore.getState().scrollProgress);
  const { viewport } = useThree();
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const atomTextures = useMemo(() => resumeAtomCopy.map((item) => createPanelTexture(item.eyebrow, item.title, item.lines)), []);
  const jobTexture = useMemo(() => createPanelTexture("TARGET ROLE", "Senior Frontend Engineer", ["React architecture · Design systems", "Leadership · Performance · AWS"], "#fff8eb"), []);
  const readyTexture = useMemo(() => createPanelTexture("SOURCE VERIFIED", "Ready to review", ["Resume · Alignment · Application plan"], "#fff8eb"), []);
  useEffect(() => () => {
    atomTextures.forEach((texture) => texture.dispose());
    jobTexture.dispose();
    readyTexture.dispose();
  }, [atomTextures, jobTexture, readyTexture]);
  const ySlots = [1.35, 0.4, -0.55, -1.5];
  const roleLinePositions = useMemo(() => {
    const values = new Float32Array(4 * 6);
    ySlots.forEach((y, index) => values.set([-0.75, y * 0.58, 0, 0.55, y, 0], index * 6));
    return values;
  }, []);
  const assemblyLinePositions = useMemo(() => {
    const values = new Float32Array(4 * 6);
    ySlots.forEach((y, index) => values.set([-0.7, y, 0, 0.95, y * 0.38, 0], index * 6));
    return values;
  }, []);

  useFrame((state, delta) => {
    const { scrollProgress: rawProgress, motionEnabled } = useStoryStore.getState();
    const p = motionEnabled ? THREE.MathUtils.damp(visualProgress.current, rawProgress, 10, delta) : rawProgress;
    visualProgress.current = p;
    const create = smooth(p, 0.265, 0.34) * (1 - smooth(p, 0.535, 0.575));
    const align = smooth(p, 0.41, 0.48) * (1 - smooth(p, 0.535, 0.575));
    const assemble = smooth(p, 0.7, 0.77) * (1 - smooth(p, 0.87, 0.92));
    const final = smooth(p, 0.87, 0.94);
    const atomOpacity = Math.max(create, assemble);
    const mobile = viewport.width < 7;

    atomGroups.current.forEach((group, index) => {
      const material = atomMaterials.current[index];
      if (!group || !material) return;
      const createdX = mobile ? 0 : 1.65;
      const alignedX = mobile ? 0.4 : 0.25;
      const assemblyX = mobile ? -0.45 : -1.65;
      const stageX = THREE.MathUtils.lerp(createdX, alignedX, align);
      const x = THREE.MathUtils.lerp(stageX, assemblyX, assemble);
      const floatY = motionEnabled ? Math.sin(state.clock.elapsedTime * 0.72 + index * 0.9) * 0.028 * create : 0;
      const y = ySlots[index] * (mobile ? 0.72 : 1) + floatY;
      easing.damp3(group.position, target.set(x, y, index * -0.045), 0.22, delta);
      group.scale.setScalar((mobile ? 0.47 : 0.67) * (0.7 + atomOpacity * 0.3));
      material.opacity = atomOpacity;
      group.visible = atomOpacity > 0.008;
    });

    if (jobGroup.current && jobMaterial.current) {
      const opacity = smooth(p, 0.4, 0.46) * (1 - smooth(p, 0.535, 0.575));
      const floatY = motionEnabled ? Math.sin(state.clock.elapsedTime * 0.58) * 0.035 * opacity : 0;
      easing.damp3(jobGroup.current.position, [mobile ? -0.25 : -1.75, (mobile ? 0 : -0.08) + floatY, 0.25], 0.24, delta);
      jobGroup.current.scale.setScalar((mobile ? 0.5 : 0.76) * (0.78 + opacity * 0.22));
      jobMaterial.current.opacity = opacity;
      jobGroup.current.visible = opacity > 0.008;
    }

    if (roleLineMaterial.current) roleLineMaterial.current.opacity = align * 0.52;
    if (assemblyLineMaterial.current) assemblyLineMaterial.current.opacity = assemble * 0.48;
    const pulseOpacity = Math.max(align, assemble);
    if (pulseMesh.current && pulseMaterial.current && pulseOpacity > 0.008) {
      for (let index = 0; index < 8; index += 1) {
        const row = index % 4;
        const travel = (state.clock.elapsedTime * 0.38 + index * 0.17) % 1;
        const fromX = assemble > align ? -0.7 : -0.75;
        const toX = assemble > align ? 0.95 : 0.55;
        const fromY = ySlots[row] * (assemble > align ? 1 : 0.58);
        const toY = ySlots[row] * (assemble > align ? 0.38 : 1);
        tempObject.position.set(THREE.MathUtils.lerp(fromX, toX, travel), THREE.MathUtils.lerp(fromY, toY, travel), 0.12);
        tempObject.scale.setScalar(0.72 + Math.sin(travel * Math.PI) * 0.55);
        tempObject.updateMatrix();
        pulseMesh.current.setMatrixAt(index, tempObject.matrix);
      }
      pulseMesh.current.instanceMatrix.needsUpdate = true;
      pulseMaterial.current.opacity = pulseOpacity * 0.86;
      pulseMesh.current.visible = true;
    } else if (pulseMesh.current) {
      pulseMesh.current.visible = false;
    }

    if (readyGroup.current && readyMaterial.current) {
      easing.damp3(readyGroup.current.position, [0, mobile ? -1.7 : -2.25, 0.75], 0.24, delta);
      const breathe = motionEnabled ? 1 + Math.sin(state.clock.elapsedTime * 1.1) * 0.025 * final : 1;
      readyGroup.current.scale.setScalar((mobile ? 0.48 : 0.72) * final * breathe);
      readyMaterial.current.opacity = final;
      readyGroup.current.visible = final > 0.008;
    }
  });

  return (
    <group>
      {atomTextures.map((texture, index) => (
        <group key={resumeAtomCopy[index].eyebrow} ref={(node) => { atomGroups.current[index] = node; }} visible={false}>
          <mesh renderOrder={9}>
            <planeGeometry args={[3.15, 1.58]} />
            <meshBasicMaterial ref={(material) => { atomMaterials.current[index] = material; }} map={texture} transparent depthTest={false} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}

      <group ref={jobGroup} visible={false}>
        <mesh renderOrder={8}>
          <planeGeometry args={[3.35, 1.68]} />
          <meshBasicMaterial ref={jobMaterial} map={jobTexture} transparent depthTest={false} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>

      <lineSegments renderOrder={7}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[roleLinePositions, 3]} /></bufferGeometry>
        <lineBasicMaterial ref={roleLineMaterial} color="#fff8eb" transparent opacity={0} depthTest={false} depthWrite={false} />
      </lineSegments>
      <lineSegments renderOrder={7}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[assemblyLinePositions, 3]} /></bufferGeometry>
        <lineBasicMaterial ref={assemblyLineMaterial} color="#a78bfa" transparent opacity={0} depthTest={false} depthWrite={false} />
      </lineSegments>
      <instancedMesh ref={pulseMesh} args={[undefined, undefined, 8]} visible={false} renderOrder={10}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial ref={pulseMaterial} color="#fff8eb" transparent opacity={0} depthTest={false} toneMapped={false} />
      </instancedMesh>

      <group ref={readyGroup} visible={false}>
        <mesh renderOrder={12}>
          <planeGeometry args={[3.6, 1.1]} />
          <meshBasicMaterial ref={readyMaterial} map={readyTexture} transparent depthTest={false} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function DocumentPlane({ texture, accent, materialRef }: { texture: THREE.Texture; accent: string; materialRef?: React.MutableRefObject<THREE.MeshPhysicalMaterial | null> }) {
  return (
    <group>
      <RoundedBox args={[2.7, 3.75, 0.12]} radius={0.08} smoothness={5} castShadow>
        <meshPhysicalMaterial ref={materialRef} map={texture} roughness={0.58} clearcoat={0.2} sheen={0.28} />
      </RoundedBox>
      <mesh position={[-1.3, 0, 0.075]}>
        <boxGeometry args={[0.08, 3.55, 0.055]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.15} metalness={0.45} roughness={0.24} />
      </mesh>
      <mesh position={[1.13, -1.58, 0.085]}>
        <ringGeometry args={[0.08, 0.13, 36]} />
        <meshBasicMaterial color="#7c3aed" toneMapped={false} />
      </mesh>
    </group>
  );
}

function WovenWorkspace() {
  const root = useRef<THREE.Group>(null);
  const panels = useRef<(THREE.Group | null)[]>([]);
  const cursor = useRef<THREE.Group>(null);
  const cursorMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const visualProgress = useRef(useStoryStore.getState().scrollProgress);
  const rootScaleTarget = useMemo(() => new THREE.Vector3(), []);
  const panelTarget = useMemo(() => new THREE.Vector3(), []);
  const panelScaleTarget = useMemo(() => new THREE.Vector3(), []);
  const activeTemplate = useStoryStore((state) => state.activeTemplate);
  const { viewport } = useThree();
  const templateTextures = useMemo(() => templateKeys.map((key) => createResumeTexture(key, 4)), []);
  useEffect(() => () => templateTextures.forEach((texture) => texture.dispose()), [templateTextures]);
  const cursorShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.58);
    shape.lineTo(0, -0.48);
    shape.lineTo(0.22, -0.25);
    shape.lineTo(0.39, -0.52);
    shape.lineTo(0.54, -0.42);
    shape.lineTo(0.36, -0.15);
    shape.lineTo(0.68, -0.12);
    shape.closePath();
    return shape;
  }, []);

  useFrame((state, delta) => {
    if (!root.current) return;
    const rawProgress = useStoryStore.getState().scrollProgress;
    const p = THREE.MathUtils.damp(visualProgress.current, rawProgress, 10, delta);
    visualProgress.current = p;
    const reveal = smooth(p, 0.56, 0.64);
    const fan = smooth(p, 0.59, 0.68);
    const select = smooth(p, 0.65, 0.73);
    const assemble = smooth(p, 0.71, 0.84);
    const final = smooth(p, 0.86, 0.94);
    const docked = useStoryStore.getState().docked;
    root.current.visible = reveal > 0.001;
    const assembledX = THREE.MathUtils.lerp(1.05, 0, assemble);
    const targetX = viewport.width < 7 ? 0 : THREE.MathUtils.lerp(assembledX, 1.6, final);
    easing.damp3(root.current.position, [docked ? 3.8 : targetX, docked ? 1.25 : -0.08, docked ? -4 : 0.2], 0.28, delta);
    const scale = reveal * (docked ? 0.48 : viewport.width < 7 ? 0.58 : 0.82 - final * 0.12);
    root.current.scale.lerp(rootScaleTarget.set(scale, scale, scale), 1 - Math.exp(-delta * 5));
    root.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.17) * 0.025;

    panels.current.forEach((panel, index) => {
      if (!panel) return;
      const selectedIndex = templateKeys.indexOf(activeTemplate);
      const relative = (index - selectedIndex + templateKeys.length) % templateKeys.length;
      const slots = [0, 1.75, -1.75, 3.35];
      let x = slots[relative] * fan;
      const hover = Math.sin(state.clock.elapsedTime * 0.62 + index * 0.8) * 0.028 * (1 - assemble);
      let y = (relative === 0 ? 0.22 : -0.22 - Math.abs(x) * 0.06) * fan + hover;
      let z = (relative === 0 ? 0.85 : -0.35 - Math.abs(x) * 0.08) * fan;
      if (relative === 0) {
        x = THREE.MathUtils.lerp(x, 1.25, assemble);
        x = THREE.MathUtils.lerp(x, 0, final);
        y = THREE.MathUtils.lerp(y, 0.35, final);
        z = THREE.MathUtils.lerp(z, 1.15, final);
      }
      panel.position.lerp(panelTarget.set(x, y, z), 1 - Math.exp(-delta * 6));
      panel.rotation.y = THREE.MathUtils.lerp(0, x * -0.055, fan);
      panel.rotation.z = THREE.MathUtils.lerp(0, x * 0.018, fan);
      const panelScale = relative === 0 ? 1 - final * 0.02 : Math.max(0.001, fan * (1 - assemble));
      panel.scale.lerp(panelScaleTarget.set(panelScale, panelScale, panelScale), 1 - Math.exp(-delta * 7));
    });

    if (cursor.current && cursorMaterial.current) {
      const cursorOpacity = smooth(p, 0.6, 0.64) * (1 - smooth(p, 0.735, 0.77));
      const clickPulse = 1 + Math.sin(select * Math.PI) * 0.18;
      easing.damp3(cursor.current.position, [THREE.MathUtils.lerp(2.8, 0.24, select), THREE.MathUtils.lerp(1.55, 1.15, select), 2.3], 0.18, delta);
      cursor.current.scale.setScalar(0.42 * clickPulse);
      cursorMaterial.current.opacity = cursorOpacity;
      cursor.current.visible = cursorOpacity > 0.008;
    }
  });

  return (
    <PresentationControls global={false} cursor snap speed={1.1} zoom={0.9} polar={[-0.16, 0.16]} azimuth={[-0.3, 0.3]}>
      <group ref={root} visible={false}>
        <mesh position={[0, 0, -0.42]} scale={[1.6, 1.6, 1]}>
          <planeGeometry args={[3.1, 4.2]} />
          <meshBasicMaterial color="#7c3aed" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {templateKeys.map((template, index) => (
          <group key={template} ref={(node) => { panels.current[index] = node; }}>
            <DocumentPlane texture={templateTextures[index]} accent={index === 2 ? "#3b2063" : "#7c3aed"} />
          </group>
        ))}
        <group ref={cursor} visible={false} rotation={[0, 0, -0.18]}>
          <mesh renderOrder={15}>
            <shapeGeometry args={[cursorShape]} />
            <meshBasicMaterial ref={cursorMaterial} color="#fff8eb" transparent opacity={0} depthTest={false} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </PresentationControls>
  );
}

function AmbientDust() {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const random = seededRandom(2026);
    const values = new Float32Array(420 * 3);
    for (let index = 0; index < values.length; index += 3) {
      values[index] = (random() - 0.5) * 18;
      values[index + 1] = (random() - 0.5) * 11;
      values[index + 2] = -2 - random() * 8;
    }
    return values;
  }, []);
  useFrame((state, delta) => {
    if (!points.current || !useStoryStore.getState().motionEnabled) return;
    points.current.rotation.y += delta * 0.006;
    points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.012;
    points.current.position.y = Math.sin(state.clock.elapsedTime * 0.14) * 0.06;
  });
  return (
    <points ref={points}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color="#a78bfa" size={0.025} transparent opacity={0.36} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export function CareerConstellation() {
  return (
    <>
      <AmbientDust />
      <SignalField />
    </>
  );
}
