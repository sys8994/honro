(function(G){'use strict';
// This is a fresh-map contract, never an upgrade of an in-progress village.
// Geography, objectives, protection, physics and the four-action cap belong
// to the saved battle and the existing Act 2 implementation.
const A=G.HonroAct2,E=G.HonroEncounters,W=G.HonroAllies;
const active=b=>b?.honroStage===14&&!b.honroCustom&&b.honroVerticalStage14Revision===1;
const alive=u=>!!u&&!u.dead&&u.hp>0,hero=u=>alive(u)&&u.side===0&&!u.summoned&&!u.enthrall;
const sources=['hold-refuge-0','hold-refuge-3','hold-refuge-6','hold-refuge-9'];
const memory=b=>(b.honroState.vertical14??={version:1,alert:{},warnings:{},entries:{}});
const serial=b=>b.honroState.actorTurnSerial||0;
const ended=app=>app.done||['won','lost'].includes(app.engine.b.phase);
const paused=app=>!!app.dialogue||!!app.charging||!!app.modal?.classList.contains('open')||!!app.storyHistoryOpen||!!G.document?.hidden||!!G.HonroStory?.turnPaused?.(app);
const safe=app=>!ended(app)&&!paused(app)&&!!app.actorBoundary&&!['flight','review','summon','ally'].includes(app.engine.b.phase)&&!(app.engine.b.projectiles||[]).length&&!app.engine.b.volley&&!app.engine.b.summonTurn&&!app.engine.b.units.some(u=>alive(u)&&(u.meleeAction||u.meleeFollow==='ready'))&&!app.engine.settleBusy();

const factory=G.HonroWorld.createEnemy;
G.HonroWorld.createEnemy=function(b,st,...args){const u=factory(b,st,...args);if(!active(b))return u;
 // Remove the historical index%11 promotion BEFORE authored elite tuning.
 // Rebuilding the base avoids an invisible HP/armor/XP multiplier.
 u.elite=false;u.armor=.04;G.HonroProgression.tuneEnemy(st,u,args[1]);G.HonroProgression.enemyXP(b,u);u.honroVerticalStage14Base=true;return u;
};
const initialize=G.HonroProgression.initialize;
G.HonroProgression.initialize=function(b,profile){if(!active(b))return initialize(b,profile);
 // Continue is already budgeted, including partial XP awards. Even a second
 // mount must not retune enemies, reset xpGranted or rebuild that ledger.
 if(b.honroGrowth)return;
 for(const u of b.units)if(u.side===1)A.tuneEncounter(u,14);
 const out=initialize(b,profile);if(b.honroGrowth){const reserve=12+4*.6;b.honroGrowth.weight+=reserve;b.honroGrowth.vertical14WaveWeight=reserve;b.honroGrowth.vertical14Revision=1;for(const u of b.units)if(u.side===1)G.HonroProgression.enemyXP(b,u);}return out;
};
const cap=E.populationCap;
E.populationCap=function(b){return active(b)&&b.honroVerticalStage14PopulationCap===55?55:cap(b);};
const contentFor=G.HonroObjectiveRevision.contentFor;
G.HonroObjectiveRevision.contentFor=function(b,st){return active(b)&&b.honroVerticalStage14Content?JSON.parse(JSON.stringify(b.honroVerticalStage14Content)):contentFor(b,st);};
const entry=A.entry;
A.entry=function(app,options={}){return active(app.engine?.b)&&app.engine.b.honroVerticalStage14Content?entry({...app,stage:G.HonroObjectiveRevision.contentFor(app.engine.b,app.stage)},options):entry(app,options);};

// One current action in the HUD; counts and delayed-entry detail stay in the
// already-existing objective panel. Reading guidance never creates state.
const enhance=G.HonroObjectiveGuide.enhance;
G.HonroObjectiveGuide.enhance=function(b,st,result){let out=enhance(b,st,result);if(!active(b))return out;
 // Read the same saved cohorts and live actors as Act2.satisfied/state, not
 // the generic clear-step completion condition ('남은 대상 0명').
 const clears=new Map(A.steps(b).filter(s=>s.kind==='clear').map(s=>[s.id,s]));
 const counted=q=>{const s=clears.get(q.id);return s?{...q,text:s.label+' · 남은 대상 '+A.enemiesFor(b,s).length+'명'}:q;};
 out={...out,visibleChecklist:(out.visibleChecklist||[]).map(counted),checklist:(out.checklist||[]).map(counted)};
 const current=A.current(b)?.id;
 if(current==='clear-village'){
  // Protection is still live after the timed hold. This changes only the
  // current instruction, never NPC vulnerability or the original clear goal.
  const instruction='피난민을 지키며 남은 들림을 제압하세요';
  return{...out,currentInstruction:instruction,summary:instruction,visibleChecklist:(out.visibleChecklist||[]).map(q=>q.id===current?{...q,text:instruction+' · 남은 대상 '+A.enemiesFor(b,clears.get(current)).length+'명'}:q),checklist:(out.checklist||[]).map(q=>q.id===current?{...q,text:instruction+' · 남은 대상 '+A.enemiesFor(b,clears.get(current)).length+'명'}:q)};
 }
 if(current!=='hold-refuge')return out;
 const h=b.honroState?.act2?.holds?.['hold-refuge']||{},m=b.honroState?.vertical14||{},progress=Math.min(6,h.progress||0),spawned=h.spawned||0;
 const blocked=Object.entries(m.warnings||{}).find(([id,w])=>!m.entries?.[id]&&!w.cancelled&&w.status==='blocked'),side={west:'서쪽',east:'동쪽',inner:'다리 안쪽'}[blocked?.[1]?.side]||'도구';
 const instruction=h.guarded===false?'표시된 원으로 돌아오세요':h.contested?'다리 안의 들림을 제압하세요':blocked&&progress>=6?side+' 진입로를 비워 주세요':progress>=6&&spawned<12?'다가오는 들림을 막아 주세요':'피난민을 지키세요 · '+progress+'/6턴';
 const detail='피난민 보호 · '+progress+'/6턴 · 굴에서 나온 들림 '+spawned+'/12'+(blocked?' · '+side+' 진입 대기':'');
 return{...out,currentInstruction:instruction,summary:detail,visibleChecklist:(out.visibleChecklist||[]).map(q=>q.id==='hold-refuge'?{...q,text:detail}:q),checklist:(out.checklist||[]).map(q=>q.id==='hold-refuge'?{...q,text:detail}:q)};
};

function cellApproached(e,units,spec,heroes){return heroes.some(h=>{
 const support=e.contactSurface(h.x,h.y-8,h.y+10)?.t.id;
 const access=(spec.supports||[]).includes(support)||(spec.extra||[]).some(a=>a.support===support&&h.x>=(a.minX??-Infinity)&&h.x<=(a.maxX??Infinity));
 return access&&units.some(u=>Math.abs(h.y-u.y)<(spec.maxHeight??650)&&Math.hypot(h.x-u.x,h.y-u.y)<spec.radius);
});}
function installActivation(e){const b=e.b,defs=b.honroVerticalStage14Activation;if(!defs||e.honroVerticalStage14ActivationAttached)return;e.honroVerticalStage14ActivationAttached=true;
 const refresh=e.refreshActivation.bind(e),combat=e.combatEnemies.bind(e);
 const update=write=>{const m=memory(b),alert=m.alert||{},eligible=new Set(),heroes=e.heroesAlive();if(write)m.alert=alert;
  for(const [cell,spec]of Object.entries(defs)){
   const units=e.alive(1).filter(u=>u.honroVerticalCell===cell);if(!units.length)continue;
   const hit=units.some(u=>u.aggroUntil>0&&u.aggroUntil>=b.round),approached=cellApproached(e,units,spec,heroes);
   if(hit||approached)eligible.add(cell);
   if(write){if(hit||approached)alert[cell]=true;for(const u of units)u.awake=!!alert[cell];}
  }e.honroVerticalStage14Eligible=eligible;
 };
 e.refreshActivation=function(){refresh();update(true);};
 e.combatEnemies=function(){update(false);return combat().filter(u=>!u.honroVerticalCell||!defs[u.honroVerticalCell]||e.honroVerticalStage14Eligible.has(u.honroVerticalCell));};
 // Rebuild only a transient eligibility cache. The admitted enemy queue,
 // awake flags, HP and saved alerts are unchanged on Continue.
 update(false);
}

function cancel(app,reason='battle-ended'){const b=app.engine.b,m=memory(b);let changed=false;
 for(const [source,w]of Object.entries(m.warnings))if(!m.entries[source]&&!w.cancelled){w.cancelled=reason;w.cancelledRound=b.round;w.cancelledSerial=serial(b);w.status='cancelled';changed=true;}
 if(changed)app.dirty=true;return changed;
}
function offer(app){if(ended(app)||paused(app))return;const e=app.engine,b=e.b,u=e.active;if(b.phase!=='aim'||b.side!==0||!hero(u)||u.acted||u.airborne)return;
 const m=memory(b);for(const [source,w]of Object.entries(m.warnings))if(!m.entries[source]&&!w.opportunity&&!w.cancelled)(w.offered??={})[u.id]={round:b.round,serial:serial(b)};
}
function acceptOpportunity(app){const e=app.engine,b=e.b,action=e.honroVerticalStage14Action,u=action&&e.unit(action.id);if(!action||app.actorBoundary!==action.id||!hero(u)||!u.acted)return;
 const m=memory(b);for(const source of action.waves){const w=m.warnings[source];if(w&&!w.cancelled&&!w.opportunity&&!m.entries[source]&&serial(b)>w.serial){w.opportunity={id:u.id,round:b.round,serial:serial(b)};w.status='ready';app.dirty=true;}}
}
function prepareWaves(app){const b=app.engine.b;if(!active(b))return;if(ended(app)){cancel(app);return;}
 acceptOpportunity(app);if(paused(app))return;
 const step=A.current(b),h=A.memory(b).holds?.['hold-refuge'],spawned=h?.spawned||0,m=memory(b);
 if(step?.id==='hold-refuge'&&spawned<12){const point=b.honroMarkers.find(p=>p.id==='hold-refuge');
  if(point&&app.engine.heroesAlive().some(u=>Math.hypot(u.x-point.x,u.y-point.y)<step.radius)){
   const source='hold-refuge-'+spawned,at=b.honroVerticalStage14Spec?.entries?.[source];
   if(sources.includes(source)&&at&&!m.warnings[source]&&!m.entries[source]){m.warnings[source]={serial:serial(b),round:b.round,side:at.side,status:'warned',offered:{}};app.event(at.warning||'피난 다리 진입로에서 도구 부딪치는 소리가 들린다. 다음 행동 동안 대비하세요.');app.dirty=true;}
  }
 }
 offer(app);
}

// Probe complete formations without changing IDs, actors, growth or counters.
// The existing generic spawn then performs its own all-or-nothing reservation.
function formation(app,action,at){const e=app.engine,b=e.b,n=action.n||1,spacing=at.spacing??130,support=at.support||at.surfaceId;
 if(!support||!Number.isFinite(at.x)||!Number.isFinite(at.y)||!Number.isFinite(spacing)||spacing<=0)return false;
 const def=G.HonroWorld.archetypes[action.kind];if(!def||def.flying)return false;
 const probes=[],shadow={...b,units:[...b.units]};
 for(let i=0;i<n;i++){
  const x=at.x+(i-(n-1)/2)*spacing,contact=G.HonroMapEngine.surfaceY(b.terrain,x,at.y,support);if(!contact)return false;
  // An inert exact-size body avoids even the factory's private unit sequence
  // advancing during a rejected probe. Only generic execute creates actors.
  const u={id:'event-'+(b.nextId+i),x,y:contact.y,h:def.h,r:def.r,hp:1,side:1,fixed:false};
  // Existing hold-refuge is a supported, grounded picks formation, not an
  // aerial placement or a license to choose a different nearby floor.
  const point=G.HonroTerrain.place(shadow,u,{flying:false,maxDistance:0,clearance:18});
  if(!point||point.x!==x||Math.abs(point.y-contact.y)>.1||G.HonroStage8Bier.terrainBlockers(e,u).length||G.HonroStage8Bier.hazards(shadow,u,{x:x-u.r-18,y:u.y-u.h-3,w:u.r*2+36,h:u.h+6}).length)return false;
  probes.push(u);shadow.units=[...b.units,...probes];
 }return true;
}
const execute=W.execute;
W.execute=function(app,action){const b=app.engine?.b,source=action?.source;if(!active(b)||action?.type!=='spawn'||!sources.includes(source))return execute(app,action);
 const m=memory(b);if(m.entries[source])return true;acceptOpportunity(app);
 const at=b.honroVerticalStage14Spec?.entries?.[source],w=m.warnings[source],step=A.current(b),h=A.memory(b).holds?.['hold-refuge'];
 if(!at||!w?.opportunity||w.cancelled||!safe(app)||step?.id!=='hold-refuge'||source!=='hold-refuge-'+(h?.spawned||0)||(action.n||1)!==3||action.kind!==step.wave?.kind)return false;
 const boundary=[serial(b),b.round,...b.teamEnds,app.actorBoundary].join(':'),n=action.n;
 if(b.honroState.lastCombatEventBoundary===boundary||app.engine.alive(1).length+n>E.populationCap(b))return false;
 const choices=[at,...(at.alternates||[]).filter(p=>!p.side||p.side===at.side).map(p=>({...at,...p,side:at.side}))];
 for(const [choice,p]of choices.entries()){
  if(!formation(app,action,p))continue;
  const before=new Set(b.units.map(u=>u.id)),support=p.support||p.surfaceId;
  const result=execute(app,{...action,x:p.x,y:p.y,support,spacing:p.spacing??130,maxDistance:0});if(result===false)continue;
  const units=b.units.filter(u=>!before.has(u.id));
  for(const [i,u]of units.entries()){
   Object.assign(u,{honroVerticalCell:p.activationCell||p.cell||'hold-refuge-'+at.side,honroVerticalStage14Entry:source,honroVerticalStage14BornRound:b.round,honroEncounterSupport:support,honroCohort:'reinforcement',honroAct2Revision:2,honroAct2Elite:i===n-1});
   // act2.wave repeats this same last-member elite declaration after execute.
   // Its idempotent tuning will then preserve this already-final XP weight.
   A.tuneEncounter(u,14);G.HonroProgression.enemyXP(b,u);
  }
  m.entries[source]={side:at.side,x:p.x,y:p.y,support,count:n,choice,ids:units.map(u=>u.id),round:b.round,serial:serial(b),opportunity:{...w.opportunity}};
  w.status='entered';b.honroState.lastCombatEventBoundary=boundary;app.dirty=true;return result;
 }
 w.status='blocked';app.dirty=true;return false;
};

const attach=A.attach;
A.attach=function(app,e){const out=attach(app,e);if(!active(e.b)||e.honroVerticalStage14Attached)return out;e.honroVerticalStage14Attached=true;memory(e.b);installActivation(e);
 const can=e.canAct.bind(e);e.canAct=function(){const ok=can();if(ok)offer(app);return ok;};
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){const u=e.active,m=memory(e.b),old=e.honroVerticalStage14Action;
  e.honroVerticalStage14Action=hero(u)&&!u.acted?{id:u.id,waves:Object.entries(m.warnings).filter(([source,w])=>!m.entries[source]&&!w.cancelled&&w.offered?.[u.id]).map(([source])=>source)}:null;
  try{return finish(...args);}finally{e.honroVerticalStage14Action=old;}
 };
 // A terminal result may stop App mission ticks immediately. Record pending
 // cancellation in the action's own engine tick as well, without spawning.
 const engineTick=e.tick.bind(e);e.tick=function(...args){const result=engineTick(...args);if(ended(app))cancel(app);return result;};
 return out;
};
const tick=A.tick;
A.tick=function(app,dt){if(!active(app.engine?.b))return tick(app,dt);prepareWaves(app);
 // Act2's hold-start beat reads app.stage directly. Use the saved fresh-map
 // content for this synchronous tick, without cloning at frame frequency or
 // changing the App's canonical stage reference after success or failure.
 const stage=app.stage,content=app.engine.b.honroVerticalStage14Content;let out;
 try{if(content)app.stage=content;out=tick(app,dt);}finally{app.stage=stage;}
 if(ended(app))cancel(app);else prepareWaves(app);return out;};
G.HonroStage14Vertical={active,memory,sources,safe,paused,ended,cellApproached,installActivation,prepareWaves,offer,acceptOpportunity,cancel,formation};
})(globalThis);
