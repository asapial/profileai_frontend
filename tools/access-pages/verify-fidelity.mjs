import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve,basename,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
const args=process.argv.slice(2),option=(key,fallback)=>args.includes('--'+key)?args[args.indexOf('--'+key)+1]:fallback;
const helper=option('helper',process.env.PROFILEAI_BROWSER_HELPER);if(!helper)throw Error('Pass --helper <cdp.mjs>');
const {Browser,sleep}=await import(pathToFileURL(resolve(helper)).href);
const output=resolve(option('out','../output/access-fidelity-repair-2026-11-18'));
await mkdir(output,{recursive:true});
const routes=['login','register','forgot-password','verify-email?email=preview%40example.com','reset-password?email=preview%40example.com','contact','help/cancel-or-refund'];
const allSizes=[[320,740],[390,844],[600,960],[768,1024],[844,390],[1024,768],[1440,1080],[1920,1080]];
const selected=option('widths','').split(',').filter(Boolean).map(Number);
const sizes=selected.length?allSizes.filter(([width])=>selected.includes(width)):allSizes;
const report={assertions:0,failures:[],views:[],requests:[],console:[],assetSources:[]};
const check=(pass,message,details)=>{report.assertions++;if(!pass)report.failures.push({message,details});};
// Guard the source as well as the layout: a correctly fitted, pre-cropped file
// still loses artwork. Portrait mobile variants must keep the original ratio.
const provenance=JSON.parse(await readFile('tools/access-pages/art-provenance.json','utf8'));
for(const asset of provenance.assets){
 const banner=['contact','billing-help'].includes(asset.key);
 const expected=banner?asset.desktop.width/asset.desktop.height*.49:asset.desktop.width/asset.desktop.height;
 const actual=asset.mobile.width/asset.mobile.height;
 check(Math.abs(actual-expected)<.005,asset.key+'-'+asset.theme+' destructive mobile crop',{expected,actual});
 report.assetSources.push({key:asset.key,theme:asset.theme,desktop:asset.desktop,mobile:asset.mobile});
}
const browser=await Browser.launch();
try{
 for(const [width,height] of sizes)for(const theme of ['light','dark']){
  const page=await browser.newPage({width,height,mobile:width<700});
  await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('theme','${theme}')`});
  await page.send('Network.enable');
  browser.on(page.sessionId,'Network.requestWillBeSent',e=>{if(!['GET','OPTIONS'].includes(e.request.method))report.requests.push({method:e.request.method,url:e.request.url});});
  browser.on(page.sessionId,'Runtime.consoleAPICalled',e=>{if(e.type==='error')report.console.push(e.args.map(a=>a.value||a.description).join(' '));});
  for(const route of routes){
   const tag=`${route.split('?')[0].replaceAll('/','-')}-${theme}-${width}x${height}`;
   await page.goto('http://localhost:3000/'+route,{settleMs:900});await page.send('Page.bringToFront');
   await page.eval(()=>document.fonts.ready.then(()=>true));
   for(let n=0;n<50&&await page.eval(()=>document.querySelector('[data-auth-puppet]')?.dataset.renderState==='loading');n++)await sleep(100);
   const measurement=await page.eval(async()=>{
    const root=document.querySelector('[data-auth-page],[data-public-page]');
    const rect=node=>{const r=node.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
    const room=root.querySelector('[data-auth-room],[data-room-fit=intrinsic]');
    const css=getComputedStyle(room),url=css.backgroundImage.match(/url\(["']?([^"')]+)/)?.[1];
    const image=new Image();image.src=url;await image.decode();
    const box=rect(room),scale=Math.min(box.width/image.width,box.height/image.height);
    const painted={x:box.x+(box.width-image.width*scale)/2,y:box.bottom-image.height*scale,right:box.x+(box.width+image.width*scale)/2,bottom:box.bottom};
    const clipped=[];
    for(let parent=room.parentElement;parent;parent=parent.parentElement){
     const s=getComputedStyle(parent),r=rect(parent);
     if((['hidden','clip'].includes(s.overflowX)&&(painted.x<r.x-.5||painted.right>r.right+.5))||(['hidden','clip'].includes(s.overflowY)&&(painted.y<r.y-.5||painted.bottom>r.bottom+.5)))clipped.push({tag:parent.tagName,class:parent.className,box:r});
    }
    const art=root.querySelector('[data-auth-art]'),puppet=root.querySelector('[data-auth-puppet]');
    const content=root.querySelector('main form'),heroCopy=root.querySelector('[data-room-fit]')?.parentElement.querySelector('h1');
    return{overflow:document.documentElement.scrollWidth>innerWidth,fit:css.backgroundSize,source:url,room:box,natural:{width:image.width,height:image.height},painted:{...painted,width:image.width*scale,height:image.height*scale},clipped,art:art?rect(art):null,puppet:puppet?{...rect(puppet),state:puppet.dataset.renderState,rig:puppet.dataset.rig,meshBounds:puppet.dataset.meshBounds,canvas:Boolean(puppet.querySelector('canvas[data-puppet-canvas]')),images:[...puppet.querySelectorAll('img')].map(i=>({src:i.currentSrc,loaded:i.complete&&i.naturalWidth>0,fit:getComputedStyle(i).objectFit}))}:null,form:content?rect(content):null,heading:heroCopy?rect(heroCopy):null};
   });
   check(!measurement.overflow,tag+' page overflow',measurement);
   check(measurement.fit==='contain',tag+' room must fit whole image',measurement);
   check(measurement.painted.width<=measurement.room.width+.5&&measurement.painted.height<=measurement.room.height+.5,tag+' clipped image bounds',measurement);
   check(measurement.clipped.length===0,tag+' ancestor clips artwork',measurement.clipped);
   check(measurement.room.x>=-.5&&measurement.room.right<=width+.5,tag+' room outside viewport',measurement);
   if(measurement.art){
    check(Math.abs(measurement.art.width/measurement.art.height-.75)<.002,tag+' room stage ratio changed',measurement);
    check(Math.abs(measurement.natural.width/measurement.natural.height-.75)<.002,tag+' portrait source was cropped',measurement);
   }
   if(measurement.puppet){
    const p=measurement.puppet,a=measurement.art;
    check(p.state==='ready'&&p.rig==='articulated-3d'&&p.canvas,tag+' missing live articulated character',p);
    const bounds=p.meshBounds?.split(',').map(Number)??[];check(bounds.length===4&&bounds.every(Number.isFinite)&&bounds[0]>=0&&bounds[1]>=0&&bounds[2]<=1&&bounds[3]<=1,tag+' actual mesh clips stage',p);
    check(p.x>=a.x&&p.right<=a.right&&p.y>=a.y&&p.bottom<=a.bottom,tag+' character escaped its shared stage',measurement);
    if(width<1024)check(measurement.form.y>=a.bottom-.5,tag+' form overlaps artwork',measurement);
   }
   if(measurement.heading&&width<1024)check(measurement.heading.bottom<=measurement.room.y,tag+' heading overlaps subject on compact screens',measurement);
   if([390,768,1440].includes(width))await page.screenshot({path:`${output}/${tag}.jpg`,quality:88,fullPage:true});
   check(page.consoleErrors.length===0,tag+' runtime errors',[...page.consoleErrors]);page.consoleErrors.length=0;
   report.views.push({tag,...measurement});
  }
  console.log(JSON.stringify({width,height,theme,views:report.views.length,failures:report.failures.length}));await page.close();
 }
 check(report.requests.length===0,'Unexpected state-changing request',report.requests);
 check(report.console.length===0,'Console errors',report.console);
}finally{
 await writeFile(`${output}/fidelity-report.json`,JSON.stringify(report,null,2));
 const profile=resolve(browser.dir);if(!profile.startsWith(resolve(tmpdir())+sep)||!basename(profile).startsWith('ad-chrome-'))throw Error('Unexpected browser profile');await browser.close();
}
console.log(JSON.stringify({assertions:report.assertions,failures:report.failures.length,views:report.views.length,output}));if(report.failures.length)process.exitCode=1;
