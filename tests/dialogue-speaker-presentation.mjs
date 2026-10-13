// Production Story/App with DOM doubles: layout pixels are checked separately.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,nodes}=h,S=g.HonroStory,checks=[];
g.HONRO_STORY_PORTRAITS=JSON.parse(await readFile('game/config/story-portraits.json','utf8'));
g.HonroPortraits.storyActor=(who,actor)=>actor;
const a=h.load(h.profileThrough(20));a.launch(21);h.finish(a);
function display(line,options={}){S.start(a,[line],options);const html=nodes.get('dialogue-root').innerHTML;S.finish(a);return html;}
for(const [name,line] of [['inline rest',['서술','설오는 나루로 내려왔다.',{kind:'narration',presentation:'inline'}]],['legacy narrator',['길 위의 기록','길이 열렸다.']],['explicit narration',['상황','길이 열렸다.',{kind:'narration'}]]]){const html=display(line);assert(html.includes('narration-scene'));assert(!html.includes('story-portrait'));assert(!html.includes('narration-art'));assert(!html.includes('story-seal'));checks.push(name+' has no portrait, empty column or fullscreen art');}
const doc=display(['기록','옛 장부',{kind:'document',documentTitle:'장부'}]);assert(doc.includes('story-document'));assert(!doc.includes('story-portrait'));checks.push('Document remains portrait-free');
const unknown=display(['미등록 인물','인물의 말']);assert(unknown.includes('data-portrait-status="missing"'));assert(unknown.includes('미등록 인물'));assert(!unknown.includes('story-portrait'));checks.push('Missing identity stays named text-only, never another companion');
const hero=display(['설오','인물의 말']);assert(hero.includes('story-portrait-canvas'));checks.push('Registered companion retains the correct portrait');
for(const [kind,label] of [['narration','서술'],['document','기록'],['guide','안내']])assert.equal(S.speakerPresentation(label).kind,kind);
assert.equal(S.speakerPresentation('설오',{kind:'narration'}).kind,'narration');const dead=a.engine.b.units.find(u=>u.side===0);dead.dead=true;dead.hp=0;assert(S.allowed(a,dead.name,{kind:'narration'}));checks.push('Explicit kind takes priority over character name, including a dead named actor');
await report('dialogue-speaker-presentation',checks);console.log(checks.join('\n'));
