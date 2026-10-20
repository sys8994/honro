(function(G){'use strict';
// One authored ferry-bank composition. Structural bedrock, its opposing faces
// and its sediment pockets are drawn before the narrow walk surface. All are
// native paths in world units; this layer never writes battle geography.
const paths=new Map(),surfaces=new WeakMap(),C=G.HONRO_CORE;
function p(d){if(!paths.has(d))paths.set(d,new Path2D(d));return paths.get(d);}
function fill(c,d,paint){c.fillStyle=paint;c.fill(p(d));}
function grad(c,x,y,w,h,stops){const g=c.createLinearGradient(x,y,x+w,y+h);for(const[a,v]of stops)g.addColorStop(a,v);return g;}
const S=103.5/80;
// Each row is a deliberately placed partial exposure, not a repeating tile.
// Exposures share actor scale; unequal overlaps conceal source-sheet ends.
const HEADWALL=[
 ['shelf',1810,925,.03,-.03],['shoulder',2490,950,-.18,-.15],
 ['shoulder',3160,620,.08,-.09],['shelf',3890,565,.11,-.04],
 ['fan',4540,635,.13,-.10],
 ['fan',1600,1310,-.11,-.08],['shelf',2230,1285,-.06,-.02],
 ['fan',2860,1280,-.16,-.06],['shoulder',3540,1140,.14,-.10],
 ['shelf',4240,1130,.05,-.06],['fan',4820,1320,-.10,-.13]
];
const WATER_BEARING=[
 ['shelf',-1500,1570,.08,-.12],['fan',-810,1670,-.09,-.08],
 ['shelf',-100,1630,.04,-.10],['shoulder',620,1560,-.15,-.13],
 ['fan',1260,1760,-.12,-.03],['shelf',1880,1690,.06,-.10],
 ['fan',-1490,2040,.12,-.16],['shoulder',-780,2110,-.12,-.18],
 ['shelf',-130,2180,-.08,-.10],['fan',590,2110,.11,-.08],
 ['shelf',1260,2200,-.15,-.12],['shoulder',1930,2260,.08,-.16],
 ['shoulder',-1540,2580,-.04,-.24],['fan',-790,2630,-.14,-.20],
 ['shelf',-80,2700,.09,-.17],['fan',650,2700,-.11,-.16],
 ['shoulder',1350,2830,.06,-.20],
 ['shelf',-1440,3170,-.12,-.29],['fan',-760,3250,.07,-.26],
 ['shoulder',-20,3260,-.06,-.23],['shelf',690,3380,-.14,-.22]
];
const FRONT_SPINE=[
 ['fan',2300,1605,-.14,-.02],['shelf',2960,1560,-.10,-.04],
 ['shoulder',3630,1700,.12,-.09],['fan',4300,1650,-.09,-.06],
 ['shelf',4930,1780,.08,-.13],
 ['shoulder',1630,2060,-.12,-.12],['fan',2240,2120,-.22,-.08],
 ['shelf',2930,2150,.07,-.10],['fan',3610,2180,-.12,-.12],
 ['shoulder',4300,2240,.14,-.17],['shelf',4950,2300,-.06,-.17],
 ['fan',1500,2630,-.10,-.17],['shelf',2170,2690,-.12,-.15],
 ['shoulder',2830,2650,.14,-.21],['fan',3510,2790,-.20,-.18],
 ['shelf',4160,2740,.04,-.20],['shoulder',4880,2860,-.10,-.24],
 ['shelf',1370,3210,.09,-.24],['fan',2060,3230,-.18,-.22],
 ['shoulder',2740,3300,-.07,-.27],['shelf',3410,3340,.11,-.25],
 ['fan',4090,3410,-.14,-.26],['shoulder',4800,3470,.05,-.29],
 ['fan',1260,3770,-.10,-.28],['shoulder',1940,3850,.08,-.31],
 ['shelf',2640,3910,-.06,-.28],['fan',3330,3960,-.17,-.29],
 ['shoulder',4010,4030,.10,-.32],['shelf',4710,4080,-.08,-.31]
];
function exposures(c,rows,view){for(const[id,x,y,rotation,tone]of rows){
 // Conservative transformed bounds include the gutters of the authored SVG.
 if(view&&(x+1150<view.x||x-200>view.x+view.w||y+800<view.y||y-200>view.y+view.h))continue;
 G.HonroVectorCampaignMaterials.part(c,'ferry-'+id,{x,y,sx:S,rotation,tone,omitBase:true});
}}
function formation(c,d,rows,view,from,to){c.save();c.clip(p(d));fill(c,d,grad(c,from[0],from[1],to[0]-from[0],to[1]-from[1],[[0,'#656c5e'],[.3,'#5e6658'],[.7,'#4d5b4e'],[1,'#3c5145']]));exposures(c,rows,view);c.restore();}
function draw(c,b,view){if(b?.honroStage!==3)return;c.save();
 // Opaque geological substrate continues through the canonical camera domain.
 // The visible foreground is built from three overlapping bearing formations,
 // rather than an earth sheet enclosing a small rock window.
 c.fillStyle=grad(c,0,1050,800,11000,[[0,'#6c6a54'],[.18,'#596151'],[.48,'#43584a'],[1,'#304a3f']]);c.fillRect(-6100,400,16500,25500);
 formation(c,
 'M1640 1060L5120 580 5550 1260 5390 1670 5190 1712 5010 1850 4780 1831 4640 1950 4420 1910 4240 2060 4005 2017 3820 2130 3600 2048 3390 2180 3190 2090 2970 2184 2710 2055 2500 2150 2310 2026 2080 2070 1860 1945 1720 1800 1570 1630Z',HEADWALL,view,[2300,1100],[4200,2300]);
 // Low water-bearing beds descend toward the viewer under the wharf. Their
 // unequal shoulders interlock with the steeper front spine at the centre.
 formation(c,
 'M-2200 1650L710 1675 1100 1730 1470 1640 1780 1720 1920 1880 2130 1910 2270 2140 2460 2230 2500 2470 2340 2590 2310 2810 2080 2940 2110 3150 1890 3300 1870 3520 1630 3690 1600 3970 1330 4200 980 4570-2200 4800Z',WATER_BEARING,view,[-800,1750],[1700,4100]);
 // The foreground is a continuous oblique outcrop with buried wedges and
 // several changes of bedding direction. It runs beyond the lower wide view.
 formation(c,
 'M2000 1710L2290 1600 2540 1690 2780 1640 2990 1780 3260 1720 3490 1890 3710 1800 3950 1900 4190 1810 4440 1980 4670 1900 4920 2050 5430 1960 5850 2320 5760 4610 5450 4880 5020 4760 4700 4960 4310 4820 3940 5030 3500 4900 3170 5070 2820 4860 2430 4970 2010 4750 1620 4830 1270 4500 1230 4060 1410 3870 1350 3570 1550 3330 1470 3020 1680 2820 1600 2570 1840 2350 1770 2110 1980 1940Z',FRONT_SPINE,view,[2600,1750],[3200,4900]);
 // Scene-specific connecting faces turn between the fragment beds. Each is
 // an extended plate with a lit shoulder, a returning side and a few large
 // fractures. They hide the source-sheet boundaries without enclosing them.
 fill(c,'M1981 1910L2090 1816 2195 1803 2280 1827 2350 1808 2442 1856 2490 1949 2426 1985 2394 2110 2283 2180 2152 2154 2050 2203 1984 2132 2010 2038 1949 2000Z',grad(c,1980,1800,320,430,[[0,'#838774'],[.25,'#6e7664'],[1,'#4b5c4f']]));
 fill(c,'M2280 1827L2350 1808 2442 1856 2490 1949 2426 1985 2394 2110 2283 2180 2220 2150 2282 2040 2261 2004 2313 1930Z','#44554a');
 fill(c,'M2020 1914L2110 1833 2190 1821 2263 1842 2238 1868 2197 1860 2151 1886 2126 1880 2081 1930Z','#9b9b80');
 fill(c,'M2190 1904L2212 1881 2233 1902 2214 1939 2234 1980 2202 2021 2211 2071 2189 2115 2181 2069 2190 2022 2177 1980 2199 1946Z','#3d5147');
 fill(c,'M3674 2460L3758 2315 3871 2280 3954 2303 4025 2258 4137 2300 4190 2390 4147 2476 4178 2539 4110 2644 4000 2690 3917 2672 3820 2734 3730 2671 3695 2590 3720 2520Z',grad(c,3660,2270,500,650,[[0,'#7c826d'],[.35,'#636e5c'],[1,'#43584b']]));
 fill(c,'M3954 2303L4025 2258 4137 2300 4190 2390 4147 2476 4178 2539 4110 2644 4000 2690 3917 2672 3970 2584 3950 2530 4004 2435Z','#3b5146');
 fill(c,'M3758 2345L3871 2306 3940 2327 3993 2301 4060 2319 4026 2354 3975 2349 3911 2393 3878 2388 3824 2425 3777 2410 3731 2454Z','#92957b');
 fill(c,'M3869 2464L3911 2393 3932 2405 3899 2460 3910 2496 3864 2550 3854 2604 3829 2649 3836 2574 3853 2524 3847 2497Z','#354e43');
 // Earth is confined to runoff seams, colluvial pockets and the river's
 // deposited bench. Each pocket has a broad upper plane and a shaded return;
 // none is a smooth U-shaped frame around the entire rock composition.
 fill(c,'M-1730 2110C-1010 1990-302 2130 180 2030L430 1994 615 2023 779 2006 958 2059 1110 2038 1280 2096 1370 2100 1290 2179 1080 2196 932 2174 752 2201 548 2168 333 2201 106 2160C-463 2259-1130 2180-1810 2320Z',grad(c,0,2000,700,600,[[0,'#8c7959'],[.32,'#756b50'],[1,'#59614b']]));
 fill(c,'M1830 1450L1914 1432 1939 1507 1922 1585 1940 1630 1901 1708 1923 1755 1880 1851 1900 1906 1853 1970 1827 2057 1862 2112 1904 2208 1872 2223 1833 2166 1791 2117 1770 2037 1782 1954 1822 1867 1806 1815 1840 1722 1823 1671 1855 1577Z',grad(c,1800,1450,400,1200,[[0,'#8e7957'],[.3,'#78684d'],[1,'#5c6149']]));
 fill(c,'M2810 1702L2865 1691 2847 1750 2803 1807 2785 1864 2721 1925 2700 1987 2624 2040 2601 2116 2523 2170 2503 2240 2430 2285 2385 2370 2298 2410 2265 2510 2166 2570 2118 2681 2042 2718 2001 2805 1903 2860 1856 2972 1750 3026 1712 3120 1570 3204 1530 3173 1660 3081 1690 2997 1809 2911 1840 2817 1942 2761 1983 2659 2082 2595 2129 2483 2233 2426 2277 2328 2368 2271 2404 2183 2490 2129 2524 2042 2600 1985 2630 1918 2707 1848 2725 1795Z',grad(c,2490,1730,300,1700,[[0,'#8e7b58'],[.4,'#74694d'],[1,'#56604a']]));
 fill(c,'M2785 1864L2721 1925 2700 1987 2624 2040 2601 2116 2523 2170 2503 2240 2430 2285 2385 2370 2298 2410 2265 2510 2166 2570 2118 2681 2083 2688 2129 2561 2219 2491 2250 2390 2340 2337 2378 2251 2464 2199 2500 2111 2574 2052 2600 1973 2672 1909 2703 1845Z','#4f5a46');
 fill(c,'M4030 945L4080 970 4106 1066 4090 1150 4124 1214 4103 1280 4057 1336 4050 1410 4000 1478 4007 1551 3957 1610 3929 1704 3850 1770 3814 1860 3721 1915 3690 1982 3602 2030 3512 2120 3447 2132 3507 2068 3553 1992 3650 1923 3680 1849 3780 1780 3811 1690 3882 1618 3904 1532 3955 1467 3962 1387 4006 1317 4005 1239 4041 1174 4023 1097Z',grad(c,3980,1050,500,1550,[[0,'#8a7656'],[.3,'#75684e'],[1,'#59604a']]));
 fill(c,'M2855 2635L2982 2592 3082 2608 3145 2574 3222 2603 3255 2651 3214 2681 3163 2670 3082 2708 2980 2695 2897 2721 2804 2690Z',grad(c,2850,2580,500,250,[[0,'#8d7959'],[.45,'#746b50'],[1,'#59614b']]));
 fill(c,'M4140 3200L4269 3152 4379 3169 4477 3131 4585 3165 4640 3224 4571 3266 4490 3254 4383 3290 4297 3261 4190 3276 4086 3245Z',grad(c,4100,3150,500,300,[[0,'#7e7156'],[.55,'#68654e'],[1,'#4f5c48']]));
 // The lowest visible interstices remain articulated by broad buried plates;
 // opaque, reduced-contrast rock turns continue into the larger domain.
 fill(c,'M-6100 5360L-2820 4390-1250 4820-140 4300 1030 4510 2160 4190 3300 4570 4470 4320 5900 4850 7320 4510 10400 5000V27000H-6100Z',grad(c,1200,4200,2300,15000,[[0,'#45594a'],[.35,'#3d5446'],[1,'#2b473c']]));
 c.restore();}
function surfaceData(b){const t=b.terrain.find(t=>t.id==='ferry-ground'&&!t.broken);if(!t)return null;const key=b.sceneVersion+':'+t.x+':'+t.y+':'+t.w+':'+t.h;let data=surfaces.get(b);if(data?.key===key)return data;
 // Width changes belong to a few worn shoulders and runoff mouths. There is
 // no regular sawtooth, leaf field or repeated edge-noise generator.
 const rows=[[0,-7,17],[200,-10,23],[470,-8,15],[730,-12,26],[980,-6,19],[1220,-9,31],[1480,-11,21],[1700,-7,28],[1850,-10,19],[1990,-7,33],[2190,-11,25],[2390,-8,36],[2580,-10,22],[2770,-6,30],[2970,-11,18],[3150,-8,29],[3330,-12,22],[3520,-7,32],[3710,-10,23],[3910,-6,29],[4100,-10,18],[4276,-7,23]];
 const top=rows.map(([x,a])=>[x,C.topAt(t,x,t.y)+a*.5]),bottom=rows.map(([x,,a])=>[x,C.topAt(t,x,t.y)+a*.55]);
 const band=new Path2D();function edge(points,start){if(start)band.moveTo(...points[0]);else band.lineTo(...points[0]);for(let i=1;i<points.length-1;i++){const a=points[i],z=points[i+1];band.quadraticCurveTo(a[0],a[1],(a[0]+z[0])/2,(a[1]+z[1])/2);}band.lineTo(...points.at(-1));}edge(top,true);edge(bottom.toReversed(),false);band.closePath();
 
 const deposit=new Path2D();const strip=rows.slice(8,17);strip.forEach(([x],i)=>{const y=C.topAt(t,x,t.y)+5; i?deposit.lineTo(x,y):deposit.moveTo(x,y);});for(const[x,,width]of strip.toReversed())deposit.lineTo(x,C.topAt(t,x,t.y)+Math.min(14,width*.48));deposit.closePath();
 data={key,t,band,deposit};surfaces.set(b,data);return data;}
function surface(c,b,view){if(b?.honroStage!==3)return;const s=surfaceData(b);if(!s)return;c.save();
 c.fillStyle=grad(c,1900,1050,1200,600,[[0,'#91805e'],[.35,'#998361'],[1,'#8e7e5e']]);c.fill(s.band);
 c.fillStyle='#c3ae8023';c.fill(s.deposit);
 // Broken runoff lips interrupt the thin front edge at two actual hollows.
 const x=2390,y=C.topAt(s.t,x,s.t.y);c.translate(x,y);
 fill(c,'M-63 18L-31 23-12 15 13 24 31 18 59 27 42 36 17 30-9 39-34 30-56 34Z','#756345');
 fill(c,'M-8 28L8 33 1 51-14 64-10 45-23 35Z','#514c37');
 c.restore();
 // Three small, partly buried surface stones. Their unequal faces overlap
 // the surface ribbon, giving the walk edge a few real material breaks.
 const caps=[
  [2231,'M-39 5L-25-8-9-13 11-8 24-11 39 0 31 12 12 15-4 10-23 14Z','M-39 5L-25-8-9-13 11-8 24-11 14-1-7-3-20 4Z','M14-1L24-11 39 0 31 12 12 15 2 8Z'],
  [2930,'M-52 5L-34-5-16-4 7-19 24-16 42-7 52 7 29 12 8 8-15 15-43 12Z','M-52 5L-34-5-16-4 7-19 24-16 12-9 3-6-10 3-32 2Z','M24-16L42-7 52 7 29 12 8 8 19 0Z'],
  [3470,'M-27 6L-25-7-11-20 7-25 22-16 19-3 32 7 12 14-5 9-17 13Z','M-27 6L-25-7-11-20 7-25 22-16 4-12-3-3-16 2Z','M4-12L22-16 19-3 32 7 12 14-5 9 4 2Z']
 ];
 for(const[x,body,light,side]of caps){const y=C.topAt(s.t,x,s.t.y);c.save();c.translate(x,y);fill(c,body,'#586560');fill(c,light,'#87907a');fill(c,side,'#3d4c4a');fill(c,'M-33 10Q-8 7 9 12L33 12 24 17-7 15-26 18Z','#7d7152');c.restore();}
}
G.HonroStage3VectorFront={draw,surface};
})(globalThis);
