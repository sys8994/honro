// Production main initializer and final training battle, not training-layout's synthetic callback.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {splitV1Profile} from './split-v1-test-helpers.mjs';
const base='936f2629cfd1ff1e0e6df527df02aaa2e3562caf',original=execFileSync('git',['show',`${base}:shared/runtime/main.js`],{encoding:'utf8'}),current=await readFile('shared/runtime/main.js','utf8');
const hook=/    const app=new App\(\),loader=G.HonroCampaignLoader[\s\S]*?(?=    G.HONRO_TOOLS)/;
async function run(source){const h=await appHarness(),g=h.g,C=g.HONRO_CORE;assert(source.match(hook));vm.runInContext(source.replace(hook,''),g);vm.runInContext('Date.now=()=>1792818000000;Math.random=()=>.246813579;',g);
 const rows=[],build=g.HonroWorld.build;let seed,abi;
 g.HonroWorld.build=(...args)=>{const initialize=args[5];args[5]=(...values)=>{abi=values.slice(2);assert.equal(values[2],true);const b=initialize(...values);seed=plain(b);return b;};return build(...args);};
 for(const cls of ['archer','mage','knight','occultist']){
  const basic=C.baseSkill(cls),ordinary=C.TALENTS.find(t=>t.cls===cls&&!t.passive&&!C.SKILLS[t.id].ultimate).id,ultimate=C.ultimateSkill(cls);
  for(const [kind,skill,rank] of [['basic',basic,7],['ordinary',ordinary,3],['ordinary-zero',ordinary,0],['ultimate',ultimate,7],['loadout',undefined,3]]){
   const p=C.defaults();p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];p.heroes[cls].xp=C.xpAtLevel(12);p.heroes[cls].ranks[ordinary]=rank;p.loadouts[cls]=[basic,ordinary];const before=JSON.stringify(p);
   const battle=g.HONRO_TOOLS.makeWorld(g.HONRO_CONTENT.stages[0],p,true,cls,skill);assert.equal(JSON.stringify(p),before);
   assert.deepEqual(abi,[true,cls,skill]);assert.equal(seed.mode,'practice');assert.equal(seed.width,2400);assert.equal(seed.height,1380);assert.equal(seed.vertical,false);assert.equal(seed.wind,7);
   assert.deepEqual(seed.terrain.map(t=>t.id),['trainingfloor','trainingstep']);assert.equal(seed.units.length,6);assert.equal(seed.units[0].x,280);assert.equal(seed.units[0].y,1010);assert.equal(seed.units[4].y,850);assert.equal(seed.units.filter(u=>u.id.startsWith('practice-')).length,5);assert.equal(seed.session,'honro-1792818000000');
   const u=seed.units[0];if(skill){assert.deepEqual(u.loadout,[skill]);assert.equal(u.ranks[skill],kind==='ordinary'?3:1);assert.deepEqual(seed.heroes[cls].ranks,u.ranks);}else assert.deepEqual(u.loadout,plain(p.loadouts[cls]));
   assert.equal(battle.sceneVersion,seed.sceneVersion+1);assert.equal(battle.width,6000);assert.equal(battle.height,2300);assert.equal(battle.units.length,21);
   rows.push({cls,kind,skill,seed,battle:plain(battle),profile:plain(p)});
  }
 }
 const calls=[];const maps=g.HonroMaps.createBattle;g.HonroMaps.createBattle=(map,...args)=>{calls.push(map);return maps(map,...args);};const forbidden=()=>{throw Error('Training callback must not run in campaign');};
 const campaign=build(g.HONRO_CONTENT.stages[0],C.defaults(),false,'archer','A01',forbidden);assert.equal(campaign.honroStage,1);assert.equal(calls.length,1);assert.equal(calls[0],g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===1));
 const map=g.HONRO_SPLIT_V1.stages.find(s=>s.metadata.stageId===25),profile=splitV1Profile(g,map);assert(g.HonroSplitCampaign.legacy(profile,25));const split=build(g.HONRO_CONTENT.stages[24],profile,false,'archer','A01',forbidden);assert.equal(split.honroStage,25);assert.equal(calls.length,2);assert.equal(calls[1],map);
 return {rows,campaign:plain(campaign),split:plain(split)};
}
const old=await run(original),next=await run(current);
// Canonical project IDs are authored at runtime before Date is fixed; compare training exactly,
// and compare canonical routing/markers above instead of normalizing unrelated world metadata.
assert.deepEqual(next.rows,old.rows);
assert.equal(current.slice(0,current.indexOf('    function initializeTrainingBattle(')),original.slice(0,original.indexOf('    function makeLegacyWorld(')));
assert.equal(current.slice(current.indexOf('    function makeWorld(')),original.slice(original.indexOf('    function makeWorld(')).replace('cls,skill,makeLegacyWorld);','cls,skill,initializeTrainingBattle);'));
const metrics={cases:next.rows.length,seedAndFinalBattleAndProfileExact:true,date:1792818000000,rng:.246813579,normalCampaignAndRealSplitV1BypassInitializer:true,sourceOutsideInitializerExact:true,seedSceneVersions:[...new Set(next.rows.map(r=>r.seed.sceneVersion))],finalSceneVersions:[...new Set(next.rows.map(r=>r.battle.sceneVersion))],functionBytesRemoved:Buffer.byteLength(original.slice(original.indexOf('    function makeLegacyWorld('),original.indexOf('    function makeWorld(')))-Buffer.byteLength(current.slice(current.indexOf('    function initializeTrainingBattle('),current.indexOf('    function makeWorld(')))};
await writeFile('_local/reports/training-initializer-p21/native.json',JSON.stringify(metrics,null,2));console.log(JSON.stringify(metrics));
