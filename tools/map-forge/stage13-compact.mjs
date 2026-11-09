/** Stage13 compact prototype. The rescue/escort/inside-bolt enclave is translated
 * intact; unequal outer approaches are cut down around it. This is not a
 * homothetic map/actor/physics scale and does not install itself in campaign. */
const clone=x=>JSON.parse(JSON.stringify(x));
export const STAGE13_X_KNOTS=[[-6000,-5000],[0,0],[1800,900],[2445,1545],[2750,1850],[4495,3595],[4830,3930],[5480,4400],[6200,4750],[8200,5200],[14200,10200]];
export const STAGE13_Y_OFFSET=-1900;
export function stage13CompactX(x){
 let i=1;while(i<STAGE13_X_KNOTS.length-1&&x>STAGE13_X_KNOTS[i][0])i++;
 const[a,b]=STAGE13_X_KNOTS[i-1],[c,d]=STAGE13_X_KNOTS[i];return b+(x-a)*(d-b)/(c-a);
}
const mapY=y=>y+STAGE13_Y_OFFSET;
function spatial(value){
 if(Array.isArray(value))return value.map(spatial);if(!value||typeof value!=='object')return value;
 const out=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,spatial(v)]));
 if(Number.isFinite(value.x)){out.x=stage13CompactX(value.x);if(Number.isFinite(value.w))out.w=stage13CompactX(value.x+value.w)-out.x;}
 if(Number.isFinite(value.y))out.y=mapY(value.y);
 for(const key of ['left','right','minX','maxX','boundaryX','warningX','stepOffX'])if(Number.isFinite(value[key]))out[key]=stage13CompactX(value[key]);
 for(const key of ['top','bottom','warningY'])if(Number.isFinite(value[key]))out[key]=mapY(value[key]);
 return out;
}
function terrain(t){
 const points=[],walk=[];
 for(let i=0;i<t.points.length;i++){
  const a=t.points[i],b=t.points[(i+1)%t.points.length],cuts=[0,...STAGE13_X_KNOTS.map(k=>(k[0]-a.x)/(b.x-a.x)).filter(f=>f>1e-8&&f<1-1e-8)].sort((a,b)=>a-b);
  for(const f of cuts){if(t.properties?.honroWalkEdges?.includes(i))walk.push(points.length);points.push({x:stage13CompactX(a.x+(b.x-a.x)*f),y:mapY(a.y+(b.y-a.y)*f)});}
 }
 const out={...spatial(t),points,properties:{...spatial(t.properties||{}),honroWalkEdges:walk}};
 for(const key of ['top','bottom'])if(Array.isArray(t.properties?.[key]))out.properties[key]=t.properties[key].map(([x,y])=>[stage13CompactX(x),mapY(y)]);
 return out;
}
function environment(original){
 const out=clone(original);if(!out)return out;
 for(const z of out.zones||[]){if(Number.isFinite(z.from))z.from=Math.max(0,mapY(z.from));if(Number.isFinite(z.to))z.to=Math.min(4600,mapY(z.to));z.blend=Math.min(z.blend,(z.to-z.from)*.45);}
 if(out.zones?.length)out.zones.at(-1).to=4600;
 for(const group of out.groups||[]){const old=original.groups.find(g=>g.id===group.id);group.x=stage13CompactX(old.x||0);group.y=mapY(old.y||0);}
 // Environment support points are local to their group; only group Y moves.
 for(const s of out.surfaces||[]){const group=original.groups?.find(g=>g.id===s.groupId),gx=group?.x||0,tx=stage13CompactX(gx),old=original.surfaces.find(v=>v.id===s.id);s.points=s.points?.map(p=>({...p,x:stage13CompactX(p.x+gx)-tx}));if(Number.isFinite(s.compositionWidth))s.compositionWidth=5200;
  // Background coverage is determined by camera/depth, not map-width ratio.
  // Retain the original distant endpoint margin instead of compressing it.
  if(s.points?.length){s.points[0].x=Math.min(s.points[0].x,old.points[0].x+gx-tx);s.points.at(-1).x=Math.max(s.points.at(-1).x,old.points.at(-1).x+gx-tx);}}
 return out;
}
function art(project,source){
 const lib=new Map(project.library.map(a=>[a.id,a])),assets=[],elements=[],replaced=new Set(),stats=[];
 const isBody=e=>e.assetId.startsWith('act2-traced:stage13-')||e.assetId==='stage13:tactical-recessed-support';
 const count=(v,symbols,stack=new Set())=>{
  let nodes=1,chars=v.d?.length||v.dParts?.reduce((n,p)=>n+p.length,0)||0;
  if(v.tag==='use'){if(stack.has(v.symbol))throw Error('Stage13 cyclic native symbol');const n=new Set(stack);n.add(v.symbol);const z=count(symbols[v.symbol],symbols,n);nodes+=z.nodes;chars+=z.chars;}
  for(const c of v.children||[]){const z=count(c,symbols,stack);nodes+=z.nodes;chars+=z.chars;}return{nodes,chars};
 };
 for(const e of source.elements.filter(isBody)){
  const a=lib.get(e.assetId);if(!a?.vector||a.collision?.length||e.rotation)throw Error('Stage13 BODY must be unrotated collision-free native vector: '+e.assetId);
  const scale=e.scale??1,matrix=[scale,0,0,scale,(e.x||0)-scale*(a.anchor?.x||0),(e.y||0)-scale*(a.anchor?.y||0)],b=a.bounds;
  const left=matrix[0]*b.x+matrix[4],right=left+scale*b.w,top=matrix[3]*b.y+matrix[5],bottom=top+scale*b.h;
  const cuts=[left,...STAGE13_X_KNOTS.map(k=>k[0]).filter(x=>x>left&&x<right),right],size=count(a.vector.root,a.vector.symbols||{});
  if(size.nodes>470||size.chars>3700000)throw Error('Stage13 native BODY exceeds safe composition budget: '+a.id);
  const chunk=Math.max(1,Math.min(16,Math.floor(475/(size.nodes+3)),size.chars?Math.floor(3700000/size.chars):16));let chunks=0;
  for(let start=0;start<cuts.length-1;start+=chunk){
   const end=Math.min(cuts.length-1,start+chunk),id='act2-compact:stage13-'+e.id.replace(/[^\w-]/g,'-')+'-'+(++chunks),clips=clone(a.vector.clips||{}),symbols=clone(a.vector.symbols||{}),symbol='compact13-source-world',children=[];
   if(symbols[symbol])throw Error('Stage13 compact native symbol collision');symbols[symbol]={tag:'g',transform:matrix,children:[clone(a.vector.root)]};
   for(let i=start;i<end;i++){
    const x=cuts[i],z=cuts[i+1],sx=(stage13CompactX(z)-stage13CompactX(x))/(z-x),dx=stage13CompactX(x)-sx*x,key='compact13-strip-'+i;
    if(clips[key])throw Error('Stage13 compact clip collision');clips[key]=[`M${x} ${top-2}H${z}V${bottom+2}H${x}Z`];
    children.push({tag:'g',transform:[sx,0,0,1,dx,STAGE13_Y_OFFSET],clipPath:key,pixelSnapClip:true,children:[{tag:'use',symbol}]});
   }
   const bounds={x:stage13CompactX(cuts[start]),y:mapY(top),w:stage13CompactX(cuts[end])-stage13CompactX(cuts[start]),h:bottom-top};
   const asset={...clone(a),id,name:a.name+' · compact13 '+chunks,visual:[],collision:[],anchor:{x:0,y:0},sockets:[],bounds,reference:{...clone(a.reference||{}),bounds:clone(bounds),foot:{x:0,y:0},heightM:bounds.h/60,scaleRange:[1,1],backgroundRange:[1,1]},params:{...clone(a.params||{}),compact13Revision:1,compactSourceAssetId:a.id,compactSourceInstance:e.id,compactWarp:{xKnots:clone(STAGE13_X_KNOTS),yOffset:STAGE13_Y_OFFSET}},vector:{version:1,viewBox:[bounds.x,bounds.y,bounds.w,bounds.h],root:{tag:'g',children},clips,symbols,...(a.vector.gradients?{gradients:clone(a.vector.gradients)}:{})}};
   delete asset.params.surfaceCoverage;delete asset.params.surfaceJunction;assets.push(asset);elements.push({...clone(e),id:id.replace(':','-'),assetId:id,x:0,y:0,scale:1,rotation:0});
  }
  replaced.add(e.id);stats.push({source:a.id,chunks,sourceNodes:size.nodes,sourceCompoundChars:size.chars,strips:cuts.length-1});
 }
 if(replaced.size!==8)throw Error('Expected seven traced Stage13 planes and recessed native support');
 return{assets,elements,replaced,stats};
}
export function createStage13Compact(project){
 const source=project.stages.find(s=>s.metadata?.stageId===13);
 if(!source||source.width!==8200||source.height!==6600||source.initialState?.honroReviewedSceneRevision!==513)throw Error('Reviewed original Stage13 source required');
 if(source.design?.compact13)throw Error('Stage13 compact prototype cannot be applied twice');
 const stage=spatial(clone(source)),body=art(project,source);
 stage.width=5200;stage.height=4600;stage.playBounds={left:0,top:0,right:5200,bottom:4600};stage.terrainBounds=spatial(source.terrainBounds);stage.environment=environment(source.environment);
 stage.terrains=source.terrains.map(terrain);stage.elements=stage.elements.filter(e=>!body.replaced.has(e.id)).concat(body.elements);
 for(const t of stage.terrains)if(t.playProjection?.bounds)t.playProjection.bounds={left:0,top:0,right:5200,bottom:4840};
 // World-art planes store numeric coordinate pairs rather than point objects.
 for(const plane of stage.design.space.terrainPlanes||[]){const old=source.design.space.terrainPlanes.find(p=>p.id===plane.id);if(old?.points)plane.points=old.points.map(([x,y])=>[stage13CompactX(x),mapY(y)]);}
 stage.initialState.honroAct2CompactRevision=1;
 stage.design.compact13={revision:1,status:'selected-layout',sourceBounds:[8200,6600],bounds:[5200,4600],xKnots:clone(STAGE13_X_KNOTS),yOffset:STAGE13_Y_OFFSET,core:{oldX:[2445,4830],newX:[1545,3930],localXDistancesPreserved:true,yDistancesPreserved:true},roster:{initial:source.units.filter(u=>u.team==='enemy').length,finite:2},art:'seven existing traced native planes and recessed support recomposed; actor/prop size unchanged'};
 delete stage.design.targetRounds;delete stage.design.expectedMinutes;
 stage.design.space.topologyId='compact-stone-gate-rescue-to-inside-bolt';stage.metadata.compactStatus='selected-layout';
 return{source:clone(source),stage,assets:body.assets,artStats:{assets:body.assets.length,serializedBytes:body.assets.reduce((n,a)=>n+JSON.stringify(a).length,0),details:body.stats},preserved:{dialogueRows:true,stepIds:true,winConditions:true,initialRoster:true,physicalThresholds:true},integrationNotes:['Install after reviewed13 author, new entries only.','Do not rerun old author coordinates after this package override.','Existing live snapshots must not be moved or reauthored.','Run targeted rescue/escort/upper-bolt/lower-pair/party-pass and native/browser composition review before adoption.']};
}
