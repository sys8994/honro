import {historicalSceneRoster} from './staging-history-helpers.mjs';
import {act12Balance,act12Archetypes} from './campaign-scope-helpers.mjs';
import {beforePlatformPassages,beforePlatformTerrain} from './platform-passage-delta-helpers.mjs';
// Frozen pre-redesign gameplay and old live-save compatibility. Placement is an
// allowed authoring surface; stats, skills, mission rules and AI roles are not.
import assert from 'node:assert/strict';
import {beforeExistenceRoster,beforeExistenceProfiles} from './existence-delta-helpers.mjs';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {act1Runtime,fixture,plain,hash,semanticContent,unitContract,reportRoot,canonicalGameplay} from './act1-spatial-test-helpers.mjs';
const g=await act1Runtime(),C=g.HONRO_CORE,frozen=JSON.parse(await readFile('tests/fixtures/act1-spatial-contracts.json','utf8')),checks=[],awaitText=await readFile('game/config/balance.json','utf8');
g.HONRO_PROJECT=beforeExistenceRoster(g.HONRO_PROJECT);
function check(name,fn){fn();checks.push({name,passed:true});console.log('PASS',name);}
check('ACT2 playable canonical maps retain frozen content through the domain projection',()=>{const stages=plain(g.HONRO_PROJECT.stages.slice(10,20));for(const st of stages){delete st.playBounds;delete st.terrainBounds;delete st.terrainDomainVersion;st.terrains=st.terrains.map(t=>{const q=plain(g.HonroTerrainDomain.projection(t));delete q.playProjection;return q;});}assert.equal(hash(stages),frozen.act2);});
check('Every class, skill, enemy archetype and balance source is unchanged',()=>{assert.deepEqual(plain(C.CLASSES),frozen.classes);assert.deepEqual(beforeExistenceProfiles(C.SKILLS),frozen.skills);assert.deepEqual(plain(act12Archetypes(g.HonroWorld.archetypes)),frozen.archetypes);assert.deepEqual(act12Balance(JSON.parse(awaitText)),frozen.balance);});
for(const before of frozen.stages)check(`${before.id}: story, objectives, waves, party and combat stats unchanged`,()=>{
 const {b,st}=fixture(g,before.id),authored=canonicalGameplay(beforePlatformPassages(g.HONRO_PROJECT).stages[before.id-1]),prior=plain(before.authoredGameplay),geometry=new Set(['points','control','floor','thickness','type','playProjection']);if(before.id===7)authored.terrain=authored.terrain.filter(t=>t.id!=='root-reentry');for(const data of [authored,prior])data.terrain=data.terrain.map(t=>Object.fromEntries(Object.entries(t).filter(([key])=>!geometry.has(key))));assert.deepEqual(authored,prior,'Authored collision flags, AI goals, mission state and items; exact geometry frozen separately in terrain-domain-baseline');assert.deepEqual(semanticContent(st),before.content);assert.deepEqual(plain(historicalSceneRoster(b,before.units).map(unitContract)),before.units);assert.deepEqual(plain(g.HonroStageRules.stageParty(before.id)),before.party);
 assert.deepEqual(plain(b.honroMarkers.filter(m=>m.action).map(({x,y,...m})=>m)),before.markers);
 for(const t of before.terrain){const actual=beforePlatformTerrain(b.terrain,before.id,g).find(a=>a.id===t.id);assert(actual,t.id);for(const [k,v] of Object.entries(t))assert.deepEqual(plain(actual[k]),v,t.id+'.'+k);}
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
