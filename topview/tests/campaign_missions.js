// Isolated mission controls. Bring witnesses to the start of a boundary, then
// call the production movement, interaction, combat or mission owner. Enemy-end
// counters in the settlement controls are explicitly simulated.
(id) => {
  const a=HonroApp,e=a.engine,b=e.b,st=a.stage,hs=b.honroState,t=HonroTopview.space;
  const result={id,checks:[],measurements:{},input:'controlled mission, not continuous play'};
  const check=(name,value,details)=>{result.checks.push({name,pass:!!value,...(details===undefined?{}:{details})});};
  const loc=u=>({x:u.x,y:u.y-u.h/2}),dist=(u,v)=>Math.hypot(u.x-v.x,u.y-v.y);
  const actor=id=>e.unit(id), marker=id=>b.honroMarkers.find(m=>m.id===id),point=name=>t.point(name);
  const state=()=>HonroObjectives.state(b,st),march=(u,target)=>t.route(loc(u),target,u.r);
  const hero=actor('p-archer');
  function pose(u,p){const v=t.free(p,u.r);if(!v)throw Error('no foot '+u.id);Object.assign(u,{x:v.x,y:v.y+u.h/2,vx:0,vy:0,airborne:false,jumping:false});delete u.tvPath;return v;}
  function finishStory(){if(a.dialogue)HonroStory.finish(a,false);}
  function turn(u){finishStory();a.turnNotice=null;b.active=u.id;b.phase='aim';b.side=0;b.transition=0;b.turnAge=1;u.acted=false;u.stun=0;u.stunnedRound=-1;u.moveLeft=u.maxMove;}
  function interact(u,m){
    turn(u);const person=m.target&&actor(m.target),site=person?loc(person):m;
    pose(u,{x:site.x+30,y:site.y-u.h*.25});const ready=HonroInteractions.eligibility(a,m);
    const used=ready.ok&&HonroInteractions.use(a,m);finishStory();return {ready:ready.ok,reason:ready.reason,used:!!used};
  }
  function settlement(){
    const prev=state();HonroObjectives.updateSettlement(b,st,prev.objectiveReady);
    const initial=state();b.teamEnds[1]+=initial.settleRounds;b.round+=initial.settleRounds;
    return {required:initial.settleRounds,before:initial.complete,after:state().complete};
  }
  function killControl(u){u.dead=true;u.hp=0;}
  function hitTarget(key){
    const u=actor(key),old=u.hp;e.damageTerrain(b.honroQuestTargets.find(q=>q.id===key),u.maxHp+1,0,hero.id,{skill:'A01',owner:hero.id,attackSide:0});
    return {before:old,after:u.hp,dead:u.dead};
  }
  function lostControl(u){const phase=b.phase,hp=u.hp,dead=u.dead;killControl(u);a.checkMission(e);
    const proof={phase:b.phase,reason:b.winnerReason};Object.assign(u,{hp,dead});b.phase=phase;return proof;}
  const reach={};
  for(const name of Object.keys(t.map.anchors)){
    if(name==='waterfallFoot')continue; // water impact site, intentionally not a walkable goal
    const p=point(name),v=t.free(p,hero.r);reach[name]=!!v&&march(hero,v).length>0;
  }
  check('all player or mission approaches connected',Object.values(reach).every(Boolean),reach);
  check('entry is pending',!state().complete);
  if(id===2){
    const car=actor('objective'),porter=b.units.find(u=>u.allyRole==='porter'),start=loc(car),goal=point('exit'),q={};
    const threat=e.actors(1)[0],old=loc(threat);pose(threat,{x:start.x+135,y:start.y+40});
    HonroTopview.carriageTurn(e,porter,q,1/30);check('hostile stops procession',q.tvCarBudget===0&&dist(start,loc(car))<1);
    pose(threat,old);
    const road=[];let n=0;while(dist(loc(car),goal)>20&&n++<2300){
      const step=HonroTopview.escortAdvance(e,car,18);if(!step)break;
      if(n%40===0)road.push(loc(car));
    }
    check('carriage traverses real lower road to the two-dimensional exit',dist(loc(car),goal)<120&&state().objectiveReady,{distance:Math.round(dist(loc(car),goal)),samples:road.length,steps:n});
    const at=loc(car);pose(car,{x:at.x,y:at.y-380});check('same x on another shelf is insufficient',!state().objectiveReady);
    check('convoy loss',lostControl(car).phase==='lost');check('original flying encounter active',HonroStage2Airborne.active(b));pose(car,goal);
  }else if(id===3){
    const m=marker('ledger'),bad=HonroInteractions.eligibility(a,m);check('ledger requires approach',!bad.ok,bad.reason);
    const gain=interact(hero,m);check('actual ledger interaction',gain.used&&hs.ledger,gain);
    const q=settlement();check('two enemy actions after recovery',q.required===2&&!q.before&&q.after,q);
  }else if(id===4){
    const car=actor('objective');check('gate destruction fails',lostControl(car).phase==='lost');
    const until=st.holdRounds||6;b.round=until-1;const early=state().complete;b.round=until;
    check('gate survives the authored final round',!early&&state().complete,{until,waves:b.honroEvents.map(ev=>[ev.id,ev.when.round])});
  }else if(id===5){
    const mage=actor('p-mage'),m=marker('receiver-5'),cleat=actor('cliff-cleat'),sheet=b.terrain.find(q=>q.id==='waterfall-veil');
    check('loss of ritual holder before breaking seal',lostControl(mage).phase==='lost');
    turn(hero);const refused=interact(hero,m);check('archer cannot hold the ritual',!refused.used,refused);
    const effect=interact(mage,m);check('mage opens real fluid',effect.used&&hs.ritual.active&&sheet.honroWaterOpen);
    pose(mage,{x:m.x+340,y:m.y});a.missionTick(1/120);
    check('leaving closes the same water course',!hs.ritual.active&&!sheet.honroWaterOpen);
    const reopen=interact(mage,m);turn(hero);pose(hero,point('upperShot'));
    // Move north on the ledge to shoot past the still-living pine guard.
    e.walkVector(hero,0,-1,80/hero.walkSpeed);
    const target=e.damageAim(cleat),origin=e.damageAim(hero),angle=Math.atan2(origin.y-target.y,target.x-origin.x)*180/Math.PI;
    const power=1,skill=HONRO_CORE.SKILLS.A01,pred=e.predict(hero,skill,angle,power,cleat,true),old=cleat.hp;
    HonroStage5WaterGeometry.setOpen(b,false);
    const beforeOpening=e.predict(hero,skill,angle,power,cleat,true);
    HonroStage5WaterGeometry.setOpen(b,true);
    check('closed fluid diverts the same shot',beforeOpening.unit!==cleat.id&&pred.unit===cleat.id,{closed:[Math.round(beforeOpening.x),Math.round(beforeOpening.y)],opened:pred.unit});
    const ok=e.fire('A01',angle,power);
    for(let j=0;j<1500&&b.projectiles.length;j++)e.tick(1/120);
    check('normal arrow damages the cleat through the open lane',reopen.used&&ok&&cleat.hp<old,{from:loc(hero),to:target,predicted:pred.unit||pred.terrain,damage:old-cleat.hp,angle,projectiles:b.projectiles.length});
  }else if(id===6){
    const car=actor('objective'),mid=actor('midboss-stage6'),goal=point('exit');
    check('carrier loss',lostControl(car).phase==='lost');
    pose(hero,{x:car.x+60,y:loc(car).y});a.missionTick(1/120);check('contact rescues carrier',hs.rescued);
    let total=0;const start=loc(car);
    for(const site of t.map.convoy.slice(1)){
      const route=march(hero,site);
      for(const target of route){
        const at=loc(hero),d=dist(at,target),pieces=Math.ceil(d/390);
        for(let i=1;i<=pieces;i++){
          pose(hero,{x:at.x+(target.x-at.x)*i/pieces,y:at.y+(target.y-at.y)*i/pieces});
          for(let j=0;j<100;j++)HonroTopview.guideCarrier(e,car,[hero],1/45);
        }
      }
      total++;
    }
    check('living carrier follows a moving escort to shelter',dist(loc(car),goal)<120,{shelterDistance:Math.round(dist(loc(car),goal)),traveled:Math.round(dist(start,loc(car))),waypoints:total});
    check('living pier warden still blocks victory',!state().objectiveReady);
    killControl(mid);check('joint rescue and warden condition',state().objectiveReady);
  }else if(id===7){
    const residents=b.honroMarkers.filter(m=>m.action==='rescue');
    check('resident death fails',lostControl(actor(residents[0].target)).phase==='lost');
    for(const m of residents){
      const guards=HonroObjectives.rescueGuards(b,m),blocked=interact(hero,m);
      check(m.label+' guarded',guards.length>0&&!blocked.used,{guards:guards.map(u=>u.id),blocked});
      for(const g of guards)g.stunnedRound=b.round;
      const ok=interact(hero,m);check(m.label+' recovered after sentinel stun',ok.used&&actor(m.target).honroResolved,ok);
    }
    const q=settlement();check('three recovered plus two enemy ends',hs.rescuedCount===3&&q.required===2&&q.after,q);
  }else if(id===8){
    const boss=actor('boss'),left=hitTarget('bier-knot-0');
    check('first knot alone cannot close',left.dead&&!state().complete);
    const open=HonroTopview.bierRoute(a);result.measurements.initialRoadBlockers=open.blocked||[];
    // The safe-route control moves live occupants off the center line, preserving
    // their identities, before testing the same actual full-body sweep and endpoint.
    for(let i=0;i<40;i++){
      const route=HonroTopview.bierRoute(a);if(!route.blocked?.length)break;
      const blocker=actor(route.blocked[0].id);if(!blocker)break;
      const bay=t.free({x:160+(i%8)*125,y:230+Math.floor(i/8)*240},blocker.r,false,b.units.filter(u=>u!==blocker));
      if(!bay)break;pose(blocker,bay);
    }
    const route=HonroTopview.bierRoute(a);let traveled=0;
    for(const target of route.points||[]){for(let j=0;j<300;j++){const q=HonroTopview.bierStep(e,boss,target,25);if(q.blocked)break;
      Object.assign(boss,{x:q.pose.x,y:q.pose.y});traveled+=q.distance;if(dist(boss,target)<.5)break;}}
    check('bier traverses real courtyard route',traveled>1000&&dist(loc(boss),point('courtyard'))<4,{traveled:Math.round(traveled),blocked:route.blocked,remaining:Math.round(dist(loc(boss),point('courtyard')))});
    const right=hitTarget('bier-knot-1');check('boss still required after both knots',right.dead&&!state().complete);
    killControl(boss);check('two broken bindings and defeated boss',state().complete);
  }else if(id===9){
    check('still courtyard',b.wind===0);
    const west=marker('receiver-west'),east=marker('receiver-east'),threat=e.actors(1)[0];const before=loc(threat);
    pose(threat,{x:west.x+90,y:west.y});const blocked=interact(hero,west);
    check('contested site refuses installation',!blocked.used,blocked);pose(threat,before);
    for(const m of [west,east]){
      for(const u of e.actors(1))if(dist(u,m)<270)u.stunnedRound=b.round;
      const ok=interact(hero,m);check(m.id+' installed on legal ground',ok.used,ok);
    }
    check('both receivers required',hs.receivers===2&&state().objectiveReady);
  }else if(id===10){
    const sodan=actor('boss'),base=sodan.hp;
    e.hurt(sodan,1000,hero.id);check('bound Sodan is protected, two arrays inherited',sodan.hp===base&&hs.receivers===2);
    const hit=hitTarget('sodan-binding');check('break outer binding without killing Sodan',hit.dead&&sodan.hp===base);
    turn(hero);a.actorBoundary=hero.id;HonroMission.finale(a);finishStory();HonroMission.finale(a);delete a.actorBoundary;
    check('cooperation earns first real two-front wave',hs.sodanCoop&&hs.finaleWaves?.[0]?.units.length>0,{phase:hs.sodanBinding.phase,sources:hs.finaleWaves?.[0]?.sources});
    if(hs.sodanCoop){
      check('channeler loss fails',lostControl(sodan).phase==='lost');
      for(let i=1;i<=6;i++){finishStory();b.teamEnds[1]++;b.round++;a.actorBoundary=hero.id;HonroMission.finale(a);delete a.actorBoundary;}
      check('six completed enemy intervals unlock withdrawal',HonroSodanWithdrawal.ready(b),{hold:hs.coopHold,waves:hs.finaleWaves?.length});
      finishStory();turn(hero);const goal=point('exit');for(const u of e.heroesAlive())pose(u,goal);
      check('three companions are insufficient',HonroSodanWithdrawal.progress(b)===3&&!state().complete);
      for(let i=0;i<2800&&!['withdrawing','safe'].includes(hs.sodanWithdrawal?.phase);i++){finishStory();HonroSodanWithdrawal.tick(a,1/60);}
      check('Sodan walks to the same eastern gate',hs.sodanWithdrawal?.phase==='withdrawing',{distance:Math.round(dist(loc(sodan),goal)),people:HonroSodanWithdrawal.progress(b)});
      if(hs.sodanWithdrawal?.phase==='withdrawing'){for(let i=0;i<85&&hs.sodanWithdrawal.phase==='withdrawing';i++)HonroSodanWithdrawal.frame(a,1/60);
        check('normal act completion stored',hs.sodanWithdrawal.phase==='safe'&&state().complete);}
    }
  }
  if(id===5){
    const cleat=actor('cliff-cleat');if(!cleat.dead)hitTarget('cliff-cleat');
    a.missionTick(1/120);settlement();
  }
  if(!a.done){finishStory();a.checkMission(e);if(b.phase==='won')a.outcome();}
  check('native victory phase',b.phase==='won',{summary:state().summary});
  return result;
}
