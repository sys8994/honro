(() => {
  'use strict';
  performance.setResourceTimingBufferSize(5000);
  const s = { marks: { documentInit: performance.now() }, frames: [], ensures: [], errors: [], longTasks: [] };
  let resourceOverflow = false;
  performance.addEventListener('resourcetimingbufferfull', () => { resourceOverflow = true; });
  let po;
  if (globalThis.PerformanceObserver?.supportedEntryTypes?.includes('longtask')) {
    po = new PerformanceObserver(x => s.longTasks.push(...x.getEntries().map(e => ({start:e.startTime,duration:e.duration, name:e.name}))));
    po.observe({type:'longtask',buffered:true});
  }
  const now = () => performance.now();
  const snap = (scene, b) => ({
    stage: b.honroStage, phase: b.phase, round: b.round, mode: b.mode,
    custom: !!b.honroCustom, active: b.active, units: b.units.length,
    logical: [innerWidth,innerHeight], backing:[scene.canvas.width,scene.canvas.height], dpr: devicePixelRatio,
    camera: [scene.x,scene.y,scene.scale], fontReady: document.fonts.status==='loaded',
    farCache: globalThis.HonroAuthoredFarArt?.stats?.() ?? null,
    story: !!HonroApp.dialogue, turnBannerVisible: document.getElementById('turn-banner')?.hidden===false
  });
  const cache = scene => {
    if(typeof scene.renderCacheStats!=='function') return null;
    return Object.fromEntries(Object.entries(scene.renderCacheStats()).filter(([_,v])=>typeof v==='number' && Number.isFinite(v)));
  };
  function sampleEngine(app) {
    const b=app.engine.b, scene=app.scene;
    return {stageMap: globalThis.HONRO_PROJECT?.stages.find(q=>q.metadata?.stageId===s.stage),
      b, scene};
  }
  const samePose=(a,b)=>a && a.phase===b.phase && a.round===b.round && a.story===b.story &&
    a.turnBannerVisible===b.turnBannerVisible && (a.farCache?.canvasBytes??0)===(b.farCache?.canvasBytes??0) && a.backing.every((x,i)=>x===b.backing[i]) &&
    a.camera.every((x,i)=>Number.isFinite(x) && Math.abs(x-b.camera[i]) <= (i===2 ? 0.00001 : 0.05));
  function start(id) {
    const a=globalThis.HonroApp, loader=globalThis.HonroCampaignLoader, proto=globalThis.HonroScene?.prototype;
    if (!a || !loader || typeof proto?.render !== 'function' || s.stage || a.screen!=='title' || a.engine) throw Error('not canonical title');
    if (a.profile.honroBattle || Object.values(a.profile.cleared||{}).some(Boolean)) throw Error('fresh empty campaign expected');
    s.stage=id;s.eager=loader.has(id);s.marks.titleObserved=now();
    const oldRender=proto.render, oldEnsure=loader.ensureStage;
    let settledCount=0, lastPose=null;
    loader.ensureStage=function(...args){
      if(args[0]!==id)return Reflect.apply(oldEnsure,this,args);
      const row={start:now(),wasAlreadyLoaded:this.has(id)};s.ensures.push(row);
      let result;
      try{result=Reflect.apply(oldEnsure,this,args);}catch(e){row.error=String(e);throw e;}
      Promise.resolve(result).then(x=>{row.end=now();row.stage=x?.metadata?.stageId;},e=>{row.error=String(e);});
      return result;
    };
    proto.render=function(engine,...args){
      if(engine?.b?.honroStage!==id || this.canvas?.id!=='battlecanvas' || s.stableFrame)
        return Reflect.apply(oldRender,this,[engine,...args]);
      const b=engine.b, first=s.frames.length===0;
      const c0=first?cache(this):undefined;
      const start=now(), v=Reflect.apply(oldRender,this,[engine,...args]), end=now();
      const p=snap(this,b);
      const row={n:s.frames.length+1,start,end,cpu:end-start};
      s.frames.push(row);
      if(first){s.firstFrame={...row,pose:p,cacheBefore:c0,cacheAfter:cache(this)};requestAnimationFrame(()=>{s.marks.firstFollowingRaf=now();});}
      const valid=p.mode==='campaign' && !p.custom && p.units>0 && p.active && p.phase==='aim' && Number(p.round)===1
        && p.camera.every(Number.isFinite) && p.backing.every(x=>x>0) && p.fontReady && !p.farCache?.errors?.length;
      settledCount=valid ? (samePose(lastPose,p)?settledCount+1:1) : 0;
      lastPose=p;
      if (settledCount>=3) {
        s.stableFrame={...row,pose:p,cacheAfter:cache(this)};
        // No additional draw or set-camera. Existing story/animation may continue.
        proto.render=oldRender;loader.ensureStage=oldEnsure;
        requestAnimationFrame(()=>{s.marks.stableFollowingRaf=now();});
      }
      return v;
    };
    // Previous chapters are unlocked only in disposable context memory (same entry-level convention
    // used for earlier native parked QA). No prefetch, early ensure, camera, RAF, or dialogue changes.
    for (let n=1;n<id;n++)a.profile.cleared[n]=true;
    for (const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(id).entryLevel);
    a.profile.settings.music=false;a.profile.settings.sound=false;
    a.audio?.configure?.(a.profile.settings);
    s.marks.launchStart=now();a.launch(id);s.marks.launchReturned=now();
  }
  function read(paths) {
    const {stageMap:m,b}=sampleEngine(HonroApp);
    if(po) s.longTasks.push(...po.takeRecords().map(e=>({start:e.startTime,duration:e.duration,name:e.name})));
    const relative=name=>{
      const url=new URL(name);
      return url.origin===location.origin && url.pathname.startsWith('/honro/') && !url.search && !url.hash ? url.pathname.slice(7) : null;
    };
    const collect=e=>({name:e.name,path:relative(e.name),startTime:e.startTime,fetchStart:e.fetchStart,
      responseStart:e.responseStart,responseEnd:e.responseEnd, duration:e.duration,
      encodedBodySize:e.encodedBodySize,decodedBodySize:e.decodedBodySize,transferSize:e.transferSize,
      nextHopProtocol:e.nextHopProtocol,deliveryType:e.deliveryType??null,initiatorType:e.initiatorType,responseStatus:e.responseStatus??null,
      workerStart:e.workerStart,connectStart:e.connectStart,connectEnd:e.connectEnd});
    const resources=performance.getEntriesByType('resource').map(collect);
    return {...s, appError:HonroApp.lastError||null, resourceOverflow, longTaskSupported:!!po,
      map:{id:m?.id,stage:m?.metadata?.stageId,pending:!!m?.pending, name:m?.name,
       terrainBounds:b?.terrainBounds, size:[b.width,b.height],
       unitIDs:b.units.map(u=>[u.id,u.side])},
      navigation:performance.getEntriesByType('navigation').map(collect),
      measuredResources:resources.filter(x=>paths.includes(x.path)),
      otherTiming:resources.filter(x=>!paths.includes(x.path)).map(x=>({path:x.path,startTime:x.startTime,end:x.responseEnd,
        encodedBodySize:x.encodedBodySize,transferSize:x.transferSize,initiatorType:x.initiatorType})),
      environment:{userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency,
        crossOriginIsolated:globalThis.crossOriginIsolated??null,visibility:document.visibilityState,timeOrigin:performance.timeOrigin}};
  }
  Object.defineProperty(window,'__honroP1Budget',{value:{start,read, state:s},enumerable:false});
})();
