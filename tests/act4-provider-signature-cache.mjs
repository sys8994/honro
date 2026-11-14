import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const g={HONRO_CORE:{},HONRO_PROJECT:{library:[]},structuredClone};
const source=await readFile('shared/runtime/profile-store.js','utf8');
const exposed=source.replace('G.HonroProfileStore={create,fresh,migrate,compactBattleArt,restoreBattleArt,needsLegacy33Art,verifyLegacy33Assets,needsLegacy34Art,verifyLegacy34Assets};','G.HonroProfileStore={create,fresh,migrate,compactBattleArt,restoreBattleArt,needsLegacy33Art,verifyLegacy33Assets,needsLegacy34Art,verifyLegacy34Assets};G.__cacheStats=()=>({chars:providerHashChars,size:providerHashCache.size,keysAreStrings:[...providerHashCache.keys()].every(x=>typeof x==="string")});');
assert.notEqual(exposed,source);vm.runInNewContext(exposed,g);
const S=g.HonroProfileStore;
function signature(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return text.length+':'+(h>>>0).toString(16)}
const src={id:'official-qa',vector:{root:{d:'M0 0L10 10'},labels:['한','🐟']},collision:[]};g.HONRO_PROJECT.library=[src];
const b={mode:'campaign',honroAct4Official:1,honroStage:40,honroLandmarks:[{asset:structuredClone(src)}],honroElements:[]};
function compact(){return S.compactBattleArt(b).honroLandmarks[0].asset}
function expected(){return signature(JSON.stringify(src))}
assert.equal(compact().signature,expected());assert.equal(compact().signature,expected());
// Same provider object, new content: never reuse its previous signature.
src.vector.root.d='M1 2L3 4';assert.equal(compact().honroStaticAssetRef,undefined);
b.honroLandmarks[0].asset=structuredClone(src);const changed=compact();assert.equal(changed.signature,expected());
const restored={honroLandmarks:[{asset:{...changed}}]};assert(S.restoreBattleArt(restored));assert.deepEqual(JSON.parse(JSON.stringify(restored.honroLandmarks[0].asset)),src);
src.vector.root.d='M5 6L7 8';const forged={honroLandmarks:[{asset:{...changed}}]};const before=JSON.stringify(forged);assert.equal(S.restoreBattleArt(forged),false);assert.equal(JSON.stringify(forged),before);
// An exact pre-optimization signature resolves only for that official stage
// and only when the replacement matches the expected shipped provider.
const previous=changed.signature,current=expected();
g.HONRO_PREVIOUS_TERRAIN_ART={[src.id]:{stage:40,previous,current}};
const prior=()=>({...b,honroLandmarks:[{asset:{...changed}}],terrain:[{id:'solid'}],round:7});
const continued=prior();
assert(S.restoreBattleArt(continued));
assert.equal(continued.honroLandmarks[0].asset.vector.root.d,src.vector.root.d);
assert.deepEqual(continued.terrain,[{id:'solid'}]);
assert.equal(continued.round,7);
assert.equal(S.restoreBattleArt({...prior(),honroStage:39}),false);
assert.equal(S.restoreBattleArt({...prior(),honroCustom:true}),false);
assert.equal(S.restoreBattleArt({...prior(),honroMapOrigin:'workshop'}),false);
g.HONRO_PREVIOUS_TERRAIN_ART[src.id].current='invalid';
assert.equal(S.restoreBattleArt(prior()),false);
// Mutating a live asset after warming must stay inline; custom is never compacted.
b.honroLandmarks[0].asset.vector.root.d='M9 9';assert.equal(compact().honroStaticAssetRef,undefined);
b.honroCustom=true;b.honroLandmarks[0].asset=structuredClone(src);assert.equal(S.compactBattleArt(b),b);delete b.honroCustom;
// A replacement provider with the same id is compared by current content.
const replacement=structuredClone(src);replacement.vector.root.d='M10 10';g.HONRO_PROJECT.library=[replacement];assert.equal(compact().honroStaticAssetRef,undefined);b.honroLandmarks[0].asset=structuredClone(replacement);assert.equal(compact().signature,signature(JSON.stringify(replacement)));
// Exercise eviction and an oversized provider without exposing a production API.
for(let i=0;i<12;i++){const a={id:'large-'+i,vector:{data:String(i).repeat(1000000)}};g.HONRO_PROJECT.library=[a];b.honroLandmarks=[{asset:structuredClone(a)}];assert.equal(S.compactBattleArt(b).honroLandmarks[0].asset.signature,signature(JSON.stringify(a)));assert(g.__cacheStats().chars<=9000000);assert(g.__cacheStats().keysAreStrings);}
const beforeOversize=g.__cacheStats().chars,big={id:'too-large',vector:{data:'z'.repeat(9000001)}};g.HONRO_PROJECT.library=[big];b.honroLandmarks=[{asset:structuredClone(big)}];assert.equal(S.compactBattleArt(b).honroLandmarks[0].asset.signature,signature(JSON.stringify(big)));assert.equal(g.__cacheStats().chars,beforeOversize);
console.log('PASS exact provider content cache, mutation, replacement, custom, eviction and atomic restore');
