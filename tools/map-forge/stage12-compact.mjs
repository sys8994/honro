/** Chapter-specific cut-space layout. Reuses the authored quarry silhouettes;
 * trims unequal dead approaches, never scales actors or physics. */
import {compactStage12Art} from '../environment/stage12-compact-art.mjs';
export const X_KNOTS=[[-6000,-5000],[0,0],[3300,450],[5330,2200],[6520,3350],[7800,4350],[9300,5250],[11200,6400],[17200,11000]];
export const Y_OFFSET=-1900;
const clone=x=>JSON.parse(JSON.stringify(x));
export function compactX(x){let i=X_KNOTS.findIndex((p,i)=>i&&x<=p[0]);if(i<1)i=x<X_KNOTS[0][0]?1:X_KNOTS.length-1;const a=X_KNOTS[i-1],b=X_KNOTS[i];return a[1]+(x-a[0])*(b[1]-a[1])/(b[0]-a[0]);}
function spatial(o){
 if(Array.isArray(o))return o.map(spatial);if(!o||typeof o!=='object')return o;
 const q=Object.fromEntries(Object.entries(o).map(([k,v])=>[k,spatial(v)]));
 if(Number.isFinite(o.x)){q.x=compactX(o.x);if(Number.isFinite(o.w))q.w=compactX(o.x+o.w)-q.x;}
 if(Number.isFinite(o.y))q.y=o.y+Y_OFFSET;
 if(Number.isFinite(o.stepOffX))q.stepOffX=compactX(o.stepOffX);
 for(const k of ['minX','maxX','left','right'])if(Number.isFinite(o[k]))q[k]=compactX(o[k]);
 for(const k of ['top','bottom'])if(Number.isFinite(o[k]))q[k]=o[k]+Y_OFFSET;
 return q;
}
function warpTerrain(t){const points=[],walk=[];for(let i=0;i<t.points.length;i++){const a=t.points[i],b=t.points[(i+1)%t.points.length],ts=[0,...X_KNOTS.map(k=>(k[0]-a.x)/(b.x-a.x)).filter(f=>f>1e-8&&f<1-1e-8)].sort((a,b)=>a-b);for(const f of ts){if((t.properties.honroWalkEdges||[]).includes(i))walk.push(points.length);points.push({x:compactX(a.x+(b.x-a.x)*f),y:a.y+(b.y-a.y)*f+Y_OFFSET});}}return{...spatial(t),points,properties:{...spatial(t.properties),honroWalkEdges:walk}};}
export function topAt(stage,id,x){const t=stage.terrains.find(t=>t.id===id);for(const i of t.properties.honroWalkEdges||[]){const a=t.points[i],b=t.points[(i+1)%t.points.length];if(x>=Math.min(a.x,b.x)-1e-6&&x<=Math.max(a.x,b.x)+1e-6&&a.x!==b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}throw Error('Missing compact support '+id+' '+x);}
export function createStage12Compact(project){
 const source=project.stages.find(s=>s.metadata?.stageId===12);if(!source||source.width!==11200||source.height!==8000||source.initialState.honroReviewedSceneRevision!==512)throw Error('Unexpected Stage12 source');
 const stage=spatial(clone(source));stage.width=6400;stage.height=5000;stage.playBounds={left:0,top:0,right:6400,bottom:5000};
 stage.terrains=source.terrains.map(warpTerrain);
 for(const z of stage.environment?.zones||[]){if(Number.isFinite(z.from))z.from+=Y_OFFSET;if(Number.isFinite(z.to))z.to+=Y_OFFSET;}
 // The old western circuit is shortened more than the event hub and eastern
 // escape, retaining the existing topological/terrain IDs and real cave gate.
 stage.design.compact12={revision:1,status:'selected-layout',sourceBounds:[11200,8000],bounds:[6400,5000],xKnots:X_KNOTS,yOffset:Y_OFFSET,recurrence:'actual 1000-distance loop; checkpoint reauthored on lower ground',roster:{initial:24,finite:2},art:'reused traced vector BODY/REAR, spatially recomposed; no new illustration'};
 delete stage.design.targetRounds;delete stage.design.expectedMinutes;
 stage.design.title='돌아오는 산길';stage.design.space.topologyId='compact-quarry-recurrence-and-two-exits';
 // Arrays of coordinate pairs in geological surface metadata are not generic
 // number ranges. Transform these explicitly; preserve all gameplay constants.
 for(const t of stage.terrains){const original=source.terrains.find(v=>v.id===t.id);for(const k of ['top','bottom'])if(Array.isArray(original.properties?.[k]))t.properties[k]=original.properties[k].map(([x,y])=>[compactX(x),y+Y_OFFSET]);}
 const keep=new Set(['sq-b1','sq-b2','sq-b3','sq-b5','sq-c1','sq-c2','sq-c3','sq-c4','sq-d1','sq-d4','sq-e1','sq-e2','sq-e3','sq-f1','sq-f2','sq-f3','sq-f5','sq-f6','sq-f7','sq-g1','sq-g2','sq-g3','sq-g4','sq-g5']);
 stage.units=stage.units.filter(u=>u.team!=='enemy'||keep.has(u.id));
 stage.encounters=stage.encounters.map(e=>({...e,unitIds:e.unitIds.filter(id=>stage.units.some(u=>u.id===id))})).filter(e=>e.unitIds.length);
 const init=stage.initialState,landmark=stage.markers.find(m=>m.id==='sign');
 init.honroAct2CompactRevision=1;
 init.honroV4Recurrence={landmark:{x:landmark.x,y:landmark.y},checkpoint:{x:landmark.x-1100,y:topAt(stage,'sq-lower-ground',landmark.x-1100),surfaceId:'sq-lower-ground'},minimumDistance:1000};
 init.honroV4Reviewed12={gap:{x:landmark.x+95,y:landmark.y-30},entries:[{x:landmark.x+620,y:topAt(stage,'sq-lower-ground',landmark.x+620)-140},{x:landmark.x-620,y:topAt(stage,'sq-lower-ground',landmark.x-620)-140}]};
 // Real sprite/prop sizes are unchanged. Recompute rooted support after the
 // piecewise cut rather than shrinking trees/carts with the world geometry.
 for(const el of stage.elements.filter(e=>!e.assetId.startsWith('act2-traced:stage12-'))){const old=source.elements.find(e=>e.id===el.id);if(!old)continue;const surface=source.terrains.find(t=>(t.properties?.honroWalkEdges||[]).some(i=>{const a=t.points[i],b=t.points[(i+1)%t.points.length];return old.x>=Math.min(a.x,b.x)&&old.x<=Math.max(a.x,b.x)&&Math.abs(old.y-(a.y+(b.y-a.y)*(old.x-a.x)/(b.x-a.x)))<35;}));if(surface)el.y=topAt(stage,surface.id,el.x);}
 const art=compactStage12Art(project,source,{xKnots:X_KNOTS,yOffset:Y_OFFSET});
 stage.elements=stage.elements.filter(e=>!e.assetId.startsWith('act2-traced:stage12-')).concat(art.elements);
 stage.design.geologyComposition=art.geologyComposition;
 stage.metadata.compactStatus='selected-layout';
 return{source:clone(source),stage,assets:art.assets,artStats:art.stats};
}
