import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {skillInventory} from '../tools/skill-icons/inventory.mjs';
import {validateSkillIcons} from '../tools/skill-icons/manifest.mjs';
const saved=JSON.parse(await readFile('game/docs/skill-icons-v1/inventory.json','utf8')),live=JSON.parse(JSON.stringify(await skillInventory()));
assert.deepEqual(live.counts,saved.counts);
for(const key of ['skills','hiddenLegacy'])for(const skill of live[key]){
 const previous=saved[key].find(s=>s.id===skill.id);assert(previous,skill.id);
 for(const field of ['name','effectSummary','effectRowsRank1','effectRowsRank8','lore','passive','ultimate','capstone','color','enemyOnly'])assert.deepEqual(skill[field],previous[field],`${skill.id} ${field} preserved`);
}
const valid=await validateSkillIcons({allowPending:true});
assert.equal(valid.expected.length,84);assert.equal(valid.pending.length,84);assert.equal(valid.complete,false);assert.equal(valid.errors.length,0);
const strict=await validateSkillIcons();assert(strict.errors.some(e=>e.startsWith('INCOMPLETE:')));
for(const [name,change,message] of [
 ['missing ID',m=>delete m.icons.AP05,'Missing manifest skillID: AP05'],
 ['hidden ID',m=>m.icons.S99={...m.icons.S00},'Unexpected skillID: S99'],
 ['duplicate target',m=>m.icons.AP05.file=m.icons.AP04.file,'file must be'],
 ['ready missing file',m=>{m.icons.AP05.status='ready';m.icons.AP05.sha256='0'.repeat(64);},'READY FILE MISSING'],
 ['unknown state',m=>m.icons.AP05.status='complete','invalid status'],
 ['pending checksum',m=>m.icons.AP05.sha256='0'.repeat(64),'pending checksum must be null']
]){
 const manifest=structuredClone(valid.source);change(manifest);const result=await validateSkillIcons({allowPending:true,manifest});
 assert.equal(result.complete,false);assert(result.errors.some(e=>e.includes(message)),name);console.log('PASS rejects',name);
}
console.log('PASS final 84 IDs, effects/names/flags/colors unchanged, intentional pending and strict completion gates');
