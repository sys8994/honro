import {readFileSync} from 'node:fs';
const templates=JSON.parse(readFileSync(new URL('./stage5-roster-templates.json',import.meta.url),'utf8')).templates;
/** Sole western-land/roster author for the lake candidate. Lake owns remote water/cave. */
export const stage5LandTop=[[0,2520],[500,2520],[700,2710],[1120,2790],[1370,2790],[1460,2780],[1530,2780],[1640,2710],[1740,2710],[1930,2590],[2180,2590],[2380,2790],[2640,3300],[3000,3700],[3500,4200],[4200,4280],[4700,4010],[5000,3770],[5300,3770]];
function topAt(points,x){for(let i=1;i<points.length;i++){const a=points[i-1],z=points[i];if(x>=a[0]&&x<=z[0])return a[1]+(z[1]-a[1])*(x-a[0])/(z[0]-a[0]);}throw Error('Outside Stage5 land: '+x);}
export const stage5LandY=x=>topAt(stage5LandTop,x);
const shoulderTop=[[650,2390],[790,2290],[1060,2250],[1330,2250],[1550,2290],[1790,2360],[1930,2490],[2030,2590]];
export function authorStage5Positioning(s,g){
 const clone=v=>JSON.parse(JSON.stringify(v)),base=s.terrains.find(t=>t.id==='valley-floor'),solid=(id,xy)=>({...clone(base),id,name:id,points:xy.map(([x,y])=>({x,y})),oneWay:false,playProjection:undefined,properties:{...base.properties,route:true,surfaceKind:'rock'},detail:{spacing:18,roughness:0,seed:5,optimizeEpsilon:0}});
 s.terrains=[solid('valley-floor',[...stage5LandTop,[5300,5000],[0,5000]]),solid('stage5-west-shoulder',[...shoulderTop,[1950,2780],[1850,2800],[1820,2530],[1570,2490],[1330,2470],[1110,2490],[890,2510],[740,2580],[650,2560]]),solid('stage5-ritual-stone',[[1480,2780],[1580,2650],[1600,2650],[1700,2710],[1700,2760],[1480,2820]]),...s.terrains.filter(t=>['waterfall-cliff','waterfall-veil','cliff-cleat'].includes(t.id))];
 const floor=x=>({x,y:stage5LandY(x),support:'valley-floor'}),upper=x=>({x,y:topAt(shoulderTop,x),support:'stage5-west-shoulder'});
 Object.assign(s.anchors,{start:floor(330),receiver:{x:1590,y:2710,support:'valley-floor'},basin:floor(1740),shotGap:upper(1980),roost:upper(1760),exit:floor(2375),upperEntry:upper(730),upperShot:upper(1740),lowerApproach:floor(1200),ritualWest:{x:1490,y:2767,support:'stage5-ritual-stone'},ritualEast:{x:1640,y:2674,support:'stage5-ritual-stone'},shoreShot:floor(2375)});
 // The ritual stag keeps its role under the root, but its body stays left
 // of the buttress at x1820. The east station is on the far side of the
 // same stone crest, with readable separation rather than the range edge.
 const cells=[{key:'entry',role:'입구 하부 압박·상부 사수',members:[['hound',820,'floor'],['boar',1060,'floor'],['bat',1100,2110],['human',1250,'upper']]},{key:'ritual',role:'진 접근·고지 쟁탈',members:[['hound',1320,'floor'],['stag',1778,'floor'],['human',1760,'upper'],['crow',1680,2030]]},{key:'shore',role:'동쪽 사격 위치 견제',members:[['hound',2070,'floor'],['stag',2250,'floor'],['bat',2440,2380],['crow',2720,2540]]}];
 const units=s.units.filter(u=>u.team==='player');for(const u of units){const x=u.cls==='mage'||u.kind==='mage'?440:330;Object.assign(u,{x,y:2520,spawnX:x,spawnY:2520});}
 let index=0;s.encounters=[];
 for(const [ci,cell]of cells.entries()){
  const ids=[];for(const [kind,x,standing]of cell.members){const y=standing==='floor'?stage5LandY(x):standing==='upper'?topAt(shoulderTop,x):standing;
   // Keep the existing raw authored budget. Common balance still owns HP60%
   // after difficulty rounding and finite-wave x2; only its cloning is skipped.
   const u=clone(templates[kind]);
   Object.assign(u,{id:'foe-'+index,kind,team:'enemy',runtimeTemplate:true,x,y,spawnX:x,spawnY:y,group:ci+1,honroCluster:cell.key,honroStage5Cell:cell.key,honroEncounterRole:cell.role,honroSpawnReason:cell.role,awake:false,aggroUntil:0,lastAct:0,elite:false});ids.push(u.id);units.push(u);index++;
  }s.encounters.push({id:'encounter:'+cell.key,key:cell.key,unitIds:ids});
 }s.units=units;
 delete s.initialState.honroEncounterRevision;
 Object.assign(s.initialState,{honroStage5PositioningRevision:1,honroActiveLimit:4,enemyLimit:4,honroCounters:{initialEnemies:12,allyActions:0,spawned:0}});
 s.initialState.honroState={flags:{},collected:[],hold:0,lastRound:1,rescued:false,rescuedCount:0,receivers:0,ledger:false,sodanCoop:false,coopHold:0,allyQueue:null,combatLog:[],respawns:0,carriagePauseUntilRound:0};
 const map={'marker-0':'start','marker-1':'receiver','marker-3':'shotGap','marker-5':'cleat','receiver-5':'receiver','habitat-5-0':'basin','habitat-5-1':'roost'};
 for(const m of s.markers){if(map[m.id])Object.assign(m,s.anchors[map[m.id]]);else if(m.type==='rest'){m.x=m.id==='marker-2'?1370:2240;m.y=stage5LandY(m.x);}if(m.type==='hauntHabitat')m.label=m.kind==='crow'?'상부 암반의 새 둥지':'진 동쪽의 젖은 풀숲';}
 for(const e of s.elements){if(e.id==='landmark-1'){e.x=1590;e.y=2710;}else if(e.id==='stage5-entry-pine'){e.x=650;e.y=2390;}else if(e.id==='stage5-bank-pine'){e.x=980;e.y=topAt(shoulderTop,980);}}
 const wave=s.events.find(e=>e.id==='lower-beasts');if(wave){wave.when={progress:1750,after:'lower-beasts-warning',round:999999};wave.action={type:'spawn',n:3,x:345,y:2520,support:'valley-floor',kind:'stag',spacing:100,maxDistance:0};wave.entry={x:345,y:2520};}
 const warning=s.events.find(e=>e.id==='lower-beasts-warning');if(warning){warning.when={progress:1550};warning.text='서쪽 낮은 돌길에서 사슴들이 몰려온다. 다음 라운드부터 빈 입구로 들어오니 물길진과 돌아올 길을 살피자.';}
 s.routes=[];s.design.title='물길진 아래와 암반 어깨 위';s.design.question='설오는 상부 사선과 낮은 접근로 중 자리를 고르고, 담허는 진 안의 바위를 사이에 두고 서로 다른 방향을 지킨다.';
 s.design.gameplay=['ritual-gate','rock-overhang-upper-shot','sheltered-lower-approach','ritual-cover-reflection','regional-alerts','deep-plunge-pool','remote-cave-target'];
 // Approved shared granite is clipped to the canonical bodies. No rear paint
 // is allowed to fill the playable undercut or invent a second walk surface.
 s.design.geologyComposition={version:2,instances:[
  {id:'stage5-west-shoulder-granite',assetId:'geology:granite-ledge-neck',scale:1,socket:'ledge-back',support:{terrainId:'stage5-west-shoulder',at:.19},surfaceAttachment:{mode:'exposed'}},
  {id:'stage5-shoulder-root-granite',assetId:'geology:granite-ledge-neck',scale:.85,mirrorX:true,socket:'ledge-back',support:{terrainId:'stage5-west-shoulder',at:.84},surfaceAttachment:{mode:'exposed'}},
  {id:'stage5-bank-foundation',assetId:'geology:granite-foundation',scale:.85,socket:'mass-seat',support:{terrainId:'valley-floor',at:.35},surfaceAttachment:{mode:'exposed'}},
  {id:'stage5-ritual-granite',assetId:'geology:granite-ledge-neck',scale:.65,mirrorX:true,socket:'ledge-back',support:{terrainId:'stage5-ritual-stone',at:.5},surfaceAttachment:{mode:'exposed'}}]};
 s.design.positioning={revision:1,candidate:true,initial:12,elites:0,finite:6,activeLimit:4,populationCap:20,ritualRange:{x:125,y:80},cells:cells.map(c=>({key:c.key,role:c.role})),routes:{upper:[{x:580,y:stage5LandY(580),support:'valley-floor',jumpTo:{x:740,support:'stage5-west-shoulder'}},upper(1100),upper(1740),upper(1980),floor(2375)],lower:[floor(700),floor(1200),floor(1490)],ritual:[{x:1490,y:2767,support:'stage5-ritual-stone'},{x:1590,y:2650,support:'stage5-ritual-stone'},{x:1640,y:2674,support:'stage5-ritual-stone'}]}};
}
