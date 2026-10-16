/** Stage-local optional city circuits. Only fresh authored projects pass here;
 * loaded battle snapshots retain their original terrain and objective state. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const clone=v=>JSON.parse(JSON.stringify(v));
export const CITY_TACTICAL_SURFACES={
 21:[
  ['wall-west-toe',[[1500,2622.5],[1730,2440]],true,'stone'],
  ['wall-east-return',[[3540,1960],[3720,2110],[3820,2110],[3990,2280],[4080,2280]],false,'stone',55],
  ['wall-east-toe',[[4080,2280],[4290,2500]],true,'wood'],
  ['wall-buttress-plinth',[[3650,2500],[3760,2380],[3820,2380],[3920,2500]],false,'stone',300],
  ['market-west-rise',[[4090,2500],[4310,2270]],true,'wood'],
  ['market-side-gallery',[[4310,2270],[4620,2260],[4840,2280]],false,'stone'],
  ['market-east-return',[[4840,2280],[5150,2500]],true,'wood']
 ],
 24:[
  ['hall-west-veranda',[[1950,2551.176470588235],[2310,2230]],true,'wood'],
  ['hall-garden-link',[[3350,2228],[3730,2228]],true,'wood'],
  ['garden-retaining-gallery',[[3730,2228],[3970,2228],[4240,2295]],false,'stone',100],
  ['garden-east-return',[[4240,2295],[4370,2425],[4480,2425],[4680,2660]],true,'wood'],
  ['garden-low-retaining-foot',[[4020,2578.88],[4120,2505],[4250,2505],[4390,2673.67]],false,'stone',300],
  ['shrine-east-steps',[[6550,2190],[6640,2190],[6840,2394.636038969321]],true,'stone']
 ],
 28:[
  ['court-west-ascent',[[2680,2791.272727272727],[3010,2635],[3260,2550]],true,'wood'],
  ['court-east-gallery',[[4400,2545],[4540,2530],[4760,2450]],false,'stone'],
  ['court-record-return',[[4760,2450],[5010,2533.913043478261]],true,'wood'],
  ['court-low-charred-plinth',[[4030,2800],[4120,2690],[4190,2690],[4310,2800]],false,'stone',250]
 ]
};
function surface(s,id,top,oneWay,material,thickness){const depth=thickness??(oneWay?36:70);return{id:'ct'+s+'-'+id,name:id,type:'solid',points:[...top,...top.slice().reverse().map(([x,y])=>[x,y+depth])].map(([x,y])=>({x,y})),baseMaterial:material,oneWay,breakable:false,layer:'terrain',properties:{honroCityTactical:true,honroSpaceSurfaceId:'ct'+s+'-'+id,honroWalkEdges:top.slice(1).map((_,i)=>i),honroSurfaceRole:oneWay?'access-ramp':'cover-gallery',surfaceKind:material==='stone'?'granite':'wood'},detail:{spacing:18,roughness:0,seed:s,optimizeEpsilon:0}};}
// Recessed rear supports explain the architecture without drawing false bright
// walk edges. Actual walk/cover silhouettes remain the terrain polygons above.
function rearSupports(p,s,n){
 const id='city-tactical:'+n+':recessed-supports',polys=n===21?[
  [[3550,2010],[3620,2070],[3620,2500],[3550,2500]],
  [[3730,2146],[3770,2146],[3770,2380],[3730,2413]],
  [[4330,2328],[4370,2327],[4370,2500],[4330,2500]],
  [[4780,2344],[4820,2348],[4820,2500],[4780,2500]]
 ]:n===24?[
  [[3460,2264],[3494,2264],[3494,2451],[3460,2455]],
  [[3750,2328],[3790,2328],[3790,2518],[3750,2508]],
  [[4230,2392],[4264,2425],[4264,2522],[4230,2505]],
  [[4380,2461],[4414,2461],[4414,2674],[4380,2672]]
 ]:[
  [[2950,2700],[2980,2687],[2980,2805],[2950,2802]],
  [[4490,2615],[4528,2610],[4528,2785],[4490,2800]],
  [[4720,2535],[4754,2523],[4754,2667],[4720,2685]]
 ];
 const all=polys.flat(),minX=Math.min(...all.map(v=>v[0])),minY=Math.min(...all.map(v=>v[1])),maxX=Math.max(...all.map(v=>v[0])),maxY=Math.max(...all.map(v=>v[1]));
 const bounds={x:minX,y:minY,w:maxX-minX,h:maxY-minY};
 const a={id,name:'Recessed rear masonry and timber supports',category:'prop',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:['city-tactical','rear-support'],params:{rearOnly:true},material:'stone',breakable:false,bounds,reference:{heightM:4,bounds,foot:{x:0,y:0},scaleRange:[1,1],backgroundRange:[1,1]},vector:{version:1,viewBox:[minX,minY,bounds.w,bounds.h],gradients:{},root:{tag:'g',children:polys.map((v,i)=>({tag:'path',fill:i%2?'#414943':'#50584e',d:'M'+v.map(q=>q.join(' ')).join(' L')+' Z'}))}}};
 const ai=p.library.findIndex(v=>v.id===id);if(ai<0)p.library.push(a);else p.library[ai]=a;s.elements=s.elements.filter(e=>e.id!==id);s.elements.push({id,assetId:id,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back',cityTacticalRearOnly:true});
}
export function applyCityTacticalRoutes(project){
 const p=clone(project);
 for(const s of p.stages){const n=s.metadata?.stageId,rows=CITY_TACTICAL_SURFACES[n];if(!rows||!s.metadata.campaign||s.initialState?.honroRecordCourtRevision===1)continue;
  s.terrains=s.terrains.filter(t=>!t.properties?.honroCityTactical);
  s.terrains.push(...rows.filter(r=>!(r[4]>=250)).map(([id,top,oneWay,material,thickness])=>surface(n,id,top,oneWay,material,thickness)));
  // Low masonry is a real rise in the one canonical ground polygon, not a
  // second overlapping solid whose lower silhouette bleeds through the earth.
  const foundation=s.terrains.find(t=>t.id==='a3-foundation');
  for(const [,top] of rows.filter(r=>r[4]>=250)){
   const left=top[0][0],right=top.at(-1)[0];
   const first=foundation.points.findIndex(v=>v.x>=left&&v.y<s.height);
   let end=first;while(end<foundation.points.length&&foundation.points[end].x<=right&&foundation.points[end].y<s.height)end++;
   foundation.points.splice(first,end-first,...top.map(([x,y])=>({x,y})));
  }
  if(n===24){const door=s.terrains.find(t=>t.id==='shrine-door'),bottom=Math.max(...door.points.map(v=>v.y));for(const v of door.points.slice(0,2))v.y=bottom-350;}
  if(n===21){const u=s.units.find(u=>u.id==='a3-21-market-pack-0');if(u)u.y=2500;}
  // Keep the existing encounter identities/counts; place grounded occupants
  // on the newly raised masonry rather than let spawn sanitation repair them.
  const feet=rows.filter(r=>r[4]>=250);
  for(const u of s.units){if(u.team!=='enemy'||['lantern','bat','spirit'].includes(u.kind))continue;
   for(const [,top] of feet)for(let i=1;i<top.length;i++){const [a,b]=[top[i-1],top[i]];if(u.x<a[0]||u.x>b[0])continue;const y=a[1]+(b[1]-a[1])*(u.x-a[0])/(b[0]-a[0]);if(u.y>y&&u.y-y<320)u.y=y;}
  }
  rearSupports(p,s,n);
  s.initialState.honroCityTacticalRevision=1;
  s.design.cityTactical={revision:1,scope:'Optional basic movement circuits; original objectives, gates, split teams, resources, counts and dimensions retained. Route metadata is not traversal proof.',surfaces:clone(rows),roles:n===21?['west battlement rescue approach','east battlement return to defence','market high gallery / sheltered low street']:n===24?['open hall approach','garden high ledge / low retaining-wall return','shrine side access after the existing seal']:['western reunion approach','petition roof crossing','short return to the lower record slope'],verification:'pending actual four-body round trips, objective-state and normal-resource checks'};
 }
 return p;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file=process.argv[2]||'shared/data/campaign.json';await writeFile(file,JSON.stringify(applyCityTacticalRoutes(JSON.parse(await readFile(file,'utf8'))),null,2)+'\n');}
