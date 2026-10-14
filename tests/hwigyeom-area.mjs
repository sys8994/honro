import assert from 'node:assert/strict';
import vm from 'node:vm';
import {buildCore} from '../game/engine/build.mjs';
import {runtime} from '../game/tests/helpers.mjs';
import {swordAreaSuite} from './hwigyeom-area-fixture.mjs';
const native=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),native);
const a=swordAreaSuite(native.HONRO_CORE),b=swordAreaSuite((await runtime({legacyMaps:false})).HONRO_CORE);assert.deepEqual(a,b);for(const row of a)console.log('PASS native/shared:',row);
