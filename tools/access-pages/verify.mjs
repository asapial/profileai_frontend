import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,basename,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
const args=process.argv.slice(2),option=(name,fallback)=>args.includes('--'+name)?args[args.indexOf('--'+name)+1]:fallback;
const helper=option('helper',process.env.PROFILEAI_BROWSER_HELPER);if(!helper)throw Error('Pass --helper <cdp.mjs>');
const {Browser,sleep}=await import(pathToFileURL(resolve(helper)).href);
const output=resolve(option('out','../output/access-page-implementation-2026-11-18'));await mkdir(output,{recursive:true});
const allRoutes=['contact','login','register','forgot-password','verify-email?email=preview%40example.com','reset-password?email=preview%40example.com','help/cancel-or-refund'];
const selection=option('routes','').split(',').filter(Boolean),routes=selection.length?allRoutes.filter(route=>selection.includes(route.split('?')[0])):allRoutes;
const widths=option('widths','1440,768,390').split(',').map(Number),themes=option('themes','dark,light').split(',');
const browser=await Browser.launch(),report={assertions:0,failures:[],views:[],requests:[],console:[]};
const check=(condition,message,details)=>{report.assertions++;if(!condition)report.failures.push({message,details});};
function contrastProbe(){
 const root=document.querySelector('[data-auth-page],[data-public-page]');
 const parse=color=>{const c=document.createElement('canvas');c.width=c.height=1;const context=c.getContext('2d');context.fillStyle=color;context.fillRect(0,0,1,1);const p=context.getImageData(0,0,1,1).data;return[p[0],p[1],p[2],p[3]/255];};
 const luminance=rgb=>rgb.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const ratio=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
 const background=node=>{let result=[0,0,0,0];for(let p=node;p;p=p.parentElement){const c=parse(getComputedStyle(p).backgroundColor);const a=result[3]+c[3]*(1-result[3]);if(a)result=[...result.slice(0,3).map((v,i)=>(v*result[3]+c[i]*c[3]*(1-result[3]))/a),a];if(a>.999)break;}return result;};
 const rows=[];
 for(const node of root.querySelectorAll('h1,h2,p,label,a,button,input:not([type=checkbox]):not([type=file]),select,textarea')){
  const rect=node.getBoundingClientRect(),style=getComputedStyle(node);
  if(!rect.width||!rect.height||node.closest('[aria-hidden=true],details:not([open])>div')||style.visibility==='hidden'||rect.right<0||rect.left>innerWidth)continue;
  if(node.matches('p')&&node.querySelector('input,button'))continue;
  const color=parse(style.color),bg=background(node);if(bg[3]<.99)continue;
  const foreground=color.slice(0,3).map((v,i)=>v*color[3]+bg[i]*(1-color[3]));
  const font=parseFloat(style.fontSize),required=font>=24||font>=18.66&&parseInt(style.fontWeight)>=700?3:4.5;
  rows.push({tag:node.tagName,text:(node.matches('input,textarea')?node.getAttribute('aria-label')||node.id||node.name:node.textContent.trim()).slice(0,100),ratio:ratio(foreground,bg),required,font});
  if(node.matches('input,textarea')&&node.placeholder){const s=getComputedStyle(node,'::placeholder'),p=parse(s.color),a=p[3]*parseFloat(s.opacity);rows.push({tag:'placeholder',text:node.placeholder,ratio:ratio(p.slice(0,3).map((v,i)=>v*a+bg[i]*(1-a)),bg),required:4.5,font});}
 }
 return rows;
}
async function openPage(width,theme,reducedMotion=false){const page=await browser.newPage({width,height:width===390?844:width===768?1024:1080,mobile:width===390,reducedMotion});await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('theme','${theme}')`});await page.send('Network.enable');browser.on(page.sessionId,'Network.requestWillBeSent',e=>{if(e.request.method!=='GET'&&e.request.method!=='OPTIONS')report.requests.push({method:e.request.method,url:e.request.url});});browser.on(page.sessionId,'Runtime.consoleAPICalled',e=>{if(e.type==='error')report.console.push(e.args.map(a=>a.value||a.description).join(' '));});return page;}
try{
 for(const width of widths)for(const theme of themes){
  const page=await openPage(width,theme);
  for(const route of routes){
   await page.goto(`http://localhost:3000/${route}`,{timeoutMs:60000,settleMs:900});await page.send('Page.bringToFront');await page.eval(()=>document.fonts.ready.then(()=>true));
   for(let attempt=0;attempt<50&&await page.eval(()=>document.querySelector('[data-auth-puppet]')?.dataset.renderState==='loading');attempt++)await sleep(100);
   const name=route.split('?')[0].replaceAll('/','-'),tag=`${name}-${theme}-${width}`;
   const initial=await page.eval(()=>({url:location.href,heading:document.querySelector('h1')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth,landmarks:document.querySelectorAll('main#main').length,puppet:document.querySelector('[data-auth-puppet]')?.dataset.renderState,otp:document.querySelectorAll('input[inputmode=numeric]').length,fields:[...document.querySelectorAll('main input')].filter(e=>e.type!=='hidden'&&getComputedStyle(e).display!=='none').map(e=>({type:e.type,id:e.id,name:e.name})),room:[...document.querySelectorAll('[data-public-environment],figure[data-auth-art]>div')].map(e=>getComputedStyle(e).backgroundImage).filter(e=>e!=='none')}));
   check(initial.landmarks===1,tag+' needs one main');check(!initial.overflow,tag+' horizontal overflow');check(Boolean(initial.heading),tag+' missing heading');check(initial.room.length>0,tag+' missing physical room');
   const animated=['login','register','reset-password'].includes(name);
   if(animated)check(initial.puppet==='ready',tag+' Puppet artwork did not load',initial);
   else check(!initial.puppet,tag+' unexpected puppet artwork');
   if(name==='verify-email'||name==='reset-password')check(initial.otp===6,tag+' needs six OTP inputs');
   const colors=await page.eval(contrastProbe),low=colors.filter(r=>!Number.isFinite(r.ratio)||r.ratio<r.required-.05);
   check(low.length===0,tag+' text contrast',low);
   await page.screenshot({path:`${output}/${tag}.jpg`,quality:87,fullPage:true});
   if(animated){
    await page.eval(()=>document.querySelector('input[autocomplete*=password]').focus());await sleep(340);
    check(await page.eval(()=>document.querySelector('[data-auth-puppet]').dataset.pose)==='cover',tag+' masked field should cover eyes');
    if(width===1440)await page.screenshot({path:`${output}/${tag}-covered.jpg`,quality:87,fullPage:true});
    await page.eval(()=>document.querySelector('input[autocomplete*=password]').parentElement.querySelector('button').click());await sleep(340);
    check(await page.eval(()=>document.querySelector('[data-auth-puppet]').dataset.pose)==='peek',tag+' revealed field should draw gaze');
    check(await page.eval(()=>document.querySelector('input[autocomplete*=password]').type)==='text',tag+' eye button must reveal original field');
    if(width===1440)await page.screenshot({path:`${output}/${tag}-revealed.jpg`,quality:87,fullPage:true});
    if(name==='register'){
     await page.eval(()=>document.getElementById('confirmPassword').focus());await sleep(120);check(await page.eval(()=>document.querySelector('[data-auth-puppet]').dataset.pose)==='cover',tag+' active confirmation should override visible first password');
     await page.eval(()=>document.getElementById('confirmPassword').parentElement.querySelector('button').focus());check(await page.eval(()=>document.querySelector('[data-auth-puppet]').dataset.pose)==='cover',tag+' eye focus should preserve masked pose');
     await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13,text:'\r'});await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});await sleep(100);check(await page.eval(()=>document.querySelector('[data-auth-puppet]').dataset.pose)==='peek',tag+' keyboard eye toggle');
     await page.eval(()=>document.querySelector('details').open=true);check(await page.eval(()=>Boolean(document.getElementById('referredByCode'))),tag+' optional referral workflow missing');await page.eval(()=>document.querySelector('details').open=false);
    }
    await page.eval(()=>document.querySelector('input[type=email],input[id=firstName],input[inputmode=numeric]').focus());await sleep(80);check(await page.eval(()=>document.querySelector('[data-auth-puppet]').dataset.pose)==='idle',tag+' non-password focus should restore cursor mode');
   }
   if(name==='contact'){
    check(await page.eval(()=>document.querySelector('textarea').maxLength)===5000,tag+' message limit');check(await page.eval(()=>document.querySelectorAll('select option').length)===6,tag+' topics missing');
   }
   if(name==='help-cancel-or-refund'){
    check(await page.eval(()=>document.querySelectorAll('nav[aria-label="On this page"] a').length)===3,tag+' article contents');
    check(await page.eval(()=>document.querySelector('main').textContent.includes('within 14 days')&&document.querySelector('main').textContent.includes('within 5 business days')),tag+' published refund copy changed');
    check(await page.eval(()=>document.querySelector('a[href="/dashboard/billing"]')!==null),tag+' billing navigation missing');
   }else{
    const disabled=await page.eval(()=>document.querySelector('form button[type=submit]')?.disabled);
    if(name==='verify-email')check(disabled===true,tag+' incomplete verification should stay disabled');
    else{await page.eval(()=>document.querySelector('form button[type=submit]').click());await sleep(120);const errors=await page.eval(()=>document.querySelectorAll('[aria-invalid=true],.ax-error,[role=alert]').length);check(errors>0,tag+' empty form validation missing');}
   }
   check(page.consoleErrors.length===0,tag+' runtime exception',[...page.consoleErrors]);page.consoleErrors.length=0;
   report.views.push({tag,...initial,contrast:colors,low});console.log(JSON.stringify({tag,failures:report.failures.length,puppet:initial.puppet}));
  }await page.close();
 }
 const reduced=await openPage(1440,'dark',true);await reduced.goto('http://localhost:3000/login',{settleMs:900});await reduced.eval(()=>document.getElementById('password').focus());await sleep(60);check(await reduced.eval(()=>document.querySelector('[data-auth-puppet]').dataset.pose)==='cover','Reduced-motion cover state');check(await reduced.eval(()=>getComputedStyle(document.querySelector('.ax-form')).animationName)==='none','Reduced-motion form entrance');await reduced.screenshot({path:`${output}/reduced-motion.jpg`,quality:87});await reduced.close();
 const fallback=await openPage(390,'light');await fallback.send('Page.addScriptToEvaluateOnNewDocument',{source:"const originalContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'||type==='webgl'?null:originalContext.call(this,type,...args)}"});await fallback.goto('http://localhost:3000/login',{settleMs:800});check(await fallback.eval(()=>document.querySelector('[data-auth-puppet]').dataset.renderState)==='fallback','Missing WebGL must use the explicit fallback');await fallback.eval(()=>document.getElementById('password').focus());await sleep(100);check(await fallback.eval(()=>document.querySelector('[data-auth-puppet]').dataset.pose)==='cover','Fallback hand-cover behavior');await fallback.screenshot({path:`${output}/no-webgl-fallback.jpg`,quality:87,fullPage:true});await fallback.close();
 check(report.requests.length===0,'Validation or animation made a state-changing request',report.requests);check(report.console.length===0,'Browser console errors',report.console);
}finally{
 await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));const profile=resolve(browser.dir);if(!profile.startsWith(resolve(tmpdir())+sep)||!basename(profile).startsWith('ad-chrome-'))throw Error('Unexpected browser profile');await browser.close();
}
console.log(JSON.stringify({assertions:report.assertions,failures:report.failures.length,views:report.views.length,output}));if(report.failures.length)process.exitCode=1;
