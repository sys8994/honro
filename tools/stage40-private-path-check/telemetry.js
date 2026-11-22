// Diagnostic context only. Not present in the timing-only sessions.
(()=>{
 const G=globalThis,Native=G.Path2D,now=()=>performance.now();
 const stats={constructed:0,svg:0,chars:0,firstBefore:null,firstAfter:null,guide:[],ctm:{},scene:null,apiCalls:0};
 const fake=()=>{throw Error('not on actual canonical runtime')};
 const glimpse=()=>({constructed:stats.constructed,svg:stats.svg,chars:stats.chars,apiCalls:stats.apiCalls,private:readPrivate?.()??null});
 let readPrivate,activeOwner;
 G.Path2D=new Proxy(Native,{construct(target,args,newTarget){
   const value=Reflect.construct(target,args,newTarget);
   stats.constructed++;
   if(typeof args[0]==='string'){stats.svg++;stats.chars+=args[0].length;}
   return value;
 }});
 G.__STAGE40_LOCAL_COUNTERS=(scene,read)=>{
   if(scene!==G.HonroApp?.scene||typeof read!=='function')throw Error('wrong observed private owner');
   stats.apiCalls++;readPrivate=read;
 };
 for(const t of [G.CanvasRenderingContext2D,G.OffscreenCanvasRenderingContext2D]){
   const p=t?.prototype;if(!p)continue;
   const old=p.fill;p.fill=function(...args){
    if(activeOwner && !Object.hasOwn(stats.ctm,activeOwner)&&args[0] instanceof Native){
      const m=this.getTransform();stats.ctm[activeOwner]=[m.a,m.b,m.c,m.d,m.e,m.f,this.canvas.width,this.canvas.height,this.globalAlpha,this.honroVisualLayer??null];
    }
    return Reflect.apply(old,this,args);
   };
 }
 function wire(){
   const V=G.HonroVectorArt,S=G.HonroScene?.prototype;if(typeof V?.prepareIncremental!=='function'||!S)fake();
   const prep=V.prepareIncremental,L=S.landmark,R=S.render;
   V.prepareIncremental=function(v,...args){
     const b=G.HonroApp?.engine?.b;
     if(b?.honroStage!==40||b.mode!=='campaign'||b.honroCustom)return Reflect.apply(prep,this,[v,...args]);
     const ids=(b.honroLandmarks||[]).filter(l=>l.asset?.vector===v).map(l=>l.asset.id);
     if(!ids.length)return Reflect.apply(prep,this,[v,...args]);
     const row={ids,start:now(),before:glimpse(),firstFrameAlreadyObserved:stats.firstAfter!==null};
     stats.guide.push(row);
     const run=Reflect.apply(prep,this,[v,...args]);
     run.then(result=>{row.result=result;row.end=now();row.after=glimpse();},err=>{row.error=String(err);});
     return run;
   };
   S.landmark=function(c,l,...tail){
     if(this.battle?.honroStage!==40||this.battle?.mode!=='campaign'||this.battle.honroCustom||!l?.nativeArtLayer||!l.asset?.vector)
      return Reflect.apply(L,this,[c,l,...tail]);
     const old=activeOwner;activeOwner=l.asset.id;
     try{return Reflect.apply(L,this,[c,l,...tail]);}finally{activeOwner=old;}
   };
   S.render=function(engine,...rest){
     if(stats.firstBefore!==null||engine?.b?.honroStage!==40||this.canvas?.id!=='battlecanvas'||engine.b.mode!=='campaign')
      return Reflect.apply(R,this,[engine,...rest]);
     stats.firstBefore={time:now(),...glimpse()};
     const out=Reflect.apply(R,this,[engine,...rest]);
     stats.firstAfter={time:now(),...glimpse()};
     return out;
   };
 }
 function read(){
  const a=G.HonroApp,b=a?.engine?.b,s=a?.scene,r=s?.canvas?.getBoundingClientRect(),lib=G.HONRO_PROJECT?.library;
  const owners=(b?.honroLandmarks||[]).filter(x=>x.nativeArtLayer&&x.asset?.vector).map(x=>({id:x.asset.id,kind:x.kind,layer:x.nativeArtLayer,instance:x.id,
    sameRegisteredObject:Array.isArray(lib)&&lib.find(z=>z.id===x.asset.id)===x.asset}));
  return {...stats,current:glimpse(),owners,app:{stage:b?.honroStage??null, mode:b?.mode??null,
    canonical:b?.honroCanonical??null,custom:b?.honroCustom??null,authored:b?.honroAuthoredId??null,origin:b?.honroMapOrigin??null,
    sceneCurrent:s?.battle===b,embedded:G.HONRO_EMBEDDED===true,css:[r?.width??null,r?.height??null],touch:navigator.maxTouchPoints,
    coarse:matchMedia('(any-pointer: coarse)').matches, dpr:devicePixelRatio, dialog:!!a?.dialogue },
    jsHeap:performance.memory?.usedJSHeapSize??null};
 }
 G.__honroPrivateDiag={wire,read,markCapture:()=>{stats.ctm={};}};
})();
