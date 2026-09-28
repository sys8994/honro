import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const C=(await runtime()).HONRO_CORE,checks=[],details={};
function test(name,fn){try{fn();checks.push({name,pass:true});console.log('PASS',name);}catch(e){checks.push({name,pass:false,error:String(e)});console.error('FAIL',name,e.stack);}}
function arena(id,rank=8){
 const cls=C.SKILLS[id].cls,profile=C.defaults();profile.heroes[cls].xp=C.xpAtLevel(25);profile.heroes[cls].ranks={[C.baseSkill(cls)]:1,[id]:rank};profile.loadouts[cls]=[id];
 const b=C.createBattle(1,profile,'practice',{party:[cls],wind:0});Object.assign(b,{width:6000,height:2400,practiceCombat:true,fields:[],waters:[],drafts:[],wind:0,rng:4721,terrain:[{id:'floor',x:0,y:1900,w:6000,h:500,mat:'rock',hp:99999,maxHp:99999}]});b.units=b.units.slice(0,1);
 const u=b.units[0];Object.assign(u,{x:1600,y:1900,spawnX:1600,spawnY:1900,attack:1,armor:0,focus:1000,maxFocus:1000,hp:1000,maxHp:1000,vx:0,vy:0,airborne:false,jumping:false,acted:false,loadout:[id],ranks:{[C.baseSkill(cls)]:1,[id]:rank},cooldowns:{},facing:1});
 const e=new C.Engine(b),foe=(x,y=1900,extra={})=>{const t=C.makeUnit('archer',1,x,y,{id:'foe'+b.units.length,role:'dummy',fixed:true,hp:10000,maxHp:10000,armor:0,loadout:['LA01'],...extra});b.units.push(t);return t;};
 const run=()=>{for(let i=0;i<1440&&(b.projectiles.length||u.meleeAction);i++){C.tickWarrior(e,C.STEP);for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);}};
 return{b,u,e,foe,run};
}
test('Seven-star visible path joins the actual centre child after splitting, including homing and early contacts',()=>{
 const cases=[];
 for(const angle of [20,55,125])for(const wind of [-18,16])for(const obstacle of [false,true]){
  const a=arena('A15');a.b.wind=wind;for(const x of [1150,2350,2600,2900])a.foe(x,1900,{hp:45});
  if(obstacle)a.b.terrain.push({id:'wall',x:angle>90?1400:1800,y:1000,w:25,h:900,mat:'rock',hp:99999,maxHp:99999});
  const before=JSON.stringify(a.b),pr=C.redesignPrediction(a.e,a.u,C.SKILLS.A15,angle,.75,true);assert.equal(JSON.stringify(a.b),before);assert.equal(pr.paths.length,1);
  a.e.fire('A15',angle,.75);let tracked=a.b.projectiles[0],split;const points=[{x:tracked.x,y:tracked.y}];
  for(let i=0;i<1440&&a.b.projectiles.length;i++)for(const p of [...a.b.projectiles]){
   if(!a.b.projectiles.includes(p))continue;const next=a.b.nextId,wasParent=p===tracked&&p.mode==='seekRain';a.e.stepProjectile(p,C.STEP);
   if(p===tracked&&(i%3===0||!a.b.projectiles.includes(p)))points.push({x:p.x,y:p.y});
   if(wasParent&&!a.b.projectiles.includes(p)){const children=a.b.projectiles.filter(q=>q.id>=next&&q.mode==='seekChild');if(children.length){assert.equal(children.length,7);tracked=children[3];split={x:p.x,y:p.y};}else assert(obstacle);}
  }
  if(!obstacle)assert(split);assert.equal(points.length,pr.points.length);for(let i=0;i<points.length;i++)assert(Math.hypot(points[i].x-pr.points[i].x,points[i].y-pr.points[i].y)<1e-7);
  if(split)assert(pr.points.some(p=>p.x===split.x&&p.y===split.y));cases.push({angle,wind,obstacle,split,endpoint:points.at(-1),samples:points.length});
 }details.sevenStar=cases;
});
test('Iron flower fragments hit beyond the former reach and retain their per-target damage cap',()=>{
 const rows=[];for(const oldReach of [true,false]){
  const a=arena('A08'),t=a.foe(2520,1380,{h:330});a.e.random=()=>0;a.e.fire('A08',30,.5);const p=a.b.projectiles[0];a.e.impact(p,{x:2200,y:1180,n:{x:0,y:-1},terrain:a.b.terrain[0],t:0});assert.equal(p.mode,'ironEmitter');
  for(let i=0;i<420&&a.b.projectiles.length;i++)for(const q of [...a.b.projectiles])if(a.b.projectiles.includes(q)){if(oldReach&&q.mode==='ironChip'&&q.age===0){q.vx=440;q.vy=0;q.maxAge=.45;}a.e.stepProjectile(q,C.STEP);}
  rows.push(10000-t.hp);assert(rows.at(-1)<=p.rootDamage*.65+1);
 }assert.equal(rows[0],0);assert(rows[1]>0);details.ironReachDamage=rows;
});
test('Every sword range is reduced 20 percent and its actual hit boundary agrees with the guide at both charges',()=>{
 const old={S00:180,S03:225,S05:180,S07:165,S08:185,S02:180},rows=[];
 for(const [id,range] of Object.entries(old))for(const power of [0,1])for(const passive of [0,8]){
  const a=arena(id);a.u.ranks.SP01=passive;assert.equal(C.SKILLS[id].radius,range*.8);const reach=C.meleeRange(a.u,C.SKILLS[id],power),inside=a.foe(a.u.x+reach+17),outside=a.foe(a.u.x+reach+30);inside.r=outside.r=20;
  a.e.fire(id,0,power);if(id==='S08'){a.b.side=1;C.tickWarrior(a.e,.1);}else a.run();assert(inside.hp<10000,id);assert.equal(outside.hp,10000,id);
  const arcs=[],ctx={save(){},restore(){},translate(){},setLineDash(){},beginPath(){},moveTo(){},closePath(){},stroke(){},arc(...v){arcs.push(v);}};C.drawMeleeGuide(ctx,a.e,a.u,C.SKILLS[id],power,.4);assert.equal(arcs[0][2],reach);rows.push({id,power,passive,reach});
 }details.melee=rows;
});
test('The pull follow-up slash uses the shorter melee reach even if a fixed target cannot be pulled',()=>{
 for(const distance of [150,190]){
  const a=arena('S10'),t=a.foe(a.u.x+distance);a.e.random=()=>.99;a.e.fire('S10',0,.2);const p=a.b.projectiles[0];Object.assign(p,{x:t.x-3,y:t.y-t.h*.5,vx:400,vy:0});const base=p.damage;a.e.stepProjectile(p,.01);assert(distance===150?10000-t.hp>base+20:Math.abs(10000-t.hp-base)<1);
 }
});
test('All 21 martial skill icons have distinct primary silhouettes; rush has no sword fallback',()=>{
 const rows=Object.values(C.SKILLS).filter(s=>s.martial),paths=rows.map(s=>C.icon('skill:'+s.id).match(/<path d="([^"]+)/)[1]);assert.equal(rows.length,21);assert.equal(new Set(paths).size,21);
 for(const s of rows.filter(s=>s.branch==='rush'))assert.notEqual(s.icon,'sword');details.icons=rows.map(s=>({id:s.id,name:s.name,icon:s.icon}));
});
test('Visual rendering is deterministic, animates trails and petals, and never changes battle state or RNG',()=>{
 for(const id of ['A08','S01','S06','S04','S15','S13','S09','S10','S11','S12']){
  const a=arena(id);a.e.fire(id,55,.8);const p=a.b.projectiles[0];for(let i=0;i<30;i++)a.e.stepProjectile(p,C.STEP);
  if(id==='A08')a.e.impact(p,{x:2200,y:1200,n:{x:0,y:-1},terrain:a.b.terrain[0],t:0});
  const before=JSON.stringify(a.b),capture=age=>{const calls=[],ctx=new Proxy({},{get:(_,key)=>typeof key==='string'?((...args)=>calls.push([key,...args])):undefined,set:(_,key,v)=>{calls.push([key,v]);return true;}});C.drawRedesignProjectile(ctx,{...p,age});return JSON.stringify(calls);};
  const first=capture(.2);assert.equal(first,capture(.2));assert.notEqual(first,capture(.4),id);assert.equal(JSON.stringify(a.b),before,id);
 }
});
await mkdir('_local/reports/skill-tuning',{recursive:true});await writeFile('_local/reports/skill-tuning/unit.json',JSON.stringify({checks,details},null,2)+'\n');if(checks.some(c=>!c.pass))process.exitCode=1;
