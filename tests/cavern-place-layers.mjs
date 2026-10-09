import {historicalStage16Runtime} from './stage16-temple-history-helpers.mjs';
// Keep every original Stage14/16 layer, command and shot assertion on the
// exact pre-temple boundary; fresh Stage16 has its dedicated current suites.
import {act1Runtime,fixture,traverse} from './act1-spatial-test-helpers.mjs';import {mkdir,writeFile} from 'node:fs/promises';
const g=historicalStage16Runtime(await act1Runtime()),C=g.HONRO_CORE,rows=[];
for(const id of [14,16])for(const cls of ['archer','mage','knight','occultist'])for(const kind of ['main','undercroft-return']){const {b,e}=fixture(g,id),st=g.HONRO_PROJECT.stages[id-1],q=st.design.cavernLayers,u=e.heroesAlive().find(u=>u.cls===cls);b.units=[u];b.active=u.id;e.checkEnd=()=>false;let route=q.requiredMain;if(kind==='undercroft-return'){Object.assign(u,q.optional[0],{vx:0,vy:0});route=[...q.optional.slice(1),...q.return];}const r=traverse(g,b,e,u,route);rows.push({stage:id,cls,kind,...r});console.log(JSON.stringify({stage:id,cls,kind,passed:r.passed,failed:r.failed,jumps:r.jumps,damage:r.damage}));}
await mkdir('_local/reports/forest-cavern',{recursive:true});await writeFile('_local/reports/forest-cavern/cavern-place-traversal.json',JSON.stringify(rows,null,2));if(rows.some(r=>!r.passed))process.exitCode=1;
