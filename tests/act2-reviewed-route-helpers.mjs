// Keep nine existing mandatory routes walk-only. The exact approved chapter 15
// route needs ordinary jumps, verified against the same live physics solver.
import assert from 'node:assert/strict';
import {beforeForestCavernTopology} from './forest-cavern-history-helpers.mjs';
import {traverse} from './act1-spatial-test-helpers.mjs';
import {walkRoute} from './act2-spatial-test-helpers.mjs';
export function assertReviewedRouteModes(project){
 beforeForestCavernTopology(project,{stages:[15]});
 for(const map of project.stages.filter(s=>s.metadata.stageId>=11&&s.metadata.stageId<=20)){
  const main=map.design.space.routes.find(r=>r.id==='main');
  if(map.metadata.stageId===15)assert.equal(main.defaultJump,true,'Exact approved cavern uses basic jumps');
  else assert(!main.defaultJump,'Unrelated mandatory routes remain walk-only: '+map.metadata.stageId);
 }
}
export function traverseReviewedRoute(g,b,e,hero,route,main){
 if(!main.defaultJump)return walkRoute(g,b,e,hero,route);
 assert.equal(b.honroStage,15,'Only approved chapter 15 may use the basic-jump runner');
 assert(!hero.ranks.SP03,'No jump training in the mandatory-route proof');
 return traverse(g,b,e,hero,route);
}
