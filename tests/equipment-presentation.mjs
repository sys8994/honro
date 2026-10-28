import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {buildCore} from '../game/engine/build.mjs';
const g=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),g);const C=g.HONRO_CORE,plain=x=>JSON.parse(JSON.stringify(x));
const baseline=execFileSync('git',['show','ddc9577648a27a4795a928baddd4b8f61edc9c5b:shared/engine/src/equipmentData.ts'],{encoding:'utf8'});
for(const key of ['ITEMS','EFFECTS','EVENTS','CHOICES']){const b=JSON.parse(baseline.split('export const EQUIPMENT_'+key+'=')[1].split(';')[0]);const a=plain(C['EQUIPMENT_'+key]);if(key==='ITEMS')for(const i of a){delete i.lore;delete i.effectCategory;}assert.deepEqual(a,b,`${key} gameplay fields changed`);}
const review=JSON.parse(readFileSync('game/docs/equipment/equipment_review_20261028.json')),proposal=JSON.parse(readFileSync('game/docs/equipment/unique_candidates_20261028.json'));
const approved=JSON.parse(readFileSync('tests/fixtures/equipment-lore-approved-20261028.json'));
const priorPresentation=JSON.parse(execFileSync('git',['show','33697b6f76578f051547205cfe61960894306c21:shared/engine/src/equipmentPresentation.ts'],{encoding:'utf8'}).split('>=')[1].trim().replace(/;$/,''));
const reviewHtml=readFileSync('game/docs/equipment/equipment_review_20261028.html','utf8'),reviewMd=readFileSync('game/docs/equipment/equipment_review_20261028.md','utf8');
assert.equal(Object.keys(approved).length,52);assert.deepEqual(review.items.map(i=>i.itemId).sort(),Object.keys(approved).sort());
assert.equal(review.items.length,52);assert.equal(new Set(review.items.map(i=>i.lore)).size,52);
for(const r of review.items){const i=C.EQUIPMENT_MAP[r.itemId];assert.equal(i.lore,r.lore);assert.equal(i.effectCategory,r.effectCategory);assert.equal(i.lore,approved[i.itemId]);assert.equal(i.effectCategory,priorPresentation[i.itemId].effectCategory);assert(reviewHtml.includes(i.lore),i.itemId+' HTML');assert(reviewMd.includes(i.lore),i.itemId+' MD');}
assert.equal(review.items.filter(i=>i.acquisitionEvidence.status.startsWith('예약')).length,13);
assert.match(review.items.find(i=>i.itemId==='itm_da_05').acquisitionEvidence.condition,/진목 표식·잔영 관측 stage29-echo/);
assert.match(review.items.find(i=>i.itemId==='itm_da_06').acquisitionEvidence.condition,/기존 동행/);
assert.equal(review.items.filter(r=>r.effectCategory==='unique').length,4);
assert.equal(C.EQUIPMENT_MAP.itm_da_06.effectCategory,'basic');assert.deepEqual(plain(C.EQUIPMENT_EFFECT_MAP.da_heal.targetSkills),['M10']);assert(review.items.find(i=>i.itemId==='itm_da_06').proposedBasicTargets.every(t=>['M06','M02','M04','M13','M05'].includes(t.id)));
assert(review.items.find(i=>i.itemId==='itm_da_03').proposedBasicTargets.some(t=>t.id==='M01'));
assert.equal(proposal.candidates.length,28);assert.equal(new Set(proposal.candidates.map(c=>c.candidateId)).size,28);for(const c of proposal.candidates){assert(['추천','후보','보류'].includes(c.status));for(const id of c.proposedItems)assert(C.EQUIPMENT_MAP[id]);assert(c.effect&&c.playChoice&&c.costAndCap&&c.implementationHook&&c.risk);}
console.log('PASS exact approved52 lore/categories, actual29/35 evidence, reserved13; 52 review rows, 28 proposals, targeted mage mappings; all gameplay definitions/effects/events/choices byte-equivalent as data');
