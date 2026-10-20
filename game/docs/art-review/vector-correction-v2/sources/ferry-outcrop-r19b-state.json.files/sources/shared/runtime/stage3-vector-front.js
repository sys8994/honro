(function(G){'use strict';
// Soil and route bearing for the ferry bank. Rock exposures are a separate
// authored module; the rejected rounded-boulder/zigzag field has been removed.
// This layer never changes a solid, route, unit or event.
const paths=new Map(),surfaces=new WeakMap(),C=G.HONRO_CORE;
function p(d){if(!paths.has(d))paths.set(d,new Path2D(d));return paths.get(d);}
function fill(c,d,paint){c.fillStyle=paint;c.fill(p(d));}
function grad(c,x,y,w,h,stops){const g=c.createLinearGradient(x,y,x+w,y+h);for(const[a,v]of stops)g.addColorStop(a,v);return g;}
function draw(c,b,view){if(b?.honroStage!==3)return;c.save();
 // The mountain continues opaquely under the camera. Unequal earth folds
 // turn toward the viewer, with restrained contrast as they fall away.
 c.fillStyle=grad(c,-600,800,3000,10500,[[0,'#807258'],[.13,'#71654e'],[.36,'#595c47'],[.7,'#405345'],[1,'#30483e']]);c.fillRect(-6100,400,16500,25500);
 fill(c,'M-6100 2210C-4010 1560-2140 2450-410 2160C530 2000 1190 2200 1850 1850C2550 1480 2990 1640 3550 1380C4560 910 5560 1690 6640 1370C7890 1010 9110 1610 10400 1330L10400 27000-6100 27000Z',grad(c,600,1600,4300,8400,[[0,'#6d654e'],[.27,'#5f604b'],[.66,'#465646'],[1,'#304a3e']]));
 fill(c,'M-6100 4280C-3750 3120-1670 4680-60 3780C770 3320 1350 3520 2050 3030C2750 2550 3420 2880 4050 2420C5520 1340 7230 2960 10400 2170L10400 27000-6100 27000Z',grad(c,1000,2800,4600,11200,[[0,'#605f49'],[.38,'#4b5947'],[1,'#2e483c']]));
 // Connected footing under the local exposure. This is one receding
 // bedrock mass with unequal broken ledges, not detached round boulders.
 fill(c,'M1920 1410L2090 1375 2270 1410 2420 1340 2610 1368 2780 1290 2960 1320 3130 1220 3310 1250 3490 1170 3660 1200 3840 1140 4020 1160 4200 1120 4380 1190C4580 1670 5060 1950 5410 2630C6050 3900 7840 4700 10400 6910V27000H-6100V7710C-3480 5510-1220 4570 390 2990C1260 2300 1640 1910 1840 1510Z',grad(c,2000,1250,1500,4300,[[0,'#354642'],[.26,'#46594b'],[.52,'#4b5947'],[1,'#485744']]));
 // One bank exposure, each module used once. H=80 in the source study
 // maps to the actual adult H=103.5 world units (scale 1.29375).
 const part=G.HonroVectorCampaignMaterials.part,S=103.5/80;
 // The recessed shoulder is behind both neighbours and deliberately darker.
 part(c,'ferry-shoulder',{x:2680,y:960,sx:S,rotation:-.22,tone:-.2});
 part(c,'ferry-shelf',{x:1970,y:850,sx:S});
 part(c,'ferry-fan',{x:3300,y:800,sx:S,rotation:-.13});
 // Soil from the actual route covers the recess's upper-right bearing. It
 // remains an interrupted joint, rather than a repeated decorative cave.
 fill(c,'M2981 1190Q3040 1184 3087 1210L3118 1264 3101 1310 3137 1359 3211 1395 3262 1461Q3188 1490 3135 1450L3068 1381 3052 1322 3072 1271 3034 1237 2982 1231Z',grad(c,2970,1180,460,600,[[0,'#786c53'],[.45,'#6b634a'],[1,'#555d45']]));
 // Earth tongues cross several bearings and hide their lower returns.
 // Their asymmetry belongs to the slope, not a frame around every stone.
 fill(c,'M1870 1700Q1970 1670 2050 1710L2090 1790 2057 1850 2115 1927 2220 1960 2273 2050Q2140 2090 2050 2010L1968 1900 1988 1807 1920 1760 1840 1767Z',grad(c,1860,1700,600,950,[[0,'#796d51'],[.45,'#636147'],[1,'#4d5842']]));
 fill(c,'M2730 1630Q2795 1630 2834 1684L2809 1768 2856 1838 2840 1911 2919 1981 2900 2070Q2798 2074 2733 1988L2708 1901 2740 1827 2708 1750 2724 1694 2678 1664Z',grad(c,2680,1640,600,1040,[[0,'#756b4f'],[.42,'#5f6047'],[1,'#4b5842']]));
 fill(c,'M3220 1890Q3300 1840 3381 1871L3451 1947 3534 1927 3620 1998 3710 1973Q3810 2020 3873 2115L3810 2190 3680 2140 3585 2170 3460 2090 3370 2120 3260 2040 3170 2028Z',grad(c,3180,1880,1200,1600,[[0,'#6e674c'],[.5,'#596047'],[1,'#475640']]));
 fill(c,'M4040 1630Q4120 1590 4188 1637L4239 1709 4340 1717 4410 1800Q4330 1888 4240 1840L4179 1770 4111 1784 4053 1721Z',grad(c,4020,1620,700,1100,[[0,'#726c50'],[1,'#526047']]));
 c.restore();}
function surfaceData(b){const t=b.terrain.find(t=>t.id==='ferry-ground'&&!t.broken);if(!t)return null;const key=b.sceneVersion+':'+t.x+':'+t.y+':'+t.w+':'+t.h;let data=surfaces.get(b);if(data?.key===key)return data;
 // Width changes belong to a few worn shoulders and runoff mouths. There is
 // no regular sawtooth, leaf field or repeated edge-noise generator.
 const rows=[[0,-7,17],[200,-10,23],[470,-8,15],[730,-12,26],[980,-6,19],[1220,-9,31],[1480,-11,21],[1700,-7,28],[1850,-10,19],[1990,-7,33],[2190,-11,25],[2390,-8,36],[2580,-10,22],[2770,-6,30],[2970,-11,18],[3150,-8,29],[3330,-12,22],[3520,-7,32],[3710,-10,23],[3910,-6,29],[4100,-10,18],[4276,-7,23]];
 const top=rows.map(([x,a])=>[x,C.topAt(t,x,t.y)+a]),bottom=rows.map(([x,,a])=>[x,C.topAt(t,x,t.y)+a]);
 const band=new Path2D();function edge(points,start){if(start)band.moveTo(...points[0]);else band.lineTo(...points[0]);for(let i=1;i<points.length-1;i++){const a=points[i],z=points[i+1];band.quadraticCurveTo(a[0],a[1],(a[0]+z[0])/2,(a[1]+z[1])/2);}band.lineTo(...points.at(-1));}edge(top,true);edge(bottom.toReversed(),false);band.closePath();
 
 const deposit=new Path2D();const strip=rows.slice(8,17);strip.forEach(([x],i)=>{const y=C.topAt(t,x,t.y)+5; i?deposit.lineTo(x,y):deposit.moveTo(x,y);});for(const[x,,width]of strip.toReversed())deposit.lineTo(x,C.topAt(t,x,t.y)+Math.min(14,width*.48));deposit.closePath();
 data={key,t,band,deposit};surfaces.set(b,data);return data;}
function surface(c,b,view){if(b?.honroStage!==3)return;const s=surfaceData(b);if(!s)return;c.save();
 c.fillStyle=grad(c,1900,1050,1200,600,[[0,'#978564'],[.35,'#a28d67'],[1,'#968563']]);c.fill(s.band);
 c.fillStyle='#c3ae803d';c.fill(s.deposit);
 // Broken runoff lips interrupt the thin front edge at two actual hollows.
 const x=2390,y=C.topAt(s.t,x,s.t.y);c.translate(x,y);
 fill(c,'M-63 18L-31 23-12 15 13 24 31 18 59 27 42 36 17 30-9 39-34 30-56 34Z','#756345');
 fill(c,'M-8 28L8 33 1 51-14 64-10 45-23 35Z','#514c37');
 c.restore();}
G.HonroStage3VectorFront={draw,surface};
})(globalThis);
