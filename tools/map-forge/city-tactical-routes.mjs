/** Stage-local optional city circuits. Only fresh authored projects pass here;
 * loaded battle snapshots retain their original terrain and objective state. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const clone=v=>JSON.parse(JSON.stringify(v));
export const CITY_TACTICAL_SURFACES={
 21:[
  ['wall-west-toe',[[1500,2622.5],[1730,2440]],true,'stone'],
  ['wall-east-return',[[3540,1960],[3670,2040],[3950,2250],[4290,2500]],true,'stone'],
  ['market-west-rise',[[4090,2500],[4310,2270]],true,'wood'],
  ['market-side-gallery',[[4310,2270],[4620,2260],[4840,2280]],false,'stone'],
  ['market-east-return',[[4840,2280],[5150,2500]],true,'wood']
 ],
 24:[
  ['hall-west-veranda',[[1950,2551.176470588235],[2310,2230]],true,'wood'],
  ['hall-east-return',[[3350,2228],[3660,2468]],true,'wood'],
  ['garden-west-rise',[[3500,2450.68],[3800,2220]],true,'stone'],
  ['garden-retaining-gallery',[[3800,2220],[4050,2240],[4290,2310]],false,'stone'],
  ['garden-east-return',[[4290,2310],[4620,2660]],true,'wood'],
  ['shrine-east-steps',[[6780,2401],[6580,2250]],true,'stone']
 ],
 28:[
  ['court-west-ascent',[[2680,2791.272727272727],[3010,2635],[3260,2550]],true,'wood'],
  ['court-east-gallery',[[4400,2545],[4540,2530],[4760,2450]],false,'stone'],
  ['court-record-return',[[4760,2450],[5010,2533.913043478261]],true,'wood']
 ]
};
function surface(s,id,top,oneWay,material){const depth=oneWay?30:55;return{id:'ct'+s+'-'+id,name:id,type:'solid',points:[...top,...top.slice().reverse().map(([x,y])=>[x,y+depth])].map(([x,y])=>({x,y})),baseMaterial:material,oneWay,breakable:false,layer:'terrain',properties:{honroCityTactical:true,honroSpaceSurfaceId:'ct'+s+'-'+id,honroWalkEdges:top.slice(1).map((_,i)=>i),honroSurfaceRole:oneWay?'access-ramp':'cover-gallery',surfaceKind:material==='stone'?'granite':'wood'},detail:{spacing:18,roughness:0,seed:s,optimizeEpsilon:0}};}
export function applyCityTacticalRoutes(project){
 const p=clone(project);
 for(const s of p.stages){const n=s.metadata?.stageId,rows=CITY_TACTICAL_SURFACES[n];if(!rows||!s.metadata.campaign)continue;
  s.terrains=s.terrains.filter(t=>!t.properties?.honroCityTactical);
  s.terrains.push(...rows.map(([id,top,oneWay,material])=>surface(n,id,top,oneWay,material)));
  s.initialState.honroCityTacticalRevision=1;
  s.design.cityTactical={revision:1,scope:'Optional basic movement circuits; original objectives, gates, split teams, resources, counts and dimensions retained. Route metadata is not traversal proof.',surfaces:clone(rows),roles:n===21?['west battlement rescue approach','east battlement return to defence','market high gallery / sheltered low street']:n===24?['open hall approach','garden high ledge / low retaining-wall return','shrine side access after the existing seal']:['western reunion approach','petition roof crossing','short return to the lower record slope'],verification:'pending actual four-body round trips, objective-state and normal-resource checks'};
 }
 return p;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file=process.argv[2]||'shared/data/campaign.json';await writeFile(file,JSON.stringify(applyCityTacticalRoutes(JSON.parse(await readFile(file,'utf8'))),null,2)+'\n');}
