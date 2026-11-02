import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain,KEY,report} from './app-regression-helpers.mjs';

// SYNTHETIC native fixtures: existing Act1 vector geometry relabeled as Act2.
// This tests the codec, not final Act2 artwork, gameplay, browser quota or SOP art approval.
const h=await appHarness({productionStory:true}),{g}=h,S=g.HonroProfileStore;
const fixture=JSON.parse(await readFile('tests/fixtures/act1-art/stage02-entry.json','utf8'));
const app=h.load(fixture.profile);h.click('rest');h.finish(app);app.stopBattle();
const act1=plain(app.profile.honroBattle);
const decoration=plain(act1.honroLandmarks.find(i=>i.asset?.id.startsWith('act1-traced:')).asset);
const items=b=>[...b.honroLandmarks,...b.honroElements,...b.honroEnvironment.placements];
function synthetic(stage){
 const b=plain(act1);b.honroStage=stage;g.HonroCampaignMapRevision.stamp(b);
 const act2={...plain(decoration),id:`act2-traced:stage${stage}-synthetic-test`};
 b.honroLandmarks=[{id:'a1',asset:plain(decoration)},{id:'a2',asset:plain(act2)}];
 b.honroElements=[{id:'a1-twin',asset:plain(decoration)},{id:'a2-twin',asset:plain(act2)}];
 b.honroEnvironment={...b.honroEnvironment,placements:[{id:'a2-environment',asset:plain(act2)}]};
 return b;
}
const bytes=[];
for(const stage of [11,20]){
 const b=synthetic(stage),before=JSON.stringify(b),packed=S.compactBattleArt(b);
 assert.equal(JSON.stringify(b),before,'fresh encoding must not mutate live state');
 assert.equal(packed.honroLocalArtTable.version,1);assert.equal(packed.honroLocalArtTable.assets.length,2);
 assert.strictEqual(S.compactBattleArt(packed),packed,'idempotent encoding');
 assert.equal(JSON.stringify(packed).includes('honroStaticAssetRef'),false);
 assert.notStrictEqual(packed.honroLocalArtTable.assets[0],b.honroLandmarks[0].asset);
 const restored=plain(packed);assert(S.restoreBattleArt(restored));assert.deepEqual(restored,b);
 for(const left of items(restored))for(const right of items(restored))if(left!==right)assert.notStrictEqual(left.asset,right.asset);
 restored.honroLandmarks[1].asset.params.syntheticMutation=true;
 assert.equal(restored.honroElements[1].asset.params.syntheticMutation,undefined);
 assert.equal(packed.honroLocalArtTable.assets[1].params.syntheticMutation,undefined);
 const profile=plain(app.profile);profile.honroBattle=b;profile.lastStage=stage;
 const inline=JSON.stringify(profile),baseline=plain(S.migrate(inline));
 const store=S.create();assert(store.save(profile));const saved=h.storage.get(KEY);
 assert(saved.length<inline.length*.7,'duplicated synthetic vectors should shrink');
 assert.deepEqual(plain(S.create().initial),baseline,'reload must match old inline migration');
 const library=g.HONRO_PROJECT.library;g.HONRO_PROJECT.library=[];
 try{assert.deepEqual(plain(S.migrate(saved)),baseline,'local tables require no current provider');}finally{g.HONRO_PROJECT.library=library;}
 const title=h.load(JSON.parse(saved));assert(!title.engine);await title.export();const exported=await h.exported();
 assert(!JSON.stringify(exported).includes('honroLocalArtRef'));assert(!exported.honroBattle.honroLocalArtTable);
 assert.deepEqual(exported.honroBattle,baseline.honroBattle);await h.import(exported);
 assert.deepEqual(plain(title.profile.honroBattle),baseline.honroBattle);
 bytes.push({stage,inlineChars:inline.length,compactChars:saved.length});
}
const b=synthetic(11),packed=plain(S.compactBattleArt(b));
for(const change of [{honroStage:21},{honroStage:0},{honroStage:11.5},{honroStage:'11'},{honroCustom:true},{honroMapOrigin:'workshop'},{mode:'training'},{mode:'practice'}]){
 const excluded={...plain(b),...change};assert.strictEqual(S.compactBattleArt(excluded),excluded);
 const invalid={...plain(packed),...change},before=JSON.stringify(invalid);
 assert.equal(S.restoreBattleArt(invalid),false);assert.equal(JSON.stringify(invalid),before);
}
for(const change of [{id:'unknown:decoration'},{collision:[{x:1,y:1}]},{interactionType:'switch'},{honroStaticAssetRef:1},{vector:null}]){
 const excluded=synthetic(11);for(const item of items(excluded))Object.assign(item.asset,change);
 assert.strictEqual(S.compactBattleArt(excluded),excluded,'unsupported art remains inline');
}
let rejected=0;
function bad(change){
 const invalid=plain(packed);change(invalid);const before=JSON.stringify(invalid);
 assert.equal(S.restoreBattleArt(invalid),false);assert.equal(JSON.stringify(invalid),before,'malformed tables reject atomically');
 assert.throws(()=>S.migrate(JSON.stringify({...app.profile,honroBattle:invalid})),/Profile migration/);rejected++;
}
const first=b=>b.honroLandmarks[0].asset;
bad(b=>{first(b).signature='wrong';});bad(b=>{first(b).index=99;});bad(b=>{first(b).id='wrong';});
bad(b=>{delete b.honroLocalArtTable;});bad(b=>{b.honroLocalArtTable.version=2;});
bad(b=>{b.honroLocalArtTable.assets[1].collision=[{x:1}];});bad(b=>{b.honroLocalArtTable.assets[1].interactionType='switch';});
bad(b=>{b.honroLocalArtTable.assets[1].id='unknown:asset';});bad(b=>{b.honroLocalArtTable.assets[1].params.tampered=true;});
bad(b=>{b.honroLocalArtTable.assets.push(plain(b.honroLocalArtTable.assets[0]));});
bad(b=>{first(b).extra=true;});bad(b=>{b.honroLocalArtTable.extra=true;});
bad(b=>{b.honroElements.push({asset:{honroStaticAssetRef:1,id:'external-provider',signature:'invalid'}});});
const archiveKey=KEY+'-act4-before-map-revision-3-synthetic-preservation';h.storage.set(archiveKey,'exact archive bytes');
const store=S.create();assert(store.save({...app.profile,honroBattle:b}));assert.equal(h.storage.get(archiveKey),'exact archive bytes');
await report('act2-local-art-save',['Synthetic Act2 11/20 mixed-prefix roundtrip, reload and portable inline export','Pointer isolation, provider independence and scope exclusions',`${rejected} malformed table cases reject atomically`],{synthetic:true,bytes,archivesUntouched:true});
console.log(JSON.stringify({passed:true,synthetic:true,bytes,malformedRejections:rejected,limits:'Codec/model only; not final Act2 art, browser or play proof.'}));
