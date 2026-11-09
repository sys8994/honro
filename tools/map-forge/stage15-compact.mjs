/** Stage15 compact prototype. Sluice/pulley and carved-basin enclaves retain
 * local distances; unequal outer approaches and arch spans are shortened. This is not a
 * homothetic map/actor/physics scale and does not install itself in campaign. */
const clone=x=>JSON.parse(JSON.stringify(x));
export const STAGE15_X_KNOTS=[[-6000,-5000],[0,0],[1000,700],[2000,1000],[2630,1630],[3000,1900],[4300,2940],[5330,3700],[6300,4670],[7560,5600],[8000,5800],[14000,10800]];
export const STAGE15_Y_OFFSET=-1600;
export function stage15CompactX(x){
 let i=1;while(i<STAGE15_X_KNOTS.length-1&&x>STAGE15_X_KNOTS[i][0])i++;
 const[a,b]=STAGE15_X_KNOTS[i-1],[c,d]=STAGE15_X_KNOTS[i];return b+(x-a)*(d-b)/(c-a);
}
const mapY=y=>y+STAGE15_Y_OFFSET;
function spatial(value){
 if(Array.isArray(value))return value.map(spatial);if(!value||typeof value!=='object')return value;
 const out=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,spatial(v)]));
 if(Number.isFinite(value.x)){out.x=stage15CompactX(value.x);if(Number.isFinite(value.w))out.w=stage15CompactX(value.x+value.w)-out.x;}
 if(Number.isFinite(value.y))out.y=mapY(value.y);
 for(const key of ['left','right','minX','maxX','boundaryX','warningX','stepOffX'])if(Number.isFinite(value[key]))out[key]=stage15CompactX(value[key]);
 for(const key of ['top','bottom','warningY','roofY','targetY','surfaceY'])if(Number.isFinite(value[key]))out[key]=mapY(value[key]);
 return out;
}
function terrain(t){
 const points=[],walk=[];
 for(let i=0;i<t.points.length;i++){
  const a=t.points[i],b=t.points[(i+1)%t.points.length],cuts=[0,...STAGE15_X_KNOTS.map(k=>(k[0]-a.x)/(b.x-a.x)).filter(f=>f>1e-8&&f<1-1e-8)].sort((a,b)=>a-b);
  for(const f of cuts){if(t.properties?.honroWalkEdges?.includes(i))walk.push(points.length);points.push({x:stage15CompactX(a.x+(b.x-a.x)*f),y:mapY(a.y+(b.y-a.y)*f)});}
 }
 const out={...spatial(t),points,properties:{...spatial(t.properties||{}),honroWalkEdges:walk}};
 for(const key of ['top','bottom'])if(Array.isArray(t.properties?.[key]))out.properties[key]=t.properties[key].map(([x,y])=>[stage15CompactX(x),mapY(y)]);
 return out;
}
function environment(original){
 const out=clone(original);if(!out)return out;
 for(const z of out.zones||[]){if(Number.isFinite(z.from))z.from=Math.max(0,mapY(z.from));if(Number.isFinite(z.to))z.to=Math.min(4200,mapY(z.to));z.blend=Math.min(z.blend,(z.to-z.from)*.45);}
 if(out.zones?.length)out.zones.at(-1).to=4200;
 for(const group of out.groups||[]){const old=original.groups.find(g=>g.id===group.id);group.x=stage15CompactX(old.x||0);group.y=mapY(old.y||0);}
 // Environment support points are local to their group; only group Y moves.
 for(const s of out.surfaces||[]){const group=original.groups?.find(g=>g.id===s.groupId),gx=group?.x||0,tx=stage15CompactX(gx),old=original.surfaces.find(v=>v.id===s.id);s.points=s.points?.map(p=>({...p,x:stage15CompactX(p.x+gx)-tx}));if(Number.isFinite(s.compositionWidth))s.compositionWidth=5800;
  // Background coverage is determined by camera/depth, not map-width ratio.
  // Retain the original distant endpoint margin instead of compressing it.
  if(s.points?.length){s.points[0].x=Math.min(s.points[0].x,old.points[0].x+gx-tx);s.points.at(-1).x=Math.max(s.points.at(-1).x,old.points.at(-1).x+gx-tx);}}
 return out;
}
function art(project,source){
 const lib=new Map(project.library.map(a=>[a.id,a])),assets=[],elements=[],replaced=new Set(),stats=[];
 const isBody=e=>e.assetId.startsWith('act2-traced:stage15-');
 const count=(v,symbols,stack=new Set())=>{
  let nodes=1,chars=v.d?.length||v.dParts?.reduce((n,p)=>n+p.length,0)||0;
  if(v.tag==='use'){if(stack.has(v.symbol))throw Error('Stage15 cyclic native symbol');const n=new Set(stack);n.add(v.symbol);const z=count(symbols[v.symbol],symbols,n);nodes+=z.nodes;chars+=z.chars;}
  for(const c of v.children||[]){const z=count(c,symbols,stack);nodes+=z.nodes;chars+=z.chars;}return{nodes,chars};
 };
 for(const e of source.elements.filter(isBody)){
  const a=lib.get(e.assetId);if(!a?.vector||a.collision?.length||e.rotation)throw Error('Stage15 BODY must be unrotated collision-free native vector: '+e.assetId);
  const scale=e.scale??1,matrix=[scale,0,0,scale,(e.x||0)-scale*(a.anchor?.x||0),(e.y||0)-scale*(a.anchor?.y||0)],b=a.bounds;
  const left=matrix[0]*b.x+matrix[4],right=left+scale*b.w,top=matrix[3]*b.y+matrix[5],bottom=top+scale*b.h;
  const cuts=[left,...STAGE15_X_KNOTS.map(k=>k[0]).filter(x=>x>left&&x<right),right],size=count(a.vector.root,a.vector.symbols||{});
  if(size.nodes>470||size.chars>3700000)throw Error('Stage15 native BODY exceeds safe composition budget: '+a.id);
  const chunk=Math.max(1,Math.min(16,Math.floor(475/(size.nodes+3)),size.chars?Math.floor(3700000/size.chars):16));let chunks=0;
  for(let start=0;start<cuts.length-1;start+=chunk){
   const end=Math.min(cuts.length-1,start+chunk),id='act2-compact:stage15-'+e.id.replace(/[^\w-]/g,'-')+'-'+(++chunks),clips=clone(a.vector.clips||{}),symbols=clone(a.vector.symbols||{}),symbol='compact15-source-world',children=[];
   if(symbols[symbol])throw Error('Stage15 compact native symbol collision');symbols[symbol]={tag:'g',transform:matrix,children:[clone(a.vector.root)]};
   for(let i=start;i<end;i++){
    const x=cuts[i],z=cuts[i+1],sx=(stage15CompactX(z)-stage15CompactX(x))/(z-x),dx=stage15CompactX(x)-sx*x,key='compact15-strip-'+i;
    if(clips[key])throw Error('Stage15 compact clip collision');clips[key]=[`M${x} ${top-2}H${z}V${bottom+2}H${x}Z`];
    children.push({tag:'g',transform:[sx,0,0,1,dx,STAGE15_Y_OFFSET],clipPath:key,pixelSnapClip:true,children:[{tag:'use',symbol}]});
   }
   const bounds={x:stage15CompactX(cuts[start]),y:mapY(top),w:stage15CompactX(cuts[end])-stage15CompactX(cuts[start]),h:bottom-top};
   const asset={...clone(a),id,name:a.name+' · compact15 '+chunks,visual:[],collision:[],anchor:{x:0,y:0},sockets:[],bounds,reference:{...clone(a.reference||{}),bounds:clone(bounds),foot:{x:0,y:0},heightM:bounds.h/60,scaleRange:[1,1],backgroundRange:[1,1]},params:{...clone(a.params||{}),compact15Revision:1,compactSourceAssetId:a.id,compactSourceInstance:e.id,compactWarp:{xKnots:clone(STAGE15_X_KNOTS),yOffset:STAGE15_Y_OFFSET}},vector:{version:1,viewBox:[bounds.x,bounds.y,bounds.w,bounds.h],root:{tag:'g',children},clips,symbols,...(a.vector.gradients?{gradients:clone(a.vector.gradients)}:{})}};
   delete asset.params.surfaceCoverage;delete asset.params.surfaceJunction;assets.push(asset);elements.push({...clone(e),id:id.replace(':','-'),assetId:id,x:0,y:0,scale:1,rotation:0});
  }
  replaced.add(e.id);stats.push({source:a.id,chunks,sourceNodes:size.nodes,sourceCompoundChars:size.chars,strips:cuts.length-1});
 }
 if(replaced.size!==4)throw Error('Expected four existing traced Stage15 BODY planes');
 return{assets,elements,replaced,stats};
}
export function createStage15Compact(project){
 const source=project.stages.find(s=>s.metadata?.stageId===15);
 if(!source||source.width!==8000||source.height!==6000||source.initialState?.honroReviewedSceneRevision!==515)throw Error('Reviewed original Stage15 source required');
 if(source.design?.compact15)throw Error('Stage15 compact prototype cannot be applied twice');
 const stage=spatial(clone(source)),body=art(project,source);
 stage.width=5800;stage.height=4200;stage.playBounds={left:0,top:0,right:5800,bottom:4200};stage.terrainBounds=spatial(source.terrainBounds);stage.environment=environment(source.environment);
 stage.terrains=source.terrains.map(terrain);stage.elements=stage.elements.filter(e=>!body.replaced.has(e.id)).concat(body.elements);
 for(const t of stage.terrains)if(t.playProjection?.bounds)t.playProjection.bounds={left:0,top:0,right:5800,bottom:4440};
 // Coordinate pairs in water/painted planes are geometry, not scalar ranges.
 // Cut their segments at X-map knots before translating: a simple endpoint
 // mapping would leave a different basin edge from the collision/native art.
 const pairs=(points,closed=false)=>{const result=[];for(let i=0;i<points.length-(closed?0:1);i++){const a=points[i],b=points[(i+1)%points.length],cuts=[0,...STAGE15_X_KNOTS.map(k=>(k[0]-a[0])/(b[0]-a[0])).filter(f=>f>1e-8&&f<1-1e-8)].sort((a,b)=>a-b);for(const f of cuts)result.push([stage15CompactX(a[0]+(b[0]-a[0])*f),mapY(a[1]+(b[1]-a[1])*f)]);}if(!closed&&points.length)result.push([stage15CompactX(points.at(-1)[0]),mapY(points.at(-1)[1])]);return result;};
 stage.materials=source.materials.map(material=>{const m=spatial(material);for(const key of ['surface','bottom','points'])if(Array.isArray(material[key]))m[key]=key==='surface'?material[key].map(([x,y])=>[stage15CompactX(x),mapY(y)]):pairs(material[key],key==='points');return m;});
 for(const plane of stage.design.space.terrainPlanes||[]){const old=source.design.space.terrainPlanes.find(p=>p.id===plane.id);if(old?.points)plane.points=pairs(old.points,true);}
 for(const surface of stage.design.space.surfaces||[]){const t=stage.terrains.find(t=>t.id===surface.terrainId);if(t?.properties?.honroWalkEdges?.length)surface.edgeIndices=clone(t.properties.honroWalkEdges);}
 // Preserve native prop/actor sizes. Their contact remains the original
 // terrain transformed through the same piecewise map, never a global scale.
 const init=stage.initialState;init.honroAct2CompactRevision=1;
 // Author the real supported formation explicitly instead of letting the
 // spawn sanitizer displace compressed wheels/bats to unrelated old homes.
 for(const [id,x,y]of [['a2-enemy-0',684.5,2100.075630252101],['a2-enemy-1',1123.6,2200],['a2-enemy-2',543.2,2078.9777777777776],['a2-enemy-3',1276,2200],['a2-enemy-11',3604.0776699029125,2236],['a2-enemy-18',4784.173739595682,2444.3972589435634],['a2-enemy-20',4918.476190476191,2795.425625842204],['a2-enemy-21',4750.590981925516,2863.387743883317]])Object.assign(stage.units.find(u=>u.id===id),{x,y});
 init.honroV4Reviewed15.pathsCamera={x:stage15CompactX(2820),y:mapY(3748)};
 stage.design.compact15={revision:1,status:'selected-layout',sourceBounds:[8000,6000],bounds:[5800,4200],xKnots:clone(STAGE15_X_KNOTS),yOffset:STAGE15_Y_OFFSET,localEnclaves:[{oldX:[2000,2630],purpose:'sluice and first pulley',xDistancesPreserved:true},{oldX:[5330,6300],purpose:'carved basin, submerged pulley, merge ghosts',xDistancesPreserved:true}],yDistancesPreserved:true,roster:{initial:source.units.filter(u=>u.team==='enemy').length,finite:2},art:'four existing traced native BODY planes recomposed; actors and props keep native size',physicalThresholds:{drainLevelChange:120,trajectoryAx:36,deepKnockBelowMerge:300}};
 delete stage.design.targetRounds;delete stage.design.expectedMinutes;
 stage.design.space.topologyId='compact-drainable-basin-and-dry-arch-return';stage.metadata.compactStatus='selected-layout';
 if(init.honroAct23V4TrajectoryForce.ax!==36||init.honroV4KnockSource.y<=init.honroV4Reviewed15.merge.y+300)throw Error('Stage15 compact physical threshold mismatch');
 return{source:clone(source),stage,assets:body.assets,artStats:{assets:body.assets.length,serializedBytes:body.assets.reduce((n,a)=>n+JSON.stringify(a).length,0),details:body.stats},preserved:{dialogueRows:true,stepIds:true,winConditions:true,initialRoster:true,physicalThresholds:true},integrationNotes:['Install after reviewed15 author, new entries only.','Do not rerun old author coordinates after this package override.','Use honroV4Reviewed15.pathsCamera in the paths scene instead of hardcoded2820/3748.','Existing live snapshots must not be moved or reauthored.','Run targeted sluice/drain120/contact, high-route blockage, two drops/ax36 prediction, two merge spirits/deep-knocks/branch and native/browser review before adoption.']};
}
