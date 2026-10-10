/** Narrow Stage8 rest regression using an untouched recorded R30 battle.
 * App/Engine/mission are production; DOM/render/storage/clock are doubles.
 * The recorded run used a legal reward-ledger entry, not a Stages1–7 playthrough.
 * Branch/resource probes below are explicitly synthetic, never arrival evidence.
 * Complete original R29/R30 files are pinned gzip fixtures (mtime 0); only
 * their storage encoding changed. HONRO_EMBER_SAVE/HONRO_EMBER_NEAR_SAVE and
 * HONRO_EMBER_CAPTURE may select external preserved packets, plain or gzip.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import path from 'node:path';
import vm from 'node:vm';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {runtimeParts} from '../shared/build.mjs';

const fixtureRoot='tests/fixtures/encounter-density/ember';
// SHA256 values are of the captured original bytes and deterministic stored
// files, not reserialized JSON. Never replace a missing recording with a setup.
const pinned={
 'round-29.json.gz':{stored:'2d7ca85445a7476f29a3768abe5f4a4481c19ccabe07d85d82af4399eb60c0fa',original:'4d4d14b9d4a822cdcc32e87518870122f13d05009f4f189a57e3d650664a8671',originalBytes:2062490},
 'round-30.json.gz':{stored:'b620005af16a3bbd345b6ec0cb163808dd456670812c496bdf0ef9ae4ceb953a',original:'f9022839f7e9a66b742c4dd23e9901dbcbca660d10f03b1469c6c089ba84dd38',originalBytes:2069813},
 'runtime-js/mission.js':{stored:'8ab5d9e2f626191063045e64835cb154350c92152e5b9612059dffd13991ba03'},
 'source-capture.json':{stored:'417c37be67bc979d9d855855c2ea19e1266ee5d7fb275a7f51d1082d00d85f87'}
};
const input=process.env.HONRO_EMBER_SAVE||path.join(fixtureRoot,'round-30.json.gz');
const capture=process.env.HONRO_EMBER_CAPTURE||path.dirname(input);
const sha=value=>createHash('sha256').update(value).digest('hex');
const preservedInputs=[];
async function preservedFile(file){
 const stored=await readFile(file),relative=path.relative(path.resolve(fixtureRoot),path.resolve(file)).split(path.sep).join('/'),pin=pinned[relative];
 if(pin)assert.equal(sha(stored),pin.stored,'Pinned stored fixture bytes: '+file);
 const gzip=stored[0]===0x1f&&stored[1]===0x8b,bytes=gzip?gunzipSync(stored):stored;
 if(pin?.original){assert.equal(sha(bytes),pin.original,'Entire original recording bytes: '+file);assert.equal(bytes.length,pin.originalBytes);assert(gzip);assert.equal(stored.readUInt32LE(4),0,'Fixture gzip mtime is zero');}
 preservedInputs.push({path:file,encoding:gzip?'gzip':'plain',storedBytes:stored.length,storedSha256:sha(stored),originalBytes:bytes.length,originalSha256:sha(bytes),pinned:!!pin,...(gzip?{gzipMtime:stored.readUInt32LE(4)}:{})});
 return bytes;
}
const inputBytes=await preservedFile(input),record=JSON.parse(inputBytes),original=record.profile.honroBattle;
const currentSource=await readFile('shared/runtime/mission.js','utf8');
const oldSource=(await preservedFile(path.join(capture,'runtime-js/mission.js'))).toString('utf8');
const recordedSource=JSON.parse(await preservedFile(path.join(capture,'source-capture.json')));
assert.equal(sha(oldSource),recordedSource.runtimeJS['shared/runtime/mission.js'],'Captured old mission hash is verified');
assert.equal(original.honroStage,8);assert.equal(original.round,30);assert.equal(original.honroEncounterDensityRevision,1);
assert.equal(original.difficulty,'normal');assert.equal(record.profile.settings.debugMode||false,false);
const markerId='marker-4',savedMarker=original.honroMarkers.find(m=>m.id===markerId);
assert(savedMarker?.honroPending&&!savedMarker.collected);assert.equal(savedMarker.x,4700);
assert.equal(savedMarker.y,4794.285714285715);
const h=await appHarness(),{g,C}=h,rows=[];
let clock=record.virtualMs;g.performance={now:()=>clock};
const resources=b=>plain(b.units.filter(u=>u.side===0&&!u.summoned).map(u=>({id:u.id,hp:u.hp,maxHp:u.maxHp,focus:u.focus,maxFocus:u.maxFocus}))); 
function load(profile=record.profile){
 const app=h.load(plain(profile));app.continue();const e=app.engine,b=e.b;
 assert.deepEqual(plain(b),profile.honroBattle,'Continue preserves the entire input battle before ordinary input');
 return{app,e,b,marker:b.honroMarkers.find(m=>m.id===markerId)};
}
function tick(q){clock+=C.STEP*1000;q.e.tick(C.STEP);assert(!q.app.dialogue,'The narrow observation does not bypass a dialogue');q.app.missionTick(C.STEP);}
function rewardExpected(before){return before.map(u=>({...u,hp:Math.min(u.maxHp,u.hp+Math.round(u.maxHp*.30)),focus:Math.min(u.maxFocus,u.focus+Math.round(u.maxFocus*.40))}));}
function source(text){vm.runInContext(text,g);}

// Intercept the production some() callback and stop before collection or later
// mission work. Whole-battle equality proves the source snapshot was read only.
function readBlockers(q){
 const before=plain(q.b),alive=q.e.alive,stop={},result={};
 q.e.alive=function(side){const list=alive.call(this,side);if(side===1)list.some=function(predicate){result.predicate=predicate;result.blockers=plain(list.filter(predicate).map(u=>u.id));throw stop;};return list;};
 try{g.HonroMission.tick(q.app,0);assert.fail('Expected the pending rest threat query');}catch(error){if(error!==stop)throw error;}finally{q.e.alive=alive;}
 assert.deepEqual(plain(q.b),before,'Threat inspection never changes saved actors, resources, markers or mission');return result;
}

source(oldSource);
const oldQuery=readBlockers(load());assert.deepEqual(oldQuery.blockers,['s8-18','s8-19']);
source(currentSource);
const currentQuery=readBlockers(load());assert.deepEqual(currentQuery.blockers,[]);
const distant=original.units.filter(u=>oldQuery.blockers.includes(u.id)).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,fixed:u.fixed,verticalDistance:Math.abs(u.y-savedMarker.y)}));
assert(distant.every(u=>u.verticalDistance>2170));
rows.push({case:'read-only original R30 threat query',oldBlockers:oldQuery.blockers,currentBlockers:currentQuery.blockers,distant,modifications:[]});

// Paired production replay. Only mission.js changes between the two arms; this
// is a surgical historical-rule control, not a replay of the whole old bundle.
for(const revision of ['captured-old-rule','current']){
 source(revision==='current'?currentSource:oldSource);const q=load(),notices=[],originalEvent=q.app.event.bind(q.app);
 q.app.event=text=>{notices.push(text);return originalEvent(text);};
 assert(q.app.canInput());const before=resources(q.b),active=q.e.active.id;
 q.app.defend();assert.equal(q.b.phase,'review','Ordinary App defend starts its production action review');
 const afterDefend=resources(q.b);q.e.tick(C.STEP);
 assert.deepEqual(resources(q.b),afterDefend,'One native engine tick adds no unrelated HP/focus change');
 q.app.missionTick(C.STEP);const afterRest=resources(q.b);
 assert.equal(!!q.marker.collected,revision==='current');
 assert.deepEqual(afterRest,revision==='current'?rewardExpected(afterDefend):afterDefend);
 for(let i=0;i<12;i++)tick(q);
 assert.deepEqual(resources(q.b),afterRest,'The rest cannot be collected again on later ticks');
 assert.equal(notices.filter(t=>t==='불씨를 지켰다. 동행이 숨을 고른다.').length,revision==='current'?1:0);
 assert.deepEqual(plain(q.b.items),original.items,'No consumable is added or spent');
 rows.push({case:'untouched R30 App Continue / defend / engine and mission ticks',revision,modifications:[],active,before,afterDefend,afterRest,collected:!!q.marker.collected,notices});
 if(revision==='current'){
  q.app.export();const saved=await h.exported(),continued=load(saved);assert(continued.marker.collected);tick(continued);
  assert.deepEqual(resources(continued.b),afterRest,'Continue retains collection without a second reward');
  rows.push({case:'collected rest Continue',exactWholeBattle:true,repeatedReward:false});
 }
}
source(currentSource);

// Explicit synthetic metadata/coordinate arguments to the exact production
// callback above. The original battle and actual R30 replay remain untouched.
const predicate=vm.runInContext(`(function(b,m,v,G){return (${currentQuery.predicate.toString()})(v);})`,g);
const reference=original.units.find(u=>u.id==='s8-18'),probeRows=[];
function probe(name,b,v,expected){const before=JSON.stringify([b,v]),actual=predicate(b,savedMarker,v,g);assert.equal(actual,expected,name);assert.equal(JSON.stringify([b,v]),before);probeRows.push({name,stage:b.honroStage,revision:b.honroEncounterDensityRevision??null,custom:!!b.honroCustom,x:v.x,y:v.y,fixed:!!v.fixed,blocks:actual});}
for(const dy of [-649,0,649])probe('nearby non-fixed threat remains blocking',original,{...reference,x:savedMarker.x,y:savedMarker.y+dy},true);
for(const dy of [-650,650])probe('650 vertical boundary excludes another layer',original,{...reference,x:savedMarker.x,y:savedMarker.y+dy},false);
probe('nearby fixed enemy retains its existing exemption',original,{...reference,x:savedMarker.x,y:savedMarker.y,fixed:true},false);
probe('469 horizontal distance still blocks',original,{...reference,x:savedMarker.x+469,y:savedMarker.y},true);
probe('470 horizontal boundary remains excluded',original,{...reference,x:savedMarker.x+470,y:savedMarker.y},false);
for(const revision of [undefined,0,2,'1'])probe('old/non-matching save does not opt in',{...original,honroEncounterDensityRevision:revision},reference,true);
probe('custom map does not opt in',{...original,honroCustom:true},reference,true);
for(let stage=1;stage<=30;stage++)if(stage!==8)probe('other chapter retains the original horizontal-only predicate',{...original,honroStage:stage},reference,true);
rows.push({case:'synthetic predicate branch fixtures',scope:'Production callback with explicit coordinate/metadata arguments; not live placement or normal play.',probes:probeRows});

// Untouched R29 still has a real lower-court scatter guard 544px above
// the lower marker. This is separate original evidence, not a moved enemy.
const nearInput=process.env.HONRO_EMBER_NEAR_SAVE||path.join(capture,input.endsWith('.gz')?'round-29.json.gz':'round-29.json');
const nearBytes=await preservedFile(nearInput),nearRecord=JSON.parse(nearBytes),near=load(nearRecord.profile);
assert.equal(near.b.round,29);assert(near.marker.honroPending&&!near.marker.collected);
const nearQuery=readBlockers(near);assert.deepEqual(nearQuery.blockers,['s8-12']);
const nearGuard=near.e.unit('s8-12');assert.equal(nearGuard.y,4250);assert.equal(nearGuard.hp,63);assert.equal(nearGuard.fixed,false);
const nearBefore=resources(near.b);near.app.missionTick(C.STEP);assert(!near.marker.collected);assert.deepEqual(resources(near.b),nearBefore);
rows.push({case:'untouched R29 near-layer scatter guard',input:nearInput,inputSha256:sha(nearBytes),modifications:[],guard:plain({id:nearGuard.id,x:nearGuard.x,y:nearGuard.y,hp:nearGuard.hp,verticalDistance:Math.abs(nearGuard.y-near.marker.y)}),blockers:nearQuery.blockers,collected:false});

// Explicit unvisited-marker state probe. None of the unmodified R30 hero
// positions is within the lower marker's ordinary 180px discovery radius.
const unvisitedProfile=plain(record.profile);delete unvisitedProfile.honroBattle.honroMarkers.find(m=>m.id===markerId).honroPending;
const unvisited=load(unvisitedProfile),unvisitedBefore=resources(unvisited.b);
assert(unvisited.e.heroesAlive().every(u=>Math.hypot(u.x-unvisited.marker.x,u.y-unvisited.marker.y)>=180));
unvisited.app.missionTick(C.STEP);assert(!unvisited.marker.honroPending&&!unvisited.marker.collected);assert.deepEqual(resources(unvisited.b),unvisitedBefore);
rows.push({case:'synthetic unvisited-marker gate',modifications:['Removed only marker-4 honroPending before mount.'],collected:false,pending:false});

// Actual old-save metadata compatibility through App/mission, with positions,
// HP, threats and pending state still byte-for-byte the R30 values.
const legacyProfile=plain(record.profile);delete legacyProfile.honroBattle.honroEncounterDensityRevision;
const legacy=load(legacyProfile);const legacyBefore=resources(legacy.b);legacy.app.missionTick(C.STEP);
assert(!legacy.marker.collected);assert.deepEqual(resources(legacy.b),legacyBefore);
assert(!('honroEncounterDensityRevision' in legacy.b),'Continue never opts an older battle in');
rows.push({case:'synthetic old-save metadata compatibility',modifications:['Removed only honroEncounterDensityRevision before loading.'],collected:false});

// R30 damage is less than the reward, so its real replay naturally caps at max.
// A separate low-resource fixture makes the exact unchanged percentages visible.
const lowProfile=plain(record.profile);for(const u of lowProfile.honroBattle.units)if(u.side===0&&!u.summoned){u.hp=1;u.focus=0;}
const low=load(lowProfile),lowBefore=resources(low.b);low.app.missionTick(C.STEP);
assert(low.marker.collected);assert.deepEqual(resources(low.b),rewardExpected(lowBefore));
rows.push({case:'synthetic uncapped reward arithmetic',modifications:['Set the three heroes to HP1/focus0 before mount; no actor position or threat changes.'],before:lowBefore,after:resources(low.b),hpFraction:.30,focusFraction:.40,scope:'Arithmetic fixture, never normal resource evidence.'});

// A fresh real Stage11 battle still dispatches to its own Act2 mission. Compare
// the production top-level route to a direct call on the same saved battle.
const app11=h.load(h.profileThrough(10));app11.launch(11);h.finish(app11);
const profile11=plain(app11.profile);profile11.honroBattle=plain(app11.engine.b);
const routes=[];
for(const direct of [false,true]){const q=load(profile11);assert(g.HonroAct2.active(q.b));const before=resources(q.b);(direct?g.HonroAct2:g.HonroMission).tick(q.app,0);routes.push(plain(q.b));assert.deepEqual(resources(q.b),before,'Stage11 route does not inherit Stage8 recovery');}
assert.deepEqual(routes[0],routes[1],'Stage11 top-level mission dispatch remains exactly Act2');
rows.push({case:'fresh Stage11 App mount dispatch',sameAsDirectAct2:true,heroResourcesUnchanged:true,scope:'Initial mission tick only; not a Stage11 playthrough.'});

const output=process.env.HONRO_EMBER_REPORT||'_local/reports/encounter-density/stage8-ember-recovery.json';
const report={observedAt:new Date().toISOString(),status:'passed',originalPacketPreservation:'The full original R29 and R30 files are preserved byte-for-byte after gzip decoding. Profiles, battles, traces and all other original fields were neither edited nor truncated. Only storage encoding changed.',preservedInputs,input,inputSha256:sha(inputBytes),inputSourceCommit:record.provenance.sourceCommit,inputRuntimeSha256:record.runtimeSha256,currentRuntimeSha256:sha((await runtimeParts({vector:false,render:false})).join('\n')),oldMissionSha256:sha(oldSource),currentMissionSha256:sha(currentSource),testSha256:sha(await readFile(new URL(import.meta.url))),rows,limits:['Node App/Engine/mission with DOM/render/storage/clock doubles; no browser evidence.','Unchanged recorded R30 continuation proves recovery at that saved position; it does not replay the route to the marker or prove chapter completion.','The recorded run started from a legal reward-ledger profile, not a continuous Stages1–7 campaign.','Old-rule control swaps only the verified captured mission source; other current runtime modules remain current.','Metadata, coordinate and HP1/focus0 fixtures are isolated branch/arithmetic tests and are not normal-play evidence.']};
await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log('PASS Stage8 ember: exact R30 Continue/defend/ticks, old-rule reproduction, one-shot 30%HP/40%focus, near/fixed/layer/legacy gates and unchanged Stage11 dispatch');
console.log(JSON.stringify({output,inputSha256:report.inputSha256,currentMissionSha256:report.currentMissionSha256,testSha256:report.testSha256,checks:rows.length,predicateProbes:probeRows.length}));
