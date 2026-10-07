// Production export/import/Continue; only DOM/storage/downloads are doubles.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {beforePlatformTerrain,beforePlatformPassages} from './platform-passage-delta-helpers.mjs';
const h=await appHarness(),{g}=h,R=g.HonroPlatformPassages,rows=[];
const stable=b=>plain({units:b.units,items:b.items,heroes:b.heroes,round:b.round,active:b.active,state:b.honroState,projectiles:b.projectiles,physics:b.physics});
for(const stage of [8,9,10]){
 const p=h.profileThrough(10);p.settings.debugMode=false;const app=h.load(p);app.launch(stage);h.finish(app);const b=app.engine.b;
 b.terrain=beforePlatformTerrain(b.terrain,stage,g);b.honroWorldTerrain=beforePlatformTerrain(b.honroWorldTerrain,stage,g);
 b.round=4;b.items.heal=1;b.honroState.flags.platformSaveProbe=true;
 for(const u of b.units.filter(u=>u.side===0)){u.hp-=17;u.focus-=3;u.moveLeft-=31;}
 const old=plain(b),saved=stable(b),oldTerrain=plain(b.terrain),oldWorld=plain(b.honroWorldTerrain);
 // Migration itself edits only the reviewed flags and missing additive ledges.
 const direct=plain(old);assert(R.upgradeBattle(direct));assert.deepEqual(stable(direct),saved);assert.deepEqual(beforePlatformTerrain(direct.terrain,stage,g),oldTerrain);assert.deepEqual(beforePlatformTerrain(direct.honroWorldTerrain,stage,g),oldWorld);
 const once=JSON.stringify(direct);assert.equal(R.upgradeBattle(direct),false);assert.equal(JSON.stringify(direct),once);
 let rejected=0;for(const mutate of [b=>delete b.honroMapOrigin,b=>b.honroMapOrigin='workshop',b=>b.honroCustom=true,b=>b.honroAuthoredId='other',b=>b.terrain[0].vertices[0].x++,b=>b.honroWorldTerrain[0].vertices[0].x++,b=>b.honroMapAnchors.start.x++,b=>b.terrain.find(t=>R.targets[stage].includes(t.id)).vertices[0].x++]){
  const q=plain(old);mutate(q);const prior=JSON.stringify(q);assert.equal(R.upgradeBattle(q),false);assert.equal(JSON.stringify(q),prior);rejected++;
 }
 // Export and file import must preserve the original snapshot until Continue.
 app.export();const exported=await h.exported();assert.deepEqual(plain(exported.honroBattle.terrain),oldTerrain);await h.import(exported);assert.deepEqual(plain(app.profile.honroBattle.terrain),oldTerrain);
 app.continue();h.finish(app);const resumed=app.engine.b;assert.equal(resumed.honroPlatformPassageRevision,1);assert.deepEqual(stable(resumed),saved,'Continue preserves all actor states, HP, positions, budget and progression');assert.deepEqual(beforePlatformTerrain(resumed.terrain,stage,g),oldTerrain);assert.deepEqual(beforePlatformTerrain(resumed.honroWorldTerrain,stage,g),oldWorld);
 const roundTrip=stable(resumed),terrain=plain(resumed.terrain);app.export();await h.import(await h.exported());app.continue();h.finish(app);assert.deepEqual(stable(app.engine.b),roundTrip);assert.deepEqual(plain(app.engine.b.terrain),terrain);
 // Sanitizing/importing/editing an old Workshop project never opts into this.
 const custom=beforePlatformPassages(g.HONRO_PROJECT),normalized=g.HonroMaps.normalize(custom);assert.deepEqual(plain(normalized),custom);const workshop=g.HonroMaps.createBattle(custom.stages[stage-1],custom);assert.equal(R.upgradeBattle(workshop),false);
 rows.push({stage,rejectedVariants:rejected,exactDelta:true,actorsAndResourcesPreserved:true,appRoundTrip:true,repeatStable:true,workshopUnchanged:true});
}
await mkdir('_local/reports/one-way',{recursive:true});await writeFile('_local/reports/one-way/save-migration.json',JSON.stringify({rows,limits:['App code is real; DOM, storage and downloads are doubles.','Only positively identified current canonical campaign layouts qualify; unmarked/custom/historical geometry is unchanged.']},null,2)+'\n');console.log('PASS bounded platform migration and actual App export/import/Continue for stages 8–10');
