import assert from 'node:assert/strict';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {legacyRuntime,migrate} from '../migration/migrate-stages.mjs';
const g=await runtime(),old=await legacyRuntime(),plain=x=>JSON.parse(JSON.stringify(x)),rows=[];
const project=JSON.parse(await readFile(new URL('../shared/data/campaign.json',import.meta.url),'utf8'));
assert.deepEqual(plain(await migrate()),project,'Migration must be reproducible');
for(let id=1;id<=10;id++){
 for(const difficulty of ['story','normal','veteran']){
  const p=g.HonroMaps.profileFor(project.stages[id-1]);p.settings.difficulty=difficulty;
  const a=battlefield(old,id,{profile:plain(p)}).b,b=battlefield(g,id,{profile:plain(p)}).b;
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
await mkdir('reports',{recursive:true});await writeFile('reports/migration.json',JSON.stringify({rows,reproducible:true,difficulties:['story','normal','veteran'],roundTrip:true},null,2)+'\n');
