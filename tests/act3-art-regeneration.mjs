import {beforeStage30Ferry} from './stage8-bier-history-helpers.mjs';
/** Rebuild authoring inputs without mutating the campaign; compare physical and mission contracts. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {applyHiddenWaterworks} from '../tools/map-forge/act3-hidden-waterworks.mjs';
import {buildProduction} from '../tools/map-forge/act3-production-maps.mjs';
import {openStructureHistoryDelta} from './open-structure-history-helpers.mjs';
const before=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
beforeStage30Ferry(before); // Validate current30 before testing the complete live generator output.
const {g,p:authored}=await buildProduction({write:false});
// The reviewed v2 authoring pipeline composes the depot revision after the
// preserved foundation/location builders; never compare their v1 output alone
// with a campaign that intentionally replaced chapters23–28.
const plain=x=>JSON.parse(JSON.stringify(x));
const legacyAssets=new Map(g.HONRO_PROJECT.library.map(a=>[a.id,a]));for(const a of g.HONRO_SPLIT_V1.library||[])legacyAssets.set(a.id,a);
const legacyProject={...g.HONRO_PROJECT,library:[...legacyAssets.values()]};
// The shared asset factories apply D even to this intermediate v1 rebuild.
// Its former chapter27 courtyard became today's chapter28. Reverse only those
// exact reviewed IDs/flags for the frozen comparison, never the frozen input.
function beforeIntermediateOpenStructures(rebuilt,terrain,expected){
 const policyStage=rebuilt.metadata.stageId===27?28:rebuilt.metadata.stageId,out=plain(terrain),targets=new Map();
 for(const row of openStructureHistoryDelta.rows.filter(r=>r.stage===policyStage)){
  if(row.kind==='terrain'){
   if(rebuilt.terrains.some(t=>t.id===row.id))targets.set(row.id,row);
  }else{
   const instance=rebuilt.elements.find(e=>e.id===row.elementId&&e.assetId===row.id);
   if(!instance)continue;
   const asset=authored.library.find(a=>a.id===row.id);assert(asset,'Reviewed intermediate asset '+row.id);
   for(let i=0;i<asset.collision.length;i++)targets.set(`${instance.id}:collision:${i}`,row);
  }
 }
 for(const [id,row]of targets){
  const matches=out.filter(t=>t.id===id),old=expected.filter(t=>t.id===id),label=rebuilt.id+'/'+id+' exact intermediate D flag';
  assert.equal(matches.length,1,label+' unique collider');assert.equal(old.length,1,label+' frozen collider');
  const t=matches[0];assert.equal(t.oneWay,row.after.oneWay,label+' current');assert.equal(old[0].oneWay,row.before.oneWay,label+' historical');t.oneWay=row.before.oneWay;
  for(const [key,value]of Object.entries(row.before.properties||{})){
   assert(!Object.hasOwn(t,key),label+' removed '+key);assert.equal(old[0][key],value,label+' frozen '+key);t[key]=value;
  }
  assert.deepEqual(t,plain(old[0]),label+' no shape, material, durability or other property drift');
 }
 assert.deepEqual(out,plain(expected),rebuilt.id+' frozen v1 compiled terrain after exact D reversal');
 return [...targets.keys()];
}
const intermediateDeltas=[];let intermediateRejections=0;
for(const frozen of g.HONRO_SPLIT_V1.stages){
 const rebuilt=authored.stages.find(s=>s.id===frozen.id),a=g.HonroMaps.compile(rebuilt,authored),b=g.HonroMaps.compile(frozen,legacyProject),snapshot=JSON.stringify({rebuilt,a,b});
 const targets=beforeIntermediateOpenStructures(rebuilt,a.terrain,b.terrain);intermediateDeltas.push({stage:rebuilt.metadata.stageId,colliders:targets});
 assert.equal(JSON.stringify({rebuilt,a,b}),snapshot,'Intermediate/frozen source and compiled input stay unchanged');
 assert.deepEqual(plain(a.materials),plain(b.materials),`${frozen.id} frozen v1 compiled materials`);
 for(const key of ['units','markers','design'])assert.deepEqual(plain(rebuilt[key]),plain(frozen[key]),`${frozen.id} frozen v1 authored ${key}`);
 if(targets.length){
  const changed=ts=>ts.find(t=>t.id===targets[0]),unrelated=ts=>ts.find(t=>!targets.includes(t.id));
  for(const mutate of [ts=>changed(ts).vertices[0].x++,ts=>changed(ts).mat='unreviewed',ts=>changed(ts).hp++,ts=>changed(ts).oneWay=false,ts=>{const t=unrelated(ts);t.oneWay=!t.oneWay;},ts=>ts.push(plain(changed(ts)))]){
   const q=plain(a.terrain);mutate(q);assert.throws(()=>beforeIntermediateOpenStructures(rebuilt,q,b.terrain),'Intermediate comparison rejects unrelated or malformed D changes');intermediateRejections++;
  }
 }
}
assert.deepEqual(intermediateDeltas.map(r=>[r.stage,r.colliders.length]),[[25,0],[26,4],[27,5],[28,0]],'Only the nine reviewed intermediate colliders receive a D reversal');
const after=JSON.parse(JSON.stringify(applyHiddenWaterworks(g,authored)));
assert.deepEqual(after.stages.slice(0,20),before.stages.slice(0,20),'Act 1/2 data and the approved enemy roster are immutable during Act 3 art regeneration');
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),rows=[];
for(const s of after.stages){
 const old=before.stages.find(q=>q.id===s.id);assert(old,`Existing stage ${s.id}`);
 const a=g.HonroMaps.compile(s,after),b=g.HonroMaps.compile(old,before);
 for(const key of ['terrain','materials'])assert.deepEqual(a[key],b[key],`${s.id} compiled ${key}`);
 for(const key of ['units','markers','design'])assert.deepEqual(s[key],old[key],`${s.id} authored ${key}`);
 rows.push({id:s.id,collisionSha256:digest(a.terrain),materialsSha256:digest(a.materials),contractsUnchanged:true});
}
await mkdir('_local/reports/act3-final-art',{recursive:true});
await writeFile('_local/reports/act3-final-art/regeneration-contracts.json',JSON.stringify({passed:true,legacyStagesExact:g.HONRO_SPLIT_V1.stages.map(s=>s.id),intermediateDeltas,intermediateRejections,stageCount:rows.length,firstTwentyExact:true,rows,limits:['Authoring/compiled geometry evidence; not normal combat, browser or completion evidence']},null,2)+'\n');
console.log('PASS Act 3 art regeneration: frozen v1 exact; first20 preserved; composed v2 pipeline matches all30 physical/mission contracts');
