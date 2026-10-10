import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
function arena(id){
 const s=C.SKILLS[id],b=C.createBattle(1,C.defaults(),'practice',{party:[s.cls],wind:0});
 const u=b.units[0];Object.assign(b,{width:4000,height:2000,terrain:[{id:'floor',x:0,y:1500,w:4000,h:500,mat:'rock',hp:99999,maxHp:99999}],waters:[],fields:[],drafts:[],units:[u],wind:0,practiceCombat:false});
 Object.assign(u,{x:200,y:1500,loadout:[id],ranks:{[id]:8},focus:9999,maxFocus:9999,attack:1,armor:0,hp:9999,maxHp:9999,acted:false});
 const e=new C.Engine(b);e.random=()=>.99;e.checkEnd=()=>false;
 const add=(side,x,extra={})=>{const t=C.makeUnit('knight',side,x,1500,{id:'target-'+b.units.length,armor:0,shield:0,hp:99999,maxHp:99999,fixed:true,...extra});b.units.push(t);return t;};
 const fire=()=>{assert(e.fire(id,0,.7),id);return b.projectiles[0];};return {b,u,e,add,fire};
}
const hit=(a,p,t)=>a.e.impact(p,{x:t.x,y:t.y-t.h*.5,t:0,n:{x:-1,y:0},unit:t});
// Real launch and swept collision across the four projectile families.
for(const id of ['A01','A02','A13','M01','M03','O01','O02','O04','S09','S10','S11','S12'])for(const flags of [{side:0},{side:2,honroAlly:true}]){
 const a=arena(id),t=a.add(flags.side,500,flags),foe=a.add(1,1000),p=a.fire();
 assert(p,id);Object.assign(p,{x:430,y:t.y-t.h*.5,vx:1000,vy:0,gravityScale:0,wind:0});
 for(let n=0;n<30&&a.b.projectiles.includes(p)&&t.hp===t.maxHp;n++)a.e.stepProjectile(p,C.STEP);
 assert(t.hp<t.maxHp,`${id} must damage ${JSON.stringify(flags)}`);
 assert(!a.e.guidanceTarget(a.u,t),'friendly collider never becomes intentional guidance target');
}
console.log('PASS direct, piercing, guided, soul and martial projectile friendly collisions');
for(const mode of ['fireChip','frostChip','ironChip']){
 const a=arena('M06'),t=a.add(0,800),p=a.fire();Object.assign(p,{mode,secondary:true,damage:30});hit(a,p,t);assert(t.hp<t.maxHp,mode);assert(!t.slowed,'frost special status remains enemy-only');
}
for(const id of ['M01','M03','M06','M04','M13','O08','O10']){
 const a=arena(id),t=a.add(0,800),p=a.fire();hit(a,p,t);assert(t.hp<t.maxHp,id+' area damage');assert(!t.manifested&&!t.earthbind&&!t.curseOwner,'charm status remains enemy-only');
}
console.log('PASS fragments, geometry, explosion, lightning and charm damage/status separation');
{
 const a=arena('O12'),ally=a.add(0,650),enemy=a.add(1,1100),spirit=a.e.spawnSummon(a.u,'lantern',400,1500,1,1);
 a.e.launchSummonBolt(spirit,enemy);const p=a.b.projectiles[0];p.y=ally.y-ally.h*.5;
 for(let i=0;i<90&&a.b.projectiles.includes(p);i++)a.e.stepProjectile(p,C.STEP);
 assert(ally.hp<ally.maxHp,'summon ray intercepted by ally');assert.equal(enemy.hp,enemy.maxHp);
}
{
 const a=arena('O16'),ally=a.add(0,700),p=a.fire();hit(a,p,ally);
 const children=a.b.projectiles.filter(q=>q.mode==='convergeSpirit');assert(children.length>=10);
 for(let i=0;i<300&&a.b.projectiles.length;i++)for(const q of [...a.b.projectiles])a.e.stepProjectile(q,C.STEP);
 assert(ally.hp<ally.maxHp,'convergence swept/terminal damage includes allies');
}
{
 const a=arena('O01');const hp=a.u.hp,p=a.fire();a.e.stepProjectile(p,C.STEP);assert.equal(a.u.hp,hp,'launch never collides with caster');assert(a.b.projectiles.includes(p));
 const echo=a.e.spawnSummon(a.u,'echo',600,1500,1,1);a.b.projectiles=[];a.b.phase='aim';a.u.acted=false;a.fire();const copy=a.b.projectiles.find(p=>p.echoSource===echo.id);assert(copy);assert(copy.hit.includes(echo.id),'echo emitter immune to own launch');assert(!copy.hit.includes(a.u.id),'no blanket friendly hit list');
}
{
 const a=arena('O08'),hidden=a.add(1,800,{spiritHidden:true}),p=a.fire();hit(a,p,hidden);assert(hidden.manifested,'manifest must still reveal hidden enemies');
}
console.log('PASS summoned ray, convergence, hidden-enemy manifest and caster/echo launch safety');
// Real objective wrappers retain special protection while permitting projectile HP loss.
for(const stage of [11,23]){
 const a=battlefield(g,stage),u=a.b.units.find(t=>t.side===0),t=C.makeUnit('knight',2,u.x+300,u.y,{id:'ff-protected',honroProtected:true,honroAlly:true,hp:20,maxHp:20,armor:0,shield:0});a.b.units.push(t);
 if(stage===11)g.HonroAct2.attach(a.app,a.e);else g.HonroAct3.attach(a.app,a.e);
 a.e.hurt(t,1000,u.id);assert.equal(t.hp,20,'non-projectile objective policy preserved');
 const p={id:888,mode:'arrow',skill:'A01',skillRank:1,owner:u.id,side:0,shot:1,damage:1000,body:false,vx:100,vy:0,launchX:u.x,launchY:u.y};a.e.hurt(t,1000,u.id,true,p);assert(t.dead,'projectile can defeat protected ally');
 const reason=stage===11?g.HonroAct2.failure(a.b):g.HonroAct3.failure(a.b);assert(reason,'existing mission failure notices protected ally death');
}
const main=await readFile(new URL('../shared/runtime/main.js',import.meta.url),'utf8');assert(main.includes('if(args[0]&&!e.projectileDamage(args[2]))'),'main coalition wrapper must permit projectile damage');
console.log('PASS protected ally death callbacks and retained special protection');
