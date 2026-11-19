async ({on,projectSHA,expectedRim})=>{
 const g=globalThis, stamp=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x))))).map(b=>b.toString(16).padStart(2,'0')).join('');
 const q=HonroWorkshopAPI.getProject(), st=q.stages.find(s=>s.id==='stage-42'),asset=q.library.find(a=>a.id==='act5:near:42');
 if(await stamp(q)!==projectSHA||JSON.stringify(asset.edgeWall.params?.workshopVisibleJoint42?.rim??null)!==JSON.stringify(expectedRim))throw Error('Wrong game-side reopened project');
 if(devicePixelRatio!==1||q.activeStageId!=='stage-42'||!g.HonroStage42OwnedRasterQA)throw Error('Invalid owner QA environment');
 const p=HonroMaps.finalize({...q,stages:[st],activeStageId:'stage-42'});
 const b=HonroMaps.createBattle(p.stages[0],p,HonroProfileStore.fresh(),{origin:'campaign'});
 HonroStageRules.sanitizeStageBattle(b);
 const cv=document.createElement('canvas');cv.width=1280;cv.height=800;Object.assign(cv.style,{position:'fixed',left:'-200vw'});document.body.append(cv);
 g.HONRO_STAGE42_OWNER_RASTER_QA=on;
 const start=HonroStage42OwnedRasterQA.inspect(), ctx=cv.getContext('2d'),sc=new HonroScene(cv),engine=new HONRO_CORE.Engine(b,()=>{},true),samples={};
 const render=()=>{const t=performance.now();sc.render(engine,0,'',.6,false,0);ctx.getImageData(0,0,1,1);return performance.now()-t;};
 const tick=()=>new Promise(resolve=>requestAnimationFrame(resolve));
 const view=(x,y,z)=>{Object.assign(sc,{manual:true,x,y,scale:z,time:2,editorView:false,skillPreview:false});HonroBounds.constrain(sc,b);};
 const ready=()=>HonroAuthoredFarArt.ready(42,b.honroPreviewFar,b);
 function record(times){return {camera:[sc.x,sc.y,sc.scale],elapsedMs:times,owner:HonroStage42OwnedRasterQA.inspect(),cache:sc.renderCacheStats()};}
 try{
  view(150,1850,.5);const cold=render();
  for(let i=0;i<80&&!ready();i++){await new Promise(r=>setTimeout(r,100));render();}
  if(!ready()||!HonroAuthoredFarArt.frames(sc,cv.width,cv.height,b)?.length||HonroAuthoredFarArt.stats?.()?.errors?.length)throw Error('Official far not ready or invalid');
  samples.initial=record([cold]);
  const png=cv.toDataURL();
  let values=[];for(let i=0;i<10;i++){await tick();values.push(render());}
  samples.warm=record(values);
  values=[];for(const x of [240,340,450,580,700]){await tick();view(x,1850,.5);values.push(render());}
  samples.pan=record(values);
  values=[];for(const z of [.70,.73,.77]){await tick();view(150,1850,z);values.push(render());}
  samples.zoom=record(values);
  values=[];for(let i=0;i<5;i++){await tick();values.push(render());}
  samples.afterZoomWarm=record(values);
  return {stage:'stage-42',projectSHA,start,samples,farReady:true,physics:await stamp(b.terrain),units:await stamp(b.units),png};
 }finally{g.HONRO_STAGE42_OWNER_RASTER_QA=false;cv.remove();}
}
