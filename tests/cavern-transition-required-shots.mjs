import {beforeCurrentStage11Ravine,historicalStage11Runtime} from './stage11-ravine-history-helpers.mjs';
// Original Stage11/17 transition checks remain active after exact reversal;
// current ravine/worksite traversal, shots and combat are independently required.
// Required attack sites are staged once; actual basic projectiles then hit the
// original target with original collision geometry. This is not a combat clear.
import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';import {assertStanding,coordinates} from './act2-spatial-test-helpers.mjs';
const g=historicalStage11Runtime(await runtime({legacyMaps:false})),C=g.HONRO_CORE,rows=[];
const fixture=id=>{const q=battlefield(g,id);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct2.attach(q.app,q.e);return q;};
const check=(name,fn)=>{const detail=fn();rows.push({name,passed:true,...detail});console.log('PASS',name,JSON.stringify(detail));};
for(const id of [11,12,13,17,18,19,20]){const space=g.HONRO_PROJECT.stages[id-1].design.space;
 for(const step of g.HONRO_CONTENT.stages[id-1].steps.filter(s=>s.kind==='destroy'))check(`${id}/${step.id}: actual projectile reaches the destructible target`,()=>{
  const {b,e}=fixture(id),site=space.sites[step.id],u=e.heroesAlive().find(u=>u.cls===(step.requiredClass||'archer'));
  const t=b.terrain.find(t=>t.id===step.id);assert(t&&site.target,'target geometry and declared site required');
  // Isolate the authored firing position, without moving the target or roof.
  b.units=[u];b.active=u.id;e.checkEnd=()=>false;Object.assign(u,{...coordinates(site.standing),vx:0,vy:0});
  g.HonroAct2.memory(b).silenced=true;g.HonroAct2.memory(b).done.brace=true;
  assertStanding(g,b,e,site.standing,u,step.id+' firing position');
  if(t.honroRockfall)assert(u.x<=t.x-150||u.x>=t.x+t.w+150,step.id+' firing point inside the rockfall footprint');
  const skill=C.SKILLS[C.baseSkill(u.cls)],powers=[.2,.35,.5,.65,.8,1],direct=Math.atan2(u.y-u.h*.6-(t.y+t.h*.5),t.x+t.w*.5-u.x)*180/Math.PI;
  const angles=[direct,...Array.from({length:97},(_,j)=>-12+j*2)];let aim=null;
  for(const power of powers){for(const angle of angles){const p=e.predict(u,skill,angle,power,undefined,false,true);if(p.terrain===t.id){aim={angle,power};break;}}if(aim)break;}
  assert(aim,`${id}/${step.id}: no legal ${skill.id} path from declared standing site`);
  const before=t.hp;assert(e.fire(skill.id,aim.angle,aim.power));
  for(let frame=0;frame<1800&&b.projectiles.length;frame++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);
  assert(t.hp<before||t.broken,step.id+' prediction succeeded but live projectile never damaged target');
  return{standing:coordinates(site.standing),skill:skill.id,...aim,damage:before-t.hp};
 });
}
await mkdir('_local/reports/cavern-transitions',{recursive:true});await writeFile('_local/reports/cavern-transitions/required-shots.json',JSON.stringify(rows,null,2));
