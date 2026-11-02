/** Released reviewed-v4 App/Engine; DOM/render/storage/clock doubles.
 * Declared synthetic entry-level party, not earned campaign history. After
 * initialization only production inputs and ticks change gameplay state. */
import assert from 'node:assert/strict';
import {createPlayerOperations} from '../tools/act2-qa/player-operations.mjs';
import {detachedPlanner} from '../tools/act2-qa/pure-planning.mjs';
import {productionAimPreview} from '../tools/act2-qa/production-aim-preview.mjs';
import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {representativeMelee} from './stage18-bell-fullplay-helper.mjs';
import {navigator} from './act2-complex-app-navigation.mjs';
import {auditQuarryEngine} from './stage12-quarry-fullplay-helper.mjs';
const id=Number(process.argv[2]||11),policy=process.argv[3]||'objective',seed=Number(process.argv[4]||101),out=process.env.HONRO_QA_OUT||`_local/reports/act2-gameplay-20261103/${id}-${policy}-${seed}`;
assert([18,20].includes(id));assert(['objective','survival','height','retreat'].includes(policy));
const h=await appHarness({productionStory:true,productionInputActions:true}),{g,C}=h;
// productionInputActions harness installs interactions exactly once.
const hash=v=>createHash('sha256').update(Buffer.isBuffer(v)?v:typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const entryPath=process.env.HONRO_QA_ENTRY_PROFILE,entryRaw=entryPath?await readFile(entryPath,'utf8'):null,entryDoc=entryRaw?JSON.parse(entryRaw):null,profile=entryDoc?plain(entryDoc.profile||entryDoc):h.profileThrough(id-1),entryLevel=g.HonroProgression.plan(id).entryLevel;
profile.settings.difficulty='normal';profile.settings.debugMode=false;
const slots={archer:policy==='height'?['A01','A14','A11','A05']:policy==='retreat'?['A01','A02','A09','A05','AP03']:['A01','A02','A09','A05'],mage:policy==='survival'?['M01','M10','M03','M11']:['M01','M04','M03','M11'],knight:['S00','S03','S05','S09'],occultist:['O01','O02','O08','O11']};
const training=[];
for(const cls of profile.recruited){const hero=profile.heroes[cls];if(!entryDoc){hero.xp=g.HonroProgression.rewardXpAt(entryLevel);C.resetTalents(hero,cls);}const buy=key=>{if(hero.ranks[key])return true;const talent=C.TALENT_MAP[key];if(!talent)return false;if(talent.prereq&&!buy(talent.prereq))return false;if(C.trainReason(hero,key))return false;assert(C.train(hero,key));training.push({cls,key});return true;};for(const key of slots[cls])buy(key);profile.loadouts[cls]=slots[cls].filter(k=>hero.ranks[k]);C.sanitizeLoadout(profile,cls);for(let n=0;n<4;n++)if(C.investStat(hero,cls))training.push({cls,stat:true});while(C.pointsLeft(hero,cls)>0){const choices=profile.loadouts[cls].filter(k=>!C.trainReason(hero,k)).sort((a,z)=>(hero.ranks[a]||0)-(hero.ranks[z]||0));if(!choices.length){if(!C.investStat(hero,cls))break;}else assert(C.train(hero,choices[0]));}assert(C.pointsSpent(hero,cls)<=C.pointsEarned(hero));}
const resumePath=process.env.HONRO_QA_RESUME,resume=resumePath?JSON.parse(await readFile(resumePath,'utf8')):null,launchProfile=resume?.profile||profile;
// Deterministic clock origin is installed before App construction/launch.
g.performance={now:()=>0};
const app=h.load(launchProfile);if(resume)app.continue();else app.launch(id);assert(app.engine,'App launch');const e=app.engine,b=e.b,canonical=g.HONRO_PROJECT.stages[id-1];
// Shipping Engine RNG is never reassigned. CLI seed varies only requested input aim.
let inputRng=seed>>>0;const inputRandom=()=>{inputRng^=inputRng<<13;inputRng^=inputRng>>>17;inputRng^=inputRng<<5;return(inputRng>>>0)/4294967296;};
const inputAimError=()=> (inputRandom()-.5)*.3;
if(!resume){assert.equal(b.round,1);assert.equal(b.seed,b.stageId*19381+7,'Canonical shipping Engine seed must remain unchanged');}assert.equal(b.honroStage,id);assert.equal(b.difficulty,'normal');assert(g.HonroAct23V4.active(b));
const actualEntry=resume?.provenance.actualEntry||e.heroesAlive().map(u=>({cls:u.cls,level:u.level,xp:u.xp,hp:u.hp,maxHp:u.maxHp,loadout:[...u.loadout],equipmentIds:[...(u.equipmentIds||[])],ranks:plain(u.ranks)}));
const provenance={actualEntry,...(entryDoc?{entryArtifact:{path:entryPath,sha256:hash(entryRaw),scope:"Loaded unchanged earned/declared profile; XP, previous equipment and ranks preserved; only affordable production training/loadout/stat choices"}}:{}),...(resume?{continuationOf:{path:resumePath,sha256:hash(await readFile(resumePath,'utf8')),round:b.round,seed:b.seed,originalProvenance:resume.provenance},entrySnapshotIsContinuation:true}:{}),checkoutCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),runnerSha256:hash(await readFile(new URL(import.meta.url),'utf8')),projectSha256:hash(g.HONRO_PROJECT),stageSha256:hash(canonical),geometrySha256:hash({terrains:canonical.terrains,routes:canonical.routes,units:canonical.units,initialState:canonical.initialState}),entryProfileSha256:hash(launchProfile),entryLevel,policy,seed,seedPurpose:'controller-input-variation-only',engineRngAtEntry:{seed:b.seed,rng:b.rng,engineStageId:b.stageId,chapterId:id,canonicalSeed:b.stageId*19381+7,inheritedContinuation:!!resume},inputVariation:{seed,aimErrorDegrees:[-.15,.15],powerError:0},legacyItemApi:'disabled; no Engine.item calls',operationMode:'NATIVE_APP_ACTION_SIMULATION',clockOriginMs:0,navigationSha256:hash(await readFile('tests/act2-complex-app-navigation.mjs')),runtimeTrees:Object.fromEntries(['shared','game/src'].map(path=>[path,execFileSync('git',['rev-parse','HEAD:'+path],{encoding:'utf8'}).trim()])),harnessSha256:hash(await readFile('tests/app-regression-helpers.mjs')),adapterSha256:hash(await readFile('tools/act2-qa/player-operations.mjs')),plannerSha256:hash(await readFile('tools/act2-qa/pure-planning.mjs')),previewSha256:hash(await readFile('tools/act2-qa/production-aim-preview.mjs')),adapterSource:'Act1 b85a1858 selected-preview adapter, parent QA a40a8723 helpers',inputMapping:{defend:'App.defend',select:'App.selectHero',jump:'App.jump',movement:'App stick intent consumed by actual App.frame,120Hz',drop:'ordinary walk-off fall, NOT Alt platform drop',fire:'Actual App beginCharge/frame elapsed/releaseCharge; idealized legal facing/aim gesture, not browser pointer',interaction:'visible nearest context-button target only',dialogue:'Story.next with production guard',clock:'Shared adapter actual App.frame with C.STEP elapsed; Next-only narration'},scope:(entryDoc?'Loaded prior observed App-outcome profile (see entryArtifact); preceding chapters are only as established in that artifact. ':'')+(entryDoc?'XP/ranks/equipment inherited without budget replacement. ':'Synthetic legacy-budget rewardXpAt(plan.entryLevel), legal training, production-auto-equipped starter personal equipment. Prior clearance flags only unlock requested chapter; no claim earlier chapters were played. ')+'Production reviewed-v4 App frame/actions, selected production predictionGuide on native canvas, DOM/storage/clock doubles and idealized aim; not full-scene rendering or browser input.'};
await mkdir(out,{recursive:true});await writeFile(out+'/initial.json',JSON.stringify({provenance,profile:launchProfile,training:resume?[]:training,battle:plain(b)},null,2));
const actions=[],rounds=[],damage=[],births=[],notices=[];let frames=0,lastRound=0,stopReason=null,nav,navKey;
const record=r=>actions.push({round:b.round,frame:ops.frames,goal:g.HonroAct2.current(b)?.id,...plain(r)}),ready=()=>app.canInput(),dist=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y),hpFraction=u=>u.hp/u.maxHp;
const preview=productionAimPreview({app,g,C,record:r=>record(r)});
const ops=createPlayerOperations({app,g,C,record:r=>record(r),render:preview.render});
const audit=auditQuarryEngine(b,e,()=>({round:b.round,frame:ops.frames}));const known=new Set(b.units.map(u=>u.id));const extractionSpiritIds=new Set(g.HonroAct2.steps(b).map(s=>s.spiritId).filter(Boolean));
const hurt=e.hurt.bind(e);e.hurt=function(...args){const before=new Map(b.units.map(u=>[u.id,{hp:u.hp,shield:u.shield||0,side:u.side}]));const result=hurt(...args);for(const u of b.units){const old=before.get(u.id);if(old&&(old.hp>u.hp||old.shield>(u.shield||0)))damage.push({round:b.round,frame:ops.frames,target:u.id,side:old.side,hpDamage:Math.max(0,old.hp-u.hp),dead:u.dead,source:args[2]??null,skill:args[4]?.skill??args[7]??null,shot:args[4]?.shot??b.shot,maxHp:u.maxHp,shieldLoss:Math.max(0,old.shield-(u.shield||0))});}return result;};
const event=app.event.bind(app);app.event=(text,...args)=>{notices.push({round:b.round,frame:ops.frames,text});return event(text,...args);};
const tick=()=>{audit.production(()=>ops.frame());audit.guard();frames=ops.frames;for(const u of b.units)if(!known.has(u.id)){known.add(u.id);births.push({round:b.round,frame:ops.frames,id:u.id,side:u.side,cls:u.cls,source:u.honroSpawnSource,x:u.x,y:u.y});}};
function navigation(){const key=id===12?g.HonroStage12Quarry.memory(b).gate:id===18?g.HonroStage18Bell.memory(b).status:'default';if(nav&&key===navKey)return;navKey=key;let routes=id===12?canonical.design.quarry.routes.filter(r=>r.quarryState!=='open'||key==='open'):canonical.design.space.routes;// Route source IDs can be authored aliases; resolve against actual compiled support.
 const resolve=s=>b.terrain.find(t=>t.id===s||t.honroSpaceSurfaceId===s)?.id||s;
 routes=plain(routes).map(r=>({...r,anchors:r.anchors.map(p=>({...p,surfaceId:resolve(p.surfaceId),...(p.jumpTo?{jumpTo:{...p.jumpTo,support:resolve(p.jumpTo.support)}}:{}),...(p.dropTo?{dropTo:{...p.dropTo,support:resolve(p.dropTo.support)}}:{})}))}));
 // New reviewed-v4 shot rock is not in legacy authored routes. Real contact
 // poses propose navigation inputs; they never move actors or assert reachability.
 for(const t of b.terrain.filter(t=>t.honroV4FiringRock||t.honroWorkAccess)){const anchors=[];for(let x=t.x+8;x<t.x+t.w-8;x+=24){const y=C.topAt(t,x);if(C.validTerrainContactPose(b.terrain,{...e.active,x,y}))anchors.push({x,y,surfaceId:t.id});}if(anchors.length)routes.push({id:'compiled-contact-'+t.id,anchors});}
 if(id===15){const t=b.terrain.find(t=>t.id==='fc15-east-arch');routes.push({id:'east-arch-final-ascent-input',anchors:[7150,7250,7350].map((x,i,all)=>({x,y:C.topAt(t,x),surfaceId:t.id,...(i<all.length-1?{jumpTo:{x:all[i+1],support:t.id,speed:.65}}:{})}))});}
 if(id===13){const t=b.terrain.find(t=>t.id==='act2-floor');routes.push({id:'inside-latch-crown-input',anchors:[{x:4430,y:3655,surfaceId:'v4.13.latch-step.2',jumpTo:{x:4550,support:t.id,speed:.65}},{x:4550,y:C.topAt(t,4550),surfaceId:t.id}]});}
 if(id===11){const rock='v4.11.firing-rock',base=b.terrain.find(t=>t.id==='rv-west-shoulder');routes.push({id:'reviewed-rock-step-inputs',anchors:[{x:820,y:6400,surfaceId:rock,jumpTo:{x:940,support:rock,speed:.65}},{x:940,y:6300,surfaceId:rock,jumpTo:{x:1060,support:rock,speed:.65}},{x:1060,y:6200,surfaceId:rock,jumpTo:{x:1180,support:rock,speed:.65}},{x:1180,y:6100,surfaceId:rock,dropTo:{x:1320,support:base.id,stepOffX:1290,speed:.65}},{x:1320,y:C.topAt(base,1320),surfaceId:base.id}]});}
 nav=navigator(g,b,e,{tick,ready,record,stageId:id,routes,jumpInput:u=>audit.production(()=>ops.jump(u)),moveInput:(axis,dt)=>ops.move(axis,dt)});}
async function save(label){app.export();const p=await h.exported();await writeFile(out+'/'+label+'.json',JSON.stringify({provenance,profile:p,b:plain(b),actions,rounds,damage,births,notices,frames,audit:{externalWrites:audit.log.externalWrites,recoveries:audit.log.recoveries}}));}
// Normalize mathematically equivalent angles only; reject inaccessible UI angles.
function playerFire(skill,angle,power){const normalized=((angle+85)%360+360)%360-85;if(normalized>265){record({op:'rejected-unreachable-aim',skill,angle,normalized});return false;}return audit.production(()=>ops.fire(skill,normalized,power));}
function cloneFor(u,target){const planner=detachedPlanner(C,b),sim=planner.engine,actor=planner.unit(u.id),victim=planner.unit(target.id);assert(actor&&victim,'Clone-local planner actors');return {planner,sim,actor,victim};}
function fireAt(u,target){const spirit=target.honroSpirit&&!target.manifested;let skills=u.loadout.map(k=>C.SKILLS[k]).filter(s=>s&&s.damage>0&&!s.passive&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus);skills.sort((a,z)=>(spirit?Number(z.id==='O08')-Number(a.id==='O08'):0)||z.damage-a.damage);
 for(const skill of skills.slice(0,3)){const {planner,sim,actor,victim}=cloneFor(u,target);let best=null;if(skill.martial&&skill.branch==='sword')best=representativeMelee(g,sim,actor,victim,skill.id);else{for(const aim of sim.shotSeeds(actor,skill,victim)){const v=C.shotViable(sim,actor,skill,victim,aim.angle,aim.power);if((v.ok||target.hp<=2&&v.enemyDamage>0)&&v.risk<1&&v.miss<Math.max(85,skill.radius+target.r+55)&&(!best||v.net>best.net))best={...aim,net:v.net};}if(!best&&skill===skills[0]){const direct=Math.atan2(u.y-u.h*.6-(target.y-target.h*.5),target.x-u.x)*180/Math.PI;const angles=[direct,...(target.x>=u.x?[25,45,65,80]:[100,115,135,155])];for(const angle of angles)for(const power of [1,.6]){const v=C.shotViable(sim,actor,skill,victim,angle,power);if((v.ok||target.hp<=2&&v.enemyDamage>0)&&v.risk<1&&v.miss<Math.max(85,skill.radius+target.r+55)&&(!best||v.net>best.net))best={angle,power,net:v.net};}}}
 planner.check();const aimError=best?inputAimError():0,requestedAngle=best?best.angle+aimError:0;if(best&&playerFire(skill.id,requestedAngle,best.power)){record({op:'fire',hero:u.cls,skill:skill.id,target:target.id,angle:requestedAngle,plannedAngle:best.angle,inputAimError:aimError,power:best.power,hpBefore:target.hp,position:{x:u.x,y:u.y}});return true;}}
 return false;
}
function healStake(u){if(u.cls!=='mage'||!u.loadout.includes('M10')||e.cooldownLeft(u,'M10')>0||e.manaCost(C.SKILLS.M10,u)>u.focus)return false;const hurt=e.heroesAlive().filter(v=>hpFraction(v)<.70&&dist(v,u)<1800).sort((a,z)=>hpFraction(a)-hpFraction(z));const target=hurt[0];if(!target||(b.stakes||[]).some(s=>s.skill==='M10'&&s.expires>b.round+1&&dist(s,target)<180))return false;const {planner,sim,actor,victim}=cloneFor(u,target);let best=null;for(const aim of sim.shotSeeds(actor,C.SKILLS.M10,victim)){const hit=sim.predict(actor,C.SKILLS.M10,aim.angle,aim.power),d=dist(hit,target);if(hit.terrain&&Math.abs(hit.y-target.y)<70&&d<100&&(!best||d<best.d))best={...aim,d};}planner.check();const aimError=best?inputAimError():0;if(best&&playerFire('M10',best.angle+aimError,best.power)){record({op:'heal-stake',hero:u.cls,skill:'M10',target:target.id,...best,plannedAngle:best.angle,angle:best.angle+aimError,inputAimError:aimError});return true;}return false;}
function interact(){const m=g.HonroInteractions.nearest(app);if(!m)return false;const step=g.HonroAct2.readySteps(b).find(s=>s.id===m.id);if(!step||step.optional&&policy!=='height')return false;if(g.HonroInteractions.eligibility(app,m).ok&&audit.production(()=>ops.interact(m))){record({op:'E',inputPath:'visible nearest context button (not manualDive-intercepted keyboard)',hero:e.active?.cls,target:m.id});return true;}return false;}

const started=performance.now(),roundLimit=Number(process.env.HONRO_QA_ROUND_LIMIT||45),actionLimit=Number(process.env.HONRO_QA_ACTION_LIMIT||280);
for(let turn=0;turn<actionLimit&&!['won','lost'].includes(b.phase);turn++){
 if(global.gc)global.gc();
 for(let i=0;!ready()&&!['won','lost'].includes(b.phase)&&i<30000;i++)tick();if(['won','lost'].includes(b.phase))break;if(!ready()){stopReason='controller no-input observation limit';break;}
 navigation();
 if(lastRound!==b.round){lastRound=b.round;rounds.push({round:b.round,goal:g.HonroAct2.current(b)?.id,done:plain(g.HonroAct2.memory(b).done),heroes:e.heroesAlive().map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,focus:u.focus,x:u.x,y:u.y,support:nav.surface(u)})),enemies:e.alive(1).length,projectiles:b.projectiles.length});console.log('ROUND',id,policy,seed,JSON.stringify(rounds.at(-1)));await save('checkpoint');if(b.round>roundLimit){stopReason='diagnostic round bound; unfinished, not game loss';break;}}
 // Timed in-world story and NPC tasks advance under actual mission ticks.
 const prior=g.HonroAct2.current(b)?.id;for(let n=0;n<(id===20&&['escort-mid','hold-convoy','escape'].includes(prior)?600:90)&&ready()&&g.HonroAct2.current(b)?.id===prior;n++)tick();if(!ready())continue;
 let goal=g.HonroAct2.current(b);if(!goal){for(let n=0;n<180&&ready();n++)tick();goal=g.HonroAct2.current(b);}
 // Witness completion is not the final visual observation: move the living
 // authored soul observer to the bell source before heading to the work exit.
 const witnessObserver=id===16&&g.HonroAct23V4Reviewed16.heard(b)&&!g.HonroAct23V4Reviewed16.memory(b).trappedObserved?(e.heroesAlive().find(v=>v.cls==='mage')||e.heroesAlive().find(v=>v.cls==='occultist')):null;
 if(witnessObserver&&!witnessObserver.acted)ops.select(witnessObserver.id);
 const rescueQuestioner=id===14&&goal?.id==='14.extract'&&g.HonroAct23V4ReviewedChapters.apiFor(14).memory(b).events.separate?.status!=='done'?e.heroesAlive().find(v=>v.cls==='mage'&&!v.acted):null;
 const specialist=rescueQuestioner||(goal?.requiredClass&&e.heroesAlive().find(u=>u.cls===goal.requiredClass&&!u.acted));if(specialist)ops.select(specialist.id);
 const eastLock=id===18?b.honroMarkers.find(m=>m.id==='18.lock-east'):null,eastKnight=id===18?e.heroesAlive().find(v=>v.cls==='knight'):null;
 const eastReady=!!(eastKnight&&eastLock&&dist(eastKnight,eastLock)<190);
 const blocker=id===18&&goal?.id==='18.settle'?g.HonroAct23V4Stage18.memory(b).bell.blockers?.find(q=>q.kind==='hero'&&!e.unit(q.id)?.acted):null;
 if(blocker)ops.select(blocker.id);else if(id===18&&goal?.id==='18.support'&&!eastReady&&eastKnight&&!eastKnight.acted)ops.select(eastKnight.id);
 const u=e.active;if(!u||u.side!==0||u.dead){stopReason='no usable hero';break;}
 if(blocker&&u.id===blocker.id){nav.advance(u,b.honroMarkers.find(m=>m.id==='18.brake'),false);if(ready()){record({op:'defend-clear-sweep',hero:u.cls,position:{x:u.x,y:u.y}});audit.production(()=>ops.defend());}continue;}
 if(id===18&&goal?.id==='18.support'&&!eastReady){if(u.id===eastKnight?.id)nav.advance(u,eastLock,false);if(ready()){record({op:'defend-position-east',hero:u.cls,position:{x:u.x,y:u.y}});audit.production(()=>ops.defend());}continue;}
 if(id===18&&['18.settle','18.lock-west'].includes(goal?.id)&&u.id===eastKnight?.id&&eastReady){record({op:'defend-hold-east',hero:u.cls,position:{x:u.x,y:u.y}});audit.production(()=>ops.defend());continue;}
 if(interact())continue;
 const marker=b.honroMarkers.find(m=>m.id===goal?.id),spirit=goal?.spiritId&&e.unit(goal.spiritId),weak=spirit&&(spirit.dead||spirit.hp<=spirit.maxHp*.4);
 let destination=marker||g.HonroObjectives.state(b,app.stage).targets[0],targetIds=new Set(goal?.defeatIds||[]);
 if(goal?.kind==='clear'&&!goal.defeatIds)for(const v of e.alive(1))if(goal.cohorts?v.honroCohort===goal.cohorts:marker&&dist(v,marker)<(goal.radius||650))targetIds.add(v.id);
 if(goal?.kind==='v4-extract'&&spirit&&!weak)targetIds.add(spirit.id);
 if(goal?.kind==='v4-defeat'&&goal.target)targetIds.add(goal.target);
 if(id===18&&goal?.id==='18.keeper')targetIds.add('act2-keeper');
 if(id===20&&goal?.id==='clear-pass')for(const key of g.HonroAct23V4.mem(b).convoyAmbush?.ids||[])if(!e.unit(key)?.dead)targetIds.add(key);
 if(id===15&&goal?.id==='15.knocks'){const m=g.HonroAct23V4Reviewed15?.memory?.(b);for(const v of e.alive(1))if(v.honroSpawnSource==='reviewed.15.merge-pair'||marker&&dist(v,marker)<420)targetIds.add(v.id);}
 if(id===11){const q=g.HonroAct23V4Chapter11.memory(b);for(const key of [...q.release.ids,...q.north.ids])if(!e.unit(key)?.dead)targetIds.add(key);}
 if(id===12&&goal?.id==='12.recurrence'){const loop=g.HonroAct23V4Act2Scenes.memory(b).loop;destination=loop?.phase==='out'?b.honroV4Recurrence.checkpoint:b.honroV4Recurrence.landmark;}
 if(goal?.kind==='route'){const done=g.HonroAct2.memory(b).done,valid=(b.honroRouteSpec?.routes||[]).filter(r=>(r.requiresDone||[]).every(k=>done[k])&&(r.requiresTerrainActive||[]).every(k=>b.terrain.some(t=>t.id===k&&!t.broken)));const chosen=valid.find(r=>r.markerId===(policy==='height'?'route-upper-exit':'route-lower-exit'))||valid[0];destination=b.honroMarkers.find(m=>m.id===chosen?.markerId)||destination;}
 if(goal?.target&&['v4-extract','v4-rescue'].includes(goal.kind)&&(!spirit||weak))destination=e.unit(goal.target)||destination;
 if(id===13&&goal?.id==='gate'&&u.x<4518){const step=b.terrain.find(t=>t.id==='v4.13.latch-step.'+(u.y>3990?0:u.y>3845?1:2));if(u.y>3705)destination={id:'gate-work-shelf-'+step.id,x:step.x+step.w/2,y:step.y};else destination={id:'inside-gate',x:4545,y:4090};}
 if(id===16&&goal?.id==='16.safe'){const t=b.terrain.find(t=>t.id==='tm-shelter-veranda');destination={id:'leave-npc-recovery-lane',x:2500,y:C.topAt(t,2500)};for(const v of e.alive(1))if(dist(v,b.honroV4Recovery.elder)<650)targetIds.add(v.id);}
 if(id===17&&goal?.id==='17.defense'){const d=g.HonroAct23V4Act2.memory(b).defense;for(const keys of Object.values(d?.sources||{}))for(const key of keys)targetIds.add(key);for(const entry of b.honroV4DefenseEntries||[])for(const v of e.alive(1))if(dist(v,entry)<350)targetIds.add(v.id);}
 if(id===17&&goal?.id==='17.brace'){const z=b.honroV4Worksite.braceHazard;for(const v of e.alive(1))if(v.x+v.r>z.x&&v.x-v.r<z.x+z.w&&v.y>z.y&&v.y-v.h<z.y+z.h)targetIds.add(v.id);}

 if(id===18&&['18.descent','18.rescue'].includes(goal?.id)){
  if(goal.id==='18.descent')destination=b.honroMarkers.find(m=>m.id==='18.brake');
  if(u.x>9300&&u.x<9650&&u.y>6500){const t=b.terrain.find(t=>t.id==='sb-east-inner-rise');destination={id:'gallery-approach',x:9880,y:C.topAt(t,9880)};}
 }
 if(id===20&&['escort-mid','hold-convoy','escape'].includes(goal?.id)){
  const injured=e.unit('objective');
  if(injured&&!injured.dead&&(goal.id!=='escape'||dist(injured,b.honroMarkers.find(m=>m.id==='escape'))>110))destination={id:'escort-injured',x:injured.x+100,y:injured.y};
  else {const convoy=(b.honroV4Convoy||[]).map(id=>e.unit(id)).filter(v=>v&&!v.dead);if(convoy.length)destination={id:'escort-rear',x:Math.min(...convoy.map(v=>v.x))+550,y:convoy[0].y};}
 }
 const forceRescueQuestioner=rescueQuestioner?.id===u.id;if(forceRescueQuestioner)destination=e.unit('14.gilchan');
 const forceWitnessObservation=witnessObserver?.id===u.id;if(forceWitnessObservation)destination={id:'authored-bell-souls-observation',...b.honroV4Reviewed16.bellSource};
 if(id===16&&!goal&&!forceWitnessObservation)destination=b.honroMarkers.find(m=>m.id==='16.work-exit');
 const forceVantage=id===17&&goal?.id==='17.defense'&&['archer','mage'].includes(u.cls)&&!b.terrain.find(t=>t.id==='gate-repair')?.broken,vantage={id:'authored-east-fire-pocket',x:7770,y:3101.6666666666665},atVantage=dist(u,vantage)<100;if(forceVantage)destination=vantage;
 const convoyDistance=v=>Math.min(Infinity,...(b.honroV4Convoy||[]).map(k=>e.unit(k)).filter(n=>n&&!n.dead).map(n=>dist(v,n)));
 const convoyThreat=v=>id===20&&goal?.id==='clear-pass'&&convoyDistance(v)<1600;
 let foes=e.alive(1).filter(v=>!(id===18&&v.id==='act2-keeper'&&!g.HonroAct23V4Stage18.memory(b).rescueSafe)&&!v.honroObjectiveTarget&&!(id===17&&v.id==='act2-hoist')&&(!extractionSpiritIds.has(v.id)||v.id===spirit?.id)&&(g.HonroAct2.visible(b,v)||v.id===spirit?.id)&&!(weak&&v.id===spirit?.id)).sort((a,z)=>Number(convoyThreat(z))-Number(convoyThreat(a))||(convoyThreat(a)&&convoyThreat(z)?convoyDistance(a)-convoyDistance(z):0)||Number(targetIds.has(z.id))-Number(targetIds.has(a.id))||dist(a,u)-dist(z,u));
 const urgent=foes.find(v=>targetIds.has(v.id)),near=foes.filter(v=>dist(v,u)<(policy==='survival'?1500:1100));
 // Escort formation, not a target/pose mutation: keep a nearby uphill leader,
 // clear the destination with other heroes, and never fire through Gilchan.
 if(id===14&&goal?.id==='14.refuge'){
  const npc=e.unit('14.gilchan');
  if(u.cls==='occultist'){
   for(let n=0;n<1500&&ready()&&!npc.dead&&g.HonroAct2.current(b)?.id==='14.refuge';n++){
    if(npc.moveLeft<1)break;
    if(u.x>2500&&npc.x-u.x<90)ops.move(-1,C.STEP);
    tick();
   }
   record({op:'escort-formation',hero:u.cls,npc:{x:npc.x,y:npc.y,hp:npc.hp},position:{x:u.x,y:u.y}});
  }else{const x={archer:2400,mage:2470,knight:2540}[u.cls];nav.advance(u,{id:'clear-refuge-approach-'+u.cls,x,y:2300},false);}
  if(ready())audit.production(()=>ops.defend());continue;
 }
 // Recovery is a committed action, never followed by pursuit in the same turn.
 if(policy==='survival'&&hpFraction(u)<.28){const threat=near[0];if(threat){const points=canonical.design.space.routes.flatMap(r=>r.anchors).filter(p=>dist(p,u)<1000&&dist(p,threat)>dist(u,threat)+250).sort((a,z)=>dist(z,threat)-dist(a,threat));if(points[0])nav.advance(u,points[0],false);}if(ready()){record({op:'defend-retreat',hero:u.cls});audit.production(()=>ops.defend());}continue;}
 // Emergency retreat/defend above takes precedence over optional recovery casting.
 if(policy==='survival'&&healStake(u))continue;
 if(id===16&&goal?.id==='16.safe'&&u.x>2655&&u.x<3300){nav.advance(u,destination,false);if(!ready())continue;}
 let fired=false;for(const t of near.filter(v=>!forceRescueQuestioner&&!forceWitnessObservation&&(!forceVantage||atVantage)&&(targetIds.has(v.id)||policy==='survival')).slice(0,3))if(fireAt(u,t)){fired=true;break;}if(fired)continue;
 if(forceRescueQuestioner)nav.advance(u,destination,false);else if(forceWitnessObservation)nav.advance(u,destination,false);else if(forceVantage)nav.advance(u,vantage,false);else if(urgent){destination=urgent;nav.advance(u,{...destination,approachRange:policy==='height'&&u.cls!=='knight'?700:undefined},true);}else if(destination)nav.advance(u,destination,false);
 if(id===13&&goal?.id==='gate')for(let climb=0;climb<4&&ready()&&u.x<4518&&u.moveLeft>e.jumpCost(u)+50;climb++){const oldY=u.y,step=b.terrain.find(t=>t.id==='v4.13.latch-step.'+(u.y>3990?0:u.y>3845?1:2));const next=u.y>3705?{id:'gate-shelf-chain',x:step.x+step.w/2,y:step.y}:{id:'inside-gate',x:4545,y:4090};nav.advance(u,next,false);if(Math.abs(oldY-u.y)<5)break;}
 if(!ready())continue;if(interact())continue;
 foes=foes.filter(v=>!v.dead&&dist(v,u)<(forceVantage?3300:1400));for(const t of foes.slice(0,3))if(fireAt(u,t)){fired=true;break;}
 if(!fired){record({op:'defend',hero:u.cls,position:{x:u.x,y:u.y},moveLeft:u.moveLeft});audit.production(()=>ops.defend());}
}
if(!['won','lost'].includes(b.phase)&&!stopReason)stopReason='controller action budget; unfinished, not game loss';
// Only normal App.frame settles outcome and required dialogue.
for(let n=0;['won','lost'].includes(b.phase)&&(!app.done||app.dialogue)&&n<10000;n++)tick();
await save('terminal');const result={...provenance,preview:preview.stats(),appOutcome:{done:app.done,cleared:plain(app.profile.cleared?.[id]||null),history:plain(app.profile.honroAct23V4History?.stages?.[id]||null)},phase:b.phase,round:b.round,stopReason,seconds:(performance.now()-started)/1000,remainingEnemies:e.alive(1).length,kills:b.kills,heroes:e.heroesAlive().map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp})),fallen:b.units.filter(u=>u.side===0&&!u.summoned&&u.dead).map(u=>u.id),done:plain(g.HonroAct2.memory(b).done),actions:actions.length,skills:Object.fromEntries([...new Set(actions.filter(a=>a.op==='app-operation'&&a.operation==='fire'&&a.accepted).map(a=>a.skill))].map(s=>[s,actions.filter(a=>a.op==='app-operation'&&a.operation==='fire'&&a.accepted&&a.skill===s).length])),hpDamageTaken:damage.filter(d=>d.side===0).reduce((n,d)=>n+d.hpDamage,0),hpDamageDealt:damage.filter(d=>d.side===1).reduce((n,d)=>n+d.hpDamage,0),externalWrites:audit.log.externalWrites,engineRecoveries:audit.log.recoveries,combatCycles:id===19?0:Math.max(0,b.round-1),displayRound:b.round,twentyRoundGate:b.phase==='won'&&b.round<=20,releaseApproved:false};await writeFile(out+'/result.json',JSON.stringify(result,null,2));console.log('RESULT',JSON.stringify(result));assert.equal(audit.log.externalWrites.length,0);if(b.phase!=='won')process.exitCode=1;
