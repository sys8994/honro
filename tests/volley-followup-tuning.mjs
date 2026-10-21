/** Real scheduled releases: main shot, follow-up damage, timing, count and save scope. */
import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
const {HONRO_CORE:C}=await runtime(),near=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
for(const rank of [1,4,8])for(const id of ['A01','A04']){
 const profile=C.defaults();profile.heroes.archer.xp=C.xpAtLevel(30);
 const savedHero=JSON.stringify(profile.heroes.archer),b=C.createBattle(1,profile,'practice',{party:['archer'],wind:0});
 b.units=b.units.filter(u=>u.side===0).slice(0,1);b.fields=[];b.waters=[];
 const u=b.units[0];Object.assign(u,{ranks:{A01:1,[id]:4,AP01:rank},loadout:[id],focus:10000,maxFocus:10000,critChance:0,acted:false});
 const e=new C.Engine(b);e.random=()=>.5;b.active=u.id;b.side=0;b.phase='aim';
 const control=structuredClone(b),ce=new C.Engine(control);ce.unit(u.id).ranks.AP01=0;ce.random=()=>.5;
 assert(ce.fire(id,20,.5));const expectedMain=control.projectiles.map(p=>p.damage);
 assert(e.fire(id,20,.5));const roots=[...b.projectiles],template=b.volley.template,focus=u.focus;
 assert.deepEqual(roots.map(p=>p.damage),expectedMain);const mainDamage=roots.map(p=>p.damage);
 e.stepVolley(.499);assert.equal(b.projectiles.length,roots.length);
 e.stepVolley(.001);
 for(let index=1;index<=Math.min(5,rank);index++){
  if(index>1)e.stepVolley(.5);
  const released=b.projectiles.filter(p=>p.repeatIndex===index);
  assert.equal(released.length,roots.length,'fan pattern count remains intact');
  for(const p of released){
   near(p.damage/template.damage,(.42+.02*Math.min(4,rank-1)+.045*Math.max(0,rank-5))*.75*.66**(index-1));
   assert(p.followup&&p.autonomous);assert.equal(p.shot,template.shot);
  }
  near(u.focus,focus);assert.deepEqual(roots.map(p=>p.damage),mainDamage,'main damage remains unchanged');
 }
 e.stepVolley(10);assert.equal(b.projectiles.length,roots.length*(1+Math.min(5,rank)));
 assert.equal(b.volley,undefined);assert.equal(JSON.stringify(profile.heroes.archer),savedHero);
 console.log('PASS',id,'AP01 rank',rank,'main/follow-ups/timing/count/no additional cost');
}
