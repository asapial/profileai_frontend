import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,basename,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';

const helper=process.env.PROFILEAI_BROWSER_HELPER||process.argv[3];if(!helper)throw Error('Pass an output directory and CDP helper path, or set PROFILEAI_BROWSER_HELPER.');
const {Browser}=await import(pathToFileURL(resolve(helper)).href);

const output=resolve(process.argv[2]||'../tmp/access-implementation-2026-11-18/first-look');await mkdir(output,{recursive:true});
const routes=['contact','login','register','forgot-password','verify-email?email=preview%40example.com','reset-password?email=preview%40example.com','help/cancel-or-refund'];
const browser=await Browser.launch(),records=[];
try{
 for(const theme of ['dark','light']){
  const page=await browser.newPage({width:1440,height:1080});
  await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('theme','${theme}')`});
  for(const route of routes){
   await page.goto(`http://localhost:3000/${route}`,{timeoutMs:60000,settleMs:1600});await page.send('Page.bringToFront');await page.eval(()=>document.fonts.ready.then(()=>true));
   const name=route.split('?')[0].replaceAll('/','-');
   const state=await page.eval(()=>({title:document.title,h1:document.querySelector('h1')?.textContent,url:location.href,overflow:document.documentElement.scrollWidth>innerWidth,height:document.documentElement.scrollHeight,puppet:document.querySelector('[data-auth-puppet]')?.getAttribute('data-canvas-state')}));
   await page.screenshot({path:`${output}/${name}-${theme}.jpg`,quality:88,fullPage:true});
   records.push({route,theme,...state,errors:[...page.consoleErrors]});page.consoleErrors.length=0;
   console.log(JSON.stringify({route,theme,...state}));
  }await page.close();
 }
}finally{
 await writeFile(`${output}/inventory.json`,JSON.stringify(records,null,2));
 const directory=resolve(browser.dir);if(!directory.startsWith(resolve(tmpdir())+sep)||!basename(directory).startsWith('ad-chrome-'))throw Error('Unexpected browser profile');await browser.close();
}
