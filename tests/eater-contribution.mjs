import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,P=g.HonroProgression;
const q=battlefield(g,16),heroes=q.b.units.filter(u=>u.side===0&&!u.summoned&&!u.enthrall),owner=heroes.find(u=>u.cls==='occultist'),archer=heroes.find(u=>u.cls==='archer');
q.b.units=heroes;q.b.terrain=[{id:'floor',x:0,y:1500,w:q.b.width,h:500,mat:'rock',hp:99999,maxHp:99999}];q.b.waters=[];q.b.fields=[];q.e.random=()=>1;
Object.assign(owner,{x:500,y:1500,level:15,ranks:{O14:8}});Object.assign(archer,{x:300,y:1500,critChance:0,ranks:{},loadout:[]});
const foes=Array.from({length:10},(_,i)=>C.makeUnit('archer',1,1000+i*4,1500,{id:'xp-eater-'+i,hp:1000,maxHp:1000,armor:.7,shield:900,awake:true,damageBy:{},xpBudget:100,loadout:['LA01']}));q.b.units.push(...foes);const ledger=P.contributionState(q.b);ledger.enemies={};const s=q.e.spawnSummon(owner,'eater',1000,1500,1,8),hp=s.hp,kills=q.b.kills;
q.e.hurt(s,100,archer.id,false,undefined,undefined,'salheun');assert(foes.every(v=>v.hp===900));assert(foes.every(v=>ledger.enemies[v.id].damage.archer===10));assert(!ledger.enemies[s.id]);q.e.hurt(s,99999,archer.id,false,undefined,undefined,'salheun');assert(foes.every(v=>v.hp===1000-hp));assert(foes.every(v=>Math.abs(ledger.enemies[v.id].damage.archer-hp/10)<1e-8));assert.equal(q.b.kills,kills);assert(foes.every(v=>!v.eaterCapturedBy));
// A second prison still uses the same finite original enemy ledger, not a new XP actor.
const s2=q.e.spawnSummon(owner,'eater',foes[0].x,1500,1,8);for(const v of foes)if(v.eaterCapturedBy===s2.id){v.hp=30;v.honroContributionDamage=970;}
q.e.hurt(s2,50,archer.id,false,undefined,undefined,'salheun');const dead=foes.filter(v=>v.dead);assert(dead.length>0);assert.equal(q.b.kills,kills+dead.length);assert(dead.every(v=>v.killRewarded));assert(!ledger.enemies[s2.id]);
console.log('PASS production contribution ledger: ten equal transfers, finite original HP and genuine kill credit only');
