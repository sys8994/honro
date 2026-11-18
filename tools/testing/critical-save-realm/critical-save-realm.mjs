// Separate in-memory storage: never accesses user browser data.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {isDeepStrictEqual} from 'node:util';
assert.equal(createHash('sha256').update(readFileSync(new URL('./critical-save-failure.mjs',import.meta.url))).digest('hex'),'00f9ee4a48a61fef813596ee2c329c20975b6a9d8e4a46088384393239d138df','Original critical test changed');
import {appHarness,KEY} from './app-regression-helpers.mjs';
const h=await appHarness({productionStory:true}),g=h.g,E=g.HonroEquipment;
const a=h.load(h.profileThrough(10));a.launch(11);const b=a.engine.b;
a.flushBattleSave();assert(a.persist());const old=h.storage.get(KEY);
const set=g.localStorage.setItem,copy=x=>JSON.parse(JSON.stringify(x));
for(const [name,code] of [['QuotaExceededError','quota'],['SecurityError','permission'],['Error','storage']]){
 g.localStorage.setItem=()=>{throw Object.assign(new Error('isolated failure'),{name});};
 assert.equal(a.profileStore.save(a.profile),false);assert.equal(a.profileStore.state.lastWriteError.code,code);
 assert.equal(h.storage.get(KEY),old);assert(a.profileStore.original().ok);assert(!a.profileStore.locked);
}
g.localStorage.setItem=set;a.profile.cycle=a.profile;
assert.equal(a.profileStore.save(a.profile),false);assert.equal(a.profileStore.state.lastWriteError.code,'serialization');assert.equal(h.storage.get(KEY),old);delete a.profile.cycle;
assert(a.persist());assert.equal(a.profileStore.state.lastWriteError,null);
// Pending equipment choice must remain uncommitted on failed storage, then commit once.
assert(E.transaction(a,p=>E.grant(p,'eq_se_t2_choice')));const before=copy(a.profile),raw=h.storage.get(KEY);
g.localStorage.setItem=()=>{throw Object.assign(new Error('quota'),{name:'QuotaExceededError'});};
assert.equal(E.choose(a,'eq_se_t2_choice','itm_se_03'),false);assert.deepEqual(copy(a.profile),before);assert.equal(h.storage.get(KEY),raw);
g.localStorage.setItem=set;assert(E.choose(a,'eq_se_t2_choice','itm_se_03'));assert.equal(E.choose(a,'eq_se_t2_choice','itm_se_03'),false);
const restored=g.HonroProfileStore.migrate(h.storage.get(KEY));assert.equal(restored.equipment.rewardLedger.eq_se_t2_choice.state,'committed');
const actual=restored.honroBattle.units.map(u=>[u.id,u.hp,u.focus,u.x,u.y]),expected=b.units.map(u=>[u.id,u.hp,u.focus,u.x,u.y]);
console.log(JSON.stringify({rawDeepStrictEqual:isDeepStrictEqual(actual,expected),actualArray:Array.isArray(actual),expectedArray:Array.isArray(expected),actualHostPrototype:Object.getPrototypeOf(actual)===Array.prototype,expectedHostPrototype:Object.getPrototypeOf(expected)===Array.prototype,actualFirstHostPrototype:Object.getPrototypeOf(actual[0])===Array.prototype,expectedFirstHostPrototype:Object.getPrototypeOf(expected[0])===Array.prototype,serializedExact:isDeepStrictEqual(copy(actual),copy(expected))}));
assert.deepEqual(copy(actual),copy(expected));
const negative=copy(actual);negative[0][1]++;assert.equal(isDeepStrictEqual(negative,copy(expected)),false,'HP mutation must be rejected');
console.log('PASS stage11 autosave/restore; quota/permission/serialization/generic diagnostics; exact old bytes; failed reward rollback and retry once. Fixtures, not full victory.');

