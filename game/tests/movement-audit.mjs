import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {runtime,battlefield,gameRoot} from './helpers.mjs';
const g=await runtime(),rows=[],failures=[];
const clear=b=>{for(const u of b.units)if(u.side===1){u.dead=true;u.hp=0;}};
function walkStage(id,dt){const {b,e}=battlefield(g,id);clear(b);const u=e.active,goal=b.honroMapAnchors.exit.x;let still=0,last=u.x,jumps=0;for(let i=0;i<Math.ceil(24/dt);i++){u.moveLeft=1e9;e.walk(u,Math.sign(goal-u.x),dt);if(still>Math.ceil(.16/dt)&&e.grounded(u)){e.jump(u);jumps++;still=0;}e.integrateBody(u,dt,true);if(!Number.isFinite(u.x)||!Number.isFinite(u.y)||u.y>b.height+80)return{ok:false,id,dt,i,x:u.x,y:u.y,reason:'fall',jumps};if(Math.abs(u.x-goal)<28&&e.grounded(u))return{ok:true,id,dt,i,x:u.x,y:u.y,jumps};still=Math.abs(u.x-last)<.001?still+1:0;last=u.x;if(still>Math.ceil(3/dt))return{ok:false,id,dt,i,x:u.x,y:u.y,reason:'stuck',jumps};}return{ok:false,id,dt,x:u.x,y:u.y,reason:'timeout',jumps};}
for(const id of[1,2])for(const dt of[1/120,1/60,1/30]){const r=walkStage(id,dt);rows.push(r);if(!r.ok)failures.push(r);}
await writeFile(gameRoot+'/reports/movement-audit.json',JSON.stringify({cases:rows.length,rows,failures},null,2)+'\n');console.log(JSON.stringify({cases:rows.length,failures},null,2));assert.equal(failures.length,0,'Stage 1/2 main routes must stay traversable with normal walk+jump controls at multiple timesteps');
