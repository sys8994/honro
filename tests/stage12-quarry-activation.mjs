/** Explicit supported-position activation/queue fixtures. These are not normal
 * travel traces: only the production activation, damage and turn queue run. */
import assert from 'node:assert/strict';import {mkdir,writeFile}from'node:fs/promises';import{runtime,battlefield}from'../game/tests/helpers.mjs';import{quarryEntryProfile}from'./stage12-quarry-entry-helper.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[],plain=x=>JSON.parse(JSON.stringify(x));
function fixture(){const q=battlefield(g,12,{profile:quarryEntryProfile(g).profile});g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct2.attach(q.app,q.e);q.e.checkEnd=()=>false;return q;}
function stand(q,support,x){const u=q.e.heroesAlive()[0],t=q.b.terrain.find(t=>t.id===support);Object.assign(u,{x,y:C.topAt(t,x),vx:0,vy:0});assert(C.validTerrainContactPose(q.b.terrain,u));q.e.refreshActivation();return u;}
const cells=q=>[...new Set(q.e.combatEnemies().map(u=>u.honroQuarryActivationCell))].sort();
function record(name,q){rows.push({name,cells:cells(q),awake:q.e.alive(1).filter(u=>u.awake).map(u=>u.id),queue:plain(q.b.queue),alert:plain(g.HonroStage12Quarry.memory(q.b).alert)});}
{
 const q=fixture();assert.deepEqual(cells(q),[]);record('fresh A has no underground or rear actions',q);
 stand(q,'sq-old-road',8000);assert.deepEqual(cells(q),['B-front']);q.b.phase="transition";q.e.switchTeam();assert.equal(q.b.queue.length,4);assert(q.b.queue.every(id=>/^sq-b[1-4]$/.test(id)));record('old-road approach wakes only B front4 and actual four-slot queue',q);
}
{
 const q=fixture();stand(q,'sq-north-quarry',7600);assert(cells(q).includes('B-support'));assert(!cells(q).some(s=>s.startsWith('G')));record('B carrier platform supports respond; vertically overlapping G stays quiet',q);
 stand(q,'sq-north-quarry',8600);assert(cells(q).includes('G-road'));record('actual eastern descent approach alerts rear-road guards',q);
 stand(q,'sq-north-quarry',7600);assert(!cells(q).some(s=>s.startsWith('G')));assert(g.HonroStage12Quarry.memory(q.b).alert['G-road']);record('return above the solid preserves memory without consuming occluded action slots',q);
}
{
 const q=fixture();stand(q,'sq-west-quarry',5120);assert(cells(q).includes('C-cut'));assert(!cells(q).some(s=>s.startsWith('E')));record('C upper cut does not wake covered E lower hauling party',q);
 stand(q,'sq-lower-ground',5500);assert(cells(q).includes('E-hinge'));assert(cells(q).includes('E-west'));record('real lower return engages E hauling cells',q);
}
{
 const q=fixture();stand(q,'sq-back-road',7550);assert(cells(q).includes('G-road'));assert(!cells(q).includes('G-high'));record('rear approach separates road from distant high support',q);
 stand(q,'sq-back-road',8320);assert(cells(q).includes('G-high'));record('actual high-pair approach engages its small support cell',q);
}
{
 const q=fixture(),target=q.e.unit('sq-g3'),before=target.hp;assert(!cells(q).some(s=>s.startsWith('G')));q.e.hurt(target,1,'p-archer');assert(target.hp<before,'A dormant enemy is not immune');assert(cells(q).includes('G-high'),'Actual damage retains original aggro response at any distance');assert(!cells(q).includes('G-road'),'Hit response wakes only the small paired cell');q.b.phase="transition";q.e.switchTeam();assert(q.b.queue.includes(target.id));record('production damage and actual queue react remotely; no whole-place wake',q);
 const saved=plain(q.b),e=new C.Engine(saved,()=>{},false),app={...q.app,engine:e};g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);assert.deepEqual(plain(g.HonroStage12Quarry.memory(saved).alert),plain(g.HonroStage12Quarry.memory(q.b).alert));assert(e.combatEnemies().some(u=>u.id===target.id));
}
{
 const q=fixture(),u=q.e.heroesAlive()[0],t=q.b.terrain.find(t=>t.id==='sq-old-road');
 // A pending pose/previously admitted queue belongs to the serialized state,
 // even if the next ordinary refresh will discover a newly accessible cell.
 Object.assign(u,{x:8000,y:C.topAt(t,8000)});q.b.queue=['sq-b1'];q.b.side=1;q.b.phase='enemy';q.b.active='sq-b1';q.e.unit('sq-b1').awake=true;
 const before=plain({units:q.b.units,queue:q.b.queue,memory:g.HonroStage12Quarry.memory(q.b)}),saved=plain(q.b),e=new C.Engine(saved,()=>{},false),app={...q.app,engine:e};g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);
 assert.deepEqual(plain({units:saved.units,queue:saved.queue,memory:g.HonroStage12Quarry.memory(saved)}),before,'Mount restores cache only: saved awake/alerts and admitted queue are exact');e.refreshActivation();assert(g.HonroStage12Quarry.memory(saved).alert['B-front'],'Normal refresh, not mount, records the new approach');
}
{
 const q=fixture();delete q.b.honroQuarryActivation;const saved=plain(q.b),e=new C.Engine(saved,()=>{},false),app={...q.app,engine:e};g.HonroAct2.attach(app,e);assert(!e.honroQuarryActivationAttached,'Previously saved quarry revisions without authored approach rules keep shared behavior');
}
await mkdir('_local/reports/stage12-quarry',{recursive:true});await writeFile('_local/reports/stage12-quarry/activation.json',JSON.stringify({passed:true,scope:'Supported-position fixtures and production hurt/turn queue. Actual full combat and action efficiency require the paired normal traces.',rows},null,2)+'\n');console.log('PASS quarry access-aware small-cell activation and actual four-slot/remote-hit queues',JSON.stringify(rows));
