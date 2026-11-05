/** Recorded native snapshots test presentation only, not new combat evidence. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const trace=JSON.parse(await readFile('_local/reports/stage21-approach/native-after-roof/trace.json'));
const h=await appHarness({productionStory:true}),V=h.g.HonroAct23V4,R=h.g.HonroAct23V4Chapter21Reviewed;
const city=b=>b.honroState.act23v4.city;
const moving=trace.snapshots.find(s=>city(s.battle).actors['act3-resident']?.distance>80&&!city(s.battle).actors['act3-resident']?.safe).battle;
const clearing=trace.snapshots.find(s=>city(s.battle).actors['act3-resident']?.safe&&!s.battle.honroState.act23v4.done['refuge-hold']).battle;
const exit=trace.snapshots.find(s=>s.battle.honroState.act23v4.done['refuge-hold']).battle;
for(const [name,battle] of [['cart',trace.initial],['moving',moving],['clearing',clearing],['exit',exit]]){
 const app=h.load({...trace.profile,honroBattle:plain(battle)});app.continue();const b=app.engine.b,before=plain(b),view=V.state(b);
 assert.deepEqual(plain(b),before,'Presentation cannot mutate combat '+name);
 if(name==='clearing'){
  assert.equal(view.targets[0].label,'남은 길목 적');assert.equal(view.currentInstruction,'남은 길목 적 정리하기');assert.equal(view.summary,view.currentInstruction);assert.equal(view.visibleChecklist[0].text,view.currentInstruction);
  assert.equal(view.currentObjectiveId,'refuge-hold');assert(!view.complete);
 }else assert(!view.currentInstruction.includes('남은 길목 적'),name);
 console.log('PASS phase',name,view.currentInstruction);
}
const sentinel={targets:[],allTargets:[],summary:'unchanged'};
assert.equal(R.present({honroStage:22},sentinel),sentinel,'Other chapters unchanged');
