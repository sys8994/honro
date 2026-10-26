/** Current Stage5 gate regression. Explicit poses/collision fixtures isolate
 * installation and travel; these checks are not a normal campaign completion. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
const plain=x=>JSON.parse(JSON.stringify(x));
function arena(){
 const q=battlefield(g,5),{b,e}=q,u=e.unit('p-mage');
 b.units=b.units.filter(v=>v.side===0||v.honroObjectiveTarget);b.active=u.id;
 Object.assign(u,{x:2400,y:2050,ranks:{...u.ranks,M09:1},loadout:['M09'],focus:200,maxFocus:200});
 Object.assign(e.unit('p-archer'),{x:2200,y:C.topAt(b.terrain.find(t=>t.id==='stage5-west-shoulder'),2200)});
 return {...q,u};
}
function install(q,supportId,x,y){
 const {b,e,u}=q,t=b.terrain.find(t=>t.id===supportId);
 assert(e.fire('M09',45,.3),'real cast creates the installing projectile');
 const p=b.projectiles[0];e.impact(p,{x,y:y??C.topAt(t,x),n:{x:0,y:-1},terrain:t,t:0});
 assert.equal(b.stakes.length,2,'first installation creates the pair');
 // Installation consumed the caster action. A different living companion
 // can use the pair without learning M09 or spending focus/movement.
 const actor=e.unit('p-archer');Object.assign(actor,{x:b.stakes[0].x,y:b.stakes[0].y,focus:0,moveLeft:0});
 Object.assign(u,{x:2200,y:C.topAt(b.terrain.find(t=>t.id==='stage5-west-shoulder'),2200),acted:true});
 b.active=actor.id;b.phase='aim';b.side=0;return actor;
}
for(const [support,x] of [['stage5-west-shoulder',2590],['stage5-timber-low',2310],['stage5-timber-mid',2680],['stage5-timber-high',3150],['valley-floor',3460]]){
 const q=arena(),{b,e}=q,u=install(q,support,x),before=JSON.stringify(b),p=e.gateResolution();
 assert(p.ok,JSON.stringify({support,x,reason:p.reason}));assert.equal(JSON.stringify(b),before,'planning cannot mutate the saved battle');
 assert.equal(p.spot.support.id,support);assert(p.spot.distance<=C.GATE_SEARCH_RADIUS);
 assert(e.useGate());assert.equal(u.x,p.spot.x);assert.equal(u.y,p.spot.y);assert(e.grounded(u));assert(C.validTerrainContactPose(b.terrain,u));
 assert.equal(u.focus,0);assert.equal(u.moveLeft,0);assert.equal(u.acted,false);assert(q.u.acted);
 const saved=plain(b),loaded=new C.Engine(saved),snapshot=JSON.stringify(saved);assert.deepEqual(plain(b),plain(saved));
 assert(!loaded.gateResolution().ok);assert.equal(JSON.stringify(saved),snapshot,'same-turn readiness stays read-only after restore');
 saved.round++;
 if(loaded.gateCandidate()){assert(loaded.useGate(),'next turn returns through the same installed pair');assert(loaded.grounded(loaded.active));}
 else assert(p.spot.distance>C.GATE_ACTIVATION_RADIUS,'a distant safe fallback still requires approaching the stake before returning');
 rows.push({kind:'installed pair / other actor / zero focus and movement / restore',support,x,spot:{x:p.spot.x,y:p.spot.y,distance:p.spot.distance}});
}
// One complete real projectile path, including its radius-adjusted collision
// point and the nearest safe slope fallback. No forced impact for this case.
{
 const q=arena(),{b,e,u}=q;assert(e.fire('M09',45,.3));let frames=0;
 while(b.projectiles.length&&frames++<2400)for(const p of [...b.projectiles])e.stepProjectile(p,C.STEP);
 assert(frames<2400);assert.equal(b.stakes.length,2);assert(b.stakes[1].x>2380);
 const archer=e.unit('p-archer');Object.assign(archer,{x:b.stakes[0].x,y:b.stakes[0].y});
 Object.assign(u,{x:2200,y:C.topAt(b.terrain.find(t=>t.id==='stage5-west-shoulder'),2200),acted:true});b.active=archer.id;b.phase='aim';
 const p=e.gateResolution();assert(p.ok,p.reason);assert(e.useGate());assert(e.grounded(archer));
 rows.push({kind:'real unmodified projectile integration',frames,stakes:plain(b.stakes),spot:{x:p.spot.x,y:p.spot.y}});
}
for(const [support,x,y,reason] of [['waterfall-cliff',5350,1332,'깊은 소'],['waterfall-cliff',5700,740,'깊은 소'],['valley-floor',4400,undefined,'위험한 물']]){
 const q=arena(),u=install(q,support,x,y),before=plain(q.b),p=q.e.gateResolution();assert(!p.ok);assert(p.reason.includes(reason),p.reason);
 assert.deepEqual(plain(q.b),before);assert(!q.e.useGate());before.events=[...before.events,p.reason].slice(-30);assert.deepEqual(plain(q.b),before,'denial changes only the visible event');
 rows.push({kind:'legitimate unsafe destination',support,x,reason:p.reason});
}
for(const custom of [false,true]){
 const q=arena();install(q,'stage5-timber-high',3150);delete q.b.honroStage5DynamicRevision;q.b.honroCustom=custom;
 const p=q.e.gateResolution();assert.equal(p.ok,custom,'legacy snapshot restriction and custom-map exemption remain');rows.push({kind:'legacy/custom isolation',custom,ok:p.ok});
}
{
 const q=arena(),u=install(q,'stage5-timber-high',3150);
 for(const state of ['acted','airborne','retreat','expired']){
  const saved=plain(q.b),b=plain(saved),e=new C.Engine(b),a=e.active;
  if(state==='acted')a.acted=true;if(state==='airborne'){a.y-=100;a.airborne=true;}if(state==='retreat')a.retreat=true;if(state==='expired')b.stakes[1].expires=b.round;
  assert(!e.gateResolution().ok,state);rows.push({kind:'actor/turn/lifetime condition',state});
 }
}
await mkdir('_local/reports/stage5-gate-arrival',{recursive:true});
await writeFile('_local/reports/stage5-gate-arrival/runtime.json',JSON.stringify({scope:'Isolated production Stage5 engine, real cast and one complete projectile path; no normal campaign completion claim.',rows},null,2)+'\n');
console.log('PASS Stage5 gate installation, current supports, other actor, slope fallback, hazards, turn/resource and save boundaries:',rows.length);
