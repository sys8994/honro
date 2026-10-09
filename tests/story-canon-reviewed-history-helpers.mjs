/** Exact reviewed map/content boundaries for the older story-only contract.
 * Current prose is tested separately; no field or gameplay category is skipped. */
import assert from 'node:assert/strict';
import {beforeObjectiveContent} from './objective-delta-helpers.mjs';
import {semanticContent,plain} from './act2-spatial-contract-helpers.mjs';
import {assertStage11RavineCurrent,beforeStage11RavineContent,stage11RavineBefore} from './stage11-ravine-history-helpers.mjs';
import {stage16TempleDelta} from './stage16-temple-history-helpers.mjs';
import {stage17WorksiteDelta} from './stage17-worksite-history-helpers.mjs';

export function beforeReviewedStoryStage(stage,project){
 if(stage.id===11){
  // The older Stage11 fixture stores semantic content, with geometry in its
  // separately hashed map. Rejoin those exact sources; do not invent a golden.
  assertStage11RavineCurrent(project);
  beforeStage11RavineContent(semanticContent(stage));
  const map=project.stages.find(s=>s.metadata.stageId===11),before=stage11RavineBefore.content;
  assert.deepEqual([stage.w,stage.h],[map.width,map.height],'Exact Stage11 story content dimensions');
  assert.deepEqual(plain(stage.map),before.map,'Unchanged Stage11 content map hint');
  assert.deepEqual(plain(stage.act2Plan.size),[map.width,map.height],'Exact Stage11 story plan size');
  assert.deepEqual(plain(stage.act2Plan.sites),Object.fromEntries(Object.entries(map.design.space.sites).map(([id,site])=>[id,[site.x]])),'Exact Stage11 story plan sites');
  assert.deepEqual(plain(stage.act2Plan.lamps),before.act2Plan.lamps,'Unchanged Stage11 story lamp plan');
  return beforeObjectiveContent(before);
 }
 const delta=stage.id===16?stage16TempleDelta:stage.id===17?stage17WorksiteDelta:null;
 if(!delta)return plain(stage);
 assert.deepEqual(plain(beforeObjectiveContent(stage)),plain(beforeObjectiveContent(delta.content.after)),'Exact Stage'+stage.id+' current story content before historical comparison');
 return beforeObjectiveContent(delta.content.before);
}
