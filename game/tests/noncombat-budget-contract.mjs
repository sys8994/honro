/** Test/report classification for the specifically approved quiet funeral.
 * Production difficulty formulas and all29 combat acceptance bands are unchanged. */
import assert from 'node:assert/strict';
import {campaignHash,currentCampaignManifest} from '../../tests/current-campaign-contract-helpers.mjs';
const plain=v=>JSON.parse(JSON.stringify(v));
const expectedSteps=[
 {id:'route',label:'임시 천도진 열기',kind:'interact',requiredClass:'mage'},
 ...Array.from({length:3},(_,i)=>[{id:'separate-'+(i+1),label:['망치를 가져온 형과 혼 만나기','언니를 부르는 동생과 혼 만나기','이름 없는 혼 곁에 서기'][i],kind:'interact',requiredClass:'occultist',parallelGroup:'farewell'},{id:'send-'+(i+1),label:['동생의 혼 보내기','언니의 혼 보내기','이름 없는 혼 보내기'][i],kind:'interact',parallelGroup:'farewell',requiresDone:['separate-'+(i+1)]}]).flat(),
 {id:'old-soul',label:'종 밑의 오래된 흔적 조사',kind:'interact'}];
export function auditEncounterBudget(g,stage,b){
 const row=plain(g.HonroDifficulty.audit(stage,b));
 if(stage.id!==19){assert.notEqual(b.honroQuietFuneral,true,'Quiet funeral tag cannot exempt another chapter');return row;}
 const canonical=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===19);assert(canonical);assert.equal(campaignHash(canonical),currentCampaignManifest.runtime.stages[18].sha256,'Exact approved canonical19, not tag-only exemption');
 assert.equal(canonical.initialState.honroQuietFuneral,true);assert.equal(b.honroQuietFuneral,true);assert.equal(b.honroStage,19);assert.equal(b.honroCustom,false);assert.equal(b.honroMapOrigin,'campaign');assert.equal(b.honroAct2Revision,2);
 assert.equal(canonical.units.filter(u=>u.team==='enemy').length,0);assert.equal(b.units.filter(u=>u.side===1).length,0,'No live or dead enemy can be inserted');assert.deepEqual(plain(canonical.events),[]);assert.deepEqual(plain(canonical.encounters),[]);assert.deepEqual(plain(b.honroEvents),[]);assert.deepEqual(plain(b.honroAuthoredEvents),[]);
 const plan=g.HonroAct2Plan.forStage(19);assert.equal(plan.initial,0);assert.equal(plan.waveCount,0);assert.equal(plan.bossWave,undefined);assert.equal(plan.progressWave,undefined);assert.deepEqual(plain(stage.steps),expectedSteps,'Exact eight noncombat interactions and free-order farewell dependencies');assert(plan.sequence.every(s=>typeof s==='string'||(s.kind==='interact'&&!s.wave)));
 assert.equal(row.initialEnemies,0);assert.equal(row.reinforcements,0);assert.equal(row.medianHitsToKill,0);assert.equal(row.medianEnemyHitHpPercent,0);assert.deepEqual(row.issues,['ordinary enemy hit budget','incoming damage budget'],'Do not mask any additional combat/audit violation');
 return {...row,combatApplicability:'not-applicable',combatContractSource:'2d7bcbf8245ee34bad067b79d082c31ca388da59',inapplicableCombatIssues:row.issues,medianHitsToKill:null,medianEnemyHitHpPercent:null,focusRoundHpPercentAt55PercentAccuracy:null,noncombatContract:{stage:19,canonicalExact:true,enemies:0,reinforcements:0,interactions:8},issues:[],status:'N/A · 비전투 장례 계약 통과'};
}
