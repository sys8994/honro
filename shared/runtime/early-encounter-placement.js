(function(G){'use strict';
// Initial project authoring only: existing battle snapshots are never migrated.
// Coordinates refer to named, unchanged walk surfaces, not aesthetic jitter.
const placements={
 9:[{id:'foe-9',x:2380,support:'tactical-east-root-ascent',reason:'Single ascent sentry separated from the well floor.'},
 {id:'foe-9-cluster',x:1400,support:'tactical-west-rubble-return',clone:true,reason:'West broken-gallery watch above the well approach.'},
 {id:'foe-11-cluster',x:2910,support:'tactical-east-stone-shoulder',clone:true,reason:'Upper east shoulder spirit, apart from the remaining foot-of-ascent spirit.'}],
 13:[{id:'a2-enemy-20',x:4934.4,support:'act2-floor',reason:'Preserve the previous final west house guard position now that actor 21 no longer forces a sanitizer shift.'},{id:'a2-enemy-21',x:4435,support:'tactical-inner-gallery',reason:'Single upper-gallery sentinel; the cave-house pair and lower-slope guard remain.'}],
 17:[{id:'a2-enemy-0',x:1066.3333333333333,support:'ws-west-work-buttress',reason:'Preserve the previous final front post after separating the third silhouette.'},
 {id:'a2-enemy-1',x:1226,support:'ws-west-work-buttress',reason:'Two legible guards at the same work-buttress entrance, not three overlapping picks.'},
 {id:'ws-west-screen',x:2045,support:'ws-west-work-buttress',cell:'brace-front',reason:'Separate flank watch beside the brace approach, outside the brace hazard footprint.'}],
 29:[{id:'a3-29-letter-store-guard-2',x:2690,support:'a3-foundation',reason:'Archive entrance and sluice approach guard, separated from the command formation.'},
 {id:'a3-29-letter-store-guard-3',x:4050,support:'r29-upper-ascent',reason:'Rear ascent lookout guarding the upper exit approach, not a fourth body beside the boss.'}]
};
function point(stage,row){
 const terrain=stage.terrains.find(t=>t.id===row.support);
 if(!terrain)throw Error('Missing early encounter support: '+row.support);
 for(const i of terrain.properties?.honroWalkEdges||[]){
  const a=terrain.points[i],b=terrain.points[(i+1)%terrain.points.length];
  if(a.x!==b.x&&row.x>=Math.min(a.x,b.x)&&row.x<=Math.max(a.x,b.x))return {x:row.x,y:a.y+(b.y-a.y)*(row.x-a.x)/(b.x-a.x)};
 }
 throw Error('Early encounter point outside authored support: '+row.id);
}
function author(project){
 const out=structuredClone(project);
 for(const stage of out.stages||[])for(const row of placements[stage.metadata?.stageId]||[]){
  if(row.clone){stage.design.positioning??={};stage.design.positioning.clusterPositions??={};stage.design.positioning.clusterPositions[row.id]=point(stage,row);continue;}
  const unit=stage.units.find(u=>u.id===row.id);
  if(!unit)throw Error('Missing existing early encounter actor: '+row.id);
  Object.assign(unit,point(stage,row));
  if(row.cell){unit.stageOverrides.honroDensityCell=row.cell;for(const group of stage.encounters)group.unitIds=group.unitIds.filter(id=>id!==row.id);stage.encounters.find(group=>group.id===row.cell).unitIds.push(row.id);}
 }
 return out;
}
G.HonroEarlyEncounterPlacement={author,placements,point};
})(globalThis);
