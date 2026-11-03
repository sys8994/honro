/** Captured current-state analysis; no posed live battle or browser acceptance. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createFinale} from './bootstrap.mjs';
import {evaluateInputTolerance} from './input-tolerance.mjs';
const dir=process.argv[2];assert(dir,'Explicit captured report directory required');
const {C}=await createFinale(),results=[];
for(const [file,id,pick] of [['browser/precast-00.json.xz','S06',null],['browser/precast-01.json.xz','A01',null],['browser/precast-02.json.xz','M02',null],['browser/precast-02.json.xz','M01','basic'],['late/precast-00.json.xz','S01',null]]){
 const s=JSON.parse(execFileSync('xz',['-dc',dir+'/'+file],{maxBuffer:128e6})),c=pick?JSON.parse(await readFile('tools/stage40-qa/records/mage-choice-candidates.json'))[pick]:s.choice,before=JSON.stringify(s.battle),result=evaluateInputTolerance(C,s.battle,s.battle.active,id,c.angle,c.power);assert.equal(JSON.stringify(s.battle),before);results.push({file,id,result});
 if(id==='M02')assert(!result.safeUseful,'Known sensitive M02 must not pass');
 if(id==='M01'||id==='A01'||id==='S01')assert(result.safeUseful,'Known observed safe option rejected');
}
await writeFile(dir+'/input-tolerance-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(({file,id,result})=>({file,id,safeUseful:result.safeUseful,minimum:result.minimumDamage,samples:result.samples.length})),null,2));
