import assert from 'node:assert/strict';
import test from 'node:test';
import {planThresholdPrep} from '../shared/runtime/act6-threshold-prep.mjs';
const make=(cls,ids=[])=>({side:0,id:cls,cls,hp:43,maxHp:65,focus:16,maxFocus:48,shield:7,maxMove:70,moveLeft:40,
 equipmentState:{used:['keepsake']},equipmentIds:ids,loadout:[cls+'-basic','','',''],ranks:{}});
const C={SKILLS:{arrow:{cls:'archer'},other:{cls:'knight'},knot:{cls:'occultist'}},
 EQUIPMENT_MAP:{spare:{slot:'common'},binding:{slot:'common'},engraved:{slot:'common'},hat:{characterClass:'archer',slot:'personal'}},
 baseSkill:role=>role+'-basic',knownSkills:()=>['arrow','other','knot'],
 applyHero(u,h){u.equipmentIds=h.equipmentIds;u.maxMove=90;u.hp+=12;u.focus+=12;u.shield=38;u.equipmentState.used.push('candidate-only');}};
const profile={heroes:{},equipment:{ownedItemIds:['binding','engraved','spare','hat']}};
const data=()=>{
 const archer=make('archer'),knight=make('knight'),sodan=make('occultist',['binding']),mage=make('mage',['engraved']);
 const actors=[archer,knight],custody=[...actors,sodan,mage],draft={archer:{skills:['arrow','',''],gear:['hat','spare']},knight:{skills:['other','',''],gear:['','']}};
 return {archer,actors,custody,draft};
};
test('55 applies only the free two and plans without refill or donor mutation',()=>{
 const {archer,actors,custody,draft}=data();
 const before=structuredClone(custody),profileBefore=structuredClone(profile);
 const changes=planThresholdPrep(C,profile,actors,draft,{count:2,custody});
 assert.equal(changes.length,2);
 assert.deepEqual(changes[0].next.equipmentIds,['hat','spare']);
 assert.deepEqual(changes[0].next.loadout,['archer-basic','arrow','','']);
 assert.deepEqual(changes.map(({next:u})=>[u.hp,u.focus,u.shield]),[[43,16,7],[43,16,7]]);
 assert.equal(changes[0].next.maxMove-changes[0].next.moveLeft,archer.maxMove-archer.moveLeft);
 assert.deepEqual(custody,before);
 assert.deepEqual(profile,profileBefore);
});
test('rejects a parked or seated companion’s gear, double allocation, unknown and duplicate arts',()=>{
 for(const apply of [
  d=>d.archer.gear[1]='binding',d=>d.archer.gear[1]='engraved',
  d=>d.knight.gear[1]='spare',d=>d.knight.gear[0]='hat',
  d=>d.knight.skills[0]='arrow',d=>d.archer.skills[1]='arrow',
  d=>d.occultist={skills:['knot','',''],gear:['','binding']}
 ]){
  const {actors,custody,draft}=data();apply(draft);
  assert.equal(planThresholdPrep(C,profile,actors,draft,{count:2,custody}),null);
 }
});
test('four-way default retains 52 and is usable for both finale checkpoints',()=>{
 const {actors,custody,draft}=data();
 assert.equal(planThresholdPrep(C,profile,actors,draft),null);
 draft.occultist={skills:['knot','',''],gear:['','binding']};
 draft.mage={skills:['','',''],gear:['','engraved']};
 const result=planThresholdPrep(C,profile,custody,draft);
 assert.ok(result.some(({u,next})=>u.cls==='occultist'&&next.loadout.includes('knot')));
 assert.equal(result.some(({u})=>u.cls==='mage'),false);
 assert.equal(planThresholdPrep(C,profile,custody,{...draft,mage:{gear:['','engraved'],skills:['other','','']}}),null);
});
