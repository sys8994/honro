/** One fixed representative escort policy. Actual App/Engine inputs and saves;
 * prior rewards are a legal ledger fixture. DOM/render/storage/clock are doubles. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {runtimeParts} from '../shared/build.mjs';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {escortEntryProfile,ESCORT_ENTRY} from './stage23-escort-entry-helper.mjs';
import {navigator,analyzeWaits,representativeTargets,representativeMelee,representativeBladePrediction} from './stage18-bell-fullplay-helper.mjs';
import {auditQuarryEngine} from './stage12-quarry-fullplay-helper.mjs';
import {authorStage23LoadingYard,mainY,mainSupport,yardY} from '../tools/map-forge/stage23-loading-yard.mjs';
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex'),h=await appHarness(),{g,C}=h;
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const out=process.env.HONRO_FULLPLAY_OUT||'_local/reports/stage23-escort/fullplay';await mkdir(out,{recursive:true});
const rosterMode=process.env.HONRO_FULLPLAY_ROSTER||'canonical',policy='escort-high-cover-v2',basicOnly=process.env.HONRO_FULLPLAY_BASIC_ONLY==='1',representativeAttacks=!basicOnly,reflectionStudy=false,buildMode='conservative-rank1';
assert(['canonical','originalBudget22e5','candidate28e6'].includes(rosterMode));const canonical=plain(g.HONRO_PROJECT.stages[22]);
if(rosterMode!=='canonical'){g.HONRO_PROJECT=await authorStage23LoadingYard(g,plain(g.HONRO_PROJECT),{roster:rosterMode});for(const key of ['terrains','markers','width','height','elements'])assert.deepEqual(plain(g.HONRO_PROJECT.stages[22][key]),canonical[key],'Same geometry/art/markers in population comparison');}
const stage=g.HONRO_PROJECT.stages[22],budget={initial:stage.units.filter(u=>u.team==='enemy').length,elites:stage.units.filter(u=>u.team==='enemy'&&u.stageOverrides?.honroAct3Elite).length},fixture=escortEntryProfile(g),readiness=fixture.readiness,training=fixture.training;
const parts=await runtimeParts({vector:false,render:false}),runtimeSha256=hash(parts.join('\n')),sourceHash=hash(g.HONRO_PROJECT),provenance={policy,rosterMode,budget,basicOnly,sourceHash,runtimeSha256,controllerSha256:hash(await readFile(new URL(import.meta.url),'utf8')),entrySha256:hash(await readFile('tests/stage23-escort-entry-helper.mjs')),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()};
const resumePath=process.env.HONRO_FULLPLAY_CONTINUE,resume=resumePath?JSON.parse(await readFile(resumePath,'utf8')):null;if(resume){assert.equal(resume.sourceHash,sourceHash);assert.equal(resume.runtimeSha256,runtimeSha256);assert.equal(resume.provenance.policy,policy);}
let virtualMs=resume?.virtualMs||0;g.performance={now:()=>virtualMs};let app=h.load(resume?.profile||{...plain(g.AppRegression.fresh()),...plain(fixture.profile)});if(resume)app.continue();else app.launch(23);let e=app.engine,b=e.b,A=g.HonroAct3,S=g.HonroStage23Escort;
assert(S.active(b));assert.equal(b.seed,ESCORT_ENTRY.seed);assert.equal(b.difficulty,'normal');const initial=resume?.initial||plain({battle:b,profile:app.profile});
const actions=resume?.actions||[],rounds=resume?.rounds||[],turns=resume?.turns||[],damage=resume?.damage||[],births=resume?.births||[],continues=resume?.continues||[],notices=resume?.notices||[],resources=resume?.resources||[],enemyActions=resume?.enemyActions||[],npcTrace=resume?.npcTrace||[],shots=resume?.shots||[];
const shotAttempts=new Map(resume?.shotAttempts||[]),routeStates=new Map(resume?.routeStates||[]),basic={archer:'A01',mage:'M01',knight:'S00',occultist:'O01'};
let frames=resume?.frames||0,storyFrames=resume?.storyFrames||0,attackPlanningMs=resume?.attackPlanningMs||0,nativePhysicsMs=resume?.nativePhysicsMs||0,lastSerial=-1,lastRound=0,stopReason=null,nav,liveAudit;
const distance=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y),terminal=()=>['won','lost'].includes(b.phase),ready=()=>app.canInput(),heroRows=()=>e.heroesAlive().map(u=>({id:u.id,cls:u.cls,x:u.x,y:u.y,hp:u.hp,maxHp:u.maxHp,focus:u.focus,moveLeft:u.moveLeft,acted:u.acted})),carrier=()=>e.unit('act3-carrier');
const record=row=>actions.push({round:b.round,frame:frames,turn:b.honroState.actorTurnSerial,objective:A.current(b)?.id,...plain(row)}),known=new Set(b.units.map(u=>u.id)),savedLabels=new Set(continues.map(r=>r.label));
function instrument(){
 const event=app.event.bind(app);app.event=text=>{notices.push({round:b.round,frame:frames,text});return event(text);};
 const hurt=e.hurt.bind(e);e.hurt=function(u,...args){const hp=u.hp,side=u.side,out=hurt(u,...args);if(hp>u.hp)damage.push({round:b.round,frame:frames,turn:b.honroState.actorTurnSerial,target:u.id,side,sideAfter:u.side,owner:args[1],amount:hp-u.hp,remaining:u.hp,dead:u.dead,skill:args[6]||args[3]?.skill,shot:args[3]?.shot,x:u.x,y:u.y});return out;};
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){const u=e.active,acted=u?.acted,out=finish(...args);if(u?.side===1&&!acted&&u.acted)enemyActions.push({round:b.round,frame:frames,id:u.id,cell:u.honroEscortYardActivationCell,x:u.x,y:u.y,intent:u.intent});return out;};
 const fire=e.fire.bind(e);e.fire=function(skill,angle,power,...args){const u=e.active,focus=u?.focus,out=fire(skill,angle,power,...args);if(out&&u?.side===0&&!u.summoned){assert(u.loadout.includes(skill));if(basicOnly)assert.equal(skill,basic[u.cls]);resources.push({round:b.round,frame:frames,hero:u.cls,skill,before:focus,after:u.focus,cost:focus-u.focus});}return out;};
 nav=navigator(g,b,e,{tick,ready,record,stageId:23,routes:stage.design.escortYard.routes});liveAudit=auditQuarryEngine(b,e,()=>({round:b.round,frame:frames,turn:b.honroState.actorTurnSerial}),{previous:liveAudit?.log||resume?.liveAudit});
}
function story(){if(app.dialogue){liveAudit.production(()=>g.HonroStory.next(app));virtualMs+=C.STEP*1000;storyFrames++;return true;}if(['aim','enemy','ally','summon'].includes(b.phase))g.HonroStory.turn(app);if(g.HonroStory.turnPaused(app)){virtualMs+=C.STEP*1000;storyFrames++;return true;}return false;}
function tick(){const start=performance.now(),npc=carrier(),before=npc&&{x:npc.x,y:npc.y};virtualMs+=C.STEP*1000;e.tick(C.STEP);if(!app.dialogue)liveAudit.production(()=>app.missionTick(C.STEP));liveAudit.guard();frames++;if(b.side===1)assert(b.queue.length<=3);if(npc&&before&&(Math.abs(npc.x-before.x)>0||Math.abs(npc.y-before.y)>0))npcTrace.push({round:b.round,frame:frames,from:before,to:{x:npc.x,y:npc.y},distance:distance(before,npc),side:b.side,active:b.active,heroLead:e.heroesAlive().filter(u=>A.sameFloor(u,npc,950)&&u.x-npc.x>65).map(u=>u.id)});for(const u of b.units)if(!known.has(u.id)){known.add(u.id);births.push({round:b.round,frame:frames,turn:b.honroState.actorTurnSerial,id:u.id,source:u.honroSpawnSource,x:u.x,y:u.y,elite:!!u.elite});}const serial=b.honroState.actorTurnSerial||0;if(serial!==lastSerial){lastSerial=serial;turns.push({round:b.round,frame:frames,turn:serial,phase:b.phase,active:b.active,activeSide:e.active?.side,enemyCount:e.alive(1).length,heroes:heroRows(),npc:npc&&{x:npc.x,y:npc.y,hp:npc.hp},goal:A.current(b)?.id,cargo:S.memory(b).status});}nativePhysicsMs+=performance.now()-start;}
const kept=b=>plain(Object.fromEntries(['units','terrain','honroWorldTerrain','items','round','phase','side','active','honroState','honroGrowth','honroMarkers','honroEvents','honroAct3Steps','honroStory','honroStaging','queue','teamEnds','honroEscortYardSpec'].map(k=>[k,b[k]])));
instrument();
async function save(label='checkpoint'){app.export();const profile=await h.exported();assert.deepEqual(profile.honroBattle.units,plain(b.units));const data={provenance,sourceHash,runtimeSha256,initial,profile,actions,rounds,turns,damage,births,continues,notices,resources,enemyActions,npcTrace,shots,shotAttempts:[...shotAttempts],routeStates:[...routeStates],frames,storyFrames,attackPlanningMs,nativePhysicsMs,virtualMs,liveAudit:liveAudit.log};await writeFile(`${out}/${label}.json`,JSON.stringify(data));return data;}
async function continueNow(label){const data=await save(label),before=kept(b);app=h.load(data.profile);app.continue();e=app.engine;b=e.b;assert.deepEqual(kept(b),before,'Exact actual Continue '+label);continues.push({label,round:b.round,frame:frames,exact:true});savedLabels.add(label);instrument();}
const missedAtPose=(u,target)=>{const last=shotAttempts.get(u.id+':'+target.id);return last&&target.hp>=last.hp&&(target.shield||0)>=last.shield&&distance(u,last.position)<120&&distance(target,last.targetPosition)<120&&(b.honroState.actorTurnSerial||0)>last.turn;};
const rememberShot=(u,target,skill=basic[u.cls])=>shotAttempts.set(u.id+':'+target.id,{hp:target.hp,shield:target.shield||0,position:{x:u.x,y:u.y},targetPosition:{x:target.x,y:target.y},skill,turn:b.honroState.actorTurnSerial||0});
function attack(u,target){const missed=missedAtPose(u,target);if(missed&&!representativeAttacks)return false;const begin=performance.now();try{
 const basicSkill=C.SKILLS[basic[u.cls]];
 let meleeChoice=null;
 if(basicSkill.martial&&basicSkill.branch==='sword'){
  meleeChoice=representativeMelee(g,e,u,target,'S00');
  if(representativeAttacks){const wide=representativeMelee(g,e,u,target,'S03');if(wide&&wide.predictedTargets.length>=2&&(!meleeChoice||wide.net>meleeChoice.net*1.2))meleeChoice={...wide,tacticalReason:'equipped broad sword sector reaches multiple bodies'};}
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
 if(representativeAttacks&&u.cls==='archer'){for(const id of ['A14','A11','A05']){const special=plan(C.SKILLS[id]);if(special&&(!chosen||special.net>chosen.net*1.18)){chosen=special;reason='equipped archer technique has the stronger safe predicted shot';}}}
 if(representativeAttacks&&u.cls==='mage'){
  const radius=260+10*((u.ranks.M04||1)-1),cluster=e.alive(1).filter(t=>distance(t,target)<radius*2+80).length;
  if(cluster>=2){const area=plan(C.SKILLS.M04,{multiple:true});if(area&&(!chosen||area.net>chosen.net*1.2)){chosen=area;reason='equipped area reaches multiple bodies';}}
  if(!chosen||reflectionStudy){const reflected=plan(C.SKILLS.M11,{reflect:true});if(reflected&&(!chosen||reflected.net>chosen.net*1.1)){chosen=reflected;reason='equipped actual-reflection line is safely predicted to improve the shot';}}
 }
 if(representativeAttacks&&u.cls==='occultist'){
  const supportUseful=(target.honroSpirit||target.spiritHidden||['balanced','conservative-rank1'].includes(buildMode)&&target.hp>e.effective(C.SKILLS.O01,u).damage*2)&&(!target.manifested||target.manifestedUntil<=b.round)&&!target.revealSpiritToParty&&e.heroesAlive().some(v=>v.id!==u.id&&distance(v,target)<1500);
  if(supportUseful){const support=plan(C.SKILLS.O08);if(support){chosen=support;reason='equipped manifestation for nearby companions';}}
  if(!chosen){chosen=plan(C.SKILLS.O04);reason='equipped terrain phase after basic line is blocked';}
 }
 if(chosen&&e.fire(chosen.skill,chosen.angle,chosen.power)){rememberShot(u,target,chosen.skill);record({op:'fire',hero:u.cls,skill:chosen.skill,target:target.id,hpBefore:target.hp,angle:chosen.angle,power:chosen.power,from:{x:u.x,y:u.y},tacticalReason:reason,predictedTargets:chosen.predictedTargets,shot:b.shot,support:nav.surface(u),predictedEnemyDamage:chosen.predictedEnemyDamage,predictedFriendlyDamage:chosen.predictedFriendlyDamage,predictionMethod:chosen.predictionMethod,predictedHit:chosen.predictedHit,predictedReflections:chosen.reflections});return true;}return false;
 }finally{attackPlanningMs+=performance.now()-begin;}}

// Sequential authored high loops preserve the actual retreat route rather
// than let a graph opportunistically drop a scout through a different floor.
function highRoute(u,id){const r=stage.design.escortYard.routes.find(r=>r.id===id),key=u.id+':'+id,state=routeStates.get(key)||{index:0};routeStates.set(key,state);
 for(let n=0;n<r.anchors.length+2&&ready()&&u.moveLeft>8;n++){const p=r.anchors[state.index];if(!p)return true;const reached=()=>Math.abs(u.x-p.x)<20&&Math.abs(u.y-p.y)<55&&e.grounded(u);if(!reached())nav.advance(u,{id:key+'-'+state.index,x:p.x,y:p.y});if(!ready()||!reached())return false;const z=p.jumpTo||p.dropTo;if(z){const jump=!!p.jumpTo,from={x:u.x,y:u.y};if(jump&&(u.moveLeft<e.jumpCost(u)+Math.abs(z.x-u.x)+65||!e.jump(u)))return false;record({op:jump?'jump':'drop',hero:u.cls,from,to:z,reason:id});let departed=jump||z.stepOffX===undefined;for(let i=0;i<(jump?240:600)&&ready();i++){const x=departed?z.x:z.stepOffX;if(Math.abs(u.x-x)>3)e.move(Math.sign(x-u.x)*(z.speed||(jump?.35:.8)),C.STEP);tick();if(!departed&&Math.abs(u.x-z.stepOffX)<8&&u.y>from.y+8)departed=true;if(i>30&&e.grounded(u)&&(jump||nav.surface(u)===z.support&&Math.abs(u.x-z.x)<22))break;}const matched=nav.surface(u)===z.support;record({op:matched?'land':'nav-replan',hero:u.cls,route:id,support:nav.surface(u),expected:z.support,matched,x:u.x,y:u.y});nav.clear(u.id);if(!matched)return false;}state.index++;}return state.index>=r.anchors.length;}
function lowPoint(x,id='lower-station'){x=Math.max(100,Math.min(9300,x));return{id,x,y:mainY(x),surfaceId:mainSupport(x)};}
function escortWalk(u,goalX){const npc=carrier(),from={x:u.x,y:u.y},cost=u.moveLeft;let still=0;for(let i=0;i<2200&&ready()&&u.moveLeft>12&&u.x<goalX-15;i++){
 const lead=u.x-npc.x,dy=Math.abs(u.y-npc.y),old=u.x;if(lead<180&&dy<137||u.x<npc.x+95)e.move(1,C.STEP);tick();if(Math.abs(u.x-old)<.01&&Math.abs(npc.x-u.x)>185)still++;else still=0;if(still>160)break;
 }record({op:'move',hero:u.cls,from,to:{x:u.x,y:u.y},goal:{id:'continuous-escort',x:goalX,y:mainY(goalX)},support:nav.surface(u),movementCost:cost-u.moveLeft,npc:{x:npc.x,y:npc.y}});nav.clear(u.id);}
await writeFile(`${out}/initial.json`,JSON.stringify({provenance,initial,training,readiness},null,2));
const started=performance.now(),actionLimit=Number(process.env.HONRO_FULLPLAY_ACTION_LIMIT||1200),roundLimit=Number(process.env.HONRO_FULLPLAY_ROUND_LIMIT||120);let lastSignature='',stalled=0;
for(let turn=0;turn<actionLimit&&!terminal();turn++){
 while(!ready()&&!terminal()){if(story())continue;tick();if(frames>1400000){stopReason='engine frame observation limit';break;}}if(stopReason||terminal())break;
 if(['warned','waiting'].includes(S.memory(b).status)&&!savedLabels.has('cargo-warning'))await continueNow('cargo-warning');if(A.memory(b).done['dock-mid']&&!savedLabels.has('dock-mid'))await continueNow('dock-mid');
 if(lastRound!==b.round){lastRound=b.round;const row={round:b.round,goal:A.current(b)?.id,heroes:heroRows(),npc:plain(carrier()),enemies:e.alive(1).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,cell:u.honroEscortYardActivationCell})),cargo:S.memory(b).status};rounds.push(row);console.log('ROUND',JSON.stringify({...row,npc:{x:row.npc.x,y:row.npc.y,hp:row.npc.hp},enemies:row.enemies.length}));await save('round-'+b.round);await save();const sig=JSON.stringify([row.goal,Math.round(carrier().x/30),row.enemies.map(u=>[u.id,Math.round(u.hp)]),row.heroes.map(u=>[u.id,Math.round(u.x/40),Math.round(u.y/40)])]);stalled=sig===lastSignature?stalled+1:0;lastSignature=sig;if(stalled>=8){stopReason='fixed policy unchanged eight rounds';break;}if(b.round>roundLimit){stopReason='round observation limit';break;}}
 let goal=A.current(b),m=b.honroMarkers.find(x=>x.id===goal?.id);if(goal?.kind==='escort'){const knight=e.heroesAlive().find(u=>u.cls==='knight'&&!u.acted);if(knight&&e.active?.id!==knight.id){e.select(knight.id);record({op:'select',hero:'knight',reason:'low escort front before support actions'});}}
 let u=e.active;if(!u||u.dead){stopReason='no active living hero';break;}const npc=carrier(),high=['archer','mage'].includes(u.cls),upperThreats=e.alive(1).filter(v=>v.honroEncounterSupport==='sy-west-upper'||v.honroEscortYardEntry==='west-upper'),eastThreats=e.alive(1).filter(v=>v.honroEncounterSupport==='sy-east-upper');
 const interact=()=>m?.action&&g.HonroInteractions.eligibility(app,m).ok&&liveAudit.production(()=>g.HonroInteractions.use(app,m));
 // Start the carrier when the actual interaction is safe. High support is a
 // parallel choice, never a fabricated prerequisite or an idle escort wait.
 if(interact()){record({op:'E',hero:u.cls,target:m.id});continue;}
 const foes=e.alive(1).filter(v=>!v.dead).sort((a,z)=>Number(A.sameFloor(z,npc,350))-Number(A.sameFloor(a,npc,350))||distance(a,u)-distance(z,u));let fired=false;
 for(const target of foes.filter(v=>distance(v,u)<1550).slice(0,4))if(attack(u,target)){fired=true;break;}if(fired)continue;
 let destination=null,enemy=false;
 if(goal?.id==='dispatch-bundle')destination=m;
 else if(high&&upperThreats.length&&npc.x<5750){highRoute(u,'west-upper-approach');}
 else if(high&&nav.surface(u)==='sy-west-upper'){highRoute(u,'D-E-return');}
 else if(high&&goal?.id==='dock-exit'&&eastThreats.length){highRoute(u,'E-F-approach');}
 else if(high&&nav.surface(u)==='sy-east-upper'){highRoute(u,'F-G-return');}
 else if(goal?.id==='carrier-start')destination=lowPoint(u.cls==='knight'?2440:u.cls==='occultist'?2200:2600,'carrier-cover');
 else if(goal?.kind==='escort'){
  const front=foes.filter(v=>Math.abs(v.y-mainY(v.x))<170&&v.x>=npc.x-350&&v.x<npc.x+900).sort((a,z)=>a.x-z.x)[0];
  if(u.cls==='knight'&&front){destination={...front,approachRange:90};enemy=true;}
  else if(u.cls==='knight'&&Math.abs(u.y-mainY(u.x))<40){escortWalk(u,Math.min(m.x,npc.x+1650));}
  else destination=lowPoint(Math.min(m.x,npc.x+(u.cls==='occultist'?125:300)), 'escort-support-'+u.cls);
 }
 if(destination&&ready())nav.advance(u,destination,enemy);if(!ready())continue;
 goal=A.current(b);m=b.honroMarkers.find(x=>x.id===goal?.id);if(interact()){record({op:'E',hero:u.cls,target:m.id});continue;}
 for(const target of foes.filter(v=>!v.dead&&distance(v,u)<1700).slice(0,5))if(attack(u,target)){fired=true;break;}
 if(!fired){const before={hp:u.hp,focus:u.focus};record({op:'defend',hero:u.cls,reason:'no-safe-shot-after-role-position'});liveAudit.production(()=>app.defend());resources.push({round:b.round,frame:frames,hero:u.cls,op:'defend',before,after:{hp:u.hp,focus:u.focus}});}
}
if(!terminal()&&!stopReason)stopReason='action observation limit';const beforeReward=plain({heroes:b.heroes,resources:heroRows(),growth:b.honroGrowth});if(terminal()){for(let i=0;app.dialogue&&i<300;i++)story();liveAudit.production(()=>app.outcome());for(let i=0;app.dialogue&&i<300;i++)story();}else await save();
const summary=analyzeWaits(actions,b.round,{rounds,turns,damage,births,notices,continues,resources,frames,step:C.STEP}),mem=S.memory(b),a=A.memory(b);assert.equal(liveAudit.log.externalWrites.length,0);assert.equal(liveAudit.log.recoveries.length,0);assert.deepEqual(plain(b.items),initial.battle.items);
const result={...provenance,phase:b.phase,round:b.round,stopReason,wallSeconds:(performance.now()-started)/1000,simulationSeconds:frames*C.STEP,storyFrames,attackPlanningMs,nativePhysicsMs,frames,done:plain(a.done),allFourSurvived:e.heroesAlive().length===4,heroes:heroRows(),npc:plain(carrier()),cargo:plain(mem),initialEnemies:budget.initial,initialElites:budget.elites,totalEnemies:b.units.filter(u=>u.side===1).length,remainingEnemies:e.alive(1).length,births,continues,damageTaken:damage.filter(d=>d.side===0).reduce((n,d)=>n+d.amount,0),npcDamage:damage.filter(d=>d.target==='act3-carrier').reduce((n,d)=>n+d.amount,0),liveAudit:liveAudit.log,npcDistance:npcTrace.reduce((n,r)=>n+r.distance,0),limits:['Actual first-clear/recruit reward fixture through22, not normal22 exported victory.','Native production inputs; DOM/render/storage/clock are doubles. Not browser or human play timing.','One fixed policy and legal rank1/stat6/four-slot profile; no consumables, live writes or recovery calls.']};
await writeFile(`${out}/result.json`,JSON.stringify(result,null,2));await writeFile(`${out}/wait-analysis.json`,JSON.stringify(summary,null,2));await writeFile(`${out}/trace.json`,JSON.stringify({actions,rounds,turns,damage,births,continues,notices,resources,enemyActions,npcTrace,liveAudit:liveAudit.log},null,2));await writeFile(`${out}/final-battle.json`,JSON.stringify(b));if(b.phase==='won'){app.export();await writeFile(`${out}/victory-profile.json`,JSON.stringify({profile:await h.exported(),beforeReward,provenance}));assert.deepEqual(Object.keys(a.done),['dispatch-bundle','carrier-start','dock-mid','dock-exit']);assert(carrier().hp>0);assert.equal(b.enemyLimit,3);assert(app.done&&app.profile.cleared[23]);}
console.log('RESULT',JSON.stringify({...result,liveAudit:undefined,npc:undefined,cargo:mem.status}));if(b.phase!=='won')process.exitCode=1;
