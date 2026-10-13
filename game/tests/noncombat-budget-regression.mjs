import assert from 'node:assert/strict';
import {runtime,battlefield} from './helpers.mjs';
import {auditEncounterBudget} from './noncombat-budget-contract.mjs';
const plain=v=>JSON.parse(JSON.stringify(v)),g=await runtime();
for(let id=1;id<=30;id++){const{b,st}=battlefield(g,id),row=auditEncounterBudget(g,st,b);if(id===19){assert.equal(row.combatApplicability,'not-applicable');assert.deepEqual(row.noncombatContract,{stage:19,canonicalExact:true,enemies:0,reinforcements:0,interactions:8});}else assert.deepEqual(row,plain(g.HonroDifficulty.audit(st,b)),'Combat acceptance/output unchanged '+id);}
const{b,st}=battlefield(g,19),base=plain(b),stage=plain(st);let negatives=0;
for(const mutate of [x=>x.honroQuietFuneral=false,x=>x.honroStage=18,x=>x.honroCustom=true,x=>x.honroMapOrigin='workshop',x=>x.units.push({...x.units[0],id:'injected-enemy',side:1}),x=>x.units.push({...x.units[0],id:'dead-enemy',side:1,dead:true}),x=>x.honroEvents.push({id:'injected-wave',action:{type:'spawn',n:1}}),x=>x.honroAuthoredEvents.push({id:'later-combat',action:{type:'spawn',n:1}})]){const q=plain(base);mutate(q);assert.throws(()=>auditEncounterBudget(g,stage,q));negatives++;}
for(const mutate of [s=>s.steps[0].kind='clear',s=>s.steps[1].wave={count:1},s=>s.steps.reverse(),s=>s.steps.push({id:'fight',kind:'clear'})]){const q=plain(stage);mutate(q);assert.throws(()=>auditEncounterBudget(g,q,base));negatives++;}
const plan=g.HonroAct2Plan.forStage(19);for(const key of ['initial','waveCount','bossWave','progressWave']){const old=plan[key];plan[key]=key.endsWith('Wave')?{count:1}:1;try{assert.throws(()=>auditEncounterBudget(g,stage,base));negatives++;}finally{if(old===undefined)delete plan[key];else plan[key]=old;}}
const old=g.HONRO_PROJECT.stages[18].units[0].hp;g.HONRO_PROJECT.stages[18].units[0].hp=old+1;try{assert.throws(()=>auditEncounterBudget(g,stage,base));negatives++;}finally{g.HONRO_PROJECT.stages[18].units[0].hp=old;}
const other=battlefield(g,1);other.b.honroQuietFuneral=true;assert.throws(()=>auditEncounterBudget(g,other.st,other.b));negatives++;
console.log('PASS exact canonical19 noncombat contract;29 combat audit outputs unchanged;'+negatives+' enemy/wave/goal/tag/source negatives');
