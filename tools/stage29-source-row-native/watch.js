() => {
 const proto=CanvasRenderingContext2D.prototype,key='__honroStage29OldFaceStockWitness';
 if(Object.hasOwn(window,key))throw Error('duplicate passive draw observer');
 const d=Object.getOwnPropertyDescriptor(proto,'drawImage'),native=d.value;
 const entries=[], seen=new WeakMap(), images=new Map();
 Object.defineProperty(proto,'drawImage',{...d,value:function(...args){
  const result=Reflect.apply(native,this,args);
  if(HonroApp.engine?.b?.honroStage!==29)return result;
  if(args[0] instanceof HTMLImageElement){
   const i=args[0],url=i.currentSrc||i.src;
   if(url&&i.complete&&i.naturalWidth>0)images.set(url,{url,width:i.naturalWidth,height:i.naturalHeight,decoded:true});
  }
  if(args.length!==5)return result;
  const [bitmap,x,y,w,h]=args;
  if(!(bitmap instanceof HTMLCanvasElement))return result;
  const a=y===2698&&h===662&&Math.abs(x)<=20&&Math.abs(w-1150)<=35&&((bitmap.width===828&&bitmap.height===477)||(bitmap.width===1323&&bitmap.height===762));
  const b=y===2609&&h===840&&Math.abs(x+500)<=20&&Math.abs(w-500)<=35&&((bitmap.width===360&&bitmap.height===605)||(bitmap.width===575&&bitmap.height===966));
  if(!a&&!b)return result;
  const m=this.getTransform(),r={kind:a?'stock-first':'new-west',bounds:[x,y,w,h],native:[m.a,m.b,m.c,m.d,m.e,m.f],surface:[bitmap.width,bitmap.height]};
  let i=seen.get(bitmap);if(i===undefined){i=entries.length;seen.set(bitmap,i);entries.push({bitmap,obs:[r],held:null});}
  else if(entries[i].obs.length<64)entries[i].obs.push(r);
  return result;
 }});
 Object.defineProperty(window,key,{configurable:true,value:{
  async read(){
   const result=[];
   for(const e of entries){
    if(!e.held){
     const width=e.bitmap.width,height=e.bitmap.height;
     const q=e.bitmap.getContext('2d').getImageData(0,0,width,height).data;
     const hash=await crypto.subtle.digest('SHA-256',q);
     let alpha=0,n=0;
     for(let i=3;i<q.length;i+=4){alpha=Math.max(alpha,q[i]);n+=+(q[i]>0);}
     e.held={maxAlpha:alpha,paintedPixels:n,rgbaSHA: Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('')};
    }
    result.push({...e.held,draws:e.obs});
   }
   return {tiles:result,images:[...images.values()]};
  },
  restore(){Object.defineProperty(proto,'drawImage',d);delete window[key];return proto.drawImage===native;}
 }});
 return true;
}
