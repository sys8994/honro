async ({views,w,h,seed,projectSha,capSha,hasCap})=>{
  const api=window.HonroWorkshopAPI, project=api.getProject(), original=project.stages.find(s=>s.id==='stage-42');
  const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))).map(x=>x.toString(16).padStart(2,'0')).join('');
  if(devicePixelRatio!==1||project.activeStageId!=='stage-42'||!original)throw Error('Wrong stock Workshop project or stage');
  const owner=project.library.find(e=>e.id==='act5:near:42');if(owner.edgeWall.params?.authoredEastCapV1||owner.edgeWall.params?.bodyEditorFaces||owner.edgeWall.params?.workshopVisibleJoint42||window.HonroEastCapQA)throw Error('Unexpected trial layer in stock application');
  if(hasCap){
    const base=structuredClone(project),a=base.library.find(e=>e.id==='act5:near:42').edgeWall;
    const root=a.vector.root;
    if(root.tag!=='g'||root.children?.length!==2||root.children[0]?.id!=='authored-stage42-east-cap-v1'||await digest(root.children[0])!==capSha)throw Error('Built stock cap differs from verified genuine editor receipt');
    a.vector.root=root.children[1];
    if(await digest(base)!==projectSha)throw Error('Built stock candidate changes more than original native root wrapper');
  }else if(await digest(project)!==projectSha)throw Error('Official original Workshop project pin mismatch');
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
    const place=original.elements.find(e=>e.assetId==='act5:near:42');
    if(place.id!=='a5-near'||place.x!==0||place.y!==0||place.rotation!==0||place.scale!==3.2146389713155292)throw Error('Unverified native ownership');
    for(const frame of frames){
      if(frame.label==='east-support-only')continue;
      const [x,y,z]=frame.actual;
      const drawOwner=(nativeClip=false)=>{
        const cv=document.createElement('canvas');cv.width=w;cv.height=h;
        const c=cv.getContext('2d',{alpha:true});
        c.setTransform(z,0,0,z,w/2-x*z,h/2-y*z);
        if(nativeClip){c.scale(place.scale,place.scale);c.fill(new Path2D(owner.edgeWall.vector.clips['native-source-alpha'].join(' ')),'nonzero');}
        else HonroVectorArt.draw(HonroVisualStyle.context(c,'L1'),owner.edgeWall,{x:0,y:0,scale:place.scale});
        return cv.toDataURL('image/png');
      };
      frame.owner=drawOwner();
      if(!hasCap)frame.clip=drawOwner(true);
    }
    if(await physics()!==beforeT||await units()!==beforeU)throw Error('Diagnostic changed battle data');
    return {physics:beforeT,units:beforeU,frames};
  }finally{canvas.remove();Math.random=oldRandom}
}
