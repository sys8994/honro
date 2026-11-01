/** Stage40 final-defense candidate. Existing terrain, art and civilian routes
 * are immutable inputs. This roster is a design target, not play acceptance. */
export function authorAct4Finale(stage,point){
 if(stage.metadata?.stageId!==40||stage.initialState?.honroFinalDefenseRevision===2)return stage;
 const s={...stage,units:stage.units.filter(u=>u.team!=='enemy'),encounters:[],initialState:structuredClone(stage.initialState)};
 // Role clusters follow the supported retreat, dock and departure approach.
 // Slots are explicitly authored; no equal-spacing/random-density generator.
 const groups=[
 ['west-front','coast-west','추격 전위와 경사 후방 사수',[['hound',1660],['hound',1760],['possessedGuard',1880],['possessedArcher',2040],['possessedGuard',2125],['possessedArcher',2240]]],
 ['west-anchor','coast-west','결박을 피해 선착장으로 내려가는 진입전',[['possessedGuard',2355],['shade',2440,'bind'],['hound',2550],['possessedArcher',2670],['possessedGuard',2790],['possessedArcher',2960],['hound',3120]]],
 ['dock-left','dock','하역장 측면 사수와 엄폐 전위',[['possessedArcher',290],['possessedArcher',420],['possessedGuard',560],['hound',700],['possessedGuard',840],['hound',1020],['possessedArcher',1190]]],
 ['dock-right','dock','곡사 봉쇄와 노출 창을 이용하는 선착장 교전',[['possessedGuard',1490],['hound',1580],['warden',1660,'arc'],['possessedArcher',1740],['hound',1870],['possessedGuard',1990],['possessedArcher',2150]]],
 ['dock-stair','dock-stair','상층에서 내려오는 병력과 아래쪽 방어선의 교차 사선',[['possessedGuard',1940],['possessedArcher',2030],['hound',2120],['possessedGuard',2210],['possessedArcher',2310],['hound',2400],['possessedArcher',2485]]],
 ['departure-upper','departure-stair','보스 접근 경사의 호위와 높은 사격점',[['possessedArcher',1620],['possessedGuard',1695],['hound',1775],['possessedArcher',1850],['possessedGuard',1930]]],
 ['departure-low','departure-ramp','간조 때 접근 가능한 승선턱 전위',[['hound',2090],['hound',2180]]],
 ['tide-keeper','departure-stair','조수 변화로 접근 경로가 달라지는 마지막 수문장',[['warden',2050,'boss']]]
 ];
 // Start tide only when the party approaches the lower encounter. Never
 // raise the entire sea to the upper coast just to manufacture vertical play.
 s.design={...stage.design,act4:structuredClone(stage.design.act4)};
 s.design.act4.tide={low:3762.5,high:3412.5,warningRound:1000000,highRound:1000003,lowRound:1000005,floorTerrainIds:['approved40-central-rock','approved40-departure-ramp'],finale:true};
 s.design.act4.geometry40.lowerBoardingTriggerBounds={x1:1570,x2:2220,y1:2900,y2:3650};
 s.initialState.honroAct4Design=structuredClone(s.design.act4);
 const defs={};
 for(const [i,[key,route,purpose,slots]]of groups.entries()){
  const id='final40-'+key,support='approved40-'+route,members=[];
  for(const [j,[kind,x,special]]of slots.entries()){
   const uid=id+'-'+(j+1),role=kind==='hound'?'close':kind==='possessedArcher'?'bow':'guard';
   const overrides={elite:false,group:140+i,awake:false,aggroUntil:0,fixed:false,honroAct4WaterTrait:special==='boss'?'aquatic':'ground',honroEncounterSupport:support,honroDensityCell:id,honroPilotCombatBudget:true,honroPilotRole:role};
   if(special==='arc'||special==='bind')Object.assign(overrides,{name:special==='bind'?'포구 결박귀':'선착장 포격귀',honroMidboss:true,honroPilotMidboss:'harbor',honroPilotVariant:special,honroPilotRole:'midboss',r:26,h:120,armor:.04,honroPilotRelocation:point(stage,support,x+(special==='arc'?150:170))});
   if(special==='boss')Object.assign(overrides,{name:'포구의 들린 장승',boss:40,honroMidboss:false,honroAct4FinaleBoss:true,honroAct4Aquatic:true,r:38,h:160,armor:.12,loadout:['HWD01','HWD02'],honroFinaleHome:point(stage,support,x),honroPilotRelocation:point(stage,support,1935)});
   s.units.push({id:uid,kind,team:'enemy',...point(stage,support,x),facing:-1,encounterGroup:id,...(special==='boss'?{boss:40}:{}),stageOverrides:overrides});members.push(uid);
  }
  s.encounters.push({id,key:id,unitIds:members,behavior:'guard',purpose});
  defs[id]={supports:[support],radius:key==='dock-left'?1300:850,maxHeight:500,engagementRounds:1};
 }
 Object.assign(s.initialState,{honroFinalDefenseRevision:2,honroAct4EncounterRevision:1,honroActiveLimit:6,honroActionBudgetRevision:1,honroEncounterDensityActivation:defs});
 if(s.units.filter(u=>u.team==='enemy').length!==42)throw Error('Finale roster must have42 unique enemies');
 return s;
}
