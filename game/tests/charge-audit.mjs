import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {runtime,battlefield,gameRoot} from './helpers.mjs';
const g=await runtime(),C=g.HONRO_CORE,rows=[];
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const {e}=battlefield(g,8),skills=Object.values(C.SKILLS).filter(s=>!s.passive&&!s.id.startsWith('H'));
for(const s of skills){
 const original=C.makeUnit(s.cls,0,500,500,{id:'charge-probe'});
 for(const tune of [0,.5,1]){
  const u={...structuredClone(original),tune},full=805*e.effective(s,u).speed,duration=e.chargeDuration(u,s);
  assert.ok(duration>0&&duration<=5);near(duration,full/480); // Current skills preserve their authored maximum reach.
  for(const seconds of [0,.1,.5,1,2,5,20]){
   const power=e.chargePower(u,s,seconds),v=e.velocity(u,s,35,power);
   near(Math.hypot(v.vx,v.vy),Math.min(seconds*480,full));assert.ok(power>=0&&power<=1);
  }
  rows.push({id:s.id,cls:s.cls,tune,secondsToFull:duration,maxSpeed:full});
 }
}
// Future extreme-range skills still obey the global 5-second ceiling and one acceleration.
const u=e.active,extreme={...C.SKILLS.A01,speed:20};near(e.chargeDuration(u,extreme),5);near(Math.hypot(...Object.values(e.velocity(u,extreme,0,1))),2400);
// Prediction and actual projectile launch share the same zero-to-full power mapping.
const actual=[];
for(const [cls,id] of [['archer','A01'],['mage','M01'],['knight','S01'],['occultist','O01']]){
 for(const seconds of [0,.1,1]){
  const {e,b}=battlefield(g,8),u=C.makeUnit(cls,0,e.active.x,e.active.y,{id:'charge-probe'}),s=C.SKILLS[id];b.units.push(u);
  b.mode='practice';b.active=u.id;b.side=0;b.phase='aim';u.loadout=[id];u.focus=99999;u.cooldowns={};
  const power=e.chargePower(u,s,seconds),origin=e.origin(u,45),predicted=e.predict(u,s,45,power);
  assert.ok(predicted&&Number.isFinite(predicted.x)&&Number.isFinite(predicted.y));
  assert.ok(e.fire(id,45,power,true),id);const p=b.projectiles[0],expected=e.velocity(u,s,45,power);
  near(p.vx,expected.vx);near(p.vy,expected.vy);near(b.lastShots[u.id].power,power);
  actual.push({cls,seconds,power,speed:Math.hypot(p.vx,p.vy),origin,prediction:{x:predicted.x,y:predicted.y}});
 }
}
// Enemy aim search uses percentages, never player hold time. Its old calibration is preserved.
const enemy=e.alive(1)[0];for(const power of [.08,.3,.7,1]){const s=C.SKILLS[enemy.loadout[0]],v=e.velocity(enemy,s,12,power);near(Math.hypot(v.vx,v.vy),(270+535*power)*e.effective(s,enemy).speed);}
await writeFile(path.join(gameRoot,'reports/charge-audit.json'),JSON.stringify({acceleration:480,maxSeconds:5,skillTuneCases:rows.length,minSeconds:Math.min(...rows.map(r=>r.secondsToFull)),maxSecondsCurrent:Math.max(...rows.map(r=>r.secondsToFull)),rows,actual},null,2)+'\n');
console.log(`${rows.length} skill/tune profiles, 12 actual launches and enemy calibration passed`);
