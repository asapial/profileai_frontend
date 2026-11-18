import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sourcePath=process.argv[2];
if(!sourcePath)throw new Error('Pass the generated-art manifest path.');
const input=JSON.parse(await readFile(sourcePath,'utf8'));
const entries=Array.isArray(input)?input:input.assets;
const directory=path.resolve('public/art/access-pages');await mkdir(directory,{recursive:true});
const records=[];
for(const entry of entries){
 const name=`${entry.key}-${entry.theme}`;
 const banner=['contact','billing-help'].includes(entry.key);
 const meta=await sharp(entry.source).metadata();
 const desktop=await sharp(entry.source).resize({width:banner?1920:1200,withoutEnlargement:true}).webp({quality:86}).toFile(path.join(directory,`${name}.webp`));
 let mobile=sharp(entry.source);
 if(banner){const left=Math.floor(meta.width*.51);mobile=mobile.extract({left,top:0,width:meta.width-left,height:meta.height});}
 // Preserve the complete portrait, or the complete subject side of a banner.
 // A second cover resize used to cut off the dais and the room on phones.
 const phone=await mobile.resize({width:780,withoutEnlargement:true}).webp({quality:84}).toFile(path.join(directory,`${name}-mobile.webp`));
 records.push({...entry,desktop:{file:`${name}.webp`,bytes:desktop.size,width:desktop.width,height:desktop.height},mobile:{file:`${name}-mobile.webp`,bytes:phone.size,width:phone.width,height:phone.height}});
}
await writeFile(path.resolve('tools/access-pages/art-provenance.json'),JSON.stringify({tool:'Built-in image_gen',purpose:'Approved ProfileAI authentication and contact design implementation',date:'2026-11-18',fit:'Full intrinsic aspect ratio; no cover resize',assets:records},null,2));
console.log(JSON.stringify({assets:records.length*2,bytes:records.reduce((sum,r)=>sum+r.desktop.bytes+r.mobile.bytes,0),directory}));
