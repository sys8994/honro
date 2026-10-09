/** Authored geography and initial-body contracts. These are not normal play. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {authorStage30Ferry} from '../tools/map-forge/apply-stage30-ferry.mjs';
import {authorEncounters} from '../tools/map-forge/act3-encounters.mjs';
import {refineStage} from '../tools/map-forge/act3-refinement.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,plain=v=>JSON.parse(JSON.stringify(v)),hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex'),p=plain(g.HONRO_PROJECT),s=p.stages[29],old=JSON.parse(await readFile('tests/fixtures/stage30-ferry/before-stage30.json','utf8')),rows=[];
const same=(a,b,label)=>assert.deepEqual(plain(a),plain(b),label);
const check=async(name,fn)=>{await fn();rows.push({name,passed:true});console.log('PASS',name);};
await check('original three goals, hold3, all surviving heroes, no NPC or new gate',()=>{
 same(s.initialState.honroAct3Steps,old.stage.initialState.honroAct3Steps);same(s.initialState.honroAct3Steps.map(x=>x.id),['transport-map','ferry-hold','old-road']);
 assert.equal(s.initialState.honroAct3Steps[1].rounds,3);assert.equal(s.initialState.honroAct3Steps[2].allHeroes,true);assert.equal(s.design.ferry.zones.length,7);assert.equal(s.units.filter(u=>u.team==='player').length,4);assert.equal(s.units.length,30);assert.equal(s.initialState.honroActiveLimit,3);assert.equal(s.initialState.honroFerryPopulationCap,36);
 assert(!s.units.some(u=>u.team!=='player'&&u.team!=='enemy'));assert(!s.markers.some(m=>['route-pin','route-door'].includes(m.id)));assert.equal(s.width,11200);assert.equal(s.height,7200);
});
await check('generator is idempotent and preserves all other complete maps/assets',async()=>{
 const a=await authorStage30Ferry(p,g),z=await authorStage30Ferry(a,g);same(plain(a),p);same(plain(z),p);same(a.stages.slice(0,29),p.stages.slice(0,29));same(plain(a.library.filter(x=>!x.id.startsWith('stage30:ferry-'))),p.library.filter(x=>!x.id.startsWith('stage30:ferry-')));
 const q=plain(p),st=q.stages[29];authorEncounters(g,q,st);same(st,s,'Generic encounter regeneration respects exact ferry clusters');refineStage(q,st);same(st,s,'Generic scenic refinement respects new ferry authoring');
});
await check('named density controls preserve every terrain/objective and separate elite budget',async()=>{
 for(const [roster,n,elites,cap] of [['candidate26e6',26,6,36],['countControl20e6',20,6,30],['originalBudget20e4',20,4,30]]){
  const q=await authorStage30Ferry(p,g,{roster}),v=q.stages[29],en=v.units.filter(u=>u.team==='enemy');assert.equal(en.length,n);assert.equal(en.filter(u=>u.stageOverrides.honroAct3Elite).length,elites);assert.equal(v.initialState.honroFerryPopulationCap,cap);
  for(const key of ['terrains','markers','materials','objectives','routes','events','anchors'])same(v[key],s[key],roster+' '+key);same(v.units.filter(u=>u.team==='player'),s.units.filter(u=>u.team==='player'));same(v.initialState.honroAct3Steps,s.initialState.honroAct3Steps);
 }
});
const floating=u=>!!g.HonroWorld.archetypes[u.honroVariant]?.flying||!!u.summonFloating;
const overlap=us=>us.flatMap((a,i)=>us.slice(i+1).filter(z=>Math.abs(a.x-z.x)<a.r+z.r&&Math.min(a.y,z.y)>Math.max(a.y-a.h,z.y-z.h)).map(z=>[a.id,z.id]));
await check('all30 initial bodies are clear, supported, distinct, with exactly26 enemies/6 elites',()=>{
 const {b,e}=battlefield(g,30);assert.equal(e.alive(1).length,26);assert.equal(e.alive(1).filter(u=>u.elite).length,6);assert.equal(b.enemyLimit,3);same(overlap(b.units),[]);
 for(const u of b.units){const a=s.units.find(v=>v.id===u.id);assert(Math.abs(u.x-a.x)<.01&&Math.abs(u.y-a.y)<.01,'Constructor must not repair '+u.id);assert(floating(u)?!g.HonroTerrain.intersects(b,u):C.validTerrainContactPose(b.terrain,u),'Clear initial body '+u.id);if(!floating(u))assert.equal(e.contactSurface(u.x,u.y-.1,u.y+.1)?.t.id,a.stageOverrides?.honroEncounterSupport||'sf-map-rock');}
 assert.equal(g.HonroStage30Ferry.occupants(b).length,0,'The actual narrow boat/bank sweep has no authored initial body');
});
for(const dt of [1/120,1/60,1/30])await check('8 seconds of unchanged shared idle body physics dt='+dt,()=>{
 const {b,e}=battlefield(g,30),before=plain(b.units);for(let i=0;i<8/dt;i++)e.stepUnits(dt);
 for(const u of b.units){const a=before.find(v=>v.id===u.id);assert.equal(u.hp,a.hp,u.id);assert.equal(!!u.dead,!!a.dead,u.id);assert(Math.abs(u.x-a.x)<.01&&Math.abs(u.y-a.y)<.01,u.id+' moved off support');assert(floating(u)?!g.HonroTerrain.intersects(b,u):C.validTerrainContactPose(b.terrain,u),u.id);}
 same(overlap(b.units),[]);
});
await check('every route anchor/default jump/ordinary drop has four body-clear poses in its real phase',()=>{
 for(const route of s.design.ferry.routes){const {b,e}=battlefield(g,30);if(route.ferryState==='settled')for(const ts of [b.terrain,b.honroWorldTerrain])for(const t of ts){if(t.id==='sf-settled-barge')t.broken=false;if(t.id==='sf-outbank-screen')t.broken=true;}
  for(const a of route.anchors)for(const pt of [a,...[a.jumpTo,a.dropTo].filter(Boolean).map(v=>({...v,y:C.topAt(b.terrain.find(t=>t.id===v.support),v.x)}))])for(const u of e.heroesAlive())assert(C.validTerrainContactPose(b.terrain,{...u,x:pt.x,y:pt.y}),route.id+' '+u.cls+' '+JSON.stringify(pt));
  if(route.insideOriginalGatherRadius)assert(g.HonroAct3.sameFloor(route.anchors.at(-1).jumpTo?{x:route.anchors.at(-1).jumpTo.x,y:4300}:route.anchors.at(-1),s.markers.find(m=>m.id==='old-road'),440));
 }
});
await check('current map/environment schema and the original finite10 budget',()=>{
 same(plain(g.HonroMaps.validate(p).filter(x=>x.level==='err')),[]);same(plain(g.HonroEnvironment.validate(p).filter(x=>x.level==='err')),[]);
 assert.equal(s.events.reduce((n,v)=>n+v.action.n,0)+s.initialState.honroAct3Steps[1].wave.count,10);assert.equal(g.HONRO_BALANCE.stages[29].maxAlive,23);assert.equal(g.HONRO_BALANCE.stages[29].activeEnemies,3);assert.equal(g.HONRO_BALANCE.stages[29].initialEnemies,26);
});
await mkdir('_local/reports/stage30-ferry',{recursive:true});await writeFile('_local/reports/stage30-ferry/contracts.json',JSON.stringify({stageSha256:hash(s),projectSha256:hash(p),rows,scope:'Fresh authoring, exact original objectives, density controls and idle body/schema fixtures. Real route input, combat, save and browser are separate.'},null,2)+'\n');
