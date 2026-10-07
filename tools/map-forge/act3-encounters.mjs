/** Authored encounter spaces, not a distance/grid population generator.
 * A row chooses its exact place and role. Terrain support may adjust only Y;
 * body clearance failure rejects the row instead of silently scattering it.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {support} from './act3-map-kit.mjs';
import {LOCATION_ENCOUNTERS} from './act3-location-encounters.mjs';
const unit=(kind,x,y=null,elite=false,role='frontline')=>({kind,x,y,elite,role});
const h=(x,y,e=false)=>unit('hound',x,y,e),p=(x,y,e=false)=>unit('picks',x,y,e),
 l=(x,y,e=false)=>unit('lantern',x,y,e,'ranged'),g=(x,y,e=false)=>unit('ghost',x,y,e),
 f=(x,y,e=false)=>unit('possessedGuard',x,y,e),a=(x,y,e=false)=>unit('possessedArcher',x,y,e,'ranged');
const group=(id,purpose,anchor,members)=>({id,purpose,anchor,members});
export const ENCOUNTERS={
 21:[
  group('wagon-cordon','수레 동쪽 들림을 먼저 밀어 주민에게 접근한다. 서쪽 구조 진입면은 비운다.','gate-resident',[h(1260),p(1390,null,true),h(1730),l(1880)]),
  group('gate-watch','성문 하부 문지기와 계단으로 접근 가능한 성벽 사격조를 분리한다.','refuge-hold',[p(2390,null,true),h(2700),l(2750,1960),l(3240,1960)]),
  group('market-pack','성문 뒤 빈 구간을 건넌 뒤 찻집 앞 군집과 교전한다.','tea-market',[h(3970,null,true),h(4125),l(4350)]),
  group('stable-tools','마구간 출입구의 들린 도구와 측면 짐승을 함께 상대한다.','east-stables',[p(4700),h(4820),p(4945)]),
  group('office-rearguard','관아 진입부 문지기 뒤에 사격 지원을 놓고 마지막 이동 구간은 비운다.','office-porch',[p(5330,null,true),h(5465),l(5685),l(5800)])
 ],
 22:[
  group('lower-stair-ward','봉인을 연 뒤 첫 계단의 아래와 위를 지키는 서고 혼을 만난다.','archive-west-stairs',[g(1350,2633,true),g(1515,2559),l(1790,2436),g(1930,2373)]),
  group('ledger-keepers','장부함 양쪽의 수호군과 상층 회랑 사격조. 장부 바로 위 층은 다른 교전면이다.','ledger-case',[g(2220,2360),g(2375,2360,true),l(2580,2360),g(2720,2360),l(2680,1800)]),
  group('cross-gallery','선택 상층 회랑의 사격조는 아래층 통로 적과 같은 무리로 묶지 않는다.','archive-attic-gallery',[l(3440,1800,true),g(3620,1800),l(3930,1800)]),
  group('upper-stair-ward','위층 걸쇠 뒤 동쪽 계단을 오르며 근접 수호군과 교전한다.','archive-east-stairs',[g(3650,2243),g(3795,2176),l(4080,2042),g(4220,1977)]),
  group('comparison-keepers','대조 책상 양옆과 출구 쪽 후위. 책상 바로 위 새 스폰은 금지한다.','compare-ledgers',[g(4520,1940,true),g(4680,1940),l(4920,1940),g(5080,1940)])
 ],
 23:[
  group('quay-gate','하역문 너머 다리 입구의 수비병 악귀와 뒤쪽 궁수를 제압한다.','cargo-gate',[f(1550,2600,true),f(1690,2600),a(1970,2600),f(2130,2600)]),
  group('dispatch-guard','운송 묶음 가까운 기록 수비병. 살아 있는 운반인 주위는 비운다.','dispatch-bundle',[f(2670,2730),f(2827,2730,true),a(2930,2730),a(2380,2324)]),
  group('bridge-intercept','호송 석교의 입구를 막는 근접대와 교면 뒤쪽 궁수.','grand-convoy-quay',[f(3740,2630,true),f(3860,2630),f(4050,2630),a(4350,2630),a(4480,2630)]),
  group('customs-flank','호송길 중간 세관 앞 전후 차단. 지붕의 등불귀는 별도 높이를 쓴다.','dock-mid',[f(5202,2730,true),f(5330,2730),a(5500,2730),l(5230,1851)]),
  group('east-landing','동쪽 하역교의 마지막 차단선. 교량 후방까지 관통하는 일렬 적을 만들지 않는다.','east-convoy-quay',[f(6090,2600,true),f(6220,2600),a(6500,2600),f(6760,2600),a(6910,2600)])
 ],
 24:[
  group('courtyard-watch','가문 문장으로 올라가는 안뜰 계단의 전위와 후위.','family-crest',[g(1670,null,true),g(1830),l(2050),g(2190)]),
  group('crest-ward','문장 주변의 수호 혼과 서재 쪽 사격 지원.','family-main-hall',[g(2500,null,true),g(2670),l(2860),g(3030)]),
  group('pond-watch','정원 다리를 건너기 전 연못 쪽 수호군. 양쪽 경사 구간은 여백으로 둔다.','garden-pavilion',[g(3930),l(4145),g(4325)]),
  group('shrine-door-watch','사당 봉인 동쪽 접근을 지키는 정예와 보조 혼.','shrine-seal',[g(5220,null,true),g(5310),l(5520)]),
  group('register-ward','토지 장부의 수호군. 마지막 퇴로에는 추가 무리를 놓지 않는다.','land-register',[g(5900,null,true),g(6050),l(6280),g(6430)])
 ],
 25:[
  group('record-door','숨은 기록실 첫 계단 문지기.','hidden-latch',[f(1510,null,true),f(1660),a(1940),f(2080)]),
  group('record-defense','기록함 전면 수비병과 뒤 사격조를 먼저 몰아내 방어 지점을 확보한다.','archive-hold',[f(2500,null,true),f(2650),a(2890),f(3080)]),
  group('intrusion-corridor','외부 증원이 들어오는 회랑 전위. 진입 마커와 개체 스폰은 구분한다.','wave-archive-hold',[f(3450),f(3620),a(3790),f(3950)]),
  group('rear-stair-watch','뒷문 너머 오름길 차단과 높은 계단 끝 궁수.','rear-latch',[f(4690,null,true),f(4820),a(5020),a(5190)]),
  group('exit-rearguard','기록실 마지막 방에서 문서를 되찾으려는 후위.','back-exit',[f(5430,null,true),f(5570),a(5775),f(5910)])
 ],
 26:[
  group('resident-cordon','주민 서쪽 접근로는 비워 두고 공방 문 너머의 들린 도구만 모은다.','artisan-resident',[p(1430),p(1570,null,true),l(1760)]),
  group('kiln-entry','주조 작업장 계단 위의 무거운 도구와 원거리 등불.','kiln-stair-shed',[p(2530),p(2670),l(2920),p(3070)]),
  group('ledger-defense','젖은 장부를 지킬 주조대 양옆. 밀집 구간과 동쪽 증원 통로를 분리한다.','ledger-drying',[p(3290,null,true),p(3450),l(3700),p(3890),l(4020)]),
  group('mill-channel','물길 동쪽 공방에서 기록 대조 장소를 지키는 도구 무리.','casting-tally',[p(5150,null,true),p(5290),l(5520),p(5660)]),
  group('kiln-rearguard','마지막 가마 오름길의 차단군. 주민 옆 재등장은 없다.','hill-side-kiln',[p(6230,null,true),p(6390),l(6660),p(6800)])
 ],
 27:[
  group('fire-control-watch','불길 제한시간 전 두 명만 배치해 차단막 접근 여지를 유지한다.','fire-screen',[f(1804),a(1960)]),
  group('petition-guard','청원서를 지우려는 수비병과 후방 궁수.','petition-record',[f(2300,null,true),f(2470),a(2710),f(2870)]),
  group('high-gallery-watch','기록 운반인에게서 떨어진 높은 회랑의 차단군.','high-record-gallery',[f(3710,null,true),f(3880),a(4130),a(4290)]),
  group('roof-crossing','내리막 뒤 지붕 교차점에서 근접과 사격 압박을 바꾼다.','rear-roof-gallery',[f(4890,null,true),f(5070),a(5300),f(5480)]),
  group('escape-rearguard','마지막 경사로 전 차단군. 탈출 집결면은 비운다.','outer-guard-house',[f(5860,null,true),f(6010),a(6190),f(6350)])
 ],
 28:[
  group('wall-gate-watch','외청으로 오르는 성벽 계단의 문지기와 상단 궁수.','wall-stair-tower',[f(1360,null,true),f(1510),a(1780),f(1930)]),
  group('closure-record-guard','폐쇄 승인문을 둘러싼 수비병과 사격 지원.','closure-order',[f(2260,null,true),f(2390),f(2570),a(2820),a(2960)]),
  group('court-crossfire','두 기록각 사이 마당을 장악한 수비병 무리.','archive-cross-court',[f(3560),f(3720),a(3960),f(4110)]),
  group('suppression-guard','은폐 기록실의 정예 호위와 퇴로 궁수.','suppression-order',[f(4330,null,true),f(4470),f(4650),a(4830),a(5010)]),
  group('passage-rearguard','마지막 성벽 회랑 수비대. 증원은 동쪽 문을 통해서만 진입한다.','passage-hold',[f(5850,null,true),f(6020),a(6270),f(6460,null,true),a(6680),f(6860)])
 ],
 29:[
  group('seal-response','봉인 해체 지점 동쪽 경사에 남은 경비대. 담허 시작 위치를 막지 않는다.','old-seal',[f(1480,null,true),f(1630),a(1850),f(2000)]),
  group('letter-guard','현묵의 글을 감춘 창고 수호군.','hyeonmuk-letter',[f(2410,null,true),f(2570),f(2770),a(2990),a(3170)]),
  group('lock-basin-watch','수문 아래 굽이의 작업길 차단. 반대편 경사까지 균등하게 채우지 않는다.','sluice-chain',[f(4120),f(4280),a(4542),f(4700)]),
  group('sluice-stair-watch','수문 오름길과 정자 입구의 정예 경비.','great-sluice-pavilion',[f(5450,null,true),f(5610),a(5850),f(6020)]),
  group('night-rearguard','나루 퇴로를 막는 마지막 무리와 동쪽 증원 경로.','flight-hold',[f(6250,null,true),a(6420),f(6580,null,true),a(6770),f(6910)])
 ],
 30:[
  group('ferry-approach','운송로를 읽은 뒤 나루로 오르는 길에 모인 들림.','transport-map',[h(1760),h(1900),p(2120,null,true),l(2290)]),
  group('loading-guard','출구 고정점 양옆의 하역장 무리. 상단 처마를 엄폐로 쓴다.','route-pin',[p(2520,null,true),h(2690),l(2870),h(3190)]),
  group('east-loading-pack','다리 끝 창고 앞 무리와 뒤쪽 등불. 다리 전체를 적으로 채우지 않는다.','east-loading-house',[h(3640),p(3790),l(4050),h(4220)]),
  group('ferry-defense','나루를 지키기 전에 제거할 정예 도구와 주변 들림.','ferry-hold',[p(4670,null,true),h(4830),l(5130),h(5280)]),
  group('old-road-watch','옛길 오름길의 마지막 차단. 네 동행이 모일 평지는 비운다.','old-road-shelter',[h(5960),p(6110,null,true),l(6330),h(6470)])
 ]};
function routeY(s,x){const route=s.design.act3.primaryContour?.map(([x,y])=>({x,y}))||s.design.act3.requiredRoute;for(let i=1;i<route.length;i++)if(x<=route[i].x){const a=route[i-1],b=route[i],t=(x-a.x)/(b.x-a.x||1);return a.y+(b.y-a.y)*t;}return route.at(-1).y;}
export function authorEncounters(g,p,s){
 const location=s.design.act3.locationRevision===1,plan=(location?LOCATION_ENCOUNTERS:ENCOUNTERS)[s.metadata.stageId];if(!plan)return;
 const ts=g.HonroMaps.compile(s,p).terrain.filter(t=>!t.honroAct3Target&&!t.honroAct3Gate);
 s.units=s.units.filter(u=>u.team!=='enemy');s.encounters=[];
 for(const q of plan){const ids=[];for(const [i,row] of q.members.entries()){
  const ref=row.y??routeY(s,row.x),spot=support(g,ts,row.x,ref);if(!spot||Math.abs(spot.y-ref)>145)throw Error(`${s.id}/${q.id}/${i}: invalid authored support (${ref} -> ${spot?.y})`);
  const id=`a3-${s.metadata.stageId}-${q.id}-${i}`;if(g.HonroWorld.archetypes[row.kind]?.flying)spot.y-=32;ids.push(id);s.units.push({id,kind:row.kind,team:'enemy',x:spot.x,y:spot.y,facing:-1,spawnIndex:s.units.filter(u=>u.team==='enemy').length,behavior:'patrol',encounterGroup:q.id,stageOverrides:{honroCohort:q.id,honroAct3Encounter:1,honroAct3Elite:row.elite,honroEncounterRole:row.role,honroEncounterSupport:spot.support}});
 }s.encounters.push({id:q.id,key:q.id,behavior:'patrol',unitIds:ids});}
 s.initialState.honroAct3EncounterRevision=1;
 if(location&&[25,26].includes(s.metadata.stageId))s.initialState.honroActiveLimit=2;
 s.design.act3.encounterPlan={version:1,groups:plan.map(q=>({id:q.id,purpose:q.purpose,anchor:q.anchor})),initial:plan.reduce((n,q)=>n+q.members.length,0),elites:plan.reduce((n,q)=>n+q.members.filter(u=>u.elite).length,0),activeLimit:location&&[25,26].includes(s.metadata.stageId)?2:3,scope:location?'Approved location-specific groups; 25/26 authored for two heroes with staggered sightlines. Normal continuous balance remains a required check.':'Four-person baseline. Re-author these spaces if approved team split or terrain changes. Existing objectives, wave counts and live saves remain unchanged.'};
}
export function applyEncounters(g,p){for(const s of p.stages.filter(s=>s.metadata.stageId>=21))authorEncounters(g,p,s);return p;}
if(process.argv[1]===fileURLToPath(import.meta.url)){const {runtime}=await import('../../game/tests/helpers.mjs'),g=await runtime({legacyMaps:false}),p=JSON.parse(await readFile('shared/data/campaign.json','utf8'));applyEncounters(g,p);await writeFile('shared/data/campaign.json',JSON.stringify(p,null,2)+'\n');console.log(p.stages.slice(20).map(s=>({id:s.id,...s.design.act3.encounterPlan,groups:undefined})));}
