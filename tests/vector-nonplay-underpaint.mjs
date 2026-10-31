/** Synthetic vector underpaint dispatch; not whole-image browser/fringe approval. */
import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';import{createCanvas,Path2D}from'@napi-rs/canvas';
const g=vm.createContext({Path2D,HonroVisualStyle:{STYLE:{outline:'#000000',outlinePixels:4}}});vm.runInContext(readFileSync('shared/map/vector-art.js','utf8'),g);
const vector={version:1,viewBox:[0,0,40,40],root:{tag:'path',d:'M10 10H30V30H10Z',fill:'#ffffff',stroke:'none'}};
function draw(params,layer='gameplay'){const c=createCanvas(40,40),ctx=c.getContext('2d');ctx.honroVisualLayer=layer;assert(g.HonroVectorArt.draw(ctx,{vector,params},{x:0,y:0}));return {outside:[...ctx.getImageData(9,20,1,1).data],inside:[...ctx.getImageData(20,20,1,1).data]};}
const cases=[[{},'gameplay',true],[{nonplayEnvironment:true,silhouetteUnderpaint:false},'gameplay',false],[{nonplayEnvironment:true},'gameplay',true],[{silhouetteUnderpaint:false},'gameplay',true],[{nonplayEnvironment:'true',silhouetteUnderpaint:false},'gameplay',true],[{nonplayEnvironment:true,silhouetteUnderpaint:true},'gameplay',true],[{semanticLayer:'BODY',silhouetteUnderpaint:false},'gameplay',false],[{approvedArtRevision:8},'gameplay',false],[{},'background',false]];
for(const [params,layer,underpaint] of cases){const x=draw(params,layer);assert.equal(x.outside[3]>0,underpaint,JSON.stringify([params,layer]));assert.deepEqual(x.inside,[255,255,255,255]);}
console.log('PASS 9 nonplay/BODY/default/legacy underpaint guard cases; no browser fringe claim');
