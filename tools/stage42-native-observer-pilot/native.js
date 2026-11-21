// Observe only real detached raster allocations; never touch or read the main canvas.
(q)=>{
 'use strict';
 const G=globalThis,a=G.HonroApp,s=a?.scene,b=a?.engine?.b,V=G.HonroVectorArt,K='__honroS42NativePilot',p=G[K];
 if(q.op==='phase'){if(!p||!['first','allocate','hit'].includes(q.phase))throw Error('bad observer phase');p.phase=q.phase;return true;}
 if(q.op==='commit'){
  if(!p)throw Error('no native observer');
  if(p.phase===p.q.pose.targetPhase){
   const expected=p.q.pose.viewKind==='tile'?s._domainTiles?.tiles.get(p.q.pose.target)?.canvas:s._screenWorldCache?.canvas;
   p.bound=p.surfaces.size===1&&p.surfaces.has(expected);
  }
  return {bound:p.bound,events:p.events.filter(e=>e.phase===p.phase).length};
 }
 if(q.op==='finish'){
  if(!p)throw Error('no native observer');
  try{return {events:p.events,errors:p.err,bound:p.bound,untouchedMain:p.untouchedMain};}
  finally{p.undo();p.surfaces.clear();delete G[K];}
 }
 if(q.op!=='install'||p||!s||!V||b?.honroStage!==42||b.honroCanonical!==true||b.honroMapOrigin!=='campaign'||
    b.honroAuthoredId!=='stage-42'||devicePixelRatio!==1||G.HonroTerrainDomain?.active(b)!==true)throw Error('need signed normal stage');
 function hook(o,k,f){
  const d=Object.getOwnPropertyDescriptor(o,k),native=o[k];
  if(typeof native!=='function')throw Error('absent native '+k);
  Object.defineProperty(o,k,{value:f(native),configurable:true,writable:true,enumerable:d?.enumerable??false});
  return ()=>d?Object.defineProperty(o,k,d):delete o[k];
 }
 const store={q,phase:null,events:[],err:[],surfaces:new Set(),bound:false,untouchedMain:true,undo:null};
 const array=m=>[m.a,m.b,m.c,m.d,m.e,m.f], raw=c=>G.HonroVisualStyle?.raw(c)??c;
 const same=(x,y)=>x.length===y.length&&x.every((n,i)=>Math.abs(n-y[i])<1e-7);
 function spot(cv,[x,y],m){
  const u=Math.floor(m[0]*x+m[2]*y+m[4]),v=Math.floor(m[1]*x+m[3]*y+m[5]);
  if(u<2||v<2||u+2>=cv.width||v+2>=cv.height)throw Error('readback left native target');
  const out=new OffscreenCanvas(5,5),cc=out.getContext('2d',{alpha:true,willReadFrequently:true});
  cc.imageSmoothingEnabled=false;cc.drawImage(cv,u-2,v-2,5,5,0,0,5,5);
  return {world:[x,y],anchor:[u,v],rect:[u-2,v-2,5,5],rgba:Array.from(cc.getImageData(0,0,5,5).data)};
 }
 function rec(tag,c,base){
  try{
   if(store.events.length>=16)throw Error('unexpected native event count');
   store.events.push({phase:store.phase,tag,matrix:array(c.getTransform()),basis:base,
     spots:q.pose.points.map(x=>spot(c.canvas,x,base))});
  }catch(e){store.err.push(String(e));}
 }
 function role(art,l){
  if(art?.id===l.asset.id&&art.vector?.root?.children?.[0]?.clipPath==='a'&&art.vector.root.children[0].children?.length===16)return 'original-root';
  if(art===l.asset.edgeWall)return 'body';
  if(art===l.asset.edgeSurface)return 'surface';
  if(art?.id===l.asset.id&&art.vector?.root?.children?.length===1)return 'props';
  return 'unclassified';
 }
 store.undo=hook(s,'landmark',landmark=>function(c,l,...rest){
  if(store.phase!==q.pose.targetPhase||l?.id!=='a5-near'||l?.asset?.id!=='act5:near:42'||
     !same([s.x,s.y,s.scale],q.center)||!same([l.x,l.y,l.scale,l.rotation??0],[0,0,6500/2022,0]))
   return Reflect.apply(landmark,this,[c,l,...rest]);
  const target=raw(c),cv=target.canvas,m=array(target.getTransform());
  const size=q.pose.viewKind==='tile'?[516,516]:q.backing;
  if(cv===s.canvas||cv.isConnected||!same([cv.width,cv.height],size)||!same(m,q.pose.matrix))
   return Reflect.apply(landmark,this,[c,l,...rest]);
  store.surfaces.add(cv);
  rec('landmark:before',target,m);
  let restore;
  try{
   restore=hook(V,'draw',draw=>function(cc,art,...args){
    if(raw(cc)!==target)return Reflect.apply(draw,this,[cc,art,...args]);
    const r=role(art,l),result=Reflect.apply(draw,this,[cc,art,...args]);
    rec(r+':after',target,m);return result;
   });
   return Reflect.apply(landmark,this,[c,l,...rest]);
  }finally{restore?.();rec('landmark:after',target,m);}
 });
 Object.defineProperty(G,K,{value:store,configurable:true});return true;
}
