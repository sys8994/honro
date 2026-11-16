import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';import{createCanvas,Path2D,DOMMatrix}from'@napi-rs/canvas';import{makeAct5}from'../shared/act5-world.mjs';
const g=vm.createContext({Path2D,DOMMatrix,console});vm.runInContext(fs.readFileSync('shared/map/vector-art.js','utf8'),g);
class Scene{landmark(c,l){g.HonroVectorArt.draw(c,l.asset,l)}_makeLayerCanvas(w,h){return createCanvas(Math.ceil(w),Math.ceil(h))}_releaseRasterCanvas(c){c.width=1;c.height=1}_landmarkPaintBounds(l){return{left:0,right:l.asset.bounds.w,top:0,bottom:l.asset.bounds.h}}}
g.HonroScene=Scene;vm.runInContext(fs.readFileSync('shared/runtime/act5-edge-art.js','utf8'),g);
const {library}=await makeAct5(),scene=new Scene;fs.mkdirSync('_local/reports/act5-edges',{recursive:true});
for(const a of library){
 if(a.id==='act5:near:41'){
  assert.deepEqual(Object.keys(a.campExterior).sort(),['deep','east','west']);
  for(const art of Object.values(a.campExterior)){assert.equal(art.collision.length,0);assert(art.vector.root);assert(art.vector.viewBox[2]>0);}
  const l={asset:a,x:0,y:0,scale:1};assert(scene._landmarkPaintBounds(l).left<0);assert(scene._landmarkPaintBounds(l).bottom>3000);
  console.log(a.id,'authored vector exterior; Native Scene tile/camera render checked separately');continue;
 }
 if(a.id==='act5:near:42'){
  for(const art of [a.edgeWall,a.edgeSurface]){assert.equal(art.collision.length,0);assert.deepEqual(Array.from(g.HonroVectorArt.validate(art.vector)),[]);}
  const before=JSON.stringify(a),cv=createCanvas(1350,600),c=cv.getContext('2d');c.scale(.5,.5);c.translate(400,0);scene.landmark(c,{asset:a,x:0,y:0,scale:1});assert.equal(JSON.stringify(a),before);assert.equal(scene._act5Edge,undefined,'Native BODY/SURFACE must not use stretched raster edges');
  fs.writeFileSync('_local/reports/act5-edges/42.png',cv.toBuffer('image/png'));console.log(a.id,'native BODY/SURFACE, validated and source-pure');continue;
 }
 if(a.id==='act5:near:44'){
  assert.equal(a.upperCanopy.collision.length,0);assert.deepEqual(Array.from(g.HonroVectorArt.validate(a.upperCanopy.vector)),[]);assert(scene._landmarkPaintBounds({asset:a,x:0,y:0,scale:1}).top<=-710);
  assert.equal(a.rootExterior.collision.length,0);assert.deepEqual(Array.from(g.HonroVectorArt.validate(a.rootExterior.vector)),[]);
  assert(a.rootUpperClip.every(d=>d.length<=60000));const own=new Scene,before=JSON.stringify(a),cv=createCanvas(1400,700),c=cv.getContext('2d');c.scale(.5,.5);c.translate(400,0);own.landmark(c,{asset:a,x:0,y:0,scale:1});assert.equal(JSON.stringify(a),before);assert.equal(own._act5Edge,undefined,'44 must not stretch raster edges');fs.writeFileSync('_local/reports/act5-edges/44.png',cv.toBuffer('image/png'));console.log(a.id,'native continuation/upper alpha; validated source-pure');continue;
 }
 const before=JSON.stringify(a),[,,w,h]=a.vector.viewBox,p=Math.min(w*.28,420),cv=createCanvas(1000,Math.ceil((h+p)/(w+p*2)*1000)),c=cv.getContext('2d'),z=1000/(w+p*2);c.fillStyle='#182731';c.fillRect(0,0,cv.width,cv.height);c.scale(z,z);c.translate(p,0);scene.landmark(c,{asset:a,x:0,y:0,scale:1});assert.equal(JSON.stringify(a),before);const cache=scene._act5Edge;scene.landmark(c,{asset:a,x:0,y:0,scale:1});assert.equal(scene._act5Edge,cache);assert(cache.canvas.width*cache.canvas.height<2200000);fs.writeFileSync('_local/reports/act5-edges/'+a.id.split(':').at(-1)+'.png',cv.toBuffer('image/png'));console.log(a.id,cache.canvas.width,cache.canvas.height);
}
