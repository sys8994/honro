/** Additive routes on the selected compact map. Existing terrain/art/gameplay
 * remain byte-for-byte intact; reused native vectors share collider transforms. */
export function addVerticalRoutes(stage){
 if(stage.terrains.some(t=>t.id==='compact-north-pine-route'))return stage;
 const copy=x=>structuredClone(x);
 function duplicate(sourceId,id,scale,dx,dy,artId){
  const source=stage.terrains.find(t=>t.id===sourceId),t=copy(source);
  t.id=id;t.name=id;t.points=t.points.map(p=>({x:p.x*scale+dx,y:p.y*scale+dy}));
  t.properties={...t.properties,honroSpaceSurfaceId:id,optional:true};delete t.properties.visualSupportId;
  stage.terrains.push(t);
  const old=stage.elements.find(e=>e.id===artId),art=copy(old);
  art.id=id+'-art';art.x=old.x*scale+dx;art.y=old.y*scale+dy;art.scale=old.scale*scale;art.nativeTerrainId=id;
  stage.elements.push(art);
  stage.design.space.surfaces.push({terrainId:id,edgeIndices:copy(t.properties.honroWalkEdges)});
  return t;
 }
 const north=duplicate('compact-upper-flank','compact-north-pine-route',1,2700,-620,'compact11-art-1');
 const lower=duplicate('compact-stone-neck','compact-lower-rock-route',.45,1672.5,1372,'compact11-art-stone-neck-rear');
 const p=(x,y,surfaceId)=>({x,y,surfaceId});
 const northStart=p(4470,1738,'compact-floor');northStart.jumpTo={...p(4520,1597.2,north.id),support:north.id};
 const lowStart=p(2700,2500.8,'compact-floor');lowStart.jumpTo={...p(2760,2378.285714285714,lower.id),support:lower.id};
 stage.design.compact11.verticalRoutes={revision:1,baseline:'be573beeb',policy:'Additive optional upper/lower shelves. Existing terrain, objectives, roster, bounds and live saves unchanged.',routes:[
  {id:'north-pine-loop',kind:'optional-jump-and-drop',anchors:[northStart,p(4520,1597.2,north.id),p(4750,1450,north.id),p(5200,1430,north.id),p(5620,1500,north.id),p(5910,1595.72265625,north.id)],drop:true},
  {id:'lower-rock-loop',kind:'optional-jump-and-drop',anchors:[lowStart,p(2760,2378.285714285714,lower.id),p(2887.5,2371,lower.id),p(3103.5,2371,lower.id),p(3210,2380.984375,lower.id)],drop:true}
 ]};
 return stage;
}
