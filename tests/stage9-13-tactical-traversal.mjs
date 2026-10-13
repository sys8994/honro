import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {traverse} from './stage17-worksite-traverse-helper.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const g=await runtime({legacyMaps:false}),rows=[];
for(const n of [9,13])for(const route of g.HONRO_PROJECT.stages[n-1].design.tacticalRoutes.routes)for(const reverse of [false,true])for(const cls of ['archer','mage','knight','occultist']){
 const {b,e}=battlefield(g,n),u=e.heroesAlive().find(u=>u.cls===cls)||structuredClone(battlefield(g,13).e.heroesAlive().find(u=>u.cls===cls)),anchors=reverse?route.anchors.slice().reverse():route.anchors;
 b.units=[u];b.active=u.id;e.checkEnd=()=>false;const p=anchors[0];Object.assign(u,{x:p.x,y:p.y,vx:0,vy:0,spawnX:p.x,spawnY:p.y});
 const result=traverse(g,b,e,u,anchors,{jump:route.defaultJump!==false});rows.push({stage:n,route:route.id,reverse,cls,...result});console.log(JSON.stringify({stage:n,route:route.id,reverse,cls,passed:result.passed,failed:result.failed}));
}
await mkdir('_local/reports/stage9-13',{recursive:true});await writeFile('_local/reports/stage9-13/traversal.json',JSON.stringify({scope:'Isolated physical traversal; move budget renewed, no combat claim, gate never altered, start initialized once per probe; no pose corrections.',rows},null,2));if(rows.some(r=>!r.passed))process.exitCode=1;
