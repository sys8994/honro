/** Actual model author/compile boundary: lazy single-chapter projects and
 * resolved artwork fallback, not browser loading or visual acceptance. */
import assert from 'node:assert/strict';import vm from 'node:vm';import{readFile}from'node:fs/promises';import{runtime}from'../game/tests/helpers.mjs';
process.env.HONRO_STAGE11_COMPACT='1';process.env.HONRO_ACT4_RELEASE='1';
const g=await runtime({legacyMaps:false,productionStory:true}),d=g.HONRO_STAGE11_COMPACT_DATA,copy=x=>JSON.parse(JSON.stringify(x)),ids=new Set(d.assets.map(a=>a.id)),library=g.HONRO_PROJECT.library.filter(a=>!ids.has(a.id));
const other={...g.HONRO_PROJECT,stages:[g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===31)],library};
assert.equal(g.HonroStage11Compact.author(other),other,'Lazy non-11 chapter passes through unchanged');
const local={...g.HONRO_PROJECT,stages:[copy(d.source)],library},authored=g.HonroStage11Compact.author(local);
assert.deepEqual(JSON.parse(JSON.stringify(authored.stages)),[copy(d.stage)]);assert.equal(authored.library.length,library.length+d.assets.length);assert.equal(local.library.length,library.length);
assert.throws(()=>g.HonroStage11Compact.author({...local,stages:[{...copy(d.source),width:123}]}),/source changed/,'Real source drift still fails closed');
g.HonroScene=class{terrain(){return'fallback';}};vm.runInContext(await readFile('shared/runtime/stage11-compact-art.js','utf8'),g);
const b=g.HonroMaps.createBattle(authored.stages[0],authored,undefined,{origin:'campaign'}),t=b.terrain.find(t=>t.id==='compact-firing-rock'),A=g.HonroStage11CompactArt;
assert(A.covered(t,b),'Only actual resolved collision-free artwork covers diagnostic paint');assert(!A.covered({...t,broken:true},b));assert(!A.covered(t,{...b,honroStage11CompactRevision:undefined}));assert(!A.covered(t,{...b,honroLandmarks:[]}));assert(!A.covered(t,{...b,honroLandmarks:b.honroLandmarks.map(l=>l.nativeTerrainId===t.id?{...l,asset:undefined}:l)}));
console.log(JSON.stringify({lazyOtherChapter:'pass',lazy11:'pass',sourceDrift:'rejected',nativeAssetFallback:'pass',assets:d.assets.length,scope:'Model/compile boundaries only; browser lazy loading remains separate'}));
