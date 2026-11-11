import {authorAct4Finale} from './act4-finale-author.mjs';
import {authorAct4Stage32} from './act4-stage32-author.mjs';
import {authorAct4Stage37} from './act4-stage37-author.mjs';
import {authorAct4Stage38} from './act4-stage38-author.mjs';
import {authorAct4Stage39} from './act4-stage39-author.mjs';
export function supportPoint(stage,id,x){
 const t=stage.terrains.find(t=>t.id===id),edges=t?.properties?.honroWalkEdges;
 if(!t||!Array.isArray(edges)||!edges.length)throw Error('Explicit walk edges required: '+id);
 const ys=[];for(const i of edges){const a=t.points[i],b=t.points[(i+1)%t.points.length];if(a&&b&&x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x)&&a.x!==b.x)ys.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));}
 if(!ys.length||ys.some(y=>!Number.isFinite(y)||Math.abs(y-ys[0])>.01))throw Error('Missing or ambiguous supported point: '+id+' '+x);
 return{x,y:ys[0]};
}
export function applyAct4FinaleRevision(project) {
 const authors = {
  32: authorAct4Stage32,
  37: authorAct4Stage37,
  38: authorAct4Stage38,
  39: authorAct4Stage39,
  40: authorAct4Finale,
 };
 return {...project, stages: project.stages.map(stage => {
  const author = authors[stage.metadata?.stageId];
  return author ? author(stage, supportPoint) : stage;
 })};
}
