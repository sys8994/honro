/** One bounded regional-combat / party-rally alternative to objectives-first-v3.
 * Shared navigator, legal resources and actual App/Engine/save rules are unchanged.
 * Reward-ledger entry is not a Stages1–7 playthrough; DOM/render/clock are doubles. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {runtimeParts} from '../shared/build.mjs';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {bierEntryProfile} from './stage8-bier-entry-helper.mjs';
import {representativeTargets,representativeMelee,representativeBladePrediction,analyzeWaits} from './stage18-bell-fullplay-helper.mjs';
import {escortNavigator} from './stage8-bier-fullplay-helper.mjs';
import {auditQuarryEngine} from './stage12-quarry-fullplay-helper.mjs';
import {authorStage8Bier} from '../tools/map-forge/stage8-bier.mjs';
const hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex'),h=await appHarness(),{g,C}=h;
const out=process.env.HONRO_FULLPLAY_OUT||'_local/reports/encounter-density/stage8-regional-rally';await mkdir(out,{recursive:true});
const rosterMode=process.env.HONRO_FULLPLAY_ROSTER||'canonical',basicOnly=process.env.HONRO_FULLPLAY_BASIC_ONLY==='1',representativeAttacks=!basicOnly,policy='bier-regional-rally-v1';
assert(['canonical','density36e9','candidate28e5','oldBudget20e0'].includes(rosterMode));
if(rosterMode!=='canonical')g.HONRO_PROJECT=await authorStage8Bier(plain(g.HONRO_PROJECT),g,{roster:rosterMode});
const stage=g.HONRO_PROJECT.stages[7],fixture=bierEntryProfile(g,{basicOnly}),parts=await runtimeParts({vector:false,render:false}),sourceHash=hash(g.HONRO_PROJECT),runtimeSha256=hash(parts.join('\n'));
const provenance={policy,rosterMode,basicOnly,sourceHash,runtimeSha256,controllerSha256:hash(await readFile(new URL(import.meta.url))),navigatorSha256:hash(await readFile('tests/stage8-bier-fullplay-helper.mjs')),entrySha256:hash(await readFile('tests/stage8-bier-entry-helper.mjs')),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dirty:execFileSync('git',['status','--short'],{encoding:'utf8'}).trim()};
const resume=process.env.HONRO_FULLPLAY_CONTINUE?JSON.parse(await readFile(process.env.HONRO_FULLPLAY_CONTINUE,'utf8')):null;
if(resume){assert.equal(resume.sourceHash,sourceHash);assert.equal(resume.runtimeSha256,runtimeSha256);for(const k of ['controllerSha256','navigatorSha256','entrySha256','policy','basicOnly','rosterMode'])assert.equal(resume.provenance[k],provenance[k]);}
let virtualMs=resume?.virtualMs||0;g.performance={now:()=>virtualMs};let app=h.load(resume?.profile||{...plain(g.AppRegression.fresh()),...plain(fixture.profile)});if(resume)app.continue();else app.launch(8);let e=app.engine,b=e.b;if(resume)assert.deepEqual(plain(b),resume.profile.honroBattle,'Exact whole battle external Continue');
assert.equal(b.honroStage8BierRevision,1);assert.equal(b.difficulty,'normal');const initial=resume?.initial||plain({battle:b,profile:app.profile});
const actions=resume?.actions||[],rounds=resume?.rounds||[],turns=resume?.turns||[],damage=resume?.damage||[],births=resume?.births||[],continues=resume?.continues||[],notices=resume?.notices||[],resources=resume?.resources||[],enemyActions=resume?.enemyActions||[];
const shotAttempts=new Map(resume?.shotAttempts||[]),basic={archer:'A01',mage:'M01',knight:'S00'};let frames=resume?.frames||0,storyFrames=resume?.storyFrames||0,attackPlanningMs=resume?.attackPlanningMs||0,lastSerial=-1,lastRound=0,stopReason=null,nav,liveAudit;
const distance=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y),terminal=()=>['won','lost'].includes(b.phase),ready=()=>app.canInput(),heroRows=()=>b.units.filter(u=>u.side===0&&!u.summoned).map(u=>({id:u.id,cls:u.cls,x:u.x,y:u.y,hp:u.hp,maxHp:u.maxHp,focus:u.focus,moveLeft:u.moveLeft,acted:u.acted,dead:u.dead}));
const record=row=>actions.push({round:b.round,frame:frames,turn:b.honroState.actorTurnSerial,...plain(row)}),known=new Set(b.units.map(u=>u.id)),savedLabels=new Set(continues.map(r=>r.label));
function instrument(){
 const event=app.event.bind(app);app.event=text=>{notices.push({round:b.round,frame:frames,text});return event(text);};
 const hurt=e.hurt.bind(e);e.hurt=function(u,...args){const hp=u.hp,side=u.side,result=hurt(u,...args);if(hp>u.hp)damage.push({round:b.round,frame:frames,target:u.id,side,owner:args[1],amount:hp-u.hp,remaining:u.hp,dead:u.dead,skill:args[6]||args[3]?.skill,x:u.x,y:u.y});return result;};
 const terrainHurt=e.damageTerrain.bind(e);e.damageTerrain=function(t,...args){const hp=t.hp,result=terrainHurt(t,...args);if(t.honroSeal&&hp>t.hp)record({op:'seal-damage',id:t.id,amount:hp-t.hp,hp:t.hp,broken:!!t.broken});return result;};
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){const u=e.active,acted=u?.acted,result=finish(...args);if(u?.side===1&&!acted&&u.acted)enemyActions.push({round:b.round,frame:frames,id:u.id,x:u.x,y:u.y});return result;};
 const fire=e.fire.bind(e);e.fire=function(skill,angle,power,...args){const u=e.active,focus=u?.focus,result=fire(skill,angle,power,...args);if(result&&u?.side===0&&!u.summoned){assert(u.loadout.includes(skill));if(basicOnly)assert.equal(skill,basic[u.cls]);resources.push({round:b.round,frame:frames,hero:u.cls,skill,before:focus,after:u.focus,cost:focus-u.focus});}return result;};
 nav=escortNavigator(g,b,e,{tick,ready,record,stageId:8,routes:stage.design.bier.routes,navigationState:nav?.snapshot()||resume?.navigatorState});liveAudit=auditQuarryEngine(b,e,()=>({round:b.round,frame:frames}),{previous:liveAudit?.log||resume?.liveAudit});
}
function story(){if(app.dialogue){liveAudit.production(()=>g.HonroStory.next(app));virtualMs+=C.STEP*1000;storyFrames++;return true;}if(['aim','enemy','ally','summon'].includes(b.phase))liveAudit.production(()=>g.HonroStory.turn(app));if(g.HonroStory.turnPaused(app)){virtualMs+=C.STEP*1000;storyFrames++;return true;}return false;}
function tick(){virtualMs+=C.STEP*1000;e.tick(C.STEP);if(!app.dialogue)liveAudit.production(()=>app.missionTick(C.STEP));liveAudit.guard();frames++;if(b.side===1)assert(b.queue.length<=4);for(const u of b.units)if(!known.has(u.id)){known.add(u.id);births.push({round:b.round,frame:frames,id:u.id,source:u.honroSpawnSource,x:u.x,y:u.y,elite:!!u.elite});}const serial=b.honroState.actorTurnSerial||0;if(serial!==lastSerial){lastSerial=serial;turns.push({round:b.round,frame:frames,turn:serial,phase:b.phase,active:b.active,enemyCount:e.alive(1).length,heroes:heroRows()});}}
instrument();
async function save(label='checkpoint'){app.export();const profile=await h.exported();assert.deepEqual(profile.honroBattle.units,plain(b.units));const data={provenance,sourceHash,runtimeSha256,initial,profile,actions,rounds,turns,damage,births,continues,notices,resources,enemyActions,shotAttempts:[...shotAttempts],navigatorState:nav.snapshot(),frames,storyFrames,attackPlanningMs,virtualMs,liveAudit:liveAudit.log};await writeFile(`${out}/${label}.json`,JSON.stringify(data));return data;}
async function continueNow(label){const data=await save(label),before=plain(b);app=h.load(data.profile);app.continue();e=app.engine;b=e.b;assert.deepEqual(plain(b),before,'Whole-battle exact Continue '+label);continues.push({label,round:b.round,frame:frames,exact:true});savedLabels.add(label);instrument();}
const missedAtPose=(u,target)=>{const last=shotAttempts.get(u.id+':'+target.id);return last&&target.hp>=last.hp&&(target.shield||0)>=last.shield&&distance(u,last.position)<120&&distance(target,last.targetPosition)<120&&(b.honroState.actorTurnSerial||0)>last.turn;};
const rememberShot=(u,target,skill=basic[u.cls])=>shotAttempts.set(u.id+':'+target.id,{hp:target.hp,shield:target.shield||0,position:{x:u.x,y:u.y},targetPosition:{x:target.x,y:target.y},skill,turn:b.honroState.actorTurnSerial||0});
function attack(u,target){const missed=missedAtPose(u,target);if(missed&&!representativeAttacks)return false;const begin=performance.now();try{
 const basicSkill=C.SKILLS[basic[u.cls]];
 let meleeChoice=null;
 if(basicSkill.martial&&basicSkill.branch==='sword'){
  meleeChoice=representativeMelee(g,e,u,target,'S00');
  if(meleeChoice&&e.fire(meleeChoice.skill,meleeChoice.angle,meleeChoice.power)){rememberShot(u,target,meleeChoice.skill);record({op:'fire',hero:u.cls,skill:meleeChoice.skill,target:target.id,hpBefore:target.hp,angle:meleeChoice.angle,power:meleeChoice.power,from:{x:u.x,y:u.y},shot:b.shot,predictedTargets:meleeChoice.predictedTargets,predictedEnemyDamage:meleeChoice.net,predictionMethod:'shared representativeMelee gross sector estimate before armor/shield/crit',support:nav.surface(u),tacticalReason:meleeChoice.tacticalReason||'ordinary basic sword'});return true;}
  if(!representativeAttacks)return false;
 }
 function plan(s,{reflect=false,multiple=false}={}){
  if(!u.loadout.includes(s.id)||e.manaCost(s,u,.5)>u.focus||missed&&(shotAttempts.get(u.id+':'+target.id)?.skill||basic[u.cls])===s.id)return null;let best=null;const seen=new Set(),radius=e.effective(s,u).radius;
  function inspect(aim){const key=aim.angle+':'+aim.power;if(seen.has(key)||e.manaCost(s,u,aim.power)>u.focus)return;seen.add(key);if(s.id==='S09'){const v=representativeBladePrediction(g,e,u,s,aim);if(v?.ok&&(!best||v.net>best.net))best={...aim,net:v.net,skill:s.id,predictedTargets:v.predictedTargets,predictedEnemyDamage:v.net,predictedFriendlyDamage:v.risk,predictionMethod:v.method,reflections:0};return;}const v=C.shotViable(e,u,s,target,aim.angle,aim.power),predictedTargets=representativeTargets(g,e,u,s,v.hit);const thunderMultiple=multiple&&s.mode==='gourdThunder'&&predictedTargets.length>=2;
   if(!(v.risk<1&&(thunderMultiple||(v.ok||target.hp<=2&&v.enemyDamage>0)&&v.miss<Math.max(85,radius+target.r+55))))return;if(reflect&&!v.hit.contacts?.length)return;if(multiple&&predictedTargets.length<2)return;
   const net=(v.net||0)+(s.mode==='gourdThunder'?e.effective(s,u).damage*.45*predictedTargets.length:0);if(!best||net>best.net)best={...aim,net,skill:s.id,predictedTargets,predictedEnemyDamage:v.enemyDamage,predictedFriendlyDamage:v.risk,predictionMethod:'production shotViable geometry and damage estimate',predictedHit:{x:v.hit.x,y:v.hit.y,unit:v.hit.unit,terrain:v.hit.terrain},reflections:v.hit.contacts?.length||0};}
  for(const aim of e.shotSeeds(u,s,target)){inspect(aim);if(s.id==='S09'&&best)break;}
  if(!best)inspect(e.bestShot(u,s,target));
  if(!best&&reflect)for(const power of [.35,.55,.75,1])for(let angle=-80;angle<=260;angle+=4)inspect({angle,power});
  return best;
 }
 let chosen=u.cls==='knight'?plan(C.SKILLS.S09):plan(basicSkill),reason=u.cls==='knight'?'equipped ranged blade after basic sword cannot reach':'free-basic';
 if(representativeAttacks&&u.cls==='archer'){for(const id of ['A02','A03','A11']){const special=plan(C.SKILLS[id]);if(special&&(!chosen||special.net>chosen.net*1.18)){chosen=special;reason='equipped archer technique has the stronger safe predicted shot';}}}
 if(representativeAttacks&&u.cls==='mage'){
  const radius=260+10*((u.ranks.M04||1)-1),cluster=e.alive(1).filter(t=>distance(t,target)<radius*2+80).length;
  if(cluster>=2){const area=plan(C.SKILLS.M04,{multiple:true});if(area&&(!chosen||area.net>chosen.net*1.2)){chosen=area;reason='equipped area reaches multiple bodies';}}
  if(!chosen){const reflected=plan(C.SKILLS.M11,{reflect:true});if(reflected&&(!chosen||reflected.net>chosen.net*1.1)){chosen=reflected;reason='equipped actual-reflection line is safely predicted to improve the shot';}}
 }
 if(chosen&&e.fire(chosen.skill,chosen.angle,chosen.power)){rememberShot(u,target,chosen.skill);record({op:'fire',hero:u.cls,skill:chosen.skill,target:target.id,hpBefore:target.hp,angle:chosen.angle,power:chosen.power,from:{x:u.x,y:u.y},tacticalReason:reason,predictedTargets:chosen.predictedTargets,shot:b.shot,support:nav.surface(u),predictedEnemyDamage:chosen.predictedEnemyDamage,predictedFriendlyDamage:chosen.predictedFriendlyDamage,predictionMethod:chosen.predictionMethod,predictedHit:chosen.predictedHit,predictedReflections:chosen.reflections});return true;}return false;
 }finally{attackPlanningMs+=performance.now()-begin;}}


function attackSeal(u,t){if(!t||t.broken)return false;const begin=performance.now();try{const s=C.SKILLS[basic[u.cls]],target={x:t.x+t.w/2,y:t.y+t.h/2,h:0,r:Math.min(t.w,t.h)/2};if(distance(u,target)>1850)return false;
 if(u.cls==='knight'){
  // The new authored seals explicitly accept the ordinary sword sector. The
  // first controller incorrectly excluded the knight from this existing input.
  const angle=Math.atan2(u.y-u.h*.5-target.y,target.x-u.x)*180/Math.PI;
  for(const power of [1,.7,.2])if(C.meleeTerrainContact(e,u,t,C.meleeRange(u,s,power),-angle*Math.PI/180,C.meleeSpan(u,s,power))&&e.fire(s.id,angle,power)){record({op:'fire-seal',hero:u.cls,skill:s.id,target:t.id,hpBefore:t.hp,angle,power,from:{x:u.x,y:u.y},predictionMethod:'production meleeTerrainContact'});return true;}
  return false;
 }
 const aims=e.shotSeeds(u,s,target);for(const aim of aims){const p=e.predict(u,s,aim.angle,aim.power,undefined,false);if(p.terrain===t.id&&e.fire(s.id,aim.angle,aim.power)){record({op:'fire-seal',hero:u.cls,skill:s.id,target:t.id,hpBefore:t.hp,angle:aim.angle,power:aim.power,from:{x:u.x,y:u.y}});return true;}}return false;}finally{attackPlanningMs+=performance.now()-begin;}}
const seals=()=>b.terrain.filter(t=>t.honroSeal),goal=()=>{const left=seals().filter(t=>!t.broken).sort((a,z)=>a.x-z.x);return left[0]||(!e.unit('boss')?.dead?e.unit('boss'):null);};
function destination(u,target){if(target?.honroSeal){const site=Object.values(stage.design.space.sites).find(s=>s.objectiveId===target.id),p=site?.standing;if(p){const x=p.x-(u.cls==='mage'?130:u.cls==='archer'?230:0),t=b.terrain.find(t=>t.id===p.surfaceId),y=t?C.topAt(t,x):p.y,pose=Number.isFinite(y)&&C.validTerrainContactPose(b.terrain,{...u,x,y})?{...p,x,y}:p;return{id:target.id+'-approach',...pose};}}if(target)return{...target,surfaceId:nav.surface(target),approachRange:u.cls==='knight'?100:520};return null;}
await writeFile(`${out}/initial.json`,JSON.stringify({provenance,initial,training:fixture.training,readiness:fixture.readiness},null,2));if(!resume)await save('initial-export');
const started=performance.now(),actionLimit=Number(process.env.HONRO_FULLPLAY_ACTION_LIMIT||450),roundLimit=Number(process.env.HONRO_FULLPLAY_ROUND_LIMIT||65);let lastSignature='',stalled=0;
for(let turn=0;turn<actionLimit&&!terminal();turn++){
 while(!ready()&&!terminal()){if(story())continue;tick();if(frames>700000){stopReason='engine observation limit';break;}}if(stopReason||terminal())break;
 if(lastRound!==b.round){lastRound=b.round;const row={round:b.round,heroes:heroRows(),seals:seals().map(t=>({id:t.id,hp:t.hp,broken:t.broken})),boss:plain(e.unit('boss')),enemies:e.alive(1).length};rounds.push(row);console.log('ROUND',JSON.stringify({...row,boss:{hp:row.boss.hp,x:row.boss.x,y:row.boss.y,dead:row.boss.dead}}));await save('round-'+b.round);await save();const signature=JSON.stringify([row.seals,row.boss.hp,row.enemies,row.heroes.map(u=>[u.id,Math.round(u.x/50),Math.round(u.y/50)])]);stalled=signature===lastSignature?stalled+1:0;lastSignature=signature;if(stalled>=6){stopReason='fixed policy unchanged six rounds';break;}if(b.round>roundLimit){stopReason='round observation limit';break;}}
 if(seals().filter(t=>t.broken).length===1&&!savedLabels.has('first-seal'))await continueNow('first-seal');
 if(e.heroesAlive().some(u=>u.level>=8)&&!savedLabels.has('level8'))await continueNow('level8');
 const u=e.active;if(!u||u.dead){stopReason='no living active hero';break;}
 const movement=b.honroState.stage8Bier;
 // React to the actual warning by using the authored lower return. This is an
 // ordinary voluntary movement choice, never a new mission prerequisite.
 if(['announced','blocked'].includes(movement?.status)&&!e.unit('boss')?.dead){
  const point=stage.design.bier.nodes[u.x>6200?'E':'G'];
  if(point&&distance(u,point)>180){const before={x:u.x,y:u.y,moveLeft:u.moveLeft};nav.advance(u,{id:'give-bier-road-'+u.cls,...point});record({op:'clear-bier-road',hero:u.cls,from:before,to:{x:u.x,y:u.y},movementCost:before.moveLeft-u.moveLeft});if(!ready())continue;}
 }
 let target=goal(),fired=false;
 const nearby=()=>e.alive(1).filter(v=>v.id!==target?.id&&distance(v,u)<1100&&Math.abs(v.y-u.y)<650).sort((a,z)=>distance(a,u)-distance(z,u));
 // Resolve immediate contact before regrouping. Beyond this contact ring,
 // the trailing hero follows the party instead of shooting forever from B.
 for(const v of nearby().filter(v=>distance(v,u)<300).slice(0,2))if(attack(u,v)){fired=true;break;}if(fired)continue;
 const party=e.heroesAlive().filter(v=>!v.summoned),front=party.reduce((a,z)=>a.x>z.x?a:z),rear=party.reduce((a,z)=>a.x<z.x?a:z);
 const givingRoad=['announced','blocked'].includes(b.honroState.stage8Bier?.status);
 if(!givingRoad&&front.x-u.x>700){
  const leader=party.filter(v=>v.x>u.x+350).sort((a,z)=>distance(a,u)-distance(z,u))[0];
  if(leader){const support=nav.surface(leader),terrain=b.terrain.find(t=>t.id===support),x=leader.x-170,y=terrain&&C.topAt(terrain,x),point=Number.isFinite(y)&&C.validTerrainContactPose(b.terrain,{...u,x,y})?{x,y,surfaceId:support}:{x:leader.x,y:leader.y,surfaceId:support};
   record({op:'rally',hero:u.cls,leader:leader.cls,gap:front.x-u.x,from:{x:u.x,y:u.y},to:point,reason:'rear hero closes the same authored route before distant shooting'});nav.advance(u,{id:'rally-'+leader.id,...point});
   if(!ready())continue;
  }
 }
 // Local guards and finite responses get a combat window before another
 // objective sprint. These are ordinary attacks with the same legal loadout.
 for(const v of nearby().slice(0,3))if(attack(u,v)){fired=true;break;}if(fired)continue;
 const teamSpread=front.x-rear.x,holdingForParty=!givingRoad&&u.x-rear.x>900;
 if(holdingForParty)record({op:'rally-hold',hero:u.cls,gap:teamSpread,rear:rear.cls,reason:'front does not open the next combat site while the rear is over900 behind'});
 if(!holdingForParty){
  if(target?.honroSeal&&attackSeal(u,target))continue;if(target?.side===1&&distance(u,target)<1800&&attack(u,target))continue;
  const local=nearby().find(v=>!g.HonroWorld.archetypes[v.honroVariant]?.flying&&distance(v,u)<850),advanceTarget=local||target,point=givingRoad?null:destination(u,advanceTarget);
  if(point&&ready())nav.advance(u,point,!!advanceTarget?.side);if(!ready())continue;target=goal();
  for(const v of nearby().slice(0,3))if(attack(u,v)){fired=true;break;}if(fired)continue;
  if(target?.honroSeal&&attackSeal(u,target))continue;if(target?.side===1&&distance(u,target)<1800&&attack(u,target))continue;
 }
 const before={hp:u.hp,focus:u.focus};record({op:'defend',hero:u.cls,reason:holdingForParty?'regroup-before-next-site':'no-safe-shot-after-local-combat-position'});liveAudit.production(()=>app.defend());resources.push({round:b.round,frame:frames,hero:u.cls,op:'defend',before,after:{hp:u.hp,focus:u.focus}});
}
if(!terminal()&&!stopReason)stopReason='action observation limit';const beforeReward=plain({heroes:b.heroes,resources:heroRows(),growth:b.honroGrowth});if(terminal()){for(let i=0;app.dialogue&&i<300;i++)story();liveAudit.production(()=>app.outcome());for(let i=0;app.dialogue&&i<300;i++)story();}else await save();
assert.equal(liveAudit.log.externalWrites.length,0);assert.equal(liveAudit.log.recoveries.length,0);assert.deepEqual(plain(b.items),initial.battle.items);
const result={...provenance,phase:b.phase,round:b.round,stopReason,wallSeconds:(performance.now()-started)/1000,frames,simulationSeconds:frames*C.STEP,storyFrames,attackPlanningMs,heroes:heroRows(),allThreeSurvived:e.heroesAlive().length===3,seals:seals().map(t=>({id:t.id,hp:t.hp,broken:t.broken})),boss:plain(e.unit('boss')),initialEnemies:initial.battle.units.filter(u=>u.side===1).length,totalEnemies:b.units.filter(u=>u.side===1).length,remainingEnemies:e.alive(1).length,births,continues,damageTaken:damage.filter(d=>d.side===0).reduce((n,d)=>n+d.amount,0),liveAudit:liveAudit.log,limits:['Real first-clear/recruit reward fixture through7; not prior campaign gameplay.','Normal production inputs with DOM/render/storage/clock doubles; not browser proof.','One fixed legal rank1/stat6 policy; no consumables, live actor/resource writes or recovery calls.']};
await writeFile(`${out}/result.json`,JSON.stringify(result,null,2));await writeFile(`${out}/trace.json`,JSON.stringify({actions,rounds,turns,damage,births,continues,notices,resources,enemyActions},null,2));await writeFile(`${out}/final-battle.json`,JSON.stringify(b));await writeFile(`${out}/wait-analysis.json`,JSON.stringify(analyzeWaits(actions,b.round,{rounds,turns,damage,births,notices,continues,resources,frames,step:C.STEP}),null,2));
if(b.phase==='won'){assert(app.done&&app.profile.cleared[8]);app.export();await writeFile(`${out}/victory-profile.json`,JSON.stringify({profile:await h.exported(),beforeReward,provenance}));const after=plain(app.profile);assert.equal(after.cleared[8].visits,1);assert(!after.cleared[9]);assert.deepEqual(after.recruited,['archer','mage','knight']);for(const cls of after.recruited)assert.equal(after.heroes[cls].xp,b.honroGrowth.limit.end);app.event=h.App.prototype.event.bind(app);h.click('result-continue');h.finish(app);assert.equal(app.screen,'rest');assert.equal(g.HonroJourneyContent.next(app.profile).stageId,9);h.click('journey-enter',{id:'9'});const next=app.engine.b;assert.equal(next.honroStage,9);assert.equal(next.round,1);assert(!next.honroStage8BierRevision);assert.equal(next.units.filter(u=>u.side===0).length,3);assert.deepEqual(plain(next.heroes),after.heroes);await writeFile(`${out}/stage9-entry.json`,JSON.stringify({arrived:true,source:provenance,profileAfter8:after,battle:plain(next),scope:'Actual won8 outcome and ordinary result/rest/journey-enter9; stopped at introduction.'},null,2));}
console.log('RESULT',JSON.stringify({...result,boss:undefined,liveAudit:undefined}));if(b.phase!=='won')process.exitCode=1;
