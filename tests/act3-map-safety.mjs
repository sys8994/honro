/** Geometry safety fixtures; this is deliberately not normal-play evidence. */
import assert from 'node:assert/strict';import {readFile,writeFile,mkdir} from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';import {support} from '../tools/map-forge/act3-map-kit.mjs';
const root=process.env.HONRO_RUNTIME_ROOT||process.cwd(),{runtime}=await import(pathToFileURL(path.join(root,'game/tests/helpers.mjs'))),g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,p=JSON.parse(await readFile(process.env.HONRO_PROJECT_FILE||'shared/data/campaign.json'));g.HONRO_PROJECT=p;const rows=[];
assert.equal(g.HONRO_CONTENT.stages.length,30);
const selectedIds=process.argv.slice(2).map(Number);
for(const s of p.stages.slice(20).filter(s=>!selectedIds.length||selectedIds.includes(s.metadata.stageId))){
 const b=g.HonroMaps.createBattle(s,p,undefined,{origin:'campaign'}),pose=b.units.filter(u=>!g.HonroWorld.archetypes[u.honroVariant]?.flying).map(u=>({id:u.id,side:u.side,valid:C.validTerrainContactPose(b.terrain,u),x:u.x,y:u.y}));
 assert(pose.every(q=>q.valid),s.id+' exposed starting body: '+JSON.stringify(pose.filter(q=>!q.valid)));
 assert.deepEqual(JSON.parse(JSON.stringify(b.honroPlayBounds)),{left:0,top:0,right:s.width,bottom:s.height});assert(b.honroTerrainBounds.left<0&&b.honroTerrainBounds.right>s.width);assert(b.honroWorldTerrain?.length);
 const exit=s.markers.findLast(m=>m.type==='exit');assert.equal(s.anchors.exit.x,exit.x);assert.equal(s.anchors.exit.y,exit.y);
 rows.push({stage:s.metadata.stageId,test:'spawn-body-and-canonical-domain',passed:true,pose});
 for(const pool of b.waters){const tx=pool.x+pool.w/2;assert(pool.depth>=0&&Number.isFinite(pool.depth));
  for(const cls of (s.design.act3.party||['archer','mage','knight','occultist'])){const bb=g.HonroMaps.createBattle(s,p,undefined,{origin:'campaign'}),e=new C.Engine(bb,()=>{},true),u=bb.units.find(u=>u.side===0&&u.cls===cls);bb.units=[u];bb.active=u.id;e.checkEnd=()=>false;
   // A map-boundary knockback fixture invokes the actual recovery behavior.
   // Normal water does not drown; no new water/death rule is introduced.
   Object.assign(u,{x:tx,y:s.height+90,vx:0,vy:600,fallApexY:pool.y-200});const before=u.hp;e.integrateBody(u,C.STEP);assert(!u.dead);assert(u.hp<before);assert(C.validTerrainContactPose(bb.terrain,u),`${s.id}/${cls}: recovery must choose a clear supported body pose`);
   rows.push({stage:s.metadata.stageId,test:'canal-knockback-recovery',hero:cls,poolX:tx,passed:true,hpLost:before-u.hp,returned:{x:u.x,y:u.y},support:e.surface(u.x,u.y-2,u.y+2)?.t?.id});
   Object.assign(u,{x:tx,y:s.height+90,hp:1,dead:false,vx:0,vy:600});e.integrateBody(u,C.STEP);assert(u.dead,'Low-HP fall must be allowed to fail');
   const fresh=g.HonroMaps.createBattle(s,p,undefined,{origin:'campaign'}),fu=fresh.units.find(v=>v.side===0&&v.cls===cls);assert(!fu.dead&&fu.hp>0);assert(C.validTerrainContactPose(fresh.terrain,fu));assert.equal(Object.keys(fresh.honroState.act3?.done||{}).length,0,'A fresh map is not a copy of failed objective state');rows.push({stage:s.metadata.stageId,test:'death-then-fresh-map-retry',hero:cls,passed:true,spawn:{x:fu.x,y:fu.y}});
  }
 }
}
await mkdir('_local/reports/act3-production',{recursive:true});await writeFile('_local/reports/act3-production/safety-checks.json',JSON.stringify({projectFile:process.env.HONRO_PROJECT_FILE||'shared/data/campaign.json',scope:'Native initial-body, terrain-domain, canal knockback recovery and fresh-map retry fixtures. Actual App retry/save is covered by the runtime regression suite, not this test. Water is not a new automatic-drowning mechanic.',rows},null,2)+'\n');console.log(`PASS Act3 map safety: ${rows.length} checks`);
