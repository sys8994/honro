/** Isolated actual physics; movement refilled, opponents removed, gate opened.
 * Initialization places probes at route start. Traversal never corrects poses. */
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {traverse} from './stage17-worksite-traverse-helper.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const g=await runtime({legacyMaps:false}),st=g.HONRO_PROJECT.stages[16],rows=[];
const reverse=st.design.space.routes.find(r=>r.id==='main').anchors.slice().reverse().map(p=>{const{x,y,surfaceId}=p;return{x,y,surfaceId,...(surfaceId==='ws-hoist-service-bridge'&&x===5330?{jumpTo:{x:5160,support:'ws-hoist-west-lip',speed:1}}:{})};});
const supplemental=[{id:'main-return',defaultJump:true,anchors:reverse,testOnly:true},{id:'notes-deck-access',defaultJump:true,testOnly:true,anchors:[{x:9840,y:4726.666666666667,jumpTo:{x:10050,support:'ws-notes-work-deck',speed:1}},{x:10300,y:4508.928571428572},{x:10680,y:4551.03448275862}]}];
for(const route of [...st.design.space.routes,...supplemental])for(const cls of ['archer','mage','knight','occultist']){
 const {b,e}=battlefield(g,17),u=e.heroesAlive().find(u=>u.cls===cls),p=route.anchors[0];
 b.units=[u];b.active=u.id;e.checkEnd=()=>false;for(const t of b.terrain)if(t.id==='gate-repair')t.broken=true;
 Object.assign(u,{x:p.x,y:p.y,vx:0,vy:0,spawnX:p.x,spawnY:p.y});
 if(!g.HONRO_CORE.validTerrainContactPose(b.terrain,u))throw Error('Invalid route start '+route.id+' '+cls);
 const result=traverse(g,b,e,u,route.anchors,{jump:route.defaultJump!==false});
 rows.push({route:route.id,cls,supplemental:!!route.testOnly,...result});console.log(JSON.stringify({route:route.id,cls,passed:result.passed,failed:result.failed,jumps:result.jumps,damage:result.damage}));
}
await mkdir('_local/reports/stage17-worksite',{recursive:true});await writeFile('_local/reports/stage17-worksite/traversal.json',JSON.stringify({scope:'Cleared isolated route physics only; no combat completion or time claim.',rows},null,2));
if(rows.some(r=>!r.passed))process.exitCode=1;
