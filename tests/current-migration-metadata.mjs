import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {runtime} from '../game/tests/helpers.mjs';
import {historicalCampaign} from './historical-campaign-inputs.mjs';
import {throughCurrentMigrationMetadata} from './current-migration-metadata-helpers.mjs';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {campaignHash as hash} from './current-campaign-contract-helpers.mjs';
const g=await runtime({legacyMaps:false}),source=historicalCampaign();source.stages=source.stages.slice(0,10);const original=hash(source),out=throughCurrentMigrationMetadata(g,source);assert.equal(hash(source),original);assert.deepEqual(throughCurrentMigrationMetadata(g,out),out,'Current migration metadata is idempotent');
const restored=plain(out),rows=[];
for(let i=0;i<10;i++){const before=source.stages[i],after=out.stages[i],back=restored.stages[i];assert.equal(after.initialState.spBalanceRevision,1);const enemies=after.units.filter(u=>u.team==='enemy'),ids=enemies.map(u=>u.honroContributionId);assert.deepEqual(ids,before.units.filter(u=>u.team==='enemy').map(u=>u.id));assert.equal(new Set(ids).size,ids.length);
 // Reconstruct the before object only to prove the delta's exact scope. Live
 // battles are never stripped or downgraded to satisfy old expectations.
 if(Object.hasOwn(before.initialState,'spBalanceRevision'))back.initialState.spBalanceRevision=before.initialState.spBalanceRevision;else delete back.initialState.spBalanceRevision;
 for(let j=0;j<back.units.length;j++){if(Object.hasOwn(before.units[j],'honroContributionId'))back.units[j].honroContributionId=before.units[j].honroContributionId;else delete back.units[j].honroContributionId;}
 rows.push({stage:i+1,revision:1,enemyIds:ids});
}
assert.deepEqual(restored,source,'Every other original raw field and all ordering remain unchanged');
for(const[id,change]of [['wrong-revision',p=>p.stages[0].initialState.spBalanceRevision=2],['wrong-contribution-id',p=>p.stages[0].units.find(u=>u.team==='enemy').honroContributionId='alias'],['duplicate-actor-id',p=>{const u=p.stages[0].units.filter(u=>u.team==='enemy');u[1].id=u[0].id;}]]){const p=plain(source);change(p);assert.throws(()=>throughCurrentMigrationMetadata(g,p),id);}
const h=await appHarness(),app=h.load(h.profileThrough(1));app.launch(2);h.finish(app);const b=app.engine.b;assert.equal(b.spBalanceRevision,1);const state=b=>({revision:b.spBalanceRevision,ids:b.units.filter(u=>u.side===1&&!u.summoned).map(u=>({id:u.id,contributionId:u.honroContributionId})),growth:plain(b.honroGrowth),heroes:plain(b.heroes)}),saved=state(b);assert.equal(new Set(saved.ids.map(u=>u.contributionId)).size,saved.ids.length);for(const row of saved.ids)assert.equal(row.id,row.contributionId);
let active=app;for(let n=0;n<3;n++){active.export();const profile=await h.exported();await h.import(profile);active=h.reload();h.click('continue');h.finish(active);assert.deepEqual(state(active.engine.b),saved,'Actual App export/import/Continue preserves IDs/SP/XP #'+n);}
mkdirSync('_local/reports/campaign-contracts',{recursive:true});writeFileSync('_local/reports/campaign-contracts/current-migration-metadata.json',JSON.stringify({passed:true,originalSha256:original,rows,negativeControls:3,appContinues:3,scope:'Both historical inputs through current production migration; exact two annotation families, no raw-field removal or old gameplay expectation rewrite.'},null,2)+'\n');console.log('PASS ten historical maps through current migration, exact two annotation families,3 invalid-ID/revision controls and3 real App Continues');
