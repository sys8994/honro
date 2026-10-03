// Gameplay bot: normal movement, jump, fire, defend and interaction APIs only.
// It does not teleport actors, delete enemies, alter HP, or mark objectives done.
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
const requested=process.argv.slice(2).map(Number),ids=requested.length?requested:Array.from({length:10},(_,i)=>11+i);
const actionLimit=Number(process.env.HONRO_BOT_ACTION_LIMIT||620);
for(const id of ids){
 const p=C.defaults();p.recruited=g.HonroStageRules.stageParty(id);
 for(const cls of p.recruited){p.heroes[cls].xp=g.HonroProgression.rewardXpAt(g.HonroProgression.plan(id).entryLevel);C.autoTrain(p.heroes[cls],cls);C.sanitizeLoadout(p,cls);}
 const {e,b,app,st,events}=battlefield(g,id,{profile:p}),start=performance.now(),actions=[];
 app.checkMission=()=>{if(['won','lost'].includes(b.phase))return true;const failure=g.HonroAct2.failure(b);if(failure||!e.heroesAlive().length){b.phase='lost';b.winnerReason=failure||'Party defeated';return true;}if(g.HonroObjectives.state(b,st).complete){b.phase='won';return true;}return false;};
 e.checkEnd=app.checkMission;g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);
 const tick=()=>{e.tick(1/60);g.HonroMission.tick(app,1/60);};
 const defend=u=>{u.shield=Math.max(u.shield,Math.round(u.maxHp*.12));u.shieldUntil=b.teamEnds[1]+1;u.hp=Math.min(u.maxHp,u.hp+Math.round(u.maxHp*.04));u.focus=Math.min(u.maxFocus,u.focus+Math.max(u.regen,Math.round(u.maxFocus*.12)));e.finishAction();};
 const move=(u,x,y)=>{let still=0;for(let j=0;j<650&&e.canAct()&&u.moveLeft>10&&Math.abs(u.x-x)>24;j++){
   const old=u.x;e.move(Math.sign(x-u.x),1/60);tick();
   if(Math.abs(old-u.x)<.1){if(++still>8&&e.grounded(u)){e.jump(u);still=0;}}else still=0;
 }for(let j=0;j<120&&!e.grounded(u)&&e.canAct();j++)tick();};
 let frames=0,previous='';
 for(let turn=0;turn<actionLimit&&!['won','lost'].includes(b.phase);turn++){
  while(!e.canAct()&&!['won','lost'].includes(b.phase)&&frames++<1100000){if(b.phase==='aim'&&e.active?.dead){const next=e.heroesAlive().find(u=>!u.acted);if(next)e.select(next.id);}tick();}
  if(frames>=1100000)break;if(['won','lost'].includes(b.phase))break;
  const s=g.HonroAct2.current(b);if(!s){app.checkMission();break;}
  const eligible=e.heroesAlive().filter(u=>!u.acted),needed=s.requiredClass||(s.kind==='rescue'?'occultist':null);
  if(needed){const specialist=eligible.find(u=>u.cls===needed);if(specialist)e.select(specialist.id);}
  const u=e.active,m=b.honroMarkers.find(m=>m.id===s.id),terrain=b.terrain.find(t=>t.id===s.id),enemy=b.units.find(v=>v.id===s.target),skill=C.SKILLS[C.baseSkill(u.cls)];
  let pos=m||terrain&&{x:terrain.x+terrain.w/2,y:terrain.y+terrain.h/2}||enemy;
  const combatFoes=()=>e.alive(1).filter(v=>(s.kind!=='clear'||s.cohorts==='all'||s.cohorts===v.honroCohort)&&(!v.honroAct2Boss||g.HonroAct2.memory(b).done.leak)&&g.HonroAct2.visible(b,v)).sort((a,c)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y));
  let combatTarget=s.kind==='clear'?combatFoes()[0]:s.kind==='rescue'?e.unit(m.spiritId):s.kind==='defeat'?enemy:null;
  if(m?.action&&s.kind!=='rescue')combatTarget=combatFoes().find(v=>Math.hypot(v.x-m.x,v.y-m.y)<600)||(!needed||needed!==u.cls?combatFoes()[0]:null);
  if(s.kind==='hold')combatTarget=combatFoes().find(v=>Math.hypot(v.x-m.x,v.y-m.y)<s.radius+500);
  if(combatTarget&&!combatTarget.dead)pos=combatTarget;
  let x=pos.x,y=pos.y;
  if(combatTarget&&!combatTarget.dead)x=pos.x+(u.x<pos.x?-1:1)*({knight:100,mage:500,archer:650,occultist:360}[u.cls]);
  if(s.kind==='hold'&&(!combatTarget||s.requiredClass===u.cls||Math.abs(x-m.x)>s.radius-100)){x=m.x;y=m.y;}
  if(s.kind==='rescue'&&combatTarget&&(combatTarget.dead||combatTarget.hp<=combatTarget.maxHp*.4)){x=m.x;y=m.y;}

  if(s.kind==='destroy'){x=id===15?4060:pos.x-180;y=g.HonroWorld.top(b,x,u.y);}
  else if(s.kind==='defeat'){x=pos.x-(u.cls==='knight'?100:420);}
  if(id===14&&pos.y>5000&&u.y<4800){x=8360;y=4800;}
  if(s.kind==='escort'){x=Math.min(pos.x,e.unit('objective').x+420);}
  // Keep the non-specialists advancing with the party, then clear nearby threats.
  move(u,x,y);if(!e.canAct())continue;
  const key=s.id+':'+b.round;if(previous!==key){previous=key;console.log('PLAY',id,b.round,s.id,u.cls,Math.round(u.x),Math.round(u.y),'HP',e.heroesAlive().map(v=>v.cls+':'+Math.round(v.hp/v.maxHp*100)).join('/'));await writeFile(`_local/reports/act2-revision/progress-${id}.json`,JSON.stringify({stage:id,round:b.round,goal:s.id,actions,units:b.units},null,2));}
  if(m?.action&&(!needed||u.cls===needed)&&Math.hypot(u.x-m.x,(u.y-m.y)*.75)<=250&&Math.abs(u.y-m.y)<=150&&g.HonroAct2.eligibility(app,m).ok){g.HonroAct2.use(app,m);actions.push({round:b.round,actor:u.cls,action:'interact',id:s.id});continue;}
  if(s.kind==='destroy'&&(!needed||u.cls===needed)){
   const target={...u,id:'terrain-target',side:1,x:terrain.x+terrain.w/2,y:terrain.y+terrain.h/2+15,h:30,r:25};
   let best=null;
   // The authored shaft is narrower than the generic eight-degree enemy grid.
   const angles=id===15?[90,89.5,90.5,89,91]:Array.from({length:38},(_,j)=>-20+j*3);
   for(const angle of angles)for(const power of [.2,.35,.5,.65,.8,1]){const a=u.x>target.x?180-angle:angle,hit=e.predict(u,skill,a,power,target,false),distance=Math.hypot(hit.x-target.x,hit.y-(target.y-15));if(!best||distance<best.distance)best={angle:a,power,distance};}
   if(best.distance<70&&e.fire(skill.id,best.angle,best.power)){actions.push({round:b.round,actor:u.cls,action:'fire-target',id:s.id,...best});continue;}
  }
  if(u.hp<u.maxHp*.24){defend(u);actions.push({round:b.round,actor:u.cls,action:'recover'});continue;}
  let fired=false;
  const foes=e.alive(1).filter(v=>!v.honroAct2Boss||g.HonroAct2.memory(b).done.leak).sort((a,c)=>(c.id===s.target)-(a.id===s.target)||Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y));
  for(const foe of foes.filter(v=>g.HonroAct2.visible(b,v)).slice(0,3)){
   if(Math.hypot(foe.x-u.x,foe.y-u.y)>1300)continue;
   const options=u.loadout.map(k=>C.SKILLS[k]).filter(s=>s.damage>0&&!s.passive&&(!u.cooldowns?.[s.id])&&e.manaCost(s,u)<=u.focus).sort((a,c)=>c.damage*(1+(u.ranks[c.id]||1)*.06)-a.damage*(1+(u.ranks[a.id]||1)*.06));
   for(const attack of options.slice(0,3)){
    const aim=e.bestShot(u,attack,foe),viable=C.shotViable(e,u,attack,foe,aim.angle,aim.power);
    if(viable.ok&&viable.risk<1&&e.fire(attack.id,aim.angle,aim.power)){actions.push({round:b.round,actor:u.cls,action:'fire',skill:attack.id,target:foe.id});fired=true;break;}
   }
   if(fired)break;
  }
  if(!fired){defend(u);actions.push({round:b.round,actor:u.cls,action:'defend'});}
 }
 const row={stage:id,revision:b.honroAct2Revision,phase:b.phase,round:b.round,goal:g.HonroAct2.current(b)?.id,reason:b.winnerReason,seconds:(performance.now()-start)/1000,heroes:e.heroesAlive().map(u=>({cls:u.cls,hp:u.hp,x:u.x,y:u.y})),actions};rows.push(row);
 console.log('RESULT',JSON.stringify({...row,actions:actions.length}));
 await mkdir('_local/reports/act2',{recursive:true});await writeFile(`_local/reports/act2/play-${id}.json`,JSON.stringify(row,null,2));
 if(b.phase!=='won')await writeFile(`_local/reports/act2/failed-${id}.json`,JSON.stringify({units:b.units,terrain:b.terrain,events},null,2));
}
if(rows.some(r=>r.phase!=='won'))process.exitCode=1;
