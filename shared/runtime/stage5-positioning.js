(function(G){'use strict';
// Saved candidate opt-in only. Shared movement, damage, skills and ritual range stay authoritative.
const E=G.HonroEncounters,A=G.HonroAllies;
const active=b=>b?.honroStage===5&&!b.honroCustom&&b.honroStage5PositioningRevision===1;
const memory=b=>(b.honroState.stage5Positioning??={alert:{},wave:null});
function assignPursuit(app,a,units){
 const b=app.engine.b;if(!active(b)||!b.honroStage5TraversalRevision||!a.pursuitSupports?.length)return;
 const holder=app.engine.unit(b.honroState.ritual?.holderId)||app.engine.heroesAlive().find(u=>u.cls==='mage');
 for(const u of units){u.honroPursuitSupports=[...a.pursuitSupports];if(holder){u.honroTargetId=holder.id;u.honroTargetUntil=999999;}}
}
function refresh(e){const b=e.b,m=memory(b),heroes=e.heroesAlive();
 for(const cell of b.honroStage5TraversalRevision?[...new Set(e.alive(1).map(u=>u.honroStage5Cell).filter(Boolean))]:['entry','ritual','shore']){
  const units=e.alive(1).filter(u=>u.honroStage5Cell===cell);
  const authored=b.honroStage5EncounterRevision===2&&b.honroMap?.positioning?.cells?.find(c=>c.key===cell)?.region;
  const entered=authored?heroes.some(h=>G.HonroAuthored.inside(h,authored)):b.honroStage5TraversalRevision?units.some(u=>heroes.some(h=>Math.hypot(h.x-u.x,h.y-u.y)<=500)):cell==='entry'?units.some(u=>heroes.some(h=>Math.hypot(h.x-u.x,(h.y-u.y)*.8)<=540)):heroes.some(h=>h.x>=(cell==='ritual'?1300:1950));
  if(entered||units.some(u=>u.aggroUntil>=b.round))m.alert[cell]=true;
  for(const u of units)u.awake=!!m.alert[cell];
 }
}
const attach=E.attach;E.attach=function(app,e){const out=attach(app,e);if(!active(e.b)||e.honroStage5PositioningAttached)return out;e.honroStage5PositioningAttached=true;
 const base=e.refreshActivation.bind(e);e.refreshActivation=function(){base();refresh(e);};e.refreshActivation();return out;
};
const execute=A.execute;A.execute=function(app,a){const b=app.engine?.b;
 if(active(b)&&b.honroStage5EncounterRevision===2&&['lower-beasts','pine-flight'].includes(a?.source)){
  const m=memory(b);m.responses??={};if(m.responses[a.source]?.length)return true;
  for(const dx of a.source==='lower-beasts'?[0,-420]:[0]){
   const action=structuredClone(a),groups=action.type==='multi'?action.actions:[action];
   for(const q of groups){q.x+=dx;q.y=G.HonroWorld.top(b,q.x,q.y,q.support);}
   // Keep a warning meaningful even when a companion doubles back into the
   // actual entry. Atomic common reservation handles body occupancy as well.
   if(groups.some(q=>Array.from({length:q.n||1},(_,i)=>{const x=q.x+(i-((q.n||1)-1)/2)*(q.spacing??100),y=G.HonroWorld.top(b,x,q.y,q.support)-(a.source==='pine-flight'?210:0);return app.engine.heroesAlive().some(h=>Math.hypot(h.x-x,h.y-y)<180);}).some(Boolean)))continue;
   const before=b.units.length,result=execute(app,action);if(result===false)continue;
   const fresh=b.units.slice(before),upper=a.source==='pine-flight',target=app.engine.heroesAlive().find(h=>h.cls===(upper?'archer':'mage'));
   for(const u of fresh){u.honroStage5Cell=upper?'pine-response':'ritual-response';m.alert[u.honroStage5Cell]=true;if(target){u.honroTargetId=target.id;u.honroTargetUntil=999999;}if(!upper)u.honroPursuitSupports=['valley-floor'];}
   m.responses[a.source]=fresh.map(u=>u.id);return result;
  }return false;
 }
 if(!active(b)||a?.type!=='spawn'||a.source!=='lower-beasts')return execute(app,a);
 const m=memory(b);if(m.wave?.ids?.length)return true;
 // One six-stag wave through the vacated western approach. Reserve all six
 // standard bodies; occupancy never causes partial spawns or teleports.
 for(const [choice,at]of (b.honroStage5TraversalRevision?(a.entryOptions||[{x:a.x,y:a.y}]):[{x:345,y:2520}]).entries()){
  // Exact authored entries only. Keep normal spacing between monsters while
  // reserving a separate full body margin around companions.
  if(b.honroStage5TraversalRevision&&Array.from({length:a.n||1},(_,i)=>{const x=at.x+(i-((a.n||1)-1)/2)*(a.spacing??100),y=G.HonroWorld.top(b,x,at.y,a.support);return app.engine.heroesAlive().some(h=>Math.hypot(h.x-x,h.y-y)<180);}).some(Boolean))continue;
  const before=b.units.length,result=execute(app,{...a,...at,support:a.support||'valley-floor',spacing:a.spacing??100,maxDistance:b.honroStage5TraversalRevision?(a.maxDistance??0):0});if(result===false)continue;
  assignPursuit(app,a,b.units.slice(before));
  m.wave={round:b.round,choice,...at,ids:b.units.slice(before).map(u=>u.id)};
  const ev=b.honroEvents.find(e=>e.id==='lower-beasts');if(ev)ev.entry={...at};return result;
 }
 if(m.blockedRound!==b.round){m.blockedRound=b.round;app.event('사슴들이 낮은 돌길 입구에서 기다린다. 입구가 비면 무리가 함께 들어온다.');app.dirty=true;}return false;
};
const missionTick=G.HonroMission.tick;G.HonroMission.tick=function(app,dt){const b=app.engine?.b;
 if(active(b)&&b.honroStage5EncounterRevision===2){const m=memory(b);if(b.honroState.ritual?.active)m.ritualCommitted=true;
  if(m.ritualCommitted){const ev=b.honroEvents.find(e=>e.id==='lower-beasts-warning');if(ev&&!b.honroState.flags['event:'+ev.id])ev.when.round=b.round;}
  if(b.honroState.flags['event:pine-flight-warning']){m.pineRound??=b.round+1;const ev=b.honroEvents.find(e=>e.id==='pine-flight');if(ev)ev.when.round=m.pineRound;}
 }return missionTick(app,dt);};
G.HonroStage5Positioning={active,memory,refresh,assignPursuit};
})(globalThis);
