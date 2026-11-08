/** Unadopted Stage 11 collision skeletons. No campaign/runtime mutation.
 * Explicitly authored alternatives, not transforms of the old ravine.
 * These shapes are physics/layout probes, never final painted terrain art. */
const clone=x=>JSON.parse(JSON.stringify(x));
const candidates=[
 {id:'A',title:'좁은 고개',width:5600,height:2800,
  floor:[[0,2100],[600,2100],[1040,2360],[1450,2180],[1860,2050],[2200,2050],[2500,2360],[2910,2360],[3280,2070],[3700,1860],[4220,1710],[4800,1710],[5600,1800]],
  crossing:[[2200,2050],[2580,2020],[2930,2020],[3280,2070]],
  upper:[[1530,2050],[1800,1850],[2180,1820],[2610,1850],[3010,2000],[3280,2070]],
  spawn:300,exit:5150,lastCombat:4500,upperEntry:1490,upperLanding:1550,
  sites:{bier:930,host:1430,nextHost:1960,north:4350},
  explanation:'짧은 외문 어깨와 좁은 중앙 고개. 숙주와 북쪽 전선 간 여백이 가장 적은 대안.'},
 {id:'B',title:'접힌 협곡',width:6200,height:3200,
  floor:[[0,2390],[650,2390],[1100,2530],[1550,2460],[1950,2240],[2350,2240],[2680,2500],[3180,2520],[3500,2250],[3900,1980],[4450,1740],[5050,1680],[5700,1680],[6200,1750]],
  crossing:[[2350,2240],[2700,2220],[3180,2220],[3500,2250]],
  upper:[[1800,2230],[2050,2070],[2500,2050],[2920,2120],[3240,2225.625]],
  spawn:320,exit:5790,lastCombat:5100,upperEntry:1760,upperLanding:1820,
  sites:{bier:1010,host:1520,nextHost:2120,north:4770},
  explanation:'중단 돌목과 아래 복귀 골, 짧은 상단 측면선. 세 전선을 같은 공간에 접되 최종 집결은 북쪽 교전 곁.'},
 {id:'C',title:'넓은 어깨',width:6800,height:3600,
  floor:[[0,2700],[780,2700],[1280,2840],[1790,2700],[2220,2480],[2690,2480],[2970,2790],[3550,2810],[3940,2470],[4390,2220],[4820,1950],[5360,1790],[6130,1790],[6800,1870]],
  crossing:[[2690,2480],[3020,2440],[3490,2450],[3940,2470]],
  upper:[[1970,2510],[2260,2280],[2710,2230],[3170,2240],[3630,2350],[3940,2470]],
  spawn:340,exit:6380,lastCombat:5680,upperEntry:1930,upperLanding:1990,
  sites:{bier:1140,host:1700,nextHost:2420,north:5300},
  explanation:'회복 가능한 넓은 북쪽 어깨와 긴 측면선. 사선 분리 여유 대신 이동량 증가를 비교.'}
];
export const COMPACT_CANDIDATES=candidates.map(clone);
export function heightOn(points,x){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}throw Error('No candidate surface at '+x);}
const point=(top,x,surfaceId)=>({x,y:heightOn(top,x),surfaceId});
function along(top,from,to,surfaceId,extra=[]){const lo=Math.min(from,to),hi=Math.max(from,to),xs=[...new Set([from,...[...top.map(p=>p[0]),...extra].filter(x=>x>lo&&x<hi),to])].sort((a,b)=>from<to?a-b:b-a);return xs.map(x=>point(top,x,surfaceId));}
function terrain(id,top,bottom,oneWay=false){return{id,name:id,type:'solid',points:[...top,...bottom].map(([x,y])=>({x,y})),baseMaterial:'rock',breakable:false,oneWay,layer:'terrain',properties:{honroSpaceSurfaceId:id,honroWalkEdges:top.slice(1).map((_,i)=>i),honroSurfaceRole:id==='compact-floor'?'floor':'shelf'},detail:{spacing:18,roughness:0,seed:11,optimizeEpsilon:0}};}
export function createCompactCandidate(id){
 const c=clone(candidates.find(c=>c.id===id));if(!c)throw Error('Unknown compact candidate '+id);
 const floor='compact-floor',bridge='compact-stone-neck',upper='compact-upper-flank',p=x=>point(c.floor,x,floor),crossStart=c.crossing[0][0],crossEnd=c.crossing.at(-1)[0];
 const bierX=c.sites.bier,bierLeft=bierX-100,bierRight=bierX+100,bierY=Math.min(heightOn(c.floor,bierLeft),heightOn(c.floor,bierRight))-116;
 const rockId='compact-firing-rock',bierId='compact-bier-cover',rockLeft=bierX-600,rockBase=heightOn(c.floor,rockLeft),rockTop=[];
 for(let i=0;i<4;i++){const x=rockLeft+i*90,y=rockBase-(i+1)*100;rockTop.push([x,y],[i===3?rockLeft+390:x+90,y]);}
 const rockRoute=[p(rockLeft-28)];
 for(let i=0;i<4;i++){const target={x:rockLeft+i*90+30,y:rockBase-(i+1)*100,surfaceId:rockId};rockRoute.at(-1).jumpTo={...target,support:rockId};rockRoute.push(target);if(i<3)rockRoute.push({x:rockLeft+(i+1)*90-28,y:target.y,surfaceId:rockId});}
 rockRoute.push({x:rockLeft+380,y:rockBase-400,surfaceId:rockId});
 const coverTop=[{x:bierX-75,y:bierY,surfaceId:bierId},{x:bierX+75,y:bierY,surfaceId:bierId}];
 const siteXs=Object.values(c.sites);
 const main=[...along(c.floor,c.spawn,rockLeft-28,floor),...clone(rockRoute).slice(1),...coverTop,p(bierRight+40),...along(c.floor,bierRight+40,crossStart,floor,siteXs).slice(1),...along(c.crossing,crossStart,crossEnd,bridge).slice(1),...along(c.floor,crossEnd,c.exit,floor,siteXs).slice(1)];
 main.find(p=>p.x===rockLeft-28).jumpTo=clone(rockRoute[0].jumpTo);
 const landing=point(c.upper,c.upperLanding,upper),entry=p(c.upperEntry),upperEnd=c.upper.at(-1)[0];
 const flank=[entry,{...entry,jumpTo:{...landing,support:upper}},landing,...along(c.upper,c.upperLanding,upperEnd,upper).slice(1),...(upperEnd<crossEnd?along(c.crossing,upperEnd,crossEnd,bridge).slice(1):[]),p(Math.max(upperEnd,crossEnd)+45)];
 // A fall/recovery fixture begins in the real hollow, not at the fork where
 // ordinary forward walking correctly selects the overlying one-way neck.
 // Entry into that hollow via the UI's down-jump has its own command probe.
 const recoveryStart=c.floor.find(([x,y])=>x>crossStart+100&&x<crossEnd-100)[0];
 const bypass=along(c.floor,recoveryStart,crossEnd+45,floor);
 c.terrains=[terrain(floor,c.floor,[[c.width,c.height+240],[0,c.height+240]]),terrain(bridge,c.crossing,c.crossing.slice().reverse().map(([x,y])=>[x,y+38]),true),terrain(upper,c.upper,c.upper.slice().reverse().map(([x,y])=>[x,y+42]),true),terrain(rockId,rockTop,[[rockLeft+390,heightOn(c.floor,rockLeft+390)+30],[rockLeft,heightOn(c.floor,rockLeft)+30]]),terrain(bierId,[[bierLeft,bierY],[bierRight,bierY]],[[bierRight,heightOn(c.floor,bierRight)+20],[bierLeft,heightOn(c.floor,bierLeft)+20]])];
 c.routes=[{id:'main',kind:'required',anchors:main},{id:'firing-rock',kind:'four-ordinary-jumps',anchors:rockRoute},{id:'upper-flank',kind:'optional-jump',anchors:flank},{id:'lower-recovery',kind:'recovery-from-lower-floor',anchors:bypass},{id:'down-jump-recovery',kind:'down-jump-then-recovery',start:point(c.crossing,recoveryStart,bridge),drop:true,anchors:bypass},{id:'last-combat-to-exit',kind:'tail',anchors:along(c.floor,c.lastCombat,c.exit,floor)}];
 c.sites=Object.fromEntries(Object.entries(c.sites).map(([id,x])=>[id,p(x)]));c.sites.spawn=p(c.spawn);c.sites.exit=p(c.exit);c.sites.lastCombat=p(c.lastCombat);
 c.sites.bier=p(bierRight+40);c.sites.firingRock=clone(rockRoute.at(-1));
 c.proxies={bier:{terrainId:bierId,width:200,coverHeight:116,roofY:bierY,standingApproach:clone(c.sites.bier)},firingRock:{terrainId:rockId,totalRise:400,stepRises:[100,100,100,100],standing:clone(c.sites.firingRock)},status:'collision proxies only; not final vector art'};
 const bearingXs=[c.upper[0][0],c.upper[Math.floor(c.upper.length/2)][0],c.upper.at(-1)[0]];
 c.visualSupports=[{id:'upper-rooted-pine-fork',terrainId:upper,rearSupportRole:'rooted-pine-fork',collision:false,supportSockets:{foot:p(bearingXs[1]),bearings:bearingXs.map(x=>point(c.upper,x,upper))},purpose:'Grounded rear trunk and large fork support the open upper branch; no extra collider or fake walking line.'}];
 c.terrains.find(t=>t.id===upper).properties.visualSupportId='upper-rooted-pine-fork';
 c.provenance={status:'unadopted geometry probe',designCard:'game/docs/ACT2_CH1_COMPACT_DESIGN.md',activeCampaignChanged:false};return c;
}
