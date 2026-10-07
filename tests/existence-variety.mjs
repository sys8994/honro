import assert from 'node:assert/strict';
import {beforeExistenceProfiles} from './existence-delta-helpers.mjs';
import {readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,plain=v=>JSON.parse(JSON.stringify(v));
const before=JSON.parse(await readFile('tests/fixtures/existence-profiles-before.json','utf8'));
const restoredProfiles=beforeExistenceProfiles(C.SKILLS);
for(const old of before.skills)assert.deepEqual(plain(restoredProfiles[old.id].existenceAttack??null),old.existenceAttack,'Only the exact reviewed attack delta is accepted');
const rows=before.skills.filter(s=>/^[AMSO]\d\d$/.test(s.id));assert.equal(rows.length,64);
for(const s of rows)assert(!['nightParade','curseDot','curseChain'].includes(C.SKILLS[s.id].mode),'Historical curse damage is not a current active path');
for(const id of ['O99','LO99','LO08','LO10'])assert(C.SKILLS[id].enemyOnly,'Historical curse entry remains inaccessible: '+id);
for(const old of before.skills){const s=C.SKILLS[old.id];for(const key of ['damage','cost','mode'])assert.equal(s[key],old[key],`${s.id} ${key} budget`);assert.equal(s.cooldown??null,old.cooldown,`${s.id} cooldown`);}
for(const cls of ['archer','mage','knight','occultist']){
 const damaging=rows.filter(s=>s.cls===cls&&s.damage>0),profiles=damaging.map(s=>C.SKILLS[s.id].existenceAttack);
 assert(new Set(profiles.map(JSON.stringify)).size>=8,cls+' skill variation');
 for(const p of profiles){assert(Math.abs(p.form+p.qi+p.soul-1)<1e-9);if(cls==='archer')assert(p.form>=.64&&p.soul===0);if(cls==='mage')assert(p.qi>=.62&&p.soul===0);if(cls==='occultist')assert(p.soul>=.54);}
}
const avg=(ids,k)=>ids.reduce((n,id)=>n+C.ATTACK_EXISTENCE[id][k],0)/ids.length;
assert(avg(['A11','A09','A13','A12','A15'],'qi')>avg(['A14','A02','A06','A99'],'qi'));
assert(avg(['M06','M02','M04','M13','M05'],'form')>avg(['M03','M11','M12','M14','M15'],'form'));
assert(avg(['S03','S05','S07','S08','S02'],'form')>avg(['S01','S06','S04','S15','S13'],'form'));
assert(avg(['S01','S06','S04','S15','S13'],'form')>avg(['S09','S10','S11','S12'],'form'));
for(const id of ['A10','M09','M10','S14','O09','O13'])assert.equal(C.existenceAttackView(C.SKILLS[id]),'',id+' does no damage');
assert.match(C.existenceAttackView(C.SKILLS.O15),/따라 쏜/);
for(const [kind,id] of [['stalker','O11'],['lantern','O12'],['eater','O14']])assert.deepEqual(plain(C.attackForHit(undefined,{summonKind:kind},undefined,C.SKILLS)),plain(C.SKILLS[id].existenceAttack));
const source=C.makeUnit('archer',0,200,970,{id:'hero'});
for(const id of ['A13','M07','S11','O02']){
 assert.deepEqual(plain(C.attackForHit({skill:id},source,source,C.SKILLS)),plain(C.SKILLS[id].existenceAttack),'missing legacy projectile ratio resolves by ID');
 const saved={form:.11,qi:.22,soul:.67};assert.deepEqual(plain(C.attackForHit({skill:id,existenceAttack:saved},source,source,C.SKILLS)),saved,'explicit in-flight ratio is preserved');
}
// The new direct-effect path changes only the existence layer, without faking a projectile.
const b=C.createBattle(1,C.defaults(),'practice',{party:['occultist'],wind:0}),hero=b.units.find(u=>u.side===0);
Object.assign(hero,{cls:'occultist',critChance:0});const target=C.makeUnit('knight',1,1300,970,{id:'probe',hp:10000,maxHp:10000,honroVariant:'ghost',armor:0,loadout:['LS09']});b.units=[hero,target];b.active=hero.id;
const e=new C.Engine(b);e.checkEnd=()=>false;e.random=()=>.99;g.HONRO_DEBUG_DAMAGE=true;
for(const id of ['A05','O06','O07','O08','O10']){e.hurt(target,100,hero.id,false,undefined,undefined,'normal',id);const t=g.HONRO_DAMAGE_TRACE.at(-1);assert.equal(t.skill,id);assert.equal(t.existenceMultiplier,C.existenceMultiplier(C.ATTACK_EXISTENCE[id],target,hero));assert.equal(t.conditionMultiplier,1);}
// Actual talisman remnants and earthbind keep their parent technique after a save as well.
b.occultTraps=[{id:1,owner:hero.id,skill:'O07',rank:1,damage:20,x:target.x,y:target.y-target.h*.5,expires:b.round+1}];e.tickOccult();assert.equal(g.HONRO_DAMAGE_TRACE.at(-1).skill,'O07');
target.earthbind={owner:hero.id,until:b.round+1,damage:20};e.tickCurses();assert.equal(g.HONRO_DAMAGE_TRACE.at(-1).skill,'O10');
console.log('PASS: 64 active techniques, branch identities, unchanged budgets, summoned/derived hits and saved projectile profiles');
