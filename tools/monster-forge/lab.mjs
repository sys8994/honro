import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {runtimeParts,root} from '../../shared/build.mjs';
const dir=path.join(root,'_local/reports/monster-forge');await mkdir(dir,{recursive:true});
const runtime=(await runtimeParts()).join('\n'),template=await readFile(new URL('./lab.html',import.meta.url),'utf8');
const report=await readFile(path.join(dir,'metrics.json'),'utf8');
await writeFile(path.join(dir,'index.html'),template.replace('/* RUNTIME */',runtime).replace('/* METRICS */',`const metrics=${report};`));
console.log('_local/reports/monster-forge/index.html');
