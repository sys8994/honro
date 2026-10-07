/** Pure compilation/type checks; Native bounds and placed-scene review are separate. */
import assert from 'node:assert/strict';import {koreanTownBuilding,koreanCourtyardWall} from '../tools/environment/korean-town-art.mjs';
for(const role of ['house','shop','office','archive','storehouse','pavilion'])for(const roofType of ['gable','hip','thatch']){
 const a=koreanTownBuilding('korean-test:'+role,{role,roofType,width:role==='office'?720:420});assert(a.vector.source.length<16000);assert((a.vector.source.match(/<path /g)||[]).length<60);assert.equal(a.params.koreanType,role);assert.equal(a.params.roofType,roofType);assert(a.params.eaveHeight<=235);assert.deepEqual(a.anchor,{x:0,y:0});assert.equal(a.collision.length,1);assert(a.collision[0].length>=24);assert(a.collision[0].every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));assert.deepEqual(a.vector.viewBox,[a.bounds.x,a.bounds.y,a.bounds.w,a.bounds.h]);
}
for(const cap of ['earth','tile']){const a=koreanCourtyardWall('wall-'+cap,{cap,gate:true});assert.deepEqual(a.collision,[]);assert(a.params.rearOnly);assert(a.bounds.h<150);}
console.log('PASS 18 original Korean building roof/type vectors and two low courtyard walls; no runtime registration');
