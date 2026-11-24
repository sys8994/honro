(tape,previous)=>{
 const a=HonroApp,e=a.engine,b=e.b,u=e.active,dt=1/120,order=[];
 const grounded=()=>e.grounded(u),check=(ok,msg)=>{if(!ok)throw Error(msg);};
 const view=()=>({id:u.id,x:u.x,y:u.y,phase:b.phase,round:b.round,side:b.side,grounded:grounded()});
 const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
 const safe=()=>HonroApp===a&&a.engine===e&&e.b===b&&e.active===u&&a.profile===a.normalProfile&&
  a.stageId===54&&e.stage.id===54&&b.honroStage===54&&b.mode==='campaign'&&b.honroAuthoredId==='stage-54'&&b.honroCustom===false;
 check(safe()&&u.id===previous.id&&same(u.loadout,previous.loadout)&&u.hp===previous.hp&&u.focus===previous.focus&&u.shield===previous.shield&&grounded(),'Invalid live normal 54 carry');
 const tick=()=>{e.tick(dt);a.missionTick(dt);};
 const assertPose=q=>{
   if(!q)return;const v=view();
   check(v.id===previous.id&&v.phase===q.phase&&v.side===q.side&&v.grounded===q.grounded&&v.round===q.round&&Math.abs(v.x-q.x)<=.012&&Math.abs(v.y-q.y)<=.012,'Native chart pose differs '+JSON.stringify({v,q}));
 };
 return (function*(){
  let i=0,accepted;
  for(const r of tape.commands){
    check(safe(),'Current scope lost');i++;assertPose(r.before);accepted=null;
    if(r.op==='chart'){
      const old=b.sceneVersion;
      yield {kind:'chart',id:r.args[0],index:i};
      accepted=b.sceneVersion!==old;
      if(accepted){
        for(let n=0;n<700&&!grounded();n++)tick();
        check(grounded(),'No actual 54 chart landing');order.push({id:r.args[0],...view()});
      }
    }else if(r.op==='contextual'){
      const old=b.shot;
      yield {kind:'relay',angle:r.args[1],power:r.args[2],index:i};
      accepted=b.shot===old+1;
    }else if(r.op==='tick'){
      check(r.args[0]===dt&&r.times>0&&r.times<50000,'Tick input refused');for(let n=0;n<r.times;n++)tick();
    }else if(r.op==='move'){
      for(let n=0;n<r.times;n++)e.move(...r.args);
    }else if(r.op==='jump')accepted=e.jump(u);
    else if(r.op==='fire')accepted=e.fire(...r.args);
    else throw Error('Forbidden operation '+r.op);
    if(typeof r.accepted==='boolean')check(accepted===r.accepted,'Native chart input outcome changed at '+i);
    assertPose(r.after);
  }
  const wanted=['N>L','L>C','C>L'],exitFrom=view();
  check(same(order.map(q=>q.id),wanted),'All native chart landings are required '+JSON.stringify({order,exitFrom}));
  let footTicks=0;
  if(b.phase!=='won'){
   const support=()=>e.contactSurface(u.x,u.y-4,u.y+4)?.t.id;
   const actualStake=b.stakes.find(z=>z.shot===b.shot&&z.skill==='M09'&&z.owner===u.id&&z.y===2930);
   // Same signed tape is selected through the M09 shot. Different real gear
   // can move a different number of WU per tick, so finish by legal stepping
   // on the same ledge rather than copy an isolated profile's last x.
   check(safe()&&b.phase==='aim'&&b.side===0&&grounded()&&support()==='mid-contact'&&actualStake&&Math.abs(u.x-2316)<190,
      'Native 54 exit not actionable '+JSON.stringify({exitFrom,support:support(),stake:actualStake?.id??null,shot:b.shot}));
   while(b.phase==='aim'&&grounded()&&support()==='mid-contact'&&footTicks<180){
     if(u.x<2308||u.x>2324)e.move(Math.sign(2316-u.x),dt);
     tick();footTicks++;
   }
  }
  check(b.phase==='won'&&grounded(),'Native 54 terminal differs '+JSON.stringify({exitFrom,end:view(),footTicks,shot:b.shot,order}));
  return {pose:view(),hp:u.hp,focus:u.focus,shield:u.shield,loadout:structuredClone(u.loadout),order,exitFrom,footTicks};
 })();
}
