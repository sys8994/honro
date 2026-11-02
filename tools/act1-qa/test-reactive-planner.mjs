/** Planner isolation contract, not gameplay completion or browser proof. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness} from '../../tests/app-regression-helpers.mjs';
import {createPlayerOperations} from './player-operations.mjs';
for(const stage of [5,10]){
 const h=await appHarness({productionStory:true,productionInputActions:true}),{g,C}=h;
 const entry=JSON.parse(await readFile(`tools/act1-qa/fixtures/stage${stage}-entry.json`));
 const app=h.load(entry.profile||entry);app.launch(stage);g.HonroApp=app;
 const ops=createPlayerOperations({app,g,C});assert(ops.ready());
 const live=app.engine,before=JSON.stringify(live.b),profile=JSON.stringify(app.profile);
 for(const method of ['predict','shotSeeds'])live[method]=()=>{throw Error(`Planner used live ${method}`);};
 const predict=C.Engine.prototype.predict;let predictions=0;
 C.Engine.prototype.predict=function(...args){assert.notEqual(this,live);this.b.qaPredictionCacheProbe=true;predictions++;return predict.apply(this,args);};
 const plan=vm.runInContext('('+await readFile('tools/act1-qa/browser-reactive-plan.js','utf8')+')',g);
 const result=plan({stage,memory:{},...(stage===5?{preferred:{target:'cliff-cleat'}}:{})});
 assert(result.command);assert(predictions>0,'Exercise actual detached prediction');
 assert.equal(JSON.stringify(live.b),before,'Live battle exact-byte guard');
 assert.equal(JSON.stringify(app.profile),profile,'Live profile exact-byte guard');
 C.Engine.prototype.predict=predict;
 console.log(`PASS Stage${stage}: ${predictions} detached predictions; live battle/profile unchanged`);
}
