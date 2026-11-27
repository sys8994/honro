(function(G){'use strict';
// Fresh campaign deployments. Each group uses a named, compiled walk surface;
// the coordinates include the flight height where a bat guards the lower party.
const posts={
 1:[
  // 첫 조준 뒤의 고갯길
  ['pass','forest-floor',['hound',680,1543]],
  // 쓰러진 소나무 양쪽
  ['pine','pine-branch-west',['ghost',1420,1322]],
  // 숲길 갈림목
  ['fork','forest-floor',['boar',2280,1664]],
  // 마지막 능선 아래
  ['ridge','ridge-east-extension',['hound',4520,1004]],
 ],
 5:[
  // 폭포 아랫길 입구
  ['low-entry','valley-floor',['hound',680,2620],['ghost',1220,2684]],
  // 낙수 옆 선반
  ['upper-crossfire','stage5-west-shoulder',['mourner',1100,2220],['shade',1920,1957]],
  // 받침 통나무
  ['pine-shot','stage5-fallen-log',['ghost',1340,2571]],
  // 동굴 앞 엄호
  ['cave-mouth','stage5-ritual-cave',['shade',3200,2280],['hound',3720,2323]],
  // 동굴 위 지킴이
  ['pine-shot','stage5-timber-high',['mourner',3200,1496]],
 ],
 18:[
  // 서쪽 진압정의 앞뒤
  ['court-west','sb-suppression-court',['picks',1240,4478]],
  // 후방 계단과 경계
  ['court-east','sb-court-rear-step',['picks',2140,4410]],
  // 진압정 위의 반향
  ['court-overwatch','sb-suppression-court',['bat',1440,4264]],
  // 폐쇄 사선
  ['court-overwatch','sb-court-rear-ledge',['bellCluster',1960,4230]],
  // 서쪽 사격점으로 올라가는 길
  ['west-rise','sb-west-upper-rise',['picks',1460,3540],['ghost',1840,3090]],
  // 서쪽 도르래 받침
  ['west-crown','sb-west-crown-bridge',['stoneLantern',2140,2170]],
  // 동쪽 반향 선반
  ['east-arc','sb-east-upper-arc',['bat',6680,2465]],
  // 아래 정비 통로
  ['maintenance-watch','sb-maintenance-return',['picks',2400,3990]],
  // 바닥 수레대
  ['lower-front','act2-floor',['minecart',2720,6402],['picks',3320,6467]],
  // 서쪽 감속 장치
  ['basin-west','act2-floor',['ghost',3840,6206]],
  // 종 아래 동쪽 축
  ['basin-east','act2-floor',['picks',5740,6440],['minecart',6000,6463]],
  // 생존자 쪽을 비운 바깥 접근로
  ['keeper-front','sb-east-gallery-sill',['picks',5320,5370]],
  // 수호자 측면 사선
  ['keeper-high','sb-east-gallery-roof',['stoneLantern',6120,4892]],
  // 동쪽 경사 퇴로
  ['keeper-flank','sb-east-inner-rise',['ghost',6800,5784]],
 ],
 25:[
  // 봉인 초소 앞
  ['seal-approach','gallery-0:collision:0',['picks',620,5400],['ghost',1480,5400]],
  // 수로의 낮은 창고
  ['maintenance-window-pressure','gallery-1:collision:0',['minecart',2380,4950],['picks',3080,4950]],
  // 계단 위 매복
  ['numbered-goods','west-maintenance-stairs:collision:0',['shade',1880,4331]],
  // 감시 방 사선
  ['inner-store','gallery-4:collision:0',['ghost',2140,3600]],
  // 장부를 회수하는 층
  ['inner-store','gallery-6:collision:0',['picks',2120,3150],['shade',2860,3150]],
 ],
 26:[
  // 기록실로 들어가는 마당
  ['record-room-remnants','a3-foundation',['ghost',680,2357],['picks',1480,2400]],
  // 기록실 지붕
  ['record-room-remnants','burial-record-earth-roof',['shade',1640,1978]],
  // 대장간 작업대
  ['casting-yard-tools','work-loft:collision:0',['picks',2660,2300]],
  // 동쪽 반출로
  ['casting-yard-tools','east-work-ramp:collision:0',['minecart',3560,2324]],
  // 증언지 바깥 귀환로
  ['surface-exit-remnants','a3-foundation',['ghost',5660,2410]],
 ],
 27:[
  // 입구 운반꾼
  ['entry-hauling-remnants','gallery-0:collision:0',['picks',620,4700],['ghost',1460,4700]],
  // 오르막 화물 사선
  ['lower-loading-store','entry-haul-stairs:collision:0',['minecart',2160,4413]],
  // 회수품을 지키는 초소
  ['lower-loading-store','gallery-1:collision:0',['shade',3020,4250],['picks',3340,4250]],
  // 물가와 반출로
  ['loading-return-pressure','gallery-2:collision:0',['ghost',5680,4850]],
  // 장부층 계단
  ['high-numbered-store','manifest-stairs:collision:0',['picks',2600,2743]],
  // 회랑 위 장부 경계
  ['sealed-manifest-store','gallery-5:collision:0',['shade',4680,3500]],
 ],
 32:[
  // 빈 포구 초입
  ['quay','approved32-entry',['hound',560,984],['ghost',1020,847]],
  // 서쪽 바위 그늘
  ['quay','approved32-west-rock',['mourner',540,1017]],
  // 배 밑 낮은 길
  ['lower','approved32-lower-lane',['hound',880,1165],['boar',1460,1291]],
  // 수풀 위 우회로
  ['upper','approved32-upper-alley',['shade',1660,775]],
  // 마당 진입 계단
  ['upper','approved32-upper-stair',['ghost',1820,615]],
  // 거주자 앞 통로를 비운 마당 경계
  ['yard','approved32-yard',['mourner',1880,1021],['hound',2260,1032],['shade',2560,1041]],
 ],
 36:[
  // 마을 입구 순라
  ['entry','approved36-entry',['hound',540,1231],['ghost',760,1277]],
  // 무너진 대장간 앞
  ['forge','approved36-workshop',['picks',880,1243],['mourner',1360,1254]],
  // 마을로 내려오는 계단
  ['yard','approved36-court',['hound',1540,1343],['boar',1820,1348]],
  // 안마당 후방
  ['yard','approved36-court',['shade',2280,1338],['ghost',2560,1323]],
  // 집 뒤 골목으로 돌아가는 길
  ['back','approved36-back-stair',['shade',1860,1040]],
  // 대문 경계
  ['house','approved36-house-stair',['picks',2060,1253]],
  // 처마 아래 경계
  ['house','approved36-house-front',['mourner',2340,1175],['ghost',2760,1185]],
 ],
};
function author(project){
 return {...project,stages:project.stages.map(stage=>{
  const n=stage.metadata?.stageId,groups=posts[n];
  if(!groups||stage.id!=='stage-'+n||!stage.metadata.campaign||stage.initialState?.honroOpeningCompanies===1)return stage;
  const units=[...stage.units], encounters=[...(stage.encounters??[])];
  const initialState={...stage.initialState,honroOpeningCompanies:1};
  for(const [i,[cell,support,...posts]] of groups.entries()){
   const group='watch-'+n+'-'+cell+'-'+(i+1),unitIds=[];
   for(const [j,[kind,x,y]] of posts.entries()){
    const id=group+'-'+(j+1),stageOverrides={group:120+i,awake:false,honroOpeningWatch:true,honroEncounterSupport:support};
    if(n===5)stageOverrides.honroStage5Cell=cell;
    if(n===18)Object.assign(stageOverrides,{honroDensityCell:cell,honroBellCell:cell,honroCohort:cell});
    units.push({id,kind,x,y,team:'enemy',facing:-1,encounterGroup:group,behavior:'guard',stageOverrides});
    unitIds.push(id);
   }
   encounters.push({id:group,key:group,behavior:'guard',unitIds});
  }
  if(Number.isInteger(initialState.honroAct3EncounterPopulationCap))initialState.honroAct3EncounterPopulationCap+=units.length-stage.units.length;
  return {...stage,units,encounters,initialState};
 })};
}
G.HonroOpeningCompanies={author};
})(globalThis);
