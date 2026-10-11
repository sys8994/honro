/** Pure content contracts; no gameplay or browser claims. Reconstructed. */
import assert from 'node:assert/strict';
import vm from 'node:vm';import {readFile} from 'node:fs/promises';
const g=vm.createContext({HONRO_CORE:{SKILLS:{}},HONRO_BALANCE:{stages:Array.from({length:20},()=>({entryLevel:1}))}});
for(const name of ['content','story-content','act2-content','act2-drama','journey-content'])vm.runInContext(await readFile(`shared/runtime/${name}.js`,'utf8'),g);
const J=g.HonroJourneyContent,H=g.HONRO_CONTENT,plain=x=>JSON.parse(JSON.stringify(x));
assert.equal(J.places.length,20);assert.deepEqual(plain(J.interludeSources),Object.fromEntries(H.stages.map(s=>[s.id,plain(s.narration)])));
for(let id=1;id<=20;id++){const p=J.at(id),lines=J.interlude(id);assert.equal(p.event,H.stages[id-1].name);assert(lines.length>=([4,5,10].includes(id)?1:2));assert(lines.every(l=>l[0]==='서술'?l[2].kind==='narration'&&l[2].presentation==='inline':!l[2].kind&&!l[2].art));assert(p.map.every(Number.isFinite));assert.equal(p.layer,id<13?'surface':'underground');const locked={cleared:{},recruited:['archer'],seen:{}};if(id>1)assert.deepEqual(plain(J.required(locked,id)),[]);assert.deepEqual(plain(J.optional(locked,id,'occultist')),[]);}
assert.deepEqual(Array.from({length:20},(_,i)=>i+1).filter(id=>J.transitionAfter(id)==='direct'),[1,9,18]);assert.equal(J.at(18).place,J.at(19).place);assert.equal(J.ending.layer,'surface');assert.equal(J.at('bad'),null);console.log('PASS 20 source narration snapshots, authored speech/narration roles, recruitment/layer boundaries and authored urgent links');

// Chapter 5's allied witness stays in the scene. Chapter 6's rest is before
// its rescue; the next rest can recall only the completed convoy journey.
const finish5=H.stages[4].outro,finish5Text=finish5.map(l=>l[1]).join(' ');
assert(finish5.some(([who,line])=>who==='휘겸'&&/방금 저 줄도 당겨졌소/.test(line)));
assert.doesNotMatch(finish5Text,/돌아오는 길|우리가 이 고리를 끊었습니다|휘겸도 함께 가주시겠습니까/);
assert.match(finish5Text,/다리 아래에 남은 운반대/);
const profile={cleared:Object.fromEntries([1,2,3,4,5].map(id=>[id,true])),recruited:['archer','mage','knight'],seen:{}};
assert.equal(J.next(profile).stageId,6);
const before=J.optional(profile,J.next(profile).stageId,'knight'),beforeText=before.map(l=>l[1]).join(' ');
assert.equal(before.length,3);assert(before.every(l=>l[2].storyId==='rest-optional-v1-6-knight'));
assert.match(beforeText,/다리 아래 운반대를 기다리고/);assert.match(beforeText,/내려가서 다친 분들 상태부터 살피죠/);
assert.doesNotMatch(beforeText,/아이|손을 흔들|마지막 수레|운반대가 쉼터에 닿|운반대를 끝까지 함께 끌고 오니/);
profile.cleared[6]=true;assert.equal(J.next(profile).stageId,7);
const after=J.optional(profile,J.next(profile).stageId,'knight');
assert(after.every(l=>l[2].storyId==='rest-optional-v1-7-knight'));
assert.match(after.map(l=>l[1]).join(' '),/운반대를 끝까지 함께 끌고 오니/);
assert.match(H.stages[5].outro[0][1],/운반대가 쉼터에 닿았소/);
const legacy=JSON.parse(await readFile('shared/data/narrative-legacy-v0.json','utf8'));
assert.match(legacy.content[4].outro.map(l=>l[1]).join(' '),/앞서 맡은 부상자들은 쉼터에 보냈소\. 돌아오는 길의 붉은 실/);
assert.match(await readFile('shared/runtime/story-content-v0.js','utf8'),/앞서 맡은 부상자들은 쉼터에 보냈소\. 돌아오는 길의 붉은 실/);
console.log('PASS chapter 5 present witness, chapter 6 pre-rescue / chapter 7 post-rescue rest chronology, stable optional scene IDs and unchanged frozen dialogue');

assert.doesNotMatch(JSON.stringify(J.interlude(7)),/몸을 웅크리고|고개를 저었다/);
assert.match(JSON.stringify(J.interlude(7)),/상태부터 살피겠습니다/);
console.log('PASS chapter 7 rest and entry describe the same visible bindings without an unauthored crouch.');
