/** Controlled collision/turn fixture: actual walking, M09 shots, turns and gates.
 * Enemies are excluded here; this is not evidence of a full combat clear. */
import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),P=g.HonroStakeCrossing,C=g.HONRO_CORE;
const plans=[{id:25,pods:[[0,2100,2700],[2800,7200,2700]],shots:[[1960,25,.875]]},{id:27,pods:[[0,1900,3300],[2600,4100,3100],[5050,6500,3500],[7200,9600,3300]],shots:[[1760,41,.925],[3960,11,.875],[6360,41,.925]]}];
for(const plan of plans){const{b,e,app}=battlefield(g,24),mage=b.units.find(u=>u.cls==='mage'&&u.side===0),archer=b.units.find(u=>u.cls==='archer'&&u.side===0);b.honroStage=plan.id;b.width=10000;b.height=5500;b.wind=0;b.units=[archer,mage];b.stakes=[];b.projectiles=[];b.phase='aim';b.side=0;b.active=mage.id;b.sceneVersion++;
 b.terrain=plan.pods.map(([x,right,y],i)=>({id:'pod-'+i,x,y,w:right-x,h:5500-y,mat:'rock',hp:99999,maxHp:99999}));b.honroMap.act3={crossings:plan.shots.map(([x],i)=>({id:'crossing-'+i,markerId:'arrive-'+i,fromZone:{left:x-140,right:plan.pods[i][1],y:plan.pods[i][2]},landing:{left:plan.pods[i+1][0],right:plan.pods[i+1][1],y:plan.pods[i+1][2]}}))};
 for(const[i,u]of b.units.entries())Object.assign(u,{x:plan.shots[0][0]-100+i*100,y:plan.pods[0][2],vx:0,vy:0,airborne:false,jumping:false,acted:false,focus:180});e.checkEnd=()=>false;app.updateHUD=()=>{};P.attach(app,e);
 const settle=()=>{for(let i=0;i<4000&&b.phase!=='aim';i++){e.tick(1/120);P.tick(app);}assert.equal(b.phase,'aim');};
 const walk=(u,target)=>{assert(e.select(u.id));for(let i=0;i<1600&&Math.abs(u.x-target)>3;i++){e.walk(u,Math.sign(target-u.x),1/120);e.integrateBody(u,1/120,true);}assert(Math.abs(u.x-target)<4,`${u.cls} can walk along current stone landing`);};
 for(const[i,[from,angle,power]]of plan.shots.entries()){
  walk(archer,from-100);walk(mage,from);assert(e.select(mage.id));assert(e.fire('M09',angle,power));settle();assert.equal(b.stakes.length,2,'Actual projectile creates a paired gate');assert.equal(b.honroStakeCrossing.retries,0);
  walk(archer,mage.x);assert(e.useGate());assert.equal(b.honroStakeCrossing.index,i,'One arrival cannot advance');e.wait();settle();assert(e.select(mage.id));assert(e.useGate());assert.equal(b.honroStakeCrossing.index,i+1,'Both actual gate uses advance once');assert.equal(b.honroStakeCrossing.retries,0);assert.equal(b.stakes.length,0,'Next connection starts clean');
 }
 console.log('PASS',plan.id,'real M09 projectile + walking + turns + both gate uses',plan.shots.length,'connections');
}
for(const drop of[0,200,400])for(const gap of[700,950]){const{b,e}=battlefield(g,24),u=b.units.find(u=>u.cls==='mage'&&u.side===0);b.width=5000;b.height=4000;b.units=[u];b.sceneVersion++;b.terrain=[{id:'from',x:0,y:1800,w:1000,h:2200},{id:'to',x:1000+gap,y:1800+drop,w:2000,h:2200}];Object.assign(u,{x:998,y:1800,vx:0,vy:0,airborne:false,jumping:false,walkSpeed:450,moveLeft:3000});assert(e.jump(u));let reached=false;for(let t=0;t<600;t++){e.walk(u,1,1/120);e.integrateBody(u,1/120,true);if(u.x>=1000+gap&&Math.abs(u.y-(1800+drop))<5){reached=true;break;}if(u.y>2300+drop)break;}
 if(drop===0||gap===950)assert.equal(reached,false,'Approved same-height 700 and descending 950 gaps block even level-30 speed');else assert.equal(reached,true,'Rejected descending 700 design really can be jumped');
}
console.log('PASS actual maximum-speed jump envelopes reject the old descending gap and validate the replacement');
