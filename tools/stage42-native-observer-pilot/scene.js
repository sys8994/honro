// Shared test controls for A1, A2 and N. Not an engine or gameplay update.
async q=>{
 'use strict';
 const G=globalThis,a=G.HonroApp,s=a?.scene,K='__honroS42PilotControl';
 const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))),x=>x.toString(16).padStart(2,'0')).join('');
 if(q.op==='prepare'){
  const b=a?.engine?.b, st=G.HONRO_PROJECT?.stages.find(x=>x.metadata?.stageId===42);
  if(!st||st.id!=='stage-42'||b?.honroStage!==42||b.honroCustom!==false||b.honroCanonical!==true||b.honroMapOrigin!=='campaign'||
     b.honroAuthoredId!=='stage-42'||b.round!==1||b.phase!=='aim'||G.HonroTerrainDomain?.active(b)!==true||a.dialogue||devicePixelRatio!==1)
   throw Error('not exact canonical normal campaign 42 aim 1');
  const reg=G.HONRO_PROJECT.library.filter(x=>x.id==='act5:near:42'),all=G.HonroTerrainDomain.materialLandmarks(b);
  const ln=all.filter(x=>x.id==='a5-near'&&x.asset?.id==='act5:near:42');
  if(ln.length!==1||reg.length!==1||reg[0]===ln[0].asset||ln[0].kind!=='canonical-element'||ln[0].x!==0||ln[0].y!==0||ln[0].scale!==6500/2022||
     (ln[0].rotation??0)!==0||ln[0].layer!=='structural-back'||ln[0].collisionIds?.length)
   throw Error('registered/actual canonical clone or placement missing');
  const stock=reg[0],owner=ln[0].asset;
  const ownerSHA=await digest(owner);
  if(JSON.stringify(stock)!==JSON.stringify(owner)||ownerSHA!==q.law.ownerValueSHA256||
     await digest(owner.vector)!==q.law.ownerOriginalVectorSHA256||await digest(owner.edgeWall)!==q.law.ownerWallValueSHA256||
     await digest(owner.edgeSurface)!==q.law.ownerSurfaceValueSHA256)throw Error('actual renderer source payload changed');
  const needed=new Set(G.HONRO_PROJECT.library.map(x=>x.id));
  if(st.elements.some(x=>x.assetId&&!needed.has(x.assetId))||!b.units.length)throw Error('missing stage assets or actors');
  const flags=()=>({stage:st.id,stageId:b.honroStage,authored:b.honroAuthoredId,mapOrigin:b.honroMapOrigin,
    canonical:b.honroCanonical,custom:b.honroCustom,mapRevision:b.honroCampaignMapRevision,phase:b.phase,round:b.round});
  const state=()=>({flags:flags(),terrain:b.terrain,units:b.units,state:b.honroState??null,water:b.water??null,projectiles:b.projectiles,
    map:st,render:G.HonroTerrainDomain.render(b).map(t=>[t.id,t.vertices,t.broken??null]),play:G.HonroBounds.play(b),domain:b.honroTerrainBounds});
  const key=JSON.stringify(state());
  const expected={ownerSHA, ownerId:ln[0].id, roles:all.map(x=>[x.id,x.asset?.id,x.layer]), stateSHA:await digest(state()),
    ...flags(), terrainIDs:b.terrain.map(x=>x.id), actors:b.units.length, domain:b.honroTerrainBounds};
  if(G[K])throw Error('duplicate control');
  G[K]={b,flags,state,key};return expected;
 }
 const t=G[K], b=a?.engine?.b;
 if(!t||t.b!==b||JSON.stringify(t.state())!==t.key)throw Error('canonical source or physical state drift');
 const root=s.canvas,css=root.getBoundingClientRect(),w=css.width,h=css.height;
 const eq=(x,y)=>x.length===y.length&&x.every((n,i)=>Math.abs(n-y[i])<1e-7);
 if(!eq([w,h],q.css)||s._pixelRatio(w,h,b)!==1)throw Error('CSS or backing DPR drift');
 const zoom=G.HonroBounds.zoomLimits(w);
 if(q.op==='park'){
  const [x,y,z]=q.pose.requested, scale=typeof z==='string'?zoom[z]:z;
  G.HonroStoryFraming.clear(s);
  Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,x,y,scale});
  G.HonroBounds.constrain(s,b);
  const center=[s.x,s.y,s.scale],v=G.HonroBounds.viewport(s,w,h);
  if(q.pose.expectedCenter&&!eq(center,q.pose.expectedCenter))throw Error('native camera clamp changed '+JSON.stringify({center,requested:q.pose.requested}));
  if(q.pose.points?.some(([x,y])=>x<=v.left||x>=v.right||y<=v.top||y>=v.bottom))throw Error('target cropped by native clamp');
  return {center,viewport:v,css:[w,h],backing:[Math.round(w),Math.round(h)],zoom};
 }
 if(q.op!=='paint')throw Error('bad pilot scene operation');
 const count=()=>{
  const d=s._domainTiles,k=s._screenWorldCache,z=s.renderCacheStats(),tile=q.pose.target&&d?.rs===q.pose.rs?d.tiles.get(q.pose.target):null;
  return {tileBuilds:z.domainTileBuilds??0,worldHits:z.worldHits??0,screenBuilds:z.screenBuilds??0,screenHits:z.screenHits??0,
    domainRS:d?.rs??null,tile:tile?{left:tile.left,top:tile.top,size:[tile.canvas.width,tile.canvas.height]}:null,
    viewport:k?.canvas?{main:k.canvas===root,size:[k.canvas.width,k.canvas.height],detached:!k.canvas.isConnected,
      nativeZoom:k.key.includes(':native-zoom:')}:null};
 };
 const before=count(), proto=Object.getPrototypeOf(performance),native=proto.now, clock=60000;
 if(Object.hasOwn(performance,'now')||performance.now!==native)throw Error('unexpected clock wrapper');
 // Stock sky clouds and their stock grading share performance.now. Freeze only this
 // synchronous parked draw in all arms, never timestamps/network or layout before/after.
 Object.defineProperty(performance,'now',{configurable:true,value:()=>clock});
 try{s.render(a.engine,0,'',.6,false,0);}
 finally{delete performance.now;}
 if(Object.hasOwn(performance,'now')||performance.now!==native||s.time!==2||
    !eq([s.x,s.y,s.scale],q.center)||JSON.stringify(t.state())!==t.key||
    !eq([root.width,root.height],q.backing))throw Error('real paint changed camera, time, source or geometry');
 return {before,after:count(),clock,nativeClockRestored:true};
}
