import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
import {historicalCampaign} from './historical-campaign-inputs.mjs';
import {currentGoalDisplayDelta as delta,throughCurrentGoalDisplay} from './current-story-display-helpers.mjs';
const g=await runtime({legacyMaps:false}),original=historicalCampaign(),text=JSON.stringify(original),current=throughCurrentGoalDisplay(g,original),expected=structuredClone(original);
for(const row of delta.rows)expected.stages[row.stage-1].objectives.find(o=>o.id==='campaign-goal').label=row.after;
assert.deepEqual(current,expected,'Exactly two labels, all targets, order, geometry, conditions and other fields unchanged');assert.equal(JSON.stringify(original),text);assert.deepEqual(throughCurrentGoalDisplay(g,current),current);
for(const row of delta.rows){const p=structuredClone(original);p.stages[row.stage-1].objectives.find(o=>o.id==='campaign-goal').label+=' unknown';assert.throws(()=>throughCurrentGoalDisplay(g,p));}
for(const mutate of [p=>p.stages[0].objectives[0].label+=' unrelated',p=>p.stages[7].objectives[0].id='other-target',p=>p.stages[9].objectives[0].type='clear',p=>p.stages[7].objectives.unshift({id:'unauthorized-first-goal',type:'campaign',label:'extra'}),p=>p.stages[9].initialState.honroState.hold=99]){const p=structuredClone(original);mutate(p);assert.notEqual(JSON.stringify(p),text,'Negative control must mutate input');assert.throws(()=>assert.deepEqual(throughCurrentGoalDisplay(g,p),expected),'Unrelated display/gameplay mutation must not be hidden');}
for(const row of delta.rows){const s=g.HONRO_PROJECT.stages[row.stage-1],profile=g.HonroMaps.profileFor(s),battle=g.HonroMaps.createBattle(s,g.HONRO_PROJECT,profile,{origin:'campaign'});assert.equal(g.HonroObjectiveRevision.contentFor(battle,g.HONRO_CONTENT.stages[row.stage-1]).goal,row.after);}
console.log('PASS exact approved8/10 fresh-story labels, immutable legacy text and unchanged gameplay/source fields');
