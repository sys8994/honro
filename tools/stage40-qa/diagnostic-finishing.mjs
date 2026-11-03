import {splitDockRoleGoal} from './split-role-route.mjs';
/** ONE preregistered diagnostic. Actual App inputs with native DOM/render/clock
 * doubles. No battle pose/HP/flags/RNG writes; no acceptance/fun claim. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,appendFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {completeNativeReturn} from './return-inputs.mjs';
import {dockCleanupGoal} from './dock-cleanup-route.mjs';
import {upperRecoveryGoal} from './upper-recovery-route.mjs';
import {createFinale} from './bootstrap.mjs';
import {createRouteGoalLock} from './route-lock.mjs';
import {finaleRoleGoal} from './role-route.mjs';
import {evaluateLegalCast} from './legal-cast.mjs';
import {evaluateInputTolerance} from './input-tolerance.mjs';
import {currentWarnings,warningEscapeGoal} from './warning-route.mjs';
import {finaleDeckGoal,tideRetreatRequired,tideRefuge} from './role-route-deck.mjs';
const out=process.env.HONRO_QA_OUT;if(!out)throw Error('Explicit registered output required');
await mkdir(out,{recursive:true});
const hash=x=>createHash('sha256').update(x).digest('hex'),protocol=JSON.parse(await readFile(out+'/protocol.json','utf8'));
assert.equal(protocol.runnerSha256,hash(await readFile(new URL(import.meta.url))));
const start=performance.now(),actions=[],turns=[],damage=[];let frame=0;
const {h,g,C,app,e,b,ops,raw,returnView}=await createFinale({record:x=>actions.push(x)});
assert.equal(hash(raw),protocol.entrySha256);assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),protocol.sourceCommit);
const profile=JSON.parse(raw),budget=Object.entries(app.profile.heroes).map(([cls,hero])=>({cls,xp:hero.xp,earned:C.pointsEarned(hero),spent:C.pointsSpent(hero,cls),ranks:hero.ranks,equipmentIds:hero.equipmentIds}));
for(const v of budget){assert(v.spent<=v.earned,'Illegal SP '+v.cls);assert.deepEqual(JSON.parse(JSON.stringify(v.ranks)),profile.heroes[v.cls].ranks,'Ranks changed at entry');assert.deepEqual(JSON.parse(JSON.stringify(v.equipmentIds)),profile.heroes[v.cls].equipmentIds,'Gear changed at entry');assert.equal(v.xp,profile.heroes[v.cls].xp);}
const foes=()=>b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0),heroes=()=>b.units.filter(v=>v.side===0&&!v.summoned&&!v.honroAct4Resident),surface=u=>e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id||u.honroEncounterSupport;
function state(){return{round:b.round,phase:b.phase,actor:e.active?.id,shots:b.shots,foes:foes().map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,support:surface(v),boss:v.boss,mid:v.honroMidboss,awake:v.awake})),heroes:heroes().map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,maxHp:v.maxHp,move:v.moveLeft,dead:v.dead,acted:v.acted,support:surface(v)})),residents:b.units.filter(v=>v.honroAct4Resident).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead})),tide:b.honroAct4PreviewState?.tide,boss:b.units.find(v=>v.honroAct4FinaleBoss)?.honroPilotCombat};}
function tick(n=1){for(let i=0;i<n;i++){ops.frame();frame++;if(frame>450000)throw Error('registered frame diagnostic limit');}}
function ready(){for(let i=0;i<30000;i++){if(['won','lost'].includes(b.phase))return false;if(app.canInput()&&e.grounded(e.active))return true;tick();}throw Error('Input readiness exceeded diagnostic bound');}
function hold(dir,count){for(let i=0;i<count&&app.canInput();i++){ops.move(dir,C.STEP);tick();}}
function settle(){for(let i=0;i<120&&!e.grounded(e.active)&&!['won','lost'].includes(b.phase);i++)tick();ready();}
function routeGoal(u){const support=surface(u),role=splitDockRoleGoal(u,{support,foes:foes(),heroes:heroes(),surface})||dockCleanupGoal(u,{support,foes:foes(),surface})||upperRecoveryGoal(u,{support,foes:foes(),surface})||finaleDeckGoal(u,{b,support,foes:foes(),surface})||(u.cls==='knight'?finaleRoleGoal(u,{support,foes:foes(),surface}):null);if(role)return role;const same=foes().filter(v=>surface(v)===support&&Math.abs(v.y-u.y)<700),spacing=u.cls==='knight'?145:310;
 if(same.length){const t=same.sort((a,z)=>Math.abs(a.x-u.x)-Math.abs(z.x-u.x))[0];return{x:t.x+(t.x>=u.x?-spacing:spacing),target:t.id,kind:'same-support-approach'};}
 if(support==='approved40-coast-west')return{x:2660,drop:true,kind:'coast-to-stair'};
 if(support==='approved40-dock-stair')return{x:1800,kind:'stair-to-dock'};
 if(support==='approved40-dock')return{x:1600,drop:true,kind:'dock-to-departure'};
 if(['approved40-departure-stair','approved40-departure-ramp','a4-return-deck'].includes(support)){
  const below=foes().filter(v=>v.y>=u.y-500);if(below.length){const t=below.sort((a,z)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(z.x-u.x,z.y-u.y))[0];return{x:t.x+(t.x>=u.x?-spacing:spacing),target:t.id,kind:'lower-approach'};}return{x:1445,kind:'return-upper-remaining'};}
 return null;
}
function advance(u){const lock=createRouteGoalLock(routeGoal);let loops=0;for(;loops<30&&u===e.active&&u.moveLeft>120&&app.canInput();loops++){const goal=lock.next(u,surface(u));if(!goal)return;const dx=goal.x-u.x;
 if(Math.abs(dx)<(goal.jumpLanding||goal.deckJoin?20:35)){if(goal.deckJoin){if(!ops.jump())break;tick(30);for(let n=0;n<140&&u===e.active&&u.moveLeft>100&&Math.abs(u.x-2140)>20;n++){hold(Math.sign(2140-u.x),Math.max(1,Math.min(12,Math.floor(Math.abs(2140-u.x)/420/C.STEP))));}settle();actions.push({op:'upper-recovery-deck-join',round:b.round,hero:u.id,support:surface(u),x:u.x,y:u.y});if(surface(u)!=='approved40-departure-stair')break;lock.clear();continue;}if(goal.jumpLanding){if(!ops.jump())break;settle();actions.push({op:'upper-recovery-jump-land',round:b.round,hero:u.id,expected:goal.jumpLanding,support:surface(u),x:u.x,y:u.y});if(surface(u)!==goal.jumpLanding)break;lock.clear();continue;}if(goal.drop&&e.canDrop()){actions.push({op:'route-drop',round:b.round,hero:u.id,goal,support:surface(u)});ops.drop();if(goal.driftRight)hold(1,65);tick(160);ready();lock.clear();continue;}break;}
 const before={x:u.x,y:u.y,move:u.moveLeft};hold(Math.sign(dx),Math.max(3,Math.min(36,Math.floor(Math.abs(dx)/420/C.STEP))));settle();actions.push({op:'route-move',round:b.round,hero:u.id,goal,before,after:{x:u.x,y:u.y,move:u.moveLeft}});
 if(u!==e.active||u.acted)break;if(Math.hypot(u.x-before.x,u.y-before.y)<12){if(u.moveLeft>300&&ops.jump()){hold(Math.sign(dx),32);settle();}else break;}
 }
 if(loops===30)actions.push({op:'bounded-route-stop',round:b.round,hero:u.id,remainingMove:u.moveLeft});
}
function retreatFromTide(u){
 if(!tideRetreatRequired(b,u))return false;const before={x:u.x,y:u.y,move:u.moveLeft};
 function go(x,air=false){for(let n=0;n<25&&u===e.active&&u.moveLeft>100&&Math.abs(u.x-x)>20;n++){hold(Math.sign(x-u.x),Math.max(3,Math.min(36,Math.floor(Math.abs(x-u.x)/420/C.STEP))));if(!air)settle();}}
 if(['a4-return-deck','approved40-departure-ramp'].includes(surface(u))){go(2350);if(u===e.active&&ops.jump()){tick(30);go(2140,true);for(let n=0;n<480&&!e.grounded(u)&&u===e.active;n++)tick();}}
 if(u===e.active)go(tideRefuge(u.cls));actions.push({op:'visible-tide-retreat',round:b.round,hero:u.id,before,after:{x:u.x,y:u.y,support:surface(u),hp:u.hp},scope:'actual App walk/jump, no pose or tide writes'});return true;
}
function plan(requiredFacing=null){const u=e.active,live=JSON.stringify(b),pe=new C.Engine(JSON.parse(live),()=>{},true),pu=pe.unit(u.id);let best=null;
 const visible=pe.b.units.filter(v=>v.side===1&&!v.dead&&Math.abs(v.y-pu.y)<=600&&Math.hypot(v.x-pu.x,v.y-pu.y)<1400).sort((a,z)=>Math.hypot(a.x-pu.x,a.y-pu.y)-Math.hypot(z.x-pu.x,z.y-pu.y)).slice(0,6);
 const value=(skill,hit)=>{const eff=pe.effective(skill,pu),r=Math.max(1,eff.radius||0);let score=0;for(const v of visible){const direct=hit.unit===v.id,d=pe.damageDistance(v,hit);if(!direct&&d>=r+v.r)continue;const armor=v.role==='guard'?((pu.x-v.x)*v.facing>0?.4:.05):Math.max(0,v.armor-(v.curseArmor||0)),factor=direct?1:.42+.58*(1-Math.max(0,Math.min(1,d/r)));score+=Math.min(v.hp+(v.shield||0),eff.damage*factor*(1-Math.min(.7,armor))*C.existenceMultiplier(C.attackForSkill(skill),v,pu));}return score;};
 function consider(x){if(requiredFacing!==null&&(x.angle>90?-1:1)!==requiredFacing)return;if(!(x.score>0&&(!best||x.score>best.score)))return;const complete=evaluateLegalCast(C,b,u.id,x.id,x.angle,x.power);if(!complete.safe){actions.push({op:'reject-unsafe-cast',round:b.round,hero:u.id,skill:x.id,angle:x.angle,power:x.power,reason:complete,scope:'detached-current-state-rollout'});return;}x.fullCast={damage:complete.enemyDamage,targets:complete.targets};if(complete.enemyDamage>0){const tolerance=evaluateInputTolerance(C,b,u.id,x.id,x.angle,x.power,complete);if(!tolerance.safeUseful){actions.push({op:'reject-input-sensitive-cast',round:b.round,hero:u.id,skill:x.id,angle:x.angle,power:x.power,tolerance});return;}x.nominalScore=complete.enemyDamage;x.score=tolerance.minimumDamage;x.inputTolerance=tolerance;if(!best||x.score>best.score)best=x;}}
 for(const id of pu.loadout){const s=C.SKILLS[id];if(!s||s.passive||['O13','S08'].includes(id)||!pe.skillAllowed(s,pu)||pe.cooldownLeft(pu,id)>0)continue;
  if(id==='S00'){for(const t of visible){let angle=Math.atan2(pu.y-pu.h*.58-(t.y-t.h*.5),t.x-pu.x)*180/Math.PI;if(angle< -90)angle+=360;for(const power of [1,.7,.2]){if(!pe.canAfford(s,pu,power))continue;const targets=visible.filter(v=>C.meleeContains(pe,pu,v,C.meleeRange(pu,s,power),-angle*Math.PI/180,C.meleeSpan(pu,s,power)));if(!targets.length)continue;const score=targets.reduce((sum,v)=>sum+Math.min(v.hp,pe.effective(s,pu).damage*C.existenceMultiplier(C.attackForSkill(s),v,pu)),0);consider({id,angle,power,score,targets:targets.map(v=>v.id),method:'native-melee-envelope'});}}continue;}
  for(const t of visible.slice(0,id==='S06'?3:5))for(const aim of pe.shotSeeds(pu,s,t).slice(0,id==='S06'?3:6)){
   if(!pe.canAfford(s,pu,aim.power))continue;
   if(id==='S06'||id==='S01'){
    // Exact legal cast on isolated current state. No synthetic MP, grounded,
    // loadout, cooldown, position or active-turn changes even in this clone.
    const sim=new C.Engine(JSON.parse(live),()=>{},true),su=sim.unit(pu.id),before=new Map(sim.b.units.map(v=>[v.id,{hp:v.hp,shield:v.shield||0,side:v.side}]));
    if(!sim.fire(id,aim.angle,aim.power))continue;
    for(let i=0;i<1440&&sim.b.projectiles.length;i++)for(const p of [...sim.b.projectiles])if(sim.b.projectiles.includes(p))sim.stepProjectile(p,C.STEP);
    let score=0,risk=0;const targets=[];for(const v of sim.b.units){const z=before.get(v.id);if(!z)continue;const loss=Math.max(0,z.hp-v.hp)+Math.max(0,z.shield-(v.shield||0));if(z.side===1&&loss){score+=loss;targets.push(v.id);}else if(v.id!==pu.id)risk+=loss;}
    if(!risk&&su.y<3762.5&&Number.isFinite(su.x)&&!su.dead)consider({id,...aim,score,targets,landing:{x:su.x,y:su.y},method:'isolated-legal-native-rush'});continue;
   }
   const v=C.shotViable(pe,pu,s,t,aim.angle,aim.power);if(v.ok&&v.risk<.5)consider({id,...aim,score:value(s,v.hit),target:t.id,method:'detached-physical-endpoint'});
  }
 }
 assert.equal(JSON.stringify(b),live,'Planner mutated live state');return best;
}
function healing(){const u=e.active,id='O13',s=C.SKILLS[id];if(u.cls!=='occultist'||!u.loadout.includes(id)||e.cooldownLeft(u,id)||b.units.some(v=>v.summoned&&!v.dead&&v.summonOwner===u.id&&v.summonKind==='warden'))return null;
 const ally=heroes().filter(v=>!v.dead&&v.hp<v.maxHp*.6&&Math.hypot(v.x-u.x,v.y-u.y)<650).sort((a,z)=>a.hp/a.maxHp-z.hp/z.maxHp)[0];if(!ally)return null;
 const snap=JSON.stringify(b),pe=new C.Engine(JSON.parse(snap),()=>{},true),pu=pe.unit(u.id),t={...pe.unit(ally.id),x:ally.x+(ally.x<u.x?70:-70),h:1,r:1};let choice=null;
 for(const aim of pe.shotSeeds(pu,s,t)){if(!pe.canAfford(s,pu,aim.power))continue;const hit=pe.predict(pu,s,aim.angle,aim.power,t,false),d=Math.hypot(hit.x-t.x,hit.y-t.y);if(d<180&&(!choice||d<choice.d))choice={id,...aim,d,target:ally.id,method:'support-warden'};}
 assert.equal(JSON.stringify(b),snap);return choice;
}
let failure=null,returnResult=null;
try{
 ready();assert(g.HonroAct4TerrainPreview.proofValid(b));await writeFile(out+'/entry.json',JSON.stringify({sourceCommit:protocol.sourceCommit,budget,profileHash:hash(raw),state:state(),profileProvenance:'Prepared33–38 fixture then observed39/40; not1–39 continuous earned campaign'},null,2));
 const selectedRounds=new Set();
 for(let turn=0;turn<120&&b.round<=24&&!['won','lost'].includes(b.phase)&&foes().length;turn++){
  ready();if(!selectedRounds.has(b.round)){selectedRounds.add(b.round);const knight=e.unit('knight');if(knight&&!knight.dead&&!knight.acted)ops.select('knight');}
  const threatened=currentWarnings(b).map(w=>e.unit(w.target.id)).find(v=>v&&!v.dead&&!v.acted&&v.side===0);if(threatened)ops.select(threatened.id);
  const u=e.active,initial=state(),retreated=retreatFromTide(u),escape=retreated?null:warningEscapeGoal(e,u,{surface,separated:g.HonroTerrain.separated});
  if(escape){const before={x:u.x,y:u.y};for(let n=0;n<5&&u===e.active&&u.moveLeft>80&&Math.abs(u.x-escape.x)>25;n++){hold(Math.sign(escape.x-u.x),Math.min(36,Math.max(3,Math.floor(Math.abs(escape.x-u.x)/420/C.STEP))));settle();}actions.push({op:'warning-escape',round:b.round,hero:u.id,goal:escape,before,after:{x:u.x,y:u.y}});}
  else if(!retreated)advance(u);ready();if(u!==e.active||u.acted){turns.push({turn,initial,skip:'movement consumed action',final:state()});await appendFile(out+'/turns.jsonl',JSON.stringify(turns.at(-1))+'\n');continue;}
  let choice=healing()||plan();
  // A safe-shot failure is not an instruction to discard a full movement bar.
  // Try two short, real forward movements to clear a friendly firing lane.
  for(let n=0;!choice&&n<2&&!escape&&!retreated&&!finaleDeckGoal(u,{b,support:surface(u),foes:foes(),surface})?.hold&&u===e.active&&!u.acted&&u.cls!=='knight'&&u.moveLeft>400;n++){
   const candidates=foes().filter(v=>Math.abs(v.y-u.y)<650).sort((a,z)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(z.x-u.x,z.y-u.y)),target=candidates[0];if(!target)break;
   const before={x:u.x,y:u.y,support:surface(u),move:u.moveLeft},direction=Math.sign(target.x-u.x)||u.facing;
   hold(direction,45);settle();actions.push({op:'fire-lane-reposition',round:b.round,hero:u.id,target:target.id,before,after:{x:u.x,y:u.y,support:surface(u),move:u.moveLeft}});
   if(u!==e.active||u.acted)break;choice=healing()||plan();if(Math.hypot(u.x-before.x,u.y-before.y)<12)break;
  }
  if(u.cls==='knight'&&u.hp<u.maxHp*.35&&(!choice||choice.score<350)&&u.loadout.includes('S08')&&!e.cooldownLeft(u,'S08')&&e.canAfford(C.SKILLS.S08,u,.2))choice={id:'S08',angle:u.facing>0?0:180,power:.2,method:'low-health-response'};
  const before=new Map(b.units.map(v=>[v.id,{hp:v.hp,side:v.side}]));let accepted=false;
  if(choice)accepted=ops.fire(choice.id,choice.angle,choice.power);if(!accepted)ops.defend();ready();
  for(const v of b.units){const z=before.get(v.id);if(z&&z.hp!==v.hp)damage.push({round:initial.round,hero:u.id,target:v.id,side:z.side,change:z.hp-v.hp,dead:v.dead});}
  const final=state();turns.push({turn,initial,choice,accepted,final});await appendFile(out+'/turns.jsonl',JSON.stringify(turns.at(-1))+'\n');
  console.log(JSON.stringify({turn,round:b.round,hero:u.id,skill:choice?.id,accepted,alive:foes().length,heroHp:heroes().map(v=>Math.round(v.hp)),moveLeft:u.moveLeft}));
  if(performance.now()-start>1200000)throw Error('20 minute registered diagnostic resource limit');
 }
 if(foes().length===0&&b.round<=20){await writeFile(out+'/combat-checkpoint.json',JSON.stringify(b));app.flushBattleSave();await writeFile(out+'/combat-profile.json',JSON.stringify(app.profile));returnResult=completeNativeReturn({h,g,C,app,e,b,ops,returnView,record:x=>actions.push(x)});}
}catch(error){failure=String(error.stack||error);console.error(failure);}
finally{
 const result={status:'diagnostic',accepted:false,sourceCommit:protocol.sourceCommit,protocol,limitRounds:24,final:state(),combatCleared:foes().length===0,within20:b.round<=20,fullReturn:returnResult?.fullReturn===true,returnResult,failure,actions,turns:turns.length,damage,wallSeconds:(performance.now()-start)/1000,frames:ops.frames,scope:'Native production App/frame/charge/selection, DOM/render/clock doubles, prepared endgame profile. Not browser/human fun or cohort acceptance.'};
 await writeFile(out+'/result.json',JSON.stringify(result,null,2));app.flushBattleSave();await writeFile(out+'/final-profile.json',JSON.stringify(app.profile));
}
if(failure)process.exitCode=1;
