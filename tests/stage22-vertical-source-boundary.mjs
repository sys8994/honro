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
// No Stage22 art has entered canonical yet. Final integration must enumerate
// reviewed IDs here; a namespace wildcard cannot admit undeclared assets.
const addedAssetIds=[];
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
function sourceBoundary(source){
 for(const[path,sha]of Object.entries(f.unchangedFiles))assert.equal(hash(source[path]),sha,'Unchanged production source '+path);
 assert.equal(source['shared/build.mjs'].split(buildMarker).length,2,'Exactly one declared22 registration');
 assert.equal(hash(source['shared/build.mjs'].replace(buildMarker,oldBuildMarker)),f.buildBeforeSha256,'Only22 shared registration');
 assert.equal(source['shared/runtime/art-dark.js'].split(newDispatch).length,2,'Exactly the declared fresh22 painter opt-in');
 assert.equal(hash(source['shared/runtime/art-dark.js'].replace(newDispatch,oldDispatch)),f.artDarkBeforeSha256,'Painter unchanged outside declared22 prefix');
}
const sources=Object.fromEntries(await Promise.all([...Object.keys(f.unchangedFiles),'shared/build.mjs','shared/runtime/art-dark.js'].map(async path=>[path,await readFile(path,'utf8')])));
sourceBoundary(sources);
for(const path of ['shared/runtime/stage14-vertical.js','shared/engine/src/physics.ts','shared/runtime/encounter-density.js','shared/build.mjs','shared/runtime/art-dark.js']){
 assert.throws(()=>sourceBoundary({...sources,[path]:sources[path]+'\n// unapproved drift\n'}),'Production drift must fail '+path);negatives.push('source:'+path);
}
await mkdir('_local/reports/vertical-stages',{recursive:true});
await writeFile('_local/reports/vertical-stages/stage22-source-boundary.json',JSON.stringify({passed:true,sourceCommit:f.sourceCommit,sourceTree:f.sourceTree,baselineFixtureSha256:hash(bytes),nonTargetStages:29,includingLatest14:true,existingAssets:f.libraryOrder.length,addedAssetIds,unchangedProductionFiles:Object.keys(f.unchangedFiles).length,negativeControls:negatives,scope:'Current source preservation; original22 goals/party/response semantics, latest14, existing8 density maps and global physics. Dedicated22 runtime has separate behavioral contracts. No historical golden rewrite or browser/gameplay/visual approval.'},null,2)+'\n');
console.log('PASS current22 boundary: exact29 stages,608 assets,128 sources and '+negatives.length+' negative controls');
