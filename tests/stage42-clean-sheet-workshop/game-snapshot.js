({expectedPaths,view})=>{
 const p=HonroWorkshopAPI.getProject(),s=p.stages[0],asset=p.library[0];
 if(p.activeStageId!=='stage-42-clean-sheet'||p.stages.length!==1||p.library.length!==1||asset.id!=='stage42-clean-workshop-native'||s.terrains.length||s.elements.length!==1)throw Error('Game evidence must use isolated actual reopened project');
 const summary=asset.vector.root.children.map(c=>({d:c.d,id:c.id,fill:c.fill}));
 if(JSON.stringify(summary)!==JSON.stringify(expectedPaths))throw Error('Actual reopened geometry changed before Game render');
 const cv=document.createElement('canvas');cv.width=1280;cv.height=800;
 Object.assign(cv.style,{position:'fixed',left:'-200vw',width:'1280px',height:'800px'});
 document.body.append(cv);
 let draws=0;
 const oldVector=HonroVectorArt.draw,oldRandom=Math.random;
 try{
  HonroVectorArt.draw=function(c,a,...args){if(a.id===asset.id)draws++;return oldVector.call(this,c,a,...args)};
  const b=HonroMaps.createBattle(s,p,HonroProfileStore.fresh(),{origin:'workshop'});
  if(b.honroLandmarks.some(l=>l.asset?.id==='act5:near:42')||!b.honroLandmarks.some(l=>l.asset?.id===asset.id)||b.terrain.length)throw Error('Unexpected campaign art/terrain in evaluated Game scene');
  const e=new HONRO_CORE.Engine(b,()=>{},true),sc=new HonroScene(cv);
  Object.assign(sc,{manual:true,x:view.x,y:view.y,scale:view.zoom,time:2,editorView:false,skillPreview:false});
  HonroBounds.constrain(sc,b);
  let n=3910;Math.random=()=>((n=(n*1664525+1013904223)>>>0)/2**32);
  sc.render(e,0,'',.6,false,0);
  if(draws<1)throw Error('Native visual asset was not drawn by Game Scene');
  return {png:cv.toDataURL('image/png'),camera:[sc.x,sc.y,sc.scale],draws,stage:s.id,asset:asset.id,
   qualification:'stock Scene reopened blockout, no units/collision/playthrough/final art'};
 }finally{HonroVectorArt.draw=oldVector;Math.random=oldRandom;cv.remove()}
}
