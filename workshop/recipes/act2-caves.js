(function(G){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),points=xs=>xs.map(([x,y])=>({x,y}));
const yAt=(route,x)=>{if(x<=route[0][0])return route[0][1];for(let i=1;i<route.length;i++)if(x<=route[i][0]){const a=route[i-1],b=route[i],t=(x-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*t;}return route.at(-1)[1];};
// Authored broad landforms. Subdivision keeps exact straight granite planes;
// it adds no procedural wave, noise or repeated switchback template.
function contour(nodes,spacing=80){const out=[nodes[0].slice()];for(let i=1;i<nodes.length;i++){const a=nodes[i-1],b=nodes[i],n=Math.max(1,Math.ceil(Math.abs(b[0]-a[0])/spacing));for(let j=1;j<=n;j++){const t=j/n;out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}return out;}
function solid(id,p,properties={},breakable=false,mat='rock'){return{id,name:id,type:'solid',points:points(p),baseMaterial:mat,breakable,oneWay:false,layer:'terrain',properties,detail:{spacing:18,roughness:0,seed:1,optimizeEpsilon:0}};}
// Two real granite contact shoulders flank the wedged bell. Their short flats
// connect to the shared basin by walking slopes, never painted fake ledges.
const bellFloor=[[0,4160],[900,4160],[1600,4500],[2600,4560],[3300,4530],[3950,4240],[4450,4240],[5000,4650],[5350,4840],[5550,5100],[5800,5100],[6100,5450],[6350,5500],[6740,5280],[6950,5030],[7250,5030],[7900,4780],[8650,4470],[9400,4470],[10400,4580]];
const bellRoof=[[0,3150],[1200,3150],[1900,2200],[3100,1320],[4800,1040],[6600,1280],[7700,1500],[8600,2110],[9600,2670],[10400,3300]];
// Baseline jump reach was measured with the shared Engine and untrained heroes.
// These uphill shelves are entered from the reachable right-hand floor; the
// main route is unchanged. The shared bell shelf also stays below jump height.
const optionalJumpEntries={'ridge-perch':2900,'quarry-firing-shelf':2300,'court-side-pulpit':2440,'record-side-shelf':6600,'hero-side-perch':4710,'last-pass-shot-shelf':7290};
// This is the canonical authoring plan. Room volumes reference terrain edges,
// not a second painted silhouette; 18 and 19 deliberately share these arrays.
const layouts=[
 {topologyId:'asymmetric-pine-basin',floor:[[0,3250],[800,3220],[1400,3380],[2100,3440],[2900,3320],[3700,3470],[4500,3420],[5150,3030],[5850,2970],[6500,2750],[7150,2460],[7800,2380]],rooms:[['forest-entry',0,1000,'open'],['west-knot',1000,2600,'open'],['east-knot-court',2600,4500,'open'],['resident-bank',4500,6200,'open'],['north-trace',6200,7800,'open']],sites:{'knot-west':[1600,'west-knot'],'clear-west':[1850,'west-knot'],'knot-east':[3550,'east-knot-court'],'hold-knots':[3550,'east-knot-court'],resident:[5580,'resident-bank'],'clear-road':[6350,'north-trace'],trace:[7260,'north-trace']},shelves:[['ridge-perch',2700,510,230]],scenery:[['act2:pine',700,1.5],['act2:pine',2350,1.25],['dead_pine',4220,1.05],['act2:pine',6050,1.25],['act2:bundles',5520,.9],['act2:lamp',5660,.8]],encounters:[1450,3450,5540,6650]},
 {topologyId:'diagonal-granite-quarry',floor:[[0,3900],[950,3770],[1700,3680],[2500,3510],[3100,3340],[4200,3240],[4700,3000],[5800,2960],[6700,2710],[7300,2700],[8400,2920]],roof:[[6970,0],[7240,1300],[7590,1840],[8050,1900],[8400,1860]],roofId:'quarry-cave-mouth',rooms:[['quarry-approach',0,2200,'open'],['pin-firing-shoulder',2200,2900,'open'],['rockfall-cut',2900,4150,'open'],['sign-yard',4150,6600,'open'],['outer-mouth',6600,8400,'transition']],sites:{'clear-approach':[1900,'quarry-approach'],'rock-pin':[3300,'rockfall-cut',-360,2520],sign:[4900,'sign-yard'],'hold-road':[4900,'sign-yard'],'clear-quarry':[6850,'outer-mouth'],exit:[7920,'outer-mouth']},shelves:[['quarry-firing-shelf',2120,380,235]],scenery:[['dead_pine',790,1.25],['act2:pine',6280,1.1],['act2:timber-rack',2560,1.3],['act2:mine-rail',4610,1],['act2:timber-rack',5300,1.1],['act2:lamp',7720,1]],encounters:[1750,3260,4900,6500,7660]},
 {topologyId:'daylight-collapse-to-low-throat',floor:[[0,2920],[700,2990],[1400,3220],[2200,3420],[2800,3480],[3600,3850],[4200,4080],[5200,4110],[6200,4500],[6900,4750],[8200,4750]],roof:[[3820,0],[4070,2350],[4380,3370],[5280,3440],[6000,3620],[6740,2910],[7350,3100],[8200,3370]],rooms:[['sunken-forecourt',0,1850,'open'],['mason-ledge',1850,3200,'open'],['stone-threshold',3200,4600,'transition'],['low-gallery',4600,6100,'cave'],['inner-pocket',6100,8200,'cave']],sites:{'clear-entry':[1500,'sunken-forecourt'],resident:[2400,'mason-ledge'],'door-pin':[3990,'stone-threshold',-190,3700],gate:[4270,'stone-threshold'],'hold-gate':[4800,'low-gallery'],'clear-depth':[6720,'inner-pocket'],exit:[7720,'inner-pocket']},shelves:[['forecourt-shot-ledge',3060,400,220]],scenery:[['act2:cave-house-lean',2530,.95],['act2:hoist-frame',2880,1.2],['act2:timber-rack',3550,1.1],['act2:lamp',4770,1.05],['act2:mine-rail',5770,1],['act2:cave-house',7290,.85],['act2:lamp',7560,.9]],encounters:[1450,2550,4900,6300,7270]},
 {topologyId:'asymmetric-inhabited-terraces',floor:[[0,3000],[750,3000],[2400,3000],[2800,3080],[3300,3490],[3900,4100],[4450,4100],[5100,4530],[5850,5100],[6550,5610],[7050,5770],[7620,5800],[7820,5860],[8010,6040],[8190,6090],[8420,5860],[8600,5860]],roof:[[0,1650],[1300,1550],[2400,1400],[4000,1650],[5700,2020],[7200,2340],[8600,2820]],rooms:[['upper-homes',0,3200,'cave'],['middle-market',3200,4800,'cave'],['right-descent',4800,6500,'cave'],['refuge-bridge',6500,7280,'cave'],['lower-family',7280,8600,'cave']],sites:{'clear-upper':[1800,'upper-homes'],'family-upper':[2350,'upper-homes'],'clear-middle':[3980,'middle-market'],'family-mid':[4350,'middle-market'],'family-lower':[7660,'lower-family'],bridge:[6880,'refuge-bridge'],'hold-refuge':[7080,'refuge-bridge'],'clear-village':[7080,'refuge-bridge']},shelves:[['market-perch',4700,340,220],['refuge-bridge-walkway',6900,800,330]],water:[7820,8420,5860],scenery:[['act2:cave-house',1000,1.18],['act2:cave-house-lean',2100,1.03],['act2:hanging-cloth',2300,1],['act2:cave-house-ruin',4000,1],['act2:stone-table',4340,.9],['act2:lamp',4400,1.15],['act2:cave-house-lean',7160,.9],['act2:bundles',7430,1.2],['act2:water-trough',7710,.9],['act2:lamp',7500,1.1]],encounters:[1620,3930,5250,7120,7590],objectiveX:7100},
 {topologyId:'low-sluice-high-shaft',floor:[[0,3610],[900,3690],[1750,3800],[2400,3800],[3000,4020],[3700,4240],[4300,4410],[4940,4460],[5310,4540],[5590,4750],[5830,4790],[6170,4560],[6700,4470],[7300,4100],[8000,3890]],roof:[[0,2870],[1700,2990],[2650,3070],[3350,2450],[4100,1660],[5000,1580],[5750,2230],[6500,3240],[7250,3160],[8000,2780]],rooms:[['wet-approach',0,1800,'cave'],['sluice-neck',1800,3150,'cave'],['open-shaft',3150,5300,'cave'],['carved-groove',5300,6550,'cave'],['temple-stair',6550,8000,'cave']],sites:{'clear-water':[1630,'wet-approach'],sluice:[2350,'sluice-neck'],'hold-sluice':[2490,'sluice-neck'],'shaft-pin':[4720,'open-shaft',-690,4430],'clear-gallery':[5700,'carved-groove'],groove:[6210,'carved-groove'],exit:[7530,'temple-stair']},shelves:[['dry-shoulder',2900,360,235]],water:[5310,6170,4540],scenery:[['act2:sluice',2060,1.3],['act2:lamp',2410,1],['act2:timber-rack',3370,1.2],['act2:mine-rail',4150,1],['act2:lamp',5140,1],['act2:mine-rail',6250,.9],['act2:lamp',7410,1]],encounters:[1510,2510,4190,5760,6860]},
 {topologyId:'temple-court-short-record-loop',floor:[[0,5000],[900,4930],[2100,4930],[2900,4760],[3600,4490],[3900,4320],[5140,4320],[5700,4950],[6240,4950],[6900,4670],[7470,4530],[8200,4580]],roof:[[0,3390],[1300,2650],[2950,2140],[4300,1980],[5200,2470],[5750,3720],[6430,3890],[6970,3220],[8200,3050]],rooms:[['temple-court',0,2350,'cave'],['monk-shelter',2350,3300,'cave'],['hall-terrace',3300,5250,'cave'],['record-gallery',5250,6560,'cave'],['rear-witness',6560,8200,'cave']],sites:{'clear-court':[1840,'temple-court'],monk:[2690,'monk-shelter'],hall:[4500,'hall-terrace'],'hold-hall':[4780,'hall-terrace'],record:[5910,'record-gallery'],'clear-temple':[6900,'rear-witness'],witness:[7500,'rear-witness']},shelves:[['court-side-pulpit',2310,310,220],['record-side-shelf',6480,300,240]],scenery:[['act2:memorial',1760,1],['act2:lamp',2630,1.2],['act2:temple',4510,2.05],['act2:ritual',4820,1.1],['act2:stone-table',5960,1.2],['act2:lamp',6120,1.1],['act2:timber-rack',7000,.85],['act2:memorial',7420,1]],encounters:[1700,2720,4430,6020,7310],objectiveX:2800},
 {topologyId:'offset-hoist-workbays',floor:[[0,3500],[850,3500],[1580,3690],[2310,3690],[2900,3890],[3600,4170],[4120,4550],[4700,4550],[5080,4550],[5570,4550],[6200,4010],[6770,4010],[7420,4290],[7900,4430],[8400,4430]],roof:[[0,2550],[1500,2610],[2800,2340],[3830,1650],[4950,1420],[5750,1860],[6410,2570],[7300,3120],[8400,3200]],rooms:[['brace-workyard',0,2600,'cave'],['supported-cut',2600,3920,'cave'],['hoist-bay',3920,5350,'cave'],['axle-platform',5350,7000,'cave'],['work-notes',7000,8400,'cave']],sites:{'clear-works':[1730,'brace-workyard'],brace:[2410,'brace-workyard'],'collapse-pin':[3420,'supported-cut',-240,2750],hoist:[4780,'hoist-bay'],repair:[5670,'axle-platform'],'hold-hoist':[6120,'axle-platform'],'clear-lift':[7300,'work-notes'],notes:[7800,'work-notes']},shelves:[['hoist-side-work-shelf',3800,360,225]],scenery:[['act2:timber-rack',2400,1.7],['act2:mine-rail',3290,1.1],['act2:hoist-frame',4820,3.3],['act2:lamp',4120,1.05],['act2:timber-rack',6090,1],['act2:mine-rail',6600,1.1],['act2:stone-table',7840,1]],encounters:[1710,3290,4610,6260,7660]},
 {topologyId:'monumental-bell-vault',sharedSpaceId:'bell-cavern',floor:bellFloor,roof:bellRoof,rooms:[['bell-entry',0,1850,'cave'],['suppression-court',1850,3400,'cave'],['chain-shoulder',3400,5100,'cave'],['lower-chain-floor',5100,5880,'cave'],['leak-basin',5880,7500,'cave'],['keeper-ledge',7500,10400,'cave']],sites:{'clear-wards':[2380,'suppression-court'],silence:[2920,'suppression-court'],'hold-silence':[2920,'suppression-court'],'upper-chain':[4760,'chain-shoulder',-620,4380],'lower-chain':[5480,'lower-chain-floor'],leak:[6650,'leak-basin'],keeper:[8510,'keeper-ledge'],'clear-bell':[9200,'keeper-ledge']},shelves:[['suppression-rear-shelf',2070,340,215]],scenery:[['act2:lamp',1500,1],['act2:ritual',2920,1.2],['act2:hoist-frame',4320,1.15],['act2:lamp',5120,1.05],['act2:bell',6200,2.1,'bell',5700],['act2:mine-rail',7280,1],['act2:lamp',8100,1.1]],encounters:[2200,3440,5350,7130,8820]},
 {topologyId:'monumental-bell-vault-ritual-state',sharedSpaceId:'bell-cavern',floor:bellFloor,roof:bellRoof,rooms:[['bell-entry',0,1850,'cave'],['suppression-court',1850,3400,'cave'],['chain-shoulder',3400,5100,'cave'],['lower-chain-floor',5100,5880,'cave'],['leak-basin',5880,7500,'cave'],['keeper-ledge',7500,10400,'cave']],sites:{route:[1720,'bell-entry'],'separate-1':[2980,'suppression-court'],'hold-first':[2980,'suppression-court'],'send-1':[3200,'suppression-court'],'separate-2':[5500,'lower-chain-floor'],'hold-second':[5500,'lower-chain-floor'],'send-2':[5740,'lower-chain-floor'],'separate-3':[8120,'keeper-ledge'],'hold-last':[8120,'keeper-ledge'],'send-3':[8340,'keeper-ledge'],'clear-souls':[8580,'keeper-ledge'],'old-soul':[6330,'leak-basin']},shelves:[['suppression-rear-shelf',2070,340,215]],water:[5750,6806.315789473685,5250],scenery:[['act2:lamp',1500,1],['act2:ritual',2920,1.2],['act2:hoist-frame',4320,1.15],['act2:lamp',5120,1.05],['act2:bell',6200,2.1,'bell',5700],['act2:mine-rail',7280,1],['act2:lamp',8100,1.1],['act2:memorial',3170,.95],['act2:bundles',7350,.95],['act2:old-soul-stone',6350,.65,'old-soul-stone']],encounters:[1690,3090,4900,6970,8650],objectiveX:1980},
 {topologyId:'enclosed-mouth-to-dawn-pass',floor:[[0,4480],[1100,4440],[2250,4320],[3050,4120],[3900,3810],[4700,3680],[5620,3680],[6380,3330],[7180,3010],[7950,2810],[8500,2740],[9000,2740]],roof:[[0,3550],[1350,3550],[2400,3420],[3200,3090],[3690,2320],[4050,1050],[4290,0]],roofId:'exit-overhang',rooms:[['blocked-mouth',0,3000,'cave'],['convoy-start',3000,4200,'transition'],['open-rest-shelf',4200,6000,'open'],['final-pass',6000,7970,'open'],['dawn-arrival',7970,9000,'open']],sites:{'clear-mouth':[1670,'blocked-mouth'],'exit-pin':[2740,'blocked-mouth',-210,2370],escort:[3290,'convoy-start'],'escort-mid':[5240,'open-rest-shelf'],'hold-convoy':[5240,'open-rest-shelf'],'clear-pass':[7150,'final-pass'],escape:[8490,'dawn-arrival']},shelves:[['hero-side-perch',4570,360,235],['last-pass-shot-shelf',7140,340,230]],scenery:[['act2:lamp',1670,1],['act2:timber-rack',2920,.9],['act2:bundles',5210,1.1],['act2:pine',5880,1.4],['dead_pine',7060,1],['act2:pine',8200,1.2]],encounters:[1610,2990,5050,7050,8060],objectiveX:3170}
];
const profiles=layouts.map(l=>l.floor),heights=[4800,5200,6600,7600,6000,6600,6800,7600,7600,5800];
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
const encounterCenters=[[1500,3450,5530,6650],[1750,3180,4600,6500,7660],[1450,2450,4300,6150,7200],[1650,3000,4900,6100,7300],[1550,2450,4150,5750,6800],[1700,2550,4050,6150,7400],[1680,3350,4400,6200,7650],[2100,3350,5350,7100,8800],[1700,3050,4900,6950,8650],[1650,3000,5050,7050,8050]];
const encounterKinds=[
 ['hound','boar','resonance','picks'],
 ['picks','minecart','bat','resonance','minecart'],
 ['picks','bat','minecart','bat','picks'],
 ['picks','bat','minecart','bat','picks'],
 ['waterwheel','picks','bat','minecart','bat'],
 ['stoneLantern','monkVessel','picks','bat','stoneLantern'],
 ['picks','minecart','bat','monkVessel','picks'],
 ['stoneLantern','bellCluster','picks','bat','bat'],
 // The release rite itself remains a spirit encounter by story design.
 ['echo','resonance','bellCluster','echo','resonance'],
 ['bat','minecart','picks','resonance','minecart']
];
const pair=p=>[p.x,p.y],same=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])<1e-6;
function cleanPolygon(p){const out=p.filter((v,i)=>!i||!same(v,p[i-1]));if(same(out[0],out.at(-1)))out.pop();return out;}
function floorAnchor(route,x,surfaceId='floor-main'){return{x,y:yAt(route,x),surfaceId};}
function roomAt(rooms,x){return rooms.find(r=>x>=r[1]&&x<=r[2])?.[0]||rooms.at(-1)[0];}
function pathBetween(route,a,b){const sign=Math.sign(b-a),nodes=route.filter(p=>sign>0?p[0]>a&&p[0]<b:p[0]<a&&p[0]>b);if(sign<0)nodes.reverse();return[[a,yAt(route,a)],...nodes,[b,yAt(route,b)]];}
function basin(route,spec){const [left,right,level]=spec;let ps=route.filter(p=>p[0]>=left&&p[0]<=right);ps=[[left,yAt(route,left)],...ps.filter(p=>p[0]>left&&p[0]<right),[right,yAt(route,right)]];
 const hits=[];for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i];if((a[1]-level)*(b[1]-level)<=0&&a[1]!==b[1]){const x=a[0]+(b[0]-a[0])*(level-a[1])/(b[1]-a[1]);if(x>=left-250&&x<=right+250)hits.push(x);}}
 const x1=hits.filter(x=>x<=(left+right)/2).at(-1)??left,x2=hits.find(x=>x>(left+right)/2)??right;
 const bed=[[x1,level],...route.filter(p=>p[0]>x1&&p[0]<x2),[x2,level]];return{surface:[[x1,level],[x2,level]],bottom:bed};}
function makeRoute(route,xs){const out=[];for(let j=1;j<xs.length;j++)for(const p of pathBetween(route,xs[j-1],xs[j]))if(!out.length||!same(out.at(-1),p))out.push(p);return out;}
function build(project){
 const p=clone(project),stageOrder=new Map(project.stages.map((s,i)=>[s.id,i])),assetOrder=new Map(project.library.map((a,i)=>[a.id,i])),oldAssets=new Map(p.library.filter(a=>a.id.startsWith('act2:')).map(a=>[a.id,a]));
 p.stages=p.stages.filter(s=>s.metadata?.act!==2);p.library=p.library.filter(a=>!a.id.startsWith('act2:'));
 // Existing portable SVG art survives deterministic terrain regeneration.
 p.library.push(...assets().map(a=>oldAssets.get(a.id)?.vector?clone(oldAssets.get(a.id)):a));
 const bank=clone(p.library.find(a=>a.id==='rock_large'));bank.id='act2:rock-bank';bank.name='암반 가장자리의 돌무더기';bank.collision=[];bank.tags=[...(bank.tags||[]),'act2'];p.library.push(oldAssets.get(bank.id)?.vector?clone(oldAssets.get(bank.id)):bank);
 for(const a of oldAssets.values())if(!p.library.some(b=>b.id===a.id)&&a.vector)p.library.push(clone(a));
 // Other acts may append their own art. Regeneration preserves all existing
 // library positions while appending genuinely new assets deterministically.
 p.library.sort((a,b)=>(assetOrder.get(a.id)??Number.MAX_SAFE_INTEGER)-(assetOrder.get(b.id)??Number.MAX_SAFE_INTEGER));
 for(let i=0;i<10;i++){
  // Rebuild the approved spatial source, then project the current objectives.
  // Removed target sites are still needed while constructing that source.
  const id=i+11,d=(G.HonroObjectiveRevision?.legacy||G.HONRO_CONTENT.stages)[id-1],plan=G.HonroAct2Plan.forStage(id),l=clone(layouts[i]),[width,height]=plan.size;
  const route=contour(l.floor),ground=x=>yAt(route,x),roof=l.roof?contour(l.roof):null,cave=i>=3&&i<=8;
  const st=G.HonroMaps.emptyStage('stage-'+id,d.name,width,height);
  const space={version:1,geometryRevision:3,sharedSpaceId:l.sharedSpaceId||null,topologyId:l.topologyId,rooms:[],surfaces:[],connections:[],routes:[],sites:{},encounterSites:[],scenery:[],landmarks:[],lights:[],views:[]};
  const sites=space.sites;
  for(const [key,[x,roomId,targetOffset,standingX]] of Object.entries(l.sites)){
   const standing=floorAnchor(route,standingX??x);
   sites[key]={objectiveId:key,roomId,surfaceId:'floor-main',x,y:ground(x),standing};
   if(targetOffset!==undefined)sites[key].target={x,y:ground(x)+targetOffset+38,terrainId:key};
  }
  const requires=[];
  if(id===12)requires.push({terrainId:'act2-floor',state:'restored',objectiveId:'rock-pin'});
  const gates=id===13?[['gate-gate',4470,440,'gate']]:id===14?[['gate-bridge',6620,220,'bridge',false,'refuge-bridge-walkway']]:id===17?[['gate-repair',5900,285,'repair'],['gate-debris',3520,230,'rebuild-brace',true]]:id===20?[['gate-exit',2960,300,'exit-pin']]:[];
  for(const [terrainId,,,,broken,surfaceId] of gates)if(!broken&&!surfaceId)requires.push({terrainId,state:'broken',objectiveId:gates.find(x=>x[0]===terrainId)[3]});
  const travel=makeRoute(route,[320,...d.steps.map(s=>sites[s.id].standing.x)]);
  const main={id:'main',kind:'required',anchors:travel.map(p=>({...floorAnchor(route,p[0]),y:p[1]})),requires};space.routes.push(main);
  const end=sites[d.steps.at(-1).id];
  Object.assign(st,{backdrop:d.theme,metadata:{stageId:id,act:2,actStage:i+1,campaign:true},design:{title:d.name,description:d.goal,act:2,revision:2,targetRounds:clone(plan.rounds),expectedMinutes:clone(plan.expectedMinutes),space},routes:points(travel),anchors:{spawn:{x:320,y:ground(320)},exit:{x:end.x,y:end.y}},initialState:{honroAct2Revision:2,honroAct2GeometryRevision:3,honroActiveLimit:plan.active,honroAct2Steps:clone(d.steps),honroCaveForms:[],honroState:{flags:{},collected:[],hold:0,lastRound:1,rescued:false,combatLog:[],act2:{version:2,done:{},events:{},rescued:[],checkpoints:[],holds:{}}}}});
  const floor=solid('act2-floor',[...route,[width,height+240],[0,height+240]],{route:true,surfaceKind:i===0?'soil':'cave',honroCave:cave||i===2,honroSpaceSurfaceId:'floor-main',honroSurfaceRole:'floor',honroWalkEdges:Array.from({length:route.length-1},(_,j)=>j)});
  st.terrains=[floor];
  space.surfaces.push({id:'floor-main',terrainId:'act2-floor',role:'floor',edgeIndices:clone(floor.properties.honroWalkEdges),roomIds:l.rooms.map(r=>r[0])});
  if(roof){
   const roofId=l.roofId||'cave-roof',poly=cleanPolygon([[roof[0][0],0],[roof.at(-1)[0],0],...roof.slice().reverse()]);
   const t=solid(roofId,poly,{honroCeiling:true,honroCave:true,honroSpaceSurfaceId:'ceiling-main',honroSurfaceRole:'ceiling'});st.terrains.push(t);
   const edgeIndices=[];for(let j=0;j<poly.length;j++)if(poly[j][1]>0||poly[(j+1)%poly.length][1]>0)edgeIndices.push(j);
   space.surfaces.push({id:'ceiling-main',terrainId:roofId,role:'ceiling',edgeIndices,roomIds:l.rooms.filter(r=>r[3]!=='open').map(r=>r[0])});
   const portals=[];if(roof[0][0]===0&&roof[0][1]>0)portals.push({side:'left',top:roof[0][1],bottom:ground(0)});if(roof.at(-1)[0]===width&&roof.at(-1)[1]>0)portals.push({side:'right',top:roof.at(-1)[1],bottom:ground(width)});
   if(cave)st.initialState.honroCaveEnvelope={version:2,portals};
   if(id===12||id===13)st.initialState.honroCaveApproach={start:roof[0][0],end:width,roofEnd:roof.at(-1)[1],floorEnd:ground(width)};
  }
  for(const [roomId,left,right,sky] of l.rooms){
   const floorYs=[ground(left),ground(right),...route.filter(p=>p[0]>left&&p[0]<right).map(p=>p[1])],top=sky==='open'?0:roof?Math.min(...roof.filter(p=>p[0]>=left&&p[0]<=right).map(p=>p[1]),yAt(roof,left),yAt(roof,right)):0;
   space.rooms.push({id:roomId,terrainIds:['act2-floor'],ceilingIds:sky==='open'||!roof?[]:[l.roofId||'cave-roof'],bounds:{x:left,y:top,w:right-left,h:Math.max(...floorYs)-top},sky,landmarkIds:[]});
  }
  for(let j=1;j<l.rooms.length;j++){
   const a=l.rooms[j-1],b=l.rooms[j],boundary=b[1],gate=gates.find(g=>g[1]>=a[1]&&g[1]<=b[2]&&!g[4]&&!g[5]);
   space.connections.push({id:a[0]+'-to-'+b[0],from:a[0],to:b[0],kind:gate?'gated-walk':'walk',routeId:'main',entry:floorAnchor(route,Math.min(a[2],Math.max(a[1],boundary-100))),exit:floorAnchor(route,Math.min(b[2],boundary+100)),requires:gate?[{terrainId:gate[0],state:'broken',objectiveId:gate[3]}]:id===12&&b[0]==='sign-yard'?[{terrainId:'act2-floor',state:'restored',objectiveId:'rock-pin'}]:[]});
  }
  for(const [key,x,span,lift] of l.shelves||[]){
   const left=x-span/2,right=x+span/2,y=ground(x)-lift,top=[[left,y],[right,y]],t=solid(key,[...top,[right,y+24],[left,y+24]],{honroCave:cave,honroSpaceSurfaceId:key,honroSurfaceRole:'shelf',honroWalkEdges:[0],optional:true});t.oneWay=true;if(key==='refuge-bridge-walkway'){t.baseMaterial='wood';t.properties.honroBridge=true;}st.terrains.push(t);
   const parentRoom=roomAt(l.rooms,x);space.surfaces.push({id:key,terrainId:key,role:'shelf',edgeIndices:[0],roomIds:[parentRoom]});
   const rightEntry=optionalJumpEntries[key],accessAnchors=rightEntry===undefined?[floorAnchor(route,left-100),{x:left+50,y,surfaceId:key},{x:right-50,y,surfaceId:key},floorAnchor(route,right+100)]:[floorAnchor(route,rightEntry),{x:right-50,y,surfaceId:key},{x:left+50,y,surfaceId:key},floorAnchor(route,left-100)];
   space.routes.push({id:key,kind:'optional-jump',anchors:accessAnchors,requires:key==='refuge-bridge-walkway'?[{terrainId:'gate-bridge',state:'broken',objectiveId:'bridge'}]:[]});
   if(['ridge-perch','market-perch','dry-shoulder','hero-side-perch'].includes(key)){space.surfaces.find(s=>s.id===key).roomIds.push(key);if(cave&&roof)space.surfaces.find(s=>s.id==='ceiling-main').roomIds.push(key);space.rooms.push({id:key,terrainIds:[key],ceilingIds:cave&&roof?[l.roofId||'cave-roof']:[],bounds:{x:left,y:y-300,w:span,h:300},sky:cave?'cave':'open',landmarkIds:[]});const entryRoom=roomAt(l.rooms,accessAnchors[0].x),exitRoom=roomAt(l.rooms,accessAnchors.at(-1).x);space.connections.push({id:entryRoom+'-to-'+key,from:entryRoom,to:key,kind:'optional-jump',routeId:key,entry:clone(accessAnchors[0]),exit:clone(accessAnchors[1]),requires:[]},{id:key+'-to-'+exitRoom,from:key,to:exitRoom,kind:'optional-jump',routeId:key,entry:clone(accessAnchors.at(-2)),exit:clone(accessAnchors.at(-1)),requires:[]});}
  }
  const elem=(assetId,x,y,scale=1,key='',layer='back')=>{const e={id:'a2-'+id+'-'+(key||st.elements.length),assetId,x,y,scale,rotation:0,snap:false,layer,depthLayer:'L1'};st.elements.push(e);const roomId=roomAt(l.rooms,x);space.scenery.push({id:e.id,elementId:e.id,assetId,roomId,surfaceId:'floor-main',x,y,scale,footOffset:y-ground(x)});return e;};
  for(const [assetId,x,scale,key,explicitY] of l.scenery){const y=explicitY??ground(x),e=elem(assetId,x,y,scale,key);if(key==='bell'){space.landmarks.push({id:'bell',kind:'bell',elementId:e.id,assetId,x,y,scale,roomId:'leak-basin',surfaceId:'floor-main',footOffset:y-ground(x),state:id===19?'released':'restrained'});space.rooms.find(r=>r.id==='leak-basin').landmarkIds.push('bell');}if(assetId==='act2:lamp')space.lights.push({id:e.id,x,y:y-50,roomId:roomAt(l.rooms,x),kind:'oil',radius:370,color:'#d6aa70'});}
  if(l.water){const z=basin(route,l.water);st.materials.push({id:'underground-river',kind:'water-pool',terrainId:'act2-floor',conductive:true,attached:true,honroCarvedBasin:true,surface:z.surface,bottom:z.bottom,points:[...z.surface,...z.bottom.slice().reverse()]});space.water=[{id:'underground-river',terrainId:'act2-floor',surfaceId:'floor-main',roomId:roomAt(l.rooms,(z.surface[0][0]+z.surface[1][0])/2),state:id===15?'drainable':'still'}];}
  st.units=['archer','mage','knight','occultist'].map((cls,j)=>{const x=320+j*95;return G.HonroUnits.record(cls,'p-'+cls,x,ground(x),'player');});
  for(let j=0;j<plan.initial;j++){
   const group=Math.min(l.encounters.length-1,Math.floor(j*l.encounters.length/plan.initial)),local=j-Math.ceil(group*plan.initial/l.encounters.length),elite=j%plan.eliteEvery===plan.eliteEvery-1;
   const offset=elite?450:[-135,-58,34,112,178][(local+5)%5];let x=Math.max(860,Math.min(width-370,l.encounters[group]+offset));
   const oldProgress=encounterCenters[i][group]+(elite?450:offset*([2,4,6,7,8].includes(i)?.42:1));
   const cohort=oldProgress<width/3?'west':oldProgress<width*2/3?'middle':'east';let kind=encounterKinds[i][group];
   if(i===6&&j===Math.floor(plan.initial*.55)){kind='hoist';x=sites.hoist.x;}if(i===7&&j===plan.initial-4){kind='keeper';x=sites.keeper.x;}
   const flying=G.HonroWorld.archetypes[kind]?.flying,y=ground(x)-(flying?160:0),uid=kind==='keeper'?'act2-keeper':kind==='hoist'?'act2-hoist':'a2-enemy-'+j;
   st.units.push({...G.HonroUnits.record(kind,uid,x,y,'enemy'),spawnIndex:j,behavior:'patrol',stageOverrides:{honroCohort:cohort,honroAct2Elite:elite,honroAct2Revision:2}});
   space.encounterSites.push({id:uid,unitId:uid,cohort,roomId:roomAt(l.rooms,x),surfaceId:'floor-main',x,y,supportY:ground(x),flying:!!flying});
  }
  for(const [j,s] of d.steps.entries()){
   const site=sites[s.id],{x,y}=site,m={id:s.id,type:'act2',x,y,label:s.label,action:'act2',...(s.requiredClass?{requiredClass:s.requiredClass}:{})};
   if(s.kind==='destroy'){
    delete m.action;const target=site.target,ty=target.y-38;
    st.terrains.push(solid(s.id,[[x-24,ty],[x+24,ty],[x+25,ty+76],[x-25,ty+76]],{hp:100,maxHp:100,honroSeal:true,honroAct2Target:true,honroRockfall:['rock-pin','collapse-pin','exit-pin'].includes(s.id)},true,'wood'));m.id='marker-'+s.id;m.y=target.y;
    if(s.id==='shaft-pin')st.initialState.honroCaveHangingTarget={x,roofY:yAt(roof,x),targetY:ty};
   }else if(['defeat','clear','hold','reach','escort'].includes(s.kind)){delete m.action;if(['reach','escort'].includes(s.kind))m.type='exit';}
   else elem('act2:ritual',x,y,.7,'goal-'+j,'prop');
   if(s.kind==='hold'){elem('act2:ritual',x,y,1,'defense-'+j,'prop');const wx=Math.min(width-250,x+740);st.markers.push({id:'wave-'+s.id,type:'act2-wave',x:wx,y:ground(wx)});}
   if(s.kind==='rescue'){
    const uid='resident-'+j,spiritId='resident-spirit-'+j,nx=x+45,sx=x+115;
    st.units.push({...G.HonroUnits.record('object:civilian',uid,nx,ground(nx),'npc'),label:i===5?'잠운사 승려':'동굴 주민',stageOverrides:{hp:950,maxHp:950,h:92,r:22,honroProtected:true,honroCivilian:true,fixed:true}});
    st.units.push({...G.HonroUnits.record(i===5?'monkVessel':'resonance',spiritId,sx,ground(sx)-135,'enemy'),spawnIndex:60+j,stageOverrides:{honroCohort:'resident',honroAct2Revision:2}});m.target=uid;m.spiritId=spiritId;
   }
   st.markers.push(m);
  }
  for(const [j,x] of plan.lamps.entries()){st.markers.push({id:'spirit-lamp-'+j,type:'act2',action:'act2',label:'원혼등불 · 주변 혼령 현형',x,y:ground(x),radius:1200});elem('act2:lamp',x,ground(x),1.4,'spirit-lamp-'+j,'prop');}
  st.markers.push({id:'wave',type:'act2-wave',x:width-650,y:ground(width-650)});
  if(i===6)st.markers.push({id:'rebuild-brace',type:'act2',action:'act2',label:'낙석 치우기',x:3270,y:ground(3270),collected:true});
  if(l.objectiveX!==undefined){const x=l.objectiveX;st.units.push({...G.HonroUnits.record('object:civilian','objective',x,ground(x),'npc'),label:i===9?'생존자 행렬':'피난 주민',stageOverrides:{honroProtected:true,honroCivilian:true,hp:i===9?2600:1900,maxHp:i===9?2600:1900,r:25,h:92,fixed:i!==9,walkSpeed:240,moveLeft:850,maxMove:850}});}
  for(const [key,x,h,,broken=false,surfaceId] of gates){const support=surfaceId?st.terrains.find(t=>t.id===surfaceId):null,gy=support?support.points[0].y:ground(x);st.terrains.push(solid(key,[[x-25,gy-h],[x+25,gy-h],[x+25,support?gy:ground(x+25)],[x-25,support?gy:ground(x-25)]],{hp:99999,maxHp:99999,honroCave:true,broken,...(surfaceId?{honroSupportSurfaceId:surfaceId}:{})}));}
  if(i===1){const x1=3000,x2=4150;floor.properties.honroRestoredVertices=clone(floor.points);const collapse=contour([[x1,ground(x1)],[x1+210,ground(x1+210)+120],[x1+430,ground(x1+430)+340],[x2-300,ground(x2-300)+300],[x2-130,ground(x2-130)+100],[x2,ground(x2)]]);floor.points=points([...route.map(([x,y])=>[x,x>x1&&x<x2?yAt(collapse,x):y]),[width,height+240],[0,height+240]]);floor.properties.honroWalkEdges=Array.from({length:floor.points.length-3},(_,j)=>j);space.surfaces[0].edgeIndices=clone(floor.properties.honroWalkEdges);space.surfaces[0].restoredEdgeIndices=Array.from({length:route.length-1},(_,j)=>j);}
  const env=G.HonroEnvironment.makeEnvironment(st,{preset:cave?'enclosed':i===0?'forest':'valley'});
  env.atmosphere={preset:cave?'enclosed':i===0?'forest':'valley',overrides:cave?{skyTop:'#07080a',skyBottom:'#0a0b0d',ambientTint:'#17181b',hazeColor:'#0c0d10',shadowTint:'#090a0c',lightStrength:.10,mistStrength:.015,hazeStrength:.20,farFogColor:'#0b0c0e',nearFogColor:'#101114'}:i===9?{skyTop:'#687b86',skyBottom:'#dec39e',ambientTint:'#8b8e79',hazeColor:'#b7ab96',farFogColor:'#d4c9ad',nearFogColor:'#d3bfa1',keyLightColor:'#ffdb9d',keyLightDirection:[.77,.15],glowColor:'#f6c888',shadowTint:'#394447',lightStrength:.40,mistStrength:.30}:{}};
  env.skyVisible=!cave;st.environment=env;
  const primary=space.landmarks.find(x=>x.kind==='bell')||sites[d.steps[Math.floor(d.steps.length/2)].id];
  space.views=[{id:'entry',x:320,y:ground(320)-300,zoom:.6,roomId:l.rooms[0][0],focus:'room'},{id:'signature',x:primary.x,y:primary.y-450,zoom:id===18||id===19?.35:.5,roomId:primary.roomId,focus:primary.kind?'landmark':'objective'},{id:'overview',x:width/2,y:height/2,zoom:.25,roomId:l.rooms[Math.floor(l.rooms.length/2)][0],focus:'room'},{id:'exit',x:end.x,y:end.y-250,zoom:.5,roomId:end.roomId,focus:'objective'}];
  st.meta={notes:'2-'+(i+1)+' '+d.name+' · 방 단면 개편 3 · '+plan.rounds.join('–')+'턴 설계',seed:2210+i};
  const errors=validateSpace(st);if(errors.length)throw Error(errors.join('\n'));p.stages.push(st);
 }
 p.stages.sort((a,b)=>(stageOrder.get(a.id)??a.metadata.stageId)-(stageOrder.get(b.id)??b.metadata.stageId));
 const domain=project.stages.some(st=>st.terrainDomainVersion===1)&&G.HonroTerrainDomain?G.HonroTerrainDomain.author(p):p;
 return G.HonroObjectiveRevision&&project.stages.some(st=>st.initialState?.honroObjectiveRevision>=G.HonroObjectiveRevision.version)?G.HonroObjectiveRevision.author(domain,{minStage:11,maxStage:20}):domain;
}
// Standalone, read-only authoring validation. Runtime import validation can call
// this same function after loading the recipe; no mutation or geometry repair.
function validateSpace(st){if(!G.HonroSpaceLayout)throw Error('Shared spatial validator must be loaded before the Act 2 recipe');return G.HonroSpaceLayout.validate(st);}
G.HonroAct2SpacePlan={version:1,geometryRevision:3,layouts,forStage:id=>clone(layouts[id-11]),validate:validateSpace};
G.HonroAct2Design={build,profiles,heights,yAt};
})(globalThis);
