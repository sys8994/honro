/** Stage-local editable Korean granary art. Rear façades are explicitly non-collision. */
import {readFileSync} from 'node:fs';
import {compileSVG} from './build-act2-art.mjs';
let roofProfiles=[];
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
function roof(x,y,w,rise=150){const l=x-w/2,r=x+w/2,top=y-rise;
 const q=[[l-65,y-20],[l+45,y-34],[l+Math.min(160,w*.22),top+40],[x-w*.20,top],[x+w*.21,top],[r-Math.min(145,w*.22),top+48],[r-35,y-22],[r+66,y-25]].sort((a,b)=>a[0]-b[0]);
 roofProfiles.push({x,y,w,rise,top:q});
 // Keep the sampled upper edge exact: its broad tiled plane closes at the
 // existing eave instead of drawing only a thin transparent roof ribbon.
 let b=poly([...q,[r+59,y+7],[x,y+32],[l-61,y+5]],'#405653','#182e35',5,'walkable-korean-tile-roof');
 b+=poly([[l+Math.min(160,w*.22),top+40],[x-w*.20,top],[x+w*.21,top],[r-Math.min(145,w*.22),top+48],[r+32,y-5],[x,y+15],[l-30,y-7]],'#61736a');
 b+=poly([[x+w*.21,top],[r-Math.min(145,w*.22),top+48],[r-35,y-22],[r+59,y+7],[x,y+32],[x+w*.05,top+28]],'#354d49');
 // A few long seams describe roof weight; no tiny repeated tile texture.
 for(const u of [-.31,-.09,.16]){const xx=x+w*u;b+=line([[x+w*u*.69,top+23],[xx,y+10]],'#4b635a',5);}

 b+=poly([[l-61,y+5],[x,y+32],[r+59,y-3],[r+55,y+21],[x,y+51],[l-55,y+25]],'#1b3439');
 b+=poly([[x-w*.23,top-5],[x+w*.24,top-5],[x+w*.24,top+5],[x-w*.23,top+5]],'#9da28b');
 return b;
}
function masonry(q,bottom,{tone='#566658',light='#818b70',courses=3,key='masonry'}={}){
 const low=q.slice().reverse().map(([x])=>[x,typeof bottom==='function'?bottom(x):bottom]);let b=poly([...q,...low],tone,'#30453b',5,key);
 const left=q[0][0],right=q.at(-1)[0],topAt=x=>yAt(q,x),bottomAt=x=>typeof bottom==='function'?bottom(x):bottom;
 b+=poly([...q,...q.slice().reverse().map(([x,y])=>[x,y+22])],light);
 // Broad dressed stones: unequal joints follow the wall's own bounded face.
 for(let row=1;row<=courses;row++){const f=row/(courses+1),yy=x=>topAt(x)+(bottomAt(x)-topAt(x))*f;b+=line([[left,yy(left)],[right,yy(right)]],'#354b40',8);const cuts=row%2?[.19,.48,.77]:[.32,.66,.91];for(const u of cuts){const x=left+(right-left)*u,y=yy(x),h=Math.max(30,(bottomAt(x)-topAt(x))/(courses+1));b+=line([[x,y-h+8],[x-5,y-3]],'#34493e',6);}}
 b+=poly([[right-70,topAt(right-70)+22],[right,topAt(right)+22],[right,bottomAt(right)],[right-55,bottomAt(right-55)]],'#354a40');return b;
}
function distantCanal(s){
 let b='<defs><linearGradient id="scenic-canal-depth" x1="0" y1="3800" x2="0" y2="4660" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#6b8880"/><stop offset="0.45" stop-color="#4a6b68"/><stop offset="1" stop-color="#304e50"/></linearGradient></defs>';
 b+=path('M-6000 3930Q-800 3780 2110 3965T4370 3950Q5630 3740 6690 3900T11800 3710L15800 3850L15800 4570Q11300 4340 7140 4470T4550 4780Q2730 4600 1100 4490L-6000 4440Z','url(#scenic-canal-depth)','','0','broad-receding-canal');
 b+=path('M-6000 3930Q-800 3780 2110 3965T4370 3950Q5630 3740 6690 3900T11800 3710L15800 3850L15800 3878Q13200 3780 11800 3745Q8300 3940 6700 3932T4360 3985Q3050 4140 2110 4000T-6000 3958Z','#728c7d');
 // Long broken horizontal washes give a quiet, distant water surface.
 b+=path('M-1900 4100Q-200 4020 1050 4100L1060 4114Q-150 4052 -1900 4118Z M4910 4160Q5510 4082 6350 4137L6280 4153Q5520 4110 4910 4177Z M9030 3980Q10300 3890 11700 3960L11700 3979Q10270 3915 9040 4000Z','#8ea397');
 b+=path('M-550 4240Q100 4195 810 4250L740 4263Q100 4220 -550 4257Z M5400 4350Q5770 4300 6280 4340L6230 4353Q5770 4327 5400 4366Z M8840 4140Q9520 4080 10480 4115L10480 4131Q9500 4105 8840 4157Z','#6c8b7e');
 // The far shore is a continuous, low-contrast bank, with only a few reed
 // clusters. Water is scenic behind the road; the real collision pool is exact.
 b+=path('M-6000 3865Q-800 3715 2110 3900T4370 3885Q5630 3675 6690 3835T11800 3645L15800 3785L15800 3850Q13200 3715 11800 3710Q8260 3920 6690 3900T4370 3950Q3080 4100 2110 3965T-6000 3930Z','#40594d');
 for(const [i,x,y]of [[0,1180,3850],[1,6080,3840],[2,8730,3780]]){b+=path(`M${x} ${y+18}q-17 -59 -30 -83M${x+14} ${y+20}q18 -77 39 -95M${x+31} ${y+23}q-1 -53 8 -69`,'none','#647961',8);}
 return asset('distant-canal','관창 뒤로 길게 이어지는 먼 운하와 낮은 갈대 물가',b,[-6000,3550,21800,1250],{scenicWater:true,noProjectileCover:true,noWalkRim:true,collisionPoolUnchanged:true,waterSource:'recessed scenic canal; shared renderer retains existing live collision water'});
}
function rearMass(s){
 const main=s.design.act3.primaryContour,ground=x=>yAt(main,x)+10;let b='',feet=[];
 const bank=(id,q,shade)=>{const xs=[...new Set([...q.map(p=>p[0]),...main.map(p=>p[0]).filter(x=>x>q[0][0]&&x<q.at(-1)[0])])].sort((a,z)=>a-z),top=xs.map(x=>[x,yAt(q,x)]),foot=xs.map(x=>[x,ground(x)]);b+=poly([...top,...foot.slice().reverse()],shade,'',0,id);for(const[x,y]of foot)feet.push({x,y:y-10,terrainId:'sy-ground',rearOnly:true,structure:id});return foot;};
 // Muted irregular bank shoulders remain around the constructed precinct;
 // the two great bare earth mounds become warehouse retaining foundations.
 bank('west-weathered-bank',[[1390,4280],[1780,4100],[2560,4180],[3050,3970],[3570,3740],[4100,3755],[4680,3810],[5030,4080]],'#4d6052');
 b+=poly([[1740,4140],[2510,4220],[2920,4120],[2690,4490],[2330,4680],[1920,4680]],'#69745e');
 b+=poly([[4050,3850],[4510,3900],[4890,4150],[4550,4460],[4160,4690],[3670,5030],[3880,4540]],'#3d5449');
 bank('east-weathered-bank',[[6360,4350],[6670,4080],[7100,3490],[7640,3400],[8170,3590],[8540,4010],[8880,4110]],'#475d50');
 b+=poly([[6720,4090],[7130,3550],[7580,3480],[7390,3880],[7060,4210],[6600,4590]],'#61725d');
 b+=poly([[7650,3450],[8130,3630],[8440,4040],[8240,4370],[7840,4450],[7610,4100]],'#3c5549');
 const terraces=[];
 const storeWall=(key,q,{tone='#687664',side='#3b5447'}={})=>{
  const xs=[...new Set([...q.map(p=>p[0]),...main.map(p=>p[0]).filter(x=>x>q[0][0]&&x<q.at(-1)[0])])].sort((a,z)=>a-z),top=xs.map(x=>[x,yAt(q,x)]),base=xs.map(x=>[x,ground(x)]),l=xs[0],r=xs.at(-1);
  b+=poly([...top,...base.slice().reverse()],tone,'',0,key+'-quay-masonry');
  b+=poly([[r-105,yAt(q,r-105)],[r,yAt(q,r)],[r,ground(r)],[r-105,ground(r-105)]],side);
  const ww=r-l,yy=Math.max(...q.map(p=>p[1])),ff=Math.min(...base.map(p=>p[1])),hh=ff-yy;
  b+=poly([[l+14,yAt(q,l)+21],[l+ww*.43,yAt(q,l+ww*.43)+40],[l+ww*.38,yy+hh*.40],[l+18,yy+hh*.44]],'#77816b');
  b+=poly([[l+24,yy+hh*.46],[l+ww*.39,yy+hh*.42],[l+ww*.44,yy+hh*.77],[l+15,yy+hh*.80]],'#697a61');
  b+=poly([[l,ff-hh*.17],[l+ww*.24,ff-hh*.22],[l+ww*.49,ff-hh*.12],[r-113,ff-hh*.16],[r,ground(r)],[l,ground(l)]],'#4b6452');
  b+=poly([[l+ww*.43,yy+20],[l+ww*.51,yy+39],[l+ww*.47,yy+hh*.39],[l+ww*.38,yy+hh*.40]],'#465e4d');
  // Long unequal bedding planes explain massive masonry without covering the
  // whole facade in small repeated blocks. All courses are flush material.
  const hy=Math.max(...q.map(p=>p[1])),fy=Math.min(...base.map(p=>p[1]));
  for(const [i,u]of [.28,.61].entries()){const yy=hy+(fy-hy)*u;b+=line([[l+17,yy],[l+(r-l)*.45,yy+13],[r-116,yy+5]],'#40594a',10);const jx=l+(r-l)*(i?.64:.33);b+=line([[jx,yy-82],[jx+3,yy+7]],'#40594a',8);}
  // A recessed closed timber tier belongs to the retaining warehouse. The
  // flush wall has no balcony lip and only two broad storage panels.
  const tx=l+ww*.32,tw=ww*.47,ty=yy+hh*.35,th=Math.min(240,hh*.30);
  b+=rect(tx,ty,tw,th,'#3a5141');
  for(const [j,u]of [0,.52,1].entries()){const x=tx+tw*u;b+=rect(x-7,ty-9,15,th+16,'#625a40')+rect(x-4,ty-1,4,th,'#a08f65');}
  b+=rect(tx-7,ty-11,tw+15,17,'#756849')+rect(tx-7,ty+th-11,tw+15,16,'#4b523b');
  for(const u of [.09,.61]){const x=tx+tw*u,pw=tw*.30;b+=rect(x,ty+29,pw,th-65,'#787653')+rect(x+pw*.48,ty+33,6,th-73,'#3c4d37')+rect(x+6,ty+58,pw-12,7,'#a0956a');}
  // Two loading bays occupy the lowest storey and meet the real lower road.
  for(const [i,u]of [.27,.66].entries()){const x=l+(r-l)*u,fy=ground(x)-10,w=i?137:178,h=i?194:230;b+=rect(x-w/2-15,fy-h-22,w+30,h+22,'#2b443a')+rect(x-w/2,fy-h,w,h,'#716e4e')+rect(x-5,fy-h+7,9,h-7,'#394b35')+rect(x-w/2+8,fy-h+43,w-16,9,'#a49468')+rect(x-w/2+8,fy-43,w-16,8,'#8e865d');b+=poly([[x-w/2-10,fy-9],[x+w/2+10,fy-9],[x+w/2+14,fy],[x-w/2-14,fy]],'#8a9073');}
  for(const x of [l+36,r-147]){const y=ground(x)-7;b+=poly([[x-18,yAt(q,x)+11],[x+20,yAt(q,x)+11],[x+42,y],[x-37,y]],'#536a55')+poly([[x-18,yAt(q,x)+11],[x-3,yAt(q,x)+11],[x+7,y],[x-37,y]],'#839077');}
  terraces.push({key,top,feet:base.map(([x,y])=>({terrainId:'sy-ground',x,y:y-10})),material:'retaining-quay-masonry',closedLoadingBays:2,noNewCollision:true});
 };
 storeWall('west-granary-foundation',[[3110,3950],[3560,3720],[4240,3720]],{tone:'#65725e'});
 storeWall('east-sorting-foundation',[[7110,3500],[7640,3420],[8170,3615]],{tone:'#5b705f'});
 // The handling yard includes a low dressed quay distinct from the raw bank.
 for(const [id,q]of [['granary-foot',[[1720,4720],[2600,4720]]],['upper-store-foot',[[3560,3674],[4240,3674]]],['sorting-foot',[[7060,3414],[7690,3324],[8240,3524]]]]){
  b+=poly([...q,...q.slice().reverse().map(([x,y])=>[x,y+88])],'#7e876c','',0,id);
  b+=poly([...q,...q.slice().reverse().map(([x,y])=>[x,y+12])],'#a1a389');
 }
 return{asset:asset('grounded-rear-plinths','관창의 석축 하역고·버팀벽과 낮은 흙둑',b,[1390,3280,7540,1900],{groundedSupports:feet,noProjectileCover:true,terraceCount:2,rearMasonryFaces:[],rearRetainingStructures:terraces,earthBanks:true}),feet};
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
 // Roof access scaffolding bears on the existing upper court, with open
 // interiors and no added collision. Each horizontal tread has a real frame.
 const eastCourt=s.terrains.find(t=>t.id==='sy-east-upper'),eq=eastCourt.points.slice(0,eastCourt.properties.honroWalkEdges.length+1).map(p=>[p.x,p.y]);
 for(const [l,r,y]of[[6810,6970,3420],[6920,7080,3250],[6980,7140,3090]]){
  for(const x of[l+13,r-13]){const f=yAt(eq,x);b+=poly([[x-7,y+18],[x+8,y+18],[x+8,f],[x-7,f]],'#62563e');b+=poly([[x-13,f-8],[x+14,f-8],[x+14,f],[x-13,f]],'#96967a');}
  b+=line([[l+13,yAt(eq,l+13)-12],[r-13,y+23]],'#88744d',12);
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

 // An asymmetric quay hoist is grounded on the lower carrier road. Its jib,
 // suspended rope and wide foot make loading work readable at panorama scale.
 const hx=7900,hy=yAt(main,hx);
 b+=poly([[hx-31,hy],[hx-18,hy-344],[hx+19,hy-344],[hx+36,hy]],'#5b543d');
 b+=poly([[hx-18,hy-344],[hx-7,hy-344],[hx+6,hy],[hx-31,hy]],'#ac986b');
 b+=poly([[hx-215,hy-349],[hx+105,hy-378],[hx+112,hy-348],[hx-214,hy-321]],'#8a7950');
 b+=poly([[hx+13,hy-312],[hx-166,hy-338],[hx-171,hy-321],[hx+18,hy-285]],'#4d4d36');
 b+=line([[hx-176,hy-335],[hx-176,hy-97]],'#b6aa80',9);
 b+=path(`M${hx-194} ${hy-98}q18 35 37 0`,'none','#b6aa80',9);
 b+=poly([[hx-53,hy-13],[hx+53,hy-13],[hx+62,hy],[hx-61,hy]],'#8b9277');
 const poleX=6700,poleY=yAt(main,poleX);b+=poly([[poleX-10,poleY],[poleX-7,poleY-196],[poleX+9,poleY-196],[poleX+12,poleY]],'#6c6549')+path(`M${poleX-32} ${poleY-134}Q${poleX+11} ${poleY-101} ${poleX+32} ${poleY-143}`,'none','#a39b73',9);
 return asset('gates-record-life','반출문과 장부석·곡식자루·옹기·빈 마당 흔적',b,[390,3570,9300,1550],{noProjectileCover:true,smallYardProps:true});}
export async function applyStage23YardArt(p){roofProfiles=[];const s=p.stages.find(s=>s.metadata?.stageId===23);if(s?.initialState?.honroEscortYardRevision!==1)throw Error('Stage23 art requires fresh yard');s.elements=s.elements.filter(e=>!e.id.startsWith('sy-art-'));add(p,s,distantCanal(s),'distant-canal');const rear=rearMass(s);add(p,s,rear.asset,'rear-plinths');add(p,s,granaries(s),'granaries');add(p,s,terraceFaces(s),'terraces-chute');add(p,s,bridge(s),'stone-bridge');add(p,s,smallPlaces(s),'gates-life');add(p,s,cargo(),'cargo',{layer:'mid',honroEscortYardCargo:true});s.design.act3.mainBuildings=['sy-art-granaries'];s.design.escortYardRoofProfiles=structuredClone(roofProfiles);const farSource=readFileSync(new URL('../../shared/assets/environment/stage23-yard-far.svg',import.meta.url),'utf8'),farVector=compileSVG(farSource),far=asset('far-mountain','관창 너머 한 겹 먹산과 저녁 안개','',[0,0,1800,1050],{skyOnly:true});far.vector=farVector;register(p,far);s.design.escortYardArt={revision:4,backdropAsset:far,assetIds:s.elements.map(e=>e.assetId),groundedSupports:rear.feet,singleCargoElementId:'sy-art-cargo',scope:'Grounded rear façades are scenery. Only named authored stone piers/corner/cargo are solid cover.'};
 s.environment.groups=[];s.environment.surfaces=[];s.environment.placements=[];s.environment.skyVisible=true;s.environment.atmosphere={preset:'forest',overrides:{skyTop:'#41545c',skyBottom:'#a5a887',hazeStrength:.20,mistStrength:.035,lightStrength:.08,waterBaseColor:'#36575c',waterHighlightColor:'#93a99c'}};return p;}
