/** Real factory/engine contracts using synthetic opt-in tags. Optional args are
 * actual 31/34/39 candidate JSON paths; no mission or visual claim. */
import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';const g=await runtime({legacyMaps:false,productionStory:true}),C=g.HONRO_CORE;
const snap=b=>b.units.map(u=>({id:u.id,side:u.side,hp:u.hp,maxHp:u.maxHp,attack:u.attack,armor:u.armor,role:u.role}));
const before=[];for(let n=1;n<=30;n++)before.push(snap(battlefield(g,n).b));
g.HONRO_ACT4_PILOT_COMBAT_REFERENCE=JSON.parse(await readFile('shared/data/act4/pilot-combat-reference.json','utf8'));
vm.runInContext(await readFile('shared/runtime/act4-pilot-combat.js','utf8'),g);const P=g.HonroAct4PilotCombat;
for(let n=1;n<=30;n++)assert.deepEqual(snap(battlefield(g,n).b),before[n-1],`stage ${n} untagged factory fallback`);
const source=g.HONRO_PROJECT,copy=x=>JSON.parse(JSON.stringify(x));let cases=0;
for(const n of [31,34,39]){
 const stage=copy(source.stages.find(s=>s.metadata.stageId===n));assert(stage);const enemy=stage.units.find(u=>u.team==='enemy'&&!u.stageOverrides?.boss);assert(enemy);
 enemy.stageOverrides??={};Object.assign(enemy.stageOverrides,{honroPilotMidboss:P.configs[n].key,honroPilotCombatBudget:true,honroPilotRole:'guard'});
 const profile=g.HonroMaps.profileFor(stage);g.HonroEquipment.migrate(profile);
 const bad=copy(stage);bad.units.find(u=>u.id===enemy.id).stageOverrides.honroPilotMidboss='wrong';assert.throws(()=>g.HonroMaps.createBattle(bad,source,profile),/Invalid pilot combat/);
 const module=g.HonroAct4PilotCombat,ref=g.HONRO_ACT4_PILOT_COMBAT_REFERENCE;
 g.HonroAct4PilotCombat=undefined;assert.throws(()=>g.HonroMaps.createBattle(stage,source,profile),/module\/reference/);g.HonroAct4PilotCombat=module;
 g.HONRO_ACT4_PILOT_COMBAT_REFERENCE=undefined;assert.throws(()=>g.HonroMaps.createBattle(stage,source,profile),/module\/reference/);g.HONRO_ACT4_PILOT_COMBAT_REFERENCE=ref;
 const b=g.HonroMaps.createBattle(stage,source,profile),u=b.units.find(u=>u.id===enemy.id);assert(P.equipped(b,u));assert(u.honroPilotBudgetBasis);assert.equal(u.honroPilotBudgetBasis.version,n===31?2:1);assert(u.hp>0);cases++;
}
const args=process.argv.slice(2);if(args.length&&args.length!==3)throw Error('Pass all three candidate paths in 31,34,39 order');
for(const [i,file] of args.entries()){
 const n=[31,34,39][i],project=JSON.parse(await readFile(file,'utf8')),s=project.stages[0],p=g.HonroMaps.profileFor(s);assert.equal(s.metadata.stageId,n);g.HonroEquipment.migrate(p);
 const b=g.HonroMaps.createBattle(s,project,p),mid=b.units.filter(u=>P.equipped(b,u)),budget=b.units.filter(u=>u.honroPilotCombatBudget);assert.equal(mid.length,1,`stage${n} midboss`);assert(budget.every(u=>u.honroPilotBudgetBasis));
 if(n===31){assert.equal(budget.length,34);assert(budget.every(u=>u.honroPilotBudgetBasis.version===2));}else assert.equal(budget.length,0,'actual candidate has no budget opt-in');
 const e=new C.Engine(b,()=>{}),u=mid[0];P.attach({engine:e,dialogue:null,modal:{classList:{contains:()=>false}}});if(n===31){assert.equal(e.honroDensityActivationAttached,true);assert.equal(b.honroPilotActivationReady,true);}e.b.side=1;e.b.phase='enemy';e.b.active=u.id;u.acted=false;u.aiMove=undefined;u.moveTarget=undefined;e.settleBusy=()=>false;e.finishAction=()=>{};assert(P.action(e));assert.equal(P.memory(u).phase,'telegraph');
 console.log(JSON.stringify({stage:n,candidate:file,midboss:u.id,budget:budget.length,reference:budget[0]?.honroPilotBudgetBasis?.referenceId||null}));
}
console.log(`PASS ${cases} synthetic pilot factory + missing-module/reference checks, 30 untagged chapter snapshots; actual candidate proofs=${args.length}. No play/GUI claim.`);
