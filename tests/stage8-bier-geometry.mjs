/** Isolated ordinary geometry. Finite entry pools charged; turns refilled, no combat claim. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {authorStage8Bier} from '../tools/map-forge/stage8-bier.mjs';
import {traverse} from './stage8-bier-traverse-helper.mjs';
import {bierEntryProfile} from './stage8-bier-entry-helper.mjs';
import {heroClearance} from './stage8-bier-clearance-helper.mjs';
const sourcePaths=['tools/map-forge/stage8-bier-geometry.mjs','tools/map-forge/stage8-bier.mjs','shared/runtime/stage8-bier.js','shared/engine/src/locomotion.ts','tests/stage8-bier-clearance-helper.mjs','tests/stage8-bier-traverse-helper.mjs'],sourceHash=async()=>Object.fromEntries(await Promise.all(sourcePaths.map(async p=>[p,createHash('sha256').update(await readFile(p)).digest('hex')]))),inputHashes=await sourceHash();
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,clone=v=>JSON.parse(JSON.stringify(v)),old=clone(g.HONRO_PROJECT);
g.HONRO_PROJECT=await authorStage8Bier(old,g,{art:false});
const s=g.HONRO_PROJECT.stages[7],profile=bierEntryProfile(g,{ordinaryStats:0,basicOnly:true}).profile,rows=[],errors=[];
assert.deepEqual(clone(g.HONRO_PROJECT.stages.filter((_,i)=>i!==7)),old.stages.filter((_,i)=>i!==7));
assert.equal(g.HonroSpaceLayout.validate(s).length,0,JSON.stringify(g.HonroSpaceLayout.validate(s)));
assert.deepEqual(clone(await authorStage8Bier(g.HONRO_PROJECT,g,{art:false})),clone(g.HONRO_PROJECT),'Idempotent source');
const option=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3),onlyRoute=option('route'),onlyClass=option('class'),fullBody=process.argv.includes('--full-body'),keepGoing=process.argv.includes('--keep-going');
outer:for(const r of s.design.space.routes.filter(r=>!onlyRoute||r.id===onlyRoute))for(const cls of onlyClass?[onlyClass]:['archer','mage','knight']){
 const {b,e}=battlefield(g,8,{profile:clone(profile),entry:false}),u=e.heroesAlive().find(u=>u.cls===cls);
 b.units=[u];b.active=u.id;e.checkEnd=()=>false;
 Object.assign(u,{x:r.anchors[0].x,y:r.anchors[0].y,vx:0,vy:0});
 let cost=0,jumpStart=null,lastGrounded={x:u.x,y:u.y,support:e.contactSurface(u.x,u.y-.2,u.y+.2)?.t.id};const landings=[],clearance=[],contactTransitions=[],rawRectangle=[];let row;
 try{
  assert(C.validTerrainContactPose(b.terrain,u),'Clear start '+r.id);
  if(fullBody)assert.equal(g.HonroStage8Bier.terrainBlockers(e,u).length,0,'Whole-body clear start '+r.id);
  for(const k of ['walk','jump','integrateBody']){
   const fn=e[k].bind(e);e[k]=(...args)=>{
    const before=u.moveLeft,from={x:u.x,y:u.y},out=fn(...args);
    if(fullBody){const result=heroClearance(g,e,u,{lastGrounded});if(result.raw.length)rawRectangle.push({op:k,x:u.x,y:u.y,raw:result.raw});if(k==='integrateBody'){if(result.contacts.length)contactTransitions.push({x:u.x,y:u.y,contacts:result.contacts,validContact:result.validContact});if(result.blocked.length){clearance.push({op:k,x:u.x,y:u.y,blocked:result.blocked});throw Error('Head/torso or invalid foot clearance '+JSON.stringify(clearance.at(-1)));}}}
    if(k==='integrateBody'&&e.grounded(u)&&C.validTerrainContactPose(b.terrain,u))lastGrounded={x:u.x,y:u.y,support:e.contactSurface(u.x,u.y-.2,u.y+.2)?.t.id};
    if(k!=='integrateBody')cost+=Math.max(0,before-u.moveLeft);
    if(k==='jump'&&out)jumpStart=from;
    if(k==='integrateBody'&&jumpStart&&e.grounded(u)){landings.push({from:jumpStart,to:{x:u.x,y:u.y},rise:jumpStart.y-u.y});jumpStart=null;}
    return out;
   };
  }
  e.recover=()=>{throw Error('Recovery forbidden');};
  row={route:r.id,cls,...traverse(g,b,e,u,r.anchors)};
  assert(row.passed,JSON.stringify(row.failed));assert.equal(row.damage,0);
  assert(landings.every(v=>v.rise<=150.01),'Actual ordinary landing rise <=150: '+JSON.stringify(landings));
 }catch(error){row={...row,route:r.id,cls,passed:false,error:error.message};errors.push({route:r.id,cls,error:error.message});}
 Object.assign(row,{cost,movePool:u.maxMove,turnEquivalent:cost/u.maxMove,landings,clearance,rawRectangle,contactTransitions});rows.push(row);
 console.log(row.passed?'PASS':'FAIL',r.id,cls,cost.toFixed(1),row.error||JSON.stringify(row.failed));
 if(!row.passed&&!keepGoing)break outer;
}
const result={passed:!errors.length,scope:'Actual walk/jump/physics with normal Lv7 move and jump costs; refill between actions, other actors removed, initial pose set per route. Intact seals. Not normal combat or UI.',wholeBodyAfterEveryPhysicsFrame:fullBody,originalFullRectangleAtEveryOperationPreserved:fullBody,actualLandingRiseLimit:150.01,stageSha256:createHash('sha256').update(JSON.stringify(s)).digest('hex'),sourceSha256:inputHashes,sourceStillCurrent:JSON.stringify(inputHashes)===JSON.stringify(await sourceHash()),rows,errors};
await mkdir('_local/reports/stage8-bier',{recursive:true});
await writeFile('_local/reports/stage8-bier/geometry'+(onlyRoute?'-'+onlyRoute:'')+(onlyClass?'-'+onlyClass:'')+'.json',JSON.stringify(result,null,2));
assert.equal(errors.length,0,JSON.stringify(errors));assert(result.sourceStillCurrent,'All geometry/physics/audit input sources remain byte-exact throughout this run');
