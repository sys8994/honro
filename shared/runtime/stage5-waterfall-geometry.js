(function(G){'use strict';
// The rendered sheet and projectile collider share these sampled cubic curves.
function shape(start,segments){const out=[{x:start[0],y:start[1]}];for(const seg of segments){const a=out.at(-1),[bx,by,cx,cy,dx,dy]=seg;for(let i=1;i<=24;i++){const t=i/24,u=1-t;out.push({x:u*u*u*a.x+3*u*u*t*bx+3*u*t*t*cx+t*t*t*dx,y:u*u*u*a.y+3*u*u*t*by+3*u*t*t*cy+t*t*t*dy});}}return out;}
const closed=shape([2798,1220],[[2770,1580,2825,1830,2782,2100],[2760,2490,2765,2860,2690,3285],[2850,3330,3100,3340,3280,3290],[3180,2920,3100,2540,3130,2120],[3130,1820,3230,1560,3210,1220]]);
const opened=shape([2798,1220],[[2770,1550,2870,1810,3080,1980],[3280,2130,3430,2210,3430,2370],[3430,2640,3210,2850,2990,3110],[2870,3210,2770,3270,2690,3285],[2850,3330,3100,3340,3280,3290],[3400,3070,3540,2900,3650,2660],[3740,2480,3780,2260,3670,2100],[3520,1910,3280,1840,3220,1590],[3200,1430,3230,1320,3210,1220]]);
// Both the ribbon and projectile drag use these revision5 world polygons.
// Legacy lake snapshots retain their original offset and curves.
const dynamic={
 closed:shape([4210,875],[[4180,1250,4210,1920,4200,2470],[4180,2810,4140,2870,4010,2900],[4190,2935,4410,2935,4560,2900],[4380,2750,4380,2700,4390,2460],[4440,2040,4350,1860,4390,1180],[4400,1080,4410,970,4410,875]]),
 opened:shape([4210,875],[[4550,820,5350,840,5680,850],[5820,950,5860,1330,5800,1600],[5690,2070,5260,2460,4010,2900],[4190,2935,4410,2935,4560,2900],[5500,2570,5910,2080,6000,1650],[6070,1330,6040,1020,5880,900],[5550,850,4700,930,4410,875]])
};
const offset=b=>b.honroStage5DynamicRevision?0:b.honroStage5LakeRevision===1?900:0;
function setOpen(b,open){if(b.honroStage!==5||b.honroStage5WaterfallRevision!==1||b.honroCustom)return;const t=G.HonroQuestTargets.records(b).find(t=>t.id==='waterfall-veil');if(!t)return;const changed=t.honroWaterOpen!==open||t.broken||!t.honroWaterFluidVertices;t.broken=false;if(!changed)return;const shapes=b.honroStage5DynamicRevision?dynamic:{closed,opened},fluid=G.HONRO_CORE.canonicalPolygon((open?shapes.opened:shapes.closed).map(p=>({x:p.x+offset(b),y:p.y}))),vertices=G.HONRO_CORE.waterfallBodyShape(fluid),xs=vertices.map(p=>p.x),ys=vertices.map(p=>p.y);Object.assign(t,{honroWaterFluidVertices:fluid,vertices,x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys),honroWaterOpen:open});b.sceneVersion++;}
const active=b=>b?.honroStage===5&&b.honroStage5WaterfallRevision===1&&!b.honroCustom;
function warnHabitat(app,source,kind){const b=app.engine.b,hs=b.honroState,key=`${hs.habitatContributionWave||0}:${source}`;hs.waterfallHabitatWarnings??={};if(hs.waterfallHabitatWarnings[key]===undefined){hs.waterfallHabitatWarnings[key]=b.round;app.event(kind==='crow'?'사격턱 위 둥지에서 날갯짓이 가까워진다. 주박목이 풀리면 날아들 기세다.':'젖은 돌길 풀숲에서 짐승이 움직인다. 주박목이 풀릴 때를 기다리는 듯하다.');}return hs.waterfallHabitatWarnings[key];}
const missionTick=G.HonroMission.tick;G.HonroMission.tick=function(app,dt){const b=app.engine?.b;if(active(b)){const hs=b.honroState;if(hs.flags['event:lower-beasts-warning']){hs.waterfallWaveRound??=b.round+1;const ev=b.honroEvents.find(e=>e.id==='lower-beasts');if(ev)ev.when.round=hs.waterfallWaveRound;}if(app.engine.alive(1).length<5&&G.HonroQuestTargets.records(b).some(t=>t.id==='cliff-cleat'&&!t.broken))for(const site of b.honroMarkers.filter(m=>m.type==='hauntHabitat'))warnHabitat(app,site.id,site.kind);}return missionTick(app,dt);};
const execute=G.HonroAllies.execute;G.HonroAllies.execute=function(app,action){const b=app.engine?.b;if(active(b)&&action?.type==='spawn'&&action.source?.startsWith('habitat-5-')&&b.round<=warnHabitat(app,action.source,action.kind))return false;return execute(app,action);};
G.HonroStage5WaterGeometry={closed,opened,dynamic,offset,setOpen};
})(globalThis);
