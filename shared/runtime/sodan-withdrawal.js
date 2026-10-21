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
function drawParty(app,node){const cv=node.querySelector('canvas'),c=cv?.getContext('2d');if(!c||!app.scene?.human)return;const units=app.engine.b.units.filter(u=>alive(u)&&(u.side===0&&!u.summoned||u.id==='boss'));cv.width=520;cv.height=210;c.clearRect(0,0,520,210);units.forEach((u,i)=>{c.save();c.translate(260+(i-(units.length-1)/2)*105,166);const actor={...u,x:0,y:0,boss:false,side:0,hurt:0,facing:1,portraitOnly:true,moving:.7,h:108};app.scene.human(c,actor,G.HONRO_CONTENT.hero[u.cls],false,3,0);c.restore();c.fillStyle='#ded2b5';c.font='15px serif';c.textAlign='center';c.fillText(u.name,260+(i-(units.length-1)/2)*105,199);});}
function safeBackdrop(app){if(!active(app.engine?.b)||!complete(app.engine.b)&&app.engine.b.phase!=='won')return;let node=document.getElementById('sodan-safe-backdrop');if(!node){node=document.createElement('div');node.id='sodan-safe-backdrop';node.className='sodan-safe-backdrop';node.innerHTML='<span>윗마당 밖 · 안전한 퇴로</span><canvas aria-label="철수한 소단과 일행"></canvas>';app.root.appendChild(node);drawParty(app,node);}}
function frame(app,dt){const b=app.engine?.b,s=b&&active(b)&&memory(b);if(!s||s.phase!=='withdrawing')return false;
 let node=document.getElementById('sodan-withdrawal');if(!node){node=document.createElement('section');node.id='sodan-withdrawal';node.className='sodan-withdrawal';node.setAttribute('role','status');node.innerHTML='<p>퇴로 확보 · 일행 철수</p><canvas class="withdrawal-party" aria-label="소단과 일행이 함께 철수"></canvas><small>소단과 일행이 함께 마당을 벗어납니다</small>';app.root.appendChild(node);drawParty(app,node);}
 if(document.hidden)return true;s.elapsed=Math.min(1.1,(s.elapsed||0)+dt);if(s.elapsed<1.1)return true;
 // Only presentation time advances after extraction. The live battle, survivors,
 // remaining enemies and their HP are preserved in the terminal snapshot.
 s.phase='safe';node.remove();safeBackdrop(app);save(app);app.checkMission(app.engine);app.outcome();return true;
}
G.HonroSodanWithdrawal={active,ready,exit,tick,frame,complete,outro,safeBackdrop};
})(globalThis);
