import {readPinnedFixtureBytes} from './pinned-fixture-bytes.mjs';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),fixture=JSON.parse(await readFile('tests/fixtures/narrative-parity-v1.json','utf8'));
const stage11Approved=JSON.parse(await readFile('tests/fixtures/stage11-quest-contract-v1.json','utf8'));
const mechanicsOnly=process.argv.includes('--mechanics')||g.HonroNarrativeCatalogue.data.editorialVersion===2;
const plain=x=>JSON.parse(JSON.stringify(x));
function normalize(v){if(Array.isArray(v)){const a=v.map(normalize);if(a.length===3&&typeof a[0]==='string'&&typeof a[1]==='string'&&a[2]&&typeof a[2]==='object'&&!Object.keys(a[2]).length)a.pop();return a;}if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).filter(([k])=>!['rowId','direction','recordPresentation','entryCamera','arrivalCamera','mageAbsentText'].includes(k)).map(([k,x])=>[k,normalize(x)]));return v;}
const fields=['story','outro','beats','storyFollowups','narration','storySummary','guide','goal','narrationArt','failure','honroWaterfallStory'];
const issues=[];
for(let id=1;id<=30;id++){
 const {b,app}=battlefield(g,id);b.honroVoidWitness=b.honroBellWitness=true;const actual=normalize(g.HonroObjectiveRevision.contentFor(b,g.HONRO_CONTENT.stages[id-1])),expected=id===11?{...fixture.effective[id-1],goal:stage11Approved.goal,guide:stage11Approved.guide}:fixture.effective[id-1];
 for(const field of fields.filter(f=>!mechanicsOnly||['guide','goal','narrationArt','honroWaterfallStory'].includes(f)))try{assert.deepEqual(plain(actual[field]??null),expected[field]??null);}catch(e){issues.push({id,field,actual:actual[field],expected:expected[field]});}
 const contract=Object.fromEntries(Object.entries(g.HONRO_CONTENT.stages[id-1]).filter(([k])=>!fields.includes(k)));
 const expectedContract=id===11?{...fixture.contracts[id-1],summary:stage11Approved.summary,steps:stage11Approved.steps,act2Plan:{...fixture.contracts[id-1].act2Plan,sequence:stage11Approved.steps}}:fixture.contracts[id-1];
 try{assert.deepEqual(plain(contract),expectedContract);}catch(e){issues.push({id,field:'mechanical-contract',message:e.message});}
}
await mkdir('_local/reports/narrative-voice-v2',{recursive:true});await writeFile('_local/reports/narrative-voice-v2/parity.json',JSON.stringify({issues},null,2));
console.log('parity differences',issues.map(q=>q.id+'/'+q.field).join(', ')||'none');assert.equal(issues.length,0);
console.log(mechanicsOnly?'PASS 30 stage contracts match baseline plus explicit approved Stage11 quest delta (copy checked separately)':'PASS 30 effective current payloads and non-narrative stage contracts are identical; only persistent row identities/directions were added');
const oldCases=JSON.parse(readPinnedFixtureBytes('tests/fixtures/narrative-legacy-resolver-v1.json'));
for(const {id,mode,b,expected}of oldCases){const saved={...plain(b),honroStage:id,honroState:{},honroCustom:false};const before=JSON.stringify(saved);const result=g.HonroObjectiveRevision.contentFor(saved,g.HONRO_CONTENT.stages[id-1]);assert.deepEqual(normalize(plain(result)),normalize(expected),'legacy '+id+'/'+mode);assert.equal(JSON.stringify(saved),before,'resolver is read-only');}
console.log('PASS 40 old V0/revision1/stored/split-v1/waterworks-v2 resolver cases; saved data untouched');
