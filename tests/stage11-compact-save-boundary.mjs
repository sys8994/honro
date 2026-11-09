/** Save/guard model regression, not normal play or browser evidence.
 * Uses the exact pre-change 412 export and frozen old runtime modules. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {runtimeEntries} from '../shared/build.mjs';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {createCompactProject} from '../tools/map-forge/stage11-compact-project.mjs';
const base='tests/fixtures/stage11-compact-save-boundary',out='_local/reports/act2-redesign-20261109/compact-save-boundary',hash=x=>createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:JSON.stringify(x)).digest('hex');
process.env.HONRO_ACT4_RELEASE='1';
const manifest=JSON.parse(await readFile(base+'/manifest.json','utf8'));
for(const [file,row]of Object.entries(manifest.files))assert.equal(hash(await readFile(base+'/'+file)),row.sha256,'exact frozen input '+file);
const h=await appHarness({productionStory:true}),g=h.g,V=g.HonroAct23V4,profileText=gunzipSync(await readFile(base+'/old412-entry-profile.json.gz')).toString('utf8'),saved=JSON.parse(profileText),oldBattle=plain(saved.honroBattle),checks=[];
assert.equal(hash(profileText),'5311a3d818bd27db8ec5a45afad5fef4175743cb4f8a2421f7d59685618dd370');
assert.equal(hash(oldBattle),'db18c24b223a7bf9569c466af98ac55b6a41ecc7e8ba8983fd8a69250e4dd399');
let app=h.load(h.profileThrough(10));
for(let cycle=0;cycle<2;cycle++){
 await h.import(saved);assert.deepEqual(plain(app.profile.honroBattle),oldBattle,'old412 imported exact');app.continue();assert.deepEqual(plain(app.engine.b),oldBattle,'old412 Continue exact');await app.export();const x=await h.exported();assert.deepEqual(x.honroBattle,oldBattle,'old412 exported exact');app=h.load(x);assert.deepEqual(plain(app.profile.honroBattle),oldBattle,'old412 reload exact');
}
checks.push('Exact old412 import/Continue/export/reload twice preserves whole battle');
// The old producer did not store new compact framing fields. Exercise their
// actual renderer fallback calls with a drawing recorder, not pixel approval.
const legacy=plain(oldBattle),m=g.HonroAct23V4Chapter11.memory(legacy);m.incoming={count:3,elapsed:1,distance:80};
const moves=[],ellipses=[],ctx={save(){},restore(){},translate(){},rotate(){},beginPath(){},moveTo(x,y){moves.push([x,y]);},lineTo(){},stroke(){},ellipse(...args){ellipses.push(args);}};
g.HonroAct23V4Chapter11.draw({landmark(){}},ctx,legacy);
assert(moves.some(([x,y])=>x===legacy.honroV4Chapter11.bier.left-190&&y===6500));
assert(ellipses.some(([x,y])=>x===1150-80&&y===6150+80*.55));
app=h.load(saved);app.continue();assert(g.HonroAct23V4Reviewed.begin(app,'arrival',['EDGE.ARRIVALS_11_0']));
assert.deepEqual(plain(app.dialogue.lines[0][2].camera.targets),[{x:1500,y:6330}]);
checks.push('Old412 actual draw fallbacks retain track6500/ambient6150+1150; opening camera1500/6330');
// Build a second VM with only the three root-owned modules replaced by their
// exact frozen pre-change source. The harness gets this VM through an in-memory
// optional parameter; production helper/source files remain untouched.
const changed=['shared/runtime/act23-v4.js','shared/runtime/act23-v4-ch11-scenes.js','shared/runtime/act23-v4-reviewed.js'],entries=await runtimeEntries({vector:false,render:false,productionStory:true}),baselineVM=vm.createContext({console,performance,structuredClone});
for(const entry of entries)vm.runInContext(changed.includes(entry.name)?await readFile(base+'/'+entry.name.split('/').at(-1)+'.txt','utf8'):entry.code,baselineVM);
let harnessText=await readFile('tests/app-regression-helpers.mjs','utf8');harnessText=harnessText.replace("'../game/tests/helpers.mjs'",JSON.stringify(new URL('../game/tests/helpers.mjs',import.meta.url).href)).replace('appHarness({productionStory=false}={})','appHarness({productionStory=false,providedRuntime}={})').replace('const g=await runtime({legacyMaps:false,productionStory})','const g=providedRuntime||await runtime({legacyMaps:false,productionStory})');
const baselineHarness=await import('data:text/javascript;base64,'+Buffer.from(harnessText).toString('base64')),oldH=await baselineHarness.appHarness({productionStory:true,providedRuntime:baselineVM});
const legacyRows=[];
for(const file of ['stage11-hold-pending-save.json','stage11-trace-exit-save.json']){
 const x=JSON.parse(await readFile('tests/fixtures/'+file,'utf8')),a=h.load(x),oldApp=oldH.load(x);
 const now=plain(a.profile),prior=plain(oldApp.profile),generated=[];
 if(!x.equipment){generated.push('equipment.runId (new random identity from existing equipment migration)');now.equipment.runId=prior.equipment.runId='generated-run-id';}
 assert.equal(hash(now),hash(prior),'three changed modules leave pre-v4 import policy unchanged');
 const row={file,unchangedMigration:true,normalizedGeneratedFields:generated,battleDiscardedByExistingPolicy:a.profile.honroBattle===null,restart:a.profile.honroMapRestart};
 if(a.profile.honroBattle){a.continue();oldApp.continue();const live=plain(a.engine.b),oldLive=plain(oldApp.engine.b);if(!x.honroBattle.honroReport){live.honroReport.attempt=oldLive.honroReport.attempt='generated-attempt-id';generated.push('honroReport.attempt (new wall-clock/serial report identity)');}assert.equal(hash(live),hash(oldLive),'pre-v4 Continue matches frozen three-module behavior');row.continuedBattleMatchesThreeModuleBaseline=true;row.savedTerrainPreserved=hash(a.engine.b.terrain)===hash(x.honroBattle.terrain);row.savedRoundPreserved=a.engine.b.round===x.honroBattle.round;assert(row.savedTerrainPreserved&&row.savedRoundPreserved);}
 legacyRows.push(row);
}
checks.push('Pre-v4 fixtures match frozen three-module behavior under the same current compatibility policy');
// Reached-goal conditions are INITIAL fixtures: completed earlier threat steps,
// opening receipts and four declared poses. No claimed travel or full victory.
const compact=createCompactProject(g,g.HONRO_PROJECT,'B-open'),st=compact.stages.find(s=>s.metadata.stageId===11),caseRows=[];
for(const name of ['three-at-exit','one-airborne','one-dead','all-four-grounded']){
 const p=h.profileThrough(10),b=g.HonroMaps.createBattle(st,compact,p,{origin:'campaign'});g.HonroStageRules.sanitizeStageBattle(b);const end=b.honroMarkers.find(m=>m.id==='11.exit'),floor=b.terrain.find(t=>t.id==='compact-floor'),party=b.units.filter(u=>u.side===0);
 for(const [i,u]of party.entries()){u.x=end.x-120+i*80;u.y=g.HONRO_CORE.topAt(floor,u.x);u.spawnX=u.x;u.spawnY=u.y;u.vx=0;u.vy=0;u.airborne=false;u.jumping=false;}
 if(name==='three-at-exit')party[3].x=end.x-500;
 if(name==='one-airborne'){party[3].y-=30;party[3].airborne=true;party[3].jumping=true;}
 if(name==='one-dead'){party[3].hp=0;party[3].dead=true;}
 const q=V.mem(b);q.done={'11.thread':true,'11.entry-threat':true,'11.exit-threat':true};q.reviewed11={revision:1,events:Object.fromEntries(['arrival','thread','approach','advance','low-beast','high-sightline','cover-guide'].map(k=>[k,{status:'done',ids:[],proof:{},fixture:true}])),positions:{},ambient:{count:8,elapsed:0,distance:0}};
 p.honroBattle=plain(b);app=h.load(p);app.continue();const before=plain(app.engine.b);V.tick(app,.025);const live=app.engine.b,done=!!V.mem(live).done['11.exit'],failure=V.failure(live),gathered=g.HonroAct23V4Reviewed.gathered(live),mission=plain(g.HonroObjectives.state(live,app.stage));
 caseRows.push({name,initialFixture:true,exitDone:done,gathered,failure,current:V.current(live)?.id,phase:live.phase,missionComplete:!!mission.complete,initialParty:before.units.filter(u=>u.side===0).map(u=>({id:u.id,x:u.x,y:u.y,dead:u.dead,airborne:u.airborne}))});
 if(name==='all-four-grounded'){assert(done);assert(gathered);assert(!failure);}else{assert(!done);assert(!gathered);}if(name==='one-dead')assert.equal(failure,'v4.required-actor');
}
checks.push('Only compact exit waits for all four alive grounded classes; three-near/one-air/one-dead rejected');
const compactEnabled=g.HonroStage11Compact?.enabled()===true,revisionBoundary={enabled:compactEnabled};
if(compactEnabled){
 app=h.load(saved);app.continue();assert.deepEqual(plain(app.engine.b),oldBattle,'old412 exact under current413 policy');assert.equal(app.engine.b.honroCampaignMapRevision,412,'do not rewrite old revision stamp');
 app.retry();h.finish(app);assert.equal(app.engine.b.honroCampaignMapRevision,413);assert.equal(app.engine.b.width,6200);assert.equal(app.engine.b.height,3200);assert.equal(app.engine.b.units.length,25);
 const retry={width:app.engine.b.width,height:app.engine.b.height,revision:app.engine.b.honroCampaignMapRevision,units:app.engine.b.units.length};
 app=h.load(h.profileThrough(10));app.launch(11);h.finish(app);assert.equal(app.engine.b.honroCampaignMapRevision,413);assert.equal(app.engine.b.honroStage11CompactRevision,1);
 const cases=[];
 for(const [name,edit,wantPreserve,wantObsolete]of [
  ['old412',()=>{},true,false],['old211',b=>b.honroCampaignMapRevision=211,true,false],['old0',b=>b.honroCampaignMapRevision=0,true,false],['oldUndefined',b=>delete b.honroCampaignMapRevision,true,false],['future999',b=>b.honroCampaignMapRevision=999,false,true],['emptyTerrain',b=>b.terrain=[],false,true],['emptyUnits',b=>b.units=[],false,true],['nullTerrain',b=>b.terrain=[null],false,true],['nullUnits',b=>b.units=[null],false,true],['unknownSize',b=>b.width=15999,false,true],['oldEngine19',b=>b.honroRevision=19,false,true],['Workshop',b=>{b.honroMapOrigin='workshop';b.honroCustom=true;},false,false]]){
  const b=plain(oldBattle);edit(b);const before=JSON.stringify(b),preserve=g.HonroStage11Compact.preserveBattle(b),obsolete=g.HonroCampaignMapRevision.obsolete(b);assert.equal(preserve,wantPreserve,name);assert.equal(obsolete,wantObsolete,name);assert.equal(JSON.stringify(b),before,'predicate must not mutate '+name);cases.push({name,preserve,obsolete});
 }
 Object.assign(revisionBoundary,{old412WholeBattleExact:true,oldStampRetained:412,retry,newEntry:{width:app.engine.b.width,height:app.engine.b.height,revision:app.engine.b.honroCampaignMapRevision,units:app.engine.b.units.length},cases});
 checks.push('Flag1 old412 exact Continue/stamp; explicit Retry and new entry413; unknown/malformed/Workshop predicates');
}else revisionBoundary.future413Compatibility='Not active in flag0; run HONRO_STAGE11_COMPACT=1 separately';
const result={scope:'Production App/Engine/objective models with DOM/storage/renderer doubles. Exact existing412 bytes; controlled initial compact goal fixtures; no normal play or user browser storage changes.',checks,legacyRows,compactCases:caseRows,revisionBoundary,currentMapRevision:g.HonroCampaignMapRevision.current(11),sourceHashes:Object.fromEntries(await Promise.all([...changed,'shared/runtime/stage11-compact.js','shared/runtime/campaign-map-revision.js'].map(async f=>[f,hash(await readFile(f))])))};
const destination=out+'/'+(compactEnabled?'flag1':'flag0');await mkdir(destination,{recursive:true});await writeFile(destination+'/result.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,compactCases:caseRows.map(({initialParty,...row})=>row)},null,2));
