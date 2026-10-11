import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const g=vm.createContext({HONRO_CORE:{SKILLS:{}},console});
for(const name of ['content','story-content','story-staging','story-direction','objective-guidance'])vm.runInContext(await readFile(`shared/runtime/${name}.js`,'utf8'),g);
const S=g.HonroStoryContent,H=g.HONRO_CONTENT,checks=[];
const test=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
test('Ledger is one two-line card plus a single recognition, without rereading its facts',()=>{
 const lines=S.interaction({stage:{id:3},engine:{b:{honroState:{}}}},{action:'ledger'}),docs=lines.filter(l=>l[2]?.kind==='document');
 assert.equal(lines.length,2);assert.equal(docs.length,1);assert.equal(docs[0][1].split('\n').length,2);assert.match(docs[0][1],/열셋.*아이 둘/);assert.match(docs[0][1],/주막.*북문/);
 assert(!JSON.stringify(H.stages[2].outro).includes('열셋'));assert(!JSON.stringify(H.stages[2].outro).includes('최근 기록'));
});
test('Act 1 does not invent prior terminology, visible eyes or unseen lower procession',()=>{
 const t=JSON.stringify(S);for(const old of ['이름만 듣고는','저 발자국','저 새들도 눈','아래 상여가 멈췄다','들림이란 게 정확히','매듭에 사람이 갇힌 것만 보고','그때 함께 길을 정합시다'])assert(!t.includes(old),old);
 assert.match(H.stages[0].outro[0][1],/나무꾼 말로는/);assert.match(H.stages[2].storyFollowups[1][1][1],/받이진이라/);
});
test('Hongman is disclosed at Yeonsil’s reveal and Sodan chooses before defense',()=>{
 const reveal=H.stages[1].outro.find(l=>l[0]==='연실'&&l[1].startsWith('홍만이에요'));
 assert.equal(reveal[2].revealName.name,'홍만의 상여');
 const pre=S.cooperation(),post=S.cooperationDefense();assert(pre.at(-1)[1].includes('놓을게요'));assert(!JSON.stringify(pre).includes('동쪽 전각'));assert(JSON.stringify(post).includes('지금 건 당신이 놓친 게 아닙니다'));
 assert(JSON.stringify(H.stages[9].outro).includes('같이 가죠. 남은 매듭부터 함께 정리하고요.'));
});
test('Every first-act authored direction still matches an active line',()=>{
 for(const r of g.HonroStoryDirection.rules.filter(r=>r.stage<=10)){
  const st=H.stages[r.stage-1];let lines=r.when==='entry'?st.story:r.when==='outcome'?st.outro:r.when==='event-1-witness'?S.events[1].witness.lines:r.when==='sodan-first-receiver'?g.HonroStoryStaging.describe(g.HonroStoryStaging.ID).steps.at(-1).lines:r.when==='cooperation'?S.cooperation():r.when==='cooperation-defense'?S.cooperationDefense():r.when==='finale-midpoint'?S.finaleMidpoint():r.when==='event-3-transfer'?S.events[3].transfer.lines:r.when==='ritual-5'?S.interaction({stage:{id:5},engine:{b:{honroState:{flags:{}}}}},{action:'ritual'}):[];
  assert(lines.some(l=>l[0]===r.who&&l[1].includes(r.text)),`${r.stage}/${r.when}/${r.who}/${r.text}`);
 }
 assert(g.HonroStoryDirection.rules.find(r=>r.stage===3&&r.text==='눈을 끄는').actions[0].at.actor==='midboss-stage3');
});
console.log(`${checks.length} source contracts passed; browser framing and integrated engine behavior are separate checks.`);
