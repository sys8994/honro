(function(G){'use strict';
// Front-facing material sculptures, in world units. These paths are cached by
// the common world tiles. They never author a playable edge or modify a solid.
const C=G.HONRO_CORE,A=G.HonroEnvironmentArt;
const paths=new Map(),path=d=>{if(!paths.has(d))paths.set(d,new Path2D(d));return paths.get(d);},poly=ps=>{const p=new Path2D();ps.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p;};
const DATA=G.HONRO_VECTOR_CAMPAIGN_PARTS;
function stoneColor(value,cave,deep){if(!/^#[0-9a-f]{6}$/i.test(value))return value;const rgb=[1,3,5].map(i=>parseInt(value.slice(i,i+2),16)),lum=rgb[0]*.26+rgb[1]*.58+rgb[2]*.16,target=cave?[lum*.53,lum*.62,lum*.68]:[lum*.57,lum*.63,lum*.57];return '#'+target.map((v,i)=>Math.round(v*(deep?.76:1)).toString(16).padStart(2,'0')).join('');}
function matrix(c,value){if(!value)return;for(const match of value.matchAll(/(translate|scale|rotate|matrix)\(([^)]+)\)/g)){const ns=match[2].trim().split(/[ ,]+/).map(Number);if(match[1]==='translate')c.translate(ns[0],ns[1]||0);else if(match[1]==='scale')c.scale(ns[0],ns[1]??ns[0]);else if(match[1]==='rotate')c.rotate(ns[0]*Math.PI/180);else c.transform(...ns);}}
function part(c,id,{x=0,y=0,sx=1,sy=sx,rotation=0,tone=0,cave=false,deep=false}={}){const source=DATA.parts[id];if(!source)return;const stone=/granite|rock|slab/.test(id),tint=v=>stone?stoneColor(v,cave,deep):v,paints={};
 const paint=(v,n)=>{if(!v?.startsWith('url('))return tint(v);const id=v.slice(5,-1),key=id+':'+n.bounds;if(paints[key])return paints[key];const def=DATA.gradients[id];if(!def)return '#3c524e';const percent=def.gradientUnits!=='userSpaceOnUse',box=n.bounds||[0,0,1,1],num=(name,fallback=0)=>{const value=def[name]??fallback;return parseFloat(value)/(String(value).includes('%')?100:1);};let g;
 if(def.type==='linearGradient'){const x=k=>percent?box[0]+num(k)*(box[2]-box[0]):num(k),y=k=>percent?box[1]+num(k)*(box[3]-box[1]):num(k);g=c.createLinearGradient(x('x1'),y('y1'),x('x2'),y('y2'));}
 else{c.save();if(percent){c.translate(box[0],box[1]);c.scale(Math.max(.01,box[2]-box[0]),Math.max(.01,box[3]-box[1]));}g=c.createRadialGradient(num('fx',def.cx),num('fy',def.cy),0,num('cx'),num('cy'),num('r',1));c.restore();}
 for(const s of def.stops){const offset=s.offset||'0';g.addColorStop(parseFloat(offset)/(offset.includes('%')?100:1),tint(s['stop-color'])+Math.round(Number(s['stop-opacity']??1)*255).toString(16).padStart(2,'0'));}return paints[key]=g;};
 const draw=(n,inherited={fill:'#000000',stroke:'none','stroke-width':1})=>{c.save();matrix(c,n.transform);c.globalAlpha*=Number(n.opacity??1);const style={...inherited,...n};if(n['clip-path']){const group=DATA.clips[n['clip-path'].slice(5,-1)];if(group){const clip=new Path2D();for(const p of group)if(p.d)clip.addPath(path(p.d));c.clip(clip);}}if(n.tag==='path'){if(style.fill!=='none'){c.fillStyle=paint(style.fill,n);c.fill(path(n.d));}if(style.stroke!=='none'){c.strokeStyle=paint(style.stroke,n);c.lineWidth=Number(style['stroke-width']);c.lineCap=style['stroke-linecap']||'round';c.lineJoin=style['stroke-linejoin']||'round';c.stroke(path(n.d));}}else for(const child of n.children||[])draw(child,style);c.restore();};
 c.save();c.translate(x,y);c.rotate(rotation);c.scale(sx,sy);draw(source);c.restore();}
// Artist-selected unequal exposures: each straddles neighbouring rock, soil
// and its contact shadow. Lower layers overlap; none has a rectangular foot.
const FRONT=[
 [[-700,110],[-310,-40],[20,40],[155,285],[21,640],[-290,740],[-670,510]],
 [[-70,35],[260,-50],[430,120],[351,430],[171,610],[-42,482],[-120,220]],
 [[322,112],[572,52],[763,191],[833,430],[635,721],[391,682],[316,432],[402,269]],
 [[706,54],[1035,-18],[1234,101],[1291,409],[1138,592],[889,533],[828,268]],
 [[1183,127],[1420,65],[1661,210],[1590,509],[1401,738],[1220,652],[1164,400]],
 [[1606,-8],[1924,54],[2104,230],[1987,520],[1720,573],[1629,346],[1690,178]],
 [[2037,73],[2302,14],[2546,155],[2511,384],[2323,562],[2151,480],[2094,251]],
 [[2479,117],[2799,31],[3004,229],[2910,481],[2711,690],[2503,603],[2448,338]],
 [[2982,24],[3260,50],[3410,211],[3354,492],[3145,631],[2991,481],[3045,285]],
 [[3367,99],[3625,-20],[3839,132],[3848,390],[3685,512],[3470,455],[3411,259]],
 [[3789,186],[4059,65],[4270,141],[4391,385],[4211,672],[3970,635],[3811,412]],
 [[4280,24],[4584,-35],[4805,108],[4771,409],[4567,535],[4391,410],[4357,199]],
 [[4756,173],[5020,80],[5266,191],[5290,439],[5075,617],[4872,557],[4790,350]],
 [[5231,27],[5496,-17],[5731,115],[5817,382],[5634,541],[5389,473],[5321,239]],
 [[5764,101],[6104,1],[6432,120],[6549,380],[6342,651],[6049,613],[5854,390]],
 [[-500,680],[-170,529],[106,649],[147,937],[-6,1228],[-300,1311],[-545,1056]],
 [[75,635],[303,528],[496,735],[448,1032],[275,1200],[85,1110],[33,867]],
 [[420,713],[701,609],[955,800],[929,1087],[709,1358],[472,1229],[404,980]],
 [[908,576],[1200,554],[1391,746],[1371,1030],[1176,1178],[975,1081],[1021,850]],
 [[1374,728],[1665,558],[1903,737],[1940,1003],[1681,1280],[1429,1165],[1358,926]],
 [[1870,650],[2164,504],[2401,637],[2465,919],[2213,1141],[1981,1085],[1901,888]],
 [[2365,773],[2611,604],[2858,739],[2913,1022],[2725,1298],[2475,1235],[2377,1018]],
 [[2862,654],[3150,548],[3417,714],[3376,980],[3161,1186],[2952,1067],[2999,844]],
 [[3389,712],[3700,547],[3963,673],[4041,958],[3799,1193],[3520,1115],[3401,925]],
 [[3982,671],[4255,592],[4461,777],[4410,1060],[4187,1260],[3995,1127],[4040,908]],
 [[4418,648],[4709,510],[4961,676],[5006,940],[4767,1156],[4530,1080],[4453,867]],
 [[4944,740],[5205,597],[5473,715],[5559,1000],[5350,1267],[5071,1219],[4973,1001]],
 [[5460,607],[5761,552],[6043,732],[6074,1021],[5814,1190],[5575,1097],[5504,876]],
 [[6038,729],[6349,581],[6642,760],[6696,1064],[6415,1349],[6174,1223],[6095,974]],
 [[-635,1341],[-228,1160],[135,1383],[185,1796],[-142,2041],[-530,1877],[-668,1584]],
 [[66,1260],[470,1159],[788,1408],[720,1749],[393,1980],[145,1803],[48,1513]],
 [[709,1378],[1104,1175],[1468,1383],[1561,1770],[1218,2058],[864,1931],[735,1690]],
 [[1447,1245],[1824,1150],[2169,1398],[2101,1798],[1804,1956],[1511,1779],[1571,1506]],
 [[2111,1349],[2510,1148],[2824,1355],[2907,1709],[2580,2015],[2252,1880],[2117,1620]],
 [[2822,1231],[3231,1113],[3555,1339],[3521,1709],[3217,1924],[2927,1786],[2981,1539]],
 [[3528,1337],[3893,1135],[4266,1349],[4353,1743],[4012,2021],[3679,1885],[3553,1633]],
 [[4298,1210],[4696,1129],[5011,1349],[4993,1751],[4674,1951],[4391,1809],[4434,1540]],
 [[4980,1322],[5351,1150],[5705,1352],[5804,1761],[5478,2058],[5149,1910],[5016,1671]],
 [[5748,1247],[6175,1131],[6541,1364],[6513,1781],[6163,2028],[5841,1816],[5899,1533]],
 [[-700,2110],[-110,1851],[429,2156],[467,2630],[-1,2911],[-537,2680],[-741,2366]],
 [[384,2004],[954,1866],[1442,2149],[1389,2610],[919,2903],[474,2651],[538,2329]],
 [[1381,2110],[1962,1852],[2458,2145],[2531,2617],[2042,2941],[1552,2718],[1421,2410]],
 [[2487,2003],[3053,1831],[3569,2117],[3548,2607],[3063,2875],[2606,2658],[2661,2318]],
 [[3535,2109],[4139,1838],[4618,2139],[4716,2611],[4240,2945],[3731,2717],[3571,2396]],
 [[4668,1996],[5261,1851],[5780,2131],[5723,2621],[5251,2925],[4771,2673],[4820,2341]],
 [[5727,2106],[6311,1837],[6854,2163],[6905,2640],[6423,2980],[5911,2751],[5784,2437]],
 [[-700,3010],[167,2665],[969,3086],[991,3789],[217,4223],[-579,3924],[-748,3478]],
 [[928,2891],[1759,2710],[2502,3091],[2467,3801],[1704,4237],[1065,3857],[1152,3374]],
 [[2457,3034],[3321,2694],[4059,3095],[4152,3787],[3409,4258],[2658,3940],[2503,3501]],
 [[4102,2879],[4961,2705],[5744,3089],[5693,3817],[4954,4254],[4246,3861],[4316,3379]],
 [[5691,3011],[6580,2690],[7373,3118],[7449,3849],[6694,4300],[5901,3965],[5741,3503]],
];

function makeSculptures(b,records){
 const recordsList=[...records.values()],floors=recordsList.filter(r=>!r.t.oneWay&&!r.t.honroCeiling&&!r.t.honroQuestTarget&&!r.t.device&&!r.t.honroSeal&&r.t.h>450&&r.t.w>850&&['earth','rock'].includes(r.mat)&&!/^sb-bell/.test(r.t.id));
 if(!floors.length)return[];const at=x=>{const hits=floors.filter(r=>x>=r.t.x&&x<=r.t.x+r.t.w).map(r=>({r,y:C.topAt(r.t,x,r.t.y)}));return hits.sort((a,z)=>z.r.t.w-a.r.t.w||a.y-z.y)[0]?.y??b.height;};
 const out=[],wide=b.width/6000,depthScale=Math.min(1.35,Math.max(.85,b.width/6000));
 for(const [i,ps]of FRONT.entries()){const points=ps.map(([x,d])=>[x*wide,at(x*wide)+d*depthScale]),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),l=Math.min(...xs),r=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),w=r-l,h=bottom-top,flip=i%2?-.06:.06,spine=[[l+w*(.51+flip),top],[l+w*(.43+flip),top+h*.31],[l+w*(.56+flip),top+h*.53],[l+w*(.43+flip),top+h*.81],[l+w*(.50+flip),bottom]];
  out.push({body:poly(points),light:poly([points[0],points[1],points[2],...spine.slice(0,4).reverse(),points.at(-1)]),shade:poly([...spine,...points.slice(2,6).reverse()]),rim:poly([points[0],points[1],points[2],...points.slice(0,3).reverse().map(([x,y])=>[x+3,y+8])]),cleft:poly([[l+w*.26,top+h*.27],[l+w*.23,top+h*.39],[l+w*.28,top+h*.48],[l+w*.22,top+h*.64],[l+w*.23,top+h*.73],[l+w*.21,top+h*.64],[l+w*.26,top+h*.48],[l+w*.21,top+h*.39],[l+w*.24,top+h*.26]]),bounds:{x:l,y:top,w,h},deep:top-at((l+r)/2)>2500,index:i});
 }return out;
}
function historical(t,b){
 const n=b.honroStage;
 if(n<=10&&b.honroMap?.act1Scene)return{act:1,art:G.HonroAct1SpatialArt.prepareTerrain(t,b)};
 if(n<=20&&b.honroMap?.space)return{act:2,art:{...G.HonroAct2SpatialArt.prepareTerrain(t,b),authoredPlanes:t.w>3500?[]:G.HonroAct2SpatialArt.prepareTerrain(t,b).authoredPlanes}};
 const authored=(b.honroMap?.space?.terrainPlanes||[]).filter(p=>p.terrainId===t.id&&p.points?.length>2).map(p=>({fill:p.fill,path:poly(p.points)}));return{act:3,art:{authoredPlanes:authored}};
}
function original(c,h){const q=h.art;c.save();
 if(h.act===1){for(const [i,p]of q.cliffPlanes.entries()){c.fillStyle=['#a2b4bb28','#081e294f','#82979f24','#0e27335c'][i];c.fill(p);}}
 // Retain local authored stone/masonry faces. Whole-domain washes and very
 // long stripes are deliberately replaced by the interlocking sculptures.
 for(const p of q.authoredPlanes||[]){if(p.broad)continue;c.fillStyle=p.fill;c.fill(p.path);}
 if(h.act===2){for(const row of q.masonry){c.fillStyle='#59675e';c.fill(row.body);c.fillStyle='#a6ad933f';c.fill(row.edge);}}
 c.restore();}
function sculptures(c,list,palette,view){const cave=['cave','ink'].includes(palette);for(const p of list){const z=p.bounds;if(z.x+z.w<view.x||z.x>view.x+view.w||z.y+z.h<view.y||z.y>view.y+view.h)continue;c.save();const tones=cave?['#35434b','#2e3e47','#3d4a50','#32454b']:['#414b40','#3e493e','#50554a','#3c4a40'],base=tones[p.index%4],light=cave?'#7e8883':'#a0a287',shade=cave?'#182c37':'#243930';c.fillStyle=A.gradient(c,z.x,z.y,z.x+z.w,z.y+z.h,[[0,G.HonroEnvironment.mixColor(base,light,p.deep?.16:.34)],[.47,base],[1,G.HonroEnvironment.mixColor(base,shade,.36)]]);c.fill(p.body);c.clip(p.body);c.fillStyle=light+(p.deep?'12':'21');c.fill(p.light);c.fillStyle=shade+'58';c.fill(p.shade);c.fillStyle=light+(p.deep?'18':'4d');c.fill(p.rim);if(p.index%3===0){c.fillStyle=shade+'ac';c.fill(p.cleft);}c.restore();}}
function trees(c,b,scenery,view){for(const p of scenery){const anchor=b.honroMapAnchors?.[p.anchor]||{},x=p.x??anchor.x,t=b.terrain.find(t=>t.id===p.support&&!t.broken);if(!t||!Number.isFinite(x))continue;const y=Math.max(...[-220,0,150].map(dx=>C.topAt(t,x+dx,anchor.y??t.y)));if(x+1300<view.x||x-1300>view.x+view.w)continue;
 const main=p.assetId==='pine.landmark';part(c,main?'old-pine':'entrance-pine',{x:main?x-2040:x,y:main?y-2110:y,sx:main?1:p.scale||1});}}
function roots(c,b,style){for(const tree of style.scenery||[]){if(!/^pine\./.test(tree.assetId))continue;const a=b.honroMapAnchors?.[tree.anchor]||{},x=tree.x??a.x,t=b.terrain.find(t=>t.id===tree.support&&!t.broken);if(!t||!Number.isFinite(x))continue;const y=C.topAt(t,x,t.y),s=tree.assetId==='pine.landmark'?1:.5;
 c.save();c.translate(x,y);c.scale(s,s);const root=path('M-32-22C-92 23-108 82-175 132L-215 153Q-171 144-147 113C-112 99-75 78-56 75C-64 141-44 166-5 194L32 247 73 268Q39 229 23 190C-11 159-18 119-8 81C28 98 47 132 102 145L168 153 203 173Q176 145 131 133C79 128 58 100 34 55L26-17Z');c.fillStyle=A.gradient(c,-130,0,145,265,[[0,'#83735a'],[.36,'#5d5946'],[1,'#454c3c']]);c.fill(root);c.strokeStyle='#a1947280';c.lineWidth=4;c.stroke(path('M-17-4Q-71 53-147 113M-24 60Q-44 140 16 197L48 242M18 60Q69 120 130 139'));
 c.restore();}}
function rear(c,b,view){if(b.honroStage<=10&&b.honroMap?.act1Scene){const q=G.HonroAct1SpatialArt.prepareScene(b);for(const r of q.rocks){if(r.x+r.width<view.x||r.x-r.width>view.x+view.w)continue;c.save();c.fillStyle=A.gradient(c,0,r.y-r.height,0,r.y+100,[[0,'#455d63'],[.6,'#2d474f'],[1,'#263d44']]);c.fill(r.shape);c.clip(r.shape);r.faces.forEach((p,i)=>{c.fillStyle=['#94a6a241','#152f3b8c','#324d5355','#aab4a327'][i%4];c.fill(p);});c.restore();}for(const p of q.shelfNecks){c.fillStyle='#28434e';c.fill(p.body);c.fillStyle='#758f8a35';c.fill(p.face);}}}
G.HonroVectorCampaignMaterials={makeSculptures,historical,original,sculptures,rear,trees,part,roots};
})(globalThis);
