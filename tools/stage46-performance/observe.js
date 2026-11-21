globalThis.Stage46Perf = (() => {
 const trail={};
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
  const rect=s.canvas.getBoundingClientRect(),f=HonroBounds.focus(b), z=HonroBounds.zoomLimits(rect.width);
  const [x,y,scale]=q.ordinary;
  if(rect.width!==1440||devicePixelRatio!==1||!(z.min<scale&&scale<=z.max))throw Error('Not matched device or play zoom');
  Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,x,y,scale});
  HonroBounds.constrain(s,b);
  const wanted=pose(s);
  if(wanted.some((value,i)=>!Number.isFinite(value)||Math.abs(value-[x,y,scale,2][i])>1e-6))throw Error('Pinned ordinary anchor clamped unexpectedly');
  if(s.x<f.left-1e-6||s.x>f.right+1e-6||s.y<f.top-1e-6||s.y>f.bottom+1e-6)throw Error('Camera outside canonical focus');
  stamp('bannerWaitStart');
  for(let n=0;n<36&&document.getElementById('turn-banner')?.hidden===false;n++){
    HonroStory.tick(a,performance.now());HonroStory.draw(a);
    if(document.getElementById('turn-banner')?.hidden===false)await new Promise(r=>setTimeout(r,80));
  }
  if(document.getElementById('turn-banner')?.hidden===false||a.dialogue||b.phase!=='aim'||b.round!==1)throw Error('Parked first turn not ready');
  stamp('bannerWaitEnd');
  const before=state(b,st), dims=canvas(s);
  function draws(){s.render(e,0,'',.6,false,0);}
  stamp('firstControlledRenderStart'); draws(); stamp('firstControlledRenderEnd');
  await rAF(); await rAF(); stamp('firstControlledTwoRAF');
  stamp('mediaWaitStart');
  const refs=new Set([...images,...document.images].filter(i=>i.currentSrc||i.src));
  await document.fonts.ready;
  await Promise.all([...refs].map(i=>i.decode()));
  if(!refs.size||[...refs].some(i=>!i.complete||!i.naturalWidth))throw Error('Media not decoded');
  stamp('mediaWaitEnd');
  stamp('firstMediaReadyRenderStart'); draws(); stamp('firstMediaReadyRenderEnd');
  await rAF(); await rAF(); stamp('mediaReadyTwoRAF');
  for(let i=0;i<8;i++){await rAF();draws();}
  const samples=[];
  stamp('warmStart');
  for(let i=0;i<25;i++){
   const frame=await rAF();
   const cpu=performance.now(); draws(); samples.push({rAF:frame,cpuMS:performance.now()-cpu});
  }
  stamp('warmEnd');
  if(state(b,st)!==before||pose(s).some((v,i)=>v!==wanted[i])||canvas(s).some((v,i)=>v!==dims[i]))throw Error('Camera/physics/actors drifted while paging renderer');
  return {phase:b.phase,round:b.round,mediaDecoded:refs.size,camera:wanted,logical:[rect.width,rect.height],backing:dims,dpr:devicePixelRatio,owner:q.owner,signature:before,stamps:trail,samples,firstLabel:'First controlled post-launch native CPU render; earlier launch-internal draws not excluded. Two rAF is proxy, not compositor timestamp.'};
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
 return {enter,timeline,trail,stamp};
})();
