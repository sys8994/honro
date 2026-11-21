() => {
 const proto=CanvasRenderingContext2D.prototype,key='__honroStage29OldFaceStockWitness';
 if(Object.hasOwn(window,key))throw Error('duplicate passive draw observer');
 const d=Object.getOwnPropertyDescriptor(proto,'drawImage'),native=d.value;
 const entries=[], seen=new WeakMap();
 Object.defineProperty(proto,'drawImage',{...d,value:function(...args){
  const result=Reflect.apply(native,this,args);
  if(args.length!==5 || HonroApp.engine?.b?.honroStage!==29)return result;
  const [bitmap,x,y,w,h]=args;
  if(!(bitmap instanceof HTMLCanvasElement)||y!==2698||h!==662||Math.abs(x)>20||Math.abs(w-1150)>35)return result;
  if(!((bitmap.width===828&&bitmap.height===477)||(bitmap.width===1323&&bitmap.height===762)))return result;
  const m=this.getTransform(),r={bounds:[x,y,w,h],native:[m.a,m.b,m.c,m.d,m.e,m.f],surface:[bitmap.width,bitmap.height]};
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
   return result;
  },
  restore(){Object.defineProperty(proto,'drawImage',d);delete window[key];return proto.drawImage===native;}
 }});
 return true;
}
