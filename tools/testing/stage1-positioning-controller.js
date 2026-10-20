()=>{
 const a=HonroApp,e=a.engine,b=e.b,C=HONRO_CORE,u=b.units.find(u=>u.side===0),log=[],poses=[],images={};
 const start={hp:u.hp,maxHp:u.maxHp,focus:u.focus,level:u.level,ranks:u.ranks,items:structuredClone(b.items),enemies:e.alive(1).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp}))};
 let ticks=0,shots=0,waits=0,jumps=0,goal=0,still=0,lastX=u.x,lastY=u.y;
 const goals=[690,930,1500,2000,2300,2700,3100,3430,3760,4100,4650,4900,5210];
 function step(){if(a.dialogue){log.push({op:'dialogue',round:b.round,x:u.x});HonroStory.finish(a);}e.tick(C.STEP);if(!a.dialogue)a.missionTick(C.STEP);ticks++;}
 function aim(){const targets=e.alive(1).filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<1700).sort((v,w)=>Math.hypot(v.x-u.x,v.y-u.y)-Math.hypot(w.x-u.x,w.y-u.y));for(const v of targets){for(const p of e.shotSeeds(u,C.SKILLS.A01,v)){const pred=e.predict(u,C.SKILLS.A01,p.angle,p.power,v,false);if(pred.unit===v.id)return{p,v};}}}
 for(let n=0;n<120000&&!['won','lost'].includes(b.phase);n++){
  if(e.canAct()&&e.active?.id===u.id&&!a.dialogue){
   if(Math.abs(u.x-goals[goal])<12&&e.grounded(u)){poses.push({goal:goals[goal],x:u.x,y:u.y,round:b.round,hp:u.hp});
 if([1500,3430,3760,4650].includes(goals[goal])){let s=a.scene;Object.assign(s,{x:u.x+170,y:u.y-180,scale:.65,manual:true,storyTween:null,cinematic:null});s.render(e,0,'',.6,false,0);images['position-'+goals[goal]]=document.querySelector('#battlecanvas').toDataURL('image/png');}goal=Math.min(goal+1,goals.length-1);}
   if(goal===1&&e.grounded(u)&&u.x<760&&u.moveLeft>400){if(e.jump(u)){jumps++;log.push({op:'jump-entry',x:u.x,round:b.round});}}
   // Fight on arrival at a shelf, or when threatened; never change actor resources.
   if(e.grounded(u)&&(u.moveLeft<180||e.alive(1).some(v=>Math.hypot(v.x-u.x,v.y-u.y)<700))){const shot=aim();if(shot&&e.fire('A01',shot.p.angle,shot.p.power)){shots++;log.push({op:'fire',round:b.round,x:u.x,y:u.y,target:shot.v.id,...shot.p});step();continue;}}
   if(u.moveLeft>12){e.move(Math.sign(goals[goal]-u.x),C.STEP);if(e.grounded(u)&&still>18&&u.moveLeft>350){if(e.jump(u)){jumps++;still=0;}}}
   else{const shot=aim();if(shot&&e.fire('A01',shot.p.angle,shot.p.power)){shots++;log.push({op:'fire',round:b.round,x:u.x,y:u.y,target:shot.v.id,...shot.p});}else{e.wait();waits++;log.push({op:'wait',round:b.round,x:u.x});}}
  }
  step();still=Math.hypot(u.x-lastX,u.y-lastY)<.01?still+1:0;lastX=u.x;lastY=u.y;
  if(ticks%12000===0)log.push({op:'checkpoint',ticks,round:b.round,x:u.x,y:u.y,hp:u.hp,phase:b.phase});
 }
 return{start,end:{phase:b.phase,reason:b.winnerReason,round:b.round,x:u.x,y:u.y,hp:u.hp,focus:u.focus,items:b.items,enemies:e.alive(1).length,flags:b.honroState.flags},ticks,shots,waits,jumps,poses,log,images};
}
