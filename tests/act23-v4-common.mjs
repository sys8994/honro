/** Original App/story/profile code, DOM doubles and declared world fixtures. */
import assert from 'node:assert/strict';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{g}=h,V=g.HonroAct23V4;
g.HONRO_ACT23_V4_PHASE_A=true;g.HONRO_PROJECT=V.author(g.HONRO_PROJECT,{enabled:true});
let app=h.load(h.profileThrough(10));app.launch(11);app.turnNotice=null;
const e=app.engine,b=e.b,spirit=b.units.find(u=>u.side===1&&u.honroSpirit),sodan=e.heroesAlive().find(u=>u.cls==='occultist');assert(spirit&&sodan);Object.assign(spirit,{x:sodan.x+220,y:sodan.y,vx:0,vy:0});
assert.equal(app.profile.seen['act2:first-spirit-encounter'],undefined);V.tick(app,.01);const queue=b.honroState.storyQueue;assert(queue.length>=6);assert(V.approvedCommon(queue));assert.equal(app.profile.seen['act2:first-spirit-encounter'],true);
const expected=plain(queue);V.prepare(b,app.profile);assert.deepEqual(plain(b.honroState.storyQueue),expected,'candidate prepare preserves approved pending common rows');assert.equal(g.HonroStory.start(app,[['서술','legacy',{storyId:'old-chapter'}]]),false);assert.equal(g.HonroStory.start(app,queue),true,'approved common source remains playable');
const speech=plain(app.dialogue.lines);assert(speech.every(r=>r[2].storyId==='act2:first-spirit-encounter'));app.stopBattle();app=h.load(plain(app.profile));app.continue();assert.deepEqual(plain(app.dialogue.lines),speech,'approved firstSpirit resumes without chapter prose');h.finish(app);
const before=plain(app.profile.cleared);V.recordOutcome(app,false);assert.equal(app.profile.honroAct23V4History,undefined);V.mem(app.engine.b).sceneDone['fixture-scene']=true;V.recordOutcome(app,true);const receipt=plain(app.profile.honroAct23V4History.stages[11]);V.recordOutcome(app,true);assert.deepEqual(plain(app.profile.honroAct23V4History.stages[11]),receipt);assert.deepEqual(plain(app.profile.cleared),before);assert.equal(app.profile.honroStoryEvents?.['v4.18.death'],undefined);assert.equal(app.profile.honroAct23V4History.stages[18],undefined,'cleared/history alone cannot fabricate keeper death');
app.persist();app=h.load(plain(app.profile));assert.deepEqual(plain(app.profile.honroAct23V4History.stages[11]),receipt,'versioned completion provenance survives profile migration');
console.log('PASS approved firstSpirit queue/play/save/Continue; no old chapter prose; explicit candidate outcome provenance exactly once, preserved clear ledger and no fabricated death.');
