import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
const {HONRO_CORE:C}=await runtime({legacyMaps:false}),near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
for(const rank of [1,4,8]){
 const g=C.skillGeometry(C.SKILLS.M03,rank,1000,800,0),k=rank-1;
 near(g.radius,150+5*k);near(g.span,(60+8*k)*Math.PI/180);near(g.thickness,(30+2*k)*1.12);
 const path=C.geometryPaths(g)[0],length=path.slice(1).reduce((sum,v,i)=>sum+Math.hypot(v.x-path[i].x,v.y-path[i].y),0);
 assert(Math.abs(length-g.radius*g.span)<.15,'rendered arc follows the actual radius/span');
 for(const id of ['M03','M14','M12','M15']){
  const shape=C.skillGeometry(C.SKILLS[id],rank,1000,800,0,.5,[{x:1200,y:600},{x:1300,y:800}],{x:1000,y:800});
  const old={...shape,thickness:shape.thickness/1.12},point=C.geometryPaths(shape)[0][0];
  assert(C.geometryHits(shape,{x:point.x,y:point.y+40,h:80,r:8}).count>0,id+' rendered path really hits');
  assert(shape.thickness>old.thickness,id+' actual contact band expands');
 }
 const profile=C.defaults();profile.heroes.mage.xp=C.xpAtLevel(20);profile.heroes.mage.ranks={M01:1,M07:rank,MP02:rank};
 const b=C.createBattle(1,profile,'practice',{party:['mage'],wind:0});b.units=b.units.filter(u=>u.side===0).slice(0,1);b.waters=[];b.fields=[];
 const u=b.units[0];Object.assign(u,{x:400,y:1000,attack:1,ranks:{M01:1,M07:rank,MP02:rank},loadout:['M07'],focus:10000,maxFocus:10000,critChance:0,acted:false});
 b.terrain=[{id:'floor',x:0,y:1000,w:3000,h:500,mat:'rock',hp:99999,maxHp:99999}];b.phase='aim';b.active=u.id;b.side=0;
 const e=new C.Engine(b);assert(e.fire('M07',0,.5));const p=b.projectiles[0];e.impact(p,{x:1000,y:1000,t:0,n:{x:0,y:-1},terrain:b.terrain[0]});const z=b.stakes[0],ranges=C.stakeRanges(e,z);
 near(ranges.trigger,45+25*k/7);near(ranges.effect,95+30*k/7);
 const target=C.makeUnit('archer',1,1000+ranges.trigger+3,1000,{id:'trigger-test',hp:10000,maxHp:10000,armor:0,fixed:true});b.units.push(target);
 b.side=1;b.phase='enemy';C.tickRedesign(e,0);assert(target.hp<10000,'SP-grown trigger activates actual damage');const hp=target.hp;C.tickRedesign(e,0);assert.equal(target.hp,hp,'no duplicate trigger');
 const t=C.passiveTuning(rank);near(t.gourdSecondary,.09*rank*1.18);near(t.geometry,.06*rank*1.18);near(t.maxMana,.03*rank*1.18);
 near(t.missRefund,(.18+.08*k)*1.18);assert(t.missRefund<1);near(t.ward,(.025+.020*rank)*1.18);assert(t.wardCap<.3);
 u.ranks.MP03=rank;u.focus=0;b.active=u.id;b.cast={owner:u.id,skill:'M06',shot:2,cost:100,enemyDamage:0};
 C.finishRedesign(e,false);near(u.focus,100*t.missRefund);C.finishRedesign(e,false);near(u.focus,100*t.missRefund);
 u.ranks.MP04=rank;u.shield=0;u.maxHp=1000;u.hp=1000;
 for(let shot=10;shot<20;shot++){e.hurt(target,1,u.id,false,{...p,skill:'M06',shot});const shield=u.shield;e.hurt(target,1,u.id,false,{...p,skill:'M06',shot});assert.equal(u.shield,shield,'one ward per cast');}
 assert.equal(u.shield,Math.round(1000*t.wardCap),'actual ward stacking respects shared cap');
 b.spBalanceRevision=1;const oldMp=Math.round((120+19*8)*(1+.03*rank));Object.assign(u,{maxFocus:oldMp,focus:oldMp*.37,hp:531,attack:9.123,moveLeft:137});
 const npc=C.makeUnit('mage',0,700,1000,{id:'campaign-npc',honroAlly:true,hp:123,maxHp:321,attack:.7,regen:3,focus:17,maxFocus:31});b.units.push(npc);
 const original=structuredClone(b),heroBefore=JSON.stringify(b.heroes);C.applySpBalanceMigration(b);
 const after=structuredClone(b);delete after.spBalanceRevision;delete original.spBalanceRevision;
 for(const v of [after.units[0],original.units[0]])for(const key of ['maxFocus','focus','regen'])delete v[key];
 assert.deepEqual(after,original,'revision1→2 only changes Damheo MP/regen, preserving NPC/HP/other combat state');
 near(u.focus/u.maxFocus,.37);assert.equal(JSON.stringify(b.heroes),heroBefore);const once=JSON.stringify(b);C.applySpBalanceMigration(b);assert.equal(JSON.stringify(b),once);
 u.ranks.MP05=rank;u.jucheonReady=true;const expected=([.04,.05,.06,.08,.10,.12,.14,.15][k]+.02*k)*1.18;
 near(C.jucheonBoost(u,C.SKILLS.M06),expected);C.beginPlayerCast(e,u,C.SKILLS.M06,0);assert(!u.jucheonReady);assert.equal(u.jucheon,0);assert.equal(C.jucheonBoost(u,C.SKILLS.M06),0,'free amplified cast cannot recharge itself');
 console.log('PASS rank',rank,'arc length',+(g.radius*g.span).toFixed(2),'M07 trigger/effect',ranges.trigger,ranges.effect,'passive coefficients/caps/one-use');
}
