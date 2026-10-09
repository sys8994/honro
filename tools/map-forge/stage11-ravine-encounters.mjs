/** Authored Stage 11 combat places. Each row owns a real named support and role;
 * no distance filling, random scattering or population multiplier is used. */
const member=(kind,x,support,role,elite=false,lift=0,cell=null)=>({kind,x,support,role,elite,lift,cell});
const group=(id,zone,cohort,purpose,members)=>({id,zone,cohort,purpose,members});
export const RAVINE_ENCOUNTERS=[
 group('entry-root-pack','west-entry','west','능선 첫 굽이를 맡은 작은 선발대. 근접 세 체와 낮은 깃 지원을 뭉치고 시작 동행과 매듭 사이 긴 연결부는 비운다.',[
  member('hound',1710,'rv-west-shoulder','entry-front'),member('hound',1794,'rv-west-shoulder','entry-pair'),member('stag',1898,'rv-west-shoulder','entry-charge'),member('crow',1840,'rv-west-shoulder','entry-cover',false,180)]),
 group('west-knot-ward','west-crown','west','매듭 서쪽 작은 오목면에 결집한 돌진대와 뒤의 수의귀. 범위 공격으로 전위를 무너뜨리거나 낮은 가지를 먼저 빼앗는다.',[
  member('boar',3380,'rv-west-shoulder','knot-shock-leader',true),member('hound',3484,'rv-west-shoulder','knot-front'),member('hound',3566,'rv-west-shoulder','knot-pair'),member('shade',3660,'rv-west-shoulder','knot-second-line'),member('stag',3768,'rv-west-shoulder','knot-flank')]),
 group('west-canopy-watch','west-canopy','west','매듭 위 낮은 가지의 세 마리 지원조와 오르는 줄기 입구의 정예 지휘조. 높은 수관 끝과 매듭 뒤 통로는 비운다.',[
  member('crow',3270,'rv-west-low-bough','low-bough-shot',false,70,'west-low-bough'),member('bat',3360,'rv-west-low-bough','low-bough-air',false,170,'west-low-bough'),member('crow',3460,'rv-west-low-bough','low-bough-crossfire',false,45,'west-low-bough'),member('hound',3760,'rv-west-climbing-trunk','climb-door',false,0,'west-trunk-command'),member('warden',3845,'rv-west-climbing-trunk','west-command',true,0,'west-trunk-command')]),
 group('saddle-crossfire','saddle-crossfire','middle','중앙 전투의 두 작은 공중 지원조. 고목에는 길목 장승 한 체만 두고 사격조는 옆 공중에 삼각형으로 모아 긴 대각 순회선을 없앤다.',[
  member('crow',7750,'rv-saddle-fallen-trunk','upper-command',true,245,'ritual-upper-right'),member('bat',7840,'rv-saddle-fallen-trunk','upper-close-air',false,335,'ritual-upper-right'),member('lantern',7920,'rv-saddle-fallen-trunk','upper-rear-fire',false,190,'ritual-upper-right'),member('warden',7780,'rv-saddle-fallen-trunk','trunk-door',false,0,'ritual-upper-right'),member('crow',6480,'rv-ritual-buttress','west-hover-shot',false,350,'ritual-west-hover'),member('bat',6580,'rv-ritual-buttress','west-hover-air',false,460,'ritual-west-hover'),member('lantern',6670,'rv-ritual-buttress','west-hover-fire',false,290,'ritual-west-hover')]),
 group('ritual-court-guard','ritual-court','middle','제단 서쪽 네 체의 근접 결집, 반사선반의 정예와 참모, 동쪽 한 체의 측면 경계로 나눈다. 의식 제단 자체와 후퇴할 중앙 여백은 비운다.',[
  member('hound',6850,'rv-ritual-buttress','ritual-front',false,0,'ritual-front'),member('boar',6955,'rv-ritual-buttress','ritual-shock-leader',true,0,'ritual-front'),member('hound',7050,'rv-ritual-buttress','ritual-close-pair',false,0,'ritual-front'),member('warden',7160,'rv-ritual-reflection-ledge','reflection-command',true,0,'ritual-command'),member('shade',7130,'rv-ritual-buttress','ritual-second-line',false,0,'ritual-front'),member('shade',7238,'rv-ritual-reflection-ledge','command-retainer',false,0,'ritual-command'),member('hound',7820,'rv-ritual-buttress','east-flank-intercept',false,0,'ritual-east-flank')]),
 group('refuge-two-levels','lower-refuge','east','주민 서쪽 돌 입구에 모인 돌진대와 낮은 깃, 바깥 박쥐. 좁은 입구 다중피해가 유효하며 주민 몸까지 400 이상의 보호 여백을 둔다.',[
  member('crow',9215,'rv-root-arch','mouth-air-pair',false,10),member('hound',9300,'rv-lower-refuge-rock','mouth-ground-pair'),member('boar',9020,'rv-lower-refuge-rock','mouth-shock-leader',true),member('hound',9120,'rv-lower-refuge-rock','mouth-entry-pack'),member('bat',9070,'rv-root-arch','mouth-overwatch',false,180)]),
 group('refuge-east-guard','lower-refuge','east','피난처를 지나 동쪽 오름길을 지키는 작은 후위. 주민 바로 곁은 비우고 낮은 수비 둘과 높은 뿌리의 등불을 맞물린다.',[
  member('shade',10420,'rv-lower-refuge-rock','refuge-east-shot'),member('warden',10504,'rv-lower-refuge-rock','refuge-exit-guard',true),member('lantern',10570,'rv-root-east-descent','root-crossfire',false,180)]),
 group('east-stone-overwatch','east-overlook','east','동고지 굽이의 네 체 수비대와 바로 위 짧은 발판의 세 체 지원조. 뒤쪽 깃 정예가 측면을 맡고 북쪽 흔적까지 나머지 능선은 비운다.',[
  member('warden',11230,'rv-east-tower','tower-front-command',true,0,'east-ground-cordon'),member('shade',11320,'rv-east-tower','tower-second-line',false,0,'east-ground-cordon'),member('hound',11404,'rv-east-tower','tower-close-pair',false,0,'east-ground-cordon'),member('boar',11500,'rv-east-tower','tower-flank-block',false,0,'east-ground-cordon'),member('crow',11780,'rv-east-tower','tower-flank-command',true,210,'east-upper-support'),member('hound',11390,'rv-east-upper-fire-bay','upper-bay-guard',false,0,'east-upper-support'),member('crow',11505,'rv-east-upper-fire-bay','upper-bay-shot',false,80,'east-upper-support'),member('bat',11590,'rv-east-upper-fire-bay','upper-bay-air',false,200,'east-upper-support')])
];
// These cells are independent attention/activation units inside a larger place.
// Being attacked wakes a cell immediately; proximity locks never make it immune.
export const RAVINE_ACTIVATION={
 'entry-root-pack':1300,'west-knot-ward':1400,'west-low-bough':950,'west-trunk-command':620,
 'ritual-front':1250,'ritual-command':560,'ritual-east-flank':650,'ritual-upper-right':760,'ritual-west-hover':820,
 'refuge-two-levels':1100,'refuge-east-guard':740,'east-ground-cordon':1200,'east-upper-support':740
};
const response=(id,trigger,warning,members)=>({id,trigger,warning,members});
const alternateXs={'west-return':[2440,2528,2590],'saddle-wings':[7000,7100],'ravine-crosswind':[7750,7850,7945],'ritual-west-pursuit':[5790,5880],'ritual-east-turn':[8650,8738,8840]};
export const RAVINE_RESPONSES=[
 response('west-return',{objectiveDone:'knot-west'},'끊어진 서쪽 매듭을 되찾으려 산개 두 마리와 깃 그림자가 서쪽 굽이에서 함께 달려옵니다.',[
  {...member('hound',2720,'rv-west-shoulder','west-pursuit-pair'),cohort:'west'}, {...member('hound',2808,'rv-west-shoulder','west-pursuit-pair'),cohort:'west'}, {...member('crow',2865,'rv-west-shoulder','west-pursuit-cover'),cohort:'west'}]),
 response('saddle-wings',{objectiveDone:'knot-west',region:{x:6400,y:6240,width:1500,height:1200},fallbackDone:'clear-west'},'서쪽 고목 아래 박쥐 두 마리가 원을 좁힙니다. 위 지원조를 먼저 끊거나 아래로 통과할 수 있습니다.',[
  member('bat',6760,'rv-saddle-swept-bough','west-air-pair'),member('bat',6860,'rv-saddle-swept-bough','west-air-pair')]),
 response('ravine-crosswind',{objectiveDone:'clear-west',region:{x:7310,y:6810,width:1700,height:1000},fallbackDone:'knot-east'},'의식터 아래 뿌리 갈림길에 세 날짐승의 기척이 모입니다. 아래로 내려갈 때 이 입구를 한꺼번에 제압하세요.',[
  member('crow',8550,'rv-root-arch','underpass-entry'),member('bat',8650,'rv-root-arch','underpass-entry'),member('crow',8745,'rv-root-arch','underpass-entry')]),
 response('ritual-west-pursuit',{objectiveDone:'knot-east'},'서쪽 의식 선반 끝에서 산개 한 쌍이 진으로 들어옵니다. 중앙의 빈 공간을 남겨 두고 맞으세요.',[
  member('hound',6420,'rv-ritual-buttress','ritual-west-pair'),member('hound',6510,'rv-ritual-buttress','ritual-west-pair')]),
 response('ritual-east-turn',{objectiveDone:'knot-east'},'동쪽 내리막에서 마지막 추격대가 모여듭니다. 남은 잔향 여섯도 의식 중에만 나타납니다.',[
  member('hound',8000,'rv-ritual-buttress','ritual-east-pair'),member('hound',8088,'rv-ritual-buttress','ritual-east-pair'),member('crow',8190,'rv-ritual-buttress','ritual-east-cover')])
];
export const RAVINE_INITIAL=44,RAVINE_INITIAL_ELITES=9,RAVINE_RESPONSE_COUNT=13,RAVINE_DEFENSE_COUNT=6,RAVINE_POPULATION_CAP=64;
export function stage11Support(st,id,x){const t=st.terrains.find(t=>t.id===id);if(!t)throw Error('Missing ravine support '+id);
 const top=t.points.slice(0,t.properties.honroWalkEdges.length+1);for(let i=1;i<top.length;i++){const a=top[i-1],b=top[i];if(x>=a.x&&x<=b.x&&b.x>a.x)return{x,y:a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x),support:id};}throw Error(`Ravine support ${id} has no authored contact at ${x}`);
}
export function authorStage11RavineEncounters(g,p){const st=p.stages.find(s=>s.metadata?.stageId===11);if(!st||st.design.ravine?.version!==2)return p;
 st.units=st.units.filter(u=>u.team!=='enemy'||u.id.startsWith('resident-spirit-'));st.encounters=[];st.design.space.encounterSites=[];
 const rescue=st.markers.find(m=>m.id==='resident'),spirit=st.units.find(u=>u.id===rescue?.spiritId);
 if(spirit){const site=stage11Support(st,'rv-lower-refuge-rock',rescue.x+255);Object.assign(spirit,{x:site.x,y:site.y-135});}
 const formation={mage:540,occultist:615,archer:720,knight:880};for(const u of st.units)if(u.team==='player'){const site=stage11Support(st,'act2-floor',formation[u.kind]);Object.assign(u,{x:site.x,y:site.y});}
 const compiled=g.HonroMaps.compile(st,p),fake={width:st.width,height:st.height,terrain:compiled.terrain,units:[]};let index=0;
 const cells=new Map();for(const q of RAVINE_ENCOUNTERS){for(const [i,row]of q.members.entries()){
  const def=g.HonroWorld.archetypes[row.kind],spot=stage11Support(st,row.support,row.x),y=spot.y-row.lift,id=`rv11-${q.id}-${i}`;
  const body={id,x:row.x,y,h:def.h,r:def.r,hp:1};
  if(def.flying?g.HonroTerrain.intersects(fake,body):!g.HONRO_CORE.validTerrainContactPose(fake.terrain,body))throw Error(`${id}: invalid authored body at ${row.x},${y} on ${row.support}`);
  for(const v of fake.units)if(Math.abs(v.x-body.x)<v.r+body.r+18&&!(body.y<=v.y-v.h-18||body.y-body.h>=v.y+18))throw Error(`${id}: occupied authored body clearance beside ${v.id}`);
  const cell=row.cell||q.id;if(!cells.has(cell))cells.set(cell,[]);cells.get(cell).push(id);fake.units.push(body);
  // The historical enemy factory adds HP before stageOverrides at index 10,
  // 21, etc. Skip those factory slots, rather than merely hiding their badge.
  const spawnIndex=index+Math.floor(index/10);index++;
  st.units.push({...g.HonroUnits.record(row.kind,id,row.x,y,'enemy'),facing:-1,spawnIndex,behavior:'patrol',encounterGroup:cell,stageOverrides:{elite:false,armor:.04,honroCohort:q.cohort,honroAct2Elite:row.elite,honroAct2Revision:2,honroStage11Encounter:2,honroRavinePlace:q.id,honroRavineCell:cell,honroEncounterRole:row.role,honroEncounterSupport:row.support}});
  st.design.space.encounterSites.push({id,unitId:id,cohort:q.cohort,group:q.id,roomId:q.zone,surfaceId:row.support,x:row.x,y,supportY:spot.y,flying:!!def.flying});
 }}for(const [id,unitIds]of cells)st.encounters.push({id,key:id,behavior:'patrol',unitIds});
 st.events=(st.events||[]).filter(ev=>!ev.id.startsWith('ravine-response-'));
 for(const [i,q]of RAVINE_RESPONSES.entries()){
  const id='ravine-response-'+q.id,entry=stage11Support(st,q.members[0].support,q.members[0].x);
  const makeActions=xs=>q.members.map((row,j)=>{const x=xs?.[j]??row.x,spot=stage11Support(st,row.support,x);return{type:'spawn',n:1,kind:row.kind,x,y:spot.y,support:row.support,spacing:0,maxDistance:192,clearance:18,source:id,elite:row.elite,honroEncounterRole:row.role,honroCohort:row.cohort||'reinforcement'};});const actions=makeActions();
  st.events.push({id,once:true,required:true,honroStage11Response:1,honroRavineTrigger:structuredClone(q.trigger),when:{round:999999},warning:q.warning,text:'증원 진입 · '+q.warning,entry,action:{type:'multi',actions,honroRavineAlternatives:[makeActions(alternateXs[q.id])],source:id,honroStage11Response:1,honroRavineIndex:i}});
 }
 const defenseEntries=[stage11Support(st,'rv-ritual-buttress',6730),stage11Support(st,'rv-ritual-buttress',8210)];
 st.initialState={...st.initialState,honroActiveLimit:4,honroStage11EncounterRevision:2,honroStage11Activation:structuredClone(RAVINE_ACTIVATION),honroStage11DefenseAlternates:[stage11Support(st,'rv-ritual-buttress',6180),stage11Support(st,'rv-ritual-buttress',8870)],honroStage11Shelter:stage11Support(st,'rv-lower-refuge-rock',9910),honroStage11PopulationCap:RAVINE_POPULATION_CAP,honroStage11DefenseEntries:defenseEntries};
 Object.assign(st.markers.find(m=>m.id==='wave-hold-knots'),defenseEntries[0]);
 st.design.ravine.encounters={version:2,initial:RAVINE_INITIAL,initialElites:RAVINE_INITIAL_ELITES,protectedSpirit:1,activeLimit:4,defenseCount:RAVINE_DEFENSE_COUNT,responses:RAVINE_RESPONSES.length,responseCount:RAVINE_RESPONSE_COUNT,totalEnemyBudget:RAVINE_POPULATION_CAP,activationCells:cells.size,formation:{...formation},groups:RAVINE_ENCOUNTERS.map(({id,zone,cohort,purpose,members})=>({id,zone,cohort,purpose,count:members.length,elites:members.filter(m=>m.elite).length})),responseCutoff:'knot-east',defenseEntries,scope:'Every response is finite and due by the east-knot step, before defense/rescue/all-clear/trace. Dense local cells have independent proximity/attack activation. Empty approach, upper shortcut, lower loop and north trace are not populated by lone cleanup enemies.'};
 return p;
}
