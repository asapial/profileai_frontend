import * as THREE from "three";
import { createTexturedPuppet } from "./createTexturedPuppet";
import type { MascotMood } from "./AuthMascotContext";

// Retained prototype; password pages now render the approved artwork in AuthPuppet.
// That previous implementation is replaced here by an articulated, volumetric
// character. The comment above records the prior renderer, not the live one.
type Point = { x: number; y: number };
type State = { mood: MascotMood; target: Point | null };
export type AuthPuppetScene = { refresh: () => void; setTheme: (dark: boolean) => void; dispose: () => void };
type Spring = { value: number; velocity: number };

/** Lazy, local-only character rig. The generated room stays visible if WebGL is unavailable. */
export async function createAuthPuppetScene(host: HTMLElement, readState: () => State): Promise<AuthPuppetScene> {
  const rig = await createTexturedPuppet();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2.55, 2.55, 3.4, -3.4, .1, 30);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power" });
  if (!context) throw Error("WebGL2 unavailable");
  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.4 : 1.75));
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.03;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  canvas.dataset.puppetCanvas = "true";
  canvas.setAttribute("aria-hidden", "true");
  host.append(canvas);

  const hemi = new THREE.HemisphereLight(0xfff4ff, 0x5a4056, 1.6);
  const key = new THREE.DirectionalLight(0xfff0e1, 2.8);
  key.position.set(-3, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 5, bottom: -1, near: .1, far: 15 });
  key.shadow.normalBias = .025;
  key.shadow.radius = 4;
  const fill = new THREE.DirectionalLight(0xe2ddff, 1.3);
  fill.position.set(4, 3, 5);
  const rim = new THREE.DirectionalLight(0xecd2ff, 1.9);
  rim.position.set(2, 4, -3);
  scene.add(hemi, key, fill, rim);

  const { root: puppet, torso, neck, head, eyes, pupils, lids, hands } = rig;
  scene.add(puppet);
  const textures = rig.textures;
  const idleHands = hands.map(hand => hand.position.clone());
  const lidSizes = lids.map(lid => lid.scale.y);
  let blinkSeed = 4817;
  const random = () => { blinkSeed = blinkSeed * 16807 % 2147483647; return (blinkSeed - 1) / 2147483646; };
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.3), new THREE.ShadowMaterial({ color: 0x201224, opacity: .21 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .004; shadow.receiveShadow = true; scene.add(shadow);
  const reflection = puppet.clone(true), originals: THREE.Object3D[] = [], reflected: THREE.Object3D[] = [];
  puppet.traverse(node => originals.push(node));
  reflection.traverse(node => {
    reflected.push(node);
    if (node instanceof THREE.Mesh || node instanceof THREE.Points) {
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      const copies = materials.map(material => { const copy = material.clone(); copy.transparent = true; copy.opacity = node instanceof THREE.Points ? .015 : .055; copy.depthWrite = false; copy.alphaTest = 0; return copy; });
      node.material = Array.isArray(node.material) ? copies : copies[0]; node.castShadow = node.receiveShadow = false;
    }
  });
  reflection.scale.y = -.20; scene.add(reflection);
  let stopped = false, visible = true, raf = 0, last = 0, elapsed = 0, blinkStart = -10, nextBlink = 1.7, blinks = 0, lost = false;
  const backgrounds = new Map<string, THREE.Texture>();
  let backgroundURL = "", backgroundVersion = 0;
  function updateBackground() {
    const room = host.closest("[data-auth-art]")?.querySelector<HTMLElement>("[data-auth-room]");
    const url = room ? getComputedStyle(room).backgroundImage.match(/url\(["']?([^"')]+)/)?.[1] : undefined;
    if (!url || url === backgroundURL) return;
    backgroundURL = url; const version = ++backgroundVersion;
    const cached = backgrounds.get(url);
    if (cached) { scene.background = cached; host.dataset.backgroundState = "ready"; return; }
    scene.background = null; host.dataset.backgroundState = "loading";
    new THREE.TextureLoader().load(url, value => {
      if (stopped) { value.dispose(); return; }
      value.colorSpace = THREE.SRGBColorSpace; textures.add(value); backgrounds.set(url, value);
      if (version === backgroundVersion) { scene.background = value; host.dataset.backgroundState = "ready"; request(); }
    }, undefined, () => { if (!stopped && version === backgroundVersion) host.dataset.backgroundState = "fallback"; });
  }
  const yaw: Spring = { value: 0, velocity: 0 }, pitch: Spring = { value: 0, velocity: 0 }, roll: Spring = { value: 0, velocity: 0 }, coverSpring: Spring = { value: 0, velocity: 0 };
  const rigBounds = new THREE.Box3(), corner = new THREE.Vector3();
  let frameCount = 0;
  const projected = new THREE.Vector3(), start = new THREE.Vector3(), end = new THREE.Vector3(), elbow = new THREE.Vector3(), direction = new THREE.Vector3(), pole = new THREE.Vector3();
  const damp = (a: number, b: number, rate: number, dt: number) => THREE.MathUtils.lerp(a, b, reduced.matches ? 1 : 1 - Math.exp(-rate * dt));
  function spring(value: Spring, target: number, dt: number, stiffness = 100, damping = 19) {
    if (reduced.matches) { value.value = target; value.velocity = 0; return target; }
    const steps = Math.ceil(dt / .008), step = dt / steps;
    for (let i = 0; i < steps; i++) { value.velocity += ((target - value.value) * stiffness - value.velocity * damping) * step; value.value += value.velocity * step; }
    return value.value;
  }
  function request() { if (!stopped && visible && !document.hidden && !lost && !raf) raf = requestAnimationFrame(frame); }
  function frame(time: number) {
    raf = 0; if (stopped || lost) return;
    const dt = Math.min(.045, last ? (time - last) / 1000 : .016); last = time; elapsed += dt;
    const state = readState(), masked = state.mood === "cover", rect = host.getBoundingClientRect();
    head.localToWorld(projected.set(0, .85, 0)); projected.project(camera);
    const hx = rect.left + (projected.x + 1) * rect.width / 2, hy = rect.top + (1 - projected.y) * rect.height / 2;
    const target = state.target ?? { x: hx, y: hy };
    const x = reduced.matches ? 0 : THREE.MathUtils.clamp((target.x - hx) / Math.max(innerWidth * .36, 200), -1, 1);
    const y = reduced.matches ? 0 : THREE.MathUtils.clamp((target.y - hy) / Math.max(innerHeight * .38, 200), -1, 1);
    const breathing = reduced.matches ? 0 : Math.sin(elapsed * 1.9);
    neck.rotation.y = spring(yaw, masked ? 0 : x * .38, dt, 78, 16);
    neck.rotation.x = spring(pitch, masked ? -.08 : y * .22, dt, 86, 17);
    neck.rotation.z = spring(roll, masked ? -.025 : -x * .16 + breathing * .009, dt, 72, 15);
    neck.position.y = (1515 - 842) * .00234 + breathing * .012;
    torso.scale.y = 1 + breathing * .009;
    pupils.forEach(pupil => {
      pupil.position.x = damp(pupil.position.x, masked ? 0 : x * .065, 16, dt);
      pupil.position.y = damp(pupil.position.y, masked ? 0 : -y * .075, 16, dt);
      pupil.rotation.y = x * .12; pupil.rotation.x = y * .1;
    });
    if (!reduced.matches && !masked && elapsed >= nextBlink) { blinkStart = elapsed; nextBlink = elapsed + 3.2 + random() * 2; blinks++; }
    const blinkTime = elapsed - blinkStart;
    const blink = !reduced.matches && !masked && blinkTime >= 0 && blinkTime < .18 ? Math.sin(blinkTime / .18 * Math.PI) : 0;
    lids.forEach((lid, index) => {
      lid.visible = blink > .01;
      lid.scale.y = Math.max(.001, lidSizes[index] * blink);
      lid.position.y = lidSizes[index] * (1 - blink);
    });
    const cover = THREE.MathUtils.clamp(spring(coverSpring, masked ? 1 : 0, dt, 145, 24), 0, 1);
    puppet.updateMatrixWorld(true);
    hands.forEach((hand, index) => {
      const sign = index === 0 ? -1 : 1;
      eyes[index].getWorldPosition(end); puppet.worldToLocal(end); end.z += .25; end.y += .015;
      const idleX = idleHands[index].x + (reduced.matches ? 0 : Math.sin(elapsed * 1.7 + index) * .012);
      hand.position.x = THREE.MathUtils.lerp(idleX, end.x, cover);
      hand.position.y = THREE.MathUtils.lerp(idleHands[index].y + breathing * .008, end.y, cover);
      hand.position.z = THREE.MathUtils.lerp(idleHands[index].z, end.z, cover);
      hand.rotation.set(cover * -.08, sign * cover * -.10, sign * cover * Math.PI);
      hand.scale.setScalar(THREE.MathUtils.lerp(1, 1.12, cover));
      start.copy(rig.shoulders[index]); start.y += breathing * .01;
      end.copy(hand.position); end.y += THREE.MathUtils.lerp(.15, -.15, cover);
      direction.subVectors(end, start); const distance = Math.max(.001, direction.length()); direction.normalize();
      pole.set(sign * 1, -.12, -.15).addScaledVector(direction, -pole.dot(direction)).normalize();
      elbow.copy(start).addScaledVector(direction, distance * .48).addScaledVector(pole, THREE.MathUtils.lerp(.055, .27, cover));
      rig.updateArm(index, start, elbow, end);
    });
    for (let i = 1; i < originals.length; i++) { reflected[i].position.copy(originals[i].position); reflected[i].quaternion.copy(originals[i].quaternion); reflected[i].scale.copy(originals[i].scale); }
    renderer.render(scene, camera);
    host.dataset.renderState = "ready";
    host.dataset.headYaw = neck.rotation.y.toFixed(4); host.dataset.headPitch = neck.rotation.x.toFixed(4); host.dataset.headRoll = neck.rotation.z.toFixed(4);
    host.dataset.handCover = cover.toFixed(4); host.dataset.blinks = String(blinks);
    host.dataset.rig = "articulated-3d";
    host.dataset.rigFrames = String(++frameCount);
    if (frameCount % 15 === 1) {
      rigBounds.setFromObject(puppet);
      let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
      for (const x of [rigBounds.min.x, rigBounds.max.x]) for (const y of [rigBounds.min.y, rigBounds.max.y]) for (const z of [rigBounds.min.z, rigBounds.max.z]) {
        corner.set(x, y, z).project(camera);
        left = Math.min(left, (corner.x + 1) / 2); right = Math.max(right, (corner.x + 1) / 2);
        top = Math.min(top, (1 - corner.y) / 2); bottom = Math.max(bottom, (1 - corner.y) / 2);
      }
      host.dataset.meshBounds = [left, top, right, bottom].map(value => value.toFixed(4)).join(",");
    }
    if (!reduced.matches || Math.abs(cover - (masked ? 1 : 0)) > .001) request();
  }
  function resize() {
    const rect = host.getBoundingClientRect(); if (!rect.width || !rect.height) return;
    const height = 6.8, width = height * rect.width / rect.height;
    camera.left = -width / 2; camera.right = width / 2; camera.top = height / 2; camera.bottom = -height / 2;
    const floor = .767, center = (floor - .5) * height;
    camera.position.set(0, center, 8); camera.lookAt(0, center, 0); camera.updateProjectionMatrix();
    puppet.position.x = width * .04; reflection.position.x = puppet.position.x;
    renderer.setSize(rect.width, rect.height, false); updateBackground(); request();
  }
  function setTheme(dark: boolean) {
    hemi.intensity = dark ? 1.35 : 1.6; key.intensity = dark ? 3.1 : 2.8; fill.intensity = dark ? 1.05 : 1.3;
    renderer.toneMappingExposure = dark ? .96 : 1.03; updateBackground(); request();
  }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  const intersection = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? true;
    if (!visible) { cancelAnimationFrame(raf); raf = 0; } else { last = 0; request(); }
  }); intersection.observe(host);
  const onVisibility = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else { last = 0; request(); } };
  const onPreference = () => { last = 0; request(); };
  const onLost = (event: Event) => { event.preventDefault(); lost = true; cancelAnimationFrame(raf); raf = 0; host.dataset.renderState = "fallback"; host.dataset.rig = "fallback"; };
  const onRestored = () => { lost = false; last = 0; request(); };
  document.addEventListener("visibilitychange", onVisibility);
  reduced.addEventListener("change", onPreference);
  canvas.addEventListener("webglcontextlost", onLost); canvas.addEventListener("webglcontextrestored", onRestored);
  resize();
  return {
    refresh: request, setTheme,
    dispose() {
      stopped = true; cancelAnimationFrame(raf); resizeObserver.disconnect(); intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility); reduced.removeEventListener("change", onPreference);
      canvas.removeEventListener("webglcontextlost", onLost); canvas.removeEventListener("webglcontextrestored", onRestored);
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
      scene.traverse(node => { if (node instanceof THREE.Mesh || node instanceof THREE.Points) { geometries.add(node.geometry); (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => materials.add(material)); } });
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); textures.forEach(value => value.dispose());
      renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    },
  };
}
