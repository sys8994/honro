import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,template=battlefield(g,1).b;let count=0;
const rock=(id,x,y,w,h,vertices)=>({id,x,y,w,h,vertices,mat:'rock',hp:99999,maxHp:99999});
function arena(terrain,x=400,y=1000){const b=structuredClone(template),u=C.makeUnit('knight',0,x,y,{id:'sweep-probe',loadout:['S15'],focus:10000,maxFocus:10000,ranks:{S01:8,S06:8,S04:8,S15:8,S13:8},acted:false,moveLeft:10000,maxMove:10000});Object.assign(b,{width:3000,height:2800,units:[u],active:u.id,phase:'aim',side:0,wind:0,terrain,waters:[],drafts:[],fields:[],projectiles:[]});b.sceneVersion++;return{b,u,e:new C.Engine(b)};}
function clear(q,label){for(const t of q.b.terrain)if(!t.broken&&!t.oneWay)for(const y of [q.u.y-.2,q.u.y-q.u.h*.5,q.u.y-q.u.h+7])assert(!C.terrainContains(t,q.u.x,y),`${label}: body inside ${t.id} at ${q.u.x},${q.u.y}`);}
function cast(q,id,angle,dt){q.u.loadout=[id];assert(q.e.fire(id,angle,1,id.startsWith('LS')));let steps=0;while(q.b.projectiles.length&&steps++<2500){q.e.stepProjectile(q.b.projectiles[0],dt);clear(q,`${id}/${angle}/${dt}/${steps}`);}assert(steps<2500);clear(q,'land');for(let i=0;i<120;i++){q.e.integrateBody(q.u,1/120,true);clear(q,'settle');}count++;}
for(const slope of [.5,1,2,4])for(const direction of [-1,1])for(const dt of [1/240,1/120,1/30,.08])for(const id of ['S01','S06','S04','S15','S13']){
 let vertices=[{x:500,y:1000},{x:900,y:1000-400*slope},{x:900,y:2600},{x:500,y:2600}];let flat=rock('floor',0,1000,500,1600),x=400;
 if(direction<0){vertices=vertices.map(p=>({x:1400-p.x,y:p.y})).reverse();flat=rock('floor',900,1000,500,1600);x=1000;}
 const q=arena([flat,rock('ramp',500,1000-400*slope,400,1600+400*slope,vertices)],x);cast(q,id,direction>0?0:180,dt);
}
console.log('PASS 160 slope/body skill/dt/direction combinations',count);
// Thin slabs between the old discrete probes, plus high-speed knockback.
for(const dt of [1/120,.08])for(const speed of [900,9000]){
 const q=arena([rock('floor',0,1500,2500,1000),rock('thin',500,975,80,2)],400,1000);q.u.vx=speed;q.u.vy=0;
 for(let i=0;i<30;i++){q.e.integrateBody(q.u,dt,true);clear(q,'thin slab knockback');}assert(q.u.x<500);count++;
}
// Same polygon contains floor AND a too-low ceiling: never exclude the whole support.
{
 const v=[{x:0,y:700},{x:1000,y:700},{x:1000,y:1300},{x:0,y:1300},{x:0,y:1000},{x:800,y:1000},{x:800,y:940},{x:0,y:940}];
 const q=arena([rock('connected-room',0,700,1000,600,v),rock('from',1800,1000,700,1000)],2000);
 q.b.stakes=[{id:1,skill:'M09',side:0,x:2000,y:1000,owner:q.u.id,rank:1},{id:2,skill:'M09',side:0,x:500,y:1000,owner:q.u.id,rank:1}];assert.equal(q.e.useGate(),false);assert.equal(q.u.x,2000);count++;
}
console.log('PASS shared body sweep and connected gate clearance',count);

for(const id of ['LS01','LS02','LS03','LS04','LS05','LS06','LS07','LS13','LS15'])for(const angle of [0,35]){
 const q=arena([rock('floor',0,1000,500,1600),rock('ramp',500,600,400,2000,[{x:500,y:1000},{x:900,y:600},{x:900,y:2600},{x:500,y:2600}])]);cast(q,id,angle,1/120);
}
// A fast landing stops at its swept contact, not the far end of that timestep.
{
 const q=arena([rock('ramp',500,600,400,2000,[{x:500,y:1000},{x:900,y:600},{x:900,y:2600},{x:500,y:2600}])],400,900);
 Object.assign(q.u,{vx:9000,vy:1500,jumping:true});const from=q.u.x;q.e.integrateBody(q.u,.08,true);clear(q,'fast landing');assert(q.u.x>from&&q.u.x<600);count++;
}
console.log('PASS legacy body skills and first-contact landing',count);
