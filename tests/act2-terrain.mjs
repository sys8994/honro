import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';

const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
const rows=[];
for(let id=11;id<=20;id++){
 const st=g.HONRO_PROJECT.stages[id-1],floor=st.terrains.find(t=>t.id==='act2-floor');
 const ps=floor.points.slice(0,-2),slopes=ps.slice(1).map((p,i)=>Math.abs((p.y-ps[i].y)/(p.x-ps[i].x)));
 assert(ps.length>=90,`${id}: too few authored ground nodes`);
 assert(slopes.every(v=>Number.isFinite(v)&&v<=1.35),`${id}: needle-like ground slope ${Math.max(...slopes)}`);
 assert(st.terrains.filter(t=>t.id.startsWith('stone-shelf-')).length>=2||id===14,`${id}: missing alternate firing shelves`);
 const route=st.routes.filter(p=>Number.isFinite(p.x)),signs=route.slice(1).map((p,i)=>Math.sign(p.x-route[i].x)).filter(Boolean);
 const turns=signs.slice(1).filter((v,i)=>v!==signs[i]).length;
 if([13,15,17,18,19].includes(id)){
  assert(turns>=2,`${id}: route must make two real horizontal reversals`);
  for(const level of ['upper','middle'])assert(st.terrains.some(t=>t.id==='switchback-'+level),`${id}: missing physical ${level} bench`);
  const heights=st.terrains.filter(t=>t.id.startsWith('switchback-')||t.id==='act2-floor').map(t=>C.topAt({vertices:t.points,x:0,w:st.width,y:0,h:st.height},st.width*.5,0));
  assert(Math.max(...heights)-Math.min(...heights)>1000,`${id}: route does not occupy distinct cave levels`);
 }
 if(id===14)assert(turns>=1,'village must double back to its lower tier');
 if(id===16){
  assert(turns>=2,'temple path must climb the upper gallery and return below it');
  assert(st.terrains.some(t=>t.id==='switchback-temple-gallery'),'temple gallery must be physical');
  const markers=Object.fromEntries(st.markers.filter(m=>['hall','hold-hall','record'].includes(m.id)).map(m=>[m.id,m]));
  assert(markers.hall&&markers['hold-hall']&&markers.record&&markers.record.x<markers.hall.x,'temple record must lie on the return path');
 }
 const foes=st.units.filter(u=>u.team==='enemy'&&u.id.startsWith('a2-enemy'));
 const near=foes.map(u=>Math.min(...foes.filter(v=>v!==u).map(v=>Math.hypot(u.x-v.x,u.y-v.y))));
 assert(near.filter(d=>d<220).length>=foes.length*.4,`${id}: enemies remain evenly spaced rather than clustered`);
 assert(foes.some((u,j)=>u.stageOverrides?.honroAct2Elite&&near[j]>220),`${id}: no isolated elite encounter`);
 rows.push({id,nodes:ps.length,maxSlope:Math.round(Math.max(...slopes)*100)/100,turns,clustered:near.filter(d=>d<220).length,physicalShelves:st.terrains.length});
}

const mountain=g.HONRO_PROJECT.stages[11],entry=g.HONRO_PROJECT.stages[12],mouth=mountain.terrains.find(t=>t.id==='quarry-cave-mouth');
assert(mouth&&mountain.initialState.honroCaveApproach);
assert(mouth.points.length>30,'mountain-to-cave roof must be a curved formation');
assert.equal(mouth.points[0].y,0);
assert.equal(mouth.points.at(-1).y,0,'roof begins at zero thickness, without a vertical cut');
assert.equal(mountain.terrains[0].points.at(-3).y,entry.terrains.find(t=>t.id==='switchback-upper').points[0].y,'Stage 12 exit floor joins Stage 13 entrance height');
assert(!mountain.terrains.some(t=>t.id==='shaft-cap'));

const village=g.HONRO_PROJECT.stages[13];
assert(village.terrains.some(t=>t.id==='village-upper'));
assert(village.terrains.some(t=>t.id==='village-middle'));
assert(village.routes.some(p=>p.x===8350)&&village.routes.some(p=>p.x===5200));
assert(village.routes.findIndex(p=>p.x===8350)<village.routes.findIndex(p=>p.x===5200),'route must turn and descend');

for(let id=13;id<=19;id++){
 const st=g.HONRO_PROJECT.stages[id-1],forms=st.initialState.honroCaveForms;
 assert(forms.length>=8,`${id}: insufficient cave background variation`);
 for(const type of ['stalactite','stalagmite','cluster','drapery'])assert(forms.some(f=>f.type===type),`${id}: missing ${type}`);
 for(const portal of st.initialState.honroCaveEnvelope.portals)assert(portal.bottom-portal.top>=800,`${id}: map edge collapses into an artificial narrow throat`);
 assert(forms.every(f=>f.top<f.bottom&&f.length>0&&f.length<(f.bottom-f.top)*.5));
 assert(!st.elements.some(e=>e.assetId==='act2:rock-column'),'bright foreground columns must be removed');
}

const pools=[];
for(let id=11;id<=20;id++)for(const z of g.HONRO_PROJECT.stages[id-1].materials.filter(z=>z.kind==='water-pool')){
 assert(z.honroCarvedBasin,`${id}: water must sit in a physical basin`);
 const [left,right]=z.surface,bed=z.bottom;
 assert.equal(bed[0][0],left[0]);assert.equal(bed[0][1],left[1]);
 assert.equal(bed.at(-1)[0],right[0]);assert.equal(bed.at(-1)[1],right[1]);
 assert(Math.max(...bed.map(p=>p[1]))-left[1]>=200,`${id}: basin is too shallow`);
 assert(bed.length>=6,`${id}: basin is an oversimplified polygon`);
 pools.push({id,span:Math.round(right[0]-left[0]),bedNodes:bed.length});
}
assert.deepEqual(pools.map(p=>p.id),[14,15,19],'every Act 2 water zone must be audited');

const {b,e,app}=battlefield(g,15);g.HonroAct2.attach(app,e);
assert(b.terrain.some(t=>t.id==='cave-roof')&&!b.terrain.some(t=>t.id==='shaft-cap'||t.id.startsWith('cave-roof-')));
const target=b.terrain.find(t=>t.id==='shaft-pin'),archer=b.units.find(u=>u.cls==='archer'&&u.side===0),mage=b.units.find(u=>u.cls==='mage'&&u.side===0),marker=b.honroMarkers.find(m=>m.id==='marker-shaft-pin');
const hp=target.hp;e.damageTerrain(target,hp+10,0,mage.id);assert.equal(target.hp,hp,'other classes cannot break Seol-o target');
e.damageTerrain(target,hp+10,0,archer.id);assert(target.broken,'Seol-o can break hanging target');
assert(b.honroCaveHangingTarget.targetY>b.honroCaveHangingTarget.roofY);
archer.x=marker.x-260;archer.y=C.topAt(b.terrain.find(t=>t.id==='switchback-middle'),archer.x,0);
const aim=e.predict(archer,C.SKILLS.A01,70,.7,null,false);
assert(Math.min(...aim.points.map(p=>Math.hypot(p.x-marker.x,p.y-marker.y)))<65,'ceiling target needs a playable bow trajectory');

console.log(JSON.stringify({terrain:rows,pools,archerTarget:true}));
