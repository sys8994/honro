import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import vm from 'node:vm';

const root=new URL('../',import.meta.url), farPath='shared/assets/environment/campaign-far/';
const key='act4FarBambooGrove35', file='act4-stage35-bamboo-grove.webp';
const sha=x=>createHash('sha256').update(x).digest('hex');
const bytes=p=>readFile(new URL(p,root));
export function verifyFarDispatch(manifest,runtime,pilot,canonical35){
 assert.equal(manifest.images[key],file);
 assert.equal(manifest.images.act4FarBambooHandoff,'act4-bamboo-handoff.webp');
 assert.equal(manifest.images.act4FarBamboo,'act4-far-bamboo.webp');
 assert.equal(Object.keys(manifest.stages).length,30);
 assert.equal(Object.values(manifest.stages).some(s=>s.key===key),false);
 assert.equal(canonical35.id,'stage-35');
 assert.equal(canonical35.design.nativeArt.far,key);
 assert.equal(canonical35.design.nativeArt.version,1);

 const reads=[];
 class DummyScene{}
 class FakeImage{
  naturalWidth=1672; naturalHeight=941;
  set src(url){if(url){reads.push(url);this.onload?.();}}
 }
 const world={
  HonroScene:DummyScene,HONRO_AUTHORED_FAR:manifest,Image:FakeImage,
  HonroEnvironment:{act1BackdropFrame:(_s,_w,_h,_b,w,h)=>({x:0,y:0,w,h})},
  document:{createElement:()=>({getContext:()=>({drawImage(){},fillRect(){},getImageData(){return {data:new Uint8ClampedArray(4)}},putImageData(){}})})}
 };
 vm.runInNewContext(pilot,world);vm.runInNewContext(runtime,world);
 const cfg=structuredClone(canonical35.design),F=world.HonroAuthoredFarArt;
 // The same MapCompiler copies design to honroMap; Editor and embedded playtest
 // both instantiate the normal Scene. Include their previously used dawn preview key.
 function dispatch(id,origin,design,official=1,custom=false){
  const dry={honroStage:id,honroMapOrigin:origin,honroCustom:custom,
   honroAct4Official:official,honroAct4Preview:id,honroMap:design,
   honroPreviewFar:{key:'act4Dawn'},width:4608,height:3072};
  return F.frames({x:2304,y:1536,scale:.21},1440,769,dry).map(v=>v.key).join(',');
 }
 assert.equal(dispatch(35,'campaign',cfg),key);
 assert.equal(dispatch(35,'workshop',cfg),key);
 assert.equal(dispatch(35,'workshop',cfg,0,true),key); // Explicit authored far on a derivative editor snapshot.
 assert.equal(dispatch(35,'workshop',{nativeArt:{...cfg.nativeArt,version:0}},0,true),'act4Dawn');
 for(let i=31;i<=40;i++)if(i!==35){
  const artwork=i===36?'act4FarInlandHandoff':i===34?'act4FarCoast':'act4Estuary';
  assert.equal(dispatch(i,'campaign',{nativeArt:{...cfg.nativeArt,far:artwork}}),artwork);
 }
 assert.equal(dispatch(1,'campaign',{},0,false),manifest.stages[1].key);
 assert(reads.includes(file));
}
export async function verifyRegistration(){
 const [source,raw,art,compiler,workshop,far,pilot]=await Promise.all([
  bytes('shared/act4-handoff-art.mjs'),bytes(farPath+'manifest.json'),bytes(farPath+file),
  bytes('shared/map/compiler.js'),bytes('workshop/src/app.js'),
  bytes('shared/runtime/authored-far-art.js'),bytes('shared/runtime/act4-pilot-art.js'),
 ]);
 const manifest=JSON.parse(raw);
 // Restoring these two unique source edits must recover the exact known 71fb author files.
 const binding=source.toString('utf8');
 const sideImport="import {addStage35SideGroves} from './act4-stage35-side-groves.mjs';\n";
 const sideCall="   await addStage35SideGroves(stage,elements,pack.assets,project.library);\n";
 assert(binding.includes("  if(n===35){\n   nativeArt.far='act4FarBambooGrove35';\n"+sideCall));
 assert(binding.includes(sideImport));
 const base=binding.replace(sideImport,'').replace(sideCall,'')
  .replace("nativeArt.far='act4FarBambooGrove35';","nativeArt.far='act4FarBambooHandoff';");
 const prev=raw.toString('utf8').replace('    "act4FarBambooGrove35": "act4-stage35-bamboo-grove.webp",\n','');
 const gitBlob=bytes=>createHash('sha1').update('blob '+Buffer.byteLength(bytes)+'\0').update(bytes).digest('hex');
 assert.equal(gitBlob(base),'c96da5bff3811b1cecedaa94be7e147c52651333');
 assert.equal(gitBlob(prev),'ecdf5b3c2cc28b14d8f34988e8c47d1417ef9c60');
 assert.equal(art.length,205496);
 assert.equal(sha(art),'574a1793b7bb2416d66abd249c5c7ff851ea2072aa3204db68caa9b38d2a987b');
 assert.match(compiler.toString(),/honroMap:clone\(st\.design\|\|\{\}\)/);
 assert.match(workshop.toString(),/HonroMaps\.createBattle\(st,p,profile\)/);
 assert.match(workshop.toString(),/new HonroScene\(dom\.stageCanvas\)/);
 assert.match(workshop.toString(),/app\.launchMap\(playProject,st\.id,/);
 return {manifest,far:far.toString(),pilot:pilot.toString()};
}

export function verifyVisualScope(before,after){
 const old=before.stages.find(s=>s.metadata?.stageId===35);
 const st=after.stages.find(s=>s.metadata?.stageId===35);
 assert(old&&st&&st.id==='stage-35');
 const ids=['act4-handoff:35:bamboo-thicket-west','act4-handoff:35:bamboo-thicket-east'];
 const installed=st.elements.slice(0,3).map(e=>e.id);
 assert.deepEqual(installed,[...ids,'approved35-forest-foundation']);
 assert.deepEqual(st.elements.slice(2).map(e=>e.id),[
  'approved35-forest-foundation','approved35-near-geology','approved35-body',
  'act4-handoff:35:bedrock','act4-handoff:35:bamboo','act4-handoff:35:walls'
 ]);
 const unchanged=['terrains','units','events','encounters','markers','objectives','initialState','anchors','playBounds','terrainBounds','layers'];
 for(const k of unchanged)assert.strictEqual(st[k],old[k],k+' must stay the same authored object');
 assert.equal(st.design.nativeArt.far,key);
 assert(st.design.nativeArt.coveredTerrainIds.every(q=>old.terrains.some(t=>t.id===q)));
 for(const id of ids){
  const ref=after.library.filter(a=>a.id===id);
  assert.equal(ref.length,1);assert.equal(ref[0].collision.length,0);
  assert.equal(st.elements.filter(e=>e.assetId===id).length,1);
 }
 assert(!after.library.some(a=>a.id.startsWith('act4-handoff:35:')&&a.id.includes('accent')));
 for(const [i,prev] of before.stages.entries())if(prev.metadata?.stageId!==35)assert.strictEqual(after.stages[i],prev);
}

if(resolve(process.argv[1]||'')===fileURLToPath(import.meta.url)){
 const {manifest,far,pilot}=await verifyRegistration();
 const [{readWorldSource},{applyAct4HandoffArt}]=await Promise.all([
  import('../tools/act4-source/world-source.mjs'),import('../shared/act4-handoff-art.mjs'),
 ]);
 const original=JSON.parse((await readWorldSource()).bytes.toString('utf8'));
 const authored=await applyAct4HandoffArt(original,{stages:[35]});
 const stage=authored.stages.find(s=>s.metadata?.stageId===35);
 assert.equal(authored.stages.length,original.stages.length);
 for(const [i,s] of original.stages.entries())if(s.metadata?.stageId!==35)assert.equal(authored.stages[i],s);
 verifyVisualScope(original,authored);
 verifyFarDispatch(manifest,far,pilot,stage);
 console.log('PASS scoped Stage35 far source and existing game/editor/embedded-native dispatch');
}
