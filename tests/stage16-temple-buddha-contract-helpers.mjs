import {beforeStage18BellFingerprintParts} from './stage12-quarry-history-helpers.mjs';
/** Portable gameplay identity for the additive stone-Buddha art audit. */
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {runtimeParts} from '../shared/build.mjs';
import {battlefield} from '../game/tests/helpers.mjs';
export const buddhaHash=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
export const buddhaPlain=value=>JSON.parse(JSON.stringify(value));
export const templeFullplayGameplayProjectSha256='164bc145809ac88c35b1486d47a77f8217de9680f3938efe7e9c1298b287217b';
export const templeFullplayGameplayRuntimeSha256='a35992a4a3482875861dfb7efaf5799b083ba96aa19a26e8fa90b20a4aa7d773';
export async function templeGameplayFingerprints(g){
 const stage=g.HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===16),parts=await runtimeParts({vector:false,render:false});
 return{
  project:buddhaHash({terrain:stage.terrains,units:stage.units,markers:stage.markers,anchors:stage.anchors,initialState:stage.initialState,events:stage.events,objectives:stage.objectives,materials:stage.materials,content:g.HONRO_CONTENT.stages[15]}),
  runtime:buddhaHash(beforeStage18BellFingerprintParts([...parts.filter(s=>!s.startsWith('globalThis.HONRO_PROJECT=')),...await Promise.all(['main','story','interactions','rest-journey','training'].map(f=>readFile(`shared/runtime/${f}.js`,'utf8')))]).join('\n'))
 };
}
export function templeBattleContract(g,project){
 const saved=g.HONRO_PROJECT;
 try{
  g.HONRO_PROJECT=project;
  const q=battlefield(g,16);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct2.attach(q.app,q.e);
  const keys=['terrain','honroWorldTerrain','units','honroMarkers','honroEvents','honroState','honroAct2Steps','honroTempleDefenseEntries','waters','honroSurfaceZones','routePoints','width','height','enemyLimit','honroActiveLimit','honroGrowth','honroParty','items'];
  return buddhaPlain({battle:Object.fromEntries(keys.map(key=>[key,q.b[key]])),sourceInitialState:project.stages.find(s=>s.metadata.stageId===16).initialState,protectedNpcs:q.b.units.filter(u=>u.honroProtected||u.honroCivilian),content:q.st,balance:g.HONRO_BALANCE.stages[15],plan:g.HonroAct2Plan.stages[5]});
 }finally{g.HONRO_PROJECT=saved;}
}
export function templeSaveContract(b){
 const keys=['units','terrain','waters','honroWorldTerrain','routePoints','items','round','phase','side','active','honroState','honroGrowth','honroMarkers','honroEvents','honroAuthoredEvents','honroAct2Steps','honroObjectives','honroCounters','honroTempleDefenseEntries','honroMap','honroElements','honroEnvironment','honroLandmarks','honroMapAnchors','honroPlayBounds','honroTerrainBounds','honroSurfaceZones','honroCamera','width','height','heroes','honroStage16EncounterRevision','honroTempleVersion','honroJourneyReplay','projectiles','queue','wind','reinforced','honroStaging','encounter','enemyLimit','honroActiveLimit','honroStory'];
 return buddhaPlain(Object.fromEntries(keys.map(key=>[key,b[key]])));
}
