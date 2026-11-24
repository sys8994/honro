// Signed Stage58 floor-face only. Relative depths are below the exact local-lower-08-body top.
// The larger slabs taper or break at authored joints; finer grain is limited to 20–65 WU below contact.
const groups=[
 ['west-canted-web','#4b5041',[[5062,85],[5178,59],[5271,74],[5329,36],[5392,45],[5507,103],[5485,158],[5410,193],[5281,155],[5191,149],[5117,109]]],
 ['west-rock-split','#595b49',[[5172,98],[5276,94],[5346,110],[5402,87],[5460,112],[5430,140],[5375,148],[5310,119],[5240,133]]],
 ['left-return-fall','#505443',[[5462,61],[5532,83],[5604,47],[5679,57],[5745,94],[5842,89],[5864,120],[5790,135],[5709,136],[5654,157],[5574,135],[5506,100]]],
 ['left-return-side','#585a48',[[5528,87],[5604,58],[5650,69],[5639,94],[5746,94],[5792,115],[5714,115],[5630,135],[5577,107]]],
 ['valley-leaning-mass','#4c5348',[[5632,182],[5708,150],[5824,117],[5884,122],[6034,95],[6112,123],[6082,178],[5998,258],[5902,289],[5791,249],[5731,246]]],
 ['valley-leaning-highlight','#565c4d',[[5790,171],[5865,140],[5939,148],[6037,123],[6087,128],[6002,183],[5921,224],[5832,215]]],
 ['valley-leaning-neg','#424b43',[[5784,250],[5895,222],[6017,200],[6116,146],[6107,202],[6028,252],[5938,278],[5864,275]]],
 ['ascending-bank-shoulder','#525746',[[6070,110],[6141,103],[6224,77],[6294,105],[6375,74],[6429,53],[6511,46],[6564,61],[6611,85],[6511,106],[6446,143],[6339,160],[6258,149],[6178,160]]],
 ['ascending-bank-fit','#60604d',[[6265,110],[6349,91],[6404,72],[6448,87],[6494,62],[6521,65],[6474,107],[6398,128],[6315,128]]],
 ['right-underbody','#465148',[[6232,215],[6319,157],[6432,165],[6499,117],[6597,107],[6706,99],[6771,144],[6691,202],[6634,210],[6550,248],[6375,277],[6274,263]]],
 ['right-under-lean','#545b4d',[[6388,215],[6499,154],[6568,163],[6675,118],[6736,129],[6670,173],[6589,199],[6524,231],[6466,210]]],
 ['metasediment-A','#5f604e',[[5128,27],[5161,30],[5189,22],[5218,31],[5202,47],[5163,39]]],
 ['metasediment-B','#696753',[[5292,33],[5333,21],[5365,27],[5349,46],[5303,49]]],
 ['metasediment-C','#5c5d4c',[[5451,24],[5479,31],[5518,25],[5533,37],[5508,42],[5471,46]]],
 ['metasediment-D','#686751',[[5582,33],[5620,22],[5644,27],[5662,39],[5626,50],[5591,45]]],
 ['metasediment-E','#5e6150',[[5721,33],[5759,27],[5796,35],[5833,26],[5800,47],[5751,48]]],
 ['metasediment-F','#676750',[[5899,36],[5923,20],[5962,24],[5977,34],[5940,43]]],
 ['metasediment-G','#5b5f4e',[[6030,37],[6077,29],[6107,26],[6094,46],[6055,51]]],
 ['metasediment-H','#676751',[[6158,31],[6191,22],[6223,28],[6251,21],[6234,40],[6196,46]]],
 ['metasediment-I','#5f6452',[[6274,38],[6319,34],[6346,22],[6371,27],[6352,44],[6308,52]]],
 ['metasediment-J','#676651',[[6455,29],[6482,23],[6518,23],[6537,36],[6504,43]]],
 ['metasediment-K','#596052',[[6596,33],[6628,26],[6657,27],[6684,23],[6671,43],[6634,48]]],
];
const point=(x,y)=>({x,y});
function inside(ps,x,y){let it=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){
 const a=ps[i],b=ps[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)it=!it;}return it;
}
export function attachStage58FloorFacets({G,app,e,scene,permit,verify,matte=true}={}){
 const b=e?.b,r=verify?.(permit,app,e,scene),R=G?.HonroTerrainReadability,C=G?.HONRO_CORE;
 if(!r||r.stage!==58||r.battle!==b||r.scene!==scene||b?.honroStage!==58||b.honroAuthoredId!=='stage-58'||
 b.mode!=='act6-isolated'||b.honroMapOrigin!=='act6-qa'||b.honroCustom!==false||!R?.prepare||!scene?._landmarkLayer||!scene?.terrainReadability)return null;
 const base=b.honroLandmarks,play=b.terrain,world=b.honroWorldTerrain,host=play.find(t=>t.id==='local-lower-08-body');
 const floor=base?.find(o=>o.id==='floor-facets'),orig=floor?.asset?.visual;
 if(!host||floor?.asset.id!=='floor-facets'||floor?.asset.collision.length!==0||floor?.collisionIds.length!==0||
   floor.x!==0||floor.y!==0||floor.scale!==1||floor.rotation!==0||orig?.length!==27||orig[0].fill!=='#6f6b57'||orig[0].points.length!==84)return null;
 const shape=C.poly(host),added=[];
 for(const [id,fill,coords] of groups){
  const points=coords.map(([wx,d])=>{const x=wx-1960; return point(x,Math.round((C.topAt(host,x)+d)*10)/10);});
  for(let i=0;i<points.length;i++){
   const a=points[i],z=points[(i+1)%points.length];
   for(let k=0;k<=12;k++){const x=a.x+(z.x-a.x)*k/12,y=a.y+(z.y-a.y)*k/12;if(!inside(shape,x,y)||y-C.topAt(host,x)<14)return null;}
  }
  added.push({id,fill,points});
 }
 // Preserve prior look outside the bounded trial; a polygon overlay close to the rim
 // modulates the old wash here, while restrained gaps leave marks legible.
 const wash=[3075,3135,3208,3310,3440,3510,3620,3688,3830,3968,4160,4392,4600,4720].map(x=>[x,C.topAt(host,x)]);
 const washShape={id:'slate-olive-transition',fill:'#5d5c4b',points:[...wash.map(([x,y])=>point(x,y+4)),...wash.slice().reverse().map(([x,y],i)=>point(x,y+[4,64,86,101,76,88,75,61,90,77,68,55,41,4][i]))]};
 const patches=[washShape,...added];
 const replacement={...floor,asset:{...floor.asset,visual:[...orig,...patches]}};
 const native=scene._landmarkLayer,rim=scene.terrainReadability;const stats={paint:0,light:0};
 const drop=()=>{
  scene._releaseDomainTiles?.();
  for(const k of ['_screenWorldCache','_screenForegroundCache'])if(scene[k]){scene._releaseRasterCanvas?.(scene[k].canvas);scene[k]=null;}
 };
 const owned=()=>verify(permit,app,e,scene)===r&&app.engine===e&&app.scene===scene&&e.b===b&&b.terrain===play&&b.honroWorldTerrain===world&&b.honroLandmarks===base;
 function layer(c,ls,...args){
  if(this!==scene||this.battle!==b||!owned()||!ls?.includes(floor))return native.call(this,c,ls,...args);
  stats.paint++;return native.call(this,c,ls.map(x=>x===floor?replacement:x),...args);
 }
 const light=new Set([R.STYLE.topLight,R.STYLE.woodLight].map(x=>x.toLowerCase()));
 function rim58(c,b0,...args){
  if(!matte||this!==scene||b0!==b||!owned()||scene.viewOptions?.debugTerrainOutline)return rim.call(this,c,b0,...args);
  const exact=R.prepare(b).groups.find(g=>g.id===host.id)?.top;
  if(!exact)return rim.call(this,c,b0,...args);
  const stroke=c.stroke;
  c.stroke=function(path,...p){
   if(path!==exact||!light.has(String(this.strokeStyle).toLowerCase()))return stroke.call(this,path,...p);
   stats.light++;const a=this.globalAlpha,w=this.lineWidth;
   const bounds=b.honroTerrainBounds,left=3075,right=4720;
   this.save();try{
    const clip=new G.Path2D();
    clip.rect(bounds.left-64,bounds.top-64,bounds.right-bounds.left+128,bounds.bottom-bounds.top+128);
    clip.rect(left,bounds.top-64,right-left,bounds.bottom-bounds.top+128);
    this.clip(clip,'evenodd');stroke.call(this,path,...p);
   }finally{this.restore();}
   this.save();try{
    const clip=new G.Path2D();clip.rect(left,bounds.top-64,right-left,bounds.bottom-bounds.top+128);this.clip(clip);
    this.globalAlpha=a*.31;this.lineWidth=w*.75;return stroke.call(this,path,...p);
   }finally{this.restore();}
  };
  try{return rim.call(this,c,b0,...args);}finally{c.stroke=stroke;}
 }
 drop();
 scene._landmarkLayer=layer;scene.terrainReadability=rim58;
 return Object.freeze({read:()=>({...stats,sourceFaces:orig.length,additionalFaces:patches.length,additionalNodes:patches.reduce((a,p)=>a+p.points.length,0),patchBytes:new TextEncoder().encode(JSON.stringify(patches)).length}),detach(){
  if(scene._landmarkLayer===layer)scene._landmarkLayer=native;
  if(scene.terrainReadability===rim58)scene.terrainReadability=rim;
  drop();
 }});
}
