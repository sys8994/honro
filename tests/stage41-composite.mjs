/** Stage41 post-alpha composition, synthetic pixels through the real branch.
 * Set HONRO_STAGE41_RUNTIME only to diagnose an unintegrated candidate.
 */
import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {createCanvas,Path2D,DOMMatrix} from '@napi-rs/canvas';
const W=320,H=224,g=vm.createContext({Path2D,DOMMatrix,console});
for(const f of ['shared/map/visual-style.js','shared/map/vector-art.js'])vm.runInContext(fs.readFileSync(f,'utf8'),g);
class Scene{
 allocations=[];released=[];sourceCalls=0;peakLive=0;
 landmark(c,l){this.sourceCalls++;const V=g.HonroVisualStyle,cc=V.context(c,V.classify(l,this.battle,l.asset)==='gameplay'?'gameplay':V.depth(l,l.asset));cc.save();try{cc.globalAlpha*=.83;g.HonroVectorArt.draw(cc,l.asset,l)}finally{cc.restore()}}
 _makeLayerCanvas(w,h){const cv=createCanvas(w,h);this.allocations.push(cv);this.peakLive=Math.max(this.peakLive,this.allocations.length-this.released.length);return cv}
 _releaseRasterCanvas(cv){this.released.push(cv);cv.width=cv.height=1}
 _landmarkPaintBounds(){return{left:0,top:0,right:W,bottom:H}}
}
const wrapper=Scene.prototype.landmark;g.HonroScene=Scene;
const runtime=process.env.HONRO_STAGE41_RUNTIME||'shared/runtime/act5-edge-art.js';vm.runInContext(fs.readFileSync(runtime,'utf8'),g);
const rect='M-5000 -5000H9000V9000H-5000Z',path=(d,fill)=>({tag:'path',d,fill});
function art(id,fill,source=false){const clips=source?{a:['M0 0H1902V827H0Z'],b:['M100 320H1400V610H100Z']}:{detail:['M35 64H270V122H35Z']};return{id,anchor:{x:0,y:0},bounds:{x:0,y:0,w:1902,h:827},collision:[],params:{silhouetteUnderpaint:false},vector:{version:1,viewBox:[0,0,1902,827],clips,root:{tag:'g',...(source?{clipPath:'a'}:{}),children:[...Array.from({length:12},()=>path(rect,'#b69868')),path(rect,fill),{tag:'g',clipPath:source?'b':'detail',children:[path(rect,'#8d598e')]}]}}}}
const asset=art('act5:near:41','#554031',true);asset.campExterior={west:art('west','#72508e'),east:art('east','#493353'),deep:art('deep','#325761')};
const l={asset,x:96.3,y:29.7,scale:.052},before=JSON.stringify(asset),draw=g.HonroVectorArt.draw;
const p=(d,rule='nonzero')=>[new Path2D(d),rule],defaultMasks={
 main:[p('M-10000 -10000H10000V10000H-10000Z M0 0H300V560L190 650Q200 720 300 750V827H0Z','evenodd'),p('M0 0H1902V350H1796V428H1838V438Q1841 456 1820 466Q1790 476 1790 488Q1794 505 1820 514V530H1902V827H0Z')],
 overlay:[p('M300 428H1838V438H300ZM300 514H1902V529H300ZM0 545Q35 546 70 548L130 555L220 562L280 566L300 557V565L280 574L220 570L130 563L70 556Q35 550 0 545Z')],
 west:[p('M-1400 -500H300V560L190 650Q200 720 300 750V1200H-1400Z')],
 east:[p('M1796 350H4000V4400H1902V827L1893 770L1902 710L1887 655L1902 600L1885 557L1902 530H1820V514Q1794 505 1790 488Q1790 476 1820 466Q1841 456 1838 438V428H1796Z')],
 deep:[p('M-1400 1000Q-600 1010 300 1000Q900 800 1700 780Q1850 760 2020 645Q2900 655 4010 650V3500H-1400Z')]
};
function setup(){const cv=createCanvas(W,H),c=cv.getContext('2d');c.beginPath();c.rect(5,5,306,210);c.clip();c.globalAlpha=.71;c.setTransform(.91,.011,.017,.93,7,4);return{cv,c}}
function oracle(target,legacy=false,landmark=l){
 const l=landmark,asset=l.asset,masks={...defaultMasks};
 const V=g.HonroVisualStyle,sourceScene={sourceCalls:0};
 function part(c,mask,paint,placement,styled=false){
  const place=q=>{if(placement){q.translate(placement.x,placement.y);q.scale(placement.scale,placement.scale)}};
  if(legacy){c.save();const t=c.getTransform();place(c);for(const [p,r]of mask)c.clip(p,r);c.setTransform(t.a,t.b,t.c,t.d,t.e,t.f);paint(c);c.restore();return}
  const cv=createCanvas(W,H),mc=createCanvas(W,H),o=cv.getContext('2d'),m=mc.getContext('2d'),t=c.getTransform();
  for(const q of[o,m])q.setTransform(t.a,t.b,t.c,t.d,t.e,t.f);
  paint(styled?V.contextLike(c,o):o);place(m);for(const [p,r]of mask.slice(0,-1))m.clip(p,r);m.fillStyle='#fff';m.fill(...mask.at(-1));
  o.setTransform(1,0,0,1,0,0);o.globalCompositeOperation='destination-in';o.drawImage(mc,0,0);
  c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(cv,0,0);c.restore();
 }
 const source=c=>wrapper.call(sourceScene,c,l);
 function sourcePhase(phase,dest=target.c){
  if(!asset.campSourceCoverage){part(dest,masks[phase],source,l);return}
  asset.vector.root.children.forEach((branch,index)=>{
   const key=index?'b':'a',copy=n=>{const q={...n};if(q.clipPath===key)delete q.clipPath;if(q.children)q.children=q.children.map(copy);return q};
   const piece={...asset,vector:{...asset.vector,root:{...asset.vector.root,children:[copy(branch)]}}};
   part(dest,[p(asset.campSourceCoverage[phase][index].join(' '))],c=>wrapper.call(sourceScene,c,{...l,asset:piece}),l);
  });
 }
 const style=c=>V.context(c,V.classify(l,undefined,asset)==='gameplay'?'gameplay':V.depth(l,asset));
 function campPaint(c,key,options){part(c,masks[key],ink=>draw(ink,asset.campExterior[key],options),null,true)}
 if(legacy){
  sourcePhase('main');const c=style(target.c);c.save();c.translate(l.x,l.y);c.scale(l.scale,l.scale);
  campPaint(c,'west',{x:-1300,y:-100,scale:1.1});c.fillStyle='#3a3029';c.fillRect(300,827,1602,1573);
  campPaint(c,'east',{x:1700,y:-25,scale:2.4});campPaint(c,'deep',{x:-1400,y:600,scale:3.05});c.restore();
 }else{
  // Independent full-canvas ownership sum; east deliberately is not additive.
  const cv=createCanvas(W,H),raw=cv.getContext('2d'),t=target.c.getTransform();raw.setTransform(t.a,t.b,t.c,t.d,t.e,t.f);
  sourcePhase('main',raw);raw.globalCompositeOperation='lighter';const c=style(raw);c.save();c.translate(l.x,l.y);c.scale(l.scale,l.scale);
  c.fillStyle='#3a3029';c.fillRect(300,827,1602,1573);campPaint(c,'west',{x:-1300,y:-100,scale:1.1});c.restore();
  target.c.save();target.c.setTransform(1,0,0,1,0,0);target.c.drawImage(cv,0,0);target.c.restore();
  const tail=style(target.c);tail.save();tail.translate(l.x,l.y);tail.scale(l.scale,l.scale);
  campPaint(tail,'east',{x:1700,y:-25,scale:2.4});campPaint(tail,'deep',{x:-1400,y:600,scale:3.05});tail.restore();
 }sourcePhase('overlay');
}
const actual=setup(),expected=setup(),old=setup(),scene=new Scene,transform=actual.c.getTransform(),opacity=actual.c.globalAlpha,seen=[];
g.HonroVectorArt.draw=(c,a,o)=>{seen.push(a.id);return draw(c,a,o)};try{scene.landmark(actual.c,l)}finally{g.HonroVectorArt.draw=draw}
oracle(expected);oracle(old,true);
assert.deepEqual(seen,[asset.id,'west','east','deep',asset.id]);assert.equal(scene.sourceCalls,2,'source must retain original landmark wrapper for main and overlay');
function intact(out){assert.deepEqual(out.c.getTransform(),transform);assert.equal(out.c.globalAlpha,opacity);assert.equal(out.c.globalCompositeOperation,'source-over');assert.equal(JSON.stringify(asset),before)}
function released(s,n){assert.equal(s.allocations.length,n);assert.equal(s.released.length,n);assert.equal(new Set(s.released).size,n);assert(s.released.every(c=>c.width===1&&c.height===1))}
intact(actual);released(scene,11);assert.equal(scene.peakLive,3);assert.equal(actual.c.getImageData(0,0,1,1).data[3],0,'caller clip stays active');
for(let at=0;at<5;at++){const bad=new Scene,out=setup();let calls=0;g.HonroVectorArt.draw=(c,a,o)=>{if(calls++===at)throw Error('injected');return draw(c,a,o)};try{assert.throws(()=>bad.landmark(out.c,l),/injected/)}finally{g.HonroVectorArt.draw=draw}released(bad,(at+1)*2+1);intact(out)}
// Failure creating the second scratch surface still releases the first.
{const bad=new Scene,out=setup(),alloc=bad._makeLayerCanvas;bad._makeLayerCanvas=function(w,h){if(this.allocations.length===1)throw Error('allocation');return alloc.call(this,w,h)};assert.throws(()=>bad.landmark(out.c,l),/allocation/);released(bad,1);intact(out)}
const aa=actual.c.getImageData(0,0,W,H).data,ee=expected.c.getImageData(0,0,W,H).data,ll=old.c.getImageData(0,0,W,H).data;let maxRaw=0,changed=0,legacyChanged=0;
for(let i=0;i<aa.length;i++){maxRaw=Math.max(maxRaw,Math.abs(aa[i]-ee[i]));changed+=aa[i]!==ee[i];legacyChanged+=ll[i]!==ee[i]}
assert(legacyChanged>100,'fixture detects legacy per-paint preclip accumulation');assert.equal(maxRaw,0,`postalpha oracle mismatch: ${changed} channels`);

// Four native-precomputed final masks: no nested source or outer mask remains.
{
 const variant=structuredClone(asset),native=variant.vector.root;
 variant.vector.root={tag:'g',children:[
  {tag:'g',transform:[1,0,0,1,0,0],children:[native]},
  {tag:'g',transform:[1.01,0,0,.99,10,3],children:[{tag:'g',clipPath:'b',children:[path(rect,'#583d66'),path('M150 350H1300V550H150Z','#a57245')]}]}
 ]};
 // Avoid reusing b as decorative clip inside a's branch in this fixture.
 native.children.at(-1).clipPath='detail';variant.vector.clips.detail=['M35 64H270V122H35Z'];
 variant.campSourceCoverage={
  main:[['M300.2 10.7H1780.4V780.3H300.2Z'],['M150.2 340.8H1350.7V570.6H150.2Z']],
  overlay:[['M310.3 420.7H1700.4V440.6H310.3Z'],['M200.1 520.7H1300.6V540.2H200.1Z']]
 };
 const v={...l,asset:variant},saved=JSON.stringify(variant),got=setup(),want=setup(),s=new Scene,parts=[];
 g.HonroVectorArt.draw=(c,a,o)=>{parts.push(a);return draw(c,a,o)};try{s.landmark(got.c,v)}finally{g.HonroVectorArt.draw=draw}
 oracle(want,false,v);released(s,15);assert.equal(s.peakLive,3);assert.equal(s.sourceCalls,4);assert.equal(JSON.stringify(variant),saved);
 assert.deepEqual(parts.map(a=>a.id),[asset.id,asset.id,'west','east','deep',asset.id,asset.id]);
 for(const a of parts.filter(a=>a.id===asset.id))for(const key of ['id','params','bounds','anchor','collision'])assert.equal(a[key],variant[key]);
 assert.equal(parts[0],parts[5]);assert.equal(parts[1],parts[6],'prepared branch copies reused across phases');
 assert.deepEqual(got.c.getImageData(0,0,W,H).data,want.c.getImageData(0,0,W,H).data,'four final source coverages match independent oracle');
 assert.deepEqual(got.c.getTransform(),transform);assert.equal(got.c.globalAlpha,opacity);
 for(let at=0;at<7;at++){
  const bad=new Scene,out=setup();let calls=0;g.HonroVectorArt.draw=(c,a,o)=>{if(calls++===at)throw Error('coverage injected');return draw(c,a,o)};
  try{assert.throws(()=>bad.landmark(out.c,v),/coverage injected/)}finally{g.HonroVectorArt.draw=draw}
  released(bad,(at+1)*2+1);assert.equal(JSON.stringify(variant),saved);assert.deepEqual(out.c.getTransform(),transform);assert.equal(out.c.globalAlpha,opacity);
 }
}
console.log(JSON.stringify({pass:true,westOwnershipGroup:true,peakScratchCanvases:3,finalSourceCoverage:true,sevenPassFailureRelease:true,runtime,maxRaw,changed,legacyChanged,sourceWrapperPreserved:true,originalInternalClipsPreserved:true,originalImmutable:true,externalClipOpacityTransformPreserved:true,fivePaintFailurePaths:true,allocationFailureRelease:true}));
