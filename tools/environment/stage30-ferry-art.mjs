import {readFileSync} from 'node:fs';
import {compileSVG} from './build-act2-art.mjs';
import {stage11PineAsset} from './stage11-ravine-art.mjs';

// Stage-local, editable vector art. Authored terrains are the sole geography.
export const STAGE30_ART_PREFIX='stage30:ferry-';
const n=v=>Math.round(v*100)/100;
const path=(d,fill,stroke='',width=1,id='')=>`<path${id?` id="${id}"`:''} d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`:''}/>`;
const poly=(ps,fill,stroke='',width=1,id='')=>path('M'+ps.map(p=>p.map(n).join(' ')).join('L')+'Z',fill,stroke,width,id);
const line=(ps,color,width)=>path('M'+ps.map(p=>p.map(n).join(' ')).join('L'),'none',color,width);
const group=(x,y,sx,sy,body)=>`<g transform="matrix(${n(sx)} 0 0 ${n(sy)} ${n(x)} ${n(y)})">${body}</g>`;
const nodes=q=>1+(q.children||[]).reduce((a,z)=>a+nodes(z),0);
function asset(key,name,body,box,{category='architecture',role='architecture',extra={},source=false}={}){const vector=compileSVG(source?body:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.map(n).join(' ')}">${body}</svg>`),[x,y,w,h]=vector.viewBox,count=nodes(vector.root);if(count>240)throw Error('Stage 30 art budget exceeded: '+key);return{id:STAGE30_ART_PREFIX+key,name,category,environmentRole:role,visual:[],vector,collision:[],anchor:{x:0,y:0},sockets:[],tags:['stage30-ferry','visual-only','editable-native-vector'],params:{artRevision:1,collisionSource:'authored-stage-terrain',nodeCount:count,...extra},bounds:{x,y,w,h},reference:{heightM:h/60,bounds:{x,y,w,h},foot:{x:0,y:0},scaleRange:[.35,4],backgroundRange:[.35,4]}};}
export function stage30SurfaceEdges(st,t){return(t.properties?.honroWalkEdges||st.design?.space?.surfaces?.find(s=>s.terrainId===t.id)?.edgeIndices||[]).map(i=>[t.points[i],t.points[(i+1)%t.points.length]]).filter(([a,z])=>a&&z&&Math.abs(z.x-a.x)>.001);}
export function stage30SurfaceAt(st,t,x){for(const[a,z]of stage30SurfaceEdges(st,t))if(x>=Math.min(a.x,z.x)-.001&&x<=Math.max(a.x,z.x)+.001)return a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x);return null;}
function box(t){const xs=t.points.map(p=>p.x),ys=t.points.map(p=>p.y);return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};}
function register(p,a){const i=p.library.findIndex(v=>v.id===a.id);if(i<0)p.library.push(a);else p.library[i]=a;return a;}
function add(p,st,a,key,x=0,y=0,extra={}){register(p,a);const e={id:'sf-art-'+key,assetId:a.id,x,y,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back',...extra};st.elements.push(e);return e;}
function on(p,st,a,key,spec){const t=st.terrains.find(t=>t.id===spec.terrainId);if(!t)throw Error('Stage 30 art support missing: '+spec.terrainId);const xs=stage30SurfaceEdges(st,t).flat().map(p=>p.x),left=Math.min(...xs),right=Math.max(...xs),x=spec.x??left+(right-left)*(spec.u??.5),y=stage30SurfaceAt(st,t,x);if(y===null)throw Error(`Stage 30 art cannot ground ${key} at ${x} on ${t.id}`);return add(p,st,a,key,x,y,{scale:spec.scale??1,stage30Support:{terrainId:t.id,x,y},...(spec.extra||{})});}
function hut(){let b='<defs><linearGradient id="ferry-thatch" x1="-400" y1="-480" x2="280" y2="-100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#958b60"/><stop offset="0.46" stop-color="#746e4e"/><stop offset="1" stop-color="#3e4638"/></linearGradient></defs>';
 b+=path('M-405-13L-355-51H323L392-24 366 1H-366Z','#40565a','#213b42',6,'low-stone-foundation');b+=path('M-351-46H301L350-24H-374Z','#92a18a');b+=path('M-340-270H294V-43H-340Z','#788270');b+=path('M294-272L355-228V-44H294Z','#3d5048');b+=path('M-318-242H-195V-48H-318Z','#b0ab85');b+=path('M-170-220H35V-44H-170Z','#223b3b');b+=path('M-140-202H-65V-56H-140Z','#4e5541');b+=path('M-104-204L-78-206V-58H-103Z','#666749');b+=path('M55-217H253V-49H55Z','#8b9073');b+=path('M103-194H223V-102H103Z','#283f3a');b+=path('M135-192V-103M188-192V-103M104-143H222','none','#6f755a',10);b+=path('M-347-277L-328-38H-300L-312-277Z M23-258L33-41H55L51-257Z M278-262L289-42H319L304-260Z','#493f2e');b+=path('M-336-269L-319-44M36-255L44-44M291-257L306-46','none','#a18d60',6);b+=path('M-375-272Q-284-324-230-420Q-100-466 81-445Q215-439 265-377L329-313 423-273 411-244Q253-270 121-252Q-60-267-203-245L-426-251Z','url(#ferry-thatch)','#263c36',7,'asymmetric-low-thatched-roof');b+=path('M-365-288Q-280-341-223-408Q-82-449 87-430L208-405 265-358Q55-376-51-352Q-200-340-365-288Z','#a4996d');b+=path('M-422-256Q-205-264-119-258L101-268 411-252 404-233Q242-246 127-235L-77-244-219-232-415-239Z','#3b4536');b+=path('M-273-358L-257-331M-169-409L-157-379M-38-424L-39-397M87-417L83-388M207-387L192-362M282-318L264-296','none','#c0ad79',5);b+=path('M-174-277L-192-258M-101-282L-126-256M38-281L22-258M145-276L142-249M267-276L266-250','none','#6a6546',8);b+=path('M-409-245L-423-206-401-232M359-250L384-211 378-243','none','#8b845d',5);b+=path('M-355-42L-325-7H-245L-270-38Z M167-40L185-6H317L292-42Z','#344b49');return asset('abandoned-hut','기단 위에 낮게 웅크린 폐초가 한 채',b,[-440,-485,890,506]);}
function recordStone(){let b=path('M-157 0L-189-67-148-150-68-207 69-193 165-114 185-35 137 5Z','#718985','#253f47',7);b+=path('M-148-148L-68-207 69-193 102-150 7-129-93-80-165-70Z','#a6b09a');b+=path('M102-150L165-114 185-35 137 5 49-14 71-89Z','#3e5c61');b+=path('M-105-77L-70-124 31-133 69-93 53-45-78-38Z','#c6c1a1','#4d635e',4);b+=path('M-80-104L-2-109 38-82M-75-88L-36-75 9-78M-70-65L-18-60','none','#777f68',4);b+=path('M-99-45L-118-21 63-13 64-46Z','#263f4499');return asset('map-stone','운송 기록을 편 닳은 화강암',b,[-201,-220,402,239],{role:'rock',category:'terrain'});}
function oldSign(){let b=path('M-95 0L-58-22H57L97 1Z','#304b50')+path('M-15-4L-28-280-12-361 12-357 25-259 10-3Z','#695f43','#2d3e34',5)+path('M-14-20L-19-271-9-343 0-342 7-20Z','#a39365');b+=path('M-125-302L-143-275-96-259 158-277 176-300 121-319Z','#6f7256','#253e3b',5);b+=path('M-133-285L122-304 160-297','none','#b0aa7c',5);b+=path('M-96-277L-26-280M-4-282L58-287M87-289L125-292','none','#303f34',7);b+=path('M-8-224Q33-219 55-201L39-161Q13-173-7-179Z','#aaa995');b+=path('M-2-218Q22-211 38-200L31-184 1-193Z','#d2c9aa');return asset('old-funeral-sign','바람에 닳은 옛 장례길의 나무 길표',b,[-159,-377,354,390]);}
function reeds(variant=0){let b=path('M-154 0Q-62-29 27-19L149 3Z','#1f4445');const stems=variant?[[-121,-132,-89],[-84,-173,-36],[-25,-204,11],[28,-153,72],[68,-185,119],[116,-119,142]]:[[-139,-161,-101],[-95,-207,-52],[-41,-166,3],[3,-229,39],[47,-198,88],[105,-147,139]];for(const[x,y,tip]of stems){b+=path(`M${x} 0Q${x-3} ${y*.53} ${tip} ${y}`,'none','#777a54',5);b+=path(`M${tip-5} ${y+18}Q${tip-14} ${y-7} ${tip+8} ${y-35}Q${tip+25} ${y-11} ${tip+7} ${y+13}Z`,'#a29567');b+=path(`M${x} -22Q${x-43} -90 ${x-65} -102Q${x-25} -97 ${x+4} -35Z`,'#455d45');}b+=path('M-81 2Q-63-59-31-89Q-48-41-45 3M28 2Q60-49 94-77Q72-26 66 6','none','#5f7350',10);return asset('reeds-'+variant,'돌의 빈 가장자리에 뿌리내린 갈대 '+(variant+1),b,[-170,-275,360,293],{category:'tree',role:'tree'});}
function mooringPost(){let b=path('M-95 2L-65-23 56-19 92 4Z','#334c4c')+path('M-48-22L-41-108 31-117 48-20Z','#6d6d4c','#273e38',5)+path('M-41-108L-20-122 45-115 31-98Z','#aa9c6c')+path('M-35-91L-29-26-10-27-13-92Z','#a18d60')+path('M-56-64Q-10-83 52-65M-56-53Q-5-72 52-54M-55-42Q-3-58 51-44','none','#b5a477',7)+path('M-45-56Q-101-80-124-33Q-107 3-72-9Q-99-31-73-42','none','#8d8860',8);return asset('mooring-post','실제 선창 끝의 낮은 계류 말뚝과 감긴 밧줄',b,[-140,-140,260,155]);}
function cargo(){let b=path('M-180 0L-169-64-107-97-40-78-9-11Z','#706d4e','#2b403a',6)+path('M-143-59Q-101-85-51-61L-34-20-145-18Z','#9b9270')+path('M-111-88L-116-6M-57-69L-63-11','none','#494f38',9);b+=path('M0-5L-19-111 83-142 167-119 184-7Z','#67583e','#263b35',6)+path('M-19-111L83-142 167-119 64-86Z','#a39468')+path('M64-86L167-119 184-7 75-4Z','#3b4638')+path('M-9-85L69-63M0-52L70-36M36-122L55-7M115-132L127-11','none','#b1a27a',7);return asset('quay-cargo','나루의 낮은 짐묶음과 비어 있는 적재함',b,[-195,-160,399,174]);}
// Working landing equipment. The load-bearing upper deck is existing collision;
// posts, beams and rope drum are recessed behind actors, never a new walk rim.
function loadingFrame(st){const t=st.terrains.find(t=>t.id==='sf-quay-west-loft'),court=st.terrains.find(t=>t.id==='sf-ferry-court'),q=box(t);let b='';
 const a=q.x+62,z=q.x+q.w-60,ground=stage30SurfaceAt(st,court,a),top=stage30SurfaceAt(st,t,a);
 for(const x of [a,z]){b+=poly([[x-18,top+32],[x+17,top+32],[x+22,ground],[x-24,ground]],'#524d38','#233c38',4);b+=line([[x-8,top+45],[x-12,ground-9]],'#948560',6);}
 b+=poly([[a-15,top+50],[z+16,top+30],[z+13,top+62],[a-12,top+80]],'#655f43','#263c35',4);
 b+=line([[a+5,ground-40],[a+104,top+72]],'#6d6748',16);b+=line([[z-4,ground-45],[z-112,top+62]],'#6d6748',16);
 const x=a+205,y=ground;b+=path(`M${x-64} ${y-8}L${x-43} ${y-87}L${x-14} ${y-83}L${x-30} ${y-5}Z M${x+54} ${y-7}L${x+32} ${y-88}L${x+7} ${y-85}L${x+23} ${y-5}Z`,'#514b34','#203831',4);
 b+=path(`M${x-58} ${y-67}Q${x} ${y-91} ${x+62} ${y-70}L${x+61} ${y-42}Q${x} ${y-24} ${x-58} ${y-44}Z`,'#988461','#243a32',4);
 b+=line([[x-37,y-72],[x-35,y-39]],'#4e5038',7);b+=line([[x+34,y-71],[x+33,y-38]],'#4e5038',7);
 b+=path(`M${x+55} ${y-54}Q${x+134} ${y-47} ${x+159} ${y-6}`,'none','#b4a178',6);
 return asset('landing-frame','선창 널마루를 받치는 목구조와 계류 밧줄을 감는 호롱',b,[q.x,top,q.w,ground-top+12],{extra:{rearOnly:true,terrainId:t.id}});
}
function pine(key,height,variant){const a=stage11PineAsset(key,{height,variant});a.id=STAGE30_ART_PREFIX+key;a.tags=['stage30-ferry','visual-only','editable-native-vector'];a.name='강바람에 비껴 자란 큰 소나무';a.params={...a.params,artRevision:1};return a;}
export function createStage30BargeAsset(st,t){const edges=stage30SurfaceEdges(st,t),ps=t.points.map(p=>[p.x,p.y]),q=box(t),top=edges.flatMap(([a],i)=>i?[[a.x,a.y]]:[[a.x,a.y]]);if(edges.length)top.push([edges.at(-1)[1].x,edges.at(-1)[1].y]);if(top.length<2)throw Error('Stage 30 barge has no walking top');const lower=x=>{const hits=[];for(let i=0;i<t.points.length;i++){const a=t.points[i],z=t.points[(i+1)%t.points.length];if(Math.abs(z.x-a.x)>.001&&x>=Math.min(a.x,z.x)-.001&&x<=Math.max(a.x,z.x)+.001)hits.push(a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x));}return Math.max(...hits);};const sample=(u,d=0)=>{const x=q.x+q.w*u,y=stage30SurfaceAt(st,t,x);if(y===null)throw Error('Barge top must be continuous');return[x,y+d];};let b=`<defs><linearGradient id="hull-depth" x1="${q.x}" y1="${q.y}" x2="${q.x+q.w*.3}" y2="${q.y+q.h}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#9a8d64"/><stop offset="0.38" stop-color="#726b4d"/><stop offset="1" stop-color="#263e3d"/></linearGradient></defs>`;
 // A shallow visible rear deck plane gives this single vessel breadth. Its
 // front rim is exactly the collision top; the far edge is scenery behind it.
 const rear=top.map(([x,y],i)=>[x+(i===0?38:i===top.length-1?-36:0),y-34]);
 b+=poly([...rear,...top.slice().reverse()],'#8e8661','#243d37',4,'broad-rear-deck-plane');
 const hx=sample(.42)[0],deck=x=>stage30SurfaceAt(st,t,x)-18,hl=hx-155,hr=hx+154,yl=deck(hl),yr=deck(hr);
 b+=poly([[hl,yl],[hl+24,yl-62],[hr-43,yr-64],[hr,yr],[hr-24,yr+8]],'#6e7057','#263c35',5,'covered-cargo-hatch');
 b+=poly([[hl+24,yl-62],[hl+126,yl-76],[hr-43,yr-64],[hr-96,yr-36],[hl+56,yl-34]],'#a2a080');
 for(const x of [hx-76,hx+71])b+=line([[x,deck(x)-59],[x+18,deck(x)]],'#4e5139',6);
 const sx=sample(.83)[0],shl=sx-145,shr=sx+184,sl=deck(shl),sr=deck(shr);
 b+=poly([[shl,sl-8],[shr-54,sr-12],[shr,sr-10],[shr-4,sr+6],[shr-44,sr+10],[shl+5,sl+4]],'#8b7952','#2a3d34',4,'stowed-steering-sweep');
 b+=poly(ps,'url(#hull-depth)','#142d36',8,'one-heavy-low-hull');const strip=(d,w,col)=>{const xs=[...new Set(ps.map(p=>p[0]))].sort((a,z)=>a-z),p=xs.map(x=>[x,stage30SurfaceAt(st,t,x),lower(x)]);b+=poly([...p.map(([x,y,lo])=>[x,Math.min(lo-3,y+d)]),...p.slice().reverse().map(([x,y,lo])=>[x,Math.min(lo-2,y+d+w)])],col);};
 strip(0,15,'#c0b58a');strip(23,25,'#837652');strip(49,8,'#2a3e35');strip(78,8,'#223a34');strip(112,11,'#152f33');
 // Four widely separated, unequal clamps belong to one broad hull. No rail.
 for(const u of [.065,.29,.63,.92]){const [x,y]=sample(u),dep=Math.max(22,Math.min(148,lower(x)-y-8));b+=poly([[x-9,y+12],[x+7,y+11],[x+13,y+dep-4],[x-9,y+dep]],'#313e32');b+=line([[x-5,y+18],[x-4,y+dep-18]],'#ad9b6b',3);}
 for(const[u,len]of[[.16,58],[.79,70]]){const[x,y]=sample(u,-24);b+=path(`M${x-len} ${y+3}Q${x-20} ${y-10} ${x+len} ${y-4}L${x+len-9} ${y+11}Q${x} ${y+20} ${x-len+6} ${y+12}Z`,'#435341','#a0936b',3);b+=path(`M${x-len+14} ${y+3}Q${x} ${y-3} ${x+len-18} ${y+1}M${x-len+19} ${y+8}Q${x} ${y+2} ${x+len-21} ${y+5}`,'none','#b3a079',3);}
 const left=sample(.025),right=sample(.975);for(const[p,hand]of[[left,-1],[right,1]]){const[x,y]=p;b+=path(`M${x-19} ${y+13}L${x-18+hand*13} ${y-31}L${x+17+hand*13} ${y-28}L${x+20} ${y+16}Z`,'#5e5c40','#263a33',4);b+=line([[x-12+hand*13,y-23],[x+11+hand*13,y-22]],'#b5a377',5);}
 const from=st.initialState?.honroFerrySpec?.artFrom||{x:80,y:-145,rotation:.008},pivot=top.at(-1),cs=Math.cos(from.rotation),sn=Math.sin(from.rotation),corners=[[q.x-25,q.y-52],[q.x+q.w+25,q.y-52],[q.x+q.w+25,q.y+q.h+28],[q.x-25,q.y+q.h+28]],all=[...corners,...corners.map(([x,y])=>[pivot[0]+from.x+(x-pivot[0])*cs-(y-pivot[1])*sn,pivot[1]+from.y+(x-pivot[0])*sn+(y-pivot[1])*cs])],xs=all.map(p=>p[0]),ys=all.map(p=>p[1]),bounds=[Math.min(...xs)-3,Math.min(...ys)-3,Math.max(...xs)-Math.min(...xs)+6,Math.max(...ys)-Math.min(...ys)+6];return asset('settled-barge','계류선에 붙잡혀 멎은 넓고 낮은 짐배 한 척',b,bounds,{extra:{terrainId:t.id,terrainPoints:structuredClone(t.points),topPoints:top,view:'broad-low-cargo-barge',singleHull:true}});}
function groundedRearSupports(st){let b='',feet=[];const get=id=>st.terrains.find(t=>t.id===id),foot=(id,x,sourceTerrainId,kind)=>{const y=stage30SurfaceAt(st,get(id),x);if(y===null)throw Error('Rear bank misses '+id+'/'+x);const f={terrainId:id,x:n(x),y:n(y),sourceTerrainId,kind,rearOnly:true};feet.push(f);return f;};
 // Broad recessed riverbank masses continue to measured shore contacts.
 // No rim/outline: these are the back of the gorge, not new collision walls.
 const cl=foot('sf-west-ford',2670,'sf-granite-cape','recessed-bank'),cr=foot('sf-west-ford',5720,'sf-granite-cape','recessed-bank');
 b+=path(`M3035 4800Q3530 4630 4130 4730L5425 4925Q5460 5370 5560 5730L${cr.x} ${cr.y+8}L4650 6240L3500 6270L${cl.x} ${cl.y+8}Q2880 5840 2950 5410Z`,'#30474d','',1,'cape-rooted-bank');
 b+=path(`M3100 4900L3750 4870L4050 5220Q3700 5450 3370 5590L3090 5930L${cl.x} ${cl.y+8}Q2940 5580 3100 4900Z`,'#405457');
 b+=path('M4070 5190Q4640 5090 5110 4980L5425 4925L5390 5580 5530 6040 4900 6220 4340 6220Q4380 5770 4070 5190Z','#263f46');
 b+=path('M3360 5600Q3780 5380 4140 5470L4610 5700Q4890 5910 5220 6000L5550 6150 4620 6220 3430 6230 3000 6240Z','#344b50');
 const ql=foot('sf-west-ford',4780,'sf-ferry-court','recessed-natural-quay-foot'),qr=foot('sf-west-ford',6150,'sf-ferry-court','recessed-natural-quay-foot');
 b+=path(`M4848 5660L6259 5630Q6300 5960 6260 6130L${qr.x} ${qr.y+8}L5720 6180L5360 6230L${ql.x} ${ql.y+8}Q4950 6020 4848 5660Z`,'#3b5154','',1,'quay-rooted-bedrock');
 b+=path(`M4850 5660L5360 5720L5620 5940L5490 6210L${ql.x} ${ql.y+8}Q4950 5920 4850 5660Z`,'#49605e');
 b+=path(`M5820 5700L6259 5630Q6300 5960 6260 6130L${qr.x} ${qr.y+8}L5760 6160L5910 5890Z`,'#293f47');
 const el=foot('sf-east-recovery-shore',7330,'sf-bank-inner','recessed-east-bank'),em=foot('sf-east-recovery-shore',7910,'sf-bank-inner','recessed-east-bank'),er=foot('sf-east-recovery-shore',8430,'sf-bank-inner','recessed-east-bank');
 b+=path(`M6105 4960Q6530 4790 7040 4960L7730 4850L8447 4880L${er.x} ${er.y+8}L${em.x} ${em.y+8}L${el.x} ${el.y+8}Q7040 6190 7000 5810Q6830 5420 6420 5300L6105 5160Z`,'#2e464e','',1,'east-rooted-bank');
 b+=path(`M6900 5180Q7350 5140 7770 4920L8280 4920L${em.x} ${em.y+8}L${el.x} ${el.y+8}Q7180 5860 6900 5180Z`,'#3b5358');
 b+=path(`M7980 4930L8447 4880L${er.x} ${er.y+8}L${em.x} ${em.y+8}L7690 6100Q7920 5620 7980 4930Z`,'#243e48');
 return{asset:asset('recessed-grounded-supports','실제 여울·강둑에 이어지는 후퇴한 선창 암반',b,[2400,4250,6500,2350],{category:'terrain',role:'rock',extra:{rearOnly:true,collisionSource:'none',supports:feet,noWalkRim:true,depthRelationship:'recessed-behind-all-authored-L1-solids'}}),feet};}

function riverDepth(st){const water=st.materials.find(z=>z.id==='sf-main-river'||z.kind==='water-pool');if(!water?.surface?.length)return null;const xs=water.surface.map(p=>p[0]),top=Math.min(...water.surface.map(p=>p[1])),bottom=Math.max(...(water.bottom||water.points).map(p=>p[1])),left=Math.min(...xs)-1200,right=Math.max(...xs)+1200,end=st.terrainBounds?.bottom||st.height+6000;let b=`<defs><linearGradient id="ink-river-depth" x1="0" y1="${top}" x2="0" y2="${bottom}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2f4c5a"/><stop offset="0.24" stop-color="#142f40"/><stop offset="1" stop-color="#1b303c"/></linearGradient></defs>`;b+=poly([[left,top],[right,top],[right,end],[left,end]],'url(#ink-river-depth)');return asset('deep-river-underlay','실제 강수면 아래로 이어지는 먹빛 깊이',b,[left,top,right-left,end-top],{category:'terrain',role:'water',extra:{rearOnly:true,collisionSource:'none',surfaceY:top,sourceWaterId:water.id,depthOnly:true,noExtraWaterMotion:true}});}
// Riverbank material planes are derived from the existing polygon, never a
// scenic skirt or a replacement collision surface. Cross-sections keep every
// weathered layer inside even the narrow undercut ledges.
function shoreMaterials(st){
 const ids=['sf-map-rock','sf-west-ford','sf-granite-cape','sf-cape-west-buttress','sf-bank-inner','sf-east-recovery-shore','sf-outbank-screen'];let b='';
 for(const id of ids){const t=st.terrains.find(t=>t.id===id);if(!t)continue;const q=box(t),xs=[...new Set(t.points.map(p=>p.x))].sort((a,z)=>a-z),section=x=>{const hits=[];for(let i=0;i<t.points.length;i++){const a=t.points[i],z=t.points[(i+1)%t.points.length];if(Math.abs(a.x-z.x)<.001){if(Math.abs(x-a.x)<.001)hits.push(a.y,z.y);continue;}if(x>=Math.min(a.x,z.x)-.001&&x<=Math.max(a.x,z.x)+.001)hits.push(a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x));}return[Math.min(...hits),Math.max(...hits)];};
  const sampled=[...new Set(xs.flatMap((x,i)=>i?[xs[i-1]+(x-xs[i-1])*.45,x]:[x]))].sort((a,z)=>a-z);
  const band=(from,to,color,phase=0)=>{const at=(x,d)=>{const[hi,lo]=section(x),variation=d?Math.sin(x*.0023+phase)*Math.min(d*.12,31):0;return[x,Math.min(lo,hi+d+variation)];};b+=poly([...sampled.map(x=>at(x,from)),...sampled.slice().reverse().map(x=>at(x,to))],color);};
  if(['sf-map-rock','sf-west-ford','sf-east-recovery-shore'].includes(id))b+=poly(t.points.map(p=>[p.x,p.y]),id==='sf-map-rock'?'#374e4e':'#2c4449');
  // A quiet wet margin follows the collision contour. Its irregular underside
  // grades into broad rock faces, rather than tracing several parallel ribbons.
  band(11,75,'#566557',.2);
  const walk=stage30SurfaceEdges(st,t).flat().map(v=>v.x),materialX=walk.length?Math.min(...walk):q.x,materialW=walk.length?Math.max(...walk)-materialX:q.w;
  const plane=(us,ds,color)=>{const ps=us.map((u,i)=>{const x=materialX+materialW*u,[hi,lo]=section(x);return[x,Math.min(lo,hi+ds[i])];});b+=poly(ps,color);};
  if(q.w>1200&&!['sf-granite-cape','sf-bank-inner'].includes(id)){plane([.015,.17,.31,.42,.34,.22,.06],[135,195,100,370,650,570,425],'#40564f');plane([.37,.54,.67,.94,.81,.61,.45],[210,100,235,190,590,710,480],'#344d4d');}
  if(id==='sf-granite-cape'){
   b+=poly([[3050,4725],[3440,4630],[3735,4690],[4180,4605],[4460,4665],[4620,4780],[4360,4835],[3920,4820],[3590,4900],[3270,4870]],'#647064');
   b+=poly([[3050,4890],[3470,4805],[3680,4940],[3900,5030],[4350,4940],[4780,4950],[4940,5010],[4750,5050],[4350,5460],[3900,5500],[3450,5240],[3040,5000]],'#304a4d');
   b+=poly([[3450,4960],[3680,4940],[3900,5030],[4350,4940],[4200,5180],[3900,5360],[3650,5190]],'#3b5551');
  }
  if(id==='sf-bank-inner'){
   b+=poly([[6120,4950],[6450,4910],[6750,4990],[7020,4950],[7300,5085],[7450,4950],[7785,4810],[8130,4885],[8380,4850],[8240,4990],[7860,5015],[7490,5180],[7070,5130],[6760,5090]],'#5b695b');
   b+=poly([[6270,5080],[6750,5040],[7070,5130],[7370,5380],[6870,5230]],'#2b4449');
  }
  if(id==='sf-outbank-screen'){
   b+=poly([[6720,5330],[6830,5150],[6860,5450],[7050,5840],[7130,6210],[7070,6440],[6900,6120],[6810,5760]],'#526657');
   b+=poly([[6860,5450],[6990,5490],[7350,6120],[7130,6210],[7050,5840]],'#273f46');
  }

 }
 b+=poly([[1840,5680],[2170,6110],[2490,6320],[2760,6490],[3210,6440],[3590,6400],[4050,6320],[4430,6290],[4860,6420],[5360,6410],[5710,6340],[6030,6330],[6320,6540],[6380,6710],[5790,6530],[5360,6590],[4830,6600],[4370,6470],[3990,6500],[3570,6580],[3170,6630],[2750,6710],[2390,6510],[2110,6270]],'#354d4b');
 // Unequal gravel shelves lie below the real ford contour, not above its route.
 b+=poly([[2470,6330],[2760,6360],[3090,6340],[3370,6310],[3650,6250],[3910,6250],[3730,6330],[3400,6390],[3110,6410],[2770,6445],[2520,6410]],'#526255');
 b+=poly([[4030,6255],[4410,6220],[4710,6310],[5070,6320],[5290,6280],[5480,6305],[5180,6395],[4720,6390],[4430,6305]],'#40574e');
 return asset('weathered-shore-planes','실제 지형 안에서 이어지는 젖은 모래·풍화암의 넓은 층',b,[-6000,4200,22000,28000],{category:'terrain',role:'rock',extra:{collisionSource:'none',authoredTerrainIds:ids,insideTerrainOnly:true,noWalkRim:true}});
}
function distantRiver(){let b='<defs><linearGradient id="ferry-rear-channel" x1="0" y1="5000" x2="0" y2="6700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3b555d"/><stop offset="0.45" stop-color="#344d56"/><stop offset="1" stop-color="#2b444e"/></linearGradient></defs>';
 b+=path('M-6000 5080Q-2600 5240-700 5150L900 5220 1930 5170 3100 5290 4470 5210 5810 5340 7190 5240 8680 5320 11000 5180 17200 5310V7100H-6000Z','url(#ferry-rear-channel)');
 b+=path('M-6000 5050L-2700 4910-1200 5060 160 4980 790 5110 1310 5070 1860 5150 2390 5060 2910 5150 3380 5040 4030 5140 4660 5090 5210 5200 5740 5160 6310 5070 6930 5130 7560 5020 8230 5140 8710 5050 9370 5170 11000 5060 17200 5140V5400Q10300 5320 7770 5410Q5030 5330 2630 5380Q-1000 5280-6000 5390Z','#3b5056');
 b+=path('M-6000 5620Q-2300 5520 500 5620Q2980 5490 4470 5600L3790 5670Q1320 5600-1500 5720Z M5700 5740Q7660 5600 10600 5730L13500 5720 14000 5800Q9380 5740 7300 5820Z','#405b62');
 return asset('distant-channel','나루 뒤로 넓게 이어지는 낮은 대비의 강과 건너편 둑',b,[-6000,4800,23200,2300],{category:'terrain',role:'water',extra:{rearOnly:true,collisionSource:'none',scenicWaterOnly:true,noExtraWaterMotion:true,noWalkRim:true}});
}
function bankRoots(){let b=path('M-170 5Q-84-31-17-18L71-30 155 8 60 17-29 9Z','#334b43');b+=path('M-18-4Q-42-71-19-128Q-11-90 4-55L68-13 113 4 61-4 6-23 17 5Z','#606447');b+=path('M-15-32L-69-44-118-16M-4-16L-50-9-96 8M6-15L63-54 94-51','none','#7b7a56',7);return asset('bank-roots','물가의 낮은 뿌리와 젖은 흙덩이',b,[-180,-140,350,165],{category:'tree',role:'tree'});}
function quayBacking(st){let b='',feet=[];for(const id of ['sf-quay-west-loft','sf-quay-east-loft','sf-east-landing-planks','sf-cape-bank-link','sf-old-road-west-bridge']){const t=st.terrains.find(t=>t.id===id);if(!t)continue;const q=box(t),edges=stage30SurfaceEdges(st,t);for(const[a,z]of edges){b+=poly([[a.x,a.y+7],[z.x,z.y+7],[z.x,z.y+46],[a.x,a.y+46]],'#34483c');b+=line([[a.x,a.y+9],[z.x,z.y+9]],'#a3966e',6);}
 for(const[a,z]of edges){const length=z.x-a.x;for(const u of [.19,.53,.83]){const x=a.x+length*u,y=a.y+(z.y-a.y)*u;b+=poly([[x-5,y+17],[x+3,y+17],[x+1,y+42],[x-6,y+42]],'#253b33');b+=poly([[x-22,y+25],[x+20,y+23],[x+21,y+31],[x-21,y+32]],'#827953');}}
 for(const u of [.13,.78]){const x=q.x+q.w*u,y=stage30SurfaceAt(st,t,x);if(y===null)continue;const below=st.terrains.filter(v=>v!==t&&!v.oneWay&&v.id!=='sf-settled-barge'&&v.id!=='sf-outbank-screen').map(v=>({terrainId:v.id,y:stage30SurfaceAt(st,v,x)})).filter(v=>v.y!==null&&v.y>y+60&&v.y-y<1100).sort((a,z)=>a.y-z.y)[0];if(!below)continue;const ground=below.y;b+=poly([[x-16,y+28],[x+17,y+28],[x+25,ground],[x-22,ground]],'#2a443f');b+=line([[x-9,y+36],[x-13,ground-5]],'#6b7656',6);b+=poly([[x-40,ground],[x-23,ground-24],[x+31,ground-18],[x+47,ground]],'#758578');feet.push({deckId:id,x,top:y,...below});}}
 const q={x:0,y:3500,w:11200,h:3300};return{asset:asset('timber-bearing-frames','나루 널판 아래 실제 돌해안에 닿는 뒤받침',b,[q.x,q.y,q.w,q.h],{extra:{rearOnly:true,supports:feet}}),feet};}
export function applyStage30FerryArt(project){const st=project.stages.find(s=>s.metadata?.stageId===30);if(st?.design?.ferry?.version!==1)throw Error('Stage 30 ferry art requires authored ferry version 1');const spec=st.design.ferry.art||{};st.elements=st.elements.filter(e=>!e.id.startsWith('sf-art-'));const local=st.terrains.filter(t=>t.id.startsWith('sf-'));if(!local.length)throw Error('Stage 30 ferry art requires authored sf terrain');
 const backdrop=register(project,asset('far-river','멀어진 단 하나의 먹산과 넓은 강굽이',readFileSync(new URL('../../shared/assets/environment/stage30-ferry-far.svg',import.meta.url),'utf8'),null,{category:'terrain',role:'mountain',source:true,extra:{skyOnly:true,collisionSource:'none'}}));
 add(project,st,distantRiver(),'distant-channel');
 const deep=riverDepth(st);if(deep)add(project,st,deep,'deep-river-underlay');const rear=groundedRearSupports(st);add(project,st,rear.asset,'recessed-grounded-supports',0,0,{stage30Supports:rear.feet});
 const has=id=>local.some(t=>t.id===id),place=(a,key,s)=>has(s.terrainId)?on(project,st,a,key,s):null;
 place(hut(),'abandoned-hut',spec.hut||{terrainId:'sf-map-rock',x:760,scale:.8});const map=st.markers.find(m=>/transport-map/.test(m.id));if(map&&has('sf-map-rock'))place(recordStone(),'map-stone',{terrainId:'sf-map-rock',x:map.x});
 for(const s of spec.pines||[{key:'cape-pine',terrainId:'sf-granite-cape',u:.26,height:1060,variant:3},{key:'east-pine',terrainId:'sf-bank-inner',u:.84,height:870,variant:2},{key:'old-road-pine',terrainId:'sf-old-road-gather',u:.5,height:900,variant:1}])place(pine(s.key,s.height||1000,s.variant||0),s.key,s);
 for(const[i,s]of(spec.reeds||[{terrainId:'sf-west-ford',u:.21,scale:.75},{terrainId:'sf-west-ford',u:.68,scale:1.15},{terrainId:'sf-west-ford',u:.89,scale:.75},{terrainId:'sf-east-recovery-shore',u:.26,scale:.9}]).entries())place(reeds(i%2),'reeds-'+i,s);
 place(oldSign(),'old-road-sign',spec.sign||{terrainId:'sf-old-road-gather',u:.16,scale:.86});place(cargo(),'quay-cargo',spec.cargo||{terrainId:'sf-ferry-court',u:.18,scale:.8});place(mooringPost(),'mooring-post',{terrainId:'sf-ferry-court',u:.88,scale:.7});
 for(const [i,s]of [{terrainId:'sf-west-ford',x:2160,scale:1.15},{terrainId:'sf-west-ford',x:3730,scale:.8},{terrainId:'sf-west-ford',x:5710,scale:1.1},{terrainId:'sf-east-recovery-shore',x:7880,scale:.9},{terrainId:'sf-map-rock',x:1590,scale:.8}].entries())place(bankRoots(),'bank-roots-'+i,s);
 add(project,st,shoreMaterials(st),'weathered-shore-planes',0,0,{layer:'front'});
 const t=local.find(t=>t.id==='sf-settled-barge');if(t)add(project,st,createStage30BargeAsset(st,t),'settled-barge',0,0,{layer:'mid',stage30FerryBody:true});const frames=quayBacking(st);add(project,st,frames.asset,'timber-bearing-frames');add(project,st,loadingFrame(st),'landing-frame');
 if(st.environment){st.environment.placements=[];st.environment.groups=[];st.environment.surfaces=[];st.environment.skyVisible=true;st.environment.atmosphere={preset:'valley',overrides:{skyTop:'#182d3a',skyBottom:'#657a78',waterBaseColor:'#142f40',waterHighlightColor:'#75979c',hazeStrength:.18,mistStrength:.035,lightStrength:.055}};}
 st.design.ferryArt={revision:2,source:'stage30-authored-terrain',nativeVectorOnly:true,backdropAsset:backdrop,bargeElementId:'sf-art-settled-barge',supports:[...frames.feet,...rear.feet],artAssetIds:st.elements.filter(e=>e.id.startsWith('sf-art-')).map(e=>e.assetId),budgets:{maxNodesPerAsset:240,maxSkyRasterPixels:1890000}};
 return project;
}
