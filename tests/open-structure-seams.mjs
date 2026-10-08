// Regression for choosing a nearby lower steep bank over the exact platform
// already supporting an actor. Uses real walking/integration, no grounded stub.
import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {traverse} from './act1-spatial-test-helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,base=battlefield(g,11).b;
let conditions=0;
for(const cls of ['archer','mage','knight','occultist'])for(const dt of [1/240,1/120,1/60,1/30,.08])for(const oneWay of [true,false]){
 const b=structuredClone(base),u=b.units.find(u=>u.side===0&&u.cls===cls);
 const bank=g.HonroMapEngine.solid('bank',[[0,1300],[900,1300],[1000,1000],[1800,1000],[1800,2000],[0,2000]],{indestructible:true});
 const deck=g.HonroMapEngine.solid('deck',[[800,1000],[1200,1000],[1200,1030],[800,1030]],{indestructible:true,oneWay});
 Object.assign(b,{units:[u],active:u.id,side:0,phase:'aim',terrain:[bank,deck],width:2000,height:2200,waters:[],fields:[],zones:[]});b.sceneVersion++;
 Object.assign(u,{x:999.8,y:1000,vx:0,vy:0,jumping:false,airborne:false,acted:false,moveLeft:10000,maxMove:10000});const hp=u.hp,e=new C.Engine(b);e.checkEnd=()=>false;
 assert(Math.abs(C.topAt(bank,u.x)-1000.6)<.001);
 for(let i=0;i<10;i++)e.integrateBody(u,dt);
 assert.equal(u.y,1000,`${cls}/${dt}/${oneWay}: exact deck support wins over lower bank`);
 for(let i=0;i<Math.ceil(1/dt);i++){e.walk(u,1,dt);e.integrateBody(u,dt);assert.equal(u.y,1000,'walk across the bank/deck join without sinking');assert(C.validTerrainContactPose(b.terrain,u));}
 assert(u.x>1100);assert.equal(u.hp,hp);conditions++;
}
// Keep the authored escort path and non-jumping civilian body, including the
// two original bridges and their original bank junction coordinates.
const {b,e}=battlefield(g,23),u=b.units.find(u=>u.id==='act3-carrier');assert(u);e.checkEnd=()=>false;
 for(const t of b.terrain)if(t.honroAct3Gate||t.honroAct3Target)t.broken=true;
 b.units=[u];b.active=u.id;u.fixed=false;u.maxMove=u.moveLeft=900;
const route=g.HONRO_PROJECT.stages[22].design.act3.requiredRoute.filter(q=>q.x>=u.x),result=traverse(g,b,e,u,route,{jump:false});
assert(result.passed,JSON.stringify(result));assert.equal(result.jumps,0);assert.equal(result.damage,0);assert(C.validTerrainContactPose(b.terrain,u));
console.log(`PASS ${conditions} exact-support seam conditions and full authored stage23 walk-only carrier route`);
