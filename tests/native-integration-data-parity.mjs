/** Check an already-built integration candidate against a Git baseline. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const commit=process.argv[2]||'7238c788';
assert.match(commit,/^[a-f0-9]{7,40}$/i);
const old=p=>execFileSync('git',['show',`${commit}:${p}`],{maxBuffer:150*1024*1024});
const before=JSON.parse(old('web/manifest.json')),after=JSON.parse(await readFile('web/manifest.json'));
assert.equal(after.project,before.project,'campaign data and asset manifest must remain byte-identical');
const a=JSON.parse(old(before.project)),b=JSON.parse(await readFile(after.project));assert.equal(a.stages.length,40);assert.equal(b.stages.length,40);
for(let i=0;i<40;i++)assert.deepEqual(JSON.parse(await readFile(b.stages[i])),JSON.parse(old(a.stages[i])),`stage ${i+1}`);
console.log('PASS all 40 authored stage JSON and entire campaign asset manifest match',commit,'; not runtime or full-play acceptance');
