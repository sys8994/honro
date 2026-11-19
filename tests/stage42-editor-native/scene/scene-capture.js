async ({view, projectSha256, stageId, faceCount, ownerAssetId}) => {
  const api=window.HonroWorkshopAPI;
  if(devicePixelRatio!==1)throw Error('Unexpected renderer DPR');
  const bytesDigest=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',x))).map(b=>b.toString(16).padStart(2,'0')).join('');
  const digest=x=>bytesDigest(new TextEncoder().encode(JSON.stringify(x)));
  const project=api.getProject(), original=project.stages.find(s=>s.id===stageId), owner=project.library.find(a=>a.id===ownerAssetId);
  if(project.activeStageId!==stageId||!original||!owner?.edgeWall?.vector?.root?.clipPath)throw Error('Stage42 Scene binding mismatch');
  if((owner.edgeWall.params?.bodyEditorFaces?.length??0)!==faceCount)throw Error('Wrong Scene authoring state');
  if(await digest(project)!==projectSha256)throw Error('Scene project differs from verified Workshop source');
  let seed=3910;
  const random=Math.random;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
  const canvas=document.createElement('canvas');canvas.width=view.w;canvas.height=view.h;
  Object.assign(canvas.style,{position:'fixed',left:'-200vw',top:'0',width:view.w+'px',height:view.h+'px'});
  document.body.append(canvas);
  try{
    // Apply the same Stage42-only Scene validation used in the existing seven-view fixture.
    // The full release compiler/validation is not changed.
    const p=HonroMaps.finalize({...project,stages:[original],activeStageId:stageId});
    const s=p.stages[0], b=HonroMaps.createBattle(s,p,HonroProfileStore.fresh(),{origin:'campaign'});
    HonroStageRules.sanitizeStageBattle(b);
    const engine=new HONRO_CORE.Engine(b,()=>{},true), sc=new HonroScene(canvas);
    Object.assign(sc,{manual:true,x:view.x,y:view.y,scale:view.scale,time:2,editorView:false,skillPreview:false});
    HonroBounds.constrain(sc,b);
    const ctx=canvas.getContext('2d'), render=()=>{sc.render(engine,0,'',.6,false,0);ctx.getImageData(0,0,1,1);};
    const ready=()=>globalThis.HonroAuthoredFarArt.ready(42,b.honroPreviewFar,b);
    render();
    for(let i=0;i<80&&!ready();i++){await new Promise(r=>setTimeout(r,100));render();}
    if(!ready())throw Error('Stage42 authored far readiness timeout');
    render();
    const frames=globalThis.HonroAuthoredFarArt?.frames?.(sc,canvas.width,canvas.height,b);
    if(!frames?.length)throw Error('Stage42 far frame missing');
    if((globalThis.HonroAuthoredFarArt?.stats?.()?.errors??[]).length)throw Error('Stage42 far artwork logged errors');
    return {stageId,view:view.name,camera:[sc.x,sc.y,sc.scale,view.w,view.h],farReady:true,
            physicsSha256:await digest(b.terrain),unitsSha256:await digest(b.units),
            projectSha256,pixelSha256:await bytesDigest(ctx.getImageData(0,0,view.w,view.h).data),
            png:canvas.toDataURL('image/png')};
  }finally{canvas.remove();Math.random=random}
}
