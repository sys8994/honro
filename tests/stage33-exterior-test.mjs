import assert from 'node:assert/strict';import {readFile,writeFile,mkdir}from'node:fs/promises';import{createRequire}from'node:module';import vm from'node:vm';
import {existsSync} from 'node:fs';import {pathToFileURL} from 'node:url';
const root=process.env.HONRO_REPO_ROOT||process.cwd(),local=new URL('.',import.meta.url);
const {applyStage33ExteriorCandidate,restoreStage33Exterior,MARKER,FIELD,SOURCES}=await import(existsSync(new URL('stage33-exterior-composer.mjs',local))?new URL('stage33-exterior-composer.mjs',local):pathToFileURL(root+'/shared/act4-stage33-exterior-art.mjs'));
const req=createRequire(root+'/package.json'),{createCanvas,Path2D}=req('@napi-rs/canvas'),dir=new URL('file:///tmp/honro-stage33-engine-candidate/');
await mkdir(dir,{recursive:true});
const pack=JSON.parse(await readFile(root+'/shared/data/act4/sideview-art/33-coastal-v2.json','utf8')),field=JSON.parse(await readFile(existsSync(new URL('33-exterior-field.json',local))?new URL('33-exterior-field.json',local):root+'/shared/data/act4/sideview-art/33-exterior-field.json','utf8'));
const source={library:pack.assets,stages:[{metadata:{stageId:33},width:7200,height:5400,terrains:[{id:'unchanged'}],elements:pack.assets.map(a=>({id:a.id,assetId:a.id,x:0,y:0,scale:1,rotation:0,nativeArtLayer:'surface',layer:'mid'}))},{metadata:{stageId:32},elements:[]}]};
const before=JSON.stringify(source),project=applyStage33ExteriorCandidate(source,field);assert.equal(JSON.stringify(source),before);assert.deepEqual(restoreStage33Exterior(project),source);assert.equal(project.stages[1],source.stages[1]);assert.equal(project.library.length,source.library.length+2);assert.deepEqual(project.stages[0].design.nativeArt.compatibilityAssetIds,[...SOURCES,FIELD]);const markerBounds=project.library.find(a=>a.id===MARKER);assert.deepEqual(markerBounds.bounds,markerBounds.reference.bounds);for(const a of source.library)assert.equal(project.library.find(v=>v.id===a.id),a);
let allocations=0,style='one';const g=vm.createContext({Path2D,HONRO_PROJECT:project,document:{createElement:()=>{allocations++;return createCanvas(1,1);}},HonroVisualStyle:{key:()=>style}});
vm.runInContext(await readFile(existsSync(new URL('stage33-exterior-art.js',local))?new URL('stage33-exterior-art.js',local):root+'/shared/runtime/stage33-exterior-art.js','utf8'),g);const api=g.HonroStage33ExteriorArt,marker=project.library.find(a=>a.id===MARKER),l={asset:structuredClone(marker),x:0,y:0,scale:1,rotation:0},b={honroStage:33,honroLandmarks:[l]},battleBefore=JSON.stringify(b);
// Full-opacity overlapping providers: isolated mask alpha must be .5, not .75.
g.HonroVectorArt={draw(c,a){if(a.id===FIELD)return true;c.fillStyle=a.id===SOURCES[0]?'#ff0000':'#0000ff';c.fillRect(-100000,-100000,200000,200000);return true;}};
const cv=createCanvas(200,120),c=cv.getContext('2d');c.setTransform(.1,0,0,.1,400,-400);assert(api.draw(c,l,b));let pix=c.getImageData(85,60,1,1).data;assert(Math.abs(pix[3]-132)<=2,JSON.stringify([...pix]));assert.equal(pix[0],0);assert.equal(pix[2],255);
assert(api.draw(c,l,b));assert.equal(api.stats().rasterizations,2);assert.equal(api.stats().hits,0);assert.equal(api.stats().backdropCopies,2);assert.equal(api.stats().backdropRestores,2);assert.equal(allocations,1);
// Source x and y both transition: exact mask product under a shear transform.
c.setTransform(.1,.02,.03,.12,260,-500);c.clearRect(-100000,-100000,200000,200000);api.draw(c,l,b);
const m=c.getTransform(),det=m.a*m.d-m.b*m.c,bytes=c.getImageData(0,0,200,120).data;let checks=0,maxError=0;
for(let y=1;y<119;y+=4)for(let x=1;x<199;x+=4){let X=(m.d*(x+.5-m.e)-m.c*(y+.5-m.f))/det,Y=(-m.b*(x+.5-m.e)+m.a*(y+.5-m.f))/det;const clamp=v=>Math.min(1,Math.max(0,v)),alpha=clamp((X+3300)/300)*clamp((5300-Y)/200)*255;maxError=Math.max(maxError,Math.abs(bytes[(y*200+x)*4+3]-alpha));checks++;}assert(maxError<3,`mask affine max error ${maxError}`);
api.draw(c,l,b);assert.equal(api.stats().rasterizations,3);assert.equal(api.stats().hits,1);
style='two';api.draw(c,l,b);assert.equal(api.stats().rasterizations,4);cv.width=240;c.setTransform(m.a,m.b,m.c,m.d,m.e,m.f);api.draw(c,l,b);assert.equal(api.stats().rasterizations,5);assert.equal(allocations,1);
const savedTransform=c.getTransform(),savedAlpha=c.globalAlpha;api.draw(c,l,b);assert.deepEqual(c.getTransform(),savedTransform);assert.equal(c.globalAlpha,savedAlpha);
const count=api.stats().rasterizations;assert.equal(api.draw(c,l,{honroStage:32}),false);assert.equal(api.draw(c,l,{honroStage:33,honroCustom:true}),false);assert.equal(api.draw(c,{...l,asset:pack.assets[0]},b),false);assert.equal(api.stats().rasterizations,count);
const huge=createCanvas(1,1).getContext('2d');const cap={canvas:{width:10000,height:10000},getTransform:()=>huge.getTransform(),save:()=>huge.save(),restore:()=>huge.restore(),fillRect:(...v)=>huge.fillRect(...v),globalAlpha:1};assert(api.draw(cap,l,b));assert.equal(api.stats().reasons['device-pixel-cap'],1);assert.equal(allocations,1);assert.equal(JSON.stringify(b),battleBefore);
// Actual source vectors and field pass standard API; render one small native reference.
vm.runInContext(await readFile(root+'/shared/map/vector-art.js','utf8'),g);for(const a of [...pack.assets,field,marker])assert.equal(g.HonroVectorArt.validate(a.vector).length,0,a.id);
// Direct protected-core pass must match the former same-context draw exactly,
// including antialiased silhouettes against an already painted backdrop.
const coreA=createCanvas(320,180),coreB=createCanvas(320,180),ca=coreA.getContext('2d'),cb=coreB.getContext('2d');
for(const cc of [ca,cb]){cc.fillStyle='#5681b7';cc.fillRect(0,0,320,180);cc.setTransform(.1,0,0,.1,150,10);cc.beginPath();cc.rect(-1500,-100,3000,1600);cc.clip();}
const coreStats=api.stats();for(const id of SOURCES)g.HonroVectorArt.draw(ca,project.library.find(a=>a.id===id),{x:0,y:0,scale:1,rotation:0});assert(api.draw(cb,l,b));
assert.deepEqual(cb.getImageData(0,0,320,180).data,ca.getImageData(0,0,320,180).data,'Protected core original pixels changed');
assert.equal(api.stats().rasterizations,coreStats.rasterizations,'Full-core draw unnecessarily rasterized');assert.equal(api.stats().fullCoreDraws,coreStats.fullCoreDraws+1);assert.equal(allocations,1);
// Mixed tile: integer partition must also leave protected interior exact.
const mixA=createCanvas(240,160),mixB=createCanvas(240,160),ma=mixA.getContext('2d'),mb=mixB.getContext('2d');
for(const cc of [ma,mb]){cc.fillStyle='#5681b7';cc.fillRect(0,0,240,160);cc.setTransform(.1,0,0,.1,400,-400);}
for(const id of SOURCES)g.HonroVectorArt.draw(ma,project.library.find(a=>a.id===id),{x:0,y:0,scale:1,rotation:0});assert(api.draw(mb,l,b));
const pixelDiff=(a,z,w)=>{let changedPixels=0,maxDifference=0,minX=Infinity,minY=Infinity,maxX=-1,maxY=-1;for(let i=0;i<a.length;i+=4){let d=0;for(let k=0;k<4;k++)d=Math.max(d,Math.abs(a[i+k]-z[i+k]));if(d){changedPixels++;maxDifference=Math.max(maxDifference,d);const x=(i/4)%w,y=Math.floor(i/4/w);minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}return{changedPixels,maxDifference,bbox:changedPixels?[minX,minY,maxX,maxY]:null};};
const mixedExpected=ma.getImageData(100,0,140,110).data,mixedActual=mb.getImageData(100,0,140,110).data;
console.log('MIXED_CORE_DIAGNOSTIC',JSON.stringify(pixelDiff(mixedExpected,mixedActual,140)));
// Diagnostic only: compare unchanged same-context source draws with just an
// added clip. Keep the acceptance assertion below unchanged.
for(const clipMode of ['roundtrip-only','device-rect','inverse-world-rect']){
 const v=createCanvas(240,160),cc=v.getContext('2d');cc.fillStyle='#5681b7';cc.fillRect(0,0,240,160);cc.setTransform(.1,0,0,.1,400,-400);const mm=cc.getTransform();
 if(clipMode==='roundtrip-only')cc.setTransform(mm.a,mm.b,mm.c,mm.d,mm.e,mm.f);
 else if(clipMode==='device-rect'){cc.setTransform(1,0,0,1,0,0);cc.beginPath();cc.rect(100,0,140,110);cc.clip();cc.setTransform(mm.a,mm.b,mm.c,mm.d,mm.e,mm.f);}
 else{cc.beginPath();cc.rect((100-mm.e)/mm.a,-mm.f/mm.d,140/mm.a,110/mm.d);cc.clip();}
 for(const id of SOURCES)g.HonroVectorArt.draw(cc,project.library.find(a=>a.id===id),{x:0,y:0,scale:1,rotation:0});
 console.log('SOURCE_CLIP_DIAGNOSTIC',clipMode,JSON.stringify(pixelDiff(mixedExpected,cc.getImageData(100,0,140,110).data,140)));
}
assert.deepEqual(mb.getImageData(100,0,140,110).data,ma.getImageData(100,0,140,110).data,'Mixed-tile protected core pixels changed');
assert.equal(JSON.stringify(b),battleBefore);assert.equal(allocations,1);
// Curves reproduce the Native clip-sensitive AA case without relying on a
// particular authored silhouette. Test two different translucent backdrops.
const actualVectorAPI=g.HonroVectorArt,curveA=createCanvas(240,160).getContext('2d'),curveB=createCanvas(240,160).getContext('2d');
const curveDraw=(cc,a)=>{if(a.id===FIELD)return true;cc.save();cc.fillStyle=a.id===SOURCES[0]?'#91806b':'#70809088';for(let i=0;i<30;i++)cc.fill(new Path2D(`M ${-3000+i*20} 4000 Q -2800 ${4200+i*30} -1700 ${5000+i*9} L -1600 ${4800-i*3} Z`));cc.restore();return true;};
g.HonroVectorArt={draw:curveDraw};const copyBefore=api.stats().backdropCopies,hitBefore=api.stats().hits;
for(const color of ['#5681b777','#11775566']){
 for(const cc of [curveA,curveB]){cc.setTransform(1,0,0,1,0,0);cc.clearRect(0,0,240,160);cc.fillStyle=color;cc.fillRect(0,0,240,160);cc.fillStyle='#77330099';cc.fillRect(15,10,190,120);cc.setTransform(.1,0,0,.1,400,-400);}
 for(const id of SOURCES)curveDraw(curveA,{id});assert(api.draw(curveB,l,b));assert.deepEqual(curveB.getImageData(100,0,140,110).data,curveA.getImageData(100,0,140,110).data,'Curve core changed after mixed backdrop restoration');
}
assert.equal(api.stats().backdropCopies,copyBefore+2);assert.equal(api.stats().hits,hitBefore);assert.equal(allocations,1);g.HonroVectorArt=actualVectorAPI;
api.clear();const actual=createCanvas(900,420),ctx=actual.getContext('2d');ctx.setTransform(900/15700,0,0,900/15700,4400*900/15700,800*900/15700);assert(api.draw(ctx,l,b));await writeFile(new URL('native-reference.png',dir),actual.toBuffer('image/png'));
const result={pass:true,sourceAndOtherStageUnchanged:true,restoreExact:true,protectedCorePixelsExact:true,syntheticCurvesCoreExact:true,changedBackdropCoreExact:true,originalProvidersReferencedNotCopied:true,maskAffinePixelChecks:checks,maskAffineMaxAlphaError:maxError,stats:api.stats(),actualNativeReference:'native-reference.png',scope:'Unit and small Native only; actual Chrome pending'};await writeFile(new URL('unit-results.json',dir),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
