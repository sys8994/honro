(function(G){'use strict';
const C=G.HONRO_CORE,clamp=C.clamp;
function seedHash(v){let h=2166136261>>>0;for(const ch of String(v)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function seeded(v){let s=seedHash(v)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};}
function irregularRock(id,terrain,opt={}){
 const x=opt.x,w=opt.w||120,h=opt.h||90,support=opt.support,ref=opt.reference,base=surfaceY(terrain,x,ref,support);if(!base)throw Error(`No rock support ${id}@${x}`);
 const r=seeded(`${opt.seed??id}:${x}`),n=Math.max(10,opt.nodes||18),embed=opt.embed??.28,rx=w*.5,ry=h*.5,cx=x,cy=base.y+(embed-.5)*h,pts=[];
 for(let i=0;i<n;i++){const a=i*Math.PI*2/n,rad=.82+r()*.28,skew=1+(r()-.5)*.16;pts.push([cx+Math.cos(a)*rx*rad,cy+Math.sin(a)*ry*rad*skew]);}
 return solid(id,pts,{...opt,mat:opt.mat||'rock',surfaceKind:opt.surfaceKind||'boulder',indestructible:opt.indestructible??true,route:false});
}
function compileScatters(spec,terrain){const out=[];for(const [si,s] of (spec.scatters||[]).entries()){
 const r=seeded(`${spec.seed??0}:${s.seed??si}:${s.support||''}`),count=s.count||0,minGap=s.minGap||90,placed=[];let guard=0;
 while(placed.length<count&&guard++<count*40){const x=s.x1+r()*(s.x2-s.x1);if((s.avoid||[]).some(([a,b])=>x>=a&&x<=b)||placed.some(q=>Math.abs(q-x)<minGap))continue;const hit=surfaceY(terrain,x,s.reference,s.support);if(!hit)continue;placed.push(x);const kinds=s.kinds||[s.kind||'fernPatch'],kind=kinds[Math.floor(r()*kinds.length)%kinds.length],size=(s.minSize??.7)+r()*((s.maxSize??1.4)-(s.minSize??.7));out.push({kind,x,y:hit.y+(s.dy||0),size:+size.toFixed(3),layer:s.layer||'back',support:s.support,seed:seedHash(`${s.seed??si}:${placed.length}:${kind}`),scatter:true});}
 }return out;}

function solid(id,points,opt={}){let v=C.canonicalPolygon(points.map(([x,y])=>({x,y})));const xs=v.map(p=>p.x),ys=v.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys),hp=opt.indestructible?99999:(opt.hp??(opt.mat==='wood'?360:99999));return{id,x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y,vertices:v,mat:opt.mat||'rock',hp,maxHp:hp,route:opt.route??true,indestructible:!!opt.indestructible,oneWay:!!opt.oneWay,surfaceKind:opt.surfaceKind||opt.mat||'rock',device:opt.device,link:opt.link,honroSeal:opt.honroSeal,honroBlocker:opt.honroBlocker,artSeed:opt.artSeed||1};}
function ground(id,top,floor,opt={}){return solid(id,[...top,[top.at(-1)[0],floor],[top[0][0],floor]],{...opt,indestructible:opt.indestructible??true});}
function ribbon(id,top,thickness,opt={}){let bottom;if(opt.organic){const r=seeded(`${opt.seed??id}:ribbon`),n=top.length;bottom=top.slice().reverse().map(([x,y],ri)=>{const i=n-1-ri,t=n<=1?0:i/(n-1),edge=.18+.82*Math.sin(Math.PI*t),depth=Math.max(12,thickness*edge*(.80+r()*.34));return[x+(r()-.5)*8,y+depth];});}else bottom=top.slice().reverse().map(([x,y])=>[x,y+thickness]);return solid(id,[...top,...bottom],{...opt,indestructible:opt.indestructible??true});}
function branch(id,path,width,opt={}){
 const widths=Array.isArray(width)?width:path.map((_,i)=>width*(1-i/(path.length-1)*.42)),upper=[],lower=[];
 for(let i=0;i<path.length;i++){
  const p=path[i],a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],n=Math.hypot(dx,dy)||1,ux=dy/n,uy=-dx/n,w=(widths[i]??width)*.5;
  upper.push([p[0]+ux*w,p[1]+uy*w]);lower.push([p[0]-ux*w,p[1]-uy*w]);
 }
 return solid(id,[...upper,...lower.reverse()],{...opt,mat:opt.mat||'wood',surfaceKind:opt.surfaceKind||'branch',indestructible:opt.indestructible??false,route:false,oneWay:opt.oneWay??true,hp:opt.hp??420});
}
function surfaceY(terrain,x,reference,support){let hits=[];for(const t of terrain){if(t.broken||support&&t.id!==support||x<t.x-1e-6||x>t.x+t.w+1e-6)continue;for(const h of C.terrainSurfaces(t,x)){if(Math.abs(h.slope)>1.35)continue;hits.push({t,y:h.y,d:reference===undefined?h.y:Math.abs(h.y-reference)});}}if(!hits.length)return null;return(reference===undefined?hits.sort((a,b)=>a.y-b.y):hits.sort((a,b)=>a.d-b.d))[0];}
function sampleSupport(terrain,support,x1,x2,step=36,reference){const out=[],n=Math.max(2,Math.ceil(Math.abs(x2-x1)/Math.max(12,step)));for(let i=0;i<=n;i++){const x=x1+(x2-x1)*i/n,h=surfaceY(terrain,x,reference,support);if(!h)throw Error(`No support sample ${support||''}@${x.toFixed(1)}`);out.push([+x.toFixed(2),+h.y.toFixed(2)]);}return out;}
function compileMaterials(spec,terrain){const zones=[];
 const emit=(m,id)=>{const surface=sampleSupport(terrain,m.support,m.x1,m.x2,m.step||28,m.reference),r=seeded(`${spec.seed??0}:${m.seed??id}:mat`),baseDepth=m.depth||72,varDepth=m.depthVariance??baseDepth*.28,bottom=surface.slice().reverse().map(([x,y],i)=>[x,y+baseDepth+(r()-.5)*2*varDepth]);zones.push({...m,id,kind:m.kind||'moss-mass',points:[...surface,...bottom],surface,attached:true});};
 for(const [i,m] of (spec.materialBands||[]).entries())emit(m,m.id||`material-${i}`);
 for(const [pi,p] of (spec.materialPatches||[]).entries()){
  const r=seeded(`${spec.seed??0}:${p.seed??pi}:patch`),n=p.count||0,used=[];let guard=0;
  while(used.length<n&&guard++<n*40){const width=(p.minWidth||100)+r()*((p.maxWidth||240)-(p.minWidth||100)),cx=p.x1+width*.5+r()*Math.max(1,(p.x2-p.x1-width)),x1=Math.max(p.x1,cx-width*.5),x2=Math.min(p.x2,cx+width*.5);if(used.some(([a,b])=>!(x2<a-(p.minGap||25)||x1>b+(p.minGap||25))))continue;used.push([x1,x2]);const kinds=p.kinds||[p.kind||'moss-mass'],kind=kinds[Math.floor(r()*kinds.length)%kinds.length];emit({...p,kind,x1,x2,depth:(p.minDepth||35)+r()*((p.maxDepth||95)-(p.minDepth||35)),depthVariance:p.depthVariance??18,step:p.step||24,alpha:(p.minAlpha??.62)+r()*((p.maxAlpha??.92)-(p.minAlpha??.62))},`patch-${pi}-${used.length}`);}
 }
 for(const [i,w] of (spec.waterPools||[]).entries()){
  const bottom=sampleSupport(terrain,w.support,w.x1,w.x2,w.step||22,w.reference),surfaceY0=w.surfaceY??Math.min(bottom[0][1],bottom.at(-1)[1]),submerged=bottom.filter(([,y])=>y>=surfaceY0-1);if(submerged.length<2)continue;const x1=submerged[0][0],x2=submerged.at(-1)[0],points=[[x1,surfaceY0],[x2,surfaceY0],...submerged.slice().reverse()];zones.push({...w,id:w.id||`water-${i}`,kind:'water-pool',points,surface:[[x1,surfaceY0],[x2,surfaceY0]],bottom:submerged,attached:true});
 }
 return zones;}
function compile(stage,spec){const terrain=[],landmarks=[],anchors={},enemySpawns=[],sectors=[];for(const [i,g] of (spec.grounds||[]).entries())terrain.push(ground(g.id||`ground-${i}`,g.top,g.floor??stage.h+220,g));for(const [i,r] of (spec.ribbons||[]).entries())terrain.push(ribbon(r.id||`ribbon-${i}`,r.top,r.thickness||80,r));for(const [i,p] of (spec.solids||[]).entries())terrain.push(solid(p.id||`solid-${i}`,p.points,p));for(const [i,b] of (spec.branches||[]).entries())terrain.push(branch(b.id||`branch-${i}`,b.path,b.width||80,b));for(const [i,q] of (spec.boulders||[]).entries())terrain.push(irregularRock(q.id||`boulder-${i}`,terrain,q));
 const resolve=a=>{const x=a.x;let y=a.y;if(y===undefined||y==='ground'){const h=surfaceY(terrain,x,a.reference,a.support);if(!h)throw Error(`No floor for anchor ${x}`);y=h.y+(a.dy||0);}return{x,y};};
 for(const [k,a] of Object.entries(spec.anchors||{}))anchors[k]={...a,...resolve(a)};
 for(const l of compileScatters(spec,terrain))landmarks.push(l);
 for(const [i,l] of (spec.landmarks||[]).entries()){const a=l.anchor?anchors[l.anchor]:resolve(l);landmarks.push({...l,id:l.id||`landmark-${i}`,x:a.x+(l.dx||0),y:a.y+(l.dy||0),layer:l.layer||'back',size:l.size||1});}
 for(const [i,s] of (spec.sectors||[]).entries()){const a=s.anchor?anchors[s.anchor]:resolve(s);sectors.push({id:s.id||`sector-${i}`,label:s.label,x:a.x,y:a.y});}
 for(const [ci,c] of (spec.encounters||[]).entries()){const a=anchors[c.anchor]||resolve(c);for(const [mi,m] of c.members.entries()){const x=a.x+(m.dx||0),flying=['bat','crow','lantern'].includes(m.kind);let y;if(flying)y=a.y+(m.dy??-220);else{const h=surfaceY(terrain,x,m.reference??a.y,m.support||c.support);if(!h)throw Error(`No enemy floor ${stage.id}/${c.id}/${mi}`);y=h.y;}enemySpawns.push({kind:m.kind,x,y,absolute:true,cluster:c.id,role:m.role||'guard',reason:c.reason||'',tactical:c.tactical||'',group:ci+1});}}
 const generated=compileMaterials(spec,terrain),manual=(spec.surfaceZones||[]).map((z,i)=>({...z,id:z.id||`surface-${i}`})),surfaceZones=[...generated,...manual];
 return{terrain,landmarks,anchors,enemySpawns,sectors,surfaceZones,design:spec.design||{},backdrop:spec.backdrop||{},routes:spec.routes||[],revision:20,detailStats:{groundTop:(spec.grounds||[]).reduce((n,g)=>n+(g.top?.length||0),0),ribbonTop:(spec.ribbons||[]).reduce((n,r)=>n+(r.top?.length||0),0),branchNodes:(spec.branches||[]).reduce((n,q)=>n+(q.path?.length||0),0),solidNodes:(spec.solids||[]).reduce((n,q)=>n+(q.points?.length||0),0)+(spec.boulders||[]).reduce((n,q)=>n+(q.nodes||18),0),surfaceNodes:surfaceZones.reduce((n,z)=>n+(z.points?.length||0),0),scatterCount:landmarks.filter(l=>l.scatter).length}};}
G.HonroMapEngine={solid,ground,ribbon,branch,irregularRock,surfaceY,sampleSupport,compile};
})(globalThis);
