/** Isolated authored-seam regression, not combat or browser evidence.
 * Fixture setup positions one existing actor on the authored road. Thereafter
 * only ordinary production move/walk + body ticks may change its pose/budget.
 * Fresh authored model stays private: this test never writes campaign.json.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {escortEntryProfile} from './stage23-escort-entry-helper.mjs';
import {escortNavigator} from './stage23-escort-fullplay-helper.mjs';
import {authorStage23LoadingYard,mainY} from '../tools/map-forge/stage23-loading-yard.mjs';
const h=await appHarness(),{g,C}=h,originalProject=plain(g.HONRO_PROJECT),campaignBytes=await readFile('shared/data/campaign.json'),out='_local/reports/stage23-escort/bridge-seams';
await mkdir(out,{recursive:true});
const hash=v=>createHash('sha256').update(v).digest('hex');
g.HONRO_PROJECT=await authorStage23LoadingYard(g,originalProject,{art:false});
assert.deepEqual(plain(g.HONRO_PROJECT.stages.filter((_,i)=>i!==22)),originalProject.stages.filter((_,i)=>i!==22));
const entry=escortEntryProfile(g,{ordinaryStats:0}).profile;
let app=h.load({...plain(g.AppRegression.fresh()),...plain(entry)});app.launch(23);h.finish(app);
app.export();const initialProfile=await h.exported(),base=plain(app.engine.b),rows=[],npcTickRows=[];
const pose=u=>plain({x:u.x,y:u.y,vx:u.vx,vy:u.vy,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft,maxMove:u.maxMove,airborne:u.airborne,jumping:u.jumping});
function make({cls,seam,dir,offset}){
 const b=plain(base),e=new C.Engine(b,()=>{},false),u=b.units.find(u=>cls==='npc'?u.id==='act3-carrier':u.side===0&&u.cls===cls),x=seam-dir*offset;
 // Explicit isolated setup; actual class/NPC stats and authored geometry remain.
 Object.assign(u,{x,y:mainY(x),vx:0,vy:0,fixed:false});
 if(cls!=='npc')assert(e.select(u.id));
 assert(C.validTerrainContactPose(b.terrain,u),'Supported fixture start');
 let writesAllowed=0;
 for(const key of ['x','y','moveLeft']){let value=u[key];Object.defineProperty(u,key,{enumerable:true,configurable:true,get:()=>value,set:next=>{assert(writesAllowed,'External '+key+' write after setup');value=next;}});}
 for(const key of ['move','walk','integrateBody']){const fn=e[key].bind(e);e[key]=(...args)=>{writesAllowed++;try{return fn(...args);}finally{writesAllowed--;}};}
 e.jump=()=>{throw Error('Jump workaround forbidden');};e.recover=()=>{throw Error('Recovery workaround forbidden');};
 return{b,e,u};
}
async function continueExact(b,label){
 const profile={...plain(initialProfile),honroBattle:plain(b)};
 const a=h.load(profile);a.continue();assert.deepEqual(plain(a.engine.b),profile.honroBattle,'Exact stored Continue: '+label);
 a.export();const exported=await h.exported();assert.deepEqual(exported.honroBattle,profile.honroBattle,'Exact export: '+label);
 return{app:a,b:a.engine.b,e:a.engine};
}
for(const cls of ['archer','mage','knight','occultist','npc'])for(const seam of [5260,6020])for(const dir of [-1,1])for(const dt of [1/240,1/120,1/60,1/30])for(const offset of [80,80.014401782621,80.375,.014401782621]){
 const key={cls,seam,dir,dt,offset},{b,e,u}=make(key),start=pose(u);let ticks=0,distance=0,maxSurfaceError=0;
 for(;ticks<2000&&(u.x-seam)*dir<90;ticks++){
  const before=pose(u);if(cls==='npc')e.walk(u,dir,dt);else{assert(e.canAct());e.move(dir,dt);}e.integrateBody(u,dt);
  assert((u.x-before.x)*dir>1e-9,'Ordinary walk stalled '+JSON.stringify({...key,ticks,pose:pose(u)}));
  const travel=Math.hypot(u.x-before.x,u.y-before.y);distance+=travel;
  assert(before.moveLeft-u.moveLeft>=travel-1e-7,'Real path cost covers displacement '+JSON.stringify({...key,before,after:pose(u),travel}));assert(!u.jumping&&!u.airborne);
  assert(C.validTerrainContactPose(b.terrain,u),'Valid body after every step');
  maxSurfaceError=Math.max(maxSurfaceError,Math.abs(u.y-mainY(u.x)));assert(maxSurfaceError<.051,'No canal-wall or hidden-floor capture');
 }
 assert(ticks<2000);assert(u.moveLeft>0&&u.moveLeft<start.moveLeft);assert.equal(u.hp,start.hp);assert.equal(u.focus,start.focus);
 const resumed=await continueExact(b,JSON.stringify(key)),ru=resumed.e.unit(u.id),before=pose(ru);
 if(cls==='npc')resumed.e.walk(ru,dir,dt);else resumed.e.move(dir,dt);resumed.e.integrateBody(ru,dt);
 assert((ru.x-before.x)*dir>0,'Continued ordinary input advances');assert(ru.moveLeft<before.moveLeft);
 rows.push({...key,ticks,start,end:pose(u),distance,movementCost:start.moveLeft-u.moveLeft,maxSurfaceError,exactContinue:true,continuedInput:true});
}
// Exercise the actual one-way escort mission on each seam. Reverse travel is
// covered by the NPC's same production walker above, not by inventing a reverse
// campaign objective. Prerequisites and supported starting poses are fixtures.
for(const seam of [5260,6020])for(const dt of [1/120,1/60,1/30]){
 const profile={...plain(initialProfile),honroBattle:plain(base)},a=h.load(profile);a.continue();const e=a.engine,b=e.b,npc=e.unit('act3-carrier'),lead=e.unit('p-archer'),A=g.HonroAct3,m=A.memory(b);
 Object.assign(npc,{x:seam-80.375,y:mainY(seam-80.375),vx:0,vy:0,fixed:false});
 Object.assign(lead,{x:seam+230,y:mainY(seam+230),vx:0,vy:0,acted:true});
 m.done['dispatch-bundle']=true;m.done['carrier-start']=true;if(seam===6020)m.done['dock-mid']=true;
 const goal=seam===6020?'dock-exit':'dock-mid',route=b.honroMarkers.filter(q=>q.id.startsWith('route:'+goal+':')).sort((a,z)=>+a.id.split(':').at(-1)-+z.id.split(':').at(-1));
 m.escorts[npc.id]={started:true,waypoints:{[goal]:Math.max(0,route.findIndex(q=>q.x>npc.x))}};
 const start=pose(npc);e.jump=()=>{throw Error('NPC jump forbidden');};e.recover=()=>{throw Error('NPC recovery forbidden');};
 let ticks=0,cost=0;const walk=e.walk.bind(e);e.walk=(u,...args)=>{const before=u.moveLeft,ret=walk(u,...args);if(u===npc)cost+=before-u.moveLeft;return ret;};
 for(;ticks<1200&&npc.x<seam+90;ticks++){const x=npc.x;A.tick(a,dt);e.integrateBody(npc,dt);assert(npc.x>x,'Actual lead contract failed');assert(C.validTerrainContactPose(b.terrain,npc));}
 assert(ticks<1200&&npc.walkSpeed===260);assert(cost>170);assert.equal(npc.hp,start.hp);
 await continueExact(b,'NPC mission '+seam+' '+dt);npcTickRows.push({seam,dt,ticks,start,end:pose(npc),realWalkCost:cost,leadAlreadyActed:true,exactContinue:true});
}
// Reproduce the actual archived R9 failure without modifying its source file.
// Its Continue intentionally retains old terrain even with the new author.
const actualPath=process.env.HONRO_STAGE23_EAST_SEAM_SAVE||'_local/reports/stage23-escort/fullplay-final28/round-9.json';
let originalSave={path:actualPath,status:'unavailable',scope:'Archived actual play is optional local evidence, never replaced by a fixture.'};
try{
 const bytes=await readFile(actualPath),saved=JSON.parse(bytes),a=h.load(saved.profile);a.continue();const e=a.engine,b=e.b,u=e.unit('p-occultist');assert.deepEqual(plain(b),saved.profile.honroBattle,'Old actual whole battle retained');assert(e.select(u.id));
 const nav=escortNavigator(g,b,e,{tick:()=>{e.tick(C.STEP);a.missionTick(C.STEP);},ready:()=>a.canInput(),record:()=>{},stageId:23,routes:originalProject.stages[22].design.escortYard.routes,navigationState:saved.navigatorState});
 nav.advance(u,{id:'escort-support-occultist',x:6224.952682944317,y:4473.728707324943});const stopped=pose(u);assert.equal(u.x,6019.985598217379);
 const surface=e.surface(6020,u.y-28,u.y+28),slope=C.terrainSlopeAt(surface.t,6020,surface.y),footRect=b.terrain.filter(t=>!t.broken&&!t.oneWay&&C.terrainRectIntersects(t,6020-.1,u.y-.1,.2,.08,.001)).map(t=>t.id);
 assert.equal(surface.t.id,'sy-ground');assert.equal(slope,-5.115625);assert(footRect.includes('sy-stone-bridge'));
 for(let i=0;i<100;i++){assert(e.canAct());e.move(1,C.STEP);e.tick(C.STEP);a.missionTick(C.STEP);}assert.deepEqual(pose(u),stopped);assert(stopped.moveLeft>1000&&e.grounded(u));
 assert.equal(hash(await readFile(actualPath)),hash(bytes));originalSave={path:actualPath,status:'reproduced',sha256:hash(bytes),stopped,ordinaryBlockedTicks:100,selectedSurface:surface.t.id,selectedY:surface.y,wrongVertexSlope:slope,allVertexEdges:plain(C.terrainSurfaces(surface.t,6020)),footRect,wholeContinueExact:true,sourceUnchanged:true};
}catch(error){if(error.code!=='ENOENT')throw error;}
assert.equal(hash(await readFile('shared/data/campaign.json')),hash(campaignBytes),'Private model test must not regenerate canonical');
await writeFile(out+'/summary.json',JSON.stringify({passed:true,scope:'Isolated authored geometry fixtures, ordinary Engine walking with real finite movement budgets, App exact whole-battle Continue/export. DOM/storage are doubles. Actual archived old R9 is separate negative evidence; not whole combat, UI, browser or fresh fullplay.',authorSha256:hash(await readFile('tools/map-forge/stage23-loading-yard.mjs')),rootCause:'At the old eastern shared vertex, support lookup selects ground but slope-at-vertex selects its earlier steep canal-wall edge. Support is discarded; subpixel no-support foot rectangle enters the bridge and blocks. New 40px buried abutments separate steep faces from exposed joins.',rows,npcTickRows,originalSave},null,2)+'\n');
console.log('PASS bridge seams:',rows.length,'four-class/NPC bidirectional finite-budget cases; exact saved Continue each;',npcTickRows.length,'actual NPC lead-tick cases; old R9',originalSave.status);
