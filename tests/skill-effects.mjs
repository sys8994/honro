import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime(),C=g.HONRO_CORE,checks=[],details={};
const test=(name,fn)=>{try{fn();checks.push({name,pass:true});console.log('PASS',name);}catch(err){checks.push({name,pass:false,error:String(err)});console.error('FAIL',name,err.stack);}};
function arena(id,rank=8){
 const cls=C.SKILLS[id].cls,p=C.defaults();p.heroes[cls].xp=C.xpAtLevel(25);p.heroes[cls].ranks[id]=rank;p.loadouts[cls]=[id];
 const b=C.createBattle(1,p,'practice',{party:[cls],wind:0,distance:700});Object.assign(b,{width:3000,height:1700,wind:0,terrain:[{id:'floor',x:0,y:1300,w:3000,h:400,mat:'rock',hp:99999,maxHp:99999}],waters:[],fields:[],drafts:[]});b.units=b.units.slice(0,1);
 const u=b.units[0];Object.assign(u,{x:400,y:1300,spawnX:400,spawnY:1300,vx:0,vy:0,attack:1,ranks:{[C.baseSkill(cls)]:1,[id]:rank},loadout:[id],focus:1000,maxFocus:1000,cooldowns:{},airborne:false,jumping:false,acted:false});
 const events=[],e=new C.Engine(b,ev=>events.push(ev));
 const foe=(x=900,y=1300,extra={})=>{const v=C.makeUnit('archer',1,x,y,{id:'dummy'+b.units.length,role:'dummy',fixed:true,hp:10000,maxHp:10000,armor:0,loadout:['LA01'],...extra});b.units.push(v);return v;};
 const resolve=()=>{let i=0;for(;i<2400&&b.phase!=='aim';i++)e.tick(C.STEP);assert.equal(b.phase,'aim',id+' resolves');assert(e.canAct(),id+' can act');return i;};
 return {e,b,u,events,foe,resolve};
}
test('All 32 redesigned actions repeat without refresh, at both ranks, including capstones and retreat',()=>{
 const rows=[];for(const s of Object.values(C.SKILLS).filter(s=>s.redesigned&&!s.martial&&!s.passive))for(const rank of [1,8]){
  const a=arena(s.id,rank);a.foe();if(s.cls==='archer')a.u.ranks.AP03=8;const session=a.b.session;
  for(let shot=0;shot<2;shot++){assert(a.e.fire(s.id,40,.6),s.id+' shot '+shot);a.resolve();assert.equal(a.e.cooldownLeft(a.u,s.id),0);assert(!a.u.retreat);assert.equal(a.u.focus,a.u.maxFocus);}
  assert.equal(a.b.session,session);assert.equal(a.u.ranks[s.id],rank);rows.push({id:s.id,rank,shots:2});
 }details.repeat=rows;
});
test('Campaign capstone has no cooldown and retains retreat while practice keeps consecutive gate placements',()=>{
 const a=arena('A99');a.b.mode='campaign';a.foe();a.e.fire('A99',20,.5);assert.equal(a.e.cooldownLeft(a.u,'A99'),0);a.b.projectiles=[];a.e.finishAction(true);assert.equal(a.e.cooldownLeft(a.u,'A99'),0);
 const r=arena('A01');r.b.mode='campaign';r.u.ranks.AP03=8;r.foe();r.e.fire('A01',30,.5);r.b.projectiles=[];r.e.finishAction(true);assert(r.u.retreat);assert(!r.e.fire('A01',30,.5));
 const gate=arena('M09');for(let i=0;i<2;i++){assert(gate.e.fire('M09',35,.6));gate.resolve();assert.equal(gate.b.stakes.length,2);}
});
test('Arc collides with the first enemy; guide equals impact and tangent is perpendicular to incoming velocity',()=>{
 let cases=0;for(const rank of [1,8])for(const angle of [0,35,70])for(const wind of [-18,20]){
  const a=arena('M03',rank);a.b.wind=wind;const t=a.foe(580,1300,{h:1200});a.foe(1100,1300,{h:1200});const prediction=a.e.predict(a.u,C.SKILLS.M03,angle,.65);
  assert(a.e.fire('M03',angle,.65));const q=a.b.projectiles[0];for(let i=0;i<1800&&a.b.projectiles.length;i++)for(const p of [...a.b.projectiles])a.e.stepProjectile(p,C.STEP);
  const events=a.events.filter(ev=>ev.name==='skillGeometry');assert.equal(events.length,1);const geo=JSON.parse(events[0].text);assert(t.hp<t.maxHp,JSON.stringify({rank,angle,wind,geo,hp:t.hp}));assert.equal(a.b.units[2].hp,a.b.units[2].maxHp,'no phase-through hit');
  assert.deepEqual(geo,JSON.parse(JSON.stringify(prediction.geometry)));assert(Math.abs(geo.impact.x-(geo.x+Math.cos(geo.angle)*geo.radius))<1e-8);assert(Math.abs(geo.impact.y-(geo.y+Math.sin(geo.angle)*geo.radius))<1e-8);
  const path=C.geometryPaths(geo)[0],first=path[0],last=path.at(-1);assert(Math.abs((last.x-first.x)*q.vx+(last.y-first.y)*q.vy)<1e-6,'perpendicular chord');assert(Math.abs(geo.angle-Math.atan2(q.vy,q.vx))<1e-9);cases++;
 }details.arcCases=cases;
});
test('Arc stops on a wall and old in-flight phase-through saves recover the new contact behavior',()=>{
 for(const saved of [false,true]){const a=arena('M03');a.b.terrain.push({id:'wall',x:640,y:500,w:30,h:800,mat:'rock',hp:99999,maxHp:99999});const t=a.foe(920);assert(a.e.fire('M03',0,.6));if(saved){a.b.projectiles[0].phaseMode='all';a.b.projectiles[0].plannedTime=2;a.b.projectiles[0].targetPoint={x:1500,y:1200};}
  a.resolve();const geo=JSON.parse(a.events.find(ev=>ev.name==='skillGeometry').text);assert(geo.impact.x<=640);assert.equal(t.hp,t.maxHp);}
});
test('Bagua has eight straight outer sides and uses those exact sides for hit detection',()=>{
 for(const rank of [1,8]){const geo=C.skillGeometry(C.SKILLS.M15,rank,500,500,0),vs=C.baguaVertices(geo),outline=C.geometryPaths(geo)[0];assert.equal(vs.length,8);assert.equal(outline.length,9);assert.deepEqual(outline[0],outline[8]);
  const a=vs[0],b=vs[1],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};assert(C.geometryHits(geo,{...mid,h:0,r:1}).count>0);
  const outside={x:geo.x+Math.cos(Math.PI/8)*(geo.radius+20),y:geo.y+Math.sin(Math.PI/8)*(geo.radius+20),h:0,r:1};assert.equal(C.geometryHits(geo,outside).count,0);
  if(rank===1){const oldCircle={x:geo.x+Math.cos(Math.PI/8)*geo.radius,y:geo.y+Math.sin(Math.PI/8)*geo.radius,h:0,r:1};assert.equal(C.geometryHits(geo,oldCircle).count,0,'former circular boundary is no longer a hit');}
 }
});
test('Thunder and sky gourds emit branched lightning at the real damage endpoints',()=>{
 for(const id of ['M04','M05']){const a=arena(id),t=a.foe(900);assert(a.e.fire(id,0,.3));const q=a.b.projectiles[0];a.e.impact(q,{x:850,y:1270,n:{x:0,y:-1},terrain:a.b.terrain[0],t:0});for(let i=0;i<300&&a.b.projectiles.length;i++)for(const p of [...a.b.projectiles])a.e.stepProjectile(p,C.STEP);
  const bolts=a.events.filter(ev=>ev.name==='lightningBolt');assert(bolts.length);assert(t.hp<t.maxHp);for(const ev of bolts){const {trunk,forks}=C.lightningPaths(ev.x,ev.y,ev.x2,ev.y2);assert.equal(trunk[0].x,ev.x);assert.equal(trunk[0].y,ev.y);assert(Math.hypot(trunk.at(-1).x-ev.x2,trunk.at(-1).y-ev.y2)<1e-8);assert.equal(forks.length,6);assert(trunk.some(p=>C.lineDistance(p,{x:ev.x,y:ev.y},{x:ev.x2,y:ev.y2})>2));}
 }
});
await mkdir('_local/reports/skill-effects',{recursive:true});await writeFile('_local/reports/skill-effects/unit.json',JSON.stringify({checks,details},null,2)+'\n');if(checks.some(v=>!v.pass))process.exitCode=1;
