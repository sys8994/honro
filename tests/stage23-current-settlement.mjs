/** Exact native R33 Continue/arrival/settlement check; no browser claim. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from '../tools/act2-qa/stage17-gate-app-harness.mjs';
import {createPlayerOperations} from '../tools/act2-qa/stage17-gate-player-operations.mjs';
const path=process.env.HONRO23_CHECKPOINT;assert(path,'Exact completed native run checkpoint path required');
const bytes=await readFile(path),input=JSON.parse(bytes);assert.equal(input.provenance.sourceTarget,'5a0e8e2dda9a606e02f1c1e72e5222ac10948f64');assert.equal(input.provenance.resume,null);assert(input.provenance.entryFixture.startsWith('Pre-entry first-clear/recruit reward-ledger fixture through22;'));
const h=await appHarness({productionStory:true,productionInputActions:true}),{g,C}=h;vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);g.performance={now:()=>0};
let app=h.load(input.profile);app.continue();let b=app.engine.b;assert.deepEqual(plain(b),input.profile.honroBattle,'Whole battle Continue is exact before any frame');
const log=[],ops=createPlayerOperations({app,g,C,record:x=>log.push(x)});assert.equal(b.round,33);assert.equal(b.honroStage,23);assert.equal(g.HonroJourneyContent.transitionAfter(23),'rest');
for(let n=0;n<16000&&!['won','lost'].includes(b.phase);n++){if(app.canInput()&&app.engine.active?.id==='p-archer'&&app.engine.active.x<9245)ops.move(1,C.STEP);ops.frame();}
assert.equal(b.phase,'won');assert.equal(b.round,33);assert(app.profile.cleared[23]);assert(!app.profile.cleared[24]);
const checkpoint={round:b.round,phase:b.phase,npc:plain(app.engine.unit('act3-carrier')),done:plain(g.HonroAct23V4.mem(b).done)};
const reward=p=>plain({cleared:p.cleared[23],heroes:p.heroes,equipment:p.equipment,honroGrowth:p.honroGrowth});const earned=reward(app.profile);app.resultContinue();for(let n=0;n<3000&&app.dialogue;n++)ops.frame();assert.equal(app.screen,'rest');assert.equal(app.engine,null,'No Stage24 battle was launched');assert.deepEqual(reward(app.profile),earned,'Rest did not grant another reward');
app.export();const afterRest=await h.exported();assert.deepEqual(reward(afterRest),earned);app=h.load(afterRest);app.continue();assert.equal(app.screen,'rest');assert.equal(app.engine,null);assert.deepEqual(reward(app.profile),earned,'Reload/Continue did not duplicate settlement');assert.equal(app.profile.cleared[23].visits,1);
const result={passed:true,scope:'Native actual App actions, exact natural R33 checkpoint then arrival/settlement/rest/reload. Prior1–22 is a synthetic reward-ledger fixture. Not browser or fun approval. No Stage24 combat.',checkpointSha256:createHash('sha256').update(bytes).digest('hex'),checkpoint,clear:earned.cleared,restScreen:app.screen,engineNull:app.engine===null,frames:ops.frames,operations:log};if(process.env.HONRO_QA_OUT)await writeFile(process.env.HONRO_QA_OUT,JSON.stringify(result,null,2));console.log(JSON.stringify({...result,checkpoint:{round:checkpoint.round,phase:checkpoint.phase,npcHp:checkpoint.npc.hp,npcX:checkpoint.npc.x,done:checkpoint.done},operations:log.length}));
