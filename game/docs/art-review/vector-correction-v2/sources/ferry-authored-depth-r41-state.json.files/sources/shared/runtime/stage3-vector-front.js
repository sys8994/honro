(function(G){'use strict';
// Clean hand-authored bedrock continuation of the user-selected r25 design.
// Every large network below is unique. A/B/C native faces provide local
// fracture vocabulary at the original 103.5/80 actor scale, never image tiles.
const paths=new Map(),surfaces=new WeakMap(),C=G.HONRO_CORE;
function p(d){if(!paths.has(d))paths.set(d,new Path2D(d));return paths.get(d);}
function fill(c,d,paint){c.fillStyle=paint;c.fill(p(d));}
function grad(c,x,y,w,h,stops){const g=c.createLinearGradient(x,y,x+w,y+h);for(const[a,v]of stops)g.addColorStop(a,v);return g;}
// The native bank source is one scene, not repeated sheets. Its world-space
// masses are cached in the existing visible world tiles.
function draw(c,b,view){if(b?.honroStage!==3)return;c.save();
 c.fillStyle=grad(c,-500,1000,2000,16000,[[0,'#5d6053'],[.18,'#52594b'],[.45,'#485244'],[1,'#354c3e']]);c.fillRect(-6100,400,16500,25500);
 G.HonroVectorCampaignMaterials.part(c,'narubank-body');
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

 c.fillStyle=grad(c,0,2350,0,2200,[[0,'#4d5b4500'],[.5,'#4d5b4520'],[1,'#4d5b4552']]);c.fillRect(-6100,2350,16500,24650);
 c.restore();}
// Each point is [world x, vertical offset from the unchanged walking profile].
// The profile runs through these top planes, with authored ground behind it.
const shoulders=[
 {body:[[0,-45],[115,-60],[234,-42],[320,-51],[447,-28],[523,1],[479,27],[340,32],[246,18],[101,30],[0,17]],light:[[0,-45],[115,-60],[234,-42],[320,-51],[447,-28],[388,-15],[284,-22],[174,-20],[65,-32],[0,-18]],side:[[284,-22],[388,-15],[447,-28],[523,1],[479,27],[340,32],[299,10]]},
 {body:[[452,-29],[535,-49],[651,-76],[741,-68],[806,-40],[905,-27],[973,-5],[937,27],[846,40],[738,24],[658,42],[535,20]],light:[[452,-29],[535,-49],[651,-76],[741,-68],[806,-40],[719,-32],[640,-39],[555,-20]],side:[[719,-32],[806,-40],[905,-27],[973,-5],[937,27],[846,40],[792,12]]},
 {body:[[1002,-36],[1093,-52],[1224,-43],[1297,-61],[1408,-46],[1498,-22],[1553,8],[1499,28],[1395,23],[1318,42],[1184,25],[1086,29]],light:[[1002,-36],[1093,-52],[1224,-43],[1297,-61],[1408,-46],[1360,-28],[1241,-22],[1151,-31],[1079,-18]],side:[[1360,-28],[1408,-46],[1498,-22],[1553,8],[1499,28],[1395,23],[1369,8]]},
 {body:[[1586,-28],[1681,-48],[1784,-82],[1871,-72],[1944,-41],[2075,-35],[2124,-8],[2054,25],[1940,33],[1847,21],[1738,39],[1620,14]],light:[[1586,-28],[1681,-48],[1784,-82],[1871,-72],[1944,-41],[1849,-30],[1774,-39],[1693,-17]],side:[[1849,-30],[1944,-41],[2075,-35],[2124,-8],[2054,25],[1940,33],[1898,11]]},
 {body:[[2151,-40],[2254,-58],[2357,-46],[2436,-64],[2527,-52],[2593,-30],[2666,-12],[2712,13],[2641,30],[2540,24],[2445,43],[2320,27],[2212,31]],light:[[2151,-40],[2254,-58],[2357,-46],[2436,-64],[2527,-52],[2479,-32],[2362,-22],[2250,-30]],side:[[2479,-32],[2527,-52],[2593,-30],[2666,-12],[2712,13],[2641,30],[2540,24],[2525,8]]},
 {body:[[2784,-31],[2885,-65],[2971,-87],[3053,-73],[3130,-44],[3236,-35],[3294,-4],[3247,25],[3156,35],[3079,23],[2986,42],[2868,25]],light:[[2784,-31],[2885,-65],[2971,-87],[3053,-73],[3130,-44],[3058,-29],[2958,-41],[2877,-21]],side:[[3058,-29],[3130,-44],[3236,-35],[3294,-4],[3247,25],[3156,35],[3126,10]]},
 {body:[[3341,-37],[3425,-59],[3532,-49],[3631,-72],[3742,-53],[3823,-29],[3911,-3],[3865,30],[3769,25],[3681,44],[3560,27],[3454,35]],light:[[3341,-37],[3425,-59],[3532,-49],[3631,-72],[3742,-53],[3690,-31],[3566,-24],[3467,-34]],side:[[3690,-31],[3742,-53],[3823,-29],[3911,-3],[3865,30],[3769,25],[3738,9]]},
 {body:[[3974,-32],[4059,-56],[4146,-78],[4236,-61],[4332,-42],[4450,-24],[4498,6],[4443,28],[4313,34],[4206,22],[4108,40],[4014,18]],light:[[3974,-32],[4059,-56],[4146,-78],[4236,-61],[4332,-42],[4258,-28],[4166,-37],[4067,-19]],side:[[4258,-28],[4332,-42],[4450,-24],[4498,6],[4443,28],[4313,34],[4280,12]]}
];
function surfaceData(b){const t=b.terrain.find(t=>t.id==='ferry-ground'&&!t.broken);if(!t)return null;const key=b.sceneVersion+':'+t.x+':'+t.y+':'+t.w+':'+t.h;let data=surfaces.get(b);if(data?.key===key)return data;
 const at=x=>C.topAt(t,x,t.y),polygon=points=>{const p=new Path2D();points.forEach(([x,dy],i)=>i?p.lineTo(x,at(x)+dy):p.moveTo(x,at(x)+dy));p.closePath();return p;};
 // Unequal rear widths are shallow in projection, with the walk line inside.
 const rows=[[-120,-47,27],[0,-54,31],[180,-67,30],[390,-42,24],[570,-62,33],[760,-78,39],[960,-49,28],[1130,-57,34],[1310,-69,38],[1510,-43,27],[1710,-72,36],[1890,-91,42],[2070,-52,29],[2270,-65,35],[2470,-72,42],[2660,-45,30],[2850,-74,39],[3030,-96,44],[3230,-52,31],[3430,-67,38],[3630,-81,44],[3830,-49,30],[4040,-65,36],[4250,-87,42],[4450,-53,30],[4550,-46,26]];
 const bank=polygon([...rows.map(([x,back])=>[x,back]),...rows.toReversed().map(([x,,front])=>[x,front])]);
 const rocks=shoulders.map(s=>({body:polygon(s.body),light:polygon(s.light),side:polygon(s.side)}));
 const pockets=[[[805,-19],[883,-31],[979,-24],[1042,-9],[1100,-4],[1078,12],[980,15],[915,4],[848,12]],[[1954,-9],[2027,-24],[2110,-19],[2190,-7],[2230,12],[2161,22],[2084,12],[2024,24]],[[3210,-14],[3277,-27],[3360,-20],[3420,-2],[3450,16],[3379,24],[3307,11],[3248,20]],[[3819,-11],[3890,-28],[3974,-21],[4030,-7],[4061,11],[3990,22],[3910,10],[3854,21]]].map(polygon);
 // Small rear stones are 0.3–0.7 adult H. Their feet stay in the top plane.
 const stones=[
  {x:918,body:'M-32-31L-20-54 4-61 24-46 34-27 12-18-11-23Z',light:'M-32-31L-20-54 4-61 24-46 3-43-12-35Z',side:'M3-43L24-46 34-27 12-18-1-26Z'},
  {x:2117,body:'M-39-29L-24-48-7-59 13-52 30-53 44-34 27-19 3-22-17-16Z',light:'M-39-29L-24-48-7-59 13-52 30-53 15-38-8-41-23-29Z',side:'M15-38L30-53 44-34 27-19 3-22 2-31Z'},
  {x:3315,body:'M-26-36L-22-61-4-73 17-66 27-46 23-27 3-22-17-25Z',light:'M-26-36L-22-61-4-73 17-66 3-53-9-51-16-35Z',side:'M3-53L17-66 27-46 23-27 3-22-1-36Z'},
  {x:3922,body:'M-44-30L-26-46-8-43 14-59 34-49 47-30 24-19 1-24-22-18Z',light:'M-44-30L-26-46-8-43 14-59 34-49 12-38-6-31-24-33Z',side:'M12-38L34-49 47-30 24-19 1-24 0-30Z'}
 ];
 data={key,t,at,bank,rocks,pockets,stones};surfaces.set(b,data);return data;}
function ground(c,b){const s=surfaceData(b);if(!s)return;c.save();
 c.fillStyle=grad(c,1600,950,1600,520,[[0,'#8b8064'],[.5,'#8f8162'],[1,'#7e755a']]);c.fill(s.bank);
 for(const r of s.rocks){c.fillStyle='#666b59';c.fill(r.body);c.fillStyle='#858871';c.fill(r.light);c.fillStyle='#505947';c.fill(r.side);}
 c.fillStyle='#9d8b63';for(const p of s.pockets)c.fill(p);
 for(const r of s.stones){c.save();c.translate(r.x,s.at(r.x));fill(c,r.body,'#636a5a');fill(c,r.light,'#8d9079');fill(c,r.side,'#464f43');c.restore();}
 c.restore();}
function rear(c,b,view){if(b?.honroStage===3)ground(c,b);}
function surface(c,b,view){if(b?.honroStage===3)ground(c,b);}
G.HonroStage3VectorFront={draw,rear,surface};
})(globalThis);
