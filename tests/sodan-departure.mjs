// Production App, story queue, Engine.walk and save state. Receiver/outcome
// fixtures isolate the authored exit; this is not a normal-combat playthrough.
import assert from 'node:assert/strict';
import {appHarness,plain,report}from'./app-regression-helpers.mjs';
const h=await appHarness(),{g,load,reload,profileThrough,click,finish}=h,S=g.HonroStoryStaging;
const ID='act1-sodan-upper-yard-departure-v1',checks=[],coordinates=[];let now=1000;
const npc=a=>a.engine.b.units.find(u=>u.id==='npc-sodan');
const position=a=>({x:npc(a).x,y:npc(a).y});
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
function make({entrance=true}={}){const a=load(profileThrough(8));a.launch(9);finish(a);const b=a.engine.b;
 if(entrance){b.honroState.receivers=1;a.actorBoundary=b.active;assert(S.receiver(a,b.honroMarkers.find(m=>m.action==='receiver')));finish(a);assert.equal(b.honroStaging.once[S.ID],'done');}
 // The existing objective owner supplies this terminal condition in gameplay.
 b.phase='won';b.honroState.receivers=2;b.honroState.storyQueue=[];b.honroState.deferredStory=[];
 a.outcomes=0;a.outcome=()=>a.outcomes++;return a;}
function start(a,options={}){assert(g.HonroStory.start(a,a.stage.outro,{title:a.stage.name,after:'outcome',...options}));}
function read(a){for(let i=0;i<30&&a.dialogue?.staging?.waitForDialogue;i++)g.HonroStory.next(a);assert(a.dialogue?.staging&&!a.dialogue.staging.waitForDialogue&&!a.dialogue.staging.complete);}
function tick(a){g.HonroStory.tick(a,now+=50);}
function run(a){for(let i=0;i<180&&a.dialogue;i++)tick(a);assert(!a.dialogue);assert.equal(a.outcomes,1);assert.equal(a.engine.b.honroStaging.once[ID],'done');}
function stable(a){const b=plain(a.engine.b);delete b.honroStory;delete b.honroStaging.once;delete b.honroState.completedStory?.['act1-v6:outcome-9'];for(const u of b.units){delete u.honroScenePose;for(const k of ['x','y','facing','angle','moving','walkPhase'])if(u.id==='npc-sodan')delete u[k];}return b;}
let expected;
check('Stage 9 outro precedes a visible supported retreat toward the stage exit, with no gameplay changes',()=>{
 const a=make(),b=a.engine.b,before=position(a),source=plain(a.stage.outro.map(l=>l.slice(0,2))),focus=[];
 a.scene.storyFocusPoint=(x,y)=>focus.push({x,y});start(a);assert(a.dialogue.staging.waitForDialogue);assert.deepEqual(plain(a.dialogue.lines.map(l=>l.slice(0,2))),source);assert.deepEqual(position(a),before);const untouched=stable(a);read(a);assert.equal(a.outcomes,0);
 const walk=a.engine.walk.bind(a.engine),samples=[];a.engine.walk=(u,dir,dt,support)=>{assert.equal(u.id,'npc-sodan');assert.equal(support,true);const from=u.x;walk(u,dir,dt,support);samples.push({from,x:u.x,y:u.y});const surface=g.HonroMapEngine.surfaceY(b.terrain,u.x,u.y);assert(surface);assert(Math.abs(surface.y-u.y)<.01);assert(u.x>=from&&u.x-from<6,'natural motion must be small supported steps');};
 run(a);expected=position(a);assert.deepEqual(before,{x:3274,y:2396.08});assert.deepEqual(expected,{x:3410,y:2385.2});assert(samples.length>20);assert(expected.x<b.honroMapAnchors.exit.x);assert.deepEqual(stable(a),untouched);assert(focus.some(p=>p.x===3440));assert.equal(npc(a).side,2);assert.equal(npc(a).fixed,true);assert(!b.honroState.sodanCoop);coordinates.push({before,after:expected,exit:plain(b.honroMapAnchors.exit),samples});
});
check('Skip during each outro/motion phase yields the same position and one original outcome',()=>{
 for(const cursor of ['outro',0,1,2]){const a=make();start(a);const lines=plain(a.dialogue.lines);if(cursor!=='outro'){read(a);for(let i=0;i<160&&a.dialogue.staging.cursor<cursor;i++)tick(a);assert.equal(a.dialogue.staging.cursor,cursor);if(cursor===1)for(let i=0;i<5;i++)tick(a);}g.HonroStory.finish(a);assert.deepEqual(position(a),expected);assert.equal(a.outcomes,1);assert.equal(a.engine.b.honroStaging.once[ID],'done');assert(a.profile.honroNarrative.some(s=>JSON.stringify(s.lines)===JSON.stringify(lines)));g.HonroStory.finish(a);assert.equal(a.outcomes,1);}
});
check('Midmotion save and Continue preserve exact actor/cursor and never repeat the outro or retreat',()=>{
 let a=make();start(a);read(a);for(let i=0;i<160&&!(a.dialogue.staging.cursor===1&&a.dialogue.staging.elapsed>=450);i++)tick(a);assert(npc(a).x>3274&&npc(a).x<3410);a.scene.x=3340;a.scene.y=2310;a.scene.scale=.9;g.HonroStory.save(a);const saved=plain(a.dialogue),p=position(a);a=reload();click('continue');a.outcomes=0;a.outcome=()=>a.outcomes++;assert.equal(a.dialogue.index,a.dialogue.lines.length);assert.deepEqual(plain(a.dialogue),saved);assert.deepEqual(position(a),p);assert.equal(a.scene.x,3340);assert.equal(a.scene.y,2310);tick(a);assert.deepEqual(position(a),p,'first resumed tick has zero elapsed time');run(a);assert.deepEqual(position(a),expected);assert.equal(S.request(a,ID),false);
});
check('Old battle stamps, saved old outros and custom maps never receive new withdrawal movement',()=>{
 for(const mode of ['old-battle','old-scene-stamp','saved-outro']){const a=make(),before=position(a);if(mode==='old-battle')delete a.engine.b.honroStaging;if(mode==='old-scene-stamp')delete a.engine.b.honroStaging.outcomeScenes;start(a,mode==='saved-outro'?{index:2}:{});assert(!a.dialogue.staging||a.dialogue.staging.id!==ID);finish(a);assert.deepEqual(position(a),before);assert.equal(a.outcomes,1);}
 const m=plain(g.HONRO_PROJECT.stages[8]);m.metadata.campaign=false;const b=g.HonroMaps.createBattle(m,g.HONRO_PROJECT,profileThrough(8));assert(!b.honroStaging);
});
check('Missing/dead/airborne actor, absent exit and blocking wall safely settle without reveal or teleport',()=>{
 for(const mode of ['hidden','dead','airborne','exit','wall']){const a=make({entrance:mode!=='hidden'}),b=a.engine.b,u=npc(a),before=u&&position(a);if(mode==='dead'){u.dead=true;u.hp=0;}if(mode==='airborne')u.airborne=true;if(mode==='exit')delete b.honroMapAnchors.exit;if(mode==='wall')b.terrain.push({id:'departure-test-wall',x:u.x+52,y:u.y-180,w:20,h:190,hp:9999,indestructible:true,mat:'rock'});start(a);read(a);run(a);if(mode==='hidden'){assert(!npc(a));assert(b.honroStaging.hidden['npc-sodan']);}else if(mode==='wall'){assert(npc(a).x>=before.x&&npc(a).x<before.x+52);assert(npc(a).x<expected.x);}else assert.deepEqual(position(a),before);if(mode==='dead')assert.equal(u.hp,0);}
});
check('History/modal pause and retry keep the existing staging lock and fresh one-shot contract',()=>{
 const a=make();start(a);read(a);for(let i=0;i<160&&a.dialogue.staging.cursor<1;i++)tick(a);for(let i=0;i<4;i++)tick(a);const before=position(a),cursor=plain(a.dialogue.staging);a.storyHistoryOpen=true;tick(a);assert.deepEqual(position(a),before);assert.deepEqual(plain(a.dialogue.staging),cursor);a.storyHistoryOpen=false;a.modal.classList.add('open');tick(a);assert.deepEqual(position(a),before);a.modal.classList.remove('open');g.HonroStory.finish(a);a.launch(9);assert(!npc(a));assert(a.engine.b.honroStaging.outcomeScenes.includes(ID));assert.equal(a.engine.b.honroStaging.once[ID],undefined);
});
check('Stage 10 keeps its authored hostile Sodan and upper-yard tree rather than carrying the stage 9 body',()=>{
 const a=load(profileThrough(9));a.launch(10);const b=a.engine.b,u=b.units.find(u=>u.id==='boss');assert(u);assert.equal(u.side,1);assert.equal(u.cls,'occultist');assert(!b.units.some(u=>u.id==='npc-sodan'));assert(!b.honroStaging.outcomeScenes?.includes(ID));assert(!b.honroState.sodanCoop);coordinates.push({stage10Sodan:{x:u.x,y:u.y,side:u.side},stage10Anchors:plain(b.honroMapAnchors)});
});
await report('sodan-departure',checks,{coordinates,limits:['Real Engine.walk on current stage 9 terrain; receiver success and terminal outcome are explicit fixtures.','DOM/Canvas/audio doubles, not browser or normal combat completion proof.','Stage 9 shows the departure toward its exit; the upper-yard tree is in the next authored map.']});
