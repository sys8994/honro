/** Stage 22 greybox only. No live campaign writes, enemy authoring, art, or
 * shared physics changes. Short exposed lips join large asymmetric stone
 * masses; the underside is authored as carefully as the walking surface. */
const clone = value => JSON.parse(JSON.stringify(value));
export const V22_REVISION = 1;
export const V22_LAYOUT = { width: 4800, height: 6600, surfaces: [
  { id:'v22-lower-court', zone:'A', role:'foundation-court',
    top:[[0,5500],[350,5300],[1300,5300],[1900,4550],[2700,4550],[3100,4480],[3450,4480]],
    bottom:[[3450,4920],[3830,5350],[4800,5780],[4800,6600],[0,6600]] },
  { id:'v22-report-approach', zone:'B', role:'terraced-stone-return',
    top:[[1150,3845],[1220,3845],[1650,4405],[1770,4405]],
    bottom:[[1770,4455],[1620,4490],[1440,4330],[1230,4000],[1150,3900]] },
  { id:'v22-report-crossing', zone:'C', role:'report-court-and-east-stone-rise',
    top:[[1370,3700],[1510,3700],[1780,3400],[1890,3400],[2300,2850],[3000,2850]],
    bottom:[[3000,3320],[2560,3500],[2110,3650],[1740,3850],[1480,3900],[1370,3770]] },
  { id:'v22-west-gallery', zone:'D', role:'west-ventilated-stone-gallery',
    top:[[80,2750],[350,2750],[700,3140],[1010,3255],[1660,3255]],
    bottom:[[1660,3305],[1350,3360],[970,3440],[680,3350],[430,3060],[80,2980]] },
  { id:'v22-east-register-rise', zone:'E', role:'east-stone-shoulder',
    top:[[1810,2345],[1860,2345],[2140,2705],[2200,2705]],
    bottom:[[2200,2755],[2090,2820],[1860,2780],[1810,2520]] },
  { id:'v22-register-mass', zone:'F', role:'register-court-with-west-return',
    top:[[570,2605],[600,2605],[1130,1900],[1310,1900],[1560,2200],[1700,2200]],
    bottom:[[1700,2250],[1520,2500],[1240,2730],[890,2920],[570,2690]] },
  { id:'v22-comparison-mass', zone:'G', role:'comparison-court-and-granary-exit',
    top:[[1500,1755],[1560,1755],[1990,1200],[2960,1200]],
    bottom:[[2960,1620],[2520,1760],[2100,1960],[1750,1960],[1500,1825]] }
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
      gate('archive-door',1340,v22Y('v22-lower-court',1340),390,'v22-lower-court'),
      gate('upper-door',1560,v22Y('v22-report-crossing',1560),390,'v22-report-crossing')
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
  A:v22Pose('v22-lower-court',1250),B:v22Pose('v22-lower-court',1930),
  C:v22Pose('v22-report-crossing',1450),D:v22Pose('v22-west-gallery',280),
  E:v22Pose('v22-report-crossing',2390),F:v22Pose('v22-register-mass',1270),
  G:v22Pose('v22-comparison-mass',2475),H:v22Pose('v22-comparison-mass',2715)
};
export function v22Routes() {
  const lower=[requirement('archive-door','archive-seal')],upper=[requirement('upper-door','ledger-case')];
  return [
    route('AB',walk('v22-lower-court',1250,1930),{requires:lower}),
    route('BA',walk('v22-lower-court',1930,1250),{kind:'return',requires:lower}),
    route('BC',join([jump('v22-lower-court',1930,'v22-report-approach',1710)],walk('v22-report-approach',1710,1180),[jump('v22-report-approach',1180,'v22-report-crossing',1400)],walk('v22-report-crossing',1400,1450))),
    route('CB',join(walk('v22-report-crossing',1450,1400),[jump('v22-report-crossing',1400,'v22-report-approach',1180)],walk('v22-report-approach',1180,1710),[jump('v22-report-approach',1710,'v22-lower-court',1930)],walk('v22-lower-court',1930,1930)),{kind:'return'}),
    route('CE',walk('v22-report-crossing',1450,2390),{requires:upper}),
    route('EC',walk('v22-report-crossing',2390,1450),{kind:'return',requires:upper}),
    route('EF',join([jump('v22-report-crossing',2390,'v22-east-register-rise',2170)],walk('v22-east-register-rise',2170,1810),[jump('v22-east-register-rise',1810,'v22-register-mass',1590)],walk('v22-register-mass',1590,1270))),
    route('FE',join(walk('v22-register-mass',1270,1670),[jump('v22-register-mass',1670,'v22-east-register-rise',1830)],walk('v22-east-register-rise',1830,2170),[jump('v22-east-register-rise',2170,'v22-report-crossing',2390)],walk('v22-report-crossing',2390,2390)),{kind:'return'}),
    route('CD',join(walk('v22-report-crossing',1450,1820),[jump('v22-report-crossing',1820,'v22-west-gallery',1600)],walk('v22-west-gallery',1600,280)),{kind:'optional-jump',requires:upper}),
    route('DC',join(walk('v22-west-gallery',280,1600),[jump('v22-west-gallery',1600,'v22-report-crossing',1820)],walk('v22-report-crossing',1820,1450)),{kind:'return',requires:upper}),
    route('DE',join(walk('v22-west-gallery',280,1600),[jump('v22-west-gallery',1600,'v22-report-crossing',1820)],walk('v22-report-crossing',1820,2390)),{kind:'optional-jump',requires:upper}),
    route('ED',join(walk('v22-report-crossing',2390,1820),[jump('v22-report-crossing',1820,'v22-west-gallery',1600)],walk('v22-west-gallery',1600,280)),{kind:'optional-jump',requires:upper}),
    route('DF',join(walk('v22-west-gallery',280,350),[jump('v22-west-gallery',350,'v22-register-mass',600)],walk('v22-register-mass',600,1270)),{kind:'optional-jump'}),
    route('FD',join(walk('v22-register-mass',1270,600),[jump('v22-register-mass',600,'v22-west-gallery',350)],walk('v22-west-gallery',350,280)),{kind:'return'}),
    route('FG',join(walk('v22-register-mass',1270,1310),[jump('v22-register-mass',1310,'v22-comparison-mass',1530)],walk('v22-comparison-mass',1530,2475))),
    route('GF',join(walk('v22-comparison-mass',2475,1530),[jump('v22-comparison-mass',1530,'v22-register-mass',1290)],walk('v22-register-mass',1290,1270)),{kind:'return'}),
    route('GH',walk('v22-comparison-mass',2475,2715)),
    route('HG',walk('v22-comparison-mass',2715,2475),{kind:'return'}),
    route('FE-walkoff',join(walk('v22-register-mass',1270,1670),[drop('v22-register-mass',1670,'v22-east-register-rise',1830)],walk('v22-east-register-rise',1830,2170),[drop('v22-east-register-rise',2170,'v22-report-crossing',2390)],walk('v22-report-crossing',2390,2390)),{kind:'return',defaultJump:false})
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
  s.units=s.units.filter(u=>u.team==='player').map((u,i)=>({...u,...v22Pose('v22-lower-court',[850,950,1050,1150][i]),facing:1}));
  const nodes=clone(V22_NODES),routes=v22Routes(),sites={
    'archive-seal':nodes.A,'ledger-case':nodes.C,'upper-register':nodes.F,
    'compare-ledgers':nodes.G,'archive-exit':nodes.H,
    'wave-compare-ledgers':v22Pose('v22-comparison-mass',2890)
  };
  s.markers=s.markers.map(m=>sites[m.id]?{...m,...sites[m.id]}:m);
  const roomFor={'archive-seal':'A','ledger-case':'C','upper-register':'F','compare-ledgers':'G','archive-exit':'H'};
  s.design={act3:{version:1,kind:'archive',responses:clone(s.design?.act3?.responses)},
    space:{version:1,geometryRevision:2,topologyId:'vertical-korean-archive-stone-courts',
      rooms:Object.entries(nodes).map(([id,n])=>({id:'v22-'+id,terrainIds:V22_LAYOUT.surfaces.filter(v=>v.zone===id||id==='B'&&v.zone==='A'||id==='H'&&v.zone==='G').map(v=>v.id),ceilingIds:[],bounds:{x:n.x-650,y:n.y-400,w:1300,h:800},sky:'open'})),
      surfaces:V22_LAYOUT.surfaces.map(v=>({id:v.id,terrainId:v.id,role:v.role,edgeIndices:s.terrains.find(t=>t.id===v.id).properties.honroWalkEdges,roomIds:['v22-'+v.zone]})),routes,
      connections:routes.map(r=>({id:r.id,from:'v22-'+r.id[0],to:'v22-'+r.id[1],kind:r.requires.length?'gated-walk':r.kind==='optional-jump'?'optional-jump':'walk',routeId:r.id,entry:clone(r.anchors[0]),exit:clone(r.anchors.at(-1)),requires:clone(r.requires)})),
      sites:Object.fromEntries(Object.entries(sites).filter(([id])=>roomFor[id]).map(([id,n])=>[id,{objectiveId:id,roomId:'v22-'+roomFor[id],...n,standing:clone(n)}])),
      encounterSites:[],landmarks:[],scenery:[],lights:[],views:[]},
    vertical22:{revision:V22_REVISION,geometryRevision:2,status:'greybox-not-gameplay-approved',nodes,routes,
      scope:'Geometry-only isolated basic traversal. Original five ordered objectives, two real gates and encounter/response revisions retained. Enemy placement, finite entries, combat, art, browser and saves are not approved.',
      deviations:['D is the west turning shoulder (280,2750); its west ascent remains optional.','G and H share the highest 970-unit court at y1200. The original radius460 fits around G, and H has 245 units of clear floor beyond the exit.','Long approach flats are shortened; the wider B/E wings remain usable without making their far ends mandatory.']}};
  s.routes=routes.filter(r=>['AB','BC','CE','EF','FG','GH'].includes(r.id)).flatMap(r=>r.anchors.map(({x,y,surfaceId})=>({x,y,surfaceId})));
  s.anchors={spawn:v22Pose('v22-lower-court',850),start:clone(nodes.A),exit:clone(nodes.H)};
  s.initialState={...s.initialState,honroVerticalStage22Revision:V22_REVISION};
  s.environment=g.HonroEnvironment.makeEnvironment(s,{preset:'valley'});
  const out=g.HonroTerrainDomain.author(p);
  if(JSON.stringify(out.stages.filter((_,i)=>i!==index))!==others) throw Error('Vertical22 changed another stage');
  return out;
}
