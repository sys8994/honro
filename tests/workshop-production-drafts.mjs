// Real editor commit/import functions, with UI repaint/storage intentionally stubbed.
// Browser input and final production export are verified separately.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const g=await runtime({legacyMaps:false}),copy=v=>JSON.parse(JSON.stringify(v));
const base=copy(g.HONRO_PROJECT);base.activeStageId='stage-31';
// Deliberately invalid unrelated stage must remain invalid, not be repaired or removed.
base.stages.find(s=>s.id==='stage-3').units.push(copy(base.stages.find(s=>s.id==='stage-3').units[0]));
const prior=JSON.stringify(base.stages.find(s=>s.id==='stage-3'));
const source=await readFile('workshop/src/app.js','utf8');
const commit=source.slice(source.indexOf('function commit('),source.indexOf('\nfunction undo('));
const importing=source.slice(source.indexOf('function importProject('),source.indexOf('\nfunction importFile('));
const env=vm.createContext({project:base,HonroMaps:g.HonroMaps,HonroProductionContract:g.HonroProductionContract,deep:copy,history:[],future:[],previewProject:null,selected:null,stageView:{},saveAutosave(){},renderAll(){},setStatus(){},resizeAll(){}});
vm.runInContext(commit+'\n'+importing,env);
vm.runInContext("commit('begin',p=>Object.assign(p,HonroProductionContract.begin(p,'stage-31')))",env);
assert(env.project.production.cards['stage-31']);assert.equal(env.history.length,1);
assert.equal(JSON.stringify(env.project.stages.find(s=>s.id==='stage-3')),prior,'Unrelated invalid stage remains untouched');
env.saved=copy(env.project);vm.runInContext('importProject(saved)',env);
assert(env.project.production.cards['stage-31'],'A saved draft can reopen');
assert.equal(JSON.stringify(env.project.stages.find(s=>s.id==='stage-3')),prior);
assert.throws(()=>g.HonroProductionContract.assertExport(env.project,'stage-31'),/차단/,'Draft reopening does not permit production export');
assert(g.HonroMaps.validate(env.project).some(i=>i.level==='err'),'No global schema error is silently deleted');
console.log('PASS real editor draft commit/import preserve unrelated invalid data; production export remains blocked.');
