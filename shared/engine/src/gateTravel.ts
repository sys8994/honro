/** Read-only gate planning. Eligibility and execution consume this same result. */
import type {Engine} from './engine';
import type {Battle,Unit,Vec,Terrain} from './types';
import {poly,terrainSurfaces,terrainRectIntersects,segmentTerrain,clamp} from './math';
import {validTerrainContactPose,exposedSurface,WALKABLE_SLOPE} from './locomotion';
type Stake=NonNullable<Battle['stakes']>[number];
export const GATE_SEARCH_RADIUS=220;
export const GATE_ACTIVATION_RADIUS=55;
export const GATE_ACTIVATION_HEIGHT=50;
export function gateActivationOutline(center:Vec){return Array.from({length:97},(_,i)=>{const angle=i*Math.PI/48;return {x:center.x+Math.cos(angle)*GATE_ACTIVATION_RADIUS,y:center.y+clamp(Math.sin(angle)*GATE_ACTIVATION_RADIUS,-GATE_ACTIVATION_HEIGHT,GATE_ACTIVATION_HEIGHT)};});}
export interface GateSpot extends Vec {support:Terrain;slope:number;distance:number;}
export interface GateResolution {ok:boolean;reason:string;from?:Stake;to?:Stake;spot?:GateSpot;}
export function gateSource(e:Engine,u=e.active){
 if(!u||u.dead||u.eaterCapturedBy||u.side!==0||u.retreat)return undefined;
 const gates=(e.b.stakes||[]).filter(z=>z.skill==='M09'&&z.side===u.side&&(z.expires===undefined||z.expires>e.b.round));
 if(gates.length!==2)return undefined;
 return gates.filter(z=>Math.hypot(u.x-z.x,u.y-z.y)<=GATE_ACTIVATION_RADIUS&&Math.abs(u.y-z.y)<GATE_ACTIVATION_HEIGHT).sort((a,b)=>Math.hypot(u.x-a.x,u.y-a.y)-Math.hypot(u.x-b.x,u.y-b.y)||a.id-b.id)[0];
}
function clearance(terrain:Terrain[],u:Unit,p:GateSpot){
 if(!validTerrainContactPose(terrain,{...u,x:p.x,y:p.y}))return false;
 // Use the complete width and head height. Only the supporting slope's lower
 // corners may overlap its own surface, just as in ordinary grounded poses.
 for(const t of terrain){
  if(t.oneWay)continue;
  const support=terrainSurfaces(t,p.x).find(f=>Math.abs(f.y-p.y)<.15);
  const footBand=support?Math.min(u.h*.4,Math.abs(support.slope)*u.r+1):.1;
  if(terrainRectIntersects(t,p.x-u.r,p.y-u.h,u.r*2,u.h-footBand,.05))return false;
 }
 return true;
}
function dangerous(e:Engine,u:Unit,p:Vec){
 if(p.x-u.r<0||p.x+u.r>e.b.width||p.y>e.b.height-1||p.y-u.h< -1700)return true;
 const limit=(globalThis as any).HonroStakeCrossing?.fallBoundary(e.b);
 if(limit!==null&&limit!==undefined&&p.y>limit)return true;
 return e.b.waters.some(w=>p.x+u.r>w.x&&p.x-u.r<w.x+w.w&&p.y>=w.y-9&&p.y-u.h<w.y+w.depth&&
  (w.kind==='lava'||p.y-w.y>u.h*.65));
}
export function resolveGate(e:Engine,u=e.active):GateResolution{
 const from=gateSource(e,u);if(!from||!u)return {ok:false,reason:'가까운 축지진목 한 쌍이 필요합니다.'};
 const to=(e.b.stakes||[]).find(z=>z.skill==='M09'&&z.side===u.side&&z.id!==from.id&&(z.expires===undefined||z.expires>e.b.round))!;
 const fail=(reason:string):GateResolution=>({ok:false,reason,from,to});
 if(u!==e.active||!e.canAct()||!e.grounded(u))return fail('현재 행동이 끝난 뒤 · 지면에서 사용');
 if(u.gateTurn===`${e.b.round}:${e.b.teamEnds[0]}`)return fail('이번 턴 축지 사용 완료');
 const radius=GATE_SEARCH_RADIUS;
 const terrain=e.b.terrain.filter(t=>!t.broken&&(t.expires===undefined||t.expires>e.b.round)&&t.x<=to.x+radius+u.r&&t.x+t.w>=to.x-radius-u.r&&t.y<=to.y+radius&&t.y+t.h>=to.y-radius-u.h);
 // Grid samples plus exact anchor, support projections, edge clearances and
 // actor boundaries: narrow ledges and nearest unoccupied positions survive.
 const xs=new Set<number>([to.x]);
 const add=(x:number)=>{if(Math.abs(x-to.x)<=radius+.001)xs.add(+x.toFixed(5));};
 for(let k=12;k<radius;k+=12){add(to.x-k);add(to.x+k);}add(to.x-radius);add(to.x+radius);
 for(const t of terrain){const v=poly(t);for(let i=0;i<v.length;i++){
  const a=v[i],b=v[(i+1)%v.length],dx=b.x-a.x,dy=b.y-a.y;
  for(const x of [a.x,a.x-u.r-.1,a.x+u.r+.1])add(x);
  if(dx>0){const q=clamp(((to.x-a.x)*dx+(to.y-a.y)*dy)/(dx*dx+dy*dy),0,1);add(a.x+q*dx);}
 }}
 for(const t of e.b.units)if(!t.dead&&!t.eaterCapturedBy&&t.id!==u.id)for(const x of [t.x-t.r-u.r-.1,t.x+t.r+u.r+.1])add(x);
 const candidates:GateSpot[]=[];
 for(const x of xs)for(const support of terrain)if(x>=support.x&&x<=support.x+support.w)for(const f of terrainSurfaces(support,x)){
  const distance=Math.hypot(x-to.x,f.y-to.y);
  if(distance<=radius+.001&&Math.abs(f.slope)<=WALKABLE_SLOPE&&exposedSurface(terrain,support,x,f.y))candidates.push({x,y:f.y,support,slope:f.slope,distance});
 }
 candidates.sort((a,b)=>a.distance-b.distance||Math.abs(a.x-to.x)-Math.abs(b.x-to.x)||a.y-b.y||a.x-b.x||(String(a.support.id)<String(b.support.id)?-1:String(a.support.id)>String(b.support.id)?1:0));
 let firstReason='가까운 지지면 없음';
 for(const [index,p] of candidates.entries()){
  let reason='';
  if(!clearance(terrain,u,p))reason='머리·몸체 여유 부족';
  else if(e.b.units.some(t=>!t.dead&&!t.eaterCapturedBy&&t.id!==u.id&&Math.abs(t.x-p.x)<t.r+u.r&&p.y>t.y-t.h+.1&&p.y-u.h<t.y-.1))reason='다른 배우가 점유 중';
  else if(dangerous(e,u,p))reason='위험한 물·낙사 구역';
  // The fallback is local to the destination gate's room. A low foot-level
  // sight line may leave a cramped head space, but cannot cross a solid wall.
  else if(terrain.some(t=>!t.oneWay&&segmentTerrain({x:to.x,y:to.y-12},{x:p.x,y:p.y-12},t,0)))reason='도착 진목과 벽으로 분리됨';
  else if((e.b as any).honroStage===5&&(e.b as any).honroStage5LakeRevision===1&&!(e.b as any).honroCustom&&(p.x>2380||p.y>3000))reason='깊은 소와 젖은 절벽에는 축지진목의 발디딤을 이을 수 없습니다.';
  else reason=(e as any).gateDestinationReason?.(p,from,to)||'';
  if(!reason)return {ok:true,reason:'축지진목 사용',from,to,spot:p};
  if(index===0)firstReason=reason;
 }
 return fail(`도착지 없음 · ${firstReason}`);
}
