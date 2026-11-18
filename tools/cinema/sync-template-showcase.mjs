/** Copy the seven curated designs from the shared catalog, without changing it. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(join(root,'package.json'));const ts=require('typescript');
const source=resolve(root,'../profileai_backend/src/scripts/uniqueTemplateCatalog.ts');
const code=ts.transpileModule(readFileSync(source,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};new Function('exports',code)(exports);
const names=['Kinship','Gridline','Harbor','Orbit','Apex','Editorial Cut','Oblique'];
const entries=names.map(name=>{const item=exports.UNIQUE_TEMPLATE_CATALOG.find(t=>t.name===name&&t.documentType==='RESUME');if(!item)throw Error('Missing catalog template '+name);return{...item,sourceHash:createHash('sha256').update(item.htmlLayout+'\n'+item.cssStyles).digest('hex')}});
writeFileSync(join(root,'src/lib/home-template-catalog.json'),JSON.stringify(entries,null,2)+'\n');
console.log('Synced '+entries.length+' unchanged catalog templates.');
