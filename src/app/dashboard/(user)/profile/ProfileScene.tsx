"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ProfileScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2", { alpha: true, antialias: true }) ??
      canvas.getContext("webgl", { alpha: true, antialias: true });

    // WebGL can be disabled by browser settings, GPU policy, remote desktop,
    // or a sandbox. Keep the decorative CSS background in those environments
    // instead of asking Three.js to construct a renderer that will throw.
    if (!context) {
      mount.dataset.webgl = "unavailable";
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 7;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        context: context as WebGLRenderingContext,
        alpha: true,
        antialias: true,
      });
    } catch {
      mount.dataset.webgl = "unavailable";
      context.getExtension("WEBGL_lose_context")?.loseContext();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);
    const geometry = new THREE.IcosahedronGeometry(2.15, 2);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x8b5cf6,
      emissive: 0x312e81,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.25,
      transparent: true,
      opacity: 0.72,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    const pointsGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(120 * 3);
    for (let i = 0; i < positions.length; i += 3) {
      const radius = 2.6 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
    }
    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pointsMaterial = new THREE.PointsMaterial({ color: 0xc4b5fd, size: 0.045, transparent: true, opacity: 0.75 });
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    group.add(points);

    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const light = new THREE.PointLight(0xa78bfa, 15);
    light.position.set(3, 3, 4);
    scene.add(light);

    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let frame = 0;
    const animate = () => {
      if (!reducedMotion) {
        group.rotation.y += 0.0025;
        group.rotation.x = Math.sin(Date.now() * 0.00035) * 0.12;
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      geometry.dispose();
      material.dispose();
      pointsGeometry.dispose();
      pointsMaterial.dispose();
      renderer.dispose();
      context.getExtension("WEBGL_lose_context")?.loseContext();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />;
}
