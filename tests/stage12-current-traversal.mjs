/** Current two-exit geometry, isolated from combat. Initial supported fixture,
 * other actors removed and movement replenished by the existing helper. Every
 * later coordinate comes from shared walk/jump/body physics. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {traverse} from './stage16-temple-traverse-helper.mjs';
const g=await runtime({legacyMaps:false}),st=g.HONRO_PROJECT.stages[11],routes=st.design.quarry.routes,back=st.terrains.find(t=>t.id==='sq-back-road'),upper=st.markers.find(m=>m.id==='route-upper-exit'),lower=st.markers.find(m=>m.id==='route-lower-exit');
const paths={upper:[...structuredClone(routes.find(r=>r.id==='FG').anchors),...back.points.slice(0,Math.max(...back.properties.honroWalkEdges)+2).filter(p=>p.x>8225&&p.x<upper.x),{x:upper.x,y:upper.y}],lower:structuredClone(routes.find(r=>r.id==='FH').anchors)};
assert.equal(paths.lower.at(-1).x,lower.x);assert.equal(paths.lower.at(-1).y,lower.y);
const rows=[];
for(const [route,anchors]of Object.entries(paths))for(const cls of ['archer','mage','knight','occultist']){
 const {b,e}=battlefield(g,12),u=e.heroesAlive().find(u=>u.cls===cls);b.units=[u];b.active=u.id;e.checkEnd=()=>false;
 for(const ts of[b.terrain,b.honroWorldTerrain])ts.find(t=>t.id==='sq-turning-veil').broken=true;
 Object.assign(u,{x:anchors[0].x,y:anchors[0].y,vx:0,vy:0});assert(g.HONRO_CORE.validTerrainContactPose(b.terrain,u));
 const result=traverse(g,b,e,u,anchors);rows.push({route,cls,...result});console.log(route,cls,result.passed?'PASS':'FAIL');assert(result.passed&&result.damage===0,JSON.stringify(rows.at(-1)));
}
await mkdir('/tmp/stage12-current-traversal',{recursive:true});await writeFile('/tmp/stage12-current-traversal/result.json',JSON.stringify({pass:true,scope:'Isolated locomotion; setup pose/open gate/actor removal/move refill; not normal combat',rows},null,2));
