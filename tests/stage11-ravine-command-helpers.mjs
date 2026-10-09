/** Isolated route probe using only player commands after one-time initialization.
 * No HP/focus/movement/position correction, terrain changes or hidden skills.
 * Removing the other actors isolates collision, not combat completion. */
export function isolateRouteHero(q,cls,start){
 const u=q.e.heroesAlive().find(v=>v.cls===cls);if(!u)throw Error('Missing recruited route hero '+cls);
 q.b.units=[u];q.b.active=u.id;q.b.side=0;q.b.phase='aim';q.e.checkEnd=()=>false;
 if(start)Object.assign(u,{x:start.x,y:start.y,vx:0,vy:0,airborne:false,jumping:false});
 if(u.ranks.SP03)throw Error('Required-route probe must have untrained jump');
 return u;
}
export function commandRoute(g,q,u,route,{toleranceX=12,toleranceY=25,maxFramesPerGoal=10000}={}){
 const {b,e}=q,C=g.HONRO_CORE,startHp=u.hp,commands=[],samples=[];let frames=0,waits=0,jumps=0,walked=0,damage=0,previousX=u.x,previousHp=u.hp,failed=null,minY=u.y,maxY=u.y,minX=u.x,maxX=u.x;
 const step=()=>{e.tick(C.STEP);frames++;walked+=Math.abs(u.x-previousX);previousX=u.x;damage+=Math.max(0,previousHp-u.hp);previousHp=u.hp;minY=Math.min(minY,u.y);maxY=Math.max(maxY,u.y);minX=Math.min(minX,u.x);maxX=Math.max(maxX,u.x);};
 const grounded=()=>e.grounded(u);
 const wait=()=>{if(!e.canAct())return false;e.wait();waits++;commands.push({op:'wait',round:b.round,x:u.x,y:u.y});for(let n=0;n<6000&&!e.canAct()&&!u.dead;n++)step();return e.canAct();};
 const jump=()=>{if(!e.canAct())return false;const ok=e.jump(u);if(ok){jumps++;commands.push({op:'jump',round:b.round,x:u.x,y:u.y});}return ok;};
 const arrived=p=>Math.abs(u.x-p.x)<=toleranceX&&Math.abs(u.y-p.y)<=toleranceY&&grounded();
 for(const [index,p] of route.entries()){
  let still=0,reached=false,age=0;const goalStartJumps=jumps;
  for(;age<maxFramesPerGoal;age++){
   if(arrived(p)){reached=true;break;}
   if(u.dead||u.y>b.height+30){failed={reason:'dead/fell',index,goal:p,x:u.x,y:u.y};break;}
   if(!e.canAct()){step();continue;}
   if(grounded()&&u.moveLeft<Math.max(12,(u.y-p.y>toleranceY||still>12)?e.jumpCost(u)+20:12)){if(!wait()){failed={reason:'cannot renew movement through wait',index,goal:p};break;}}
   const prior={x:u.x,y:u.y};
   if(Math.abs(u.x-p.x)>toleranceX/2){const dx=Math.abs(u.x-p.x),move=dx<25?.3:1;e.move(Math.sign(p.x-u.x)*move,C.STEP);}
   if(grounded()&&(still>12&&Math.abs(u.x-p.x)>=28||Math.abs(u.x-p.x)<28&&u.y-p.y>toleranceY)){if(jumps-goalStartJumps>=12){failed={reason:'ordinary jump retries exhausted',index,goal:p,x:u.x,y:u.y,support:e.surface(u.x,u.y-5,u.y+5)?.t?.id};break;}if(jump())still=0;}
   step();
   if(Math.hypot(u.x-prior.x,u.y-prior.y)<.01)still++;else still=0;
   if(still>180){failed={reason:'blocked',index,goal:p,x:u.x,y:u.y,support:e.surface(u.x,u.y-5,u.y+5)?.t?.id,moveLeft:u.moveLeft};break;}
  }
  if(!failed&&!reached)failed={reason:'timeout',index,goal:p,x:u.x,y:u.y,support:e.surface(u.x,u.y-5,u.y+5)?.t?.id};
  if(!failed&&p.jumpTo){
   const to=p.jumpTo,cost=e.jumpCost(u)+Math.abs(to.x-u.x)+60;if(u.moveLeft<cost&&!wait())failed={reason:'cannot prepare planned jump',index,goal:p};
   if(!failed&&!jump())failed={reason:'planned jump rejected',index,goal:p};
   let air=0;for(;!failed&&air<1500;air++){
    if(e.canAct()&&Math.abs(u.x-to.x)>3)e.move(Math.sign(to.x-u.x)*.35,C.STEP);step();if(air>15&&grounded())break;
   }
   const support=e.surface(u.x,u.y-5,u.y+5)?.t?.id;
   if(!failed&&(air>=1500||to.support&&support!==to.support||Number.isFinite(to.y)&&Math.abs(u.y-to.y)>toleranceY))failed={reason:'planned jump wrong landing',index,goal:to,x:u.x,y:u.y,support};
  }
  samples.push({index,goal:{x:p.x,y:p.y},x:u.x,y:u.y,round:b.round,age,support:e.surface(u.x,u.y-5,u.y+5)?.t?.id});
  if(failed)break;
 }
 return {passed:!failed&&!u.dead&&damage===0,failed,frames,waits,jumps,rounds:b.round,damage,netHpChange:u.hp-startHp,walked,bounds:{minX,maxX,minY,maxY},samples,commands,scope:'isolated route; real move/jump/wait/tick; no actor corrections after setup; not combat'};
}
