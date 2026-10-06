(function(G){'use strict';
// Canonical world polygons are the only geographical source. Battle collision
// is a bounded projection, never the source of an independently painted skirt.
const clone=x=>JSON.parse(JSON.stringify(x)),EPS=1e-7;
function dedupe(ps){return ps.filter((p,i)=>{const a=ps[(i+ps.length-1)%ps.length];return Math.hypot(p.x-a.x,p.y-a.y)>EPS;});}
function clip(points,b){let ps=points.map(p=>({...p}));for(const [axis,n,less]of [['x',b.left,false],['x',b.right,true],['y',b.top,false],['y',b.bottom,true]]){const next=[],inside=p=>less?p[axis]<=n+EPS:p[axis]>=n-EPS;for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length],ai=inside(a),zi=inside(z);if(ai)next.push(a);if(ai!==zi){const f=(n-a[axis])/(z[axis]-a[axis]);next.push({x:a.x+(z.x-a.x)*f,y:a.y+(z.y-a.y)*f,[axis]:n});}}ps=next;}return dedupe(ps);}
function projection(t){const q=t.playProjection;if(!q)return t;let points=clip(t.points,q.bounds),start=points.findIndex(p=>Math.abs(p.x-q.start.x)<EPS&&Math.abs(p.y-q.start.y)<EPS);if(start>0)points=[...points.slice(start),...points.slice(0,start)];return{...t,points};}
function worldBounds(st){return st.terrainBounds||{left:0,top:0,right:st.width,bottom:st.height};}
function extend(points,st,ceiling=false){
 const box=worldBounds(st),ys=points.map(p=>p.y),base=ceiling?Math.min(...ys):Math.max(...ys),closes=ceiling?base<=EPS:base>=st.height-EPS;
 const partialRoof=ceiling&&!(points.some(p=>Math.abs(p.x)<EPS)&&points.some(p=>Math.abs(p.x-st.width)<EPS)),onBase=p=>closes&&Math.abs(p.y-base)<EPS,side=p=>Math.abs(p.x)<EPS?-1:Math.abs(p.x-st.width)<EPS?1:0;
 const outer=p=>({x:side(p)?side(p)<0?box.left:box.right:p.x,y:onBase(p)?ceiling?(partialRoof?(side(p)?-1800:0):box.top):box.bottom:p.y});
 // Broad authored shoulders, not periodic noise. Roof/floor share the profile
 // so the exterior tunnel stays open. Chapters 18/19 occupy the same vault.
 const profiles=[[0,-130,-360,-220,-510],[0,180,-70,-460,-260],[0,-80,240,40,-320],[0,-230,-90,-410,-620],[0,100,-260,-80,-380]],profile=s=>profiles[(((st.metadata?.stageId===19?18:st.metadata?.stageId)||1)+(s<0?1:3))%profiles.length];
 const land=(d,s)=>{const stops=[0,800,2300,4100,6000],ys=profile(s);let i=0;while(i<stops.length-2&&d>stops[i+1])i++;const u=Math.max(0,Math.min(1,(d-stops[i])/(stops[i+1]-stops[i]))),f=u*u*(3-2*u);return ys[i]+(ys[i+1]-ys[i])*f;};
 const run=(p,neighbor,s)=>{const edge=s<0?0:st.width,end=s<0?box.left:box.right,extent=Math.abs(end-edge),dx=Math.abs(p.x-neighbor.x),slope=dx>EPS?Math.max(-.45,Math.min(.45,(p.y-neighbor.y)/dx)):0,out=[];for(let d=0;d<extent;d+=500)out.push({x:edge+s*d,y:p.y+slope*300*(1-Math.exp(-d/300))+land(d,s)});out.push({x:end,y:p.y+slope*300*(1-Math.exp(-extent/300))+land(extent,s)});return out;};
 const out=[];for(let i=0;i<points.length;i++){const a=points[i],z=points[(i+1)%points.length],s=side(a);
  if(s&&s===side(z)&&Math.abs(a.x-z.x)<EPS){const prev=points[(i+points.length-1)%points.length],next=points[(i+2)%points.length],ar=onBase(a)?[outer(a)]:run(a,prev,s),zr=onBase(z)?[outer(z)]:run(z,next,s).reverse();out.push(...ar,...zr);}
  else if(partialRoof&&onBase(a)&&onBase(z)){const mouth=side(a)?z:a,far=side(a)?outer(a):outer(z),ridge=[[0,0],[.10,-280],[.23,-950],[.41,-1900],[.70,-1700],[1,-1800]].map(([u,y])=>({x:mouth.x+(far.x-mouth.x)*u,y}));out.push(...(side(a)?ridge.reverse():ridge));}
  else{out.push(onBase(a)?outer(a):{...a});if(onBase(a)&&!onBase(z))out.push({...a});if(!onBase(a)&&onBase(z))out.push({...z});}
 }
 const result=dedupe(out),start=result.findIndex(p=>Math.abs(p.x-points[0].x)<EPS&&Math.abs(p.y-points[0].y)<EPS);return start>0?[...result.slice(start),...result.slice(0,start)]:result;
}
function author(project){const p=clone(project);p.version=6;for(const st of p.stages){if(st.terrainBounds)continue;
 st.playBounds={left:0,top:0,right:st.width,bottom:st.height};st.terrainBounds={left:-6000,top:-24000,right:st.width+6000,bottom:st.height+24000};st.terrainDomainVersion=1;
 const simulationBottom=Math.max(st.height,...st.terrains.map(t=>{const q=G.HonroGeometry.terrain(t,st.height);return q.y+q.h;}));
 for(let i=0;i<st.terrains.length;i++){const t=st.terrains[i],raw=G.HonroGeometry.terrain(t,st.height);if(t.oneWay||t.breakable||raw.honroElementCollision)continue;if(!(raw.x<=EPS||raw.x+raw.w>=st.width-EPS||raw.honroCeiling&&raw.y<=EPS||raw.y+raw.h>=st.height-EPS))continue;
  const points=extend(raw.vertices,st,!!raw.honroCeiling);if(JSON.stringify(points)===JSON.stringify(raw.vertices))continue;
  const q={...t,type:'solid',points,playProjection:{bounds:{left:0,top:0,right:st.width,bottom:simulationBottom},start:{...raw.vertices[0]}}};delete q.control;delete q.floor;delete q.thickness;st.terrains[i]=q;
 }
}return p;}
function validate(st){const out=[],fail=text=>out.push({level:'err',text:st.id+': '+text}),box=v=>v&&typeof v==='object'&&!Array.isArray(v)&&['left','top','right','bottom'].every(k=>Number.isFinite(v[k])&&Math.abs(v[k])<=100000)&&v.right>v.left&&v.bottom>v.top;
 if(!st.terrainBounds){if(st.playBounds||st.terrainDomainVersion||(st.terrains||[]).some(t=>t.playProjection))fail('incomplete terrain domain');return out;}
 const v=st.terrainBounds,p=st.playBounds;if(st.terrainDomainVersion!==1)fail('unsupported terrain domain');if(!box(p)||!box(v)||p.left!==0||p.top!==0||p.right!==st.width||p.bottom!==st.height||v.left>=p.left||v.top>=p.top||v.right<=p.right||v.bottom<=p.bottom){fail('terrainBounds must strictly contain the stable playBounds');return out;}
 for(const t of st.terrains||[]){const q=t.playProjection;
  if(!Object.prototype.hasOwnProperty.call(t,'playProjection')){const ps=t.points||t.control;if(!t.oneWay&&Array.isArray(ps)&&ps.some(a=>a&&(a.x<p.left||a.x>p.right||a.y<p.top||a.y>p.bottom+512)))fail(t.id+' extended solid requires playProjection');continue;}
  const points=t.points,validPoints=Array.isArray(points)&&points.length>=3&&points.length<=4096&&points.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=v.left-EPS&&p.x<=v.right+EPS&&p.y>=v.top-EPS&&p.y<=v.bottom+EPS);
  if(t.type!=='solid'||!validPoints||!q||typeof q!=='object'||!box(q.bounds)||!q.start||!Number.isFinite(q.start.x)||!Number.isFinite(q.start.y)||q.bounds.left!==p.left||q.bounds.right!==p.right||q.bounds.top!==p.top||q.bounds.bottom<p.bottom||q.bounds.bottom>v.bottom)fail(t.id+' invalid play projection');else if(clip(points,q.bounds).length<3)fail(t.id+' empty play projection');
 }return out;
}
const renders=new WeakMap(),validBattles=new WeakMap();
function active(b){if(!b||b.honroTerrainDomainVersion!==1)return false;const prior=validBattles.get(b);if(prior?.source===b.honroWorldTerrain&&prior.bounds===b.honroTerrainBounds&&prior.play===b.honroPlayBounds&&prior.version===b.sceneVersion&&prior.width===b.width&&prior.height===b.height)return prior.valid;
 const box=v=>v&&['left','top','right','bottom'].every(k=>Number.isFinite(v[k])&&Math.abs(v[k])<=100000)&&v.right>v.left&&v.bottom>v.top,p=b.honroPlayBounds,v=b.honroTerrainBounds,ts=b.honroWorldTerrain;
 const validProjection=t=>{if(!Object.prototype.hasOwnProperty.call(t,'honroDomainProjection'))return true;const q=t.honroDomainProjection;return !!(q&&typeof q==='object'&&!Array.isArray(q)&&box(q.bounds)&&q.bounds.left===p.left&&q.bounds.right===p.right&&q.bounds.top===p.top&&q.bounds.bottom>=p.bottom&&q.bounds.bottom<=v.bottom&&q.start&&Number.isFinite(q.start.x)&&Number.isFinite(q.start.y));};
 const valid=!!(box(p)&&box(v)&&p.left===0&&p.top===0&&p.right===b.width&&p.bottom===b.height&&v.left<p.left&&v.right>p.right&&v.top<p.top&&v.bottom>p.bottom&&Array.isArray(ts)&&ts.length<=512&&ts.every(t=>t&&typeof t.id==='string'&&validProjection(t)&&[t.x,t.y,t.w,t.h].every(Number.isFinite)&&t.w>0&&t.h>0&&Array.isArray(t.vertices)&&t.vertices.length>=3&&t.vertices.length<=4096&&t.vertices.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=v.left-EPS&&p.x<=v.right+EPS&&p.y>=v.top-EPS&&p.y<=v.bottom+EPS)));
 validBattles.set(b,{source:ts,bounds:v,play:p,version:b.sceneVersion,width:b.width,height:b.height,valid});return valid;
}
function render(b){if(!active(b))return b.terrain||[];let q=renders.get(b);if(q?.version===b.sceneVersion&&q.source===b.honroWorldTerrain&&q.count===b.terrain.length)return q.terrain;
 const live=new Map(b.terrain.map(t=>[t.id,t])),terrain=[];for(const world of b.honroWorldTerrain){const t=live.get(world.id);if(!t)continue;let shape=world;
  // Existing restoration events update the collision projection. Re-form the
  // complete mass from that changed surface, including after save/reload.
  if(world.honroDomainProjection){const base=projection({points:world.vertices,playProjection:world.honroDomainProjection}).points;if(JSON.stringify(base)!==JSON.stringify(t.vertices)){const points=extend(t.vertices,{width:b.width,height:b.height,terrainBounds:b.honroTerrainBounds,metadata:{stageId:b.honroStage}},!!t.honroCeiling);shape=G.HonroMapEngine.solid(t.id,points.map(p=>[p.x,p.y]));}}
  terrain.push({...world,...t,vertices:shape.vertices,x:shape.x,y:shape.y,w:shape.w,h:shape.h,honroDomain:true});live.delete(world.id);
 }terrain.push(...live.values());q={version:b.sceneVersion,source:b.honroWorldTerrain,count:b.terrain.length,terrain};renders.set(b,q);return terrain;
}
G.HonroTerrainDomain={VERSION:1,render,active,author,projection,clip,extend,worldBounds,validate};
})(globalThis);
