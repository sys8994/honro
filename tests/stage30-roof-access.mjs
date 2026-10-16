/** Focused real-physics fixtures, not normal combat completion.
 * Start poses only; no mid-route teleports, skill use or terrain mutation. */
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
for(const cls of ['archer','mage','knight','occultist'])for(const side of ['west','east']){
 const {b,e}=battlefield(g,30),u=e.heroesAlive().find(u=>u.cls===cls),roof=b.terrain.find(t=>t.id===`sf-quay-${side}-loft`);assert(roof.oneWay);b.units=[u];b.active=u.id;e.checkEnd=()=>false;
 const surface=()=>e.contactSurface(u.x,u.y-5,u.y+5)?.t?.id;
 const at=(x,y)=>Object.assign(u,{x,y,vx:0,vy:0,airborne:false,jumping:false,acted:false,moveLeft:u.maxMove});
 const tick=()=>e.integrateBody(u,1/120),walk=(dir)=>e.walk(u,dir,1/120);
 // Both small loading roofs retain oneWay head passage from the real floor.
 at(side==='west'?5120:6200,5470);const hp=u.hp;assert.equal(C.passiveRank(u,'SP03'),0,'No jump passive required');assert(C.validTerrainContactPose(b.terrain,u));assert(e.jump(u));let headPassed=false,landedOnRoof=false;
 for(let i=0;i<220;i++){tick();if(u.y-u.h<roof.y&&u.y>roof.y)headPassed=true;if(i>20&&e.grounded(u)){landedOnRoof=surface()===roof.id;break;}}
 assert(headPassed,'Basic jump body crosses roof underside '+side+'/'+cls);
 // East uses the existing reflector. West is now reachable directly from the court.
 if(side==='east'){at(6010,5320);assert(e.jump(u));for(let i=0;i<240;i++){if(u.x<6200)walk(1);tick();if(i>30&&e.grounded(u)&&surface()===roof.id)break;}}
 else assert(landedOnRoof,'West roof now reachable by untrained basic jump from court');
 assert.equal(surface(),roof.id,'Ordinary approach lands on '+roof.id+'/'+cls);const top={x:u.x,y:u.y};assert(e.drop(u),'Down jump accepted on roof');for(let i=0;i<300;i++){tick();if(i>40&&e.grounded(u)&&surface()!==roof.id)break;}
 for(let j=0;j<3&&surface()!=='sf-ferry-court';j++){for(let i=0;i<40;i++)tick();assert(e.drop(u),'Existing lower oneWay permits a second down jump');for(let i=0;i<300;i++){tick();if(i>40&&e.grounded(u))break;}}assert.equal(surface(),'sf-ferry-court','Drop returns to landing floor');assert.equal(u.hp,hp,'No mandatory fall damage');
 if(side==='west'){for(const x of [5350,4920]){for(let i=0;i<260&&Math.abs(u.x-x)>5;i++){walk(Math.sign(x-u.x));tick();}assert(Math.abs(u.x-x)<6,'Ground route beneath roof remains open');assert.equal(surface(),'sf-ferry-court');}}
 rows.push({cls,side,headPassed,directFloorJumpLands:landedOnRoof,approach:side==='east'?'existing reflector + jump':'court + untrained basic jump',top,returned:{x:u.x,y:u.y,support:surface()},hpPreserved:true,oneWay:true});
}
writeFileSync('review/stage30/roof-access.json',JSON.stringify({pass:true,scope:'Initial supported pose fixtures on existing floor/reflector/descent; isolated actor and checkEnd disabled. Ordinary move/jump/drop physics without skills or terrain edits. Not a normal-resource combat playthrough.',rows},null,2));console.log(JSON.stringify({pass:true,conditions:rows.length,rows}));
