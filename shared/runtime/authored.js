(function(G){'use strict';
function inside(u,r){return r.width!==undefined?Math.abs(u.x-r.x)<=r.width/2&&Math.abs(u.y-r.y)<=(r.height||r.width)/2:Math.hypot(u.x-r.x,u.y-r.y)<=(r.radius||160);}
function objectiveState(b){
 const heroes=b.units.filter(u=>u.side===0&&!u.dead&&u.hp>0),foes=b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0),hs=b.honroState;
 const targets=(b.honroObjectives||[]).filter(o=>o.type!=='campaign').map(o=>{
  let done=false;
  if(o.type==='reach')done=heroes.some(u=>inside(u,o));
  else if(o.type==='clear')done=!foes.length&&!G.HonroEncounters.pending(b);
  else if(o.type==='destroy'){const element=b.honroElements?.find(e=>e.id===o.targetId);done=!!b.terrain.find(t=>t.id===o.targetId)?.broken||!!b.units.find(u=>u.id===o.targetId)?.dead||!!(element?.collisionIds.length&&element.collisionIds.every(id=>b.terrain.find(t=>t.id===id)?.broken));}
  else if(o.type==='interact'||o.type==='flag')done=!!hs.flags[o.flag||'interact:'+o.targetId];
  return{...o,kind:'objective',x:o.x??heroes[0]?.x??0,y:o.y??heroes[0]?.y??0,done};
 });
 return{complete:targets.some(o=>o.required!==false)&&targets.filter(o=>o.required!==false).every(o=>o.done),summary:targets.filter(o=>!o.done).map(o=>o.label||o.type).join(' · ')||'맵 탐색',targets:targets.filter(o=>!o.done),allTargets:targets};
}
function tick(app,dt){const e=app.engine,b=e.b,heroes=e.heroesAlive();if(!heroes.length)return;
 G.HonroEncounters.update(app,dt,{progress:Math.max(...heroes.map(u=>u.x)),height:Math.min(...heroes.map(u=>u.y)),broken:b.terrain.filter(t=>t.broken).length,collected:b.honroMarkers.filter(m=>m.collected).length});app.checkMission(e);
}
G.HonroAuthored={inside,objectiveState,tick};
})(globalThis);
