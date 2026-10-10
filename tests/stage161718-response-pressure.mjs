/** Bounded native-AI pressure fixtures, not normal-arrival or chapter-clear proof.
 * Isolated rows remove original opponents/NPCs and initialize supported hero
 * poses. Crowded rows preserve every initial actor and move only two heroes.
 * Legacy rows admit the actual chapter wave through its production executor;
 * its warning/opportunity is setup here and tested separately. After setup all
 * movement, aim, defense, projectiles, queue competition and damage are native. */
import assert from 'node:assert/strict';
import {runtimeParts} from '../shared/build.mjs';
import {authorEncounterDensity} from '../tools/map-forge/apply-encounter-density.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,D=g.HonroEncounterDensity;
const plain=v=>JSON.parse(JSON.stringify(v)),hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
let project=JSON.parse(await readFile(process.argv.find(a=>a.startsWith('--project='))?.slice(10)||'shared/data/campaign.json','utf8'));
project=plain(await authorEncounterDensity(project,g,{stages:[16,17,18]}));
const runtimeSha256=createHash('sha256').update((await runtimeParts({vector:false,render:false})).join('\n')).digest('hex'),stageSha256=Object.fromEntries([16,17,18].map(n=>[n,hash(project.stages[n-1])]));
const rows=[],newCases=[
 {n:16,source:'temple-cloister-answer',support:'tm-shelter-veranda',xs:[2720,2840,2960,3080]},
 {n:16,source:'temple-record-answer',support:'act2-floor',xs:[8880,9000,9120,9240]},
 {n:17,source:'worksite-brace-answer',support:'ws-west-machine-plinth',xs:[4000,4120,4240,4360]},
 {n:17,source:'worksite-axle-answer',support:'act2-floor',xs:[10040,10140,10240,10340],openedGate:true},
 {n:18,source:'bell-suppression-answer',support:'sb-suppression-court',xs:[2820,2940,3060,3180]},
 {n:18,source:'bell-descent-answer',support:'act2-floor',xs:[9240,9360,9480,9600]}
];
const legacyCases=[
 ...[0,3,6,9].map(index=>({n:16,source:'hold-hall-'+index,support:'tm-great-hall-plinth',xs:[6000,6120,6240,6360],legacy:{index,kind:'stoneLantern',n:Math.min(3,10-index),memory:'templeDefense'}})),
 ...[0,3,6,9].map(index=>({n:17,source:'hold-hoist-'+index,support:'ws-axle-footing',xs:[8410,8530,8650,8770],openedGate:true,legacy:{index,kind:'minecart',n:Math.min(3,10-index),memory:'worksiteDefense'}})),
 ...[0,3,6].map(index=>({n:18,source:'hold-silence-'+index,support:index===3?'act2-floor':'sb-suppression-court',xs:index===3?[5020,5140,5260,5380]:[2820,2940,3060,3180],splitMage:index===3,legacy:{index,kind:'bellCluster',n:Math.min(3,8-index),memory:'bellDescent'}})),
 {n:18,source:'keeper-retaliation',support:'act2-floor',xs:[11800,11920,12040,12160],legacy:{index:0,kind:'picks',n:4,memory:'bellDescent'}}
];
const crowdedCases=[
 {n:16,source:'temple-record-answer',crowded:true,poses:[['tm-east-stone-bridge',8650],['act2-floor',9340]]},
 {n:17,source:'worksite-brace-answer',crowded:true,poses:[['ws-west-machine-plinth',4360],['ws-east-hoist-buttress',6740]]},
 {n:17,source:'worksite-brace-answer',crowded:true,diagnostic:'distant-scout-prioritizes-nine-nearer-initial-guards',poses:[['ws-west-machine-plinth',4000],['ws-east-hoist-buttress',6740]]},
 {n:18,source:'bell-descent-answer',crowded:true,poses:[['act2-floor',9550],['act2-floor',11000]]}
];
function fixture(c){
 const st=plain(project.stages[c.n-1]);if(!c.crowded)st.units=st.units.filter(u=>u.team==='player');
 const p=C.defaults();p.settings.difficulty='normal';p.recruited=['archer','mage','knight','occultist'];
 for(const cls of p.recruited)p.heroes[cls].xp={16:37445,17:41755,18:46235}[c.n];
 const b=g.HonroMaps.createBattle(st,project,p,{origin:'campaign'});g.HonroStageRules.sanitizeStageBattle(b);
 const e=new C.Engine(b,()=>{},true),app={engine:e,profile:p,stage:g.HONRO_CONTENT.stages[c.n-1],event(){},sayLines(){},checkMission(){return false;}};
 g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);e.checkEnd=()=>false;
 // Repair precedes hold-hoist/axle response in the production mission. Leaving
 // this door closed would invent an impossible defense scenario.
 if(c.openedGate)for(const t of b.terrain)if(t.id==='gate-repair')t.broken=true;
 const poses=[];
 for(const[i,u]of e.heroesAlive().entries()){
  if(c.crowded&&i>=c.poses.length)continue;
  const [support,x]=c.crowded?c.poses[i]:c.splitMage&&u.cls==='mage'?['sb-suppression-court',3050]:[c.support,c.xs[i]];
  const pt=g.HonroMapEngine.surfaceY(b.terrain,x,undefined,support);assert(pt,c.source+' supported hero');
  Object.assign(u,{x,y:pt.y,vx:0,vy:0});assert(C.validTerrainContactPose(b.terrain,u),c.source+' valid '+u.id);
  for(const other of b.units.filter(v=>v!==u))assert(!(Math.abs(other.x-u.x)<other.r+u.r+8&&Math.min(other.y,u.y)>Math.max(other.y-other.h,u.y-u.h)-8),c.source+' setup overlaps '+other.id);
  poses.push({id:u.id,support,x,y:pt.y});
 }
 return{b,e,app,poses};
}
function admit(q,c,choice){
 const {b,e,app}=q,prior=b.units.length;
 if(c.legacy){
  const l=c.legacy;b.honroState[l.memory]??={warnings:{},entries:{}};
  b.honroState[l.memory].warnings[c.source]={serial:0,round:1,opportunity:{id:e.heroesAlive()[0].id,serial:1,round:1}};
  b.honroState.actorTurnSerial=1;app.actorBoundary=e.heroesAlive()[0].id;
  assert(g.HonroAllies.execute(app,{type:'spawn',source:c.source,kind:l.kind,n:l.n}),c.source+' production chapter entry');app.actorBoundary=null;
 }else{
  const ev=b.honroEvents.find(v=>v.id===c.source),members=[ev.action.actions,...ev.honroDensityAlternatives][choice].map(a=>({...a,elite:a.honroDensityElite,role:a.honroDensityRole}));
  assert(D.spawnMembers(app,{source:c.source,n:3},{members}),c.source+' exact atomic entry '+choice);
 }
 const born=b.units.slice(prior);if(c.legacy)for(const[i,u]of born.entries()){u.honroCohort='reinforcement';u.honroAct2Elite=(i+1)%4===0||born.length>=3&&i+1===born.length;u.honroAct2Revision=2;g.HonroAct2.tuneEncounter(u,c.n);}assert.equal(born.length,c.legacy?.n||3);assert(born.every(u=>u.honroSpawnSource===c.source));
 for(const ev of b.honroEvents)b.honroState.flags['event:'+ev.id]=true;b.honroState.pendingEvents=[];return born;
}
function run(c,choice=0){
 const q=fixture(c),{b,e}=q,born=admit(q,c,choice),bornIds=born.map(u=>u.id),initial=plain(b.units),actions=[],damage=[],shots=[],queues=[],playerResponses=[];
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){const u=e.active,was=u?.acted,round=b.round,out=finish(...args);if(u?.side===1&&!was&&u.acted)actions.push({round,id:u.id,x:u.x,y:u.y,intent:u.intent});return out;};
 const hurt=e.hurt.bind(e);e.hurt=function(u,...args){const hp=u.hp,shield=u.shield||0,out=hurt(u,...args);if(hp>u.hp||shield>(u.shield||0))damage.push({round:b.round,id:u.id,side:u.side,owner:args[1],amount:hp-u.hp,shieldDamage:Math.max(0,shield-(u.shield||0))});return out;};
 const fire=e.fire.bind(e);e.fire=function(skill,angle,power,...args){const u=e.active,out=fire(skill,angle,power,...args);if(out&&u?.side===1)shots.push({round:b.round,id:u.id,skill,angle,power,x:u.x,y:u.y});return out;};
 const switchTeam=e.switchTeam.bind(e);e.switchTeam=function(...args){const was=b.side,out=switchTeam(...args);if(was===0&&b.side===1)queues.push({round:b.round,queue:[...b.queue],eligible:e.combatEnemies().map(u=>u.id)});return out;};
 const count=Math.min(c.crowded?b.enemyLimit:born.length,b.enemyLimit)*3;let frames=0;
 while(actions.length<count&&frames<25000&&e.heroesAlive().length){if(e.canAct()){const u=e.active;playerResponses.push({round:b.round,frame:frames,actorId:u.id,kind:'defend',x:u.x,y:u.y,detail:'Ordinary wait/guard input at the supported fixture post; no target, HP, aim or movement injection after setup.'});e.wait();}e.tick(C.STEP);frames++;}
 const waveActions=actions.filter(a=>bornIds.includes(a.id)),waveShots=shots.filter(a=>bornIds.includes(a.id)),waveDamage=damage.filter(a=>a.side===0&&bornIds.includes(a.owner)),effective=waveDamage.reduce((a,d)=>a+d.amount+d.shieldDamage,0);
 const row={stage:c.n,source:c.source,choice,mode:c.crowded?'all-initial-actors-preserved':'isolated-wave',diagnostic:c.diagnostic||null,setup:{heroPoses:q.poses,removedOriginalActors:!c.crowded,openedRepairGate:!!c.openedGate,missionEliteFlagsAppliedAsSetup:!!c.legacy,splitSuppressionMage:!!c.splitMage},stageSha256:hash(project.stages[c.n-1]),initial,spawnedIds:bornIds,frames,actions,shots,damage,queues,playerResponses,firstAction:waveActions[0],firstShot:waveShots[0],firstEffect:waveDamage[0],heroHPOrShieldDamage:effective,final:plain(b.units)};rows.push(row);
 assert.equal(actions.length,count,c.source+' exactly three enemy rounds');if(!c.diagnostic){assert(waveActions.length,c.source+' wave enters real capped queue');assert(waveShots.length,c.source+' at least one actual wave attack');assert(effective>0,c.source+' attack reaches guarded HP or shield within three enemy rounds');}else assert(damage.some(d=>d.side===0&&!bornIds.includes(d.owner)),'Distant split fixture still has pressure from original defenders');assert(queues.every(q=>q.queue.length<=b.enemyLimit));
 if(c.crowded){assert.equal(initial.filter(u=>u.side===1&&!bornIds.includes(u.id)).length,{16:49,17:50,18:55}[c.n]);assert(queues.some(q=>q.eligible.length>b.enemyLimit),'Real cap competition');assert(actions.some(a=>!bornIds.includes(a.id)),'Original defenders retain actions');}
 console.log(c.diagnostic?'DIAGNOSTIC pressure':'PASS pressure',JSON.stringify({stage:c.n,source:c.source,choice,crowded:!!c.crowded,actions:waveActions.length,shots:waveShots.length,damage:effective,firstEffectRound:waveDamage[0]?.round??null}));
}
for(const c of newCases)for(const choice of[0,1])run(c,choice);
for(const c of legacyCases)run(c);
for(const c of crowdedCases)run(c);
await mkdir('_local/reports/encounter-density',{recursive:true});await writeFile('_local/reports/encounter-density/stage161718-response-pressure.json',JSON.stringify({projectSha256:hash(project),runtimeSha256,stageSha256,scope:'Explicit supported-pose native AI fixtures. All 12 new primary/alternate entries, every legacy 10/10/12 wave phase, and one real initial-roster queue competition per chapter. No normal arrival, objective progression, browser, human balance or clear claim.',rows},null,2)+'\n');
