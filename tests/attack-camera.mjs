import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const g=vm.createContext({console,performance});
vm.runInContext(await readFile('shared/runtime/attack-camera.js','utf8'),g);
const A=g.HonroAttackCamera;assert.equal(A.snapshot(undefined),null);
const scene={x:200,y:700,scale:.6,manual:false},e={b:{},active:{id:'archer'},fire:()=>true},app={engine:e,scene};
A.prime(scene,e.b);A.attach(app,e);A.attach(app,e);
const initial=A.snapshot(scene);A.manual(scene);assert(A.blocksFocus(scene));const manual=A.snapshot(scene);
// Failed casts do not take ownership; selection/preview/child-flight/damage
// code does not call the accepted-action boundary.
const e2={b:{},active:{id:'knight'},fire:()=>false},app2={engine:e2,scene};A.attach(app2,e2);const before=A.status(scene);assert.equal(e2.fire('invalid'),false);assert.equal(A.status(scene).intent,before.intent);
scene.storyTween={kind:'static',manual:true};scene.goalFocus={x:100,y:200};assert(e.fire('A01'));assert(!A.blocksFocus(scene));assert.equal(scene.manual,false);assert.equal(scene.storyTween,null);assert.equal(scene.goalFocus,null);assert.equal(A.status(scene).attacks,1,'duplicate attach never doubles accepted attacks');assert(!A.canRestore(scene,initial));assert(!A.canRestore(scene,manual));assert(A.canRestore(scene,A.snapshot(scene)));
// Pan for the remainder of one attack, then next attack automatically resumes.
A.manual(scene);const lock=A.status(scene).intent;for(let i=0;i<5;i++)assert(A.blocksFocus(scene));assert.equal(A.status(scene).intent,lock);assert(e.fire('A01'));assert.equal(scene.manual,false);
// A held camera gesture wins even if an AI starts attacking; lifting it does
// not undo this attack's manual intent, but the next accepted attack resumes.
A.manual(scene,true);e.fire('A01');assert(A.blocksFocus(scene));assert(scene.manual);A.endGesture(scene);assert(A.blocksFocus(scene));e.fire('A01');assert(!A.blocksFocus(scene));assert(!scene.manual);
// Non-fire scheduler attack (one callback per summon action, not per bolt).
A.manual(scene);const attacks=A.status(scene).attacks;e.onAttackStart('lantern');assert.equal(A.status(scene).attacks,attacks+1);assert(!A.blocksFocus(scene));
// Active required dialogue framing is preserved; a stale release cannot restore
// its old manual snapshot after a later attack.
scene.storyFrozen=true;scene.storyFrame={id:'required-dialogue'};scene.storyTween={kind:'scripted'};e.fire('A01');assert(scene.storyFrame);assert(scene.storyTween);scene.storyFrozen=false;scene.storyFrame=null;
// Continue's new Scene has no in-memory control state. Legacy saved views may
// release normally until its first new accepted attack, then they are stale.
const saved=JSON.parse(JSON.stringify(A.snapshot(scene)));const restored={x:0,y:0,scale:.6,manual:false};A.prime(restored,e.b);assert(A.canRestore(restored,saved));A.begin(restored,'archer');assert(!A.canRestore(restored,saved));
// P0: the previous private manual latch overrode main's move/jump/select
// scene.manual=false every render. Real player controls must clear both owners.
A.manual(scene);const stale=A.snapshot(scene),count=A.status(scene).attacks;
assert(A.resume(scene));assert(!A.blocksFocus(scene));assert(!scene.manual);assert(!A.canRestore(scene,stale));assert.equal(A.status(scene).attacks,count);
A.manual(scene,true);assert.equal(A.resume(scene),false);assert(A.blocksFocus(scene));A.endGesture(scene);assert(A.resume(scene));
const battle={side:0,phase:'aim',round:1,active:'archer'},turnScene={manual:false},turnEngine={b:battle,active:{id:'archer'}};A.prime(turnScene,battle);
A.manual(turnScene);A.update(turnScene,turnEngine);assert(A.blocksFocus(turnScene),'same player turn must not steal inspection/flight manual');
battle.phase='flight';A.update(turnScene,turnEngine);battle.phase='aim';turnEngine.active.meleeFollow='ready';A.update(turnScene,turnEngine);assert(A.blocksFocus(turnScene),'S13 follow-up is the same action');
delete turnEngine.active.meleeFollow;battle.side=1;battle.phase='enemy';A.update(turnScene,turnEngine);assert(A.blocksFocus(turnScene),'enemy transition alone is not a new player action');
battle.side=0;battle.phase='aim';battle.round++;A.update(turnScene,turnEngine);assert(!A.blocksFocus(turnScene));assert(!turnScene.manual,'new player turn follows without requiring a cast');
A.manual(turnScene,true);battle.round++;A.update(turnScene,turnEngine);assert(A.blocksFocus(turnScene),'held camera pointer wins at turn start');A.endGesture(turnScene);A.resume(turnScene);assert(!A.blocksFocus(turnScene));
console.log('PASS attack camera: accepted/failed casts, manual action lifetime, held gesture, summon action, stale releases, required dialogue, Continue, duplicate attach');
console.log('PASS player control resume clears both manual owners; same-action/S13 guarded; new player turn and held pointer ownership');
