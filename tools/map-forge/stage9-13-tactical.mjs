/** Bounded, idempotent topology authoring. Existing objectives, NPC floor,
 * gate, map bounds, encounter counts and live-save snapshots are untouched. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const point=([x,y])=>({x,y});
function surface(t,x){for(let i=1;i<t.points.length;i++){const a=t.points[i-1],b=t.points[i];if(b.x>a.x&&x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}throw Error('No surface '+t.id+' '+x);}
function slab(id,top,thickness=45,oneWay=false,material='rock'){return{id,name:id,type:'solid',points:[...top,...top.toReversed().map(([x,y])=>[x,y+thickness])].map(point),baseMaterial:material,oneWay,breakable:false,layer:'terrain',properties:{hp:99999,maxHp:99999,optional:true,surfaceKind:oneWay?'wood':'rock',honroWalkEdges:top.slice(1).map((_,i)=>i)},detail:{spacing:18,roughness:0,seed:913,optimizeEpsilon:0}};}
function author(s,project){
 const n=s.metadata.stageId,floor=s.terrains.find(t=>t.id===(n===9?'yard-floor':'act2-floor')),ground=x=>surface(floor,x);
 const removed=n===9?['west-step-1','west-step-2','west-gallery','center-lookout','east-step-1','east-step-2','east-gallery']:['ct-gallery-work-deck'];
 s.terrains=s.terrains.filter(t=>!removed.includes(t.id)&&!t.id.startsWith('tactical-'));
 const entryTop=[[1110,ground(1110)-180],[1250,2920],[1600,2920],[1840,3000],[2130,ground(2130)-180]],innerTop=[[5270,ground(5270)-200],[5480,3920],[5800,3920],[6050,4070],[6290,ground(6290)-200]],atTop=(top,x)=>surface({points:top.map(point)},x);
 const additions=n===9?[
 slab('tactical-west-collapsed-gallery',[[610,2340],[960,2310],[1340,2400]],45),
 slab('tactical-west-rubble-ascent',[[430,ground(430)-160],[610,2340],[660,2335.714285714286]],25,true,'wood'),
 slab('tactical-west-rubble-return',[[1280,2385.7894736842104],[1340,2400],[1550,ground(1550)-160]],25,true,'wood'),
 slab('tactical-east-stone-shoulder',[[2520,1990],[2750,1970],[3020,2020]],65),
 slab('tactical-east-root-ascent',[[2140,ground(2140)-160],[2420,2080],[2520,1990],[2600,1983.0434782608695]],25,true,'wood'),
 slab('tactical-east-root-return',[[2940,2005.1851851851852],[3020,2020],[3140,2145],[3380,ground(3380)-160]],25,true,'wood')
 ]:[
 slab('tactical-entry-shoulder',entryTop,50),
 slab('tactical-entry-west-ramp',[[820,ground(820)-160],[1110,ground(1110)-180],[1180,atTop(entryTop,1180)]],25,true,'wood'),
 slab('tactical-mason-return',[[2080,atTop(entryTop,2080)],[2130,ground(2130)-180],[2350,ground(2350)-160]],25,true,'wood'),
 slab('tactical-inner-gallery',innerTop,50),
 slab('tactical-inner-west-ramp',[[5020,ground(5020)-160],[5270,ground(5270)-200],[5350,atTop(innerTop,5350)]],25,true,'wood'),
 slab('tactical-inner-east-ramp',[[6220,atTop(innerTop,6220)],[6290,ground(6290)-200],[6530,ground(6530)-160]],25,true,'wood')
 ];if(n===13){additions[0].points=[...entryTop,[2130,ground(2130)-130],[1900,3180],[1720,3100],[1460,3070],[1250,3015],[1110,ground(1110)-130]].map(point);additions[3].points=[...innerTop,[6290,ground(6290)-150],[6070,4210],[5750,4090],[5460,4035],[5270,ground(5270)-150]].map(point);}
 s.terrains.push(...additions);
 const p=(x,t)=>({x,y:t?surface(additions.find(q=>q.id===t),x):ground(x),surfaceId:t||(n===9?'yard-floor':'floor-main')});
 const routes=n===9?[
 {id:'west-covered-floor',defaultJump:false,anchors:[p(430),p(850),p(1420),p(1800)]},
 {id:'west-collapsed-gallery',anchors:[p(400),p(470,'tactical-west-rubble-ascent'),p(570,'tactical-west-rubble-ascent'),p(960,'tactical-west-collapsed-gallery'),p(1400,'tactical-west-rubble-return'),p(1510,'tactical-west-rubble-return'),p(1630),p(1800)]},
 {id:'east-root-loop',anchors:[p(2060),p(2190,'tactical-east-root-ascent'),p(2340,'tactical-east-root-ascent'),p(2600,'tactical-east-stone-shoulder'),p(2800,'tactical-east-stone-shoulder'),p(3070,'tactical-east-root-return'),p(3320,'tactical-east-root-return'),p(3480)]},
 {id:'receiver-return',defaultJump:false,anchors:[p(850),p(1400),p(1800),p(2300),p(2800),p(3380)]}
 ]:[
 {id:'entry-shoulder',anchors:[p(740),p(865,'tactical-entry-west-ramp'),p(1050,'tactical-entry-west-ramp'),p(1200,'tactical-entry-shoulder'),p(1400,'tactical-entry-shoulder'),p(1650,'tactical-entry-shoulder'),p(1880,'tactical-entry-shoulder'),p(2050,'tactical-entry-shoulder'),p(2190,'tactical-mason-return'),p(2290,'tactical-mason-return'),p(2430)]},
 {id:'mason-covered-approach',defaultJump:false,anchors:[p(820),p(1300),p(1800),p(2400)]},
 {id:'inner-gallery',anchors:[p(4940),p(5070,'tactical-inner-west-ramp'),p(5190,'tactical-inner-west-ramp'),p(5400,'tactical-inner-gallery'),p(5600,'tactical-inner-gallery'),p(5820,'tactical-inner-gallery'),p(6050,'tactical-inner-gallery'),p(6200,'tactical-inner-gallery'),p(6360,'tactical-inner-east-ramp'),p(6470,'tactical-inner-east-ramp'),p(6620)]},
 {id:'inner-low-passage',defaultJump:false,anchors:[p(5020),p(5400),p(5900),p(6400),p(6600)]}
 ];
 s.design.tacticalRoutes={version:1,geometryRevision:1,scope:'ordinary walking and default jump, no skill or reward required',routes:routes.map(r=>({...r,requires:[],bidirectional:true})),preserved:{bounds:true,encounters:true,objectives:true,npcFloor:true}};
 if(n===13){const sp=s.design.space;sp.routes=sp.routes.filter(r=>!removed.includes(r.id)&&!r.id.startsWith('tactical-'));sp.surfaces=sp.surfaces.filter(r=>!removed.includes(r.terrainId)&&!r.terrainId.startsWith('tactical-'));for(const room of sp.rooms)room.terrainIds=room.terrainIds.filter(id=>!removed.includes(id)&&!id.startsWith('tactical-'));for(const t of additions){const roomId=t.id.includes('inner')?'low-gallery':'sunken-forecourt';sp.surfaces.push({id:t.id,terrainId:t.id,role:'shelf',edgeIndices:t.properties.honroWalkEdges,roomIds:[roomId]});sp.rooms.find(r=>r.id===roomId).terrainIds.push(t.id);}s.design.cavernTransitions={version:2,decision:'short-asymmetric-stone-shoulder-and-inner-passage',choices:routes.filter(r=>r.defaultJump!==false).map(r=>({id:'tactical-'+r.id,route:r.anchors})),views:[{name:'entry-shoulder',x:1760,y:3200,scale:.5,width:1440,height:960},{name:'inner-passage',x:5800,y:4220,scale:.5,width:1440,height:960}]};sp.routes.push(...routes.map(r=>({...r,id:'tactical-'+r.id,kind:'optional-jump',requires:[]})));}
 // Recessed mother-rock carries the solid ledges visually. It has no collision
 // and no bright rim; the outlined front surface remains the only walk cue.
 const artId=`stage${n}:tactical-recessed-support`,children=[],supports=[];
 for(const t of additions.filter(t=>!t.oneWay)){
  const top=t.points.slice(0,t.properties.honroWalkEdges.length+1),l=top[0].x,r=top.at(-1).x,w=r-l;
  const a=l+w*.16,b=l+w*.76,ay=ground(a),by=ground(b),mid=top[Math.floor(top.length/2)];
  children.push({tag:'path',fill:'#26343c',d:`M${l-70} ${top[0].y+22} L${l+w*.18} ${top[0].y-70} ${mid.x} ${mid.y-90} ${r+50} ${top.at(-1).y+45} ${b+50} ${by+40} ${a-60} ${ay+35} Z`});
  children.push({tag:'path',fill:'#303e45',d:`M${a} ${top[0].y+20} L${mid.x} ${mid.y-90} ${b} ${top.at(-1).y+45} ${b-35} ${by+25} ${a} ${ay+15} Z`});
  children.push({tag:'path',fill:'#19262e',d:`M${l+40} ${top[0].y+70} Q${mid.x} ${mid.y+70} ${r-25} ${top.at(-1).y+90} L${r-30} ${ground(r)-12} Q${mid.x} ${ground(mid.x)-100} ${l+40} ${ground(l)-15} Z`});
  supports.push({terrainId:floor.id,x:a,y:ay},{terrainId:floor.id,x:b,y:by});
 }
 // Stage9: grounded, recessed bedrock and roots instead of a giant opaque
 // doorway/pyramid. These rear faces never add collision or a walking rim.
 if(n===9){children.length=0;const face=(fill,pts)=>children.push({tag:'path',fill,d:'M'+pts.map(p=>p.join(' ')).join(' L')+' Z'});
  face('#34454a',[[620,2376],[812,2358],[1020,2370],[1308,2430],[1268,2585],[1100,2630],[994,2515],[775,2532],[655,2537]]);
  face('#415357',[[655,2394],[812,2380],[871,2485],[778,2511],[655,2537]]);
  face('#283d43',[[1100,2430],[1308,2430],[1268,2585],[1100,2630],[1150,2530]]);
  face('#45575a',[[775,2430],[910,2412],[1050,2458],[1150,2450],[1100,2480],[945,2460],[810,2465]]);
  face('#33474b',[[2518,2044],[2728,2020],[3004,2081],[2962,2186],[3015,2318],[2950,2392],[2838,2384],[2780,2228],[2618,2207],[2555,2339],[2460,2359],[2492,2210]]);
  face('#3b5055',[[2518,2044],[2660,2030],[2631,2106],[2667,2195],[2608,2258],[2555,2339],[2460,2359],[2492,2210]]);
  face('#45585c',[[2660,2030],[2728,2020],[3004,2081],[2937,2122],[2774,2084],[2631,2106]]);
  face('#263d43',[[2833,2118],[3004,2081],[2962,2186],[3015,2318],[2950,2392],[2838,2384],[2863,2260]]);
  face('#3f5356',[[2618,2207],[2780,2228],[2863,2260],[2838,2307],[2733,2270],[2590,2284]]);
  // Branching buttress roots follow the two existing climb approaches and
  // terminate behind the floor, with no bright false footholds.
  face('#354b43',[[2165,2270],[2300,2180],[2426,2099],[2460,2120],[2390,2225],[2330,2355],[2260,2391],[2302,2263],[2200,2350],[2132,2410],[2150,2340]]);
  face('#4b5d50',[[2165,2270],[2300,2180],[2426,2099],[2385,2150],[2292,2227],[2193,2328],[2150,2340]]);
  face('#344a43',[[3010,2070],[3150,2168],[3345,2243],[3378,2325],[3440,2388],[3370,2390],[3300,2290],[3150,2245],[3060,2345],[2990,2395],[3030,2278],[3090,2190]]);
  face('#485b50',[[3010,2070],[3150,2168],[3345,2243],[3330,2275],[3150,2204],[3100,2170]]);
 }
 const bounds={x:0,y:0,w:s.width,h:s.height},viewBox=[0,0,s.width,s.height],asset={id:artId,name:'후퇴한 회랑과 암대의 접지 모암',category:'terrain',environmentRole:'rock',vector:{version:1,viewBox,gradients:{},root:{tag:'g',children},source:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.join(' ')}">${children.map(p=>`<path fill="${p.fill}" d="${p.d}"/>`).join('')}</svg>`},visual:[],collision:[],anchor:{x:0,y:0},sockets:[],bounds,tags:['visual-only','editable-native-vector'],params:{artRevision:1,rearOnly:true,noWalkRim:true,supports},reference:{heightM:s.height/60,bounds,foot:{x:0,y:0},scaleRange:[.35,4],backgroundRange:[.35,4]}};
 const ai=project.library.findIndex(a=>a.id===artId);if(ai<0)project.library.push(asset);else project.library[ai]=asset;s.elements=s.elements.filter(e=>e.id!=='tactical-recessed-support');s.elements.push({id:'tactical-recessed-support',assetId:artId,x:0,y:0,scale:1,rotation:0,snap:false,layer:'back',depthLayer:'L1'});
 // Fixed flying sentries keep their role above the new shoulders, rather than
 // starting inside the new solid shell. Their budgets and number are unchanged.
 if(n===9)for(const [id,y]of [['foe-2',1840],['foe-5',1880],['foe-6',2200]]){const u=s.units.find(u=>u.id===id);if(u){u.y=y;u.spawnY=y;}}
 if(n===13)for(const [id,y]of [['a2-enemy-7',3352.5],['a2-enemy-14',4040],['a2-enemy-16',4210],['a2-enemy-17',4250]]){const u=s.units.find(u=>u.id===id);if(u)u.y=y;const site=s.design.space.encounterSites.find(q=>q.unitId===id);if(site)site.y=y;}
 return s;
}
export function applyStage9And13Tactical(project){for(const s of project.stages)if([9,13].includes(s.metadata?.stageId))author(s,project);return project;}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file='shared/data/campaign.json';await writeFile(file,JSON.stringify(applyStage9And13Tactical(JSON.parse(await readFile(file,'utf8'))),null,2)+'\n');}
