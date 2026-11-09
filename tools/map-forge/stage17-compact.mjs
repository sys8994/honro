/** Stage17 compact prototype. Brace/crack, possessed hoist, and worker/axle
 * enclaves retain local distances; unequal approach and transport spans shorten. This is not a
 * homothetic map/actor/physics scale and does not install itself in campaign. */
const clone=x=>JSON.parse(JSON.stringify(x));
export const STAGE17_X_KNOTS=[[-6000,-5000],[0,0],[1000,700],[1700,900],[2750,1750],[3310,2310],[4800,2820],[5170,3060],[5800,3400],[6600,4200],[8300,4850],[8900,5450],[11200,6200],[17200,11200]];
export const STAGE17_Y_OFFSET=-2000;
export function stage17CompactX(x){
 let i=1;while(i<STAGE17_X_KNOTS.length-1&&x>STAGE17_X_KNOTS[i][0])i++;
 const[a,b]=STAGE17_X_KNOTS[i-1],[c,d]=STAGE17_X_KNOTS[i];return b+(x-a)*(d-b)/(c-a);
}
const mapY=y=>y+STAGE17_Y_OFFSET;
function spatial(value){
 if(Array.isArray(value))return value.map(spatial);if(!value||typeof value!=='object')return value;
 const out=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,spatial(v)]));
 if(Number.isFinite(value.x)){out.x=stage17CompactX(value.x);if(Number.isFinite(value.w))out.w=stage17CompactX(value.x+value.w)-out.x;}
 if(Number.isFinite(value.y))out.y=mapY(value.y);
 for(const key of ['left','right','minX','maxX','boundaryX','warningX','stepOffX'])if(Number.isFinite(value[key]))out[key]=stage17CompactX(value[key]);
 for(const key of ['top','bottom','warningY','roofY','targetY','surfaceY'])if(Number.isFinite(value[key]))out[key]=mapY(value[key]);
 return out;
}
function terrain(t){
 const points=[],walk=[];
 for(let i=0;i<t.points.length;i++){
  const a=t.points[i],b=t.points[(i+1)%t.points.length],cuts=[0,...STAGE17_X_KNOTS.map(k=>(k[0]-a.x)/(b.x-a.x)).filter(f=>f>1e-8&&f<1-1e-8)].sort((a,b)=>a-b);
  for(const f of cuts){if(t.properties?.honroWalkEdges?.includes(i))walk.push(points.length);points.push({x:stage17CompactX(a.x+(b.x-a.x)*f),y:mapY(a.y+(b.y-a.y)*f)});}
 }
 const out={...spatial(t),points,properties:{...spatial(t.properties||{}),honroWalkEdges:walk}};
 for(const key of ['top','bottom'])if(Array.isArray(t.properties?.[key]))out.properties[key]=t.properties[key].map(([x,y])=>[stage17CompactX(x),mapY(y)]);
 return out;
}
function environment(original){
 const out=clone(original);if(!out)return out;
 for(const z of out.zones||[]){if(Number.isFinite(z.from))z.from=Math.max(0,mapY(z.from));if(Number.isFinite(z.to))z.to=Math.min(4600,mapY(z.to));z.blend=Math.min(z.blend,(z.to-z.from)*.45);}
 if(out.zones?.length)out.zones.at(-1).to=4600;
 for(const group of out.groups||[]){const old=original.groups.find(g=>g.id===group.id);group.x=stage17CompactX(old.x||0);group.y=mapY(old.y||0);}
 // Environment support points are local to their group; only group Y moves.
 for(const s of out.surfaces||[]){const group=original.groups?.find(g=>g.id===s.groupId),gx=group?.x||0,tx=stage17CompactX(gx),old=original.surfaces.find(v=>v.id===s.id);s.points=s.points?.map(p=>({...p,x:stage17CompactX(p.x+gx)-tx}));if(Number.isFinite(s.compositionWidth))s.compositionWidth=6200;
  // Background coverage is determined by camera/depth, not map-width ratio.
  // Retain the original distant endpoint margin instead of compressing it.
  if(s.points?.length){s.points[0].x=Math.min(s.points[0].x,old.points[0].x+gx-tx);s.points.at(-1).x=Math.max(s.points.at(-1).x,old.points.at(-1).x+gx-tx);}}
 return out;
}
function art(project,source){
 const lib=new Map(project.library.map(a=>[a.id,a])),assets=[],elements=[],replaced=new Set(),stats=[];
 const isBody=e=>(e.x||0)===0&&(e.y||0)===0&&(e.assetId.startsWith('act2-traced:stage17-')||e.assetId.startsWith('stage17:worksite-'));
 const count=(v,symbols,stack=new Set())=>{
  let nodes=1,chars=v.d?.length||v.dParts?.reduce((n,p)=>n+p.length,0)||0;
  if(v.tag==='use'){if(stack.has(v.symbol))throw Error('Stage17 cyclic native symbol');const n=new Set(stack);n.add(v.symbol);const z=count(symbols[v.symbol],symbols,n);nodes+=z.nodes;chars+=z.chars;}
  for(const c of v.children||[]){const z=count(c,symbols,stack);nodes+=z.nodes;chars+=z.chars;}return{nodes,chars};
 };
 for(const e of source.elements.filter(isBody)){
  const a=lib.get(e.assetId);if(!a?.vector||a.collision?.length||e.rotation)throw Error('Stage17 BODY must be unrotated collision-free native vector: '+e.assetId);
  const scale=e.scale??1,matrix=[scale,0,0,scale,(e.x||0)-scale*(a.anchor?.x||0),(e.y||0)-scale*(a.anchor?.y||0)],b=a.bounds;
  const left=matrix[0]*b.x+matrix[4],right=left+scale*b.w,top=matrix[3]*b.y+matrix[5],bottom=top+scale*b.h;
  const cuts=[left,...STAGE17_X_KNOTS.map(k=>k[0]).filter(x=>x>left&&x<right),right],size=count(a.vector.root,a.vector.symbols||{});
  if(size.nodes>470||size.chars>3700000)throw Error('Stage17 native BODY exceeds safe composition budget: '+a.id);
  const chunk=Math.max(1,Math.min(16,Math.floor(475/(size.nodes+3)),size.chars?Math.floor(3700000/size.chars):16));let chunks=0;
  for(let start=0;start<cuts.length-1;start+=chunk){
   const end=Math.min(cuts.length-1,start+chunk),id='act2-compact:stage17-'+e.id.replace(/[^\w-]/g,'-')+'-'+(++chunks),clips=clone(a.vector.clips||{}),symbols=clone(a.vector.symbols||{}),symbol='compact17-source-world',children=[];
   if(symbols[symbol])throw Error('Stage17 compact native symbol collision');symbols[symbol]={tag:'g',transform:matrix,children:[clone(a.vector.root)]};
   for(let i=start;i<end;i++){
    const x=cuts[i],z=cuts[i+1],sx=(stage17CompactX(z)-stage17CompactX(x))/(z-x),dx=stage17CompactX(x)-sx*x,key='compact17-strip-'+i;
    if(clips[key])throw Error('Stage17 compact clip collision');clips[key]=[`M${x} ${top-2}H${z}V${bottom+2}H${x}Z`];
    children.push({tag:'g',transform:[sx,0,0,1,dx,STAGE17_Y_OFFSET],clipPath:key,pixelSnapClip:true,children:[{tag:'use',symbol}]});
   }
   const bounds={x:stage17CompactX(cuts[start]),y:mapY(top),w:stage17CompactX(cuts[end])-stage17CompactX(cuts[start]),h:bottom-top};
   const asset={...clone(a),id,name:a.name+' · compact17 '+chunks,visual:[],collision:[],anchor:{x:0,y:0},sockets:[],bounds,reference:{...clone(a.reference||{}),bounds:clone(bounds),foot:{x:0,y:0},heightM:bounds.h/60,scaleRange:[1,1],backgroundRange:[1,1]},params:{...clone(a.params||{}),compact17Revision:1,compactSourceAssetId:a.id,compactSourceInstance:e.id,compactWarp:{xKnots:clone(STAGE17_X_KNOTS),yOffset:STAGE17_Y_OFFSET}},vector:{version:1,viewBox:[bounds.x,bounds.y,bounds.w,bounds.h],root:{tag:'g',children},clips,symbols,...(a.vector.gradients?{gradients:clone(a.vector.gradients)}:{})}};
   delete asset.params.surfaceCoverage;delete asset.params.surfaceJunction;assets.push(asset);elements.push({...clone(e),id:id.replace(':','-'),assetId:id,x:0,y:0,scale:1,rotation:0});
  }
  replaced.add(e.id);stats.push({source:a.id,chunks,sourceNodes:size.nodes,sourceCompoundChars:size.chars,strips:cuts.length-1});
 }
 if(replaced.size!==18)throw Error('Expected fifteen native worksite assemblies and three traced Stage17 BODY planes');
 return{assets,elements,replaced,stats};
}
export function createStage17Compact(project){
 const source=project.stages.find(s=>s.metadata?.stageId===17);
 if(!source||source.width!==11200||source.height!==8200||source.initialState?.honroReviewedSceneRevision!==517)throw Error('Reviewed original Stage17 source required');
 if(source.design?.compact17)throw Error('Stage17 compact prototype cannot be applied twice');
 const stage=spatial(clone(source)),body=art(project,source);
 stage.width=6200;stage.height=4600;stage.playBounds={left:0,top:0,right:6200,bottom:4600};stage.terrainBounds=spatial(source.terrainBounds);stage.environment=environment(source.environment);
 stage.terrains=source.terrains.map(terrain);stage.elements=stage.elements.filter(e=>!body.replaced.has(e.id)).concat(body.elements);
 for(const t of stage.terrains)if(t.playProjection?.bounds)t.playProjection.bounds={left:0,top:0,right:6200,bottom:4840};
 const pairs=(points,closed=false)=>{const result=[];for(let i=0;i<points.length-(closed?0:1);i++){const a=points[i],b=points[(i+1)%points.length],cuts=[0,...STAGE17_X_KNOTS.map(k=>(k[0]-a[0])/(b[0]-a[0])).filter(f=>f>1e-8&&f<1-1e-8)].sort((a,b)=>a-b);for(const f of cuts)result.push([stage17CompactX(a[0]+(b[0]-a[0])*f),mapY(a[1]+(b[1]-a[1])*f)]);}if(!closed&&points.length)result.push([stage17CompactX(points.at(-1)[0]),mapY(points.at(-1)[1])]);return result;};
 stage.materials=source.materials.map(material=>{const m=spatial(material);for(const key of ['surface','bottom','points'])if(Array.isArray(material[key]))m[key]=key==='surface'?material[key].map(([x,y])=>[stage17CompactX(x),mapY(y)]):pairs(material[key],key==='points');return m;});
 for(const plane of stage.design.space.terrainPlanes||[]){const old=source.design.space.terrainPlanes.find(p=>p.id===plane.id);if(old?.points)plane.points=pairs(old.points,true);}
 for(const surface of stage.design.space.surfaces||[]){const t=stage.terrains.find(t=>t.id===surface.terrainId);if(t?.properties?.honroWalkEdges)surface.edgeIndices=clone(t.properties.honroWalkEdges);}
 const selected=new Set(['a2-enemy-0','a2-enemy-1','ws-west-screen','a2-enemy-2','a2-enemy-3','ws-brace-cart','ws-brace-captain','a2-enemy-4','ws-brace-bat','ws-core-front','ws-core-brace','ws-core-screen','act2-hoist','ws-core-foreman','a2-enemy-9','ws-core-bat','ws-upper-toolguard','ws-upper-bat','a2-enemy-18','ws-axle-point','ws-service-front','ws-service-captain','a2-enemy-19','ws-gallery-cart','ws-notes-front','ws-notes-cart']);
 const required=new Set((source.initialState.honroV4Steps||[]).flatMap(s=>[...(s.defeatIds||[]),...(s.target?[s.target]:[]),...(s.worker&&!s.worker.startsWith('@')?[s.worker]:[])]));
 for(const id of required)if(source.units.some(u=>u.id===id&&u.team==='enemy'))selected.add(id);
 stage.units=stage.units.filter(u=>u.team!=='enemy'||selected.has(u.id));
 if(stage.units.filter(u=>u.team==='enemy').length!==26)throw Error('Unexpected Stage17 compact roster');
 stage.encounters=stage.encounters.map(e=>({...e,unitIds:e.unitIds.filter(id=>stage.units.some(u=>u.id===id))})).filter(e=>e.unitIds.length);
 const topAt=(id,x)=>{const t=stage.terrains.find(t=>t.id===id),ys=[];for(const i of t?.properties?.honroWalkEdges||[]){const a=t.points[i],b=t.points[(i+1)%t.points.length];if(a.x!==b.x&&x>=Math.min(a.x,b.x)-1e-6&&x<=Math.max(a.x,b.x)+1e-6)ys.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));}if(!ys.length)throw Error('No compact Stage17 spawn support '+id+' @ '+x);return Math.min(...ys);};
 // Density reactions remain their original exact three-member events. A
 // coordinate warp must not compress the physical bodies' mutual clearance.
 // Preserve each primary/alternate group's local spacing, then re-seat ground
 // members on its transformed real support; no live battle is altered here.
 const responseStats=[];
 for(let i=0;i<stage.events.length;i++){
  const ev=stage.events[i],old=source.events[i];if(ev.honroDensityResponse!==1)continue;
  const reshape=(rows,originalRows)=>{const base=originalRows[0].x;let left=-Infinity,right=Infinity;for(let j=0;j<rows.length;j++){if(rows[j].air)continue;const t=stage.terrains.find(t=>t.id===(rows[j].support||rows[j].surfaceId)),edges=(t?.properties?.honroWalkEdges||[]).flatMap(i=>[t.points[i].x,t.points[(i+1)%t.points.length].x]),offset=originalRows[j].x-base;left=Math.max(left,Math.min(...edges)+48-offset);right=Math.min(right,Math.max(...edges)-48-offset);}if(left>right)throw Error('Compact Stage17 response support is too short');const preferred=rows[0].support==='ws-west-machine-plinth'?stage17CompactX(originalRows[1].x)-(originalRows[1].x-base):stage17CompactX(base),target=Math.max(left,Math.min(right,preferred));return rows.map((row,j)=>{const original=originalRows[j],x=target+(original.x-base),support=row.support||row.surfaceId;return{...row,x,y:row.air?mapY(original.y):topAt(support,x)};});};
  ev.action.actions=reshape(ev.action.actions,old.action.actions);ev.entry={...ev.entry,x:ev.action.actions[0].x,y:ev.action.actions[0].y};
  if(ev.honroDensityAlternatives)ev.honroDensityAlternatives=ev.honroDensityAlternatives.map((rows,j)=>reshape(rows,old.honroDensityAlternatives[j]));
  responseStats.push({id:ev.id,trigger:clone(ev.honroDensityTrigger),count:ev.action.actions.reduce((n,a)=>n+(a.n||1),0)});
 }
 const init=stage.initialState;init.honroAct2CompactRevision=1;
 if(init.honroV4Worksite.minCarry!==60)throw Error('Stage17 carry threshold changed');
 stage.design.compact17={revision:1,status:'prototype-needs-focused-worksite-movement-event-and-browser-review',sourceBounds:[11200,8200],bounds:[6200,4600],xKnots:clone(STAGE17_X_KNOTS),yOffset:STAGE17_Y_OFFSET,localEnclaves:[{oldX:[2750,3310],purpose:'brace/crack and short access steps',xDistancesPreserved:true},{oldX:[5800,6600],purpose:'possessed hoist and physical cable rig',xDistancesPreserved:true},{oldX:[8300,8900],purpose:'workers, loaded handoff, repair/socket/retreat',xDistancesPreserved:true}],yDistancesPreserved:true,roster:{initial:26,finiteWorkDefense:6,finiteDensityResponses:6,totalFiniteBudget:38,selectedIds:[...selected]},art:'fifteen existing native world assemblies and three traced planes recomposed; actors/props retain native size',physicalThresholds:{minCarry:60,braceDuration:1.25,meshDuration:1.5,fullWheelRotation:Math.PI*2},responses:responseStats};
 stage.design.space.topologyId='compact-brace-hoist-carry-and-worksite-defense';stage.metadata.compactStatus='selected-layout';
 return{source:clone(source),stage,assets:body.assets,artStats:{assets:body.assets.length,serializedBytes:body.assets.reduce((n,a)=>n+JSON.stringify(a).length,0),details:body.stats},preserved:{dialogueRows:true,stepIds:true,winConditions:true,mandatoryInitialTargets:true,finiteEvents:true,physicalThresholds:true},integrationNotes:['Install after reviewed17 author, new entries only.','Do not rerun original author coordinates after package override.','Existing live snapshots must not be moved or reauthored.','Two density responses are active on fresh reviewed17 and retain3+3, in addition to six work-defense carts.','Run targeted brace/hypnosis-free hoist separation, single-owner loaded carry>=60, worker join/retreat, finite density3+3 and defense6, full wheel/locks/load-test, save/Continue and native/browser review before adoption.']};
}
