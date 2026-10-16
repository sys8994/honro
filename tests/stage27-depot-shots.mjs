/** Normal basic skill costs, full roster retained; controlled attack positions.
 * Live projectile tests, not normal-input stage completion. */
import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
for(const [x,y]of[[4780,4850],[5660,4850]]){
 const{b,e}=battlefield(g,27),u=b.units.find(u=>u.side===0&&u.cls==='archer'),targets=b.units.filter(u=>u.side===1&&u.x>5000&&u.x<5600),count=b.units.length;
 Object.assign(u,{x,y,vx:0,vy:0,airborne:false,jumping:false,acted:false});b.active=u.id;b.side=0;b.phase='aim';let hit;
 for(const target of targets){for(const shot of e.shotSeeds(u,C.SKILLS.A01,target)){const pred=e.predict(u,C.SKILLS.A01,shot.angle,shot.power,target,false);if(pred.unit===target.id){hit={target,shot};break;}}if(hit)break;}
 assert(hit,'Basic projectile has a local approach from '+x);const before=hit.target.hp,focus=u.focus;
 assert(e.fire('A01',hit.shot.angle,hit.shot.power));for(let i=0;i<2400&&b.projectiles.length;i++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);
 assert(hit.target.hp<before);assert.equal(b.units.length,count);rows.push({from:{x,y},target:hit.target.id,shot:hit.shot,damage:before-hit.target.hp,focusBefore:focus,focusAfter:u.focus,fullRoster:count});
}
await writeFile('review/stage27/shot-checks.json',JSON.stringify({scope:'Controlled supported poses, actual A01 projectiles with all enemies retained and normal cost; not fullplay',rows},null,2));console.log('PASS Stage27 two opposed basic live firing approaches, full roster and normal projectile costs');
