/** Synthetic flat-lane fixtures, NOT recorded Stage40 replay or acceptance. */
import assert from 'node:assert/strict';
import {monsterCore,solid} from '../../tests/monster-effects-helpers.mjs';
import {evaluateLegalCast} from './legal-cast.mjs';
const {C}=await monsterCore(),b=C.createBattle(40,C.defaults(),'skirmish',{wind:0});
const shooter=C.makeUnit('archer',0,200,800,{id:'archer',loadout:['A01','A02'],focus:1000,maxFocus:1000,attack:2,skillRanks:{A02:5}}),enemy=C.makeUnit('knight',1,550,800,{id:'enemy',hp:10000,maxHp:10000,armor:0}),ally=C.makeUnit('occultist',0,790,800,{id:'ally',hp:10000,maxHp:10000});
Object.assign(b,{width:1600,height:1200,units:[shooter,enemy,ally],terrain:[solid('floor',0,800,1600,400)],waters:[],fields:[],zones:[],stakes:[],drafts:[],projectiles:[],wind:0,active:shooter.id,side:0,phase:'aim',events:[]});
let unsafe;for(const angle of [0,2,4,6,8])for(const power of [.3,.5,.7,.9]){const r=evaluateLegalCast(C,b,shooter.id,'A02',angle,power);if(r.enemyDamage>0&&r.friendlyDamage>0)unsafe={angle,power,...r};}
assert(unsafe,'Piercing path can strike ally beyond first enemy');assert.equal(unsafe.safe,false);console.log('PASS rejects full-path piercing friendly fire',JSON.stringify(unsafe));
const far=JSON.parse(JSON.stringify(b));far.units.find(u=>u.id==='ally').x=1400;far.units.find(u=>u.id==='ally').y=300;
const safe=evaluateLegalCast(C,far,shooter.id,'A02',unsafe.angle,unsafe.power);assert(safe.safe&&safe.enemyDamage>0);assert.equal(evaluateLegalCast(C,b,'ally','A02',0,.5).reason,'not-active');console.log('PASS separated firing lane and active-actor enforcement');
