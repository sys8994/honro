/** Separately labelled calibration only. Never applies to frozen cohort names. */
export function calibratePositioningV2(source,stage,policy){
 if(!policy.includes('calibrated-v2'))return source;
 if(![3,6].includes(stage))throw Error('V2 calibration only registered for3/6');
 // Rank on a detached production engine, including all prediction cache writes.
 source=source.replace('function aim(arg){const u=arg||e.active;let best=null;',"function aim(arg){const live=a.engine,before=JSON.stringify(live.b),e=new C.Engine(JSON.parse(before)),u=e.unit((arg||live.active).id);let best=null;");
 source=source.replace('return best;}','if(JSON.stringify(live.b)!==before)throw Error(\'Detached aim changed live battle\');return best;}');
 if(stage===3){
  source=source.replace("&&poses.some(p=>p.actor==='p-archer'&&p.goal===5550)",'');
  if(policy.includes('airborne-v5'))source=source.replace('if(st.jumping){',"if(!e.grounded(u)){const landing=st.jumping?.x??p.jumpTo??p.x;if(u.moveLeft>8&&Math.abs(landing-u.x)>5)e.move(Math.sign(landing-u.x),C.STEP);step();continue;}if(st.jumping){");
  if(policy.includes('landing-v7'))source=source.replace('if(e.jump(u))st.still=0;',"if(e.jump(u)){st.still=0;if(p.jumpTo)st.jumping={x:p.jumpTo,at:ticks};}");
  return source;
 }
 // Keep one companion on the rescue/exit path; the other two focus the actual
 // midboss rather than clearing whichever unrelated unit has highest net damage.
 const scout=policy.startsWith('cover')?'mage':'knight';
 source=source.replace('let best=null;const targets=',"let best=null;const car=e.unit('objective'),priority=v=>v.id==='midboss-stage6'?900:car&&Math.hypot(v.x-car.x,v.y-car.y)<650?350:0;const targets=")
 .replace('Math.hypot(v.x-u.x,v.y-u.y)-Math.hypot(w.x-u.x,w.y-u.y)','Math.hypot(v.x-u.x,v.y-u.y)-priority(v)*4-Math.hypot(w.x-u.x,w.y-u.y)+priority(w)*4')
 .replaceAll('skill.damage>best.net','skill.damage+priority(v)>best.net').replaceAll('net:skill.damage','net:skill.damage+priority(v)')
 .replaceAll('z.net>best.net','z.net+priority(v)>best.net').replaceAll('net:z.net','net:z.net+priority(v)');
 source=source.replace(/if\(e.grounded\(u\)&&\(u.moveLeft<150\|\|e.alive\(1\).some\(v=>Math.hypot\(v.x-u.x,v.y-u.y\)<\d+\)\)\)/,"if(e.grounded(u)&&u.moveLeft<150)");
 source=source.replace('if(Math.abs(u.x-p.x)<12&&e.grounded(u)){',`const boss=e.unit('midboss-stage6');if(boss&&!boss.dead&&u.cls!=='${scout}'&&u.x>3100&&Math.abs(u.y-boss.y)<250&&e.grounded(u)){const goal=Math.max(3100,Math.min(4020,boss.x-(u.cls==='knight'?80:430)));if(Math.abs(u.x-goal)>30&&u.moveLeft>150&&st.still<30){const old=u.x;e.move(Math.sign(goal-u.x),C.STEP);step();st.still=Math.abs(u.x-old)<.01?st.still+1:0;continue;}const shot=aim(u);if(shot&&e.fire(shot.id,shot.p.angle,shot.p.power)){log.push({op:'fire',actor:u.id,round:b.round,target:shot.v.id,skill:shot.id});step();continue;}}
   if(st.still>30&&e.grounded(u)&&u.moveLeft<e.jumpCost(u)+Math.abs((p.jumpTo??p.x)-u.x)+40){a.defend();st.still=0;step();continue;}
   if(Math.abs(u.x-p.x)<12&&e.grounded(u)){`);
 source=source.replaceAll('u.moveLeft<400','u.moveLeft<e.jumpCost(u)+Math.abs(p.jumpTo-u.x)+40');
 return source;
}
