import assert from 'node:assert/strict';
export const coordinates=p=>({x:p.x,y:p.y});
export function openRoute(b){
 // Explicit cleared-path fixture. This does not represent earning these states
 // through normal combat; individual objective/target tests cover their rules.
 for(const t of b.terrain)if(t.id.startsWith('gate-')||t.id==='water-gate')t.broken=true;
 for(const t of b.terrain)if(t.honroRestoredVertices)t.vertices=structuredClone(t.honroRestoredVertices);
 b.sceneVersion++;
}
export function terrainFace(st,surface,x,{restored=false}={}){
 const authored=st.terrains.find(t=>t.id===surface.terrainId);assert(authored,'Missing terrain '+surface.terrainId);
 const t=restored&&authored.properties?.honroRestoredVertices?{...authored,points:authored.properties.honroRestoredVertices}:authored;
 for(const i of surface.edgeIndices){
  const a=t.points[i],b=t.points[(i+1)%t.points.length];
  if(Math.abs(b.x-a.x)>1e-8&&x>=Math.min(a.x,b.x)-.01&&x<=Math.max(a.x,b.x)+.01)return{y:a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x),slope:(b.y-a.y)/(b.x-a.x),terrain:t,edge:i};
 }
 return null;
}
export function assertStanding(g,b,e,point,unit,label,{body=true}={}){
 const support=e.surface(point.x,point.y-4,point.y+4);
 assert(support,`${label}: no exposed support at ${point.x},${point.y}`);
 if(body)assert(!g.HonroTerrain.intersects(b,unit,point.x,point.y,{padding:2,support:support.t}),`${label}: body lacks clearance`);
 return support;
}
export function walkRoute(g,b,e,u,route,{npc=false}={}){
 const samples=[];let ticks=0,failed=null;
 for(const p of route){
  let age=0,still=0;
  const maxTicks=Math.max(240,Math.ceil(Math.abs(p.x-u.x)/Math.max(1,u.walkSpeed)*60*3)+120);
  while(Math.abs(u.x-p.x)>8&&age++<maxTicks){
   const old=u.x;u.moveLeft=1800;
   // Full collision/support walking only. Never jump, recover, reset position,
   // alter HP, or teleport to the next waypoint to make a route pass.
   e.walk(u,Math.sign(p.x-u.x),1/60,true);e.tick(1/60);ticks++;
   if(Math.abs(u.x-old)<.01)still++;else still=0;
   if(u.dead||u.y>b.height){failed={reason:'fall',goal:p,x:u.x,y:u.y};break;}
   if(still>60){failed={reason:'blocked',goal:p,x:u.x,y:u.y};break;}
  }
  samples.push({goal:coordinates(p),x:Math.round(u.x*100)/100,y:Math.round(u.y*100)/100,ticks:age});
  if(failed||age>=maxTicks||Math.abs(u.y-p.y)>22){failed??={reason:age>=maxTicks?'timeout':'wrong surface',goal:p,x:u.x,y:u.y};break;}
 }
 return{passed:!failed,failed,ticks,samples,mode:npc?'NPC continuous walk':'hero walk-only'};
}
