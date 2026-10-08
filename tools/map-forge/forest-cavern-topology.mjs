/** New-entry topology authoring. Never runs against live battle saves.
 * Stage-specific IDs avoid collisions with Act 3's independent map authoring.
 * The representative pass keeps all objectives, NPCs, counts and vital paths.
 */
const pt=rows=>rows.map(([x,y])=>({x,y}));
const clone=x=>JSON.parse(JSON.stringify(x));
function ground(st,x){const t=st.terrains.find(t=>t.id==='act2-floor');for(const i of t.properties.honroWalkEdges){const a=t.points[i],b=t.points[i+1];if(x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}throw Error('No floor '+x);}
function terrain(id,points,{wood=false,oneWay=false,edges=[0],role='shelf'}={}){return {id,name:id,type:'solid',points:pt(points),baseMaterial:wood?'wood':'rock',oneWay,breakable:false,properties:{hp:99999,maxHp:99999,route:false,surfaceKind:wood?'wood':'cave',honroCave:!wood,honroSpaceSurfaceId:id,honroSurfaceRole:role,honroWalkEdges:edges,optional:true},layer:'terrain',detail:{spacing:18,roughness:0,seed:1,optimizeEpsilon:0}};}
function softenCrown(t,count,radius=28){
 const old=t.points,top=old.slice(0,count),out=[top[0]];
 for(let i=1;i<top.length-1;i++){const a=top[i-1],v=top[i],b=top[i+1],la=Math.hypot(v.x-a.x,v.y-a.y),lb=Math.hypot(b.x-v.x,b.y-v.y),r=Math.min(radius,la*.16,lb*.16),p={x:v.x+(a.x-v.x)*r/la,y:v.y+(a.y-v.y)*r/la},q={x:v.x+(b.x-v.x)*r/lb,y:v.y+(b.y-v.y)*r/lb};out.push(p);for(const f of [.25,.5,.75])out.push({x:(1-f)**2*p.x+2*(1-f)*f*v.x+f*f*q.x,y:(1-f)**2*p.y+2*(1-f)*f*v.y+f*f*q.y});out.push(q);}
 out.push(top.at(-1));t.points=[...out,...old.slice(count)];t.properties.honroWalkEdges=out.slice(1).map((_,i)=>i);
}
function add(st,t,roomId){st.terrains.push(t);if(st.design.space){const space=st.design.space;space.surfaces.push({id:t.id,terrainId:t.id,role:t.properties.honroSurfaceRole,edgeIndices:t.properties.honroWalkEdges,roomIds:[roomId]});const room=space.rooms.find(r=>r.id===roomId);if(room&&!room.terrainIds.includes(t.id))room.terrainIds.push(t.id);}}
function branch(st,id,top,bottom){add(st,terrain(id,[...top,...bottom],{wood:true,oneWay:true,edges:top.slice(1).map((_,i)=>i)}));}
function moveUnit(st,id,x,y,support,role){const u=st.units.find(u=>u.id===id);if(!u)throw Error('Missing unit '+id);Object.assign(u,{x,y,spawnX:x,spawnY:y});const r=st.design.space?.encounterSites.find(r=>r.unitId===id);if(r)Object.assign(r,{x,y,supportY:y,surfaceId:support});st.design.topology.encounters.push({unitId:id,supportId:support,role,x,y});}
function stage7(st){
 st.design.topology={version:1,kind:'inhabited-living-boughs',encounters:[],firingSites:[],ordinaryRoutes:[],preserved:'Three civilian homes and the complete original main climb; no movement skills required.'};
 // Keep every main upper contact and the re-entry root. The lower contour
 // tapers into knuckles instead of presenting identical rectangular roads.
 const undersides={
  'tier-low':[[1855,3555],[1600,3698],[1330,3830],[1110,3956],[820,4070],[475,4180],[180,4264]],
  'tier-mid':[[3290,3032],[3070,3098],[2880,3057],[2710,3112],[2470,3060]],
  'tier-upper':[[1880,2234],[1620,2271],[1330,2340],[1050,2270],[830,2310],[650,2238]],
  'tier-crown':[[2960,1140],[2660,1230],[2390,1340],[2120,1370],[1790,1530],[1500,1500]]
 };
 for(const [id,under]of Object.entries(undersides)){const t=st.terrains.find(t=>t.id===id),count=id==='tier-low'?3:2;t.points=[...t.points.slice(0,count),...pt(under)];}
 branch(st,'fc7-west-watch',[[480,3985],[650,3960],[860,3928]],[[850,3950],[680,4000],[520,4025],[480,4015]]);
 branch(st,'fc7-middle-fork',[[2250,2835],[2410,2807],[2570,2825]],[[2550,2850],[2440,2855],[2320,2890],[2250,2870]]);
 branch(st,'fc7-hollow-lookout',[[1230,2055],[1440,2018],[1600,2030]],[[1580,2055],[1450,2050],[1330,2100],[1230,2090]]);
 // A near-side bow perch faces the lower approach; bats stay in their
 // airborne cohorts and civilian circles are never used for enemy spawns.
 moveUnit(st,'foe-0',725,3948.21,'fc7-west-watch','low branch crossfire');
 moveUnit(st,'foe-10',2420,2808.125,'fc7-middle-fork','middle fork intercept');
 moveUnit(st,'foe-8',1480,2021,'fc7-hollow-lookout','hollow flank overwatch');
 st.design.topology.firingSites=[{id:'lower-watch',x:725,y:3948.214285714286,supportId:'fc7-west-watch'},{id:'middle-fork',x:2420,y:2808.125,supportId:'fc7-middle-fork'},{id:'hollow-lookout',x:1480,y:2021,supportId:'fc7-hollow-lookout'}];
 st.design.topology.ordinaryRoutes=[{id:'lower-watch',from:{x:790,y:3979.896907216495},to:{x:725,y:3948.214285714286}},{id:'middle-fork',from:{x:2585,y:3000},to:{x:2470,y:2813.75}},{id:'hollow-lookout',from:{x:1510,y:2200},to:{x:1480,y:2021}}];
}
function stage15(st){
 st.design.topology={version:1,kind:'unequal-granite-arches-and-water-cleft',encounters:[],firingSites:[],ordinaryRoutes:[],preserved:'Original lower walk, sluice, objective identities, water basin and solid cave roof. New crowns are solid rock with an open lower passage.'};
 const west=terrain('fc15-west-arch',[[3000,3780],[3300,3500],[3540,3460],[3660,3300],[3720,3190],[3870,3190],[4010,3010],[4200,2990],[4320,3020],[4360,3480],[4540,3500],[4590,3650],[4800,3620],[4910,3740],[5110,3990],[5330,4270],[5330,4380],[5150,4320],[4910,4160],[4780,4110],[4600,4200],[4470,4160],[4400,4070],[4140,4020],[3960,4070],[3820,3980],[3740,4120],[3680,4350],[3420,4310],[3330,4080],[3340,3890],[3180,3860],[3000,3840]],{edges:[0,1,2,3,4,5,6,7,9,11,12,13,14]});
 const east=terrain('fc15-east-arch',[[6310,4260],[6500,4070],[6690,4050],[6830,3860],[6950,3710],[7110,3660],[7210,3510],[7400,3500],[7440,3590],[7560,3740],[7560,3840],[7500,3850],[7450,4300],[7190,4400],[7060,4130],[6910,4120],[6610,4270],[6430,4360],[6310,4390]],{edges:[0,1,2,3,4,5,6,7,8]});
 softenCrown(west,16);softenCrown(east,10,24);
 add(st,west,'open-shaft');add(st,east,'temple-stair');
 st.design.space.terrainPlanes=[];
 const plane=(terrainId,fill,points)=>st.design.space.terrainPlanes.push({terrainId,fill,points});
 // Broad stone strata in the actual cave roof, never an independent backdrop.
 plane('cave-roof','#263744',[[-7000,-25000],[15000,-25000],[15000,6000],[-7000,6000]]);
 plane('cave-roof','#344654',[[-6000,300],[1600,880],[3290,1680],[4030,1520],[5110,1340],[6040,1740],[8100,2200],[14000,2080],[14000,3100],[7390,2810],[6280,2480],[5220,1890],[4030,1940],[2850,2850],[700,2910],[-6000,2800]]);
 plane('cave-roof','#40515d',[[-6000,1870],[720,2100],[1990,2380],[2820,2270],[3330,1880],[3850,1550],[3150,2640],[2380,3240],[390,3060],[-6000,2900]]);
 plane('cave-roof','#192b38',[[3470,-2000],[4000,1170],[5100,890],[6150,1290],[7090,2320],[8480,2330],[10200,1750],[15000,0],[15000,-3000]]);
 plane('cave-roof','#52606a',[[6060,1900],[6630,2050],[7280,2220],[7890,2590],[8200,2930],[7280,2780],[6650,2550]]);
 plane(west.id,'#64717c',[[2950,3730],[3360,3460],[3540,3410],[3810,3060],[4080,2960],[3980,3260],[3860,3570],[3750,3870],[3580,4160],[3360,4040],[3310,3790]]);
 plane(west.id,'#394e5b',[[4010,2930],[4210,2950],[4310,3020],[4280,3510],[4130,3750],[4010,4030],[3890,4020],[3860,3670],[3980,3320]]);
 plane(west.id,'#203745',[[4300,2990],[4380,3240],[4440,3540],[4540,3690],[4580,4150],[4350,4230],[4130,4090],[4250,3750]]);
 plane(west.id,'#52626e',[[4390,3450],[4630,3430],[4800,3570],[4920,3750],[4880,4080],[4700,3960],[4590,3730]]);
 plane(west.id,'#52626e',[[4860,3660],[5120,3950],[5360,4260],[5360,4410],[5140,4340],[5050,4100]]);
 plane(west.id,'#2d4350',[[3360,3860],[3600,3920],[3750,3790],[3750,4400],[3340,4400]]);
 plane(west.id,'#849086',[[3310,3490],[3530,3444],[3555,3468],[3335,3510]]);
 plane(west.id,'#75877e',[[3730,3186],[3860,3183],[3840,3208],[3740,3213]]);
 plane(east.id,'#5d707a',[[6290,4240],[6510,4030],[6680,4020],[6960,3680],[7210,3470],[7420,3480],[7290,3730],[7080,3860],[6920,4100],[6630,4310],[6320,4400]]);
 plane(east.id,'#294552',[[7280,3450],[7430,3510],[7490,3730],[7490,4220],[7370,4460],[7180,4470],[7090,4160],[7150,3830]]);
 plane(east.id,'#455d69',[[7440,3580],[7590,3750],[7570,3890],[7460,4230],[7350,4300],[7410,3850]]);
 plane(east.id,'#3b535d',[[6480,4040],[6720,4020],[6970,3720],[6930,4010],[6720,4200],[6480,4340]]);
 plane(east.id,'#798b80',[[6510,4067],[6670,4045],[6670,4063],[6515,4088]]);
 // Authored meso-scale joints follow the three geological blocks. Each
 // split has a lit shoulder, an offset slab and a narrow shadow cleft.
 plane(west.id,'#78858b',[[3040,3770],[3210,3590],[3370,3500],[3440,3520],[3310,3630],[3180,3800]]);
 plane(west.id,'#4a606b',[[3180,3800],[3310,3630],[3440,3520],[3460,3655],[3390,3810],[3330,3925]]);
 plane(west.id,'#91a098',[[3370,3500],[3520,3470],[3630,3340],[3675,3330],[3560,3510],[3440,3540]]);
 plane(west.id,'#364e5a',[[3520,3580],[3590,3490],[3650,3495],[3620,3710],[3505,3830],[3480,4000],[3430,3950],[3460,3750]]);
 plane(west.id,'#7c8a8c',[[3650,3280],[3730,3178],[3840,3180],[3815,3295],[3785,3420],[3690,3480]]);
 plane(west.id,'#304854',[[3755,3455],[3790,3280],[3835,3240],[3805,3460],[3730,3610],[3710,3820],[3660,3840],[3680,3590]]);
 plane(west.id,'#70828b',[[4015,3015],[4110,3000],[4065,3195],[4085,3370],[4035,3525],[4000,3510],[4025,3320],[3985,3170]]);
 plane(west.id,'#536d79',[[4110,3000],[4200,2998],[4180,3195],[4210,3410],[4150,3590],[4110,3810],[4035,3920],[4090,3630],[4130,3410],[4100,3190]]);
 plane(west.id,'#182f3c',[[4202,3050],[4225,3060],[4208,3320],[4230,3480],[4182,3680],[4190,3910],[4165,3980],[4140,3740],[4190,3460],[4185,3290]]);
 plane(west.id,'#839397',[[4040,3520],[4110,3500],[4150,3590],[4110,3650],[4050,3655],[3970,3790],[3920,3780]]);
 plane(west.id,'#667d85',[[4310,3330],[4340,3465],[4450,3500],[4490,3640],[4440,3760],[4400,3680],[4370,3560],[4320,3530]]);
 plane(west.id,'#152e3b',[[4380,3730],[4440,3830],[4460,4000],[4540,4140],[4510,4190],[4410,4050],[4400,3890],[4330,3800]]);
 plane(west.id,'#7b8a8f',[[4600,3655],[4770,3640],[4820,3700],[4710,3740],[4670,3890],[4610,3830]]);
 plane(west.id,'#344e5c',[[4820,3700],[4900,3760],[4960,3950],[5050,4080],[5020,4230],[4940,4090],[4900,3920],[4790,3820]]);
 plane(west.id,'#73888f',[[4930,3900],[5020,3940],[5120,4050],[5165,4190],[5220,4310],[5160,4300],[5060,4130],[4980,4050]]);
 // Cave-mouth contact shadow follows the real underside and support foot.
 plane(west.id,'#132d3b',[[3740,4035],[3830,3930],[3960,4010],[4140,3960],[4400,4020],[4470,4100],[4610,4140],[4780,4055],[4930,4110],[5140,4260],[5330,4310],[5370,4440],[5140,4380],[4910,4220],[4780,4160],[4600,4260],[4430,4210],[4320,4120],[4140,4080],[3960,4140],[3820,4050],[3780,4180],[3720,4340],[3670,4330]]);
 plane(east.id,'#84979a',[[6380,4180],[6500,4070],[6680,4050],[6750,3960],[6790,3970],[6700,4120],[6540,4130],[6460,4250]]);
 plane(east.id,'#34535f',[[6630,4120],[6720,4070],[6820,3940],[6870,3940],[6820,4100],[6700,4220],[6640,4340],[6580,4330]]);
 plane(east.id,'#78919a',[[6960,3705],[7100,3665],[7215,3505],[7270,3502],[7240,3670],[7150,3760],[7080,3890],[7010,3860]]);
 plane(east.id,'#192f3d',[[7310,3520],[7330,3550],[7295,3750],[7330,3980],[7280,4190],[7300,4380],[7250,4400],[7240,4150],[7280,3970],[7250,3780]]);
 plane(east.id,'#698590',[[7380,3610],[7430,3660],[7405,3830],[7420,3960],[7350,4180],[7310,4185],[7360,3940],[7330,3810]]);
 plane(east.id,'#142f3b',[[6310,4320],[6410,4300],[6610,4210],[6900,4060],[7070,4070],[7140,4260],[7200,4340],[7220,4480],[7100,4410],[7000,4190],[6860,4190],[6620,4340],[6430,4420],[6280,4440]]);
 // Broad wet staining and angular fallen slabs in the existing water cleft.
 plane('act2-floor','#304849',[[5170,4490],[5360,4550],[5600,4770],[5840,4810],[6190,4570],[6360,4470],[6360,4580],[6170,4670],[5840,4905],[5600,4870],[5310,4680],[5150,4580]]);
 plane('act2-floor','#506766',[[5280,4590],[5410,4660],[5530,4770],[5500,4810],[5370,4750],[5280,4650]]);
 plane('act2-floor','#536d73',[[5900,4790],[6020,4660],[6140,4610],[6200,4640],[6090,4720],[6000,4840]]);
 plane('act2-floor','#1d363f',[[6030,4690],[6100,4660],[6130,4700],[6040,4800],[6000,4775]]);
 const lampX=4260,lampY=ground(st,lampX),lampId='fc15-under-arch-lamp';
 st.elements.push({id:lampId,assetId:'act2:lamp',x:lampX,y:lampY,scale:.8,rotation:0,snap:false,layer:'back',depthLayer:'L1'});
 st.design.space.scenery.push({id:lampId,elementId:lampId,assetId:'act2:lamp',roomId:'open-shaft',surfaceId:'floor-main',x:lampX,y:lampY,scale:.8,footOffset:0,visualOnly:true});
 st.design.space.lights.push({id:lampId,x:lampX,y:lampY-50,roomId:'open-shaft',kind:'oil',radius:260,color:'#a78b61'});
 st.design.topology.views=[{name:'topology-default',x:4090,y:3810,scale:.46,width:1440,height:960},{name:'topology-portrait-west',x:3980,y:3770,scale:.46,width:720,height:1080},{name:'topology-portrait-water',x:5720,y:4250,scale:.46,width:720,height:1080},{name:'topology-portrait-east',x:7130,y:4050,scale:.46,width:720,height:1080}];
 // These broad supports stand in the rear wall. The low road passes in
 // front of their feet while the arch body remains a real solid obstacle.
 st.design.space.rockCompositions=[['wet-approach','shoulder',.23,1400,650,-1],['sluice-neck','quarry',.28,1200,700,-1],['open-shaft','buttress',.37,1530,1290,1],['temple-stair','shoulder',.40,1350,850,1]];
 add(st,terrain('fc15-west-shoulder',[[4390,3320],[4540,3295],[4660,3325],[4600,3388],[4450,3370]],{wood:true,oneWay:true,edges:[0,1]}),'open-shaft');
 add(st,terrain('fc15-crown-return',[[4350,3150],[4490,3130],[4510,3160],[4370,3185]],{wood:true,oneWay:true,edges:[0]}),'open-shaft');
 add(st,terrain('fc15-water-toe',[[6090,4410],[6240,4395],[6300,4435],[6230,4470],[6110,4450]],{wood:true,oneWay:true,edges:[0,1]}),'carved-groove');
 add(st,terrain('fc15-east-access',[[7580,3885],[7760,3860],[7790,3880],[7630,3920]],{wood:true,oneWay:true,edges:[0]}),'temple-stair');
 add(st,terrain('fc15-west-descent',[[5350,4440],[5520,4420],[5540,4455],[5370,4475]],{wood:true,oneWay:true,edges:[0]}),'open-shaft');
 st.design.topology.firingSites=[{id:'west-crown',x:4140,y:2996.315789473684,supportId:west.id},{id:'west-shoulder',x:4540,y:3295,supportId:'fc15-west-shoulder'},{id:'under-arch',x:4210,y:ground(st,4210),supportId:'act2-floor'},{id:'water-cleft',x:5620,y:ground(st,5620),supportId:'act2-floor'},{id:'east-crown',x:7310,y:3504.7368421052633,supportId:east.id}];
 st.design.topology.ordinaryRoutes=[{id:'western-arch',points:[{x:2630,y:ground(st,2630)},{x:2820,y:3748.3333333333335},{x:3050,y:3733.3333333333335},{x:3300,y:3500},{x:3540,y:3460},{x:3660,y:3300},{x:3750,y:3190},{x:3890,y:3164.285714285714},{x:4140,y:2996.315789473684}]},{id:'eastern-arch',points:[{x:7800,y:ground(st,7800)},{x:7650,y:3875.277777777778},{x:7510,y:3689.1666666666665},{x:7390,y:3500.5263157894738},{x:7310,y:3504.7368421052633}]}];
 const main=st.design.space.routes.find(r=>r.id==='main');
 const at=x=>({x,y:ground(st,x),surfaceId:'floor-main'});
 main.kind='required';main.defaultJump=true;
 main.anchors=[at(320),at(1630),at(2350),at(2490),at(2630),{x:2820,y:3748.3333333333335,surfaceId:'dry-shoulder'},...st.design.topology.ordinaryRoutes[0].points.slice(2),{x:4250,y:3002.5},{x:4540,y:3295},{x:4710,y:3632.8571428571427},{x:4810,y:3630.909090909091},{x:4870,y:3696.3636363636365},{x:5050,y:3915},{x:5230,y:4142.727272727273},{x:5310,y:4244.545454545455},{x:5450,y:4428.235294117647},at(5590),at(5700),at(6210),{x:6240,y:4395,jumpTo:{x:6350,support:'fc15-east-arch'}},{x:6350,y:4220},{x:6500,y:4070},{x:6680,y:4051.0526315789475},{x:6830,y:3860},{x:6980,y:3700.625},{x:7180,y:3555},{x:7310,y:3504.7368421052633},{x:7440,y:3590},{x:7540,y:3715},{x:7650,y:3875.277777777778},at(7800),at(7530)];
 for(const p of main.anchors){if(p.surfaceId)continue;const hits=[];for(const t of st.terrains){for(const i of t.properties?.honroWalkEdges||[]){const a=t.points[i],b=t.points[i+1];if(b&&b.x>a.x&&p.x>=a.x&&p.x<=b.x)hits.push({id:t.properties.honroSpaceSurfaceId,y:a.y+(b.y-a.y)*(p.x-a.x)/(b.x-a.x),dy:Math.abs(p.y-a.y-(b.y-a.y)*(p.x-a.x)/(b.x-a.x))});}}hits.sort((a,b)=>a.dy-b.dy);p.surfaceId=hits[0]?.id||'floor-main';if(hits[0])p.y=hits[0].y;}
 st.routes=main.anchors.map(({x,y})=>({x,y}));
 moveUnit(st,'a2-enemy-7',3745,3190,west.id,'western crown guard');
 moveUnit(st,'a2-enemy-8',2622,ground(st,2622),'floor-main','sluice approach guard');
 moveUnit(st,'a2-enemy-14',4540,3295,'fc15-west-shoulder','middle shoulder crossfire');
 moveUnit(st,'a2-enemy-16',7310,3504.7368421052633,east.id,'eastern crown guard');
 moveUnit(st,'a2-enemy-17',5890,ground(st,5890),'floor-main','water-cleft ambush');
 for(const [id,x,y]of [['a2-enemy-9',4060,2700],['a2-enemy-10',4540,4290],['a2-enemy-11',5030,4140],['a2-enemy-12',4710,3020],['a2-enemy-13',5480,3690],['a2-enemy-19',7750,3700],['a2-enemy-20',6680,4340],['a2-enemy-21',6950,4260]]){moveUnit(st,id,x,y,'floor-main','airborne diagonal patrol');const r=st.design.space.encounterSites.find(r=>r.unitId===id);r.supportY=ground(st,x);}
}
export function applyForestCavernTopology(project,{stages=[7,15]}={}){for(const st of project.stages){const id=st.metadata?.stageId;if(!stages.includes(id))continue;const prefix=`fc${id}-`;st.terrains=st.terrains.filter(t=>!t.id.startsWith(prefix));st.elements=st.elements.filter(e=>!e.id.startsWith(prefix));if(st.design?.space){st.design.space.scenery=st.design.space.scenery.filter(s=>!s.id.startsWith(prefix));st.design.space.lights=st.design.space.lights.filter(s=>!s.id.startsWith(prefix));st.design.space.surfaces=st.design.space.surfaces.filter(s=>!s.id.startsWith(prefix));for(const r of st.design.space.rooms)r.terrainIds=r.terrainIds.filter(id=>!id.startsWith(prefix));}if(id===7)stage7(st);if(id===15)stage15(st);}return project;}
