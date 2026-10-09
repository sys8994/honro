/** Isolated actual Stage16 route physics. Opponents are removed and movement
 * refilled; probes are placed only at the route start. Never correct a pose after
 * walking, a jump or a descent. This is not normal-input combat completion. */
import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {traverse} from './stage16-temple-traverse-helper.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const g=await runtime({legacyMaps:false}),st=g.HONRO_PROJECT.stages[15],rows=[];
assert.equal(st.design.space.routes.length,7,'Seven declared temple routes');
const selected=(process.env.HONRO_TEMPLE_ROUTES||'').split(',').filter(Boolean),classes=(process.env.HONRO_TEMPLE_CLASSES||'archer,mage,knight,occultist').split(',');
const routes=selected.length?st.design.space.routes.filter(r=>selected.includes(r.id)):st.design.space.routes;
assert(routes.length,'At least one selected route');for(const cls of classes)assert(['archer','mage','knight','occultist'].includes(cls),'Known collision body');
for(const route of routes)for(const cls of classes){
 const {b,e}=battlefield(g,16),u=e.heroesAlive().find(u=>u.cls===cls),p=route.anchors[0];
 b.units=[u];b.active=u.id;e.checkEnd=()=>false;
 Object.assign(u,{x:p.x,y:p.y,vx:0,vy:0,spawnX:p.x,spawnY:p.y});
 const result=g.HONRO_CORE.validTerrainContactPose(b.terrain,u)
  ?traverse(g,b,e,u,route.anchors,{jump:route.defaultJump!==false})
  :{passed:false,failed:{reason:'invalid route start',goal:p,x:u.x,y:u.y},ticks:0,jumps:0,damage:0,samples:[]};
 rows.push({route:route.id,cls,...result});console.log(JSON.stringify({route:route.id,cls,passed:result.passed,failed:result.failed,jumps:result.jumps,damage:result.damage}));
}
await mkdir('_local/reports/stage16-temple',{recursive:true});await writeFile('_local/reports/stage16-temple/traversal.json',JSON.stringify({stageSha256:createHash('sha256').update(JSON.stringify(st)).digest('hex'),coverage:{declaredRoutes:st.design.space.routes.length,testedRoutes:routes.map(r=>r.id),classes},scope:'Isolated route physics only. Opponents removed, start poses initialized and movement refilled; no later pose corrections. Not normal combat completion or elapsed play time.',rows},null,2)+'\n');
if(rows.some(r=>!r.passed))process.exitCode=1;
