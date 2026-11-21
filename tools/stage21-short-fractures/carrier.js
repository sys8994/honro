
(function(G){'use strict';
const S=G.HonroScene.prototype,draw=S.landmark,paths=new WeakMap();
const D=G.HonroTerrainDomain,landmarks=D.materialLandmarks,viewCache=new WeakMap();
const LOCK21={"version":1,"baseline":"71fb443675aed659a572b722a4337212e9d2f910","box":[-380,2813,120,3220],"atlas":[288,1056,2,2750],"branchBox":[-170,2945,6,3066],"FTransform":[2.857142857142857,0.1465437788018433,0,2.65,0,1447.9],"support":"M-321 2880 Q-283 2844 -200 2841 L-116 2828 -57 2822 0 2813 18 2820 37 2841 69 2859 83 2890 104 2911 100 2930 107 2950 116 2975 105 2991 95 3005 112 3032 105 3060 113 3081 102 3102 115 3127 96 3150 115 3173 90 3190 61 3202 0 3210 -50 3185 -116 3189 -165 3162 -244 3154 -298 3117 -338 3088 -356 3024 -377 2975 -358 2934Z","B31":{"old":"M60 3060 Q700 2980 1150 3115 T2340 3110 L2590 3200 H0Z","material":"M120.000000000000 3052.926178685207 Q721.242599173142 2986.372779751943 1150 3115 Q1600 3250 2340 3110 L2590 3200 H120 L92 3194 67 3189 45 3191 14 3180 -21 3184 -50 3173 -78 3174 -103 3161 -135 3161 -160 3149 -191 3147 -207 3132 -173 3137 -142 3117 -113 3120 -83 3095 -50 3096 -18 3073 12 3075 38 3063 70 3065 Z"},"branches":[{"id":"upper-split-return","fill":"#473b2d","d":"M4 2964 L-12 2966 -29 2973 -47 2967 -64 2968 -74 2963 -94 2962 -104 2952 -85 2951 -67 2955 -52 2954 -34 2960 -19 2959 2 2962Z"},{"id":"upper-short-rock-face","fill":"#504636","d":"M4 2975 L-12 2976 -29 2973 -46 2979 -63 2974 -55 2971 -38 2970 -27 2968 -13 2969 4 2971Z"},{"id":"lower-recess-unequal-return","fill":"#473b2d","d":"M4 2994 L-16 2993 -35 3001 -62 3004 -75 3018 -97 3024 -110 3035 -130 3042 -145 3055 -163 3057 -151 3063 -136 3059 -129 3051 -108 3050 -94 3037 -76 3034 -65 3027 -55 3029 -43 3018 -26 3023 -10 3015 4 3025Z"},{"id":"low-fracture-inner-facet","fill":"#504636","d":"M4 3000 L-18 3002 -31 3009 -47 3011 -57 3018 -74 3022 -82 3030 -97 3033 -104 3040 -90 3039 -74 3031 -60 3031 -50 3022 -41 3022 -26 3016 -12 3016 4 3013Z"},{"id":"lower-short-native-chip","fill":"#545044","d":"M-46 3011 L-33 3008 -19 3002 -8 3004 -21 3009 -32 3016 -45 3017Z"}],"witnessReceipt":"9f04c376f0415cddfc244dda38c069a27288d5a51dcf3a586676ffd397e13eb1"};
/* Embedded only in a detached Stage21 QA source. No output images read from disk. */
function prepWest21(l,floor,base,recipe){
 if(recipe===undefined||JSON.stringify(recipe)!==JSON.stringify(LOCK21))return null;
 const matches=base.filter(v=>v.asset?.id==='eup21:foundations');
 if(matches.length!==1)return null;
 const entry=matches[0],v=entry.asset.vector;
 if(entry.layer!=='front'||entry.depthLayer!=='L1'||entry.x!==0||entry.y!==0||entry.scale!==1||entry.rotation!==0||
    entry.id!=='foundations'||!entry.honroTerrainMaterialClip||v.root.children.length!==34||
    v.root.children[31]?.d!==LOCK21.B31.old||v.root.children[31]?.fill!=='#334e42'||
    l.asset.id!=='act3-handoff:21:bedrock'||l.x!==0||l.y!==0||l.scale!==1||l.asset.params.blendFace||
    l.asset.bounds.x!==0||l.asset.bounds.w!==6400||l.asset.collision.length!==0||
    floor.id!=='a3-foundation'||floor.broken)return null;
 const r=G.HONRO_CORE.poly(floor);
 if(![[-500,2755.3125],[0,2810],[620,2810]].every(([x,y])=>r.some(p=>p.x===x&&p.y===y))||
    r.some(p=>p.x>=-500&&p.x<=120&&p.y>=2755&&p.y<=3220&&
             p.y!==2810+Math.min(p.x,0)*54.6875/500))return null;
 const newNodes=v.root.children.slice();
 newNodes[31]={...newNodes[31],d:recipe.B31.material};
 const clone={...entry,asset:{...entry.asset,vector:{...v,root:{...v.root,children:newNodes}}}};
 const layer={...l,asset:{...l.asset,bounds:{...l.asset.bounds,x:recipe.box[0],w:6400-recipe.box[0]}}};
 const support=new Path2D(recipe.support);
 const outside=new Path2D('M-25000 -25000H30000V30000H-25000Z');outside.addPath(support);
 const branches=recipe.branches.map(({fill,d})=>({fill,path:new Path2D(d)}));
 // Fail early using the normal vector validator. No B/F partial enable on invalid config.
 G.HonroVectorArt.prepare(clone.asset.vector);
 G.HonroVectorArt.prepare(l.asset.vector);
 return {layer,clone,entry,support,outside,branches,owner:l.asset};
}
function flowMaterialWest21(raw,pair){
 const spec=LOCK21,[X0,Y0,X1,Y1]=spec.box,m=raw.getTransform();
 if(![m.a,m.b,m.c,m.d,m.e,m.f].every(Number.isFinite)||m.a<=0||m.a!==m.d||m.b!==0||m.c!==0)return false;
 if(X1 < -m.e/m.a || X0 > (raw.canvas.width-m.e)/m.a ||
    Y1 < -m.f/m.d || Y0 > (raw.canvas.height-m.f)/m.d)return true;
 const scratch=[];
 const cv=(w,h)=>{const a=document.createElement('canvas');a.width=w;a.height=h;scratch.push(a);return a;};
 // A single local material calculation in existing world tile builds, no persistent added cache.
 // Native raster math is evaluated in global world dimensions, independent of PC/M pan/tile-local origins.
 try{
 const [fw,fh,gr,oy]=spec.atlas;
 const atlas=cv(fw,fh),ac=atlas.getContext('2d',{alpha:true,willReadFrequently:true});
 ac.setTransform(gr,0,0,gr,0,-oy*gr);ac.transform(...spec.FTransform);
 G.HonroVectorArt.draw(ac,pair.owner,{x:0,y:0});
 const fleaf=ac.getImageData(0,0,fw,fh).data;
 const [l,t,r,b]=spec.branchBox;
 const aw=(r-l)*gr,ah=(b-t)*gr,leaf=cv(aw,ah),lc=leaf.getContext('2d',{alpha:true,willReadFrequently:true});
 lc.setTransform(gr,0,0,gr,-l*gr,-t*gr);
 for(const n of pair.branches){lc.fillStyle=n.fill;lc.fill(n.path);}
 const detail=lc.getImageData(0,0,aw,ah).data;
 const density=Math.max(.05,Math.min(.75,m.a));
 const sw=Math.ceil((X1-X0)*density),sh=Math.ceil((Y1-Y0)*density);
 const photo=cv(sw,sh),pc=photo.getContext('2d',{alpha:true});
 const dst=pc.createImageData(sw,sh);
 const clamp=(v,l=0,r=1)=>Math.min(r,Math.max(l,v));
 const smooth=(v,a,b)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
 const RGB=(d,w,h,x,y,spill=false)=>{
  if(spill&&(x<-.5||y<-.5||x>w-.5||y>h-.5))return [0,0,0,0];
  x=clamp(x,0,w-1);y=clamp(y,0,h-1);
  const u=Math.floor(x),v=Math.floor(y),i=u*4+v*w*4,j=Math.min(w-1,u+1)*4+v*w*4,k=u*4+Math.min(h-1,v+1)*w*4,o=Math.min(w-1,u+1)*4+Math.min(h-1,v+1)*w*4;
  const a=x-u,b=y-v;
  return [0,1,2,3].map(n=>((1-a)*d[i+n]+a*d[j+n])*(1-b)+((1-a)*d[k+n]+a*d[o+n])*b);
 };
 for(let iy=0;iy<sh;iy++)for(let ix=0;ix<sw;ix++){
   const x=X0+(ix+.5)*(X1-X0)/sw,y=Y0+(iy+.5)*(Y1-Y0)/sh,i=(iy*sw+ix)*4;
   const w=Math.max(0,1-(x+380)/480);
   const xx=x>=100?x:100*Math.max(0,(x+380)/480)**4.8;
   const yy=y-40*w*w*smooth(y,2850,2948)*(1-smooth(y,3030,3162));
   const f=RGB(fleaf,fw,fh,xx*gr-.5,(yy-oy)*gr-.5);
   const inBand=yy>=2957&&yy<=3033&&xx<=36&&x<0;
   if(x<0&&(inBand||x>=l&&x<=r&&y>=t&&y<=b)){
    const p=RGB(detail,aw,ah,(x-l)*gr-.5,(y-t)*gr-.5,true);
    const k=p[3]/255, z=1-smooth(x,-16,0);
    if(k>0||inBand)for(let n=0;n<3;n++){
     const host=inBand?[53,50,40][n]:f[n];
     f[n]+=((host*(1-k)+p[n]*k)-f[n])*z;
    }
   }
   const terrain=smooth(x,-370,88)*(1-.16*smooth(y,3050,3150)*(1-smooth(x,-50,80)));
   for(let n=0;n<3;n++)dst.data[i+n]=Math.round(f[n]);
   dst.data[i+3]=Math.round(f[3]*terrain);
 }
 pc.putImageData(dst,0,0);
 // Retain original F/B programs globally; inside this signed support
 // their full material stack is re-composed from the real B clone + native F.
 const block=cv(sw,sh), bc=block.getContext('2d',{alpha:true});
 bc.setTransform(sw/(X1-X0),0,0,sh/(Y1-Y0),-X0*sw/(X1-X0),-Y0*sh/(Y1-Y0));
 const Bpaint=G.HonroVisualStyle.context(bc,'L1',G.HonroEnvironment.act3Palette({honroStage:21},'earth'));
 G.HonroVectorArt.draw(Bpaint,pair.clone.asset,{x:0,y:0});
 bc.setTransform(1,0,0,1,0,0);
 bc.drawImage(photo,0,0);
 raw.drawImage(block,X0,Y0,X1-X0,Y1-Y0);
 return true;
 }finally{for(const a of scratch){a.width=1;a.height=1;}}
}

const flowRows=new WeakMap();

function support(b,asset){
 const id=asset.params.terrainId||'a3-foundation';
 return D.render(b).find(t=>t.id===id&&!t.broken)||b.terrain.find(t=>t.id===id&&!t.broken);
}

D.materialLandmarks=function(b){
 const base=landmarks(b);
 if(b.honroCustom||!b.honroCanonical||b.honroStage<21||b.honroStage>30)return base;
 const project=G.HONRO_PROJECT,artId=project?.stages.find(s=>s.metadata?.stageId===b.honroStage)?.design?.act3HandoffArt;
 if(!artId)return base;
 const old=viewCache.get(b);
 if(old?.base===base&&old.artId===artId)return old.result;
 const asset=project.library.find(a=>a.id===artId);
 if(!asset)return base;
 const floor=support(b,asset);
 if(!floor)return base;
 const vertices=G.HONRO_CORE.poly(floor);
 if(!asset.params.contactMapping.every(([, ,x,y])=>vertices.some(p=>Math.abs(p.x-x)<.01&&Math.abs(p.y-y)<.01)))return base;
 // Resolve art from the loaded chapter, never serialize it in a battle.
 const placement={id:artId,kind:'canonical-element',asset,x:0,y:0,scale:1,layer:'front',depthLayer:'L1'};
 // Include the west paint in tile culling, without changing the authored asset or support.
 if(b.honroStage===26&&artId==='act3-handoff:26:kiln-foundation'&&asset.id===artId&&
    floor.id==='a3-foundation'&&asset.params.westBedMaterial&&asset.bounds?.x===0&&asset.bounds.w===7000){
  placement.asset={...asset,bounds:{...asset.bounds,x:-1480,w:8480}};
 }
 let nearWest=null;
 if(b.honroStage===21&&asset.id==='act3-handoff:21:bedrock'){
  if(asset.params.stage21FlowSource!==undefined)throw Error('Stage21 diagnostic cannot supplement edited authored data');
  nearWest=prepWest21(placement,floor,base,LOCK21);
  if(!nearWest)throw Error('Stage21 signed F/B native owner mismatch');
  flowRows.set(nearWest.layer,nearWest);
 }
 const result=nearWest?[...base.filter(l=>l.asset?.id!==artId),nearWest.layer]:
   [...base.filter(l=>l.asset?.id!==artId),placement];
 viewCache.set(b,{base,artId,result});return result;
};

function strips(asset){
 let rows=paths.get(asset);if(rows)return rows;
 const map=asset.params.contactMapping,verticalScale=asset.params.verticalScale??2.65;
 rows=map.slice(1).map(([u1,v1,x1,y1],i)=>{
  const [u0,v0,x0,y0]=map[i],sx=(x1-x0)/(u1-u0);
  // Align the traced face to two consecutive road points. Adjacent strips
  // agree at every height on their shared edge and retain the original fill.
  const slope=((y1-y0)-(v1-v0)*verticalScale)/(u1-u0);
  return {x0,x1,y0,y1,u0,u1,v0,v1,tiles:new Map(),matrix:[sx,slope,0,verticalScale,x0-sx*u0,y0-slope*u0-v0*verticalScale]};
 });
 paths.set(asset,rows);return rows;
}
// Isolate each painted section so its transparent edge reveals the native
// cliff. Cache the resolved vector at two display densities, independent of pan.
function faceTile(asset,row,density){
 if(row.tiles.has(density))return row.tiles.get(density);
 const {x0,x1,y0,y1,u0,u1,v0,v1,matrix}=row;
 const [,sourceY,,sourceHeight]=asset.params.sourceViewBox;
 const bottom=sourceY+sourceHeight;
 const top=Math.floor(Math.min(y0,y1))-2;
 const height=Math.ceil(Math.max(y0,y1)-top+(bottom-Math.min(v0,v1))*matrix[3])+2;
 const canvas=document.createElement('canvas');
 canvas.width=Math.ceil((x1-x0)*density);canvas.height=Math.ceil(height*density);
 const ctx=canvas.getContext('2d');
 const sx=canvas.width/(x1-x0),sy=canvas.height/height;
 ctx.setTransform(sx,0,0,sy,-x0*sx,-top*sy);
 ctx.transform(...matrix);
 G.HonroVectorArt.draw(ctx,asset,{x:0,y:0});
 ctx.globalCompositeOperation='destination-in';
 const fade=ctx.createLinearGradient(0,bottom-33,0,bottom-2);
 fade.addColorStop(0,'#000');fade.addColorStop(1,'#0000');
 ctx.fillStyle=fade;ctx.fillRect(u0,-2000,u1-u0,bottom+2100);
 if(asset.params.edgeFade){
  ctx.setTransform(sx,0,0,sy,-x0*sx,-top*sy);
  const [left,right]=asset.params.edgeFade;
  if(right&&x1>right[0]){
   const gradient=ctx.createLinearGradient(right[0],0,right[1],0);
   gradient.addColorStop(0,'#000');gradient.addColorStop(1,'#0000');
   ctx.fillStyle=gradient;ctx.fillRect(x0,top,x1-x0,height);
  }
  if(left&&x0<left[1]){
   const gradient=ctx.createLinearGradient(left[0],0,left[1],0);
   gradient.addColorStop(0,'#0000');gradient.addColorStop(1,'#000');
   ctx.fillStyle=gradient;ctx.fillRect(x0,top,x1-x0,height);
  }
 }
 const tile={canvas,top,height};row.tiles.set(density,tile);return tile;
}

S.landmark=function(c,l){
 if(!l.asset?.id?.startsWith('act3-handoff:')||!l.asset.params?.contactMapping)return draw.call(this,c,l);
 const b=this.battle,asset=l.asset,floor=b&&support(b,asset);
 if(!floor)return;
 const raw=G.HonroVisualStyle.raw(c),rows=strips(l.asset),m=raw.getTransform();
 raw.save();
 const ps=G.HONRO_CORE.poly(floor);raw.beginPath();ps.forEach(({x,y},i)=>i?raw.lineTo(x,y):raw.moveTo(x,y));raw.closePath();raw.clip();
 // Only this native Stage 26 foundation owns the west interior paint.
 const west=asset.params.westBedMaterial;
 if(west&&b.honroStage===26&&b.honroCanonical&&!b.honroCustom&&asset.id==='act3-handoff:26:kiln-foundation'&&
    l.id===asset.id&&l.kind==='canonical-element'&&floor.id==='a3-foundation'&&l.x===0&&l.y===0&&l.scale===1){
  raw.save();
  try{
   raw.clip(new Path2D(west.clipPath),west.clipRule);
   for(const {path,gradient,stops} of west.paints){
    const paint=raw.createLinearGradient(...gradient);
    for(const [at,color] of stops)paint.addColorStop(at,color);
    raw.fillStyle=paint;
    raw.fill(new Path2D(path));
   }
  }finally{raw.restore();}
 }
 const flow=flowRows.get(l);
 if(flow){
  const paintStock=()=>{
   const leftEdge=-m.e/m.a,rightEdge=(raw.canvas.width-m.e)/m.a;
   const snap=x=>(Math.round(x*m.a+m.e)-m.e)/m.a;
   for(const row of rows){
    const {x0,x1,matrix}=row;
    if(x1<leftEdge||x0>rightEdge)continue;
    const left=snap(x0),right=snap(x1);if(right<=left)continue;
    raw.save();try{
     raw.beginPath();raw.rect(left,0,right-left,b.height+1600);raw.clip();raw.transform(...matrix);
     G.HonroVectorArt.draw(raw,flow.owner,{x:0,y:0});
    }finally{raw.restore();}
   }
  };
  try{
   paintStock();
   raw.save();try{
    raw.clip(flow.support);
    if(!flowMaterialWest21(raw,flow))throw Error('Stage21 native F world raster transform unsupported');
   }finally{raw.restore();}
  }finally{raw.restore();}
  return;
 }
 const minX=-m.e/m.a,maxX=(raw.canvas.width-m.e)/m.a;
 const px=x=>(Math.round(x*m.a+m.e)-m.e)/m.a;
 for(const row of rows){
  const {x0,x1,matrix}=row;
  if(x1<minX||x0>maxX)continue;
  const left=px(x0),right=px(x1);
  if(right<=left)continue;
  if(asset.params.blendFace){
   const tile=faceTile(asset,row,m.a>1?1.15:.72);
   raw.drawImage(tile.canvas,left,tile.top,right-left,tile.height);
   continue;
  }
  raw.save();raw.beginPath();raw.rect(left,0,right-left,b.height+1600);raw.clip();raw.transform(...matrix);
  G.HonroVectorArt.draw(raw,l.asset,{x:0,y:0});raw.restore();
 }
 raw.restore();
};
})(globalThis);
