/** Stage4 only. Complete Korean structures determine their real walking tops.
 * The refuge courtyard remains the defence objective; optional heights flank it. */
const copy=x=>structuredClone(x),pts=ps=>ps.map(([x,y])=>({x,y}));
export const STAGE4_GATE={version:1,
 gate:{image:'gate4',x:580,y:2250-900*503/1280,width:900,height:900*503/1280,sourceWidth:1280,sourceHeight:503},
 watch:{image:'watch4',x:3290,y:2210-420*772/1024,width:420,height:420*772/1024,sourceWidth:1024,sourceHeight:772},
 burned:{image:'burned4',x:2420,y:2385-550*383/1024,width:550,height:550*383/1024,sourceWidth:1024,sourceHeight:383},
 westRoute:{from:[690,2250],steps:[[594,2140],[535,2020],[466,1955]],support:'west-shoulder'},
 eastRoute:{from:[3420,2210],deck:'east-step-1',roof:'east-watch'}};
const top=(t,x)=>{for(let i=0;i<t.points.length;i++){const a=t.points[i],b=t.points[(i+1)%t.points.length];if(b.x>a.x&&x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}return t.points[0].y;};
function curve(nodes,x){let i=0;while(i<nodes.length-2&&x>nodes[i+1][0])i++;const a=nodes[i],b=nodes[i+1],u=(x-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*u*u*(3-2*u);}
export function applyStage4GateDefense(project){const st=project.stages.find(s=>s.metadata?.stageId===4);if(!st)return project;
 const floor=st.terrains.find(t=>t.id==='gate-basin'),old=copy(floor),lo=-300,hi=4900;
 const nodes=[[lo,top(old,lo)],[0,2280],[330,2260],[620,2250],[1450,2250],[1600,2270],[1850,2330],[2100,2390],[2350,2400],[2600,2360],[2850,2310],[3150,2260],[3280,2210],[3900,2210],[4080,2160],[4300,2135],[4600,2140],[hi,top(old,hi)]];
 const xs=new Set(nodes.map(p=>p[0]));for(let x=lo;x<=hi;x+=32)xs.add(x);
 const upper=[...xs].sort((a,b)=>a-b).map(x=>({x,y:+curve(nodes,x).toFixed(3)})),first=floor.points.findIndex(p=>p.x>=lo&&p.x<=hi&&p.y<st.height),kept=floor.points.filter(p=>!(p.x>=lo&&p.x<=hi&&p.y<st.height));
 floor.points=[...kept.slice(0,first),...upper,...kept.slice(first)];const at=x=>top(floor,x);if(floor.playProjection?.start)floor.playProjection.start.y=at(floor.playProjection.start.x);
 st.terrains=st.terrains.filter(t=>!['west-step-1','west-step-2','east-step-2'].includes(t.id));
 function ribbon(id,upper,thickness,material='wood',breakable=false){let t=st.terrains.find(t=>t.id===id);if(!t){t={id,name:id,layer:'terrain'};st.terrains.push(t);}Object.assign(t,{type:'solid',baseMaterial:material==='roof'?'wood':material,oneWay:true,breakable,points:pts([...upper,...upper.toReversed().map(([x,y])=>[x,y+thickness])]),detail:{spacing:24,roughness:0,seed:4,optimizeEpsilon:0},properties:{...t.properties,hp:breakable?280:99999,maxHp:breakable?280:99999,route:false,surfaceKind:material==='wood'?'wood':'roof',artSeed:4}});return t;}
 const shoulder=st.terrains.find(t=>t.id==='west-shoulder');Object.assign(shoulder,{oneWay:false,baseMaterial:'rock',points:pts([[100,2265],[160,2224],[190,2140],[275,2122],[306,2035],[390,2014],[410,1957],[505,1953],[565,2020],[592,2125],[635,2250],[635,2300],[100,2320]])});
 const roof=(house,source)=>source.map(([x,y])=>[house.x+x*house.width/house.sourceWidth,house.y+y*house.height/house.sourceHeight]);
 ribbon('gate-roof',roof(STAGE4_GATE.gate,[[240,115],[292,69],[310,14],[324,4],[350,25],[450,42],[640,46],[830,42],[930,24],[955,4],[970,17],[990,74],[1042,118]]),17,'roof');
 ribbon('east-watch',roof(STAGE4_GATE.watch,[[14,111],[75,76],[99,28],[111,5],[140,26],[240,47],[400,61],[600,61],[780,45],[866,24],[882,5],[898,26],[931,76],[1010,113]]),17,'roof');
 const w=STAGE4_GATE.watch,deckY=w.y+532*w.height/w.sourceHeight;
 ribbon('east-step-1',[[w.x+130*w.width/1024,deckY],[w.x+884*w.width/1024,deckY]],19);
 ribbon('burned-gallery',[[2080,2210],[2140,2205],[2310,2208],[2360,2220]],25,'wood',true);
 ribbon('fc-choice-4-gate-flank-pine',[[2880,2182],[2940,2172],[3020,2173],[3095,2184]],25);
 // Support positions, never combat statistics or story identifiers.
 const positions={'p-archer':690,'p-mage':805,'foe-0':1810,'foe-1':2220,'foe-3':1950,'foe-4':2360,'foe-6':2075,'foe-2':3560};
 for(const u of st.units){u.x=positions[u.id]??u.x;u.y=u.id==='foe-5'?1840:u.id==='foe-2'?deckY:at(u.x);if(u.spawnX!==undefined)u.spawnX=u.x;if(u.spawnY!==undefined)u.spawnY=u.y;}
 for(const e of st.elements){if(Number.isFinite(e.x)&&Number.isFinite(e.y))e.y=at(e.x);}
 for(const m of st.markers){if(m.id==='marker-1'||m.id==='habitat-4-0')m.x=1900;if(m.id==='habitat-4-1')m.x=3860;m.y=at(m.x);if(['marker-5','marker-6'].includes(m.id)){m.x=m.id==='marker-5'?3540:3470;m.y=top(st.terrains.find(t=>t.id==='east-watch'),m.x);m.support='east-watch';}if(m.id==='habitat-4-0'||m.id==='habitat-4-1'){const e=st.elements.find(e=>e.id===m.propId);if(e){e.x=m.x;e.y=m.y;}}}
 for(const [name,a]of Object.entries(st.anchors||{})){if(name==='start')a.x=690;if(name==='watch'){a.x=3540;a.support='east-watch';}if(name==='westVantage'){a.x=466;a.support='west-shoulder';}const t=st.terrains.find(t=>t.id===a.support)||floor;a.y=top(t,a.x);}
 for(const m of st.materials){if((m.terrainId||m.support)!=='gate-basin')continue;const x1=m.x1??0,x2=m.x2??st.width,surface=[];for(let x=x1;x<x2;x+=32)surface.push([x,at(x)]);surface.push([x2,at(x2)]);m.surface=surface;m.bottom=surface.map(([x,y])=>[x,y+(m.depth||50)]);m.points=[...surface,...m.bottom.toReversed()];}
 const scene=st.design.act1Scene;scene.rocks=[];scene.lights=[];
 for(const e of scene.scenery||[]){e.y=at(e.x)+(e.footOffset||0);for(const p of e.rootContacts||[])p.y=at(p.x);if(e.id==='a1-scene-4-east-watch-court'){e.x=3500;e.y=2210;e.supportId='gate-basin';}if(e.id==='a1-scene-4-east-grove-center'){e.x=2940;e.y=at(2940)+4;e.supportId='gate-basin';}}
 st.design.forestChoice={version:1,role:'Optional short grounded pine flank beside the eastern approach.',supportId:'fc-choice-4-gate-flank-pine',from:{x:2940,y:at(2940)},to:{x:2940,y:2172},treeX:2940,required:false};
 st.design.stage4Gate=copy(STAGE4_GATE);st.design.title='피란문 흙마당과 접지된 서쪽 암반·낮은 동쪽 감시대';
 st.metadata.gateDefenseTerrainRevision=1;st.initialState.honroStage4GateRevision=1;
 st.detailStats.groundTop=floor.points.findIndex(p=>p.x===st.width)+1;
 for(const ev of st.events){if(ev.id==='siege-0'){ev.action.x=1900;ev.action.y=at(1900);ev.action.support='gate-basin';}if(ev.id==='siege-1'){ev.action.x=3650;ev.action.y=1800;ev.action.requireFlightClearance=true;ev.action.maxDistance=640;}}
 return project;
}
