(function(G){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),points=xs=>xs.map(([x,y])=>({x,y}));
const profiles=[
 [[0,1480],[650,1430],[1100,1540],[1650,1390],[2200,1300],[2850,1350],[3500,1120]],
 [[0,1780],[650,1640],[1250,1430],[1800,1280],[2150,1430],[2500,1220],[3100,1080],[3700,1040]],
 [[0,1120],[900,1180],[1400,1380],[1950,1700],[2500,1850],[3100,2200],[3600,2240]],
 [[0,2870],[1000,2860],[2200,2690],[2900,2450],[3400,2130],[3800,2140]],
 [[0,1700],[850,1740],[1450,1900],[2100,2020],[2450,2040],[2900,1930],[3400,1880]],
 [[0,2310],[600,2310],[1050,2130],[1550,2010],[2200,1890],[2800,1810],[3500,1830]],
 [[0,1700],[750,1800],[1200,2020],[1750,2150],[2400,2220],[3000,2340],[3600,2370]],
 [[0,1900],[750,1970],[1450,2350],[2100,2540],[2800,2540],[3350,2400],[4000,2120],[4600,2150]],
 [[0,1900],[750,1970],[1450,2350],[2100,2540],[2800,2540],[3350,2400],[4000,2120],[4600,2150]],
 [[0,1920],[600,1900],[1250,1710],[1850,1480],[2450,1260],[3200,1200],[3900,1160]]
];
const heights=[2200,2300,3000,3500,2700,3000,3100,3500,3500,2600];
const yAt=(route,x)=>{for(let i=1;i<route.length;i++)if(x<=route[i][0]){const a=route[i-1],b=route[i],t=(x-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*t;}return route.at(-1)[1];};
const upper=[[0,1040],[750,1060],[1450,1140],[2000,1320],[2600,1620],[3050,1910],[3180,1990]];
function solid(id,p,properties={},breakable=false,mat='rock'){return{id,name:id,type:'solid',points:points(p),baseMaterial:mat,breakable,oneWay:false,layer:'terrain',properties,detail:{spacing:18,roughness:0,seed:1,optimizeEpsilon:0}};}
function shape(p,fill,stroke='#15191b',lineWidth=2){return{points:points(p),fill,stroke,lineWidth};}
function assets(){const asset=(id,name,visual,heightM,category='architecture')=>({id:'act2:'+id,name,category,visual,collision:[],anchor:{x:0,y:0},sockets:[],tags:['act2'],params:{},reference:{heightM,bounds:G.HonroGeometry?bounds(visual):{x:-200,y:-200,w:400,h:200},foot:{x:0,y:0},scaleRange:[.4,4],backgroundRange:[.7,1.3]}});
 return[
 asset('cave-house','암반 위 돌집',[shape([[-150,0],[-143,-116],[122,-116],[147,0]],'#4b4a40'),shape([[18,0],[18,-111],[122,-116],[147,0]],'#353a35'),shape([[-170,-113],[-140,-142],[-55,-191],[80,-181],[160,-122],[131,-112]],'#292f31','#70766d'),shape([[-110,-92],[-67,-92],[-67,-31],[-110,-31]],'#d3a76b'),shape([[28,0],[28,-85],[75,-85],[75,0]],'#161f22')],3.5),
 asset('temple','잠운사 암벽 법당',[shape([[-235,0],[-227,-180],[227,-180],[240,0]],'#363d39'),shape([[-280,-175],[-236,-190],[-142,-240],[0,-264],[143,-242],[235,-190],[281,-175],[223,-172],[-225,-172]],'#202c30','#82857a'),shape([[-228,-171],[-215,-171],[-215,0],[-228,0]],'#827663'),shape([[210,-171],[224,-171],[224,0],[210,0]],'#827663'),shape([[-100,-145],[100,-145],[100,-7],[-100,-7]],'#a2916a'),shape([[-78,-120],[-12,-120],[-12,-16],[-78,-16]],'#394342'),shape([[12,-120],[78,-120],[78,-16],[12,-16]],'#394342'),shape([[-256,0],[256,0],[270,26],[-270,26]],'#687069')],5.2),
 asset('bell','묵종 · 보존해야 할 대종',[shape([[-350,0],[-322,-118],[-265,-610],[-201,-764],[-90,-824],[90,-824],[201,-764],[265,-610],[322,-118],[350,0]],'#575b4d','#959783',6),shape([[32,-814],[193,-758],[256,-605],[314,-105],[346,0],[129,0]],'#333d37',null,0),shape([[-290,-280],[288,-280],[296,-248],[-296,-248]],'#90927a',null,0),shape([[-326,-85],[326,-85],[346,0],[-349,0]],'#656d5c','#999b80',3),shape([[-78,-824],[-71,-883],[0,-921],[73,-881],[79,-824],[45,-824],[36,-863],[0,-880],[-35,-864],[-45,-824]],'#697562','#879181',4),shape([[-150,-590],[-95,-622],[-24,-566],[-70,-500],[-136,-514]],'#707960','#8c957c',3)],15.5,'prop'),
 asset('hoist-frame','멈춘 인양틀',[shape([[-155,0],[-126,-320],[-103,-320],[-127,0]],'#695b46'),shape([[129,0],[102,-320],[126,-320],[156,0]],'#443f35'),shape([[-175,-314],[176,-314],[171,-282],[-173,-282]],'#7a7058'),shape([[-114,-264],[120,-74],[115,-45],[-123,-243]],'#514c3d'),shape([[-35,-266],[35,-266],[51,-240],[36,-211],[-35,-211],[-48,-240]],'#3f4b48','#959982',3),shape([[-3,-220],[4,-220],[5,-40],[-4,-40]],'#aaa48e')],5.5),
 asset('lamp','동굴 등잔',[shape([[-13,0],[-10,-39],[10,-39],[13,0]],'#5c6254'),shape([[-20,-37],[-16,-67],[16,-67],[20,-37]],'#e1b66d','#9e8558'),shape([[-23,-68],[-9,-84],[9,-84],[24,-68]],'#39443f')],1.4,'prop'),
 asset('ritual','임시 그릇과 천도진',[shape([[-68,0],[-54,-22],[57,-22],[70,0]],'#76796b'),shape([[-35,-23],[-30,-59],[30,-59],[36,-23]],'#424f4b','#c2c8ab',2),shape([[-45,-59],[44,-59],[32,-71],[-31,-71]],'#b5b193'),shape([[-9,-74],[-5,-104],[4,-115],[11,-93],[9,-75]],'#cfb878',null,0)],2,'prop')
 ];
}
function bounds(visual){const ps=visual.flatMap(v=>v.points),xs=ps.map(p=>p.x),ys=ps.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);return{x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};}
// Each location is authored against a real supporting route; this includes the
// village's return journey beneath the upper terrace.
const objectiveXs=[
 [700,1400,2200,3060],[1550,2390,3510],[1160,1950,2360,3420],
 [1080,2750,1740,450],[810,1690,2580,3220],[880,1450,2310,3070],
 [730,1400,2360,2780,3330],[780,1630,2320,2800,3920],
 [970,1900,1410,2660,2030,3170,2650,3700],[1150,1600,3710]
];
const species=[['resonance','hound','echo','picks'],['minecart','bat','hound','resonance','picks'],['minecart','picks','bat','resonance','picks','minecart'],['picks','waterwheel','echo','picks','echo','minecart'],['waterwheel','picks','resonance','bat','echo'],['stoneLantern','monkVessel','picks','stoneLantern','resonance','echo'],['picks','hoist','picks','resonance','monkVessel','echo'],['stoneLantern','bellCluster','resonance','keeper','picks','echo','resonance'],['bellCluster','resonance','echo','echo'],['bat','minecart','resonance','picks']];
function build(project){const p=clone(project);p.stages=p.stages.filter(s=>s.metadata?.act!==2);p.library=p.library.filter(a=>!a.id.startsWith('act2:'));p.library.push(...assets());
 for(let i=0;i<10;i++){
  const id=11+i,d=G.HONRO_CONTENT.stages[id-1],route=profiles[i],width=route.at(-1)[0],height=heights[i],st=G.HonroMaps.emptyStage('stage-'+id,d.name,width,height),floor=x=>yAt(route,x),village=i===3;
  let ground=x=>village?yAt(upper,x):floor(x);
  Object.assign(st,{backdrop:d.theme,metadata:{stageId:id,act:2,actStage:i+1,campaign:true},design:{title:d.name,description:d.goal,act:2},routes:points(village?[...upper,[2900,2450],[1740,2755],[450,2865]]:route),anchors:{spawn:{x:260,y:ground(260)},exit:{x:width-190,y:floor(width-190)}},initialState:{honroAct2Revision:1,honroActiveLimit:d.active,honroState:{flags:{},collected:[],hold:0,lastRound:1,rescued:false,combatLog:[],act2:{version:1,done:{},events:{},rescued:[],checkpoints:[]}}}});
  st.terrains=[solid('act2-floor',[...route,[width,height+240],[0,height+240]],{route:true,surfaceKind:i<2?'soil':'cave'})];
  if(village)st.terrains.push(solid('village-upper',[...upper,...upper.slice().reverse().map(([x,y])=>[x,y+145])],{route:true,honroCave:true}));
  // Broad polygon masses have a noncolliding visual skirt supplied by the common renderer.
  if(i>=2&&i<=8){
   const underside=route.map(([x,y],j)=>[x,y-(i===4?265:i===7||i===8?1050:430+(j%3)*125)]);
   if(village){underside.length=0;underside.push([0,460],[950,610],[2000,760],[2900,1210],[3800,1470]);}
   if(i===2){underside[0][0]=1050;underside.splice(1,1);}
   if(i===4){ // Open vertical gun shaft at x=1650..1730 between two independent roof masses.
    st.terrains.push(solid('cave-roof-west',[[0,0],[1650,0],[1650,1510],[1200,1510],[700,1430],[0,1440]],{honroCeiling:true,honroCave:true}));
    st.terrains.push(solid('cave-roof-east',[[1730,0],[width,0],[width,1500],[2600,1660],[2100,1730],[1730,1580]],{honroCeiling:true,honroCave:true}));
    st.terrains.push(solid('shaft-cap',[[1650,620],[1730,620],[1730,760],[1650,760]],{honroCeiling:true,honroCave:true}));
   }else st.terrains.push(solid('cave-roof',[[underside[0][0],0],[width,0],...underside.slice().reverse()],{honroCeiling:true,honroCave:true}));
  }
  if(i===9)st.terrains.push(solid('exit-overhang',[[0,0],[1530,0],[1530,970],[1130,1410],[510,1520],[0,1500]],{honroCeiling:true,honroCave:true}));
  // Mid and lower rock shelves give firing choices, while every mandatory goal
  // remains reachable on the connected main route.
  if([2,5,6,7,8].includes(i)){
   const x=i>=7?3240:1800,y=floor(x)-170,crest=[[x-380,floor(x-380)],[x-150,y+25],[x+160,y-15],[x+420,y+95],[x+(i===2?820:590),floor(x+(i===2?820:590))]];
   // Merge the visible upper envelope into one solid: two overlapping lower
   // surfaces can occlude one another at their crossing in the common solver.
   const xs=[...new Set([...route,...crest].map(p=>p[0]))].sort((a,b)=>a-b),crossings=[];
   for(let j=1;j<xs.length;j++){const a=xs[j-1],b=xs[j];if(a<crest[0][0]||b>crest.at(-1)[0])continue;const da=floor(a)-yAt(crest,a),db=floor(b)-yAt(crest,b);if(da*db<0)crossings.push(a+(b-a)*da/(da-db));}
   ground=xx=>xx>=crest[0][0]&&xx<=crest.at(-1)[0]?Math.min(floor(xx),yAt(crest,xx)):floor(xx);
   const merged=[...xs,...crossings].sort((a,b)=>a-b).map(x=>[x,ground(x)]);
   st.terrains[0]=solid('act2-floor',[...merged,[width,height+240],[0,height+240]],{route:true,surfaceKind:'cave',honroCave:true});
  }
  const elem=(assetId,x,y,scale=1,idSuffix='',layer='back')=>st.elements.push({id:`a2-${id}-${idSuffix||st.elements.length}`,assetId,x,y,scale,rotation:0,snap:false,layer,depthLayer:'L1'});
  if(i<2){for(const x of [140,520,1140,1940,2720])elem(i===0?'ancient_pine':'dead_pine',x,floor(x),i===0?1:.7);for(const x of [940,1680,2820])elem('rock_large',x,floor(x),1);}
  if(village){for(const [x,y] of [[330,ground(330)],[1380,ground(1380)],[2400,ground(2400)],[540,floor(540)],[1570,floor(1570)],[2660,floor(2660)]])elem('act2:cave-house',x,y,.9);}
  if(i===5){elem('act2:temple',2040,ground(2040),1.5);elem('act2:temple',3000,floor(3000),.8);}
  if([2,4,6].includes(i))for(const x of [550,2160,3000])elem('act2:hoist-frame',x,floor(x),.75);
  if([7,8].includes(i)){elem('act2:bell',2520,floor(2520),1);elem('act2:hoist-frame',1870,floor(1870),1.25);elem('act2:hoist-frame',3070,floor(3070),1.25);}
  for(const x of [380,1000,1550,2210,2870,width-220]){const y=ground(x);if(i>=2)elem('act2:lamp',x,y,.8);st.markers.push({id:'light-'+x,type:'act2-light',x,y,color:[4,7,8].includes(i)?'#a9bec1':'#deb075'});}
  if([3,4,8].includes(i)){const x1=i===3?520:900,x2=i===3?1580:1400,waterY=Math.min(floor(x1),floor(x2))-(i===4?155:35);st.materials.push({id:'underground-river',kind:'water-pool',terrainId:'act2-floor',conductive:true,attached:true,surface:[[x1,waterY],[x2,waterY]],bottom:[[x1,floor(x1)],[x2,floor(x2)]],points:[[x1,waterY],[x2,waterY],[x2,floor(x2)],[x1,floor(x1)]]});}
  st.units=['archer','mage','knight','occultist'].map((cls,j)=>G.HonroUnits.record(cls,'p-'+cls,220+j*90,ground(220+j*90),'player'));
  for(const [j,kind] of species[i].entries()){
   const x=900+j*(width-1350)/Math.max(1,species[i].length-1),flying=G.HonroWorld.archetypes[kind]?.flying,y=(village&&j>2?floor(x):ground(x))-(flying?150:0),uid=kind==='keeper'?'act2-keeper':kind==='hoist'?'act2-hoist':'a2-enemy-'+j;
   const u={...G.HonroUnits.record(kind,uid,x,y,'enemy'),spawnIndex:j,behavior:j<2?'aggressive':'patrol'};
   if(kind==='hoist')u.miniboss=true;
   st.units.push(u);
  }
  for(const [j,s] of d.steps.entries()){
   const x=objectiveXs[i][j],y=village&&j>=2?floor(x):ground(x),m={id:s.id,type:'act2',x,y,label:s.label,action:'act2',...(s.requiredClass?{requiredClass:s.requiredClass}:{})};
   if(s.kind==='destroy'){
    delete m.action;const ty=i===4?850:s.id==='upper-chain'?y-380:y-155;
    st.terrains.push(solid(s.id,[[x-20,ty],[x+20,ty],[x+22,ty+70],[x-22,ty+70]],{hp:65,maxHp:65,honroSeal:true,honroAct2Target:true,honroRockfall:['rock-pin','collapse-pin','exit-pin'].includes(s.id)},true,'wood'));m.x=x;m.y=ty+25;
   }else if(s.kind==='defeat'){delete m.action;const u=st.units.find(u=>u.id===s.target);Object.assign(u,{x,y});}
   else if(['reach','escort'].includes(s.kind)){delete m.action;m.type='exit';}
   else elem('act2:ritual',x,y,.6,'goal-'+j,'prop');
   if(s.kind==='rescue'){
    const uid='resident-'+j,spiritId='resident-spirit-'+j;
    st.units.push({...G.HonroUnits.record('object:civilian',uid,x+50,y,'npc'),label:i===5?' 잠운사 승려':'동굴 주민',stageOverrides:{hp:900,maxHp:900,h:92,r:22,honroProtected:true,honroCivilian:true,fixed:true}});
    st.units.push({...G.HonroUnits.record(i===5?'monkVessel':'resonance',spiritId,x+115,y-130,'enemy'),spawnIndex:20+j});m.target=uid;m.spiritId=spiritId;
   }
   // Different namespaces keep terrain, marker and unit IDs unique in the schema.
   if(s.kind==='destroy')m.id='marker-'+s.id;
   st.markers.push(m);
  }
  // A spare, reusable lantern is always available; using it costs the actor's
  // action, so a depleted item inventory cannot make spirit combat unwinnable.
  const lx=i>=7?1150:580;st.markers.push({id:'spirit-lamp',type:'act2',action:'act2',label:'원혼등불 · 혼령 현형',x:lx,y:ground(lx)});elem('act2:lamp',lx,ground(lx),1.15,'party-lamp','prop');
  st.markers.push({id:'wave',type:'act2-wave',x:width-430,y:floor(width-430)});
  if(i===6)st.markers.push({id:'rebuild-brace',type:'act2',action:'act2',label:'낙석 치우기',x:1590,y:ground(1590),collected:true});
  if([3,5,8,9].includes(i)){
   const x=i===9?1400:i===8?1120:620,y=ground(x);
   st.units.push({...G.HonroUnits.record('object:civilian','objective',x,y,'npc'),label:i===9?'생존자 행렬':'피난 주민',stageOverrides:{honroProtected:true,honroCivilian:true,hp:1800,maxHp:1800,r:25,h:92,fixed:i!==9,walkSpeed:270,moveLeft:900,maxMove:900}});
  }
  // A removable obstruction opens the route without inventing new collision code.
  if(i===2){const x=2490,y=floor(x);st.terrains.push(solid('gate-gate',[[x-10,y-210],[x+15,y-210],[x+15,y],[x-10,y]],{hp:99999,maxHp:99999,honroCave:true}));}
  if(i===1){
   const pit=[...route.filter(p=>p[0]<=1800),[1840,floor(1840)+300],[2110,floor(2110)+300],...route.filter(p=>p[0]>=2150)];
   st.terrains[0].properties.honroRestoredVertices=points([...route,[width,height+240],[0,height+240]]);
   st.terrains[0].points=points([...pit,[width,height+240],[0,height+240]]);
  }
  const barrier=(id,x,y,h,broken=false)=>st.terrains.push(solid(id,[[x-18,y-h],[x+18,y-h],[x+18,y],[x-18,y]],{hp:99999,maxHp:99999,honroCave:true,broken}));
  if(i===3)barrier('gate-bridge',310,floor(310),190);
  if(i===6){barrier('gate-repair',2940,ground(2940),240);barrier('gate-debris',1750,ground(1750),225,true);}
  if(i===9)barrier('gate-exit',1380,ground(1380),250);
  const env=G.HonroEnvironment.makeEnvironment(st,{preset:i>=2&&i<=8?'enclosed':i===0?'forest':'valley'});
  env.atmosphere={preset:i>=2&&i<=8?'enclosed':i===0?'forest':'valley',overrides:i>=2&&i<=8?{skyTop:'#05090e',skyBottom:i===3?'#15191b':i===4?'#101c23':'#10161b',ambientTint:'#252a2d',lightStrength:i===7?.04:.10,mistStrength:.16,hazeStrength:.35,farFogColor:'#24323c',nearFogColor:'#35464b'}:{}};
  env.skyVisible=i<2||i===9;st.environment=env;
  // Avoid a high-contrast mountain plane inside the cave, but keep the shared
  // L2/L3 support and world-locked parallax model.
  st.meta={notes:`2-${i+1} ${d.name} · ${d.goal}`,seed:2110+i};p.stages.push(st);
 }
 return p;
}
G.HonroAct2Design={build,profiles,heights,yAt};
})(globalThis);
