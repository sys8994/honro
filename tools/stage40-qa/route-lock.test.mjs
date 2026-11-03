import assert from 'node:assert/strict';
import {createRouteGoalLock} from './route-lock.mjs';
// Exact observed R11 geometry; this is controller unit evidence, not play.
const enemies=[{id:'mid',x:1668.153259238261},{id:'hound',x:2120.2844397952463}];let calls=0;
const resolve=u=>{calls++;const t=[...enemies].sort((a,z)=>Math.abs(a.x-u.x)-Math.abs(z.x-u.x))[0];return{x:t.x+(t.x>=u.x?-310:310),target:t.id};};
assert.notEqual(resolve({x:1835}).target,resolve({x:1961}).target);
const lock=createRouteGoalLock(resolve),first=lock.next({x:1835},'dock');
assert.deepEqual(lock.next({x:1961},'dock'),first);assert.deepEqual(lock.next({x:1835},'dock'),first);
assert.equal(lock.next({x:1961},'stair').target,'hound');lock.clear();assert.equal(lock.next({x:1835},'stair').target,'mid');
console.log('PASS observed standoff target-flip is removed; support transitions and explicit drop reset retained. Controller unit only.');
