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
 rows.push({id,nodes:ps.length,maxSlope:Math.round(Math.max(...slopes)*100)/100,physicalShelves:st.terrains.length});
}

const mountain=g.HONRO_PROJECT.stages[11],entry=g.HONRO_PROJECT.stages[12],mouth=mountain.terrains.find(t=>t.id==='quarry-cave-mouth');
assert(mouth&&mountain.initialState.honroCaveApproach);
assert(mouth.points.length>30,'mountain-to-cave roof must be a curved formation');
assert.equal(mouth.points[0].y,0);
assert.equal(mouth.points.at(-1).y,0,'roof begins at zero thickness, without a vertical cut');
assert.equal(mountain.terrains[0].points.at(-3).y,entry.terrains[0].points[0].y,'Stage 12 exit floor joins Stage 13 entrance height');
assert(!mountain.terrains.some(t=>t.id==='shaft-cap'));

const village=g.HONRO_PROJECT.stages[13];
assert(village.terrains.some(t=>t.id==='village-upper'));
assert(village.terrains.some(t=>t.id==='village-middle'));
assert(village.routes.some(p=>p.x===8350)&&village.routes.some(p=>p.x===5200));
assert(village.routes.findIndex(p=>p.x===8350)<village.routes.findIndex(p=>p.x===5200),'route must turn and descend');

for(let id=13;id<=19;id++){
 const st=g.HONRO_PROJECT.stages[id-1],forms=st.initialState.honroCaveForms;
 assert(forms.length>=8,`${id}: insufficient cave background variation`);
 for(const type of ['stalactite','stalagmite','cluster'])assert(forms.some(f=>f.type===type),`${id}: missing ${type}`);
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
const target=b.terrain.find(t=>t.id==='shaft-pin'),archer=b.units.find(u=>u.cls==='archer'&&u.side===0),mage=b.units.find(u=>u.cls==='mage'&&u.side===0);
const hp=target.hp;e.damageTerrain(target,hp+10,0,mage.id);assert.equal(target.hp,hp,'other classes cannot break Seol-o target');
e.damageTerrain(target,hp+10,0,archer.id);assert(target.broken,'Seol-o can break hanging target');
assert(b.honroCaveHangingTarget.targetY>b.honroCaveHangingTarget.roofY);
archer.x=3400;archer.y=C.topAt(b.terrain.find(t=>t.id==='act2-floor'),archer.x,b.height);
const aim=e.predict(archer,C.SKILLS.A01,79,.8,null,false),marker=b.honroMarkers.find(m=>m.id==='marker-shaft-pin');
assert(Math.min(...aim.points.map(p=>Math.hypot(p.x-marker.x,p.y-marker.y)))<65,'ceiling target needs a playable bow trajectory');

console.log(JSON.stringify({terrain:rows,pools,archerTarget:true}));
