import assert from 'node:assert/strict';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C}=h,rows=[];
for(const stage of [7,8,9,10,11,18,22]){
 const profile=h.profileThrough(stage-1),b=g.HonroWorld.build(g.HONRO_CONTENT.stages[stage-1],profile,false,'archer','A01');
 const targets=b.units.filter(u=>u.side===1&&!u.boss&&!u.honroMidboss&&!u.honroFinalBoss);
 for(const u of targets){if(u.honroAct1DefenseRevision){delete u.existenceDefense;delete u.honroAct1DefenseRevision;}}
 const spirit=targets.find(u=>g.HonroAct1Roster.defenseProfiles[u.honroVariant||u.honroType])||targets[0];
 spirit.hp=Math.min(47,spirit.hp);spirit.acted=true;spirit.mark=2;spirit.existenceShift={form:.03,qi:-.02};
 const explicit=targets.find(u=>u!==spirit);explicit.existenceDefense={form:.41,qi:.72,soul:1.12};
 b.round=4;b.honroState.flags['defense-save-probe']=true;
 g.HonroStageRules.sanitizeStageBattle(b); // settle existing independent geometry migration before snapshot
 for(const u of targets){if(u.honroAct1DefenseRevision){delete u.existenceDefense;delete u.honroAct1DefenseRevision;}}
 for(const u of b.units)C.migrateEnemySkills(u); // independent existing save skill-ID migration
 const fields=['id','hp','maxHp','x','y','vx','vy','acted','mark','armor','loadout','ranks','cooldowns','existenceShift','honroVariant','honroType','dead'];
 const state=unit=>plain(Object.fromEntries(fields.filter(k=>unit[k]!==undefined).map(k=>[k,unit[k]])));
 const before=targets.map(state),defenses=targets.map(u=>plain(C.defenseForUnit(u)));
 profile.honroBattle=plain(b);profile.honroStage=stage;const app=h.load(profile);app.continue();
 for(let n=0;n<3;n++){
  assert.deepEqual(targets.map(u=>state(app.engine.unit(u.id))),before,'Saved combat state unchanged '+stage);
  assert.deepEqual(plain(app.engine.unit(explicit.id).existenceDefense),{form:.41,qi:.72,soul:1.12});
  assert.equal(app.engine.b.round,4);assert.equal(app.engine.b.honroState.flags['defense-save-probe'],true);
  if(stage<=10){assert.deepEqual(plain(C.defenseForUnit(app.engine.unit(spirit.id))),plain(g.HonroAct1Roster.defenseProfiles[spirit.honroVariant||spirit.honroType]));}
  else assert.deepEqual(targets.map(u=>plain(C.defenseForUnit(app.engine.unit(u.id)))),defenses);
  app.export();await h.import(await h.exported());app.continue();
 }
 rows.push({stage,repeatImports:3,hp:spirit.hp,explicitOverridePreserved:true});
}
await report('act1-defense-resume',rows);console.log('PASS actual App Continue/export/import x3: Act 1 default profiles, explicit defense, HP/status/position and later acts');
