// 54-A after the shared lateral chamber. Keep the old foothill edge so the
// existing N→L→C→L charts and their receiving faces can still authenticate it.
export const observatory54={x:1400,halfWidth:30,support:'foothill'};
export function composeGallery54(map,library){
 const forks=[
  {id:'gallery-outer-balcony',name:'돌기둥 윗마루',points:[[624,2522],[695,2476],[795,2479],[889,2490],[979,2571]]},
  {id:'gallery-observation-beam',name:'관측 회랑 들보',points:[[1020,2454],[1118,2391],[1244,2380],[1318,2395],[1394,2459]]}
 ];
 const points=v=>v.map(([x,y])=>({x,y}));
 const floor=forks.map(f=>({id:f.id,name:f.name,type:'platform',control:points(f.points),thickness:20,
   oneWay:true,breakable:false,baseMaterial:'wood',detail:{interpolation:'linear',roughness:0,optimizeEpsilon:0}}));
 const layers=[];
 for(const f of forks){
  layers.push({fill:'#7e7162',points:points([...f.points,...f.points.slice().reverse().map(([x,y])=>[x,y+8])])});
  layers.push({fill:'#564d47',points:points([...f.points.map(([x,y])=>[x,y+8]),...f.points.slice().reverse().map(([x,y])=>[x,y+20])])});
 }
 const asset={id:'m54-observation-balconies',renderer:'vector',category:'terrain',layer:'prop',
  anchor:{x:0,y:0},bounds:{x:620,y:2370,w:780,h:230},collision:[],visual:layers,sockets:[],params:{}};
 const element={id:'art-'+asset.id,assetId:asset.id,x:0,y:0,scale:1,rotation:0,snap:false,layer:'prop',depthLayer:'L1',visualRole:'scenery'};
 const edge={id:'m54-exterior-buttress',renderer:'vector',category:'terrain',layer:'structural-back',
  anchor:{x:0,y:0},bounds:{x:3260,y:1420,w:304,h:1850},collision:[],sockets:[],params:{},
  visual:[
   ['#302e2d',[[3280,1430],[3400,1440],[3432,1660],[3510,1845],[3461,2075],[3564,2370],
    [3512,2545],[3534,2834],[3452,2950],[3480,3110],[3350,3270],[3260,3160]]],
   ['#3d3934',[[3334,1570],[3432,1660],[3510,1845],[3461,2075],[3400,1946],[3310,1834]]],
   ['#4b4239',[[3357,2100],[3461,2075],[3564,2370],[3512,2545],[3426,2422],[3379,2324]]],
   ['#393631',[[3317,2745],[3420,2650],[3534,2834],[3452,2950],[3480,3110],[3388,3015]]]
  ].map(([fill,vertices])=>({fill,points:points(vertices)}))};
 const outer={...element,id:'art-'+edge.id,assetId:edge.id,layer:edge.layer,depthLayer:'L0'};
 return {map:{...map,terrains:[...map.terrains,...floor],elements:[...map.elements,element,outer]},library:[...library,asset,edge]};
}
