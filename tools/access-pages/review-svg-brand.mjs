import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import sharp from 'sharp';

const out=resolve(process.argv[2]||'../output/svg-brand-refinement-2026-11-18'),source=join(out,'verified');
const report=JSON.parse(await readFile(join(source,'report.json'),'utf8'));
if(report.failures.length)throw Error('Resolve browser failures before publishing the review.');
await mkdir(out,{recursive:true});
const routes=['login','register','forgot-password','verify-email','reset-password','contact','help-cancel-or-refund'];
const labels=['Login','Register','Forgot password','Verify email','Reset password','Contact','Cancel or refund'];
for(const route of routes)for(const width of [1440,768,390]){
 const tileWidth=width===1440?720:width===768?384:390,parts=[];let height=0;
 for(const [index,theme] of ['dark','light'].entries()){
  const img=await sharp(join(source,`${route}-${theme}-${width}.jpg`)).resize({width:tileWidth}).jpeg({quality:90}).toBuffer({resolveWithObject:true});
  height=Math.max(height,img.info.height);parts.push({input:img.data,left:index*tileWidth,top:0});
 }
 await sharp({create:{width:tileWidth*2,height,channels:3,background:'#e7e1ec'}}).composite(parts).jpeg({quality:92}).toFile(join(out,`${route}-${width}-both.jpg`));
}
const chrome=[];let chromeHeight=0;
for(const [index,theme] of ['dark','light'].entries()){
 const nav=await sharp(join(source,`contact-${theme}-1440.jpg`)).extract({left:0,top:0,width:1440,height:80}).resize({width:720}).toBuffer();
 const footer=await sharp(join(source,`contact-${theme}-1440-footer.jpg`)).resize({width:720}).toBuffer({resolveWithObject:true});
 const height=70+footer.info.height;chromeHeight=Math.max(chromeHeight,height);
 const label=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="30"><rect width="720" height="30" fill="${theme==='dark'?'#14232a':'#e9eff0'}"/><text x="20" y="20" fill="${theme==='dark'?'#c8cbd9':'#4c5162'}" font-family="Arial" font-size="11" letter-spacing="2">${theme.toUpperCase()} · SHARED NAVIGATION &amp; FOOTER</text></svg>`);
 chrome.push({input:label,left:index*720,top:0},{input:nav,left:index*720,top:30},{input:footer.data,left:index*720,top:70});
}
await sharp({create:{width:1440,height:chromeHeight,channels:3,background:'#e9eff0'}}).composite(chrome).jpeg({quality:94}).toFile(join(out,'navbar-footer-both.jpg'));
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ProfileAI · SVG puppet & public identity</title><style>body{max-width:1480px;margin:40px auto;padding:0 24px;background:#f2edf5;color:#241c2b;font:16px/1.65 system-ui}h1,h2{letter-spacing:-.04em;line-height:1.15}h1{font-size:42px}nav{display:flex;gap:24px;flex-wrap:wrap}a{color:#643291}section{margin-block:56px}img{display:block;width:100%;height:auto}video{display:block;width:min(100%,450px);border-radius:12px}details{margin-top:20px}summary{cursor:pointer;min-height:44px}details img{width:auto;max-width:100%}.motion{display:flex;align-items:center;gap:50px;flex-wrap:wrap}.motion p{max-width:440px}</style><h1>ProfileAI · A living character. One visual identity.</h1><p>Actual local browser captures. Dark left, light right. ${report.views.length} views; ${report.assertions} browser assertions; no failures. Native SVG character with spring-driven head, eyes and hands. No character image layers or WebGL.</p><nav><a href="#identity">Navigation & footer</a><a href="#motion">Puppet motion</a>${routes.map((route,index)=>`<a href="#${route}">${labels[index]}</a>`).join('')}</nav><section id="identity"><h2>Shared public navigation & footer</h2><p>The same components inherit each page’s room tone. A restrained header, grouped links, a large ProfileAI imprint, and a compact account-page variant.</p><img src="navbar-footer-both.jpg" alt="Actual shared navbar and footer in dark and light themes"></section><section id="motion"><h2>Lightweight SVG puppet</h2><div class="motion"><video controls loop muted playsinline poster="motion-frames/frame-0000.jpg" src="puppet-motion.mp4"></video><p>Actual browser recording: follows the pointer, covers both eyes for the active masked password, lowers its hands and looks toward the revealed field. Head, face, pupils, sleeves and mittens move independently. Breathing and blinking continue while visible. Reduced motion keeps immediate state cues. The character reads control metadata only.</p></div></section>${routes.map((route,index)=>`<section id="${route}"><h2>${labels[index]}</h2><img loading="lazy" src="${route}-1440-both.jpg" alt="${labels[index]} desktop, dark and light"><details><summary>Tablet · 768 px</summary><img loading="lazy" src="${route}-768-both.jpg" alt="${labels[index]} tablet"></details><details><summary>Phone · 390 px</summary><img loading="lazy" src="${route}-390-both.jpg" alt="${labels[index]} phone"></details></section>`).join('')}<section><h2>Verification</h2><p><a href="verified/report.json">Browser report</a> · <a href="narrow-header.json">320 px header checks</a> · <a href="motion-report.json">Motion capture metadata</a></p><p>The puppet source and CSS total ${report.puppetSource.bytes.toLocaleString('en')} bytes, ${report.puppetSource.gzipBytes.toLocaleString('en')} bytes gzipped. This measures source size, not a production bundle. No account, email, support or billing submission was made.</p></section></html>`;
await writeFile(join(out,'index.html'),html);
console.log(JSON.stringify({out,gallery:'index.html',comparisons:21,chrome:'navbar-footer-both.jpg'}));
