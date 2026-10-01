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
for(const id of ['O12','O13','O14','O15','O16']){
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
 const {e,b,u,s}=arena('O11'),angle=76,power=.8,guide=e.predict(u,s,angle,power);
 assert(guide.terrain,'stalker guide must end at terrain');
 const middle=guide.points[Math.floor(guide.points.length*.45)],enemy=C.makeUnit('knight',1,middle.x,middle.y+50,{id:'seed-pass-through',hp:1000,maxHp:1000,h:100,r:25,fixed:true});b.units.push(enemy);
 assert(e.fire('O11',angle,power),'stalker launch');
 const root=b.projectiles[0];assert.equal(root.fuseAt,undefined,'stalker cannot hatch in air');
 root.age=1.45;root.fuseAt=1.45;e.stepProjectile(root,C.STEP);assert(b.projectiles.includes(root),'elapsed flight alone must not summon, including old saves');
 assert.equal(root.fuseAt,undefined,'old saved fuse must be discarded');
 for(let i=0;i<1500&&b.projectiles.includes(root);i++)e.stepProjectile(root,C.STEP);
 const spirit=b.units.find(v=>v.summonKind==='stalker');assert(spirit,'terrain impact must summon stalker');
 assert(root.x>enemy.x+enemy.r&&enemy.hp===1000,'stalker seed must pass through enemies');
 assert(Math.hypot(root.x-guide.x,root.y-guide.y)<25,'stalker guide must mark actual ground impact');
 assert(Math.abs(spirit.y-root.y)<12,'ground summon must remain at impact height');
 console.log('PASS O11 flies through open air and summons only on terrain');
}
{
 const {e,b,u,s}=arena('O04'),tap=e.velocity(u,s,30,.03),echo=C.makeUnit('occultist',0,u.x,u.y,{summoned:true,summonKind:'echo'}),echoSpeed=e.velocity(echo,s,30,.03);
 assert(Math.hypot(tap.vx,tap.vy)>480,'quick O04 cast needs a readable minimum speed');
 assert(Math.hypot(tap.vx,tap.vy)>Math.hypot(echoSpeed.vx,echoSpeed.vy),'Sodan must not throw slower than her echo');
 assert(e.fire('O04',30,.03),'O04 launch');const root=b.projectiles[0];
 assert(Math.abs(Math.hypot(root.vx,root.vy)-Math.hypot(tap.vx,tap.vy))<1e-7,'actual O04 uses predicted launch speed');
 console.log('PASS O04 quick cast and echo speed');
}
assert.equal(C.SUMMON_TUNING.stalker.move,2080);assert.equal(C.SUMMON_TUNING.stalker.reach,416);
assert.equal(C.SUMMON_TUNING.lantern.move,1240);assert.equal(C.SUMMON_TUNING.lantern.reach,1920);
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
