/** Author/adapter and isolated codec contracts only; no full build, user save or play. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {readWorldSource} from '../tools/act4-source/world-source.mjs';
import {applyAct4HandoffArt} from '../shared/act4-handoff-art.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex'),hash=x=>sha(JSON.stringify(x));
const ref=process.env.BASELINE_REF||'be99eb99';assert.match(ref,/^[a-f0-9]{8,40}$/);
const show=f=>execFileSync('git',['show',`${ref}:${f}`],{maxBuffer:32*1024*1024});
const baseline=show('shared/act4-handoff-art.mjs').toString();
assert.equal(sha(baseline),'904b7479127fa912fa1a78526aec485b34ba58f9cc06c5c1e1ede734b1e1a1b4','Unexpected historical adapter');
const sourceUrl=new URL('../shared/act4-handoff-art.mjs',import.meta.url).href;
// Historical adapter reads the same current asset inputs; only URL resolution is adapted.
const old=await import('data:text/javascript;base64,'+Buffer.from(baseline.replaceAll('import.meta.url',JSON.stringify(sourceUrl))).toString('base64'));
const {bytes}=await readWorldSource();
assert.equal(sha(bytes),'8d2af83fbbe91ce1025bb6555647430dad110678596c9622670f99f2bb759b4b','Original world changed');
assert.equal(sha(await readFile(new URL('../shared/data/act4/handoff-art/32.json',import.meta.url))),'68df794e3ddeababfbd5a6890d0d1c0b0ecf9cb409f785d16c0f9e165e4a81a2','Stage32 BODY pack changed');
const p=JSON.parse(bytes),inputHash=hash(p),before=await old.applyAct4HandoffArt(p),after=await applyAct4HandoffArt(p);
assert.equal(hash(p),inputHash,'Input mutation');
const oldId='approved32:coastal-foundation',newId='act4-handoff:32:foundation';
const source=before.library.find(a=>a.id===oldId),replacement=after.library.find(a=>a.id===newId);
assert.equal(hash(source),'459f5244d4f7cbdad779dde53816f60e6960618de9afc2a3b6c6d30b735472d7','Old foundation changed');
assert(replacement,'New foundation missing');
assert.equal(after.library.length,before.library.length+1,'Only one asset may be added');
const retained=after.library.filter(a=>a.id!==newId);
for(let i=0;i<before.library.length;i++)assert.equal(hash(retained[i]),hash(before.library[i]),'Existing provider/order changed: '+before.library[i].id);
assert.equal(after.library.filter(a=>a.id===newId).length,1);
assert.deepEqual(replacement.collision,[]);assert(!replacement.interactionType);
for(const key of ['bounds','anchor'])assert.deepEqual(replacement[key],source[key],key+' changed');
assert.deepEqual(replacement.vector.clips,source.vector.clips,'Original alpha clips changed');
assert.deepEqual(replacement.vector.root.transform,source.vector.root.transform,'Original source transform changed');
const clipRefs=n=>[...(n.clipPath?[n.clipPath]:[]),...(n.children||[]).flatMap(clipRefs)];
assert.deepEqual(clipRefs(replacement.vector.root),clipRefs(source.vector.root),'Original alpha application changed');
assert.equal(after.stages.length,before.stages.length);
for(let i=0;i<before.stages.length;i++){
 const a=before.stages[i],b=after.stages[i];
 if(a.metadata.stageId!==32){assert.equal(hash(b),hash(a),'Other stage changed: '+a.metadata.stageId);continue;}
 const expected=structuredClone(a),element=expected.elements.find(e=>e.id==='approved32-coastal-foundation');
 assert.equal(element.assetId,oldId);element.assetId=newId;
 const normalized=structuredClone(b),compat=normalized.design.nativeArt.compatibilityAssetIds;
 assert.equal(compat.filter(id=>id===oldId).length,1,'Retired provider must be registered exactly once');
 normalized.design.nativeArt.compatibilityAssetIds=compat.filter(id=>id!==oldId);
 assert.deepEqual(normalized,expected,'Stage32 change exceeds foundation provider + compatibility ID');
}
// Actual profile-store codec, synthetic asset-only snapshot. No core/App/storage calls.
const g=vm.createContext({console,structuredClone,HONRO_CORE:{},HONRO_PROJECT:after});
vm.runInContext(await readFile(new URL('../shared/runtime/profile-store.js',import.meta.url),'utf8'),g);
const codec=g.HonroProfileStore,plain=x=>JSON.parse(JSON.stringify(x));
for(const asset of [source,replacement]){
 const snapshot={mode:'campaign',honroStage:32,honroAct4Official:1,honroMapOrigin:'campaign',honroLandmarks:[{id:'foundation',asset:plain(asset),x:-5500,y:-1950,scale:1,rotation:0}]};
 const original=hash(snapshot),packed=plain(codec.compactBattleArt(snapshot));assert.equal(hash(snapshot),original,'Codec mutated input');
 assert.equal(packed.honroLandmarks[0].asset.honroStaticAssetRef,1,'Expected provider compaction');
 const restored=plain(packed);assert(codec.restoreBattleArt(restored));assert.deepEqual(restored,snapshot);
 const saved=g.HONRO_PROJECT;g.HONRO_PROJECT={library:[]};
 try{
  const unavailable=plain(packed),unchanged=hash(unavailable);assert.equal(codec.restoreBattleArt(unavailable),false);assert.equal(hash(unavailable),unchanged,'Missing provider partially restored');
  const inline=plain(snapshot);assert(codec.restoreBattleArt(inline));assert.deepEqual(inline,snapshot);
 }finally{g.HONRO_PROJECT=saved;}
}
console.log(JSON.stringify({passed:true,baseline:ref,newId,oldProviderHash:hash(source),newProviderHash:hash(replacement),scope:'Adapter source/alpha/placement/other-stage/provider contracts and isolated codec JSON roundtrip only. Not compiled Engine physics, browser, quota, real-save migration or gameplay acceptance.'}));
