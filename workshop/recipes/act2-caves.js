(function(G){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),points=xs=>xs.map(([x,y])=>({x,y}));
const profiles=[
 [[0,3500],[700,3460],[1500,3210],[2250,2940],[3000,3040],[3800,2720],[4550,2500],[5200,2610],[5950,2360],[6600,2040],[7250,1830],[7800,1790]],
 [[0,4220],[800,3970],[1500,3700],[2200,3420],[2900,3200],[3700,3330],[4450,3100],[5200,2820],[6000,2520],[6650,2300],[7350,2180],[8400,2140]],
 [[0,2920],[650,2920],[1400,3150],[2200,3400],[3000,3470],[3750,3730],[4500,3890],[5200,4160],[5900,4450],[6750,4700],[7500,4850],[8200,4860]],
 [[0,6550],[1000,6510],[2100,6350],[3000,6320],[3900,6120],[4750,5860],[5500,5600],[6200,5320],[6900,5050],[7700,4800],[8600,4780]],
 [[0,3690],[650,3670],[1450,3810],[2300,4050],[3000,4140],[3650,4280],[4200,4280],[4800,4140],[5500,4020],[6100,4140],[6800,4000],[7450,3840],[8000,3800]],
 [[0,5100],[700,5090],[1450,4880],[2250,4570],[3000,4370],[3700,4300],[4500,4000],[5300,3790],[6100,3620],[6850,3430],[7450,3480],[8200,3450]],
 [[0,3400],[650,3400],[1400,3690],[2200,3900],[3000,4140],[3800,4390],[4550,4580],[5300,4610],[6100,4900],[6800,5180],[7550,5250],[8400,5210]],
 [[0,3840],[800,3840],[1700,4150],[2600,4480],[3400,4650],[4200,4880],[5100,5190],[6000,5220],[6900,5220],[7700,5100],[8500,4820],[9250,4550],[10400,4530]],
 [[0,3840],[800,3840],[1700,4150],[2600,4480],[3400,4650],[4200,4880],[5100,5190],[6000,5220],[6900,5220],[7700,5100],[8500,4820],[9250,4550],[10400,4530]],
 [[0,4480],[800,4420],[1550,4170],[2300,3970],[3100,3680],[3950,3390],[4800,3070],[5500,2790],[6250,2570],[7000,2380],[7750,2180],[8350,2020],[9000,2000]]
];
const heights=[4800,5200,6600,7600,6000,6600,6800,7600,7600,5800];
const yAt=(route,x)=>{if(x<=route[0][0])return route[0][1];for(let i=1;i<route.length;i++)if(x<=route[i][0]){const a=route[i-1],b=route[i],t=(x-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*t;}return route.at(-1)[1];};
const upper=[[0,2010],[700,2000],[1450,2190],[2150,2380],[2900,2600],[3650,2720],[4350,2990],[5100,3260],[5800,3500],[6450,3760],[7100,4030],[7750,4350],[8240,4680]];
// Small weathered lips join deliberately placed terraces. They are not a
// uniform scaling of the old silhouettes.
function contour(route,seed=0,roof=false){const out=[route[0]];for(let i=1;i<route.length;i++){
 const a=route[i-1],b=route[i],n=Math.max(2,Math.ceil((b[0]-a[0])/145));
 for(let j=1;j<n;j++){const f=j/n,offset=roof?Math.sin((i*5+j+seed)*1.7)*38:a[1]===b[1]?0:Math.sin((i*3+j+seed)*1.9)*Math.min(5,(b[0]-a[0])/n*.04);
 out.push([Math.round(a[0]+(b[0]-a[0])*f),Math.round(a[1]+(b[1]-a[1])*f+offset)]);}out.push(b);
}return out;}
function plotsOn(route,plots){const xs=[...new Set([...route.map(p=>p[0]),...plots.flatMap(p=>[p.x-p.reach,p.x-p.half,p.x,p.x+p.half,p.x+p.reach])])].filter(x=>x>=route[0][0]&&x<=route.at(-1)[0]).sort((a,b)=>a-b);
 return xs.map(x=>{let y=yAt(route,x);for(const p of plots){const d=Math.abs(x-p.x),f=d<=p.half?1:d>=p.reach?0:(p.reach-d)/(p.reach-p.half);y=y*(1-f)+yAt(route,p.x)*f;}return[x,Math.round(y)];});}
function solid(id,p,properties={},breakable=false,mat='rock'){return{id,name:id,type:'solid',points:points(p),baseMaterial:mat,breakable,oneWay:false,layer:'terrain',properties,detail:{spacing:18,roughness:0,seed:1,optimizeEpsilon:0}};}
function shape(p,fill,stroke='#15191b',lineWidth=2){return{points:points(p),fill,stroke,lineWidth};}
function assets(){const asset=(id,name,visual,heightM,category='architecture')=>({id:'act2:'+id,name,category,visual,collision:[],anchor:{x:0,y:0},sockets:[],tags:['act2'],params:{},reference:{heightM,bounds:G.HonroGeometry?bounds(visual):{x:-200,y:-200,w:400,h:200},foot:{x:0,y:0},scaleRange:[.4,4],backgroundRange:[.7,1.3]}});
 const list=[
 asset('cave-house','암반 위 돌집',[shape([[-150,0],[-143,-116],[122,-116],[147,0]],'#4b4a40'),shape([[18,0],[18,-111],[122,-116],[147,0]],'#353a35'),shape([[-170,-113],[-140,-142],[-55,-191],[80,-181],[160,-122],[131,-112]],'#292f31','#70766d'),shape([[-110,-92],[-67,-92],[-67,-31],[-110,-31]],'#d3a76b'),shape([[28,0],[28,-85],[75,-85],[75,0]],'#161f22')],3.5),
 asset('temple','잠운사 암벽 법당',[shape([[-235,0],[-227,-180],[227,-180],[240,0]],'#363d39'),shape([[-280,-175],[-236,-190],[-142,-240],[0,-264],[143,-242],[235,-190],[281,-175],[223,-172],[-225,-172]],'#202c30','#82857a'),shape([[-228,-171],[-215,-171],[-215,0],[-228,0]],'#827663'),shape([[210,-171],[224,-171],[224,0],[210,0]],'#827663'),shape([[-100,-145],[100,-145],[100,-7],[-100,-7]],'#a2916a'),shape([[-78,-120],[-12,-120],[-12,-16],[-78,-16]],'#394342'),shape([[12,-120],[78,-120],[78,-16],[12,-16]],'#394342'),shape([[-256,0],[256,0],[270,26],[-270,26]],'#687069')],5.2),
 asset('bell','묵종 · 보존해야 할 대종',[shape([[-350,0],[-322,-118],[-265,-610],[-201,-764],[-90,-824],[90,-824],[201,-764],[265,-610],[322,-118],[350,0]],'#575b4d','#959783',6),shape([[32,-814],[193,-758],[256,-605],[314,-105],[346,0],[129,0]],'#333d37',null,0),shape([[-290,-280],[288,-280],[296,-248],[-296,-248]],'#90927a',null,0),shape([[-326,-85],[326,-85],[346,0],[-349,0]],'#656d5c','#999b80',3),shape([[-78,-824],[-71,-883],[0,-921],[73,-881],[79,-824],[45,-824],[36,-863],[0,-880],[-35,-864],[-45,-824]],'#697562','#879181',4),shape([[-150,-590],[-95,-622],[-24,-566],[-70,-500],[-136,-514]],'#707960','#8c957c',3)],15.5,'prop'),
 asset('hoist-frame','멈춘 인양틀',[shape([[-155,0],[-126,-320],[-103,-320],[-127,0]],'#695b46'),shape([[129,0],[102,-320],[126,-320],[156,0]],'#443f35'),shape([[-175,-314],[176,-314],[171,-282],[-173,-282]],'#7a7058'),shape([[-114,-264],[120,-74],[115,-45],[-123,-243]],'#514c3d'),shape([[-35,-266],[35,-266],[51,-240],[36,-211],[-35,-211],[-48,-240]],'#3f4b48','#959982',3),shape([[-3,-220],[4,-220],[5,-40],[-4,-40]],'#aaa48e')],5.5),
 asset('lamp','동굴 등잔',[shape([[-13,0],[-10,-39],[10,-39],[13,0]],'#5c6254'),shape([[-20,-37],[-16,-67],[16,-67],[20,-37]],'#e1b66d','#9e8558'),shape([[-23,-68],[-9,-84],[9,-84],[24,-68]],'#39443f')],1.4,'prop'),
 asset('ritual','임시 그릇과 천도진',[shape([[-68,0],[-54,-22],[57,-22],[70,0]],'#76796b'),shape([[-35,-23],[-30,-59],[30,-59],[36,-23]],'#424f4b','#c2c8ab',2),shape([[-45,-59],[44,-59],[32,-71],[-31,-71]],'#b5b193'),shape([[-9,-74],[-5,-104],[4,-115],[11,-93],[9,-75]],'#cfb878',null,0)],2,'prop')
 ];
 // Joinery, roof courses, lattices and stone foundations are editable geometry.
 for(const id of ['cave-house','temple']){
  const house=list.find(a=>a.id==='act2:'+id),large=id==='temple',w=large?225:140,roof=large?-182:-118;
  house.visual.push(shape([[-w-7,0],[w+7,0],[w+18,18],[-w-18,18]],'#646e67','#293a3b',2));
  for(const x of [-w*.76,-w*.25,w*.25,w*.76]){
   house.visual.push(shape([[x,roof+8],[x+8,roof+8],[x+8,0],[x,0]],'#81775e','#3d483f',1));
   if(!large)house.visual.push(shape([[x-18,-87],[x+16,-87],[x+16,-38],[x-18,-38]],'#a99369','#263a3b',3));
  }
  for(let j=0;j<5;j++){const y=roof-12-j*10,k=1-j*.11;house.visual.push(shape([[-w*k,y],[w*k,y],[w*k-7,y+3],[-w*k+7,y+3]],j%2?'#697168':'#485550',null,0));}
  for(let j=0;j<4;j++){const x=-w+16+j*w*.48;house.visual.push(shape([[x,2],[x+w*.43,2],[x+w*.44,13],[x-3,13]],'#818779','#46544e',1));}
 }
 const prop=(id,name,visual,height)=>list.push(asset(id,name,visual,height,'prop'));
 prop('timber-rack','채석장의 목재 받침과 밧줄',[
  shape([[-88,0],[-69,-142],[-52,-142],[-66,0]],'#6d6653'),shape([[70,0],[53,-142],[70,-142],[91,0]],'#4e5147'),
  shape([[-105,-143],[104,-143],[103,-126],[-107,-126]],'#8e8166'),shape([[-61,-100],[68,-32],[61,-13],[-66,-85]],'#625e4c'),
  shape([[-72,-57],[79,-57],[76,-44],[-72,-44]],'#ada182'),shape([[-11,-127],[-6,-127],[-2,-56],[-8,-53]],'#c0b494')],2.8);
 prop('mine-rail','끊긴 수레 궤도와 침목',[
  ...[-130,-65,0,65,130].map(x=>shape([[x-16,0],[x+15,-6],[x+35,26],[x+3,30]],'#74684e','#303c39',2)),
  shape([[-171,-8],[161,-8],[174,-1],[-162,-1]],'#a0aaa0','#394e50',2),
  shape([[-154,14],[174,14],[182,20],[-147,20]],'#788b85','#344a4d',2)],.65);
 prop('water-trough','암수로와 나무 물통',[
  shape([[-105,0],[-104,-77],[80,-77],[108,0]],'#616e66'),
  shape([[-116,-76],[83,-76],[107,-62],[-94,-62]],'#99a18a'),
  shape([[-89,-58],[80,-58],[94,-11],[-81,-11]],'#243b42'),
  shape([[-80,-43],[82,-43],[89,-28],[-76,-28]],'#567b80','#8ca9a0',1),
  shape([[83,-73],[106,-60],[125,-26],[113,-20]],'#82896f')],1.4);
 prop('memorial','이름을 적은 위패와 제물',[
  shape([[-80,0],[-75,-23],[75,-23],[80,0]],'#797966'),
  ...[-43,0,43].map((x,i)=>shape([[x-13,-25],[x-13,-104-i%2*19],[x,-118-i%2*19],[x+13,-104-i%2*19],[x+13,-25]],'#7b6548','#baaa7b',2)),
  ...[-43,0,43].map(x=>shape([[x-3,-94],[x+3,-94],[x+3,-49],[x-3,-49]],'#c0b28e',null,0))],2.2);
 prop('bundles','피난민의 보따리와 짚신',[
  shape([[-68,0],[-72,-32],[-42,-64],[-13,-48],[0,0]],'#7b6b59'),
  shape([[2,0],[4,-48],[31,-77],[61,-56],[78,-7]],'#666f68'),
  shape([[-45,-56],[-32,-47],[-20,-12],[-27,-7]],'#b1a182',null,0),
  shape([[27,-65],[41,-65],[61,-10],[48,-7]],'#a6a385',null,0),
  shape([[-84,5],[-91,-8],[-72,-14],[-50,-6],[-56,5]],'#ac9870')],1.5);
 prop('rock-column','공동의 침식 암주',[
  shape([[-150,0],[-116,-145],[-85,-324],[-110,-478],[-64,-703],[6,-755],[90,-665],[61,-425],[104,-247],[151,-35]],'#3b4c4e','#263b40',3),
  shape([[-64,-696],[6,-735],[32,-520],[-10,-318],[22,-159],[-25,-5],[-92,-7],[-54,-300]],'#77817a',null,0),
  shape([[50,-660],[69,-592],[39,-414],[85,-217],[112,-37],[41,-19],[13,-206],[24,-385]],'#233b40',null,0),
  shape([[-84,-452],[41,-481],[62,-458],[-87,-424]],'#9a9c7c45',null,0)],10);
 prop('hanging-cloth','매듭을 남긴 빨랫줄',[
  shape([[-140,-137],[141,-123],[141,-119],[-140,-133]],'#a99875',null,0),
  shape([[-105,-134],[-52,-130],[-50,-52],[-70,-39],[-107,-53]],'#9a9982'),
  shape([[-16,-128],[48,-125],[39,-66],[18,-53],[-20,-61]],'#6b7772'),
  shape([[85,-123],[120,-121],[125,-77],[106,-68],[83,-78]],'#8c7970')],2.4);
 prop('stone-table','승려의 기록상과 펼친 장부',[
  shape([[-82,0],[-72,-57],[-55,-57],[-61,0]],'#655e49'),
  shape([[59,0],[54,-57],[72,-57],[85,0]],'#484e42'),
  shape([[-96,-66],[92,-66],[103,-51],[-97,-49]],'#8c7c5d'),
  shape([[-41,-71],[-5,-82],[29,-77],[56,-65],[7,-60]],'#c8bc95','#655b48',1),
  shape([[-4,-80],[0,-80],[16,-61],[11,-60]],'#726e58',null,0)],1.4);
 const bell=list.find(a=>a.id==='act2:bell');
 // Raised lotus panels, bronze studs and the strike band identify the bell at
 // room scale. Every form remains editable in the common vector workshop.
 for(const x of [-177,133]){
  bell.visual.push(shape([[x-62,-676],[x+55,-676],[x+68,-494],[x-77,-494]],'#5f6955','#a0a68a',4));
  bell.visual.push(shape([[x-44,-654],[x+37,-654],[x+47,-515],[x-55,-515]],'#3c5146','#7a8d70',2));
  for(let row=0;row<3;row++)for(let col=0;col<3;col++){
   const cx=x-27+col*28,cy=-628+row*40;
   bell.visual.push(shape([[cx-9,cy],[cx-5,cy-10],[cx+3,cy-13],[cx+10,cy-4],[cx+9,cy+5],[cx,cy+10]],'#a1a385','#51664f',1.5));
  }
 }
 for(const [y,w] of [[-730,205],[-424,282],[-140,319]]){
  bell.visual.push(shape([[-w,y],[w,y],[w+4,y+19],[-w-4,y+19]],'#8b9276','#526951',2));
  for(let x=-w+24;x<w-12;x+=46)bell.visual.push(shape([[x-16,y+15],[x-6,y-1],[x+1,y+6],[x+11,y-2],[x+19,y+15]],'#4c6656',null,0));
 }
 bell.visual.push(shape([[-43,-445],[-7,-471],[20,-451],[44,-469],[76,-429],[49,-379],[68,-324],[25,-341],[-12,-319],[-1,-375],[-44,-383]],'#818f70','#a7ae8b',2));
 bell.visual.push(shape([[-261,-92],[-212,-110],[-207,-41],[-269,-37]],'#30483f',null,0));
 bell.visual.push(shape([[151,-100],[223,-95],[249,-27],[166,-18]],'#31453b',null,0));
 const column=list.find(a=>a.id==='act2:rock-column');
 column.visual=[
 shape([[-150,0],[-120,-84],[-123,-155],[-93,-214],[-91,-292],[-70,-335],[-103,-405],[-110,-478],[-91,-516],[-87,-599],[-65,-634],[-64,-703],[-28,-727],[6,-755],[30,-728],[65,-705],[90,-665],[80,-617],[66,-595],[67,-507],[49,-462],[61,-425],[72,-371],[72,-313],[104,-247],[107,-174],[135,-112],[151,-35]],'#394d50','#263b40',3),
 shape([[-64,-696],[-18,-714],[6,-735],[20,-658],[9,-594],[32,-520],[4,-458],[8,-385],[-10,-318],[9,-255],[22,-159],[-3,-96],[-25,-5],[-92,-7],[-77,-139],[-71,-226],[-54,-300],[-66,-370],[-62,-429],[-83,-491]],'#73817b',null,0),
 shape([[50,-660],[69,-592],[48,-541],[39,-414],[58,-363],[57,-307],[85,-217],[85,-138],[112,-37],[41,-19],[29,-123],[13,-206],[25,-283],[24,-385],[36,-436],[29,-502]],'#233b40',null,0),
 shape([[-84,-452],[-31,-469],[11,-470],[41,-481],[62,-458],[21,-447],[-25,-448],[-87,-424]],'#9a9c7c35',null,0),
 shape([[-81,-249],[-28,-256],[11,-241],[43,-253],[60,-235],[11,-226],[-29,-238],[-89,-229]],'#152e3840',null,0)];
 for(const a of list)a.reference.bounds=bounds(a.visual);
 return list;
}
function bounds(visual){const ps=visual.flatMap(v=>v.points),xs=ps.map(p=>p.x),ys=ps.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);return{x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};}
const species=[
 ['resonance','hound','picks','echo','boar'],['minecart','picks','hound','bat','resonance'],
 ['minecart','picks','bat','resonance'],['picks','waterwheel','echo','minecart'],
 ['waterwheel','picks','resonance','bat'],['stoneLantern','monkVessel','picks','resonance'],
 ['picks','minecart','resonance','monkVessel'],['stoneLantern','bellCluster','picks','resonance'],
 ['bellCluster','resonance','echo'],['bat','minecart','resonance','picks']
];
function build(project){const p=clone(project);p.stages=p.stages.filter(s=>s.metadata?.act!==2);p.library=p.library.filter(a=>!a.id.startsWith('act2:'));p.library.push(...assets());
 // These bank stones decorate the already-authored rock contour. Reusing the
 // old boulder's collision here buried both support faces at their intersection.
 const bank=clone(p.library.find(a=>a.id==='rock_large'));bank.id='act2:rock-bank';bank.name='암반 가장자리의 돌무더기';bank.collision=[];bank.tags=[...(bank.tags||[]),'act2'];p.library.push(bank);
 for(let i=0;i<10;i++){
 const id=11+i,d=G.HONRO_CONTENT.stages[id-1],plan=G.HonroAct2Plan.forStage(id),[width,height]=plan.size,village=i===3,cave=i>=2&&i<=8;
 const plots=i===5?[{x:4550,half:480,reach:1050},{x:6750,half:310,reach:750}]:village?Array.from({length:10},(_,j)=>({x:650+j*740,half:175,reach:355})):[];
 const route=contour(plotsOn(profiles[i],plots),i),terrace=village?contour(plotsOn(upper,Array.from({length:7},(_,j)=>({x:550+j*940,half:200,reach:425}))),3):null,floor=x=>yAt(route,x),ground=x=>village?yAt(terrace,x):floor(x);
 const st=G.HonroMaps.emptyStage('stage-'+id,d.name,width,height);
 const pos=spec=>({x:spec[0],y:spec[1]==='lower'?floor(spec[0]):ground(spec[0])});
 const sites=Object.fromEntries(Object.entries(plan.sites).map(([key,value])=>[key,pos(value)]));
 const end=sites.escape||sites.exit||sites[Object.keys(sites).at(-1)];
 const portals=cave?[{side:'left',top:ground(0)-360,bottom:ground(0)},{side:'right',top:floor(width)-380,bottom:floor(width)}]:[];
 Object.assign(st,{backdrop:d.theme,metadata:{stageId:id,act:2,actStage:i+1,campaign:true},
 design:{title:d.name,description:d.goal,act:2,revision:2,targetRounds:plan.rounds,expectedMinutes:plan.expectedMinutes},
 routes:points(village?[...terrace,...route.filter(p=>p[0]<8240).reverse()]:route),
 anchors:{spawn:{x:320,y:ground(320)},exit:end},
 initialState:{honroAct2Revision:2,honroActiveLimit:plan.active,honroAct2Steps:clone(d.steps),
 honroCaveEnvelope:cave?{version:1,portals}:null,
 honroState:{flags:{},collected:[],hold:0,lastRound:1,rescued:false,combatLog:[],act2:{version:2,done:{},events:{},rescued:[],checkpoints:[],holds:{}}}}});
 st.terrains=[solid('act2-floor',[...route,[width,height+240],[0,height+240]],{route:true,surfaceKind:i<2?'soil':'cave',honroCave:cave})];
 if(village)st.terrains.push(solid('village-upper',[...terrace,...terrace.slice().reverse().map(([x,y],j)=>[x,y+Math.min(170+(j%4)*11,floor(x)-y-18)])],{route:true,honroCave:true}));
 let roof=[];
 if(cave){
   roof=contour((village?upper:profiles[i]).map(([x,y],j)=>[x,y-(i===7||i===8?1700:i===3?1050:i===4?510:620+(j%3)*145)]),i,true);
   if(village)roof.push([width,ground(width)-1050]);
   // The vault narrows into the tunnel mouths continuously. There is no
   // vertical cut from the top of the play rectangle down to an open sky.
   for(const p of roof){const reach=1100;if(p[0]<reach){const f=p[0]/reach;p[1]=Math.round((ground(0)-360)*(1-f)+p[1]*f);}else if(p[0]>width-reach){const f=(width-p[0])/reach;p[1]=Math.round((floor(width)-380)*(1-f)+p[1]*f);}}
   const roofY=x=>yAt(roof,x);
   if(i===4){
    const sx=sites['shaft-pin'].x;
    st.terrains.push(solid('cave-roof-west',[[0,0],[sx-60,0],[sx-60,roofY(sx-60)],...roof.filter(p=>p[0]<sx-60).reverse()],{honroCeiling:true,honroCave:true}));
    st.terrains.push(solid('cave-roof-east',[[sx+60,0],[width,0],...roof.filter(p=>p[0]>sx+60).reverse(),[sx+60,roofY(sx+60)]],{honroCeiling:true,honroCave:true}));
    st.terrains.push(solid('shaft-cap',[[sx-60,0],[sx+60,0],[sx+60,roofY(sx)-650],[sx-60,roofY(sx)-650]],{honroCeiling:true,honroCave:true}));
   }else st.terrains.push(solid('cave-roof',[[0,0],[width,0],...roof.slice().reverse()],{honroCeiling:true,honroCave:true}));
   // Actual cave side walls leave exactly the authored entrance and exit.
   if(village)st.terrains.push(solid('cave-wall-left',[[0,ground(0)+175],[155,ground(155)+195],[135,3000],[245,3640],[190,4340],[260,5300],[125,6100],[120,floor(120)+40],[0,floor(0)+40]],{honroCave:true,honroSideWall:true}));
 }
 if(i===9)st.terrains.push(solid('exit-overhang',[[0,0],[3760,0],[3760,ground(3760)-920],[3210,ground(3210)-550],[2400,ground(2400)-530],[1550,ground(1550)-660],[700,ground(700)-620],[0,ground(0)-640]],{honroCeiling:true,honroCave:true}));
 const elem=(assetId,x,y,scale=1,key='',layer='back')=>st.elements.push({id:'a2-'+id+'-'+(key||st.elements.length),assetId,x,y,scale,rotation:0,snap:false,layer,depthLayer:'L1'});
 // Combat galleries provide alternate firing angles and clear undersides.
 for(const [j,x] of [1250,3150,5450,width-1450].entries()){
  const y=ground(x)-135;
  const deck=[[x-210,ground(x-210)-8],[x-75,y],[x+170,y],[x+300,ground(x+300)-8]];
  if(i!==4)st.terrains.push({...solid('firing-gallery-'+j,[...deck,...deck.slice().reverse().map(([x,y])=>[x,y+18])],{route:true},true,'wood'),oneWay:true});
 }
 // Oil lamps provide light, not spirit manifestation.
 for(let x=420,j=0;x<width-180;x+=470,j++){
  const y=ground(x);
  if(i<2||i===9&&x>3800){elem(j%3===0?'ancient_pine':'dead_pine',x,y,.72+(j%3)*.16);if(j%2===0)elem('act2:rock-bank',x+130,ground(x+130),.7);}
  else{
   if([2,4,6].includes(i)&&j%3===0)elem('act2:hoist-frame',x,y,.7+(j%2)*.2);
   if(i===3&&j%2===0)elem('act2:cave-house',x+130,ground(x+130),.85+(j%3)*.16);
   if(i===5&&j%4===0)elem('act2:temple',x+180,ground(x+180),.75);
   elem('act2:rock-bank',x-100,ground(x-100),.5+(j%3)*.16);
  }
  if(j%2===0){elem('act2:lamp',x,y,.8);st.markers.push({id:'light-'+j,type:'act2-light',x,y,color:'#d6b686'});}
 }
 for(let x=780,j=0;x<width-350;x+=650,j++){
  const y=ground(x),kind=i<2?'bundles':i===3?(j%2?'hanging-cloth':'bundles'):i===5?(j%2?'memorial':'stone-table'):i>=7&&i<=8?(j%2?'memorial':'bundles'):j%2?'timber-rack':'mine-rail';
  elem('act2:'+kind,x,y,.7+(j%3)*.12);
  if(cave&&j%3===1){elem('act2:rock-column',x+180,ground(x+180),.9);if([3,4,5].includes(i))elem('act2:water-trough',x-135,ground(x-135),.7);}
 }
 if(village)for(let x=650;x<7900;x+=740){elem('act2:cave-house',x,floor(x),.9+(x%3)*.05);elem('act2:lamp',x+190,floor(x+190),.7);}
 if(i===5){elem('act2:temple',4550,ground(4550),1.65);elem('act2:temple',6750,ground(6750),1.05);}
 if([7,8].includes(i)){elem('act2:bell',6240,floor(6240),1.4);for(const x of [5320,7390])elem('act2:hoist-frame',x,floor(x),1.4);}
 if([3,4,8].includes(i)){
  const x1=i===3?3100:i===4?1900:5720,x2=x1+(i===4?1700:1350),xs=route.filter(p=>p[0]>x1&&p[0]<x2).map(p=>p[0]),bed=[x1,...xs,x2].map(x=>[x,floor(x)]),waterY=Math.min(...bed.map(p=>p[1]))-(i===4?190:40);
  st.materials.push({id:'underground-river',kind:'water-pool',terrainId:'act2-floor',conductive:true,attached:true,surface:[[x1,waterY],[x2,waterY]],bottom:bed,points:[[x1,waterY],[x2,waterY],...bed.slice().reverse()]});
 }
 st.units=['archer','mage','knight','occultist'].map((cls,j)=>G.HonroUnits.record(cls,'p-'+cls,300+j*95,ground(300+j*95),'player'));
 for(let j=0;j<plan.initial;j++){
  let kind=species[i][j%species[i].length];if(i===6&&j===Math.floor(plan.initial*.55))kind='hoist';if(i===7&&j===plan.initial-4)kind='keeper';
  const cohort=j<Math.ceil(plan.initial/3)?'west':j<Math.ceil(plan.initial*2/3)?'middle':'east';
  let x=1150+j*(width-1780)/(plan.initial-1),y=village&&cohort==='east'?floor(x):ground(x);
  if(kind==='keeper'){x=sites.keeper.x;y=sites.keeper.y;}if(kind==='hoist'){x=sites.hoist.x;y=sites.hoist.y;}
  const flying=G.HonroWorld.archetypes[kind]?.flying,elite=j%plan.eliteEvery===plan.eliteEvery-1,uid=kind==='keeper'?'act2-keeper':kind==='hoist'?'act2-hoist':'a2-enemy-'+j;
  st.units.push({...G.HonroUnits.record(kind,uid,x,y-(flying?150:0),'enemy'),spawnIndex:j,behavior:'patrol',stageOverrides:{honroCohort:cohort,honroAct2Elite:elite,honroAct2Revision:2}});
 }
 for(const [j,s] of d.steps.entries()){
  const {x,y}=sites[s.id],m={id:s.id,type:'act2',x,y,label:s.label,action:'act2',...(s.requiredClass?{requiredClass:s.requiredClass}:{})};
  if(s.kind==='destroy'){
   delete m.action;const ty=i===4?yAt(roof,x)-550:s.id==='upper-chain'?y-410:y-160;
   st.terrains.push(solid(s.id,[[x-24,ty],[x+24,ty],[x+25,ty+76],[x-25,ty+76]],{hp:100,maxHp:100,honroSeal:true,honroAct2Target:true,honroRockfall:['rock-pin','collapse-pin','exit-pin'].includes(s.id)},true,'wood'));m.id='marker-'+s.id;m.y=ty+38;
  }else if(['defeat','clear','hold','reach','escort'].includes(s.kind)){delete m.action;if(['reach','escort'].includes(s.kind))m.type='exit';}
  else elem('act2:ritual',x,y,.7,'goal-'+j,'prop');
  if(s.kind==='hold'){
   elem('act2:ritual',x,y,1,'defense-'+j,'prop');
   st.markers.push({id:'wave-'+s.id,type:'act2-wave',x:Math.min(width-250,x+740),y:(village&&plan.sites[s.id][1]==='lower'?floor:ground)(Math.min(width-250,x+740))});
  }
  if(s.kind==='rescue'){
   const uid='resident-'+j,spiritId='resident-spirit-'+j;
   st.units.push({...G.HonroUnits.record('object:civilian',uid,x+45,y,'npc'),label:i===5?'잠운사 승려':'동굴 주민',stageOverrides:{hp:950,maxHp:950,h:92,r:22,honroProtected:true,honroCivilian:true,fixed:true}});
   st.units.push({...G.HonroUnits.record(i===5?'monkVessel':'resonance',spiritId,x+115,y-135,'enemy'),spawnIndex:60+j,stageOverrides:{honroCohort:'resident',honroAct2Revision:2}});m.target=uid;m.spiritId=spiritId;
  }
  st.markers.push(m);
 }
 for(const [j,x] of plan.lamps.entries()){st.markers.push({id:'spirit-lamp-'+j,type:'act2',action:'act2',label:'원혼등불 · 주변 혼령 현형',x,y:ground(x),radius:1200});elem('act2:lamp',x,ground(x),1.4,'spirit-lamp-'+j,'prop');}
 st.markers.push({id:'wave',type:'act2-wave',x:width-650,y:floor(width-650)});
 if(i===6)st.markers.push({id:'rebuild-brace',type:'act2',action:'act2',label:'낙석 치우기',x:3500,y:ground(3500),collected:true});
 if([3,5,8,9].includes(i)){
  const x=i===9?3080:i===8?1750:950,y=ground(x);
  st.units.push({...G.HonroUnits.record('object:civilian','objective',x,y,'npc'),label:i===9?'생존자 행렬':'피난 주민',stageOverrides:{honroProtected:true,honroCivilian:true,hp:1900,maxHp:1900,r:25,h:92,fixed:i!==9,walkSpeed:240,moveLeft:850,maxMove:850}});
 }
 const barrier=(key,x,y,h,broken=false)=>st.terrains.push(solid(key,[[x-25,y-h],[x+25,y-h],[x+25,y],[x-25,y]],{hp:99999,maxHp:99999,honroCave:true,broken}));
 if(i===2)barrier('gate-gate',4510,ground(4510),350);
 if(i===3)barrier('gate-bridge',1650,floor(1650),220);
 if(i===6){barrier('gate-repair',5740,ground(5740),285);barrier('gate-debris',3500,ground(3500),230,true);}
 if(i===9)barrier('gate-exit',2940,ground(2940),300);
 if(i===1){
  const x1=3320,x2=3540,original=clone(st.terrains[0].points),pit=route.map(([x,y])=>[x,y]);
  pit.push([x1,floor(x1)],[x1+30,floor(x1)+270],[x2-30,floor(x2)+270],[x2,floor(x2)]);
  st.terrains[0].properties.honroRestoredVertices=original;
  st.terrains[0].points=points([...pit.filter(([x])=>x<=x1||x>=x2||x===x1+30||x===x2-30).sort((a,b)=>a[0]-b[0]),[width,height+240],[0,height+240]]);
 }
 const env=G.HonroEnvironment.makeEnvironment(st,{preset:cave?'enclosed':i===0?'forest':'valley'});
 if(cave)for(const group of env.groups.filter(g=>g.depthLayer==='L2')){
  const support=env.surfaces.find(s=>s.groupId===group.id);if(!support)continue;
  for(let x=500,j=0;x<width;x+=1450,j++)env.placements.push({id:'rear-'+group.id+'-'+j,assetId:i===3?'act2:cave-house':i===5?'act2:temple':j%2?'act2:rock-column':'act2:memorial',depthLayer:'L2',groupId:group.id,supportId:support.id,x,y:0,scale:i===3?1.05:i===5?.9:1.1,rotation:0});
 }
 env.atmosphere={preset:cave?'enclosed':i===0?'forest':'valley',overrides:cave?{skyTop:'#172328',skyBottom:'#233237',ambientTint:'#364346',lightStrength:.10,mistStrength:.11,hazeStrength:.24,farFogColor:'#26393d',nearFogColor:'#304447'}:{}};
 env.skyVisible=!cave;st.environment=env;
 st.meta={notes:'2-'+(i+1)+' '+d.name+' · 개편 2 · '+plan.rounds.join('–')+'턴 설계',seed:2210+i};p.stages.push(st);
 }
 return p;
}
G.HonroAct2Design={build,profiles,heights,yAt};
})(globalThis);
