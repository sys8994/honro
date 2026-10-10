/** Stage23 test-only navigator, derived from the existing representative route
 * helper with strict authored destination-support and landing checks. It emits
 * only ordinary Engine inputs, never live actor/resource/terrain mutations.
 * The old18/12 helper remains untouched for historical reproducibility. */
export function escortNavigator(g,b,e,{tick,ready,record,stageId=18,routes=null,navigationState=null}){
 const C=g.HONRO_CORE,stage=g.HONRO_PROJECT.stages[stageId-1],nodes=[],edges=[],map=new Map(),bySurface=new Map(),nav=new Map(JSON.parse(JSON.stringify(navigationState?.nav||[]))),failed=new Map((navigationState?.failed||[]).map(([k,v])=>[k,new Set(v)]));
 const distance=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y),surface=u=>e.contactSurface(u.x,u.y-5,u.y+5)?.t?.id;
 function node(p){const key=`${p.surfaceId}:${p.x.toFixed(1)}:${p.y.toFixed(1)}`;if(map.has(key))return map.get(key);const i=nodes.length;nodes.push({...p});edges.push([]);map.set(key,i);if(!bySurface.has(p.surfaceId))bySurface.set(p.surfaceId,new Set());bySurface.get(p.surfaceId).add(i);return i;}
 function edge(a,z,mode=null){const from=node(a),to=node(z);if(from===to)return;const cost=distance(a,z)+(mode?.generated?850:mode?180:0);if(!edges[from].some(x=>x.to===to&&x.mode?.kind===mode?.kind))edges[from].push({to,cost,mode});}
 function walk(a,z){edge(a,z);if(Math.abs(a.y-z.y)<=Math.abs(a.x-z.x)*1.35+1)edge(z,a);}
 for(const r of routes||stage.design.space.routes.filter(r=>r.bellState!=='settled'||g.HonroStage18Bell.memory(b).status==='settled')){for(let i=0;i<r.anchors.length;i++){let p=r.anchors[i];node(p);const leap=p.jumpTo||p.dropTo;if(leap){const t=b.terrain.find(t=>t.id===leap.support),landing={x:leap.x,y:C.topAt(t,leap.x),surfaceId:t.id};edge(p,landing,{kind:p.jumpTo?'jump':'drop',...leap});if(p.jumpTo&&Math.abs(p.x-landing.x)<=320&&Math.abs(p.y-landing.y)<=225&&(p.x<t.x-12||p.x>t.x+t.w+12))edge(landing,p,{kind:'jump',generated:true,x:p.x,support:p.surfaceId,speed:leap.speed||.35});p=landing;}const z=r.anchors[i+1];if(!z)continue;if(p.surfaceId===z.surfaceId){const t=b.terrain.find(t=>t.id===p.surfaceId),n=Math.max(1,Math.ceil(Math.abs(z.x-p.x)/90));let old=p;for(let j=1;j<=n;j++){const x=p.x+(z.x-p.x)*j/n,next={x,y:C.topAt(t,x),surfaceId:t.id};walk(old,next);old=next;}}else walk(p,z);}}
 const hero=e.heroesAlive()[0];
 for(const t of b.terrain.filter(t=>t.honroSpaceSurfaceId&&!t.honroCeiling)){const left=Math.max(25,t.x),right=Math.min(b.width-25,t.x+t.w);for(const x of [...Array.from({length:Math.floor((right-left)/80)+1},(_,i)=>left+i*80),right]){const y=C.topAt(t,x);if(!Number.isFinite(y)||y<0||y>b.height)continue;const p={...hero,x,y};if(C.validTerrainContactPose(b.terrain,p))node({x,y,surfaceId:t.id});}}
 for(const site of Object.values(stage.design.space?.sites||{}))if(site.standing)node(site.standing);
 for(const [id,set]of bySurface){const list=[...set].sort((a,z)=>nodes[a].x-nodes[z].x);for(let j=1;j<list.length;j++){const a=nodes[list[j-1]],z=nodes[list[j]];if(distance(a,z)<430&&Math.abs(a.y-z.y)<=Math.abs(a.x-z.x)*1.35+.2)walk(a,z);}}
 // Small authored cover tops are legitimate landing surfaces too. Propose local
 // basic jump/step-off links; live physics must still execute every crossing.
 const usable=nodes.map(p=>C.validTerrainContactPose(b.terrain,{...hero,x:p.x,y:p.y}));
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
  const a=nodes[i],z=nodes[j];if(a.surfaceId===z.surfaceId)continue;
  if(Math.abs(a.x-z.x)<95&&Math.abs(a.y-z.y)<35){walk(a,z);continue;}
  if(!usable[i]||!usable[j]||Math.abs(a.x-z.x)>210||Math.abs(a.y-z.y)>225)continue;
  for(const [from,to]of [[a,z],[z,a]]){
   const t=b.terrain.find(t=>t.id===from.surfaceId),dy=to.y-from.y;
   if(dy>35){if(to.x>t.x-8&&to.x<t.x+t.w+8)continue;edge(from,to,{kind:'drop',generated:true,x:to.x,support:to.surfaceId,stepOffX:to.x,speed:.65});}
   else edge(from,to,{kind:'jump',generated:true,x:to.x,support:to.surfaceId,speed:.65});
  }
 }

 const linkKey=(from,to,mode)=>mode?.generated?`${from.surfaceId}>${to.surfaceId}:${mode.kind}`:`${from.surfaceId}:${from.x}>${to.surfaceId}:${to.x}:${mode?.kind||'walk'}`;
 function failLink(u,state,reason){const link=state.links[state.index];if(link){if(!failed.has(u.id))failed.set(u.id,new Set());failed.get(u.id).add(linkKey(link.from,link.point,link.mode));}record({op:'nav-replan',hero:u.cls,reason,expected:state.air?.support,support:surface(u),position:{x:u.x,y:u.y},edge:link});state.air=null;nav.delete(u.id);}
 function nearest(u){const s=surface(u);let best=0,score=Infinity;for(let i=0;i<nodes.length;i++){if(!usable[i])continue;const v=distance(u,nodes[i])+(nodes[i].surfaceId===s?0:400);if(v<score){best=i;score=v;}}return best;}
 function route(u,point,enemy){const from=nearest(u),d=nodes.map(()=>Infinity),prev=nodes.map(()=>null),done=new Set();d[from]=0;for(let n=0;n<nodes.length;n++){let i=-1;for(let j=0;j<nodes.length;j++)if(!done.has(j)&&(i<0||d[j]<d[i]))i=j;if(i<0||!Number.isFinite(d[i]))break;done.add(i);for(const step of edges[i])if(usable[step.to]&&!failed.get(u.id)?.has(linkKey(nodes[i],nodes[step.to],step.mode))&&d[i]+step.cost<d[step.to]){d[step.to]=d[i]+step.cost;prev[step.to]={from:i,...step};}}
  const range=point.approachRange??{archer:550,mage:420,knight:75,occultist:420}[u.cls];let best=-1,score=Infinity;
  for(let i=0;i<nodes.length;i++){if(!usable[i]||point.surfaceId&&nodes[i].surfaceId!==point.surfaceId)continue;const p=nodes[i],delta=distance(p,point),dy=Math.abs(p.y-point.y);let penalty=delta*10;if(enemy){if(delta>1700||dy>(u.cls==='knight'?300:900))continue;penalty=Math.abs(delta-range)*(point.approachRange===undefined?2:100)+Math.max(0,dy-(u.cls==='knight'?60:220))*5;}const total=d[i]+penalty;if(total<score){best=i;score=total;}}
  if(best<0||!Number.isFinite(score))return null;const links=[];for(let i=best;i!==from;){const step=prev[i];if(!step)return null;links.push({from:nodes[step.from],point:nodes[i],mode:step.mode});i=step.from;}links.reverse();if(distance(u,nodes[from])>13)links.unshift({from:{x:u.x,y:u.y},point:nodes[from]});return{links,index:0,point:{...point},enemy,goal:nodes[best]};
 }
 function advance(u,point,enemy=false){let state=nav.get(u.id);if(!state||state.point.id!==point.id||state.point.surfaceId!==point.surfaceId||distance(state.point,point)>160||state.enemy!==enemy||state.point.approachRange!==point.approachRange||state.index>=state.links.length){state=route(u,point,enemy);if(!state){record({op:'nav-blocked',hero:u.cls,reason:'no graph route',position:{x:u.x,y:u.y},goal:point});return;}nav.set(u.id,state);}const start={x:u.x,y:u.y};let still=0,recoveryCount=0;
  for(let n=0;n<1600&&ready()&&u.moveLeft>8;n++){
   if(state.air){const a=state.air,from=state.links[state.index]?.from,isDrop=a.kind==='drop',outward=isDrop&&!state.departed&&a.stepOffX!==undefined,aimX=outward?a.stepOffX:a.x;if(Math.abs(u.x-aimX)>3)e.move(Math.sign(aimX-u.x)*(a.speed||(isDrop?1:.35)),C.STEP);tick();state.airFrames++;
    if(isDrop&&!state.departed&&(a.stepOffX===undefined||Math.abs(u.x-a.stepOffX)<8&&u.y>state.airStartY+8))state.departed=true;
    const landed=e.grounded(u)&&(isDrop?state.departed&&surface(u)===a.support&&Math.abs(u.x-a.x)<18:state.airFrames>30&&surface(u)===a.support&&Math.abs(u.x-a.x)<22);
    if(landed){if(surface(u)!==a.support){failLink(u,state,'ordinary jump landed on a different support; reject this proposal');break;}record({op:'land',hero:u.cls,x:u.x,y:u.y,support:surface(u),expected:a.support,matched:true});state.air=null;state.index++;}
    else if(state.airFrames>(isDrop?600:240)){failLink(u,state,'ordinary jump/drop did not reach its declared landing; reject this proposal');break;}continue;}
   const link=state.links[state.index];if(!link)break;const p=link.mode?link.from:link.point;const reached=Math.abs(u.x-p.x)<14&&Math.abs(u.y-p.y)<55&&e.grounded(u)&&(!p.surfaceId||surface(u)===p.surfaceId);
   if(reached){if(link.mode){if(link.mode.kind==='jump'){if(u.moveLeft<e.jumpCost(u)+Math.abs(link.mode.x-u.x)+65)break;if(!e.jump(u))break;record({op:'jump',hero:u.cls,from:{x:u.x,y:u.y},to:link.mode});}if(link.mode.kind==='drop')record({op:'drop',hero:u.cls,from:{x:u.x,y:u.y},to:link.mode});state.air=link.mode;state.airFrames=0;state.airStartY=u.y;state.departed=false;continue;}state.index++;continue;}
   if(!link.mode&&e.grounded(u)&&Math.abs(u.y-p.y)>350&&Math.abs(u.x-p.x)<180){record({op:'nav-replan',hero:u.cls,reason:'ordinary fall left a route waypoint above reach',position:{x:u.x,y:u.y},goal:p});nav.delete(u.id);break;}
   const old={x:u.x,y:u.y},dx=p.x-u.x,surfaceSeam=p.surfaceId&&surface(u)!==p.surfaceId&&e.grounded(u)&&Math.abs(u.y-p.y)<55;
   // A topological seam may be a few pixels beyond the old 5px stopping band.
   // Continue ordinary fine walking into the declared surface, in the existing
   // route's direction; never mark the neighbouring ground as the bridge.
   if(Math.abs(dx)<=5&&surfaceSeam){const next=state.links[state.index+1]?.point||p,dir=Math.sign(next.x-(link.from?.x??u.x))||Math.sign(dx);if(dir)e.move(dir*.35,C.STEP);}
   else if(Math.abs(dx)>5)e.move(Math.sign(dx)*(Math.abs(dx)<22?.35:1),C.STEP);
   if(e.grounded(u)&&(still>12&&Math.abs(u.x-p.x)>25||Math.abs(u.x-p.x)<25&&u.y-p.y>80)){if(recoveryCount>=3){record({op:'nav-replan',hero:u.cls,reason:'three ordinary recovery jumps did not reach waypoint',position:{x:u.x,y:u.y},goal:p});nav.delete(u.id);break;}if(e.jump(u)){recoveryCount++;record({op:'recovery-jump',hero:u.cls,x:u.x,y:u.y,goal:p});still=0;}}
   tick();still=distance(old,u)<.02?still+1:0;if(still>100){record({op:'nav-blocked',hero:u.cls,position:{x:u.x,y:u.y},support:surface(u),goal:p});nav.delete(u.id);break;}
  }
  for(let i=0;i<300&&ready()&&!e.grounded(u);i++){if(state.air&&Math.abs(u.x-state.air.x)>3)e.move(Math.sign(state.air.x-u.x)*(state.air.speed||.35),C.STEP);tick();}
  if(distance(start,u)>1)record({op:'move',hero:u.cls,from:start,to:{x:u.x,y:u.y},support:surface(u),goal:{id:point.id,x:point.x,y:point.y}});
 }
 return{advance,clear:id=>nav.delete(id),surface,nodes:nodes.length,snapshot:()=>JSON.parse(JSON.stringify({nav:[...nav],failed:[...failed].map(([k,v])=>[k,[...v]])})),inspectRoute:(u,p,enemy=false)=>route(u,p,enemy)};
}
