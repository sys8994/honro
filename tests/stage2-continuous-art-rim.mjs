import vm from 'node:vm';import{readFileSync}from'node:fs';import assert from'node:assert/strict';
const calls=[];class Scene{};Scene.prototype._landmarkLayer=function(){};Scene.prototype.terrain=function(){};Scene.prototype.landmark=function(){};Scene.prototype.terrainReadability=function(c,b,v){calls.push(['paint',b.honroStage,v]);if(v==='throw')throw Error('paint failure');};
const g=vm.createContext({HonroScene:Scene,HonroStage2LayeredRoad:{active:b=>b.honroStage===2},Path2D:class{}});vm.runInContext(readFileSync('shared/runtime/stage2-layered-road-art.js','utf8'),g);
const c=Object.fromEntries(['save','beginPath','rect','clip','restore'].map(k=>[k,(...a)=>calls.push([k,...a])])),scene=new Scene();
const b={honroStage:2,width:4300,height:3300,honroLandmarks:[{asset:{params:{continuousTerrain:true}}}]},snapshot=JSON.stringify(b);
scene.terrainReadability(c,b,'view');assert.deepEqual(calls,[['save'],['beginPath'],['rect',0,-24000,4300,51300],['clip'],['paint',2,'view'],['restore']]);assert.equal(JSON.stringify(b),snapshot);
for(const plain of [{...b,honroStage:1},{...b,honroLandmarks:[]}]){calls.length=0;scene.terrainReadability(c,plain,'view');assert.deepEqual(calls,[['paint',plain.honroStage,'view']]);}
calls.length=0;assert.throws(()=>scene.terrainReadability(c,b,'throw'),/paint failure/);assert.deepEqual(calls.at(-1),['restore']);console.log('Stage2 marked continuous art only: outside rim clipping, default unchanged, balanced canvas state PASS');
