(function(G){'use strict';if(G.HonroAct4ReviewArt)return;
// Native authored art for the isolated review maps. The same vector/terrain
// renderer, depth groups and full geological polygons remain authoritative.
const C=G.HONRO_CORE,clone=x=>JSON.parse(JSON.stringify(x)),pt=a=>a.map(([x,y])=>({x,y}));
const path=(d,fill,opacity=1)=>({tag:'path',d,fill,stroke:'none',opacity});
const poly=(a,fill)=>path('M'+a.map(p=>p.join(' ')).join('L')+'Z',fill);
function vector(id,box,nodes,{collision=[],height=8}={}){return{id,name:id,category:'architecture',visual:[],collision,anchor:{x:0,y:0},sockets:[],tags:['act4-reviewed-art'],params:{approvedArtRevision:8},reference:{heightM:height,bounds:{x:box[0],y:box[1],w:box[2],h:box[3]},foot:{x:0,y:0},scaleRange:[.1,4],backgroundRange:[.1,4]},vector:{version:1,viewBox:box,root:{tag:'g',fill:'none',stroke:'none',children:nodes}}};}
function bamboo(id,variant=0){const nodes=[];
 const stems=variant?[[98,1130,-82,13],[-108,860,52,9],[28,1010,87,11],[-28,1250,-40,15]]:[[-124,1020,-110,10],[-55,1190,39,14],[32,920,-46,9],[101,1320,115,13]];
 for(const [x,h,lean,w]of stems){
  nodes.push(path(`M${x-w} 8 Q${x+lean*.38-w} ${-h*.52} ${x+lean-w*.5} ${-h} L${x+lean+w*.5} ${-h} Q${x+lean*.38+w} ${-h*.52} ${x+w} 8Z`,'#446962'));
  nodes.push(path(`M${x} 0 Q${x+lean*.38+2} ${-h*.52} ${x+lean+2} ${-h} L${x+lean+w*.5} ${-h} Q${x+lean*.38+w} ${-h*.52} ${x+w} 0Z`,'#77968a'));
  for(const f of [.22,.44,.65,.84]){const y=-h*f,xx=x+lean*f*f;nodes.push(poly([[xx-w,y],[xx+w,y-2],[xx+w+1,y+5],[xx-w,y+8]],'#a0afa0'));}
  // Irregular sprays rather than repeated horizontal tiers of leafless poles.
  for(const [f,side]of [[.46,-1],[.69,1],[.89,-1]]){const y=-h*f,xx=x+lean*f*f,reach=(125+h*.05)*side;
   nodes.push(path(`M${xx} ${y} Q${xx+reach*.5} ${y-90} ${xx+reach} ${y-120} Q${xx+reach*.55} ${y-58} ${xx} ${y+5}Z`,'#486d62'));
   for(const [t,bend]of [[.38,-1],[.64,1],[.84,-1]]){const ax=xx+reach*t,ay=y-105*t,dx=side*(65+25*t),dy=bend*43-35;
    nodes.push(path(`M${ax} ${ay} Q${ax+dx*.75} ${ay+dy-35} ${ax+dx*1.35} ${ay+dy} Q${ax+dx*.4} ${ay+dy+13} ${ax} ${ay}Z`,bend>0?'#698576':'#527768'));
    nodes.push(path(`M${ax} ${ay} Q${ax-dx*.3} ${ay-72} ${ax-dx*.8} ${ay-100} Q${ax-dx*.5+24} ${ay-20} ${ax} ${ay}Z`,'#7a9480'));
   }
  }
 }
 nodes.push(path('M-165 8Q-98-18-68-6Q-16-21 10-3Q75-23 151 7L165 22Q49 11-24 25Q-105 10-174 21Z','#425f51'));
 return vector(id,[-400,-1440,800,1500],nodes,{height:17});
}
function ruin(id,variant=0){const n=[];
 n.push(poly([[-550,0],[-530,-28],[530,-30],[585,15],[420,52],[-490,42]],'#4c5655'));
 n.push(poly([[-500,0],[-500,-300],[450,-300],[450,0]],'#3a4846'));
 n.push(poly([[450,-300],[560,-244],[560,0],[450,0]],'#303e3f'));
 // Large gaps expose an empty interior, with no glowing windows or ironwork.
 n.push(poly([[-470,-270],[-290,-270],[-290,0],[-470,0]],'#273737'));
 n.push(poly([[-220,-270],[50,-270],[50,0],[-220,0]],'#2c3b3b'));
 n.push(poly([[150,-266],[420,-266],[420,0],[150,0]],'#293a3c'));
 n.push(path('M-501-6L-492-310L-466-307L-472-6Z M-262 0L-275-295L-249-296L-233 0Z M83 0L70-290L99-293L113 0Z M440 0L424-310L449-310L469 0Z','#777366'));
 n.push(poly([[-503,-285],[-288,-281],[-303,-192],[-454,-178],[-477,-96],[-506,-102]],'#918c77'));
 n.push(poly([[168,-264],[419,-257],[404,-174],[354,-158],[345,-109],[190,-143]],'#7e8072'));
 n.push(poly([[181,-239],[348,-233],[330,-211],[198,-203]],'#aca18a'));
 if(variant===0){
  n.push(poly([[-514,-299],[-480,-353],[-150,-387],[119,-342],[130,-286]],'#414e46'));
  n.push(path('M-585-297Q-452-323-371-420L-132-459Q3-439 70-397L45-330L-146-370L-343-340Z','#46514c'));
  n.push(path('M-574-297L-341-353L-143-390L92-351L130-336L80-324L-144-367L-343-337Z','#8a8d77'));
  n.push(poly([[111,-340],[145,-350],[480,-47],[501,-22],[491,-14],[522,4],[495,0],[486,12],[478,-2],[164,-274]],'#655f50'));
  n.push(poly([[145,-350],[181,-335],[506,-35],[499,-24],[521,-23],[511,-10],[522,4],[495,0],[480,-47]],'#94917a'));
  n.push(poly([[-139,-453],[-82,-435],[82,-396],[43,-379],[-38,-403]],'#6f7e70'));

 }else{
  n.push(path('M-571-291L-382-373L-175-408L-41-360L90-379L312-320L559-285L395-293L112-334L-36-317L-178-352L-379-321Z','#4d5953'));
  n.push(path('M-563-292L-380-334L-176-367L-37-330L110-347L393-306L547-285L392-291L111-328L-38-311L-180-347L-380-314Z','#8d927c'));
  n.push(poly([[300,-318],[340,-302],[380,-76],[357,-65]],'#766f5c'));
 }
 n.push(poly([[-485,8],[-337,3],[-294,24],[-391,35]],'#aaa28a'));
 n.push(poly([[333,10],[418,-3],[477,21],[381,38]],'#777c6c'));
 n.push(poly([[485,-7],[543,-2],[575,15],[532,23]],'#92947f'));n.push(poly([[461,3],[516,0],[553,11],[518,19],[472,12]],'#293d3760'));n.push(poly([[526,4],[549,7],[566,24],[552,28],[537,18]],'#8b8873'));
 // Broken purlins and empty hinge sockets are wood cavities, not metal plates.
 n.push(poly([[-268,-236],[-252,-235],[-252,-216],[-266,-216]],'#253938'));
 n.push(poly([[-264,-79],[-248,-77],[-247,-58],[-263,-59]],'#253938'));
 return vector(id,[-600,-500,1220,570],n,{height:8});
}
const artAssets=[bamboo('a4:bamboo'),bamboo('a4-art:bamboo-lean',1),ruin('a4-art:home-ruin'),ruin('a4-art:workshop-ruin',1)];
artAssets.push(vector('a4-art:bare-doorframe',[-540,-390,1100,460],[
 poly([[-490,3],[-485,-42],[470,-39],[520,15],[390,45],[-490,40]],'#596259'),
 path('M-262 0L-279-306L-244-313L-222 0Z M-39 0L-34-288L-4-285L-5 0Z M-290-306L-289-336L5-308L2-279Z','#6c6e5e'),
 poly([[121,-28],[360,-43],[438,-6],[400,24],[150,29]],'#92917c'),poly([[-500,2],[-390,-35],[-300,-17],[-362,16]],'#737d6a')
],{height:6}));
artAssets.push(vector('a4-art:charred-frame',[-590,-440,1200,510],[
 path('M-510 0L-475-325L-446-317L-465 3Z M-92 0L-136-371L-104-377L-53 0Z M429 8L367-247L403-254L469 6Z','#3b443e'),
 path('M-495-313L-492-339L-117-395L-90-365Z M-114-365L-99-393L405-245L394-216Z','#575d4f'),
 poly([[-104,-373],[-76,-383],[301,-58],[340,0],[300,-10]],'#77715b'),poly([[-552,10],[-420,-31],[-240,-18],[-50,-38],[121,-18],[295,-39],[548,14],[341,43],[-452,45]],'#4d584c'),
 poly([[-335,18],[-281,-11],[-174,0],[-189,27]],'#878675')
],{height:7}));
artAssets.push(vector('a4-art:rubble-wall',[-370,-125,740,170],[
 poly([[-350,8],[-338,-58],[-246,-109],[-165,-88],[-93,-103],[-43,-45],[-51,7]],'#647063'),
 poly([[18,13],[39,-34],[106,-53],[183,-43],[248,-74],[336,-23],[360,12]],'#7d8472'),
 poly([[-333,-57],[-246,-109],[-165,-88],[-93,-103],[-59,-65],[-157,-55],[-245,-79]],'#9a9c84'),
 poly([[-20,17],[20,-6],[58,2],[49,27]],'#9f9b84'),poly([[269,25],[290,-5],[350,8],[334,32]],'#515f52'),poly([[-286,20],[-258,-8],[-203,3],[-204,30]],'#a29b83')
],{height:2.2,collision:[pt([[-350,8],[-338,-58],[-246,-109],[-165,-88],[-93,-103],[-43,-45],[-51,7]]),pt([[18,13],[39,-34],[106,-53],[183,-43],[248,-74],[336,-23],[360,12]])]}));
artAssets.push(vector('a4:reeds',[-180,-290,400,340],[-108,-79,-30,7,66,91].flatMap((x,i)=>{const h=[119,190,146,227,163,202][i],lean=[-35,5,-12,30,18,52][i];return[
 path(`M${x-2} 0Q${x+lean*.35-2} ${-h*.5} ${x+lean-2} ${-h}L${x+lean+2} ${-h}Q${x+lean*.35+2} ${-h*.5} ${x+2} 0Z`,'#84917c'),
 path(`M${x+lean-3} ${-h+7}Q${x+lean-15} ${-h-10} ${x+lean-2} ${-h-36}Q${x+lean+16} ${-h-12} ${x+lean+5} ${-h+9}Z`,'#a2a18b'),
 path(`M${x} -33Q${x+35} -93 ${x+55} -99Q${x+31} -61 ${x} -33Z`,'#72866f')];}),{height:3.8}));
artAssets.push(vector('a4-art:delta-bars',[-9000,-480,20000,960],[
 path('M-7500 60Q-6640-77-5830-85Q-5160-162-4580-44L-3800 24Q-4210 120-5120 108Q-6390 175-7500 60Z','#6c837b'),
 path('M-1600 18Q-1260-62-1110-78L-925-45L-780 100Q-1210 163-1600 18Z M-650-90Q-331-155 93-88Q595-115 1280-7L1540 85Q722 151 20 100Q-320 145-650-90Z','#73877b'),
 path('M2030 135Q2210-25 2760-31Q3070-123 3460-49L4030 55L4420 169Q3520 205 3030 138Q2570 205 2030 135Z','#688176'),
 path('M4850-45Q5380-225 5940-180Q6480-258 7200-114L8460 16Q7750 85 6940-7Q5640 63 4850-45Z','#789083'),
 path('M-650-50Q-96-79 466-38L1485 82Q526 82 50 48Q-320 95-650-50Z M2130 135Q2774 40 3360 57L4350 165Q3510 169 3000 112Z','#8b9d89'),
 path('M-793 18Q-320-26 177-6Q730 20 922 72Q239 45-112 66Q-590 55-793 18Z M5180-30Q6030-133 7090-71L8020 11Q6790 1 6130-22Z','#546e63')
],{height:12}));
artAssets.push(vector('a4-art:empty-foundation',[-600,-145,1200,210],[
 path('M-550 0L-502-71L413-82L552-9L445 24L-438 30Z','#5c665f'),
 path('M-518-9L-486-52L395-61L494-13L407 6L-432 16Z','#777b6a'),
 poly([[-490,-23],[-488,-88],[-369,-100],[-351,-40]],'#92917c'),poly([[301,-50],[322,-97],[433,-66],[442,-17]],'#4b5b52'),
 path('M-166-4C-164-77-12-111 93-67C171-25 112 14 5 17C-65 20-136 14-166-4Z','#3d4d46')
],{height:2.5}));
const thick=bamboo('a4-art:thick-leafy');thick.vector.root.children=thick.vector.root.children.map(node=>({...node,transform:[.55,0,0,.47,0,0]}));thick.vector.viewBox=[-230,-720,460,750];thick.reference.bounds={x:-230,y:-720,w:460,h:750};thick.reference.heightM=9;artAssets.push(thick);
const oldboat=vector('a4-art:abandoned-skiff',[-440,-180,900,230],[
 path('M-423-105Q-211-21 96-69L443-147L308-23Q26 38-246-5Z','#4b605e'),
 path('M-402-99Q-162-48 111-87L422-143L297-67Q7-5-233-33Z','#839084'),
 poly([[-183,-79],[-167,-91],[114,-25],[95,-13]],'#a19b80'),poly([[71,-65],[92,-73],[240,-5],[222,2]],'#6d7668'),
 poly([[-260,-61],[-248,-74],[-187,-125],[-175,-113]],'#a19c85')
],{height:2.5});artAssets.push(oldboat);
const roots=vector('a4-art:fallen-bamboo',[-500,-250,1000,320],[path('M-470-66L438-204L448-184L-466-45Z','#7e927f'),path('M-449-15L335-167L343-151L-447 0Z','#486b5e'),path('M-343 5L194-96L200-80L-339 22Z','#8e9e83'),poly([[-490,-58],[-457,-53],[-459,-30],[-488,-35]],'#a7b09b')],{height:3});artAssets.push(roots);
const rubble=artAssets.find(a=>a.id==='a4-art:rubble-wall'),rubbleFaces=[[[-360,8],[-320,-25],[-245,-95],[-170,-75],[-110,-85],[-25,-5],[-25,12]],[[0,13],[75,-35],[165,-32],[250,-64],[370,12]]];rubble.collision=[];rubble.visualRole='decoration';rubble.params.artRole='rear ruin debris; not firing cover';rubble.vector.root.children[0]=poly(rubbleFaces[0],'#647063');rubble.vector.root.children[1]=poly(rubbleFaces[1],'#7d8472');rubble.vector.root.children[2]=poly([[-320,-25],[-245,-95],[-170,-75],[-110,-85],[-60,-40],[-170,-45],[-245,-60]],'#9a9c84');
artAssets.find(a=>a.id==='a4-art:delta-bars').reference.heightM=12;
artAssets.find(a=>a.id==='a4-art:delta-bars').vector.root.children.push(
 path('M-900-220Q-600-90-450 80Q-370 260-160 360L220 410Q-20 220-110 80Q-170-170-400-250Z','#7b8f7f'),
 path('M2130-210Q2510-74 2520 110Q2580 316 2920 431L3370 422Q2820 233 2810 76Q2840-106 2540-229Z','#748d7e'),
 path('M5130-150Q5360 40 5170 211Q4990 336 5150 451L5580 460Q5390 342 5590 179Q5770 12 5490-194Z','#718a7a')
);
for(const x of [-740,-390,60,2180,2710,5210,5570])for(const [j,dx]of [[0,-19],[1,7],[2,29]])artAssets.find(a=>a.id==='a4-art:delta-bars').vector.root.children.push(path(`M${x+dx} -26Q${x+dx-6} -76 ${x+dx+j*10} ${-121-j*17}L${x+dx+j*10+4} ${-121-j*17}L${x+dx+5} -24Z`,'#82947e'));
// Sandbars sit low in the same water plane. Retain the forked channels while
// compressing the formerly hanging S forms and letting their tips submerge.
const delta=artAssets.find(a=>a.id==='a4-art:delta-bars');
delta.vector.root.children.push(
 path('M-103 292Q33 356 220 410L181 425Q-18 396-103 312Z','#88a6a9'),
 path('M2910 385Q3140 426 3370 422L3302 439Q3060 444 2910 406Z','#91acac'),
 path('M5160 416Q5394 443 5580 460L5531 473Q5330 467 5160 438Z','#8aa8a9'),
 path('M-125 327Q17 376 140 392L109 399Q-38 381-125 344Z','#b4c3b385'));
for(const node of delta.vector.root.children)node.transform=[.9,0,0,.28,0,40];
for(const [original,id]of [['a4:bamboo','a4-art:bamboo-background'],['a4-art:bamboo-lean','a4-art:bamboo-background-lean']]){const a=clone(artAssets.find(v=>v.id===original));a.id=id;const tone=node=>{if(/^#[0-9a-f]{6}$/i.test(node.fill||''))node.fill=G.HonroEnvironment.mixColor(node.fill,'#b0c0b8',.40);for(const c of node.children||[])tone(c);};tone(a.vector.root);artAssets.push(a);}

function install(s,library){const n=s.metadata.act4Preview;if(![31,35,36].includes(n))return;s.initialState.honroAct4ArtRevision=2;
 for(const a of artAssets){const i=library.findIndex(v=>v.id===a.id);if(i>=0)library[i]=clone(a);else library.push(clone(a));}
 if(n===35){s.terrains=s.terrains.filter(t=>!['a4-35-wall','a4-35-shelf'].includes(t.id));const t=s.terrains[0];t.points=pt([[0,1910],[540,1910],[920,1800],[1380,1800],[1840,1850],[2180,2010],[2650,2030],[2820,2030],[2910,1960],[2990,1960],[2990,1908],[3070,1908],[3070,1856],[3160,1856],[3380,1820],[3900,1810],[4390,1910],[4820,1900],[5340,1730],[5790,1730],[6220,1840],[6680,1860],[7200,1800],[7200,3100],[0,3100]]);}
 if(n===35){const land=s.terrains[0],i=land.points.findIndex(p=>p.x===920);land.points.splice(i,0,...pt([[660,1910],[660,1872],[760,1872],[760,1836],[860,1836],[860,1800]]));}
 if(n===31){const t=s.terrains[0],i=t.points.findIndex(p=>p.x===1920);t.points.splice(i,0,...pt([[1700,1840],[1780,1750],[1840,1840]]));s.materials.push({id:'a4-31-first-rill',kind:'shallow-water',terrainId:t.id,x1:2280,x2:2850,depth:18,conductive:true},{id:'a4-31-dock-rill',kind:'shallow-water',terrainId:t.id,x1:4910,x2:5320,depth:14,conductive:true});}
 const geometry=s.terrains.map(t=>G.HonroGeometry.terrain(t,s.height));
 const floor=(x,reference)=>G.HonroMapEngine.surfaceY(geometry,x,reference)?.y??2000;
 let decorSerial=0;const add=(assetId,x,scale=1,reference,rotation=0)=>s.elements.push({id:'a4-art-'+n+'-extra-'+decorSerial++,assetId,x,y:floor(x,reference),scale,rotation,snap:false,depthLayer:'L1',layer:'back'});
 if(n===31){
  // Break the ruled-paper water into tapered irregular water ribbons and low
  // silt islands. Those are distance scenery, not hidden collision platforms.
  const water=library.find(a=>a.id==='a4:estuary-water');water.visual=water.visual.slice(0,3);
  for(const [x,y,w]of [[-800,-365,1850],[1600,-312,2340],[4370,-350,1690],[140,-220,1400],[2860,-205,1790],[5480,-180,2010],[-600,-72,900],[1150,-30,770],[3800,-65,1070],[6100,-36,1270]])water.visual.push({points:pt([[x,y],[x+w*.31,y-7],[x+w*.7,y+4],[x+w,y-2],[x+w*.72,y+8],[x+w*.22,y+5]]),fill:'#b0c3c180'});
  water.visual.push({points:pt([[1870,-171],[2070,-195],[2390,-181],[2610,-146],[2460,-136],[2170,-155]]),fill:'#657d78'});
  add('a4-art:abandoned-skiff',2560,.75);s.elements=s.elements.filter(e=>e.assetId!=='a4:reeds');for(const [x,z]of [[420,.5],[487,.85],[590,.7],[1190,.95],[1250,.55],[1840,.7],[2230,.55],[2267,1.1],[2390,.85],[3120,.4],[3170,.65],[4520,.7],[4590,1],[4670,.65],[5880,.65],[6010,.9]])add('a4:reeds',x,z);
  const id='a4-delta-mid',support='landscape-a4-delta-support',distantWater=clone(water);distantWater.id='a4-art:delta-water';distantWater.category='environment';distantWater.reference.heightM=distantWater.reference.bounds.h/60;library.push(distantWater);s.elements=s.elements.filter(e=>e.assetId!=='a4:estuary-water');s.environment.groups.push({id:id+'-water',depthLayer:'L2',verticalMode:'WORLD',zoneId:'landscape',x:0,y:1900},{id,depthLayer:'L2',verticalMode:'WORLD',zoneId:'landscape',x:0,y:1600});s.environment.surfaces.push({id:support+'-water',groupId:id+'-water',kind:'rear-ground',points:pt([[-22000,0],[22000,0]]),bottom:28000});s.environment.surfaces.push({id:support,groupId:id,kind:'rear-ground',points:pt([[-22000,0],[22000,0]]),bottom:28000});s.environment.placements.push({id:'a4-31-delta-water',assetId:distantWater.id,depthLayer:'L2',groupId:id+'-water',supportId:support+'-water',x:0,y:0,scale:1,rotation:0},{id:'a4-31-delta-branches',assetId:'a4-art:delta-bars',depthLayer:'L2',groupId:id,supportId:support,x:1000,y:0,scale:1,rotation:0});
  Object.assign(s.environment.atmosphere.overrides,{waterBaseColor:'#5f848b',waterHighlightColor:'#b9cfce',waterfallFoamColor:'#cad5cc'});
 }
 if(n===35){
  s.elements.filter(e=>e.assetId==='a4:bamboo').forEach((e,i)=>{e.assetId=i%2?'a4-art:bamboo-background-lean':'a4-art:bamboo-background';e.scale*=.85;});
  add('a4-art:fallen-bamboo',2280,.65);add('a4:old-wall',4140,1.05);add('a4-art:rubble-wall',4280,.4);add('a4-art:rubble-wall',3990,.16);
  // Back-plane buttresses and roots meet actual ground beneath the finite
  // walkways; they are not new collision or dummy geological skirts.
  const supports=vector('a4-art:walkway-support',[-240,-500,480,550],[path('M-132 8L-111-322L-73-378L-29-365L-57 6Z','#596e65'),path('M48 8L63-340L100-402L130-385L117 15Z','#425d55'),path('M-170 10Q-39-42 163 14L183 43Q-17 17-183 38Z','#5f745e')],{height:7});library.push(supports);
  // The former ramp/post/deck construction is retired. All three clearings
  // now join real soil, eroded shelves and low stone cover.
  const source=library.find(a=>a.id==='a4:thick-bamboo'),leafy=clone(thick);leafy.id=source.id;leafy.collision=source.collision;library[library.indexOf(source)]=leafy;
 }
 if(n===36){
  for(const e of s.elements.filter(e=>/^a4-36-house/.test(e.id))){e.assetId=e.x===1520?'a4-art:bare-doorframe':e.x===4550||e.x===5740?'a4-art:charred-frame':'a4-art:home-ruin';e.scale=e.x===2570?1:e.x===4550?.9:.7;e.y=floor(e.x);}
  add('a4-art:rubble-wall',1870,1);add('a4-art:rubble-wall',5260,.75);add('a4-art:fallen-bamboo',5540,.4);
  add('a4-art:empty-foundation',3540,.8);const door=s.elements.find(e=>e.assetId==='a4:door');if(door)door.x=2460;
 }
 for(const e of s.elements){if(e.assetId==='a4:thick-bamboo')e.y=floor(e.x);}
 for(const u of s.units)u.y=floor(u.x);
 // Distinct world silhouettes retain common time of day. Dense bamboo blocks
 // the horizon inland; the abandoned village keeps a low, open forest rim.
 if(n===35){for(const p of s.environment.placements.filter(p=>p.assetId==='a4:bamboo')){p.assetId=p.x%3?'a4:bamboo':'a4-art:bamboo-lean';p.scale*=.84;}Object.assign(s.environment.atmosphere.overrides,{hazeStrength:.85,farFogColor:'#bac8c5'});}
 if(n===36)for(const p of s.environment.placements.filter(p=>/^a4-far/.test(p.id))){p.assetId='a4-art:home-ruin';p.scale*=.78;}
}
const palettes={31:{top:'#7b8276',light:'#9c9d89',body:'#5b685e',seam:'#3f514a',deep:'#263c3d'},35:{top:'#788c80',light:'#98a58e',body:'#4b6460',seam:'#314c43',deep:'#253c3b'},36:{top:'#85857a',light:'#a29b88',body:'#69685c',seam:'#494e44',deep:'#2d3935'}};
const forms=new WeakMap();
function prepare(t){let q=forms.get(t);if(q)return q;const vertices=C.poly(t),shape=new Path2D();vertices.forEach((p,i)=>i?shape.lineTo(p.x,p.y):shape.moveTo(p.x,p.y));shape.closePath();
 const top=[];for(let i=0;i<vertices.length-1;i++){const a=vertices[i],z=vertices[i+1];if(z.x>a.x+.1)top.push([a,z]);}
 top.sort((a,z)=>a[0].x-z[0].x);
 const band=(near,far,phase)=>{const line=top.length?[top[0][0],...top.map(e=>e[1])]:[];if(!line.length)return null;const p=new Path2D();for(const [i,v]of line.entries()){const y=v.y+near+Math.sin(v.x/570+phase)*23;i?p.lineTo(v.x,y):p.moveTo(v.x,y);}for(const v of line.slice().reverse())p.lineTo(v.x,v.y+far+Math.sin(v.x/890+phase)*39);p.closePath();return p;};
 q={shape,top,coastCap:band(0,55,.3),bands:[band(18,116,.3),band(155,335,1.4),band(395,570,2.2)]};forms.set(t,q);return q;
}
function draw(scene,c,t,b){if(!(b?.honroCustom||b?.honroAct4Official===1)||b.honroAct4ArtRevision!==2||t.honroElementCollision)return false;const n=b.honroAct4Preview,p=palettes[n];if(!p||t.mat==='wood')return false;const q=prepare(t),top=Math.min(...q.top.flat().map(v=>v.y)),g=c.createLinearGradient(0,top,0,top+1900);g.addColorStop(0,p.top);g.addColorStop(.23,p.body);g.addColorStop(1,p.deep);c.save();c.fillStyle=g;c.fill(q.shape);c.clip(q.shape);
 if(n>=32&&![35,36].includes(n)){if(q.coastCap){c.fillStyle=p.top;c.fill(q.coastCap);}const faces=({34:[[670,1730,860],[2990,1860,1190],[5310,1910,940]],38:[[260,1780,740],[2730,1510,980],[4820,1760,870]],39:[[370,1490,750],[2190,1940,1230],[5290,1630,890]]})[n]||[];for(const [x,w,d]of faces){const a=C.topAt(t,x,NaN),z=C.topAt(t,x+w,NaN);if(!Number.isFinite(a)||!Number.isFinite(z))continue;c.fillStyle=p.top+'45';c.beginPath();c.moveTo(x,a+42);c.lineTo(x+w*.43,a+110);c.lineTo(x+w,z+65);c.lineTo(x+w*.82,z+d*.72);c.lineTo(x+w*.26,a+d);c.lineTo(x+w*.13,a+d*.5);c.closePath();c.fill();}}else if(q.bands[0]&&n!==31){c.fillStyle=p.light+'70';c.fill(q.bands[0]);}
 // Broad interrupted planes belong to the banks and house plots, not three
 // identical stripes across every landscape.
 const patches=n===31?[[0,1860,70,310],[2170,1080,110,400],[3890,930,90,440],[5160,1160,160,350]]:n===35?[[120,1710,100,420],[2130,1100,180,550],[3710,1280,120,370],[5330,1460,90,470]]:[[600,1510,110,330],[2320,1180,190,430],[4010,1530,100,480],[5740,1120,160,390]];
 for(const [x,w,near,deep]of patches){const y=C.topAt(t,x,0),z=C.topAt(t,x+w,0);if(!Number.isFinite(y)||!Number.isFinite(z))continue;c.fillStyle=p.seam+'20';c.beginPath();c.moveTo(x,y+18);c.bezierCurveTo(x+w*.25,y-17,x+w*.62,z+70,x+w,z+30);c.lineTo(x+w*.84,z+deep);c.bezierCurveTo(x+w*.5,z+deep+35,x+w*.21,y+deep-65,x+45,y+deep);c.closePath();c.fill();}
 if(n===31){for(const [x,w,d]of [[260,540,85],[1330,610,125],[2610,470,65],[4150,560,115],[5410,540,90]]){const y=C.topAt(t,x,0);if(!Number.isFinite(y))continue;c.fillStyle='#455c5035';c.beginPath();c.moveTo(x,y+10);c.bezierCurveTo(x+w*.32,y+12,x+w*.5,y+d,x+w,y+d*.8);c.lineTo(x+w,y+d+32);c.bezierCurveTo(x+w*.5,y+d+20,x+w*.27,y+44,x,y+40);c.closePath();c.fill();}}
 if(n===35){for(const [x,side]of [[450,1],[1820,-1],[2680,1],[4000,-1],[5840,1]]){const y=C.topAt(t,x,0);if(!Number.isFinite(y))continue;c.fillStyle='#3e5545';c.beginPath();c.moveTo(x-28,y-3);c.bezierCurveTo(x+side*60,y+3,x+side*110,y+31,x+side*265,y+45);c.lineTo(x+side*280,y+55);c.bezierCurveTo(x+side*120,y+54,x+side*58,y+19,x+22,y+5);c.closePath();c.fill();c.fillStyle='#596b51';c.beginPath();c.moveTo(x+side*78,y+17);c.quadraticCurveTo(x+side*110,y+58,x+side*174,y+87);c.lineTo(x+side*183,y+88);c.quadraticCurveTo(x+side*139,y+48,x+side*92,y+16);c.closePath();c.fill();}}
 if(n===36){for(const [x,w]of [[980,510],[1940,760],[4320,990],[5710,640]]){const y=C.topAt(t,x,0);if(!Number.isFinite(y))continue;for(let k=0;k<3;k++){const xx=x+k*w*.26,yy=y+45+(k%2)*28;c.fillStyle=k===1?'#5c635a':'#929080';c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+w*.29,yy-12);c.lineTo(xx+w*.34,yy+92);c.lineTo(xx-16,yy+105);c.closePath();c.fill();}}}
 c.restore();return true;
}
if(G.HonroScene){const old=G.HonroScene.prototype.terrain;G.HonroScene.prototype.terrain=function(c,t,...args){if(draw(this,c,t,this.battle))return;return old.call(this,c,t,...args);};}
const createUnit=G.HonroUnits.create;G.HonroUnits.create=function(record,b,...args){const u=createUnit(record,b,...args);if((b.honroCustom||b.honroAct4Official===1)&&b.honroAct4Preview===36&&record.stageOverrides?.honroAct4RewardTag==='eq-hw-36'){u.elite=true;u.hp=u.maxHp=Math.round(u.maxHp*1.55);u.attack*=1.15;if(u.combatBaseHp)u.combatBaseHp*=1.55;u.honroAct4EliteTuned=1;}return u;};
G.HonroAct4ReviewArt={install,revision:2,palettes,assets:()=>clone(artAssets)};
})(globalThis);
