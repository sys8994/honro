/** Low-cost reporting regression. Does not run or mutate gameplay. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../../tests/stage22-current-fullplay.mjs',import.meta.url),'utf8');
const expression=source.match(/const summarizeGroup=(.+);\nconst groups=/)?.[1];
assert(expression,'Current fullplay must expose one group summarizer');
function summarize(trace,ids){
 const context={Set,String,enemyActions:trace.enemyActions||[],enemyFires:trace.enemyFires||[],actions:trace.actions||[],damage:trace.damage||[],e:{unit:()=>({dead:false})},distance:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)};
 return vm.runInNewContext('('+expression+')',context)('sample',ids);
}
const sample=summarize({damage:[
 {owner:'enemy-a',target:'p-knight',side:0,amount:12,frame:1},
 {owner:'enemy-a',target:'enemy-a',side:1,amount:20,frame:2},
 {owner:'enemy-b',target:'enemy-a',side:1,amount:30,frame:3},
 {owner:'p-archer',target:'enemy-a',side:1,amount:7,frame:4},
]},['enemy-a']);
assert.equal(sample.damageDealt,12,'Enemy self/friendly damage must not count as hero pressure');
assert.equal(sample.damageTaken,7,'Enemy self/friendly damage must not count as player response');
assert.equal(sample.firstEffect.amount,12);
const raw=process.argv[2];
if(raw){
 const trace=JSON.parse(await readFile(raw+'/trace.json','utf8'));
 const original=JSON.parse(await readFile(raw+'/result.json','utf8'));
 const rows=original.groups.map(g=>{const r=summarize(trace,g.memberIds);return {id:g.id,heroHpDamage:r.damageDealt,playerHpDamage:r.damageTaken};});
 assert.deepEqual(rows.map(r=>r.heroHpDamage),[364,548,244,190,331,281,22]);
 assert.deepEqual(rows.map(r=>r.playerHpDamage),[4712,1962,3288,1748,3804,4657,67]);
 console.log(JSON.stringify({scope:'Read-only reanalysis; original raw is unchanged',rows},null,2));
}
console.log('Stage22 reporting regression passed');
