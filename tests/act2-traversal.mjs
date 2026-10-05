// Isolated, cleared-route physics audit for every hero. Enemy turns and named
// removable barriers are excluded; the actual walking/contact solver is used.
// No jumps or actor-position correction are allowed on mandatory routes.
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {openRoute,walkRoute} from './act2-spatial-test-helpers.mjs';
const g=await runtime({legacyMaps:false}),rows=[];
const ids=process.argv.slice(2).map(Number),filtered=ids.length>0;if(!ids.length)ids.push(...Array.from({length:10},(_,i)=>i+11));
for(const id of ids)for(const cls of ['archer','mage','knight','occultist']){
 const {b,e}=battlefield(g,id),u=e.heroesAlive().find(u=>u.cls===cls);
 b.units=[u];b.active=u.id;e.checkEnd=()=>false;openRoute(b);
 const st=g.HONRO_PROJECT.stages[id-1],main=st.design?.space?.routes.find(r=>r.id==='main');
 if(!main)throw Error(id+': mandatory spatial route is missing');
 const route=main.anchors.filter(p=>p.x>=u.x-8&&p.x<=b.width-30),start=performance.now();
 const result=walkRoute(g,b,e,u,route),row={stage:id,hero:cls,...result,seconds:(performance.now()-start)/1000};
 rows.push(row);console.log(JSON.stringify({...row,samples:row.samples.length}));
}
await mkdir('_local/reports/act2-spatial',{recursive:true});
await writeFile(`_local/reports/act2-spatial/traversal${filtered?'-'+ids.join('-'):''}.json`,JSON.stringify({mode:'Isolated cleared-path fixture; not normal-combat completion.',rows},null,2));
if(rows.some(r=>!r.passed))process.exitCode=1;
