// Baseline optional-jump audit. Every trial stages once on the declared main
// approach, then uses only Engine.move/jump/wait/tick. It never changes position,
// HP, movement budget, ranks or velocity after staging. Combat is isolated.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[],shotRows=[];
const requested=process.argv.slice(2).map(Number),ids=requested.length?requested:Array.from({length:10},(_,i)=>i+11);
const plain=x=>JSON.parse(JSON.stringify(x));
const dt=C.STEP;
function makeTrial(template,cls,route){
 const b=plain(template),u=b.units.find(u=>u.side===0&&u.cls===cls),entry=route.anchors[0];
 b.units=[u];b.active=u.id;b.phase='aim';b.side=0;b.projectiles=[];Object.assign(u,{x:entry.x,y:entry.y,vx:0,vy:0,jumping:false,airborne:false,acted:false});
 assert(!u.ranks.SP03,'baseline unit unexpectedly has a jump upgrade');
 for(const requirement of route.requires||[]){const t=b.terrain.find(t=>t.id===requirement.terrainId);assert(t,'missing prerequisite terrain');if(requirement.state==='broken')t.broken=true;else if(requirement.state==='restored')t.vertices=plain(t.honroRestoredVertices);else throw Error('Unknown route prerequisite '+requirement.state);}
 const e=new C.Engine(b,()=>{},false);e.checkEnd=()=>false;return{b,e,u,ticks:0,waits:0};
}
function tick(q){q.e.tick(dt);q.ticks++;}
function budget(q){
 if(q.u.moveLeft>10)return true;
 if(!q.e.grounded(q.u)||!q.e.canAct()||!q.e.wait())return false;
 q.waits++;for(let j=0;j<2400&&!q.e.canAct()&&!q.u.dead;j++)tick(q);
 return q.e.canAct()&&q.u.moveLeft>10;
}
function moveTo(q,x,{grounded=true,maxTicks=3000}={}){
 let still=0;
 for(let age=0;age<maxTicks;age++){
  if(q.u.dead)return{ok:false,reason:'dead'};
  if(Math.abs(q.u.x-x)<=3&&(!grounded||q.e.grounded(q.u)))return{ok:true};
  if(!budget(q))return{ok:false,reason:'movement budget did not renew'};
  const before=q.u.x;if(Math.abs(q.u.x-x)>3)q.e.move(Math.sign(x-q.u.x),dt);tick(q);
  if(Math.abs(q.u.x-before)<.005&&q.e.grounded(q.u)&&Math.abs(q.u.x-x)>3){if(++still>120)return{ok:false,reason:'walking approach blocked'};}else still=0;
 }
 return{ok:false,reason:'movement timeout'};
}
function attempt(template,cls,route,takeoffX){
 const q=makeTrial(template,cls,route),{b,e,u}=q,surface=g.HONRO_PROJECT.stages[b.honroStage-1].design.space.surfaces.find(s=>s.id===route.anchors[1].surfaceId),shelf=b.terrain.find(t=>t.id===surface.terrainId),beforeHp=u.hp;
 const approach=moveTo(q,takeoffX);if(!approach.ok)return{passed:false,reason:approach.reason,takeoffX,position:{x:u.x,y:u.y}};
 const takeoff={x:u.x,y:u.y};if(u.moveLeft<e.jumpCost(u)+80){e.wait();q.waits++;for(let j=0;j<2400&&!e.canAct();j++)tick(q);}
 if(!e.jump(u))return{passed:false,reason:'jump refused',takeoff,position:{x:u.x,y:u.y}};
 const landingX=Math.max(shelf.x+32,Math.min(shelf.x+shelf.w-32,takeoffX)),air=[];let landed=false;
 for(let age=0;age<700&&!u.dead;age++){
  if(Math.abs(u.x-landingX)>3)e.move(Math.sign(landingX-u.x),dt);tick(q);air.push({x:u.x,y:u.y});
  if(e.grounded(u)){landed=true;break;}
 }
 const support=e.surface(u.x,u.y-4,u.y+4),landing={x:u.x,y:u.y,surfaceId:support?.t.id};
 if(!landed||support?.t.id!==shelf.id)return{passed:false,reason:landed?'landed below shelf':'jump never settled',takeoff,landing,apex:Math.min(...air.map(p=>p.y)),requiredRise:takeoff.y-route.anchors[1].y};
 // Touch both authored shelf anchors and then walk off to the main-floor exit.
 for(const point of route.anchors.slice(1)){
  const outcome=moveTo(q,point.x);if(!outcome.ok)return{passed:false,reason:outcome.reason,takeoff,landing,position:{x:u.x,y:u.y},goal:point};
  if(Math.abs(u.y-point.y)>12)return{passed:false,reason:'wrong landing/exit level',takeoff,landing,position:{x:u.x,y:u.y},goal:point};
 }
 return{passed:true,takeoff,landing,apex:Math.min(...air.map(p=>p.y)),requiredRise:takeoff.y-route.anchors[1].y,exit:{x:u.x,y:u.y},hpBefore:beforeHp,hpAfter:u.hp,jumpRank:u.ranks.SP03||0,ticks:q.ticks,waits:q.waits};
}
for(const id of ids){
 const {b}=battlefield(g,id),st=g.HONRO_PROJECT.stages[id-1];
 for(const route of st.design.space.routes.filter(r=>r.kind==='optional-jump')){
  const surface=st.design.space.surfaces.find(s=>s.id===route.anchors[1].surfaceId),shelf=b.terrain.find(t=>t.id===surface.terrainId),floor=b.terrain.find(t=>t.id==='act2-floor');
  // Declared entry first; then physically walk along the same main approach to
  // alternate takeoffs. This tests actual shelf access, not one chosen timing.
  const xs=[route.anchors[0].x,shelf.x+40,shelf.x+shelf.w-40,shelf.x+shelf.w+40,shelf.x-40,...Array.from({length:Math.ceil((shelf.w+900)/60)+1},(_,i)=>shelf.x-450+i*60)].filter(x=>x>40&&x<b.width-40);
  for(const cls of ['archer','mage','knight','occultist']){
   const attempts=[];let result;
   for(const x of [...new Set(xs)]){result=attempt(b,cls,route,x);attempts.push(result);if(result.passed)break;}
   const row={stage:id,route:route.id,hero:cls,passed:!!attempts[0]?.passed,accessibleWithDifferentTakeoff:!!result?.passed&&!attempts[0]?.passed,declaredEntry:route.anchors[0],shelf:{terrainId:shelf.id,x:shelf.x,width:shelf.w,y:route.anchors[1].y,leftFloorRise:C.topAt(floor,shelf.x-30,0)-route.anchors[1].y,rightFloorRise:C.topAt(floor,shelf.x+shelf.w+30,0)-route.anchors[1].y},attempts:attempts.length,declaredAttempt:attempts[0],result,bestFailure:result?.passed?undefined:attempts.filter(a=>a.landing).sort((a,b)=>a.apex-b.apex)[0]};
   rows.push(row);console.log(JSON.stringify(row));
  }
 }
}

// A representative one-way granite perch must support ordinary A01 and M01
// fire from low ground to high ground and back. Enemies/HP are staged once,
// then a real projectile must cause damage through unchanged terrain.
for(const cls of ids.includes(11)?['archer','mage']:[])for(const direction of ['low-to-high','high-to-low']){
 const id=11,{b,e}=battlefield(g,id),st=g.HONRO_PROJECT.stages[id-1],route=st.design.space.routes.find(r=>r.kind==='optional-jump'),shelfSurface=st.design.space.surfaces.find(s=>s.id===route.anchors[1].surfaceId),shelf=b.terrain.find(t=>t.id===shelfSurface.terrainId),floor=b.terrain.find(t=>t.id==='act2-floor');
 const u=e.heroesAlive().find(u=>u.cls===cls),enemy=e.alive(1)[0],high={x:shelf.x+shelf.w*.6,y:route.anchors[1].y},low={x:shelf.x+shelf.w+360,y:C.topAt(floor,shelf.x+shelf.w+360,0)},from=direction==='low-to-high'?low:high,to=direction==='low-to-high'?high:low;
 b.units=[u,enemy];b.active=u.id;b.phase='aim';b.side=0;e.checkEnd=()=>false;Object.assign(u,{...from,vx:0,vy:0,acted:false});Object.assign(enemy,{...to,vx:0,vy:0});
 const skill=C.SKILLS[C.baseSkill(cls)];let aim=null;
 for(const seed of e.shotSeeds(u,skill,enemy)){const p=e.predict(u,skill,seed.angle,seed.power,enemy,false);if(p.unit===enemy.id){aim=seed;break;}}
 if(!aim)for(const power of [.2,.35,.5,.65,.8,1]){for(let angle=-15;angle<=195;angle+=2){const p=e.predict(u,skill,angle,power,enemy,false);if(p.unit===enemy.id){aim={angle,power};break;}}if(aim)break;}
 const before=enemy.hp;let fired=false;if(aim){fired=e.fire(skill.id,aim.angle,aim.power);for(let frame=0;frame<1800&&b.projectiles.length;frame++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);}
 const row={stage:id,route:route.id,hero:cls,direction,from,to,skill:skill.id,aim,fired,damage:before-enemy.hp,passed:fired&&enemy.hp<before};shotRows.push(row);console.log(JSON.stringify({shot:row}));
}
await mkdir('_local/reports/act2-spatial',{recursive:true});await writeFile(`_local/reports/act2-spatial/optional-routes${requested.length?'-'+ids.join('-'):''}.json`,JSON.stringify({mode:'Isolated baseline jump/landing and ordinary shot fixtures; no geometry or movement-stat changes; not normal-combat completion.',rows,shots:shotRows},null,2));
if(rows.some(r=>!r.passed)||shotRows.some(r=>!r.passed))process.exitCode=1;
