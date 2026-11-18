/** Fresh authoring only. Place guards at actual turns/clearings; preserve
 * identity, budgets, terrain, quest coordinates and existing battle saves. */
export const ACT4_MIDDLE_PLACES={
34:[
 ['rise-foot','first-rise','첫 굽이의 전위와 후방 사수',[['g0-2',1250],['g0-3',1360]]],
 ['rise-head','first-rise','중층으로 오르는 두 번째 굽이',[['g0-4',2180],['g0-5',2280]]],
 ['middle-entry','mid-rise','중층 계단 입구의 한 쌍',[['g0-6',1160],['g0-7',1250]]],
 ['middle-turn','mid-rise','되돌아가는 계단의 혼합 방어조',[['g0-8',1880],['w-1',1970],['w-2',2100]]],
 ['upper-foot','upper-switch','상부 계단 아래 전위와 사수',[['w-3',1590],['w-4',1680]]],
 ['upper-head','upper-switch','정상 오르막 직전 차단조',[['w-5',2060],['w-6',2140],['w-7',2240]]],
 ['summit-entry','summit','정상에 올라온 파티를 맞는 장승 호위',[['w-8',3540],['w-9',3640],['s-1',3790]]],
 ['summit-scout','summit','정상 중앙 연결부의 단독 감시',[['s-2',4370]]],
 ['summit-exit','summit','출구 앞 마지막 낮은 굽이의 후위',[['s-3',5320],['s-4',5410],['r-1',5570],['r-2',5700]]]
],
35:[
 ['bamboo-stair','middle-clearing','중층 진입 계단 위의 전위와 사수',[['b-1',1800],['b-2',1880],['b-3',2000]]],
 ['fallen-bamboo-watch','middle-clearing','쓰러진 대나무 앞의 경계조; 중앙 이동면은 비움',[['b-4',2320],['b-5',2410],['b-6',2500]]],
 ['upper-west-grove','upper-clearing','상층 서쪽 대숲에 결집한 전위와 지원',[['d-1',2800],['d-2',2885],['d-3',3000],['d-4',3120],['d-5',3210]]],
 ['upper-stair-guard','upper-clearing','긴 대나무 경사로의 상층 출구 방어',[['e-1',3750],['e-2',3830],['e-3',3950]]],
 ['exit-grove','upper-clearing','동쪽 대숲과 마지막 오르막을 지키는 후위',[['e-4',4220],['e-5',4300],['e-6',4380],['e-7',4470]]]
],
37:[
 ['lower-turn','lower-diagonal','첫 하강 굽이의 작은 전위',[['a-1',1180],['a-2',1390],['a-3',1270]]],
 ['lower-overwatch','lower-diagonal','하강로 끝의 단독 측면 사수',[['b-1',1850]]],
 ['lower-west-wall','lower-road','서쪽 성벽 접근로 경계',[['b-4',1020],['b-5',1100]]],
 ['lower-hoist','lower-road','동쪽 승강 장치로 가는 길목',[['b-2',1800],['b-3',1880]]],
 ['middle-west-turn','middle-road','서쪽 반환 굽이의 사격 지원과 장승',[['c-4',600],['c-5',685],['c-6',820]]],
 ['middle-hoist','middle-road','승강 발판 옆의 장승과 전위',[['c-1',1390],['c-2',1475],['c-3',1590]]],
 ['upper-west-wall','upper-road','서쪽 방벽 위에 모인 네 체; 겹친 몸체 제거',[['e-1',1010],['e-2',1090],['e-3',1210],['e-4',1330]]],
 ['upper-scout','upper-road','승강 장치 앞의 외딴 추적자',[['h-1',1600]]],
 ['lower-gate-reserve','lower-road','하부 서문 뒤 작은 예비대',[['h-2',650],['h-3',740]]],
 ['signal-guard','upper-road','최종 신호기와 계단 끝을 지키는 사수와 등불',[['h-4',2290],['h-5',2100],['h-6',2190]]]
],
38:[
 ['entry-crest','upper','서쪽 첫 바위턱 전위',[['a-1',900],['a-2',980],['a-3',1110]]],
 ['entry-rear','upper','두 번째 바위턱의 지원조',[['a-4',1800],['a-5',1885],['a-6',2010]]],
 ['descent-mouth','middle','구조길 하강 입구의 한 쌍',[['b-1',1000],['b-2',1090]]],
 ['descent-turn','middle','하강 경사 끝의 차단조',[['b-3',1790],['b-4',1880]]],
 ['crossing-approach','middle','연결 기예 진입면 앞의 세 체; 실제 진입점은 비움',[['b-5',2440],['b-6',2520],['b-7',2660]]],
 ['basin-entry','upper','중앙 분지에 내려오는 전위와 사수',[['c-1',2990],['c-2',3080]]],
 ['ascent-foot','upper','동쪽 상승 계단 아래의 방어조',[['c-3',3770],['c-4',3850],['c-5',3980]]],
 ['east-shelf','upper','상승 계단 직후 바위 선반의 장승 호위',[['e-2',5500],['e-3',5580],['e-4',5720]]],
 ['exit-timber','upper','마지막 목조 길의 입구와 후위',[['e-5',6180],['e-6',6260],['e-7',6390],['e-8',6500]]]
]};
export function placeAct4Middle(stage,point){
 const id=stage.metadata?.stageId,places=ACT4_MIDDLE_PLACES[id];if(!places||stage.initialState?.honroMiddlePlacementRevision===1)return stage;
 const moves=new Map(),newGroups=[];
 for(const [i,[name,route,purpose,slots]]of places.entries()){
  const key=`place${id}-${name}`,support=`approved${id}-${route}`;
  for(const [suffix,x]of slots){const uid=`a4-${id}-${suffix}`,u=stage.units.find(u=>u.id===uid&&u.team==='enemy');if(!u||moves.has(uid))throw Error('Unknown/duplicate placement '+uid);
   const position=point(stage,support,x);
   // The exit lantern hovers over the grove, not inside the bank. A ground
   // seed at this concave edge was sanitized to the underside of the cliff.
   if(uid==='a4-35-e-5')position.y-=150;
   moves.set(uid,{...u,...position,encounterGroup:key,stageOverrides:{...u.stageOverrides,group:2000+id*20+i,honroEncounterSupport:support}});
  }
  newGroups.push({id:key,key,behavior:'guard',purpose,unitIds:slots.map(([suffix])=>`a4-${id}-${suffix}`)});
 }
 const encounters=stage.encounters.map(e=>({...e,unitIds:e.unitIds.filter(id=>!moves.has(id))})).filter(e=>e.unitIds.length);
 return {...stage,units:stage.units.map(u=>moves.get(u.id)||u),encounters:[...encounters,...newGroups],initialState:{...stage.initialState,honroMiddlePlacementRevision:1}};
}
