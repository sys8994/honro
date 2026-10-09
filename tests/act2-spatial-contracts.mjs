import {withHistoricalStage18} from './stage30-ferry-history-helpers.mjs';
import {beforeStage16TempleContent,beforeStage16TempleUnitContracts} from './stage16-temple-history-helpers.mjs';
import {beforeStage11RavineBalance,beforeStage11RavineContent,beforeStage11RavineUnitContracts} from './stage11-ravine-history-helpers.mjs';
import {beforeStage17WorksiteContent,beforeStage17WorksiteUnitContracts} from './stage17-worksite-history-helpers.mjs';
import {beforeGuardianStory} from './guardian-tree-history-helpers.mjs';
import {historicalSceneRoster} from './staging-history-helpers.mjs';
import {act12Balance,act12Archetypes} from './campaign-scope-helpers.mjs';
import assert from 'node:assert/strict';
import {beforeExistenceProfiles,beforeExistenceRoster} from './existence-delta-helpers.mjs';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {plain,hash,semanticContent,unitContract} from './act2-spatial-contract-helpers.mjs';

const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
const frozen=JSON.parse(await readFile('tests/fixtures/act2-spatial-contracts.json','utf8'));
const balanceSource=await readFile('game/config/balance.json','utf8');
const readLegacy=await readFile('tests/fixtures/act2-spatial-legacy-save.json','utf8');
const checks=[];
function check(name,fn){fn();checks.push({name,passed:true});console.log('PASS',name);}
// ACT1 is now an authorized design surface. Its separately frozen gameplay
// contracts replace the obsolete whole-map hash without weakening ACT2 checks.
const act1Frozen=JSON.parse(await readFile('tests/fixtures/act1-spatial-contracts.json','utf8'));
check('Act 1 mission, recruitment and combat semantics remain unchanged beyond the reviewed roster delta',()=>{
 const currentProject=g.HONRO_PROJECT;
 try{
  g.HONRO_PROJECT=beforeExistenceRoster(currentProject);
 for(const before of act1Frozen.stages){const q=battlefield(g,before.id);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);const {w,h,map,...content}=q.st,old=plain(before.content);
  // The approved receiver entrance now reveals Sodan on-site. Its dialogue and
  // visibility are verified by story-staging, while these mission/stats remain frozen.
  if(before.id===9){for(const key of ['narration','story','storyFollowups']){delete content[key];delete old[key];}}
  assert.deepEqual(beforeGuardianStory(content,before.id),old);assert.deepEqual(plain(historicalSceneRoster(q.b,before.units).map(unitContract)),before.units);assert.deepEqual(plain(g.HonroStageRules.stageParty(before.id)),before.party);}
 }finally{g.HONRO_PROJECT=currentProject;}
 assert.equal(g.HONRO_PROJECT,currentProject,'Later acts and saved-battle checks use the current project');
});
check('All class stats and skill definitions retain the frozen balance',()=>{
 assert.deepEqual(plain(C.CLASSES),frozen.classes);
 assert.deepEqual(beforeExistenceProfiles(C.SKILLS),frozen.skills);
 assert.deepEqual(plain(act12Archetypes(g.HonroWorld.archetypes)),frozen.archetypes);
 assert.deepEqual(act12Balance(beforeStage11RavineBalance(JSON.parse(balanceSource))),frozen.balance);
});
for(const before of frozen.stages)check(`${before.id}: objective order, classes, radii, scripts, waves, enemy stats and cohorts are frozen`,()=>{
 const audit=()=>{
 const q=battlefield(g,before.id);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct2.attach(q.app,q.e);
 const content=semanticContent(q.st),units=plain(q.b.units.map(unitContract));
 assert.deepEqual(before.id===11?beforeStage11RavineContent(content):before.id===17?beforeStage17WorksiteContent(content):before.id===16?beforeStage16TempleContent(content):content,before.content,'Only exact reviewed Stage11/16/17 deltas may change content planning');
 assert.deepEqual(before.id===11?beforeStage11RavineUnitContracts(units):before.id===17?beforeStage17WorksiteUnitContracts(units):before.id===16?beforeStage16TempleUnitContracts(units):units,before.units,'Only exact reviewed Stage11/16/17 roster deltas may change roster or XP allocation');
 assert.deepEqual(plain(g.HonroStageRules.stageParty(before.id)),before.party);
 };if(before.id===18||before.id===19)withHistoricalStage18(g,audit);else audit();
});
check('A real pre-redesign partial revision-2 save keeps its geometry, units and progress on resume',()=>{
 const saved=JSON.parse(readLegacy),b=plain(saved.b),st=g.HONRO_CONTENT.stages[13];
 const contract=b=>plain({terrain:b.terrain,waters:b.waters,width:b.width,height:b.height,routePoints:b.routePoints,markers:b.honroMarkers,steps:b.honroAct2Steps,state:b.honroState,items:b.items,heroes:b.heroes,round:b.round,units:b.units.map(u=>({...unitContract(u),x:u.x,y:u.y,dead:u.dead})),honroMap:b.honroMap});
 const before=contract(b),e=new C.Engine(b,()=>{},false),app={engine:e,stage:st,profile:plain(saved.profile),training:false,sayLines(){},event(){},checkMission(){return false;}};
 g.HonroStageRules.sanitizeStageBattle(b);g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);
 assert.deepEqual(contract(b),before,'Resume must not replace live geometry or reset progress to the fresh room plan');
 const once=contract(b);g.HonroStageRules.sanitizeStageBattle(b);g.HonroAct2.attach(app,e);assert.deepEqual(contract(b),once,'Resume migration must be idempotent');
 assert.equal(b.honroState.act2.holds['hold-refuge'].spawned,4);
 assert.equal(b.items.heal,1);
});
await mkdir('_local/reports/act2-spatial',{recursive:true});
await writeFile('_local/reports/act2-spatial/contracts.json',JSON.stringify({sourceCommit:frozen.sourceCommit,checks,limitations:'Semantic and save regressions only; this is not a normal-combat playthrough or a rendered-art approval.'},null,2));
console.log(`PASS ${checks.length} frozen semantic/save contracts`);
