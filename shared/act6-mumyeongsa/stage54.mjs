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
 // Both hosts use the same outer silhouette. The signed playable projection
 // and its two original end vertices continue into the original chart system.
 const outer=points([[3424,1535],[3392,1700],[3495,1870],[3448,2050],[3545,2295],
  [3480,2496],[3500,2740],[3428,2940],[3470,3095]]);
 const extend=vertices=>{
  const at=vertices.findIndex((p,i)=>p.x===3380&&p.y===1410&&vertices[i+1]?.x===3420&&vertices[i+1]?.y===3230);
  if(at<0)throw Error('The original gallery outer edge is missing');
  return [...vertices.slice(0,at+1),...outer,...vertices.slice(at+1)];
 };
 const terrains=map.terrains.map(t=>t.id==='foothill'?{...t,points:extend(t.points)}:t);
 const artwork=library.map(a=>a.id==='g00-foothill'
  ?{...a,visual:a.visual.map(f=>({...f,points:extend(f.points)}))}:a);
 return {map:{...map,terrains:[...terrains,...floor],elements:[...map.elements,element]},library:[...artwork,asset]};
}
