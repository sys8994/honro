// Isolated physical route test, not a combat clear. Enemy turns and removable
// gates are excluded; the real movement, jump and contact solver remain active.
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const g=await runtime({legacyMaps:false}),rows=[];
const ids=process.argv.slice(2).map(Number);if(!ids.length)ids.push(...Array.from({length:10},(_,i)=>i+11));
for(const id of ids){
 const {b,e}=battlefield(g,id),u=e.active;u.armor=1;b.units=[u];e.checkEnd=()=>false;
 for(const t of b.terrain)if(t.id.startsWith('gate-'))t.broken=true;
 const floor=b.terrain.find(t=>t.id==='act2-floor');if(floor.honroRestoredVertices)floor.vertices=floor.honroRestoredVertices;
 const route=g.HONRO_PROJECT.stages[id-1].routes.filter(p=>p.x>=300&&p.x<=b.width-220),samples=[],start=performance.now();
 let failed=null,ticks=0;
 for(const p of route){
  let stuck=0,age=0;
  while(Math.abs(u.x-p.x)>26&&age++<420){const x=u.x;u.moveLeft=1800;e.move(Math.sign(p.x-u.x),1/60);e.tick(1/60);ticks++;
   if(Math.abs(u.x-x)<.08){stuck++;if(stuck>8&&e.grounded(u)){e.jump(u);stuck=0;}}else stuck=0;
   if(u.dead||u.y>b.height){failed={reason:'fall',goal:p,x:u.x,y:u.y};break;}
  }
  // A player can end their turn at the village bend before doubling back.
  // The return path must remain passable after landing on the lower floor.
  if(id===14&&p.x===8350)for(let settle=0;settle<120;settle++){e.tick(1/60);ticks++;}
  // A seal can force an automatic jump just before a waypoint. Judge the
  // landing surface instead of an airborne sample at the same X coordinate.
  if(u.y<p.y-320&&!e.grounded(u))for(let settle=0;settle<120&&!e.grounded(u);settle++){e.tick(1/60);ticks++;}
  samples.push({goal:p,x:Math.round(u.x),y:Math.round(u.y),age});
  if(failed||age>=420||Math.abs(u.y-p.y)>320){failed??={reason:age>=420?'stuck':'wrong level',goal:p,x:u.x,y:u.y};break;}
 }
 const row={stage:id,passed:!failed,failed,seconds:(performance.now()-start)/1000,ticks,samples};rows.push(row);console.log(JSON.stringify({...row,samples:samples.length}));
}
await mkdir('_local/reports/act2-revision',{recursive:true});await writeFile('_local/reports/act2-revision/traversal.json',JSON.stringify(rows,null,2));if(rows.some(r=>!r.passed))process.exitCode=1;
