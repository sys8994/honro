/** Bounded state-reactive production App input experiments, not an optimal solver. */
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {createWriteStream} from 'node:fs';
import {createGzip,constants as zlibConstants} from 'node:zlib';
import {once} from 'node:events';
import {pipeline} from 'node:stream/promises';
import {controllerHash,checkFreeze,CONTROLLER_FILES} from './freeze.mjs';
import {CONTRACT,foesFor,movementGoal,previewAim,selectSkill,engagementDistance} from './policy.mjs';
import {EnemyActivity,acceptedDrop,hitObservation} from './activity.mjs';
import {adapter} from './adapter.mjs';
import {RouteFollower} from './navigation.mjs';
import {rng,summarize} from './stats.mjs';
const [stageText='31',policy='advance',seedText='1',out='_local/reports/quantitative-playtest',frameText='600',wallText='60']=process.argv.slice(2);
const stage=Number(stageText),seed=Number(seedText),maxFrames=Number(frameText),maxWallSeconds=Number(wallText);
const policies=['ranged-hold','advance','high-route','gimmick','companions'];
if(![5,31,34,39].includes(stage)||!policies.includes(policy)||!Number.isInteger(seed)||!Number.isInteger(maxFrames)||maxFrames<1||!Number.isFinite(maxWallSeconds)||maxWallSeconds<=0)throw Error('Usage: run.mjs 31|34|39|5 ranged-hold|advance|high-route|gimmick|companions seed output frames wallSeconds');
await mkdir(out,{recursive:true});const runId=randomUUID(),raw=createGzip();const rawDone=pipeline(raw,createWriteStream(`${out}/${runId}.jsonl.gz`,{flags:'wx'}));
const hash=createHash('sha256'),files=execFileSync('git',['ls-files','shared','game/config','game/src','game/engine','game/vendor','tools/quantitative-playtest','tools/stage31/app-adapter.mjs','tests/app-regression-helpers.mjs','tests/stage18-bell-fullplay-helper.mjs','game/tests/helpers.mjs'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
// Untracked new controller files are included too, before the first commit.
for(const file of new Set([...files,...CONTROLLER_FILES,'tools/quantitative-playtest/run.mjs','tools/quantitative-playtest/adapter.mjs','tools/quantitative-playtest/stats.mjs','tools/quantitative-playtest/policy.mjs','tools/quantitative-playtest/act4-adapter.mjs']))hash.update(file+'\0').update(await readFile(file));
const sourceHash=hash.digest('hex'),random=rng(seed),started=performance.now();let cancelled=false;process.on('SIGTERM',()=>{cancelled=true;});process.on('SIGINT',()=>{cancelled=true;});let frame=0,simSeconds=0,outcome='timeout',reason='frame budget',a,b,e,g,navigator,lastNavigation=null,charge=null,decision=null;
await writeFile(`${out}/${runId}.attempt.json`,JSON.stringify({runId,stage,policy,seed,sourceHash,maxFrames,maxWallSeconds,status:'started-not-finalized',note:'If no summary exists, process termination is an error/incomplete attempt, never a completed gameplay run.'},null,2));
const metrics={dropAttempts:0,dropAccepted:0,effectiveDrops:0,byHero:{},jumpAttempts:0,jumpAccepted:0,landings:0,elevatedSupportLandings:0,horizontalDistance:0,ascent:0,descent:0,totalUniqueEnemies:0,maxLivingEnemies:0,maxAwakeEnemies:0,maxActingEnemiesPerRound:0,engagedEnemyIds:[],enemyFirstDamageRound:{},enemyDeathRound:{},observedNetHeroHpLoss:0,observedNetHeroShieldLoss:0,focusSpent:0,focusRecovered:0,visitedSupports:[],altitudeMin:null,altitudeMax:null};
const engagedEnemies=new Set(),seenTransitions=new Set(),seenEnemies=new Set(),supports=new Set(),previous=new Map(),jumps=new Map(),enemyPositions=new Map(),activity=new EnemyActivity();
const emit=async(type,data={})=>{if(!raw.write(JSON.stringify({runId,frame,round:b?.round??null,type,...data})+'\n'))await once(raw,'drain');};
const flush=()=>new Promise((resolve,reject)=>raw.flush(zlibConstants.Z_SYNC_FLUSH,e=>e?reject(e):resolve()));
let lastInput=null;
async function recordInput(){const value=JSON.stringify({keys:[...a.app.keys],stick:{...a.app.stick},charging:a.app.charging,selected:a.app.selected,actor:e.active?.id});if(value!==lastInput){await emit('input-state',JSON.parse(value));lastInput=value;}}
const alive=u=>!u.dead&&u.hp>0;
function support(u){if(!e.grounded(u))return null;return e.surface(u.x,u.y-3,u.y+3)?.t?.id??null;}
async function observe(){
 const enemies=b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget);for(const u of enemies)seenEnemies.add(u.id);
 for(const u of enemies){const p=enemyPositions.get(u.id),moving=!!(u.aiMove||u.moveTarget!==undefined);if(p&&alive(u)&&(moving||p.moving)&&Math.hypot(u.x-p.x,u.y-p.y)>.01&&activity.executed(u,b.round,'movement'))await emit('enemy-activity',{actor:u.id,kind:'movement'});enemyPositions.set(u.id,{x:u.x,y:u.y,moving});}
 metrics.totalUniqueEnemies=seenEnemies.size;metrics.maxLivingEnemies=Math.max(metrics.maxLivingEnemies,enemies.filter(alive).length);metrics.maxAwakeEnemies=Math.max(metrics.maxAwakeEnemies,enemies.filter(u=>alive(u)&&u.awake).length);
 for(const u of b.units.filter(u=>u.side===0&&!u.summoned&&u.id===u.cls&&['archer','mage','knight','occultist'].includes(u.cls))){
  const s=support(u),p=previous.get(u.id),v={id:u.id,x:u.x,y:u.y,hp:u.hp,shield:u.shield||0,focus:u.focus,moveLeft:u.moveLeft,support:s,grounded:e.grounded(u)};
  if(p){metrics.horizontalDistance+=Math.abs(u.x-p.x);metrics.ascent+=Math.max(0,p.y-u.y);metrics.descent+=Math.max(0,u.y-p.y);metrics.observedNetHeroHpLoss+=Math.max(0,p.hp-u.hp);metrics.observedNetHeroShieldLoss+=Math.max(0,p.shield-v.shield);metrics.focusSpent+=Math.max(0,p.focus-u.focus);metrics.focusRecovered+=Math.max(0,u.focus-p.focus);
   if(!p.grounded&&v.grounded){metrics.landings++;const j=jumps.get(u.id);if(j&&s&&j.support&&s!==j.support&&Math.abs(u.y-j.y)>=u.h&&Math.hypot(j.x-j.goal.x,j.y-j.goal.y)-Math.hypot(u.x-j.goal.x,u.y-j.goal.y)>u.r&&!seenTransitions.has(u.id+':'+j.support+':'+s)){seenTransitions.add(u.id+':'+j.support+':'+s);const h=metrics.byHero[u.id]??={jump:0,drop:0};if(j.kind==='drop'){metrics.effectiveDrops++;h.drop++;}else{metrics.elevatedSupportLandings++;h.jump++;}}await emit('landing',{actor:u.id,fromJump:j??null,to:v,layerId:null});jumps.delete(u.id);}
  }
  if(s)supports.add(s);metrics.altitudeMin=metrics.altitudeMin===null?u.y:Math.min(metrics.altitudeMin,u.y);metrics.altitudeMax=metrics.altitudeMax===null?u.y:Math.max(metrics.altitudeMax,u.y);previous.set(u.id,v);
 }
 if(frame%CONTRACT.snapshotFrames===0){const memory={frame,...process.memoryUsage()};process.stderr.write(JSON.stringify({frameMemory:memory})+'\n');await emit('memory',memory);await emit('snapshot',{decision,routeIntention:lastNavigation,navigation:e.active?{actor:e.active.id,canInput:a.app.canInput(),canAct:e.canAct(),grounded:e.grounded(e.active),support:support(e.active),moveLeft:e.active.moveLeft,jumpCost:e.jumpCost(e.active),platformDrop:e.active.platformDrop??null,distanceToSelectedGoal:decision?.destination?Math.hypot(e.active.x-decision.destination.x,e.active.y-decision.destination.y):null}:null,residents:b.units.filter(u=>u.honroAct4Resident).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead,grounded:e.grounded(u)})),objective:b.honroAct4PreviewState,phase:b.phase,active:b.active,keys:[...a.app.keys],stick:{...a.app.stick},charging:a.app.charging,selected:a.app.selected,angle:e.active?.angle,simSeconds,heroes:[...previous.values()],enemies:enemies.filter(alive).map(u=>({id:u.id,x:u.x,y:u.y,awake:!!u.awake})),items:b.items});await flush();}
}
async function input(type,fn,detail={}){const value=fn();await emit('input',{op:type,...detail,returned:value??null});return value;}
try{
 const freeze=process.env.HONRO_HOLDOUT_MANIFEST?await checkFreeze(process.env.HONRO_HOLDOUT_MANIFEST,{stage,policy,seed,maxFrames,maxWallSeconds}):null;
 await emit('run-start',{stage,policy,seed,sourceHash,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),maxFrames,maxWallSeconds,controllerContract:CONTRACT,controllerHash:await controllerHash(),evaluation:freeze?{kind:'frozen-holdout',manifest:freeze}:{kind:'mechanics-calibration'},seedContract:'Policy RNG only; production battle seed untouched. Same seed repeated is not independent evidence.'});
 a=await adapter(stage);({g}=a);e=a.app.engine;b=e.b;navigator=new RouteFollower(g.HONRO_CORE);
 await emit('entry',{entryBuild:a.entryBuild,training:a.training,scope:a.scope,profile:Object.fromEntries(['revision','heroes','party','recruited','loadouts','equipment','settings','lastStage','cleared'].map(k=>[k,a.app.profile[k]])),officialIdentity:a.officialIdentity,setupMemory:a.setupMemory,battleSeed:b.seed,map:{width:b.width,height:b.height,aspectRatio:b.width/b.height,playBounds:b.honroPlayBounds??b.playBounds??{left:0,top:0,right:b.width,bottom:b.height}},initial:{phase:b.phase,round:b.round,side:b.side,units:b.units.map(u=>({id:u.id,cls:u.cls,side:u.side,x:u.x,y:u.y,hp:u.hp,maxHp:u.maxHp,focus:u.focus,loadout:u.loadout,level:u.level,attack:u.attack,armor:u.armor,ranks:u.ranks,equipment:u.equipment,facing:u.facing,honroPilotBudgetBasis:u.honroPilotBudgetBasis})),objective:b.honroAct4PreviewState}});await flush();
 // Passive wrappers preserve exact calls/return values. No prediction, cloned combat or live state writes.
 const tick=e.tick.bind(e);e.tick=(dt,...rest)=>{const result=tick(dt,...rest);simSeconds+=dt;return result;};
 const pending=[];
 const originalEmit=e.emit.bind(e);e.emit=(type,value,...rest)=>{if(type==='fx'&&Number.isFinite(value?.damage)&&value.targetId)pending.push({method:'damage-feedback',round:b.round,targetId:value.targetId,attackId:value.attackId,damage:value.damage,critical:value.critical});return originalEmit(type,value,...rest);};
 for(const method of ['drop','hurt','fire','enemyAction','finishAction','newRound']){const original=e[method].bind(e);e[method]=(...args)=>{const u=method==='hurt'?args[0]:e.active,before=u&&{id:u.id,side:u.side,x:u.x,y:u.y,hp:u.hp,shield:u.shield,focus:u.focus},round=b.round,hit=method==='hurt'?hitObservation(e,args):null; if(method==='enemyAction')activity.begin(u,round,b.units);if(method==='finishAction'&&activity.finish(u,round,b.units))pending.push({method:'enemy-activity',round,actor:u.id,kind:'observed-support-change'});const result=original(...args);if(method!=='enemyAction')pending.push({method,round,before,after:u&&{hp:u.hp,shield:u.shield,focus:u.focus},skill:method==='fire'?args[0]:null,angle:method==='fire'?args[1]:null,power:method==='fire'?args[2]:null,damage:method==='hurt'?args[1]:null,hit,owner:method==='hurt'?args[2]:null,accepted:typeof result==='boolean'?result:null});if(method==='hurt'&&u?.side===1&&before.hp>u.hp){const owner=e.unit(args[2]);if(owner?.side===0){engagedEnemies.add(u.id);metrics.enemyFirstDamageRound[u.id]??=round;}if(u.hp<=0)metrics.enemyDeathRound[u.id]??=round;}if(method==='fire'&&result===true&&activity.executed(u,round,'fire'))pending.push({method:'enemy-activity',round,actor:u.id,kind:'fire'});return result;};}
 await observe();let decisionAt=0;
 while(frame<maxFrames){
  if(cancelled){outcome='cancelled';reason='SIGINT/SIGTERM observation stop';break;}
  if(performance.now()-started>maxWallSeconds*1000){reason='wall execution budget';break;}
  if(b.round>CONTRACT.maxCombatRounds){outcome='round-limit';reason='combat round 20 exceeded';break;}
  if(a.success()){outcome='clear';reason='production objective won';break;}
  if(b.phase==='lost'){outcome='defeat';reason=b.winnerReason||'production lost';break;}
  const app=a.app,u=e.active;
  app.keys.clear();app.stick.x=0;app.stick.y=0;
  if(app.dialogue){await input('dialogue-next',()=>g.HonroStory.next(app));}
  else if(b.honroAct4PreviewState?.arrivalTour?.active){await input('skip-tour',()=>a.skip());}
  else if(app.modal.classList.contains('open')&&!app.done){await input('close-modal',()=>app.close());}
  else if(charge){if(!app.charging)charge=null;else if(a.now()>=charge.until){await input('release-charge',()=>app.releaseCharge());charge=null;decisionAt=frame+30;}}
  else if(app.canInput()&&u?.side===0){
   const view=g.HonroBounds.viewport(app.scene,app.scene.canvas.clientWidth,app.scene.canvas.clientHeight),foes=foesFor(b,u,stage,view,v=>g.HonroAct2?.visible?.(b,v)!==false);
   const marker=b.honroMarkers?.find(m=>g.HonroInteractions?.eligibility(app,m)?.ok);
   if(stage>=31&&g.HonroAct4TerrainPreview.interact(app,true)){await input('interact',()=>a.interact());decisionAt=frame+15;}
   else if(marker&&(policy==='gimmick'||!foes.length)){await input('interact',()=>g.HonroInteractions.use(app,marker),{marker:marker.id});decisionAt=frame+15;}
   else if(frame>=decisionAt){
    const target=foes[0],dist=target?Math.hypot(target.x-u.x,target.y-u.y):Infinity;
    const destination=movementGoal(b,u,target,stage,policy),goal=destination.x;decision={actor:u.id,targetId:target?.id??null,destination,view,visibleEnemyIds:foes.map(v=>v.id)};
    if(destination.kind==='objective-unavailable'){outcome='error';reason='Controller blocked: '+destination.reason;break;}
    const q=b.honroAct4PreviewState;
    if(q?.stabilizing?.actor===u.id||q?.releasing?.actor===u.id){a.tick();frame++;while(pending.length)await emit('engine-event',pending.shift());await recordInput();await observe();continue;}
    const id=selectSkill(e,u,g.HONRO_CORE.SKILLS,policy),desired=engagementDistance(policy,u,g.HONRO_CORE.SKILLS[id]);
    const move=u.moveLeft>20&&(dist>desired||!target||destination.kind==='high-route'||stage===39&&destination.kind!=='enemy');
    if(move||!e.grounded(u)){
     const intent=navigator.intention(e,u,destination,{range:destination.kind==='enemy'?desired*.85:24,approach:destination.kind!=='enemy'});lastNavigation={actor:u.id,kind:intent.kind,reason:intent.reason,step:intent.step,approachOnly:intent.approachOnly,plan:intent.plan?{status:intent.plan.status,cost:intent.plan.cost,visited:intent.plan.visited,nodes:intent.plan.nodes}:null};
     if(intent.kind==='blocked'){outcome='error';reason='Controller navigation blocked: '+intent.reason;await emit('controller-blocked',lastNavigation);break;}
     if(['walk','air-control','jump'].includes(intent.kind))app.stick.x=intent.direction||0;
     if(intent.kind==='jump'||intent.kind==='drop'){
      const from={x:u.x,y:u.y,support:support(u),kind:intent.kind,goal:destination},beforeMove=u.moveLeft,beforeDrop=u.platformDrop;
      if(intent.kind==='jump')metrics.jumpAttempts++;else metrics.dropAttempts++;
      await input(intent.kind,()=>intent.kind==='jump'?app.jump():app.drop(),{actor:u.id,from,checkedLeg:intent.step});
      const accepted=intent.kind==='jump'?u.moveLeft<beforeMove:acceptedDrop(beforeDrop,u.platformDrop);
      if(accepted){if(intent.kind==='jump')metrics.jumpAccepted++;else metrics.dropAccepted++;jumps.set(u.id,from);navigator.accepted(u.id);}
     }else if(intent.kind==='end-turn'||intent.kind==='arrived'){await input('defend',()=>app.defend(),{navigationReason:intent.kind,approachOnly:intent.approachOnly});decisionAt=frame+30;}
    }else if(target){

     if(id){const face=target.x>=u.x?1:-1;if(u.facing!==face){app.keys.add(face>0?'ArrowRight':'ArrowLeft');}
      else{const {angle,power}=previewAim(e,u,g.HONRO_CORE.SKILLS[id],target,random);await input('aim',()=>app.adjustAngle(u,angle-app.displayAngle(u)),{actor:u.id,target:{id:target.id,x:target.x,y:target.y},displayAngle:angle});app.selected=id;
       if(await input('begin-charge',()=>app.beginCharge(),{actor:u.id,skill:id,position:{x:u.x,y:u.y},intendedPower:power})){charge={until:a.now()+e.chargeDuration(u,g.HONRO_CORE.SKILLS[id])*power*1000};}else{await input('defend',()=>app.defend());decisionAt=frame+30;}
      }
     }else{await input('defend',()=>app.defend());decisionAt=frame+30;}
    }else{await input('defend',()=>app.defend());decisionAt=frame+30;}
   }
  }
  await recordInput();a.tick();frame++;while(pending.length)await emit('engine-event',pending.shift());await observe();
 }
 if(b.round>CONTRACT.maxCombatRounds){outcome='round-limit';reason='combat round 20 exceeded';}else if(a.success()){outcome='clear';reason='production objective won';}else if(b.phase==='lost'){outcome='defeat';reason=b.winnerReason||'production lost';}
}catch(error){outcome='error';reason=error.stack||String(error);await emit('error',{reason});}
finally{
 Object.assign(metrics,activity.summary());metrics.engagedEnemyIds=[...engagedEnemies];metrics.visitedSupports=[...supports];const row={runId,stage,policy,seed,sourceHash,outcome,reason,round:b?.round??null,frames:frame,simulationSeconds:simSeconds,virtualAppSeconds:frame/60,wallExecutionSeconds:(performance.now()-started)/1000,humanPlaySeconds:null,finalProcessMemory:process.memoryUsage(),presentationEvidence:a?.presentationEvidence?.(),finalObjective:b?.honroAct4PreviewState??null,metrics,limitations:['Actual NativeCanvas production Scene for Act4; DOM/audio/scheduling doubles, not browser proof.','Declared production-plan entry preset, not earned prior campaign playthrough.','Reactive heuristic policy, not human difficulty or optimal solve.','Elevated support landing is a proxy; authored floor labels are not available.','Per-frame HP loss is net; raw hurt events retain exact before/after for event-level damage.']};
 await emit('run-end',row);raw.end();await rawDone;await writeFile(`${out}/${runId}.summary.json`,JSON.stringify(summarize([row]),null,2));await writeFile(`${out}/${runId}.attempt.json`,JSON.stringify({runId,stage,policy,seed,sourceHash,status:'finalized',outcome,summary:`${runId}.summary.json`},null,2));console.log(JSON.stringify(row));
 if(outcome==='error')process.exitCode=2;
}
