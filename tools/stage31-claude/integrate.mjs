/** Put the composed Stage 31 candidate (geometry + roster + Claude art) into the
 * canonical Act4 world source and repack it. Story/objective/boarding contracts
 * of the current canonical stage are asserted unchanged. */
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {packWorld} from '../act4-source/world-source.mjs';
const composed=process.argv[2]||'_local/reports/stage31-claude/roster-v6/stage31-composed.json',assets=process.argv[3]||'_local/reports/stage31-claude/modules';
const world=JSON.parse(await readFile('shared/data/act4/world.json','utf8')),stage=JSON.parse(await readFile(composed,'utf8'));
const i=world.stages.findIndex(s=>s.id==='stage-31'),old=world.stages[i];
for(const k of ['events','objectives'])assert.deepEqual(stage[k],old[k],'Original '+k+' contract');
assert.deepEqual(stage.design.act4.boarding,old.design.act4.boarding,'Boarding contract');
assert.deepEqual(stage.units.filter(u=>u.team!=='enemy'),old.units.filter(u=>u.team!=='enemy'),'Party/NPC poses');
assert.equal(stage.units.filter(u=>u.team==='enemy').length,34);
world.stages[i]=stage;
world.library=world.library.filter(x=>!x.id.startsWith('s31c:'));for(const r of JSON.parse(await readFile(`${assets}/index.json`,'utf8')))world.library.push(JSON.parse(await readFile(r.asset,'utf8')));
await writeFile('shared/data/act4/world.json',JSON.stringify(world));
const m=await packWorld();console.log(JSON.stringify({stage:'stage-31',terrains:stage.terrains.length,enemies:34,library:world.library.length,bytes:m.bytes,sha256:m.sha256}));
