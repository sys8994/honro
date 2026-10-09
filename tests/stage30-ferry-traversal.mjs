/** Shared-physics geometry fixtures. Move pools are replenished; no mid-route placement/recovery is allowed. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {traverse} from './stage16-temple-traverse-helper.mjs';
import {authorStage30Ferry} from '../tools/map-forge/apply-stage30-ferry.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
const sourceGenerated=!g.HONRO_PROJECT.stages[29]?.initialState?.honroFerryRevision;
if(sourceGenerated)g.HONRO_PROJECT=await authorStage30Ferry(g.HONRO_PROJECT,g,{art:false});
const stage=g.HONRO_PROJECT.stages[29];
const option=k=>process.argv.find(s=>s.startsWith('--'+k+'='))?.slice(k.length+3),onlyRoute=option('route'),onlyClass=option('class');
const routes=stage.design.ferry.routes.filter(r=>!onlyRoute||r.id===onlyRoute),classes=onlyClass?[onlyClass]:['archer','mage','knight','occultist'];
assert(routes.length&&classes.every(c=>C.CLASS_IDS.includes(c)));
const rows=[];
function run(route,cls){
 const {b,e}=battlefield(g,30),u=e.heroesAlive().find(u=>u.cls===cls),phase=route.ferryState==='settled'?'settled':'initial';
 if(phase==='settled')for(const list of [b.terrain,b.honroWorldTerrain])for(const t of list){if(b.honroFerrySpec.enableTerrainIds.includes(t.id))t.broken=false;if(b.honroFerrySpec.disableTerrainIds.includes(t.id))t.broken=true;}
 b.sceneVersion++;b.units=[u];b.active=u.id;e.checkEnd=()=>false;
 const start=route.anchors[0];Object.assign(u,{x:start.x,y:start.y,vx:0,vy:0});assert(C.validTerrainContactPose(b.terrain,u),'Body-clear start '+route.id+'/'+cls);
 const audit={externalPositionWrites:0,recoveries:0,walkCost:0,jumpCost:0,physicsTicks:0},level=u.level,maxMove=u.maxMove;let allowed=0;
 for(const axis of ['x','y']){let v=u[axis];Object.defineProperty(u,axis,{enumerable:true,configurable:true,get(){return v;},set(n){if(!allowed){audit.externalPositionWrites++;throw Error('Forbidden mid-route '+axis+' write');}v=n;}});}
 for(const key of ['walk','jump','integrateBody']){const real=e[key].bind(e);e[key]=(...args)=>{const before=u.moveLeft;allowed++;let q;try{q=real(...args);}finally{allowed--;}if(key==='walk')audit.walkCost+=Math.max(0,before-u.moveLeft);if(key==='jump')audit.jumpCost+=Math.max(0,before-u.moveLeft);if(key==='integrateBody')audit.physicsTicks++;return q;};}
 const recover=e.recover.bind(e);e.recover=(...a)=>{audit.recoveries++;return recover(...a);};
 const result=traverse(g,b,e,u,route.anchors),cost=audit.walkCost+audit.jumpCost;
 const row={route:route.id,cls,phase,level,maxMove,...result,...audit,movementCost:cost,minMovementTurns:Math.ceil(cost/maxMove),end:{x:u.x,y:u.y,support:e.contactSurface(u.x,u.y-5,u.y+5)?.t.id}};rows.push(row);
 console.log(result.passed?'PASS':'FAIL',route.id,cls,phase,'cost='+cost.toFixed(1),'turns='+row.minMovementTurns,result.failed?JSON.stringify(result.failed):'');
 assert.equal(audit.externalPositionWrites,0);assert.equal(audit.recoveries,0,'No recovery teleport');assert.equal(result.damage,0,'No required fall damage');assert(result.passed,JSON.stringify(row));assert(C.validTerrainContactPose(b.terrain,u));
}
let error;try{for(const route of routes)for(const cls of classes)run(route,cls);}catch(e){error=e;}
await mkdir('_local/reports/stage30-ferry',{recursive:true});await writeFile('_local/reports/stage30-ferry/traversal'+(onlyRoute?'-'+onlyRoute:'')+(onlyClass?'-'+onlyClass:'')+'.json',JSON.stringify({passed:!error,sourceGenerated,scope:'Isolated geometry, static initial/settled fixture; actors removed and movement replenished. Shared Stage16 input helper and current Engine. No normal combat/resources/runtime-transition/browser claim.',terrainSha256:createHash('sha256').update(JSON.stringify(stage.terrains)).digest('hex'),routesSha256:createHash('sha256').update(JSON.stringify(stage.design.ferry.routes)).digest('hex'),rows,error:error?.message},null,2)+'\n');if(error)throw error;
