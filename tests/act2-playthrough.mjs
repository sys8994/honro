// Gameplay bot: engine movement, jump, fire, item, wait and interaction APIs only.
// It never edits actors, enemy HP, inventory or objective state during play.
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
const requested=process.argv.slice(2).map(Number),ids=requested.length?requested:Array.from({length:10},(_,i)=>11+i);
const allowItems=process.env.HONRO_BOT_NO_ITEMS!=='1';
if(process.env.HONRO_BOT_AUTHORED_ROUTE==='1'&&process.env.HONRO_BOT_RESUME==='1')throw Error('Authored-route evidence requires a fresh battle; navigation state is not resumed.');
const actionLimit=Number(process.env.HONRO_BOT_ACTION_LIMIT||620);
for(const id of ids){
 const p=C.defaults();p.recruited=g.HonroStageRules.stageParty(id);
 for(const cls of p.recruited){p.heroes[cls].xp=g.HonroProgression.rewardXpAt(g.HonroProgression.plan(id).entryLevel);
  if(cls==='occultist'&&(!C.train(p.heroes[cls],'O07')||!C.train(p.heroes[cls],'O08')))throw Error('Sodan cannot learn the manifestation talisman at stage '+id);
  C.autoTrain(p.heroes[cls],cls);
  if(cls==='occultist')p.loadouts[cls]=['O01','O02','O08','O11'];
  C.sanitizeLoadout(p,cls);
 }
 let {e,b,app,st,events}=battlefield(g,id,{profile:p});
 const canonical=g.HONRO_PROJECT.stages[id-1],space=canonical.design?.space;
 const geometryFingerprint=createHash('sha256').update(JSON.stringify({terrain:canonical.terrains,routes:canonical.routes,sites:space?.sites,units:canonical.units,materials:canonical.materials})).digest('hex');
 const checkpoint=`_local/reports/act2-revision/normal-checkpoint-${id}.json`;
 let actions=[];
 if(process.env.HONRO_BOT_RESUME==='1'){
  const saved=JSON.parse(await readFile(checkpoint,'utf8'));
  if(saved.stage!==id||saved.b.honroAct2Revision!==2||saved.geometryFingerprint!==geometryFingerprint)throw Error('Checkpoint does not match current Act 2 geometry for stage '+id+'; run a fresh test instead of resuming an old clear.');
  b=saved.b;e=new C.Engine(b,event=>events.push(event),false);app.engine=e;actions=saved.actions;
 }
 await mkdir('_local/reports/act2-revision',{recursive:true});
 const initialHeroes=e.heroesAlive().map(u=>({cls:u.cls,level:u.level,xp:u.xp,hp:u.hp,focus:u.focus,loadout:[...u.loadout],ranks:{...u.ranks}}));
 const initialItems={...b.items};
 const start=performance.now();
 app.checkMission=()=>{if(['won','lost'].includes(b.phase))return true;const failure=g.HonroAct2.failure(b);if(failure||!e.heroesAlive().length){b.phase='lost';b.winnerReason=failure||'Party defeated';return true;}if(g.HonroObjectives.state(b,st).complete){b.phase='won';return true;}return false;};
 e.checkEnd=app.checkMission;g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);
 const tick=()=>{e.tick(1/60);g.HonroMission.tick(app,1/60);};
 const defend=()=>e.wait();
 const route=process.env.HONRO_BOT_AUTHORED_ROUTE==='1'&&id===15?space.routes.find(r=>r.id==='main').anchors:null;
 const navigation=new Map(),navigationLog=[];
 const move=(u,x,y)=>{
  const routeActive=route&&['clear-gallery','groove','exit'].includes(g.HonroAct2.current(b)?.id);
  if(!routeActive){
   let still=0;for(let j=0;j<650&&e.canAct()&&u.moveLeft>10&&Math.abs(u.x-x)>24;j++){
    const old=u.x;e.move(Math.sign(x-u.x),1/60);tick();
    if(Math.abs(old-u.x)<.1){if(++still>8&&e.grounded(u)){e.jump(u);still=0;}}else still=0;
   }for(let j=0;j<120&&!e.grounded(u)&&e.canAct();j++)tick();return;
  }
  const routeGoal=route?route.reduce((best,p,i)=>Math.hypot(p.x-x,p.y-y)<best.distance?{i,distance:Math.hypot(p.x-x,p.y-y)}:best,{i:0,distance:Infinity}).i:0;
  let nav=navigation.get(u.id);
  if(route&&!nav){nav={next:4,jumpTo:null};navigation.set(u.id,nav);}
  if(u.x<3500&&u.y>3900&&nav.next>4){navigationLog.push({round:b.round,actor:u.cls,action:'return-to-west-approach',x:u.x,y:u.y});nav.next=4;nav.jumpTo=null;}
  let still=0;
  for(let j=0;j<650&&e.canAct()&&u.moveLeft>10;j++){
   // Stop on the route's firing support instead of walking back off its edge
   // toward the target's x coordinate after reaching the intended elevation.
   if(nav.next>routeGoal&&!nav.jumpTo)break;
   let p=route[nav.next];
   if(route&&nav.jumpTo)p=nav.jumpTo;
   const reached=Math.abs(u.x-p.x)<22&&Math.abs(u.y-p.y)<100&&e.grounded(u);
   if(reached){
    if(route&&p===route[nav.next]){
     navigationLog.push({round:b.round,actor:u.cls,waypoint:nav.next,x:u.x,y:u.y});
     if(p.jumpTo&&e.jump(u)){nav.jumpTo={...route[nav.next+1],x:p.jumpTo.x};navigationLog.push({round:b.round,actor:u.cls,action:'planned-jump',waypoint:nav.next});}
     nav.next++;continue;
    }
    if(nav?.jumpTo){nav.jumpTo=null;continue;}
    break;
   }
    const before={x:u.x,y:u.y};
   if(Math.abs(u.x-p.x)>10)e.move(Math.sign(p.x-u.x),1/60);
   if(route&&(still>10||Math.abs(u.x-p.x)<24&&u.y-p.y>100)&&e.grounded(u)){
    if(e.jump(u)){navigationLog.push({round:b.round,actor:u.cls,action:'jump',waypoint:nav.next,x:u.x,y:u.y});still=0;}
   }
   tick();
   if(Math.hypot(before.x-u.x,before.y-u.y)<.1){++still;}else still=0;
  }
  for(let j=0;j<120&&!e.grounded(u)&&e.canAct();j++)tick();
 };
 let frames=0,previous='';
 for(let turn=actions.length;turn<actionLimit&&!['won','lost'].includes(b.phase);turn++){
  while(!e.canAct()&&!['won','lost'].includes(b.phase)&&frames++<1100000){if(b.phase==='aim'&&e.active?.dead){const next=e.heroesAlive().find(u=>!u.acted);if(next)e.select(next.id);}tick();}
  if(frames>=1100000)break;if(['won','lost'].includes(b.phase))break;
  const s=g.HonroAct2.current(b);if(!s){app.checkMission();break;}
  const eligible=e.heroesAlive().filter(u=>!u.acted),rescueSpirit=s.kind==='rescue'?e.unit(b.honroMarkers.find(m=>m.id===s.id)?.spiritId):null;
  const sodanAlive=e.heroesAlive().some(u=>u.cls==='occultist');
  const needed=s.requiredClass||(s.kind==='rescue'&&(sodanAlive||rescueSpirit&&!rescueSpirit.dead)?'occultist':null);
  if(needed){const specialist=eligible.find(u=>u.cls===needed);if(specialist)e.select(specialist.id);}
  const u=e.active,m=b.honroMarkers.find(m=>m.id===s.id),terrain=b.terrain.find(t=>t.id===s.id),enemy=b.units.find(v=>v.id===s.target),skill=C.SKILLS[C.baseSkill(u.cls)];
  let pos=m||terrain&&{x:terrain.x+terrain.w/2,y:terrain.y+terrain.h/2}||enemy;
  const protectedUnit=id===20?b.units.find(v=>v.honroProtected&&!v.dead):null;
  const guardPriority=v=>protectedUnit&&Math.hypot(v.x-protectedUnit.x,v.y-protectedUnit.y)<1000?1:0;
  const combatFoes=()=>e.alive(1).filter(v=>(s.kind!=='clear'||s.cohorts==='all'||s.cohorts===v.honroCohort)&&(!v.honroAct2Boss||g.HonroAct2.memory(b).done.leak)&&g.HonroAct2.visible(b,v)).sort((a,c)=>guardPriority(c)-guardPriority(a)||Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y));
  const rescueThreat=s.kind==='rescue'?combatFoes().find(v=>Math.hypot(v.x-m.x,v.y-m.y)<750):null;
  let combatTarget=s.kind==='clear'?combatFoes()[0]:s.kind==='rescue'?rescueThreat||e.unit(m.spiritId):s.kind==='defeat'?enemy:null;
  if(m?.action&&s.kind!=='rescue')combatTarget=combatFoes().find(v=>Math.hypot(v.x-m.x,v.y-m.y)<650);
  if(s.kind==='hold')combatTarget=combatFoes().find(v=>Math.hypot(v.x-m.x,v.y-m.y)<s.radius+500);
  if(combatTarget&&!combatTarget.dead)pos=combatTarget;
  let x=pos.x,y=pos.y;
  if(combatTarget&&!combatTarget.dead){
   const range={knight:100,mage:500,archer:650,occultist:320}[u.cls];
   // A firing gallery above the road needs a close firing position. Standing
   // at normal range leaves the stone lip between every shot and the target.
   x=pos.x+(u.x<pos.x?-1:1)*(Math.abs(pos.y-u.y)>360?Math.min(range,130):range);
  }
  if(s.kind==='hold'&&(!combatTarget||s.requiredClass===u.cls||Math.abs(x-m.x)>s.radius-100)){x=m.x;y=m.y;}
  if(s.kind==='rescue'&&combatTarget&&(combatTarget.dead||combatTarget.hp<=combatTarget.maxHp*.4)){x=m.x;y=m.y;}

  if(s.kind==='destroy'){const firing=space?.sites[s.id]?.standing;x=firing?.x??pos.x-180;y=firing?.y??g.HonroWorld.top(b,x,u.y);}
  else if(s.kind==='defeat'){x=pos.x-(u.cls==='knight'?100:420);}
  if(s.kind==='escort'){x=Math.min(pos.x,e.unit('objective').x+420);}
  const ritualKeeper=id===19&&u.cls==='occultist',reserveForRitual=id===19&&!ritualKeeper&&sodanAlive&&b.items.heal<=2;
  const recoverAt=u.cls==='occultist'?.30:.25;
  const needsHeal=allowItems&&!reserveForRitual&&u.hp<u.maxHp*recoverAt&&b.items.heal>0;
  const needsWard=allowItems&&!needsHeal&&u.hp<u.maxHp*(ritualKeeper?.50:reserveForRitual?.32:.22)&&b.items.ward>0;
  const threat=e.alive(1).filter(v=>g.HonroAct2.visible(b,v)).sort((a,c)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y))[0];
  const threatDistance=threat?Math.hypot(threat.x-u.x,threat.y-u.y):Infinity;
  const retreating=needsHeal||needsWard||u.hp<u.maxHp*.16&&threatDistance<500;
  if(retreating&&threat&&threatDistance<1350){x=Math.max(100,Math.min(b.width-100,threat.x+(u.x<threat.x?-1300:1300)));y=g.HonroWorld.top(b,x,u.y);}
  else if(!retreating&&combatTarget&&u.hp<u.maxHp*.25&&u.cls!=='knight'){x=Math.max(100,Math.min(b.width-100,combatTarget.x+(u.x<combatTarget.x?-1050:1050)));}
  // Keep the non-specialists advancing with the party, then clear nearby threats.
  move(u,x,y);if(!e.canAct())continue;
  if(needsHeal&&e.item('heal')){actions.push({round:b.round,actor:u.cls,action:'heal-item'});continue;}
  if(needsWard&&e.item('ward')){actions.push({round:b.round,actor:u.cls,action:'ward-item'});continue;}
  if(retreating){defend();actions.push({round:b.round,actor:u.cls,action:'retreat-defend'});continue;}
  const key=s.id+':'+b.round;if(previous!==key){previous=key;console.log('PLAY',id,b.round,s.id,u.cls,Math.round(u.x),Math.round(u.y),'HP',e.heroesAlive().map(v=>v.cls+':'+Math.round(v.hp/v.maxHp*100)).join('/'));await writeFile(`_local/reports/act2-revision/normal-progress-${id}.json`,JSON.stringify({stage:id,round:b.round,goal:s.id,actions,navigationLog,units:b.units},null,2));await writeFile(checkpoint,JSON.stringify({stage:id,geometryFingerprint,b,actions}));}
  if(m?.action&&(!needed||u.cls===needed)&&Math.hypot(u.x-m.x,(u.y-m.y)*.75)<=250&&Math.abs(u.y-m.y)<=150&&g.HonroAct2.eligibility(app,m).ok){g.HonroAct2.use(app,m);actions.push({round:b.round,actor:u.cls,action:'interact',id:s.id});continue;}
  if(s.kind==='destroy'&&(!needed||u.cls===needed)){
   const target={...u,id:'terrain-target',side:1,x:terrain.x+terrain.w/2,y:terrain.y+terrain.h/2+15,h:30,r:25};
   let best=null;
   // The authored shaft is narrower than the generic eight-degree enemy grid.
   const direct=Math.atan2(u.y-u.h*.6-(terrain.y+terrain.h*.5),terrain.x+terrain.w*.5-u.x)*180/Math.PI;
   const angles=[direct,...Array.from({length:97},(_,j)=>-12+j*2)];
   for(const angle of angles)for(const power of [.2,.35,.5,.65,.8,1]){const a=angle,hit=e.predict(u,skill,a,power,target,false),distance=Math.hypot(hit.x-target.x,hit.y-(target.y-15));if(hit.terrain===terrain.id&&(!best||distance<best.distance))best={angle:a,power,distance};}
   if(best&&e.fire(skill.id,best.angle,best.power)){actions.push({round:b.round,actor:u.cls,action:'fire-target',id:s.id,...best});continue;}
  }
  if(allowItems&&u.focus<u.maxFocus*.15&&b.items.focus>0&&e.item('focus')){actions.push({round:b.round,actor:u.cls,action:'focus-item'});continue;}
  let fired=false;
  const holdPriority=v=>s.kind==='hold'?(Math.hypot(v.x-m.x,v.y-m.y)<s.contestRadius+120?2:Math.hypot(v.x-m.x,v.y-m.y)<s.radius+250?1:0):0;
  const foes=e.alive(1).filter(v=>!v.honroAct2Boss||g.HonroAct2.memory(b).done.leak).sort((a,c)=>holdPriority(c)-holdPriority(a)||guardPriority(c)-guardPriority(a)||(c.id===s.target)-(a.id===s.target)||(s.kind==='rescue'?Number(c.id===rescueSpirit?.id)-Number(a.id===rescueSpirit?.id):0)||Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y));
  // A hidden host spirit still has a visible ripple by the resident marker.
  // Manual ground/area shots remain legal when Sodan has fallen.
  for(const foe of foes.filter(v=>g.HonroAct2.visible(b,v)||s.kind==='rescue'&&v.id===rescueSpirit?.id).slice(0,3)){
   if(Math.hypot(foe.x-u.x,foe.y-u.y)>1300)continue;
   const options=u.loadout.map(k=>C.SKILLS[k]).filter(s=>s.damage>0&&!s.passive&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus).sort((a,c)=>(foe.honroSpirit&&!foe.manifested?Number(c.id==='O08')-Number(a.id==='O08'):0)||c.damage*(1+(u.ranks[c.id]||1)*.06)-a.damage*(1+(u.ranks[a.id]||1)*.06));
   for(const attack of options.slice(0,3)){
    const seeds=e.shotSeeds(u,attack,foe),right=foe.x>u.x;
    let best=null;
    for(const aim of [...seeds,{angle:right?45:135,power:.5}]){
     const viable=C.shotViable(e,u,attack,foe,aim.angle,aim.power);
     if((viable.ok||foe.hp<=2&&viable.enemyDamage>0)&&viable.risk<1&&viable.miss<Math.max(85,attack.radius+foe.r+55)&&(!best||viable.net>best.value))best={...aim,value:viable.net};
    }
    if(!best&&attack===options[0]&&foe===foes[0]){
     const aim=e.bestShot(u,attack,foe),viable=C.shotViable(e,u,attack,foe,aim.angle,aim.power);
     if((viable.ok||foe.hp<=2&&viable.enemyDamage>0)&&viable.risk<1&&viable.miss<Math.max(85,attack.radius+foe.r+55))best=aim;
    }
    if(best&&e.fire(attack.id,best.angle,best.power)){actions.push({round:b.round,actor:u.cls,action:'fire',skill:attack.id,target:foe.id});fired=true;break;}
   }
   if(fired)break;
  }
  if(!fired){defend();actions.push({round:b.round,actor:u.cls,action:'defend'});}
 }
 const row={stage:id,revision:b.honroAct2Revision,geometryFingerprint,geometryRevision:space?.geometryRevision,phase:b.phase,round:b.round,goal:g.HonroAct2.current(b)?.id,reason:b.winnerReason,seconds:(performance.now()-start)/1000,navigationMode:route?'authored normal-input route':'legacy x-only',navigationLog,initialHeroes,initialItems,policy:{allowItems,difficulty:p.settings?.difficulty??p.difficulty,entryLevel:g.HonroProgression.plan(id).entryLevel,autoTrain:true,occultistLoadout:p.loadouts.occultist},items:{...b.items},heroes:e.heroesAlive().map(u=>({cls:u.cls,hp:u.hp,x:u.x,y:u.y})),actions};rows.push(row);
 console.log('RESULT',JSON.stringify({...row,actions:actions.length}));
 await writeFile(checkpoint,JSON.stringify({stage:id,geometryFingerprint,b,actions}));
 await mkdir('_local/reports/act2-revision',{recursive:true});await writeFile(`_local/reports/act2-revision/normal-play-${id}.json`,JSON.stringify(row,null,2));
 if(b.phase!=='won')await writeFile(`_local/reports/act2-revision/normal-failed-${id}.json`,JSON.stringify({units:b.units,terrain:b.terrain,events},null,2));
}
if(rows.some(r=>r.phase!=='won'))process.exitCode=1;
