import assert from 'node:assert/strict';
import {battlefield,runtime} from '../game/tests/helpers.mjs';

const g=await runtime({legacyMaps:false,productionStory:true}),C=g.HONRO_CORE;
const stages=new Map([1,12,15,22].map(n=>[n,battlefield(g,n).b]));
const classes=['archer','mage','knight','occultist'],steps=[1/240,1/120,1/60,1/30];
function fixture(stage,cls,x,y){
 const b=structuredClone(stages.get(stage)),e=new C.Engine(b);
 const support=e.contactSurface(x,y-4,y+4);
 assert(support,`missing support at stage ${stage}, x${x}`);
 const u=C.makeUnit(cls,0,x,support.y,{id:'walk-join-probe',moveLeft:1500,maxMove:1500});
 b.units=[u];b.active=u.id;b.side=0;b.phase='aim';
 return {b,e,u};
}
function walk({e,u},target,dt,requireSupport=false){
 const direction=Math.sign(target-u.x),start=u.x;
 for(let i=0;i<Math.ceil(.6/dt)&&(u.x-target)*direction<0;i++){
  e.walk(u,direction,dt,requireSupport);e.integrateBody(u,dt,true);
  assert(!u.jumping && e.grounded(u));
  assert(!e.b.terrain.some(t=>!t.broken&&!t.oneWay&&C.terrainContains(t,u.x,u.y-.2)));
 }
 return Math.abs(u.x-start);
}
for(const cls of classes)for(const dt of steps){
 for(const [stage,x,y,target] of [[1,4188,864.8,4212],[1,4212,861.127,4188],[15,3176,2045.736,3153.5]]){
  const q=fixture(stage,cls,x,y),hp=q.u.hp,budget=q.u.moveLeft;
  const distance=walk(q,target,dt,true);
  assert(distance>=Math.abs(x-target),`stage ${stage}, ${cls}, dt ${dt}: blocked at x${q.u.x}`);
  assert(q.u.moveLeft<=budget-distance+1e-6);assert.equal(q.u.hp,hp);
  const resumed=new C.Engine(JSON.parse(JSON.stringify(q.b)));
  assert.equal(resumed.active.x,q.u.x);assert(resumed.grounded(resumed.active));
 }
}
for(const cls of classes)for(const [x,target] of [[3702,3725],[3830,3800],[3830,3860],[3941,3970],[3970,3941],[4180,4210],[4210,4180]]){
 const b=stages.get(12),ramp=b.terrain.find(t=>t.id==='sq-lower-ground'),q=fixture(12,cls,x,C.topAt(ramp,x)),hp=q.u.hp;
 assert(walk(q,target,1/120,true)>=Math.abs(target-x),`Stage 12 sign ramp: ${cls} ${x}→${target}`);
 assert.equal(q.u.hp,hp);
 const resumed=new C.Engine(JSON.parse(JSON.stringify(q.b)));assert(resumed.grounded(resumed.active));
}
for(const angle of [59,60,61])for(const dir of [-1,1]){
 const q=fixture(1,'archer',4188,864.8),slope=Math.tan(angle*Math.PI/180)*dir;
 const ramp={id:'angle-probe',x:4100,y:850,w:200,h:600,mat:'rock',hp:99999,maxHp:99999,slope:slope*200};
 q.b.terrain=[ramp];q.b.sceneVersion++;q.u.y=C.topAt(ramp,q.u.x);
 const target=q.u.x-25*dir,distance=walk(q,target,1/120,true);
 assert(angle<=60?distance>=25:distance===0,`expected ${angle}° support in direction ${-dir}, moved ${distance}`);
}
const steep=fixture(15,'archer',5280,2035.32);
assert.equal(walk(steep,5310,1/120),0,'a steep face still requires a jump');
assert(steep.e.jump(steep.u));
const door=fixture(22,'archer',1290,5300);
walk(door,1350,1/120);
assert(door.u.x<1318,'the sealed lower archive door must still block travel');
for(const [x,target] of [[1526,1550],[1594,1570]]){
 const gallery=fixture(22,'archer',x,3255);
 assert(walk(gallery,target,1/120,true)>=Math.abs(x-target),'the lip above the gate must not block gallery travel');
}
const gap=fixture(1,'archer',4188,864.8);
const slab=(id,x,w)=>({id,x,y:1000,w,h:150,mat:'rock',hp:99999,maxHp:99999});
gap.b.terrain=[slab('left',4000,200),slab('right',4210,100)];
gap.b.sceneVersion++;gap.u.y=1000;
walk(gap,4230,1/120,true);
assert(gap.u.x<=4200,'a real open span must still break ground support');
console.log('PASS 50 terrain joins + 28 Stage 12 slope cases, four body sizes, four time steps, save contacts, steep face, sealed door, and open span');
