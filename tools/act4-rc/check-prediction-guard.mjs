// Run against an independent candidate TS file; no candidate code is integrated.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import ts from '../../game/node_modules/typescript/lib/typescript.js';
const path=process.argv[2];if(!path)throw Error('Usage: node tools/act4-rc/check-prediction-guard.mjs PATH_TO_CANDIDATE_TS');
const source=await readFile(path,'utf8');const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
const context={exports:{},structuredClone,Object,Array,WeakMap,WeakSet,Set,RangeError};vm.runInNewContext(js,context);const run=context.exports.withPredictionBattle;
const vector={root:{tag:'path',d:'M0 0'}},battle={honroAct4Official:1,honroStage:38,honroLandmarks:[{asset:{id:'art',vector}}],honroElements:[],units:[{hp:8}],rng:123};
let calls=0;const actual=run(battle,b=>{calls++;return Object.getOwnPropertyDescriptor(b.honroLandmarks[0].asset,'vector').value?.root?.d??null});const expected=Object.getOwnPropertyDescriptor(structuredClone(battle).honroLandmarks[0].asset,'vector').value.root.d;
console.log(JSON.stringify({actual,expected,calls,liveHp:battle.units[0].hp,liveRng:battle.rng}));assert.equal(actual,expected,'reflection of omitted art must match full clone or trigger full-clone fallback');
