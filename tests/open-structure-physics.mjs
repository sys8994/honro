// Every canonical one-way collider is exercised through production physics.
// Isolated authored geometry probes are not full-route or browser evidence.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,base=battlefield(g,11).b,rows=[];
const near=(a,b,label)=>assert(Math.abs(a-b)<.02,`${label}: ${a} != ${b}`);
function fixture(t,cls='archer'){
 const b=structuredClone(base),u=structuredClone(base.units.find(u=>u.side===0&&u.cls===cls));
 Object.assign(b,{units:[u],active:u.id,side:0,phase:'aim',terrain:[structuredClone(t),{id:'probe-floor',x:0,y:t.y+t.h+300,w:Math.max(2400,t.x+t.w+500),h:1000,mat:'rock',indestructible:true,hp:99999,maxHp:99999}],worldTerrain:undefined,width:Math.max(2400,t.x+t.w+500),height:Math.max(4000,t.y+t.h+1500),waters:[],fields:[],zones:[],drafts:[],projectiles:[],stakes:[],wind:0});b.sceneVersion++;
 Object.assign(u,{vx:0,vy:0,jumping:false,airborne:false,acted:false,focus:10000,maxFocus:10000,cooldowns:{},impactCooldown:0,fallApexY:undefined});
 const e=new C.Engine(b);e.checkEnd=()=>false;return{b,e,u,t:b.terrain[0]};
}
function sample(t){
 const edges=C.poly(t).map((a,i,v)=>({a,z:v[(i+1)%v.length]})).filter(({a,z})=>z.x-a.x>20&&Math.abs((z.y-a.y)/(z.x-a.x))<=1.35).sort((a,b)=>(b.z.x-b.a.x)-(a.z.x-a.a.x));
 assert(edges.length,`${t.id}: no walkable top`);const {a,z}=edges[0],x=(a.x+z.x)/2;return{x,y:C.topAt(t,x)};
}
for(let stage=1;stage<=30;stage++){
 const {b}=battlefield(g,stage);
 for(const original of b.terrain.filter(t=>t.oneWay&&!t.broken)){
  assert(!original.honroCeiling,`${stage}/${original.id}: actual cave ceiling cannot be one-way`);
  const {x,y}=sample(original),bottom=original.y+original.h,body=[];
  const q=fixture(original),r=3,above={x,y:original.y-100},below={x,y:bottom+100};
  assert.equal(q.e.projectileCollision(below,above,r,q.u.id,[],false),null,`${stage}/${original.id}: upward sweep`);
  const hit=q.e.projectileCollision(above,below,r,q.u.id,[],false);
  assert.equal(hit?.terrain.id,original.id,`${stage}/${original.id}: fast downward sweep`);assert(hit.n.y<0);
  assert(q.e.collision(below,above,r,q.u.id,[],false),`${original.id}: generic geometry stays intact`);
  for(const cls of ['archer','mage','knight','occultist']){
   const {e,u}=fixture(original,cls),start=Math.max(bottom+u.h+20,y+u.h+60),hp=u.hp;
   Object.assign(u,{x,y:start,vy:-6000,jumping:true});e.integrateBody(u,(start-y+80)/6000);
   assert(u.y<y,`${stage}/${original.id}/${cls}: upward body passage`);assert.equal(u.hp,hp);
   Object.assign(u,{x,y:y-40,vy:6000,vx:0,jumping:false,fallApexY:y-40});e.integrateBody(u,.05);
   near(u.y,y,`${stage}/${original.id}/${cls}: downward landing`);assert(e.grounded(u));assert.equal(u.hp,hp);
   body.push(cls);
  }
  const skills=[];
  for(const id of ['A01','M01','M07','O11','O13']){
   const s=C.SKILLS[id],{b,e,u}=fixture(original,s.cls);Object.assign(u,{x,y:bottom+300,loadout:[id],ranks:{[id]:1}});
   assert(e.fire(id,90,.5),`${id}: fire`);const p=b.projectiles[0],hits=[],blasts=[],impact=e.impact.bind(e),blast=e.blast.bind(e);
   e.impact=(p,h)=>{hits.push(h);return impact(p,h);};e.blast=(x,y,...args)=>{blasts.push({x,y});return blast(x,y,...args);};
   Object.assign(p,{x,y:bottom+30,vx:0,vy:-10000,gravityScale:0,drag:0});e.stepProjectile(p,(bottom-original.y+100)/10000);
   assert(b.projectiles.includes(p),`${stage}/${original.id}/${id}: upward live projectile survives`);assert(p.y<original.y);
   Object.assign(p,{x,y:original.y-80,vx:0,vy:10000,gravityScale:0,drag:0});e.stepProjectile(p,(bottom-original.y+180)/10000);
   assert.equal(hits[0]?.terrain?.id,original.id,`${stage}/${original.id}/${id}: live upper contact`);assert(hits[0].n.y<0);
   assert(!b.projectiles.includes(p),`${id}: impact consumed projectile`);
   if(id==='M01'){assert(blasts.length);near(blasts[0].y,hits[0].y,'blast remains on roof');}
   if(id==='M07'){assert.equal(b.stakes.length,1);near(b.stakes[0].y,y,'stake remains on roof');}
   if(id==='O11'||id==='O13'){const summon=b.units.find(v=>v.summoned);assert(summon);near(summon.y,y,'summon remains on roof');}
   skills.push(id);
  }
  rows.push({stage,id:original.id,element:original.honroElementId||null,x,y,body,skills});
 }
}
assert(rows.length>0);
await mkdir('_local/reports/open-structure',{recursive:true});await writeFile('_local/reports/open-structure/physics.json',JSON.stringify({rows,scope:'Every canonical one-way collider, four production body shapes and five actual projectile/impact skill paths. Geometry is isolated without altering its contour. Forced high speed tests collision, not player-reachable jump height. Existing projectile-platforms/one-way-platform-physics cover slopes, sides, bounce, phasing, saves and solid controls. Browser rendering and normal campaign routes are separate.'},null,2)+'\n');
console.log(`PASS ${rows.length} authored one-way colliders: ${rows.length*4} body ascent/landing and ${rows.length*5} live skill flight/impact pairs`);
