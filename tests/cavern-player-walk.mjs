import {historicalStage16Runtime} from './stage16-temple-history-helpers.mjs';
// Keep every original Stage14/16 layer, command and shot assertion on the
// exact pre-temple boundary; fresh Stage16 has its dedicated current suites.
// Normal player move/wait/tick only. The legacy cautious walk solver refuses
// any ledge step-off; this route intentionally steps down onto two return decks.
import assert from 'node:assert/strict';import {runtime,battlefield} from '../game/tests/helpers.mjs';import {openRoute} from './act2-spatial-test-helpers.mjs';import {mkdir,writeFile} from 'node:fs/promises';
const g=historicalStage16Runtime(await runtime({legacyMaps:false})),C=g.HONRO_CORE,rows=[];
for(const id of [14,16])for(const cls of ['archer','mage','knight','occultist']){const {b,e}=battlefield(g,id),u=e.heroesAlive().find(u=>u.cls===cls),route=g.HONRO_PROJECT.stages[id-1].design.space.routes.find(r=>r.id==='main');b.units=[u];b.active=u.id;b.phase='aim';b.side=0;e.checkEnd=()=>false;openRoute(b);assert(!u.ranks.SP03);const beforeHp=u.hp;let frames=0,waits=0,failed=null;
 for(const p of route.anchors){let arrived=false;for(let i=0;i<3000;i++){if(Math.abs(u.x-p.x)<4&&Math.abs(u.y-p.y)<16&&e.grounded(u)){arrived=true;break;}if(u.moveLeft<8&&e.grounded(u)&&e.canAct()){e.wait();waits++;for(let q=0;q<2400&&!e.canAct();q++){e.tick(C.STEP);frames++;}}if(e.canAct()&&Math.abs(u.x-p.x)>3)e.move(Math.sign(p.x-u.x),C.STEP);e.tick(C.STEP);frames++;if(u.dead)break;}if(!arrived){failed={goal:p,position:{x:u.x,y:u.y},phase:b.phase,moveLeft:u.moveLeft};break;}}
 const row={stage:id,cls,passed:!failed&&!u.dead&&u.hp===beforeHp,failed,frames,waits,jumpCalls:0,damage:beforeHp-u.hp};rows.push(row);console.log(JSON.stringify(row));}
await mkdir('_local/reports/forest-cavern',{recursive:true});await writeFile('_local/reports/forest-cavern/cavern-player-walk.json',JSON.stringify(rows,null,2));if(rows.some(r=>!r.passed))process.exitCode=1;
