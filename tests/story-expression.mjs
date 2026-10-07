// Presentation regression on production App/Story. Trigger-position, won and
// cooperation-threshold fixtures are explicit; no normal-completion claim.
import assert from 'node:assert/strict';import {readFile}from'node:fs/promises';
import {appHarness,plain,report}from'./app-regression-helpers.mjs';
const h=await appHarness(),{g,load,reload,profileThrough,finish,click}=h,S=g.HonroStoryStaging,checks=[];let now=1000;
const check=(n,f)=>{f();checks.push(n);console.log('PASS',n);};
const speech=lines=>plain(lines.map(l=>l.slice(0,2)));
function fresh(id){const a=load(profileThrough(id-1));a.launch(id);if(id!==3)finish(a);a.turnNotice=null;return a;}
function motion(a){for(let i=0;i<150&&!a.dialogue.staging.complete;i++)g.HonroStory.tick(a,now+=50);assert(a.dialogue.staging.complete);}
function mechanical(a){const b=plain(a.engine.b);delete b.honroStory;delete b.honroStaging;for(const u of b.units)delete u.honroScenePose;delete b.honroState.storyQueue;delete b.honroState.storyBanter;delete b.honroState.banterLine;return b;}
function queue(a,lines){a.actorBoundary=null;const serial=a.engine.b.honroState.actorTurnSerial||0;g.HonroStory.queue(a,lines);assert(!a.dialogue);const q=a.engine.b.honroState.storyQueue;assert.equal(q[0][2].afterAction,serial+1);a.engine.b.honroState.actorTurnSerial=serial+1;a.actorBoundary=a.engine.b.active;assert(g.HonroStory.drain(a));}
function reachCue(a){for(let i=0;i<20&&a.dialogue.staging.waitForIndex!=null;i++)g.HonroStory.next(a);assert(!a.dialogue.staging.complete);}
check('Stage 3 keeps every entry line before its original first Hwigyeom speech and never moves or recruits him',()=>{
 const a=fresh(3),d=a.dialogue,words=speech(d.lines),first=d.lines.findIndex(l=>l[0]==='휘겸');assert.equal(d.staging.waitForIndex,first);assert(first>0);assert.equal(d.index,0);reachCue(a);assert.equal(d.index,first);const before=mechanical(a);motion(a);assert.deepEqual(mechanical(a),before);assert.deepEqual(speech(d.lines),words);assert(!a.profile.recruited.includes('knight'));assert.equal(a.engine.b.units.find(u=>u.id==='npc-hwigyeom').side,2);finish(a);
});
check('Stage 10 decorates the real cooperation event after its existing state change; HP, position and waves stay frozen',()=>{
 const a=fresh(10),b=a.engine.b,boss=a.engine.unit('boss');b.honroState.receivers=2;boss.hp=boss.maxHp*.4;a.actorBoundary=b.active;g.HonroMission.tick(a,0);assert(b.honroState.sodanCoop);assert(a.dialogue?.staging);assert.equal(a.dialogue.staging.id,'act1-cooperation-gesture-v1');assert.deepEqual(speech(a.dialogue.lines),speech(g.HonroStoryContent.cooperation()));assert.equal(a.dialogue.staging.waitForIndex,3);reachCue(a);const before=mechanical(a);motion(a);assert.deepEqual(mechanical(a),before);assert.equal(a.engine.unit('boss').fixed,true);assert.equal(b.honroState.coopHold,0);finish(a);
});
await report('story-expression',checks,{limits:['Synthetic position/threshold/terminal fixtures; not normal-completion proof.','16 is deferred because elder/disciple world-actor identities are not explicit.','No authored speech, map, objective, damage, reinforcement or party-recruitment rule changed.']});
