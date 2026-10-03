(function(G){'use strict';
// Revision 2 is a fresh expedition. Battles already saved with revision 1 keep
// their old objectives and geometry; a retry starts the new authored route.
const H=G.HONRO_CONTENT,clone=x=>JSON.parse(JSON.stringify(x));
G.HonroAct2Content.legacySteps=H.stages.slice(10,20).map(s=>clone(s.steps));
const clear=(id,label,cohorts='all')=>({id,label,kind:'clear',cohorts});
const hold=(id,label,rounds,wave,requiredClass)=>({id,label,kind:'hold',rounds,wave,requiredClass,radius:680,contestRadius:260});
const wave=(kind,count,eliteEvery=4)=>({kind,count,eliteEvery});
const plans=[
 {size:[7800,4800],initial:18,active:4,eliteEvery:5,rounds:[30,48],lamps:[],
  sequence:['knot-west',clear('clear-west','서쪽 매듭을 덮친 들림 제압','west'),'knot-east',hold('hold-knots','소단의 매듭 해체를 지키기',4,wave('echo',6)),'resident',clear('clear-road','산길에 남은 들림 모두 제압'),'trace'],
  sites:{'knot-west':[1600],'clear-west':[1850],'knot-east':[3550],'hold-knots':[3550],resident:[5580],'clear-road':[6350],trace:[7260]}},
 {size:[8400,5200],initial:20,active:4,eliteEvery:5,rounds:[30,48],lamps:[],
  sequence:[clear('clear-approach','채석장 진입로 확보','west'),'rock-pin','sign',hold('hold-road','복구 중인 길표와 후방 지키기',4,wave('minecart',8)),clear('clear-quarry','채석장 들린 도구 전부 제압'),'exit'],
  sites:{'clear-approach':[1900],'rock-pin':[3000],sign:[4620],'hold-road':[4620],'clear-quarry':[6500],exit:[7920]}},
 {size:[8200,6600],initial:22,active:4,eliteEvery:4,rounds:[44,70],lamps:[],
  sequence:[clear('clear-entry','석문 앞 작업조 제압','west'),'resident','door-pin','gate',hold('hold-gate','석문 통로를 지켜 피난 시간 확보',5,wave('picks',8)),clear('clear-depth','안쪽 회랑 전부 제압'),'exit'],
  sites:{'clear-entry':[1500],resident:[2100],'door-pin':[3620],gate:[4220],'hold-gate':[4420],'clear-depth':[6500],exit:[7700]}},
 {size:[8600,7600],initial:24,active:4,eliteEvery:4,rounds:[55,88],lamps:[],
  sequence:[clear('clear-upper','상층 가옥의 들린 도구 제압','west'),'family-upper',clear('clear-middle','중층 장터 확보','middle'),'family-mid','family-lower','bridge',hold('hold-refuge','피난 다리에서 주민을 지키기',6,wave('picks',12)),clear('clear-village','마을에 남은 들림 전부 제압')],
  sites:{'clear-upper':[2000],'family-upper':[2600],'clear-middle':[4900],'family-mid':[5650],'family-lower':[5050,'lower'],bridge:[1850,'lower'],'hold-refuge':[2100,'lower'],'clear-village':[2850,'lower']}},
 {size:[8000,6000],initial:22,active:4,eliteEvery:4,rounds:[33,53],lamps:[],
  sequence:[clear('clear-water','수문을 지키는 수차와 도구 제압','west'),'sluice',hold('hold-sluice','역류가 잦아들 때까지 수문 지키기',4,wave('picks',8)),'shaft-pin',clear('clear-gallery','수갱 아래 작업조 전부 제압'),'groove','exit'],
  sites:{'clear-water':[1700],sluice:[2400],'hold-sluice':[2550],'shaft-pin':[4060],'clear-gallery':[5820],groove:[6360],exit:[7510]}},
 {size:[8200,6600],initial:24,active:4,eliteEvery:4,rounds:[70,130],lamps:[],
  sequence:[clear('clear-court','잠운사 앞마당 정예 제압','west'),'monk','hall',hold('hold-hall','승려가 기록함을 여는 동안 법당 방어',5,wave('stoneLantern',10)),'record',clear('clear-temple','후원과 회랑의 들림 전부 제압'),'witness'],
  sites:{'clear-court':[1850],monk:[2500],hall:[3900],'hold-hall':[4140],record:[5280],'clear-temple':[6500],witness:[7460]}},
 {size:[8400,6800],initial:24,active:3,eliteEvery:4,rounds:[52,84],lamps:[],
  sequence:[clear('clear-works','버팀목 작업장 확보','west'),'brace','collapse-pin','hoist','repair',hold('hold-hoist','인양축이 돌아가는 동안 작업장 방어',5,wave('minecart',10)),clear('clear-lift','인양로의 잔존 들림 전부 제압'),'notes'],
  sites:{'clear-works':[1800],brace:[2500],'collapse-pin':[3320],hoist:[4380],repair:[5250],'hold-hoist':[5400],'clear-lift':[6600],notes:[7840]}},
 {size:[10400,7600],initial:28,active:3,eliteEvery:4,rounds:[80,126],lamps:[3100],
  sequence:[clear('clear-wards','공명진을 둘러싼 정예 제압','west'),'silence',hold('hold-silence','공명 역류를 견디며 억제진 유지',4,wave('bellCluster',8),'mage'),'upper-chain','lower-chain','leak','keeper',clear('clear-bell','종에서 쏟아진 잔여 들림 제압')],
  sites:{'clear-wards':[2400],silence:[3350],'hold-silence':[3350],'upper-chain':[4850],'lower-chain':[6110],leak:[7260],keeper:[8500],'clear-bell':[9220]},
  bossWave:wave('picks',4,2)},
 {size:[10400,7600],initial:18,active:3,eliteEvery:4,rounds:[44,70],lamps:[3000,7800],
  sequence:['route','separate-1',hold('hold-first','첫 이름이 길을 찾을 때까지 천도진 유지',3,wave('echo',3),'occultist'),'send-1','separate-2',hold('hold-second','두 번째 혼군집의 역류 막기',3,wave('resonance',3),'occultist'),'send-2','separate-3',hold('hold-last','마지막 혼군집의 길을 지키기',4,wave('bellCluster',4),'occultist'),'send-3',clear('clear-souls','천도길에 남은 원혼 전부 제압'),'old-soul'],
  sites:{route:[1750],'separate-1':[3050],'hold-first':[3050],'send-1':[3260],'separate-2':[4900],'hold-second':[4900],'send-2':[5120],'separate-3':[6940],'hold-last':[6940],'send-3':[7150],'clear-souls':[8480],'old-soul':[9470]}},
 {size:[9000,5800],initial:18,active:3,eliteEvery:4,rounds:[30,48],lamps:[],
  sequence:[clear('clear-mouth','출구의 매복조 제압','west'),'exit-pin','escort',{id:'escort-mid',label:'생존자 행렬을 중간 쉼터까지 호송',kind:'escort'},hold('hold-convoy','부상자가 쉬는 동안 쉼터 방어',4,wave('minecart',6)),clear('clear-pass','마지막 산길 매복조 전부 제압'),'escape'],
  sites:{'clear-mouth':[1700],'exit-pin':[2740],escort:[3240],'escort-mid':[5200],'hold-convoy':[5200],'clear-pass':[7120],escape:[8430]},
  progressWave:wave('picks',4,2)}
];
for(const [i,p] of plans.entries()){
 const st=H.stages[i+10],old=Object.fromEntries(st.steps.map(s=>[s.id,s]));
 p.id=i+11;p.revision=2;p.waveCount=p.sequence.reduce((n,s)=>n+(s.wave?.count||0),0)+(p.bossWave?.count||0)+(p.progressWave?.count||0);
 p.expectedMinutes=p.rounds.map(r=>Math.round(r*1.35+5));
 st.steps=p.sequence.map(s=>typeof s==='string'?clone(old[s]):clone(s));
 st.w=p.size[0];st.h=p.size[1];st.active=p.active;st.enemies=p.initial;st.act2Plan=p;
 st.guide+=' 거점 제압은 지정 구역의 모든 적을 쓰러뜨려야 완료됩니다. 방어 목표는 표시된 범위 안에서 필요한 인물이 살아 있어야 진행되며, 적이 진 안에 들어오면 진행이 멎습니다.';
}
G.HonroAct2Plan={revision:2,stages:plans,forStage:id=>plans[id-11]};
})(globalThis);
