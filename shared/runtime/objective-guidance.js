(function(G){'use strict';
// Read-only presentation derived from the exact battle snapshot, including old
// ordered objectives. It never changes progress, gates, rewards or turn counters.
const alive=u=>!!u&&!u.dead&&u.hp>0;
const heroName=cls=>G.HONRO_CONTENT.hero[cls]?.name||'동행';
const heroes=b=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.enthrall&&alive(u));
const action=s=>s.id==='party-reunion'?'네 사람 집결 후 행동 종료':s.kind==='destroy'?'공격으로 파괴':s.kind==='interact'||s.kind==='rescue'?'E':s.kind==='hold'?`${s.rounds}회 유지`:s.kind==='clear'?'남은 대상 0명':s.kind==='escort'?'호송 대상 도착':s.kind==='reach'?s.allHeroes?'생존 동행 전원 도착':'동행 1명 도착':'대상 제압';
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
 10:'협력이 시작된 소단을 적 턴 6회 동안 보호하면 완료'
};
function ending(b,st,list){if(endings[st.id])return endings[st.id];const s=list.at(-1);return s?stepText(s,st.id)+'하면 완료':st.goal;}
function failure(b,st,list,result){const parts=['동행 전원 전투불능'];const protectedUnits=b.units.filter(u=>u.honroProtected||u.id==='objective'||st.id===7&&(b.honroMarkers||[]).some(m=>m.action==='rescue'&&m.target===u.id));
 if(protectedUnits.length)parts.push([...new Set(protectedUnits.map(u=>u.name))].join('·')+' 상실');
 const required=[...new Set(list.filter(s=>s.requiredClass&&!(st.act===3?G.HonroAct3.satisfied(b,s):result.allTargets?.find(t=>t.id===s.id)?.done)).map(s=>heroName(s.requiredClass)))];
 if(required.length)parts.push('필수 행동 전 '+required.join('·')+' 전투불능');
 if(st.id===5&&b.terrain.some(t=>t.id==='cliff-cleat'&&!t.broken))parts.push('고리쇠 파괴 전 담허 전투불능');
 if(st.id===10)parts.push('협력 시작 후 소단 전투불능');
 if(st.id===27&&b.honroSplit?.version===1&&!b.honroState?.act3?.done?.['party-reunion'])parts.push('중앙 합류 전 조사팀 동행 전투불능');
 if(st.id===27&&!(b.honroState?.act3?.done?.['water-release']&&b.honroState?.act3?.done?.['fire-screen']))parts.push('불길 진압 전 12번째 적 턴 종료');
 return parts.join(' / ');
}
function interactReason(b,st,s,m){const u=b.units.find(u=>u.id===b.active),point=s.target?b.units.find(v=>v.id===s.target):m;if(!point||!alive(u)||u.side!==0)return'';
 if(s.requiredClass&&u.cls!==s.requiredClass)return (G.HonroRestJourney?.towards?.(heroName(s.requiredClass))||({archer:'설오로',mage:'담허로',knight:'휘겸으로',occultist:'소단으로'}[s.requiredClass]||'동행으로'))+' 전환';
 if(Math.abs(u.y-point.y)>150)return'같은 층으로 이동';
 if(Math.hypot(u.x-point.x,(u.y-point.y)*.75)>260)return'표시 지점 가까이 이동';
 const threats=b.units.filter(v=>v.side===1&&alive(v)&&v.id!==m?.spiritId&&!v.honroSubdued);
 if(st.act===3&&threats.some(v=>G.HonroAct3.sameFloor(v,point,220)))return'작업 지점 가까운 악귀부터 처치';
 if(st.act===2&&b.honroAct2Revision>=2&&threats.some(v=>!v.honroAct2Boss&&Math.hypot(v.x-point.x,v.y-point.y)<360))return'작업 지점의 들림부터 제압';
 if(st.act===2&&s.kind==='rescue'){const spirit=b.units.find(v=>v.id===m?.spiritId);if(alive(spirit)&&spirit.hp>spirit.maxHp*.4)return'붙은 혼을 체력 40% 이하로 약화';if(alive(spirit)&&u.cls!=='occultist')return'소단으로 전환하거나 붙은 혼을 제압';}
 return'E · '+s.label;
}
function enhance(b,st,result){if(b.honroCustom)return result;
 const A=st.act===3?G.HonroAct3:st.act===2?G.HonroAct2:null,list=A?.steps(b)||[],s=A?.current(b),checklist=list.map(q=>({id:q.id,text:stepText(q,st.id),done:!!result.allTargets?.find(t=>t.id===q.id)?.done}));
 let summary=result.summary,blockReason='';
 if(list.length){summary=summary.replace(/^(\d+\/\d+) · /,'완료 $1 · ');if(s){const m=A.marker?A.marker(b,s.id):(b.honroMarkers||[]).find(m=>m.id===s.id);
   if(['interact','rescue'].includes(s.kind)&&!s.parallelGroup){blockReason=interactReason(b,st,s,m);if(blockReason)summary+=' · '+(blockReason.startsWith('E · ')?'E':blockReason);}
   if(s.kind==='destroy'){const t=b.terrain.find(t=>t.id===s.id);if(t)summary+=' · 내구도 '+Math.max(0,Math.ceil(t.hp))+'/'+Math.ceil(t.maxHp||t.hp);if(s.requiredClass)summary+=' · '+heroName(s.requiredClass)+'의 공격';}
   if(s.kind==='hold')summary=summary.replace(/(\d+\/\d+)턴/,st.act===3?'$1 적 턴':'$1라운드');
   if(s.kind==='escort')summary+=' · 운반자 앞 같은 층에서 가까이 동행';
   if(s.parallelGroup)summary+=' · 두 지점 모두 E';
   if(s.kind==='reach'&&s.allHeroes){const group=heroes(b),inside=group.filter(u=>G.HonroAct3.sameFloor(u,m,s.radius||440)).length;summary+=' · 집결 '+inside+'/'+group.length;if(s.id==='party-reunion')summary+=' · 집결 후 행동 종료';}
  }}
 return{...result,summary,blockReason,completionText:ending(b,st,list),failureText:failure(b,st,list,result),checklist};
}
G.HonroObjectiveGuide={enhance,stepText,ending};
})(globalThis);
