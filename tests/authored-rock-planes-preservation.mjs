/** The shared build-time primitives must reproduce the already-approved art. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {applyStage15VectorFinish} from '../tools/environment/stage15-vector-finish.mjs';
import {applyStage16VectorFinish} from '../tools/environment/stage16-vector-finish.mjs';
const base='6544b7da6783703b7c6d65ecc88f38023bb44322',raw=execFileSync('git',['show',base+':shared/data/campaign.json'],{maxBuffer:40e6,encoding:'utf8'}),approved=JSON.parse(raw),current=JSON.parse(readFileSync('shared/data/campaign.json','utf8'));
for(const[i,author]of [[14,applyStage15VectorFinish],[15,applyStage16VectorFinish]]){
 const q=author(structuredClone(approved));assert.equal(JSON.stringify(q)+'\n',raw,'Whole approved campaign bytes');assert.deepEqual(author(structuredClone(q)),q,'Whole approved idempotence');assert.deepEqual(current.stages[i],approved.stages[i],'Current stage remains approved exact');const r=author(structuredClone(current));assert.deepEqual(r,current,'Reauthoring approved stage cannot mutate current campaign');
}
console.log('Shared author primitives:15/16 approved whole campaign bytes, current stages, reproduction/idempotence PASS');
