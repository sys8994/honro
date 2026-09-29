import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {runtimeParts,root} from '../../shared/build.mjs';
const dir=path.join(root,'_local/reports/party-forge');await mkdir(dir,{recursive:true});
const runtime=(await runtimeParts()).join('\n'),legacy=await readFile(path.join(root,'shared/assets/party.v006.runtime.js'),'utf8'),metrics=await readFile(path.join(dir,'metrics.json'),'utf8');
const baseline=`(function(){const globalThis={};${legacy}\nwindow.PartyBaseline={assets:globalThis.HONRO_PARTY,rig:globalThis.HonroVectorRig};})();`;
const template=await readFile(new URL('./lab.html',import.meta.url),'utf8');
await writeFile(path.join(dir,'index.html'),template.replace('/* RUNTIME */',runtime+'\n'+baseline).replace('/* METRICS */','const metrics='+metrics+';'));
console.log('_local/reports/party-forge/index.html');
