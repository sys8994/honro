/** Stage18 basic-only normal-input proof. Gameplay, story and serialization are
 * production App/Engine. DOM/render/storage/clock are doubles. The prior-clear
 * XP ledger is an entry fixture, not a claim of playing Stages1–17. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {runtimeParts} from '../shared/build.mjs';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {navigator,campaignEntryReadiness,analyzeWaits,enterStage19} from './stage18-bell-fullplay-helper.mjs';
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const h=await appHarness(),{g,C}=h;
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const out=process.env.HONRO_FULLPLAY_OUT||'_local/reports/stage18-bell/fullplay';await mkdir(out,{recursive:true});
const resumePath=process.env.HONRO_FULLPLAY_CONTINUE,resume=resumePath?JSON.parse(await readFile(resumePath,'utf8')):null;
const rosterMode=process.env.HONRO_FULLPLAY_ROSTER||'canonical',rolePrefix=process.env.HONRO_FULLPLAY_ROLE_PREFIX==='1';
assert(['canonical','baseline28'].includes(rosterMode),'Use the production candidate or the authored paired baseline');
const canonicalProjectSha256=hash(g.HONRO_PROJECT),canonicalStage=plain(g.HONRO_PROJECT.stages[17]);
let pairedBaseline=null;
if(rosterMode==='baseline28'){
 const {authorStage18Bell}=await import('../tools/map-forge/apply-stage18-bell.mjs');
 const authored=await authorStage18Bell(plain(g.HONRO_PROJECT),g,{roster:'baseline28'}),baseline=authored.stages[17];
 for(const key of ['width','height','terrains','markers','initialState'])assert.deepEqual(plain(baseline[key]),canonicalStage[key],'Paired baseline preserves '+key);
 const players=s=>s.units.filter(u=>u.team==='player');assert.deepEqual(plain(players(baseline)),players(canonicalStage),'Paired baseline preserves all four authored spawns');
 assert.equal(baseline.units.filter(u=>u.team==='enemy').length,28);
 pairedBaseline={method:'Production authorStage18Bell baseline28 option on a private pre-entry project clone; no repository or live battle edits',canonicalStageSha256:hash(canonicalStage),geometrySha256:hash(baseline.terrains),markersSha256:hash(baseline.markers),heroSpawnsSha256:hash(players(baseline)),canonicalInitial:canonicalStage.units.filter(u=>u.team==='enemy').length,baselineInitial:28};
 g.HONRO_PROJECT=authored;
}
const parts=await runtimeParts({vector:false,render:false}),stage=g.HONRO_PROJECT.stages[17];
const sourceHash=hash(g.HONRO_PROJECT),runtimeSha256=hash(parts.join('\n'));
const gameplayProjectSha256=hash({terrain:stage.terrains,units:stage.units,markers:stage.markers,anchors:stage.anchors,initialState:stage.initialState,events:stage.events,objectives:stage.objectives,materials:stage.materials,content:g.HONRO_CONTENT.stages[17],routes:stage.design.space.routes,sites:stage.design.space.sites,standing:stage.design.bell?.standing});
const gameplayRuntimeSha256=hash([...parts.filter(s=>!s.startsWith('globalThis.HONRO_PROJECT=')),...await Promise.all(['main','story','interactions','rest-journey','training'].map(f=>readFile(`shared/runtime/${f}.js`,'utf8')))].join('\n'));
const provenance={mode:rolePrefix?'live-role-prefix':'basic-fullplay',rosterMode,canonicalProjectSha256,pairedBaseline,sourceHash,runtimeSha256,gameplayProjectSha256,gameplayRuntimeSha256,stageSha256:hash(stage),controllerSha256:hash(await readFile(new URL(import.meta.url),'utf8')),helperSha256:hash(await readFile(new URL('./stage18-bell-fullplay-helper.mjs',import.meta.url),'utf8')),checkoutCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),productionCommit:process.env.HONRO_FULLPLAY_PRODUCTION_COMMIT||null};
if(process.env.HONRO_FULLPLAY_PROVENANCE_ONLY==='1'){await writeFile(`${out}/provenance.json`,JSON.stringify(provenance,null,2));console.log(JSON.stringify(provenance));process.exit(0);}
const readiness=campaignEntryReadiness(g);await writeFile(`${out}/readiness-ledger.json`,JSON.stringify(readiness,null,2));
const shotAttempts=new Map(resume?.shotAttempts||[]);
const basic={archer:'A01',mage:'M01',knight:'S00',occultist:'O01'},excluded=rolePrefix?['O08','O11','M09']:['M11','M04','O08','O11','M09'];
const p=resume?.profile||plain(g.AppRegression.fresh()),training=[];
if(!resume){
 p.recruited=g.HonroStageRules.stageParty(18);p.party=[...p.recruited];p.settings.difficulty='normal';p.cleared=plain(readiness.cleared);p.honroGrowth=plain(readiness.ledger);
 // Four real slots. All optional skills are legally bought at rank one and
 // deliberately never fired. The remaining entry points buy ordinary stats.
 const slots={archer:['A01','A14','A11','A05'],mage:['M01','M03','M06','M07'],knight:['S00','S03','S01','S09'],occultist:['O01','O06','O02','O03']};
 if(rolePrefix)slots.mage=['M01','M04','M11','M03'];
 const train=(hero,id)=>{if(hero.ranks[id])return;const n=C.TALENT_MAP[id];assert(n,id);if(n.prereq)train(hero,n.prereq);assert(C.train(hero,id),`${id}: ${C.trainReason(hero,id)}`);training.push({op:'train',skill:id,rank:hero.ranks[id]});};
 for(const cls of p.recruited){const hero=p.heroes[cls];hero.xp=readiness.heroes[cls].xp;C.resetTalents(hero,cls);for(const id of slots[cls])train(hero,id);while(C.pointsLeft(hero,cls)>0){assert(C.investStat(hero,cls));training.push({op:'stat',hero:cls,rank:hero.statTraining});}p.loadouts[cls]=slots[cls];C.sanitizeLoadout(p,cls);assert.equal(p.loadouts[cls].length,4);assert.deepEqual(plain(p.loadouts[cls]),slots[cls]);assert(Object.values(hero.ranks).every(n=>n===1),'Every learned skill stays rank one');assert.equal(C.pointsSpent(hero,cls),C.pointsEarned(hero));for(const id of excluded)assert(!hero.ranks[id]&&!p.loadouts[cls].includes(id));}
}
let virtualMs=resume?.virtualMs||0;g.performance={now:()=>virtualMs};
let app=h.load(p);if(resume){assert.equal(resume.sourceHash,sourceHash);assert.equal(resume.runtimeSha256,runtimeSha256);app.continue();}else app.launch(18);
let e=app.engine,b=e.b,nav,navOffset;assert.equal(b.honroStage,18);assert.equal(b.difficulty,'normal');assert.equal(b.seed,19388,'Same untouched production map-compiler seed for candidate and baseline');assert(g.HonroStage18Bell.active(b),'Fresh authored Stage18 must opt into the bell revision');
if(!resume){assert.deepEqual(plain(e.alive(1).map(u=>u.id)),plain(stage.units.filter(u=>u.team==='enemy').map(u=>u.id)));assert.equal(b.honroActiveLimit,3);}
const initial=resume?.initial||plain({battle:b,profile:app.profile});
assert(initial.battle.units.filter(u=>u.side===0).every(u=>u.level===readiness.level));
for(const u of initial.battle.units.filter(u=>u.side===0)){assert.equal(u.loadout.length,4);assert(Object.values(u.ranks).every(n=>n===1));for(const id of excluded)assert(!u.ranks[id]&&!u.loadout.includes(id));}
const actions=resume?.actions||[],rounds=resume?.rounds||[],turns=resume?.turns||[],damage=resume?.damage||[],births=resume?.births||[],notices=resume?.notices||[],dialogs=resume?.dialogs||[],continues=resume?.continues||[],impacts=resume?.impacts||[],resources=resume?.resources||[];
let frames=resume?.frames||0,storyFrames=resume?.storyFrames||0,planningMs=resume?.planningMs||0,nativePhysicsMs=resume?.nativePhysicsMs||0,attackPlanningMs=resume?.attackPlanningMs||0,inputCount=resume?.inputCount||0,lastRound=0,lastSerial=-1,stopReason=null;
const started=performance.now(),segmentStart={frames,storyFrames,nativePhysicsMs,attackPlanningMs},known=new Set(b.units.map(u=>u.id)),savedLabels=new Set(continues.map(v=>v.label));
const distance=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y),fraction=u=>u.hp/u.maxHp,terminal=()=>['won','lost'].includes(b.phase),ready=()=>app.canInput();
const record=row=>actions.push({round:b.round,frame:frames,turn:b.honroState.actorTurnSerial,goal:g.HonroAct2.current(b)?.id,...plain(row),objective:g.HonroAct2.current(b)?.id});
const heroRows=()=>b.units.filter(u=>u.side===0&&!u.summoned).map(u=>({id:u.id,cls:u.cls,hp:u.hp,maxHp:u.maxHp,focus:u.focus,maxFocus:u.maxFocus,moveLeft:u.moveLeft,maxMove:u.maxMove,x:u.x,y:u.y,dead:u.dead,acted:u.acted}));
function instrument(){
 const event=app.event.bind(app);app.event=text=>{notices.push({round:b.round,frame:frames,turn:b.honroState.actorTurnSerial,text});return event(text);};
 const hurt=e.hurt.bind(e);e.hurt=function(u,...args){const before=u.hp,beforeSide=u.side,result=hurt(u,...args);if(u.hp<before)damage.push({round:b.round,frame:frames,turn:b.honroState.actorTurnSerial,target:u.id,side:beforeSide,sideAfter:u.side,owner:args[1],amount:before-u.hp,remaining:u.hp,dead:u.dead,source:args[5]||'normal',skill:args[6]||args[3]?.skill,shot:args[3]?.shot,projectileId:args[3]?.id,direct:!!args[2],origin:args[4]});return result;};
 const impact=e.impact.bind(e);e.impact=function(p,hit){impacts.push({round:b.round,frame:frames,shot:p.shot,owner:p.owner,skill:p.skill,x:hit.x,y:hit.y,unit:hit.unit?.id,terrain:hit.terrain?.id});return impact(p,hit);};
 for(const name of ['move','jump','wait','select']){const fn=e[name].bind(e);e[name]=(...args)=>{inputCount++;return fn(...args);};}
 const fire=e.fire.bind(e);e.fire=(skill,angle,power,ai=false)=>{inputCount++;const u=e.active,before=u?.focus,cost=u?e.manaCost(C.SKILLS[skill],u,power):null,result=fire(skill,angle,power,ai);if(result&&u?.side===0&&!u.summoned){assert.equal(skill,basic[u.cls],'Only the actual basic attack is used');assert.equal(before-u.focus,cost,'Production basic attack cost');if(u.cls!=='knight')assert.equal(cost,0,'A01/M01/O01 are free');resources.push({round:b.round,frame:frames,hero:u.cls,skill,power,cost,before,after:u.focus});}return result;};
 nav=navigator(g,b,e,{tick,ready,record});navOffset=g.HonroStage18Bell.memory(b).offset;
}
function stories(){if(app.dialogue){const d=app.dialogue;dialogs.push({round:b.round,frame:frames,title:d.title,index:d.index,line:plain(d.lines[d.index])});g.HonroStory.next(app);storyFrames++;virtualMs+=1000/60;return true;}if(['aim','enemy','ally','summon'].includes(b.phase))g.HonroStory.turn(app);if(g.HonroStory.turnPaused(app)){storyFrames++;virtualMs+=1000/60;return true;}return false;}
function tick(){const begin=performance.now();virtualMs+=C.STEP*1000;e.tick(C.STEP);if(!app.dialogue)app.missionTick(C.STEP);frames++;for(const u of b.units)if(!known.has(u.id)){known.add(u.id);births.push({round:b.round,frame:frames,turn:b.honroState.actorTurnSerial,id:u.id,source:u.honroSpawnSource,x:u.x,y:u.y});}const serial=b.honroState.actorTurnSerial||0;if(lastSerial!==serial){lastSerial=serial;turns.push({round:b.round,frame:frames,turn:serial,active:b.active,phase:b.phase,goal:g.HonroAct2.current(b)?.id,heroes:heroRows(),enemyCount:e.alive(1).length,descent:plain(g.HonroStage18Bell.memory(b)),hold:plain(g.HonroAct2.memory(b).holds?.['hold-silence']||{})});}nativePhysicsMs+=performance.now()-begin;}
const preserved=battle=>Object.fromEntries(['units','terrain','honroWorldTerrain','items','round','phase','side','active','honroState','honroGrowth','honroMarkers','honroEvents','honroBellDescent'].map(key=>[key,battle[key]]));
if(resume){assert.deepEqual(plain(preserved(b)),plain(preserved(resume.profile.honroBattle)));continues.push({label:'external-checkpoint',path:resumePath,round:b.round,phase:b.phase,statePreserved:true,previousProvenance:resume.provenance});}
instrument();
async function save(label='checkpoint'){
 app.export();const profile=await h.exported();assert.deepEqual(profile.honroBattle.units,plain(b.units),'Production export preserves actors');
 const data={sourceHash,runtimeSha256,provenance,initial,profile,actions,rounds,turns,damage,births,notices,dialogs,continues,impacts,resources,frames,storyFrames,planningMs,nativePhysicsMs,attackPlanningMs,inputCount,virtualMs,shotAttempts:[...shotAttempts]};await writeFile(`${out}/${label}.json`,JSON.stringify(data));return data;
}
async function continueNow(label){const data=await save(label),before=plain(preserved(b));app=h.load(data.profile);app.continue();e=app.engine;b=e.b;assert.deepEqual(plain(preserved(b)),before,'Production App Continue preserves '+label);continues.push({label,round:b.round,phase:b.phase,statePreserved:true,method:'production export, profile load, App.continue; exact actors/terrain/items/turn/objectives/waves/progression'});savedLabels.add(label);instrument();record({op:'continue',label});}
const missedAtPose=(u,target)=>{const last=shotAttempts.get(u.id+':'+target.id);return last&&target.hp>=last.hp&&(target.shield||0)>=last.shield&&distance(u,last.position)<120&&distance(target,last.targetPosition)<120&&(b.honroState.actorTurnSerial||0)>last.turn;};
const rememberShot=(u,target)=>shotAttempts.set(u.id+':'+target.id,{hp:target.hp,shield:target.shield||0,position:{x:u.x,y:u.y},targetPosition:{x:target.x,y:target.y},turn:b.honroState.actorTurnSerial||0});
function attack(u,target){if(missedAtPose(u,target))return false;const begin=performance.now();try{
 const s=C.SKILLS[basic[u.cls]];
 if(s.martial&&s.branch==='sword'){
  let angle=Math.atan2(u.y-u.h*.58-(target.y-target.h*.5),target.x-u.x)*180/Math.PI;if(angle< -90)angle+=360;
  for(const power of [1,.7,.2,0])if(e.manaCost(s,u,power)<=u.focus&&C.meleeContains(e,u,target,C.meleeRange(u,s,power),-angle*Math.PI/180,C.meleeSpan(u,s,power))&&e.fire(s.id,angle,power)){rememberShot(u,target);record({op:'fire',hero:u.cls,skill:s.id,target:target.id,hpBefore:target.hp,angle,power,from:{x:u.x,y:u.y}});return true;}return false;
 }
 let best=null;
 for(const aim of e.shotSeeds(u,s,target)){const v=C.shotViable(e,u,s,target,aim.angle,aim.power);if((v.ok||target.hp<=2&&v.enemyDamage>0)&&v.risk<1&&v.miss<Math.max(85,s.radius+target.r+55)&&(!best||v.net>best.net))best={...aim,net:v.net};}
 if(!best){const aim=e.bestShot(u,s,target),v=C.shotViable(e,u,s,target,aim.angle,aim.power);if((v.ok||target.hp<=2&&v.enemyDamage>0)&&v.risk<1&&v.miss<Math.max(85,s.radius+target.r+55))best=aim;}
 if(best&&e.fire(s.id,best.angle,best.power)){rememberShot(u,target);record({op:'fire',hero:u.cls,skill:s.id,target:target.id,hpBefore:target.hp,angle:best.angle,power:best.power,from:{x:u.x,y:u.y}});return true;}return false;
 }finally{attackPlanningMs+=performance.now()-begin;}}
function attackAnchor(u){const t=b.terrain.find(t=>t.id==='upper-chain');if(!t||t.broken||u.cls==='knight'||distance(u,stage.design.bell.standing.farRelease)>220)return false;const begin=performance.now();try{const s=C.SKILLS[basic[u.cls]],target={x:t.x+t.w/2,y:t.y+t.h/2,h:0,r:Math.min(t.w,t.h)/2};const aims=e.shotSeeds(u,s,target);for(const power of [.25,.5,.75,1])for(let angle=-80;angle<=260;angle+=5)aims.push({angle,power});for(const aim of aims){const p=e.predict(u,s,aim.angle,aim.power,undefined,false);if(p.terrain==='upper-chain'&&e.fire(s.id,aim.angle,aim.power)){record({op:'fire-anchor',hero:u.cls,skill:s.id,hpBefore:t.hp,angle:aim.angle,power:aim.power,from:{x:u.x,y:u.y}});return true;}}return false;}finally{attackPlanningMs+=performance.now()-begin;}}
await writeFile(`${out}/initial.json`,JSON.stringify({provenance,initial,training},null,2));
const actionLimit=Number(process.env.HONRO_FULLPLAY_ACTION_LIMIT||2400),roundLimit=Number(process.env.HONRO_FULLPLAY_ROUND_LIMIT||260);let lastSignature='',stalled=0;
for(let turn=0;turn<actionLimit&&!terminal();turn++){
 while(!ready()&&!terminal()){if(stories())continue;tick();if(frames>2600000){stopReason='native simulation budget';break;}}if(stopReason||terminal())break;
 if(rolePrefix&&g.HonroAct2.memory(b).done.silence){const rear=e.unit('sb-b-high');assert(rear&&!rear.dead&&rear.hp>0,'Normal first-clear leaves the B rear reflector target alive');assert.deepEqual(plain(e.unit('p-mage').loadout),['M01','M04','M11','M03']);stopReason='live role prefix reached through normal first-clear and silence E';await save('role-prefix');break;}
 const descent=g.HonroStage18Bell.memory(b);
 if(descent.offset!==navOffset){nav=navigator(g,b,e,{tick,ready,record});navOffset=descent.offset;}
 if(['warning','waiting'].includes(descent.status)&&!savedLabels.has('warning-continue'))await continueNow('warning-continue');
 if(g.HonroAct2.memory(b).done.leak&&!savedLabels.has('late-continue'))await continueNow('late-continue');
 if(lastRound!==b.round){lastRound=b.round;const row={round:b.round,goal:g.HonroAct2.current(b)?.id,hold:plain(g.HonroAct2.memory(b).holds?.['hold-silence']||{}),descent:plain(g.HonroStage18Bell.memory(b)),heroes:heroRows(),enemies:e.alive(1).map(u=>({id:u.id,hp:u.hp,x:u.x,y:u.y})),done:plain(g.HonroAct2.memory(b).done)};rounds.push(row);console.log('ROUND',JSON.stringify({...row,enemies:row.enemies.length}));await save();await writeFile(`${out}/progress.json`,JSON.stringify(row,null,2));const signature=JSON.stringify({goal:row.goal,enemies:row.enemies.map(u=>[u.id,Math.round(u.hp)]),heroes:row.heroes.map(u=>[u.cls,Math.round(u.x/40),Math.round(u.y/40)])});stalled=lastSignature===signature?stalled+1:0;lastSignature=signature;if(stalled>=12){stopReason='controller unchanged for 12 rounds';break;}if(b.round>roundLimit){stopReason='requested round observation limit';break;}}
 const begin=performance.now(),goal=g.HonroAct2.current(b),m=b.honroMarkers.find(v=>v.id===goal?.id);
 if(goal?.requiredClass){const specialist=e.heroesAlive().find(u=>!u.acted&&u.cls===goal.requiredClass);if(specialist)e.select(specialist.id);}
 const u=e.active;if(!u||u.dead){stopReason='no usable active hero';break;}
 const roleStanding={id:'role-hold-standing',x:3250,y:C.topAt(b.terrain.find(t=>t.id==='sb-suppression-court'),3250)};
 const interact=()=>!(rolePrefix&&goal?.id==='silence'&&distance(u,roleStanding)>18)&&m?.action&&g.HonroInteractions.eligibility(app,m).ok&&g.HonroInteractions.use(app,m);
 const usefulLamps=b.honroMarkers.filter(v=>v.id.startsWith('spirit-lamp')&&e.heroesAlive().some(ally=>ally.cls!=='occultist'&&distance(ally,v)<1400)&&e.alive(1).some(enemy=>enemy.honroSpirit&&(!enemy.manifested||enemy.manifestedUntil<=b.round)&&distance(enemy,v)<(v.radius||1200))).sort((a,z)=>distance(a,u)-distance(z,u));
 const useLamp=()=>{const lamp=usefulLamps.find(v=>g.HonroInteractions.eligibility(app,v).ok);if(!lamp||!g.HonroInteractions.use(app,lamp))return false;record({op:'E-lamp',hero:u.cls,target:lamp.id});nav.clear(u.id);return true;};
 if(interact()){record({op:'E',hero:u.cls,target:m.id});nav.clear(u.id);planningMs+=performance.now()-begin;continue;}
 if(useLamp()){planningMs+=performance.now()-begin;continue;}
 const stabilizing=g.HonroAct2.memory(b).done.silence&&!g.HonroStage18Bell.memory(b).count,holdMarker=b.honroMarkers.find(v=>v.id==='hold-silence'),anchor=b.terrain.find(t=>t.id==='upper-chain');
 const holdNeeded=!g.HonroAct2.satisfied(b,g.HonroAct2.steps(b).find(s=>s.id==='hold-silence'));
 const keeper=e.unit('act2-keeper');
 let foes=e.alive(1).filter(v=>(!rolePrefix||v.honroCohort==='west')&&g.HonroAct2.visible(b,v)&&!(v===keeper&&!g.HonroAct2.memory(b).done.leak));
 const blockingIds=new Set(g.HonroStage18Bell.memory(b).blockers?.map(v=>v.id)||[]);
 const priority=v=>blockingIds.has(v.id)?200000:goal?.kind==='clear'&&goal.cohorts!=='all'?Number(v.honroCohort===goal.cohorts)*100000:goal?.kind==='defeat'?Number(v.id===goal.target)*100000:stabilizing&&holdNeeded?Number(distance(v,holdMarker)<350)*100000:0;
 foes.sort((a,z)=>priority(z)-priority(a)||distance(a,u)-distance(z,u));
 const specialistTravel=goal?.kind==='interact'&&goal.requiredClass===u.cls&&m&&distance(u,m)>260;
 const evacuating=['warning','waiting'].includes(g.HonroStage18Bell.memory(b).status)&&g.HonroStage18Bell.occupants(b).some(v=>v.id===u.id);
 let point=m,enemy=false,doAnchor=stabilizing&&!anchor.broken&&u.cls==='archer';
 if(doAnchor&&attackAnchor(u)){planningMs+=performance.now()-begin;continue;}
 let fired=false;if(!evacuating&&!specialistTravel&&(!doAnchor||distance(u,stage.design.bell.standing.farRelease)<=220))for(const target of foes.filter(v=>distance(v,u)<1500).slice(0,4))if(attack(u,target)){fired=true;break;}
 if(fired){planningMs+=performance.now()-begin;continue;}
 const currentFoes=goal?.kind==='clear'?foes.filter(v=>goal.cohorts==='all'||v.honroCohort===goal.cohorts):goal?.kind==='defeat'?foes.filter(v=>v.id===goal.target):[];
 if(['warning','waiting'].includes(g.HonroStage18Bell.memory(b).status)){
  const spec=b.honroBellDescent,site=Object.values(stage.design.space.sites||{}).find(s=>s.role==='safe')?.standing;
  const zones=[...(spec.safeZones||[])],z=zones.sort((a,z)=>distance(u,{x:a.x+a.w/2,y:a.y})-distance(u,{x:z.x+z.w/2,y:z.y}))[0];const blocker=foes.find(v=>blockingIds.has(v.id));point=evacuating?(stage.design.bell?.standing?.safeUnderBell||site||(z?{id:'safe-floor',x:z.x+z.w/2,y:z.y}:holdMarker)):blocker;enemy=!evacuating&&!!blocker;
 }else if(doAnchor){const sites=stage.design.space.sites;point=stage.design.bell?.standing?.farRelease||sites['anchor-far']?.standing||sites['upper-chain']?.standing||{id:'anchor-approach',x:anchor.x-250,y:anchor.y+100};}
 else if(stabilizing&&holdNeeded&&u.cls==='mage')point=holdMarker;
 else if(currentFoes.length){point=currentFoes[0];enemy=true;}
 else if(goal?.kind==='clear'&&usefulLamps.length)point=usefulLamps[0];
 else if(goal?.id==='clear-wards')point=u.cls==='archer'?stage.design.bell.standing.farRelease:holdMarker;
 else if(goal?.kind==='interact'&&goal.requiredClass!==u.cls&&foes.length){point=foes[0];enemy=true;}
 else if(stabilizing&&holdNeeded){const contest=foes.find(v=>distance(v,holdMarker)<600);point=contest||holdMarker;enemy=!!contest;}
 else if(!point&&foes.length){point=foes[0];enemy=true;}
 if(rolePrefix&&goal?.id==='silence'&&u.cls==='mage'){point=roleStanding;enemy=false;}
 if(point&&enemy&&missedAtPose(u,point))point={...point,approachRange:u.cls==='knight'?60:150};
 if(point)nav.advance(u,point,enemy);if(!ready()){planningMs+=performance.now()-begin;continue;}
 if(interact()){record({op:'E',hero:u.cls,target:m.id});nav.clear(u.id);planningMs+=performance.now()-begin;continue;}
 if(useLamp()){planningMs+=performance.now()-begin;continue;}
 if(doAnchor&&attackAnchor(u)){planningMs+=performance.now()-begin;continue;}
 for(const target of foes.filter(v=>!v.dead&&distance(v,u)<1700).slice(0,4))if(attack(u,target)){fired=true;break;}
 if(!fired){const before={hp:u.hp,focus:u.focus};record({op:'defend',hero:u.cls});app.defend();resources.push({round:b.round,frame:frames,hero:u.cls,op:'defend',before,after:{hp:u.hp,focus:u.focus}});}planningMs+=performance.now()-begin;
}
if(!terminal()&&!stopReason)stopReason='controller action limit';const beforeReward=plain({heroes:b.heroes,items:b.items,resources:heroRows(),growth:b.honroGrowth});if(terminal()){for(let i=0;app.dialogue&&i<300;i++)stories();app.outcome();for(let i=0;app.dialogue&&i<300;i++)stories();}else await save();
const mem=g.HonroStage18Bell.memory(b),a=g.HonroAct2.memory(b),waveTelegraphs=Object.entries(mem.entries).map(([source,entry])=>({source,warning:mem.warnings[source],entry,births:births.filter(v=>v.source===source)}));
let validationFailure=null;try{if(b.phase==='won'){
 assert.deepEqual(Object.keys(a.done),['clear-wards','silence',...Object.keys(a.done).filter(k=>['hold-silence','upper-chain'].includes(k)),'bell-descent','leak','keeper','clear-bell']);assert.equal(e.alive(1).length,0);assert.equal(births.filter(v=>/^hold-silence-|keeper-retaliation/.test(v.source)).length,12);assert.equal(a.holds['hold-silence'].progress,4);assert.equal(mem.count,1);assert.equal(mem.status,'settled');for(const wave of waveTelegraphs)assert(wave.warning&&wave.births.every(v=>v.turn>wave.warning.serial));assert(savedLabels.has('warning-continue')&&savedLabels.has('late-continue'),'Both production Continue boundaries reached');const boss=e.unit('act2-keeper');assert.equal(boss.hp,1);assert(boss.honroSubdued&&!boss.dead);
}}catch(error){validationFailure=error;}
assert.deepEqual(plain(b.items),initial.battle.items,'No consumables used');
const result={...provenance,completedAt:new Date().toISOString(),validationFailure:validationFailure?.message||null,phase:b.phase,round:b.round,stopReason,winnerReason:b.winnerReason,initialSeed:initial.battle.seed,initialRng:initial.battle.rng,initialEnemies:initial.battle.units.filter(u=>u.side===1).length,enemyDefeats:b.units.filter(u=>u.side===1&&u.dead).length,done:plain(a.done),hold:a.holds?.['hold-silence'],descent:mem,waveTelegraphs,wallSeconds:(performance.now()-started)/1000,segmentTiming:{simulationSeconds:(frames-segmentStart.frames)*C.STEP,storyPauseSeconds:(storyFrames-segmentStart.storyFrames)/60,botAttackPlanningSeconds:(attackPlanningMs-segmentStart.attackPlanningMs)/1000,nativePhysicsWallSeconds:(nativePhysicsMs-segmentStart.nativePhysicsMs)/1000},simulationSeconds:frames*C.STEP,storyPauseSeconds:storyFrames/60,botAttackPlanningSeconds:attackPlanningMs/1000,nativePhysicsWallSeconds:nativePhysicsMs/1000,controllerWallSecondsIncludingMovement:planningMs/1000,frames,engineApiCallCount:inputCount,actions:actions.length,acceptedPlayerActions:actions.filter(a=>['fire','fire-anchor','E','E-lamp','defend'].includes(a.op)).length,actionCounts:Object.fromEntries([...new Set(actions.map(a=>a.op))].map(op=>[op,actions.filter(a=>a.op===op).length])),entryRewardLimit:initial.battle.honroGrowth.limit,readinessXP:readiness.xp,readinessLevel:readiness.level,trainingBudget:Object.fromEntries(initial.profile.recruited.map(cls=>[cls,{earned:C.pointsEarned(initial.profile.heroes[cls]),spent:C.pointsSpent(initial.profile.heroes[cls],cls),statTraining:initial.profile.heroes[cls].statTraining,ranks:initial.profile.heroes[cls].ranks,loadout:initial.profile.loadouts[cls]}])),initialHeroes:initial.battle.units.filter(u=>u.side===0).map(u=>({cls:u.cls,level:u.level,hp:u.hp,maxHp:u.maxHp,ranks:u.ranks,loadout:u.loadout,focus:u.focus})),heroes:heroRows(),initialItems:initial.battle.items,items:b.items,damageTaken:damage.filter(d=>d.side===0).reduce((n,d)=>n+d.amount,0),damageDealt:damage.filter(d=>d.side===1).reduce((n,d)=>n+d.amount,0),deaths:damage.filter(d=>d.dead&&d.side===0),births,continues,basicResourceCosts:Object.fromEntries(Object.values(basic).map(id=>[id,[...new Set(resources.filter(v=>v.skill===id).map(v=>v.cost))]])),dialogueLines:dialogs.length,limits:['Prior-clear ledger is a first-clear/recruit reward fixture, not a Stages1–17 playthrough.','Native production App/Engine; DOM/render/storage and pause clock are test doubles.','A route graph and projectile simulations choose inputs; this is not browser UI, touch, human time, fun or balance approval.','All learned skills rank one, four legal real slots; only A01/M01/O01/S00 fired. Paid slot fillers are not used by the controller.','No consumables; no test-side actor pose/HP/focus/movement budget/objective writes after entry. Simulation and planning wall time are reported separately.']};
await writeFile(`${out}/result.json`,JSON.stringify(result,null,2));await writeFile(`${out}/wait-analysis.json`,JSON.stringify(analyzeWaits(actions,b.round,{rounds,turns,damage,births,notices,continues,resources,frames}),null,2));await writeFile(`${out}/trace.json`,JSON.stringify({actions,rounds,turns,damage,births,notices,dialogs,continues,impacts,resources},null,2));await writeFile(`${out}/final-battle.json`,JSON.stringify(b));if(b.phase==='won'&&!validationFailure){try{app.export();const victoryProfile=await h.exported();await writeFile(`${out}/victory-profile.json`,JSON.stringify({profile:victoryProfile,battle:plain(b),beforeReward,provenance},null,2));const original19=JSON.parse(await readFile('tests/fixtures/stage18-bell-before.json','utf8')).stages[1],arrival=enterStage19(g,h,app,b,beforeReward,original19);await writeFile(`${out}/stage19-entry.json`,JSON.stringify(arrival,null,2));result.stage19Entry=arrival.summary;}catch(error){validationFailure=error;result.validationFailure=error.message;}await writeFile(`${out}/result.json`,JSON.stringify(result,null,2));}console.log('RESULT',JSON.stringify(result));if(validationFailure)throw validationFailure;if(b.phase!=='won'&&!(rolePrefix&&a.done.silence))process.exitCode=1;
