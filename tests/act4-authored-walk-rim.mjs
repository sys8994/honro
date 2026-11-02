/** Controlled renderer fixture; does not approve the appearance of a stage. */
import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
class Path{moveTo(){} lineTo(){}}
class Scene{}
Scene.prototype.terrain=function(){};Scene.prototype._worldCacheKey=function(){return ''};
const g=vm.createContext({Path2D:Path,HonroScene:Scene,HONRO_CORE:{poly:t=>t.vertices}});
vm.runInContext(await readFile('shared/runtime/act4-pilot-art.js','utf8'),g);
vm.runInContext(await readFile('shared/runtime/terrain-readability.js','utf8'),g);
const box=id=>({id,x:0,y:100,w:100,h:40,vertices:[{x:0,y:100},{x:100,y:100},{x:100,y:140},{x:0,y:140}]});
function strokes({stage=31,flag,covered=true}={}){let count=0;const c={save(){},restore(){},stroke(){count++}};const b={honroStage:stage,terrain:[box(covered?'covered':'other')],sceneVersion:0,honroMap:{nativeArt:{version:1,coveredTerrainIds:['covered'],authoredWalkRim:flag}},honroLandmarks:[{kind:'canonical-element',layer:'mid',nativeArtLayer:'body',nativeTerrainIds:['covered'],asset:{vector:{},collision:[]}}]};const scene=new Scene();scene.scale=1;scene.terrainReadability(c,b);return count;}
assert.equal(strokes(),3);assert.equal(strokes({flag:false}),3);assert.equal(strokes({flag:true,covered:false}),3);assert.equal(strokes({flag:true,stage:1}),3);assert.equal(strokes({flag:true}),0);
console.log('PASS authored rim suppresses only explicitly enabled covered terrain; default and uncovered geometry unchanged');
