({expected,view})=>{
 const p=HonroWorkshopAPI.getProject(),s=p.stages[0],names=p.library.map(a=>a.id),cv=document.createElement('canvas');
 if(p.activeStageId!==expected.id||JSON.stringify(names)!==JSON.stringify(expected.assets.map(a=>a[0]))||p.library.some((a,i)=>JSON.stringify(a.vector.root)!==JSON.stringify(expected.assets[i][1]))||s.terrains.length)throw Error('Fresh draft changed');
 cv.width=1280;cv.height=800;Object.assign(cv.style,{position:'fixed',left:'-200vw',width:'1280px',height:'800px'});document.body.append(cv);
 const draw=HonroVectorArt.draw,rnd=Math.random,drawn=new Set();
 try {
  HonroVectorArt.draw=(c,a,...args)=>{if(names.includes(a.id))drawn.add(a.id);return draw.call(HonroVectorArt,c,a,...args)};
  const b=HonroMaps.createBattle(s,p,HonroProfileStore.fresh(),{origin:'workshop'}),e=new HONRO_CORE.Engine(b,()=>{},true),sc=new HonroScene(cv);
  if(b.terrain.length!==0||b.honroLandmarks.length!==5||b.honroLandmarks.some(q=>!names.includes(q.asset?.id)))throw Error('Legacy asset or physics in isolated Scene');
  let n=3910;Math.random=()=>((n=(n*1664525+1013904223)>>>0)/2**32);
  Object.assign(sc,{manual:true,x:view.x,y:view.y,scale:view.zoom,time:2,editorView:false,skillPreview:false});
  HonroBounds.constrain(sc,b);sc.render(e,0,'',.6,false,0);
  if(drawn.size!==5)throw Error('Missing native structure role draw');
  return {png:cv.toDataURL('image/png'),camera:[sc.x,sc.y,sc.scale],assetOwners:[...drawn],stockUnaltered:true,qualification:'Normal stock renderer, no gameplay and far art placeholder'};
 }finally{HonroVectorArt.draw=draw;Math.random=rnd;cv.remove()}
}
