/** Stage16 native normal-input proof. Canonical fresh or exact saved battle,
 * prepared camp readiness, production App launch/mission/story/save/Continue.
 * DOM, render, wall-clock and storage are test doubles; not browser or human QA.
 * After entry only normal input APIs mutate gameplay, with no consumables. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {runtimeParts} from '../shared/build.mjs';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {navigator,campaignEntryReadiness,prepareCamp,analyzeWaits} from './stage16-temple-fullplay-helper.mjs';
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const h=await appHarness(),{g,C}=h;vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const out=process.env.HONRO_FULLPLAY_OUT||'_local/reports/stage16-temple/fullplay';await mkdir(out,{recursive:true});
const resumePath=process.env.HONRO_FULLPLAY_CONTINUE,resume=resumePath?JSON.parse(await readFile(resumePath,'utf8')):null;
const sourceHash=hash(g.HONRO_PROJECT),loadedParts=await runtimeParts({vector:false,render:false}),runtimeSha256=hash(loadedParts.join('\n')),stageSource=g.HONRO_PROJECT.stages[15];
const gameplayProjectSha256=hash({terrain:stageSource.terrains,units:stageSource.units,markers:stageSource.markers,anchors:stageSource.anchors,initialState:stageSource.initialState,events:stageSource.events,objectives:stageSource.objectives,materials:stageSource.materials,content:g.HONRO_CONTENT.stages[15]}),gameplayRuntimeSha256=hash([...loadedParts.filter(s=>!s.startsWith('globalThis.HONRO_PROJECT=')),...await Promise.all(['main','story','interactions','rest-journey','training'].map(f=>readFile(`shared/runtime/${f}.js`,'utf8')))].join('\n'));
const provenance={sourceHash,runtimeSha256,gameplayProjectSha256,gameplayRuntimeSha256,controllerSha256:hash(await readFile(new URL(import.meta.url),'utf8')),helperSha256:hash(await readFile(new URL('./stage16-temple-fullplay-helper.mjs',import.meta.url),'utf8')),checkoutCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),productionCommit:process.env.HONRO_FULLPLAY_PRODUCTION_COMMIT||null};
if(process.env.HONRO_FULLPLAY_PROVENANCE_ONLY==='1'){await writeFile(`${out}/provenance.json`,JSON.stringify(provenance,null,2));console.log(JSON.stringify(provenance));process.exit(0);}
let virtualMs=resume?.virtualMs||0;g.performance={now:()=>virtualMs};
const readiness=campaignEntryReadiness(g);await writeFile(`${out}/readiness-ledger.json`,JSON.stringify(readiness,null,2));
const p=resume?.profile||plain(g.AppRegression.fresh());
if(!resume){const training=prepareCamp(g,p,readiness);await writeFile(`${out}/camp-training.json`,JSON.stringify(training,null,2));}
let app=h.load(p);
if(resume){
 assert.equal(resume.sourceHash,sourceHash,'Saved battle is exact production project');
 assert.equal(resume.runtimeSha256,runtimeSha256,'Saved battle is exact production runtime');
 app.continue();assert.deepEqual(plain(app.engine.b.units),resume.profile.honroBattle.units,'Continue preserves exact actors');
 const preserved=battle=>Object.fromEntries(['units','terrain','items','round','phase','side','active','honroState','honroGrowth','honroMarkers','honroEvents','honroTempleDefenseEntries'].map(key=>[key,battle[key]]));
 assert.deepEqual(plain(preserved(app.engine.b)),plain(preserved(resume.profile.honroBattle)),'Continue preserves actors, terrain, items, turn, objectives, waves and progression exactly');
}else app.launch(16);
let e=app.engine,b=e.b;assert.equal(b.honroStage,16);assert.equal(b.difficulty,'normal');
if(!resume){assert.deepEqual(plain(e.alive(1).map(u=>u.id)),plain(g.HONRO_PROJECT.stages[15].units.filter(u=>u.team==='enemy').map(u=>u.id)),'Every authored opponent enters unchanged');assert.equal(b.honroActiveLimit,4);}
const initial=resume?.initial||plain({battle:b,profile:app.profile});assert(initial.battle.units.filter(u=>u.side===0).every(u=>u.level===readiness.level));
const actions=resume?.actions||[],rounds=resume?.rounds||[],damage=resume?.damage||[],births=resume?.births||[],notices=resume?.notices||[],dialogs=resume?.dialogs||[],continues=[...(resume?.continues||[]),...(resume?[{path:resumePath,round:b.round,method:'production App Continue; exact actors/terrain/items/turn/objectives/waves/progression asserted',statePreserved:true,previousProvenance:resume.provenance,priorFrames:resume.frames,priorPurePlanningCounterAvailable:Number.isFinite(resume.attackPlanningMs)}]:[])];
let nativePhysicsMs=resume?.nativePhysicsMs||0,attackPlanningMs=resume?.attackPlanningMs||0;
let frames=resume?.frames||0,storyFrames=resume?.storyFrames||0,planningMs=resume?.planningMs||0,inputCount=resume?.inputCount||0,lastRound=0,stopReason=null,known=new Set(b.units.map(u=>u.id));
const started=performance.now(),segmentStart={frames,storyFrames,nativePhysicsMs,attackPlanningMs};
const record=row=>actions.push({round:b.round,frame:frames,turn:b.honroState.actorTurnSerial,goal:g.HonroAct2.current(b)?.id,missionGoal:g.HonroAct2.current(b)?.id,...plain(row)});
const event=app.event.bind(app);app.event=text=>{notices.push({round:b.round,frame:frames,turn:b.honroState.actorTurnSerial,text});return event(text);};
const hurt=e.hurt.bind(e);e.hurt=function(u,...args){const before=u.hp,out=hurt(u,...args);if(u.hp<before)damage.push({round:b.round,frame:frames,target:u.id,side:u.side,owner:args[1],amount:before-u.hp,remaining:u.hp,dead:u.dead,source:args[5],skill:args[6]});return out;};
for(const name of ['move','jump','fire','wait','select']){const fn=e[name].bind(e);e[name]=(...args)=>{inputCount++;return fn(...args);};}
const terminal=()=>['won','lost'].includes(b.phase);
function stories(){if(app.dialogue){const d=app.dialogue;dialogs.push({round:b.round,frame:frames,title:d.title,index:d.index,line:plain(d.lines[d.index])});g.HonroStory.next(app);storyFrames++;virtualMs+=1000/60;return true;}if(['aim','enemy','ally','summon'].includes(b.phase))g.HonroStory.turn(app);if(g.HonroStory.turnPaused(app)){storyFrames++;virtualMs+=1000/60;return true;}return false;}
function tick(){const t0=performance.now();virtualMs+=C.STEP*1000;e.tick(C.STEP);if(!app.dialogue)app.missionTick(C.STEP);frames++;for(const u of b.units)if(!known.has(u.id)){known.add(u.id);births.push({round:b.round,frame:frames,turn:b.honroState.actorTurnSerial,id:u.id,source:u.honroSpawnSource,x:u.x,y:u.y});}nativePhysicsMs+=performance.now()-t0;}
const ready=()=>app.canInput();const nav=navigator(g,b,e,{tick,ready,record}),dist=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y),fraction=u=>u.hp/u.maxHp;
function attack(u,target){const begin=performance.now();try{return attackPlan(u,target);}finally{attackPlanningMs+=performance.now()-begin;}}
function attackPlan(u,target){
 const spirit=target.honroSpirit&&!target.manifested;
 const skills=u.loadout.map(id=>C.SKILLS[id]).filter(s=>s.damage>0&&!s.passive&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus).sort((a,z)=>(spirit?Number(z.id==='O08')-Number(a.id==='O08'):0)||Number(z.id==='A06'&&fraction(u)<.8)-Number(a.id==='A06'&&fraction(u)<.8)||z.damage-a.damage);
 for(const s of skills){
  if(s.martial&&s.branch==='sword'){let angle=Math.atan2(u.y-u.h*.58-(target.y-target.h*.5),target.x-u.x)*180/Math.PI;if(angle< -90)angle+=360;for(const power of[1,.7,.2])if(C.meleeContains(e,u,target,C.meleeRange(u,s,power),-angle*Math.PI/180,C.meleeSpan(u,s,power))&&e.fire(s.id,angle,power)){record({op:'fire',hero:u.cls,skill:s.id,target:target.id,hpBefore:target.hp,angle,power});return true;}continue;}
  let best=null;for(const aim of e.shotSeeds(u,s,target)){const v=C.shotViable(e,u,s,target,aim.angle,aim.power);if((v.ok||target.hp<=2&&v.enemyDamage>0)&&v.risk<1&&v.miss<Math.max(85,s.radius+target.r+55)&&(!best||v.net>best.net))best={...aim,net:v.net};}
  if(!best&&s===skills[0]){const aim=e.bestShot(u,s,target),v=C.shotViable(e,u,s,target,aim.angle,aim.power);if((v.ok||target.hp<=2&&v.enemyDamage>0)&&v.risk<1&&v.miss<Math.max(85,s.radius+target.r+55))best=aim;}
  if(best&&e.fire(s.id,best.angle,best.power)){record({op:'fire',hero:u.cls,skill:s.id,target:target.id,hpBefore:target.hp,angle:best.angle,power:best.power});return true;}
 }
 return false;
}
function heal(u){
 if(u.cls!=='mage'||e.manaCost(C.SKILLS.M10,u)>u.focus)return false;
 const hurt=e.heroesAlive().filter(v=>fraction(v)<.7&&dist(v,u)<1600).sort((a,z)=>fraction(a)-fraction(z));if(!hurt.length)return false;
 const target=hurt[0];if((b.stakes||[]).some(s=>s.skill==='M10'&&s.expires>b.round+1&&dist(s,target)<140))return false;
 let best=null;const aims=[...e.shotSeeds(u,C.SKILLS.M10,target),...Array.from({length:36},(_,i)=>-85+i*10).flatMap(angle=>[.2,.4,.6,.8,1].map(power=>({angle,power})))];
 for(const aim of aims){const hit=e.predict(u,C.SKILLS.M10,aim.angle,aim.power),d=dist(hit,target);if(hit.terrain&&Math.abs(hit.y-target.y)<70&&d<85&&(!best||d<best.d))best={...aim,d};}
 if(best&&e.fire('M10',best.angle,best.power)){record({op:'heal-stake',hero:u.cls,target:target.id,...best});return true;}return false;
}
async function save(name='checkpoint'){
 app.export();const profile=await h.exported();assert.deepEqual(profile.honroBattle.units,plain(b.units),'Production export preserves actors');
 const data={sourceHash,runtimeSha256,provenance,initial,profile,actions,rounds,damage,births,notices,dialogs,continues,frames,storyFrames,planningMs,nativePhysicsMs,attackPlanningMs,inputCount,virtualMs};
 await writeFile(`${out}/${name}.json`,JSON.stringify(data));return data;
}
await writeFile(`${out}/initial.json`,JSON.stringify({provenance,initial},null,2));
const actionLimit=Number(process.env.HONRO_FULLPLAY_ACTION_LIMIT||2200),roundLimit=Number(process.env.HONRO_FULLPLAY_ROUND_LIMIT||220);let lastSignature='',stalled=0;const savedGoals=new Set();
for(let turn=0;turn<actionLimit&&!terminal();turn++){
 while(!ready()&&!terminal()){if(stories())continue;tick();if(frames>2200000){stopReason='native simulation budget';break;}}if(stopReason||terminal())break;
 if(lastRound!==b.round){
  lastRound=b.round;const row={round:b.round,goal:g.HonroAct2.current(b)?.id,hold:g.HonroAct2.memory(b).holds?.['hold-hall'],heroes:e.heroesAlive().map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,x:u.x,y:u.y,support:nav.surface(u)})),enemies:e.alive(1).map(u=>({id:u.id,hp:u.hp,x:u.x,y:u.y})),done:plain(g.HonroAct2.memory(b).done)};
  rounds.push(row);console.log('ROUND',JSON.stringify({...row,enemies:row.enemies.length}));await save();if(row.goal&&!savedGoals.has(row.goal)){savedGoals.add(row.goal);await save(`checkpoint-${row.goal}`);}await writeFile(`${out}/progress.json`,JSON.stringify(row,null,2));
  const signature=JSON.stringify({goal:row.goal,hold:row.hold,enemies:row.enemies.map(u=>[u.id,Math.round(u.hp)]),heroes:row.heroes.map(u=>[u.cls,Math.round(u.x/40),Math.round(u.y/40)])});stalled=lastSignature===signature?stalled+1:0;lastSignature=signature;
  if(stalled>=3){stopReason='controller unchanged for 3 rounds';break;}if(b.round>roundLimit){stopReason='requested round observation limit';break;}
 }
 const t0=performance.now(),goal=g.HonroAct2.current(b),m=b.honroMarkers.find(v=>v.id===goal?.id);
 if(goal?.requiredClass){const specialist=e.heroesAlive().find(u=>!u.acted&&u.cls===goal.requiredClass);if(specialist)e.select(specialist.id);}
 const u=e.active;if(!u||u.dead){stopReason='no usable active hero';break;}
 const interact=()=>m?.action&&g.HonroInteractions.eligibility(app,m).ok&&g.HonroInteractions.use(app,m);
 if(interact()){record({op:'E',hero:u.cls,target:m.id});nav.clear(u.id);planningMs+=performance.now()-t0;continue;}
 if(heal(u)){planningMs+=performance.now()-t0;continue;}
 let foes=e.alive(1).filter(v=>g.HonroAct2.visible(b,v));
 const priority=v=>goal?.kind==='clear'&&goal.cohorts!=='all'?Number(v.honroCohort===goal.cohorts)*100000:goal?.kind==='defeat'?Number(v.id===goal.target)*100000:goal?.kind==='hold'?Number(dist(v,m)<goal.contestRadius+170)*100000:0;
 foes.sort((a,z)=>priority(z)-priority(a)||dist(a,u)-dist(z,u));
 let fired=false;for(const target of foes.filter(v=>dist(v,u)<1500).slice(0,4))if(attack(u,target)){fired=true;break;}if(fired){planningMs+=performance.now()-t0;continue;}
 let point=m,enemy=false;const currentFoes=goal?.kind==='clear'?foes.filter(v=>goal.cohorts==='all'||v.honroCohort===goal.cohorts):goal?.kind==='defeat'?foes.filter(v=>v.id===goal.target):[];
 const healStake=(b.stakes||[]).filter(s=>s.skill==='M10'&&s.expires>b.round&&s.usedRounds?.[u.id]!==b.round&&dist(s,u)<1600).sort((a,z)=>dist(a,u)-dist(z,u))[0];
 if(fraction(u)<.75&&healStake)point=healStake;else if(currentFoes.length){point=currentFoes[0];enemy=true;}else if(goal?.kind==='hold')point=m;else if(!point&&foes.length){point=foes[0];enemy=true;}
 if(point)nav.advance(u,point,enemy);if(!ready()){planningMs+=performance.now()-t0;continue;}
 if(interact()){record({op:'E',hero:u.cls,target:m.id});nav.clear(u.id);planningMs+=performance.now()-t0;continue;}
 if(heal(u)){planningMs+=performance.now()-t0;continue;}
 for(const target of foes.filter(v=>!v.dead&&dist(v,u)<1700).slice(0,4))if(attack(u,target)){fired=true;break;}
 if(!fired){record({op:'defend',hero:u.cls});app.defend();}planningMs+=performance.now()-t0;
}
if(!terminal()&&!stopReason)stopReason='controller action limit';if(terminal()){app.outcome();for(let i=0;app.dialogue&&i<300;i++)stories();}
const checkpoint=terminal()?null:await save();
const templeDefense=g.HonroStage16Temple.memory(b),waveTelegraphs=Object.entries(templeDefense.entries).map(([source,entry])=>({source,warning:templeDefense.warnings[source],entry,births:births.filter(v=>v.source===source)}));
if(b.phase==='won'){
 assert.deepEqual(Object.keys(g.HonroAct2.memory(b).done),['clear-court','monk','hall','hold-hall','record','clear-temple','witness']);
 assert.equal(e.alive(1).length,0);assert.equal(births.filter(v=>/^hold-hall-/.test(v.source)).length,10);assert(g.HonroAct2.memory(b).holds['hold-hall'].progress>=5, 'At least five complete guarded rounds; occupied wave entries may prolong defense');
 assert(b.units.filter(u=>u.honroProtected).every(u=>!u.dead&&u.hp>0),'Every protected resident survives');assert(e.unit('resident-1').honroResolved,'The monk was rescued through E');
 assert.deepEqual(waveTelegraphs.map(w=>w.entry.side),['west','east','west','east']);
 for(const wave of waveTelegraphs)assert(wave.warning&&wave.entry.serial>wave.warning.serial&&wave.births.every(v=>v.turn>wave.warning.serial),'Every wave follows a warning at an earlier ordinary actor boundary');
}
const result={...provenance,completedAt:new Date().toISOString(),initialEnemies:initial.battle.units.filter(u=>u.side===1).length,enemyDefeats:b.units.filter(u=>u.side===1&&u.dead).length,waveTelegraphs,phase:b.phase,round:b.round,stopReason,winnerReason:b.winnerReason,done:plain(g.HonroAct2.memory(b).done),hold:g.HonroAct2.memory(b).holds?.['hold-hall'],seconds:(performance.now()-started)/1000,
 segmentTiming:{simulationSeconds:(frames-segmentStart.frames)*C.STEP,storyPauseSeconds:(storyFrames-segmentStart.storyFrames)/60,botAttackPlanningSeconds:(attackPlanningMs-segmentStart.attackPlanningMs)/1000,nativePhysicsWallSeconds:(nativePhysicsMs-segmentStart.nativePhysicsMs)/1000},
 simulationSeconds:frames*C.STEP,storyPauseSeconds:storyFrames/60,botAttackPlanningSeconds:attackPlanningMs/1000,nativePhysicsWallSeconds:nativePhysicsMs/1000,controllerWallSecondsIncludingMovement:planningMs/1000,botIdleWaitWallSeconds:0,timingScope:'Simulation seconds counts production Engine ticks; story/turn pauses use a virtual clock; attack planning is Node wall time, excluding native physics; no human wall-time claim.',frames,inputCount,actions:actions.length,
 actionCounts:Object.fromEntries([...new Set(actions.map(a=>a.op))].map(op=>[op,actions.filter(a=>a.op===op).length])),readinessXP:initial.profile.heroes.archer.xp,readinessLevel:readiness.level,
 trainingBudget:Object.fromEntries(initial.profile.recruited.map(cls=>[cls,{earned:C.pointsEarned(initial.profile.heroes[cls]),spent:C.pointsSpent(initial.profile.heroes[cls],cls),statTraining:initial.profile.heroes[cls].statTraining}])),
 initialHeroes:initial.battle.units.filter(u=>u.side===0).map(u=>({cls:u.cls,level:u.level,hp:u.hp,maxHp:u.maxHp,ranks:u.ranks,loadout:u.loadout,focus:u.focus})),initialItems:initial.battle.items,items:b.items,
 heroes:b.units.filter(u=>u.side===0).map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,dead:u.dead,x:u.x,y:u.y})),protectedResidents:b.units.filter(u=>u.honroProtected).map(u=>({id:u.id,hp:u.hp,maxHp:u.maxHp,dead:u.dead,resolved:u.honroResolved,shield:u.shield})),
 deaths:damage.filter(d=>d.dead&&d.side===0),damageTaken:damage.filter(d=>d.side===0).reduce((n,d)=>n+d.amount,0),damageDealt:damage.filter(d=>d.side===1).reduce((n,d)=>n+d.amount,0),births,continues,dialogueLines:dialogs.length,
 scope:'Native production App/Engine with DOM/render/storage/clock doubles. Prepared actual level13 first-clear campaign-ledger readiness and normal camp training, Normal difficulty; previous clear records are entry fixtures. No consumables, actor pose/HP/focus/move/objective edits after entry. Not browser/UI/human balance or time evidence.'};
assert.deepEqual(plain(b.items),initial.battle.items,'No consumables used');
await writeFile(`${out}/result.json`,JSON.stringify(result,null,2));await writeFile(`${out}/wait-analysis.json`,JSON.stringify(analyzeWaits(actions,b.round),null,2));await writeFile(`${out}/trace.json`,JSON.stringify({actions,rounds,damage,births,notices,dialogs,continues},null,2));await writeFile(`${out}/final-battle.json`,JSON.stringify(b));console.log('RESULT',JSON.stringify(result));if(b.phase!=='won')process.exitCode=1;
