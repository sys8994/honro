import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';
const file='shared/assets/environment/act5/near-import.json';assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),createHash('sha256').update(execFileSync('git',['show','8cb12ce:'+file],{maxBuffer:30e6})).digest('hex'),'Original ten stage art preserved');
const source=JSON.parse(fs.readFileSync(file)).find(x=>x.id===43),body=JSON.parse(fs.readFileSync('shared/assets/environment/act5/stage43-foundation.json'));let calls=[];class Scene{landmark(c,l){calls.push(l.asset.id)}_landmarkPaintBounds(){return{left:0,right:2172,top:0,bottom:724}}_drawTerrainDomainTiles(){}terrainReadability(){}}
const g={HonroScene:Scene,HonroVectorArt:{draw(c,a){calls.push(a.id)}},HonroVisualStyle:{context:c=>c,classify:()=> 'gameplay'}};g.globalThis=g;vm.runInNewContext(fs.readFileSync('shared/runtime/act5-edge-art.js','utf8'),g);const ctx=Object.fromEntries(['save','restore','translate','scale'].map(k=>[k,()=>{}]));const a={id:'act5:near:43',vector:source.vector,foundation:body},before=JSON.stringify(a);new Scene().landmark(ctx,{asset:a,x:0,y:0,scale:1});assert.deepEqual(calls,['act5:stage43:foundation','act5:near:43']);assert.equal(JSON.stringify(a),before);assert.equal(body.params.semanticLayer,'BODY');assert(!body.collision?.length);console.log('PASS stage43: source unchanged, native foundation behind original, no raster stretch, no source mutation');
// Coverage of actual extreme pan + minimum zoom, without narrowing camera freedom.
const s=6656/2172,bounds=body.bounds;
for(const [w,h] of [[1440,900],[390,844]]){
 const z=Math.max(w/6800,3.75/66),halfW=w/z/2,halfH=h/z/2;
 assert(bounds.x*s < -320-halfW-240);
 assert((bounds.x+bounds.w)*s > 6656+320+halfW+240);
 assert((bounds.y+bounds.h)*s > 2579+240+halfH+240);
}
console.log('PASS desktop/portrait minimum-zoom extreme-pan BODY coverage');
