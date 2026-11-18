import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,basename,sep} from 'node:path';import {tmpdir} from 'node:os';import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
const args=process.argv.slice(2),option=(key,fallback)=>args.includes('--'+key)?args[args.indexOf('--'+key)+1]:fallback;
const helper=option('helper',process.env.PROFILEAI_BROWSER_HELPER);if(!helper)throw Error('Pass --helper <cdp.mjs>');
const {Browser,sleep}=await import(pathToFileURL(resolve(helper)).href);
const out=resolve(option('out','../output/live-puppet-repair-2026-11-18'));
await mkdir(out,{recursive:true});const browser=await Browser.launch();
const report={assertions:0,failures:[],cases:[],requests:[],console:[]};
const check=(value,message,details)=>{report.assertions++;if(!value)report.failures.push({message,details});};
const state=page=>page.eval(()=>{const p=document.querySelector('[data-auth-puppet]');return{...p.dataset,yaw:Number(p.dataset.headYaw),pitch:Number(p.dataset.headPitch),cover:Number(p.dataset.handCover),frames:Number(p.dataset.rigFrames),blinkCount:Number(p.dataset.blinks),canvas:Boolean(p.querySelector('canvas[data-puppet-canvas]')),visibleImages:[...p.querySelectorAll('img')].filter(i=>i.getBoundingClientRect().width&&getComputedStyle(i).display!=='none').length};});
async function ready(page){for(let n=0;n<150&&await page.eval(()=>document.querySelector('[data-auth-puppet]')?.dataset.renderState)==='loading';n++)await sleep(100);}
let recording;
async function startRecording(page){
 const initial=await page.eval(()=>{
  const canvas=document.querySelector('canvas[data-puppet-canvas]'),stream=canvas.captureStream(30);
  const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';
  const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4000000}),chunks=[];
  recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
  window.__puppetMovie={recorder,chunks,stream,start:performance.now(),frames:Number(document.querySelector('[data-auth-puppet]').dataset.rigFrames)};
  recorder.start(250);return{width:canvas.width,height:canvas.height,mime};
 });
 return async()=>{
  const result=await page.eval(()=>new Promise(resolve=>{
   const movie=window.__puppetMovie,seconds=(performance.now()-movie.start)/1000,frames=Number(document.querySelector('[data-auth-puppet]').dataset.rigFrames)-movie.frames;
   movie.recorder.onstop=()=>{const reader=new FileReader();reader.onload=()=>{movie.stream.getTracks().forEach(track=>track.stop());resolve({data:reader.result.split(',')[1],seconds,frames});};reader.readAsDataURL(new Blob(movie.chunks,{type:movie.recorder.mimeType}));};
   movie.recorder.stop();
  }));
  const raw=join(out,'live-puppet.webm');await writeFile(raw,Buffer.from(result.data,'base64'));
  const video=join(out,'live-puppet.mp4'),command=['-hide_banner','-loglevel','error','-i',raw,'-vf','scale=640:-2,fps=30','-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart','-y',video];
  await new Promise((resolveRun,reject)=>{const child=spawn(option('ffmpeg','ffmpeg'),command,{windowsHide:true,stdio:['ignore','ignore','pipe']});let stderr='';child.stderr.on('data',data=>stderr+=data);child.on('error',reject);child.on('close',code=>code?reject(Error(stderr)):resolveRun());});
  return{video,...initial,seconds:result.seconds,renderedFrames:result.frames,renderFPS:result.frames/result.seconds,method:'Actual WebGL canvas.captureStream at normal speed; no pose-image swaps or simulated frames'};
 };
}
try{
 const cases=[];for(const route of ['register','login','reset-password?email=preview%40example.com'])for(const theme of ['light','dark'])cases.push({route,theme,width:1440});
 for(const theme of ['light','dark'])cases.push({route:'login',theme,width:390});
 for(const {route,theme,width} of cases){
  const page=await browser.newPage({width,height:width===390?844:1080,mobile:width===390});
  await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('theme','${theme}')`});await page.send('Network.enable');
  browser.on(page.sessionId,'Network.requestWillBeSent',e=>{if(!['GET','OPTIONS'].includes(e.request.method))report.requests.push({method:e.request.method,url:e.request.url});});
  browser.on(page.sessionId,'Runtime.consoleAPICalled',e=>{if(e.type==='error')report.console.push(e.args.map(a=>a.value||a.description).join(' '));});
  await page.goto('http://localhost:3000/'+route,{settleMs:900});await page.send('Page.bringToFront');await ready(page);
  const tag=`${route.split('?')[0]}-${theme}-${width}`,states=[];let stopRecording;
  const initial=await state(page);check(initial.renderState==='ready'&&initial.rig==='articulated-3d'&&initial.canvas,tag+' live mesh missing',initial);
  if(route==='register'&&theme==='light'&&width===1440){for(let n=0;n<100&&await page.eval(()=>document.querySelector('[data-auth-puppet]').dataset.backgroundState)!=='ready';n++)await sleep(100);stopRecording=await startRecording(page);}
  await page.eval(()=>{window.__puppetSourceChanges=0;new MutationObserver(events=>{window.__puppetSourceChanges+=events.filter(e=>e.type==='attributes'&&e.attributeName==='src').length;}).observe(document.querySelector('[data-auth-puppet]'),{subtree:true,attributes:true,attributeFilter:['src']});});
  for(const [name,x,y] of [['left',10,150],['right',width-10,500],['up',width*.38,20],['down',width*.38,width===390?810:1030]]){
   await page.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});await sleep(750);const current=await state(page);states.push({name,...current});
  }
  check(states[0].yaw<-.04&&states[1].yaw>.04,tag+' neck must turn both ways',states.slice(0,2));
  check(states[2].pitch<states[3].pitch-.04,tag+' neck must tilt up and down',states.slice(2));
  const before=await state(page);await sleep(350);const after=await state(page);check(after.frames>before.frames+2,tag+' rig froze after cursor stopped',{before,after});
  check(after.blinkCount>0,tag+' no natural blink',after);
  const trace=await page.eval(()=>new Promise(resolve=>{
   const p=document.querySelector('[data-auth-puppet]'),values=[],start=performance.now();
   document.querySelector('input[autocomplete*=password]').focus();window.scrollTo(0,0);
   function sample(){values.push(Number(p.dataset.handCover));if(performance.now()-start<750)requestAnimationFrame(sample);else resolve(values);}requestAnimationFrame(sample);
  }));
  const covered=await state(page);states.push({name:'cover-transition',trace},{name:'covered',...covered});
  check(trace.some(value=>value>0&&value<.99),tag+' hands should travel continuously',trace);
  check(covered.pose==='cover'&&covered.cover>.98,tag+' mittens must cover active masked field',covered);
  if(width===1440&&!stopRecording)await page.screenshot({path:join(out,tag+'-covered.jpg'),quality:90,fullPage:true});
  await page.eval(()=>{document.querySelector('input[autocomplete*=password]').parentElement.querySelector('button').click();window.scrollTo(0,0);});await sleep(850);
  const revealed=await state(page);states.push({name:'revealed',...revealed});
  check(revealed.pose==='peek'&&revealed.cover<.02&&(width<700?revealed.pitch>.1:revealed.yaw>.05),tag+' revealed field must lower hands and draw gaze',revealed);
  check(await page.eval(()=>window.__puppetSourceChanges)===0,tag+' character swaps pose images');
  if(stopRecording){recording=await stopRecording();stopRecording=undefined;}
  check(page.consoleErrors.length===0,tag+' runtime exception',[...page.consoleErrors]);
  await page.screenshot({path:join(out,tag+'-revealed.jpg'),quality:90,fullPage:true});
  report.cases.push({tag,states});console.log(JSON.stringify({tag,checks:report.assertions,failures:report.failures.length}));await page.close();
 }
 const reduced=await browser.newPage({width:1440,height:1080,reducedMotion:true});await reduced.goto('http://localhost:3000/login',{settleMs:900});await ready(reduced);
 await reduced.eval(()=>document.getElementById('password').focus());await sleep(150);const a=await state(reduced);await sleep(300);const b=await state(reduced);
 check(a.cover===1&&b.cover===1,'Reduced motion must keep immediate cover cue',{a,b});check(b.frames===a.frames,'Reduced motion must not keep an idle render loop',{a,b});await reduced.close();
 check(report.requests.length===0,'Animation made a state-changing request',report.requests);check(report.console.length===0,'Browser console errors',report.console);
}finally{
 await writeFile(join(out,'motion-report.json'),JSON.stringify({...report,recording},null,2));
 const profile=resolve(browser.dir);if(!profile.startsWith(resolve(tmpdir())+sep)||!basename(profile).startsWith('ad-chrome-'))throw Error('Unexpected profile');await browser.close();
}
console.log(JSON.stringify({assertions:report.assertions,failures:report.failures.length,recording,out}));if(report.failures.length)process.exitCode=1;
