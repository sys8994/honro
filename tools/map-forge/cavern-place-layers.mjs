import {refreshAct2RearTerraceContacts} from '../environment/act2-scene-composition.mjs';
import {applyVillageCavernLayers} from './village-cavern-layers.mjs';
/** Place-specific ACT2 layers. The temple is carried by one rooted rock mass,
 * with its original court above and a returnable undercroft below. */
const points=ps=>ps.map(([x,y])=>({x,y})),at=(ps,x)=>{for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return null;};
const rock=(id,ps,edges,wood=false)=>({id,name:id,type:'solid',points:points(ps),baseMaterial:wood?'wood':'rock',oneWay:wood,breakable:false,properties:{hp:99999,maxHp:99999,route:!wood,surfaceKind:wood?'wood':'cave',honroCave:!wood,honroSpaceSurfaceId:id,honroSurfaceRole:'shelf',honroWalkEdges:edges,optional:true},layer:'terrain',detail:{spacing:18,roughness:0,seed:16,optimizeEpsilon:0}});
function temple(st){const floor=st.terrains.find(t=>t.id==='act2-floor'),space=st.design.space;
 // Entry/court/family/story contacts outside this footprint are untouched.
 const base=[[3300,4605.714285714286],[3800,5050],[4400,5120],[5000,5140],[5480,5030],[5700,4950]];
 for(const p of floor.points){const y=at(base,p.x);if(y!==null&&p.y<5500)p.y=y;}
 for(const room of space.rooms){const ys=floor.points.filter(p=>p.x>=room.bounds.x&&p.x<=room.bounds.x+room.bounds.w&&p.y<5500).map(p=>p.y);if(ys.length)room.bounds.h=Math.max(room.bounds.h,Math.max(...ys)-room.bounds.y);}
 {const count=Math.max(...floor.properties.honroWalkEdges)+2,walk=floor.points.slice(0,count);if(!walk.some(p=>Math.abs(p.x-3300)<.001)){walk.push({x:3300,y:4605.714285714286});walk.sort((a,b)=>a.x-b.x);floor.points=[...walk,...floor.points.slice(count)];}floor.properties.honroWalkEdges=Array.from({length:walk.length-1},(_,i)=>i);space.surfaces.find(v=>v.id==='floor-main').edgeIndices=[...floor.properties.honroWalkEdges];}
 const id='fc16-temple-buttress',body=rock(id,[[3300,4605.714285714286],[3600,4490],[3900,4320],[5140,4320],[5360,4567.5],[5480,4702.5],[5480,4860],[5270,4840],[5030,4730],[4800,4690],[4310,4650],[4030,4695],[3890,4790],[3730,5010],[3580,5320],[3310,5220],[3240,4880]], [0,1,2,3,4]);
 const toe=rock('fc16-record-return-step',[[5500,4865],[5700,4845],[5710,4878],[5520,4902]],[0],true);st.terrains.push(body,toe);
 space.surfaces.push({id,terrainId:id,role:'shelf',edgeIndices:[0,1,2,3,4],roomIds:['hall-terrace']},{id:toe.id,terrainId:toe.id,role:'shelf',edgeIndices:[0],roomIds:['record-gallery']});
 space.rooms.find(r=>r.id==='hall-terrace').terrainIds.push(id);space.rooms.find(r=>r.id==='record-gallery').terrainIds.push(toe.id);
 const hall=st.elements.find(e=>e.assetId==='act2:temple');if(hall){hall.y=4320;const record=space.scenery.find(e=>e.elementId===hall.id);if(record)Object.assign(record,{y:4320,surfaceId:id,footOffset:0});}
 const upperY=x=>at([[3300,4605.714285714286],[3600,4490],[3900,4320],[5140,4320],[5480,4702.5]],x);
 const rebind=p=>{const y=upperY(p.x);if(y!==null&&Math.abs(p.y-y)<3)p.surfaceId=id;else if(p.x>5480&&p.x<5700&&p.surfaceId==='floor-main'){p.y=at(base,p.x);}};
 for(const q of Object.values(space.sites)){rebind(q);if(q.standing)rebind(q.standing);}
 for(const q of space.scenery)rebind(q);
 for(const q of space.encounterSites){const before=q.supportY;rebind(q);if(q.surfaceId===id)q.supportY=upperY(q.x);else if(q.x>5480&&q.x<5700){q.supportY=at(base,q.x);q.y=q.supportY-(q.flying?160:0);const u=st.units.find(u=>u.id===q.unitId);if(u)u.y=q.y;}}
 const main=space.routes.find(r=>r.id==='main'),old=main.anchors;main.anchors=[];let toeAdded=false;
 for(const p of old){if(p.x>5480&&p.x<5700){if(!toeAdded){main.anchors.push({x:5570,y:4858,surfaceId:toe.id});toeAdded=true;}continue;}const q={...p};if(q.x>3270&&q.x<3300){q.x=3250;q.y=4625;q.surfaceId='floor-main';}if(q.x===5700){q.x=5740;q.y=4950;}rebind(q);main.anchors.push(q);}
 main.defaultJump=true;st.routes=main.anchors.map(({x,y})=>({x,y}));
 const move=(unitId,x,y,surfaceId)=>{const u=st.units.find(u=>u.id===unitId),q=space.encounterSites.find(q=>q.unitId===unitId);if(u){u.x=x;u.y=y;}if(q){q.x=x;q.y=y;q.surfaceId=surfaceId;q.supportY=surfaceId===id?upperY(x):at(base,x)??q.supportY;}};
 move('a2-enemy-10',3680,upperY(3680),id);move('a2-enemy-11',5350,upperY(5350),id);move('a2-enemy-13',4790,4320,id);move('a2-enemy-14',4540,4320,id);move('a2-enemy-16',4790,at(base,4790)-120,'floor-main');
 const under=[{x:5740,y:4950,surfaceId:'floor-main'},{x:5500,y:at(base,5500),surfaceId:'floor-main'},{x:4700,y:at(base,4700),surfaceId:'floor-main'},{x:3950,y:at(base,3950),surfaceId:'floor-main'}];
 space.routes.push({id:'temple-undercroft',kind:'optional-jump',anchors:under,requires:[]});
 // Large horizontal bedding supports the hall; vertical clefts belong to
 // the root at the west and the broken overhang beside the record gallery.
 space.terrainPlanes??=[];const plane=(fill,ps)=>space.terrainPlanes.push({terrainId:id,fill,points:ps});
 plane('#5d6e76',[[3250,4550],[3900,4280],[4610,4290],[4460,4470],[4120,4510],[3830,4680],[3670,4930],[3500,5310],[3250,5250]]);
 plane('#354d59',[[3850,4460],[4060,4340],[4210,4340],[4120,4530],[3930,4710],[3810,5000],[3610,5310],[3700,4930]]);
 plane('#75858a',[[3940,4320],[4500,4320],[4460,4400],[4120,4430],[3880,4540]]);
 plane('#78898b',[[3330,4600],[3570,4500],[3670,4510],[3510,4670],[3400,4840],[3330,4820]]);
 plane('#203947',[[3590,4680],[3660,4620],[3620,4850],[3550,5030],[3550,5320],[3460,5270],[3500,4950]]);
 plane('#7e8c8b',[[3760,4750],[3840,4660],[3950,4620],[3900,4710],[3830,4820],[3770,4930],[3730,4900]]);
 plane('#657a83',[[4550,4320],[4870,4320],[4810,4470],[4580,4560],[4450,4540],[4520,4430]]);
 plane('#243e4b',[[4880,4310],[5060,4310],[4980,4540],[5050,4720],[4880,4780],[4800,4550]]);
 plane('#74868d',[[5060,4320],[5180,4360],[5260,4500],[5220,4610],[5140,4590],[5100,4460],[5010,4420]]);
 plane('#435f6b',[[5260,4500],[5400,4610],[5510,4700],[5510,4890],[5350,4840],[5220,4660]]);
 plane('#16323f',[[3800,4880],[3990,4640],[4310,4590],[4800,4630],[5030,4670],[5270,4780],[5510,4800],[5510,4900],[5270,4900],[5030,4800],[4800,4750],[4320,4710],[4060,4760],[3900,4880],[3790,5070],[3730,5100]]);
 const lamp={id:'fc16-undercroft-lamp',assetId:'act2:lamp',x:4690,y:at(base,4690),scale:.8,rotation:0,snap:false,layer:'back',depthLayer:'L1'};st.elements.push(lamp);space.scenery.push({id:lamp.id,elementId:lamp.id,assetId:lamp.assetId,roomId:'hall-terrace',surfaceId:'floor-main',x:lamp.x,y:lamp.y,scale:.8,footOffset:0,visualOnly:true});space.lights.push({id:lamp.id,x:lamp.x,y:lamp.y-50,roomId:'hall-terrace',kind:'oil',radius:300,color:'#b49766'});
 st.design.cavernLayers={version:1,kind:'temple-over-undercroft',requiredMain:main.anchors,optional:under,return:[{x:5510,y:at(base,5510)},{x:5530,y:4862,jumpTo:{x:5460,support:id}},{x:5300,y:4500},{x:5080,y:4320}],views:[{name:'layers-default',x:4500,y:4600,scale:.46,width:1440,height:960},{name:'layers-portrait',x:4500,y:4600,scale:.46,width:720,height:1080}]};
}
export function applyCavernPlaceLayers(project,{existingOnly=false}={}){applyVillageCavernLayers(project,{existingOnly});for(const st of project.stages){if(st.metadata?.stageId!==16||existingOnly&&!st.design?.cavernLayers)continue;const prefix='fc16-';st.terrains=st.terrains.filter(t=>!t.id.startsWith(prefix));st.elements=st.elements.filter(t=>!t.id.startsWith(prefix));const s=st.design.space;s.surfaces=s.surfaces.filter(t=>!t.id.startsWith(prefix));s.scenery=s.scenery.filter(t=>!t.id.startsWith(prefix));s.lights=s.lights.filter(t=>!t.id.startsWith(prefix));s.routes=s.routes.filter(t=>t.id!=='temple-undercroft');s.terrainPlanes=(s.terrainPlanes||[]).filter(t=>!t.terrainId.startsWith(prefix));for(const r of s.rooms)r.terrainIds=r.terrainIds.filter(t=>!t.startsWith(prefix));temple(st);}for(const st of project.stages)if([14,16].includes(st.metadata?.stageId)&&st.design?.cavernLayers)refreshAct2RearTerraceContacts(st);return project;}
