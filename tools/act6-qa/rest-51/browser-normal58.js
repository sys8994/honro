(tape)=>{
const G=globalThis,a=G.HonroApp,e=a.engine,b=e.b,C=G.HONRO_CORE;
const assert=(q,m='native assertion failed')=>{if(!q)throw Error(m);};
assert.equal=(x,y,m)=>assert(x===y,m??JSON.stringify([x,y]));
const node=()=>a.root.querySelector('[data-act6-qa-lookout]');
const state=()=>JSON.parse(node().dataset.act6LateState||'null');
const units=()=>b.units.filter(u=>!u.summoned).map(u=>[u.id,u.hp,u.focus,u.shield,u.x,u.y]);
const actual=()=>{if(a.engine!==e)throw Error('wrong native Engine');};
const ui=(id,kind='context')=>({kind,id,actor:e.active?.id,round:b.round,x:e.active?.x,y:e.active?.y});

assert(b.honroStage===58&&b.round===1&&b.phase==='aim'&&!e.unit('a6-c08-boss')&&!e.unit('a6-c08-expansion-node'));
return (function*(){const entry=units(),trace=[];let totalTicks=0;a.missionTick(1/120);
 function tick(){totalTicks++;a.missionTick(1/120);}
  for(const c of tape.commands){
   if(c.round>=4 || c.tick>=4430)break;
   if(c.op==='step'){for(let i=0;i<c.n;i++){if(c.dir)e.move(c.dir,1/tape.clock);e.tick(1/tape.clock);tick();}continue;}
   assert.equal(e.active?.id,c.actor,JSON.stringify(c));
   let ok;
   if(c.op==='select')ok=e.select(...c.args);
   else if(c.op==='fire')ok=e.fire(...c.args);
   else if(c.op==='wait'){e.wait();ok=true;}
   else if(c.op==='interact')ok=yield ui(c.id);
   else if(c.op==='noncombatReturn')ok=(yield ui(null,'return'));
   trace.push([c,ok,b.phase,b.round,units()]);
   assert(ok,JSON.stringify(c));
  }
  const dt=1/120;let ticks=0;const max=40000;
  const step=(dir=0)=>{if(++ticks>max)throw Error('adapted turn exhausted');if(dir)e.move(dir,dt);e.tick(dt);tick();};
  const aim=()=>{for(let i=0;i<3600&&b.phase!=='won'&&!(b.phase==='aim'&&b.side===0);i++)step();};
  const move=x=>{let a=e.active;for(let i=0;i<1800&&Math.abs(a.x-x)>5&&a.moveLeft>0&&b.phase==='aim'&&b.side===0;i++)step(Math.sign(x-a.x));for(let i=0;i<120&&!e.grounded(a)&&b.phase==='aim';i++)step();};
  const shoot=(id,skill)=>{
   const u=e.active,target=e.unit(id);if(!u.loadout.includes(skill)||!target||target.dead)return false;
   const face=target.x>=u.x?0:180;const aim=[];
   for(const delta of [0,5,-5,10,-10,15,-15,20,-20,25,-25,30,-30,40,-40,50,-50,60,-60,70,-70,80,-80])for(const p of [.18,.30,.38,.44,.52,.58,.62,.66,.74,.82,.9,.98]){
    const a=face+delta,v=e.predict(u,C.SKILLS[skill],a,p,target,false);
    if((v?.unit?.id??v?.unit)===id)aim.push([a,p]);
   }
   if(!aim.length)return false;
   const [angle,power]=aim[0];const ok=e.fire(skill,angle,power);
   trace.push(['adaptive-fire',b.round,u.id,skill,id,angle,power,ok]);return ok;
  };
  const visited=new Set(entry.filter(r=>r[4]>3705).map(r=>r[0]));
  for(const c of trace){if(Array.isArray(c[3]))for(const v of c[3])if(v[4]>3705)visited.add(v[0]);}
  for(let loops=0;loops<80&&b.phase!=='won'&&b.phase!=='lost';loops++){
   aim();if(b.phase!=='aim'||b.side!==0)continue;
   const u=e.active, x=u?.x;if(!u)break;
   const f=state().flags;let used=false;
   if(f.bossDead&&f.nodeDead){
    if(u.cls==='mage'&&!f.stake){move(3680);used=(yield ui('stake'));trace.push(['stake',used,u.x]);}
    if(!visited.has(u.id)){move(3790);if(u.x>3705&&e.grounded(u))visited.add(u.id);}
    if(visited.has(u.id)&&state().flags.stake)move({mage:3500,archer:3380,knight:3330,occultist:3440}[u.cls]);
    if(b.phase!=='won'){assert((yield ui(null,'return')));trace.push(['native-noncombat',b.round,u.id,x,u.x]);}
    continue;
   }
   if(u.cls==='occultist'&&f.phase!==2&&!f.nodeDead&&!b.honroState.flags.localLedgerCounterSpent){move(4464);used=(yield ui('ledger'));trace.push(['counter',used,u.x]);}
   if(u.x<3800)move({mage:4140,archer:4090,knight:4230,occultist:4400}[u.cls]);
   if(u.x>3705&&e.grounded(u))visited.add(u.id);
   const picks=u.cls==='mage'?['M01']:u.cls==='archer'?['A01']:u.cls==='occultist'?['O01']:['S00'];
   // Keep the manifested boss alive until actual phase-3 node pressure can be read.
   const order=f.bossDead?[1]:f.nodeDead?[0]:state().phase===3?[1,0]:[0];
   let fired=order.some(i=>picks.some(s=>shoot(['a6-c08-boss','a6-c08-expansion-node'][i],s)));
   if(!fired)e.wait();
   trace.push(['native-turn',b.round,u.id,used,fired,x,u.x,units()]);
  }


actual();assert.equal(b.phase,'won');
const boss=e.unit('a6-c08-boss'),n=e.unit('a6-c08-expansion-node');
assert(boss?.dead&&boss.hp===0&&n?.dead&&n.hp===0&&b.honroState.flags['place(correctedInnerStake)']&&b.honroState.flags.localFourBodyExit);
return {round:b.round,phase:b.phase,ticks:totalTicks,entry,exit:units(),boss:boss.hp,node:n.hp,ground:b.units.filter(u=>u.side===0).every(u=>e.grounded(u)),trace};
})();}