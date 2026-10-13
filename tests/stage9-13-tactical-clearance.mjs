/** Grid clearance and a closed-gate movement probe, separate from gameplay. */
import assert from 'node:assert/strict';import {runtime,battlefield} from '../game/tests/helpers.mjs';import {mkdir,writeFile} from 'node:fs/promises';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
for(const n of [9,13])for(const cls of ['archer','mage','knight','occultist']){
const {b,e}=battlefield(g,n),u=e.heroesAlive().find(u=>u.cls===cls)||battlefield(g,13).e.heroesAlive().find(u=>u.cls===cls),floor=b.terrain.find(t=>t.id===(n===9?'yard-floor':'act2-floor'));let samples=0;
for(const [l,r]of n===9?[[610,1340],[2520,3020]]:[[1110,2130],[5270,6290]])for(let x=l;x<=r;x+=8){const pose={...u,x,y:C.topAt(floor,x)};assert(C.validTerrainContactPose(b.terrain,pose),`${n}/${cls} lower passage x${x}`);samples++;}rows.push({stage:n,cls,clearancePoses:samples});
}
for(const cls of ['archer','mage','knight','occultist']){const{b,e}=battlefield(g,13),u=e.heroesAlive().find(u=>u.cls===cls);b.units=[u];b.active=u.id;e.checkEnd=()=>false;u.x=4300;u.y=C.topAt(b.terrain.find(t=>t.id==='act2-floor'),4300);u.vx=u.vy=0;let maxX=u.x,jumps=0;for(let tick=0;tick<900;tick++){u.moveLeft=u.maxMove;e.walk(u,1,C.STEP);if(tick%90===0&&e.grounded(u)&&e.jump(u))jumps++;e.integrateBody(u,C.STEP);maxX=Math.max(maxX,u.x);}assert(maxX<4445,`${cls} cannot bypass closed stone gate`);rows.push({stage:13,cls,gateClosed:true,maxX,jumps});}
await mkdir('_local/reports/stage9-13',{recursive:true});await writeFile('_local/reports/stage9-13/clearance.json',JSON.stringify({scope:'Static default-body pose grid plus isolated closed-gate real movement; no forced gate unlock or pose correction during probe.',rows},null,2));console.log('PASS',rows);
