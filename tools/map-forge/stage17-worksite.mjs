import {insetRavineCorners} from './stage11-ravine.mjs';
/** Stage 17: a braided hoist worksite, authored only for fresh entry/retry.
 * No runtime save geometry projection and no new story/mission semantics. */
const clone=x=>JSON.parse(JSON.stringify(x));
export const WORKSITE_VERSION=1;
export function worksiteHeight(ps,x){for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i];if(b[0]>a[0]&&x>=a[0]-1e-6&&x<=b[0]+1e-6)return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}throw Error('No worksite support at '+x);}
const FLOOR=[[0,4300],[1200,4300],[1700,4380],[2000,5700],[3000,6020],[4200,6090],[4700,6100],[6000,6100],[6400,6130],[7400,6050],[8100,6080],[8350,5720],[8550,4580],[9400,4580],[10000,4780],[11200,4780]];
const ROOF=[[0,3050],[1600,3050],[2150,2620],[3100,2310],[4300,2020],[5300,2260],[5800,2430],[6500,2180],[7500,2190],[8050,2600],[8700,3310],[9500,3340],[10000,3560],[11200,3500]];
function plane(id,top,bottom,{material='rock',oneWay=false,role='shelf',optional=true,...extra}={}){return{id,name:id,type:'solid',points:[...top,...bottom].map(([x,y])=>({x,y})),baseMaterial:material,breakable:false,oneWay,layer:'terrain',properties:{surfaceKind:material==='wood'?'wood':'cave',honroCave:true,honroWorksite:true,honroSpaceSurfaceId:id,honroSurfaceRole:role,honroWalkEdges:role==='ceiling'?[]:top.slice(1).map((_,i)=>i),optional,...extra},detail:{spacing:18,roughness:0,seed:17,optimizeEpsilon:0}};}
const timber=(id,ps,depth=90)=>plane(id,ps,ps.slice().reverse().map(([x,y])=>[x,y+depth]),{material:'wood',oneWay:true});
export function createWorksiteTerrains(){
 const ts=[plane('act2-floor',FLOOR,[[11200,9000],[0,9000]],{role:'floor',optional:false}),plane('cave-roof',ROOF,[[11200,-800],[0,-800]],{role:'ceiling',honroCeiling:true,optional:false}),
 plane('ws-west-work-buttress',[[1700,4380],[2200,4430],[2750,4250],[3200,4290],[3450,4490],[3800,4700]],[[3690,5180],[3420,5480],[2930,5520],[2400,5310],[1900,4760]],{optional:false}),
 plane('ws-west-machine-plinth',[[3800,4700],[4250,4850],[4630,4680],[4800,4755]],[[4780,5380],[4390,5500],[4030,5410],[3760,5140]],{optional:false}),
 timber('ws-hoist-west-lip',[[4800,4755],[5170,4795]],100),
 timber('ws-hoist-service-bridge',[[5310,4820],[5900,4820]],110),
 timber('ws-shaft-top-rest',[[5110,5010],[5280,5010]],85),
 timber('ws-shaft-rest-2',[[5320,5200],[5700,5200]],90),
 timber('ws-shaft-middle-rest',[[5110,5390],[5510,5390]],90),
 timber('ws-shaft-rest-4',[[5380,5580],[5590,5580]],90),
 timber('ws-shaft-lower-rest',[[4980,5770],[5530,5770]],105),
 timber('ws-shaft-rest-6',[[5320,5960],[5770,5960]],90),
 plane('ws-east-hoist-buttress',[[5900,4820],[6300,4650],[6800,4580],[7240,4780],[7550,4711.111111111111]],[[7470,5480],[6920,5570],[6350,5490],[6030,5240]],{optional:false}),
 timber('ws-west-step-1',[[3050,4100],[3310,4100]],95),
 timber('ws-west-lower-steps',[[2660,3910],[3260,3910]],95),
 timber('ws-west-step-3',[[3030,3730],[3240,3730]],95),
 timber('ws-west-switchback',[[2740,3550],[3300,3550]],110),
 timber('ws-west-short-rise',[[3000,3380],[3760,3340],[4100,3350]],110),
 plane('ws-west-upper-rock',[[4100,3350],[4500,3230],[4800,3300]],[[4760,3720],[4510,3970],[4150,3900],[3940,3630]]),
 timber('ws-west-hoist-deck',[[4800,3300],[5180,3210],[5830,3300]],125),
 timber('ws-east-hoist-deck',[[5990,3680],[6400,3750],[6860,3710]],110),
 plane('ws-east-upper-rock',[[6860,3710],[7200,3510],[7650,3550],[7920,3890]],[[7840,4240],[7470,4380],[6990,4250],[6770,3950]]),
 timber('ws-east-upper-step-1',[[8170,4440],[8410,4440]],90),
 timber('ws-east-high-step',[[7850,4255],[8220,4255]],100),
 timber('ws-east-upper-step-3',[[7840,4070],[8240,4070]],90),
 timber('ws-east-crossing',[[7550,4711.111111111111],[8000,4480],[8370,4580]],110),
 plane('ws-axle-footing',[[8370,4580],[8600,4580],[9220,4580]],[[9150,4870],[8660,5030],[8360,4900]],{optional:false}),
 timber('ws-service-east-1',[[7900,5890],[8190,5890]],90),
 timber('ws-service-east-low',[[7980,5700],[8370,5700]],90),
 timber('ws-service-east-3',[[7980,5510],[8180,5510]],90),
 timber('ws-service-east-mid',[[7860,5320],[8350,5320]],100),
 timber('ws-service-east-5',[[8010,5130],[8200,5130]],90),
 timber('ws-service-east-high',[[8010,4940],[8330,4940]],100),
 timber('ws-service-east-7',[[7800,4750],[8250,4750]],90),
 timber('ws-east-fire-access',[[7040,3604.1176470588234],[7520,3110]],95),
 timber('ws-east-fire-deck',[[7520,3110],[7820,3100]],85),
 // A real low tooth makes the service passage turn in height as well as x.
 plane('ws-service-vault-tooth',[[3810,5350],[4200,5370],[4480,5480]],[[4410,5740],[4190,5760],[3980,5600]],{role:'ceiling',honroCeiling:true}),
 plane('ws-service-reflection-pier',[[6560,5960],[6680,5940],[6730,6119.285714285714]],[[6510,6166.428571428572]],{optional:true}),
 timber('ws-service-tool-ledge',[[4550,5930],[4820,5930]],80),
 timber('ws-notes-work-deck',[[10010,4540],[10430,4495],[10720,4560]],80),
 plane('gate-repair',[[9300,3280],[9410,3280]],[[9410,4630],[9300,4630]],{role:'gate',optional:false,hp:99999,maxHp:99999,broken:false})];
 // Inset only convex non-walking corners. The whole authored top contour
 // stays exact; no cave passage is filled and no new walking ramp appears.
 for(const t of ts)if(['ws-west-work-buttress','ws-west-machine-plinth','ws-east-hoist-buttress','ws-west-upper-rock','ws-east-upper-rock','ws-axle-footing'].includes(t.id))insetRavineCorners(t,110);
 return ts;
}
export function applyStage17Worksite(project){
 const st=project.stages.find(s=>s.metadata?.stageId===17);if(!st)return project;
 const old=clone(st),ts=createWorksiteTerrains();st.width=11200;st.height=8200;st.terrains=ts;st.materials=[];st.elements=[];
 delete st.terrainBounds;delete st.playBounds;delete st.terrainDomainVersion;
 st.initialState={...old.initialState,honroWorksiteVersion:WORKSITE_VERSION,honroStage17EncounterRevision:1,honroAct2GeometryRevision:7,honroCaveEnvelope:{version:2,portals:[{side:'left',top:3050,bottom:4300},{side:'right',top:3500,bottom:4780}]}};
 const top=id=>{const t=ts.find(t=>t.id===id);if(!t)throw Error('Unknown worksite surface '+id);return t.points.slice(0,t.properties.honroWalkEdges.length+1).map(p=>[p.x,p.y]);};
 const at=(id,x)=>({x,y:worksiteHeight(top(id),x),surfaceId:id});
 const walk=(id,from,to)=>{const xs=[...new Set([from,...top(id).map(p=>p[0]).filter(x=>x>Math.min(from,to)&&x<Math.max(from,to)),to])].sort((a,b)=>from<=to?a-b:b-a);return xs.map(x=>at(id,x));};
 const join=(...parts)=>{const out=[];for(const p of parts.flat()){const last=out.at(-1);if(last&&last.x===p.x&&last.y===p.y)Object.assign(last,p);else out.push({...p});}return out;};
 const zones=[{id:'brace-workyard',name:'버팀목 작업장',box:[0,3000,3800,3100]},{id:'supported-cut',name:'인양 작업대와 암반 기단',box:[2750,2200,2450,3650]},{id:'hoist-bay',name:'인양구와 축 정비굴',box:[4800,2380,2300,3950]},{id:'axle-platform',name:'인양축과 동측 암반',box:[6900,2600,2400,3550]},{id:'work-notes',name:'복구문 안 작업 기록방',box:[9300,3300,1900,1800]}];
 const room=(x,y)=>x<2750?'brace-workyard':x<4800?'supported-cut':x<6900?'hoist-bay':x<9300?'axle-platform':'work-notes';
 const mid=()=>join(walk('ws-west-work-buttress',1700,3800),walk('ws-west-machine-plinth',3800,4800),walk('ws-hoist-west-lip',4800,5160),[{...at('ws-hoist-west-lip',5160),jumpTo:{x:5330,support:'ws-hoist-service-bridge',speed:1}}],walk('ws-hoist-service-bridge',5330,5900),walk('ws-east-hoist-buttress',5900,7550),walk('ws-east-crossing',7550,8370),walk('ws-axle-footing',8370,8600));
 const main=join(walk('act2-floor',320,1700),mid(),walk('act2-floor',8600,10220));
 const upper=join([{...at('ws-west-work-buttress',3130),jumpTo:{x:3130,support:'ws-west-step-1'}}],[{...at('ws-west-step-1',3080),jumpTo:{x:3080,support:'ws-west-lower-steps'}}],[{...at('ws-west-lower-steps',3120),jumpTo:{x:3120,support:'ws-west-step-3'}}],[{...at('ws-west-step-3',3100),jumpTo:{x:3100,support:'ws-west-switchback'}}],[{...at('ws-west-switchback',3070),jumpTo:{x:3100,support:'ws-west-short-rise'}}],walk('ws-west-short-rise',3100,4100),walk('ws-west-upper-rock',4100,4800),walk('ws-west-hoist-deck',4800,5800),[{...at('ws-west-hoist-deck',5800),jumpTo:{x:6030,support:'ws-east-hoist-deck',speed:1}}],walk('ws-east-hoist-deck',6030,6860),walk('ws-east-upper-rock',6860,7900),[{...at('ws-east-upper-rock',7900),dropTo:{x:8230,support:'ws-east-upper-step-3'}}],[{...at('ws-east-upper-step-3',8230),dropTo:{x:8290,support:'ws-east-upper-step-1'}}],[{...at('ws-east-upper-step-1',8390),dropTo:{x:8460,support:'ws-axle-footing'}}]);
 const shaftDown=join([{...at('ws-hoist-west-lip',5160),dropTo:{x:5230,support:'ws-shaft-top-rest'}}],[{...at('ws-shaft-top-rest',5250),dropTo:{x:5380,support:'ws-shaft-rest-2'}}],[{...at('ws-shaft-rest-2',5350),dropTo:{x:5260,support:'ws-shaft-middle-rest'}}],[{...at('ws-shaft-middle-rest',5480),dropTo:{x:5580,support:'ws-shaft-rest-4'}}],[{...at('ws-shaft-rest-4',5385),dropTo:{x:5260,support:'ws-shaft-lower-rest'}}],[{...at('ws-shaft-lower-rest',5480),dropTo:{x:5580,support:'ws-shaft-rest-6'}}],[{...at('ws-shaft-rest-6',5740),dropTo:{x:5830,support:'act2-floor'}}],walk('act2-floor',5780,7990));
 const eastClimb=join([{...at('act2-floor',8020),jumpTo:{x:8020,support:'ws-service-east-1'}}],[{...at('ws-service-east-1',8080),jumpTo:{x:8080,support:'ws-service-east-low'}}],[{...at('ws-service-east-low',8110),jumpTo:{x:8110,support:'ws-service-east-3'}}],[{...at('ws-service-east-3',8100),jumpTo:{x:8130,support:'ws-service-east-mid'}}],[{...at('ws-service-east-mid',8130),jumpTo:{x:8130,support:'ws-service-east-5'}}],[{...at('ws-service-east-5',8130),jumpTo:{x:8130,support:'ws-service-east-high'}}],[{...at('ws-service-east-high',8120),jumpTo:{x:8120,support:'ws-service-east-7'}}],[{...at('ws-service-east-7',8120),jumpTo:{x:8240,support:'ws-east-crossing',speed:1}}],walk('ws-east-crossing',8240,8370));
 const lower=join(shaftDown,eastClimb);
 const service=join([{...at('act2-floor',5460),jumpTo:{x:5460,support:'ws-shaft-rest-6'}}],[{...at('ws-shaft-rest-6',5460),jumpTo:{x:5460,support:'ws-shaft-lower-rest'}}],[{...at('ws-shaft-lower-rest',5460),jumpTo:{x:5460,support:'ws-shaft-rest-4'}}],[{...at('ws-shaft-rest-4',5460),jumpTo:{x:5460,support:'ws-shaft-middle-rest'}}],[{...at('ws-shaft-middle-rest',5460),jumpTo:{x:5460,support:'ws-shaft-rest-2'}}],[{...at('ws-shaft-rest-2',5340),jumpTo:{x:5250,support:'ws-shaft-top-rest',speed:1}}],[{...at('ws-shaft-top-rest',5250),jumpTo:{x:5350,support:'ws-hoist-service-bridge',speed:1}}],[at('ws-hoist-service-bridge',5530)]);
 const fire=join([{...at('ws-east-upper-rock',7040),jumpTo:{x:7090,support:'ws-east-fire-access'}}],walk('ws-east-fire-access',7090,7520),walk('ws-east-fire-deck',7520,7770));
 const eastUpper=join([{...at('ws-axle-footing',8390),jumpTo:{x:8350,support:'ws-east-upper-step-1'}}],[{...at('ws-east-upper-step-1',8200),jumpTo:{x:8160,support:'ws-east-high-step'}}],[{...at('ws-east-high-step',8000),jumpTo:{x:8000,support:'ws-east-upper-step-3'}}],[{...at('ws-east-upper-step-3',7900),jumpTo:{x:7900,support:'ws-east-upper-rock'}}],walk('ws-east-upper-rock',7900,7040));
 const lowTool=join([{...at('act2-floor',4590),jumpTo:{x:4610,support:'ws-service-tool-ledge'}}],walk('ws-service-tool-ledge',4610,4780),[{...at('ws-service-tool-ledge',4780),dropTo:{x:4880,support:'act2-floor'}}]);
 const routes=[{id:'main',kind:'required',defaultJump:true,anchors:main,requires:[{terrainId:'gate-repair',state:'broken',objectiveId:'repair'}]},{id:'upper-hoist-route',kind:'optional-jump',anchors:upper,requires:[],defaultJump:true},{id:'lower-service-route',kind:'optional-jump',anchors:lower,requires:[],defaultJump:true},{id:'service-middle-link',kind:'optional-jump',anchors:service,requires:[],defaultJump:true},{id:'east-upper-return',kind:'optional-jump',anchors:eastUpper,requires:[],defaultJump:true},{id:'service-tool-pocket',kind:'optional-jump',anchors:lowTool,requires:[],defaultJump:true},{id:'east-fire-pocket',kind:'optional-jump',anchors:fire,requires:[],defaultJump:true}];
 const nodes={'clear-works':at('ws-west-work-buttress',2440),brace:at('ws-west-work-buttress',3040),hoist:at('ws-east-hoist-buttress',6140),repair:at('ws-axle-footing',8660),'hold-hoist':at('ws-axle-footing',8530),'clear-lift':at('act2-floor',9930),notes:at('act2-floor',10220)};
 const space={version:1,geometryRevision:7,sharedSpaceId:null,topologyId:'vertical-hoist-shaft-with-switchback-and-gallery',rooms:zones.map(z=>({id:z.id,terrainIds:ts.filter(t=>t.id!=='cave-roof'&&t.points.some(p=>p.x>=z.box[0]&&p.x<=z.box[0]+z.box[2])).map(t=>t.id),ceilingIds:['cave-roof'],bounds:{x:z.box[0],y:z.box[1],w:z.box[2],h:z.box[3]},sky:'cave',landmarkIds:[]})),surfaces:ts.filter(t=>t.properties.honroWalkEdges.length).map(t=>({id:t.id,terrainId:t.id,role:t.properties.honroSurfaceRole,edgeIndices:clone(t.properties.honroWalkEdges),roomIds:[room(t.points[0].x,t.points[0].y)]})),routes,connections:routes.map(r=>({id:r.id,from:room(r.anchors[0].x,r.anchors[0].y),to:room(r.anchors.at(-1).x,r.anchors.at(-1).y),kind:r.id==='main'?'gated-walk':r.defaultJump?'optional-jump':'walk',routeId:r.id,entry:clone(r.anchors[0]),exit:clone(r.anchors.at(-1)),requires:clone(r.requires)})),sites:{},encounterSites:[],landmarks:[],scenery:[],lights:[],views:[]};
 for(const [id,p]of Object.entries(nodes))space.sites[id]={objectiveId:id,roomId:room(p.x,p.y),...p,standing:clone(p)};
 st.initialState.honroWorksiteDefenseEntries=[{side:'west',...at('ws-east-hoist-buttress',7270)},{side:'east',...at('act2-floor',9620)}];
 st.routes=main.map(({x,y})=>({x,y}));st.anchors={spawn:at('act2-floor',320),start:at('act2-floor',320),exit:clone(nodes.notes),brace:clone(nodes.brace),hoist:clone(nodes.hoist),repair:clone(nodes.repair)};
 st.markers=old.markers.map(m=>nodes[m.id]?{...m,x:nodes[m.id].x,y:nodes[m.id].y}:m.type==='act2-wave'?{...m,...at('act2-floor',8850)}:m);
 // Dense work crews occupy the machines and their firing shelves; the
 // switchback, central shaft ladders and repaired-door interaction stay open.
 const roster=[
  ['a2-enemy-0','picks','ws-west-work-buttress',1945,0,false,'west-point','west','melee-point'],
  ['a2-enemy-1','picks','ws-west-work-buttress',2025,0,false,'west-point','west','melee-screen'],
  ['ws-west-screen','picks','ws-west-work-buttress',2130,0,false,'west-point','west','melee-flank'],
  ['a2-enemy-2','picks','ws-west-work-buttress',2370,0,false,'brace-front','west','melee-point'],
  ['a2-enemy-3','picks','ws-west-work-buttress',2455,0,true,'brace-front','west','elite-melee'],
  ['ws-brace-cart','minecart','ws-west-work-buttress',2565,0,false,'brace-rear','west','lane-pressure'],
  ['ws-brace-captain','stoneLantern','ws-west-work-buttress',2680,0,true,'brace-rear','west','elite-rear-fire'],
  ['a2-enemy-4','picks','ws-west-lower-steps',2930,0,false,'brace-overwatch','west','upper-melee-screen'],
  ['ws-brace-bat','bat','ws-west-lower-steps',2845,-190,false,'brace-overwatch','west','air-flank'],
  ['a2-enemy-5','minecart','ws-west-work-buttress',3500,0,false,'west-cart-line','middle','lane-pressure'],
  ['a2-enemy-6','minecart','ws-west-work-buttress',3630,0,false,'west-cart-line','middle','lane-pressure'],
  ['ws-west-cart-screen','picks','ws-west-work-buttress',3390,0,false,'west-cart-line','middle','melee-screen'],
  ['ws-core-front','picks','ws-hoist-service-bridge',5810,0,false,'hoist-front','middle','melee-point'],
  ['ws-core-brace','picks','ws-east-hoist-buttress',5940,0,false,'hoist-front','middle','melee-screen'],
  ['ws-core-screen','picks','ws-east-hoist-buttress',6030,0,false,'hoist-front','middle','melee-flank'],
  ['act2-hoist','hoist','ws-east-hoist-buttress',6140,0,false,'hoist-core','middle','hoist-core'],
  ['ws-core-foreman','picks','ws-east-hoist-buttress',6280,0,true,'hoist-core','middle','elite-bodyguard'],
  ['a2-enemy-9','minecart','ws-east-hoist-buttress',6380,0,false,'hoist-rear','middle','lane-pressure'],
  ['ws-core-cart','minecart','ws-east-hoist-buttress',6500,0,true,'hoist-rear','middle','elite-lane-pressure'],
  ['ws-core-echo','monkVessel','ws-east-hoist-buttress',6480,-185,false,'hoist-air','middle','air-support'],
  ['ws-core-bat','bat','ws-east-hoist-buttress',6340,-285,false,'hoist-air','middle','air-flank'],
  ['ws-upper-toolguard','picks','ws-west-upper-rock',4370,0,false,'upper-west-guard','middle','melee-screen'],
  ['ws-upper-lantern','stoneLantern','ws-west-upper-rock',4460,0,true,'upper-west-guard','middle','elite-high-fire'],
  ['a2-enemy-10','bat','ws-west-upper-rock',4520,-210,false,'upper-west-air','middle','air-flank'],
  ['ws-upper-bat','bat','ws-west-upper-rock',4410,-310,false,'upper-west-air','middle','air-support'],
  ['ws-upper-echo','monkVessel','ws-west-hoist-deck',4870,-170,false,'upper-west-return','middle','screened-support'],
  ['a2-enemy-11','bat','ws-east-hoist-deck',6480,-190,true,'upper-east-entry','middle','elite-air-flank'],
  ['ws-east-high-lamp','stoneLantern','ws-east-upper-rock',7420,0,true,'upper-east-guard','east','elite-high-fire'],
  ['a2-enemy-12','bat','ws-east-upper-rock',7510,-195,false,'upper-east-guard','middle','air-flank'],
  ['a2-enemy-18','monkVessel','ws-east-upper-rock',7400,-270,false,'upper-east-guard','east','air-support'],
  ['a2-enemy-17','monkVessel','ws-east-hoist-buttress',6930,-160,false,'axle-guard','east','screened-support'],
  ['a2-enemy-15','monkVessel','ws-east-hoist-buttress',7030,-270,true,'axle-guard','east','elite-support'],
  ['a2-enemy-16','monkVessel','ws-east-hoist-buttress',7160,-150,false,'axle-guard','east','air-flank'],
  ['ws-axle-point','picks','ws-east-hoist-buttress',7090,0,false,'axle-guard','east','melee-screen'],
  ['ws-service-front','picks','act2-floor',4200,0,false,'service-front','middle','melee-point'],
  ['a2-enemy-7','minecart','act2-floor',4310,0,true,'service-front','middle','elite-lane-pressure'],
  ['a2-enemy-8','minecart','act2-floor',4420,0,false,'service-front','middle','lane-pressure'],
  ['ws-service-captain','stoneLantern','ws-service-tool-ledge',4590,0,true,'service-shelf','middle','elite-low-fire'],
  ['ws-service-rear','picks','ws-service-tool-ledge',4680,0,false,'service-shelf','middle','melee-screen'],
  ['a2-enemy-14','bat','act2-floor',6760,-225,false,'service-east-air','middle','air-flank'],
  ['a2-enemy-19','monkVessel','act2-floor',6980,-155,true,'service-east-air','east','elite-support'],
  ['ws-gallery-picks','picks','act2-floor',6870,0,false,'service-east-ground','east','melee-screen'],
  ['ws-gallery-cart','minecart','act2-floor',7080,0,false,'service-east-ground','east','lane-pressure'],
  ['ws-notes-front','picks','act2-floor',9825,0,false,'notes-front','east','melee-point'],
  ['ws-notes-cart','minecart','act2-floor',9940,0,false,'notes-front','east','lane-pressure'],
  ['a2-enemy-20','picks','act2-floor',10030,0,false,'notes-front','east','melee-screen'],
  ['a2-enemy-21','picks','ws-notes-work-deck',10115,0,false,'notes-overwatch','east','upper-melee-screen'],
  ['a2-enemy-22','picks','ws-notes-work-deck',10200,0,false,'notes-overwatch','east','upper-melee-flank'],
  ['a2-enemy-23','picks','act2-floor',10320,0,true,'notes-rear','east','elite-melee'],
  ['ws-notes-echo','monkVessel','act2-floor',10420,-200,true,'notes-rear','east','elite-support']
 ];
 st.units=old.units.filter(u=>u.team==='player').map(u=>({id:u.id,kind:u.kind,team:'player',...at('act2-floor',320+['archer','mage','knight','occultist'].indexOf(u.kind)*110),facing:1}));
 st.encounters=[];const cells=new Map();
 for(const [index,[id,kind,supportId,x,lift,elite,cell,cohort,role]]of roster.entries()){
  const support=at(supportId,x),site={...support,y:support.y+lift},roomId=room(site.x,site.y);
  if(!cells.has(cell))cells.set(cell,[]);cells.get(cell).push(id);
  space.encounterSites.push({id:'site-'+id,unitId:id,roomId,...site,standing:clone(support),group:cell,cohort});
  st.units.push({id,kind,team:'enemy',x:site.x,y:site.y,facing:-1,spawnIndex:index+Math.floor(index/10),behavior:'patrol',encounterGroup:cell,stageOverrides:{elite:kind==='hoist',armor:.04,honroCohort:cohort,honroAct2Elite:elite,honroAct2Revision:2,honroWorksiteRole:role,honroDensityCell:cell,honroEncounterRole:role,honroEncounterSupport:supportId}});
 }
 for(const [id,unitIds]of cells)st.encounters.push({id,key:id,behavior:'patrol',unitIds});

 st.design={...old.design,description:'암반 기단·인양 작업대·축 정비굴을 오가며 하나의 작업장을 장악한다.',space,worksite:{version:WORKSITE_VERSION,zones:clone(zones),routeIntent:{upper:'long crossed shots; interrupted by rock shoulders and airborne pressure',middle:'short elevation changes; melee access and grouped area attacks',lower:'low ceilings and screened support; reflection and side entry'},junctions:[{id:'west',x:2300,y:4397},{id:'middle',x:5500,y:4820},{id:'east',x:8550,y:4580}],activityBounds:[320,3100,10720,6210],encounters:{initial:50,elite:13,wave:10,responseCount:6,totalEnemyBudget:66,activeLimit:3,groups:zones.map(z=>({id:z.id,name:z.name,units:space.encounterSites.filter(e=>e.roomId===z.id).map(e=>e.unitId)}))}}};
 st.initialState.honroEncounterDensityRevision=1;
 st.initialState.honroEncounterDensityPopulationCap=66;
 st.initialState.honroEncounterDensityActivation=Object.fromEntries([...cells].map(([id,ids])=>[id,{radius:id.startsWith('hoist-')?800:700,maxHeight:650,supports:[...new Set(ids.map(key=>st.units.find(u=>u.id===key).stageOverrides.honroEncounterSupport))]}]));
 const responses=[
  {id:'worksite-brace-answer',objectiveDone:'brace',warning:'버팀목이 고정되자 위 작업대에서 공구와 날갯짓이 응답한다. 인양틀로 가는 측면에 경비 셋이 들어온다.',rows:[['picks','ws-west-machine-plinth',3990,false],['stoneLantern','ws-west-machine-plinth',4110,true],['bat','ws-west-machine-plinth',4030,false]],alternates:[['picks','ws-west-machine-plinth',4520,false],['stoneLantern','ws-west-machine-plinth',4640,true],['bat','ws-west-machine-plinth',4560,false]]},
  {id:'worksite-axle-answer',objectiveDone:'repair',warning:'인양축이 맞물리자 동쪽 기록방 궤도에서 수레와 공구가 움직인다. 복구문 너머의 유한 경비 셋이다.',rows:[['picks','act2-floor',9690,false],['minecart','act2-floor',9815,true],['monkVessel','act2-floor',9735,false]],alternates:[['picks','act2-floor',10480,false],['minecart','act2-floor',10610,true],['monkVessel','act2-floor',10530,false]]}
 ];
 st.events=(st.events||[]).filter(e=>!e.honroDensityResponse);
 for(const q of responses){const actions=rows=>rows.map(([kind,support,x,elite])=>{const p=at(support,x),air=['bat','monkVessel','bellCluster'].includes(kind);return{type:'spawn',kind,n:1,...p,y:p.y-(air?230:0),air,support,maxDistance:0,honroDensityRole:elite?'elite':kind==='picks'?'front':'support',honroDensityElite:elite,source:q.id};}),entry=at(q.rows[0][1],q.rows[0][2]);st.events.push({id:q.id,once:true,honroDensityResponse:1,honroDensityTrigger:{objectiveDone:q.objectiveDone},when:{after:'density-gate-'+q.id},warning:q.warning,entry,action:{type:'multi',honroDensityResponse:1,source:q.id,actions:actions(q.rows)},honroDensityAlternatives:[actions(q.alternates)]});}
 delete st.design.cavernTransitions;
 return project;
}
