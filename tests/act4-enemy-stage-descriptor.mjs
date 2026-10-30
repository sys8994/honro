/** Focused regression for authored Act4 chapters beyond legacy core STAGES. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,plain=x=>JSON.parse(JSON.stringify(x));
const source=await readFile('shared/runtime/world.js','utf8');
assert(source.includes('C.STAGES[st.id-1]||st'));
const archetypes={...g.HonroWorld.archetypes};
vm.runInContext(source.replace('C.STAGES[st.id-1]||st','C.STAGES[st.id-1]'),g);
Object.assign(g.HonroWorld.archetypes,archetypes);const legacy=g.HonroWorld.createEnemy;
vm.runInContext(source,g);Object.assign(g.HonroWorld.archetypes,archetypes);const current=g.HonroWorld.createEnemy;
const official=JSON.parse(await readFile('shared/data/act4/world.json','utf8'));
const project={...g.HONRO_PROJECT,stages:official.stages,library:[...g.HONRO_PROJECT.library,...official.library.filter(a=>!g.HONRO_PROJECT.library.some(b=>a.id===b.id))]};
for(let n=31;n<=36;n++){
 const st=g.HONRO_CONTENT.stages.find(s=>s.id===n),map=official.stages.find(s=>s.metadata.stageId===n),terrain=g.HonroMaps.compile(map,project).terrain;
 const battle=()=>({terrain:plain(terrain),difficulty:'normal',mode:'campaign',honroCustom:false,honroMapOrigin:'workshop',honroStage:n});
 for(const kind of ['possessedGuard','possessedArcher','warden'])assert.deepEqual(plain(current(battle(),st,1200,kind,0,1900,true)),plain(legacy(battle(),st,1200,kind,0,1900,true)),`stage${n} ${kind} old descriptor parity`);
}
const makeEnemy=C.makeEnemy,calls=[];C.makeEnemy=(spec,terrain,stage,index)=>{calls.push({id:stage?.id,descriptor:stage});return makeEnemy(spec,terrain,stage,index);};
for(let n=37;n<=40;n++){
 const map=official.stages.find(s=>s.metadata.stageId===n),st=g.HONRO_CONTENT.stages.find(s=>s.id===n),p=C.defaults();p.recruited=['archer','mage','knight','occultist'];g.HonroEquipment.fresh(p);
 const b=g.HonroMaps.createBattle(map,project,p),expected=map.units.filter(u=>u.team==='enemy');assert.equal(b.units.filter(u=>u.side===1).length,expected.length);
 for(const record of expected){const u=b.units.find(u=>u.id===record.id);assert(u&&Number.isFinite(u.hp)&&u.hp>0&&Number.isFinite(u.attack));assert.equal(u.level,Math.floor(g.HonroProgression.plan(n).entryLevel));}
 const spawn=current(b,st,1000,'possessedGuard',17,2000,true);assert(spawn.hp>0&&Number.isFinite(spawn.attack));assert(calls.some(c=>c.id===n&&c.descriptor===st),`real stage${n} descriptor used`);
 console.log(`PASS official${n}: ${expected.length} authored enemies, ordinary spawned enemy and exact chapter descriptor`);
}
C.makeEnemy=makeEnemy;
console.log('PASS31–36 old factory parity;37–40 official compile/create and ordinary spawn, no lower-stage clamp');
