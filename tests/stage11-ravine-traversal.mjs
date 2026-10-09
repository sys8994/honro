/** Expanded Stage11 routes through the production input boundary.
 * Cleared encounters isolate terrain: no combat-clear or difficulty claim. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {isolateRouteHero,commandRoute} from './stage11-ravine-command-helpers.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const g=await runtime({legacyMaps:false});
if(process.env.HONRO_RAVINE_PROJECT)g.HONRO_PROJECT=JSON.parse(await readFile(process.env.HONRO_RAVINE_PROJECT,'utf8'));
const st=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===11),space=st.design.space,main=space.routes.find(r=>r.id==='main');
assert.equal(st.initialState.honroRavineVersion,2,'Use the current authored ravine, not the historical stage11');
assert.equal(st.width,16000);assert.equal(st.height,12000);assert(main?.defaultJump);
const selected=process.argv.slice(2),routes=space.routes.filter(r=>!selected.length||selected.includes(r.id));
const rows=[],clearance=[];
for(const route of routes){
 assert(!route.requires?.length,route.id+' must not depend on a purchased map-specific skill');
 for(const cls of ['archer','mage','knight','occultist']){
  const profile=g.HONRO_CORE.defaults();profile.recruited=g.HonroStageRules.stageParty(11);
  for(const id of profile.recruited)profile.heroes[id].xp=g.HonroProgression.legacyCampaignAnchor(10);
  const q=battlefield(g,11,{profile}),start=route.id==='main'?undefined:route.anchors[0],u=isolateRouteHero(q,cls,start);
  // All authored anchors must be exposed and body-clear before movement. The
  // command route below separately proves how the actor reaches them.
  for(const [index,p]of route.anchors.entries()){
   const support=q.e.surface(p.x,p.y-4,p.y+4),pose={...u,x:p.x,y:p.y},blocked=!g.HONRO_CORE.validTerrainContactPose(q.b.terrain,pose);
   // A broad AABB overlaps an adjacent uphill contour at a legal seam. Use
   // the same union/contact/head/torso validator as production locomotion.
   if(support&&!blocked){const roof={id:'qa-blocked-head',x:p.x-60,y:p.y-u.h*.6,w:120,h:24};assert(!g.HONRO_CORE.validTerrainContactPose([...q.b.terrain,roof],pose),'Contact validator must still reject a real torso obstruction');}
   if(!support||blocked)clearance.push({route:route.id,cls,index,point:p,support:support?.t?.id,blocked});
  }
  const result=commandRoute(g,q,u,route.anchors),row={route:route.id,cls,entryLevel:u.level,untrainedJump:!u.ranks.SP03,initialization:start?'one-time at route connection':'canonical spawn',...result};
  rows.push(row);console.log(JSON.stringify({...row,samples:row.samples.length,commands:row.commands.length}));
 }
}
const report={sourceProjectSha256:hash(g.HONRO_PROJECT),stageSha256:hash(st),scope:'Isolated actual player-command route tests. Actors/encounters are selected once; no position/HP/focus/moveLeft corrections, no items or map-specific skill during travel. These are not normal-combat completions.',clearance,rows};
await mkdir('_local/reports/stage11-ravine',{recursive:true});await writeFile('_local/reports/stage11-ravine/traversal.json',JSON.stringify(report,null,2)+'\n');
assert.equal(clearance.length,0,'Every route anchor needs actual exposed support and four-body clearance: '+JSON.stringify(clearance));
assert(rows.every(r=>r.passed),'Some command-only route fixtures failed; inspect traversal.json');
