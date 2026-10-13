import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {legacyRuntime,migrate} from '../migration/migrate-stages.mjs';
import {modelFiles} from '../shared/build.mjs';
import {migrationLedgerDependency as delta,beforeMigrationLedgerDependency,migrationSourceHashes,legacyRuntime as historicalLegacyRuntime} from './stage8-bier-migration-history-helpers.mjs';
import {campaignHash as hash} from './current-campaign-contract-helpers.mjs';
const source=readFileSync(delta.path,'utf8');assert.equal(hash(source),delta.afterSha256,'Current loader includes the real approved dependency');assert.equal(hash(beforeMigrationLedgerDependency(source)),migrationSourceHashes[delta.path]);assert.equal(modelFiles.indexOf('contribution-xp')+1,modelFiles.indexOf('progression'),'Same dependency order as the real Game/Workshop builder');
for(const changed of [source+' ',source.replace("'contribution-xp','progression'","'progression','contribution-xp'"),source.replace("'contribution-xp'","'fake-ledger'"),source.replace("'contribution-xp',","'contribution-xp','contribution-xp',")])assert.throws(()=>beforeMigrationLedgerDependency(changed));
const rows=[];for(const[mode,loader]of [['current',legacyRuntime],['historical-balance',historicalLegacyRuntime]]){
 const g=await loader();assert.equal(typeof g.HonroContributionXP?.create,'function');assert.equal(g.HonroContributionXP.VERSION,4);
 for(let id=1;id<=10;id++){const profile=g.HONRO_CORE.defaults();profile.recruited=g.HonroStageRules.stageParty(id);const b=g.HonroWorld.build(g.HONRO_CONTENT.stages[id-1],profile,false,'archer','A01'),state=b.honroGrowth.ledger.stages[id].contribution;assert.equal(state.version,4);assert(state.total>0);assert.equal(state.spent,0);assert.equal(state.forfeited,0);const original=JSON.parse(JSON.stringify(b.honroGrowth));g.HonroProgression.initialize(b,profile);assert.deepEqual(JSON.parse(JSON.stringify(b.honroGrowth)),original,'Repeated initialization preserves actual ledger '+mode+'/'+id);rows.push({mode,stage:id,actors:state.actors,total:state.total,terrain:b.terrain.length,units:b.units.length});}
}
const p=await migrate();assert.deepEqual(Array.from(p.stages,s=>s.metadata.stageId),Array.from({length:10},(_,i)=>i+1));
mkdirSync('_local/reports/campaign-contracts',{recursive:true});writeFileSync('_local/reports/campaign-contracts/migration-ledger.json',JSON.stringify({passed:true,delta,originalMigrationSha256:migrationSourceHashes[delta.path],rows,scope:'Real current ledger and unchanged legacy data/import; no stub or historic Engine execution. Full migration/behavior gates remain independent.'},null,2)+'\n');console.log('PASS real contribution dependency, original migration hash preserved,20 legacy-stage ledgers and10-stage import');
