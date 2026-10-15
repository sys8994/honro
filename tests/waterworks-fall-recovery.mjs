import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),P=g.HonroStakeCrossing;
let cases=0;
for(const stage of [25,27])for(const cls of ['archer','mage'])for(const resumed of [false,true]){
 const q=battlefield(g,stage),{b,app}=q;let e=q.e;
 P.initialize(b);const cp=structuredClone(b.honroStakeCrossing.checkpoint),u=b.units.find(u=>u.side===0&&u.cls===cls);
 const limit=P.fallBoundary(b);assert(Number.isFinite(limit));
 // Real Stage27 shaft, or the same class of fall under Stage25's lowest route.
 Object.assign(u,{x:stage===27?6050:2500,y:stage===27?5901.333333333333:limit+20,vx:0,vy:0,airborne:false,jumping:false});
 if(stage===27){assert(e.grounded(u));const y=u.y;for(let i=0;i<120;i++)e.integrateBody(u,1/120,true);assert.equal(u.y,y,'baseline wedge remains a real physical support');}
 b.items.p0Spent=true;b.honroState.p0Future=true;
 if(resumed){const saved=JSON.stringify(b);e=new g.HONRO_CORE.Engine(JSON.parse(saved));app.engine=e;assert.equal(JSON.stringify(b),saved);}
 assert(P.recoverFailure(app));const r=e.b;
 for(const before of cp.units){const after=r.units.find(v=>v.id===before.id);assert.equal(after.x,before.x);assert.equal(after.y,before.y);assert.equal(after.hp,before.hp);}
 assert(!r.items.p0Spent&&!r.honroState.p0Future,'whole attempt, not forward progress, is restored');
 assert.equal(r.honroStakeCrossing.retries,1);assert.equal(P.recoverFailure(app),false);cases++;
}
{
 const {b,e,app}=battlefield(g,27);P.initialize(b);const u=b.units.find(u=>u.side===0&&u.cls==='mage');
 // Reproduce the natural descent, and stop at the failure boundary before wedging.
 Object.assign(u,{x:6050,y:4850,vx:0,vy:0,jumping:false,airborne:false});
 for(let i=0;i<1200&&!b.honroStakeCrossing.retries;i++){e.integrateBody(u,1/120,true);P.tick(app);}
 assert.equal(b.honroStakeCrossing.retries,1);cases++;
}
{
 const {b,app}=battlefield(g,27);P.initialize(b);const u=b.units.find(u=>u.side===0&&u.cls==='mage'),limit=P.fallBoundary(b);
 for(const c of b.honroMap.act3.walkingComponents)for(const p of c.points){Object.assign(u,p);assert(!P.recoverFailure(app));cases++;}
 u.y=limit;assert(!P.recoverFailure(app));u.y=limit+1;
 b.projectiles=[{body:true,owner:u.id}];assert(!P.recoverFailure(app),'body travel is not interrupted');b.projectiles=[];
 b.honroAct3Void={revision:1,state:'FALLING'};assert(!P.recoverFailure(app),'scripted Seolo fall remains isolated');
 b.honroAct3Void.state='RESOLVED';assert(P.recoverFailure(app));assert.equal(b.honroAct3Void.state,'RESOLVED');assert(b.honroVoidWitness);
 b.honroCustom=true;assert.equal(P.fallBoundary(b),null);delete b.honroCustom;b.honroMap.act3.waterworksRevision=2;assert.equal(P.fallBoundary(b),null);
}
console.log('PASS waterworks fall/reload/checkpoint/event guards',cases);
