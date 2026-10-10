/** Fresh Stage8 only. Ordinary reversible paths surround one buried bier store. */
export const BIER_REVISION=1;
export const BIER_SIZE={width:9600,height:5500};
export const BIER_LAYOUT={...BIER_SIZE,surfaces:[
 {id:'s8-ground',zone:'G',role:'ground',material:'earth',top:[[0,4220],[1000,4150],[1550,4000],[2400,3760],[2600,3744],[2750,3860],[2900,4040],[3350,4480],[3950,4780],[5000,4800],[5800,4580],[6450,4250],[6660,4250],[7140,3810],[7630,3280],[8040,2810],[8390,2810],[8590,2670],[9600,2670]],bottom:[[9600,5500],[0,5500]]},
 {id:'s8-west-walk',zone:'B',role:'store-bridge',material:'wood',oneWay:true,top:[[2800,3740],[3350,3870],[3700,4110],[3930,4202]],depth:34},
 {id:'s8-drain-return',zone:'G',role:'drain-stair',material:'wood',oneWay:true,top:[[3650,4490],[3950,4370],[4030,4370]],depth:26},
 {id:'s8-court',zone:'C',role:'bier-road',top:[[4050,4250],[5480,4250],[5900,3980],[6100,3980],[6750,3430],[6930,3430],[7420,2880],[7600,2670],[7800,2670]],bottom:[[7800,2850],[7600,3050],[7200,3480],[6660,3980],[6450,3980],[5800,4310],[5000,4530],[4460,4530],[4050,4500]]},
 {id:'s8-east-hatch',zone:'F',role:'maintenance-cover',material:'wood',oneWay:true,top:[[7800,2670],[8390,2670]],depth:28},
 {id:'s8-branch-rise',zone:'D',role:'store-eave',material:'wood',oneWay:true,top:[[2800,3630],[3100,3630]],depth:34},
 {id:'s8-west-shoulder',zone:'D',role:'buried-stone-shoulder',top:[[3100,3630],[3440,3360],[3700,3040],[4220,2790],[4700,2600],[4900,2600]],bottom:[[4910,2830],[4830,3210],[4650,3640],[4450,3890],[4110,3960],[3840,3790],[3500,3580],[3100,3664]]},
 {id:'s8-branch',zone:'D',role:'old-branch',material:'wood',top:[[4900,2600],[5150,2540],[5480,2610]],bottom:[[5480,2770],[5190,2760],[4910,2760]]},
 {id:'s8-east-shoulder',zone:'D',role:'weathered-stone-shoulder',top:[[5480,2610],[5780,2870],[6040,3180],[6200,3360]],bottom:[[6200,3540],[5950,3720],[5750,3620],[5570,3360],[5480,2970]]},
 {id:'s8-branch-return',zone:'D',role:'short-timber-descent',material:'wood',oneWay:true,top:[[6200,3360],[6420,3540]],depth:30},
 {id:'s8-store-reflector',zone:'B',role:'reflector',top:[[3510,3850],[3620,3850]],bottom:[[3620,4080],[3510,4000]]},
 {id:'s8-store-screen',zone:'B',role:'thin-screen',material:'wood',top:[[3000,3500],[3068,3500]],bottom:[[3068,3630],[3000,3630]]},
 {id:'s8-court-cover',zone:'C',role:'low-cover',top:[[4410,4120],[4500,4120]],bottom:[[4500,4290],[4410,4290]]},
 {id:'s8-branch-stone',zone:'D',role:'low-cover',top:[[5300,2502],[5390,2521]],bottom:[[5390,2610],[5300,2590]]}
]};
// Raise the east landing modestly in screen coordinates, reducing the long climb
// while retaining a useful 450-unit fall-shot advantage from the compact D bough.
for(const t of BIER_LAYOUT.surfaces)for(const q of[t.top,t.bottom||[]])for(const p of q)if(p[0]>7000&&p[1]<5500)p[1]+=330*Math.min(1,(p[0]-7000)/600);
export function bierY(id,x){const s=BIER_LAYOUT.surfaces.find(s=>s.id===id);if(!s)throw Error('Unknown bier support '+id);for(let i=1;i<s.top.length;i++){const a=s.top[i-1],z=s.top[i];if(x>=a[0]-1e-6&&x<=z[0]+1e-6)return a[1]+(z[1]-a[1])*(x-a[0])/(z[0]-a[0]);}throw Error('Bier support outside domain '+id+' @ '+x);}
export const bierPose=(surfaceId,x,extra={})=>({x,y:bierY(surfaceId,x),surfaceId,...extra});
const forbidden=['reflector','thin-screen','low-cover'];
export function bierTerrains(){return BIER_LAYOUT.surfaces.map(s=>({id:s.id,name:s.id,type:'solid',points:[...s.top,...(s.bottom||s.top.slice().reverse().map(([x,y])=>[x,y+s.depth]))].map(([x,y])=>({x,y})),baseMaterial:s.material||'rock',breakable:false,oneWay:!!s.oneWay,layer:'terrain',properties:{honroStage8Bier:true,honroSpaceSurfaceId:s.id,honroSurfaceRole:s.role,honroWalkEdges:forbidden.includes(s.role)?[]:s.top.slice(1).map((_,i)=>i),surfaceKind:s.material==='wood'?'wood':s.material==='earth'?'earth':'granite'},detail:{spacing:24,roughness:0,seed:8,optimizeEpsilon:0}}));}
export const bierWalk=(id,a,z)=>{const s=BIER_LAYOUT.surfaces.find(s=>s.id===id),lo=Math.min(a,z),hi=Math.max(a,z);return[...new Set([a,...s.top.map(p=>p[0]).filter(x=>x>lo&&x<hi),z])].sort((x,y)=>a<z?x-y:y-x).map(x=>bierPose(id,x));};
const join=(...rs)=>rs.flat().filter((p,i,all)=>!i||JSON.stringify(p)!==JSON.stringify(all[i-1]));
const jump=(id,x,to,tx,speed=.35)=>bierPose(id,x,{jumpTo:{x:tx,support:to,speed}});
const drop=(id,x,to,tx,stepOffX)=>bierPose(id,x,{dropTo:{x:tx,support:to,...(stepOffX===undefined?{}:{stepOffX})}});
const route=(id,anchors,kind='optional-walk')=>({id,kind,anchors,requires:[],defaultJump:true});
export const BIER_NODES={A:bierPose('s8-ground',900),B:bierPose('s8-ground',2670),C:bierPose('s8-court',4700),D:bierPose('s8-branch',5200),E:bierPose('s8-ground',6600),F:bierPose('s8-east-hatch',8320),G:bierPose('s8-ground',4700)};
export function bierRoutes(){return[
 route('AB',bierWalk('s8-ground',900,2570),'required'),route('BA',bierWalk('s8-ground',2570,900),'return'),
 route('BC',join([jump('s8-ground',2760,'s8-west-walk',2850,.35)],bierWalk('s8-west-walk',2850,3900),[jump('s8-west-walk',3900,'s8-court',4120,.7)],bierWalk('s8-court',4120,4300),[jump('s8-court',4300,'s8-court',4610,.9)],bierWalk('s8-court',4610,4700)),'required'),
 route('CB',join(bierWalk('s8-court',4700,4610),[jump('s8-court',4610,'s8-court',4300,.9)],bierWalk('s8-court',4300,4100),[jump('s8-court',4100,'s8-west-walk',3900,.65)],bierWalk('s8-west-walk',3900,2820),[drop('s8-west-walk',2820,'s8-ground',2760,2740)]),'return'),
 route('CF',bierWalk('s8-court',4700,7730),'required'),
 route('FC',bierWalk('s8-court',7730,4700),'return'),
 route('BG',bierWalk('s8-ground',2760,4700)),route('GB',bierWalk('s8-ground',4700,2760),'return'),
 route('CG',join(bierWalk('s8-court',4700,4610),[jump('s8-court',4610,'s8-court',4300,.9)],bierWalk('s8-court',4300,4070),[drop('s8-court',4070,'s8-drain-return',3980,3980)],bierWalk('s8-drain-return',3980,3670),[drop('s8-drain-return',3670,'s8-ground',3570,3570)],bierWalk('s8-ground',3570,4700)),'return'),
 route('GC',join(bierWalk('s8-ground',4700,3580),[jump('s8-ground',3580,'s8-drain-return',3690,.45)],bierWalk('s8-drain-return',3690,4010),[jump('s8-drain-return',4010,'s8-court',4120,.4)],bierWalk('s8-court',4120,4300),[jump('s8-court',4300,'s8-court',4610,.9)],bierWalk('s8-court',4610,4700))),
 route('GE',bierWalk('s8-ground',4700,6600)),route('EG',bierWalk('s8-ground',6600,4700),'return'),
 route('EF',join(bierWalk('s8-ground',6600,8330),[jump('s8-ground',8330,'s8-east-hatch',8350,.2)],bierWalk('s8-east-hatch',8350,8310))),
 route('FE',join(bierWalk('s8-east-hatch',8310,8380),[drop('s8-east-hatch',8380,'s8-ground',8480,8480)],bierWalk('s8-ground',8480,6600)),'return'),
 route('BD',join([jump('s8-west-walk',2890,'s8-branch-rise',2890,.2)],bierWalk('s8-branch-rise',2890,3100),bierWalk('s8-west-shoulder',3100,4900),bierWalk('s8-branch',4900,5200))),
 route('DB',join(bierWalk('s8-branch',5200,4900),bierWalk('s8-west-shoulder',4900,3100),bierWalk('s8-branch-rise',3100,2810),[drop('s8-branch-rise',2810,'s8-west-walk',2820,2750)]),'return'),
 route('DF',join(bierWalk('s8-branch',5200,5480),bierWalk('s8-east-shoulder',5480,6200),bierWalk('s8-branch-return',6200,6400),[jump('s8-branch-return',6400,'s8-court',6560,.55)],bierWalk('s8-court',6560,7730))),
 route('FD',join(bierWalk('s8-court',7730,6560),[jump('s8-court',6560,'s8-branch-return',6380,.6)],bierWalk('s8-branch-return',6380,6200),bierWalk('s8-east-shoulder',6200,5480),bierWalk('s8-branch',5480,5200)),'return')
];}
export function bierMovementSpec(){const points=join(bierWalk('s8-east-hatch',8310,7800),bierWalk('s8-court',7800,4700)).map(p=>({...p,support:p.surfaceId}));return{destinations:[{id:'courtyard-primary',...bierPose('s8-court',4700),support:'s8-court'},{id:'courtyard-alternate',...bierPose('s8-court',4920),support:'s8-court'}],routes:[{id:'east-courtyard',points}],scope:'Current boss pose must join this actual reversible support centreline; do not reset to F.'};}
