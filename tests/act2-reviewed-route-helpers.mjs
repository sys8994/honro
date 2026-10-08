// The exactly reviewed cavern routes may use baseline movement and jumps.
// Seven unrelated mandatory routes keep the original support-only walk audit.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {beforeApprovedTopology} from './approved-topology-history-helpers.mjs';
import {traverse} from './act1-spatial-test-helpers.mjs';
import {walkRoute} from './act2-spatial-test-helpers.mjs';
const reviewed=JSON.parse(readFileSync(new URL('./fixtures/cavern-place-reviewed-paths.json',import.meta.url),'utf8'));
const plain=x=>JSON.parse(JSON.stringify(x));
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function assertReviewedRouteModes(project){
 beforeApprovedTopology(project,{stages:[15]});
 for(const map of project.stages.filter(s=>s.metadata.stageId>=11&&s.metadata.stageId<=20)){
  const id=map.metadata.stageId,main=map.design.space.routes.find(r=>r.id==='main');
  if(id===15)assert.equal(main.defaultJump,true,'Exact approved cavern uses basic jumps');
  else if(reviewed.stages[id]){
   const expected=reviewed.stages[id].after;
   assert.equal(hash(map.terrains),expected.terrainSha256,'Exact approved layered cavern terrain '+id);
   assert.deepEqual(plain(map.design.space.routes),expected.routes,'Exact approved layered cavern route '+id);
   assert.equal(main.defaultJump,true,'Exact approved layered cavern uses baseline movement '+id);
  }else assert(!main.defaultJump,'Unrelated mandatory routes remain walk-only: '+id);
 }
}
export function traverseReviewedRoute(g,b,e,hero,route,main){
 if(!main.defaultJump)return walkRoute(g,b,e,hero,route);
 assert([14,15,16].includes(b.honroStage),'Only exactly approved cavern chapters may use baseline step-off/jumps');
 assert(!hero.ranks.SP03,'No jump training in the mandatory-route proof');
 // This is an isolated geometry fixture with a replenished movement budget.
 // cavern-player-walk separately proves 14/16 via real move/wait/tick commands.
 return traverse(g,b,e,hero,route);
}
