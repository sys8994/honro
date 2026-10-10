(function(G){'use strict';
// A fresh authored battle explicitly opts in. No Continue upgrades, global
// activation/range/cap changes, new victory conditions or growth changes.
const C=G.HONRO_CORE,E=G.HonroEncounters,W=G.HonroAllies,stages=new Set([8,11,12,16,17,18,23,30]);
const active=b=>!!b&&!b.honroCustom&&stages.has(b.honroStage)&&b.honroEncounterDensityRevision===1;
const alive=u=>u&&!u.dead&&u.hp>0,hero=u=>alive(u)&&u.side===0&&!u.summoned&&!u.enthrall;
const memory=b=>(b.honroState.encounterDensity??={version:1,alert:{},warnings:{},entries:{}});
const serial=b=>b.honroState.actorTurnSerial||0;
const ended=app=>app.done||['won','lost'].includes(app.engine.b.phase);
const paused=app=>!!app.dialogue||!!app.charging||!!app.modal?.classList.contains('open')||!!app.storyHistoryOpen||!!G.document?.hidden||!!G.HonroStory?.turnPaused?.(app);
const safe=app=>!ended(app)&&!paused(app)&&!!app.actorBoundary&&!['flight','review','summon','ally'].includes(app.engine.b.phase)&&!app.engine.b.projectiles.length&&!app.engine.b.volley&&!app.engine.b.summonTurn&&!app.engine.b.units.some(u=>alive(u)&&(u.meleeAction||u.meleeFollow==='ready'))&&!app.engine.settleBusy();
function installActivation(e){const b=e.b,defs=b.honroEncounterDensityActivation;if(!defs||e.honroDensityActivationAttached)return;e.honroDensityActivationAttached=true;
 const refresh=e.refreshActivation.bind(e),combat=e.combatEnemies.bind(e);
 const update=write=>{const eligible=new Set(),mem=memory(b),heroes=e.heroesAlive();for(const [cell,spec]of Object.entries(defs)){
  const units=e.alive(1).filter(u=>u.honroDensityCell===cell);if(!units.length)continue;
  const hit=units.some(u=>u.aggroUntil>0&&u.aggroUntil>=b.round),approached=heroes.some(h=>{const support=e.contactSurface(h.x,h.y-8,h.y+10)?.t.id,access=(spec.supports||[]).includes(support)||(spec.extra||[]).some(a=>a.support===support&&h.x>=(a.minX??-Infinity)&&h.x<=(a.maxX??Infinity));return access&&units.some(u=>Math.abs(h.y-u.y)<(spec.maxHeight??650)&&Math.hypot(h.x-u.x,h.y-u.y)<spec.radius);});
  if(hit||approached)eligible.add(cell);if(write){if(hit||approached)mem.alert[cell]=true;for(const u of units)u.awake=!!mem.alert[cell];}
 }e.honroDensityEligible=eligible;};
 e.refreshActivation=function(){refresh();update(true);};e.combatEnemies=function(){update(false);return combat().filter(u=>!u.honroDensityCell||!defs[u.honroDensityCell]||e.honroDensityEligible.has(u.honroDensityCell));};
 // Mounting a save reconstructs only the cache; its current queue/awake flags
 // remain exactly the saved state. Ordinary movement/turns refresh next.
 update(false);
}
function tune(b,u,st,m){u.elite=false;u.armor=.04;G.HonroProgression.tuneEnemy(st,u,m.kind);
 if(b.honroStage===8)G.HonroStage8Bier.tuneOrdinary(b,u,st,m.kind,!!m.elite);
 else if(b.honroStage<=20){u.honroAct2Revision=2;u.honroAct2Elite=!!m.elite;G.HonroAct2.tuneEncounter(u,b.honroStage);}
 else{u.honroAct3Encounter=1;u.honroAct3Elite=!!m.elite;G.HonroAct3Encounters.tune(b,u,st);}
 G.HonroProgression.enemyXP(b,u);
}
// All members reserve exact authored supported body positions together. The
// caller has already enforced that chapter's warning/opportunity/scene gate.
function spawnMembers(app,action,at){const e=app.engine,b=e.b;if(!active(b)||!Array.isArray(at.members)||at.members.length!==(action.n||at.members.length))return false;
 const next=b.nextId,list=[],shadow={...b,units:[...b.units],nextId:next};
 for(const [i,m]of at.members.entries()){
  const kind=m.kind,flying=!!G.HonroWorld.archetypes[kind]?.flying,x=m.x,y=m.y,support=m.support||m.surfaceId;
  if(!Number.isFinite(x)||!Number.isFinite(y)||!G.HonroWorld.archetypes[kind])return false;
  const contact=m.air&&flying?{y}:G.HonroMapEngine.surfaceY(b.terrain,x,y,support);if(!contact||!m.air&&(!support||Math.abs(contact.y-y)>.1))return false;
  const u=G.HonroWorld.createEnemy(shadow,app.stage,x,kind,next+i,y,true);tune(b,u,app.stage,m);
  Object.assign(u,{id:'event-'+(next+i),awake:true,aggroUntil:b.round+3,honroSpawnSource:action.source,honroDensityBornRound:b.round,honroEncounterRole:m.role||m.honroDensityRole||'response',honroEncounterSupport:support,honroDensityCell:m.activationCell||null,honroCohort:m.cohort||m.honroCohort||'reinforcement',spawnX:x,spawnY:y,group:80+(b.honroEvents||[]).findIndex(ev=>ev.id===action.source)});
  shadow.units=[...b.units,...list];const point=G.HonroTerrain.place(shadow,u,{flying,maxDistance:0,clearance:18});
  if(!point||point.x!==x||Math.abs(point.y-y)>.1)return false;
  // Existing exact-body test includes low ceilings, actors, fields, projectiles
  // and stakes. It does not move occupants or silently select another surface.
  if(G.HonroStage8Bier.terrainBlockers(e,u).length||G.HonroStage8Bier.hazards(shadow,u,{x:x-u.r-18,y:y-u.h-3,w:u.r*2+36,h:u.h+6}).length)return false;
  list.push(u);
 }
 b.nextId=next+list.length;b.units.push(...list);b.honroCounters.spawned+=list.length;return true;
}
const own=ev=>ev?.honroDensityResponse===1;
function ready(b,ev){const t=ev.honroDensityTrigger||{},done=b.honroState.act2?.done||b.honroState.act3?.done||{};return(!t.objectiveDone||done[t.objectiveDone])&&(!t.region||b.units.some(u=>hero(u)&&G.HonroAuthored.inside(u,t.region)));}
function offer(app){if(ended(app)||paused(app))return;const e=app.engine,b=e.b,u=e.active;if(b.phase!=='aim'||b.side!==0||!hero(u)||u.acted)return;for(const w of Object.values(memory(b).warnings))if(!w.opportunity&&!w.cancelled)(w.offered??={})[u.id]={round:b.round,serial:serial(b)};}
function prepare(app){const e=app.engine,b=e.b,mem=memory(b),hs=b.honroState;if(ended(app)){for(const ev of b.honroEvents||[])if(own(ev)&&!hs.flags['event:'+ev.id]){hs.flags['event:'+ev.id]='cancelled:battle-ended';if(mem.warnings[ev.id])mem.warnings[ev.id].cancelled=true;hs.pendingEvents=(hs.pendingEvents||[]).filter(id=>id!==ev.id);}return;}
 const action=e.honroDensityAction,u=action&&e.unit(action.id);if(action&&app.actorBoundary===action.id&&hero(u)&&u.acted)for(const id of action.waves){const w=mem.warnings[id];if(w&&serial(b)>w.serial)w.opportunity={id:u.id,round:b.round,serial:serial(b)};}
 if(paused(app))return;hs.pendingEvents??=[];for(const ev of b.honroEvents||[]){if(!own(ev)||hs.flags['event:'+ev.id]||!ready(b,ev))continue;if(!mem.warnings[ev.id]){mem.warnings[ev.id]={serial:serial(b),round:b.round,offered:{}};app.event(ev.warning);app.dirty=true;}if(!hs.pendingEvents.includes(ev.id))hs.pendingEvents.push(ev.id);}
 offer(app);E.flush(app);
}
const cap=E.populationCap;E.populationCap=function(b){const n=b?.honroEncounterDensityPopulationCap;return active(b)&&Number.isInteger(n)&&n>0&&n<=120?n:cap(b);};
const execute=W.execute;W.execute=function(app,action){const b=app.engine?.b;if(!active(b)||action?.honroDensityResponse!==1)return execute(app,action);prepareOpportunity(app);const mem=memory(b),ev=b.honroEvents.find(ev=>ev.id===action.source),w=mem.warnings[action.source];if(!ev||!w?.opportunity||w.cancelled||!safe(app))return false;if(mem.entries[action.source])return true;
 const actions=action.actions||[action],choices=[actions,...(ev.honroDensityAlternatives||[])];for(const [index,rows]of choices.entries()){
  const members=rows.flatMap(q=>Array.from({length:q.n||1},(_,i)=>({...q,x:q.x+(i-((q.n||1)-1)/2)*(q.spacing||115),elite:q.honroDensityElite??q.elite,role:q.honroDensityRole??q.role,air:q.air===true})));
  if(eCount(app)+members.length>E.populationCap(b))return false;const before=b.units.length;if(!spawnMembers(app,{...action,n:members.length},{members}))continue;mem.entries[action.source]={round:b.round,serial:serial(b),choice:index,ids:b.units.slice(before).map(u=>u.id)};return true;
 }w.status='blocked';return false;
};
const eCount=app=>app.engine.alive(1).length;
function prepareOpportunity(app){const e=app.engine,b=e.b,a=e.honroDensityAction,u=a&&e.unit(a.id);if(a&&app.actorBoundary===a.id&&hero(u)&&u.acted)for(const id of a.waves){const w=memory(b).warnings[id];if(w&&serial(b)>w.serial)w.opportunity={id:u.id,round:b.round,serial:serial(b)};}}
const attach=E.attach;E.attach=function(app,e){const out=attach(app,e);if(!active(e.b)||e.honroDensityAttached)return out;e.honroDensityAttached=true;memory(e.b);installActivation(e);
 const can=e.canAct.bind(e);e.canAct=function(){const ok=can();if(ok)offer(app);return ok;};
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){const u=e.active,old=e.honroDensityAction;e.honroDensityAction=hero(u)&&!u.acted?{id:u.id,waves:Object.entries(memory(e.b).warnings).filter(([,w])=>w.offered?.[u.id]&&!w.cancelled).map(([id])=>id)}:null;try{return finish(...args);}finally{e.honroDensityAction=old;}};return out;
};
const tick=G.HonroMission.tick;G.HonroMission.tick=function(app,dt){if(!active(app.engine?.b))return tick(app,dt);prepare(app);const out=tick(app,dt);prepare(app);return out;};
G.HonroEncounterDensity={active,memory,safe,spawnMembers,installActivation,prepare,offer,ready};
})(globalThis);
