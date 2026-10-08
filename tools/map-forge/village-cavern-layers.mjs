/** The middle hamlet keeps its original road and homes on an inhabited rock
 * shoulder. A short covered mineral passage runs underneath and returns east. */
const at=(ps,x)=>{for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return null;};
const original=[[2800,3080],[3300,3490],[3900,4100],[4450,4100],[5100,4530],[5850,5100]],base=[[3230,3432.6],[3700,4650],[4100,4770],[4550,4810],[4900,4630],[5250,4644]],crest=[[3230,3432.6],[3300,3490],[3610,3805.1666666666665],[3900,4100],[4450,4100],[4700,4265.384615384615]];
function make(id,ps,edges,wood=false){return{id,name:id,type:'solid',points:ps.map(([x,y])=>({x,y})),baseMaterial:wood?'wood':'rock',oneWay:wood,breakable:false,properties:{hp:99999,maxHp:99999,route:!wood,surfaceKind:wood?'wood':'cave',honroCave:!wood,honroSpaceSurfaceId:id,honroSurfaceRole:'shelf',honroWalkEdges:edges,optional:wood},layer:'terrain',detail:{spacing:18,roughness:0,seed:14,optimizeEpsilon:0}};}
export function applyVillageCavernLayers(project,{existingOnly=false}={}){for(const st of project.stages){if(st.metadata?.stageId!==14||existingOnly&&!st.design?.cavernLayers)continue;const s=st.design.space,prefix='fc14-';st.terrains=st.terrains.filter(t=>!t.id.startsWith(prefix));st.elements=st.elements.filter(t=>!t.id.startsWith(prefix));s.surfaces=s.surfaces.filter(t=>!t.id.startsWith(prefix));s.scenery=s.scenery.filter(t=>!t.id.startsWith(prefix));s.lights=s.lights.filter(t=>!t.id.startsWith(prefix));s.routes=s.routes.filter(t=>t.id!=='market-undercroft');s.terrainPlanes=(s.terrainPlanes||[]).filter(t=>!t.terrainId.startsWith(prefix));for(const r of s.rooms)r.terrainIds=r.terrainIds.filter(t=>!t.startsWith(prefix));
 const floor=st.terrains.find(t=>t.id==='act2-floor');for(const p of floor.points){const y=at(base,p.x);if(y!==null&&p.y<6200)p.y=y;}
 // Preserve the exact entry junction instead of interpolating across it
 // from an old distant floor sample (which can create a one-pixel lip).
 {const count=Math.max(...floor.properties.honroWalkEdges)+2,walk=floor.points.slice(0,count);if(!walk.some(p=>Math.abs(p.x-3230)<.001)){walk.push({x:3230,y:3432.6});walk.sort((a,b)=>a.x-b.x);floor.points=[...walk,...floor.points.slice(count)];}floor.properties.honroWalkEdges=Array.from({length:walk.length-1},(_,i)=>i);s.surfaces.find(v=>v.id==='floor-main').edgeIndices=[...floor.properties.honroWalkEdges];}
 const id='fc14-inhabited-shoulder',body=make(id,[...crest,[4700,4460],[4550,4440],[4210,4360],[3930,4400],[3740,4570],[3600,4820],[3280,4760],[3190,3980]],[0,1,2,3,4]);
 const upper=make('fc14-east-return-upper',[[4730,4380],[4910,4368],[4930,4402],[4750,4418]],[0],true),lower=make('fc14-east-return-lower',[[4920,4520],[5120,4507],[5140,4540],[4940,4558]],[0],true);st.terrains.push(body,upper,lower);
 for(const [t,room]of [[body,'middle-market'],[upper,'right-descent'],[lower,'right-descent']]){s.surfaces.push({id:t.id,terrainId:t.id,role:'shelf',edgeIndices:t.properties.honroWalkEdges,roomIds:[room]});s.rooms.find(r=>r.id===room).terrainIds.push(t.id);}
 // Rebind the existing front houses after the scenery generator's floor pass.
 // Neither the resident nor the original market/upper/lower mission sites move.
 for(const e of st.elements){const y=at(crest,e.x);if(y!==null&&e.id.startsWith('a2-'))e.y=y;}
 for(const p of s.scenery){const e=st.elements.find(e=>e.id===p.elementId);if(e&&at(crest,e.x)!==null)Object.assign(p,{x:e.x,y:e.y,surfaceId:id,footOffset:0});}
 for(const p of s.lights){const y=at(crest,p.x);if(y!==null&&!p.id.startsWith('a2-scene-'))p.y=y-50;}
 const rebind=p=>{const y=at(crest,p.x);if(y!==null&&Math.abs(p.y-y)<.1)p.surfaceId=id;};for(const q of Object.values(s.sites)){rebind(q);if(q.standing)rebind(q.standing);}
 for(const q of s.encounterSites){if(at(crest,q.x)!==null){q.surfaceId=id;q.supportY=at(crest,q.x);}else if(q.x>4700&&q.x<5250){q.supportY=at(base,q.x);q.y=q.supportY-(q.flying?160:0);const u=st.units.find(u=>u.id===q.unitId);if(u)u.y=q.y;}}
 const market=s.routes.find(r=>r.id==='market-perch');if(market){market.anchors[0].surfaceId=id;market.anchors[3]={x:4970,y:4516.75,surfaceId:lower.id};}
 const main=s.routes.find(r=>r.id==='main'),old=main.anchors;main.anchors=[];let added=false;for(const p of old){if(p.x>4700&&p.x<5250){if(!added){main.anchors.push({x:4800,y:4375.333333333333,surfaceId:upper.id},{x:5050,y:4511.55,surfaceId:lower.id});added=true;}continue;}const q={...p};rebind(q);main.anchors.push(q);}main.defaultJump=true;main.playerStepOff=true;st.routes=main.anchors.map(({x,y})=>({x,y}));
 for(const room of s.rooms){const ys=floor.points.filter(p=>p.x>=room.bounds.x&&p.x<=room.bounds.x+room.bounds.w&&p.y<6200).map(p=>p.y);if(ys.length)room.bounds.h=Math.max(room.bounds.h,Math.max(...ys)-room.bounds.y);}
 const under=[{x:5400,y:4758,surfaceId:'floor-main'},{x:5090,y:at(base,5090),surfaceId:'floor-main'},{x:4680,y:at(base,4680),surfaceId:'floor-main'},{x:4300,y:at(base,4300),surfaceId:'floor-main'},{x:4050,y:at(base,4050),surfaceId:'floor-main'}];s.routes.push({id:'market-undercroft',kind:'optional-jump',anchors:under,requires:[]});
 const plane=(fill,ps)=>s.terrainPlanes.push({terrainId:id,fill,points:ps});
 plane('#65767d',[[3190,3400],[3320,3460],[3660,3770],[3920,4080],[4150,4080],[4040,4250],[3790,4450],[3650,4770],[3290,4760],[3190,4120]]);
 plane('#354c58',[[3330,3640],[3500,3760],[3600,3980],[3500,4150],[3480,4440],[3360,4630],[3310,4350],[3370,4060]]);
 plane('#82908e',[[3420,3590],[3580,3760],[3700,3890],[3650,3940],[3520,3830],[3390,3700]]);
 plane('#2a4350',[[3610,4110],[3710,4210],[3650,4470],[3650,4710],[3560,4800],[3530,4490],[3590,4260]]);
 plane('#788b90',[[3770,3960],[3920,4100],[4050,4100],[4000,4200],[3850,4300],[3770,4420],[3730,4380],[3790,4180]]);
 plane('#526c79',[[4100,4090],[4310,4090],[4250,4270],[4350,4370],[4160,4430],[4030,4360]]);
 plane('#81918f',[[4300,4100],[4450,4100],[4510,4150],[4460,4230],[4340,4200]]);
 plane('#2f4958',[[4510,4150],[4600,4200],[4620,4320],[4700,4370],[4700,4500],[4540,4440],[4490,4290]]);
 plane('#6f838c',[[4600,4230],[4690,4260],[4700,4370],[4640,4350],[4600,4300]]);
 plane('#193541',[[3690,4570],[3900,4340],[4200,4300],[4550,4375],[4730,4410],[4730,4510],[4550,4500],[4210,4420],[3950,4460],[3810,4600],[3700,4800],[3620,4800]]);
 const lamp={id:'fc14-mineral-passage-lamp',assetId:'act2:lamp',x:4380,y:at(base,4380),scale:.75,rotation:0,snap:false,layer:'back',depthLayer:'L1'};st.elements.push(lamp);s.scenery.push({id:lamp.id,elementId:lamp.id,assetId:lamp.assetId,roomId:'middle-market',surfaceId:'floor-main',x:lamp.x,y:lamp.y,scale:.75,footOffset:0,visualOnly:true});s.lights.push({id:lamp.id,x:lamp.x,y:lamp.y-45,roomId:'middle-market',kind:'oil',radius:260,color:'#aa8f68'});
 st.design.cavernLayers={version:1,kind:'inhabited-shoulder-over-mineral-passage',requiredMain:main.anchors,optional:under,return:[{x:5090,y:at(base,5090)},{x:4970,y:4516.75,jumpTo:{x:4850,support:upper.id}},{x:4780,y:4376.666666666667,jumpTo:{x:4660,support:id}},{x:4350,y:4100}],views:[{name:'layers-default',x:4130,y:4210,scale:.46,width:1440,height:960},{name:'layers-portrait',x:4130,y:4250,scale:.46,width:720,height:1080}]};
 }return project;}
