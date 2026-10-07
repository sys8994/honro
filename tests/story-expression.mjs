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
check('Three existing send-success events keep their full original speeches, event IDs and mechanics',()=>{
 for(const n of [1,2,3]){const a=fresh(19),original=g.HonroAct2Content.scene(`act2-19-send-${n}`,a.stage.name,a.stage.beats[`send-${n}`]);queue(a,original);assert.equal(a.dialogue.staging.id,`act2-send-${n}-gesture-v1`);assert.deepEqual(speech(a.dialogue.lines),speech(original));assert(a.dialogue.lines.every(l=>l[2].storyId===original[0][2].storyId));const before=mechanical(a);motion(a);assert.deepEqual(mechanical(a),before);finish(a);assert.equal(a.engine.b.honroStaging.once[`act2-send-${n}-gesture-v1`],'done');}
});
check('Stage 30 actual record interaction retains completion order and cannot repeat its success conversation',()=>{
 const a=fresh(30),b=a.engine.b,m=b.honroMarkers.find(m=>m.id==='transport-map'),u=a.engine.active;Object.assign(u,{x:m.x,y:m.y,acted:false});a.turnNotice=null;b.phase='aim';assert(g.HonroAct3.use(a,m));for(let i=0;i<500&&!a.dialogue;i++){a.engine.tick(1/120);g.HonroStory.tick(a,now+=8.334);}assert(a.dialogue?.staging);assert.equal(a.dialogue.staging.id,'act3-records-align-v1');assert.deepEqual(speech(a.dialogue.lines),speech(a.stage.beats['transport-map']));assert.equal(g.HonroAct3.current(b).id,'ferry-hold');const before=mechanical(a);motion(a);assert.deepEqual(mechanical(a),before);finish(a);assert.equal(g.HonroAct3.use(a,m),false);assert(!a.dialogue);assert.equal(a.profile.honroNarrative.filter(r=>r.id==='act3-30-transport-map').length,1);
});
check('Pure-look skip at the prefix, every visual step and final outro changes no combat field',()=>{
 for(const id of [3,19,30])for(const skipAt of ['prefix','visual']){const a=fresh(id);if(id===19)queue(a,g.HonroAct2Content.scene('act2-19-send-1',a.stage.name,a.stage.beats['send-1']));if(id===30)queue(a,g.HonroAct3Content.scene('act3-30-transport-map',a.stage.name,a.stage.beats['transport-map']));if(skipAt==='visual'){if(a.dialogue.staging.waitForIndex!=null)reachCue(a);g.HonroStory.tick(a,now+=50);g.HonroStory.tick(a,now+=50);}const before=mechanical(a);g.HonroStory.finish(a);assert.deepEqual(mechanical(a),before);assert(a.engine.b.units.every(u=>!u.honroScenePose));}
 const a=fresh(30);a.engine.b.phase='won';a.outcomes=0;a.outcome=()=>a.outcomes++;g.HonroStory.start(a,a.stage.outro,{after:'outcome'});const before=mechanical(a);g.HonroStory.finish(a);assert.deepEqual(mechanical(a),before);assert.equal(a.outcomes,1);
});
check('Waiting-prefix and hand-pose saves resume the same index/cursor without rewriting old payloads',()=>{
 let a=fresh(3);g.HonroStory.next(a);g.HonroStory.save(a);let d=plain(a.dialogue);a=reload();click('continue');assert.deepEqual(plain(a.dialogue),d);reachCue(a);for(let i=0;i<50&&!(a.dialogue.staging.cursor===2&&a.dialogue.staging.elapsed>=200);i++)g.HonroStory.tick(a,now+=50);g.HonroStory.save(a);d=plain(a.dialogue);const before=mechanical(a);a=reload();click('continue');assert.deepEqual(plain(a.dialogue),d);motion(a);assert.deepEqual(mechanical(a),before);finish(a);
 a=fresh(19);delete a.engine.b.honroStaging;const old=g.HonroAct2Content.scene('act2-19-send-2',a.stage.name,a.stage.beats['send-2']);queue(a,old);assert(!a.dialogue.staging);assert.deepEqual(speech(a.dialogue.lines),speech(old));finish(a);
});
check('An outcome that retrieves queued discoveries keeps the original speech instead of a presentation placeholder',()=>{
 const a=fresh(30),lines=g.HonroAct3Content.scene('act3-30-transport-map',a.stage.name,a.stage.beats['transport-map']);a.actorBoundary=null;g.HonroStory.queue(a,lines);assert(a.engine.b.honroState.storyQueue[0][2].stagingRequest);a.engine.b.phase='won';g.HonroStory.start(a,a.stage.outro,{after:'outcome'});for(const [,text]of lines)assert(a.dialogue.lines.some(l=>l[1]===text));assert(!a.dialogue.lines.some(l=>l[2]?.stagingRequest));assert.equal(a.engine.b.honroStaging.once['act3-records-align-v1'],'done');
});
check('Prop drawing is read-only and has no unit, item, collision or marker side effect',()=>{
 const a=fresh(30);queue(a,g.HonroAct3Content.scene('act3-30-transport-map',a.stage.name,a.stage.beats['transport-map']));for(let i=0;i<40&&a.dialogue.staging.cursor<1;i++)g.HonroStory.tick(a,now+=50);g.HonroStory.tick(a,now+=50);const before=JSON.stringify(a.engine.b),calls=[],c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args]),set:(o,k,v)=>(o[k]=v,true)});S.drawProps({ctx:c},a.engine);assert(calls.some(c=>c[0]==='fillRect'));assert.equal(JSON.stringify(a.engine.b),before);
});
check('Unidentified speech cannot accidentally select an automatic entry or outcome descriptor',()=>{
 const a=fresh(30),before=plain(a.engine.b.honroStaging.once),raw=[['설오','지금은 길을 살펴보겠습니다.']];assert.deepEqual(plain(S.decorateQueue(a,raw)),raw);assert.deepEqual(plain(a.engine.b.honroStaging.once),before);queue(a,raw);assert(!a.dialogue.staging);finish(a);
});
check('Current descriptors total about 2–4 seconds per chapter and contain no new speech or movement',()=>{
 const ids=['act1-ferry-warning-v1','act1-cooperation-gesture-v1',...[1,2,3].map(n=>`act2-send-${n}-gesture-v1`),'act3-records-align-v1','act3-old-road-regard-v1'],totals={};for(const id of ids){const d=S.describe(id);assert(d);assert(d.steps.every(s=>s.type!=='move'));assert(!d.steps.find(s=>s.type==='dialogue').lines);totals[d.stage]=(totals[d.stage]||0)+d.steps.reduce((n,s)=>n+(s.duration||0),0);}for(const t of Object.values(totals))assert(t>=2000&&t<=4000);assert.equal(S.describe('act2-monk-scene-v1'),null);
});
await report('story-expression',checks,{limits:['Synthetic position/threshold/terminal fixtures; not normal-completion proof.','16 is deferred because elder/disciple world-actor identities are not explicit.','No authored speech, map, objective, damage, reinforcement or party-recruitment rule changed.']});
