/** Production attacks in controlled contact lanes, plus planning/save boundaries.
 * These are normal-entry legal parties, not an authored campaign playthrough. */
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,plain=v=>JSON.parse(JSON.stringify(v));
const flat={id:'probe-floor',x:0,y:1000,w:6000,h:600,mat:'rock',hp:1e9,maxHp:1e9,indestructible:true};
const rows=[];
for(const stage of [1,5,16,24,30]){
 const st=g.HONRO_CONTENT.stages[stage-1],p=C.defaults();p.recruited=g.HonroStageRules.stageParty(stage);
 for(const cls of p.recruited){p.heroes[cls].xp=g.HonroProgression.entryHero(st).xp;C.autoTrain(p.heroes[cls],cls);assert(C.pointsSpent(p.heroes[cls],cls)<=C.pointsEarned(p.heroes[cls]));}
 const source=battlefield(g,stage,{profile:p}).b;
 const samples=[source.units.find(u=>u.side===1&&!u.boss&&!u.honroMidboss&&(u.honroType==='beast'||u.honroType==='picks')),source.units.find(u=>u.side===1&&!u.boss&&!u.honroMidboss&&['human','stoneLantern'].includes(u.honroType)),source.units.find(u=>u.side===1&&!u.boss&&!u.honroMidboss&&['bat','crow','lantern'].includes(u.honroType))].filter(Boolean);
 for(const specimen of samples)for(const skill of specimen.loadout.filter(id=>C.SKILLS[id].damage>0)){
  for(const cls of p.recruited){const results=[];
   for(const before of [true,false]){
    const b=plain(source),u=plain(specimen),target=plain(source.units.find(v=>v.side===0&&v.cls===cls));
    if(before){u.attack/=C.CAMPAIGN_ENEMY_DAMAGE;u.combatBaseAttack/=C.CAMPAIGN_ENEMY_DAMAGE;}
    // Keep the same production stats, ranks, resource costs, damage rolls,
    // existence and armor. Only geometry/initiative are a contact-lane fixture.
    const melee=skill.startsWith('HBM');Object.assign(u,{x:1000,y:1000,vx:0,vy:0,facing:1,acted:false,awake:true,focus:u.maxFocus,cooldowns:{},moveLeft:u.maxMove});
    Object.assign(target,{x:melee?1000+u.r+target.r+10:1400,y:1000,vx:0,vy:0,shield:0,acted:false});
    if(u.fixed)u.y=920;
    Object.assign(b,{units:[u,target],terrain:[plain(flat)],waters:[],fields:[],zones:[],drafts:[],width:6000,height:1800,active:u.id,side:1,phase:'enemy',wind:0,projectiles:[],queue:[u.id]});
    const events=[],e=new C.Engine(b,ev=>events.push(ev));e.checkEnd=()=>false;
    const aim=melee?{angle:0,power:1}:C.chooseEnemyShot(e,u,target,[C.SKILLS[skill]]).aim;
    const initial=target.hp;assert(e.fire(skill,aim.angle,aim.power,true));
    const rootDamage=b.projectiles.map(p=>p.damage);
    for(let tick=0;tick<2400&&(b.projectiles.length||b.volley||u.beastAction||tick<2);tick++)e.tick(C.STEP);
    const loss=initial-target.hp;assert(loss>0,`no actual contact ${stage}/${specimen.id}/${skill}/${cls}`);
    results.push({loss,share:loss/initial,hp:initial,emitted:rootDamage,aim,damageEvents:events.filter(ev=>ev.type==='damage').length});
   }
   const [before,after]=results;assert(Math.abs(after.loss/before.loss-1.35)<.06,JSON.stringify({stage,skill,before,after}));
   rows.push({stage,level:C.levelOf(p.heroes[cls]),cls,enemy:specimen.id,kind:specimen.honroVariant||specimen.honroType,skill,before,after});
  }
 }
 // Repeated load/settings must retain wounds, XP and player resources.
 const b=plain(source),enemy=b.units.find(u=>u.side===1&&!u.boss&&!u.honroMidboss&&!u.honroObjectiveTarget),hp=enemy.hp*.63;enemy.hp=hp;
 const players=JSON.stringify(b.units.filter(u=>u.side===0)),attack=enemy.attack,base=enemy.combatBaseAttack,limit=b.enemyLimit;
 for(let i=0;i<3;i++){new C.Engine(b);C.setDifficulty(b,'nightmare');C.setDifficulty(b,'normal');}
 assert.equal(enemy.attack,base*C.DIFFICULTIES.normal.damage);assert(enemy.hp/enemy.maxHp<=hp/source.units.find(v=>v.id===enemy.id).maxHp+1e-8);assert.equal(b.enemyLimit,limit);assert.equal(JSON.stringify(b.units.filter(u=>u.side===0)),players);
}
// Exact single migration: stats and saved wounds stay stable after the first load.
{
 const {b}=battlefield(g,5),u=b.units.find(u=>u.side===1&&!u.boss);delete u.honroEnemyDamageRevision;u.attack/=1.35;u.combatBaseAttack/=1.35;delete b.honroActionBudgetRevision;b.honroActiveLimit=b.enemyLimit=4;
 const hp=u.hp,expected=u.attack*1.35;new C.Engine(b);assert.equal(u.hp,hp);assert.equal(u.attack,expected);assert.equal(b.enemyLimit,5);
 const once=JSON.stringify(b);new C.Engine(b);assert.equal(JSON.stringify(b),once);
}
// Real bounded ballistic/movement ranking, including a vertical and isolated guard.
{
 const {b,e}=battlefield(g,5),hero=b.units.find(u=>u.side===0),human=b.units.find(u=>u.honroType==='human'),hound=b.units.find(u=>u.honroVariant==='hound');
 Object.assign(b,{terrain:[plain(flat)],waters:[],fields:[],zones:[],drafts:[],width:6000,height:6000,honroCustom:true});Object.assign(hero,{x:1600,y:1000});
 const foe=(template,id,x,y,lastAct=0)=>({...plain(template),id,x,y,spawnX:x,spawnY:y,awake:true,aggroUntil:99,lastAct,dead:false,hp:template.maxHp,moveLeft:template.maxMove,cooldowns:{}});
 const ready=foe(hound,'near-ready',1545,1000,99),ranged=foe(human,'ranged',1150,1000,80),far=foe(human,'far-stale',3400,1000,-30),vertical=foe(hound,'vertical',1600,4000,-50),blocked=foe(human,'boxed',2400,1000,-100);
 const wall={...plain(flat),id:'box',x:2200,y:100,w:500,h:900};b.terrain.push(wall);b.units=[hero,ready,ranged,far,vertical,blocked];
 const snapshot=JSON.stringify(b),ranks=C.rankEnemyQueue(e,[far,vertical,blocked,ranged,ready]);assert.equal(JSON.stringify(b),snapshot,'Queue probes are read only');
 assert.equal(ranks[0].unit.id,'near-ready');assert.equal(ranks.find(p=>p.unit.id==='near-ready').tier,2);assert.equal(ranks.find(p=>p.unit.id==='vertical').tier,0);assert.equal(ranks.find(p=>p.unit.id==='boxed').tier,0);
 b.enemyLimit=2;b.side=0;b.phase='transition';ready.stun=1;e.checkEnd=()=>false;e.switchTeam();assert.equal(ready.stun,0);assert.equal(ready.stunnedRound,b.round);assert(!b.queue.includes(ready.id));assert(b.queue.includes(ranged.id));assert(b.queue.length<=2);
 // Equal-distance usable attackers rotate before a stale irrelevant reserve.
 ready.stun=0;ready.lastAct=10;const peer=foe(hound,'peer-ready',1660,1000,1);b.units=[hero,ready,peer,vertical];assert.equal(C.rankEnemyQueue(e,[ready,peer,vertical])[0].unit.id,peer.id);
}
for(const id of [1,2,5,19,22,25,26,27,30]){const {b}=battlefield(g,id),current=b.enemyLimit;new C.Engine(b);assert.equal(b.enemyLimit,current);assert(current<=6);if([25,26,27].includes(id))assert.equal(current,3);}
{const b={mode:'campaign',honroStage:19,enemyLimit:3,honroActiveLimit:3};C.migrateCampaignActionBudget(b);assert.equal(b.enemyLimit,3);assert.equal(b.honroActionBudgetRevision,undefined);}
await mkdir('_local/reports/combat-pressure',{recursive:true});await writeFile('_local/reports/combat-pressure/damage.json',JSON.stringify({scope:'Production attacks against legal entry heroes in controlled contact lanes; no guaranteed campaign volley/whole-run claim',rows},null,2));
console.log('PASS queue/cap/save boundaries;',rows.length,'actual attack comparisons');console.table(rows.filter(r=>r.cls==='archer').map(r=>({stage:r.stage,level:r.level,kind:r.kind,skill:r.skill,hp:r.after.hp,before:r.before.loss,after:r.after.loss,share:(100*r.after.share).toFixed(1)+'%'})));
