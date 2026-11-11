/** Authored guard placement and real projectile regressions for the two approaches. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {authorAct4Stage38} from '../shared/act4-stage38-author.mjs';
import {supportPoint} from '../shared/act4-finale-revision.mjs';

process.env.HONRO_ACT4_RELEASE='1';
const g=await runtime({legacyMaps:false,productionStory:true});
const C=g.HONRO_CORE;
const source=JSON.parse(await readFile('shared/data/act4/world.json','utf8'));
const original=source.stages.find(s=>s.metadata.stageId===38);
const revised=authorAct4Stage38(original,supportPoint);
const profile=g.HonroMaps.profileFor(original);
g.HonroEquipment.migrate(profile);
profile.settings.difficulty='story';
const battle=stage=>g.HonroMaps.createBattle(stage,g.HONRO_PROJECT,profile,{origin:'campaign'});
const before=battle(original),after=battle(revised);
assert.deepEqual(after.units.map(u=>u.id),before.units.map(u=>u.id));
assert.equal(after.honroCampaignMapRevision,before.honroCampaignMapRevision);
assert.equal(JSON.stringify(after.honroAct4Design),JSON.stringify(before.honroAct4Design));
assert.equal(JSON.stringify(after.terrain),JSON.stringify(before.terrain));
for(const u of after.units){
 const old=before.units.find(v=>v.id===u.id);
 assert.deepEqual([u.hp,u.attack,u.loadout],[old.hp,old.attack,old.loadout]);
}

const archerId='a4-38-f-1',guardId='a4-38-e-1';
assert(!C.validTerrainContactPose(before.terrain,before.units.find(u=>u.id===archerId)));
for(const id of [archerId,guardId])assert(C.validTerrainContactPose(after.terrain,after.units.find(u=>u.id===id)));
for(const [i,x] of [5130,5300].entries()){
 const pursuer=after.units.find(u=>u.id===`a4-38-pursuer-${i}`);
 const pt=supportPoint(revised,'approved38-rescue-ledge',x);
 assert(g.HonroTerrain.separated(after,pursuer,pt.x,pt.y,12),'authored pursuit stop remains clear');
}

function shot(world,id,skillId,point){
 const e=new C.Engine(structuredClone(world)),b=e.b,enemy=e.unit(id),target=e.unit('archer');
 Object.assign(target,point);
 enemy.facing=target.x<enemy.x?-1:1;
 const skill=C.SKILLS[skillId];
 const choices=e.shotSeeds(enemy,skill,target).filter(({angle,power})=>{
  return Math.cos(angle*Math.PI/180)*enemy.facing>0
   && e.predict(enemy,skill,angle,power,target,false).unit===target.id
   && C.shotViable(e,enemy,skill,target,angle,power).ok;
 });
 return {e,b,enemy,target,choices};
}
for(const [id,skill,point] of [
 [archerId,'LA01',{x:4838,y:2474}], // Normal rock-step route position from the lower run.
 [guardId,'HWD01',supportPoint(revised,'approved38-upper',5000)],
]){
 if(id===guardId)assert.equal(shot(before,id,skill,point).choices.length,0);
 const {e,b,enemy,target,choices}=shot(after,id,skill,point);
 assert(choices.length>0,'the existing attack has a safe line to the traversal');
 const hp=target.hp;
 Object.assign(b,{phase:'enemy',side:1,active:enemy.id});
 const {angle,power}=choices[0];
 assert(e.fire(skill,angle,power,true));
 for(let i=0;i<900&&b.projectiles.length;i++)for(const p of [...b.projectiles])e.stepProjectile(p,C.STEP);
 assert(target.hp<hp,'the actual projectile hits at the selected route position');
}
console.log('PASS Stage38 supported guards, pursuit clearance, unchanged objective and actual arrows from both approaches');
