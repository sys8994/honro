async ({compact,proof,frames,iterations})=>{
 const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const app=window.HonroApp;
 assert(typeof app?.launch==='function'&&document.documentElement.dataset.honroReady==='true','normal App not ready');
 await HonroCampaignLoader.ensureStage(15);
 const p=HONRO_ACT2_COMPACT_PACKAGES?.[15],st=HONRO_PROJECT.stages.find(z=>z.metadata?.stageId===15);
 assert(same(p,compact)&&same(st,p.stage)&&HonroAct2Compact.enabled(15)===true,'wrong active Stage15 package');
 for(const asset of p.assets.filter(a=>a.id.endsWith('traced-west-flat-v2-1')||a.id.endsWith('traced-outer-v1-1'))){
  const found=HONRO_PROJECT.library.filter(a=>a.id===asset.id);assert(found.length===1&&same(found[0],asset),'wrong active paint owner '+asset.id);
 }
 app.profile.settings.music=false;app.profile.settings.sound=false;
 for(let n=1;n<15;n++)app.profile.cleared[n]=true;
 for(const h of Object.values(app.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(15).entryLevel);
 await document.fonts.ready;
 await Promise.all([...document.images].filter(i=>i.currentSrc||i.src).map(i=>i.decode()));
 app.launch(15);
 for(let n=0;n<40&&app.dialogue;n++)HonroStory.finish(app);
 assert(!app.dialogue,'unfinished entry story');
 app.close();HonroStoryFraming.clear(app.scene);
 const s=app.scene,e=app.engine,b=e.b;
 // Wait for the actual launch layout and first-turn overlay to settle. Do
 // not replace the app RAF, scene methods or any cache implementation.
 const setup=frames[0];
 assert(setup?.key?.endsWith('-ordinary'),'missing signed first pose');
 const rect=()=>{const r=s.canvas.getBoundingClientRect();return {w:r.width,h:r.height};};
 let ready=false;
 for(let i=0;i<120;i++){
  HonroStory.tick(app,performance.now());HonroStory.draw(app);
  if(s.canvas.isConnected&&!app.dialogue&&document.getElementById('turn-banner')?.hidden!==false&&same(rect(),setup.css)){ready=true;break;}
  await new Promise(requestAnimationFrame);
 }
 assert(ready,'real initial layout/turn banner not settled '+JSON.stringify({expected:setup.css,actual:rect(),dialogue:!!app.dialogue,bannerHidden:document.getElementById('turn-banner')?.hidden}));
 assert(b.honroStage===15&&b.honroCustom===false&&b.honroCanonical&&b.honroCampaignMapRevision===615&&b.width===5800&&b.height===4200,'wrong active game');
 const signature=()=>JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,
    objectives:st.objectives,water:b.water??null,tide:b.honroAct4PreviewState?.tide??null,phase:b.phase??null,round:b.round??null});
 const statsNames=['worldBuilds','worldHits','domainCanvasAllocations','domainTileBuilds','screenBuilds','screenHits'];
 const stat=()=>Object.fromEntries(statsNames.map(k=>[k,s.renderCacheStats()[k]??0]));
 const delta=(a,b)=>Object.fromEntries(statsNames.map(k=>[k,b[k]-a[k]]));
 const dim=()=>{const r=s.canvas.getBoundingClientRect();return{w:r.width,h:r.height};};
 const snap=()=>{const q=s._domainTiles,c=s._screenWorldCache,r=dim();
  assert(q?.tiles instanceof Map&&q.rs>0,'normal native cache missing');
  const v=HonroBounds.viewport(s,r.w,r.h),d=b.honroTerrainBounds,wx=512/q.rs;
  const x0=Math.floor(Math.max(v.left,d.left)/wx),x1=Math.floor(Math.min(v.right,d.right)/wx),
      y0=Math.floor(Math.max(v.top,d.top)/wx),y1=Math.floor(Math.min(v.bottom,d.bottom)/wx);
  const visible=[];
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const id=x+':'+y,t=q.tiles.get(id);
    assert(t?.canvas?.width===516&&t.canvas.height===516&&t.left===x*wx&&t.top===y*wx,'real visible tile missing '+id);
    visible.push(q.rs+':'+id);
  }
  const tileRefs=[...q.tiles.values()].map(m=>m.canvas), storage=tileRefs.reduce((a,x)=>a+x.width*x.height*4,0);
  const screenBytes=c?.canvas?c.canvas.width*c.canvas.height*4:0,m=s.renderCacheStats();
  assert(storage===m.worldBytes&&screenBytes===m.screenWorldBytes,'renderer accounting differs from actual buffers');
  assert(q.tiles.size<=(r.w<900?12:24)&&screenBytes<=6000000*4,'cache allocation ceiling exceeded');
  return {metrics:{rs:q.rs,visible,resident:[...q.tiles.keys()].sort(),residentCount:q.tiles.size,domainBufferBytes:storage,screenWorldBytes:screenBytes,viewport:v,worldCacheKey:q.key},
    cache:q,tileRefs,screenRef:c?.canvas??null};};
 const draw=()=>{s.time=2;s.render(e,0,'',.6,false,0);};
 let sig=null, rows=[];
 for(const f of frames){
  HonroStoryFraming.clear(s);
  Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,...f.actual});
  HonroBounds.constrain(s,b);
  const now=()=>({x:s.x,y:s.y,scale:s.scale});
  // Exactly the normal renderer's initial size pass, prior to resetting
  // caches/counters for the cold sample. Do not draw fake frame data.
  const beforeResize=[s.canvas.width,s.canvas.height];
  s.size(b);
  const got={actual:now(),css:dim(),backing:[s.canvas.width,s.canvas.height],DPR:devicePixelRatio};
  for(const k of ['actual','css','backing','DPR'])
   assert(same(got[k],f[k]),'camera invariant '+f.key+' '+k+' '+JSON.stringify({expected:f[k],actual:got[k],beforeResize}));
  // Force a normal cold-cache lifecycle before this pose; do not replace any app function.
  s._releaseDomainTiles();s._releaseRasterCanvas(s._screenWorldCache?.canvas);s._screenWorldCache=null;
  const before=stat();draw();const cold=snap(),coldStats=stat();
  assert(!cold.screenRef&&cold.metrics.residentCount===cold.metrics.visible.length,'cold raster still had previously resident tiles');
  const cur=signature();sig??=cur;assert(cur===sig,'settled state drift before warm sample '+f.key);
  draw();const stable=snap(),stableStats=stat(),warmPNG=s.canvas.toDataURL('image/png');
  assert(stable.screenRef&&stable.metrics.screenWorldBytes===f.backing[0]*f.backing[1]*4&&same(stable.metrics.visible,f.tileKeys), 'world screen cache/frozen tile list absent');
  for(let i=0;i<iterations;i++)draw();
  const last=snap(),lastStats=stat(),w=delta(stableStats,lastStats),cc=delta(before,coldStats),ss=delta(coldStats,stableStats);
  assert(cold.metrics.visible.length===cc.domainCanvasAllocations&&cc.domainTileBuilds===cc.domainCanvasAllocations&&cc.worldBuilds===1, 'unexpected cold tile alloc/build count');
  assert(ss.domainCanvasAllocations===0&&ss.domainTileBuilds===0&&ss.worldBuilds===0,'second warm draw allocated a new world tile');
  assert(stable.cache===last.cache&&stable.screenRef===last.screenRef&&stable.tileRefs.every((v,i)=>last.tileRefs[i]===v)&&stable.tileRefs.length===last.tileRefs.length,'warm cache object churn');
  assert(w.worldBuilds===0&&w.domainCanvasAllocations===0&&w.domainTileBuilds===0&&w.screenBuilds===0&&w.screenHits>=iterations,'warm cache not reused');
  assert(same(stable.metrics,last.metrics)&&same(now(),f.actual)&&signature()===sig,'warm screen changed state/view/cache metrics');
  assert(warmPNG===s.canvas.toDataURL('image/png'),'warm redraw differs from identical frozen view');
  rows.push({key:f.key,actual:f.actual,css:f.css,backing:f.backing,DPR:f.DPR,cold:cold.metrics,stable:stable.metrics,last:last.metrics,
    coldDelta:cc,settleDelta:ss,warmDelta:w,sameTileAndScreenObjects:true,unchangedWarmPNG:true,rawPNG:warmPNG.split(',')[1],comparePhysicsSHA256:f.physicsSHA256});
 }
 return {scope:'one normal browser active Stage15; synchronous frozen renderer calls; no speed measurement',rows,physicsSignature:sig,browser:navigator.userAgent};
}
