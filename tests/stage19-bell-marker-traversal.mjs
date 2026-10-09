/** Stage19 continuous marker-access regression derived from the independent
 * 712dce6 review and extended to explicitly touch all 18 existing markers.
 * Geometry fixture only: other actors are removed and movement is refilled.
 * Uses each companion's actual authored spawn, without even initial placement.
 * This proves no ritual progression, enemy combat, or normal-resource fullplay.
 */
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {traverse} from './stage16-temple-traverse-helper.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,st=g.HONRO_PROJECT.stages[18],plain=x=>JSON.parse(JSON.stringify(x));
const marker=id=>plain(st.markers.find(m=>m.id===id));
// A continuous basic-locomotion tour visits every existing Stage19 marker,
// including the four wave entry markers. It does not complete any objective.
function stage19MarkerTour(){
 const st=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===19);
 const top=id=>{const t=st.terrains.find(t=>t.id===id);return t.points.slice(0,t.properties.honroWalkEdges.length+1);};
 const at=(id,x)=>{const ps=top(id);for(let i=1;i<ps.length;i++){const a=ps[i-1],z=ps[i];if(x>=a.x&&x<=z.x&&z.x>a.x)return{x,y:a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x),surfaceId:id};}throw Error('19 tour support '+id+'/'+x);};
 const walk=(id,a,z)=>[...new Set([a,...top(id).map(p=>p.x).filter(x=>x>Math.min(a,z)&&x<Math.max(a,z)),z])].sort((x,y)=>a<=z?x-y:y-x).map(x=>at(id,x));
 const mark=id=>{const m=st.markers.find(m=>m.id===id);return{id:m.id,x:m.x,y:m.y};};
 const jump=(id,x,support,to,speed)=>({...at(id,x),jumpTo:{x:to,support,speed}});
 const rock=(x,extra={})=>({x,y:5290,surfaceId:'sb-court-reflector',...extra});
 const anchors=[...walk('act2-floor',520,1050),jump('act2-floor',1050,'sb-entry-rise',1100,.4),...walk('sb-entry-rise',1100,1940),mark('route'),...walk('sb-entry-rise',1940,2240),...walk('sb-suppression-court',2240,3030),mark('separate-1'),mark('hold-first'),...walk('sb-suppression-court',3030,3090),mark('spirit-lamp-0'),...walk('sb-suppression-court',3090,3260),mark('send-1'),jump('sb-suppression-court',3260,'sb-court-reflector',3350,.5),rock(3380,{dropTo:{x:3470,support:'sb-suppression-court',stepOffX:3460}}),...walk('sb-suppression-court',3470,3970),mark('wave-hold-first'),...walk('sb-suppression-court',3970,3425),jump('sb-suppression-court',3425,'sb-court-reflector',3370,.4),rock(3330,{dropTo:{x:3250,support:'sb-suppression-court',stepOffX:3240}}),...walk('sb-suppression-court',3250,2240),...walk('sb-entry-rise',2240,1100),{...at('sb-entry-rise',1100),dropTo:{x:1010,support:'act2-floor',stepOffX:1005}}];
 let x=1010;for(const id of ['wave-hold-second','separate-2','hold-second','spirit-lamp-1','send-2','separate-3','hold-last','send-3','clear-souls','wave-hold-last','wave','old-soul']){const m=mark(id);anchors.push(...walk('act2-floor',x,m.x),m);x=m.x;}
 return{id:'stage19-all-markers',anchors,markerIds:st.markers.map(m=>m.id)};
}
const tour=stage19MarkerTour();
const legs=[{id:'all-existing-markers',markers:tour.markerIds,anchors:tour.anchors}];
const rows=[];
for(const cls of ['archer','mage','knight','occultist']){
 const {b,e}=battlefield(g,19),u=e.heroesAlive().find(v=>v.cls===cls),resident=e.unit('objective');
 assert(resident,'protected resident present');assert(C.validTerrainContactPose(b.terrain,resident),'resident clear and grounded');assert(resident.fixed,'protected resident remains fixed');
 const actualInitial={x:u.x,y:u.y};b.units=[u];b.active=u.id;e.checkEnd=()=>false;
 const audit={externalPositionWrites:0,recoveries:0,walkCalls:0,jumpCalls:0,cost:0,ticks:0};let allowed=0;
 for(const key of ['x','y']){let value=u[key];Object.defineProperty(u,key,{enumerable:true,configurable:true,get(){return value},set(v){if(!allowed){audit.externalPositionWrites++;throw Error('external '+key+' write');}value=v;}});}
 for(const key of ['walk','jump','integrateBody']){const real=e[key].bind(e);e[key]=function(...args){const move=u.moveLeft;allowed++;let out;try{out=real(...args)}finally{allowed--}if(key==='walk')audit.walkCalls++;if(key==='jump')audit.jumpCalls++;if(key==='integrateBody')audit.ticks++;audit.cost+=Math.max(0,move-u.moveLeft);return out;};}
 const recover=e.recover.bind(e);e.recover=function(...args){audit.recoveries++;return recover(...args)};
 const results=[];
 for(const leg of legs){
  const result=traverse(g,b,e,u,leg.anchors);results.push({id:leg.id,markers:leg.markers,...result,end:{x:u.x,y:u.y}});
  assert(result.passed,cls+'/'+leg.id+': '+JSON.stringify(result.failed));assert.equal(result.damage,0,'no fall damage');assert(C.validTerrainContactPose(b.terrain,u),'valid end pose');
  for(const id of leg.markers){const m=marker(id);const sample=result.samples.find(s=>s.goal.id===id);assert(sample, id+' visited');assert(Math.hypot(sample.x-m.x,sample.y-m.y)<60,id+' reached actual marker');}
 }
 assert.equal(audit.externalPositionWrites,0);assert.equal(audit.recoveries,0);
 rows.push({cls,actualInitial,residentInitial:{x:resident.x,y:resident.y,hp:resident.hp,maxHp:resident.maxHp},audit,legs:results});console.log('PASS stage19 continuous actual-spawn marker traversal',cls,'cost='+audit.cost.toFixed(1));
}
const result={derivedFrom:'independent review at 712dce63edcca5519681f720943dfa771a0d2065',markers:st.markers.map(m=>m.id),projectSha256:createHash('sha256').update(JSON.stringify(g.HONRO_PROJECT)).digest('hex'),scope:'Geometry only: one companion kept, other actors removed, movement replenished. Actual authored spawn, no initial placement or later relocation; Engine.walk/jump/integrateBody only. Marker arrival verified, no ritual progression, normal resources or fullplay claim.',rows};await mkdir('_local/reports/stage18-bell',{recursive:true});await writeFile('_local/reports/stage18-bell/stage19-marker-traversal.json',JSON.stringify(result,null,2)+'\n');
