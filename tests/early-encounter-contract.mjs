import assert from 'node:assert/strict';import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const g=await runtime({legacyMaps:false,productionStory:true}),P=g.HonroEarlyEncounterPlacement;
const authored=g.HONRO_PROJECT,twice=P.author(authored);assert.equal(JSON.stringify(authored),JSON.stringify(twice),'idempotent fresh author');
const baseline=structuredClone(authored);
const originals={13:{'a2-enemy-21':[5015.95,2850]},29:{'a3-29-letter-store-guard-2':[3432,2220],'a3-29-letter-store-guard-3':[3600,2220]}};
for(const [id,positions]of Object.entries(originals)){const s=baseline.stages.find(s=>s.metadata.stageId==id);for(const [uid,[x,y]]of Object.entries(positions))Object.assign(s.units.find(u=>u.id===uid),{x,y});}
assert.equal(JSON.stringify(P.author(baseline)),JSON.stringify(authored),'only three original coordinates change; all other source fields survive');
const report=[];
for(const id of [13,29]){
 const {b,e}=battlefield(g,id),rows=P.placements[id];
 for(const row of rows){const u=b.units.find(u=>u.id===row.id),s=authored.stages.find(s=>s.metadata.stageId===id),p=P.point(s,row);
  assert(Math.abs(u.x-p.x)<.01&&Math.abs(u.y-p.y)<.01,'sanitize relocated '+row.id);
  assert.equal(e.contactSurface(u.x,u.y-8,u.y+10)?.t.id,row.support);
  assert(g.HONRO_CORE.validTerrainContactPose(b.terrain,u),'invalid contact '+row.id);
  assert(!b.units.some(v=>v!==u&&v.side===1&&!g.HONRO_CORE.flyingEnemy(v)&&Math.abs(v.x-u.x)<v.r+u.r+18&&Math.abs(v.y-u.y)<Math.min(v.h,u.h)),'initial body overlap '+row.id);
 }
 const initial=new Map(b.units.map(u=>[u.id,{x:u.x,y:u.y,hp:u.hp}]));
 for(let i=0;i<Math.ceil(8/g.HONRO_CORE.STEP);i++)e.tick(g.HONRO_CORE.STEP);
 const settling=rows.map(row=>{const u=b.units.find(u=>u.id===row.id),before=initial.get(row.id);assert.equal(u.hp,before.hp);assert(!u.dead);assert(Math.abs(u.x-before.x)<2&&Math.abs(u.y-before.y)<2,'initial settling drift');return {id:u.id,x:u.x,y:u.y,hp:u.hp,support:e.contactSurface(u.x,u.y-8,u.y+10)?.t.id};});
 report.push({stage:id,enemyCount:b.units.filter(u=>u.side===1).length,settling});
}
await mkdir('_local/reports/early-encounters',{recursive:true});await writeFile('_local/reports/early-encounters/contract.json',JSON.stringify(report,null,2));console.log(report);
