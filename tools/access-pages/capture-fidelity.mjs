import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,basename,sep} from 'node:path';import {tmpdir} from 'node:os';import {pathToFileURL} from 'node:url';
const args=process.argv.slice(2),option=(key,fallback)=>args.includes('--'+key)?args[args.indexOf('--'+key)+1]:fallback;
const helper=option('helper',process.env.PROFILEAI_BROWSER_HELPER);if(!helper)throw Error('Pass --helper <cdp.mjs>');
const {Browser,sleep}=await import(pathToFileURL(resolve(helper)).href);
const out=resolve(option('out','../output/access-fidelity-repair-2026-11-18/stable'));
await mkdir(out,{recursive:true});const browser=await Browser.launch(),captures=[];
const routes=['login','register','forgot-password','verify-email?email=preview%40example.com','reset-password?email=preview%40example.com','contact','help/cancel-or-refund'];
try{
 for(const width of [1440,768,390])for(const theme of ['dark','light']){
  const height=width===1440?1080:width===768?1024:844;
  const page=await browser.newPage({width,height,mobile:width===390});
  await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('theme','${theme}')`});
  for(const route of routes){
   const tag=`${route.split('?')[0].replaceAll('/','-')}-${theme}-${width}x${height}`;
   await page.goto('http://localhost:3000/'+route,{settleMs:900});await page.send('Page.bringToFront');
   await page.eval(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));await Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});
   for(let n=0;n<50&&await page.eval(()=>document.querySelector('[data-auth-puppet]')?.dataset.renderState==='loading');n++)await sleep(100);
   const state=await page.eval(()=>({puppet:document.querySelector('[data-auth-puppet]')?.dataset.renderState,opacity:[...document.querySelectorAll('[data-public-reveal][data-public-entered]')].map(e=>getComputedStyle(e).opacity),overflow:document.documentElement.scrollWidth>innerWidth}));
   if(state.overflow||state.opacity.some(value=>Number(value)<.999)||state.puppet&&state.puppet!=='ready')throw Error('Unsettled or incomplete render: '+tag);
   await page.screenshot({path:`${out}/${tag}.jpg`,quality:90,fullPage:true});captures.push({tag,...state});
  }
  console.log(JSON.stringify({width,theme,captures:captures.length}));await page.close();
 }
}finally{
 await writeFile(`${out}/capture-report.json`,JSON.stringify({captures,method:'Normal motion; wait for finite entrance animations to finish. No CSS overrides or reduced-motion screenshot substitutions.'},null,2));
 const directory=resolve(browser.dir);if(!directory.startsWith(resolve(tmpdir())+sep)||!basename(directory).startsWith('ad-chrome-'))throw Error('Unexpected profile');await browser.close();
}
