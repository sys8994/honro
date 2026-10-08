/** Actual authored terrain, controlled pre-crossing poses. No enemy combat is claimed. */
import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),P=g.HonroStakeCrossing,C=g.HONRO_CORE;
for(const id of[25,27]){const{b,e,app}=battlefield(g,id),a=b.units.find(u=>u.side===0&&u.cls==='archer'),m=b.units.find(u=>u.side===0&&u.cls==='mage');b.units=[a,m];b.wind=0;e.checkEnd=()=>false;app.updateHUD=()=>{};P.attach(app,e);
 for(const[i,c]of b.honroMap.act3.crossings.entries()){
  // Pose fixtures isolate each authored span. The shot and gate use are real.
  for(const [j,u]of [a,m].entries())Object.assign(u,{x:c.from.x-90+j*90,y:c.from.y,vx:0,vy:0,jumping:false,airborne:false,acted:false,focus:180,moveLeft:u.maxMove});b.active=m.id;b.side=0;b.phase='aim';b.honroStakeCrossing.index=i;b.honroStakeCrossing.crossed={};b.honroStakeCrossing.armed=false;
  let shot;outer:for(let angle=15;angle<=65;angle+=2)for(let power=.6;power<=1.001;power+=.025){const hit=e.predict(m,C.SKILLS.M09,angle,power);if(hit.x>c.landing.left+80&&hit.x<c.landing.right-80&&Math.abs(hit.y-c.landing.y)<20){shot={angle,power};break outer;}}
  assert(shot,`chapter ${id} crossing ${i+1} has a basic M09 arc on authored terrain`);assert(e.fire('M09',shot.angle,shot.power));for(let tick=0;tick<3000&&b.phase!=='aim';tick++){e.tick(1/120);P.tick(app);}assert.equal(b.phase,'aim');assert.equal(b.stakes.length,2);assert.equal(b.honroStakeCrossing.retries,0);
  assert(e.select(a.id));for(let n=0;n<40&&Math.abs(a.x-m.x)>25;n++){e.walk(a,1,1/120);e.integrateBody(a,1/120,true);}assert(e.useGate());e.wait();for(let tick=0;tick<3000&&b.phase!=='aim';tick++){e.tick(1/120);P.tick(app);}assert(e.select(m.id));assert(e.useGate());assert.equal(b.honroStakeCrossing.index,i+1);assert.equal(b.honroStakeCrossing.retries,0);const memory=g.HonroAct3.memory(b);for(const step of g.HonroAct3.steps(b)){if(step.id===c.markerId)break;memory.done[step.id]=true;}g.HonroAct3.tick(app,0);assert(memory.done[c.markerId],'Real crossing completes the objective without requiring a second invisible arrival circle');console.log('PASS authored map',id,'crossing',i+1,'actual M09/E',shot);
 }
 assert(JSON.stringify(b).length<3000000,'Battle and retry snapshot fit below the common local-storage budget');
}
