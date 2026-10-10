/** Fresh Stage8 only. Ordinary reversible paths surround one buried bier store. */
export const BIER_REVISION=1;
export const BIER_SIZE={width:9600,height:5500};
export const BIER_LAYOUT={...BIER_SIZE,surfaces:[
 {id:'s8-ground',zone:'G',role:'ground',material:'earth',top:[[0,4220],[1000,4150],[1550,4000],[2400,3760],[2600,3744],[2800,3744],[2900,4040],[3350,4480],[3950,4780],[5000,4800],[5800,4710],[6400,4500],[6660,4250],[7140,3810],[7630,3280],[8040,2810],[8390,2810],[8590,2670],[9600,2670]],bottom:[[9600,5500],[0,5500]]},
 {id:'s8-west-root',zone:'A',role:'grounded-store-rock',top:[[280,4220],[400,3900],[650,3500],[1050,3120],[1500,3060],[2100,3030],[2590,3150],[2820,3350],[2880,3410]],bottom:[[2880,3490],[2620,3300],[2150,3270],[1500,3310],[1080,3450],[730,3770],[530,4000],[480,4186]]},
 {id:'s8-west-walk',zone:'B',role:'store-bridge',material:'wood',oneWay:true,top:[[2800,3740],[3350,3870],[3700,4110],[3930,4202]],depth:34},
 {id:'s8-drain-return',zone:'G',role:'drain-stair',material:'wood',oneWay:true,top:[[3650,4490],[3950,4370],[3990,4370]],depth:26},
 {id:'s8-west-court',zone:'H',role:'store-hollow-plinth',top:[[4050,4250],[4910,4250]],bottom:[[4910,4530],[4460,4530],[4050,4500]]},
 {id:'s8-east-plinth',zone:'C',role:'stone-buttress-foot',top:[[5480,4250],[5590,4250]],bottom:[[5590,4540],[5480,4540]]},
 {id:'s8-central-cover',zone:'C',role:'maintenance-walk',material:'wood',oneWay:true,top:[[5590,4250],[5740,4250]],depth:30},
 {id:'s8-central-step',zone:'G',role:'low-service-step',material:'wood',oneWay:true,top:[[5260,4690],[5620,4690],[5800,4490]],depth:26},
 {id:'s8-central-ascent',zone:'G',role:'short-plinth-ascent',material:'wood',oneWay:true,top:[[5640,4390],[5840,4390]],depth:26},
 {id:'s8-court',zone:'C',role:'bier-road',top:[[5790,4250],[6200,4250],[6600,3890],[6990,3580],[7420,2880],[7600,2670],[7800,2670]],bottom:[[7800,2850],[7600,3050],[7200,3480],[6660,3980],[6400,4220],[6200,4280],[5790,4280]]},
 {id:'s8-east-hatch',zone:'F',role:'maintenance-cover',material:'wood',oneWay:true,top:[[7800,2670],[8390,2670]],depth:28},
 {id:'s8-branch-rise',zone:'D',role:'store-eave',material:'wood',oneWay:true,top:[[2800,3630],[3100,3630]],depth:34},
 {id:'s8-west-shoulder',zone:'D',role:'buried-stone-shoulder',top:[[3100,3630],[3440,3360],[3700,3040],[4220,2790],[4700,2600],[4900,2600]],bottom:[[4910,2830],[5020,3200],[5100,3650],[5140,4080],[5130,4530],[4780,4530],[4650,4250],[4450,3890],[4110,3880],[3840,3730],[3500,3580],[3100,3664]]},
 {id:'s8-branch',zone:'D',role:'old-branch',material:'wood',top:[[4900,2600],[5150,2540],[5480,2610]],bottom:[[5480,2770],[5190,2760],[4910,2760]]},
 {id:'s8-east-shoulder',zone:'D',role:'weathered-stone-shoulder',top:[[5480,2610],[5780,2870],[6040,3180],[6200,3360]],bottom:[[6200,3540],[5950,3720],[5650,3760],[5620,4140],[5590,4250],[5480,4250],[5510,3970],[5480,3590],[5410,3210],[5360,2850]]},
 {id:'s8-branch-return',zone:'D',role:'short-timber-descent',material:'wood',oneWay:true,top:[[6200,3360],[6420,3540],[6700,3700]],depth:30},
 {id:'s8-store-reflector',zone:'B',role:'reflector',top:[[3510,3970],[3620,3970]],bottom:[[3620,4080],[3510,4000]]},
 {id:'s8-store-screen',zone:'D',role:'thin-screen',material:'wood',top:[[3420,3246],[3488,3246]],bottom:[[3488,3300.923077],[3440,3360],[3420,3375.882353]]},
 {id:'s8-court-cover',zone:'H',role:'low-cover',top:[[4410,4120],[4500,4120]],bottom:[[4500,4290],[4410,4290]]},
 {id:'s8-branch-stone',zone:'D',role:'low-cover',top:[[5300,2502],[5390,2521]],bottom:[[5390,2610],[5300,2590]]}
]};
// Raise the east landing modestly in screen coordinates, reducing the long climb
// while retaining a useful 450-unit fall-shot advantage from the compact D bough.
for(const t of BIER_LAYOUT.surfaces)for(const q of[t.top,t.bottom||[]])for(const p of q)if(p[0]>7000&&p[1]<5500)p[1]+=330*Math.min(1,(p[0]-7000)/600);
export function bierY(id,x){const s=BIER_LAYOUT.surfaces.find(s=>s.id===id);if(!s)throw Error('Unknown bier support '+id);for(let i=1;i<s.top.length;i++){const a=s.top[i-1],z=s.top[i];if(x>=a[0]-1e-6&&x<=z[0]+1e-6)return a[1]+(z[1]-a[1])*(x-a[0])/(z[0]-a[0]);}throw Error('Bier support outside domain '+id+' @ '+x);}
export const bierPose=(surfaceId,x,extra={})=>({x,y:bierY(surfaceId,x),surfaceId,...extra});
const forbidden=['thin-screen','low-cover'];
export function bierTerrains(){return BIER_LAYOUT.surfaces.map(s=>({id:s.id,name:s.id,type:'solid',points:[...s.top,...(s.bottom||s.top.slice().reverse().map(([x,y])=>[x,y+s.depth]))].map(([x,y])=>({x,y})),baseMaterial:s.material||'rock',breakable:false,oneWay:!!s.oneWay,layer:'terrain',properties:{honroStage8Bier:true,honroSpaceSurfaceId:s.id,honroSurfaceRole:s.role,honroWalkEdges:forbidden.includes(s.role)?[]:s.top.slice(1).map((_,i)=>i),surfaceKind:s.material==='wood'?'wood':s.material==='earth'?'earth':'granite'},detail:{spacing:24,roughness:0,seed:8,optimizeEpsilon:0}}));}
export const bierWalk=(id,a,z)=>{const s=BIER_LAYOUT.surfaces.find(s=>s.id===id),lo=Math.min(a,z),hi=Math.max(a,z);return[...new Set([a,...s.top.map(p=>p[0]).filter(x=>x>lo&&x<hi),z])].sort((x,y)=>a<z?x-y:y-x).map(x=>bierPose(id,x));};
const join=(...rs)=>rs.flat().filter((p,i,all)=>!i||JSON.stringify(p)!==JSON.stringify(all[i-1]));
const jump=(id,x,to,tx,speed=.35,waitFrames=0)=>bierPose(id,x,{jumpTo:{x:tx,support:to,speed,...(waitFrames?{waitFrames}:{})}});
const drop=(id,x,to,tx,stepOffX)=>bierPose(id,x,{dropTo:{x:tx,support:to,...(stepOffX===undefined?{}:{stepOffX})}});
const route=(id,anchors,kind='optional-walk')=>({id,kind,anchors,requires:[],defaultJump:true});
export const BIER_NODES={A:bierPose('s8-ground',900),B:bierPose('s8-ground',2520),C:bierPose('s8-court',5950),D:bierPose('s8-branch',5200),E:bierPose('s8-ground',6600),F:bierPose('s8-east-hatch',8320),G:bierPose('s8-ground',4700),H:bierPose('s8-west-court',4300)};
export function bierRoutes(){const westIn=join(bierWalk('s8-ground',2420,2320),[jump('s8-ground',2320,'s8-ground',2650,.9)],bierWalk('s8-ground',2650,2790),bierWalk('s8-west-walk',2800,3430),[jump('s8-west-walk',3430,'s8-store-reflector',3535,.35)],bierWalk('s8-store-reflector',3535,3600),[drop('s8-store-reflector',3600,'s8-west-walk',3690,3690)],bierWalk('s8-west-walk',3690,3900),[jump('s8-west-walk',3900,'s8-west-court',4120,.7)],bierWalk('s8-west-court',4120,4300)),westOut=join(bierWalk('s8-west-court',4300,4100),[jump('s8-west-court',4100,'s8-west-walk',3900,.65)],bierWalk('s8-west-walk',3900,3680),[jump('s8-west-walk',3680,'s8-store-reflector',3560,.3),jump('s8-store-reflector',3560,'s8-west-walk',3430,.45)],bierWalk('s8-west-walk',3430,2820),bierWalk('s8-ground',2790,2698),[jump('s8-ground',2698,'s8-ground',2420,.9)]),toDrain=join(bierWalk('s8-west-court',4300,4070),[drop('s8-west-court',4070,'s8-ground',4020,4020)],bierWalk('s8-ground',4020,4700)),fromDrain=join(bierWalk('s8-ground',4700,3580),[jump('s8-ground',3580,'s8-drain-return',3690,.45)],bierWalk('s8-drain-return',3690,3970),[jump('s8-drain-return',3970,'s8-west-court',4120,.5)],bierWalk('s8-west-court',4120,4300)),up=join(bierWalk('s8-ground',4700,5210),[jump('s8-ground',5210,'s8-central-step',5320,.4)],bierWalk('s8-central-step',5320,5780),[jump('s8-central-step',5780,'s8-central-ascent',5730,.25)],bierWalk('s8-central-ascent',5730,5680),[jump('s8-central-ascent',5680,'s8-central-cover',5680,.2)],bierWalk('s8-central-cover',5680,5710),[jump('s8-central-cover',5710,'s8-court',5850,.5)],bierWalk('s8-court',5850,5950)),down=join(bierWalk('s8-court',5950,5810),[drop('s8-court',5810,'s8-central-ascent',5765,5765)],bierWalk('s8-central-ascent',5765,5820),[drop('s8-central-ascent',5820,'s8-ground',5890,5890)],bierWalk('s8-ground',5890,4700));return[
 route('AB',bierWalk('s8-ground',900,2420),'required'),route('BA',bierWalk('s8-ground',2420,900),'return'),
 route('BH',westIn,'required'),route('HB',westOut,'return'),route('HG',toDrain,'return'),route('GH',fromDrain),
 route('BC',join(westIn,toDrain,up),'required'),route('CB',join(down,fromDrain,westOut),'return'),
 route('CF',bierWalk('s8-court',5950,7730),'required'),route('FC',bierWalk('s8-court',7730,5950),'return'),
 route('BG',join(westIn,toDrain)),route('GB',join(fromDrain,westOut),'return'),
 route('CG',down,'return'),route('GC',up),route('GE',bierWalk('s8-ground',4700,6600)),route('EG',bierWalk('s8-ground',6600,4700),'return'),
 route('EF',join(bierWalk('s8-ground',6600,8330),[jump('s8-ground',8330,'s8-east-hatch',8350,.2)],bierWalk('s8-east-hatch',8350,8310))),
 route('FE',join(bierWalk('s8-east-hatch',8310,8380),[drop('s8-east-hatch',8380,'s8-ground',8480,8480)],bierWalk('s8-ground',8480,6600)),'return'),
 route('BD',join([jump('s8-ground',2640,'s8-branch-rise',2820,.5)],bierWalk('s8-branch-rise',2820,3100),bierWalk('s8-west-shoulder',3100,3395),[jump('s8-west-shoulder',3395,'s8-west-shoulder',3515,.9,17)],bierWalk('s8-west-shoulder',3515,4900),bierWalk('s8-branch',4900,5200))),
 route('DB',join(bierWalk('s8-branch',5200,4900),bierWalk('s8-west-shoulder',4900,3530),[jump('s8-west-shoulder',3530,'s8-west-shoulder',3340,.7)],bierWalk('s8-west-shoulder',3340,3100),bierWalk('s8-branch-rise',3100,2810),[drop('s8-branch-rise',2810,'s8-ground',2740,2740)]),'return'),
 route('DF',join([jump('s8-branch',5200,'s8-east-shoulder',5530,.9)],bierWalk('s8-east-shoulder',5530,6200),bierWalk('s8-branch-return',6200,6680),[jump('s8-branch-return',6680,'s8-court',6840,.6)],bierWalk('s8-court',6840,7730))),
 route('FD',join(bierWalk('s8-court',7730,6840),[jump('s8-court',6840,'s8-branch-return',6680,.6)],bierWalk('s8-branch-return',6680,6200),bierWalk('s8-east-shoulder',6200,5510),[jump('s8-east-shoulder',5510,'s8-branch',5230,.9)],bierWalk('s8-branch',5230,5200)),'return')
];}
export function bierMovementSpec(){const points=join(bierWalk('s8-east-hatch',8310,7800),bierWalk('s8-court',7800,5950)).map(p=>({...p,support:p.surfaceId}));return{destinations:[{id:'courtyard-primary',...bierPose('s8-court',5950),support:'s8-court'},{id:'courtyard-alternate',...bierPose('s8-court',6150),support:'s8-court'}],routes:[{id:'east-courtyard',points}],scope:'Current boss pose must join this actual reversible support centreline; do not reset to F.'};}
