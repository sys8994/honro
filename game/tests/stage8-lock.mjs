import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {runtime,battlefield,gameRoot} from './helpers.mjs';
const g=await runtime(),C=g.HONRO_CORE,checks=[];
const check=(name,fn)=>{const detail=fn();checks.push({name,passed:true,detail});};
const inside=(b,u)=>g.HonroCombatStatus.embedded(b,u);
try{
for(const cls of ['archer','mage'])for(const dt of [1/240,1/120,1/30,.06])check(`${cls}: knockback at the stage 8 middle ledge, dt ${dt}`,()=>{
 const {b,e}=battlefield(g,8),u=b.units.find(u=>u.side===0&&u.cls===cls);b.units=[u];b.active=u.id;
 Object.assign(u,{x:6736.5,y:1722,vx:350,vy:-250,jumping:false,airborne:false});
 for(let i=0;i<Math.ceil(10/dt);i++){e.integrateBody(u,dt,true);assert.equal(inside(b,u),false,`entered solid at ${u.x}/${u.y}`);}
 assert.ok(e.grounded(u));const x=u.x;e.walk(u,-1,1/30);assert.ok(u.x<x);assert.ok(e.fire(cls==='archer'?'A01':'M01',70,.5));return {x:u.x,y:u.y};
});
check('Stage 8 exposed terrain: jumps and knockback settle outside the solid union',()=>{
 const {b,e}=battlefield(g,8),u=e.active;b.units=[u];let cases=0,edgeExits=0;
 const top=x=>Math.min(...b.terrain.filter(t=>!t.broken&&x>=t.x&&x<=t.x+t.w).map(t=>C.topAt(t,x)));
 for(const t of b.terrain)for(const ratio of [.01,.1,.5,.9,.99])for(const dir of [-1,1])for(const motion of ['jump','knock']){
  const x=t.x+t.w*ratio,y=C.topAt(t,x);if(y>top(x)+.1)continue;
  Object.assign(u,{x,y,vx:motion==='knock'?dir*350:0,vy:motion==='knock'?-250:0,jumping:false,airborne:false,moveLeft:1e6});if(motion==='jump')e.jump(u);let exit=false;
  for(let n=0;n<1200;n++){if(motion==='jump'&&n<65)e.walk(u,dir,1/120);if(!e.integrateBody(u,1/120,true)){exit=true;edgeExits++;break;}assert.equal(inside(b,u),false,`${t.id}/${ratio}/${dir}/${motion}: ${u.x},${u.y}`);}
  if(!exit)assert.ok(e.grounded(u),`${t.id}: never settled`);cases++;
 }
 return {cases,edgeExits};
});
check('Feet below a short ledge hit its wall from either direction',()=>{
 for(const direction of [-1,1]){const {b,e}=battlefield(g,8),u=e.active;b.units=[u];b.width=3000;
  b.terrain=[{id:'floor',x:0,y:1200,w:3000,h:2200,mat:'rock'},{id:'ledge',x:1000,y:1100,w:1000,h:2200,mat:'rock'}];b.sceneVersion++;
  Object.assign(u,{x:direction>0?998:2002,y:1104,vx:direction*360,vy:0,jumping:false,airborne:false});
  for(let n=0;n<500;n++){e.integrateBody(u,1/120,true);assert.equal(inside(b,u),false);}
  assert.ok(e.grounded(u));assert.ok(direction>0?u.x<1000:u.x>2000);
 }
});
check('Revision 1 saves recover both trapped heroes without healing or resetting progress',()=>{
 const {b,e}=battlefield(g,8);b.honroContactRevision=1;b.round=6;const heroes=b.units.filter(u=>u.side===0&&['archer','mage'].includes(u.cls));
 for(const [i,u] of heroes.entries())Object.assign(u,{x:7151+i*120,y:1708,vx:0,vy:0,hp:100,focus:12,moveLeft:55,bound:1,acted:false});
 const stats=JSON.stringify(heroes.map(u=>[u.hp,u.focus,u.moveLeft,u.bound,u.acted])),ledger=JSON.stringify([b.heroes,b.honroGrowth,b.honroState]);
 g.HonroStageRules.sanitizeStageBattle(b);assert.equal(b.honroContactRevision,2);
 for(const u of heroes){assert.equal(inside(b,u),false);assert.ok(e.grounded(u));}
 assert.equal(JSON.stringify(heroes.map(u=>[u.hp,u.focus,u.moveLeft,u.bound,u.acted])),stats);assert.equal(JSON.stringify([b.heroes,b.honroGrowth,b.honroState]),ledger);
 const once=JSON.stringify(b);g.HonroStageRules.sanitizeStageBattle(b);assert.equal(JSON.stringify(b),once);
});
check('Real stun survives consumption as a visible current-turn reason, then expires',()=>{
 const {b,e}=battlefield(g,8),u=e.active;e.stun(u);assert.match(g.HonroCombatStatus.effects(b,u)[0],/다음 행동 1회/);e.newRound();
 assert.equal(u.stun,0);assert.equal(u.acted,true);assert.equal(u.stunnedRound,b.round);assert.match(g.HonroCombatStatus.reason(e,u,C.SKILLS.A01),/기절로 이번 턴 행동 불가/);
 assert.equal(e.select(u.id),false);e.newRound();assert.equal(u.acted,false);assert.ok(!g.HonroCombatStatus.effects(b,u).some(s=>s.includes('기절')));
});
check('Later invalid saves recover too, while an active body projectile keeps control of its owner',()=>{
 const {b,e}=battlefield(g,8),u=e.active;b.honroContactRevision=2;Object.assign(u,{x:7151,y:1708,vx:0,vy:0,airborne:true});b.projectiles=[{id:9,owner:u.id,body:true}];
 const before=JSON.stringify(u);g.HonroStageRules.sanitizeStageBattle(b);assert.equal(JSON.stringify(u),before);
 b.projectiles=[];u.airborne=false;g.HonroStageRules.sanitizeStageBattle(b);assert.equal(inside(b,u),false);assert.ok(e.grounded(u));
});
check('Binding reduces movement but does not falsely disable shooting',()=>{
 const {b,e}=battlefield(g,8),u=e.active;u.bound=2;e.newRound();b.active=u.id;assert.equal(u.moveLeft,u.maxMove*.45);assert.match(g.HonroCombatStatus.effects(b,u)[0],/결박 2회/);assert.equal(g.HonroCombatStatus.reason(e,u,C.SKILLS.A01),'이동·발사 가능');assert.ok(e.fire('A01',70,.5));
});
check('Action explanations distinguish resources, cooldown, jumping and completed actions',()=>{
 const {b,e}=battlefield(g,8),u=e.active,sk=C.SKILLS.A01;u.focus=-1;assert.match(g.HonroCombatStatus.reason(e,u,sk),/기력 부족/);u.focus=999;u.cooldowns={A01:b.round+2};assert.match(g.HonroCombatStatus.reason(e,u,sk),/재사용 대기/);u.cooldowns={};u.moveLeft=0;assert.match(g.HonroCombatStatus.reason(e,u,sk),/이동력 소진/);u.jumping=true;assert.match(g.HonroCombatStatus.reason(e,u,sk),/착지 후/);u.jumping=false;u.acted=true;assert.match(g.HonroCombatStatus.reason(e,u,sk),/행동 완료/);b.side=1;b.phase='enemy';assert.match(g.HonroCombatStatus.reason(e,u,sk),/적군 턴/);
});
}catch(e){checks.push({name:e.message,passed:false,stack:e.stack});process.exitCode=1;console.error(e);}
await writeFile(gameRoot+'/reports/stage8-lock.json',JSON.stringify({checks},null,2)+'\n');console.log(`${checks.filter(c=>c.passed).length}/${checks.length} stage 8 contact and status checks passed`);
