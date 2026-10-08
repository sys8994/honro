import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {act1Runtime,fixture,traverse} from './act1-spatial-test-helpers.mjs';
const g=await act1Runtime(),rows=[];
for(const id of [7,15])for(const cls of ['archer','mage','knight','occultist']){
 const {b,e}=fixture(g,id),u=id===7?g.HONRO_CORE.makeUnit(cls,0,300,4156.701030927835,{id:'probe'}):e.heroesAlive().find(u=>u.cls===cls);b.units=[u];b.active=u.id;e.checkEnd=()=>false;
 const st=g.HONRO_PROJECT.stages[id-1],routes=id===15?[{id:'main',points:st.design.space.routes.find(r=>r.id==='main').anchors}]:st.design.topology.ordinaryRoutes;
 for(const route of routes){if(id===7){Object.assign(u,route.from,{vx:0,vy:0});}const result=traverse(g,b,e,u,route.points||[route.to]);rows.push({stage:id,cls,route:route.id,...result});console.log(JSON.stringify({stage:id,cls,route:route.id,passed:result.passed,failed:result.failed,jumps:result.jumps,damage:result.damage}));}
}
await mkdir('_local/reports/forest-cavern',{recursive:true});await writeFile('_local/reports/forest-cavern/traversal.json',JSON.stringify(rows,null,2));if(rows.some(r=>!r.passed))process.exitCode=1;
