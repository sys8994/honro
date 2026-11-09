/** Recompose the shipped Stage12 native artwork through the compact layout's
 * piecewise X map. This preserves the original traced paths/paints and Y size;
 * it is not a new illustration or a collision author. Input stage is OLD stage.
 * Returned elements contain BODY replacements only. Remove replacedElementIds
 * before adding them; replace design.geologyComposition with the returned one.
 */
const clone=value=>JSON.parse(JSON.stringify(value));
const BODY_IDS=new Set(['act2-traced:stage12-ground','act2-traced:stage12-quarry']);
const PREFIX='act2-compact:stage12-';
const safe=value=>String(value).replace(/[^\w-]/g,'-');
const number=value=>Number(value.toFixed(9));

export function compactStage12Art(project,stage,{xKnots,yOffset=0}={}){
 if(stage?.metadata?.stageId!==12)throw Error('Stage12 compact art requires the original Stage12');
 if(!Array.isArray(xKnots)||xKnots.length<2||!Number.isFinite(yOffset))throw Error('Invalid compact art coordinate map');
 for(let i=0;i<xKnots.length;i++)if(!Array.isArray(xKnots[i])||xKnots[i].length!==2||xKnots[i].some(x=>!Number.isFinite(x))||i&&(xKnots[i][0]<=xKnots[i-1][0]||xKnots[i][1]<=xKnots[i-1][1]))throw Error('Compact art X knots must be strictly monotonic');
 const library=new Map(project.library.map(a=>[a.id,a])),assets=[],elements=[],replacedElementIds=[],assetMap={},details=[];
 const mapX=x=>{let i=0;while(i<xKnots.length-2&&x>xKnots[i+1][0])i++;const[a,b]=xKnots[i],[c,d]=xKnots[i+1];return b+(x-a)*(d-b)/(c-a);};
 const make=(source,matrix,id,kind)=>{
  if(!source?.vector||source.collision?.length)throw Error('Compact source must be native collision-free artwork: '+source?.id);
  if(matrix[1]||matrix[2])throw Error('Stage12 compact artwork does not accept rotated source instances');
  const original=source.bounds,corners=[original.x,original.x+original.w].flatMap(x=>[original.y,original.y+original.h].map(y=>({x:matrix[0]*x+matrix[4],y:matrix[3]*y+matrix[5]})));
  const left=Math.min(...corners.map(p=>p.x)),right=Math.max(...corners.map(p=>p.x)),top=Math.min(...corners.map(p=>p.y)),bottom=Math.max(...corners.map(p=>p.y));
  const cuts=[left,...xKnots.map(p=>p[0]).filter(x=>x>left&&x<right),right];
  const counts=(node,stack=new Set())=>{let nodes=1,chars=node.dParts?.reduce((n,p)=>n+p.length,0)||0;if(node.tag==='use'){if(stack.has(node.symbol))throw Error('Cyclic original compact art symbol');const next=new Set(stack);next.add(node.symbol);const c=counts(source.vector.symbols[node.symbol],next);nodes+=c.nodes;chars+=c.chars;}for(const child of node.children||[]){const c=counts(child,stack);nodes+=c.nodes;chars+=c.chars;}return{nodes,chars};};
  const size=counts(source.vector.root),chunkSize=Math.max(1,Math.min(16,Math.floor(475/(size.nodes+3)),size.chars?Math.floor(3700000/size.chars):16));
  if(size.nodes>470||size.chars>3700000)throw Error('Original artwork leaves no safe compact composition budget: '+source.id);
  const output=[];
  for(let start=0;start<cuts.length-1;start+=chunkSize){
   const end=Math.min(cuts.length-1,start+chunkSize),key=PREFIX+safe(id)+'-'+(output.length+1),clips=clone(source.vector.clips||{}),children=[];
   const symbol='compact12-original-world',symbols=clone(source.vector.symbols||{});
   if(symbols[symbol])throw Error('Compact art symbol collides with original definition');
   symbols[symbol]={tag:'g',transform:matrix,children:[clone(source.vector.root)]};
   for(let i=start;i<end;i++){
    const x=cuts[i],z=cuts[i+1],a=(mapX(z)-mapX(x))/(z-x),e=mapX(x)-a*x,clip='compact12-strip-'+i;
    if(clips[clip])throw Error('Compact art clip collides with original definition');
    // The source-space clip and corresponding transform share the same group.
    // Pixel-snapped adjacent clip edges avoid transparent AA hairlines without
    // widening the source strip or changing the terrain contact silhouette.
    clips[clip]=[`M${number(x)} ${number(top-2)}H${number(z)}V${number(bottom+2)}H${number(x)}Z`];
    children.push({tag:'g',transform:[a,0,0,1,e,yOffset],clipPath:clip,pixelSnapClip:true,children:[{tag:'use',symbol}]});
   }
   const bounds={x:mapX(cuts[start]),y:top+yOffset,w:mapX(cuts[end])-mapX(cuts[start]),h:bottom-top};
   const a={...clone(source),id:key,name:source.name+' · compact '+(output.length+1),visual:[],collision:[],sockets:[],anchor:{x:0,y:0},bounds,
    reference:{...clone(source.reference||{}),bounds:clone(bounds),foot:{x:0,y:0},heightM:bounds.h/60,scaleRange:[1,1],backgroundRange:[1,1]},
    params:{...clone(source.params||{}),compact12Revision:1,compactSourceAssetId:source.id,compactSourceInstance:id,compactStrips:end-start,compactWarp:{xKnots:clone(xKnots),yOffset},semanticLayer:kind,silhouetteUnderpaint:false},
    vector:{version:1,viewBox:[bounds.x,bounds.y,bounds.w,bounds.h],root:{tag:'g',children},clips,symbols,...(source.vector.gradients?{gradients:clone(source.vector.gradients)}:{})}};
   // Surface coverage rootPath belongs to the old tree, not this world-baked
   // wrapper. It must never cause a transformed USE to masquerade as a path.
   delete a.params.surfaceCoverage;delete a.params.surfaceJunction;
   assets.push(a);output.push(a);
  }
  details.push({source:source.id,instance:id,sourceNodes:size.nodes,sourceCompoundChars:size.chars,strips:cuts.length-1,chunks:output.length,bytes:output.reduce((n,a)=>n+JSON.stringify(a).length,0)});
  assetMap[id]=output.map(a=>a.id);return output;
 };
 const instanceMatrix=(asset,inst)=>{const s=inst.scale??1;if(inst.rotation)throw Error('Rotated BODY source not supported');return[s,0,0,s,(inst.x||0)-s*(asset.anchor?.x||0),(inst.y||0)-s*(asset.anchor?.y||0)];};
 for(const e of stage.elements||[])if(BODY_IDS.has(e.assetId)){
  const a=library.get(e.assetId);replacedElementIds.push(e.id);
  for(const item of make(a,instanceMatrix(a,e),e.id,'BODY'))elements.push({...clone(e),id:item.id.replace(':','-'),assetId:item.id,x:0,y:0,scale:1,rotation:0});
 }
 if(replacedElementIds.length!==2)throw Error('Expected exactly two shipped Stage12 BODY elements');
 const geologyComposition=clone(stage.design?.geologyComposition||{version:1,instances:[]}),oldInstances=geologyComposition.instances||[],newInstances=[];
 // Compile the original support contact analytically, matching GeologyArt's
 // projected collision bbox/topAt for these authored solid rock supports.
 const contact=support=>{
  const datum=geologyComposition.rearDatums?.find(d=>d.id===support.datumId);if(datum)return{x:datum.x,y:datum.y};
  const t=stage.terrains.find(t=>t.id===support.terrainId);if(!t||t.type!=='solid'||!Array.isArray(t.points))throw Error('Missing solid source geology support');
  const projection=t.playProjection?.bounds,lo=Math.max(projection?.left??-Infinity,Math.min(...t.points.map(p=>p.x))),hi=Math.min(projection?.right??Infinity,Math.max(...t.points.map(p=>p.x))),x=lo+(hi-lo)*support.at,ys=[];
  for(let i=0;i<t.points.length;i++){const a=t.points[i],z=t.points[(i+1)%t.points.length];if(a.x!==z.x&&x>=Math.min(a.x,z.x)-1e-6&&x<=Math.max(a.x,z.x)+1e-6)ys.push(a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x));}
  if(!ys.length)throw Error('No source geology contact at '+x);return{x,y:Math.min(...ys)};
 };
 for(const i of oldInstances){
  const a=library.get(i.assetId);if(!a?.id.startsWith('act2-traced:stage12-')){newInstances.push(clone(i));continue;}
  const point=contact(i.support),s=i.scale??1,sign=i.mirrorX?-1:1,socket=i.socket?a.sockets.find(s=>s.id===i.socket):a.reference.foot;if(!socket)throw Error('Missing source rear socket');
  const matrix=[sign*s,0,0,s,point.x-s*sign*(socket.x+(a.anchor?.x||0)),point.y+(i.support.offsetY||0)-s*(socket.y+(a.anchor?.y||0))];
  for(const item of make(a,matrix,i.id,'REAR'))newInstances.push({id:item.id.replace(':','-'),assetId:item.id,scale:1,support:{datumId:'compact12-world-origin'}});
 }
 geologyComposition.version=Math.max(2,(geologyComposition.version||1)+1);geologyComposition.instances=newInstances;
 geologyComposition.rearDatums=[...(geologyComposition.rearDatums||[]).filter(d=>d.id!=='compact12-world-origin'),{id:'compact12-world-origin',x:0,y:0}];
 const existing=new Set(project.library.map(a=>a.id));for(const a of assets)if(existing.has(a.id))throw Error('Compact Stage12 assets already exist: '+a.id);
 return{assets,elements,replacedElementIds,geologyComposition,assetMap,stats:{assets:assets.length,serializedBytes:assets.reduce((n,a)=>n+JSON.stringify(a).length,0),sourcePathsDuplicatedPerChunkOnly:true,details}};
}
