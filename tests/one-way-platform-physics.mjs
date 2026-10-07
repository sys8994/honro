// Shared body solver and projectile collision; actual force/HP paths, no mocks.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,template=battlefield(g,11).b,rows=[];
const solid=(id,x,y,w,h,extra={})=>({id,x,y,w,h,mat:'rock',hp:99999,maxHp:99999,indestructible:true,...extra});
function fixture(cls,terrain,x=500,y=1000){const b=structuredClone(template),u=b.units.find(u=>u.side===0&&u.cls===cls);Object.assign(u,{x,y,vx:0,vy:0,jumping:false,airborne:false,fallApexY:undefined,impactCooldown:0,acted:false});b.units=[u];b.active=u.id;b.phase='aim';b.side=0;b.terrain=terrain;b.width=2400;b.height=3000;b.waters=[];b.sceneVersion++;const e=new C.Engine(b);e.checkEnd=()=>false;return{b,e,u};}
const floor=()=>solid('floor',0,1000,2000,2000);
for(const cls of ['archer','mage','knight','occultist'])for(const dt of [1/240,1/120,1/60,1/30,.08]){
 // Ordinary jump vs. an external upward impulse at the SAME starting velocity.
 // impulse clears the existing jumping flag, so no new saved state is needed.
 for(const external of [false,true]){
  const roof=solid('real-cave-roof',0,800,1800,60),{e,u}=fixture(cls,[floor(),roof]),hp=u.hp,budget=u.moveLeft;
  assert(e.jump(u));assert.equal(u.moveLeft,budget-e.jumpCost(u));const velocity=u.vy;
  if(external){e.impulse(u,0,-600);assert(!u.jumping);assert.equal(u.vy,velocity,'Same velocity, different source');}
  let highestHead=u.y-u.h;for(let n=0;n<Math.ceil(3/dt);n++){e.integrateBody(u,dt);highestHead=Math.min(highestHead,u.y-u.h);}
  assert(highestHead>=859,'A real cave roof still blocks the head');assert.equal(u.y,1000);assert(e.grounded(u));
  if(external)assert(u.hp<hp,'Upward knockback ceiling impact keeps damage');else assert.equal(u.hp,hp,'Voluntary ceiling bump is harmless');
  rows.push({cls,dt,kind:external?'upward impulse ceiling':'voluntary jump ceiling',damage:hp-u.hp,highestHead});
 }
 // Horizontal wall impacts remain damaging and cannot pass through the wall.
 {const {e,u}=fixture(cls,[floor(),solid('wall',600,700,100,400)],580,1000),hp=u.hp;e.impulse(u,480,0);for(let n=0;n<Math.ceil(1/dt);n++)e.integrateBody(u,dt);assert(u.x<600);assert(u.hp<hp);rows.push({cls,dt,kind:'horizontal wall impulse',damage:hp-u.hp});}
 // The existing measured-drop rule still damages a 15 m fall (900 units).
 {const {e,u}=fixture(cls,[floor()],500,100),hp=u.hp;for(let n=0;n<Math.ceil(5/dt);n++)e.integrateBody(u,dt);assert.equal(u.y,1000);assert(u.hp<hp);rows.push({cls,dt,kind:'height-based fall',damage:hp-u.hp});}
 // High-speed swept ascent, including the slab's side/corner, then downward
 // contact. Generic solid queries and projectile top-entry policy remain separate.
 for(const diagonal of [false,true]){
  const platform=solid('one-way',300,700,1000,40,{oneWay:true}),{e,u}=fixture(cls,[floor(),platform],diagonal?285:500,940),hp=u.hp;
  u.vy=-1900;u.vx=diagonal?480:0;u.jumping=true;let above=false;
  for(let n=0;n<Math.ceil(.5/dt);n++){e.integrateBody(u,dt);above||=u.y<700;}
  assert(above,'Fast ascent passes underside/corner');assert.equal(u.hp,hp);
  const hit=e.collision({x:700,y:900},{x:700,y:500},3,u.id,[],false);assert.equal(hit?.terrain?.id,'one-way','Generic collision still sees the same slab');assert.equal(e.projectileCollision({x:700,y:900},{x:700,y:500},3,u.id,[],false),null,'Projectiles pass upward');assert.equal(e.projectileCollision({x:700,y:500},{x:700,y:900},3,u.id,[],false)?.terrain?.id,'one-way','Projectiles hit from above');
  Object.assign(u,{x:700,y:650,vy:1900,vx:0,jumping:false,fallApexY:650});for(let n=0;n<Math.ceil(.5/dt);n++)e.integrateBody(u,dt);assert.equal(u.y,700,'Swept feet land even at high downward speed');assert(e.grounded(u));assert.equal(u.hp,hp,'Short drop is harmless despite its artificial high speed');
  rows.push({cls,dt,kind:diagonal?'corner sweep and landing':'vertical sweep and landing',projectileTopOnly:true});
 }
 // A sloped one-way top is still a walkable support after downward crossing.
 {const platform=g.HonroMapEngine.solid('slope',[[300,800],[1300,550],[1300,590],[300,840]],{oneWay:true,indestructible:true}),{e,u}=fixture(cls,[floor(),platform],700,900),hp=u.hp;u.vy=-900;u.jumping=true;let above=false;for(let n=0;n<Math.ceil(2.5/dt);n++){e.integrateBody(u,dt);above||=u.y<700;}assert(above);assert.equal(u.y,700);assert.equal(u.hp,hp);const x=u.x;for(let n=0;n<Math.ceil(.25/dt);n++){e.walk(u,1,dt);e.integrateBody(u,dt);}assert(u.x>x);assert(e.grounded(u));rows.push({cls,dt,kind:'sloped platform ascent landing and walk'});}
}
await mkdir('_local/reports/one-way',{recursive:true});await writeFile('_local/reports/one-way/physics.json',JSON.stringify({rows,limits:['Synthetic geometry fixtures use production physics.','High-speed cases test swept collision rather than reachable player jump height.','Browser input and combat completion are separate checks.']},null,2)+'\n');console.log(`PASS ${rows.length} one-way/cave/impulse/wall/fall physics conditions`);
