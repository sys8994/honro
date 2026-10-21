import assert from 'node:assert/strict';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C}=h,rows=[];
const p=h.profileThrough(2),st=g.HONRO_CONTENT.stages[2];
const b=g.HonroWorld.build(st,p,false,'archer','A01');g.HonroStageRules.sanitizeStageBattle(b);
const birds=b.units.filter(u=>['bat','crow'].includes(u.honroVariant)&&!u.honroMidboss);
assert(birds.length);
const untouched=plain({heroes:b.heroes,growth:b.honroGrowth,enemyLimit:b.enemyLimit});
for(const u of birds){const k=u.honroVariant,f=k==='bat'?.8:70/88;u.maxHp=Math.round(u.maxHp/f);u.hp=u.maxHp*.37;u.combatBaseHp/=f;delete u.honroAirborneBalanceRevision;u.existenceDefense={...C.MONSTER_EXISTENCE[k],form:k==='bat'?.9:.92};}
const dead=plain(birds[0]);Object.assign(dead,{id:'dead-air-probe',hp:0,dead:true});b.units.push(dead);
const boss=plain(birds[0]);Object.assign(boss,{id:'boss-air-probe',honroMidboss:true});b.units.push(boss);const bossBefore=plain(boss);
const old=birds.map(u=>({id:u.id,max:u.maxHp,base:u.combatBaseHp,qi:u.existenceDefense.qi,soul:u.existenceDefense.soul}));
p.honroStage=3;p.honroBattle=plain(b);const app=h.load(p);app.continue();
for(let n=0;n<3;n++){
 const live=app.engine.b;
 for(const o of old){const u=app.engine.unit(o.id),f=u.honroVariant==='bat'?.8:70/88;assert.equal(u.maxHp,Math.round(o.max*f));assert(Math.abs(u.hp/u.maxHp-.37)<1e-10);assert.equal(u.combatBaseHp,o.base*f);assert.equal(u.existenceDefense.form,1.15);assert.equal(u.existenceDefense.qi,o.qi);assert.equal(u.existenceDefense.soul,o.soul);}
 assert.equal(app.engine.unit(dead.id).hp,0);assert.equal(app.engine.unit(dead.id).dead,true);assert.deepEqual(plain(app.engine.unit(boss.id)),bossBefore);
 assert.deepEqual(plain({heroes:live.heroes,growth:live.honroGrowth,enemyLimit:live.enemyLimit}),untouched);
 app.export();await h.import(await h.exported());app.continue();
}
rows.push({review:'air-save',repeatImports:3,birds:birds.length,deadPreserved:true,bossPreserved:true});
// Fresh runtime templates and fresh reinforcement factories must agree; reward weights stay unchanged.
for(const k of ['bat','crow','lantern']){const u=g.HonroWorld.createEnemy(b,st,1200,k,1,1500,true);assert.equal(u.honroAirborneBalanceRevision,k==='lantern'?undefined:1);assert.equal(u.honroXpWeight,{bat:.68,crow:.78,lantern:.8}[k]);rows.push({kind:k,hp:u.maxHp,response:C.defenseForUnit(u),A01:C.existenceMultiplier(C.ATTACK_EXISTENCE.A01,u)});}
for(const kind of ['bat','crow']){const record={kind,id:'new-boss-'+kind,x:1200,y:1500,team:'enemy',miniboss:true};const u=g.HonroUnits.create(record,b,p,st);assert(u.honroMidboss);assert.equal(u.honroAirborneBalanceRevision,undefined);assert.equal(C.defenseForUnit(u).form,kind==='bat'?.9:.92);const before=plain(u);C.migrateAirborneBalance(u);assert.deepEqual(plain(u),before);}
// Contact uses actual bodies, paid movement, solid and one-way occlusion, and no projectiles.
function fixture(k,dx=80,dy=0,barrier){
 const q=C.defaults(),battle=g.HonroWorld.build(g.HONRO_CONTENT.stages[0],q,false,'archer','A01');
 const hero=battle.units.find(u=>u.side===0),u=g.HonroWorld.createEnemy(battle,g.HONRO_CONTENT.stages[0],1000,k,1,1400,true);
 Object.assign(hero,{x:1000+dx,y:1400+dy,vx:0,vy:0,critChance:0});Object.assign(u,{awake:true,moveLeft:100,lastAct:battle.round,acted:false,facing:1});
 battle.terrain=[{id:'floor',x:0,y:1400,w:6000,h:900,hp:99999,maxHp:99999,mat:'rock',indestructible:true},...(barrier?[barrier]:[])];
 if(dy<0)battle.terrain.push({id:'upper',x:1030,y:1400+dy,w:300,h:15,hp:99999,maxHp:99999,mat:'rock',oneWay:true});
 battle.mode='practice';battle.units=[hero,u];battle.active=u.id;battle.side=1;battle.phase='enemy';battle.queue=[u.id];const e=new C.Engine(battle);return{e,b:battle,u,t:hero};
}
for(const k of ['hound','boar','stag']){
 const {e,b,u,t}=fixture(k,k==='boar'?120:80);const hp=t.hp,move=u.moveLeft;
 assert(e.fire(u.loadout[0],0,.5,true));assert.equal(b.projectiles.length,0);
 for(let i=0;i<49;i++)e.tick(C.STEP);assert.equal(t.hp,hp,'no windup damage');
 let peakTravel=0,resumed=false;for(let i=0;i<90;i++){e.tick(C.STEP);peakTravel=Math.max(peakTravel,u.beastAction?.travel||0);
 if(u.beastAction?.struck&&!resumed){const saved=plain(b),clone=new C.Engine(saved),hpAfter=clone.unit(t.id).hp;for(let n=0;n<12;n++)clone.tick(C.STEP);assert.equal(clone.unit(t.id).hp,hpAfter,'resumed hit latch');const valid=C.validate({...plain(C.defaults()),saved});assert.equal(valid.saved.units.find(v=>v.id===u.id).beastAction.struck,true);resumed=true;}
 assert.equal(b.projectiles.length,0);}
 assert(t.hp<hp,k+' contact hit');assert(!u.beastAction);assert(peakTravel<=(k==='boar'?72:24)+1e-8);assert(u.moveLeft<=move);rows.push({review:'contact-motion',kind:k,hpLoss:hp-t.hp,peakTravel,moveSpent:move-u.moveLeft});
}
for(const [name,dx,dy,barrier] of [['wall',80,0,{id:'wall',x:1040,y:1200,w:8,h:200,hp:99999,maxHp:99999,mat:'rock',indestructible:true}],['upper-floor',80,-100],['out-of-range',900,0]]){
 const {e,b,u,t}=fixture('boar',dx,dy,barrier),hp=t.hp;e.fire(u.loadout[0],0,.5,true);for(let i=0;i<139;i++)e.tick(C.STEP);assert.equal(t.hp,hp,name+' cannot hit');assert.equal(b.projectiles.length,0);rows.push({review:'terrain-range',name,hpLoss:hp-t.hp});
}
// Enemy planning must actually approach (rather than use a ranged attack or only wait).
{const {e,b,u,t}=fixture('hound',400);u.lastAct=-1;u.moveLeft=u.maxMove;const start=u.x,hp=t.hp;for(let i=0;i<1000&&b.side===1;i++){e.tick(C.STEP);if(u.beastAction?.struck)break;}assert(u.x>start+100);assert(t.hp<hp);rows.push({review:'AI',approach:u.x-start,hpLoss:hp-t.hp});}
await report('airborne-beast-melee',rows);console.log('PASS',JSON.stringify(rows));
