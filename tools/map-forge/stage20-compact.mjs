/** Stage20 compact prototype. The convoy/rest and outside-seat enclaves are translated
 * intact; unequal approaches are cut down around them. This is not a
 * homothetic map/actor/physics scale and does not install itself in campaign. */
const clone=x=>JSON.parse(JSON.stringify(x));
export const STAGE20_X_KNOTS=[[-6000,-5000],[0,0],[2200,1500],[2800,1900],[3600,2700],[4900,3500],[5600,4200],[6900,5100],[7600,5800],[8000,6100],[8900,7000],[9000,7200],[15000,12200]];
export const STAGE20_Y_OFFSET=-2100;
export function stage20CompactX(x){
 let i=1;while(i<STAGE20_X_KNOTS.length-1&&x>STAGE20_X_KNOTS[i][0])i++;
 const[a,b]=STAGE20_X_KNOTS[i-1],[c,d]=STAGE20_X_KNOTS[i];return b+(x-a)*(d-b)/(c-a);
}
const mapY=y=>y+STAGE20_Y_OFFSET;
function spatial(value){
 if(Array.isArray(value))return value.map(spatial);if(!value||typeof value!=='object')return value;
 const out=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,spatial(v)]));
 if(Number.isFinite(value.x)){out.x=stage20CompactX(value.x);if(Number.isFinite(value.w))out.w=stage20CompactX(value.x+value.w)-out.x;}
 if(Number.isFinite(value.y))out.y=mapY(value.y);
 for(const key of ['left','right','minX','maxX','boundaryX','warningX','stepOffX'])if(Number.isFinite(value[key]))out[key]=stage20CompactX(value[key]);
 for(const key of ['top','bottom','warningY'])if(Number.isFinite(value[key]))out[key]=mapY(value[key]);
 return out;
}
function terrain(t){
 const points=[],walk=[];
 for(let i=0;i<t.points.length;i++){
  const a=t.points[i],b=t.points[(i+1)%t.points.length],cuts=[0,...STAGE20_X_KNOTS.map(k=>(k[0]-a.x)/(b.x-a.x)).filter(f=>f>1e-8&&f<1-1e-8)].sort((a,b)=>a-b);
  for(const f of cuts){if(t.properties?.honroWalkEdges?.includes(i))walk.push(points.length);points.push({x:stage20CompactX(a.x+(b.x-a.x)*f),y:mapY(a.y+(b.y-a.y)*f)});}
 }
 const out={...spatial(t),points,properties:{...spatial(t.properties||{}),honroWalkEdges:walk}};
 for(const key of ['top','bottom'])if(Array.isArray(t.properties?.[key]))out.properties[key]=t.properties[key].map(([x,y])=>[stage20CompactX(x),mapY(y)]);
 return out;
}
function environment(original){
 const out=clone(original);if(!out)return out;
 for(const z of out.zones||[]){if(Number.isFinite(z.from))z.from=Math.max(0,mapY(z.from));if(Number.isFinite(z.to))z.to=Math.min(3100,mapY(z.to));z.blend=Math.min(z.blend,(z.to-z.from)*.45);}
 if(out.zones?.length)out.zones.at(-1).to=3100;
 for(const group of out.groups||[]){const old=original.groups.find(g=>g.id===group.id);group.x=stage20CompactX(old.x||0);group.y=mapY(old.y||0);}
 // Environment support points are local to their group; only group Y moves.
 for(const s of out.surfaces||[]){const group=original.groups?.find(g=>g.id===s.groupId),gx=group?.x||0,tx=stage20CompactX(gx),old=original.surfaces.find(v=>v.id===s.id);s.points=s.points?.map(p=>({...p,x:stage20CompactX(p.x+gx)-tx}));if(Number.isFinite(s.compositionWidth))s.compositionWidth=7200;
  // Background coverage is determined by camera/depth, not map-width ratio.
  // Retain the original distant endpoint margin instead of compressing it.
  if(s.points?.length){s.points[0].x=Math.min(s.points[0].x,old.points[0].x+gx-tx);s.points.at(-1).x=Math.max(s.points.at(-1).x,old.points.at(-1).x+gx-tx);}}
 return out;
}
function art(project,source){
 const lib=new Map(project.library.map(a=>[a.id,a])),assets=[],elements=[],replaced=new Set(),stats=[];
 const isBody=e=>e.assetId.startsWith('act2-traced:stage20-');
 const count=(v,symbols,stack=new Set())=>{
  let nodes=1,chars=v.d?.length||v.dParts?.reduce((n,p)=>n+p.length,0)||0;
  if(v.tag==='use'){if(stack.has(v.symbol))throw Error('Stage20 cyclic native symbol');const n=new Set(stack);n.add(v.symbol);const z=count(symbols[v.symbol],symbols,n);nodes+=z.nodes;chars+=z.chars;}
  for(const c of v.children||[]){const z=count(c,symbols,stack);nodes+=z.nodes;chars+=z.chars;}return{nodes,chars};
 };
 for(const e of source.elements.filter(isBody)){
  const a=lib.get(e.assetId);if(!a?.vector||a.collision?.length||e.rotation)throw Error('Stage20 BODY must be unrotated collision-free native vector: '+e.assetId);
  const scale=e.scale??1,matrix=[scale,0,0,scale,(e.x||0)-scale*(a.anchor?.x||0),(e.y||0)-scale*(a.anchor?.y||0)],b=a.bounds;
  const left=matrix[0]*b.x+matrix[4],right=left+scale*b.w,top=matrix[3]*b.y+matrix[5],bottom=top+scale*b.h;
  const cuts=[left,...STAGE20_X_KNOTS.map(k=>k[0]).filter(x=>x>left&&x<right),right],size=count(a.vector.root,a.vector.symbols||{});
  if(size.nodes>470||size.chars>3700000)throw Error('Stage20 native BODY exceeds safe composition budget: '+a.id);
  const chunk=Math.max(1,Math.min(16,Math.floor(475/(size.nodes+3)),size.chars?Math.floor(3700000/size.chars):16));let chunks=0;
  for(let start=0;start<cuts.length-1;start+=chunk){
   const end=Math.min(cuts.length-1,start+chunk),id='act2-compact:stage20-'+e.id.replace(/[^\w-]/g,'-')+'-'+(++chunks),clips=clone(a.vector.clips||{}),symbols=clone(a.vector.symbols||{}),symbol='compact20-source-world',children=[];
   if(symbols[symbol])throw Error('Stage20 compact native symbol collision');symbols[symbol]={tag:'g',transform:matrix,children:[clone(a.vector.root)]};
   for(let i=start;i<end;i++){
    const x=cuts[i],z=cuts[i+1],sx=(stage20CompactX(z)-stage20CompactX(x))/(z-x),dx=stage20CompactX(x)-sx*x,key='compact20-strip-'+i;
    if(clips[key])throw Error('Stage20 compact clip collision');clips[key]=[`M${x} ${top-2}H${z}V${bottom+2}H${x}Z`];
    children.push({tag:'g',transform:[sx,0,0,1,dx,STAGE20_Y_OFFSET],clipPath:key,pixelSnapClip:true,children:[{tag:'use',symbol}]});
   }
   const bounds={x:stage20CompactX(cuts[start]),y:mapY(top),w:stage20CompactX(cuts[end])-stage20CompactX(cuts[start]),h:bottom-top};
   const asset={...clone(a),id,name:a.name+' · compact20 '+chunks,visual:[],collision:[],anchor:{x:0,y:0},sockets:[],bounds,reference:{...clone(a.reference||{}),bounds:clone(bounds),foot:{x:0,y:0},heightM:bounds.h/60,scaleRange:[1,1],backgroundRange:[1,1]},params:{...clone(a.params||{}),compact20Revision:1,compactSourceAssetId:a.id,compactSourceInstance:e.id,compactWarp:{xKnots:clone(STAGE20_X_KNOTS),yOffset:STAGE20_Y_OFFSET}},vector:{version:1,viewBox:[bounds.x,bounds.y,bounds.w,bounds.h],root:{tag:'g',children},clips,symbols,...(a.vector.gradients?{gradients:clone(a.vector.gradients)}:{})}};
   delete asset.params.surfaceCoverage;delete asset.params.surfaceJunction;assets.push(asset);elements.push({...clone(e),id:id.replace(':','-'),assetId:id,x:0,y:0,scale:1,rotation:0});
  }
  replaced.add(e.id);stats.push({source:a.id,chunks,sourceNodes:size.nodes,sourceCompoundChars:size.chars,strips:cuts.length-1});
 }
 if(replaced.size!==3)throw Error('Expected three existing traced Stage20 planes');
 return{assets,elements,replaced,stats};
}
export function createStage20Compact(project){
 const source=project.stages.find(s=>s.metadata?.stageId===20);
 if(!source||source.width!==9000||source.height!==5800||source.initialState?.honroReviewedSceneRevision!==520)throw Error('Reviewed original Stage20 source required');
 if(source.design?.compact20)throw Error('Stage20 compact cannot be applied twice');
 const stage=spatial(clone(source)),body=art(project,source);
 stage.width=7200;stage.height=3100;stage.playBounds={left:0,top:0,right:7200,bottom:3100};stage.terrainBounds=spatial(source.terrainBounds);stage.environment=environment(source.environment);
 stage.terrains=source.terrains.map(terrain);stage.elements=stage.elements.filter(e=>!body.replaced.has(e.id)).concat(body.elements);
 for(const t of stage.terrains)if(t.playProjection?.bounds)t.playProjection.bounds={left:0,top:0,right:7200,bottom:3340};
 for(const plane of stage.design.space.terrainPlanes||[]){const old=source.design.space.terrainPlanes.find(p=>p.id===plane.id);if(old?.points)plane.points=old.points.map(([x,y])=>[stage20CompactX(x),mapY(y)]);}
 // Re-space the initial western threat pockets away from the three civilian
 // bodies. The original map already relied on spawn recovery here; do not copy
 // that crowding into a smaller route. IDs, kinds and cohort gates are retained.
 const floor=x=>{const t=stage.terrains.find(t=>t.id==='act2-floor');for(const i of t.properties.honroWalkEdges||[]){const a=t.points[i],b=t.points[(i+1)%t.points.length];if(a.x!==b.x&&x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x))return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}throw Error('Compact20 missing continuous floor at '+x);};
 for(const [id,x]of [['a2-enemy-4',1540],['a2-enemy-5',1720],['a2-enemy-6',1900],['a2-enemy-16',6160],['a2-enemy-17',6350]]){const u=stage.units.find(u=>u.id===id);u.x=x;u.y=floor(x);}
 for(const [id,x,y]of [['a2-enemy-0',1005.6818181818181,2012.869565217391],['a2-enemy-1',1128,2188.2604084509],['a2-enemy-2',1224.574374157796,2078]])Object.assign(stage.units.find(u=>u.id===id),{x,y});
 stage.initialState.honroAct2CompactRevision=1;
 delete stage.design.targetRounds;delete stage.design.expectedMinutes;
 stage.design.compact20={revision:1,status:'prototype-needs-focused-escort-event-and-browser-review',sourceBounds:[9000,5800],bounds:[7200,3100],xKnots:clone(STAGE20_X_KNOTS),yOffset:STAGE20_Y_OFFSET,core:{convoyStartOldX:[2800,3600],restOldX:[4900,5600],highThreatOldX:[6900,7600],outsideOldX:[8000,8900],localXDistancesPreserved:true,yDistancesPreserved:true},roster:{initial:18,finite:4},art:'three existing traced native planes recomposed; actor/prop size unchanged'};
 stage.design.space.topologyId='compact-continuous-convoy-rest-ambush-and-outside-seat';stage.metadata.compactStatus='spatial-layout-prototype';
 return{source:clone(source),stage,assets:body.assets,artStats:{assets:body.assets.length,serializedBytes:body.assets.reduce((n,a)=>n+JSON.stringify(a).length,0),details:body.stats},preserved:{dialogueRows:true,stepIds:true,winConditions:true,initialRoster:true,physicalThresholds:true},integrationNotes:['Install after reviewed20 author, new entries only.','Do not rerun old author coordinates after this package override.','Existing live snapshots must not be moved or reauthored.','Verify ordinary NPC route, injured120/support80, baggage.65s, finite4, father seat walk12 and real UI before adoption.']};
}
