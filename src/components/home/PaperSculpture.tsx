"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
export default function PaperSculpture({ paused = false }: { paused?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 767px)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (!element || media.matches || connection?.saveData || navigator.hardwareConcurrency < 4) return;
    const canvas = document.createElement("canvas");
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      gl = (canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    } catch {
      return;
    }
    if (!gl) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        context: gl,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(38, 1, .1, 50); camera.position.set(0, .4, 9);
    const group = new THREE.Group(); scene.add(group);
    const geometries: THREE.BufferGeometry[] = []; const materials: THREE.Material[] = [];
    const add = (geometry: THREE.BufferGeometry, material: THREE.Material) => { geometries.push(geometry); materials.push(material); const mesh = new THREE.Mesh(geometry, material); group.add(mesh); return mesh; };
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = add(new THREE.TorusGeometry(2.4 + i * .22, .012 + i * .005, 8, 100), new THREE.MeshStandardMaterial({ color: i === 1 ? '#d9b5ff' : '#7c3aed', emissive: '#6d28d9', emissiveIntensity: .55, metalness: .6, roughness: .3 }));
      ring.rotation.set(.7 + i * .6, .4 + i * .4, i * .3); rings.push(ring);
    }
    const satellites: THREE.Mesh[] = [];
    for (let i = 0; i < 9; i++) satellites.push(add(new THREE.OctahedronGeometry(i % 3 === 0 ? .18 : .075, 0), new THREE.MeshStandardMaterial({ color: i % 2 ? '#e9d5ff' : '#a855f7', metalness: .7, roughness: .2, emissive: '#581c87', emissiveIntensity: .4 })));
    const back = add(new THREE.BoxGeometry(2.65, 3.65, .035), new THREE.MeshPhysicalMaterial({ color: '#7340a8', metalness: .35, roughness: .25, transparent: true, opacity: .6 })); back.rotation.z = -.18; back.position.set(.28, -.04, -.5);
    scene.add(new THREE.AmbientLight('#e9d5ff', 2));
    const light = new THREE.PointLight('#d8b4fe', 45); light.position.set(2, 3, 5); scene.add(light);
    const fill = new THREE.PointLight('#a855f7', 25); fill.position.set(-4, -2, 3); scene.add(fill);
    let visible = false; let frame = 0; let elapsed = 0; let last = 0;
    const pointer = { x: 0, y: 0 };
    const draw = (time: number) => {
      if (last) elapsed += Math.min(time - last, 50) / 1000; last = time;
      group.rotation.y += (pointer.x * .25 - group.rotation.y) * .035;
      group.rotation.x += (-pointer.y * .15 - group.rotation.x) * .035;
      rings.forEach((ring, i) => { ring.rotation.z = elapsed * .06 * (i % 2 ? 1 : -1) + i * .5; });
      satellites.forEach((mesh, i) => { const t = elapsed * .1 + i * Math.PI * 2 / 9; mesh.position.set(Math.cos(t) * 2.75, Math.sin(t) * 2.2, Math.sin(t + i) * .6); mesh.rotation.y = elapsed * .2; });
      renderer.render(scene, camera);
      if (visible && !paused && !document.hidden && !media.matches) frame = requestAnimationFrame(draw);
    };
    const restart = () => { cancelAnimationFrame(frame); last = 0; if (visible && !document.hidden) draw(performance.now()); };
    const resize = new ResizeObserver(() => { const { width, height } = element.getBoundingClientRect(); if (!width || !height) return; renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); restart(); }); resize.observe(element);
    const observer = new IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); restart(); }); observer.observe(element);
    const move = (event: PointerEvent) => { const r = element.getBoundingClientRect(); pointer.x = Math.max(-1, Math.min(1, (event.clientX - r.left) / r.width - .5)); pointer.y = Math.max(-1, Math.min(1, (event.clientY - r.top) / r.height - .5)); };
    const parent = element.parentElement; parent?.addEventListener('pointermove', move);
    document.addEventListener('visibilitychange', restart); media.addEventListener('change', restart);
    const lost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frame); renderer.domElement.style.display = 'none'; };
    renderer.domElement.addEventListener('webglcontextlost', lost);
    return () => { cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect(); parent?.removeEventListener('pointermove', move); document.removeEventListener('visibilitychange', restart); media.removeEventListener('change', restart); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); renderer.dispose(); renderer.domElement.remove(); };
  }, [paused]);
  return <div ref={host} className="orbit-webgl" aria-hidden="true" />;
}
