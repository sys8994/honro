/** Continue the unmodified R62 Stage17 density checkpoint on its exact archived
 * runtime. Fixed authored route anchors replace the failed graph shortcut. This
 * is a normal-resource recovery segment, not a fresh/full browser playthrough.
 * No actor/profile/resource/objective setup writes or locomotion refills.
 * Exactly one authored response: Sodan climbs the central service return,
 * clears west/east upper spirits, then clears the notes-room pair and uses E.
 *
 * HONRO_RECOVERY_ROOT=<archived checkout> HONRO_RECOVERY_CHECKPOINT=<checkpoint>
 * HONRO_RECOVERY_OUT=<output> node tests/stage17-density-recovery.mjs
 * HONRO_RECOVERY_PREPARE_ONLY=1 checks provenance/Continue without any inputs.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const mainRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.resolve(process.env.HONRO_RECOVERY_ROOT||'/workspace/shared/honro-encounter-density-act2-evidence-20261010');
const checkpointPath=path.resolve(process.env.HONRO_RECOVERY_CHECKPOINT||path.join(mainRoot,'_local/reports/encounter-density/stage17-resumed/checkpoint.json'));
const out=path.resolve(process.env.HONRO_RECOVERY_OUT||path.join(mainRoot,'_local/reports/encounter-density/stage17-recovery'));
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const checkpointBytes=await readFile(checkpointPath,'utf8'),saved=JSON.parse(checkpointBytes);
process.chdir(root);
const {appHarness,plain}=await import(pathToFileURL(path.join(root,'tests/app-regression-helpers.mjs')));
const {runtimeParts}=await import(pathToFileURL(path.join(root,'shared/build.mjs')));
const h=await appHarness(),{g,C}=h;
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const sourceHash=hash(g.HONRO_PROJECT),runtimeSha256=hash((await runtimeParts({vector:false,render:false})).join('\n'));
assert.equal(sourceHash,saved.sourceHash,'Exact source used by the failed normal run');
assert.equal(runtimeSha256,saved.runtimeSha256,'Exact runtime used by the failed normal run');
let virtualMs=saved.virtualMs||0;g.performance={now:()=>virtualMs};
const app=h.load(saved.profile);app.continue();const e=app.engine,b=e.b;
assert.equal(b.honroStage,17);assert.equal(b.difficulty,'normal');assert.equal(b.round,62);
assert.deepEqual(plain(b),saved.profile.honroBattle,'Production Continue preserves the entire exact saved battle');
assert.deepEqual(plain(app.profile.heroes),saved.profile.heroes,'No XP/training setup');
assert.deepEqual(plain(app.profile.loadouts),saved.profile.loadouts,'Existing purchased loadouts only');
const hero=e.unit('p-occultist');
assert(hero&&!hero.dead);assert.equal(e.alive(1).length,4);
assert.deepEqual(plain(hero.loadout),['O01','O02','O04','O08']);
const stage=g.HONRO_PROJECT.stages[16],routes=stage.design.space.routes;
const anchors=(id,from=0,to=Infinity)=>{const route=routes.find(r=>r.id===id);assert(route,id);return route.anchors.slice(from,to).map((p,i)=>({...plain(p),route:id,anchorIndex:from+i}));};
const walk=(id,from,to)=>anchors(id,from,to).map(({jumpTo,dropTo,...p})=>p);
// The saved Sodan is on the lower reflection pier. Walk off its west end,
// ascend the authored central service steps, then reverse only the ordinary
// middle walkway. The documented main bridge gap has a legal reverse jump.
// Traverse the upper route west-to-east, retaining its irreversible drop.
const upper=anchors('upper-hoist-route');
upper[9].targetIds=['ws-upper-echo'];upper[15].targetIds=['a2-enemy-18'];
const route=[
 {x:6400,y:C.topAt(b.terrain.find(t=>t.id==='act2-floor'),6400),surfaceId:'act2-floor',route:'saved-pier-west-exit'},
 ...anchors('service-middle-link'),
 {...walk('main',12,13)[0],jumpTo:{x:5160,support:'ws-hoist-west-lip',speed:1},route:'main-legal-reverse-gap'},
 ...walk('main',5,12).reverse(),...upper,
 ...walk('main',20,24),
 {...walk('main',23,24)[0],targetIds:['ws-notes-echo','event-231'],route:'notes-firing-post'}
];
const provenance={sourceHash,runtimeSha256,checkpointPath,checkpointSha256:hash(checkpointBytes),controllerSha256:hash(await readFile(fileURLToPath(import.meta.url),'utf8')),checkoutCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),previousProvenance:saved.provenance,route,checkpointSelection:'R62 actual failed controller checkpoint. No fresh run or battle/resource/position setup.',scope:'Normal-resource continuation of the actual failed run on its original source/runtime, fixed authored route and production inputs. DOM/render/storage/clock are test doubles; not browser/human-time evidence.'};
await mkdir(out,{recursive:true});
await writeFile(path.join(out,'provenance.json'),JSON.stringify(provenance,null,2));
await writeFile(path.join(out,'initial.json'),JSON.stringify({profile:plain(app.profile),battle:plain(b),provenance}));
if(process.env.HONRO_RECOVERY_PREPARE_ONLY==='1'){console.log('PREPARED',JSON.stringify({sourceHash,runtimeSha256,round:b.round,anchors:route.length,exactContinue:true}));process.exit(0);}

const actions=[],turns=[],damage=[],resources=[],notices=[],dialogs=[],impacts=[];
let targets=[],frames=0,storyFrames=0,index=0,air=null,still=0,lastSerial=-1,stopReason=null,allowed=0,externalWrites=0,recoveries=0;
const started=performance.now(),initial=plain(b),initialProfile=plain(app.profile),terminal=()=>['won','lost'].includes(b.phase);
const surface=u=>e.contactSurface(u.x,u.y-5,u.y+5)?.t?.id;
const pose=u=>({x:u.x,y:u.y,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft,support:surface(u),dead:!!u.dead});
const record=row=>actions.push({round:b.round,frame:frames,turn:b.honroState.actorTurnSerial,active:b.active,...plain(row)});
const production=fn=>{allowed++;try{return fn();}finally{allowed--;}};
// Catch every test-side write to actor pose/resources or paid hero growth.
for(const [object,keys] of [...b.units.map(u=>[u,['x','y','hp','focus','moveLeft']]),...Object.values(app.profile.heroes).map(u=>[u,['xp','statTraining']])])for(const key of keys){
 let value=object[key];if(value===undefined)continue;
 Object.defineProperty(object,key,{enumerable:true,configurable:true,get(){return value;},set(next){if(!allowed){externalWrites++;throw Error('Forbidden test-side '+key+' write');}value=next;}});
}
const recover=e.recover.bind(e);e.recover=(u,...args)=>{if(u?.side===0){recoveries++;throw Error('Hero recovery/teleport forbidden');}return recover(u,...args);};
const hurt=e.hurt.bind(e);e.hurt=(u,...args)=>{const before=u.hp,side=u.side,result=hurt(u,...args);if(u.hp<before)damage.push({round:b.round,frame:frames,turn:b.honroState.actorTurnSerial,target:u.id,side,owner:args[1],amount:before-u.hp,remaining:u.hp,dead:!!u.dead,skill:args[6]||args[3]?.skill});return result;};
const impact=e.impact.bind(e);e.impact=(p,hit)=>{impacts.push({round:b.round,frame:frames,owner:p.owner,skill:p.skill,x:hit.x,y:hit.y,unit:hit.unit?.id,terrain:hit.terrain?.id});return impact(p,hit);};
const event=app.event.bind(app);app.event=text=>{notices.push({round:b.round,frame:frames,text});return event(text);};
function stories(){
 if(app.dialogue){dialogs.push({round:b.round,frame:frames,title:app.dialogue.title,index:app.dialogue.index,line:plain(app.dialogue.lines[app.dialogue.index])});production(()=>g.HonroStory.next(app));storyFrames++;virtualMs+=1000/60;return true;}
 if(['aim','enemy','ally','summon'].includes(b.phase))production(()=>g.HonroStory.turn(app));
 if(g.HonroStory.turnPaused(app)){storyFrames++;virtualMs+=1000/60;return true;}return false;
}
function tick(){
 virtualMs+=C.STEP*1000;production(()=>{e.tick(C.STEP);if(!app.dialogue)app.missionTick(C.STEP);});frames++;
 const serial=b.honroState.actorTurnSerial||0;if(serial!==lastSerial){lastSerial=serial;turns.push({round:b.round,frame:frames,turn:serial,phase:b.phase,active:b.active,routeIndex:index,heroes:e.heroesAlive().map(u=>({id:u.id,...pose(u)})),enemies:e.alive(1).map(u=>({id:u.id,...pose(u)}))});}
}
function defend(reason){const u=e.active,before=pose(u);record({op:'defend',hero:u.cls,reason,before});production(()=>app.defend());resources.push({round:b.round,frame:frames,hero:u.cls,op:'defend',before,after:pose(u)});}
function move(x,speed=1){if(Math.abs(hero.x-x)>3)production(()=>e.move(Math.sign(x-hero.x)*speed,C.STEP));}
function advance(){
 const start=pose(hero);let age=0;
 for(;age<9000&&app.canInput()&&index<route.length;age++){
  const p=route[index];
  if(air){const target=air.target,isDrop=air.kind==='drop',x=isDrop&&!air.departed?target.stepOffX:target.x;move(x,target.speed||(isDrop?1:.35));tick();air.frames++;
   if(isDrop&&!air.departed&&Math.abs(hero.x-target.stepOffX)<8&&hero.y>air.startY+8)air.departed=true;
   if(e.grounded(hero)&&(isDrop?air.departed&&surface(hero)===target.support&&Math.abs(hero.x-target.x)<18:air.frames>60)){
    if(surface(hero)!==target.support)throw Error('Authored '+air.kind+' landed on '+surface(hero)+' instead of '+target.support);
    record({op:'land',hero:hero.cls,route:p.route,anchorIndex:p.anchorIndex,kind:air.kind,to:pose(hero),expected:target.support});air=null;index++;still=0;continue;
   }
   if(air.frames>1200)throw Error('Authored crossing did not land');continue;
  }
  if(hero.moveLeft<12)break;
  const reached=Math.abs(hero.x-p.x)<18&&Math.abs(hero.y-p.y)<85&&e.grounded(hero);
  if(reached){
   if(p.jumpTo||p.dropTo){const target=p.jumpTo||p.dropTo,kind=p.jumpTo?'jump':'drop';
    if(hero.moveLeft<(kind==='jump'?e.jumpCost(hero):0)+Math.abs(target.x-hero.x)+100)break;
    if(p.jumpTo&&!production(()=>e.jump(hero)))throw Error('Ordinary authored jump rejected');
    air={kind,target,frames:0,startY:hero.y,departed:target.stepOffX===undefined};record({op:kind,hero:hero.cls,route:p.route,anchorIndex:p.anchorIndex,from:pose(hero),target});
   }else{record({op:'anchor',hero:hero.cls,route:p.route,anchorIndex:p.anchorIndex,position:pose(hero)});index++;still=0;if(p.targetIds){targets=p.targetIds.map(id=>e.unit(id));break;}}continue;
  }
  const before=pose(hero);move(p.x,Math.abs(hero.x-p.x)<22?.35:1);
  if(e.grounded(hero)&&(still>20||Math.abs(hero.x-p.x)<24&&hero.y-p.y>100)){
   if(hero.moveLeft<e.jumpCost(hero)+100)break;
   if(production(()=>e.jump(hero))){record({op:'ordinary-step-jump',hero:hero.cls,route:p.route,anchorIndex:p.anchorIndex,from:before,goal:p});still=0;}
  }
  tick();still=Math.hypot(before.x-hero.x,before.y-hero.y)<.015?still+1:0;
  if(still>180)throw Error('Fixed authored route blocked at '+p.route+':'+p.anchorIndex);
 }
 if(age>=9000)throw Error('Fixed route segment exceeded movement observation bound');
 for(let n=0;n<1200&&app.canInput()&&!e.grounded(hero);n++)tick();
 record({op:'move-segment',hero:hero.cls,from:start,to:pose(hero),routeIndex:index});
}
function attack(target){
 for(const id of ['O04','O01','O08']){
  assert(hero.loadout.includes(id)&&hero.ranks[id]===saved.profile.honroBattle.units.find(u=>u.id===hero.id).ranks[id],'Existing saved purchased rank '+id);const s=C.SKILLS[id];
  for(const aim of e.shotSeeds(hero,s,target)){
   if(e.manaCost(s,hero,aim.power)>hero.focus)continue;
   const v=C.shotViable(e,hero,s,target,aim.angle,aim.power);if(!v.ok||v.risk>=1)continue;
   const before=pose(hero),hpBefore=target.hp,cost=e.manaCost(s,hero,aim.power);
   if(!production(()=>e.fire(id,aim.angle,aim.power)))continue;
   assert.equal(before.focus-hero.focus,cost,'Actual production mana charge');
   resources.push({round:b.round,frame:frames,hero:hero.cls,skill:id,cost,before,after:pose(hero)});
   record({op:'fire',hero:hero.cls,skill:id,target:target.id,hpBefore,from:before,angle:aim.angle,power:aim.power,prediction:{damage:v.enemyDamage,risk:v.risk,unit:v.hit.unit,terrain:v.hit.terrain}});return true;
  }
 }return false;
}
let failure=null;
try{
 for(let action=0;action<180&&!terminal();action++){
  while(!app.canInput()&&!terminal()){if(stories())continue;tick();if(frames>150000)throw Error('Recovery simulation observation bound');}
  if(terminal())break;
  if(e.active.id!==hero.id){defend('Other companions remain at their actual saved exit posts');continue;}
  targets=targets.filter(u=>!u.dead);
  if(!targets.length&&index<route.length)advance();
  if(!app.canInput()||terminal())continue;
  targets=targets.filter(u=>!u.dead);
  if(targets.length){if(!attack(targets[0]))throw Error('No legal saved O04/O01/O08 shot at '+targets[0].id+' from authored firing post');}
  else if(index>=route.length){
   const m=b.honroMarkers.find(m=>m.id==='notes');
   assert.equal(e.alive(1).length,0,'All four original residual targets cleared');
   assert(g.HonroInteractions.eligibility(app,m).ok,'Notes reachable from unchanged authored position');
   record({op:'E',hero:hero.cls,target:m.id,position:pose(hero)});
   assert(production(()=>g.HonroInteractions.use(app,m)),'Actual production notes interaction');
  }else defend('Actual turn end replenishes movement for the next authored segment');
 }
 if(!terminal())stopReason='recovery input observation bound';
 assert.equal(b.phase,'won','Actual recovery must complete clear-lift and notes');
 assert.deepEqual(Object.keys(g.HonroAct2.memory(b).done),['clear-works','brace','hoist','repair','hold-hoist','clear-lift','notes']);
 for(let i=0;app.dialogue&&i<300;i++)stories();production(()=>app.outcome());for(let i=0;app.dialogue&&i<300;i++)stories();
 assert.equal(e.alive(1).length,0);assert(e.heroesAlive().length===4);assert.equal(externalWrites,0);assert.equal(recoveries,0);
 assert.deepEqual(plain(b.items),initial.items,'No consumables');
 assert.deepEqual(plain(b.terrain),initial.terrain,'No collision edits');
 assert.deepEqual(plain(b.honroWorldTerrain),initial.honroWorldTerrain,'No world geography edits');
}catch(error){failure={message:error.message,stack:error.stack};}
const result={passed:!failure,phase:b.phase,round:b.round,startRound:initial.round,roundDelta:b.round-initial.round,stopReason,failure,provenance,frames,simulationSeconds:frames*C.STEP,storyFrames,wallSeconds:(performance.now()-started)/1000,routeIndex:index,routeAnchors:route.length,heroes:e.heroesAlive().map(u=>({id:u.id,...pose(u)})),enemies:e.alive(1).map(u=>({id:u.id,...pose(u)})),externalWrites,recoveries,damageTaken:damage.filter(d=>d.side===0).reduce((n,d)=>n+d.amount,0),damageDealt:damage.filter(d=>d.side===1).reduce((n,d)=>n+d.amount,0),done:plain(g.HonroAct2.memory(b).done),usedSkills:[...new Set(resources.filter(r=>r.skill).map(r=>r.skill))],initialProfileSha256:hash(initialProfile)};
await writeFile(path.join(out,'result.json'),JSON.stringify(result,null,2));
await writeFile(path.join(out,'trace.json'),JSON.stringify({actions,turns,damage,resources,notices,dialogs,impacts},null,2));
await writeFile(path.join(out,'final-battle.json'),JSON.stringify(b));
production(()=>app.export());await writeFile(path.join(out,'final-profile.json'),JSON.stringify(await h.exported()));
console.log('RESULT',JSON.stringify(result));if(failure)process.exitCode=1;
