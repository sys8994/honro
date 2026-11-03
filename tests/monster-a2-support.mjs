/** Isolated real planner/action tests. Authored Stage24 approach is tested separately. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {monsterCore,arena,solid,turn} from './monster-effects-helpers.mjs';
const {C,g}=await monsterCore();vm.runInContext("globalThis.A2=load('monsterA2');globalThis.AI=load('enemyAI');",g);const {A2,AI}=g;
function fixture(){const q=arena(C),{b,caster:u,friend:a}=q;b.honroMonsterCombatRevision=2;Object.assign(u,{honroMonsterA2Kind:'seer',honroMonsterMarkAlly:a.id,loadout:['LM01'],moveLeft:400});Object.assign(a,{x:470,side:1,loadout:['LA01']});return q;}
const q=fixture(),x=q.caster.x,move=q.caster.moveLeft;
assert(A2.monsterSeerHoldsFormation(q.e,q.caster));
assert.equal(AI.planEnemyMove(q.e,q.caster,q.hero),undefined);assert.equal(q.caster.x,x);assert.equal(q.caster.moveLeft,move);
turn(q,q.caster);assert(A2.beginMonsterA2Action(q.e,q.caster,q.hero));assert.equal(q.caster.monsterA2Warning.kind,'mark');assert.equal(q.caster.x,x,'normal preparation holds formation');assert.equal(q.b.phase,'review','preparation enters normal paid-action completion');q.e.finishAction(true);assert(q.caster.acted,'preparation consumes normal action');
for(const reason of ['legacy','a1','dead','captured','converted','enthralled','wrong-skill','far','wall','airborne']){
 const p=fixture();if(reason==='legacy')delete p.b.honroMonsterCombatRevision;if(reason==='a1'){delete p.b.honroMonsterCombatRevision;p.b.honroMonsterEffectsRevision=1;}
 if(reason==='dead')p.friend.dead=true;if(reason==='captured')p.friend.eaterCapturedBy='captor';if(reason==='converted')p.friend.side=0;if(reason==='enthralled')p.friend.enthrall=1;
 if(reason==='wrong-skill')p.friend.loadout=['LM01'];if(reason==='far')p.friend.x=1100;if(reason==='wall')p.b.terrain.push(solid('wall',410,500,5,300));if(reason==='airborne')p.caster.y-=100;
 assert.equal(A2.monsterSeerHoldsFormation(p.e,p.caster),false,reason+' falls through to existing AI');
 if(reason==='legacy'||reason==='a1'){
  const withMetadata=AI.planEnemyMove(p.e,p.caster,p.hero);delete p.caster.honroMonsterA2Kind;delete p.caster.honroMonsterMarkAlly;
  assert.deepEqual(JSON.parse(JSON.stringify(withMetadata??null)),JSON.parse(JSON.stringify(AI.planEnemyMove(p.e,p.caster,p.hero)??null)),reason+' planner unchanged');
 }
}
console.log('PASS A2 support: grounded formation holds, paid mark, ten invalid/legacy fallbacks, legacy planner equality');
{
 const p=fixture(),before=JSON.stringify(p.b);
 for(let i=0;i<20;i++)assert(A2.monsterSeerCanPrepare(p.e,p.caster,p.hero));
 assert.equal(JSON.stringify(p.b),before,'readiness does not mutate RNG, IDs, or state');
 const rows=AI.rankEnemyQueue(p.e,[p.caster,p.friend]);
 assert.equal(rows.find(r=>r.unit===p.caster).tier,2,'valid support is ordinary ready-action tier');
 assert.equal(rows.find(r=>r.unit===p.friend).tier,2,'ordinary shooter shares same tier');
 assert.equal(rows[0].unit,p.friend,'support has no reserved first position');
 assert.equal(rows.length,2,'ranking creates no extra actors/actions');
 assert(A2.monsterLinkedFiringFormation(p.e,p.friend,p.hero));
 assert.equal(AI.planEnemyMove(p.e,p.friend,p.hero),undefined,'viable grounded paired shooter retains stance');
 const move=p.friend.moveLeft,x=p.friend.x;assert.equal(p.friend.moveLeft,move);assert.equal(p.friend.x,x);
 p.caster.monsterA2Cooldown=1;assert(!A2.monsterSeerCanPrepare(p.e,p.caster,p.hero));assert(!A2.monsterLinkedFiringFormation(p.e,p.friend,p.hero));
}
for(const reason of ['danger','critical-hp','blocked','dead-source','legacy']){
 const p=fixture();if(reason==='danger')p.b.zones.push({id:'danger',x:p.friend.x,y:p.friend.y,radius:100,kind:'fire'});
 if(reason==='critical-hp')p.friend.hp=p.friend.maxHp*.2;
 if(reason==='blocked')p.b.terrain.push(solid('target-wall',540,500,4,300));
 if(reason==='dead-source')p.caster.dead=true;
 if(reason==='legacy')delete p.b.honroMonsterCombatRevision;
 const actual=AI.planEnemyMove(p.e,p.friend,p.hero);delete p.caster.honroMonsterA2Kind;
 const legacy=AI.planEnemyMove(p.e,p.friend,p.hero);
 assert.deepEqual(JSON.parse(JSON.stringify(actual??null)),JSON.parse(JSON.stringify(legacy??null)),reason+' retains ordinary movement decisions');
}
console.log('PASS A2 readiness: pure shared predicate, equal normal tier/order, viable firing hold, safety/legacy fallback equivalence');
