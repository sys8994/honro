/** 실제 엔진 보행/도약/낙하의 몸 점유만 검사. 위치/적 제거는 명시한 준비 fixture다. */
import assert from'node:assert/strict';import{mkdir,writeFile}from'node:fs/promises';import{runtime,battlefield}from'../game/tests/helpers.mjs';const g=await runtime({legacyMaps:false}),S=g.HonroStage16Temple,results=[];
const area=(u,v)=>Math.max(0,Math.min(u.x+u.r,v.x+v.r)-Math.max(u.x-u.r,v.x-v.r))*Math.max(0,Math.min(u.y,v.y)-Math.max(u.y-u.h,v.y-v.h));
for(const mode of['two-monks','hero-jump','enemy-jump','tall-enemy','occupied-veranda','late-landing']){
 const{b,e,app}=battlefield(g,16);g.HonroAllies.attach(app,e);g.HonroAct2.attach(app,e);const a=g.HonroAct2.memory(b);Object.assign(a.done,{monk:true,witness:true});for(const u of b.units){if(u.side===1)u.dead=true;if(u.side===0){u.x=500;u.y=5480;}}
 const monks=b.units.filter(u=>u.honroCivilian),blocker=['enemy-jump','tall-enemy'].includes(mode)?b.units.find(u=>u.side===1&&u.h===(mode==='enemy-jump'?80:138)):e.heroesAlive()[0];
 if(['hero-jump','enemy-jump','tall-enemy'].includes(mode))Object.assign(blocker,{x:4700,y:4250,dead:false,hp:900,fixed:true});
 if(mode==='occupied-veranda')e.heroesAlive().forEach((u,i)=>Object.assign(u,{x:5500+i*90,y:4250}));
 if(mode==='late-landing'){const u=e.unit('objective');Object.assign(u,{x:5837,y:4080,vy:200,jumping:true,fixed:false});Object.assign(e.unit('resident-1'),{x:5550,y:4250});b.honroState.templeEscort={version:1,actors:{objective:{round:b.round,escapeX:5837},'resident-1':{round:b.round}}};Object.assign(blocker,{x:5837,y:4250,h:92,r:22});assert.equal(area(u,blocker),0);}
 let maximum=0,largestStep=0,arrived=false;for(let frame=0;frame<3600;frame++){
  if(frame%360===0)b.round++;if(mode==='tall-enemy'&&frame===1800){blocker.dead=true;blocker.hp=0;}if(mode==='occupied-veranda'&&frame===1800)for(const u of e.heroesAlive()){u.x=500;u.y=5480;}
  const before=monks.map(u=>({x:u.x,y:u.y}));e.stepUnits(1/120);S.advanceMonks(app,1/120);
  for(const [i,u]of monks.entries()){largestStep=Math.max(largestStep,Math.hypot(u.x-before[i].x,u.y-before[i].y));for(const v of b.units)if(v!==u&&!v.dead&&v.hp>0&&!v.honroObjectiveTarget){const overlap=area(u,v);maximum=Math.max(maximum,overlap);assert(overlap<1e-5,mode+' cannot enter another body during vertical/horizontal movement: '+u.id+'/'+v.id+' area='+overlap);}}
  if(mode==='occupied-veranda'&&frame<1800)assert(!S.arrived(b),'occupied destinations cannot count as arrival');
  if(S.arrived(b)){arrived=true;break;}
 }
 if(!arrived)console.log('STALL',mode,monks.map(u=>({id:u.id,x:u.x,y:u.y,vy:u.vy,jumping:u.jumping,move:u.moveLeft,ground:e.grounded(u),q:b.honroState.templeEscort.actors[u.id]})));assert(arrived,mode+' must replan/resume on a legal free route');assert(largestStep<32,'no teleport');
 // Arrival must reject even an externally introduced overlapping save pose.
 const u=e.unit('objective'),v=e.heroesAlive()[0];Object.assign(v,{x:u.x,y:u.y});assert(!S.arrived(b),'overlapping pose cannot unlock hall');
 results.push({mode,maxOverlapArea:maximum,largestPhysicalStep:largestStep,arrivedBeforeExternalOverlap:true});
}
{const{b,e,app}=battlefield(g,16);delete b.honroTempleEscortRevision;const walk=e.walk,integrate=e.integrateBody;g.HonroAct2.attach(app,e);assert.equal(e.walk,walk);assert.equal(e.integrateBody,integrate);}
await mkdir('_local/reports/stage16-escort-pilot-a',{recursive:true});await writeFile('_local/reports/stage16-escort-pilot-a/body-collision.json',JSON.stringify({results,scope:'고정/후발 점유 fixture에서 정상 엔진 적분 사용. 라운드 직접 진행은 자원 복구용이며 실제 전투 턴 근거가 아니다.'},null,2));console.log('PASS',results);
