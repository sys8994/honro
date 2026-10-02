(function(G){'use strict';
const combat=a=>!!a&&(a.type==='spawn'||a.type==='sniperAmbush'||a.type==='multi'&&(a.actions||[]).some(combat));
const spawnCount=a=>!a?0:a.type==='multi'?(a.actions||[]).reduce((n,a)=>n+spawnCount(a),0):combat(a)?a.n||1:0;
// Applied only to newly compiled campaign battles. Saved battles keep their population and HP.
function balance(b){
 if(b.honroCustom||b.honroEncounterRevision||b.honroStage>10)return;
 const originals=b.units.filter(u=>u.side===1&&!u.boss&&!u.honroMidboss&&!u.honroFinalBoss),added=[];
 for(const u of originals){
  u.combatBaseHp=(u.combatBaseHp??u.maxHp/(G.HONRO_CORE.DIFFICULTIES[b.difficulty]?.hp||1))*.6;
  u.hp=u.maxHp=Math.max(1,Math.round(u.maxHp*.6));
  const v=structuredClone(u);v.id=u.id+'-cluster';v.x+=u.r*2+24;v.spawnX=v.x;v.damageBy={};v.xpGranted=0;
  const kind=v.honroVariant||v.honroType,flying=!!G.HonroWorld.archetypes[kind]?.flying;
  const spot=G.HonroTerrain.place({...b,units:[...b.units,...added]},v,{flying,maxDistance:700});
  if(!spot)throw Error('No safe cluster placement: '+v.id);
  Object.assign(v,spot,{spawnX:spot.x,spawnY:spot.y});added.push(v);
 }
 b.units.push(...added);
 const double=a=>{if(!a)return;if(a.type==='multi')a.actions.forEach(double);else if(combat(a))a.n=(a.n||1)*2;};
 for(const ev of b.honroEvents||[])double(ev.action);
 b.honroEncounterRevision=1;
}
function configure(b){
  if(!b.honroEvents)return;
  if(b.honroStage===4&&b.honroEncounterRevision&&!b.honroEvents.some(ev=>ev.id==='siege-mid')){
    const wave={id:'siege-mid',when:{round:5},action:{type:'spawn',n:4,x:2320,kind:'hound'},text:'산개들이 중간 길목을 넘어 피란문으로 내려온다.',lines:[],once:true};
    const first=b.honroEvents.findIndex(ev=>ev.id==='siege-0');b.honroEvents.splice(first+1,0,wave);
  }
  if(b.honroCanonical)return;
  if(b.honroStage===2){
    const chain=['road-pressure','sniper-seen','right-cliff','last-flight'];
    for(const ev of b.honroEvents){
      const index=chain.indexOf(ev.id);
      if(index>=0){const a=b.honroMapAnchors||{},progress={ 'road-pressure':(a.leftBasin?.x||2650)-180,'sniper-seen':(a.leftBasin?.x||2650)+120,'right-cliff':(a.rightBasin?.x||3700)-220,'last-flight':(a.exit?.x||4320)-180}[ev.id];ev.when={any:[{progress},{enemiesAtMost:0}],after:index?chain[index-1]:null};ev.required=true;}
      if(ev.id==='road-pressure'&&ev.action?.type==='spawn')ev.action.n=1;
      if(ev.id==='sniper-seen'&&ev.action?.type==='sniperAmbush')ev.action.n=1;
      if(ev.id==='damheo-ward'){ev.actor='npc-damheo';ev.action.actor='npc-damheo';}
    }
  }
  if(b.honroStage===3){for(let i=0;i<3;i++){const ev=b.honroEvents.find(e=>e.id==='siege-'+i);if(ev){ev.when={any:[{round:2+i*2},{enemiesAtMost:0}],after:i?'siege-'+(i-1):null};ev.action.n=[3,3,4][i];ev.required=true;}}}
  // Later encounters remain tied to objectives/locations, with smaller finite waves.
  if(b.honroStage>=4)for(const ev of b.honroEvents){const trim=a=>{if(!a)return;if(a.type==='spawn')a.n=Math.min(a.n,4);if(a.type==='multi')a.actions.forEach(trim);};trim(ev.action);}
}
function matches(w,s){
  if(w.region&&!(s.heroes||[]).some(u=>G.HonroAuthored.inside(u,w.region)))return false;
  if(w.after&&!s.flags['event:'+w.after])return false;
  if(w.any&&!w.any.some(c=>matches(c,s)))return false;
  return (w.progress===undefined||s.progress>=w.progress)&&(w.height===undefined||s.height<=w.height)&&(w.round===undefined||s.round>=w.round)&&(w.enemiesAtMost===undefined||s.enemies<=w.enemiesAtMost)&&(w.broken===undefined||s.broken>=w.broken)&&(w.collected===undefined||s.collected>=w.collected)&&(w.hold===undefined||s.hold>=w.hold)&&(!w.rescued||s.rescued)&&(!w.destroyed||s.terrain.find(t=>t.id===w.destroyed)?.broken);
}
function pending(b){return(b.honroEvents||[]).some(ev=>ev.required&&!b.honroState.flags['event:'+ev.id]);}
function update(app,dt,state){
  const e=app.engine,b=e.b,hs=b.honroState;
  if(['won','lost'].includes(b.phase)||app.done)return;
  hs.pendingEvents??=[];
  hs.encounterCooldown=Math.max(0,(hs.encounterCooldown||0)-dt);
  for(const ev of b.honroEvents||[]){
    const key='event:'+ev.id;if(hs.flags[key])continue;
    if(ev.actor&&!b.units.some(u=>u.id===ev.actor&&!u.dead&&u.hp>0)){hs.flags[key]='cancelled:actor-unavailable';continue;}
    const enemies=e.alive(1).length;
    if(!matches(ev.when,{...state,heroes:e.heroesAlive(),enemies,round:b.round,flags:hs.flags,terrain:b.terrain,hold:hs.hold,rescued:hs.rescued}))continue;
    if(!hs.pendingEvents.includes(ev.id)){hs.pendingEvents.push(ev.id);hs.eventActors??={};hs.eventActors[ev.id]={id:app.actorBoundary||b.active,round:b.round};app.dirty=true;}
  }
  flush(app);
}
function flush(app){
  const e=app.engine,b=e.b,hs=b.honroState;
  if(!app.actorBoundary||app.dialogue||['won','lost'].includes(b.phase))return;
  let spawned=false;
  for(const id of [...(hs.pendingEvents||[])]){
    const ev=b.honroEvents.find(v=>v.id===id),key='event:'+id;
    if(!ev||hs.flags[key]){hs.pendingEvents=hs.pendingEvents.filter(v=>v!==id);continue;}
    const wait=hs.eventActors?.[id],actor=wait&&e.unit(wait.id);if(wait&&b.round<=wait.round&&actor&&!actor.acted&&!actor.dead&&app.actorBoundary!==actor.id)continue;
    if(ev.actor&&!b.units.some(u=>u.id===ev.actor&&!u.dead&&u.hp>0)){hs.flags[key]='cancelled:actor-unavailable';continue;}
    const enemies=e.alive(1).length;
    if(combat(ev.action)){
      const normalCap=G.HonroProgression.plan(b.honroStage).maxAlive*(b.honroEncounterRevision?2:1);
      const cap=Math.min(b.honroStage===4?Math.max(normalCap,26):normalCap,hs.sodanCoop?G.HonroMission.FINALE_CAP:Infinity);
      if(spawned||enemies+spawnCount(ev.action)>cap)continue;
    }
    if(G.HonroAllies.execute(app,ev.action)===false)continue;
    hs.flags[key]=true;if(combat(ev.action))spawned=true;
    hs.eventLog??=[];hs.eventLog.push({id,phase:b.phase,round:b.round,side:b.side,teamEnds:[...b.teamEnds]});hs.eventLog=hs.eventLog.slice(-80);
    hs.pendingEvents=hs.pendingEvents.filter(v=>v!==id);
    const lines=G.HonroStoryContent.eventLines(app,ev);app.event(lines?.[0]?.[2]?.storyTitle||ev.text);if(lines?.length)app.sayLines(lines);b.events.push('honro:'+ev.id);app.dirty=true;
    if(app.dialogue)break;
  }
}
// Reaching an exit can win during movement, before the next event boundary.
// Finish already-triggered, action-free discoveries before the ending dialogue.
function finishNarrative(app){const b=app.engine?.b,hs=b?.honroState;if(!hs||b.honroCustom||b.phase!=='won')return;for(const id of [...(hs.pendingEvents||[])]){const ev=b.honroEvents.find(v=>v.id===id);if(!ev||ev.action||hs.flags['event:'+id])continue;const lines=G.HonroStoryContent.eventLines(app,ev);if(!lines?.length)continue;if(ev.actor&&!b.units.some(u=>u.id===ev.actor&&!u.dead&&u.hp>0))continue;app.sayLines(lines);hs.flags['event:'+id]=true;hs.pendingEvents=hs.pendingEvents.filter(v=>v!==id);}}
function actorEnd(app,id){const hs=app.engine?.b.honroState;if(!hs||app.training||app.actorBoundary)return;hs.actorTurnSerial=(hs.actorTurnSerial||0)+1;app.actorBoundary=id||'boundary';try{G.HonroAllies.missionTick(app,0);flush(app);app.startQueuedStory?.();}finally{app.actorBoundary=null;}}
function attach(app,e){
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){const b=e.b,u=e.active,acted=u?.acted,round=b.round;const out=finish(...args);if(u&&(!acted&&u.acted||b.round!==round))actorEnd(app,u.id);return out;};
 const tick=e.tick.bind(e);e.tick=function(dt){const b=e.b,phase=b.phase,id=b.active,index=phase==='ally'?b.honroState?.allyQueue?.index:b.summonTurn?.index;tick(dt);if((phase==='ally'&&index!==b.honroState?.allyQueue?.index)||(phase==='summon'&&index!==b.summonTurn?.index))actorEnd(app,id);};
 const next=e.switchTeam.bind(e);e.switchTeam=function(){
  const b=e.b,hs=b.honroState;if(b.phase!=='transition')return;
  const boundary=b.teamEnds.join(':');
  if(hs.lastEventBoundary!==boundary){hs.lastEventBoundary=boundary;actorEnd(app,b.active);}
  if(app.dialogue||b.phase!=='transition')return;next();
};}
G.HonroEncounters={configure,matches,pending,update,flush,finishNarrative,attach,actorEnd,combat,spawnCount,balance};
})(globalThis);
