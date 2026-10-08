/** Force-author and missing-step fallback must never mix old terrain/new goals. */
import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),R=g.HonroObjectiveRevision,copy=x=>JSON.parse(JSON.stringify(x));
for(const id of [25,27]){
 const frozen=g.HONRO_WATERWORKS_V2.content.find(s=>s.id===id),base=copy(g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===id));
 // This explicit v2 recipe stays valid when the checked-in campaign is v3.
 base.initialState.honroWaterworksRevision=1;base.initialState.honroAct3Steps=copy(frozen.steps);
 const before=copy(base),st=g.HONRO_CONTENT.stages[id-1],current=copy(st);
 try{
  st.steps=[...st.steps,{id:'future-arrival',kind:'reach',label:'future vertical goal'}];st.guide='future vertical guide';
  const preserved=copy(R.author({stages:[base]},{force:true})).stages[0];assert.deepEqual(preserved,before);assert.deepEqual(base,before);
  const missing=copy(base);delete missing.initialState.honroAct3Steps;
  const restored=copy(R.author({stages:[missing]},{force:true})).stages[0];assert.deepEqual(restored.initialState.honroAct3Steps,copy(frozen.steps));assert.deepEqual(restored.terrains,before.terrains);assert.deepEqual(restored.markers,before.markers);
  const battle={honroStage:id,honroWaterworksRevision:1,honroObjectiveRevision:R.version};assert.deepEqual(copy(R.storedSteps(battle,3)),copy(frozen.steps));assert.equal(R.contentFor(battle,st).guide,frozen.guide);
  const newer=copy(base);newer.initialState.honroWaterworksRevision=3;const authored=copy(R.author({stages:[newer]},{force:true})).stages[0];assert.deepEqual(authored.initialState.honroAct3Steps,copy(st.steps));assert.equal(R.contentFor({...battle,honroWaterworksRevision:3},st).guide,'future vertical guide');
 }finally{Object.assign(st,current);}
 console.log('PASS',id,'old source/labels/terrain exact, frozen missing-step/guide fallback, current v3 author update');
}
