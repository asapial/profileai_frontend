/** Native visual and interaction checks for the shared A4 podium scene.
 * node tools/cinema/verify-preview.mjs --helper <cdp.mjs> --out <directory> [--all] [--fallback] [--park]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const args = process.argv.slice(2), option = (key, fallback) => { const index = args.indexOf("--" + key); return index < 0 ? fallback : args[index + 1]; };
const helper = option("helper", process.env.PROFILEAI_BROWSER_HELPER);
if (!helper) throw Error("Pass --helper with the compatible CDP Browser module.");
const { Browser, sleep } = await import(pathToFileURL(resolve(helper)).href);
const frontend = resolve(dirname(fileURLToPath(import.meta.url)), "../.."), out = resolve(option("out", join(frontend, "../tmp/preview-review")));
mkdirSync(out, { recursive: true });
const steps = JSON.parse(readFileSync(join(frontend, "src/lib/career-cinema.ts"), "utf8").match(/SCENE_DISTANCES = (\[[^\]]+\])/)[1]);
const progress = unit => { const i = Math.min(steps.length - 1, Math.floor(unit)); return (steps.slice(0, i).reduce((n, v) => n + v, 0) + (unit - i) * steps[i]) / steps.reduce((n, v) => n + v, 0); };
const fallback = args.includes("--fallback"), all = args.includes("--all"), park = args.includes("--park");
const sizes = all ? [[1440,900],[1796,782],[1024,800],[768,1024],[390,844],[430,932],[390,667],[320,740],[844,390]] : args.includes("--smoke") ? [[1440,900]] : [[1440,900],[390,844]];
const cases = ["dark", "light"].flatMap(theme => sizes.map(([width,height]) => ({ theme, width, height, locale:"en" })));
if (all) for (const theme of ["dark","light"]) for (const [width,height] of [[1440,900],[390,667]]) cases.push({ theme,width,height,locale:"bn" });
const report = { views:[], failures:[], console:[], behavior:[] };
const browser = await Browser.launch({extraArgs:fallback ? ["--disable-webgl"] : ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
try {
  for (const {theme,width,height,locale} of cases) {
    const tag = (locale === "bn" ? "bn-" : "") + theme + "-" + width + "x" + height;
    const page = await browser.newPage({width,height,mobile:width<600});
    await page.send("Page.addScriptToEvaluateOnNewDocument", {source:"localStorage.setItem('theme',"+JSON.stringify(theme)+");"});
    await page.goto("http://localhost:3000/?lang="+locale+(park?"&scrub":""),{settleMs:1200}); await page.send("Page.bringToFront");
    await page.eval(()=>document.fonts.ready.then(()=>true));
    for (let i=0;i<100;i++) { if (await page.eval(()=>document.querySelector("[data-resume-preview]")?.dataset.unit!==undefined)) break; await sleep(100); }
    const go = async unit => {
      if (park) await page.eval(value=>{ const film=document.querySelector('[class*="__film"]'); window.scrollTo({top:film.getBoundingClientRect().top+scrollY+1,behavior:"instant"}); const input=document.querySelector('[class*="__scrubber"] input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,String(value)); input.dispatchEvent(new Event("input",{bubbles:true})); input.dispatchEvent(new Event("change",{bubbles:true})); document.querySelector('[class*="__scrubber"]').style.display="none"; },unit);
      else await page.eval(value=>{ const film=document.querySelector('[class*="__film"]');window.scrollTo({top:film.getBoundingClientRect().top+scrollY+value*(film.offsetHeight-innerHeight),behavior:"instant"}); },progress(unit));
      let actual=-1;
      for(let i=0;i<90;i++){ actual=await page.eval(()=>+document.querySelector("[data-resume-preview]").dataset.unit); if(Math.abs(actual-unit)<(park?.00005:.001))break;if(i%4===3)await page.screenshot({quality:25});await sleep(150); }
      if(Math.abs(actual-unit)>=(park?.00005:.001))throw Error("Unsettled preview: "+actual+" instead of "+unit);
      await sleep(180);
    };
    await go(7);
    if(!fallback)for(let i=0;i<120;i++){if(await page.eval(()=>document.querySelector("[data-template-gallery]").dataset.renderer==="webgl"))break;await sleep(120);}
    // Paint the settled pose before reading text bounds, including the CSS room.
    await page.screenshot({quality:20});
    const audit = () => page.eval(()=>{
      const root=document.querySelector("[data-resume-preview]"),gallery=document.querySelector("[data-template-gallery]"),canvas=gallery.querySelector("canvas");
      const lowContrast=[],small=[],overflow=[],overlaps=[],ranges=[];
      const pixel=document.createElement("canvas");pixel.width=pixel.height=1;const ctx=pixel.getContext("2d",{willReadFrequently:true});
      const rgba=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);};
      const blend=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3])).concat(1);
      const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
      const visible=el=>{let opacity=1;for(let p=el;p;p=p.parentElement){const cs=getComputedStyle(p);if(cs.display==="none"||cs.visibility==="hidden"||cs.clipPath.includes("inset(50%)"))return false;opacity*=+cs.opacity;}return opacity>.95&&el.getBoundingClientRect().width>0;};
      const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};
      for(const group of [root,document.querySelector('[data-chapter="7"]'),document.querySelector('[class*="__midCta"]')].filter(Boolean)){
        const walker=document.createTreeWalker(group,NodeFilter.SHOW_TEXT);let node;
        while((node=walker.nextNode())){
          const text=node.textContent.trim(),el=node.parentElement;if(!text||!el||el.closest("svg,style,script")||!visible(el))continue;
          const cs=getComputedStyle(el);let bg=[255,255,255,1];const parents=[];for(let p=el;p;p=p.parentElement)parents.unshift(p);for(const p of parents)bg=blend(rgba(getComputedStyle(p).backgroundColor),bg);
          const fg=blend(rgba(cs.color),bg),contrast=(Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05),size=parseFloat(cs.fontSize),minimum=size>=24||size>=18.66&&+cs.fontWeight>=700?3:4.5;
          if(contrast<minimum-.03)lowContrast.push({text,contrast,minimum});if(size<13)small.push({text,size});
          const range=document.createRange();range.selectNodeContents(node);const panel=el.closest("[data-preview-actions],[data-preview-proof]"),box=panel?.getBoundingClientRect();
          for(const r of range.getClientRects()){if(r.width<1||r.height<1)continue;if(r.left<-.5||r.right>innerWidth+.5||r.top<79||r.bottom>innerHeight||box&&(r.left<box.left-1||r.right>box.right+1||r.top<box.top-1||r.bottom>box.bottom+1))overflow.push({text,x:r.x,y:r.y,right:r.right,bottom:r.bottom,panel:box&&{x:box.x,y:box.y,right:box.right,bottom:box.bottom}});ranges.push({text,el,r});}
        }
      }
      for(let i=0;i<ranges.length;i++)for(let j=i+1;j<ranges.length;j++){const a=ranges[i],b=ranges[j];if(a.el===b.el||a.el.contains(b.el)||b.el.contains(a.el))continue;const dx=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left),dy=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);if(dx>3&&dy>4)overlaps.push({text:[a.text,b.text],a:{x:a.r.x,y:a.r.y,width:a.r.width,height:a.r.height},b:{x:b.r.x,y:b.r.y,width:b.r.width,height:b.r.height}});}
      const paper=root.querySelector("[data-preview-document]"),p=paper.getBoundingClientRect();
      for(const panel of root.querySelectorAll("[data-preview-actions],[data-preview-proof]")){if(!visible(panel))continue;const r=panel.getBoundingClientRect();if(Math.min(r.right,p.right)-Math.max(r.left,p.left)>2&&Math.min(r.bottom,p.bottom)-Math.max(r.top,p.top)>2)overlaps.push(["paper",panel.dataset.previewActions!==undefined?"actions":"proof"]);}
      const heading=document.querySelector('[data-chapter="7"] p')?.getBoundingClientRect();if(heading&&p.top-heading.bottom<5)overflow.push({reason:"heading touches paper",heading:heading.bottom,paper:p.top});
      return {theme:document.documentElement.classList.contains("dark")?"dark":"light",opacity:+root.style.opacity,inert:root.inert,layout:root.dataset.layout,selected:root.dataset.selectedTemplate,renderer:gallery.dataset.renderer,mode:gallery.dataset.mode,floor:+gallery.style.getPropertyValue("--gallery-floor"),podium:canvas.dataset.podium,reflections:canvas.dataset.reflections,aspect:+canvas.dataset.paperAspect,paper:rect(paper),base:rect(gallery.querySelector("[data-fallback-podium]")),actions:rect(root.querySelector("[data-preview-actions]")),lowContrast,small,overflow,overlaps};
    });
    const view={tag,width,height,locale,...await audit()};report.views.push(view);
    if(view.opacity<.99||view.inert||view.renderer!==(fallback?"css":"webgl")||view.mode!=="preview"||view.floor<.99||!fallback&&(view.podium!=="raised"||view.reflections!=="live"||Math.abs(view.aspect-210/297)>1e-9)||["lowContrast","small","overflow","overlaps"].some(key=>view[key].length))report.failures.push(view);
    await page.screenshot({path:join(out,tag+".jpg"),quality:88});
    await page.eval(()=>document.querySelector("[data-preview-enlarge]").focus({preventScroll:true}));
    await page.send("Input.dispatchKeyEvent",{type:"keyDown",key:"Enter",code:"Enter",windowsVirtualKeyCode:13,text:"\r"});await page.send("Input.dispatchKeyEvent",{type:"keyUp",key:"Enter",code:"Enter",windowsVirtualKeyCode:13});await sleep(180);
    const expanded=await page.eval(()=>{const dialog=document.querySelector("[data-resume-dialog]"),paper=dialog.querySelector("[data-preview-a4]");const r=paper?.getBoundingClientRect();return {open:dialog.open,ratio:r?r.width/r.height:0,src:paper?.querySelector("img").getAttribute("src"),focus:dialog.contains(document.activeElement)};});
    if(!expanded.open||!expanded.focus||Math.abs(expanded.ratio-210/297)>.001)report.failures.push({tag,reason:"native A4 enlarged preview",...expanded});
    if(width===1440&&locale==="en")await page.screenshot({path:join(out,tag+"-enlarged.jpg"),quality:86});
    await page.send("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});await page.send("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});await sleep(100);
    if(await page.eval(()=>document.querySelector("[data-resume-dialog]").open||document.activeElement!==document.querySelector("[data-preview-enlarge]")))report.failures.push({tag,reason:"Escape closes preview and restores focus"});
    if(width===1440&&theme==="dark"&&locale==="en"&&!all&&!fallback){
      await page.send("Browser.setDownloadBehavior",{behavior:"allow",downloadPath:out});await page.eval(()=>document.querySelector('[data-preview-output="download"]').click());
      const file=join(out,"alex-morgan-resume.pdf");for(let i=0;i<50&&!existsSync(file);i++)await sleep(100);
      const pdf=existsSync(file)?readFileSync(file,"latin1"):"",box=pdf.match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);
      if(!box||Math.abs(+box[1]*25.4/72-210)>.001||Math.abs(+box[2]*25.4/72-297)>.001)report.failures.push({reason:"downloaded PDF must be A4"});
      await page.eval(()=>{Object.defineProperty(navigator,"share",{configurable:true,value:undefined});Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async value=>{window.__previewShare=value;}}});document.querySelector('[data-preview-output="share"]').click();});await sleep(150);
      if(!await page.eval(()=>window.__previewShare?.endsWith("#scene-08")&&document.querySelector('[data-preview-actions] [aria-live]').textContent.includes("copied")))report.failures.push({reason:"share preserves the scene-08 deep link"});
      if(!park){
        await page.eval(()=>{window.__previewCanvas=document.querySelector("[data-gallery-canvas]");});
        for(const unit of [6.4,6.5,6.65,6.8,6.94,7,7.3,7.6]){await go(unit);await page.screenshot({path:join(out,"transition-"+unit+".jpg"),quality:84});}
        await go(7);if(!await page.eval(()=>window.__previewCanvas===document.querySelector("[data-gallery-canvas]")))report.failures.push({reason:"assembly and preview replaced the shared canvas"});
        const reversed=await audit();
        if(Object.keys(view.paper).some(key=>Math.abs(view.paper[key]-reversed.paper[key])>.5))report.failures.push({reason:"reverse scrolling changes the resting paper",before:view.paper,after:reversed.paper});
        let draws=-1,stable=0;
        for(let i=0;i<30&&stable<3;i++){await sleep(250);const next=await page.eval(()=>+document.querySelector("[data-gallery-canvas]").dataset.draws);stable=next===draws?stable+1:0;draws=next;}
        await sleep(600);
        if(stable<3||draws!==await page.eval(()=>+document.querySelector("[data-gallery-canvas]").dataset.draws))report.failures.push({reason:"the room keeps drawing after scroll settles"});
        await page.eval(()=>document.querySelector("[data-preview-change]").click());
        for(let i=0;i<25;i++){if(Math.abs(await page.eval(()=>+document.querySelector("[data-resume-preview]").dataset.unit)-5)<.02)break;await sleep(150);}
        if(Math.abs(await page.eval(()=>+document.querySelector("[data-resume-preview]").dataset.unit)-5)>.02)report.failures.push({reason:"Change template returns to the actual gallery"});
        for(const slug of ["kinship","gridline","harbor","orbit","apex","editorial-cut","oblique"]){await go(5);await page.eval(id=>document.querySelector('[data-gallery-choice="'+id+'"]').click(),slug);await sleep(500);await go(7);if(await page.eval(()=>document.querySelector("[data-resume-preview]").dataset.selectedTemplate)!==slug)report.failures.push({reason:"selected template lost",slug});}
        await go(4);await page.eval(()=>document.querySelectorAll('[data-panel="suggestion"] [class*="__reviewActions"] button')[1].click());await sleep(200);await go(7);await page.eval(()=>document.querySelector("[data-preview-enlarge]").click());await sleep(150);
        if(!await page.eval(()=>decodeURIComponent(document.querySelector("[data-preview-a4] img").src).includes("reusable React components")))report.failures.push({reason:"accepted wording missing from final A4 preview"});await page.eval(()=>document.querySelector("[data-resume-dialog]").close());
      }
      report.behavior.push({downloadA4:!!box,shareDeepLink:true,nativeEnlarge:true,realScroll:!park});
    }
    report.console.push(...page.consoleErrors.map(error=>({tag,error})));await page.close();
    console.log(tag+": "+view.renderer+", "+["lowContrast","small","overflow","overlaps"].reduce((n,key)=>n+view[key].length,0)+" issues");
  }
} catch(error) { report.failures.push({error:String(error),stack:error.stack}); }
finally {
  writeFileSync(join(out,"report.json"),JSON.stringify(report,null,2));
  // Only the disposable profile launched by this helper may be removed.
  if(browser.profileDir){const profile=resolve(browser.profileDir),temp=resolve(tmpdir())+sep;if(!profile.startsWith(temp)||!basename(profile).startsWith("ad-chrome-"))throw Error("Unexpected browser profile: "+profile);}
  await browser.close();
}
console.log(JSON.stringify({views:report.views.length,failures:report.failures.length,console:report.console.length,out}));
if(report.failures.length||report.console.length)process.exitCode=1;
