(function(G){'use strict';
// Rear rock is scenery. Only the authored caps, boughs and front road collide.
// Every secondary mass is authored once in world space and cached as Path2D.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,cache=new WeakMap(),terrainCache=new WeakMap(),active=b=>G.HonroStage2LayeredRoad.active(b);
const path=(ps,closed=true)=>{const p=new Path2D();ps.forEach((v,i)=>i?p.lineTo(v.x??v[0],v.y??v[1]):p.moveTo(v.x??v[0],v.y??v[1]));if(closed)p.closePath();return p;};
const faces=rows=>rows.map(([color,points])=>({color,shape:path(points)}));
// Broad folded beds and intervening clefts continue past both camera margins.
// No seam is aligned with the play-bound edges x0/4300 or repeated in a grid.
const west=faces([
 ['#506257',[[-6000,310],[-1060,330],[-720,470],[-360,520],[-120,690],[160,740],[450,900],[510,1120],[380,1330],[570,1520],[490,1760],[160,1840],[-330,1740],[-960,1860],[-6000,1750]]],
 ['#42584f',[[-6000,1740],[-960,1860],[-330,1740],[160,1840],[490,1760],[650,1950],[550,2140],[790,2350],[840,2580],[1120,2760],[610,2840],[-6000,2900]]],
 ['#63715d',[[-370,560],[-110,690],[160,810],[310,1050],[250,1320],[460,1520],[390,1810],[160,1840],[-80,1620],[-30,1320],[-150,1000]]],
 ['#65715c',[[210,1660],[410,1690],[580,1900],[500,2140],[660,2350],[610,2560],[800,2730],[520,2790],[280,2510],[310,2190],[120,1920]]],
 ['#2c4545',[[410,900],[530,1010],[480,1240],[650,1450],[590,1650],[740,1890],[720,2130],[930,2380],[970,2580],[1260,2740],[1120,2800],[810,2600],[690,2360],[510,2150],[540,1940],[390,1710],[440,1490],[300,1300]]],
 ['#5d705f',[[570,770],[840,840],[1090,1020],[1040,1270],[1230,1460],[1130,1580],[940,1390],[760,1150],[790,960]]],
 ['#596e5b',[[900,1510],[1140,1550],[1290,1720],[1370,1990],[1250,2110],[1070,2080],[1020,1930],[920,1810]]],
 ['#5f715b',[[1140,2020],[1350,2000],[1460,2200],[1510,2430],[1720,2720],[1500,2770],[1290,2520],[1190,2300]]],
 ['#79816a',[[360,650],[650,660],[770,750],[850,890],[780,1020],[670,970],[610,850],[460,810]]],
 ['#465e52',[[760,1090],[950,1110],[1110,1200],[1280,1300],[1110,1380],[960,1395],[840,1340],[790,1230]]],
 ['#77816b',[[790,1180],[1020,1220],[1170,1290],[1100,1330],[960,1310],[850,1320]]],
 ['#334d48',[[810,1600],[1060,1670],[1210,1800],[1450,1980],[1290,2150],[1100,2040],[1040,1850],[900,1770]]],
 ['#748068',[[1000,1830],[1220,1870],[1430,1940],[1510,2030],[1350,2050],[1170,1970],[1080,1970]]],
 ['#526a55',[[970,2240],[1190,2350],[1320,2450],[1580,2500],[1720,2620],[1580,2780],[1390,2760],[1190,2570],[1050,2490]]],
 ['#778068',[[1190,2380],[1420,2420],[1580,2490],[1650,2590],[1500,2620],[1360,2520],[1280,2510]]],
 ['#344e45',[[-840,2500],[-490,2450],[-160,2580],[120,2540],[330,2700],[600,2735],[810,2810],[510,2865],[-390,2860],[-1040,2760],[-6000,2900],[-6000,2640]]],
 ['#61735b',[[-430,2580],[-190,2580],[-50,2650],[190,2640],[310,2720],[130,2760],[-40,2730],[-240,2770],[-510,2700]]],
 ['#576b55',[[510,2600],[690,2550],[790,2680],[1000,2740],[1190,2810],[980,2850],[790,2780],[610,2790],[460,2720]]]
]);
const east=faces([
 ['#5a6c5c',[[3730,570],[4140,460],[4900,310],[10300,180],[10300,1590],[4940,1700],[4510,1550],[4140,1610],[3830,1430],[3710,1210],[3560,1120],[3570,880]]],
 ['#3d5550',[[4140,1610],[4510,1550],[4940,1700],[10300,1590],[10300,2900],[4570,2870],[4120,2770],[3860,2580],[3960,2330],[3770,2050],[3820,1820]]],
 ['#7a826b',[[3820,700],[4160,610],[4440,780],[4690,730],[4910,840],[4890,1100],[4660,1200],[4390,1040],[4150,1100],[3930,990],[3790,1070],[3680,940]]],
 ['#2d4747',[[3950,1120],[4250,1160],[4380,1400],[4300,1750],[4490,2040],[4420,2500],[4700,2780],[4360,2850],[4050,2580],[4080,2200],[3920,1950],[3980,1550]]],
 ['#647660',[[3490,1140],[3700,1120],[3810,1260],[3690,1500],[3600,1690],[3450,1810],[3500,2020],[3370,2160],[3240,2080],[3270,1720],[3400,1510]]],
 ['#64735c',[[3240,1980],[3410,2140],[3360,2370],[3250,2550],[3330,2780],[3080,2810],[3110,2560],[3190,2360],[3130,2170]]],
 ['#829078',[[3360,1460],[3560,1480],[3650,1580],[3570,1640],[3390,1670],[3260,1650]]],
 ['#314c46',[[3550,1740],[3690,1570],[3840,1700],[3760,1940],[3870,2120],[3750,2280],[3840,2550],[3700,2760],[3450,2820],[3510,2600],[3410,2390],[3520,2150],[3440,1970]]],
 ['#778269',[[3150,2210],[3350,2250],[3450,2350],[3390,2460],[3240,2490],[3090,2430],[3020,2380]]],
 ['#526b54',[[3620,2530],[3810,2450],[3980,2630],[4240,2660],[4500,2820],[4200,2870],[3930,2800],[3650,2840],[3460,2770]]],
 ['#6c7a60',[[3970,2660],[4170,2670],[4330,2770],[4560,2800],[4690,2860],[4430,2890],[4230,2820],[4060,2835]]]
]);
// Irregular low rock feet, contact pockets and sparse vegetation stay BEHIND
// every actor. Their subdued faces have no walk rim and never imply a new wall.
const feet=faces([
 ['#536149',[[-6000,2780],[-540,2760],[-290,2790],[-90,2740],[80,2760],[170,2810],[420,2780],[560,2815],[770,2770],[930,2805],[1120,2765],[1320,2820],[1510,2785],[1750,2820],[1900,2845],[2160,2820],[2350,2840],[2540,2815],[2770,2840],[2960,2800],[3190,2780],[3410,2810],[3630,2750],[3860,2790],[4090,2760],[4370,2800],[4620,2760],[10300,2780],[10300,2880],[-6000,2880]]],
 ['#2e443b',[[-540,2820],[-290,2790],[-110,2815],[70,2820],[180,2840],[430,2830],[610,2853],[370,2860],[-220,2855],[-510,2860]]],
 ['#36483c',[[740,2828],[940,2808],[1160,2838],[1380,2820],[1570,2840],[1790,2850],[1680,2860],[1320,2855],[1060,2860],[820,2855]]],
 ['#35483d',[[2920,2840],[3170,2805],[3350,2830],[3520,2820],[3790,2840],[4020,2810],[4190,2840],[4500,2855],[4090,2860],[3670,2850],[3300,2860]]],
 ['#7a8060',[[-120,2785],[-50,2748],[64,2770],[120,2810],[50,2822],[-70,2810]]],
 ['#667557',[[710,2808],[750,2775],[820,2772],[900,2804],[855,2822],[775,2820]]],
 ['#788263',[[1180,2810],[1220,2777],[1310,2796],[1370,2825],[1310,2838],[1240,2825]]],
 ['#71805e',[[3060,2798],[3105,2755],[3190,2768],[3250,2814],[3190,2830],[3125,2820]]],
 ['#7c8261',[[3660,2780],[3710,2748],[3800,2782],[3840,2810],[3750,2825],[3680,2815]]],
 ['#43573e',[[640,2820],[625,2785],[650,2805],[667,2770],[678,2808],[702,2792],[695,2822]]],
 ['#516244',[[1450,2836],[1436,2800],[1458,2820],[1478,2780],[1483,2822],[1512,2801],[1504,2836]]],
 ['#4a5e41',[[2800,2840],[2792,2807],[2810,2823],[2834,2786],[2837,2821],[2863,2807],[2856,2840]]],
 ['#4c5e41',[[3950,2836],[3938,2805],[3954,2818],[3978,2783],[3980,2820],[4002,2805],[4008,2836]]]
]);
const roadPlanes=faces([
 ['#33463b55',[[420,3000],[940,2940],[1260,2980],[1440,3130],[1010,3240],[690,3180]]],
 ['#9a947146',[[1750,2930],[2350,2900],[2780,2990],[2920,3140],[2580,3090],[2240,3150],[1920,3050]]],
 ['#31483e77',[[3140,3000],[3580,2940],[4140,2990],[4300,3180],[3890,3240],[3570,3150],[3260,3190]]]
]);
function prepare(b){const data=b.honroMap.stage2LayeredRoad;let q=cache.get(data);if(q)return q;q={cliffs:data.rearCliffs.map(p=>({id:p.id,shape:path(p.points)}))};cache.set(data,q);return q;}
function paint(c,fs){for(const f of fs){c.fillStyle=f.color;c.fill(f.shape);}}
function rear(c,b){if(!active(b))return;const q=prepare(b);c.save();for(const cliff of q.cliffs){c.save();c.clip(cliff.shape);c.fillStyle='#3c554f';c.fill(cliff.shape);paint(c,cliff.id==='west-rear'?west:east);c.restore();}paint(c,feet);c.restore();}
const layer=S._landmarkLayer;S._landmarkLayer=function(c,ls,name){if(name==='back'&&active(this.battle))rear(c,this.battle);return layer.call(this,c,ls,name);};
function inside(x,y,ps){let yes=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){const a=ps[i],z=ps[j];if((a.y>y)!==(z.y>y)&&x<(z.x-a.x)*(y-a.y)/(z.y-a.y)+a.x)yes=!yes;}return yes;}
function terrainShape(t,b){let q=terrainCache.get(t);if(q?.vertices===t.vertices)return q;const ps=C.poly(t),top=[];for(let i=0;i<ps.length-1;i++){const a=ps[i],z=ps[i+1];if(z.x>a.x+.01){top.push([a,z]);}}const exposed=new Path2D();if(b)for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];if(z.x>a.x)continue;if(!b.honroMap.stage2LayeredRoad.rearCliffs.some(p=>inside((a.x+z.x)/2,(a.y+z.y)/2,p.points))){exposed.moveTo(a.x,a.y);exposed.lineTo(z.x,z.y);}}q={vertices:t.vertices,shape:path(ps),exposed,rims:top.map(edge=>path(edge,false)),caps:top.map(([a,z])=>path([[a.x,a.y],[z.x,z.y],[z.x-15,z.y+28],[a.x+8,a.y+35]]))};terrainCache.set(t,q);return q;}
function ledge(c,t,b){if(!active(b)||t.mat!=='rock'||!b.honroMap.stage2LayeredRoad.collisionRoles.supports.includes(t.id))return false;const q=terrainShape(t,b);c.save();c.clip(q.shape);c.fillStyle='#4c6256';c.fill(q.shape);paint(c,t.id.startsWith('left')?west:east);c.fillStyle='#91a08355';for(const cap of q.caps)c.fill(cap);c.restore();
 return true;}
function road(c,t,b){if(!active(b)||t.id!=='canyon-ground')return false;const q=terrainShape(t,b);c.save();c.clip(q.shape);const g=c.createLinearGradient(0,2860,0,3580);g.addColorStop(0,'#8d8260');g.addColorStop(.14,'#6c694f');g.addColorStop(.6,'#455046');g.addColorStop(1,'#293c38');c.fillStyle=g;c.fill(q.shape);c.fillStyle='#b2a17a55';c.fillRect(-6000,2860,16300,24);paint(c,roadPlanes);c.restore();return true;}
const terrain=S.terrain;S.terrain=function(c,t){if(road(c,t,this.battle)||ledge(c,t,this.battle))return;return terrain.call(this,c,t);};
const omitReadability=(group,b)=>active(b)&&b.honroMap.stage2LayeredRoad.collisionRoles.supports.includes(group.id)&&!group.wood;
const oldReadability=S.terrainReadability;S.terrainReadability=function(c,b,view){oldReadability.call(this,c,b,view);if(!active(b))return;const raster=this._staticCacheBuild?this._worldRasterScale(b,this.canvas.clientWidth):this.scale,unit=1/Math.max(.05,raster);c.save();c.lineJoin='round';for(const t of G.HonroTerrainDomain.render(b)){if(t.mat!=='rock'||!b.honroMap.stage2LayeredRoad.collisionRoles.supports.includes(t.id))continue;const q=terrainShape(t,b);c.strokeStyle='#263d3877';c.lineWidth=1.15*unit;c.stroke(q.exposed);c.strokeStyle='#263e39';c.lineWidth=2.2*unit;for(const rim of q.rims)c.stroke(rim);c.strokeStyle='#bcc3a0';c.lineWidth=1.15*unit;for(const rim of q.rims)c.stroke(rim);}c.restore();};
G.HonroStage2LayeredRoadArt={active,prepare,terrainShape,rear,ledge,road,omitReadability};
})(globalThis);
