// Frozen pre-redesign gameplay and old live-save compatibility. Placement is an
// allowed authoring surface; stats, skills, mission rules and AI roles are not.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {act1Runtime,fixture,plain,hash,semanticContent,unitContract,reportRoot,canonicalGameplay} from './act1-spatial-test-helpers.mjs';
const g=await act1Runtime(),C=g.HONRO_CORE,frozen=JSON.parse(await readFile('tests/fixtures/act1-spatial-contracts.json','utf8')),checks=[],awaitText=await readFile('game/config/balance.json','utf8');
function check(name,fn){fn();checks.push({name,passed:true});console.log('PASS',name);}
check('ACT2 canonical maps remain unchanged by ACT1 authoring',()=>assert.equal(hash(g.HONRO_PROJECT.stages.slice(10)),frozen.act2));
check('Every class, skill, enemy archetype and balance source is unchanged',()=>{assert.deepEqual(plain(C.CLASSES),frozen.classes);assert.deepEqual(plain(C.SKILLS),frozen.skills);assert.deepEqual(plain(g.HonroWorld.archetypes),frozen.archetypes);assert.deepEqual(JSON.parse(awaitText),frozen.balance);});
for(const before of frozen.stages)check(`${before.id}: story, objectives, waves, party and combat stats unchanged`,()=>{
 const {b,st}=fixture(g,before.id);assert.deepEqual(canonicalGameplay(g.HONRO_PROJECT.stages[before.id-1]),before.authoredGameplay,'Authored collision flags, AI goals, mission state and items');assert.deepEqual(semanticContent(st),before.content);assert.deepEqual(plain(b.units.map(unitContract)),before.units);assert.deepEqual(plain(g.HonroStageRules.stageParty(before.id)),before.party);
 assert.deepEqual(plain(b.honroMarkers.filter(m=>m.action).map(({x,y,...m})=>m)),before.markers);
 for(const t of before.terrain){const actual=b.terrain.find(a=>a.id===t.id);assert(actual,t.id);for(const [k,v] of Object.entries(t))assert.deepEqual(plain(actual[k]),v,t.id+'.'+k);}
});
const awaitTextSaves=Object.fromEntries(await Promise.all([1,5,7,10].map(async id=>[id,await readFile(`tests/fixtures/act1-spatial-legacy-save-${id}.json`,'utf8')])));
for(const id of [1,5,7,10])check(`${id}: frozen pre-redesign live save keeps exact geometry, actors and progress`,()=>{
 const save=JSON.parse(awaitTextSaves[id]),b=plain(save.b);
 const contract=b=>plain({width:b.width,height:b.height,terrain:b.terrain,waters:b.waters,units:b.units,state:b.honroState,round:b.round,items:b.items,markers:b.honroMarkers,map:b.honroMap,anchors:b.honroMapAnchors,route:b.routePoints});
 const before=contract(b),e=new C.Engine(b,()=>{},false),app={engine:e,stage:g.HONRO_CONTENT.stages[id-1],profile:save.profile,training:false,event(){},sayLines(){},checkMission(){return false;}};
 g.HonroStageRules.sanitizeStageBattle(b);g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);assert.deepEqual(contract(b),before);
 g.HonroStageRules.sanitizeStageBattle(b);g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);assert.deepEqual(contract(b),before,'resume must be idempotent');
});
const out=reportRoot();await mkdir(out,{recursive:true});await writeFile(`${out}/contracts.json`,JSON.stringify({sourceCommit:frozen.sourceCommit,checks,limits:'Frozen semantics and save fixtures; not normal-combat or visual approval'},null,2)+'\n');
