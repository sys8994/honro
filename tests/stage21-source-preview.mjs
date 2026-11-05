/** Local test-only HTTP replacements; never writes release assets or evidence. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {minify} from 'terser';
import {createHash} from 'node:crypto';
const base='984798ec587546a02e7f82226fd30ffe7a5722cd',files=process.argv.slice(2),manifest=JSON.parse(await readFile('web/manifest.json','utf8')),patches={};
const wrap=async s=>(await minify(`(()=>{'use strict';${s}})();`,{module:true,compress:false,mangle:false,format:{comments:false}})).code;
for(const file of files){const old=await wrap(execFileSync('git',['show',`${base}:${file}`],{encoding:'utf8'})),next=await wrap(await readFile(file,'utf8'));let found=0;
 for(const path of manifest.common){if(!path.includes('ordered-common'))continue;const body=patches[path]??await readFile(path,'utf8');if(body.includes(old)){if(body.split(old).length!==2)throw Error('Ambiguous module '+file);patches[path]=body.replace(old,next);found++;}}
 if(found!==1)throw Error('Missing baseline module '+file);
}
const source={base,files:await Promise.all(files.map(async path=>({path,sha256:createHash('sha256').update(await readFile(path)).digest('hex')}))),scope:'Local intercepted source modules; not a gated release build'};
await mkdir('_local/reports/stage21-polish',{recursive:true});await writeFile('_local/reports/stage21-polish/source-preview.json',JSON.stringify({source,patches}));console.log(source);
