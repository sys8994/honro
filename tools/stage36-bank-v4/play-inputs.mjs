/** Adaptive ordinary-input smoke policy, not a balance or human-fun oracle.
 * Prepared stage-entry profile, actual App/Engine; no resource or actor overrides.
 * Records an input tape for the constrained objective runner to replay separately. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {saveInputCheckpoint} from '../density-qa/input-checkpoint.mjs';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {runtimeDigest} from '../stage31/probes.mjs';
import {createAppAdapter} from '../stage36-production/app-adapter.mjs';
const file=process.argv[2],out=process.argv[3];if(!file||!out)throw Error('draft and output directory required');await mkdir(out,{recursive:true});await mkdir(out+'/atomic-prefix',{recursive:true});
const sourceSHA256=createHash('sha256').update(await readFile(file)).digest('hex'),runtimeSHA256=await runtimeDigest();
const p=JSON.parse(await readFile(file,'utf8')),entryBuild=process.argv[4]||'unspent',a=await createAppAdapter(p,'stage-36',{entryBuild}),{g,app,engine:e}=a,C=g.HONRO_CORE,b=e.b,inputs=[],observations=[],hurts=[];
const originalHurt=e.hurt.bind(e);e.hurt=(u,...args)=>{const before=u.hp,owner=args[1],result=originalHurt(u,...args);if(u.hp<before)hurts.push({frame:frames,round:b.round,target:u.id,owner,loss:before-u.hp});return result;};
let frames=0,actions=0,shots=0,lastRound=0,reason='budget';
const alive=u=>u&&!u.dead&&u.hp>0;
function log(input){const last=inputs.at(-1);if(last&&['advance','move'].includes(input.op)&&last.op===input.op&&last.direction===input.direction&&last.frames+input.frames<=3600)last.frames+=input.frames;else inputs.push(input);}
function tick(n=1){for(let i=0;i<n&&frames<58000;i++){a.tick();frames++;if(frames%300===0&&process.memoryUsage().rss>2*1024**3){saveInputCheckpoint(out+'/atomic-prefix',{inputs,frames,entryBuild,projectSHA256:sourceSHA256,state:a.state()});writeFileSync(out+'/incomplete-memory.json',JSON.stringify({status:'inconclusive-native-rss-guard-not-gameplay-failure',frames,memory:process.memoryUsage(),limitBytes:2*1024**3},null,2));throw Error('Native test RSS guard exceeded2GiB; incomplete prefix retained');}if(frames%1200===0){saveInputCheckpoint(out+'/atomic-prefix',{inputs,frames,entryBuild,projectSHA256:sourceSHA256,state:a.state()});global.gc?.();console.log('PROGRESS',frames,b.round,b.active,Math.round(process.memoryUsage().rss/1048576));}}}
function advance(n=30){log({op:'advance',frames:n});tick(n);}
function move(direction,n=24){log({op:'move',direction,frames:n});for(let i=0;i<n;i++){if(app.canInput())e.move(direction,C.STEP);tick();}}
function jump(){log({op:'jump'});return e.jump();}
function defend(){log({op:'defend'});app.defend();actions++;advance(30);}
function plan(u){let best=null;const enemies=b.units.filter(v=>v.side===1&&alive(v)).sort((a,z)=>Math.abs(a.x-u.x)-Math.abs(z.x-u.x)).slice(0,3);for(const target of enemies){for(const id of u.loadout){const sk=C.SKILLS[id];if(!sk||sk.passive||!e.skillAllowed(sk,u)||e.cooldownLeft(u,id)>0)continue;const aims=[...e.shotSeeds(u,sk,target),...[15,35,55,75].flatMap(angle=>[.35,.65,1].map(power=>({angle:target.x>=u.x?angle:180-angle,power})))];for(const aim of aims){if(e.manaCost(sk,u,aim.power)>u.focus)continue;const hit=e.predict(u,sk,aim.angle,aim.power,undefined,false);if(u.cls!=='knight'&&hit.unit!==target.id&&Math.hypot(hit.x-target.x,hit.y-(target.y-target.h*.5))>240)continue;const safe=C.shotViable(e,u,sk,target,aim.angle,aim.power);if(safe.ok&&safe.risk<.5){const damage=safe.enemyDamage||1,score=damage+(damage>=target.hp?500:0);if(!best||score>best.score)best={id,target:target.id,...aim,score};break;}}}}return best;}
function state(){return{round:b.round,phase:b.phase,active:b.active,frames,actions,shots,enemies:b.units.filter(v=>v.side===1&&alive(v)).length,heroes:b.units.filter(v=>v.side===0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead,move:u.moveLeft})),door:structuredClone(b.honroAct4PreviewState?.door),preview:structuredClone(b.honroAct4PreviewState),modalOpen:app.modal.classList.contains('open'),dialogueActive:!!app.dialogue};}
while(frames<58000&&actions<240&&inputs.length<1900){
 if(a.success()){reason='exited-and-won';break;}if(b.phase==='lost'||!b.units.some(u=>u.side===0&&alive(u))){reason='lost';break;}
 if(app.modal.classList.contains('open')){log({op:'close-modal'});app.close();advance(1);continue;}
 if(app.dialogue||b.honroAct4PreviewState?.arrivalTour?.active){advance(2);log({op:'next-dialogue'});a.next();advance(2);continue;}
 if(b.round!==lastRound){lastRound=b.round;const row=state();observations.push(row);console.log(JSON.stringify(row));writeFileSync(out+'/checkpoint.json',JSON.stringify({sourceSHA256,runtimeSHA256,...row,inputs:inputs.length},null,2));writeFileSync(out+'/checkpoint-inputs.json',JSON.stringify([{id:'village-door-exit',kind:'objective',entryBuild,inputs}],null,2));}
 if(!app.canInput()){advance(30);continue;}
 const active=e.active;if(active){log({op:'camera',x:active.x,y:active.y-100,scale:.6});a.camera(active.x,active.y-100,.6);}
 const foes=b.units.filter(u=>u.side===1&&alive(u));
 if(!foes.length){
  if(a.interact()){log({op:'interact'});advance(5);continue;}
  const q=b.honroAct4PreviewState;const doorDone=q.events.door_falls?.terminal&&['A4.S36.DOOR.01','A4.S36.DOOR.02'].every(id=>q.receipts.includes(id));
  const left=!doorDone?e.unit('knight'):b.units.find(u=>u.side===0&&alive(u)&&u.x<=6520);
  if(!doorDone&&left&&Math.abs(left.x-2370)<120){if(b.active!==left.id){log({op:'select',actor:left.id});app.selectHero(left.id);}advance(30);continue;}
  if(!left){advance(30);continue;}if(b.active!==left.id){log({op:'select',actor:left.id});app.selectHero(left.id);}
  const u=e.active;if(!u||u.id!==left.id){defend();continue;}if(u.moveLeft<100){defend();continue;}
  const prior=u.x;if(e.grounded(u)&&u.x>6150&&u.x<6305)jump();move(u.x<(doorDone?6590:2370)?1:-1,18);if(Math.abs(u.x-prior)<2&&e.grounded(u))jump();continue;
 }
 const u=e.active;if(!u||u.side!==0){advance(30);continue;}if(!e.grounded(u)){const nearest=foes.slice().sort((a,z)=>Math.abs(a.x-u.x)-Math.abs(z.x-u.x))[0];move(nearest.x>=u.x?1:-1,20);continue;}
 const shot=plan(u);if(shot){log({op:'fire',skill:shot.id,angle:shot.angle,power:shot.power});const fired=e.fire(shot.id,shot.angle,shot.power);observations.push({type:'shot',actor:u.id,target:shot.target,round:b.round,accepted:fired,x:u.x,y:u.y});if(fired){shots++;actions++;advance(45);continue;}}
 if(u.moveLeft<100){defend();continue;}
 const target=foes.sort((a,z)=>Math.abs(a.x-u.x)-Math.abs(z.x-u.x))[0],dir=target.x>=u.x?1:-1,prior=u.x;

 // Lower-channel test policy drops through a real one-way span, never teleports.
 if(target.y-u.y>180&&Math.abs(target.x-u.x)<700&&e.canDrop()){log({op:'drop'});app.drop();advance(40);}else move(dir,28);
 if(Math.abs(u.x-prior)<3&&e.grounded(u)){if(!jump())defend();else move(dir,28);}
}
const sourceSHA256AtFinish=createHash('sha256').update(await readFile(file)).digest('hex'),runtimeSHA256AtFinish=await runtimeDigest();
const summary={sourceSHA256,sourceSHA256AtFinish,runtimeSHA256,runtimeSHA256AtFinish,entryBuild,training:a.training,scope:a.scope+' Adaptive expert input smoke, not browser play or human difficulty approval.',reason,success:a.success(),hurts,...state(),inputs:inputs.length,observations,renders:a.renders};
await writeFile(out+'/inputs.json',JSON.stringify([{id:'village-door-exit',kind:'objective',entryBuild,inputs}],null,2));await writeFile(out+'/result.json',JSON.stringify(summary,null,2));console.log('RESULT',JSON.stringify({...summary,observations:undefined}));

assert.equal(sourceSHA256AtFinish,sourceSHA256);assert.equal(runtimeSHA256AtFinish,runtimeSHA256);
