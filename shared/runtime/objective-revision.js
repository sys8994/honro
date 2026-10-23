(function(G){'use strict';
// Approved objective revision. Canonical authoring and fresh battles share this
// idempotent projection. Existing serialized battles retain their own terrain,
// markers, ordered steps, progress and reward ledger.
const H=G.HONRO_CONTENT,clone=x=>JSON.parse(JSON.stringify(x)),REVISION=2;
const legacy=G.HONRO_NARRATIVE_COMPAT.objectiveLegacy;
const removed={12:['rock-pin','clear-approach','hold-road','clear-quarry','exit'],13:['door-pin','clear-entry','hold-gate','clear-depth'],15:['shaft-pin','clear-water','hold-sluice','clear-gallery','exit'],16:['clear-court','hold-hall','clear-temple'],19:['hold-first','hold-second','hold-last','clear-souls'],17:['collapse-pin'],20:['exit-pin'],21:['wagon-lock'],23:['cargo-lock'],24:['courtyard-latch'],25:['rear-latch'],28:['outer-chain'],29:['sluice-chain','flight-hold','sluice-exit'],30:['route-pin']};
const gates={20:['gate-exit'],23:['cargo-gate'],24:['courtyard-door'],25:['rear-door'],28:['outer-door'],29:['sluice-door'],30:['route-door']};
const guides={
12:'길표의 진을 조사하세요. 높은 작업굴의 수레막이를 제압하고 이동하거나 열린 내리막으로 이탈하세요. 선택한 출구에 동행 한 명이 닿으면 됩니다.',
13:'소단으로 석공에게 다가가 붙은 혼을 분리하고 빗장을 여세요. 가까운 위협을 막으며 마을 입구로 이동하세요. 전맵 소탕과 대기 방어는 필요 없습니다.',
15:'마른 관찰점에서 옛 고정 자리와 새 작업 흔적을 확인하세요. 수문을 열어 낮은 길로 가거나 수문을 건드리지 않고 고지로 통과하세요.',
17:'작업장을 제압하고 안전 버팀목을 세우세요. 들린 인양틀을 제압해 축을 복원하고 5라운드 지킵니다. 남은 적을 제압한 뒤 종지기의 작업 기록을 확인하세요.',
20:'출구 매복조를 제압하고 생존자 곁에서 출발시키세요. 실제 행렬을 중간 쉼터로 이끈 뒤 4라운드 방어합니다. 마지막 매복을 제압하고 행렬이 바깥 산길에 도착해야 완료됩니다.',
21:'살아 있는 주민 곁에서 구조하세요. 같은 층의 표시 범위에서 길목을 적 턴 2회 지킨 뒤 성문 안 출구로 이동하세요. 남은 적 전부를 처치할 필요는 없습니다.',
22:'휘겸으로 하층 봉인을 여세요. 중층에서 사건 보고를, 상층에서 호적을 각각 확보하세요. 상층 대조 범위에서 적 턴 2회를 지킨 뒤 오른쪽 관창 출구로 이동하면 완료됩니다.',
23:'운송 묶음을 확보하고 살아 있는 짐꾼 곁에서 출발시키세요. 같은 층에서 짐꾼보다 조금 앞서 길을 이끌고, 석교를 지나 짐꾼과 하역장 출구에 도착하세요.',
24:'휘겸으로 가문의 문장을 확인하고 담허로 사당 봉인을 푸세요. 토지문서를 확보한 뒤 출구로 이동하세요. 이곳 조사 뒤 두 팀으로 나뉩니다. 이어지는 조사와 문서고 전투가 끝날 때까지 쉼터나 장 사이 자동 회복이 없으니 지금 동행 상태를 살피세요.',
25:'휘겸으로 숨은 기록실을 열고 표시 범위에서 기록함을 적 턴 3회 지키세요. 선조의 조사 기록을 확보한 뒤 뒷길 출구로 이탈하면 완료됩니다.',
26:'공방 입구를 받치고 살아 있는 주민을 구조하세요. 표시 범위에서 장부를 적 턴 2회 지킨 뒤 수량 대조를 마치고 출구로 이동하세요.',
27:'12번째 적 턴 종료 전에 설오로 수문을, 휘겸으로 차단막을 조작하세요. 순서는 자유입니다. 두 불길을 막은 뒤 네 사람 모두 중앙 합류 범위에 모여 행동을 마치세요. 기록을 확보하고 운반자와 출구까지 동행하세요. 대화 중에는 소각이 진행되지 않습니다.',
28:'폐쇄 승인문과 사후 은폐 기록을 각각 확인하세요. 같은 층의 표시 범위에서 퇴로를 적 턴 2회 지킨 뒤 관아 바깥 출구로 이동하세요.',
29:'담허의 봉인 해체를 두 적 턴 지키고 현묵의 글을 확보하세요. 높은 수문길 또는 기둥 아래 점검다리 출구에 동행 한 명이 도착하면 됩니다.',
30:'세 기록을 대조한 뒤 나루의 표시 범위를 적 턴 3회 지키세요. 마지막으로 살아 있는 모든 동행을 같은 층의 옛길 입구에 모으면 완료됩니다.'
};
const goals={12:'길표의 진을 풀고 높은 작업굴 또는 열린 내리막으로 이탈',13:'석공을 구조하고 석문 빗장을 열어 마을 입구에 도착',15:'옛 흔적을 확인하고 배수한 낮은 길 또는 고지로 통과',17:'인양틀을 복구하고 방어해 종지기의 작업 기록 확보',20:'생존자 행렬을 중간 쉼터와 바깥 산길까지 호송',21:'주민 구조와 길목 방어 후 성문 안 출구에 도착',22:'사건 보고와 호적을 확보·대조하고 관창 출구에 도착',23:'운송 기록을 확보하고 살아 있는 짐꾼과 하역장 통과',24:'문장과 토지문서를 조사하고 기록실로 이어지는 출구에 도착',25:'조사 기록함을 지키고 문서를 확보해 뒷길로 이탈',26:'주민과 작업 장부를 지키고 수량 대조 후 출구에 도착',27:'두 불길을 막고 조사 청원서와 운반자를 지켜 탈출',28:'승인문과 은폐 기록을 대조하고 퇴로 방어 후 이탈',29:'현묵의 글을 확보하고 높은 수문길 또는 점검다리로 이탈',30:'세 기록을 대조하고 나루 방어 후 동행 전원 집결'};
let registeredStaging=null;
function registerScenes(){const staging=G.HonroStoryStaging;if(!staging||registeredStaging===staging)return;for(const version of [1,2]){const stage=version===1?27:28,content=version===1?G.HONRO_SPLIT_V1?.content.find(s=>s.id===27):H.stages[27];staging.register({id:'act3-party-reunion-v'+version,stage,requireSplit:version,title:'다시 모인 기록',steps:[{type:'look',at:{marker:'party-reunion'},duration:450,caption:'두 조사팀이 서로 가져온 기록을 펼친다.'},{type:'dialogue',lines:content?.beats?.['party-reunion']||[]}]});}registeredStaging=staging;}
function stageScene(app,s){if(s.id!=='party-reunion'||!G.HonroStoryStaging)return false;registerScenes();const id='act3-party-reunion-v'+(app.engine.b.honroSplit?.version===1?1:2);if(app.engine.b.honroStaging?.once?.[id])return true;return G.HonroStoryStaging.request(app,id);}
function active(b){return !b?.honroCustom&&b?.honroObjectiveRevision>=REVISION;}
const historicalWaterworks=b=>[25,27].includes(b?.honroStage)&&b.honroWaterworksRevision>0&&b.honroWaterworksRevision<3?G.HONRO_WATERWORKS_V2?.content.find(q=>q.id===b.honroStage):null;
function contentFor(b,st){return G.HonroNarrativeCatalogue.resolve(b,st);}
function storedSteps(b,act){return contentFor(b,H.stages[b.honroStage-1]).steps||[];}
function author(project,options={}){
 const p={...project,stages:project.stages.map(original=>{
  const id=original.metadata?.stageId;if(!original.metadata?.campaign||id<Math.max(11,options.minStage||11)||id>(options.maxStage||30)||!H.stages[id-1])return original;
  if(!options.force&&original.initialState?.honroObjectiveRevision>=REVISION)return original;
  const map=clone(original),waterworks=!!original.initialState?.honroWaterworksRevision,st=!waterworks&&H.stages[id-1].hiddenWaterworks?(G.HONRO_SPLIT_V1?.content.find(s=>s.id===id)||H.stages[id-1]):H.stages[id-1];
  // Saved horizontal waterworks own their ordered goals and authored labels.
  // A force-author pass must not mix current vertical goals into old geometry.
  const historic=historicalWaterworks({honroStage:id,honroWaterworksRevision:original.initialState?.honroWaterworksRevision});
  if(historic){map.initialState.honroObjectiveRevision=REVISION;map.initialState.honroAct3Steps??=clone(historic.steps);return map;}
  // Current waterworks maps own their topology and controls; do not replay
  // older device removals or chapter-27 marker ordering.
  if(waterworks){
   map.initialState.honroObjectiveRevision=REVISION;map.initialState.honroAct3Steps=clone(st.steps);
   for(const s of st.steps||[]){const m=map.markers.find(m=>m.id===s.id||m.id==='marker-'+s.id);if(!m)continue;m.label=s.label;if(['interact','rescue'].includes(s.kind))m.action='act3';if(s.requiredClass)m.requiredClass=s.requiredClass;else delete m.requiredClass;}
   for(const o of map.objectives||[])if(o.type==='campaign')o.label=st.goal;
   return map;
  }
  const drops=[...(removed[id]||[]),...(id===22?['upper-latch']:[]),...(id===27&&!st.hiddenWaterworks?['water-release']:[])];
  map.initialState??={};map.initialState.honroObjectiveRevision=REVISION;
  if(id>=11&&id<=20)map.initialState.honroAct2Steps=clone(st.steps);
  if(id>=21)map.initialState.honroAct3Steps=clone(st.steps);
  // Spatial contracts name the same deleted objective/door IDs. Remove only
  // these obsolete dependencies and sites; keep all unrelated route guards.
  const retired=new Set([...drops,...(gates[id]||[])]),space=map.design?.space;
  if(space){for(const record of [...(space.connections||[]),...(space.routes||[])])if(record.requires)record.requires=record.requires.filter(q=>!retired.has(q.objectiveId)&&!retired.has(q.terrainId));for(const [key,site] of Object.entries(space.sites||{}))if(retired.has(key)||retired.has(site.objectiveId)||retired.has(site.target?.terrainId))delete space.sites[key];}
  map.terrains=map.terrains.filter(t=>!drops.includes(t.id)&&!(gates[id]||[]).includes(t.id));
  map.markers=map.markers.filter(m=>!drops.some(key=>m.id===key||m.id==='marker-'+key));
  if(id===12){const floor=map.terrains.find(t=>t.id==='act2-floor'),restored=floor?.properties?.honroRestoredVertices;if(restored){const surface=new Map(restored.slice(0,-2).map(v=>[v.x,v.y]));for(const v of floor.points)if(surface.has(v.x)&&v.y<map.height)v.y=surface.get(v.x);delete floor.properties.honroRestoredVertices;}}
  if(id===15){map.initialState.honroCaveHangingClue??=clone(map.initialState.honroCaveHangingTarget||{});delete map.initialState.honroCaveHangingTarget;}
  if(id===17){map.markers=map.markers.filter(m=>m.id!=='rebuild-brace');map.terrains=map.terrains.filter(t=>t.id!=='gate-debris');}
  if(id===22&&!map.markers.some(m=>m.id==='upper-register')){const base=map.markers.find(m=>m.id==='compare-ledgers');map.markers.push({id:'upper-register',type:'act3',action:'act3',x:base.x-260,y:base.y,label:'상층 저문골 호적 확보'});}
  if(id===27&&!st.hiddenWaterworks){const old=original.markers.find(m=>m.id==='water-release'||m.id==='marker-water-release');map.markers.push({...clone(old),id:'water-release',type:'act3',action:'act3',requiredClass:'archer',label:'수문을 열어 불길 막기'});delete map.markers.at(-1).target;if(!map.markers.some(m=>m.id==='party-reunion')){const base=map.markers.find(m=>m.id==='petition-record');map.markers.push({id:'party-reunion',type:'act3',x:base.x,y:base.y,label:'두 조사팀이 중앙 뜰에 모이기'});}}
  if(id===27)map.markers.sort((a,b)=>a.id.localeCompare(b.id));
  for(const s of st.steps||[]){const m=map.markers.find(m=>m.id===s.id||m.id==='marker-'+s.id);if(m){m.label=s.label;if(['interact','rescue'].includes(s.kind))m.action=id>=21?'act3':'act2';if(s.requiredClass)m.requiredClass=s.requiredClass;else delete m.requiredClass;}}
  for(const o of map.objectives||[])if(o.type==='campaign')o.label=st.goal;
  return map;
 })};return p;
}
G.HonroObjectiveRevision={version:REVISION,active,contentFor,storedSteps,author,removed,gates,legacy,registerScenes,stageScene};
})(globalThis);
