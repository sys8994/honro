// Production export/import/Continue; only DOM/storage/downloads are doubles.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {beforeGuardianTerrain} from './guardian-terrain-history-helpers.mjs';
import {beforePlatformTerrain,beforePlatformPassages} from './platform-passage-delta-helpers.mjs';
// Passage-save fixtures use current geometry with old passage flags only.
// Older guardian geometry is a distinct historical save and must stay untouched.
const passageTerrain=(terrain,stage,g)=>beforePlatformTerrain(terrain,stage,g,{guardian:false});
const h=await appHarness(),{g}=h,R=g.HonroPlatformPassages,rows=[];
const stable=b=>plain({units:b.units,items:b.items,heroes:b.heroes,round:b.round,active:b.active,state:b.honroState,projectiles:b.projectiles,physics:b.physics});
for(const stage of [8,9,10]){
 const p=h.profileThrough(10);p.settings.debugMode=false;const app=h.load(p);app.launch(stage);h.finish(app);const b=app.engine.b;
 b.terrain=passageTerrain(b.terrain,stage,g);b.honroWorldTerrain=passageTerrain(b.honroWorldTerrain,stage,g);
 b.round=4;b.items.heal=1;b.honroState.flags.platformSaveProbe=true;
 for(const u of b.units.filter(u=>u.side===0)){u.hp-=17;u.focus-=3;u.moveLeft-=31;}
 const old=plain(b),saved=stable(b),oldTerrain=plain(b.terrain),oldWorld=plain(b.honroWorldTerrain);
 // Migration itself edits only the reviewed flags and missing additive ledges.
 const direct=plain(old);assert(R.upgradeBattle(direct));assert.deepEqual(stable(direct),saved);assert.deepEqual(passageTerrain(direct.terrain,stage,g),oldTerrain);assert.deepEqual(passageTerrain(direct.honroWorldTerrain,stage,g),oldWorld);
 if(stage===10){const historical=plain(old);historical.terrain=beforeGuardianTerrain(historical.terrain,stage,g);historical.honroWorldTerrain=beforeGuardianTerrain(historical.honroWorldTerrain,stage,g);const unchanged=JSON.stringify(historical);assert.equal(R.upgradeBattle(historical),false,'Older guardian geometry is not silently migrated');assert.equal(JSON.stringify(historical),unchanged);}
 const once=JSON.stringify(direct);assert.equal(R.upgradeBattle(direct),false);assert.equal(JSON.stringify(direct),once);
 let rejected=0;for(const mutate of [b=>delete b.honroMapOrigin,b=>b.honroMapOrigin='workshop',b=>b.honroCustom=true,b=>b.honroAuthoredId='other',b=>b.terrain[0].vertices[0].x++,b=>b.honroWorldTerrain[0].vertices[0].x++,b=>b.honroMapAnchors.start.x++,b=>b.honroTerrainBounds.left--,b=>b.terrain.find(t=>R.targets[stage].includes(t.id)).vertices[0].x++]){
  const q=plain(old);mutate(q);const prior=JSON.stringify(q);assert.equal(R.upgradeBattle(q),false);assert.equal(JSON.stringify(q),prior);rejected++;
 }
 if(stage===10)for(const change of ['missing','shape','solid']){
  const current=g.HONRO_PROJECT,next=plain(current),st=next.stages[9],id='gallery-link-west';if(change==='missing')st.terrains=st.terrains.filter(t=>t.id!==id);else if(change==='shape')st.terrains.find(t=>t.id===id).points[0].y--;else st.terrains.find(t=>t.id===id).oneWay=false;
  try{g.HONRO_PROJECT=next;const q=plain(old),prior=JSON.stringify(q);assert.equal(R.upgradeBattle(q),false);assert.equal(JSON.stringify(q),prior);}finally{g.HONRO_PROJECT=current;}
 }
 // Export and file import must preserve the original snapshot until Continue.
 app.export();const exported=await h.exported();assert.deepEqual(plain(exported.honroBattle.terrain),oldTerrain);await h.import(exported);assert.deepEqual(plain(app.profile.honroBattle.terrain),oldTerrain);
 app.continue();h.finish(app);const resumed=app.engine.b;assert.equal(resumed.honroPlatformPassageRevision,1);assert.deepEqual(stable(resumed),saved,'Continue preserves all actor states, HP, positions, budget and progression');assert.deepEqual(passageTerrain(resumed.terrain,stage,g),oldTerrain);assert.deepEqual(passageTerrain(resumed.honroWorldTerrain,stage,g),oldWorld);
 const roundTrip=stable(resumed),terrain=plain(resumed.terrain);app.export();await h.import(await h.exported());app.continue();h.finish(app);assert.deepEqual(stable(app.engine.b),roundTrip);assert.deepEqual(plain(app.engine.b.terrain),terrain);
 // Sanitizing/importing/editing an old Workshop project never opts into this.
 const custom=beforePlatformPassages(g.HONRO_PROJECT),normalized=g.HonroMaps.normalize(custom);assert.deepEqual(plain(normalized),custom);const workshop=g.HonroMaps.createBattle(custom.stages[stage-1],custom);assert.equal(R.upgradeBattle(workshop),false);
 rows.push({stage,rejectedVariants:rejected,exactDelta:true,actorsAndResourcesPreserved:true,appRoundTrip:true,repeatStable:true,workshopUnchanged:true});
}
await mkdir('_local/reports/one-way',{recursive:true});await writeFile('_local/reports/one-way/save-migration.json',JSON.stringify({rows,limits:['App code is real; DOM, storage and downloads are doubles.','Only positively identified current canonical campaign layouts qualify; unmarked/custom/historical geometry is unchanged.']},null,2)+'\n');console.log('PASS bounded platform migration and actual App export/import/Continue for stages 8–10');
