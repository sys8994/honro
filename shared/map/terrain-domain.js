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
 for(let i=0;i<st.terrains.length;i++){const t=st.terrains[i],raw=G.HonroGeometry.terrain(t,st.height);if(raw.oneWay||t.breakable||raw.honroElementCollision)continue;if(!(raw.x<=EPS||raw.x+raw.w>=st.width-EPS||raw.honroCeiling&&raw.y<=EPS||raw.y+raw.h>=st.height-EPS))continue;
  const points=extend(raw.vertices,st,!!raw.honroCeiling);if(JSON.stringify(points)===JSON.stringify(raw.vertices))continue;
  const q={...t,type:'solid',points,playProjection:{bounds:{left:0,top:0,right:st.width,bottom:simulationBottom},start:{...raw.vertices[0]}}};delete q.control;delete q.floor;delete q.thickness;st.terrains[i]=q;
 }
}return p;}
function validate(st){const out=[],fail=text=>out.push({level:'err',text:st.id+': '+text}),box=v=>v&&typeof v==='object'&&!Array.isArray(v)&&['left','top','right','bottom'].every(k=>Number.isFinite(v[k])&&Math.abs(v[k])<=100000)&&v.right>v.left&&v.bottom>v.top;
 if(!st.terrainBounds){if(st.playBounds||st.terrainDomainVersion||(st.terrains||[]).some(t=>t.playProjection))fail('incomplete terrain domain');return out;}
 const v=st.terrainBounds,p=st.playBounds;if(st.terrainDomainVersion!==1)fail('unsupported terrain domain');if(!box(p)||!box(v)||p.left!==0||p.top!==0||p.right!==st.width||p.bottom!==st.height||v.left>=p.left||v.top>=p.top||v.right<=p.right||v.bottom<=p.bottom){fail('terrainBounds must strictly contain the stable playBounds');return out;}
 for(const t of st.terrains||[]){const q=t.playProjection;
  if(!Object.prototype.hasOwnProperty.call(t,'playProjection')){const ps=t.points||t.control;if(!G.HonroGeometry.oneWay(t)&&Array.isArray(ps)&&ps.some(a=>a&&(a.x<p.left||a.x>p.right||a.y<p.top||a.y>p.bottom+512)))fail(t.id+' extended solid requires playProjection');continue;}
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
// Material artwork is a view of the canonical mass, just as collision is a
// projection of it. Keep the authored local detail; replace only the old solid
// underpaint and continue large strata in world coordinates. Never write these
// derived vectors into battle/save state or invent a second terrain silhouette.
const materialViews=new WeakMap();
const materialSpecs={
 'eup21:foundations':{terrain:'a3-foundation',deep:3650},
 'family24:terrain-material':{terrain:'a3-foundation',deep:3300},
 'family24:deep-foundation-masonry':{terrain:'a3-foundation',detail:true},
 'family24:retaining-earth-faces':{terrain:'a3-foundation',detail:true},
 'stage26-witness:earth-and-footing-planes':{terrain:'a3-foundation',deep:3100},
 'stage29:record-actual-stone-faces':{terrain:'a3-foundation',deep:7000},
 'stage29:record-far-river-bank':{panorama:true},
 'a3-waterworks-v3:25:masonry-vault':{vault:true},
 'a3-waterworks-v3:27:masonry-vault':{vault:true},
 'a3-maintenance25:dark-shell':{rear:true},
 'stage27-depot-r4:misconnected-rear':{rear:true}
};
const pathString=ps=>'M'+ps.map(p=>p.x+' '+p.y).join('L')+'Z';
// All extended polygon nodes were authored with absolute M/L commands. Curved
// architectural paths remain byte-for-byte unchanged.
function paintPolygon(d){if(!d||/[^MLZ0-9.eE+\-,\s]/.test(d))return null;const ns=d.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)?.map(Number);return ns&&ns.length>=6&&ns.length%2===0?Array.from({length:ns.length/2},(_,i)=>({x:ns[i*2],y:ns[i*2+1]})):null;}
function buriedVault(l,b){
 const asset=clone(l.asset),vector=asset.vector,original=paintPolygon(vector.root.children[0]?.d);
 if(!original||original.length!==7)return l;
 const {left,right,top}=b.honroTerrainBounds,w=b.width;
 // Keep every underside vertex, including the two end vertices, unchanged.
 // Only the formerly exposed top/side faces merge into the surrounding rock.
 const lower=[{x:right,y:1470},{x:w+3800,y:1640},{x:w+1800,y:1430},{x:w+600,y:1690},...original.slice(2),{x:-500,y:1830},{x:-1900,y:1490},{x:-3500,y:1680},{x:left,y:1550}];
 const full=[{x:left,y:top},{x:right,y:top},...lower];
 const node=(points,fill)=>({tag:'path',d:pathString(points),fill});
 vector.gradients={
  'buried-vault-rock':{type:'linear',x1:0,y1:-3800,x2:0,y2:1900,stops:[{offset:0,color:'#081b23',opacity:1},{offset:.64,color:'#12292f',opacity:1},{offset:1,color:'#263c3d',opacity:1}]},
  'buried-vault-west':{type:'linear',x1:0,y1:-2100,x2:0,y2:1800,stops:[{offset:0,color:'#0b2027',opacity:1},{offset:1,color:'#304740',opacity:1}]}
 };
 vector.root.children=[node(full,'url(#buried-vault-rock)'),
  node([{x:left,y:-3100},{x:w*.12,y:-2400},{x:w*.39,y:280},{x:w*.17,y:1740},...lower.slice(lower.findIndex(p=>p.x===0))],'url(#buried-vault-west)'),
  node([{x:w*.46,y:-2500},{x:right,y:-3800},...lower.slice(0,lower.findIndex(p=>p.x===w*.45)+1),{x:w*.61,y:410}],'#142b30'),
  node([{x:left,y:1150},{x:-3000,y:800},{x:-1200,y:1080},{x:0,y:1320},{x:w*.17,y:1400},{x:w*.45,y:1260},{x:w*.78,y:1390},{x:w,y:1280},{x:w+600,y:1480},{x:w+1800,y:1100},{x:right,y:1200},...lower],'#2d4443')];
 asset.bounds={x:left,y:top,w:right-left,h:1900-top};vector.viewBox=[left,top,right-left,1900-top];
 return{...l,asset,honroTerrainMaterialClip:new Path2D(pathString(full))};
}
function materialLandmarks(b){
 if(!active(b)||b.honroCustom||b.honroStage<21||b.honroStage>30)return b.honroLandmarks||[];
 const source=b.honroLandmarks||[],terrain=render(b),old=materialViews.get(b);
 if(old?.source===source&&old.terrain===terrain&&old.version===b.sceneVersion)return old.landmarks;
 const bounds=b.honroTerrainBounds,landmarks=source.map(l=>{
  const spec=materialSpecs[l.asset?.id];if(!spec||!l.asset.vector||l.x||l.y||(l.scale??1)!==1||l.rotation)return l;
  if(spec.vault)return buriedVault(l,b);
  const mass=terrain.find(t=>t.id===spec.terrain&&!t.broken);if(!spec.rear&&!spec.panorama&&!mass)return l;
  const asset=clone(l.asset),vector=asset.vector,children=vector.root.children;
  if(spec.panorama){
   const sides=[[[2430,3200],[2110,3200]],[[2540,3040],[2320,3040]],[[2670,3070],[2590,3070]]];
   for(let i=0;i<3;i++)for(const [j,edge]of [-1800,9000].entries()){const [top,bottom]=sides[i][j],outer=j?bounds.right:bounds.left,dy=j?-100:140;children[i].d+=' '+pathString([{x:edge,y:top},{x:outer,y:top+dy},{x:outer,y:bottom},{x:edge,y:bottom}]);}
   asset.bounds={x:bounds.left,y:1660,w:bounds.right-bounds.left,h:1540};vector.viewBox=[asset.bounds.x,1660,asset.bounds.w,1540];return{...l,asset};
  }
  const full=spec.rear?[{x:bounds.left,y:bounds.top},{x:bounds.right,y:bounds.top},{x:bounds.right,y:bounds.bottom},{x:bounds.left,y:bounds.bottom}]:mass.vertices;
  const clipPath=new Path2D(pathString(full));
  // The record-court artwork also dresses its actual upper stone roads.
  if(b.honroStage===29)for(const t of terrain)if(t!==mass&&!t.broken&&t.mat!=='wood')clipPath.addPath(new Path2D(pathString(t.vertices)));
  if(!spec.detail)children[0]={...children[0],d:pathString(full)};
  if(spec.deep===7000){const key='domain-deep-base';vector.gradients[key]={type:'linear',x1:0,y1:7000,x2:0,y2:13200,stops:[{offset:0,color:children[0].fill,opacity:1},{offset:1,color:'#14272b',opacity:1}]};children[0].fill='url(#'+key+')';}
  for(let i=spec.detail?0:1;i<children.length;i++){
   const node=children[i],ps=paintPolygon(node.d);if(!ps){
    // One broad curved soil bed reaches Stage21's eastern contour. Continue
    // its terminal face without flattening or stretching its approved curve.
    if(b.honroStage===21&&node.fill==='#314d41'){
     const edge=b.width,strip=[{x:edge-1,y:2860},{x:edge,y:2860},{x:edge,y:3200},{x:edge-1,y:3200}],continued=extend(strip,{width:b.width,height:3650,terrainBounds:bounds,metadata:{stageId:21}});
     node.d+=' '+pathString(continued);
    }
    continue;
   }
   if(spec.rear){
    // The shaft's broad rear rock wash continues out of the authored building
    // footprint. Its inner throat, arch voids, posts and waterline stay local.
    if((b.honroStage===25&&[1,2,6].includes(i))||(b.honroStage===27&&i===1)){
     const xs=ps.map(p=>p.x),ys=ps.map(p=>p.y),left=Math.min(...xs),right=Math.max(...xs),bottom=Math.max(...ys);
     for(const p of ps){if(p.x===left&&left===-300)p.x=bounds.left;if(p.x===right&&right>5000)p.x=bounds.right;if(p.y===bottom)p.y=bounds.bottom;}
     node.d=pathString(ps);
    }
    continue;
   }
   // Extend only strata which actually cross a material/domain edge. Local
   // outcrops, masonry blocks and all architectural openings stay authored.
   if(spec.deep===7000){for(const p of ps)if(p.y>=7000-EPS)p.y=bounds.bottom;}
   const field=spec.deep===7000&&i>=2&&i<=4,origin=field?-2000:0,width=field&&i<4?11200:b.width-origin;
   const shifted=ps.map(p=>({x:p.x-origin,y:p.y})),next=extend(shifted,{width,height:spec.deep||b.height,terrainBounds:{...bounds,left:bounds.left-origin,right:bounds.right-origin},metadata:{stageId:b.honroStage}}).map(p=>({x:p.x+origin,y:p.y}));
   if(JSON.stringify(next)!==JSON.stringify(ps)||spec.deep===7000)node.d=pathString(next);
   if(spec.deep===7000&&i<=3&&/^#[0-9a-f]{6}$/i.test(node.fill)){
    const key='domain-deep-'+i;vector.gradients[key]={type:'linear',x1:0,y1:7000,x2:0,y2:13200,stops:[{offset:0,color:node.fill,opacity:1},{offset:1,color:'#14272b',opacity:1}]};node.fill='url(#'+key+')';
   }
  }
  // Preserve every old gradient sample, then gently bury the same material
  // into deeper shadow. The field never restarts at a polygon or play edge.
  for(const [name,gradient] of Object.entries(vector.gradients||{}))if(!name.startsWith('domain-deep-')&&!spec.rear&&gradient.type==='linear'&&gradient.x1===gradient.x2&&gradient.y2>gradient.y1){
   const start=gradient.y1,end=gradient.y2,deep=end+5200;
   gradient.stops=gradient.stops.map(s=>({...s,offset:s.offset*(end-start)/(deep-start)}));
   gradient.stops.push({offset:1,color:b.honroStage===21?'#192f2b':'#14272b',opacity:1});gradient.y2=deep;
  }
  asset.bounds={x:bounds.left,y:bounds.top,w:bounds.right-bounds.left,h:bounds.bottom-bounds.top};vector.viewBox=[asset.bounds.x,asset.bounds.y,asset.bounds.w,asset.bounds.h];
  return{...l,asset,honroTerrainMaterialClip:clipPath};
 });
 materialViews.set(b,{source,terrain,version:b.sceneVersion,landmarks});return landmarks;
}
// Visual water coverage is independent of the conductive/contact polygon.
// The same pool surface continues outside the stable simulation rectangle;
// its old bottom is a color/depth sample, never a visible rectangular edge.
const waterViews=new WeakMap();
function materialWaterZone(b,z){
 if(!active(b)||b.honroCustom||![25,27].includes(b.honroStage)||z.id!=='deep-basin-water')return z;
 let views=waterViews.get(b);if(!views){views=new WeakMap();waterViews.set(b,views);}let prior=views.get(z);if(prior?.bounds===b.honroTerrainBounds)return prior.zone;
 const bounds=b.honroTerrainBounds,top=z.surface[0][1],bottom=Math.max(...z.points.map(p=>p[1]));
 const zone={...z,points:[[bounds.left,top],[bounds.right,top],[bounds.right,bounds.bottom],[bounds.left,bounds.bottom]],surface:[[bounds.left,top],[bounds.right,top]],bottom:[[bounds.left,bounds.bottom],[bounds.right,bounds.bottom]],honroWaterPaintBottom:bottom,honroWaterPaintLeft:Math.min(...z.points.map(p=>p[0])),honroWaterPaintRight:Math.max(...z.points.map(p=>p[0])),honroCarvedBasin:true};
 views.set(z,{bounds,zone});return zone;
}
G.HonroTerrainDomain={VERSION:1,render,active,author,projection,clip,extend,worldBounds,validate,materialLandmarks,materialWaterZone};
})(globalThis);
