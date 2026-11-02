/** Production App/save migration; prior clearance and DOM are test doubles,
 * not browser input or continuous campaign evidence. */
import assert from 'node:assert/strict';
import {appHarness,plain,KEY} from './app-regression-helpers.mjs';
const h=await appHarness({productionStory:true}),{g}=h;
const p=h.profileThrough(18);p.seen['act2:first-spirit-encounter']=true;
let app=h.load(p);app.launch(19);h.finish(app);
const E=g.HonroEquipment,C=g.HONRO_CORE;
function roundtrip(route){
 const b=app.engine.b;
 if(route)b.honroState.act2.done.route=true; // Explicit later-role fixture, not route completion evidence.
 g.HonroStage19Farewell.prepare(b);
 const actors=b.units.filter(u=>u.honroFarewellNPC);
 assert.deepEqual(plain(actors.map(u=>u.cls)).sort(),(route?['archer','knight','mage']:['archer','knight']).sort());
 assert(actors.every(u=>u.equipmentIds?.length));
 const before=plain(b),equipment=plain(app.profile.equipment);
 app.stopBattle();const raw=h.storage.get(KEY);
 assert.equal(JSON.parse(raw).honroBattle.honroStage,19);
 app=h.reload();assert.equal(app.profileStore.locked,false,JSON.stringify(app.profileStore.state));
 assert.deepEqual(plain(app.profile.honroBattle),before,'exact snapshot survives persisted compact save');
 assert.deepEqual(plain(app.profile.equipment),equipment,'ownership and equipped slots remain intact');
 app.continue();assert.equal(app.engine.b.honroStage,19);
 for(const u of app.engine.b.units.filter(u=>u.honroFarewellNPC)){
  assert.equal(C.equipmentActor(u),false,'stored farewell gear does not enable combat effects');
  assert.deepEqual(plain(u.equipmentIds),before.units.find(v=>v.id===u.id).equipmentIds);
 }
 return plain(app.profile);
}
const first=roundtrip(false),later=roundtrip(true);
let rejected=0;
for(const mutate of [
 (p,b,u)=>{b.honroStage=18;},(p,b,u)=>{b.mode='practice';},(p,b,u)=>{b.honroCustom=true;},
 (p,b,u)=>{b.honroMapOrigin='workshop';},(p,b,u)=>{u.id='stranger';},
 (p,b,u)=>{u.honroFarewellNPC=false;},(p,b,u)=>{u.honroCivilian=false;},
 (p,b,u)=>{u.side=1;},(p,b,u)=>{u.summoned=true;},(p,b,u)=>{u.enthrall=true;},
 (p,b,u)=>{u.honroAlly=true;},(p,b,u)=>{b.heroes.archer.equipmentIds=[];},
 (p,b,u)=>{p.equipment.ownedItemIds=[];},
 (p,b,u)=>{const mage=b.units.find(v=>v.cls==='mage');mage.side=2;mage.honroFarewellNPC=true;mage.honroCivilian=true;},
 (p,b,u)=>{b.units.push(plain(u));},
]){
 const profile=plain(first),b=profile.honroBattle,u=b.units.find(v=>v.id==='p-archer');mutate(profile,b,u);
 assert.throws(()=>E.migrate(profile),'invalid NPC/provenance snapshot rejected');rejected++;
}
assert(later.honroBattle.units.find(u=>u.id==='p-mage').honroFarewellNPC);
console.log(`PASS Stage19 equipped farewell entry/route stored save-reload-continue; ${rejected} invalid snapshot cases; combat eligibility unchanged`);
