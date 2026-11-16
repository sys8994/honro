import assert from'node:assert/strict';import fs from'node:fs';import vm from'node:vm';
import{createCanvas,Path2D,DOMMatrix}from'@napi-rs/canvas';
const g=vm.createContext({Path2D,DOMMatrix,console});
for(const file of['shared/map/visual-style.js','shared/map/vector-art.js'])vm.runInContext(fs.readFileSync(file,'utf8'),g);
class Scene{
 allocations=[];released=[];
 landmark(c,l){g.HonroVectorArt.draw(c,l.asset,l)}
 _makeLayerCanvas(w,h){const cv=createCanvas(w,h);this.allocations.push({w,h,cv});return cv;}
 _releaseRasterCanvas(cv){this.released.push(cv);cv.width=1;cv.height=1;}
 _landmarkPaintBounds(){return{left:0,right:1500,top:0,bottom:400};}
}
g.HonroScene=Scene;vm.runInContext(fs.readFileSync('shared/runtime/act5-edge-art.js','utf8'),g);
const rect='M-100 -100H1500V500H-100Z',mask='M-100 20L1500 160V500H-100Z';
const body={id:'test-body',anchor:{x:0,y:0},collision:[],params:{semanticLayer:'BODY',silhouetteUnderpaint:false},vector:{version:1,viewBox:[-100,-100,1600,600],clips:{'native-source-alpha':[rect]},root:{tag:'g',transform:[1,0,0,1,0,0],children:[{tag:'g',clipPath:'native-source-alpha',children:Array.from({length:16},(_,i)=>({tag:'path',d:rect,fill:i<15?'#a388ae':'#483445'}))}]}}};
const empty={tag:'g',children:[]},asset={id:'act5:near:45',anchor:{x:0,y:0},bounds:{x:0,y:0,w:1500,h:400},collision:[],continuousBody:body,depthClips:{deep:[mask]},preservedClips:{props:[rect],wall:[rect],shrub:[rect]},vector:{version:1,viewBox:[0,0,1500,400],clips:{},root:{tag:'g',children:[empty,empty]}}};
const back=structuredClone(body);back.params={...back.params,semanticLayer:'BACK',nonplayEnvironment:true};
function dark(n){if(n.fill)n.fill='#'+[1,3,5].map(i=>Math.round(parseInt(n.fill.slice(i,i+2),16)*.64).toString(16).padStart(2,'0')).join('');for(const ch of n.children||[])dark(ch);}dark(back.vector.root);
function setup(){const cv=createCanvas(1300,200),c=cv.getContext('2d');c.beginPath();c.rect(9,7,1270,180);c.clip();c.globalAlpha=.67;c.setTransform(1.03,.013,.017,.93,3,-5);return{cv,c};}
const actual=setup(),expected=setup(),legacy=setup(),scene=new Scene,l={asset,x:12,y:3,scale:.97};
const before=JSON.stringify(asset),matrix=actual.c.getTransform();scene.landmark(actual.c,l);
assert.equal(JSON.stringify(asset),before);assert.deepEqual(actual.c.getTransform(),matrix);assert.equal(actual.c.globalAlpha,expected.c.globalAlpha);assert.equal(actual.c.globalCompositeOperation,'source-over');
assert.equal(scene.allocations.length,2);assert.equal(scene.released.length,2);assert(scene.allocations[0].w<=1024&&scene.allocations[0].h<=1024);assert.equal(scene.allocations[0].cv.width,1);
function reference(target,isolate){const raw=target.c,c=g.HonroVisualStyle.context(raw,'L1');c.save();c.translate(l.x,l.y);c.scale(l.scale,l.scale);g.HonroVectorArt.draw(g.HonroVisualStyle.context(c,'L3'),back,{});
 if(isolate){const cv=createCanvas(target.cv.width,target.cv.height),o=cv.getContext('2d'),m=c.getTransform();o.setTransform(m.a,m.b,m.c,m.d,m.e,m.f);g.HonroVectorArt.draw(g.HonroVisualStyle.contextLike(c,o),body,{});o.globalCompositeOperation='destination-in';o.fillStyle='#fff';o.fill(new Path2D(mask));c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(cv,0,0);c.restore();}
 else{const q=structuredClone(body);q.vector.clips['native-source-alpha']=[mask];g.HonroVectorArt.draw(c,q,{});}c.restore();}
reference(expected,true);reference(legacy,false);
const aa=actual.c.getImageData(0,0,1300,200).data,ee=expected.c.getImageData(0,0,1300,200).data,ll=legacy.c.getImageData(0,0,1300,200).data;
let maxError=0,changed=0,legacyChanged=0;for(let i=0;i<aa.length;i++){const e=Math.abs(aa[i]-ee[i]);maxError=Math.max(maxError,e);if(e)changed++;if(ll[i]!==ee[i])legacyChanged++;}
assert(maxError<=2,`Bounded tiles differ from one-shot isolated reference: ${maxError}`);assert(legacyChanged>100,'Synthetic stacked faces must expose the old clipping artifact');
assert.equal(actual.c.getImageData(0,0,1,1).data[3],0,'Destination clip retained');
const failing=setup(),bad=new Scene,originalDraw=g.HonroVectorArt.draw,originalMatrix=failing.c.getTransform();g.HonroVectorArt.draw=(c,a,i)=>{if(a===body)throw Error('injected BODY failure');return originalDraw(c,a,i);};
assert.throws(()=>bad.landmark(failing.c,l),/injected BODY failure/);g.HonroVectorArt.draw=originalDraw;assert.equal(bad.released.length,2);assert.equal(bad.allocations[0].cv.width,1);assert.deepEqual(failing.c.getTransform(),originalMatrix);assert.equal(failing.c.globalAlpha,expected.c.globalAlpha);
// Real domain-tile transform: a large native depth path extends far outside516².
// Direct destination-in Path2D fill clears this tile in Native Canvas; the
// bounded mask-image route must still show the opaque foreground at these points.
const realBody=JSON.parse(fs.readFileSync('shared/assets/environment/act5/stage45-root-body.json')),
 realClip=JSON.parse(fs.readFileSync('shared/assets/environment/act5/stage45-depth-clips.json')).deep,
 realAsset={...asset,continuousBody:realBody,depthClips:{deep:realClip}},tile=createCanvas(516,516),tc=tile.getContext('2d'),full=createCanvas(516,516),fc=full.getContext('2d');
for(const c of[tc,fc])c.setTransform(2.1792690753936768,0,0,2.1792690753936768,-4094,-1534);
new Scene().landmark(tc,{asset:realAsset,x:0,y:0,scale:1});g.HonroVectorArt.draw(g.HonroVisualStyle.context(fc,'L1'),realBody,{});
for(const[x,y]of[[100,400],[250,400],[400,450]])assert.deepEqual(tc.getImageData(x,y,1,1).data,fc.getImageData(x,y,1,1).data,'Real tile foreground must survive the mask');
console.log(JSON.stringify({pass:true,maxError,changedChannels:changed,legacyDifferentChannels:legacyChanged,boundedTemporaryPixels:2*1024*200,releaseOnSuccessAndFailure:true,sourceUnchanged:true}));
