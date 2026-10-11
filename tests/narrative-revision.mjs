import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),R=g.HonroNarrativeRevision;let checks=0;
const yes=(v,m)=>{assert(v,m);checks++};
{
 const {b}=battlefield(g,2),u=b.units.find(u=>u.id==='objective');yes(u.name==='장례 상여','public objective does not reveal Hongman early');
 const row=g.HONRO_CONTENT.stages[1].outro.find(l=>l[2]?.revealName);yes(!!row,'authored reveal exists');R.reveal(b,row);yes(u.name==='홍만의 상여');const snap=JSON.stringify(b);R.reveal(b,row);assert.equal(JSON.stringify(b),snap,'repeated draw is idempotent');
}
{
 const {b,e,app}=battlefield(g,10),boss=e.unit('boss'),target=b.terrain.find(t=>t.id===R.bindingId);yes(!!target,'binding is a physical target');yes(Math.abs(target.x+target.w/2-boss.x)>boss.r+target.w/2,'binding hitbox is separate from the body');
 yes(b.honroState.receivers===2&&b.honroMarkers.filter(m=>m.action==='receiver').every(m=>m.collected),'chapter 9 arrays are retained');
 R.attach(app,e);const hp=boss.hp;e.hurt(boss,10000,b.active);assert.equal(boss.hp,hp,'person HP cannot trigger cooperation');yes(!R.beforeCooperation(app));
 e.damageTerrain(target,target.maxHp*.4,0,b.active);yes(target.hp<target.maxHp&&!target.broken);assert.equal(boss.hp,hp);yes(b.honroState.sodanBinding.hitCount===1);
 e.damageTerrain(target,target.maxHp,0,b.active);yes(target.broken&&R.bindingReady(b));yes(!R.beforeCooperation(app),'first weak binding queues offer instead of converting body');yes(b.honroState.sodanBinding.phase==='offering');yes(!b.honroState.sodanCoop);
 const lines=app.speeches;yes(lines.some(l=>l[1].includes('놓을게요')),'Sodan chooses');R.finishStory(app,{lines});yes(b.honroState.sodanBinding.phase==='accepted');yes(R.beforeCooperation(app));
 const saved=JSON.parse(JSON.stringify(b));assert.equal(saved.honroState.sodanBinding.phase,'accepted');assert.equal(saved.terrain.find(t=>t.id===R.bindingId).broken,true);
 const initialDamage=boss.hp;b.honroState.sodanCoop=true;e.hurt(boss,20,b.active);yes(boss.hp<initialDamage,'protection phase restores real damage');
}
{
 const {b,st}=battlefield(g,15);delete b.honroNarrativeRevision;delete b.honroNarrativeContent;const before=JSON.stringify(b),old=g.HonroObjectiveRevision.contentFor(b,st);yes(old.story.some(l=>l[1].includes('수문')),'old payload retained');assert.equal(JSON.stringify(b),before);R.prepareFresh(b);assert.equal(JSON.stringify(b),before,'old battle is not upgraded');
}
console.log(`PASS narrative revision ${checks} integrated initialization/target/dialogue/save contracts; projectile/browser/normal-resource play remain separate.`);
