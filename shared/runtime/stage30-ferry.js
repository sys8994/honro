(function(G){'use strict';
// A battle snapshot opts in; Continue never replaces an old map or roster.
const A=G.HonroAct3,W=G.HonroAllies,E=G.HonroEncounters,C=G.HONRO_CORE;
const active=b=>b?.honroStage===30&&!b.honroCustom&&b.honroFerryRevision===1;
// Version2 reserves the existing upper-bank guard for the actual high route.
// Contact with one of its authored connected supports is required: a low-quay
// jump, summon or floating body merely passing above y5150 is not that choice.
const upperBankSupports=new Set(['sf-granite-cape','sf-cape-east-descent','sf-cape-bank-link','sf-bank-inner','sf-high-response-ledge','sf-east-outer-grade','sf-old-road-west-rise','sf-old-road-west-bridge','sf-old-road-gather','sf-old-road-return-flight','sf-old-road-upper-flight']);
function pressureEnemies(e,candidates){const b=e.b;if(!active(b)||b.honroFerrySpec?.pressureVersion!==2)return candidates;
 const rear=e.alive(1).filter(u=>u.honroFerryCell==='bank-rearguard');if(!rear.length)return candidates;
 const engaged=rear.some(u=>u.aggroUntil>0&&u.aggroUntil>=b.round)||b.units.some(u=>hero(u)&&u.y<5150&&!u.airborne&&!u.jumping&&upperBankSupports.has(e.contactSurface(u.x,u.y-4,u.y+5)?.t.id)&&rear.some(v=>Math.hypot(u.x-v.x,u.y-v.y)<1800));
 // Only remove unavailable E members. The shared awake/aggro eligibility,
 // fairness sort, three-actor cap, target choice and attack checks remain final.
 return engaged?candidates:candidates.filter(u=>u.honroFerryCell!=='bank-rearguard');
}
const sources=['act3-response-30-0','act3-response-30-1','act3-ferry-hold','act3-response-30-2'];
const alive=u=>!!u&&!u.dead&&u.hp>0,hero=u=>alive(u)&&u.side===0&&!u.summoned&&!u.enthrall;
function memory(b){b.honroState??={flags:{},collected:[]};return b.honroState.ferry??={version:1,status:'moored',elapsed:0,duration:.8,commitCount:0,warnings:{},entries:{},offered:{},blockers:[]};}
const serial=b=>b.honroState.actorTurnSerial||0;
const boundary=app=>[serial(app.engine.b),app.engine.b.round,...app.engine.b.teamEnds,app.actorBoundary].join(':');
const ended=app=>app.done||['won','lost'].includes(app.engine.b.phase);
const paused=app=>!!app.dialogue||!!app.modal?.classList.contains('open')||!!app.charging||!!G.HonroStory?.turnPaused?.(app);
function safeMotion(app){const e=app.engine,b=e.b;return !ended(app)&&!paused(app)&&!['flight','review','summon','ally'].includes(b.phase)&&!(b.projectiles||[]).length&&!b.volley&&!b.summonTurn&&!b.units.some(u=>alive(u)&&(u.meleeAction||u.meleeFollow==='ready'))&&!e.settleBusy();}
const safeBoundary=app=>!!app.actorBoundary&&safeMotion(app);
const overlaps=(a,z)=>a.x+a.w>z.x&&a.x<z.x+z.w&&a.y+a.h>z.y&&a.y<z.y+z.h;
function polygons(b){const spec=b.honroFerrySpec||{},out=[];
 for(const z of spec.sweepPolygons||[]){const ps=(z.points||z).map(p=>Array.isArray(p)?{x:p[0],y:p[1]}:{x:p.x,y:p.y}),xs=ps.map(p=>p.x),ys=ps.map(p=>p.y);if(ps.length>=3)out.push({x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys),vertices:ps,broken:false,oneWay:false});}
 if(!out.length)for(const z of spec.sweep||[])out.push({...z,vertices:[{x:z.x,y:z.y},{x:z.x+z.w,y:z.y},{x:z.x+z.w,y:z.y+z.h},{x:z.x,y:z.y+z.h}],broken:false,oneWay:false});
 // Include both the final solid and disappearing support. An actor's feet
 // count as occupancy, so deleting a support can never start an unseen fall.
 for(const id of [...(spec.enableTerrainIds||[]),...(spec.disableTerrainIds||[])]){const t=b.terrain.find(t=>t.id===id);if(t)out.push({...t,broken:false,oneWay:false});}
 return out;
}
function swept(b,box){return polygons(b).some(t=>overlaps(box,t)&&C.terrainRectIntersects(t,box.x,box.y,box.w,box.h,.01));}
function circleTouches(t,x,y,r){const ps=C.poly(t);let inside=false;
 for(let i=0,j=ps.length-1;i<ps.length;j=i++){
  const a=ps[j],p=ps[i];if((a.y>y)!==(p.y>y)&&x<(p.x-a.x)*(y-a.y)/(p.y-a.y)+a.x)inside=!inside;
  const dx=p.x-a.x,dy=p.y-a.y,den=dx*dx+dy*dy,v=den?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/den)):0;if(Math.hypot(x-a.x-v*dx,y-a.y-v*dy)<=r)return true;
 }return inside;
}
function occupants(b){const out=[],shapes=polygons(b),rect=box=>shapes.some(t=>overlaps(box,t)&&C.terrainRectIntersects(t,box.x,box.y,box.w,box.h,.01));
 for(const u of b.units)if(alive(u)&&rect({x:u.x-u.r-6,y:u.y-u.h-6,w:u.r*2+12,h:u.h+12}))out.push({kind:u.summoned?'summon':u.side===0?'hero':u.honroProtected?'resident':'enemy',id:u.id,label:u.name||'동행',x:u.x,y:u.y});
 for(const s of b.stakes||[])if(s.active!==false&&(!Number.isFinite(s.expires)||s.expires>=b.round)&&rect({x:s.x-24,y:s.y-74,w:48,h:80}))out.push({kind:'stake',id:s.id,label:'진목',x:s.x,y:s.y});
 for(const p of b.projectiles||[])if(shapes.some(t=>circleTouches(t,p.x,p.y,p.radius||6)))out.push({kind:'projectile',id:p.id,label:'날아가는 탄',x:p.x,y:p.y});
 for(const [kind,list]of [['field',b.fields],['zone',b.zones]])for(const f of list||[]){if(f.active===false||Number.isFinite(f.expires)&&f.expires<b.round)continue;const u=f.attached&&b.units.find(u=>u.id===f.attached),x=u?.x??f.x,y=u?u.y-u.h*.5:f.y;if(shapes.some(t=>circleTouches(t,x,y,f.radius||1)))out.push({kind,id:f.id,label:kind==='field'?'기운의 장':'남아 있는 기예',x,y});}
 return out;
}
function releaseCamera(app,m){if(m.camera&&app.scene?.storyRelease)app.scene.storyRelease(m.camera,250);delete m.camera;}
function cleanup(app){if(!active(app.engine?.b)||!ended(app))return false;const b=app.engine.b,m=memory(b);if(m.ended)return true;m.ended=true;if(m.status==='settling')b.sceneVersion=(b.sceneVersion||0)+1;if(m.status!=='settled')m.status='cancelled';m.reason='';m.blockers=[];b.honroState.pendingEvents=(b.honroState.pendingEvents||[]).filter(id=>!sources.includes(id));releaseCamera(app,m);app.dirty=true;return true;}
function authored(b){const s=b.honroFerrySpec;if(!s||!s.enableTerrainIds?.length||!s.disableTerrainIds?.length)return false;const ids=[...s.enableTerrainIds,...s.disableTerrainIds];return new Set(ids).size===ids.length&&[b.terrain,b.honroWorldTerrain].every(list=>Array.isArray(list)&&ids.every(id=>list.filter(t=>t.id===id).length===1));}
function commit(app){const b=app.engine.b,m=memory(b);if(m.commitCount||m.status!=='settling'||!authored(b)||!safeMotion(app)||occupants(b).length)return false;
 // This synchronous write is the sole collision change. Rendering and saves
 // can observe only the complete moored or complete settled geography.
 const spec=b.honroFerrySpec;for(const list of [b.terrain,b.honroWorldTerrain])for(const t of list){if(spec.enableTerrainIds.includes(t.id))t.broken=false;else if(spec.disableTerrainIds.includes(t.id))t.broken=true;}
 Object.assign(m,{status:'settled',elapsed:m.duration,commitCount:1,committedRound:b.round,committedSerial:serial(b),finalShapeVersion:1,blockers:[],reason:'배가 여울에 멎었다. 낮은 퇴로로도 돌아갈 수 있다.'});b.sceneVersion=(b.sceneVersion||0)+1;releaseCamera(app,m);app.event(m.reason);app.dirty=true;app.engine.emit?.('save');return true;
}
function offer(app){const e=app.engine,b=e.b,m=memory(b);if(!['warned','waiting'].includes(m.status)||paused(app)||ended(app)||b.phase!=='aim'||b.side!==0)return;const u=e.active;if(hero(u)&&!u.acted&&!u.airborne)m.offered[u.id]={round:b.round,serial:serial(b)};}
function transition(app){const b=app.engine?.b;if(!active(b)||cleanup(app))return;const m=memory(b);if(['settled','settling'].includes(m.status))return;
 const hold=A.memory(b).holds['ferry-hold'];if(!A.memory(b).done['transport-map']||!(hold?.progress>=1))return;
 if(m.status==='moored'){
  if(paused(app))return;
  Object.assign(m,{status:'warned',warningEnemyEnd:b.teamEnds?.[1]||0,warningActorSerial:serial(b),warningRound:b.round,offered:{},playerOpportunity:null,reason:'줄이 느슨해졌다. 다음 행동에서 배와 바깥 둔덕을 비워 주세요.'});
  app.event('배를 매단 줄이 느슨해진다. 배와 바깥 둔덕을 비우세요. 원래 고지 길은 그대로 남습니다.');app.dirty=true;offer(app);return;
 }
 const action=app.engine.honroFerryAction,u=action&&app.engine.unit(action.id);
 if(action?.eligible&&app.actorBoundary===action.id&&u?.acted&&hero(u)&&serial(b)>m.warningActorSerial)m.playerOpportunity={id:u.id,round:b.round,serial:serial(b)};
 offer(app);m.blockers=occupants(b);
 const reason=!m.playerOpportunity?'동행이 다음 행동을 마치면 배의 주변을 확인합니다.':m.blockers.length?'배가 기다립니다. 쓸림면의 '+[...new Set(m.blockers.map(v=>v.label))].slice(0,2).join('·')+'부터 확인하세요.':hold.progress<2?'여울을 지키는 동안 배가 멎을 자리를 살핍니다.':!authored(b)?'배가 멎을 자리를 확인 중입니다. 원래 고지 길을 이용할 수 있습니다.':'주변이 비었습니다. 다음 안전한 행동 끝에 배가 내려앉습니다.';
 if(m.reason!==reason){m.reason=reason;app.dirty=true;}m.status=m.playerOpportunity?'waiting':'warned';
 if(!m.playerOpportunity||hold.progress<2||m.blockers.length||!authored(b)||!safeBoundary(app))return;
 m.status='settling';b.sceneVersion=(b.sceneVersion||0)+1;m.elapsed=0;m.duration=.8;m.reason='배가 여울에 천천히 내려앉습니다.';app.dirty=true;
 if(app.scene?.storyFocusPoint){m.camera={x:app.scene.x,y:app.scene.y,scale:app.scene.scale,manual:app.scene.manual};const t=b.terrain.find(t=>t.id===b.honroFerrySpec.enableTerrainIds[0]);app.scene.storyFocusPoint(t.x+t.w/2,t.y,150,.32);}
 app.event(m.reason);app.engine.emit?.('save');
}
function skip(app){const b=app.engine?.b;if(!active(b))return false;const m=memory(b);if(m.status!=='settling'||!safeMotion(app)||occupants(b).length)return false;m.elapsed=m.duration;return commit(app);}
const entryFor=(b,source)=>b.honroFerrySpec?.entries?.[source];
function warnWave(app,source){const b=app.engine.b,m=memory(b),at=entryFor(b,source);if(m.warnings[source]||m.entries[source]||!at||ended(app))return;
 m.warnings[source]={serial:serial(b),round:b.round,side:at.side};
 // Authored responses already publish their saved warning via Encounters.
 if(source==='act3-ferry-hold')app.event(at.warning||'여울 쪽에서 산개 세 마리의 발소리가 들린다. 다음 행동 뒤 진입로를 살피세요.');app.dirty=true;
}
function prepareWaves(app){const b=app.engine.b;if(ended(app)||paused(app))return;const a=A.memory(b),group=A.heroes(b),state={progress:Math.max(0,...group.map(u=>u.x)),height:Math.min(b.height,...group.map(u=>u.y)),broken:b.terrain.filter(t=>t.broken).length,collected:b.honroMarkers.filter(m=>m.collected).length,objectives:a.done,heroes:group,enemies:app.engine.alive(1).length,round:b.round,flags:b.honroState.flags,terrain:b.terrain,hold:b.honroState.hold,rescued:b.honroState.rescued};
 for(const ev of b.honroEvents||[])if(sources.includes(ev.id)&&!b.honroState.flags['event:'+ev.id]&&E.matches(ev.when,state))warnWave(app,ev.id);
 const step=A.current(b),h=a.holds['ferry-hold'],marker=A.marker(b,'ferry-hold');if(step?.id==='ferry-hold'&&(h?.spawned||0)<(step.wave?.count||0)&&group.some(u=>A.sameFloor(u,marker,step.radius)))warnWave(app,'act3-ferry-hold');
}
const execute=W.execute;
W.execute=function(app,action){const b=app.engine?.b,source=action?.source;if(!active(b)||action?.type!=='spawn'||!sources.includes(source))return execute(app,action);
 const m=memory(b);if(ended(app)||m.ended)return false;if(m.entries[source])return true;const warning=m.warnings[source],entry=entryFor(b,source);if(!entry||!warning||serial(b)<=warning.serial||m.status==='settling'||!safeBoundary(app))return false;
 const key=boundary(app),n=action.n||1;if(b.honroState.lastCombatEventBoundary===key||app.engine.alive(1).length+n>E.populationCap(b))return false;
 const choices=[entry,...(entry.alternates||[]).filter(p=>!p.side||!entry.side||p.side===entry.side).map(p=>({...p,side:entry.side}))];
 for(const at of choices){const spacing=at.spacing??action.spacing??145,support=at.support||at.surfaceId;if(!support||!Number.isFinite(at.x)||!Number.isFinite(at.y))continue;
  // MaxDistance zero means the common placement code must reserve every exact
  // authored slot. It cannot silently search another ledge or opposite bank.
  if(!Array.from({length:n},(_,i)=>at.x+(i-(n-1)/2)*spacing).every(x=>G.HonroMapEngine.surfaceY(b.terrain,x,at.y,support)))continue;
  const before=new Set(b.units.map(u=>u.id)),result=execute(app,{...action,x:at.x,y:at.y,support,spacing,maxDistance:0});if(result===false)continue;
  for(const u of b.units)if(!before.has(u.id))u.honroFerryEntry=at.side||source;
  m.entries[source]={x:at.x,y:at.y,support,side:at.side,round:b.round,serial:serial(b),count:n};b.honroState.lastCombatEventBoundary=key;app.dirty=true;return result;
 }return false;
};
const cap=E.populationCap;E.populationCap=function(b){return active(b)&&[30,36].includes(b.honroFerryPopulationCap)?b.honroFerryPopulationCap:cap(b);};
const attach=A.attach;A.attach=function(app,e){const out=attach(app,e);if(!active(e.b)||e.honroFerryAttached)return out;e.honroFerryAttached=true;memory(e.b);
 const combat=e.combatEnemies.bind(e);e.combatEnemies=function(){return pressureEnemies(e,combat());};
 const can=e.canAct.bind(e);e.canAct=function(){if(memory(e.b).status==='settling')return false;const ok=can();if(ok)offer(app);return ok;};
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){const u=e.active,m=memory(e.b),previous=e.honroFerryAction;e.honroFerryAction=hero(u)&&!u.acted?{id:u.id,eligible:!!m.offered[u.id]}:null;try{return finish(...args);}finally{e.honroFerryAction=previous;}};
 const tick=e.tick.bind(e);e.tick=function(dt){if(cleanup(app))return tick(dt);const m=memory(e.b);if(m.status!=='settling')return tick(dt);
  if(paused(app))return;if(!safeMotion(app)||occupants(e.b).length){m.status='waiting';e.b.sceneVersion=(e.b.sceneVersion||0)+1;m.elapsed=0;m.reason='주변이 다시 움직입니다. 다음 안전한 행동 끝까지 기다립니다.';releaseCamera(app,m);app.dirty=true;return;}
  m.elapsed=Math.min(m.duration,(m.elapsed||0)+Math.max(0,dt));app.dirty=true;if(m.elapsed>=m.duration)commit(app);
 };return out;
};
const tick=A.tick;A.tick=function(app,dt){if(!active(app.engine?.b))return tick(app,dt);if(cleanup(app))return tick(app,dt);prepareWaves(app);offer(app);const out=tick(app,dt);transition(app);return out;};
const state=A.state;A.state=function(b){const out=state(b);if(!active(b))return out;const m=b.honroState?.ferry;if(m?.reason&&!['moored','cancelled'].includes(m.status))out.summary+=' · '+m.reason;return out;};
G.HonroStage30Ferry={active,memory,sources,entryFor,safeBoundary,safeMotion,swept,occupants,transition,prepareWaves,commit,skip,cleanup};
})(globalThis);
