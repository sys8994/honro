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
