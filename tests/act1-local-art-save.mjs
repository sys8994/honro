import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {appHarness,plain,KEY} from './app-regression-helpers.mjs';

const h=await appHarness({productionStory:true}),{g}=h,S=g.HonroProfileStore;
const fixture=JSON.parse(await readFile('tests/fixtures/act1-art/stage02-entry.json','utf8'));
const app=h.load(fixture.profile);h.click('rest');h.finish(app);
assert.equal(app.engine.b.honroStage,2);assert(!app.debugMode);app.stopBattle();
const original=plain(app.profile.honroBattle),originalText=JSON.stringify(original),compact=S.compactBattleArt(original);
assert.equal(JSON.stringify(original),originalText,'compaction mutated live battle');
assert.equal(compact.honroLocalArtTable.version,1);
assert.equal(compact.honroLocalArtTable.assets.length,2);
assert.strictEqual(S.compactBattleArt(compact),compact,'encoding must be idempotent');
const restored=plain(compact);assert(S.restoreBattleArt(restored));assert.deepEqual(restored,original);
const bodies=restored.honroLandmarks.filter(i=>i.asset?.id.startsWith('act1-traced:'));
const twin=restored.honroElements.find(i=>i.asset?.id===bodies[0].asset.id);
assert.notStrictEqual(bodies[0].asset,twin.asset,'restored placements share mutable assets');
bodies[0].asset.params.testMutation=1;assert.equal(twin.asset.params.testMutation,undefined);

// Same ID does not imply identical art. Preserve mutated variants byte-for-byte.
const variants=plain(original),changed=variants.honroElements.find(i=>i.asset?.id==='act1-traced:stage02-body-v2');
changed.asset.params.savedVariant='keep-me';
const variantCompact=plain(S.compactBattleArt(variants));assert(S.restoreBattleArt(variantCompact));assert.deepEqual(variantCompact,variants);
// Two distinct duplicated variants of the same ID get independent table rows.
const duplicateVariants=plain(original),variant=plain(duplicateVariants.honroElements.find(i=>i.asset?.id==='act1-traced:stage02-body-v2'));
variant.asset.params.savedVariant='duplicate-variant';duplicateVariants.honroElements.push(plain(variant),plain(variant));
const variantsPacked=plain(S.compactBattleArt(duplicateVariants));assert.equal(variantsPacked.honroLocalArtTable.assets.length,3);assert(S.restoreBattleArt(variantsPacked));assert.deepEqual(variantsPacked,duplicateVariants);
// A warm signature cache must never mask subsequent source mutation.
const mutated=plain(original);for(const item of [...mutated.honroLandmarks,...mutated.honroElements])if(item.asset?.id==='act1-traced:stage02-body-v2')item.asset.params.cacheMutation='new exact bytes';
const mutatedPacked=plain(S.compactBattleArt(mutated));assert(S.restoreBattleArt(mutatedPacked));assert.deepEqual(mutatedPacked,mutated);
for(const changedScope of [{honroCustom:true},{honroMapOrigin:'workshop'},{honroStage:11},{mode:'practice'}]){
 const custom={...original,...changedScope};assert.strictEqual(S.compactBattleArt(custom),custom);
}

// No current provider or network asset dependency is permitted for local art.
const library=g.HONRO_PROJECT.library;g.HONRO_PROJECT.library=[];
try{const independent=plain(compact);assert(S.restoreBattleArt(independent));assert.deepEqual(independent,original);}finally{g.HONRO_PROJECT.library=library;}

// All currently published Act1 BODY stages use the same self-contained format.
for(const stageId of [1,2,3,4,5,6]){const stage=g.HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===stageId);const battle=plain(g.HonroMaps.createBattle(stage,g.HONRO_PROJECT,undefined,{origin:'campaign'}));const packed=plain(S.compactBattleArt(battle));assert(packed.honroLocalArtTable,`Missing table for stage${stageId}`);assert(S.restoreBattleArt(packed));assert.deepEqual(packed,battle,`Stage${stageId} roundtrip`);}

const malformed=[];
function bad(change){const b=plain(compact);change(b);const before=JSON.stringify(b);assert.equal(S.restoreBattleArt(b),false);assert.equal(JSON.stringify(b),before,'failed restore partially mutated snapshot');malformed.push(b);}
const firstRef=b=>b.honroLandmarks.find(i=>i.asset?.honroLocalArtRef!==undefined).asset;
bad(b=>{firstRef(b).signature='wrong';});
bad(b=>{firstRef(b).index=999;});
bad(b=>{firstRef(b).id='wrong';});
bad(b=>{delete b.honroLocalArtTable;});
bad(b=>{b.honroLocalArtTable.version=2;});
bad(b=>{b.honroLocalArtTable.assets.push(plain(b.honroLocalArtTable.assets[0]));});
bad(b=>{b.honroLocalArtTable.assets[0].collision=[{invalid:true}];});
bad(b=>{b.honroStage=31;});
bad(b=>{b.honroLocalArtTable.assets[0].params.tampered=true;});
bad(b=>{firstRef(b).extra='unsupported';});
bad(b=>{b.honroElements.push({asset:{honroStaticAssetRef:1,id:'mixed',signature:'invalid'}});});

const profile=plain(app.profile);profile.honroBattle=original;
const inline=JSON.stringify(profile),saved=h.storage.get(KEY),stored=JSON.parse(saved);
assert(stored.honroBattle.honroLocalArtTable);assert(saved.length<inline.length*.6);
const baselineMigrated=plain(S.migrate(inline)),migrated=S.migrate(saved);assert(!migrated.honroBattle.honroLocalArtTable);
assert.deepEqual(plain(migrated),baselineMigrated,'compact and old inline profile migration differ');
for(const battle of malformed)assert.throws(()=>S.migrate(JSON.stringify({...profile,honroBattle:battle})),/Profile migration/);

// Normal title export remains the legacy portable inline representation.
const title=h.load(stored);assert(!title.engine);await title.export();
const exported=await h.exported();assert(!exported.honroBattle.honroLocalArtTable);
assert(!JSON.stringify(exported).includes('honroLocalArtRef'));
assert.deepEqual(exported.honroBattle,baselineMigrated.honroBattle);
await h.import(exported);assert(!title.profile.honroBattle.honroLocalArtTable);
assert.deepEqual(plain(title.profile.honroBattle),baselineMigrated.honroBattle);

// Synthetic quota boundary, not a claim about a particular browser quota.
const storage=g.localStorage,before=h.storage.get(KEY),limit=Math.ceil((inline.length+saved.length)/2);
const archiveKey=KEY+'-act4-before-map-revision-3-preserved-test';h.storage.set(archiveKey,'unmodified archive bytes');
g.localStorage={...storage,setItem(k,v){if(v.length>limit)throw Error('synthetic quota');storage.setItem(k,v);}};
try{
 assert.throws(()=>g.localStorage.setItem(KEY,inline),/synthetic quota/);assert.equal(h.storage.get(KEY),before);
 assert(title.profileStore.save(profile));assert(h.storage.get(KEY).length<limit);
 assert.equal(h.storage.get(archiveKey),'unmodified archive bytes');
 const goodBytes=h.storage.get(KEY);g.localStorage.setItem=()=>{throw Error('synthetic full storage');};
 assert.equal(title.profileStore.save(profile),false);assert.equal(h.storage.get(KEY),goodBytes);assert.deepEqual(profile.honroBattle,original);
}finally{g.localStorage=storage;}

const result={passed:true,scope:'Production App/model with DOM and storage doubles; normal-reward Stage2 fixture. No continuous campaign, browser quota or combat-clear claim.',publishedStageRoundtrips:[1,2,3,4,5,6],inlineProfileChars:inline.length,compactProfileChars:saved.length,reductionPercent:100*(1-saved.length/inline.length),tableAssets:2,roundtrip:true,mutationIsolation:true,providerIndependent:true,oldInlineCompatible:true,portableExportInline:true,atomicMalformedRejections:malformed.length,syntheticQuotaBoundary:limit,archivesUntouched:true};
await mkdir('_local/reports/act1-local-art-save',{recursive:true});await writeFile('_local/reports/act1-local-art-save/result.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
