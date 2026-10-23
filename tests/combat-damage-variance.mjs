import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {buildCore} from '../game/engine/build.mjs';
const g=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),g);const C=g.HONRO_CORE,plain=x=>JSON.parse(JSON.stringify(x)),near=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`),results=[];
const active=[...new Set([...C.CLASS_IDS.map(C.baseSkill),...C.TALENTS.filter(t=>!C.SKILLS[t.id].passive).map(t=>t.id)])];
assert.equal(active.length,64);assert.deepEqual(active.slice().sort(),Object.keys(C.DAMAGE_SPREAD).sort());
// Multiple full chunks: exact mean, bounded uniform spread, reproducibility and no ring repetition.
for(const spread of [.05,.10,.15]){
 const id=active.find(id=>C.DAMAGE_SPREAD[id]===spread),b={seed:19388},copy={seed:19388};const values=[];
 for(let i=0;i<8192;i++){const n=C.rollDamage(b,C.SKILLS[id]);assert.equal(n,C.rollDamage(copy,C.SKILLS[id]));values.push(n);}
 near(values.reduce((a,b)=>a+b,0)/values.length,1);assert(Math.min(...values)>=1-spread&&Math.min(...values)<1-spread+.0002);assert(Math.max(...values)<=1+spread&&Math.max(...values)>1+spread-.0002);
 assert.notDeepEqual(values.slice(0,1024),values.slice(1024,2048));assert(JSON.stringify(b.damageSequence).length<90);
 const loaded=plain(b);for(let i=0;i<1100;i++)assert.equal(C.rollDamage(b,C.SKILLS[id]),C.rollDamage(loaded,C.SKILLS[id]));
 results.push({spread,mean:values.reduce((a,b)=>a+b,0)/values.length,min:Math.min(...values),max:Math.max(...values),samples:values.length});
}
function arena(id='M06'){
 const s=C.SKILLS[id],profile=C.defaults();profile.loadouts[s.cls]=[id];const b=C.createBattle(1,profile,'practice',{party:[s.cls],wind:0}),u=b.units.find(u=>u.side===0);
 Object.assign(b,{width:3000,height:1500,terrain:[{id:'floor',x:0,y:1000,w:3000,h:500,mat:'rock',hp:99999,maxHp:99999,indestructible:true}],fields:[],drafts:[],waters:[],wind:0,practiceCombat:true});
 Object.assign(u,{x:300,y:1000,vx:0,vy:0,attack:1,hp:900,maxHp:1200,focus:9999,maxFocus:9999,loadout:[id],ranks:{[id]:1,AP01:s.cls==='archer'?1:0},armor:0,critChance:0,acted:false,airborne:false,jumping:false});
 b.units=[u,C.makeUnit('knight',1,900,1000,{id:'target',hp:90000,maxHp:90000,armor:0,shield:0,existenceDefense:{form:1,qi:1,soul:1}})];b.active=u.id;b.side=0;b.phase='aim';const e=new C.Engine(b);e.checkEnd=()=>false;return {b,u,e,t:b.units[1],s};
}
for(const id of active){const {b,u,e,s,t}=arena(id),before=b.damageSequence.index,rng=b.rng;for(let i=0;i<3;i++)e.predict(u,s,20,.5,t);assert.equal(b.damageSequence.index,before);assert.equal(b.rng,rng);assert(e.fire(id,0,.5),id+' actual Engine.fire');assert.equal(b.damageSequence.index,before+(C.DAMAGE_SPREAD[id]?1:0),id+' exactly one roll');const origins=[...b.projectiles,u.meleeAction,u.martialGuard].filter(v=>v?.damageRoll!==undefined);if(origins.length)assert.equal(new Set(origins.map(p=>p.damageRoll)).size,1,id+' roots share roll');if(b.volley){assert.equal(b.volley.template.damageRoll,origins[0].damageRoll);e.stepVolley(.5);assert.equal(new Set(b.projectiles.map(p=>p.damageRoll)).size,1);assert.equal(b.damageSequence.index,before+1);}}
// HP agrees with a unit mean control and unchanged critical/proc stream.
for(const id of ['A01','M06','S02','O04']){const f=arena(id);f.e.fire(id,0,.5);const p=f.b.projectiles[0]||{skill:id,damageRoll:f.u.meleeAction.damageRoll,owner:f.u.id,side:0,shot:f.b.shot,skillRank:1,vx:1,vy:0};const control=new C.Engine(plain(f.b)),ct=control.unit(f.t.id),hp=ct.hp;control.hurt(ct,1000,f.u.id,false,{...p,damageRoll:1});const actual=f.t.hp;f.e.hurt(f.t,1000,f.u.id,false,p);assert(Math.abs((actual-f.t.hp)-(hp-ct.hp)*p.damageRoll)<=1);assert.equal(f.b.rng,control.b.rng);}
// Reflection, burst fragments, persistent zones and installed stakes retain cast coefficient.
for(const id of ['M11','M06','M07']){const f=arena(id);f.e.fire(id,0,.5);const p=f.b.projectiles[0],roll=p.damageRoll;f.e.impact(p,{x:900,y:1000,t:0,n:{x:-1,y:0},terrain:f.b.terrain[0]});assert([...f.b.projectiles,...(f.b.stakes||[])].every(q=>q.damageRoll===roll));assert.equal(f.b.damageSequence.index,1);if(id==='M06'){f.e.createZone(p,'fire');assert.equal(f.b.zones[0].damageRoll,roll);}const resumed=new C.Engine(plain(f.b));assert.deepEqual(plain(resumed.b.damageSequence),plain(f.b.damageSequence));}
// Curse DOT / earth aura / summons are coefficients on unscaled saved damage.
for(const id of ['O10','O11','O12','O09']){const f=arena(id);f.e.fire(id,0,.5);const p=f.b.projectiles[0],roll=p.damageRoll;f.e.impact(p,{x:900,y:1000,t:0,n:{x:0,y:-1},...(id==='O10'||id==='O09'?{unit:f.t}:{terrain:f.b.terrain[0]})});if(id==='O10'){assert.equal(f.t.earthbind.damageRoll,roll);const hp=f.t.hp;f.e.tickCurses();assert(f.t.hp<hp);assert.equal(f.b.damageSequence.index,1);}else if(id==='O09')assert.equal(f.t.enthrall.damageRoll,roll);else{const ghost=f.b.units.find(u=>u.summoned);assert(ghost);assert.equal(ghost.summonDamageOrigin.damageRoll,roll);if(id==='O12'){f.e.launchSummonBolt(ghost,f.t);assert.equal(f.b.projectiles.at(-1).damageRoll,roll);}}}
// S13 is one action even when the player chooses its granted sword follow-up.
{const f=arena('S13');f.e.fire('S13',0,.5);const p=f.b.projectiles[0];for(let n=0;n<1800&&f.u.meleeFollow!=='ready';n++)f.e.tick(C.STEP);f.e.grounded=()=>true;assert.equal(f.u.meleeFollow,'ready');assert(f.e.fire('S00',0,.5));assert.equal(f.b.damageSequence.index,1);assert.equal(f.u.meleeAction.damageRoll,p.damageRoll);}
// No retroactive rerolls for a pre-policy flight. New action is the migration boundary.
{const f=arena('M06');f.e.fire('M06',0,.5);delete f.b.damageSequence;for(const p of f.b.projectiles)delete p.damageRoll;const saved=plain(f.b),e=new C.Engine(saved);assert.equal(e.b.damageSequence.index,0);assert(!('damageRoll' in e.b.projectiles[0]));e.impact(e.b.projectiles[0],{x:900,y:1000,t:0,n:{x:-1,y:0},terrain:e.b.terrain[0]});assert.equal(e.b.damageSequence.index,0);assert(e.b.projectiles.every(p=>p.damageRoll===undefined));}
// Preview runs in its own battle and leaves the campaign/profile and RNG untouched.
g.HonroScene=class{event(){}};vm.runInContext(await readFile('shared/runtime/skill-preview.js','utf8'),g);const app={profile:C.defaults()},before=JSON.stringify(app.profile);g.HonroSkillPreview.setup(app,'A01',app.profile.heroes.archer,{getBoundingClientRect:()=>({width:720,height:360})});assert.equal(JSON.stringify(app.profile),before);
await mkdir('_local/reports/combat-damage',{recursive:true});await writeFile('_local/reports/combat-damage/variance.json',JSON.stringify({distribution:results,skills:active.map(id=>({id,name:C.SKILLS[id].name,spread:C.DAMAGE_SPREAD[id]})),checks:'64 Engine casts; prediction/preview; volley; reflection/fragments/zones/stakes; curse/earth/summon/enthrall; legacy flight'},null,2));
console.log('PASS damage variance: 64 cast policies; 24,576 distribution samples; independent/reload/chunk/preview/volley/AoE/DOT/reflection/summon boundaries');
