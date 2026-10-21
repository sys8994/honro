()=>{
 const a=HonroApp,e=a.engine,b=e.b,C=HONRO_CORE,log=[],poses=[],images={},plans=Object.fromEntries(['archer','mage','knight'].map(k=>[k,[{x:1180,y:3836},{x:1850,y:3523},{x:2475,y:3000},{x:3000,y:3000},{x:3160,y:3000,jumpTo:2970},{x:1890,y:2200},{x:800,y:2200},{x:660,y:2200,jumpTo:750},{x:1505,y:1448},{x:1700,y:1403},{x:2920,y:1119}]])),state={},start={heroes:e.heroesAlive().map(u=>({id:u.id,cls:u.cls,hp:u.hp,maxHp:u.maxHp,focus:u.focus,level:u.level,loadout:u.loadout})),items:structuredClone(b.items),enemies:e.alive(1).length};let ticks=0;
 function capture(label,u){if(images[label])return;const s=a.scene;Object.assign(s,{x:u.x+160,y:u.y-160,scale:.65,manual:true,storyTween:null,cinematic:null});s.render(e,0,'',.6,false,0);images[label]=document.querySelector('#battlecanvas').toDataURL('image/png');}
 function step(){if(a.dialogue)HonroStory.finish(a);e.tick(C.STEP);if(!a.dialogue)a.missionTick(C.STEP);ticks++;if(ticks%60===0)a.scene.render(e,1,'',.6,false,1);}
 function aim(u){const id=C.baseSkill(u.cls),targets=e.alive(1).filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<1550).sort((v,w)=>(v.id==='midboss-stage6'?-2000:0)+Math.hypot(v.x-u.x,v.y-u.y)-(w.id==='midboss-stage6'?-2000:0)-Math.hypot(w.x-u.x,w.y-u.y));for(const v of targets)for(const p of e.shotSeeds(u,C.SKILLS[id],v)){const r=e.predict(u,C.SKILLS[id],p.angle,p.power,v,false),hit=e.unit(r.unit);if(hit?.side===1){const safe=C.shotViable(e,u,C.SKILLS[id],v,p.angle,p.power);if(safe.ok&&safe.risk<1)return{id,p,v:hit};}}}
 for(let n=0;n<220000&&!['won','lost'].includes(b.phase)&&b.round<90;n++){
  const u=e.active;
  if(e.canAct()&&u?.side===0&&!a.dialogue){
   const st=state[u.id]??={goal:0,still:0,lastX:u.x,lastY:u.y},plan=plans[u.cls],p=plan[Math.min(st.goal,plan.length-1)];
   const marker=b.honroMarkers.find(m=>m.action==='rescue'&&!m.collected&&HonroInteractions.eligibility(a,m).ok);if(marker){capture(marker.id+'-before',u);if(HonroInteractions.use(a,marker)){log.push({op:'rescue',actor:u.id,marker:marker.id,round:b.round,x:u.x,y:u.y});step();capture(marker.id+'-after',u);continue;}}
   if(st.jumping){if(e.grounded(u)&&ticks-st.jumping.at>8){log.push({op:'land',actor:u.id,round:b.round,x:u.x,y:u.y});st.jumping=null;st.goal++;}else if(u.moveLeft>8)e.move(Math.sign(st.jumping.x-u.x),C.STEP);step();continue;}
   if(Math.abs(u.x-p.x)<12&&Math.abs(u.y-p.y)<75&&e.grounded(u)){
    if(p.jumpTo){if(u.moveLeft<400){a.defend();step();continue;}if(e.jump(u)){st.jumping={x:p.jumpTo,at:ticks};step();continue;}}
    if(p.drop&&e.canDrop(u)){e.drop(u);log.push({op:'drop',actor:u.id,round:b.round,x:u.x,y:u.y});}
    poses.push({actor:u.id,goal:p.x,x:u.x,y:u.y,round:b.round});if([1850,3000,1890,1700].includes(p.x))capture(u.cls+'-'+p.x,u);st.goal=Math.min(st.goal+1,plan.length-1);
   }
   if(e.grounded(u)&&(u.moveLeft<150||e.alive(1).some(v=>Math.hypot(v.x-u.x,v.y-u.y)<750))){const shot=aim(u);if(shot&&e.fire(shot.id,shot.p.angle,shot.p.power)){log.push({op:'fire',actor:u.id,round:b.round,x:u.x,y:u.y,target:shot.v.id,skill:shot.id,...shot.p});step();continue;}}
   if(u.moveLeft>10&&Math.abs(u.x-plan[st.goal].x)>6){e.move(Math.sign(plan[st.goal].x-u.x),C.STEP);if(e.grounded(u)&&st.still>20&&u.moveLeft>350){if(e.jump(u))st.still=0;}}
   else {const shot=aim(u);if(shot&&e.fire(shot.id,shot.p.angle,shot.p.power))log.push({op:'fire',actor:u.id,round:b.round,x:u.x,y:u.y,target:shot.v.id,skill:shot.id,...shot.p});else a.defend();}
   st.still=Math.hypot(u.x-st.lastX,u.y-st.lastY)<.01?st.still+1:0;st.lastX=u.x;st.lastY=u.y;
  }
  step();
 }
 return{method:'Production browser Engine inputs; legal chapter1–6 completion-reward fixture, normal resources and live AI, no teleports/healing resets.',start,end:{phase:b.phase,round:b.round,heroes:e.heroesAlive().map(u=>({id:u.id,hp:u.hp,maxHp:u.maxHp,focus:u.focus,x:u.x,y:u.y})),rescued:b.honroState.rescuedCount,objective:b.units.filter(u=>u.id.startsWith('resident-')).map(u=>({id:u.id,hp:u.hp,dead:u.dead,x:u.x,y:u.y})),events:b.honroEvents,eventLog:b.honroState.eventLog,pending:b.honroState.pendingEvents,populationCap:HonroEncounters.populationCap(b),spawned:b.units.filter(u=>u.honroSpawnSource).map(u=>({id:u.id,source:u.honroSpawnSource,x:u.spawnX,y:u.spawnY})),enemies:e.alive(1).length,flags:b.honroState.flags},ticks,poses,log,images};
}
