import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,P=g.HonroStakeCrossing,plain=x=>JSON.parse(JSON.stringify(x));
for(const id of [25,27]){
 const profile=C.defaults(),b=g.HonroWorld.build(g.HONRO_CONTENT.stages[id-1],profile,false,'archer','A01');g.HonroStageRules.sanitizeStageBattle(b);
 const e=new C.Engine(b,()=>{},true),app={engine:e,profile};P.attach(app,e);P.initialize(b);
 const query=()=>e.collisionTerrain({x:0,y:0},{x:b.width,y:b.height},0);
 const initial=query();assert(initial.length);const checkpoint=plain(b.honroStakeCrossing.checkpoint.terrain);
 for(let n=0;n<3;n++){
  const old=query(),version=b.sceneVersion;
  assert(P.retry(app,'cache regression'));const current=query();assert(current.length);
  assert(b.sceneVersion>version,'Scene invalidation is monotonic across repeated restore');
  assert(current.every(t=>b.terrain.includes(t)),'Every collision result belongs to the restored battlefield');
  assert(current.every(t=>!old.includes(t)),'No pre-retry terrain object remains cached');
  assert.deepEqual(plain(b.terrain),checkpoint,'Restored collision geometry remains exact');
  const full=new C.Engine(plain(b),()=>{},true),probe=b.units.find(u=>u.side===0);
  assert.deepEqual(plain(e.surface(probe.x,probe.y-5,probe.y+5)),plain(full.surface(probe.x,probe.y-5,probe.y+5)),'Restored indexed query matches a fresh engine');
 }
 console.log('PASS',id,'checkpoint terrain references, repeated scene invalidation and fresh-engine surface parity');
}
