import assert from 'node:assert/strict';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),g=h.g,A=g.HonroAct3,R=g.HonroObjectiveRevision,checks=[];
function party(id,roster){const p=h.profileThrough(id-1),app=h.load(p);app.launch(id);h.finish(app);const b=app.engine.b;
 // Before split-campaign is integrated, this declared two-person fixture tests
 // the actual App speaker filter. After integration the real launch must match.
 if(g.HonroSplitCampaign)assert.deepEqual(A.heroes(b).map(u=>u.cls).sort(),[...roster].sort());
 else b.units=b.units.filter(u=>u.side!==0||roster.includes(u.cls));
 if([25,26].includes(id)){assert.equal(app.stage.active,g.HONRO_BALANCE.stages[id-1].activeEnemies||3);if(g.HonroSplitCampaign)assert.equal(b.honroActiveLimit,2);}
 return{app,b,st:app.stage};}
function visible(app,lines){return lines.filter(l=>g.HonroStory.allowed(app,l[0]));}
function text(lines){return lines.map(l=>l[1]).join(' ');}
const a=party(25,['knight','mage']),aFacts=a.st.beats['investigation-record'];
assert.equal(visible(a.app,aFacts).length,aFacts.length);const aText=text(visible(a.app,aFacts));for(const fact of ['주민 전원을 죽였','무명사','대종을 주조'])assert(aText.includes(fact));checks.push('A25 actual speaker filter preserves massacre testimony and post-event casting record');
const b=party(26,['archer','occultist']),bFacts=b.st.beats['casting-tally'];
assert.equal(visible(b.app,bFacts).length,bFacts.length);const bText=text(visible(b.app,bFacts));for(const fact of ['금속량','주조량이 거의','유골과 재','장례','이 조각에 없'])assert(bText.includes(fact));assert(!/대도사|주민 전원|무명사에서|선조의 조사/.test(bText));assert(bFacts.every(l=>['설오','소단'].includes(l[0])));checks.push('B26 reads its own quantities and missing process without knowing A25 findings');
const reunion=g.HONRO_CONTENT.stages[26].beats['party-reunion'];assert(text(reunion).includes('선조의 조사 기록'));assert(text(reunion).includes('무명사에서'));assert(text(reunion).includes('공방의 주조량'));checks.push('A and B first exchange their separate findings at the central reunion');
for(const id of [24,25,26]){const st=g.HONRO_CONTENT.stages[id-1],legacy=R.contentFor({honroStage:id},st);assert.notDeepEqual(plain(id===24?legacy.outro:legacy.beats[id===25?'investigation-record':'casting-tally']),plain(id===24?st.outro:st.beats[id===25?'investigation-record':'casting-tally']));if(id===25)assert(legacy.beats['investigation-record'].some(l=>l[0]==='설오'));if(id===26)assert(legacy.beats['casting-tally'].some(l=>l[0]==='휘겸'));}checks.push('Historical four-person dialogue remains separate from the split rewrite');
const q=party(27,['archer','mage','knight','occultist']);q.b.honroSplit={version:1,activeRoster:['archer','mage','knight','occultist']};const original=g.HonroStoryStaging,defs=new Map(),requests=[];
g.HonroStoryStaging={register(d){defs.set(d.id,d);},request(app,id){app.engine.b.honroStaging??={once:{}};app.engine.b.honroStaging.once[id]='queued';requests.push(id);return true;}};
g.HonroSplitCampaign??={allPresent:b=>b.honroSplit.activeRoster.every(cls=>A.heroes(b).some(u=>u.cls===cls))};
const m=A.marker(q.b,'party-reunion'),memory=A.memory(q.b);memory.done['water-release']=memory.done['fire-screen']=true;for(const u of A.heroes(q.b))Object.assign(u,{x:m.x,y:m.y});A.tick(q.app,0);A.tick(q.app,0);assert.deepEqual(requests,['act3-party-reunion-v1']);assert(memory.done['party-reunion']);const descriptor=defs.get(requests[0]);assert.equal(descriptor.steps[0].at.marker,'party-reunion');assert.deepEqual(plain(descriptor.steps.at(-1).lines),plain(reunion));
const saved=plain(q.b);A.initialize(saved);assert(defs.has(requests[0]));assert.equal(saved.honroStaging.once[requests[0]],'queued');assert(R.stageScene({engine:{b:saved}}, {id:'party-reunion'}));assert.equal(requests.length,1);g.HonroStoryStaging=original;checks.push('Exactly-once reunion look/dialogue is registered again after load without duplicate queueing');
const p=h.profileThrough(24);let app=h.load(p);app.stageId=25;app.stage=g.HONRO_CONTENT.stages[24];const battle=g.HonroWorld.build(app.stage,p,false,'archer','A01');battle.honroActiveLimit=3;app.mount(battle);assert.equal(app.engine.b.honroActiveLimit,3);assert.equal(app.engine.b.enemyLimit,3);checks.push('Mount respects the saved enemy action limit rather than overwriting it from new balance');
await report('objective-split-story',checks,{scope:'Real App speaker filtering and declared party/scene fixtures. Not a normal-input map run.'});console.log('PASS',checks.length,'split story/objective boundary checks');
