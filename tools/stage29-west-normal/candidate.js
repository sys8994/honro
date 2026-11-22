
(function(G){'use strict';
const S=G.HonroScene.prototype,draw=S.landmark,paths=new WeakMap();
const D=G.HonroTerrainDomain,landmarks=D.materialLandmarks,viewCache=new WeakMap();
// A visual setting of the canonical Stage 21 west bedrock; never serialized in a battle.
const WEST21_MATERIAL={"version":1,"box":[-380,2813,120,3220],"atlas":[288,1056,2,2750],"branchBox":[-170,2945,6,3066],"FTransform":[2.857142857142857,0.1465437788018433,0,2.65,0,1447.9],"support":"M-321 2880 Q-283 2844 -200 2841 L-116 2828 -57 2822 0 2813 18 2820 37 2841 69 2859 83 2890 104 2911 100 2930 107 2950 116 2975 105 2991 95 3005 112 3032 105 3060 113 3081 102 3102 115 3127 96 3150 115 3173 90 3190 61 3202 0 3210 -50 3185 -116 3189 -165 3162 -244 3154 -298 3117 -338 3088 -356 3024 -377 2975 -358 2934Z","B31":{"old":"M60 3060 Q700 2980 1150 3115 T2340 3110 L2590 3200 H0Z","material":"M120.000000000000 3052.926178685207 Q721.242599173142 2986.372779751943 1150 3115 Q1600 3250 2340 3110 L2590 3200 H120 L92 3194 67 3189 45 3191 14 3180 -21 3184 -50 3173 -78 3174 -103 3161 -135 3161 -160 3149 -191 3147 -207 3132 -173 3137 -142 3117 -113 3120 -83 3095 -50 3096 -18 3073 12 3075 38 3063 70 3065 Z"},"branches":[{"id":"upper-split-return","fill":"#473b2d","d":"M4 2964 L-12 2966 -29 2973 -47 2967 -64 2968 -74 2963 -94 2962 -104 2952 -85 2951 -67 2955 -52 2954 -34 2960 -19 2959 2 2962Z"},{"id":"upper-short-rock-face","fill":"#504636","d":"M4 2975 L-12 2976 -29 2973 -46 2979 -63 2974 -55 2971 -38 2970 -27 2968 -13 2969 4 2971Z"},{"id":"lower-recess-unequal-return","fill":"#473b2d","d":"M4 2994 L-16 2993 -35 3001 -62 3004 -75 3018 -97 3024 -110 3035 -130 3042 -145 3055 -163 3057 -151 3063 -136 3059 -129 3051 -108 3050 -94 3037 -76 3034 -65 3027 -55 3029 -43 3018 -26 3023 -10 3015 4 3025Z"},{"id":"low-fracture-inner-facet","fill":"#504636","d":"M4 3000 L-18 3002 -31 3009 -47 3011 -57 3018 -74 3022 -82 3030 -97 3033 -104 3040 -90 3039 -74 3031 -60 3031 -50 3022 -41 3022 -26 3016 -12 3016 4 3013Z"},{"id":"lower-short-native-chip","fill":"#545044","d":"M-46 3011 L-33 3008 -19 3002 -8 3004 -21 3009 -32 3016 -45 3017Z"}]};
// Join the existing B foundation and F bedrock below the canonical road.
function prepWest21(l,floor,base,recipe){
 if(recipe===undefined||JSON.stringify(recipe)!==JSON.stringify(WEST21_MATERIAL))return null;
 const matches=base.filter(v=>v.asset?.id==='eup21:foundations');
 if(matches.length!==1)return null;
 const entry=matches[0],v=entry.asset.vector;
 if(entry.layer!=='front'||entry.depthLayer!=='L1'||entry.x!==0||entry.y!==0||entry.scale!==1||entry.rotation!==0||
    entry.id!=='foundations'||!entry.honroTerrainMaterialClip||v?.root?.children?.length!==34||
    v.root.children[31]?.d!==WEST21_MATERIAL.B31.old||v.root.children[31]?.fill!=='#334e42'||
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
 const branches=recipe.branches.map(({fill,d})=>({fill,path:new Path2D(d)}));
 // Fail early using the normal vector validator. No B/F partial enable on invalid config.
 G.HonroVectorArt.prepare(clone.asset.vector);
 G.HonroVectorArt.prepare(l.asset.vector);
 return {layer,clone,support,branches,owner:l.asset};
}
function flowMaterialWest21(raw,pair){
 const spec=WEST21_MATERIAL,[X0,Y0,X1,Y1]=spec.box,m=raw.getTransform();
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

// One authored rock section; the existing ground and its registered front face
// paint disjoint halves, on the same integer handoff as the old front strip.
const WEST23_SECTION={"box":[-1000,4380,1240,1080],"paints":[["M-990 4404H229V5450H-990Z",{"line":[-820,4720,195,4830],"stops":[[0,"#584d3b"],[0.37,"#4d4538"],[0.67,"#3c3831"],[1,"#343330"]]}],["M-792 4670 -651 4588 -531 4580 -430 4535 -314 4530 -236 4497 -149 4487 -24 4394 53 4392 124 4408 229 4403 229 4497 166 4507 89 4499 17 4528 -81 4547 -148 4580 -245 4573 -311 4610 -432 4625 -561 4674 -674 4690 -792 4720Z","#4d463a"],["M-961 4767 -808 4719 -684 4733 -553 4668 -449 4660 -284 4600 -192 4597 -124 4608 -56 4612 8 4612 92 4612 180 4611 229 4610 229 4624 154 4624 89 4626 6 4634 -61 4646 -164 4664 -244 4661 -326 4693 -497 4717 -576 4766 -669 4782 -729 4821 -840 4850 -961 4875Z",{"line":[-850,4710,190,4680],"stops":[[0,"#675a46"],[0.48,"#594b3a"],[1,"#4c423a"]]}],["m-640 4724 96-54 113-10 106-44 79-16 57-1 31 7-71 11-68 29-84 8-79 28-60 12-46 29-74 15Z","#60523e"],["M-810 4928 -697 4873 -599 4851 -526 4796 -451 4783 -392 4755 -329 4751 -383 4787 -425 4798 -482 4845 -487 4880 -540 4913 -623 4919 -699 4959 -781 4970Z","#51473a"],["M-973 5276 -804 5251 -685 5194 -600 5206 -517 5166 -409 5144 -310 5155 -234 5123 -180 5078 -120 5069 -68 5037 -3 5010 69 5008 136 5000 229 5005 229 5141 157 5131 103 5137 26 5139 -52 5146 -137 5171 -180 5206 -268 5216 -339 5261 -461 5283 -541 5270 -611 5313 -755 5327 -864 5359 -973 5357Z",{"line":[-820,5250,211,4960],"stops":[[0,"#544837"],[0.52,"#514437"],[1,"#4c423a"]]}],["M-839 5311 -711 5271 -620 5289 -553 5254 -469 5256 -414 5231 -362 5237 -403 5265 -478 5284 -538 5270 -611 5313 -717 5319 -763 5340 -839 5345Z","#493f33"],["M-380 5160 -302 5152 -231 5123 -181 5078 -113 5065 -57 5035 12 5011 107 5005 42 5032 0 5065 -60 5070 -105 5102 -154 5106 -191 5142 -246 5157 -282 5180 -354 5184Z","#594b3f"],["m-169 4942 48-18 36-29 56-6 33 7-42 9-30 24-25 2-49 22Zm-284-84 37-18 45-3-29 11-27 4-33 17Zm-245 177 57-26 27 0-19 11-36 8-18 15Z","#565044"],["m-649 5345 121-29 109 21 72-23 56 13 72-19-44 33-62 3-66 28-75-5-53-22-85 21Z","#4c4336"]],"seat":[{"line":[-990,0,229,0],"stops":[[0,"#ffffff00"],[0.08,"#ffffff24"],[0.28,"#ffffffa3"],[0.49,"#fffffffc"],[0.78,"#ffffffff"],[0.88,"#ffffffcc"],[0.953,"#ffffff75"],[1,"#ffffff00"]]},{"line":[0,4404,0,5450],"stops":[[0,"#ffffff00"],[0.04,"#ffffff26"],[0.154,"#ffffffff"],[0.83,"#ffffffff"],[0.932,"#ffffff5e"],[1,"#ffffff00"]]}]};
const west23Vectors=new WeakMap();
let west23Raster=null;
function eligibleWest23(b,floor,asset){
 if(b?.honroStage!==23||!b.honroCanonical||b.honroCustom||b.honroMapOrigin!=='campaign'||b.honroAuthoredId!=='stage-23'||
    b.honroEscortYardRevision!==1||floor?.id!=='sy-ground'||floor.broken||!G.HonroStage23EscortArt?.active(b)||
    asset?.id!=='act3-handoff:23:quay-west'||asset.collision?.length!==0||
    asset.bounds?.x!==0||asset.bounds.y!==4250||asset.bounds.w!==5050||asset.bounds.h!==5037||
    asset.params?.terrainId!==floor.id||asset.params.blendFace!==true||asset.params.verticalScale!==4.2||
    asset.params.edgeFade?.[0]?.[0]!==0||asset.params.edgeFade?.[0]?.[1]!==170)return false;
 const v=asset.vector;
 if(!v||typeof v!=='object')return false;
 if(!west23Vectors.has(v)){
  const s=JSON.stringify(v);let a=2166136261,z=2654435769;
  for(let i=0;i<s.length;i++){const n=s.charCodeAt(i);a=Math.imul(a^n,16777619);z=Math.imul(z^n,2246822507);}
  west23Vectors.set(v,s.length===112793&&(a>>>0)===761114639&&(z>>>0)===2098273003);
 }
 if(!west23Vectors.get(v))return false;
 const sig=JSON.stringify(asset.params.contactMapping);
 if(sig!=='[[0,704,0,4250],[170,704,1050,4250],[223,755,1600,4530],[285,798,1940,4700],[412,807,2600,4700],[502,821,3400,5100],[586,820,3980,5100],[661,801,4360,4940],[782,795,5050,4480]]')return false;
 const points=G.HONRO_CORE.poly(floor);
 return [[-1000,4332.506666666666],[-500,4318.359375],[0,4250],[1050,4250]]
  .every(([x,y])=>points.some(p=>p.x===x&&p.y===y))&&
  !points.some(p=>p.x>-1000&&p.x<240&&p.y>4333&&p.y<5460);
}
function west23SectionRaster(density){
 if(west23Raster?.density===density)return west23Raster.canvas;
 const {box:[x,y,w,h],paints,seat}=WEST23_SECTION;
 let cv,c,matte;
 try{
  cv=document.createElement('canvas');cv.width=Math.ceil(w*density);cv.height=Math.ceil(h*density);
  c=cv.getContext('2d');if(!c)return null;
  c.setTransform(cv.width/w,0,0,cv.height/h,-x*cv.width/w,-y*cv.height/h);
  const gradient=(ctx,{line,stops})=>{
   const g=ctx.createLinearGradient(...line);
   for(const [at,value] of stops)g.addColorStop(at,value);
   return g;
  };
  for(const [d,ink] of paints){c.fillStyle=typeof ink==='string'?ink:gradient(c,ink);c.fill(new Path2D(d));}
  // Alpha the authored falloff only once, at cache creation, without layer/readback passes during frames.
  matte=document.createElement('canvas');matte.width=cv.width;matte.height=cv.height;
  const mc=matte.getContext('2d');if(!mc)return null;
  const sx=cv.width/w,sy=cv.height/h;
  c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='destination-in';
  for(const mask of seat){
   mc.clearRect(0,0,matte.width,matte.height);
   const [u,v,U,V]=mask.line;
   mc.fillStyle=gradient(mc,{line:[(u-x)*sx,(v-y)*sy,(U-x)*sx,(V-y)*sy],stops:mask.stops});
   mc.fillRect(0,0,matte.width,matte.height);c.drawImage(matte,0,0);
  }
 }catch{return null;}finally{if(matte)matte.width=1;}
 if(west23Raster)west23Raster.canvas.width=1;
 west23Raster={density,canvas:cv};
 return cv;
}
function paintWest23(c,front){
 const raw=G.HonroVisualStyle.raw(c),m=raw.getTransform(),[x,y,w,h]=WEST23_SECTION.box;
 if(![m.a,m.d,m.e,m.f].every(Number.isFinite)||m.a!==m.d||m.b||m.c||m.a<=0)return;
 const cut=Math.round(m.e);
 const l=Math.max(0,Math.floor(x*m.a+m.e)),r=Math.min(raw.canvas.width,Math.ceil((x+w)*m.a+m.e));
 const t=Math.max(0,Math.floor(y*m.d+m.f)),b=Math.min(raw.canvas.height,Math.ceil((y+h)*m.d+m.f));
 const pl=front?Math.max(l,cut):l,pr=front?r:Math.min(r,cut);
 if(pr<=pl||b<=t)return;
 const cv=west23SectionRaster(m.a>.62?.65:.35);
 if(!cv)return;
 raw.save();try{
  // Integer, non-overlapping device support; use the same source crop on both passes.
  raw.setTransform(1,0,0,1,0,0);raw.clip(new Path2D('M'+pl+' '+t+'H'+pr+'V'+b+'H'+pl+'Z'));
  raw.setTransform(m.a,m.b,m.c,m.d,m.e,m.f);raw.drawImage(cv,x,y,w,h);
 }finally{raw.restore();}
}
const west23Ground=S.terrain;
S.terrain=function(c,t){
 const out=west23Ground.call(this,c,t),b=this.battle;
 if(b?.honroStage===23&&t?.id==='sy-ground'&&!t.broken&&!b.honroCustom&&b.honroCanonical){
  const p=G.HONRO_PROJECT,stage=p?.stages?.find(s=>s.metadata?.stageId===23);
  if(stage?.id==='stage-23'&&stage.design?.act3HandoffArt==='act3-handoff:23:quay-west'){
   const a=p.library.find(v=>v.id===stage.design.act3HandoffArt);
   if(eligibleWest23(b,t,a))paintWest23(c,false);
  }
 }
 return out;
};

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
  nearWest=prepWest21(placement,floor,base,WEST21_MATERIAL);
  // Old snapshots can carry a previous native foundation. Keep their stock visual in that case.
  if(nearWest)flowRows.set(nearWest.layer,nearWest);
 }
 const result=nearWest?[...base.filter(l=>l.asset?.id!==artId),nearWest.layer]:
   [...base.filter(l=>l.asset?.id!==artId),placement];
 viewCache.set(b,{base,artId,result});return result;
};

// Stage 29 substrate and first traced face share one carved material section.
// Split the matching world coordinates only at the existing device x0 boundary.
const WEST29_SECTION={"box":[-480,2730,740,640],"paints":[["M-470 2740H245V3350H-470Z",{"line":[-380,2880,218,3000],"stops":[[0,"#4b4c44"],[0.6,"#41423a"],[1,"#353631"]]}],["M-450 2915 -402 2860 -325 2847 -265 2813 -207 2810 -154 2775 -95 2771 -37 2753 42 2741 243 2745 243 2828 195 2833 113 2850 45 2863 -34 2869 -94 2876 -142 2898 -185 2904 -253 2935 -301 2965 -365 2968 -450 3008Z",{"line":[-329,2808,202,2801],"stops":[[0,"#53534a"],[0.43,"#505044"],[1,"#4d453c"]]}],["M-442 2936 -358 2922 -300 2897 -241 2886 -189 2865 -91 2860 -11 2866 54 2859 141 2844 205 2843 172 2860 78 2888 -9 2904 -100 2906 -159 2931 -208 2937 -270 2966 -318 3008 -398 3028 -435 3045Z","#454840"],["M-251 2827 -205 2811 -156 2778 -105 2773 -71 2762 -82 2779 -126 2791 -155 2814 -190 2817 -222 2831Z","#595448"],["M-453 3195 -374 3173 -313 3177 -273 3145 -226 3142 -175 3111 -108 3103 -57 3094 -5 3095 41 3087 91 3069 156 3054 239 3031 239 3073 165 3080 116 3093 40 3100 -25 3132 -80 3135 -126 3169 -196 3179 -229 3212 -297 3223 -358 3244 -453 3255Z",{"line":[-355,3213,232,3087],"stops":[[0,"#4e4f46"],[0.51,"#49483f"],[1,"#524a3e"]]}],["M-376 3235 -321 3227 -273 3210 -226 3207 -195 3177 -121 3165 -73 3135 -24 3133 19 3111 60 3103 38 3131 -23 3157 -84 3161 -121 3190 -151 3193 -184 3206 -205 3232 -250 3251 -308 3264 -351 3260Z","#46463e"],["M-244 3148 -214 3138 -175 3111 -127 3105 -104 3111 -161 3121 -186 3143 -221 3152ZM-132 2940 -107 2924 -78 2926 -58 2920 -71 2931 -102 2936 -120 2948ZM-314 3036 -284 3020 -247 3021 -268 3030 -286 3032 -302 3043Z","#4c4b42"]],"seat":[{"line":[-458,0,236,0],"stops":[[0,"#ffffff00"],[0.17,"#ffffff5e"],[0.47,"#fffffff0"],[0.63,"#ffffffff"],[0.76,"#ffffffeb"],[0.9,"#ffffff4f"],[1,"#ffffff00"]]},{"line":[0,2751,0,3337],"stops":[[0,"#ffffff00"],[0.07,"#ffffff6e"],[0.17,"#ffffffff"],[0.85,"#ffffffff"],[1,"#ffffff00"]]}]};
const west29Vectors=new WeakMap(),west29Placements=new WeakMap();
let west29Raster=null;
function west29Source(v,expected){
 if(!v||typeof v!=='object')return false;
 let sig=west29Vectors.get(v);
 if(!sig){
  const s=JSON.stringify(v);let a=2166136261,z=2654435769;
  for(let i=0;i<s.length;i++){const n=s.charCodeAt(i);a=Math.imul(a^n,16777619);z=Math.imul(z^n,2246822507);}
  sig=s.length+':'+(a>>>0)+':'+(z>>>0);west29Vectors.set(v,sig);
 }
 return sig===expected;
}
function pickWest29(b,l,front){
 if(b.honroStage!==29||!b.honroCanonical||b.honroCustom||b.honroMapOrigin!=='campaign'||b.honroAuthoredId!=='stage-29'||
    !D.active(b))return false;
 const layers=D.materialLandmarks(b);
 let ready=west29Placements.get(b);
 if(ready?.layers!==layers){
  const idB='stage29:record-actual-stone-faces',idF='act3-handoff:29:west-bank';
  const near=layers.filter(x=>x.asset?.id===idB),face=layers.filter(x=>x.asset?.id===idF);
  const B=near[0],F=face[0],base=F&&support(b,F.asset);
  const owner=(x,id)=>x?.id===id&&x.kind==='canonical-element'&&x.layer==='front'&&x.depthLayer==='L1'&&
    x.x===0&&x.y===0&&x.scale===1&&(x.rotation??0)===0&&x.asset.collision?.length===0;
  const valid=near.length===1&&face.length===1&&layers.indexOf(B)<layers.indexOf(F)&&
   owner(B,'r29-actual-stone-faces')&&owner(F,idF)&&B.honroTerrainMaterialClip&&
   (F.asset.params.terrainId??'a3-foundation')==='a3-foundation'&&F.asset.params.blendFace===true&&F.asset.params.verticalScale===3.5&&
   F.asset.params.edgeFade?.[0]===null&&
   JSON.stringify(F.asset.params.contactMapping)==='[[0,687,0,2700],[205,687,1150,2700],[352,624,1800,2520],[410,605,2050,2520],[614,568,2580,2220],[883,568,3650,2220],[1034,708,4150,2760]]'&&
   west29Source(B.asset.vector,'16445:857675311:1155320747')&&west29Source(F.asset.vector,'100397:1019299454:2212172850')&&
   base?.id==='a3-foundation'&&!base.broken&&[[-500,2611.1328125],[0,2700],[1150,2700]]
    .every(([x,y])=>G.HONRO_CORE.poly(base).some(p=>p.x===x&&p.y===y));
  ready={layers,B,F,valid};west29Placements.set(b,ready);
 }
 return ready.valid&&l===(front?ready.F:ready.B);
}
function west29SectionRaster(density){
 if(west29Raster?.density===density)return west29Raster.canvas;
 const {box:[x,y,w,h],paints,seat}=WEST29_SECTION;
 let cv,c,matte;
 try{
  cv=document.createElement('canvas');cv.width=Math.ceil(w*density);cv.height=Math.ceil(h*density);
  c=cv.getContext('2d');if(!c)return null;
  c.setTransform(cv.width/w,0,0,cv.height/h,-x*cv.width/w,-y*cv.height/h);
  const gradient=(ctx,{line,stops})=>{
   const g=ctx.createLinearGradient(...line);
   for(const [at,value] of stops)g.addColorStop(at,value);
   return g;
  };
  for(const [d,ink] of paints){c.fillStyle=typeof ink==='string'?ink:gradient(c,ink);c.fill(new Path2D(d));}
  // Alpha the authored falloff only once, at cache creation, without layer/readback passes during frames.
  matte=document.createElement('canvas');matte.width=cv.width;matte.height=cv.height;
  const mc=matte.getContext('2d');if(!mc)return null;
  const sx=cv.width/w,sy=cv.height/h;
  c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='destination-in';
  for(const mask of seat){
   mc.clearRect(0,0,matte.width,matte.height);
   const [u,v,U,V]=mask.line;
   mc.fillStyle=gradient(mc,{line:[(u-x)*sx,(v-y)*sy,(U-x)*sx,(V-y)*sy],stops:mask.stops});
   mc.fillRect(0,0,matte.width,matte.height);c.drawImage(matte,0,0);
  }
 }catch{return null;}finally{if(matte)matte.width=1;}
 if(west29Raster)west29Raster.canvas.width=1;
 west29Raster={density,canvas:cv};
 return cv;
}
function paintWest29(c,front){
 const raw=G.HonroVisualStyle.raw(c),m=raw.getTransform(),[x,y,w,h]=WEST29_SECTION.box;
 if(![m.a,m.d,m.e,m.f].every(Number.isFinite)||m.a!==m.d||m.b||m.c||m.a<=0)return;
 const cut=Math.round(m.e);
 const l=Math.max(0,Math.floor(x*m.a+m.e)),r=Math.min(raw.canvas.width,Math.ceil((x+w)*m.a+m.e));
 const t=Math.max(0,Math.floor(y*m.d+m.f)),b=Math.min(raw.canvas.height,Math.ceil((y+h)*m.d+m.f));
 const pl=front?Math.max(l,cut):l,pr=front?r:Math.min(r,cut);
 if(pr<=pl||b<=t)return;
 const cv=west29SectionRaster(m.a>.62?.65:.35);
 if(!cv)return;
 raw.save();try{
  // Integer, non-overlapping device support; use the same source crop on both passes.
  raw.setTransform(1,0,0,1,0,0);raw.clip(new Path2D('M'+pl+' '+t+'H'+pr+'V'+b+'H'+pl+'Z'));
  raw.setTransform(m.a,m.b,m.c,m.d,m.e,m.f);raw.drawImage(cv,x,y,w,h);
 }finally{raw.restore();}
}

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
 if(!l.asset?.id?.startsWith('act3-handoff:')||!l.asset.params?.contactMapping){
  const out=draw.call(this,c,l);
  if(this.battle?.honroStage===29&&l.id==='r29-actual-stone-faces'&&pickWest29(this.battle,l,false))paintWest29(c,false);
  return out;
 }
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
    flowMaterialWest21(raw,flow); // Unsupported transforms retain the stock drawing above.
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
 if(b.honroStage===23&&l.id===asset.id&&l.kind==='canonical-element'&&l.layer==='front'&&
    l.depthLayer==='L1'&&l.x===0&&l.y===0&&l.scale===1&&eligibleWest23(b,floor,asset)){
  paintWest23(raw,true);
 }
 if(b.honroStage===29&&asset.id==='act3-handoff:29:west-bank'&&pickWest29(b,l,true))paintWest29(raw,true);
 raw.restore();
};
})(globalThis);
