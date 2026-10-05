// Real collision/contact solver, ordinary default jump; explicit cleared fixture.
// No actor corrections, gravity/stat tweaks, flight skills or geometry edits.
import {mkdir,writeFile} from 'node:fs/promises';
import {act1Runtime,isolatedHero,routePoints,traverse,CLASSES,reportRoot} from './act1-spatial-test-helpers.mjs';
const g=await act1Runtime(),ids=process.argv.slice(2).map(Number),rows=[];if(!ids.length)ids.push(...Array.from({length:10},(_,i)=>i+1));
for(const id of ids)for(const cls of CLASSES){const {b,e,u}=isolatedHero(g,id,cls),start=performance.now(),result=traverse(g,b,e,u,routePoints(g,id,b));const row={stage:id,hero:cls,...result,seconds:(performance.now()-start)/1000};rows.push(row);console.log(JSON.stringify({...row,samples:row.samples.length}));}
const out=reportRoot();await mkdir(out,{recursive:true});await writeFile(`${out}/traversal${ids.length===10?'':'-'+ids.join('-')}.json`,JSON.stringify({scope:'Isolated all-class default movement coverage, not campaign party composition or normal-combat clear',rows},null,2)+'\n');if(rows.some(r=>!r.passed))process.exitCode=1;
