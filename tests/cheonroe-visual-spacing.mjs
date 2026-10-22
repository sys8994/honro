/** Keep the integration entry point, with the corrected original-rich contract.
 * The old assertions required three tiny forks and gap caps: the rejected regression.
 */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {buildCore} from '../game/engine/build.mjs';
const g=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),g);const C=g.HONRO_CORE;
const plain=x=>JSON.parse(JSON.stringify(x));
assert.equal(C.cheonroeVisualGaps,undefined,'no neighbor-gap computation remains');
for(const phase of [0,1,2]){
 const reference=C.lightningPaths(100,0,100,1000,phase);
 assert.equal(reference.forks.length,6);
 assert.deepEqual(plain(reference.trunk[0]),{x:100,y:0});assert.deepEqual(plain(reference.trunk.at(-1)),{x:100,y:1000});
 assert(reference.trunk.some(p=>Math.abs(p.x-100)>12),'restore original broad jagged shape');
 assert(reference.forks.some(f=>Math.abs(f.at(-1).x-f[0].x)>36),'restore long original branches');
 // Legacy diagnostic arguments cannot enable crowding reductions at any spacing.
 for(const gap of [0,17,38,100,Infinity])assert.deepEqual(plain(C.lightningPaths(100,0,100,1000,phase,true,gap)),plain(reference));
}
console.log('PASS spacing independence: six rich forks, broad trunk, long branches, exact endpoints and no legacy gap-dependent reduction at 15 phase/spacing cases');
