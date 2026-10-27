/** Build boundary for new Stage31 work. The already-published bad baseline is
 * recognized only so unrelated fixes remain deployable; it is NOT approved. */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtimeDigest} from './probes.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function stagePayload(world){const stage=world.stages.find(s=>s.metadata.stageId===31),ids=new Set([...(stage.elements||[]),...(stage.environment?.placements||[])].map(v=>v.assetId));return{stage,assets:world.library.filter(a=>ids.has(a.id)).sort((a,b)=>a.id.localeCompare(b.id))};}
const world=JSON.parse(await readFile('shared/data/act4/world.json','utf8')),policy=JSON.parse(await readFile('tools/stage31/release-policy.json','utf8')),payload=stagePayload(world);
if(hash(payload)===policy.legacyUnapprovedSha256){console.log('Stage31: unchanged legacy baseline (NOT design-approved); unrelated build permitted.');}
else{
 const file='tools/stage31/production-package.json';let p;try{p=JSON.parse(await readFile(file,'utf8'));}catch{throw Error('Stage31 changed without a verified production package. Save a draft; do not bypass the production contract.');}
 if(hash(stagePayload(p))!==hash(payload))throw Error('Stage31 production package differs from the actual shipped map/assets.');
 process.env.HONRO_ACT4_RELEASE='1';const {runtime}=await import('../../game/tests/helpers.mjs'),g=await runtime({legacyMaps:false}),P=g.HonroProductionContract;P.assertExport(p,payload.stage.id);
 const runtimeSha256=await runtimeDigest();for(const r of p.production.probeResults[payload.stage.id])if(r.runtimeSha256!==runtimeSha256)throw Error('Runtime changed after actual Engine probes.');
 for(const r of p.production.reviews[payload.stage.id])for(const e of r.evidence){if(e.path.startsWith('/')||e.path.split(/[\\/]/).includes('..'))throw Error('Evidence must remain in the production package directory');const bytes=await readFile('tools/stage31/'+e.path);if(createHash('sha256').update(bytes).digest('hex')!==e.sha256)throw Error('Missing or changed visual evidence: '+e.path);}
 console.log('Stage31: production evidence present and current. This is not automatic art/fun approval.');
}
