/** Identity binding only; actual reading controls are checked in Chromium. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const g=vm.createContext({HONRO_NARRATIVE_COMPAT:JSON.parse(await readFile('shared/data/narrative-compat-v1.json','utf8'))});
vm.runInContext(await readFile('shared/runtime/story-direction.js','utf8'),g);
const u={id:'resident-from-current-map',name:'동굴 주민',cls:'knight',honroCivilian:true,hp:3},other={id:'resident-4',name:'다른 주민',hp:4,honroCivilian:true};
const b={honroStage:11,honroMarkers:[{id:'resident',target:u.id}],units:[other,u]},app={engine:{b}},speaker=who=>g.HonroStoryDirection.speaker(app,who);
assert.equal(speaker('주민'),u,'marker identity, not a hardcoded resident number or class');
assert.equal(speaker('주민').name,'동굴 주민','no world name mutation');
assert.equal(speaker('새 주민'),null,'no inferred generic caption');
u.dead=true;assert.equal(speaker('주민'),null);u.dead=false;u.hp=0;assert.equal(speaker('주민'),null);u.hp=3;
u.honroCivilian=false;assert.equal(speaker('주민'),null,'do not bind a replaced enemy or companion');u.honroCivilian=true;
b.honroMarkers=[];assert.equal(speaker('주민'),null,'missing marker is text-only, not another civilian');b.honroMarkers=[{id:'resident',target:u.id}];
b.honroCustom=true;assert.equal(speaker('주민'),null);b.honroCustom=false;
b.honroStage=14;b.honroStaging={cinematic:2};const existing={id:'resident-2',hp:5};b.units.push(existing);assert.equal(speaker('주민'),existing,'existing stage14 binding retained');
console.log('PASS: explicit rescue-marker civilian, absent/dead/zero-HP/noncivilian/custom boundaries, stage14 preserved');
