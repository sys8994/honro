/** One explicit approval follows the preserved master4a60158 manifests.
 * Original fixture bytes and every earlier approval remain independently pinned. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {storyDeltaHash as hash,applyExactStoryJsonDelta,reverseExactStoryStages} from './exact-story-revision-delta.mjs';

const bytes=readFileSync(new URL('./fixtures/act23-story-revision-delta.json',import.meta.url));
assert.equal(hash(bytes),'f7da64c1b9e14b9592a2e3ad01a861692b790c92c2dad119ca3750fb25c0c529','Reviewed exact Act 2/3 delta; never automatically refreshed');
export const storyRevisionApproval=JSON.parse(bytes);
export const storyRuntimeDelta=storyRevisionApproval.runtime;
export function applyStoryRuntimeManifest(previous){
 const d=storyRuntimeDelta;
 assert.equal(hash(previous),d.beforeManifestSha256,'Entire prior runtime manifest remains immutable');
 assert.equal(hash(previous.approvedDeltas),d.beforeApprovedDeltasSha256);
 assert.equal(hash(previous.sourceRows),d.beforeSourceRowsSha256);
 assert.deepEqual(previous.variants,d.beforeBuilds);assert.equal(previous.coreSha256,d.beforeCoreSha256);
 assert.deepEqual(previous.modelFiles,d.beforeModelFiles);assert.deepEqual(previous.engineFiles,d.beforeEngineFiles);
 const current=structuredClone(previous);
 for(const change of d.sourceChanges){
  const index=current.sourceRows.findIndex(row=>row.path===change.path);
  if(change.beforeRow===null){assert.equal(index,-1);current.sourceRows.push(structuredClone(change.afterRow));}
  else {assert.deepEqual(current.sourceRows[index],change.beforeRow);current.sourceRows[index]=structuredClone(change.afterRow);}
 }
 current.sourceRows.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
 current.sourceOrder=current.sourceRows.map(row=>row.path);
 assert.deepEqual(current.sourceOrder,d.afterSourceOrder);
 for(const change of d.packagingChanges){
  const index=current.packagingSources.findIndex(row=>row.path===change.path);
  if(change.beforeRow===null){assert.equal(index,-1);current.packagingSources.push(structuredClone(change.afterRow));}
  else {assert.deepEqual(current.packagingSources[index],change.beforeRow);current.packagingSources[index]=structuredClone(change.afterRow);}
 }
 current.modelFiles=structuredClone(d.afterModelFiles);current.engineFiles=structuredClone(d.afterEngineFiles);
 current.coreSha256=d.afterCoreSha256;current.variants=structuredClone(d.afterBuilds);
 current.approvedDeltas.push(structuredClone(d));current.currentCounts={sources:current.sourceRows.length};
 for(const kind of ['added','changed','unchanged'])current.currentCounts[kind]=current.sourceRows.filter(row=>row.kind===kind).length;
 return current;
}
export function beforeStorySourceRows(current){
 const rows=structuredClone(current);
 for(const change of [...storyRuntimeDelta.sourceChanges].reverse()){
  const index=rows.findIndex(row=>row.path===change.path);assert.deepEqual(rows[index],change.afterRow);
  if(change.beforeRow===null)rows.splice(index,1);else rows[index]=structuredClone(change.beforeRow);
 }
 assert.equal(hash(rows),storyRuntimeDelta.beforeSourceRowsSha256);return rows;
}
export function applyStoryCampaignManifest(previous){
 const d=storyRevisionApproval.campaign;
 assert.equal(hash(previous),d.beforeManifestSha256,'Entire prior campaign manifest remains immutable');
 const current=structuredClone(previous);
 for(const row of d.stages){
  if(row.variant==='project')continue;
  const before=current[row.variant].stages.find(stage=>stage.stageId===row.stageId);
  assert.equal(before.sha256,row.beforeSha256);before.sha256=row.afterSha256;
 }
 current.approvedDeltas.push({kind:d.kind,sourceCommit:storyRuntimeDelta.sourceCommit,stages:d.stages.filter(row=>row.variant!=='project')});
 return current;
}
export const beforeStoryCampaign=(project,options)=>reverseExactStoryStages(project,storyRevisionApproval.campaign.stages,options);
export function beforeStoryProjectPart(part){
 const d=storyRuntimeDelta.projectPart;
 assert.equal(hash(part),d.sha256);assert(part.startsWith(d.prefix)&&part.endsWith(d.suffix));
 const project=JSON.parse(part.slice(d.prefix.length,-d.suffix.length));
 const previous=beforeStoryCampaign(project,{variant:'project'});
 const restored=d.previousPrefix+JSON.stringify(previous)+d.previousSuffix;
 assert.equal(hash(restored),d.previousSha256,'Exact prior project wrapper and every payload byte');return restored;
}
export const beforeStoryDialogueInventory=input=>applyExactStoryJsonDelta(input,storyRevisionApproval.dialogue,{reverse:true});
