/** Genuine normal21 escape save on final combined runtime. Native production
 * App/Engine with DOM/clock doubles; actual browser traversal recorded separately. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C}=h,raw=JSON.parse(await readFile('game/docs/stage-review/act-endings/evidence/normal-21-escape-save.json'));
const app=h.load(raw.profile);app.continue();h.finish(app);const e=app.engine,b=e.b,start=plain(b),trace=[];
assert.equal(b.honroStage,10);assert.equal(b.round,21);assert.equal(b.honroState.sodanWithdrawal.phase,'escape');app.selectHero('p-knight');assert.equal(e.active.cls,'knight');
const migrated=plain(b);app.export();const saved=await h.exported();const same=h.load(saved);same.continue();assert.deepEqual(plain(same.engine.b),migrated,'Final revision exact battle Continue after one production migration');
let frames=0;
while(frames++<2400&&b.honroState.sodanWithdrawal.phase==='escape'){
 assert(app.canInput(),'existing finite player action remains ready');e.move(1,C.STEP);e.tick(C.STEP);app.missionTick(C.STEP);
 if(frames%60===0)trace.push({frame:frames,x:e.active.x,y:e.active.y,moveLeft:e.active.moveLeft,phase:b.honroState.sodanWithdrawal.phase});
}
assert.equal(b.honroState.sodanWithdrawal.phase,'withdrawing');
for(let n=0;n<200&&b.honroState.sodanWithdrawal.phase!=='safe';n++)g.HonroSodanWithdrawal.frame(app,C.STEP);
assert.equal(b.phase,'won');assert.equal(b.honroState.sodanWithdrawal.party.length,4);assert(e.unit('boss').hp>0);assert.deepEqual(plain(b.items),start.items);assert.equal(e.alive(1).length,start.units.filter(u=>u.side===1&&!u.dead).length);
const inputs={...raw.profile,honroBattle:plain(b)};await writeFile('game/docs/stage-review/final-integration-20261021/evidence/checkpoint-native.json',JSON.stringify({scope:'prior normal21 escape save replay, no new full combat; native UI/clock doubles',frames,trace,start,end:plain(b),migration:{priorSp:raw.profile.honroBattle.honroSpBalanceRevision,currentSp:b.honroSpBalanceRevision,originalBossHp:raw.profile.honroBattle.units.find(u=>u.id==='boss').hp,currentBossHp:e.unit('boss').hp}},null,2));
console.log('PASS original normal21 checkpoint: production migrations, exact second Continue, real move/mission to grounded exit, safe4party, no items consumed, enemies retained');
