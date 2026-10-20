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
 // A single bank exposure. The three authored sources retain actor scale;
 // local joints define their visible ends while connected earth buries the
 // source sheet boundaries. No full rectangular module remains exposed.
 const part=G.HonroVectorCampaignMaterials.part,S=103.5/80;
 function exposure(id,x,y,r,mask,tone=0){c.save();c.translate(x,y);c.rotate(r);c.scale(S,S);c.clip(p(mask));part(c,id,{tone});c.restore();}
 exposure('ferry-shoulder',2850,900,-.12,
  'M-20 80H740V231L688 252 672 277 682 305 657 331 646 369 607 389 573 404 534 389 484 413 443 398 409 426 357 408 318 422 274 402 236 416 190 394 163 406 127 379 91 387 53 365 27 373 7 343 22 313-5 287Z',-.20);
 exposure('ferry-shelf',2050,900,0,
  'M-20 100H740V294L689 301 661 322 674 346 648 374 610 368 585 395 532 390 510 412 462 400 425 426 377 411 344 430 282 416 241 411 207 428 177 412 131 421 101 399 64 407 37 385 12 392 29 363 8 347 35 317 18 295 40 272-5 260Z');
 // The oblique fan overlaps the toe of A/B rather than sitting separately
 // below them. Its exposed sheets taper inside a foreground soil fold.
 exposure('ferry-fan',2560,1110,-.12,
  'M-20 100H740V237L686 252 669 277 648 286 637 309 605 328 574 328 552 354 517 362 490 387 456 389 422 412 390 410 354 432 321 424 287 445 253 425 223 434 195 418 162 425 131 408 94 415 63 393 33 398 15 374 36 351 19 332 46 304 27 284-5 272Z');
 // Upstream bank pushes over the shelf's left end; a shallow runoff fold
 // exposes only the stone faces, with no vertical join or enclosing outline.
 fill(c,'M1730 1435Q1855 1380 1923 1282L1972 1210 2024 1187Q2043 1253 2106 1285L2141 1281 2161 1307 2140 1346 2172 1370 2154 1401 2191 1427 2160 1461 2207 1494 2164 1523Q2070 1492 2014 1527C1866 1634 1735 1710 1500 1750L1200 1600Z',grad(c,1750,1250,800,1200,[[0,'#8b7b5c'],[.2,'#7c7053'],[.6,'#69664c'],[1,'#5d6148']]));
 fill(c,'M1955 1325Q1992 1280 2017 1221Q2024 1283 2064 1310L2106 1342 2075 1393 2116 1424 2086 1468Q2013 1484 1981 1524L1871 1581Q1924 1488 1955 1325Z','#6e674e');
 // The upper road bank continues around the recessed shoulder to the right.
 // It has a convex lit face and a returning dark face, both connected to the
 // ridge rather than isolated blobs placed over the module corners.
 fill(c,'M3670 905Q3798 864 3915 887L4290 921 4620 1110 4790 1590Q4377 1690 3990 1575C3792 1520 3688 1505 3552 1500L3510 1471Q3558 1435 3540 1396L3571 1362Q3554 1322 3593 1298L3586 1254Q3632 1249 3628 1198C3614 1159 3654 1144 3664 1106L3650 1067Q3704 992 3670 905Z',grad(c,3630,920,900,1800,[[0,'#8c7c5c'],[.24,'#7d7255'],[.57,'#6e6a50'],[1,'#5e624a']]));
 fill(c,'M3902 964Q3821 1067 3781 1208C3729 1354 3768 1445 3895 1509L3990 1575Q3792 1520 3660 1510L3567 1472Q3620 1442 3618 1391L3650 1350Q3640 1300 3683 1257C3689 1176 3744 1133 3770 1057L3773 1017Z',grad(c,3700,1060,300,700,[[0,'#807456'],[.5,'#736c50'],[1,'#6c684f']]));
 // Broad alluvium crosses the buried rock toe and carries its volume into
 // the lower domain. A few unequal fingers expose wedges, not a sawtooth row.
 fill(c,'M1650 1790C1920 1716 2120 1600 2362 1550Q2470 1528 2555 1548L2605 1531 2649 1547 2692 1534 2740 1564Q2815 1551 2841 1575L2898 1558 2930 1587 2993 1566 3030 1592 3096 1577 3137 1604 3205 1581 3250 1602 3301 1580 3337 1592Q3433 1548 3500 1550C3806 1548 3970 1720 4250 1850C4950 2180 6060 2400 10400 3170V27000H-6100V7560C-3030 4800-650 2550 1650 1790Z',grad(c,2000,1600,3700,7000,[[0,'#807154'],[.11,'#746b50'],[.35,'#616149'],[.7,'#485642'],[1,'#344c3c']]));
 // Quiet, broad folds preserve mass below the exposure. Their tonal
 // intervals stay narrow; they never form outlined crescents or long claws.
 fill(c,'M1630 1850C2012 1672 2200 1626 2370 1616Q2273 1727 2186 1821C2054 1944 1898 2092 1651 2195Q1437 2298 1130 2407C1395 2192 1517 2017 1630 1850Z',grad(c,1600,1710,600,1500,[[0,'#827454'],[.3,'#786d51'],[.7,'#6c674d'],[1,'#68664c']]));
 fill(c,'M2520 1640Q2430 1780 2480 1912C2541 2065 2801 2174 3030 2295Q2737 2238 2565 2137C2333 1994 2318 1845 2458 1660Z',grad(c,2420,1640,800,1350,[[0,'#766c50'],[.4,'#6b664c'],[1,'#65644b']]));
 fill(c,'M3345 1620Q3540 1566 3657 1640C3740 1694 3793 1771 3903 1842Q4083 1955 4362 2025C4053 1998 3819 1940 3634 1845Q3481 1765 3345 1620Z',grad(c,3300,1600,1200,1500,[[0,'#827354'],[.4,'#796d50'],[1,'#68664c']]));
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
