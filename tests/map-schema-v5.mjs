import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),plain=v=>JSON.parse(JSON.stringify(v)),project=plain(g.HONRO_PROJECT);
assert.equal(g.HonroMaps.VERSION,6);assert.equal(project.version,6);assert(project.library.some(a=>a.vector&&a.visual.length===0));
const old=vm.createContext({HONRO_CORE:{},HonroEnvironment:{VERSION:4}});
// Frozen parser from ce25105; no imports or current-schema aliases.
vm.runInContext(await readFile('tests/fixtures/map-schema-v4.js','utf8'),old);
const v5=vm.createContext({HONRO_CORE:{}});vm.runInContext(await readFile('tests/fixtures/map-schema-v5.js','utf8'),v5);assert.throws(()=>v5.HonroMaps.normalize(project),/Unsupported future map version 6/,'v5 must reject unclipped extended geometry');
assert.equal(old.HonroMaps.VERSION,4);assert.throws(()=>old.HonroMaps.normalize(project),/Unsupported future map version 6/,'older clients must not silently drop new vector-only assets');
const v4=structuredClone(project);v4.version=4;v4.stages=v4.stages.slice(0,10);v4.activeStageId=v4.stages[0].id;v4.library=v4.library.filter(a=>!a.id.startsWith('act2:')&&!a.id.startsWith('act1-scene:')&&!a.id.startsWith('a3-'));for(const st of v4.stages){st.elements=st.elements.filter(e=>!e.id.startsWith('a1-scene-'));delete st.design.act1Scene;}
assert(v4.library.every(a=>!a.vector),'fixture must use old polygon/landmark capabilities');
const original=JSON.stringify(v4),normalized=g.HonroMaps.finalize(v4);assert.equal(JSON.stringify(v4),original,'normalization mutates old input');
assert.equal(normalized.version,6);assert.deepEqual(plain(normalized.stages),v4.stages,'v4 world composition must not run v1–v3 legacy conversion');assert.deepEqual(plain(normalized.library),v4.library);assert.equal(normalized.environmentVersion,v4.environmentVersion);
const main=await readFile('shared/runtime/main.js','utf8'),freshSource=main.slice(main.indexOf('function fresh()'),main.indexOf('function migrateGrowth('));
vm.runInContext('{const C=HONRO_CORE,ROSTER=[\'archer\',\'mage\',\'knight\',\'occultist\'];'+freshSource+'globalThis.TestProfileFresh=fresh;}',g);
assert.equal(g.TestProfileFresh().schema,4,'profile/save schema is independent and must stay compatible');
assert(main.includes('[1,2,3,4].includes(data.schema)'),'existing profile import range remains unchanged');
console.log('PASS map v6 terrain-domain capability gate, old-v4 rejection, composition-preserving v4 import, unchanged profile schema4');
