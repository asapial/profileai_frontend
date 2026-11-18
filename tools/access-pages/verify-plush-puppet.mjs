import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve,join,basename,sep} from 'node:path';import {tmpdir} from 'node:os';import {pathToFileURL} from 'node:url';import {gzipSync} from 'node:zlib';
import sharp from 'sharp';
const args=process.argv.slice(2),option=(key,fallback)=>args.includes('--'+key)?args[args.indexOf('--'+key)+1]:fallback;
const helper=option('helper',process.env.PROFILEAI_BROWSER_HELPER);if(!helper)throw Error('Pass --helper <cdp.mjs>');
const {Browser,sleep}=await import(pathToFileURL(resolve(helper)).href);
const out=resolve(option('out','../output/plush-puppet-2026-11-18'));await mkdir(out,{recursive:true});
const report={assertions:0,failures:[],views:[],requests:[],runtime:[]};
const check=(pass,message,details)=>{report.assertions++;if(!pass)report.failures.push({message,details});};
const state=page=>page.eval(()=>{const p=document.querySelector('[data-auth-puppet]'),canvas=p.querySelector('canvas');return{...p.dataset,cover:Number(p.dataset.handCover),frames:Number(p.dataset.frameCount),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,canvas:canvas?{width:canvas.width,height:canvas.height,opacity:getComputedStyle(canvas).opacity,error:canvas.getContext('webgl2').getError()}:null,svgVisible:getComputedStyle(p.querySelector('svg')).visibility!=='hidden'};});
async function ready(page){for(let n=0;n<120&&await page.eval(()=>document.querySelector('[data-auth-puppet]')?.dataset.renderState==='loading');n++)await sleep(100);}
async function revealStage(page){await sleep(120);await page.eval(()=>window.scrollTo(0,0));await sleep(900);}
async function stage(page,file){const clip=await page.eval(()=>{const r=document.querySelector('[data-auth-art]').getBoundingClientRect();return{x:r.x,y:r.y+scrollY,width:r.width,height:r.height,scale:1};});const result=await page.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});const buffer=Buffer.from(result.data,'base64');if(file)await writeFile(join(out,file),buffer);return buffer;}
const browser=await Browser.launch();
try{
 for(const width of [1440,768,390])for(const theme of ['light','dark']){
  const page=await browser.newPage({width,height:width<700?844:1100,mobile:width<700});await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('theme','${theme}')`});
  await page.send('Network.enable');browser.on(page.sessionId,'Network.requestWillBeSent',e=>{if(!['GET','OPTIONS'].includes(e.request.method))report.requests.push({method:e.request.method,url:e.request.url});});
  browser.on(page.sessionId,'Runtime.consoleAPICalled',e=>{if(e.type==='error')report.runtime.push(e.args.map(a=>a.value||a.description).join(' '));});
  for(const route of ['login','register','reset-password?email=preview%40example.com']){
   const tag=`${route.split('?')[0]}-${theme}-${width}`;
   await page.goto('http://localhost:3000/'+route,{settleMs:900});await page.send('Page.bringToFront');await ready(page);await page.eval(()=>document.fonts.ready.then(()=>true));
   const initial=await state(page);check(initial.rig==='native-webgl2'&&initial.gpuReady==='true'&&initial.canvas?.opacity==='1'&&!initial.svgVisible,tag+' real plush renderer visible',initial);check(!initial.overflow,tag+' horizontal overflow',initial);
   check(initial.canvas?.error===0&&initial.canvas.height<=560&&Number(initial.geometryBytes)<131072&&Number(initial.drawCalls)<=4,tag+' renderer budget or GPU error',initial);
   if(route==='register'){
    await page.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:width-15,y:width<700?220:500});await sleep(600);
    const visible=await stage(page,tag+'-stage.png');
    await page.eval(()=>document.querySelector('[data-auth-puppet]').style.visibility='hidden');const room=await stage(page);await page.eval(()=>document.querySelector('[data-auth-puppet]').style.visibility='');await sleep(160);
    const a=await sharp(visible).removeAlpha().raw().toBuffer(),b=await sharp(room).removeAlpha().raw().toBuffer();let pixels=0;
    for(let i=0;i<a.length;i+=3)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>40)pixels++;
    check(pixels>3000,tag+' native character missing from composed screenshot',{changedPixels:pixels});
   }
   await page.eval(()=>document.querySelector('input[autocomplete*=password]').focus());await revealStage(page);const covered=await state(page);check(covered.pose==='cover'&&covered.cover>.97,tag+' masked password cue',covered);
   if(route==='register'&&width===1440)await stage(page,tag+'-cover.png');
   await page.eval(()=>document.querySelector('input[autocomplete*=password]').parentElement.querySelector('button').click());await revealStage(page);const peek=await state(page);check(peek.pose==='peek'&&peek.cover<.03,tag+' revealed password cue',peek);
   if(route==='register'&&width===1440)await stage(page,tag+'-peek.png');
   await page.eval(()=>{document.getElementById('email')?.focus();document.activeElement?.blur();window.scrollTo(0,0);});await sleep(600);
   await page.screenshot({path:join(out,tag+'.jpg'),quality:91,fullPage:true});
   if(width===390){await page.eval(()=>window.scrollTo(0,document.body.scrollHeight));await sleep(200);const a=await state(page);await sleep(250);const b=await state(page);check(a.frames===b.frames,tag+' offscreen loop should pause',{a:a.frames,b:b.frames});await page.eval(()=>window.scrollTo(0,0));await sleep(250);check((await state(page)).frames>b.frames,tag+' renderer should resume');}
   check(page.consoleErrors.length===0,tag+' runtime exceptions',page.consoleErrors);page.consoleErrors.length=0;report.views.push({tag,initial,covered,peek});
  }
  console.log(JSON.stringify({width,theme,views:report.views.length,failures:report.failures.length}));await page.close();
 }
 const reduced=await browser.newPage({width:1440,height:1100,reducedMotion:true});await reduced.goto('http://localhost:3000/register',{settleMs:1000});await ready(reduced);await reduced.eval(()=>document.getElementById('password').focus());await sleep(200);const a=await state(reduced);await sleep(300);const b=await state(reduced);check(a.cover===1&&b.cover===1&&a.frames===b.frames,'Reduced motion keeps immediate cues without idle animation',{a,b});await reduced.close();
 const fallback=await browser.newPage({width:390,height:844});await fallback.send('Page.addScriptToEvaluateOnNewDocument',{source:"const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args)};"});await fallback.goto('http://localhost:3000/login',{settleMs:1000});await ready(fallback);const f=await state(fallback);check(f.rig==='svg-fallback'&&f.svgVisible&&!f.canvas,'WebGL unavailable keeps a visible character',f);await fallback.close();
 const lost=await browser.newPage({width:1440,height:1100});await lost.goto('http://localhost:3000/login',{settleMs:1000});await ready(lost);await lost.eval(()=>document.querySelector('[data-auth-puppet] canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());await sleep(300);const l=await state(lost);check(l.rig==='svg-fallback'&&l.svgVisible&&!l.canvas,'GPU context loss retains visible fallback',l);await lost.close();
 const files=['src/components/auth/AuthPuppet.tsx','src/components/auth/AuthPuppet.module.css','src/components/auth/createNativePuppet.ts'],source=Buffer.concat(await Promise.all(files.map(file=>readFile(file))));report.source={files,bytes:source.length,gzipBytes:gzipSync(source).length,externalCharacterAssets:0};
 check(report.requests.length===0,'Unexpected state-changing request',report.requests);check(report.runtime.length===0,'Console errors',report.runtime);
}finally{await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));const p=resolve(browser.dir);if(!p.startsWith(resolve(tmpdir())+sep)||!basename(p).startsWith('ad-chrome-'))throw Error('Unexpected profile');await browser.close();}
console.log(JSON.stringify({out,assertions:report.assertions,failures:report.failures,views:report.views.length}));if(report.failures.length)process.exitCode=1;
