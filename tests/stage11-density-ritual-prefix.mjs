/** Instrumented ritual prefix of stage11-ravine-fullplay.mjs.
 * Input/navigation/training/skill policy is copied verbatim. Stop after the
 * hold completes plus four complete round transitions, without map-clear claim.
 * Fresh canonical Stage11, actual level10, ordinary commands only.
 * No scenario poses, completed-objective flags, enemy removal or HP/MP/movement
 * refill. Camp skill allocation is prepared through the real training API.
 * Native engine/App mission method; not browser input or human balance approval.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {runtimeParts} from '../shared/build.mjs';
import {createHash} from 'node:crypto';
import {act1Runtime,fixture} from './act1-spatial-test-helpers.mjs';
const resumePath=process.env.HONRO_FULLPLAY_CONTINUE,resume=resumePath?JSON.parse(await readFile(resumePath,'utf8')):null;
assert(!resumePath,'This prefix requires a fresh entry; use the original driver for Continue');
const originalDriverText=await readFile(new URL('./stage11-ravine-fullplay.mjs',import.meta.url),'utf8');
const prefixDriverText=await readFile(new URL(import.meta.url),'utf8');
const policySection=text=>text.slice(text.indexOf('\nconst hpFraction='),text.indexOf('\nconst actionLimit='));
assert.equal(policySection(prefixDriverText),policySection(originalDriverText),'Navigation, attack choice and healing policy are copied verbatim');
const inputPolicySection=text=>text.slice(text.indexOf(' trackBirths();\n const current='),text.indexOf('\n}\nif(!['));
assert.equal(inputPolicySection(prefixDriverText),inputPolicySection(originalDriverText),'Per-turn skill, target, interaction and movement choices are copied verbatim');
const g=await act1Runtime(),C=g.HONRO_CORE,profile=resume?.profile||C.defaults(),hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
if(!resume){
profile.recruited=g.HonroStageRules.stageParty(11);
for(const cls of profile.recruited)profile.heroes[cls].xp=g.HonroProgression.legacyCampaignAnchor(10);
const allocations={archer:{AP04:1,AP02:2,AP01:2,AP03:1,A14:1,A02:4,A11:1,A09:4,A05:4},mage:{M07:1,M10:4,M03:3,M11:3,MP01:3,MP02:2,MP04:2,MP03:1},knight:{S03:4,S05:3,S01:1,S09:3,SP01:3,SP02:3,SP04:2},occultist:{O07:1,O08:3,O02:4,O11:3,OP01:3,OP02:2,OP03:2,OP04:1}};
for(const cls of profile.recruited){for(const[id,rank]of Object.entries(allocations[cls]))while((profile.heroes[cls].ranks[id]||0)<rank){assert(C.train(profile.heroes[cls],id),`${cls}/${id}: legitimate camp training: ${C.trainReason(profile.heroes[cls],id)}`);}while(C.pointsLeft(profile.heroes[cls],cls)>0)assert(C.investStat(profile.heroes[cls],cls));}
profile.loadouts={...profile.loadouts,archer:['A01','A02','A09','A05'],mage:['M01','M10','M03','M11'],knight:['S00','S03','S05','S09'],occultist:['O01','O02','O08','O11']};
for(const cls of profile.recruited){C.sanitizeLoadout(profile,cls);assert.equal(C.pointsSpent(profile.heroes[cls],cls),C.pointsEarned(profile.heroes[cls]));}
}
let q;if(!resume)q=fixture(g,11,{profile});else{
 assert.equal(resume.sourceHash,hash(g.HONRO_PROJECT),'Continue uses the exact recorded production project');
 const main=await readFile('shared/runtime/main.js','utf8'),mount=main.slice(main.indexOf('        mount(b) {'),main.indexOf(' this.selected = e.active'))+'}',cont=main.slice(main.indexOf('        continue() {'),main.indexOf('        checkMission(e) {'));
 const methods=new Function('G','C','H','clone','return ({'+mount+','+cont+'})')(g,C,g.HONRO_CONTENT,structuredClone),events=[];
 const app={...methods,profile,contacts:new Set(),notices:[],speeches:[],training:false,done:false,event(text){this.notices.push(text);},sayLines(lines){this.speeches.push(...lines);},canInput(){return this.engine.canAct();},cancelInput(){},checkMission:g.testCheckMission};
 // The ordinary save/Continue path clones the recorded battle. Production mount
 // core is executed verbatim; only its later DOM/camera construction is omitted.
 g.HonroProgression.syncRoster(profile,resume.b);profile.honroBattle=structuredClone(resume.b);
 const state=b=>b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft,dead:u.dead})),before=state(resume.b);app.continue();
 assert.deepEqual(state(app.engine.b),before,'Continue does not refill or reposition any unit');assert.equal(app.engine.b.round,resume.b.round);assert.equal(app.engine.b.phase,resume.b.phase);
 q={b:app.engine.b,e:app.engine,app,st:app.stage,events};
}
const {b,e,app,st,events}=q;g.HonroAct2.attach(app,e);app.updateHUD=()=>{};
const runtimeSha256=createHash('sha256').update((await runtimeParts({vector:false,render:false})).join('\n')).digest('hex'),testScriptSha256=createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),checkoutCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const provenance={runtimeSha256,testScriptSha256,checkoutCommit,originalControllerSha256:createHash('sha256').update(originalDriverText).digest('hex'),policySha256:createHash('sha256').update(policySection(prefixDriverText)).digest('hex'),productionCommit:process.env.HONRO_FULLPLAY_PRODUCTION_COMMIT||null};
const initialRecord=resume?JSON.parse(await readFile(process.env.HONRO_FULLPLAY_INITIAL,'utf8')):null;
const canonical=g.HONRO_PROJECT.stages[10],sourceHash=hash(g.HONRO_PROJECT),a=g.HonroAct2.memory(b),initial=resume?initialRecord.initial:JSON.parse(JSON.stringify({battle:b,profile}));
assert(initial.battle.units.filter(u=>u.side===0).every(u=>u.level===10));if(!resume){assert.equal(Object.keys(a.done).length,0);assert.equal(b.round,1);assert.equal(e.alive(1).length,canonical.units.filter(u=>u.team==='enemy').length);}
const out=process.env.HONRO_RITUAL_PREFIX_OUT||process.env.HONRO_FULLPLAY_OUT||'_local/reports/encounter-density/stage11-density-ritual-prefix';await mkdir(out,{recursive:true});await writeFile(out+'/initial.json',JSON.stringify(initialRecord||{sourceHash,provenance,initial},null,2),{flag:'wx'});
const actions=resume?.actions||[],rounds=resume?.rounds||[],navEvents=resume?.navEvents||[],births=resume?.births||[],noticeLog=resume?.noticeLog||[],continues=[...(resume?.continues||[]),...(resume?[{round:b.round,path:resumePath,phase:b.phase,reason:'Correct controller navigation; unmodified ordinary Continue'}]:[])],known=new Set(b.units.map(u=>u.id));let frames=resume?.frames||Math.max(0,...noticeLog.map(x=>x.frame)),lastRound=0,lastNotices=0,stalledRounds=0,lastSignature='',stopReason=null,inputSerial=resume?.inputSerial||Math.max(0,...noticeLog.map(x=>x.inputSerial));
const originalEvent=app.event.bind(app);app.event=function(text){noticeLog.push({round:b.round,frame:frames,inputSerial,actorTurnSerial:b.honroState.actorTurnSerial,phase:b.phase,actor:b.active,text});return originalEvent(text);};
// Passive instrumentation. Wrappers delegate exactly once and never change an
// input result, target, resource, battle field, queue, HP, pose or objective.
const plain=v=>JSON.parse(JSON.stringify(v)),echoSources=new Set(['hold-knots-0','hold-knots-3']);
const enemyActions=[],shots=[],damage=[],inputTrace=[],enemyQueues=[],conversions=[],goalTransitions=[];
const converted=new Set(b.units.filter(u=>u.honroPossessed).map(u=>u.id));
let ritualStartSaved=false,ritualCompletionSaved=false;
let ritualCompletedRound=null,observedGoal=g.HonroAct2.current(b)?.id;
const actorRecord=u=>u?{id:u.id,side:u.side,cls:u.cls,kind:u.kind,source:u.honroSpawnSource||null,cell:u.honroRavineCell||null,role:u.honroDensityRole||null,x:u.x,y:u.y,hp:u.hp,maxHp:u.maxHp,shield:u.shield||0,focus:u.focus,dead:!!u.dead,possessed:!!u.honroPossessed,support:e.contactSurface(u.x,u.y-8,u.y+10)?.t?.id||null}:null;
const tacticalContext=u=>({goal:g.HonroAct2.current(b)?.id,hold:plain(a.holds?.['hold-knots']||null),actor:actorRecord(u),nearbyEnemies:u?e.alive(1).filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<1800).map(v=>({...actorRecord(v),distance:Math.hypot(v.x-u.x,v.y-u.y)})):[],warnings:plain(g.HonroEncounterDensity.memory(b).existingWarnings||{})});
for(const name of ['move','jump','fire','wait','select','useGate']){
 const original=e[name].bind(e);e[name]=function(...args){inputSerial++;const u=e.active,canActBefore=e.canAct(),round=b.round,frame=frames,serial=inputSerial,before=name==='fire'||name==='wait'||name==='jump'?tacticalContext(u):null,result=original(...args);
  if(name==='fire'&&result)shots.push({round,frame,inputSerial:serial,actor:actorRecord(u),skill:args[0],angle:args[1],power:args[2],context:before});
  if(u?.side===0&&['fire','wait','jump'].includes(name)&&(result||name==='wait'&&canActBefore))inputTrace.push({round,frame,inputSerial:serial,actorId:u.id,kind:name,args:plain(args.map(v=>v&&typeof v==='object'?v.id||null:v)),accepted:!!result||name==='wait'&&canActBefore,context:before});
  return result;
 };
}
const originalHurt=e.hurt.bind(e);e.hurt=function(u,n,owner,...args){const hp=u.hp,shield=u.shield||0,target=actorRecord(u),source=actorRecord(e.unit(typeof owner==='object'?owner?.id:owner)),result=originalHurt(u,n,owner,...args);if(hp>u.hp||shield>(u.shield||0))damage.push({round:b.round,frame:frames,inputSerial,actorId:source?.id||owner||null,actor:source,targetId:u.id,targetSide:u.side,target,skill:args[4]||args[1]?.skill||null,damageSource:args[3]||'normal',direct:!!args[0],requested:n,hp:Math.max(0,hp-u.hp),shield:Math.max(0,shield-(u.shield||0)),dead:!!u.dead});return result;};
const originalFinish=e.finishAction.bind(e);e.finishAction=function(...args){const u=e.active,was=u?.acted,round=b.round,before=actorRecord(u),intent=u?.intent,targetId=u?.aiMove?.targetId||null,result=originalFinish(...args);if(u?.side===1&&!was&&u.acted)enemyActions.push({round,frame:frames,actorId:u.id,source:u.honroSpawnSource||null,kind:intent||null,targetId,before,after:actorRecord(u)});return result;};
const originalSwitch=e.switchTeam.bind(e);e.switchTeam=function(...args){const from=b.side,result=originalSwitch(...args);if(from===0&&b.side===1){assert(b.queue.length<=4,'Original Stage11 four-actor action cap');enemyQueues.push({round:b.round,frame:frames,ids:[...b.queue],actors:b.queue.map(id=>actorRecord(e.unit(id)))});}return result;};
const trackBirths=()=>{for(const u of b.units){if(!known.has(u.id)){known.add(u.id);births.push({round:b.round,frame:frames,inputSerial,actorTurnSerial:b.honroState.actorTurnSerial,phase:b.phase,id:u.id,source:u.honroSpawnSource,x:u.x,y:u.y,noticeCount:noticeLog.length,actor:actorRecord(u),heroes:e.heroesAlive().map(actorRecord),warning:plain(g.HonroEncounterDensity.memory(b).existingWarnings?.[u.honroSpawnSource]||null),intendedGround:g.HonroMapEngine.surfaceY(b.terrain,u.x,u.y)?.t?.id});}if(echoSources.has(u.honroSpawnSource)&&u.honroPossessed&&!converted.has(u.id)){converted.add(u.id);conversions.push({round:b.round,frame:frames,actor:actorRecord(u),validContact:C.validTerrainContactPose(b.terrain,u)});}}};
const observeGoal=()=>{const goal=g.HonroAct2.current(b)?.id;if(goal!==observedGoal){goalTransitions.push({round:b.round,frame:frames,from:observedGoal,to:goal,hold:plain(a.holds?.['hold-knots']||null),heroes:e.heroesAlive().map(actorRecord),enemies:e.alive(1).map(actorRecord)});observedGoal=goal;}if(a.done['hold-knots']&&ritualCompletedRound===null)ritualCompletedRound=b.round;};
const telemetry=()=>({enemyActions,shots,damage,inputTrace,enemyQueues,conversions,goalTransitions,ritualCompletedRound});
const DT=C.STEP,tick=()=>{e.tick(DT);g.HonroMission.tick(app,DT);trackBirths();observeGoal();frames++;};
const hpFraction=u=>u.hp/u.maxHp,dist=(a,c)=>Math.hypot(a.x-c.x,a.y-c.y),heroBody=e.heroesAlive();
// Navigation is an input policy over the same authored walking/jump routes
// already independently executed. Actual positions are always read from Engine.
const nodes=[],edges=[],keyMap=new Map(),surfaceNodes=new Map();
function node(p){const key=(p.surfaceId||'unknown')+':'+Math.round(p.x*10)+':'+Math.round(p.y*10);let i=keyMap.get(key);if(i===undefined){i=nodes.length;nodes.push({...p});edges.push([]);keyMap.set(key,i);}if(p.surfaceId){if(!surfaceNodes.has(p.surfaceId))surfaceNodes.set(p.surfaceId,new Set());surfaceNodes.get(p.surfaceId).add(i);}return i;}
function edge(i,j,jump=null){if(i===j)return;const cost=dist(nodes[i],nodes[j])+(jump?120:0);if(!edges[i].some(x=>x.to===j&&!!x.jump===!!jump))edges[i].push({to:j,cost,jump});}
function joinPoints(p,z,jump=null){const i=node(p),j=node(z);edge(i,j,jump);if(!jump&&p.surfaceId===z.surfaceId)edge(j,i);}
for(const route of canonical.design.space.routes){for(let i=0;i<route.anchors.length-1;i++){let p=route.anchors[i],z=route.anchors[i+1];if(p.jumpTo){const t=b.terrain.find(t=>t.id===p.jumpTo.support),landing={x:p.jumpTo.x,y:C.topAt(t,p.jumpTo.x),surfaceId:p.jumpTo.support};joinPoints(p,landing,p.jumpTo);p=landing;}if(p.surfaceId===z.surfaceId){const t=b.terrain.find(t=>t.id===p.surfaceId),n=Math.max(1,Math.ceil(Math.abs(z.x-p.x)/100));let prev=p;for(let n1=1;n1<=n;n1++){const x=p.x+(z.x-p.x)*n1/n,next={x,y:C.topAt(t,x),surfaceId:p.surfaceId};joinPoints(prev,next);prev=next;}}else joinPoints(p,z);}}
// Continue along exposed authored terrain beyond a mission marker when a live
// enemy has moved there. These are candidate inputs, not a reachability claim;
// every chosen step still passes through the production walking solver.
for(const t of b.terrain.filter(t=>t.honroSpaceSurfaceId&&!t.honroCeiling)){
 const left=Math.max(25,t.x),right=Math.min(b.width-25,t.x+t.w);
 for(const x of [...Array.from({length:Math.floor((right-left)/90)+1},(_,i)=>left+i*90),right]){const y=C.topAt(t,x);if(!Number.isFinite(y)||y<0||y>b.height)continue;const pose={...heroBody[0],x,y};if(C.validTerrainContactPose(b.terrain,pose))node({x,y,surfaceId:t.id});}
}
// Goal sites may lie between two authored samples on the same real contour.
for(const site of Object.values(canonical.design.space.sites))node(site.standing);
for(const[id,set]of surfaceNodes){const ordered=[...set].sort((i,j)=>nodes[i].x-nodes[j].x);for(let j=1;j<ordered.length;j++){const i=ordered[j-1],k=ordered[j];if(nodes[k].x-nodes[i].x<420&&Math.abs(nodes[k].y-nodes[i].y)<=Math.abs(nodes[k].x-nodes[i].x)*1.35+.2){edge(i,k);edge(k,i);}}}
// Real contour seams: short near-level walks between two supports are also
// candidates when combat knockback lands a hero on an optional branch.
for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const p=nodes[i],z=nodes[j];if(p.surfaceId!==z.surfaceId&&Math.abs(p.x-z.x)<=100&&Math.abs(p.y-z.y)<=45){edge(i,j);edge(j,i);}}
function nearest(u){const surface=e.surface(u.x,u.y-5,u.y+5)?.t?.id;let best=-1,cost=Infinity;for(let i=0;i<nodes.length;i++){const p=nodes[i],score=dist(u,p)+(p.surfaceId===surface?0:350);if(score<cost){cost=score;best=i;}}return{index:best,distance:dist(u,nodes[best]),surface};}
function paths(from){const d=nodes.map(()=>Infinity),prev=nodes.map(()=>null),done=new Set();d[from]=0;for(let n=0;n<nodes.length;n++){let i=-1;for(let j=0;j<nodes.length;j++)if(!done.has(j)&&(i<0||d[j]<d[i]))i=j;if(i<0||!Number.isFinite(d[i]))break;done.add(i);for(const link of edges[i])if(d[i]+link.cost<d[link.to]){d[link.to]=d[i]+link.cost;prev[link.to]={from:i,...link};}}return{d,prev};}
function routeTo(u,point,{enemy=false}={}){const start=nearest(u),tree=paths(start.index),range={archer:550,mage:450,knight:90,occultist:340}[u.cls];let target=-1,score=Infinity;for(let i=0;i<nodes.length;i++){const p=nodes[i],delta=dist(p,point);let penalty=delta*8;if(enemy){const dy=Math.abs(p.y-point.y);if(delta>1400||dy>(u.cls==='knight'?350:700))continue;penalty=Math.abs(delta-range)*1.4+Math.max(0,dy-(u.cls==='knight'?120:380))*3;if(delta>1500)penalty+=delta*3;}const total=tree.d[i]+penalty;if(total<score){target=i;score=total;}}if(target<0||!Number.isFinite(score))return null;const links=[];for(let i=target;i!==start.index;){const step=tree.prev[i];if(!step)return null;links.push({from:nodes[step.from],point:nodes[i],jump:step.jump});i=step.from;}links.reverse();if(start.distance>13||Math.abs(u.y-nodes[start.index].y)>35)links.unshift({from:{x:u.x,y:u.y},point:nodes[start.index],jump:null});return{links,start,goal:nodes[target],cost:tree.d[target],target,point:{x:point.x,y:point.y,id:point.id}};}
const manualJumpDone=new Set(resume?.manualJumpDone||[]);const navigation=new Map();let manualPolicy={},manualPolicyHash='';const manualPolicyLog=resume?.manualPolicyLog||[];
function advance(u,point,enemy=false){
 // Walk beyond the end of an overlapping one-way trunk before turning back.
 // A human can see this edge; proximity to the lower contour is not a drop.
 if(e.surface(u.x,u.y-5,u.y+5)?.t?.id==='rv-saddle-fallen-trunk'&&u.x>7900&&point.y>u.y+30){const start={x:u.x,y:u.y};for(let i=0;i<240&&e.canAct()&&u.moveLeft>12&&u.x<8135;i++){e.move(1,DT);tick();}for(let i=0;i<240&&e.canAct()&&!e.grounded(u);i++)tick();actions.push({op:'move',round:b.round,hero:u.cls,from:start,to:{x:u.x,y:u.y},goal:{id:'manual-fallen-trunk-end',x:8135,y:6790}});navigation.delete(u.id);}
 let nav=navigation.get(u.id);const changed=!nav||dist(nav.point,point)>180||nav.point.id!==point.id||nav.enemy!==enemy||nav.index>=nav.links.length&&(enemy||dist(u,nav.goal)>70);if(changed){const route=routeTo(u,point,{enemy});if(!route)return{blocked:'no graph route'};nav={...route,enemy,index:0,air:null};navigation.set(u.id,nav);if(nav.start.distance>400)navEvents.push({round:b.round,hero:u.cls,kind:'off-route',position:{x:u.x,y:u.y},nearest:nav.start});}
 let still=0,moved=0;const origin={x:u.x,y:u.y};for(let n=0;n<1300&&e.canAct()&&u.moveLeft>12;n++){
  if(nav.air){const target=nav.air;if(Math.abs(u.x-target.x)>3)e.move(Math.sign(target.x-u.x)*.35,DT);tick();if(e.grounded(u)){navEvents.push({round:b.round,hero:u.cls,kind:'jump-land',x:u.x,y:u.y,support:e.surface(u.x,u.y-5,u.y+5)?.t?.id,expected:target.support});nav.air=null;nav.index++;}continue;}
  const link=nav.links[nav.index];if(!link)break;
  const p=link.jump?link.from:link.point,reached=Math.abs(u.x-p.x)<13&&Math.abs(u.y-p.y)<35&&e.grounded(u);
  if(reached){if(link.jump){if(u.moveLeft<e.jumpCost(u)+Math.abs(link.jump.x-u.x)+70)break;if(e.jump(u)){nav.air=link.jump;actions.push({op:'jump',round:b.round,hero:u.cls,to:link.jump});continue;}break;}nav.index++;continue;}
  const before={x:u.x,y:u.y};if(Math.abs(u.x-p.x)>6)e.move(Math.sign(p.x-u.x)*(Math.abs(u.x-p.x)<25?.3:1),DT);
  if(e.grounded(u)&&(still>12&&Math.abs(u.x-p.x)>25||Math.abs(u.x-p.x)<28&&u.y-p.y>35)){if(e.jump(u)){actions.push({op:'jump-recover',round:b.round,hero:u.cls,to:p});still=0;}}
  tick();if(dist(before,u)<.01)still++;else still=0;if(still>120){navEvents.push({round:b.round,hero:u.cls,kind:'blocked',x:u.x,y:u.y,goal:p,support:e.surface(u.x,u.y-5,u.y+5)?.t?.id});navigation.delete(u.id);break;}
 }
 for(let n=0;n<300&&e.canAct()&&!e.grounded(u);n++)tick();moved=dist(origin,u);if(moved>1)actions.push({op:'move',round:b.round,hero:u.cls,from:origin,to:{x:u.x,y:u.y},goal:{x:point.x,y:point.y,id:point.id}});return{moved,nav};}
function fireAt(u,target){const spirit=target.honroSpirit&&!target.manifested;let skills=u.loadout.map(id=>C.SKILLS[id]).filter(s=>s.damage>0&&!s.passive&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus);skills.sort((a,z)=>(spirit?Number(z.id==='O08')-Number(a.id==='O08'):0)||z.damage-a.damage);
 for(const skill of skills.slice(0,3)){
  if(skill.martial&&skill.branch==='sword'){let angle=Math.atan2(u.y-u.h*.58-(target.y-target.h*.5),target.x-u.x)*180/Math.PI;if(angle< -90)angle+=360;for(const power of[1,.7,.2])if(C.meleeContains(e,u,target,C.meleeRange(u,skill,power),-angle*Math.PI/180,C.meleeSpan(u,skill,power))&&e.fire(skill.id,angle,power)){actions.push({op:'fire',round:b.round,hero:u.cls,skill:skill.id,target:target.id,hpBefore:target.hp});return true;}continue;}
  let best=null;for(const aim of e.shotSeeds(u,skill,target)){const v=C.shotViable(e,u,skill,target,aim.angle,aim.power);if((v.ok||target.hp<=2&&v.enemyDamage>0)&&v.risk<1&&v.miss<Math.max(85,skill.radius+target.r+55)&&(!best||v.net>best.net))best={...aim,net:v.net};}
  if(!best&&skill===skills[0]){const aim=e.bestShot(u,skill,target),v=C.shotViable(e,u,skill,target,aim.angle,aim.power);if((v.ok||target.hp<=2&&v.enemyDamage>0)&&v.risk<1&&v.miss<Math.max(85,skill.radius+target.r+55))best=aim;}
  if(best&&e.fire(skill.id,best.angle,best.power)){actions.push({op:'fire',round:b.round,hero:u.cls,skill:skill.id,target:target.id,hpBefore:target.hp,angle:best.angle,power:best.power});return true;}
 }return false;}
function healStake(u){if(u.cls!=='mage'||!u.loadout.includes('M10')||e.manaCost(C.SKILLS.M10,u)>u.focus)return false;const hurt=e.heroesAlive().filter(v=>hpFraction(v)<.78&&dist(v,u)<3000);if(!hurt.length)return false;const target=hurt.find(v=>v.cls===manualPolicy.healTarget)||hurt.sort((a,z)=>hpFraction(a)-hpFraction(z))[0];if((b.stakes||[]).some(s=>s.skill==='M10'&&s.expires>b.round+1&&dist(s,target)<180))return false;let best=null;const aims=[...e.shotSeeds(u,C.SKILLS.M10,target),...Array.from({length:36},(_,i)=>-85+i*10).flatMap(angle=>[.2,.4,.6,.8,1].map(power=>({angle,power})))];for(const {angle,power}of aims){const hit=e.predict(u,C.SKILLS.M10,angle,power);const d=dist(hit,target);if(hit.terrain&&Math.abs(hit.y-target.y)<70&&d<90&&(!best||d<best.d))best={angle,power,d,x:hit.x,y:hit.y};}if(best&&e.fire('M10',best.angle,best.power)){actions.push({op:'heal-stake',round:b.round,hero:u.cls,target:target.id,...best});return true;}return false;}
const actionLimit=Number(process.env.HONRO_FULLPLAY_ACTION_LIMIT||1600),started=performance.now();
for(let n=0;n<actionLimit&&!['won','lost'].includes(b.phase);n++){
 if(process.env.HONRO_FULLPLAY_POLICY){manualPolicy=JSON.parse(await readFile(process.env.HONRO_FULLPLAY_POLICY,'utf8'));const h=hash(manualPolicy);if(h!==manualPolicyHash){manualPolicyHash=h;manualPolicyLog.push({round:b.round,policy:structuredClone(manualPolicy)});}}
 if(manualPolicy.pauseAtRound&&b.round>=manualPolicy.pauseAtRound){await new Promise(r=>setTimeout(r,500));n--;continue;}
 while(!e.canAct()&&!['won','lost'].includes(b.phase)&&frames<1800000)tick();if(frames>=1800000){stopReason='native frame budget; not a game loss';break;}if(['won','lost'].includes(b.phase))break;
 if(!ritualStartSaved&&g.HonroAct2.current(b)?.id==='hold-knots'){ritualStartSaved=true;await writeFile(out+'/ritual-start.json',JSON.stringify({sourceHash,provenance,b,profile,...telemetry(),scope:'Unmodified fresh arrival, first input-safe boundary of hold-knots'}));}
 if(!ritualCompletionSaved&&ritualCompletedRound!==null){ritualCompletionSaved=true;await writeFile(out+'/ritual-complete.json',JSON.stringify({sourceHash,provenance,b,profile,...telemetry(),scope:'Unmodified fresh arrival, first input-safe boundary after hold completion'}));}
 if(ritualCompletedRound!==null&&b.round>=ritualCompletedRound+4){stopReason='ritual completed plus four round transitions; prefix observation only';break;}
 if(lastRound!==b.round){lastRound=b.round;const row={round:b.round,goal:g.HonroAct2.current(b)?.id,summary:g.HonroObjectives.state(b,st).summary,hold:a.holds?.['hold-knots'],fallenHeroes:b.units.filter(u=>u.side===0&&u.dead).map(u=>({id:u.id,cls:u.cls,hp:u.hp})),heroes:e.heroesAlive().map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,focus:u.focus,x:u.x,y:u.y,support:e.surface(u.x,u.y-5,u.y+5)?.t?.id})),resident:b.units.find(u=>u.honroProtected)?.hp,foes:e.alive(1).map(u=>({id:u.id,hp:u.hp,x:u.x,y:u.y})),pending:b.honroState.pendingEvents};rounds.push(JSON.parse(JSON.stringify(row)));console.log('ROUND',JSON.stringify({...row,foes:row.foes.length}));const sig=JSON.stringify({goal:row.goal,foes:row.foes.map(u=>[u.id,Math.round(u.hp)]),heroes:row.heroes.map(u=>[u.cls,Math.round(u.x/30),Math.round(u.y/30)])});stalledRounds=sig===lastSignature?stalledRounds+1:0;lastSignature=sig;if(stalledRounds>=12){stopReason='controller stalled: unchanged objective/enemies/positions for12 rounds';break;}await writeFile(out+'/progress.json',JSON.stringify({sourceHash,row,actions:actions.slice(-60),navEvents:navEvents.slice(-30),telemetryCounts:{enemyActions:enemyActions.length,shots:shots.length,damage:damage.length},ritualCompletedRound},null,2));await writeFile(out+'/checkpoint.json',JSON.stringify({sourceHash,b,profile,actions,rounds,navEvents,births,noticeLog,continues,frames,inputSerial,manualPolicyLog,manualJumpDone:[...manualJumpDone],...telemetry()}));}
 trackBirths();
 const current=g.HonroAct2.current(b),m=b.honroMarkers.find(x=>x.id===current?.id),spirit=current?.kind==='rescue'?e.unit(m.spiritId):null,weak=spirit&&(spirit.dead||spirit.hp<=spirit.maxHp*.4&&e.heroesAlive().some(v=>v.cls==='occultist'));
 if(current?.requiredClass||weak){const cls=current.requiredClass||(weak?'occultist':null),u=e.heroesAlive().find(u=>u.cls===cls&&!u.acted);if(u)e.select(u.id);}
 const wounded=e.heroesAlive().find(v=>hpFraction(v)<.35),healer=e.heroesAlive().find(v=>v.cls==='mage'&&!v.acted);if(wounded&&healer)e.select(healer.id);
 if(manualPolicy.select){const selected=e.heroesAlive().find(v=>v.cls===manualPolicy.select&&!v.acted);if(selected)e.select(selected.id);}
 const u=e.active;if(!u||u.side!==0||u.dead){stopReason='no usable active hero';break;}
 if(m?.action&&g.HonroInteractions.eligibility(app,m).ok){const spiritBefore=spirit?{hp:spirit.hp,maxHp:spirit.maxHp,dead:spirit.dead}:null;if(g.HonroInteractions.use(app,m)){actions.push({op:'E',round:b.round,hero:u.cls,target:m.id,spiritBefore});navigation.delete(u.id);continue;}}
 const jumpPlan=manualPolicy.jump?.[u.cls],jumpKey=jumpPlan&&(u.id+':'+jumpPlan.id);if(jumpPlan&&!manualJumpDone.has(jumpKey)&&e.grounded(u)&&u.moveLeft>e.jumpCost(u)+Math.abs(jumpPlan.x-u.x)+70){if(e.jump(u)){manualJumpDone.add(jumpKey);const start={x:u.x,y:u.y};for(let i=0;i<240&&e.canAct();i++){if(Math.abs(u.x-jumpPlan.x)>3)e.move(Math.sign(jumpPlan.x-u.x)*.35,DT);tick();if(i>4&&e.grounded(u))break;}actions.push({op:'jump',input:'manual-waypoint',round:b.round,hero:u.cls,from:start,to:{x:u.x,y:u.y},expectedSupport:jumpPlan.support,landedSupport:e.surface(u.x,u.y-5,u.y+5)?.t?.id});navigation.delete(u.id);}}
 const manualAim=manualPolicy.fire?.[u.cls];if(manualAim&&(!manualAim.target||!e.unit(manualAim.target)?.dead)){assert(u.loadout.includes(manualAim.skill),'Manual aim uses an equipped skill');assert(Number.isFinite(manualAim.angle)&&manualAim.angle>=-90&&manualAim.angle<=270&&manualAim.power>=.13&&manualAim.power<=1,'Manual aim is within UI input limits');const hpBefore=e.unit(manualAim.target)?.hp;if(e.fire(manualAim.skill,manualAim.angle,manualAim.power)){actions.push({op:'fire',input:'manual-aim',round:b.round,hero:u.cls,...manualAim,hpBefore});continue;}}
 if(healStake(u))continue;
 let foes=e.alive(1).filter(v=>g.HonroAct2.visible(b,v)||v.id===spirit?.id).filter(v=>!(weak&&v.id===spirit?.id));
 const priority=v=>current?.kind==='clear'&&current.cohorts!=='all'?Number(v.honroCohort===current.cohorts)*10000:current?.kind==='hold'?Number(dist(v,m)<current.contestRadius+150)*10000:spirit?Number(v.id===spirit.id)*10000:0;
 foes.sort((a,z)=>priority(z)-priority(a)||dist(a,u)-dist(z,u));
 const local=foes.filter(v=>dist(v,u)<1500),objectiveRush=!!m&&(current.kind==='rescue'&&u.cls==='occultist'||m.action&&g.HonroAct2.eligibility(app,m).ok||current.id==='knot-east'||!!manualPolicy.goals?.[u.cls]);let fired=false;
 if(!objectiveRush)for(const target of local.slice(0,4))if(fireAt(u,target)){fired=true;break;}
 if(fired)continue;
 const heal=(b.stakes||[]).filter(s=>s.skill==='M10'&&s.expires>b.round&&dist(s,u)<1600&&s.usedRounds?.[u.id]!==b.round).sort((a,z)=>dist(a,u)-dist(z,u))[0];
 let goal,enemy=false;
 if(current?.id==='knot-east'&&u.cls==='occultist'&&hpFraction(u)<.4)goal={id:'normal-retreat-west',x:Math.max(4600,u.x-650),y:C.topAt(b.terrain.find(t=>t.id==='rv-west-main-root'),Math.max(4600,u.x-650))};
 else if(wounded&&u.cls==='mage')goal=wounded;
 else if(objectiveRush)goal=m;
 else if(hpFraction(u)<.70&&heal)goal=heal;
 else if(current?.kind==='hold'&&(u.cls==='occultist'||!e.heroesAlive().some(h=>dist(h,m)<current.radius*.8)))goal=m;
 else if(current?.kind==='clear'){const eligible=foes.filter(v=>current.cohorts==='all'||v.honroCohort===current.cohorts);goal=eligible[0]||g.HonroObjectives.state(b,st).targets[0]||m;enemy=!!eligible[0];}
 else if(local.length){goal=local[0];enemy=true;}
 else goal=m||g.HonroObjectives.state(b,st).targets[0];
 if(manualPolicy.goals?.[u.cls]){goal=manualPolicy.goals[u.cls];enemy=false;}
 if(goal)advance(u,goal,enemy);if(!e.canAct())continue;
 if(m?.action&&g.HonroInteractions.eligibility(app,m).ok){const spiritBefore=spirit?{hp:spirit.hp,maxHp:spirit.maxHp,dead:spirit.dead}:null;if(g.HonroInteractions.use(app,m)){actions.push({op:'E',round:b.round,hero:u.cls,target:m.id,spiritBefore});navigation.delete(u.id);continue;}}
 if(healStake(u))continue;
 foes=foes.filter(v=>!v.dead&&dist(v,u)<1600);for(const target of foes.slice(0,4))if(fireAt(u,target)){fired=true;break;}
 if(!fired){e.wait();actions.push({op:'wait',round:b.round,hero:u.cls});}
}
if(!['won','lost'].includes(b.phase)&&!stopReason)stopReason='controller action budget exhausted; not a game loss';
const wavePressure=[...echoSources].map(source=>{const ids=new Set(births.filter(row=>row.source===source).map(row=>row.id));return{source,spawnedIds:[...ids],births:births.filter(row=>ids.has(row.id)),actions:enemyActions.filter(row=>ids.has(row.actorId)),shots:shots.filter(row=>ids.has(row.actor?.id)),damage:damage.filter(row=>ids.has(row.actorId)),firstPartyEffect:damage.find(row=>ids.has(row.actorId)&&row.targetSide===0)||null,playerTargetedActions:actions.filter(row=>ids.has(row.target)),receivedDamage:damage.filter(row=>ids.has(row.targetId)),conversions:conversions.filter(row=>ids.has(row.actor?.id))};});
const prefixComplete=ritualCompletedRound!==null&&b.round>=ritualCompletedRound+4&&!['lost'].includes(b.phase);
const result={sourceHash,provenance,prefixComplete,ritualCompletedRound,wavePressure,...telemetry(),initialProvenance:initialRecord?.provenance||provenance,timingScope:'seconds is this Node segment including planning pauses; early legacy continuation counters are incomplete, so neither seconds nor frames is total play-time/performance evidence',continues,manualPolicyLog,phase:b.phase,round:b.round,reason:b.winnerReason,stopReason,seconds:(performance.now()-started)/1000,frames,initialHeroes:initial.battle.units.filter(u=>u.side===0).map(u=>({cls:u.cls,hp:u.hp,level:u.level,ranks:u.ranks,loadout:u.loadout})),initialItems:initial.battle.items,items:b.items,goal:g.HonroAct2.current(b)?.id,done:a.done,hold:a.holds?.['hold-knots'],fallenHeroes:b.units.filter(u=>u.side===0&&u.dead).map(u=>({id:u.id,cls:u.cls,hp:u.hp})),heroes:e.heroesAlive().map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,x:u.x,y:u.y})),resident:b.units.find(u=>u.honroProtected),actions,rounds,navEvents,births,noticeLog,scope:'Fresh normal-input ritual prefix, ending four round transitions after hold completion. No whole-stage completion or quality approval claim. Fresh canonical spawns and all original enemies/objectives, actual level10 camp-trained build. Only normal input APIs after initialization; no items/state correction. Native engine with production App mission method, not browser or universal difficulty approval.'};
await writeFile(out+'/result.json',JSON.stringify(result,null,2));await writeFile(out+'/checkpoint.json',JSON.stringify({sourceHash,b,profile,actions,rounds,navEvents,births,noticeLog,continues,frames,inputSerial,manualPolicyLog,manualJumpDone:[...manualJumpDone],...telemetry()}));console.log('RESULT',JSON.stringify({...result,actions:actions.length,rounds:rounds.length,navEvents:navEvents.length,births:births.length,noticeLog:noticeLog.length,enemyActions:enemyActions.length,shots:shots.length,damage:damage.length,inputTrace:inputTrace.length,enemyQueues:enemyQueues.length,conversions:conversions.length,goalTransitions:goalTransitions.length,wavePressure:wavePressure.map(w=>({source:w.source,births:w.births.length,actions:w.actions.length,shots:w.shots.length,firstPartyEffect:w.firstPartyEffect,playerTargetedActions:w.playerTargetedActions,receivedDamage:w.receivedDamage.length})),resident:{hp:result.resident?.hp,resolved:result.resident?.honroResolved}}));assert.deepEqual(JSON.parse(JSON.stringify(b.items)),initial.battle.items,'No item used');if(!prefixComplete)process.exitCode=1;
