/** Actual saved Stage14 lock + controlled physical-contact contracts.
 * Continue/movement inputs are production App/Engine; DOM is a double.
 * This is not a stage-clear or human-fun acceptance result. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {appHarness,plain} from './app-regression-helpers.mjs';
const saved=JSON.parse(gunzipSync(await readFile('tests/fixtures/act2-gameplay/stage14-natural-settle-lock-terminal.json.gz')));
const h=await appHarness({productionStory:true}),{g,C}=h;let now=0;g.performance={now:()=>now};const a=h.load(saved.profile);a.continue();h.finish(a);const e=a.engine,b=e.b,u=e.unit('14.gilchan');
const before={phase:b.phase,active:b.active,round:b.round,npc:plain(u),busy:e.settleBusy()};
assert.equal(b.honroStage,14);assert.equal(b.phase,'flight');assert(before.busy&&u.jumping);assert.equal(b.projectiles.length,0);assert.equal(u.vx,0);assert.equal(u.vy,0);
assert(g.HonroAct23V4Act2.bodyBlock(b,u,{x:u.x,y:u.y+.3}), 'actual living-body obstruction exists');
e.integrateBody(u,C.STEP);
assert(Math.abs(u.x-before.npc.x)<.01&&Math.abs(u.y-before.npc.y)<.01,'no teleport/contact penetration');
assert.equal(u.hp,before.npc.hp);assert.equal(u.moveLeft,before.npc.moveLeft);assert.equal(u.fixed,false);
assert.equal(u.jumping,false);assert.equal(u.airborne,false);assert.equal(e.grounded(u),false,'reservation is NOT terrain support');assert.equal(e.settleBusy(),false);
const tick=()=>{now+=1000/60;if(!a.dialogue){e.tick(C.STEP);if(!a.dialogue)a.missionTick(C.STEP);}g.HonroStory.tick(a,now);if(a.dialogue)h.finish(a);};
let readyFrames=0;for(;readyFrames<6000&&!a.canInput()&&!a.done;readyFrames++)tick();
assert(a.canInput()&&!a.done,'natural enemy resolution returns legitimate player control');
const cleared=[];
for(const cls of ['archer','mage','knight']){const hero=b.units.find(x=>x.cls===cls&&x.side===0&&!x.dead);assert(hero);a.selectHero(hero.id);assert.equal(e.active.id,hero.id);let n=0;while(n++<180&&hero.x>u.x-60&&a.canInput()){e.move(-1,C.STEP);tick();}cleared.push({id:hero.id,x:hero.x,y:hero.y});}
for(let n=0;n<900&&!e.grounded(u)&&!u.fixed&&!a.done;n++)tick();
assert(e.grounded(u)||u.fixed,'ordinary gravity resumes after normal player movement clears the reservation');
assert(Math.abs(u.y-before.npc.y)>5,'NPC did not remain frozen at suspended pose');
// Pure contact-resolution edge cases: only a descending, stopped reservation
// clears air-motion flags; ascent, equipment motion and drop preparation retain them.
const settle=g.HonroAct23V4Act2.settleBodyReservation;
for(const special of ['ascending','equipment','drop']){const p={x:5,y:special==='ascending'?-1:1,vx:3,vy:special==='ascending'?-5:5,jumping:true,airborne:true,...(special==='equipment'?{equipmentState:{motion:{}}}:{}),...(special==='drop'?{platformDrop:{phase:'prepare'}}:{})};settle(p,{x:5,y:0},{x:5,y:0});assert(p.jumping&&p.airborne,special);}
const result={passed:true,scope:'Saved natural Stage14 Continue plus legitimate body-clearing inputs; controlled edge-case contracts, not full-clear/browser proof',before:{phase:before.phase,active:before.active,round:before.round,npc:{x:before.npc.x,y:before.npc.y,jumping:before.npc.jumping},busy:before.busy},readyFrames,cleared,after:{phase:b.phase,round:b.round,npc:{x:u.x,y:u.y,jumping:u.jumping,grounded:e.grounded(u),fixed:u.fixed}},noPoseHpOrSuccessAssignment:true};
await mkdir('_local/reports/act2-reserved-body-settle',{recursive:true});await writeFile('_local/reports/act2-reserved-body-settle/result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
