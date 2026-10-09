/** Isolated Stage18 locomotion regression, not a normal-resource fullplay.
 *
 * The fixture removes other actors, disables the end check, initializes the
 * tested companion once at the authored start, and refills movement during
 * traversal. It never casts a skill or relocates a companion after that start.
 * Every later x/y write must originate in Engine.walk/jump/integrateBody;
 * recovery/teleport is forbidden. Actual movement and jump costs are recorded
 * even though this fixture replenishes the movement pool. Stage18 settled
 * geometry is produced with the real bell shift function before initialization.
 *
 * Run: node tests/stage18-bell-traversal.mjs
 * Optional focused diagnosis: --route=<id> --class=<class>
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {traverse} from './stage16-temple-traverse-helper.mjs';

const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,S=g.HonroStage18Bell;
const stage=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===18);
const classes=['archer','mage','knight','occultist'];
const option=key=>process.argv.find(s=>s.startsWith('--'+key+'='))?.split('=').slice(1).join('=');
const onlyRoute=option('route'),onlyClass=option('class');
assert(!onlyClass||classes.includes(onlyClass),'Unknown class filter');
assert(!onlyRoute||stage.design.space.routes.some(r=>r.id===onlyRoute),'Unknown route filter');
const selectedClasses=onlyClass?[onlyClass]:classes;
const selectedRoutes=stage.design.space.routes.filter(r=>!onlyRoute||r.id===onlyRoute);
const rows=[];
const permanent=['entry-under-bell','under-bell-entry-return','under-bell-keeper','keeper-under-bell-return'];

function fixture(cls,phase,start){
 const {b,e}=battlefield(g,18),u=e.heroesAlive().find(u=>u.cls===cls);
 assert(u,cls+' is deployed');
 if(phase==='settled'){
  const poses=b.units.map(v=>[v.id,v.x,v.y]);
  S.shift(b,b.honroBellDescent.distance);
  Object.assign(S.memory(b),{status:'settled',count:1});
  assert.deepEqual(b.units.map(v=>[v.id,v.x,v.y]),poses,'Bell shift must not carry actors');
 }
 b.units=[u];b.active=u.id;e.checkEnd=()=>false;
 Object.assign(u,{x:start.x,y:start.y,vx:0,vy:0});
 assert(C.validTerrainContactPose(b.terrain,u),`${cls} ${phase}: invalid authored start ${start.surfaceId}`);
 const audit={postStartExternalPositionWrites:0,recoveries:0,walkCalls:0,jumpCalls:0,physicsTicks:0,walkCost:0,jumpCost:0,pathLength:0,peakStepDistance:0};
 let allowed=0;
 for(const axis of ['x','y']){
  let value=u[axis];Object.defineProperty(u,axis,{enumerable:true,configurable:true,get(){return value;},set(next){if(!allowed){audit.postStartExternalPositionWrites++;throw Error(`Forbidden mid-route ${axis} write`);}value=next;}});
 }
 for(const key of ['walk','jump','integrateBody']){
  const real=e[key].bind(e);e[key]=function(...args){
   const before={x:u.x,y:u.y,move:u.moveLeft};let out;allowed++;
   try{out=real(...args);}finally{allowed--;}
   if(key==='walk'){audit.walkCalls++;audit.walkCost+=Math.max(0,before.move-u.moveLeft);}
   if(key==='jump'){audit.jumpCalls++;audit.jumpCost+=Math.max(0,before.move-u.moveLeft);}
   if(key==='integrateBody')audit.physicsTicks++;
   const distance=Math.hypot(u.x-before.x,u.y-before.y);audit.pathLength+=distance;audit.peakStepDistance=Math.max(audit.peakStepDistance,distance);
   return out;
  };
 }
 const recover=e.recover.bind(e);e.recover=function(...args){audit.recoveries++;return recover(...args);};
 return{b,e,u,audit};
}
function run(route,cls,phase,{expected='reachable',jump=true,tag='route'}={}){
 const {b,e,u,audit}=fixture(cls,phase,route.anchors[0]);
 const result=traverse(g,b,e,u,route.anchors,{jump});
 const row={route:route.id,cls,phase,tag,expected,...result,
  endReason:result.passed?'reached authored route end':result.failed?.reason||'incomplete',
  start:route.anchors[0],end:{x:u.x,y:u.y,support:e.contactSurface(u.x,u.y-5,u.y+5)?.t?.id},
  movementCost:audit.walkCost+audit.jumpCost,...audit};
 rows.push(row);
 assert.equal(audit.postStartExternalPositionWrites,0,`${route.id}/${cls}: no mid-route placement`);
 assert.equal(audit.recoveries,0,`${route.id}/${cls}: no recovery teleport`);
 assert.equal(result.damage,0,`${route.id}/${cls}: fall damage`);
 if(expected==='reachable'){
  assert(result.passed,`${route.id}/${cls}/${phase}: ${JSON.stringify(result.failed)}`);
  assert(C.validTerrainContactPose(b.terrain,u),`${route.id}/${cls}: invalid final body pose`);
 }else{
  assert(!result.passed,`${route.id}/${cls}: initial shell must close the sound window`);
  assert.equal(result.failed?.reason,'blocked',`${route.id}/${cls}: expected real solid collision`);
  assert(C.validTerrainContactPose(b.terrain,u),`${route.id}/${cls}: collision must leave a safe standing pose`);
 }
 console.log('PASS',tag,route.id,cls,phase,'cost='+row.movementCost.toFixed(1),'jumps='+result.jumps,'damage='+result.damage);
 return row;
}
let error;
try{
 assert.equal(stage.design.bell.zones.length,8);
 for(const route of selectedRoutes)for(const cls of selectedClasses)run(route,cls,route.bellState==='settled'?'settled':'initial');
 // These paths never rely on the shell. Re-run each direction after descent.
 for(const id of permanent.filter(id=>!onlyRoute||id===onlyRoute)){
  const route=stage.design.space.routes.find(r=>r.id===id);assert(route,id);
  for(const cls of selectedClasses){const row=run(route,cls,'settled',{jump:false,tag:'permanent-bottom-escape'});assert.equal(row.jumps,0);}
 }
 // Both directions hit real bronze in the initial state. The ordinary route
 // cases above prove both directions traverse the settled opening with no jump.
 for(const id of ['settled-inner-east-shortcut','settled-east-inner-return'].filter(id=>!onlyRoute||id===onlyRoute)){
  const route=stage.design.space.routes.find(r=>r.id===id);assert(route,id);
  for(const cls of selectedClasses)run(route,cls,'initial',{expected:'blocked',jump:false,tag:'initial-sound-window-closed'});
 }
 if(!onlyRoute&&!onlyClass){
  assert.equal(rows.filter(r=>r.tag==='route').length,stage.design.space.routes.length*4);
  assert.deepEqual([...new Set(rows.map(r=>r.cls))].sort(),[...classes].sort());
  assert.equal(rows.filter(r=>r.tag==='permanent-bottom-escape').length,16);
  assert.equal(rows.filter(r=>r.tag==='initial-sound-window-closed').length,8);
 }
}catch(e){error=e;}
await mkdir('_local/reports/stage18-bell',{recursive:true});
const report={passed:!error,scope:'Isolated geometry only. Other actors removed; movement replenished; normal combat/resources/objective completion are not tested.',
 projectSha256:createHash('sha256').update(JSON.stringify(g.HONRO_PROJECT)).digest('hex'),filters:{route:onlyRoute||null,cls:onlyClass||null},
 fixtures:{enemyAndAllyRemoval:true,movementRefill:true,initialPlacementOnly:true,postInitialTeleport:false,defaultBasicJumps:true,settledViaProductionShift:true},
 counts:{cases:rows.length,routes:stage.design.space.routes.length,classes:selectedClasses.length},
 failure:error?{message:error.message,stack:error.stack}:null,rows};
const suffix=onlyRoute||onlyClass?'-focused':'';
await writeFile(`_local/reports/stage18-bell/traversal${suffix}.json`,JSON.stringify(report,null,2)+'\n');
if(error)throw error;
console.log('Stage18 isolated traversal:',rows.length,'cases passed.');
