/** Pre-entry geometry fixtures; App native inputs, no live coordinate edits. */
import vm from 'node:vm';
import {authorProjectExpression} from '../shared/build.mjs';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {appHarness,plain} from './app-regression-helpers.mjs';
const before=JSON.parse(execFileSync('git',['show','9eac78a6:shared/data/campaign.json'],{maxBuffer:30e6})),after=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
assert.deepEqual(after.stages.filter((s,i)=>i!==20),before.stages.filter((s,i)=>i!==20));
assert.deepEqual(after.stages[20].units,before.stages[20].units);assert.deepEqual(after.stages[20].encounters,before.stages[20].encounters);assert.deepEqual(after.stages[20].markers,before.stages[20].markers);
const input=JSON.parse(await readFile('_local/reports/stage21-current/clear-route/initial.json','utf8')),out='_local/reports/stage21-approach';await mkdir(out,{recursive:true});
const entries={};let lastHarness;
for(const [name,project]of [['before',before],['after',after]]){
 const h=await appHarness({productionStory:true});h.g.HONRO_PROJECT=vm.runInContext(authorProjectExpression(JSON.stringify(project)),h.g);const app=h.load(input.profile);app.launch(21);const b=app.engine.b;
 assert(b.honroV4CitySpec);assert(b.units.some(u=>u.id==='v4.gate-cart'));assert.equal(b.seed,19388);entries[name]=plain(b);lastHarness=h;assert.equal(b.honroCampaignMapRevision,521);
 await writeFile(`${out}/${name}-entry.json`,JSON.stringify({profile:input.profile,initial:plain(b)}));
 const body=b.terrain.find(t=>t.id==='a3-foundation');console.log(name,body.vertices.filter(p=>p.x>=1120&&p.x<=1780));
}
const C=lastHarness.C,oldGround=entries.before.terrain.find(t=>t.id==='a3-foundation'),newGround=entries.after.terrain.find(t=>t.id==='a3-foundation');
for(let x=1620;x<=2890;x+=5)assert.equal(C.topAt(oldGround,x),C.topAt(newGround,x),'escort support at '+x);
const oldSave={...plain(input.profile),honroBattle:plain(input.initial)},kept=plain({heroes:oldSave.heroes,equipment:oldSave.equipment,cleared:oldSave.cleared});
assert(lastHarness.g.HonroCampaignMapRevision.discard(oldSave));assert.equal(oldSave.honroMapRestart,21);assert.equal(oldSave.honroBattle,null);assert.deepEqual({heroes:oldSave.heroes,equipment:oldSave.equipment,cleared:oldSave.cleared},kept);
const currentSave={...plain(input.profile),honroBattle:plain(entries.after)};assert(!lastHarness.g.HonroCampaignMapRevision.discard(currentSave));assert.deepEqual(currentSave.honroBattle,entries.after);
console.log('PASS escort support unchanged, old-map growth/equipment preserved and current map retained');
console.log('PASS same entry profile/seed, other stages, enemies, encounters and objective anchors unchanged');
