/** Place-based revision of the existing 42-unit finale roster. Fresh authoring
 * only: existing battle snapshots, quest routes, species and budgets are not
 * rewritten. Unit IDs deliberately survive the regrouping (diversity owner). */
export function placeAct4Stage40(stage, point) {
 if(stage.metadata?.stageId!==40||stage.initialState?.honroStage40PlacementRevision===1)return stage;
 const old=Object.fromEntries(stage.units.filter(u=>u.team==='enemy').map(u=>[u.id,u]));
 const ref=(group,n)=>'final40-'+group+'-'+n;
 const layouts=[
  ['west-sentry','coast-west','진입 경사의 첫 턱을 지키는 전위 둘과 뒤쪽 지원; 시작 주민 공간은 비운다',[[ref('west-front',1),1810],[ref('west-front',2),1890],[ref('west-front',3),2050]]],
  ['ridge-watch','upper-east','귀환 목적지 위 고지의 사격 감시조; 안전 집결면과 높이를 분리한다',[[ref('west-front',4),5140],[ref('west-front',5),5230],[ref('west-front',6),5440]]],
  ['binding-turn','coast-west','선착장 갈림길 직전 결박귀와 호위가 굽이를 지킨다',[[ref('west-anchor',1),2390],[ref('west-anchor',2),2470],[ref('west-anchor',3),2610]]],
  ['east-junction','coast-east','상부 귀환로와 배 도착로가 만나는 동쪽 굽이의 차단조; 집결 안전면 밖',[[ref('west-anchor',4),3830],[ref('west-anchor',5),3910],[ref('west-anchor',6),4110],[ref('west-anchor',7),4240]]],
  ['dock-cargo','dock','서쪽 하역장 가장자리의 작은 무리와 뒤쪽 공중 감시; 긴 부두 연결부는 비움',[[ref('dock-left',1),1080],[ref('dock-left',2),820],[ref('dock-left',3),600],[ref('dock-left',4),675]]],
  ['arrival-watch','arrival-stair','배 도착 후 올라가는 계단의 감시조; 승선갑판과 최종 집결면에는 적을 두지 않는다',[[ref('dock-left',5),4190],[ref('dock-left',6),4270],[ref('dock-left',7),4450]]],
  ['dock-battery','dock','하층 포격귀를 전위와 사수가 호위하는 국소 화점',[[ref('dock-right',1),1510],[ref('dock-right',2),1595],[ref('dock-right',3),1690],[ref('dock-right',4),1825]]],
  ['east-rearguard','coast-east','동쪽 경사 상단의 후위; 주민 안전 구역보다 높은 별도 지지면',[[ref('dock-right',5),5390],[ref('dock-right',6),5480],[ref('dock-right',7),5690]]],
  ['stair-foot','dock-stair','부두 계단 아래쪽 전위; 중간 계단은 접근 선택을 위해 비운다',[[ref('dock-stair',1),1905],[ref('dock-stair',2),1990]]],
  ['stair-head','dock-stair','상층 갈림길 바로 아래 사격/수의귀 묶음',[[ref('dock-stair',6),2470],[ref('dock-stair',7),2550]]],
  ['road-scout','coast-west','부두 전방의 떨어진 단독 감시병; 주 전위까지 접근 여백을 둔다',[[ref('dock-stair',3),1400]]],
  ['ridge-entry','upper-east','동쪽 상부 길의 진입턱을 지키는 두 체; 뒤쪽 고지 사격조와 구분',[[ref('dock-stair',4),4780],[ref('dock-stair',5),4865]]],
  ['boss-approach','departure-stair','하부 장승으로 내려가는 턱의 호위; 계단 전체를 채우지 않는다',[[ref('departure-upper',1),1620],[ref('departure-upper',2),1700],[ref('departure-upper',3),1850]]],
  ['crossing-scout','coast-west','바다 위 상부 횡단로 입구의 떨어진 감시 두 체',[[ref('departure-upper',4),3200],[ref('departure-upper',5),3370]]],
  ['boarding-pair','departure-ramp','저조위 승선턱을 지키는 근접 둘; 조수/승선 이벤트는 그대로',[[ref('departure-low',1),2090],[ref('departure-low',2),2180]]],
  ['tide-keeper','departure-stair','기존 조수 보스의 위치와 전투를 보존',[[ref('tide-keeper',1),2050]]]
 ];
 const defs={},encounters=[],replacements=new Map();
 for(const [i,[name,route,purpose,slots]]of layouts.entries()){
  const key='place40-'+name,support='approved40-'+route;
  for(const [id,x]of slots){const u=old[id];if(!u||replacements.has(id))throw Error('Invalid stage40 authored slot '+id);
   const o={...u.stageOverrides,group:140+i,honroDensityCell:key,honroEncounterSupport:support};
   if(o.honroPilotMidboss==='harbor')o.honroPilotRelocation=point(stage,support,x+(o.honroPilotVariant==='arc'?150:170));
   replacements.set(id,{...u,...point(stage,support,x),encounterGroup:key,stageOverrides:o});
  }
  defs[key]={supports:[support],radius:['ridge-watch','east-rearguard'].includes(name)?1000:750,maxHeight:500,engagementRounds:1};
  if(name==='boarding-pair')defs[key].extra=[{support:'a4-return-deck',minX:2170,maxX:3000}];
  if(name==='ridge-watch')defs[key].extra=[{support:'approved40-coast-east',minX:5120,maxX:5800}];
  encounters.push({id:key,key,unitIds:slots.map(([id])=>id),behavior:'guard',purpose});
 }
 if(replacements.size!==42||Object.keys(old).length!==42)throw Error('Preserve stage40 42-unit budget');
 return {...stage,units:stage.units.map(u=>replacements.get(u.id)||u),encounters,initialState:{...stage.initialState,honroStage40PlacementRevision:1,honroEncounterDensityActivation:defs}};
}
