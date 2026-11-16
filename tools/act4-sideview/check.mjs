import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import vm from 'node:vm';
import {readWorldSource} from '../act4-source/world-source.mjs';
import {applyAct4FinaleRevision} from '../../shared/act4-finale-revision.mjs';
import {applyAct4HandoffArt} from '../../shared/act4-handoff-art.mjs';
import {applyAct4SideviewArt} from '../../shared/act4-sideview-art.mjs';
const base=await applyAct4HandoffArt(applyAct4FinaleRevision(JSON.parse((await readWorldSource()).bytes)));
const original=JSON.stringify(base),candidate=await applyAct4SideviewArt(base);
assert.equal(JSON.stringify(base),original,'Input project must remain untouched');
const scope={};vm.runInNewContext(await readFile('shared/map/vector-art.js','utf8'),scope);
const findings=[];
for(const stage of candidate.stages){
 const prior=base.stages.find(s=>s.id===stage.id),n=stage.metadata.stageId;
 const additions=stage.elements.filter(e=>e.assetId.startsWith('act4-sideview:'));
 assert.deepEqual({...stage,elements:stage.elements.filter(e=>!e.assetId.startsWith('act4-sideview:'))},prior);
 if([33,40].includes(n)){
  assert.equal(additions.length,1);
  for(const e of additions){const a=candidate.library.find(a=>a.id===e.assetId);
   const errors=scope.HonroVectorArt.validate(a.vector);assert.equal(errors.length,0,errors.join('; '));
   assert.equal(a.collision.length,0);assert.equal(e.nativeArtLayer,'surface');
   assert.equal(e.x,0);assert.equal(e.y,0);assert.equal(e.scale,1);
  }
  findings.push({stage:n,artAssets:additions.map(e=>e.assetId),allNonArtStageFieldsEqual:true,originalElementsEqual:true});
 }else assert.equal(additions.length,0);
}
for(const old of base.library)assert.deepEqual(candidate.library.find(a=>a.id===old.id),old,'Existing provider/signature content');
const report={sourceMaster:'4b4e771e85e67a6b9aabd25b6f73e511946bc0f0',scope:'source invariance and existing vector-schema validation; not gameplay or art approval',findings,existingProvidersUnchanged:base.library.length};
await mkdir('_local/reports/act4-sideview-p1-20261116',{recursive:true});
await writeFile('_local/reports/act4-sideview-p1-20261116/source-check.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
