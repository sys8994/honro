/** Released reviewed-v4 App/Engine; DOM/render/storage/clock doubles.
 * Declared synthetic entry-level party, not earned campaign history. After
 * initialization only production inputs and ticks change gameplay state. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {representativeMelee} from './stage18-bell-fullplay-helper.mjs';
import {navigator} from './act2-complex-navigation.mjs';
import {auditQuarryEngine} from './stage12-quarry-fullplay-helper.mjs';
const id=Number(process.argv[2]||11),policy=process.argv[3]||'objective',seed=Number(process.argv[4]||101),out=process.env.HONRO_QA_OUT||`_local/reports/act2-gameplay-20261103/${id}-${policy}-${seed}`;
assert(id>=11&&id<=20);assert(['objective','survival','height','retreat'].includes(policy));
const h=await appHarness({productionStory:true}),{g,C}=h;
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const profile=h.profileThrough(id-1),entryLevel=g.HonroProgression.plan(id).entryLevel;
profile.settings.difficulty='normal';profile.settings.debugMode=false;
const slots={archer:policy==='height'?['A01','A14','A11','A05']:policy==='retreat'?['A01','A02','A09','A05','AP03']:['A01','A02','A09','A05'],mage:policy==='survival'?['M01','M10','M03','M11']:['M01','M04','M03','M11'],knight:['S00','S03','S05','S09'],occultist:['O01','O02','O08','O11']};
const training=[];
for(const cls of profile.recruited){const hero=profile.heroes[cls];hero.xp=g.HonroProgression.rewardXpAt(entryLevel);C.resetTalents(hero,cls);const buy=key=>{if(hero.ranks[key])return true;const talent=C.TALENT_MAP[key];if(!talent)return false;if(talent.prereq&&!buy(talent.prereq))return false;if(C.trainReason(hero,key))return false;assert(C.train(hero,key));training.push({cls,key});return true;};for(const key of slots[cls])buy(key);profile.loadouts[cls]=slots[cls].filter(k=>hero.ranks[k]);C.sanitizeLoadout(profile,cls);for(let n=0;n<4;n++)if(C.investStat(hero,cls))training.push({cls,stat:true});while(C.pointsLeft(hero,cls)>0){const choices=profile.loadouts[cls].filter(k=>!C.trainReason(hero,k)).sort((a,z)=>(hero.ranks[a]||0)-(hero.ranks[z]||0));if(!choices.length){if(!C.investStat(hero,cls))break;}else assert(C.train(hero,choices[0]));}assert(C.pointsSpent(hero,cls)<=C.pointsEarned(hero));}
function advanceDialogue(a){for(let n=0;a.dialogue&&n<500;n++){now+=250;g.HonroStory.tick(a,now);g.HonroStory.next(a);}assert(!a.dialogue,'Sequential production dialogue-next must reach a boundary');}
const resumePath=process.env.HONRO_QA_RESUME;assert(resumePath,'Continuation requires exact exported profile');const resume=JSON.parse(await readFile(resumePath,'utf8'));
const app=h.load(resume.profile);let now=0;g.performance={now:()=>now};app.continue();advanceDialogue(app);assert(app.engine,'App Continue');const e=app.engine,b=e.b,canonical=g.HONRO_PROJECT.stages[id-1];
// A continuation preserves the saved RNG and never assigns seed or rng.
assert.equal(b.honroStage,id);assert.equal(b.difficulty,'normal');assert(g.HonroAct23V4.active(b));
const actualEntry=resume.provenance.actualEntry;
const provenance={actualEntry,continuationOf:{path:resumePath,sha256:hash(await readFile(resumePath,'utf8')),round:b.round,seed:b.seed,rng:b.rng,originalProvenance:resume.provenance},checkoutCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),runnerSha256:hash(await readFile(new URL(import.meta.url),'utf8')),navigationSha256:hash(await readFile(new URL('./act2-complex-navigation.mjs',import.meta.url),'utf8')),projectSha256:hash(g.HONRO_PROJECT),stageSha256:hash(canonical),geometrySha256:hash({terrains:canonical.terrains,routes:canonical.routes,units:canonical.units,initialState:canonical.initialState}),entryProfileSha256:hash(resume.profile),entryLevel,policy,seed,scope:'Synthetic legacy-budget rewardXpAt(plan.entryLevel), legal training, production-auto-equipped basic recruitment weapons. Prior clearance flags only unlock requested chapter; no claim earlier chapters were played. Production reviewed-v4 App/Engine with DOM/storage/render/clock doubles and sequential Story.next; not browser input.'};
await mkdir(out,{recursive:true});await writeFile(out+'/initial.json',JSON.stringify({provenance,profile:resume.profile,training:[],battle:plain(b)},null,2));
const actions=[],rounds=[],damage=[],births=[],notices=[];let frames=0,lastRound=0,stopReason=null,nav,navKey;
const record=r=>actions.push({round:b.round,frame:frames,goal:g.HonroAct2.current(b)?.id,...plain(r)}),ready=()=>app.canInput(),dist=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y),hpFraction=u=>u.hp/u.maxHp;
const audit=auditQuarryEngine(b,e,()=>({round:b.round,frame:frames}));const known=new Set(b.units.map(u=>u.id));
const hurt=e.hurt.bind(e);e.hurt=function(...args){const before=new Map(b.units.map(u=>[u.id,{hp:u.hp,shield:u.shield||0,side:u.side}]));const result=hurt(...args);for(const u of b.units){const old=before.get(u.id);if(old&&old.hp>u.hp)damage.push({round:b.round,frame:frames,target:u.id,side:old.side,hpDamage:old.hp-u.hp,dead:u.dead,source:args[2]??null,skill:args[4]?.skill??args[7]??null,shot:args[4]?.shot??b.shot,maxHp:u.maxHp,shieldLoss:Math.max(0,old.shield-(u.shield||0))});}return result;};
const event=app.event.bind(app);app.event=(text,...args)=>{notices.push({round:b.round,frame:frames,text});return event(text,...args);};
const tick=()=>{now+=1000/60;audit.production(()=>{if(!app.dialogue){e.tick(C.STEP);if(!app.dialogue)app.missionTick(C.STEP);}g.HonroStory.tick(app,now);if(app.dialogue)advanceDialogue(app);});audit.guard();for(const u of b.units)if(!known.has(u.id)){known.add(u.id);births.push({round:b.round,frame:frames,id:u.id,side:u.side,cls:u.cls,source:u.honroSpawnSource,x:u.x,y:u.y});}frames++;};
function navigation(){const key=id===12?g.HonroStage12Quarry.memory(b).gate:id===18?g.HonroStage18Bell.memory(b).status:'default';if(nav&&key===navKey)return;navKey=key;let routes=id===12?canonical.design.quarry.routes.filter(r=>r.quarryState!=='open'||key==='open'):canonical.design.space.routes;// Route source IDs can be authored aliases; resolve against actual compiled support.
 const resolve=s=>b.terrain.find(t=>t.id===s||t.honroSpaceSurfaceId===s)?.id||s;
 routes=plain(routes).map(r=>({...r,anchors:r.anchors.map(p=>({...p,surfaceId:resolve(p.surfaceId),...(p.jumpTo?{jumpTo:{...p.jumpTo,support:resolve(p.jumpTo.support)}}:{}),...(p.dropTo?{dropTo:{...p.dropTo,support:resolve(p.dropTo.support)}}:{})}))}));
 // New reviewed-v4 shot rock is not in legacy authored routes. Real contact
 // poses propose navigation inputs; they never move actors or assert reachability.
 for(const t of b.terrain.filter(t=>t.honroV4FiringRock)){const anchors=[];for(let x=t.x+8;x<t.x+t.w-8;x+=24){const y=C.topAt(t,x);if(C.validTerrainContactPose(b.terrain,{...e.active,x,y}))anchors.push({x,y,surfaceId:t.id});}if(anchors.length)routes.push({id:'compiled-contact-'+t.id,anchors});}
 if(id===11){const rock='v4.11.firing-rock',base=b.terrain.find(t=>t.id==='rv-west-shoulder');routes.push({id:'reviewed-rock-step-inputs',anchors:[{x:820,y:6400,surfaceId:rock,jumpTo:{x:940,support:rock,speed:.65}},{x:940,y:6300,surfaceId:rock,jumpTo:{x:1060,support:rock,speed:.65}},{x:1060,y:6200,surfaceId:rock,jumpTo:{x:1180,support:rock,speed:.65}},{x:1180,y:6100,surfaceId:rock,dropTo:{x:1320,support:base.id,stepOffX:1290,speed:.65}},{x:1320,y:C.topAt(base,1320),surfaceId:base.id}]});}
 nav=navigator(g,b,e,{tick,ready,record,stageId:id,routes});}
async function save(label){app.export();const p=await h.exported();await writeFile(out+'/'+label+'.json',JSON.stringify({provenance,profile:p,b:plain(b),actions,rounds,damage,births,notices,frames,audit:{externalWrites:audit.log.externalWrites,recoveries:audit.log.recoveries}}));}
function fireAt(u,target){const spirit=target.honroSpirit&&!target.manifested;let skills=u.loadout.map(k=>C.SKILLS[k]).filter(s=>s&&s.damage>0&&!s.passive&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus);skills.sort((a,z)=>(spirit?Number(z.id==='O08')-Number(a.id==='O08'):0)||z.damage-a.damage);
 for(const skill of skills.slice(0,3)){let best=null;if(skill.martial&&skill.branch==='sword')best=representativeMelee(g,e,u,target,skill.id);else{for(const aim of e.shotSeeds(u,skill,target)){const v=C.shotViable(e,u,skill,target,aim.angle,aim.power);if((v.ok||target.hp<=2&&v.enemyDamage>0)&&v.risk<1&&v.miss<Math.max(85,skill.radius+target.r+55)&&(!best||v.net>best.net))best={...aim,net:v.net};}if(!best&&skill===skills[0]){const direct=Math.atan2(u.y-u.h*.6-(target.y-target.h*.5),target.x-u.x)*180/Math.PI;const angles=[direct,...(target.x>=u.x?[25,45,65,80]:[100,115,135,155])];for(const angle of angles)for(const power of [1,.6]){const v=C.shotViable(e,u,skill,target,angle,power);if((v.ok||target.hp<=2&&v.enemyDamage>0)&&v.risk<1&&v.miss<Math.max(85,skill.radius+target.r+55)&&(!best||v.net>best.net))best={angle,power,net:v.net};}}}
 if(best&&e.fire(skill.id,best.angle,best.power)){record({op:'fire',hero:u.cls,skill:skill.id,target:target.id,angle:best.angle,power:best.power,hpBefore:target.hp,position:{x:u.x,y:u.y}});return true;}}
 return false;
}
function healStake(u){if(u.cls!=='mage'||!u.loadout.includes('M10')||e.cooldownLeft(u,'M10')>0||e.manaCost(C.SKILLS.M10,u)>u.focus)return false;const hurt=e.heroesAlive().filter(v=>hpFraction(v)<.70&&dist(v,u)<1800).sort((a,z)=>hpFraction(a)-hpFraction(z));const target=hurt[0];if(!target||(b.stakes||[]).some(s=>s.skill==='M10'&&s.expires>b.round+1&&dist(s,target)<180))return false;let best=null;for(const aim of e.shotSeeds(u,C.SKILLS.M10,target)){const hit=e.predict(u,C.SKILLS.M10,aim.angle,aim.power),d=dist(hit,target);if(hit.terrain&&Math.abs(hit.y-target.y)<70&&d<100&&(!best||d<best.d))best={...aim,d};}if(best&&e.fire('M10',best.angle,best.power)){record({op:'heal-stake',hero:u.cls,skill:'M10',target:target.id,...best});return true;}return false;}
function interact(){for(const s of g.HonroAct2.readySteps(b)){if(s.optional&&policy!=='height')continue;const m=b.honroMarkers.find(m=>m.id===s.id);if(m?.action&&g.HonroInteractions.eligibility(app,m).ok&&audit.production(()=>g.HonroInteractions.use(app,m))){record({op:'E',hero:e.active?.cls,target:m.id});return true;}}return false;}
const started=performance.now(),roundLimit=Number(process.env.HONRO_QA_ROUND_LIMIT||45),actionLimit=Number(process.env.HONRO_QA_ACTION_LIMIT||280);
for(let turn=0;turn<actionLimit&&!['won','lost'].includes(b.phase);turn++){
 if(global.gc)global.gc(); // optional QA harness memory control, no gameplay writes
 for(let i=0;!ready()&&!['won','lost'].includes(b.phase)&&i<30000;i++)tick();if(['won','lost'].includes(b.phase))break;if(!ready()){stopReason='controller no-input observation limit';break;}
 navigation();
 if(lastRound!==b.round){lastRound=b.round;rounds.push({round:b.round,goal:g.HonroAct2.current(b)?.id,done:plain(g.HonroAct2.memory(b).done),heroes:e.heroesAlive().map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,focus:u.focus,x:u.x,y:u.y,support:nav.surface(u)})),enemies:e.alive(1).length,projectiles:b.projectiles.length});console.log('ROUND',id,policy,seed,JSON.stringify(rounds.at(-1)));await save('checkpoint');if(b.round>roundLimit){stopReason='diagnostic round bound; unfinished, not game loss';break;}}
 // Timed in-world story and NPC tasks advance under actual mission ticks.
 const prior=g.HonroAct2.current(b)?.id;for(let n=0;n<(id===20&&['escort-mid','hold-convoy','escape'].includes(prior)?600:90)&&ready()&&g.HonroAct2.current(b)?.id===prior;n++)tick();if(!ready())continue;
 let goal=g.HonroAct2.current(b);if(!goal){for(let n=0;n<180&&ready();n++)tick();goal=g.HonroAct2.current(b);}
 const specialist=goal?.requiredClass&&e.heroesAlive().find(u=>u.cls===goal.requiredClass&&!u.acted);if(specialist)e.select(specialist.id);
 const bellBlocker=id===18&&goal?.id==='18.settle'?g.HonroAct23V4Stage18.memory(b).bell.blockers?.find(q=>q.kind==='hero'&&!e.unit(q.id)?.acted):null;if(bellBlocker)e.select(bellBlocker.id);
 // Before restoring the solid east support, place one real actor on its east
 // side. Keep that actor there until the east lock can be operated normally.
 const eastLock=id===18?b.honroMarkers.find(m=>m.id==='18.lock-east'):null;
 const eastKnight=id===18?e.heroesAlive().find(v=>v.cls==='knight'):null;
 const eastReady=!!(eastKnight&&eastLock&&dist(eastKnight,eastLock)<190);
 if(id===18&&goal?.id==='18.support'&&!eastReady&&eastKnight&&!eastKnight.acted)e.select(eastKnight.id);
 const u=e.active;if(!u||u.side!==0||u.dead){stopReason='no usable hero';break;}
 if(bellBlocker&&u.id===bellBlocker.id){const target=b.honroMarkers.find(m=>m.id==='18.brake');nav.advance(u,target,false);if(ready()){record({op:'defend-clear-sweep',hero:u.cls,position:{x:u.x,y:u.y}});audit.production(()=>app.defend());}continue;}
 if(id===18&&goal?.id==='18.support'&&!eastReady){if(u.id===eastKnight?.id)nav.advance(u,eastLock,false);if(ready()){record({op:'defend-position-east',hero:u.cls,position:{x:u.x,y:u.y}});audit.production(()=>app.defend());}continue;}
 if(id===18&&['18.settle','18.lock-west'].includes(goal?.id)&&u.id===eastKnight?.id&&eastReady){record({op:'defend-hold-east',hero:u.cls,position:{x:u.x,y:u.y}});audit.production(()=>app.defend());continue;}
 if(interact())continue;
 if(policy==='survival'&&goal?.id!=='20.ring'&&healStake(u))continue;
 const marker=b.honroMarkers.find(m=>m.id===goal?.id),spirit=goal?.spiritId&&e.unit(goal.spiritId),weak=spirit&&(spirit.dead||spirit.hp<=spirit.maxHp*.4);
 let destination=marker||g.HonroObjectives.state(b,app.stage).targets[0],targetIds=new Set(goal?.defeatIds||[]);
 if(goal?.kind==='clear'&&!goal.defeatIds)for(const v of e.alive(1))if(goal.cohorts?v.honroCohort===goal.cohorts:marker&&dist(v,marker)<(goal.radius||650))targetIds.add(v.id);
 if(goal?.kind==='v4-extract'&&spirit&&!weak)targetIds.add(spirit.id);
 if(id===18&&goal?.id==='18.keeper')targetIds.add('act2-keeper');
 if(id===20&&goal?.id==='clear-pass')for(const key of g.HonroAct23V4.mem(b).convoyAmbush?.ids||[])if(!e.unit(key)?.dead)targetIds.add(key);
 if(id===15&&goal?.id==='15.knocks'){const m=g.HonroAct23V4Reviewed15?.memory?.(b);for(const v of e.alive(1))if(v.honroSpawnSource==='reviewed.15.merge-pair'||marker&&dist(v,marker)<420)targetIds.add(v.id);}
 if(id===11){const q=g.HonroAct23V4Chapter11.memory(b);for(const key of [...q.release.ids,...q.north.ids])if(!e.unit(key)?.dead)targetIds.add(key);}
 if(id===12&&goal?.id==='12.recurrence'){const loop=g.HonroAct23V4Act2Scenes.memory(b).loop;destination=loop?.phase==='out'?b.honroV4Recurrence.checkpoint:b.honroV4Recurrence.landmark;}
 if(goal?.kind==='route')destination=b.honroMarkers.find(m=>m.id===(policy==='height'?'route-upper-exit':'route-lower-exit'))||destination;
 if(goal?.target&&['v4-extract','v4-rescue'].includes(goal.kind)&&(!spirit||weak))destination=e.unit(goal.target)||destination;
 if(id===18&&['18.descent','18.rescue'].includes(goal?.id)){
  if(goal.id==='18.descent')destination=b.honroMarkers.find(m=>m.id==='18.brake');
  // Re-ascend the actual incline before another gallery approach after a fall.
  if(u.x>9300&&u.x<9650&&u.y>6500){const t=b.terrain.find(t=>t.id==='sb-east-inner-rise');destination={id:'gallery-approach',x:9880,y:C.topAt(t,9880)};}
 }
 if(id===20&&['escort-mid','hold-convoy','escape'].includes(goal?.id)){
  const injured=e.unit('objective'),care=g.HonroAct23V4Act3.convoyCare(b).injured;
  if(injured&&!injured.dead&&(goal.id!=='escape'||dist(injured,b.honroMarkers.find(m=>m.id==='escape'))>110))destination={id:'escort-injured',x:injured.x+100,y:injured.y};
  else {const convoy=(b.honroV4Convoy||[]).map(id=>e.unit(id)).filter(v=>v&&!v.dead);if(convoy.length)destination={id:'escort-rear',x:Math.min(...convoy.map(v=>v.x))+550,y:convoy[0].y};}
 }
 const convoyDistance=v=>Math.min(Infinity,...(b.honroV4Convoy||[]).map(k=>e.unit(k)).filter(n=>n&&!n.dead).map(n=>dist(v,n)));
 const convoyThreat=v=>id===20&&goal?.id==='clear-pass'&&convoyDistance(v)<1600;
 let foes=e.alive(1).filter(v=>!(id===18&&v.id==='act2-keeper'&&!g.HonroAct23V4Stage18.memory(b).rescueSafe)&&!v.honroObjectiveTarget&&(g.HonroAct2.visible(b,v)||v.id===spirit?.id)&&!(weak&&v.id===spirit?.id)).sort((a,z)=>Number(convoyThreat(z))-Number(convoyThreat(a))||(convoyThreat(a)&&convoyThreat(z)?convoyDistance(a)-convoyDistance(z):0)||Number(targetIds.has(z.id))-Number(targetIds.has(a.id))||dist(a,u)-dist(z,u));
 const urgent=foes.find(v=>targetIds.has(v.id)),near=foes.filter(v=>dist(v,u)<(policy==='survival'?1500:1100));
 // Recovery is a committed action, never followed by pursuit in the same turn.
 if(policy==='survival'&&hpFraction(u)<.28){const threat=near[0];if(threat){const points=canonical.design.space.routes.flatMap(r=>r.anchors).filter(p=>dist(p,u)<1000&&dist(p,threat)>dist(u,threat)+250).sort((a,z)=>dist(z,threat)-dist(a,threat));if(points[0])nav.advance(u,points[0],false);}if(ready()){if(b.items.heal>0&&audit.production(()=>e.item('heal')))record({op:'heal-item-retreat',hero:u.cls});else{record({op:'defend-retreat',hero:u.cls});audit.production(()=>app.defend());}}continue;}
 let fired=false;for(const t of near.filter(v=>targetIds.has(v.id)||(policy==='survival'&&goal?.id!=='20.ring')).slice(0,3))if(fireAt(u,t)){fired=true;break;}if(fired)continue;
 // The side approach meets the gallery lip at a downhill seam. Offer an
 // ordinary jump input before stepping left; actual physics decides the landing.
 if(id===18&&['18.descent','18.rescue'].includes(goal?.id)&&u.x>=9650&&u.x<9900&&u.y<6500&&e.grounded(u)&&u.moveLeft>350&&e.jump(u)){
  const from={x:u.x,y:u.y};record({op:'jump-gallery-seam',hero:u.cls,from});
  for(let n=0;n<240&&ready();n++){if(u.x>9470)e.move(-.65,C.STEP);tick();if(n>20&&e.grounded(u))break;}
  record({op:'gallery-seam-landing',hero:u.cls,position:{x:u.x,y:u.y},support:nav.surface(u)});nav.clear(u.id);
 }
 if(urgent){destination=urgent;nav.advance(u,{...destination,approachRange:policy==='height'&&u.cls!=='knight'?700:undefined},true);}else if(destination)nav.advance(u,destination,false);
 if(!ready())continue;if(interact())continue;
 foes=foes.filter(v=>!v.dead&&dist(v,u)<1400);for(const t of foes.slice(0,3))if(fireAt(u,t)){fired=true;break;}
 if(!fired){record({op:'defend',hero:u.cls,position:{x:u.x,y:u.y},moveLeft:u.moveLeft});audit.production(()=>app.defend());}
}
if(!['won','lost'].includes(b.phase)&&!stopReason)stopReason='controller action budget; unfinished, not game loss';
await save('terminal');
let appSettlement={attempted:false};
if(['won','lost'].includes(b.phase)){
 audit.production(()=>{app.outcome();if(app.dialogue)advanceDialogue(app);});audit.guard();
 appSettlement={attempted:true,done:!!app.done,clear:plain(app.profile.cleared?.[id]||null),history:plain(app.profile.honroAct23V4History?.stages?.[id]||null),dialogueOpen:!!app.dialogue};
 await save('settled');
}
const result={...provenance,appSettlement,phase:b.phase,round:b.round,stopReason,seconds:(performance.now()-started)/1000,remainingEnemies:e.alive(1).length,kills:b.kills,heroes:e.heroesAlive().map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp})),fallen:b.units.filter(u=>u.side===0&&!u.summoned&&u.dead).map(u=>u.id),done:plain(g.HonroAct2.memory(b).done),actions:actions.length,skills:Object.fromEntries([...new Set(actions.filter(a=>a.skill).map(a=>a.skill))].map(s=>[s,actions.filter(a=>a.skill===s).length])),hpDamageTaken:damage.filter(d=>d.side===0).reduce((n,d)=>n+d.hpDamage,0),hpDamageDealt:damage.filter(d=>d.side===1).reduce((n,d)=>n+d.hpDamage,0),externalWrites:audit.log.externalWrites,engineRecoveries:audit.log.recoveries,combatCycles:id===19?0:Math.max(0,b.round-1),displayRound:b.round,twentyRoundGate:b.phase==='won'&&b.round<=20,releaseApproved:false};await writeFile(out+'/result.json',JSON.stringify(result,null,2));console.log('RESULT',JSON.stringify(result));assert.equal(audit.log.externalWrites.length,0);if(b.phase!=='won')process.exitCode=1;
