import assert from'node:assert/strict';import vm from'node:vm';import fs from'node:fs';import{createCanvas,Path2D,DOMMatrix}from'@napi-rs/canvas';
const a=JSON.parse(fs.readFileSync(new URL('../shared/assets/environment/act5/stage43-continuity-contact.json',import.meta.url))),before=JSON.stringify(a),allocations=[];
const g=vm.createContext({console,Path2D,DOMMatrix});vm.runInContext(fs.readFileSync(new URL('../shared/map/vector-art.js',import.meta.url),'utf8'),g);
class Scene{landmark(){}_landmarkPaintBounds(){return{left:0,top:0,right:2172,bottom:1024}}_makeLayerCanvas(w,h){assert(w<=2048&&h<=2048);const cv=createCanvas(w,h);allocations.push({w,h,released:false,cv});return cv}_releaseRasterCanvas(cv){allocations.find(a=>a.cv===cv).released=true;cv.width=1;cv.height=1}}
g.HonroScene=Scene;vm.runInContext(fs.readFileSync(new URL('../shared/runtime/act5-edge-art.js',import.meta.url),'utf8'),g);
const stripped=structuredClone(a),clips=[];function strip(n){if(n.clipPath){clips.push(new Path2D(a.vector.clips[n.clipPath].join(' ')));delete n.clipPath;}for(const c of n.children||[])strip(c)}strip(stripped.vector.root);assert.equal(clips.length,7);
const out='_local/reports/stage43-contact-postclip';fs.mkdirSync(out,{recursive:true});const rows=[];
for(const v of[{id:'normal',w:1440,h:900,z:1.379,e:-950,f:-800},{id:'mobile',w:390,h:844,z:.1757556061,e:4,f:430}]){
 const setup=()=>{const cv=createCanvas(v.w,v.h),c=cv.getContext('2d');c.setTransform(v.z,0,0,v.z,v.e,v.f);c.globalAlpha=.81;return{cv,c}},actual=setup(),ref=setup(),scene=new Scene;
 const l={asset:{id:'act5:near:43',nativeContinuity:{contact:a}},x:0,y:0,scale:1};scene.landmark(actual.c,l);
 // Independent full-viewport diagnostic reference: color stack first, clips once.
 const surface=createCanvas(v.w,v.h),raw=surface.getContext('2d');raw.setTransform(v.z,0,0,v.z,v.e,v.f);g.HonroVectorArt.draw(raw,stripped,{x:0,y:0,scale:1});ref.c.save();for(const p of clips)ref.c.clip(p);ref.c.setTransform(1,0,0,1,0,0);ref.c.drawImage(surface,0,0);ref.c.restore();
 const x=actual.c.getImageData(0,0,v.w,v.h).data,y=ref.c.getImageData(0,0,v.w,v.h).data;let max=0,changed=0;for(let i=0;i<x.length;i+=4){let d=0;for(let j=0;j<4;j++)d=Math.max(d,Math.abs(x[i+j]-y[i+j]));max=Math.max(max,d);if(d)changed++}assert.equal(max,0,'bounded postclip equals same-CTM full-viewport reference');fs.writeFileSync(out+'/'+v.id+'-reference.png',ref.cv.toBuffer('image/png'));
 fs.writeFileSync(out+'/'+v.id+'.png',actual.cv.toBuffer('image/png'));rows.push({view:v,maxRGBA:max,changedPixels:changed});
 // Repeat at same scale and then another viewport: geometry cache cannot retain pixels.
 const repeat=setup();scene.landmark(repeat.c,l);assert.deepEqual(repeat.c.getImageData(0,0,v.w,v.h).data,x);
}
assert.equal(JSON.stringify(a),before,'native geometry and seven protection clips unchanged');assert(allocations.every(a=>a.released));fs.writeFileSync(out+'/report.json',JSON.stringify({rows,allocations:allocations.map(({w,h,released})=>({w,h,released})),scope:'Native Canvas Stage43 contact only; exact diagnostic reference, not browser/full campaign'},null,2));console.log('Stage43 contact postclip: normal/mobile exact pixels, state/geometry pure, <=2048² scratch, released surfaces: PASS');
