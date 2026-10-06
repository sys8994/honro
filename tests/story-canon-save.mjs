// Real App export/import/Continue and localStorage, with DOM/Canvas doubles.
// Old dialogue payloads are fixtures from the pre-v0.1 deployed tree. This is
// not a normal-combat playthrough or a browser-rendering proof.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain,report,KEY} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,load,reload,profileThrough,click,finish}=h;
const before=JSON.parse(await readFile('tests/fixtures/story-canon-v01-baseline.json','utf8')),checks=[];
let app;async function check(name,fn){await fn();checks.push(name);console.log('PASS',name);}
for(const legacy of before.legacy){
 await check(`${legacy.id}: old entry payload, page, geometry and quest progress survive export/import/Continue`,async()=>{
  app=load(profileThrough(legacy.id-1));app.launch(legacy.id);finish(app);
  const b=app.engine.b;b.round=7;b.items.heal=0;b.honroState.act2.done['saved-story-probe']=true;
  g.HonroStory.start(app,legacy.story,{title:app.stage.name,after:'entry',index:1});
  const dialogue=plain(app.dialogue),geometry=plain(b.terrain),units=plain(b.units),state=plain(b.honroState),heroes=plain(app.profile.heroes);
  app.export();const exported=await h.exported();assert.deepEqual(exported.honroBattle.honroStory,dialogue);
  await h.import(exported);click('continue');
  assert.deepEqual(plain(app.dialogue),dialogue);assert.deepEqual(plain(app.engine.b.terrain),geometry);assert.deepEqual(plain(app.engine.b.units),units);
  assert.deepEqual(plain(app.engine.b.honroState),state);assert.deepEqual(plain(app.profile.heroes),heroes);assert.equal(app.engine.b.round,7);assert.equal(app.engine.b.items.heal,0);
  assert.deepEqual(JSON.parse(h.storage.get(KEY)).honroBattle.honroStory,dialogue);
  app=reload();click('continue');assert.deepEqual(plain(app.dialogue),dialogue);
 });
 const key={12:'sign',16:'record',19:'old-soul',20:'escort'}[legacy.id];
 await check(`${legacy.id}/${key}: previously queued event retains old lines without replaying the revised discovery`,async()=>{
  app=load(profileThrough(legacy.id-1));app.launch(legacy.id);finish(app);
  const lines=g.HonroAct2Content.scene(`act2-${legacy.id}-${key}`,app.stage.name,legacy.beats[key]);
  g.HonroStory.queue(app,lines);const queued=plain(app.engine.b.honroState.storyQueue);assert(queued.length);
  app.export();await h.import(await h.exported());click('continue');assert.deepEqual(plain(app.engine.b.honroState.storyQueue),queued);
  // Only the existing actor-boundary condition is satisfied; no objective or
  // combat completion is manufactured by this queue check.
  app.actorBoundary=app.engine.b.active;app.engine.b.honroState.actorTurnSerial=(queued[0][2].afterAction||0);
  assert(g.HonroStory.drain(app));assert.deepEqual(plain(app.dialogue.lines),queued);
  assert.equal(app.engine.b.honroState.storyQueue.length,0);finish(app);assert.equal(g.HonroStory.drain(app),false);
 });
}
for(const id of [12,13])for(const index of [0,1,2])await check(`rest ${id}/${index}: existing scene/index resumes same page with current prose and remains required`,async()=>{
 app=load(profileThrough(id-1));click('rest');if(app.dialogue?.restKind==='map')g.HonroStory.finish(app);
 assert.equal(app.dialogue.id,`rest-interlude-v1-${id}`);while(app.dialogue.index<index)g.HonroStory.next(app);
 const saved=plain(app.profile.honroJourney.story);assert.equal(saved.index,index);assert.equal(saved.kind,'arrival');
 app.export();await h.import(await h.exported());click('rest');assert.equal(app.dialogue.id,saved.id);assert.equal(app.dialogue.index,index);
 assert.deepEqual(plain(app.dialogue.lines),plain(g.HonroJourneyContent.interlude(id)));
 click('rest-talk',{class:'mage'});assert.equal(app.dialogue.restKind,'arrival');assert.equal(app.dialogue.index,index);
 app=reload();click('rest');assert.equal(app.dialogue.index,index);finish(app);assert(app.profile.seen[saved.id]);
});
for(const [id,cls] of [[16,'knight'],[17,'mage'],[20,'knight']])await check(`rest ${id}/${cls}: optional revised reflection keeps its own saved ID and never marks a discovery done`,async()=>{
 app=load(profileThrough(id-1));click('rest');finish(app);click('rest-talk',{class:cls});assert.equal(app.dialogue.restKind,'optional');
 const idBefore=app.dialogue.id,cleared=plain(app.profile.cleared);app.export();await h.import(await h.exported());click('rest');
 assert.equal(app.dialogue.id,idBefore);assert.equal(app.dialogue.restKind,'optional');assert.deepEqual(plain(app.profile.cleared),cleared);
 assert.deepEqual(plain(app.dialogue.lines),plain(g.HonroJourneyContent.optional(app.profile,id,cls)));
});
await report('story-canon-save',checks,{sourceBaseline:before.sourceCommit,restCompatibility:'Rest has always saved ID/index rather than text. Same page and separation are preserved; current prose is shown.'});
console.log(`PASS ${checks.length} production App save cases; DOM/storage doubles only`);
