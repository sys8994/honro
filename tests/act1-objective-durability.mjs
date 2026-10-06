/** Isolated objective/damage-state fixtures, not a normal-combat clear. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {act1Runtime,fixture} from './act1-spatial-test-helpers.mjs';
const g=await act1Runtime(),{b,e,app,st}=fixture(g,5),t=b.terrain.find(t=>t.id==='cliff-cleat'),rows=[];
function check(name,fn){fn();rows.push({name,status:'passed'});console.log('PASS',name);}
check('Closed ritual still blocks target damage; the new text changes no gate',()=>{
 const hp=t.hp;e.damageTerrain(t,54.1585);assert.equal(t.hp,hp);
 assert.match(g.HonroObjectives.state(b,st).summary,/담허로 받이진/);
});
check('Existing ritual interaction reveals the actual multi-hit durability',()=>{
 const m=b.honroMarkers.find(m=>m.id==='receiver-5'),mage=e.heroesAlive().find(u=>u.cls==='mage');
 Object.assign(mage,{x:m.x,y:m.y});b.active=mage.id;assert(g.HonroInteractions.use(app,m));
 const before=JSON.stringify(b),state=g.HonroObjectives.state(b,st);assert.equal(JSON.stringify(b),before);
 assert.match(state.summary,/내구도 520\/520/);assert.match(state.targets.find(t=>t.kind==='seal').label,/520\/520/);
 assert.match(g.HonroObjectives.help(app).guide,/여러 번/);
});
check('A nonfatal real damage call visibly reduces the remaining amount, including after serialization',()=>{
 e.damageTerrain(t,54.1585);assert.equal(t.hp,465.8415);assert(!t.broken);
 const before=JSON.stringify(b),state=g.HonroObjectives.state(b,st);assert.equal(JSON.stringify(b),before);
 assert.match(state.summary,/466\/520/);assert.match(state.targets.find(t=>t.kind==='seal').label,/466\/520/);
 const resumed=JSON.parse(JSON.stringify(b));assert.equal(g.HonroObjectives.state(resumed,st).summary,state.summary);
});
check('Breaking the target removes the attack cue and preserves normal stabilization rules',()=>{
 e.damageTerrain(t,10000);assert(t.broken);const state=g.HonroObjectives.state(b,st);
 assert.match(state.summary,/고리쇠 파괴 완료/);assert(!state.targets.some(t=>t.kind==='seal'));
 assert(!state.complete,'Existing minimum-round/stabilization rules must still apply');
});
await mkdir('_local/reports/objective-durability',{recursive:true});
await writeFile('_local/reports/objective-durability/summary.json',JSON.stringify({kind:'objective-damage-state-fixtures',status:'passed',checks:rows,
 limitations:['Direct damage and ritual-position fixtures; no normal battle completion claim.','The new text still needs current-build browser readability verification.']},null,2)+'\n');
