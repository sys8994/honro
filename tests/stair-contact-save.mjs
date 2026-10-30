/** Captured ordinary-play35 geometry/pose, actual App stop/Continue, and guards.
 * DOM/audio/frame scheduling are doubles. This is not a new campaign clear. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
const observed=JSON.parse(await readFile('tools/density-qa/evidence/stair-contact-save/observed-stage35.json','utf8'));
process.env.HONRO_ACT4_RELEASE='1';
const {g,C,...h}=await appHarness(),rows=[];
assert(C.validTerrainContactPose(observed.terrain,observed.unit),'Actual ordinary-play35 saved pose is clear');
function fixture(stage,cls){const a=h.load(h.profileThrough(34));a.launch(stage);h.finish(a);assert(a.engine,`launch ${stage}: ${a.lastNotice}`);const b=a.engine.b,existing=b.units.find(v=>v.side===0&&v.cls===cls),u=existing||g.HonroUnits.create(g.HonroUnits.record(cls,'fixture-'+cls,540,1910,'player'),b,a.profile,{id:stage});Object.assign(b,{units:[u],active:u.id,phase:'aim',side:0,projectiles:[],waters:[],drafts:[],fields:[],width:7200,height:3200,honroGeometryReady:true,terrain:plain(observed.terrain)});Object.assign(u,{x:859.95,y:1836,vx:0,vy:0,airborne:false,jumping:false});a.engine.checkEnd=()=>false;return{a,b,u};}
const pose=u=>plain({x:u.x,y:u.y,vx:u.vx,vy:u.vy,airborne:u.airborne,jumping:u.jumping,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft});
function resume(q,label,recover=false){const before=pose(q.u),terrain=plain(q.b.terrain),n=q.b.honroContactRecoveries?.length||0;q.a.stopBattle();assert(q.a.profile.honroBattle);q.a.continue();q.a.close();assert(q.a.engine);const b=q.a.engine.b,u=b.units.find(v=>v.id===q.u.id);assert.deepEqual(plain(b.terrain),terrain);if(recover){assert(Math.hypot(u.x-before.x,u.y-before.y)>.5);assert(C.validTerrainContactPose(b.terrain,u));assert.equal(b.honroContactRecoveries.length,n+1);for(const k of ['hp','focus','moveLeft'])assert.equal(u[k],before[k]);}else{assert.deepEqual(pose(u),before,label);assert.equal(b.honroContactRecoveries?.length||0,n);}const once=pose(u);q.a.stopBattle();q.a.continue();q.a.close();assert.deepEqual(pose(q.a.engine.b.units.find(v=>v.id===u.id)),once,'Repeated Continue remains exact');rows.push({label,recover,before,after:once});}
for(const stage of [1,35])for(const cls of ['archer','mage','knight','occultist']){
 const q=fixture(stage,cls);assert(q.a.engine.grounded(q.u));assert(C.validTerrainContactPose(q.b.terrain,q.u));resume(q,`stage${stage}/${cls}/observed lower stair contact`);
}
{const q=fixture(1,'knight');q.u=plain(observed.unit);q.b.units=[q.u];q.b.active=q.u.id;assert(q.a.engine.grounded(q.u));resume(q,'exact captured stage35 knight in production App save path');}
// Live horizontal impulse ends at the same point-foot wall offset, rather than
// reconstructing a save-only exception from a hand-picked grounded flag.
for(const direction of [-1,1]){
 const q=fixture(1,'knight'),x=860,top=1836,high=1800;
 q.b.terrain=[{id:'step',x:0,y:high,w:2000,h:1400,mat:'rock',hp:99999,maxHp:99999,vertices:direction>0?[{x:0,y:top},{x,y:top},{x,y:high},{x:2000,y:high},{x:2000,y:3200},{x:0,y:3200}]:[{x:0,y:high},{x,y:high},{x,y:top},{x:2000,y:top},{x:2000,y:3200},{x:0,y:3200}]}];
 Object.assign(q.u,{x:x-direction*35,y:top,vx:direction*450,vy:0});for(let i=0;i<120;i++)q.a.engine.integrateBody(q.u,1/120,true);assert(Math.abs(q.u.x-(x-direction*.05))<1e-7,'Actual sweep leaves0.05 wall gap');assert(q.a.engine.grounded(q.u));assert(C.validTerrainContactPose(q.b.terrain,q.u));resume(q,`ordinary impulse stair stop ${direction}`);
}
const solid=(id,x,y,w,h)=>({id,x,y,w,h,mat:'rock',hp:99999,maxHp:99999});
for(const kind of ['riser-burial','deep-floor','full-wall','thin-roof','low-cave']){
 const q=fixture(1,'knight');
 if(kind==='riser-burial')q.u.x=861;
 if(kind==='deep-floor')q.u.y+=20;
 if(kind==='full-wall'){q.b.terrain.push(solid('wall',850,1600,100,500));q.u.x=870;}
 if(kind==='thin-roof')q.b.terrain.push(solid('thin-roof',800,q.u.y-q.u.h*.3,120,2));
 if(kind==='low-cave')q.b.terrain.push(solid('low-roof',800,1600,150,200));
 assert.equal(C.validTerrainContactPose(q.b.terrain,q.u),false,kind+' remains invalid');resume(q,kind,true);
}
await mkdir('_local/reports/stair-contact-save',{recursive:true});await writeFile('_local/reports/stair-contact-save/summary.json',JSON.stringify({passed:true,observedFixtureProject:observed.projectSHA256,observedFixtureRuntime:observed.runtimeSHA256,locomotionSha256:createHash('sha256').update(await readFile('shared/engine/src/locomotion.ts')).digest('hex'),rows,limits:['Actual App stop/Continue with DOM/storage doubles; explicitly constructed stage1/35 fixtures use captured ordinary-play geometry and pose.','Captured original unit independently validated; full original stage35 tape replay is separate.']},null,2));console.log('PASS',rows.length,'exact stair contact Continue cases and actual burial/roof repair guards');
