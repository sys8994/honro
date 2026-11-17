/** Stage46 original walls: opaque paint first, each wall's own alpha once. */
import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {createCanvas,Path2D,DOMMatrix} from '@napi-rs/canvas';
const g=vm.createContext({Path2D,DOMMatrix,console});
for(const f of ['shared/map/visual-style.js','shared/map/vector-art.js'])vm.runInContext(fs.readFileSync(f,'utf8'),g);
class Scene{allocations=[];released=[];landmark(c,l){g.HonroVectorArt.draw(c,l.asset,l)}_makeLayerCanvas(w,h){const cv=createCanvas(w,h);this.allocations.push(cv);return cv}_releaseRasterCanvas(cv){this.released.push(cv);cv.width=cv.height=1}_landmarkPaintBounds(){return{left:0,top:0,right:256,bottom:192}}}
g.HonroScene=Scene;vm.runInContext(fs.readFileSync('shared/runtime/act5-edge-art.js','utf8'),g);
const rect='M-20 -20H280V220H-20Z',aMask='M12.3 9.7L121.4 25.6L112.7 170.2L15.1 175.8Z',bMask='M136.2 12.1L246.8 20.4L237.3 177.7L131.6 161.3Z',cMask='M32 44H85V98H32Z';
const path=(d,fill)=>({tag:'path',d,fill}),stack=(key,fill)=>({tag:'g',clipPath:key,children:[...Array.from({length:12},()=>path(rect,'#b69868')),path(rect,fill)]});
const left=stack('a','#493353'),right=stack('b','#72508e');left.children.push({tag:'g',clipPath:'c',children:[path(rect,'#8d598e')]});
const interior={tag:'g',clipPath:'c',transform:[1,0,0,1,120,0],children:[{tag:'use',symbol:'ornament'}]};
const body={id:'blank-body',anchor:{x:0,y:0},bounds:{x:0,y:0,w:256,h:192},collision:[],params:{silhouetteUnderpaint:false},vector:{version:1,viewBox:[0,0,256,192],clips:{'native-source-alpha':[rect]},root:{tag:'g',clipPath:'native-source-alpha',children:[]}}};
const asset={id:'act5:near:46',anchor:{x:0,y:0},bounds:{x:0,y:0,w:256,h:192},collision:[],shaftExterior:body,shaftProtected:{a:[aMask],b:[bMask]},vector:{version:1,viewBox:[0,0,256,192],clips:{a:[aMask],b:[bMask],c:[cMask]},symbols:{ornament:{tag:'g',children:[path('M38 51H75V85H38Z','#c6a36b')]}},root:{tag:'g',children:[left,right,interior]}}};
function setup(){const cv=createCanvas(256,192),c=cv.getContext('2d');c.beginPath();c.rect(5,5,244,180);c.clip();c.globalAlpha=.71;c.setTransform(.91,.011,.017,.93,7,4);return{cv,c}}
const actual=setup(),expected=setup(),legacy=setup(),scene=new Scene,l={asset,x:2,y:3,scale:1},before=JSON.stringify(asset),matrix=actual.c.getTransform(),opacity=actual.c.globalAlpha,draw=g.HonroVectorArt.draw,seen=[];
g.HonroVectorArt.draw=(c,a,o)=>{seen.push(a);return draw(c,a,o)};scene.landmark(actual.c,l);g.HonroVectorArt.draw=draw;
assert.equal(JSON.stringify(asset),before);assert.deepEqual(actual.c.getTransform(),matrix);assert.equal(actual.c.globalAlpha,opacity);assert.equal(actual.c.globalCompositeOperation,'source-over');assert.equal(scene.allocations.length,6);assert.equal(scene.released.length,6);assert.equal(new Set(scene.released).size,6);assert(scene.released.every(c=>c.width===1&&c.height===1));
const originals=seen.filter(a=>a.id===asset.id&&a.vector.root!==undefined&&[left.children,right.children].includes(a.vector.root.children));assert.equal(originals.length,2);for(const a of originals){assert.equal(a.vector.root.clipPath,undefined);assert.deepEqual(Object.keys(a.vector.symbols),[])}assert.equal(originals[0].vector.root.children.at(-1).clipPath,'c');assert(seen.some(a=>a.vector.root.children?.[0]===interior&&a.vector.symbols===asset.vector.symbols));
function reference(target,old){const V=g.HonroVisualStyle,c=V.context(target.c,V.classify(l,undefined,asset)==='gameplay'?'gameplay':V.depth(l,asset));c.save();c.translate(l.x,l.y);c.scale(l.scale,l.scale);
 for(const [i,mask] of [aMask,bMask].entries()){
  const root=structuredClone(asset.vector.root.children[i]);if(!old)delete root.clipPath;
  const vector={...asset.vector,symbols:{},root},piece={...asset,vector};
  const cv=createCanvas(256,192),mc=createCanvas(256,192),o=cv.getContext('2d'),m=mc.getContext('2d'),t=c.getTransform();for(const q of[o,m])q.setTransform(t.a,t.b,t.c,t.d,t.e,t.f);
  draw(V.contextLike(c,o),piece,{});m.fillStyle='#fff';m.fill(new Path2D(mask));o.setTransform(1,0,0,1,0,0);o.globalCompositeOperation='destination-in';o.drawImage(mc,0,0);c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(cv,0,0);c.restore();
 }
 draw(c,{...asset,vector:{...asset.vector,root:{tag:'g',children:[interior]}}},{});c.restore();}
reference(expected,false);reference(legacy,true);
const aa=actual.c.getImageData(0,0,256,192).data,ee=expected.c.getImageData(0,0,256,192).data,ll=legacy.c.getImageData(0,0,256,192).data;let maxAlpha=0,maxPremultiplied=0,maxRaw=0,legacyChanged=0;
for(let i=0;i<aa.length;i+=4){maxAlpha=Math.max(maxAlpha,Math.abs(aa[i+3]-ee[i+3]));for(let j=0;j<4;j++){maxRaw=Math.max(maxRaw,Math.abs(aa[i+j]-ee[i+j]));if(ee[i+j]!==ll[i+j])legacyChanged++;if(j<3)maxPremultiplied=Math.max(maxPremultiplied,Math.abs(aa[i+j]*aa[i+3]/255-ee[i+j]*ee[i+3]/255));}}
assert.equal(maxRaw,0,'Each source wall must match its independent one-mask pixel oracle exactly');assert(legacyChanged>100,'Fixture must expose repeated source-clip edge accumulation');assert.equal(actual.c.getImageData(0,0,1,1).data[3],0);
const bad=new Scene,failed=setup();g.HonroVectorArt.draw=(c,a,o)=>{if(a.vector.root.children===right.children)throw Error('source wall failure');return draw(c,a,o)};assert.throws(()=>bad.landmark(failed.c,l),/source wall failure/);g.HonroVectorArt.draw=draw;assert.equal(bad.allocations.length,6);assert.equal(bad.released.length,6);assert(bad.released.every(c=>c.width===1&&c.height===1));assert.deepEqual(failed.c.getTransform(),matrix);assert.equal(failed.c.globalAlpha,opacity);assert.equal(JSON.stringify(asset),before);
console.log(JSON.stringify({pass:true,maxAlpha,maxPremultiplied,maxRaw,legacyChanged,originalImmutable:true,innerClipAndInteriorSymbolPreserved:true,releaseSuccessAndFailure:true}));
