(function(G){'use strict';
const C=G.HONRO_CORE,M=G.HonroMapEngine,cache=new WeakMap();
const clone=x=>JSON.parse(JSON.stringify(x));
const seeded=s=>{let x=(s|0)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};};
function distance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,n=dx*dx+dy*dy,t=n?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/n)):0;return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);}
function simplify(points,epsilon=0){if(!epsilon||points.length<=2)return points.map(p=>({...p}));let max=0,index=-1;for(let i=1;i<points.length-1;i++){const d=distance(points[i],points[0],points.at(-1));if(d>max){max=d;index=i;}}if(max<=epsilon)return[{...points[0]},{...points.at(-1)}];return[...simplify(points.slice(0,index+1),epsilon).slice(0,-1),...simplify(points.slice(index),epsilon)];}
function simplifyClosed(points,epsilon=0){if(!epsilon||points.length<=3)return points.map(p=>({...p}));let pivot=1,max=0;for(let i=1;i<points.length;i++){const d=Math.hypot(points[0].x-points[i].x,points[0].y-points[i].y);if(d>max){max=d;pivot=i;}}const out=[...simplify(points.slice(0,pivot+1),epsilon).slice(0,-1),...simplify([...points.slice(pivot),points[0]],epsilon).slice(0,-1)];return out.length>=3?out:points.map(p=>({...p}));}
function derive(t){
 if(t.type==='solid')return t.points||[];
 const c=[...(t.control||[])].sort((a,b)=>a.x-b.x);if(c.length<2)return c;
 if(t.detail?.interpolation==='linear'&&!t.detail?.roughness&&!t.detail?.optimizeEpsilon)return c;
 const spacing=Math.max(6,t.detail?.spacing||24),rough=t.detail?.roughness||0,eps=Math.max(0,+t.detail?.optimizeEpsilon||0);
 const sig=JSON.stringify([c,t.detail]);if(cache.get(t)?.sig===sig)return cache.get(t).points;
 const r=seeded(t.detail?.seed||1),raw=[];
 for(let i=0;i<c.length-1;i++){const a=c[i],b=c[i+1],n=Math.max(1,Math.ceil(Math.abs(b.x-a.x)/spacing));for(let k=0;k<n;k++){const u=k/n,sm=t.detail?.interpolation==='linear'?u:u*u*(3-2*u),micro=(r()*2-1)*rough*Math.sin(Math.PI*u)+Math.sin((a.x+k*37)*.017)*rough*.26;raw.push({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*sm+micro});}}
 raw.push({...c.at(-1)});const points=eps?simplify(raw,eps):raw;cache.set(t,{sig,points});return points;
}
// The explicit platform authoring tool defaults to one-way; solid polygons
// and every explicit false keep full collision, regardless of shape/material.
const oneWay=t=>t.oneWay===undefined?t.type==='platform':t.oneWay===true;
function terrain(t,height=3200,world=false){
 if(!world&&t.playProjection)t=G.HonroTerrainDomain.projection(t);
 const pts=derive(t).map(p=>[p.x,p.y]),opt={...(t.properties||{}),mat:t.baseMaterial||t.properties?.mat||'rock',oneWay:oneWay(t),indestructible:!t.breakable};
 if(opt.mat==='soil')opt.mat='earth';
 const out=t.type==='ground'?M.ground(t.id,pts,t.floor??height+180,opt):t.type==='platform'?M.ribbon(t.id,pts,t.thickness??80,opt):M.solid(t.id,pts,opt);
 // Carry gameplay flags that are not geometry. No coordinate quantization occurs.
 Object.assign(out,t.properties||{});out.mat=opt.mat;out.oneWay=opt.oneWay;out.indestructible=opt.indestructible;
 return out;
}
function surfaces(t,x,height){return C.terrainSurfaces(terrain(t,height),x).filter(h=>Math.abs(h.slope)<=1.35).map(h=>h.y);}
function nearest(st,x,y=Infinity){const ts=st.terrains.map(t=>terrain(t,st.height)),hit=M.surfaceY(ts,x,Number.isFinite(y)?y:undefined);return hit?{terrain:st.terrains.find(t=>t.id===hit.t.id),y:hit.y,d:Number.isFinite(y)?Math.abs(hit.y-y):hit.y}:null;}
function material(st,m,compiled){
 if(m.points)return clone(m);
 const support=m.terrainId||m.support,ts=compiled||st.terrains.map(t=>terrain(t,st.height));
 const t=ts.find(t=>t.id===support),a=Math.max(t?.x??0,Math.min(m.x1,m.x2)),b=Math.min(t?t.x+t.w:st.width,Math.max(m.x1,m.x2)),surface=[],depth=m.depth??24,n=Math.max(2,Math.ceil((b-a)/(m.step||24)));
 for(let i=0;i<=n;i++){const x=a+(b-a)*i/n,hit=M.surfaceY(ts,x,m.reference,support);if(hit)surface.push([x,hit.y]);}
 if(surface.length<2)return{...m,points:[],surface:[]};
 if(m.kind==='water'||m.kind==='shallow-water'){
  const level=m.surfaceY??Math.min(surface[0][1],surface.at(-1)[1])-depth;
  return{...m,kind:'water-pool',support,attached:true,surface:[[a,level],[b,level]],bottom:surface,points:[[a,level],[b,level],...surface.slice().reverse()]};
 }
 const kinds={grass:'grass-mass',moss:'moss-mass',rock:'exposed-rock-mass',mud:'mud-mass',scree:'scree-mass',soil:'mud-mass',charred:'charred-soil',stone:'stone-road'};
 return{...m,kind:kinds[m.kind]||m.kind,support,attached:true,surface,points:[...surface,...surface.slice().reverse().map(([x,y])=>[x,y+depth])]};
}
function transformPoint(p,asset,inst){const z=inst.scale??1,a=inst.rotation||0,x=(p.x-(asset.anchor?.x||0))*z,y=(p.y-(asset.anchor?.y||0))*z;return{x:inst.x+x*Math.cos(a)-y*Math.sin(a),y:inst.y+x*Math.sin(a)+y*Math.cos(a)};}
function shapes(asset,inst){return(asset.visual||[]).map(sh=>({...sh,points:(sh.points||[]).map(p=>transformPoint(p,asset,inst))}));}
function collision(asset,inst){return(asset.collision||[]).map((pts,i)=>M.solid(`${inst.id}:collision:${i}`,pts.map(p=>{const q=transformPoint(p,asset,inst);return[q.x,q.y];}),{mat:asset.material||'wood',oneWay:!!asset.oneWay,indestructible:!asset.breakable,climbable:!!asset.climbable,hp:asset.hp??360,route:false,surfaceKind:asset.material||'wood'}));}
G.HonroGeometry={derive,oneWay,terrain,surfaces,nearest,material,shapes,transformPoint,collision,simplify,simplifyClosed,seeded};
})(globalThis);
