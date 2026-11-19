async ({views,w,h,seed})=>{
  const api=window.HonroWorkshopAPI, project=api.getProject(), original=project.stages.find(s=>s.id==='stage-42');
  const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))).map(x=>x.toString(16).padStart(2,'0')).join('');
  if(devicePixelRatio!==1||project.activeStageId!=='stage-42'||!original||await digest(project)!=='135e9a633d311d3b8b03ab2c676a7e94a46601629e0a91d7835988ed96438ddf')throw Error('Official original Workshop project pin mismatch');
  const owner=project.library.find(e=>e.id==='act5:near:42');if(owner.edgeWall.params?.bodyEditorFaces||owner.edgeWall.params?.workshopVisibleJoint42)throw Error('Authored QA state found; expected baseline');
  const oldRandom=Math.random;
  const reset=()=>{let n=seed;Math.random=()=>((n=(n*1664525+1013904223)>>>0)/2**32)};
  reset();
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  Object.assign(canvas.style,{position:'fixed',left:'-200vw',top:'0',width:w+'px',height:h+'px'});
  document.body.append(canvas);
  try {
    const p=HonroMaps.finalize({...project,stages:[original],activeStageId:'stage-42'});
    const b=HonroMaps.createBattle(p.stages[0],p,HonroProfileStore.fresh(),{origin:'campaign'});
    HonroStageRules.sanitizeStageBattle(b);
    const e=new HONRO_CORE.Engine(b,()=>{},true),sc=new HonroScene(canvas),frames=[];
    const physics=()=>digest(b.terrain),units=()=>digest(b.units),beforeT=await physics(),beforeU=await units();
    const ctx=canvas.getContext('2d'),F=window.HonroAuthoredFarArt;
    for(const view of views){
      Object.assign(sc,{manual:true,x:view.x,y:view.y,scale:view.zoom,time:2,editorView:false,skillPreview:false});
      HonroBounds.constrain(sc,b);
      const draw=()=>{reset();sc.time=2;sc.render(e,0,'',.6,false,0);ctx.getImageData(0,0,1,1)};
      draw();
      for(let i=0;i<80&&!F.ready(42,b.honroPreviewFar,b);i++){await new Promise(r=>setTimeout(r,100));draw()}
      if(!F.ready(42,b.honroPreviewFar,b)||!F.frames(sc,w,h,b)?.length||(F.stats()?.errors??[]).length)throw Error('Original official far art not ready');
      draw();
      frames.push({label:view.label,requested:[view.x,view.y,view.zoom],actual:[sc.x,sc.y,sc.scale],size:[w,h],pinnedFar:true,
                   worldViewport:HonroBounds.viewport(sc,w,h),
                   png:canvas.toDataURL('image/png')});
    }
    if(await physics()!==beforeT||await units()!==beforeU)throw Error('Diagnostic changed battle data');
    return {physics:beforeT,units:beforeU,frames};
  }finally{canvas.remove();Math.random=oldRandom}
}
