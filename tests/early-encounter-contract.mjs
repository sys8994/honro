import assert from 'node:assert/strict';import vm from 'node:vm';import {battlefield} from '../game/tests/helpers.mjs';import {runtimeEntries} from '../shared/build.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const entries=await runtimeEntries({vector:false,render:false,app:false,productionStory:true});
const make=baseline=>{const g=vm.createContext({console,performance,structuredClone});for(const e of entries)vm.runInContext(baseline&&e.name==='shared/runtime/early-encounter-placement.js'?'globalThis.HonroEarlyEncounterPlacement={author:p=>p};':e.code,g);return g;};
const g=make(false),old=make(true),P=g.HonroEarlyEncounterPlacement,authored=g.HONRO_PROJECT;
assert.equal(JSON.stringify(authored),JSON.stringify(P.author(authored)),'idempotent fresh author');
const restored=structuredClone(authored);
for(const stage of restored.stages){const source=old.HONRO_PROJECT.stages.find(s=>s.id===stage.id),rows=P.placements[stage.metadata.stageId]||[];for(const row of rows){if(row.clone){stage.design=structuredClone(source.design);continue;}const u=stage.units.find(u=>u.id===row.id),v=source.units.find(u=>u.id===row.id);u.x=v.x;u.y=v.y;}}
assert.equal(JSON.stringify(restored),JSON.stringify(old.HONRO_PROJECT),'only declared positions and explicit clone positions change');
const report=[],clean=u=>{const v=structuredClone(u);for(const k of ['x','y','spawnX','spawnY'])delete v[k];return JSON.stringify(v);};
for(const id of [9,13,29]){
 const {b,e}=battlefield(g,id),prior=battlefield(old,id).b,rows=P.placements[id];
 assert.equal(JSON.stringify(b.units.map(u=>u.id)),JSON.stringify(prior.units.map(u=>u.id)));
 for(const u of b.units)assert.equal(clean(u),clean(prior.units.find(v=>v.id===u.id)),'non-position runtime change '+id+'/'+u.id);
 for(const row of rows){const u=b.units.find(u=>u.id===row.id),s=authored.stages.find(s=>s.metadata.stageId===id),p=P.point(s,row);
  assert(Math.abs(u.x-p.x)<.01&&Math.abs(u.y-p.y)<.01,'sanitize relocated '+row.id+' '+JSON.stringify({actual:{x:u.x,y:u.y},expected:p}));
  assert.equal(e.contactSurface(u.x,u.y-8,u.y+10)?.t.id,row.support);
  assert(g.HONRO_CORE.validTerrainContactPose(b.terrain,u),'invalid contact '+row.id);
  assert(!b.units.some(v=>v!==u&&v.side===1&&!g.HONRO_CORE.flyingEnemy(v)&&Math.abs(v.x-u.x)<v.r+u.r+18&&Math.abs(v.y-u.y)<Math.min(v.h,u.h)),'initial body overlap '+row.id);
 }
 const initial=new Map(b.units.map(u=>[u.id,{x:u.x,y:u.y,hp:u.hp}]));
 for(let i=0;i<Math.ceil(8/g.HONRO_CORE.STEP);i++)e.tick(g.HONRO_CORE.STEP);
 const settling=rows.map(row=>{const u=b.units.find(u=>u.id===row.id),before=initial.get(row.id);assert.equal(u.hp,before.hp);assert(!u.dead);assert(Math.abs(u.x-before.x)<2&&Math.abs(u.y-before.y)<2,'initial settling drift');return {id:u.id,x:u.x,y:u.y,hp:u.hp,support:e.contactSurface(u.x,u.y-8,u.y+10)?.t.id};});
 const positions=b.units.filter(u=>{const v=prior.units.find(v=>v.id===u.id);return u.x!==v.x||u.y!==v.y;}).map(u=>({id:u.id,before:{x:prior.units.find(v=>v.id===u.id).x,y:prior.units.find(v=>v.id===u.id).y},after:{x:u.x,y:u.y}}));
 report.push({stage:id,enemyCount:b.units.filter(u=>u.side===1).length,positions,settling});
}
await mkdir('_local/reports/early-encounters',{recursive:true});await writeFile('_local/reports/early-encounters/contract.json',JSON.stringify(report,null,2));console.log(report);
