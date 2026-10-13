/** App export/import/Continue fixtures, not an uninterrupted campaign clear. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const base=JSON.parse(execFileSync('git',['show','25ae85c:shared/data/campaign.json'],{encoding:'utf8',maxBuffer:50e6})),h=await appHarness(),checks=[];
for(const n of [21,24,28])for(const old of [false,true]){
 const profile=h.profileThrough(n),app=h.load(profile);app.launch(n);h.finish(app);const b=app.engine.b;
 if(old){const prior=h.g.HonroMaps.createBattle(base.stages[n-1],base,profile,{origin:'campaign'});b.terrain=plain(prior.terrain);b.honroWorldTerrain=plain(prior.honroWorldTerrain);delete b.honroCityTacticalRevision;}
 const before={terrain:plain(b.terrain),world:plain(b.honroWorldTerrain),units:plain(b.units),steps:plain(b.honroAct3Steps),state:plain(b.honroState)};
 if(n===24){const door=b.terrain.find(t=>t.id==='shrine-door');assert.equal(door.h,old?200:350,'Source-specific saved seal height');}
 app.export();await h.import(await h.exported());app.continue();h.finish(app);
 const after=app.engine.b;assert.deepEqual(plain(after.terrain),before.terrain);assert.deepEqual(plain(after.honroWorldTerrain),before.world);assert.deepEqual(plain(after.honroAct3Steps),before.steps);assert.deepEqual(plain(after.honroState),before.state);
 for(const u of before.units){const v=after.units.find(v=>v.id===u.id);assert(v);for(const k of ['x','y','hp','focus'])assert.equal(v[k],u[k],n+' '+u.id+' '+k);}
 checks.push(`${n} ${old?'old':'new'} battle terrain/actors/objectives preserved through real App export/import/Continue`);
}
await report('city-tactical-save',checks,{base:'25ae85c',scope:'Prepared old/new App save fixtures; not normal progression or browser evidence.'});console.log('PASS',checks);
