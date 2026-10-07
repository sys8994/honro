import assert from 'node:assert/strict';
import {beforeObjectiveRevision} from './objective-delta-helpers.mjs';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {openRoute} from './act2-spatial-test-helpers.mjs';

const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
for(let id=11;id<=20;id++){
 const st=g.HONRO_PROJECT.stages[id-1],space=st.design?.space;
 assert(space,`${id}: missing authored space contract`);
 const slopes=[];
 for(const surface of space.surfaces.filter(s=>['floor','shelf'].includes(s.role))){
  const original=st.terrains.find(t=>t.id===surface.terrainId);assert(original,`${id}: missing ${surface.terrainId}`);const t=original.properties?.honroRestoredVertices?{...original,points:original.properties.honroRestoredVertices}:g.HonroTerrainDomain.projection(original);
  for(const i of surface.edgeIndices){const a=t.points[i],b=t.points[(i+1)%t.points.length],slope=Math.abs((b.y-a.y)/(b.x-a.x));assert(Number.isFinite(slope)&&slope<=1.35,`${id}/${surface.id}: required walk surface is too steep (${slope})`);slopes.push(slope);}
 }
 // Encounter composition is frozen separately. Here retain the existing
 // clustered pressure and isolated elite tactical-placement regression.
 const foes=st.units.filter(u=>u.team==='enemy'&&u.id.startsWith('a2-enemy'));
 const near=foes.map(u=>Math.min(...foes.filter(v=>v!==u).map(v=>Math.hypot(u.x-v.x,u.y-v.y))));
 assert(near.filter(d=>d<220).length>=foes.length*.4,`${id}: enemies lost clustered encounters`);
 assert(foes.some((u,j)=>u.stageOverrides?.honroAct2Elite&&near[j]>220),`${id}: no isolated elite encounter`);
 const signs=st.routes.slice(1).map((p,i)=>Math.sign(p.x-st.routes[i].x)).filter(Boolean);
 rows.push({id,topology:space.topologyId,nodes:st.terrains.reduce((n,t)=>n+t.points.length,0),maxSlope:Math.max(...slopes),turns:signs.slice(1).filter((v,i)=>v!==signs[i]).length,clustered:near.filter(d=>d<220).length});
}
assert.equal(new Set(rows.filter(r=>r.id!==19).map(r=>r.topology)).size,9,'chapters must not share a generic switchback template');

const mountain=g.HONRO_PROJECT.stages[11],entry=g.HONRO_PROJECT.stages[12];
const mouth=mountain.terrains.find(t=>t.id==='quarry-cave-mouth'||t.properties?.honroCeiling);
assert(mouth&&mountain.initialState.honroCaveApproach);
assert(mouth.points.length>=6,'mountain-to-cave roof needs a shaped silhouette');
assert(!mountain.terrains.some(t=>t.id==='shaft-cap'));
assert(entry.design.space.rooms.some(r=>r.id==='sunken-forecourt'&&r.sky==='open'),'stage13 must retain its open collapse forecourt');
assert(entry.design.space.rooms.some(r=>r.id==='low-gallery'&&r.ceilingIds.length),'stone threshold must lead into a physical low gallery');
const village=g.HONRO_PROJECT.stages[13],families=['family-upper','family-mid','family-lower'].map(id=>village.design.space.sites[id].standing);
assert(families[0].y<families[1].y&&families[1].y<families[2].y,'village families must occupy descending, unequal inhabited terraces');
assert(new Set(families.map(p=>Math.round(p.y/100))).size===3,'village has flattened its three story levels');

for(let id=13;id<=19;id++){
 const st=g.HONRO_PROJECT.stages[id-1],forms=st.initialState.honroCaveForms||[],envelope=st.initialState.honroCaveEnvelope;
 assert(forms.every(f=>f.top<f.bottom&&f.length>0&&f.length<(f.bottom-f.top)*.5),`${id}: cave forms close the walkable void`);
 assert(st.design.space.rooms.filter(r=>r.sky==='cave').every(r=>r.ceilingIds.length),`${id}: enclosed room lacks physical ceiling`);
 for(const portal of envelope?.portals||[])assert(portal.bottom-portal.top>=160,`${id}: portal lacks full actor clearance`);
 assert(!st.elements.some(e=>e.assetId==='act2:rock-column'),'bright foreground columns must stay removed');
}

const pools=[];
for(let id=11;id<=20;id++)for(const z of g.HONRO_PROJECT.stages[id-1].materials.filter(z=>z.kind==='water-pool')){
 assert(z.honroCarvedBasin,`${id}: water must sit in a physical basin`);
 const [left,right]=z.surface,bed=z.bottom;
 assert.deepEqual(bed[0],left);assert.deepEqual(bed.at(-1),right);
 assert(Math.max(...bed.map(p=>p[1]))-left[1]>=200,`${id}: basin is too shallow`);
 assert(bed.length>=6,`${id}: basin is an oversimplified polygon`);
 const {b,e}=battlefield(g,id);openRoute(b);
 for(const [x,y] of bed.slice(1,-1))assert(e.surface(x,y-4,y+4),`${id}: water bed is not matched by real terrain at ${x},${y}`);
 pools.push({id,span:Math.round(right[0]-left[0]),bedNodes:bed.length});
}
assert.deepEqual(pools.map(p=>p.id),[14,15,19],'every Act 2 water zone must be audited');

// The hanging attack target exists only in retained pre-revision battles.
const liveProject=g.HONRO_PROJECT;g.HONRO_PROJECT=beforeObjectiveRevision(liveProject,g.HONRO_CONTENT).project;
const {b,e,app}=battlefield(g,15);g.HONRO_PROJECT=liveProject;g.HonroAct2.attach(app,e);
assert(b.terrain.some(t=>t.honroCeiling)&&!b.terrain.some(t=>t.id==='shaft-cap'));
const target=b.terrain.find(t=>t.id==='shaft-pin'),archer=b.units.find(u=>u.cls==='archer'&&u.side===0),mage=b.units.find(u=>u.cls==='mage'&&u.side===0);
const hp=target.hp;e.damageTerrain(target,hp+10,0,mage.id);assert.equal(target.hp,hp,'other classes cannot break Seol-o target');
e.damageTerrain(target,hp+10,0,archer.id);assert(target.broken,'Seol-o can break hanging target');
assert(b.honroCaveHangingTarget.targetY>b.honroCaveHangingTarget.roofY);
console.log(JSON.stringify({terrain:rows,pools,archerClassGate:true,limitations:'Terrain and explicit class-gate fixture; real target shots run in act2-spatial.mjs.'}));
