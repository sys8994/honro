async ({expected,proof,requested,w,h})=>{
 const p=HonroWorkshopAPI.getProject(),s=p.stages[0];
 const ownerState=p.library.map(x=>[x.id,x.vector.root,x.collision.length]);
 if(p.activeStageId!==expected.id||s.terrains.length||JSON.stringify(ownerState)!==JSON.stringify(expected.asset))throw Error('Current freshly reopened native source drift');
 const b=HonroMaps.createBattle(s,p,HonroProfileStore.fresh(),{origin:'workshop'}),e=new HONRO_CORE.Engine(b,()=>{},true);
 const ownership=()=>JSON.stringify([b.width,b.height,b.honroTerrainBounds,b.terrain,b.honroLandmarks.map(l=>[l.id,l.x,l.y,l.scale,l.asset.id,l.asset.vector.root])]);
 const before=ownership(),qa=HonroC01DisposableQA,normal=HonroVectorArt.draw,rng=Math.random;
 const make=()=>{
   const cv=document.createElement('canvas');
   cv.width=w;cv.height=h;
   Object.assign(cv.style,{position:'fixed',left:'-200vw',width:w+'px',height:h+'px'});document.body.append(cv);
   const sc=new HonroScene(cv);
   Object.assign(sc,{manual:true,x:requested[0],y:requested[1],scale:requested[2],time:2,editorView:false,skillPreview:false});
   HonroBounds.constrain(sc,b);
   return {cv,sc};
 };
 const shots={},names=new Set(p.library.map(v=>v.id));
 try{
  qa.enable(b,proof);
  for(let n=0;!qa.ready(b);n++){
   if(n>=200)throw Error('Stock authored C01 image did not decode');
   await new Promise(r=>setTimeout(r,50));
  }
  const modes=['neutral-1','neutral-2','c01','bg-c01','alpha-neutral','alpha-c01'];
  for(const mode of modes){
    const on=mode==='c01'||mode==='bg-c01'||mode==='alpha-c01',alpha=mode.startsWith('alpha');
    if(on)qa.enable(b,proof); else qa.disable(b);
    const {cv,sc}=make(),c=cv.getContext('2d'),seen=new Map();
    let n=4903;Math.random=()=>((n=(n*1664525+1013904223)>>>0)/2**32);
    HonroVectorArt.draw=function(c,a,...args){if(names.has(a?.id))seen.set(a.id,(seen.get(a.id)||0)+1);return normal.call(this,c,a,...args);};
    try{
      sc.weatherParticles=sc.backgroundReadability=()=>{};
      if(alpha)sc.background=()=>{};
      if(mode==='bg-c01')sc.background(c,w,h,b); else sc.render(e,0,'',.6,false,0);
      const far=(sc.environmentStats?.authoredFar||[]).includes('stage42C01CleanFar');
      if(far!==(mode==='c01'||mode==='bg-c01'))throw Error('Incorrect stock C01 draw state in '+mode);
      if(mode==='bg-c01'&&seen.size)throw Error('Background painted foreground geometry');
      shots[mode]={actual:[sc.x,sc.y,sc.scale],owners:Object.fromEntries(seen),frames:on?HonroAuthoredFarArt.frames(sc,w,h,b):[],far,png:cv.toDataURL('image/png')};
    }finally{cv.remove();}
  }
  if(before!==ownership())throw Error('Backdrop changed source owner, bounds or visual-only terrain');
  if(!shots.c01.owners['new-stage42-joined-lower']&&requested[2]<.3)throw Error('No structural owner in overview');
  return {shots,requested,dpr:devicePixelRatio,w,h,bounds:b.honroTerrainBounds,renderer:'stock authored far + disposable custom opt-in'};
 } finally{qa.disable(b);Math.random=rng;HonroVectorArt.draw=normal;}
}
