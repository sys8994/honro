import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {applyStage11VectorFinish} from '../tools/environment/stage11-vector-finish.mjs';
const base='a091c6bd5e64eff748f5028fb6d0080faea3da87',before=JSON.parse(execFileSync('git',['show',base+':shared/data/campaign.json'],{maxBuffer:40*1024*1024})),after=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const changedAssets=new Set(['stage11:ravine-refuge-bundle','stage11:ravine-rear-cliff-contact']);
assert.equal(after.library.length,before.library.length,'Reuse existing asset identities');
for(let i=0;i<before.library.length;i++){const a=after.library[i],b=before.library[i];assert.equal(a.id,b.id);if(changedAssets.has(a.id)){assert.deepEqual(a.collision,b.collision);assert.deepEqual(a.collision,[]);assert.equal(a.interactionType,b.interactionType);}else assert.deepEqual(a,b,'Shared asset '+a.id);}
const gameplay=s=>{const c=structuredClone(s);delete c.design.ravineArt;c.elements=c.elements.filter(e=>e.id!=='s11-art-refuge-bundle');return c;};
for(let i=0;i<before.stages.length;i++)assert.deepEqual(i===10?gameplay(after.stages[i]):after.stages[i],i===10?gameplay(before.stages[i]):before.stages[i],'Protected stage '+(i+1));
const a=after.stages[10],b=before.stages[10],ea=a.elements.find(e=>e.id==='s11-art-refuge-bundle'),eb=b.elements.find(e=>e.id===ea.id);
for(const key of new Set([...Object.keys(ea),...Object.keys(eb)]))if(!['scale','layer'].includes(key))assert.deepEqual(ea[key],eb[key],key);
for(const key of Object.keys(after))if(!['library','stages'].includes(key))assert.deepEqual(after[key],before[key]);
assert.equal(a.design.ravineArt.materialRevision,3);assert.equal(a.design.ravineArt.materials.length,9);
for(const m of a.design.ravineArt.materials){assert(a.terrains.some(t=>t.id===m.terrainId));assert(m.faces.length<130);for(const f of m.faces){if(f.d)assert(!/NaN|Infinity/.test(f.d));else{assert(f.points.length>=3);assert(f.points.flat().every(Number.isFinite));}assert(/^#[\da-f]{6}([\da-f]{2})?$/i.test(f.fill));}}
assert.deepEqual(JSON.parse(JSON.stringify(applyStage11VectorFinish(structuredClone(after)))),after,'Idempotent direct art author');
assert.deepEqual(JSON.parse(JSON.stringify(applyStage11VectorFinish(structuredClone(before)))),after,'Reproducible delta from latest master');
const report={pass:true,base,stage11GameplayBefore:hash(gameplay(b)),stage11GameplayAfter:hash(gameplay(a)),terrainBefore:hash(b.terrains),terrainAfter:hash(a.terrains),unitsBefore:hash(b.units),unitsAfter:hash(a.units),markersBefore:hash(b.markers),markersAfter:hash(a.markers),eventsBefore:hash(b.events),eventsAfter:hash(a.events),other29Unchanged:true,sharedAssetsUnchanged:true,changedVisualAssets:[...changedAssets],reproducible:true,idempotent:true,materials:a.design.ravineArt.materials.map(m=>({terrainId:m.terrainId,faces:m.faces.length}))};
await mkdir('_local/reports/stage11-vector-art',{recursive:true});await writeFile('_local/reports/stage11-vector-art/preservation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
