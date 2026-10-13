import assert from 'node:assert/strict';
import vm from 'node:vm';
import {buildCore} from '../game/engine/build.mjs';
import {runtime} from '../game/tests/helpers.mjs';
import {swordAreaSuite} from './hwigyeom-area-fixture.mjs';
const native=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),native);
const a=swordAreaSuite(native.HONRO_CORE),b=swordAreaSuite((await runtime({legacyMaps:false})).HONRO_CORE);assert.deepEqual(a,b);for(const row of a)console.log('PASS native/shared:',row);

for(const C of [native.HONRO_CORE,(await runtime({legacyMaps:false})).HONRO_CORE]){
 assert.match(C.SKILLS.S08.desc,/전방 범위의 적들을 한 번/);
 assert.match(C.skillPlayNotes('S08'),/적의 차례에 적이 가까이 들어오면 전방 범위의 적들을 한 번 반격/);
 assert(!C.skillPlayNotes('S08').includes('첫 적'));
 for(let rank=1;rank<=8;rank++)assert.equal(C.skillEffectRows('S08',rank).find(r=>r.label==='반격').value,'전방 범위의 적 모두 · 1회');
}
console.log('PASS native/shared: S08 card, detailed help and all-rank effect rows agree on one area counter');
