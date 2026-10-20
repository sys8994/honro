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
 // One bank exposure, each module used once. H=80 in the source study
 // maps to the actual adult H=103.5 world units (scale 1.29375).
 const part=G.HonroVectorCampaignMaterials.part,S=103.5/80;
 // The recessed shoulder is behind both neighbours and deliberately darker.
 part(c,'ferry-shoulder',{x:2850,y:900,sx:S,rotation:-.12,tone:-.2});
 part(c,'ferry-shelf',{x:2050,y:900,sx:S});
 part(c,'ferry-fan',{x:2550,y:1290,sx:S,rotation:-.12});
 // The foreground fan lies lower and in front of the two bank exposures.
 // It conceals the shoulder's lower-left bearing; the three are not a tile
 // row along the walk edge. Warm earth crosses the gaps and hides hard feet.
 fill(c,'M2020 1450Q2110 1438 2177 1467L2240 1458 2317 1490 2386 1478 2460 1521 2534 1510 2604 1560 2580 1640 2494 1620 2411 1571 2331 1584 2250 1541 2160 1557 2081 1519 1990 1530Z',grad(c,2000,1440,900,1000,[[0,'#7c7055'],[.4,'#68634b'],[1,'#536047']]));
 fill(c,'M3510 1370Q3590 1340 3661 1383L3730 1370 3795 1425 3880 1438 3950 1510Q3880 1570 3790 1527L3718 1494 3650 1511 3571 1468 3490 1460Z',grad(c,3500,1370,850,1100,[[0,'#756d52'],[1,'#546149']]));
 // Soil wraps the front toe and continues through the lower camera domain.
 // Its lip is unequal and interrupted by the fan's exposed wedges.
 fill(c,'M2440 1870Q2520 1810 2594 1845L2661 1809 2730 1830 2810 1792 2885 1819 2960 1774 3037 1802 3120 1760 3198 1785 3270 1742 3344 1770 3420 1734 3510 1781 3610 1760 3700 1820C4390 1990 4860 2420 5370 2820L10400 8720V27000H-6100V8240C-3520 5920-1400 4100 690 2910Q1760 2310 2440 1870Z',grad(c,2200,1810,2000,5600,[[0,'#68654c'],[.28,'#5b6149'],[.65,'#485843'],[1,'#354c3d']]));
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
