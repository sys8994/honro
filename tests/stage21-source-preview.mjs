/** Local test-only HTTP replacements; never writes release assets or evidence. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {minify} from 'terser';
import {createHash} from 'node:crypto';
const base='984798ec587546a02e7f82226fd30ffe7a5722cd',files=process.argv.slice(2),manifest=JSON.parse(await readFile('web/manifest.json','utf8')),patches={};
const wrap=async s=>(await minify(`(()=>{'use strict';${s}})();`,{module:true,compress:false,mangle:false,format:{comments:false}})).code;
for(const file of files){if(file==='shared/data/campaign.json'){
 const {packJson,unpackJson}=await import('../shared/json-pool.mjs'),project=JSON.parse(await readFile(file,'utf8')),pm=JSON.parse(await readFile(manifest.project,'utf8')),path=pm.stageLibraries[20],old=unpackJson(JSON.parse(await readFile(path,'utf8'))),changed=new Set(['eup21:foundations','eup21:approach-awning']);
 const assets=old.filter(a=>!changed.has(a.id)).concat(project.library.filter(a=>changed.has(a.id)));
 patches[path]=JSON.stringify(packJson(assets));patches[pm.stages[20]]=JSON.stringify(project.stages[20]);continue;
 }if(file.endsWith('.css')){const stem='web/styles/'+file.replaceAll('/','-').replace(/\.css$/,'')+'.',paths=manifest.styles.filter(p=>p.startsWith(stem));if(paths.length!==1)throw Error('Ambiguous CSS '+file);patches[paths[0]]=await readFile(file,'utf8');continue;}const old=await wrap(execFileSync('git',['show',`${base}:${file}`],{encoding:'utf8'})),next=await wrap(await readFile(file,'utf8'));let found=0;
 for(const path of manifest.common){if(!path.includes('ordered-common'))continue;const body=patches[path]??await readFile(path,'utf8');if(body.includes(old)){if(body.split(old).length!==2)throw Error('Ambiguous module '+file);patches[path]=body.replace(old,next);found++;}}
 if(found!==1)throw Error('Missing baseline module '+file);
}
const source={base,files:await Promise.all(files.map(async path=>({path,sha256:createHash('sha256').update(await readFile(path)).digest('hex')}))),scope:'Local intercepted source modules; not a gated release build'};
await mkdir('_local/reports/stage21-polish',{recursive:true});await writeFile('_local/reports/stage21-polish/source-preview.json',JSON.stringify({source,patches}));console.log(source);
