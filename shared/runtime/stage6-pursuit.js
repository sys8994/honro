(function(G){'use strict';
// Only newly authored Stage 6 battles opt in. Old saved battles keep their
// original event, roster and finite capacity. No existing actor is relocated.
const W=G.HonroAllies,execute=W.execute;
const active=b=>!!b&&!b.honroCustom&&b.honroStage===6&&b.honroStage6PursuitRevision===1;
W.execute=function(app,action){
 const e=app.engine,b=e?.b;
 if(!active(b)||action?.source!=='pursuit'||action.type!=='spawn')return execute(app,action);
 const objective=e.unit('objective');if(!objective||objective.dead||objective.hp<=0)return false;
 for(const offset of [450,650,850]){
  const x=objective.x-offset;if(x<90||x>b.width-100)continue;
  const y=G.HonroWorld.top(b,x,objective.y,'lower-road');
  const spacing=action.spacing??145,n=action.n||1;
  // Do not surprise a hero already occupying the advertised entry.
  if(Array.from({length:n},(_,i)=>x+(i-(n-1)/2)*spacing).some(px=>e.heroesAlive().some(h=>Math.hypot(h.x-px,h.y-y)<180)))continue;
  const before=b.units.length,result=execute(app,{...action,x,y,support:'lower-road',spacing,maxDistance:120});
  if(result===false)continue;
  for(const u of b.units.slice(before))if(u.honroSpawnSource==='pursuit'){
   u.honroTargetId=objective.id;u.honroTargetUntil=b.round+2;
   u.honroPursuitSupports=['lower-road'];u.honroDensityBornRound=b.round;
  }
  return result;
 }
 return false;
};
G.HonroStage6Pursuit={active};
})(globalThis);
