/** Read-only test recorder. No native helper invocation, no draw arguments changed. */
export function installBlitRecorder(screen){
 const proto=CanvasRenderingContext2D.prototype,names=['save','restore','beginPath','rect','clip','drawImage'],old=Object.fromEntries(names.map(n=>[n,proto[n]])),states=new WeakMap(),bodies=new WeakMap(),rows=[],tiles=[],keys=new Map();
 function state(c){let s=states.get(c);if(!s){s={stack:[],clips:[],rects:[]};states.set(c,s);}return s;}
 const mat=c=>{const m=c.getTransform();return[m.a,m.b,m.c,m.d,m.e,m.f];};
 proto.save=function(){if(this.canvas===screen){const s=state(this);s.stack.push(structuredClone(s.clips));}return old.save.apply(this,arguments);};
 proto.restore=function(){if(this.canvas===screen){const s=state(this);s.clips=s.stack.pop()||[];}return old.restore.apply(this,arguments);};
 proto.beginPath=function(){if(this.canvas===screen)state(this).rects=[];return old.beginPath.apply(this,arguments);};
 proto.rect=function(...a){if(this.canvas===screen)state(this).rects.push({args:a,matrix:mat(this)});return old.rect.apply(this,a);};
 proto.clip=function(...a){if(this.canvas===screen){const s=state(this);s.clips.push({rects:structuredClone(s.rects),args:a.map(v=>typeof v==='string'?v:'Path2D'),matrix:mat(this)});}return old.clip.apply(this,a);};
 proto.drawImage=function(image,...a){if(this.canvas===screen&&bodies.has(image)){const body=bodies.get(image),key=JSON.stringify([body.matrix,body.canvas]);let id=keys.get(key);if(id===undefined){id=tiles.length;keys.set(key,id);tiles.push({id,...body,png:image.toDataURL('image/png')});}if(rows.length<256)rows.push({tile:id,args:a,matrix:mat(this),clips:structuredClone(state(this).clips),globalAlpha:this.globalAlpha,composite:this.globalCompositeOperation,smoothing:this.imageSmoothingEnabled,smoothingQuality:this.imageSmoothingQuality});}return old.drawImage.call(this,image,...a);};
 return {body(c,row){if(c.canvas!==screen)bodies.set(c.canvas,structuredClone(row));},stop(){for(const n of names)proto[n]=old[n];return{scope:'Actual original drawImage numeric arguments; BODY transforms are reported Canvas DOMMatrix float values, not inferred tile positions. PNGs diagnostic only. Instrumented timing invalid.',rows,tiles};}};
}
