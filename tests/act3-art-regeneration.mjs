/** Rebuild authoring inputs without mutating the campaign; compare physical and mission contracts. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildProduction} from '../tools/map-forge/act3-production-maps.mjs';
const before=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
const {g,p:authored}=await buildProduction({write:false}),after=JSON.parse(JSON.stringify(authored));
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
await writeFile('_local/reports/act3-final-art/regeneration-contracts.json',JSON.stringify({passed:true,stageCount:rows.length,firstTwentyExact:true,rows,limits:['Authoring/compiled geometry evidence; not normal combat, browser or completion evidence']},null,2)+'\n');
console.log('PASS Act 3 art regeneration: first 20 objects exact; all 30 collision/material/roster/marker/route contracts match');
