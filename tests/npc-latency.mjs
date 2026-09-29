import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,checks=[];
function test(name,fn){const detail=fn();checks.push({name,detail});console.log('PASS',name);}
const json=x=>JSON.stringify(x);
let seed=71;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);

// Frozen narrow phase, predating the edge broad phase. Compare contacts exactly,
// including ordered ties and the original endpoint tolerance.
function referenceSegment(a,b,t,pad=0){
 if(!t.vertices?.length&&!t.slope)return C.segRect(a,b,t.x,t.y,t.w,t.h,pad);
 const pts=C.poly(t),dx=b.x-a.x,dy=b.y-a.y;let best=null;
 for(let i=0;i<pts.length;i++){
  const p=pts[i],q=pts[(i+1)%pts.length],ex=q.x-p.x,ey=q.y-p.y,len=Math.hypot(ex,ey);if(len<1e-8)continue;
  const nx=ey/len,ny=-ex/len;if(dx*nx+dy*ny>=-1e-8)continue;
  const px=p.x+nx*pad,py=p.y+ny*pad,den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)continue;
  const st=((px-a.x)*ey-(py-a.y)*ex)/den,et=((px-a.x)*dy-(py-a.y)*dx)/den;
  if(st>=-1e-8&&st<=1+1e-8&&et>=-1e-8&&et<=1+1e-8&&(!best||st<best.t))best={t:C.clamp(st,0,1),n:{x:nx,y:ny}};
 }return best;
}
test('Spatial surface lookup and polygon edge rejection preserve campaign contact results',()=>{
 let surfaces=0,segments=0;
 for(let stage=1;stage<=10;stage++){
  const {e,b}=battlefield(g,stage);
  for(const t of b.terrain.filter(t=>!t.broken).slice(0,30))for(let i=0;i<8;i++){
   const x=t.x+t.w*random(),y=C.topAt(t,x),span=i%2?5:400;
   assert.equal(json(e.surface(x,y-span,y+span)),json(C.terrainSurface(b.terrain,x,y-span,y+span)));surfaces++;
   const a={x:x-80+random()*160,y:y-100+random()*200},z={x:x-80+random()*160,y:y-100+random()*200};
   assert.equal(json(C.segmentTerrain(a,z,t,i)),json(referenceSegment(a,z,t,i)));segments++;
   for(const p of C.poly(t).slice(0,4)){
    const a={x:p.x,y:p.y-30},z={x:p.x,y:p.y+30};assert.equal(json(C.segmentTerrain(a,z,t,i)),json(referenceSegment(a,z,t,i)));segments++;
   }
  }
 }
 return {surfaces,segments};
});
test('Surface bins retain seams at bin boundaries and update after terrain changes',()=>{
 const {b,e}=battlefield(g,1);b.terrain=[{id:'left',x:0,y:100,w:319,h:500},{id:'right',x:321,y:100,w:300,h:500}];b.sceneVersion++;
 assert.equal(e.surface(320,96,105)?.y,100);b.terrain[1].y=120;b.sceneVersion++;assert.equal(e.surface(320,96,105),null);
 b.terrain.push({id:'bridge',x:317,y:90,w:8,h:5});assert.equal(e.surface(320,80,110)?.t.id,'bridge');
});
test('NPC planning budget counts only search work, shares a frame, and resets explicitly',()=>{
 const {e}=battlefield(g,1),old=g.performance;let clock=0,steps=0;
 function* search(){for(let i=0;i<5;i++){clock+=1;steps++;yield;}return 7;}
 try{g.performance={now:()=>clock};const work=search();e.planningBudget(2);clock+=200;assert.equal(e.continuePlanning(work),undefined);assert.equal(steps,2);
  clock+=100;assert.equal(e.continuePlanning(work),undefined);assert.equal(steps,2);e.planningBudget(2);e.continuePlanning(work);assert.equal(steps,4);e.planningBudget();assert.equal(e.continuePlanning(work).value,7);
 }finally{g.performance=old;}
});
test('Unreachable enemy fire is rejected conservatively, while every sampled hit remains reachable',()=>{
 const {e,b}=battlefield(g,8);b.width=12000;b.height=10000;b.terrain=[];b.sceneVersion++;b.waters=[];b.fields=[];b.drafts=[];b.wind=0;
 const u=C.makeUnit('knight',1,6000,2000,{id:'caster'}),target=C.makeUnit('archer',0,200,2000,{id:'target'});b.units=[u,target];
 assert.equal(e.npcShotInReach(u,C.SKILLS.HMO01),false);
 let endpoints=0;
 for(const id of ['HMO01','HMO02','HCR01','HB01'].filter(id=>C.SKILLS[id]))for(const wind of [-25,0,25])for(const angle of [15,55,125,175,240]){
  b.wind=wind;target.dead=true;const hit=e.predict(u,C.SKILLS[id],angle,.9,undefined,false);target.dead=false;Object.assign(target,{x:hit.x,y:hit.y+target.h*.5});
  assert(e.npcShotInReach(u,C.SKILLS[id]),`${id} ${angle} ${wind}`);endpoints++;
 }
 Object.assign(target,{x:100,y:100});b.physics.regions=[{id:'field'}];assert(e.npcShotInReach(u,C.SKILLS.HMO01));b.physics.regions=[];
 b.fields=[{kind:'attractor'}];assert(e.npcShotInReach(u,C.SKILLS.HMO01));b.fields=[];
 assert(e.npcShotInReach(u,C.SKILLS.M01),'special player skill falls back to prediction');
 return {endpoints};
});
test('Defending NPCs advance promptly; actual damage and player actions keep the full review',()=>{
 const {e,b}=battlefield(g,1),u=e.alive(1)[0];b.active=u.id;b.reviewDamage={};e.finishAction();assert.equal(b.reviewLeft,.18);
 b.reviewDamage={hero:42};e.finishAction();assert.equal(b.reviewLeft,C.ACTION_REVIEW_SECONDS);
 b.active=e.heroesAlive()[0].id;b.reviewDamage={};e.finishAction();assert.equal(b.reviewLeft,C.ACTION_REVIEW_SECONDS);
});
test('Blocked allied fire is bounded, never shoots through a wall, and resumes its queue',()=>{
 const {e,b,app}=battlefield(g,2);b.width=4000;b.height=2000;b.terrain=[{id:'floor',x:0,y:1500,w:4000,h:500,mat:'rock'},{id:'wall',x:950,y:-2000,w:200,h:3500,mat:'rock'}];b.sceneVersion++;b.fields=[];b.waters=[];b.drafts=[];b.zones=[];b.wind=0;
 const u=C.makeUnit('mage',2,700,1500,{id:'support',honroAlly:true,allyRole:'daoist',fixed:true,focus:999}),hero=C.makeUnit('archer',0,200,1500,{id:'hero',fixed:true}),target=C.makeUnit('archer',1,1400,1500,{id:'target',fixed:true});
 b.units=[u,hero,target];b.active=u.id;b.side=0;b.phase='ally';e.checkEnd=()=>false;
 const q=b.honroState.allyQueue={ids:[u.id],index:0,returnActive:hero.id,phase:'act',elapsed:0,started:false,targetId:target.id};
 let probes=0;const predict=e.predict.bind(e);e.predict=(...args)=>{probes++;return predict(...args);};
 g.HonroAllies.tick(app,e,C.STEP,()=>{});assert.equal(q.phase,'after');assert.equal(b.projectiles.length,0);assert(u.shield>0);assert(probes<=50);
 for(let i=0;i<23;i++)g.HonroAllies.tick(app,e,C.STEP,()=>{});assert(q.index===1);return {probes};
});
await mkdir('_local/reports/npc-action-latency',{recursive:true});await writeFile('_local/reports/npc-action-latency/unit.json',JSON.stringify({checks},null,2)+'\n');
