/** Native cast/projectile/AI/ticks. No phase, active, or death state is forced.
 * The historical fixture was recorded with a8777dda's unmodified engine after
 * actual M07 killed a walking active foe (tick 414); it stalled for 2400 ticks. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,trace=[];
let passed=0;
function test(name,fn){const result=fn();passed++;trace.push({name,...result});console.log('PASS',name);}
function arena({count=2,hp=1,skill='M07',foes=[]}={}){
 const b=C.createBattle(1,C.defaults(),'campaign');
 Object.assign(b,{width:3000,height:2000,terrain:[{id:'floor',x:0,y:1500,w:3000,h:500,mat:'rock',hp:99999,maxHp:99999}],fields:[],waters:[],drafts:[],zones:[],decor:[],enemyLimit:2});
 b.units=b.units.filter(u=>u.id===b.active);const u=b.units[0];
 Object.assign(u,{x:400,y:1500,spawnX:400,spawnY:1500,vx:0,vy:0,ranks:{[skill]:1,M01:1},loadout:[skill],attack:1,focus:1000,maxFocus:1000,armor:0});
 for(let i=0;i<count;i++)b.units.push(C.makeUnit('knight',1,1150+i*450,1500,{id:`foe${i}`,role:'guard',hp:i?10000:hp,maxHp:i?10000:hp,armor:0,loadout:['S00'],awake:true,aggroUntil:99,maxMove:1000,moveLeft:1000,xpBudget:i?0:6,...foes[i]}));
 const events=[],e=new C.Engine(b,ev=>events.push(ev));assert(e.fire(skill,0,.3));
 return {b,e,u,events,victim:b.units[1]};
}
function until(e,condition,max=2400){let i=0;while(!condition()&&i++<max)e.tick(C.STEP);assert(condition(),`did not progress: ${e.b.phase}/${e.b.active}/round${e.b.round}`);return i;}
function toMovement(a){until(a.e,()=>!!a.victim.aiMove);assert(!a.victim.dead);return {x:a.victim.x,plan:structuredClone(a.victim.aiMove)};}
function endRound(e){return until(e,()=>e.b.round===2||['won','lost'].includes(e.b.phase));}
function rewards(b){return JSON.stringify({kills:b.kills,rewardGranted:b.rewardGranted,awardIds:b.awardIds,xp:Object.fromEntries(Object.entries(b.heroes).map(([k,v])=>[k,v.xp])),killLedger:b.units.filter(u=>u.side===1).map(u=>[u.id,u.killRewarded,u.xpGranted])});}
let deathSave;
test('M07 kills a genuinely walking active enemy; remaining enemy acts, then player turn',()=>{
 const a=arena(),started=toMovement(a);let moving=false;
 until(a.e,()=>{if(a.victim.dead)return true;moving=!!a.victim.aiMove;return false;});
 assert(moving&&a.victim.x<started.x);assert.equal(a.b.stakes[0].usedRounds[a.victim.id],1);assert(!a.victim.aiMove&&!a.victim.moveTarget);
 deathSave=structuredClone(a.b);const ticks=endRound(a.e);assert.equal(a.b.phase,'aim');assert.equal(a.b.side,0);assert.equal(a.b.units[2].lastAct,1);assert.equal(a.b.kills,1);assert.equal(a.events.filter(e=>e.type==='result').length,0);
 return {ticksAfterDeath:ticks,deathX:a.victim.x,remainingActed:true};
});
test('M07 kills the last moving foe; native campaign victory/rewards fire once',()=>{
 const a=arena({count:1});toMovement(a);until(a.e,()=>a.b.phase==='won');assert.equal(a.b.kills,1);assert(a.b.rewardGranted);assert.equal(a.events.filter(e=>e.type==='result').length,1);
 const r=rewards(a.b),teamEnds=[...a.b.teamEnds];for(let i=0;i<90;i++){a.e.tick(C.STEP);a.e.finishAction();}assert.equal(rewards(a.b),r);assert.deepEqual([...a.b.teamEnds],teamEnds);
 const resumed=new C.Engine(structuredClone(a.b));for(let i=0;i<60;i++)resumed.tick(C.STEP);assert.equal(rewards(resumed.b),r);return {phase:a.b.phase,resultEvents:1};
});
test('save immediately after native death resumes identically, without kill/XP replay',()=>{
 const left=new C.Engine(structuredClone(deathSave)),right=new C.Engine(JSON.parse(JSON.stringify(deathSave)));endRound(left);endRound(right);assert.equal(rewards(left.b),rewards(right.b));assert.equal(left.b.kills,1);assert.equal(left.b.round,2);assert.equal(left.b.teamEnds[1],1);return {round:left.b.round};
});
const historical=JSON.parse(gunzipSync(await readFile('tests/fixtures/m07-dead-moving-enemy-a8777dda.json.gz')));
test('already-stalled a8777dda snapshot is repaired on load without touching earned rewards',()=>{
 const b=structuredClone(historical),actor=b.units.find(u=>u.id===b.active);assert(actor.dead&&actor.aiMove);const earned=rewards(b),events=[];const e=new C.Engine(b,ev=>events.push(ev));assert(!actor.aiMove);assert.equal(rewards(b),earned);endRound(e);assert.equal(b.phase,'aim');assert.equal(b.kills,1);assert.equal(actor.xpGranted,historical.units.find(u=>u.id===actor.id).xpGranted);assert.equal(events.filter(e=>e.type==='result').length,0);return {source:'a8777dda actual tick414',round:b.round};
});
test('surviving walking enemy retains its plan; mid-move save resumes same result',()=>{
 const a=arena({hp:10000});toMovement(a);const before=a.victim.x,saved=JSON.parse(JSON.stringify(a.b)),resumed=new C.Engine(saved);a.e.tick(C.STEP);assert(a.victim.x<before&&!a.victim.dead&&a.victim.aiMove);endRound(a.e);endRound(resumed);assert.equal(rewards(a.b),rewards(saved));assert(Math.abs(a.victim.x-resumed.unit(a.victim.id).x)<1e-6);assert.equal(a.b.phase,'aim');return {survived:true};
});
test('inactive foe killed by M07 splash never blocks the remaining queue',()=>{
 const a=arena({count:3,foes:[{}, {x:670,hp:1,maxHp:1,fixed:true}, {x:1800}]});toMovement(a);until(a.e,()=>a.b.units[2].dead);assert.equal(a.b.kills,2);endRound(a.e);assert.equal(a.b.phase,'aim');assert.equal(a.b.units[3].lastAct,1);return {kills:a.b.kills};
});
test('lured walking active killed by actual damage cannot leave a pull wait',()=>{
 const a=arena({skill:'M08',foes:[{x:780},{}]});toMovement(a);assert(a.victim.aiMove.lureStakeId!==undefined);a.e.hurt(a.victim,1000,a.u.id);assert(a.victim.dead&&!a.victim.aiMove);endRound(a.e);assert.equal(a.b.phase,'aim');return {round:a.b.round};
});
test('flying reserve death removes waitingFlight; living reserve finishes its real motion',()=>{
 const a=arena({hp:10000,foes:[{x:700,fixed:true,maxMove:0,moveLeft:0}, {x:2400,y:1350,spawnX:2400,spawnY:1350,fixed:true,honroType:'bat',loadout:[],awake:false,aggroUntil:0,group:9}]});
 until(a.e,()=>!!a.b.units[2].aiMove?.waitingFlight);const bird=a.b.units[2];assert(!bird.dead);const clone=structuredClone(a.b),live=new C.Engine(clone),aliveBird=live.unit(bird.id),start={x:aliveBird.x,y:aliveBird.y};
 a.e.hurt(bird,100000,a.u.id);assert(bird.dead&&!bird.aiMove);endRound(a.e);assert.equal(a.b.phase,'aim');
 // The survivor is allowed to use its real reserved flight before the next team.
 endRound(live);assert(!aliveBird.dead&&!aliveBird.aiMove);assert(Math.hypot(aliveBird.x-start.x,aliveBird.y-start.y)>1);return {deadRound:a.b.round,livingFlightMoved:Math.hypot(aliveBird.x-start.x,aliveBird.y-start.y)};
});
test('a living airborne actor must settle before the dead active can finish',()=>{
 const a=arena();toMovement(a);until(a.e,()=>a.victim.x<640);const other=a.b.units[2];a.e.impulse(other,0,-500);
 until(a.e,()=>a.victim.dead);assert(other.vy!==0||other.airborne);assert.equal(a.b.active,a.victim.id);assert.equal(a.b.phase,'enemy');
 const y=other.y;a.e.tick(C.STEP);assert.equal(a.b.active,a.victim.id);assert(other.y!==y);endRound(a.e);assert.equal(a.b.phase,'aim');return {waitedForLivingFall:true};
});
test('real eater capture during AI movement advances the queue without a forced phase',()=>{
 const a=arena({hp:10000});toMovement(a);const s=a.e.spawnSummon(a.u,'eater',a.victim.x,a.victim.y,1,1);assert.equal(a.victim.eaterCapturedBy,s.id);endRound(a.e);assert.equal(a.b.phase,'aim');assert(!a.victim.aiMove);return {captured:true};
});
test('dead saved drop/follow/retreat states cannot re-open live-only action continuations',()=>{
 for(const state of [{platformDrop:{phase:'prepare',elapsed:0,originY:1500,contacts:[]}}, {meleeFollow:'landing'}, {retreat:true}]){
  const b=structuredClone(historical),u=b.units.find(u=>u.id===b.active);Object.assign(u,state);const e=new C.Engine(b);endRound(e);assert.equal(b.phase,'aim');assert.equal(b.side,0);assert.equal(b.round,2);assert.equal(b.teamEnds[1],1);assert(!u.platformDrop&&!u.meleeFollow&&!u.retreat);
 }
 return {restoredVariants:3};
});
test('missing active actor advances to the remaining live queued enemy',()=>{
 const a=arena({hp:10000});toMovement(a);a.b.units=a.b.units.filter(u=>u!==a.victim);endRound(a.e);assert.equal(a.b.phase,'aim');assert.equal(a.b.units[1].lastAct,1);return {round:a.b.round};
});
await mkdir('_local/reports/dead-actor-turn',{recursive:true});await writeFile('_local/reports/dead-actor-turn/checks.json',JSON.stringify({passed,trace},null,2)+'\n');console.log(`${passed} dead-actor turn checks passed`);
