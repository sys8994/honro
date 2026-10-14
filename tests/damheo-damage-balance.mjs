/** Real production launch/impact/secondary/stake paths; VM evidence, not browser QA. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtimeParts} from '../shared/build.mjs';
const sources=await runtimeParts({vector:false,render:false});
let replacements=0;
const cores=[];
for(const baseline of [true,false]){
 const g=vm.createContext({console,performance,structuredClone});
 for(let source of sources){if(baseline)source=source.replace(/exports\.PLAYER_MAGE_DAMAGE_MULTIPLIER = 1\.20;/g,m=>{replacements++;return m.replace('1.20','1');});vm.runInContext(source,g);}
 cores.push(g.HONRO_CORE);
}
assert.equal(replacements,1,'baseline changes only the newly introduced scalar to its previous identity');
const plain=x=>JSON.parse(JSON.stringify(x)), near=(a,b,m)=>assert(Math.abs(a-b)<1e-7,`${m}: ${a} vs ${b}`),rows=[];
function arena(C,id='M01',rank=8){
 const profile=C.defaults();profile.heroes.mage.xp=C.xpAtLevel(30);profile.heroes.mage.ranks[id]=rank;profile.loadouts.mage=[id];
 const b=C.createBattle(1,profile,'practice',{party:['mage'],wind:0,distance:700});
 const floor={id:'floor',x:0,y:1000,w:3000,h:500,mat:'rock',hp:99999,maxHp:99999,indestructible:true};
 Object.assign(b,{width:3000,height:1500,terrain:[floor],fields:[],drafts:[],waters:[],rng:123456,wind:0});
 b.units=b.units.filter(u=>u.side===0&&u.cls==='mage').slice(0,1);const u=b.units[0];
 Object.assign(u,{x:300,y:1000,vx:0,vy:0,attack:2.37,armor:0,maxHp:10000,hp:9000,maxFocus:10000,focus:9000,ranks:{M01:1,[id]:rank,MP01:3,MP05:2},loadout:[id],acted:false,airborne:false,jumping:false,angle:0,lastPower:.5,critChance:0});
 b.active=u.id;b.side=0;b.phase='aim';
 const t=C.makeUnit('archer',1,1100,1000,{id:'target',hp:1e8,maxHp:1e8,armor:0,shield:0,attack:1});b.units.push(t);
 const e=new C.Engine(b);e.checkEnd=()=>false;const hits=[],hurt=e.hurt.bind(e);
 e.hurt=(v,amount,...args)=>{const hp=v.hp;hurt(v,amount,...args);if(v.id===t.id&&v.hp<hp)hits.push({raw:amount,hp:hp-v.hp});};
 assert(e.fire(id,0,.5),`launch ${id}`);return {C,b,e,u,t,p:b.projectiles[0],floor,hits,profile};
}
function contact(f,p=f.p){return {x:f.t.x,y:f.t.y-f.t.h*.5,t:0,n:{x:-1,y:0},unit:f.t};}
function terrain(f,x=1100,y=1000){return {x,y,t:0,n:{x:0,y:-1},terrain:f.floor};}
function strike(f){
 const {C,b,e,p,t}=f,id=p.skill;
 if(['M07','M08','M10','M09','M99'].includes(id)){
  e.impact(p,terrain(f));b.side=1;b.phase='enemy';
  if(id==='M10'){Object.assign(f.u,{x:1100,y:1000});}
  C.tickRedesign(e,0);
  if(id==='M99'){t.x=1400;C.tickRedesign(e,0);}
  if(['M07','M08'].includes(id)){b.round++;C.tickRedesign(e,0);}
 }else if(id==='M02'){
  e.impact(p,contact(f));assert(e.detonateIceGourd());
 }else if(['M14','M15'].includes(id)){
  p.targetPoint={x:id==='M14'?t.x-540:t.x,y:t.y-t.h*.5};p.age=1;C.redesignStep(e,p,0);
 }else if(id==='M12'){
  p.launchX=900;p.launchY=850;e.impact(p,terrain(f,1300,850));e.impact(p,terrain(f,1100,1100));
 }else e.impact(p,contact(f));
 if(id==='M05'){p.age=.36;C.redesignStep(e,p,0);}
 if(id==='M13'){p.age=.99;C.redesignStep(e,p,0);for(const q of [...b.projectiles].filter(q=>q.mode==='microWait')){q.x=t.x;q.y=t.y-t.h*.5;q.age=.3;C.redesignStep(e,q,0);}}
 for(const q of [...b.projectiles].filter(q=>q.secondary&&['fireChip','frostChip'].includes(q.mode)))e.impact(q,contact(f,q));
 return {hits:f.hits,slowed:plain(t.slowed||null),moveLeft:t.moveLeft,stake:b.stakes?.map(z=>({skill:z.skill,expires:z.expires,damage:z.damage})),hp:f.u.hp,focus:f.u.focus};
}
const ids=Object.values(cores[1].SKILLS).filter(s=>s.cls==='mage'&&s.redesigned&&!s.passive&&!s.enemyOnly).map(s=>s.id);
assert.equal(ids.length,16);
for(const rank of [1,8])for(const id of ids){
 const fs=cores.map(C=>arena(C,id,rank));
 near(fs[1].p.damage,fs[0].p.damage*1.2,`${id} SP${rank} launch`);
 const before=fs.map(f=>({speed:f.e.effective(f.C.SKILLS[id],f.u).speed,radius:f.p.blast,cost:f.e.manaCost(f.C.SKILLS[id],f.u),attack:f.u.attack,effectBoost:f.p.effectBoost}));assert.deepEqual(before[0],before[1]);
 const results=fs.map(strike);assert.equal(results[1].hits.length,results[0].hits.length,`${id} hit count`);
 if(!['M10','M09'].includes(id))assert(results[0].hits.length>0,`${id} must exercise real HP damage`);
 for(let i=0;i<results[0].hits.length;i++){const a=results[0].hits[i],b=results[1].hits[i];near(b.raw,a.raw*1.2,`${id} SP${rank} hit ${i}`);assert(Math.abs(b.hp-a.hp*1.2)<=1.2,`${id} rounded HP damage`);}
 assert.deepEqual(results[0].slowed,results[1].slowed,`${id} CC unchanged`);assert.equal(results[0].moveLeft,results[1].moveLeft);
 if(results[0].stake)for(let i=0;i<results[0].stake.length;i++){near(results[1].stake[i].damage,results[0].stake[i].damage*1.2,id+' stored damage');assert.equal(results[1].stake[i].expires,results[0].stake[i].expires);}
 assert.equal(results[0].hp,results[1].hp,`${id} healing unchanged`);assert.equal(results[0].focus,results[1].focus);
 rows.push({id,rank,hits:results[1].hits.length,launchBefore:fs[0].p.damage,launchAfter:fs[1].p.damage});
}
// Each live reflection generation inherits one 1.20, rather than 1.20^generation.
for(let rank=1;rank<=8;rank++){
 const fs=cores.map(C=>arena(C,'M11',rank));
 for(let generation=0;generation<fs[1].C.waveReflectionPlan(rank).length;generation++){
  for(const f of fs)for(const p of [...f.b.projectiles])f.e.impact(p,terrain(f));
  assert.equal(fs[0].b.projectiles.length,fs[1].b.projectiles.length);
  for(let i=0;i<fs[0].b.projectiles.length;i++)near(fs[1].b.projectiles[i].damage,fs[0].b.projectiles[i].damage*1.2,'reflection inheritance');
 }
 for(const f of fs)for(const p of [...f.b.projectiles])f.e.impact(p,contact(f,p));
 for(let i=0;i<fs[0].hits.length;i++)near(fs[1].hits[i].raw,fs[0].hits[i].raw*1.2,'terminal reflection HP hit');
}
// Scope: all other classes, enemy/neutral mages, summoned actors and legacy enemy skill copies.
for(const [cls,side,summoned] of [['archer',0,false],['knight',0,false],['occultist',0,false],['mage',1,false],['mage',2,false],['mage',0,true]]){
 const values=cores.map(C=>{const f=arena(C),u={...f.u,cls,side,summoned};return Object.values(C.SKILLS).filter(s=>s.cls===cls).map(s=>f.e.effective(s,u));});assert.deepEqual(plain(values[0]),plain(values[1]),`${cls}/${side}/${summoned} unchanged`);
}
for(const id of Object.values(cores[1].SKILLS).filter(s=>s.cls==='mage'&&(s.enemyOnly||!s.redesigned)).map(s=>s.id)){
 const values=cores.map(C=>{const f=arena(C);return f.e.effective(C.SKILLS[id],f.u);});assert.deepEqual(plain(values[0]),plain(values[1]),id+' legacy/NPC skill unchanged');
}
// Resuming old projectiles and installed stakes never rewrites their persisted damage.
for(const id of ['M11','M07']){
 const old=arena(cores[0],id);if(id==='M07')old.e.impact(old.p,terrain(old));
 const saved=plain(old.b),resumed=new cores[1].Engine(saved);
 assert.deepEqual(plain(saved.projectiles),plain(old.b.projectiles));assert.deepEqual(plain(saved.stakes||[]),plain(old.b.stakes||[]));
 if(id==='M11'){resumed.impact(saved.projectiles[0],terrain(old));near(saved.projectiles[0].damage,old.p.damage*.82,'old in-flight damage keeps old budget');}
 saved.projectiles=[];saved.phase='aim';saved.side=0;const u=resumed.unit(saved.active);u.acted=false;u.focus=10000;assert(resumed.fire(id,0,.5));near(saved.projectiles[0].damage,arena(cores[1],id).p.damage,'next resumed cast uses new budget');
}
await mkdir('_local/reports/damheo-damage',{recursive:true});await writeFile('_local/reports/damheo-damage/contracts.json',JSON.stringify({status:'passed',scope:'Production VM launch and actual HP hits; no browser execution',rows},null,2)+'\n');
console.log('PASS Damheo damage: all 16 skills SP1/8, real HP, secondary/delayed/placed hits, all reflection generations, support/scope/save isolation');
