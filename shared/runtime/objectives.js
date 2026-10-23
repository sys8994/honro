(function(G){'use strict';
const durability=t=>Number.isFinite(t?.hp)?Math.max(0,Math.ceil(t.hp))+(Number.isFinite(t.maxHp)&&t.maxHp>0?'/'+Math.ceil(t.maxHp):''):'';
// Rescue follows its referenced person in this battle, never its old authoring
// point. Keep the original marker for collection/progress writes and saved maps.
function interactionTarget(b,m){
 if(G.HonroAct3?.active(b)&&m?.action==='act3')return G.HonroAct3.interactionTarget(b,m);
 if(m?.action!=='rescue')return m;
 if(m.collected||!b?.honroMarkers?.includes(m))return null;
 const u=b.units?.find(u=>u.id===m.target);
 return u&&!u.dead&&u.hp>0&&!u.honroResolved&&Number.isFinite(u.x)&&Number.isFinite(u.y)?u:null;
}
function rawState(b,st){
 if(b.honroCustom)return G.HonroAuthored.objectiveState(b);
 if(G.HonroAct2?.active(b))return G.HonroAct2.state(b);
 if(G.HonroAct3?.active(b))return G.HonroAct3.state(b);
 const hs=b.honroState||{},markers=b.honroMarkers||[],heroes=b.units.filter(u=>u.side===0&&!u.summoned&&!u.dead&&u.hp>0),obj=b.units.find(u=>u.id==='objective'),boss=b.units.find(u=>u.id==='boss'),seals=G.HonroQuestTargets.records(b).filter(t=>t.honroSeal),left=seals.filter(t=>!t.broken),foes=b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget&&u.summonKind!=='eater'&&!u.dead&&u.hp>0),pending=G.HonroEncounters.pending(b);const all=[];const add=(kind,id,x,y,label,extra={})=>{const t={kind,id,x,y,label,...extra};all.push(t);return t;};
 seals.forEach((t,i)=>add('seal',t.id,t.x+t.w/2,t.y,st.id===5?'절벽 고리쇠 · '+durability(t):st.id===8?`상여 결박 ${i+1} · 공격`:`매듭 ${i+1} · 공격`,{done:!!t.broken,box:t}));
 if(obj&&!obj.dead)add('objective',obj.id,obj.x,obj.y-obj.h,st.objective==='rescue'&&!hs.rescued?'부상자 운반대 · 가까이 이동':`${obj.name} · 보호`,{unitId:obj.id});
 const binding=b.honroNarrativeRevision===1&&st.id===10&&G.HonroQuestTargets.records(b).find(t=>t.id==='sodan-binding');if(binding&&!hs.sodanCoop)add('binding',binding.id,binding.x+binding.w/2,binding.y,'바깥 주박 · '+durability(binding),{done:!!binding.broken,box:binding});
 if(boss&&!boss.dead&&(!binding||hs.sodanCoop))add('boss',boss.id,boss.x,boss.y-boss.h,st.id===10?(hs.sodanCoop?'소단 · 혼매듭 의식 보호':'소단의 주박 · 비살상 제압'):'빈 상여 · 제압',{unitId:boss.id});for(const u of b.units.filter(u=>u.honroMidboss&&!u.dead&&u.id!=='boss'))add('midboss',u.id,u.x,u.y-u.h,`${u.name} · 중간 우두머리`,{unitId:u.id});
 for(const m of markers){if(m.collected)continue;if(m.type==='ledger')add('interact',m.id,m.x,m.y,'홍만의 장부 · 상호작용');if(m.type==='receiver')add('interact',m.id,m.x,m.y,`${m.label} · ${m.action==='ritual'?(hs.ritual?.active?'의식 유지 중 · 이탈 시 해제':'담허로 의식 시작'):'받이진 설치'}`);if(m.type==='resident'){const target=interactionTarget(b,m);if(target)add('interact',m.id,target.x,target.y-(target===m?0:target.h||0),`${m.label} · 구조`,target===m?{}:{unitId:target.id});}}
 // The saved/live map owns the exit. Content dimensions can belong to an older map.
 const exit=markers.find(m=>m.type==='exit'),exitX=(st.objective==='overwatch'?b.honroEscortGoalX:undefined)??exit?.x??b.honroMapAnchors?.exit?.x??b.width-(st.objective==='overwatch'?290:st.objective==='rescue'?130:180);
 if(['arrival','rescue','overwatch'].includes(st.objective))add('exit',exit?.id||'mission-exit',exitX,exit?.y??G.HonroWorld.top(b,exitX,obj?.y),st.objective==='overwatch'?'상여 도착 지점':'도착 지점');
 let complete=false,summary=st.goal,kinds=[];
 switch(st.objective){
  case'arrival':complete=heroes.some(u=>u.x>=exitX-120);summary='연목 나루 방향 · 고개 끝까지 이동';kinds=['exit'];break;
  case'overwatch':complete=!!obj&&obj.x>=exitX;summary=`상여 엄호 · 적 ${foes.length}명${pending?' / 뒤따르는 기척 있음':''}`;kinds=['objective','exit'];break;
  case'ledger':complete=!!hs.ledger;summary=hs.ledger?'홍만의 장부 확보 · 철수 준비':b.units.some(u=>u.honroMidboss&&!u.dead)?'나루장승을 경계하며 움막의 장부 찾기':'나루 움막의 장부를 찾기';kinds=hs.ledger?[]:['interact','midboss'];break;
  case'defend':{const rounds=Math.max(1,(st.holdRounds||6)-1);complete=b.round>=rounds+1;summary=`피란민 통로 보호 · ${Math.min(rounds,b.round-1)}/${rounds}턴`;kinds=['objective'];break;}
  case'seals':complete=!left.length;summary=left.length?(st.id===5?(hs.ritual?.active?'물틈이 열렸다 · 고리쇠 내구도 '+durability(left[0])+' · 설오로 사격':'담허로 받이진에 접근 · 의식 한 번 시작'):'받이진을 지키며 절벽 틈 고리쇠 파괴'):'고리쇠 파괴 완료 · 물길 안정화';kinds=left.length?(st.id===5&&!hs.ritual?.active?['interact']:['seal']):[];break;
  case'rescue':{const mid=b.units.find(u=>u.honroMidboss&&!u.dead);complete=!!hs.rescued&&!!obj&&obj.x>exitX-140&&!mid;summary=mid?'부러진 교각귀를 제압해 호송로 확보':hs.rescued?'부상자 운반대를 쉼터까지 호송':'부상자 운반대에 접근';kinds=mid?['midboss']:hs.rescued?['objective','exit']:['objective'];break;}
  case'rescue3':complete=(hs.rescuedCount||0)>=3;summary=`들린 주민 구조 · ${hs.rescuedCount||0}/3${foes.length?' · 주변 위협 '+foes.length+'명':''}`;kinds=(hs.rescuedCount||0)<3?['interact']:[];break;
  case'bierboss':complete=!left.length&&!!boss?.dead;summary=left.length?`빈 상여의 결박부터 파괴 · ${seals.length-left.length}/${seals.length}`:boss&&!boss.dead?'빈 상여 본체 제압':'빈 상여 제압 완료 · 원혼 수습';kinds=left.length?['seal']:boss&&!boss.dead?['boss']:[];break;
  case'prepare':complete=(hs.receivers||0)>=2;summary=`주민 대피 후 받이진 준비 · ${hs.receivers||0}/2${foes.length?' · 위협 '+foes.length+'명':''}`;kinds=(hs.receivers||0)<2?['interact']:[];break;
  case'sodan':complete=G.HonroSodanWithdrawal.complete(b);summary=!hs.sodanCoop?(binding?'바깥 주박을 약화하기':'소단의 주박을 비살상으로 낮추고 두 받이진 활성화'):`소단 보호 · 혼매듭 ${hs.coopHold||0}/6턴 · 적 ${foes.length}명`;kinds=!hs.sodanCoop?(binding?['binding']:['boss','interact']):['boss'];if(G.HonroSodanWithdrawal.ready(b)){add('exit','sodan-safe-exit',G.HonroSodanWithdrawal.exit(b).x,G.HonroSodanWithdrawal.exit(b).y,'동쪽 안전 출구 · 한 명 도착 후 함께 철수');summary=complete?'일행과 소단 철수 완료':'소단을 지키며 동쪽 출구 확보 · 한 명이 도착하면 함께 철수';kinds=['exit','boss'];}break;
  default:complete=!foes.length;
 }
 const objectiveReady=complete,minimumRound=1,settleRounds=({ledger:1,seals:1,rescue3:2,bierboss:b.honroNarrativeRevision===1?0:1,prepare:b.honroNarrativeRevision===1?0:2})[st.objective]||0;
 const readyRound=hs.objectiveReadyRound,stable=settleRounds===0||readyRound!==undefined&&b.round-readyRound>=settleRounds;
 complete=complete&&b.round>=minimumRound&&stable;
 if(objectiveReady&&settleRounds&&!stable)summary+=` · ${st.objective==='ledger'?'장부를 챙겨 철수':st.objective==='rescue3'?'구조한 주민 보호':'진과 주변 안정화'} ${Math.min(settleRounds,Math.max(0,b.round-(readyRound??b.round)))}/${settleRounds}턴`;
 const authored=G.HonroAuthored?.objectiveState(b);
 if(authored?.allTargets.length){complete=complete&&authored.complete;summary+=' · '+authored.summary;}
 const targets=all.filter(t=>kinds.includes(t.kind)&&!t.done);if(st.id===10&&G.HonroSodanWithdrawal.ready(b))targets.sort((a,c)=>Number(c.id==='sodan-safe-exit')-Number(a.id==='sodan-safe-exit'));
 return{complete,objectiveReady,minimumRound,settleRounds,summary,targets:[...targets,...(authored?.targets||[])],allTargets:[...all,...(authored?.allTargets||[])]};
}
function failure(b,st){
 if(!b||b.honroCustom||st?.id!==5)return null;
 const needsRitual=G.HonroQuestTargets.records(b).some(t=>t.id==='cliff-cleat'&&!t.broken)&&b.honroMarkers?.some(m=>m.action==='ritual');
 if(needsRitual&&!b.units.some(u=>u.side===0&&u.cls==='mage'&&!u.summoned&&!u.enthrall&&!u.dead&&u.hp>0))return G.HonroStage5Waterfall?.active(b)?'담허가 쓰러져 낙수를 비틀 수 없다. 이 장을 다시 시작하자.':'담허가 쓰러져 받이진을 이어갈 수 없다. 이 장을 다시 시작하자.';
 return null;
}
function state(b,st){const result=rawState(b,st),guided=G.HonroObjectiveGuide?.enhance(b,st,result)||result,crossing=G.HonroStakeCrossing?.current(b);if(crossing&&guided.currentObjectiveId===crossing.markerId)guided.currentInstruction=G.HonroStakeCrossing.instruction(b)||guided.currentInstruction;return guided;}
const briefings={
 1:[],
 2:[['설오','행렬이 저 아래 길을 통과할 때까지 높은 놈부터 끊겠습니다.',{focus:'objective'}]],
 3:[['담허','장부는 움막 안에 있겠지. 먼저 길에 붙은 것부터 떼어내세.']],
 4:[['휘겸','피란민이 나올 때마다 내가 문 앞에서 맞겠소. 그 길로 몰리는 놈들을 막아주시오.',{focus:'objective'}]],
 5:[],
 6:[['휘겸','운반대는 내가 붙들겠소. 앞길을 열어주시오.',{focus:'objective'}]],
 7:[['안내','주민 곁으로 이동한 뒤 구조하세요.',{kind:'guide'}]],
 8:[],
 9:[],
 10:[]
};
function lines(app){const fallback=app.engine.heroesAlive()[0]?.name||'설오';return(briefings[app.stage.id]||[]).map(([who,text,meta])=>[app.canSpeak(who)?who:fallback,text,meta]);}
const guides={1:'고개 끝의 도착 지점으로 이동하세요. 적을 모두 처치할 필요는 없습니다.',2:'상여가 도착 지점에 닿도록 앞길을 엄호하세요. 길에서 떨어진 적은 남아도 됩니다.',3:'장부 곁에서 장부를 확인하세요. 확보 후 한 턴 동안 일행을 지키며 철수합니다.',4:'피란민이 빠져나가는 여덟 턴 동안 문을 지키세요. 남은 적 수와 관계없이 대피가 끝나면 완료됩니다.',5:'담허로 받이진 안에서 의식을 한 번 시작하세요. 다음 턴부터는 그 자리에서 공격할 수 있습니다. 이동·도약으로 진을 벗어나면 물틈이 닫힙니다. 설오는 받이진 오른쪽의 돌선반으로 도약해 올라가 고리쇠를 겨누세요. 조준선의 첫 충돌점이 적이면 먼저 제압하고, 바위면 선반 위 위치나 각도를 조정하세요. 고리쇠는 여러 번 맞혀 내구도를 모두 깎아야 합니다. 부순 뒤 한 턴 동안 진을 안정시킵니다.',6:'운반대에 접근하고 교각귀를 제압한 뒤 도착 지점까지 호송하세요.',7:'주민 곁에서 구조하세요. 바닥으로 떨어졌다면 맨 왼쪽의 낮고 넓은 뿌리로 도약해 올라간 뒤 아랫가지로 한 번 더 도약하세요. 속빈 줄기에서는 왼쪽 끝을 벗어나지 말고 조금 안쪽에서 방향키를 놓고 제자리 도약하세요. 머리 위 비스듬한 뿌리에 내려앉은 뒤 오른쪽 위로 걸으면 윗사당에 닿습니다. 세 사람을 구출한 뒤 두 턴 동안 주민들을 지키며 대피를 돕습니다.',8:'결박을 끊고 빈 상여 본체를 제압하세요. 한 턴 동안 원혼을 수습하면 주변 적이 남아도 완료됩니다.',9:'두 받이진을 설치한 뒤 두 턴 동안 유지하세요. 진을 준비하고 생존하는 것이 목표입니다.',10:'두 받이진을 활성화하고 ‘소단의 주박’으로 표시된 대상을 공격하세요. 협력 전의 공격은 소단을 쓰러뜨리지 않고 주박을 약화시킵니다. 협력이 시작되면 소단을 향한 공격을 멈추세요. 소단은 혼매듭을 붙들어 이동·공격할 수 없습니다. 밀려드는 적을 막으며 최소 여섯 차례의 적 턴이 끝날 때까지 소단을 보호하세요. 여섯 턴 뒤에는 살아 있는 동행 한 명을 동쪽 안전 출구로 보내 퇴로를 확보하세요. 그동안 소단은 받이진을 지키며, 퇴로가 열리면 일행과 함께 철수합니다. 철수 전 소단이 쓰러지면 실패합니다.'};
// Saved historical/custom maps may intentionally lack the new recovery root.
function guideFor(app){if(G.HonroStage5Waterfall?.active(app.engine?.b))return G.HonroStage5Waterfall.guide;let text=guides[app.stage.id];if(app.engine?.b.honroNarrativeRevision===1&&app.stage.id===8)return '상여채를 붙든 결박을 끊고 빈 상여를 제압하세요. 주변 적은 남아도 됩니다.';if(app.engine?.b.honroNarrativeRevision===1&&app.stage.id===9)return '두 받이진을 설치해 소단이 붙든 힘을 나눠 받으세요.';if(app.engine?.b.honroNarrativeRevision===1&&app.stage.id===10)return '사람과 떨어진 바깥 주박을 공격하세요. 소단이 맡긴 뒤에는 양쪽 전각에서 오는 적을 막아 여섯 턴 동안 의식을 지키세요. 그 뒤 살아 있는 동행 한 명으로 동쪽 안전 출구를 확보하면 소단과 일행이 함께 철수합니다. 철수 전까지 소단을 보호하세요.';if(app.stage.id===7&&!app.engine?.G.HonroQuestTargets.records(b).some(t=>t.id==='root-reentry'&&!t.broken))text=text.replace('바닥으로 떨어졌다면 맨 왼쪽의 낮고 넓은 뿌리로 도약해 올라간 뒤 아랫가지로 한 번 더 도약하세요. ','');return text;}
const guideFocus=['exit','objective','interact','objective','interact','objective','interact','seal','interact','interact'];
function entry(app,options={}){G.HonroStoryFraming?.authorEntry(app.stage);const short=state(app.engine.b,app.stage).currentInstruction;
 if(app.stage.act>=2){const rows=(app.stage.act===2?G.HonroAct2:G.HonroAct3).entry(app,options),preparation=G.HonroStakeCrossing?.preparationLines(app.engine.b)||[];rows.splice(Math.max(0,rows.length-1),0,...preparation);return rows.map(row=>row[2]?.kind==='guide'?[row[0],short||row[1],row[2]]:row);}
 const n=(options.interlude===false?[]:(app.stage.narration||[])).slice(0,3).map((text,i)=>['서술',text,{kind:'narration',art:app.stage.narrationArt,paragraph:i+1,paragraphs:app.stage.narration.length}]);const all=[...n,...(app.stage.story||[]),...lines(app)],guide=['안내',short||guideFor(app),{kind:'guide',focus:guideFocus[app.stage.id-1],storyId:'guide-'+app.stage.id,storyTitle:app.stage.name+' · 길잡이'}],opening=all.slice(0,7),remaining=all.slice(7),hs=app.engine?.b.honroState;
 if(hs&&!hs.entryScheduled){hs.entryScheduled=true;hs.deferredStory??=[];const beats=(app.stage.storyFollowups||[]).map(x=>x.slice());if(remaining.length&&beats.length&&remaining.length+beats[0].length<=5)beats[0].push(...remaining);else for(let i=remaining.length;i>0;i-=5)beats.unshift(remaining.slice(Math.max(0,i-5),i));beats.forEach((lines,i)=>hs.deferredStory.push({round:2+i*2,lines:G.HonroStoryContent.scene('entry-follow-'+app.stage.id+'-'+i*5,app.stage.name+' · 길 위에서',lines)}));}
 return [...opening,guide];}
const displayGuide=text=>G.HonroActionPrompts?.text(text)??text;
function help(app){const s=app.training?{}:state(app.engine.b,app.stage);return{...s,summary:app.training?'적은 반격합니다 · 아군은 쓰러지지 않습니다':s.currentInstruction||s.summary,checklist:s.visibleChecklist||s.checklist,guide:displayGuide((!app.training&&G.HonroStage5Waterfall?.active(app.engine?.b)?G.HonroStage5Waterfall.guide:s.currentInstruction)|| (app.training?'기예를 선택하고 조준·이동·방어를 연습하세요.':app.engine.b.honroCustom?app.stage.goal:app.stage.act>=2?((G.HonroObjectiveRevision?.contentFor(app.engine.b,app.stage)||app.stage).guide||app.stage.goal):(guideFor(app)||app.stage.goal)))};}
function focus(app,kind){const s=state(app.engine.b,app.stage);return s.targets.find(t=>t.id===kind)||s.allTargets.find(t=>t.id===kind)||s.targets.find(t=>t.kind===kind)||s.allTargets.find(t=>t.kind===kind&&!t.done)||s.allTargets.find(t=>t.kind===kind);}
function refresh(app){if(!app.engine||app.training)return;const s=state(app.engine.b,app.stage);app.scene.missionTargets=s.targets;const el=document.getElementById('objective-text');if(el){const text=s.currentInstruction||s.summary,label=text+' · 눌러서 지나온 목표 보기';if(el.textContent!==text)el.textContent=text;if(el.getAttribute('aria-label')!==label)el.setAttribute('aria-label',label);}const end=document.getElementById('objective-end-text');if(end){if(end.textContent)end.textContent='';if(!end.hidden)end.hidden=true;}}
function markerLift(b,t){return b?.honroNarrativeRevision===1&&!b.honroCustom&&b.honroStage===5&&t.id==='cliff-cleat'&&t.box&&!t.box.broken?12:t.box&&!t.box.broken?88:26;}
function draw(scene,e){
 const targets=scene.goalFocus?[scene.goalFocus]:scene.missionTargets;
 if(!targets?.length)return;
 const c=scene.ctx,{w,h,d}=scene.size(),z=scene.scale,cv=scene.canvas.getBoundingClientRect(),hud=document.querySelector('.honro-compact-hud')?.getBoundingClientRect();
 const top=110,bottom=Math.max(top+30,Math.min(h-24,(hud?.top??h)-cv.top-26)),mini=document.getElementById('minimap')?.getBoundingClientRect();
 c.save();c.setTransform(d,0,0,d,0,0);c.font='600 12px sans-serif';c.textAlign='center';c.textBaseline='middle';
 let outside=0;scene.missionDrawn=[];
 for(const t of targets){
  const x=w/2+(t.x-scene.x)*z,y=h/2+(t.y-scene.y)*z,visible=x>30&&x<w-30&&y>top&&y<bottom;
  if(!visible&&outside++>0)continue;
  // Keep existing panel clearance elsewhere. The fresh iron ring has no HP
  // panel, so the arrow tip sits nine screen pixels above its real top edge.
  const lift=markerLift(e.b,t);
  let px=Math.max(70,Math.min(w-70,x)),py=Math.max(top,Math.min(bottom,y-lift));
  const hold=G.HonroAct2.active(e.b)&&G.HonroAct2Art?.holdGuide(e.b,G.HonroAct2.current(e.b)),label=(visible?'':'화면 밖 · ')+(hold?.id===t.id?hold.who+' · 수비 범위':t.label.split(' · ')[0]),width=Math.min(w-24,c.measureText(label).width+16);
  if(mini&&px+width/2>mini.left-cv.left&&py-33<mini.bottom-cv.top&&py+5>mini.top-cv.top){
   if(mini.bottom-cv.top+40<bottom)py=mini.bottom-cv.top+40;
   else px=Math.max(width/2+8,mini.left-cv.left-width/2-10);
  }
  if(scene.goalFocus&&visible){
   const pulse=22+3*Math.sin(performance.now()*.008);
   c.strokeStyle='#f2d58e';c.globalAlpha=.85;c.lineWidth=2;c.beginPath();c.arc(x,y,pulse,0,Math.PI*2);c.stroke();c.globalAlpha=1;
  }
  // Painted Stage8 bindings already carry their live name/HP in the unit
  // layer. Keep focus rings and offscreen guidance; omit the duplicate tag.
  if(visible&&e.b.honroStage===8&&!e.b.honroCustom&&e.b.honroMap?.stage8LocationPaint?.revision===1&&['bier-knot-0','bier-knot-1'].includes(t.id)&&e.unit(t.id)?.honroObjectiveTarget)continue;
  // The painted guardian's outer binding has the same live target panel.
  if(visible&&e.b.honroStage===10&&!e.b.honroCustom&&e.b.honroMap?.stage10LocationPaint?.revision===1&&t.id==='sodan-binding'&&e.unit(t.id)?.honroObjectiveTarget)continue;
  // The arrow is a canvas vector; its tip tracks the true target when the label is clamped to the HUD edge.
  const direction=Math.atan2(y-py,x-px)-Math.PI/2;
  c.save();c.translate(px,py);c.rotate(direction);c.fillStyle='#e5c57e';
  c.beginPath();c.moveTo(-7,-8);c.lineTo(7,-8);c.lineTo(0,3);c.closePath();c.fill();c.restore();
  const lx=Math.max(width/2+6,Math.min(w-width/2-6,px));
  c.fillStyle='#10242aee';c.fillRect(lx-width/2,py-33,width,20);
  c.fillStyle='#ecd398';c.fillText(label,lx,py-23,width-8);
 }
 c.restore();
}
function minimap(app,c,sx,sy){if(app.training)return;const s=state(app.engine.b,app.stage);c.save();c.strokeStyle='#ffe0a0';for(const t of s.targets)c.strokeRect(t.x*sx-3,t.y*sy-3,6,6);if(app.scene?.storyFrame?.camera.intent==='objective'){c.lineWidth=2;for(const box of app.scene.storyFrameReport?.boxes||[]){c.beginPath();c.arc((box.x+box.w/2)*sx,(box.y+box.h)*sy,7,0,Math.PI*2);c.stroke();}}c.restore();}
G.HonroObjectives={interactionTarget,state,failure,lines,entry,help,focus,refresh,draw,minimap,briefings,markerLift};
})(globalThis);
