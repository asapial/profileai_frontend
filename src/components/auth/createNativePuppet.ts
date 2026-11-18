type Vector = [number, number, number];
type Matrix = Float32Array;

export type PuppetPose = {
  headYaw: number; headPitch: number; neckYaw: number; neckPitch: number;
  torsoYaw: number; roll: number; eyeYaw: number; eyePitch: number;
  cover: number; breath: number; blink: number; time: number; dark: boolean;
};
export type NativePuppet = { draw: (pose: PuppetPose) => void; resize: () => void; dispose: () => void };

const identity = () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
const add = (a: Vector, b: Vector): Vector => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const subtract = (a: Vector, b: Vector): Vector => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: Vector, s: number): Vector => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vector, b: Vector) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const length = (a: Vector) => Math.hypot(...a);
const normalize = (a: Vector): Vector => scale(a, 1 / Math.max(.00001, length(a)));
const cross = (a: Vector, b: Vector): Vector => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mix = (a: Vector, b: Vector, t: number): Vector => add(scale(a, 1 - t), scale(b, t));
const smooth = (n: number) => { const t = Math.max(0, Math.min(1, n)); return t * t * (3 - 2 * t); };

function multiply(a: Matrix, b: Matrix): Matrix {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  }
  return out;
}
function transform(position: Vector = [0, 0, 0], rotation: Vector = [0, 0, 0], size: Vector = [1, 1, 1]): Matrix {
  const [x, y, z] = rotation, cx = Math.cos(x), sx = Math.sin(x), cy = Math.cos(y), sy = Math.sin(y), cz = Math.cos(z), sz = Math.sin(z);
  return new Float32Array([
    cy * cz * size[0], cy * sz * size[0], -sy * size[0], 0,
    (sx * sy * cz - cx * sz) * size[1], (sx * sy * sz + cx * cz) * size[1], sx * cy * size[1], 0,
    (cx * sy * cz + sx * sz) * size[2], (cx * sy * sz - sx * cz) * size[2], cx * cy * size[2], 0,
    ...position, 1,
  ]);
}
function point(m: Matrix, p: Vector): Vector {
  return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
}
function basis(position: Vector, up: Vector, forward: Vector = [0, 0, 1]): Matrix {
  const y = normalize(up), x = normalize(cross(y, Math.abs(dot(y, forward)) > .98 ? [1, 0, 0] : forward)), z = normalize(cross(x, y));
  return new Float32Array([...x, 0, ...y, 0, ...z, 0, ...position, 1]);
}
function cameraMatrix(): Matrix {
  const eye: Vector = [0, 2.425, 7.6], target: Vector = [0, 1.525, 0];
  const z = normalize(subtract(eye, target)), x = normalize(cross([0, 1, 0], z)), y = cross(z, x);
  const view = new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]);
  const height = 4.1, width = height * 360 / 460, near = .1, far = 20;
  const projection = new Float32Array([2 / width, 0, 0, 0, 0, 2 / height, 0, 0, 0, 0, -2 / (far - near), 0, 0, 0, -(far + near) / (far - near), 1]);
  return multiply(projection, view);
}

const vertex = `#version 300 es
precision highp float;
precision highp int;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in mat4 aModel;
layout(location=6) in vec4 aColor;
layout(location=7) in vec4 aSurface;
uniform mat4 uCamera;
uniform int uPass;
out vec3 vWorld;
out vec3 vNormal;
out vec3 vLocal;
out vec3 vFabric;
out vec4 vColor;
out vec4 vSurface;
out float vHair;
void main(){
  vec3 local=aPosition,normal=aNormal;
  if(aSurface.w>1. && aSurface.w<2.){
    float cap=aSurface.w-1.;
    local.y=sign(local.y)*(1.-cap)+local.y*cap;
    normal.y/=cap;
  }
  if(aSurface.w>4.5 && aSurface.w<5.5){
    float curl=max(local.x,0.);
    local.y+=1.6*curl*curl;
    normal.x-=3.2*curl*normal.y;
  }
  if(aSurface.w>5.5 && aSurface.w<7.5){
    local.xy=sign(local.xy)*sqrt(abs(local.xy));
    normal.xy*=2.*sqrt(max(abs(aPosition.xy),vec2(.002)));
  }
  vec4 world=aModel*vec4(local,1.0);
  mat3 m=mat3(aModel);
  vNormal=normalize(m*(normal/vec3(dot(m[0],m[0]),dot(m[1],m[1]),dot(m[2],m[2]))));
  vWorld=world.xyz;vLocal=local;vColor=aColor;vSurface=aSurface;
  vFabric=local*vec3(length(m[0]),length(m[1]),length(m[2]));
  vHair=fract(sin(float(gl_VertexID)*78.233)*43758.5453);
  if(uPass==3){
    if(aSurface.y<.45){gl_Position=vec4(2.,2.,2.,1.);gl_PointSize=1.;return;}
    world.xyz+=vNormal*(.003+vHair*.010)*aSurface.y;
    gl_PointSize=1.2+vHair*1.15;
  }
  if(uPass==1)world.y=-world.y*.18-.025;
  gl_Position=uCamera*world;
}`;
const fragment = `#version 300 es
precision highp float;
precision highp int;
in vec3 vWorld;
in vec3 vNormal;
in vec3 vLocal;
in vec3 vFabric;
in vec4 vColor;
in vec4 vSurface;
in float vHair;
uniform int uPass;
uniform float uDark;
out vec4 outColor;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
}
void main(){
  if(uPass==2){
    float r=dot(vLocal.xz,vLocal.xz);
    outColor=vec4(.105,.065,.14,exp(-r*4.5)*.29);
    return;
  }
  vec3 n=normalize(vNormal),view=normalize(vec3(0.,2.425,7.6)-vWorld);
  float fabric=vSurface.y;
  vec2 thread=vFabric.xy+vFabric.z*vec2(.43,.71);
  float pile=.5;
  if(fabric>.01){
    float footprint=max(fwidth(thread).x,fwidth(thread).y);
    float fine=1.-smoothstep(.35,1.1,footprint*210.);
    pile=noise(thread*70.)*.7+noise(thread*vec2(125.,90.)+17.)*.3;
    pile=mix(pile,noise(thread*210.),fine*.18);
    if(uPass!=3){
      float height=(pile-.5)*.0016*fabric;
      vec3 dx=dFdx(vWorld),dy=dFdy(vWorld),r1=cross(dy,n),r2=cross(n,dx);
      float determinant=dot(dx,r1);
      if(abs(determinant)>.00000001)n=normalize(abs(determinant)*n-sign(determinant)*(dFdx(height)*r1+dFdy(height)*r2));
    }
  }
  vec3 key=normalize(vec3(-3.5,5.5,5.5)-vWorld);
  vec3 fill=normalize(vec3(4.,2.8,4.)-vWorld);
  vec3 back=normalize(vec3(2.,4.,-3.)-vWorld);
  float rough=vColor.w;
  float diffuse=max(dot(n,key),0.);
  float ambient=.30+.06*n.y;
  vec3 light=vec3(ambient)*vec3(1.0,.96,1.08);
  light+=vec3(1.0,.88,.79)*diffuse*.82;
  light+=vec3(.75,.79,1.)*max(dot(n,fill),0.)*.27;
  light+=vec3(.86,.65,1.)*max(dot(n,back),0.)*(.15+uDark*.12);
  vec3 pigment=vColor.rgb;
  if(vSurface.w>2.5 && vSurface.w<3.5){
    float bib=.19-.10*pow(clamp(abs(vLocal.x)/.7,0.,1.),4.);
    float hem=mix(-.24,bib,smoothstep(.25,.65,vLocal.z));
    float cloth=1.-smoothstep(hem-.008,hem+.008,vLocal.y);
    pigment=mix(pigment,vec3(.388,.169,.365),cloth);
    float seam=exp(-pow(vLocal.x/.013,2.))*(1.-smoothstep(-.55,-.1,vLocal.y))*smoothstep(.25,.6,vLocal.z);
    pigment*=1.-seam*.22;
  }
  if(vSurface.w>3.5 && vSurface.w<4.5){
    vec2 cheek=vec2((abs(vLocal.x)-.62)/.20,(vLocal.y+.37)/.20);
    float blush=exp(-dot(cheek,cheek)*1.15)*smoothstep(.3,.65,vLocal.z);
    pigment=mix(pigment,vec3(.96,.54,.61),blush*.51);
  }
  if(vSurface.w>5.5 && vSurface.w<7.5){
    float edge=max(abs(vLocal.x),abs(vLocal.y));
    float trim=exp(-pow((edge-.9)/.026,2.))*smoothstep(.15,.6,vLocal.z);
    float along=abs(vLocal.x)>abs(vLocal.y)?vLocal.y:vLocal.x;
    float stitch=exp(-pow((edge-.79)/.018,2.))*smoothstep(.1,.6,vLocal.z)*smoothstep(.15,.45,sin(along*75.));
    pigment*=1.-trim*.29;
    pigment=mix(pigment,pigment*1.35+vec3(.05,.02,.05),stitch*.55);
  }
  if(vSurface.w>7.5){
    float seam=exp(-pow(vLocal.x/.009,2.))*(1.-smoothstep(-.78,-.58,vLocal.y))*smoothstep(.2,.6,vLocal.z);
    pigment*=1.-seam*.17;
  }
  vec3 base=pow(pigment,vec3(2.2))*(1.+(pile-.5)*fabric*.14);
  float occlusion=vSurface.z*(.93+.07*smoothstep(.02,.35,vWorld.y));
  vec3 lit=base*light*occlusion;
  vec3 halfVector=normalize(key+view);
  float spec=pow(max(dot(n,halfVector),0.),mix(125.,12.,rough));
  lit+=vec3(1.,.96,.91)*spec*vSurface.x*(1.-rough*.5);
  float fresnel=pow(1.-max(dot(n,view),0.),3.);
  lit+=base*fresnel*fabric*.23;
  float alpha=uPass==1?.11*exp(-vWorld.y*1.4):1.;
  if(uPass==3){
    vec2 p=gl_PointCoord-.5;
    float angle=vHair*6.283,cs=cos(angle),sn=sin(angle);
    p=mat2(cs,-sn,sn,cs)*p;p.x*=2.1;
    alpha=(1.-smoothstep(.12,.5,length(p)))*(.25+fresnel*.30);
    lit*=1.04+vHair*.12;
  }
  if(alpha<.003)discard;
  outColor=vec4(pow(clamp(lit,0.,1.),vec3(1./2.2)),alpha);
}`;

/** Compact real geometry: one shared sphere, instanced materials, no textures or shadow-map passes. */
export function createNativePuppet(host: HTMLElement, onLost: () => void): NativePuppet {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power", premultipliedAlpha: false });
  if (!context) throw Error("WebGL2 unavailable");
  const gl: WebGL2RenderingContext = context;
  const buffers: WebGLBuffer[] = [], shaders: WebGLShader[] = [];
  let program: WebGLProgram | null = null, array: WebGLVertexArrayObject | null = null, furArray: WebGLVertexArrayObject | null = null, disposed = false;
  let firstPaint: WebGLSync | null = null, painted = false;
  const lost = (event: Event) => { event.preventDefault(); if (!disposed) onLost(); };
  function dispose() {
    if (disposed) return; disposed = true;
    canvas.removeEventListener("webglcontextlost", lost);
    if (firstPaint) gl.deleteSync(firstPaint);
    buffers.forEach(buffer => gl!.deleteBuffer(buffer)); shaders.forEach(shader => gl!.deleteShader(shader));
    if (array) gl!.deleteVertexArray(array); if (program) gl!.deleteProgram(program);
    if (furArray) gl.deleteVertexArray(furArray);
    if (!gl.isContextLost()) gl.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.remove();
  }
  try {
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type); if (!shader) throw Error("Puppet shader unavailable"); shaders.push(shader);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error("Puppet shader failed: " + gl.getShaderInfoLog(shader));
      return shader;
    };
    program = gl.createProgram(); if (!program) throw Error("Puppet program unavailable");
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex)); gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error("Puppet program failed: " + gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const uniformPass = gl.getUniformLocation(program, "uPass"), uniformDark = gl.getUniformLocation(program, "uDark");
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uCamera"), false, cameraMatrix());
    array = gl.createVertexArray(); gl.bindVertexArray(array);
    const compact = host.getBoundingClientRect().width < 300;
    const vertices: number[] = [], indices: number[] = [], columns = compact ? 24 : 32, rows = compact ? 16 : 24;
    for (let row = 0; row <= rows; row++) for (let column = 0; column <= columns; column++) {
      const latitude = row / rows * Math.PI, longitude = column / columns * Math.PI * 2;
      const p = [Math.sin(latitude) * Math.cos(longitude), Math.cos(latitude), Math.sin(latitude) * Math.sin(longitude)];
      vertices.push(...p, ...p);
    }
    for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
      const a = row * (columns + 1) + column, b = a + columns + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
    const buffer = (target: number, data: Float32Array | Uint16Array | number, usage: number) => {
      const result = gl.createBuffer(); if (!result) throw Error("Puppet buffer unavailable"); buffers.push(result); gl.bindBuffer(target, result);
      if (typeof data === "number") gl.bufferData(target, data, usage); else gl.bufferData(target, data, usage);
      return result;
    };
    buffer(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    for (let i = 0; i < 2; i++) { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, 3, gl.FLOAT, false, 24, i * 12); }
    buffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    const instances = new Float32Array(128 * 24), instanceBuffer = buffer(gl.ARRAY_BUFFER, instances.byteLength, gl.DYNAMIC_DRAW);
    for (let i = 0; i < 6; i++) { const location = i + 2; gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 96, i * 16); gl.vertexAttribDivisor(location, 1); }
    // Short, bounded fibres soften the silhouette without hair models or texture downloads.
    const furCount = compact ? 1536 : 3072, furVertices = new Float32Array(furCount * 6);
    for (let i = 0; i < furCount; i++) {
      const y = 1 - (i + .5) / furCount * 2, radius = Math.sqrt(1 - y * y), angle = i * 2.399963;
      const p = [Math.cos(angle) * radius, y, Math.sin(angle) * radius]; furVertices.set([...p, ...p], i * 6);
    }
    furArray = gl.createVertexArray(); gl.bindVertexArray(furArray);
    buffer(gl.ARRAY_BUFFER, furVertices, gl.STATIC_DRAW);
    for (let i = 0; i < 2; i++) { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, 3, gl.FLOAT, false, 24, i * 12); }
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    for (let i = 0; i < 6; i++) { const location = i + 2; gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 96, i * 16); gl.vertexAttribDivisor(location, 1); }
    gl.bindVertexArray(array);
    canvas.dataset.puppetCanvas = "true"; canvas.setAttribute("aria-hidden", "true"); host.append(canvas); canvas.addEventListener("webglcontextlost", lost);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.clearColor(0, 0, 0, 0);
    const world = identity();
    let count = 0;
    const colors = {
      hood: ["#b77bce", .94, .07, 1], seam: ["#a46ab9", .94, .07, 1], cream: ["#f4dac9", .91, .08, .75],
      plum: ["#632b5d", .94, .07, 1], strap: ["#783c70", .94, .07, 1], white: ["#fffaff", .13, .75, 0],
      iris: ["#241c25", .13, .75, 0], pupil: ["#151218", .10, .88, 0], glint: ["#ffffff", .05, .6, 0],
      smile: ["#2c2027", .65, .08, 0], silver: ["#d7cbbf", .23, .60, 0], socket: ["#523b36", .65, .12, 0], letter: ["#dba4ee", .45, .28, .15],
    } as const;
    type Material = keyof typeof colors;
    const rgb = Object.fromEntries(Object.entries(colors).map(([name, [hex]]) => [name, [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16) / 255)])) as Record<Material, number[]>;
    function mesh(parent: Matrix, position: Vector, size: Vector, material: Material, rotation: Vector = [0, 0, 0], occlusion = 1, shape = 0) {
      const m = multiply(parent, transform(position, rotation, size)), offset = count++ * 24, surface = colors[material];
      instances.set(m, offset); instances.set([...rgb[material], surface[1], surface[2], surface[3], occlusion, shape], offset + 16);
    }
    function segment(parent: Matrix, a: Vector, b: Vector, radius: number, material: Material) {
      const m = basis(mix(a, b, .5), subtract(b, a));
      const halfLength = length(subtract(b, a)) / 2 + radius;
      mesh(multiply(parent, m), [0, 0, 0], [radius, halfLength, radius], material, [0, 0, 0], 1, 1 + radius / halfLength);
    }
    function resize() {
      const { width, height } = host.getBoundingClientRect();
      const ratio = Math.min(devicePixelRatio || 1, 1.25, 560 / Math.max(height, 1));
      const w = Math.max(1, Math.round(width * ratio)), h = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
      host.dataset.bufferSize = w + "x" + h;
    }
    function draw(pose: PuppetPose) {
      if (disposed || gl.isContextLost()) return;
      if (firstPaint && !painted) {
        const status = gl.clientWaitSync(firstPaint, 0, 0);
        if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) {
          gl.deleteSync(firstPaint); firstPaint = null; painted = true; host.dataset.gpuReady = "true";
        }
      }
      const started = performance.now(), { breath, blink, cover, time } = pose;
      count = 0;
      const body = transform([Math.sin(time * .75) * .006, breath * .006, 0], [0, pose.torsoYaw, 0]);
      const neck = multiply(body, transform([0, 1.4, .02], [pose.neckPitch, pose.neckYaw, pose.roll * .35]));
      const head = multiply(neck, transform([0, .84, 0], [pose.headPitch, pose.headYaw, pose.roll]));
      mesh(world, [-.235, .16, .07], [.25, .16, .31], "hood", [0, -.11, 0]);
      mesh(world, [.235, .16, .07], [.25, .16, .31], "hood", [0, .11, 0]);
      mesh(body, [0, .83, 0], [.52, .59 + breath * .003, .38], "hood", [0, 0, 0], 1, 3);
      mesh(body, [-.22, .36, .015], [.275, .25, .29], "plum");
      mesh(body, [.22, .36, .015], [.275, .25, .29], "plum");
      mesh(neck, [0, .02, 0], [.19, .22, .19], "seam");
      mesh(neck, [0, .035, .025], [.155, .20, .155], "hood");
      for (const sign of [-1, 1]) {
        const start: Vector = [sign * .31, 1.27, .20], end: Vector = [sign * .29, .97, .37];
        const strap = multiply(body, basis(mix(start, end, .5), subtract(end, start)));
        mesh(strap, [0, 0, 0], [.074, length(subtract(end, start)) / 2 + .025, .025], "strap", [0, 0, 0], 1, 6);
        mesh(body, [sign * .29, .97, .385], [.078, .078, .028], "silver");
        mesh(body, [sign * .29, .97, .411], [.059, .059, .016], "silver");
      }
      mesh(body, [0, .705, .385], [.245, .20, .045], "strap", [0, 0, 0], 1, 7);
      segment(body, [-.08, .59, .446], [-.08, .845, .446], .027, "letter");
      for (let i = 0; i < 12; i++) {
        const a = Math.PI / 2 - i / 12 * Math.PI, b = Math.PI / 2 - (i + 1) / 12 * Math.PI;
        segment(body, [Math.cos(a) * .15 - .08, Math.sin(a) * .065 + .78, .446], [Math.cos(b) * .15 - .08, Math.sin(b) * .065 + .78, .446], .026, "letter");
      }
      mesh(head, [0, 0, 0], [1.04, .87, .69], "hood", [0, 0, 0], 1, 8);
      mesh(head, [-1.025, -.03, .045], [.13, .19, .145], "cream");
      mesh(head, [1.025, -.03, .045], [.13, .19, .145], "cream");
      mesh(head, [0, -.07, .44], [.88, .68, .43], "cream", [0, 0, 0], 1, 4);
      mesh(head, [-.07, .88, .015], [.40, .21, .25], "hood", [0, .05, -.12], 1, 5);
      for (const sign of [-1, 1]) {
        const eye = multiply(head, transform([sign * .34, .045, .84], [pose.eyePitch, pose.eyeYaw, 0], [1, Math.max(.035, 1 - blink * .965), 1]));
        mesh(head, [sign * .34, .045, .81], [.255, .315 * Math.max(.035, 1 - blink * .965), .08], "socket", [0, sign * .08, 0], .90);
        mesh(eye, [0, 0, 0], [.248, .308, .16], "white");
        mesh(eye, [.01, -.006, .151], [.112, .167, .067], "iris");
        mesh(eye, [.013, -.008, .205], [.093, .141, .029], "pupil");
        mesh(eye, [-.026, .060, .237], [.030, .040, .012], "glint");
        mesh(eye, [.054, -.065, .225], [.009, .014, .006], "glint");
      }
      for (let i = 0; i < 12; i++) {
        const a = -1 + i / 6, b = a + 1 / 6;
        segment(head, [a * .215, -.37 + a * a * .10, .846], [b * .215, -.37 + b * b * .10, .846], .027, "smile");
      }
      let maxReach = 0;
      for (const sign of [-1, 1]) {
        const c = smooth(sign < 0 ? cover : (cover - .035) / .965), arc = Math.sin(c * Math.PI);
        const shoulder = point(body, [sign * .48, 1.29, .19]);
        const idle = point(body, [sign * (.70 + breath * .006), .64 + Math.sin(time * 1.6 + sign * .45) * .009, .34]);
        const eye = point(head, [sign * .34, .045, .84]);
        const target = add(eye, [0, -.145, .22]);
        const wrist = add(mix(idle, target, c), [sign * arc * .18, arc * .11, arc * .16]);
        const direction = normalize(subtract(wrist, shoulder)), distance = Math.min(length(subtract(wrist, shoulder)), 1.258), upper = .64, lower = .64;
        const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
        const hint: Vector = [sign * .55, -.80, -.1];
        const bend = normalize(subtract(hint, scale(direction, dot(hint, direction))));
        const elbow = add(add(shoulder, scale(direction, along)), scale(bend, Math.sqrt(Math.max(0, upper * upper - along * along))));
        const actualWrist = add(shoulder, scale(direction, distance));
        maxReach = Math.max(maxReach, length(subtract(elbow, shoulder)), length(subtract(actualWrist, elbow)));
        mesh(world, shoulder, [.175, .18, .175], "hood");
        segment(world, shoulder, elbow, .164, "hood"); mesh(world, elbow, [.164, .164, .164], "hood");
        segment(world, elbow, actualWrist, .15, "hood");
        const handUp = normalize(mix(normalize(subtract(actualWrist, elbow)), [sign * -.09, 1, .04], c));
        const hand = basis(actualWrist, handUp, [0, 0, 1]);
        mesh(hand, [0, .01, 0], [.157, .062, .155], "seam");
        mesh(hand, [0, .045, 0], [.165, .055, .16], "hood");
        mesh(hand, [0, .19, .018], [.272, .32, .17], "cream");
        mesh(hand, [sign * -.23, .17, .065], [.10, .155, .13], "cream", [0, 0, sign * -.40]);
      }
      if (count > 128) throw Error("Puppet instance budget exceeded");
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.useProgram(program); gl.bindVertexArray(array); gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
      gl.uniform1f(uniformDark, pose.dark ? 1 : 0);
      const shadow = multiply(transform([0, -.015, .02]), transform([0, 0, 0], [0, 0, 0], [.85, .001, .34]));
      const saved = instances.slice(0, 24); instances.set(shadow, 0); instances.set([.1, .06, .14, 1, 0, 0, 1, 0], 16);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, instances.subarray(0, 24)); gl.uniform1i(uniformPass, 2); gl.depthMask(false); gl.drawElementsInstanced(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0, 1);
      instances.set(saved, 0); gl.bufferSubData(gl.ARRAY_BUFFER, 0, instances.subarray(0, count * 24));
      gl.uniform1i(uniformPass, 1); gl.drawElementsInstanced(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0, count);
      gl.depthMask(true); gl.uniform1i(uniformPass, 0); gl.drawElementsInstanced(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0, count);
      gl.bindVertexArray(furArray); gl.uniform1i(uniformPass, 3); gl.depthMask(false); gl.drawArraysInstanced(gl.POINTS, 0, furCount, count); gl.depthMask(true);
      if (!painted && !firstPaint) { firstPaint = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); gl.flush(); }
      host.dataset.instances = String(count); host.dataset.drawCalls = "4"; host.dataset.triangles = String(indices.length / 3 * (count * 2 + 1));
      host.dataset.furPoints = String(furCount * count);
      host.dataset.armLength = maxReach.toFixed(4); host.dataset.drawMs = (performance.now() - started).toFixed(2);
    }
    resize();
    host.dataset.geometryBytes = String(vertices.length * 4 + indices.length * 2 + instances.byteLength + furVertices.byteLength);
    return { draw, resize, dispose };
  } catch (error) { dispose(); throw error; }
}
