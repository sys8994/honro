/** Focused split-module identity contract, not a campaign/browser playthrough. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

const manifest=JSON.parse(await readFile('web/manifest.json','utf8'));
const adapter=manifest.common.find(p=>p.includes('shared-assets-rebuild-game-adapter.'));
assert(adapter,'production split adapter exists');
// Real ES module scope must not accidentally expose its top-level declarations.
await import(pathToFileURL(path.resolve(adapter)).href);
assert.equal(typeof globalThis.resolveRebuildCharacter,'function');
const resolve=globalThis.resolveRebuildCharacter;
const assets={ally_guard:{},summon_stalker:{},summon_eater:{}};
const g=vm.createContext({resolveRebuildCharacter:resolve,HonroScene:class{},
 HonroVectorParts:{create:()=>({assets})},HonroMonsterVisual:{species:()=>null}});
vm.runInContext(await readFile('shared/runtime/actor-vector.js','utf8'),g);
const project=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
const appearances=[];
for(const stage of project.stages)for(const unit of stage.units||[]){
 if(unit.name!=='휘겸')continue;
 assert.equal(resolve(unit),'hwigyeom',`${stage.metadata.stageId}/${unit.id}`);
 assert.equal(g.HonroActorVisual.kind(unit),null,'party identity bypasses generic ally art');
 appearances.push({stage:stage.metadata.stageId,id:unit.id,side:unit.side});
}
assert.deepEqual(appearances.filter(u=>u.id==='npc-hwigyeom').map(u=>u.stage),[3,4]);
const knight={id:'knight',name:'휘겸',cls:'knight',side:0};
assert.equal(resolve(knight),'hwigyeom');
const named={...knight,id:'story-hwigyeom',side:2,honroCivilian:true};
assert.equal(resolve(named),'hwigyeom');
assert.equal(g.HonroActorVisual.kind(named),null);
const guard={...knight,id:'ally-guard',name:'백산',side:2,honroAlly:true,allyRole:'guard'};
assert.equal(resolve(guard),null);
assert.equal(g.HonroActorVisual.kind(guard),'ally_guard');
for(const summonKind of ['stalker','eater']){
 const summon={id:`summon-${summonKind}`,cls:'occultist',side:0,summoned:true,summonKind};
 assert.equal(g.HonroActorVisual.kind(summon),`summon_${summonKind}`);
}
assert.equal(resolve({name:'휘겸',cls:'knight',side:1}),null,'a name alone cannot replace an unrelated actor');
// Production party draw must select the same visual for recruit and companion.
for(const unit of [knight,named,...project.stages.flatMap(s=>(s.units||[]).filter(u=>u.id==='npc-hwigyeom'))]){
 let selected;
 assert(globalThis.HonroPartyVisual.prototype.draw.call({visuals:{hwigyeom:{draw:(_c,u)=>{selected=u;}}}},null,unit));
 assert.equal(selected,unit);
}
console.log('PASS: split ES-module resolver, all authored Hwigyeom appearances, named story/runtime identity, unchanged guards/summons',JSON.stringify(appearances));
