(function(G){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),points=xs=>xs.map(([x,y])=>({x,y}));
const profiles=[
 [[0,3500],[650,3410],[1270,3470],[1870,3170],[2460,3250],[3030,2910],[3570,3030],[4240,2640],[4800,2770],[5480,2350],[6110,2440],[6810,2050],[7390,2110],[7800,1880]],
 [[0,4220],[630,4080],[1120,4150],[1700,3790],[2260,3880],[2810,3480],[3330,3590],[3880,3250],[4500,3370],[5150,3020],[5730,3150],[6350,2770],[6960,2870],[7520,2670],[8070,2860],[8400,2920]],
 [[0,2920],[800,2990],[1500,3150],[2200,3410],[2800,3620],[3400,3720],[3900,3700],[4500,3940],[5200,4140],[5800,4400],[6450,4670],[7100,4810],[7650,4910],[8200,5000]],
 [[0,6550],[870,6490],[1590,6600],[2320,6310],[2890,6400],[3620,6050],[4220,6130],[4990,5690],[5620,5800],[6320,5400],[7010,5510],[7730,5190],[8240,4940],[8600,4780]],
 [[0,3690],[700,3680],[1450,3850],[2200,4050],[2700,4160],[3800,4270],[4500,4110],[5200,4020],[6100,4060],[6800,3910],[7400,3850],[8000,3800]],
 [[0,5100],[720,4960],[1510,5070],[2110,4690],[2740,4800],[3390,4390],[4030,4490],[4700,4100],[5330,4190],[6010,3790],[6710,3640],[7370,3540],[8200,3450]],
 [[0,3400],[700,3400],[1500,3690],[2200,3900],[3000,4140],[3800,4390],[4550,4580],[5300,4700],[6100,4920],[6800,5190],[7600,5300],[8400,5210]],
 [[0,3840],[800,3840],[1700,4140],[2600,4450],[3400,4680],[4200,4870],[5100,5200],[6000,5300],[6900,5220],[7700,5100],[8500,4820],[9250,4560],[10400,4530]],
 [[0,3870],[800,3870],[1700,4140],[2600,4460],[3400,4680],[4200,4850],[5100,5180],[6000,5210],[6800,5290],[7600,5050],[8500,4840],[9400,4550],[10400,4510]],
 [[0,4480],[750,4380],[1480,4460],[2130,4090],[2780,4180],[3450,3710],[4070,3800],[4730,3290],[5380,3390],[5970,2940],[6650,3000],[7260,2540],[7930,2630],[8530,2190],[9000,2000]]
];
const heights=[4800,5200,6600,7600,6000,6600,6800,7600,7600,5800];
const yAt=(route,x)=>{if(x<=route[0][0])return route[0][1];for(let i=1;i<route.length;i++)if(x<=route[i][0]){const a=route[i-1],b=route[i],t=(x-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*t;}return route.at(-1)[1];};
const upper=[[0,2010],[700,2000],[1450,2190],[2150,2380],[2900,2600],[3650,2720],[4350,2990],[5100,3260],[5800,3500],[6450,3760],[7100,4030],[7750,4350],[8000,4519]];
// The plan's X coordinates are narrative progress, not necessarily world X.
// A carved switchback makes the party cross a chamber three times at distinct
// heights. Each bench ends above the next one; the bottom is the foundation.
const foldedStages=new Set([2,4,6,7,8]);
function switchback(profile,width,height,index){
 const start=profile[0][1],finish=Math.min(height-850,Math.max(profile.at(-1)[1],start+1450));
 const bend=width-740,returnEnd=620;
 const topAnchors=[[0,start],[width*.12,start+195],[width*.25,start-235],[width*.39,start+245],[width*.53,start-130],[width*.66,start+305],[width*.80,start-75],[bend,start+260]];
 const midY=start+(finish-start)*.53;
 const midAnchors=[[returnEnd,midY+110],[width*.18,midY-180],[width*.32,midY+235],[width*.47,midY-155],[width*.62,midY+195],[width*.77,midY-145],[width-380,midY+100]];
 const bottomAnchors=[[0,finish+50],[width*.12,finish-145],[width*.24,finish+215],[width*.39,finish-190],[width*.52,finish+230],[width*.66,finish-125],[width*.79,finish+180],[width*.90,finish-95],[width,finish]];
 const top=contour(topAnchors,index+21),mid=contour(midAnchors,index+32),bottom=contour(bottomAnchors,index+43);
 const midStart=width-380,lowStart=350,span=width/3;
 const at=progress=>{const p=Math.max(0,Math.min(width,progress));
  if(p<=span){const x=bend*p/span;return{x,y:yAt(top,x),level:'upper'};}
  if(p<=span*2){const x=midStart-(midStart-returnEnd)*(p-span)/span;return{x,y:yAt(mid,x),level:'middle'};}
  const x=lowStart+(width-lowStart)*(p-span*2)/span;return{x,y:yAt(bottom,x),level:'lower'};
 };
 const travel=[...top,[width-400,yAt(mid,width-400)],...mid.slice().reverse(),[lowStart,yAt(bottom,lowStart)],...bottom.filter(p=>p[0]>=lowStart)];
 return{top,mid,bottom,at,travel,roofBase:top.slice()};
}
// Curved strata follow broad authored landforms. A sign change flattens the
// tangent at a ridge or basin, avoiding the sawtooth facets of linear joins.
function contour(route,seed=0,roof=false){
 const slope=(a,b)=>(route[b][1]-route[a][1])/(route[b][0]-route[a][0]);
 const tangent=i=>{if(i===0)return slope(0,1);if(i===route.length-1)return slope(i-1,i);
  const a=slope(i-1,i),b=slope(i,i+1);return a*b<=0?0:2*a*b/(a+b);};
 const out=[route[0]];
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],dx=b[0]-a[0],n=Math.max(2,Math.ceil(dx/90)),m0=tangent(i-1),m1=tangent(i);
  for(let j=1;j<n;j++){
   const f=j/n,f2=f*f,f3=f2*f,x=a[0]+dx*f;
   const y=(2*f3-3*f2+1)*a[1]+(f3-2*f2+f)*dx*m0+(-2*f3+3*f2)*b[1]+(f3-f2)*dx*m1;
   const grain=Math.sin(Math.PI*f)*Math.sin(x/185+seed*.7)*(roof?9:2);
   out.push([Math.round(x),Math.round(y+grain)]);
  }
  out.push(b);
 }
 return out;
}
function plotsOn(route,plots){const xs=[...new Set([...route.map(p=>p[0]),...plots.flatMap(p=>[p.x-p.reach,p.x-p.half,p.x,p.x+p.half,p.x+p.reach])])].filter(x=>x>=route[0][0]&&x<=route.at(-1)[0]).sort((a,b)=>a-b);
 return xs.map(x=>{let y=yAt(route,x);for(const p of plots){const d=Math.abs(x-p.x),f=d<=p.half?1:d>=p.reach?0:(p.reach-d)/(p.reach-p.half);y=y*(1-f)+yAt(route,p.x)*f;}return[x,Math.round(y)];});}
// The wet edge is the exact meeting point of water and the carved bank.
function carveBasin(route,left,right,variant){
 const level=Math.round(Math.max(yAt(route,left),yAt(route,right))+25);
 const shapes={
  3:[[150,0],[330,105],[530,210],[-400,100],[-230,0]],
  4:[[130,0],[295,100],[490,235],[-500,110],[-320,0]],
  8:[[115,0],[250,95],[430,210],[-420,95],[-300,0]]
 };
 const nodes=shapes[variant],wetLeft=left+nodes[0][0],wetRight=right+nodes.at(-1)[0];
 const bank=contour([[left,Math.round(yAt(route,left))],...nodes.map(([dx,depth])=>[dx>=0?left+dx:right+dx,level+depth]),[right,Math.round(yAt(route,right))]],variant);
 const shaped=[...route.filter(p=>p[0]<left),...bank,...route.filter(p=>p[0]>right)];
 return{route:shaped,level,bottom:bank.filter(p=>p[0]>=wetLeft&&p[0]<=wetRight)};
}
function solid(id,p,properties={},breakable=false,mat='rock'){return{id,name:id,type:'solid',points:points(p),baseMaterial:mat,breakable,oneWay:false,layer:'terrain',properties,detail:{spacing:18,roughness:0,seed:1,optimizeEpsilon:0}};}
function caveBench(key,top,index,next){
 const left=top[0][0],right=top.at(-1)[0],upper=key==='upper';
 const underside=top.slice().reverse().map(([x,y])=>{
  const lobe=(center,reach,height)=>height*Math.exp(-Math.pow((x-center)/reach,2));
  let depth=165+35*Math.sin(x/740+index)+lobe(left+(right-left)*.30,620,165)+lobe(left+(right-left)*.71,850,215);
  if(x>=next[0][0]&&x<=next.at(-1)[0])depth=Math.min(depth,Math.max(4,yAt(next,x)-y-360));
  const fadeRight=Math.min(1,Math.max(0,(right-x)/420));
  const fadeLeft=upper?1:Math.min(1,Math.max(0,(x-left)/340));
  return[x,Math.round(y+Math.max(4,depth*fadeRight*fadeLeft))];
 });
 return solid('switchback-'+key,[...top,...underside],{route:true,honroCave:true,honroBench:key});
}
function shape(p,fill,stroke='#15191b',lineWidth=2){return{points:points(p),fill,stroke,lineWidth};}
function assets(){const asset=(id,name,visual,heightM,category='architecture')=>({id:'act2:'+id,name,category,visual,collision:[],anchor:{x:0,y:0},sockets:[],tags:['act2'],params:{},reference:{heightM,bounds:G.HonroGeometry?bounds(visual):{x:-200,y:-200,w:400,h:200},foot:{x:0,y:0},scaleRange:[.4,4],backgroundRange:[.7,1.3]}});
 const list=[
 asset('cave-house','암반 위 돌집',[shape([[-150,0],[-143,-116],[122,-116],[147,0]],'#4b4a40'),shape([[18,0],[18,-111],[122,-116],[147,0]],'#353a35'),shape([[-170,-113],[-140,-142],[-55,-191],[80,-181],[160,-122],[131,-112]],'#292f31','#70766d'),shape([[-110,-92],[-67,-92],[-67,-31],[-110,-31]],'#d3a76b'),shape([[28,0],[28,-85],[75,-85],[75,0]],'#161f22')],3.5),
 asset('cave-house-lean','암벽에 기댄 살림집',[
  shape([[-163,0],[-153,-108],[99,-108],[129,0]],'#55584d','#293a3a'),
  shape([[44,0],[44,-108],[99,-108],[129,0]],'#343e3b',null,0),
  shape([[-183,-106],[-104,-164],[70,-148],[151,-94],[139,-84],[-170,-88]],'#263437','#77817a',3),
  shape([[-105,-150],[66,-137],[127,-99],[80,-108],[-94,-137]],'#4c5b57',null,0),
  shape([[-128,-96],[-116,-96],[-116,0],[-128,0]],'#998768',null,0),
  shape([[101,-90],[112,-90],[123,0],[107,0]],'#796f59',null,0),
  shape([[-81,-87],[-22,-87],[-22,-32],[-81,-32]],'#cba76d','#3b4843',3),
  shape([[28,0],[28,-83],[76,-83],[76,0]],'#1a292b','#7c7961',2),
  shape([[-170,0],[136,0],[151,16],[-180,16]],'#67746d')],3.2),
 asset('cave-house-ruin','무너진 지붕의 옛 돌집',[
  shape([[-148,0],[-140,-114],[-71,-114],[-40,-90],[58,-108],[126,-96],[140,0]],'#555950','#28393a'),
  shape([[49,0],[58,-108],[126,-96],[140,0]],'#374441',null,0),
  shape([[-169,-108],[-107,-168],[-17,-151],[23,-116],[-18,-106],[-101,-142],[-158,-92]],'#283437','#727e76',3),
  shape([[9,-119],[69,-147],[144,-99],[127,-83],[63,-119]],'#394945','#7c8277',2),
  shape([[-105,-105],[-91,-105],[-91,0],[-105,0]],'#8f8066',null,0),
  shape([[79,-103],[93,-103],[111,0],[95,0]],'#8f8066',null,0),
  shape([[-66,-78],[-21,-78],[-21,-25],[-66,-25]],'#d0ae77','#394844',3),
  shape([[20,0],[20,-77],[65,-77],[65,0]],'#172528','#8a8265',2),
  shape([[-167,0],[-136,-32],[-102,-14],[-70,0]],'#71796c','#344240',2),
  shape([[-175,0],[145,0],[156,16],[-185,16]],'#66746c')],3.3),
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
  shape([[-150,0],[-116,-145],[-85,-324],[-110,-478],[-64,-703],[6,-755],[90,-665],[61,-425],[104,-247],[151,-35]],'#424449','#292b30',3),
  shape([[-64,-696],[6,-735],[32,-520],[-10,-318],[22,-159],[-25,-5],[-92,-7],[-54,-300]],'#73757a',null,0),
  shape([[50,-660],[69,-592],[39,-414],[85,-217],[112,-37],[41,-19],[13,-206],[24,-385]],'#292b30',null,0),
  shape([[-84,-452],[41,-481],[62,-458],[-87,-424]],'#a1a3a845',null,0)],10);
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
 prop('old-soul-stone','오래된 혼의 암석 표식',[
  shape([[-151,0],[-142,-248],[-118,-484],[-77,-604],[9,-642],[94,-588],[133,-422],[153,-20]],'#404c4b','#7b8980',5),
  shape([[16,-627],[94,-588],[133,-422],[153,-20],[70,-17],[47,-321]],'#263a3b',null,0),
  shape([[-117,-203],[119,-203],[129,-167],[-126,-167]],'#66736c','#304443',2),
  shape([[-86,-464],[-51,-475],[-44,-287],[-78,-270]],'#263a39','#819087',2),
  shape([[-12,-515],[22,-505],[11,-296],[-17,-302]],'#293d3c','#819087',2),
  shape([[56,-447],[83,-427],[69,-298],[43,-314]],'#263a39','#819087',2),
  shape([[-168,0],[-129,-47],[-98,-27],[-58,-15],[43,-25],[82,-5],[147,-36],[181,0]],'#626d65','#344545',3)],8.5);
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
 shape([[-150,0],[-120,-84],[-123,-155],[-93,-214],[-91,-292],[-70,-335],[-103,-405],[-110,-478],[-91,-516],[-87,-599],[-65,-634],[-64,-703],[-28,-727],[6,-755],[30,-728],[65,-705],[90,-665],[80,-617],[66,-595],[67,-507],[49,-462],[61,-425],[72,-371],[72,-313],[104,-247],[107,-174],[135,-112],[151,-35]],'#424449','#292b30',3),
 shape([[-64,-696],[-18,-714],[6,-735],[20,-658],[9,-594],[32,-520],[4,-458],[8,-385],[-10,-318],[9,-255],[22,-159],[-3,-96],[-25,-5],[-92,-7],[-77,-139],[-71,-226],[-54,-300],[-66,-370],[-62,-429],[-83,-491]],'#73757a',null,0),
 shape([[50,-660],[69,-592],[48,-541],[39,-414],[58,-363],[57,-307],[85,-217],[85,-138],[112,-37],[41,-19],[29,-123],[13,-206],[25,-283],[24,-385],[36,-436],[29,-502]],'#292b30',null,0),
 shape([[-84,-452],[-31,-469],[11,-470],[41,-481],[62,-458],[21,-447],[-25,-448],[-87,-424]],'#a1a3a835',null,0),
 shape([[-81,-249],[-28,-256],[11,-241],[43,-253],[60,-235],[11,-226],[-29,-238],[-89,-229]],'#18191d40',null,0)];
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
 const plots=i===5?[{x:4550,half:480,reach:1050},{x:6750,half:310,reach:700}]:village?Array.from({length:10},(_,j)=>({x:650+j*740,half:175,reach:355})):[];
 const basinBounds={3:[3200,4300],4:[5250,6450],8:[5450,6650]};
 const folded=foldedStages.has(i)?switchback(profiles[i],width,height,i):null;
 const baseRoute=folded?folded.bottom:contour(plotsOn(profiles[i],plots),i),upperBasin=i===4&&folded,
  basin=basinBounds[i]?carveBasin(upperBasin?folded.top:baseRoute,...basinBounds[i],i):null;
 if(upperBasin)folded.top.splice(0,folded.top.length,...basin.route);
  const route=upperBasin?baseRoute:basin?.route||baseRoute,terrace=village?contour(plotsOn(upper,Array.from({length:7},(_,j)=>({x:550+j*940,half:200,reach:425}))),3):null,floor=x=>yAt(route,x),ground=x=>village?yAt(terrace,x):folded?yAt(folded.top,Math.min(x,width-740)):floor(x);
  // The temple is approached by a rising gallery, then the party doubles back
  // under it to retrieve the record before climbing toward the rear court.
  const templeUpper=i===5?contour([2050,2450,2850,3300,3750,4300,4900,5500,5950].map((x,j)=>[x,Math.round(floor(x)-[5,65,145,245,350,470,470,465,460][j])]),50):null;
  const templeTravel=templeUpper?[...route.filter(p=>p[0]<2050),...templeUpper,[6200,floor(6200)],...route.filter(p=>p[0]>=3900&&p[0]<=6200).reverse(),...route.filter(p=>p[0]>=3900)]:null;
 if(folded)folded.travel=[...folded.top,[width-400,yAt(folded.mid,width-400)],...folded.mid.slice().reverse(),[350,floor(350)],...route.filter(([x])=>x>=350)];
 const middle=village?[[5200,floor(5200)],[5480,floor(5480)-220],[5930,floor(5930)-430],[6480,floor(6480)-460],[7020,floor(7020)-340],[7590,floor(7590)-230],[8170,floor(8170)-75],[8350,floor(8350)]]:null;
 const st=G.HonroMaps.emptyStage('stage-'+id,d.name,width,height);
 const pos=spec=>folded?folded.at(spec[0]):({x:spec[0],y:spec[1]==='lower'?floor(spec[0]):ground(spec[0])});
  const sites=Object.fromEntries(Object.entries(plan.sites).map(([key,value])=>[key,pos(value)]));
  if(templeUpper){sites.hall={x:5200,y:yAt(templeUpper,5200)};sites['hold-hall']={x:5400,y:yAt(templeUpper,5400)};sites.record={x:3900,y:floor(3900)};}
 if(i===4&&folded)sites['shaft-pin']={x:width-510,y:yAt(folded.mid,width-510)};
 const end=sites.escape||sites.exit||sites[Object.keys(sites).at(-1)];
 const portals=cave?[{side:'left',top:ground(0)-1050,bottom:ground(0)},{side:'right',top:floor(width)-1350,bottom:floor(width)}]:[];
 Object.assign(st,{backdrop:d.theme,metadata:{stageId:id,act:2,actStage:i+1,campaign:true},
 design:{title:d.name,description:d.goal,act:2,revision:2,targetRounds:plan.rounds,expectedMinutes:plan.expectedMinutes},
 // Step beyond the upper ledge before turning back along the lower village.
 // Without this waypoint the route doubles back on top and never descends.
  routes:points(village?[...terrace,[8350,floor(8350)],...middle.slice().reverse(),...route.filter(p=>p[0]<5200).reverse()]:folded?folded.travel:templeTravel||route),
 anchors:{spawn:folded?folded.at(110):{x:320,y:ground(320)},exit:end},
 initialState:{honroAct2Revision:2,honroActiveLimit:plan.active,honroAct2Steps:clone(d.steps),
 honroCaveEnvelope:cave?{version:1,portals}:null,
 honroState:{flags:{},collected:[],hold:0,lastRound:1,rescued:false,combatLog:[],act2:{version:2,done:{},events:{},rescued:[],checkpoints:[],holds:{}}}}});
 st.terrains=[solid('act2-floor',[...route,[width,height+240],[0,height+240]],{route:true,surfaceKind:i===0?'soil':i===1?'rock':'cave',honroCave:cave})];
  if(folded)for(const [key,top,next] of [['upper',folded.top,folded.mid],['middle',folded.mid,route]])st.terrains.push(caveBench(key,top,i,next));
  if(templeUpper)st.terrains.push(caveBench('temple-gallery',templeUpper,i,route));
 if(village)st.terrains.push(solid('village-upper',[...terrace,...terrace.slice().reverse().map(([x,y])=>[x,y+Math.max(40,Math.min(130,(floor(x)-y)*.33))])],{route:true,honroCave:true}));
 if(village)st.terrains.push(solid('village-middle',[...middle,...middle.slice().reverse().map(([x,y])=>[x,y+125])],{route:true,honroCave:true},false,'rock'));
  const shelves=[[1850,5800],[2300,5700],[2450,6500],[],[1600,5300],[1550,7550],[2100,6100],[3200,7900],[3900,8250],[2250,6450]][i];
 for(const [j,x] of shelves.entries()){
  const lift=205+(j%2)*70,top=[[x-390,floor(x-390)-6],[x-180,floor(x)-lift],[x+170,floor(x)-lift],[x+410,floor(x+410)-6]];
  st.terrains.push({...solid('stone-shelf-'+j,[...top,...top.slice().reverse().map(([px,py])=>[px,py+28])],{honroCave:cave,route:false},false,'rock'),oneWay:true});
 }
 let roof=[];
 if(cave){
   const roofBase=folded?[...folded.roofBase,[width,yAt(folded.roofBase,width-740)+105]]:village?upper:profiles[i];
   roof=contour(roofBase.map(([x,y])=>{
    const gap=i===7||i===8?1200:i===3?980:i===4?850:780;
    const chamber=200*Math.sin(x/950+i*.51)+110*Math.sin(x/1930+i*.8);
    return[x,Math.round(y-Math.max(880,gap+chamber+(i===4?260*Math.max(0,1-Math.abs(x-4060)/1350):0)))];
   }),i,true);
   if(village)roof.push([width,ground(width)-1050]);
   // Preserve each room's open volume at the map edge. The old 380-unit
   // universal mouth collapsed every cavern into the same cramped funnel.
   const roofY=x=>yAt(roof,x);
   portals[0].top=roofY(0);portals[1].top=roofY(width);
   st.terrains.push(solid('cave-roof',[[0,0],[width,0],...roof.slice().reverse()],{honroCeiling:true,honroCave:true}));
   st.initialState.honroCaveForms=[];
   for(let x=880,j=0;x<width-520;x+=420+(j%4)*125,j++){
    const top=roofY(x),bottom=floor(x),gap=bottom-top;if(gap<500)continue;
    const types=['stalactite','drapery','stalagmite','cluster','stalactite','column','stalagmite'];
    const candidate=types[(j+i*2)%types.length],type=candidate==='column'&&gap>1450?'drapery':candidate;
    st.initialState.honroCaveForms.push({x,top,bottom,type,width:48+(j*37+i*13)%90,length:Math.min(gap*.39,250+(j*79)%340)});
   }
   if(folded)for(const [level,bench,next] of [
    ['upper',st.terrains.find(t=>t.id==='switchback-upper'),folded.mid],
    ['middle',st.terrains.find(t=>t.id==='switchback-middle'),route]
   ]){
    const top=level==='upper'?folded.top:folded.mid,
     underside=bench.points.slice(top.length).reverse().map(p=>[p.x,p.y]);
    for(let x=top[0][0]+960,j=0;x<top.at(-1)[0]-520;x+=890+(j%2)*260,j++){
     const root=yAt(underside,x),below=yAt(next,x),gap=below-root;
     if(gap<290)continue;
     st.initialState.honroCaveForms.push({x,top:root,bottom:below,type:['drapery','stalactite','cluster'][j%3],width:55+(j*29)%65,length:Math.min(gap*.37,185+(j*67)%130)});
    }
   }
    // Both village tiers continue visually through the west chamber. A tall
    // side-wall polygon here used to taper to a needle at the lower road.
 }
 if(i===1){
  const shoulder=5600;
  const rim=contour([[shoulder,0],[6050,820],[6500,ground(6500)-920],[7000,ground(7000)-1060],[7500,ground(7500)-1090],[7950,ground(7950)-1100],[width,ground(width)-1060]],1,true);
  st.terrains.push(solid('quarry-cave-mouth',[[shoulder,0],[width,0],...rim.slice().reverse()],{honroCeiling:true,honroCave:true}));
  st.initialState.honroCaveApproach={start:6350,end:width,roofEnd:ground(width)-1060,floorEnd:ground(width)};
 }
 if(i===9){const faceHeight=ground(3760)-920,face=Array.from({length:27},(_,j)=>{const t=j/26,s=t*t*(3-2*t);return[Math.round(4900-1140*s),Math.round(faceHeight*t)];});
  st.terrains.push(solid('exit-overhang',[[0,0],...face,[3210,ground(3210)-550],[2400,ground(2400)-530],[1550,ground(1550)-660],[700,ground(700)-620],[0,ground(0)-640]],{honroCeiling:true,honroCave:true}));}
 const elem=(assetId,x,y,scale=1,key='',layer='back')=>st.elements.push({id:'a2-'+id+'-'+(key||st.elements.length),assetId,x,y,scale,rotation:0,snap:false,layer,depthLayer:'L1'});
 // Combat galleries provide alternate firing angles and clear undersides.
 for(const [j,x] of [1250,3150,5450,width-1450].entries()){
  const y=ground(x)-135;
  const deck=[[x-210,ground(x-210)-8],[x-75,y],[x+170,y],[x+300,ground(x+300)-8]];
  if(i!==4)st.terrains.push({...solid('firing-gallery-'+j,[...deck,...deck.slice().reverse().map(([x,y])=>[x,y+18])],{route:true},true,'wood'),oneWay:true});
 }
 // Oil lamps provide light, not spirit manifestation.
 if(!folded)for(let x=420,j=0;x<width-180;x+=470,j++){
  const y=ground(x);
  if(i===0||i===1&&x<6900||i===9&&x>3800){elem(j%3===0?'ancient_pine':'dead_pine',x,y,.72+(j%3)*.16);if(j%2===0)elem('act2:rock-bank',x+130,ground(x+130),.7);}
  else{
   if([2,4,6].includes(i)&&j%3===0)elem('act2:hoist-frame',x,y,.7+(j%2)*.2);
   if(i===3&&j%2===0){const houses=['act2:cave-house','act2:cave-house-lean','act2:cave-house-ruin'];elem(houses[Math.floor(j/2)%houses.length],x+130,ground(x+130),.85+(j%3)*.16);}
   if(i===5&&j%4===0)elem('act2:temple',x+180,ground(x+180),.75);
   elem('act2:rock-bank',x-100,ground(x-100),.5+(j%3)*.16);
  }
  if(j%2===0){elem('act2:lamp',x,y,.8);st.markers.push({id:'light-'+j,type:'act2-light',x,y,color:'#d6b686'});}
 }
 if(!folded)for(let x=780,j=0;x<width-350;x+=650,j++){
  const y=ground(x),kind=i<2?'bundles':i===3?(j%2?'hanging-cloth':'bundles'):i===5?(j%2?'memorial':'stone-table'):i>=7&&i<=8?(j%2?'memorial':'bundles'):j%2?'timber-rack':'mine-rail';
  elem('act2:'+kind,x,y,.7+(j%3)*.12);
  if(cave&&j%3===1&&[3,4,5].includes(i))elem('act2:water-trough',x-135,ground(x-135),.7);
 }
 if(folded)for(let progress=410,j=0;progress<width-250;progress+=365,j++){
  const a=pos([progress]),b=pos([Math.min(width-180,progress+145)]);
  if(j%2===0){elem('act2:lamp',a.x,a.y,.72);st.markers.push({id:'light-'+j,type:'act2-light',x:a.x,y:a.y,color:'#d6b686'});}
  const prop=i===7||i===8?(j%3===0?'memorial':'stone-table'):i===4?(j%2?'water-trough':'mine-rail'):j%3===0?'timber-rack':'mine-rail';
  if(j%3!==1)elem('act2:'+prop,b.x,b.y,.74+(j%3)*.11);
  if(j%4===2)elem('act2:rock-bank',a.x+80,a.y,.52);
  if(i===2&&j%5===1||i===6&&j%4===1)elem('act2:hoist-frame',a.x,a.y,.82);
 }
 if(village)for(let x=650,j=0;x<7900;x+=740,j++){
  const houses=['act2:cave-house-lean','act2:cave-house','act2:cave-house-ruin'];
  elem(houses[j%houses.length],x,floor(x),.9+(x%3)*.05);elem('act2:lamp',x+190,floor(x+190),.7);
 }
  if(i===5){elem('act2:temple',5200,yAt(templeUpper,5200),1.65);elem('act2:temple',6750,ground(6750),1.05);}
 if([7,8].includes(i)){elem('act2:bell',6240,floor(6240),1.4);for(const x of [5320,7390])elem('act2:hoist-frame',x,floor(x),1.4);}
 if(i===8){elem('act2:old-soul-stone',9440,floor(9440),1.2,'old-soul-stone');elem('act2:memorial',8990,floor(8990),1.65,'old-soul-memorial');}
 if(basin){const x1=basin.bottom[0][0],x2=basin.bottom.at(-1)[0],waterY=basin.level;
  st.materials.push({id:'underground-river',kind:'water-pool',terrainId:upperBasin?'switchback-upper':'act2-floor',conductive:true,attached:true,honroCarvedBasin:true,surface:[[x1,waterY],[x2,waterY]],bottom:basin.bottom,points:[[x1,waterY],[x2,waterY],...basin.bottom.slice().reverse()]});
 }
 st.units=['archer','mage','knight','occultist'].map((cls,j)=>{const p=folded?pos([250+j*55]):{x:300+j*95,y:ground(300+j*95)};return G.HonroUnits.record(cls,'p-'+cls,p.x,p.y,'player');});
 const encounterCenters=[
  [1500,3450,5530,6650],[1750,3180,4600,6500,7660],[1450,2450,4300,6150,7200],
  [1650,3000,4900,6100,7300],[1550,2450,4150,5750,6800],[1700,2550,4050,6150,7400],
  [1680,3350,4400,6200,7650],[2100,3350,5350,7100,8800],[1700,3050,4900,6950,8650],
  [1650,3000,5050,7050,8050]
 ][i];
 const encounterKinds=[
  ['hound','boar','resonance','picks'],['picks','minecart','bat','resonance','minecart'],
  ['picks','bat','minecart','resonance','picks'],['picks','resonance','minecart','bat','picks'],
  ['waterwheel','picks','bat','minecart','resonance'],['stoneLantern','monkVessel','picks','resonance','stoneLantern'],
  ['picks','minecart','resonance','monkVessel','picks'],['stoneLantern','bellCluster','picks','resonance','bellCluster'],
  ['echo','resonance','bellCluster','echo','resonance'],['bat','minecart','picks','resonance','minecart']
 ][i];
 for(let j=0;j<plan.initial;j++){
  const group=Math.min(encounterCenters.length-1,Math.floor(j*encounterCenters.length/plan.initial));
  const local=j-Math.ceil(group*plan.initial/encounterCenters.length),elite=j%plan.eliteEvery===plan.eliteEvery-1;
  let progress=encounterCenters[group]+(elite?450:[-135,-58,34,112,178][(local+5)%5]*(folded ? .42 : 1));
  progress=Math.max(860,Math.min(width-370,progress));
  let kind=encounterKinds[group]||species[i][j%species[i].length];
  if(i===6&&j===Math.floor(plan.initial*.55))kind='hoist';if(i===7&&j===plan.initial-4)kind='keeper';
  const cohort=progress<width/3?'west':progress<width*2/3?'middle':'east';
  let {x,y}=pos([progress]);
   if(templeUpper&&group===2&&!elite){x=5200+[-110,-35,55,125][(local+4)%4];y=yAt(templeUpper,x);}
  if(village&&group>=3)y=floor(x);
  if(kind==='keeper'){x=sites.keeper.x;y=sites.keeper.y;}if(kind==='hoist'){x=sites.hoist.x;y=sites.hoist.y;}
  const flying=G.HonroWorld.archetypes[kind]?.flying,uid=kind==='keeper'?'act2-keeper':kind==='hoist'?'act2-hoist':'a2-enemy-'+j;
  // Unit records already raise flying archetypes. Keeping their authoring
  // anchor near the road leaves the flyer within playable shot range.
  st.units.push({...G.HonroUnits.record(kind,uid,x,y+(flying?280:0),'enemy'),spawnIndex:j,behavior:'patrol',stageOverrides:{honroCohort:cohort,honroAct2Elite:elite,honroAct2Revision:2}});
 }
 for(const [j,s] of d.steps.entries()){
  const {x,y}=sites[s.id],m={id:s.id,type:'act2',x,y,label:s.label,action:'act2',...(s.requiredClass?{requiredClass:s.requiredClass}:{})};
  if(s.kind==='destroy'){
   delete m.action;const ty=i===4?Math.max(yAt(roof,x)+220,y-690):s.id==='upper-chain'?y-410:y-160;
   if(i===4&&s.id==='shaft-pin')st.initialState.honroCaveHangingTarget={x,roofY:yAt(roof,x),targetY:ty};
   st.terrains.push(solid(s.id,[[x-24,ty],[x+24,ty],[x+25,ty+76],[x-25,ty+76]],{hp:100,maxHp:100,honroSeal:true,honroAct2Target:true,honroRockfall:['rock-pin','collapse-pin','exit-pin'].includes(s.id)},true,'wood'));m.id='marker-'+s.id;m.y=ty+38;
  }else if(['defeat','clear','hold','reach','escort'].includes(s.kind)){delete m.action;if(['reach','escort'].includes(s.kind))m.type='exit';}
  else elem('act2:ritual',x,y,.7,'goal-'+j,'prop');
  if(s.kind==='hold'){
   elem('act2:ritual',x,y,1,'defense-'+j,'prop');
   const wavePos=folded?pos([Math.min(width-250,plan.sites[s.id][0]+740)]):{x:Math.min(width-250,x+740),y:(village&&plan.sites[s.id][1]==='lower'?floor:ground)(Math.min(width-250,x+740))};
   st.markers.push({id:'wave-'+s.id,type:'act2-wave',x:wavePos.x,y:wavePos.y});
  }
  if(s.kind==='rescue'){
   const uid='resident-'+j,spiritId='resident-spirit-'+j;
   st.units.push({...G.HonroUnits.record('object:civilian',uid,x+45,y,'npc'),label:i===5?'잠운사 승려':'동굴 주민',stageOverrides:{hp:950,maxHp:950,h:92,r:22,honroProtected:true,honroCivilian:true,fixed:true}});
   st.units.push({...G.HonroUnits.record(i===5?'monkVessel':'resonance',spiritId,x+115,y-135,'enemy'),spawnIndex:60+j,stageOverrides:{honroCohort:'resident',honroAct2Revision:2}});m.target=uid;m.spiritId=spiritId;
  }
  st.markers.push(m);
 }
 for(const [j,x] of plan.lamps.entries()){const p=pos([x]);st.markers.push({id:'spirit-lamp-'+j,type:'act2',action:'act2',label:'원혼등불 · 주변 혼령 현형',x:p.x,y:p.y,radius:1200});elem('act2:lamp',p.x,p.y,1.4,'spirit-lamp-'+j,'prop');}
 const finalWave=pos([width-650]);st.markers.push({id:'wave',type:'act2-wave',x:finalWave.x,y:finalWave.y});
 if(i===6){const p=pos([3500]);st.markers.push({id:'rebuild-brace',type:'act2',action:'act2',label:'낙석 치우기',x:p.x,y:p.y,collected:true});}
 if([3,5,8,9].includes(i)){
  const x=i===9?3080:i===8?1750:950,y=ground(x);
  st.units.push({...G.HonroUnits.record('object:civilian','objective',x,y,'npc'),label:i===9?'생존자 행렬':'피난 주민',stageOverrides:{honroProtected:true,honroCivilian:true,hp:i===9?2600:1900,maxHp:i===9?2600:1900,r:25,h:92,fixed:i!==9,walkSpeed:240,moveLeft:850,maxMove:850}});
 }
 const barrier=(key,x,y,h,broken=false)=>st.terrains.push(solid(key,[[x-25,y-h],[x+25,y-h],[x+25,y],[x-25,y]],{hp:99999,maxHp:99999,honroCave:true,broken}));
 if(i===2){const p=pos([4510]);barrier('gate-gate',p.x,p.y,350);}
 if(i===3)barrier('gate-bridge',1650,floor(1650),220);
 if(i===6){let p=pos([5740]);barrier('gate-repair',p.x,p.y,285);p=pos([3500]);barrier('gate-debris',p.x,p.y,230,true);}
 if(i===9)barrier('gate-exit',2940,ground(2940),300);
 if(i===1){
  const x1=3000,x2=4150,original=clone(st.terrains[0].points);
  const collapse=contour([[x1,floor(x1)],[x1+210,floor(x1+210)+120],[x1+430,floor(x1+430)+340],[x2-300,floor(x2-300)+300],[x2-130,floor(x2-130)+100],[x2,floor(x2)]],12);
  st.terrains[0].properties.honroRestoredVertices=original;
  st.terrains[0].points=points([...route.filter(([x])=>x<x1),...collapse,...route.filter(([x])=>x>x2),[width,height+240],[0,height+240]]);
 }
 const env=G.HonroEnvironment.makeEnvironment(st,{preset:cave?'enclosed':i===0?'forest':'valley'});
 // Houses and temple halls must sit on the actual L1 settlement ledges.
 // Repeating them on a distant L2 support made inhabited buildings hover.
 if(cave&&!village&&i!==5)for(const group of env.groups.filter(g=>g.depthLayer==='L2')){
  const support=env.surfaces.find(s=>s.groupId===group.id);if(!support)continue;
  for(let x=500,j=0;x<width;x+=1900,j++)env.placements.push({id:'rear-'+group.id+'-'+j,assetId:'act2:memorial',depthLayer:'L2',groupId:group.id,supportId:support.id,x,y:0,scale:1.1,rotation:0});
 }
 env.atmosphere={preset:cave?'enclosed':i===0?'forest':'valley',overrides:cave?{skyTop:'#07080a',skyBottom:'#0a0b0d',ambientTint:'#17181b',hazeColor:'#0c0d10',shadowTint:'#090a0c',lightStrength:.10,mistStrength:.015,hazeStrength:.20,farFogColor:'#0b0c0e',nearFogColor:'#101114'}:i===9?{skyTop:'#687b86',skyBottom:'#dec39e',ambientTint:'#8b8e79',hazeColor:'#b7ab96',farFogColor:'#d4c9ad',nearFogColor:'#d3bfa1',keyLightColor:'#ffdb9d',keyLightDirection:[.77,.15],glowColor:'#f6c888',shadowTint:'#394447',lightStrength:.40,mistStrength:.30}:{} };
 // The playable cavity stays black. Distant scenic supports otherwise fill it
 // with the same green-blue bands used by outdoor stages and end at the portals.
 if(cave)env.hiddenLayers=['L2','L3','L4'];
 env.skyVisible=!cave;st.environment=env;
 st.meta={notes:'2-'+(i+1)+' '+d.name+' · 개편 2 · '+plan.rounds.join('–')+'턴 설계',seed:2210+i};p.stages.push(st);
 }
 return p;
}
G.HonroAct2Design={build,profiles,heights,yAt};
})(globalThis);
