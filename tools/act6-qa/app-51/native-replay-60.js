// Browser test-only native deterministic inputs. A trusted click is required for guides/turn ends.
(atlas)=>{
 const app=HonroApp,e=app.engine,b=e.b,dt=1/atlas.clock;
 if(!(e instanceof HONRO_CORE.Engine)||app.stageId!==60||b.honroStage!==60||b.mode!=='act6-isolated'||b.phase!=='aim'||atlas.clock!==120||b.round!==1||b.shot!==0)throw Error('60 wrong warm battle');
 const ids=['qa-last-traveling-soul','quiet10-second-traveling-soul'], souls=ids.map(v=>e.unit(v));
 const players=()=>b.units.filter(u=>u.side===0&&!u.summoned);
 const row=u=>[u.id,u.cls,u.hp,u.focus,u.shield,u.loadout];
 if(players().length!==4||souls.some(u=>!u||u.side!==2||!e.grounded(u)||players().some(a=>e.attackAllows(u,a.id))))throw Error('60 protected souls or party absent');
 let armed=false, seen=[],ticks=0,moves=0;
 const start=players().map(row),start_s=souls.map(u=>u.x);
 const phase=()=>JSON.stringify([e.active?.id,b.phase,e.active?.acted,b.queue]);
 const run=(function*(){
  for(const x of atlas.schedule){
   if(app.engine!==e||e.active?.id!==x.actor||b.round!==x.round||!Number.isInteger(x.n)||x.n<1||x.n>3000||b.shot!==0||b.units.some(u=>u.side===1))throw Error('60 route engine drift '+JSON.stringify([x,ticks,e.active?.id,b.round,b.phase]));
   if(x.op==='interact'){
     if(x.n!==1||!['guide','end-walk'].includes(x.args[0]))throw Error('60 invalid route interaction');
     const before=phase(),ack=yield {op:x.args[0],actor:x.actor,round:x.round,ticks};
     if(ack!==true||x.args[0]==='end-walk'&&phase()===before)throw Error('60 input not accepted');
     if(x.args[0]==='guide'){if(armed||!e.grounded(e.unit(x.actor))||x.actor!=='p-occultist')throw Error('60 guide proof mismatch');armed=true;}
     seen.push({op:x.args[0],actor:x.actor,round:x.round,ticks});
   }else for(let j=0;j<x.n;j++){
    if(x.op==='tick'){ticks++;app.missionTick(dt);e.tick(dt);if(b.phase==='aim'&&b.side===0)e.checkEnd();}
    else if(x.op==='move'&&[-1,1].includes(x.args[0])){moves++;e.move(x.args[0],dt);}
    else if(x.op==='jump'&&x.n===1&&x.args[0]===x.actor){if(!e.jump(e.active))throw Error('60 actual jump rejected');}
    else throw Error('60 unsupported core action');
    if(!armed&&souls.some((u,i)=>u.x!==start_s[i]))throw Error('60 automatic guide is invalid');
   }
  }
  const finalPlayers=players(), final=finalPlayers.map(u=>({state:row(u),x:u.x,y:u.y,grounded:e.grounded(u),support:e.contactSurface(u.x,u.y-4,u.y+5)?.t.id}));
  const walked=souls.map((u,i)=>({id:u.id,x:u.x,delta:u.x-start_s[i],grounded:e.grounded(u)}));
  return {phase:b.phase,round:b.round,ticks,moves,start,final,walked,seen,shot:b.shot};
 })();
 return Object.freeze({next(ack){return run.next(ack);}});
}
