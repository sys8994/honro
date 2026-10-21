(function(G){'use strict';
// The rear geography is explicitly scenery; real ledges retain exact collision
// silhouettes and bright walk rims. The convoy road passes in front of it.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,cache=new WeakMap(),terrainCache=new WeakMap(),active=b=>G.HonroStage2LayeredRoad.active(b);
const path=ps=>{const p=new Path2D();ps.forEach((v,i)=>i?p.lineTo(v.x??v[0],v.y??v[1]):p.moveTo(v.x??v[0],v.y??v[1]));p.closePath();return p;};
const beds=[
 ['#486460',[[-6000,740],[0,760],[250,850],[530,930],[480,1190],[210,1280],[20,1650],[-6000,1750]]],
 ['#314b53',[[0,1750],[210,1280],[480,1190],[540,1520],[450,1860],[540,2110],[420,2130],[0,2220],[-6000,2290],[-6000,1830]]],
 ['#516b64',[[4300,1320],[4130,1140],[3980,1550],[3900,1790],[4020,2070],[4300,2240],[10300,2090],[10300,1180]]],
 ['#64796f',[[0,610],[340,620],[650,660],[840,830],[810,1110],[650,1260],[480,1190],[530,930],[250,850],[0,890]]],
 ['#4c6864',[[820,840],[970,870],[1200,1070],[1110,1390],[1260,1600],[1160,1850],[930,1900],[1010,1590],[910,1410]]],
 ['#28434c',[[590,1200],[650,1260],[810,1110],[850,1290],[790,1510],[920,1710],[850,2010],[670,2200],[540,2110],[650,1850],[610,1570]]],
 ['#5d7569',[[970,1920],[1190,1850],[1370,2040],[1330,2250],[1480,2460],[1690,2740],[1430,2770],[1210,2500],[1150,2300],[940,2170]]],
 ['#314b50',[[0,2220],[420,2130],[540,2230],[670,2200],[800,2380],[1060,2460],[1210,2720],[830,2810],[0,2790]]],
 ['#6a7e70',[[3730,700],[4000,620],[4300,620],[4300,1100],[4000,1030],[3830,1210],[3630,1170],[3570,1030]]],
 ['#496765',[[3500,1250],[3630,1170],[3830,1210],[3760,1490],[3570,1630],[3470,1890],[3230,2000],[3260,1750],[3400,1530]]],
 ['#2b4751',[[3930,1100],[4130,1140],[4300,1100],[4300,2240],[4020,2070],[3900,1790],[3980,1550]]],
 ['#5d766a',[[3210,2090],[3470,1980],[3620,2160],[3510,2350],[3600,2570],[3370,2770],[3090,2780],[3160,2470]]],
 ['#304b52',[[3620,2160],[3900,2130],[4150,2300],[4300,2190],[4300,2820],[3680,2780],[3510,2350]]]
].map(([color,ps])=>({color,path:path(ps)}));
function prepare(b){const data=b.honroMap.stage2LayeredRoad;let q=cache.get(data);if(q)return q;q={cliffs:data.rearCliffs.map(p=>({id:p.id,shape:path(p.points)})),shoulder:path([[-6000,2780],[0,2780],[1000,2770],[1800,2790],[2500,2775],[3300,2785],[4300,2775],[10300,2780],[10300,2880],[-6000,2880]])};cache.set(data,q);return q;}
function rear(c,b){if(!active(b))return;const q=prepare(b);c.save();for(const cliff of q.cliffs){c.save();c.clip(cliff.shape);c.fillStyle=cliff.id==='west-rear'?'#3a5359':'#3c555d';c.fill(cliff.shape);for(const face of beds){c.fillStyle=face.color;c.fill(face.path);}c.restore();}
 // A broad, quiet rear shoulder hides the distant cliff feet. Only the actual
 // road at2860 receives a walk rim; this band is not another platform.
 c.fillStyle='#656c51';c.fill(q.shoulder);c.restore();}
const layer=S._landmarkLayer;S._landmarkLayer=function(c,ls,name){if(name==='back'&&active(this.battle))rear(c,this.battle);return layer.call(this,c,ls,name);};
function road(c,t,b){if(!active(b)||t.id!=='canyon-ground')return false;let q=terrainCache.get(t);if(!q||q.vertices!==t.vertices){q={vertices:t.vertices,shape:path(C.poly(t))};terrainCache.set(t,q);}c.save();c.clip(q.shape);const g=c.createLinearGradient(0,2860,0,3580);g.addColorStop(0,'#8d8260');g.addColorStop(.14,'#6c694f');g.addColorStop(.6,'#455046');g.addColorStop(1,'#293c38');c.fillStyle=g;c.fill(q.shape);c.fillStyle='#b2a17a55';c.fillRect(-6000,2860,16300,24);
 c.fillStyle='#33463b55';c.fill(path([[420,3000],[940,2940],[1260,2980],[1440,3130],[1010,3240],[690,3180]]));c.fillStyle='#9a947146';c.fill(path([[1750,2930],[2350,2900],[2780,2990],[2920,3140],[2580,3090],[2240,3150],[1920,3050]]));c.fillStyle='#31483e77';c.fill(path([[3140,3000],[3580,2940],[4140,2990],[4300,3180],[3890,3240],[3570,3150],[3260,3190]]));c.restore();return true;}
const terrain=S.terrain;S.terrain=function(c,t){if(road(c,t,this.battle))return;return terrain.call(this,c,t);};
G.HonroStage2LayeredRoadArt={active,prepare,rear,road};
})(globalThis);
