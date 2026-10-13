import './hwigyeom-recruit-boundary.mjs';
import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),R=g.HonroNarrativeRevision,C=g.HONRO_CORE;let checks=0;
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
{
 const {b,st}=battlefield(g,5);const fresh=g.HonroObjectiveRevision.contentFor(b,st);
 const noAbsentSpeaker=value=>{if(Array.isArray(value)){assert.notEqual(value[0],'휘겸','Absent companion cannot speak anywhere in current chapter5');for(const child of value)noAbsentSpeaker(child);}else if(value&&typeof value==='object')for(const child of Object.values(value))noAbsentSpeaker(child);};
 noAbsentSpeaker(fresh);yes(fresh.storySummary.includes('휘겸이 찾으러 간'),'Current chapter5 keeps companion on his separate rescue route');
 const altered=JSON.parse(JSON.stringify(fresh));altered.outro.push(['휘겸','조기 동행']);assert.throws(()=>noAbsentSpeaker(altered),'Injected absent-companion speech must fail');
 const p=C.defaults();p.recruited=['archer','mage'];p.party=[...p.recruited];g.HonroProgression.recruit(p,st,b);const noEarlyRecruit=profile=>assert(!profile.recruited.includes('knight'),'Chapter5 cannot recruit Hwigyeom');noEarlyRecruit(p);assert.throws(()=>noEarlyRecruit({...p,recruited:[...p.recruited,'knight']}),'Injected early recruitment must fail');
 yes(g.HONRO_CONTENT.stages[5].story.some(l=>l[0]==='휘겸'&&l[1].includes('나도 동행')),'Companion voluntarily joins in chapter6');
 delete b.honroNarrativeRevision;delete b.honroNarrativeContent;delete b.honroObjectiveRevision;
 const old=g.HonroObjectiveRevision.contentFor(b,st);assert.deepEqual(JSON.parse(JSON.stringify(old.outro)),JSON.parse(JSON.stringify(g.HONRO_NARRATIVE_V0.content[4].outro)),'unsnapshotted act1 objective legacy clone uses frozen V0');yes(old.outro.some(l=>l[1].includes('돌아오는 길')),'old pending finish text remains frozen');
}
console.log(`PASS narrative revision ${checks} integrated initialization/target/dialogue/save contracts; projectile/browser/normal-resource play remain separate.`);
