// Playwright QA-only commands; no production import or stored state setters.
(tape)=>{
 const app=HonroApp,e=app.engine,b=e?.b;
 const actors=()=>b.units.filter(u=>u.side===0&&!u.summoned).map(u=>({id:u.id,cls:u.cls,hp:u.hp,focus:u.focus,shield:u.shield,loadout:u.loadout,x:u.x,y:u.y}));
 const j=JSON.stringify, first={actors:actors(),phase:b.phase,round:b.round,active:e.active?.id,shot:b.shot,wind:b.wind};
 if(!(e instanceof HONRO_CORE.Engine)||app.stageId!==59||b.honroStage!==59||b.mode!=='act6-isolated'||b.honroMapOrigin!=='act6-qa'||b.honroAuthoredId!=='stage-59'||j(first)!==j(tape.start))throw Error('59 actual entry mismatch '+j(first));
 const explicit=tape.commands.filter(c=>c.op==='interact'), seen=[];
 const gen=driveNative(HONRO_CORE.Engine,e,tape,{trusted:r=>r===tape,stage:()=>app.stageId,engine:()=>app.engine,
  tick(dt){e.tick(dt);app.missionTick(dt);if(b.phase==='aim'&&b.side===0)e.checkEnd();}});
 let interaction=0, pending=null, result=null;
 function inspect(){
  const g=b.honroState.localReturnGuardAftermath,t=e.unit('qa-immediate-bridge-threat');
  return {phase:b.phase,round:b.round,trace:result,actors:actors().map(u=>({...u,grounded:e.grounded(e.unit(u.id))})),
   shots:b.shot,liveEnemies:b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).length,seen:seen.slice(),guard:g,
   threat:{hp:t?.hp,dead:t?.dead,grounded:t?e.grounded(t):false,x:t?.x,spawnDelta:t?t.x-1120*7800/2172:null,retreat:b.honroState.localFinaleWardenRetreat??null}};
 }
 return Object.freeze({
  next(accepted){
   if(app.engine!==e||result)throw Error('59 App changed engine or test ended');
   if(pending){seen.push({...pending,accepted});pending=null;}
   let reply=accepted;
   for(;;){
    const y=gen.next(reply);
    if(y.done){result=y.value;return {done:true,value:inspect()};}
    if(y.value.kind==='select'){reply=e.select(y.value.id);continue;}
    if(y.value.kind!=='interact'||!['markSoulPath','activateGarmjin'].includes(y.value.id))throw Error('Unexpected 59 action '+j(y.value));
    const authored=explicit[interaction++];
    if(!authored||authored.args[0]!==y.value.id||typeof authored.accepted!=='boolean')throw Error('59 tape command/provenance mismatch');
    pending={...y.value,wanted:authored.accepted,actor:e.active?.id,round:b.round};
    return {done:false,value:pending};
   }
  }});
}
