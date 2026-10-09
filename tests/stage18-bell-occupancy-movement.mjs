/** Actual shell-occupancy escape through the production App and Engine.
 * Initial fixture only: enemies removed; the four prerequisites are complete;
 * one companion stands on the real east lip at (8300,6290). The canonical
 * terrain is untouched except the already-broken release fixture. No later
 * actor placement, HP write, terrain edit or movement refill is performed by
 * the test. Normal defend/turn refresh, move and tick remain production code.
 * DOM/render/storage/clock are doubles. This is not normal combat fullplay.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C}=h,A=g.HonroAct2,S=g.HonroStage18Bell,rows=[];
let now=0;g.performance={now:()=>now};
await mkdir('_local/reports/stage18-bell',{recursive:true});
const exportFile=async(data,cls,checkpoint)=>{const file={...data,__honroTestProvenance:{source:'tests/stage18-bell-occupancy-movement.mjs',syntheticInitialFixture:true,normalCombatFullplay:false,fixture:'Enemies removed; four bell prerequisites complete; one companion initially placed on canonical east lip (8300,6290). Thereafter normal App actions, Engine movement and physics only.',actor:cls,checkpoint}};const path=`_local/reports/stage18-bell/occupancy-${checkpoint}-${cls}.json`;await writeFile(path,JSON.stringify(file,null,2)+'\n');return{path,file};};
const poses=b=>plain(b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp})));
const compact=b=>plain({units:b.units,terrain:b.terrain,world:b.honroWorldTerrain,items:b.items,round:b.round,phase:b.phase,side:b.side,active:b.active,descent:S.memory(b)});
function guard(app,audit){
 const e=app.engine,b=e.b;let allowed=0;
 function property(object,key,category){if(!(key in object))return;let value=object[key];Object.defineProperty(object,key,{enumerable:true,configurable:true,get(){return value;},set(next){if(!allowed){audit.externalWrites.push({category,key});throw Error('Forbidden post-fixture '+category+'.'+key+' write');}value=next;}});}
 for(const u of b.units)for(const key of ['x','y','hp','moveLeft'])property(u,key,'actor');
 for(const t of new Set([...(b.terrain||[]),...(b.honroWorldTerrain||[])]))for(const key of ['x','y','w','h','vertices','hp','broken'])property(t,key,'terrain');
 const permit=(object,key)=>{const real=object[key].bind(object);object[key]=function(...args){allowed++;try{return real(...args);}finally{allowed--;}};};
 for(const key of ['move','jump','tick'])permit(e,key);permit(app,'defend');
 const recover=e.recover.bind(e);e.recover=(...args)=>{audit.recoveries++;return recover(...args);};
 const hurt=e.hurt.bind(e);e.hurt=function(u,...args){const before=u.hp,out=hurt(u,...args);audit.damage+=Math.max(0,before-u.hp);return out;};
 return e;
}
for(const cls of ['archer','mage','knight','occultist']){
 let app=h.load(h.profileThrough(17));app.launch(18);h.finish(app);now+=1000;
 let e=app.engine,b=e.b;const id=e.heroesAlive().find(u=>u.cls===cls).id;
 // The only location/prerequisite edits in this test precede the write guard.
 b.units=b.units.filter(u=>u.side===0);const initial=e.unit(id);
 Object.assign(initial,{x:8300,y:6290,vx:0,vy:0});
 const a=A.memory(b);for(const key of ['clear-wards','silence','hold-silence','upper-chain'])a.done[key]=true;
 a.silenced=true;a.holds={'hold-silence':{progress:4,spawned:8,lastRound:b.round,guarded:true,continuous:true}};
 b.terrain.find(t=>t.id==='upper-chain').broken=true;
 assert(C.validTerrainContactPose(b.terrain,initial),'Canonical lip has full body clearance');
 assert.equal(e.contactSurface(initial.x,initial.y-1,initial.y+1)?.t.id,'sb-bell-east-lip');
 assert(S.swept(b,{x:initial.x-initial.r,y:initial.y-initial.h,w:initial.r*2,h:initial.h}),'Actual body, without warning padding, intersects the true polygon sweep');
 assert.deepEqual(plain(S.occupants(b).map(u=>u.id)),[id]);
 const initialHp=Object.fromEntries(b.units.map(u=>[u.id,u.hp])),items=plain(b.items),audit={externalWrites:[],recoveries:0,damage:0,moves:0,ticks:0,defends:[]};
 e=guard(app,audit);
 const tick=()=>{now+=C.STEP*1000;e.tick(C.STEP);if(!app.dialogue)app.missionTick(C.STEP);audit.ticks++;h.finish(app);};
 const until=(predicate,label,max=900)=>{for(let i=0;i<max&&!predicate();i++)tick();assert(predicate(),label);};
 const defend=()=>{assert(app.canInput(),'Normal defend input is open');const active=e.active.id;audit.defends.push({id:active,round:b.round,status:S.memory(b).status});app.defend();until(()=>app.canInput()&&e.active?.id!==active||S.memory(b).status==='lowering','Normal action boundary resolves');};
 S.transition(app);assert.equal(S.memory(b).status,'warning');
 for(let i=0;i<4;i++){assert.equal(S.memory(b).status,'warning');defend();}
 assert.equal(S.memory(b).status,'waiting');assert.equal(Object.keys(S.memory(b).opportunities).length,4);
 assert.equal(S.memory(b).offset,0);assert.equal(S.memory(b).count,0);assert(S.memory(b).reason.includes(e.unit(id).name));assert(app.canInput());
 const beforeSave=compact(b);app.export();const saved=await h.exported(),waitingFile=await exportFile(saved,cls,'waiting');await h.import(waitingFile.file);app.continue();now+=1000;
 e=app.engine;b=e.b;assert.deepEqual(compact(b),beforeSave,'Export/Continue preserves the waiting actor, state, resources and exact shell');
 assert.equal(S.memory(b).status,'waiting');assert.deepEqual(plain(S.occupants(b).map(u=>u.id)),[id]);assert(app.canInput());
 e=guard(app,audit);
 for(let i=0;e.active?.id!==id&&i<4;i++)defend();assert.equal(e.active?.id,id,'Blocker gets a real normal turn');
 const u=e.unit(id),moveStart=u.moveLeft,start={x:u.x,y:u.y};
 for(let i=0;i<300&&u.x>8175;i++){assert(app.canInput());assert.equal(e.active.id,id);e.move(-1,C.STEP);audit.moves++;tick();}
 until(()=>e.grounded(u),'Natural 80-unit step-down lands on the fixed gallery',300);
 assert(Math.abs(u.x-8170)<8);assert.equal(u.y,6370);assert.equal(e.contactSurface(u.x,u.y-1,u.y+1)?.t.id,'sb-east-gallery-sill');assert(C.validTerrainContactPose(b.terrain,u));
 assert(u.moveLeft<moveStart&&u.moveLeft>0,'Real movement spent the existing budget without a refill');
 assert.equal(S.occupants(b).length,0);assert.equal(S.memory(b).status,'waiting','Movement itself cannot silently trigger descent');assert(S.memory(b).reason.includes('다음 안전한 행동 종료'));
 const escaped={x:u.x,y:u.y,moveBefore:moveStart,moveAfter:u.moveLeft,cost:moveStart-u.moveLeft};
 const terrainBefore=plain(b.terrain.filter(t=>b.honroBellDescent.terrainIds.includes(t.id)).map(t=>({id:t.id,y:t.y,vertices:t.vertices}))),actorsBefore=poses(b);
 defend();until(()=>S.memory(b).status==='lowering','Next normal action boundary starts descent');
 const actorsDuringLowering=plain(b.units);assert.equal(S.memory(b).count,0);assert(!app.canInput(),'Input is held only for the finite lowering animation');
 until(()=>S.memory(b).status==='settled','One-time lowering completes');
 assert.equal(S.memory(b).offset,200);assert.equal(S.memory(b).count,1);assert.deepEqual(poses(b),actorsBefore,'The bell never carries or damages an actor');assert.deepEqual(plain(b.units),actorsDuringLowering,'All actor fields remain exact during lowering');
 let maxDescentCoordinateError=0;for(const old of terrainBefore){const t=b.terrain.find(t=>t.id===old.id);assert(t);assert.equal(t.id,old.id);assert.equal(t.vertices.length,old.vertices.length);const delta=Math.abs(t.y-(old.y+200));assert(delta<=1e-8);maxDescentCoordinateError=Math.max(maxDescentCoordinateError,delta);for(let i=0;i<old.vertices.length;i++){assert.equal(t.vertices[i].x,old.vertices[i].x);const error=Math.abs(t.vertices[i].y-(old.vertices[i].y+200));assert(error<=1e-8);maxDescentCoordinateError=Math.max(maxDescentCoordinateError,error);}}
 const once=plain(b.terrain);for(let i=0;i<150;i++)tick();assert.equal(S.memory(b).count,1);assert.deepEqual(plain(b.terrain),once,'No second shift');
 for(const actor of b.units)assert.equal(actor.hp,initialHp[actor.id]);assert.deepEqual(plain(b.items),items);assert.equal(audit.damage,0);assert.equal(audit.recoveries,0);assert.equal(audit.externalWrites.length,0);
 assert(app.canInput());app.export();const settledFile=await exportFile(await h.exported(),cls,'settled');
 rows.push({cls,files:{waiting:waitingFile.path,settled:settledFile.path},maxDescentCoordinateError,initialSupport:'sb-bell-east-lip',start,exactUnpaddedBodySweep:true,normalWarningOpportunities:4,waitingContinueExact:true,escaped,finalSupport:'sb-east-gallery-sill',offset:200,count:1,audit});
 console.log('PASS real occupancy escape and waiting Continue',cls,'cost='+escaped.cost.toFixed(1));
}
await mkdir('_local/reports/stage18-bell',{recursive:true});await writeFile('_local/reports/stage18-bell/occupancy-movement.json',JSON.stringify({projectSha256:createHash('sha256').update(JSON.stringify(g.HONRO_PROJECT)).digest('hex'),scope:'Production App and Engine movement after a documented enemy-free prerequisite/position fixture. Waiting export/Continue is real. No later placement, HP/resource refill or terrain editing by the test; normal turns may refresh movement. DOM/render/storage/clock are doubles; not normal combat fullplay.',rows},null,2)+'\n');
