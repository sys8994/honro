import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),plain=v=>JSON.parse(JSON.stringify(v)),H=g.HONRO_CONTENT;
const prior=g.HonroStoryCanonV1.prior,content=(id,b={})=>g.HonroObjectiveRevision.contentFor({honroStage:id,honroBellRevision:1,honroObjectiveRevision:2,honroNarrativeRevision:1,honroWaterworksRevision:3,honroStoryCanonRevision:1,...b},H.stages[id-1]);
const text=x=>JSON.stringify(x);
assert.equal(H.stages.length,30,'Future act planning does not add playable stages');
for(let id=1;id<=30;id++){
 const current=H.stages[id-1],old=prior[id-1];
 for(const k of ['steps','act2Plan','playableRoster','enemies','active','requires','level','w','h'])assert.deepEqual(plain(current[k]??null),plain(old[k]??null),'No gameplay rewrite '+id+'/'+k);
 if(id<=10||[15,16,19,21,22,26].includes(id))assert.deepEqual(plain(current),plain(old),'Unnecessary prose preserved '+id);
}
assert(text(content(12)).includes('사람이 길을 틀어놓은 진'));
assert(text(content(14)).includes('발을 헛디뎌요'));
assert(text(content(16)).includes('사흘째'));
assert(text(content(18)).includes('평사 한 발'));
assert(text(content(17)).includes('이 축으로 사람을 끌어올릴 수 있었던 건 분명'));
assert(text(content(23)).includes('검수대의 번호'));
assert(text(content(24)).includes('운송 표찰의 원본'));
assert.equal(content(25).steps.filter(s=>s.id.startsWith('stake-arrival-')).length,5);
assert.equal(content(27).steps.filter(s=>s.id.startsWith('stake-arrival-')).length,4);
assert.match(content(27).guide,/자유롭게/);
assert.equal(content(25).beats['stake-arrival-3'].length,2);
assert(!text(content(26)).includes('아래가 없'));
assert(text(content(28)).includes('승인한 자, 죽인 자, 감춘 자'));
assert(!text(content(29)).includes('집하장에서 아래가 없던'));
assert(text(content(29,{honroVoidWitness:true})).includes('같은 원인이라 단정할 수는 없어'));
assert(!text(content(20)).includes('화살이 사라진 순간'));
assert(text(content(20,{honroBellWitness:true})).includes('화살이 사라진 순간'));
assert(!text(content(30)).includes('고향 사람들이 죽'));
for(const id of [11,12,14,17,20,23,24,25,27,28,29,30]){
 const old=content(id,{honroStoryCanonRevision:undefined});
 assert.deepEqual(plain(old),plain(prior[id-1]),'Unsnapshotted old current revision keeps original content '+id);
 const saved={...plain(prior[id-1]),story:[['기록','이미 저장한 원문',{storyId:'saved-original'}]],outro:[['설오','기존 마지막 쪽']]};
 const before=text(saved),loaded=content(id,{honroStoryCanonRevision:undefined,honroNarrativeContent:saved});
 assert.equal(text(loaded),before,'Existing narrative payload remains byte-identical '+id);
}
for(const id of [25,27])for(const version of [1,2]){
 const old=content(id,{honroStoryCanonRevision:undefined,honroWaterworksRevision:version});
 assert.deepEqual(plain(old),plain(g.HONRO_WATERWORKS_V2.content.find(s=>s.id===id)),'Waterworks historical content retained');
}
const raw=JSON.parse(readFileSync('shared/data/campaign.json')),once=g.HonroStoryCanonV1.author(raw);
assert.deepEqual(plain(g.HonroStoryCanonV1.author(once)),plain(once),'Fresh author is idempotent');
for(let i=0;i<30;i++)assert.equal(once.stages[i].initialState.honroStoryCanonRevision,i<10?undefined:1);
for(const id of [12,14,18,25,27,29]){
 const {b}=battlefield(g,id);assert.equal(b.honroStoryCanonRevision,1);
 assert(b.honroNarrativeContent,'Actual World build snapshots prose');
 if(id===12){assert(text(b.honroQuarryContent.beats.sign).includes('사람이 길을 틀어놓은 진'));assert(text(g.HonroObjectiveRevision.contentFor(b,H.stages[id-1])).includes('사람이 길을 틀어놓은 진'));}
 if(id===14){assert.equal(b.honroVerticalStage14Content.beats['family-mid'].filter(r=>r[1].includes('요새는 늘 밟던 돌')).length,1);assert(text(g.HonroObjectiveRevision.contentFor(b,H.stages[id-1])).includes('요새는 늘 밟던 돌'));}
 const saved=plain(b),before=text(saved);g.HonroObjectiveRevision.contentFor(saved,H.stages[id-1]);assert.equal(text(saved),before,'Content lookup is pure');
}
// New additions are observation and uncertainty, not the unrevealed answers.
const additions=H.stages.flatMap((st,i)=>{
 const old=new Set([...(prior[i].story||[]),...(prior[i].outro||[]),...Object.values(prior[i].beats||{}).flat()].map(r=>r[1]));
 return [...(st.story||[]),...(st.outro||[]),...Object.values(st.beats||{}).flat()].map(r=>r[1]).filter(t=>!old.has(t));
});
for(const forbidden of ['거푸집','지연된 응답','선택받','차원 포털','중력장','물리 오류','현묵은 살아','죽여 종을 만들'])assert(!additions.some(t=>t.includes(forbidden)),forbidden);
console.log('PASS canon v1: 30 chapter gameplay invariants, 5/4 free routes, disclosure ceilings, conditional witnesses, fresh/old snapshots and historical waterworks.');
