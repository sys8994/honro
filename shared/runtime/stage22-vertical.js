(function(G){'use strict';
// Opt-in fresh archive composition. Never upgrades a legacy or greybox save.
// All objective/hold/exit rules remain in the existing Act3 implementation.
const A=G.HonroAct3,E=G.HonroEncounters,W=G.HonroAllies;
const active=b=>b?.honroStage===22&&!b.honroCustom&&b.honroVerticalStage22Revision===1&&b.honroVerticalStage22EncounterRevision===1;
const alive=u=>!!u&&!u.dead&&u.hp>0,hero=u=>alive(u)&&u.side===0&&!u.summoned&&!u.enthrall;
const sources=['act3-response-22-0','act3-response-22-1','act3-response-22-2','act3-compare-ledgers'];
const memory=b=>(b.honroState.vertical22??={version:1,alert:{},warnings:{},entries:{}});
const serial=b=>b.honroState.actorTurnSerial||0;
const ended=app=>app.done||['won','lost'].includes(app.engine.b.phase);
const paused=app=>!!app.dialogue||!!app.charging||!!app.modal?.classList.contains('open')||!!app.storyHistoryOpen||!!G.document?.hidden||!!G.HonroStory?.turnPaused?.(app);
const safe=app=>!ended(app)&&!paused(app)&&!!app.actorBoundary&&!['flight','review','summon','ally'].includes(app.engine.b.phase)&&!(app.engine.b.projectiles||[]).length&&!app.engine.b.volley&&!app.engine.b.summonTurn&&!app.engine.b.units.some(u=>alive(u)&&(u.meleeAction||u.meleeFollow==='ready'))&&!app.engine.settleBusy();
const boundary=app=>[serial(app.engine.b),app.engine.b.round,...app.engine.b.teamEnds,app.actorBoundary].join(':');
const cap=E.populationCap;E.populationCap=function(b){return active(b)&&b.honroVerticalStage22PopulationCap===35?35:cap(b);};

function cellApproached(e,units,spec,heroes){return heroes.some(h=>{const support=e.contactSurface(h.x,h.y-8,h.y+10)?.t.id,access=(spec.supports||[]).includes(support)||(spec.extra||[]).some(a=>a.support===support&&h.x>=(a.minX??-Infinity)&&h.x<=(a.maxX??Infinity));return access&&units.some(u=>Math.abs(h.y-u.y)<(spec.maxHeight??650)&&Math.hypot(h.x-u.x,h.y-u.y)<spec.radius);});}
function installActivation(e){const b=e.b,defs=b.honroVerticalStage22Activation;if(!defs||e.honroVerticalStage22ActivationAttached)return;e.honroVerticalStage22ActivationAttached=true;const refresh=e.refreshActivation.bind(e),combat=e.combatEnemies.bind(e);
 const update=write=>{const m=memory(b),eligible=new Set(),heroes=e.heroesAlive();for(const [cell,spec]of Object.entries(defs)){const units=e.alive(1).filter(u=>u.honroVertical22Cell===cell);if(!units.length)continue;const hit=units.some(u=>u.aggroUntil>0&&u.aggroUntil>=b.round),approached=cellApproached(e,units,spec,heroes);if(hit||approached)eligible.add(cell);if(write){if(hit||approached)m.alert[cell]=true;for(const u of units)u.awake=!!m.alert[cell];}}e.honroVerticalStage22Eligible=eligible;};
 e.refreshActivation=function(){refresh();update(true);};e.combatEnemies=function(){update(false);return combat().filter(u=>!u.honroVertical22Cell||!defs[u.honroVertical22Cell]||e.honroVerticalStage22Eligible.has(u.honroVertical22Cell));};
 // Rebuild transient eligibility only; a Continue must keep its admitted queue.
 update(false);
}
// Reserve one of the existing three actions for a newly arrived local group.
// No fourth action, no last-wave kill gate, and no mutation while mounting.
function reserveQueue(e){const b=e.b;if(!active(b)||b.enemyLimit!==3)return b.queue;
 const waiting=u=>alive(u)&&Number.isInteger(u.honroVertical22BornRound)&&u.lastAct<u.honroVertical22BornRound;
 if(b.queue.some(id=>waiting(e.unit(id))))return b.queue;
 const heroes=e.heroesAlive(),distance=u=>Math.min(...heroes.map(h=>Math.hypot(h.x-u.x,h.y-u.y)));
 const next=e.combatEnemies().filter(u=>u.stunnedRound!==b.round&&waiting(u)).sort((a,z)=>a.honroVertical22BornRound-z.honroVertical22BornRound||distance(a)-distance(z)||String(a.id).localeCompare(String(z.id)))[0];
 if(!next)return b.queue;return[...b.queue.filter(id=>id!==next.id).slice(0,2),next.id];
}
function cancel(app,reason='battle-ended'){const b=app.engine.b,m=memory(b);let changed=false;for(const [source,w]of Object.entries(m.warnings))if(!m.entries[source]&&!w.cancelled){w.cancelled=reason;w.cancelledRound=b.round;w.cancelledSerial=serial(b);w.status='cancelled';changed=true;}if(changed)app.dirty=true;return changed;}
function offer(app){if(ended(app)||paused(app))return;const e=app.engine,b=e.b,u=e.active;if(b.phase!=='aim'||b.side!==0||!hero(u)||u.acted||u.airborne)return;const m=memory(b);for(const[source,w]of Object.entries(m.warnings))if(!m.entries[source]&&!w.opportunity&&!w.cancelled)(w.offered??={})[u.id]={round:b.round,serial:serial(b)};}
function acceptOpportunity(app){const e=app.engine,b=e.b,action=e.honroVerticalStage22Action,u=action&&e.unit(action.id);if(!action||app.actorBoundary!==action.id||!hero(u)||!u.acted)return;const m=memory(b);for(const source of action.waves){const w=m.warnings[source];if(w&&!w.cancelled&&!w.opportunity&&!m.entries[source]&&serial(b)>w.serial){w.opportunity={id:u.id,round:b.round,serial:serial(b)};w.status='ready';app.dirty=true;}}}
function prepare(app){const b=app.engine.b;if(!active(b))return;if(ended(app)){cancel(app);return;}acceptOpportunity(app);if(paused(app))return;const m=memory(b),hs=b.honroState,defs=b.honroVerticalStage22Spec?.entries||{},ready=[];
 for(const ev of b.honroEvents||[])if(ev.honroVertical22Response===1&&!hs.flags['event:'+ev.id]&&E.matches(ev.when,{objectives:hs.act3?.done,heroes:app.engine.heroesAlive(),enemies:app.engine.alive(1).length,round:b.round,flags:hs.flags,terrain:b.terrain}))ready.push(ev.id);
 const step=A.current(b),h=A.memory(b).holds['compare-ledgers'],marker=A.marker(b,'compare-ledgers');if(step?.id==='compare-ledgers'&&(h?.spawned||0)<2&&marker&&A.heroes(b).some(u=>A.sameFloor(u,marker,step.radius)))ready.push('act3-compare-ledgers');
 for(const source of ready){const at=defs[source];if(!at||m.entries[source]||m.warnings[source]?.cancelled)continue;if(!m.warnings[source]){m.warnings[source]={serial:serial(b),round:b.round,side:at.side,status:'warned',offered:{}};app.event(at.warning);app.dirty=true;}if(source!=='act3-compare-ledgers'){hs.pendingEvents??=[];if(!hs.pendingEvents.includes(source)){hs.pendingEvents.push(source);hs.eventActors??={};hs.eventActors[source]={id:app.actorBoundary||b.active,round:b.round};}}}
 offer(app);
}
// Pure preflight: inert bodies only, so even a rejected later member cannot
// consume the factory's private sequence, actor IDs, counters or growth budget.
function formation(app,action,at){const e=app.engine,b=e.b;if(!Array.isArray(at.members)||at.members.length!==action.n)return null;const probes=[],shadow={...b,units:[...b.units]};
 for(const[i,m]of at.members.entries()){const def=G.HonroWorld.archetypes[m.kind],flying=!!def?.flying,support=m.support||m.surfaceId;if(!def||m.kind!==action.kind||!Number.isFinite(m.x)||!Number.isFinite(m.y)||!support||m.air===true&&!flying)return null;
  const contact=m.air&&flying?{y:m.y}:G.HonroMapEngine.surfaceY(b.terrain,m.x,m.y,support);if(!contact||Math.abs(contact.y-m.y)>.1)return null;
  const u={id:'event-'+(b.nextId+i),x:m.x,y:m.y,h:def.h,r:def.r,hp:1,side:1,fixed:flying};const point=G.HonroTerrain.place(shadow,u,{flying,maxDistance:0,clearance:18});
  if(!point||point.x!==m.x||Math.abs(point.y-m.y)>.1||G.HonroStage8Bier.terrainBlockers(e,u).length||G.HonroStage8Bier.hazards(shadow,u,{x:u.x-u.r-18,y:u.y-u.h-3,w:u.r*2+36,h:u.h+6}).length)return null;probes.push(u);shadow.units=[...b.units,...probes];
 }return probes;
}
function spawnMembers(app,action,at){const e=app.engine,b=e.b;if(!formation(app,action,at))return false;const next=b.nextId,list=[];
 // Every exact pose has passed before the first factory call. Nothing below
 // searches a new surface, moves occupants, or can partially admit a group.
 for(const[i,m]of at.members.entries()){const u=G.HonroWorld.createEnemy(b,app.stage,m.x,m.kind,next+i,m.y,true);Object.assign(u,{honroAct3Encounter:1,honroAct3Elite:false});G.HonroAct3Encounters.tune(b,u,app.stage);G.HonroProgression.enemyXP(b,u);
  Object.assign(u,{id:'event-'+(next+i),awake:true,aggroUntil:b.round+3,honroSpawnSource:action.source,honroVertical22Entry:action.source,honroVertical22BornRound:b.round,honroVertical22Cell:m.activationCell,honroEncounterRole:m.role||'response',honroEncounterSupport:m.support,honroCohort:'reinforcement',spawnX:m.x,spawnY:m.y,group:80+sources.indexOf(action.source)});list.push(u);
 }b.nextId=next+list.length;b.units.push(...list);b.honroCounters.spawned+=list.length;return true;
}
const execute=W.execute;W.execute=function(app,action){const b=app.engine?.b,source=action?.source;if(!active(b)||action?.type!=='spawn'||!sources.includes(source))return execute(app,action);const m=memory(b);if(m.entries[source])return true;acceptOpportunity(app);const at=b.honroVerticalStage22Spec?.entries?.[source],w=m.warnings[source];if(!at||!w?.opportunity||w.cancelled||!safe(app))return false;
 const hold=source==='act3-compare-ledgers',ev=(b.honroEvents||[]).find(ev=>ev.id===source),step=A.current(b);if(hold?(step?.id!=='compare-ledgers'||action.kind!==step.wave?.kind||action.n!==2||(A.memory(b).holds['compare-ledgers']?.spawned||0)!==0):(!ev||!b.honroState.act3?.done[ev.when.objectiveDone]||action.kind!==ev.action.kind||action.n!==ev.action.n))return false;
 const token=boundary(app);if(b.honroState.lastCombatEventBoundary===token||app.engine.alive(1).length+action.n>E.populationCap(b))return false;
 const choices=[at,...(at.alternates||[]).filter(p=>p.side===at.side)];for(const[choice,p]of choices.entries()){const before=b.units.length;if(!spawnMembers(app,action,p))continue;m.entries[source]={side:at.side,choice,ids:b.units.slice(before).map(u=>u.id),count:action.n,round:b.round,serial:serial(b),opportunity:{...w.opportunity}};w.status='entered';b.honroState.lastCombatEventBoundary=token;app.dirty=true;return true;}
 w.status='blocked';app.dirty=true;return false;
};
const update=E.update;E.update=function(app,...args){if(active(app.engine?.b))prepare(app);return update(app,...args);};
const attach=A.attach;A.attach=function(app,e){const out=attach(app,e);if(!active(e.b)||e.honroVerticalStage22Attached)return out;e.honroVerticalStage22Attached=true;memory(e.b);installActivation(e);
 const can=e.canAct.bind(e);e.canAct=function(){const ok=can();if(ok)offer(app);return ok;};const finish=e.finishAction.bind(e);e.finishAction=function(...args){const u=e.active,m=memory(e.b),old=e.honroVerticalStage22Action;e.honroVerticalStage22Action=hero(u)&&!u.acted?{id:u.id,waves:Object.entries(m.warnings).filter(([source,w])=>!m.entries[source]&&!w.cancelled&&w.offered?.[u.id]).map(([source])=>source)}:null;try{return finish(...args);}finally{e.honroVerticalStage22Action=old;}};
 const switchTeam=e.switchTeam.bind(e);e.switchTeam=function(...args){const from=e.b.side,out=switchTeam(...args);if(from===0&&e.b.side===1&&e.b.phase==='enemy'){const queue=reserveQueue(e);if(queue!==e.b.queue){e.b.queue=queue;for(const u of e.alive(1))u.acted=!queue.includes(u.id);e.b.active=queue[0];e.emit('change');}}return out;};
 const engineTick=e.tick.bind(e);e.tick=function(...args){const result=engineTick(...args);if(ended(app))cancel(app);return result;};return out;
};
const tick=A.tick;A.tick=function(app,dt){if(!active(app.engine?.b))return tick(app,dt);prepare(app);const out=tick(app,dt);if(ended(app))cancel(app);else prepare(app);return out;};
G.HonroStage22Vertical={active,memory,sources,safe,paused,ended,cellApproached,installActivation,reserveQueue,prepare,offer,acceptOpportunity,cancel,formation,spawnMembers};
})(globalThis);
