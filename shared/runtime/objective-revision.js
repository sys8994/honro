(function(G){'use strict';
// Approved objective revision. Canonical authoring and fresh battles share this
// idempotent projection. Existing serialized battles retain their own terrain,
// markers, ordered steps, progress and reward ledger.
const H=G.HONRO_CONTENT,clone=x=>JSON.parse(JSON.stringify(x)),REVISION=2;
const legacy=H.stages.map(clone);
const removed={12:['rock-pin'],13:['door-pin'],15:['shaft-pin'],17:['collapse-pin'],20:['exit-pin'],21:['wagon-lock'],23:['cargo-lock'],24:['courtyard-latch'],25:['rear-latch'],28:['outer-chain'],29:['sluice-chain'],30:['route-pin']};
const gates={20:['gate-exit'],23:['cargo-gate'],24:['courtyard-door'],25:['rear-door'],28:['outer-door'],29:['sluice-door'],30:['route-door']};
const guides={
12:'진입로의 적을 제압하고 낙석이 메운 길을 따라 길표를 조사하세요. 진의 축을 푼 뒤 표시 범위에서 4라운드 방어하고, 채석장의 남은 적을 제압한 뒤 출구에 도착하세요.',
13:'석문 앞 작업조를 제압하고 석공에게 붙은 혼을 약화시켜 구조하세요. 빗장을 E로 열고 5라운드 동안 통로를 지킨 뒤, 안쪽 적을 제압하고 마을 입구로 이동하세요.',
15:'수문 구역을 제압하고 수문을 E로 열어 4라운드 지키세요. 작업굴의 적을 제압한 뒤 바닥 홈과 옛 인양 흔적을 조사하고 출구로 이동하세요. 위의 오래된 인양구는 조사 단서이며 공격 목표가 아닙니다.',
17:'작업장을 제압하고 안전 버팀목을 세우세요. 들린 인양틀을 제압해 축을 E로 복원하고 5라운드 지킵니다. 남은 적을 제압한 뒤 종지기의 작업 기록을 E로 확인하세요.',
20:'출구 매복조를 제압하고 생존자 곁에서 E로 출발시키세요. 실제 행렬을 중간 쉼터로 이끈 뒤 4라운드 방어합니다. 마지막 매복을 제압하고 행렬이 바깥 산길에 도착해야 완료됩니다.',
21:'살아 있는 주민 곁에서 E로 구조하세요. 같은 층의 표시 범위에서 길목을 적 턴 2회 지킨 뒤 성문 안 출구로 이동하세요. 남은 적 전부를 처치할 필요는 없습니다.',
22:'휘겸으로 하층 봉인을 E로 여세요. 중층에서 사건 보고를, 상층에서 호적을 각각 E로 확보하세요. 상층 대조 범위에서 적 턴 2회를 지킨 뒤 오른쪽 관창 출구로 이동하면 완료됩니다.',
23:'운송 묶음을 E로 확보하고 살아 있는 짐꾼 곁에서 E로 출발시키세요. 같은 층에서 짐꾼보다 조금 앞서 길을 이끌고, 석교를 지나 짐꾼과 하역장 출구에 도착하세요.',
24:'휘겸으로 가문의 문장을 확인하고 담허로 사당 봉인을 푸세요. 토지문서를 E로 확보한 뒤 기록실로 이어지는 출구에 도착하세요.',
25:'휘겸으로 숨은 기록실을 열고 표시 범위에서 기록함을 적 턴 3회 지키세요. 선조의 조사 기록을 E로 확보한 뒤 뒷길 출구로 이탈하면 완료됩니다.',
26:'공방 입구를 받치고 살아 있는 주민을 E로 구조하세요. 표시 범위에서 장부를 적 턴 2회 지킨 뒤 수량 대조를 E로 마치고 출구로 이동하세요.',
27:'12번째 적 턴 종료 전에 설오로 수문을, 휘겸으로 차단막을 E로 조작하세요. 순서는 자유입니다. 두 불길을 막은 뒤 표시된 합류·기록 확보를 마치고 운반자와 출구까지 동행하세요. 대화 중에는 소각이 진행되지 않습니다.',
28:'폐쇄 승인문과 사후 은폐 기록을 각각 E로 확인하세요. 같은 층의 표시 범위에서 퇴로를 적 턴 2회 지킨 뒤 관아 바깥 출구로 이동하세요.',
29:'담허를 표시 범위에 두고 옛 봉인을 적 턴 2회 해체하세요. 현묵의 글을 E로 확보하고 수문 퇴로를 적 턴 2회 지킨 뒤 나루 출구로 이동하세요.',
30:'세 기록을 E로 대조한 뒤 나루의 표시 범위를 적 턴 3회 지키세요. 마지막으로 살아 있는 모든 동행을 같은 층의 옛길 입구에 모으면 완료됩니다.'
};
const goals={12:'길표의 돌림진을 풀고 채석장을 지나 함몰지 입구에 도착',13:'석공 구조와 석문 방어 후 마을 입구에 도착',15:'수문을 지켜 작업굴을 통과하고 옛 인양 흔적 조사',17:'인양틀을 복구하고 방어해 종지기의 작업 기록 확보',20:'생존자 행렬을 중간 쉼터와 바깥 산길까지 호송',21:'주민 구조와 길목 방어 후 성문 안 출구에 도착',22:'사건 보고와 호적을 확보·대조하고 관창 출구에 도착',23:'운송 기록을 확보하고 살아 있는 짐꾼과 하역장 통과',24:'문장과 토지문서를 조사하고 기록실로 이어지는 출구에 도착',25:'조사 기록함을 지키고 문서를 확보해 뒷길로 이탈',26:'주민과 작업 장부를 지키고 수량 대조 후 출구에 도착',27:'두 불길을 막고 조사 청원서와 운반자를 지켜 탈출',28:'승인문과 은폐 기록을 대조하고 퇴로 방어 후 이탈',29:'현묵의 글을 확보하고 수문 퇴로를 지켜 나루에 도착',30:'세 기록을 대조하고 나루 방어 후 동행 전원 집결'};
function replaceLine(lines,find,text){for(const row of lines||[])if(row[1].includes(find))row[1]=text;}
for(const st of H.stages){
 if(st.steps)st.steps=st.steps.filter(s=>!(removed[st.id]||[]).includes(s.id));
 if(goals[st.id])st.goal=goals[st.id];if(guides[st.id])st.guide=guides[st.id];
 if(st.id===22){const at=st.steps.findIndex(s=>s.id==='upper-latch');st.steps[at]={id:'upper-register',label:'상층 저문골 호적 확보',kind:'interact'};st.steps.find(s=>s.id==='ledger-case').label='중층 저문골 사건 보고 확보';st.steps.find(s=>s.id==='ledger-case').opens='upper-door';st.steps.find(s=>s.id==='archive-seal').label='하층 서고 봉인 열기';st.steps.find(s=>s.id==='compare-ledgers').label='상층에서 사건 보고와 호적 대조';}
 if(st.id===27){const water=st.steps.find(s=>s.id==='water-release');Object.assign(water,{kind:'interact',label:'수문을 열어 서쪽 불길 막기',parallelGroup:'fire-control'});st.steps.find(s=>s.id==='fire-screen').parallelGroup='fire-control';st.steps.splice(2,0,{id:'party-reunion',label:'두 조사팀이 중앙 뜰에 모이기',kind:'reach',allHeroes:true,radius:440,splitOnly:true});}
 if(st.act2Plan)st.act2Plan.sequence=clone(st.steps);
}
replaceLine(H.stages[11].story,'저 바위를 받친','낙석이 아래 홈을 메웠소. 길표에 다가가려면 먼저 작업장을 비워야 하오.');
replaceLine(H.stages[14].story,'활로 끊을','천장 아래 오래된 인양구가 보입니다. 먼저 발 디딜 바닥을 드러내고 남은 흔적을 살펴보겠습니다.');
replaceLine(H.stages[16].beats?.brace,'끊으시오','받침이 물렸소. 무게가 이쪽으로 쏠리지 않게 지키며 안의 인양축을 복원합시다.');
replaceLine(H.stages[19].story,'출구까지 돌이','무너진 출구를 주민들이 치우고 있소. 매복부터 걷어 내고 사람들을 부릅시다.');
replaceLine(H.stages[20].story,'저 고리부터','수레 밑에 사람이 있습니다. 곁의 위협부터 치우고 꺼내겠습니다.');
replaceLine(H.stages[21].story,'위층 걸쇠','위층 서가에도 장부가 남아 있습니다. 같은 해의 호적을 찾아오겠습니다.');
replaceLine(H.stages[26].story,'수문 고정구','수문 쪽으로 가겠습니다. 물길을 열면 저쪽 불길을 막을 수 있습니다.');
// Stale focus cues must never point at a deleted device.
for(const id of [12,15,20,21,22,23,27])for(const row of H.stages[id-1].story||[])if(row[2]?.focus==='seal')row[2].focus='interact';
function active(b){return !b?.honroCustom&&b?.honroObjectiveRevision>=REVISION;}
function contentFor(b,st){return active(b)?st:legacy[(b?.honroStage||st.id)-1]||st;}
function storedSteps(b,act){return contentFor(b,H.stages[b.honroStage-1]).steps||[];}
function author(project,options={}){
 const p={...project,stages:project.stages.map(original=>{
  const id=original.metadata?.stageId;if(!original.metadata?.campaign||id<Math.max(11,options.minStage||11)||id>(options.maxStage||30)||!H.stages[id-1])return original;
  if(!options.force&&original.initialState?.honroObjectiveRevision>=REVISION)return original;
  const map=clone(original),st=H.stages[id-1],drops=[...(removed[id]||[]),...(id===22?['upper-latch']:[]),...(id===27?['water-release']:[])];
  map.initialState??={};map.initialState.honroObjectiveRevision=REVISION;
  if(id>=11&&id<=20)map.initialState.honroAct2Steps=clone(st.steps);
  if(id>=21)map.initialState.honroAct3Steps=clone(st.steps);
  map.terrains=map.terrains.filter(t=>!drops.includes(t.id)&&!(gates[id]||[]).includes(t.id));
  map.markers=map.markers.filter(m=>!drops.some(key=>m.id===key||m.id==='marker-'+key));
  if(id===12){const floor=map.terrains.find(t=>t.id==='act2-floor'),restored=floor?.properties?.honroRestoredVertices;if(restored){const surface=new Map(restored.slice(0,-2).map(v=>[v.x,v.y]));for(const v of floor.points)if(surface.has(v.x)&&v.y<map.height)v.y=surface.get(v.x);delete floor.properties.honroRestoredVertices;}}
  if(id===15){map.initialState.honroCaveHangingClue??=clone(map.initialState.honroCaveHangingTarget||{});delete map.initialState.honroCaveHangingTarget;}
  if(id===17){map.markers=map.markers.filter(m=>m.id!=='rebuild-brace');map.terrains=map.terrains.filter(t=>t.id!=='gate-debris');}
  if(id===22&&!map.markers.some(m=>m.id==='upper-register')){const base=map.markers.find(m=>m.id==='compare-ledgers');map.markers.push({id:'upper-register',type:'act3',action:'act3',x:base.x-260,y:base.y,label:'상층 저문골 호적 확보'});}
  if(id===27){const old=original.markers.find(m=>m.id==='water-release'||m.id==='marker-water-release');map.markers.push({...clone(old),id:'water-release',type:'act3',action:'act3',requiredClass:'archer',label:'수문을 열어 서쪽 불길 막기'});delete map.markers.at(-1).target;if(!map.markers.some(m=>m.id==='party-reunion')){const base=map.markers.find(m=>m.id==='petition-record');map.markers.push({id:'party-reunion',type:'act3',x:base.x,y:base.y,label:'두 조사팀이 중앙 뜰에 모이기'});}}
  if(id===27)map.markers.sort((a,b)=>a.id.localeCompare(b.id));
  for(const s of st.steps||[]){const m=map.markers.find(m=>m.id===s.id||m.id==='marker-'+s.id);if(m){m.label=s.label;if(['interact','rescue'].includes(s.kind))m.action=id>=21?'act3':'act2';if(s.requiredClass)m.requiredClass=s.requiredClass;else delete m.requiredClass;}}
  for(const o of map.objectives||[])if(o.type==='campaign')o.label=st.goal;
  return map;
 })};return p;
}
G.HonroObjectiveRevision={version:REVISION,active,contentFor,storedSteps,author,removed,gates,legacy};
})(globalThis);
