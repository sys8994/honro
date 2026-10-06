// Production App navigation/save paths with DOM, Canvas and storage doubles.
// Terminal battle states below are explicit fixtures, not normal-play victories.
import assert from 'node:assert/strict';
import {appHarness,plain,report,KEY} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,load,reload,profileThrough,click,finish}=h,checks=[];
let app;
async function check(name,fn){await fn();checks.push(name);console.log('PASS',name);}
function suspended(id){
 app=load(profileThrough(id-1));app.launch(id);finish(app);
 const b=app.engine.b;b.round=7;b.items.heal=0;b.units[0].hp-=17;b.units[0].focus-=9;
 click('rest');finish(app);return plain(app.profile.honroBattle);
}
for(const id of [3,6,7]){
 await check(`stage ${id}: repeated practice retry and return preserve the suspended campaign`,async()=>{
  const before=suspended(id),heroes=plain(app.profile.heroes),cleared=plain(app.profile.cleared);
  click('training');assert(app.training);click('close');
  const firstSession=app.engine.b.session;
  assert.deepEqual(JSON.parse(h.storage.get(KEY)).honroBattle,before,'Practice entry keeps the persisted campaign');
  for(let i=0;i<3;i++){
   click('pause');click('retry');assert(app.training);assert.equal(app.stage.id,1);
   assert.notEqual(app.profile.honroBattle,null,'Practice retry deleted the suspended campaign');
   assert.deepEqual(plain(app.profile.honroBattle),before,'Practice retry must not delete the suspended campaign');
   assert.deepEqual(plain(app.profile.heroes),heroes);assert.deepEqual(plain(app.profile.cleared),cleared);
  }
  assert.notEqual(app.engine.b.session,firstSession,'Practice itself still restarts');
  app.export();assert.deepEqual((await h.exported()).honroBattle,before);
  assert.deepEqual(JSON.parse(h.storage.get(KEY)).honroBattle,before,'Practice retry also leaves localStorage intact');
  // Returning to rest writes the live profile. Before the fix this persisted
  // the null snapshot, whereas an immediate page reload alone could recover it.
  click('rest');finish(app);
  assert.deepEqual(JSON.parse(h.storage.get(KEY)).honroBattle,before,'Returning to rest must not persist a deleted snapshot');
  app=reload();click('continue');
  assert(!app.training);assert.equal(app.stage.id,id);assert.deepEqual(plain(app.engine.b.units),before.units);
  assert.equal(app.engine.b.round,7);assert.equal(app.engine.b.items.heal,0);
 });
 await check(`stage ${id}: practice retry then immediate reload and import keep the campaign`,async()=>{
  const before=suspended(id);click('training');click('close');click('retry');
  app.export();const exported=await h.exported();assert.deepEqual(exported.honroBattle,before);
  app=reload();assert.deepEqual(plain(app.profile.honroBattle),before);
  await h.import(exported);click('continue');finish(app);
  assert.equal(app.stage.id,id);assert.deepEqual(plain(app.engine.b.units),before.units);
  assert.deepEqual(plain(app.engine.b.terrain),before.terrain);assert.deepEqual(plain(app.engine.b.honroMarkers),before.honroMarkers);
 });
 await check(`stage ${id}: actual campaign retry still replaces only the current battle`,()=>{
  const before=suspended(id);click('continue');
  const xp=app.profile.heroes.archer.xp;click('retry');finish(app);
  assert(!app.training);assert.equal(app.stage.id,id);assert.equal(app.engine.b.round,1);
  assert.notEqual(app.engine.b.session,before.session);assert.equal(app.profile.honroBattle.session,app.engine.b.session);
  assert.equal(app.profile.heroes.archer.xp,xp);assert(!app.engine.b.honroJourneyReplay);
  if(id===7)assert(app.engine.b.terrain.some(t=>t.id===g.HonroStage7Reentry.id));
 });
}
for(const origin of ['campaign','unmarked'])await check(`stage 7: App import/Continue preserves ${origin} old-map migration boundaries`,async()=>{
 suspended(7);const saved=plain(app.profile.honroBattle),id=g.HonroStage7Reentry.id;
 saved.terrain=saved.terrain.filter(t=>t.id!==id);if(origin==='unmarked')delete saved.honroMapOrigin;
 const before=plain(saved);app.profile.honroBattle=saved;app.export();await h.import(await h.exported());click('continue');
 const b=app.engine.b;assert.equal(b.terrain.some(t=>t.id===id),origin==='campaign');
 assert.deepEqual(plain(b.terrain.filter(t=>t.id!==id)),before.terrain);
 for(const key of ['units','honroState','honroMarkers','honroMapAnchors','items'])assert.deepEqual(plain(b[key]),before[key]);
 app.export();await h.import(await h.exported());click('continue');
 assert.equal(app.engine.b.terrain.filter(t=>t.id===id).length,origin==='campaign'?1:0);
 assert.deepEqual(plain(app.engine.b.units),before.units);
});
await check('practice retry without a campaign creates no campaign save',()=>{
 app=load(profileThrough(0));click('training');click('close');click('retry');click('rest');finish(app);
 assert.equal(app.profile.honroBattle,null);assert.equal(g.HonroJourneyContent.next(app.profile).stageId,1);
});
await check('18 → 19 resumes an interrupted outcome and a repeated result click cannot replace stage 19',async()=>{
 app=load(profileThrough(17));app.launch(18);finish(app);app.engine.b.phase='won';app.outcome();
 assert.equal(app.dialogue.after,'outcome');g.HonroStory.next(app);
 const index=app.dialogue.index;app.export();await h.import(await h.exported());click('continue');
 assert.equal(app.dialogue.after,'outcome');assert.equal(app.dialogue.index,index);finish(app);
 assert.equal(app.profile.honroJourney.pendingDirect,19);assert(app.profile.cleared[18]);
 const xp=app.profile.heroes.archer.xp;click('result-continue');assert.equal(app.stage.id,19);
 assert.equal(app.screen,'battle');assert(!app.engine.b.honroJourneyReplay);finish(app);
 const session=app.engine.b.session;click('result-continue');assert.equal(app.engine.b.session,session);
 assert.equal(app.profile.heroes.archer.xp,xp);assert.equal(app.profile.honroJourney.pendingDirect,undefined);
});
await check('18 → 19 still skips rest after closing the result and reloading',()=>{
 app=load(profileThrough(17));app.launch(18);finish(app);app.engine.b.phase='won';app.outcome();finish(app);
 click('close');click('title');app=reload();click('rest');assert.equal(app.stage.id,19);
 assert.equal(app.screen,'battle');assert.equal(app.profile.honroJourney.pendingDirect,undefined);
});
await report('campaign-transition-regressions',checks);
console.log('PASS',checks.length,'production App transition cases; no browser or normal-combat claim');
