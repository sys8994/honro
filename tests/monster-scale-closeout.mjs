// Checked against the native App factory and real Engine contact/hurt logic.
// DOM and incoming cast paths are controlled fixtures, not a difficulty playthrough.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g,C=g.HONRO_CORE;
g.HONRO_ACT4_PILOT_COMBAT_REFERENCE=JSON.parse(await readFile('shared/data/act4/pilot-combat-reference.json','utf8'));
for(const f of ['act4-pilot-combat','story-barks'])vm.runInContext(await readFile('shared/runtime/'+f+'.js','utf8'),g);
function launch(n){
 const p=h.profileThrough(n-1),lv=g.HonroProgression.plan(n)?.entryLevel??15;
 for(const cls of p.recruited)p.heroes[cls].xp=C.xpAtLevel(lv);
 const app=h.load(p);app.launch(n);return app;
}
const cases=[[3,'midboss-stage3',406,59,.35,1.30],[34,'a4-34-r-6',430,60,.20,1]];
for(const [n,id,height,radius,body,face] of cases){
 const app=launch(n),b=app.engine.b,u=b.units.find(x=>x.id===id),hero=b.units.find(x=>x.side===0&&x.cls==='archer');
 assert.equal(b.honroMonsterScaleRevision,3);
 assert.equal(u.h,height);assert.equal(u.r,radius);
 assert(C.validTerrainContactPose(b.terrain,u),'native placement/matched body is terrain-safe');
 assert.equal(app.engine.monsterWeakPoint(u).body,body);
 assert.equal(app.engine.monsterWeakPoint(u).bonus,face);
 assert.equal(b.units.filter(x=>app.engine.monsterWeakPoint(x)).length,1);
 const original=new C.Engine(plain(b),()=>{},false),old=original.unit(id);original.b.honroMonsterScaleRevision=n===3?1:2;
 assert.equal(original.monsterWeakPoint(old),undefined);
 const saved=new C.Engine(plain(b),()=>{},false);
 g.HonroMonsterScale.prepare(saved.b);
 assert.equal(saved.unit(id).h,u.h);assert.equal(saved.unit(id).maxHp,u.maxHp);
 assert.equal(saved.monsterWeakPoint(saved.unit(id)).body,body);
 // Fixed placements on opposite, valid supports. Real authored collision
 // and other enemies remain present; no direct damage or aim spoofing.
 const positions=n===3?[
  [1868.75,2606.450566037736,75,.4],[2658.75,2317.84064,180,.9]
 ]:[[4680,2557.6,46,.56],[5330,2724,105,.56]];
 for(const [x,y,angle,power] of positions){
  const receipts=[],live=new C.Engine(plain(b),entry=>receipts.push(entry),false);
  const actor=live.unit(hero.id),target=live.unit(id);
  Object.assign(actor,{x,y,vx:0,vy:0,airborne:false,jumping:false,acted:false});
  Object.assign(live.b,{side:0,phase:'aim',active:actor.id,projectiles:[],volley:undefined});
  assert(C.validTerrainContactPose(live.b.terrain,actor));
  const estimate=live.predict(actor,C.SKILLS.A01,angle,power,target,false);
  assert.equal(estimate.unit,id,'native terrain permits the shot');
  assert(live.fire('A01',angle,power),'normal cast and contact pose allowed');
  const p=live.b.projectiles.find(p=>p.owner===actor.id&&p.shot===live.b.shot);
  assert(p);
  for(let i=0;i<1440&&live.b.projectiles.includes(p);i++)live.stepProjectile(p,1/120);
  assert(!live.b.projectiles.includes(p),'cast resolved within twelve seconds');
  assert(receipts.some(v=>v.type==='fx'&&v.text==='약점!'),'native shot hit the indicated weak point');
  assert(target.hp<target.maxHp);
 }
 // Clear only terrain/transient actors inside an isolated shot fixture. The
 // actor, battle provenance, shape and chosen skill are not faked.
 b.units=[hero,u];b.terrain=[];b.phase='aim';b.side=0;app.dialogue=null;
 const events=[],e=new C.Engine(b,x=>events.push(x),false);
 app.engine=e;e.random=()=>.99;
 const q=()=>b.honroState.scaleTrialObservation;
 function shot(relative,{side=1,child=false,corner=false,control=false}={}){
  b.shot++;b.cast={owner:hero.id,skill:'A01',shot:b.shot};u.hp=u.maxHp;u.dead=false;u.shield=0;
  if(control)b.honroMonsterScaleRevision=1;
  const y=u.y-u.h+u.h*relative;
  const a=corner?{x:u.x+u.r*.92,y:y-80}:{x:u.x-side*(u.r+54),y};
  const z=corner?{x:a.x,y:y+80}:{x:u.x+side*15,y};
  const p={id:100+b.shot,shot:b.shot,owner:hero.id,side:0,skill:'A01',mode:'arrow',vx:side*320,vy:0,
   x:a.x,y:a.y,age:.3,blast:0,damage:100,damageRoll:1,bounces:0,hit:[],radius:3,child,
   pierces:0,trail:[a],fieldHits:[],amplification:1,carry:[],color:'#fff',launchX:a.x,launchY:a.y};
  const hit=e.projectileCollision(a,z,p.radius,hero.id,[],true,[],true,p);
  assert.equal(hit?.unit,u,'surface contact on actual sized hitbox');
  const start=u.hp;e.impact(p,hit);if(control)b.honroMonsterScaleRevision=3;
  return start-u.hp;
 }
 const normal=shot(.65,{control:true}),back=shot(.65,{side:-1,control:true}),corner=shot(.04,{corner:true,control:true});
 assert(normal>0);
 assert(Math.abs(shot(.65)/normal-body)<.025);
 assert.equal(q().queue.length,0,'one body impact cannot trigger deduction');
 assert(Math.abs(shot(.65,{side:-1})/back-body)<.025);
 assert.equal(q().queue[0]?.kind,'resisted');
 app.scene={x:u.x,y:u.y-u.h*.5,scale:1,canvas:{clientWidth:1400,clientHeight:850}};
 app.screen='battle';app.speakerUnits=()=>[hero];app.canSpeak=who=>who==='설오';
 hero.x=u.x-315;hero.y=u.y;
 g.HonroStoryBarks.tick(app,100);
 const node=h.nodes.get('banter');assert(node.innerHTML.includes('눈'));
 assert.equal(node.dataset.scale44Observation,`stage${n}-weakpoint-resisted`);
 assert.equal(q().queue.length,0);
 assert(Math.abs(shot(.27,{child:true})/normal-body)<.025,'secondary precision blocked');
 assert(Math.abs(shot(.04,{corner:true})/corner-body)<.025,'top corner cannot become face contact');
 const precise=shot(.27,{side:-1});
 assert(Math.abs(precise/back-face)<.035,'clean face precision');
 assert.equal(q().queue[0]?.kind,'weak');
 g.HonroStoryBarks.tick(app,200);
 assert.equal(node.dataset.scale44Observation,`stage${n}-weakpoint-weak`);
 assert.deepEqual(plain(q().presented),['resisted','weak']);
 q().queue.length=0;delete b.honroState.scaleTrialObservation;
 shot(.27);assert.deepEqual(plain(q().queue.map(x=>x.kind)),['weak'],'early precision never fabricates body inference');
 const after=new C.Engine(plain(b),()=>{},false);
 assert.deepEqual(plain(after.b.honroState.scaleTrialObservation),plain(q()));
 console.log(`stage ${n}, ${id}, body ${u.h}×${u.r*2}, HP ${u.maxHp}, normal/body/face (same direction) ${back}/${Math.round(back*body)}/${precise}`);
 app.stopBattle();
}
assert.equal(launch(6).engine.b.honroMonsterScaleRevision,2,'approved bridge version untouched');
