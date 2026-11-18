/** Regenerate actual perspective-lit background plates and transparent physical platforms. */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve, join, sep, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const args=process.argv.slice(2),opt=(name,fallback)=>{const i=args.indexOf('--'+name);return i<0?fallback:args[i+1];};
const helper=opt('helper',process.env.PROFILEAI_BROWSER_HELPER);if(!helper)throw Error('Pass --helper <cdp.mjs>');
const {Browser}=await import(pathToFileURL(resolve(helper)).href);
const kinds=opt('kinds','trust,workspace,graph,showcase,story,templates,pricing,faq,closing,footer,dais,plinth').split(',');
const out=resolve(opt('out',join(root,'public/art/environments-v2')));mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');let path;
  if(url.pathname==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><style>html,body{margin:0}canvas{display:block}</style><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script><script type="module" src="/environment-scene.mjs"></script>');return;}
  if(url.pathname==='/environment-scene.mjs')path=join(root,'tools/cinema/environment-scene.mjs');
  else if(url.pathname.startsWith('/three/')){const base=join(root,'node_modules/three');path=resolve(base,decodeURIComponent(url.pathname.slice(7)));if(!path.startsWith(base+sep))throw Error('Invalid module path');}
  else if(/^\/templates\/story\/[a-z-]+\.png$/.test(url.pathname))path=join(root,'public',url.pathname);
  else{res.statusCode=404;res.end();return;}
  res.setHeader('Content-Type',path.endsWith('.png')?'image/png':'text/javascript');res.end(readFileSync(path));
 }catch{res.statusCode=404;res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await Browser.launch({extraArgs:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const assets=[];
try{
 const page=await browser.newPage({width:1600,height:1000});await page.goto(`http://127.0.0.1:${server.address().port}/`,{settleMs:800});
 if(!await page.eval(()=>window.environmentReady))throw Error('3D artwork module did not initialize: '+page.consoleErrors.join('\n'));
 for(const kind of kinds)for(const dark of [true,false])for(const mobile of ['dais','plinth'].includes(kind)?[false]:opt('sizes','all')==='desktop'?[false]:[false,true]){
  const objectOnly=['dais','plinth'].includes(kind),width=objectOnly?1000:mobile?768:1600,height=objectOnly?340:mobile?1400:1000;
  const image=await page.eval(options=>window.renderEnvironment(options),{kind,dark,mobile,width,height});
  const file=`${kind}-${dark?'dark':'light'}${mobile?'-mobile':''}.webp`;
  let picture=sharp(Buffer.from(image.split(',')[1],'base64'));
  if(objectOnly)picture=picture.trim({threshold:1});
  const {data:buffer,info}=await picture.webp({quality:90,alphaQuality:100}).toBuffer({resolveWithObject:true});
  writeFileSync(join(out,file),buffer);assets.push({file,width:info.width,height:info.height,bytes:buffer.length});console.log(`${file}: ${Math.round(buffer.length/1024)} KB`);
 }
 if(page.consoleErrors.length)throw Error(page.consoleErrors.join('\n'));
 const inventory=await Promise.all(readdirSync(out).filter(file=>file.endsWith('.webp')).sort().map(async file=>{const info=await sharp(join(out,file)).metadata();return{file,width:info.width,height:info.height,bytes:statSync(join(out,file)).size};}));
 writeFileSync(join(out,'provenance.json'),JSON.stringify({generator:'tools/cinema/environment-scene.mjs',renderer:'Three.js physical geometry, studio lighting, shadow maps and planar reflections',inputPapers:'public/templates/story',assets:inventory},null,2)+'\n');
}finally{
 const dir=resolve(browser.dir);if(!dir.startsWith(resolve(tmpdir())+sep)||!basename(dir).startsWith('ad-chrome-'))throw Error('Unexpected browser profile');await browser.close();server.close();
}
