// Disposable browser replay: all simulated mechanics come from the actual App.
(tape)=>{
 const app=HonroApp,e=app.engine,b=e.b,dt=1/tape.clock;
 if(tape.schema!=='honro-stage58-native-input-tape/v1'||b.honroStage!==58||b.phase!=='aim'||b.round!==1||!(e instanceof HONRO_CORE.Engine))throw Error('Wrong Stage58');
 const live=()=>b.units.filter(u=>u.side===0&&!u.summoned).map(u=>({id:u.id,hp:u.hp,focus:u.focus,loadout:u.loadout,x:u.x,y:u.y}));
 if(JSON.stringify(live())!==JSON.stringify(tape.start.actors))throw Error('58 live carried actors differ from exact recorded route: '+JSON.stringify(live()));
 let ticks=0,fired=0,actions=[];
 const run=(function*(){
  for(const c of tape.commands){
   if(c.tick!==ticks||c.round!==b.round||c.actor!==(e.active?.id??null))throw Error('58 driver drift: '+JSON.stringify([c,b.phase,ticks,b.round,e.active?.id]));
   if(c.op==='step'){
    if(!Number.isInteger(c.n)||c.n<1||c.n>10000||![-1,0,1].includes(c.dir))throw Error('58 signed motion invalid');
    for(let i=0;i<c.n;i++){ticks++;if(c.dir)e.move(c.dir,dt);e.tick(dt);app.missionTick(dt);}
    continue;
   }
   let ok=false;
   if(c.op==='select')ok=e.select(...c.args);
   if(c.op==='wait'){e.wait();ok=true;}
   if(c.op==='fire'){ok=e.fire(...c.args);if(ok)fired++;}
   if(c.op==='interact'||c.op==='noncombatReturn'){
    ok=yield {kind:c.op,id:c.id??null,actor:c.actor,round:c.round,tick:c.tick};
    if(ok)actions.push({kind:c.op,id:c.id??null,actor:c.actor,round:c.round,tick:c.tick});
   }
   if(!ok)throw Error('58 consumed illegal action '+JSON.stringify([c,b.phase]));
  }
  return {round:b.round,phase:b.phase,ticks,fired,actions,boss:e.unit('a6-c08-boss')?.hp,node:e.unit('a6-c08-expansion-node')?.hp,
    allies:live().map(row=>({...row,grounded:e.grounded(e.unit(row.id))})),flags:{stake:b.honroState.flags['place(correctedInnerStake)'],returned:b.honroState.flags.localFourBodyExit}};
 })();
 return Object.freeze({next(ok){if(app.engine!==e)throw Error('58 App lost its exact Engine');return run.next(ok);}});
}
