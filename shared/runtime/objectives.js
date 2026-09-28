(function(G){'use strict';
function state(b,st){
 if(b.honroCustom)return G.HonroAuthored.objectiveState(b);
 const hs=b.honroState||{},markers=b.honroMarkers||[],heroes=b.units.filter(u=>u.side===0&&!u.summoned&&!u.dead&&u.hp>0),obj=b.units.find(u=>u.id==='objective'),boss=b.units.find(u=>u.id==='boss'),seals=b.terrain.filter(t=>t.honroSeal),left=seals.filter(t=>!t.broken),foes=b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0),pending=G.HonroEncounters.pending(b);const all=[];const add=(kind,id,x,y,label,extra={})=>{const t={kind,id,x,y,label,...extra};all.push(t);return t;};
 seals.forEach((t,i)=>add('seal',t.id,t.x+t.w/2,t.y,st.id===5?'절벽 고리쇠 · 설오의 화살로 파괴':st.id===8?`상여 결박 ${i+1} · 공격`:`매듭 ${i+1} · 공격`,{done:!!t.broken,box:t}));
 if(obj&&!obj.dead)add('objective',obj.id,obj.x,obj.y-obj.h,st.objective==='rescue'&&!hs.rescued?'부상자 운반대 · 가까이 이동':`${obj.name} · 보호`,{unitId:obj.id});
 if(boss&&!boss.dead)add('boss',boss.id,boss.x,boss.y-boss.h,st.id===10?'소단의 주박 · 비살상 제압':'빈 상여 · 제압',{unitId:boss.id});for(const u of b.units.filter(u=>u.honroMidboss&&!u.dead&&u.id!=='boss'))add('midboss',u.id,u.x,u.y-u.h,`${u.name} · 중간 우두머리`,{unitId:u.id});
 for(const m of markers){if(m.collected)continue;if(m.type==='ledger')add('interact',m.id,m.x,m.y,'홍만의 장부 · 상호작용');if(m.type==='receiver')add('interact',m.id,m.x,m.y,`${m.label} · ${m.action==='ritual'?'담허로 E · 의식 유지':'E · 받이진 설치'}`);if(m.type==='resident')add('interact',m.id,m.x,m.y,`${m.label} · 구조`);}
 // The saved/live map owns the exit. Content dimensions can belong to an older map.
 const exit=markers.find(m=>m.type==='exit'),exitX=(st.objective==='overwatch'?b.honroEscortGoalX:undefined)??exit?.x??b.honroMapAnchors?.exit?.x??b.width-(st.objective==='overwatch'?290:st.objective==='rescue'?130:180);
 if(['arrival','rescue','overwatch'].includes(st.objective))add('exit',exit?.id||'mission-exit',exitX,exit?.y??G.HonroWorld.top(b,exitX,obj?.y),st.objective==='overwatch'?'상여 도착 지점':'도착 지점');
 let complete=false,summary=st.goal,kinds=[];
 switch(st.objective){
  case'arrival':complete=heroes.some(u=>u.x>=exitX-120);summary='연목 나루 방향 · 고개 끝까지 이동';kinds=['exit'];break;
  case'overwatch':complete=!!obj&&obj.x>=exitX&&!foes.length&&!pending;summary=`상여 엄호 · 적 ${foes.length}명${pending?' / 뒤따르는 기척 있음':''}`;kinds=['objective','exit'];break;
  case'ledger':complete=!!hs.ledger;summary=hs.ledger?'홍만의 장부 확보 · 남은 위협 정리':b.units.some(u=>u.honroMidboss&&!u.dead)?'침수된 나루장승을 제압하고 장부를 찾기':'나루 움막의 장부를 찾기';kinds=hs.ledger?[]:['interact','midboss'];if(hs.ledger&&foes.length)complete=false;break;
  case'defend':complete=!pending&&(!foes.length||b.round>(st.holdRounds||6));summary=`피란민 통로 보호 · ${Math.min(st.holdRounds||6,b.round-1)}/${st.holdRounds||6}턴${pending?' · 뒤따르는 적 있음':''}`;kinds=['objective'];break;
  case'seals':complete=!left.length;summary=left.length?(st.id===5?(hs.ritual?.active?'물틈이 열렸다 · 설오로 고리쇠 사격':'담허를 받이진에 세우고 E · 의식 유지'):'받이진을 지키며 절벽 틈 고리쇠 파괴'):'고리쇠 파괴 완료 · 남은 위협 정리';kinds=left.length?(st.id===5&&!hs.ritual?.active?['interact']:['seal']):[];if(!left.length&&foes.length)complete=false;break;
  case'rescue':{const mid=b.units.find(u=>u.honroMidboss&&!u.dead);complete=!!hs.rescued&&!!obj&&obj.x>exitX-140&&!mid;summary=mid?'부러진 교각귀를 제압해 호송로 확보':hs.rescued?'부상자 운반대를 쉼터까지 호송':'부상자 운반대에 접근';kinds=mid?['midboss']:hs.rescued?['objective','exit']:['objective'];break;}
  case'rescue3':complete=(hs.rescuedCount||0)>=3&&!foes.length&&!pending;summary=`들린 주민 구조 · ${hs.rescuedCount||0}/3${foes.length?' · 주변 위협 '+foes.length+'명':''}`;kinds=(hs.rescuedCount||0)<3?['interact']:[];break;
  case'bierboss':complete=!left.length&&!!boss?.dead&&!foes.filter(u=>u.id!=='boss').length&&!pending;summary=left.length?`빈 상여의 결박부터 파괴 · ${seals.length-left.length}/${seals.length}`:boss&&!boss.dead?'빈 상여 본체 제압':'남은 들린 것 정리';kinds=left.length?['seal']:boss&&!boss.dead?['boss']:[];break;
  case'prepare':complete=(hs.receivers||0)>=2&&!foes.length&&!pending;summary=`주민 대피 후 받이진 준비 · ${hs.receivers||0}/2${foes.length?' · 위협 '+foes.length+'명':''}`;kinds=(hs.receivers||0)<2?['interact']:[];break;
  case'sodan':complete=!!hs.sodanCoop&&(hs.coopHold||0)>=2&&!foes.length&&!pending;summary=!hs.sodanCoop?'소단의 주박을 비살상으로 낮추고 두 받이진 활성화':`소단과 공동 방어 · 안정 ${hs.coopHold||0}/2 · 적 ${foes.length}명`;kinds=!hs.sodanCoop?['boss','interact']:[];break;
  default:complete=!foes.length;
 }
 const authored=G.HonroAuthored?.objectiveState(b);
 if(authored?.allTargets.length){complete=complete&&authored.complete;summary+=' · '+authored.summary;}
 return{complete,summary,targets:[...all.filter(t=>kinds.includes(t.kind)&&!t.done),...(authored?.targets||[])],allTargets:[...all,...(authored?.allTargets||[])]};
}
const briefings={
 1:[],
 2:[['설오','행렬이 저 아래 길을 통과할 때까지 높은 놈부터 끊겠습니다.',{focus:'objective'}]],
 3:[['담허','장부는 움막 안에 있겠지. 먼저 길에 붙은 것부터 떼어내세.']],
 4:[['휘겸','피란민이 빠질 때까지만 길을 지켜주시오.']],
 5:[['설오','받이진을 세우면 고리쇠는 내가 쏘겠습니다.',{focus:'seal'}]],
 6:[['휘겸','운반대는 내가 붙들겠소. 앞길을 열어주시오.',{focus:'objective'}]],
 7:[['담허','사람은 치지 말게. 이름이 적힌 주민 곁에서 E로 구조하면 되네.']],
 8:[['담허','상여 자체보다 안에 든 것을 받을 곳이 필요하네. 결박부터 끊세.',{focus:'seal'}]],
 9:[['휘겸','아래 사람은 내가 내보내겠소. 두 받이진만 준비합시다.']],
 10:[['담허','소단의 몸은 치지 말게. 주박만 낮추고 받을 자리를 열어야 하네.',{focus:'boss'}]]
};
function lines(app){const fallback=app.engine.heroesAlive()[0]?.name||'설오';return(briefings[app.stage.id]||[]).map(([who,text,meta])=>[app.canSpeak(who)?who:fallback,text,meta]);}
function entry(app){const n=(app.stage.narration||[]).slice(0,3).map((text,i)=>['서술',text,{kind:'narration',art:app.stage.narrationArt,paragraph:i+1,paragraphs:app.stage.narration.length}]);return[...n,...(app.stage.story||[]),...lines(app)];}
function focus(app,kind){const s=state(app.engine.b,app.stage);return s.targets.find(t=>t.kind===kind)||s.allTargets.find(t=>t.kind===kind&&!t.done)||s.allTargets.find(t=>t.kind===kind);}
function refresh(app){if(!app.engine||app.training)return;const s=state(app.engine.b,app.stage);app.scene.missionTargets=s.targets;const el=document.getElementById('objective-text');if(el)el.textContent=s.summary;}
function draw(scene,e){const targets=scene.goalFocus?[scene.goalFocus]:scene.missionTargets;if(!targets?.length)return;const c=scene.ctx,{w,h,d}=scene.size(),z=scene.scale,cv=scene.canvas.getBoundingClientRect(),hud=document.querySelector('.honro-compact-hud')?.getBoundingClientRect();const top=110,bottom=Math.max(top+30,Math.min(h-24,(hud?.top??h)-cv.top-26)),mini=document.getElementById('minimap')?.getBoundingClientRect();c.save();c.setTransform(d,0,0,d,0,0);c.font='600 12px sans-serif';c.textAlign='center';c.textBaseline='middle';let outside=0;scene.missionDrawn=[];for(const t of targets){const x=w/2+(t.x-scene.x)*z,y=h/2+(t.y-scene.y)*z,visible=x>30&&x<w-30&&y>top&&y<bottom;if(!visible&&outside++>0)continue;let px=Math.max(70,Math.min(w-70,x)),py=Math.max(top,Math.min(bottom,y-26));const label=(visible?'':'목표 · ')+t.label.split(' · ')[0],width=Math.min(w-24,c.measureText(label).width+16);if(mini&&px+width/2>mini.left-cv.left&&py-33<mini.bottom-cv.top&&py+5>mini.top-cv.top){if(mini.bottom-cv.top+40<bottom)py=mini.bottom-cv.top+40;else px=Math.max(width/2+8,mini.left-cv.left-width/2-10);}c.fillStyle='#e5c57e';c.beginPath();c.moveTo(px-7,py-8);c.lineTo(px+7,py-8);c.lineTo(px,py+3);c.closePath();c.fill();const lx=Math.max(width/2+6,Math.min(w-width/2-6,px));c.fillStyle='#10242aee';c.fillRect(lx-width/2,py-33,width,20);c.fillStyle='#ecd398';c.fillText(label,lx,py-23,width-8);}c.restore();}
function minimap(app,c,sx,sy){if(app.training)return;const s=state(app.engine.b,app.stage);c.save();c.strokeStyle='#ffe0a0';for(const t of s.targets)c.strokeRect(t.x*sx-3,t.y*sy-3,6,6);c.restore();}
G.HonroObjectives={state,lines,entry,focus,refresh,draw,minimap,briefings};
})(globalThis);
