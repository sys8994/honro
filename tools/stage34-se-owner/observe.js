(q)=>{
 const a=globalThis.HonroApp,s=a?.scene,b=a?.engine?.b;
 if(!s||b?.honroStage!==34||b?.honroCustom!==false||!b?.honroCanonical)throw Error('stage identity');
 if(typeof s._landmarkLayer!=='function'||typeof s.landmark!=='function'||!HonroTerrainDomain.active(b))throw Error('no pinned Stage34 composition route');
 const clock=[s.x,s.y,s.scale,s.time], names=q.owners, raw=[],calls=[],st=HONRO_PROJECT.stages.find(x=>x.id===q.mapId);
 const state=()=>JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,
   objectives:st.objectives,water:b.water??null,tide:b.honroAct4PreviewState?.tide??null,phase:b.phase??null,round:b.round??null});
 const baselineState=state();
 for(const [eid,spec] of Object.entries(names)){
    const elems=st.elements.filter(x=>x.id===eid);
    if(elems.length!==1||elems[0].assetId!==spec.asset)throw Error('pin owner '+eid);
 }
 let lane=null;
 const original={landmark:s.landmark, layer:s._landmarkLayer};
 const own = Object.fromEntries(['landmark','_landmarkLayer'].map(k=>[k,Object.hasOwn(s,k)]));
 const rawSnapshot=(c,r)=>{
   // Exact browser readback bytes. PNG save and exposure/composition are handled separately.
   const im=c.getImageData(...r).data;let str='';
   for(let i=0;i<im.length;i+=8192)str+=String.fromCharCode(...im.subarray(i,i+8192));
   return btoa(str);
 };
 s._landmarkLayer=function(c,lands,layer){
  const saved=lane;lane=layer;
  try{return original.layer.call(this,c,lands,layer);}finally{lane=saved;}
 };
 s.landmark=function(c,l,...args){
  const spec=names[l.id], aid=l.asset?.id;
  if(!spec) {
   if(Object.values(names).some(row=>row.asset===aid))throw Error('unexpected runtime alias for '+aid);
   return original.landmark.call(this,c,l,...args);
  }
  if(aid!==spec.asset||lane!==spec.layer||l.honroElementCollision||l.collisionIds?.length)throw Error('owner runtime mismatch '+l.id+': '+aid+' '+lane);
  const m=c.getTransform(),cw=c.canvas.width,ch=c.canvas.height;
  if(m.b!==0||m.c!==0||m.a<=0||m.d<=0) throw Error('camera matrix outside proven axis bounds');
  const [lft,top,rgt,bot]=q.worldROI,clamp=(v,n)=>Math.min(n,Math.max(0,v));
  const x=clamp(Math.floor(m.a*lft+m.e)-2,cw),y=clamp(Math.floor(m.d*top+m.f)-2,ch);
  const X=clamp(Math.ceil(m.a*rgt+m.e)+2,cw),Y=clamp(Math.ceil(m.d*bot+m.f)+2,ch);
  // Capture each actual owner op on its actual tile, screen cache or frame.
  const meta={id:l.id,asset:aid,lane,worldMatrix:[m.a,m.b,m.c,m.d,m.e,m.f],surface:[cw,ch],
              opacity:c.globalAlpha,blend:c.globalCompositeOperation,materialClip:!!l.honroTerrainMaterialClip,
              direct:c.canvas===s.canvas,semantic:l.asset?.params?.semanticLayer,preservePalette:l.asset?.params?.preservePalette??null,intersectsROI:X>x&&Y>y};
  calls.push(meta);
  if(q.ablate===spec.group)return;
  if(!q.snap||!meta.intersectsROI)return original.landmark.call(this,c,l,...args);
  const rect=[x,y,X-x,Y-y],before=rawSnapshot(c,rect);
  const result=original.landmark.call(this,c,l,...args);
  const after=rawSnapshot(c,rect);
  raw.push({meta,rect,before,after});
  return result;
 };
 try{
  // Only ephemeral presentation caches, with no changed battle/map/profile/settings/camera.
  // Cold-build each capture and then warm the same pixel path used by archive.
  s._releaseDomainTiles?.();
  for(const key of ['_staticWorldCache','_screenWorldCache','_screenForegroundCache']){
   if(s[key]?.canvas)s._releaseRasterCanvas(s[key].canvas);
   s[key]=null;
  }
  const arr=[];
  for(let n=0;n<3;n++){s.render(a.engine,0,'',.6,false,0);arr.push(s.renderCacheStats?.());}
  if(state()!==baselineState||[s.x,s.y,s.scale,s.time].some((x,i)=>x!==clock[i]))throw Error('observer affected stage state/camera');
  const inside=calls.filter(x=>x.intersectsROI);
  for(const group of ['F','B','FORE'])
   if(!inside.some(x=>names[x.id].group===group))throw Error('no actual owner ROI draw '+group);
  return {state:baselineState,camera:clock,cache:arr,tiles:[...(s._domainTiles?.tiles||[])].map(([id,t])=>({id,left:t.left,top:t.top,width:t.canvas.width,height:t.canvas.height})),calls,raw};
 }finally{
  if(own.landmark)s.landmark=original.landmark;else delete s.landmark;
  if(own._landmarkLayer)s._landmarkLayer=original.layer;else delete s._landmarkLayer;
  // Do not leave frames prepared from a muted audit pass in any reusable cache.
  // The browser context is always destroyed by the runner immediately after the snapshot.
 }
}
