import assert from 'node:assert/strict';
import {officialModuleLoader,assertFreshPilotBudget} from '../tools/quantitative-playtest/stage-runtime.mjs';
const names=['model','shared/runtime/party-rig.js','app-new-module','shared/runtime/main.js','shared/runtime/act4-pilot-combat.js','future-production-module'];
const fixture=()=>names.map((name,i)=>({name,code:i?'order.push('+i+');':'globalThis.order=[0];'}));
const identity={},loader=officialModuleLoader(fixture(),identity),g=await loader.runtimeFactory();
loader.loadBeforeMain(g);loader.loadMain(g,s=>s);loader.loadAfterMain(g);
assert.deepEqual([...g.order],[0,1,2,3,4,5]);assert.deepEqual(identity.runtimeConsumed,names);assert(identity.runtimeManifest.every(x=>/^[a-f0-9]{64}$/.test(x.sha256)));
assert.throws(()=>loader.loadMain(g,s=>s),/Duplicate consumption/);
assert.throws(()=>officialModuleLoader(fixture().filter(x=>!x.name.includes('pilot-combat'))),/pilot combat module missing/);
assert.throws(()=>officialModuleLoader([...fixture(),fixture()[0]]),/Duplicate official module/);
const incomplete=officialModuleLoader(fixture()),g2=await incomplete.runtimeFactory();assert.throws(()=>incomplete.loadAfterMain(g2),/Every official module/);
console.log('PASS exact registry order/hash, future modules, missing/duplicate/incomplete fail-closed');

const reference={version:2,referenceId:'fixed-test'},basis={version:2,status:'native-calibrated',referenceId:'fixed-test',role:'guard',normalHp:266,referenceHp:1085,referenceShot:177,hits:1.5,fraction:.26,skillAttack:{LS09:12}},unit={honroPilotBudgetBasis:basis,honroPilotSkillAttack:{LS09:12}};
assertFreshPilotBudget(unit,reference);assert.throws(()=>assertFreshPilotBudget({...unit,honroPilotBudgetBasis:{...basis,version:1}},reference),/version/);assert.throws(()=>assertFreshPilotBudget({...unit,honroPilotSkillAttack:{LS09:13}},reference),/coefficients/);assert.throws(()=>assertFreshPilotBudget({...unit,honroPilotBudgetBasis:{...basis,referenceId:'different'}},reference),/identity/);
console.log('PASS fresh v2 reference identity and skill coefficient sentinels; stale v1 rejected');
