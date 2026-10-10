/** Actual completed-quarry profile -> ordinary rest/journey13 -> repeated App
 * Continue. Uses included verbatim normal-play profiles (or an explicit artifact directory); no synthetic clear or
 * actor/resource edits. DOM/render/storage are harness doubles. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {runtimeParts} from '../shared/build.mjs';
import {beforeStage23EscortFingerprintParts,beforeStage23Escort} from './stage23-escort-history-helpers.mjs';
const root=process.env.HONRO_QUARRY_COMPLETION||null,fixture=JSON.parse(await readFile(new URL('./fixtures/stage12-quarry/completed-run.json',import.meta.url),'utf8'));
const out=process.env.HONRO_QUARRY_NEXT_OUT||'_local/reports/stage12-quarry/next-stage-app';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const read=async file=>root?JSON.parse(await readFile(root+'/'+file,'utf8')):plain(fixture.files[file]);
const result=await read('result.json'),victory=await read('victory-profile.json'),initial=await read('initial.json');
assert.equal(result.phase,'won');assert.equal(result.round,48);assert.equal(result.initialEnemies,26);assert.equal(result.initialElites,6);assert.equal(result.enemyDefeats,34);assert.equal(result.allFourSurvived,true);assert.equal(result.validationFailure,null);assert.equal(result.liveAudit.externalWrites.length,0);assert.equal(result.liveAudit.recoveries.length,0);
const h=await appHarness(),{g}=h,parts=await runtimeParts({vector:false,render:false});
// Project only the exact reviewed Stage23 delta for historical fingerprints.
// The App below keeps the current runtime/project; no historical source executes.
const runtimeSha256=hash(parts.join('\n')),projectSha256=hash(g.HONRO_PROJECT),stage23ProjectedRuntimeSha256=hash(beforeStage23EscortFingerprintParts(parts).join('\n')),stage23ProjectedProjectSha256=hash(beforeStage23Escort(g.HONRO_PROJECT));
assert.equal(stage23ProjectedRuntimeSha256,result.runtimeSha256,'Completed gameplay fingerprint after exact reviewed Stage23 projection');assert.equal(stage23ProjectedProjectSha256,result.sourceHash,'Completed campaign fingerprint after exact reviewed Stage23 projection');
assert.equal(hash(parts.join('\n')),runtimeSha256,'Fingerprint projection leaves current runtime parts unchanged');assert.equal(hash(g.HONRO_PROJECT),projectSha256,'App retains the current authored campaign after fingerprint projection');
const source13=JSON.parse(await readFile('tests/fixtures/stage12-quarry/history-before.json','utf8')).stages.find(s=>s.id==='stage-13');assert.equal(hash(g.HONRO_PROJECT.stages[12]),source13.sha256,'Stage13 complete map remains exact incoming master');
let now=50000;g.performance={now:()=>now};const rows=[];
for(const file of ['open-continue.json','hold-entry-round-checkpoint.json','late-continue.json']){
 const data=await read(file);let profile=data.profile;assert.equal(profile.honroBattle.honroStage,12);
 for(let n=0;n<3;n++){const before=plain(profile.honroBattle),app=h.load(profile);app.continue();assert.deepEqual(plain(app.engine.b),before,'Whole actual saved battle exact '+file+' #'+n);app.export();profile=await h.exported();assert.deepEqual(profile.honroBattle,before,'Whole re-export exact '+file+' #'+n);}
 rows.push({file,round:data.profile.honroBattle.round,continues:3,snapshotSha256:hash(profile.honroBattle)});
}
let app=h.load(victory.profile);assert.equal(app.profile.cleared[12].visits,1);assert.equal(app.profile.cleared[12].rounds,48);assert.equal(app.profile.honroBattle,null);assert(!app.profile.cleared[13]);
const earned=plain(app.profile.heroes),loadouts=plain(app.profile.loadouts),clear=plain(app.profile.cleared),next=g.HonroJourneyContent.next(app.profile);assert.equal(next.stageId,13);
app.continue();assert.equal(app.screen,'rest');h.finish(app);assert.deepEqual(plain(app.profile.heroes),earned,'Loading a finished profile does not award again');
h.click('journey-enter',{id:'13'});assert.equal(app.engine.b.honroStage,13);assert.equal(app.stage.id,13);assert.equal(g.HonroStage12Quarry.active(app.engine.b),false);assert(!app.engine.b.honroQuarryRevision);assert(!app.engine.b.honroState?.quarry);assert.equal(app.engine.heroesAlive().length,4);h.finish(app);now+=1000;assert(app.canInput(),'Ordinary Stage13 entry finishes into actionable battle');
assert.deepEqual(plain(app.profile.cleared),clear,'Entering13 keeps exactly one12 clear');assert.deepEqual(plain(app.profile.heroes),earned,'Chapter transition does not duplicate XP or reset build');assert.deepEqual(plain(app.profile.loadouts),loadouts,'All four legal slots persist');
const entry13=plain(app.engine.b),hero13=entry13.units.filter(u=>u.side===0).map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,focus:u.focus,maxFocus:u.maxFocus,loadout:u.loadout}));assert(hero13.every(u=>u.hp===u.maxHp&&u.focus===u.maxFocus),'Normal next-chapter creation uses its existing full-entry resources');
for(let n=0;n<3;n++){app.export();const profile=await h.exported(),before=plain(profile.honroBattle);app=h.load(profile);app.continue();assert.deepEqual(plain(app.engine.b),before,'Whole Stage13 repeated Continue exact #'+n);assert.deepEqual(plain(app.profile.heroes),earned);}
app.export();const finalProfile=await h.exported();await mkdir(out,{recursive:true});await writeFile(out+'/stage13-profile.json',JSON.stringify(finalProfile,null,2)+'\n');
await writeFile(out+'/summary.json',JSON.stringify({passed:true,completionSource:root||fixture.sourceCommit,actualArtifactSha256:fixture.originalArtifacts,completionController:result.controllerSha256,gameplayRuntimeSha256:runtimeSha256,projectSha256,completedGameplayRuntimeSha256:result.runtimeSha256,completedProjectSha256:result.sourceHash,stage23ProjectedRuntimeSha256,stage23ProjectedProjectSha256,source13Sha256:source13.sha256,quarryContinues:rows,stage13Continues:3,clear12:clear[12],heroesBefore12:initial.initial.profile.heroes,earnedAfter12:earned,stage13Heroes:hero13,stage13SnapshotSha256:hash(entry13),scope:'Actual normal-completion victory profile and real mid-combat saves. Historical fingerprints use only the exact reviewed Stage23 projection; current production App/runtime perform every resume and transition. Native production App actions/serialization; DOM/render/storage doubles, not browser or Stage13 combat completion. Ordinary new-chapter full-entry resources are existing production behavior, not in-battle healing.'},null,2)+'\n');
console.log('PASS actual quarry open/hold/late saves9 exact Continues, completed profile rest/journey13, builds/XP/clear record and Stage13 Continue3');
