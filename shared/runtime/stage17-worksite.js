(function(G){'use strict';
// Only a fresh, authored worksite opts in. Ordinary old Stage17 saves keep their
// old single-entry defense and all other chapters retain their exact loop.
const A=G.HonroAct2,W=G.HonroAllies;
const active=b=>b?.honroStage===17&&!b.honroCustom&&b.honroWorksiteVersion===1;
const memory=b=>(b.honroState.worksiteDefense??={version:1,warnings:{},entries:{}});
const entryFor=(b,index)=>b.honroWorksiteDefenseEntries?.[Math.floor(index/3)%2];
function warn(app){const b=app.engine.b,s=A.current(b);if(s?.id!=='hold-hoist')return;
 const h=A.memory(b).holds?.[s.id],index=h?.spawned||0;if(index>=(s.wave?.count||0)||h?.waveRound===b.round)return;
 const marker=b.honroMarkers.find(m=>m.id===s.id);if(!marker||!app.engine.heroesAlive().some(u=>Math.hypot(u.x-marker.x,u.y-marker.y)<s.radius))return;
 const key=s.id+'-'+index,mem=memory(b);if(mem.warnings[key])return;const at=entryFor(b,index);if(!at)return;
 mem.warnings[key]={serial:b.honroState.actorTurnSerial||0,round:b.round,side:at.side};
 app.event(at.side==='west'?'서쪽 인양 바닥에서 수레 바퀴가 굴러온다. 다음 움직임에 대비하세요.':'복구문 너머 궤도에서 쇠바퀴가 울린다. 동쪽 진입로를 살피세요.');app.dirty=true;
}
const execute=W.execute;
W.execute=function(app,action){const b=app.engine?.b;
 if(!active(b)||action?.type!=='spawn'||action.kind!=='minecart'||!/^hold-hoist-(0|3|6|9)$/.test(action.source||''))return execute(app,action);
 const index=Number(action.source.split('-').at(-1)),at=entryFor(b,index),mem=memory(b),warning=mem.warnings[action.source];
 if(!at||!warning||(b.honroState.actorTurnSerial||0)<=warning.serial)return false;
 const xs=Array.from({length:action.n||1},(_,i)=>at.x+i*100);
 if(b.units.some(u=>u.side===0&&!u.dead&&u.hp>0&&xs.some(x=>Math.abs(u.x-x)<280)&&Math.abs(u.y-at.y)<300))return false;
 const ids=new Set(b.units.map(u=>u.id)),result=execute(app,{...action,x:at.x,y:at.y,spacing:100,maxDistance:320});if(result===false)return false;
 for(const u of b.units)if(u.side===1&&!ids.has(u.id)){
  // Factory index promotion is not an additional authored worksite elite.
  if(u.elite){u.combatBaseHp/=1.25;u.hp=u.maxHp=Math.round(u.combatBaseHp*G.HONRO_CORE.DIFFICULTIES[b.difficulty].hp);u.honroXpWeight/=1.25;}u.elite=false;u.armor=.04;
  u.honroWorksiteEntry=at.side;
 }
 mem.entries[action.source]={side:at.side,x:at.x,y:at.y,round:b.round,serial:b.honroState.actorTurnSerial||0};return result;
};
const tick=A.tick;A.tick=function(app,dt){if(active(app.engine?.b))warn(app);return tick(app,dt);};
G.HonroStage17Worksite={active,memory,entryFor};
})(globalThis);
