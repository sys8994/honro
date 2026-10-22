(function(G){'use strict';
const alive=u=>u&&!u.dead&&u.hp>0;
function active(b){return b?.honroStage===10&&!b.honroCustom;}
function ready(b){return active(b)&&!!b.honroState?.sodanCoop&&(b.honroState.coopHold||0)>=6;}
function exit(b){const p=b.honroMapAnchors?.exit||(b.honroMarkers||[]).find(m=>m.type==='exit')||{x:b.width-140};return {id:'sodan-safe-exit',kind:'exit',x:p.x,y:G.HonroWorld.top(b,p.x,p.y,p.support),label:'동쪽 안전 출구 · 한 명이 도착하면 함께 철수'};}
function memory(b){return b.honroState.sodanWithdrawal;}
function save(app){if(!app.persist)return;app.profile.honroBattle=JSON.parse(JSON.stringify(app.engine.b));app.persist();}
function tick(app){const e=app.engine,b=e.b;if(!ready(b)||['won','lost'].includes(b.phase))return;
 const sodan=e.unit('boss');if(!alive(sodan))return;
 let s=memory(b);if(!s){s=b.honroState.sodanWithdrawal={phase:'escape',elapsed:0};app.event('의식 완료 · 소단을 지키며 동쪽 안전 출구로 이동');save(app);}
 if(s.phase==='escape'&&app.sodanExitBattle!==b){app.sodanExitBattle=b;app.scene?.storyFocusPoint?.(exit(b).x,exit(b).y,450,.65);if(app.scene?.storyTween)app.scene.storyTween.manual=true;}
 // The receiving arrays still need protection until a real escape route is secured.
 // No repeated escort orders: one survivor scouts the exit, then everyone withdraws.
 if(s.phase!=='escape'||b.side!==0||b.phase!=='aim'||b.projectiles.length||e.settleBusy())return;
 const goal=exit(b),scout=e.heroesAlive().find(u=>alive(u)&&!u.summoned&&Math.abs(u.x-goal.x)<=115&&Math.abs(u.y-goal.y)<=110&&e.grounded(u));
 if(!scout)return;s.phase='withdrawing';s.scout=scout.id;s.party=[...e.heroesAlive().map(u=>u.name),sodan.name];s.elapsed=0;app.cancelInput();save(app);
}
function complete(b){return !!memory(b)&&memory(b).phase==='safe';}
// Presentation only: the completed chapter's ordinary world-map conversation.
// Derive this from the live dialogue so finish/skip/reload never leave a flag behind.
function worldOutroDialogue(app){const b=app?.engine?.b,d=app?.dialogue;return !!(active(b)&&b.phase==='won'&&memory(b)?.worldOutro===2&&app.screen==='battle'&&d?.after==='outcome'&&d.lines?.[d.index]?.[2]?.camera?.id==='10:safe-exit');}
function outro(b,lines){if(!active(b)||b.honroNarrativeRevision!==1||b.phase!=='won')return lines;
 // In-flight campaigns own a frozen narrative snapshot. Project only the five
 // approved old phrases into the safe outro; keep its cursor, metadata and all
 // other saved lines. Canonical/new phrases pass through unchanged.
 const prior=[
 [0,'(방울을 내려놓으려다 다시 쥔다) …정말 놔도 돼요?'],
 [1,'손가락 하나부터 펴보게. 그래. 자네가 놓은 원혼은 양옆 받이진으로 들어가고 있네.'],
 [4,'매듭을 풀 시간은 벌었소. 남은 것들은 경계하며 돌아갈 길을 살피겠소.'],
 [9,'새 무리는 동쪽 외문을 넘어왔소. 산길의 진흙이 여기까지 이어져 있소.'],
 [15,'소단이 손을 폈다. 일행이 기다리는 동안 잠시 숨을 고른 뒤, 방울을 챙겨 곁으로 다가왔다.']];
 const current=G.HONRO_CONTENT.stages[9].outro;
 return lines.map(row=>{const match=prior.find(([i,text])=>text===row[1]&&current[i]?.[0]===row[0]);return match?[row[0],current[match[0]][1],...row.slice(2)]:row;});
}
// Extraction ends on the existing east exit surface. Only the survivors move;
// enemies, HP, resources and the six-turn mission remain the terminal battle.
// The stamp makes old saved outros and repeated outcome calls idempotent.
function prepareWorldOutro(app){const b=app.engine?.b;if(!active(b)||!complete(b)&&b.phase!=='won')return;
 const s=b.honroState.sodanWithdrawal??={phase:'safe'};if(s.worldOutro===2)return;
 const goal=exit(b),support=b.honroMapAnchors?.exit?.support,units=b.units.filter(u=>alive(u)&&(u.side===0&&!u.summoned||u.id==='boss'));
 const ground=x=>G.HonroMapEngine.surfaceY(b.honroWorldTerrain?.length?b.honroWorldTerrain:b.terrain,x,goal.y,support)?.y;
 const layout=start=>units.map((u,i)=>{const x=start+i*110;return{x,y:ground(x)};});
 let points=layout(goal.x-390).map(p=>({...p,y:p.y??G.HonroWorld.top(b,p.x,goal.y,support)}));const foes=b.units.filter(u=>alive(u)&&u.side===1);
 if(points.some(p=>foes.some(u=>Math.hypot(u.x-p.x,u.y-p.y)<650))){
  // The v6 map already continues beyond Play Bounds. When pursued to the gate,
  // use that real east surface, outside enemy movement bounds, not a new set.
  const east=layout(Math.max(b.width,goal.x)+900);if(east.every(p=>Number.isFinite(p.y)))points=east;
 }
 units.forEach((u,i)=>Object.assign(u,points[i],{vx:0,vy:0,airborne:false,jumping:false,facing:i<2?1:-1}));
 s.worldOutro=2;
}
function frame(app,dt){const b=app.engine?.b,s=b&&active(b)&&memory(b);if(!s||s.phase!=='withdrawing')return false;
 let node=document.getElementById('sodan-withdrawal');if(!node){node=document.createElement('section');node.id='sodan-withdrawal';node.className='sodan-withdrawal';node.setAttribute('role','status');node.textContent='퇴로 확보 · 일행 철수';app.root.appendChild(node);}
 app.acc=0;app.scene?.render?.(app.engine,0,app.selected,app.power,false,0,true);
 if(document.hidden)return true;s.elapsed=Math.min(1.1,(s.elapsed||0)+dt);if(s.elapsed<1.1)return true;
 // Only presentation time advances after extraction. The live battle, survivors,
 // remaining enemies and their HP are preserved in the terminal snapshot.
 s.phase='safe';node.remove();app.checkMission(app.engine);prepareWorldOutro(app);save(app);app.outcome();return true;
}
G.HonroSodanWithdrawal={active,ready,exit,tick,frame,complete,outro,prepareWorldOutro,worldOutroDialogue};
})(globalThis);
