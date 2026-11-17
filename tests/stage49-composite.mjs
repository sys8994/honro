/** Stage49: each body/source paint stack receives its final coverage once.
 * Synthetic pixels exercise the actual production branch, not artwork approval.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createCanvas,Path2D,DOMMatrix} from '@napi-rs/canvas';
const W=256,H=192,g=vm.createContext({Path2D,DOMMatrix,console});
for(const f of ['shared/map/visual-style.js','shared/map/vector-art.js'])vm.runInContext(fs.readFileSync(f,'utf8'),g);
class Scene{
 allocations=[];released=[];
 landmark(c,l){g.HonroVectorArt.draw(c,l.asset,l)}
 _makeLayerCanvas(w,h){const cv=createCanvas(w,h);this.allocations.push(cv);return cv}
 _releaseRasterCanvas(cv){this.released.push(cv);cv.width=cv.height=1}
 _landmarkPaintBounds(){return{left:0,top:0,right:W,bottom:H}}
}
g.HonroScene=Scene;vm.runInContext(fs.readFileSync('shared/runtime/act5-edge-art.js','utf8'),g);
const rect='M-30 -30H300V240H-30Z',bodyMask='M12.3 39.7L128.4 55.6L111.7 176.2L15.1 165.8Z',jointMask='M125.2 31.1L245.8 50.4L237.3 177.7L119.6 156.3Z',sourceMask='M25.3 12.7L232.4 22.6L224.7 79.2L20.1 62.8Z',inner='M35 64H70V122H35Z';
const path=(d,fill)=>({tag:'path',d,fill});
const base={anchor:{x:0,y:0},bounds:{x:0,y:0,w:W,h:H},collision:[],params:{silhouetteUnderpaint:false}};
function terrain(id,mask,fill,transform){return{...base,id,vector:{version:1,viewBox:[0,0,W,H],clips:{'native-source-alpha':[mask],detail:[inner]},root:{tag:'g',clipPath:'native-source-alpha',children:[...Array.from({length:12},()=>path(rect,'#b69868')),path(rect,fill),{tag:'g',clipPath:'detail',children:[path(rect,'#8d598e')]}]}}}}
// Stage49 uses a native-alpha root and applies final coverage once.
const body=terrain('fixture-body',bodyMask,'#493353',[1,.01,.02,1,1,2]);
const source={...base,id:'act5:near:49',shaftExterior:body,sourcePreserved:[sourceMask],compositionMasks:{body:[bodyMask],joint:[jointMask],source:[sourceMask]},vector:{version:1,viewBox:[0,0,W,H],clips:{detail:[inner]},root:{tag:'g',children:[path(rect,'#a57245'),path('M5 21H240V65H5Z','#e9b774'),{tag:'g',clipPath:'detail',children:[path(rect,'#8d598e')]}]}}};
const l={asset:source,x:2,y:3,scale:.97},draw=g.HonroVectorArt.draw,before=JSON.stringify(source);
function setup(){const cv=createCanvas(W,H),c=cv.getContext('2d');c.beginPath();c.rect(5,5,244,180);c.clip();c.globalAlpha=.71;c.setTransform(.91,.011,.017,.93,7,4);return{cv,c}}
function stripNative(node){const n={...node};if(n.clipPath==='native-source-alpha')delete n.clipPath;if(n.children)n.children=n.children.map(stripNative);return n}
function reference(target,{duplicateSource=false,keepNative=false}={}){
 const V=g.HonroVisualStyle,c=V.context(target.c,V.classify(l,undefined,source)==='gameplay'?'gameplay':V.depth(l,source));c.save();c.translate(l.x,l.y);c.scale(l.scale,l.scale);
 for(const [key,a] of [['body',body],['source',source]]){
  const root=key==='source'?a.vector.root:(keepNative?a.vector.root:stripNative(a.vector.root));
  const piece={...a,vector:{...a.vector,root}},cv=createCanvas(W,H),mc=createCanvas(W,H),o=cv.getContext('2d'),m=mc.getContext('2d'),t=c.getTransform();
  for(const q of[o,m])q.setTransform(t.a,t.b,t.c,t.d,t.e,t.f);
  draw(V.contextLike(c,o),piece,{});m.fillStyle='#fff';m.fill(new Path2D(source.compositionMasks[key].join(' ')));
  o.setTransform(1,0,0,1,0,0);o.globalCompositeOperation='destination-in';o.drawImage(mc,0,0);
  c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(cv,0,0);if(key==='source'&&duplicateSource)c.drawImage(cv,0,0);c.restore();
 }c.restore();
}
const actual=setup(),expected=setup(),duplicate=setup(),nested=setup(),scene=new Scene,transform=actual.c.getTransform(),opacity=actual.c.globalAlpha,seen=[];
g.HonroVectorArt.draw=(c,a,o)=>{seen.push(a);return draw(c,a,o)};
try{scene.landmark(actual.c,l)}finally{g.HonroVectorArt.draw=draw}
reference(expected);reference(duplicate,{duplicateSource:true});reference(nested,{keepNative:true});
assert.equal(JSON.stringify(source),before,'source and added asset trees remain immutable');assert.deepEqual(actual.c.getTransform(),transform);assert.equal(actual.c.globalAlpha,opacity);assert.equal(actual.c.globalCompositeOperation,'source-over');assert.deepEqual(seen.map(a=>a.id),[body.id,source.id],'each stack is painted once, source is not redrawn as overlapping sourcePath fragments');
function released(s,n){assert.equal(s.allocations.length,n);assert.equal(s.released.length,n);assert.equal(new Set(s.released).size,n);assert(s.released.every(c=>c.width===1&&c.height===1))}
released(scene,4);assert.equal(actual.c.getImageData(0,0,1,1).data[3],0,'caller clip applies to final composition');
for(const [index,id] of [body.id,source.id].entries()){
 const bad=new Scene,out=setup();g.HonroVectorArt.draw=(c,a,o)=>{if(a.id===id)throw Error('injected '+id);return draw(c,a,o)};
 try{assert.throws(()=>bad.landmark(out.c,l),new RegExp('injected '+id))}finally{g.HonroVectorArt.draw=draw}
 released(bad,(index+1)*2);assert.deepEqual(out.c.getTransform(),transform);assert.equal(out.c.globalAlpha,opacity);assert.equal(JSON.stringify(source),before);
}
const pixels=x=>x.c.getImageData(0,0,W,H).data,aa=pixels(actual),ee=pixels(expected),dd=pixels(duplicate),nn=pixels(nested);let maxRaw=0,changed=0,duplicateChanged=0,nestedChanged=0;
for(let i=0;i<aa.length;i++){maxRaw=Math.max(maxRaw,Math.abs(aa[i]-ee[i]));changed+=aa[i]!==ee[i];duplicateChanged+=dd[i]!==ee[i];nestedChanged+=nn[i]!==ee[i]}
assert(duplicateChanged>100,'fixture detects duplicate source-path composition');assert(nestedChanged>100,'fixture detects retained native clip before final alpha');
assert.equal(maxRaw,0,`single-postmask oracle mismatch: ${changed} channels; nested native clip must not survive on body/joint`);
console.log(JSON.stringify({pass:true,maxRaw,changed,duplicateChanged,nestedChanged,originalImmutable:true,transformOpacityAndExternalClipPreserved:true,bothExceptionReleasePaths:true}));
