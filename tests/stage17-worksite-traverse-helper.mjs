/** Stage17 isolated physical locomotion. No pose corrections in traversal. */
export function traverse(g,b,e,u,route,{jump=true}={}){
 const samples=[];let ticks=0,jumps=0,failed=null;const startHp=u.hp;
 for(const p of route){
  let age=0,still=0,attempts=0;const max=Math.max(900,Math.ceil(Math.abs(p.x-u.x)/u.walkSpeed*60*5));
  while(age++<max){
   const reached=Math.abs(u.x-p.x)<22&&Math.abs(u.y-p.y)<100&&e.grounded(u);if(reached)break;
   const before={x:u.x,y:u.y};u.moveLeft=u.maxMove;
   const dir=Math.sign(p.x-u.x);if(Math.abs(u.x-p.x)>10)e.walk(u,dir,1/60);
   if(jump&&(still>10||Math.abs(u.x-p.x)<24&&u.y-p.y>100)&&e.grounded(u)&&attempts<20){if(e.jump(u)){jumps++;attempts++;still=0;}}
   e.integrateBody(u,1/60);ticks++;
   if(Math.hypot(u.x-before.x,u.y-before.y)<.015)still++;else still=0;
   if(u.dead||u.y>b.height+30){failed={reason:'fall',goal:p,x:u.x,y:u.y};break;}
   if(still>90){failed={reason:'blocked',goal:p,x:u.x,y:u.y};break;}
  }
  if(!failed&&age<max&&p.jumpTo){
   // A deliberate, ordinary jump across overlapping branch/ramp joins. This
   // models a real input sequence rather than waiting to fall and correcting it.
   u.moveLeft=u.maxMove;const launched=e.jump(u);if(launched)jumps++;
   let air=0;for(;launched&&air<180;air++){u.moveLeft=u.maxMove;if(Math.abs(u.x-p.jumpTo.x)>3)e.walk(u,Math.sign(p.jumpTo.x-u.x)*(p.jumpTo.speed||.35),1/60);e.integrateBody(u,1/60);ticks++;if(air>30&&e.grounded(u))break;}
   const landing=e.surface(u.x,u.y-5,u.y+5)?.t?.id;
   if(!launched||air>=180||p.jumpTo.support&&landing!==p.jumpTo.support)failed={reason:'planned jump did not land on intended support',goal:p.jumpTo,x:u.x,y:u.y,landing};
  }
  if(!failed&&p.dropTo){let age=0;for(;age<600;age++){u.moveLeft=u.maxMove;if(Math.abs(u.x-p.dropTo.x)>3)e.walk(u,Math.sign(p.dropTo.x-u.x),1/60);e.integrateBody(u,1/60);ticks++;const support=e.surface(u.x,u.y-5,u.y+5)?.t?.id;if(age>5&&e.grounded(u)&&support===p.dropTo.support&&Math.abs(u.x-p.dropTo.x)<15)break;}if(age>=600)failed={reason:'ordinary step-off did not reach support',goal:p.dropTo,x:u.x,y:u.y,landing:e.surface(u.x,u.y-5,u.y+5)?.t?.id};}
  samples.push({goal:{x:p.x,y:p.y,id:p.id},x:u.x,y:u.y,ticks:age,support:e.surface(u.x,u.y-5,u.y+5)?.t?.id,jumpTo:p.jumpTo});
  if(failed||age>=max){failed??={reason:'timeout',goal:p,x:u.x,y:u.y};break;}
 }
 return{passed:!failed,failed,ticks,jumps,damage:startHp-u.hp,samples,mode:jump?'isolated ordinary walking and default jumps':'isolated walk-only'};
}
