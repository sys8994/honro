import assert from 'node:assert/strict';
import {beforeExistenceProfiles} from './existence-delta-helpers.mjs';
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
check('Act 1 mission, recruitment and combat semantics remain unchanged',()=>{
 for(const before of act1Frozen.stages){const q=battlefield(g,before.id);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);const {w,h,map,...content}=q.st;assert.deepEqual(plain(content),before.content);assert.deepEqual(plain(q.b.units.map(unitContract)),before.units);assert.deepEqual(plain(g.HonroStageRules.stageParty(before.id)),before.party);}
});
check('All class stats and skill definitions retain the frozen balance',()=>{
 assert.deepEqual(plain(C.CLASSES),frozen.classes);
 assert.deepEqual(beforeExistenceProfiles(C.SKILLS),frozen.skills);
 assert.deepEqual(plain(g.HonroWorld.archetypes),frozen.archetypes);
 assert.deepEqual(JSON.parse(balanceSource),frozen.balance);
});
for(const before of frozen.stages)check(`${before.id}: objective order, classes, radii, scripts, waves, enemy stats and cohorts are frozen`,()=>{
 const q=battlefield(g,before.id);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct2.attach(q.app,q.e);
 assert.deepEqual(semanticContent(q.st),before.content,'Content is not a geometry-edit surface');
 assert.deepEqual(plain(q.b.units.map(unitContract)),before.units,'Unit re-placement must not rebalance or reassign cohorts');
 assert.deepEqual(plain(g.HonroStageRules.stageParty(before.id)),before.party);
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
