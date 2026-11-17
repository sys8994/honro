/** Transparent Native asset composite, no actors/UI/background or raster editing.
 * Run from repo root: node _local/reports/render-stage48-joint-reference.mjs
 * Loads the production vector drawer and current landmark composition directly;
 * excludes whole-project build and combat renderer (which requests alpha:false).
 */
import vm from 'node:vm';import{makeAct5}from'../../shared/act5-world.mjs';
import { createCanvas, Path2D, DOMMatrix } from '@napi-rs/canvas';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const out='_local/reports/stage48-joint-v12-reference.png';
const viewBox=[-350,300,2236,1300],width=2236,height=1300;
class AssetScene { landmark(){throw Error('Unexpected fallback renderer');} _landmarkPaintBounds(){} _drawTerrainDomainTiles(){} terrainReadability(){} }
const g=vm.createContext({console,performance,Path2D,DOMMatrix,HonroScene:AssetScene});
for(const file of ['shared/map/visual-style.js','shared/map/vector-art.js','shared/runtime/act5-edge-art.js'])vm.runInContext(await readFile(file,'utf8'),g);
const load=async p=>JSON.parse(await readFile(p,'utf8'));
const source=(await makeAct5()).library.find(a=>a.id==='act5:near:48'),body=await load('shared/assets/environment/act5/stage48-continuous-v11-bleed.json'),seam=await load('art/stage48-continuity/source-seam.json'),support=await load('art/stage48-continuity/support-mask-v9.json');
const asset={...source,id:'act5:near:48',continuousBody:body,jointBody:await load('shared/assets/environment/act5/stage48-joint-v10.json'),sourceSeam:seam.clip,sourceNativeClips:seam.sourceNativeClips,supportClip:support.clip};
if(!Array.isArray(asset.supportClip))throw Error('Missing current support paths');
const cv=createCanvas(width,height),c=cv.getContext('2d',{alpha:true}),scene=new AssetScene();scene.battle={honroStage:48};
c.scale(width/viewBox[2],height/viewBox[3]);c.translate(-viewBox[0],-viewBox[1]);
scene.landmark(c,{asset,x:0,y:0,scale:1,rotation:0});
await mkdir('_local/reports',{recursive:true});await writeFile(out,cv.toBuffer('image/png'));
console.log(JSON.stringify({output:out,viewBox,width,height,alpha:true,scope:'Production native landmark composition only'}));
