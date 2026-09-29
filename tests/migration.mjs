import assert from 'node:assert/strict';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {legacyRuntime,migrate} from '../migration/migrate-stages.mjs';
import vm from 'node:vm';
const g=await runtime(),old=await legacyRuntime(),plain=x=>JSON.parse(JSON.stringify(x)),rows=[];
const project=JSON.parse(await readFile(new URL('../shared/data/campaign.json',import.meta.url),'utf8'));
const baseline=plain(await migrate());
vm.runInContext(await readFile(new URL('../workshop/recipes/stage12-forest-basin.js',import.meta.url),'utf8'),g);
assert.deepEqual(plain(g.HonroCommands.apply(baseline,g.HonroStage12Design.commands(baseline))),project,'Migration plus Workshop design must be reproducible');
assert.deepEqual(project.stages.slice(2),baseline.stages.slice(2),'Unedited stages retain original data');
for(let id=1;id<=10;id++){
 // The original import remains lossless. Stage 1/2 intentionally use the separately tested Workshop redesign.
 g.HONRO_PROJECT=id<=2?baseline:project;
 for(const difficulty of ['story','normal','veteran']){
  const p=g.HonroMaps.profileFor(project.stages[id-1]);p.settings.difficulty=difficulty;
  const a=battlefield(old,id,{profile:plain(p)}).b,b=g.HonroMaps.createBattle(g.HONRO_PROJECT.stages[id-1],g.HONRO_PROJECT,plain(p),{legacyBalance:true});
  g.HonroStageRules.sanitizeStageBattle(b);new g.HONRO_CORE.Engine(b,()=>{},true);
  assert.deepEqual(plain(b.terrain),plain(a.terrain),`Stage ${id} ${difficulty} terrain`);
  assert.deepEqual(plain(b.honroSurfaceZones).map(({terrainId,...z})=>z),plain(a.honroSurfaceZones),`Stage ${id} materials`);
  for(const field of ['honroEvents','honroMarkers','honroMapAnchors','honroMap','honroRoute','honroDetailStats','honroState','honroGrowth'])
   assert.deepEqual(plain(b[field]),plain(a[field]),`Stage ${id} ${difficulty} ${field}`);
  assert.equal(b.units.length,a.units.length);
  for(const u of a.units){const v=b.units.find(v=>v.id===u.id);assert.ok(v,u.id);for(const [key,value] of Object.entries(plain(u)))assert.deepEqual(plain(v[key]),value,`Stage ${id} ${difficulty} ${u.id}.${key}`);}
  for(let i=0;i<a.honroLandmarks.length;i++){const original=plain(a.honroLandmarks[i]),actual=plain(b.honroLandmarks[i]);for(const [key,value] of Object.entries(original))assert.deepEqual(actual[key],value,`Stage ${id} landmark ${i}.${key}`);}
 }
 const st=project.stages[id-1],roundtrip=g.HonroMaps.normalize(JSON.parse(g.HonroMaps.serialize(project)));
 assert.deepEqual(plain(roundtrip),project,`Stage ${id} lossless round-trip`);
 rows.push({stage:id,terrain:st.terrains.length,units:st.units.length,passed:true});console.log('PASS migrated stage',id);
}
g.HONRO_PROJECT=project;
await mkdir('_local/reports',{recursive:true});await writeFile('_local/reports/migration.json',JSON.stringify({rows,reproducible:true,redesignedStages:[1,2],comparison:'Original import for 1/2; unchanged active stages 3-10. Workshop recipe reproduction verified for the complete active project.',difficulties:['story','normal','veteran'],roundTrip:true},null,2)+'\n');
