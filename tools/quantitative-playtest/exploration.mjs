/** Discovery from public HUD text, actual viewport history and public support geometry only. */
import {supportNodes,SupportNavigator} from './navigation.mjs';
export function publicObjective(text){const instruction=String(text||''),match=instruction.match(/남은 적\s*(\d+)\s*명/);return {instruction,remainingThreats:match?Number(match[1]):null,requiresThreatSearch:!!match&&Number(match[1])>0};}
const inView=(p,v)=>v&&p.x>=v.left&&p.x<=v.right&&p.y>=v.top&&p.y<=v.bottom;
export class PublicExplorer{
 constructor(C){this.C=C;this.visited=new Set();this.views=[];this.seenFoes=new Map();this.assignments=new Map();this.planners=new Map();this.stats={observations:0,frontierChoices:0,unreachableCandidates:0};}
 nodes(world,u){const key=[world.sceneVersion,world.terrain.length,u.h,u.r].join(':');if(this.nodeKey!==key){this.nodeKey=key;this.samples=supportNodes(this.C,world,u);this.assignments.clear();}return this.samples;}
 observe(world,u,view,visibleFoes=[]){
  if(!view||![view.left,view.right,view.top,view.bottom].every(Number.isFinite))throw Error('Exploration requires actual observed viewport');
  this.stats.observations++;this.lastView={...view};
  if(!this.views.length||Math.hypot(view.left-this.views.at(-1).left,view.top-this.views.at(-1).top)>180){this.views.push({...view});if(this.views.length>256)this.views.shift();}
  for(const n of this.nodes(world,u))if(inView(n,view)&&Math.abs(n.x-u.x)<=300&&Math.abs(n.y-u.y)<=150&&!world.terrain.some(t=>!t.broken&&!t.oneWay&&this.C.segmentTerrain({x:u.x,y:u.y-u.h*.5},{x:n.x,y:n.y-u.h*.5},t)))this.visited.add(n.key);
  for(const v of visibleFoes)this.seenFoes.set(v.id,{id:v.id,x:v.x,y:v.y,lastSeenObservation:this.stats.observations});
 }
 choose(world,u,objective,{grounded=true}={}){
  if(!objective.requiresThreatSearch)return null;
  const nodes=this.nodes(world,u),previous=this.assignments.get(u.id);
  if(previous&&(!grounded||!this.visited.has(previous.key)))return {...previous,kind:'explore',source:'public-unvisited-support',remainingThreats:objective.remainingThreats};
  if(!grounded)return {x:u.x,y:u.y,kind:'explore',source:'await-observed-landing',remainingThreats:objective.remainingThreats};
  const others=[...this.assignments].filter(([id])=>id!==u.id).map(([,p])=>p),candidates=nodes.filter(n=>!this.visited.has(n.key)).sort((a,b)=>{
   const score=n=>Math.hypot(n.x-u.x,n.y-u.y)+Math.max(0,n.y-u.y)*2+others.filter(p=>Math.hypot(p.x-n.x,p.y-n.y)<180).length*180;
   return score(a)-score(b)||a.key.localeCompare(b.key);
  });
  const planner=this.planners.get(u.id)||new SupportNavigator(this.C);this.planners.set(u.id,planner);
  for(const n of candidates){const plan=planner.plan(world,u,n,{range:24});if(plan.status!=='ready'){this.stats.unreachableCandidates++;continue;}this.assignments.set(u.id,n);this.stats.frontierChoices++;return {...n,kind:'explore',source:'public-unvisited-support',remainingThreats:objective.remainingThreats};}
  return {kind:'exploration-exhausted',x:u.x,y:u.y,remainingThreats:objective.remainingThreats,reason:'Public threat count remains positive but no unvisited reachable support viewpoint remains',visited:this.visited.size,supportSamples:nodes.length};
 }
 summary(){return {...this.stats,visitedSupports:this.visited.size,observedViews:this.views.length,seenEnemyIds:[...this.seenFoes.keys()]};}
}
