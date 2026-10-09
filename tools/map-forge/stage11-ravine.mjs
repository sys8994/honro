/** Stage 11's mountain cross-section. One source for collision, routes and sites.
 * Existing battle snapshots never call this authoring function. */
const clone=x=>JSON.parse(JSON.stringify(x));
export const RAVINE_VERSION=2;
// This low bed catches falls; it is deliberately NOT the principal route.
export const RAVINE_FLOOR=[[0,6500],[1500,6500],[2300,8000],[4000,10000],[6000,10500],[11000,10500],[13000,9600],[14500,8100],[16000,7200]];
export function heightOn(points,x){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(b[0]>a[0]&&x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}throw Error('No authored surface at '+x);}
function terrain(id,top,bottom,{material='rock',oneWay=false,role='shelf',treeId=null,optional=true}={}){return{id,name:id,type:'solid',points:[...top,...bottom].map(([x,y])=>({x,y})),baseMaterial:material,breakable:false,oneWay,layer:'terrain',properties:{surfaceKind:material==='wood'?'wood':'rock',honroCave:false,honroSpaceSurfaceId:id,honroSurfaceRole:role,honroWalkEdges:top.slice(1).map((_,i)=>i),optional,honroRavine:true,...(treeId?{honroRavineTree:treeId}:{})},detail:{spacing:18,roughness:0,seed:11,optimizeEpsilon:0}};}
const rock=(id,top,bottom,extra={})=>terrain(id,top,bottom,extra);
const branch=(id,treeId,top,depth=90)=>terrain(id,top,top.slice().reverse().map(([x,y])=>[x,y+depth]),{material:'wood',oneWay:true,treeId});
// Clip only convex non-walking corners into their existing mass. The entry,
// quadratic midpoint and exit all stay in the old polygon: this never fills a
// concave notch or intrudes into an existing passage. Authored top edges remain
// byte-for-byte identical and keep their original edge indices.
export function insetRavineCorners(t,radius){
 const original=t.points,topCount=t.properties.honroWalkEdges.length+1;
 const area=original.reduce((s,p,i)=>{const q=original[(i+1)%original.length];return s+p.x*q.y-q.x*p.y;},0),sign=Math.sign(area)||1;
 const onSegment=(p,a,b)=>{const cross=(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);return Math.abs(cross)<=1e-6*Math.max(1,Math.hypot(b.x-a.x,b.y-a.y))&&p.x>=Math.min(a.x,b.x)-1e-6&&p.x<=Math.max(a.x,b.x)+1e-6&&p.y>=Math.min(a.y,b.y)-1e-6&&p.y<=Math.max(a.y,b.y)+1e-6;};
 const inside=p=>{let yes=false;for(let i=0,j=original.length-1;i<original.length;j=i++){const a=original[j],b=original[i];if(onSegment(p,a,b))return true;if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;};
 const output=[];
 for(const [i,p]of original.entries()){
  if(i<topCount){output.push(p);continue;}
  const a=original[(i+original.length-1)%original.length],b=original[(i+1)%original.length],ax=p.x-a.x,ay=p.y-a.y,bx=b.x-p.x,by=b.y-p.y,da=Math.hypot(ax,ay),db=Math.hypot(bx,by);
  const cross=(ax*by-ay*bx)*sign,turn=Math.acos(Math.max(-1,Math.min(1,(ax*bx+ay*by)/(da*db||1))));
  if(cross<=1e-6||turn<Math.PI/15){output.push(p);continue;}
  const d=Math.min(radius,da*.28,db*.28),entry={x:p.x-ax*d/da,y:p.y-ay*d/da},exit={x:p.x+bx*d/db,y:p.y+by*d/db},mid={x:(entry.x+2*p.x+exit.x)/4,y:(entry.y+2*p.y+exit.y)/4},replacement=[entry,mid,exit];
  const chain=[a,...replacement,b],safe=chain.slice(1).every((z,j)=>Array.from({length:17},(_,k)=>{const f=k/16;return inside({x:chain[j].x+(z.x-chain[j].x)*f,y:chain[j].y+(z.y-chain[j].y)*f});}).every(Boolean));
  output.push(...(safe?replacement:[p]));
 }
 t.points=output;return t;
}
export function createRavineTerrains(){
 const ts=[terrain('act2-floor',RAVINE_FLOOR,[[16000,12240],[0,12240]],{role:'floor',optional:false})];ts[0].properties.surfaceKind='soil';
 ts.push(
 // Thick, genuinely colliding masses; the lower passages are empty space,
 // not scenery drawn on one continuous V-shaped collision foundation.
 rock('rv-west-shoulder',[[1300,6500],[1800,6340],[2600,6120],[2900,5990],[3200,6165],[3400,6180],[4100,6370],[4600,6700]],[[4450,7500],[4000,8000],[3100,8350],[2000,7950],[1430,7180]],{optional:false}),
 // Three small combat pockets stay outside the already reviewed main line.
 // Open shelves are one-way; the reflection face and low rock ceiling are solid.
 rock('rv-ritual-reflection-ledge',[[7000,6640],[7200,6610],[7420,6595],[7640,6640]],[[7640,6675],[7420,6630],[7200,6645],[7000,6675]],{oneWay:true}),
 rock('rv-ritual-reflection-wall',[[7530,6490],[7630,6480],[7650,6638]],[[7640,6650],[7530,6620]]),
 rock('rv-refuge-mouth-ceiling',[[9160,8300],[9360,8260],[9530,8400]],[[9490,8660],[9340,8700],[9160,8620]]),
 rock('rv-east-upper-fire-bay',[[11280,4877.142857142857],[11550,4940],[11700,5030]],[[11700,5065],[11550,4975],[11280,4912.142857142857]],{oneWay:true}),
 // A short grounded stone arch carries the start of the living crossing.
 // It stops before the return root's ascent, retaining the real underpass.
 rock('rv-west-stone-arch',[[4500,6634],[4600,6700],[4900,6895],[5000,6960],[5050,6975]],[[5050,7130],[4870,7280],[4670,7430],[4450,7500]],{optional:false}),
 rock('rv-west-rock-crown',[[4550,4800],[5050,4570],[5650,4480],[6150,4640],[6500,4900]],[[6380,5480],[6000,5820],[5350,5710],[4800,5410]]),
 // The concave underside is one solid stone vault, with real head clearance
 // over the lower root road. Both tapered ends tie into traversable contacts.
 rock('rv-ritual-buttress',[[5400,7080],[6100,6860],[6600,6710],[6900,6770],[7600,6830],[8050,6760],[8400,6960],[9000,7260],[9500,7600]],[[9350,8360],[8870,8440],[8500,8100],[7850,7930],[7050,7870],[6400,8070],[5940,8350],[5660,8260]],{optional:false}),
 rock('rv-lower-west-shelf',[[4000,8900],[4600,8740],[5300,8800],[6100,8880],[6800,8850]],[[6800,10700],[6500,10700],[6100,9820],[5400,9510],[4700,9730],[4400,10020],[4250,10200],[4000,10200]],{optional:false}),
 rock('rv-lower-refuge-rock',[[6800,8850],[7600,8810],[8400,8790],[9200,8850],[9900,8830],[10800,8650],[11300,8600]],[[11300,10700],[10600,11000],[9700,11350],[8800,11200],[7900,11050],[7150,10800],[6800,10700]],{optional:false}),
 rock('rv-east-tower',[[9500,5314],[10000,4910],[10500,4830],[11100,4960],[11800,5260],[12200,5670]],[[11900,6230],[11200,6470],[10400,6260],[9740,5860]]),
 rock('rv-north-trace',[[11000,8630],[11900,8000],[12700,7150],[13500,6350],[14400,5610],[15300,5400],[16000,5480]],[[16000,10000],[15000,10800],[13700,11100],[12300,10600],[11100,9700]],{optional:false}),

 );
 ts.push(
 // Broad, few, different living structures. Their one-way status is the
 // shared open-branch policy, not a substitute for stone-wall collisions.
 branch('rv-west-main-root','west',[[4600,6700],[5000,6960],[5400,7080]],150),
 branch('rv-west-climbing-trunk','west',[[3200,6035],[3600,5750],[4050,5330],[4550,4800]],210),
 branch('rv-west-umbrella','west',[[1850,4680],[2700,4520],[3600,4400],[4350,4530],[4900,4639]],165),
 branch('rv-west-low-bough','west',[[2050,5810],[2750,5620],[3550,5802]],120),
 // A near-horizontal broken old trunk shortcuts the whole descent/re-ascent.
 branch('rv-saddle-canopy-crossing','saddle',[[6500,4760],[7100,4870],[7800,4960],[8300,4920],[8750,5090]],190),
 branch('rv-saddle-canopy-landing','saddle',[[8820,5150],[9300,5270],[9500,5314]],165),
 // A short root neck physically joins the ritual stone's right edge to
 // the fallen trunk. The original reflection face and walked routes stay exact.
 branch('rv-ritual-root-socket','saddle',[[7635,6638.977272727273],[7710,6618],[7790,6585],[7850,6556.428571428572]],60),
 branch('rv-saddle-fallen-trunk','saddle',[[6500,4900],[7000,5500],[7400,6010],[7800,6510],[8100,6788.571428571428]],200),
 branch('rv-saddle-swept-bough','saddle',[[5700,5870],[6450,5760],[7200,5755]],110),
 branch('rv-saddle-broken-arm','saddle',[[7270,5684.25],[7700,5490],[8220,5560]],105),
 // Left descent plus the right descent and lower shelf make an actual
 // repeatable circuit around the ritual vault, with an explicit fork jump.
 branch('rv-root-west-return','ravine',[[4000,8900],[4400,8380],[4800,7860],[5200,7340],[5400,7080]],150),
 branch('rv-root-east-descent','ravine',[[9500,7600],[9900,7920],[10400,8360],[11000,8630]],170),
 branch('rv-root-arch','ravine',[[7600,8680],[7950,8630],[8450,8540],[8950,8660],[9300,8847.142857142857]],180),
 branch('rv-east-rising-root','east',[[8350,6801.428571428572],[8900,6090],[9500,5314]],185),
 branch('rv-east-cliff-return','east',[[12200,5670],[12800,6000],[13400,6320]],170),
 branch('rv-east-windswept-bough','east',[[10550,4300],[11200,4370],[11800,4560],[12300,4830]],145),
 branch('rv-east-canopy-access','east',[[10500,4830],[11000,4370]],125),
 branch('rv-east-lower-arm','east',[[11500,6260],[12100,6120],[12600,6190]],110)
 );
 // Keep the walked line exact, but give old timber a heavy asymmetric belly,
 // shoulders and tapered split ends instead of a constant-width plank. Cap
 // the belly over any lower walking line: real bodies must fit in the opening.
 const authoredTops=ts.map(t=>({id:t.id,points:t.points.slice(0,t.properties.honroWalkEdges.length+1).map(p=>[p.x,p.y])}));
 for(const t of ts.filter(t=>t.oneWay&&t.baseMaterial==='wood')){
  const top=authoredTops.find(q=>q.id===t.id).points,start=top[0][0],end=top.at(-1)[0],width=end-start;
  const base=t.points[top.length].y-top.at(-1)[1],heavy=/trunk|crossing|climbing|root|return/.test(t.id);
  const fractions=[0,.025,.10,.28,.49,.68,.86,.97,1],xs=[...new Set([...fractions.map(f=>start+width*f),...top.map(p=>p[0])])].sort((a,b)=>b-a);
  const underside=xs.map(x=>{const f=(x-start)/width,y=heightOn(top,x),belly=Math.sin(Math.PI*f),shape=.9+.14*Math.sin(f*13+width*.001);
   let depth=base*(.13+(heavy?2.3:1.5)*belly)*shape;
   for(const q of authoredTops){if(q.id===t.id||x<q.points[0][0]||x>q.points.at(-1)[0])continue;const below=heightOn(q.points,x)-y;if(below>35)depth=Math.min(depth,Math.max(8,below-130));}
   return{x,y:y+Math.max(8,depth)};
  });
  t.points=[...top.map(([x,y])=>({x,y})),...underside];
 }
 const rockMasses=new Set(['rv-west-shoulder','rv-west-stone-arch','rv-west-rock-crown','rv-ritual-buttress','rv-lower-west-shelf','rv-lower-refuge-rock','rv-east-tower','rv-north-trace']);
 for(const t of ts)if(t.baseMaterial==='wood')insetRavineCorners(t,72);else if(rockMasses.has(t.id))insetRavineCorners(t,86);
 return ts;
}
export function applyStage11Ravine(project){
 const st=project.stages.find(s=>s.metadata?.stageId===11);if(!st)return project;
 const old=clone(st),ts=createRavineTerrains();st.width=16000;st.height=12000;st.terrains=ts;st.materials=[];
 delete st.terrainBounds;delete st.playBounds;delete st.terrainDomainVersion;
 st.initialState={...old.initialState,honroRavineVersion:RAVINE_VERSION,honroAct2GeometryRevision:6};
 const top=id=>{const t=ts.find(t=>t.id===id);if(!t)throw Error('Unknown ravine surface '+id);return t.points.slice(0,t.properties.honroWalkEdges.length+1).map(p=>[p.x,p.y]);};
 const surface=(id,x)=>({x,y:heightOn(top(id),x),surfaceId:id});
 const walk=(id,from,to)=>{const ps=top(id),siteXs={'rv-west-shoulder':[3600,3880],'rv-ritual-buttress':[7370],'rv-lower-refuge-rock':[9700,10350],'rv-north-trace':[15040]}[id]||[],xs=[...new Set([from,...[...ps.map(p=>p[0]),...siteXs].filter(x=>x>Math.min(from,to)&&x<Math.max(from,to)),to])].sort((a,b)=>from<=to?a-b:b-a);return xs.map(x=>surface(id,x));};
 const join=(...parts)=>parts.flat().filter((p,i,a)=>!i||p.x!==a[i-1].x||p.y!==a[i-1].y);
 const zones=[
 {id:'west-entry',name:'서측 능선 진입',box:[0,5750,2000,1700]},
 {id:'west-crown',name:'갈라진 서측 매듭 암반',box:[1800,5700,2900,2800]},
 {id:'west-canopy',name:'우산송과 높은 서측 암대',box:[1800,4050,4700,1750]},
 {id:'saddle-crossfire',name:'기울어진 고목 횡단 엄호길',box:[5450,4700,2800,1950]},
 {id:'ritual-court',name:'중간층 중앙 매듭 의식 선반',box:[5350,6600,4200,1950]},
 {id:'root-underpass',name:'의식 선반 아래 관통 회귀길',box:[3950,8050,4000,1800]},
 {id:'lower-refuge',name:'하부 암대 주민 피난처',box:[7950,8300,3400,1700]},
 {id:'ravine-canopy',name:'골짜기 뿌리 아치',box:[7400,7700,3400,1500]},
 {id:'east-overlook',name:'동측 고암반 교차 엄호자리',box:[9250,4050,4200,2550]},
 {id:'north-return',name:'북측 높은 흔적 능선',box:[11100,5250,4900,4900]}
 ];
 const roomFor=(x,y)=>{if(x<1800)return'west-entry';if(y<5800)return x<6500?'west-canopy':x<9250?'saddle-crossfire':'east-overlook';if(y>8050)return x<7900?'root-underpass':x<11100?'lower-refuge':'north-return';if(x<4700)return'west-crown';if(x<9600)return'ritual-court';return x<11100?'ravine-canopy':'north-return';};
 const a=surface,floor=x=>a('act2-floor',x);
 const nodes={spawn:floor(400),west:a('rv-west-shoulder',3600),westClear:a('rv-west-shoulder',3880),east:a('rv-ritual-buttress',7370),hold:a('rv-ritual-buttress',7370),resident:a('rv-lower-refuge-rock',9700),clear:a('rv-lower-refuge-rock',10350),trace:a('rv-north-trace',15040)};
 const markerNodes={'knot-west':'west','clear-west':'westClear','knot-east':'east','hold-knots':'hold',resident:'resident','clear-road':'clear',trace:'trace'};
 const space={version:1,geometryRevision:6,sharedSpaceId:null,topologyId:'stacked-ravine-stone-vaults',rooms:zones.map(z=>({id:z.id,terrainIds:ts.filter(t=>t.id==='act2-floor'||t.points.some(p=>p.x>=z.box[0]&&p.x<=z.box[0]+z.box[2]&&p.y>=z.box[1]&&p.y<=z.box[1]+z.box[3])).map(t=>t.id),ceilingIds:[],bounds:{x:z.box[0],y:z.box[1],w:z.box[2],h:z.box[3]},sky:'open',landmarkIds:[]})),surfaces:ts.map(t=>({id:t.id,terrainId:t.id,role:t.properties.honroSurfaceRole,edgeIndices:clone(t.properties.honroWalkEdges),roomIds:[roomFor(t.points[0].x,t.points[0].y)]})),connections:[],routes:[],sites:{},encounterSites:[],scenery:[],landmarks:[],lights:[],views:[]};
 // Exposed cover crests are part of the walked contour, never buried anchors.
 const westAcross=(from=1300,to=4600)=>walk('rv-west-shoulder',from,to);
 const ritualAcross=(from=5400,to=9500)=>walk('rv-ritual-buttress',from,to);
 const center=ritualAcross();
 const main=join(walk('act2-floor',400,1300),westAcross(),walk('rv-west-main-root',4600,5400),center,walk('rv-root-east-descent',9500,11000),[a('rv-north-trace',11200)],walk('rv-lower-refuge-rock',10800,9700),[nodes.resident],walk('rv-lower-refuge-rock',9700,11000),walk('rv-north-trace',11000,15040));
 // Explicit repeatable closed circuits: each contains two spatially different
 // branches between junctions and returns to the exact start support.
 const loops=[
 {id:'west-canopy-loop',from:'west-crown',to:'west-canopy',anchors:join([{...a('rv-west-shoulder',3200),jumpTo:{x:3240,support:'rv-west-climbing-trunk'}}],walk('rv-west-climbing-trunk',3240,4550),walk('rv-west-rock-crown',4550,6500),walk('rv-saddle-fallen-trunk',6500,8100),[a('rv-ritual-buttress',8300)],ritualAcross().filter(p=>p.x<=8100).concat([a('rv-ritual-buttress',8100)]).reverse(),walk('rv-west-main-root',5400,4600),walk('rv-west-shoulder',4600,3200))},
 {id:'root-return-loop',from:'ritual-court',to:'root-underpass',anchors:join(ritualAcross(5500),walk('rv-root-east-descent',9500,11000),[a('rv-north-trace',11200)],walk('rv-lower-refuge-rock',10800,6800),walk('rv-lower-west-shelf',6800,4000),[{...a('rv-lower-west-shelf',4030),jumpTo:{x:4080,support:'rv-root-west-return'}}],walk('rv-root-west-return',4080,5400),[a('rv-ritual-buttress',5500)])},
 {id:'east-overlook-loop',from:'ritual-court',to:'east-overlook',anchors:join([{...a('rv-ritual-buttress',8350),jumpTo:{x:8390,support:'rv-east-rising-root'}}],walk('rv-east-rising-root',8390,9500),walk('rv-east-tower',9500,12200),walk('rv-east-cliff-return',12200,13400),[a('rv-north-trace',13600)],walk('rv-north-trace',13400,11000),[{...a('rv-lower-refuge-rock',10800),jumpTo:{x:10760,support:'rv-root-east-descent'}}],walk('rv-root-east-descent',10760,9500),ritualAcross().filter(p=>p.x>=8350).concat([a('rv-ritual-buttress',8350)]).sort((a,b)=>b.x-a.x))},
 {id:'root-arch-loop',from:'lower-refuge',to:'ravine-canopy',anchors:join([{...a('rv-lower-refuge-rock',7600),jumpTo:{x:7640,support:'rv-root-arch'}}],walk('rv-root-arch',7640,9300),[a('rv-lower-refuge-rock',9440)],walk('rv-lower-refuge-rock',9200,7600))}
 ];
 space.routes.push({id:'main',kind:'required',defaultJump:true,anchors:main,requires:[]});
 for(const l of loops){space.routes.push({id:l.id,kind:'optional-jump',defaultJump:true,anchors:l.anchors,requires:[]});space.connections.push({id:l.id,from:l.from,to:l.to,kind:'optional-jump',routeId:l.id,entry:l.anchors[0],exit:l.anchors.at(-1),requires:[]});}
 const shortcut=join([{...a('rv-west-rock-crown',6460),jumpTo:{x:6520,support:'rv-saddle-canopy-crossing'}}],walk('rv-saddle-canopy-crossing',6520,8750).map((p,i,ps)=>i===ps.length-1?{...p,jumpTo:{x:8840,support:'rv-saddle-canopy-landing'}}:p),walk('rv-saddle-canopy-landing',8840,9500),[a('rv-east-tower',9650)]);
 space.routes.push({id:'fallen-trunk-shortcut',kind:'optional-jump',defaultJump:true,anchors:shortcut,requires:[]});
 space.connections.push({id:'fallen-trunk-shortcut',from:'west-canopy',to:'east-overlook',kind:'optional-jump',routeId:'fallen-trunk-shortcut',entry:shortcut[0],exit:shortcut.at(-1),requires:[]});
 const pocketRoutes=[
  {id:'ritual-reflection-pocket',room:'ritual-court',anchors:join([{...a('rv-ritual-buttress',6970),jumpTo:{x:7020,support:'rv-ritual-reflection-ledge'}}],walk('rv-ritual-reflection-ledge',7020,7420),walk('rv-ritual-reflection-ledge',7420,7000),[a('rv-ritual-buttress',6910)])},
  {id:'east-fire-pocket',room:'east-overlook',anchors:join([{...a('rv-east-tower',11250),jumpTo:{x:11310,support:'rv-east-upper-fire-bay'}}],walk('rv-east-upper-fire-bay',11310,11670),walk('rv-east-upper-fire-bay',11670,11280),[a('rv-east-tower',11210)])}
 ];
 for(const p of pocketRoutes){space.routes.push({id:p.id,kind:'optional-jump',defaultJump:true,anchors:p.anchors,requires:[]});space.connections.push({id:p.id,from:p.room,to:p.room,kind:'optional-jump',routeId:p.id,entry:p.anchors[0],exit:p.anchors.at(-1),requires:[]});}
 for(const [id,key]of Object.entries(markerNodes)){const p=nodes[key];space.sites[id]={objectiveId:id,roomId:roomFor(p.x,p.y),...p,standing:clone(p)};}
 st.routes=main.map(({x,y})=>({x,y}));st.anchors={spawn:clone(nodes.spawn),start:clone(nodes.spawn),exit:clone(nodes.trace),ritual:clone(nodes.hold),resident:clone(nodes.resident),northTrace:clone(nodes.trace)};
 st.markers=old.markers.map(m=>{const key=markerNodes[m.id];if(key)return{...m,x:nodes[key].x,y:nodes[key].y};if(m.type==='act2-wave')return{...m,x:10400,y:8360};return m;});st.elements=[];
 st.units=old.units.filter(u=>u.team!=='enemy').map(u=>{if(u.team==='player'){const p=floor(340+['archer','mage','knight','occultist'].indexOf(u.kind)*110);return{...u,x:p.x,y:p.y};}if(u.id.startsWith('resident-')){const p=a('rv-lower-refuge-rock',nodes.resident.x+45);return{...u,x:p.x,y:p.y};}return u;});
 const oldSpirit=old.units.find(u=>u.id.startsWith('resident-spirit'));if(oldSpirit)st.units.push({...oldSpirit,x:nodes.resident.x+115,y:surface('rv-lower-refuge-rock',nodes.resident.x+115).y-135});
 const trees=[{id:'west',x:3200,y:6165,height:2200,shape:'umbrella',mainTerrainId:'rv-west-climbing-trunk'},{id:'saddle',x:6500,y:4760,height:2200,shape:'fallen',mainTerrainId:'rv-saddle-canopy-crossing'},{id:'ravine',x:8450,y:8850,height:1800,shape:'root-arch',mainTerrainId:'rv-root-arch'},{id:'east',x:10500,y:4830,height:1200,shape:'cliff-pine',mainTerrainId:'rv-east-canopy-access'}];
 st.design={...old.design,space,ravine:{version:RAVINE_VERSION,contourRevision:1,world:[16000,12000],activityBounds:[340,4300,15450,8900],zones:clone(zones),rockTerrainIds:ts.filter(t=>!t.oneWay&&t.id!=='act2-floor').map(t=>t.id),trees:trees.map(t=>({...t,form:t.shape,branches:ts.filter(q=>q.properties.honroRavineTree===t.id).map(q=>({terrainId:q.id}))})),loops:loops.map(l=>({id:l.id,from:l.from,to:l.to})),objectiveSites:clone(nodes),crossSections:[{x:6000,surfaces:['rv-west-rock-crown','rv-ritual-buttress','rv-lower-west-shelf']},{x:8400,surfaces:['rv-east-rising-root','rv-ritual-buttress','rv-root-arch','rv-lower-refuge-rock']}],views:[{id:'ritual-section',x:7350,y:7150,zoom:.28},{id:'three-level-west',x:5650,y:6720,zoom:.24},{id:'east-ridge',x:11100,y:6550,zoom:.24}]}};
 st.design.ravine.tacticalPockets={
  reflection:{id:'ritual-reflection',ledgeId:'rv-ritual-reflection-ledge',wallId:'rv-ritual-reflection-wall',shooter:a('rv-ritual-reflection-ledge',7360),returnTarget:a('rv-ritual-reflection-ledge',7160),face:{x:7530,y:6550}},
  refugeMouth:{id:'refuge-mouth',ceilingId:'rv-refuge-mouth-ceiling',entrance:a('rv-lower-refuge-rock',9180),inside:a('rv-lower-refuge-rock',9320),shooter:a('rv-lower-refuge-rock',9750),minimumHeadroom:140},
  eastFire:{id:'east-high-low-fire',upper:a('rv-east-upper-fire-bay',11600),lower:a('rv-east-tower',11600),target:a('rv-east-tower',11780)}
 };
 for(const [id,key]of Object.entries(markerNodes))if(!id.startsWith('clear')){const p=nodes[key];st.elements.push({id:'rv-goal-'+id,assetId:'act2:ritual',x:p.x,y:p.y,scale:id==='hold-knots'?1:.7,rotation:0,snap:false,layer:'prop',depthLayer:'L1'});}
 st.environment=clone(old.environment);st.environment.skyVisible=true;st.meta={...old.meta,notes:'11장 전용 대규모 다층 산지 · 중간 의식 암대, 아래 주민 관통길, 양측 상부 엄호, 돌 아치와 서로 다른 고목, 실제 닫힌 순환 네 개. 기존 전투 저장은 원본 지형 유지.'};return project;
}
