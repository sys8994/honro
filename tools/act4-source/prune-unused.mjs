/** Prune only assets absent from all 40 stages, current runtime and retained
 * compatibility providers. Check compiled equality before writing a candidate.
 * Input is an assembled QA world, never a personal saved game. */
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {runtime} from '../../game/tests/helpers.mjs';
import {loadPilotRuntime} from '../stage31/pilot-runtime.mjs';
const [input,output,reportPath]=process.argv.slice(2);
if(!input||!output||!reportPath||input===output)throw Error('Usage: prune-unused.mjs input-world.json candidate-world.json report.json');
const raw=await readFile(input),world=JSON.parse(raw);
process.env.HONRO_ACT4_RELEASE='1';const g=await runtime({legacyMaps:false});await loadPilotRuntime(g);
const full=g.HONRO_PROJECT;
for(const s of world.stages)assert.deepEqual(full.stages.find(v=>v.id===s.id),s,'Materialize and pack the exact input before auditing');
let roots=JSON.stringify(Object.fromEntries(Object.entries(full).filter(([key])=>key!=='library')));
for(const dir of ['shared/map','shared/runtime'])for(const file of await readdir(dir))if(file.endsWith('.js'))roots+='\n'+await readFile(dir+'/'+file,'utf8');
const assets=new Map(world.library.map(a=>[a.id,a]));
const kept=new Set([...assets.keys()].filter(id=>roots.includes(id)||id.startsWith('act4compat')));
for(;;){const text=JSON.stringify([...kept].map(id=>assets.get(id))),added=[...assets.keys()].filter(id=>!kept.has(id)&&text.includes(id));if(!added.length)break;for(const id of added)kept.add(id);}
const removed=world.library.filter(a=>!kept.has(a.id)),gone=new Set(removed.map(a=>a.id));
const candidate={...world,library:world.library.filter(a=>kept.has(a.id))};
const after={...full,library:full.library.filter(a=>!gone.has(a.id))};
const hash=x=>createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:JSON.stringify(x)).digest('hex');
const compiled=[];
for(const stage of full.stages){g.HONRO_PROJECT=full;const a=hash(g.HonroMaps.compile(stage,full));g.HONRO_PROJECT=after;const b=hash(g.HonroMaps.compile(stage,after));assert.equal(a,b,'Compiled stage changed: '+stage.id);compiled.push({stage:stage.id,sha256:a});}
g.HONRO_PROJECT=full;
const bytes=Buffer.from(JSON.stringify(candidate));
await writeFile(output,bytes);
const report={scope:'candidate only; compiled equivalence is not browser/save acceptance',beforeBytes:raw.length,afterBytes:bytes.length,beforeAssets:world.library.length,afterAssets:candidate.library.length,inputSha256:hash(raw),outputSha256:hash(bytes),compatibilityAssetsRetained:candidate.library.filter(a=>a.id.startsWith('act4compat')).map(a=>a.id),removed:removed.map(a=>({id:a.id,bytes:Buffer.byteLength(JSON.stringify(a))})),compiled};
await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({beforeBytes:raw.length,afterBytes:bytes.length,removed:removed.length,compiledIdentical:compiled.length,outputSha256:report.outputSha256}));
