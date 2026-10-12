(function(G){'use strict';
// Rendering-only policy. L1 is a projection depth, not an interaction role.
// Keep luminance/alpha, geometry, and gameplay paints independent of scenery.
const STYLE=Object.freeze({version:1,saturation:Object.freeze({L1:.82,L2:.66,L3:.48,L4:.32,SKY:.28}),outline:'#12232bd9',outlinePixels:1.15,materialWidth:6});
const colors=new Map(),contexts=new WeakMap(),metadata=new WeakMap(),images=new WeakMap(),brushes=new Map();
function color(value,layer='L1'){
 if(typeof value!=='string')return value;const amount=STYLE.saturation[layer]??STYLE.saturation.L1,key=amount+':'+value;if(colors.has(key))return colors.get(key);
 let rgb,alpha='',match;if((match=/^#([\da-f]{6})([\da-f]{2})?$/i.exec(value))){rgb=[0,2,4].map(i=>parseInt(match[1].slice(i,i+2),16));alpha=match[2]||'';}
 else if((match=/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(value))){rgb=match.slice(1,4).map(Number);alpha=match[4]===undefined?'':Math.round(Number(match[4])*255).toString(16).padStart(2,'0');}
 else return value;
 const y=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722,result='#'+rgb.map(v=>Math.round(y+(v-y)*amount).toString(16).padStart(2,'0')).join('')+alpha;
 if(colors.size>=4096)colors.clear();colors.set(key,result);return result;
}
function raw(c){return metadata.get(c)?.raw||c;}
function role(c){return metadata.get(c)?.layer||null;}
function image(source,layer='SKY'){
 if(!source?.complete||!source.naturalWidth||typeof document==='undefined')return source;
 let rows=images.get(source);if(!rows){rows=new Map();images.set(source,rows);}const key=STYLE.version+':'+layer;if(rows.has(key))return rows.get(key);
 const cv=document.createElement('canvas');cv.width=source.naturalWidth;cv.height=source.naturalHeight;const c=cv.getContext('2d');c.filter=`saturate(${STYLE.saturation[layer]??1})`;c.drawImage(source,0,0);c.filter='none';rows.set(key,cv);return cv;
}
// Legacy trees/braces use a wide open stroke as the material itself. Preserve
// that silhouette as a cached filled ribbon, never as a contour. Fine lines,
// filled/closed paths and authored Path2D contour strokes are all omitted.
function brush(paths,width,cap){const key=JSON.stringify([paths,width,cap]);if(brushes.has(key))return brushes.get(key);const p=new Path2D(),r=width/2;
 for(const pts of paths)for(let i=1;i<pts.length;i++){const a=pts[i-1],z=pts[i],dx=z[0]-a[0],dy=z[1]-a[1],len=Math.hypot(dx,dy);if(!len)continue;const nx=-dy*r/len,ny=dx*r/len;p.moveTo(a[0]+nx,a[1]+ny);p.lineTo(a[0]-nx,a[1]-ny);p.lineTo(z[0]-nx,z[1]-ny);p.lineTo(z[0]+nx,z[1]+ny);p.closePath();if(cap==='round')for(const v of [a,z]){p.moveTo(v[0]+r,v[1]);p.arc(v[0],v[1],r,0,Math.PI*2);}}
 if(brushes.size>=512)brushes.delete(brushes.keys().next().value);brushes.set(key,p);return p;
}
function context(input,layer='L1'){
 const c=raw(input);let rows=contexts.get(c);if(!rows){rows=new Map();contexts.set(c,rows);}if(rows.has(layer))return rows.get(layer);
 const gameplay=layer==='gameplay',methods=new Map();let paths=[],points=null,closed=false,filled=false;
 const add=(x,y)=>{if(!points){points=[];paths.push(points);}points.push([x,y]);};
 const track=(name,a)=>{
  if(name==='beginPath'){paths=[];points=null;closed=false;filled=false;}else if(name==='moveTo'){points=[];paths.push(points);add(...a);}else if(name==='lineTo')add(...a);else if(name==='closePath'||name==='rect'||name==='roundRect')closed=true;
  else if(name==='quadraticCurveTo'||name==='bezierCurveTo'){const start=points?.at(-1);if(start)for(let i=1;i<=12;i++){const t=i/12,u=1-t;if(name==='quadraticCurveTo')add(u*u*start[0]+2*u*t*a[0]+t*t*a[2],u*u*start[1]+2*u*t*a[1]+t*t*a[3]);else add(u*u*u*start[0]+3*u*u*t*a[0]+3*u*t*t*a[2]+t*t*t*a[4],u*u*u*start[1]+3*u*u*t*a[1]+3*u*t*t*a[3]+t*t*t*a[5]);}}
  else if(name==='arc'||name==='ellipse'){const ellipse=name==='ellipse',[x,y,rx]=a,ry=ellipse?a[3]:rx,rot=ellipse?a[4]:0,start=a[ellipse?5:3],end=a[ellipse?6:4],ccw=a[ellipse?7:5];let span=end-start;if(Math.abs(span)>=Math.PI*2)closed=true;else{if(!ccw&&span<0)span+=Math.PI*2;if(ccw&&span>0)span-=Math.PI*2;}for(let i=0;i<=24;i++){const theta=start+span*i/24,xx=rx*Math.cos(theta),yy=ry*Math.sin(theta);add(x+xx*Math.cos(rot)-yy*Math.sin(rot),y+xx*Math.sin(rot)+yy*Math.cos(rot));}}
 };
 const proxy=new Proxy(c,{
  get(_,name){if(name==='honroVisualLayer')return layer;const value=c[name];if(typeof value!=='function')return value;if(methods.has(name))return methods.get(name);let fn;
   if(!gameplay&&['createLinearGradient','createRadialGradient','createConicGradient'].includes(name))fn=(...args)=>{const gradient=c[name](...args),stop=gradient.addColorStop.bind(gradient);gradient.addColorStop=(at,paint)=>stop(at,color(paint,layer));return gradient;};
   else if(!gameplay&&name==='stroke')fn=(path)=>{if(path||closed||filled||c.lineWidth<STYLE.materialWidth||!points)return;c.save();c.fillStyle=c.strokeStyle;c.fill(brush(paths,c.lineWidth,c.lineCap));c.restore();};
   else if(!gameplay&&(name==='strokeRect'||name==='strokeText'))fn=()=>{};
   else if(!gameplay&&name==='fill')fn=(...args)=>{if(!args.length||typeof args[0]==='string')filled=true;return c.fill(...args);};
   else if(!gameplay&&name==='drawImage')fn=(source,...args)=>c.drawImage(image(source,layer),...args);
   else if(!gameplay&&['beginPath','moveTo','lineTo','closePath','rect','roundRect','quadraticCurveTo','bezierCurveTo','arc','ellipse'].includes(name))fn=(...args)=>{track(name,args);return c[name](...args);};
   else fn=value.bind(c);methods.set(name,fn);return fn;
  },set(_,name,value){c[name]=!gameplay&&['fillStyle','strokeStyle','shadowColor'].includes(name)?color(value,layer):value;return true;}
 });metadata.set(proxy,{raw:c,layer});rows.set(layer,proxy);return proxy;
}
function contextLike(source,target){const layer=role(source);return layer?context(target,layer):target;}
function classify(inst,b,asset=inst?.asset){
 if(!inst)return'decoration';const id=inst.id;
 if(asset?.collision?.length||asset?.interactionType||inst.collisionIds?.length)return'gameplay';
 if(b?.terrain?.some(t=>t.honroElementId===id))return'gameplay';
 if(b?.honroMarkers?.some(m=>m.elementId===id||m.targetId===id)||b?.honroObjectives?.some(o=>o.targetId===id))return'gameplay';
 // These authored bodies share real terrain and event motion, while their
 // visual assets intentionally have no second set of collision polygons.
 if(inst.stage18Bell?.terrainIds?.some(tid=>b?.terrain?.some(t=>t.id===tid))||inst.stage30FerryBody||inst.honroEscortYardCargo||asset?.params?.terrainId&&b?.terrain?.some(t=>t.id===asset.params.terrainId))return'gameplay';
 if(typeof asset?.params?.collisionSource==='string'&&asset.params.collisionSource.split(',').some(tid=>b?.terrain?.some(t=>t.id===tid)))return'gameplay';
 const missionAssets={11:['s11-art-ritual-clearing'],12:['sq-art-waymark','quest-upper-quarry-mouth'],15:['a2-15-0','quest-new-cut-marks','quest-upper-water-mouth'],17:['s17-art-main-hoist','s17-art-control-drive-link'],19:['sb-old-soul-stone'],30:['sf-art-map-stone']};
 if(missionAssets[b?.honroStage]?.includes(id)||asset?.id==='act2:ritual'||asset?.id==='act2:old-soul-stone')return'gameplay';
 if(['receiverStone','cliffShrine','spiritKnot'].includes(inst.kind)&&b?.honroMarkers?.some(m=>['receiver','cliff-cleat'].includes(m.action||m.id)&&Math.hypot(m.x-inst.x,m.y-inst.y)<5))return'gameplay';
 if(id==='sb-bell-body'&&b?.honroBellRevision===1||id===(b?.honroEscortYardSpec?.cargo?.elementId||'sy-art-cargo')&&b?.honroStage===23||id==='sf-art-settled-barge'&&b?.honroStage===30)return'gameplay';
 return'decoration';
}
G.HonroVisualStyle={STYLE,color,raw,role,context,contextLike,image,classify,stats:()=>({colors:colors.size,brushes:brushes.size}),key:()=>`visual-${STYLE.version}-${Object.values(STYLE.saturation).join('-')}-${STYLE.outline}-${STYLE.outlinePixels}-${STYLE.materialWidth}`};
})(globalThis);
