(function(G){'use strict';
// Stage21 presentation only. Keep the canonical arch, stair silhouettes,
// walkable roof and all battle fields; replace the upper timber pavilion and
// dress only its existing masonry face. Native geometry is never written.
const compiled=new Map(),originals=new WeakMap(),lower=new Path2D('M1700 2240H2600V2700H1700Z');
const wall=new Path2D('M2025 2560L2040 2260 2070 2240H2460L2510 2260 2535 2560H2424V2466L2406 2410 2365 2365 2315 2338H2240L2189 2365 2148 2410 2130 2466V2560Z');
const crownClips=new WeakMap();
// Bed joints sit between the column bearings. These are individual dressed
// ashlar stones (roughly .6–1.3 adult widths), not a small repeating brick tile.
const stones=[
 ['M2068 2247L2159 2244 2162 2278 2153 2281 2060 2280 2058 2263Z',0],
 ['M2166 2244L2271 2242 2275 2277 2266 2282 2165 2279Z',1],
 ['M2278 2243L2363 2244 2368 2279 2360 2283 2279 2278Z',0],
 ['M2370 2245L2462 2247 2492 2261 2495 2279 2478 2283 2371 2280Z',2],
 ['M2057 2286L2188 2284 2193 2328 2174 2343 2053 2341 2048 2332Z',1],
 ['M2195 2285L2317 2284 2321 2321 2311 2334 2240 2335 2197 2351Z',2],
 ['M2324 2285L2497 2286 2502 2336 2487 2344 2393 2340 2373 2324 2325 2328Z',0],
 // Left springer and battered abutment: wider lower shoes carry the arch thrust.
 ['M2046 2347L2118 2344 2151 2361 2130 2409 2124 2427 2042 2425 2038 2413Z',2],
 ['M2039 2430L2124 2431 2126 2494 2116 2500 2032 2496 2031 2483Z',0],
 ['M2032 2503L2126 2504 2128 2540 2116 2548 2028 2544 2027 2530Z',1],
 ['M2019 2549L2129 2550 2132 2562 2018 2562Z',2],
 // Right abutment is not a mirrored left-side stamp.
 ['M2439 2349L2506 2347 2512 2405 2504 2426 2431 2424 2415 2393Z',0],
 ['M2433 2431L2513 2432 2520 2482 2514 2497 2429 2500 2427 2489Z',1],
 ['M2429 2506L2523 2503 2529 2534 2517 2548 2428 2544Z',2],
 ['M2424 2550L2535 2548 2540 2562 2424 2562Z',0],
];
const chips=[
 ['M2074 2251L2149 2249 2150 2253 2107 2256 2095 2254 2073 2257Z','#b0afa0'],
 ['M2171 2248L2256 2246 2264 2250 2220 2253 2204 2250 2170 2254Z','#a8aa9c'],
 ['M2284 2247L2355 2248 2358 2252 2327 2254 2314 2251 2284 2254Z','#b3b1a1'],
 ['M2376 2249L2458 2251 2479 2261 2467 2260 2453 2256 2415 2255 2398 2253 2375 2256Z','#a9ac9f'],
 ['M2063 2291L2149 2289 2179 2287 2180 2292 2156 2294 2134 2292 2092 2296 2062 2295Z','#9aa69c'],
 ['M2202 2291L2298 2288 2309 2292 2270 2296 2254 2293 2221 2297 2203 2295Z','#a3a99a'],
 ['M2330 2291L2421 2290 2445 2293 2488 2291 2489 2297 2455 2298 2430 2296 2377 2300 2331 2297Z','#aeb09f'],
 ['M2047 2436L2115 2437 2116 2441 2089 2443 2072 2440 2046 2444Z','#9ba69c'],
 ['M2438 2437L2505 2438 2508 2444 2473 2443 2457 2446 2437 2443Z','#a6ab9d'],
 ['M2037 2509L2118 2510 2119 2515 2083 2517 2068 2513 2036 2516Z','#9da89c'],
 ['M2435 2511L2514 2509 2519 2514 2484 2517 2464 2514 2435 2517Z','#99a59c'],
 // Selected shallow losses at the joints leave broad quiet stone faces.
 ['M2151 2278L2159 2270 2162 2278 2153 2281 2145 2280Z','#3c514b'],
 ['M2245 2329L2253 2325 2262 2335H2240Z','#344b46'],
 ['M2485 2337L2497 2328 2502 2336 2487 2344 2478 2343Z','#3a504a'],
 ['M2032 2483L2039 2488 2036 2498 2032 2496Z','#3f554e'],
 // Broad compressed returns and missing lower lips, not decorative scratches.
 ['M2155 2258L2161 2255 2162 2278 2153 2281 2071 2280 2069 2276 2148 2275Z','#53675c'],
 ['M2267 2253L2273 2250 2275 2277 2266 2282 2173 2279 2172 2275 2260 2275Z','#4c6257'],
 ['M2360 2254L2366 2254 2368 2279 2360 2283 2286 2279 2284 2275 2353 2275Z','#52695e'],
 ['M2485 2262L2493 2263 2495 2279 2478 2283 2378 2280 2377 2275 2475 2275Z','#445e54'],
 ['M2058 2329L2120 2330 2134 2327 2167 2330 2174 2337 2118 2336 2101 2339 2053 2336Z','#526a5d'],
 ['M2445 2333L2497 2328 2502 2336 2487 2344 2443 2340 2429 2342 2401 2339 2403 2335Z','#415d52'],
 ['M2500 2283L2506 2287 2511 2395 2519 2458 2534 2557 2516 2558 2506 2472 2502 2411Z','#3c564d'],
 ['M2038 2434L2046 2438 2042 2485 2049 2494 2032 2496 2031 2483Z','#4c665a'],
];
let masonryPaths;
function prepareMasonry(){
 if(masonryPaths)return masonryPaths;
 const rows=stones.map(([d,tone])=>{const n=d.match(/-?\d*\.?\d+/g).map(Number),xs=n.filter((_,i)=>!(i%2)),ys=n.filter((_,i)=>i%2);return{path:new Path2D(d),tone,x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};});
 // Eleven radial voussoirs keep the original inner arch: rx147/ry132 at
 // (2277,2470). Their taper directs weight toward the two existing springers.
 for(let i=0;i<11;i++){
  const a=Math.PI+i*Math.PI/11+.009,z=Math.PI+(i+1)*Math.PI/11-.009,cx=2277,cy=2470,p=new Path2D(),ix=t=>cx+147*Math.cos(t),iy=t=>cy+132*Math.sin(t),ox=t=>cx+185*Math.cos(t),oy=t=>cy+176*Math.sin(t);
  p.moveTo(ix(a),iy(a));p.lineTo(ox(a),oy(a));p.ellipse(cx,cy,185,176,0,a,z);p.lineTo(ix(z),iy(z));p.ellipse(cx,cy,147,132,0,z,a,true);p.closePath();
  rows.push({path:p,tone:i===5?3:i%3,x:Math.min(ix(a),ox(a),ix(z),ox(z)),y:Math.min(iy(a),oy(a),iy(z),oy(z)),w:58,h:71,arch:true});
 }
 masonryPaths={rows,chips:chips.map(([d,fill])=>({path:new Path2D(d),fill})),contact:new Path2D('M2130 2466L2148 2410 2189 2365 2240 2338H2315L2365 2365 2406 2410 2424 2466'),cap:new Path2D('M2040 2249L2070 2240H2460L2510 2250 2507 2256 2460 2247H2070L2042 2256Z'),bearing:new Path2D('M2042 2256L2072 2248H2458L2507 2256 2508 2262 2458 2254H2074L2042 2262Z')};
 return masonryPaths;
}
const stoneTones=[['#919b90','#6c7a6e','#435c51'],['#9ca393','#758272','#4b6254'],['#87958a','#627367','#3b564b'],['#aaa991','#87927a','#556a58']];
function masonry(c){
 const q=prepareMasonry();c.save();c.clip(wall);c.fillStyle='#354d46';c.fill(wall);
 for(const row of q.rows){const [light,body,shade]=stoneTones[row.tone],g=c.createLinearGradient(row.x,row.y,row.x+row.w*.7,row.y+row.h);g.addColorStop(0,light);g.addColorStop(.23,body);g.addColorStop(.78,body);g.addColorStop(1,shade);c.fillStyle=g;c.fill(row.path);}
 for(const chip of q.chips){c.fillStyle=chip.fill;c.fill(chip.path);}
 c.strokeStyle='#263f39';c.lineWidth=4;c.lineJoin='round';c.stroke(q.contact);
 c.fillStyle='#919e8c';c.fill(q.cap);c.fillStyle='#40594e';c.fill(q.bearing);c.restore();
}
function drawTerrain(c,t,b){
 if(b?.honroStage!==21||t.id!=='gate:collision:0'||t.broken)return false;
 let clip=crownClips.get(t);if(!clip){const ps=G.HONRO_CORE.poly(t);clip=new Path2D();ps.forEach((p,i)=>i?clip.lineTo(p.x,p.y):clip.moveTo(p.x,p.y));clip.closePath();crownClips.set(t,clip);}
 c.save();c.clip(clip);masonry(c);c.restore();return true;
}
function draw(c,l,b){
 if(b?.honroStage!==21||l.asset?.id!=='eup21:gate')return false;
 const K=G.HonroEnvironmentVectorKit;if(!K?.ASSETS['hanok.gatehouse.front'])return false;
 let q=compiled.get(K.REGISTRY_VERSION);
 if(!q){q=K.compileScene({instances:[{id:'eup21-timber-pavilion',assetId:'hanok.gatehouse.front',palette:'city',transform:{x:2277,y:2240,scale:1}}]});compiled.set(K.REGISTRY_VERSION,q);}
 let original=originals.get(l.asset);if(!original){original={...l.asset,anchor:{x:0,y:0}};originals.set(l.asset,original);}
 c.save();c.translate(l.x||0,l.y||0);c.rotate(l.rotation||0);c.scale(l.scale??1,l.scale??1);c.translate(-(l.asset.anchor?.x||0),-(l.asset.anchor?.y||0));
 c.save();c.clip(lower);G.HonroVectorArt.draw(c,original,{x:0,y:0,scale:1});c.restore();
 masonry(c);
 K.drawCanvas(c,q);c.restore();return true;
}
G.HonroCityGateArt={draw,drawTerrain,revision:'city-gate-masonry-3',stats:()=>({stoneBodies:stones.length,archStones:11,chips:chips.length,paths:stones.length+11+chips.length+5})};
})(globalThis);
