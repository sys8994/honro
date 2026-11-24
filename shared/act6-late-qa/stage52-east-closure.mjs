// Only authored artificial outer closure on Stage52's east and west owners.
// Walkable/top paths, diagnostic outlines and terrain data stay unchanged.
const CONTROLS=[[9450,8425,8100,10600],[8100,10600,2060,9900],[9400,-2720,9450,8425]];
const WEST=[[-3800,8000,-3050,-2200],[-2800,9400,-3800,8000],[-800,9100,-2800,9400],[325,8500,-800,9100],[1250,7550,325,8500]];
const matches=(v,s)=>v[0]===s.a.x&&v[1]===s.a.y&&v[2]===s.z.x&&v[3]===s.z.y;
export function attachEast52Closure({G,scene,e,verify,permit,onDraw=()=>{}}={}){
 const b=e?.b, receipt=verify?.(permit,scene,e),R=G?.HonroTerrainReadability;
 if(!receipt||receipt.scene!==scene||receipt.battle!==b||receipt.stage!==52||b.honroStage!==52||b.honroAuthoredId!=='qa-act6-r4-02'||b.mode!=='act6-isolated'||b.honroMapOrigin!=='act6-qa'||b.honroCustom!==false||
 !G.HonroTerrainDomain.active(b)||typeof G.Path2D!=='function'||!R?.prepare)return null;
 const world=b.honroWorldTerrain,play=b.terrain,p=b.honroPlayBounds,group=R.prepare(b).groups.find(g=>g.id==='east-return-buttress');
 if(p?.right!==6250||p?.bottom!==6250||!group?.edge)return null;
 const cuts=group.segments.filter(s=>s.walkable===false&&CONTROLS.some(v=>matches(v,s))&&
  (Math.min(s.a.x,s.z.x)>p.right||Math.min(s.a.y,s.z.y)>p.bottom));
 if(cuts.length!==3||!CONTROLS.every(v=>cuts.some(s=>matches(v,s))))return null;
 const path=new G.Path2D(),native=scene.terrainReadability;
 const west=R.prepare(b).groups.find(g=>g.id==='west-watch-and-descent');
 const westCuts=west?.segments.filter(s=>s.walkable===false&&WEST.some(v=>matches(v,s))&&
  (Math.max(s.a.x,s.z.x)<p.left||Math.min(s.a.y,s.z.y)>p.bottom))??[];
 const westPath=west?.edge&&westCuts.length===5&&WEST.every(v=>westCuts.some(s=>matches(v,s)))?new G.Path2D():null;
 if(westPath)for(const s of west.segments)if(!westCuts.includes(s)){westPath.moveTo(s.a.x,s.a.y);westPath.lineTo(s.z.x,s.z.y);}
 for(const s of group.segments)if(!cuts.includes(s)){path.moveTo(s.a.x,s.a.y);path.lineTo(s.z.x,s.z.y);}
 function wrap(ctx,b0,...args){
  const draw=()=>native.call(this,ctx,b0,...args);
  if(this!==scene||b0!==b||e.b!==b||b.terrain!==play||b.honroWorldTerrain!==world||scene.viewOptions?.debugTerrainOutline||
     verify(permit,scene,e)!==receipt||R.prepare(b).groups.find(g=>g.id===group.id)!==group)return draw();
  const stroke=ctx.stroke;
  ctx.stroke=function(obj,...other){
   if(obj===group.edge&&String(ctx.strokeStyle).toLowerCase()===String(R.STYLE.edgeInk).toLowerCase()){
    onDraw(cuts.length);return stroke.call(this,path,...other);
   }
   if(westPath&&obj===west.edge&&R.prepare(b).groups.find(g=>g.id===west.id)===west&&String(ctx.strokeStyle).toLowerCase()===String(R.STYLE.edgeInk).toLowerCase()){
    onDraw(westCuts.length,'west');return stroke.call(this,westPath,...other);
   }
   return stroke.call(this,obj,...other);
  };
  try{return draw();}finally{ctx.stroke=stroke;}
 }
 scene.terrainReadability=wrap;
 return Object.freeze({detach(){if(scene.terrainReadability===wrap)scene.terrainReadability=native;}});
}
