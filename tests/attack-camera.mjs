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
console.log('PASS attack camera: accepted/failed casts, manual action lifetime, held gesture, summon action, stale releases, required dialogue, Continue, duplicate attach');
