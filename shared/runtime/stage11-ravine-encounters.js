(function(G){'use strict';
// A saved, authored Stage 11 opts in. Old Stage 11 battles and all other chapters
// retain their existing Act 2 loop, population, story and save representation.
const A=G.HonroAct2,E=G.HonroEncounters,W=G.HonroAllies;
const active=b=>b?.honroStage===11&&!b.honroCustom&&[1,2].includes(b.honroStage11EncounterRevision);
const composed=b=>active(b)&&b.honroStage11EncounterRevision===2;
const composition=b=>(b.honroState.ravineComposition??={version:2,alert:{},entries:{},echoWarnings:{}});
const owned=ev=>ev?.honroStage11Response===1;
const live=b=>b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0&&!u.honroSubdued);
const done=(b,id)=>!!b.honroState?.act2?.done?.[id];
const pending=b=>(b.honroEvents||[]).filter(ev=>owned(ev)&&!b.honroState.flags['event:'+ev.id]);
function blockedClear(b){
 if(!active(b))return null;
 const waiting=pending(b),foes=live(b);
 if(done(b,'knot-west')&&!done(b,'clear-west')&&!foes.some(u=>u.honroCohort==='west')&&waiting.some(ev=>(ev.action.actions||[]).some(a=>a.honroCohort==='west')))return'clear-west';
 if(done(b,'resident')&&!done(b,'clear-road')&&!foes.length&&waiting.length)return'clear-road';
 return null;
}
function ready(b,ev){
 const t=ev.honroRavineTrigger||{};
 if(t.objectiveDone&&!done(b,t.objectiveDone))return false;
 if(t.region&&!b.units.some(u=>u.side===0&&!u.dead&&u.hp>0&&G.HonroAuthored.inside(u,t.region))&&!done(b,t.fallbackDone))return false;
 return true;
}
function queue(app){const b=app.engine.b,hs=b.honroState;
 hs.pendingEvents??=[];
 for(const ev of b.honroEvents||[]){
  if(!owned(ev)||hs.flags['event:'+ev.id]||hs.pendingEvents.includes(ev.id)||!ready(b,ev))continue;
  hs.pendingEvents.push(ev.id);hs.eventActors??={};
  hs.eventActors[ev.id]={id:app.actorBoundary||b.active,round:b.round};
  if(ev.warning)app.event(ev.warning);app.dirty=true;
 }
 E.flush(app);
}
const execute=W.execute;
function safeEntry(b,actions){return !actions.some(a=>{const flying=!!G.HonroWorld.archetypes[a.kind]?.flying;return b.units.some(u=>u.side===0&&!u.dead&&u.hp>0&&Math.abs(u.x-a.x)<280&&Math.abs(u.y-(a.y-(flying?255:0)))<300);});}
function unpromote(b,u){
 if(u.elite){u.combatBaseHp/=1.25;u.hp=u.maxHp=Math.round(u.combatBaseHp*G.HONRO_CORE.DIFFICULTIES[b.difficulty].hp);u.honroXpWeight/=1.25;}
 u.elite=false;u.armor=.04;
}
W.execute=function(app,action){
 const b=app.engine?.b;if(!active(b))return execute(app,action);
 if(action?.type==='spawn'&&action.kind==='echo'&&/^hold-knots-(0|3)$/.test(action.source||'')){
  const ids=new Set(b.units.map(u=>u.id));let result=false;
  if(composed(b)){
   const n=action.source.endsWith('-3')?1:0,mem=composition(b),warning=mem.echoWarnings[n],serial=b.honroState.actorTurnSerial||0;
   if(!warning||serial<=warning.serial)return false;
   const alternate=b.honroStage11DefenseAlternates?.[n],choices=[{...action,spacing:90},...(alternate?[{...action,...alternate,spacing:90}]:[])];
   for(const choice of choices)if(safeEntry(b,[choice])&&execute(app,choice)!==false){result=true;mem.entries[action.source]={x:choice.x,y:choice.y,round:b.round};break;}
  }else result=execute(app,action);
  if(result===false)return false;
  // The original Act 2 wave function still selects/tunes one elite per trio.
  // Strip only factory promotion so response/defense interleaving cannot add one.
  for(const u of b.units)if(!ids.has(u.id)&&u.side===1)unpromote(b,u);
  return result;
 }
 if(action?.honroStage11Response!==1)return execute(app,action);
 const children=action.type==='multi'?action.actions||[]:[action];
 // An occupied doorway is retried at the next safe boundary, without creating
 // half a mixed group or appearing in the middle of a companion's body.
 const ids=new Set(b.units.map(u=>u.id));let result=false,chosen=children,choiceIndex=0;
 const choices=composed(b)?[children,...(action.honroRavineAlternatives||[])]:[children];
 for(const [i,list]of choices.entries()){
  if(!safeEntry(b,list))continue;
  const candidate=action.type==='multi'?{...action,actions:list}:action;
  if(execute(app,candidate)===false)continue;
  result=true;chosen=list;choiceIndex=i;break;
 }
 if(result===false)return false;
 const specs=chosen.flatMap(a=>Array.from({length:a.n||1},()=>a));
 if(composed(b)){const at=chosen[0];composition(b).entries[action.source]={choice:choiceIndex,x:at.x,y:at.y,round:b.round};const ev=b.honroEvents.find(v=>v.id===action.source);if(ev)ev.entry={x:at.x,y:at.y};}
 const born=b.units.filter(u=>!ids.has(u.id)&&u.side===1);
 for(const [i,u] of born.entries()){
  const spec=specs[i]||{};
  // createEnemy's historical eleventh-enemy promotion is not an authored elite.
  unpromote(b,u);u.honroAct2Elite=!!spec.elite;
  u.honroAct2Revision=2;u.honroCohort=spec.honroCohort||'reinforcement';
  u.honroStage11Response=action.source;u.honroEncounterRole=spec.honroEncounterRole||'entry-pressure';
  u.honroEncounterSupport=spec.support;u.group=40+(action.honroRavineIndex||0);
  A.tuneEncounter(u,11);G.HonroProgression.enemyXP(b,u);
 }
 return result;
};
const populationCap=E.populationCap;
E.populationCap=function(b){return active(b)?b.honroStage11PopulationCap??populationCap(b):populationCap(b);};
const attach=A.attach;
A.attach=function(app,e){const out=attach(app,e),b=e.b;if(!composed(b)||e.honroRavineCompositionAttached)return out;e.honroRavineCompositionAttached=true;
 const refresh=e.refreshActivation.bind(e),mem=composition(b);
 e.refreshActivation=function(){refresh();const heroes=e.heroesAlive();for(const [cell,radius]of Object.entries(b.honroStage11Activation||{})){
  const units=e.alive(1).filter(u=>u.honroRavineCell===cell);if(!units.length)continue;
  const alert=mem.alert[cell]||units.some(u=>u.aggroUntil>=b.round||heroes.some(h=>Math.hypot(h.x-u.x,(h.y-u.y)*.8)<radius));
  if(alert)mem.alert[cell]=true;else for(const u of units)u.awake=false;
 }};e.refreshActivation();return out;
};
function prepareEchoWarning(app){const b=app.engine.b;if(!composed(b)||!done(b,'knot-east')||done(b,'hold-knots'))return;
 const count=b.honroState.act2?.holds?.['hold-knots']?.spawned||0;if(count>=6)return;const n=count<3?0:1,mem=composition(b);if(mem.echoWarnings[n])return;
 mem.echoWarnings[n]={serial:b.honroState.actorTurnSerial||0,round:b.round};
 app.event(n===0?'서쪽 매듭에서 잔향 셋이 뭉칩니다. 다음 행동 뒤에 들어오니 먼저 자리를 잡으세요.':'남은 잔향 셋은 동쪽 입구에서 모입니다. 이번 무리가 지나면 새 잔향은 없습니다.');app.dirty=true;
}
function residentShelter(app,dt){const e=app.engine,b=e.b;if(!composed(b)||dt<=0||app.dialogue||!done(b,'resident')||b.side!==0||b.phase!=='aim'||b.projectiles.length)return;
 const m=b.honroMarkers.find(m=>m.id==='resident'),u=e.unit(m?.target),goal=b.honroStage11Shelter;if(!u||u.dead||!goal)return;
 const mem=composition(b),s=mem.shelter??={status:'waiting',startX:u.x,goalX:goal.x};if(['done','stopped'].includes(s.status))return;
 // The civilian never becomes another fighter. Wait for a safe short route;
 // use real walking and keep all original HP/protection/failure semantics.
 if(live(b).some(v=>Math.hypot(v.x-goal.x,v.y-goal.y)<430)||b.units.some(v=>v!==u&&!v.dead&&v.hp>0&&Math.abs(v.x-(u.x+Math.sign(goal.x-u.x)*12))<v.r+u.r+8&&Math.abs(v.y-u.y)<Math.min(v.h,u.h)))return;
 if(!s.started){s.started=true;s.status='walking';s.oldSpeed=u.walkSpeed;u.fixed=false;u.walkSpeed=110;u.moveLeft=Math.abs(goal.x-u.x)+30;app.event('분리된 주민이 가까운 짐 뒤로 몸을 피합니다.');}
 const old=u.x;e.walk(u,Math.sign(goal.x-u.x),Math.min(dt,.05),true);s.stalled=Math.abs(u.x-old)<.01?(s.stalled||0)+dt:0;
 if(Math.abs(goal.x-u.x)<3||s.stalled>2||u.moveLeft<=0){s.status=Math.abs(goal.x-u.x)<3?'done':'stopped';u.fixed=true;u.walkSpeed=s.oldSpeed;u.vx=u.vy=0;}app.dirty=true;
}
const tick=A.tick;
A.tick=function(app,dt){
 const b=app.engine?.b;if(!active(b))return tick(app,dt);
 if(composed(b)){app.engine.refreshActivation();prepareEchoWarning(app);residentShelter(app,dt);}
 const hold=b.honroState.act2?.holds?.['hold-knots'],entries=b.honroStage11DefenseEntries;
 if(entries?.length&&(!hold||hold.spawned<6)){
  const site=b.honroMarkers.find(m=>m.id==='wave-hold-knots');
  if(site)Object.assign(site,entries[Math.min(entries.length-1,Math.floor((hold?.spawned||0)/3))]);
 }
 if(!['won','lost'].includes(b.phase)&&!app.done)queue(app);
 if(composed(b))prepareEchoWarning(app);
 // Act 2's lexical completion scan must not mark a clear step done while an
 // authored mixed group is waiting for a safe, unoccupied entry boundary.
 if(blockedClear(b)){app.checkMission(app.engine);return;}
 const result=tick(app,dt);
 // A knot can finish in this very tick. Queue its warning now; the existing
 // actor-boundary flush still owns when bodies may enter the battlefield.
 if(!['won','lost'].includes(b.phase)&&!app.done)queue(app);
 if(composed(b))prepareEchoWarning(app);
 return result;
};
const current=A.current,eligibility=A.eligibility,use=A.use;
A.current=function(b){
 const id=blockedClear(b),s=id?A.steps(b).find(s=>s.id===id):current(b);
 if(!active(b)||!s||s.kind!=='clear')return s;
 const label=id?id==='clear-west'?'서쪽 추격대 진입 · 남은 편대 1':'예고된 들림 진입 · 남은 편대 '+pending(b).length:s.label+' · 남은 적 '+A.enemiesFor(b,s).length;
 // A presentation copy lets the existing compact HUD retain the exact count,
 // without rewriting saved objective text or another chapter's guidance.
 return{...s,label};
};
A.eligibility=function(app,m){const id=blockedClear(app.engine?.b);return id?{ok:false,reason:id==='clear-west'?'예고된 서쪽 추격대를 먼저 제압하세요':'예고된 들림의 진입을 기다린 뒤 제압하세요'}:eligibility(app,m);};
A.use=function(app,m){return blockedClear(app.engine?.b)?false:use(app,m);};
const state=A.state;
A.state=function(b){
 const result=state(b);if(!active(b))return result;
 const presented=A.current(b);if(presented?.kind==='clear')result.targets=result.targets.map(t=>t.id===presented.id?{...t,label:presented.label}:t);
 const waiting=pending(b),blocked=blockedClear(b);
 const foes=live(b);
 // All responses are due by the east-knot step, before the four-round defense.
 // This guard covers a blocked entry or an unusually fast saved-state resume:
 // the existing all-enemies objective must never silently miss queued bodies.
 if(blocked||(result.complete||done(b,'clear-road'))&&(waiting.length||foes.length)){
  const hero=b.units.find(u=>u.id===b.active)||b.units.find(u=>u.side===0);
  const target=foes.slice().sort((a,c)=>Math.hypot(a.x-(hero?.x||0),a.y-(hero?.y||0))-Math.hypot(c.x-(hero?.x||0),c.y-(hero?.y||0)))[0];
  const relevant=blocked==='clear-west'?waiting.filter(ev=>(ev.action.actions||[]).some(a=>a.honroCohort==='west')):waiting;
  const entry=relevant[0]?.entry,id=blocked||'clear-road';
  const label=blocked==='clear-west'?'서쪽 매듭 추격대 진입 · 남은 편대 '+relevant.length:foes.length?'산길에 남은 들림 모두 제압 · 남은 적 '+foes.length:'예고된 들림 진입 · 남은 편대 '+waiting.length;
  return{...result,complete:false,objectiveReady:false,summary:label,allTargets:result.allTargets.map(t=>t.id===id?{...t,done:false}:t),targets:[{id,kind:target?'boss':'interact',x:blocked?entry?.x??0:target?.x??entry?.x??0,y:blocked?entry?.y??0:target?target.y-target.h:entry?.y??0,label,unitId:blocked?undefined:target?.id}]};
 }
 return result;
};
// Only the next actionable rescue instruction is shown. Use the production
// eligibility result; this presentation does not change any gate or saved step.
function rescueInstruction(b,s){
 if(!composed(b)||s?.id!=='resident'||s.kind!=='rescue')return null;
 const m=b.honroMarkers.find(m=>m.id===s.id),heroes=b.units.filter(u=>u.side===0&&!u.dead&&u.hp>0&&!u.summoned&&!u.enthrall);
 const u=heroes.find(u=>u.id===b.active)||heroes[0];if(!m||!u)return null;
 const result=A.eligibility({engine:{b,active:u}},m),spirit=b.units.find(v=>v.id===m.spiritId),sodan=heroes.find(v=>v.cls==='occultist');
 if(!result.ok&&result.reason==='주변 들림을 먼저 제압하세요'){
  const count=b.units.filter(v=>v.side===1&&!v.dead&&!v.honroSubdued&&v.id!==m.spiritId&&!v.honroAct2Boss&&Math.hypot(v.x-m.x,v.y-m.y)<360).length;
  return '주민 주변의 적 '+count+'명을 처치하세요';
 }
 if(!result.ok&&result.reason==='붙은 혼을 먼저 약화시키세요 · 체력 40% 이하')return sodan?'붙은 혼의 체력을 40% 이하로 낮추세요':'주민에게 붙은 혼을 제압하세요';
 if(!result.ok&&result.reason==='소단으로 분리하거나 곁의 혼을 먼저 제압')return sodan?'소단으로 주민에게 다가가 E':'주민에게 붙은 혼을 제압하세요';
 if(result.ok)return spirit&&!spirit.dead&&!spirit.honroSubdued?'소단으로 주민에게 다가가 E':'동행으로 주민에게 다가가 E';
 return null;
}
G.HonroStage11RavineEncounters={active,ready,queue,blockedClear,composed,residentShelter,rescueInstruction};
})(globalThis);
