(function(G){'use strict';
// New temple entry only. Existing Stage16 battle snapshots retain their timing.
const A=G.HonroAct2,W=G.HonroAllies,C=G.HONRO_CORE;
const active=b=>b?.honroStage===16&&!b.honroCustom&&b.honroTempleVersion===1;
const memory=b=>(b.honroState.templeDefense??={version:1,warnings:{},entries:{}});
const entryFor=(b,index)=>b.honroTempleDefenseEntries?.[Math.floor(index/3)%2];
function warn(app){const b=app.engine.b,s=A.current(b);if(s?.id!=='hold-hall')return;
 const h=A.memory(b).holds?.[s.id],index=h?.spawned||0;if(index>=(s.wave?.count||0)||h?.waveRound===b.round)return;
 const marker=b.honroMarkers.find(m=>m.id===s.id);if(!marker||!app.engine.heroesAlive().some(u=>Math.hypot(u.x-marker.x,u.y-marker.y)<s.radius))return;
 const key=s.id+'-'+index,mem=memory(b),at=entryFor(b,index);if(mem.warnings[key]||!at)return;
 mem.warnings[key]={serial:b.honroState.actorTurnSerial||0,round:b.round,side:at.side};
 app.event(at.side==='west'?'서쪽 돌계단의 꺼진 석등이 흔들린다. 다음 움직임에 대비하세요.':'동쪽 회랑에서 돌이 끌리는 소리가 난다. 법당 측면을 살피세요.');app.dirty=true;
}
const execute=W.execute;
W.execute=function(app,action){const b=app.engine?.b;
 if(!active(b)||action?.type!=='spawn'||action.kind!=='stoneLantern'||!/^hold-hall-(0|3|6|9)$/.test(action.source||''))return execute(app,action);
 const index=Number(action.source.split('-').at(-1)),entry=entryFor(b,index),mem=memory(b),warning=mem.warnings[action.source];
 if(!entry||!warning||(b.honroState.actorTurnSerial||0)<=warning.serial)return false;
 const n=action.n||1,candidates=[entry,...(entry.alternates||[]).map(p=>({...p,side:entry.side}))];
 const at=candidates.find(p=>{const xs=Array.from({length:n},(_,i)=>p.x+(i-(n-1)/2)*115);return!b.units.some(u=>u.side===0&&!u.dead&&u.hp>0&&xs.some(x=>Math.abs(u.x-x)<280)&&Math.abs(u.y-p.y)<300);});
 if(!at)return false;
 const ids=new Set(b.units.map(u=>u.id)),result=execute(app,{...action,x:at.x,y:at.y,support:at.surfaceId,spacing:115,maxDistance:220});if(result===false)return false;
 for(const u of b.units)if(u.side===1&&!ids.has(u.id)){
  // The explicit Act2 wave elite assignment follows this factory call.
  if(u.elite){u.combatBaseHp/=1.25;u.hp=u.maxHp=Math.round(u.combatBaseHp*C.DIFFICULTIES[b.difficulty].hp);u.honroXpWeight/=1.25;}u.elite=false;u.armor=.04;u.honroTempleEntry=at.side;
 }
 mem.entries[action.source]={side:at.side,x:at.x,y:at.y,round:b.round,serial:b.honroState.actorTurnSerial||0};return result;
};
const tick=A.tick;A.tick=function(app,dt){if(active(app.engine?.b))warn(app);return tick(app,dt);};
// Pilot A is authored into fresh entries only; old snapshots never acquire it.
const pilot=b=>active(b)&&b.honroTempleEscortRevision===1;
const monkIds=['objective','resident-1'];
const escortMemory=b=>(b.honroState.templeEscort??={version:1,actors:{}});
const mark=(b,id)=>b.honroMarkers.find(m=>m.id===id);
const living=u=>!!u&&!u.dead&&u.hp>0;
function author(project){return {...project,stages:project.stages.map(original=>{
 if(!original.metadata?.campaign||original.metadata.stageId!==16||original.initialState?.honroTempleVersion!==1)return original;
 const st=JSON.parse(JSON.stringify(original)),b=st.initialState,content=b.honroNarrativeContent;
 b.honroTempleEscortRevision=1;
 // Geometry, actors, combat resources and existing response events are untouched.
 const list=b.honroAct2Steps.filter(s=>s.id!=='clear-rescue-threat');
 const witness=list.find(s=>s.id==='witness');witness.afterEvidence='monk';
 list.splice(list.findIndex(s=>s.id==='hall'),0,{id:'temple-escort',kind:'evidence',afterEvidence:'witness',label:'두 승려를 법당 툇마루로 안내'});
 content.steps=JSON.parse(JSON.stringify(list));b.honroAct2Steps=list;
 content.guide='승려를 구하고 증언과 열쇠를 받으세요. 두 승려를 법당 툇마루까지 안내한 뒤 기록방 안의 이송 기록을 확인하세요.';
 const hall=st.markers.find(m=>m.id==='hall'),record=st.markers.find(m=>m.id==='record');
 Object.assign(record,{x:6200,y:hall.y});
 st.markers.push({id:'temple-escort',type:'act2',action:'act2',x:hall.x,y:hall.y,label:'두 승려를 법당 툇마루로 안내'});
 const space=st.design.space;space.sites.record={...space.sites.record,x:record.x,y:record.y,surfaceId:'tm-great-hall-plinth',roomId:'great-hall',standing:{x:record.x,y:record.y,surfaceId:'tm-great-hall-plinth'}};
 st.design.temple.escort={revision:1,actors:monkIds,arrival:{x:hall.x,y:hall.y},record:{x:record.x,y:record.y}};
 return st;
 })};}
function arrived(b){const hall=mark(b,'hall');return monkIds.every(id=>{const u=b.units.find(u=>u.id===id);return living(u)&&Math.abs(u.y-hall.y)<20&&Math.abs(u.x-hall.x)<=180&&!u.jumping&&Math.abs(u.vy)<3&&C.validTerrainContactPose(b.terrain,u)&&!blocked(b,u,u);});}
function evidenceSatisfied(b,s){if(!pilot(b))return null;const done=A.memory(b).done;if(s.id==='temple-escort')return !!done.witness&&arrived(b);if(s.id==='witness'||s.id==='record')return !!done[s.afterEvidence]&&b.units.some(u=>u.side===0&&living(u)&&G.HonroEvidenceQuests.pickupNear(u,mark(b,s.id)));return null;}
// The monks use the existing supported shelter exit and processional approach.
// Walk/jump/integration remain the engine's swept physical movement. Reservations
// add bodies to this civilian route only; no enemy-count or safety-radius gate.
function blocked(b,u,p){const overlap=(at,v)=>Math.max(0,Math.min(at.x+u.r,v.x+v.r)-Math.max(at.x-u.r,v.x-v.r))*Math.max(0,Math.min(at.y,v.y)-Math.max(at.y-u.h,v.y-v.h));return b.units.some(v=>v.id!==u.id&&living(v)&&!v.honroObjectiveTarget&&!v.eaterCapturedBy&&overlap(p,v)>1e-5&&overlap(p,v)>=overlap(u,v)-1e-5);}
function destination(b,u,index){const hall=mark(b,'hall');
 const offsets=index?[100,150,50,-100,-150,-50]:[-100,-150,-50,100,150,50];
 for(const offset of offsets){const p={x:hall.x+offset,y:hall.y};if(!blocked(b,u,p))return p;}
 // An occupied veranda is a visible body obstruction. Approach its edge rather
 // than selecting an occupied fallback or globally waiting back at the shelter.
 return {x:hall.x-270-index*70,y:hall.y};
}
function sweepCivilian(b,u,from,to){
 const overlap=(p,v)=>Math.max(0,Math.min(p.x+u.r,v.x+v.r)-Math.max(p.x-u.r,v.x-v.r))*Math.max(0,Math.min(p.y,v.y)-Math.max(p.y-u.h,v.y-v.h));
 const bodies=b.units.filter(v=>v!==u&&living(v)&&!v.honroObjectiveTarget&&!v.eaterCapturedBy),steps=Math.max(1,Math.ceil(Math.max(Math.abs(to.x-from.x),Math.abs(to.y-from.y))/2));let last=from;
 for(let i=1;i<=steps;i++){const p={x:from.x+(to.x-from.x)*i/steps,y:from.y+(to.y-from.y)*i/steps};
  if(bodies.some(v=>{const area=overlap(p,v);return area>1e-9&&area>=overlap(from,v)-1e-9;})){let clear=last,hit=p;for(let n=0;n<12;n++){const mid={x:(clear.x+hit.x)/2,y:(clear.y+hit.y)/2};if(bodies.some(v=>{const area=overlap(mid,v);return area>1e-9&&area>=overlap(from,v)-1e-9;}))hit=mid;else clear=mid;}return clear;}
  last=p;
 }
 return null;
}
// Only these two real evacuation actors reserve bodies during ordinary engine
// integration. Ghost travel probes, other actors, stages and old saves are inert.
const escortEngines=new WeakSet(),attach=A.attach;A.attach=function(app,e){const result=attach(app,e);if(!pilot(e.b)||escortEngines.has(e))return result;escortEngines.add(e);
 const owns=u=>monkIds.includes(u.id)&&e.unit(u.id)===u&&!u.fixed&&A.memory(e.b).done.witness&&!A.memory(e.b).done['temple-escort'];
 const walk=e.walk; e.walk=function(u,...args){
  if(!owns(u))return walk.call(e,u,...args);const from={x:u.x,y:u.y},move=u.moveLeft,phase=u.walkPhase||0,facing=u.facing,moving=u.moving;
  const value=walk.call(e,u,...args),stop=sweepCivilian(e.b,u,from,u);if(!stop)return value;
  const travel=Math.hypot(u.x-from.x,u.y-from.y),actual=Math.hypot(stop.x-from.x,stop.y-from.y),fraction=travel?actual/travel:0;
  u.moveLeft=move-(move-u.moveLeft)*fraction;u.walkPhase=phase+((u.walkPhase||0)-phase)*fraction;u.x=stop.x;u.y=stop.y;if(actual<1e-6)u.moving=moving;
  return actual>1e-6||facing!==u.facing;
 };
 const integrate=e.integrateBody;
 e.integrateBody=function(u,dt,...args){
  const owned=owns(u),from=owned?{x:u.x,y:u.y}:null;
  const value=integrate.call(e,u,dt,...args);if(!owned||!living(u))return value;
  const stop=sweepCivilian(e.b,u,from,u);if(stop){const descending=u.y>from.y;u.x=stop.x;u.y=stop.y;u.vx=u.vy=0;if(descending){u.jumping=false;delete escortMemory(e.b).actors[u.id]?.escapeX;}}
  return value;
 };return result;
};
const observedEscort=new WeakMap();
function escortSnapshot(b){return monkIds.flatMap(id=>{const u=b.units.find(u=>u.id===id),q=b.honroState.templeEscort?.actors[id];return[u?.fixed,u?.x,u?.y,u?.vx,u?.vy,u?.moveLeft,u?.jumping,u?.facing,u?.angle,u?.walkPhase,u?.moving,q?.round,q?.blocked,q?.cloister,q?.escapeX];});}
function advanceMonks(app,dt){const e=app.engine,b=e.b,done=A.memory(b).done;
 if(!pilot(b)||!done.witness||done['temple-escort']||app.dialogue||app.modal?.classList.contains('open')||!['aim','enemy','ally','summon'].includes(b.phase)||dt<=0)return;
 const before=observedEscort.get(b)||escortSnapshot(b),mem=escortMemory(b);
 // Front first keeps the following monk from overtaking through a body.
 for(const [index,id]of monkIds.entries()){
  const u=e.unit(id);if(!living(u))continue;const q=mem.actors[id]??={};
  u.fixed=false;
  if(q.round!==b.round){q.round=b.round;u.moveLeft=u.maxMove;}
  const end=destination(b,u,index);
  if(Math.abs(u.x-end.x)<10&&Math.abs(u.y-end.y)<14&&!u.jumping){q.blocked=false;continue;}
  // Leave the shelter on its authored right-hand exit, then climb the main route.
  const surfaces=['tm-shelter-veranda','tm-processional-upper','tm-great-hall-plinth','tm-cloister-stair','tm-cloister-landing'];
  const surface=e.surface(u.x,u.y-5,u.y+5),sid=surface?.t.honroSpaceSurfaceId||surface?.t.id;
  let goal=end;
  if(['tm-cloister-stair','tm-cloister-landing'].includes(sid))q.cloister=true;
  if(sid?.startsWith('tm-hall-'))delete q.cloister;
  if(q.cloister)goal={x:4825,y:3830};
  if(sid?.startsWith('tm-hall-')&&sid!=='tm-great-hall-plinth'&&u.y<end.y-40)q.escapeX=surface.t.x+surface.t.w+u.r+12;
  if(u.y>=end.y-20)delete q.escapeX;
  if(u.x<3505&&!q.cloister){const t=b.terrain.find(t=>t.id==='tm-shelter-veranda');goal={x:3510,y:C.topAt(b.terrain.find(t=>t.id==='tm-processional-upper'),3510)};if(u.x<3435)goal={x:3440,y:C.topAt(t,3440)};}
  if(q.escapeX!==undefined)goal={x:q.escapeX,y:end.y};
  const dir=Math.sign(goal.x-u.x),dtWalk=Math.min(dt,.05),nx=u.x+dir*Math.min(u.walkSpeed*dtWalk,Math.abs(goal.x-u.x));
  const support=e.surface(nx,u.y-28,u.y+28),next={x:nx,y:support?.y??u.y};
  q.blocked=blocked(b,u,next);
  if(q.blocked){
   // Spend only the legal part of this step up to physical contact. This lets
   // a body leave another's head into a narrow free landing before jumping.
   if(u.moveLeft>0)e.walk(u,dir,Math.min(dtWalk,Math.abs(goal.x-u.x)/u.walkSpeed));
   // Re-plan a legal nearby passage above a body using the ordinary jump. A
   // ceiling/another body still blocks horizontal travel; no snap or ghosting.
   if(e.grounded(u)&&u.moveLeft>e.jumpCost(u)&&!sweepCivilian(b,u,u,{x:u.x,y:u.y-12}))e.jump(u);
   continue;
  }
  if(u.moveLeft>0){const before=u.x;e.walk(u,dir,Math.min(dtWalk,Math.abs(goal.x-u.x)/u.walkSpeed));if(Math.abs(u.x-before)<.01&&e.grounded(u)&&surfaces.includes(sid))e.jump(u);}
 }
 // Observe the two physical actors as well as our narrow route state. This also
 // catches the engine's falling/landing between calls, without dirtying idle waits.
 const after=escortSnapshot(b);if(after.some((v,i)=>!Object.is(v,before[i])))app.dirty=true;observedEscort.set(b,after);
}
const eligible=A.eligibility;A.eligibility=function(app,m){const b=app.engine.b;if(pilot(b)&&m.id==='hall'&&!A.memory(b).done['temple-escort'])return{ok:false,reason:'두 승려가 아직 툇마루에 도착하지 않았습니다.'};return eligible(app,m);};
const state=A.state;A.state=function(b){const out=state(b);if(!pilot(b)||A.current(b)?.id!=='temple-escort')return out;const hall=mark(b,'hall');out.targets=[{...hall,id:'temple-escort',kind:'exit',label:'두 승려를 법당 툇마루로 안내'},...monkIds.map(id=>b.units.find(u=>u.id===id)).filter(living).map(u=>({id:u.id,kind:'exit',x:u.x,y:u.y-u.h,label:u.name,unitId:u.id}))];return out;};
const pilotTick=A.tick;A.tick=function(app,dt){advanceMonks(app,dt);return pilotTick(app,dt);};
G.HonroStage16Temple={active,memory,entryFor,pilot,author,arrived,evidenceSatisfied,advanceMonks,blocked};
})(globalThis);
