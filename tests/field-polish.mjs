import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime(),C=g.HONRO_CORE,checks=[],details={};
const test=(name,fn)=>{try{fn();checks.push({name,pass:true});console.log('PASS',name);}catch(e){checks.push({name,pass:false,error:String(e)});console.error('FAIL',name,e.stack);}};
function arena(id='M01',rank=8){
 const cls=C.SKILLS[id].cls,profile=C.defaults();profile.heroes[cls].xp=C.xpAtLevel(25);profile.heroes[cls].ranks[id]=rank;profile.loadouts[cls]=[id];
 const b=C.createBattle(1,profile,'practice',{party:[cls],wind:0,distance:700});Object.assign(b,{practiceCombat:true,width:6000,height:2200,wind:0,practiceWind:0,waters:[],drafts:[],fields:[],terrain:[{id:'floor',x:0,y:1700,w:6000,h:500,hp:99999,maxHp:99999,mat:'rock'}],rng:4721});b.units=b.units.slice(0,1);
 const u=b.units[0];Object.assign(u,{x:1200,y:1700,spawnX:1200,spawnY:1700,vx:0,vy:0,airborne:false,jumping:false,attack:1,armor:0,ranks:{[C.baseSkill(cls)]:1,[id]:rank},loadout:[id],hp:1000,maxHp:1000,focus:1000,maxFocus:1000,cooldowns:{},acted:false});
 const events=[],e=new C.Engine(b,ev=>events.push(ev));
 const foe=(x=1800,y=1700,extra={})=>{const t=C.makeUnit('archer',1,x,y,{id:'foe'+b.units.length,role:'bow',awake:true,aggroUntil:999,hp:10000,maxHp:10000,attack:1,armor:0,fixed:true,loadout:['LA01'],...extra});b.units.push(t);return t;};
 const step=(n=1800)=>{for(let i=0;i<n&&b.projectiles.length;i++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);};return {e,b,u,events,foe,step,profile};
}
test('Practice uses real enemy turns; dead enemies stay dead and resources rearm next round',()=>{
 const a=arena('A99'),dead=a.foe(1900),enemy=a.foe(2200);dead.hp=1;a.e.hurt(dead,500,a.u.id);assert(dead.dead);a.e.fire('A99',75,.4);let enemyShots=0;const fire=a.e.fire.bind(a.e);a.e.fire=(...args)=>{if(a.e.active.side===1)enemyShots++;return fire(...args);};
 for(let i=0;i<7200&&(a.b.round<2||a.b.phase!=='aim');i++)a.e.tick(C.STEP);
 assert(a.b.round>=2);assert.equal(a.b.phase,'aim');assert.equal(a.b.side,0);assert(enemyShots>0);assert(dead.dead&&dead.hp===0);assert(!a.u.dead&&a.u.hp>0);assert.equal(a.e.cooldownLeft(a.u,'A99'),0);assert.equal(a.u.focus,a.u.maxFocus);assert.equal(a.b.units.length,3);details.enemyShots=enemyShots;
});
test('Practice allies survive lethal hits, self damage and falls; campaign remains lethal',()=>{
 const a=arena(),t=a.foe();for(const owner of [t.id,a.u.id]){a.e.hurt(a.u,1e6,owner);assert.equal(a.u.hp,1);assert(!a.u.dead);a.e.recover(a.u);assert.equal(a.u.hp,1);assert(!a.u.dead);}
 a.b.mode='campaign';a.e.hurt(a.u,1e6,t.id);assert(a.u.dead);
});
test('Turn preview follows the exact post-steering flight without changing live state',()=>{
 let cases=0;for(const angle of [30,65])for(const age of [.15,.55])for(const wind of [-16,18]){
  const a=arena('A09');a.b.wind=wind;a.foe(2200);a.e.fire('A09',angle,.75);const q=a.b.projectiles[0];for(let i=0;i<Math.round(age/C.STEP);i++)a.e.stepProjectile(q,C.STEP);const target={x:q.x+700,y:q.y+170},before=JSON.stringify(a.b),pr=C.turnPrediction(a.e,target);assert(pr);assert.equal(JSON.stringify(a.b),before);
  assert(a.e.turnArrow(target));assert(!a.e.turnArrow(target));const actual=[{x:q.x,y:q.y}];for(let i=0;i<1440&&a.b.projectiles.includes(q);i++){a.e.stepProjectile(q,C.STEP);if(i%3===0||!a.b.projectiles.includes(q))actual.push({x:q.x,y:q.y});}
  assert.equal(actual.length,pr.points.length);for(let i=0;i<actual.length;i++)assert(Math.hypot(actual[i].x-pr.points[i].x,actual[i].y-pr.points[i].y)<1e-7);assert.equal(C.turnPrediction(a.e,target),null);cases++;
 }details.turnCases=cases;
});
test('Only steered turn arrows gain the rank-scaled hit bonus',()=>{
 for(const rank of [1,8]){const damage=turned=>{const a=arena('A09',rank),t=a.foe(1800);a.e.fire('A09',20,.6);const p=a.b.projectiles[0];p.turned=turned;a.e.hurt(t,100,a.u.id,true,p,{x:1800,y:1660});return t.maxHp-t.hp;};const base=damage(false),bonus=damage(true),ratio=rank===1?1.3:1.65;assert(Math.abs(bonus-base*ratio)<2);}
});
test('Scatter and seven-star visible predictions contain one complete representative parabola',()=>{
 for(const id of ['A04','A15']){const a=arena(id);const before=JSON.stringify(a.b),pr=C.redesignPrediction(a.e,a.u,C.SKILLS[id],55,.65,true);assert.equal(pr.paths.length,1);assert(pr.apex&&pr.points.some(p=>p.y>pr.apex.y+150&&p.x>pr.apex.x));assert.equal(JSON.stringify(a.b),before);assert(C.redesignPrediction(a.e,a.u,C.SKILLS[id],55,.65).paths.length>1);}
});
test('Ice charge controls a longer fuse and preview equals the actual delayed bounce endpoint',()=>{
 const times=[];for(const power of [0,.5,1]){const a=arena('M02');a.foe(1440);a.e.fire('M02',45,power);const p=a.b.projectiles[0],fuse=p.fuseAt;const pr=a.e.predict(a.u,C.SKILLS.M02,45,power);for(let i=0;i<900&&a.b.projectiles.includes(p);i++){a.e.stepProjectile(p,C.STEP);if(p.age<fuse)assert(a.b.projectiles.includes(p));}assert(p.age>=fuse&&p.age<=fuse+C.STEP);assert(Math.hypot(p.x-pr.x,p.y-pr.y)<1e-7);times.push(p.age);}
 assert(times[0]>=3.2&&times[1]>times[0]+1.5&&times[2]>times[1]+1.5);details.iceTimes=times;
});
test('Basic qi emits one explosion at contact and keeps hit sounds for every damaged enemy',()=>{
 const a=arena(),t=a.foe(1730),other=a.foe(1760);a.e.fire('M01',0,.4);const p=a.b.projectiles[0],hit={x:1720,y:1660,n:{x:-1,y:0},unit:t,t:0};a.e.impact(p,hit);
 assert(t.hp<t.maxHp&&other.hp<other.maxHp);const fx=a.events.filter(ev=>ev.type==='fx'&&['qiBurst','inkImpact','burst','ring'].includes(ev.name));assert.equal(fx.length,1);assert.equal(fx[0].name,'qiBurst');assert.equal(fx[0].x,hit.x);assert.equal(fx[0].y,hit.y);assert.equal(a.events.filter(ev=>ev.name==='qiHit').length,2);
});
test('Fire chain erupts randomly around the first airburst, without snapping to the floor',()=>{
 const trial=()=>{const a=arena('M13');a.e.fire('M13',45,.5);const p=a.b.projectiles[0];a.e.impact(p,{x:2000,y:1000,n:{x:0,y:-1},terrain:a.b.terrain[0],t:0});a.step();return a.events.filter(ev=>ev.name==='fireBloom');};const bursts=trial();assert.equal(bursts.length,15);assert.deepEqual(trial(),bursts);const small=bursts.slice(1);assert(small.every(ev=>Math.hypot(ev.x-2000,ev.y-1000)<=240.01));assert(new Set(small.map(ev=>Math.round(ev.y))).size>10);assert(small.some(ev=>ev.y<1000)&&small.some(ev=>ev.y>1000));details.airbursts=small.map(ev=>({x:ev.x,y:ev.y}));
});
test('First gate cast creates a usable pair; blocked arrival chooses a safe nearby spot',()=>{
 const a=arena('M09');a.e.fire('M09',30,.5);const q=a.b.projectiles[0];a.e.impact(q,{x:2100,y:1700,n:{x:0,y:-1},terrain:a.b.terrain[0],t:0});assert.equal(a.b.stakes.length,2);a.b.phase='aim';a.u.acted=false;assert(a.e.gateCandidate());const blocker=a.foe(2100);assert(a.e.useGate());assert(Math.abs(a.u.x-2100)<=96&&Math.abs(a.u.x-blocker.x)>=a.u.r+blocker.r);assert(a.e.grounded(a.u));assert(!a.e.useGate());
 const saved=structuredClone(a.b),e=new C.Engine(saved);assert.equal(e.b.stakes.length,2);assert.equal(e.active.gateTurn,a.u.gateTurn);
});
await mkdir('_local/reports/field-polish',{recursive:true});await writeFile('_local/reports/field-polish/unit.json',JSON.stringify({checks,details},null,2)+'\n');if(checks.some(c=>!c.pass))process.exitCode=1;
