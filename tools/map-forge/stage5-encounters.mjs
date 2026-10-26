// Stage5's finite encounter author. Species use their existing factory/skills;
// no per-stage HP, damage, action-cap or player-stat multipliers are introduced.
export function authorStage5Encounters(s,land,ridge){
 const cells=[
  {key:'low-entry',region:{x:1050,y:2680,width:1100,height:460}},
  {key:'upper-crossfire',region:{x:1320,y:2120,width:1000,height:520}},
  {key:'pine-shot',region:{x:2490,y:1760,width:1000,height:580}},
  {key:'cave-mouth',region:{x:3070,y:2650,width:1000,height:420}}
 ];
 const roster=[
  ['entry-hound','hound',920,land(920),'low-entry','close pursuit'],
  ['entry-boar','boar',1090,land(1090),'low-entry','short charge behind front'],
  ['entry-ghost','ghost',1460,land(1460),'low-entry','ranged support below fallen pine'],
  ['upper-archer','human',1540,ridge(1540),'upper-crossfire','ridge ballistic exchange'],
  ['upper-crow','crow',1690,1680,'upper-crossfire','high oblique feather pressure'],
  ['pine-archer','human',2710,1682,'pine-shot','middle branch denies ascent'],
  ['cave-hound','hound',2870,land(2870),'cave-mouth','mouth melee front'],
  ['cave-ghost','ghost',3140,land(3140),'cave-mouth','low corridor ranged support'],
  ['cave-shade','shade',3510,2670,'cave-mouth','ritual chamber binding pressure']
 ];
 s.units=s.units.filter(u=>u.team==='player');
 for(const [index,[id,kind,x,y,cell,role]]of roster.entries())s.units.push({id:'s5-'+id,kind,team:'enemy',x,y,spawnIndex:index,stageOverrides:{honroStage5Cell:cell,honroTacticalRole:role,awake:false,aggroUntil:0,...(['low-entry','cave-mouth'].includes(cell)?{honroPursuitSupports:['valley-floor']}:{} )}});
 s.encounters=cells.map(c=>({id:'encounter:'+c.key,key:c.key,unitIds:s.units.filter(u=>u.stageOverrides?.honroStage5Cell===c.key).map(u=>u.id)}));
 Object.assign(s.initialState,{honroStage5EncounterRevision:2});
 s.design.positioning.cells=cells;s.design.positioning.encounterBudget={initial:9,ritualResponse:4,pineResponse:2};
 s.events=s.events.filter(e=>!['pine-flight-warning','pine-flight'].includes(e.id));
 const warning=s.events.find(e=>e.id==='lower-beasts-warning'),wave=s.events.find(e=>e.id==='lower-beasts');
 // The two raw n=1 groups become four bodies through the existing Act1 finite
 // reinforcement author. The shared multi-spawn reservation is atomic.
 Object.assign(warning,{when:{round:999999},text:'물길 뒤에서 짐승과 혼불이 다가온다. 다음 라운드에는 물길진으로 향한다.'});
 Object.assign(wave,{when:{after:'lower-beasts-warning',round:999999},action:{type:'multi',actions:[
  {type:'spawn',n:1,kind:'hound',x:2690,y:land(2690),support:'valley-floor',spacing:100,maxDistance:0,clearance:18},
  {type:'spawn',n:1,kind:'ghost',x:2410,y:land(2410),support:'valley-floor',spacing:140,maxDistance:0,clearance:18}
 ]},entry:{x:2690,y:land(2690)},text:'산개와 떠도는 혼들이 낮은 물길로 들어온다.'});
 s.events.unshift({id:'pine-flight-warning',once:true,when:{region:{x:2270,y:1820,width:660,height:520}},action:null,text:'노송 위에서 날갯짓이 들린다. 다음 라운드에 높은 가지로 다가온다.',lines:[]},
 {id:'pine-flight',once:true,when:{after:'pine-flight-warning',round:999999},action:{type:'spawn',n:1,kind:'crow',x:2690,y:1682,support:'stage5-timber-mid',spacing:90,maxDistance:100,clearance:18,requireFlightClearance:true},entry:{x:2690,y:1470},text:'노송의 까마귀들이 높은 가지로 날아든다.',lines:[]});
}
