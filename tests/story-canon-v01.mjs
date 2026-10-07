import {beforeGraniteVisuals} from './granite-delta-helpers.mjs';
import {beforePlatformPassages} from './platform-passage-delta-helpers.mjs';
import {beforeObjectiveRevision} from './objective-delta-helpers.mjs';
import {act12Project,act12Balance} from './campaign-scope-helpers.mjs';
import assert from 'node:assert/strict';
import {beforeExistenceRoster} from './existence-delta-helpers.mjs';
import {readFile} from 'node:fs/promises';
import {content,plain,hash,gameplay,mapRules} from './story-canon-contract-helpers.mjs';
const g=await content(),H=g.HONRO_CONTENT,J=g.HonroJourneyContent;
const frozen=JSON.parse(await readFile('tests/fixtures/story-canon-v01-baseline.json','utf8'));
const project=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
const text=id=>JSON.stringify(H.stages[id-1]),lineText=lines=>JSON.stringify(lines);
let checks=0;const check=(name,fn)=>{fn();checks++;console.log('PASS',name);};
check('20 chapters retain every non-prose rule, stable scene/event IDs and rest page count',()=>{
 assert.equal(H.stages.length,20);
 for(const before of frozen.gameplay){const s=H.stages[before.id-1];assert.equal(hash(gameplay(s,frozen.proseFields)),before.hash,'gameplay '+s.id);assert.deepEqual([...new Set([...s.story,...s.outro].map(l=>l[2]?.storyId).filter(Boolean))],before.sceneIds,'scene IDs '+s.id);assert.deepEqual(Object.keys(s.beats||{}),before.beatKeys,'event keys '+s.id);}
 for(const before of frozen.rest){const lines=J.interlude(before.id);assert.equal(lines.length,before.lines);assert(lines.every(l=>l[2].storyId===before.storyId&&!l[2].optional));}
});
check('Acts 1–2 story contracts retain all rules beyond the exact reviewed existence delta',()=>{
 assert.equal(hash(mapRules(act12Project(beforeGraniteVisuals(beforePlatformPassages(beforeExistenceRoster(beforeObjectiveRevision(project,{stages:[]}).project)))))),frozen.mapRules);
 assert.equal(hash(plain(act12Balance(g.HONRO_BALANCE))),frozen.balance);
});
check('Act 1 keeps future identities and the hidden temple out of player knowledge',()=>{
 assert.doesNotMatch(JSON.stringify(g.HonroStoryContent),/백기곡|저문골|무명사|잠운사|대도사|현묵|유골|묵종/);
 assert.match(JSON.stringify(g.HonroStoryContent.events[1]),/내가 아는 절은 없소/);
 assert.doesNotMatch(text(5),/산 위의 절 종/);
});
check('Early mountain stages establish unknown approach, return loop and first stone-gate discovery',()=>{
 assert.match(text(11),/옛 지도에도 길이 없/);assert.match(text(11),/장부는 북문 뒤부터 비어/);
 for(const term of ['갈라진 바위','마른 소나무','돌탑','길을 잃은 게 아니다','길을 틀어놓은 거야','같은 뿌리'])assert(text(12).includes(term),term);
 assert.equal(H.stages[11].name,'돌아오는 산길');assert.equal(H.stages[12].name,'숨은 석문');
 assert.match(lineText(H.stages[11].beats.sign),/한 축/);assert.match(text(13),/하늘빛/);assert.match(text(13),/산 밖으로 함부로 길을 내지 말/);
 assert.doesNotMatch(text(12),/동굴마을로 향하는 길표|동굴마을이라는 글자/);
});
check('Middle stages distinguish old transport from recent murder and remove the former funerary-bell claim',()=>{
 assert.match(text(14),/절보다 종이 먼저/);assert.match(text(14),/왜 그 종이 여기 있는지는 우리도 몰라/);
 for(const term of ['수직공','고정구','오래된','최근','같은 때의 일은 아니오'])assert(text(15).includes(term),term);
 for(const term of ['칠십 년','대종 일 좌','외부에서 이송','절대 타종 금지','상부 인양로 폐쇄','산길의 진','같은 뿌리'])assert(text(16).includes(term),term);
 for(const s of H.stages.slice(10))assert.doesNotMatch(JSON.stringify(s),/천도 뒤에는|천도를 마친 뒤에는|본래 천도의|가두기 위한 종은 아니었/);
 assert.match(text(17),/석공·주민·젊은 승려/);assert.match(text(18),/까닭은 남아 있지 않았/);
});
check('Old souls and place names first appear in the final discovery and lead to records without resolving the cause',()=>{
 for(const s of H.stages.slice(10,18))assert.doesNotMatch(JSON.stringify(s),/저문골|무명사|無名寺|왕실 봉인/);
 const discovery=lineText(H.stages[18].beats['old-soul']);for(const term of ['오래','無名寺','무명사','저문골','왕실 봉인'])assert(discovery.includes(term),term);
 assert.doesNotMatch(discovery,/갑옷|깃대|유골|반란|학살|대도사/);
 for(const term of ['스스로 울린 까닭은 아직 모르','운송과 봉쇄 장부','큰 읍성의 옛 문서고'])assert(text(20).includes(term),term);
 assert.equal(H.nextAct.name,'지워진 기록');assert.equal(H.nextAct.available,false);
 for(const s of H.stages.slice(10))assert.doesNotMatch(JSON.stringify(s),/백기곡|현묵|저승에서도 들리는 종|유골과 재|왕실 대도사/);
});
check('Required rest sources and authored marker labels follow current canon without optional spoilers',()=>{
 for(const s of H.stages){assert.deepEqual(plain(J.interludeSources[s.id]),plain(s.narration));assert(s.story.length<=7,'entry plus guide remains at most 8');}
 for(const s of H.stages.slice(10)){const m=project.stages[s.id-1];assert.equal(m.name,s.name);assert.equal(m.design.title,s.name);assert.equal(m.design.description,s.goal);for(const step of s.steps){const marker=m.markers.find(m=>m.id===step.id);if(marker)assert.equal(marker.label,step.label);}}
 const p={cleared:Object.fromEntries(Array.from({length:20},(_,i)=>[i+1,true])),recruited:['archer','mage','knight','occultist'],seen:{}};
 for(let id=1;id<=19;id++)for(const cls of p.recruited)assert.doesNotMatch(lineText(J.optional(p,id,cls)),/저문골|무명사|현묵|대도사/);
 assert.match(lineText(J.optional(p,20,'knight')),/무명사/);
});
console.log(`PASS ${checks} story canon contracts; pure data checks, not rendered or normal-combat proof`);
