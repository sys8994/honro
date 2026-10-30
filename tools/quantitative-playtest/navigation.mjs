/** Public-terrain locomotion graph. No battle clone, enemy state, RNG, attacks or authored route tape. */
const steer=(u,x)=>Math.abs(x-u.x)<1?0:Math.sign(x-u.x)*Math.min(1,Math.abs(x-u.x)/(u.walkSpeed/60));
const copy=x=>JSON.parse(JSON.stringify(x));
const bodyKeys=['id','cls','side','r','h','walkSpeed','maxMove','bound','slowed','ranks','equipmentIds','equipmentState','hp','maxHp','focus','maxFocus','facing','angle'];
export function unsafePublicWater(world,p){
 if((world.waters||[]).some(w=>(w.frozen||0)<=0&&p.x>w.x&&p.x<w.x+w.w&&p.y>w.y+35&&(w.kind==='lava'||w.depth>(p.h||80)*.4)))return true;
 const tide=world.honroAct4PreviewState?.tide;
 return (world.honroAct4Design?.waterPolicies||[]).some(z=>['recover','lethal'].includes(z.kind)&&p.x>z.x1&&p.x<z.x2&&p.y>(tide?.surface??z.surface)+35&&(z.kind!=='recover'||!tide||tide.phase==='high'));
}
export function motionHost(C,world,actor){
 const h=Object.create(C.Engine.prototype),u=Object.fromEntries(bodyKeys.filter(k=>actor[k]!==undefined).map(k=>[k,copy(actor[k])]));
 Object.assign(u,{x:actor.x,y:actor.y,vx:0,vy:0,moveLeft:actor.maxMove,dead:false,acted:false,jumping:false,airborne:false});
 h.b={terrain:world.terrain,width:world.width,height:world.height,physics:copy(world.physics||C.makePhysics()),units:[u],active:u.id,phase:'aim',side:0,mode:'navigation-physics-only',round:world.round||1,sceneVersion:world.sceneVersion||0,zones:[],waters:[],projectiles:[],fields:[]};
 Object.assign(h,{terrainBins:new Map(),terrainOrder:new Map(),indexedVersion:-1,indexedCount:-1,counter:0,onEvent(){},emit(){},fx(){}});
 for(const method of ['hurt','fire','tick','random','enemyAction','predict','checkEnd','recover'])h[method]=()=>{throw Error('Forbidden combat/world operation in navigation: '+method);};
 return {h,u};
}
export function supportNodes(C,world,actor,extra=[]){
 const nodes=[],seen=new Set(),margin=Math.max(12,actor.r+6),step=140;
 const add=(t,x,face)=>{const p={x,y:face.y,support:t.id,edge:face.edge};if(unsafePublicWater(world,{...p,h:actor.h})||Math.abs(face.slope)>1.35||!C.exposedSurface(world.terrain,t,x,p.y)||!C.validTerrainContactPose(world.terrain,{...actor,...p}))return;const key=[t.id,face.edge,x.toFixed(2),p.y.toFixed(2)].join(':');if(!seen.has(key)){seen.add(key);nodes.push({...p,key});}};
 for(const t of world.terrain){if(t.broken||t.w<4)continue;const points=C.poly(t);for(let i=0;i<points.length;i++){const a=points[i],z=points[(i+1)%points.length];if(z.x<=a.x||Math.abs((z.y-a.y)/(z.x-a.x))>1.35)continue;const inset=Math.min(margin,(z.x-a.x)/3),left=a.x+inset,right=z.x-inset,xs=[left,right,(left+right)/2,...extra.map(p=>Math.max(left,Math.min(right,p.x)))];for(let x=left+step;x<right;x+=step)xs.push(x);for(const x of xs)for(const face of C.terrainSurfaces(t,x).filter(f=>f.edge===i))add(t,x,face);}}
 return nodes;
}
/** One leg is validated with real movement/body integration, never combat prediction. */
export function traceLeg(C,world,actor,from,to,kind){
 if(Math.abs(to.x-from.x)>620||to.y-from.y< -260||to.y-from.y>550)return null;
 const {h,u}=motionHost(C,world,actor);Object.assign(u,{x:from.x,y:from.y});
 if(!C.validTerrainContactPose(world.terrain,u)||!h.grounded(u))return null;
 const before=u.moveLeft;let launched=kind==='jump'?h.jump(u):kind==='drop'?h.drop(u):true;
 if(!launched)return null;let leftSupport=false,stall=0,apex=u.y;
 for(let frame=0;frame<480;frame++){
  const old={x:u.x,y:u.y},dx=to.x-u.x;
  if(Math.abs(dx)>1)h.walk(u,Math.sign(dx)*Math.min(1,Math.abs(dx)/(u.walkSpeed*C.STEP)),C.STEP,kind==='walk');
  if(!h.integrateBody(u,C.STEP,true)||unsafePublicWater(world,u))return null;apex=Math.min(apex,u.y);
  if(!h.grounded(u))leftSupport=true;
  if(h.grounded(u)&&Math.abs(u.x-to.x)<7&&Math.abs(u.y-to.y)<7&&(kind==='walk'||leftSupport))return {from,to,kind,cost:before-u.moveLeft,frames:frame+1};
  if(h.grounded(u)&&leftSupport&&Math.abs(u.y-to.y)>8)return null;
  if(u.y-apex>550||u.moveLeft<.01)return null;
  stall=Math.hypot(u.x-old.x,u.y-old.y)<.001?stall+1:0;if(stall>35&&u.platformDrop?.phase!=='prepare')return null;
 }
 return null;
}
export class SupportNavigator{
 constructor(C){this.C=C;this.cache=new Map();this.stats={plans:0,traces:0,cacheHits:0,rejected:0};}
 plan(world,actor,goal,{range=24,approach=false}={}){
  const C=this.C;this.stats.plans++;
  const revision=JSON.stringify([world.sceneVersion,world.physics,world.honroAct4PreviewState?.tide,world.terrain.map(t=>[t.id,t.broken,t.x,t.y,t.w,t.h,t.vertices]),['id','cls','side','r','h','walkSpeed','maxMove','bound','slowed','ranks','equipmentIds'].map(k=>actor[k])]);
  if(this.revision!==revision){this.cache.clear();this.revision=revision;}
  const nodes=supportNodes(C,world,actor,[actor,goal]),start={x:actor.x,y:actor.y,key:'current',support:null};
  const supported=C.terrainSurface(world.terrain,actor.x,actor.y-5,actor.y+5);if(!supported){this.stats.rejected++;return {status:'airborne',path:[]};}start.support=supported.t.id;
  nodes.unshift(start);const nearest=Math.min(...nodes.map(n=>Math.hypot(n.x-goal.x,n.y-goal.y))),approachOnly=approach&&nearest>range;if(approachOnly)range=nearest+8;const goals=nodes.filter(n=>Math.hypot(n.x-goal.x,n.y-goal.y)<=range);if(!goals.length){this.stats.rejected++;return {status:'unreachable',reason:'No public support inside goal tolerance',path:[]};}
  const distance=n=>Math.min(...goals.map(z=>Math.hypot(n.x-z.x,n.y-z.y))),open=new Set([start]),cost=new Map([[start,0]]),parent=new Map();let visited=0;
  while(open.size&&visited++<350){const at=[...open].sort((a,z)=>(cost.get(a)+distance(a))-(cost.get(z)+distance(z)))[0];open.delete(at);
   if(goals.includes(at)){const path=[];let n=at;while(parent.has(n)){const p=parent.get(n);path.unshift(p.edge);n=p.from;}return {status:'ready',path,approachOnly,cost:cost.get(at),visited,nodes:nodes.length};}
   const candidates=nodes.filter(n=>n!==at&&Math.abs(n.x-at.x)<=620&&n.y-at.y>=-260&&n.y-at.y<=550).sort((a,z)=>Math.hypot(a.x-at.x,a.y-at.y)-Math.hypot(z.x-at.x,z.y-at.y));
   for(const to of candidates){const key=[at.x,at.y,to.x,to.y].map(n=>n.toFixed(2)).join(':');let edge;
    if(this.cache.has(key)){edge=this.cache.get(key);this.stats.cacheHits++;}else{const kinds=to.y>at.y+45?['walk','drop','walk-off','jump']:['walk','jump'];for(const kind of kinds){this.stats.traces++;edge=traceLeg(C,world,actor,at,to,kind);if(edge)break;}this.cache.set(key,edge||null);}
    if(!edge)continue;const next=cost.get(at)+edge.cost+(edge.kind==='walk'?0:35)+Math.abs(to.y-at.y)*.1;if(next<(cost.get(to)??Infinity)){cost.set(to,next);parent.set(to,{from:at,edge});open.add(to);}
   }
  }
  this.stats.rejected++;return {status:'unreachable',reason:'No collision-checked support connection',path:[],visited,nodes:nodes.length};
 }
}
/** Converts checked legs to ordinary input intentions; never edits the live actor. */
export class RouteFollower{
 constructor(C){this.C=C;this.states=new Map();this.planners=new Map();}
 clear(id){this.states.delete(id);}
 intention(e,u,goal,{range=24,approach=false}={}){
  let state=this.states.get(u.id);const grounded=e.grounded(u);
  if(!grounded)return {kind:'air-control',direction:state?.path[0]?steer(u,state.path[0].to.x):0,step:state?.path[0]??null};
  const changed=!state||state.sceneVersion!==e.b.sceneVersion||Math.hypot(state.goal.x-goal.x,state.goal.y-goal.y)>70||state.goal.kind!==goal.kind||state.range!==range;
  if(changed){const planner=this.planners.get(u.id)||new SupportNavigator(this.C);this.planners.set(u.id,planner);const plan=planner.plan(e.b,u,goal,{range,approach});state={goal:{...goal},range,sceneVersion:e.b.sceneVersion,path:plan.path.map(s=>({...s})),plan,stall:0,last:{x:u.x,y:u.y}};this.states.set(u.id,state);}
  if(state.plan.status!=='ready')return {kind:'blocked',reason:state.plan.reason,plan:state.plan};
  while(state.path.length&&Math.hypot(u.x-state.path[0].to.x,u.y-state.path[0].to.y)<10){state.path.shift();state.stall=0;}
  const step=state.path[0];if(!step)return {kind:'arrived',approachOnly:state.plan.approachOnly,plan:state.plan};
  if(step.started&&step.kind!=='walk'&&step.kind!=='walk-off'){this.clear(u.id);return {kind:'replan',reason:'Landed away from checked endpoint'};}
  const moved=Math.hypot(u.x-state.last.x,u.y-state.last.y);state.stall=moved<.05?state.stall+1:0;state.last={x:u.x,y:u.y};
  if(state.stall>35){this.clear(u.id);return {kind:'blocked',reason:'Observed movement cannot execute checked leg',step};}
  const remaining=Math.max(0,step.cost-Math.hypot(u.x-step.from.x,u.y-step.from.y));if(u.moveLeft<remaining+3){state.stall=0;return {kind:'end-turn',reason:'Leg exceeds remaining ordinary move budget',step};}
  const kind=step.started?'walk':step.kind==='jump'||step.kind==='drop'?step.kind:'walk';
  return {kind,direction:steer(u,step.to.x),step};
 }
 accepted(id){const step=this.states.get(id)?.path[0];if(step)step.started=true;}
}
