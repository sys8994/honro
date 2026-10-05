// Native engine bot: ordinary movement, default jumps, skills, items, interaction
// and wait only. No HP, actor-position, objective, damage or inventory edits.
// Failure is bot evidence, not a proof that a human cannot complete the stage.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {act1Runtime,fixture,routePoints,combatFingerprint,reportRoot} from './act1-spatial-test-helpers.mjs';
const g=await act1Runtime(),C=g.HONRO_CORE,ids=process.argv.slice(2).map(Number),rows=[];if(!ids.length)ids.push(1,3,4,5,6,7,8,9,10,2);
const out=reportRoot()+'/normal-combat';await mkdir(out,{recursive:true});const actionLimit=Number(process.env.HONRO_BOT_ACTION_LIMIT||400);
for(const id of ids){
 const profile=C.defaults();profile.recruited=g.HonroStageRules.stageParty(id);for(const cls of profile.recruited){profile.heroes[cls].xp=g.HonroProgression.rewardXpAt(g.HonroProgression.plan(id).entryLevel);C.autoTrain(profile.heroes[cls],cls);C.sanitizeLoadout(profile,cls);}
 let {b,e,app,st,events}=fixture(g,id,{profile}),canonical=g.HONRO_PROJECT.stages[id-1],fingerprint=combatFingerprint(canonical);
 let actions=[],resume=null;
 if(process.env.HONRO_BOT_RESUME==='1'){
  let saved;try{saved=JSON.parse(await readFile(`${out}/active-checkpoint-${id}.json`,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  if(saved){if(saved.fingerprint!==fingerprint||saved.stage!==id)throw Error('Refusing stale ACT1 combat checkpoint for '+id);b=saved.b;e=new C.Engine(b,event=>events.push(event),false);app.engine=e;app.profile=saved.profile;actions=saved.actions;resume={round:b.round,actions:actions.length,fingerprint:saved.fingerprint};e.checkEnd=()=>app.checkMission(e);g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);}
 }
 const start=performance.now(),path=routePoints(g,id,b),progress={};let frames=0,last='';
 const tick=()=>{e.tick(1/60);g.HonroMission.tick(app,1/60);frames++;};
 const distance=(a,c)=>Math.hypot(a.x-c.x,a.y-c.y);
 const move=(u,pos)=>{let still=0;for(let j=0;j<650&&e.canAct()&&u.moveLeft>10&&Math.abs(u.x-pos.x)>20;j++){const x=u.x;e.move(Math.sign(pos.x-u.x),1/60);tick();if(Math.abs(x-u.x)<.08){if(++still>8&&e.grounded(u)){e.jump(u);still=0;}}else still=0;}for(let j=0;j<120&&!e.grounded(u)&&e.canAct();j++)tick();};
 for(let turn=actions.length;turn<actionLimit&&!['won','lost'].includes(b.phase);turn++){
  while(!e.canAct()&&!['won','lost'].includes(b.phase)&&frames<700000){if(b.phase==='aim'&&e.active?.dead){const next=e.heroesAlive().find(u=>!u.acted);if(next)e.select(next.id);}tick();}
  if(frames>=700000||['won','lost'].includes(b.phase))break;
  const state=g.HonroObjectives.state(b,st),markers=b.honroMarkers.filter(m=>m.action&&!m.collected),hs=b.honroState;
  if(id===5&&!hs.ritual?.active&&!b.terrain.find(t=>t.id==='cliff-cleat').broken){const mage=e.heroesAlive().find(u=>u.cls==='mage'&&!u.acted);if(mage)e.select(mage.id);}
  const u=e.active,foes=e.alive(1).sort((a,c)=>distance(a,u)-distance(c,u)),near=foes[0],marker=markers.filter(m=>!m.requiredClass||m.requiredClass===u.cls).sort((a,c)=>distance(a,u)-distance(c,u))[0];
  let objective=state.targets.find(t=>t.kind==='seal')||marker||state.targets.find(t=>['exit','boss','midboss','objective'].includes(t.kind)),target=near,hold=false,receiverRush=false;
  if(id===1)objective=b.honroMapAnchors.exit;
  if(id===2)objective=e.unit('objective');
  if(id===4)objective=e.unit('objective');
  if(id===6){const obj=e.unit('objective');objective=hs.rescued?b.honroMapAnchors.exit:obj;}
  if(id===5&&u.cls==='mage'&&hs.ritual?.active){objective=b.honroMarkers.find(m=>m.id==='receiver-5');hold=true;}
  let ledgeApproach=false;
  if(id===5&&u.cls==='archer'&&hs.ritual?.active){objective=b.honroMapAnchors.shotGap;if(u.y>objective.y+100){ledgeApproach=true;objective={x:1780,y:C.topAt(b.terrain.find(t=>t.id==='place5-slope-stone:collision:0'),1780)};}}
  if(id===10&&!hs.sodanCoop){if(marker){objective=marker;receiverRush=true;}else{objective=e.unit('boss');target=objective;}}
  if(id===10&&hs.sodanCoop){objective=e.unit('boss');target=foes.sort((a,c)=>distance(a,objective)-distance(c,objective))[0];}
  // A bridge roof is a real projectile obstacle. Keep advancing on the
  // verified lower road instead of backing away from an unreachable upper foe.
  if(id===6&&target&&Math.abs(target.y-u.y)>450)target=foes.find(v=>Math.abs(v.y-u.y)<450)||null;
  let pos=objective||u;
  const nearRange={archer:720,mage:560,knight:id===10?100:200,occultist:420}[u.cls];
  if(target&&distance(target,u)<1400&&!hold&&!receiverRush&&!(id===5&&hs.ritual?.active)&&!(marker&&distance(marker,u)<300)){pos={x:target.x+(u.x<target.x?-nearRange:nearRange),y:target.y};}
  if(id===7&&objective){let index=progress[u.id]||0;while(index<path.length-1&&!path[index].jumpTo&&Math.abs(u.x-path[index].x)<100&&Math.abs(u.y-path[index].y)<170)index++;progress[u.id]=index;if(u.y-objective.y>300)pos=path[index];}
  if(id===2&&u.y<1600)pos=u; // Preserve intended high overwatch until the perch is abandoned by normal play.
  if(!hold)move(u,pos);if(!e.canAct())continue;
  if(ledgeApproach&&Math.abs(u.x-1780)<35&&e.jump(u)){for(let air=0;air<180&&e.canAct();air++){if(u.x<1970)e.move(.4,1/60);tick();if(air>30&&e.grounded(u))break;}}
  if(id===7){const index=progress[u.id]||0,link=path[index];if(link?.jumpTo&&Math.abs(u.x-link.x)<55&&Math.abs(u.y-link.y)<100&&e.jump(u)){for(let air=0;air<180&&e.canAct();air++){if(Math.abs(u.x-link.jumpTo.x)>3)e.move(Math.sign(link.jumpTo.x-u.x)*.35,1/60);tick();if(air>30&&e.grounded(u))break;}if(e.surface(u.x,u.y-5,u.y+5)?.t?.id===link.jumpTo.support)progress[u.id]=index+1;}}
  if(!e.canAct())continue;
  const key=b.round+':'+state.summary;if(last!==key){last=key;console.log('PLAY',id,b.round,u.cls,state.summary);await writeFile(`${out}/progress-${id}.json`,JSON.stringify({stage:id,fingerprint,round:b.round,summary:state.summary,actions,units:b.units},null,2));await writeFile(`${out}/active-checkpoint-${id}.json`,JSON.stringify({stage:id,fingerprint,b,actions,profile:app.profile})+'\n');}
  if(u.hp<u.maxHp*.32&&b.items.heal>0&&e.item('heal')){actions.push({round:b.round,actor:u.cls,action:'heal'});continue;}
  if(u.hp<u.maxHp*.2&&b.items.ward>0&&e.item('ward')){actions.push({round:b.round,actor:u.cls,action:'ward'});continue;}
  const usable=markers.find(m=>g.HonroInteractions.eligibility(app,m).ok);if(usable&&g.HonroInteractions.use(app,usable)){actions.push({round:b.round,actor:u.cls,action:'interact',target:usable.id});continue;}
  let fired=false,shotBlocker=null;
  const seals=b.terrain.filter(t=>t.honroSeal&&!t.broken);
  if(seals.length&&u.cls==='archer'&&(id!==5||hs.ritual?.active))for(const terrain of seals){
   if(Math.abs(terrain.x-u.x)>1700)continue;const skill=C.SKILLS.A01,direct=Math.atan2(u.y-u.h*.6-(terrain.y+terrain.h*.5),terrain.x+terrain.w*.5-u.x)*180/Math.PI;let shot=null;
   for(const angle of [direct,...(id===5?Array.from({length:61},(_,j)=>25+j*.5):[]),...Array.from({length:97},(_,j)=>-12+j*2)]){for(const power of [.2,.35,.5,.65,.8,1]){if(e.predict(u,skill,angle,power,undefined,false,true).terrain===terrain.id){shot={angle,power};break;}}if(shot)break;}
   if(shot){const live=e.predict(u,skill,shot.angle,shot.power,undefined,false,false);if(live.unit){shotBlocker=live.unit;continue;}}
   if(shot&&e.fire('A01',shot.angle,shot.power)){actions.push({round:b.round,actor:u.cls,action:'fire-seal',target:terrain.id,...shot});fired=true;break;}
  }
  if(fired)continue;
  if(u.focus<u.maxFocus*.15&&b.items.focus>0&&e.item('focus')){actions.push({round:b.round,actor:u.cls,action:'focus'});continue;}
  const targets=e.alive(1).sort((a,c)=>Number(c.id===shotBlocker)-Number(a.id===shotBlocker)||(id===6||id===10&&!hs.sodanCoop&&!receiverRush?Number(c.id===target?.id)-Number(a.id===target?.id):0)||distance(a,u)-distance(c,u)).slice(0,id===2?6:3);
  for(const foe of targets){if(distance(foe,u)>(id===2?4000:1500))continue;const skills=u.loadout.map(id=>C.SKILLS[id]).filter(s=>s.damage>0&&!s.passive&&!(id===10&&s.martial&&s.branch==='rush')&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus).sort((a,c)=>c.damage-a.damage);
   for(const skill of skills.slice(0,3)){
    // Sword sectors have no projectile endpoint. Use the game's actual melee
    // sector/occlusion helper instead of asking a ballistic predictor to hit.
    if(skill.martial&&skill.branch==='sword'){
     let angle=Math.atan2(u.y-u.h*.58-(foe.y-foe.h*.5),foe.x-u.x)*180/Math.PI;if(angle< -90)angle+=360;
     for(const power of [1,.7,.2])if(C.meleeContains(e,u,foe,C.meleeRange(u,skill,power),-angle*Math.PI/180,C.meleeSpan(u,skill,power))&&e.fire(skill.id,angle,power)){actions.push({round:b.round,actor:u.cls,action:'fire',skill:skill.id,target:foe.id});fired=true;break;}
     if(fired)break;continue;
    }
    let best=null;for(const aim of e.shotSeeds(u,skill,foe)){const v=C.shotViable(e,u,skill,foe,aim.angle,aim.power);if(v.ok&&v.risk<1&&v.miss<Math.max(85,skill.radius+foe.r+55)&&(!best||v.net>best.net))best={...aim,net:v.net};}if(!best&&foe===targets[0]){const aim=e.bestShot(u,skill,foe),v=C.shotViable(e,u,skill,foe,aim.angle,aim.power);if(v.ok&&v.risk<1&&v.miss<Math.max(85,skill.radius+foe.r+55))best=aim;}if(best&&e.fire(skill.id,best.angle,best.power)){actions.push({round:b.round,actor:u.cls,action:'fire',skill:skill.id,target:foe.id});fired=true;break;}}
   if(fired)break;
  }
  if(!fired){e.wait();actions.push({round:b.round,actor:u.cls,action:'defend'});}
 }
 const row={stage:id,fingerprint,resume,strategy:id===10?'receivers first; knight uses ground-route sword attacks':'ordinary legal-action controller',difficulty:b.difficulty,entryLevel:g.HonroProgression.plan(id).entryLevel,phase:b.phase,result:['won','lost'].includes(b.phase)?b.phase:'inconclusive-bot-budget',round:b.round,reason:b.winnerReason,goal:g.HonroObjectives.state(b,st).summary,seconds:(performance.now()-start)/1000,frames,actions,heroes:e.heroesAlive().map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,x:u.x,y:u.y})),items:b.items};rows.push(row);console.log('RESULT',JSON.stringify({...row,actions:actions.length}));await writeFile(`${out}/stage-${id}.json`,JSON.stringify(row,null,2)+'\n');await writeFile(`${out}/checkpoint-${id}.json`,JSON.stringify({stage:id,fingerprint,b,actions,events})+'\n');
}
await writeFile(`${out}/summary-${ids.join('-')}.json`,JSON.stringify({scope:'Normal engine bot using legal actions only; incomplete bot runs do not establish human impossibility or approved difficulty',rows},null,2)+'\n');if(rows.some(r=>r.phase!=='won'))process.exitCode=1;
