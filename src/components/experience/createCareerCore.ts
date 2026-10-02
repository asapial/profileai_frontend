import * as THREE from "three";
import { CAREER_MOTION } from "@/lib/career-story";
import { sceneNodes, sceneConnections, type SceneFrame } from "@/lib/career-scene";

/** A single procedural renderer; six meshes survive every chapter transition. */
export function createCareerCore(host: HTMLElement, onFailure: () => void) {
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,CAREER_MOTION.dpr));
  renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden","true");host.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-2.8,2.8,2.37,-2.37,.1,30);
  camera.position.z=9;
  const core=new THREE.Group();scene.add(core);
  scene.add(new THREE.AmbientLight(0xffffff,1.7));
  const light=new THREE.DirectionalLight(0xf0ddff,2.1);light.position.set(-3,4,5);scene.add(light);
  const shape=new THREE.Shape();
  shape.moveTo(-.46,-.5);shape.lineTo(.46,-.5);shape.quadraticCurveTo(.5,-.5,.5,-.44);
  shape.lineTo(.5,.44);shape.quadraticCurveTo(.5,.5,.46,.5);shape.lineTo(-.46,.5);
  shape.quadraticCurveTo(-.5,.5,-.5,.44);shape.lineTo(-.5,-.44);shape.quadraticCurveTo(-.5,-.5,-.46,-.5);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelSize:.009,bevelThickness:.009,bevelSegments:2,curveSegments:4,steps:1});
  const paperMaterial=new THREE.MeshStandardMaterial({color:0xf0e6f7,roughness:.5,metalness:.04,transparent:true});
  const paper=new THREE.Mesh(geometry,paperMaterial);paper.scale.set(3.08,3.92,1);paper.position.set(0,.12,-.09);core.add(paper);
  const materials=Array.from({length:6},()=>new THREE.MeshStandardMaterial({color:0xd4c0e8,roughness:.6,metalness:.06,transparent:true}));
  const edges=materials.map(()=>new THREE.MeshBasicMaterial({color:0x8861a8,transparent:true,opacity:.5}));
  const layers=materials.map((material,i)=>{
    const group=new THREE.Group();
    const depth=new THREE.Mesh(geometry,edges[i]);depth.position.set(.012,-.045,-.04);
    group.add(depth,new THREE.Mesh(geometry,material));core.add(group);return group;
  });
  const positions=new Float32Array(30),lineGeometry=new THREE.BufferGeometry();
  lineGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const lineMaterial=new THREE.LineBasicMaterial({color:0xbc94e2,transparent:true,opacity:.5});
  const lines=new THREE.LineSegments(lineGeometry,lineMaterial);lines.frustumCulled=false;core.add(lines);
  let story:SceneFrame={phase:'hero',previous:'hero',local:0};
  let active=true,visible=false,disposed=false,raf=0;
  const draw=()=>{
    raf=0;if(disposed||!active||!visible||document.hidden)return;
    const nodes=sceneNodes(story);
    paperMaterial.opacity=story.phase==='hero'?1-story.local:story.phase==='finalCta'?story.local:0;
    layers.forEach((group,i)=>{
      const n=nodes[i];group.position.set((n.x+n.w/2-260)/100,(220-n.y-n.h/2)/100,n.z/100);
      group.scale.set(n.w/100,n.h/100,1);materials[i].opacity=n.opacity;edges[i].opacity=n.opacity*.5;
    });
    const pairs=sceneConnections(story.phase);
    for(let i=0;i<5;i++){
      const pair=pairs[i];
      const a=nodes[pair?.[0]??0],b=nodes[pair?.[1]??0];
      const drawProgress=Math.min(1,story.local*2);
      const ax=(a.x+a.w/2-260)/100,ay=(220-a.y-a.h/2)/100;
      const bx=(b.x+b.w/2-260)/100,by=(220-b.y-b.h/2)/100;
      positions.set([ax,ay,-.12,ax+(bx-ax)*drawProgress,ay+(by-ay)*drawProgress,-.12],i*6);
    }
    lineGeometry.attributes.position.needsUpdate=true;
    lineMaterial.opacity=story.phase==='hero'?story.local*.5:.45;
    renderer.render(scene,camera);
  };
  const stop=()=>{cancelAnimationFrame(raf);raf=0;};
  const wake=()=>{if(!raf&&!disposed&&active&&visible&&!document.hidden)raf=requestAnimationFrame(draw);};
  const resize=new ResizeObserver(()=>{
    const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;
    renderer.setSize(width,height,false);
    const aspect=width/height,halfH=Math.max(2.2,2.6/aspect);
    camera.left=-halfH*aspect;camera.right=halfH*aspect;camera.top=halfH;camera.bottom=-halfH;camera.updateProjectionMatrix();wake();
  });resize.observe(host);
  const observer=new IntersectionObserver(([entry])=>{visible=Boolean(entry?.isIntersecting);if(visible)wake();else stop();});observer.observe(host);
  const visibility=()=>{if(document.hidden)stop();else wake();};document.addEventListener('visibilitychange',visibility);
  const lost=(event:Event)=>{event.preventDefault();stop();onFailure();};renderer.domElement.addEventListener('webglcontextlost',lost);
  return {
    setStory(value:SceneFrame){story=value;wake();},
    setActive(value:boolean){active=value;if(active)wake();else stop();},
    setTheme(dark:boolean){materials.forEach(material=>material.color.set(dark?0xc3abd9:0xdfcfed));lineMaterial.color.set(dark?0xcfa5f1:0xa779cc);wake();},
    dispose(){disposed=true;stop();resize.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',visibility);renderer.domElement.removeEventListener('webglcontextlost',lost);[geometry,lineGeometry].forEach(g=>g.dispose());[...materials,...edges,lineMaterial,paperMaterial].forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();},
  };
}
