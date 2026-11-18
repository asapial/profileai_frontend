import sharp from 'sharp';
for(const kind of ['login-room','puppet-room','forgot','verify','contact','billing-help'])for(const theme of ['light','dark']){
 const {data,info}=await sharp(`public/art/access-pages/${kind}-${theme}.webp`).resize(80,100,{fit:'fill'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const values=[[],[],[]];
 for(let y=7;y<62;y++)for(let x=77;x<80;x++)for(let c=0;c<3;c++)values[c].push(data[(y*info.width+x)*3+c]);
 const rgb=values.map(v=>v.sort((a,b)=>a-b)[Math.floor(v.length/2)]);
 console.log(JSON.stringify({kind,theme,edge:'#'+rgb.map(c=>c.toString(16).padStart(2,'0')).join('')}));
}
