/** Review branch boundary against the exact approved parent; no fixture relaxation. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runtime} from '../game/tests/helpers.mjs';
const base='d7c1f8457dd33decda5481c7c3b57d8505f6f157',prior=JSON.parse(execFileSync('git',['show',base+':shared/data/campaign.json'],{encoding:'utf8',maxBuffer:50e6})),now=JSON.parse(readFileSync('shared/data/campaign.json')),g=await runtime({legacyMaps:false});
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
assert.deepEqual(now.stages.slice(0,29),prior.stages.slice(0,29));
assert.deepEqual(now.library.filter(a=>!a.id.startsWith('stage30:ferry-')),prior.library.filter(a=>!a.id.startsWith('stage30:ferry-')));
const old=prior.stages[29],cur=now.stages[29],strip=s=>{s=structuredClone(s);delete s.elements;delete s.design.ferryArt;return s};const expected=structuredClone(old),roofId='sf-quay-west-loft';for(const p of expected.terrains.find(t=>t.id===roofId).points)p.y+=40;for(const u of expected.units)if(u.stageOverrides?.honroEncounterSupport===roofId)u.y+=40;const shift=o=>{if(!o||typeof o!=='object')return;if(o.support===roofId&&Number.isFinite(o.y))o.y+=40;for(const v of Object.values(o))shift(v);};shift(expected.initialState.honroFerrySpec.entries);assert.deepEqual(strip(cur),strip(expected),'Only west roof/supporting actors and entries move40; all other gameplay exact');
const b=g.HonroMaps.createBattle(g.HONRO_PROJECT.stages[29],g.HONRO_PROJECT),steps=g.HonroAct3.steps(b);
assert.deepEqual(JSON.parse(JSON.stringify(steps.map(s=>s.id))),['transport-map','ferry-hold','old-road']);assert.equal(steps[0].kind,'reach');assert.equal(steps[0].radius,260);assert.equal(steps[1].rounds,3);assert.equal(steps[2].allHeroes,true);assert.equal(b.units.filter(u=>u.side===1).length,40);assert.equal(b.units.filter(u=>u.side===1&&u.honroAct3Elite).length,10);
for(const p of ['shared/runtime/stage30-ferry.js','shared/runtime/objective-revision.js','shared/engine/src/physics.ts'])assert.equal(readFileSync(p,'utf8'),execFileSync('git',['show',base+':'+p],{encoding:'utf8'}));
const out={pass:true,base,other29Exact:true,stage30GameplayExactExceptWestRoof40:true,westRoofDelta:40,oldSaveNoMigration:true,physicalStageSha256:hash(strip(cur)),initialEnemies:40,elites:10,steps:JSON.parse(JSON.stringify(steps)),runtimeSafetyUnchanged:true};writeFileSync('review/stage30/preservation.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out));
