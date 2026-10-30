import assert from'node:assert/strict';
import vm from'node:vm';
import{execFileSync}from'node:child_process';
import{createAppAdapter}from'../tools/stage31/app-adapter.mjs';
import{readFile,writeFile,mkdir}from'node:fs/promises';
import{appHarness,plain,KEY}from'./app-regression-helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g;
const fixtureDir='_local/reports/act4-vector-storage/fixture';
execFileSync(process.execPath,['tools/stage31-production/forge.mjs','tools/stage31-production/blueprint.json',fixtureDir],{stdio:'pipe'});
const project=JSON.parse(await readFile(fixtureDir+'/stage31.draft.honro-map.json','utf8'));
const entry=await createAppAdapter(project,'stage-31',{entryBuild:'campaign-balanced-v1'});
const profile=plain(entry.app.profile);
g.HONRO_PROJECT=plain(project);const store=g.HonroProfileStore,original=JSON.stringify(profile),snapshot=plain(profile.honroBattle);
assert(snapshot.honroAct4Official===1&&snapshot.mode==='campaign');
let quota=5*1024*1024,writes=0;
g.localStorage.setItem=(key,text)=>{if(text.length*2>quota)throw Error('QuotaExceededError fixture');h.storage.set(key,String(text));writes++;};
// Compare legacy schema migration/save bytes against the exact pre-change module.
vm.runInContext(await readFile('tests/fixtures/act4-static-art-storage/profile-store-before.js','utf8'),g);
const beforeStore=g.HonroProfileStore;g.HonroProfileStore=store;
for(const schema of[1,2,3,4,5])for(const revision of[10,12,13]){
 const old=h.profileThrough(12);old.schema=schema;old.revision=revision;old.honroBattle=null;
 const raw=JSON.stringify(old);assert.deepEqual(plain(store.migrate(raw)),plain(beforeStore.migrate(raw)),'schema migration '+schema+'/'+revision);
}
const legacy=h.profileThrough(12);h.storage.delete(KEY);beforeStore.create().save(legacy);const oldBytes=h.storage.get(KEY);h.storage.delete(KEY);store.create().save(legacy);assert.equal(h.storage.get(KEY),oldBytes,'legacy serialized bytes unchanged');
h.storage.delete(KEY);
assert.equal(beforeStore.create().save(profile),false,'pre-change static artwork exceeds the explicit quota');assert.equal(h.storage.has(KEY),false);
const owner=store.create();assert(owner.save(profile),'compact official snapshot fits bounded storage');
const text=h.storage.get(KEY);assert(text.length*2<quota);assert.equal(JSON.stringify(profile),original,'save never mutates live profile');
const encoded=JSON.parse(text);assert(encoded.honroBattle.honroLandmarks.some(l=>l.asset?.honroStaticAssetRef===1));
for(const key of ['units','terrain','waters','honroSurfaceZones','honroAct4PreviewState','phase','round','active'])assert.deepEqual(encoded.honroBattle[key],snapshot[key],key);
// Cold title loads before the stage asset chunk exists; resolution is deferred.
g.HONRO_PROJECT={library:[]};const cold=store.create();assert(!cold.locked,'cold lazy load must not need artwork');
const beforeCold=JSON.stringify(cold.initial.honroBattle);assert.equal(store.restoreBattleArt(cold.initial.honroBattle),false);assert.equal(JSON.stringify(cold.initial.honroBattle),beforeCold,'failed resolution is atomic');
g.HONRO_PROJECT=plain(project);assert(store.restoreBattleArt(cold.initial.honroBattle));assert.deepEqual(plain(cold.initial.honroBattle),snapshot,'all exact snapshot data and art restored');
// Asset/source mismatches never silently resolve to different collision artwork.
const stale=JSON.parse(text).honroBattle,ref=stale.honroLandmarks.find(l=>l.asset?.honroStaticAssetRef===1).asset;
const src=g.HONRO_PROJECT.library.find(a=>a.id===ref.id);src.name+=' changed';const prior=JSON.stringify(stale);assert.equal(store.restoreBattleArt(stale),false);assert.equal(JSON.stringify(stale),prior);
g.HONRO_PROJECT=plain(project);
// Runtime-mutated artwork remains inline; old/custom snapshots are untouched.
const changed=plain(snapshot);const item=changed.honroLandmarks.find(l=>l.asset?.vector);item.asset.name+=' local';const packed=store.compactBattleArt(changed);assert.equal(packed.honroLandmarks.find(l=>l.id===item.id).asset.name,item.asset.name);
for(const b of [{...snapshot,honroStage:13},{...snapshot,honroCustom:true},{...snapshot,mode:'training'}])assert.strictEqual(store.compactBattleArt(b),b);
// Environment placements embed the same canonical vector copies as battlefield
// elements (dense Stage35 bamboo previously exceeded quota in this third list).
const environmentBattle=plain(snapshot),environmentAsset=plain(project.library.find(a=>a.vector));
environmentBattle.honroEnvironment.placements.push({id:'codec-environment-fixture',assetId:environmentAsset.id,x:123,y:456,scale:.8,asset:environmentAsset});
const environmentBefore=JSON.stringify(environmentBattle),environmentPacked=store.compactBattleArt(environmentBattle),placed=environmentPacked.honroEnvironment.placements.at(-1);
assert.equal(placed.asset.honroStaticAssetRef,1);assert.equal(JSON.stringify(environmentBattle),environmentBefore,'environment compaction does not mutate live data');
assert(store.restoreBattleArt(environmentPacked));assert.deepEqual(plain(environmentPacked),environmentBattle,'all environment metadata and artwork restore exactly');
environmentBattle.honroEnvironment.placements.at(-1).asset.name+=' user edit';assert.equal(store.compactBattleArt(environmentBattle).honroEnvironment.placements.at(-1).asset.name,environmentBattle.honroEnvironment.placements.at(-1).asset.name,'modified environment artwork stays inline');
const lateEnvironment=store.compactBattleArt(JSON.parse(environmentBefore));assert(lateEnvironment.honroEnvironment.placements.some(p=>p.asset?.honroStaticAssetRef===1));
lateEnvironment.honroEnvironment.placements.find(p=>p.asset?.honroStaticAssetRef===1).asset.signature+=' stale';const lateEnvironmentBytes=JSON.stringify(lateEnvironment);
assert.equal(store.restoreBattleArt(lateEnvironment),false);assert.equal(JSON.stringify(lateEnvironment),lateEnvironmentBytes,'environment mismatch leaves earlier element references unresolved');
// A late invalid reference must not partially replace earlier valid references.
const late=JSON.parse(text).honroBattle,allRefs=['honroLandmarks','honroElements'].flatMap(k=>late[k]||[]).filter(i=>i.asset?.honroStaticAssetRef===1);
assert(allRefs.length>1);allRefs.at(-1).asset.signature+=' stale';const lateBytes=JSON.stringify(late);
assert.equal(store.restoreBattleArt(late),false);assert.equal(JSON.stringify(late),lateBytes,'late failure leaves all earlier references unresolved');
// Restored per-instance artwork cannot alias the canonical library or another instance.
const isolated=JSON.parse(text).honroBattle;assert(store.restoreBattleArt(isolated));
const rows=['honroLandmarks','honroElements'].flatMap(k=>isolated[k]||[]).filter(i=>i.asset?.vector),same=rows.find((r,i)=>rows.some((t,j)=>j!==i&&t.asset.id===r.asset.id));
assert(same);const peer=rows.find(r=>r!==same&&r.asset.id===same.asset.id),canonical=g.HONRO_PROJECT.library.find(a=>a.id===same.asset.id),canonicalBytes=JSON.stringify(canonical),peerBytes=JSON.stringify(peer.asset);
same.asset.name+=' instance edit';assert.equal(JSON.stringify(peer.asset),peerBytes);assert.equal(JSON.stringify(canonical),canonicalBytes);
// Actual Continue failure neither mounts a partial battle nor overwrites saved bytes.
h.storage.set(KEY,text);g.HONRO_PROJECT={library:[]};const unresolved=h.reload(),unresolvedProfile=JSON.stringify(unresolved.profile);
unresolved.continue();assert(!unresolved.engine);assert.match(unresolved.lastNotice,/그림 자료/);assert.equal(JSON.stringify(unresolved.profile),unresolvedProfile);assert.equal(h.storage.get(KEY),text);
g.HONRO_PROJECT=plain(project);
// Exercise production CampaignEntry's asynchronous handoff, not just direct restore.
vm.runInContext(await readFile('shared/runtime/campaign-entry.js','utf8'),g);
const createNode=g.document.createElement;g.document.createElement=(...args)=>Object.assign(createNode(...args),{replaceChildren(){}});g.document.createTextNode=text=>({textContent:text});
h.storage.set(KEY,text);g.HONRO_PROJECT={library:[]};const deferred=h.reload();let loaded=false,resolveLoad,loadCalls=0;
g.HonroCampaignLoader={destination:()=>31,has:()=>loaded,ensureStage:()=>{loadCalls++;return new Promise(resolve=>{resolveLoad=resolve;});},prewarmNext(){}};
deferred.continue();deferred.continue();assert.equal(loadCalls,1,'repeated Continue shares one pending stage load');assert(!deferred.engine);assert.equal(h.storage.get(KEY),text);
g.HONRO_PROJECT=plain(project);loaded=true;resolveLoad();await Promise.resolve();await Promise.resolve();assert(deferred.engine,'pending Continue mounts only after stage source becomes available');
for(const key of ['units','terrain','waters','honroAct4PreviewState','phase','round','active'])assert.deepEqual(plain(deferred.engine.b[key]),snapshot[key],key+' deferred Continue');
assert(!g.HonroCampaignEntry.isPending(deferred));delete g.HonroCampaignLoader;
// Actual App Continue consumes compact storage after campaign source readiness.
h.storage.set(KEY,text);const app=h.reload();assert(!app.profileStore.locked);app.continue();assert(app.engine);assert.equal(app.engine.b.honroStage,31);
for(const key of ['units','terrain','waters','honroAct4PreviewState','phase','round','active'])assert.deepEqual(plain(app.engine.b[key]),snapshot[key],key+' Continue');
const originalBytes=text;quota=8;assert.equal(app.profileStore.save(app.profile),false);assert.equal(h.storage.get(KEY),originalBytes,'failed writes preserve prior bytes');
await mkdir('_local/reports/act4-vector-storage',{recursive:true});const report={scope:'Actual profile store and App Continue with explicit5MiB UTF16 quota fixture; not browser quota measurement',rawCharacters:original.length,storedCharacters:text.length,storedUTF16Bytes:text.length*2,writes,checks:['legacy schema1–5 migration and exact save bytes','nonmutating compact save','exact dynamic state','lazy-load cold read','atomic missing/mismatched/late asset rejection','environment placement exact compaction and modified artwork preservation','environment failure atomic across all lists','independent restored instance clones','actual App failed-restore profile and bytes preserved','exact source restore','modified/custom/legacy retained','actual deferred and repeated App Continue','actual App Continue','failed-write bytes retained']};await writeFile('_local/reports/act4-vector-storage/result.json',JSON.stringify(report,null,2));console.log(report);
