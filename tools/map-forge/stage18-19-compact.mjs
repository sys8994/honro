/** Stage18/19 shared-place compact prototype. The enormous bell, its supports,
 * rescue gallery, farewell visitors and actual motion retain native size. Only
 * unequal outer approach/exit margins shorten; all heights translate intact. This is not a
 * homothetic map/actor/physics scale and does not install itself in campaign. */
const clone=x=>JSON.parse(JSON.stringify(x));
export const STAGE1819_X_KNOTS=[[-6000,-5000],[0,0],[1780,890],[2530,1370],[3310,1750],[5600,2800],[9600,6800],[13600,8200],[19600,13200]];
export const STAGE1819_Y_OFFSET=-1000;
export function stage1819CompactX(x){
 let i=1;while(i<STAGE1819_X_KNOTS.length-1&&x>STAGE1819_X_KNOTS[i][0])i++;
 const[a,b]=STAGE1819_X_KNOTS[i-1],[c,d]=STAGE1819_X_KNOTS[i];return b+(x-a)*(d-b)/(c-a);
}
const mapY=y=>y+STAGE1819_Y_OFFSET;
function spatial(value){
 if(Array.isArray(value))return value.map(spatial);if(!value||typeof value!=='object')return value;
 const out=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,spatial(v)]));
 if(Number.isFinite(value.x)){out.x=stage1819CompactX(value.x);if(Number.isFinite(value.w))out.w=stage1819CompactX(value.x+value.w)-out.x;}
 if(Number.isFinite(value.y))out.y=mapY(value.y);
 for(const key of ['left','right','minX','maxX','boundaryX','warningX','stepOffX','bodyCenterX'])if(Number.isFinite(value[key]))out[key]=stage1819CompactX(value[key]);
 for(const key of ['top','bottom','warningY','roofY','targetY','surfaceY','lipY','crownY'])if(Number.isFinite(value[key]))out[key]=mapY(value[key]);
 return out;
}
function terrain(t){
 const points=[],walk=[];
 for(let i=0;i<t.points.length;i++){
  const a=t.points[i],b=t.points[(i+1)%t.points.length],cuts=[0,...STAGE1819_X_KNOTS.map(k=>(k[0]-a.x)/(b.x-a.x)).filter(f=>f>1e-8&&f<1-1e-8)].sort((a,b)=>a-b);
  for(const f of cuts){if(t.properties?.honroWalkEdges?.includes(i))walk.push(points.length);points.push({x:stage1819CompactX(a.x+(b.x-a.x)*f),y:mapY(a.y+(b.y-a.y)*f)});}
 }
 const out={...spatial(t),points,properties:{...spatial(t.properties||{}),honroWalkEdges:walk}};
 for(const key of ['top','bottom'])if(Array.isArray(t.properties?.[key]))out.properties[key]=t.properties[key].map(([x,y])=>[stage1819CompactX(x),mapY(y)]);
 return out;
}
function environment(original){
 const out=clone(original);if(!out)return out;
 for(const z of out.zones||[]){if(Number.isFinite(z.from))z.from=Math.max(0,mapY(z.from));if(Number.isFinite(z.to))z.to=Math.min(7000,mapY(z.to));z.blend=Math.min(z.blend,(z.to-z.from)*.45);}
 if(out.zones?.length)out.zones.at(-1).to=7000;
 for(const group of out.groups||[]){const old=original.groups.find(g=>g.id===group.id);group.x=stage1819CompactX(old.x||0);group.y=mapY(old.y||0);}
 // Environment support points are local to their group; only group Y moves.
 for(const s of out.surfaces||[]){const group=original.groups?.find(g=>g.id===s.groupId),gx=group?.x||0,tx=stage1819CompactX(gx),old=original.surfaces.find(v=>v.id===s.id);s.points=s.points?.map(p=>({...p,x:stage1819CompactX(p.x+gx)-tx}));if(Number.isFinite(s.compositionWidth))s.compositionWidth=8200;
  // Background coverage is determined by camera/depth, not map-width ratio.
  // Retain the original distant endpoint margin instead of compressing it.
  if(s.points?.length){s.points[0].x=Math.min(s.points[0].x,old.points[0].x+gx-tx);s.points.at(-1).x=Math.max(s.points.at(-1).x,old.points.at(-1).x+gx-tx);}}
 return out;
}
function art(project,source,chapter){
 const lib=new Map(project.library.map(a=>[a.id,a])),assets=[],elements=[],replaced=new Set(),stats=[];
 const isBody=e=>(e.x||0)===0&&(e.y||0)===0&&(e.assetId.startsWith('act2-traced:stage18-')||e.assetId.startsWith('stage18:bell-'));
 const count=(v,symbols,stack=new Set())=>{
  let nodes=1,chars=v.d?.length||v.dParts?.reduce((n,p)=>n+p.length,0)||0;
  if(v.tag==='use'){if(stack.has(v.symbol))throw Error('Stage18/19 cyclic native symbol');const n=new Set(stack);n.add(v.symbol);const z=count(symbols[v.symbol],symbols,n);nodes+=z.nodes;chars+=z.chars;}
  for(const c of v.children||[]){const z=count(c,symbols,stack);nodes+=z.nodes;chars+=z.chars;}return{nodes,chars};
 };
 for(const e of source.elements.filter(isBody)){
  const a=lib.get(e.assetId);if(!a?.vector||a.collision?.length||e.rotation)throw Error('Stage18/19 BODY must be unrotated collision-free native vector: '+e.assetId);
  const scale=e.scale??1,matrix=[scale,0,0,scale,(e.x||0)-scale*(a.anchor?.x||0),(e.y||0)-scale*(a.anchor?.y||0)],b=a.bounds;
  const left=matrix[0]*b.x+matrix[4],right=left+scale*b.w,top=matrix[3]*b.y+matrix[5],bottom=top+scale*b.h;
  const cuts=[left,...STAGE1819_X_KNOTS.map(k=>k[0]).filter(x=>x>left&&x<right),right],size=count(a.vector.root,a.vector.symbols||{});
  if(size.nodes>470||size.chars>3700000)throw Error('Stage18/19 native BODY exceeds safe composition budget: '+a.id);
  const chunk=Math.max(1,Math.min(16,Math.floor(475/(size.nodes+3)),size.chars?Math.floor(3700000/size.chars):16));let chunks=0;
  for(let start=0;start<cuts.length-1;start+=chunk){
   const end=Math.min(cuts.length-1,start+chunk),id='act2-compact:stage'+chapter+'-'+e.id.replace(/[^\w-]/g,'-')+'-'+(++chunks),clips=clone(a.vector.clips||{}),symbols=clone(a.vector.symbols||{}),symbol='compact1819-source-world',children=[];
   if(symbols[symbol])throw Error('Stage18/19 compact native symbol collision');symbols[symbol]={tag:'g',transform:matrix,children:[clone(a.vector.root)]};
   for(let i=start;i<end;i++){
    const x=cuts[i],z=cuts[i+1],sx=(stage1819CompactX(z)-stage1819CompactX(x))/(z-x),dx=stage1819CompactX(x)-sx*x,key='compact1819-strip-'+i;
    if(clips[key])throw Error('Stage18/19 compact clip collision');clips[key]=[`M${x} ${top-2}H${z}V${bottom+2}H${x}Z`];
    children.push({tag:'g',transform:[sx,0,0,1,dx,STAGE1819_Y_OFFSET],clipPath:key,pixelSnapClip:true,children:[{tag:'use',symbol}]});
   }
   const bounds={x:stage1819CompactX(cuts[start]),y:mapY(top),w:stage1819CompactX(cuts[end])-stage1819CompactX(cuts[start]),h:bottom-top};
   const asset={...clone(a),id,name:a.name+' · compact1819 '+chunks,visual:[],collision:[],anchor:{x:0,y:0},sockets:[],bounds,reference:{...clone(a.reference||{}),bounds:clone(bounds),foot:{x:0,y:0},heightM:bounds.h/60,scaleRange:[1,1],backgroundRange:[1,1]},params:{...clone(a.params||{}),compact1819Revision:1,compactSourceAssetId:a.id,compactSourceInstance:e.id,compactWarp:{xKnots:clone(STAGE1819_X_KNOTS),yOffset:STAGE1819_Y_OFFSET}},vector:{version:1,viewBox:[bounds.x,bounds.y,bounds.w,bounds.h],root:{tag:'g',children},clips,symbols,...(a.vector.gradients?{gradients:clone(a.vector.gradients)}:{})}};
   delete asset.params.surfaceCoverage;delete asset.params.surfaceJunction;assets.push(asset);elements.push({...clone(e),id:id.replace(':','-'),assetId:id,x:0,y:0,scale:1,rotation:0});
  }
  replaced.add(e.id);stats.push({source:a.id,chunks,sourceNodes:size.nodes,sourceCompoundChars:size.chars,strips:cuts.length-1});
 }
 if(replaced.size!==7)throw Error('Expected three native cavern assemblies and four traced shared bell planes');
 return{assets,elements,replaced,stats};
}
function createCompact(project,chapter){
 const source=project.stages.find(s=>s.metadata?.stageId===chapter);
 if(!source||source.width!==13600||source.height!==9600||source.initialState?.honroReviewedSceneRevision!==500+chapter)throw Error('Reviewed original Stage'+chapter+' source required');
 if(source.design?.compact1819)throw Error('Shared bell-place compact prototype cannot be applied twice');
 const stage=spatial(clone(source)),body=art(project,source,chapter);
 stage.width=8200;stage.height=7000;stage.playBounds={left:0,top:0,right:8200,bottom:7000};stage.terrainBounds=spatial(source.terrainBounds);stage.environment=environment(source.environment);
 stage.terrains=source.terrains.map(terrain);stage.elements=stage.elements.filter(e=>!body.replaced.has(e.id)).concat(body.elements);
 for(const t of stage.terrains)if(t.playProjection?.bounds)t.playProjection.bounds={left:0,top:0,right:8200,bottom:7240};
 const pairs=(points,closed=false)=>{const result=[];for(let i=0;i<points.length-(closed?0:1);i++){const a=points[i],b=points[(i+1)%points.length],cuts=[0,...STAGE1819_X_KNOTS.map(k=>(k[0]-a[0])/(b[0]-a[0])).filter(f=>f>1e-8&&f<1-1e-8)].sort((a,b)=>a-b);for(const f of cuts)result.push([stage1819CompactX(a[0]+(b[0]-a[0])*f),mapY(a[1]+(b[1]-a[1])*f)]);}if(!closed&&points.length)result.push([stage1819CompactX(points.at(-1)[0]),mapY(points.at(-1)[1])]);return result;};
 stage.materials=source.materials.map(material=>{const m=spatial(material);for(const key of ['surface','bottom','points'])if(Array.isArray(material[key]))m[key]=key==='surface'?material[key].map(([x,y])=>[stage1819CompactX(x),mapY(y)]):pairs(material[key],key==='points');return m;});
 for(const plane of stage.design.space?.terrainPlanes||[]){const old=source.design.space.terrainPlanes.find(p=>p.id===plane.id);if(old?.points)plane.points=pairs(old.points,true);}
 for(const surface of stage.design.space?.surfaces||[]){const t=stage.terrains.find(t=>t.id===surface.terrainId);if(t?.properties?.honroWalkEdges)surface.edgeIndices=clone(t.properties.honroWalkEdges);}
 // Keep the existing three-body rescue response atomic. The left approach is
 // shorter, but a minecart's clearance and the authored local member spacing
 // must not shrink with it. The bat is seated96px lower and60px to the
 // respective open flank, preserving its real66px body plus18px clearance
 // below the middle rock. Both three-body choices are checked by the existing
 // atomic spawnMembers fixture. Only fresh source positions change here.
 const topAt=(id,x)=>{const t=stage.terrains.find(t=>t.id===id),ys=[];for(const i of t?.properties?.honroWalkEdges||[]){const a=t.points[i],b=t.points[(i+1)%t.points.length];if(a.x!==b.x&&x>=Math.min(a.x,b.x)-1e-6&&x<=Math.max(a.x,b.x)+1e-6)ys.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));}if(!ys.length)throw Error('Missing compact bell response support');return Math.min(...ys);};
 for(let i=0;i<stage.events.length;i++){const ev=stage.events[i],old=source.events[i];if(ev.honroDensityResponse!==1)continue;const reshape=(rows,originalRows,flightDx)=>{const oldBase=originalRows[0].x,base=stage1819CompactX(oldBase);return rows.map((row,j)=>{const original=originalRows[j],x=row.air?stage1819CompactX(original.x)+flightDx:base+original.x-oldBase;return{...row,x,y:row.air?mapY(original.y)+96:topAt(row.support||row.surfaceId,x)};});};ev.action.actions=reshape(ev.action.actions,old.action.actions,-60);if(ev.entry)ev.entry={...ev.entry,x:ev.action.actions[0].x,y:ev.action.actions[0].y};if(ev.honroDensityAlternatives)ev.honroDensityAlternatives=ev.honroDensityAlternatives.map((rows,j)=>reshape(rows,old.honroDensityAlternatives[j],60));}
 const init=stage.initialState;init.honroAct2CompactRevision=1;
 init.honroAct2CompactVisuals={revision:1,bellOrigin:{x:stage1819CompactX(7200),y:mapY(6610)},ropeOrigin:{x:stage1819CompactX(7200),y:mapY(5940)},supportViews:[{x:stage1819CompactX(5700),y:mapY(6530),w:450,h:220},{x:stage1819CompactX(8340),y:mapY(6530),w:440,h:220}],gapOrigin:{x:stage1819CompactX(6980),y:mapY(6675)},gapXs:[6980,7180,7380].map(stage1819CompactX)};
 // Legacy bell focus/guidance already reads these optional display anchors.
 // Populate them on fresh compact maps instead of changing its old-save
 // fallbacks or any descent/lift/rest offset used by the physical integrator.
 init.honroBellDescent.resting={...init.honroBellDescent.resting,x:stage1819CompactX(7200),y:mapY(7000)};
 const bellBefore=source.elements.find(e=>e.id==='sb-bell-body'),bellAfter=stage.elements.find(e=>e.id==='sb-bell-body');
 if(!bellBefore||!bellAfter||bellBefore.assetId!==bellAfter.assetId||bellBefore.scale!==bellAfter.scale||bellAfter.x!==bellBefore.x-2800||bellAfter.y!==bellBefore.y-1000)throw Error('Compact bell must remain native size and translate only');
 if(chapter===18&&init.honroV4Stage18.restOffsetX!==32)throw Error('Bell lateral shift contract changed');
 if(chapter===19&&(stage.units.some(u=>u.team==='enemy')||JSON.stringify(init.honroV4Steps.map(s=>s.id))!==JSON.stringify(source.initialState.honroV4Steps.map(s=>s.id))))throw Error('Farewell noncombat/free-order contract changed');
 stage.design.compact1819={revision:1,chapter,status:'prototype-needs-focused-bell-or-farewell-save-and-browser-review',sharedPlace:'mukjong-hall',sourceBounds:[13600,9600],bounds:[8200,7000],xKnots:clone(STAGE1819_X_KNOTS),yOffset:STAGE1819_Y_OFFSET,bellCore:{oldX:[5600,9600],newX:[2800,6800],localXDistancesPreserved:true,yDistancesPreserved:true,wholeBellScale:1},roster:{initial:source.units.filter(u=>u.team==='enemy').length},art:'three existing native cavern assemblies and four traced shared-place planes recomposed; bell/actors/props native size; separate per-chapter asset namespace',physicalThresholds:{bellHorizontalShift:32,descentOffsetsPreserved:true,supportsPreserved:true,familyRestorationPreserved:chapter===19}};
 if(stage.design.space)stage.design.space.topologyId=chapter===18?'compact-mukjong-rescue-lift-and-two-locks':'compact-same-mukjong-place-family-farewell';stage.metadata.compactStatus='spatial-layout-prototype';
 return{source:clone(source),stage,assets:body.assets,artStats:{assets:body.assets.length,serializedBytes:body.assets.reduce((n,a)=>n+JSON.stringify(a).length,0),details:body.stats},preserved:{dialogueRows:true,stepIds:true,winConditions:true,initialRoster:true,finiteEvents:true,physicalThresholds:true,bellNativeSize:true,familyRestoration:chapter===19},integrationNotes:['Install after reviewed'+chapter+' author, new entries only.','Do not rerun original author coordinates after package override.','Existing live snapshots must not be moved or reauthored.','Runtime hardcoded visual points must read honroAct2CompactVisuals with original-coordinate fallback.','Use bellOrigin for arrows and remaining-knock origin, ropeOrigin for camera/rope, supportViews and gapOrigin/gapXs for final camera/soul silhouettes.','Stage19 keeps original35 family restoration rows, free-order3 encounters, actual spirit departure and visitor return; no new dialogue gate or auto-skip.','Run targeted '+(chapter===18?'descent/brake, nonlethal rescue/safe walk, keeper/hoist lift,32px lateral shift/reseat/two locks':'family dialogue cursors/free order/actual departures/three marks/visitor walking')+', old/current Continue and native/browser composition review before adoption.']};
}
export const createStage18Compact=project=>createCompact(project,18);
export const createStage19Compact=project=>createCompact(project,19);
