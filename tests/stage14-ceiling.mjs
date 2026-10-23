/** Finite production geometry fixtures. No normal combat completion claim. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {followVerticalRoute} from './vertical-route-helpers.mjs';
import {applyStage14FamilyPlatform} from '../tools/map-forge/stage14-family-platform.mjs';
import {applyStage14Ceiling,ROOF_ID} from '../tools/map-forge/stage14-ceiling.mjs';
const plain=x=>JSON.parse(JSON.stringify(x)),base='5987f6db1a500f7a7911880e9b84578b9cf37cb8',before=JSON.parse(execFileSync('git',['show',base+':shared/data/campaign.json'],{maxBuffer:40e6})),after=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
const normalized=structuredClone(after),s=normalized.stages[13];s.terrains=s.terrains.filter(t=>t.id!==ROOF_ID);s.design.space.terrainPlanes=s.design.space.terrainPlanes.filter(p=>!p.stage14Ceiling);delete s.design.ceiling14;const lintel=s.terrains.find(t=>t.id==='v14-family-roof-step');lintel.oneWay=false;delete lintel.properties.projectileSolid;
assert.deepEqual(normalized,before,'Only new Stage14 vault and its visible material');
assert.deepEqual(plain(applyStage14FamilyPlatform(applyStage14Ceiling(structuredClone(before)))),after,'Reproducible');assert.deepEqual(plain(applyStage14Ceiling(structuredClone(after))),after,'Idempotent');
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,q=battlefield(g,14),roof=q.b.terrain.find(t=>t.id===ROOF_ID);assert(roof&&!roof.oneWay&&roof.indestructible);
assert.deepEqual(plain(g.HonroTerrainDomain.validate(g.HONRO_PROJECT.stages[13])),[]);
assert(g.HonroTerrainDomain.render(q.b).some(t=>t.id===ROOF_ID));
const initial=q.b.units.map(u=>[u.id,u.x,u.y,u.hp]);for(const u of q.b.units)assert(!g.HonroStage8Bier.terrainBlockers(q.e,u).some(t=>t.id===ROOF_ID),'Roof clearance '+u.id);
for(let n=0;n<240;n++)q.e.tick(C.STEP);assert.deepEqual(q.b.units.map(u=>[u.id,u.x,u.y,u.hp]),initial,'2s idle exact; no burial/contact correction');
const rows=[],only=process.argv.find(v=>v.startsWith('--route='))?.slice(8);
for(const route of g.HONRO_PROJECT.stages[13].design.vertical14.routes.filter(r=>!only||r.id===only))for(const cls of ['archer','mage','knight','occultist']){
 const p=C.defaults();p.recruited=C.CLASS_IDS;for(const c of p.recruited)p.heroes[c].xp=C.xpAtLevel(13);
 const q=battlefield(g,14,{profile:p,entry:false}),u=q.e.heroesAlive().find(u=>u.cls===cls);if(route.gate)q.b.terrain.find(t=>t.id===route.gate).broken=true;
 q.b.units=[u];q.b.active=u.id;q.b.side=0;q.b.phase='aim';q.e.checkEnd=()=>false;Object.assign(u,{x:route.anchors[0].x,y:route.anchors[0].y,vx:0,vy:0,airborne:false,jumping:false});
 const result=C.validTerrainContactPose(q.b.terrain,u)?followVerticalRoute(g,q,u,route):{passed:false,failed:'invalid start'};rows.push({route:route.id,cls,...result});console.log(result.passed?'PASS':'FAIL',route.id,cls,result.failed||'');
}
await mkdir('_local/reports/act2-ceiling-20261023',{recursive:true});await writeFile('_local/reports/act2-ceiling-20261023/routes'+(only?'-'+only:'')+'.json',JSON.stringify({source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),allNonRoofDataExact:true,actors:q.b.units.length,idleExact:true,scope:'Isolated one-time route entry pose, one actor, finite Engine move/jump/wait. Open-bridge precondition for route fixture; no resource refill/recover/position rewrite after setup. Not normal combat.',rows},null,2)+'\n');assert(rows.every(r=>r.passed),'Route failures in routes.json');
