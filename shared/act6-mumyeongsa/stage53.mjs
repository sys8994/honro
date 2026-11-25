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
 const chambers=paint('m53-retained-timber',{x:325,y:670,w:2650,h:1830},arches.flatMap(({x,y,w,h,color},i)=>{
  const end=x+w,top=y-h;
  return [
   face('#423d37',[[x-28,top+25],[end+30,top-12],[end+9,top+25],[x-32,top+56]]),
   face(color,[[x,top+48],[x+33,top+42],[x+30,y],[x+2,y+36]]),
   face(color,[[end-43,top+27],[end-10,top+23],[end-13,y-34],[end-47,y-12]]),
   face('#837259',[[x+44,top+94],[end-55,top+62],[end-62,top+83],[x+39,top+119]]),
   ...(i===1?[face('#76654e',[[x+68,y-170],[end-61,y-187],[end-61,y-176],[x+68,y-158]])]:[])
  ];
 }), 'back');
 return [floor,chambers];
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
   [1815,3450],[1302,3395],[895,3420],[415,3338],[-35,3360],[-242,3220],[-305,2880]]),
  ...forks.map(r=>path(r.id,r.name,r.points,27,'wood')),
  polygon('west','서쪽 기단 더미',[[-305,1460],[210,1310],[265,1730],[242,2070],[278,2477],[-305,2530]]),
  polygon('north','북쪽 비어귀',[[-305,-165],[-90,-224],[370,-216],[785,-304],[1115,-267],[1555,-310],
   [2000,-235],[2460,-281],[2895,-225],[3244,-304],[3425,-212],[3425,181],[2480,243],
   [1810,280],[1090,365],[310,530],[-305,651]]),
  polygon('east','동쪽 내벽',[[B.width,140],[B.width+305,120],[B.width+305,1480],[B.width,1480]]),
  ...B.terrain,
  upper
 ];
 const artwork=[rockBody53(bedrock,terrain),...vector53(walk,forks)];
 const positions={
  'draft-lower-lane-guard':{x:1100,y:nativeY(forks[0].points,1100)},
  'draft-upper-side-guard':{x:2905,y:1060}
 };
 const units=map.units.map(u=>u.team==='player'?{...u,x:hall53.entryX,y:nativeY(walk,hall53.entryX)}:{...u,...positions[u.id]});
 return {
  map:{...map,width:B.width,terrains:terrain,units,materials:[],
   playBounds:{...map.playBounds,right:B.width},
   terrainBounds:{...map.terrainBounds,top:Math.min(map.terrainBounds.top,B.assets[0].bounds.y),right:B.width+305},
   elements:[...artwork.map(a=>a.element),retained,...B.elements],
   objectives:[{...map.objectives[0]},{...map.objectives[1],label:'파손 난간 통과',x:B.wall.left,y:B.crossY}],
   routes:[...map.routes||[]]},
  library:[...library,...artwork.map(a=>a.asset),...B.assets]
 };
}
