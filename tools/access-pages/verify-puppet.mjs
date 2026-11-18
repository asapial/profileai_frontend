import {mkdir,writeFile} from 'node:fs/promises';import {resolve,basename,sep} from 'node:path';import {tmpdir} from 'node:os';import {pathToFileURL} from 'node:url';
const args=process.argv.slice(2),option=(name,fallback)=>args.includes('--'+name)?args[args.indexOf('--'+name)+1]:fallback;
const {Browser,sleep}=await import(pathToFileURL(resolve(option('helper',process.env.PROFILEAI_BROWSER_HELPER))).href);
const output=resolve(option('out','../output/access-page-implementation-2026-11-18/puppet-boundaries'));await mkdir(output,{recursive:true});const browser=await Browser.launch();let assertions=0;const failures=[],states=[];
const check=(condition,message)=>{assertions++;if(!condition)failures.push(message);};
try{
 const page=await browser.newPage({width:1440,height:1080});await page.send('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('theme','dark')"});
 await page.goto('http://localhost:3000/login',{settleMs:800});await page.send('Page.bringToFront');for(let n=0;n<50&&await page.eval(()=>document.querySelector('[data-auth-puppet]').dataset.artState==='loading');n++)await sleep(100);
 for(const [name,x,y] of [['left',20,130],['right',1360,940]]){
  await page.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});await sleep(600);const gaze=await page.eval(()=>({x:parseFloat(document.querySelector('[data-auth-puppet]').style.getPropertyValue('--look-x')),y:parseFloat(document.querySelector('[data-auth-puppet]').style.getPropertyValue('--look-y'))}));states.push({name,gaze});await page.screenshot({path:`${output}/cursor-${name}.jpg`,quality:90});
 }
 check(states[0].gaze.x<0&&states[1].gaze.x>0,'Pointer must move gaze in both directions');
 await page.eval(()=>document.getElementById('password').focus());await sleep(300);await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13,text:'\r'});await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});await sleep(250);
 const remount=await page.eval(()=>({focus:document.activeElement.tagName,pose:document.querySelector('[data-auth-puppet]').dataset.pose}));states.push({remount});check(remount.pose==='idle','Validation remount must release the old password field');
 await page.goto('http://localhost:3000/reset-password?email=preview%40example.com',{settleMs:800});for(let n=0;n<50&&await page.eval(()=>document.querySelector('[data-auth-puppet]').dataset.artState==='loading');n++)await sleep(100);
 await page.eval(()=>document.getElementById('confirm-password').focus());await sleep(100);check(await page.eval(()=>document.querySelector('[data-auth-puppet]').dataset.pose)==='cover','Reset confirmation focus covers eyes');
 await page.eval(()=>document.querySelector('button[aria-label="Show confirmation password"]').click());await sleep(350);check(await page.eval(()=>document.getElementById('confirm-password').type)==='text','Reset confirmation visibility control');check(await page.eval(()=>document.querySelector('[data-auth-puppet]').dataset.pose)==='peek','Reset confirmation reveal looks toward the field');
 await page.screenshot({path:`${output}/reset-confirm-revealed.jpg`,quality:90});
 check(page.consoleErrors.length===0,'Runtime exception');await page.close();
}finally{await writeFile(`${output}/report.json`,JSON.stringify({assertions,failures,states},null,2));const directory=resolve(browser.dir);if(!directory.startsWith(resolve(tmpdir())+sep)||!basename(directory).startsWith('ad-chrome-'))throw Error('Unexpected profile');await browser.close();}
console.log(JSON.stringify({assertions,failures,output}));if(failures.length)process.exitCode=1;
