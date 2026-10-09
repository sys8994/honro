/** Actual basic-sword release and negative collision controls.
 * Initial supported poses and blocked/counterfactual targets are test fixtures. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {g,C,stage,fixture,fire} from './stage18-bell-tactics-helper.mjs';
const pose=stage.design.bell.standing.closeRelease,rows=[];
const setup=(x=pose.x)=>{const q=fixture('knight',pose.surfaceId,x,{silenced:true});q.allowTargetDamage=true;const t=q.b.terrain.find(t=>t.id==='upper-chain');assert(t.honroMeleeTarget,'Canonical target explicitly opts in');return{...q,target:t};};
for(const spec of [{id:'near-basic',angle:0,power:1,damage:true},{id:'behind-sector',angle:180,power:1,damage:false},{id:'outside-sector',angle:70,power:1,damage:false},{id:'outside-range',angle:0,power:0,x:5398,damage:false},{id:'ordinary-unflagged',angle:0,power:1,flag:false,damage:false},{id:'solid-occlusion',angle:0,power:1,wall:true,damage:false},{id:'before-suppression',angle:0,power:1,locked:true,damage:false}]){
 const q=setup(spec.x),t=q.target;if(spec.flag===false)delete t.honroMeleeTarget;if(spec.locked)g.HonroAct2.memory(q.b).silenced=false;
 if(spec.wall)q.b.terrain.push({id:'fixture-solid-occluder',x:5530,y:4360,w:20,h:180,mat:'rock',indestructible:true,vertices:[{x:5530,y:4360},{x:5550,y:4360},{x:5550,y:4540},{x:5530,y:4540}]});
 const cost=q.e.manaCost(C.SKILLS.S00,q.hero,spec.power),hp=t.hp,terrain=q.b.terrain.map(z=>({id:z.id,hp:z.hp,broken:z.broken})),shot=fire(q,'S00',spec);
 assert.equal(t.hp<hp,spec.damage,spec.id);assert.equal(shot.focusSpent,cost);
 for(const z of terrain.filter(v=>v.id!=='upper-chain')){const current=q.b.terrain.find(v=>v.id===z.id);assert.equal(current.hp,z.hp);assert.equal(current.broken,z.broken);}
 rows.push({id:spec.id,from:shot.from,aim:shot.aim,hpBefore:hp,hpAfter:t.hp,focusSpent:shot.focusSpent});console.log('PASS',spec.id,hp-t.hp);
}
{
 const q=setup(),hp=q.target.hp;assert(q.e.fire('S00',0,1));q.e.tick(.035);assert.equal(q.target.hp,hp);assert.equal(q.hero.meleeAction.index,0);
 const saved=JSON.parse(JSON.stringify(q.b)),e=new C.Engine(saved,()=>{},true),app={...q.app,engine:e};g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);const target=saved.terrain.find(t=>t.id==='upper-chain');assert(target.honroMeleeTarget);for(let i=0;i<45;i++)e.tick(C.STEP);assert(target.hp<hp);assert.equal(target.hp,rows[0].hpAfter,'Windup save resumes the same one strike');rows.push({id:'windup-Continue',hpBefore:hp,hpAfter:target.hp});console.log('PASS windup-Continue exact one strike');
}
// Every other canonical chapter has zero opt-in terrain; its existing melee
// contracts are exercised by hwigyeom-p5/finale regressions in this checkpoint.
for(const st of g.HONRO_PROJECT.stages.filter(s=>s.metadata.stageId!==18))assert(!st.terrains.some(t=>t.properties?.honroMeleeTarget),'No opt-in elsewhere: '+st.id);
await mkdir('_local/reports/stage18-bell',{recursive:true});await writeFile('_local/reports/stage18-bell/melee-release.json',JSON.stringify({scope:'Supported-pose live Engine.fire/tick sword, target durability and negative fixture controls; no normal arrival or browser claim.',rows},null,2));
