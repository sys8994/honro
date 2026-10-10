/** Fresh Stage22 encounter author. Existing battles never invoke this module.
 * Geometry/art remain independently authored; all counts below are candidates
 * until actual tactical and normal-resource gameplay have been reviewed. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {authorStage22VerticalGeometry,v22Pose,V22_NODES} from './stage22-vertical-geometry.mjs';
const clone=v=>JSON.parse(JSON.stringify(v));
export const V22_GROUPS=[
 {id:'seal-porch',zone:'A',support:'v22-lower-court',purpose:'봉인 앞 수비병과 서쪽 서리·궁귀 묶음. 봉인 작업 공간과 초기 후열을 압박한다.',members:[['a1','archiveFiend',520],['a2','possessedArcher',650],['a3','possessedGuard',760],['a4','possessedGuard',1250,true]]},
 {id:'lower-ramp',zone:'B',support:'v22-lower-court',purpose:'판문 뒤 경사 수비병, 계단 입구의 장부귀와 궁귀가 첫 반응 진입을 엄호한다.',members:[['b1','possessedGuard',1620],['b2','archiveFiend',1780],['b3','possessedArcher',2050],['b4','possessedGuard',2180,true]]},
 {id:'ledger-front',zone:'C',support:'v22-report-crossing',purpose:'사건 보고를 지키는 밀집 두 명과 판문 너머 사격수. 보고 작업점에서 위쪽 갤러리에 각도가 열린다.',members:[['c1','possessedGuard',1410],['c2','archiveFiend',1490,true],['c3','possessedArcher',1820]]},
 {id:'near-gallery',zone:'D',support:'v22-west-gallery',purpose:'먼 서쪽 끝을 청소시키지 않는 가까운 회랑 엄호조. 필수 동쪽 경사와 선택 서쪽 회귀 양쪽에서 접근할 수 있다.',members:[['d1','possessedArcher',1370],['d2','archiveFiend',1490],['d3','possessedGuard',1630]]},
 {id:'register-rise',zone:'E',support:'v22-east-register-rise',purpose:'호적각 아래 계단의 서로 다른 높이와 사선. 보고 반응의 위쪽을 엄호하지만 다른 층의 세 행동을 선점하지 않는다.',members:[['e1','possessedArcher',1910],['e2','archiveFiend',1990],['e3','possessedGuard',2075],['e4','possessedGuard',2180,true]]},
 {id:'register-court',zone:'F',support:'v22-register-mass',purpose:'호적 작업점의 두 명과 동쪽 돌아오르는 입구의 두 명. 서측 선택 경로에서 후방 각도를 잡을 수 있다.',members:[['f1','possessedGuard',1170],['f2','archiveFiend',1280,true],['f3','possessedArcher',1480],['f4','possessedGuard',1610]]},
 {id:'comparison-court',zone:'G',support:'v22-comparison-mass',purpose:'대조대의 근접 앞줄과 출구 방향 후열. 방어 종료 뒤 전원 청소나 추가 전투를 요구하지 않는다.',members:[['g1','possessedGuard',2320],['g2','archiveFiend',2440,true],['g3','possessedArcher',2740],['g4','possessedGuard',2870]]}
];
export const V22_ACTIVATION={
 'seal-porch':{supports:['v22-lower-court'],radius:1000,maxHeight:420},
 'lower-ramp':{supports:['v22-lower-court','v22-report-approach'],radius:1200,maxHeight:800},
 'ledger-front':{supports:['v22-report-approach','v22-report-crossing','v22-west-gallery'],radius:1000,maxHeight:700},
 'near-gallery':{supports:['v22-report-crossing','v22-west-gallery'],radius:1000,maxHeight:650},
 'register-rise':{supports:['v22-report-crossing','v22-east-register-rise','v22-register-mass'],radius:1100,maxHeight:600,crossCover:[{targetSupport:'v22-west-gallery',kinds:['possessedArcher','archiveFiend'],direction:'down',radius:1100,maxHeight:1000}]},
 'register-court':{supports:['v22-east-register-rise','v22-register-mass','v22-comparison-mass'],extra:[{support:'v22-west-gallery',maxX:720}],radius:1150,maxHeight:650},
 'comparison-court':{supports:['v22-comparison-mass'],radius:1200,maxHeight:600},
 'seal-response':{supports:['v22-lower-court','v22-report-approach'],radius:1400,maxHeight:800},
 'ledger-response':{supports:['v22-report-crossing','v22-east-register-rise'],radius:1500,maxHeight:700},
 'register-response':{supports:['v22-register-mass','v22-comparison-mass'],radius:1200,maxHeight:800},
 'comparison-lanterns':{supports:['v22-comparison-mass'],radius:1500,maxHeight:650}
};
function row(kind,support,x,{air=false,lift=0,cell,role='response',...rest}={}){const p=v22Pose(support,x);return{kind,x,y:p.y-lift,support,air,activationCell:cell,role,elite:false,...rest};}
export function v22Entries(){
 const ground=(kind,support,xs,cell)=>xs.map(x=>row(kind,support,x,{cell}));
 return{
 'act3-response-22-0':{side:'east-lower',warning:'봉인 너머 동쪽 석축에서 장부귀 둘이 다가옵니다. 다음 행동 동안 계단 입구를 대비하세요.',members:ground('archiveFiend','v22-lower-court',[2475,2625],'seal-response'),alternates:[{side:'east-lower',members:ground('archiveFiend','v22-lower-court',[2890,3040],'seal-response')}],purpose:'봉인 뒤 같은 하층 동쪽 평면에서 B 계단 입구까지 사격·접근한다.'},
 'act3-response-22-1':{side:'east-report',warning:'보고고 동쪽 석축에서 장부귀 셋이 나옵니다. 다음 행동 동안 호적각 아래 길을 살피세요.',members:ground('archiveFiend','v22-report-crossing',[2520,2670,2820],'ledger-response'),alternates:[{side:'east-report',members:ground('archiveFiend','v22-report-crossing',[2640,2790,2940],'ledger-response')}],purpose:'보고를 얻은 뒤 반드시 거치는 같은 석축 E 점프 입구 옆을 압박한다.'},
 'act3-response-22-2':{side:'west-comparison',warning:'위 대조마당 서쪽에서 궁귀 둘이 활을 듭니다. 다음 행동 동안 올라갈 돌턱을 살피세요.',members:ground('possessedArcher','v22-comparison-mass',[2030,2180],'register-response'),alternates:[{side:'west-comparison',members:ground('possessedArcher','v22-comparison-mass',[2065,2215],'register-response')}],purpose:'호적 회수 직후 다음 필수 목적지의 서쪽 접근면에 자리한다. 탈출 후 청소 파동이 아니다.'},
 'act3-compare-ledgers':{side:'east-air',warning:'대조대 동쪽 처마의 등불 둘이 흔들립니다. 다음 행동 동안 위쪽 사선을 대비하세요.',members:[row('lantern','v22-comparison-mass',2700,{air:true,lift:260,cell:'comparison-lanterns'}),row('lantern','v22-comparison-mass',2860,{air:true,lift:330,cell:'comparison-lanterns'})],alternates:[{side:'east-air',members:[row('lantern','v22-comparison-mass',2690,{air:true,lift:450,cell:'comparison-lanterns'}),row('lantern','v22-comparison-mass',2860,{air:true,lift:530,cell:'comparison-lanterns'})]}],purpose:'실제 공중 몸 전체로 진입하는 혼불 사격. 공중 좌표만으로 같은층 contest를 주장하지 않는다.'}
 };
}
export async function authorStage22Vertical(project,g){
 const original=project.stages.find(s=>s.metadata?.stageId===22),before=JSON.stringify(project.stages.filter(s=>s.metadata?.stageId!==22)),steps=clone(original.initialState.honroAct3Steps);
 if(steps.map(s=>s.id).join(',')!=='archive-seal,ledger-case,upper-register,compare-ledgers,archive-exit')throw Error('Stage22 requires the revised original five-step contract');
 const p=authorStage22VerticalGeometry(g,project),s=p.stages.find(s=>s.metadata.stageId===22),places=[];let index=0;
 for(const group of V22_GROUPS){const members=group.members.map(([id,kind,x,elite=false])=>{const p=v22Pose(group.support,x),u={id:'v22-'+id,kind,team:'enemy',x:p.x,y:p.y,facing:-1,spawnIndex:index++,behavior:'patrol',encounterGroup:'v22-group-'+group.id,stageOverrides:{honroAct3Encounter:1,honroAct3Elite:elite,honroVertical22Cell:group.id,honroEncounterRole:group.id,honroEncounterSupport:group.support,honroCohort:group.zone}};s.units.push(u);return{id:u.id,kind,x:u.x,y:u.y,support:group.support,elite};});s.encounters.push({id:'v22-group-'+group.id,key:'v22-group-'+group.id,behavior:'patrol',unitIds:members.map(u=>u.id)});places.push({id:group.id,zone:group.zone,purpose:group.purpose,members});}
 const entries=v22Entries();
 for(const ev of s.events){const at=entries[ev.id];if(!at)continue;const m=at.members[Math.floor(at.members.length/2)],x=at.members.reduce((n,m)=>n+m.x,0)/at.members.length,y=v22Pose(m.support,x).y;
  if(ev.action.source!==ev.id||ev.action.n!==at.members.length||!at.members.every(m=>m.kind===ev.action.kind))throw Error('Stage22 finite response contract mismatch '+ev.id);
  ev.warning=at.warning;ev.text='증원 진입 · '+at.warning;ev.entry={x,y,support:m.support,side:at.side};ev.action={...ev.action,x,y,support:m.support,maxDistance:0,honroVertical22Response:1};ev.honroVertical22Response=1;
 }
 Object.assign(s.initialState,{honroAct3Steps:steps,honroActiveLimit:3,honroVerticalStage22EncounterRevision:1,honroVerticalStage22PopulationCap:35,honroVerticalStage22Activation:clone(V22_ACTIVATION),honroVerticalStage22Spec:{entries}});
 s.design.vertical22.status='encounter-draft-not-gameplay-approved';s.design.vertical22.scope='Fresh role composition and safe finite-entry runtime candidate. Existing five objectives, two gates, action limit3, finite responses7 + defence2 and XP ceiling preserved. Combat, art, App/browser and normal-resource completion remain separately reviewed.';
 s.design.vertical22.encounters={groups:places,initial:26,elites:6,finiteResponses:7,finiteDefense:2,populationCap:35,activeLimit:3};
 s.design.space.encounterSites=places.flatMap(group=>group.members.map(u=>({id:u.id+'-site',roomId:'v22-'+group.zone,unitId:u.id,surfaceId:u.support,x:u.x,y:u.y})));
 s.design.act3.responses={revision:1,finiteCount:7,entries:Object.entries(entries).filter(([id])=>id!=='act3-compare-ledgers').map(([id,e])=>({id,side:e.side,purpose:e.purpose,members:clone(e.members)}))};
 const wave=s.markers.find(m=>m.id==='wave-compare-ledgers');Object.assign(wave,v22Pose('v22-comparison-mass',2780));
 const out=g.HonroMaps.finalize(g.HonroTerrainDomain.author(p));if(JSON.stringify(out.stages.filter(s=>s.metadata?.stageId!==22))!==before)throw Error('Vertical22 changed another stage');return out;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const{runtime}=await import('../../game/tests/helpers.mjs'),g=await runtime({legacyMaps:false}),p=await authorStage22Vertical(JSON.parse(await readFile('shared/data/campaign.json','utf8')),g);await writeFile('shared/data/campaign.json',JSON.stringify(p,null,2)+'\n');console.log('Authored fresh Stage22 encounter candidate; other29 exact.');}
