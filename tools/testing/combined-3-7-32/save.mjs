/** Synthetic/model cross-version contract; never opens a browser or user storage. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {isDeepStrictEqual} from 'node:util';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
const [mode,file]=process.argv.slice(2);assert(['snapshot','verify'].includes(mode)&&file,'Usage: snapshot|verify SNAPSHOT.json');
const h=await appHarness({productionStory:true}),g=h.g,S=g.HonroProfileStore;
vm.runInContext('Date.now=()=>1794931200000;{let seed=3910;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);}',g);
const project=g.HONRO_PROJECT,stage=project.stages.find(s=>s.metadata?.stageId===3),bodyId='act1-site:3:body';assert(stage);
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const body=project.library.find(a=>a.id===bodyId);assert(body);
const battle=plain(g.HonroMaps.createBattle(stage,project,undefined,{origin:'campaign'}));
// The public codec intentionally leaves act1-site:* inline: that prefix is not
// eligible for the local-art table. Validate the real save representation, not
// a table which the production codec never promised for this asset family.
const rawEncoded=S.compactBattleArt(battle),encoded=plain(rawEncoded);
assert.strictEqual(S.compactBattleArt(rawEncoded),rawEncoded,'Encoding must be idempotent');
assert.equal(JSON.stringify(encoded).includes('honroStaticAssetRef'),false,'Unexpected provider-dependent encoding');
const bodyItems=x=>[...(x.honroLandmarks||[]),...(x.honroElements||[]),...(x.honroEnvironment?.placements||[])].filter(i=>i.asset?.id===bodyId);
assert(bodyItems(encoded).length>=2,'Expected duplicated inline BODY placements');
assert(bodyItems(encoded).every(i=>i.asset.vector&&!i.asset.honroLocalArtRef),'Site BODY must remain self-contained inline');
const representation=encoded.honroLocalArtTable?'mixed-inline-and-local-table':'inline';
const restored=plain(encoded);assert(S.restoreBattleArt(restored));assert.deepEqual(restored,battle,'Fresh save-representation roundtrip');
const hashes=xs=>Object.fromEntries(xs.map(x=>[String(x.id),sha(x)]));
const gameplay=x=>JSON.parse(JSON.stringify(x,(k,v)=>k==='asset'&&v?.id===bodyId?{id:bodyId,stage3ArtworkExcluded:true}:v));
const snapshot={format:2,representation,scope:'Synthetic initial campaign battle; model codec only. No user storage, no gameplay completion.',stage:plain(stage),stages:hashes(project.stages),otherAssets:hashes(project.library.filter(a=>a.id!==bodyId)),bodySha:sha(body),battle,encoded,gameplay:gameplay(battle)};
// Same official model harness, all authored stages. No extra browser or user data.
// Direct old-save migration remains the separate Stage3 encoded check below.
const projectBeforeAll50=sha(project),all50=[];
const codecRealmDiagnostics=[];
assert.deepEqual(project.stages.map(s=>s.metadata?.stageId).sort((a,b)=>a-b),Array.from({length:50},(_,i)=>i+1),'All fifty official stages required');
for(const source of project.stages){
 vm.runInContext('{let seed=3910;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);}',g);
 const st=plain(source);g.HonroMaps.compile(st,project);
 const original=plain(g.HonroMaps.createBattle(st,project,S.fresh(),{origin:'campaign'}));g.HonroStageRules.sanitizeStageBattle(original);
 const before=JSON.stringify(original),packed=plain(S.compactBattleArt(original));assert.equal(JSON.stringify(original),before,'All50 compact input mutation '+source.metadata.stageId);
 const roundtrip=plain(packed);assert(S.restoreBattleArt(roundtrip),'All50 restore rejected '+source.metadata.stageId);const rawDeepStrictEqual=isDeepStrictEqual(roundtrip,original),savedOriginal=plain(original),savedRestored=plain(roundtrip);const jsonExact=isDeepStrictEqual(savedRestored,savedOriginal);
 codecRealmDiagnostics.push({stage:source.metadata.stageId,rawDeepStrictEqual,jsonExact,expectedJSONSHA:sha(savedOriginal),restoredJSONSHA:sha(savedRestored)});
 if(!jsonExact){await mkdir(path.dirname(file),{recursive:true});await writeFile(file+'.codec-failure.json',JSON.stringify({mode,stage:source.metadata.stageId,codecRealmDiagnostics,scope:'Serialized save equality remains mandatory; no field normalization or waiver'},null,2));}
 assert(jsonExact,'All50 serialized exact roundtrip '+source.metadata.stageId+'; see codec-failure hashes');
 all50.push({id:source.metadata.stageId,full:sha(original),onlyStage3ArtworkNormalized:sha(gameplay(original)),roundtripExact:true,packedBytes:Buffer.byteLength(JSON.stringify(packed))});
}
assert.equal(sha(project),projectBeforeAll50,'All50 codec/compile mutated project');snapshot.all50=all50;snapshot.codecRealmDiagnostics=codecRealmDiagnostics;
console.log(JSON.stringify({mode,codecRealmDiagnostics,comparisonScope:"Actual JSON save data; VM object prototypes are not serialized, every saved field remains exact"}));
if(mode==='snapshot'){
 assert(!body.params?.paintBeyondTerrainDomain,'Baseline unexpectedly contains new paint flag');
 await mkdir(path.dirname(file),{recursive:true});await writeFile(file,JSON.stringify(snapshot));console.log(JSON.stringify({ok:true,mode,bodySha:snapshot.bodySha,inlineBytes:Buffer.byteLength(JSON.stringify(battle)),encodedBytes:Buffer.byteLength(JSON.stringify(encoded)),representation}));
}else{
 const old=JSON.parse(await readFile(file,'utf8'));assert.equal(old.format,2);
 assert.equal(old.all50?.length,50,'Baseline all50 codec evidence missing');assert.equal(snapshot.all50.length,50);
 for(const row of snapshot.all50){const prev=old.all50.find(x=>x.id===row.id);assert(prev?.roundtripExact&&row.roundtripExact);assert.equal(row.id===3?row.onlyStage3ArtworkNormalized:row.full,row.id===3?prev.onlyStage3ArtworkNormalized:prev.full,'All50 compiled state changed '+row.id);}
 assert.deepEqual(snapshot.stage,old.stage,'Stage3 authored structure/story/camera/placements changed');
 assert.deepEqual(snapshot.stages,old.stages,'Stage data changed');assert.deepEqual(snapshot.otherAssets,old.otherAssets,'An asset other than Stage3 BODY changed');
 assert.notEqual(snapshot.bodySha,old.bodySha,'No registered BODY change');
 assert.equal(body.params?.paintBeyondTerrainDomain,true,'Fresh BODY lacks opt-in paint flag');
 assert.deepEqual(plain(body.params?.omitTerrainClosureIds),['ferry-ground']);
 assert.deepEqual(snapshot.gameplay,old.gameplay,'Compiled battle differs outside exact BODY asset payload');
 // Decode the OLD production save representation with the NEW codec, both with and without current art providers.
 for(const emptyProvider of [false,true]){
  const library=project.library;if(emptyProvider)project.library=[];
  try{
   const migrated=plain(old.encoded);assert(S.restoreBattleArt(migrated));assert.deepEqual(migrated,old.battle,'Old saved representation migrated artwork or state');
   const original=plain(old.battle),originalText=JSON.stringify(original),repacked=plain(S.compactBattleArt(original));assert.equal(JSON.stringify(original),originalText,'Encode mutated original');
   assert(S.restoreBattleArt(repacked));assert.deepEqual(repacked,old.battle,'Old inline re-encoding changed state');
   assert.equal(JSON.stringify(migrated).includes('"paintBeyondTerrainDomain":true'),false,'Old saved battle gained opt-in flag');
   const profile=h.profileThrough(2);profile.lastStage=3;profile.honroBattle=plain(old.battle);
   const inlineProfile=JSON.stringify(profile),compactProfile=JSON.stringify({...profile,honroBattle:old.encoded});
   assert.deepEqual(plain(S.migrate(compactProfile)),plain(S.migrate(inlineProfile)),'Packed vs inline profile migration differs');
  }finally{project.library=library;}
 }
 // Same ID but saved variant must remain byte-for-byte, never replaced by provider.
 const variant=plain(old.battle);const instances=[...(variant.honroLandmarks||[]),...(variant.honroElements||[])].filter(x=>x.asset?.id===bodyId);assert(instances.length);
 instances[0].asset.params.savedFixtureVariant='keep-exact';const variantPacked=plain(S.compactBattleArt(variant));assert(S.restoreBattleArt(variantPacked));assert.deepEqual(variantPacked,variant);
 const result={ok:true,mode,authoredAllStagesExact:true,otherAssetsExact:true,compiledGameplayExact:true,oldSaveRepresentationExact:true,oldRepresentation:old.representation,newRepresentation:representation,oldInlineExact:true,providerIndependent:true,savedVariantExact:true,freshRoundtripExact:true,oldSnapshotsUnflagged:true,freshBodyFlagged:true,oldBodySha:old.bodySha,newBodySha:snapshot.bodySha,oldInlineBytes:Buffer.byteLength(JSON.stringify(old.battle)),newInlineBytes:Buffer.byteLength(JSON.stringify(battle)),newEncodedBytes:Buffer.byteLength(JSON.stringify(encoded)),scope:snapshot.scope};
 await writeFile(file+'.verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}

console.log(JSON.stringify({all50FreshCodecExact:true,other49FullBattleExact:mode==='verify',stage3OnlyExistingApprovedArtworkNormalization:true,oldCrossRestoreScope:'Stage3 only; not all historical 50-stage saves'}));
