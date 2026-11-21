(q)=>{
'use strict';
const G=globalThis,key='__stage33ExactReadOnlyProbe';
if(q.command!=='install'){
 const p=G[key];if(!p)throw Error('missing observer');
 if(q.command==='phase'){if(!['cold','steady'].includes(q.phase))throw Error('bad phase');p.phase=q.phase;return true;}
 if(q.command==='finish'){try{return {mode:p.mode,events:p.events,counts:p.counts};}finally{for(const f of [...p.undo].reverse())f();delete G[key];}}
 throw Error('bad command');
}
if(G[key])throw Error('duplicate observer');
const scene=HonroApp.scene,b=HonroApp.engine.b,main=scene.ctx,mode=q.mode,pin=q.pin;
if(!main||b.honroStage!==33||!G.HonroTerrainDomain.active(b)||devicePixelRatio!==1||main.canvas.width!==1440||main.canvas.height!==769)
 throw Error('observer needs exact PC Stage33');
const enabled=(x)=>mode==='all'||mode===x;
const p={mode,events:[],counts:{},undo:[],phase:null,insideTile:false};
const stamp=(ctx)=>{const m=ctx.getTransform();return [m.a,m.b,m.c,m.d,m.e,m.f];};
const exactMat=(a,b)=>a.length===b.length&&a.every((x,i)=>Math.abs(x-b[i])<1e-7);
const nativeCtx=(ctx)=>Boolean(ctx&&ctx!==main&&ctx.canvas.width===516&&ctx.canvas.height===516&&exactMat(stamp(ctx),pin.tile.matrix));
const patch=(src,hx,hy,n=2)=>{
 const x0=Math.max(0,Math.floor(hx)-n), y0=Math.max(0,Math.floor(hy)-n);
 const x1=Math.min(src.width,Math.floor(hx)+n+1), y1=Math.min(src.height,Math.floor(hy)+n+1);
 if(x1<=x0||y1<=y0)throw Error('invalid probe rectangle');
 const copy=new OffscreenCanvas(x1-x0,y1-y0), cc=copy.getContext('2d',{alpha:true,willReadFrequently:true});cc.imageSmoothingEnabled=false;
 cc.drawImage(src,x0,y0,x1-x0,y1-y0,0,0,copy.width,copy.height);
 const px=cc.getImageData(0,0,copy.width,copy.height).data;
 return {bounds:[x0,y0,x1,y1],rgba:Array.from(px)};
};
const sample=(label,ctx,extras={})=>{
 if(!p.phase)throw Error('no phase for observation');
 const n=ctx!==main, spots=pin.points.map(u=>{
  const [x,y]=n?u.sourceSampleCenter:u.backing;
  return {role:u.role,anchor:[x,y],...patch(ctx.canvas,x,y,n?3:2)};
 });
 p.counts[label]=(p.counts[label]??0)+1;
 p.events.push({phase:p.phase,label,space:n?'source-tile':'screen',matrix:stamp(ctx),alpha:ctx.globalAlpha,composite:ctx.globalCompositeOperation,spots,...extras});
};
const bind=(o,k,wrap)=>{
 const original=o?.[k];if(typeof original!=='function')throw Error('missing original '+k);
 const prior=Object.getOwnPropertyDescriptor(o,k);
 Object.defineProperty(o,k,{value:wrap(original),writable:true,configurable:true,enumerable:prior?.enumerable??false});
 return ()=>prior?Object.defineProperty(o,k,prior):delete o[k];
};
const method=(o,k,wrap)=>p.undo.push(bind(o,k,wrap));
const track=(o,k,tag)=>method(o,k,fun=>function(...a){sample(tag+':before',main);const res=Reflect.apply(fun,this,a);sample(tag+':after',main);return res;});
try{
 if(enabled('screen')){
  track(scene,'background','screen.background');
  if(typeof G.HonroTimeOfDay?.sky==='function')track(G.HonroTimeOfDay,'sky','screen.sky');
  track(scene,'_drawTerrainDomainTiles','screen.terrain');
  track(scene,'liveWater','screen.liveWater');
  track(scene,'environmentTone','screen.environmentTone');
  track(scene,'render','screen.render');
 }
 if(enabled('native')){
  method(scene,'_landmarkLayer',fun=>function(ctx,rows,l,...rest){
   const n=nativeCtx(ctx);
   if(n) sample('tile.layer.'+l+':before',ctx,{layer:l});
   const r=Reflect.apply(fun,this,[ctx,rows,l,...rest]);
   if(n) sample('tile.layer.'+l+':after',ctx,{layer:l});
   return r;
  });
  method(scene,'landmark',fun=>function(ctx,l,...rest){
   if(!nativeCtx(ctx))return Reflect.apply(fun,this,[ctx,l,...rest]);
   const owner=l?.asset?.id??null,label='tile.owner.'+(l?.id??'<unknown>');
   sample(label+':before',ctx,{owner});
   let undo=null;
   if(owner==='act4-sideview:33:coastal-v2:lowland'){
    let j=0;
    undo=bind(ctx,'fill',fn=>function(...args){
     const i=j++,color=this.fillStyle,tag='tile.lowland.fill.'+i;
     const res=Reflect.apply(fn,this,args);
     sample(tag,ctx,{owner,fillStyle:typeof color==='string'?color:'nonliteral',fillRule:typeof args[1]==='string'?args[1]:null});
     return res;
    });
   }
   try{
    const r=Reflect.apply(fun,this,[ctx,l,...rest]);
    sample(label+':after',ctx,{owner});
    return r;
   }finally{undo?.();}
  });
 }
 if(enabled('blend')){
  method(scene,'_drawTerrainDomainTiles',fun=>function(...args){
   if(p.insideTile)throw Error('recursive domain probe');p.insideTile=true;
   const undo=bind(main,'drawImage',fn=>function(src,...a){
    const tile=scene._domainTiles?.tiles?.get(pin.tile.k);
    if(!tile||src!==tile.canvas)return Reflect.apply(fn,this,[src,...a]);
    if(tile.left!==10240||tile.top!==4096||scene._domainTiles.rs!==.25||src.width!==516||src.height!==516)
     throw Error('native source tile identity mismatch');
    // getContext on an existing canvas cannot change its configured attributes.
    const srcContext=src.getContext('2d');
    if(!nativeCtx(srcContext))throw Error('native source draw matrix mismatch');
    const attrs={args:a,smoothing:this.imageSmoothingEnabled,quality:this.imageSmoothingQuality,sourceTile:pin.tile.k};
    sample('blend.tile5-2:source',srcContext,attrs);
    sample('blend.tile5-2:before',main,attrs);
    const r=Reflect.apply(fn,this,[src,...a]);
    sample('blend.tile5-2:after',main,attrs);
    return r;
   });
   try{return Reflect.apply(fun,this,args);}finally{undo();p.insideTile=false;}
  });
 }
 Object.defineProperty(G,key,{value:p,configurable:true});
 return true;
}catch(e){for(const f of [...p.undo].reverse())f();throw e;}
}
