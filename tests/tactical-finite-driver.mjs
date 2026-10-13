export function isolate(q,cls,fallback){const {b,e}=q,u=e.heroesAlive().find(u=>u.cls===cls)||structuredClone(fallback);b.units=[u];b.active=u.id;b.side=0;b.phase='aim';e.checkEnd=()=>false;return u;}
export function drive(g,q,u,points,{jump=true,threshold=12,label='',automaticDrop=false,strictPose=true}={}){
 const {b,e}=q,C=g.HONRO_CORE,events=[],poses=[],start={x:u.x,y:u.y,hp:u.hp,round:b.round},counts={ticks:0,jumps:0,waits:0,walkCost:0,jumpCost:0,damage:0,invalid:0};let failure=null,prevHp=u.hp;
 const pos=()=>({x:u.x,y:u.y,support:e.contactSurface(u.x,u.y-4,u.y+5)?.t.id,round:b.round,moveLeft:u.moveLeft});
 function step(){e.tick(C.STEP);counts.ticks++;counts.damage+=Math.max(0,prevHp-u.hp);prevHp=u.hp;if(u.dead)throw Error('dead');if(e.grounded(u)&&!C.validTerrainContactPose(b.terrain,u)){counts.invalid++;events.push({op:'invalid-contact',...pos()});if(strictPose)throw Error('body clearance');}}
 function ready(){let n=0;while(n++<12000){if(e.canAct()&&e.active?.id===u.id)return;if(e.canAct()&&!u.acted){e.select(u.id);if(e.active?.id===u.id)return;}if(e.canAct()&&u.acted){e.wait();events.push({op:'party-wait',actor:e.active?.id,...pos()});}step();}throw Error('not actionable');}
 function renew(need){ready();if(u.moveLeft<need){if(!e.grounded(u)){events.push({op:'budget-exhausted-coast',...pos()});let a=0;while(!e.grounded(u)&&a++<600)step();if(!e.grounded(u))throw Error('air budget did not settle');}e.wait();counts.waits++;events.push({op:'wait',...pos()});ready();}if(u.moveLeft<need)throw Error('budget not renewed');}
 function move(x){if(Math.abs(x-u.x)<2)return;const pre=u.moveLeft;e.move(Math.sign(x-u.x),Math.min(C.STEP,Math.abs(x-u.x)/u.walkSpeed));counts.walkCost+=Math.max(0,pre-u.moveLeft);}
 function hop(){renew(e.jumpCost(u)+Math.min(u.maxMove-100,600));const pre=u.moveLeft;if(!e.jump(u))throw Error('jump refused');counts.jumps++;counts.jumpCost+=pre-u.moveLeft;events.push({op:'jump',...pos()});}
 try{for(const p of points){let still=0,jumps=0,reached=false;for(let i=0;i<10000;i++){
  if(Math.abs(u.x-p.x)<6&&(p.y===undefined||Math.abs(u.y-p.y)<8)&&e.grounded(u)&&(!p.support||p.support===pos().support)){reached=true;break;}
  if(automaticDrop&&Math.abs(u.x-p.x)<8&&p.y-u.y>20&&e.canDrop(u)){e.drop(u);events.push({op:'drop',...pos()});let d=0;do{step();}while(!e.grounded(u)&&d++<500);continue;}
  renew(10);const old={x:u.x,y:u.y};move(p.x);step();still=Math.hypot(u.x-old.x,u.y-old.y)<.01?still+1:0;
  if(jump&&e.grounded(u)&&jumps<3&&(still>threshold||(Math.abs(u.x-p.x)<10&&p.y!==undefined&&u.y-p.y>20))){hop();jumps++;still=0;}
  if(still>100)throw Error('blocked at '+JSON.stringify(pos())+' goal '+JSON.stringify(p));
 }
 if(!reached)throw Error('timeout at '+JSON.stringify(pos())+' goal '+JSON.stringify(p));
 poses.push({goal:p,...pos()});
 if(p.jumpTo){hop();let landed=false;for(let i=0;i<350;i++){if(i>=(p.delay||0))move(p.jumpTo.x);step();if(i>5&&e.grounded(u)){landed=true;break;}}if(!landed)throw Error('planned jump did not settle');poses.push({jump:p.jumpTo,...pos()});if(p.jumpTo.support&&pos().support!==p.jumpTo.support)throw Error('wrong jump support');}
 if(p.drop){let cool=0;while(u.platformDrop&&cool++<120)step();if(!e.drop(u))throw Error('drop refused');events.push({op:'drop',...pos()});let n=0;do{step();}while(!e.grounded(u)&&n++<500);}
 }}catch(err){failure={message:err.message,...pos(),last:poses.at(-1)}}
 return {label,cls:u.cls,passed:!failure&&counts.damage===0,failure,start,end:pos(),counts,movementCost:counts.walkCost+counts.jumpCost,turnEquivalent:(counts.walkCost+counts.jumpCost)/u.maxMove,events,poses};
}
