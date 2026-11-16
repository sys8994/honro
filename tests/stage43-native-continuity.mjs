import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {makeAct5} from '../shared/act5-world.mjs';
const calls=[];
class Scene{
 landmark(c,l){calls.push(l.asset.id)}
 _landmarkPaintBounds(l){const a=l.asset.bounds,z=l.scale??1;return{left:l.x+a.x*z,right:l.x+(a.x+a.w)*z,top:l.y+a.y*z,bottom:l.y+(a.y+a.h)*z}}
 _drawTerrainDomainTiles(){calls.push('domain')}
 _worldRasterScale(){return 1}
 _makeLayerCanvas(w,h){assert(w<=2048&&h<=2048);return{width:w,height:h,getContext:()=>({setTransform(){},clearRect(){}})}}
 _releaseRasterCanvas(c){c.width=1;c.height=1}
 terrainReadability(){calls.push('readability')}
}
const g=vm.createContext({console,Path2D:class{constructor(){}},HonroScene:Scene,HonroVectorArt:{draw(c,a){calls.push(a.id)}}});
vm.runInContext(fs.readFileSync(new URL('../shared/runtime/act5-edge-art.js',import.meta.url),'utf8'),g);
const {library}=await makeAct5(),a=library.find(a=>a.id==='act5:near:43'),l={asset:a,x:10,y:20,scale:2},scene=new Scene;
const c={canvas:{width:3000,height:3000},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),setTransform(){},transform(){},drawImage(){},save(){},restore(){},translate(){},scale(){},beginPath(){},rect(){},clip(){}};
const before=JSON.stringify(a);scene.landmark(c,l);
assert.deepEqual(calls.slice(0,3),[a.nativeContinuity.deep.id,a.id,a.nativeContinuity.west.id]);assert(calls.slice(3).every(id=>id===a.nativeContinuity.contact.id));assert.equal(calls.length,5,'contact uses two bounded device tiles, not one 3000px surface');
assert.equal(JSON.stringify(a),before);assert.equal(scene._act5Edge,undefined,'43 does not use sampled continuation');
const all=[a,...Object.values(a.nativeContinuity)];assert.deepEqual(JSON.parse(JSON.stringify(scene._landmarkPaintBounds(l))),{left:Math.min(...all.map(q=>10+q.bounds.x*2)),right:Math.max(...all.map(q=>10+(q.bounds.x+q.bounds.w)*2)),top:Math.min(...all.map(q=>20+q.bounds.y*2)),bottom:Math.max(...all.map(q=>20+(q.bounds.y+q.bounds.h)*2))});
for(const art of Object.values(a.nativeContinuity)){assert.equal(art.params.silhouetteUnderpaint,false);assert.deepEqual(art.collision,[])}
assert(library.filter(x=>x.nativeContinuity).length===1);
// Domain exterior excludes the same rounded screen pixels as the underlying tiles.
g.HonroBounds={viewport:()=>({left:-100,top:-100,right:1500,bottom:1500})};g.HonroTerrainDomain={materialLandmarks:()=>[]};
const rects=[],m={a:.37,b:0,c:0,d:.37,e:.21,f:.43};c.rect=(...v)=>rects.push(v);c.getTransform=()=>m;
scene._drawTerrainDomainTiles(c,{honroStage:43,honroTerrainBounds:{left:0,top:0,right:900,bottom:900}},390,844);
const r=rects[1];for(const v of [r[0]*m.a+m.e,r[1]*m.d+m.f,(r[0]+r[2])*m.a+m.e,(r[1]+r[3])*m.d+m.f])assert(Math.abs(v-Math.round(v))<1e-8);
rects.length=0;scene._drawTerrainDomainTiles(c,{honroStage:42,honroTerrainBounds:{left:0,top:0,right:900,bottom:900}},390,844);assert.deepEqual(rects[1],[0,0,1024,1024],'other stages retain prior domain clip');
const vg=vm.createContext({console});vm.runInContext(fs.readFileSync(new URL('../shared/map/vector-art.js',import.meta.url),'utf8'),vg);
for(const art of Object.values(a.nativeContinuity))assert.deepEqual(Array.from(vg.HonroVectorArt.validate(art.vector)),[]);
console.log('Stage43 native order, actual asset bounds union, source/state purity, no raster continuation, stage-scoped pixel rounding and existing vector limits: PASS');
