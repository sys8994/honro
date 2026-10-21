()=>{
 const a=HonroApp,e=a.engine,b=e.b,C=HONRO_CORE,u=e.heroesAlive()[0],log=[],images={},poses=[];
 const start={hp:u.hp,maxHp:u.maxHp,focus:u.focus,level:u.level,items:structuredClone(b.items),enemies:e.alive(1).length};
 let ticks=0,phase=0,shots=0,waits=0,warned=false;
 function capture(label,x=u.x,y=u.y-150,scale=.65){const s=a.scene;Object.assign(s,{x,y,scale,manual:true,storyTween:null,cinematic:null});s.render(e,0,'',.6,false,0);images[label]=document.querySelector('#battlecanvas').toDataURL('image/png');}
 function step(){if(a.dialogue)HonroStory.finish(a);e.tick(C.STEP);if(!a.dialogue)a.missionTick(C.STEP);ticks++;if(!warned&&b.honroState.stage2Airborne?.warning){warned=true;capture('airborne-warning',2700,1600,.35);}}
 function aim(){const targets=e.alive(1).sort((v,w)=>Math.hypot(v.x-u.x,v.y-u.y)-Math.hypot(w.x-u.x,w.y-u.y));for(const v of targets)for(const p of e.shotSeeds(u,C.SKILLS.A01,v)){const pred=e.predict(u,C.SKILLS.A01,p.angle,p.power,v,false);if(pred.unit===v.id)return{p,v};}}
 capture('entry');
 for(let n=0;n<160000&&!['won','lost'].includes(b.phase);n++){
  if(e.canAct()&&e.active?.id===u.id&&!a.dialogue){
   if(phase===0&&u.x>990&&e.grounded(u)){capture('upper-connected');poses.push({x:u.x,y:u.y,round:b.round});if(e.drop(u)){phase=1;log.push({op:'drop',round:b.round,x:u.x});}}
   if(phase===1&&e.grounded(u)&&u.x>1380){phase=2;capture('middle-cover');poses.push({x:u.x,y:u.y,round:b.round});}
   if(phase<2&&u.moveLeft>10)e.move(1,C.STEP);
   else {const shot=aim();if(shot&&e.fire('A01',shot.p.angle,shot.p.power)){shots++;log.push({op:'fire',round:b.round,x:u.x,y:u.y,target:shot.v.id,...shot.p});}else{e.wait();waits++;}}
  }
  step();
  if(ticks%20000===0)log.push({op:'checkpoint',round:b.round,phase:b.phase,x:u.x,y:u.y,hp:u.hp,carX:e.unit('objective')?.x});
 }
 capture('convoy-arrival',2400,2790,.55);
 return{method:'Production browser Engine move/drop/fire/wait and missionTick; normal profile from legal chapter1 reward fixture, no teleports/resource resets. Not keyboard manual play.',start,end:{phase:b.phase,round:b.round,hp:u.hp,focus:u.focus,x:u.x,y:u.y,carX:e.unit('objective')?.x,carHp:e.unit('objective')?.hp,enemies:e.alive(1).length,flags:b.honroState.flags},poses,ticks,shots,waits,log,images};
}
