import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';

const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
function arena(id,side=0){
 const p=C.defaults(),s=C.SKILLS[id];p.heroes[s.cls].xp=C.xpAtLevel(25);p.loadouts[s.cls]=[id];
 const b=C.createBattle(1,p,'practice',{party:[s.cls],wind:0,distance:900});
 Object.assign(b,{width:5000,height:2400,wind:0,terrain:[{id:'floor',x:0,y:1800,w:5000,h:600,mat:'rock',hp:99999,maxHp:99999}],fields:[],drafts:[],waters:[]});
 const u=b.units[0];Object.assign(u,{x:350,y:1800,loadout:[id],focus:9999,maxFocus:9999,acted:false,ranks:{[id]:8,[C.baseSkill(s.cls)]:1}});
 b.units=[u];b.active=u.id;const events=[],e=new C.Engine(b,event=>events.push(event));u.side=side;return{e,b,u,s,events};
}
for(const id of ['O12','O14','O15','O16']){
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
 const {e,b,u,s}=arena('O13'),angle=76,power=.8,guide=e.predict(u,s,angle,power);
 assert(guide.terrain,'warden guide must end on ground');assert.equal(s.fuse,undefined);
 assert(e.fire('O13',angle,power));const root=b.projectiles[0];assert.equal(root.fuseAt,undefined);
 root.age=1.45;root.fuseAt=1.45;e.stepProjectile(root,C.STEP);
 assert(b.projectiles.includes(root),'old saved warden seed cannot hatch in air');
 for(let i=0;i<1500&&b.projectiles.includes(root);i++)e.stepProjectile(root,C.STEP);
 const warden=b.units.find(v=>v.summonKind==='warden');assert(warden,'warden must hatch on terrain');
 assert(Math.hypot(root.x-guide.x,root.y-guide.y)<25,'warden ground guide matches impact');
 assert.equal(warden.summonFloating,false);
 console.log('PASS O13 ground-only summon and matching guide');
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
assert.equal(C.SUMMON_TUNING.stalker.move,1660);assert.equal(C.SUMMON_TUNING.stalker.reach,330);assert.equal(C.SUMMON_TUNING.stalker.damage,32);
assert.equal(C.SUMMON_TUNING.lantern.move,1240);assert.equal(C.SUMMON_TUNING.lantern.reach,1920);
{
 const {e,b,u}=arena('O11');b.terrain=[{id:'near-floor',x:0,y:1800,w:950,h:600,mat:'rock',hp:99999,maxHp:99999},{id:'far-floor',x:1100,y:1800,w:3900,h:600,mat:'rock',hp:99999,maxHp:99999}];
 const enemy=C.makeUnit('knight',1,1500,1800,{id:'far-target',hp:10000,maxHp:10000,h:100,r:25,fixed:true});b.units.push(enemy);
 const stalker=e.spawnSummon(u,'stalker',600,1800);assert.equal(stalker.summonFloating,false);
 assert(e.runSummonTurn(u.id)>0);let farthest=stalker.x;
 for(let i=0;i<260&&b.phase==='summon';i++){e.stepSummonTurn(C.STEP);farthest=Math.max(farthest,stalker.x);assert(Math.abs(stalker.y-1800)<1,'stalker stays on its supporting floor');}
 assert(farthest>700&&farthest<=950,'stalker moves along ground and stops at gap');
 console.log('PASS stalker cannot fly across a terrain gap');
}
{
 const {e,b,u}=arena('O11');b.units.push(C.makeUnit('knight',1,1500,1800,{id:'old-save-target',hp:10000,maxHp:10000,h:100,r:25,fixed:true}));
 const stalker=e.spawnSummon(u,'stalker',600,1800);stalker.y=1400;stalker.summonFloating=true;
 assert(e.runSummonTurn(u.id)>0);e.stepSummonTurn(C.STEP);
 assert.equal(stalker.summonFloating,false);assert.equal(stalker.y,1800,'previously airborne saved stalker lands before acting');
 console.log('PASS saved airborne stalker returns to ground');
}
{
 const endpoints=[];
 for(const power of [.08,.8]){
  const {e,b,u,s}=arena('O16'),angle=20,guide=e.predict(u,s,angle,power);
  assert(e.fire('O16',angle,power));const root=b.projectiles[0],speed=Math.hypot(root.vx,root.vy);
  for(let i=0;i<1500&&b.projectiles.includes(root);i++)e.stepProjectile(root,C.STEP);
  const goal=b.projectiles.find(p=>p.mode==='convergeSpirit')?.curve?.goal;
  assert(goal&&Math.hypot(goal.x-guide.x,goal.y-guide.y)<25,'convergence guide matches actual goal');
  endpoints.push({x:goal.x,speed});
 }
 assert(endpoints[1].speed>endpoints[0].speed*8,'O16 launch speed follows charge');
 assert(endpoints[1].x>endpoints[0].x+600,'long hold travels much farther than a tap');
 console.log('PASS O16 charge controls actual and predicted reach');
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
const audited=[],special=[],direct=[],inaccessible=[];
for(const s of Object.values(C.SKILLS).filter(s=>!s.passive)){
 const {e,b,u,events}=arena(s.id,s.enemyOnly?1:0);
 if(!e.fire(s.id,35,.65,true)){inaccessible.push(s.id);continue;}
 assert(events.some(ev=>ev.type==='sound'&&C.AudioEngine.samples(ev.name).length>0),s.id+' needs an audible cast');
 const roots=b.projectiles.filter(p=>!p.child&&p.owner===u.id);if(!roots.length){direct.push(s.id);continue;}
 const expected=Math.hypot(...Object.values(e.velocity(u,s,35,.65)));
 const actual=roots.map(p=>Math.hypot(p.vx,p.vy));
 if(!s.martial&&s.mode!=='waveRing'&&actual.some(v=>Math.abs(v-expected)>1e-5))special.push({id:s.id,mode:s.mode,expected,actual});
 const opponent=C.makeUnit('knight',u.side===0?1:0,850,1800,{id:'audio-target',hp:10000,maxHp:10000,h:100,r:25,fixed:true});b.units.push(opponent);
 const groundedImpact=s.mode.startsWith('summon')||s.branch==='stake',before=events.length;
 e.impact(roots[0],{x:850,y:groundedImpact?1800:1750,t:0,n:{x:0,y:-1},...(groundedImpact?{terrain:b.terrain[0]}:{unit:opponent})});
 assert(events.slice(before).some(ev=>ev.type==='sound'&&C.AudioEngine.samples(ev.name).length>0),s.id+' needs an audible impact');
 audited.push(s.id);
}
assert.equal(inaccessible.length,0,'all active skill definitions can emit their cast event in isolation');
assert.equal(direct.length,9,'direct-action skills are included in the cast-sound audit');
assert.equal(special.length,0,'unexpected launch-speed override: '+JSON.stringify(special));
assert(audited.length>120,'player, enemy and ally projectile families were audited');
console.log('PASS',audited.length,'projectile impacts and',direct.length,'direct-action casts have audible events');
for(const id of ['O04','O09','O11','O16']){
 const {e,b,events}=arena(id);assert(e.fire(id,45,.7));const p=b.projectiles[0];
 const foe=C.makeUnit('knight',1,850,1800,{id:'impact-foe',hp:10000,maxHp:10000,h:100,r:25,fixed:true});b.units.push(foe);
 const terrain=b.terrain[0],unit=['O04','O09'].includes(id),before=events.length;
 e.impact(p,{x:unit?foe.x:850,y:unit?foe.y-50:terrain.y,t:0,n:{x:0,y:-1},...(unit?{unit:foe}:{terrain})});
 assert(events.slice(before).some(ev=>ev.type==='sound'&&C.AudioEngine.samples(ev.name).length>0),id+' impact needs an audible effect');
}
console.log('PASS Sodan direct hit, curse, summon and convergence impact sounds');
const st=g.HONRO_CONTENT.stages[0],p=C.defaults(),b=g.HonroWorld.build(st,p,true,'occultist','O14',(stage,profile)=>C.createBattle(1,profile,'practice',{party:['occultist']}));
assert.equal(b.drafts.length,0,'training field has no unannounced updraft');
console.log('PASS training field removes the ghost-side trajectory force');
