/** Stage12's two unequal quarry circuits. All contacts are real shared-engine
 * terrain. Geometry authoring changes Stage12 only and never live saves. */
const clone=v=>JSON.parse(JSON.stringify(v));
export const QUARRY_REVISION=1;
export const QUARRY_LAYOUT={width:11200,height:8000,physics:{heroH:92,heroR:22,maxMandatoryRise:150,maxMandatoryGap:140,jumpVelocity:-660,jumpGravity:1000},surfaces:[
 {id:'sq-old-road',zone:'A',role:'old-road-mass',top:[[7820,3180],[8170,3030],[8610,2960],[9090,2720],[9580,2570],[10000,2380],[10620,2380],[11200,2540]],bottom:[[11200,3270],[10600,3360],[10030,3130],[9470,3210],[8890,3230],[8240,3310],[7820,3250]]},
 {id:'sq-north-quarry',zone:'B',role:'quarry-mass',top:[[5330,3760],[5800,3700],[6250,3550],[6740,3540],[7130,3370],[7510,3310],[7690,3310],[7980,3470],[8270,3640],[8540,3870],[8750,4000],[8870,4000]],bottom:[[8870,4120],[8550,4280],[8140,4240],[7740,4370],[7320,4230],[6950,4200],[6520,4070],[6070,4080],[5710,3970],[5330,3880]]},
 {id:'sq-west-quarry',zone:'C',role:'quarry-mass',top:[[3300,4390],[3700,4290],[4090,4110],[4530,4050],[4850,3910],[5190,3890],[5450,4210],[5750,4410],[5920,4540]],bottom:[[5920,4650],[5650,4760],[5160,4720],[4700,4610],[4240,4570],[3770,4590],[3420,4540],[3300,4500]]},
 {id:'sq-west-turn-high',zone:'D',role:'short-fracture',top:[[3120,4520],[3260,4520]],depth:65},
 {id:'sq-west-turn-low',zone:'D',role:'short-fracture',top:[[3270,4650],[3380,4650]],depth:60},
 {id:'sq-lower-ground',zone:'E',role:'ground-mass',top:[[0,5420],[1300,5290],[2210,5070],[2930,4860],[3470,4790],[3820,4960],[4330,5030],[4860,5000],[5320,4930],[5740,4870],[6160,4800],[6520,4800],[6980,4800],[7290,5140],[7600,5470],[8060,5810],[8460,6000],[9270,6060],[10100,6210],[11200,6460]],bottom:[[11200,8000],[0,8000]]},
 {id:'sq-inner-joint',zone:'C',role:'short-fracture',top:[[6020,4670],[6160,4670]],depth:24},
 {id:'sq-back-road',zone:'G',role:'undercut-return',top:[[7110,4660],[7510,4610],[7920,4470],[8300,4520],[8620,4390],[8980,4280],[9250,4270]],bottom:[[9250,4400],[8980,4490],[8650,4620],[8270,4660],[7850,4640],[7420,4790],[7110,4770]]},
 {id:'sq-east-turn',zone:'G',role:'short-fracture',top:[[8980,4130],[9150,4130]],depth:30},
 {id:'sq-cave-buttress',zone:'H',role:'ceiling',top:[[7470,4700],[8937.5,4350]],bottom:[[9250,5290],[8070,5500],[7800,5330],[7470,5100]]},
 {id:'sq-cave-roof',zone:'H',role:'ceiling',top:[[7800,5200],[8180,5050],[8760,5100],[9250,5290],[10100,5470],[11200,5610]],bottom:[[11200,5920],[10100,5770],[9250,5620],[8570,5500],[8070,5500],[7800,5330]]},
 {id:'sq-turning-veil',zone:'H',role:'event-veil',top:[[7380,4690],[7470,4690]],bottom:[[7470,5360],[7380,5360]],gate:true}
]};
// The east turn is deliberately compressed; no distant empty outer lap.
for(const surface of QUARRY_LAYOUT.surfaces.filter(s=>['sq-north-quarry','sq-back-road','sq-east-turn'].includes(s.id)))for(const list of [surface.top,surface.bottom||[]])for(const point of list)if(point[0]>8000)point[0]=8000+(point[0]-8000)*.75;
export function quarryY(id,x){const s=QUARRY_LAYOUT.surfaces.find(s=>s.id===id);if(!s)throw Error('Unknown quarry support '+id);for(let i=1;i<s.top.length;i++){const a=s.top[i-1],z=s.top[i];if(x>=a[0]-1e-6&&x<=z[0]+1e-6)return a[1]+(z[1]-a[1])*(x-a[0])/(z[0]-a[0]);}throw Error('Quarry support outside domain '+id+' @ '+x);}
export const quarryPose=(surfaceId,x,extra={})=>({x,y:quarryY(surfaceId,x),surfaceId,...extra});
export function quarryTerrains({open=false}={}){return QUARRY_LAYOUT.surfaces.map(s=>({id:s.id,name:s.id,type:'solid',points:[...s.top,...(s.bottom||s.top.slice().reverse().map(([x,y])=>[x,y+s.depth]))].map(([x,y])=>({x,y})),baseMaterial:'rock',breakable:false,oneWay:false,layer:'terrain',properties:{honroQuarry:true,honroQuarryZone:s.zone,honroSpaceSurfaceId:s.id,honroSurfaceRole:s.role,honroWalkEdges:['ceiling','event-veil'].includes(s.role)?[]:s.top.slice(1).map((_,i)=>i),surfaceKind:'granite',...(s.role==='ceiling'?{honroCeiling:true}:{}),...(s.gate?{honroQuarryVeil:true,broken:open,hp:99999,maxHp:99999}:{} )},detail:{spacing:24,roughness:0,seed:12,optimizeEpsilon:0}}));}
const walk=(id,a,z)=>{const s=QUARRY_LAYOUT.surfaces.find(s=>s.id===id),lo=Math.min(a,z),hi=Math.max(a,z);return[...new Set([a,...s.top.map(p=>p[0]).filter(x=>x>lo&&x<hi),z])].sort((a,b)=>a-b).map(x=>quarryPose(id,x)).sort((p,q)=>a<z?p.x-q.x:q.x-p.x);};
const join=(...rs)=>rs.flat().filter((p,i,all)=>!i||JSON.stringify(p)!==JSON.stringify(all[i-1]));
const jump=(id,x,to,tx,speed=.55)=>quarryPose(id,x,{jumpTo:{x:tx,support:to,speed}});
const drop=(id,x,to,tx,stepOffX)=>quarryPose(id,x,{dropTo:{x:tx,support:to,...(stepOffX===undefined?{}:{stepOffX})}});
const route=(id,anchors,extra={})=>({id,kind:'required',anchors,requires:[],defaultJump:true,...extra});
export const QUARRY_NODES={A:quarryPose('sq-old-road',10200),B:quarryPose('sq-north-quarry',7600),C:quarryPose('sq-west-quarry',5120),D:quarryPose('sq-west-quarry',3710),E:quarryPose('sq-lower-ground',4330),F:quarryPose('sq-lower-ground',6520),G:quarryPose('sq-back-road',8225),H:quarryPose('sq-lower-ground',8350)};
export function quarryRoutes(){return[
 route('AB',join(walk('sq-old-road',10200,7850),[jump('sq-old-road',7850,'sq-north-quarry',7660,.5)],walk('sq-north-quarry',7660,7600))),
 route('BA',join(walk('sq-north-quarry',7600,7680),[jump('sq-north-quarry',7680,'sq-old-road',7850,.65)],walk('sq-old-road',7850,10200))),
 route('BC',join(walk('sq-north-quarry',7600,5360),[jump('sq-north-quarry',5360,'sq-west-quarry',5170,.6)],walk('sq-west-quarry',5170,5120))),
 route('CB',join(walk('sq-west-quarry',5120,5180),[jump('sq-west-quarry',5180,'sq-north-quarry',5370,.65)],walk('sq-north-quarry',5370,7600))),
 route('CD',walk('sq-west-quarry',5120,3710)),route('DC',walk('sq-west-quarry',3710,5120)),
 route('DE',join(walk('sq-west-quarry',3710,3330),[jump('sq-west-quarry',3330,'sq-west-turn-high',3160,.55),drop('sq-west-turn-high',3220,'sq-west-turn-low',3280,3290),drop('sq-west-turn-low',3320,'sq-lower-ground',3460,3420)],walk('sq-lower-ground',3460,4330))),
 route('ED',join(walk('sq-lower-ground',4330,3430),[jump('sq-lower-ground',3430,'sq-west-turn-low',3330,.4),jump('sq-west-turn-low',3280,'sq-west-turn-high',3210,.25),jump('sq-west-turn-high',3200,'sq-west-quarry',3330,.5)],walk('sq-west-quarry',3330,3710))),
 route('EF',walk('sq-lower-ground',4330,6520)),route('FE',walk('sq-lower-ground',6520,4330)),
 route('CF',join(walk('sq-west-quarry',5120,5890),[jump('sq-west-quarry',5890,'sq-inner-joint',6070,.6),drop('sq-inner-joint',6120,'sq-lower-ground',6230,6210)],walk('sq-lower-ground',6230,6520))),
 route('FC',join(walk('sq-lower-ground',6520,6220),[jump('sq-lower-ground',6220,'sq-inner-joint',6090,.5),jump('sq-inner-joint',6050,'sq-west-quarry',5910,.5)],walk('sq-west-quarry',5910,5120))),
 route('FG',join(walk('sq-lower-ground',6520,6960),[jump('sq-lower-ground',6960,'sq-back-road',7140,.65)],walk('sq-back-road',7140,8225))),
 route('GF',join(walk('sq-back-road',8225,7140),[jump('sq-back-road',7140,'sq-lower-ground',6930,.65)],walk('sq-lower-ground',6930,6520))),
 route('GB',join(walk('sq-back-road',8225,8910),[jump('sq-back-road',8910,'sq-east-turn',8820,.4),jump('sq-east-turn',8760,'sq-north-quarry',8630,.5)],walk('sq-north-quarry',8630,7600))),
 route('BG',join(walk('sq-north-quarry',7600,8630),[jump('sq-north-quarry',8630,'sq-east-turn',8770,.5),drop('sq-east-turn',8840,'sq-back-road',8910,8895)],walk('sq-back-road',8910,8225))),
 route('FH',walk('sq-lower-ground',6520,8350),{quarryState:'open'}),route('HF',walk('sq-lower-ground',8350,6520),{quarryState:'open'})
];}
export function authorStage12QuarryGeometry(g,project){const p=clone(project),i=p.stages.findIndex(s=>s.metadata?.stageId===12),st=p.stages[i];if(!st)throw Error('Missing Stage12');const before=JSON.stringify(p.stages.filter((_,j)=>j!==i));
 st.width=11200;st.height=8000;for(const k of ['terrainBounds','playBounds','terrainDomainVersion','detailStats'])delete st[k];st.terrains=quarryTerrains();st.materials=[];st.elements=[];st.camera={};
 const nodes=clone(QUARRY_NODES),routes=quarryRoutes(),sites={'clear-approach':nodes.B,sign:nodes.F,'hold-road':nodes.F,'clear-quarry':nodes.F,exit:nodes.H,'wave-hold-road':quarryPose('sq-lower-ground',5450),wave:quarryPose('sq-back-road',8300)};
 st.markers=st.markers.filter(m=>m.id!=='rock-pin').map(m=>sites[m.id]?{...m,...sites[m.id]}:m);st.units=st.units.filter(u=>u.team==='player').map((u,j)=>({...u,...quarryPose('sq-old-road',[10100,10220,10340,10470][j]),facing:-1}));st.encounters=[];
 const surfaces=QUARRY_LAYOUT.surfaces.filter(s=>!['ceiling','event-veil'].includes(s.role)).map(s=>({id:s.id,terrainId:s.id,role:s.role,edgeIndices:s.top.slice(1).map((_,i)=>i),roomIds:['quarry-'+s.zone]}));
 st.design={...st.design,space:{version:1,geometryRevision:4,topologyId:'returning-quarry-two-asymmetric-circuits',rooms:Object.entries(nodes).map(([id,n])=>({id:'quarry-'+id,terrainIds:QUARRY_LAYOUT.surfaces.filter(s=>s.zone===id).map(s=>s.id),ceilingIds:id==='H'?['sq-cave-buttress','sq-cave-roof']:[],bounds:{x:n.x-900,y:n.y-550,w:1800,h:1100},sky:id==='H'?'transition':'open',landmarkIds:[]})),surfaces,routes,connections:routes.map(r=>({id:r.id,from:'quarry-'+r.id[0],to:'quarry-'+r.id[1],kind:'walk',routeId:r.id,entry:clone(r.anchors[0]),exit:clone(r.anchors.at(-1)),requires:[]})),sites:Object.fromEntries(Object.entries(sites).filter(([k])=>!k.startsWith('wave')).map(([k,n])=>[k,{objectiveId:k,roomId:'quarry-'+(k==='exit'?'H':k==='clear-approach'?'B':'F'),...n,standing:clone(n)}])),encounterSites:[],landmarks:[],scenery:[],lights:[],views:[]},quarry:{revision:1,nodes,routes,gate:{terrainId:'sq-turning-veil',bounds:{x:7380,y:4690,w:90,h:670}},scope:'Two unequal real quarry circuits; all six combat sites remain mandatory for clear-all. Traversal measurements use replenished movement, not normal combat.'}};
 st.routes=routes.filter(r=>['AB','BC','CD','DE','EF'].includes(r.id)).flatMap(r=>r.anchors.map(({x,y,surfaceId})=>({x,y,surfaceId})));st.anchors={spawn:quarryPose('sq-old-road',10100),start:clone(nodes.A),exit:clone(nodes.H)};
 st.initialState={...st.initialState,honroQuarryRevision:1,honroAct2GeometryRevision:4,honroCaveForms:[]};delete st.initialState.honroCaveApproach;st.environment=g.HonroEnvironment.makeEnvironment(st,{preset:'forest'});st.environment.skyVisible=true;
 const authored=g.HonroTerrainDomain.author(p);if(JSON.stringify(authored.stages.filter((_,j)=>j!==i))!==before)throw Error('Quarry geometry changed unrelated stage');return authored;
}
