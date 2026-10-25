import {authorStage5Traversal} from './stage5-traversal.mjs';
import {authorStage5Positioning} from './stage5-positioning.mjs';
/** Remote lake/cave transform. Western land/actors have one positioning author. */
export function authorStage5Lake(s,old,g){
 const clone=v=>JSON.parse(JSON.stringify(v)),dx=900;
 s.environment.zones.at(-1).to=5000;
 for(const sf of s.environment.surfaces){sf.points[0].x=Math.min(sf.points[0].x,-30000);sf.points.at(-1).x=Math.max(sf.points.at(-1).x,35000);sf.bottom=Math.max(sf.bottom,32000);}
 const base=clone(s.terrains.find(t=>t.id==='valley-floor'));
 s.width=5300;s.height=5000;s.initialState.honroStage5LakeRevision=1;
 const cliff=s.terrains.find(t=>t.id==='waterfall-cliff');for(const p of cliff.points)p.x+=dx;
 const veil=s.terrains.find(t=>t.id==='waterfall-veil');for(const p of veil.points)p.x+=dx;for(const p of veil.properties.honroWaterFluidVertices)p.x+=dx;
 const target=s.terrains.find(t=>t.id==='cliff-cleat');for(const p of target.points)p.x+=old.initialState.honroStage5LakeRevision?0:dx;
 s.terrains=[base,cliff,veil,target];
 Object.assign(s.anchors,{waterfallFoot:{x:3890,y:3300,support:'valley-floor'},cleat:{x:4220,y:2404,support:'waterfall-cliff'}});
 s.markers=s.markers.filter(m=>m.id!=='marker-6');
 const bottom=[[2640,3300],[3000,3700],[3500,4200],[4200,4280],[4700,4010],[4800,3930]];
 s.materials=s.materials.filter(m=>m.id==='stage5-headwater');const head=s.materials[0];head.x1+=dx;head.x2+=dx;
 s.materials.push({id:'stage5-plunge-pool',terrainId:'valley-floor',kind:'water-pool',x1:2640,x2:4800,surfaceY:3300,surface:[[2640,3300],[4800,3300]],bottom,points:[[2640,3300],[4800,3300],...bottom.slice().reverse()],honroCarvedBasin:true,depth:0,alpha:.94,conductive:true,step:18});
 for(const e of s.elements)if(e.kind==='waterfall'||e.id.includes('crest'))e.x+=dx;
 s.elements=s.elements.filter(e=>!['landmark-2','landmark-4'].includes(e.id));
 s.design.waterfall.lakeRevision=1;for(const k of ['headwater','lip','pool'])s.design.waterfall[k].x+=dx;
 authorStage5Positioning(s,g);authorStage5Traversal(s);
}
