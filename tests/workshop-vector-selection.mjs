// Direct production editor helper checks. Browser DOM/input remains a separate gate.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {applyAct2VectorArt} from '../tools/environment/build-act2-art.mjs';
const project=await applyAct2VectorArt(JSON.parse(await readFile('shared/data/campaign.json','utf8'))),g=vm.createContext({console,structuredClone,HONRO_CORE:{},HONRO_PROJECT:project,localStorage:{getItem:()=>null},document:{querySelector:()=>null,querySelectorAll:()=>[]}});
g.window=g;vm.runInContext(await readFile('shared/map/geometry.js','utf8'),g);
let source=await readFile('workshop/src/app.js','utf8');source=source.replace("addEventListener('DOMContentLoaded',init);",'globalThis.editorVectorTest={transformedShapes,assetBounds,pointInPoly,syncAssetCollision};');vm.runInContext(source,g);
const api=g.editorVectorTest,a=project.library.find(a=>a.id==='act2:pine'),instance={x:2800,y:3200,scale:1.3,rotation:.4};
const bounds=api.assetBounds(a),pts=api.transformedShapes(a,instance)[0].points;
assert.equal(pts.length,4);const center={x:pts.reduce((s,p)=>s+p.x,0)/4,y:pts.reduce((s,p)=>s+p.y,0)/4};assert(api.pointInPoly(center,pts));assert(!api.pointInPoly({x:0,y:0},pts));
for(const [i,p]of [{x:bounds.x,y:bounds.y},{x:bounds.x+bounds.w,y:bounds.y},{x:bounds.x+bounds.w,y:bounds.y+bounds.h},{x:bounds.x,y:bounds.y+bounds.h}].entries())assert.deepEqual(pts[i],g.HonroGeometry.transformPoint(p,a,instance));
const prior=JSON.stringify(a);api.syncAssetCollision(a);assert.equal(JSON.stringify(a),prior,'vector source/bounds cannot be overwritten by fallback polygon nodes');
const renamed=JSON.parse(JSON.stringify(a));renamed.id='editable-pine-copy';assert.deepEqual(api.transformedShapes(renamed,instance),api.transformedShapes(a,instance));
console.log('PASS production Workshop vector selection/rotation/scale bounds and portable clone; browser input not exercised');
