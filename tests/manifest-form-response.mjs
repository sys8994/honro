import assert from 'node:assert/strict';
import vm from 'node:vm';
import {buildCore} from '../game/engine/build.mjs';
const g=vm.createContext({console,performance,structuredClone});
vm.runInContext(await buildCore(),g);
const C=g.HONRO_CORE,plain=x=>JSON.parse(JSON.stringify(x));
function arena(rank,form=.2){
 const profile=C.defaults(),b=C.createBattle(1,profile,'practice',{party:['occultist'],wind:0});
 const owner=b.units.find(u=>u.side===0);
 Object.assign(owner,{x:330,y:1400,focus:999,maxFocus:999,attack:1,critChance:0,loadout:['O01','O08'],ranks:{O01:1,O08:rank}});
 const target=C.makeUnit('knight',1,650,1400,{id:'manifest-target',hp:10000,maxHp:10000,armor:0,role:'ghost',spiritHidden:true,existenceDefense:{form,qi:1.05,soul:1.32},awake:true,fixed:true});
 Object.assign(b,{units:[owner,target],active:owner.id,phase:'aim',side:0,width:3200,height:1800,practiceCombat:true,waters:[],drafts:[],fields:[],terrain:[{id:'floor',x:0,y:1400,w:3200,h:400,mat:'rock',hp:99999,maxHp:99999}]});
 const e=new C.Engine(b);e.checkEnd=()=>false;e.random=()=>.99;
 return {b,e,owner,target,profile};
}
function cast(a,rank){
 a.owner.acted=false;a.owner.focus=999;a.owner.ranks.O08=rank;a.b.side=0;a.b.phase='aim';a.b.active=a.owner.id;
 assert(a.e.fire('O08',0,.5));const p=a.b.projectiles.find(p=>p.skill==='O08');assert(p);
 // Advance the real projectile until the actual contact/radius path applies the status.
 for(let i=0;i<240&&!a.target.manifested;i++)a.e.tick(1/60);
 assert(a.target.manifested,'O08 projectile must actually hit');
}
const rows=[];
for(const rank of [1,2,3,4,5,6,7,8])for(const form of [.06,.18,.2,.24,1,1.15]){
 const a=arena(rank,form),before=plain(C.effectiveDefenseForUnit(a.target));cast(a,rank);
 const after=plain(C.effectiveDefenseForUnit(a.target));
 assert(Math.abs(after.form-(form+.5+(rank-1)/7))<1e-9,`rank ${rank}, base ${form}: expected +0.5 through +1.5, got ${after.form}`);
 assert.equal(after.qi,before.qi);assert.equal(after.soul,before.soul);
 assert.equal(a.target.existenceDefense.form,form,'base resistance remains intact');
 assert(a.target.revealSpiritToParty);
 assert(C.existenceDefenseView(a.target).includes(`<strong>${Math.round(after.form*100)}%</strong>`),'unit detail displays actual response, including above 150%');
 assert(C.skillEffectRows('O08',rank).some(r=>r.label==='형 피해 반응'&&r.value===`+${+((.5+(rank-1)/7)*100).toFixed(1)}%p`),'skill detail shows rank bonus');
 const saved=C.defaults();saved.saved=a.b;const restored=C.validate(plain(saved)).saved;assert(restored);
 assert.equal(C.effectiveDefenseForUnit(restored.units.find(u=>u.id===a.target.id)).form,after.form,'save round trip retains current response');
 const arrow=C.existenceMultiplier(C.SKILLS.A01.existenceAttack,a.target);
 assert(Math.abs(arrow-Math.min(1.5,.96*after.form+.04*after.qi))<1e-9,'arrow damage follows current response and existing total cap');
 const shooter=C.makeUnit('archer',0,330,1400,{id:'arrow-test',attack:1,critChance:0});a.b.units.push(shooter);
 const shot={skill:'A01',owner:shooter.id,side:0,shot:1,skillRank:1,damage:100,x:a.target.x,y:a.target.y-50,vx:0,vy:0,mode:C.SKILLS.A01.mode,hit:[]};
 g.HONRO_DEBUG_DAMAGE=true;a.e.hurt(a.target,100,shooter.id,true,shot,shot);g.HONRO_DEBUG_DAMAGE=false;
 const trace=g.HONRO_DAMAGE_TRACE.at(-1);assert(Math.abs(trace.existenceMultiplier-arrow)<1e-9,'actual damage uses the same coefficient');
 a.e.manifest(a.target,a.owner,rank);assert.equal(C.effectiveDefenseForUnit(a.target).form,after.form,'reapplication refreshes without stacking');
 rows.push({rank,base:form,manifested:after.form,arrowMultiplier:arrow,damage:trace.finalDamage});
 a.b.round=a.target.manifestedUntil+1;a.e.tickCurses();
 assert.equal(C.effectiveDefenseForUnit(a.target).form,form,'expiry restores original form response');
}
console.log(JSON.stringify(rows.filter(r=>r.base===.2&&(r.rank===1||r.rank===8)),null,2));
console.log('Manifest form response: live projectile, ranks, species, ordinary targets, save and expiry passed');
