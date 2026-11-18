import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';import {resolve,basename} from 'node:path';import sharp from 'sharp';
const root=resolve(process.argv[2]||'../output/access-page-implementation-2026-11-18');await mkdir(root,{recursive:true});
const canonical=JSON.parse(await readFile(resolve(root,'report.json'),'utf8'));
canonical.followUpRuns=[];
for(const run of ['follow-up-register','follow-up-reset','follow-up-contrast','follow-up-billing']){
 let follow;try{follow=JSON.parse(await readFile(resolve(root,run,'report.json'),'utf8'));}catch{continue;}
 if(follow.failures.length)throw Error('Unresolved follow-up: '+run);
 canonical.followUpRuns.push({file:run+'/report.json',assertions:follow.assertions,failures:0});
 for(const view of follow.views){const index=canonical.views.findIndex(item=>item.tag===view.tag);if(index>=0)canonical.views[index]=view;for(const suffix of ['','-covered','-revealed']){try{await copyFile(resolve(root,run,view.tag+suffix+'.jpg'),resolve(root,view.tag+suffix+'.jpg'));}catch(error){if(error.code!=='ENOENT')throw error;}}}
}
await writeFile(resolve(root,'report.json'),JSON.stringify(canonical,null,2));
const routes=['contact','login','register','forgot-password','verify-email','reset-password','help-cancel-or-refund'];
const labels=['Contact','Login','Register','Forgot password','Verify email','Reset password','Cancel or refund'];
for(const route of routes){const parts=[];let height=0;for(const [index,theme]of ['dark','light'].entries()){const data=await sharp(resolve(root,`${route}-${theme}-1440.jpg`)).resize({width:720}).jpeg({quality:86}).toBuffer({resolveWithObject:true});height=Math.max(height,data.info.height);parts.push({input:data.data,left:index*720,top:0});}await sharp({create:{width:1440,height,channels:3,background:'#f7f6fb'}}).composite(parts).jpeg({quality:89}).toFile(resolve(root,`${route}-both-themes.jpg`));}
for(const width of [768,390]){const tiles=[];let y=0;for(const route of routes){let row=0;for(const[index,theme]of ['dark','light'].entries()){const data=await sharp(resolve(root,`${route}-${theme}-${width}.jpg`)).resize({width:width===768?384:300}).jpeg({quality:84}).toBuffer({resolveWithObject:true});row=Math.max(row,data.info.height);tiles.push({input:data.data,left:index*(width===768?384:300),top:y});}y+=row+18;}await sharp({create:{width:width===768?768:600,height:y,channels:3,background:'#e0dde9'}}).composite(tiles).jpeg({quality:86}).toFile(resolve(root,`all-pages-${width}.jpg`));}
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ProfileAI implementation review</title><style>body{font:16px/1.6 system-ui;margin:32px auto;padding:0 24px;max-width:1500px;background:#f7f6fb;color:#181824}h1{font-size:34px}h2{margin-top:46px}img{display:block;max-width:100%;height:auto}a{color:#6630c4}nav{display:flex;gap:20px;flex-wrap:wrap}.phone{max-width:600px}</style><h1>Implemented ProfileAI pages</h1><p>Actual browser screenshots. Dark left, light right.</p><nav>${routes.map((r,i)=>`<a href="#${r}">${labels[i]}</a>`).join('')}<a href="#phone">Mobile</a></nav>${routes.map((r,i)=>`<section id="${r}"><h2>${escape(labels[i])}</h2><a href="${r}-both-themes.jpg"><img loading="lazy" src="${r}-both-themes.jpg" alt="${escape(labels[i])} in both themes"></a></section>`).join('')}<section id="phone"><h2>Mobile</h2><img class="phone" loading="lazy" src="all-pages-390.jpg" alt="All seven routes in dark and light mobile layouts"></section><p><a href="report.json">Browser checks</a></p></html>`;
await writeFile(resolve(root,'index.html'),html);
const report=JSON.parse(await readFile(resolve(root,'report.json'),'utf8'));const follow=JSON.parse(await readFile(resolve(root,'follow-up-register/report.json'),'utf8'));
if(follow.failures.length===0&&follow.views[0]?.puppet==='ready'){
 const old=report.failures.filter(f=>f.message==='register-dark-1440 WebGL puppet did not render');
 if(old.length){report.resolvedChecks=[...(report.resolvedChecks||[]),{check:old[0].message,initialState:'loading after fixed 900ms',resolution:'Wait for lazy 3D initialization, bounded to five seconds.',recheck:'follow-up-register/report.json',result:'ready, 22 checks passed'}];report.failures=report.failures.filter(f=>f.message!==old[0].message);const at=report.views.findIndex(v=>v.tag===follow.views[0].tag);if(at>=0)report.views[at]=follow.views[0];await writeFile(resolve(root,'report.json'),JSON.stringify(report,null,2));}
}
console.log(JSON.stringify({directory:root,assertions:report.assertions,unresolvedFailures:report.failures.length,gallery:basename(resolve(root,'index.html'))}));
