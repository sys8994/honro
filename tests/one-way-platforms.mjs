// Ground-start input sequences through real authored maps. No mid-route pose,
// gravity, velocity, movement-budget or HP corrections. Not a combat clear.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {beforePlatformPassages,platformPassageDelta} from './platform-passage-delta-helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,party=battlefield(g,11).e.heroesAlive(),rows=[],audit=[];
const fixtures=[
 {stage:8,side:'west',floor:'bier-road',start:2150,actions:[['jump',2150,'eave-step-west-1'],['jump',2340,'eave-step-west-2'],['walk',2400,'eave-step-west-2'],['jump',2400,'west-eave']]},
 {stage:8,side:'east',floor:'bier-road',start:4665,actions:[['jump',4665,'eave-step-east-1'],['walk',4930,'eave-step-east-1'],['jump',5105,'eave-step-east-2'],['walk',5140,'eave-step-east-2'],['jump',5140,'east-eave']]},
 {stage:9,side:'west',floor:'yard-floor',start:470,actions:[['jump',470,'west-step-1'],['jump',640,'west-step-2'],['walk',700,'west-step-2'],['jump',700,'west-gallery']]},
 {stage:9,side:'east',floor:'yard-floor',start:2350,actions:[['jump',2350,'east-step-1'],['jump',2470,'east-step-2'],['walk',2530,'east-step-2'],['jump',2530,'east-gallery']]},
 {stage:10,side:'west',floor:'outer-yard',start:1550,actions:[['jump',1270,'west-step'],['jump',1280,'gallery-link-west'],['jump',1280,'west-gallery']]},
 {stage:10,side:'east',floor:'outer-yard',start:3440,actions:[['jump',3440,'east-step'],['jump',3610,'gallery-link-east'],['jump',3610,'east-gallery']]}
];
const current=g.HONRO_PROJECT,previous=beforePlatformPassages(current);
for(const st of current.stages.filter(st=>st.metadata.stageId<=20)){
 const compiled=g.HonroMaps.compile(st,current);
 for(const t of st.terrains){const live=compiled.terrain.find(v=>v.id===t.id),world=compiled.worldTerrain?.find(v=>v.id===t.id);assert.equal(live.oneWay,!!t.oneWay,t.id+' authoring flag preserved');if(world)assert.equal(world.oneWay,live.oneWay,t.id+' world/collision mode');if(t.properties?.honroCeiling)assert.equal(live.oneWay,false,t.id+' cave ceiling stays solid');audit.push({stage:st.metadata.stageId,id:t.id,oneWay:live.oneWay,ceiling:!!live.honroCeiling});}
}
for(const [stage,ids] of [[5,['waterfall-roof']],[7,['hollow-roof']]])for(const id of ids)assert.equal(current.stages[stage-1].terrains.find(t=>t.id===id).oneWay,false);
for(const r of fixtures)for(const cls of ['archer','mage','knight','occultist'])for(const fixed of [false,true]){
 g.HONRO_PROJECT=fixed?current:previous;const {b,e}=battlefield(g,r.stage),u=structuredClone(party.find(u=>u.cls===cls)),floor=b.terrain.find(t=>t.id===r.floor);
 Object.assign(u,{x:r.start,y:C.topAt(floor,r.start),vx:0,vy:0,acted:false});b.units=[u];b.active=u.id;b.phase='aim';b.side=0;e.checkEnd=()=>false;
 assert(C.validTerrainContactPose(b.terrain,u),'The initial body must be on clear ordinary ground');
 const start={x:u.x,y:u.y,h:u.h,hp:u.hp,moveLeft:u.moveLeft},hops=[];
 for(const [action,x,target]of r.actions){
  const before={x:u.x,y:u.y,hp:u.hp,moveLeft:u.moveLeft},launched=action==='walk'||e.jump(u);let frames=0,still=0;
  for(;launched&&frames<360;frames++){
   const oldX=u.x;if(Math.abs(x-u.x)>1)e.move(Math.sign(x-u.x)*Math.min(1,Math.abs(x-u.x)/(u.walkSpeed*C.STEP)),C.STEP);e.integrateBody(u,C.STEP);
   if(action==='walk'){still=Math.abs(oldX-u.x)<1e-6?still+1:0;if(Math.abs(x-u.x)<=1||still>12)break;}
   else if(frames>2&&e.grounded(u))break;
  }
  const support=e.contactSurface(u.x,u.y-.15,u.y+.15)?.t?.id,passed=launched&&support===target&&Math.abs(x-u.x)<=2;
  hops.push({action,target,x,launched,before,end:{x:u.x,y:u.y,hp:u.hp,moveLeft:u.moveLeft},support,passed});if(!passed)break;
 }
 const row={stage:r.stage,side:r.side,cls,fixed,start,hops,passed:hops.length===r.actions.length&&hops.every(h=>h.passed),damage:start.hp-u.hp,spent:start.moveLeft-u.moveLeft};rows.push(row);
 if(fixed){assert(row.passed,JSON.stringify(row));assert.equal(row.damage,0,'Intended platform ascent causes no damage');assert(row.spent>=3*e.jumpCost(u),'Actual jumps consume movement budget');assert(row.spent<start.moveLeft,'Route fits a normal turn budget');}
}
g.HONRO_PROJECT=current;
assert.equal(rows.filter(r=>r.fixed).length,24);assert(rows.filter(r=>!r.fixed).every(r=>!r.passed),'The same direct input routes reproduce the old blockage');
await mkdir('_local/reports/one-way',{recursive:true});await writeFile('_local/reports/one-way/platform-routes.json',JSON.stringify({sourceBaseline:platformPassageDelta.sourceCommit,scope:'Four production bodies, six ground-start optional ascent routes, actual movement costs and no mid-route repositioning. Old/new authored geometry comparison; not a normal-combat clear or browser test.',fixtures,audit,rows},null,2)+'\n');
console.log(`PASS ${rows.filter(r=>r.fixed&&r.passed).length}/24 direct ascents without damage; ${rows.filter(r=>!r.fixed&&!r.passed).length}/24 old routes blocked; ${audit.length} authored terrain modes audited`);
