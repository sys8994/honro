import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';

const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
const plain=v=>JSON.parse(JSON.stringify(v));
function arena(id,rank=1){
 const profile=C.defaults();profile.heroes.occultist.xp=C.xpAtLevel(25);profile.heroes.occultist.ranks={O01:1,O06:1,[id]:rank};profile.loadouts.occultist=['O01',id];
 const b=C.createBattle(1,profile,'practice',{party:['occultist'],wind:0});
 b.heroes=C.freshRoster();
 Object.assign(b,{width:3200,height:1800,practiceCombat:true,wind:0,fields:[],drafts:[],waters:[],terrain:[{id:'floor',x:0,y:1400,w:3200,h:400,mat:'rock',hp:99999,maxHp:99999}]});
 const u=b.units.find(v=>v.side===0);b.units=[u];Object.assign(u,{x:330,y:1400,spawnX:330,spawnY:1400,h:100,r:20,attack:1,focus:999,maxFocus:999,acted:false,loadout:['O01',id],ranks:{...profile.heroes.occultist.ranks},angle:12,lastPower:.55});
 const foe=C.makeUnit('knight',1,1000,1400,{id:'foe',name:'표적',fixed:true,awake:true,hp:20000,maxHp:20000,armor:0,h:100,r:25,loadout:['LS09']});b.units.push(foe);b.active=u.id;b.side=0;b.phase='aim';
 const e=new C.Engine(b);e.checkEnd=()=>false;e.random=()=>.99;
 return {profile,b,u,foe,e};
}
function castAt(a,id=a.u.loadout[1],target=a.foe){
 a.u.loadout=['O01',id];a.u.ranks[id]??=1;a.u.acted=false;a.b.phase='aim';a.b.side=0;a.b.active=a.u.id;a.u.focus=999;
 const shot=a.e.bestShot(a.u,C.SKILLS[id],target);assert(a.e.fire(id,shot.angle,shot.power),id);return a.b.projectiles.filter(p=>p.owner===a.u.id&&p.shot===a.b.shot&&!p.echoSource);
}
function direct(a,id){const p=castAt(a,id)[0];assert(p,id);a.e.impact(p,{x:a.foe.x,y:a.foe.y-50,t:0,n:{x:0,y:-1},unit:a.foe});return p;}

// Retained attacks still use the original trajectory/mode definitions.
for(const id of ['O01','O02','O03','O04','O05','O06','O07','O11','O12']){
 const a=arena(id);const roots=castAt(a,id);assert(roots.length>0,id);assert.equal(roots[0].mode,C.SKILLS[id].mode,id);
}
assert.equal(C.SKILLS.O01.cost,0);assert(C.SKILLS.O01.gravity<.25&&C.SKILLS.O01.wind<.15);

for(const [rank,actions,power] of [[1,2,.7],[2,3,.7],[3,3,.85],[4,4,.85],[5,4,1],[6,5,1],[7,5,1.15],[8,6,1.15]]){
 const a=arena('O09',rank);a.foe.hp=10000;direct(a,'O09');assert.equal(a.foe.enthrall.actions,actions);assert.equal(a.foe.enthrall.power,power);assert.equal(a.foe.side,0);
 a.foe.hp=Math.round(a.foe.maxHp*.3);a.e.releaseEnemy(a.foe);assert.equal(a.foe.side,1);assert(Math.abs(a.foe.hp/a.foe.maxHp-.3)<.002);
}
{
 const a=arena('O08',5);direct(a,'O08');assert(a.foe.manifested&&a.foe.revealSpiritToParty&&a.foe.formDamageTakenBonus>0);assert.equal(a.foe.manifestedUntil-a.b.round+1,5);
 const saved=C.defaults();saved.saved=a.b;const restored=C.validate(plain(saved)).saved;assert(restored.units.find(u=>u.id==='foe').manifested);
}
{
 const a=arena('O10',8);a.foe.hp=100;direct(a,'O10');assert.equal(a.foe.earthbind.until-a.b.round+1,7);assert(a.b.units.some(u=>u.summonKind==='earthbound'));
}
{
 const a=arena('O11',8);const spirit=a.e.spawnSummon(a.u,'stalker',600,1300,1,8);assert.equal(spirit.summonExpires-a.b.round+1,8);
 a.e.finishAction(true);assert.equal(a.b.phase,'summon');for(let i=0;i<800&&a.b.phase==='summon';i++)a.e.stepSummonTurn(C.STEP);
 assert.equal(spirit.summonActionRound,a.b.round);assert.notEqual(a.b.phase,'summon');
}
{
 const a=arena('O14',8);const eater=a.e.spawnSummon(a.u,'eater',630,1200,1,8);
 const shot=castAt(a,'O01')[0];shot.side=1;shot.x=700;shot.y=eater.y-eater.h*.5;shot.vx=-100;shot.vy=0;shot.damage=180;
 const before=Math.abs(shot.vx);a.e.stepProjectile(shot,C.STEP);assert(shot.vx< -before||!a.b.projectiles.includes(shot));
}
{
 const a=arena('O09');a.foe.x=560;a.foe.hp=10000;const other=C.makeUnit('knight',1,780,1400,{id:'other',fixed:true,hp:20000,maxHp:20000,armor:0,h:100,r:25,loadout:['LS09']});a.b.units.push(other);
 direct(a,'O09');for(let action=1;action<=2;action++){
  a.b.phase='aim';a.b.side=0;a.b.active=a.u.id;a.u.acted=false;a.e.finishAction(true);
  assert.equal(a.b.phase,'summon');if(action===1){const saved=C.defaults();saved.saved=a.b;assert(C.validate(plain(saved)).saved.summonTurn.queue.includes(a.foe.id));}
  for(let i=0;i<600&&a.b.phase==='summon';i++)a.e.stepSummonTurn(C.STEP);
  if(action===1){assert.equal(a.foe.enthrall.actions,1);a.b.round++;}
 }
 assert.equal(a.foe.side,1);assert.equal(a.foe.enthrall,undefined);
}
{
 const a=arena('O06');a.u.ranks.OP01=1;const p=castAt(a,'O06')[0];a.e.impact(p,{x:700,y:1350,t:0,n:{x:0,y:-1},terrain:a.b.terrain[0]});
 assert.equal(a.b.occultTraps.length,1);a.foe.x=700;a.foe.y=1400;a.e.tickOccult();assert(a.foe.curseTurns>0);assert.equal(a.b.occultTraps.length,0);
}
{
 const a=arena('O11');a.u.ranks.OP02=3;a.foe.x=600;a.foe.curseOwner=a.u.id;
 const nearer=C.makeUnit('knight',1,450,1400,{id:'nearer',fixed:true,hp:20000,maxHp:20000,h:100,r:25,loadout:['LS09']});a.b.units.push(nearer);
 a.e.spawnSummon(a.u,'stalker',330,1300);assert(a.e.runSummonTurn(a.u.id)>0);a.e.stepSummonTurn(C.STEP);assert.equal(a.b.summonTurn.targetId,a.foe.id);
}
{
 const a=arena('O11');a.u.ranks.OP03=8;const ghost=a.e.spawnSummon(a.u,'stalker',a.u.x+30,1300);
 const hp=a.u.hp,spiritHp=ghost.hp;a.e.hurt(a.u,Math.round(a.u.maxHp*.5),a.foe.id);assert(a.u.hp<hp&&ghost.hp<spiritHp);
 const b=arena('O11');b.u.ranks.OP03=8;b.u.shield=b.u.maxHp;const warded=b.e.spawnSummon(b.u,'stalker',b.u.x+30,1300),before=warded.hp;b.e.hurt(b.u,Math.round(b.u.maxHp*.5),b.foe.id);assert.equal(warded.hp,before);
}
{
 const a=arena('O11');a.u.ranks.OP04=8;a.u.focus=10;const ghost=a.e.spawnSummon(a.u,'stalker',600,1300);
 ghost.summonExpires=a.b.round-1;assert(a.e.expireSummon(ghost));assert(a.u.focus>10&&a.u.nextSummonDiscount>0);
}
{
 const a=arena('O01');a.u.ranks.OP05=1;
 for(let i=0;i<3;i++){const foe=C.makeUnit('knight',1,550+i*35,1400,{id:'remnant-'+i,hp:5,maxHp:5,h:100,r:20,armor:0,loadout:['LS09']});a.b.units.push(foe);a.e.hurt(foe,20,a.u.id);}
 assert.equal(a.u.soulRemnants,3);const p=castAt(a,'O01')[0];assert(p.soulBoost&&p.damage>C.SKILLS.O01.damage);assert.equal(a.u.soulRemnants,0);
}
for(const rank of [1,2,3,4,5,6,7,8]){
 const a=arena('O15',rank),dur=[4,5,5,6,6,7,7,8][rank-1],cap=[1,1,1,2,2,2,3,3][rank-1];
 for(let i=0;i<cap+1;i++)a.e.spawnSummon(a.u,'echo',400+i*30,1200,1,rank);
 assert.equal(a.b.units.filter(u=>u.summonKind==='echo'&&!u.dead).length,cap);
 assert.equal(a.b.units.filter(u=>u.summonKind==='echo'&&!u.dead).at(-1).summonExpires-a.b.round+1,dur);
}
{
 const p=C.defaults();p.heroes.occultist.xp=C.xpAtLevel(25);delete p.heroes.occultist.occultRevision;p.heroes.occultist.ranks={O01:3,O06:4,O09:5,OP03:2};p.loadouts.occultist=['O01','O09','O99'];
 const q=C.validate(plain(p));assert.equal(q.heroes.occultist.occultRevision,1);assert.equal(q.heroes.occultist.ranks.O06,4);assert.equal(q.heroes.occultist.ranks.O09,undefined);assert(!q.loadouts.occultist.includes('O99'));
 const enemy=C.makeUnit('occultist',1,600,1400,{loadout:['O09'],ranks:{O09:5}});C.migrateEnemySkills(enemy);assert.equal(enemy.loadout[0],'LO09');
}
for(const id of ['O01','O02','O03','O04','O05']){
 const a=arena(id,8);a.e.spawnSummon(a.u,'echo',150,1200,1,8);const roots=castAt(a,id),echo=a.b.projectiles.find(p=>p.echoSource);
 assert(roots.length&&echo,id);assert.equal(echo.targetPoint.x,roots[0].targetPoint.x);assert.equal(echo.targetPoint.y,roots[0].targetPoint.y);
}
{
 const a=arena('O16',8);a.u.ranks.O15=8;const echoes=[a.e.spawnSummon(a.u,'echo',160,1200,1,8),a.e.spawnSummon(a.u,'echo',570,1120,1,8),a.e.spawnSummon(a.u,'echo',700,1250,1,8)];
 const roots=castAt(a,'O16'),copies=a.b.projectiles.filter(p=>p.echoSource);assert.equal(roots.length,1);assert.equal(copies.length,3);assert.equal(new Set(copies.map(p=>p.echoSource)).size,3);
 assert(copies.every(p=>p.targetPoint.x===roots[0].targetPoint.x&&p.targetPoint.y===roots[0].targetPoint.y));assert(copies.every(p=>p.launchX!==roots[0].launchX));
 assert.deepEqual(plain(copies.map(p=>Math.round(p.echoDelay*1000))),[75,150,225]);
 const sample=copies[0];const old=sample.x;a.e.stepProjectile(sample,.01);assert.equal(sample.x,old);
 roots[0].x=roots[0].targetPoint.x;roots[0].y=roots[0].targetPoint.y;a.e.stepProjectile(roots[0],C.STEP);
 assert(a.b.projectiles.filter(p=>p.mode==='convergeSpirit').length>=10);
 const saved=C.defaults();saved.saved=a.b;assert(C.validate(plain(saved)).saved.projectiles.some(p=>p.mode==='convergeSpirit'));
 assert(echoes.every(u=>u.summonExpires-a.b.round+1===8));
}
console.log('PASS Sodan redesign representative mechanics and save state');
