import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {runtimeParts,root} from '../../shared/build.mjs';
import {actorCatalog} from './catalog.mjs';
import path from 'node:path';
const out=path.join(root,'_local/reports/actor-forge');await mkdir(out,{recursive:true});
const runtime=(await runtimeParts()).join('\n'),template=await readFile(new URL('./lab.html',import.meta.url),'utf8'),metrics=await readFile(path.join(out,'metrics.json'),'utf8');
await writeFile(path.join(out,'index.html'),template.replace('/* RUNTIME */',runtime).replace('/* DATA */','const catalog='+JSON.stringify(actorCatalog)+';const metrics='+metrics+';'));
console.log('_local/reports/actor-forge/index.html');
