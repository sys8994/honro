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
 // A broad lower apron receives soil from both hollows. The quiet planes
 // remain connected below the eventual rock exposures and overlap their toes.
 fill(c,'M1450 2360C1640 2265 1770 2350 1955 2300Q2110 2245 2225 2320L2335 2370Q2490 2340 2600 2410L2760 2400 2890 2500Q2770 2595 2600 2565L2440 2610 2270 2560 2100 2610Q1930 2515 1780 2550L1620 2500 1485 2520Z',grad(c,1500,2310,1400,1150,[[0,'#7c6c4d'],[.45,'#656046'],[1,'#4f5942']]));
 fill(c,'M3030 1550C3180 1510 3250 1570 3370 1535L3480 1490Q3610 1460 3700 1550L3760 1650Q3640 1700 3535 1650L3400 1680 3290 1630Q3170 1650 3075 1615Z',grad(c,3060,1500,1000,700,[[0,'#786d50'],[1,'#5c6045']]));
 fill(c,'M3460 2070Q3620 2000 3760 2090L3880 2150 4015 2125Q4210 2130 4300 2280L4220 2360 4060 2320 3890 2360 3740 2295 3580 2320 3475 2220Z',grad(c,3450,2070,1100,1000,[[0,'#726b4f'],[1,'#505d44']]));
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
