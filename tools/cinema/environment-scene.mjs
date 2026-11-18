/** Reproducible 3D background plates. Kept offline: the homepage needs no extra WebGL contexts. */
import * as T from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
document.body.append(renderer.domElement);
const pmrem = new T.PMREMGenerator(renderer);
const room = new RoomEnvironment();
const studioMap = pmrem.fromScene(room, .08).texture;
room.dispose();
let previous;
const paperTextures = await Promise.all(['editorial-cut', 'orbit', 'kinship'].map(async slug => {
  const texture = await new T.TextureLoader().loadAsync(`/templates/story/${slug}.png`);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}));

const palettes = {
  trust: ['#161322', '#352342', '#9f78c7', '#282234'],
  workspace: ['#0e1928', '#1f3449', '#94a5eb', '#18304b'],
  graph: ['#151225', '#352743', '#b396dc', '#2a203c'],
  showcase: ['#15151e', '#35313e', '#bca2cb', '#2b2937'],
  story: ['#10232d', '#1c4655', '#74aebd', '#173844'],
  templates: ['#1c1426', '#473051', '#c7a0d9', '#33213e'],
  pricing: ['#111b2b', '#293b53', '#aa94dd', '#263950'],
  faq: ['#1c1626', '#533651', '#c797d5', '#39283f'],
  closing: ['#1a1028', '#41234f', '#c78ef6', '#372043'],
  footer: ['#10101b', '#282236', '#ad8adc', '#201c2d'],
};
const lightPalettes = {
  trust: ['#ece6f2', '#b5a0c9', '#a374d0', '#d8cae5'],
  workspace: ['#e4edf6', '#a7bfd7', '#6f89c2', '#cbd9e8'],
  graph: ['#eae7f3', '#b5a3cb', '#8b72af', '#cfc4e1'],
  showcase: ['#eeeae6', '#b2a9b6', '#8c66a5', '#d0c8cf'],
  story: ['#deebe8', '#7eafb0', '#559aab', '#b6d3d1'],
  templates: ['#eee6f1', '#bea0cc', '#9562af', '#d3bfdc'],
  pricing: ['#e3eaf4', '#9facc5', '#9b6bd1', '#becde1'],
  faq: ['#eee5ef', '#bd9dc5', '#a774bc', '#d6c2dc'],
  closing: ['#eee5f5', '#b397d0', '#a265cf', '#d3bce3'],
  footer: ['#e8e5ee', '#b2a4c6', '#9869be', '#cec4dc'],
};
const V = (x, y, z) => new T.Vector3(x, y, z);

window.renderEnvironment = async ({ kind, dark = true, mobile = false, width = 1600, height = 1000 }) => {
  if (previous) {
    previous.traverse(node => { node.geometry?.dispose(); for (const m of Array.isArray(node.material) ? node.material : node.material ? [node.material] : []) m.dispose(); });
    previous.userData.mirror?.getRenderTarget().dispose();
  }
  const objectOnly = kind === 'dais' || kind === 'plinth';
  const colors = (dark ? palettes : lightPalettes)[objectOnly ? 'closing' : kind];
  const [ground, face, accent, floor] = colors;
  const scene = new T.Scene();
  previous = scene;
  scene.environment = studioMap;
  scene.environmentIntensity = dark ? .38 : .5;
  renderer.toneMappingExposure = dark ? 1.1 : .88;
  scene.background = objectOnly ? null : new T.Color(ground);
  scene.fog = objectOnly ? null : new T.Fog(ground, 16, 38);
  const camera = new T.PerspectiveCamera(objectOnly ? 28 : 43, width / height, .1, 100);
  camera.position.set(0, objectOnly ? 2.6 : 4.3, objectOnly ? 11 : 16);
  camera.lookAt(0, objectOnly ? 0 : 3, 0);
  if (objectOnly) { camera.zoom = 2; camera.updateProjectionMatrix(); }
  if (mobile && !objectOnly) {
    camera.position.set(0, 5.8, 19.5);
    camera.lookAt(0, 3.3, 0);
    camera.fov = 51;
    camera.updateProjectionMatrix();
  }
  renderer.setSize(width, height);
  renderer.setClearAlpha(objectOnly ? 0 : 1);
  const hemi = new T.HemisphereLight(dark ? '#d5c7ee' : '#ffffff', floor, dark ? .75 : 1.1);
  const key = new T.DirectionalLight(dark ? '#e4d9ff' : '#fff8ff', dark ? 3.2 : 2.1);
  key.position.set(-7, 12, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -20, right: 20, top: 16, bottom: -16, far: 60 });
  key.shadow.bias = -.0003;
  key.shadow.normalBias = .025;
  key.shadow.radius = 4;
  const rim = new T.DirectionalLight(accent, dark ? 3 : 1.7);
  rim.position.set(8, 5, -7);
  scene.add(hemi, key, rim);
  const lamp = new T.SpotLight(accent, dark ? 180 : 110, 35, .68, .8, 1.2);
  lamp.position.set(6, 8, 1);
  lamp.target.position.set(3, 0, -4);
  scene.add(lamp, lamp.target);

  const standard = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness: .36, metalness: .24, ...extra });
  const solid = (geometry, material, x = 0, y = 0, z = 0, parent = scene) => {
    const mesh = new T.Mesh(geometry, material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const box = (w, h, d, color, x, y, z, parent = scene) => solid(new RoundedBoxGeometry(w, h, d, 3, Math.min(.07, h / 4)), standard(color), x, y, z, parent);
  const line = (points, color = accent, radius = .009, parent = scene, glow = false) => {
    const material = standard(color, { emissive: color, emissiveIntensity: glow ? (dark ? .9 : .08) : .08, roughness: .3 });
    const mesh = solid(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p => V(...p))), 80, radius, 6, false), material, 0, 0, 0, parent);
    mesh.castShadow = false;
    return mesh;
  };
  const paper = (index, x, y, z, rx = 0, ry = 0, rz = 0, scale = 1) => {
    const group = new T.Group(); group.position.set(x, y, z); group.rotation.set(rx, ry, rz); group.scale.setScalar(scale); scene.add(group);
    box(2.1, 2.97, .035, dark ? '#9d89b0' : '#fff9f0', 0, 0, 0, group);
    const ink = new T.MeshStandardMaterial({ color: dark ? '#9689aa' : '#eee7e1', map: paperTextures[index % 3], roughness: .72, metalness: 0 });
    solid(new T.PlaneGeometry(2.04, 2.91), ink, 0, 0, .02, group);
    return group;
  };
  const ring = (x, z, rx, rz, color = accent) => {
    const pts = Array.from({ length: 65 }, (_, i) => { const a = i * Math.PI / 32; return [x + Math.cos(a) * rx, .035, z + Math.sin(a) * rz]; });
    line(pts, color, .009);
  };

  if (!objectOnly) {
    // A real room, not a screen-space polygon. The horizon, light pools and
    // mirror all use the same camera as the dimensional objects.
    const wall = solid(new T.PlaneGeometry(80, 30), standard(ground, { roughness: .84, metalness: .04 }), 0, 12, -14);
    wall.receiveShadow = true;
    const mirror = new Reflector(new T.PlaneGeometry(80, 80), { textureWidth: width, textureHeight: height, clipBias: .003, multisample: 1, color: '#ffffff' });
    mirror.rotation.x = -Math.PI / 2; mirror.position.y = -.015;
    const mat = mirror.material;
    mat.uniforms.roomGround = { value: new T.Color(floor) };
    mat.uniforms.mirrorStrength = { value: dark ? .35 : .23 };
    mat.fragmentShader = mat.fragmentShader.replace('uniform vec3 color;', 'uniform vec3 color; uniform vec3 roomGround; uniform float mirrorStrength;')
      .replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );', 'gl_FragColor = vec4(mix(roomGround, base.rgb, mirrorStrength), 1.0);');
    scene.add(mirror); scene.userData.mirror = mirror;
    const lacquer = solid(new T.PlaneGeometry(80, 80), new T.MeshPhysicalMaterial({ color: floor, metalness: .4, roughness: .33, clearcoat: 1, clearcoatRoughness: .28, transparent: true, opacity: .64 }), 0, .004, 0);
    lacquer.rotation.x = -Math.PI / 2; lacquer.castShadow = false;
    // Fine floor seams have real perspective. Keep them below the content plane.
    if (!['story', 'faq', 'trust'].includes(kind)) {
      for (let i = -4; i <= 4; i++) line([[i * 3, .018, -13], [i * 3, .018, 15]], dark ? '#584364' : '#b5a4c3', .0035);
      for (let z = -9; z <= 15; z += 4) line([[-25, .018, z], [25, .018, z]], dark ? '#584364' : '#b5a4c3', .0035);
    }
  }

  if (kind === 'workspace' || kind === 'footer') {
    const points = [[-7,.14,4],[-4,.12,-1],[-1,.18,6],[2,.12,-4],[5,.14,1],[8,.12,-3],[-1,.1,-7],[7,.1,8]];
    for (const [i,j] of [[0,1],[0,2],[1,2],[1,3],[1,6],[2,3],[2,4],[2,7],[3,4],[3,5],[3,6],[4,5],[4,7],[5,7]]) {
      const a = points[i], b = points[j]; line([a, [(a[0]+b[0])/2,.16,(a[2]+b[2])/2], b], accent, .012, scene, true);
    }
    points.forEach(([x,y,z], i) => solid(new T.SphereGeometry(i % 3 === 0 ? .16 : .105, 24, 20), new T.MeshPhysicalMaterial({ color: dark ? '#c0a1ef' : '#8b71bb', metalness: .55, roughness: .19, clearcoat: 1 }), x, y, z));
    if (kind === 'workspace') ring(2, -1, 9, 5.3);
    if (kind === 'footer') {
      const slab = box(36, .15, 18, face, 0, -.1, -7);
      slab.rotation.y = -.12;
    }
  }
  if (kind === 'trust' || kind === 'showcase') {
    // The source papers are peripheral; the heading/lede keep their quiet ink field.
    paper(0, mobile ? 4 : 6.2, 2.3, -6.5, -.09, -.35, -.13, 1.9);
    paper(1, mobile ? 5.5 : 8.2, 2.8, -8, .12, -.25, .1, 1.9);
    paper(2, mobile ? 2.8 : 4.5, 1.7, -8, .08, -.3, -.05, 1.9);
    for (let i=0; i<5; i++) paper(i, kind === 'trust' ? -7+i*.32 : 7+i*.12, .06+i*.018, 3+i*.16, -Math.PI/2, 0, -.18+i*.07, 1.15);
    line([[-6,.04,5],[-1,.04,1],[3,.04,-1],[6,.1,-6]], accent, .018, scene, true);
    if (kind === 'showcase') {
      const desk = box(28, .22, 16, face, 0, -.13, -3);
      desk.rotation.y = -.08;
      line([[-2,.1,3],[2,.12,-2],[7,3,-8]], accent, .022, scene, true);
    }
  }
  if (kind === 'story') {
    const geometry = new T.PlaneGeometry(60, 45, 160, 110);
    geometry.rotateX(-Math.PI/2);
    const pos = geometry.attributes.position;
    const hill = (x,z) => 1 + 1.5 * Math.exp(-((x-9)**2/70+(z+6)**2/100)) + .4*Math.sin(x*.32+z*.28)*Math.cos(z*.18);
    for (let i=0; i<pos.count; i++) pos.setY(i, hill(pos.getX(i), pos.getZ(i)));
    geometry.computeVertexNormals();
    const terrain = solid(geometry, standard(face, { metalness: .46, roughness: .46 }), 0, -.12, -5);
    terrain.castShadow = false; terrain.receiveShadow = false;
    for (let z=-13; z<=15; z+=.7) line(Array.from({length:70},(_,i)=>{const x=-27+i*.8; return [x,hill(x,z)-.1,z-5];}), accent, .006);
    line(Array.from({length:80},(_,i)=>{const x=-28+i*.75,z=2.7*Math.sin(x*.13);return[x,hill(x,z)-.08,z-5];}),dark?'#c29af5':'#9261bf',.02,scene,true);
  }
  if (kind === 'templates') {
    const arch = new T.Shape(); arch.moveTo(-7,0); arch.lineTo(7,0); arch.lineTo(7,11); arch.lineTo(-7,11); arch.closePath();
    const hole = new T.Path(); hole.moveTo(-3.5,0); hole.lineTo(-3.5,4.2); hole.absarc(0,4.2,3.5,Math.PI,0,true); hole.lineTo(3.5,0); hole.closePath(); arch.holes.push(hole);
    const wall = solid(new T.ExtrudeGeometry(arch, { depth: .55, bevelEnabled: true, bevelSize: .12, bevelThickness: .12, bevelSegments: 3, steps: 1 }), standard(face), mobile?4.5:7, 0, -8.5);
    wall.rotation.y = -.17;
    for (let i=0;i<14;i++) solid(new T.CylinderGeometry(.11,.11,10,16),standard(dark?'#5d3d69':'#c6accf'),mobile?1-i*.2:10.7+i*.28,5,mobile?-7.8-i*.034:-6.8+i*.047);
    box(34,.22,2,face,0,.1,-8);
    const lamp2=new T.PointLight(accent,dark?110:60,18,1.5);lamp2.position.set(4,3,-5);scene.add(lamp2);
  }
  if (kind === 'pricing') {
    box(4,5,3,face,-11,2.5,-7);
    box(4,8,3,face,11,4,-8);
    box(3,3,7,face,-14,1.5,1);
    box(3,4,7,face,14,2,1);
    ring(0,1,12,5);
  }
  if (kind === 'graph') {
    box(1.2,7,2,face,-13,3.5,-9);
    box(1.2,9,2,face,13,4.5,-10);
    ring(0,-4,12,5);
  }
  if (kind === 'faq') {
    for (const side of [-1,1]) for(let layer=0;layer<3;layer++) {
      const geo=new T.PlaneGeometry(9,7,40,35),p=geo.attributes.position;
      for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,.16*x*x+.065*y*y+layer*.09);}
      geo.computeVertexNormals();
      const folded=solid(geo,standard(layer===1?accent:face,{side:T.DoubleSide,metalness:.12,roughness:.56}),side*(mobile?6.5:11),side===1?8:1.1,side===1?-8:2);
      folded.rotation.set(side*.27,side*-.42,side*-.32);
    }
  }
  if (kind === 'closing') {
    for(let i=0;i<7;i++){const b=box(.16,11,1.2,face,8+i*.7,5.5,-7);b.rotation.z=-.2;}
    ring(4,1,7,4);ring(4,1,9,5.6);
    line([[-7,.03,8],[-1,.04,4],[4,.8,-2],[9,2,-5]],accent,.016,scene,true);
  }
  if (objectOnly) {
    const geometry=kind==='dais'?new T.CylinderGeometry(2.7,2.7,.6,128):new RoundedBoxGeometry(6,.5,3,5,.07);
    const shape=solid(geometry,new T.MeshPhysicalMaterial({color:dark?'#35203f':'#a98bbd',metalness:.68,roughness:.26,clearcoat:1}));
    if(kind==='dais'){
      for(const y of [-.29,.29]){const lip=solid(new T.TorusGeometry(2.7,.015,8,128),new T.MeshBasicMaterial({color:dark?'#bd85ff':'#b476e6'}),0,y,0);lip.rotation.x=Math.PI/2;}
    }else{
      shape.rotation.y=-.035;
      const lip=box(6.02,.025,3.02,dark?'#8553bc':'#c2a1db',0,.245,0);lip.rotation.y=-.035;
    }
    const shadow=solid(new T.PlaneGeometry(30,30),new T.ShadowMaterial({opacity:dark?.4:.25}),0,-.31,0);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
  }
  renderer.render(scene,camera);
  // Resolve the reflector and shadow pass before exporting the still.
  renderer.render(scene,camera);
  return renderer.domElement.toDataURL('image/png');
};
window.environmentReady = true;
