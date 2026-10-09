/** The hollow bell: one authored geography for Stage18 and its settled Stage19.
 * Gameplay snapshots already in progress are deliberately never rewritten. */
const clone = v => JSON.parse(JSON.stringify(v));
export const BELL_REVISION = 1;
export const BELL_SIZE = {width:13600,height:9600};
export const BELL_BODY_IDS = ['sb-bell-crown','sb-bell-west-wall','sb-bell-east-wall','sb-bell-east-yoke'];
export const BELL_SHELL = {
 'sb-bell-crown':[[6340,3240],[6520,2940],[6870,2760],[7520,2790],[7800,2950],[7990,3260],[7770,3410],[7540,3120],[6800,3120],[6580,3420]],
 'sb-bell-west-wall':[[6340,3240],[6580,3420],[6440,4550],[6220,6610],[5650,6610],[5710,6430],[5880,6220],[6070,4530]],
 'sb-bell-east-wall':[[7990,3260],[8220,4510],[8540,6160],[8740,6410],[8820,6610],[8300,6610],[8020,4570],[7770,3410]],
 'sb-bell-east-yoke':[[8510,6170],[9190,6170],[9190,6290],[8550,6290]]
};
export const BELL_FLOOR = [[0,5800],[1050,5800],[1780,6010],[2530,6650],[3310,7160],[4430,7410],[5660,7480],[8740,7480],[9280,7330],[10220,6440],[10940,6180],[12150,6180],[12900,6220],[13600,6310]];
export const BELL_ROOF = [[0,4420],[1200,4180],[2080,3220],[3520,2110],[5020,1480],[6520,1120],[8090,1320],[9470,1950],[10740,2670],[11840,3370],[12600,4310],[13600,4770]];
export function bellHeight(points,x){for(let i=1;i<points.length;i++){const a=points[i-1],z=points[i];if(z[0]>a[0]&&x>=a[0]-1e-5&&x<=z[0]+1e-5)return a[1]+(z[1]-a[1])*(x-a[0])/(z[0]-a[0]);}throw Error('Missing bell support '+x);}
function plane(id,top,bottom,{oneWay=false,material='rock',role='shelf',optional=true,...extra}={}){
 return{id,name:id,type:'solid',points:[...top,...bottom].map(([x,y])=>({x,y})),baseMaterial:material,breakable:false,oneWay,layer:'terrain',properties:{surfaceKind:material==='wood'?'wood':'cave',honroCave:true,honroBell:true,honroSpaceSurfaceId:id,honroSurfaceRole:role,honroWalkEdges:role==='ceiling'||role==='wall'?[]:top.slice(1).map((_,i)=>i),optional,...extra},detail:{spacing:18,roughness:0,seed:18,optimizeEpsilon:0}};
}
const slab=(id,top,depth=110,extra={})=>plane(id,top,top.slice().reverse().map(([x,y])=>[x,y+depth]),extra);
const deck=(id,top,depth=70,extra={})=>slab(id,top,depth,{oneWay:true,material:'wood',...extra});
export function createBellTerrains({settled=false}={}){
 const ts=[
  plane('act2-floor',BELL_FLOOR,[[13600,9600],[0,9600]],{role:'floor',optional:false}),
  plane('cave-roof',BELL_ROOF,[[13600,0],[0,0]],{role:'ceiling',optional:false,honroCeiling:true}),
  // The lower passage is independent of every moving piece and every platform.
  deck('sb-entry-rise',[[1050,5620],[1700,5520],[2240,5480]],75,{optional:false,material:'rock'}),
  plane('sb-suppression-court',[[2240,5480],[3000,5460],[3680,5500],[4220,5580]],[[4240,5940],[3820,6130],[3260,5960],[2700,6070],[2260,5770]],{optional:false}),
  // Two solid reflecting faces interrupt sight lines without closing the court.
  plane('sb-court-reflector',[[3300,5290],[3410,5290]],[[3410,5485],[3300,5478]],{role:'wall'}),
  slab('sb-court-rear-ledge',[[3550,5230],[3960,5230]],95),
  deck('sb-court-rear-step',[[4050,5410],[4300,5410]],65),
  deck('sb-west-upper-rise',[[1850,5328.888888888889],[2400,4770],[3100,4040],[3360,3760]],70,{optional:false,material:'rock'}),
  plane('sb-west-firing-ledge',[[3360,3760],[4250,3780]],[[4230,4040],[3890,4170],[3620,4060],[3380,4020]]),
  deck('sb-west-crown-rise',[[3200,3770],[3600,3400],[4100,3170],[5050,3170]],75,{material:'rock'}),
  slab('sb-west-firing-crown',[[5050,3170],[5390,3180],[5650,3280]],210),
  deck('sb-west-return-1',[[5680,3470],[5920,3470]]),
  deck('sb-west-return-2',[[5260,3660],[5560,3660]]),
  deck('sb-west-return-3',[[5470,3850],[5740,3850]]),
  deck('sb-west-return-4',[[5260,4040],[5560,4040]]),
  deck('sb-west-return-5',[[5470,4230],[5740,4230]]),
  deck('sb-west-return-6',[[5260,4380],[5500,4380]]),
  slab('sb-maintenance-shelf',[[5370,4520],[5790,4520]],140,{optional:false}),
  // The underside route approaches the very same release from below.
  deck('sb-maintenance-rise',[[3310,6980],[3560,6881.91011235955],[4200,6170],[4910,5380],[5360,4850]],80,{optional:false,material:'rock'}),
  deck('sb-maintenance-footstep',[[5100,4695],[5350,4695]],70),
  deck('sb-court-lower-link',[[4200,6170],[4450,5891.830985915493]],85),
  deck('sb-court-lower-step',[[4190,5770],[4450,5770]],70),
  plane('sb-lower-vault-tooth',[[2690,6150],[2860,6080],[3060,6200]],[[3030,6420],[2830,6390],[2730,6300]],{role:'ceiling',honroCeiling:true}),
  slab('sb-west-resting-saddle',[[5690,6810],[6240,6810]],230),
  slab('sb-east-resting-saddle',[[8290,6810],[8860,6810]],230),
  // Narrow side gallery. Initial bronze lug fills it; after descent it is floor.
  plane('sb-east-gallery-roof',[[8810,5890],[9310,5900]],[[9360,6160],[8810,6160]],{role:'ceiling',honroCeiling:true}),
  slab('sb-east-gallery-sill',[[8820,6370],[9630,6370]],90),
  // H is folded around a deep eastern buttress, not a copy of the western climb.
  deck('sb-east-inner-rise',[[9330,7102.659574468085],[9950,6370],[10200,6060]],85,{optional:false,material:'rock'}),
  deck('sb-keeper-side-approach',[[9650,6370],[10200,6060],[10680,6030]],90,{material:'rock'}),
  deck('sb-east-folded-stair',[[9170,6370],[9400,6370],[9820,5850],[10400,5140],[10780,4820]],105),
  deck('sb-east-upper-arc',[[8830,3470],[9360,3520],[10020,3900],[10700,4468.219178082192]],85,{optional:false,material:'rock'}),
  deck('sb-east-upper-return',[[10900,4643.561643835616],[11480,5160],[12150,5700],[12420,6030]],85,{optional:false,material:'rock'}),
  slab('sb-east-resonance-ledge',[[8220,3460],[8830,3470]],240),
  slab('sb-east-reflection-wall',[[8430,3300],[8530,3300]],165,{role:'wall'}),
  deck('sb-east-sight-shoulder',[[8620,3910],[9010,3910]],80),
  deck('sb-east-sight-step',[[8970,3730],[9240,3730]],75),
  slab('sb-keeper-watch',[[11310,5950],[11740,5950]],100),
  deck('sb-keeper-flank-step',[[11840,6090],[12130,6090]],65),
  // A short front cover allows circling on foot; it is deliberately not a gate.
  plane('sb-keeper-cover',[[10660,6281.111111111111],[10790,6140],[10850,6140],[10940,6180]],[[10940,6390],[10660,6460]],{role:'shelf'}),
  slab('sb-lower-prayer-stone',[[6750,7150],[7170,7150]],90),
  plane('sb-west-shoulder-mass',[[2140,5034.868686868687],[2400,4770],[3100,4040],[3360,3760]],[[3370,4050],[3070,4440],[2780,4770],[2370,5160],[2140,5290]]),
  plane('sb-west-crown-mass',[[3500,3492.5],[3600,3400],[4100,3170],[5050,3170]],[[5050,3550],[4680,3660],[4280,3560],[3940,3600],[3550,3650]]),
  plane('sb-lower-buttress-mass',[[3560,6881.91011235955],[4200,6170]],[[4230,6500],[4040,6800],[3800,7010],[3610,7080],[3560,7050]]),
  plane('sb-maintenance-buttress-mass',[[4450,5891.830985915493],[4910,5380],[5360,4850]],[[5360,5130],[5160,5450],[4850,5890],[4650,6200],[4450,6270]]),
  plane('sb-east-resonance-mass',[[8830,3470],[9360,3520],[10020,3900],[10100,3966.849315068493]],[[10050,4270],[9700,4210],[9360,3940],[9060,3840],[8830,3760]]),
  plane('sb-east-throat-mass',[[10400,4217.534246575343],[10650,4426.438356164384]],[[10650,4720],[10540,4830],[10400,4580]]),
  plane('sb-east-keeper-mass',[[10900,4643.561643835616],[11480,5160],[12060,5627.462686567164]],[[12050,5920],[11620,5750],[11240,5500],[10900,5150]]),
 ];
 for(const id of BELL_BODY_IDS){const ps=BELL_SHELL[id].map(([x,y])=>[x,y+(settled?200:0)]);ts.push(plane(id,ps,[],{material:'iron',role:'wall',optional:false,honroBellBody:true,honroBellMoving:true,honroBellShell:true}));}
 if(!settled){const t=plane('upper-chain',[[5580,4400],[5670,4400]],[[5670,4520],[5580,4520]],{material:'iron',role:'wall',optional:false,honroBellRelease:true,honroMeleeTarget:true,hp:240,maxHp:240});t.breakable=true;ts.push(t);}
 return ts;
}
const ZONES=[
 {id:'bell-entry',letter:'A',name:'서쪽 입석문',box:[300,4750,2300,1850]},
 {id:'suppression-court',letter:'B',name:'울림암정',box:[2240,4920,2100,1160]},
 {id:'chain-shoulder',letter:'C',name:'서쪽 고리 사격턱',box:[3320,2970,2540,1900]},
 {id:'resonance-wall',letter:'D',name:'동쪽 공명벽',box:[8090,2980,2010,1700]},
 {id:'lower-chain-floor',letter:'E',name:'받침돌 외곽',box:[2860,6020,2940,1550]},
 {id:'leak-basin',letter:'F',name:'종입술 아래 빈 공동',box:[5720,6660,3200,1010]},
 {id:'keeper-ledge',letter:'G',name:'종지기 동쪽 석대',box:[10000,5580,2250,1210]},
 {id:'east-return',letter:'H',name:'동쪽 되오름 굴',box:[8900,4200,2760,2430]}
];
function roomAt(x,y){if(x<2240)return'bell-entry';if(x<5840){if(y<4890)return'chain-shoulder';return y<6050?'suppression-court':'lower-chain-floor';}if(x<8910)return y>6650?'leak-basin':'resonance-wall';return x>10000&&y>5570?'keeper-ledge':y<4200?'resonance-wall':'east-return';}
function authorGeometry(st,settled){
 const ts=st.terrains=createBellTerrains({settled});
 const top=id=>{const t=ts.find(t=>t.id===id);if(!t)throw Error('Missing bell terrain '+id);return t.points.slice(0,t.properties.honroWalkEdges.length+1).map(p=>[p.x,p.y]);};
 const at=(id,x)=>({x,y:bellHeight(top(id),x),surfaceId:id});
 const walk=(id,a,z)=>[...new Set([a,...top(id).map(p=>p[0]).filter(x=>x>Math.min(a,z)&&x<Math.max(a,z)),z])].sort((x,y)=>a<=z?x-y:y-x).map(x=>at(id,x));
 const join=(...rs)=>rs.flat().filter((v,i,a)=>!i||JSON.stringify(v)!==JSON.stringify(a[i-1]));
 const jump=(id,x,to,y,speed=.5)=>({...at(id,x),jumpTo:{x:y,support:to,speed}});
 const drop=(id,x,to,y,stepOffX)=>({...at(id,x),dropTo:{x:y,support:to,...(stepOffX===undefined?{}:{stepOffX})}});
 const route=(id,kind,anchors)=>({id,kind,anchors,requires:[],defaultJump:true});
 const routes=[
  route('entry-suppression','required',join(walk('act2-floor',520,1050),[jump('act2-floor',1050,'sb-entry-rise',1100,.4)],walk('sb-entry-rise',1100,2240),walk('sb-suppression-court',2240,3180))),
  route('west-high-circuit','optional-jump',join(walk('sb-entry-rise',1940,1850),[jump('sb-entry-rise',1850,'sb-west-upper-rise',1850,.2)],walk('sb-west-upper-rise',1850,3360),walk('sb-west-firing-ledge',3360,4210))),
  route('west-crown-circuit','optional-jump',join(walk('sb-west-firing-ledge',4210,3360),walk('sb-west-upper-rise',3360,3240),[jump('sb-west-upper-rise',3240,'sb-west-crown-rise',3240,.2)],walk('sb-west-crown-rise',3240,5050),walk('sb-west-firing-crown',5050,5620))),
  route('west-firing-return','return',join(walk('sb-west-firing-ledge',4210,3360),walk('sb-west-upper-rise',3360,1850),[drop('sb-west-upper-rise',1850,'sb-entry-rise',1790,1780)],walk('sb-entry-rise',1790,2240),walk('sb-suppression-court',2240,3050))),
  route('west-maintenance-return','return',join([drop('sb-west-firing-crown',5620,'sb-west-return-1',5800,5710)],[drop('sb-west-return-1',5700,'sb-west-return-2',5480,5640)],[drop('sb-west-return-2',5530,'sb-west-return-3',5630,5600)],[drop('sb-west-return-3',5490,'sb-west-return-4',5400,5420)],[drop('sb-west-return-4',5530,'sb-west-return-5',5630,5600)],[drop('sb-west-return-5',5490,'sb-west-return-6',5400,5420)],[drop('sb-west-return-6',5480,'sb-maintenance-shelf',5470,5540)])),
  route('entry-under-bell','required',join(walk('act2-floor',520,8170))),
  route('under-bell-entry-return','return',join(walk('act2-floor',8170,520))),
  route('lower-maintenance-approach','optional-walk',join(walk('act2-floor',4300,3310),[jump('act2-floor',3310,'sb-maintenance-rise',3340,.3)],walk('sb-maintenance-rise',3340,5350),[jump('sb-maintenance-rise',5350,'sb-maintenance-footstep',5320,.2)],[jump('sb-maintenance-footstep',5320,'sb-maintenance-shelf',5450,.6)],walk('sb-maintenance-shelf',5450,5500))),
  route('maintenance-lower-return','return',join([drop('sb-maintenance-shelf',5390,'sb-maintenance-footstep',5270,5320)],[drop('sb-maintenance-footstep',5120,'sb-maintenance-rise',5030,5040)],walk('sb-maintenance-rise',5030,3310),[drop('sb-maintenance-rise',3320,'act2-floor',3230,3250)],walk('act2-floor',3230,5800))),
  route('court-lower-turn','optional-jump',join(walk('sb-suppression-court',3180,4190),[drop('sb-suppression-court',4190,'sb-court-lower-step',4400,4350)],[drop('sb-court-lower-step',4420,'sb-maintenance-rise',4410,4490)],walk('sb-maintenance-rise',4410,4200),walk('sb-maintenance-rise',4200,3320))),
  route('under-bell-keeper','required',join(walk('act2-floor',7300,11500))),
  route('keeper-under-bell-return','return',join(walk('act2-floor',11500,7300))),
  route('east-outer-arc','optional-walk',join(walk('act2-floor',11500,12420),[jump('act2-floor',12420,'sb-east-upper-return',12400,.2)],walk('sb-east-upper-return',12400,10905),[jump('sb-east-upper-return',10905,'sb-east-upper-arc',10690,.8)],walk('sb-east-upper-arc',10690,8830),walk('sb-east-resonance-ledge',8830,8290))),
  route('east-upper-return','return',join(walk('sb-east-resonance-ledge',8290,8830),walk('sb-east-upper-arc',8830,10680),[jump('sb-east-upper-arc',10680,'sb-east-upper-return',10920,.8)],walk('sb-east-upper-return',10920,12410),[drop('sb-east-upper-return',12410,'act2-floor',12490,12480)],walk('act2-floor',12490,11500))),
  route('east-folded-ascent','optional-walk',join(walk('act2-floor',8750,9330),[jump('act2-floor',9330,'sb-east-inner-rise',9340,.2)],walk('sb-east-inner-rise',9340,10200),walk('sb-keeper-side-approach',10200,10650))),
  route('east-throat-ascent','optional-jump',join([jump('sb-keeper-side-approach',9650,'sb-east-gallery-sill',9600,.35)],walk('sb-east-gallery-sill',9600,9400),[jump('sb-east-gallery-sill',9400,'sb-east-folded-stair',9480,.4)],walk('sb-east-folded-stair',9480,10780),[jump('sb-east-folded-stair',10780,'sb-east-upper-return',10920,.6)])),
  route('east-gallery-return','return',join([drop('sb-east-upper-return',10905,'sb-east-folded-stair',10720,10850)],walk('sb-east-folded-stair',10720,9360),walk('sb-east-gallery-sill',9360,9550))),
 ];
 const nodes18={
  'clear-wards':at('sb-entry-rise',2020),silence:at('sb-suppression-court',3050),'hold-silence':at('sb-suppression-court',3050),
  'upper-chain':at('sb-maintenance-shelf',5500),'bell-descent':at('act2-floor',6910),leak:at('act2-floor',7620),keeper:at('act2-floor',11480),'clear-bell':at('act2-floor',11860),
  'spirit-lamp-0':at('sb-suppression-court',3090),'spirit-lamp-1':at('act2-floor',7520),
  'wave-hold-silence':at('sb-suppression-court',3960),wave:at('act2-floor',12620)
 };
 const nodes19={route:at('sb-entry-rise',1940),'separate-1':at('sb-suppression-court',3030),'hold-first':at('sb-suppression-court',3030),'send-1':at('sb-suppression-court',3260),'wave-hold-first':at('sb-suppression-court',3970),
  'separate-2':at('act2-floor',6770),'hold-second':at('act2-floor',6770),'send-2':at('act2-floor',7010),'wave-hold-second':at('act2-floor',5900),
  'separate-3':at('act2-floor',11140),'hold-last':at('act2-floor',11140),'send-3':at('act2-floor',11400),'wave-hold-last':at('act2-floor',12500),
  'clear-souls':at('act2-floor',11720),'old-soul':at('act2-floor',7340),'spirit-lamp-0':at('sb-suppression-court',3090),'spirit-lamp-1':at('act2-floor',7000),wave:at('act2-floor',12620)};
 const nodes=settled?nodes19:nodes18;
 const space={version:1,geometryRevision:9,topologyId:'hollow-bell-asymmetric-inside-outside-circuits',rooms:ZONES.map(z=>({id:z.id,terrainIds:ts.filter(t=>t.id!=='cave-roof'&&t.points.some(p=>p.x>=z.box[0]&&p.x<=z.box[0]+z.box[2]&&p.y>=z.box[1]&&p.y<=z.box[1]+z.box[3])).map(t=>t.id),ceilingIds:['cave-roof'],bounds:{x:z.box[0],y:z.box[1],w:z.box[2],h:z.box[3]},sky:'cave',landmarkIds:[]})),surfaces:ts.filter(t=>t.properties.honroWalkEdges.length).map(t=>({id:t.id,terrainId:t.id,role:t.properties.honroSurfaceRole,edgeIndices:clone(t.properties.honroWalkEdges),roomIds:[roomAt(t.points[0].x,t.points[0].y)]})),routes,connections:routes.map(r=>({id:r.id,from:roomAt(r.anchors[0].x,r.anchors[0].y),to:roomAt(r.anchors.at(-1).x,r.anchors.at(-1).y),kind:r.kind==='optional-jump'?'optional-jump':'walk',routeId:r.id,entry:clone(r.anchors[0]),exit:clone(r.anchors.at(-1)),requires:[]})),sites:{},encounterSites:[],landmarks:[],scenery:[],lights:[],views:[]};
 for(const[id,p]of Object.entries(nodes))if(!id.startsWith('wave')&&!id.startsWith('spirit-lamp'))space.sites[id]={objectiveId:id,roomId:roomAt(p.x,p.y),...p,standing:clone(p)};
 if(!settled)space.sites['upper-chain'].target={terrainId:'upper-chain',x:5625,y:4460};
 st.design={...st.design,space,bell:{version:1,zones:clone(ZONES),center:{x:7200,y:6610+(settled?200:0)},bodyIds:clone(BELL_BODY_IDS),activityBounds:[520,3090,12500,7480],standing:{suppression:at('sb-suppression-court',3050),farRelease:at('sb-west-firing-ledge',4210),closeRelease:at('sb-maintenance-shelf',5500),safeUnderBell:at('act2-floor',7480),keeper:at('act2-floor',11480),eastShot:at('sb-east-resonance-ledge',8290),reflection:at('sb-suppression-court',3170)},art:{bell:{x:7200,y:6610+(settled?200:0),terrainIds:clone(BELL_BODY_IDS)},lamps:[{key:'entry',terrainId:'sb-entry-rise',x:1550},{key:'suppression',terrainId:'sb-suppression-court',x:3030},{key:'maintenance',terrainId:'sb-maintenance-shelf',x:5770},{key:'basin',terrainId:'act2-floor',x:7340},{key:'keeper',terrainId:'act2-floor',x:11680}]}}};
 delete st.design.cavernLayers;delete st.design.cavernTransitions;
 st.routes=routes.find(r=>r.id==='entry-under-bell').anchors.map(({x,y})=>({x,y}));st.anchors={spawn:at('act2-floor',520),start:at('act2-floor',520),exit:clone(nodes[settled?'old-soul':'clear-bell']),bell:{x:7200,y:6610+(settled?200:0)}};
 return{at,walk,nodes,space};
}
// Deliberately authored locations, never an evenly spaced fill of each corridor.
// tuple: local id, class, support, x, flying lift, elite, squad, original budget.
export const BELL_ROSTER=[
 ['a-front','picks','sb-entry-rise',1840,0,false,'entry-front',true],['a-side','picks','sb-entry-rise',1980,0,false,'entry-front',false],['a-lamp','stoneLantern','sb-entry-rise',2170,0,true,'entry-rear',true],['a-bat-low','bat','sb-entry-rise',1985,-220,false,'entry-roof',true],['a-bat-high','bat','sb-entry-rise',2155,-390,false,'entry-roof',true],
 ['b-left','stoneLantern','sb-suppression-court',2860,0,false,'court-west',true],['b-center','picks','sb-suppression-court',2890,0,false,'court-west',true],['b-screen','picks','sb-suppression-court',3520,0,false,'court-east',false],['b-east','stoneLantern','sb-suppression-court',3660,0,true,'court-east',true],['b-high','stoneLantern','sb-court-rear-ledge',3800,0,false,'court-overwatch',false],['b-spirit-left','bellCluster','sb-suppression-court',2770,-310,false,'court-spirits',true],['b-spirit-right','bellCluster','sb-suppression-court',3670,-290,true,'court-spirits',true],['b-spirit-high','bellCluster','sb-court-rear-ledge',3910,-245,false,'court-overwatch',true],
 ['c-bat-front','bat','sb-west-firing-ledge',3630,-190,false,'west-rise',true],['c-bat-side','bat','sb-west-firing-ledge',3790,-310,false,'west-rise',true],['c-bat-crown','bat','sb-west-firing-crown',5260,-260,true,'west-crown',true],['c-bat-rear','bat','sb-west-firing-crown',5420,-375,false,'west-crown',true],['c-lamp','stoneLantern','sb-west-firing-crown',5140,0,false,'west-crown',true],
 ['d-bat-front','bat','sb-east-resonance-ledge',8650,-170,false,'east-ledge',true],['d-bat-roof','bat','sb-east-resonance-ledge',8810,-295,false,'east-ledge',true],['d-lamp','stoneLantern','sb-east-upper-arc',9040,0,true,'east-arc',true],['d-bat-flank','bat','sb-east-upper-arc',9240,-290,false,'east-arc',true],['d-spirit','bellCluster','sb-east-upper-arc',9480,-190,false,'east-arc',false],
 ['e-front','picks','act2-floor',4200,0,false,'lower-front',true],['e-screen','picks','act2-floor',4350,0,false,'lower-front',true],['e-flank','picks','act2-floor',4520,0,true,'lower-flank',false],['e-high','stoneLantern','sb-maintenance-rise',4540,0,false,'maintenance-watch',false],['e-ramp','picks','sb-maintenance-rise',4690,0,true,'maintenance-watch',false],['e-rear','stoneLantern','act2-floor',4770,0,false,'lower-flank',false],
 ['f-spirit-front','bellCluster','act2-floor',6410,-200,false,'basin-west',true],['f-spirit-high','bellCluster','act2-floor',6560,-350,true,'basin-west',true],['f-spirit-side','bellCluster','act2-floor',8060,-220,false,'basin-east',true],['f-spirit-east','bellCluster','act2-floor',8230,-350,true,'basin-east',false],['f-tool-west','picks','act2-floor',6260,0,false,'basin-west',false],['f-tool-east','picks','act2-floor',8180,0,false,'basin-east',true],
 ['g-front','stoneLantern','act2-floor',10420,0,false,'keeper-front',false],['g-tool','picks','sb-keeper-side-approach',10300,0,false,'keeper-front',false],['g-lamp-high','stoneLantern','sb-keeper-watch',11650,0,true,'keeper-high',true],['g-bat-high','bat','sb-keeper-watch',11530,-240,false,'keeper-high',true],['g-bat-side','bat','act2-floor',11260,-240,false,'keeper-flank',false],
 ['act2-keeper','keeper','act2-floor',11480,0,false,'keeper-body',true]
];
export function createBellRoster(at,{roster='candidate41'}={}){
 const rows=roster==='baseline28'?BELL_ROSTER.filter(r=>r[7]):BELL_ROSTER;
 if(rows.length!==(roster==='baseline28'?28:41))throw Error('Bell roster budget mismatch '+rows.length);
 return rows.map(([key,kind,support,x,lift,elite,squad],i)=>{const p=at(support,x),id=key==='act2-keeper'?key:'sb-'+key;return{id,kind,team:'enemy',x,y:p.y+lift,facing:x<7200?-1:1,spawnIndex:100+i*11,behavior:'patrol',encounterGroup:squad,stageOverrides:{honroCohort:key.startsWith('a-')||key.startsWith('b-')?'west':key.startsWith('e-')||key.startsWith('f-')?'middle':'east',honroAct2Elite:elite,honroAct2Revision:2,elite:false,armor:.04,honroEncounterSupport:support,honroBellRole:squad,honroBellCell:squad}};});
}
function makeDescent(at){const entry=(side,support,x,alternate)=>({...at(support,x),side,support,alternates:alternate.map(([id,x])=>({...at(id,x),support:id}))});return{distance:200,terrainIds:clone(BELL_BODY_IDS),elementIds:['sb-bell-body'],sweepPolygons:Object.entries(BELL_SHELL).flatMap(([id,ps])=>[{id:id+'-initial',points:ps.map(([x,y])=>({x,y}))},{id:id+'-final',points:ps.map(([x,y])=>({x,y:y+200}))},...ps.map(([x,y],i)=>{const [nx,ny]=ps[(i+1)%ps.length];return{id:id+'-edge-'+i,points:[{x,y},{x:nx,y:ny},{x:nx,y:ny+200},{x,y:y+200}]};})]),
 sweep:[{id:'crown',x:6280,y:2600,w:1770,h:1010},{id:'west-shell',x:5600,y:3160,w:1040,h:3650},{id:'east-shell',x:7720,y:3180,w:1150,h:3630},{id:'east-lug',x:8510,y:6040,w:740,h:480}],
 resting:{offsetY:200,lipY:6810,crownY:2960,bodyCenterX:7200},safeZones:[{id:'F-permanent-floor',x:5850,y:7060,w:3000,h:420},{id:'west-refuge',x:2800,y:6900,w:2200,h:570},{id:'east-refuge',x:10000,y:5700,w:2300,h:700}],
 escapeRoutes:['under-bell-entry-return','under-bell-keeper'],entries:{hold:[entry('west','sb-suppression-court',3970,[['sb-suppression-court',4100]]),entry('lower-west','act2-floor',5950,[['act2-floor',5750]])],keeper:[entry('east','act2-floor',12600,[['act2-floor',12940]])]}};}
function remapElements(st,old,nodes,at){
 st.elements=[];
 for(const m of st.markers){if(m.type==='act2-wave'||!nodes[m.id])continue;const lamp=m.id.startsWith('spirit-lamp');st.elements.push({id:`sb-${st.metadata.stageId}-site-${m.id}`,assetId:lamp?'act2:lamp':'act2:ritual',x:m.x,y:m.y,scale:lamp?1.3:.7,rotation:0,snap:false,layer:'prop',depthLayer:'L1'});}
 if(st.metadata.stageId===19){const p=nodes['old-soul'];st.elements.push({id:'sb-old-soul-stone',assetId:'act2:old-soul-stone',x:p.x,y:p.y,scale:.85,rotation:0,snap:false,layer:'back',depthLayer:'L1'});}
 for(const e of st.elements)st.design.space.scenery.push({id:e.id,elementId:e.id,assetId:e.assetId,x:e.x,y:e.y,scale:e.scale,roomId:roomAt(e.x,e.y)});
}
export function applyStage18Bell(project,{roster='candidate41',steps}={}){
 for(const n of [18,19]){const st=project.stages.find(s=>s.metadata?.stageId===n);if(!st)throw Error('Missing Stage'+n);const old=clone(st),settled=n===19;
  st.width=BELL_SIZE.width;st.height=BELL_SIZE.height;st.materials=[];delete st.terrainBounds;delete st.playBounds;delete st.terrainDomainVersion;
  const {at,nodes,space}=authorGeometry(st,settled);
  st.initialState={...old.initialState,honroBellRevision:1,honroAct2GeometryRevision:9,honroActiveLimit:3,honroCaveForms:[],honroCaveEnvelope:{version:2,portals:[{side:'left',top:4420,bottom:5800},{side:'right',top:4770,bottom:6310}]},honroBellDescent:makeDescent(at)};
  if(!settled&&steps)st.initialState.honroAct2Steps=clone(steps);
  if(settled)st.initialState.honroState={...old.initialState.honroState,bellDescent:{version:1,status:'settled',offset:200,count:1}};
  const currentSteps=st.initialState.honroAct2Steps;
  st.markers=old.markers.filter(m=>m.id!=='lower-chain').map(m=>{const key=m.id==='marker-upper-chain'?'upper-chain':m.id,p=nodes[key];return p?{...m,x:key==='upper-chain'?5625:p.x,y:key==='upper-chain'?4460:p.y,...(key==='upper-chain'?{requiredClass:undefined,label:'장력 고정구 해제'}:{})}:m;});
  if(!settled&&!st.markers.some(m=>m.id==='bell-descent'))st.markers.push({id:'bell-descent',type:'act2',...nodes['bell-descent'],label:'종의 장력을 풀고 안전하게 내려앉히기'});
  if(!settled&&!st.markers.some(m=>m.id==='spirit-lamp-1'))st.markers.push({id:'spirit-lamp-1',type:'act2',action:'act2',label:'원혼등불 · 주변 혼령 현형',...nodes['spirit-lamp-1'],radius:1200});
  for(const s of currentSteps){const m=st.markers.find(m=>m.id===s.id||m.id==='marker-'+s.id);if(m)m.label=s.label;}
  st.units=old.units.filter(u=>u.team==='player').map(u=>({...u,...at('act2-floor',520+['occultist','mage','archer','knight'].indexOf(u.kind)*110)}));
  if(!settled)st.units.push(...createBellRoster(at,{roster}));
  else{
   const sites=[['sb-entry-rise',2050,-170],['sb-entry-rise',2150,-250],['sb-suppression-court',2700,-160],['sb-court-rear-ledge',3710,-180],['sb-suppression-court',2800,-300],['sb-suppression-court',3550,-175],['sb-suppression-court',3680,-320],['sb-west-firing-ledge',4030,-180],['act2-floor',6310,-180],['act2-floor',6460,-300],['act2-floor',6620,-190],['act2-floor',8140,-230],['act2-floor',7950,-370],['act2-floor',8230,-380],['sb-east-inner-rise',9940,-220],['act2-floor',11630,-220],['act2-floor',11790,-370],['sb-keeper-watch',11530,-210]];
   old.units.filter(u=>u.team==='enemy').forEach((u,i)=>{const[support,x,lift]=sites[i],p=at(support,x);st.units.push({...u,x:p.x,y:p.y+lift,stageOverrides:{...u.stageOverrides,honroEncounterSupport:support}});});
   for(const u of old.units.filter(u=>!['player','enemy'].includes(u.team))){const p=at('sb-entry-rise',1600);st.units.push({...u,x:p.x,y:p.y});}
  }
  for(const u of st.units.filter(u=>u.team==='enemy')){const p=at(u.stageOverrides.honroEncounterSupport,u.x);space.encounterSites.push({id:'site-'+u.id,unitId:u.id,roomId:roomAt(u.x,u.y),...p,y:u.y,standing:p,cohort:u.stageOverrides.honroCohort});}
  st.encounters=settled?clone(old.encounters):[...new Set(st.units.map(u=>u.encounterGroup).filter(Boolean))].map(id=>({id,key:id,behavior:'patrol',unitIds:st.units.filter(u=>u.encounterGroup===id).map(u=>u.id)}));
  remapElements(st,old,nodes,at);
  st.design.description='거대한 중공 대종의 안팎을 감싼 비대칭 암반 순환로. 억제진·사격턱·정비턱·종입술·동측 되오름을 나누어 맡는다.';
  st.design.bell.encounters={roster:settled?'preserved19':roster,initial:st.units.filter(u=>u.team==='enemy').length,elite:st.units.filter(u=>u.team==='enemy'&&u.stageOverrides.honroAct2Elite).length,wave:settled?10:12,activeLimit:3,xpPolicy:'Preserve the existing stage XP budget; do not multiply by population.',baselineInitial:28,candidateInitial:41};
 }
 return project;
}
