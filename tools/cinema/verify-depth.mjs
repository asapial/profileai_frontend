/** Actual scene backgrounds, not merely a computed section color. Includes reverse handoffs. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join, basename, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const args=process.argv.slice(2),opt=(key,fallback)=>{const i=args.indexOf('--'+key);return i<0?fallback:args[i+1];};
const helper=opt('helper',process.env.PROFILEAI_BROWSER_HELPER);if(!helper)throw Error('Pass --helper <cdp.mjs>');
const {Browser,sleep}=await import(pathToFileURL(resolve(helper)).href);
const out=resolve(opt('out','../tmp/depth-scenes'));mkdirSync(out,{recursive:true});
const steps=JSON.parse(readFileSync('src/lib/career-cinema.ts','utf8').match(/SCENE_DISTANCES = (\[[^\]]+\])/)[1]);
const progress=unit=>{const i=Math.min(steps.length-1,Math.floor(unit));return(steps.slice(0,i).reduce((n,v)=>n+v,0)+(unit-i)*steps[i])/steps.reduce((n,v)=>n+v,0);};
const report={views:[],transitions:[],failures:[],console:[]};
const browser=await Browser.launch({extraArgs:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
async function settle(page,unit){
 await page.eval(value=>{const film=document.querySelector('[class*="__film"]');window.scrollTo({top:film.getBoundingClientRect().top+scrollY+value*(film.offsetHeight-innerHeight),behavior:'instant'});},progress(unit));
 for(let i=0;i<90;i++){const actual=await page.eval(()=>+document.querySelector('[data-cinema-environment]').dataset.unit);if(Math.abs(actual-unit)<.002)break;if(i%5===4)await page.screenshot({quality:12});await sleep(90);if(i===89)throw Error('Unsettled background '+actual+' / '+unit);}
 await sleep(120);await page.screenshot({quality:12});
}
async function audit(page){return page.eval(async()=>{
 const host=document.querySelector('[data-cinema-environment]'),gallery=document.querySelector('[data-template-gallery]'),canvas=document.querySelector('[data-gallery-canvas]');
 const rooms=await Promise.all([...host.children].map(async el=>{const css=getComputedStyle(el),url=css.backgroundImage.match(/url\("?([^"\)]+)"?\)/)?.[1];let loaded=false;if(+css.opacity>.01&&url){const img=new Image();img.src=url;try{await img.decode();loaded=img.naturalWidth>0;}catch{}}return{opacity:+css.opacity,url,loaded};}));
 return{unit:+host.dataset.unit,rooms,renderer:gallery.dataset.renderer,studio:canvas.dataset.room,reflection:canvas.dataset.reflections,galleryOpacity:+gallery.style.opacity,overflow:document.documentElement.scrollWidth>innerWidth};
});}
try{
 for(const dark of [true,false]){
  const page=await browser.newPage({width:1440,height:900});await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('theme','${dark?'dark':'light'}')`});
  await page.goto('http://localhost:3000/',{settleMs:900});await page.send('Page.bringToFront');await page.eval(()=>document.fonts.ready.then(()=>true));
  for(const [width,height] of [[1440,900],[390,844]]){
   await page.setViewport({width,height,mobile:width<600});const tag=`${dark?'dark':'light'}-${width}x${height}`;
   for(let unit=0;unit<8;unit++){
    await settle(page,unit);if(unit>=5)for(let i=0;i<45;i++){if(await page.eval(()=>document.querySelector('[data-gallery-canvas]')?.dataset.room==='physical-studio'&&document.querySelector('[data-template-gallery]')?.dataset.renderer==='webgl'))break;await sleep(150);}
    const view={tag,...await audit(page)};report.views.push(view);
    if(view.overflow||unit<5&&!view.rooms.some(r=>r.opacity>.98&&r.loaded&&r.url.includes(dark?'-dark':'-light'))||unit>=5&&(view.renderer!=='webgl'||view.studio!=='physical-studio'||view.reflection!=='live'))report.failures.push(view);
    await page.screenshot({path:join(out,`${tag}-scene-${unit+1}.jpg`),quality:88});
   }
   for(const unit of [4.4,4.7,5,4.7,4.4,3.5,3,2.5,2]){await settle(page,unit);const sample={tag,...await audit(page)};report.transitions.push(sample);if(sample.overflow||unit<4.4&&!sample.rooms.some(r=>r.opacity>.98&&r.loaded))report.failures.push(sample);}
   console.log(tag+': 8 backgrounds and reverse handoffs checked');
  }
  report.console.push(...page.consoleErrors);await page.close();
 }
}catch(error){report.failures.push({error:String(error),stack:error.stack});}
finally{writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));const dir=resolve(browser.dir);if(!dir.startsWith(resolve(tmpdir())+sep)||!basename(dir).startsWith('ad-chrome-'))throw Error('Unexpected disposable profile');await browser.close();}
console.log(JSON.stringify({views:report.views.length,transitions:report.transitions.length,failures:report.failures.length,console:report.console.length,out}));if(report.failures.length||report.console.length)process.exitCode=1;
