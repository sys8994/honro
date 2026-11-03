async()=>{
 const app=HonroApp,e=app.engine,b=e.b,actions=[],damage=[],initial=plain(b),commands=qa.entry.commands,reactive=/*PLANNER*/;
 const ops=createPlayerOperations({app,g,C,record:r=>actions.push(r)}),hurt=e.hurt.bind(e);e.hurt=(u,...args)=>{const hp=u.hp,r=hurt(u,...args);if(hp>u.hp)damage.push({frame:ops.frames,round:b.round,target:u.id,owner:args[1],amount:hp-u.hp});return r;};
 const done=()=>['won','lost'].includes(b.phase);let failure=null,index=-1,memory={},round=0;
 function move(c){const u=e.active,from={x:u.x,y:u.y};if(c.op==='jump')assert(ops.jump(),'Normal jump rejected');let still=0;
  for(let n=0;n<2800&&app.canInput()&&u.moveLeft>3;n++){const dx=c.x-u.x,support=e.contactSurface(u.x,u.y-3,u.y+4)?.t.id;if(c.op==='climb'&&e.grounded(u)&&Math.abs(dx)<45&&u.y-c.y>35)ops.jump();if(Math.abs(dx)<5&&e.grounded(u)&&(c.op!=='climb'||support===c.support))break;const old=u.x;if(Math.abs(dx)>3)ops.move(Math.sign(dx)*(Math.abs(dx)<18?.35:c.input??1),C.STEP);ops.frame();still=Math.abs(u.x-old)<.03&&e.grounded(u)?still+1:0;if(still>30)break;}
  for(let n=0;n<400&&app.canInput()&&!e.grounded(u);n++)ops.frame();actions.push({op:'intent-move',command:c,round:b.round,actor:u.id,from,to:{x:u.x,y:u.y},support:e.contactSurface(u.x,u.y-3,u.y+4)?.t.id});
 }
 try{for(index=0;index<(qa.meta.preflight?2:240)&&!done();index++){if(!ops.ready())break;if(b.round>25)throw Error('Bounded 25-round diagnostic');let c;if(index<45){c=commands[index];if(c.op==='shoot'){const p=reactive({stage:5,memory,preferred:c});c=p.command;memory=p.memory;}}else{const p=reactive({stage:5,memory});c=p.command;memory=p.memory;}assert(c,'Reactive policy must return input');const u=e.active;if(c.hero)assert.equal(u.cls,c.hero,'Reactive actor mismatch');actions.push({op:'intent',index,command:c,round:b.round,actor:u.id});
  if(['walk','jump','climb'].includes(c.op))move(c);else if(c.op==='shoot'){assert(c.choice,'Reactive shot requires legal plan');const ok=ops.fire(c.skill,c.choice.angle,c.choice.power);if(!ok&&done())break;assert(ok,'Normal App launch rejected');}else if(c.op==='defend')assert(ops.defend(),'Normal defend rejected');else if(c.op==='interact')assert(ops.interact(b.honroMarkers.find(m=>m.id===c.id)),'Visible nearest interaction rejected');else throw Error('Unsupported command '+c.op);
  if(round!==b.round){round=b.round;await qaWrite('round-'+round+'.json',JSON.stringify({round,index,actions,damage,battle:b}));}
 }ops.ready();}catch(error){failure=error.stack;}
 await qaWrite('trace.json',JSON.stringify({initial,final:b,actions,damage,index,failure}));await qaFinish({phase:b.phase,round:b.round,index,failure});
}
