import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {cuts} from '../shared/act6-ending-replan/cues.mjs';

// Source-level guard only. Native battle, movement and save/reload tests are separate.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(path.join(root,p),'utf8');
const ending3=cuts.find(c=>c.id==='still_03');
const ending4=cuts.find(c=>c.id==='still_04');
assert.ok(ending3&&ending4,'Keep existing final still IDs');
assert.equal(ending3.duration,24);
assert.equal(ending4.duration,21);
assert.ok(ending3.beats.some(s=>s.includes('그 아이의 혼은 마지막 무리에 섞여')),
  'Narrator alone may identify the departing child');
assert.ok(ending4.beats.some(s=>s.includes('누구였는지는 알아보지 못했다고')),
  'Seol-o must not claim eyewitness identification he lacked');

const narrative=JSON.parse(read('shared/data/narrative-current.json'));
const older18=narrative.stages['18'];
assert.ok(older18.storySummary.includes('종 아래 사람들을 구했다'));
assert.doesNotMatch(older18.storySummary,/산 채로 포박|유헌이 죽|유헌 사망/);
assert.ok(older18.outro.some(([who,text])=>who==='서술'&&text.includes('손목을 묶자')),
  'Legacy dialogue must remain available to legacy saves');

const owner=read('shared/runtime/stage56-owner.mjs');
const entry=read('shared/runtime/stage56-entry.inc.js');
const presage=owner.split('// The far procession begins to hesitate')[1]
  ?.split("if(ward&&reflow==='warned'")[0];
assert.ok(presage&&presage.includes('distantWarning=true'));
assert.ok(presage.includes("scopeFrame==='forward'"));
assert.ok(presage.includes('Math.abs(m.x-seeded.point.x)>=45'));
assert.doesNotMatch(presage,/setFlow\(|emit\(|firstGarmjinFailed\s*=\s*true/,
  'Travel warning cannot change native reflow physics or settlement');
assert.equal((owner.match(/emit\('firstGarmjinFailed'\)/g)||[]).length,1);
assert.equal((owner.match(/emit\('temporaryPassageOpen'\)/g)||[]).length,1);
assert.ok(entry.includes('먼 쪽 혼들의 움직임까지 지켜보고 알려드릴게요'));
console.log('PASS: ending knowledge, Act 2 version boundary, pre-reversal warning, native FSM markers');
