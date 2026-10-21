/** Actual Stage11 victory growth -> current two-goal Stage12. Native production
 * App/Engine with DOM/storage/clock doubles. Only legal inputs after launch. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {navigator} from './stage18-bell-fullplay-helper.mjs';
import {auditQuarryEngine} from './stage12-quarry-fullplay-helper.mjs';
const input=process.env.HONRO_STAGE12_PROFILE;if(!input)throw Error('Genuine prior victory profile required');
const out=process.env.HONRO_FULLPLAY_OUT||'/tmp/stage12-normal',h=await appHarness(),{g,C}=h;
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const sourceHash=hash(g.HONRO_PROJECT),entry=JSON.parse(await readFile(input,'utf8')),profile=plain(entry.profile);
assert(profile.cleared[11]);assert.equal(profile.settings.difficulty,'normal');
const resume=process.env.HONRO_FULLPLAY_CONTINUE?JSON.parse(await readFile(process.env.HONRO_FULLPLAY_CONTINUE,'utf8')):null;
if(resume)assert.equal(resume.sourceHash,sourceHash);
let app=h.load(resume?.profile||profile),now=0,frames=0;g.performance={now:()=>now};
if(resume)app.continue();else app.launch(12);h.finish(app);
const e=app.engine,b=e.b,canonical=g.HONRO_PROJECT.stages[11];assert.equal(b.honroStage,12);assert.equal(b.difficulty,'normal');
assert.deepEqual(plain(g.HonroAct2.steps(b).map(s=>s.id)),['sign','route-exit']);
await mkdir(out,{recursive:true});
const provenance={sourceHash,entryFile:input,entryFileSha256:hash(await readFile(input,'utf8')),checkoutCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),runnerSha256:hash(await readFile(new URL(import.meta.url),'utf8')),scope:'Normal resources from genuine11 growth; production App/Engine input policy, DOM/storage/clock doubles, not browser fullplay'};
const actions=resume?.actions||[],rounds=resume?.rounds||[],manualPolicy={},notices=resume?.notices||[];
let audit,nav,navGate,lastRound=0,stopReason=null;
const record=r=>actions.push({round:b.round,frame:frames,...plain(r)}),ready=()=>app.canInput(),dist=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y),hpFraction=u=>u.hp/u.maxHp;
audit=auditQuarryEngine(b,e,()=>({round:b.round,frame:frames}));
const tick=()=>{now+=1000/60;audit.production(()=>{if(!app.dialogue){e.tick(C.STEP);if(!app.dialogue)app.missionTick(C.STEP);}g.HonroStory.tick(app,now);if(app.dialogue)h.finish(app);});audit.guard();frames++;};
const event=app.event.bind(app);app.event=(text,...args)=>{notices.push({round:b.round,text});return event(text,...args);};
function navigation(){const gate=g.HonroStage12Quarry.memory(b).gate;if(!nav||gate!==navGate){navGate=gate;nav=navigator(g,b,e,{tick,ready,record,stageId:12,routes:canonical.design.quarry.routes.filter(r=>r.quarryState!=='open'||gate==='open')});}}
async function save(label){app.export();const p=await h.exported(),data={sourceHash,provenance,profile:p,b:plain(b),actions,rounds,notices,frames,audit:audit.log};await writeFile(out+'/'+label+'.json',JSON.stringify(data));return data;}
if(!resume)await save('initial');
function fireAt(u,target){const spirit=target.honroSpirit&&!target.manifested;let skills=u.loadout.map(id=>C.SKILLS[id]).filter(s=>s.damage>0&&!s.passive&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus);skills.sort((a,z)=>(spirit?Number(z.id==='O08')-Number(a.id==='O08'):0)||z.damage-a.damage);
 for(const skill of skills.slice(0,3)){
  if(skill.martial&&skill.branch==='sword'){let angle=Math.atan2(u.y-u.h*.58-(target.y-target.h*.5),target.x-u.x)*180/Math.PI;if(angle< -90)angle+=360;for(const power of[1,.7,.2])if(C.meleeContains(e,u,target,C.meleeRange(u,skill,power),-angle*Math.PI/180,C.meleeSpan(u,skill,power))&&e.fire(skill.id,angle,power)){actions.push({op:'fire',round:b.round,hero:u.cls,skill:skill.id,target:target.id,hpBefore:target.hp});return true;}continue;}
  let best=null;for(const aim of e.shotSeeds(u,skill,target)){const v=C.shotViable(e,u,skill,target,aim.angle,aim.power);if((v.ok||target.hp<=2&&v.enemyDamage>0)&&v.risk<1&&v.miss<Math.max(85,skill.radius+target.r+55)&&(!best||v.net>best.net))best={...aim,net:v.net};}
  if(!best&&skill===skills[0]){const aim=e.bestShot(u,skill,target),v=C.shotViable(e,u,skill,target,aim.angle,aim.power);if((v.ok||target.hp<=2&&v.enemyDamage>0)&&v.risk<1&&v.miss<Math.max(85,skill.radius+target.r+55))best=aim;}
  if(best&&e.fire(skill.id,best.angle,best.power)){actions.push({op:'fire',round:b.round,hero:u.cls,skill:skill.id,target:target.id,hpBefore:target.hp,angle:best.angle,power:best.power});return true;}
 }return false;}
function healStake(u){if(u.cls!=='mage'||!u.loadout.includes('M10')||e.manaCost(C.SKILLS.M10,u)>u.focus)return false;const hurt=e.heroesAlive().filter(v=>hpFraction(v)<.78&&dist(v,u)<3000);if(!hurt.length)return false;const target=hurt.find(v=>v.cls===manualPolicy.healTarget)||hurt.sort((a,z)=>hpFraction(a)-hpFraction(z))[0];if((b.stakes||[]).some(s=>s.skill==='M10'&&s.expires>b.round+1&&dist(s,target)<180))return false;let best=null;const aims=[...e.shotSeeds(u,C.SKILLS.M10,target),...Array.from({length:36},(_,i)=>-85+i*10).flatMap(angle=>[.2,.4,.6,.8,1].map(power=>({angle,power})))];for(const {angle,power}of aims){const hit=e.predict(u,C.SKILLS.M10,angle,power);const d=dist(hit,target);if(hit.terrain&&Math.abs(hit.y-target.y)<70&&d<90&&(!best||d<best.d))best={angle,power,d,x:hit.x,y:hit.y};}if(best&&e.fire('M10',best.angle,best.power)){actions.push({op:'heal-stake',round:b.round,hero:u.cls,target:target.id,...best});return true;}return false;}
for(let turn=0;turn<Number(process.env.HONRO_FULLPLAY_ACTION_LIMIT||260)&&!['won','lost'].includes(b.phase);turn++){
 for(let i=0;!ready()&&!['won','lost'].includes(b.phase)&&i<30000;i++)tick();if(['won','lost'].includes(b.phase))break;if(!ready()){stopReason='policy frame observation limit';break;}
 navigation();
 if(lastRound!==b.round){lastRound=b.round;const row={round:b.round,goal:g.HonroAct2.current(b)?.id,gate:g.HonroStage12Quarry.memory(b).gate,heroes:e.heroesAlive().map(u=>({cls:u.cls,hp:u.hp,focus:u.focus,x:u.x,y:u.y,support:nav.surface(u)})),enemies:e.alive(1).length,done:plain(g.HonroAct2.memory(b).done)};rounds.push(row);console.log('ROUND',JSON.stringify(row));await save('checkpoint');if(b.round>Number(process.env.HONRO_FULLPLAY_ROUND_LIMIT||40)){stopReason='bounded normal observation';break;}}
 const goal=g.HonroAct2.current(b),m=b.honroMarkers.find(v=>v.id===goal?.id),u=e.active;
 if(!u||u.side!==0){stopReason='no usable hero';break;}
 const interact=()=>m?.action&&g.HonroInteractions.eligibility(app,m).ok&&audit.production(()=>g.HonroInteractions.use(app,m));
 if(interact()){record({op:'E',hero:u.cls,target:m.id});await save('sign-action');continue;}
 if(healStake(u))continue;
 const destination=goal.id==='route-exit'?b.honroMarkers.find(v=>v.id===(process.env.HONRO_STAGE12_EXIT==='upper'?'route-upper-exit':'route-lower-exit')):m;
 const guards=goal.id==='sign'?g.HonroAct2.interactionThreats(b,m):[],ids=new Set(guards.map(v=>v.id));
 const foes=e.alive(1).filter(v=>g.HonroAct2.visible(b,v)).sort((a,z)=>Number(ids.has(z.id))-Number(ids.has(a.id))||dist(a,u)-dist(z,u));
 let fired=false;
 // Distant work parties are bypassed. Fight actual sign guards or immediate
 // pressure while approaching; do not manufacture a compulsory clear-all.
 if(goal.id==='sign'&&dist(u,m)<850)for(const t of foes.filter(v=>ids.has(v.id)&&dist(v,u)<1500).slice(0,2))if(fireAt(u,t)){fired=true;break;}
 if(fired)continue;
 if(destination)nav.advance(u,destination,false);
 if(!ready())continue;
 if(interact()){record({op:'E',hero:u.cls,target:m.id});await save('sign-action');continue;}
 if(goal.id==='route-exit'&&g.HonroStage12Quarry.memory(b).gate==='open'&&!rounds.some(v=>v.snapshot==='gate-open')){await save('gate-open');rounds.push({snapshot:'gate-open',round:b.round});}
 for(const t of foes.filter(v=>!v.dead&&dist(v,u)<1100).slice(0,2))if(fireAt(u,t)){fired=true;break;}
 if(!fired){record({op:'defend',hero:u.cls,from:{x:u.x,y:u.y}});audit.production(()=>app.defend());}
}
await save('terminal');
if(b.phase==='won'){audit.production(()=>{h.finish(app);app.outcome();h.finish(app);});assert(app.profile.cleared[12]);}
assert.equal(audit.log.externalWrites.length,0);assert.equal(audit.log.recoveries.length,0);
const result={...provenance,phase:b.phase,round:b.round,stopReason,goals:plain(g.HonroAct2.memory(b).done),route:plain(b.honroRouteChoice),gate:plain(g.HonroStage12Quarry.memory(b)),heroes:e.heroesAlive().map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,x:u.x,y:u.y})),remainingEnemies:e.alive(1).length,items:plain(b.items),inputCount:actions.length,frames,audit:{externalWrites:audit.log.externalWrites,recoveries:audit.log.recoveries}};
await writeFile(out+'/result.json',JSON.stringify(result,null,2));console.log('RESULT',JSON.stringify(result));if(b.phase!=='won')process.exitCode=1;
