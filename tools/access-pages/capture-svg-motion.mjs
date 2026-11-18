import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,basename,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';

const args=process.argv.slice(2),option=(key,fallback)=>args.includes('--'+key)?args[args.indexOf('--'+key)+1]:fallback;
const helper=option('helper',process.env.PROFILEAI_BROWSER_HELPER);if(!helper)throw Error('Pass --helper <cdp.mjs>');
const {Browser,sleep}=await import(pathToFileURL(resolve(helper)).href);
const out=resolve(option('out','../output/svg-brand-refinement-2026-11-18')),framesDir=join(out,'motion-frames');await mkdir(framesDir,{recursive:true});
const browser=await Browser.launch();const report={frames:[],narrow:[],submissions:[]};
try{
 const narrow=await browser.newPage({width:320,height:740,mobile:true});
 for(const route of ['login','register','contact']){
  await narrow.goto('http://localhost:3000/'+route,{settleMs:700});
  const state=await narrow.eval(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,header:[...document.querySelectorAll('[data-site-header] a,[data-site-header] button')].filter(e=>e.getBoundingClientRect().width>0).map(e=>({label:e.getAttribute('aria-label')||e.textContent.trim(),x:e.getBoundingClientRect().x,right:e.getBoundingClientRect().right}))}));
  report.narrow.push({route,...state});
 }
 await narrow.close();await writeFile(join(out,'narrow-header.json'),JSON.stringify(report.narrow,null,2));
 const page=await browser.newPage({width:1440,height:1100});
 await page.send('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('theme','light')"});
 await page.send('Network.enable');browser.on(page.sessionId,'Network.requestWillBeSent',event=>{if(!['GET','OPTIONS'].includes(event.request.method))report.submissions.push({method:event.request.method,url:event.request.url});});
 await page.goto('http://localhost:3000/register',{settleMs:1000});await page.send('Page.bringToFront');await page.eval(()=>document.fonts.ready.then(()=>true));
 const clip=await page.eval(()=>{const r=document.querySelector('[data-auth-art]').getBoundingClientRect();return{x:Math.floor(r.x),y:Math.floor(r.y),width:Math.ceil(r.width),height:Math.ceil(r.height),scale:1};});
 let phase=-1;const start=performance.now();
 while(performance.now()-start<8500){
  const tick=performance.now(),elapsed=tick-start,next=elapsed<800?0:elapsed<1700?1:elapsed<2500?2:elapsed<3300?3:elapsed<5200?4:elapsed<7000?5:6;
  if(next!==phase){
   phase=next;
   if(phase<4){const points=[[20,160],[1420,550],[360,90],[1000,1000]];await page.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:points[phase][0],y:points[phase][1]});}
   else if(phase===4)await page.eval(()=>document.getElementById('password').focus());
   else if(phase===5)await page.eval(()=>document.getElementById('password').parentElement.querySelector('button').click());
   else{await page.eval(()=>document.getElementById('email').focus());await page.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:30,y:200});}
  }
  const capture=await page.send('Page.captureScreenshot',{format:'jpeg',quality:88,captureBeyondViewport:true,clip});
  const file='frame-'+String(report.frames.length).padStart(4,'0')+'.jpg';await writeFile(join(framesDir,file),Buffer.from(capture.data,'base64'));
  const state=await page.eval(()=>{const p=document.querySelector('[data-auth-puppet]');return{pose:p.dataset.pose,cover:p.dataset.handCover,head:p.dataset.headYaw};});
  report.frames.push({file,elapsedMs:performance.now()-start,...state});await sleep(Math.max(0,80-(performance.now()-tick)));
 }
 await page.close();
}finally{const p=resolve(browser.dir);if(!p.startsWith(resolve(tmpdir())+sep)||!basename(p).startsWith('ad-chrome-'))throw Error('Unexpected profile');await browser.close();}
const concat=report.frames.map((frame,index)=>`file '${frame.file}'\nduration ${Math.max(.02,((report.frames[index+1]?.elapsedMs??frame.elapsedMs+80)-frame.elapsedMs)/1000).toFixed(4)}`).join('\n')+`\nfile '${report.frames.at(-1).file}'\n`;
await writeFile(join(framesDir,'frames.txt'),concat);await writeFile(join(out,'motion-report.json'),JSON.stringify(report,null,2));
const run=args=>new Promise((done,fail)=>{const child=spawn('ffmpeg',args,{stdio:['ignore','ignore','pipe'],windowsHide:true});let errors='';child.stderr.on('data',d=>errors+=d);child.on('error',fail);child.on('exit',code=>code===0?done():fail(Error(errors.slice(-2200))));});
await run(['-y','-f','concat','-safe','0','-i',join(framesDir,'frames.txt'),'-vf','scale=600:-2:flags=lanczos,fps=20','-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',join(out,'puppet-motion.mp4')]);
await run(['-y','-i',join(out,'puppet-motion.mp4'),'-filter_complex','fps=12,scale=360:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3','-loop','0',join(out,'puppet-motion.gif')]);
console.log(JSON.stringify({out,frames:report.frames.length,narrow:report.narrow.map(v=>({route:v.route,overflow:v.scroll>v.width,offscreen:v.header.filter(c=>c.x<0||c.right>v.width).map(c=>c.label)})),submissions:report.submissions.length}));
