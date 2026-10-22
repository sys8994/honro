// Test-only metering. Installed in the browser, never bundled into production.
(() => {
 const G=globalThis, nativePath=G.Path2D,proto=CanvasRenderingContext2D.prototype;
 const empty=()=>({materialCalls:0,materialMs:0,prepareCalls:0,prepareMisses:0,prepareHits:0,prepareMs:0,ops:{path2D:0,clip:0,fill:0,gradient:0,stroke:0},materialOps:{path2D:0,clip:0,fill:0,gradient:0,stroke:0}});
 const meter=G.__s11Meter={enabled:true,depth:0,counts:empty(),reset(){this.counts=empty();this.depth=0;}};
 const count=k=>{if(!meter.enabled)return;meter.counts.ops[k]++;if(meter.depth)meter.counts.materialOps[k]++;};
 G.Path2D=new Proxy(nativePath,{construct(t,args){count('path2D');return Reflect.construct(t,args);}});
 for(const[name,key]of [['clip','clip'],['fill','fill'],['stroke','stroke'],['createLinearGradient','gradient'],['createRadialGradient','gradient']]){const old=proto[name];proto[name]=function(...args){count(key);return old.apply(this,args);};}
 const C=G.HONRO_CORE,app=G.HonroApp,seed=structuredClone(app.engine.b),cv=app.scene.canvas;
 const protectedState=b=>JSON.stringify({phase:b.phase,round:b.round,active:b.active,units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,maxHp:u.maxHp,facing:u.facing})),markers:b.honroMarkers,state:b.honroState});
 const delta=(a,b)=>Object.fromEntries([...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>typeof a[k]==='number'||typeof b[k]==='number').map(k=>[k,(b[k]||0)-(a[k]||0)]));
 const stats=s=>s.renderCacheStats();
 const draw=(s,e)=>{s.time=10;s.walkTime=0;s.weatherX=0;s.render(e,0,'',.6,false,0,false);};
 const measure=(s,e)=>{const before=stats(s);meter.reset();const t=performance.now();draw(s,e);const totalMs=performance.now()-t;return{totalMs,...structuredClone(meter.counts),cacheDelta:delta(before,stats(s)),cacheAfter:stats(s)};};
 const release=s=>{for(const slot of ['_screenWorldCache','_screenBackgroundCache','_backgroundCache']){if(s?.[slot]?.canvas){s[slot].canvas.width=1;s[slot].canvas.height=1;}}for(const tile of s?._domainTiles?.tiles?.values()||[]){tile.canvas.width=1;tile.canvas.height=1;}};
 const fresh=v=>{
  release(app.scene);G.__s11ResetPrepare();
  const b=structuredClone(seed),e=new C.Engine(b),s=new G.HonroScene(cv);app.engine=e;app.scene=s;
  Object.assign(s,{manual:true,x:v.x,y:v.y,scale:v.z,time:10,storyTween:null,goalFocus:null,cinematic:null,_cameraWidth:1440,_cameraHeight:900});
  return{s,e,state:protectedState(b)};
 };
 G.stage11MaterialProbe={
  fixture:protectedState(seed),
  run(v){
   const samples={freshPrepareFirstTiles:[],prepareReusedTileMiss:[],screenHit:[],max165Direct:[]};let current;
   for(let i=0;i<3;i++){
    current=fresh(v);const{s,e}=current;samples.freshPrepareFirstTiles.push(measure(s,e));
    // Same battle/terrain/sceneVersion and prepared paths; deliberately evict
    // only the world tiles/screen raster, preserving ready far-art resources.
    for(const t of s._domainTiles?.tiles?.values()||[]){t.canvas.width=1;t.canvas.height=1;}
    if(s._screenWorldCache?.canvas){s._screenWorldCache.canvas.width=1;s._screenWorldCache.canvas.height=1;}
    s._domainTiles=null;s._staticWorldCache=null;s._screenWorldCache=null;
    samples.prepareReusedTileMiss.push(measure(s,e));
    if(protectedState(e.b)!==current.state)throw Error('Fixed render fixture changed protected battle fields');
   }
   const{s,e,state}=current;for(let i=0;i<3;i++)draw(s,e);
   for(let i=0;i<24;i++)samples.screenHit.push(measure(s,e));
   s.scale=1.65;for(let i=0;i<3;i++)draw(s,e);
   for(let i=0;i<16;i++)samples.max165Direct.push(measure(s,e));
   if(protectedState(e.b)!==state)throw Error('Render moved the fixed battle fixture');
   const report={view:v,camera:[s.x,s.y],viewport:[1440,900],time:10,dt:0,effectDt:0,phase:e.b.phase,farReady:HonroAuthoredFarArt.ready(11),fixture:state,samples};
   for(const r of samples.screenHit){if(r.materialCalls!==0||r.cacheDelta.domainTileBuilds||r.cacheDelta.worldHits<1||r.cacheDelta.screenHits<2)throw Error('Expected normal screen-hit path');}
   for(const r of samples.prepareReusedTileMiss){if(r.prepareMisses!==0||r.cacheDelta.domainTileBuilds<1||r.materialCalls<1)throw Error('Expected prepared paths + fresh tile miss');}
   for(const r of samples.max165Direct){if(r.materialCalls<1||r.cacheDelta.worldHits||r.prepareMisses||r.cacheDelta.domainTileBuilds)throw Error('Expected prepared direct-draw path at 1.65');}
   return report;
  }
 };
})();
