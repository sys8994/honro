// Six production-behaviour groups: swept faces, flight/guide, bounce, installation,
// descendants/phasing, and body/AI/save separation. No alternate physics solver.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,base=battlefield(g,11).b,rows=[];
const solid=(id,x,y,w,h,extra={})=>({id,x,y,w,h,mat:'rock',hp:99999,maxHp:99999,indestructible:true,...extra});
const floor=()=>solid('floor',0,1000,3600,1800);
const platform=(id='platform',y=760,h=70)=>solid(id,350,y,2600,h,{oneWay:true});
function arena(id='A01',terrain=[floor(),platform()]){
 const b=structuredClone(base),s=C.SKILLS[id],u=b.units.find(v=>v.side===0&&v.cls===s.cls);
 Object.assign(u,{x:800,y:1000,vx:0,vy:0,airborne:false,jumping:false,angle:75,lastPower:.6,loadout:[id],ranks:{[id]:1},focus:10000,maxFocus:10000,cooldowns:{},acted:false,retreat:false});
 Object.assign(b,{active:u.id,side:0,phase:'aim',width:3600,height:2800,units:[u],terrain,wind:0,waters:[],fields:[],zones:[],drafts:[],projectiles:[],stakes:[],volley:undefined});b.sceneVersion++;
 const e=new C.Engine(b);e.checkEnd=()=>false;return{b,e,u,s};
}
const at=(x,y)=>({x,y});
const near=(a,b,msg)=>assert(Math.abs(a-b)<.001,`${msg}: ${a} / ${b}`);
function shot(f,id,angle=75,power=.6){const {e,u}=f;u.angle=angle;u.lastPower=power;assert(e.fire(id,angle,power),`fire ${id}`);return f.b.projectiles[0];}
function trace(id,{terrain,angle=75,power=.6}={}){
 const f=arena(id,terrain),{b,e,u,s}=f,before=JSON.stringify(b),prediction=e.predict(u,s,angle,power);
 assert.equal(JSON.stringify(b),before,'guide mutated battle');
 const p=shot(f,id,angle,power),samples=[at(p.x,p.y)],hits=[],impact=e.impact.bind(e);
 e.impact=(p,h)=>{hits.push({id:p.id,mode:p.mode,terrain:h.terrain?.id,x:h.x,y:h.y,n:h.n});return impact(p,h);};
 for(let i=0;i<1600&&b.projectiles.includes(p);i++){e.stepProjectile(p,C.STEP);samples.push(at(p.x,p.y));}
 assert(!b.projectiles.includes(p),`${id} still flying`);
 const error=Math.hypot(prediction.x-p.x,prediction.y-p.y);assert(error<.1,`${id} guide/live error ${error}`);
 return{...f,p,prediction,samples,hits,error};
}
function check(name,fn){const details=fn();rows.push({name,details});console.log('PASS',name);}
check('Swept top-only entry handles slabs, side/corner, slopes, overlap and first of multiple layers',()=>{
 const flat=platform(),{e,u}=arena('A01',[flat]),hit=(a,b,r=3)=>e.projectileCollision(a,b,r,u.id,[],false);
 for(const [a,b] of [[at(800,950),at(800,600)],[at(800,810),at(800,790)],[at(800,790),at(800,750)],[at(300,790),at(600,790)],[at(500,757),at(600,757)],[at(800,760),at(800,800)],[at(800,761),at(800,900)]])assert.equal(hit(a,b),null);
 for(const [a,b,x] of [[at(800,600),at(800,1100),800],[at(340,600),at(360,900),350.46666666666664],[at(348,600),at(348,900),348]]){const h=hit(a,b);assert.equal(h?.terrain.id,'platform');near(h.y,757,'flat contact y');near(h.x,x,'flat contact x');near(h.n.y,-1,'top normal');}
 assert(e.collision(at(800,950),at(800,600),3,u.id,[],false),'generic collision remains solid');
 const slope=g.HonroMapEngine.solid('slope',[[400,850],[1400,600],[1400,660],[400,910]],{oneWay:true,indestructible:true});e.b.terrain=[slope];e.b.sceneVersion++;
 const sh=hit(at(550,730),at(1300,730));assert.equal(sh?.terrain.id,'slope');assert(sh.n.x<0&&sh.n.y<0,'horizontal shot meets sloped upper face');assert.equal(hit(at(800,840),at(800,650)),null);
 e.b.terrain=[platform('lower',810),platform('upper',650)];e.b.sceneVersion++;assert.equal(hit(at(800,500),at(800,950))?.terrain.id,'upper');
 assert.equal(hit(at(800,710),at(800,950))?.terrain.id,'lower','starting below upper cannot be recaught');
 return{flatCases:10,slopeNormal:sh.n,firstLayer:'upper',embeddedLayer:'lower'};
});
check('Actual upward flight clears the slab, reaches apex and matches arrow, qi, stake and summon guides',()=>{
 const details=[];for(const id of ['A01','M01','M07','O11','O13']){const t=trace(id);assert(t.samples.some(p=>p.y<754),id+' must clear top');assert.equal(t.hits[0]?.terrain,'platform');assert(t.hits[0].n.y<0);assert(t.samples.length>20);if(id==='M07')assert.equal(t.b.stakes.length,1);if(id.startsWith('O')){const summon=t.b.units.find(u=>u.summoned);assert(summon);near(summon.y,760,'summon support');}details.push({id,error:t.error,firstHit:t.hits[0],samples:t.samples.length});}return details;
});
check('Reflected waves share guide/live top contacts and still reflect from solid sides and ceilings',()=>{
 const details=[];for(const id of ['M11','M12']){const t=trace(id);assert(t.hits.length>=2,id+' reflected contacts');assert(t.hits.every(h=>h.terrain==='platform'&&h.n.y<0));assert.equal(t.prediction.contacts.length,t.hits.length);for(let i=0;i<t.hits.length;i++){near(t.prediction.contacts[i].x,t.hits[i].x,'bounce x');near(t.prediction.contacts[i].y,t.hits[i].y,'bounce y');}details.push({id,error:t.error,contacts:t.hits.length});}
 for(const [name,terrain,a,v,n] of [['ceiling',solid('ceiling',350,700,2000,70),at(800,900),at(0,-1500),'y'],['wall',solid('wall',1000,0,80,1100),at(800,800),at(1500,0),'x']]){const f=arena('M11',[floor(),terrain]),p=shot(f,'M11');Object.assign(p,a,{vx:v.x,vy:v.y,gravityScale:0,drag:0});f.e.stepProjectile(p,.2);assert.equal(p.bounces,1,name);assert(n==='y'?p.vy>0:p.vx<0);details.push({solid:name,bounces:p.bounces});}return details;
});
check('Ground installations keep the actual first valid top when an ignored slab is close overhead',()=>{
 const details=[];for(const id of ['M07','O11','O13']){const f=arena(id,[floor(),platform('upper',700,15),platform('lower',750,15)]),p=shot(f,id);Object.assign(p,{x:900,y:722,vx:0,vy:600,gravityScale:0,drag:0});f.e.stepProjectile(p,.1);assert(!f.b.projectiles.includes(p));const installed=id==='M07'?f.b.stakes[0]:f.b.units.find(u=>u.summoned);assert(installed);near(installed.y,750,'installation stays on lower hit surface');details.push({id,y:installed.y});}return details;
});
check('Spread, emitted fragments and split arrows use the same rule; authored phasing remains',()=>{
 const details=[];
 for(const id of ['A04','A15','M06','M02','A08']){
  const f=arena(id),p=shot(f,id);let children;
  if(id==='A04')children=[...f.b.projectiles];
  else if(id==='A15'){C.splitSeven(f.e,p);children=[...f.b.projectiles];}
  else if(id==='M02'){assert(C.detonateIceGourd(f.e));children=[...f.b.projectiles];}
  else{f.e.impact(p,{x:900,y:754,t:0,n:at(0,-1),terrain:f.b.terrain[1]});if(id==='A08')f.e.stepProjectile(p,.01);children=f.b.projectiles.filter(q=>q.child);}
  assert(children.length>0,id+' actual generated children');
  for(const q of children){Object.assign(q,{x:900,y:810,vx:0,vy:-1500,gravityScale:0,drag:0,maxAge:2});f.e.stepProjectile(q,.1);assert(f.b.projectiles.includes(q),id+' child crosses underside');assert(q.y<754);Object.assign(q,{x:900,y:730,vy:600});f.e.stepProjectile(q,.1);assert(!f.b.projectiles.includes(q),id+' child impacts upper surface');}details.push({id,children:children.length});
 }
 for(const id of ['O02','O04']){const f=arena(id),p=shot(f,id);Object.assign(p,{x:900,y:600,vx:0,vy:1800,gravityScale:0,drag:0});f.e.stepProjectile(p,.1);assert(f.b.projectiles.includes(p));assert(p.y>760);details.push({id,phase:p.phaseMode});}return details;
});
check('Muzzle, homing acquisition, saved flight and body/generic checks remain independently consistent',()=>{
 const f=arena('A01'),{e,u,b}=f;u.y=845;assert.deepEqual(e.projectileOrigin(u,C.SKILLS.A01,90),e.origin(u,90),'muzzle is not clamped under platform');u.y=1000;
 const foe=structuredClone(u);Object.assign(foe,{id:'upper-foe',side:1,x:920,y:750,h:70});b.units.push(foe);
 const velocity=e.steer(900,850,400,0,u,.1);assert(velocity.vy<0,'homing can acquire through underside');
 const p=shot(f,'A01');Object.assign(p,{x:900,y:800,vx:0,vy:-300,gravityScale:0,drag:0});b.units=[u];
 const saved=JSON.parse(JSON.stringify(b)),restored=new C.Engine(saved),q=saved.projectiles[0];for(let i=0;i<25;i++){e.stepProjectile(p,C.STEP);restored.stepProjectile(q,C.STEP);assert.equal(b.projectiles.includes(p),saved.projectiles.includes(q));near(p.y,q.y,'saved flight y');}assert(p.y<754);assert(!('platformState' in p));
 assert.equal(e.projectileCollision(at(800,700),at(800,900),3,u.id,[],false,['platform']),null,'existing skip list');
 assert.equal(e.projectileCollision(at(800,700),at(800,900),3,u.id,[],false,[],false),null,'phase terrain flag');
 return{muzzle:'passes underside',homing:velocity,savedFrames:25,bodyPolicy:'generic collision unchanged'};
});
await mkdir('_local/reports/projectile-platforms',{recursive:true});await writeFile('_local/reports/projectile-platforms/unit.json',JSON.stringify({rows,limits:['Production engine fixtures and real fire/step/impact paths.','Browser input, authored campaign completion and final deployment are separate checks.']},null,2)+'\n');console.log(`PASS ${rows.length} projectile-platform behaviour groups`);
