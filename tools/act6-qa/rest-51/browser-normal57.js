(function* replay57(prior){
 const G=globalThis,app=G.HonroApp;
 const assert=(yes,msg='stage57 native replay assertion failed')=>{if(!yes)throw Error(msg);};
 assert.equal=(a,b,msg)=>assert(a===b,msg??JSON.stringify([a,b]));
 assert.deepEqual=(a,b,msg)=>assert(JSON.stringify(a)===JSON.stringify(b),msg??JSON.stringify([a,b]));
 const read=()=>{const root=app.root,node=root.querySelector('[data-act6-qa-lookout]'),alt=root.querySelector('[data-act6-qa-alt]'),phase=app.engine.b.phase;
   return {complete:phase==='won',failed:phase==='lost',summary:node?.textContent,appActions:{mission:node?.dataset.act6Mission||null,alt:alt&&!alt.hidden?'splitRepair':null}};};
 const e=app.engine,b=e.b,dt=1/120,phase=()=>b.phase,allowed=()=>b.side===0&&e.canAct(),moves=[],actions=[];let ticks=0;
 const step=()=>{e.tick(dt);app.missionTick(dt);ticks++;},info=read,j=x=>JSON.stringify(x);
 const roles=['archer','knight','occultist'];
 const heroes=roles.map(cls=>b.units.find(x=>x.side===0&&x.cls===cls));
 assert(heroes.every(Boolean));
 const alive=()=>b.units.filter(x=>x.side===0&&!x.summoned);
 const select=(actor)=>{
  for(let i=0;i<8000;i++){
   if(['won','lost'].includes(phase()))return false;
   if(allowed()){if(e.active===actor&&!actor.acted)return true;if(!actor.acted&&e.select(actor.id))return true;e.wait();}
   step();
  }return false;
 };
 const wait=()=>{assert(allowed());e.wait();for(let i=0;i<2000&&!allowed()&&!['won','lost'].includes(phase());i++)step();assert(allowed());};
 function walk(actor,to,tolerance=3){
  assert(select(actor),'select '+actor.id);
  if(tolerance===3){
   let stalled=0,last=actor.x,sign=Math.sign(to-actor.x);
   for(let i=0;i<2400&&sign*(to-actor.x)>3;i++){
    if(['won','lost'].includes(phase()))break;
    assert(!actor.dead&&actor.hp>0);
    if(!allowed()||e.active!==actor){assert(select(actor));continue;}
    if(actor.moveLeft<16&&e.grounded(actor)){wait();assert(select(actor));continue;}
    e.move(sign,dt);step();stalled=Math.abs(last-actor.x)<.01?stalled+1:0;last=actor.x;
    assert(stalled<150,'stock path blocked '+j([actor.cls,actor.x,actor.y,to,phase()]));
   }
  }else{
   let stuck=0,jumps=0;
   for(let i=0;i<8000;i++){
    if(e.grounded(actor)&&Math.abs(to-actor.x)<tolerance||phase()==='won')break;
    if(!allowed()||e.active!==actor||actor.moveLeft<14&&e.grounded(actor)){if(allowed()&&e.active===actor)e.wait();assert(select(actor),j({stage:b.honroStage,phase:phase(),target:actor.id,to,units:b.units.map(u=>[u.id,u.side,u.hp,u.x,u.y,u.acted]),round:b.round,side:b.side,active:b.active,flags:b.honroState.flags,goal:info(),ward:b.terrain.find(t=>t.id==='a6-c07-stationary-stone-ward')?.hp,actions,moves}));}
    if(stuck>=6&&e.grounded(actor)&&e.jump(actor)){jumps++;stuck=0;}
    const x=actor.x;e.move(Math.sign(to-actor.x),dt);step();stuck=Math.abs(x-actor.x)<.04?stuck+1:0;
    assert(jumps<=30,'stock return path blocked');
   }
  }
  moves.push({id:actor.id,x:actor.x,y:actor.y,to,round:b.round,ground:e.grounded(actor),phase:phase()});
  assert(e.grounded(actor)&&(Math.abs(actor.x-to)<Math.max(20,tolerance)||phase()==='won'),'bad walk '+j(moves.at(-1)));
 }
 function* action(expected,accept){
  const before=info()?.appActions?.mission??null;
  assert.equal(before,expected,j(info()));const prior=phase();yield {kind:'interact',id:expected,wanted:accept,x:e.active.x,y:e.active.y,role:e.active.id};step();
  const after=info()?.appActions?.mission??null,observed=after!==before||prior!==phase();
  actions.push({id:expected,actor:e.active?.id,accepted:observed,phase:phase(),tick:ticks});
  assert.equal(observed,accept,j({after,before,info:info(),actor:e.active?.id,round:b.round}));
 }
 const [A,K,O]=heroes;
 assert.deepEqual(Array.from(heroes,x=>x.hp),roles.map(k=>prior.boundary.fullOuter[k].hp));assert(!alive().some(u=>u.cls==='mage'));
 app.missionTick(dt);assert(info().complete===false&&e.b.honroState.flags['act6.firstGarmjinFailed']);
 yield* action('warnBell',false);
 walk(O,5016);yield* action('warnBell',true);yield* action('repairRelay',false);
 wait();walk(A,2968);wait();yield* action('repairRelay',false);
 walk(K,3376);yield* action('repairRelay',false);wait();
 assert(select(O));const relay=b.terrain.find(t=>t.id==='a6-c07-protective-relay');
 assert(relay.hp<relay.maxHp&&!relay.broken,j({relay,actions,moves,role:e.active?.id,round:b.round}));
 const ward=b.terrain.find(t=>t.id==='a6-c07-stationary-stone-ward'),priorWard=ward.hp;
 assert(info().appActions.alt==='splitRepair');
 yield {kind:'alternative',id:'splitRepair',wanted:true,role:e.active.id,x:e.active.x,y:e.active.y};step();assert(b.honroState.flags.bellSiteEmergencyStabilized&&ward.hp>priorWard);
 actions.push({id:'splitRepair',actor:O.id,accepted:true,ward:[priorWard,ward.hp],tick:ticks});
 assert(select(K));yield* action('warnRailing',true);
 const gate=b.terrain.find(t=>t.id==='a6-c07-railing');
 assert(!gate.broken);yield* action('openRetreat',false);
 for(let i=0;i<100;i++)step();
 walk(K,3344);yield* action('openRetreat',false);
 walk(K,3376);yield* action('openRetreat',true);assert(gate.broken);
 walk(O,1992);yield* action('moveRelayToFallback',true);walk(K,1968);walk(A,1968);step();
 assert(b.honroState.flags['act6.fallbackRelaySecured']&&b.phase==='aim'&&!info().complete);
 assert(select(A));yield* action('assistKeeper',true);
 const keeper=e.unit('local-07-gwakjin-return-keeper');assert(keeper);
 walk(keeper,2028,15);yield* action('receiveKeeperWatch',true);assert.equal(keeper.side,2);
 for(const wp of [2600,3200,3600,4420,4990,5280])for(const u of heroes)walk(u,wp,15);
 assert(info().complete===false);yield* action('reuniteAtWard',true);
 const mage=e.unit('p-mage');
 assert(mage?.hp===prior.boundary.fullMage.hp&&mage.equipmentState.version===1);
 assert(b.honroState.flags['act6.local.07.bridge-v3.open']);
 const all=[...heroes,mage];
 for(const wp of [5500,5760,5835])for(const u of all)walk(u,wp,15);
 for(const [role,dst] of [['occultist',6200],['knight',6090],['mage',5992],['archer',5872]])walk(all.find(u=>u.cls===role),dst,15);
 assert(b.phase==='won'&&info()?.complete,j({moves,actions,goal:info(),phase:b.phase}));
 assert(alive().length===4&&!alive().includes(keeper)&&e.b.units.some(u=>u.side===1&&!u.dead));
 return {ticks,round:b.round,phase:b.phase,actions,moves,flags:b.honroState.flags,crew:all.map(u=>[u.id,u.cls,u.hp,u.focus,u.x,u.y,e.grounded(u),u.equipmentState]),retainedHostiles:b.units.filter(u=>u.side===1&&!u.dead).map(u=>u.id)};
})
