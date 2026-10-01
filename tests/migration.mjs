import assert from 'node:assert/strict';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {legacyRuntime,migrate} from '../migration/migrate-stages.mjs';
import vm from 'node:vm';
const g=await runtime(),old=await legacyRuntime(),plain=x=>JSON.parse(JSON.stringify(x)),rows=[];
const project=JSON.parse(await readFile(new URL('../shared/data/campaign.json',import.meta.url),'utf8'));
const baseline=plain(await migrate());
// Compare historical terrain/gameplay identity independently of current combat
// tuning and the separately authored scenery library.
const platformIds=new Set(['hidden-ledge','upper-roost','bridge-west','bridge-mid','bridge-east','lower-lookout','pier-west','pier-east','tier-low','tier-mid','tier-upper','tier-crown','ramp-1','center-lookout']);
const originalTerrain=items=>plain(items).map(t=>{if(platformIds.has(t.id))delete t.oneWay;return t;});
const balanceFields=new Set(['xpBudget','attack','combatBaseAttack','hp','maxHp','combatBaseHp']);
function mapWithoutSodanBalance(value){const copy=plain(value);delete copy.library;for(const stage of copy.stages||[]){delete stage.environment;stage.elements=stage.elements?.filter(e=>!e.id?.startsWith('habitat-prop-'));stage.markers=stage.markers?.filter(m=>!m.id?.startsWith('habitat-'));stage.terrains=originalTerrain(stage.terrains);for(const u of stage.units||[])for(const key of balanceFields)delete u[key];}return copy;}
vm.runInContext(await readFile(new URL('../workshop/recipes/stage12-forest-basin.js',import.meta.url),'utf8'),g);
vm.runInContext(await readFile(new URL('../workshop/recipes/stage36-place-design.js',import.meta.url),'utf8'),g);
const firstDesign=plain(g.HonroCommands.apply(baseline,g.HonroStage12Design.commands(baseline)));
assert.deepEqual(mapWithoutSodanBalance(g.HonroCommands.apply(firstDesign,g.HonroStage36Places.commands(firstDesign))),mapWithoutSodanBalance(project),'Migration plus Stage 1–6 Workshop designs must be reproducible');
const originalLater=plain(baseline.stages.slice(6)),activeLater=plain(project.stages.slice(6));
activeLater[3].elements.find(e=>e.kind==='ritualDais').layer='back';
assert.deepEqual(mapWithoutSodanBalance({stages:activeLater}),mapWithoutSodanBalance({stages:originalLater}),'Stages 7–10 retain original data apart from ritual dais presentation layer');
for(let id=1;id<=10;id++){
 // The original import remains lossless. Stages 1–6 have separately tested Workshop redesigns.
 g.HONRO_PROJECT=id<=6?baseline:project;
 for(const difficulty of ['story','normal','veteran']){
  const p=g.HonroMaps.profileFor(project.stages[id-1]);p.settings.difficulty=difficulty;
  const a=battlefield(old,id,{profile:plain(p)}).b,b=g.HonroMaps.createBattle(g.HONRO_PROJECT.stages[id-1],g.HONRO_PROJECT,plain(p),{legacyBalance:true});
  g.HonroStageRules.sanitizeStageBattle(b);new g.HONRO_CORE.Engine(b,()=>{},true);
  assert.deepEqual(originalTerrain(b.terrain),originalTerrain(a.terrain),`Stage ${id} ${difficulty} terrain`);
  assert.deepEqual(plain(b.honroSurfaceZones).map(({terrainId,...z})=>z),plain(a.honroSurfaceZones),`Stage ${id} materials`);
  for(const field of ['honroEvents','honroMarkers','honroMapAnchors','honroMap','honroRoute','honroDetailStats','honroState','honroGrowth'])
   assert.deepEqual(field==='honroMarkers'?plain(b[field]).filter(m=>!m.id?.startsWith('habitat-')):plain(b[field]),plain(a[field]),`Stage ${id} ${difficulty} ${field}`);
  assert.equal(b.units.length,a.units.length);
  for(const u of a.units){const v=b.units.find(v=>v.id===u.id);assert.ok(v,u.id);for(const [key,value] of Object.entries(plain(u))){if(balanceFields.has(key))continue;assert.deepEqual(plain(v[key]),value,`Stage ${id} ${difficulty} ${u.id}.${key}`);}}
  for(let i=0;i<a.honroLandmarks.length;i++){const original=plain(a.honroLandmarks[i]),actual=plain(b.honroLandmarks[i]);if(id===10&&original.kind==='ritualDais')original.layer='prop';for(const [key,value] of Object.entries(original))assert.deepEqual(actual[key],value,`Stage ${id} landmark ${i}.${key}`);}
 }
 const st=project.stages[id-1],roundtrip=g.HonroMaps.normalize(JSON.parse(g.HonroMaps.serialize(project)));
 assert.deepEqual(plain(roundtrip),project,`Stage ${id} lossless round-trip`);
 rows.push({stage:id,terrain:st.terrains.length,units:st.units.length,passed:true});console.log('PASS migrated stage',id);
}
g.HONRO_PROJECT=project;
await mkdir('_local/reports',{recursive:true});await writeFile('_local/reports/migration.json',JSON.stringify({rows,reproducible:true,redesignedStages:[1,2,3,4,5,6],comparison:'Original import for 1–6; stages 7–10 retain original data except ritual dais presentation layer. Both Workshop recipes reproduce the active project.',difficulties:['story','normal','veteran'],roundTrip:true},null,2)+'\n');
