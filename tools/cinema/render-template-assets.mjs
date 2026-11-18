/** Rebuild the small, cacheable fallback previews from the actual catalog HTML. */
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,existsSync,rmSync} from 'node:fs';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import {resolve,join,dirname,sep} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');const require=createRequire(join(root,'package.json'));const ts=require('typescript');
const compiled=ts.transpileModule(readFileSync(join(root,'src/lib/resume/interpolate.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};new Function('exports',compiled)(exports);
const templates=JSON.parse(readFileSync(join(root,'src/lib/home-template-catalog.json'),'utf8'));
const data=JSON.parse(readFileSync(join(root,'src/lib/home-resume-sample.json'),'utf8'));
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';if(!existsSync(chrome))throw Error('Set CHROME_PATH to the installed browser.');
const out=join(root,'public/templates/story');mkdirSync(out,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'profileai-preview-assets-'));
try{
 for(const template of templates){
  const body=exports.safeInterpolate(template.htmlLayout,data);
  const html=`<!doctype html><meta charset="utf-8"><meta name="color-scheme" content="light"><style>html,body{margin:0;width:794px;height:1123px;overflow:hidden;background:#fff}*{box-sizing:border-box}${template.cssStyles}</style>${body}`;
  const source=join(profile,template.slug+'.html');writeFileSync(source,html);
  await new Promise((done,fail)=>{const child=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--hide-scrollbars','--force-device-scale-factor=1','--window-size=794,1123','--virtual-time-budget=600',`--user-data-dir=${profile}`,`--screenshot=${join(out,template.slug+'.png')}`,pathToFileURL(source).href],{windowsHide:true,stdio:'ignore'});child.once('error',fail);child.once('exit',code=>code===0?done():fail(Error(`Browser failed for ${template.slug}: ${code}`)))});
 }
 writeFileSync(join(out,'provenance.json'),JSON.stringify({source:'profileai_backend/src/scripts/uniqueTemplateCatalog.ts',sample:'src/lib/home-resume-sample.json',templates:templates.map(t=>({slug:t.slug,sourceHash:t.sourceHash}))},null,2)+'\n');
 console.log('Rendered '+templates.length+' real catalog previews.');
}finally{const safeRoot=resolve(tmpdir())+sep;if(!resolve(profile).startsWith(safeRoot))throw Error('Unexpected temporary preview directory');rmSync(profile,{recursive:true,force:true})}
