import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';

const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
const plain=value=>JSON.parse(JSON.stringify(value));
const hit=(skillId,options={})=>{
 const profile=C.defaults(),b=C.createBattle(1,profile,'practice',{party:['archer'],wind:0}),hero=b.units.find(u=>u.side===0);
 hero.attack=1;hero.ranks={A01:1,A09:1};hero.critChance=options.crit?1:0;hero.critMultiplier=1.5;
 const foe=C.makeUnit('knight',1,1000,970,{id:'test-foe',name:'대상',role:'human',honroVariant:options.variant||'human',hp:10000,maxHp:10000,armor:options.armor||0,loadout:['LS09'],awake:true,fixed:true});
 if(options.defense)foe.existenceDefense=options.defense;
 b.units=[hero,foe];b.active=hero.id;b.side=0;b.phase='aim';b.shot=1;
 const e=new C.Engine(b);e.checkEnd=()=>false;e.random=()=>options.crit?0:.99;
 const p={skill:skillId,owner:hero.id,side:0,shot:1,skillRank:1,damage:100,x:hero.x,y:hero.y-50,launchX:hero.x,launchY:hero.y-50,apexY:hero.y-950,vx:800,vy:0,mode:C.SKILLS[skillId].mode,hit:[]};
 e.hurt(foe,100,hero.id,true,p,{x:foe.x,y:foe.y-50});
 return {damage:10000-foe.hp,foe,hero,b,e,p};
};

// Every implemented attack, including saved/NPC and HONRO monster attacks, has an explicit mix.
for(const skill of Object.values(C.SKILLS).filter(s=>s.damage>0)){
 assert(C.ATTACK_EXISTENCE[skill.id],`unclassified ${skill.id}`);
 const a=skill.existenceAttack;
 assert(a&&['form','qi','soul'].every(k=>Number.isFinite(a[k])&&a[k]>=0),`invalid ${skill.id}`);
 assert(Math.abs(a.form+a.qi+a.soul-1)<1e-9,`non-normalized ${skill.id}`);
 for(const defense of Object.values(C.MONSTER_EXISTENCE)){
  const u=C.makeUnit('knight',1,900,970,{id:'sample',existenceDefense:defense});
  const n=C.existenceMultiplier(a,u);
  assert(Number.isFinite(n)&&n>=.1&&n<=1.5,`${skill.id} multiplier`);
 }
}
for(const kind of Object.keys(g.HonroWorld.archetypes))assert(C.MONSTER_EXISTENCE[kind],`unclassified species ${kind}`);
for(const kind of ['possessedGuard','possessedArcher','gateMaster','archerMaster','archiveFiend','kilnFiend'])assert.deepEqual(plain(C.MONSTER_EXISTENCE[kind]),plain(C.MONSTER_EXISTENCE.human),kind+' explicitly retains the human-body form/qi response');
for(const role of Object.keys(C.ENEMIES))assert(C.MONSTER_EXISTENCE[role],`unclassified legacy enemy ${role}`);
const sodan=C.makeUnit('occultist',1,900,970,{id:'sodan',role:'medium',honroType:'human'});
const bier=C.makeUnit('knight',1,900,970,{id:'bier',role:'golem',honroType:'bier'});
const unmarkedGhost=C.makeUnit('occultist',1,900,970,{id:'ghost',role:'fire',honroType:'ghost'});
assert.deepEqual(plain(C.defenseForUnit(sodan)),plain(C.MONSTER_EXISTENCE.medium),'role overrides visual type for Sodan');
assert.deepEqual(plain(C.defenseForUnit(bier)),plain(C.MONSTER_EXISTENCE.golem),'role overrides visual type for the bier boss');
assert.deepEqual(plain(C.defenseForUnit(unmarkedGhost)),plain(C.MONSTER_EXISTENCE.ghost),'species type overrides generic combat role');

const aggregate=C.calculateDamage({skillDamage:100,conditionBonuses:[.2,.3],criticalMultiplier:1.5,existenceMultiplier:.3,defenseMultiplier:.72});
assert.equal(aggregate.conditionMultiplier,1.5);
assert(Math.abs(aggregate.finalDamage-48.6)<1e-9);
assert.equal(C.calculateDamage({skillDamage:-5,conditionBonuses:[NaN],criticalMultiplier:1,existenceMultiplier:1,defenseMultiplier:1}).finalDamage,0);

const normal=hit('A01'),critical=hit('A01',{crit:true});
assert.equal(normal.damage,100); // Neutral human form and qi retain the existing ordinary hit.
assert.equal(critical.damage,Math.round(normal.damage*1.5));
const armored=hit('A01',{armor:.30});
assert.equal(armored.damage,Math.round(normal.damage*.70));
const ghost=hit('A01',{variant:'ghost'});
assert(ghost.damage<normal.damage*.35,'material arrows barely affect a spirit');
const armoredGhost=hit('A01',{variant:'ghost',armor:.3});
assert.equal(armoredGhost.damage,Math.round(ghost.damage*.7),'existence and armor are independent layers');
const ghostUnit=ghost.foe;
const qi=C.existenceMultiplier({form:0,qi:1,soul:0},ghostUnit),soul=C.existenceMultiplier({form:0,qi:0,soul:1},ghostUnit);
assert(qi>1&&soul>qi&&soul>1.25);
ghostUnit.manifested=true;ghostUnit.formDamageTakenBonus=.20;
assert(C.existenceMultiplier({form:1,qi:0,soul:0},ghostUnit)>.39);
ghostUnit.existenceShift={form:.2,qi:-.1,soul:.1};
assert(C.existenceMultiplier({form:1,qi:0,soul:0},ghostUnit)>.59);
const hero=C.makeUnit('occultist',0,100,970,{id:'caster',soulAffinityBonus:.1});
assert(C.existenceMultiplier({form:0,qi:0,soul:1},ghostUnit,hero)>C.existenceMultiplier({form:0,qi:0,soul:1},ghostUnit));
ghostUnit.soulDefenseBonus=.1;
assert(C.existenceMultiplier({form:0,qi:0,soul:1},ghostUnit)<1.4);

g.HONRO_DEBUG_DAMAGE=true;
const rehit=hit('A09');rehit.p.turned=true;rehit.foe.hp=10000;rehit.e.hurt(rehit.foe,100,rehit.hero.id,true,rehit.p,{x:rehit.foe.x,y:rehit.foe.y-50});
const trace=g.HONRO_DAMAGE_TRACE.at(-1);
assert(Math.abs(trace.conditionMultiplier-1.75)<1e-9,`drop and turn bonuses add before multiplication: ${JSON.stringify(trace)}`);
assert.equal(rehit.foe.hp<10000,true);
g.HONRO_DEBUG_DAMAGE=false;
const profile=C.defaults(),b=C.createBattle(1,profile,'practice',{party:['archer'],wind:0});
const foe=b.units.find(u=>u.side===1);foe.existenceShift={form:.25,soul:-.15};profile.saved=b;
const restored=C.validate(plain(profile)).saved.units.find(u=>u.id===foe.id);
assert.deepEqual(plain(restored.existenceShift),plain(foe.existenceShift));
const legacy=plain(profile);delete legacy.saved.units.find(u=>u.id===foe.id).existenceShift;delete legacy.saved.units.find(u=>u.id===foe.id).existenceDefense;
const old=C.validate(legacy).saved.units.find(u=>u.id===foe.id);
assert(Number.isFinite(C.existenceMultiplier({form:1,qi:0,soul:0},old)));
console.log('existence damage: classification, layered math, crit, defense, spirit matchups and save compatibility passed');
