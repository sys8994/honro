
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

// Stage 21 east: one authored set of opaque strata shared by the existing
// two render owners. Native F receives its terminal strip in source coordinates;
// the canonical B foundation receives outer and lower material in world coordinates.
const EAST21_SECTION={"box":[6210,2224,7415,3224],"nativeFront":[["#4c4433","M2147.58788 509.25194L2172 492.88522L2172 648.45283L2140.54778 648.60119L2141.80606 598.33582ZM2172 648.45283L2172 492.88522L2172 492.88522L2172 648.45283Z"],["#41392c","M2130.24242 494.99414L2159.15152 483.53702L2172 481.76115L2172 648.45283L2148.87072 648.56193L2137.95152 645.14646L2133.45455 587.80918ZM2172 648.45283L2172 481.76115L2172 481.76115L2172 648.45283Z"],["#353228","M2131.52727 511.59185L2151.44242 491.87527L2171.35758 478.19643L2172 478.1934L2172 647.71257L2159.79394 647.30758L2135.38182 647.42273L2130.88485 587.06658ZM2172 478.1934L2172 478.1934L2172 647.71257L2172 647.71257Z"],["#504636","M2134.73939 297.9918L2171.35758 297.81907L2172 297.92673L2172 461.08648L2168.78788 462.35949L2149.51515 451.12965L2139.23636 408.91398L2139.87879 364.38265ZM2172 297.92673L2172 297.92673L2172 461.08648L2172 461.08648Z"],["#473b2d","M2110.9697 318.10392L2110.9697 298.81424L2172 297.82344L2172 394.79717L2159.15152 397.49929L2139.87879 387.77887L2127.0303 373.49986L2117.39394 350.14909ZM2172 297.82344L2172 297.82344L2172 394.79717L2172 394.79717Z"],["#3d362a","M2120.60606 383.34148L2130.24242 377.25829L2151.44242 371.12055L2165.57576 364.26144L2172 362.59044L2172 405.30603L2159.79394 405.79814L2142.44848 401.35166L2127.0303 399.16023ZM2172 362.59044L2172 362.59044L2172 405.30603L2172 405.30603Z"],["#545044","M2120.60606 386.36035L2136.66667 380.24686L2153.3697 375.63977L2159.15152 371.08419L2172 366.22084L2172 380.83491L2166.86061 383.1233L2155.29697 380.15898L2145.66061 387.7516L2136.66667 387.79403L2128.95758 392.35869ZM2172 366.22084L2172 366.22084L2172 380.83491L2172 380.83491Z"],["#6d6b56","M2133.45455 382.52616L2141.16364 377.20678L2148.87273 377.92513L2145.66061 382.46858L2139.23636 385.51775ZM2151.44242 375.64886L2160.43636 368.81398L2171.35758 367.25303L2166.21818 371.80557L2155.93939 377.8918ZM2168.14545 378.58894L2172 377.06132L2172 381.58962L2172 381.58962ZM2172 381.58962L2172 377.06132L2172 377.06132L2172 381.58962L2172 381.58962Z"],["#353228","M2116.75152 441.47287L2136.02424 427.79706L2158.50909 418.63439L2172 416.38468L2172 517.33086L2148.87273 521.32136L2129.6 510.09151ZM2172 416.38468L2172 416.38468L2172 517.33086L2172 517.33086Z"],["#545044","M2110.9697 485.12278L2112.89697 470.1703L2139.87879 465.51472L2162.36364 459.37093L2172 456.63005L2172 488.59537L2169.4303 489.52627L2154.01212 495.63674L2133.45455 500.26201L2119.32121 501.83811L2110.9697 495.99071ZM2172 456.63005L2172 456.63005L2172 488.59537L2172 488.59537Z"],["#504636","M2125.74545 510.10969L2146.30303 500.2014L2165.57576 497.09162L2172 494.12631L2172 545.53737L2165.57576 546.14823L2145.01818 557.56595L2127.67273 560.66664L2116.75152 553.9257ZM2172 494.12631L2172 494.12631L2172 545.53737L2172 545.53737Z"],["#534b3a","M2172 524.6624L2161.72121 521.26075L2172 515.84539ZM2172 524.6624L2172 524.6624L2172 515.84539L2172 515.84539Z"],["#3d362b","M2157.22424 607.3197L2172 601.5984L2172 634.3512L2161.07879 636.73548L2147.58788 630.00666ZM2172 601.5984L2172 601.5984L2172 634.3512L2172 634.3512Z"]],"nativeBase":[["#4c4433","M6390 2747.4125L6400 2741.74583L6400 3192.9375L6390 3192ZM6390 3146L6390 3192L6356 3188.8125L6302 3156.8125L6302.31801 3146ZM6400 2741.74583L6444 2716.8125L6554 2728.8125L6692 2662.8125L6844 2724.8125L6900 2738.52679L6900 3065.20274L6852 3096.8125L6772 3128.8125L6696 3182.8125L6606 3214.8125L6540 3214.8125L6482 3222.8125L6420 3194.8125L6400 3192.9375ZM6900 2738.52679L6942 2748.8125L7064 2820.8125L7222 2858.8125L7292 2902.8125L7230 2942.8125L7116 2988.8125L7034 3032.8125L6934 3042.8125L6900 3065.20274Z"],["#41392c","M6390 2713.40341L6400 2712.26705L6400 3165.84476L6390 3165.52218ZM6390 3146L6390 3165.52218L6368 3164.8125L6298.39375 3146ZM6400 2712.26705L6536 2696.8125L6600 2644.8125L6746 2630.8125L6864 2656.8125L6900 2691.28059L6900 3010.64107L6836 3072.8125L6752 3094.8125L6664 3140.8125L6604 3160.8125L6568 3186.8125L6490 3188.8125L6430 3166.8125L6400 3165.84476ZM6900 2691.28059L6958 2746.8125L7098 2804.8125L7182 2870.8125L7146 2908.8125L7076 2918.8125L7012 2974.8125L6906 3004.8125L6900 3010.64107Z"],["#353228","M6390 2707.45766L6398 2702.8125L6400 2702.8125L6400 3152.03831L6390 3151.71573ZM6390 3146L6390 3151.71573L6362 3150.8125L6286 3150.8125L6285.57891 3146ZM6400 2702.8125L6508 2702.8125L6590 2652.8125L6666 2652.8125L6750 2696.8125L6798 2738.8125L6854 2776.8125L6892 2842.8125L6860 2890.8125L6782 2932.8125L6728 2988.8125L6670 3030.8125L6626 3098.8125L6550 3120.8125L6498 3154.8125L6424 3152.8125L6400 3152.03831Z"],["#504636","M6390 2224.8125L6398 2224.8125L6400 2225.10583L6400 2657.47917L6390 2660.8125L6390 2660.8125ZM6400 2225.10583L6548 2246.8125L6718 2268.8125L6884 2290.8125L6889.61994 2290.94023L6900 2292.35938L6900 2453.23674L6838 2490.8125L6760 2524.8125L6684 2580.8125L6638 2598.8125L6554 2622.8125L6468 2634.8125L6400 2657.47917ZM6900 2292.35938L7072.07888 2297.22828L7120 2306.8125L7168 2332.8125L7150 2358.8125L7092 2382.8125L7068 2396.8125L6990 2406.8125L6904 2450.8125L6900 2453.23674Z"],["#5a503b","M6574 2250.8125L6718 2268.8125L6884 2290.8125L6889.61994 2290.94023L6900 2292.35938L6900 2445.8125L6844 2466.8125L6812 2464.8125L6782 2436.8125L6812 2400.8125L6804 2370.8125L6740 2354.8125L6700 2320.8125L6632 2312.8125ZM6900 2292.35938L7072.07888 2297.22828L7120 2306.8125L7168 2332.8125L7150 2358.8125L7092 2382.8125L7068 2396.8125L6990 2406.8125L6908 2442.8125L6900 2445.8125Z"],["#473b2d","M6390 2224.93015L6400 2224.83211L6400 2481.8125L6390 2483.5625ZM6400 2224.83211L6402 2224.8125L6528 2242.8125L6570 2252.8125L6614 2278.8125L6630 2302.8125L6678 2324.8125L6696 2362.8125L6670 2394.8125L6618 2416.8125L6570 2412.8125L6532 2432.8125L6496 2458.8125L6440 2474.8125L6400 2481.8125Z"],["#3d362a","M6390 2398.63859L6400 2396.46467L6400 2509.66098L6390 2509.96402ZM6400 2396.46467L6426 2390.8125L6472 2364.8125L6514 2354.8125L6550 2354.8125L6572 2370.8125L6592 2388.8125L6628 2394.8125L6642 2408.8125L6620 2426.8125L6590 2436.8125L6558 2464.8125L6516 2470.8125L6480 2496.8125L6428 2508.8125L6400 2509.66098Z"],["#545044","M6390 2409.26705L6400 2406.08523L6400 2444.8125L6390 2448.5625ZM6400 2406.08523L6404 2404.8125L6438 2388.8125L6470 2378.8125L6494 2366.8125L6532 2360.8125L6548 2366.8125L6562 2380.8125L6574 2388.8125L6606 2402.8125L6596 2414.8125L6560 2422.8125L6540 2438.8125L6506 2436.8125L6488 2454.8125L6448 2458.8125L6416 2438.8125L6400 2444.8125Z"],["#6d6b56","M6390 2409.75368L6398 2408.8125L6390 2414.8125ZM6414 2402.8125L6448 2384.8125L6476 2378.8125L6458 2390.8125L6430 2404.8125ZM6490 2368.8125L6524 2364.8125L6536 2370.8125L6510 2376.8125L6492 2376.8125ZM6390 2440.14583L6390 2438.14583L6400 2434.8125L6400 2446.8125L6400 2446.8125ZM6400 2446.8125L6400 2434.8125L6412 2430.8125L6436 2432.8125L6424 2440.8125L6400 2446.8125Z"],["#4c4636","M6512 2378.8125L6544 2368.8125L6558 2378.8125L6574 2388.8125L6606 2402.8125L6598 2410.8125L6572 2408.8125L6556 2398.8125L6534 2392.8125Z"],["#353228","M6390 2540.39871L6400 2539.0194L6400 2806.52679L6390 2807.95536ZM6400 2539.0194L6416 2536.8125L6464 2520.8125L6522 2508.8125L6564 2514.8125L6642 2476.8125L6674 2490.8125L6730 2462.8125L6766 2462.8125L6812 2476.8125L6840 2496.8125L6874 2506.8125L6888 2532.8125L6854 2580.8125L6810 2598.8125L6766 2624.8125L6742 2662.8125L6696 2686.8125L6646 2696.8125L6592 2730.8125L6536 2752.8125L6466 2778.8125L6412 2804.8125L6400 2806.52679Z"],["#463d2f","M6632 2696.8125L6676 2660.8125L6748 2644.8125L6772 2608.8125L6824 2580.8125L6858 2548.8125L6892 2536.8125L6900 2536.8125L6900 2671.65121L6868 2676.8125L6820 2718.8125L6768 2750.8125L6718 2750.8125L6674 2766.8125L6634 2748.8125ZM6900 2536.8125L6934 2536.8125L6956 2554.8125L6998 2566.8125L7020 2586.8125L7008 2604.8125L6962 2626.8125L6930 2666.8125L6900 2671.65121Z"],["#545044","M6390 2648.0506L6400 2645.66964L6400 2730.37772L6392 2732.8125L6390 2733.47917ZM6400 2645.66964L6412 2642.8125L6464 2624.8125L6506 2618.8125L6554 2588.8125L6608 2570.8125L6650 2540.8125L6696 2536.8125L6736 2516.8125L6760 2518.8125L6770 2532.8125L6746 2552.8125L6708 2564.8125L6686 2580.8125L6678 2600.8125L6632 2622.8125L6596 2644.8125L6552 2666.8125L6522 2688.8125L6482 2698.8125L6438 2718.8125L6400 2730.37772Z"],["#514b3a","M6578 2648.8125L6622 2628.8125L6684 2592.8125L6704 2596.8125L6740 2566.8125L6776 2548.8125L6814 2540.8125L6836 2548.8125L6838 2566.8125L6804 2594.8125L6768 2600.8125L6734 2636.8125L6706 2648.8125L6662 2672.8125L6620 2688.8125L6596 2686.8125Z"],["#504636","M6390 2748.92361L6400 2745.03472L6400 2881.27404L6390 2882.04327ZM6400 2745.03472L6416 2738.8125L6466 2748.8125L6510 2734.8125L6554 2744.8125L6600 2722.8125L6642 2726.8125L6688 2700.8125L6746 2710.8125L6788 2742.8125L6854 2764.8125L6900 2788.7325L6900 2848.50481L6896 2852.8125L6858 2860.8125L6810 2846.8125L6772 2810.8125L6712 2802.8125L6676 2788.8125L6632 2806.8125L6578 2816.8125L6554 2846.8125L6500 2850.8125L6432 2878.8125L6400 2881.27404ZM6900 2788.7325L6904 2790.8125L6922 2824.8125L6900 2848.50481Z"],["#534b3a","M6400 2825.95536L6390 2823.09821L6390 2807.03472L6400 2802.59028ZM6400 2825.95536L6400 2802.59028L6422 2792.8125L6458 2788.8125L6492 2766.8125L6550 2768.8125L6600 2750.8125L6632 2762.8125L6674 2744.8125L6724 2746.8125L6768 2774.8125L6740 2786.8125L6678 2770.8125L6636 2788.8125L6592 2788.8125L6544 2806.8125L6498 2816.8125L6442 2836.8125L6410 2828.8125Z"],["#3e362a","M6464 2846.8125L6508 2834.8125L6532 2836.8125L6564 2816.8125L6596 2820.8125L6640 2810.8125L6636 2828.8125L6586 2844.8125L6552 2858.8125L6506 2862.8125Z"],["#3d362b","M6390 3033.09157L6400 3029.83576L6400 3116.63068L6390 3118.44886ZM6400 3029.83576L6440 3016.8125L6510 3016.8125L6566 2978.8125L6626 2952.8125L6684 2926.8125L6722 2926.8125L6768 2896.8125L6838 2902.8125L6882 2884.8125L6900 2889.1325L6900 2934.74353L6846 2960.8125L6806 2962.8125L6768 2986.8125L6722 3014.8125L6686 3020.8125L6658 3054.8125L6600 3080.8125L6566 3102.8125L6502 3100.8125L6458 3122.8125L6410 3114.8125L6400 3116.63068ZM6900 2889.1325L6932 2896.8125L6952 2914.8125L6904 2932.8125L6900 2934.74353Z"],["#514932","M6916 2676.8125L6992 2644.8125L7052 2646.8125L7102 2674.8125L7168 2692.8125L7244 2742.8125L7302 2800.8125L7374 2834.8125L7414 2852.8125L7396 2892.8125L7346 2892.8125L7318 2886.8125L7264 2872.8125L7208 2856.8125L7130 2838.8125L7096 2804.8125L7030 2768.8125L6990 2716.8125Z"]]};
const east21F=new WeakMap(),east21B=new WeakMap(),east21Source=new WeakMap();
function prepareEast21(b,f,base,floor){
 if(b.honroStage!==21||b.honroMapOrigin!=='campaign'||b.honroAuthoredId!=='stage-21'||
    floor?.id!=='a3-foundation'||floor.broken||f.id!=='act3-handoff:21:bedrock'||
    f.params?.blendFace||f.bounds?.x!==0||f.bounds.w!==6400||f.collision?.length!==0)return null;
 const mapping=f.params?.contactMapping;
 if(mapping?.length!==17||JSON.stringify(mapping.slice(-2))!=='[[1960,297,5740,2220],[2172,296,6400,2220]]')return null;
 const matches=base.filter(l=>l.id==='foundations'&&l.asset?.id==='eup21:foundations');
 if(matches.length!==1)return null;
 const land=matches[0],v=land.asset.vector,ns=v?.root?.children;
 if(land.x!==0||land.y!==0||land.scale!==1||land.rotation!==0||land.layer!=='front'||land.depthLayer!=='L1'||
    !land.honroTerrainMaterialClip||land.asset.collision?.length!==0||ns?.length!==34||
    ns[0]?.fill!=='url(#deep-soil)'||ns[7]?.fill!=='#465e4d'||ns[31]?.d!==WEST21_MATERIAL.B31.old||
    ns[33]?.fill!=='#314d41')return null;
 const pts=G.HONRO_CORE.poly(floor);
 if(![[5740,2220],[6400,2220],[6900,2288.359375],[7400,2302.5066666666667]]
    .every(([x,y])=>pts.some(p=>p.x===x&&p.y===y))||
    pts.some(p=>p.x>6210&&p.x<7415&&p.y>2320&&p.y<3224))return null;
 const fv=f.vector;
 if(!east21Source.has(fv)){
  const s=JSON.stringify(fv);let a=2166136261,z=2654435769;
  for(let i=0;i<s.length;i++){const n=s.charCodeAt(i);a=Math.imul(a^n,16777619);z=Math.imul(z^n,2246822507);}
  east21Source.set(fv,s.length===186944&&(a>>>0)===490576173&&(z>>>0)===684801009);
 }
 if(!east21Source.get(fv))return null;
 try{
  const nodes=rows=>rows.map(([fill,d])=>({tag:'path',fill,d,stroke:'none',opacity:1,fillRule:'nonzero'}));
  const Fvector={...fv,root:{...fv.root,children:[...fv.root.children,...nodes(EAST21_SECTION.nativeFront)]}};
  const Bvector={version:1,viewBox:[6210,2224,1205,1000],root:{tag:'g',children:nodes(EAST21_SECTION.nativeBase)}};
  G.HonroVectorArt.prepare(Fvector);G.HonroVectorArt.prepare(Bvector);
  return {land,front:{...f,vector:Fvector},base:{vector:Bvector}};
 }catch{return null;}
}
function eastVisible(raw){
 const m=raw.getTransform(),[x,y,r,b]=EAST21_SECTION.box;
 return m.a>0&&m.d>0&&!m.b&&!m.c&&x*m.a+m.e<raw.canvas.width&&r*m.a+m.e>0&&
        y*m.d+m.f<raw.canvas.height&&b*m.d+m.f>0;
}


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
 const east=prepareEast21(b,asset,base,floor);
 if(east){east21F.set(nearWest?.layer??placement,east);east21B.set(east.land,east);}
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
 if(!l.asset?.id?.startsWith('act3-handoff:')||!l.asset.params?.contactMapping){
  const out=draw.call(this,c,l),east=east21B.get(l);
  if(east){const raw=G.HonroVisualStyle.raw(c);if(eastVisible(raw))G.HonroVectorArt.draw(raw,east.base,{x:0,y:0});}
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
 const flow=flowRows.get(l),east=east21F.get(l);
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
     G.HonroVectorArt.draw(raw,east&&row.x1===6400?east.front:flow.owner,{x:0,y:0});
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
  G.HonroVectorArt.draw(raw,east&&row.x1===6400?east.front:l.asset,{x:0,y:0});raw.restore();
 }
 if(b.honroStage===23&&l.id===asset.id&&l.kind==='canonical-element'&&l.layer==='front'&&
    l.depthLayer==='L1'&&l.x===0&&l.y===0&&l.scale===1&&eligibleWest23(b,floor,asset)){
  paintWest23(raw,true);
 }
 raw.restore();
};
})(globalThis);
