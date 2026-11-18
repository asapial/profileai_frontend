import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import { GALLERY_DEPTHS, GALLERY_FRAME, GALLERY_POSITIONS, GALLERY_SCALES, galleryCenter, galleryLayout, galleryState, type GalleryRect } from "@/lib/career-gallery";
import { HOME_TEMPLATES } from "@/lib/home-templates";
import { DEFAULT_ASSEMBLY_REGIONS, assemblyState, type AssemblyRegions } from "@/lib/career-assembly";
import { PREVIEW_PODIUM, PREVIEW_RISE, PREVIEW_YAW, RESUME_A4, previewRoomState, previewState, previewView } from "@/lib/career-preview";
import { clamp01, smoothstep } from "@/lib/career-cinema";

export type GallerySceneFrame = {
  p: number; width: number; height: number; selected: string; incoming: GalleryRect;
  outgoing?: GalleryRect; calm: boolean; regions?: AssemblyRegions;
};
export type TemplateGalleryScene = {
  update: (frame: GallerySceneFrame) => void;
  setTheme: (dark: boolean) => void;
  dispose: () => void;
};

/** One lazy, on-demand WebGL scene. Paper pixels come from the real catalog;
 * the mirror, lighting and shadows remain live geometry rather than a backdrop. */
export function createTemplateGalleryScene(canvas: HTMLCanvasElement, images: (HTMLImageElement | HTMLCanvasElement)[], onChoose: (id: string) => void): TemplateGalleryScene | null {
  const context = canvas.getContext("webgl2", { alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: "low-power" });
  if (!context) return null;
  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  camera.position.set(0, 3.6, 14); camera.lookAt(0, 2.1, 0);
  const environment = new THREE.HemisphereLight("#eadfff", "#291d43", .65);
  const key = new THREE.DirectionalLight("#e7dcff", 1.2); key.position.set(-5, 9, 8);
  const rim = new THREE.DirectionalLight("#a39aff", 1.5); rim.position.set(8, 5, -6);
  scene.add(environment, key, rim);
  // A dimensional studio continues behind gallery, assembly and export. Its
  // real arch and fluting also appear in the existing planar floor reflection.
  const studio = new THREE.Group(); scene.add(studio);
  const studioFace = new THREE.MeshStandardMaterial({ color: "#35233f", metalness: .24, roughness: .48 });
  const studioFlute = new THREE.MeshStandardMaterial({ color: "#51355f", metalness: .35, roughness: .38 });
  const studioWall = new THREE.MeshStandardMaterial({ color: "#17131f", roughness: .9 });
  const archShape = new THREE.Shape(); archShape.moveTo(-7, 0); archShape.lineTo(7, 0); archShape.lineTo(7, 12); archShape.lineTo(-7, 12); archShape.closePath();
  const archOpening = new THREE.Path(); archOpening.moveTo(-3.5, 0); archOpening.lineTo(-3.5, 4.2); archOpening.absarc(0, 4.2, 3.5, Math.PI, 0, true); archOpening.lineTo(3.5, 0); archOpening.closePath(); archShape.holes.push(archOpening);
  const arch = new THREE.Mesh(new THREE.ExtrudeGeometry(archShape, { depth: .7, bevelEnabled: true, bevelSize: .12, bevelThickness: .12, bevelSegments: 3, steps: 1 }), studioFace);
  arch.position.set(7, 0, -10); arch.rotation.y = -.15; studio.add(arch);
  for (let i = 0; i < 14; i++) {
    const flute = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 10, 12), studioFlute);
    flute.position.set(10.6 + i * .28, 5, -8.3 + i * .042); studio.add(flute);
  }
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(100, 40), studioWall); backWall.position.set(0, 13, -16); studio.add(backWall);
  const studioLight = new THREE.PointLight("#bb7fe7", 65, 25, 2); studioLight.position.set(5, 5, -3); studio.add(studioLight);
  canvas.dataset.room = "physical-studio";
  const poolLights = [0, -5, 5].map((x, index) => {
    const light = new THREE.PointLight("#9c52ff", index === 0 ? 24 : 9, 12, 2);
    light.position.set(x, .55, index === 0 ? .7 : -.5); scene.add(light); return light;
  });

  const reflector = new Reflector(new THREE.PlaneGeometry(44, 46), { clipBias: .003, textureWidth: 1024, textureHeight: 768, multisample: 1, color: "#aa8ae2" });
  reflector.rotation.x = -Math.PI / 2; reflector.position.set(0, -.004, 3); scene.add(reflector);
  const mirror = reflector.material as THREE.ShaderMaterial;
  mirror.transparent = true;
  mirror.uniforms.uStrength = { value: .36 };
  mirror.uniforms.uGround = { value: new THREE.Color("#0d061e") };
  mirror.uniforms.uTint = { value: new THREE.Color("#aa78ed") };
  mirror.uniforms.uReveal = { value: 0 };
  mirror.uniforms.uFalloff = { value: .7 };
  mirror.vertexShader = mirror.vertexShader.replace("varying vec4 vUv;", "varying vec4 vUv; varying vec3 vFloorWorld;")
    .replace("vUv = textureMatrix * vec4( position, 1.0 );", "vUv = textureMatrix * vec4( position, 1.0 ); vFloorWorld = (modelMatrix * vec4(position,1.0)).xyz;");
  mirror.fragmentShader = mirror.fragmentShader.replace("varying vec4 vUv;", "varying vec4 vUv; varying vec3 vFloorWorld; uniform float uStrength; uniform vec3 uGround; uniform vec3 uTint; uniform float uReveal; uniform float uFalloff;")
    .replace("vec4 base = texture2DProj( tDiffuse, vUv );", `vec2 spread=vec2(.0008,.0013)*vUv.w;
      vec4 base=texture2DProj(tDiffuse,vUv)*.4;
      base+=texture2DProj(tDiffuse,vUv+vec4(spread.x,spread.y,0.,0.))*.15;
      base+=texture2DProj(tDiffuse,vUv+vec4(-spread.x,spread.y,0.,0.))*.15;
      base+=texture2DProj(tDiffuse,vUv+vec4(spread.x,-spread.y,0.,0.))*.15;
      base+=texture2DProj(tDiffuse,vUv+vec4(-spread.x,-spread.y,0.,0.))*.15;`)
    .replace("gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );", `float fade=exp(-max(vFloorWorld.z-.15,0.0)*uFalloff);
      vec3 reflected=mix(base.rgb,base.rgb*uTint,.4);
      float haze=smoothstep(-19.0,-4.0,vFloorWorld.z);
      gl_FragColor=vec4(mix(uGround,reflected,uStrength*fade),uReveal*haze);`);
  mirror.needsUpdate = true;
  const lacquerMaterial = new THREE.MeshPhysicalMaterial({ color: "#1d0e36", metalness: .22, roughness: .26, clearcoat: 1, clearcoatRoughness: .15, transparent: true, opacity: .07, depthWrite: false });
  const lacquer = new THREE.Mesh(new THREE.PlaneGeometry(44, 46), lacquerMaterial);
  lacquer.rotation.x = -Math.PI / 2; lacquer.position.set(0, .002, 3); scene.add(lacquer);
  const vertices: number[] = [];
  for (let value = -20; value <= 20; value += 1.6) vertices.push(-22, .009, value, 22, .009, value, value, .009, -20, value, .009, 24);
  const gridGeometry = new THREE.BufferGeometry(); gridGeometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  const gridMaterial = new THREE.LineBasicMaterial({ color: "#6b45b4", transparent: true, opacity: .17, depthWrite: false });
  scene.add(new THREE.LineSegments(gridGeometry, gridMaterial));
  const traceMaterial = new THREE.LineBasicMaterial({ color: "#b377ff", transparent: true, opacity: .32, depthWrite: false });
  const nodeMaterial = new THREE.MeshBasicMaterial({ color: "#b58aff", transparent: true });
  for (let index = 0; index < 6; index++) {
    const x = -10 + index * 3.6;
    const points = [[x, -2], [x + 1.2, .8], [x - .6, 3.8], [x + 1.4, 7.5]].map(([px, pz]) => new THREE.Vector3(px!, .015, pz!));
    const curve = new THREE.CatmullRomCurve3(points);
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(30)), traceMaterial));
    for (const point of points.slice(1, 3)) { const node = new THREE.Mesh(new THREE.SphereGeometry(.028, 8, 8), nodeMaterial); node.position.copy(point); scene.add(node); }
  }

  const shadowCanvas = document.createElement("canvas"); shadowCanvas.width = 256; shadowCanvas.height = 128;
  const shadowContext = shadowCanvas.getContext("2d")!; shadowContext.scale(1, .5);
  const shadowGradient = shadowContext.createRadialGradient(128, 128, 3, 128, 128, 124);
  shadowGradient.addColorStop(0, "rgba(0,0,0,.85)"); shadowGradient.addColorStop(.4, "rgba(0,0,0,.5)"); shadowGradient.addColorStop(1, "rgba(0,0,0,0)");
  shadowContext.fillStyle = shadowGradient; shadowContext.fillRect(0, 0, 256, 256);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const glowCanvas = document.createElement("canvas"); glowCanvas.width = 512; glowCanvas.height = 724;
  const glowContext = glowCanvas.getContext("2d")!;
  glowContext.strokeStyle = "#bd82ff"; glowContext.lineWidth = 7; glowContext.shadowColor = "#a85cff"; glowContext.shadowBlur = 28; // taste-skill-ignore: User-approved illuminated edge on the standing physical paper.
  glowContext.beginPath(); glowContext.roundRect(30, 30, 452, 664, 13); glowContext.stroke();
  const glowTexture = new THREE.CanvasTexture(glowCanvas); glowTexture.colorSpace = THREE.SRGBColorSpace;
  const podium = new THREE.Group();
  const podiumSide = new THREE.MeshStandardMaterial({ color: "#46305e", metalness: .55, roughness: .38, transparent: true });
  const podiumTop = new THREE.MeshStandardMaterial({ color: "#372347", metalness: .28, roughness: .42, transparent: true });
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(PREVIEW_PODIUM.radius, PREVIEW_PODIUM.radius, PREVIEW_PODIUM.height, 96), [podiumSide, podiumTop, podiumSide]);
  podium.add(pedestal);
  const podiumRim = new THREE.MeshBasicMaterial({ color: "#c48bff", transparent: true, toneMapped: false });
  const lip = new THREE.Mesh(new THREE.TorusGeometry(PREVIEW_PODIUM.radius, .011, 8, 96), podiumRim);
  lip.rotation.x = Math.PI / 2; lip.position.y = PREVIEW_PODIUM.height / 2 + .004; podium.add(lip);
  const baseRim = new THREE.Mesh(new THREE.TorusGeometry(PREVIEW_PODIUM.radius, .006, 6, 96), podiumRim);
  baseRim.rotation.x = Math.PI / 2; baseRim.position.y = -PREVIEW_PODIUM.height / 2 + .01; podium.add(baseRim);
  const podiumShadow = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity: .6, depthWrite: false }));
  podiumShadow.rotation.x = -Math.PI / 2; podiumShadow.position.y = .012;
  const previewTrails = new THREE.Group();
  const trailMaterial = new THREE.LineBasicMaterial({ color: "#bb7cff", transparent: true, depthWrite: false });
  for (let index = 0; index < 2; index++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.1, .52, -.25), new THREE.Vector3(-2.3 - index * .1, 1.25 + index * .18, -.45),
      new THREE.Vector3(0, 1.65 + index * .24, -.7), new THREE.Vector3(2.15 + index * .15, 1.12, -.4), new THREE.Vector3(1.9, .5, -.2),
    ]);
    previewTrails.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(64)), trailMaterial));
  }
  scene.add(podium, podiumShadow, previewTrails);
  canvas.dataset.paperMm = "210x297";
  canvas.dataset.paperAspect = String(RESUME_A4.worldWidth / RESUME_A4.worldHeight);
  const textures = images.map((image) => { const texture = new THREE.Texture(image); texture.needsUpdate = true; texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return texture; });
  const cards = HOME_TEMPLATES.map((template, index) => {
    const group = new THREE.Group(); group.userData.slug = template.slug;
    const shellMaterial = new THREE.MeshStandardMaterial({ color: "#292139", metalness: .45, roughness: .32 });
    const shell = new THREE.Mesh(new THREE.BoxGeometry(3.23, 4.53, .075), shellMaterial); group.add(shell);
    const paperMaterial = new THREE.MeshBasicMaterial({ map: textures[index], toneMapped: false, transparent: true });
    const assemblyUniforms = {
      uAssemblyRects: { value: DEFAULT_ASSEMBLY_REGIONS.map((region) => new THREE.Vector4(region.x, region.y, region.width, region.height)) },
      uAssemblyProgress: { value: [1,1,1,1,1] }, uAssemblyMix: { value: 0 },
    };
    paperMaterial.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, assemblyUniforms);
      shader.fragmentShader = "uniform vec4 uAssemblyRects[5]; uniform float uAssemblyProgress[5]; uniform float uAssemblyMix;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>
        #ifdef USE_MAP
        vec2 paperUv=vec2(vMapUv.x,1.0-vMapUv.y);
        for(int i=0;i<5;i++){
          vec4 section=uAssemblyRects[i];
          if(paperUv.x>=section.x&&paperUv.x<=section.x+section.z&&paperUv.y>=section.y&&paperUv.y<=section.y+section.w){
            diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.0),uAssemblyMix*(1.0-uAssemblyProgress[i])*.18);
          }
        }
        #endif`);
    };
    paperMaterial.customProgramCacheKey = () => "profileai-live-assembly-v1";
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(RESUME_A4.worldWidth, RESUME_A4.worldHeight), paperMaterial); paper.position.z = .044; group.add(paper);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3.29, 4.59, .09)), new THREE.LineBasicMaterial({ color: "#c58fff", transparent: true })); group.add(edge);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(3.65, 5.05), new THREE.MeshBasicMaterial({ map: glowTexture, transparent: true, depthWrite: false, opacity: .95, toneMapped: false })); glow.position.z = -.042; group.add(glow);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.7), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity: .7, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .018; // taste-skill-ignore: Contact shadow belongs to the requested physical floor rendering.
    scene.add(group, shadow);
    return { group, shell, edge, glow, shadow, shellMaterial, paperMaterial, assemblyUniforms };
  });
  let dark = document.documentElement.classList.contains("dark");
  let dirty = true, previousP = -1, width = 0, height = 0, previousSelected = "", selectionStarted = 0;
  let previousRegions: AssemblyRegions | undefined;
  let origins = cards.map(() => ({ position: new THREE.Vector3(), scale: new THREE.Vector3(1, 1, 1), yaw: 0 }));
  const screenWorld = (point: { x: number; y: number }) => {
    const ray = new THREE.Vector3(point.x / width * 2 - 1, 1 - point.y / height * 2, .5).unproject(camera).sub(camera.position).normalize();
    return camera.position.clone().addScaledVector(ray, -camera.position.z / ray.z);
  };
  const rectTransform = (rect: GalleryRect) => {
    const center = galleryCenter(rect), world = screenWorld(center);
    const left = screenWorld({ x: rect.x, y: center.y }), right = screenWorld({ x: rect.x + rect.width, y: center.y });
    const top = screenWorld({ x: center.x, y: rect.y }), bottom = screenWorld({ x: center.x, y: rect.y + rect.height });
    return { position: world, scale: new THREE.Vector3((right.x - left.x) / GALLERY_FRAME.width, (top.y - bottom.y) / GALLERY_FRAME.height, 1) };
  };
  const setTheme = (next: boolean) => {
    dark = next; dirty = true;
    const background = dark ? "#10121e" : "#f4f5fa";
    scene.fog = new THREE.Fog(background, 23, 48);
    environment.color.set(dark ? "#eadfff" : "#ffffff"); environment.groundColor.set(dark ? "#291d43" : "#8d859d"); environment.intensity = dark ? .65 : 2.6;
    key.intensity = dark ? 1.2 : 2.4;
    studioFace.color.set(dark ? "#35233f" : "#ab95b7");
    studioFlute.color.set(dark ? "#51355f" : "#a48ab4");
    studioWall.color.set(dark ? "#17131f" : "#e8e2ed");
    studioLight.intensity = dark ? 65 : 40;
    mirror.uniforms.uStrength!.value = dark ? .36 : .25;
    (mirror.uniforms.uGround!.value as THREE.Color).set(dark ? "#0d061e" : "#ede9f6");
    (mirror.uniforms.uTint!.value as THREE.Color).set(dark ? "#aa78ed" : "#e3d8f7");
    lacquerMaterial.color.set(dark ? "#1d0e36" : "#e8dff5");
    gridMaterial.color.set(dark ? "#6b45b4" : "#9273bb"); traceMaterial.color.set(dark ? "#b377ff" : "#a992cd");
    cards.forEach((card) => { card.shellMaterial.color.set(dark ? "#292139" : "#b7abc9"); card.edge.material.color.set(dark ? "#c58fff" : "#7140d4"); });
    podiumSide.color.set(dark ? "#46305e" : "#c0a3df"); podiumTop.color.set(dark ? "#372347" : "#e9dff5");
    podiumRim.color.set(dark ? "#d2a4ff" : "#8950ca"); trailMaterial.color.set(dark ? "#bb7cff" : "#a06fd2");
  };
  setTheme(dark);
  let pointerStart: { x: number; y: number } | null = null;
  const begin = (event: PointerEvent) => { pointerStart = { x: event.clientX, y: event.clientY }; };
  const cancel = () => { pointerStart = null; };
  const choose = (event: PointerEvent) => {
    const start = pointerStart; pointerStart = null;
    if (!start || previousP > 5.42 || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12) return;
    const bounds = canvas.getBoundingClientRect();
    const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2), camera);
    const hit = ray.intersectObjects(cards.filter((card) => card.group.visible).map((card) => card.group), true)[0];
    if (!hit) return;
    let node: THREE.Object3D = hit.object;
    while (node.parent && !node.userData.slug) node = node.parent;
    if (typeof node.userData.slug === "string") onChoose(node.userData.slug);
  };
  canvas.addEventListener("pointerdown", begin);
  canvas.addEventListener("pointercancel", cancel);
  canvas.addEventListener("pointerup", choose);

  return {
    setTheme,
    update(frame) {
      const state = galleryState(frame.p), assembled = assemblyState(frame.p), preview = previewState(frame.p), room = previewRoomState(frame.p);
      if (room.presence <= .001) return;
      const layout = galleryLayout(frame.width, frame.height), view = previewView(frame.width, frame.height, frame.p);
      if (width !== frame.width || height !== frame.height) {
        width = frame.width; height = frame.height; dirty = true;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 600 ? 1.25 : 1.5)); renderer.setSize(width, height, false);
      }
      const eyeY = view.eyeY ?? 3.6;
      camera.position.set(0, eyeY, 14); camera.lookAt(0, eyeY - 1.5, 0); camera.updateMatrixWorld();
      camera.aspect = width / height; camera.zoom = view.zoom; camera.setViewOffset(width, height, -view.shiftX, -view.shiftY, width, height); camera.updateProjectionMatrix();
      if (frame.regions !== previousRegions) { previousRegions = frame.regions; dirty = true; }
      const now = performance.now();
      if (frame.selected !== previousSelected) {
        origins = cards.map((card) => ({ position: card.group.position.clone(), scale: card.group.scale.clone(), yaw: card.group.rotation.y }));
        selectionStarted = previousSelected && state.presence > .98 && !frame.calm ? now : 0;
        previousSelected = frame.selected; dirty = true;
      }
      const animation = selectionStarted ? smoothstep(clamp01((now - selectionStarted) / 650)) : 1;
      if (selectionStarted && animation === 1) { selectionStarted = 0; dirty = true; }
      if (!dirty && Math.abs(frame.p - previousP) < .0001 && animation === 1) return;
      dirty = false; previousP = frame.p;
      const selected = Math.max(0, HOME_TEMPLATES.findIndex((template) => template.slug === frame.selected));
      const start = rectTransform(frame.incoming);
      const incomingOpacity = smoothstep(clamp01((state.arrive - .28) / .65));
      cards.forEach((card, index) => {
        let offset = index - selected; if (offset > 3) offset -= 7; if (offset < -3) offset += 7;
        const distance = Math.abs(offset), sign = Math.sign(offset), scale = GALLERY_SCALES[distance]!;
        card.group.visible = distance <= layout.visibleRadius && (distance === 0 || assembled.arrive < .999); card.shadow.visible = card.group.visible;
        if (!card.group.visible) return;
        const rest = new THREE.Vector3(sign * GALLERY_POSITIONS[distance]!, 4.53 * scale / 2 + .035, GALLERY_DEPTHS[distance]!);
        const targetScale = new THREE.Vector3(scale, scale, scale);
        const position = rest.clone();
        let yaw = -sign * distance * .12;
        if (distance === 0) {
          position.copy(start.position).lerp(rest, state.arrive);
          targetScale.copy(start.scale).lerp(new THREE.Vector3(1, 1, 1), state.arrive);
          position.y += PREVIEW_RISE * preview.arrive;
          yaw = PREVIEW_YAW * preview.arrive;
        } else {
          const fan = smoothstep(clamp01((state.arrive - .2 - distance * .05) / (.8 - distance * .05)));
          position.copy(start.position).lerp(rest, fan);
          targetScale.multiplyScalar(.16 + .84 * fan);
          position.x += sign * assembled.arrive * 1.6;
          targetScale.multiplyScalar(1 - assembled.arrive * .22);
        }
        const origin = origins[index]!;
        if (animation < 1 && state.arrive > .98) { position.lerpVectors(origin.position, position, animation); targetScale.lerpVectors(origin.scale, targetScale, animation); yaw = origin.yaw + (yaw - origin.yaw) * animation; }
        card.group.position.copy(position); card.group.scale.copy(targetScale); card.group.rotation.y = yaw;
        const paperOpacity = incomingOpacity * (distance === 0 ? 1 : 1 - assembled.arrive);
        card.paperMaterial.opacity = paperOpacity;
        card.shellMaterial.transparent = true; card.shellMaterial.opacity = paperOpacity;
        card.shellMaterial.color.set(dark ? "#292139" : "#b7abc9").lerp(new THREE.Color("#f4eef9"), distance === 0 ? preview.arrive : 0);
        card.shell.scale.set(1 + (RESUME_A4.worldWidth / 3.23 - 1) * preview.arrive, 1 + (RESUME_A4.worldHeight / 4.53 - 1) * preview.arrive, 1);
        card.assemblyUniforms.uAssemblyMix.value = distance === 0 ? assembled.arrive * (1 - assembled.depart) : 0;
        card.assemblyUniforms.uAssemblyProgress.value = assembled.sections;
        card.assemblyUniforms.uAssemblyRects.value.forEach((value, part) => {
          const region = frame.regions?.[part] ?? DEFAULT_ASSEMBLY_REGIONS[part]!;
          value.set(region.x, region.y, region.width, region.height);
        });
        card.edge.visible = distance === 0; card.edge.material.opacity = incomingOpacity * (1 - preview.arrive);
        card.glow.visible = distance === 0; card.glow.material.opacity = (dark ? .95 : .25) * incomingOpacity * (1 - preview.arrive);
        card.shadow.position.set(position.x, .018 + PREVIEW_PODIUM.height * preview.arrive, position.z + .1); card.shadow.scale.copy(targetScale); card.shadow.scale.x *= 1 - preview.arrive * .25;
        card.shadow.material.opacity = (dark ? .7 : .45) * room.floor * (distance === 0 ? 1 : 1 - assembled.arrive);
      });
      podium.visible = preview.arrive > .001; podiumShadow.visible = podium.visible; previewTrails.visible = podium.visible;
      podium.scale.y = Math.max(.001, preview.arrive); podium.position.y = PREVIEW_PODIUM.height / 2 * preview.arrive;
      const podiumOpacity = smoothstep(clamp01(preview.arrive / .3));
      podiumSide.opacity = podiumOpacity; podiumTop.opacity = podiumOpacity; podiumRim.opacity = podiumOpacity * (dark ? .95 : .8);
      podiumShadow.material.opacity = (dark ? .7 : .5) * podiumOpacity * room.floor;
      trailMaterial.opacity = (dark ? .6 : .4) * preview.arrive;
      canvas.dataset.podium = preview.arrive > .99 ? "raised" : preview.arrive > .001 ? "rising" : "hidden";
      canvas.dataset.paperLift = (PREVIEW_RISE * preview.arrive).toFixed(5);
      mirror.uniforms.uReveal!.value = room.floor;
      mirror.uniforms.uStrength!.value = (dark ? .36 : .25) + (dark ? .04 : .15) * preview.arrive;
      mirror.uniforms.uFalloff!.value = .7 - .43 * preview.arrive;
      lacquerMaterial.opacity = (dark ? .07 : .12) * room.floor;
      gridMaterial.opacity = (dark ? .17 : .12) * room.floor; traceMaterial.opacity = (dark ? .32 : .2) * room.floor; nodeMaterial.opacity = room.floor;
      poolLights.forEach((light, index) => { light.intensity = (index === 0 ? 24 : 9) * (dark ? 1 : .65) * room.floor * (1 - preview.arrive * (index === 0 ? .97 : .7)); });
      renderer.render(scene, camera);
      canvas.dataset.draws = String(Number(canvas.dataset.draws ?? 0) + 1);
      canvas.dataset.reflections = "live";
      canvas.dataset.mode = frame.p > 6.48 ? "preview" : frame.p >= 5.42 ? "assembly" : "gallery";
    },
    dispose() {
      canvas.removeEventListener("pointerdown", begin);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("pointerup", choose);
      const materials = new Set<THREE.Material>(), geometries = new Set<THREE.BufferGeometry>();
      scene.traverse((node) => { if (node instanceof THREE.Mesh || node instanceof THREE.Line) { geometries.add(node.geometry); for (const value of Array.isArray(node.material) ? node.material : [node.material]) materials.add(value); } });
      reflector.dispose(); geometries.forEach((geometry) => geometry.dispose()); materials.forEach((value) => value.dispose());
      textures.forEach((texture) => texture.dispose()); shadowTexture.dispose(); glowTexture.dispose(); renderer.dispose();
    },
  };
}
