import test from 'node:test';
import assert from 'node:assert/strict';
import {admitCatalog,verifyCompiledPrefix} from './catalog-adapter.mjs';
import {fixture,baseBytes,baseSHA256} from './fixtures/catalog-fixture.mjs';
const bytes=o=>Buffer.from(JSON.stringify(o)+'\n');
test('real stock campaign 50 prefix preserved, held-out synthetic 10 appended',()=>{
 const f=fixture(), r=admitCatalog(f);
 assert(r.admitted,r.reason);assert.equal(r.reads.length,21);
 assert(verifyCompiledPrefix(baseBytes,baseSHA256,bytes(r.manifest)));
 assert.deepEqual(r.manifest.catalog[52].playerRoster,['mage']);
 assert.deepEqual(r.manifest.catalog[58].playerRoster,['archer','knight','occultist']);
 assert.deepEqual(r.manifest.catalog[59].playerRoster,['archer','mage','knight','occultist']);
 const off=admitCatalog({...f,enabled:false,read(){assert.fail('must not attempt a read')}});
 assert.equal(off.admitted,false);assert.strictEqual(off.manifestBytes,baseBytes);
});
test('each missing signed packet yields exact stock bytes only, no partial registration',()=>{
 for(let i=0;i<10;i++) for(const role of ['map','assets']) {
  const f=fixture(), v=f.stages[i][role];
  f.files.delete(v.path);const r=admitCatalog(f);assert.equal(r.admitted,false);
  assert.strictEqual(r.manifestBytes,baseBytes);assert(!r.manifest);
  assert.match(r.reason,/missing or changed/);
 }
});
test('wrong digest/media, out-of-order stages, actual roster injection, duplicate old provider all reject',()=>{
 for(const mutate of [
  f=>{f.files.set(f.stages[9].map.path,Buffer.from('wrong'))},
  f=>{f.files.delete(f.stages[0].media[0].path)},
  f=>{f.stages.pop()},
  f=>{[f.stages[1],f.stages[2]]=[f.stages[2],f.stages[1]]},
  f=>{const x=f.stages[2],m=JSON.parse(f.read(x.map.path));m.units[0].stageOverrides={side:1};x.map=f.token('web/data/chapter-53','json',m)},
  f=>{const x=f.stages[2],m=JSON.parse(f.read(x.map.path));m.units.push({id:'extra',team:'player',kind:'occultist'});x.map=f.token('web/data/chapter-53','json',m)},
  f=>{const x=f.stages[2],o=JSON.parse(f.read(x.assets.path));o[0].id=JSON.parse(baseBytes).libraryOrder[0];x.assets=f.token('web/data/chapter-53-assets','json',o)}
 ]){
  const f=fixture();mutate(f);const r=admitCatalog(f);assert.equal(r.admitted,false);assert.strictEqual(r.manifestBytes,baseBytes);
 }
});
test('actual output prefix review rejects a swapped old map/provider/library and changed hash',()=>{
 const f=fixture(), r=admitCatalog(f);assert(r.admitted,r.reason);
 for(const mutate of [x=>x.stages.reverse(),x=>x.stageLibraries.reverse(),x=>x.libraryOrder.reverse(),x=>x.compatibility33='different']) {
  const b=structuredClone(r.manifest);mutate(b);assert.throws(()=>verifyCompiledPrefix(baseBytes,baseSHA256,bytes(b)));
 }
 assert.throws(()=>verifyCompiledPrefix(baseBytes,'other',bytes(r.manifest)));
});
