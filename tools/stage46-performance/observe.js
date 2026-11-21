globalThis.Stage46Perf = (() => {
 const trail={}, guards={snapshots:[],firstMismatch:null};
 const images=new Set();
 const ip=HTMLImageElement.prototype, descr=Object.getOwnPropertyDescriptor(ip,'src');
 Object.defineProperty(ip,'src',{...descr,set(v){images.add(this);return descr.set.call(this,v);}});
 performance.setResourceTimingBufferSize(4096);
 const stamp=k=>trail[k]=performance.now();
 stamp('windowInit');
 const race=(p,ms,label)=>Promise.race([p,new Promise((_,no)=>setTimeout(()=>no(Error(label+' timeout')),ms))]);
 const rAF=()=>new Promise(resolve=>requestAnimationFrame(resolve));
 const state=(b,st)=>JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives,water:b.water??null,tide:b.honroAct4PreviewState?.tide??null,phase:b.phase??null,round:b.round??null});
 const pose=s=>[s.x,s.y,s.scale,s.time];
 const canvas=(s)=>[s.canvas.width,s.canvas.height];
 const css=s=>{const r=s.canvas.getBoundingClientRect();return [r.width,r.height];};
 // These are actual battle coordinates/state, not cached visual pose fields.
 const physical=b=>[b.honroStage,b.honroCanonical,b.honroCustom,b.phase,b.round,b.active,b.winner,
   b.units.map(u=>[u.id,u.x,u.y,u.w,u.h,u.hp,u.maxHp,u.side,u.dead,u.ground,u.vx,u.vy,u.facing,u.honroFlying])];
 const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 function fullDelta(a,b,base='',out=[]){
   if(out.length>=24||a===b)return out;
   if(a&&b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)){
    for(const k of new Set([...Object.keys(a),...Object.keys(b)])){
     if(out.length>=24)break;
     fullDelta(a[k],b[k],base+'/'+k,out);
    }
   }else{
    const cut=x=>x===undefined?'(absent)':JSON.stringify(x).slice(0,120);
    out.push({path:base,from:cut(a),to:cut(b)});
   }
   return out;
 }
 function requireAt(ok,stage,component,from,to){
   if(ok)return;
   if(!guards.firstMismatch)guards.firstMismatch={stage,component,from,to,at:performance.now()};
   throw Error('Protected '+component+' changed at '+stage);
 }
 async function enter(id,q){
  if(document.documentElement.dataset.honroReady!=='true'||!HonroCampaignLoader)throw Error('Unexpected shell readiness');
  const a=HonroApp;
  a.frame=()=>{};  // Existing parked read-only diagnostic convention, no scene stepping during samples.
  a.profile.settings.music=false; a.profile.settings.sound=false;
  stamp('ensureStart');
  await race(HonroCampaignLoader.ensureStage(id),q.ensureMS,'ensureStage');
  stamp('ensureEnd');
  for(let n=1;n<id;n++)a.profile.cleared[n]=true;
  for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(id).entryLevel);
  stamp('launchStart'); a.launch(id); stamp('launchEnd');
  for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
  if(a.dialogue)throw Error('Entry dialogue remains');
  a.close(); HonroStoryFraming.clear(a.scene); stamp('parkReady');
  return await race(parkMeasure(a,id,q),35000,'park/media/rAF');
 }
 async function parkMeasure(a,id,q){
  const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===id), s=a.scene,e=a.engine,b=e.b;
  if(!st||st.id!==q.mapId||b.honroStage!==id||b.honroCustom!==false||!b.honroCanonical)throw Error('Wrong canonical stage');
  const owned=st.elements.filter(x=>x.assetId===q.owner), lib=HONRO_PROJECT.library.filter(x=>x.id===q.owner);
  if(owned.length!==1||lib.length!==1||(id===46&&(owned[0].id!=='a5-near'||lib[0].shaftExteriorParts?.length!==5)))throw Error('Wrong exact BODY owner');
  stamp('bannerWaitStart');
  for(let n=0;n<36&&document.getElementById('turn-banner')?.hidden===false;n++){
    HonroStory.tick(a,performance.now());HonroStory.draw(a);
    if(document.getElementById('turn-banner')?.hidden===false)await new Promise(r=>setTimeout(r,80));
  }
  if(document.getElementById('turn-banner')?.hidden===false||a.dialogue||b.phase!=='aim'||b.round!==1)throw Error('Parked first turn not ready');
  stamp('bannerWaitEnd');
  const rect=s.canvas.getBoundingClientRect(),f=HonroBounds.focus(b), z=HonroBounds.zoomLimits(rect.width);
  const [x,y,scale]=q.ordinary;
  if(rect.width!==1440||devicePixelRatio!==1||!(z.min<scale&&scale<=z.max))throw Error('Not matched device or play zoom');
  Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,x,y,scale});
  HonroBounds.constrain(s,b);
  const wanted=pose(s);
  if(wanted.some((value,i)=>!Number.isFinite(value)||Math.abs(value-[x,y,scale,2][i])>1e-6))throw Error('Pinned ordinary anchor clamped unexpectedly');
  if(s.x<f.left-1e-6||s.x>f.right+1e-6||s.y<f.top-1e-6||s.y>f.bottom+1e-6)throw Error('Camera outside canonical focus');
  // Size may be allocated by the first native render. CSS pose is invariant, backing after draw must
  // equal the actual renderer's size() target: round(CSS × DPR1), then remain immutable.
  const firstFull=state(b,st), physicalBefore=physical(b), cssBefore=css(s);
  const dimsBefore=canvas(s), dimsExpected=cssBefore.map(x=>Math.round(x*devicePixelRatio));
  guards.beforeFirst={camera:wanted,css:cssBefore,backing:dimsBefore,expectedBackingAfterNativeSize:dimsExpected,dpr:devicePixelRatio};
  function draw(){s.render(e,0,'',.6,false,0);}
  function physicsAt(at){
   const cameraNow=pose(s), physicalNow=physical(b);
   requireAt(eq(cameraNow,wanted),at,'cameraX/Y/scale/time',wanted,cameraNow);
   requireAt(eq(physicalNow,physicalBefore),at,'physical stage/round/turn/actors including x/y/hp',physicalBefore,physicalNow);
  }
  function layoutAt(at,record=true){
   const c=css(s), d=canvas(s);
   if(record)guards.snapshots.push({stage:at,css:c,backing:d});
   requireAt(eq(c,cssBefore),at,'CSS canvas size',cssBefore,c);
   requireAt(eq(d,dimsExpected),at,'native allocated backing',dimsExpected,d);
  }
  function stableFull(at,was){
   const now=state(b,st);
   if(now!==was){
    const delta=fullDelta(JSON.parse(was),JSON.parse(now));
    guards.changedFullComponents={stage:at,delta,serializationOnly:delta.length===0};
    requireAt(false,at,'full terrain/units/design/water/phase/round',null,delta);
   }
  }
  stamp('firstControlledRenderStart'); draw(); stamp('firstControlledRenderEnd');
  physicsAt('after first controlled draw'); layoutAt('after first controlled draw');
  const afterFirstFull=state(b,st);
  const deltaAfterInitialDraw=fullDelta(JSON.parse(firstFull),JSON.parse(afterFirstFull));
  guards.afterFirst={stateDelta:deltaAfterInitialDraw,serializedStateEqual:afterFirstFull===firstFull,
      lazyBackingIncludedInFirstCPU:!eq(dimsBefore,dimsExpected),actualBacking:canvas(s)};
  // No known source-visible engine object mutation is exempted. Backing initialization is the
  // one proven renderer-owned effect outside the full gameplay signature.
  stableFull('after first controlled draw',firstFull);
  const dims=canvas(s);
  await rAF(); await rAF(); stamp('firstControlledTwoRAF');
  stamp('mediaWaitStart');
  const refs=new Set([...images,...document.images].filter(i=>i.currentSrc||i.src));
  await document.fonts.ready;
  await Promise.all([...refs].map(i=>i.decode()));
  if(!refs.size||[...refs].some(i=>!i.complete||!i.naturalWidth))throw Error('Media not decoded');
  stamp('mediaWaitEnd');
  physicsAt('before media-ready draw');layoutAt('before media-ready draw');stableFull('before media-ready draw',afterFirstFull);
  stamp('firstMediaReadyRenderStart'); draw(); stamp('firstMediaReadyRenderEnd');
  physicsAt('after media-ready draw');layoutAt('after media-ready draw');stableFull('after media-ready draw',afterFirstFull);
  await rAF(); await rAF(); stamp('mediaReadyTwoRAF');
  for(let i=0;i<8;i++){await rAF();physicsAt('before warm-up '+i);draw();physicsAt('after warm-up '+i);layoutAt('after warm-up '+i,false);}
  stableFull('after warm-up',afterFirstFull);
  const samples=[];
  stamp('warmStart');
  for(let i=0;i<25;i++){
   const frame=await rAF();
   physicsAt('before warm sample '+i);
   const cpu=performance.now(); draw(); const elapsed=performance.now()-cpu;
   samples.push({rAF:frame,cpuMS:elapsed});
   physicsAt('after warm sample '+i);layoutAt('after warm sample '+i,false);
  }
  stamp('warmEnd');
  physicsAt('warm end');layoutAt('warm end');stableFull('warm end',afterFirstFull);
  return {phase:b.phase,round:b.round,mediaDecoded:refs.size,camera:wanted,logical:[rect.width,rect.height],backing:dims,dpr:devicePixelRatio,owner:q.owner,signature:afterFirstFull,guards,stamps:trail,samples,firstLabel:'First controlled post-launch native CPU render; earlier launch-internal draws not excluded. Two rAF is proxy, not compositor timestamp.'};
 }
 function timeline(collect,origin){
  const paths=performance.getEntriesByType('resource').flatMap(r=>{
   if(!r.name.startsWith(origin))return [];
   const name=r.name.slice(origin.length);if(!collect.includes(name))return [];
   return [{path:name,startTime:r.startTime,fetchStart:r.fetchStart,responseStart:r.responseStart,responseEnd:r.responseEnd,duration:r.duration,encodedBodySize:r.encodedBodySize,decodedBodySize:r.decodedBodySize,transferSize:r.transferSize,nextHopProtocol:r.nextHopProtocol,deliveryType:r.deliveryType??null,initiatorType:r.initiatorType}];
  });
  const nav=performance.getEntriesByType('navigation')[0];
  return {paths,navigation:nav?{startTime:nav.startTime,responseStart:nav.responseStart,responseEnd:nav.responseEnd,domContentLoaded:nav.domContentLoadedEventEnd,transferSize:nav.transferSize,encodedBodySize:nav.encodedBodySize,decodedBodySize:nav.decodedBodySize}:null};
 }
 return {enter,timeline,trail,stamp,diagnostics:()=>({trail,guards})};
})();
