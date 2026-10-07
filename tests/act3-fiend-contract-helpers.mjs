import {beforeObjectiveRevision} from './objective-delta-helpers.mjs';
import {beforeGraniteVisuals} from './granite-delta-helpers.mjs';
import {beforePlatformPassages} from './platform-passage-delta-helpers.mjs';
import {beforeCaveBatRevision,caveBatRevision} from './act2-cave-bat-delta-helpers.mjs';
// The fiend revision freezes combat/mission identity, not subsequently approved
// Korean architecture, optional roofs, placement or schema-default geometry.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const encounterRevision=JSON.parse(readFileSync(new URL('./fixtures/act3-encounter-contract.json',import.meta.url),'utf8'));
const locationRevision=JSON.parse(readFileSync(new URL('./fixtures/act3-location-semantic-contract.json',import.meta.url),'utf8'));
const refinementRevision=JSON.parse(readFileSync(new URL('./fixtures/act3-refinement-delta.json',import.meta.url),'utf8'));
// Reverse only this request's explicit additions. The older contracts still
// reject changes to mission rules, unit identity, protection or combat tuning.
function beforeRefinementRevision(project,archetypes){
 const out=plain(project);
 for(const reviewed of refinementRevision.rows){
  const map=out.stages.find(s=>s.metadata.stageId===reviewed.id);
  assert.equal(map.initialState.honroAct3ResponseRevision,1,'Finite response revision '+reviewed.id);
  assert.equal(map.initialState.honroAct3SceneryRevision,1,'Authored scenery revision '+reviewed.id);
  assert.deepEqual(map.events,reviewed.afterEvents,'Exact reviewed response triggers, entries and counts '+reviewed.id);
  map.events=plain(reviewed.beforeEvents);delete map.initialState.honroAct3ResponseRevision;delete map.initialState.honroAct3SceneryRevision;
  for(const change of reviewed.kinds){const u=map.units.find(u=>u.id===change.id);assert(u,'Reviewed species identity '+change.id);assert.equal(u.kind,change.after,'Reviewed species '+change.id);u.kind=change.before;}
 }
 for(const [id,definition]of Object.entries(refinementRevision.newArchetypes))assert.deepEqual(plain(archetypes[id]),definition,'Reviewed new fiend body and attacks '+id);
 return out;
}
function beforeEncounterRevision(actual,saved){
 if(actual.initialState.honroAct3EncounterRevision!==1)return actual;
 const reviewed=encounterRevision.rows.find(q=>q.id===actual.metadata.stageId);assert(reviewed,'Reviewed encounter revision');
 assert.deepEqual(actual.units.filter(u=>u.team==='enemy'),reviewed.units,'Exact reviewed enemy roles, kinds and tuning');
 assert.deepEqual(actual.encounters,reviewed.encounters,'Exact reviewed encounter groups');
 assert.equal(actual.stage.enemies,reviewed.initialEnemies);assert.equal(actual.balance.initialEnemies,reviewed.initialEnemies);assert.equal(actual.balance.maxAlive,reviewed.maxAlive);
 const out=plain(actual);out.units=[...out.units.filter(u=>u.team!=='enemy'),...saved.units.filter(u=>u.team==='enemy')];out.encounters=plain(saved.encounters);delete out.initialState.honroAct3EncounterRevision;out.stage.enemies=saved.stage.enemies;out.balance.initialEnemies=saved.balance.initialEnemies;out.balance.maxAlive=saved.balance.maxAlive;return out;
}
import {createHash} from 'node:crypto';
import vm from 'node:vm';
export const plain=value=>JSON.parse(JSON.stringify(value));
export const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const kindRenames=Object.freeze({recoveryGuard:'possessedGuard',recoveryArcher:'possessedArcher'});
const kind=id=>kindRenames[id]||id;
const without=(value,keys)=>Object.fromEntries(Object.entries(plain(value)).filter(([key])=>!keys.includes(key)));
const sorted=values=>values.sort((a,b)=>a.id.localeCompare(b.id));
const step=s=>{const out=without(s,['label']);if(out.wave)out.wave.kind=kind(out.wave.kind);return out;};
export function projectRules(project){return {schema:project.schema,version:project.version,environmentVersion:project.environmentVersion,settings:plain(project.settings)};}
export function missionContract(map,stage,balance){
 const initialState=without(map.initialState||{},['sceneVersion']);
 return plain({
  id:map.id,metadata:plain(map.metadata),initialState,
  // Body/combat/protection overrides remain exact, including facing, class,
  // rank, HP, behavior, cohort and spawnIndex. Only world x/y may be reauthored.
  units:map.units.map(u=>({...without(u,['x','y']),kind:kind(u.kind)})),
  markers:sorted(map.markers.map(m=>without(m,['x','y','label','fireSite']))),
  devices:sorted(map.terrains.filter(t=>t.properties?.honroAct3Target||t.properties?.honroAct3Gate).map(t=>({id:t.id,type:t.type,baseMaterial:t.baseMaterial,oneWay:t.oneWay,breakable:t.breakable,properties:plain(t.properties)}))),
  objectives:plain(map.objectives),events:plain(map.events),encounters:plain(map.encounters),
  stage:{id:stage.id,act:stage.act,actStage:stage.actStage,level:stage.level,objective:stage.objective,requires:plain(stage.requires),active:stage.active,enemies:stage.enemies,playableRoster:plain(stage.playableRoster),steps:stage.steps.map(step)},
  balance:plain(balance)
 });
}
export function archetypeContract(archetypes){return Object.fromEntries(Object.entries(archetypes).filter(([id])=>Object.hasOwn(kindRenames,id)||Object.values(kindRenames).includes(id)).map(([id,a])=>[kind(id),without(a,['name','intent','act3Human','act3Fiend'])]));}
export function assertFiendContract(project,content,balance,archetypes,baseline){
 project=beforeRefinementRevision(project,archetypes);
 ({project,content}=beforeObjectiveRevision(project,content));
 assert.equal(project.stages.length,30,'All thirty canonical maps remain required');
 assert.deepEqual(project.stages.map(s=>s.metadata.stageId),Array.from({length:30},(_,i)=>i+1),'Canonical ordering');
 assert.deepEqual(projectRules(project),baseline.projectRules,'Global gameplay/schema settings');
 const legacyProject=beforeCaveBatRevision(beforeGraniteVisuals(beforePlatformPassages(plain(project))));
 const assetIds=project.library.map(a=>a.id);assert.equal(new Set(assetIds).size,assetIds.length,'Unique library IDs');
 for(const a of baseline.legacyAssets){const current=legacyProject.library.find(v=>v.id===a.id);assert(current,'Missing original asset '+a.id);assert.equal(hash(current),a.sha256,'Original Act 1/2 asset '+a.id);}
 for(const saved of baseline.legacyMaps){const current=legacyProject.stages.find(s=>s.metadata.stageId===saved.id);assert.equal(hash(current),saved.sha256,'Complete original Act 1/2 map '+saved.id);}
 for(const saved of baseline.act3){const id=saved.metadata.stageId,current=project.stages.find(s=>s.metadata.stageId===id),actual=missionContract(current,content.stages[id-1],balance.stages[id-1]);if(current.initialState.honroLocationRevision===1){const reviewed=locationRevision.rows.find(row=>row.metadata.stageId===id);assert(reviewed,'Reviewed location contract '+id);assert.deepEqual(actual,reviewed,'Exact approved location combat/mission contract '+id);}else assert.deepEqual(beforeEncounterRevision(actual,saved),saved,'Act 3 combat/mission contract '+id);}
 assert.deepEqual(archetypeContract(archetypes),baseline.archetypes,'Fiend body and attack definitions');
 // The compatibility rename is used only to derive the historical fixture.
 // Active production must contain the new fiends, never the old troop IDs.
 for(const s of project.stages.slice(20))for(const u of s.units)assert(!Object.hasOwn(kindRenames,u.kind),'Retired enemy kind '+u.kind);
 for(const s of content.stages.slice(20))for(const q of s.steps)if(q.wave)assert(!Object.hasOwn(kindRenames,q.wave.kind),'Retired reinforcement kind');
 const fiends=project.stages.slice(20).flatMap(s=>s.units).filter(u=>Object.values(kindRenames).includes(u.kind));
 const revised=project.stages.slice(20).every(s=>s.initialState.honroAct3EncounterRevision===1);const expected=revised?project.stages.slice(20).flatMap(s=>(s.initialState.honroLocationRevision===1?locationRevision.rows.find(q=>q.metadata.stageId===s.metadata.stageId):encounterRevision.rows.find(q=>q.id===s.metadata.stageId)).units).filter(u=>Object.values(kindRenames).includes(u.kind)).length:baseline.fiendCount;assert.equal(fiends.length,expected,'Exact approved fiend roster size');assert(fiends.every(u=>u.team==='enemy'),'Fiends remain enemies');
}
// Content-only loading: no engine/renderer, dependency build, saved profile or
// browser. A historical reader can use git show for the named source revision.
export async function contractContent(read){
 const balance=JSON.parse(await read('game/config/balance.json'));
 const g=vm.createContext({HONRO_CORE:{SKILLS:{}},HONRO_BALANCE:plain(balance),HonroWorld:{archetypes:{}}});
 for(const name of ['content','story-content','act2-content','act2-plan','act2-drama','act3-content'])vm.runInContext(await read(`shared/runtime/${name}.js`),g,{filename:name});
 return {content:plain(g.HONRO_CONTENT),balance,archetypes:plain(g.HonroWorld.archetypes)};
}
// Keep the scope itself testable: a reviewed roof/placement change may pass,
// while identity, protection, combat tuning and mission changes must fail.
export function assertFiendContractScope(project,content,balance,archetypes,baseline){
 const p=plain(project),c=plain(content),b=plain(balance),a=plain(archetypes),map=p.stages[22];
 map.units[0].x+=41;map.units[0].y-=18;map.markers[0].x+=60;map.markers[0].y-=24;
 map.markers[0].label='표현만 다듬은 안내';map.terrains[0].detail={spacing:18,roughness:0,seed:1,optimizeEpsilon:0};map.terrains[0].points[0].y+=7;
 map.design.act3.optionalRoutes.push({id:'reviewed-roof-fixture',points:[{x:0,y:0},{x:10,y:0}]});
 const art=p.library.find(x=>x.id.startsWith('a3-'));assert(art);art.name+=' · reviewed art fixture';
 assertFiendContract(p,c,b,a,baseline);
 const rejects=(label,mutate)=>{const q=plain(project),r=plain(content),v=plain(balance),defs=plain(archetypes);mutate(q,r,v,defs);assert.throws(()=>assertFiendContract(q,r,v,defs,baseline),undefined,label);};
 rejects('old map data',q=>q.stages[0].units[0].x++);
 rejects('reviewed cave bat kind',q=>q.stages[12].units.find(u=>u.id===caveBatRevision.rows[0].kinds[0].id).kind='honroSpirit');
 rejects('old shared art',q=>q.library.find(v=>v.id===baseline.legacyAssets[0].id).name+=' changed');
 rejects('unit identity',q=>q.stages[22].units.find(u=>u.team==='enemy').id+='-changed');
 rejects('unit kind',q=>q.stages[22].units.find(u=>u.team==='enemy').kind='ghost');
 rejects('unit side',q=>q.stages[22].units.find(u=>u.team==='enemy').team='ally');
 rejects('unit stats',q=>q.stages[22].units.find(u=>u.team==='enemy').stageOverrides.hp=1);
 rejects('NPC protection',q=>q.stages[22].units.find(u=>u.team==='npc').stageOverrides.honroProtected=false);
 rejects('marker identity',q=>q.stages[22].markers[0].id+='-changed');
 rejects('marker target',q=>q.stages[22].markers.find(m=>m.target==='act3-carrier').target='missing');
 rejects('marker action',q=>q.stages[22].markers.find(m=>m.action).action='other');
 rejects('required class',q=>q.stages[26].markers.find(m=>m.requiredClass).requiredClass='mage');
 rejects('device durability',q=>q.stages[21].terrains.find(t=>t.properties?.honroAct3Gate).properties.hp++);
 rejects('initial active limit',q=>q.stages[22].initialState.honroActiveLimit++);
 rejects('objective order',(_,r)=>r.stages[22].steps.reverse());
 rejects('hold rules',(_,r)=>r.stages[24].steps.find(s=>s.kind==='hold').rounds++);
 rejects('class requirement',(_,r)=>r.stages[26].steps[0].requiredClass='mage');
 rejects('growth/combat budget',(_,r,v)=>v.stages[22].targetHits++);
 rejects('archetype attack',(_,r,v,defs)=>defs.possessedGuard.skills=['S01']);
 rejects('new species attack',(_,r,v,defs)=>defs.archiveFiend.skills=['S01']);
 rejects('response population',q=>q.stages[22].events.find(e=>e.id.startsWith('act3-response-')).action.n++);
 rejects('response prerequisite',q=>q.stages[22].events.find(e=>e.id.startsWith('act3-response-')).when.objectiveDone='missing');
}
