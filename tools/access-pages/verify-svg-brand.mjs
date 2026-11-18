import {mkdir,writeFile,readFile} from 'node:fs/promises';import {writeFileSync} from 'node:fs';
import {resolve,join,basename,sep} from 'node:path';import {tmpdir} from 'node:os';import {pathToFileURL} from 'node:url';import {gzipSync} from 'node:zlib';
const args=process.argv.slice(2),option=(key,fallback)=>args.includes('--'+key)?args[args.indexOf('--'+key)+1]:fallback;
const helper=option('helper',process.env.PROFILEAI_BROWSER_HELPER);if(!helper)throw Error('Pass --helper <cdp.mjs>');
const {Browser,sleep}=await import(pathToFileURL(resolve(helper)).href);
const out=resolve(option('out','../output/svg-brand-refinement-2026-11-18'));await mkdir(out,{recursive:true});
const routes=['login','register','forgot-password','verify-email?email=preview%40example.com','reset-password?email=preview%40example.com','contact','help/cancel-or-refund'];
const report={assertions:0,failures:[],views:[],motion:[],mutations:[],console:[]};const check=(pass,message,details)=>{report.assertions++;if(!pass)report.failures.push({message,details});};
const browser=await Browser.launch();
const pose=page=>page.eval(()=>{const p=document.querySelector('[data-auth-puppet]');return{pose:p.dataset.pose,rig:p.dataset.rig,x:Number(p.dataset.headYaw),y:Number(p.dataset.headPitch),cover:Number(p.dataset.handCover),blinks:Number(p.dataset.blinks),frames:Number(p.dataset.frameCount),head:p.querySelector('[data-head]').getAttribute('transform')};});
try{
 for(const width of [1440,768,390])for(const theme of ['light','dark']){
  const page=await browser.newPage({width,height:width<700?844:1080,mobile:width<700});await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('theme','${theme}')`});await page.send('Network.enable');browser.on(page.sessionId,'Network.requestWillBeSent',event=>{if(!['GET','OPTIONS'].includes(event.request.method))report.mutations.push({method:event.request.method,url:event.request.url});});
  browser.on(page.sessionId,'Runtime.consoleAPICalled',event=>{if(event.type==='error')report.console.push(event.args.map(x=>x.value||x.description).join(' '));});
  for(const route of routes){
   const tag=`${route.split('?')[0].replaceAll('/','-')}-${theme}-${width}`;
   await page.goto('http://localhost:3000/'+route,{settleMs:800});await page.send('Page.bringToFront');await page.eval(()=>document.fonts.ready.then(()=>true));
   const state=await page.eval(()=>{const root=document.querySelector('[data-auth-page],[data-public-page]'),p=root.querySelector('[data-auth-puppet]');const style=getComputedStyle(root);return{overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,headings:document.querySelectorAll('h1').length,main:document.querySelectorAll('main#main').length,footer:document.querySelectorAll('[data-site-footer]').length,header:document.querySelectorAll('[data-site-header]').length,page:style.getPropertyValue('--page').trim(),scene:style.getPropertyValue('--scene').trim(),background:style.backgroundImage,puppet:p?{rig:p.dataset.rig,canvas:p.querySelectorAll('canvas').length,images:p.querySelectorAll('img,image').length,svg:p.querySelectorAll('svg').length}:null,footerLinks:[...document.querySelectorAll('[data-site-footer] a')].map(a=>a.getAttribute('href'))};});
   check(!state.overflow,tag+' overflow',state);check(state.main===1&&state.headings===1,tag+' main/heading structure',state);check(state.footer===1&&state.header===1,tag+' reusable header/footer',state);check(state.footerLinks.includes('/privacy')&&state.footerLinks.includes('/terms')&&state.footerLinks.includes('/templates'),tag+' footer navigation incomplete',state);
   const animated=['login','register','reset-password'].includes(route.split('?')[0]);
   if(animated){
    check(state.puppet?.rig==='svg'&&state.puppet?.canvas===0&&state.puppet?.images===0&&state.puppet?.svg===1,tag+' puppet must be vector-only',state.puppet);
    if(width===1440||route==='login'){
     const samples=[];
     for(const [name,x,y] of [['left',10,120],['right',width-10,600]]){await page.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});await sleep(600);samples.push({name,...await pose(page)});}
     check(samples[0].x<0&&samples[1].x>0&&samples[0].head!==samples[1].head,tag+' independent head tracking',samples);
     await page.eval(()=>{document.querySelector('input[autocomplete*=password]').focus();window.scrollTo(0,0);});await sleep(700);const covered=await pose(page);
     check(covered.pose==='cover'&&covered.cover>.97,tag+' eyes not covered',covered);
     if(width===1440)await page.screenshot({path:join(out,tag+'-covered.jpg'),quality:87,fullPage:true});
     await page.eval(()=>document.querySelector('input[autocomplete*=password]').parentElement.querySelector('button').click());await sleep(120);await page.eval(()=>window.scrollTo(0,0));await sleep(700);const peek=await pose(page);
     check(peek.pose==='peek'&&peek.cover<.03,tag+' reveal should lower mittens',peek);
     if(route==='register'){
      await page.eval(()=>document.getElementById('confirmPassword').focus());await sleep(650);check((await pose(page)).pose==='cover',tag+' confirmation precedence');
     }
     await page.eval(()=>{document.querySelector('input[type=email],input[inputmode=numeric]').focus();window.scrollTo(0,0);});await sleep(600);const a=await pose(page);await sleep(350);const b=await pose(page);check(b.frames>a.frames,tag+' animation freezes when cursor stops',{a,b});report.motion.push({tag,samples,covered,peek});
    }
   }
   await page.screenshot({path:join(out,tag+'.jpg'),quality:88,fullPage:true});
   if(width===1440){const r=await page.eval(()=>{const r=document.querySelector('[data-site-footer]').getBoundingClientRect();return{x:r.x,y:r.y+scrollY,width:r.width,height:r.height,scale:1};});const capture=await page.send('Page.captureScreenshot',{format:'jpeg',quality:91,captureBeyondViewport:true,clip:r});writeFileSync(join(out,tag+'-footer.jpg'),Buffer.from(capture.data,'base64'));}
   check(page.consoleErrors.length===0,tag+' runtime errors',[...page.consoleErrors]);page.consoleErrors.length=0;report.views.push({tag,...state});
  }
  console.log(JSON.stringify({width,theme,views:report.views.length,failures:report.failures.length}));await page.close();
 }
 const page=await browser.newPage({width:390,height:844});
 for(const route of ['','templates','pricing','help','privacy','terms','howitworks']){await page.goto('http://localhost:3000/'+route,{settleMs:800});const value=await page.eval(()=>({overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,headers:document.querySelectorAll('[data-site-header]').length,footers:document.querySelectorAll('[data-site-footer]').length}));check(!value.overflow&&value.headers===1&&value.footers===1,'Shared chrome on /'+route,value);}
 await page.goto('http://localhost:3000/contact',{settleMs:700});await page.eval(()=>document.querySelector('button[aria-label="Open navigation"]').click());await sleep(250);check(await page.eval(()=>Boolean(document.querySelector('[role=dialog] nav[aria-label="Mobile navigation"]'))),'Mobile navigation opens');await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await sleep(250);check(await page.eval(()=>!document.querySelector('[role=dialog]')),'Mobile navigation closes with Escape');await page.close();
 const reduced=await browser.newPage({width:1440,height:1080,reducedMotion:true});await reduced.goto('http://localhost:3000/login',{settleMs:800});await reduced.eval(()=>document.getElementById('password').focus());await sleep(120);const a=await pose(reduced);await sleep(250);const b=await pose(reduced);check(a.cover===1&&b.cover===1&&a.frames===b.frames,'Reduced-motion state cues without idle loop',{a,b});await reduced.close();
 check(report.mutations.length===0,'Unexpected state-changing requests',report.mutations);check(report.console.length===0,'Console errors',report.console);
 const source=await readFile('src/components/auth/AuthPuppet.tsx'),css=await readFile('src/components/auth/AuthPuppet.module.css');report.puppetSource={bytes:source.length+css.length,gzipBytes:gzipSync(Buffer.concat([source,css])).length,externalAssets:0,renderer:'Native SVG + requestAnimationFrame, capped at 30 fps'};
}finally{await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));const p=resolve(browser.dir);if(!p.startsWith(resolve(tmpdir())+sep)||!basename(p).startsWith('ad-chrome-'))throw Error('Unexpected profile');await browser.close();}
console.log(JSON.stringify({assertions:report.assertions,failures:report.failures.length,views:report.views.length,out}));if(report.failures.length)process.exitCode=1;
