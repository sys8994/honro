import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime(),checks=[];
function test(name,fn){try{fn();checks.push({name,pass:true});console.log('PASS',name);}catch(e){checks.push({name,pass:false,error:String(e)});console.error('FAIL',name,e);}}
g.document={getElementById:()=>null};
vm.runInContext(await readFile('shared/runtime/story.js','utf8'),g);
const plain=x=>JSON.parse(JSON.stringify(x));
test('Campaign chronology preserves recruits and excludes later-act revelations',()=>{
 const stages=g.HONRO_CONTENT.stages;
 assert.equal(stages[1].recruit,'mage');assert.equal(stages[4].recruit,'knight');
 assert(!stages.some(s=>s.recruit==='occultist'));
 for(let id=1;id<=10;id++)assert.deepEqual(plain(g.HonroStageRules.stageParty(id)),id<3?['archer']:id<6?['archer','mage']:['archer','mage','knight']);
 const text=JSON.stringify(g.HonroStoryContent);
 assert(!/백기곡|대천도|무명사|백기장/.test(text));
 for(const st of stages)assert(st.narration.length&&st.story.length&&st.outro.length&&st.storySummary);
 assert(stages[1].outro.length>=18&&stages[8].outro.length>=8&&stages[9].outro.length>=15);
});
test('Early-act clues distinguish past travelers from recent possession reports',()=>{
 const text=id=>JSON.stringify(g.HONRO_CONTENT.stages[id-1]);
 for(const term of ['고향','홍만','들림','행렬'])assert(text(1).includes(term),term);
 for(const term of ['세상을 떠났다','장부','담허'])assert(g.HonroStoryContent.summaries[2].includes(term),term);
 const {app}=battlefield(g,3),lines=g.HonroStoryContent.interaction(app,{action:'ledger'}),docs=lines.filter(l=>l[2]?.kind==='document');
 assert.equal(docs.length,2);assert.match(docs[0][1],/열셋.*아이 둘/);assert.match(docs[0][1],/연목 북문/);assert.match(docs[1][1],/붉은 실.*조용/);assert.match(docs[1][1],/바깥/);
 assert.match(text(8),/홍만 어르신은 장례 때 제대로 떠났/);
});
test('Canonical event mechanics remain authored; custom event dialogue is never replaced',()=>{
 for(let id=1;id<=10;id++){const {app,b}=battlefield(g,id);const before=JSON.stringify(b.honroEvents);for(const ev of b.honroEvents){const lines=g.HonroStoryContent.eventLines(app,ev);assert(Array.isArray(lines));if(g.HonroStoryContent.events[id]?.[ev.id])assert(!lines[0][2].storyTitle.includes(ev.id));}assert.equal(JSON.stringify(b.honroEvents),before);}
 const {app,b}=battlefield(g,1);b.honroCustom=true;const ev={id:'cart',lines:[['작가','직접 만든 이야기']]};assert.deepEqual(plain(g.HonroStoryContent.eventLines(app,ev)),ev.lines);
});
test('Field event queue retains immediate dialogue semantics across save data',()=>{
 const {app,b}=battlefield(g,1);Object.assign(app,{screen:'battle',dialogue:{lines:[]},canSpeak:()=>true,speakerUnits:()=>[],persist(){}});
 for(const id of ['witness','cart'])g.HonroStory.queue(app,g.HonroStoryContent.eventLines(app,{id}));
 assert.equal(b.honroState.storyQueue.length,11);assert(b.honroState.storyQueue.every(l=>l[2].delivery==='dialogue'&&!l[2].waitForClear));
 const saved=plain(b);assert.equal(saved.honroState.storyQueue.length,11);assert(!saved.honroState.storyBanter?.length);
});
test('Hostile Sodan can speak, a fallen ally cannot, and documents need no actor',()=>{
 const {app,b,e}=battlefield(g,10);Object.assign(app,{screen:'battle',canSpeak:()=>false,speakerUnits:()=>[]});
 assert(g.HonroStory.allowed(app,'소단'));assert(g.HonroStory.allowed(app,'기록'));assert(!g.HonroStory.allowed(app,'담허'));
 e.unit('boss').dead=true;assert(!g.HonroStory.allowed(app,'소단'));
});
test('An exit reached before the turn boundary still delivers a triggered witness once',()=>{
 const {app,b}=battlefield(g,1);b.phase='won';b.honroState.pendingEvents=['witness','cart'];const before=b.units.length;
 g.HonroEncounters.finishNarrative(app);assert.equal(app.speeches.length,10);assert(b.honroState.flags['event:witness']);assert.equal(b.units.length,before);assert.deepEqual(plain(b.honroState.pendingEvents),['cart']);
 g.HonroEncounters.finishNarrative(app);assert.equal(app.speeches.length,10);
});
test('A blocked external wave cannot commit cooperation or partially duplicate spawns',()=>{
 const {app,b,e}=battlefield(g,10),boss=e.unit('boss');b.phase='transition';app.actorBoundary=b.active;b.projectiles=[];e.settleBusy=()=>false;b.honroState.receivers=2;boss.hp=boss.maxHp*.4;
 const original=g.HonroAllies.execute,units=JSON.stringify(b.units);g.HonroAllies.execute=()=>false;
 try{g.HonroMission.tick(app,0);g.HonroMission.tick(app,0);assert(!b.honroState.sodanCoop);assert.equal(boss.side,1);assert.equal(JSON.stringify(b.units),units);assert.equal(app.speeches.length,0);}finally{g.HonroAllies.execute=original;}
});
test('Visible new enemies precede cooperation; resume and repeat never spawn the wave twice',()=>{
 const {app,b,e}=battlefield(g,10),boss=e.unit('boss');b.phase='transition';app.actorBoundary=b.active;b.projectiles=[];e.settleBusy=()=>false;b.honroState.receivers=2;boss.hp=boss.maxHp*.4;
 g.HonroMission.tick(app,0);assert(b.honroState.sodanCoop);assert.equal(boss.side,2);assert.equal(b.honroState.sodanBreach.units.length,8);
 const newUnits=b.honroState.sodanBreach.units.map(id=>e.unit(id));assert(newUnits.every(u=>u.side===1&&!u.dead));assert(newUnits.filter(u=>u.x>b.width*.5).length>=3);
 assert(app.speeches.some(l=>l[0]==='소단'));assert(app.speeches.some(l=>l[1].includes('바깥에서 들어오는')));
 const count=b.units.length;g.HonroMission.tick(app,0);assert.equal(b.units.length,count);
 const saved=plain(b),restored={...app,engine:new g.HONRO_CORE.Engine(saved)};restored.engine.settleBusy=()=>false;g.HonroMission.tick(restored,0);assert.equal(saved.units.length,count);assert(saved.honroState.sodanCoop);
});
await mkdir('_local/reports/story-rewrite',{recursive:true});await writeFile('_local/reports/story-rewrite/unit.json',JSON.stringify({checks},null,2)+'\n');if(checks.some(c=>!c.pass))process.exitCode=1;
