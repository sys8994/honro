/** Exact D -> C preservation; old A/B/C fixtures remain independent and frozen. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {beforeOpenStructures,beforeOpenAct1Structures,beforeOpenStructureLibrary,openStructureHistoryDelta as f,openStructureHash as hash} from './open-structure-history-helpers.mjs';
const p=JSON.parse(readFileSync('shared/data/campaign.json','utf8')),manifest=JSON.parse(readFileSync('shared/data/open-structures.json','utf8')),snapshot=JSON.stringify(p);
const identity=({stage,kind,id,elementId,before})=>({stage,kind,id,...(elementId?{elementId}:{}),before});
assert.equal(manifest.sourceCommit,f.sourceCommit,'D is anchored to the independently recorded C source');
assert.deepEqual(manifest.rows.map(identity),f.rows.map(identity),'Production manifest cannot expand the historical exception');
assert.equal(f.rows.length,74);assert.equal(f.rows.filter(r=>r.kind==='asset').length,68);
assert.equal(new Set(f.rows.map(r=>r.kind+'/'+r.stage+'/'+r.id)).size,f.rows.length,'Unique reviewed D targets');
assert.equal(hash(p),f.afterProjectSha256,'Entire reviewed D source, including all untouched fields');
assert.equal(hash(p.library),f.afterLibrarySha256,'Entire reviewed D Library/order');
const before=beforeOpenStructures(p);
assert.equal(hash(before),f.beforeProjectSha256,'All thirty stages, settings and Library recover immutable C');
assert.equal(hash(before.library),f.beforeLibrarySha256,'Complete immutable C Library/order');
assert.deepEqual(beforeOpenStructureLibrary(p.library),before.library,'Library-only boundary matches full projection');
assert.equal(JSON.stringify(p),snapshot,'D projection is read-only');
assert.throws(()=>beforeOpenStructures(before),/Exact approved open structure/,'Cannot silently apply D reversal to C again');
assert.throws(()=>beforeOpenStructureLibrary(before.library),/Exact approved open structure/,'Cannot silently reverse C Library twice');
const terrainStages=new Set(f.rows.filter(r=>r.kind==='terrain').map(r=>r.stage));
for(let i=0;i<30;i++)if(!terrainStages.has(i+1))assert.deepEqual(before.stages[i],p.stages[i],'No stage record outside the six named terrain flags is changed');
const act1=beforeOpenAct1Structures(p);
for(let i=0;i<30;i++)assert.deepEqual(act1.stages[i],[4,6].includes(i)?before.stages[i]:p.stages[i],'Act1 entry point changes only the exact stage5/7 flags');
assert.deepEqual(act1.library,p.library,'Act1 history entry point leaves the current Library alone');
assert.throws(()=>beforeOpenAct1Structures(act1),/Exact approved open structure/,'Act1 D reversal cannot run twice');
// Lean mutation inputs retain the complete identities and affected properties;
// whole-source SHA checks above cover every unrelated coordinate and art value.
const lean={stages:p.stages.map(s=>({id:s.id,metadata:s.metadata,elements:s.elements.map(({id,assetId})=>({id,assetId})),terrains:s.terrains.map(({id,oneWay,properties})=>({id,oneWay,properties}))})),library:p.library.map(({id,oneWay})=>({id,oneWay}))};
const locate=(q,row)=>{const stage=q.stages.find(s=>s.metadata.stageId===row.stage),items=row.kind==='asset'?q.library:stage.terrains;return {stage,items,target:items.find(t=>t.id===row.id)};};
let rejected=0;
for(const row of f.rows){
 for(const mutate of [({target})=>target.oneWay=false,({target})=>delete target.oneWay,({items,target})=>items.splice(items.indexOf(target),1),({items,target})=>items.push(structuredClone(target))]){
  const q=structuredClone(lean);mutate(locate(q,row));assert.throws(()=>beforeOpenStructures(q),/Exact approved open structure/,'Changed/missing/duplicate D target '+row.id);rejected++;
 }
 if(row.kind==='asset'){
  const q=structuredClone(lean),{stage}=locate(q,row);stage.elements.find(e=>e.id===row.elementId).assetId+='-drift';assert.throws(()=>beforeOpenStructures(q),/asset binding/);rejected++;
 }else for(const key of Object.keys(row.before.properties)){
  const q=structuredClone(lean),properties=locate(q,row).target.properties,value=row.after.properties?.[key];properties[key]=Object.hasOwn(row.after.properties||{},key)?typeof value==='boolean'?!value:typeof value==='number'?value+1:'unapproved':true;assert.throws(()=>beforeOpenStructures(q),/property keys|property value|property presence/);rejected++;
 }
}
for(const mutate of [q=>q.stages[0].units[0].x++,q=>q.stages[27].terrains[0].points[0].x++,q=>q.library[0].name+=' unrelated',q=>q.library.find(a=>a.id===f.rows[0].id).name+=' unrelated',q=>q.library.reverse()]){
 const q=structuredClone(p);mutate(q);const prior=beforeOpenStructures(q);assert.notEqual(hash(prior),f.beforeProjectSha256,'Unrelated changes remain visible to C hashes');
}
console.log(`PASS D -> immutable C: 74 exact IDs, full project/Library hashes and order, ${rejected} flag/presence/binding/duplicate rejection controls, scoped Act1 reversal, purity and unrelated-drift preservation`);
