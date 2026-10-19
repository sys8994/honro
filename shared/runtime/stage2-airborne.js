(function(G){'use strict';
// The opposite roost watches the procession. Only this authored encounter gets
// a convoy alert; shared proximity, targeting, flight, weapons and cap stay intact.
const E=G.HonroEncounters,A=G.HonroAllies,C=G.HONRO_CORE;
const ids=new Set(['foe-1','foe-4','foe-1-cluster','foe-4-cluster']);
const active=b=>b?.honroStage===2&&b.honroCanonical&&(b.honroMapOrigin==='campaign'||b.honroStage2AirborneRevision===1)&&!b.honroCustom&&b.honroLayoutRevision===1&&b.honroEscortGoalX===(b.honroMap?.stage2ImageFirst?.sopVersion?b.honroMapAnchors.exit.x:3340);
const roost=u=>!!u&&ids.has(u.id)&&u.side===1&&u.honroCluster==='shelf-roost'&&u.honroType===(u.id.startsWith('foe-1')?'crow':'bat')&&u.fixed;
const alive=u=>u&&!u.dead&&u.hp>0;
const stopped=app=>app.done||['won','lost'].includes(app.engine.b.phase);
const serial=b=>b.honroState.actorTurnSerial||0;
const responses=b=>{const m=b.honroState.stage2Airborne;return m?[m,...Object.values(m.waves||{})]:[];};
function author(project){const s=project.stages?.find(s=>s.metadata?.stageId===2);if(s?.initialState?.honroEscortGoalX===3340&&s.units?.some(u=>u.id==='foe-1'&&u.x===3370&&u.y===1010))s.initialState.honroStage2AirborneRevision=1;return project;}
function repair(e,u){
 // Exact historical clone placement: retain legitimate moved/knocked saves.
 if(!active(e.b)||!roost(u)||u.id!=='foe-1-cluster'||!alive(u)||u.x!==3460||u.y!==1010||u.spawnX!==3460||u.spawnY!==1010||C.flightClear(e,u,u))return false;
 const p=G.HonroTerrain.place(e.b,u,{flying:true,maxDistance:128,clearance:18,accept:(x,y)=>C.flightClear(e,u,{x,y})});
 if(!p)return false;
 Object.assign(u,p,{vx:0,vy:0});delete u.aiMove;delete u.moveTarget;return true;
}
const balance=E.balance;E.balance=function(b){const out=balance(b);if(active(b)){for(const u of b.units)repair({b},u);b.honroStage2AirborneRevision=1;}return out;};
function warning(app,text){const e=app.engine,b=e.b;app.event(text);app.dirty=true;return{warning:{round:b.round,serial:serial(b),inProgress:b.phase!=='aim'||!!b.projectiles.length||!!app.charging||!!e.active?.retreat},released:false};}
function prepare(app){const e=app.engine,b=e.b;if(!active(b)||stopped(app)||app.dialogue||!e.alive(1).some(roost)||b.honroState.stage2Airborne?.warning)return;
 const engaged=b.units.some(u=>u.side===1&&!roost(u)&&(u.dead||u.hp<u.maxHp))||(e.unit('objective')?.x||0)>=(b.honroMap?.stage2ImageFirst?.airborneAlertX??1520);
 if(engaged)Object.assign(b.honroState.stage2Airborne??={},warning(app,'오른쪽 절벽의 날짐승들이 상여 쪽으로 몸을 돌린다.'));
}
// Readiness checks stay pure. Only a real player fire/wait/defend input can
// record an offered response. Merely rendering an aim HUD cannot grant one.
function opportunity(app){const e=app.engine,b=e.b,u=e.active;if(stopped(app)||app.dialogue||app.charging||app.modal?.classList.contains('open')||G.HonroStory?.turnPaused?.(app)||!e.canAct()||!alive(u)||u.side!==0||u.retreat||b.projectiles.length)return null;
 const items=responses(b).filter(m=>m.warning&&!m.released&&!m.cancelled&&(!m.warning.inProgress||serial(b)>m.warning.serial));
 return items.length?{items,offered:{id:u.id,round:b.round,serial:serial(b)}}:null;
}
function offer(q){if(q)for(const m of q.items)m.offered={...q.offered};}
function release(app){const b=app.engine.b,u=app.engine.active;if(stopped(app)||app.dialogue||!alive(u)||u.side!==0||u.acted)return;
 for(const m of responses(b))if(!m.cancelled&&!m.released&&m.offered?.id===u.id&&m.offered.round===b.round&&m.offered.serial===serial(b)){m.released=true;m.response={...m.offered};}
}
function safeEntry(app){const e=app.engine,b=e.b;return !stopped(app)&&!!app.actorBoundary&&!app.dialogue&&!app.charging&&!app.modal?.classList.contains('open')&&!G.document?.hidden&&!G.HonroStory?.turnPaused?.(app)&&!['flight','ally','summon'].includes(b.phase)&&!b.projectiles.length&&!b.volley&&!b.summonTurn&&!e.settleBusy();}
function waveEvent(b,a){if(!['road-pressure','sniper-seen'].includes(a?.source))return null;const ev=b.honroEvents.find(ev=>ev.id===a.source);return ev&&ev.action?.type===a.type&&ev.action.n===a.n&&ev.action.kind===a.kind&&ev.action.x===a.x?ev:null;}
const execute=A.execute;A.execute=function(app,a){const b=app.engine?.b,ev=active(b)&&waveEvent(b,a);if(!ev)return execute(app,a);if(stopped(app))return false;if(b.honroState.flags['event:'+ev.id])return true;
 const m=b.honroState.stage2Airborne??={},waves=m.waves??={};let w=waves[ev.id];
 if(!w){waves[ev.id]=warning(app,ev.text);return false;}
 if(w.entry)return true;if(w.cancelled||!w.released||!safeEntry(app)||app.engine.alive(1).length+(a.n||1)>E.populationCap(b))return false;
 const start=b.units.length,result=execute(app,a.type==='sniperAmbush'?{...a,requireFlightClearance:true}:a);if(result===false){w.blocked=true;return false;}
 w.entry={round:b.round,serial:serial(b),boundary:[serial(b),b.round,...b.teamEnds,app.actorBoundary].join(':'),ids:b.units.slice(start).map(u=>u.id)};delete w.blocked;app.dirty=true;return result;
};
const update=E.update;E.update=function(app,...args){if(active(app.engine?.b))prepare(app);return update(app,...args);};
const attach=A.attach;A.attach=function(app,e){const out=attach(app,e),b=e.b;if(!active(b)||e.honroStage2AirborneAttached)return out;e.honroStage2AirborneAttached=true;
 // Continue mounting is read-only: no saved pose, alert, turn or queue rewrite.
 const fire=e.fire.bind(e);e.fire=function(...args){const q=!args[3]?opportunity(app):null,result=fire(...args);if(result)offer(q);return result;};
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){if(b.phase==='aim')offer(opportunity(app));release(app);return finish(...args);};
 const refresh=e.refreshActivation.bind(e);e.refreshActivation=function(){refresh();if(!stopped(app)&&b.honroState.stage2Airborne?.released)for(const u of e.alive(1).filter(roost))u.awake=true;};
 const combat=e.combatEnemies.bind(e);e.combatEnemies=function(){const list=combat();if(stopped(app)||!b.honroState.stage2Airborne?.released)return list;return [...new Set([...list,...e.alive(1).filter(roost)])];};
 const enemy=e.enemyAction.bind(e);e.enemyAction=function(){if(!stopped(app)&&roost(e.active)&&!e.active.acted)repair(e,e.active);return enemy();};
 const tick=e.tick.bind(e);e.tick=function(...args){const out=tick(...args);if(stopped(app))for(const m of responses(b))if(m.warning&&!m.entry&&!m.released)m.cancelled=b.phase;return out;};return out;
};
G.HonroStage2Airborne={author,active,roost,repair,prepare,opportunity,safeEntry,waveEvent};
})(globalThis);
