(function(G){'use strict';
// A battle snapshot opts in; Continue never replaces an old map or roster.
const A=G.HonroAct3,W=G.HonroAllies,E=G.HonroEncounters,C=G.HONRO_CORE;
const active=b=>b?.honroStage===23&&!b.honroCustom&&b.honroEscortYardRevision===1;
// Repeat mounting must retain the crit values earned by an actual level-up.
// The shared legacy initializer recalculates these two fields without ordinary
// stat training even when it reuses a saved growth ledger. Preserve only finite
// saved fields in opted-in battles; fresh initialization and missing old fields
// still take the unchanged legacy path. No XP or stat calculation is replaced.
const initializeGrowth=G.HonroProgression.initialize;
G.HonroProgression.initialize=function(b,profile){
 const saved=active(b)&&b.honroGrowth?.ledger?b.units.filter(u=>u.side===0&&!u.summoned||u.honroAlly).map(u=>({u,fields:Object.fromEntries(['critChance','critMultiplier'].filter(k=>Number.isFinite(u[k])).map(k=>[k,u[k]]))})):[];
 const out=initializeGrowth(b,profile);for(const {u,fields}of saved)Object.assign(u,fields);return out;
};
const sources=['act3-response-23-0','act3-response-23-1','act3-response-23-2'];
const SCENE='stage23-cargo-slide-v1';
const cargo=b=>b.honroEscortYardSpec?.cargo||{};
const alive=u=>!!u&&!u.dead&&u.hp>0,hero=u=>alive(u)&&u.side===0&&!u.summoned&&!u.enthrall;
function memory(b){b.honroState??={flags:{},collected:[]};return b.honroState.escortYard??={version:1,status:'stored',elapsed:0,duration:1.2,commitCount:0,warnings:{},entries:{},offered:{},blockers:[]};}
const serial=b=>b.honroState.actorTurnSerial||0;
const boundary=app=>[serial(app.engine.b),app.engine.b.round,...app.engine.b.teamEnds,app.actorBoundary].join(':');
const ended=app=>app.done||['won','lost'].includes(app.engine.b.phase);
const ownedScene=app=>app.dialogue?.staging?.id===SCENE;
const paused=app=>!!app.dialogue||!!app.modal?.classList.contains('open')||!!app.charging||!!G.HonroStory?.turnPaused?.(app);
const cargoPaused=app=>!!app.modal?.classList.contains('open')||!!app.charging||!!app.storyHistoryOpen||!!G.document?.hidden||!!app.dialogue&&!ownedScene(app);
function safeMotion(app,{scene=false}={}){const e=app.engine,b=e.b;return !ended(app)&&!(scene?cargoPaused(app):paused(app))&&!['flight','review','summon','ally'].includes(b.phase)&&!(b.projectiles||[]).length&&!b.volley&&!b.summonTurn&&!b.units.some(u=>alive(u)&&(u.meleeAction||u.meleeFollow==='ready'))&&!e.settleBusy();}
const safeBoundary=app=>!!app.actorBoundary&&safeMotion(app);
const overlaps=(a,z)=>a.x+a.w>z.x&&a.x<z.x+z.w&&a.y+a.h>z.y&&a.y<z.y+z.h;
function polygons(b){const spec=cargo(b),out=[];
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
function cleanup(app){if(!active(app.engine?.b)||!ended(app))return false;const b=app.engine.b,m=memory(b);if(m.ended)return true;m.ended=true;if(m.status==='sliding')b.sceneVersion=(b.sceneVersion||0)+1;if(m.status!=='settled')m.status='cancelled';m.reason='';m.blockers=[];b.honroState.pendingEvents=(b.honroState.pendingEvents||[]).filter(id=>!sources.includes(id));b.honroState.storyQueue=(b.honroState.storyQueue||[]).filter(line=>line[2]?.stagingRequest?.id!==SCENE);if(ownedScene(app))G.HonroStory?.finish(app);releaseCamera(app,m);app.dirty=true;return true;}
function authored(b){const s=cargo(b);if(!s||!s.enableTerrainIds?.length||!s.disableTerrainIds?.length)return false;const ids=[...s.enableTerrainIds,...s.disableTerrainIds];return new Set(ids).size===ids.length&&[b.terrain,b.honroWorldTerrain].every(list=>Array.isArray(list)&&ids.every(id=>list.filter(t=>t.id===id).length===1));}
function commit(app){const b=app.engine.b,m=memory(b);if(m.commitCount||m.status!=='sliding'||!authored(b)||!safeMotion(app,{scene:true})||occupants(b).length)return false;
 // This synchronous write is the sole collision change. Rendering and saves
 // can observe only the complete stored or complete settled geography.
 const spec=cargo(b);for(const list of [b.terrain,b.honroWorldTerrain])for(const t of list){if(spec.enableTerrainIds.includes(t.id))t.broken=false;else if(spec.disableTerrainIds.includes(t.id))t.broken=true;}
 Object.assign(m,{status:'settled',elapsed:m.duration,commitCount:1,committedRound:b.round,committedSerial:serial(b),finalShapeVersion:1,blockers:[],reason:'큰 화물묶음이 낮은 턱에 멎었다. 위 창고의 사선과 아래 엄폐가 바뀌었다.'});b.sceneVersion=(b.sceneVersion||0)+1;releaseCamera(app,m);app.event(m.reason);app.dirty=true;app.engine.emit?.('save');return true;
}
// Offers are recorded only before an actual living player's new action. An
// enemy boundary, a summon, a late review completion, or a serial increment is
// never a substitute for the promised chance to reposition.
function offer(app){const e=app.engine,b=e.b,m=memory(b);if(paused(app)||ended(app)||b.phase!=='aim'||b.side!==0)return;const u=e.active;if(!hero(u)||u.acted||u.airborne)return;
 if(['warned','waiting'].includes(m.status))m.offered[u.id]={round:b.round,serial:serial(b)};
 for(const [source,w]of Object.entries(m.warnings))if(!m.entries[source]&&!w.opportunity)(w.offered??={})[u.id]={round:b.round,serial:serial(b)};
}
function acceptOpportunity(app){const e=app.engine,b=e.b,m=memory(b),action=e.honroEscortYardAction,u=action&&e.unit(action.id);if(!action||app.actorBoundary!==action.id||!u?.acted||!hero(u))return;
 if(action.cargo&&serial(b)>m.warningActorSerial)m.playerOpportunity={id:u.id,round:b.round,serial:serial(b)};
 for(const source of action.waves||[]){const w=m.warnings[source];if(w&&serial(b)>w.serial)w.opportunity={id:u.id,round:b.round,serial:serial(b)};}
}
function carrierInTrigger(b){const npc=b.units.find(u=>u.id==='act3-carrier'),r=cargo(b).triggerRegion;return alive(npc)&&!!r&&npc.x>=r.minX&&npc.x<=r.maxX&&Math.abs(npc.y-r.y)<=(r.tolerance??40);}
function transition(app){const b=app.engine?.b;if(!active(b)||cleanup(app))return;const m=memory(b);acceptOpportunity(app);if(['settled','sliding'].includes(m.status))return;
 if(m.status==='stored'){
  if(paused(app)||!A.memory(b).done['carrier-start']||!carrierInTrigger(b))return;
  Object.assign(m,{status:'warned',warningActorSerial:serial(b),warningRound:b.round,offered:{},playerOpportunity:null,reason:'위 창고의 화물묶음이 기운다. 다음 행동에서 빈 하역경사와 받침턱을 살피세요.'});app.event(m.reason);app.dirty=true;offer(app);return;
 }
 offer(app);m.blockers=occupants(b);const reason=!m.playerOpportunity?'동행이 다음 행동을 마친 뒤 하역경사를 확인합니다.':m.blockers.length?'화물이 기다립니다. 경사에 있는 '+[...new Set(m.blockers.map(v=>v.label))].slice(0,2).join('·')+'부터 확인하세요.':!authored(b)?'하역경사의 받침을 확인 중입니다. 짐꾼의 길은 그대로 이어집니다.':'빈 하역경사로 화물이 미끄러질 준비가 되었습니다.';
 if(m.reason!==reason){m.reason=reason;app.dirty=true;}m.status=m.playerOpportunity?'waiting':'warned';
 if(!m.playerOpportunity||m.blockers.length||!authored(b)||!safeBoundary(app)||!installScene())return;
 // Story owns the only presentation clock, Skip path and serialized cursor.
 // No actor is carried, moved, damaged or given a new movement allowance.
 m.status='sliding';m.elapsed=0;m.duration=1.2;m.reason='사람 없는 하역경사로 큰 화물묶음이 미끄러집니다.';b.sceneVersion=(b.sceneVersion||0)+1;
 if(!G.HonroStoryStaging.request(app,SCENE)){m.status='waiting';b.sceneVersion++;return;}app.dirty=true;app.engine.emit?.('save');
}
function cancelSlide(app){const b=app.engine.b,m=memory(b);if(m.status!=='sliding')return;m.status='waiting';m.elapsed=0;m.reason='경사가 다시 움직입니다. 안전한 다음 행동 끝까지 기다립니다.';b.sceneVersion=(b.sceneVersion||0)+1;app.dirty=true;if(ownedScene(app)){G.HonroStory.finish(app);delete b.honroStaging.once[SCENE];G.HonroStory.save(app);}}
function syncScene(app){const b=app.engine?.b;if(!active(b)||!ownedScene(app))return;const m=memory(b),s=app.dialogue.staging;if(m.status!=='sliding')return;
 if(!safeMotion(app,{scene:true})||occupants(b).length){if(!cargoPaused(app))cancelSlide(app);return;}
 m.elapsed=s.complete?m.duration:Math.min(m.duration,(s.elapsed||0)/1000);if(s.complete)commit(app);
}
function skip(app){if(!active(app.engine?.b)||!ownedScene(app)||memory(app.engine.b).status!=='sliding'||!safeMotion(app,{scene:true})||occupants(app.engine.b).length)return false;return G.HonroStoryStaging.skipMotion(app);}
let sceneInstalled=false;
function installScene(){const S=G.HonroStoryStaging;if(!S||!G.HonroStory)return false;if(sceneInstalled)return true;sceneInstalled=true;
 S.register({id:SCENE,stage:23,title:'하역경사의 큰 짐',steps:[{type:'look',at:{x:4230,y:4290},duration:1200,caption:'큰 화물묶음이 빈 하역경사를 한 번 미끄러져 낮은 받침에 멎는다.'},{type:'dialogue',lines:[['서술','화물묶음이 낮은 턱에 멎었다. 위 창고의 사선이 트이고, 아래길 옆에는 낮은 엄폐가 생겼다.']]}]});
 const tick=S.tick,skipMotion=S.skipMotion,finish=S.finish;
 S.tick=function(app,now){if(active(app.engine?.b)&&ownedScene(app)&&memory(app.engine.b).status==='sliding'&&!cargoPaused(app)&&(!safeMotion(app,{scene:true})||occupants(app.engine.b).length)){cancelSlide(app);return;}const out=tick(app,now);syncScene(app);return out;};
 S.skipMotion=function(app){if(!active(app.engine?.b)||!ownedScene(app))return skipMotion(app);if(memory(app.engine.b).status==='sliding'&&(!safeMotion(app,{scene:true})||occupants(app.engine.b).length))return false;const out=skipMotion(app);syncScene(app);return out;};
 S.finish=function(app,natural=false){if(!active(app.engine?.b)||!ownedScene(app))return finish(app,natural);if(memory(app.engine.b).status==='sliding'&&(!safeMotion(app,{scene:true})||occupants(app.engine.b).length))return true;const out=finish(app,natural);syncScene(app);return out;};return true;
}
const entryFor=(b,source)=>b.honroEscortYardSpec?.entries?.[source];
function warnWave(app,source){const b=app.engine.b,m=memory(b),at=entryFor(b,source);if(m.warnings[source]||m.entries[source]||!at||ended(app))return;m.warnings[source]={serial:serial(b),round:b.round,side:at.side,offered:{}};app.dirty=true;offer(app);}
function prepareWaves(app){const b=app.engine.b;if(ended(app)||paused(app))return;const a=A.memory(b),group=A.heroes(b),state={progress:Math.max(0,...group.map(u=>u.x)),height:Math.min(b.height,...group.map(u=>u.y)),broken:b.terrain.filter(t=>t.broken).length,collected:b.honroMarkers.filter(m=>m.collected).length,objectives:a.done,heroes:group,enemies:app.engine.alive(1).length,round:b.round,flags:b.honroState.flags,terrain:b.terrain,hold:b.honroState.hold,rescued:b.honroState.rescued};
 for(const ev of b.honroEvents||[])if(sources.includes(ev.id)&&!b.honroState.flags['event:'+ev.id]&&E.matches(ev.when,state))warnWave(app,ev.id);
}
const execute=W.execute;
W.execute=function(app,action){const b=app.engine?.b,source=action?.source;if(!active(b)||action?.type!=='spawn'||!sources.includes(source))return execute(app,action);
 const m=memory(b);acceptOpportunity(app);if(ended(app)||m.ended)return false;if(m.entries[source])return true;const warning=m.warnings[source],entry=entryFor(b,source);if(!entry||!warning||!warning.opportunity||serial(b)<=warning.serial||m.status==='sliding'||!safeBoundary(app))return false;
 const key=boundary(app),n=action.n||1;if(b.honroState.lastCombatEventBoundary===key||app.engine.alive(1).length+n>E.populationCap(b))return false;
 const choices=[entry,...(entry.alternates||[]).filter(p=>!p.side||!entry.side||p.side===entry.side).map(p=>({...p,side:entry.side}))];
 for(const at of choices){const spacing=at.spacing??action.spacing??145,support=at.support||at.surfaceId;if(!support||!Number.isFinite(at.x)||!Number.isFinite(at.y))continue;
  // MaxDistance zero means the common placement code must reserve every exact
  // authored slot. It cannot silently search another ledge or opposite bank.
  if(!Array.from({length:n},(_,i)=>at.x+(i-(n-1)/2)*spacing).every(x=>G.HonroMapEngine.surfaceY(b.terrain,x,at.y,support)))continue;
  const before=new Set(b.units.map(u=>u.id)),result=execute(app,{...action,x:at.x,y:at.y,support,spacing,maxDistance:0});if(result===false)continue;
  for(const u of b.units)if(!before.has(u.id)){u.honroEscortYardEntry=at.side||source;u.honroEscortYardCell=entry.cell||source;u.honroEscortYardActivationCell=entry.activationCell||null;}
  m.entries[source]={x:at.x,y:at.y,support,side:at.side,round:b.round,serial:serial(b),count:n};b.honroState.lastCombatEventBoundary=key;app.dirty=true;return result;
 }return false;
};
const cap=E.populationCap;E.populationCap=function(b){const n=b?.honroEscortYardPopulationCap;return active(b)&&Number.isInteger(n)&&n>=30&&n<=36?n:cap(b);};
function cellApproached(e,units,spec,heroes){return heroes.some(h=>{
 if(h.airborne||h.jumping)return false;const support=e.contactSurface(h.x,h.y-4,h.y+5)?.t.id;
 const access=(spec.supports||[]).includes(support)||(spec.extra||[]).some(a=>a.support===support&&h.x>=(a.minX??-Infinity)&&h.x<=(a.maxX??Infinity));
 return access&&units.some(u=>Math.abs(h.y-u.y)<(spec.maxHeight??650)&&Math.hypot(h.x-u.x,h.y-u.y)<spec.radius);
});}
function installActivation(e){const b=e.b;if(!b.honroEscortYardActivation||e.honroEscortYardActivationAttached)return;e.honroEscortYardActivationAttached=true;const refresh=e.refreshActivation.bind(e),combat=e.combatEnemies.bind(e);
 const update=write=>{const m=memory(b),alert=m.alert||{};if(write)m.alert=alert;const heroes=e.heroesAlive().filter(hero),eligible=new Set();
  for(const [cell,spec]of Object.entries(b.honroEscortYardActivation)){const units=e.alive(1).filter(u=>u.honroEscortYardActivationCell===cell);if(!units.length)continue;const hit=units.some(u=>u.aggroUntil>0&&u.aggroUntil>=b.round),approached=cellApproached(e,units,spec,heroes);if(write){if(hit||approached)alert[cell]=true;for(const u of units)u.awake=!!alert[cell];}if(hit||approached)eligible.add(cell);}e.honroEscortYardEligibleCells=eligible;
 };
 e.refreshActivation=function(){refresh();update(true);};e.combatEnemies=function(){update(false);return combat().filter(u=>!u.honroEscortYardActivationCell||!b.honroEscortYardActivation[u.honroEscortYardActivationCell]||e.honroEscortYardEligibleCells?.has(u.honroEscortYardActivationCell));};
 if(Object.hasOwn(memory(b),'alert'))update(false);else e.refreshActivation();
}
const attach=A.attach;A.attach=function(app,e){const out=attach(app,e);if(!active(e.b)||e.honroEscortYardAttached)return out;e.honroEscortYardAttached=true;memory(e.b);installScene();installActivation(e);
 const can=e.canAct.bind(e);e.canAct=function(){if(memory(e.b).status==='sliding')return false;const ok=can();if(ok)offer(app);return ok;};
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){const u=e.active,m=memory(e.b),previous=e.honroEscortYardAction;e.honroEscortYardAction=hero(u)&&!u.acted?{id:u.id,cargo:!!m.offered[u.id],waves:Object.entries(m.warnings).filter(([,w])=>w.offered?.[u.id]).map(([source])=>source)}:null;try{return finish(...args);}finally{e.honroEscortYardAction=previous;}};return out;
};
const tick=A.tick;A.tick=function(app,dt){if(!active(app.engine?.b))return tick(app,dt);if(cleanup(app))return tick(app,dt);installScene();prepareWaves(app);offer(app);acceptOpportunity(app);const out=tick(app,dt);transition(app);return out;};
const state=A.state;A.state=function(b){const out=state(b);if(!active(b))return out;const m=b.honroState?.escortYard;if(m?.reason&&!['stored','cancelled'].includes(m.status))out.summary+=' · '+m.reason;return out;};
G.HonroStage23Escort={active,memory,sources,entryFor,safeBoundary,safeMotion,swept,occupants,transition,prepareWaves,commit,skip,cleanup,installScene,syncScene,carrierInTrigger,cellApproached,installActivation,SCENE};
})(globalThis);
