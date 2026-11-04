/** Stage23 native product comparison: observable combat casts and explicit escort rule. Legal entry fixture only.
 * No live positions, HP, enemies, objective states or RNG are rewritten. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from '../tools/act2-qa/stage17-gate-app-harness.mjs';
import {escortEntryProfile} from './stage23-escort-entry-helper.mjs';
import {representativeMelee} from './stage18-bell-fullplay-helper.mjs';
import {auditQuarryEngine} from './stage12-quarry-fullplay-helper.mjs';
import {detachedIndependentPlanner as detachedPlanner,friendlyMuzzleObstruction,ESTIMATE_RANDOM} from '../tools/stage23-qa/independent-planning.mjs';
import {createPlayerOperations} from '../tools/act2-qa/stage17-gate-player-operations.mjs';
import {mainY,mainSupport} from '../tools/map-forge/stage23-loading-yard.mjs';
const out=process.env.HONRO_QA_OUT||'/tmp/honro-stage23-natural-baseline';await mkdir(out,{recursive:true});
const h=await appHarness({productionStory:true,productionInputActions:true}),{g,C}=h;vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const fixture=escortEntryProfile(g);let p={...plain(g.AppRegression.fresh()),...plain(fixture.profile)};p.settings.difficulty='story';if(process.env.HONRO_QA_ENTRY_PATH){const entry=JSON.parse(await readFile(process.env.HONRO_QA_ENTRY_PATH,'utf8'));assert(entry.provenance.entryFixture.startsWith('Pre-entry first-clear/recruit reward-ledger fixture through22;'));assert(!entry.profile.honroBattle&&!entry.profile.cleared[23]);p=plain(entry.profile);}g.performance={now:()=>0};
const resume=process.env.HONRO_QA_RESUME?JSON.parse(await readFile(process.env.HONRO_QA_RESUME,'utf8')):null;
const app=h.load(resume?.profile||p);if(resume)app.continue();else app.launch(23);const e=app.engine,b=e.b,V=g.HonroAct23V4,R=g.HonroAct23V4Chapter23Reviewed,S=g.HonroAct23V4Chapter23Facts,canonical=g.HONRO_PROJECT.stages[22];
assert.equal(b.honroCampaignMapRevision,423);assert.equal(b.difficulty,'story');assert.equal(b.seed,b.stageId*19381+7);
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const provenance={sourceTarget:process.env.HONRO_QA_SOURCE||process.env.GITHUB_SHA||process.env.HONRO_QA_SOURCE||'local-unattested; see controller/runtime hashes',entryFixture:fixture.scope,resume:resume?{path:process.env.HONRO_QA_RESUME,round:b.round,originalProvenance:resume.provenance}:null,profileHash:hash(p),stageHash:hash(canonical),controllerHash:hash(await readFile(new URL(import.meta.url),'utf8')),reviewedRuntimeHash:hash(await readFile('shared/runtime/act23-v4-ch23-reviewed.js','utf8')),pacingRevision:b.honroReviewed23PacingRevision||null,difficulty:b.difficulty,mapRevision:b.honroCampaignMapRevision,scope:'Actual production App/Engine frames/actions and finite resources with DOM/render/storage/clock doubles. Not browser or human timing. Earlier chapters are legal reward-ledger fixture, not played.'};
const actions=resume?.actions||[],rounds=resume?.rounds||[],damage=resume?.damage||[],notices=resume?.notices||[],events=resume?.events||[];let lastRound=0,stopReason=null,movementCalls=0,storyFrameCount=0,lastStory=null;
const goal=()=>V.current(b),npc=()=>e.unit('act3-carrier'),ready=()=>app.canInput(),dist=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y),inputAimError=()=>0;
const record=r=>actions.push({round:b.round,frame:ops.frames,goal:goal()?.id,...plain(r)});
const preview={render:()=>{},stats:()=>({scope:'Scene/aim pixels are doubled for this native Stage23 input run; no aim-observation objectives in Stage23.'})};const ops=createPlayerOperations({app,g,C,record,render:preview.render});
const audit=auditQuarryEngine(b,e,()=>({round:b.round,frame:ops.frames}));
const combatFires=[];const actualFire=e.fire.bind(e);e.fire=function(skill,angle,power,ai=false){const actor=e.active,at={round:b.round,frame:ops.frames,actor:actor?.id,side:actor?.side,skill,angle,power,ai:!!ai,x:actor?.x,y:actor?.y,goal:goal()?.id};const accepted=actualFire(skill,angle,power,ai);if(accepted)combatFires.push(at);return accepted;};
const hurt=e.hurt.bind(e);e.hurt=function(u,...a){const before=u.hp,out=hurt(u,...a);if(before>u.hp)damage.push({round:b.round,frame:ops.frames,id:u.id,side:u.side,source:a[1]??null,amount:before-u.hp,hp:u.hp,dead:u.dead});return out;};
const event=app.event.bind(app);app.event=(text,...a)=>{notices.push({round:b.round,frame:ops.frames,text});return event(text,...a);};
const tick=()=>{if(app.dialogue){storyFrameCount++;const row=app.dialogue.lines?.[app.dialogue.index]?.[2]?.rowId;if(row&&row!==lastStory){events.push({row,round:b.round,frame:ops.frames});lastStory=row;}}audit.production(()=>ops.frame());audit.guard();movementCalls+=audit.log.movement.length;audit.log.movement.length=0;};
async function save(label){app.export();await writeFile(out+'/'+label+'.json',JSON.stringify({provenance,profile:await h.exported(),actions,rounds,damage,combatFires,notices,events,frames:ops.frames,audit:{externalWrites:audit.log.externalWrites,recoveries:audit.log.recoveries}}));}
function playerFire(skill,angle,power){const normalized=((angle+85)%360+360)%360-85;if(normalized>265){record({op:'rejected-unreachable-aim',skill,angle,normalized});return false;}return audit.production(()=>ops.fire(skill,normalized,power));}
// Production aim predictors may internally fire/step isolated clones and retain
// independent estimation damageSequence/RNG. It remains a simulation, not pure geometry.
// S04 correction is opt-in; default is production scoring. Neither mode reads live future rolls directly.
const s04ScoreMode=process.env.HONRO_QA_S04_SCORE||'production';
assert(['production','ordinary'].includes(s04ScoreMode),'HONRO_QA_S04_SCORE must be production or ordinary');
const muzzleSetting=process.env.HONRO_QA_MUZZLE_ADVANCE||'0';
assert(['0','1'].includes(muzzleSetting),'HONRO_QA_MUZZLE_ADVANCE must be0 or1');
const muzzleAdvanceEnabled=muzzleSetting==='1';
const escortFirst=process.env.HONRO_QA_ESCORT_FIRST==='1';
assert(['0','1',undefined].includes(process.env.HONRO_QA_ESCORT_FIRST),'Invalid escort-first flag');
assert(s04ScoreMode==='production'&&!muzzleAdvanceEnabled,'Fix production S04 scoring and muzzle0');
provenance.escortFirst={enabled:escortFirst,leadDistance:190,maxFrames:1700,scope:'When the live objective is escort and its actual blocked predicate is false, use the already-existing ordinary finite-budget road-following controls before the first shot search. No future outcome, forced movement, refill, damage change or added turn is used.'};
const scoringAudit={candidates:0,oldViable:0,newViable:0,oldOnly:0,newOnly:0};
provenance.s04Scoring={revision:1,mode:s04ScoreMode,ordinaryCorrectionApplied:s04ScoreMode==='ordinary',
 radius:s04ScoreMode==='ordinary'?80:null,damageFactor:s04ScoreMode==='ordinary'?.75:null,falloff:s04ScoreMode==='ordinary'?.65:null,
 baselineControllerSha256:'3c6bca2831652de4324da654c08b4eff4fa360442167d3834e82654905a4a1c3',
 scope:'Default production scoring is unchanged. Only HONRO_QA_S04_SCORE=ordinary enables the unadopted nominal S04 correction. Existing aim predictor, friendly-risk estimate/cutoff, targets, skill order and controls are retained. No mid-flight dive command is issued. Production predictor internally simulates isolated clones, after actual future RNG/sequence fields are replaced with predeclared independent estimation streams. This is not pure geometry or mean damage.'};
provenance.independentPlanning={random:ESTIMATE_RANDOM,policy:'Independent fixed estimate before Engine construction; current observed wind is retained; seeds not selected by results.'};
provenance.muzzleAdvance={enabled:muzzleAdvanceEnabled,environment:muzzleSetting,distance:20,maxPerHeroRound:1,trigger:'No equipped shot plan and nearby selected road threat with friendly muzzle/straight-line obstruction',scope:'Ordinary movement only; no blanket95px-range change, resource refill or friendly-damage relaxation.'};
const muzzleAttempts=new Set();
function obstructionAdvance(u,target){
 const key=b.round+':'+u.id;if(!muzzleAdvanceEnabled||muzzleAttempts.has(key)||!target||!ready())return false;
 const probe=detachedPlanner(C,b);let obstruction;
 try{obstruction=friendlyMuzzleObstruction(C,probe.engine,probe.unit(u.id),probe.unit(target.id));probe.check();}finally{probe.check();}
 if(!obstruction)return false;
 muzzleAttempts.add(key);const start={x:u.x,y:u.y,move:u.moveLeft};let stall=0;
 for(let i=0;i<90&&ready()&&e.active===u&&e.grounded(u)&&u.moveLeft>1;i++){
  const advanced=(u.x-start.x)*obstruction.direction,remaining=20-advanced;if(remaining<=.05)break;
  const before=u.x,axis=obstruction.direction*Math.min(1,remaining/Math.max(1,u.walkSpeed*C.STEP));
  ops.move(axis,C.STEP);tick();if(Math.abs(u.x-before)<.01)stall++;else stall=0;if(stall>=3)break;
 }
 record({op:'friendly-muzzle-advance',hero:u.cls,obstruction,from:start,to:{x:u.x,y:u.y,move:u.moveLeft},actualForward:(u.x-start.x)*obstruction.direction});
 return Math.abs(u.x-start.x)>.05;
}
function scoredShot(pe,pu,skill,pt,angle,power){
 const v=C.shotViable(pe,pu,skill,pt,angle,power);
 if(s04ScoreMode!=='ordinary'||skill.id!=='S04'||skill.mode!=='warriorDive')return v;
 const eff=pe.effective(skill,pu),radius=80;let enemyDamage=0;
 for(const t of pe.b.units){
  if(t.dead||t.eaterCapturedBy||t.side===pu.side||t.side===2)continue;
  const d=Math.hypot(t.x-v.hit.x,t.y-t.h*.45-v.hit.y);
  if(d>=radius+t.r)continue;
  // land() uses .75 and radius80 without the second dive input. Preserve the
  // existing armor/HP-shield-cap approximation, without variance/crit lookup.
  const nominal=eff.damage*.75*(1-.65*Math.max(0,Math.min(1,d/radius)));
  const raw=nominal*(1-Math.max(0,Math.min(.7,t.armor)))*pe.friendlyFireMultiplier(t,pu.id,{attackSide:pe.allegiance(pu)});
  enemyDamage+=Math.min(t.hp+t.shield,Math.max(0,raw));
 }
 const friendlyDamage=v.friendlyDamage??v.risk??0,net=enemyDamage-friendlyDamage*1.15;
 const ok=enemyDamage>0&&net>Math.max(2,enemyDamage*.05);
 scoringAudit.candidates++;scoringAudit.oldViable+=Number(v.ok);scoringAudit.newViable+=Number(ok);scoringAudit.oldOnly+=Number(v.ok&&!ok);scoringAudit.newOnly+=Number(!v.ok&&ok);
 return {...v,ok,reason:ok?'':'ordinary-dive-landing',enemyDamage,friendlyDamage,net,
  scoring:{kind:'ordinary-S04-landing',radius,damageFactor:.75,falloff:.65,oldNet:v.net??null,newNet:net,oldOk:v.ok,newOk:ok,hit:{x:v.hit.x,y:v.hit.y}}};
}
function fireAt(u,target){record({op:'fire-at-budget',hero:u.cls,target:target.id,moveLeft:u.moveLeft,position:{x:u.x,y:u.y}});const probe=detachedPlanner(C,b),pe=probe.engine,pu=probe.unit(u.id),pt=probe.unit(target.id);try{const spirit=target.honroSpirit&&!target.manifested;let skills=u.loadout.map(k=>C.SKILLS[k]).filter(s=>s&&s.damage>0&&!s.passive&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus);skills.sort((a,z)=>(spirit?Number(z.id==='O08')-Number(a.id==='O08'):0)||z.damage-a.damage);
 for(const skill of skills){let best=null;if(skill.martial&&skill.branch==='sword')best=representativeMelee(g,pe,pu,pt,skill.id);else{for(const aim of pe.shotSeeds(pu,skill,pt)){const v=scoredShot(pe,pu,skill,pt,aim.angle,aim.power);if((v.ok||target.hp<=2&&v.enemyDamage>0)&&v.risk<1&&v.miss<Math.max(85,skill.radius+target.r+55)&&(!best||v.net>best.net))best={...aim,net:v.net,scoring:v.scoring};}if(!best&&skill===skills[0]){const direct=Math.atan2(u.y-u.h*.6-(target.y-target.h*.5),target.x-u.x)*180/Math.PI;const angles=[direct,...(target.x>=u.x?[25,45,65,80]:[100,115,135,155])];for(const angle of angles)for(const power of [1,.6]){const v=scoredShot(pe,pu,skill,pt,angle,power);if((v.ok||target.hp<=2&&v.enemyDamage>0)&&v.risk<1&&v.miss<Math.max(85,skill.radius+target.r+55)&&(!best||v.net>best.net))best={angle,power,net:v.net,scoring:v.scoring};}}}
 const aimError=best?inputAimError():0,requestedAngle=best?best.angle+aimError:0;if(best){probe.check();const accepted=playerFire(skill.id,requestedAngle,best.power);if(accepted)record({op:'fire',hero:u.cls,skill:skill.id,target:target.id,angle:requestedAngle,plannedAngle:best.angle,inputAimError:aimError,power:best.power,plannedNet:best.net,scoring:best.scoring,hpBefore:target.hp,position:{x:u.x,y:u.y}});return accepted;}}
 probe.check();return false;}catch(error){throw error;}
}
function interact(){const m=g.HonroInteractions.nearest(app);if(m?.id!==goal()?.id)return false;return g.HonroInteractions.eligibility(app,m).ok&&audit.production(()=>ops.interact(m));}
function point(x,label='escort-road'){return{id:label,x,y:mainY(x),surfaceId:mainSupport(x)};}
function roadAdvance(u,x,range=35){const start={x:u.x,y:u.y},dir=Math.sign(x-u.x);let still=0;for(let k=0;k<2600&&ready()&&u.moveLeft>8&&Math.abs(x-u.x)>range;k++){
 if(u.y<mainY(u.x)-160&&e.canDrop(u)&&audit.production(()=>ops.drop(u))){record({op:'road-normal-drop',hero:u.cls,x:u.x,y:u.y});for(let k=0;k<600&&ready()&&!e.grounded(u);k++)tick();}
 const old={x:u.x,y:u.y};ops.move(Math.sign(x-u.x),C.STEP);tick();
 if(Math.abs(u.x-old.x)<.02)still++;else still=0;
 if(still>18&&e.grounded(u)){if(e.alive(1).some(v=>dist(v,u)<u.r+v.r+100&&Math.abs(v.y-u.y)<160))break;if(audit.production(()=>ops.jump(u)))record({op:'road-cover-jump',hero:u.cls,x:u.x,y:u.y});still=0;}
 // An upper ramp is traversable; do not strand a hero solely because the lower road is 240px below.
 // Drop through ordinary pass-through platforms when the shipping action allows it.
}record({op:'road-advance',hero:u.cls,from:start,to:{x:u.x,y:u.y},targetX:x,moveLeft:u.moveLeft});}
await writeFile(out+'/initial.json',JSON.stringify({provenance,profile:resume?.profile||p,battle:plain(b)},null,2));
function advanceOpenEscort(u,n,cur){
 if(!escortFirst||cur?.kind!=='escort'||n.moveLeft<=2||u.moveLeft<=10||S.blocked(b)||!ready())return false;
 const start={hero:{x:u.x,y:u.y,move:u.moveLeft},npc:{x:n.x,y:n.y,move:n.moveLeft}};
 // Reuse the exact existing open-route following logic, not a faster path.
 roadAdvance(u,Math.min(9150,n.x+190));
 for(let k=0;k<1700&&ready()&&n.moveLeft>2&&u.moveLeft>10&&goal()?.kind==='escort'&&!S.blocked(b);k++){
  if(Math.abs(u.y-mainY(u.x))>60||Math.abs(u.y-n.y)>210)break;
  if(u.x-n.x<180)ops.move(1,C.STEP);tick();
 }
 record({op:'advance-open-escort-before-fire',hero:u.cls,from:start,to:{hero:{x:u.x,y:u.y,move:u.moveLeft},npc:{x:n.x,y:n.y,move:n.moveLeft}},blocked:S.blocked(b)});
 return true;
}
const terminal=()=>['won','lost'].includes(b.phase),started=performance.now(),limit=Number(process.env.HONRO_QA_ROUND_LIMIT||80),actionLimit=Number(process.env.HONRO_QA_ACTION_LIMIT||500);
for(let turn=0;turn<actionLimit&&!terminal();turn++){
 global.gc?.();
 for(let n=0;!ready()&&!terminal()&&n<30000;n++)tick();if(terminal())break;if(!ready()){stopReason='input unavailable after 250 simulated seconds';break;}
 if(b.round!==lastRound){lastRound=b.round;const row={round:b.round,goal:goal()?.id,npc:{x:npc().x,y:npc().y,hp:npc().hp,move:npc().moveLeft},enemies:e.alive(1).length,blockingFoes:e.alive(1).filter(v=>dist(v,npc())<320).map(v=>v.id),heroes:e.heroesAlive().map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,move:u.moveLeft}))};row.escortBlocked=S.blocked(b);row.escortWaypointIndex=V.mem(b).escortWaypoints?.[goal()?.id+':act3-carrier']??0;row.nearbyThreats=e.alive(1).filter(v=>dist(v,npc())<900).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,elite:!!v.honroAct3Elite,role:v.honroEncounterRole}));rounds.push(row);console.log('ROUND',JSON.stringify(row));await save('checkpoint');if(b.round===1)await save('entry-checkpoint');if(b.round===27)await save('browser-checkpoint');if((process.env.HONRO_QA_EXTRA_CHECKPOINT_ROUNDS||'').split(',').map(Number).includes(b.round))await save('round-'+b.round);if(b.round>limit){stopReason='diagnostic round observation bound';break;}}
 for(let n=0;n<60&&ready();n++)tick();if(!ready())continue;if(interact())continue;
 let u=e.active;const n=npc(),cur=goal();if(!u){stopReason='no active actor';break;}
 if(advanceOpenEscort(u,n,cur)){if(!ready())continue;if(interact())continue;}
 let foes=e.alive(1).filter(v=>!v.honroObjectiveTarget&&(g.HonroAct3.visible?.(b,v)??true));
 const currentFront=v=>!V.mem(b).carrierStarted||v.x>=n.x-550;
 const rear=foes.filter(v=>!currentFront(v));if(rear.length)record({op:'leave-rear-foes',hero:u.cls,npcX:n.x,ids:rear.map(v=>v.id),heroPosition:{x:u.x,y:u.y}});foes=foes.filter(currentFront);
 const priority=v=>dist(v,n)<600||v.x>=n.x-250&&v.x<n.x+900&&Math.abs(v.y-mainY(v.x))<270;
 foes.sort((a,z)=>Number(priority(z))-Number(priority(a))||dist(a,u)-dist(z,u));
 let fired=false;for(const t of foes.filter(v=>dist(v,u)<1400&&(priority(v)||dist(v,u)<500)).slice(0,3))if(fireAt(u,t)){fired=true;break;}if(fired)continue;
 const threat=foes.find(v=>priority(v)&&dist(v,u)<2500);
 if(threat)roadAdvance(u,threat.x,u.cls==='knight'?95:170);
 else if(cur?.id==='dispatch-bundle')roadAdvance(u,2390);
 else if(cur?.kind==='escort'){
  // Walk alongside the carrier with real ordinary movement and finite budgets.
  roadAdvance(u,Math.min(9150,n.x+190));
  for(let k=0;k<1700&&ready()&&n.moveLeft>2&&u.moveLeft>10&&goal()?.kind==='escort'&&!S.blocked(b);k++){
   if(Math.abs(u.y-mainY(u.x))>60||Math.abs(u.y-n.y)>210)break;
   if(u.x-n.x<180)ops.move(1,C.STEP);tick();
  }
 }else if(!cur){for(let k=0;k<600&&ready()&&!terminal();k++)tick();}
 if(!ready())continue;if(interact())continue;
 foes=e.alive(1).filter(v=>!v.honroObjectiveTarget&&(g.HonroAct3.visible?.(b,v)??true)&&currentFront(v)).sort((a,z)=>Number(priority(z))-Number(priority(a))||dist(a,u)-dist(z,u));
 for(const t of foes.filter(v=>dist(v,u)<1400&&(priority(v)||dist(v,u)<550)).slice(0,3))if(fireAt(u,t)){fired=true;break;}if(fired)continue;
 // A fixed ranged stand-off can leave a blocked angle despite unused movement.
 // After the ordinary aim attempts fail, take one closer legal approach only
 // to this nearby same-height road threat; then retry its real equipped shots.
 if(threat&&u.cls!=='knight'&&Math.abs(threat.x-u.x)>96&&Math.abs(threat.x-u.x)<=190&&Math.abs(threat.y-u.y)<220&&u.moveLeft>20){
  record({op:'closer-angle-approach',hero:u.cls,target:threat.id,from:{x:u.x,y:u.y},targetPoint:{x:threat.x,y:threat.y}});roadAdvance(u,threat.x,95);
  if(!ready())continue;if(fireAt(u,threat))continue;
 }
 if(obstructionAdvance(u,threat)){if(!ready())continue;if(fireAt(u,threat))continue;}
 record({op:'defend',hero:u.cls,npcX:n.x,npcMove:n.moveLeft,heroMove:u.moveLeft,blocked:S.blocked(b)});audit.production(()=>ops.defend());
}
if(!terminal()&&!stopReason)stopReason='diagnostic action observation bound';await save('final');
const result={provenance,scoringAudit,phase:b.phase,round:b.round,stopReason,wallSeconds:(performance.now()-started)/1000,frames:ops.frames,storyFrameCount,actions:actions.length,remaining:e.alive(1).length,combatFires,combatFireScope:'Accepted live Engine.fire calls only; passive/autonomous effects may not be casts. Actual damage sources are separately logged.',npc:plain(npc()),heroes:e.heroesAlive().map(u=>({id:u.id,hp:u.hp,maxHp:u.maxHp,x:u.x,y:u.y})),done:plain(V.mem(b).done),reviewed:plain(R.memory(b)),audit:{externalWrites:audit.log.externalWrites,recoveries:audit.log.recoveries,movementCalls},events,preview:preview.stats()};
if(b.phase==='won'){
 const rewards=p=>plain({clear:p.cleared[23],heroes:p.heroes,equipment:p.equipment,growth:p.honroGrowth}),earned=rewards(app.profile),budget=earned.growth.stages[23].contribution;
 assert.equal(budget.total,31548);assert.equal(budget.combatLimit,12620);assert.equal(budget.spent+budget.forfeited,budget.total);
 app.resultContinue();for(let k=0;k<3000&&app.dialogue;k++)ops.frame();assert.equal(app.screen,'rest');assert.equal(app.engine,null,'No Stage24 battle');assert.deepEqual(rewards(app.profile),earned);
 app.export();const settled=await h.exported(),restored=h.load(settled);restored.continue();assert.equal(restored.screen,'rest');assert.equal(restored.engine,null);assert.deepEqual(rewards(restored.profile),earned);assert.equal(restored.profile.cleared[23].visits,1);
 result.settlement={restReached:true,reloadExact:true,visits:1,partyXpBudget:budget.total,combatXpBudget:budget.combatLimit,stage24Battle:false};
}
await writeFile(out+'/result.json',JSON.stringify(result,null,2));console.log('RESULT',JSON.stringify({...result,npc:result.npc.x,reviewed:undefined,provenance:undefined,events:undefined}));if(b.phase!=='won')process.exitCode=1;
