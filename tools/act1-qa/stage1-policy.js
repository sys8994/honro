()=>{
 const a=HonroApp,e=a.engine,b=e.b,C=HONRO_CORE,u=e.heroesAlive()[0],policy=QA_POLICY.replace(/-v2|-cohort/g,''),log=[],poses=[];
 const goals=policy==='route-highground'?[690,930,1500,2000,2300,2700,3100,3430,3760,4100,4650,4900,5210]:[690,930,1500,1700,2300,2900,3500,4100,4700,5210];
 let ticks=0,goal=0;
 function tick(){if(a.dialogue)HonroStory.finish(a);e.tick(C.STEP);if(!a.dialogue)a.missionTick(C.STEP);ticks++;}
 function ready(){for(let i=0;i<20000&&!e.canAct()&&!['won','lost'].includes(b.phase);i++)tick();}
 function aim(){let best=null;for(const t of e.alive(1).filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<2200).sort((v,w)=>Math.hypot(v.x-u.x,v.y-u.y)-Math.hypot(w.x-u.x,w.y-u.y)).slice(0,4)){for(const q of e.shotSeeds(u,C.SKILLS.A01,t)){const v=C.shotViable(e,u,C.SKILLS.A01,t,q.angle,q.power);if(v.ok&&v.risk<1&&v.enemyDamage>0&&(!best||v.net>best.net))best={...q,target:t.id,net:v.net};}}return best;}
 for(let action=0;action<90&&!['won','lost'].includes(b.phase);action++){
  ready();if(!e.canAct())break;
  if(u.hp<u.maxHp*.48&&b.items.heal>0&&e.item('heal')){log.push({op:'heal',round:b.round});continue;}
  let still=0;const startMove=u.moveLeft,from={x:u.x,y:u.y};
  for(let n=0;n<1800&&e.canAct()&&u.moveLeft>8;n++){
   while(goal<goals.length-1&&u.x>goals[goal]-12)goal++;
   if(Math.abs(u.x-goals[goal])<12&&goal===goals.length-1)break;
   const old=u.x;
   if(goal===1&&e.grounded(u)&&u.x<760&&u.moveLeft>400)e.jump(u);
   if(policy==='objective-aggressive'&&u.x>1500&&e.surface(u.x,u.y-3,u.y+3)?.t?.id==='pine-branch-west')e.drop(u);
   e.move(Math.sign(goals[goal]-u.x),C.STEP);tick();still=Math.abs(u.x-old)<.03?still+1:0;
   if(still>12&&e.grounded(u)){e.jump(u);still=0;}
   if(policy==='cover-survival'&&startMove-u.moveLeft>startMove*.65&&e.grounded(u)&&e.alive(1).some(t=>Math.hypot(t.x-u.x,t.y-u.y)<1100))break;
  }
  for(let i=0;i<180&&e.canAct()&&!e.grounded(u);i++)tick();
  poses.push({round:b.round,from,to:{x:u.x,y:u.y},hp:u.hp,moveLeft:u.moveLeft,goal:goals[goal]});if(!e.canAct())continue;
  const q=aim();if(q&&e.fire('A01',q.angle,q.power)){log.push({op:'fire',round:b.round,...q});continue;}
  e.wait();log.push({op:'defend',round:b.round,x:u.x,y:u.y});
 }
 return{policy,ticks,log,poses,end:{phase:b.phase,round:b.round,hp:u.hp,x:u.x,y:u.y}};
}
