/** Isolated shared walk/jump integration; one setup pose, other actors removed,
 * movement refill in existing traverse helper. Not normal combat or UI proof. */
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {traverse} from './stage16-temple-traverse-helper.mjs';
const g=await runtime({legacyMaps:false,productionStory:true}),st=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===12),rs=st.design.quarry.routes;
const r=id=>structuredClone(rs.find(r=>r.id===id).anchors),upper=st.markers.find(m=>m.id==='route-upper-exit'),back=st.terrains.find(t=>t.id==='sq-back-road');
const paths={entry:[...r('AB'),...r('BC'),...r('CF')],upper:[...r('FG'),...back.points.slice(0,Math.max(...back.properties.honroWalkEdges)+2).filter(p=>p.x>r('FG').at(-1).x&&p.x<upper.x),{x:upper.x,y:upper.y}],lower:r('FH')},rows=[];
for(const [route,anchors]of Object.entries(paths))for(const cls of ['archer','mage','knight','occultist']){
 const{b,e}=battlefield(g,12),u=e.heroesAlive().find(u=>u.cls===cls);b.units=[u];b.active=u.id;e.checkEnd=()=>false;
 for(const ts of[b.terrain,b.honroWorldTerrain])ts.find(t=>t.id==='sq-turning-veil').broken=true;
 Object.assign(u,{x:anchors[0].x,y:anchors[0].y,vx:0,vy:0});assert(g.HONRO_CORE.validTerrainContactPose(b.terrain,u));
 const result=traverse(g,b,e,u,anchors);rows.push({route,cls,...result});console.log(route,cls,result.passed?'PASS':'FAIL');
 if(!result.passed||result.damage!==0){await mkdir('_local/reports/act2-compact-rollout-20261109',{recursive:true});await writeFile('_local/reports/act2-compact-rollout-20261109/movement12.json',JSON.stringify(rows));assert.fail(JSON.stringify(rows.at(-1)));}
}
await mkdir('_local/reports/act2-compact-rollout-20261109',{recursive:true});await writeFile('_local/reports/act2-compact-rollout-20261109/movement12.json',JSON.stringify(rows));
