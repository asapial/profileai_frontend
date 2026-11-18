/**
 * Local visual acceptance checks. Pass a zero-dependency CDP Browser helper:
 * node tools/cinema/verify-assembly.mjs --helper <cdp.mjs> --out <directory> [--all] [--fallback]
 * The design-taste-frontend skill supplies the compatible browser helper.
 */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {resolve,join,dirname,basename,sep} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {tmpdir} from "node:os";
const args=process.argv.slice(2),opt=(name,fallback)=>{const index=args.indexOf("--"+name);return index<0?fallback:args[index+1];};
const helper=opt("helper",process.env.PROFILEAI_BROWSER_HELPER);if(!helper)throw Error("Pass --helper with a compatible CDP Browser module.");
const {Browser,sleep}=await import(pathToFileURL(resolve(helper)).href);
const frontend=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const out=resolve(opt("out",join(frontend,"../tmp/assembly-review")));mkdirSync(out,{recursive:true});
const steps=JSON.parse(readFileSync(join(frontend,"src/lib/career-cinema.ts"),"utf8").match(/SCENE_DISTANCES = (\[[^\]]+\])/)[1]);
const progress=unit=>{const i=Math.min(steps.length-1,Math.floor(unit));return(steps.slice(0,i).reduce((n,s)=>n+s,0)+(unit-i)*steps[i])/steps.reduce((n,s)=>n+s,0);};
const fallback=args.includes("--fallback"),all=args.includes("--all"),park=args.includes("--park");
const sizes=all?[[1440,900],[1796,782],[1024,800],[768,1024],[390,844],[430,932],[390,667],[320,740],[844,390]]:args.includes("--smoke")?[[1440,900]]:fallback?[[1440,900],[390,844]]:[[1440,900],[390,844],[768,1024],[844,390]];
const cases=["dark","light"].flatMap(theme=>sizes.map(([width,height])=>({theme,width,height,locale:"en"})));
if(all)for(const theme of ["dark","light"])for(const [width,height]of[[1440,900],[390,667]])cases.push({theme,width,height,locale:"bn"});
const report={views:[],failures:[],console:[],behavior:[]};
const browser=await Browser.launch({extraArgs:fallback?["--disable-webgl"]:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
try{
 for(const {theme,width,height,locale}of cases){
  const page=await browser.newPage({width,height,mobile:width<600});
  const errors=[];page.browser.on(page.sessionId,"Runtime.consoleAPICalled",message=>{if(message.type==="error")errors.push((message.args??[]).map(arg=>arg.value??arg.description??"").join(" ").slice(0,400));});
  await page.send("Page.addScriptToEvaluateOnNewDocument",{source:"localStorage.setItem('theme',"+JSON.stringify(theme)+");"});
  await page.goto("http://localhost:3000/?lang="+locale+(park?"&scrub":""),{settleMs:1500});await page.send("Page.bringToFront");await page.eval(()=>document.fonts.ready.then(()=>true));
  for(let ready=0;ready<100;ready++){if(await page.eval(()=>document.querySelector("[data-assembly]")?.dataset.unit!==undefined))break;await sleep(100);}
  const go=async unit=>{
   if(park)await page.eval(value=>{const film=document.querySelector('[class*="__film"]');window.scrollTo({top:film.getBoundingClientRect().top+scrollY+1,behavior:"instant"});const input=document.querySelector('[class*="__scrubber"] input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,String(value));input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));document.querySelector('[class*="__scrubber"]').style.display="none";},unit);
   else await page.eval(value=>{const film=document.querySelector('[class*="__film"]');window.scrollTo({top:film.getBoundingClientRect().top+scrollY+value*(film.offsetHeight-innerHeight),behavior:"instant"});},progress(unit));
   let actual=-1;for(let n=0;n<90;n++){actual=await page.eval(()=>Number(document.querySelector("[data-assembly]")?.dataset.unit??-1));if(Math.abs(actual-unit)<(park?.00005:.001))break;if(n%4===3)await page.screenshot({quality:25});await sleep(180);}
   if(Math.abs(actual-unit)>=(park?.00005:.001))throw Error("Unsettled assembly at "+actual+" instead of "+unit);await sleep(150);
  };
  await go(6);
  if(!fallback)for(let n=0;n<120;n++){if(await page.eval(()=>document.querySelector("[data-template-gallery]").dataset.renderer==="webgl"))break;await sleep(150);}
  await sleep(200);
  const audit=()=>page.eval(()=>{
   const root=document.querySelector("[data-assembly]"),gallery=document.querySelector("[data-template-gallery]");
   const lowContrast=[],small=[],overflow=[],overlaps=[],ranges=[],ports=[];
   const canvas=document.createElement("canvas");canvas.width=canvas.height=1;const ctx=canvas.getContext("2d",{willReadFrequently:true});
   const rgba=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map((n,i)=>i===3?n/255:n);};
   const blend=(a,b)=>a.slice(0,3).map((n,i)=>n*a[3]+b[i]*(1-a[3])).concat(1);
   const lum=c=>c.slice(0,3).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
   const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
   const visible=el=>{let opacity=1;for(let p=el;p;p=p.parentElement){const cs=getComputedStyle(p);if(cs.display==="none"||cs.visibility==="hidden"||cs.clipPath.includes("inset(50%)"))return false;opacity*=+cs.opacity;}return opacity>.95&&el.getBoundingClientRect().width>0;};
   for(const section of[root,document.querySelector('[data-chapter="6"]'),document.querySelector('[class*="__midCta"]')].filter(Boolean)){
    const walker=document.createTreeWalker(section,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){
     const text=node.textContent.trim(),el=node.parentElement;if(!text||!el||el.closest("svg,style,script,option")||!visible(el))continue;
     const cs=getComputedStyle(el);let bg=[255,255,255,1];const parents=[];for(let p=el;p;p=p.parentElement)parents.unshift(p);for(const p of parents)bg=blend(rgba(getComputedStyle(p).backgroundColor),bg);
     const size=parseFloat(cs.fontSize),minimum=size>=24||size>=18.66&&+cs.fontWeight>=700?3:4.5,contrast=ratio(blend(rgba(cs.color),bg),bg);
     if(contrast<minimum-.03)lowContrast.push({text,contrast,minimum});if(size<13)small.push({text,size});
     const range=document.createRange();range.selectNodeContents(node);
     const panel=el.closest("[data-assembly-card],[data-assembly-status]"),box=panel?.getBoundingClientRect();
     for(const rect of range.getClientRects()){
      if(rect.width<1||rect.height<1)continue;
      if(rect.left<-.5||rect.right>innerWidth+.5||rect.top<79||rect.bottom>innerHeight||box&&(rect.left<box.left-1||rect.right>box.right+1||rect.top<box.top-1||rect.bottom>box.bottom+1))overflow.push({text,x:rect.x,y:rect.y,right:rect.right,bottom:rect.bottom,panel:box&&{x:box.x,y:box.y,right:box.right,bottom:box.bottom}});
      ranges.push({text,el,rect});
     }
    }
   }
   for(let i=0;i<ranges.length;i++)for(let j=i+1;j<ranges.length;j++){const a=ranges[i],b=ranges[j];if(a.el===b.el||a.el.contains(b.el)||b.el.contains(a.el))continue;const dx=Math.min(a.rect.right,b.rect.right)-Math.max(a.rect.left,b.rect.left),dy=Math.min(a.rect.bottom,b.rect.bottom)-Math.max(a.rect.top,b.rect.top);if(dx>3&&dy>4)overlaps.push([a.text,b.text]);}
   for(const path of root.querySelectorAll("[data-assembly-route]")){
    if(getComputedStyle(path).visibility==="hidden")continue;
    const port=root.querySelector('[data-assembly-port="'+path.dataset.assemblyRoute+'"]').getBoundingClientRect(),local=path.getPointAtLength(path.getTotalLength()),end=new DOMPoint(local.x,local.y).matrixTransform(path.getScreenCTM());
    const error=Math.hypot(end.x-(port.left+port.width/2),end.y-(port.top+port.height/2));if(error>1)ports.push({key:path.dataset.assemblyRoute,error});
   }
   const paper=gallery.querySelector('[class*="__fallbackCard"][aria-pressed="true"]').getBoundingClientRect(),heading=document.querySelector('[data-chapter="6"] p')?.getBoundingClientRect();
   if(heading&&paper.top-heading.bottom<5)overflow.push({reason:"heading touches the paper",heading:heading.bottom,paper:paper.top});
   const phases=[...root.querySelectorAll("[data-assembly-card]")].map(card=>card.dataset.phase);
   return {opacity:+root.style.opacity,inert:root.inert,layout:root.dataset.layout,selected:root.dataset.selectedTemplate,placed:+root.dataset.placed,active:root.dataset.activeSection,inspected:root.dataset.inspected,progress:+root.querySelector('[role="progressbar"]').getAttribute("aria-valuenow"),phases,renderer:gallery.dataset.renderer,mode:gallery.dataset.mode,measured:JSON.parse(gallery.dataset.sectionRegions??"[]"),floor:+gallery.style.getPropertyValue("--gallery-floor"),paper:{x:paper.x,y:paper.y,width:paper.width,height:paper.height},lowContrast,small,overflow,overlaps,ports};
  });
  const tag=(locale==="bn"?"bn-":"")+theme+"-"+width+"x"+height;
  const view={theme,width,height,locale,...await audit()};report.views.push(view);
  const invalid=result=>["lowContrast","small","overflow","overlaps","ports"].some(key=>result[key].length);
  if(view.opacity<.99||view.inert||view.placed!==2||view.active!=="projects"||view.progress!==40||view.renderer!==(fallback?"css":"webgl")||view.mode!=="assembly"||view.floor<.99||view.measured.length!==5||invalid(view))report.failures.push(view);
  await page.screenshot({path:join(out,tag+".jpg"),quality:88});
  if(width<600){
   await page.eval(()=>{const select=document.querySelector("[data-assembly] select");select.value="3";select.dispatchEvent(new Event("change",{bubbles:true}));});await sleep(180);
   if(await page.eval(()=>document.querySelector("[data-assembly]").dataset.inspected)!=="skills")report.failures.push({theme,width,height,locale,reason:"compact section inspection"});
  }
  await go(6.4);const complete=await audit();
  if(complete.placed!==5||complete.progress!==100||complete.active!=="complete"||complete.phases.some(phase=>phase!=="placed")||invalid(complete))report.failures.push({theme,width,height,locale,phase:"complete",...complete});
  if(width===1440&&theme==="dark"&&locale==="en"&&!all&&!fallback&&!park){
   await go(6);await page.eval(()=>{window.__assemblyCanvas=document.querySelector("[data-gallery-canvas]");document.querySelector('[data-assembly-card="skills"]').focus({preventScroll:true});});
   await page.send("Input.dispatchKeyEvent",{type:"keyDown",key:"Enter",code:"Enter",windowsVirtualKeyCode:13,text:"\r"});await page.send("Input.dispatchKeyEvent",{type:"keyUp",key:"Enter",code:"Enter",windowsVirtualKeyCode:13});await sleep(180);
   if(await page.eval(()=>document.querySelector("[data-assembly]").dataset.inspected)!=="skills")report.failures.push({reason:"native Enter inspects a source section"});
   // Real scroll offsets are pixel-rounded; wait for drawing to settle before measuring idle.
   let draws=-1,stable=0;for(let sample=0;sample<30&&stable<3;sample++){await sleep(350);const next=await page.eval(()=>+document.querySelector("[data-gallery-canvas]").dataset.draws);stable=next===draws?stable+1:0;draws=next;}
   if(stable<3)report.failures.push({reason:"room did not settle before the idle check"});await sleep(900);
   if(draws!==await page.eval(()=>+document.querySelector("[data-gallery-canvas]").dataset.draws))report.failures.push({reason:"room redraws while idle"});
   for(const unit of[5,5.5,5.7,5.85,6,6.2,6.4,6.65,6.85,7]){await go(unit);await page.screenshot({path:join(out,"transition-"+unit+".jpg"),quality:82});}
   await go(6);const reverse=await audit();if(JSON.stringify(view.paper)!==JSON.stringify(reverse.paper))report.failures.push({reason:"reverse scroll changes the paper's resting pose",before:view.paper,after:reverse.paper});
   if(!await page.eval(()=>window.__assemblyCanvas===document.querySelector("[data-gallery-canvas]")))report.failures.push({reason:"gallery/assembly replaced the shared canvas"});
   for(const slug of["kinship","gridline","harbor","orbit","apex","editorial-cut","oblique"]){
    await go(5);await page.eval(id=>document.querySelector('[data-gallery-choice="'+id+'"]').click(),slug);await sleep(750);await go(6);
    const chosen=await audit();if(chosen.selected!==slug||chosen.measured.length!==5||invalid(chosen))report.failures.push({reason:"catalog assembly",slug,...chosen});
   }
   await go(4);await page.eval(()=>document.querySelectorAll('[data-panel="suggestion"] [class*="__reviewActions"] button')[1].click());await sleep(200);await go(6);
   if(!await page.eval(()=>decodeURIComponent(document.querySelector('[data-catalog-template] img').src).includes("reusable React components")))report.failures.push({reason:"accepted source text lost"});
   report.behavior.push({nativeEnter:true,sharedCanvas:true,reversible:true,idleDraws:draws,allSevenTemplates:true,acceptedTextPreserved:true});
  }
  report.console.push(...page.consoleErrors.map(error=>({tag,error})),...errors.map(error=>({tag,error})));await page.close();
  console.log(tag+": "+view.renderer+", "+(view.lowContrast.length+view.overflow.length+view.overlaps.length)+" issues");
 }
}finally{
 const profile=resolve(browser.dir);if(!profile.startsWith(resolve(tmpdir())+sep)||!basename(profile).startsWith("ad-chrome-"))throw Error("Unexpected browser profile cleanup path");
 await browser.close();writeFileSync(join(out,"report.json"),JSON.stringify(report,null,2));
}
console.log(JSON.stringify({views:report.views.length,failures:report.failures,console:report.console},null,2));if(report.failures.length||report.console.length)process.exitCode=1;
