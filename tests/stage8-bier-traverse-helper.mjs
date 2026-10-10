/** Stage8 isolated locomotion: only normal walking, jumping and physics.
 * Authored waitFrames means letting a vertical jump rise before horizontal
 * input, never moving or repairing the body outside the real engine. */
export function traverse(g,b,e,u,route,{jump=true}={}){
 const samples=[];let ticks=0,jumps=0,drops=0,failed=null;const startHp=u.hp;
 const support=()=>e.contactSurface(u.x,u.y-5,u.y+5)?.t?.id;
 const step=goal=>{
  e.integrateBody(u,1/60);ticks++;
  if(u.dead||u.y>b.height+30)failed={reason:'fall',goal,x:u.x,y:u.y};
  else if(e.grounded(u)&&!g.HONRO_CORE.validTerrainContactPose(b.terrain,u))failed={reason:'invalid supported body pose',goal,x:u.x,y:u.y,support:support()};
 };
 const walkTo=(x,speed=1)=>{u.moveLeft=u.maxMove;if(Math.abs(u.x-x)>3)e.walk(u,Math.sign(x-u.x)*speed,1/60);};
 for(const p of route){
  let age=0,still=0,attempts=0;const max=Math.max(900,Math.ceil(Math.abs(p.x-u.x)/u.walkSpeed*60*5));
  while(age++<max){
   const reached=Math.abs(u.x-p.x)<22&&Math.abs(u.y-p.y)<100&&e.grounded(u);if(reached)break;
   const before={x:u.x,y:u.y};u.moveLeft=u.maxMove;
   const dir=Math.sign(p.x-u.x);if(Math.abs(u.x-p.x)>10)e.walk(u,dir,1/60);
   if(jump&&(still>10||Math.abs(u.x-p.x)<24&&u.y-p.y>100)&&e.grounded(u)&&attempts<20){if(e.jump(u)){jumps++;attempts++;still=0;}}
   step(p);if(failed)break;
   if(Math.hypot(u.x-before.x,u.y-before.y)<.015)still++;else still=0;
   if(still>90){failed={reason:'blocked',goal:p,x:u.x,y:u.y};break;}
  }
  if(!failed&&age<max&&p.jumpTo){
   // Deliberate ordinary jump, including steering over overlapping joins.
   // It must land on the declared support; there is no placement fallback.
   u.moveLeft=u.maxMove;const launched=e.jump(u);if(launched)jumps++;
   let air=0;for(;launched&&air<180;air++){if(air>=(p.jumpTo.waitFrames||0))walkTo(p.jumpTo.x,p.jumpTo.speed||.35);step(p.jumpTo);if(failed||air>30&&e.grounded(u))break;}
   const landing=support();
   if(!failed&&(!launched||air>=180||p.jumpTo.support&&landing!==p.jumpTo.support))failed={reason:'planned jump did not land on intended support',goal:p.jumpTo,x:u.x,y:u.y,landing};
  }
  if(!failed&&p.dropTo){
   const target=p.dropTo,startY=u.y;let age=0,steppedOff=target.stepOffX===undefined;
   for(;age<600;age++){
    // Optional outward input is needed when the landing is back underneath
    // the start platform. Wait for actual feet to leave its height before
    // steering back; this cannot phase through or disable a support.
    const x=steppedOff?target.x:target.stepOffX;walkTo(x);step(target);if(failed)break;
    if(!steppedOff&&Math.abs(u.x-target.stepOffX)<8&&u.y>startY+8)steppedOff=true;
    if(age>5&&e.grounded(u)&&support()===target.support&&Math.abs(u.x-target.x)<15){drops++;break;}
   }
   if(!failed&&age>=600)failed={reason:'ordinary step-off did not reach support',goal:target,x:u.x,y:u.y,landing:support()};
  }
  samples.push({goal:{x:p.x,y:p.y,id:p.id,surfaceId:p.surfaceId},x:u.x,y:u.y,ticks:age,support:support(),jumpTo:p.jumpTo,dropTo:p.dropTo});
  if(failed||age>=max){failed??={reason:'timeout',goal:p,x:u.x,y:u.y};break;}
 }
 return{passed:!failed,failed,ticks,jumps,drops,damage:startHp-u.hp,samples,mode:jump?'isolated ordinary walking and default jumps':'isolated walk-only'};
}
