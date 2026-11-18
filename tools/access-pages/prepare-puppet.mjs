import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import sharp from 'sharp';

const manifest=process.argv[2];
if(!manifest)throw Error('Pass the image_gen puppet manifest.');
const entries=JSON.parse(await readFile(manifest,'utf8'));
const directory=resolve('public/art/access-pages/puppet');
await mkdir(directory,{recursive:true});
const assets=[];
for(const entry of entries){
 const source=await sharp(entry.source).metadata();
 if(source.width!==1024||source.height!==1536||!source.hasAlpha)throw Error(`Unexpected puppet registration: ${entry.key}`);
 // All poses share the same untouched canvas. Independent trimming breaks feet
 // registration and makes the character jump when hands cover the eyes.
 const file=`${entry.key}.webp`;
 const output=await sharp(entry.source).resize({width:900}).webp({quality:88,alphaQuality:100}).toFile(join(directory,file));
 assets.push({...entry,file,width:output.width,height:output.height,bytes:output.size});
}
await writeFile(resolve('tools/access-pages/puppet-provenance.json'),JSON.stringify({tool:'Built-in image_gen',reference:'../output/auth-puppet-proposals-2026-11-18/register-dark-light.png',method:'Reference-matched transparent character artwork with metadata-only SVG gaze and animated pose layers',canvas:[1024,1536],assets},null,2));
console.log(JSON.stringify({directory,assets:assets.length,bytes:assets.reduce((sum,a)=>sum+a.bytes,0)}));
