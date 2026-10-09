(function(G){'use strict';
// New temple entry only. Existing Stage16 battle snapshots retain their timing.
const A=G.HonroAct2,W=G.HonroAllies,C=G.HONRO_CORE;
const active=b=>b?.honroStage===16&&!b.honroCustom&&b.honroTempleVersion===1;
const memory=b=>(b.honroState.templeDefense??={version:1,warnings:{},entries:{}});
const entryFor=(b,index)=>b.honroTempleDefenseEntries?.[Math.floor(index/3)%2];
function warn(app){const b=app.engine.b,s=A.current(b);if(s?.id!=='hold-hall')return;
 const h=A.memory(b).holds?.[s.id],index=h?.spawned||0;if(index>=(s.wave?.count||0)||h?.waveRound===b.round)return;
 const marker=b.honroMarkers.find(m=>m.id===s.id);if(!marker||!app.engine.heroesAlive().some(u=>Math.hypot(u.x-marker.x,u.y-marker.y)<s.radius))return;
 const key=s.id+'-'+index,mem=memory(b),at=entryFor(b,index);if(mem.warnings[key]||!at)return;
 mem.warnings[key]={serial:b.honroState.actorTurnSerial||0,round:b.round,side:at.side};
 app.event(at.side==='west'?'서쪽 돌계단의 꺼진 석등이 흔들린다. 다음 움직임에 대비하세요.':'동쪽 회랑에서 돌이 끌리는 소리가 난다. 법당 측면을 살피세요.');app.dirty=true;
}
const execute=W.execute;
W.execute=function(app,action){const b=app.engine?.b;
 if(!active(b)||action?.type!=='spawn'||action.kind!=='stoneLantern'||!/^hold-hall-(0|3|6|9)$/.test(action.source||''))return execute(app,action);
 const index=Number(action.source.split('-').at(-1)),entry=entryFor(b,index),mem=memory(b),warning=mem.warnings[action.source];
 if(!entry||!warning||(b.honroState.actorTurnSerial||0)<=warning.serial)return false;
 const n=action.n||1,candidates=[entry,...(entry.alternates||[]).map(p=>({...p,side:entry.side}))];
 const at=candidates.find(p=>{const xs=Array.from({length:n},(_,i)=>p.x+(i-(n-1)/2)*115);return!b.units.some(u=>u.side===0&&!u.dead&&u.hp>0&&xs.some(x=>Math.abs(u.x-x)<280)&&Math.abs(u.y-p.y)<300);});
 if(!at)return false;
 const ids=new Set(b.units.map(u=>u.id)),result=execute(app,{...action,x:at.x,y:at.y,support:at.surfaceId,spacing:115,maxDistance:220});if(result===false)return false;
 for(const u of b.units)if(u.side===1&&!ids.has(u.id)){
  // The explicit Act2 wave elite assignment follows this factory call.
  if(u.elite){u.combatBaseHp/=1.25;u.hp=u.maxHp=Math.round(u.combatBaseHp*C.DIFFICULTIES[b.difficulty].hp);u.honroXpWeight/=1.25;}u.elite=false;u.armor=.04;u.honroTempleEntry=at.side;
 }
 mem.entries[action.source]={side:at.side,x:at.x,y:at.y,round:b.round,serial:b.honroState.actorTurnSerial||0};return result;
};
const tick=A.tick;A.tick=function(app,dt){if(active(app.engine?.b))warn(app);return tick(app,dt);};
G.HonroStage16Temple={active,memory,entryFor};
})(globalThis);
