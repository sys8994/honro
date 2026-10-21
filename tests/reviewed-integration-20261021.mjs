/** Combined-candidate contracts. Save/migration probes are fixtures, not normal play. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {battlefield} from '../game/tests/helpers.mjs';
import {applyAct1SceneComposition} from '../tools/environment/act1-scene-composition.mjs';
import {applyStage2LayeredRoad} from '../tools/map-forge/stage2-layered-road.mjs';
import {authorStage5Waterfall} from '../tools/map-forge/stage5-waterfall.mjs';
const h=await appHarness(),{g,C}=h,out='_local/reports/integration-20261021',rows=[];
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const baseline=JSON.parse(execFileSync('git',['show','bafc275c:shared/data/campaign.json'],{maxBuffer:40e6})),current=await read('shared/data/campaign.json');
assert.deepEqual(current.library,baseline.library);
assert.deepEqual(current.stages.filter((_,i)=>![1,4].includes(i)),baseline.stages.filter((_,i)=>![1,4].includes(i)),'Only the two explicitly approved map candidates change; includes protected 10/11/12');
for(const [index,sha]of [[1,'29f70e73'],[4,'8f4c21fa']]){const candidate=JSON.parse(execFileSync('git',['show',sha+':shared/data/campaign.json'],{maxBuffer:40e6}));assert.deepEqual(current.stages[index],candidate.stages[index]);}
assert.equal(g.HonroCampaignMapRevision.current(2),8);assert.equal(g.HonroCampaignMapRevision.current(5),3);
assert.deepEqual(plain(authorStage5Waterfall(current,g)),current,'Stage5 author stays idempotent after combining Stage2');
const stage2Base=structuredClone(baseline);stage2Base.stages[4]=current.stages[4];
const stage2Rebuilt=g.HonroTerrainDomain.author(await applyAct1SceneComposition(applyStage2LayeredRoad(stage2Base,{refresh:true})));
assert.deepEqual(plain(stage2Rebuilt.stages[1]),current.stages[1]);rows.push({check:'two approved map sources and authors; other28/library exact',pass:true});
const p=(await read('game/docs/stage-review/stage05-diagnosis/evidence/entry-profile.json')).profile;
const historic=(await read('game/docs/stage-review/stage05-diagnosis/evidence/native.json')).initial;
for(const [difficulty,mult]of Object.entries(C.DIFFICULTIES)){
 const profile=plain(p);profile.settings.difficulty=difficulty;const b=g.HonroMaps.createBattle(g.HONRO_PROJECT.stages[4],g.HONRO_PROJECT,profile,{origin:'campaign'});
 const enemies=b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget);assert.equal(enemies.length,12);assert.equal(b.enemyLimit,4);assert.equal(g.HonroEncounters.populationCap(b),20);
 const stats=[];for(const u of enemies){const raw=current.stages[4].units.find(r=>r.id===u.id),kind=u.honroVariant,factor=kind==='bat'?56/70:kind==='crow'?70/88:1;
  const difficultyHp=Math.round(raw.combatBaseHp*mult.hp),airHp=Math.round(difficultyHp*factor),expected=Math.round(airHp*.6);
  assert.equal(u.maxHp,expected,`${difficulty} ${u.id}: original difficulty -> species -> encounter rounding exactly once`);
  assert.equal(u.honroAirborneBalanceRevision,factor===1?undefined:1);
  if(factor!==1)assert.equal(C.defenseForUnit(u).form,1.15);
  stats.push({id:u.id,kind,hp:u.maxHp,base:u.combatBaseHp,form:C.defenseForUnit(u).form});
 }
 rows.push({check:'Stage5 fresh merged HP/defense, initial12/cap4+20',difficulty,stats});
}
let a=h.load(plain(p));a.launch(5);h.finish(a);const b=a.engine.b;
assert.deepEqual(plain(b.honroGrowth.limit),plain(historic.honroGrowth.limit));
for(const key of ['total','combatLimit','actors','factors'])assert.deepEqual(plain(b.honroGrowth.ledger.stages[5].contribution[key]),plain(historic.honroGrowth.ledger.stages[5].contribution[key]));
assert.deepEqual(plain(b.honroMap.positioning.ritualRange),{x:125,y:80});assert.equal(b.honroStage5LakeRevision,1);assert.equal(b.honroEvents.find(v=>v.id==='lower-beasts').action.n,6);
assert.equal(a.engine.alive(1).filter(u=>u.awake).length,4);
a.engine.hurt(a.engine.unit('foe-4'),1,'p-archer',false);
assert(a.engine.alive(1).filter(u=>u.honroStage5Cell==='ritual').every(u=>u.awake));assert(a.engine.alive(1).filter(u=>u.honroStage5Cell==='shore').every(u=>!u.awake));
rows.push({check:'ritual bounds and old gate policy marker; growth/reward weights; staged activation',pass:true});
// Reuse actual prior normal R2 checkpoints. All transformations below are explicitly save fixtures.
const old=JSON.parse(gunzipSync(await readFile('game/docs/stage-review/stage05-positioning/refinement/ritual-checkpoints.json.gz'))).ritual[1];
const saved=plain(old.profile||p);saved.honroBattle=plain(old.battle);saved.lastStage=5;
const savedGrowth=plain({heroes:saved.heroes,loadouts:saved.loadouts,cleared:saved.cleared,honroGrowth:saved.honroGrowth});
const steps={sp:profile=>profile.honroBattle&&C.applySpBalanceMigration(profile.honroBattle),air:profile=>profile.honroBattle?.units.forEach(C.migrateAirborneBalance),map:profile=>g.HonroCampaignMapRevision.discard(profile)};
const orders=[['sp','air','map'],['sp','map','air'],['air','sp','map'],['air','map','sp'],['map','sp','air'],['map','air','sp']];
for(const obsolete of [false,true]){
 let first;
 for(const order of orders){const profile=plain(saved);if(obsolete)profile.honroBattle.honroCampaignMapRevision=2;
  for(let repeat=0;repeat<3;repeat++)for(const name of order)steps[name](profile);
  if(!first)first=plain(profile);else assert.deepEqual(plain(profile),first,'SP/air/map permutations produce identical full profiles');
  assert.deepEqual(plain({heroes:profile.heroes,loadouts:profile.loadouts,cleared:profile.cleared}),{heroes:savedGrowth.heroes,loadouts:savedGrowth.loadouts,cleared:savedGrowth.cleared},'XP/SP, allocation and clears never change');
  const expectedGrowth=plain(savedGrowth.honroGrowth);
  if(obsolete){expectedGrowth.version=saved.honroBattle.honroGrowth.ledger.version;assert(!expectedGrowth.stages[5],'Checkpoint profile has not persisted its in-battle Stage5 ledger yet');expectedGrowth.stages[5]={...plain(saved.honroBattle.honroGrowth.ledger.stages[5]),limit:plain(saved.honroBattle.honroGrowth.limit)};}
  assert.deepEqual(plain(profile.honroGrowth),expectedGrowth,'Obsolete-map discard preserves the exact unpersisted battle ledger and its original budget');
 }
 rows.push({check:'SP/air/map six-order repeat3 exact full-profile equality',obsolete,discarded:first.honroBattle===null});
}
// Actual App Continue/export/import twice must not reapply either resource correction.
a=h.load(plain(saved));a.continue();h.finish(a);const after=plain(a.engine.b);
for(const u of after.units){const previous=saved.honroBattle.units.find(v=>v.id===u.id);if(u.side===1&&['bat','crow'].includes(u.honroVariant)&&!u.honroMidboss){assert(Math.abs(u.hp/u.maxHp-previous.hp/previous.maxHp)<1e-10);assert.equal(u.maxHp,Math.round(previous.maxHp*(u.honroVariant==='bat'?56/70:70/88)));}}
for(let n=0;n<2;n++){a.export();await h.import(await h.exported());a.continue();h.finish(a);assert.deepEqual(plain(a.engine.b),after,'Full battle remains byte-exact after repeated production imports');}
rows.push({check:'actual old R2 HP fractions, SP, resources, App import/export repeat2',pass:true});
const q=battlefield(g,2),flyers=q.b.units.filter(C.flyingEnemy);assert.equal(q.b.enemyLimit,3);
for(const u of flyers){assert(C.flightClear(q.e,u,u));assert.equal(u.honroAirborneBalanceRevision,1);assert.equal(C.defenseForUnit(u).form,1.15);}
assert(q.b.honroMap.flightRegion);rows.push({check:'new Stage2 flightRegion plus fresh species balancing and cap3',flyers:flyers.map(u=>({id:u.id,hp:u.maxHp,form:C.defenseForUnit(u).form}))});
await mkdir(out,{recursive:true});await writeFile(out+'/combined-contracts.json',JSON.stringify({pass:true,scope:'Candidate integration, save-order fixtures and real App save path; not normal combat.',rows},null,2));console.log('PASS',rows.map(r=>r.check));
