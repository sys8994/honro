/** Stage30's folded ferry shore. Fresh battles opt in; saved battles own their terrain. */
import {readFile} from 'node:fs/promises';
const clone=v=>JSON.parse(JSON.stringify(v));
export const FERRY_REVISION=1;
export const FERRY_LAYOUT=JSON.parse(await readFile(new URL('./stage30-ferry-layout.json',import.meta.url),'utf8'));
export function ferryY(id,x){const s=FERRY_LAYOUT.surfaces.find(s=>s.id===id);if(!s)throw Error('Unknown ferry surface '+id);for(let i=1;i<s.top.length;i++){const a=s.top[i-1],z=s.top[i];if(x>=a[0]-1e-7&&x<=z[0]+1e-7)return a[1]+(z[1]-a[1])*(x-a[0])/(z[0]-a[0]);}throw Error('Missing ferry surface '+id+' @ '+x);}
export function ferryTerrains(){return FERRY_LAYOUT.surfaces.map(s=>{
 const bottom=s.bottom||s.top.slice().reverse().map(([x,y])=>[x,y+(s.depth||110)]),wood=/wood|hull/.test(s.role),soil=s.zone==='B'||s.role==='recovery-shore';
 return{id:s.id,name:s.id,type:'solid',points:[...s.top,...bottom].map(([x,y])=>({x,y})),baseMaterial:wood?'wood':soil?'earth':'rock',breakable:false,oneWay:!!s.oneWay,layer:'terrain',properties:{honroFerry:true,honroFerryZone:s.zone,honroSpaceSurfaceId:s.id,honroSurfaceRole:s.role,honroWalkEdges:s.role==='collapse-screen'||s.role==='solid-reflector'?[]:s.top.slice(1).map((_,i)=>i),surfaceKind:soil?'earth':wood?'wood':'granite',...(s.state==='settled'?{broken:true}:{}),...(s.role==='collapse-screen'?{honroFerryCollapse:true}:{}),...(s.role==='solid-wood-hull'?{honroFerryHull:true}:{}),hp:99999,maxHp:99999},detail:{spacing:24,roughness:0,seed:30,optimizeEpsilon:0}};
});}
function pose(id,x,extra={}){return{x,y:ferryY(id,x),surfaceId:id,...extra};}
function route(id,kind,anchors,extra={}){return{id,kind,anchors,requires:[],defaultJump:true,...extra};}
const walk=(id,a,z)=>{const s=FERRY_LAYOUT.surfaces.find(s=>s.id===id),xs=[a,...s.top.map(p=>p[0]).filter(x=>x>Math.min(a,z)&&x<Math.max(a,z)),z];return[...new Set(xs)].sort((x,y)=>a<z?x-y:y-x).map(x=>pose(id,x));};
const join=(...a)=>a.flat().filter((p,i,all)=>!i||JSON.stringify(p)!==JSON.stringify(all[i-1]));
export function ferryRoutes(){const routes=[
 route('entry-record','required',walk('sf-map-rock',700,1320)),
 route('record-low-ford','required',join(walk('sf-map-rock',1320,1610),walk('sf-west-ford',1610,4190))),
 route('ford-quay','required',join([pose('sf-west-ford',4190,{jumpTo:{x:4210,support:'sf-landing-west-stairs',speed:.25}})],walk('sf-landing-west-stairs',4210,4610),[pose('sf-landing-west-stairs',4610,{jumpTo:{x:4790,support:'sf-landing-upper-step',speed:.8}})],walk('sf-landing-upper-step',4790,4850),walk('sf-ferry-court',4850,5550))),
 route('record-cape','optional-walk',join(walk('sf-map-rock',1320,1550),[pose('sf-map-rock',1550,{jumpTo:{x:1650,support:'sf-cape-west-access',speed:.3}})],walk('sf-cape-west-access',1650,3040),walk('sf-granite-cape',3040,4190))),
 route('cape-quay','return',join(walk('sf-granite-cape',4190,5420),walk('sf-cape-east-descent',5420,6260),[pose('sf-cape-east-descent',6260,{dropTo:{x:6310,support:'sf-east-quay-entry'}})],walk('sf-east-quay-entry',6310,6260),walk('sf-ferry-court',6260,5550))),
 route('quay-cape','return',join(walk('sf-ferry-court',5550,5870),[pose('sf-ferry-court',5870,{jumpTo:{x:5990,support:'sf-quay-reflector',speed:.3}}),pose('sf-quay-reflector',5990,{jumpTo:{x:6020,support:'sf-cape-east-descent',speed:.2}})],walk('sf-cape-east-descent',6020,5420),walk('sf-granite-cape',5420,4190))),
 route('cape-old-road','required',join(walk('sf-granite-cape',4190,5420),[pose('sf-granite-cape',5400,{jumpTo:{x:5580,support:'sf-cape-bank-link',speed:.35}})],walk('sf-cape-bank-link',5580,6100),walk('sf-bank-inner',6100,8450),walk('sf-old-road-west-rise',8450,9220),walk('sf-old-road-west-bridge',9220,9350),walk('sf-old-road-gather',9350,9450))),
 route('quay-ford-return','return',join(walk('sf-ferry-court',5550,4850),walk('sf-landing-upper-step',4850,4770),[pose('sf-landing-upper-step',4770,{jumpTo:{x:4590,support:'sf-landing-west-stairs',speed:.4}})],walk('sf-landing-west-stairs',4590,4190),[pose('sf-landing-west-stairs',4190,{dropTo:{x:4140,support:'sf-west-ford'}})],walk('sf-west-ford',4140,6020))),
 route('quay-short-return','return',join(walk('sf-ferry-court',5550,4850),walk('sf-landing-upper-step',4850,4770),[pose('sf-landing-upper-step',4770,{dropTo:{x:4740,support:'sf-return-tooth-1'}}),pose('sf-return-tooth-1',4740,{dropTo:{x:4670,support:'sf-return-tooth-2'}}),pose('sf-return-tooth-2',4670,{dropTo:{x:4770,support:'sf-return-tooth-3'}}),pose('sf-return-tooth-3',4770,{dropTo:{x:4860,support:'sf-west-ford'}})],walk('sf-west-ford',4860,6020))),
 route('ferry-barge-exit','required',join(walk('sf-settled-barge',6020,7460),walk('sf-east-landing-planks',7460,8450),walk('sf-east-outer-grade',8450,9240),[pose('sf-east-outer-grade',9240,{jumpTo:{x:9260,support:'sf-old-road-return-flight',speed:.3}})],walk('sf-old-road-return-flight',9260,9160),[pose('sf-old-road-return-flight',9160,{jumpTo:{x:9210,support:'sf-old-road-upper-flight',speed:.3}})],walk('sf-old-road-upper-flight',9210,9310),[pose('sf-old-road-upper-flight',9310,{jumpTo:{x:9330,support:'sf-old-road-west-bridge',speed:.2}})]),{ferryState:'settled',objectiveId:'old-road',insideOriginalGatherRadius:true}),
 route('west-wet-recovery','recovery',walk('sf-west-ford',6460,5400)),
 route('east-wet-recovery','recovery',walk('sf-east-recovery-shore',7210,8450)),
 ];
 return routes;
}
// Convex envelope of the real visual hull positions. This is a safety sweep,
// never collision: players can always keep the original high escape route.
export function ferrySweep(){
 const hull=ferryTerrains().find(t=>t.id==='sf-settled-barge'),pivot=FERRY_LAYOUT.surfaces.find(t=>t.id===hull.id).top.at(-1),from={x:80,y:-145,rotation:.008};
 const pts=[];for(const t of [0,.25,.5,.75,1]){const a=from.rotation*(1-t),c=Math.cos(a),ss=Math.sin(a);for(const p of hull.points){const x=p.x-pivot[0],y=p.y-pivot[1],xx=pivot[0]+from.x*(1-t)+x*c-y*ss,yy=pivot[1]+from.y*(1-t)+x*ss+y*c;for(const dx of [-6,6])for(const dy of [-6,6])pts.push({x:xx+dx,y:yy+dy});}}
 pts.sort((a,z)=>a.x-z.x||a.y-z.y);const cross=(a,z,p)=>(z.x-a.x)*(p.y-a.y)-(z.y-a.y)*(p.x-a.x),low=[],high=[];for(const p of pts){while(low.length>1&&cross(low.at(-2),low.at(-1),p)<=0)low.pop();low.push(p);}for(const p of pts.slice().reverse()){while(high.length>1&&cross(high.at(-2),high.at(-1),p)<=0)high.pop();high.push(p);}return{artFrom:from,sweepPolygons:[{id:'hull-settling-envelope',points:[...low.slice(0,-1),...high.slice(0,-1)]}]};
}
export function authorFerryEncounters(g,p,s,{roster=s.initialState?.honroFerryRoster||'candidate26e6'}={}){
 const baseline=roster!=='candidate26e6',oldBudget=roster==='originalBudget20e4';
 const groups=clone(FERRY_LAYOUT.encounters).map(group=>({
  ...group,anchor:group.members[0].support,
  members:group.members.filter(u=>!baseline||!u.removeFor20).map(u=>({
   ...u,elite:u.elite&&!(oldBudget&&['c3','fg1'].includes(u.id))
  }))
 }));
 s.units=s.units.filter(u=>u.team!=='enemy');s.encounters=[];
 for(const [index,group] of groups.entries()){
  const ids=[];for(const [j,row]of group.members.entries()){
   const id='sf-'+row.id,kind=row.kind,y=ferryY(row.support,row.x)-(g.HonroWorld.archetypes[kind]?.flying?32:0);ids.push(id);
   s.units.push({id,kind,team:'enemy',x:row.x,y,facing:-1,spawnIndex:index*6+j,behavior:'patrol',encounterGroup:group.id,stageOverrides:{honroCohort:group.id,honroAct3Encounter:1,honroAct3Elite:row.elite,honroEncounterRole:row.role,honroEncounterSupport:row.support,honroFerryCell:group.id}});
  }s.encounters.push({id:group.id,key:group.id,behavior:'patrol',unitIds:ids});
 }
 s.design.act3.encounterPlan={version:3,groups,initial:groups.reduce((n,g)=>n+g.members.length,0),elites:groups.reduce((n,g)=>n+g.members.filter(u=>u.elite).length,0),activeLimit:3,scope:'Fresh Stage30 exact role clusters; finite10; unchanged per-stage XP and combat stats.'};
 s.initialState.honroFerryRoster=roster;s.initialState.honroFerryPopulationCap=baseline?30:36;
 return s;
}
export function applyStage30Ferry(g,project,{roster='candidate26e6'}={}){
 const p=clone(project),at=p.stages.findIndex(s=>s.metadata?.stageId===30);if(at<0)throw Error('Stage30 source missing');const old=p.stages[at],s=clone(old);
 Object.assign(s,{width:11200,height:7200,name:'남겨진 길',backdrop:'river',terrains:ferryTerrains(),materials:[],elements:[],events:[],encounters:[],units:[],routes:[]});
 for(const key of ['terrainBounds','playBounds','terrainDomainVersion','detailStats'])delete s[key];
 const steps=clone(old.initialState.honroAct3Steps);s.initialState={honroAct3Revision:1,honroLocationRevision:2,honroActiveLimit:3,honroAct3EncounterRevision:1,honroObjectiveRevision:2,honroAct3Steps:steps,honroAct3ResponseRevision:1,honroFerryRevision:1,honroFerryRoster:roster,honroFerryPopulationCap:roster==='candidate26e6'?36:30,honroState:{flags:{},collected:[],hold:0,lastRound:1,rescued:false,combatLog:[]}};
 s.markers=FERRY_LAYOUT.objectives.map(o=>({id:o.id,type:o.kind==='reach'?'exit':'act3',x:o.point[0],y:o.point[1],label:steps.find(st=>st.id===o.id).label,...(o.kind==='interact'?{action:'act3'}:{})}));
 s.markers.push({id:'wave-ferry-hold',type:'act3-wave',x:3780,y:ferryY('sf-west-ford',3780),label:'갈대 여울에서 다가오는 산개'});
 s.anchors={spawn:pose('sf-map-rock',700),start:pose('sf-map-rock',700),exit:{x:9450,y:4300}};
 for(const [i,cls]of ['archer','mage','knight','occultist'].entries()){const x=[700,840,1010,1160][i];s.units.push({id:'p-'+cls,kind:cls,team:'player',x,y:ferryY('sf-map-rock',x),facing:1});}
 const routes=ferryRoutes();s.design={act3:{version:1,kind:'folded-riverside-ferry',locationRevision:2,mainBuildings:[],bridges:['sf-cape-bank-link','sf-old-road-west-bridge'],requiredRoute:routes.filter(r=>['entry-record','record-low-ford','ford-quay'].includes(r.id)).flatMap(r=>r.anchors),optionalRoutes:routes.filter(r=>r.kind!=='required').map(r=>({id:r.id,points:r.anchors})),departureGathering:{x:9450,y:4300,radius:440,flatFrom:9350,flatTo:10170},shotSamples:[]},ferry:{revision:1,version:1,zones:clone(FERRY_LAYOUT.zones),routes,scope:'Large river cross section. Three original goals; before/settled static terrain; normal traversal and combat validation tracked separately.'}};
 s.routes=routes.flatMap(r=>r.anchors.map((p,i)=>({id:r.id+'-'+i,kind:r.kind,x:p.x,y:p.y,...(p.jumpTo?{jumpTo:p.jumpTo}:{}),surfaceId:p.surfaceId})));
 const entries={
 'act3-response-30-0':{x:800,y:ferryY('sf-map-rock',800),support:'sf-map-rock',side:'west',alternates:[{x:500,y:ferryY('sf-map-rock',500),support:'sf-map-rock'}]},
 'act3-response-30-1':{x:6400,y:5470,support:'sf-east-quay-entry',side:'east',alternates:[{x:6580,y:5470,support:'sf-east-quay-entry'}]},
 'act3-ferry-hold':{x:3780,y:ferryY('sf-west-ford',3780),support:'sf-west-ford',side:'low-west',alternates:[{x:3500,y:ferryY('sf-west-ford',3500),support:'sf-west-ford'}]},
 'act3-response-30-2':{x:8270,y:4670,support:'sf-high-response-ledge',side:'high-east',alternates:[{x:8050,y:4670,support:'sf-high-response-ledge'}]}
 };
 s.initialState.honroFerrySpec={enableTerrainIds:['sf-settled-barge'],disableTerrainIds:['sf-outbank-screen'],...ferrySweep(),entries};
 const responses=[['act3-response-30-0','transport-map','kilnFiend',2,'지도를 폈던 서쪽 바위길에서 종틀이 끌리는 소리가 난다.'],['act3-response-30-1','transport-map','possessedGuard',3,'동쪽 선창으로 수비병 악귀들이 내려온다.'],['act3-response-30-2','ferry-hold','possessedArcher',2,'높은 옛길 바깥 널판 위로 궁귀들의 그림자가 다가온다.']];
 for(const [id,objective,kind,n,warning]of responses){const a=entries[id];s.events.push({id,once:true,when:{objectiveDone:objective},warning,text:warning,entry:{x:a.x,y:a.y},action:{type:'spawn',kind,n,x:a.x,y:a.y,spacing:110,maxDistance:260,source:id,act3Authored:true,elite:false}});}
 s.design.act3.responses={version:1,count:3,enemies:7,scope:'Finite objective-linked2+3+2; separate existing hold3; warning and atomic same-side entries.'};
 s.materials.push({id:'sf-main-river',kind:'water-pool',conductive:true,points:[[6460,6580],[7210,6580],[7210,7200],[6460,7200]],surface:[[6460,6580],[7210,6580]],bottom:[[6460,7200],[7210,7200]],attached:true});
 s.environment=g.HonroEnvironment.makeEnvironment(s,{preset:'forest'});s.environment.skyVisible=true;
 s.camera={};authorFerryEncounters(g,p,s,{roster});p.stages[at]=s;return g.HonroMaps.finalize(g.HonroTerrainDomain.author(p));
}
