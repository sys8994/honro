([quiet,expectedCrew])=>{
// Only calls real engine controls; no stored actors, flags, phase, recovery or saves.
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const insist=(p,m)=>{if(!p)throw Error(m);};
function* driveWarmStage60({app,engine:e=app?.engine,owner,quiet,authoredId='stage-60',clock=120,step,expectedCrew,finish,captureSchedule=false}={}){
 const b=e?.b,dt=1/clock;
 insist(b&&app.engine===e&&app.stageId===60&&b.honroStage===60&&b.honroAuthoredId===authoredId&&b.mode==='campaign'&&b.phase==='aim'&&b.side===0&&b.round===1,'foreign 60 mode/entry');
 insist((clock===60||clock===120)&&quiet?.support==='return-cutout-near-body'&&quiet.start?.length===4&&quiet.souls?.length===2&&typeof owner?.interact==='function'&&typeof owner?.tick==='function'&&typeof owner?.project==='function','invalid warm route API');
 const all=b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAlly&&!u.honroCivilian);
 const row=u=>({id:u.id,cls:u.cls,hp:u.hp,maxHp:u.maxHp,focus:u.focus,shield:u.shield,loadout:u.loadout,equipmentState:u.equipmentState});
 const pinRoster=()=>all.every(u=>e.unit(u.id)===u);
 const can=()=>b.phase!=='won'&&b.phase!=='lost'&&e.canAct();
 const souls=quiet.souls.map(q=>e.unit(q.id));
 const support=u=>e.contactSurface(u.x,u.y-4,u.y+5)?.t.id;
 const combat=()=>b.units.some(u=>u.side===1)||e.combatEnemies().length>0;
 insist(all.length===4&&new Set(all.map(u=>u.id)).size===4&&all.every(u=>u.hp>0&&!u.dead&&e.grounded(u))&&pinRoster()&&!combat()&&b.shot===0,'59 carried bodies or peaceful 60 scene mismatch');
 for(const q of quiet.start){
  const u=all.find(v=>v.cls===q.cls),prev=expectedCrew?.[q.cls];
  insist(u&&Math.abs(u.x-q.x)<.001&&Math.abs(u.y-q.y)<.001&&(!expectedCrew||['id','cls','hp','maxHp','focus','shield','loadout','equipmentState'].every(k=>eq(u[k],prev?.[k]))),'crew/seat mismatch '+q.cls);
 }
 insist(souls.every((u,i)=>u&&u.side===2&&u.hp>0&&e.grounded(u)&&Math.abs(u.x-quiet.souls[i].from)<.001&&all.every(a=>!e.attackAllows(u,a.id))),'two physical protected souls missing');
 const profile=JSON.stringify(app.profile),start=structuredClone(all.map(row)),sx=souls.map(u=>u.x), events=[], jumps=[],walk={}, focus=[];
 const schedule=[];
 const input=(op,args=[])=>{
  if(!captureSchedule)return;
  const last=schedule.at(-1),actor=e.active?.id??null,round=b.round;
  if((op==='tick'||op==='move')&&last?.op===op&&last.actor===actor&&last.round===round&&eq(last.args,args)){last.n++;return;}
  schedule.push({op,args,actor,round,n:1});
 };
 let ticks=0,turnMoves=0,armed=false,moves=0,guideAccepted=null;
 const targetByRole={archer:2060,knight:2090,occultist:2110,mage:2080};
 const escortDone=()=>souls.every((u,i)=>u.x>=quiet.souls[i].to-9&&e.grounded(u)&&support(u)===quiet.support);
 const stepDefault=()=>{owner.tick(dt);e.tick(dt);if(b.phase==='aim'&&b.side===0)e.checkEnd();};
 const tick=()=>{
  insist(++ticks<=90000&&app.engine===e&&pinRoster()&&!combat()&&b.shot===0,'60 driver broke peaceful authority');
  input('tick');
  if(step)step({e,owner,dt,tick:ticks});else stepDefault();
 };
 const command=function*(id){return yield {kind:id,actor:e.active.id};};
 const guide=function*(u){
  if(!armed&&!escortDone()&&['mage','occultist'].includes(u.cls)&&e.grounded(u)&&support(u)===quiet.support&&Math.hypot(u.x-souls[0].x,u.y-souls[0].y)<225&&(yield* command('guide'))){
   input('interact',['guide']);armed=true;guideAccepted={actor:u.id,tick:ticks,round:b.round,x:u.x,y:u.y,support:support(u),grounded:e.grounded(u)};
   events.push({op:'guide',...guideAccepted});
  }
 };
 insist(!owner.project()?.complete,'precompleted peace route');
 for(let i=0;i<30;i++)tick();
 insist(souls.every((u,i)=>u.x===sx[i]),'souls walked before a real guide');
 for(let i=0;i<75&&b.phase!=='won';i++){
  for(let j=0;j<2400&&!can()&&b.phase!=='won';j++)tick();
  if(b.phase==='won')break;
  insist(can(),'no live player turn');
  const u=e.active;
  const t=u.cls==='occultist'&&!escortDone()?Math.min(quiet.souls[0].to,souls[0].x+105):targetByRole[u.cls]*b.width/2172;
  insist(Number.isFinite(t),'unknown body role');
  let stalls=0;
  const dir=Math.sign(t-u.x),before=u.x;
  for(let j=0;j<1600&&b.phase==='aim'&&u.moveLeft>15&&dir*(t-u.x)>2;j++){
   if(stalls>18&&e.grounded(u)){
    const f0=u.focus;
    if(e.jump(u)){input('jump',[u.id]);stalls=0;jumps.push({actor:u.id,tick:ticks,before:f0,after:u.focus});}
   }
   const x=u.x;input('move',[dir]);e.move(dir,dt);moves++;yield* guide(u);tick();stalls=Math.abs(u.x-x)<.05?stalls+1:0;
  }
  walk[u.cls]=(walk[u.cls]??0)+Math.abs(u.x-before);
  yield* guide(u);
  if(u.cls==='occultist'&&!escortDone()&&Math.hypot(u.x-souls[0].x,u.y-souls[0].y)<225)
   for(let j=0;j<800&&!escortDone()&&souls[0].x<u.x+160&&b.phase==='aim';j++)tick();
  if(can()){
   input('interact',['end-walk']);
   insist((yield* command('end-walk')),'native noncombat move end denied');
   events.push({op:'end-walk',actor:u.id,tick:ticks,round:b.round});
   turnMoves++;
  }
 }
 insist(b.phase==='won'&&escortDone()&&armed&&guideAccepted.grounded&&pinRoster(),'60 physical objective incomplete');
 const end=all.map(row);
 for(const [i,u] of all.entries()){
  insist(e.grounded(u)&&support(u)===quiet.support&&Math.abs(u.x-quiet.gate)<=182,'hero not physically at gate');
  insist(['id','cls','hp','maxHp','shield','loadout','equipmentState'].every(k=>k==='equipmentState'?eq(u[k]?.version,start[i][k]?.version):eq(u[k],start[i][k])),'hero identity/vitals rewrote');
  if(u.focus!==start[i].focus)focus.push({actor:u.id,before:start[i].focus,after:u.focus});
 }
 insist(JSON.stringify(app.profile)===profile&&!combat()&&b.shot===0,'combat/reward/profile mutation during walk');
 const escort=souls.map((u,i)=>({id:u.id,x:u.x,y:u.y,walked:u.x-sx[i],grounded:e.grounded(u)}));
 insist(escort.every(u=>u.walked>300),'shortened or fake soul walk');
 const outcome=finish?.();
 if(finish)insist(outcome?.stage===60&&outcome.won===true&&outcome.settlement===false&&outcome.flags?.['act6.lastSoulsGuided']===true&&outcome.flags?.['act6.endingStarted']===true,'owner did not issue actual ending capability');
 return {clock,ticks,round:b.round,moves,turnMoves,start,end,escort,guideAccepted,events,jumps,focus,walk,shot:b.shot,outcome,...(captureSchedule?{schedule}: {})};
}

const app=HonroApp,e=app.engine;
const owner={interact(){},tick(dt){app.missionTick(dt);},project:()=>({complete:!!e.b.honroState.flags.localAct6QuietExitVerified})};
return driveWarmStage60({app,engine:e,owner,quiet,expectedCrew,step:({owner,e,dt})=>{owner.tick(dt);e.tick(dt);}});
}
