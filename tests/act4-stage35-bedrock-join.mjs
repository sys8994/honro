import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {applyStage35BedrockJoin} from '../shared/act4-stage35-bedrock-join.mjs';

const id='approved35:near-geology';
const deep='approved35:forest-foundation';
const SHAold='2e8f18b79f45fd525d305656aab379cba9008a091cb5e3caad783e6851d04ef6';
const SHAnew='4eafcdba80200814f574b46dda4bc01d47d40c422eaa815c146717b88ed10845';
const SHAdeep='59c36a33290f4f66c09e110211adbc24f132f1870ccdf507cc168bda6389fd35';
const PRE_OPT='359227:635a5188', NOW='295465:df15d6ec', JOINED='298307:55096145';
const sha=a=>createHash('sha256').update(JSON.stringify(a)).digest('hex');
function refSig(asset){
 const str=JSON.stringify(asset); let h=2166136261;
 for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619);
 return str.length+':'+(h>>>0).toString(16);
}
export function verifyStage35BedrockJoin(project,upstream,profileSource){
 const original=project.library.find(a=>a.id===id), companion=project.library.find(a=>a.id===deep);
 assert.equal(sha(original),SHAold); assert.equal(sha(companion),SHAdeep);
 assert.equal(refSig(original),NOW);
 const stage=project.stages.find(s=>s.metadata?.stageId===35), written=sha(stage);
 const srcBefore=JSON.stringify(project), upstreamBefore=JSON.stringify(upstream);
 const result=applyStage35BedrockJoin(project,upstream);
 const {previousAct4Signatures:bridge,project:out}=result, next=out.library.find(a=>a.id===id);
 assert.equal(JSON.stringify(project),srcBefore); assert.equal(JSON.stringify(upstream),upstreamBefore);
 assert.equal(out.stages,project.stages); assert.equal(out.stages.find(s=>s.metadata?.stageId===35),stage);
 assert.equal(sha(stage),written); assert.equal(sha(next),SHAnew); assert.equal(refSig(next),JOINED);
 assert.equal(bridge[id].previous,PRE_OPT); assert.equal(bridge[id].previousOptimized,NOW); assert.equal(bridge[id].current,JOINED);
 assert.equal(bridge[id].stage,35);
 assert.deepEqual(Object.keys(bridge),Object.keys(upstream));
 for(const [k,v] of Object.entries(upstream))if(k!==id)assert.strictEqual(bridge[k],v);
 assert.equal(out.library.length,project.library.length);
 assert.equal(out.library.find(a=>a.id===deep),companion);
 for(const [i,a] of project.library.entries())if(a.id!==id)assert.strictEqual(out.library[i],a);
 assert.equal(next.vector.root.children.length,2);
 assert.deepEqual(next.vector.root.children[0],original.vector.root.children[0]);
 const revert=structuredClone(next);
 assert.equal(revert.vector.root.children.pop().clipPath,'stage35-southeast-native-union');
 delete revert.vector.clips['stage35-southeast-native-union'];
 assert.deepEqual(revert,original);

 const change=(addr,value)=>({...project,library:project.library.map(a=>a.id===id?{...a,[addr]:value}:a)});
 assert.throws(()=>applyStage35BedrockJoin(change('name','changed'),upstream),/optimized upstream/);
 assert.throws(()=>applyStage35BedrockJoin(project,{...upstream,[id]:{...upstream[id],current:'unknown'}}),/upstream old-save/);
 assert.throws(()=>applyStage35BedrockJoin(out,bridge),/optimized upstream/);
 assert.throws(()=>applyStage35BedrockJoin({...project,stages:[...project.stages,stage]},upstream),/canonical Stage35/);
 const changedPlacement={...stage,elements:stage.elements.map(e=>e.assetId===id?{...e,x:e.x+1}:e)};
 assert.throws(()=>applyStage35BedrockJoin({...project,stages:project.stages.map(s=>s===stage?changedPlacement:s)},upstream),/placement is not unique/);
 assert.throws(()=>applyStage35BedrockJoin({...project,stages:[...project.stages,{id:'foreign',elements:[stage.elements.find(e=>e.assetId===id)]}]},upstream),/placement is not unique/);

 const G={HONRO_CORE:{},HONRO_PROJECT:{library:out.library},HONRO_PREVIOUS_TERRAIN_ART:bridge,structuredClone};
 vm.runInNewContext(profileSource,G);
 const S=G.HonroProfileStore;
 const ref=(signature)=>({honroStaticAssetRef:1,id,signature});
 const snapshot=(signature,overrides={})=>({
  mode:'campaign',honroStage:35,honroAct4Official:1,honroCustom:false,honroMapOrigin:'campaign',
  round:7,terrain:[{id:'unchanged',points:[{x:1,y:2}]}],units:[{id:'party',hp:45}],
  honroLandmarks:[{id:'approved35-near-geology',asset:ref(signature)}],...overrides,
 });
 for(const sign of ( [PRE_OPT,NOW,JOINED] )){
  const save=snapshot(sign);const locked={terrain:JSON.stringify(save.terrain),units:JSON.stringify(save.units),round:save.round};
  assert(S.restoreBattleArt(save),sign);assert.equal(sha(save.honroLandmarks[0].asset),SHAnew);
  assert.deepEqual({terrain:JSON.stringify(save.terrain),units:JSON.stringify(save.units),round:save.round},locked);
 }
 function rejected(save){
  const start=JSON.stringify(save);assert.equal(S.restoreBattleArt(save),false);assert.equal(JSON.stringify(save),start,'must be atomic');
 }
 for(const sign of [PRE_OPT,NOW])for(const override of [
  {mode:'training'},{honroStage:34},{honroCustom:true},{honroMapOrigin:'workshop'},{honroAct4Official:0},
 ])rejected(snapshot(sign,override));
 rejected(snapshot('123:unknown'));
 const unknownSecond=snapshot(NOW);
 unknownSecond.honroLandmarks.push({id:'bad',asset:ref('123:unknown')});rejected(unknownSecond);
 // Current generic exact-ref behavior is deliberately not changed by this bridge.
 const inline=snapshot(JOINED);inline.honroLandmarks[0].asset=structuredClone(next);
 const compact=S.compactBattleArt(inline);
 assert.equal(compact.honroLandmarks[0].asset.signature,JOINED);
 assert(S.restoreBattleArt(compact));assert.equal(sha(compact.honroLandmarks[0].asset),SHAnew);
 G.HONRO_PREVIOUS_TERRAIN_ART={...bridge,[id]:{...bridge[id],current:'invalid'}};
 rejected(snapshot(NOW));rejected(snapshot(PRE_OPT));assert(S.restoreBattleArt(snapshot(JOINED)));
 if(import.meta.url===new URL('file:'+path.resolve(process.argv[1]??'')).href)
   console.log('PASS Stage35 source-only exact scoped join, reversibility and atomic provider compatibility');
 return {old:refSig(original),new:refSig(next),sourceSHA256:sha(original),resultSHA256:sha(next)};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const [{readWorldSource},{terrainPathOptimization}]=await Promise.all([
  import('../tools/act4-source/world-source.mjs'),import('../shared/terrain-path-optimization.mjs')
 ]);
 const root=JSON.parse((await readWorldSource()).bytes.toString('utf8'));
 const opt=await terrainPathOptimization();
 // Optimizer input signature is checked by the production implementation; only these
 // explicit Stage35 providers are copied because handoff does not touch either owner.
 opt.apply(root.library.filter(a=>a.id===id||a.id===deep));
 const p=await readFile(new URL('../shared/runtime/profile-store.js',import.meta.url),'utf8');
 verifyStage35BedrockJoin(root,opt.previousAct4Signatures,p);
}
