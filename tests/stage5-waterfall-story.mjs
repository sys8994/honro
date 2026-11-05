/** Narrative/UI contracts on production runtime, with explicit revision fixtures. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const {g,load,profileThrough,finish}=await appHarness();
if(!g.HonroStage5Waterfall)vm.runInContext(await readFile('shared/runtime/stage5-waterfall.js','utf8'),g);
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const W=g.HonroStage5Waterfall,checks=[],st=g.HONRO_CONTENT.stages[4],oldText='담허의 받이진 · 고리쇠 · 의식 시작';
assert.equal(W.textFor({honroStage:5},oldText),oldText);assert.equal(W.textFor({honroStage:5,honroStage5WaterfallRevision:1,honroCustom:true},oldText),oldText);assert.equal(W.textFor({honroStage:6,honroStage5WaterfallRevision:1},oldText),oldText);
let app=load(profileThrough(4));app.launch(5);finish(app);const b=app.engine.b,snapshot=plain(b.honroNarrativeContent),saved=plain(b);
assert.deepEqual(plain(g.HonroObjectiveRevision.contentFor(b,st)),snapshot);assert.deepEqual(plain(b),saved);checks.push('legacy and custom snapshots remain authoritative and unmodified');
b.honroStage5WaterfallRevision=1;delete b.honroNarrativeContent;g.HonroNarrativeRevision.prepareFresh(b);app.stage=g.HonroObjectiveRevision.contentFor(b,st);
const fresh=plain(app.stage);assert(fresh.story.length<=7);assert.doesNotMatch(JSON.stringify(fresh.story),/받이진|수혼|고리쇠|휘겸/);for(const word of ['주박목','물길','낙수','진을 벗어나면'])assert(JSON.stringify(fresh).includes(word),word);// The approved 2026-10-23 edit moved Hwigyeom's route information into
// outro[3]; the journal summary names the injured transport party instead.
const approved=JSON.parse(await readFile('game/docs/story/user-script-20261023/approved-patch.json','utf8'));
for(const [path,actual] of [['/stages/5/storySummary',fresh.storySummary],['/stages/5/outro/3/1',fresh.outro[3][1]]]){
 const operation=approved.operations.find(row=>row.path===path);assert(operation,'approved source exists: '+path);assert.equal(actual,operation.after,'current delivery matches approved source: '+path);
}
assert(fresh.outro.every(l=>l[0]!=='휘겸'));
const stable=plain(b.honroNarrativeContent);assert.deepEqual(plain(g.HonroObjectiveRevision.contentFor(b,st)),stable);assert.deepEqual(plain(b.honroNarrativeContent),stable);checks.push('new revision snapshots explain talisman, real water obstruction and held casting without Hwigyeom');
let guide=g.HonroObjectives.help(app);assert.doesNotMatch(JSON.stringify(guide),/받이진|수혼|고리쇠/);for(const word of ['기세를 잃고','화살을 쓸어 내','벗어나면','주박목'])assert(guide.guide.includes(word));
const marker=b.honroMarkers.find(m=>m.action==='ritual'),mage=b.units.find(u=>u.side===0&&u.cls==='mage');b.active=mage.id;mage.x=marker.x;mage.y=marker.y;app.engine.grounded=()=>true;app.canInput=()=>true;
assert.match(g.HonroInteractions.eligibility(app,marker).reason,/물길 비틀기/);b.honroState.ritual={active:true,holderId:mage.id};assert.match(g.HonroInteractions.eligibility(app,marker).reason,/물길 비트는 중/);mage.hp=0;mage.dead=true;assert.match(g.HonroObjectives.failure(b,app.stage),/낙수를 비틀 수 없다/);checks.push('help, HUD, interaction reasons and failure use only current waterway language');
// Current reinforcement composition is hounds + ghosts, not the retired deer wave.
// Keep the approved intent/conditional delivery and generalize only the animal noun.
const response=b.honroEvents.find(event=>event.id==='lower-beasts');assert.deepEqual(plain(response.action.actions.map(a=>[a.kind,a.n])),[['hound',2],['ghost',2]],'current response composition explains the generalized animal noun');
const event={id:'lower-beasts'};b.honroState.ritual.active=false;let lines=g.HonroStoryContent.eventLines(app,event);assert.equal(lines[0][1],approved.operations.find(row=>row.path==='/scenes/5.lower-beasts.intactNotHolding/0/1').after.replaceAll('사슴','짐승'));b.honroState.ritual.active=true;lines=g.HonroStoryContent.eventLines(app,event);assert.equal(lines[0][1],approved.operations.find(row=>row.path==='/scenes/5.lower-beasts.intactHolding/0/1').after.replaceAll('사슴','짐승'));g.HonroQuestTargets.records(b).find(t=>t.id==='cliff-cleat').broken=true;lines=g.HonroStoryContent.eventLines(app,event);assert.equal(lines[0][1],approved.operations.find(row=>row.path==='/scenes/5.lower-beasts.broken/0/1').after.replaceAll('사슴','짐승'));assert.doesNotMatch(JSON.stringify(lines),/물살을 붙드는 동안|다가가기 전에/);assert.doesNotMatch(JSON.stringify(g.HonroStoryContent.eventLines(app,{id:'bell'})),/고리/);checks.push('delayed beast and bell scenes describe current progress, not already completed actions');
for(const id of [6,8,9,10])assert.doesNotMatch(JSON.stringify(g.HONRO_CONTENT.stages[id-1]),/폭포 고리|고리를 끊었을 때|고리를 끊은 일/);checks.push('later fresh chapters do not refer to the retired iron-ring plot');
await report('stage5-waterfall-story',checks,{limits:['Revision flag is explicit test fixture; geometry and arrow collision belong to waterfall physics tests.','No browser rendering or normal-play evidence.']});console.log('PASS',checks.length,'waterfall narrative contracts');
