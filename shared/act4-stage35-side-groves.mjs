/** Authored L1 side-dummy forest art for Stage35. Not collision or a new render pass. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';

const ALLOW=[
 {side:'west',sha:'fa2b5f01fe559f742367b9683b7577048d78ca6395a165b0248639610c15e982',
  x:-4208,y:-24,w:3808,h:3016,left:-4250,right:-242,clip:'M-4250 -1390 H-242 V4100 H-4250Z'},
 {side:'east',sha:'54add3484dc26599963e1ed17ef76cfcd3546a78ae9243d4aa5df8fce8ae1c2b',
  x:4862,y:192,w:4078,h:2700,left:4850,right:8940,clip:'M4850 -1390 H8940 V4100 H4850Z'},
];
const id=side=>'act4-handoff:35:bamboo-thicket-'+side;

export async function addStage35SideGroves(stage,elements,packAssets,authoredLibrary){
 assert(stage?.id==='stage-35'&&stage.metadata?.stageId===35&&stage.metadata?.act4Stage===35&&
  stage.metadata?.campaign===true&&stage.width===4608&&stage.height===3072,
  'Stage35 side groves require exact official Stage35 dimensions and identity');
 const f=elements.filter(x=>x.id==='approved35-forest-foundation');
 assert(f.length===1&&f[0].assetId==='approved35:forest-foundation'&&f[0].x===-6000&&f[0].y===-5000&&
  f[0].scale===1&&f[0].layer==='structural-back'&&f[0].depthLayer==='L1'&&f[0].nativeArtLayer==='structure',
  'Stage35 side groves: lost signed masking foundation, do not repaint shadow order');
 const insertAt=elements.indexOf(f[0]);
 const inUse=new Set([...packAssets,...authoredLibrary].map(v=>v.id));
 const packets=await Promise.all(ALLOW.map(async p=>{
  const key=id(p.side),file='stage35-forest-'+p.side+'.json';
  assert(!inUse.has(key)&&!elements.some(e=>e.id===key||e.assetId===key),'Stage35 side groves: overlapping canonical owner');
  const data=await readFile(new URL('./data/act4/handoff-art/'+file,import.meta.url));
  assert.equal(createHash('sha256').update(data).digest('hex'),p.sha,'Stage35 side grove authored bytes changed: '+file);
  const json=JSON.parse(data),{asset,elements:[inst]}=json;
  assert.deepEqual(Object.keys(json).sort(),['asset','elements']);
  assert.equal(json.elements.length,1);
  assert.deepEqual(inst,{id:key,assetId:key,x:p.x,y:p.y,scale:1,rotation:0,opacity:1,snap:false,
   depthLayer:'L1',layer:'structural-back',nativeArtLayer:'structure'});
  assert(asset.id===key&&asset.collision.length===0&&!asset.interactionType&&asset.sockets.length===0&&
   asset.params?.nonplayEnvironment===true&&asset.params?.semanticLayer==='STRUCT'&&asset.params?.silhouetteUnderpaint===false,
   'Stage35 side groves must be nonphysical native structure art');
  assert.deepEqual(asset.bounds,{x:0,y:0,w:p.w,h:p.h});
  const v=asset.vector;
  assert(v.version===1&&v.root.tag==='g'&&v.root.clipPath==='offplay-only'&&v.root.children.length===3&&
   !Object.keys(v.symbols??{}).length,'Stage35 side grove carries only the two lean native main assets; no cloned accent');
  assert.deepEqual(v.root.transform,[1,0,0,1,-p.x,-p.y]);
  assert.deepEqual(v.clips,{'offplay-only':[p.clip]});
  assert(p.side==='west'?p.right<0&&p.x+p.w<0:p.left>stage.width&&p.x>stage.width,
   'Stage35 side forest intersects play x-bounds');
  return {asset,inst};
 }));
 // Compile before the old foundation: rooted trunks enter the opaque existing
 // rock silhouette. No growth stand-in, collision, camera, unit, or event record.
 elements.splice(insertAt,0,...packets.map(x=>x.inst));
 packAssets.push(...packets.map(x=>x.asset));
}
