import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {runtime,battlefield,gameRoot} from './helpers.mjs';
const g=await runtime(),C=g.HONRO_CORE,checks=[];
const check=(name,fn)=>{const detail=fn();checks.push({name,passed:true,detail});};
for(const [id,cls,level] of [[2,'mage',3],[5,'knight',6]])check(`Stage ${id}: ${cls} joins at level ${level} in profile and battle`,()=>{
 const {b,p,st}=battlefield(g,id);p.recruited=['archer'];p.heroes[cls].xp=b.heroes[cls].xp=0;
 g.HonroProgression.recruit(p,st,b);assert.equal(C.levelOf(p.heroes[cls]),level);assert.equal(C.levelOf(b.heroes[cls]),level);
 const once=JSON.stringify(p);g.HonroProgression.recruit(p,st,b);assert.equal(JSON.stringify(p),once);return level;
});
check('Future Sodan recruitment uses the same stage level contract',()=>{
 const {p,b}=battlefield(g,6);const st={id:7,recruit:'occultist',level:7};g.HonroProgression.recruit(p,st,b);
 assert.equal(C.levelOf(p.heroes.occultist),8);assert.equal(C.levelOf(b.heroes.occultist),8);
});
check('Old under-levelled recruits recover once without reviving or repositioning units',()=>{
 const {p,b}=battlefield(g,6),u=b.units.find(u=>u.cls==='mage'&&u.side===0);
 p.heroes.mage.xp=b.heroes.mage.xp=0;u.level=1;u.hp=0;u.dead=true;const position=[u.x,u.y,u.vx,u.vy,u.dead,u.hp];
 g.HonroProgression.repairRecruits(p,b);assert.equal(C.levelOf(p.heroes.mage),3);assert.equal(u.level,3);
 assert.deepEqual([u.x,u.y,u.vx,u.vy,u.dead,u.hp],position);
 const once=JSON.stringify([p,b]);g.HonroProgression.repairRecruits(p,b);assert.equal(JSON.stringify([p,b]),once);
});
check('A stronger saved companion never loses XP, learned skills, or loadout',()=>{
 const {p,b,st}=battlefield(g,2);p.recruited.push('mage');p.heroes.mage.xp=C.xpAtLevel(12);p.heroes.mage.ranks.M01=4;
 const before=JSON.stringify([p.heroes.mage,p.loadouts.mage]);g.HonroProgression.recruit(p,st,b);
 assert.equal(JSON.stringify([p.heroes.mage,p.loadouts.mage]),before);assert.equal(C.levelOf(b.heroes.mage),12);
});
check('Named allied NPCs already have stage-appropriate levels when encountered',()=>{
 for(const id of [2,5]){const {b,st}=battlefield(g,id),u=b.units.find(u=>u.honroAlly&&u.cls===st.recruit);assert.equal(u.level,st.joinLevel);}
});
function allyFixture(role){
 const f=battlefield(g,2),{e,b,st,app}=f,hero=e.active;
 b.width=3500;b.height=1600;b.terrain=[{id:'floor',x:0,y:1000,w:3500,h:600,mat:'rock',hp:999999,maxHp:999999}];b.waters=[];b.drafts=[];b.wind=0;
 Object.assign(hero,{x:200,y:1000,vx:0,vy:0});
 const actor=g.HonroWorld.ally(b,st,'probe-ally',role,600,1000),second=g.HonroWorld.ally(b,st,'next-ally','guard',400,1000),target=C.makeUnit('archer',1,role==='daoist'?1150:750,1000,{id:'target',hp:10000,maxHp:10000,awake:true,fixed:true});
 b.units=[hero,actor,second,target];b.phase='ally';b.side=0;b.active=actor.id;b.projectiles=[];b.reviewDamage={};
 b.honroState.allyQueue={ids:[actor.id,second.id],index:0,phase:'act',elapsed:0,started:false,targetId:target.id,returnActive:hero.id};
 e.checkEnd=()=>false;g.HonroAllies.attach(app,e);return {...f,actor,target};
}
for(const role of ['guard','daoist'])check(`${role}: own attack settles, reviews damage, then advances exactly one ally`,()=>{
 const {e,b,target}=allyFixture(role),q=b.honroState.allyQueue;e.tick(C.STEP);
 assert.equal(b.phase,'ally');
 if(role==='daoist'){assert.equal(q.phase,'flight');assert.ok(b.projectiles.length>0);}
 for(let i=0;q.phase!=='after'&&i<2400;i++)e.tick(C.STEP);
 assert.equal(q.phase,'after');assert.equal(q.index,0);assert.equal(b.projectiles.length,0);assert.ok(target.hp<10000);assert.ok(b.reviewDamage[target.id]>0);assert.ok(b.reviewFocus);
 let elapsed=0;while(elapsed<C.ACTION_REVIEW_SECONDS-2*C.STEP){e.tick(C.STEP);elapsed+=C.STEP;assert.equal(q.index,0);}
 while(q.index===0&&elapsed<1){e.tick(C.STEP);elapsed+=C.STEP;}
 assert.equal(q.index,1);assert.ok(Math.abs(elapsed-C.ACTION_REVIEW_SECONDS)<2*C.STEP);return {damage:10000-target.hp,reviewSeconds:elapsed};
});
check('Summoned spirits get the same post-attack review interval',()=>{
 const {e,b,actor,target}=allyFixture('guard');actor.summoned=true;actor.summonKind='stalker';actor.summonOwner=e.heroesAlive()[0].id;actor.side=0;
 b.phase='summon';b.summonTurn={queue:[actor.id],index:0,stage:'attack',elapsed:0,hold:0,returnActive:e.heroesAlive()[0].id,practice:false};
 e.tick(C.STEP);const t=b.summonTurn;assert.equal(t.stage,'wait');assert.ok(t.hold>=C.ACTION_REVIEW_SECONDS-C.STEP-.00001);assert.ok(target.hp<10000);
 for(let i=0;i<20;i++)e.tick(C.STEP);assert.equal(t.index,0);return {remaining:t.hold};
});
await writeFile(path.join(gameRoot,'reports/party-pacing.json'),JSON.stringify({checks},null,2)+'\n');console.log(`${checks.length} recruitment and allied pacing checks passed`);
