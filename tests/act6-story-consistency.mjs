import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {cuts} from '../shared/act6-ending-replan/cues.mjs';
import {stage56FlowLayer} from '../shared/runtime/stage56-presentation.mjs';

// Authored story boundaries and the animated scenery pass. Native movement,
// presentation in the browser and save/reload are checked separately.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(path.join(root,p),'utf8');
const ending3=cuts.find(c=>c.id==='still_03');
const ending4=cuts.find(c=>c.id==='still_04');
assert.ok(ending3&&ending4,'Keep existing final still IDs');
assert.deepEqual(ending3.beatEnds,[6.5,13,19.5,26,32.5]);
assert.deepEqual(ending4.beatEnds,[6.5,13,20,26.5]);
assert.equal(ending4.duration,26.5);
assert.ok(ending3.beats.some(s=>s.includes('그 아이의 혼은 마지막 무리에 섞여')),
  'Narrator alone may identify the departing child');
assert.match(ending4.beats[2],/능선 바위틈에 있었습니다.*짚신을 건넸다/);
assert.doesNotMatch(ending4.beats[2],/아이의 혼|길을 건넜|아이 짚신/);

const narrative=JSON.parse(read('shared/data/narrative-current.json'));
const older18=narrative.stages['18'];
assert.ok(older18.storySummary.includes('종 아래 사람들을 구했다'));
assert.doesNotMatch(older18.storySummary,/산 채로 포박|유헌이 죽|유헌 사망/);
assert.ok(older18.outro.some(([who,text])=>who==='서술'&&text.includes('손목을 묶자')),
  'Legacy dialogue must remain available to legacy saves');

const owner=read('shared/runtime/stage56-owner.mjs');
const entry=read('shared/runtime/stage56-entry.inc.js');
const presage=owner.split('// The same grounded ledge')[1]
  ?.split("if(ward&&reflow==='warned'")[0];
assert.ok(presage&&presage.includes("scopeFrame='slowing'"));
assert.ok(presage.includes("scopeFrame==='forward'"));
assert.ok(presage.includes('Math.abs(m.x-seeded.point.x)>=45'));
assert.ok(presage.includes('near(5050,E,240)'));
assert.doesNotMatch(presage,/setFlow\(|emit\(|firstGarmjinFailed\s*=\s*true/,
  'Travel warning cannot change native reflow physics or settlement');
assert.equal((owner.match(/emit\('firstGarmjinFailed'\)/g)||[]).length,1);
assert.equal((owner.match(/emit\('temporaryPassageOpen'\)/g)||[]).length,1);
assert.ok(entry.includes('먼 쪽 혼들의 움직임까지 지켜보고 알려드릴게요'));
assert.ok(entry.includes("a.notify('소단 · 저 너머 혼들이 느려져요.')"));

let phase='quiet',baseDraws=0;
const scene={time:0,x:0,y:0,scale:1,backgroundReadability(){baseDraws++;}};
const lights=[];
const ctx={save(){},restore(){},translate(){},scale(){},beginPath(){},moveTo(){},quadraticCurveTo(){},stroke(){},fill(){},
 ellipse(x){lights.push(x);}};
stage56FlowLayer(scene,()=>phase);
function frame(next){
 phase=next;scene.time+=.0625;lights.length=0;scene.backgroundReadability(ctx,800,600,{});
 return lights[3];
}
assert.equal(frame('quiet'),undefined);
const first=frame('forward'),second=frame('forward'),slower=frame('slowing'),reverse=frame('reverse');
assert.ok(second>first&&slower>second&&slower-second<(second-first)/4);
assert.ok(reverse<slower&&Math.abs((slower-reverse)-(second-first))<1e-6);
assert.equal(baseDraws,5);
console.log('PASS ending knowledge and live cue timing, Act 2 version boundary, forward/slow/reverse scenery, native FSM markers');
