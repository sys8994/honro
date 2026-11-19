async ({views,targets,expected,seed})=>{
 const api=HonroWorkshopAPI,p=api.getProject(),s=p.stages.find(x=>x.id==='stage-42'),a=p.library.find(x=>x.id==='act5:near:42');
 const sha=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x))))).map(x=>x.toString(16).padStart(2,'0')).join('');
 if(await sha(p)!==expected||p.activeStageId!=='stage-42'||devicePixelRatio!==1)throw Error('Scene project differs from actual UI source');
 const rng=Math.random,origDraw=HonroVectorArt.draw;
 const reset=()=>{let n=seed;Math.random=()=>((n=(n*1664525+1013904223)>>>0)/2**32)};
 reset();
 const here=HonroMaps.finalize({...p,stages:[s],activeStageId:'stage-42'}), b=HonroMaps.createBattle(here.stages[0],here,HonroProfileStore.fresh(),{origin:'campaign'});
 HonroStageRules.sanitizeStageBattle(b);
 const cv=document.createElement('canvas');cv.width=1280;cv.height=800;Object.assign(cv.style,{position:'fixed',left:'-200vw',top:'0',width:'1280px',height:'800px'});document.body.append(cv);
 const sc=new HonroScene(cv),engine=new HONRO_CORE.Engine(b,()=>{},true),ctx=cv.getContext('2d');
 let counts={cached:0,exterior:0}, insideFrame=false;
 // Only call accounting. No geometry, paint or raster override in the renderer.
 HonroVectorArt.draw=function(c,asset,...args){
  if(insideFrame&&asset.id==='act5:stage42:registered-body')counts[sc._staticCacheBuild&&c.canvas.width===516&&c.canvas.height===516?'cached':'exterior']++;
  return origDraw.call(this,c,asset,...args);
 };
 const results=[];let cachedGroup=0;
 try{
  const physics=await sha(b.terrain),units=await sha(b.units);
  const F=HonroAuthoredFarArt;
  for(const view of views){
   counts={cached:0,exterior:0};
   const {x,y,zoom:scale}=view;
   Object.assign(sc,{manual:true,x,y,scale,time:2,editorView:false,skillPreview:false});HonroBounds.constrain(sc,b);
   const beforeHits=sc.renderCacheStats().worldHits??0;
   const target=targets.find(v=>v.label===view.label);
   if(target&&JSON.stringify([sc.x,sc.y,sc.scale])!==JSON.stringify(target.actual))throw Error('Camera changed from tested original');
   const frame=()=>{reset();sc.time=2;insideFrame=true;try{sc.render(engine,0,'',.6,false,0)}finally{insideFrame=false}ctx.getImageData(0,0,1,1)};
   frame();for(let i=0;i<80&&!F.ready(42,b.honroPreviewFar,b);i++){await new Promise(r=>setTimeout(r,100));frame()}
   if(!F.ready(42,b.honroPreviewFar,b)||!F.frames(sc,1280,800,b)?.length||(F.stats()?.errors??[]).length)throw Error('Far source not ready');
   frame();cachedGroup+=counts.cached;
   if(!target)continue;
   const snapshot=cv.toDataURL(), oc=document.createElement('canvas');oc.width=1280;oc.height=800;
   const raw=oc.getContext('2d');
   const placement=s.elements.find(e=>e.assetId===a.id);
   raw.setTransform(sc.scale,0,0,sc.scale,640-sc.x*sc.scale,400-sc.y*sc.scale);
   const body=a.edgeWall.params.authoredEastCapV1?{...a.edgeWall,vector:{...a.edgeWall.vector,root:a.edgeWall.vector.root.children[1]}}:a.edgeWall;
   origDraw(HonroVisualStyle.context(raw,'L1'),body,{x:placement.x,y:placement.y,scale:placement.scale});
   results.push({label:view.label,actual:[sc.x,sc.y,sc.scale],counts:{...counts},cached_group_draws:cachedGroup,cache_hit_delta:(sc.renderCacheStats().worldHits??0)-beforeHits,worldViewport:HonroBounds.viewport(sc,1280,800),png:snapshot,oldBodyMask:oc.toDataURL()});
  }
  if(await sha(b.terrain)!==physics||await sha(b.units)!==units)throw Error('EO scene altered battle');
  return {physics,units,results};
 }finally{HonroVectorArt.draw=origDraw;Math.random=rng;cv.remove()}
}
