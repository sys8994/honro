/** Fresh authoring only. Explicit occupied places and empty links, never an X-grid.
 * Existing member IDs, objective/event contracts and runtime stat/XP tuning survive.
 * Called after each place author because that author owns the final support shapes. */
import {YARD_DENSITY_GROUPS,YARD_DENSITY_ROSTER} from './stage23-density-roster.mjs';
import {FERRY_DENSITY_GROUPS,FERRY_DENSITY_ROSTER} from './stage30-density-roster.mjs';
import {authorStage22PlaceEncounters} from './apply-stage22-vertical.mjs';
// Baseline 397fc01 fresh-entry totals. The runtime derives HP/attack with its
// existing tuning, then divides those same totals over the denser initial roster.
// Finite waves and the stage XP ceiling are independent and remain unchanged.
export const INITIAL_BUDGET_ROSTERS={
 21:{hound:6,'picks*':3,lantern:6,'hound*':1,picks:2},
 24:{'archiveFiend*':4,archiveFiend:9,lantern:5},
 25:{picks:3,'lantern*':1,'picks*':1,lantern:3,minecart:1,crow:1},
 26:{'possessedGuard*':1,possessedArcher:2,picks:3,minecart:2,'lantern*':1,'picks*':1,lantern:2,crow:1},
 27:{minecart:1,lantern:4,'minecart*':1,picks:1,'possessedGuard*':1,'picks*':1,crow:1},
 28:{possessedGuard:3,possessedArcher:5,'possessedGuard*':3},
 29:{'possessedGuard*':5,possessedGuard:10,possessedArcher:7}
};
const m=(kind,x,support='a3-foundation',elite=false,cell,airY)=>({kind,x,support,elite,cell,airY});
const q=(id,purpose,anchor,members)=>({id,purpose,anchor,members});
export const PLACE_ENCOUNTERS={
 21:[
  q('wagon-cordon','수레 서쪽 구조면과 주민 몸을 비우고 동쪽 문간에 짐승·도구를 결집한다.','gate-resident',[
   m('hound',1830),m('picks',1995,undefined,true),m('hound',2075),m('lantern',2310),m('hound',2190)]),
  q('gate-watch','홍예 아래 전위와 성벽 위 사수는 독립 경계조다. 성문 뒤 긴 연결길은 비운다.','refuge-hold',[
   m('picks',2400,undefined,true),m('hound',2490),m('lantern',2235,'gate:collision:0',false,'gate-watch-upper'),m('lantern',2640,'eup21-east-wall-return',false,'gate-watch-upper'),m('picks',2780),m('hound',2990)]),
  q('market-pack','장터 입구 세 짐승과 실제 하역마루 위 정예·등불이 아래 길과 위 우회를 함께 지킨다.','tea-market',[
   m('hound',3920,undefined,true),m('hound',4000),m('lantern',4195,'loading-deck:collision:0',false,'market-pack-deck'),m('hound',4210),m('picks',4445,'loading-deck:collision:0',true,'market-pack-deck')]),
  q('stable-tools','마구간 서쪽 단독 도구와 문간의 짐승·도구, 동쪽 등불을 서로 다른 간격에 둔다. 관아까지 경사는 여백이다.','east-stables',[
   m('picks',4625),m('hound',4775),m('picks',4850),m('lantern',4990)]),
  q('office-rearguard','기단 정예와 바로 뒤 사격조, 아래 골목의 짐승을 다른 높이로 나눈다. 출구 평지는 비운다.','office-porch',[
   m('picks',5280,'office-plinth:collision:0',true,'office-rearguard-plinth'),m('hound',5430),m('lantern',5490,'office-plinth:collision:0',false,'office-rearguard-plinth'),m('lantern',5780),m('picks',5370,'office-plinth:collision:0',false,'office-rearguard-plinth'),m('hound',5555)])
 ],
 24:[
  q('empty-court-watch','종택 서쪽 문간 전위 셋과 실제 낮은 처마의 등불. 긴 바깥길은 비운다.','family-crest',[
   m('archiveFiend',1465,undefined,true),m('archiveFiend',1640),m('lantern',1650,'family24-hall-west-step',false,'empty-court-upper'),m('archiveFiend',1820),m('possessedArcher',1760,'family24-hall-west-step',false,'empty-court-upper')]),
  q('crest-room-watch','가문 문장 동쪽에 결집한 수호군과 측면 처마 사수. 문장 앞 작업면은 남긴다.','family-main-hall',[
   m('archiveFiend',2230,undefined,true),m('archiveFiend',2310),m('lantern',2940,undefined,false,'crest-room-upper',2300),m('archiveFiend',2495),m('possessedArcher',2720,'family24-hall-east-step',false,'crest-room-upper')]),
  q('abandoned-garden-watch','가라앉은 정원 전위 셋과 그 바로 위 회랑의 정예 등불과 떨어진 사수. 양쪽 연결 경사는 비운다.','abandoned-study',[
   m('archiveFiend',3290),m('lantern',3720,'family24-garden-gallery',true,'garden-upper'),m('archiveFiend',3370),m('archiveFiend',3555),m('possessedArcher',3940,'family24-garden-gallery',false,'garden-upper'),m('hound',3700)]),
  q('shrine-approach','봉인 서쪽 문지기와 동쪽 사당 퇴칸의 지원조를 나눈다. 봉인 바로 위는 비운다.','shrine-seal',[
   m('archiveFiend',4290,undefined,true),m('archiveFiend',4110),m('lantern',5230,'family24-shrine-east-porch',false,'shrine-upper'),m('possessedArcher',5320,'family24-shrine-east-porch',true,'shrine-upper'),m('archiveFiend',4870)]),
  q('land-register-watch','동쪽 갈림마당의 단독 경계와 밀집 호위·후위 등불. 수로 입구와 지상 출발 평지는 비워 서로 다른 퇴로를 남긴다.','land-register',[
   m('archiveFiend',6040,undefined,true),m('archiveFiend',6120),m('lantern',6500),m('archiveFiend',6370),m('hound',5870)])
 ],
 25:[
  q('seal-approach','첫 작업면 서쪽 단독 전위와 뒤쪽 호위과 동쪽 등불. 시작 대형과 봉인 발사창은 비운다.','depot-entry-seal',[
   m('picks',740,'gallery-0:collision:0'),m('lantern',1210,'gallery-0:collision:0',true),m('picks',940,'gallery-0:collision:0')]),
  q('numbered-goods','서쪽 전망대 정예와 떨어진 도구과 바로 위 낮은 지붕의 독립 지원. 귀환 사격창은 비운다.','stake-arrival-2',[
   m('picks',245,'gallery-3:collision:0',true),m('lantern',520,'west-lookout-roof:collision:0',false,'numbered-goods-upper'),m('picks',445,'gallery-3:collision:0')]),
  q('inner-store','검문실의 도구·수레 전위와 그 위 처마 지원쌍. 동쪽 벽과 도착창 앞은 비운다.','stake-arrival-4',[
   m('picks',4400,'gallery-5:collision:0'),m('minecart',4850,'lookout-stair:collision:0'),m('lantern',4970,'upper-checkpoint-roof:collision:0',false,'inner-store-upper'),m('picks',4660,'gallery-5:collision:0',true),m('possessedArcher',5175,'upper-checkpoint-roof:collision:0',false,'inner-store-upper')]),
  q('maintenance-window-pressure','도착창은 비우고 정비실 동쪽의 단독 도구와 끝단 후위과 창 위 공중을 견제한다.','stake-arrival-1',[
   m('crow',1880,undefined,false,'maintenance-window-air',4650),m('lantern',2910,undefined,false,'maintenance-window-air',4230),m('picks',3400,'gallery-1:collision:0'),m('picks',3580,'gallery-1:collision:0')])
 ],
 26:[
  q('record-room-remnants','묘역 기록실 동쪽 벽의 정예·사수와 호위. 서쪽 문과 기록 작업면은 비운다.','investigation-record',[
   m('possessedGuard',1130,undefined,true),m('possessedArcher',1700),m('possessedGuard',1320)]),
  q('casting-yard-tools','작업장 바닥의 도구·수레와 바로 위 작업다락의 정예 지원. 진입 경사는 비운다.','artisan-resident',[
   m('picks',2470),m('minecart',3120),m('lantern',3270,'work-loft:collision:0',true,'casting-yard-upper'),m('picks',2570),m('possessedArcher',3410,'work-loft:collision:0',false,'casting-yard-upper')]),
  q('tally-store-remnants','퇴칸 서쪽 낮은 경사의 정예와 후위. 주민 몸·집 앞 작업반경을 비운다.','casting-tally',[
   m('picks',4050,undefined,true),m('lantern',4420),m('minecart',5370),m('picks',4260)]),
  q('surface-exit-remnants','강둑 굽이의 선발 도구와 떨어진 정예 후위과 공중 지원. 출구 집결면까지 마지막 사백 이상을 비운다.','workshop-exit',[
   m('picks',5720),m('lantern',6260),m('picks',5950,undefined,true)]),
  q('work-hollow-crossfire','낮은 작업마당의 도구와 같은 교전권 작업다락 사수. 작업장 중앙 퇴로는 남긴다.','investigation-record',[
   m('picks',2820),m('possessedArcher',2900,'work-loft:collision:0',false,'work-hollow-upper')]),
  q('return-bank-spirit','주민 퇴칸과 출구 집결면 밖 강둑의 공중 위협.','workshop-exit',[
   m('crow',6030,undefined,false,undefined,2220)])
 ],
 27:[
  q('entry-hauling-remnants','입구 하역 도구 셋을 문간에 결집하고 첫 기록 작업면 동쪽에 등불을 둔다.','depot-route-ledger',[
   m('minecart',800,'gallery-0:collision:0'),m('lantern',1320,'gallery-0:collision:0'),m('picks',1015,'gallery-0:collision:0')]),
  q('lower-loading-store','수몰 하역 경사면의 정예 수레와 양쪽 도구. 사격·도착창은 비운다.','stake-arrival-1',[
   m('minecart',5120,'stage27-depot-r1:cargo-incline:collision:0',true),m('picks',5390,'stage27-depot-r1:cargo-incline:collision:0'),m('picks',4970,'stage27-depot-r1:cargo-incline:collision:0')]),
  q('sealed-manifest-store','봉인통로 문간 전위와 바로 위 지붕의 서로 떨어진 등불과 사수. 진목 도착면은 비운다.','stake-arrival-2',[
   m('possessedGuard',6590,'gallery-3:collision:0',true),m('lantern',7040,'far-passage-roof:collision:0',false,'sealed-manifest-upper'),m('picks',6740,'gallery-3:collision:0'),m('possessedArcher',7220,'far-passage-roof:collision:0',false,'sealed-manifest-upper')]),
  q('high-numbered-store','명세 보관실의 정예 도구와 동쪽의 떨어진 호위과 가까운 처마 등불. 명세와 출구는 비운다.','family-manifest',[
   m('picks',2095,'gallery-7:collision:0',true),m('lantern',2020,'ledger-room-roof:collision:0',false,'high-numbered-upper'),m('picks',2240,'gallery-7:collision:0')]),
  q('loading-return-pressure','진목 도착면 대신 하역장 진입과 귀환 회랑 바깥 공중에서 접근을 예고한다.','stake-arrival-2',[
   m('crow',4070,undefined,false,undefined,3950),m('lantern',5730,undefined,false,undefined,4510)])
 ],
 28:[
  q('west-fire','초기 화재 제한시간 동안 기존 두 경비만 유지하고 불 제어 접근을 비운다.','fire-screen',[
   m('possessedGuard',1280),m('possessedArcher',1470)]),
  q('east-water','동쪽 두 동행의 수문 접근에는 기존 두 경비만 남긴다.','water-release',[
   m('possessedGuard',5840),m('possessedArcher',6140)]),
  q('court-petition','합류면 동쪽의 전위 셋과 마당 사수, 접근 가능한 낮은 처마의 별도 정예 지원.','petition-record',[
   m('possessedGuard',3720,undefined,true),m('possessedArcher',4190),m('possessedGuard',3900),m('possessedGuard',3610),m('possessedArcher',3280,'s28-roof-access-court-lower',true,'court-petition-upper')]),
  q('decision-suppression','동쪽 부속각 아래 전위와 마루 전후의 떨어진 사격점, 은폐 기록실 서쪽의 두 번째 전위. 서고 사이 연결면은 비운다.','suppression-order',[
   m('possessedGuard',4550,undefined,true),m('possessedArcher',4930,'s28-east-loading-veranda',false,'decision-suppression-upper'),m('possessedGuard',5510,undefined,true,'suppression-door'),m('possessedArcher',5750,undefined,false,'suppression-door'),m('possessedGuard',4705),m('possessedArcher',4720,'s28-east-loading-veranda',false,'decision-suppression-upper'),m('possessedGuard',5660,undefined,false,'suppression-door')]),
  q('west-record-veranda','불 제어 뒤에만 접근하는 서쪽 기록 회랑의 문지기와 뒤로 물러난 호위과 위 처마 정예 사격. 초기 화재 접근길은 비운다.','closure-order',[
   m('possessedGuard',2410),m('possessedGuard',2600),m('possessedArcher',2520,'s28-west-veranda',true,'west-record-upper'),m('possessedArcher',2790,'s28-west-veranda',false,'west-record-upper')])
 ],
 29:[
  q('sealed-store-response','봉인 창고 첫 접근의 정예 전위 세 체와 짧은 후위. 서쪽 시작 길은 비운다.','old-seal',[
   m('possessedGuard',1560,undefined,true),m('possessedGuard',1660),m('possessedArcher',1950),m('possessedGuard',1760),m('hound',1850)]),
  q('letter-store-guard','문서실 동쪽에 전위 셋을 결집하고 문밖 두 사수와 지붕의 독립 정예가 접근각을 나눈다.','hyeonmuk-letter',[
   m('possessedGuard',3160,undefined,true),m('possessedGuard',3260),m('possessedGuard',3360),m('possessedArcher',3480),m('possessedArcher',3580),m('possessedArcher',3390,'r29-record-vault',true,'letter-vault-upper')]),
  q('underwater-bridge-watch','점검교 전위 셋과 낮은 통로 사수, 위 검사 지붕 사수는 다른 높이로 활성화한다.','under-sluice-inspection-bridge',[
   m('possessedGuard',4520,'r29-inspection-deck'),m('possessedGuard',4620,'r29-inspection-deck'),m('possessedArcher',5040,'r29-inspection-deck'),m('possessedGuard',4720,'r29-inspection-deck'),m('possessedArcher',4930,'r29-inspection-roof',true,'inspection-roof-watch')]),
  q('dark-lock-approach','상층 수문길의 정예·호위 셋과 뒤 사수쌍. 서쪽 오름 경사와 동쪽 연결길은 비운다.','flight-hold',[
   m('possessedGuard',4760,'r29-high-road',true),m('possessedGuard',4860,'r29-high-road'),m('possessedArcher',5180,'r29-high-road'),m('possessedGuard',4960,'r29-high-road'),m('possessedArcher',5280,'r29-high-road')]),
  q('moonlit-exit-watch','낮은 수문 퇴로의 정예·호위·사수와 상층 후위쌍. 두 출구 집결면은 남긴다.','sluice-exit',[
   m('possessedGuard',6000,undefined,true),m('possessedArcher',6200),m('possessedGuard',5900,'r29-high-road',true,'moonlit-upper'),m('possessedArcher',6060,'r29-high-road',false,'moonlit-upper'),m('possessedGuard',6100),m('hound',5890)])
 ]
};

export function encounterSupportY(p,s,id,x){
 let poly=s.terrains.find(t=>t.id===id)?.points;
 if(!poly){const match=id.match(/^(.*):collision:(\d+)$/);if(match){const e=s.elements.find(e=>e.id===match[1]),a=e&&p.library.find(a=>a.id===e.assetId);poly=a?.collision[+match[2]]?.map(v=>({x:e.x+v.x*(e.scale??1),y:e.y+v.y*(e.scale??1)}));}}
 if(!poly)throw Error(`${s.id}: missing encounter support ${id}`);
 const ys=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];if(a.x!==b.x&&x>=Math.min(a.x,b.x)-1e-6&&x<=Math.max(a.x,b.x)+1e-6)ys.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));}
 if(!ys.length)throw Error(`${s.id}: encounter outside ${id} @ ${x}`);return Math.min(...ys);
}
export function authorPlaceEncounters(p,s){
 const plan=PLACE_ENCOUNTERS[s.metadata.stageId];if(!plan)return s;
 const old=new Map(s.units.filter(u=>u.team==='enemy').map(u=>[u.id,u]));
 const groups=[],cells=new Map(),enemies=[];
 for(const group of plan){const members=group.members.map((row,i)=>{
  const id=`a3-${s.metadata.stageId}-${group.id}-${i}`,cell=row.cell||group.id,flying=['lantern','crow','ghost'].includes(row.kind),y=row.airY??(encounterSupportY(p,s,row.support,row.x)-(flying?32:0));
  const prior=old.get(id),u={...prior,id,kind:row.kind,team:'enemy',x:row.x,y,facing:-1,spawnIndex:enemies.length,behavior:'patrol',encounterGroup:cell,stageOverrides:{...prior?.stageOverrides,honroCohort:cell,honroAct3Encounter:1,honroAct3Elite:row.elite,honroEncounterRole:/Archer|lantern/.test(row.kind)?'ranged-support':row.elite?'front-command':'frontline'}};
  if(row.airY===undefined)u.stageOverrides.honroEncounterSupport=row.support;else delete u.stageOverrides.honroEncounterSupport;
  enemies.push(u);if(!cells.has(cell))cells.set(cell,[]);cells.get(cell).push(id);
  return{kind:row.kind,x:row.x,y:row.airY??encounterSupportY(p,s,row.support,row.x),elite:row.elite,role:u.stageOverrides.honroEncounterRole,support:row.airY===undefined?row.support:undefined,airborne:row.airY!==undefined,cell};
 });groups.push({...group,members});}
 s.units=[...s.units.filter(u=>u.team!=='enemy'),...enemies];s.encounters=[...cells].map(([id,unitIds])=>({id,key:id,behavior:'patrol',unitIds}));
 s.design.act3.encounterPlan={...s.design.act3.encounterPlan,groups,initial:enemies.length,elites:enemies.filter(u=>u.stageOverrides.honroAct3Elite).length,placementRevision:2,activeLimit:s.initialState.honroActiveLimit,scope:'Fresh place clusters; serialized battles, objective/split/finite triggers and existing combat/XP tuning retained.'};
 s.initialState.honroAct3EncounterRevision=1;
 s.initialState.honroAct3EncounterBudget={version:1,roster:structuredClone(INITIAL_BUDGET_ROSTERS[s.metadata.stageId])};
 const count=a=>!a?0:a.type==='multi'?(a.actions||[]).reduce((n,a)=>n+count(a),0):['spawn','sniperAmbush'].includes(a.type)?a.n||1:0;
 const finite=(s.events||[]).reduce((n,e)=>n+count(e.action),0)+(s.initialState.honroAct3Steps||[]).reduce((n,t)=>n+(t.wave?.count||0),0);
 s.initialState.honroAct3EncounterPopulationCap=enemies.length+finite;
 s.design.act3.encounterPlan.finite=finite;
 s.design.act3.encounterPlan.populationCap=enemies.length+finite;
 return s;
}
// Quest/build passes used to move some dedicated ferry members back to a broad
// contour. Restore the active dedicated roster after those passes, without
// reauthoring terrain, events, escort policy, activation radii or the finite waves.
function restoreDedicatedEncounters(p,s){
 const yard=s.metadata.stageId===23&&s.initialState.honroEscortYardRoster===YARD_DENSITY_ROSTER;
 const ferry=s.metadata.stageId===30&&s.initialState.honroFerryRoster===FERRY_DENSITY_ROSTER;
 if(!yard&&!ferry)return;
 const groups=yard?YARD_DENSITY_GROUPS:FERRY_DENSITY_GROUPS,old=new Map(s.units.filter(u=>u.team==='enemy').map(u=>[u.id,u])),cells=new Map(),enemies=[];
 for(const group of groups)for(const row of (yard?group.units:group.members)){
  const id=yard?row.id:'sf-'+row.id,cell=row.cell||group.id,u={...old.get(id),id,kind:row.kind,team:'enemy',x:row.x,y:encounterSupportY(p,s,row.support,row.x)-(['lantern','crow','ghost'].includes(row.kind)?32:0),facing:-1,spawnIndex:enemies.length,behavior:'patrol',encounterGroup:cell,stageOverrides:{...old.get(id)?.stageOverrides,honroCohort:cell,honroAct3Encounter:1,honroAct3Elite:row.elite,honroEncounterRole:row.role,honroEncounterSupport:row.support,...(yard?{honroEscortYardCell:cell,honroEscortYardActivationCell:cell}:{honroFerryCell:group.id,honroFerryActivationCell:cell,honroDensityCell:cell})}};
  enemies.push(u);if(!cells.has(cell))cells.set(cell,[]);cells.get(cell).push(id);
 }
 s.units=[...s.units.filter(u=>u.team!=='enemy'),...enemies];s.encounters=[...cells].map(([id,unitIds])=>({id,key:id,behavior:'patrol',unitIds}));
 s.design.act3.encounterPlan={...s.design.act3.encounterPlan,initial:enemies.length,elites:enemies.filter(u=>u.stageOverrides.honroAct3Elite).length,placementRevision:2,groups:yard?[...cells].map(([id,unitIds])=>({id,key:id,behavior:'patrol',unitIds,purpose:groups.find(g=>g.units.some(u=>unitIds.includes(u.id))).purpose,members:enemies.filter(u=>unitIds.includes(u.id)).map(u=>({id:u.id,x:u.x,y:u.y,support:u.stageOverrides.honroEncounterSupport,elite:u.stageOverrides.honroAct3Elite}))})):structuredClone(groups)};
}
export function applyPlaceEncounters(p){for(const s of p.stages){if(PLACE_ENCOUNTERS[s.metadata?.stageId])authorPlaceEncounters(p,s);else if(s.metadata?.stageId===22&&s.initialState?.honroVerticalStage22EncounterRevision===1)authorStage22PlaceEncounters(p,s);else if([23,30].includes(s.metadata?.stageId))restoreDedicatedEncounters(p,s);}return p;}
