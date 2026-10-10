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
import {analyzeWaits,representativeTargets,representativeMelee,representativeBladePrediction} from './stage18-bell-fullplay-helper.mjs';
import {escortNavigator} from './stage23-escort-fullplay-helper.mjs';
import {auditQuarryEngine} from './stage12-quarry-fullplay-helper.mjs';
import {authorStage23LoadingYard,mainY,mainSupport,yardY} from '../tools/map-forge/stage23-loading-yard.mjs';
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex'),h=await appHarness(),{g,C}=h;
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const out=process.env.HONRO_CARGO_BRANCH_OUT||'_local/reports/stage23-escort/cargo-real-branch';await mkdir(out,{recursive:true});
const rosterMode='candidate28e6',policy='escort-real-cargo-branch-v1',roleRoute=process.env.HONRO_FULLPLAY_ROUTE||'high',basicOnly=process.env.HONRO_FULLPLAY_BASIC_ONLY==='1',representativeAttacks=!basicOnly,reflectionStudy=false,buildMode='conservative-rank1';
const fixture=escortEntryProfile(g),readiness=fixture.readiness,training=fixture.training;let stage=g.HONRO_PROJECT.stages[22],budget={initial:28,elites:6};
const parts=await runtimeParts({vector:false,render:false}),runtimeSha256=hash(parts.join('\n')),sourceHash=hash(g.HONRO_PROJECT),provenance={policy,roleRoute,rosterMode,budget,basicOnly,sourceHash,runtimeSha256,controllerSha256:hash(await readFile(new URL(import.meta.url),'utf8')),navigatorSha256:hash(await readFile('tests/stage23-escort-fullplay-helper.mjs')),entrySha256:hash(await readFile('tests/stage23-escort-entry-helper.mjs')),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()};
const resumePath=process.env.HONRO_CARGO_BRANCH_SAVE||'tests/fixtures/stage23-escort-real-cargo-waiting.json',sourceBytes=await readFile(resumePath,'utf8'),baseSave=JSON.parse(sourceBytes);assert.equal(baseSave.provenance.sourceCommit,'371bd0ce2524df41017f998fa20feefa7934dc98');assert.deepEqual(baseSave.provenance.budget,budget);assert.equal(baseSave.profile.honroBattle.honroState.escortYard.status,'waiting');provenance.branchSource={path:resumePath,sha256:hash(sourceBytes),provenance:baseSave.provenance};const resume={profile:baseSave.profile,virtualMs:baseSave.virtualMs};
let virtualMs=resume?.virtualMs||0;g.performance={now:()=>virtualMs};let app=h.load(resume?.profile||{...plain(g.AppRegression.fresh()),...plain(fixture.profile)});if(resume)app.continue();else app.launch(23);let e=app.engine,b=e.b,A=g.HonroAct3,S=g.HonroStage23Escort;if(resume)assert.deepEqual(plain(b),resume.profile.honroBattle,'Whole-battle exact external process resume');
stage={...stage,design:plain(b.honroMap)};assert(S.active(b));assert.equal(b.seed,ESCORT_ENTRY.seed);assert.equal(b.difficulty,'normal');const initial=resume?.initial||plain({battle:b,profile:app.profile});
const actions=resume?.actions||[],rounds=resume?.rounds||[],turns=resume?.turns||[],damage=resume?.damage||[],births=resume?.births||[],continues=resume?.continues||[],notices=resume?.notices||[],resources=resume?.resources||[],enemyActions=resume?.enemyActions||[],npcTrace=resume?.npcTrace||[],shots=resume?.shots||[];
const shotAttempts=new Map(resume?.shotAttempts||[]),routeStates=new Map(resume?.routeStates||[]),roleStates=new Map(resume?.roleStates||[]),basic={archer:'A01',mage:'M01',knight:'S00',occultist:'O01'};
let frames=resume?.frames||0,storyFrames=resume?.storyFrames||0,attackPlanningMs=resume?.attackPlanningMs||0,nativePhysicsMs=resume?.nativePhysicsMs||0,lastSerial=-1,lastRound=0,stopReason=null,nav,liveAudit;
const distance=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y),terminal=()=>['won','lost'].includes(b.phase),ready=()=>app.canInput(),heroRows=()=>e.heroesAlive().map(u=>({id:u.id,cls:u.cls,x:u.x,y:u.y,hp:u.hp,maxHp:u.maxHp,focus:u.focus,moveLeft:u.moveLeft,acted:u.acted})),carrier=()=>e.unit('act3-carrier');
const record=row=>actions.push({round:b.round,frame:frames,turn:b.honroState.actorTurnSerial,objective:A.current(b)?.id,...plain(row)}),known=new Set(b.units.map(u=>u.id)),savedLabels=new Set(continues.map(r=>r.label));
function instrument(){
 const event=app.event.bind(app);app.event=text=>{notices.push({round:b.round,frame:frames,text});return event(text);};
 const hurt=e.hurt.bind(e);e.hurt=function(u,...args){const hp=u.hp,side=u.side,out=hurt(u,...args);if(hp>u.hp)damage.push({round:b.round,frame:frames,turn:b.honroState.actorTurnSerial,target:u.id,side,sideAfter:u.side,owner:args[1],amount:hp-u.hp,remaining:u.hp,dead:u.dead,skill:args[6]||args[3]?.skill,shot:args[3]?.shot,x:u.x,y:u.y});return out;};
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){const u=e.active,acted=u?.acted,out=finish(...args);if(u?.side===1&&!acted&&u.acted)enemyActions.push({round:b.round,frame:frames,id:u.id,cell:u.honroEscortYardActivationCell,x:u.x,y:u.y,intent:u.intent});return out;};
 const fire=e.fire.bind(e);e.fire=function(skill,angle,power,...args){const u=e.active,focus=u?.focus,out=fire(skill,angle,power,...args);if(out&&u?.side===0&&!u.summoned){assert(u.loadout.includes(skill));if(basicOnly)assert.equal(skill,basic[u.cls]);resources.push({round:b.round,frame:frames,hero:u.cls,skill,before:focus,after:u.focus,cost:focus-u.focus});}return out;};
 const navigationState=nav?.snapshot()||resume?.navigatorState;nav=escortNavigator(g,b,e,{tick,ready,record,stageId:23,routes:stage.design.escortYard.routes,navigationState});liveAudit=auditQuarryEngine(b,e,()=>({round:b.round,frame:frames,turn:b.honroState.actorTurnSerial}),{previous:liveAudit?.log||resume?.liveAudit});
}
function story(){if(app.dialogue){virtualMs+=C.STEP*1000;storyFrames++;if(S.memory(b).status==='sliding')liveAudit.production(()=>g.HonroStory.tick(app,virtualMs));else liveAudit.production(()=>g.HonroStory.next(app));return true;}if(['aim','enemy','ally','summon'].includes(b.phase))g.HonroStory.turn(app);if(g.HonroStory.turnPaused(app)){virtualMs+=C.STEP*1000;storyFrames++;return true;}return false;}
function tick(){const start=performance.now(),npc=carrier(),before=npc&&{x:npc.x,y:npc.y};const segments=b.projectiles.map(p=>({p,x:p.x,y:p.y}));virtualMs+=C.STEP*1000;e.tick(C.STEP);for(const a of segments)if(a.p.phaseMode==='terrain'){const hit=e.projectileCollision(a,{x:a.p.x,y:a.p.y},a.p.radius,a.p.owner,[],false,[],true);if(hit?.terrain&&!crossings.some(c=>c.shot===a.p.shot&&c.terrain===hit.terrain.id))crossings.push({round:b.round,frame:frames,shot:a.p.shot,owner:a.p.owner,terrain:hit.terrain.id,material:hit.terrain.mat,x:hit.x,y:hit.y});}if(!app.dialogue)liveAudit.production(()=>app.missionTick(C.STEP));liveAudit.guard();frames++;if(b.side===1)assert(b.queue.length<=3);if(npc&&before&&(Math.abs(npc.x-before.x)>0||Math.abs(npc.y-before.y)>0))npcTrace.push({round:b.round,frame:frames,from:before,to:{x:npc.x,y:npc.y},distance:distance(before,npc),side:b.side,active:b.active,heroLead:e.heroesAlive().filter(u=>A.sameFloor(u,npc,950)&&u.x-npc.x>65).map(u=>u.id)});for(const u of b.units)if(!known.has(u.id)){known.add(u.id);births.push({round:b.round,frame:frames,turn:b.honroState.actorTurnSerial,id:u.id,source:u.honroSpawnSource,x:u.x,y:u.y,elite:!!u.elite});}const serial=b.honroState.actorTurnSerial||0;if(serial!==lastSerial){lastSerial=serial;turns.push({round:b.round,frame:frames,turn:serial,phase:b.phase,active:b.active,activeSide:e.active?.side,enemyCount:e.alive(1).length,heroes:heroRows(),npc:npc&&{x:npc.x,y:npc.y,hp:npc.hp},goal:A.current(b)?.id,cargo:S.memory(b).status});}nativePhysicsMs+=performance.now()-start;}
const kept=b=>plain(b);
instrument();
async function save(label='checkpoint'){app.export();const profile=await h.exported();assert.deepEqual(profile.honroBattle.units,plain(b.units));const data={provenance,sourceHash,runtimeSha256,initial,profile,actions,rounds,turns,damage,births,continues,notices,resources,enemyActions,npcTrace,shots,shotAttempts:[...shotAttempts],routeStates:[...routeStates],roleStates:[...roleStates],navigatorState:nav.snapshot(),frames,storyFrames,attackPlanningMs,nativePhysicsMs,virtualMs,liveAudit:liveAudit.log};await writeFile(`${out}/${label}.json`,JSON.stringify(data));return data;}
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
 for(let n=0;n<r.anchors.length+3&&ready()&&u.moveLeft>8;n++){
  if(state.air){const a=state.air,z=a.to;let matched=false;
   for(let i=0;i<650&&ready();i++){
    const correct=e.grounded(u)&&nav.surface(u)===z.support;if(correct&&Math.abs(u.x-z.x)<22){matched=true;break;}
    // A drop can consume the rest of this turn. Keep its real lower landing
    // state until the next action instead of returning to the upper launch.
    if(u.moveLeft<=8&&e.grounded(u)&&correct)break;
    const x=a.departed?z.x:z.stepOffX;if(Math.abs(u.x-x)>3&&u.moveLeft>8)e.move(Math.sign(x-u.x)*(z.speed||(a.jump?.35:.8)),C.STEP);tick();a.frames++;
    if(!a.departed&&Math.abs(u.x-z.stepOffX)<8&&u.y>a.startY+8)a.departed=true;
    if(a.frames>30&&e.grounded(u)&&nav.surface(u)!==z.support&&(a.jump||a.departed)){record({op:'nav-replan',hero:u.cls,route:id,reason:'ordinary route crossing landed on another support',expected:z.support,support:nav.surface(u),x:u.x,y:u.y});delete state.air;nav.clear(u.id);return false;}
   }
   if(!matched)return false;record({op:'land',hero:u.cls,route:id,support:nav.surface(u),expected:z.support,matched:true,x:u.x,y:u.y});delete state.air;state.index++;nav.clear(u.id);continue;
  }
  const p=r.anchors[state.index];if(!p)return true;const reached=()=>Math.abs(u.x-p.x)<20&&Math.abs(u.y-p.y)<55&&e.grounded(u)&&nav.surface(u)===p.surfaceId;
  if(!reached())nav.advance(u,{id:key+'-'+state.index,x:p.x,y:p.y,surfaceId:p.surfaceId});if(!ready()||!reached())return false;
  const z=p.jumpTo||p.dropTo;if(!z){state.index++;continue;}const jump=!!p.jumpTo,from={x:u.x,y:u.y};if(jump&&(u.moveLeft<e.jumpCost(u)+Math.abs(z.x-u.x)+65||!e.jump(u)))return false;
  record({op:jump?'jump':'drop',hero:u.cls,from,to:z,reason:id});state.air={jump,to:plain(z),startY:u.y,departed:jump||z.stepOffX===undefined,frames:0};
 }return state.index>=r.anchors.length&&!state.air;
}
function lowPoint(x,id='lower-station'){x=Math.max(100,Math.min(9300,x));return{id,x,y:mainY(x),surfaceId:mainSupport(x)};}
function escortWalk(u,goalX){const npc=carrier(),from={x:u.x,y:u.y},cost=u.moveLeft;let still=0;for(let i=0;i<2200&&ready()&&u.moveLeft>12&&u.x<goalX-15;i++){
 const lead=u.x-npc.x,dy=Math.abs(u.y-npc.y),old=u.x;if(lead<180&&dy<137||u.x<npc.x+95)e.move(1,C.STEP);tick();if(Math.abs(u.x-old)<.01&&Math.abs(npc.x-u.x)>185)still++;else still=0;if(still>160)break;
 }record({op:'move',hero:u.cls,from,to:{x:u.x,y:u.y},goal:{id:'continuous-escort',x:goalX,y:mainY(goalX)},support:nav.surface(u),movementCost:cost-u.moveLeft,npc:{x:npc.x,y:npc.y}});nav.clear(u.id);}

// Bounded local tactical branch of the actual R8 waiting export. No live-world
// changes: leave the loading lane, shoot its real occupants, keep the carrier
// at the bridge, then use the opened upper line and the new low wood cover.
const contacts=[],crossings=[],cargoStates=[];let baselineShot=false,highShot=null,coverShot=null,coverControl=null,coverProofRound=null,lastCargo='',startRound=b.round;
function attachContacts(){const impact=e.impact.bind(e);e.impact=function(p,h){if(h?.terrain)contacts.push({round:b.round,frame:frames,owner:p.owner,skill:p.skill,shot:p.shot,terrain:h.terrain.id||h.terrain,material:h.terrain.mat,x:p.x,y:p.y});return impact(p,h);};}
attachContacts();const originalContinue=continueNow;async function exactContinue(label){await originalContinue(label);attachContacts();}
function fireNamed(u,target,id,extra={}){const s=C.SKILLS[id];if(!u.loadout.includes(id))return false;let chosen=null;const aims=e.shotSeeds(u,s,target);aims.push(e.bestShot(u,s,target));for(const aim of aims){if(e.manaCost(s,u,aim.power)>u.focus)continue;const v=C.shotViable(e,u,s,target,aim.angle,aim.power);if(v.risk<1&&v.ok&&v.enemyDamage>0&&(!extra.cargoBetween||C.shotViable(e,u,C.SKILLS.O01,target,aim.angle,aim.power).hit.terrain==='sy-cargo-settled')&&(!chosen||v.net>chosen.v.net))chosen={...aim,v};}if(!chosen)return false;const from={x:u.x,y:u.y},hp=target.hp;if(!e.fire(id,chosen.angle,chosen.power))return false;record({op:'fire',hero:u.cls,target:target.id,skill:id,shot:b.shot,from,hpBefore:hp,support:nav.surface(u),angle:chosen.angle,power:chosen.power,...extra});return b.shot;}
async function observeCargo(){const m=S.memory(b);if(m.status!==lastCargo){lastCargo=m.status;const row={round:b.round,frame:frames,status:m.status,blockers:plain(S.occupants(b)),reason:m.reason,commitCount:m.commitCount};cargoStates.push(row);console.log('CARGO',JSON.stringify(row));await save('cargo-'+m.status);if(m.status==='settled')await exactContinue('actual-settled');}if(m.status==='sliding'&&m.elapsed>=.35&&!savedLabels.has('actual-mid-slide'))await exactContinue('actual-mid-slide');}
await exactContinue('actual-waiting');const started=performance.now();let stopReasonBranch=null;
for(let turn=0;turn<120&&!terminal();turn++){
 while(!ready()&&!terminal()){await observeCargo();if(story())continue;tick();if(frames>160000){stopReasonBranch='bounded branch frame limit';break;}}await observeCargo();if(stopReasonBranch||terminal())break;
 if(b.round>startRound+24){stopReasonBranch='bounded branch round limit';break;}
 if(lastRound!==b.round){lastRound=b.round;await save('round-'+b.round);console.log('ROUND',b.round,'cargo',S.memory(b).status,'blockers',S.occupants(b).map(x=>x.id).join(','));}
 const u=e.active,m=S.memory(b),settled=m.status==='settled';let fired=false;
 if(u.cls==='archer'){
  if(!settled&&!baselineShot){baselineShot=true;const hp=e.unit('s23-F-3').hp;if(e.fire('A01',27.75,1))record({op:'fire',hero:u.cls,skill:'A01',target:'s23-F-3',shot:b.shot,from:{x:u.x,y:u.y},hpBefore:hp,proof:'before-cargo-upper-line'});continue;}
  nav.advance(u,{id:settled?'open-D':'clear-D-lane',x:settled?4440:4210,y:3650,surfaceId:'sy-west-upper'});

  if(ready()&&settled&&!highShot){highShot=fireNamed(u,e.unit('s23-F-3'),'A01',{proof:'after-cargo-upper-line'});fired=!!highShot;}
 }else if(u.cls==='mage'){highRoute(u,'D-E-return');}
 else if(u.cls==='knight'){nav.advance(u,lowPoint(5700,'hold-bridge-carrier'));}
 else if(u.cls==='occultist'){
  nav.advance(u,{id:'cargo-left-cover-station',x:3310,y:4905,surfaceId:'sy-central-flank'});
  if(ready()&&settled&&!coverShot){const target=e.unit('s23-B-2');if(target&&!target.dead){if(!coverControl){const aim=e.shotSeeds(u,C.SKILLS.O04,target).find(a=>{const phase=C.shotViable(e,u,C.SKILLS.O04,target,a.angle,a.power),v=C.shotViable(e,u,C.SKILLS.O01,target,a.angle,a.power);return phase.ok&&phase.risk<1&&v.hit.terrain==='sy-cargo-settled';});assert(aim,'A normal equipped-phase seed crosses new cover toward the live flank threat');const v=C.shotViable(e,u,C.SKILLS.O01,target,aim.angle,aim.power);if(e.fire('O01',aim.angle,aim.power)){coverControl=b.shot;record({op:'fire',hero:u.cls,skill:'O01',target:target.id,shot:b.shot,from:{x:u.x,y:u.y},proof:'settled-cover-blocks-basic-line',predictedTerrain:v.hit.terrain});fired=true;}}else{coverShot=fireNamed(u,target,'O04',{proof:'fire-from-new-low-cover-side',cargoBetween:u.x<3450&&target.x>3890});if(coverShot)coverProofRound=b.round;fired=!!coverShot;}}}
 }
 if(!ready()||fired)continue;
 const blockers=S.occupants(b).filter(x=>x.kind==='enemy').map(x=>e.unit(x.id)).filter(x=>x&&!x.dead);
 const targets=blockers.length?blockers:e.alive(1).filter(t=>distance(t,u)<420);
 for(const t of targets)if(attack(u,t)){fired=true;break;}
 if(!fired){record({op:'defend',hero:u.cls,reason:'hold-safe-escort-and-cargo-positions'});liveAudit.production(()=>app.defend());}
 if(highShot&&coverShot&&b.round>coverProofRound&&damage.some(d=>d.shot===highShot&&d.target==='s23-F-3')&&damage.some(d=>d.shot===coverShot&&d.side===1&&d.x>3890))break;
}
while(!ready()&&!terminal()&&frames<170000){await observeCargo();if(story())continue;tick();}await observeCargo();await save('branch-final');
const result={provenance,round:b.round,phase:b.phase,wallSeconds:(performance.now()-started)/1000,stopReason:stopReasonBranch,cargo:plain(S.memory(b)),cargoStates,highShot,coverShot,openedLineDamage:damage.filter(d=>d.shot===highShot&&d.target==='s23-F-3'),coverSideDamage:damage.filter(d=>d.shot===coverShot&&d.side===1&&d.x>3890),allFourSurvived:e.heroesAlive().length===4,npc:plain(carrier()),contacts,crossings,coverControl,actions,damage,continues,liveAudit:liveAudit.log,scope:'Actual waiting save branch. Ordinary inputs and enemy turns only. Not a full completion or browser run.'};
await writeFile(`${out}/result.json`,JSON.stringify(result,null,2));console.log('RESULT',JSON.stringify({round:b.round,cargo:S.memory(b).status,commitCount:S.memory(b).commitCount,highShot,coverShot,openedLineDamage:result.openedLineDamage,coverSideDamage:result.coverSideDamage,alive:result.allFourSurvived,stopReason:stopReasonBranch}));assert.equal(liveAudit.log.externalWrites.length,0);assert.equal(liveAudit.log.recoveries.length,0);assert.deepEqual(plain(b.items),initial.battle.items);assert.equal(S.memory(b).status,'settled');assert.equal(S.memory(b).commitCount,1);assert(result.openedLineDamage.length);assert(result.coverSideDamage.length);assert(crossings.some(c=>c.shot===coverShot&&c.terrain==='sy-cargo-settled'));assert(contacts.some(c=>c.shot===coverControl&&c.terrain==='sy-cargo-settled'));assert(carrier().hp>0);
