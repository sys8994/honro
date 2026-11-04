/** Read-only actual saved-pose M11/M04 sensitivity. Never whole-game evidence. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from '../tools/act2-qa/stage17-gate-app-harness.mjs';
const h=await appHarness({productionStory:true}),{g,C}=h,rows=[];
for(const file of process.env.HONRO23_SHADOW_CHECKPOINTS.split(',')){
 const raw=await readFile(file),saved=JSON.parse(raw).profile,app=h.load(saved);app.continue();const live=app.engine.b,guard=JSON.stringify(live),clone=()=>new C.Engine(JSON.parse(guard),()=>{},false),pe=clone();assert(pe.select('p-mage'));const u=pe.active;
 const row={file,sha256:createHash('sha256').update(raw).digest('hex'),round:live.round,pose:{x:u.x,y:u.y,focus:u.focus,hp:u.hp,loadout:u.loadout},skills:[]};rows.push(row);
 const targets=pe.alive(1).filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<1400).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y)).slice(0,4);
 for(const id of ['M11','M04']){
  const sk=C.SKILLS[id],proposals=[];if(!u.loadout.includes(id)||pe.manaCost(sk,u)>u.focus||pe.cooldownLeft(u,id)>0){row.skills.push({id,available:false});continue;}
  for(const t of targets){const seed=pe.shotSeeds(u,sk,t);for(const a of seed){const v=C.shotViable(pe,u,sk,t,a.angle,a.power),hit=pe.predict(u,sk,a.angle,a.power,t,false),cluster=id==='M04'?pe.alive(1).filter(q=>Math.hypot(q.x-hit.x,q.y-q.h*.5-hit.y)<=260).length:0;proposals.push({...a,target:t.id,preview:{ok:v.ok,net:v.net||0,risk:v.risk,miss:v.miss,cluster}});}}
  const unique=new Map();for(const a of proposals.sort((a,b)=>(id==='M04'?b.preview.cluster-a.preview.cluster:0)||b.preview.net-a.preview.net||a.preview.miss-b.preview.miss)){const key=a.angle.toFixed(2)+':'+a.power.toFixed(3);if(!unique.has(key))unique.set(key,a);}
  const tested=[];for(const aim of [...unique.values()].slice(0,8)){global.gc?.();
   const sim=clone();assert(sim.select('p-mage'));const actor=sim.active,base=new Map(sim.b.units.map(v=>[v.id,{hp:v.hp,shield:v.shield||0,side:v.side,dead:v.dead}]));const focus=actor.focus;
   sim.face(aim.angle>90?-1:1);const accepted=sim.fire(id,aim.angle,aim.power);if(!accepted){tested.push({aim,accepted:false});continue;}
   let frames=0;for(;frames<2880;frames++){sim.tick(C.STEP);if(!sim.b.projectiles.length&&!sim.b.volley&&actor.acted&&(!['flight','review'].includes(sim.b.phase)))break;}
   assert(frames<2880,'Complete shot resolution bound');const losses=sim.b.units.flatMap(v=>{const old=base.get(v.id);if(!old)return[];const hp=Math.max(0,old.hp-v.hp),shield=Math.max(0,old.shield-(v.shield||0));return hp+shield?[{id:v.id,side:v.side,hp,shield,killed:!old.dead&&!!v.dead}]:[]});
   const total=side=>losses.filter(v=>v.side===side).reduce((n,v)=>n+v.hp+v.shield,0);tested.push({aim,accepted:true,frames,focusSpent:focus-actor.focus,enemyDamage:total(1),heroDamage:total(0),npcDamage:total(2),kills:losses.filter(v=>v.side===1&&v.killed).length,losses});
   assert.equal(JSON.stringify(live),guard,'Shadow selection/fire/ticks changed the live saved battle');
  }
  const safe=tested.filter(v=>v.accepted&&v.heroDamage===0&&v.npcDamage===0).sort((a,b)=>b.enemyDamage-a.enemyDamage||a.focusSpent-b.focusSpent);
  row.skills.push({id,available:true,tested,bestSafe:safe[0]||null});
 }
}
const result={scope:'Three genuine native saved battle poses, ordinary hero selection and finite-resource shots on independent exact copies; full Engine tick resolves initial explosion, secondary lightning and bounces. M04 seed priority includes 260px enemy clusters so generic first-impact scoring does not discard secondary opportunities. Live state unmodified. Not a whole-game or optimal-policy result.',rows};await writeFile(process.env.HONRO_QA_OUT,JSON.stringify(result,null,2));console.log(JSON.stringify({scope:result.scope,rows:rows.map(r=>({round:r.round,pose:r.pose,skills:r.skills.map(s=>({id:s.id,tested:s.tested?.length,bestSafe:s.bestSafe&&{damage:s.bestSafe.enemyDamage,kills:s.bestSafe.kills,focus:s.bestSafe.focusSpent,targets:s.bestSafe.losses.map(v=>v.id)},actualUnsafe:s.tested?.filter(v=>v.heroDamage>0||v.npcDamage>0).length}))}))}));
