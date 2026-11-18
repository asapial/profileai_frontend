import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import sharp from 'sharp';
const directory=resolve(process.argv[2]||'../output/access-fidelity-repair-2026-11-18');
await mkdir(directory,{recursive:true});
const reports=await Promise.all(['fidelity-report.json','wide-ancestor-bounds/fidelity-report.json','behavior/report.json','gaze/report.json'].map(async file=>({file,...JSON.parse(await readFile(join(directory,file),'utf8'))})));
for(const report of reports)if(report.failures.length)throw Error('Unresolved failures in '+report.file);
const inspectorRuns=await Promise.all(['register','login','forgot-password','verify-email','reset-password','contact-approved','billing-final'].map(async name=>{
 const file=`inspector/${name}/report.json`,report=JSON.parse(await readFile(join(directory,file),'utf8'));
 if(report.findings.some(finding=>finding.level==='FAIL'))throw Error('Unresolved design inspection: '+file);
 return{file,allow:report.allow,warnings:report.findings.filter(finding=>finding.level==='WARN'),failures:0};
}));
await writeFile(join(directory,'inspector/final-summary.json'),JSON.stringify(inspectorRuns,null,2));
const routes=['login','register','forgot-password','verify-email','reset-password','contact','help-cancel-or-refund'];
const labels=['Login','Register','Forgot password','Verify email','Reset password','Contact','Cancel or refund'];
for(const route of routes)for(const width of [1440,768,390]){
 const parts=[];let height=0;const tileWidth=width===1440?720:width===768?384:300;
 for(const [index,theme] of ['dark','light'].entries()){
  const source=join(directory,'stable');
  const image=await sharp(join(source,`${route}-${theme}-${width}x${width===1440?1080:width===768?1024:844}.jpg`)).resize({width:tileWidth}).jpeg({quality:89}).toBuffer({resolveWithObject:true});
  height=Math.max(height,image.info.height);parts.push({input:image.data,left:index*tileWidth,top:0});
 }
 await sharp({create:{width:tileWidth*2,height,channels:3,background:'#e9e5ef'}}).composite(parts).jpeg({quality:91}).toFile(join(directory,`${route}-${width}-both-themes.jpg`));
}
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ProfileAI responsive repair</title><style>body{max-width:1460px;margin:32px auto;padding:0 20px;font:16px/1.6 system-ui;color:#181824;background:#f7f6fb}img{display:block;width:100%;height:auto}nav{display:flex;gap:20px;flex-wrap:wrap}a{color:#6630c4}section{margin-block:48px}details{margin-block:20px}details img{max-width:768px}summary{cursor:pointer;min-height:44px}</style><h1>ProfileAI responsive repair</h1><p>Actual browser captures. Dark left, light right. Seven routes checked at eight screen sizes, including landscape. The original portrait is retained; compact contact and billing scenes keep the complete subject side of the source.</p><nav>${routes.map((r,i)=>`<a href="#${r}">${labels[i]}</a>`).join('')}</nav>${routes.map((r,i)=>`<section id="${r}"><h2>${labels[i]}</h2><img src="${r}-1440-both-themes.jpg" alt="${labels[i]}, desktop, both themes" loading="lazy"><details><summary>Tablet</summary><img src="${r}-768-both-themes.jpg" alt="${labels[i]}, tablet" loading="lazy"></details><details><summary>Phone</summary><img src="${r}-390-both-themes.jpg" alt="${labels[i]}, phone" loading="lazy"></details></section>`).join('')}<h2>Evidence</h2><p>${reports.map(r=>`<a href="${r.file}">${r.file}</a>`).join(' · ')}</p><p>The puppet uses approved-reference rendered artwork, SVG gaze and pose layers. It reads focus and visibility metadata only. These checks make no real account, email, support or billing submission.</p></html>`;
await writeFile(join(directory,'index.html'),html);
await writeFile(join(directory,'verification-summary.json'),JSON.stringify({routes:7,screenSizes:[[320,740],[390,844],[600,960],[768,1024],[844,390],[1024,768],[1440,1080],[1920,1080]],themes:['light','dark'],assertions:reports.reduce((sum,r)=>sum+r.assertions,0),failures:0,runs:reports.map(r=>({file:r.file,assertions:r.assertions,views:r.views?.length??null,failures:r.failures.length})),inspectorRuns},null,2));
console.log(JSON.stringify({directory,gallery:'index.html',comparisons:21,failures:0}));
