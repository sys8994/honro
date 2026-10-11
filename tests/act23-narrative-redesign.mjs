import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=async name=>readFile(`shared/runtime/${name}.js`,'utf8');
async function chapters(name,end){const src=await source(name),from=src.indexOf('const chapters=')+15,to=src.indexOf(end,from),prefix=src.slice(0,from-15).replace(/\(function\(G\)\{'use strict';/,'').replace(/const H=.*\n/,'');return vm.runInNewContext(prefix+'\n('+src.slice(from,to)+')');}
const a2=await chapters('act2-drama',';\nfor(const'),a3=await chapters('act3-content',';\nconst roster'),stage=n=>n<21?a2[n-11]:a3[n-21];
const all=[];for(let n=11;n<=30;n++){const c=stage(n);for(const [key,rows]of Object.entries({story:c.story,outro:c.outro,...c.beats}))for(const row of rows||[])all.push({n,key,row});}
for(const {n,key,row:[who,text,meta]}of all){if(meta?.kind==='document'){assert(text.split('\n').length<=3,`${n}/${key}: at most three document lines`);assert(text.length<=100,`${n}/${key}: concise document rather than dense paragraphs`);}}
assert(!stage(12).story.some(l=>l[1].includes('제가 낸 자국')));
assert(stage(13).story.some(l=>l[1].includes('손에 혼')));
assert(!stage(14).story.some(l=>l[0]==='중층 주민'),'distant middle resident waits until actual rescue');
assert(stage(14).beats['family-mid'].some(l=>l[1].includes('서로 손목을 묶었어요')));
assert(!stage(15).beats.groove.some(l=>l[1].includes('대종 밑동')));
assert(!stage(16).beats.hall.some(l=>['노승','승려'].includes(l[0])),'remote NPCs do not speak at record room');
assert(stage(16).beats.witness.some(l=>l[1].includes('열쇠를 가져가')));
assert(!stage(17).story[0][1].includes('부러진 축'));
assert(stage(17).beats.repair.some(l=>l[1].includes('부러진 자국')));
assert(!JSON.stringify(stage(19)).includes('덕수'));
assert(stage(19).beats['separate-1'][0][0]!==stage(19).beats['separate-2'][0][0]);
assert(!stage(19).beats['separate-3'].some(l=>l[1].includes('같이 일하던')));
assert(stage(21).beats['gate-resident'].some(l=>l[1].includes('이미 죽었어요')));
assert(!stage(22).beats['compare-ledgers'].some(l=>l[1].includes('반란군 마을이 아니')));
assert(stage(24).beats['land-register'].some(l=>l[1].includes('묘역 기록실')));
assert(stage(28).beats['party-reunion'].some(l=>l[1].includes('대도사')));
assert(stage(28).beats['party-reunion'].some(l=>l[1].includes('금속량')));
assert(!stage(29).steps.some(s=>s.id==='flight-hold'));
assert(stage(29).beats['hyeonmuk-letter'].some(l=>l[1].startsWith('이 글대로라면')));
assert(!stage(30).beats['transport-map'].some(l=>l[1].includes('따로 시작된 일이 아니')));
const direction=await source('story-direction');assert(direction.includes("shot({actor:'act2-keeper'})"));
assert(!direction.split('\n').filter(l=>l.includes('rule(18,')).some(l=>l.includes("actor:'boss'")));
console.log('Act 2/3 narrative redesign contracts passed; map/runtime integration and browser staging are separate gates.');
