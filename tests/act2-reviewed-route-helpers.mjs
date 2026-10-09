import {assertStage16TempleCurrent} from './stage16-temple-history-helpers.mjs';
import {traverse as traverseTemple} from './stage16-temple-traverse-helper.mjs';
import {assertStage11RavineCurrent} from './stage11-ravine-history-helpers.mjs';
import {assertStage17WorksiteCurrent} from './stage17-worksite-history-helpers.mjs';
import {traverse as traverseWorksite} from './stage17-worksite-traverse-helper.mjs';
// The exactly reviewed cavern routes may use baseline movement and jumps.
// Five unrelated current routes keep the original support-only walk audit.
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
 for(const map of project.stages.filter(s=>s.metadata.stageId>=11&&s.metadata.stageId<=20)){
  const id=map.metadata.stageId,main=map.design.space.routes.find(r=>r.id==='main');
  if(id===11&&map.initialState?.honroRavineVersion){assertStage11RavineCurrent(project,{unrelated:false,library:false});assert.equal(main.defaultJump,true,'Exact reviewed ravine uses baseline movement');}
  else if(id===16&&map.initialState?.honroTempleVersion){assertStage16TempleCurrent(project,{unrelated:false,library:false});assert.equal(main.defaultJump,true,'Exact reviewed temple uses baseline movement');}
  else if(id===17&&map.initialState?.honroWorksiteVersion){assertStage17WorksiteCurrent(project,{unrelated:false,library:false});assert.equal(main.defaultJump,true,'Exact reviewed worksite uses baseline movement');}
  else if(id===15)assert.equal(main.defaultJump,true,'Exact approved cavern uses basic jumps');
  else if(reviewed.stages[id]){
   const expected=reviewed.stages[id].after;
   assert.equal(hash(map.terrains),expected.terrainSha256,'Exact approved layered cavern terrain '+id);
   assert.deepEqual(plain(map.design.space.routes),expected.routes,'Exact approved layered cavern route '+id);
   assert.equal(main.defaultJump,true,'Exact approved layered cavern uses baseline movement '+id);
  }else assert(!main.defaultJump,'Unrelated mandatory routes remain walk-only: '+id);
 }
 beforeApprovedTopology(project,{stages:[15]});
}
export function traverseReviewedRoute(g,b,e,hero,route,main){
 if(!main.defaultJump)return walkRoute(g,b,e,hero,route);
 assert([11,14,15,16,17].includes(b.honroStage),'Only exactly reviewed ravine/cavern/temple/worksite chapters may use baseline step-off/jumps');
 if(b.honroStage===11)assertStage11RavineCurrent(g.HONRO_PROJECT,{unrelated:false,library:false});
 assert(!hero.ranks.SP03,'No jump training in the mandatory-route proof');
 if(b.honroStage===16&&b.honroTempleVersion){assertStage16TempleCurrent(g.HONRO_PROJECT,{unrelated:false,library:false});assert.equal(b.honroTempleVersion,1,'Only the current temple uses its authored planned jumps');return traverseTemple(g,b,e,hero,route);}
 if(b.honroStage===17){assertStage17WorksiteCurrent(g.HONRO_PROJECT,{unrelated:false,library:false});assert.equal(b.honroWorksiteVersion,1,'Only the current worksite uses its authored planned jumps');return traverseWorksite(g,b,e,hero,route);}
 // This is an isolated geometry fixture with a replenished movement budget.
 // cavern-player-walk separately proves 14/16 via real move/wait/tick commands.
 return traverse(g,b,e,hero,route);
}
