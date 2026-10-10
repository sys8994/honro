/** Stage 22 greybox only. No live campaign writes, enemy authoring, art, or
 * shared physics changes. Short exposed lips join large asymmetric stone
 * masses; the underside is authored as carefully as the walking surface. */
const clone = value => JSON.parse(JSON.stringify(value));
export const V22_REVISION = 1;
export const V22_LAYOUT = { width: 4800, height: 6600, surfaces: [
  { id:'v22-lower-court', zone:'A', role:'foundation-court',
    top:[[0,5500],[350,5300],[1250,5300],[2000,4800],[2300,4800],[2650,4550],[3000,4550],[3300,4480],[3450,4480]],
    bottom:[[3450,4920],[3830,5350],[4800,5780],[4800,6600],[0,6600]] },
  { id:'v22-report-approach', zone:'B', role:'terraced-stone-return',
    top:[[1500,3845],[1570,3845],[1830,4170],[2110,4370],[2300,4405],[2520,4405]],
    bottom:[[2520,4455],[2310,4480],[2110,4550],[1800,4320],[1580,4010],[1500,3910]] },
  { id:'v22-report-crossing', zone:'C', role:'report-court-and-east-stone-rise',
    top:[[1700,3700],[2100,3700],[2330,3560],[2510,3430],[2710,3430],[3040,3070],[3350,2850],[3650,2850]],
    bottom:[[3650,3400],[3310,3640],[2940,3890],[2470,3940],[2150,3990],[1840,3900],[1700,3770]] },
  { id:'v22-west-gallery', zone:'D', role:'west-ventilated-stone-gallery',
    top:[[500,3050],[750,3050],[950,3300],[1220,3385],[2230,3385]],
    bottom:[[2230,3435],[1830,3490],[1480,3580],[1190,3570],[880,3440],[660,3330],[500,3260]] },
  { id:'v22-east-register-rise', zone:'E', role:'east-stone-shoulder',
    top:[[2670,2345],[2750,2345],[3050,2705],[3230,2705]],
    bottom:[[3230,2755],[3120,2820],[2860,2870],[2670,2550]] },
  { id:'v22-register-mass', zone:'F', role:'register-court-with-west-return',
    top:[[950,2905],[980,2905],[1430,2350],[1770,1900],[2020,1900],[2270,2200],[2540,2200]],
    bottom:[[2540,2250],[2350,2500],[2040,2750],[1690,2870],[1340,3060],[950,2990]] },
  { id:'v22-comparison-mass', zone:'G', role:'comparison-court-and-granary-exit',
    top:[[2220,1755],[2350,1755],[2680,1350],[3650,1350],[3970,1200],[4450,1200]],
    bottom:[[4450,1630],[3980,1760],[3460,1880],[2980,1890],[2620,1920],[2340,1930],[2220,1830]] }
] };

export function v22Y(id,x) {
  const surface=V22_LAYOUT.surfaces.find(s=>s.id===id);
  if(!surface) throw Error('Unknown Stage22 support '+id);
  for(let i=1;i<surface.top.length;i++) {
    const a=surface.top[i-1],b=surface.top[i];
    if(x>=a[0]-1e-6&&x<=b[0]+1e-6) return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);
  }
  throw Error('Stage22 support outside domain '+id+' @ '+x);
}
export const v22Pose=(id,x,extra={})=>({x,y:v22Y(id,x),surfaceId:id,...extra});
const gate=(id,x,y,h,support)=>({id,name:id==='archive-door'?'하층 봉인 판문':'보고고 위층 판문',type:'solid',
  points:[[x-22,y-h],[x+22,y-h],[x+22,y+12],[x-22,y+12]].map(([x,y])=>({x,y})),
  baseMaterial:'wood',breakable:false,oneWay:false,layer:'terrain',
  properties:{hp:100000,maxHp:100000,honroAct3Gate:true,honroVerticalStage22:true,honroSupportSurfaceId:support},
  detail:{spacing:24,roughness:0,seed:22,optimizeEpsilon:0}});
export function v22Terrains() {
  return V22_LAYOUT.surfaces.map(s=>({id:s.id,name:s.id,type:'solid',
    points:[...s.top,...s.bottom].map(([x,y])=>({x,y})),baseMaterial:'rock',breakable:false,oneWay:false,layer:'terrain',
    properties:{honroVerticalStage22:true,honroVerticalZone:s.zone,honroSpaceSurfaceId:s.id,honroSurfaceRole:s.role,
      honroWalkEdges:s.top.slice(1).map((_,i)=>i),surfaceKind:'stone'},
    detail:{spacing:24,roughness:0,seed:22,optimizeEpsilon:0}})).concat([
      gate('archive-door',1390,v22Y('v22-lower-court',1390),390,'v22-lower-court'),
      gate('upper-door',2180,v22Y('v22-report-crossing',2180),390,'v22-report-crossing')
    ]);
}
const walk=(id,from,to)=>{
  const s=V22_LAYOUT.surfaces.find(s=>s.id===id),lo=Math.min(from,to),hi=Math.max(from,to);
  return [...new Set([from,...s.top.map(p=>p[0]).filter(x=>x>lo&&x<hi),to])]
    .sort((a,b)=>from<to?a-b:b-a).map(x=>v22Pose(id,x));
};
const join=(...lists)=>lists.flat().filter((p,i,all)=>!i||JSON.stringify(p)!==JSON.stringify(all[i-1]));
const jump=(id,x,to,tx,speed=1)=>v22Pose(id,x,{jumpTo:{x:tx,y:v22Y(to,tx),support:to,speed}});
const drop=(id,x,to,tx,stepOffX)=>v22Pose(id,x,{dropTo:{x:tx,y:v22Y(to,tx),support:to,...(stepOffX===undefined?{}:{stepOffX})}});
const route=(id,anchors,extra={})=>({id,kind:'required',anchors,requires:[],defaultJump:true,...extra});
const requirement=(terrainId,objectiveId)=>({terrainId,state:'broken',objectiveId});
export const V22_NODES={
  A:v22Pose('v22-lower-court',1100),B:v22Pose('v22-lower-court',2650),
  C:v22Pose('v22-report-crossing',1950),D:v22Pose('v22-west-gallery',650),
  E:v22Pose('v22-report-crossing',3500),F:v22Pose('v22-register-mass',1950),
  G:v22Pose('v22-comparison-mass',3150),H:v22Pose('v22-comparison-mass',4200)
};
export function v22Routes() {
  const lower=[requirement('archive-door','archive-seal')],upper=[requirement('upper-door','ledger-case')];
  return [
    route('AB',walk('v22-lower-court',1100,2650),{requires:lower}),
    route('BA',walk('v22-lower-court',2650,1100),{kind:'return',requires:lower}),
    route('BC',join([jump('v22-lower-court',2650,'v22-report-approach',2450)],walk('v22-report-approach',2450,1510),[jump('v22-report-approach',1510,'v22-report-crossing',1730)],walk('v22-report-crossing',1730,1950))),
    route('CB',join(walk('v22-report-crossing',1950,1730),[jump('v22-report-crossing',1730,'v22-report-approach',1510)],walk('v22-report-approach',1510,2450),[jump('v22-report-approach',2450,'v22-lower-court',2650)],walk('v22-lower-court',2650,2650)),{kind:'return'}),
    route('CE',walk('v22-report-crossing',1950,3500),{requires:upper}),
    route('EC',walk('v22-report-crossing',3500,1950),{kind:'return',requires:upper}),
    route('EF',join(walk('v22-report-crossing',3500,3350),[jump('v22-report-crossing',3350,'v22-east-register-rise',3150)],walk('v22-east-register-rise',3150,2670),[jump('v22-east-register-rise',2670,'v22-register-mass',2470)],walk('v22-register-mass',2470,1950))),
    route('FE',join(walk('v22-register-mass',1950,2500),[jump('v22-register-mass',2500,'v22-east-register-rise',2700)],walk('v22-east-register-rise',2700,3200),[jump('v22-east-register-rise',3200,'v22-report-crossing',3450)],walk('v22-report-crossing',3450,3500)),{kind:'return'}),
    route('CD',join(walk('v22-report-crossing',1950,2380),[jump('v22-report-crossing',2380,'v22-west-gallery',2190)],walk('v22-west-gallery',2190,650)),{kind:'optional-jump',requires:upper}),
    route('DC',join(walk('v22-west-gallery',650,2190),[jump('v22-west-gallery',2190,'v22-report-crossing',2380)],walk('v22-report-crossing',2380,1950)),{kind:'return',requires:upper}),
    route('DE',join(walk('v22-west-gallery',650,2190),[jump('v22-west-gallery',2190,'v22-report-crossing',2380)],walk('v22-report-crossing',2380,3500)),{kind:'optional-jump',requires:upper}),
    route('ED',join(walk('v22-report-crossing',3500,2380),[jump('v22-report-crossing',2380,'v22-west-gallery',2190)],walk('v22-west-gallery',2190,650)),{kind:'optional-jump',requires:upper}),
    route('DF',join(walk('v22-west-gallery',650,750),[jump('v22-west-gallery',750,'v22-register-mass',980)],walk('v22-register-mass',980,1950)),{kind:'optional-jump'}),
    route('FD',join(walk('v22-register-mass',1950,980),[jump('v22-register-mass',980,'v22-west-gallery',750)],walk('v22-west-gallery',750,650)),{kind:'return'}),
    route('FG',join(walk('v22-register-mass',1950,2020),[jump('v22-register-mass',2020,'v22-comparison-mass',2260)],walk('v22-comparison-mass',2260,3150))),
    route('GF',join(walk('v22-comparison-mass',3150,2250),[jump('v22-comparison-mass',2250,'v22-register-mass',2010)],walk('v22-register-mass',2010,1950)),{kind:'return'}),
    route('GH',walk('v22-comparison-mass',3150,4200)),
    route('HG',walk('v22-comparison-mass',4200,3150),{kind:'return'}),
    route('FE-walkoff',join(walk('v22-register-mass',1950,2510),[drop('v22-register-mass',2510,'v22-east-register-rise',2700)],walk('v22-east-register-rise',2700,3200),[drop('v22-east-register-rise',3200,'v22-report-crossing',3450)],walk('v22-report-crossing',3450,3500)),{kind:'return',defaultJump:false})
  ];
}

export function authorStage22VerticalGeometry(g,project) {
  const p=clone(project),index=p.stages.findIndex(s=>s.metadata?.stageId===22),s=p.stages[index];
  if(!s) throw Error('Missing Stage22');
  const others=JSON.stringify(p.stages.filter((_,i)=>i!==index));
  s.width=V22_LAYOUT.width;s.height=V22_LAYOUT.height;
  for(const key of ['terrainBounds','playBounds','terrainDomainVersion','detailStats']) delete s[key];
  s.terrains=v22Terrains();s.materials=[];s.elements=[];s.camera={};s.encounters=[];
  // Events and objective steps remain the original contract. Their eventual
  // entry placement and enemy composition are explicitly NOT authored here.
  s.units=s.units.filter(u=>u.team==='player').map((u,i)=>({...u,...v22Pose('v22-lower-court',[700,800,900,1000][i]),facing:1}));
  const nodes=clone(V22_NODES),routes=v22Routes(),sites={
    'archive-seal':nodes.A,'ledger-case':nodes.C,'upper-register':nodes.F,
    'compare-ledgers':nodes.G,'archive-exit':nodes.H,
    'wave-compare-ledgers':v22Pose('v22-comparison-mass',3750)
  };
  s.markers=s.markers.map(m=>sites[m.id]?{...m,...sites[m.id]}:m);
  const roomFor={'archive-seal':'A','ledger-case':'C','upper-register':'F','compare-ledgers':'G','archive-exit':'H'};
  s.design={act3:{version:1,kind:'archive',responses:clone(s.design?.act3?.responses)},
    space:{version:1,geometryRevision:1,topologyId:'vertical-korean-archive-stone-courts',
      rooms:Object.entries(nodes).map(([id,n])=>({id:'v22-'+id,terrainIds:V22_LAYOUT.surfaces.filter(v=>v.zone===id||id==='B'&&v.zone==='A'||id==='H'&&v.zone==='G').map(v=>v.id),ceilingIds:[],bounds:{x:n.x-650,y:n.y-400,w:1300,h:800},sky:'open'})),
      surfaces:V22_LAYOUT.surfaces.map(v=>({id:v.id,terrainId:v.id,role:v.role,edgeIndices:s.terrains.find(t=>t.id===v.id).properties.honroWalkEdges,roomIds:['v22-'+v.zone]})),routes,
      connections:routes.map(r=>({id:r.id,from:'v22-'+r.id[0],to:'v22-'+r.id[1],kind:r.requires.length?'gated-walk':r.kind==='optional-jump'?'optional-jump':'walk',routeId:r.id,entry:clone(r.anchors[0]),exit:clone(r.anchors.at(-1)),requires:clone(r.requires)})),
      sites:Object.fromEntries(Object.entries(sites).filter(([id])=>roomFor[id]).map(([id,n])=>[id,{objectiveId:id,roomId:'v22-'+roomFor[id],...n,standing:clone(n)}])),
      encounterSites:[],landmarks:[],scenery:[],lights:[],views:[]},
    vertical22:{revision:V22_REVISION,status:'greybox-not-gameplay-approved',nodes,routes,
      scope:'Geometry-only isolated basic traversal. Original five ordered objectives, two real gates and encounter/response revisions retained. Enemy placement, finite entries, combat, art, browser and saves are not approved.',
      deviations:['D is the west turning shoulder (650,3050).','G is widened to a real 970-unit level comparison court; H moves east along its connected exit terrace.']}};
  s.routes=routes.filter(r=>['AB','BC','CE','EF','FG','GH'].includes(r.id)).flatMap(r=>r.anchors.map(({x,y,surfaceId})=>({x,y,surfaceId})));
  s.anchors={spawn:v22Pose('v22-lower-court',700),start:clone(nodes.A),exit:clone(nodes.H)};
  s.initialState={...s.initialState,honroVerticalStage22Revision:V22_REVISION};
  s.environment=g.HonroEnvironment.makeEnvironment(s,{preset:'valley'});
  const out=g.HonroTerrainDomain.author(p);
  if(JSON.stringify(out.stages.filter((_,i)=>i!==index))!==others) throw Error('Vertical22 changed another stage');
  return out;
}
