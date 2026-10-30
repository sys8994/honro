/** Build boundary for new Stage31 work. The already-published bad baseline is
 * recognized only so unrelated fixes remain deployable; it is NOT approved. */
import {readFile} from 'node:fs/promises';
import {materializeWorld,defaultDirectory} from '../act4-source/world-source.mjs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {runtimeDigest} from './probes.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
// Keep this historical calculation unchanged. Never update its stored allowance
// merely because new artwork or a new payload resolver has been introduced.
export function legacyStagePayload(world){const stage=world.stages.find(s=>s.metadata.stageId===31),ids=new Set([...(stage.elements||[]),...(stage.environment?.placements||[])].map(v=>v.assetId));return{stage,assets:world.library.filter(a=>ids.has(a.id)).sort((a,b)=>a.id.localeCompare(b.id))};}

function assetReferences(value,ids){
 if(!value||typeof value!=='object')return;
 for(const [key,item] of Object.entries(value)){
  if((key==='assetId'||key.endsWith('AssetId'))&&typeof item==='string')ids.add(item);
  else if((key==='assetIds'||key.endsWith('AssetIds'))&&Array.isArray(item))for(const id of item){if(typeof id!=='string')throw Error('Invalid asset reference list: '+key);ids.add(id);}
  else if(item&&typeof item==='object')assetReferences(item,ids);
 }
}
export function stagePayload(world){
 const matches=world.stages.filter(s=>s.metadata?.stageId===31);
 if(matches.length!==1)throw Error('Exactly one Stage31 is required in the release payload.');
 const stage=matches[0],byId=new Map();
 for(const asset of world.library){if(byId.has(asset.id))throw Error('Duplicate release asset: '+asset.id);byId.set(asset.id,asset);}
 const ids=new Set();assetReferences(stage,ids);const queue=[...ids];
 for(let i=0;i<queue.length;i++){
  const id=queue[i],asset=byId.get(id);if(!asset)throw Error('Missing Stage31 release asset: '+id);
  const dependencies=new Set();assetReferences(asset,dependencies);
  for(const dependency of dependencies)if(!ids.has(dependency)){ids.add(dependency);queue.push(dependency);}
 }
 return {stage,assets:[...ids].map(id=>byId.get(id)).sort((a,b)=>a.id.localeCompare(b.id))};
}
// Same precedence as shared/build.mjs: compiled campaign assets own shared IDs;
// Act4 contributes only IDs that the compiled campaign does not already supply.
export function mergeShippedWorld(campaign,world){
 const sharedIds=new Set(campaign.library.map(a=>a.id));
 return {...campaign,stages:[...campaign.stages,...world.stages],library:[...campaign.library,...world.library.filter(a=>!sharedIds.has(a.id))]};
}
export async function resolveShippedWorld(world){
 const before=process.env.HONRO_ACT4_RELEASE;let entries;
 try{
  process.env.HONRO_ACT4_RELEASE='0';
  const {runtimeEntries}=await import('../../shared/build.mjs');
  entries=await runtimeEntries({vector:false,render:false,app:false,productionStory:true});
 }finally{if(before===undefined)delete process.env.HONRO_ACT4_RELEASE;else process.env.HONRO_ACT4_RELEASE=before;}
 const campaign=entries.find(e=>e.name==='campaign')?.project;
 if(!campaign)throw Error('Compiled shared campaign is unavailable for Stage31 release validation.');
 return mergeShippedWorld(campaign,world);
}
export function assertMatchingPayload(shipped,productionPackage){
 const payload=stagePayload(shipped);
 if(hash(stagePayload(productionPackage))!==hash(payload))throw Error('Stage31 production package differs from the actual shipped map/assets.');
 return payload;
}
export async function checkRelease({worldFile='shared/data/act4/world.json',policyFile='tools/stage31/release-policy.json',packageFile='tools/stage31/production-package.json',evidenceDirectory='tools/stage31'}={}){
 if(path.resolve(worldFile)===path.join(defaultDirectory,'world.json'))await materializeWorld();
 const world=JSON.parse(await readFile(worldFile,'utf8')),policy=JSON.parse(await readFile(policyFile,'utf8'));
 if(hash(legacyStagePayload(world))===policy.legacyUnapprovedSha256){console.log('Stage31: unchanged legacy baseline (NOT design-approved); unrelated build permitted.');return;}
 let p;try{p=JSON.parse(await readFile(packageFile,'utf8'));}catch{throw Error('Stage31 changed without a verified production package. Save a draft; do not bypass the production contract.');}
 const payload=assertMatchingPayload(await resolveShippedWorld(world),p);
 process.env.HONRO_ACT4_RELEASE='1';const {runtime}=await import('../../game/tests/helpers.mjs'),g=await runtime({legacyMaps:false}),P=g.HonroProductionContract;P.assertExport(p,payload.stage.id);
 const runtimeSha256=await runtimeDigest();for(const r of p.production.probeResults[payload.stage.id])if(r.runtimeSha256!==runtimeSha256)throw Error('Runtime changed after actual Engine probes.');
 for(const r of p.production.reviews[payload.stage.id])for(const e of r.evidence){if(e.path.startsWith('/')||e.path.split(/[\\/]/).includes('..'))throw Error('Evidence must remain in the production package directory');const bytes=await readFile(evidenceDirectory+'/'+e.path);if(createHash('sha256').update(bytes).digest('hex')!==e.sha256)throw Error('Missing or changed visual evidence: '+e.path);}
 console.log('Stage31: production evidence present and current. This is not automatic art/fun approval.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await checkRelease();
