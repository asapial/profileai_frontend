import * as THREE from "three";

type Pixel = [number, number];
const W = 1024, H = 1536, UNIT = .00234, BASE = 1515;

/** A single reference texture is attached to articulated, curved meshes. No pose-image swaps. */
export async function createTexturedPuppet() {
  const image = new Image(); image.src = "/art/access-pages/puppet/eyes.webp"; await image.decode();
  const source = document.createElement("canvas"); source.width = W; source.height = H;
  const sourceContext = source.getContext("2d", { willReadFrequently: true });
  if (!sourceContext) throw Error("Character texture canvas unavailable");
  sourceContext.drawImage(image, 0, 0, W, H);
  const pixels = sourceContext.getImageData(0, 0, W, H).data;
  const textures = new Set<THREE.Texture>();
  const photograph = new THREE.CanvasTexture(source); photograph.colorSpace = THREE.SRGBColorSpace; photograph.anisotropy = 4; textures.add(photograph);
  function tile(x: number, y: number, width: number, height: number) {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d"); if (!ctx) throw Error("Fabric texture canvas unavailable");
    ctx.drawImage(source, x, y, width, height, 0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.add(texture); return texture;
  }
  const fleece = tile(125, 440, 65, 65), skin = tile(590, 650, 65, 65), mitten = tile(190, 1120, 65, 65);
  const lilac = new THREE.MeshStandardMaterial({ color: 0xb58acc, roughness: 1 });
  const plum = new THREE.MeshStandardMaterial({ color: 0x714560, roughness: 1 });
  const cream = new THREE.MeshBasicMaterial({ map: skin, color: 0xfff7ef });
  const root = new THREE.Group(), torso = new THREE.Group(), neck = new THREE.Group(), head = new THREE.Group();
  root.name = "Reference-textured articulated plush"; root.add(torso, neck); neck.name = "independent neck joint";
  const pivot: Pixel = [550, 842];
  neck.position.set((pivot[0] - W / 2) * UNIT, (BASE - pivot[1]) * UNIT, 0);
  neck.add(head);
  function inside(x: number, y: number, polygon: Pixel[]) {
    let value = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i], b = polygon[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) value = !value;
    }
    return value;
  }
  function part(parent: THREE.Group, polygon: Pixel[], origin: Pixel, material: THREE.Material, depth: number, name: string) {
    const left = Math.min(...polygon.map(p => p[0])), right = Math.max(...polygon.map(p => p[0]));
    const top = Math.min(...polygon.map(p => p[1])), bottom = Math.max(...polygon.map(p => p[1]));
    const matte = document.createElement("canvas"); matte.width = W; matte.height = H;
    const ctx = matte.getContext("2d"); if (!ctx) throw Error("Character matte unavailable");
    ctx.fillStyle = "black"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "white";
    ctx.beginPath(); polygon.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fill();
    const alpha = new THREE.CanvasTexture(matte); textures.add(alpha);
    const front = new THREE.PlaneGeometry((right - left) * UNIT, (bottom - top) * UNIT, 64, 72);
    const position = front.attributes.position, uv = front.attributes.uv;
    const cx = (left + right) / 2, cy = (top + bottom) / 2;
    for (let i = 0; i < position.count; i++) {
      const px = left + uv.getX(i) * (right - left), py = bottom - uv.getY(i) * (bottom - top);
      const nx = (px - cx) / ((right - left) / 2), ny = (py - cy) / ((bottom - top) / 2);
      position.setXYZ(i, (px - origin[0]) * UNIT, (origin[1] - py) * UNIT, depth * Math.sqrt(Math.max(0, 1 - nx * nx * .85 - ny * ny * .8)) + .014);
      uv.setXY(i, px / W, 1 - py / H);
    }
    front.computeVertexNormals();
    const group = new THREE.Group(); group.name = name; parent.add(group);
    const mesh = new THREE.Mesh(front, new THREE.MeshBasicMaterial({ map: photograph, alphaMap: alpha, alphaTest: .35, side: THREE.DoubleSide }));
    mesh.castShadow = true; group.add(mesh);
    const lhs: Pixel[] = [], rhs: Pixel[] = [];
    for (let y = Math.ceil(top); y < Math.min(H, bottom); y += 7) {
      let min = Infinity, max = -Infinity;
      for (let x = Math.max(0, Math.floor(left)); x < Math.min(W, right); x += 3) {
        if (pixels[(y * W + x) * 4 + 3] > 180 && inside(x, y, polygon)) { min = Math.min(min, x); max = Math.max(max, x); }
      }
      if (Number.isFinite(min)) { lhs.push([min, y]); rhs.push([max, y]); }
    }
    const contour = [...lhs, ...rhs.reverse()];
    if (name === "curved head and hood") {
      const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), lilac);
      shell.scale.set(.98, .82, .39); shell.position.set(-.04, .77, -.24); shell.rotation.z = .28;
      shell.castShadow = true; group.add(shell);
    } else if (contour.length > 3) {
      const shape = new THREE.Shape(contour.map(p => new THREE.Vector2((p[0] - origin[0]) * UNIT, (origin[1] - p[1]) * UNIT)));
      const volume = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: depth * 2, bevelEnabled: true, bevelSize: .018, bevelThickness: .025, bevelSegments: 3, steps: 1 }), material);
      volume.position.z = -depth * 2 - .025; volume.castShadow = true; group.add(volume);
    }
    return group;
  }
  part(head, [[0, 0], [1024, 0], [1024, 700], [870, 790], [720, 851], [410, 876], [210, 790], [0, 770]], pivot, lilac, .20, "curved head and hood");
  part(torso, [[393, 819], [738, 805], [807, 905], [850, 1075], [864, 1280], [796, 1410], [330, 1425], [296, 1340], [340, 1210], [348, 1035]], [512, BASE], plum, .22, "rounded overalls with source stitching and badge");
  part(root, [[277, 1370], [570, 1360], [568, 1536], [265, 1536]], [512, BASE], lilac, .12, "left plush foot");
  part(root, [[557, 1345], [887, 1345], [895, 1536], [555, 1536]], [512, BASE], lilac, .12, "right plush foot");
  const eyes: THREE.Group[] = [], pupils: THREE.Group[] = [], lids: THREE.Mesh[] = [];
  const black = new THREE.MeshPhysicalMaterial({ color: 0x151217, roughness: .21, clearcoat: 1, clearcoatRoughness: .14 });
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sphere = new THREE.SphereGeometry(1, 40, 32);
  function oval(parent: THREE.Object3D, material: THREE.Material, scale: number[], point: number[]) {
    const mesh = new THREE.Mesh(sphere, material); mesh.scale.fromArray(scale); mesh.position.fromArray(point); parent.add(mesh); return mesh;
  }
  for (const [x, y, rx, ry] of [[473, 522, 104, 109], [738, 430, 84, 100]]) {
    const eye = new THREE.Group(); eye.position.set((x - pivot[0]) * UNIT, (pivot[1] - y) * UNIT, .205);
    eye.rotation.z = .37; head.add(eye);
    const pupil = new THREE.Group(); eye.add(pupil);
    oval(pupil, black, [.101, .139, .037], [0, 0, 0]);
    oval(pupil, white, [.029, .034, .006], [-.034, .063, .034]);
    oval(pupil, white, [.009, .011, .004], [.032, -.062, .032]);
    const lid = oval(eye, cream, [rx * UNIT, ry * UNIT, .025], [0, 0, .065]); lid.visible = false;
    eyes.push(eye); pupils.push(pupil); lids.push(lid);
  }
  const hands: THREE.Group[] = [], shoulders: THREE.Vector3[] = [];
  const glove = new THREE.MeshStandardMaterial({ map: mitten, color: 0xffffff, roughness: 1 });
  const cuff = new THREE.MeshStandardMaterial({ map: fleece, color: 0xe8d9ee, roughness: 1 });
  for (const [index, origin] of [[0, [246, 1134]], [1, [924, 1117]]] as [number, Pixel][]) {
    const hand = new THREE.Group();
    hand.position.set((origin[0] - 512) * UNIT, (BASE - origin[1]) * UNIT, .03);
    oval(hand, glove, [.255, .32, .16], [0, 0, .05]);
    oval(hand, glove, [.09, .13, .13], [index ? -.18 : .18, -.045, .09]);
    oval(hand, cuff, [.25, .095, .165], [0, .215, .02]);
    root.add(hand); hands.push(hand);
    shoulders.push(new THREE.Vector3((index ? 822 - 512 : 342 - 512) * UNIT, (BASE - 920) * UNIT, -.06));
  }
  const armMeshes: THREE.Mesh[] = [];
  for (let i = 0; i < 2; i++) {
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(25 * 13 * 3), 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(25 * 13 * 2), 2));
    const indices: number[] = [];
    for (let ring = 0; ring < 24; ring++) for (let side = 0; side < 12; side++) { const a = ring * 13 + side, b = a + 13; indices.push(a, a + 1, b, b, a + 1, b + 1); }
    geometry.setIndex(indices);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: fleece, color: 0xe1cfe9, roughness: 1 }));
    mesh.castShadow = true; root.add(mesh); armMeshes.push(mesh);
  }
  const axis = new THREE.Vector3(), normal = new THREE.Vector3(), binormal = new THREE.Vector3(), center = new THREE.Vector3(), tangent = new THREE.Vector3();
  function updateArm(index: number, start: THREE.Vector3, bend: THREE.Vector3, end: THREE.Vector3) {
    const position = armMeshes[index].geometry.attributes.position, uv = armMeshes[index].geometry.attributes.uv;
    const curve = new THREE.QuadraticBezierCurve3(start.clone(), bend.clone(), end.clone());
    for (let ring = 0; ring <= 24; ring++) {
      const t = ring / 24; curve.getPoint(t, center); curve.getTangent(t, tangent);
      axis.set(0, 0, 1); normal.crossVectors(tangent, axis).normalize(); binormal.crossVectors(tangent, normal).normalize();
      const radius = .13 + Math.sin(t * Math.PI) * .016;
      for (let side = 0; side <= 12; side++) { const a = side / 12 * Math.PI * 2, n = ring * 13 + side;
        position.setXYZ(n, center.x + radius * (Math.cos(a) * normal.x + Math.sin(a) * binormal.x), center.y + radius * (Math.cos(a) * normal.y + Math.sin(a) * binormal.y), center.z + radius * (Math.cos(a) * normal.z + Math.sin(a) * binormal.z));
        uv.setXY(n, side / 12, t);
      }
    }
    position.needsUpdate = true; uv.needsUpdate = true; armMeshes[index].geometry.computeVertexNormals(); armMeshes[index].geometry.computeBoundingSphere();
  }
  return { root, torso, neck, head, eyes, pupils, lids, hands, shoulders, updateArm, textures };
}
