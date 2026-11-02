/** Physics-only invalidation, not a renderer benchmark or passenger transport proof. */
import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,base=battlefield(g,11).b;
const plain=x=>JSON.parse(JSON.stringify(x));
function fixture(vertices=false){
 const b=plain(base),u=b.units.find(u=>u.side===0);
 const deck={id:'moving-deck',x:100,y:800,w:160,h:30,mat:'wood',hp:9999,maxHp:9999,indestructible:true,oneWay:true};
 if(vertices){deck.vertices=[];for(let i=0;i<10;i++)deck.vertices.push({x:100+i*16,y:800});for(let i=0;i<10;i++)deck.vertices.push({x:260,y:800+i*3});for(let i=0;i<10;i++)deck.vertices.push({x:260-i*16,y:830});for(let i=0;i<10;i++)deck.vertices.push({x:100,y:830-i*3});}
 Object.assign(u,{x:180,y:800,vx:0,vy:0,airborne:false,jumping:false,acted:false});Object.assign(b,{terrain:[deck],units:[u],active:u.id,side:0,phase:'aim',width:4000,height:3000,waters:[],drafts:[],projectiles:[]});
 const e=new C.Engine(b,()=>{});e.checkEnd=()=>false;return{b,e,u,deck};
}
const support=(e,x)=>e.contactSurface(x,799,801)?.t.id;
const ray=(e,x)=>e.projectileCollision({x,y:700},{x,y:900},0,'fixture',[],false)?.terrain?.id;
let cases=0;
for(const vertices of [false,true]){
 const {b,e,u,deck}=fixture(vertices),version=b.sceneVersion;
 assert.equal(support(e,180),deck.id);assert.equal(ray(e,180),deck.id);assert(e.grounded(u));
 const before=JSON.stringify(b);e.invalidateTerrainCollisionIndex();e.invalidateTerrainCollisionIndex();assert.equal(JSON.stringify(b),before);
 for(const x of [1200,2520,100]){
  const old=deck.x,dx=x-old;deck.x=x;if(deck.vertices)for(const p of deck.vertices)p.x+=dx;e.invalidateTerrainCollisionIndex();
  assert.equal(b.sceneVersion,version);assert.equal(support(e,old+80),undefined);assert.equal(ray(e,old+80),undefined);assert.equal(support(e,x+80),deck.id);assert.equal(ray(e,x+80),deck.id);
  assert.equal(e.projectileCollision({x:x+80,y:900},{x:x+80,y:700},0,'fixture',[],false),null);assert.equal(u.x,180);assert.equal(u.y,800);
  const saved=plain(b),restored=new C.Engine(saved,()=>{});assert.equal(saved.sceneVersion,version);assert.equal(support(restored,x+80),deck.id);assert.equal(ray(restored,x+80),deck.id);assert.equal(support(restored,old+80),undefined);cases++;
 }
 deck.x=1800;if(deck.vertices)for(const p of deck.vertices)p.x+=1700;b.sceneVersion++;assert.equal(support(e,1880),deck.id);assert.equal(ray(e,180),undefined);cases++;
 b.terrain.push({id:'new-floor',x:3200,y:800,w:160,h:40,mat:'rock',hp:100,maxHp:100});assert.equal(support(e,3280),'new-floor');cases++;
}
console.log(`PASS ${cases} collision-only invalidation cases; no render/transport claim`);
