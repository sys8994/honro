(function(G){'use strict';
// One ferry foreground: bounded native source regions at local actor scale,
// bearing soil shoulders and alluvium authored in world coordinates.
// Existing world tiles cache the finished paths; no raster foreground.
const paths=new Map(),surfaces=new WeakMap(),C=G.HONRO_CORE;
function p(d){if(!paths.has(d))paths.set(d,new Path2D(d));return paths.get(d);}
function fill(c,d,paint){c.fillStyle=paint;c.fill(p(d));}
function grad(c,x,y,w,h,stops){const g=c.createLinearGradient(x,y,x+w,y+h);for(const[a,v]of stops)g.addColorStop(a,v);return g;}
const FIELD=G.HONRO_FERRY_FOREGROUND;
const geometry=FIELD.paths.slice(1).map(n=>({...n,path:p(n.d)}));
const intersects=(a,b)=>a[0]<=b[2]&&a[2]>=b[0]&&a[1]<=b[3]&&a[3]>=b[1];
// Unique source windows follow rock shoulders rather than sheet rectangles.
// 1.8–2.2world/source px maps an adult to 47–58source px (103.5world).
const formations=[
 [[1000,0,660,650],[2980,810,1.8],'M35 0H660V328L617 359 600 408 565 426 541 482 498 507 475 553 430 567 386 613 310 636 263 622 214 650 167 620 137 634 100 581 71 555 88 498 44 461 63 414 22 370 39 306 14 259 32 191 9 143Z'],
 [[360,150,760,580],[3950,1510,1.9],'M80 0L219 18 322 0 413 24 559 4 676 41 760 108V339L706 365 680 400 625 413 598 453 536 463 505 506 442 519 399 551 320 540 273 580 218 549 160 560 141 519 88 502 101 461 52 432 74 383 29 348 44 288 0 233 28 170 15 118 56 80Z'],
 [[0,90,650,390],[-1350,1850,2.2],'M0 82L77 41 163 53 238 17 319 32 407 0 481 31 547 18 607 60 650 128V246L598 265 571 301 520 314 474 356 403 344 340 376 271 357 202 390 153 365 100 378 46 342 0 330Z'],
 [[900,240,600,510],[250,1740,1.8],'M0 126L52 71 120 50 176 12 255 37 319 0 411 31 470 14 548 69 600 163V329L551 358 528 407 473 429 438 476 369 461 310 510 252 483 188 499 143 455 88 449 60 390 13 369 28 311 0 267Z'],
 [[120,280,900,520],[1610,1430,1.8],'M30 93L107 53 186 66 260 13 332 35 416 0 491 24 568 7 630 43 712 28 785 71 846 59 900 117V355L856 378 829 413 765 430 727 472 647 453 582 496 519 477 446 520 382 492 312 504 252 471 190 479 145 436 91 429 59 375 15 348 37 297 0 251 24 193Z'],
 [[0,500,820,441],[-250,2740,2],'M0 101L87 54 158 78 246 30 320 45 415 0 506 21 588 12 664 59 747 40 820 99V329L759 348 696 391 629 375 550 421 480 407 396 441 318 417 245 435 176 410 112 423 59 375 0 367Z'],
 [[480,500,1000,441],[1690,2690,2.05],'M0 125L91 80 183 94 269 36 355 58 441 0 533 29 620 17 695 57 782 36 867 75 930 65 1000 114V348L920 375 848 366 776 414 698 398 622 436 546 420 467 441 390 410 322 426 238 392 163 402 99 363 35 373 0 331Z'],
 [[1280,240,390,650],[3850,2850,2],'M40 0L117 28 190 7 262 40 335 27 390 89V490L353 527 308 544 285 598 225 620 180 650 136 626 88 640 65 587 18 564 36 504 0 457 25 396 5 336 29 274 11 222 37 167 20 113Z']
].map(([r,w,d])=>{const area=[r[0],r[1],r[0]+r[2],r[1]+r[3]];return{r,w,clip:p(d),bounds:[w[0],w[1],w[0]+r[2]*w[2],w[1]+r[3]*w[2]],parts:geometry.filter(g=>intersects(g.bounds,area))};});
function formation(c,f,view){if(view&&!intersects(f.bounds,[view.x,view.y,view.x+view.w,view.y+view.h]))return;const[r,w]=[f.r,f.w];c.save();c.translate(w[0],w[1]);c.scale(w[2],w[2]);c.clip(f.clip);c.translate(-r[0],-r[1]);const v=view?[r[0]+(view.x-w[0])/w[2],r[1]+(view.y-w[1])/w[2],r[0]+(view.x+view.w-w[0])/w[2],r[1]+(view.y+view.h-w[1])/w[2]]:null;for(const n of f.parts){if(v&&!intersects(n.bounds,v))continue;c.fillStyle=n.fill;c.fill(n.path,'evenodd');c.strokeStyle=n.fill;c.lineJoin='round';c.lineWidth=.45;c.stroke(n.path);}c.restore();}
function draw(c,b,view){if(b?.honroStage!==3)return;c.save();
 c.fillStyle=grad(c,-600,800,3500,14000,[[0,'#776e58'],[.12,'#716851'],[.3,'#62634f'],[.58,'#505b49'],[1,'#344b3d']]);c.fillRect(-6100,400,16500,25500);
 // Load-bearing soil masses overlap at unequal heights; their lower faces
 // remain opaque all the way through the camera domain.
 fill(c,'M-6100 1800C-3520 1780-2100 1550-850 1660C10 1730 444 1395 1090 1450C1610 1490 1920 1270 2400 1430C2790 1590 3230 1410 3590 1680C4140 2080 4720 2230 5480 2490L10400 5100V27000H-6100Z',grad(c,700,1600,1600,5600,[[0,'#837354'],[.3,'#6c674e'],[.7,'#565d48'],[1,'#3f513e']]));
 fill(c,'M3270 830C3620 710 3930 945 4300 1030C4820 1150 5170 1490 5660 1710L10400 3430V27000H2780C2820 5900 3720 3550 3850 2420C3910 1890 3440 1450 3270 830Z',grad(c,3550,950,2600,5800,[[0,'#8b7957'],[.2,'#776d51'],[.6,'#5b614b'],[1,'#3d523e']]));
 for(const f of formations)formation(c,f,view);
 // Colluvium arrives through three hollows, partly burying the fractured
 // feet. Each shape has a distinct source and direction, never a U-frame.
 fill(c,'M-6100 2080C-3150 2080-1710 2050-1090 2180C-480 2310-280 2520 110 2530Q264 2540 415 2480L476 2467 505 2495 553 2474 592 2508 650 2491 709 2525 764 2509 816 2542Q1150 2660 1430 2910L1800 3590C974 3400 488 3270-110 3180L-6100 4050Z',grad(c,-300,2300,1800,2700,[[0,'#807052'],[.23,'#73694d'],[.6,'#62634b'],[1,'#4d5a44']]));
 fill(c,'M1570 1540Q1724 1510 1852 1582L1889 1590 1919 1613 1957 1610 1994 1640 2032 1641 2072 1674C2260 1782 2204 1958 2385 2090Q2570 2215 2730 2165L2777 2160 2816 2181 2859 2172 2905 2206 2955 2201 3006 2239Q3270 2370 3500 2620C3005 2515 2730 2465 2470 2420C2240 2380 1975 2150 1890 1990Q1770 1760 1570 1540Z',grad(c,1800,1660,1400,1500,[[0,'#877553'],[.3,'#7a6d4e'],[.68,'#69664c'],[1,'#566049']]));
 fill(c,'M4120 2010Q4224 1970 4320 2040L4353 2049 4378 2076 4410 2074 4437 2105 4484 2102 4525 2142C4780 2320 4910 2550 5130 2660C5520 2870 5800 3300 10400 4500V27000H4480C4400 7100 5000 4070 4680 3000C4570 2630 4370 2260 4120 2010Z',grad(c,4390,2200,1500,5100,[[0,'#807151'],[.25,'#70694d'],[.63,'#59604a'],[1,'#3b503d']]));
 // A returning bank face and two shallow erosion channels give the earth
 // its own volume without a repeated stripe texture.
 fill(c,'M113 2550C575 2594 933 2790 1203 3070Q826 2908 493 2841C190 2793-210 2760-505 2684Q-190 2688 113 2550Z','#625e48');
 fill(c,'M2044 1766C2180 1860 2200 1980 2370 2108Q2520 2221 2700 2218C2460 2268 2280 2181 2204 2098Q2090 1980 2044 1766Z','#625c44');
 fill(c,'M4525 2200C4700 2380 4740 2550 4920 2690L5140 2820C4850 2750 4730 2635 4667 2485Q4618 2325 4525 2200Z','#5b5b45');
 // Unequal road shoulders cover the source cuts at the actual contact line.
 const t=b.terrain.find(t=>t.id==='ferry-ground'&&!t.broken);if(t){const q=[[0,73],[240,106],[480,67],[740,121],[980,81],[1220,146],[1480,77],[1730,123],[1990,69],[2240,118],[2480,89],[2730,151],[2980,93],[3210,73],[3430,118],[3660,77],[3890,132],[4100,91],[4276,67]];const d='M'+q.map(([x])=>x+','+(C.topAt(t,x,t.y)+8)).join('L')+'L'+q.toReversed().map(([x,w])=>x+','+(C.topAt(t,x,t.y)+w)).join('L')+'Z';fill(c,d,grad(c,1800,700,1800,1700,[[0,'#8d7955'],[.27,'#81704e'],[.64,'#6e654a'],[1,'#5d5d46']]));}
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
