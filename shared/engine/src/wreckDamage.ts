import type {Battle,Unit,Terrain,Vec} from './types';
import {segmentProjectileTerrain,polygonArea} from './math';
type DamageGeometry={version:1;unitId:string;projectileHullReplacement:true;polygons:Vec[][];aim:Vec};
// Authored metadata is immutable between sceneVersion updates, like terrain broad-phase data.
// Compile a detached snapshot once, never attach caches to a saved battle or authored project.
const geometryCache=new WeakMap<object,{scene:number;list:Vec[][];refs:Vec[][];lengths:number[];aim:Vec;ax:number;ay:number;value:DamageGeometry}>();
/** Explicit authored damage geometry; never a body/terrain/AI-origin replacement. */
export function wreckDamage(b:Battle,u:Unit){
 const q=b as any,link=q.honroMap?.vectorWreckInTerrain,d=link?.damage;
 if(q.honroAct4Preview!==39||!(u as any).honroAct4WreckBoss||u.id!=='a4-wreck'||link?.version!==1||d?.version!==1||d.unitId!==u.id||link.terrainId!=='approved39-wreck-hull'||!b.terrain.some(t=>t.id===link.terrainId&&!t.broken)||!q.honroLandmarks?.some((l:any)=>l.id===link.instanceId&&l.asset?.id===link.assetId&&l.asset.vector&&!l.asset.collision?.length&&l.nativeArtLayer==='body'&&l.nativeTerrainIds?.includes(link.terrainId)))return null;
 const cached=geometryCache.get(d);
 if(cached&&Array.isArray(d.polygons)&&d.aim&&cached.scene===b.sceneVersion&&cached.list===d.polygons&&cached.refs.length===d.polygons.length&&cached.refs.every((ps,i)=>ps===d.polygons[i]&&ps.length===cached.lengths[i])&&cached.aim===d.aim&&cached.ax===d.aim.x&&cached.ay===d.aim.y&&d.projectileHullReplacement===true)return cached.value;
 if(d.projectileHullReplacement!==true||!Array.isArray(d.polygons)||!d.polygons.length||d.polygons.length>4||d.polygons.reduce((n:number,ps:Vec[])=>n+(Array.isArray(ps)?ps.length:129),0)>128||!d.polygons.every((ps:Vec[])=>Array.isArray(ps)&&ps.length>=3&&ps.length<=64&&ps.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))&&Math.abs(polygonArea(ps))>1e-6)||!Number.isFinite(d.aim?.x)||!Number.isFinite(d.aim?.y)||damageNearest(d.polygons,d.aim).distance>1e-6)return null;
 const value:DamageGeometry={version:1,unitId:d.unitId,projectileHullReplacement:true,polygons:d.polygons.map((ps:Vec[])=>ps.map(p=>({x:p.x,y:p.y}))),aim:{x:d.aim.x,y:d.aim.y}};
 geometryCache.set(d,{scene:b.sceneVersion,list:d.polygons,refs:d.polygons.slice(),lengths:d.polygons.map((ps:Vec[])=>ps.length),aim:d.aim,ax:d.aim.x,ay:d.aim.y,value});return value;
}
export function damageNearest(polygons:Vec[][],p:Vec){
 let best={distance:Infinity,point:p,polygon:polygons[0]};
 for(const ps of polygons){let inside=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){
  const a=ps[j],b=ps[i];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1))),point={x:a.x+t*dx,y:a.y+t*dy},distance=Math.hypot(p.x-point.x,p.y-point.y);if(distance<best.distance)best={distance,point,polygon:ps};
 }if(inside)return {distance:0,point:p,polygon:ps};}return best;
}
export function damageContact(polygons:Vec[][],a:Vec,z:Vec,r:number){let best:ReturnType<typeof segmentProjectileTerrain>=null;for(const vertices of polygons){const t={vertices} as Terrain,h=segmentProjectileTerrain(a,z,t,r);if(h&&(!best||h.t<best.t))best=h;}return best;}
export function damageAim(b:Battle,u:Unit,fraction=.5):Vec{return wreckDamage(b,u)?.aim||{x:u.x,y:u.y-u.h*fraction};}
export function damageCritical(b:Battle,u:Unit,p:Vec){const d=wreckDamage(b,u);if(!d)return Math.abs(p.y-(u.y-u.h*.53))<u.h*.17;const ps=damageNearest(d.polygons,p).polygon,ys=ps.map(p=>p.y),top=Math.min(...ys),bottom=Math.max(...ys),h=bottom-top;return Math.abs(p.y-(bottom-h*.53))<h*.17;}
