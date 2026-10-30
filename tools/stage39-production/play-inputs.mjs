import {writeFileSync} from 'node:fs';
/** Adaptive ordinary-input smoke policy, not a balance or human-fun oracle.
 * Prepared stage-entry profile, actual App/Engine; no resource or actor overrides.
 * Records an input tape for the constrained objective runner to replay separately. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createAppAdapter} from './app-adapter.mjs';
const killBoss=process.argv.includes('--kill-boss');
const file=process.argv[2],out=process.argv[3];if(!file||!out)throw Error('draft and output directory required');await mkdir(out,{recursive:true});
const p=JSON.parse(await readFile(file,'utf8')),entryBuild=process.argv[4]||'unspent',a=await createAppAdapter(p,'stage-39',{entryBuild}),{g,app,engine:e}=a,C=g.HONRO_CORE,b=e.b,inputs=[],observations=[],hurts=[];
const originalHurt=e.hurt.bind(e);e.hurt=(u,...args)=>{const before=u.hp,owner=args[1],result=originalHurt(u,...args);if(u.hp<before)hurts.push({frame:frames,round:b.round,target:u.id,owner,loss:before-u.hp});return result;};
let frames=0,actions=0,shots=0,lastRound=0,reason='budget';
const alive=u=>u&&!u.dead&&u.hp>0;
function log(input){const last=inputs.at(-1);if(last&&['advance','move'].includes(input.op)&&last.op===input.op&&last.direction===input.direction&&last.frames+input.frames<=3600)last.frames+=input.frames;else inputs.push(input);}
function tick(n=1){for(let i=0;i<n&&frames<85000;i++){a.tick();frames++;if(frames%1200===0){console.log('PROGRESS',JSON.stringify(state()));writeFileSync(out+'/checkpoint-inputs.json',JSON.stringify([{id:'rescue-exit',kind:'objective',entryBuild,inputs}]));}}}
function advance(n=30){log({op:'advance',frames:n});tick(n);}
function move(direction,n=24){log({op:'move',direction,frames:n});for(let i=0;i<n;i++){if(app.canInput())e.move(direction,C.STEP);tick();}}
function jump(){log({op:'jump'});return e.jump();}
function defend(){log({op:'defend'});app.defend();actions++;advance(30);}
const lastPlan=new Map();
function plan(u){const last=lastPlan.get(u.id);if(last&&Math.hypot(u.x-last.x,u.y-last.y)<150&&frames-last.frame<240)return null;lastPlan.set(u.id,{x:u.x,y:u.y,frame:frames});let best=null;const enemies=b.units.filter(v=>v.side===1&&alive(v)&&(!v.honroAct4WreckBoss||killBoss)&&Math.hypot(v.x-u.x,v.y-u.y)<2400).sort((a,z)=>Math.abs(a.x-u.x)-Math.abs(z.x-u.x)).slice(0,3);for(const target of enemies){for(const id of u.loadout){const sk=C.SKILLS[id];if(!sk||sk.passive||!e.skillAllowed(sk,u)||e.cooldownLeft(u,id)>0)continue;const aims=[...e.shotSeeds(u,sk,target),...[15,35,55,75].flatMap(angle=>[.35,.65,1].map(power=>({angle:target.x>=u.x?angle:180-angle,power})))];for(const aim of aims){if(e.manaCost(sk,u,aim.power)>u.focus)continue;const hit=e.predict(u,sk,aim.angle,aim.power,undefined,false);if(u.cls!=='knight'&&hit.unit!==target.id&&Math.hypot(hit.x-target.x,hit.y-(target.y-target.h*.5))>240)continue;const safe=C.shotViable(e,u,sk,target,aim.angle,aim.power);if(safe.ok&&safe.risk<.5){const damage=safe.enemyDamage||1,score=damage+(damage>=target.hp?500:0);if(!best||score>best.score)best={id,target:target.id,...aim,score};break;}}}}return best;}
const q0=()=>b.honroAct4PreviewState;
function state(){return{round:b.round,phase:b.phase,active:b.active,frames,actions,shots,enemies:b.units.filter(v=>v.side===1&&alive(v)).length,heroes:b.units.filter(v=>v.side===0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead,move:u.moveLeft})),rescue:{net:q0()?.netOpen,anchor:q0()?.exitStable,rescued:q0()?.rescued},npcs:b.units.filter(u=>u.honroAct4Resident).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp})),recoveries:b.honroAct4PreviewState?.water?.recoveries};}
while(frames<85000&&actions<240&&inputs.length<1900){
 if(a.success()){reason='exited-and-won';break;}if(b.phase==='lost'||!b.units.some(u=>u.side===0&&alive(u))){reason='lost';break;}
 if(app.modal.classList.contains('open')){log({op:'close-modal'});app.close();advance(1);continue;}
 if(app.dialogue||b.honroAct4PreviewState?.arrivalTour?.active){log({op:'skip-dialogue'});a.skip();advance(1);continue;}
 if(b.round!==lastRound){lastRound=b.round;const row=state();observations.push(row);console.log(JSON.stringify(row));}
 if(!app.canInput()){advance(30);continue;}
 const q=b.honroAct4PreviewState;
 const foes=b.units.filter(u=>u.side===1&&alive(u)&&(!u.honroAct4WreckBoss||killBoss));
 if(!foes.length){
  if(q.stabilizing||q.releasing){advance(30);continue;}
  if(a.interact()){log({op:'interact'});advance(5);continue;}
  let desired,goal;
  if(!q.netOpen){desired=b.units.find(u=>u.cls==='occultist'&&u.side===0);goal=5400;}
  else if(!q.exitStable){desired=b.units.find(u=>u.cls==='mage'&&u.side===0);goal=6100;}
  else{desired=b.units.filter(u=>u.side===0&&alive(u)&&u.x<=8300).sort((x,y)=>y.x-x.x)[0];goal=8400;}
  if(!desired){defend();continue;}
  if(b.active!==desired.id){log({op:'select',actor:desired.id});app.selectHero(desired.id);}
  const u=e.active;if(!u||u.id!==desired.id){defend();continue;}
  if(u.moveLeft<100){defend();continue;}
  if(goal<6200&&u.x>5000&&u.y<1900&&e.canDrop()){log({op:'drop'});app.drop();advance(40);continue;}
  const prior=u.x;move(u.x<goal?1:-1,18);if(Math.abs(u.x-prior)<2&&e.grounded(u))jump();continue;
 }
 const u=e.active;if(!u||u.side!==0){advance(30);continue;}if(!e.grounded(u)){const nearest=foes.slice().sort((a,z)=>Math.abs(a.x-u.x)-Math.abs(z.x-u.x))[0];move(nearest.x>=u.x?1:-1,20);continue;}
 const shot=plan(u);if(shot){log({op:'fire',skill:shot.id,angle:shot.angle,power:shot.power});const fired=e.fire(shot.id,shot.angle,shot.power);observations.push({type:'shot',actor:u.id,target:shot.target,round:b.round,accepted:fired,x:u.x,y:u.y});if(fired){shots++;actions++;advance(45);continue;}}
 if(u.moveLeft<100){defend();continue;}
 const target=foes.sort((a,z)=>Math.abs(a.x-u.x)-Math.abs(z.x-u.x))[0],dir=(target.x>=u.x?1:-1),prior=u.x;

 // Ordinary drop-through input only when a target is below an actual one-way span.
 if(target.y-u.y>180&&Math.abs(target.x-u.x)<700&&e.canDrop()){log({op:'drop'});app.drop();advance(40);}else move(dir,60);
 if(Math.abs(u.x-prior)<3&&e.grounded(u)){if(!jump())defend();else move(dir,60);}
}
const summary={killBoss,entryBuild,training:a.training,scope:a.scope+' Adaptive expert input smoke, not browser play or human difficulty approval.',reason,success:a.success(),hurts,...state(),inputs:inputs.length,observations};
await writeFile(out+'/inputs.json',JSON.stringify([{id:'rescue-exit',kind:'objective',entryBuild,inputs}],null,2));await writeFile(out+'/result.json',JSON.stringify(summary,null,2));console.log('RESULT',JSON.stringify({...summary,observations:undefined}));
