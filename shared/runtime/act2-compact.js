(function(G){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),packages=()=>G.HONRO_ACT2_COMPACT_PACKAGES||{},enabled=id=>!!packages()[Number(id)]&&G.HonroAct23V4ReviewedChapters?.enabled(Number(id));
// Fresh campaign placement only. Compact data, active terrain and live/resumed
// battle state stay untouched. Each tuple pins the original actor and support.
const placement={
 12:[
  ['sq-b2',4029.6875,1428.9473684210525,'sq-north-quarry',3840],
  ['sq-b3',3955.46875,1443.9473684210525,'sq-north-quarry',3650],
  ['sq-g2',4488,2588.0327868852455,'sq-back-road',4240]],
 17:[
  ['ws-west-screen',1248.095238095238,2423,'ws-west-work-buttress',1325],
  ['ws-axle-point',4387.35294117647,2711.818181818182,'ws-east-hoist-buttress',4420]],
 20:[
  ['a2-enemy-12',5192,825.1999999999998,'act2-floor',5055],
  ['a2-enemy-13',5284,788.4000000000001,'act2-floor',5570],
  ['a2-enemy-14',5362,757.1999999999998,'act2-floor',5945]]
};
function placementY(stage,id,x){
 const t=stage.terrains.find(v=>v.id===id), edges=t?.properties?.honroWalkEdges;
 if(!Array.isArray(edges))return null;
 const hits=edges.flatMap(i=>{const a=t.points[i],b=t.points[(i+1)%t.points.length];return b&&a&&a.x!==b.x&&x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x)?[a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x)]:[];});
 return hits.length&&hits.every(y=>Number.isFinite(y)&&Math.abs(y-hits[0])<.01)?hits[0]:null;
}
function place(stage){
 const id=stage.metadata?.stageId,plan=placement[id];if(!plan||stage.id!=='stage-'+id||!stage.metadata.campaign)return stage;
 const edits=[];
 for(const [key,oldX,oldY,support,x] of plan){
  const matches=stage.units.filter(v=>v.id===key),u=matches[0];
  const oldSupport=u?.stageOverrides?.honroEncounterSupport;
  if(matches.length!==1||u.team!=='enemy'||(oldSupport??(id===20?'act2-floor':null))!==support||!Number.isFinite(u.x)||!Number.isFinite(u.y)||Math.abs(u.x-oldX)>1e-6||Math.abs(u.y-oldY)>1e-6)return stage;
  const y=placementY(stage,support,x);if(!Number.isFinite(y))return stage;edits.push([u,x,y]);
 }
 for(const [u,x,y] of edits)Object.assign(u,{x,y});return stage;
}
// Retarget only the existing, finite, post-rescue group. The west suppression
// court is before rescue; the lower inner approach is on the
// return toward the hoist, away from the rescue actor and its signed refuge.
function placeRescueResponse(stage){
 if(stage.id!=='stage-18'||stage.metadata?.stageId!==18||!stage.metadata.campaign)return stage;
 const e=stage.events.find(v=>v.id==='18.rescue-response'),support='sb-inner-lower-approach';
 if(!e||e.honroDensityTrigger?.objectiveDone!=='18.rescue'||e.entry?.surfaceId!=='sb-suppression-court'||e.action?.source!==e.id||e.honroDensityAlternatives?.length!==1)return stage;
 const groups=[e.action.actions,e.honroDensityAlternatives[0]],stock=[
  [[1399.2307692307695,4470.789473684211],[1529.2307692307695,4463.767313019391],[1363.5897435897436,4335.473684210527]],
  [[1210,4478.9473684210525],[1340,4473.601973684211],[1417.2,4338.894736842105]]
 ],fronts=[[4780,5000,4720],[4580,4760,5120]],edits=[];
 for(let i=0;i<groups.length;i++){
  const old=groups[i];if(!Array.isArray(old)||old.length!==3||old.some((a,j)=>a.source!==e.id||a.n!==1||a.support!=='sb-suppression-court'||a.kind!==['picks','minecart','bat'][j]||a.air!==(j===2)||!Number.isFinite(a.x)||!Number.isFinite(a.y)||Math.abs(a.x-stock[i][j][0])>1e-6||Math.abs(a.y-stock[i][j][1])>1e-6))return stage;
  for(let j=0;j<old.length;j++){const x=fronts[i][j],y=placementY(stage,support,x);if(!Number.isFinite(y))return stage;edits.push([old[j],{x,y:y-(old[j].air?(i?280:235):0),surfaceId:support,support}]);}
 }
 if(e.entry.x!==groups[0][0].x||e.entry.y!==groups[0][0].y)return stage;
 const {x,y}=edits[0][1];for(const [a,p] of edits)Object.assign(a,p);Object.assign(e.entry,{x,y,surfaceId:support});return stage;
}
function author(project){let out=project;for(const [id,d]of Object.entries(packages())){const old=out.stages.find(s=>s.metadata?.stageId===Number(id));if(!old||!enabled(id))continue;if(JSON.stringify(old)!==JSON.stringify(d.source))throw Error('Compact chapter source changed: '+id);const assets=clone(d.assets);if(assets.some(a=>a.collision?.length||out.library.some(v=>v.id===a.id)))throw Error('Invalid compact chapter assets');out={...out,stages:out.stages.map(s=>s===old?placeRescueResponse(place(clone(d.stage))):s),library:[...out.library,...assets]};}return out;}
function preserveBattle(b){const d=packages()[b?.honroStage];if(!d||!enabled(b.honroStage)||b.honroCustom||b.mode!=='campaign'||b.honroMapOrigin!=='campaign'||b.honroRevision!==20||b.honroCampaignMapRevision!==d.previousMapRevision||b.width!==d.source.width||b.height!==d.source.height)return false;
 const finite=(o,ks)=>o&&ks.every(k=>Number.isFinite(o[k]));return Array.isArray(b.terrain)&&b.terrain.length>0&&b.terrain.every(t=>typeof t.id==='string'&&(Array.isArray(t.vertices)&&t.vertices.length>=3&&t.vertices.every(p=>finite(p,['x','y']))||finite(t,['x','y','w','h'])&&t.w>0&&t.h>0))&&Array.isArray(b.units)&&b.units.length>0&&b.units.every(u=>typeof u.id==='string'&&finite(u,['x','y','hp','r','h'])&&u.r>0&&u.h>0);
}
const revision=G.HonroAct23V4.mapRevision;G.HonroAct23V4.mapRevision=id=>enabled(id)?packages()[Number(id)].mapRevision:revision(id);
G.HonroAct2Compact={author,enabled,preserveBattle};
})(globalThis);
