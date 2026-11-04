/** Run in CI with existing exact synthetic initial fixture; no live App battle. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {estimateSnapshot,detachedIndependentPlanner,ESTIMATE_RANDOM,friendlyMuzzleObstruction} from '../tools/stage23-qa/independent-planning.mjs';
const source=JSON.parse(await readFile(process.env.HONRO_QA_ENTRY_PATH||'_local/stage23-final/stage23-candidate-native/initial.json','utf8'));
const original=source.battle,before=JSON.stringify(original);
assert.equal(original.honroStage,23);assert.equal(original.units.filter(u=>u.side===1).length,40);
const variants=[original,...[1,2].map(i=>({...structuredClone(original),rng:(0xf0000000+i)>>>0,damageSequence:{version:1,seed:(0x70000000+i)>>>0,index:1000*i}}))];
const normalized=variants.map(estimateSnapshot);
assert.deepEqual(normalized[0],normalized[1]);assert.deepEqual(normalized[0],normalized[2]);
// Verify normalization happens before any Engine constructor code runs.
class CheckEngine{constructor(b){assert.equal(b.rng,ESTIMATE_RANDOM.rng);assert.deepEqual(b.damageSequence,{version:1,seed:ESTIMATE_RANDOM.damageSeed,index:0});this.b=b;}unit(id){return this.b.units.find(u=>u.id===id);}}
for(const b of variants){const p=detachedIndependentPlanner({Engine:CheckEngine},b);p.check();}
const g=await runtime({legacyMaps:false,productionStory:true}),C=g.HONRO_CORE;
function estimateDecision(b){
 const unchanged=JSON.stringify(b),p=detachedIndependentPlanner(C,b),e=p.engine,u=p.unit('p-knight'),t=p.unit('s23-B-0');
 // Predeclared candidates, no search over random seeds or future outcomes.
 const choices=[{skill:'S04',angle:35,power:.9},{skill:'S04',angle:65,power:.7},{skill:'S01',angle:35,power:.9}].map(q=>{const v=C.shotViable(e,u,C.SKILLS[q.skill],t,q.angle,q.power);return {...q,ok:v.ok,net:v.net??null,risk:v.risk,miss:v.miss,hit:{x:v.hit.x,y:v.hit.y}};});
 const chosen=choices.filter(q=>q.ok&&q.risk<1).sort((a,b)=>(b.net??0)-(a.net??0))[0]??null;
 p.check();assert.equal(JSON.stringify(b),unchanged);return {choices,chosen};
}
const decisions=variants.map(estimateDecision);
assert.deepEqual(decisions[0],decisions[1]);assert.deepEqual(decisions[0],decisions[2]);assert.equal(JSON.stringify(original),before);
// Small trigger contract without game execution or artificial product edits.
const shooter={id:'s',cls:'occultist',side:0,x:7209,y:4620,h:92,r:22,hp:100,moveLeft:100,focus:100,loadout:['O04']};
const ally={id:'a',side:0,x:7235.5,y:4620,h:92,r:22,hp:100};const target={id:'t',side:1,x:7298.9,y:4607.6,h:98,r:25,hp:30};
const fake={b:{units:[shooter,ally,target]},grounded:()=>true,skillAllowed:()=>true,cooldownLeft:()=>0,manaCost:()=>1,projectileOrigin:(u,s,a)=>({x:u.x+40*Math.cos(a*Math.PI/180),y:u.y-u.h*.63-40*Math.sin(a*Math.PI/180)})};
const obstruction=friendlyMuzzleObstruction(C,fake,shooter,target);assert.equal(obstruction?.ally,'a');assert.equal(obstruction?.distance,20);
assert.equal(friendlyMuzzleObstruction(C,{...fake,b:{units:[shooter,target]}},shooter,target),null);
console.log(JSON.stringify({passed:true,scope:'Three detached RNG variants yield identical normalized inputs and production estimates/decision, with originals unchanged. No browser run or product pacing conclusion.',estimateRandom:ESTIMATE_RANDOM,decisions,obstruction},null,2));
