// Authored prose and production App dialogue/save contracts. DOM and Canvas are
// doubles; this is not browser rendering or a normal campaign playthrough.
import assert from 'node:assert/strict';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,load,reload,profileThrough,click,finish,nodes}=h,J=g.HonroJourneyContent,H=g.HONRO_CONTENT,checks=[];
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
const pageCounts=[2,3,3,2,3,3,3,2,3,3,3,3,3,4,3,3,3,3,3,3,...Array(10).fill(1)];
pageCounts[23]=2;
const details=[
 ['사라진 고향 사람','연목','몇 해 전','배에','뱃사공','홍만'],
 ['연목 나루','분지','장례 행렬','관을 메고','운반틀','상여','혼','짐승','바위턱','활'],
 ['홍만','돌아가셨','딸 연실','장부','담허','나루','빈 움막','검객','손'],
 ['장부','고향 사람','연목 주막','북문','피란민','좁은 문'],
 ['붉은 실','집 쪽','폭포 뒤','쇠고리','땅','혼','받이진','고리','주민'],
 ['피란민','쉼터','부상자 운반대','나무다리 아래','셋'],
 ['북문','주거지','세 분','붉은 실','웅크리','고개'],
 ['홍만','장사','창고','빈 상여','빈 관','결박','안에서'],
 ['소단','구조한 주민','지켜 준','아랫마당','담장','방울','이어졌','사당 문간','붉은 실'],
 ['윗마당','붉은 끈','발밑','주박','소단','방울','손'],
 ['연목','문을 열지','소단','손목','동쪽 고개','북쪽 돌산','줄 끝','바람'],
 ['갈라진 바위','마른 소나무','세 번째','돌탑','수레','발자국','같은 자리'],
 ['돌림진','석문','하늘빛','누구도','승강기','어르신','피 묻은 밧줄','곡괭이','벽'],
 ['벼랑','층층','저녁상','아이의 옷','등잔 기름','기다린','아래층','같은 이름'],
 ['나뭇조각','수면','밀려갔다','돌아옵','역류','물속 발판','손잡이','밧줄','끊어졌'],
 ['법당','향','재를','노승','제자','손바닥','이름 세 글자','다른 사람의 이름'],
 ['작업굴','삭은 밧줄','새로 잘린','축','녹','기름칠','벽 틈','다시 끼워 쓰지 못'],
 ['둥근 청동 벽','산','밑동','손자국','바깥','사슬','종지기','내려다보지'],
 ['주민','망치','밥그릇','천으로 싼 짚신','빈손','무릎','소단','가장 먼저 불릴 이름'],
 ['종소리','옷 스치는','절뚝이는 발소리','가장 느린','바람','젖은 소매'],
];
check('30 required scenes retain their IDs, paragraph counts and every source narration',()=>{
 assert.equal(H.stages.length,30);
 for(const st of H.stages){const lines=J.interlude(st.id);assert.equal(lines.length,pageCounts[st.id-1],`stage ${st.id} page count`);assert.deepEqual(plain(J.interludeSources[st.id]),plain(st.narration));
  for(const [who,text,meta] of lines){assert(text.trim());assert.equal(meta.storyId,`rest-interlude-v1-${st.id}`);assert.equal(meta.optional,false);if(who==='서술'){assert.equal(meta.kind,'narration');assert.equal(meta.presentation,'inline');}else{assert(['설오','담허','휘겸'].includes(who));assert(!meta.kind);assert.doesNotMatch(text,/설오는|설오가|아무도 몰랐다|활을 들었다/);}}
  if(st.id<=20)for(const detail of details[st.id-1])assert(lines.map(l=>l[1]).join(' ').includes(detail),`${st.id} preserves ${detail}`);
  else {const narration=lines.filter(l=>l[0]==='서술');assert.equal(lines.length,narration.length+(st.id===24?1:0));assert.deepEqual(plain(narration.map(l=>l[1])),plain(st.narration));if(st.id===24)assert.equal(lines.at(-1)[0],'담허');}
 }
});
check('30 first battlefield speeches and rest voices do not describe Seolo in third person',()=>{
 const p=profileThrough(30);
 for(const st of H.stages){const first=st.story.find(l=>l[0]==='설오');if(first)assert.doesNotMatch(first[1],/설오는|설오가/);const optional=J.optional(p,st.id,'archer');if(optional.length)assert.equal(optional[0][0],'설오');for(const [who,text] of optional)if(who==='설오')assert.doesNotMatch(text,/설오는|설오가/);}
 assert.deepEqual(plain(J.interlude(5).map(l=>l[0])),['설오','설오','담허']);assert.equal(J.interlude(6)[0][0],'휘겸');assert.equal(J.interlude(15)[1][0],'담허');
});
check('Cave warning and selected camp exchanges retain in-character, multi-speaker information',()=>{
 const p=profileThrough(30),cave=J.optional(p,13,'mage');assert.deepEqual(plain(cave.map(l=>l[0])),['설오','담허','휘겸','담허']);assert(cave.some(l=>l[1].includes('천뢰호')&&l[1].includes('암벽')));assert(J.optional(p,24,'knight').length>=3);assert(J.optional(p,11,'occultist').length>=3);
 for(const id of [11,13,16,18,19,21,24,25,27,30])for(const cls of p.recruited){const lines=J.optional(p,id,cls);for(const [who,text,meta] of lines){assert(text.trim());assert(['설오','담허','휘겸','소단'].includes(who));assert.equal(meta.optional,true);assert.equal(meta.storyId,`rest-optional-v1-${id}-${cls}`);}}
});
check('Every narration page renders as a record rather than Seolo or an illustrated cutaway',()=>{
 for(const st of H.stages){const app=load(profileThrough(st.id-1));click('rest');if(app.dialogue?.restKind==='map')g.HonroStory.finish(app);for(let i=0;i<app.dialogue.lines.length;i++){app.dialogue.index=i;g.HonroStory.draw(app);const [who,,meta]=app.dialogue.lines[i],html=nodes.get('dialogue-root').innerHTML;assert(!html.includes('narration-overlay'),`stage ${st.id}`);if(meta.kind==='narration'){assert.equal(who,'서술');assert(html.includes('길 위의 기록'));assert(!html.includes('aria-label="설오"'));}else assert(html.includes(`aria-label="${who}"`));}}
});
check('Narration role, text and page resume exactly from a rest save; skip keeps the complete journal',()=>{
 for(const id of [2,9,13,19,21,24,29,30]){let app=load(profileThrough(id-1));click('rest');if(app.dialogue?.restKind==='map')g.HonroStory.finish(app);const index=app.dialogue.lines.findIndex(l=>l[0]==='서술');assert(index>=0);app.dialogue.index=index;g.HonroStory.draw(app);const saved=plain(app.profile.honroJourney.story),lines=plain(app.dialogue.lines);app=reload();click('rest');assert.equal(app.dialogue.index,index);assert.deepEqual(plain(app.dialogue.lines),lines);assert(nodes.get('dialogue-root').innerHTML.includes('길 위의 기록'));const sceneId=app.dialogue.id;finish(app);assert(app.profile.seen[sceneId]);const log=app.profile.honroNarrative.find(x=>x.id===sceneId);assert(log);assert.deepEqual(plain(log.lines),lines);click('journey-enter',{id:String(id)});assert(!app.dialogue.lines.some(l=>lines.some(n=>n[1]===l[1])));}
});
check('Direct transitions and saved old dialogue retain their existing read position and line text',()=>{
 for(const id of [2,10,19]){const app=load(profileThrough(id-1));app.launch(id);assert(app.dialogue.lines.some(l=>l[0]==='서술'&&l[2].presentation==='inline'));for(let i=0;i<app.dialogue.lines.length;i++){if(app.dialogue.lines[i][0]!=='서술')continue;app.dialogue.index=i;g.HonroStory.draw(app);assert(nodes.get('dialogue-root').innerHTML.includes('길 위의 기록'));assert(!nodes.get('dialogue-root').innerHTML.includes('narration-overlay'));}}
 let app=load(profileThrough(1));app.launch(2);finish(app);const legacy=[['설오','이 높은 바위턱에서 활을 들었다.',{storyId:'rest-interlude-v1-2',storyTitle:'상여 위의 높은 길',optional:false}]];g.HonroStory.start(app,legacy,{after:'entry',index:0,title:app.stage.name});const old=plain(app.dialogue);app=reload();click('continue');assert.deepEqual(plain(app.dialogue),old);assert.equal(app.dialogue.index,0);
});
await report('natural-dialogue',checks,{stages:30,pageCounts,limits:['Authored first speech and optional Seolo lines reviewed across all 30 chapters.','Existing battle dialogue snapshots keep original prose; rest saves retain the same scene/page and load current prose.','Narrative fixtures do not prove the first-spirit battle trigger, movement or browser presentation.']});
