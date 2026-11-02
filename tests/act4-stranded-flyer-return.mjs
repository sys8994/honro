/** Recorded Stage32 UI failure replay; paid roost return, not a stage clear. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {writeFile,mkdir} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const raw=execFileSync('xz',['-dc','tests/fixtures/act4-rc/stage32-stranded-lantern-41360862299.json.xz']);
const h=await appHarness(),g=h.g,C=g.HONRO_CORE;let ms=0;g.performance={now:()=>ms};const a=h.load(JSON.parse(raw));a.continue();h.finish(a);
const e=a.engine,b=e.b,u=b.units.find(x=>x.id==='a4-32-d-3');
// The model harness omits App-only Act4 mounting; attach the same production
// density filter explicitly, without changing saved positions or queue.
g.HonroEncounterDensity.installActivation(e);
assert.equal(b.honroStage,32);assert.equal(b.round,22);assert.equal(u.hp,1173);assert(u.y<130);assert.equal(b.honroAct4EncounterRevision,1);
const initial=plain(u),shots=b.shot,rows=[];let sawReturn=false,reactivated=false;
for(let i=0;i<18000&&b.round<27&&!reactivated;i++){
 if(a.canInput())a.defend();
 ms+=C.STEP*1000;
 if(a.dialogue){g.HonroStory.next(a);continue;}
 g.HonroStory.turn(a);if(g.HonroStory.turnPaused(a))continue;
 const x=u.x,y=u.y,m=u.moveLeft,returning=u.aiMove?.intent==='공중 교전 구역 복귀';
 if(returning)sawReturn=true;
 e.tick(C.STEP);a.missionTick(C.STEP);
 if(returning){const moved=Math.hypot(u.x-x,u.y-y);assert(moved<=180*C.STEP+.00001,'Return cannot teleport');assert(u.moveLeft<=m+.00001,'Return cannot restore movement');if(moved>0)assert(m-u.moveLeft>=moved-.0001,'Return must pay full movement distance');}
 if(i%60===0)rows.push({round:b.round,phase:b.phase,x:u.x,y:u.y,moveLeft:u.moveLeft,intent:u.aiMove?.intent,eligible:e.combatEnemies().some(v=>v.id===u.id)});
 reactivated=sawReturn&&e.combatEnemies().some(v=>v.id===u.id);
}
assert(sawReturn,'Recorded stranded flyer must schedule physical return');assert(reactivated,'Return must recover actual local activation');assert.equal(u.hp,initial.hp,'Regression must not kill or weaken target');assert.equal(b.units.filter(x=>x.side===1).length,12);
const out='_local/reports/act4-flyer-return';await mkdir(out,{recursive:true});await writeFile(out+'/result.json',JSON.stringify({scope:'Native recorded failure replay, not complete-stage play acceptance',sourceRun:41360862299,fixtureSHA256:createHash('sha256').update(raw).digest('hex'),initial,final:plain(u),rows,sawReturn,reactivated,initialShots:shots,finalShots:b.shot},null,2));
console.log('PASS recorded Stage32 flyer: bounded paid physical return restores local engagement, no HP/roster change');
