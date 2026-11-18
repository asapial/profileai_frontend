/** All post-cinema sections: responsive contrast, bounds and native controls. */
import { mkdirSync,writeFileSync } from "node:fs";
import { resolve,join,basename,sep } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
const args=process.argv.slice(2),opt=(key,fallback)=>{const i=args.indexOf("--"+key);return i<0?fallback:args[i+1];};
const helper=opt("helper",process.env.PROFILEAI_BROWSER_HELPER);if(!helper)throw Error("Pass --helper <cdp.mjs>");
const {Browser,sleep}=await import(pathToFileURL(resolve(helper)).href);
const out=resolve(opt("out","../tmp/reading-review"));mkdirSync(out,{recursive:true});
const sizes=args.includes("--all")?[[1440,900],[1796,782],[1024,800],[768,1024],[390,844],[320,740],[844,390]]:[[1440,900],[390,844]];
const ids=["workspace","showcase","story","templates","pricing","faq","closing","footer"];
const report={views:[],behavior:[],reduced:[],failures:[],console:[]};
const browser=await Browser.launch({extraArgs:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const paint=async page=>{await sleep(100);await page.screenshot({quality:12});await sleep(40);};
const go=async(page,id)=>{await page.eval(async id=>{document.activeElement?.blur();const root=document.querySelector('[data-reading-section="'+id+'"]');window.scrollTo({top:root.getBoundingClientRect().top+scrollY-80,behavior:"instant"});const plate=root.querySelector('[data-environment] > div'),url=plate&&getComputedStyle(plate).backgroundImage.match(/url\("?([^"\)]+)"?\)/)?.[1];if(url){const image=new Image();image.src=url;await image.decode();}},id);await paint(page);};
const key=async(page,name,code)=>{await page.send("Input.dispatchKeyEvent",{type:"keyDown",key:name,code:name===" "?"Space":name,windowsVirtualKeyCode:code,...(name==="Enter"?{text:"\r"}:{})});await page.send("Input.dispatchKeyEvent",{type:"keyUp",key:name,windowsVirtualKeyCode:code});await paint(page);};
async function audit(page,id){return page.eval(id=>{
  const root=document.querySelector('[data-reading-section="'+id+'"]'),lowContrast=[],small=[],overflow=[],overlaps=[],headlines=[],ranges=[];
  const pixel=document.createElement("canvas");pixel.width=pixel.height=1;const ctx=pixel.getContext("2d",{willReadFrequently:true});
  const rgba=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return[...ctx.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);};
  const blend=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3])).concat(1);
  const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
  const visible=el=>{if(el.closest('[aria-hidden="true"],.sr-only'))return false;for(let p=el;p&&p!==root.parentElement;p=p.parentElement){const cs=getComputedStyle(p);if(cs.display==="none"||cs.visibility==="hidden"||cs.clipPath.includes("inset(50%)"))return false;}return!!el.getClientRects().length;};
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){
    const text=node.textContent.trim(),el=node.parentElement;if(!text||!el||el.closest("svg,script,style")||!visible(el))continue;
    const cs=getComputedStyle(el),size=parseFloat(cs.fontSize);if(size<.1)continue;
    let bg=[255,255,255,1];const parents=[];for(let p=el;p;p=p.parentElement)parents.unshift(p);for(const p of parents){const style=getComputedStyle(p);bg=blend(rgba(p===root?style.getPropertyValue("--environment-ground").trim()||style.backgroundColor:style.backgroundColor),bg);}
    const fg=blend(rgba(cs.color),bg),contrast=(Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05),minimum=size>=24||size>=18.66&&+cs.fontWeight>=700?3:4.5;
    if(contrast<minimum-.03)lowContrast.push({text,contrast,minimum});if(size<14)small.push({text,size});
    const range=document.createRange();range.selectNodeContents(node);
    for(const r of range.getClientRects()){
      if(r.width<1||r.height<1)continue;let clipped=r.left<-.5||r.right>innerWidth+.5;
      for(let p=el;p&&p!==root.parentElement;p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect();if(["hidden","clip"].includes(s.overflowX)&&(r.left<b.left-1||r.right>b.right+1)||["hidden","clip"].includes(s.overflowY)&&(r.top<b.top-1||r.bottom>b.bottom+1))clipped=true;}
      if(clipped)overflow.push({text,left:r.left,right:r.right,top:r.top,bottom:r.bottom});ranges.push({text,el,r});
    }
  }
  for(let i=0;i<ranges.length;i++)for(let j=i+1;j<ranges.length;j++){const a=ranges[i],b=ranges[j];if(a.el===b.el||a.el.contains(b.el)||b.el.contains(a.el))continue;if(Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left)>3&&Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top)>4)overlaps.push([a.text,b.text]);}
  // Measure glyph rows, not padded Radix header/button boxes.
  for(const h of root.querySelectorAll("h2,h3,h4")){if(!visible(h))continue;const rows=new Set(),texts=document.createTreeWalker(h,NodeFilter.SHOW_TEXT);let text;while((text=texts.nextNode())){if(!text.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(text);for(const r of range.getClientRects())if(r.width>0)rows.add(Math.round(r.top));}const lines=rows.size;if(lines>2)headlines.push({text:h.textContent,lines});}
  const images=[...root.querySelectorAll("img")].filter(el=>!el.closest('[aria-hidden="true"]')).map(img=>({src:img.getAttribute("src")?.slice(0,140),loaded:img.complete&&img.naturalWidth>0,ratio:img.getBoundingClientRect().width/img.getBoundingClientRect().height}));
  const environment=root.querySelector('[data-environment]'),scenery=environment?.getBoundingClientRect();
  return{id,width:innerWidth,height:innerHeight,theme:document.documentElement.classList.contains("dark")?"dark":"light",sectionHeight:root.offsetHeight,environment:environment?.dataset.environment,ground:getComputedStyle(root).getPropertyValue("--environment-ground").trim(),scenery:scenery&&{left:scenery.left,right:scenery.right,width:scenery.width,height:scenery.height,passive:getComputedStyle(environment).pointerEvents==="none"&&environment.getAttribute("aria-hidden")==="true"},lowContrast,small,overflow,overlaps,headlines,images,horizontalOverflow:document.documentElement.scrollWidth>innerWidth};
},id);}
async function capture(page,id,tag){
  const clip=await page.eval(id=>{const selector='[data-reading-section="'+id+'"]';const b=document.querySelector(selector).getBoundingClientRect();return{x:0,y:Math.max(0,b.top+scrollY-80),width:innerWidth,height:Math.ceil(b.height+80),scale:1};},id);
  const shot=await page.send("Page.captureScreenshot",{format:"jpeg",quality:86,captureBeyondViewport:true,clip});writeFileSync(join(out,tag+"-"+id+".jpg"),Buffer.from(shot.data,"base64"));
}
async function behavior(page,tag){
  const results=[];
  for(const [id,count,next] of [["workspace",4,"ArrowRight"],["showcase",3,"ArrowDown"]]){
    await go(page,id);await page.eval(id=>document.querySelector('[data-reading-section="'+id+'"] [role="tab"]').focus(),id);
    for(let index=0;index<count;index++){
      const state=await page.eval(id=>{const root=document.querySelector('[data-reading-section="'+id+'"]'),tab=root.querySelector('[role="tab"][aria-selected="true"]'),panel=root.querySelector('[role="tabpanel"]');return{label:tab.textContent,selected:[...root.querySelectorAll('[role="tab"]')].indexOf(tab),valid:tab.getAttribute("aria-controls")===panel.id&&panel.getAttribute("aria-labelledby")===tab.id&&document.activeElement===tab};},id);
      const view=await audit(page,id);results.push({id,index,...state});if(state.selected!==index||!state.valid||["lowContrast","small","overflow","overlaps","headlines"].some(key=>view[key].length))report.failures.push({tag,reason:"keyboard tab panel",...state,...view});
      await key(page,next,next==="ArrowRight"?39:40);
    }
    await key(page,"End",35);await key(page,"Home",36);
    if(await page.eval(id=>document.querySelector('[data-reading-section="'+id+'"] [role="tab"]').getAttribute("aria-selected")!=="true",id))report.failures.push({tag,id,reason:"Home key"});
  }
  await go(page,"faq");await page.eval(()=>document.querySelectorAll('.faq-trigger')[2].focus());await key(page,"Enter",13);
  const open=await page.eval(()=>[...document.querySelectorAll('.faq-trigger')].map(el=>el.getAttribute('aria-expanded')));
  await key(page,"Enter",13);const closed=await page.eval(()=>[...document.querySelectorAll('.faq-trigger')].every(el=>el.getAttribute('aria-expanded')==='false'));
  if(open[2]!=="true"||open.filter(v=>v==="true").length!==1||!closed)report.failures.push({tag,reason:"FAQ native keyboard collapse",open,closed});
  const links=await page.eval(()=>({pricing:[...document.querySelectorAll('.price-card > a')].map(el=>el.getAttribute('href')),templates:[...document.querySelectorAll('.template-card')].map(el=>el.getAttribute('href')),closing:document.querySelector('.bottom-cta-button').getAttribute('href'),comparison:!!document.querySelector('.allowances-section'),pricingSections:document.querySelectorAll('.pricing-section').length,prices:[...document.querySelectorAll('.price-card .price strong')].map(el=>el.textContent),backgrounds:[...document.querySelectorAll('[data-environment]')].map(el=>el.dataset.environment),grounds:[...document.querySelectorAll('[data-environment]')].map(el=>getComputedStyle(el.parentElement).getPropertyValue('--environment-ground').trim())}));
  if(links.pricing.some(h=>h!=="/register")||links.templates.length!==3||links.templates.some(h=>h!=="/templates")||links.closing!=="/register"||links.comparison||links.pricingSections!==1||links.prices.join(',')!=="$0,$12,$29"||new Set(links.backgrounds).size!==9||new Set(links.grounds).size!==9)report.failures.push({tag,reason:"existing routes, single pricing and distinct environments",links});
  report.behavior.push({tag,tabs:results,faq:true,links});
}
try{
 for(const theme of ["dark","light"]){
  const page=await browser.newPage({width:1440,height:900});await page.send("Page.addScriptToEvaluateOnNewDocument",{source:`localStorage.setItem('theme','${theme}')`});
  await page.goto("http://localhost:3000/",{settleMs:1200});await page.send("Page.bringToFront");await page.eval(()=>document.fonts.ready.then(()=>true));
  for(const [width,height] of sizes){await page.setViewport({width,height,mobile:width<600});const tag=theme+"-"+width+"x"+height;
   for(const id of ids){await go(page,id);await page.eval(id=>Promise.all([...document.querySelectorAll('[data-reading-section="'+id+'"] img')].filter(img=>img.getBoundingClientRect().width>0).map(img=>img.decode().catch(()=>{}))),id);await paint(page);
    const view={tag,...await audit(page,id)};report.views.push(view);if(view.theme!==theme||view.environment!==id||!view.scenery?.passive||Math.abs(view.scenery.left)>1||Math.abs(view.scenery.right-width)>1||view.scenery.height<view.sectionHeight-1||view.horizontalOverflow||view.images.some(img=>!img.loaded)||["lowContrast","small","overflow","overlaps","headlines"].some(key=>view[key].length))report.failures.push(view);
    if([1440,768,390].includes(width))await capture(page,id,tag);
   }
   if(width===1440||width===390)await behavior(page,tag);
   console.log(tag+": "+report.views.filter(v=>v.tag===tag).length+" sections checked; "+report.failures.filter(v=>v.tag===tag).length+" issues");
  }
  report.console.push(...page.consoleErrors.map(error=>({theme,error})));await page.close();
  const pageReduced=await browser.newPage({width:390,height:844,reducedMotion:true});await pageReduced.goto("http://localhost:3000/",{settleMs:700});await go(pageReduced,"workspace");
  const motion=await pageReduced.eval(()=>[...document.querySelectorAll('[data-reading-section], [data-reading-section] *')].map(el=>getComputedStyle(el).animationName).filter(name=>name!=="none"));
  report.reduced.push({theme,animated:motion.length});if(motion.length)report.failures.push({reason:"reduced motion",motion});await pageReduced.close();
 }
}catch(error){report.failures.push({error:String(error),stack:error.stack});}
finally{writeFileSync(join(out,"report.json"),JSON.stringify(report,null,2));const dir=resolve(browser.dir);if(!dir.startsWith(resolve(tmpdir())+sep)||!basename(dir).startsWith("ad-chrome-"))throw Error("Unexpected disposable profile "+dir);await browser.close();}
console.log(JSON.stringify({views:report.views.length,behavior:report.behavior.length,failures:report.failures.length,console:report.console.length,out}));if(report.failures.length||report.console.length)process.exitCode=1;
