()=>{
 const a=HonroApp,e=a.engine,b=e.b,C=HONRO_CORE,log=[],poses=[],images={},plans=Object.fromEntries(['archer','mage','knight'].map(k=>[k,[{x:1250},{x:2450},{x:3100},{x:3850},{x:4100},{x:4430,jumpTo:4650},{x:4850},{x:5350},{x:6380}]])),state={},start={heroes:e.heroesAlive().map(u=>({id:u.id,cls:u.cls,hp:u.hp,maxHp:u.maxHp,focus:u.focus,level:u.level,loadout:u.loadout})),items:structuredClone(b.items),enemies:e.alive(1).length};let ticks=0;
 function capture(label,u){if(images[label])return;const s=a.scene;Object.assign(s,{x:u.x+160,y:u.y-160,scale:.65,manual:true,storyTween:null,cinematic:null});s.render(e,0,'',.6,false,0);images[label]=document.querySelector('#battlecanvas').toDataURL('image/png');}
 function step(){if(a.dialogue)HonroStory.finish(a);e.tick(C.STEP);if(!a.dialogue)a.missionTick(C.STEP);ticks++;if(ticks%60===0)a.scene.render(e,1,'',.6,false,1);}
 function aim(u){const id=C.baseSkill(u.cls),targets=e.alive(1).filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<1550).sort((v,w)=>(v.id==='midboss-stage6'?-2000:0)+Math.hypot(v.x-u.x,v.y-u.y)-(w.id==='midboss-stage6'?-2000:0)-Math.hypot(w.x-u.x,w.y-u.y));for(const v of targets)for(const p of e.shotSeeds(u,C.SKILLS[id],v)){const r=e.predict(u,C.SKILLS[id],p.angle,p.power,v,false),hit=e.unit(r.unit);if(hit?.side===1){const safe=C.shotViable(e,u,C.SKILLS[id],v,p.angle,p.power);if(safe.ok&&safe.risk<1)return{id,p,v:hit};}}}
 for(let n=0;n<220000&&!['won','lost'].includes(b.phase)&&b.round<90;n++){
  const u=e.active;
  if(e.canAct()&&u?.side===0&&!a.dialogue){
   const st=state[u.id]??={goal:0,still:0,lastX:u.x,lastY:u.y},plan=plans[u.cls],p=plan[Math.min(st.goal,plan.length-1)];
   if(st.jumping){if(e.grounded(u)&&ticks-st.jumping.at>8){log.push({op:'land',actor:u.id,round:b.round,x:u.x,y:u.y});st.jumping=null;st.goal++;}else if(u.moveLeft>8)e.move(Math.sign(st.jumping.x-u.x),C.STEP);step();continue;}
   if(Math.abs(u.x-p.x)<12&&e.grounded(u)){
    if(p.jumpTo){if(u.moveLeft<400){a.defend();step();continue;}if(e.jump(u)){st.jumping={x:p.jumpTo,at:ticks};step();continue;}}
    if(p.drop&&e.canDrop(u)){e.drop(u);log.push({op:'drop',actor:u.id,round:b.round,x:u.x,y:u.y});}
    poses.push({actor:u.id,goal:p.x,x:u.x,y:u.y,round:b.round});if([3100,4100,5350,6380].includes(p.x))capture(u.cls+'-'+p.x,u);st.goal=Math.min(st.goal+1,plan.length-1);
   }
   if(e.grounded(u)&&(u.moveLeft<150||e.alive(1).some(v=>Math.hypot(v.x-u.x,v.y-u.y)<750))){const shot=aim(u);if(shot&&e.fire(shot.id,shot.p.angle,shot.p.power)){log.push({op:'fire',actor:u.id,round:b.round,x:u.x,y:u.y,target:shot.v.id,skill:shot.id,...shot.p});step();continue;}}
   if(u.moveLeft>10&&Math.abs(u.x-plan[st.goal].x)>6){e.move(Math.sign(plan[st.goal].x-u.x),C.STEP);if(e.grounded(u)&&st.still>20&&u.moveLeft>350){if(e.jump(u))st.still=0;}}
   else {const shot=aim(u);if(shot&&e.fire(shot.id,shot.p.angle,shot.p.power))log.push({op:'fire',actor:u.id,round:b.round,x:u.x,y:u.y,target:shot.v.id,skill:shot.id,...shot.p});else a.defend();}
   st.still=Math.hypot(u.x-st.lastX,u.y-st.lastY)<.01?st.still+1:0;st.lastX=u.x;st.lastY=u.y;
  }
  step();
 }
 return{method:'Production browser Engine inputs; legal chapter1–5 completion-reward fixture, normal resources and live AI, no teleports/healing resets.',start,end:{phase:b.phase,round:b.round,heroes:e.heroesAlive().map(u=>({id:u.id,hp:u.hp,maxHp:u.maxHp,focus:u.focus,x:u.x,y:u.y})),rescued:b.honroState.rescued,objective:b.units.filter(u=>u.id==='objective'||u.id==='midboss-stage6').map(u=>({id:u.id,hp:u.hp,dead:u.dead,x:u.x,y:u.y})),events:b.honroEvents,eventLog:b.honroState.eventLog,pending:b.honroState.pendingEvents,populationCap:HonroEncounters.populationCap(b),spawned:b.units.filter(u=>u.honroSpawnSource).map(u=>({id:u.id,source:u.honroSpawnSource,x:u.spawnX,y:u.spawnY})),enemies:e.alive(1).length,flags:b.honroState.flags},ticks,poses,log,images};
}
