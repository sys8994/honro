/** Stage6 only: a continuous lower convoy road below one complete bridge. */
const copy=x=>structuredClone(x),pts=a=>a.map(([x,y])=>({x,y}));
export const STAGE6_BRIDGE={version:1,bridge:{image:'bridge6',x:1450,y:2158,width:3500,height:3500*400/2172,sourceWidth:2172,sourceHeight:400},tree:{x:5860,height:630,foot:.54},rearPiers:true};
const top=(t,x)=>{for(let i=0;i<t.points.length;i++){const a=t.points[i],z=t.points[(i+1)%t.points.length];if(z.x>a.x&&x>=a.x&&x<=z.x)return a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x);}return t.points[0].y;};
const contour=(nodes,x)=>{let i=0;while(i<nodes.length-2&&x>nodes[i+1][0])i++;const a=nodes[i],z=nodes[i+1],u=(x-a[0])/(z[0]-a[0]);return a[1]+(z[1]-a[1])*u*u*(3-2*u);};
export function applyStage6BrokenBridge(project){const s=project.stages.find(s=>s.metadata?.stageId===6);if(!s)return project;const floor=s.terrains.find(t=>t.id==='lower-road'),old=copy(floor),lo=-300,hi=6900;
 const nodes=[[lo,top(old,lo)],[0,2600],[650,2610],[1100,2630],[1450,2645],[1750,2680],[2050,2740],[2380,2770],[2580,2790],[3000,2820],[3400,2815],[3590,2795],[3700,2763],[3960,2765],[4100,2770],[4500,2710],[4950,2645],[5400,2600],[5900,2560],[6600,2540],[hi,top(old,hi)]];
 const xs=new Set(nodes.map(p=>p[0]));for(let x=lo;x<=hi;x+=32)xs.add(x);const upper=[...xs].sort((a,b)=>a-b).map(x=>({x,y:+contour(nodes,x).toFixed(3)})),first=floor.points.findIndex(p=>p.x>=lo&&p.x<=hi&&p.y<s.height),kept=floor.points.filter(p=>!(p.x>=lo&&p.x<=hi&&p.y<s.height));floor.points=[...kept.slice(0,first),...upper,...kept.slice(first)];const at=x=>top(floor,x);if(floor.playProjection?.start)floor.playProjection.start.y=at(floor.playProjection.start.x);
 s.terrains=s.terrains.filter(t=>!['pier-west','pier-east'].includes(t.id));
 function ribbon(id,a,h,material='wood'){const t=s.terrains.find(t=>t.id===id);Object.assign(t,{baseMaterial:material,oneWay:true,points:pts([...a,...a.toReversed().map(([x,y])=>[x,y+h])])});t.properties={...t.properties,surfaceKind:material==='wood'?'wood':'rock',honroBridge:true};return t;}
 const h=STAGE6_BRIDGE.bridge,deck=a=>a.map(([x,y])=>[h.x+x*h.width/2172,h.y+(y-200)*h.width/2172]);
 ribbon('bridge-west',deck([[10,271],[100,270],[300,272],[560,269],[700,270],[776,271]]),28);
 ribbon('bridge-mid',deck([[838,272],[950,269],[1130,271],[1300,273],[1424,273]]),28);
 ribbon('bridge-east',deck([[1487,272],[1650,269],[1840,270],[2030,267],[2160,269]]),28);
 ribbon('debris-step-1',[[1160,2475],[1260,2467],[1400,2453],[1510,2460]],42);
 ribbon('debris-step-2',[[1330,2390],[1460,2375],[1600,2380]],31);
 ribbon('debris-step-3',[[4860,2375],[5000,2384],[5160,2400]],35);
 ribbon('lower-lookout',[[5050,2440],[5220,2448],[5350,2462]],40);
 ribbon('fc-choice-6-bridge-exit-pine',[[5790,2420],[5860,2410],[5950,2414],[6030,2428]],25);
 const positions={'foe-0':[1940,2090],'foe-4':[2310,2000],'foe-8':[2920,2070],'foe-3':[4310,2080],'foe-7':[4680,2010],'foe-1':[2820],'foe-5':[3010],'foe-9':[3390],'foe-2':[4550],'foe-6':[4730],'midboss-stage6':[3230],'objective':[4100]};
 for(const u of s.units){const q=positions[u.id];if(q)u.x=q[0];u.y=q?.[1]??at(u.x);u.spawnX=u.x;u.spawnY=u.y;}
 for(const a of Object.values(s.anchors)){a.y=top(s.terrains.find(t=>t.id===a.support)||floor,a.x);}s.anchors.westDeck={x:1950,y:top(s.terrains.find(t=>t.id==='bridge-west'),1950),support:'bridge-west'};s.anchors.midDeck={x:3250,y:top(s.terrains.find(t=>t.id==='bridge-mid'),3250),support:'bridge-mid'};
 for(const m of s.markers)m.y=at(m.x);
 // These two generic sampled decoration rocks have no quest/actor references.
 // Their old solid skirts cut across the newly continuous convoy lane.
 s.elements=s.elements.filter(e=>!['place6-west-rock','place6-east-rock'].includes(e.id));
 for(const e of s.elements){if(Number.isFinite(e.x))e.y=at(e.x);}
 for(const ev of s.events){const a=ev.action;if(!a||a.type!=='spawn')continue;if(ev.id==='bridge-crows')Object.assign(a,{x:3090,y:2060,requireFlightClearance:true,maxDistance:640});if(ev.id==='bridge-boars')Object.assign(a,{x:4550,y:at(4550),support:'lower-road',spacing:145,maxDistance:500});if(ev.id==='pursuit')Object.assign(a,{x:3540,y:at(3540),support:'lower-road',spacing:145,maxDistance:500});}
 // Keep a shallow wet trace on the road rather than a deep obstacle or new pool.
 for(const m of s.materials){if(m.id==='place6-ravine-water'){m.kind='water';m.x1=2710;m.x2=3490;m.surfaceY=2812;m.depth=0;}
  if(m.points||m.surface||m.bottom){delete m.points;delete m.surface;delete m.bottom;}}
 s.design.stage6Bridge=copy(STAGE6_BRIDGE);s.design.title='오래된 목교 아래의 연속 호송로';s.design.act1Scene.rocks=[];s.design.act1Scene.lights=[];for(const e of s.design.act1Scene.scenery||[]){e.y=at(e.x)+(e.footOffset||0);for(const p of e.rootContacts||[])p.y=at(p.x);}
 s.design.forestChoice={version:1,role:'One static exit pine bough above the continuous escort road.',supportId:'fc-choice-6-bridge-exit-pine',from:{x:5860,y:at(5860)},to:{x:5860,y:2410},treeX:5860,required:false};
 s.metadata.brokenBridgeTerrainRevision=1;s.initialState.honroStage6BridgeRevision=1;s.detailStats.groundTop=floor.points.findIndex(p=>p.x===s.width)+1;return project;
}
