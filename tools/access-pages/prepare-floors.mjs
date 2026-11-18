import sharp from 'sharp';
import {resolve} from 'node:path';
// Dedicated material samples retain the complete scene assets used in heroes.
// Only the clear floor beneath the props becomes the footer surface.
for(const kind of ['contact','billing-help','puppet-room','login-room'])for(const theme of ['light','dark']){
 const source=resolve(`public/art/access-pages/${kind}-${theme}.webp`),meta=await sharp(source).metadata();
 const top=Math.floor(meta.height*(kind.endsWith('room')?.88:.91));
 const output=await sharp(source).extract({left:0,top,width:meta.width,height:meta.height-top}).webp({quality:86}).toFile(resolve(`public/art/access-pages/${kind}-floor-${theme}.webp`));
 console.log(JSON.stringify({kind,theme,width:output.width,height:output.height,bytes:output.size}));
}
