/** Compare old authored map inputs at the same current production migration
 * boundary. Add only derived SP/contribution annotations; never delete fields. */
import assert from 'node:assert/strict';
export function throughCurrentMigrationMetadata(g,input){
 const clone=v=>JSON.parse(JSON.stringify(v)),snapshot=JSON.stringify(input),project=clone(input),rows=[];
 for(const stage of project.stages||[]){
  const profile=g.HONRO_CORE.defaults();profile.recruited=g.HonroStageRules.stageParty(stage.metadata.stageId);
  const battle=g.HonroMaps.createBattle(stage,{...project,library:project.library||g.HONRO_PROJECT.library},profile,{legacyBalance:true,origin:'campaign'});
  g.HONRO_CORE.applySpBalanceMigration(battle);g.HonroProgression.initialize(battle,profile);
  assert.equal(battle.spBalanceRevision,1,'Exact current SP migration revision');
  if(stage.initialState.spBalanceRevision!==undefined)assert.equal(stage.initialState.spBalanceRevision,battle.spBalanceRevision,'Existing SP revision must already be correct');
  stage.initialState.spBalanceRevision=battle.spBalanceRevision;
  const enemies=battle.units.filter(u=>u.side===1&&!u.summoned),ids=enemies.map(u=>u.honroContributionId);
  assert.equal(new Set(ids).size,ids.length,'Unique contribution identities in stage '+stage.metadata.stageId);
  for(const u of enemies){assert.equal(u.honroContributionId,u.id,'Current registration keeps original actor identity');const source=stage.units.find(s=>s.id===u.id);assert(source,'Every migrated enemy comes from original map');if(source.honroContributionId!==undefined)assert.equal(source.honroContributionId,u.honroContributionId);source.honroContributionId=u.honroContributionId;}
  assert.equal(enemies.length,stage.units.filter(u=>u.team==='enemy').length,'No missing/added original enemies in metadata migration');
  rows.push({stage:stage.metadata.stageId,revision:battle.spBalanceRevision,ids});
 }
 assert.equal(JSON.stringify(input),snapshot,'Original historical source is immutable');
 return project;
}
