/** The shared build-time primitives must reproduce the already-approved art. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {applyStage15VectorFinish} from '../tools/environment/stage15-vector-finish.mjs';
import {applyStage17VectorFinish} from '../tools/environment/stage17-vector-finish.mjs';
import {applyStage16VectorFinish} from '../tools/environment/stage16-vector-finish.mjs';
const base='6544b7da6783703b7c6d65ecc88f38023bb44322',raw=execFileSync('git',['show',base+':shared/data/campaign.json'],{maxBuffer:40e6,encoding:'utf8'}),approved=JSON.parse(raw),current=JSON.parse(readFileSync('shared/data/campaign.json','utf8'));
for(const[i,author]of [[14,applyStage15VectorFinish],[15,applyStage16VectorFinish]]){
 const q=author(structuredClone(approved));assert.equal(JSON.stringify(q)+'\n',raw,'Whole approved campaign bytes');assert.deepEqual(author(structuredClone(q)),q,'Whole approved idempotence');assert.deepEqual(current.stages[i],approved.stages[i],'Current stage remains approved exact');const r=author(structuredClone(current));assert.deepEqual(JSON.parse(JSON.stringify(r)),current,'Serialized reauthoring cannot mutate current campaign');
}
console.log('Shared author primitives:15/16 approved whole campaign bytes, current stages, reproduction/idempotence PASS');

const release='793a9a953d6f82038d44dc44b51ea5a01ce996c4',rawRelease=execFileSync('git',['show',release+':shared/data/campaign.json'],{maxBuffer:40e6,encoding:'utf8'}),approvedRelease=JSON.parse(rawRelease);
for(const[i,author]of [[14,applyStage15VectorFinish],[15,applyStage16VectorFinish],[16,applyStage17VectorFinish]]){const q=author(structuredClone(approvedRelease));assert.equal(JSON.stringify(q)+'\n',rawRelease,'793a approved whole campaign bytes');assert.equal(JSON.stringify(author(structuredClone(q))),JSON.stringify(q),'793a idempotence');assert.deepEqual(current.stages[i],approvedRelease.stages[i],'Current approved stage including corrected17 route exact');assert.equal(JSON.stringify(author(structuredClone(current))),JSON.stringify(current),'Reauthor cannot mutate current project');}
console.log('Shared section compiler:15–17 approved793a bytes/idempotence/current routes PASS');
