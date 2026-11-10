// Real campaign factories; preview parity fixtures, not full-stage play.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const g=await runtime({legacyMaps:false,productionStory:true}),C=g.HONRO_CORE;
g.HONRO_ACT4_PILOT_COMBAT_REFERENCE=JSON.parse(await readFile('shared/data/act4/pilot-combat-reference.json','utf8'));
vm.runInContext(await readFile('shared/runtime/act4-pilot-combat.js','utf8'),g);
const native=g.structuredClone,plain=x=>JSON.parse(JSON.stringify(x));let cases=0;
for(const [n,id] of [[18,'A14'],[31,'A02'],[35,'A14'],[40,'A02'],[38,'A01'],[40,'A01']]){
 const st=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===n),p=g.HonroMaps.profileFor(st);g.HonroEquipment.migrate(p);
 g.__json=JSON.stringify(g.HonroMaps.createBattle(st,g.HONRO_PROJECT,p,{origin:"campaign"}));const b=vm.runInContext("JSON.parse(__json)",g),e=new C.Engine(b),u=b.units.find(u=>u.side===0&&u.cls==='archer');
 const before=JSON.stringify(b);let stripped=0,inputChars=0;
 g.structuredClone=x=>{if(x!==b&&x?.units===b.units){stripped++;inputChars=JSON.stringify(x).length;}return native(x);};
 for(const [angle,power] of [[25,.4],[60,1]]){
  const actual=plain(e.predict(u,C.SKILLS[id],angle,power));
  g.structuredClone=x=>native(x!==b&&x?.units===b.units?b:x);
  const expected=plain(e.predict(u,C.SKILLS[id],angle,power));
  assert.deepEqual(actual,expected,`stage${n} ${id} full replay parity`);
  g.structuredClone=x=>{if(x!==b&&x?.units===b.units){stripped++;inputChars=JSON.stringify(x).length;}return native(x);};cases++;
 }
 assert.equal(JSON.stringify(b),before,'preview leaves live/save state untouched');
 if(n!==18){assert.equal(stripped,2);assert(inputChars<before.length/2);}
 else assert.equal(stripped,0,'unreviewed act2 keeps full clone');
 for(const mutate of [()=>{b.honroCustom=true;},()=>{delete b.honroCustom;b.honroMapOrigin='workshop';},()=>{delete b.honroMapOrigin;b.previewAlias=b.honroLandmarks?.[0]?.asset;}]){
  mutate();let full=0;g.structuredClone=x=>{if(x===b)full++;return native(x);};e.predict(u,C.SKILLS[id],25,.4);assert(full,'custom/workshop/gameplay alias must fall back');
 }
 delete b.previewAlias;g.structuredClone=native;
 console.log(JSON.stringify({stage:n,skill:id,fullChars:before.length,replayChars:inputChars,stripped,cases:2}));
}
console.log(`PASS ${cases} exact full-clone prediction comparisons; custom/workshop/alias fallbacks; unchanged live battles.`);
