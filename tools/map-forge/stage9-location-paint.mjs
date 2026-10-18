/** Stage9 opt-in only. The shared Stage9/13 tactical author remains intact. */
const pts=a=>a.map(([x,y])=>({x,y}));
const top=(t,x)=>{for(let i=1;i<t.points.length;i++){const a=t.points[i-1],z=t.points[i];if(z.x>a.x&&x>=a.x-.001&&x<=z.x+.001)return a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x);}throw Error('Stage9 support '+t.id+' '+x);};
function curve(knots){const out=[knots[0]];for(let i=1;i<knots.length-1;i++){const a=knots[i-1],b=knots[i],z=knots[i+1],r=Math.min(32,(b[0]-a[0])*.18,(z[0]-b[0])*.18),p=[b[0]-r,b[1]-(b[1]-a[1])*r/(b[0]-a[0])],q=[b[0]+r,b[1]+(z[1]-b[1])*r/(z[0]-b[0])];out.push(p);for(let j=1;j<=4;j++){const t=j/4;out.push([(1-t)**2*p[0]+2*(1-t)*t*b[0]+t*t*q[0],(1-t)**2*p[1]+2*(1-t)*t*b[1]+t*t*q[1]]);}}out.push(knots.at(-1));return out;}
export function applyStage9LocationPaint(project){const s=project.stages.find(s=>s.metadata?.stageId===9);if(!s)return project;const find=id=>s.terrains.find(t=>t.id===id),floor=find('yard-floor'),last=floor.points.findIndex(p=>p.x===3600&&p.y<3500);
 const ground=curve([[0,2600],[350,2570],[600,2570],[1050,2570],[1320,2570],[1550,2520],[1750,2485],[1920,2485],[2180,2445],[2420,2400],[2660,2380],[2910,2380],[3130,2390],[3260,2390],[3600,2390]]);floor.points=[...pts(ground),...floor.points.slice(last+1)];floor.properties={...floor.properties,honroWalkEdges:ground.slice(1).map((_,i)=>i)};floor.detail={...floor.detail,roughness:0,optimizeEpsilon:0};
 const at=x=>top(floor,x),corridor={image:'ritualCorridor9',x:550,width:900,height:900*486/1536,foot:2580},gate={image:'ritualGate9',x:2920,width:760,height:760*622/1152,foot:2403};for(const a of [corridor,gate])a.y=a.foot-a.height;
 const roof=(a,shape)=>shape.map(([x,y])=>[a.x+x*a.width,a.y+y*a.height]);
 const west=roof(corridor,[[0,.23],[.043,0],[.08,.065],[.25,.1],[.47,.105],[.50,.045],[.53,.10],[.76,.105],[.80,.18],[.90,.24],[1,.45]]);
 const profiles={
 'tactical-west-collapsed-gallery':west,
 'tactical-west-rubble-ascent':curve([[350,at(350)],[520,2390],[610,2328],[660,top({id:'roof',points:pts(west)},660)]]),
 'tactical-west-rubble-return':curve([[1280,top({id:'roof',points:pts(west)},1280)],[1410,2370],[1550,at(1550)-160],[1740,at(1740)]]),
 'tactical-east-stone-shoulder':curve([[2520,1990],[2660,1970],[2780,1972],[2910,1987],[3020,2020]]),
 'tactical-east-root-ascent':curve([[2000,at(2000)],[2140,at(2140)-160],[2280,2190],[2420,2080],[2520,1990],[2600,1978.57]]),
 'tactical-east-root-return':curve([[2940,1996],[3020,2020],[3140,2145],[3260,2208],[3380,at(3380)-160],[3510,at(3510)]])};
 for(const [id,upper]of Object.entries(profiles)){const t=find(id),westRoof=id==='tactical-west-collapsed-gallery',stone=id==='tactical-east-stone-shoulder';let lower=upper.toReversed().map(([x,y],i)=>[x,y+(westRoof?14:stone?85:30+24*Math.sin(Math.PI*i/(upper.length-1)))]);
 if(id==='tactical-east-root-ascent')lower=[[2600,2070],[2520,2110],[2440,2150],[2390,2205],[2300,2270],[2230,2325],[2160,2395],[2080,2440],[2000,at(2000)+25]];
 if(id==='tactical-east-root-return')lower=[[3510,at(3510)+24],[3430,2360],[3340,2310],[3260,2280],[3180,2250],[3110,2190],[3040,2140],[2980,2090],[2940,2050]];
 t.points=pts([...upper,...lower]);if(westRoof){t.oneWay=true;t.baseMaterial='wood';}t.properties={...t.properties,honroWalkEdges:upper.slice(1).map((_,i)=>i)};t.detail={...t.detail,roughness:0,optimizeEpsilon:0};}
 s.terrains=s.terrains.filter(t=>t.id!=='stage9-gate-roof');const gr=roof(gate,[[.23,.12],[.29,0],[.36,.065],[.55,.09],[.78,.015],[.85,.10],[.91,.24]]);s.terrains.push({id:'stage9-gate-roof',name:'사당 문간 지붕',type:'solid',points:pts([...gr,...gr.toReversed().map(([x,y])=>[x,y+14])]),baseMaterial:'wood',oneWay:true,breakable:false,layer:'terrain',properties:{hp:99999,maxHp:99999,honroWalkEdges:gr.slice(1).map((_,i)=>i)},detail:{roughness:0,optimizeEpsilon:0}});
 // All meaningful floor references move together, including the entire Sodan
 // threshold walk (3274..3560), rather than adjusting the actor independently.
 for(const u of s.units){if(['foe-2','foe-5','foe-6'].includes(u.id))continue;u.y=at(u.x);if(Object.hasOwn(u,'spawnY'))u.spawnY=u.y;}
 for(const m of s.markers)m.y=at(m.x);
 for(const [key,a]of Object.entries(s.anchors)){a.support='yard-floor';a.y=at(a.x);if(key==='lookout'){a.x=1000;a.support='tactical-west-collapsed-gallery';a.y=top(find(a.support),a.x);}}
 for(const r of s.design.tacticalRoutes.routes)for(const p of r.anchors){const t=find(p.surfaceId);p.y=top(t||floor,p.x);}
 s.design.tacticalRoutes.geometryRevision=2;
 for(const ev of s.events)if(ev.action?.type==='spawn')ev.action.y=ev.action.kind==='crow'?1790:at(ev.action.x);
 for(const el of s.elements){if(el.anchor&&s.anchors[el.anchor])Object.assign(el,{x:s.anchors[el.anchor].x,y:s.anchors[el.anchor].y});else if(el.support==='yard-floor')el.y=at(el.x);}
 // Retain objective/habitat IDs; their legacy art is suppressed only by the new
 // renderer. These empty collision-free scene elements need no new collider.
 s.design.stage9LocationPaint={revision:1,corridor,gate,tree:{image:'villageTree7',x:2350,y:1040,width:1350*1073/1427,height:1350},well:{x:s.anchors.well.x,y:s.anchors.well.y},materials:{stonePads:[[735,965],[1655,1930],[2660,2910]],grassBanks:[[120,520],[2000,2310],[3070,3220]]}};
 return project;
}
