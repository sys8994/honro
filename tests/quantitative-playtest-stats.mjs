import assert from 'node:assert/strict';
import {summarize,rng} from '../tools/quantitative-playtest/stats.mjs';
const row=(outcome,round)=>({sourceHash:'a',stage:31,policy:'advance',outcome,round});
const result=summarize([row('clear',4),row('clear',8),row('defeat',10),row('timeout',20),row('error',0),row('cancelled',1)]),g=result.groups[0];
assert.equal(g.started,6);assert.equal(g.clearRateAll,2/6);assert.equal(g.clearRateNormal,.5);assert.deepEqual(g.clearRounds,{n:2,mean:6,median:6});assert.equal(result.gate.status,'blocked');
assert.equal(summarize([row('timeout',100)]).groups[0].clearRounds.mean,null);
assert.equal(summarize([row('clear',1),{...row('clear',2),sourceHash:'b'}]).groups.length,2);
const a=rng(19),b=rng(19);assert.deepEqual(Array.from({length:10},a),Array.from({length:10},b));
assert.throws(()=>summarize([row('unknown',1)]));console.log('PASS quantitative statistics denominators, censoring, source isolation, seeded policy RNG');

const limited=summarize([row('round-limit',21)]).groups[0];assert.equal(limited.clearRateAll,0);assert.equal(limited.clearRounds.n,0);assert.equal(limited.counts['round-limit'],1);

const full={...row('clear',15),controllerHash:'v6',evaluation:{kind:'frozen-holdout'},maxFrames:60000,maxWallSeconds:1800,seed:1},sanity={...full,outcome:'timeout',evaluation:{kind:'mechanics-calibration'},maxFrames:600,maxWallSeconds:180};
assert.equal(summarize([full,sanity]).groups.length,2);assert.equal(summarize([full,{...full,maxFrames:600}]).groups.length,2);assert.equal(summarize([full,{...full,controllerHash:'different'}]).groups.length,2);assert.equal(summarize([full,full]).groups[0].repeatedSeedAttempts,1);
console.log('PASS purpose/budget/controller cohort separation and repeated-seed disclosure; no attempt discarded');

const technical={...full,runId:'failed-holdout',outcome:'error',cohortIdentity:{id:'registered'},protocolRecorded:true},split=summarize([technical,{...technical,outcome:'clear',cohortIdentity:{id:'other-protocol'}}]);assert.equal(split.groups.length,2);assert.equal(split.allAttempts,2);assert.equal(split.technicalErrors,1);assert.equal(split.qualityBlockers.length,1);assert.equal(split.gate.status,'blocked');
console.log('PASS predeclared cohort identity separation, complete attempt totals and holdout technical-error approval block');

assert.equal(summarize([{...technical,evaluation:{kind:'unclassified-missing-start'},requestedEvaluation:{kind:'frozen-holdout'}}]).qualityBlockers.length,1);
const deadlock=summarize([{...full,outcome:'policy-failure'}]);assert.equal(deadlock.normalPolicyFailures,1);assert.equal(deadlock.technicalErrors,0);assert.equal(deadlock.groups[0].clearRateAll,0);assert.equal(deadlock.groups[0].counts['policy-failure'],1);
