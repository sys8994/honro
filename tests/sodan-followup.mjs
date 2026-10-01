import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';

const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
function arena(id,side=0){
 const p=C.defaults(),s=C.SKILLS[id];p.heroes[s.cls].xp=C.xpAtLevel(25);p.loadouts[s.cls]=[id];
 const b=C.createBattle(1,p,'practice',{party:[s.cls],wind:0,distance:900});
 Object.assign(b,{width:5000,height:2400,wind:0,terrain:[{id:'floor',x:0,y:1800,w:5000,h:600,mat:'rock',hp:99999,maxHp:99999}],fields:[],drafts:[],waters:[]});
 const u=b.units[0];Object.assign(u,{x:350,y:1800,loadout:[id],focus:9999,maxFocus:9999,acted:false,ranks:{[id]:8,[C.baseSkill(s.cls)]:1}});
 b.units=[u];b.active=u.id;const e=new C.Engine(b,()=>{});u.side=side;return{e,b,u,s};
}
for(const id of ['O11','O12','O13','O14','O15','O16']){
 const {e,b,u,s}=arena(id),angle=57,power=.55,guide=e.predict(u,s,angle,power);
 assert(guide.points.length>3,id+' prediction path');assert(e.fire(id,angle,power),id+' launch');
 const root=b.projectiles[0],launchSpeed=Math.hypot(root.vx,root.vy),expected=Math.hypot(...Object.values(e.velocity(u,s,angle,power)));
 assert(Math.abs(launchSpeed-expected)<1e-7,id+' shared launch velocity');
 let event=null;for(let i=0;i<1500&&b.projectiles.includes(root);i++){
  const before=b.units.length;e.stepProjectile(root,C.STEP);
  if(id==='O16'&&!b.projectiles.includes(root))event=b.projectiles.find(p=>p.mode==='convergeSpirit')?.curve?.goal;
  if(id!=='O16'&&b.units.length>before)event={x:root.x,y:root.y};
 }
 assert(event,id+' must cast in open air');
 assert(Math.hypot(event.x-guide.x,event.y-guide.y)<25,id+' guide matches cast point');
 console.log('PASS',id,'open-air guide and actual cast agree');
}
{
 const {e,b}=arena('O16');assert(e.fire('O16',35,.5));const p=b.projectiles[0],here={x:p.x+180,y:p.y-100};
 Object.assign(p,{...here,age:2.25,targetPoint:{x:here.x+900,y:here.y+500}});delete p.fuseAt;
 e.stepProjectile(p,C.STEP);const goal=b.projectiles.find(q=>q.mode==='convergeSpirit')?.curve?.goal;
 assert(goal&&Math.hypot(goal.x-here.x,goal.y-here.y)<1,'old in-flight save must converge where its projectile is visible');
 console.log('PASS old in-flight O16 converges without a teleport');
}
for(const side of [0,1,2])for(const id of ['A01','M01','O01','O16']){
 const {e,b,u,s}=arena(id,side),v=e.velocity(u,s,32,.7);assert(e.fire(id,32,.7,true),`${side}:${id} launch`);
 const root=b.projectiles[0];assert(root&&Math.hypot(root.vx-v.vx,root.vy-v.vy)<1e-7,`${side}:${id} flight speed`);
}
console.log('PASS shared launch speed for player, enemy and ally projectile families');
const audited=[],special=[];
for(const s of Object.values(C.SKILLS).filter(s=>!s.passive&&!s.martial&&s.mode!=='waveRing')){
 const {e,b,u}=arena(s.id,s.enemyOnly?1:0);if(!e.fire(s.id,35,.65,true))continue;
 const roots=b.projectiles.filter(p=>!p.child&&p.owner===u.id);if(!roots.length)continue;
 const expected=Math.hypot(...Object.values(e.velocity(u,s,35,.65)));
 const actual=roots.map(p=>Math.hypot(p.vx,p.vy));
 if(actual.some(v=>Math.abs(v-expected)>1e-5))special.push({id:s.id,mode:s.mode,expected,actual});
 audited.push(s.id);
}
assert.equal(special.length,0,'unexpected launch-speed override: '+JSON.stringify(special));
assert(audited.length>65,'player and enemy projectile families were audited');
console.log('PASS',audited.length,'player and enemy projectile skills use the shared initial speed');
const st=g.HONRO_CONTENT.stages[0],p=C.defaults(),b=g.HonroWorld.build(st,p,true,'occultist','O14',(stage,profile)=>C.createBattle(1,profile,'practice',{party:['occultist']}));
assert.equal(b.drafts.length,0,'training field has no unannounced updraft');
console.log('PASS training field removes the ghost-side trajectory force');
