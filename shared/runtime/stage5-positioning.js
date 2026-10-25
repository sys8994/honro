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
  const entered=b.honroStage5TraversalRevision?units.some(u=>heroes.some(h=>Math.hypot(h.x-u.x,h.y-u.y)<=500)):cell==='entry'?units.some(u=>heroes.some(h=>Math.hypot(h.x-u.x,(h.y-u.y)*.8)<=540)):heroes.some(h=>h.x>=(cell==='ritual'?1300:1950));
  if(entered||units.some(u=>u.aggroUntil>=b.round))m.alert[cell]=true;
  for(const u of units)u.awake=!!m.alert[cell];
 }
}
const attach=E.attach;E.attach=function(app,e){const out=attach(app,e);if(!active(e.b)||e.honroStage5PositioningAttached)return out;e.honroStage5PositioningAttached=true;
 const base=e.refreshActivation.bind(e);e.refreshActivation=function(){base();refresh(e);};e.refreshActivation();return out;
};
const execute=A.execute;A.execute=function(app,a){const b=app.engine?.b;if(!active(b)||a?.type!=='spawn'||a.source!=='lower-beasts')return execute(app,a);
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
G.HonroStage5Positioning={active,memory,refresh,assignPursuit};
})(globalThis);
