([tape,negative=false])=>{
const G=globalThis,a=G.HonroApp,e=a.engine,b=e.b,C=G.HONRO_CORE;
const assert=(q,m='native assertion failed')=>{if(!q)throw Error(m);};
assert.equal=(x,y,m)=>assert(x===y,m??JSON.stringify([x,y]));
const node=()=>a.root.querySelector('[data-act6-qa-lookout]');
const state=()=>JSON.parse(node().dataset.act6LateState||'null');
const units=()=>b.units.filter(u=>!u.summoned).map(u=>[u.id,u.hp,u.focus,u.shield,u.x,u.y]);
const actual=()=>{if(a.engine!==e)throw Error('wrong native Engine');};
const ui=(id,kind='context')=>({kind,id,actor:e.active?.id,round:b.round,x:e.active?.x,y:e.active?.y});

assert(b.honroStage===59&&b.round===1&&b.phase==='aim');
const warden=e.unit('qa-immediate-bridge-threat');assert(warden?.level===25&&warden.hp===2292&&e.grounded(warden));
return (function*(){const entry=units(),trace=[];let ticks=0;
 const dt=1/120;
 const tick=()=>{e.tick(dt);ticks++;a.missionTick(dt);};
 const pose=()=>[b.phase,b.round,e.active?.id,e.active?.x,e.active?.y,e.active&&e.grounded(e.active)];
 const aim=()=>{for(let i=0;i<2400&&b.phase!=='won'&&!(b.phase==='aim'&&b.side===0);i++)tick();};

  assert.equal((yield ui('activateGarmjin')),false);
  for(const c of tape.commands){
   if(b.phase==='won')break;
   let ok;
   if(c.op==='tick')for(let i=0;i<c.times;i++)tick();
   else if(c.op==='move')for(let j=0;j<c.times;j++)e.move(...c.args);
   else{
    aim();if(b.phase==='won')break;
    if(c.before&&e.active?.id!==c.before.id){const selected=e.select(c.before.id);if(!selected&&c.op!=='select'&&c.op!=='wait')throw Error('actor turn drift '+JSON.stringify([c,pose()]));}
    if(c.op==='interact'){
     if(c.args[0]==='activateGarmjin'&&c.accepted&&e.active.cls==='occultist'){
      const goal=1755*b.width/2172;
      for(let n=0;n<400&&Math.abs(e.active.x-goal)>12&&e.active.moveLeft>0;n++){e.move(Math.sign(goal-e.active.x),dt);tick();}
      for(let n=0;n<240&&!e.grounded(e.active);n++)tick();
     }
     a.missionTick(0);ok=yield ui(c.args[0]);
    }
    else if(c.op==='wait'){e.wait();ok=null;}
    else if(c.op==='jump'){
      const u=e.unit(c.args[0]);if(c.accepted&&u.cls==='occultist'&&state().states.soul){
       for(let n=0;n<180&&!e.grounded(u);n++)tick();
      }
      ok=e.jump(u);
    }
    else if(['select','fire'].includes(c.op)){if(negative&&c.op==='fire'&&c.args[0]==='S00'){assert.equal(e.active.id,'p-knight');const prior=b.shot;e.wait();assert.equal(b.shot,prior);ok=true;}else ok=e[c.op](...c.args);}
    else throw Error(c.op);
    trace.push([c.op,c.args,ok,pose(),state()?.states]); 
    if(typeof c.accepted==='boolean'&&ok!==c.accepted&&c.op!=='select')throw Error('native op drift '+JSON.stringify([...trace.at(-1),c.before]));
   }
  }

  aim();
actual();if(negative){assert(b.phase!=='won'&&state().states.activated&&!state().states.cleared);assert(Math.abs(warden.x-entry.find(r=>r[0]===warden.id)[4])>=260);}
else assert.equal(b.phase,'won');
return {round:b.round,phase:b.phase,ticks,entry,exit:units(),warden:{id:warden.id,hp:warden.hp,x:warden.x,grounded:e.grounded(warden)},states:state().states,trace};
})();}