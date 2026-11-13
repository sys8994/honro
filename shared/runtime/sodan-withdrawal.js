(function(G){'use strict';
const alive=u=>u&&!u.dead&&u.hp>0;
function active(b){return b?.honroStage===10&&!b.honroCustom;}
function ready(b){return active(b)&&!!b.honroState?.sodanCoop&&(b.honroState.coopHold||0)>=6;}
const partyIds=['p-archer','p-mage','p-knight','boss'];
function exit(b){const p=b.honroMapAnchors?.exit||(b.honroMarkers||[]).find(m=>m.type==='exit')||{x:b.width-140};return {id:'sodan-safe-exit',kind:'exit',x:p.x,y:G.HonroWorld.top(b,p.x,p.y,p.support),support:p.support,label:'동쪽 외문'};}
function gate(b,goal=exit(b)){const x=goal.x-125;return{x,y:G.HonroWorld.top(b,x,goal.y,goal.support)};}
function present(u,b,goal,door){return alive(u)&&u.x>=door.x+Math.max(12,u.r*.5)&&u.x<=b.width-20&&!u.airborne&&!u.jumping&&Math.abs(u.vy)<3&&Math.abs(u.y-G.HonroWorld.top(b,u.x,goal.y,goal.support))<10;}
function progress(b,goal=exit(b)){const door=gate(b,goal);return partyIds.filter(id=>present(b.units.find(u=>u.id===id),b,goal,door)).length;}
function failure(b){return ready(b)&&!['withdrawing','safe'].includes(memory(b)?.phase)&&partyIds.some(id=>!alive(b.units.find(u=>u.id===id)))?'동쪽 외문으로 피하기 전에 동행을 잃었다.':null;}
const escapeLines=[
 ['소단','됐어요! 매듭은 다 풀었어요. 이제 저도 움직일 수 있어요.'],
 ['휘겸','동쪽 외문으로 갑시다. 소단, 우리 뒤에 붙으시오. 네 사람 다 건너오면 내가 문을 닫겠소.']
].map(([who,text],i)=>[who,text,{kind:'character',storyId:'stage10-east-gate-retreat',rowId:'stage10-east-gate-retreat:'+i,storyTitle:'동쪽 외문으로'}]);
function memory(b){return b.honroState?.sodanWithdrawal;}
function save(app){if(!app.persist)return;app.profile.honroBattle=JSON.parse(JSON.stringify(app.engine.b));app.persist();}
function tick(app,dt=0){const e=app.engine,b=e.b;if(!ready(b)||['won','lost'].includes(b.phase))return;
 const sodan=e.unit('boss');if(!alive(sodan)||failure(b))return;
 const s=b.honroState.sodanWithdrawal??={phase:'escape',elapsed:0};
 if(s.phase==='escape')s.version=2;
 if(s.phase!=='escape'||b.side!==0||b.phase!=='aim'||app.dialogue||b.projectiles.length||e.settleBusy())return;
 const goal=exit(b);
 if(!s.announced){
  s.announced=true;s.version=2;
  app.event('의식 완료 · 동쪽 외문으로 동행 4명 대피');
  if(G.HonroStory?.start(app,escapeLines,{id:'stage10-east-gate-retreat',title:'동쪽 외문으로'}))return;
  save(app);
 }
 // The three heroes use their normal turns. Sodan follows on the continuous
 // lower road with the ordinary body sweep; she never takes a player slot.
 sodan.fixed=false;delete sodan.aiMove;delete sodan.moveTarget;
 const end=Math.min(goal.x+68,b.width-35);
 if(sodan.x<end-2&&dt>0){
  sodan.walkSpeed=310;
  sodan.moveLeft=Math.max(4,sodan.moveLeft||0);
  e.walk(sodan,Math.min(1,(end-sodan.x)/(sodan.walkSpeed*dt)),dt,true);
 }
 const arrived=progress(b,goal);
 if(s.arrived!==arrived){s.arrived=arrived;app.dirty=true;}
 if(arrived<4)return;
 s.phase='withdrawing';s.party=partyIds.map(id=>e.unit(id).name);s.elapsed=0;app.cancelInput();save(app);
}
function complete(b){return !!memory(b)&&memory(b).phase==='safe';}
// Presentation only: the completed chapter's ordinary world-map conversation.
// Derive this from the live dialogue so finish/skip/reload never leave a flag behind.
function worldOutroDialogue(app){const b=app?.engine?.b,d=app?.dialogue;return !!(active(b)&&b.phase==='won'&&memory(b)?.worldOutro===2&&app.screen==='battle'&&d?.after==='outcome'&&d.lines?.[d.index]?.[2]?.camera?.id==='10:safe-exit');}
function outro(b,lines){if(!active(b)||b.phase!=='won')return lines;
 if(memory(b)?.version===2){
  const atGate=[
   ['소단',/이제.*(?:놔도|놓아도).*돼요/, '문은…… 닫혔어요?'],
   ['담허',/^(?:그래, 묶여 있던 혼은|천천히 펴보게)/, '닫혔네. 혼은 양옆 진이 받아 갔고. 아까 그 나무가 살아 있는 진목 노릇을 한 게야. 이제 손가락에 힘 빼고 천천히 펴 보게.'],
   ['휘겸',/^뒤(?:쫓아 오는|따르는) 기척은/, '빗장을 걸었소. 내가 문 곁에 있을 테니 앉아서 숨부터 돌리시오.'],
   ['휘겸',/^(?:동쪽 외문이오\.|새 무리는 동쪽 외문을 넘어왔소)/, '이 문으로 넘어왔소. 짐승들 발목에 북쪽 산길의 붉은 진흙이 묻어 있었소.']
  ];
  lines=lines.map(row=>{const entry=atGate.find(([who,pattern])=>who===row[0]&&pattern.test(row[1]));return entry?[row[0],entry[2],{...row[2],sodanGateLine:true}]:row;});
 }
 if(b.honroNarrativeRevision!==1)return lines;
 // In-flight campaigns own a frozen narrative snapshot. Project only the five
 // approved old phrases into the safe outro; keep its cursor, metadata and all
 // other saved lines. Canonical/new phrases pass through unchanged.
 if(G.HonroNarrativeCatalogue.active(b))return lines;
 const projection=G.HONRO_NARRATIVE_COMPAT.safeOutroProjection;
 return lines.map(row=>{const match=projection.find(p=>p.from===row[1]&&p.who===row[0]);return match?[row[0],match.to,...row.slice(2)]:row;});
}
// Extraction ends on the existing east exit surface. Only the survivors move;
// enemies, HP, resources and the six-turn mission remain the terminal battle.
// The stamp makes old saved outros and repeated outcome calls idempotent.
function prepareWorldOutro(app){const b=app.engine?.b;if(!active(b)||!complete(b)&&b.phase!=='won')return;
 const s=b.honroState.sodanWithdrawal??={phase:'safe'};if(s.worldOutro===2)return;
 if(s.version===2){const goal=exit(b),door=gate(b,goal);
  for(const u of b.units.filter(u=>partyIds.includes(u.id)&&present(u,b,goal,door)))Object.assign(u,{vx:0,vy:0,airborne:false,jumping:false,facing:u.id==='boss'?-1:1});
  s.worldOutro=2;return;
 }
 // Old snapshots may have committed the one-person extraction already.
 const goal=exit(b),support=goal.support,units=b.units.filter(u=>alive(u)&&(u.side===0&&!u.summoned||u.id==='boss'));
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
function drawGate(c,b){
 if(!active(b))return;
 const s=memory(b),{x,y}=gate(b),closed=s?.version===2?(s.phase==='safe'?1:s.phase==='withdrawing'?Math.min(1,(s.elapsed||0)/.72):0):0;
 c.save();c.translate(x,y);c.lineJoin='round';
 const panel=(fill,stroke,points)=>{c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=2;c.stroke();};
 panel('#454940','#282e2b',[[-60,-3],[-39,-12],[40,-12],[62,-2],[58,5],[-54,4]]);
 for(const i of [-1,1]){
  const a=46*i,w=i*9;
  panel('#514537','#252c29',[[a-w,0],[a+w,0],[a+w,-104],[a-w,-104]]);
  panel('#6d6651','#353a30',[[a-w-3,-8],[a+w+3,-8],[a+w+3,1],[a-w-3,1]]);
  const span=7+39*closed;
  panel('#3e3d34','#212a29',[[a,-7],[a-i*span,-7],[a-i*span,-94],[a,-94]]);
  for(let j=8;j<span-2;j+=7){c.fillStyle='#6e5d48';c.fillRect(a-i*j,-92,1,83);}
 }
 panel('#2e3735','#222a27',[[-70,-100],[-52,-114],[-32,-126],[31,-126],[51,-115],[70,-100],[54,-103],[-55,-103]]);
 c.strokeStyle='#747d67';c.lineWidth=2;c.beginPath();c.moveTo(-56,-109);c.quadraticCurveTo(-32,-117,-25,-126);c.lineTo(27,-126);c.quadraticCurveTo(34,-117,56,-109);c.stroke();
 if(closed>.97){c.fillStyle='#75604b';c.fillRect(-35,-61,70,6);c.fillStyle='#a29470';c.fillRect(-4,-62,8,8);}
 c.restore();
}
function frame(app,dt){const b=app.engine?.b,s=b&&active(b)&&memory(b);if(!s||s.phase!=='withdrawing')return false;
 let node=document.getElementById('sodan-withdrawal');if(!node){node=document.createElement('section');node.id='sodan-withdrawal';node.className='sodan-withdrawal';node.setAttribute('role','status');node.textContent=s.version===2?'네 사람 대피 완료 · 동쪽 외문을 닫는다':'퇴로 확보 · 일행 철수';app.root.appendChild(node);}
 app.acc=0;app.scene?.render?.(app.engine,0,app.selected,app.power,false,0,true);
 if(document.hidden)return true;s.elapsed=Math.min(1.1,(s.elapsed||0)+dt);if(s.elapsed<1.1)return true;
 // Only presentation time advances after extraction. The live battle, survivors,
 // remaining enemies and their HP are preserved in the terminal snapshot.
 s.phase='safe';node.remove();app.checkMission(app.engine);prepareWorldOutro(app);save(app);app.outcome();return true;
}
G.HonroSodanWithdrawal={active,ready,exit,gate,progress,failure,drawGate,tick,frame,complete,outro,prepareWorldOutro,worldOutroDialogue};
})(globalThis);
