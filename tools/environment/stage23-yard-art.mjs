/** Stage-local editable Korean granary art. Rear façades are explicitly non-collision. */
import {readFileSync} from 'node:fs';
import {compileSVG} from './build-act2-art.mjs';
const PREFIX='stage23:yard-',N=v=>Math.round(v*100)/100;
const path=(d,fill,stroke='',width=1,id='')=>`<path${id?` id="${id}"`:''} d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`:''}/>`;
const poly=(p,c,stroke='',w=1,id='')=>path('M'+p.map(p=>p.map(N).join(' ')).join('L')+'Z',c,stroke,w,id);
const line=(p,c,w=1)=>path('M'+p.map(p=>p.map(N).join(' ')).join('L'),'none',c,w);
const rect=(x,y,w,h,c)=>path(`M${x} ${y}h${w}v${h}h${-w}Z`,c);
function asset(key,name,body,bounds,extra={}){if(extra.rearOnly!==false)body=body.replace(/(<path[^>]*fill="(?!none)[^"]*"[^>]*?) stroke="[^"]*"/g,'$1');const v=compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.join(' ')}">${body}</svg>`),[x,y,w,h]=bounds;return{id:PREFIX+key,name,category:'architecture',environmentRole:'architecture',visual:[],vector:v,collision:[],anchor:{x:0,y:0},sockets:[],tags:['stage23-yard','visual-only','editable-native-vector'],params:{artRevision:3,rearOnly:true,collisionSource:'none',...extra},bounds:{x,y,w,h},reference:{heightM:h/60,bounds:{x,y,w,h},foot:{x:0,y:0},scaleRange:[.35,4],backgroundRange:[.35,4]}};}
function register(p,a){const i=p.library.findIndex(v=>v.id===a.id);if(i<0)p.library.push(a);else p.library[i]=a;return a;}
function add(p,s,a,id,extra={}){register(p,a);s.elements.push({id:'sy-art-'+id,assetId:a.id,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back',...extra});}
function yAt(q,x){for(let i=1;i<q.length;i++){const a=q[i-1],z=q[i];if(x>=a[0]&&x<=z[0])return a[1]+(z[1]-a[1])*(x-a[0])/(z[0]-a[0]);}throw Error('Art foot outside profile '+x);}
const points=t=>t.points.map(p=>[p.x,p.y]);
function roof(x,y,w,rise=150){const l=x-w/2,r=x+w/2,top=y-rise;let b=path(`M${l-65} ${y-20}Q${l+45} ${y-18} ${l+160} ${top+40}L${x-w*.20} ${top}Q${x} ${top+16} ${x+w*.21} ${top}L${r-145} ${top+48}Q${r-35} ${y-12} ${r+66} ${y-25}L${r+59} ${y+10}Q${x} ${y+37} ${l-61} ${y+10}Z`,'#273f43','#193138',6,'korean-hipped-tile-roof');
 b+=path(`M${l+4} ${y-29}L${l+170} ${top+55}L${x-w*.18} ${top+19}Q${x} ${top+34} ${x+w*.18} ${top+21}L${r-135} ${top+65}L${r+6} ${y-33}Q${x} ${y-6} ${l+4} ${y-29}Z`,'#657971');b+=path(`M${l-64} ${y+6}Q${x} ${y+31} ${r+64} ${y+2}L${r+55} ${y+21}Q${x} ${y+51} ${l-55} ${y+25}Z`,'#1b3439');b+=path(`M${x-w*.23} ${top-5}Q${x} ${top+8} ${x+w*.24} ${top-5}`,'none','#b0b298',8);let ribs='';for(let i=1;i<15;i++){const xx=l+w*i/15,ty=top+22+Math.abs(xx-x)/(w/2)*(rise-39);ribs+=`M${N(xx)} ${N(ty)}L${N(xx+(xx-x)*.07)} ${y+6}`;}b+=path(ribs,'none','#415851',4);return b;}
function masonry(q,bottom,{tone='#566658',light='#818b70',courses=3,key='masonry'}={}){
 const low=q.slice().reverse().map(([x])=>[x,typeof bottom==='function'?bottom(x):bottom]);let b=poly([...q,...low],tone,'#30453b',5,key);
 const left=q[0][0],right=q.at(-1)[0],topAt=x=>yAt(q,x),bottomAt=x=>typeof bottom==='function'?bottom(x):bottom;
 b+=poly([...q,...q.slice().reverse().map(([x,y])=>[x,y+22])],light);
 // Broad dressed stones: unequal joints follow the wall's own bounded face.
 for(let row=1;row<=courses;row++){const f=row/(courses+1),yy=x=>topAt(x)+(bottomAt(x)-topAt(x))*f;b+=line([[left,yy(left)],[right,yy(right)]],'#354b40',8);const cuts=row%2?[.19,.48,.77]:[.32,.66,.91];for(const u of cuts){const x=left+(right-left)*u,y=yy(x),h=Math.max(30,(bottomAt(x)-topAt(x))/(courses+1));b+=line([[x,y-h+8],[x-5,y-3]],'#34493e',6);}}
 b+=poly([[right-70,topAt(right-70)+22],[right,topAt(right)+22],[right,bottomAt(right)],[right-55,bottomAt(right-55)]],'#354a40');return b;
}
function rearMass(s){
 const main=s.design.act3.primaryContour,ground=x=>yAt(main,x)+10;let b='',feet=[];
 // These recessed earth banks are scenery behind the outlined walkway. Their
 // feet follow the real lower road, never a screen-space pedestal or dummy body.
 const bank=(id,q,shade)=>{const xs=[...new Set([...q.map(p=>p[0]),...main.map(p=>p[0]).filter(x=>x>q[0][0]&&x<q.at(-1)[0])])].sort((a,z)=>a-z),top=xs.map(x=>[x,yAt(q,x)]),foot=xs.map(x=>[x,ground(x)]);b+=poly([...top,...foot.slice().reverse()],shade,'',0,id);for(const[x,y]of foot)feet.push({x,y:y-10,terrainId:'sy-ground',rearOnly:true,structure:id});return foot;};
 bank('west-weathered-bank',[[1390,4280],[1780,4100],[2560,4180],[3050,3970],[3570,3740],[4100,3755],[4680,3810],[5030,4080]],'#626c5e');
 b+=poly([[1740,4140],[2510,4220],[2920,4120],[2690,4490],[2330,4680],[1920,4680]],'#747a64');
 b+=poly([[3040,4010],[3580,3780],[3970,3810],[3760,4190],[3340,4480],[3070,4760]],'#7c806a');
 b+=poly([[4050,3850],[4510,3900],[4890,4150],[4550,4460],[4160,4690],[3670,5030],[3880,4540]],'#505f52');
 // One cut face, with large bedding planes instead of stacked rectangular tiers.
 b+=poly([[3220,4440],[3520,4250],[3890,4170],[3700,4550],[3350,4850]],'#626d59');
 b+=poly([[3270,4440],[3520,4250],[3790,4200],[3550,4380]],'#8c8e72');
 bank('east-weathered-bank',[[6360,4350],[6670,4080],[7100,3490],[7640,3400],[8170,3590],[8540,4010],[8880,4110]],'#5c685a');
 b+=poly([[6720,4090],[7130,3550],[7580,3480],[7390,3880],[7060,4210],[6600,4590]],'#79816a');
 b+=poly([[7650,3450],[8130,3630],[8440,4040],[8240,4370],[7840,4450],[7610,4100]],'#475b50');
 b+=poly([[7000,4320],[7370,3950],[7640,3850],[7510,4180],[7230,4530],[6830,4600]],'#68745e');
 // Low rubble plinths carry the human-scale halls, distinct from the raw banks.
 for(const [id,q]of [['granary-foot',[[1720,4720],[2600,4720]]],['upper-store-foot',[[3560,3674],[4240,3674]]],['sorting-foot',[[7060,3414],[7690,3324],[8240,3524]]]]){
  b+=poly([...q,...q.slice().reverse().map(([x,y])=>[x,y+100])],'#85866d','',0,id);
  b+=poly(q.flatMap(([x,y])=>[[x,y],[x,y+12]]),'#b1aa87');
 }
 return{asset:asset('grounded-rear-plinths','관창 뒤의 흙비탈·노출 암면과 낮은 창고 기단',b,[1390,3280,7540,1900],{groundedSupports:feet,noProjectileCover:true,terraceCount:0,rearMasonryFaces:[],earthBanks:true}),feet};
}
function humanStore(x1,x2,floor,{height=330,rise=145,light=false,kind='granary',key='store'}={}){
 const xs=[x1,...floor.map(p=>p[0]).filter(x=>x>x1&&x<x2),x2],q=xs.map(x=>[x,yAt(floor,x)]),base=x=>yAt(floor,x),top=Math.min(...q.map(p=>p[1]))-height,w=x2-x1,center=(x1+x2)/2;
 let b=poly([[x1,top],[x2,top],...q.slice().reverse()],light?'#93937a':'#7b8068','#35473a',5,key+'-wall');
 b+=poly([[x2-75,top],[x2,top],...q.slice().reverse().filter(p=>p[0]>=x2-75),[x2-75,base(x2-75)]],'#445842');
 b+=rect(x1+12,top+28,w-88,44,light?'#c1baa0':'#a7a48a');
 const bays=Math.max(2,Math.round(w/190)),bay=w/bays;
 for(let i=0;i<=bays;i++){const x=x1+12+i*(w-34)/bays,y=base(x);b+=poly([[x-9,top],[x+12,top],[x+15,y-12],[x-10,y-12]],'#514936');b+=line([[x-3,top+15],[x-1,y-18]],'#a38f63',5);b+=poly([[x-20,y-16],[x+23,y-16],[x+29,y],[x-26,y]],'#90977c');}
 for(let i=0;i<bays;i++){const x=x1+bay*(i+.5),fy=base(x),door=i===Math.floor(bays/2)||kind==='granary'&&i%2===0;
  if(door){const dh=Math.min(188,height-90),dw=Math.min(132,bay-40);b+=rect(x-dw/2-8,fy-dh-9,dw+16,dh+8,'#3b4b36');b+=rect(x-dw/2,fy-dh,dw,dh-7,'#8d7950');b+=rect(x-4,fy-dh+9,8,dh-18,'#c1aa76');b+=rect(x-dw/2+8,fy-dh*.46,dw-16,10,'#b19a65');b+=rect(x+9,fy-dh*.55,5,18,'#344531');}
  const wy=top+89,ww=Math.min(108,bay-58),wh=76;b+=rect(x-ww/2-6,wy-5,ww+12,wh+10,'#4a5a42');b+=rect(x-ww/2,wy,ww,wh,'#283f34');let lattice='';for(const u of[-.3,-.05,.20])lattice+=`M${N(x+ww*u)} ${wy+5}v${wh-10}`;lattice+=`M${N(x-ww/2+4)} ${wy+wh*.6}h${ww-8}`;b+=path(lattice,'none','#8c9372',5);
 }
 b+=poly([...q,...q.slice().reverse().map(([x,y])=>[x,y+16])],'#465d4a');b+=roof(center,top-8,w+55,rise);return b;
}
function granaries(s){const main=s.design.act3.primaryContour,west=s.terrains.find(t=>t.id==='sy-west-upper').points.slice(0,9).map(p=>[p.x,p.y]),east=s.terrains.find(t=>t.id==='sy-east-upper').points.slice(0,9).map(p=>[p.x,p.y]);let b='';
 // B is below the tall perimeter wall. Its real-size doors meet the lower yard.
 b+=humanStore(1720,2720,main,{height:360,rise:165,light:true,key:'B-main-granary'});
 b+=humanStore(1410,1690,main,{height:255,rise:100,key:'B-west-wing'});
 b+=humanStore(2860,3160,main,{height:265,rise:108,key:'B-east-wing'});
 // D/F stores stand ON the actual upper courts, behind the actors, instead of
 // stretching timber columns through the entire valley height.
 b+=humanStore(3580,4220,west,{height:290,rise:145,key:'D-upper-record-store'});
 b+=humanStore(7100,7580,east,{height:270,rise:135,key:'F-west-sorting-store'});
 b+=humanStore(7870,8220,east,{height:250,rise:118,light:true,key:'F-east-store'});
 b+=rect(2120,4320,218,55,'#344a37')+path('M2140 4348H2170M2190 4338V4360M2214 4340H2240M2260 4338V4360M2280 4348H2312','none','#c8b98c',5);
 return asset('granary-halls','인물 크기 문과 창을 갖춘 관창 주동·두 날개·상부 저장칸',b,[1310,2870,7100,2250],{buildingCount:6,doorHeightMax:188,noProjectileCover:true,buildingFootSource:'actual lower ground and upper sy surfaces'});}
function timberFlight(q,{width=85,key='flight'}={}){let b=poly([...q,...q.slice().reverse().map(([x,y])=>[x,y+width])],'#534e38','#2b4032',5,key);b+=poly([...q,...q.slice().reverse().map(([x,y])=>[x,y+19])],'#aa9a6b');
 for(let i=1;i<q.length;i++){const a=q[i-1],z=q[i],n=Math.max(2,Math.ceil(Math.hypot(z[0]-a[0],z[1]-a[1])/115));for(let j=1;j<n;j++){const u=j/n,x=a[0]+(z[0]-a[0])*u,y=a[1]+(z[1]-a[1])*u;b+=line([[x,y+22],[x,y+width-4]],'#8b8057',8);}}
 b+=line(q.map(([x,y])=>[x,y+width-8]),'#302f22',13);return b;}
function terraceFaces(s){let b='',walkEdges=[];for(const id of ['sy-west-upper','sy-central-flank','sy-east-upper']){const t=s.terrains.find(t=>t.id===id),n=t.properties.honroWalkEdges.length,q=t.points.slice(0,n+1).map(p=>[p.x,p.y]);walkEdges.push({terrainId:id,points:q});
 for(let i=1;i<q.length;i++){const a=q[i-1],z=q[i],slope=(z[1]-a[1])/(z[0]-a[0]);if(Math.abs(slope)>.18)b+=timberFlight([a,z],{width:Math.min(yAt(s.design.act3.primaryContour,a[0])-a[1],yAt(s.design.act3.primaryContour,z[0])-z[1])<230?24:72,key:id+'-timber-flight-'+i});else{b+=poly([a,z,[z[0],z[1]+24],[a[0],a[1]+24]],'#59684f');b+=line([[a[0],a[1]+6],[z[0],z[1]+6]],'#b6b494',9);b+=line([[a[0],a[1]+21],[z[0],z[1]+21]],'#324734',7);}}}
 // The narrow foreground timber edge has a visible short support down to
 // those stepped rear piers; it is never an unsupported diagonal in the sky.
 for(const [id,x,foot]of[['sy-west-upper',2810,4200],['sy-west-upper',3190,3970],['sy-east-upper',6570,4200],['sy-east-upper',6840,3860],['sy-east-upper',8550,4015],['sy-east-upper',8840,4100]]){
  const t=s.terrains.find(t=>t.id===id),q=t.points.slice(0,t.properties.honroWalkEdges.length+1).map(p=>[p.x,p.y]),y=yAt(q,x)+24;
  b+=poly([[x-18,y],[x+20,y],[x+27,foot],[x-24,foot]],'#5e5134');b+=line([[x-8,y+7],[x-10,foot-10]],'#b19b66',7);b+=line([[x-82,foot-13],[x+4,y+24]],'#6b5b39',20);b+=line([[x-48,y+3],[x+61,y+3]],'#8f7d50',20);
 }
 // Every runner follows the actual cargo presentation path. Three long
 // descending sections rest on short terrace-supported posts; no giant slide.
 const ps=s.initialState.honroEscortYardSpec.cargo.path.map(p=>[p.x,p.y+70]);
 for(let i=1;i<ps.length;i++){const a=ps[i-1],z=ps[i],left=[a[0]-242,a[1]],right=[a[0]+242,a[1]],zl=[z[0]-242,z[1]],zr=[z[0]+242,z[1]];
  b+=poly([[left[0],left[1]],[left[0]+48,left[1]],[zl[0]+48,zl[1]],zl],'#453f30','',0,'cargo-open-runner-'+i);b+=poly([[right[0]-48,right[1]],right,zr,[zr[0]-48,zr[1]]],'#453f30');
  const length=Math.hypot(z[0]-a[0],z[1]-a[1]),n=Math.max(1,Math.ceil(length/200));for(let j=0;j<=n;j++){const u=j/n,x=a[0]+(z[0]-a[0])*u,y=a[1]+(z[1]-a[1])*u;b+=poly([[x-255,y+10],[x+255,y+10],[x+255,y+28],[x-255,y+28]],'#4d4430');b+=line([[x-248,y+11],[x+248,y+11]],'#927d52',7);}
  for(const side of[-1,1]){const x=side*215;b+=poly([[a[0]+x-14,a[1]-8],[a[0]+x+18,a[1]-8],[z[0]+x+18,z[1]-8],[z[0]+x-14,z[1]-8]],'#ad9964');b+=line([[a[0]+x+14,a[1]],[z[0]+x+14,z[1]]],'#51492e',10);}
 }
 // Short load-bearing frames meet known rear terrace tops rather than becoming
 // thousand-unit columns. They are scenery behind the playable ledges.
 // Short wall-mounted triangular corbels are sunk into the rear cut bank;
 // no bright foot or freestanding pillar ends in mid-air.
 for(const[x,y]of[[4470,4015],[4230,4480],[3820,4815]]){
  b+=poly([[x-22,y],[x+135,y+24],[x+135,y+56],[x-22,y+32]],'#99855b');
  b+=poly([[x-16,y+26],[x+117,y+160],[x+140,y+144],[x+20,y+28]],'#65583d');
  b+=poly([[x+116,y+14],[x+145,y+18],[x+145,y+172],[x+116,y+163]],'#4a4936');
 }

 // The exposed solid corner belongs to a larger recessed stone buttress.
 b+=masonry([[4730,3750],[5150,3840]],x=>yAt(s.design.act3.primaryContour,x)+8,{tone:'#4e604c',light:'#81886b',courses:3,key:'rear-warehouse-buttress'});
 b+=line([[4680,3810],[5160,3915]],'#685936',42)+line([[4730,3800],[5100,3880]],'#a68c56',10);
 // The capstan and two short supports explain how the loaded runner is held.
 b+=poly([[4320,3650],[4332,3490],[4370,3490],[4390,3650]],'#544a34');
 b+=poly([[4460,3650],[4450,3490],[4484,3490],[4510,3650]],'#544a34');
 b+=poly([[4290,3498],[4510,3498],[4510,3522],[4290,3522]],'#b09a68');
 b+=poly([[4392,3470],[4408,3470],[4408,3550],[4392,3550]],'#453c2c')+poly([[4355,3502],[4445,3502],[4445,3518],[4355,3518]],'#453c2c');
 b+=path('M4440 3506Q4500 3466 4560 3516L4560 3524Q4500 3474 4440 3514Z','#c3af7f');
 return asset('terrace-faces-chute','실제 보행앞선과 맞는 목재 경사대·석축마루·분절된 운반목',b,[1100,3270,8000,1870],{noProjectileCover:true,porchThickness:24,walkEdges,cargoRunnerPath:ps,rearHardwareOnly:true});}
function bridge(s){let b='';
 // The far channel bank closes the false sky hole. Its dark plane is recessed
 // scenery; the two bright foreground piers remain the real collision cores.
 b+=poly([[5200,4480],[6080,4480],[6040,4880],[5900,5200],[5350,5200],[5210,4890]],'#314b45','#243e38',7,'recessed-water-channel-bank');
 b+=masonry([[5160,4490],[5400,4530]],x=>x<5290?4770:4910,{tone:'#586d58',light:'#8a9475',courses:3,key:'west-bridge-abutment'});
 b+=masonry([[5830,4510],[6100,4460]],x=>x>6020?4740:4920,{tone:'#516a56',light:'#899579',courses:3,key:'east-bridge-abutment'});
 b+=path('M5480 4855V4640Q5600 4540 5750 4640V4855Z','#1d3937');b+=path('M5480 4640Q5600 4540 5750 4640','none','#7e8e76',29);
 b+=line([[5400,4730],[5480,4730]],'#70856c',15)+line([[5750,4730],[5840,4730]],'#71886e',15);
 for(const id of ['sy-bridge-west-pier','sy-bridge-east-pier']){const t=s.terrains.find(t=>t.id===id),p=points(t),cx=(p[0][0]+p[1][0])/2;b+=poly([[cx-120,4490],[cx+120,4490],[cx+107,4855],[cx-110,4855]],'#526b59');b+=poly([[cx-140,4470],[cx+142,4470],[cx+129,4540],[cx-128,4540]],'#788773');b+=line([[cx-125,4490],[cx+130,4490]],'#a0a88b',13);b+=poly(p,'#657b64','#2c4b3d',6);b+=poly([p[0],[p[0][0]+32,p[0][1]],[p[3][0]+43,p[3][1]],p[3]],'#99a38a');for(const y of[4615,4735,4850,4990])b+=line([[p[0][0]-10,y],[p[1][0]+10,y]],'#365743',7);}
 const t=s.terrains.find(t=>t.id==='sy-stone-bridge');b+=poly(points(t),'#71836b','#294839',6);b+=line(t.points.slice(0,4).map(p=>[p.x,p.y+9]),'#c4c2a1',15);b+=line(t.points.slice(0,4).map(p=>[p.x,p.y+112]),'#465f48',13);
 const corner=s.terrains.find(t=>t.id==='sy-stone-corner');b+=poly(points(corner),'#6e7757','#384d35',6);for(const y of[3830,3990,4140])b+=line([[4833,y],[4997,y]],'#879173',12);
 return asset('stone-bridge-reflector','양쪽 교대·낮은 수로둑과 구분되는 실제 석교 받침',b,[4770,3600,1440,1640],{collisionSource:'sy-stone-bridge,sy-bridge-west-pier,sy-bridge-east-pier,sy-stone-corner',rearOnly:false,rearAbutmentsAreScenery:true});}
function cargo(){let b=poly([[4560,3510],[4940,3510],[5000,3650],[4600,3650]],'#6e6445','#293b31',7,'one-life-goods-bundle');b+=poly([[4568,3516],[4760,3516],[4795,3642],[4606,3642]],'#a39368');b+=poly([[4760,3516],[4935,3516],[4990,3642],[4795,3642]],'#4c5037');b+=poly([[4580,3521],[4735,3521],[4750,3578],[4595,3578]],'#bdab7d');b+=path('M4605 3520L4640 3643M4770 3518L4804 3643M4890 3518L4938 3643M4593 3585L4965 3585','none','#c5b28b',12);b+=path('M4625 3592Q4698 3545 4758 3592L4745 3628H4655Z','#647970','#203f3c',6);b+=path('M4810 3540L4858 3527 4890 3578 4840 3590Z','#92774a');b+=path('M4920 3535L4945 3625M4905 3538L4932 3530','none','#b9b6a0',10);b+=path('M4655 3612Q4710 3595 4738 3614','none','#a2b0a0',5);return asset('life-goods-cargo','놋그릇·곡식자루·농기구가 묶인 큰 생활화물',b,[3440,3500,1570,1460],{rearOnly:false,collisionSource:'sy-cargo-stored/sy-cargo-settled',singleMovingBundle:true,width:440,height:140,motionBounds:true});}
function smallPlaces(s){const main=s.design.act3.primaryContour;let b='';const gate=(x,y,w=600)=>{b+=rect(x-w/2,y-330,46,330,'#594e36')+rect(x+w/2-45,y-330,45,330,'#594e36')+rect(x-w/2-20,y-355,w+40,55,'#74684a')+roof(x,y-354,w+100,110);b+=rect(x-w/2+70,y-300,w-140,18,'#334b3c');};gate(820,main[0][1],620);gate(9250,4170,660);
 // The record surface and carrier shelter are small life objects, not extra actors.
 const y=yAt(main,1080);b+=poly([[993,y],[1004,y-48],[1159,y-48],[1168,y]],'#516558');b+=poly([[1015,y-55],[1152,y-55],[1137,y-89],[1028,y-89]],'#b5ae8b');b+=line([[1037,y-75],[1120,y-75]],'#55624c',5);
 b+=path('M2010 4697Q1986 4670 2013 4612Q2050 4592 2090 4617L2114 4695Z','#8c8059','#49503a',5)+path('M2104 4697L2115 4597Q2154 4575 2201 4609L2221 4697Z','#a09369','#48513b',5);b+=path('M2014 4623Q2058 4645 2090 4628M2119 4613Q2159 4636 2196 4622','none','#c1b282',7)+path('M2151 4600L2160 4696M2046 4602L2053 4697','none','#5a583c',6);
 // Small varied store contents and empty yard traces stay behind the actors.
 const sack=(x,y,w=75)=>path(`M${x-w*.5} ${y}Q${x-w*.68} ${y-45} ${x-w*.28} ${y-72}L${x+w*.22} ${y-75}Q${x+w*.63} ${y-49} ${x+w*.52} ${y}Z`,'#8b8260')+path(`M${x-w*.28} ${y-63}Q${x} ${y-51} ${x+w*.25} ${y-64}M${x} ${y-66}L${x+7} ${y-7}`,'none','#beb087',5);
 const pot=(x,y)=>path(`M${x-24} ${y-67}Q${x-52} ${y-40} ${x-40} ${y-5}Q${x} ${y+6} ${x+39} ${y-5}Q${x+51} ${y-43} ${x+24} ${y-67}Z`,'#4c675b')+path(`M${x-28} ${y-67}Q${x} ${y-79} ${x+28} ${y-67}Q${x} ${y-57} ${x-28} ${y-67}Z`,'#98a28a')+path(`M${x-24} ${y-48}Q${x-35} ${y-25} ${x-22} ${y-9}`,'none','#859681',6);
 b+=sack(3840,3650,88)+sack(3920,3650,72)+pot(4260,3650);
 b+=sack(7440,yAt(main,7440),92)+sack(7520,yAt(main,7520),74)+pot(7587,yAt(main,7587));
 b+=path('M1840 4690L1950 4694M2330 4692L2500 4692M2460 4681L2560 4685M3500 5091L3590 5094M3800 5090L3890 5092','none','#a39c79',9);
 b+=path('M3400 5070L3520 5070 3540 5082H3420Z M3430 5053L3550 5053 3570 5065H3450Z','#716d4c');
 b+=path('M9160 4142Q9195 4115 9223 4141Q9233 4165 9196 4164Q9167 4163 9178 4142Q9197 4128 9210 4142','none','#a49b71',7);
 // B: weighing station at the carrier's real lower-court elevation. A hanging
 // pan, beam and grounded tripod identify handling work without a new quest prop.
 b+=poly([[1830,4698],[1870,4490],[1893,4490],[1922,4698],[1898,4698],[1880,4540],[1854,4698]],'#665b43');
 b+=poly([[1780,4508],[1985,4482],[1988,4498],[1782,4524]],'#b4a17a');
 b+=poly([[1785,4520],[1791,4520],[1791,4596],[1785,4596]],'#9d936f');
 b+=path('M1742 4593H1837Q1822 4634 1788 4635Q1753 4634 1742 4593Z','#8f987c');
 b+=poly([[1960,4497],[1976,4495],[1980,4553],[1955,4556]],'#4b5348');
 b+=poly([[1746,4592],[1834,4592],[1828,4600],[1752,4600]],'#c8bd93');
 // F: a low sorting bench separates broad bowls/iron fittings from grain sacks.
 const fy=yAt(main,7030);b+=rect(6810,fy-90,300,23,'#a09065')+rect(6825,fy-67,23,67,'#5c543c')+rect(7073,fy-67,23,67,'#5c543c');
 b+=path(`M6830 ${fy-124}H6920Q6905 ${fy-91} 6875 ${fy-91}Q6843 ${fy-91} 6830 ${fy-124}Z`,'#9b9a76');
 b+=poly([[6960,fy-93],[6951,fy-145],[7010,fy-153],[7036,fy-93]],'#4d6259');
 b+=poly([[6965,fy-108],[6975,fy-140],[6998,fy-143],[7015,fy-108]],'#94a38b');
 b+=sack(7160,yAt(main,7160),100);
 // A resting pack-frame leans beside the grain pile, showing the human load scale.
 b+=poly([[7270,4610],[7244,4420],[7258,4418],[7284,4610]],'#b09a6a')+poly([[7340,4580],[7314,4410],[7328,4408],[7354,4580]],'#8e7e55');
 b+=poly([[7255,4470],[7325,4460],[7328,4478],[7258,4488]],'#b5a179')+poly([[7265,4540],[7335,4530],[7338,4548],[7268,4558]],'#b5a179');
 return asset('gates-record-life','반출문과 장부석·곡식자루·옹기·빈 마당 흔적',b,[390,3570,9300,1550],{noProjectileCover:true,smallYardProps:true});}
export async function applyStage23YardArt(p){const s=p.stages.find(s=>s.metadata?.stageId===23);if(s?.initialState?.honroEscortYardRevision!==1)throw Error('Stage23 art requires fresh yard');s.elements=s.elements.filter(e=>!e.id.startsWith('sy-art-'));const rear=rearMass(s);add(p,s,rear.asset,'rear-plinths');add(p,s,granaries(s),'granaries');add(p,s,terraceFaces(s),'terraces-chute');add(p,s,bridge(s),'stone-bridge');add(p,s,smallPlaces(s),'gates-life');add(p,s,cargo(),'cargo',{layer:'mid',honroEscortYardCargo:true});s.design.act3.mainBuildings=['sy-art-granaries'];const farSource=readFileSync(new URL('../../shared/assets/environment/stage23-yard-far.svg',import.meta.url),'utf8'),farVector=compileSVG(farSource),far=asset('far-mountain','관창 너머 한 겹 먹산과 저녁 안개','',[0,0,1800,1050],{skyOnly:true});far.vector=farVector;register(p,far);s.design.escortYardArt={revision:3,backdropAsset:far,assetIds:s.elements.map(e=>e.assetId),groundedSupports:rear.feet,singleCargoElementId:'sy-art-cargo',scope:'Grounded rear façades are scenery. Only named authored stone piers/corner/cargo are solid cover.'};
 s.environment.groups=[];s.environment.surfaces=[];s.environment.placements=[];s.environment.skyVisible=true;s.environment.atmosphere={preset:'forest',overrides:{skyTop:'#41545c',skyBottom:'#a5a887',hazeStrength:.20,mistStrength:.035,lightStrength:.08,waterBaseColor:'#36575c',waterHighlightColor:'#93a99c'}};return p;}
