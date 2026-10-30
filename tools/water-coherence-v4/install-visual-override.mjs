import{writeFileSync}from'node:fs';
import assert from'node:assert/strict';
import {createCanvas} from'@napi-rs/canvas';
// Isolated equivalent of candidate art-dark's local zones filter. It delegates
// unchanged material routines and never edits the battle or source zone objects.
export function installVisualOwnership(scene){
 const original=scene.surfaceZones,owner=function(b,z){return b.honroStage>=31&&b.honroStage<=40&&b.honroCanonical===true&&b.honroAct4Design&&z?.points?.length&&['water-pool','shallow-water'].includes(z.kind)?'coastal-live':null;};
 const counts={staticCalls:0,ownedZones:new Set(),defaultScenePixelParity:[]};
 const replacement=function(c,b){const zones=(b.honroSurfaceZones||[]).filter(z=>{const owned=owner(b,z)==='coastal-live';if(owned)counts.ownedZones.add(z.id);return!owned;});counts.staticCalls++;return original.call(this,c,{...b,honroSurfaceZones:zones});};
 for(const sid of[1,3,15,30])for(const frozen of[0,9]){
  const z={id:'fixture',kind:'water-pool',attached:true,surface:[[0,20],[160,20]],bottom:[[0,80],[160,110]],points:[[0,20],[160,20],[160,110],[0,80]]},b={honroStage:sid,honroCanonical:true,honroSurfaceZones:[z],round:2,waters:[{x:0,y:20,w:160,depth:90,frozen}]};
  const cv=[createCanvas(180,130),createCanvas(180,130)];original.call(scene,cv[0].getContext('2d'),b);replacement.call(scene,cv[1].getContext('2d'),b);assert.deepEqual(cv[0].data(),cv[1].data());counts.defaultScenePixelParity.push({stage:sid,frozen,pixelsIdentical:true});
 }
 const fixture={honroStage:33,honroCanonical:true,honroAct4Design:{},round:2,honroSurfaceZones:[{id:'frozen-fixture',kind:'water-pool',attached:true,surface:[[0,40],[300,40]],bottom:[[0,160],[300,160]],points:[[0,40],[300,40],[300,160],[0,160]]}],waters:[{x:0,y:40,w:300,depth:120,frozen:4}]},ice={id:'frozen-fixture-ice',x:70,y:37,w:120,h:7,mat:'ice',hp:42,maxHp:42,expires:5};
 const frozenViews=[createCanvas(320,180),createCanvas(320,180)];
 for(let i=0;i<2;i++){const c=frozenViews[i].getContext('2d');(i?replacement:original).call(scene,c,fixture);scene.terrain(c,ice);writeFileSync('_local/reports/water-coherence-v4/frozen-static-'+(i?'after':'before')+'.png',frozenViews[i].toBuffer('image/png'));}
 const icePixel=cv=>[...cv.getContext('2d').getImageData(120,40,1,1).data];assert.deepEqual(icePixel(frozenViews[0]),icePixel(frozenViews[1]));assert.ok(icePixel(frozenViews[1])[3]>0);counts.frozenIceTerrainPixelsPreserved=true;
 counts.staticCalls=0;counts.ownedZones.clear();scene.surfaceZones=replacement;
 for(const key of['_staticWorldCache','_screenWorldCache','_domainTiles'])scene[key]=null;
 return{counts,restore(){scene.surfaceZones=original;}};
}
