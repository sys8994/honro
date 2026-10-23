(function(G){'use strict';
// Read-only presentation derived from the exact battle snapshot, including old
// ordered objectives. It never changes progress, gates, rewards or turn counters.
const alive=u=>!!u&&!u.dead&&u.hp>0;
const heroName=cls=>G.HONRO_CONTENT.hero[cls]?.name||'동행';
const heroes=b=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.enthrall&&alive(u));
const action=s=>s.id==='party-reunion'?'네 사람 집결 후 행동 종료':s.kind==='destroy'?'공격으로 파괴':s.kind==='rescue'?'구조':s.kind==='interact'?'상호작용':s.kind==='hold'?`${s.rounds}회 유지`:s.kind==='clear'?'대상 적을 모두 제압':s.kind==='route'?'동행 1명 출구 도착':s.kind==='escort'?'호송 대상 도착':s.kind==='reach'?s.allHeroes?'생존 동행 전원 도착':'동행 1명 도착':'대상 제압';
const stepText=(s,id)=>`${s.label}${s.requiredClass&&!s.label.includes(heroName(s.requiredClass))?' · '+heroName(s.requiredClass):''} · ${s.kind==='hold'?(id>=21?'적 턴 ':'라운드 ')+s.rounds+'회 완료':action(s)}`;
const endings={
 1:'동행 1명이 고개 끝 도착 지점에 닿으면 완료',
 2:'상여가 도착 지점에 닿으면 완료',
 3:'장부 확보 뒤 일행을 1라운드 보호하면 완료',
 4:'피난문을 살려 8라운드를 버티면 완료',
 5:'고리쇠 파괴 뒤 물길을 1라운드 안정시키면 완료',
 6:'교각귀를 제압하고 운반대가 북문 쉼터에 닿으면 완료',
 7:'주민 셋 구조 뒤 2라운드 동안 모두 보호하면 완료',
 8:'결박 둘과 빈 상여를 제압한 뒤 1라운드 수습하면 완료',
 9:'받이진 둘 설치 뒤 일행을 2라운드 보호하면 완료',
 10:'소단을 적 턴 6회 보호한 뒤 한 명이 동쪽 안전 출구에 도착하면 일행과 함께 철수'
};
function ending(b,st,list){if(b.honroNarrativeRevision===1&&st.id===8)return '결박 둘과 빈 상여를 제압하면 완료';if(b.honroNarrativeRevision===1&&st.id===9)return '받이진 둘이 연결되면 완료';if(endings[st.id])return endings[st.id];const s=list.at(-1);return s?stepText(s,st.id)+'하면 완료':st.goal;}
function failure(b,st,list,result){const parts=['동행 전원 전투불능'];const protectedUnits=b.units.filter(u=>u.honroProtected||u.id==='objective'||st.id===7&&(b.honroMarkers||[]).some(m=>m.action==='rescue'&&m.target===u.id));
 if(protectedUnits.length)parts.push([...new Set(protectedUnits.map(u=>u.name))].join('·')+' 상실');
 const required=[...new Set(list.filter(s=>!s.optional&&s.requiredClass&&!(st.act===3?G.HonroAct3.satisfied(b,s):result.allTargets?.find(t=>t.id===s.id)?.done)).map(s=>heroName(s.requiredClass)))];
 if(required.length)parts.push('필수 행동 전 '+required.join('·')+' 전투불능');
 if(st.id===5&&G.HonroQuestTargets.records(b).some(t=>t.id==='cliff-cleat'&&!t.broken))parts.push('고리쇠 파괴 전 담허 전투불능');
 if(st.id===10)parts.push('협력 시작 후 소단 전투불능');
 if(st.id===27&&b.honroSplit?.version===1&&!b.honroState?.act3?.done?.['party-reunion'])parts.push('중앙 합류 전 조사팀 동행 전투불능');
 if(G.HonroAct3?.fireScenario(b)&&!(b.honroState?.act3?.done?.['water-release']&&b.honroState?.act3?.done?.['fire-screen']))parts.push('불길 진압 전 12번째 적 턴 종료');
 return parts.join(' / ');
}
function interactReason(b,st,s,m){const u=b.units.find(u=>u.id===b.active),point=s.target?b.units.find(v=>v.id===s.target):m;if(!point||!alive(u)||u.side!==0)return'';
 if(s.requiredClass&&u.cls!==s.requiredClass)return heroName(s.requiredClass)+'로 전환';
 if(Math.abs(u.y-point.y)>150)return'같은 층으로 이동';
 if(Math.hypot(u.x-point.x,(u.y-point.y)*.75)>260)return'표시 지점 가까이 이동';
 if(st.act===2&&s.kind==='rescue'){const spirit=b.units.find(v=>v.id===m?.spiritId);if(alive(spirit)&&u.cls!=='occultist')return'소단으로 전환하거나 붙은 혼을 제압';}
 return s.label;
}
function enhance(b,st,result){if(b.honroCustom)return result;
 const A=st.act===3?G.HonroAct3:st.act===2?G.HonroAct2:null,list=A?.steps(b)||[],s=A?.current(b),checklist=list.map(q=>({id:q.id,text:stepText(q,st.id),done:!!result.allTargets?.find(t=>t.id===q.id)?.done}));
 let summary=result.summary,blockReason='';
 if(list.length){summary=summary.replace(/^(\d+\/\d+) · /,'완료 $1 · ');if(s){const m=A.marker?A.marker(b,s.id):(b.honroMarkers||[]).find(m=>m.id===s.id);
   if(['interact','rescue'].includes(s.kind)&&!s.parallelGroup){blockReason=interactReason(b,st,s,m);if(blockReason)summary+=' · '+blockReason;}
   if(s.kind==='destroy'){const t=G.HonroQuestTargets.records(b).find(t=>t.id===s.id);if(t)summary+=' · 내구도 '+Math.max(0,Math.ceil(t.hp))+'/'+Math.ceil(t.maxHp||t.hp);if(s.requiredClass)summary+=' · '+heroName(s.requiredClass)+'의 공격';}
   if(s.kind==='hold')summary=summary.replace(/(\d+\/\d+)턴/,st.act===3?'$1 적 턴':'$1라운드');
   if(s.kind==='escort')summary+=' · 운반자 앞 같은 층에서 가까이 동행';
   if(s.parallelGroup)summary+=s.parallelGroup==='bell-stabilize'?' · 유지와 기본 공격은 동시에 진행':s.parallelGroup==='farewell'?' · 세 만남은 자유 순서 · 혼을 가른 뒤 작별하세요':' · 두 지점 모두 조작하세요';
   if(s.kind==='reach'&&s.allHeroes){const group=heroes(b),inside=group.filter(u=>G.HonroAct3.sameFloor(u,m,s.radius||440)).length;summary+=' · 집결 '+inside+'/'+group.length;if(s.id==='party-reunion')summary+=' · 집결 후 행동 종료';}
  }}
 const presentation=progressive(b,st,result,list,s);
 return{...result,summary,blockReason,completionText:ending(b,st,list),failureText:failure(b,st,list,result),checklist,...presentation};
}
function legacySteps(b,st,r){const h=b.honroState||{},out=[],add=(id,text,done=false)=>out.push({id,text,done}),marks=b.honroMarkers||[],boss=b.units.find(u=>u.id==='boss'),seals=G.HonroQuestTargets.records(b).filter(t=>t.honroSeal);
 const hold=(text)=>add('settle',text,r.complete);
 switch(st.id){
 case 1:add('exit','표시된 도착 지점으로 이동하세요',r.complete);break;
 case 2:add('escort','상여가 도착할 때까지 지켜 주세요',r.complete);break;
 case 3:add('ledger','움막의 장부를 확인하세요',!!h.ledger);hold('일행을 1턴 보호하세요');break;
 case 4:add('protect','피난문을 지키세요 · '+Math.max(0,8-(b.round-1))+'턴 남음',r.complete);break;
 case 5:add('ritual','담허로 받이진 앞에서 의식을 시작하세요',!!h.ritual?.active||!seals.some(t=>!t.broken));add('cleat','설오로 표시된 고리쇠를 쏘세요',!seals.some(t=>!t.broken));hold('물길을 1턴 지키세요');break;
 case 6:add('midboss','교각귀를 쓰러뜨리세요',!b.units.some(u=>u.honroMidboss&&!u.dead));add('rescue','운반대 가까이 이동하세요',!!h.rescued);add('escort','운반대 앞에서 길을 열어 주세요',r.complete);break;
 case 7:marks.filter(m=>m.action==='rescue').forEach((m,i)=>add(m.id,'주민 '+(i+1)+' 곁에서 구조하세요',!!m.collected));hold('구조한 주민들을 2턴 보호하세요');break;
 case 8:seals.forEach((t,i)=>add(t.id,'상여 결박 '+(i+1)+'을 공격하세요',!!t.broken));add('boss','빈 상여를 쓰러뜨리세요',!!boss?.dead);if(b.honroNarrativeRevision!==1)hold('주변을 1턴 지키세요');break;
 case 9:marks.filter(m=>m.action==='receiver').forEach((m,i)=>add(m.id,'받이진 '+(i+1)+'을 활성화하세요',!!m.collected));if(b.honroNarrativeRevision!==1)hold('일행을 2턴 보호하세요');break;
 case 10:if(b.honroNarrativeRevision===1){add('binding','바깥 붉은 주박을 공격하세요',!!G.HonroQuestTargets.records(b).find(t=>t.id==='sodan-binding')?.broken);add('accept','소단이 힘을 맡기도록 곁을 지키세요',!!h.sodanCoop);add('protect','소단을 지켜 주세요 · '+Math.max(0,6-(h.coopHold||0))+'턴 남음',!!h.sodanCoop&&(h.coopHold||0)>=6);add('sodan-safe-exit','소단을 지키며 한 명으로 동쪽 안전 출구 확보',G.HonroSodanWithdrawal.complete(b));break;}add('weaken','소단의 주박을 약화하세요',!!h.sodanCoop||!!boss&&boss.hp<=boss.maxHp*.42);marks.filter(m=>m.action==='receiver').forEach((m,i)=>add(m.id,'받이진 '+(i+1)+'을 활성화하세요',!!m.collected));add('protect','소단을 지켜 주세요 · '+Math.max(0,6-(h.coopHold||0))+'턴 남음',!!h.sodanCoop&&(h.coopHold||0)>=6);add('sodan-safe-exit','소단을 지키며 한 명으로 동쪽 안전 출구 확보',G.HonroSodanWithdrawal.complete(b));break;
 default:add('current',r.summary,r.complete);
 }return out;
}
function progressive(b,st,result,list,current){
 let chosen=current,rows,instruction;
 if(list.length){
  if(current?.parallelGroup){const active=b.units.find(u=>u.id===b.active),cls=active?.cls,A=st.act===2?G.HonroAct2:G.HonroAct3,ready=A.readySteps?.(b)||list.filter(q=>!result.allTargets?.find(t=>t.id===q.id)?.done),peers=ready.filter(q=>q.parallelGroup===current.parallelGroup),suitable=peers.filter(q=>!q.requiredClass||q.requiredClass===cls||current.parallelGroup==='bell-stabilize'&&cls!=='mage'&&q.kind==='destroy');
   if(current.parallelGroup==='farewell'){const distance=q=>{const p=(b.honroMarkers||[]).find(m=>m.id===q.id);return p&&active?Math.hypot(p.x-active.x,p.y-active.y):Infinity;};chosen=(suitable.length?suitable:peers).slice().sort((a,c)=>distance(a)-distance(c))[0]||current;}else chosen=suitable[0]||current;}
  rows=list.map(q=>({id:q.id,text:stepText(q,st.id),done:!!result.allTargets?.find(t=>t.id===q.id)?.done}));
  if(chosen){const name=chosen.requiredClass&&!chosen.label.includes(heroName(chosen.requiredClass))?heroName(chosen.requiredClass)+' · ':'';
   instruction=name+chosen.label;
   if(chosen.kind==='rescue')instruction+=' · 구조';
   else if(chosen.kind==='destroy')instruction+=' · 공격';
   else if(chosen.kind==='hold'){const a=st.act===3?b.honroState?.act3:b.honroState?.act2,h=a?.holds?.[chosen.id];const area=st.act===3?'범위':'원';instruction=h?.contested?'표시된 '+area+' 안의 적을 처치하세요':h?.guarded?'그 자리에서 '+Math.max(0,chosen.rounds-(h.progress||0))+'턴 더 버티세요':'표시된 '+area+' 안에서 '+chosen.rounds+'턴 버티세요';}
   else if(chosen.kind==='escort')instruction='운반자 앞에서 출구까지 길을 열어 주세요';
   else if(chosen.kind==='route')instruction=chosen.label;
   else if(chosen.kind==='reach')instruction=chosen.allHeroes?chosen.id==='party-reunion'?'중앙에 네 사람을 모은 뒤 행동을 끝내세요':'살아 있는 동행을 도착 지점에 모으세요':'표시된 도착 지점으로 이동하세요';
   if(G.HonroAct3?.fireScenario(b)&&['water-release','fire-screen'].includes(chosen.id))instruction+=' · '+Math.max(0,12-(b.honroState?.act3?.fireTurns||0))+'턴 남음';
  }
 }else{rows=legacySteps(b,st,result);chosen=rows.find(q=>!q.done);instruction=chosen?.text;}
 instruction=G.HonroStage11RavineEncounters?.holdInstruction(b,chosen)||G.HonroStage11RavineEncounters?.knotInstruction(b,chosen)||G.HonroStage11RavineEncounters?.rescueInstruction(b,chosen)||instruction;
 if(G.HonroStage18Bell?.active(b)&&chosen?.kind==='bell-descent')instruction=G.HonroStage18Bell.memory(b).reason||chosen.label;
 const parallelIds=new Set(chosen?.parallelGroup==='bell-stabilize'?list.filter(q=>q.parallelGroup===chosen.parallelGroup).map(q=>q.id):chosen?.parallelGroup==='farewell'?(G.HonroAct2.readySteps(b)||[]).filter(q=>q.parallelGroup==='farewell').map(q=>q.id):[]);
 const visibleChecklist=rows.filter(q=>q.done||q.id===chosen?.id||parallelIds.has(q.id)).map(q=>({...q,current:(q.id===chosen?.id||parallelIds.has(q.id))&&!q.done}));
 return{currentInstruction:result.complete?'목표 완료':instruction||result.summary,currentObjectiveId:chosen?.id,visibleChecklist};
}
G.HonroObjectiveGuide={enhance,stepText,ending,progressive};
})(globalThis);
