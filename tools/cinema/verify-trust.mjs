/** Native acceptance for the first reading section and the cinema handoff.
 * node tools/cinema/verify-trust.mjs --helper <cdp.mjs> --out ../tmp/trust-review [--all]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const args=process.argv.slice(2), option=(key,fallback)=>{const i=args.indexOf("--"+key);return i<0?fallback:args[i+1];};
const helper=option("helper",process.env.PROFILEAI_BROWSER_HELPER);
if(!helper)throw Error("Pass --helper with the compatible CDP Browser module.");
const {Browser,sleep}=await import(pathToFileURL(resolve(helper)).href);
const frontend=resolve(dirname(fileURLToPath(import.meta.url)),"../.."),out=resolve(option("out",join(frontend,"../tmp/trust-review")));
mkdirSync(out,{recursive:true});
const steps=JSON.parse(readFileSync(join(frontend,"src/lib/career-cinema.ts"),"utf8").match(/SCENE_DISTANCES = (\[[^\]]+\])/)[1]);
const progress=unit=>{const i=Math.min(steps.length-1,Math.floor(unit));return(steps.slice(0,i).reduce((n,v)=>n+v,0)+(unit-i)*steps[i])/steps.reduce((n,v)=>n+v,0);};
const sizes=args.includes("--all")?[[1440,900],[1796,782],[1024,800],[768,1024],[390,844],[320,740],[844,390]]:[[1440,900],[390,844]];
const report={views:[],interactions:[],handoffs:[],reduced:[],failures:[],console:[]};
const browser=await Browser.launch({extraArgs:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const key=async(page,name,code)=>{const physical=name===" "?"Space":name;await page.send("Input.dispatchKeyEvent",{type:"keyDown",key:name,code:physical,windowsVirtualKeyCode:code,...(name==="Enter"?{text:"\r"}:{})});await page.send("Input.dispatchKeyEvent",{type:"keyUp",key:name,code:physical,windowsVirtualKeyCode:code});};
const paint=async page=>{await sleep(160);await page.screenshot({quality:15});await sleep(50);};
const atTrust=page=>page.eval(()=>window.scrollTo({top:document.querySelector("[data-trust-evidence]").getBoundingClientRect().top+scrollY-80,behavior:"instant"}));
async function audit(page){return page.eval(()=>{
  const root=document.querySelector("[data-trust-evidence]"),host=root.querySelector("[data-trust-inspector]");
  const lowContrast=[],small=[],overflow=[],overlaps=[],ranges=[];
  const pixel=document.createElement("canvas");pixel.width=pixel.height=1;const ctx=pixel.getContext("2d",{willReadFrequently:true});
  const rgba=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return[...ctx.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);};
  const blend=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3])).concat(1);
  const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){
    const text=node.textContent.trim(),el=node.parentElement;if(!text||!el||el.closest("svg,style,script"))continue;
    const cs=getComputedStyle(el),size=parseFloat(cs.fontSize);if(size<.1||cs.display==="none"||cs.visibility==="hidden"||el.getClientRects().length===0)continue;
    let bg=[255,255,255,1];const parents=[];for(let p=el;p;p=p.parentElement)parents.unshift(p);for(const p of parents){const style=getComputedStyle(p);bg=blend(rgba(p===root?style.getPropertyValue("--environment-ground").trim()||style.backgroundColor:style.backgroundColor),bg);}
    const fg=blend(rgba(cs.color),bg),contrast=(Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05),minimum=size>=24||size>=18.66&&+cs.fontWeight>=700?3:4.5;
    if(contrast<minimum-.03)lowContrast.push({text,contrast,minimum});if(size<14)small.push({text,size});
    const range=document.createRange();range.selectNodeContents(node);const panel=el.closest("[data-trust-claim],[data-trust-source],[data-trust-principle]"),box=panel?.getBoundingClientRect();
    for(const r of range.getClientRects()){
      if(r.width<1||r.height<1)continue;
      if(r.left<-.5||r.right>innerWidth+.5||box&&(r.left<box.left-1||r.right>box.right+1||r.top<box.top-1||r.bottom>box.bottom+1))overflow.push({text,left:r.left,right:r.right,top:r.top,bottom:r.bottom});
      ranges.push({text,el,r});
    }
  }
  for(let i=0;i<ranges.length;i++)for(let j=i+1;j<ranges.length;j++){
    const a=ranges[i],b=ranges[j];if(a.el===b.el||a.el.contains(b.el)||b.el.contains(a.el))continue;
    if(Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left)>3&&Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top)>4)overlaps.push([a.text,b.text]);
  }
  const box=host.getBoundingClientRect(),metric=root.querySelector("[data-trust-metric]").getBoundingClientRect(),source=root.querySelector("[data-trust-source]").getBoundingClientRect();
  const circle=selector=>{const el=root.querySelector(selector);return{x:+el.getAttribute("cx")+box.left,y:+el.getAttribute("cy")+box.top};};
  const start=circle("[data-trust-route-start]"),end=circle("[data-trust-route-end]");
  const routeError=Math.max(Math.abs(start.x-(metric.left+metric.width/2)),Math.abs(start.y-(metric.bottom+4)),Math.abs(end.x-(source.left+source.width*.62)),Math.abs(end.y-(source.top+1)));
  const title=root.querySelector("h2"),headlineLines=title.getBoundingClientRect().height/parseFloat(getComputedStyle(title).lineHeight);
  const environment=root.querySelector('[data-environment="trust"]'),scenery=environment?.getBoundingClientRect();
  const backgroundReady=!!scenery&&Math.abs(scenery.left)<1&&Math.abs(scenery.right-innerWidth)<1&&scenery.height>=root.offsetHeight-1&&environment.getAttribute("aria-hidden")==="true"&&getComputedStyle(environment).pointerEvents==="none";
  return{theme:document.documentElement.classList.contains("dark")?"dark":"light",width:innerWidth,height:innerHeight,sectionHeight:root.offsetHeight,backgroundReady,routeReady:host.dataset.routeReady,routeError,headlineLines,href:root.querySelector("[data-trust-cta]").getAttribute("href"),horizontalOverflow:document.documentElement.scrollWidth>innerWidth,lowContrast,small,overflow,overlaps};
});}
async function capture(page,tag){
  const box=await page.eval(()=>{const r=document.querySelector("[data-trust-evidence]").getBoundingClientRect();return{x:0,y:r.top+scrollY-80,width:innerWidth,height:Math.ceil(r.height+80),scale:1};});
  const shot=await page.send("Page.captureScreenshot",{format:"jpeg",quality:88,captureBeyondViewport:true,clip:box});
  writeFileSync(join(out,tag+".jpg"),Buffer.from(shot.data,"base64"));
}
async function interaction(page,tag){
  await page.eval(()=>document.querySelector("[data-trust-source] summary").focus());await key(page,"Enter",13);await paint(page);
  const collapsed=await page.eval(()=>!document.querySelector("[data-trust-source]").open&&document.querySelector("[data-trust-view-source]").getAttribute("aria-expanded")==="false");
  await page.eval(()=>document.querySelector("[data-trust-view-source]").focus());await key(page,"Enter",13);await paint(page);
  const opened=await page.eval(()=>document.querySelector("[data-trust-source]").open&&document.activeElement===document.querySelector("[data-trust-quote]")&&document.querySelector("[data-trust-view-source]").getAttribute("aria-expanded")==="true");
  await page.eval(()=>document.querySelector("[data-trust-source] summary").focus());await key(page," ",32);await paint(page);
  const space=await page.eval(()=>!document.querySelector("[data-trust-source]").open);
  await key(page," ",32);await paint(page);
  const reopened=await page.eval(()=>document.querySelector("[data-trust-source]").open);
  const geometry=await audit(page);const result={tag,collapsed,opened,space,reopened,routeError:geometry.routeError};report.interactions.push(result);
  if(!collapsed||!opened||!space||!reopened||geometry.routeError>.6)report.failures.push({reason:"source disclosure keyboard/focus/route",...result});
}
async function handoff(page,tag){
  const poses=[];let canvas;
  for(const unit of [7,7.65,7.8,8,7.8,7]){
    await page.eval(value=>{const film=document.querySelector('[class*="__film"]');window.scrollTo({top:film.getBoundingClientRect().top+scrollY+value*(film.offsetHeight-innerHeight),behavior:"instant"});},progress(unit));
    let actual=-1;for(let i=0;i<75;i++){actual=await page.eval(()=>+document.querySelector("[data-resume-preview]").dataset.unit);if(Math.abs(actual-unit)<.001)break;if(i%4===3)await page.screenshot({quality:15});await sleep(120);}
    if(Math.abs(actual-unit)>=.001)throw Error("Unsettled cinema handoff "+actual+" instead of "+unit);
    await paint(page);
    const pose=await page.eval(()=>{const root=document.querySelector("[data-trust-evidence]"),preview=document.querySelector("[data-resume-preview]"),gallery=document.querySelector("[data-template-gallery]"),stage=document.querySelector('[class*="__stage"]');return{scroll:scrollY,top:root.getBoundingClientRect().top,headingTop:root.querySelector("h2").getBoundingClientRect().top,previewOpacity:+preview.style.opacity,roomOpacity:+gallery.style.opacity,renderer:gallery.dataset.renderer,margin:parseFloat(getComputedStyle(document.getElementById("static-zone")).marginTop),height:innerHeight,background:getComputedStyle(root).getPropertyValue("--story-bg").trim(),stageBackground:getComputedStyle(stage).getPropertyValue("--cg-bg").trim()};});
    if(unit===7&&canvas===undefined){canvas=true;await page.eval(()=>{window.__trustCanvas=document.querySelector("[data-gallery-canvas]");});}
    poses.push({unit,...pose});
    if(poses.length<=4)await page.screenshot({path:join(out,tag+"-handoff-"+unit+".jpg"),quality:86});
  }
  const sameCanvas=await page.eval(()=>window.__trustCanvas===document.querySelector("[data-gallery-canvas]"));
  const final=poses[3],reverse=poses[5];
  if(!sameCanvas||Math.abs(reverse.top-poses[0].top)>.5||final.previewOpacity>.002||final.roomOpacity>.002||poses[2].headingTop>=poses[2].height-16||poses.some(p=>p.renderer!=="webgl"||p.background!==p.stageBackground)||poses.slice(1,4).some((p,i)=>p.top>=poses[i].top))report.failures.push({reason:"cinema/reading transition",tag,sameCanvas,poses});
  report.handoffs.push({tag,sameCanvas,poses});
}
try{
  for(const theme of ["dark","light"]){
    const page=await browser.newPage({width:1440,height:900});
    await page.send("Page.addScriptToEvaluateOnNewDocument",{source:"localStorage.setItem('theme',"+JSON.stringify(theme)+");"});
    await page.goto("http://localhost:3000/",{settleMs:900});await page.send("Page.bringToFront");await page.eval(()=>document.fonts.ready.then(()=>true));
    for(const [width,height] of sizes){
      const tag=theme+"-"+width+"x"+height;await page.setViewport({width,height,mobile:width<600});await page.eval(()=>document.activeElement?.blur());await atTrust(page);await paint(page);
      const view={tag,...await audit(page)};report.views.push(view);
      if(view.theme!==theme||!view.backgroundReady||view.routeReady!=="true"||view.routeError>.6||view.headlineLines>2.05||view.href!=="/register"||view.horizontalOverflow||["lowContrast","small","overflow","overlaps"].some(key=>view[key].length))report.failures.push(view);
      await capture(page,tag);
      if(width===1440||width===390)await interaction(page,tag);
      if(width===1440||width===390)await handoff(page,tag);
      console.log(tag+": "+["lowContrast","small","overflow","overlaps"].reduce((n,key)=>n+view[key].length,0)+" layout issues; route error "+view.routeError.toFixed(3)+"px");
    }
    report.console.push(...page.consoleErrors.map(error=>({theme,error})));await page.close();
    const reduced=await browser.newPage({width:1440,height:900,reducedMotion:true});
    await reduced.send("Page.addScriptToEvaluateOnNewDocument",{source:"localStorage.setItem('theme',"+JSON.stringify(theme)+");"});
    await reduced.goto("http://localhost:3000/",{settleMs:700});await atTrust(reduced);await paint(reduced);
    const state=await reduced.eval(()=>({margin:parseFloat(getComputedStyle(document.getElementById("static-zone")).marginTop),animations:[...document.querySelectorAll("[data-trust-evidence], [data-trust-evidence] *")].map(el=>getComputedStyle(el).animationName)}));
    report.reduced.push({theme,...state});if(state.margin!==0||state.animations.some(name=>name!=="none"))report.failures.push({reason:"reduced motion",theme,...state});
    report.console.push(...reduced.consoleErrors.map(error=>({theme,reduced:true,error})));await reduced.close();
  }
}catch(error){report.failures.push({error:String(error),stack:error.stack});}
finally{
  writeFileSync(join(out,"report.json"),JSON.stringify(report,null,2));
  const dir=resolve(browser.dir);if(!dir.startsWith(resolve(tmpdir())+sep)||!basename(dir).startsWith("ad-chrome-"))throw Error("Unexpected disposable profile: "+dir);
  await browser.close();
}
console.log(JSON.stringify({views:report.views.length,interactions:report.interactions.length,handoffs:report.handoffs.length,reduced:report.reduced.length,failures:report.failures.length,console:report.console.length,out}));
if(report.failures.length||report.console.length)process.exitCode=1;
