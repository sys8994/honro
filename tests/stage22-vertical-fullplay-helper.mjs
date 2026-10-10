/** Observers only. Wrapping production calls never changes their arguments or
 * results. Every live actor write must originate inside a production call. */
export function auditVertical22Engine(b,e,stamp,{previous=null}={}){
 const log=previous||{externalWrites:[],recoveries:[],movement:[]},seen=new WeakSet();let depth=0;
 const guard=()=>{for(const u of b.units){if(seen.has(u))continue;seen.add(u);for(const key of ['x','y','hp','focus','moveLeft']){let value=u[key];Object.defineProperty(u,key,{enumerable:true,configurable:true,get(){return value;},set(next){if(!depth&&next!==value){log.externalWrites.push({...stamp(),id:u.id,key,from:value,to:next});throw Error('External live actor write '+u.id+'.'+key);}value=next;}});}}};
 const names=new Set(['tick','move','jump','walk','integrateBody','fire','hurt','impact','finishAction','enemyAction','wait','select','recover','blast','stepProjectile']);
 for(const key of names){if(key==='constructor'||typeof e[key]!=='function')continue;const call=e[key].bind(e);e[key]=(...args)=>{const u=['walk','jump'].includes(key)?args[0]:null,before=u?.moveLeft;depth++;try{const result=call(...args);if(key==='recover')log.recoveries.push({...stamp(),id:args[0]?.id});if(u?.side===0&&before>u.moveLeft)log.movement.push({...stamp(),id:u.id,cls:u.cls,op:key,cost:before-u.moveLeft,x:u.x,y:u.y});return result;}finally{depth--;}};}
 guard();return{log,guard,production(fn){depth++;try{return fn();}finally{depth--;}}};
}



/** Input-only graph over the actual authored 19 routes. */
export function vertical22Navigator(g,b,e,{tick,ready,record,stageId=22,routes=null,navigationState=null}){
 const C=g.HONRO_CORE,stage=g.HONRO_PROJECT.stages[stageId-1],nodes=[],edges=[],map=new Map(),bySurface=new Map(),nav=new Map(navigationState?.nav||[]),failed=new Map((navigationState?.failed||[]).map(([id,list])=>[id,new Set(list)]));
 const distance=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y),surface=u=>e.contactSurface(u.x,u.y-5,u.y+5)?.t?.id;
 function node(p){const key=`${p.surfaceId}:${p.x.toFixed(1)}:${p.y.toFixed(1)}`;if(map.has(key))return map.get(key);const i=nodes.length;nodes.push({...p});edges.push([]);map.set(key,i);if(!bySurface.has(p.surfaceId))bySurface.set(p.surfaceId,new Set());bySurface.get(p.surfaceId).add(i);return i;}
 function edge(a,z,mode=null){const from=node(a),to=node(z);if(from===to)return;const cost=distance(a,z)+(mode?.generated?850:mode?180:0);if(!edges[from].some(x=>x.to===to&&x.mode?.kind===mode?.kind))edges[from].push({to,cost,mode});}
 function walk(a,z){edge(a,z);if(Math.abs(a.y-z.y)<=Math.abs(a.x-z.x)*1.35+1)edge(z,a);}
 for(const r of routes||stage.design.vertical22.routes.filter(r=>(r.requires||[]).every(req=>b.terrain.find(t=>t.id===req.terrainId)?.broken))){for(let i=0;i<r.anchors.length;i++){let p=r.anchors[i];node(p);const leap=p.jumpTo||p.dropTo;if(leap){const t=b.terrain.find(t=>t.id===leap.support),landing={x:leap.x,y:C.topAt(t,leap.x),surfaceId:t.id};edge(p,landing,{kind:p.jumpTo?'jump':'drop',...leap});p=landing;}const z=r.anchors[i+1];if(!z)continue;if(p.surfaceId===z.surfaceId){const t=b.terrain.find(t=>t.id===p.surfaceId),n=Math.max(1,Math.ceil(Math.abs(z.x-p.x)/90));let old=p;for(let j=1;j<=n;j++){const x=p.x+(z.x-p.x)*j/n,next={x,y:C.topAt(t,x),surfaceId:t.id};walk(old,next);old=next;}}else throw Error('Uncommanded cross-surface route edge '+r.id);}}
 const hero=e.heroesAlive()[0];
 const moveToward=(u,x,speed=1)=>{const dx=x-u.x;if(Math.abs(dx)>.3)e.move(Math.sign(dx)*speed,Math.min(C.STEP,Math.abs(dx)/(u.walkSpeed*speed)));};
 for(const t of b.terrain.filter(t=>t.honroSpaceSurfaceId&&!t.honroCeiling)){const left=Math.max(25,t.x),right=Math.min(b.width-25,t.x+t.w);for(const x of [...Array.from({length:Math.floor((right-left)/80)+1},(_,i)=>left+i*80),right]){const y=C.topAt(t,x);if(!Number.isFinite(y)||y<0||y>b.height)continue;const p={...hero,x,y};if(C.validTerrainContactPose(b.terrain,p))node({x,y,surfaceId:t.id});}}
 for(const site of Object.values(stage.design.space?.sites||{}))if(site.standing)node(site.standing);
 for(const [id,set]of bySurface){const list=[...set].sort((a,z)=>nodes[a].x-nodes[z].x);for(let j=1;j<list.length;j++){const a=nodes[list[j-1]],z=nodes[list[j]];if(distance(a,z)<430&&Math.abs(a.y-z.y)<=Math.abs(a.x-z.x)*1.35+.2)walk(a,z);}}
 // Only the 19 authored routes propose cross-surface jumps and drops.
 const usable=nodes.map(p=>C.validTerrainContactPose(b.terrain,{...hero,x:p.x,y:p.y}));

 const linkKey=(from,to,mode)=>mode?.generated?`${from.surfaceId}>${to.surfaceId}:${mode.kind}`:`${from.surfaceId}:${from.x}>${to.surfaceId}:${to.x}:${mode?.kind||'walk'}`;
 function failLink(u,state,reason){const link=state.links[state.index];if(link){if(!failed.has(u.id))failed.set(u.id,new Set());failed.get(u.id).add(linkKey(link.from,link.point,link.mode));}record({op:'nav-replan',hero:u.cls,reason,expected:state.air?.support,support:surface(u),position:{x:u.x,y:u.y},edge:link});state.air=null;nav.delete(u.id);}
 function nearest(u){const s=surface(u);let best=0,score=Infinity;for(let i=0;i<nodes.length;i++){if(!usable[i])continue;const v=distance(u,nodes[i])+(nodes[i].surfaceId===s?0:400);if(v<score){best=i;score=v;}}return best;}
 function route(u,point,enemy){const from=nearest(u),d=nodes.map(()=>Infinity),prev=nodes.map(()=>null),done=new Set();d[from]=0;for(let n=0;n<nodes.length;n++){let i=-1;for(let j=0;j<nodes.length;j++)if(!done.has(j)&&(i<0||d[j]<d[i]))i=j;if(i<0||!Number.isFinite(d[i]))break;done.add(i);for(const step of edges[i])if(usable[step.to]&&!failed.get(u.id)?.has(linkKey(nodes[i],nodes[step.to],step.mode))&&d[i]+step.cost<d[step.to]){d[step.to]=d[i]+step.cost;prev[step.to]={from:i,...step};}}
  const range=point.approachRange??{archer:550,mage:420,knight:75,occultist:420}[u.cls];let best=-1,score=Infinity;
  for(let i=0;i<nodes.length;i++){if(!usable[i]||!enemy&&point.surfaceId&&nodes[i].surfaceId!==point.surfaceId)continue;const p=nodes[i],delta=distance(p,point),dy=Math.abs(p.y-point.y);let penalty=delta*10;if(enemy){if(delta>1700||dy>(u.cls==='knight'?300:900))continue;penalty=Math.abs(delta-range)*(point.approachRange===undefined?2:100)+Math.max(0,dy-(u.cls==='knight'?60:220))*5;}const total=d[i]+penalty;if(total<score){best=i;score=total;}}
  if(best<0||!Number.isFinite(score))return null;const links=[];for(let i=best;i!==from;){const step=prev[i];if(!step)return null;links.push({from:nodes[step.from],point:nodes[i],mode:step.mode});i=step.from;}links.reverse();if(distance(u,nodes[from])>13)links.unshift({from:{x:u.x,y:u.y},point:nodes[from]});return{links,index:0,point:{...point},enemy,goal:nodes[best]};
 }
 function advance(u,point,enemy=false){let state=nav.get(u.id);if(!state||state.point.id!==point.id||distance(state.point,point)>160||state.enemy!==enemy||state.point.approachRange!==point.approachRange||state.index>=state.links.length){state=route(u,point,enemy);if(!state){record({op:'nav-blocked',hero:u.cls,reason:'no graph route',position:{x:u.x,y:u.y},goal:point});return;}nav.set(u.id,state);}const start={x:u.x,y:u.y};let still=0,recoveryCount=0;
  for(let n=0;n<1600&&ready()&&u.moveLeft>8;n++){
   if(state.air){const a=state.air,from=state.links[state.index]?.from,isDrop=a.kind==='drop',outward=isDrop&&!state.departed&&a.stepOffX!==undefined,aimX=outward?a.stepOffX:a.x;moveToward(u,aimX,a.speed||1);tick();state.airFrames++;
    if(isDrop&&!state.departed&&(a.stepOffX===undefined||Math.abs(u.x-a.stepOffX)<8&&u.y>state.airStartY+8))state.departed=true;
    const landed=e.grounded(u)&&(isDrop?state.departed&&surface(u)===a.support&&Math.abs(u.x-a.x)<18:state.airFrames>30);
    if(landed){if(surface(u)!==a.support){failLink(u,state,'ordinary jump landed on a different support; reject this proposal');break;}record({op:'land',hero:u.cls,x:u.x,y:u.y,support:surface(u),expected:a.support,matched:true});state.air=null;state.index++;}
    else if(state.airFrames>(isDrop?600:240)){failLink(u,state,'ordinary jump/drop did not reach its declared landing; reject this proposal');break;}continue;}
   const link=state.links[state.index];if(!link)break;const p=link.mode?link.from:link.point;const reached=Math.abs(u.x-p.x)<(link.mode?1:8)&&Math.abs(u.y-p.y)<(link.mode?3:30)&&e.grounded(u)&&(!p.surfaceId||surface(u)===p.surfaceId);
   if(reached){if(link.mode){if(link.mode.kind==='jump'){if(u.moveLeft<e.jumpCost(u)+Math.abs(link.mode.x-u.x)+65)break;if(!e.jump(u))break;record({op:'jump',hero:u.cls,from:{x:u.x,y:u.y},to:link.mode});}if(link.mode.kind==='drop')record({op:'drop',hero:u.cls,from:{x:u.x,y:u.y},to:link.mode});state.air=link.mode;state.airFrames=0;state.airStartY=u.y;state.departed=false;continue;}state.index++;continue;}
   if(!link.mode&&e.grounded(u)&&Math.abs(u.y-p.y)>350&&Math.abs(u.x-p.x)<180){record({op:'nav-replan',hero:u.cls,reason:'ordinary fall left a route waypoint above reach',position:{x:u.x,y:u.y},goal:p});nav.delete(u.id);break;}
   const old={x:u.x,y:u.y};moveToward(u,p.x);
   if(e.grounded(u)&&(still>12&&Math.abs(u.x-p.x)>25||Math.abs(u.x-p.x)<25&&u.y-p.y>80)){if(recoveryCount>=3){record({op:'nav-replan',hero:u.cls,reason:'three ordinary recovery jumps did not reach waypoint',position:{x:u.x,y:u.y},goal:p});nav.delete(u.id);break;}if(e.jump(u)){recoveryCount++;record({op:'recovery-jump',hero:u.cls,x:u.x,y:u.y,goal:p});still=0;}}
   tick();still=distance(old,u)<.02?still+1:0;if(still>100){record({op:'nav-blocked',hero:u.cls,position:{x:u.x,y:u.y},support:surface(u),goal:p});nav.delete(u.id);break;}
  }
  for(let i=0;i<300&&ready()&&!e.grounded(u);i++){if(state.air)moveToward(u,state.air.x,state.air.speed||1);tick();}
  if(distance(start,u)>1)record({op:'move',hero:u.cls,from:start,to:{x:u.x,y:u.y},support:surface(u),goal:{id:point.id,x:point.x,y:point.y}});
 }
 return{snapshot:()=>({nav:structuredClone([...nav]),failed:[...failed].map(([id,set])=>[id,[...set]])}),advance,clear:id=>nav.delete(id),surface,nodes:nodes.length,inspectRoute:(u,p,enemy=false)=>route(u,p,enemy)};
}

/** A read-only retreat proposal on the hero's current real support. The caller
 * still has to move there with Engine.move and its remaining movement budget. */
export function vertical22RetreatPoint(g,e,u,foes){
 const C=g.HONRO_CORE,t=e.contactSurface(u.x,u.y-5,u.y+5)?.t;if(!t)return null;
 const candidates=[0,-200,200,-400,400,-650,650,-900,900].map(dx=>{const x=u.x+dx,y=C.topAt(t,x);return{id:'recover-position-'+u.cls,x,y,surfaceId:t.id};}).filter(p=>Number.isFinite(p.y)&&Math.abs(p.y-u.y)<500&&C.validTerrainContactPose(e.b.terrain,{...u,x:p.x,y:p.y}));
 const safety=p=>Math.min(1800,...foes.map(v=>Math.hypot(v.x-p.x,v.y-p.y)))-Math.hypot(p.x-u.x,p.y-u.y)*.16;
 candidates.sort((a,b)=>safety(b)-safety(a));return candidates[0]||null;
}
