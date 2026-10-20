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
 // Broad alluvium crosses the buried rock toe and carries its volume into
 // the lower domain. A few unequal fingers expose wedges, not a sawtooth row.
 fill(c,'M1650 1790C1920 1716 2120 1600 2362 1550Q2470 1528 2555 1548L2605 1531 2649 1547 2692 1534 2740 1564Q2815 1551 2841 1575L2898 1558 2930 1587 2993 1566 3030 1592 3096 1577 3137 1604 3205 1581 3250 1602 3301 1580 3337 1592Q3433 1548 3500 1550C3806 1548 3970 1720 4250 1850C4950 2180 6060 2400 10400 3170V27000H-6100V7560C-3030 4800-650 2550 1650 1790Z',grad(c,2000,1600,3700,7000,[[0,'#807154'],[.11,'#746b50'],[.35,'#616149'],[.7,'#485642'],[1,'#344c3c']]));
 // Lower colluvium follows broad, unequal settling fronts. The colour
 // intervals narrow with distance below the bank; there are no crescent
 // emblems, uniform bands or transparent ends.
 fill(c,'M1070 2090C1492 1892 1734 1802 1902 1810Q1990 1810 2071 1771C2135 1742 2180 1736 2246 1743Q2096 1821 2022 1912C1902 2061 1704 2140 1435 2260C995 2454 325 2692-460 2970L-6100 6270V27000H10400V4610C7080 3340 4450 2767 2770 2560Q1970 2460 1070 2547Z',grad(c,1900,1800,2200,5500,[[0,'#7c7053'],[.2,'#70694f'],[.65,'#586047'],[1,'#3c513e']]));
 fill(c,'M3115 1703Q3260 1653 3380 1700C3476 1734 3532 1805 3629 1832Q3782 1870 3959 1873C3789 1951 3571 1920 3419 1875Q3250 1819 3115 1803Z',grad(c,3100,1700,700,450,[[0,'#786e52'],[.5,'#736a4f'],[1,'#6e674e']]));
 fill(c,'M2160 1733Q2231 1694 2288 1693C2246 1754 2204 1784 2171 1842Q2140 1894 2135 1931C2088 1856 2092 1792 2160 1733Z',grad(c,2090,1700,300,550,[[0,'#6e664d'],[1,'#70684f']]));
 // Sparse, grounded woody scrub. Curving stems sit under unequal torn leaf
 // planes; these are three local plants, not a field of repeated leaves.
 const scrub=[
  [2490,1500,.9,'M-50 7Q-56-4-44-10L-46-26-31-23Q-32-43-17-41L-8-60 5-51 18-64 29-50 25-37 42-39 44-21 56-16 49-3 58 7 39 13 16 8-6 16-24 11-44 17Z','M-44-10L-46-26-31-23Q-32-43-17-41L-8-60 5-51-1-34-17-27-25-11-38-6Z M18-64L29-50 25-37 42-39 44-21 29-14 20-25 11-21 17-39Z'],
  [3180,1612,.82,'M-51 7L-45-4-52-14-40-24-29-21-23-41-9-40-4-56 8-59 16-44 31-47 37-32 33-23 48-17 46-5 57 4 41 14 24 9 3 18-12 12-32 18Z','M-40-24L-29-21-23-41-9-40-4-56 8-59 16-44 8-29-7-25-14-10-31-6Z M31-47L37-32 33-23 48-17 36-9 20-18 19-29Z'],
  [3552,1492,.72,'M-55 10L-49-4-34-8-35-22-20-27-20-40-6-46 6-34 21-39 29-26 41-25 43-10 57-6 52 9 31 16 10 10-9 19-30 12Z','M-34-8L-35-22-20-27-20-40-6-46 6-34-2-24-14-22-17-8Z M21-39L29-26 41-25 43-10 30-3 16-14 15-24Z']
 ];
 for(const[x,y,k,body,lit]of scrub){c.save();c.translate(x,y);c.scale(k,k);fill(c,'M-48 10Q-9 1 51 9L60 16Q8 23-54 19Z','#545b4280');c.strokeStyle='#615f43';c.lineWidth=3;c.lineCap='round';c.stroke(p('M0 12Q-3-10-11-35M-1 8Q15-6 25-29M-12-1L-30-15'));fill(c,body,'#45533b');fill(c,lit,'#626d43');c.restore();}
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
