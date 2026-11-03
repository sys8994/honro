/** Actual production Engine/App setup and planning regressions; no full gameplay run. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from '../../tests/app-regression-helpers.mjs';
import {currentBierEntryProfile} from '../../tests/stage8-current-entry-helper.mjs';
import {focusedProfile} from './focused-profile.mjs';
import {enableExpeditionBaseline,detachedPrediction} from './baseline-condition.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const registration=JSON.parse(await readFile('tools/act1-qa/expedition-baseline-registration.json'));
const out='_local/reports/act1-expedition-baseline-20261103/instrumentation-preflight';await mkdir(out,{recursive:true});
process.env.HONRO_QA_BASELINE='story';
const rows=[],paths={2:'stage02-positioning',3:'stage03-positioning',4:'stage04-positioning',6:'stage06-bridge',7:'stage07-roots'};
for(const row of registration.cases){
 const {stage,seed}=row,policy=row.policy||row.label,h=await appHarness({productionStory:true,productionInputActions:true}),{g,C}=h;
 if(seed!==null)vm.runInContext(`{let state=${seed}>>>0;Math.random=()=>{state+=0x6D2B79F5;let t=state;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}`,g);
 let profile;
 if(stage===1)profile=plain(g.AppRegression.fresh());
 else if(stage===8)profile={...plain(g.AppRegression.fresh()),...plain(currentBierEntryProfile(g,{basicOnly:false}).profile)};
 else {const f=JSON.parse(await readFile(stage===5||stage===10?`tools/act1-qa/fixtures/stage${stage}-entry.json`:`game/docs/stage-review/${paths[stage]}/evidence/entry-profile.json`));profile=f.profile||f;}
 if(policy.includes('focused'))focusedProfile(g,profile);
 if(paths[stage]||stage===1)profile.settings.debugMode=false;
 const baseline=enableExpeditionBaseline(h,{out:`${out}/stage${stage}`,stage,seed,policy}),app=h.load(profile);app.launch(stage);
 const e=app.engine,b=e.b,methods=['predict','shotSeeds','bestShot','searchShot'],identities=methods.map(k=>e[k]);
 for(const k of methods)assert.equal(e[k],C.Engine.prototype[k],`Stage${stage} production ${k} identity`);
 const before=JSON.stringify(b),beforeProfile=JSON.stringify(app.profile),rng=b.rng,stats={calls:0},checks=[];
 // Actual allied NPC bestShot -> searchShot path (the previously recursive path),
 // and Stage8 explicit player bestShot. Never replace live production methods.
 if(stage===2||stage===8){
  const actor=stage===2?b.units.find(u=>u.side!==1&&/damheo/i.test(u.id)):e.heroesAlive()[0];
  assert(actor,`Stage${stage} actual planning actor`);
  const target=e.alive(1)[0],skill=C.SKILLS[actor.loadout[0]];assert(skill&&target);
  const seeds=detachedPrediction(C,e,'shotSeeds',[actor,skill,target],app.profile,stats);assert(seeds.length);
  detachedPrediction(C,e,'predict',[actor,skill,seeds[0].angle,seeds[0].power,target,false],app.profile,stats);
  const aim=detachedPrediction(C,e,'bestShot',[actor,skill,target],app.profile,stats);assert(Number.isFinite(aim.angle)&&Number.isFinite(aim.power));
  detachedPrediction(C,e,'core:shotViable',[actor,skill,target,aim.angle,aim.power],app.profile,stats);
  checks.push({actor:actor.id,side:actor.side,skill:skill.id,aim,detachedCalls:stats.calls});
 }
 assert.equal(JSON.stringify(b),before);assert.equal(JSON.stringify(app.profile),beforeProfile);assert.equal(b.rng,rng);
 methods.forEach((k,i)=>assert.equal(e[k],identities[i]));
 const result={stage,entryDifficultyPassed:true,ordinaryEnemies:baseline.battles[0].ordinary.length,statFailures:baseline.battles[0].statFailures,entryBeforeHash:baseline.entries[0].beforeSha256,entryAfterHash:baseline.entries[0].afterSha256,battleHash:hash(b),liveBattleProfileRngUnchanged:true,productionPlanningMethodIdentities:true,checks};rows.push(result);console.log(JSON.stringify(result));
}
await writeFile(`${out}/result.json`,JSON.stringify({scope:'Setup and explicit detached planning only; no gameplay acceptance or restart',rows},null,2));
