const S='stage-54';
const shape={N:[3200,3000,-260,-280,3580,3450],L:[3000,3200,-280,-380,3450,3460],C:[3200,3000,-380,-450,3460,3280]};
const xf={N:({x,y})=>({x,y}),L:({x,y})=>({x:y,y:3200-x}),C:({x,y})=>({x:3200-x,y:3000-y})};
const own=['foothill','mid-contact','east-spine','post-contact','west-continuation'];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const check=(x,why)=>{if(!x)throw Error(why);};
const narrow=points=>points.flatMap(p=>p[0]===320&&p[1]===2290?[p,[270,2303],[270,2368]]:[p]);
export const ids=Object.freeze({N:S,L:S+'-left',C:S+'-ceiling'});
export const chartPins=Object.freeze({
 N:Object.freeze(['3913a4853a7acca4fb18851fad6ff5f36288ff36e0d86a8f0c03267176b59f57','cb812ca24f46e3b1049ffbc621985dd40846e8acab1f8fedcf09bb325039e6d3']),
 L:Object.freeze(['93552f9784484c68e4f61e2c1efdb377f9ae8d977817dcffc5c4c152c0cfb87b','4c0bda41e785f33daf648f7dff4f8107fadc074f85d00de07a1c17d7979f8b2d']),
 C:Object.freeze(['4a5b704ebeeb26ec7b80634fb9abbfe682df38599e96ea41418c60de6f689555','446b055c62e9f8d495fa00205000775dffd64263d8778f1677b394143f31005b'])
});
// Author-time. Inputs are explicit polygon art; battle units/archives cannot
// supply a competing launch authority.
export function compileStage54Charts({maps:M,environment:E,domain:D,geometry,assets}){
 let normal;
 const build=(frame)=>{
  const [width,height,left,top,right,bottom]=shape[frame];
  const play={left:0,top:0,right:width,bottom:height},terra={left,top,right,bottom}, mapPoint=xf[frame];
  const st=M.emptyStage(ids[frame],'거꾸로 선 처마',width,height);
  Object.assign(st,{metadata:{stageId:54,campaign:false},playBounds:play,terrainBounds:terra,terrainDomainVersion:1});
  const grow=a=>a.map(([x,y])=>mapPoint({x,y}));
  st.terrains=own.map(id=>{
   const points=frame==='N'?grow(id==='mid-contact'?narrow(geometry[id]):geometry[id]):normal.find(t=>t.id===id).points.map(mapPoint);
   const start=points.find(({x,y})=>x>=0&&x<=width&&y>=0&&y<=height);
   return {id,type:'solid',name:id,baseMaterial:'rock',breakable:false,points,playProjection:{bounds:play,start}};
  });
  const transformed=assets.map(a=>{
   const {x,y,w,h}=a.bounds;
   const b=[mapPoint({x,y}),mapPoint({x:x+w,y:y+h})];
   return {...a,bounds:{x:Math.min(...b.map(p=>p.x)),y:Math.min(...b.map(p=>p.y)),w:Math.abs(b[1].x-b[0].x),h:Math.abs(b[1].y-b[0].y)},
    visual:a.visual.map(p=>({fill:p.fill,points:grow(a.id==='g00-mid-contact'?narrow(p.points):p.points)}))};
  });
  const library=transformed.map(a=>({...a,reference:E.referenceForLegacyAsset(a)}));
  const elements=transformed.map(a=>({id:'art-'+a.id,assetId:a.id,x:0,y:0,scale:1,rotation:0,snap:false,layer:'prop',depthLayer:'L1',visualRole:'scenery'}));
  const make=()=>{
   const project=M.normalize({schema:'honro-map',version:6,environmentVersion:E.VERSION,name:st.name,activeStageId:st.id,settings:{autosave:false},library,stages:[{...st,elements}]});
   const errs=M.validate(project).filter(x=>x.level==="err"&&!x.text.endsWith("stageId must reference an implemented campaign stage"));
   check(errs.length===0,"authoring validation failed: "+JSON.stringify(errs));
   return {project,map:M.compile(project.stages[0],project)};
  };
  const raw=make();
  for(const owner of st.terrains){
   const w=raw.map.worldTerrain.find(v=>v.id===owner.id),t=raw.map.terrain.find(v=>v.id===owner.id);
   if(!same(D.projection({points:w.vertices,playProjection:w.honroDomainProjection}).points,t.vertices)){
    owner.points=w.vertices;owner.playProjection.start=t.vertices[0];
   }
  }
  if(frame==='N')normal=structuredClone(st.terrains);
  const result=make();
  for(const w of result.map.worldTerrain){
   check(same(D.projection({points:w.vertices,playProjection:w.honroDomainProjection}).points,result.map.terrain.find(v=>v.id===w.id).vertices),'world contact differs: '+w.id);
  }
  check(same(raw.map.terrain.map(x=>x.vertices),result.map.terrain.map(x=>x.vertices)),'compiled physical outline changed '+frame+' '+ JSON.stringify(raw.map.terrain.map((t,i)=>[t.id,t.vertices.length,result.map.terrain[i].vertices.length,t.vertices[0],result.map.terrain[i].vertices[0]])));
  check(result.map.landmarks.length===assets.length&&result.map.landmarks.every(l=>!l.collisionIds.length),'near art introduced a collider');
  return {frame,id:st.id,width,height,play,terra,project:result.project,terrain:result.map.terrain,world:result.map.worldTerrain,landmarks:result.map.landmarks,elements:result.map.elements};
 };
 return Object.fromEntries(Object.keys(shape).map(k=>[k,build(k)]));
}
