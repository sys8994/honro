/** Current22 preservation against the fixed latest14 baseline. This does not
 * replace any historical golden test or approve tactical/visual quality. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const plain=v=>JSON.parse(JSON.stringify(v));
const bytes=await readFile('tests/fixtures/vertical-stages/stage22-source-boundary.json'),f=JSON.parse(bytes);
assert.equal(hash(bytes),'0984c0f457fb6de9b50330a0e7b398294b4b06740c4621435c06cc65f38e756d','Immutable pre22/latest14 baseline');
assert.equal(f.sourceCommit,'72cc20e9711df726aa8a01a03b5f9156fd62bb50');
const p=JSON.parse(await readFile('shared/data/campaign.json'));
const old=JSON.parse(await readFile('tests/fixtures/vertical-stages/before-stages.json')).stages.find(s=>s.metadata.stageId===22);
assert.equal(hash(old),f.stageSha256[22],'Original22 fixture equals the declared baseline');
// Explicit reviewed iteration6 asset additions; no namespace wildcard can
// admit undeclared assets. Existing608 assets remain byte-exact.
const addedAssetIds=[
 "stage22:vertical-connected-retaining-walls",
 "stage22:vertical-east-return-bearing",
 "stage22:vertical-comparison-archive-bearing",
 "stage22:vertical-lower-return-bearing",
 "stage22:vertical-west-register-wing",
 "stage22:vertical-middle-register-wing",
 "stage22:vertical-east-register-wing",
 "stage22:vertical-report-archive-load-frame",
 "stage22:vertical-lower-clerk-office",
 "stage22:vertical-seal-record-bay",
 "stage22:vertical-report-record-bay",
 "stage22:vertical-main-document-archive",
 "stage22:vertical-west-open-gallery",
 "stage22:vertical-upper-register-bay",
 "stage22:vertical-comparison-hall",
 "stage22:vertical-comparison-table",
 "stage22:vertical-record-lamp",
 "stage22:vertical-lower-return-rail",
 "stage22:vertical-register-rise-rail",
 "stage22:vertical-optional-west-rail",
 "stage22:vertical-west-gallery-return-rail",
 "stage22:vertical-comparison-ascent-rail",
 "stage22:vertical-continuous-report-passage-rail"
];
const party=u=>Object.fromEntries(Object.entries(u).filter(([k])=>!['x','y','surfaceId'].includes(k)));
const event=e=>({id:e.id,once:e.once,when:e.when,action:Object.fromEntries(['type','kind','n','source','act3Authored','elite'].map(k=>[k,e.action[k]]))});
function boundary(p){
 assert.deepEqual(Object.fromEntries(Object.entries(p).filter(([k])=>!['stages','library'].includes(k))),f.projectGlobal,'All global project fields');
 assert.deepEqual(p.stages.map(s=>s.metadata.stageId),Array.from({length:30},(_,i)=>i+1),'Exact stage membership/order');
 for(const s of p.stages)if(s.metadata.stageId!==22)assert.equal(hash(s),f.stageSha256[s.metadata.stageId],'Non-target stage '+s.metadata.stageId);
 assert.deepEqual(p.library.map(a=>a.id),[...f.libraryOrder,...addedAssetIds],'Only enumerated additions, exact order, no duplicates');
 for(const a of p.library)if(Object.hasOwn(f.librarySha256,a.id))assert.equal(hash(a),f.librarySha256[a.id],'Existing asset '+a.id);
 const s=p.stages[21];
 assert.equal(s.initialState.honroVerticalStage22Revision,1);
 assert.equal(s.initialState.honroVerticalStage22EncounterRevision,1,'Raw canonical encounter opt-in');
 assert.equal(s.initialState.honroVerticalStage22PopulationCap,35,'Raw canonical finite cap');
 assert.equal(s.units.filter(u=>u.team==='enemy').length,26,'Raw canonical initial roster');
 assert.equal(s.units.filter(u=>u.team==='enemy'&&u.stageOverrides?.honroAct3Elite).length,6,'Raw canonical elite roster');
 assert.deepEqual(Object.keys(s.initialState.honroVerticalStage22Activation||{}),['seal-porch','lower-ramp','ledger-front','near-gallery','register-rise','register-court','comparison-court','seal-response','ledger-response','register-response','comparison-lanterns'],'Raw canonical authored activation cells');
 assert.deepEqual(Object.keys(s.initialState.honroVerticalStage22Spec?.entries||{}),['act3-response-22-0','act3-response-22-1','act3-response-22-2','act3-compare-ledgers'],'Raw canonical finite entry inventory');
 assert.deepEqual(s.objectives,old.objectives,'Original victory rules');
 for(const[k,v]of Object.entries(old.initialState))assert.deepEqual(s.initialState[k],v,'Original initial state '+k);
 for(const k of Object.keys(s.initialState))assert(Object.hasOwn(old.initialState,k)||k.startsWith('honroVerticalStage22'),'No unrelated initial state extension '+k);
 assert.deepEqual(s.units.filter(u=>u.team!=='enemy').map(party),old.units.filter(u=>u.team!=='enemy').map(party),'Only party placement changes');
 for(const u of s.units.filter(u=>u.team==='player'))assert.equal(u.surfaceId,'v22-lower-court','Actual initial party support');
 assert.deepEqual(s.events.map(event),old.events.map(event),'Original finite response trigger/kind/count/source');
}
boundary(p);
const negatives=[];
for(const[id,mutate]of [
 ['other-stage',p=>p.stages[7].width++],['latest14-map',p=>p.stages[13].width++],
 ['old-density-enemy',p=>p.stages[10].units.find(u=>u.team==='enemy').x++],
 ['existing-art',p=>p.library[0].name+=' drift'],['undeclared-art',p=>p.library.push({...p.library.at(-1),id:'stage22:vertical-unreviewed'})],
 ['global',p=>p.name+=' drift'],['stage-order',p=>p.stages.reverse()],
 ['party-hp',p=>p.stages[21].units.find(u=>u.team==='player').hp=99999],
 ['objective',p=>p.stages[21].initialState.honroAct3Steps.at(-1).kind='clear'],
 ['response-count',p=>p.stages[21].events[0].action.n++],
 ['missing-encounter-revision',p=>delete p.stages[21].initialState.honroVerticalStage22EncounterRevision],
 ['wrong-cap',p=>p.stages[21].initialState.honroVerticalStage22PopulationCap=999],
 ['missing-enemies',p=>p.stages[21].units=p.stages[21].units.filter(u=>u.team!=='enemy')],
 ['missing-activation',p=>delete p.stages[21].initialState.honroVerticalStage22Activation],
 ['missing-entry-spec',p=>delete p.stages[21].initialState.honroVerticalStage22Spec]
]){const q=plain(p);mutate(q);assert.throws(()=>boundary(q),id+' must not be hidden');negatives.push(id);}

const buildMarker="'stage14-vertical','stage22-vertical']",oldBuildMarker="'stage14-vertical']";
const oldDispatch=" if(t.honroSpaceSurfaceId&&G.HonroAct2SpatialArt?.active(this.battle))return G.HonroAct2SpatialArt.terrain(c,t,this.battle);";
const newDispatch=` // Fresh vertical22 opts only its authored, clipped current-solid planes into
 // the existing painter. Other Act3 maps and old saves keep their old branch.
 const verticalArchivePlanes=(t.honroSpaceSurfaceId||t.honroAct3Gate)&&this.battle?.honroStage===22&&!this.battle.honroCustom&&this.battle.honroVerticalStage22Revision===1&&this.battle.honroMap?.vertical22Art?.revision===1&&this.battle.honroMap?.space?.terrainPlanes?.some(p=>p.terrainId===t.id);
 if(G.HonroAct2SpatialArt&&((t.honroSpaceSurfaceId&&G.HonroAct2SpatialArt.active(this.battle))||verticalArchivePlanes))return G.HonroAct2SpatialArt.terrain(c,t,this.battle);`;
// Exact independently published party-motion integration, ca03e11 / public
// master2322c6d (same tree). Keep the pre22 fixture and every other source
// immutable; unknown motion changes still fail, including negative controls.
const publishedMotion = Object.fromEntries([
 ['shared/runtime/party-rig.js',{before:'6943fbaf7f51a8c58cfe3797837830d48e920b62697a11d64032a83079a76d63',after:'8ae6a0d5e5ffdd53bf57a1e9c1f43ba9ab2f59ac3c254275d4594a2d9ffbe405'}],
 ['shared/runtime/renderer.js',{before:'38006988f48c26983d2a69db39cd531e05471afc51b108d848b814d4eefe642c',after:'68e8819039c46987c9d2ab6928731c6f32af66d4c96e1546c20b3dee2e5c0012'}]
]);
function sourceBoundary(source){
 for(const[path,sha]of Object.entries(f.unchangedFiles)){
  const approved=publishedMotion[path],actual=hash(source[path]);
  if(approved){assert.equal(sha,approved.before,'Immutable pre-motion source '+path);assert([approved.before,approved.after].includes(actual),'Exact published motion or pre-motion source '+path);}
  else assert.equal(actual,sha,'Unchanged production source '+path);
 }
 assert.equal(source['shared/build.mjs'].split(buildMarker).length,2,'Exactly one declared22 registration');
 assert.equal(hash(source['shared/build.mjs'].replace(buildMarker,oldBuildMarker)),f.buildBeforeSha256,'Only22 shared registration');
 assert.equal(source['shared/runtime/art-dark.js'].split(newDispatch).length,2,'Exactly the declared fresh22 painter opt-in');
 assert.equal(hash(source['shared/runtime/art-dark.js'].replace(newDispatch,oldDispatch)),f.artDarkBeforeSha256,'Painter unchanged outside declared22 prefix');
}
const sources=Object.fromEntries(await Promise.all([...Object.keys(f.unchangedFiles),'shared/build.mjs','shared/runtime/art-dark.js'].map(async path=>[path,await readFile(path,'utf8')])));
sourceBoundary(sources);
for(const path of ['shared/runtime/party-rig.js','shared/runtime/renderer.js','shared/runtime/stage14-vertical.js','shared/engine/src/physics.ts','shared/runtime/encounter-density.js','shared/build.mjs','shared/runtime/art-dark.js']){
 assert.throws(()=>sourceBoundary({...sources,[path]:sources[path]+'\n// unapproved drift\n'}),'Production drift must fail '+path);negatives.push('source:'+path);
}
await mkdir('_local/reports/vertical-stages',{recursive:true});
await writeFile('_local/reports/vertical-stages/stage22-source-boundary.json',JSON.stringify({passed:true,sourceCommit:f.sourceCommit,sourceTree:f.sourceTree,baselineFixtureSha256:hash(bytes),nonTargetStages:29,includingLatest14:true,existingAssets:f.libraryOrder.length,addedAssetIds,unchangedProductionFiles:Object.keys(f.unchangedFiles).length-Object.keys(publishedMotion).length,publishedMotionSources:publishedMotion,negativeControls:negatives,scope:'Current source preservation; original22 goals/party/response semantics, latest14, existing8 density maps and global physics. Dedicated22 runtime has separate behavioral contracts. No historical golden rewrite or browser/gameplay/visual approval.'},null,2)+'\n');
console.log('PASS current22 boundary: exact29 stages,608 assets,126 fixed sources plus2 exact published-motion alternatives and '+negatives.length+' negative controls');
