/** Stage16 compact prototype. The disciple/elder recovery enclave and great hall are translated
 * intact; unequal outer approaches are cut down around them. This is not a
 * homothetic map/actor/physics scale and does not install itself in campaign. */
const clone=x=>JSON.parse(JSON.stringify(x));
export const STAGE16_X_KNOTS=[[-6000,-5000],[0,0],[2400,1000],[3600,2200],[4390,2500],[7460,5570],[11000,6400],[17000,11400]];
export const STAGE16_Y_OFFSET=-2500;
export function stage16CompactX(x){
 let i=1;while(i<STAGE16_X_KNOTS.length-1&&x>STAGE16_X_KNOTS[i][0])i++;
 const[a,b]=STAGE16_X_KNOTS[i-1],[c,d]=STAGE16_X_KNOTS[i];return b+(x-a)*(d-b)/(c-a);
}
const mapY=y=>y+STAGE16_Y_OFFSET;
function spatial(value){
 if(Array.isArray(value))return value.map(spatial);if(!value||typeof value!=='object')return value;
 const out=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,spatial(v)]));
 if(Number.isFinite(value.x)){out.x=stage16CompactX(value.x);if(Number.isFinite(value.w))out.w=stage16CompactX(value.x+value.w)-out.x;}
 if(Number.isFinite(value.y))out.y=mapY(value.y);
 for(const key of ['left','right','minX','maxX','boundaryX','warningX','stepOffX'])if(Number.isFinite(value[key]))out[key]=stage16CompactX(value[key]);
 for(const key of ['top','bottom','warningY'])if(Number.isFinite(value[key]))out[key]=mapY(value[key]);
 return out;
}
function terrain(t){
 const points=[],walk=[];
 for(let i=0;i<t.points.length;i++){
  const a=t.points[i],b=t.points[(i+1)%t.points.length],cuts=[0,...STAGE16_X_KNOTS.map(k=>(k[0]-a.x)/(b.x-a.x)).filter(f=>f>1e-8&&f<1-1e-8)].sort((a,b)=>a-b);
  for(const f of cuts){if(t.properties?.honroWalkEdges?.includes(i))walk.push(points.length);points.push({x:stage16CompactX(a.x+(b.x-a.x)*f),y:mapY(a.y+(b.y-a.y)*f)});}
 }
 const out={...spatial(t),points,properties:{...spatial(t.properties||{}),honroWalkEdges:walk}};
 for(const key of ['top','bottom'])if(Array.isArray(t.properties?.[key]))out.properties[key]=t.properties[key].map(([x,y])=>[stage16CompactX(x),mapY(y)]);
 return out;
}
function environment(original){
 const out=clone(original);if(!out)return out;
 for(const z of out.zones||[]){if(Number.isFinite(z.from))z.from=Math.max(0,mapY(z.from));if(Number.isFinite(z.to))z.to=Math.min(4000,mapY(z.to));z.blend=Math.min(z.blend,(z.to-z.from)*.45);}
 if(out.zones?.length)out.zones.at(-1).to=4000;
 for(const group of out.groups||[]){const old=original.groups.find(g=>g.id===group.id);group.x=stage16CompactX(old.x||0);group.y=mapY(old.y||0);}
 // Environment support points are local to their group; only group Y moves.
 for(const s of out.surfaces||[]){const group=original.groups?.find(g=>g.id===s.groupId),gx=group?.x||0,tx=stage16CompactX(gx),old=original.surfaces.find(v=>v.id===s.id);s.points=s.points?.map(p=>({...p,x:stage16CompactX(p.x+gx)-tx}));if(Number.isFinite(s.compositionWidth))s.compositionWidth=6400;
  // Background coverage is determined by camera/depth, not map-width ratio.
  // Retain the original distant endpoint margin instead of compressing it.
  if(s.points?.length){s.points[0].x=Math.min(s.points[0].x,old.points[0].x+gx-tx);s.points.at(-1).x=Math.max(s.points.at(-1).x,old.points.at(-1).x+gx-tx);}}
 return out;
}
function art(project,source){
 const lib=new Map(project.library.map(a=>[a.id,a])),assets=[],elements=[],replaced=new Set(),stats=[];
 const isBody=e=>e.assetId.startsWith('act2-traced:stage16-')||(e.assetId.startsWith('stage16:temple-')&&!['stage16:temple-stone-lamp','stage16:temple-stone-buddha-cliff-colossus'].includes(e.assetId));
 const count=(v,symbols,stack=new Set())=>{
  let nodes=1,chars=v.d?.length||v.dParts?.reduce((n,p)=>n+p.length,0)||0;
  if(v.tag==='use'){if(stack.has(v.symbol))throw Error('Stage16 cyclic native symbol');const n=new Set(stack);n.add(v.symbol);const z=count(symbols[v.symbol],symbols,n);nodes+=z.nodes;chars+=z.chars;}
  for(const c of v.children||[]){const z=count(c,symbols,stack);nodes+=z.nodes;chars+=z.chars;}return{nodes,chars};
 };
 for(const e of source.elements.filter(isBody)){
  const a=lib.get(e.assetId);if(!a?.vector||a.collision?.length||e.rotation)throw Error('Stage16 BODY must be unrotated collision-free native vector: '+e.assetId);
  const scale=e.scale??1,matrix=[scale,0,0,scale,(e.x||0)-scale*(a.anchor?.x||0),(e.y||0)-scale*(a.anchor?.y||0)],b=a.bounds;
  const left=matrix[0]*b.x+matrix[4],right=left+scale*b.w,top=matrix[3]*b.y+matrix[5],bottom=top+scale*b.h;
  const cuts=[left,...STAGE16_X_KNOTS.map(k=>k[0]).filter(x=>x>left&&x<right),right],size=count(a.vector.root,a.vector.symbols||{});
  if(size.nodes>470||size.chars>3700000)throw Error('Stage16 native BODY exceeds safe composition budget: '+a.id);
  const chunk=Math.max(1,Math.min(16,Math.floor(475/(size.nodes+3)),size.chars?Math.floor(3700000/size.chars):16));let chunks=0;
  for(let start=0;start<cuts.length-1;start+=chunk){
   const end=Math.min(cuts.length-1,start+chunk),id='act2-compact:stage16-'+e.id.replace(/[^\w-]/g,'-')+'-'+(++chunks),clips=clone(a.vector.clips||{}),symbols=clone(a.vector.symbols||{}),symbol='compact16-source-world',children=[];
   if(symbols[symbol])throw Error('Stage16 compact native symbol collision');symbols[symbol]={tag:'g',transform:matrix,children:[clone(a.vector.root)]};
   for(let i=start;i<end;i++){
    const x=cuts[i],z=cuts[i+1],sx=(stage16CompactX(z)-stage16CompactX(x))/(z-x),dx=stage16CompactX(x)-sx*x,key='compact16-strip-'+i;
    if(clips[key])throw Error('Stage16 compact clip collision');clips[key]=[`M${x} ${top-2}H${z}V${bottom+2}H${x}Z`];
    children.push({tag:'g',transform:[sx,0,0,1,dx,STAGE16_Y_OFFSET],clipPath:key,pixelSnapClip:true,children:[{tag:'use',symbol}]});
   }
   const bounds={x:stage16CompactX(cuts[start]),y:mapY(top),w:stage16CompactX(cuts[end])-stage16CompactX(cuts[start]),h:bottom-top};
   const asset={...clone(a),id,name:a.name+' · compact16 '+chunks,visual:[],collision:[],anchor:{x:0,y:0},sockets:[],bounds,reference:{...clone(a.reference||{}),bounds:clone(bounds),foot:{x:0,y:0},heightM:bounds.h/60,scaleRange:[1,1],backgroundRange:[1,1]},params:{...clone(a.params||{}),compact16Revision:1,compactSourceAssetId:a.id,compactSourceInstance:e.id,compactWarp:{xKnots:clone(STAGE16_X_KNOTS),yOffset:STAGE16_Y_OFFSET}},vector:{version:1,viewBox:[bounds.x,bounds.y,bounds.w,bounds.h],root:{tag:'g',children},clips,symbols,...(a.vector.gradients?{gradients:clone(a.vector.gradients)}:{})}};
   delete asset.params.surfaceCoverage;delete asset.params.surfaceJunction;assets.push(asset);elements.push({...clone(e),id:id.replace(':','-'),assetId:id,x:0,y:0,scale:1,rotation:0});
  }
  replaced.add(e.id);stats.push({source:a.id,chunks,sourceNodes:size.nodes,sourceCompoundChars:size.chars,strips:cuts.length-1});
 }
 if(replaced.size!==14)throw Error('Expected fourteen existing Stage16 architecture/ground planes');
 return{assets,elements,replaced,stats};
}
export function createStage16Compact(project){
 const source=project.stages.find(s=>s.metadata?.stageId===16);
 if(!source||source.width!==11000||source.height!==7600||source.initialState?.honroReviewedSceneRevision!==516)throw Error('Reviewed original Stage16 source required');
 if(source.design?.compact16)throw Error('Stage16 compact cannot be applied twice');
 const stage=spatial(clone(source)),body=art(project,source);
 stage.width=6400;stage.height=4000;stage.playBounds={left:0,top:0,right:6400,bottom:4000};stage.terrainBounds=spatial(source.terrainBounds);stage.environment=environment(source.environment);
 stage.terrains=source.terrains.map(terrain);stage.elements=stage.elements.filter(e=>!body.replaced.has(e.id)).concat(body.elements);
 for(const t of stage.terrains)if(t.playProjection?.bounds)t.playProjection.bounds={left:0,top:0,right:6400,bottom:4240};
 for(const plane of stage.design.space.terrainPlanes||[]){const old=source.design.space.terrainPlanes.find(p=>p.id===plane.id);if(old?.points)plane.points=old.points.map(([x,y])=>[stage16CompactX(x),mapY(y)]);}
 // Keep the rescue enclave AND the complete 3070-wide great hall at 1:1 scale.
 // The shrine's giant cliff Buddha and lamp props are translated at original size.
 const keep=new Set(['tm-gate-point','a2-enemy-0','tm-gate-captain','tm-gate-bat','tm-court-point','a2-enemy-2','a2-enemy-4','a2-enemy-5','a2-enemy-6','tm-cloister-guard','a2-enemy-10','a2-enemy-12','tm-hall-west-lamp','tm-hall-screen','a2-enemy-13','tm-hall-echo','a2-enemy-15','tm-gallery-lantern','tm-lower-front','tm-lower-point','tm-lower-bat','tm-archive-front','a2-enemy-20','tm-archive-point','a2-enemy-17','a2-enemy-23','tm-archive-rear','resident-spirit-1']);
 stage.units=stage.units.filter(u=>u.team!=='enemy'||keep.has(u.id));
 stage.encounters=stage.encounters.map(e=>({...e,unitIds:e.unitIds.filter(id=>stage.units.some(u=>u.id===id))})).filter(e=>e.unitIds.length);
 // Shortened approach/exit pockets need real formation spacing, not compressed
 // copies of the old row. Anchor only new initial placements to their surfaces.
 const floor=(id,x)=>{const t=stage.terrains.find(t=>t.id===id);for(const i of t.properties.honroWalkEdges||[]){const a=t.points[i],b=t.points[(i+1)%t.points.length];if(a.x!==b.x&&x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x))return a.y+(b.y-a.y)*((x-a.x)/(b.x-a.x));}throw Error('Compact16 placement lacks support '+id+' @ '+x);};
 // The shortened east bridge is narrower than two full-size ground actors.
 // Reuse two nearby original hall shoulders for the same three-member
 // response, preserving species, counts, role/elite flags, trigger and warning.
 const recordResponse=stage.events.find(ev=>ev.id==='v4.16.temple-record-answer');
 if(!recordResponse||recordResponse.action.actions.length!==3||recordResponse.honroDensityAlternatives.length!==1)throw Error('Unexpected Stage16 record response');
 const responsePlacement=(rows,support,left)=>{for(const a of rows){const offset=a.honroDensityRole==='elite'?130:a.air?60:0;a.x=left+offset;a.y=floor(support,a.x)-(a.air?260:0);a.support=support;a.surfaceId=support;}};
 responsePlacement(recordResponse.action.actions,'tm-great-hall-plinth',5310);
 responsePlacement(recordResponse.honroDensityAlternatives[0],'tm-great-hall-plinth',4770);
 for(const ev of stage.events){for(const rows of[ev.action.actions,...ev.honroDensityAlternatives])for(const a of rows)if(!a.air)a.y=floor(a.support||a.surfaceId,a.x);const a=ev.action.actions[0];ev.entry={x:a.x,y:a.y,surfaceId:a.support||a.surfaceId};}
 for(const [id,x,support]of [['tm-gate-point',580,'act2-floor'],['tm-gate-captain',688,'act2-floor'],['a2-enemy-0',965,'tm-processional-stair'],['tm-court-point',1120,'tm-processional-stair'],['a2-enemy-2',1260,'act2-floor'],['a2-enemy-4',1400,'act2-floor'],['tm-archive-point',5908,'act2-floor'],['tm-archive-front',6008,'act2-floor'],['a2-enemy-20',6108,'act2-floor'],['a2-enemy-23',6330,'act2-floor']]){const u=stage.units.find(u=>u.id===id);u.x=x;u.y=floor(support,x);}
 Object.assign(stage.units.find(u=>u.id==='tm-gate-bat'),{x:848,y:2817.425625842204});
 stage.units.find(u=>u.id==='a2-enemy-17').y-=64;
 stage.units.find(u=>u.id==='a2-enemy-6').x=2320;

 stage.initialState.honroAct2CompactRevision=1;
 delete stage.design.targetRounds;delete stage.design.expectedMinutes;
 stage.design.compact16={revision:1,status:'selected-layout',sourceBounds:[11000,7600],bounds:[6400,4000],xKnots:clone(STAGE16_X_KNOTS),yOffset:STAGE16_Y_OFFSET,core:{rescueOldX:[2400,3600],hallOldX:[4390,7460],localXDistancesPreserved:true,yDistancesPreserved:true},roster:{initial:28,finite:6},art:'existing temple architecture and traced ground recomposed; great hall, cliff Buddha, actors and lamp props retain their real size'};
 stage.design.space.topologyId='compact-temple-rescue-court-hall-and-record-exit';stage.metadata.compactStatus='selected-layout';
 return{source:clone(source),stage,assets:body.assets,artStats:{assets:body.assets.length,serializedBytes:body.assets.reduce((n,a)=>n+JSON.stringify(a).length,0),details:body.stats},preserved:{dialogueRows:true,stepIds:true,winConditions:true,physicalThresholds:true,greatHallWidth:3070},integrationNotes:['Install after reviewed16 author, new entries only.','Do not rerun old author coordinates after this package override.','Existing live snapshots must not be moved or reauthored.','Recheck actual NPC recovery walks, core witness receipt and preserved cloak/lantern shot before adoption.']};
}
