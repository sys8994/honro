import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,S=g.HonroCombatStatus;
const oldEmbedded=(b,u)=>b.terrain.some(t=>!t.broken&&!t.oneWay&&u.x>=t.x&&u.x<=t.x+t.w&&u.y>C.topAt(t,u.x)+3&&u.y<t.y+t.h-.1);
let checks=0;
for(const cls of ['archer','mage','knight','occultist']){
 const {b,e}=battlefield(g,15),u=b.units.find(u=>u.cls===cls&&u.side===0);b.active=u.id;
 const support=b.terrain.find(t=>t.id==='fc15-west-arch'),x=4027,y=C.topAt(support,x);
 Object.assign(u,{x,y,vx:0,vy:0,jumping:false,airborne:false});
 assert(C.validTerrainContactPose(b.terrain,u));assert(oldEmbedded(b,u),'fixture must reproduce old false warning');
 const hp=u.hp,move=u.moveLeft;assert.equal(S.embedded(b,u),false);assert.equal(S.reason(e,u),'이동·발사 가능');
 for(let repeat=0;repeat<2;repeat++){
  assert(e.jump(u));let air=false;
  for(let n=0;n<900;n++){e.integrateBody(u,1/120,true);assert(!S.embedded(b,u));if(!e.grounded(u)){air=true;assert.match(S.reason(e,u),/공중 이동 중/);}else break;}
  assert(air);assert(e.grounded(u));assert.equal(S.reason(e,u),'이동·발사 가능');assert.equal(u.hp,hp);
 }
 assert.equal(u.moveLeft,move-150);
 for(const dir of [-1,1]){const before=u.x;for(let i=0;i<20;i++){e.walk(u,dir,1/120);e.integrateBody(u,1/120,true);}assert(dir*(u.x-before)>0,'normal slope walking remains possible');assert(!S.embedded(b,u));}
 // Selection and round boundaries must read the current unit, not retain a warning.
 const other=b.units.find(v=>v.side===0&&v!==u);assert(e.select(other.id));assert(!S.embedded(b,e.active));assert(e.select(u.id));
 e.newRound();assert(!S.embedded(b,u));assert.equal(S.reason(e,u),'이동·발사 가능');
 checks++;
}
// Genuine penetration stays visible for rectangular ceilings, slopes and concave solids.
for(const t of [
 {id:'roof',x:0,y:100,w:1000,h:200},
 {id:'slope',x:0,y:100,w:1000,h:800,slope:300},
 {id:'arch',x:0,y:0,w:1000,h:1000,vertices:[{x:0,y:0},{x:1000,y:0},{x:1000,y:1000},{x:800,y:1000},{x:800,y:200},{x:200,y:200},{x:200,y:1000},{x:0,y:1000}]}
]){
 const {b,e}=battlefield(g,15),u=e.active;b.terrain=[t];Object.assign(u,{x:100,y:C.topAt(t,100)+40,acted:false});
 assert(oldEmbedded(b,u));assert(S.embedded(b,u));assert.match(S.reason(e,u),/^지형에 걸림/);
 t.broken=true;assert(!S.embedded(b,u));t.broken=false;t.oneWay=true;assert(!S.embedded(b,u));checks++;
}
// Retry/fresh battle does not carry a previous warning or change authored spawn state.
for(let i=0;i<2;i++){const {b,e}=battlefield(g,15);for(const u of b.units.filter(u=>u.side===0))assert(!S.embedded(b,u));assert.equal(S.reason(e,e.active),'이동·발사 가능');checks++;}
// Actual Workshop launch/retry lifecycle, with DOM/storage doubles only.
const {appHarness}=await import('./app-regression-helpers.mjs');
const h=await appHarness(),app=h.load(h.profileThrough(14));
const map=h.g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===15);
app.launchMap(h.g.HONRO_PROJECT,map.id,{from:'camera',camera:{x:4027,y:3000},story:false});
assert(oldEmbedded(app.engine.b,app.engine.active));
assert.equal(h.g.HonroCombatStatus.reason(app.engine,app.engine.active),'이동·발사 가능');
const status=h.g.document.getElementById('combat-status');status.contains=()=>false;
h.g.HonroCombatStatus.refresh(app,app.engine.active);assert(!status.innerHTML.includes('지형에 걸림'));
for(let i=0;i<2;i++){h.click('retry');h.finish(app);h.g.HonroCombatStatus.refresh(app,app.engine.active);assert(!status.innerHTML.includes('지형에 걸림'));assert.equal(h.g.HonroCombatStatus.reason(app.engine,app.engine.active),'이동·발사 가능');checks++;}
console.log(`${checks} terrain-status groups passed (read-only HUD predicate; engine unchanged)`);
