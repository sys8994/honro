import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dialogueInventory} from './dialogue-clarity-inventory-helpers.mjs';
import {beforeDialogueClarity} from './dialogue-clarity-history-helpers.mjs';
const before=JSON.parse(await readFile('tests/fixtures/dialogue-clarity-before.json','utf8')),delta=JSON.parse(await readFile('tests/fixtures/dialogue-clarity-delta.json','utf8')),current=await dialogueInventory(),expected=structuredClone(before);
const proseRoots=new Set(['story','outro','failure','beats','storyFollowups','narration','guide','storySummary']);
for(const row of delta.changes){
 const [view,,field]=row.path;assert(['stages','authoredStages','rests','lines'].includes(view));if(['stages','authoredStages'].includes(view))assert(proseRoots.has(field),'Only explicitly enumerated narrative fields may change');if(view==='lines')assert.equal(field,'text','Speaker, path, metadata and scene IDs remain exact');
 let parent=expected;for(const k of row.path.slice(0,-1))parent=parent[k];const key=row.path.at(-1);assert.equal(parent[key],row.before,'Verified immutable before value');assert.equal(typeof row.after,'string');parent[key]=row.after;
}
assert.deepEqual(current,expected,'All 30 fresh/authored chapters, rest pages and injected lines match only the explicit prose delta');
assert.equal(current.stages.length,30);assert.equal(current.rests.length,30);
const perStage=current.stages.map(st=>({stage:st.id,lines:current.lines.filter(l=>l.path.startsWith(`stage.${st.id}.`)).length,restLines:current.lines.filter(l=>l.path.startsWith(`rest.${st.id}.`)).length,changed:delta.changes.filter(r=>r.path[0]==='lines'&&current.lines[r.path[1]].path.startsWith(`stage.${st.id}.`)).length}));
for(const row of perStage){assert(row.lines>0);assert(row.restLines>0);}
// Existing saves remain literal payloads. A historical projection reverses only
// reviewed text; identity, count, behavior and unreviewed wording stay visible.
for(const st of current.authoredStages){const old=beforeDialogueClarity(st);assert.deepEqual(old,before.authoredStages[st.id-1]);const altered=structuredClone(st);altered.story[0][1]='검수되지 않은 새 문장';assert.notDeepEqual(beforeDialogueClarity(altered),before.authoredStages[st.id-1]);}
const text=(id,key)=>JSON.stringify(current.stages[id-1][key]),rest=id=>current.lines.filter(l=>l.path.startsWith(`rest.${id}.`)).map(l=>l.text).join(' ');
assert.match(text(9,'story'),/소단.*원혼.*나누어 받/);assert.match(text(9,'outro'),/가운데 줄을 놓아도 안전/);assert.match(text(9,'outro'),/주민을 살리고.*주박으로 막겠어요.*다치더라도/);
assert.match(text(10,'story'),/주민을 지키려는 뜻.*더 다가오면 여러분부터 막겠어요/);assert.match(text(10,'story'),/가운데 줄.*바깥 주박/);
assert.match(current.lines.find(l=>l.path==='runtime.10.cooperation.4').text,/제가 줄에서 놓은 혼.*진으로 들어/);
assert.doesNotMatch(rest(13),/홍만.*지도/);assert.doesNotMatch(rest(18),/축도 함께 가져/);assert.doesNotMatch(rest(26),/청원/);assert.doesNotMatch(rest(29),/대도사 곁|현묵|제자/);
assert.match(text(26,'beats'),/유골과 재를 어떻게 처리/);assert.doesNotMatch(text(26,'beats'),/유골을 종을 만드는 데/);
assert.match(text(5,'story'),/물길.*낙수/);assert.match(text(18,'beats'),/종 아래 열린 틈으로 새는 혼/);
await mkdir('_local/reports/dialogue-clarity',{recursive:true});await writeFile('_local/reports/dialogue-clarity/coverage.json',JSON.stringify({baseCommit:delta.baseCommit,sourceOccurrences:current.lines.length,perStage,deltaStringLeaves:delta.changes.length,limits:['Collected source occurrences include raw authored map candidates and overridden runtime dispatch; not unique spoken lines or normal-play execution coverage.','Production App/model harness; DOM, Canvas and audio are doubles. Movement Native inspection and deployment verification are separate.']},null,2)+'\n');
console.log('PASS exact approved prose delta across 30 fresh/authored stages and 30 rest contexts; speakers, IDs, page counts, quests and non-prose fields unchanged.');
console.log('PASS explicit Sodan threat and partial/full transfer proof, rest revelation timing, evidence limits and unknown-text negative control.');
