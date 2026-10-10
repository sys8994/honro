/** Combat-only integration. Exact existing geography/art/NPC/mission data win
 * over regenerated author defaults, even when a source author owns more fields. */
import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';import{pathToFileURL}from'node:url';
import{authorStage8Bier}from'./stage8-bier.mjs';import{authorStage11RavineEncounters}from'./stage11-ravine-encounters.mjs';import{authorStage12Quarry}from'./apply-stage12-quarry.mjs';import{applyStage16Temple}from'./stage16-temple.mjs';import{applyStage17Worksite}from'./stage17-worksite.mjs';import{applyStage18Bell}from'./stage18-bell.mjs';import{authorStage23LoadingYard}from'./stage23-loading-yard.mjs';import{applyStage30Ferry}from'./stage30-ferry.mjs';
export const DENSITY_STAGES=[8,11,12,16,17,18,23,30];const clone=x=>JSON.parse(JSON.stringify(x));
export async function authorEncounterDensity(input,g,{stages=DENSITY_STAGES}={}){const p=clone(input);
 for(const id of stages){let candidate=clone(input);if(id===8)candidate=await authorStage8Bier(candidate,g,{roster:'density36e9',art:false});if(id===11)authorStage11RavineEncounters(g,candidate);if(id===12)candidate=await authorStage12Quarry(candidate,g,{roster:'density38e10',art:false});if(id===16)applyStage16Temple(candidate);if(id===17)applyStage17Worksite(candidate);if(id===18)applyStage18Bell(candidate,{steps:g.HonroStage18Bell.steps});if(id===23)candidate=await authorStage23LoadingYard(g,candidate,{roster:'density40e10',art:false});if(id===30)candidate=applyStage30Ferry(g,candidate,{roster:'density40e10'});
  const a=candidate.stages[id-1],s=p.stages[id-1],old=clone(s),protectedUnits=s.units.filter(u=>u.team!=='enemy');
  s.units=[...protectedUnits,...clone(a.units.filter(u=>u.team==='enemy'))];s.encounters=clone(a.encounters);s.events=clone(a.events);
  s.initialState=clone(a.initialState);
  // Preserve authoritative mission progression data and initial scene state.
  for(const k of ['honroState','honroAct2Steps','honroAct3Steps','honroStage8BierSpec'])if(k==='honroStage8BierSpec'){if(old.initialState[k])s.initialState[k].movement=clone(old.initialState[k].movement);}else if(old.initialState[k])s.initialState[k]=clone(old.initialState[k]);
  const key={8:'bier',11:'ravine',12:'quarry',16:'temple',17:'worksite',18:'bell',23:'act3',30:'act3'}[id];
  if(id===8)for(const k of ['initial','ordinary','elites','finite','activeLimit'])s.design.bier[k]=a.design.bier[k];
  else if([23,30].includes(id)){s.design.act3.encounterPlan=clone(a.design.act3.encounterPlan);if(a.design.act3.responses)s.design.act3.responses=clone(a.design.act3.responses);}
  else s.design[key].encounters=clone(a.design[key].encounters);
  if(a.design.space?.encounterSites&&s.design.space)s.design.space.encounterSites=clone(a.design.space.encounterSites);if(a.design.encounterDensity)s.design.encounterDensity=clone(a.design.encounterDensity);
  for(const field of ['terrains','materials','elements','markers','objectives','routes','anchors','environment'])assert.deepEqual(s[field],old[field],`Stage ${id}: preserve ${field}`);
  assert.deepEqual(s.units.filter(u=>u.team!=='enemy'),old.units.filter(u=>u.team!=='enemy'),`Stage ${id}: protected NPC/players exact`);
 }
 for(const s of p.stages)if(!stages.includes(s.metadata.stageId))assert.deepEqual(s,input.stages.find(o=>o.metadata.stageId===s.metadata.stageId),'Other22 stages exact');assert.deepEqual(p.library,input.library,'All art exact');return p;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const {runtime}=await import('../../game/tests/helpers.mjs'),g=await runtime({legacyMaps:false}),source=JSON.parse(await readFile('shared/data/campaign.json','utf8')),stages=(process.env.HONRO_STAGES||DENSITY_STAGES.join(',')).split(',').map(Number),p=await authorEncounterDensity(source,g,{stages});await writeFile('shared/data/campaign.json',JSON.stringify(p,null,2)+'\n');console.log('Combat-only author',stages.join(','),p.stages.filter(s=>stages.includes(s.metadata.stageId)).map(s=>[s.metadata.stageId,s.units.filter(u=>u.team==='enemy').length,s.initialState.honroEncounterDensityPopulationCap]));}
