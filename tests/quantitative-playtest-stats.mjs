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
