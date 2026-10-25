/** Stage5 revision4: two real routes beyond one entry movement budget.
 * Keep the approved western bank, waterfall, lake, cave and shared water curves. */
export function authorStage5Traversal(s){
 const clone=v=>JSON.parse(JSON.stringify(v)),floor=s.terrains.find(t=>t.id==='valley-floor'),ridgeTop=[[1750,2350],[1980,2220],[2340,2020],[2680,1840],[2940,1820],[3160,1900],[3260,2000],[3290,1980],[3310,1940],[3370,1940],[3400,2126],[3500,2180]];
 const yAt=(ps,x)=>{for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}throw Error('Stage5 support missing '+x);};
 const land=x=>yAt(floor.points.map(p=>[p.x,p.y]),x),upper=x=>yAt(ridgeTop,x);
 const solid=(id,xy)=>({...clone(floor),id,name:id,points:xy.map(([x,y])=>({x,y})),playProjection:undefined,oneWay:false,properties:{...floor.properties,route:true,surfaceKind:'rock'}});
 const shoulder=s.terrains.find(t=>t.id==='stage5-west-shoulder');
 // Open a real body-height lower passage under the connected upper ridge.
 shoulder.points=[[650,2390],[790,2290],[1060,2250],[1330,2250],[1550,2290],[1790,2360],[1790,2490],[1570,2490],[1330,2470],[1110,2490],[890,2510],[740,2530],[650,2510]].map(([x,y])=>({x,y}));
 s.terrains=s.terrains.filter(t=>!['stage5-upper-ridge','stage5-ritual-stone','stage5-cave-brow'].includes(t.id));
 s.terrains.push(solid('stage5-upper-ridge',[...ridgeTop,[3500,2330],[3220,2390],[3050,2480],[2860,2520],[2700,2860],[2570,3162],[2460,2947],[2410,2800],[2320,2400],[2160,2380],[1980,2440],[1790,2480]]));
 s.terrains.push(solid('stage5-ritual-stone',[[2150,2560],[2280,2550],[2380,2720],[2350,2800],[2150,2640]]));
 s.terrains.push(solid('stage5-cave-brow',[[3620,1940],[3890,1840],[4000,1910],[4010,2120],[3820,2080],[3620,2050]]));
 const receiver={x:2280,y:2550,support:'stage5-ritual-stone'},shot={x:3450,y:upper(3450),support:'stage5-upper-ridge'};
 const target=s.terrains.find(t=>t.id==='cliff-cleat');target.points=[{x:4338,y:2255.529411764706},{x:4422,y:2255.529411764706},{x:4422,y:2403.529411764706},{x:4338,y:2403.529411764706}];
 Object.assign(s.anchors,{receiver,basin:{x:1700,y:land(1700),support:'valley-floor'},shotGap:shot,upperShot:shot,roost:{x:2830,y:upper(2830),support:'stage5-upper-ridge'},cleat:{x:4380,y:2404,support:'waterfall-cliff'},exit:{x:4380,y:2404,support:'waterfall-cliff'},ritualWest:{x:2180,y:2557.6923076923076,support:'stage5-ritual-stone'},ritualEast:{x:2310,y:2601,support:'stage5-ritual-stone'}});
 const markers={'receiver-5':'receiver','marker-1':'receiver','marker-3':'shotGap','marker-5':'cleat','habitat-5-0':'basin','habitat-5-1':'roost'};
 for(const m of s.markers)if(markers[m.id])Object.assign(m,s.anchors[markers[m.id]]);
 for(const e of s.elements)if(e.id==='landmark-1')Object.assign(e,{x:receiver.x,y:receiver.y});
 const positions={'foe-4':[1770,'floor'],'foe-5':[2090,'floor'],'foe-6':[2460,'upper'],'foe-7':[2720,1620],'foe-8':[2310,'ritual'],'foe-9':[2200,'ritual'],'foe-10':[3420,1870],'foe-11':[3090,1640]};
 for(const u of s.units){const q=positions[u.id];if(q){const [x,at]=q,y=at==='floor'?land(x):at==='upper'?upper(x):at==='ritual'?yAt([[2150,2560],[2280,2550],[2380,2720]],x):at;Object.assign(u,{x,y,spawnX:x,spawnY:y});}}
 // Separate the remote upper watch from the lower ritual approach.
 for(const u of s.units.filter(u=>u.team==='enemy')){const cell=['foe-6','foe-7','foe-11'].includes(u.id)?'crest':u.id==='foe-10'?'shore':['foe-4','foe-5','foe-8','foe-9'].includes(u.id)?'ritual':'entry';Object.assign(u,{honroStage5Cell:cell,honroCluster:cell,group:{entry:1,ritual:2,crest:3,shore:4}[cell]});}
 s.encounters=['entry','ritual','crest','shore'].map(key=>({id:'encounter:'+key,key,unitIds:s.units.filter(u=>u.honroStage5Cell===key).map(u=>u.id)}));
 const wave=s.events.find(e=>e.id==='lower-beasts');if(wave){Object.assign(wave.action,{x:1040,y:land(1040),support:'valley-floor',spacing:100,maxDistance:0,clearance:18,pursuitSupports:['valley-floor','stage5-ritual-stone'],entryOptions:[{x:1040,y:land(1040)},{x:740,y:land(740)}]});wave.entry={x:1040,y:land(1040)};}
 s.initialState.honroStage5TraversalRevision=1;
 s.design.question='담허는 암반 아래 안쪽 물길진을 확보하고, 설오는 동쪽 높은 암반길을 올라 동굴 안으로 사선을 만든다.';
 s.design.positioning.routes.upper=[{x:580,y:land(580),support:'valley-floor',jumpTo:{x:740,support:'stage5-west-shoulder'}},{x:1100,y:2250,support:'stage5-west-shoulder'},{x:1740,y:2345,support:'stage5-west-shoulder'},{x:2050,y:upper(2050),support:'stage5-upper-ridge'},{x:2400,y:upper(2400),support:'stage5-upper-ridge'},{x:2800,y:upper(2800),support:'stage5-upper-ridge'},shot];
 s.design.positioning.routes.lower=[700,1200,1740,2000].map(x=>({x,y:land(x),support:'valley-floor'})).concat([s.anchors.ritualWest,receiver]);
 s.design.positioning.routes.ritual=[s.anchors.ritualWest,receiver,s.anchors.ritualEast];
 s.design.positioning.traversalRevision=1;
 s.design.geologyComposition.instances=s.design.geologyComposition.instances.filter(q=>q.id!=='stage5-ritual-granite');
 s.design.geologyComposition.instances.push({id:'stage5-brow-granite',assetId:'geology:granite-ledge-neck',scale:.65,socket:'ledge-back',support:{terrainId:'stage5-cave-brow',at:.5},surfaceAttachment:{mode:'exposed'}},{id:'stage5-ritual-granite',assetId:'geology:granite-ledge-neck',scale:.65,mirrorX:true,socket:'ledge-back',support:{terrainId:'stage5-ritual-stone',at:.5},surfaceAttachment:{mode:'exposed'}},{id:'stage5-upper-ridge-granite',assetId:'geology:granite-ledge-neck',scale:1,socket:'ledge-back',support:{terrainId:'stage5-upper-ridge',at:.5},surfaceAttachment:{mode:'exposed'}});
}
