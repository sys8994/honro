// Isolated tactical geometry fixtures. Actors may be posed on a nearby exposed
// attack surface; this proves hittability, not a normal-input traversal/clear.
import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';import {support} from '../tools/map-forge/act3-map-kit.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
for(const s of g.HONRO_PROJECT.stages.slice(20))for(const group of s.encounters){
 const b=g.HonroMaps.createBattle(s,g.HONRO_PROJECT),e=new C.Engine(b,()=>{},true),hero=['archer','mage','occultist'].map(cls=>b.units.find(u=>u.side===0&&u.cls===cls)).find(Boolean),targets=b.units.filter(u=>group.unitIds.includes(u.id));e.checkEnd=()=>false;
 // The fixture concerns a reachable combat space after its authored door opens.
 for(const t of b.terrain)if(t.honroAct3Gate)t.broken=true;
 let hit=null;for(const target of targets){for(const dx of [-260,-420,260,420]){const spot=support(g,b.terrain.filter(t=>!t.broken),target.x+dx,target.y);if(!spot||Math.abs(spot.y-target.y)>380)continue;Object.assign(hero,spot);if(!C.validTerrainContactPose(b.terrain,hero))continue;b.units=[hero,target];b.active=hero.id;const skill=C.SKILLS[hero.cls==='archer'?'A01':hero.cls==='mage'?'M01':'O01'];
  for(const aim of e.shotSeeds(hero,skill,target)){const pred=e.predict(hero,skill,aim.angle,aim.power,target,false);if(pred.unit===target.id){hit={target:target.id,from:{x:hero.x,y:hero.y},to:{x:target.x,y:target.y},aim};break;}}
  if(hit)break;}if(hit)break;}
 assert(hit,`${s.id}/${group.id}: no active-team basic firing approach`);
 const target=b.units.find(u=>u.id===hit.target),before=target.hp;b.phase='aim';b.side=0;hero.acted=false;const fired=e.fire(hero.cls==='archer'?'A01':hero.cls==='mage'?'M01':'O01',hit.aim.angle,hit.aim.power);for(let i=0;i<2400&&b.projectiles.length;i++)for(const q of [...b.projectiles])if(b.projectiles.includes(q))e.stepProjectile(q,C.STEP);
 assert(fired&&target.hp<before,`${s.id}/${group.id}: live basic projectile must agree with prediction`);rows.push({stage:s.metadata.stageId,group:group.id,...hit,damage:before-target.hp});console.log('PASS',s.id,group.id);
}
await mkdir('_local/reports/act3-encounters',{recursive:true});await writeFile('_local/reports/act3-encounters/shots.json',JSON.stringify({scope:'One actual projectile hit from a supported nearby attack position per authored group, after opening mission gates. Synthetic positions, not a traversal, all-target reachability or player input claim.',rows},null,2));
