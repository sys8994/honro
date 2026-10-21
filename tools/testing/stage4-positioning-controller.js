()=>{
 const a=HonroApp,e=a.engine,b=e.b,C=HONRO_CORE,log=[],poses=[],images={},plans={
 archer:[{x:960,jumpTo:1000},{x:1130,jumpTo:1170},{x:1320,jumpTo:1400},{x:1790},{x:1400,drop:true},{x:1200,drop:true},{x:1060,drop:true},{x:1150}],
 mage:[{x:1250},{x:1550},{x:1750},{x:1250},{x:1150}]
 },state={},start={heroes:e.heroesAlive().map(u=>({id:u.id,cls:u.cls,hp:u.hp,maxHp:u.maxHp,focus:u.focus,level:u.level,loadout:u.loadout})),items:structuredClone(b.items),enemies:e.alive(1).length};let ticks=0;
 function capture(label,u){if(images[label])return;const s=a.scene;Object.assign(s,{x:u.x+160,y:u.y-160,scale:.65,manual:true,storyTween:null,cinematic:null});s.render(e,0,'',.6,false,0);images[label]=document.querySelector('#battlecanvas').toDataURL('image/png');}
 function step(){if(a.dialogue)HonroStory.finish(a);e.tick(C.STEP);if(!a.dialogue)a.missionTick(C.STEP);ticks++;if(ticks%60===0)a.scene.render(e,1,'',.6,false,1);}
 function aim(u){const id=u.cls==='mage'?'M01':'A01',targets=e.alive(1).filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<1900).sort((v,w)=>Math.hypot(v.x-u.x,v.y-u.y)-Math.hypot(w.x-u.x,w.y-u.y));for(const v of targets)for(const p of e.shotSeeds(u,C.SKILLS[id],v)){const r=e.predict(u,C.SKILLS[id],p.angle,p.power,v,false),hit=e.unit(r.unit);if(hit?.side===1)return{id,p,v:hit};}}
 for(let n=0;n<220000&&!['won','lost'].includes(b.phase)&&b.round<90;n++){
  const u=e.active;
  if(e.canAct()&&u?.side===0&&!a.dialogue){
   const st=state[u.id]??={goal:0,still:0,lastX:u.x,lastY:u.y},plan=plans[u.cls],p=plan[Math.min(st.goal,plan.length-1)];

   if(st.jumping){if(e.grounded(u)&&ticks-st.jumping.at>8){log.push({op:'land',actor:u.id,round:b.round,x:u.x,y:u.y});st.jumping=null;st.goal++;}else if(u.moveLeft>8)e.move(Math.sign(st.jumping.x-u.x),C.STEP);step();continue;}
   if(Math.abs(u.x-p.x)<12&&e.grounded(u)){
    if(p.jumpTo){if(u.moveLeft<400){e.wait();step();continue;}if(e.jump(u)){st.jumping={x:p.jumpTo,at:ticks};step();continue;}}
    if(p.drop&&e.canDrop(u)){e.drop(u);log.push({op:'drop',actor:u.id,round:b.round,x:u.x,y:u.y});}
    if(u.cls==='archer'&&p.x===1790&&!st.highShot){const shot=aim(u);if(shot&&e.fire(shot.id,shot.p.angle,shot.p.power)){st.highShot=true;capture('archer-high-fire',u);log.push({op:'high-fire',round:b.round,target:shot.v.id});step();continue;}}
    poses.push({actor:u.id,goal:p.x,x:u.x,y:u.y,round:b.round});if([1790,1750,1150].includes(p.x))capture(u.cls+'-'+p.x,u);st.goal=Math.min(st.goal+1,plan.length-1);
   }
   if((u.cls!=='archer'||st.goal>=4)&&e.grounded(u)&&(u.moveLeft<150||e.alive(1).some(v=>Math.hypot(v.x-u.x,v.y-u.y)<750))){const shot=aim(u);if(shot&&e.fire(shot.id,shot.p.angle,shot.p.power)){log.push({op:'fire',actor:u.id,round:b.round,x:u.x,y:u.y,target:shot.v.id,skill:shot.id,...shot.p});step();continue;}}
   if(u.moveLeft>10&&Math.abs(u.x-plan[st.goal].x)>6){e.move(Math.sign(plan[st.goal].x-u.x),C.STEP);if(e.grounded(u)&&st.still>20&&u.moveLeft>350){if(e.jump(u))st.still=0;}}
   else {const shot=aim(u);if(shot&&e.fire(shot.id,shot.p.angle,shot.p.power))log.push({op:'fire',actor:u.id,round:b.round,x:u.x,y:u.y,target:shot.v.id,skill:shot.id,...shot.p});else e.wait();}
   st.still=Math.hypot(u.x-st.lastX,u.y-st.lastY)<.01?st.still+1:0;st.lastX=u.x;st.lastY=u.y;
  }
  step();
 }
 return{method:'Production browser Engine inputs; legal chapter3 reward ledger fixture, normal resources and live AI, no teleports/healing resets.',start,end:{phase:b.phase,round:b.round,heroes:e.heroesAlive().map(u=>({id:u.id,hp:u.hp,maxHp:u.maxHp,focus:u.focus,x:u.x,y:u.y})),gate:e.unit('objective')?.hp,enemies:e.alive(1).length,flags:b.honroState.flags},ticks,poses,log,images};
}
