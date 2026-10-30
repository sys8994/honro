import assert from 'node:assert/strict';
import {transitionAim} from './probe-target.mjs';
const surface={top:[[6500,2646],[6980,2740]]};
assert.equal(transitionAim(surface,'walk',6500.2),6535);
assert.equal(transitionAim(surface,'walk',6979.9),6945);
assert.equal(transitionAim(surface,'walk',6700),6700);
assert.equal(transitionAim(surface,'drop',6500.2),6500.2);
assert.equal(transitionAim(surface,'jump',6500.2),6500.2);
console.log('PASS input-target interior margin; no Engine pass claim');
