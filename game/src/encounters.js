(function(G){'use strict';
const combat=a=>!!a&&(a.type==='spawn'||a.type==='sniperAmbush'||a.type==='multi'&&(a.actions||[]).some(combat));
const spawnCount=a=>!a?0:a.type==='multi'?(a.actions||[]).reduce((n,a)=>n+spawnCount(a),0):combat(a)?a.n||1:0;
function configure(b){
  if(!b.honroEvents)return;
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
    if(!matches(ev.when,{...state,enemies,round:b.round,flags:hs.flags,terrain:b.terrain,hold:hs.hold,rescued:hs.rescued}))continue;
    if(!hs.pendingEvents.includes(ev.id))hs.pendingEvents.push(ev.id);
  }
}
function flush(app){
  const e=app.engine,b=e.b,hs=b.honroState;
  if(b.phase!=='transition'||b.projectiles.length||e.settleBusy())return;
  let spawned=false;
  for(const id of [...(hs.pendingEvents||[])]){
    const ev=b.honroEvents.find(v=>v.id===id),key='event:'+id;
    if(!ev||hs.flags[key]){hs.pendingEvents=hs.pendingEvents.filter(v=>v!==id);continue;}
    if(ev.actor&&!b.units.some(u=>u.id===ev.actor&&!u.dead&&u.hp>0)){hs.flags[key]='cancelled:actor-unavailable';continue;}
    const enemies=e.alive(1).length;
    if(combat(ev.action)){
      const cap=G.HonroProgression.plan(b.honroStage).maxAlive;
      if(spawned||enemies+spawnCount(ev.action)>cap)continue;
    }
    if(G.HonroAllies.execute(app,ev.action)===false)continue;
    hs.flags[key]=true;if(combat(ev.action))spawned=true;
    hs.eventLog??=[];hs.eventLog.push({id,phase:b.phase,round:b.round,side:b.side,teamEnds:[...b.teamEnds]});hs.eventLog=hs.eventLog.slice(-80);
    hs.pendingEvents=hs.pendingEvents.filter(v=>v!==id);
    app.event(ev.text);if(ev.lines?.length)app.sayLines(ev.lines);b.events.push('honro:'+ev.id);app.dirty=true;
  }
}
function attach(app,e){const next=e.switchTeam.bind(e);e.switchTeam=function(){
  const b=e.b,hs=b.honroState;if(b.phase!=='transition')return;
  const boundary=b.teamEnds.join(':');
  if(hs.lastEventBoundary!==boundary){hs.lastEventBoundary=boundary;G.HonroAllies.missionTick(app,0);flush(app);app.startQueuedStory?.();}
  if(app.dialogue)return;next();
};}
G.HonroEncounters={configure,matches,pending,update,flush,attach,combat,spawnCount};
})(globalThis);
