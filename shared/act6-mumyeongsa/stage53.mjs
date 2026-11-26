// 53-B: collision inputs remain editable independently of the library vectors.
export const hall53 = Object.freeze({
 entryX:425,
 passageX:2690,
 rooms:[
  {id:'gate-hall',name:'산문 뒤 회랑',x:425,y:2477},
  {id:'library',name:'중층 서고',x:1060,y:2110},
  {id:'broken-sanctuary',name:'파손 법당',x:1720,y:1857},
  {id:'upper-rail',name:'상부 파손 난간',x:2530,y:1112}
 ],
 walk:[[-305,2477],[600,2477],[850,2315],[1080,2110],[1350,1970],[1530,1840],
       [1700,1850],[1810,1770],[1930,1640],[2150,1430],[2310,1250],[2600,1060],[2995,1060]],
 forks:[
  {id:'library-balcony',name:'서고의 윗마루',points:[[795,2172],[1055,2010],[1280,1924],[1430,1898]]},
  {id:'sanctuary-beam',name:'법당의 들보 길',points:[[1600,1697],[1840,1585],[2020,1455],[2204,1369]]}
 ]
});
const point=([x,y])=>({x,y});
const polygon=(id,name,vertices,baseMaterial='rock')=>({
 id,name,type:'solid',points:vertices.map(point),baseMaterial,breakable:false
});
const path=(id,name,points,thickness,baseMaterial)=>({
 id,name,type:'platform',control:points.map(point),thickness,oneWay:true,
 baseMaterial,detail:{interpolation:'linear',roughness:0,optimizeEpsilon:0},breakable:false
});
const paint=(id,bounds,visual,layer='prop')=>({
 asset:{id,renderer:'vector',category:'terrain',layer,anchor:{x:0,y:0},bounds,collision:[],visual,sockets:[],params:{}},
 element:{id:'art-'+id,assetId:id,x:0,y:0,scale:1,rotation:0,snap:false,layer,
  depthLayer:layer==='back'?'L0':'L1',visualRole:'scenery'}
});
const face=(fill,v)=>({fill,points:v.map(point)});
const lips=(line,offset)=>[...line,...line.slice().reverse().map(([x,y])=>[x,y+offset])];
function rockBody53(asset,terrain){
 const hosts=terrain.filter(t=>['south','west','north','east'].includes(t.id));
 const paths=hosts.map(({points})=>{
  const area=points.reduce((sum,p,i)=>{
   const next=points[(i+1)%points.length];
   return sum+p.x*next.y-next.x*p.y;
  },0);
  const ordered=area<0?points.slice().reverse():points;
  return 'M'+ordered.map(p=>`${p.x} ${p.y}`).join('L')+'Z';
 });
 return {
  asset:{...asset,renderer:'vector',vector:{...asset.vector,
   clips:{rockBody:paths},root:{tag:'g',clipPath:'rockBody',children:[asset.vector.root]}}},
  element:{id:'art-'+asset.id,assetId:asset.id,x:0,y:0,scale:1,rotation:0,snap:false,
   layer:'prop',depthLayer:'L1',visualRole:'scenery'}
 };
}
function vector53(walk,forks){
 const floor=paint('m53-walk-fascia',{x:-305,y:1060,w:3300,h:2390},[
  face('#797160',lips(walk,16)),
  face('#625b50',lips(walk.map(([x,y])=>[x,y+17]),31)),
  ...forks.flatMap(r=>[
   face('#8a7961',lips(r.points,8)),
   face('#5d5045',lips(r.points.map(([x,y])=>[x,y+8]),15))
  ])
 ]);
 // Near floors are independent collision sources. These rear columns and
 // lintels establish room rhythm and keep all playable faces unobstructed.
 const arches=[
  {x:470,y:2477,w:410,h:340,color:'#5c5046'},
  {x:1040,y:2145,w:400,h:460,color:'#665a4b'},
  {x:1600,y:1844,w:365,h:410,color:'#5c534b'},
  {x:2420,y:1190,w:530,h:480,color:'#68584e'}
 ];
 const roomDetails=[
  face('#50504a',[[410,2423],[594,2408],[668,2428],[655,2471],[414,2477]]),
  face('#766453',[[457,2374],[533,2361],[545,2411],[465,2421]]),
  face('#4b3e36',[[1058,1830],[1406,1750],[1418,1868],[1074,1982]]),
  face('#796655',[[1071,1902],[1414,1813],[1414,1839],[1074,1937]]),
  face('#725d4a',[[1700,1510],[1802,1484],[1866,1504],[1907,1460],[1930,1476],[1868,1529],[1821,1515],[1698,1540]]),
  face('#514638',[[2247,1220],[2310,1165],[2442,1165],[2410,1223],[2305,1250]])
 ];
 const chambers=paint('m53-retained-timber',{x:325,y:670,w:2650,h:1830},[...roomDetails,...arches.flatMap(({x,y,w,h,color},i)=>{
  const end=x+w,top=y-h;
  return [
   face('#423d37',[[x-28,top+25],[end+30,top-12],[end+9,top+25],[x-32,top+56]]),
   face(color,[[x,top+48],[x+33,top+42],[x+30,y],[x+2,y+36]]),
   face(color,[[end-43,top+27],[end-10,top+23],[end-13,y-34],[end-47,y-12]]),
   face('#837259',[[x+44,top+94],[end-55,top+62],[end-62,top+83],[x+39,top+119]]),
   ...(i===1?[face('#76654e',[[x+68,y-170],[end-61,y-187],[end-61,y-176],[x+68,y-158]])]:[])
  ];
 })], 'back');
 return [floor,chambers];
}
function foundation53(){
 const west=paint('m53-west-buried-foundation',{x:-1345,y:1880,w:2910,h:2030},[
  face('#383b36',[[-260,1880],[-428,1932],[-479,2109],[-614,2228],[-612,2430],[-840,2635],[-910,2780],[-1110,2912],
    [-1345,3051],[-1260,3220],[-1100,3310],[-1000,3477],[-691,3542],[-468,3704],[-108,3790],[605,3910],
    [1190,3717],[1565,3420],[770,3279],[301,3100],[204,2720],[10,2538],[-62,2144]]),
  face('#444740',[[-260,1880],[-428,1932],[-479,2109],[-614,2228],[-612,2430],[-540,2484],[-416,2356],
    [-307,2140],[-176,2065],[-77,2084],[-62,2144]]),
  face('#484943',[[-1110,2912],[-910,2780],[-757,2704],[-689,2670],[-579,2520],[-434,2460],[-280,2430],[-105,2430],
    [-65,2520],[-255,2592],[-416,2734],[-442,2824],[-702,2913],[-742,3000],[-1035,3122],[-1230,3141],[-1345,3051]]),
  face('#3d403a',[[-1035,3122],[-742,3000],[-702,2913],[-541,2874],[-365,2898],[-213,3010],[-135,3174],[-188,3251],
    [-378,3217],[-522,3259],[-710,3365],[-910,3352],[-1201,3201]]),
  face('#323632',[[-910,3352],[-710,3365],[-522,3259],[-378,3217],[-188,3251],[232,3328],[607,3408],
    [785,3485],[1190,3717],[605,3910],[-108,3790],[-468,3704],[-691,3542],[-1000,3477]]),
  face('#3b3f39',[[-468,3504],[-213,3410],[45,3451],[260,3548],[527,3582],[702,3694],[518,3706],
    [195,3682],[-22,3607],[-280,3592]]),
  face('#4b4c44',[[-900,3001],[-770,2923],[-719,2882],[-615,2848],[-583,2875],[-708,2926],[-755,2982],[-880,3040]])
 ],'back');
 const east=paint('m53-east-jamb-bedrock',{x:3368,y:875,w:860,h:1608},[
  face('#42443e',[[3370,1052],[3496,1029],[3619,1048],[3755,1006],[3904,875],[4060,971],[4140,1132],[4120,1251],
    [4228,1384],[4178,1546],[4101,1640],[4085,1830],[3976,1954],[3963,2089],[3823,2296],[3650,2400],[3462,2483],
    [3390,2313],[3431,2201],[3368,1946],[3420,1796],[3404,1380]]),
  face('#515249',[[3550,1090],[3696,1060],[3819,984],[3931,929],[4043,1017],[4079,1116],[4020,1188],[3918,1179],
    [3800,1277],[3665,1307],[3540,1270]]),
  face('#393d38',[[3430,1448],[3557,1362],[3732,1333],[3873,1253],[3976,1212],[4086,1226],[4156,1318],[4105,1403],
    [3960,1448],[3821,1530],[3750,1531],[3664,1596],[3501,1620],[3410,1582]]),
  face('#4b4d44',[[3456,1668],[3605,1642],[3707,1580],[3837,1574],[3984,1482],[4153,1458],[4110,1566],[4044,1612],
    [3880,1666],[3768,1755],[3604,1818],[3454,1801]]),
  face('#373c37',[[3443,1900],[3604,1818],[3768,1755],[3880,1666],[4044,1612],[4084,1709],[4016,1780],
    [3948,1816],[3852,1944],[3683,1996],[3594,2072],[3416,2101]]),
  face('#454940',[[3468,2298],[3554,2192],[3713,2150],[3833,2033],[3931,1989],[3904,2118],[3793,2210],
    [3751,2280],[3632,2312],[3515,2391]]),
  face('#57564a',[[3682,1301],[3810,1253],[3918,1179],[4002,1186],[3930,1215],[3834,1284],[3748,1333]])
 ]);
 west.asset.params.paintBeyondTerrainDomain=true;
 east.asset.params.paintBeyondTerrainDomain=true;
 return {west,east};
}
function nativeY(line,x){
 const index=line.findIndex(([u])=>u>=x);
 const [a,ay]=line[index-1],[b,by]=line[index];
 return ay+(by-ay)*(x-a)/(b-a);
}
export function composeHall53(map,library,B,bedrock){
 const {walk,forks}=hall53;
 const upper=map.terrains.find(t=>t.id==='upper-threshold-footing');
 const retained=map.elements.find(e=>e.assetId==='approved-upper-door-sill-extension');
 if(!upper||!retained)throw Error('The original signed M09 sill is missing');
 const terrain=[
  polygon('south','네 방의 오름길',[...walk,[3425,1060],[3425,1515],[3376,1720],[3412,1940],
   [3328,2218],[3380,2526],[3285,2824],[3355,3060],[3170,3310],[2810,3428],[2300,3386],
   [1815,3450],[1302,3395],[895,3420],[415,3338],[-35,3360],[-242,3220],[-305,2880],[-267,2732],[-301,2598]]),
  ...forks.map(r=>path(r.id,r.name,r.points,27,'wood')),
  polygon('west','서쪽 기단 더미',[[-305,1460],[210,1310],[265,1730],[242,2070],[278,2477],[-280,2493],
   [-305,2365],[-278,2140],[-305,2005],[-257,1810],[-291,1620]]),
  polygon('north','북쪽 비어귀',[[-305,-165],[-90,-224],[370,-216],[785,-304],[1115,-267],[1555,-310],
   [2000,-235],[2460,-281],[2895,-225],[3244,-304],[3425,-212],[3425,181],[2480,243],
   [1810,280],[1090,365],[310,530],[-305,651],[-273,440],[-301,235],[-261,90],[-305,-35]]),
  polygon('east','동쪽 내벽',[[B.width,140],[B.width+305,120],[B.width+305,1480],[B.width,1480]]),
  ...B.terrain,
  upper
 ];
 const {west,east}=foundation53();
 const artwork=[west,rockBody53(bedrock,terrain),...vector53(walk,forks)];
 const positions={
  'draft-lower-lane-guard':{x:1100,y:nativeY(forks[0].points,1100)},
  'draft-upper-side-guard':{x:2905,y:1060}
 };
 const units=map.units.map(u=>u.team==='player'?{...u,x:hall53.entryX,y:nativeY(walk,hall53.entryX)}:{...u,...positions[u.id]});
 return {
  map:{...map,width:B.width,terrains:terrain,units,materials:[],
   playBounds:{...map.playBounds,right:B.width},
   terrainBounds:{...map.terrainBounds,top:Math.min(map.terrainBounds.top,B.assets[0].bounds.y),right:B.width+305},
   elements:[...artwork.map(a=>a.element),retained,...B.elements,east.element],
   objectives:[{...map.objectives[0]},{...map.objectives[1],label:'파손 난간 통과',x:B.wall.left,y:B.crossY}],
   routes:[...map.routes||[]]},
  library:[...library,...artwork.map(a=>a.asset),...B.assets,east.asset]
 };
}
