/** Controlled representative encounters, not a fresh Stage11 completion.
 * Scenario poses/earlier completed objectives are initialized once. Afterwards
 * only real selection, movement, jump, fire, E, wait, engine and mission ticks.
 * No HP/focus/movement/XP refill, forced damage, hidden action, item or teleport. */
import assert from 'node:assert/strict';import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';import{createHash}from'node:crypto';
import{runtime,battlefield}from'../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
g.document={getElementById(){return null;},addEventListener(){}};vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const selected=process.argv.slice(2),cases=selected.length?selected:['defense','rescue'],rows=[];
await mkdir('_local/reports/stage11-ravine',{recursive:true});
for(const name of cases){
 assert(['defense','rescue'].includes(name),'Unknown representative encounter');
 const profile=C.defaults();profile.recruited=g.HonroStageRules.stageParty(11);
 for(const cls of profile.recruited){profile.heroes[cls].xp=g.HonroProgression.legacyCampaignAnchor(10);if(cls==='occultist'){assert(C.train(profile.heroes[cls],'O07'));assert(C.train(profile.heroes[cls],'O08'));}C.autoTrain(profile.heroes[cls],cls);if(cls==='occultist')profile.loadouts[cls]=['O01','O02','O08','O11'];C.sanitizeLoadout(profile,cls);}
 const q=battlefield(g,11,{profile}),{b,e,app}=q,st=g.HONRO_PROJECT.stages[10],a=g.HonroAct2.memory(b),marker=b.honroMarkers.find(m=>m.id===(name==='defense'?'knot-east':'resident'));
 assert.equal(b.honroRavineVersion,2);assert(e.heroesAlive().every(u=>u.level===10));
 const keep=name==='defense'?new Set(['ritual-court-guard']):new Set(['refuge-two-levels']);
 const place=u=>u.honroRavinePlace||u.honroCluster,spiritId=b.honroMarkers.find(m=>m.id==='resident').spiritId;
 const expectedPlaceCount=name==='defense'?7:5;
 assert.equal(b.units.filter(u=>u.side===1&&keep.has(place(u))).length,expectedPlaceCount,'Exact canonical place roster before controlled filtering');
 b.units=b.units.filter(u=>u.side!==1||keep.has(place(u))||u.id===spiritId);
 assert.equal(e.alive(1).length,expectedPlaceCount+1,'Controlled fixture retains every place enemy plus the possessing spirit');
 for(const id of name==='defense'?['knot-west','clear-west']:['knot-west','clear-west','knot-east','hold-knots'])a.done[id]=true;
 if(name==='rescue')a.holds['hold-knots']={progress:4,spawned:6,lastRound:1,enteredRound:1,continuous:true,guarded:true,contested:false};
 // Earlier responses are already resolved in this controlled starting context.
 // Defense retains the actual lower-crosswind and both knot-triggered attacks.
 for(const ev of b.honroEvents.filter(ev=>ev.honroStage11Response))if(name==='rescue'||!['ravine-response-ravine-crosswind','ravine-response-ritual-west-pursuit','ravine-response-ritual-east-turn'].includes(ev.id))b.honroState.flags['event:'+ev.id]=true;
 const support=b.terrain.find(t=>t.id===(name==='defense'?'rv-ritual-buttress':'rv-lower-refuge-rock'));
 const positions=name==='defense'?[6500,6680,6970,7220]:[8600,8780,8960,9100];
 for(const [i,u]of e.heroesAlive().entries()){Object.assign(u,{x:positions[i],y:C.topAt(support,positions[i]),vx:0,vy:0,airborne:false,jumping:false});assert(C.validTerrainContactPose(b.terrain,u));}
 Object.assign(app,{canInput:()=>e.canAct(),cancelInput(){},updateHUD(){},checkMission:()=>!!g.HonroAct2.failure(b)||!e.heroesAlive().length});e.checkEnd=app.checkMission;
 g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);
 const initial=JSON.parse(JSON.stringify({round:b.round,items:b.items,units:b.units,done:a.done,events:b.honroState.flags,heroes:b.heroes}));
 const actions=[],rounds=[];let frames=0,lastRound=0,finished=false,failure=null;
 const tick=()=>{e.tick(C.STEP);g.HonroMission.tick(app,C.STEP);frames++;};
 const move=(u,target)=>{let still=0;for(let n=0;n<1100&&e.canAct()&&u.moveLeft>12&&Math.abs(u.x-target.x)>12;n++){const x=u.x;e.move(Math.sign(target.x-u.x),C.STEP);tick();if(Math.abs(u.x-x)<.03){if(++still>12&&e.grounded(u)){if(e.jump(u))actions.push({op:'jump',round:b.round,hero:u.cls});still=0;}}else still=0;}for(let n=0;n<300&&e.canAct()&&!e.grounded(u);n++)tick();};
 const fireAt=(u,target)=>{
  const skills=(name==='rescue'&&target.id===marker.spiritId?[C.SKILLS[C.baseSkill(u.cls)]]:u.loadout.map(id=>C.SKILLS[id])).filter(s=>s&&s.damage>0&&!s.passive&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus).sort((a,z)=>z.damage-a.damage);
  for(const sk of skills.slice(0,3)){
   if(sk.martial&&sk.branch==='sword'){let angle=Math.atan2(u.y-u.h*.58-(target.y-target.h*.5),target.x-u.x)*180/Math.PI;if(angle< -90)angle+=360;for(const power of[1,.7,.2])if(C.meleeContains(e,u,target,C.meleeRange(u,sk,power),-angle*Math.PI/180,C.meleeSpan(u,sk,power))&&e.fire(sk.id,angle,power)){actions.push({op:'fire',round:b.round,hero:u.cls,skill:sk.id,target:target.id,hpBefore:target.hp});return true;}continue;}
   let best=null;for(const aim of e.shotSeeds(u,sk,target)){const v=C.shotViable(e,u,sk,target,aim.angle,aim.power);if(v.ok&&v.risk<1&&v.miss<Math.max(85,sk.radius+target.r+55)&&(!best||v.net>best.net))best={...aim,net:v.net};}
   if(best&&e.fire(sk.id,best.angle,best.power)){actions.push({op:'fire',round:b.round,hero:u.cls,skill:sk.id,target:target.id,hpBefore:target.hp,angle:best.angle,power:best.power});return true;}
  }return false;
 };
 for(let action=0;action<240;action++){
  while(!e.canAct()&&!g.HonroAct2.failure(b)&&frames<400000)tick();failure=g.HonroAct2.failure(b);if(failure||frames>=400000)break;
  if(name==='defense'&&a.done['hold-knots']||name==='rescue'&&a.done.resident){finished=true;break;}
  if(lastRound!==b.round){lastRound=b.round;const row={round:b.round,current:g.HonroAct2.current(b)?.id,hold:a.holds?.['hold-knots'],heroes:e.heroesAlive().map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,x:u.x,y:u.y})),resident:e.unit(b.honroMarkers.find(m=>m.id==='resident').target)?.hp,foes:e.alive(1).length};rounds.push(JSON.parse(JSON.stringify(row)));console.log(name,JSON.stringify(row));}
  const spirit=name==='rescue'?e.unit(marker.spiritId):null,weak=spirit&&(spirit.dead||spirit.hp<=spirit.maxHp*.4);
  if(name==='rescue'&&weak){const sodan=e.heroesAlive().find(u=>u.cls==='occultist'&&!u.acted);if(sodan)e.select(sodan.id);}
  const u=e.active;if(!u||u.side!==0||u.dead)break;
  const current=g.HonroAct2.current(b),activeMarker=b.honroMarkers.find(m=>m.id===current?.id);
  if(activeMarker?.action&&g.HonroInteractions.eligibility(app,activeMarker).ok){const spiritBefore=spirit?{hp:spirit.hp,maxHp:spirit.maxHp,dead:spirit.dead}:null;if(g.HonroInteractions.use(app,activeMarker)){actions.push({op:'E',round:b.round,hero:u.cls,target:activeMarker.id,spiritBefore});continue;}}
  let foes=e.alive(1).filter(v=>g.HonroAct2.visible(b,v)||v.id===spirit?.id).filter(v=>!(weak&&v.id===spirit?.id));
  const hold=b.honroMarkers.find(m=>m.id==='hold-knots');
  foes.sort((x,y)=>(name==='rescue'?Number(y.id===spirit?.id)-Number(x.id===spirit?.id):0)||(current?.kind==='hold'?Number(Math.hypot(y.x-hold.x,y.y-hold.y)<260)-Number(Math.hypot(x.x-hold.x,x.y-hold.y)<260):0)||Math.hypot(x.x-u.x,x.y-u.y)-Math.hypot(y.x-u.x,y.y-u.y));
  const near=foes.find(v=>Math.abs(v.y-u.y)<800&&Math.hypot(v.x-u.x,v.y-u.y)<1650);
  let goal=null;
  if(name==='rescue'&&weak&&u.cls==='occultist')goal=marker;
  else if(current?.kind==='hold'&&u.cls==='occultist')goal=hold;
  else if(near){const range={archer:550,mage:420,knight:100,occultist:330}[u.cls];goal={x:near.x+(u.x<near.x?-range:range),y:near.y};}
  else goal=activeMarker||marker;
  if(goal){const old={x:u.x,y:u.y};move(u,goal);if(Math.hypot(u.x-old.x,u.y-old.y)>1)actions.push({op:'move',round:b.round,hero:u.cls,from:old,to:{x:u.x,y:u.y}});}
  if(!e.canAct())continue;
  if(activeMarker?.action&&g.HonroInteractions.eligibility(app,activeMarker).ok){const spiritBefore=spirit?{hp:spirit.hp,maxHp:spirit.maxHp,dead:spirit.dead}:null;if(g.HonroInteractions.use(app,activeMarker)){actions.push({op:'E',round:b.round,hero:u.cls,target:activeMarker.id,spiritBefore});continue;}}
  let fired=false;for(const foe of foes.slice(0,4))if(Math.hypot(foe.x-u.x,foe.y-u.y)<1650&&fireAt(u,foe)){fired=true;break;}
  if(!fired){e.wait();actions.push({op:'wait',round:b.round,hero:u.cls});}
 }
 const final={round:b.round,current:g.HonroAct2.current(b)?.id,done:JSON.parse(JSON.stringify(a.done)),hold:a.holds?.['hold-knots'],heroes:e.heroesAlive().map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,x:u.x,y:u.y})),resident:e.unit(b.honroMarkers.find(m=>m.id==='resident').target),items:b.items};
 const row={name,sourceProjectSha256:hash(g.HONRO_PROJECT),passed:finished,failure,initial,final,frames,actions,rounds,scope:'Controlled objective-progress/pose/nearby-roster setup; all subsequent actions use normal commands. Not fresh-stage completion or difficulty approval.'};rows.push(row);await writeFile(`_local/reports/stage11-ravine/representative-${name}.json`,JSON.stringify(row,null,2)+'\n');console.log('RESULT',name,JSON.stringify({passed:finished,failure,round:b.round,actions:actions.length,heroes:final.heroes,hold:final.hold}));
 assert.deepEqual(JSON.parse(JSON.stringify(b.items)),initial.items,'No item consumed');
 if(finished){assert.equal(e.heroesAlive().length,4,'All four companions survive this representative policy');assert(final.resident.hp>0,'Resident survives');if(name==='defense'){assert.equal(final.hold.progress,4);assert.equal(final.hold.spawned,6);assert(actions.some(x=>x.op==='E'&&x.target==='knot-east'),'Actual E starts the defense');}else{const extraction=actions.find(x=>x.op==='E'&&x.target==='resident');assert.equal(extraction?.hero,'occultist');assert(extraction.spiritBefore.hp>0&&!extraction.spiritBefore.dead&&extraction.spiritBefore.hp<=extraction.spiritBefore.maxHp*.4,'Weaken the living spirit through attacks, then Sodan E');assert(final.resident.honroResolved);}}
}
if(rows.some(r=>!r.passed))process.exitCode=1;
