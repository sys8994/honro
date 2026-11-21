async q=>{
'use strict';
const app=HonroApp,s=app.scene,b=app.engine.b,f=q.frame, native=s.terrainReadability;
const die=(z)=>{throw Error('Native witness: '+z)};
const insist=(v,z)=>{if(!v)die(z)};
const keyData=()=>JSON.stringify([b.terrain,b.units,b.water,b.phase,b.round,s.x,s.y,s.scale,b.honroMap?.design, b.honroMap?.initialState]);
const initial=keyData(), main=s._domainTiles, mainCache=s._staticWorldCache;
const oldStats=JSON.stringify(s.terrainReadabilityStats), opt={...s.viewOptions};
const D=HonroTerrainDomain;
insist(b.honroCanonical&&b.honroStage===21&&!b.honroCustom&&D.active(b)&&!opt.debugTerrainOutline,'ordinary Stage21 only');
insist(main?.tiles?.size>0&&typeof native==='function'&&s.scale===f.actual.scale&&s.scale<=1.05,'real published tiled render only');
const [W,H]=f.backing,m=f.viewport,z=f.actual.scale,w=f.css.w,h=f.css.h,rs=s._worldRasterScale(b,w);
const source=s.canvas.getContext('2d');
insist(source.imageSmoothingEnabled===true&&source.imageSmoothingQuality==='low','native source filter');
insist(source.canvas.width===W&&source.canvas.height===H&&f.DPR===1,'immutable device backing');
const DOM=(width,height)=>{const el=document.createElement('canvas');el.width=width;el.height=height;return el;};
const C=(c)=>c.getContext('2d');
const bytes=(c)=>c.getImageData(0,0,c.canvas.width,c.canvas.height).data;
const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const sha=async buf=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buf))).map(x=>x.toString(16).padStart(2,'0')).join('');
const h4=c=>sha(bytes(c));
function assertDest(c){
 insist(c.globalCompositeOperation==='source-over'&&c.globalAlpha===1&&c.imageSmoothingEnabled===true&&c.imageSmoothingQuality==='low',
 'native material priority/composite/filter');
}
function seed(){const c=C(DOM(W,H));c.setTransform(z,0,0,z,-m.left*z,-m.top*z);assertDest(c);return c;}
const terrain=D.render(b), ground=terrain.find(t=>t.id==='a3-foundation');
const gp=HONRO_CORE.poly(ground), pins=[[-500,2755.3125],[0,2810],[620,2810]];
insist(pins.every(([x,y])=>gp.some(p=>p.x===x&&p.y===y)),'native roof anchors');
const floor=new Path2D();gp.forEach(({x,y},i)=>i?floor.lineTo(x,y):floor.moveTo(x,y));floor.closePath();
const art=new Path2D(q.support), [X0,Y0,X1,Y1]=q.box;
const geom=HonroTerrainReadability.prepare(b), foundation=geom.groups.find(g=>g.id==='a3-foundation');
const style=HonroTerrainReadability.STYLE;
insist(foundation&&/^#[\da-f]{6}$/i.test(style.topLight),'topLight is actually opaque stroke');
const geometry=await sha(new TextEncoder().encode(JSON.stringify({
 groups:geom.groups.map(g=>[g.id,g.wood,g.bounds,g.segments]),gp,pins,
 style,sourceInkFn:String(native), camera:[s.x,s.y,s.scale], imageSmoothing:[source.imageSmoothingEnabled,source.imageSmoothingQuality]
})));
const diag=Object.create(s);
Object.assign(diag,{_domainTiles:null,_staticWorldCache:null,_screenWorldCache:null,_cacheStats:{worldBuilds:0,worldHits:0,worldBuildMs:0,domainTileBuilds:0},
 terrainReadabilityStats:null,_staticCacheBuild:false});
const tiles=[], traces=[];
const isolated={};
const stencil=C(DOM(1,1));
function collectTrace(rc, out){
 return new Proxy(rc,{
  get(t,k){
   if(k==='stroke')return (...args)=>{
    const M=t.getTransform();
    out.push([Array.from([M.a,M.b,M.c,M.d,M.e,M.f]),t.strokeStyle,t.lineWidth,t.lineJoin,t.lineCap,t.globalAlpha,t.globalCompositeOperation,t.getLineDash()]);
    return t.stroke(...args);
   };
   const v=t[k];return typeof v==='function'?v.bind(t):v;
  },
  set(t,k,v){t[k]=v;return true;}
 });
}
const geometryWitnesses=[];
diag.terrainReadability=function(c,arg,view){
 insist(arg===b&&this===diag&&this._staticCacheBuild===true,'actual scene readonly representative tile');
 assertDest(c);
 const M=c.getTransform(), W0=c.canvas.width,H0=c.canvas.height;
 insist(W0===516&&H0===516&&Math.abs(M.a-rs)<1e-7&&Math.abs(M.d-rs)<1e-7&&M.b===0&&M.c===0
  &&Math.abs(M.e-(2-view.left*rs))<1e-5&&Math.abs(M.f-(2-view.top*rs))<1e-5,'actual world tile transform/size');
 const hover={id:[Math.round(view.left*rs/512),Math.round(view.top*rs/512)].join(':'), left:view.left,top:view.top};
 const saved={
  rim:DOM(W0,H0), top:DOM(W0,H0), effect:DOM(W0,H0), expected:DOM(W0,H0)
 };
 const pre=bytes(c), ec=C(saved.expected);
 ec.drawImage(c.canvas,0,0);assertDest(ec);
 insist(equal(pre,bytes(ec)),'lossless pre-rim replay clone');
 ec.setTransform(M);native.call(diag,ec,b,view);
 native.call(diag,c,b,view);
 const after=bytes(c);
 insist(equal(bytes(ec),after),'stock source-over exact 0 per tile');
 const rc=C(saved.rim), events=[];rc.setTransform(M);
 native.call(diag,collectTrace(rc,events),b,view);
 const tc=C(saved.top);tc.setTransform(M);tc.strokeStyle=style.topLight;tc.lineJoin='round';tc.lineCap='butt';tc.lineWidth=style.topLightPixels/rs;tc.stroke(foundation.top);
 const fc=C(saved.effect);fc.setTransform(M);fc.clip(floor);fc.clip(art);fc.fillStyle='#fff';fc.fillRect(X0,Y0,X1-X0,Y1-Y0);
 traces.push([hover.id,events]);tiles.push({hover,pre:pre.buffer,after:after.buffer,replay:true});
 isolated[hover.id]=saved;
};
const observed=seed();
diag._drawTerrainDomainTiles(observed,b,w,h);
insist(tiles.length>0&&diag._domainTiles?.tiles.size>0,'no rendered stage tiles');
const cache=diag._domainTiles;
const receipts=[];
for(const x of tiles){
 const id=x.hover.id,actual=main.tiles.get(id),render=cache.tiles.get(id);
 insist(actual&&render&&actual.left===x.hover.left&&actual.top===x.hover.top,'no actual cached matching tile '+id);
 const act=bytes(C(actual.canvas)), a=new Uint8ClampedArray(x.after);
 insist(equal(act,a),'observer post-rim differs from normal cached Stage21 tile '+id);
 receipts.push({id,left:x.hover.left,top:x.hover.top,pre:await sha(x.pre),post:await sha(x.after),replayExact:x.replay,originalPublishedTileExact:true});
}
const projected={};
for(const kind of ['rim','top','effect']){
 const map=new Map();
 for(const [id,t] of cache.tiles)map.set(id,{left:t.left,top:t.top,canvas:isolated[id][kind]});
 const c=seed();
 diag._domainTiles={...cache,tiles:map};
 diag._drawTerrainDomainTiles(c,b,w,h);
 projected[kind]=c;
}
const pathCell=(col,row,t)=>{
 if(col<0||row<0||col>=516||row>=516)die('tap escaped tile');
 const id=t.hover.id, k=id+'/'+col+'/'+row;
 if(allowedCells.has(k))return allowedCells.get(k);
 let yes=false;
 const a=localEffect.get(id);
 if(a[4*(row*516+col)+3])yes=true;
 else{
  // Positive geometric membership, never pad or derive from output deltas.
  const x=t.hover.left+(col-2)/rs,y=t.hover.top+(row-2)/rs;
  let edge=false;
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){
   const i=col+di,j=row+dj;
   if(i>=0&&i<516&&j>=0&&j<516&&a[4*(j*516+i)+3])edge=true;
  }
  if(edge&&x+1/rs>X0&&x<X1&&y+1/rs>Y0&&y<Y1){
   for(let j=0;j<96&&!yes;j++)for(let i=0;i<96&&!yes;i++){
    const q=x+(i+.5)/(96*rs),r=y+(j+.5)/(96*rs);
    yes=q>X0&&q<X1&&r>Y0&&r<Y1&&stencil.isPointInPath(floor,q,r)&&stencil.isPointInPath(art,q,r);
   }
  }
 }
 allowedCells.set(k,yes); return yes;
};
const allowedCells=new Map(),localEffect=new Map(Object.entries(isolated).map(([id,v])=>[id,bytes(C(v.effect))]));
const effect=C(DOM(W,H)),PX=effect.createImageData(W,H),size=512/rs;
const ix=(p,j,L)=>{const n=Math.floor(p/size);
 return [n-1,n,n+1].find(i=>j>=Math.round((size*i-L)*z)&&j<Math.round((size*(i+1)-L)*z));};
const byID=new Map(tiles.map(t=>[t.hover.id,t]));
for(let sy=0;sy<H;sy++){
 const y=m.top+(sy+.5)/z;
 if(y<Y0-2/rs||y>Y1+2/rs)continue;
 const ty=ix(y,sy,m.top);
 for(let sx=0;sx<W;sx++){
  const x=m.left+(sx+.5)/z;
  if(x<X0-2/rs||x>X1+2/rs)continue;
  const tx=ix(x,sx,m.left),t=byID.get(tx+':'+ty);if(!t)continue;
  const u=(x-t.hover.left)*rs+1.5,v=(y-t.hover.top)*rs+1.5,a=Math.floor(u),b0=Math.floor(v);
  let yes=false;
  for(let j=0;j<2&&!yes;j++)for(let i=0;i<2&&!yes;i++){
   const weight=(i?u-a:1-u+a)*(j?v-b0:1-v+b0);
   if(weight>0)yes=pathCell(a+i,b0+j,t);
  }
  if(yes){const n=(sy*W+sx)*4;PX.data.fill(255,n,n+4);}
 }
}
effect.putImageData(PX,0,0);
const out={
 geometry,strokeTrace:await sha(new TextEncoder().encode(JSON.stringify(traces))),
 worldRaster:rs,explicitNativeSourceFilter:'low-linear',readbackUnchanged:true,
 priority:'native signed art before original rim; isolated pre→post reconstructs real cache tile exact',
 pose:[s.x,s.y,s.scale], tileReceipts:receipts,
 pngs:{geometricSupport:effect.canvas.toDataURL('image/png'),nativeRim:projected.rim.canvas.toDataURL('image/png'),topLight:projected.top.canvas.toDataURL('image/png')}
};
insist(initial===keyData()&&s._domainTiles===main&&s._staticWorldCache===mainCache&&JSON.stringify(s.terrainReadabilityStats)===oldStats,'scene/battle touched');
return out;
}
