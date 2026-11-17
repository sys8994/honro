(function(G){'use strict';
// Stage 32 only. Original 25 path geometries/order remain verbatim. The limited
// non-walk band (source y780..904) transitions pale/green to the existing material.
// Roads and original geometry retained. Nonwalk color edits start at world1420. Not a general blur.
// Rasterize one shared world-coordinate material into the current device plane;
// every geology clip then samples the same bitmap without repeated vector AA.
if(G.HonroStage32FoundationArt)return;
const FOUNDATION='act4-handoff:32:foundation',BODY='act4-handoff:32:body-shared-material';
const MAX_PIXELS=8*1024*1024,prepared=new WeakMap();
const MAX_TRANSITION_PIXELS=1024*1024;
let buffer=null,bufferContext=null,last=null;
let transitionWork=null,transitionColor=null,transitionBody=null;
const transitionCounters={fills:0,passes:0,boundaryPasses:0,allocations:0,resizes:0,bytes:0,peakBytes:0,skips:0,lastSkip:null};
function transitionMemory(){
 transitionCounters.bytes=[transitionWork,transitionColor,transitionBody].reduce((n,c)=>n+(c?c.width*c.height*4:0),0);
 transitionCounters.peakBytes=Math.max(transitionCounters.peakBytes,transitionCounters.bytes);
}
function transitionCanvas(){
 const cv=G.document?.createElement?.('canvas');if(!cv||!cv.getContext('2d'))return null;
 cv.width=1;cv.height=1;transitionCounters.allocations++;return cv;
}
function resizeTransition(cv,w,h){
 if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;transitionCounters.resizes++;transitionMemory();}
}
function canTransition(c,l){
 const m=c.getTransform(),w=c.canvas.width,h=c.canvas.height;
 let reason=null;
 if(m.b!==0||m.c!==0||m.a<=0||m.d<=0)reason='non-axis-aligned';
 else if(c.globalAlpha!==1||(l.opacity??1)!==1||c.globalCompositeOperation!=='source-over'||c.filter&&c.filter!=='none'||c.shadowBlur||c.shadowOffsetX||c.shadowOffsetY)reason='paint-state';
 else if(w*h>MAX_TRANSITION_PIXELS)reason='transition-pixel-cap';
 else if(!G.document?.createElement)reason='canvas-unavailable';
 if(!reason){
  transitionWork??=transitionCanvas();transitionColor??=transitionCanvas();transitionBody??=transitionCanvas();
  if(!transitionWork||!transitionColor||!transitionBody)reason='canvas-unavailable';transitionMemory();
 }
 if(reason){transitionCounters.skips++;transitionCounters.lastSkip=reason;return false;}
 return true;
}
const counters={rasterizations:0,hits:0,allocations:0,resizes:0,bytes:0,peakBytes:0,fallbacks:0,lastFallback:null};
const d=n=>typeof n.d==='string'?n.d:Array.isArray(n.dParts)?n.dParts.join(''):null;
function fallback(reason){counters.fallbacks++;counters.lastFallback=reason;return false;}
'use strict';
// Source-curve scanline accelerator. Geometry is never flattened or modified.
// Near boundary queries defer to the original browser point-containment oracle.
function compileScanline(nodes,cfg){
 const pool=new Map(),rowCache=new Map(),labelTable=Array.from({length:52},(_,i)=>({top:i%26-1,gray:i>=26}));let rowBytes=0,rowHits=0,rowMisses=0;const MAX_ROW_BYTES=4*1024*1024;
 const evalC=(p,t)=>{const u=1-t;return u*u*u*p[0]+3*u*u*t*p[1]+3*u*t*t*p[2]+t*t*t*p[3];};
 function add(coords,owner,gray){const key=coords.join(',');let s=pool.get(key);if(!s){const xs=[coords[0],coords[2],coords[4],coords[6]],ys=[coords[1],coords[3],coords[5],coords[7]],a=-ys[0]+3*ys[1]-3*ys[2]+ys[3],b=2*(ys[0]-2*ys[1]+ys[2]),c=ys[1]-ys[0],cuts=[0,1];if(Math.abs(a)<1e-14){if(Math.abs(b)>1e-14){const r=-c/b;if(r>0&&r<1)cuts.push(r);}}else{const disc=b*b-4*a*c;if(disc>0){for(const r of[(-b-Math.sqrt(disc))/(2*a),(-b+Math.sqrt(disc))/(2*a)])if(r>0&&r<1)cuts.push(r);}}cuts.sort((a,b)=>a-b);s={xs,ys,pieces:cuts.slice(0,-1).map((lo,i)=>{const hi=cuts[i+1],ylo=evalC(ys,lo),yhi=evalC(ys,hi);return{lo,hi,ylo,yhi,min:Math.min(ylo,yhi),max:Math.max(ylo,yhi),delta:yhi>ylo?1:-1};}),owners:[]};pool.set(key,s);}s.owners.push({owner,gray});}
 nodes.forEach((n,owner)=>{const raw=n.d??n.dParts.join(''),tokens=raw.match(/[MLCz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g);if(tokens.join('').replace(/\+/g,'')!==raw.replace(/[\s,]/g,'').replace(/\+/g,''))throw Error('Unsupported SVG syntax');let i=0,x=0,y=0,x0=0,y0=0,loop=-1,cmd;while(i<tokens.length){if(/[MLCz]/.test(tokens[i]))cmd=tokens[i++];const gray=cfg.graySubpaths?.[owner]?.includes(loop)||false;
 const line=(nx,ny)=>{add([x,y,x+(nx-x)/3,y+(ny-y)/3,x+2*(nx-x)/3,y+2*(ny-y)/3,nx,ny],owner,gray);x=nx;y=ny;};
 if(cmd==='M'){x=+tokens[i++];y=+tokens[i++];x0=x;y0=y;loop++;cmd='L';}
 else if(cmd==='L')line(+tokens[i++],+tokens[i++]);
 else if(cmd==='C'){const v=tokens.slice(i,i+6).map(Number);i+=6;add([x,y,...v],owner,gray);x=v[4];y=v[5];}
 else if(cmd==='z'){line(x0,y0);cmd=null;}
 else throw Error('Unsupported path command');
 }});
 const segments=[...pool.values()],buckets=new Map();
 for(const segment of segments)for(const piece of segment.pieces){if(piece.min===piece.max)continue;const first=Math.floor(piece.min/8),last=Math.floor(piece.max/8);if(last-first>4096)throw Error('Unexpected source coordinate range');for(let key=first;key<=last;key++){if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push({s:segment,p:piece});}}

 // Research candidate only: safeguarded Newton inversion. Near horizontal
 // tangencies use the untouched 44-step baseline to avoid cancellation error.
 function crossingX(s,p,y){
  const reference=()=>{let lo=p.lo,hi=p.hi;for(let k=0;k<44;k++){const mid=(lo+hi)/2,v=evalC(s.ys,mid);if((v<y)===(p.delta>0))lo=mid;else hi=mid;}return evalC(s.xs,(lo+hi)/2);};
  const derivative=t=>{const u=1-t,v=s.ys;return 3*(u*u*(v[1]-v[0])+2*u*t*(v[2]-v[1])+t*t*(v[3]-v[2]));};
  let lo=p.lo,hi=p.hi,t=lo+(hi-lo)*(y-p.ylo)/(p.yhi-p.ylo);
  for(let k=0;k<12;k++){
   const v=evalC(s.ys,t),der=derivative(t);if(Math.abs(der)<1)return reference();
   if(v===y)return evalC(s.xs,t);
   if((v<y)===(p.delta>0))lo=t;else hi=t;
   const next=t-(v-y)/der;
   if(Math.abs(next-t)<1e-13&&Number.isFinite(next)&&next>=lo&&next<=hi)return evalC(s.xs,next);
   t=Number.isFinite(next)&&next>lo&&next<hi?next:(lo+hi)/2;
  }
  return reference();
 }

 function row(y){if(rowCache.has(y)){const hit=rowCache.get(y);rowCache.delete(y);rowCache.set(y,hit);rowHits++;return hit;}rowMisses++;const events=[];for(const {s,p} of buckets.get(Math.floor(y/8))||[]){if(!(y>=p.min&&y<p.max)||p.min===p.max)continue;events.push({x:crossingX(s,p,y),delta:p.delta,owners:s.owners});}
 events.sort((a,b)=>a.x-b.x);const winding=new Int32Array(nodes.length),gray=new Int32Array(nodes.length),bounds=[],labels=[];
 for(const e of events){for(const o of e.owners){winding[o.owner]+=e.delta;if(o.gray)gray[o.owner]+=e.delta;}let top=-1;for(let i=nodes.length-1;i>=0;i--)if(winding[i]){top=i;break;}const label=labelTable[top+1+(top>=0&&gray[top]!==0?26:0)];if(bounds.length&&e.x===bounds.at(-1))labels[labels.length-1]=label;else{bounds.push(e.x);labels.push(label);}}
 const rowX=Float64Array.from(bounds),rowLabels=Uint8Array.from(labels,v=>v.top+1+(v.gray?26:0));
 const result={events:events.length,logicalBytes:rowX.byteLength+rowLabels.byteLength+128,
 span(x0,x1){let lo=0,hi=rowX.length;while(lo<hi){const mid=(lo+hi)>>1;if(rowX[mid]<=x0)lo=mid+1;else hi=mid;}
  // Group only original sixteen samples whose full interval is farther than
  // the unchanged oracle guard from every source boundary. No sampling loss.
  if(x0-(rowX[lo-1]??-Infinity)<=.002||(rowX[lo]??Infinity)-x1<=.002)return null;
  return lo?labelTable[rowLabels[lo-1]]:{top:-1,gray:false};
 },at(x,fallback){let lo=0,hi=rowX.length;while(lo<hi){const mid=(lo+hi)>>1;if(rowX[mid]<=x)lo=mid+1;else hi=mid;}const estimate=lo?labelTable[rowLabels[lo-1]]:{top:-1,gray:false},distance=Math.min(Math.abs(x-(rowX[lo]??Infinity)),Math.abs(x-(rowX[lo-1]??-Infinity)));if(distance<.002)return fallback(x,y,distance,estimate);return estimate;}};
 if(result.logicalBytes<=MAX_ROW_BYTES){while(rowBytes+result.logicalBytes>MAX_ROW_BYTES&&rowCache.size){const first=rowCache.keys().next().value;rowBytes-=rowCache.get(first).logicalBytes;rowCache.delete(first);}rowCache.set(y,result);rowBytes+=result.logicalBytes;}return result;
 }
 return {row,uniqueSegments:segments.length,clearRows:()=>{rowCache.clear();rowBytes=0;},stats:()=>({rowBytes,rowHits,rowMisses,rows:rowCache.size,uniqueSegments:segments.length,scope:"Logical numeric/reference payload estimate, not JS heap/GPU bytes; bounded LRU4MiB"})};
}

function compileSpatialOracle(nodes,cfg,Path2D,options={}){
 const cellWidth=options.cellWidth??64,cellHeight=options.cellHeight??32,margin=options.margin??.01,maxEntries=options.maxEntries??128,maxStringBytes=options.maxStringBytes??(2*1024*1024);
 if(!(cellWidth>0&&cellHeight>0&&margin>=0&&maxEntries>=1&&maxStringBytes>=0))throw Error('Invalid spatial-oracle limits');
 const cache=new Map();let bytes=0,hits=0,misses=0,evictions=0,built=0,maxObservedEntries=0,maxObservedBytes=0;
 const paths=nodes.map((n,index)=>{
  const raw=n.d??n.dParts.join(''),subs=raw.match(/M[^M]*/g);if(!subs||subs.join('')!==raw||subs.some(s=>!s.trimEnd().endsWith('z')||/[AHQSTVZachlmqstv]/.test(s.replace(/[eE][-+]?\d+/g,''))))throw Error('Requires original absolute M/L/C/z source');
  const grayIndices=new Set(cfg.graySubpaths?.[index]??[]);
  const parts=subs.map((source,i)=>{
   const tok=source.match(/[MLCz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g);if(tok.join('').replace(/\+/g,'')!==source.replace(/[\s,]/g,'').replace(/\+/g,''))throw Error('Unsupported source token');
   const p=tok.filter(t=>!/[MLCz]/.test(t)).map(Number);if(p.length%2||!p.every(Number.isFinite))throw Error('Invalid coordinate pairs');
   const box=[Infinity,Infinity,-Infinity,-Infinity];for(let j=0;j<p.length;j+=2){box[0]=Math.min(box[0],p[j]);box[1]=Math.min(box[1],p[j+1]);box[2]=Math.max(box[2],p[j]);box[3]=Math.max(box[3],p[j+1]);}
   return {source,gray:grayIndices.has(i),box};
  });
  const supplied=options.fullPaths?.[index];return {parts,rule:n.fillRule||'nonzero',full:supplied?.path??new Path2D(raw),gray:supplied?.gray??(grayIndices.size?new Path2D(parts.filter(p=>p.gray).map(p=>p.source).join('')):null)};
 });
 function get(index,x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y)||!paths[index])throw Error('Invalid spatial query');
  const ix=Math.floor(x/cellWidth),iy=Math.floor(y/cellHeight),key=index+':'+ix+':'+iy;
  const hit=cache.get(key);if(hit){cache.delete(key);cache.set(key,hit);hits++;return hit;}misses++;
  const x0=ix*cellWidth-margin,x1=(ix+1)*cellWidth+margin,y0=iy*cellHeight-margin,y1=(iy+1)*cellHeight+margin,p=paths[index];
  const selected=p.parts.filter(s=>s.box[2]>=x0&&s.box[0]<=x1&&s.box[3]>=y0&&s.box[1]<=y1);
  const source=selected.map(s=>s.source).join(''),graySource=selected.filter(s=>s.gray).map(s=>s.source).join('');
  const all=selected.length===p.parts.length;
  const result={path:all?p.full:(source?new Path2D(source):null),gray:all?p.gray:(graySource?new Path2D(graySource):null),source,graySource,rule:p.rule,selectedSubpaths:selected.length,totalSubpaths:p.parts.length,inputStringBytes:2*(source.length+graySource.length+key.length)};
  built++;
  if(result.inputStringBytes<=maxStringBytes){
   while(cache.size&&(cache.size>=maxEntries||bytes+result.inputStringBytes>maxStringBytes)){const first=cache.keys().next().value;bytes-=cache.get(first).inputStringBytes;cache.delete(first);evictions++;}
   cache.set(key,result);bytes+=result.inputStringBytes;maxObservedEntries=Math.max(maxObservedEntries,cache.size);maxObservedBytes=Math.max(maxObservedBytes,bytes);
  }
  return result;
 }
 return {paths,get,clear(){cache.clear();bytes=0;},stats:()=>({cellWidth,cellHeight,margin,maxEntries,maxStringBytes,entries:cache.size,inputStringBytes:bytes,maxObservedEntries,maxObservedBytes,hits,misses,evictions,built,scope:'Bounded retained input UTF-16 string payload only. Not actual JS heap or native Path2D/GPU memory; original full paths and source metadata are outside this cache estimate.'})};
}

function geometry(asset){
 if(prepared.has(asset))return prepared.get(asset);
 const q={};
 if(asset.id===FOUNDATION){
  const v=asset.vector,r=v?.root,g=r?.children?.[0],field=g?.children?.[0];
  if(asset.params?.stage32SharedMaterial!==1||r?.transform?.join(',')!=='7.2,0,0,7.2,0,0'||g?.clipPath!=='source-alpha-silhouette'||!field?.transform||!field.children?.length)return null;
  q.silhouette=new G.Path2D(v.clips[g.clipPath].join(''));
  q.fieldTransform=field.transform;
  q.field=field.children.map(n=>({path:new G.Path2D(d(n)),fill:n.fill}));
 }else{
  const cfg=asset.params?.stage32SharedMaterial;
  if(cfg?.version!==1||cfg.bodyScale!==2.2||!Array.isArray(cfg.protectedPaths))return null;
  const nodes=[];function walk(n){if(n.tag==='path')nodes.push(n);for(const child of n.children||[])walk(child);}walk(asset.vector.root);
  if(nodes.length!==25||cfg.sourcePathSHA256?.length!==25||!asset.vector.clips?.portApron)return null;
  q.apron=new G.Path2D(asset.vector.clips.portApron.join(''));
  const protect=new Set(cfg.protectedPaths);
  q.paths=nodes.map((n,i)=>{
   const path=d(n),coords=path.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g).map(Number),bounds=[Infinity,Infinity,-Infinity,-Infinity];for(let j=0;j<coords.length;j+=2){bounds[0]=Math.min(bounds[0],coords[j]);bounds[1]=Math.min(bounds[1],coords[j+1]);bounds[2]=Math.max(bounds[2],coords[j]);bounds[3]=Math.max(bounds[3],coords[j+1]);}const indices=cfg.graySubpaths?.[i],subs=indices?path.match(/[Mm][^Mm]*/g):null;
   if(indices?.some(j=>!Number.isInteger(j)||!subs[j]))throw Error('Invalid Stage 32 original subpath index');
   return {sourceIndex:i,bounds,path:new G.Path2D(path),fill:n.fill,rule:n.fillRule||'nonzero',protected:protect.has(i),gray:indices?new G.Path2D(indices.map(j=>subs[j]).join('')):null};
  });
  q.scanline=compileScanline(nodes,cfg);q.spatial=compileSpatialOracle(nodes,cfg,G.Path2D,{fullPaths:q.paths});
 }
 prepared.set(asset,q);return q;
}
function material(c,asset){
 const w=c.canvas?.width,h=c.canvas?.height,m=c.getTransform();
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>MAX_PIXELS)return null;
 const matrix=[m.a,m.b,m.c,m.d,m.e,m.f];if(matrix.some(v=>!Number.isFinite(v)))return null;
 const style=G.HonroVisualStyle?.key?.()||'',key=[w,h,...matrix,style].join('|');
 if(last?.context===c&&last.asset===asset&&last.key===key){counters.hits++;return buffer;}
 if(!buffer){buffer=typeof G.OffscreenCanvas==='function'?new G.OffscreenCanvas(w,h):G.document?.createElement('canvas');if(!buffer)return null;counters.allocations++;}
 if(buffer.width!==w||buffer.height!==h){buffer.width=w;buffer.height=h;counters.resizes++;}
 bufferContext=buffer.getContext('2d');if(!bufferContext)return null;
 const q=geometry(asset);if(!q)return null;
 const cc=bufferContext;cc.setTransform(1,0,0,1,0,0);cc.globalAlpha=1;cc.globalCompositeOperation='source-over';cc.filter='none';cc.clearRect(0,0,w,h);
 cc.setTransform(...matrix);cc.translate(-5500,-1950);cc.scale(7.2,7.2);cc.transform(...q.fieldTransform);
 for(const n of q.field){cc.fillStyle=n.fill;cc.fill(n.path);}
 counters.rasterizations++;counters.bytes=w*h*4;counters.peakBytes=Math.max(counters.peakBytes,counters.bytes);
 last={context:c,asset,key};return buffer;
}
function bitmap(c,cv){c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(cv,0,0);c.restore();}
// Candidate only. Correct correlated-AA hidden-green residue on internal non-walk
// seams. Never changes source geometry or full BODY alpha. The finite sampling
// is explicitly measured; not a claim of analytic exact area integration.
let activeScanline=null,activeSpatial=null;
const coverageStats={spatialQueries:0,spatialCompared:0,spatialMismatches:0,maskComparisons:0,maskComparedPixels:0,maskMismatches:0,boundaryFallbacks:0,labelOverrides:0,maxOverrideDistance:0,calls:0,eligible:0,corrected:0,samples:0,ms:0,alphaChanged:0,roadSkipped:0,opaqueGrassSkipped:0,actualGrassSamples:0,bytes:0};
let coverageMasks=null;
function coherentColor(c,cv,q){
 if(activeSpatial!==q.spatial){activeSpatial?.clear();activeSpatial=q.spatial;}
 if(activeScanline!==q.scanline){activeScanline?.clearRows();activeScanline=q.scanline;}
 const t=G.performance?.now?.()??Date.now(),m=c.getTransform(),world=m.d/2.2;
 // Lowest actual walk y1342; authored roads extend to1368.4. Upper limit is the
 // existing independently validated lower-material transition at world1716.
 if(m.b||m.c||m.a<=0||m.d<=0||c.globalAlpha!==1||c.globalCompositeOperation!=='source-over'||c.filter&&c.filter!=='none'||c.shadowBlur||c.shadowOffsetX||c.shadowOffsetY)return;
 const y0=Math.max(0,Math.ceil(world*1420+m.f)),y1=Math.min(c.canvas.height,Math.floor(world*1716+m.f));
 if(y1<=y0)return;const w=c.canvas.width,h=y1-y0;if(w*h>1024*1024)return;
 coverageStats.calls++;
 coverageMasks??=[G.document.createElement('canvas')];
 const v=coverageMasks[0];if(v.width!==w||v.height!==h){v.width=w;v.height=h;}
 const z=v.getContext('2d');z.setTransform(1,0,0,1,0,0);z.globalAlpha=1;z.globalCompositeOperation='copy';z.fillStyle='#000';z.fillRect(0,0,w,h);z.globalCompositeOperation='source-over';z.setTransform(m.a/2.2,0,0,m.d/2.2,m.e,m.f-y0);z.save();z.clip(q.apron);z.scale(2.2,2.2);
 for(const p of q.paths){z.fillStyle=p.sourceIndex>=21?'#00ffff':p.sourceIndex>=12&&p.sourceIndex<=17?'#ff00ff':'#0000ff';z.fill(p.path,p.rule);}z.restore();
 const packed=z.getImageData(0,0,w,h).data;
 // Debug-only exact original three-mask comparison. The benchmark explicitly
 // disables this verification before any timed cold/pan calls.
 if(G.HONRO_STAGE32_VERIFY_PACKED_MASKS){
  for(let index=0;index<3;index++){
   const cv=G.document.createElement('canvas');cv.width=w;cv.height=h;const t=cv.getContext('2d');t.globalCompositeOperation='copy';t.fillStyle=index===2?'rgba(0,0,0,0)':'#000';t.fillRect(0,0,w,h);t.globalCompositeOperation='source-over';t.setTransform(m.a/2.2,0,0,m.d/2.2,m.e,m.f-y0);t.save();t.clip(q.apron);t.scale(2.2,2.2);
   for(const p of q.paths){t.fillStyle=index===2?'#fff':index===0&&p.sourceIndex>=12&&p.sourceIndex<=17||index===1&&p.sourceIndex>=21?'#fff':'#000';t.fill(p.path,p.rule);}t.restore();const reference=t.getImageData(0,0,w,h).data;
   for(let k=0;k<packed.length;k+=4)if(packed[k+index]!==reference[k+(index===2?3:0)]){coverageStats.maskMismatches++;throw Error('Packed semantic mask mismatch');}
   coverageStats.maskComparisons++;coverageStats.maskComparedPixels+=w*h;cv.width=1;cv.height=1;
  }
 }

 const old=c.getImageData(0,y0,w,h),data=old.data,field=cv.getContext('2d').getImageData(0,y0,w,h).data;
 const colors=q.paths.map(p=>{const hex=p.fill.replace('#','');if(!/^[0-9a-f]{6}$/i.test(hex))throw Error('Unexpected source palette');return [0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));});
 const grass=packed,road=packed,body=packed,sampleN=16;
 for(let y=0;y<h;y++){
  let scanRows=null;
  for(let x=0;x<w;x++){
  const k=(y*w+x)*4;if(!grass[k])continue;
  if(grass[k]===255){coverageStats.opaqueGrassSkipped++;continue;}
  if(road[k+1]){coverageStats.roadSkipped++;continue;}
  if(body[k+2]!==255||data[k+3]!==255||field[k+3]!==255)continue;
  coverageStats.eligible++;scanRows??=Array.from({length:sampleN},(_,sy)=>q.scanline.row((y+y0+(sy+.5)/sampleN-m.f)/m.d));const sum=[0,0,0];let actualGrass=0;
  for(let sy=0;sy<sampleN;sy++){
   const uniform=scanRows[sy].span((x+.5/sampleN-m.e)/m.a,(x+(sampleN-.5)/sampleN-m.e)/m.a);
   if(uniform){
    const j=uniform.top;if(j<0){sum[0]=NaN;continue;}
    if(j>=12&&j<=17)actualGrass+=sampleN;
    const p=q.paths[j],color=p.protected||uniform.gray?colors[j]:field.subarray(k,k+3);
    for(let ch=0;ch<3;ch++)sum[ch]+=sampleN*color[ch];continue;
   }
   for(let sx=0;sx<sampleN;sx++){
   const dx=x+(sx+.5)/sampleN,dy=y+y0+(sy+.5)/sampleN;let color=null;
   const label=scanRows[sy].at((dx-m.e)/m.a,(_x,_y,distance,estimate)=>{coverageStats.boundaryFallbacks++;let actual={top:-1,gray:false};for(let j=q.paths.length-1;j>=0;j--){const p=q.paths[j],bb=p.bounds;if(_x<bb[0]-.01||_x>bb[2]+.01||_y<bb[1]-.01||_y>bb[3]+.01)continue;const cell=q.spatial.get(j,_x,_y),inside=!!cell.path&&c.isPointInPath(cell.path,dx,dy,p.rule);coverageStats.spatialQueries++;
if(G.HONRO_STAGE32_VERIFY_PACKED_MASKS){coverageStats.spatialCompared++;if(inside!==c.isPointInPath(p.path,dx,dy,p.rule)){coverageStats.spatialMismatches++;throw Error('Spatial full-path oracle mismatch');}}
if(inside){const gray=!!cell.gray&&c.isPointInPath(cell.gray,dx,dy,p.rule);if(G.HONRO_STAGE32_VERIFY_PACKED_MASKS){coverageStats.spatialCompared++;if(gray!==(!!p.gray&&c.isPointInPath(p.gray,dx,dy,p.rule))){coverageStats.spatialMismatches++;throw Error('Spatial gray oracle mismatch');}}actual={top:j,gray};break;}}if(actual.top!==estimate.top||actual.gray!==estimate.gray){coverageStats.labelOverrides++;coverageStats.maxOverrideDistance=Math.max(coverageStats.maxOverrideDistance,distance);}return actual;});
   if(label.top>=0){const j=label.top,p=q.paths[j];if(j>=12&&j<=17)actualGrass++;color=p.protected||label.gray?colors[j]:field.subarray(k,k+3);}
   // A fully opaque raster BODY can still contain unresolved subpixel holes.
   // Such a pixel is not safe to recolor: leave the complete original pixel.
   if(!color){sum[0]=NaN;break;}for(let ch=0;ch<3;ch++)sum[ch]+=color[ch];
  }
  }
  coverageStats.samples+=256;coverageStats.actualGrassSamples+=actualGrass;
  if(!Number.isFinite(sum[0]))continue;
  // Correct only independently composited excess green, not genuine grass AA.
  // 1/255 is a quantization guard, not a removal threshold for real small grass.
  if(grass[k]/255<=actualGrass/256+1/255)continue;
  // Smooth the newly declared nonwalk start band. The larger setback protects
  // the final minimum-zoom filtered walk buffer, not only source sample rows.
  const worldY=(y+y0+.5-m.f)/world,fade=Math.max(0,Math.min(1,(worldY-1420)/40)),weight=fade*fade*(3-2*fade);
  const rgb=sum.map((v,j)=>Math.round(data[k+j]+weight*(Math.round(v/256)-data[k+j])));if(rgb.some((v,j)=>v!==data[k+j])){for(let j=0;j<3;j++)data[k+j]=rgb[j];coverageStats.corrected++;}
 }
 }
 // Pixel write preserves alpha exactly, and only commits changed internal
 // pixels. putImageData ignores active clips, so eligibility is explicit above.
 c.putImageData(old,0,y0);coverageStats.bytes=4*w*h*4;coverageStats.ms+=(G.performance?.now?.()??Date.now())-t;
}

function draw(c,l,b,originalOnly=false){
 const id=l?.asset?.id;
 if(b?.honroStage!==32||b?.honroCustom||![FOUNDATION,BODY].includes(id))return false;
 if((l.scale??1)!==1||(l.rotation??0)!==0||l.x!==(id===FOUNDATION?-5500:0)||l.y!==(id===FOUNDATION?-1950:0))return fallback('unexpected-placement');
 // The compiler clones providers into battle landmarks. Share that exact
 // resolved field object across foundation/BODY passes, not the library copy.
 const field=id===FOUNDATION?l.asset:(b.honroLandmarks?.find(v=>v.asset?.id===FOUNDATION)?.asset||G.HONRO_PROJECT?.library?.find(a=>a.id===FOUNDATION));
 if(!field)return fallback('missing-field');
 let q,cv;try{q=geometry(l.asset);cv=q&&material(c,field);}catch{return fallback('invalid-source');}
 if(!q||!cv)return fallback('invalid-source-or-device-pixel-cap');
 const transition=id===BODY&&!originalOnly&&canTransition(c,l);
 let originalContext=null,stagedCanvas=null;
 const threshold=c.getTransform().d*1716+c.getTransform().f;
 if(id===BODY&&transition&&threshold>0&&threshold<c.canvas.height){
  originalContext=c;const matrix=c.getTransform();
  stagedCanvas=transitionBody;resizeTransition(stagedCanvas,c.canvas.width,c.canvas.height);transitionCounters.boundaryPasses++;
  const next=stagedCanvas.getContext('2d');next.setTransform(1,0,0,1,0,0);next.globalAlpha=1;next.globalCompositeOperation='copy';next.drawImage(c.canvas,0,0);next.globalCompositeOperation='source-over';next.setTransform(matrix);next.globalAlpha=c.globalAlpha;c=next;
 }
 if(transition)transitionCounters.passes++;
 c.save();try{
  c.globalAlpha*=(l.opacity??1);
  if(id===FOUNDATION){c.translate(l.x,l.y);c.scale(7.2,7.2);c.clip(q.silhouette);bitmap(c,cv);}
  else{
   c.clip(q.apron);c.scale(2.2,2.2);
   let transitionMaskReady=false; // draw-local: identical material ROI/gradient for every protected fill
   for(const n of q.paths){
    if(n.protected){
  if(!transition||n.sourceIndex>=21){c.fillStyle=n.fill;c.fill(n.path,n.rule);continue;}
  // Original path/order is unchanged. No geometry erasure.
  // Source y780 = world1716, below the lowest actual route at world1342.
  const m=c.getTransform(),inv=m.inverse();if(m.b!==0||m.c!==0||m.d<=0)throw Error('Unexpected tile transform');
  const split=Math.max(0,Math.min(cv.height,Math.floor(m.d*780+m.f)));
  if(split===cv.height){c.fillStyle=n.fill;c.fill(n.path,n.rule);continue;}
  if(split>0){c.save();c.setTransform(1,0,0,1,0,0);c.beginPath();c.rect(0,0,cv.width,split);c.clip();c.setTransform(m);c.fillStyle=n.fill;c.fill(n.path,n.rule);c.restore();}
  const y0=Math.max(0,Math.floor(m.d*780+m.f)-2),y1=Math.min(cv.height,Math.ceil(m.d*904+m.f)+2),bandHeight=y1-y0;
  if(bandHeight<=0){c.fillStyle=n.fill;c.fill(n.path,n.rule);continue;}
  const work=transitionWork,color=transitionColor;
  resizeTransition(work,cv.width,bandHeight);resizeTransition(color,cv.width,bandHeight);
  const wc=work.getContext('2d'),cc=color.getContext('2d');
  if(!transitionMaskReady){
  wc.setTransform(1,0,0,1,0,0);wc.globalAlpha=1;wc.globalCompositeOperation='copy';wc.drawImage(cv,0,y0,cv.width,bandHeight,0,0,cv.width,bandHeight);
  wc.globalCompositeOperation='destination-in';wc.setTransform(m.a,m.b,m.c,m.d,m.e,m.f-y0);
  const g=wc.createLinearGradient(0,780,0,900);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.25,'rgba(255,255,255,.15625)');g.addColorStop(.5,'rgba(255,255,255,.5)');g.addColorStop(.75,'rgba(255,255,255,.84375)');g.addColorStop(1,'rgba(255,255,255,1)');wc.fillStyle=g;wc.fillRect(-1000000,-1000000,2000000,2000000);transitionMaskReady=true;
  }
  cc.setTransform(1,0,0,1,0,0);cc.globalAlpha=1;cc.globalCompositeOperation='copy';cc.fillStyle=n.fill;cc.fillRect(0,0,cv.width,bandHeight);cc.globalCompositeOperation='source-over';cc.drawImage(work,0,0);
  const pattern=c.createPattern(color,'no-repeat');if(!pattern)throw Error('Missing transition pattern');pattern.setTransform(inv.translate(0,y0));
  c.save();c.setTransform(1,0,0,1,0,0);c.beginPath();c.rect(0,split,cv.width,cv.height-split);c.clip();c.setTransform(m);c.fillStyle=pattern;c.fill(n.path,n.rule);c.restore();transitionCounters.fills++;continue;
 }
    c.save();c.clip(n.path,n.rule);bitmap(c,cv);
    if(n.gray){c.fillStyle=n.fill;c.fill(n.gray,n.rule);}c.restore();
   }
   if(!originalContext)coherentColor(c,cv,q);
  }
 }finally{c.restore();}
 if(originalContext){
  // Preserve the original BODY pass exactly above the approved non-walk band.
  // The alternate pass is staged independently; only integer lower rows publish.
  const matrix=originalContext.getTransform(),split=Math.max(0,Math.min(stagedCanvas.height,Math.floor(matrix.d*1716+matrix.f)));
  draw(originalContext,l,b,true);
  if(split<stagedCanvas.height){originalContext.save();originalContext.setTransform(1,0,0,1,0,0);originalContext.globalAlpha=1;originalContext.globalCompositeOperation='source-over';originalContext.beginPath();originalContext.rect(0,split,stagedCanvas.width,stagedCanvas.height-split);originalContext.clip();originalContext.drawImage(stagedCanvas,0,0);originalContext.restore();}
 }
 return true;
}
G.HonroStage32FoundationArt={draw,stats:()=>({...counters,coverage:{...coverageStats,retainedCanvasBytes:(coverageMasks||[]).reduce((n,v)=>n+v.width*v.height*4,0),scanline:activeScanline?.stats(),spatial:activeSpatial?.stats()},maxPixels:MAX_PIXELS,transition:{...transitionCounters,maxPixels:MAX_TRANSITION_PIXELS,bufferDimensions:[transitionWork,transitionColor,transitionBody].map(c=>c?[c.width,c.height]:null)},totalLogicalBytes:counters.bytes+transitionCounters.bytes+(coverageMasks||[]).reduce((n,v)=>n+v.width*v.height*4,0)}),clear:()=>{activeSpatial?.clear();activeScanline?.clearRows();for(const mask of coverageMasks||[]){mask.width=1;mask.height=1;}coverageStats.bytes=coverageMasks?4:0;last=null;if(buffer){buffer.width=1;buffer.height=1;}counters.bytes=buffer?4:0;for(const cv of [transitionWork,transitionColor,transitionBody])if(cv){cv.width=1;cv.height=1;}transitionMemory();}};
})(globalThis);

