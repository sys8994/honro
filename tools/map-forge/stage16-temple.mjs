/** Fresh Stage16: a monumental cave temple. Old battles keep their snapshots. */
const clone = value => JSON.parse(JSON.stringify(value));
export const TEMPLE_VERSION = 1;
export function templeHeight(points, x) {
 for (let i = 1; i < points.length; i++) {
  const a = points[i - 1], z = points[i];
  if (z[0] > a[0] && x >= a[0] - 1e-5 && x <= z[0] + 1e-5) return a[1] + (z[1] - a[1]) * (x - a[0]) / (z[0] - a[0]);
 }
 throw Error('Missing temple support ' + x);
}
const FLOOR = [[0,5480],[1100,5480],[1800,5450],[2300,5320],[2800,5360],[3200,5520],[3800,5800],[4800,5910],[5700,5950],[6500,5960],[7400,5800],[8000,5650],[8800,4840],[9400,4800],[10300,4750],[11000,4750]];
const ROOF = [[0,3900],[1100,3700],[2100,3100],[3300,2100],[4600,1360],[6100,1210],[7300,1530],[8150,2140],[8750,2900],[9500,3050],[11000,3310]];
function plane(id, top, bottom, {material = 'rock', oneWay = false, role = 'shelf', optional = true, ...extra} = {}) {
 return {id, name:id, type:'solid', points:[...top,...bottom].map(([x,y]) => ({x,y})), baseMaterial:material, breakable:false, oneWay, layer:'terrain', properties:{surfaceKind:material === 'wood' ? 'wood' : 'cave', honroCave:true, honroTemple:true, honroSpaceSurfaceId:id, honroSurfaceRole:role, honroWalkEdges:role === 'ceiling' ? [] : top.slice(1).map((_,i) => i), optional, ...extra}, detail:{spacing:18, roughness:0, seed:16, optimizeEpsilon:0}};
}
const deck = (id, points, depth=70) => plane(id, points, points.slice().reverse().map(([x,y]) => [x,y+depth]), {material:'wood', oneWay:true});
export function createTempleTerrains() {
 return [
  plane('act2-floor',FLOOR,[[11000,8500],[0,8500]],{role:'floor',optional:false}),
  plane('cave-roof',ROOF,[[11000,-800],[0,-800]],{role:'ceiling',honroCeiling:true,optional:false}),
  plane('tm-processional-stair',[[1800,5450],[2300,5320],[2550,5250]],[[2550,5520],[2200,5700],[1800,5650]],{optional:false}),
  deck('tm-processional-bridge',[[2690,5211],[2800,5180],[3500,4850]],90),
  plane('tm-processional-upper',[[3500,4850],[3900,4750],[4350,4370],[4600,4250]],[[4580,4840],[4170,5060],[3630,5250],[3500,5130]],{optional:false}),
  plane('tm-great-hall-plinth',[[4600,4250],[5150,4250],[5920,4250],[6700,4250],[7350,4250]],[[7440,4740],[7180,5160],[6740,5050],[6450,4630],[6100,4580],[5740,4670],[5500,5170],[5000,5100],[4730,4740]],{optional:false}),
  plane('tm-east-stone-stair',[[7350,4250],[7850,4400],[8110,4530]],[[8130,4830],[7900,5020],[7580,4930],[7330,4550]],{optional:false}),
  deck('tm-east-stone-bridge',[[8230,4590],[8800,4840]],100),
  deck('tm-shelter-veranda',[[2640,5030],[3130,4990],[3460,4858.857142857143]],100),
  deck('tm-shelter-step',[[2400,5180],[2700,5160]],75),
  deck('tm-cloister-stair',[[3020,4998.979591836735],[3260,4780],[3500,4580],[3720,4420],[3970,4200],[4240,3960]],95),
  plane('tm-cloister-landing',[[4240,3960],[4540,3830],[4820,3830]],[[4850,3970],[4570,4100],[4280,4110],[4170,4050]]),
  deck('tm-cloister-return',[[3180,3540],[3600,3560],[3990,3670],[4440,3873.3333333333335]],100),
  deck('tm-cloister-turn',[[3060,3730],[3360,3740]],85),
  deck('tm-cloister-foot',[[3260,3930],[3520,3930]],85),
  deck('tm-cloister-link',[[3400,4090],[3670,4090]],85),
  plane('tm-west-reflection-wall',[[4690,3670],[4770,3670]],[[4770,3830],[4690,3830]],{role:'wall'}),
  deck('tm-hall-side-gallery',[[4820,3830],[5250,3710],[5560,3710]],105),
  deck('tm-hall-gallery-step',[[5480,3900],[5740,3900]],80),
  deck('tm-hall-gallery-foot',[[5520,4090],[5800,4090]],85),
  plane('tm-undercroft-tooth',[[3860,5260],[4160,5200],[4460,5300]],[[4380,5520],[4140,5540],[3910,5400]],{role:'ceiling',honroCeiling:true}),
  deck('tm-lower-prayer-ledge',[[4760,5730],[5150,5730]],80),
  plane('tm-undercroft-reflector',[[6670,5790],[6790,5790]],[[6810,5940],[6670,5940]],{role:'wall'}),
  deck('tm-east-undercroft-stair',[[7400,5800],[7700,5570],[8030,5200],[8330,4930],[8620,4760]],100),
  deck('tm-archive-walk',[[8970,4655],[9260,4495],[9760,4475],[10070,4615]],100),
  deck('tm-archive-return',[[10200,4600],[10480,4600]],85)
 ];
}
export function applyStage16Temple(project) {
 const st=project.stages.find(s=>s.metadata?.stageId===16);
 if (!st) return project;
 const old=clone(st), ts=createTempleTerrains();
 st.width=11000; st.height=7600; st.terrains=ts; st.materials=[]; st.elements=[];
 delete st.terrainBounds; delete st.playBounds; delete st.terrainDomainVersion;
 st.initialState={...old.initialState,honroTempleVersion:TEMPLE_VERSION,honroStage16EncounterRevision:1,honroAct2GeometryRevision:8,honroCaveEnvelope:{version:2,portals:[{side:'left',top:3900,bottom:5480},{side:'right',top:3310,bottom:4750}]}};
 const top=id=>{const t=ts.find(t=>t.id===id); if(!t)throw Error('Unknown temple surface '+id); return t.points.slice(0,t.properties.honroWalkEdges.length+1).map(p=>[p.x,p.y]);};
 const at=(id,x)=>{
  if(id==='tm-processional-stair'&&x>2550)id=x<3500?'tm-processional-bridge':'tm-processional-upper';
  if(id==='tm-east-stone-stair'&&x>8110)id='tm-east-stone-bridge';
  return{x,y:templeHeight(top(id),x),surfaceId:id};
 };
 const walk=(id,a,z)=>[...new Set([a,...top(id).map(p=>p[0]).filter(x=>x>Math.min(a,z)&&x<Math.max(a,z)),z])].sort((x,y)=>a<=z?x-y:y-x).map(x=>at(id,x));
 const join=(...p)=>p.flat().filter((v,i,a)=>!i||JSON.stringify(v)!==JSON.stringify(a[i-1]));
 const jump=(id,x,to,y,speed=.5)=>({...at(id,x),jumpTo:{x:y,support:to,speed}});
 const drop=(id,x,to,y)=>({...at(id,x),dropTo:{x:y,support:to}});
 const main=join(walk('act2-floor',350,1800),walk('tm-processional-stair',1800,2510),[jump('tm-processional-stair',2510,'tm-processional-bridge',2730,1)],walk('tm-processional-bridge',2730,3500),walk('tm-processional-upper',3500,4600),walk('tm-great-hall-plinth',4600,7350),walk('tm-east-stone-stair',7350,8090),[jump('tm-east-stone-stair',8090,'tm-east-stone-bridge',8270,.8)],walk('tm-east-stone-bridge',8270,8800),walk('act2-floor',8800,10470));
 const shelter=join([jump('tm-processional-stair',2520,'tm-shelter-step',2520)],[jump('tm-shelter-step',2670,'tm-shelter-veranda',2710)],walk('tm-shelter-veranda',2710,3440),[drop('tm-shelter-veranda',3440,'tm-processional-upper',3510)]);
 const cloister=join(walk('tm-shelter-veranda',3100,3020),walk('tm-cloister-stair',3020,4240),walk('tm-cloister-landing',4240,4820),walk('tm-hall-side-gallery',4820,5530),[drop('tm-hall-side-gallery',5530,'tm-hall-gallery-step',5690)],[drop('tm-hall-gallery-step',5720,'tm-hall-gallery-foot',5770)],[drop('tm-hall-gallery-foot',5790,'tm-great-hall-plinth',5850)]);
 const returnGallery=join([jump('tm-great-hall-plinth',5690,'tm-hall-gallery-foot',5690)],[jump('tm-hall-gallery-foot',5690,'tm-hall-gallery-step',5680)],[jump('tm-hall-gallery-step',5540,'tm-hall-side-gallery',5520)],walk('tm-hall-side-gallery',5520,4820),walk('tm-cloister-landing',4820,4440),walk('tm-cloister-return',4440,3210),[drop('tm-cloister-return',3220,'tm-cloister-turn',3130)],[drop('tm-cloister-turn',3340,'tm-cloister-foot',3430)],[drop('tm-cloister-foot',3500,'tm-cloister-link',3570)],[drop('tm-cloister-link',3670,'tm-cloister-stair',3790)]);
 const low=join([drop('tm-processional-stair',2540,'act2-floor',2605)],walk('act2-floor',2605,7400),walk('tm-east-undercroft-stair',7400,8620),walk('tm-east-stone-bridge',8620,8800));
 const lowBack=join(walk('act2-floor',7360,2605),[jump('act2-floor',2605,'tm-shelter-step',2510,.6)]);
 const archive=join([jump('act2-floor',8960,'tm-archive-walk',8980,.4)],walk('tm-archive-walk',8980,10050),[drop('tm-archive-walk',10050,'act2-floor',10130)],walk('act2-floor',10130,10470));
 const routes=[{id:'main',kind:'required',anchors:main},{id:'shelter-circuit',kind:'optional-jump',anchors:shelter},{id:'west-cloister',kind:'optional-jump',anchors:cloister},{id:'hall-gallery-return',kind:'optional-jump',anchors:returnGallery},{id:'undercroft-east',kind:'optional-jump',anchors:low},{id:'undercroft-shelter-return',kind:'optional-jump',anchors:lowBack},{id:'archive-balcony',kind:'optional-jump',anchors:archive}].map(r=>({...r,requires:[],defaultJump:true}));
 const zones=[{id:'temple-court',name:'산문과 돌계단 앞마당',box:[0,4000,2800,1750]},{id:'monk-shelter',name:'승려 쉼터와 접힌 서회랑',box:[2400,3100,2450,2400]},{id:'great-hall',name:'대법당과 높은 석축',box:[4500,2100,3100,3150]},{id:'undercroft',name:'기단 아래 기도굴',box:[3100,5100,5100,1150]},{id:'record-gallery',name:'동회랑 기록방과 증언마당',box:[7800,3450,3200,2200]}];
 const room=(x,y)=>y>5450&&x>3000&&x<8200?'undercroft':x<2400?'temple-court':x<4600?'monk-shelter':x<7800?'great-hall':'record-gallery';
 const nodes={'clear-court':at('tm-processional-stair',2090),monk:at('tm-shelter-veranda',2950),hall:at('tm-great-hall-plinth',5650),'hold-hall':at('tm-great-hall-plinth',6250),record:at('act2-floor',9360),'clear-temple':at('act2-floor',9910),witness:at('act2-floor',10470)};
 const space={version:1,geometryRevision:8,topologyId:'monumental-cave-temple-cloister-and-undercroft',rooms:zones.map(z=>({id:z.id,terrainIds:ts.filter(t=>t.id!=='cave-roof'&&t.points.some(p=>p.x>=z.box[0]&&p.x<=z.box[0]+z.box[2])).map(t=>t.id),ceilingIds:['cave-roof'],bounds:{x:z.box[0],y:z.box[1],w:z.box[2],h:z.box[3]},sky:'cave',landmarkIds:[]})),surfaces:ts.filter(t=>t.properties.honroWalkEdges.length).map(t=>({id:t.id,terrainId:t.id,role:t.properties.honroSurfaceRole,edgeIndices:clone(t.properties.honroWalkEdges),roomIds:[room(t.points[0].x,t.points[0].y)]})),routes,connections:routes.map(r=>({id:r.id,from:room(r.anchors[0].x,r.anchors[0].y),to:room(r.anchors.at(-1).x,r.anchors.at(-1).y),kind:r.id==='main'?'walk':'optional-jump',routeId:r.id,entry:clone(r.anchors[0]),exit:clone(r.anchors.at(-1)),requires:[]})),sites:{},encounterSites:[],landmarks:[],scenery:[],lights:[],views:[]};
 for(const[id,p]of Object.entries(nodes))space.sites[id]={objectiveId:id,roomId:room(p.x,p.y),...p,standing:clone(p)};
 st.routes=main.map(({x,y})=>({x,y}));st.anchors={spawn:at('act2-floor',350),start:at('act2-floor',350),exit:clone(nodes.witness)};
 st.markers=old.markers.map(m=>nodes[m.id]?{...m,x:nodes[m.id].x,y:nodes[m.id].y}:m.type==='act2-wave'?{...m,...at('tm-east-stone-stair',7980)}:m);
 const positions=[['a2-enemy-0','act2-floor',1620,0],['a2-enemy-1','act2-floor',1740,0],['a2-enemy-2','tm-processional-stair',2438,0],['a2-enemy-3','tm-processional-stair',2360,0],['a2-enemy-4','tm-processional-bridge',2790,0],['a2-enemy-5','tm-shelter-step',2460,-240],['a2-enemy-6','tm-cloister-stair',3590,-170],['a2-enemy-7','tm-cloister-landing',4560,-175],['a2-enemy-8','tm-cloister-stair',3680,-175],['a2-enemy-9','tm-processional-stair',2460,-155],['a2-enemy-10','tm-great-hall-plinth',4970,0],['a2-enemy-11','tm-great-hall-plinth',5230,0],['a2-enemy-12','tm-great-hall-plinth',5110,0],['a2-enemy-13','tm-great-hall-plinth',7050,0],['a2-enemy-14','tm-great-hall-plinth',7180,0],['a2-enemy-15','tm-hall-side-gallery',5320,-200],['a2-enemy-16','act2-floor',5970,-180],['a2-enemy-17','act2-floor',9280,-180],['a2-enemy-18','tm-archive-walk',9630,-180],['a2-enemy-19','tm-archive-walk',9870,-190],['a2-enemy-20','act2-floor',9120,0],['a2-enemy-21','act2-floor',9245,0],['a2-enemy-22','tm-archive-walk',9510,0],['a2-enemy-23','act2-floor',10070,0]];
 const oldRoster=Object.fromEntries(old.units.map(u=>[u.id,u]));
 st.units=old.units.filter(u=>u.team==='player').map(u=>({...u,...at('act2-floor',350+['occultist','mage','archer','knight'].indexOf(u.kind)*110)}));
 for(const[id,support,x,lift]of positions){
  const i=Number(id.split('-').at(-1)),p=at(support,x),u={id,kind:i<5||i>=20?'stoneLantern':i<10?'monkVessel':i<15?'picks':'bat',team:'enemy',facing:1,behavior:'patrol',x,y:p.y+lift,spawnIndex:i+Math.floor(i/10),stageOverrides:{honroCohort:i<10&&i!==7?'west':i<15?'middle':'east',honroAct2Elite:[3,7,11,15,19,23].includes(i),honroAct2Revision:2,elite:false,armor:.04,honroEncounterSupport:p.surfaceId}};
  st.units.push(u);space.encounterSites.push({id:'site-'+id,unitId:id,roomId:room(x,u.y),...p,y:u.y,standing:p,cohort:u.stageOverrides.honroCohort});
 }
 const additions=[['tm-court-flank','stoneLantern','tm-shelter-step',2600,0,'west',false],['tm-cloister-guard','stoneLantern','tm-cloister-landing',4410,0,'middle',true],['tm-hall-screen','picks','tm-great-hall-plinth',6930,0,'middle',false],['tm-hall-echo','monkVessel','tm-great-hall-plinth',7350,-175,'middle',false],['tm-gallery-lantern','stoneLantern','tm-hall-side-gallery',5470,0,'middle',false],['tm-lower-front','stoneLantern','act2-floor',4680,0,'middle',false],['tm-lower-elite','stoneLantern','tm-lower-prayer-ledge',4900,0,'middle',true],['tm-lower-flank','picks','act2-floor',6320,0,'middle',false],['tm-archive-front','stoneLantern','act2-floor',9000,0,'east',false],['tm-archive-rear','monkVessel','act2-floor',10250,-170,'east',false]];
 for(const[id,kind,support,x,lift,cohort,elite]of additions){const p=at(support,x),u={id,kind,team:'enemy',x,y:p.y+lift,facing:1,spawnIndex:100+st.units.length*11,behavior:'patrol',stageOverrides:{elite:false,armor:.04,honroCohort:cohort,honroAct2Elite:elite,honroAct2Revision:2,honroEncounterSupport:support}};st.units.push(u);space.encounterSites.push({id:'site-'+id,unitId:id,roomId:room(x,u.y),...p,y:u.y,standing:p,cohort});}
 for(const id of ['resident-1','resident-spirit-1','objective']){const u=clone(oldRoster[id]),p=at('tm-shelter-veranda',id==='resident-1'?2990:id==='resident-spirit-1'?3080:3160);u.x=p.x;u.y=p.y+(id==='resident-spirit-1'?-155:0);st.units.push(u);}
 const squads=new Map();
 for(const u of st.units.filter(u=>u.team==='enemy')){const group=u.id==='resident-spirit-1'?'shelter-bound-spirit':u.y>5400?'undercroft-ward':u.x<2250?'gate-front':u.x<3000?'court-flank':u.x<4600?'cloister-ward':u.x<5900?(u.y<4000?'hall-overwatch':'hall-west-guard'):u.x<8000?'hall-east-guard':'archive-ward';u.encounterGroup=group;if(!squads.has(group))squads.set(group,[]);squads.get(group).push(u.id);}
 st.encounters=[...squads].map(([id,unitIds])=>({id,key:id,behavior:'patrol',unitIds}));
 st.initialState.honroTempleDefenseEntries=[{side:'west',...at('tm-great-hall-plinth',4810),alternates:[at('tm-great-hall-plinth',5330)]},{side:'east',...at('tm-east-stone-stair',7770),alternates:[at('tm-east-stone-stair',8260)]}];
 st.design={...old.design,description:'거대한 동굴 사찰. 앞마당의 돌계단·접힌 서회랑·대법당 기단 아래를 오가며 승려를 구하고 기록함을 지킨다.',space,temple:{version:TEMPLE_VERSION,art:{hall:{terrainId:'tm-great-hall-plinth',x:5925},lamps:[{key:'court',terrainId:'tm-processional-stair',x:2240,scale:.8},{key:'shelter',terrainId:'tm-shelter-veranda',x:3250,scale:.65},{key:'hall-west',terrainId:'tm-great-hall-plinth',x:4700,scale:1.05},{key:'hall-east',terrainId:'tm-great-hall-plinth',x:7270,scale:1.05},{key:'lower',terrainId:'act2-floor',x:5440,scale:.65},{key:'records',terrainId:'act2-floor',x:9510,scale:.8}]},zones,activityBounds:[350,3400,10470,5960],encounters:{initial:35,elite:8,wave:10,activeLimit:4,groups:zones.map(z=>({id:z.id,name:z.name,units:space.encounterSites.filter(e=>e.roomId===z.id).map(e=>e.unitId)}))}}};
 delete st.design.cavernLayers;
 return project;
}
