/** Synthetic/model cross-version contract; never opens a browser or user storage. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
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
const packed=plain(S.compactBattleArt(battle));assert(packed.honroLocalArtTable,'No local-art table');
const restored=plain(packed);assert(S.restoreBattleArt(restored));assert.deepEqual(restored,battle,'Fresh roundtrip');
const hashes=xs=>Object.fromEntries(xs.map(x=>[String(x.id),sha(x)]));
const gameplay=x=>JSON.parse(JSON.stringify(x,(k,v)=>k==='asset'&&v?.id===bodyId?{id:bodyId,stage3ArtworkExcluded:true}:v));
const snapshot={format:1,scope:'Synthetic initial campaign battle; model codec only. No user storage, no gameplay completion.',stage,stages:hashes(project.stages),otherAssets:hashes(project.library.filter(a=>a.id!==bodyId)),bodySha:sha(body),battle,packed,gameplay:gameplay(battle)};
if(mode==='snapshot'){
 assert(!body.params?.paintBeyondTerrainDomain,'Baseline unexpectedly contains new paint flag');
 await mkdir(path.dirname(file),{recursive:true});await writeFile(file,JSON.stringify(snapshot));console.log(JSON.stringify({ok:true,mode,bodySha:snapshot.bodySha,inlineBytes:Buffer.byteLength(JSON.stringify(battle)),packedBytes:Buffer.byteLength(JSON.stringify(packed))}));
}else{
 const old=JSON.parse(await readFile(file,'utf8'));assert.equal(old.format,1);
 assert.deepEqual(snapshot.stage,old.stage,'Stage3 authored structure/story/camera/placements changed');
 assert.deepEqual(snapshot.stages,old.stages,'Stage data changed');assert.deepEqual(snapshot.otherAssets,old.otherAssets,'An asset other than Stage3 BODY changed');
 assert.notEqual(snapshot.bodySha,old.bodySha,'No registered BODY change');
 assert.equal(body.params?.paintBeyondTerrainDomain,true,'Fresh BODY lacks opt-in paint flag');
 assert.deepEqual(plain(body.params?.omitTerrainClosureIds),['ferry-ground']);
 assert.deepEqual(snapshot.gameplay,old.gameplay,'Compiled battle differs outside exact BODY asset payload');
 // Decode the OLD bytes with the NEW codec, both with and without current art providers.
 for(const emptyProvider of [false,true]){
  const library=project.library;if(emptyProvider)project.library=[];
  try{
   const migrated=plain(old.packed),before=JSON.stringify(migrated);assert(S.restoreBattleArt(migrated));assert.deepEqual(migrated,old.battle,'Old packed save migrated artwork or state');
   const original=plain(old.battle),originalText=JSON.stringify(original),repacked=plain(S.compactBattleArt(original));assert.equal(JSON.stringify(original),originalText,'Encode mutated original');
   assert(S.restoreBattleArt(repacked));assert.deepEqual(repacked,old.battle,'Old inline re-encoding changed state');
   assert.equal(JSON.stringify(migrated).includes('"paintBeyondTerrainDomain":true'),false,'Old saved battle gained opt-in flag');
   const profile=h.profileThrough(2);profile.lastStage=3;profile.honroBattle=plain(old.battle);
   const inlineProfile=JSON.stringify(profile),compactProfile=JSON.stringify({...profile,honroBattle:old.packed});
   assert.deepEqual(plain(S.migrate(compactProfile)),plain(S.migrate(inlineProfile)),'Packed vs inline profile migration differs');
  }finally{project.library=library;}
 }
 // Same ID but saved variant must remain byte-for-byte, never replaced by provider.
 const variant=plain(old.battle);const instances=[...(variant.honroLandmarks||[]),...(variant.honroElements||[])].filter(x=>x.asset?.id===bodyId);assert(instances.length);
 instances[0].asset.params.savedFixtureVariant='keep-exact';const variantPacked=plain(S.compactBattleArt(variant));assert(S.restoreBattleArt(variantPacked));assert.deepEqual(variantPacked,variant);
 const result={ok:true,mode,authoredAllStagesExact:true,otherAssetsExact:true,compiledGameplayExact:true,oldPackedExact:true,oldInlineExact:true,providerIndependent:true,savedVariantExact:true,freshRoundtripExact:true,oldSnapshotsUnflagged:true,freshBodyFlagged:true,oldBodySha:old.bodySha,newBodySha:snapshot.bodySha,oldInlineBytes:Buffer.byteLength(JSON.stringify(old.battle)),newInlineBytes:Buffer.byteLength(JSON.stringify(battle)),newPackedBytes:Buffer.byteLength(JSON.stringify(packed)),scope:snapshot.scope};
 await writeFile(file+'.verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
