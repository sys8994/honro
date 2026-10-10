/** Fresh vertical22 place-making. Exact foreground solids are dressed with
 * shared terrainPlanes; Korean rear buildings never introduce collision. */
import {compileSVG} from './build-act2-art.mjs';
import {koreanTownBuilding,koreanArchiveCabinet} from './korean-town-art.mjs';
import {v22Y,V22_LAYOUT} from '../map-forge/stage22-vertical-geometry.mjs';

export const STAGE22_VERTICAL_ART_PREFIX='stage22:vertical-';
const PREFIX=STAGE22_VERTICAL_ART_PREFIX,ELEMENT='v22-art-',N=v=>Math.round(v*1000)/1000;
const C={ink:'#1d3037',stone:'#626f70',top:'#9ba59b',side:'#3d545b',joint:'#2b424b',wood:'#625441',woodLit:'#a38a62',woodDark:'#3b4237',paper:'#b5aa85',roof:'#465d61',inside:'#243b3e'};
const path=(d,fill,id='',stroke='',width=1)=>`<path${id?` id="${id}"`:''} d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`:''}/>`;
const poly=(ps,fill,id='')=>path('M'+ps.map(p=>p.map(N).join(' ')).join('L')+'Z',fill,id);
const rect=(x,y,w,h,fill,id='')=>path(`M${N(x)} ${N(y)}h${N(w)}v${N(h)}h${N(-w)}Z`,fill,id);
const line=(ps,color,width=2,id='')=>path('M'+ps.map(p=>p.map(N).join(' ')).join('L'),'none',id,color,width);
const group=(id,b,x=0,y=0)=>`<g id="${id}" transform="translate(${N(x)} ${N(y)})">${b}</g>`;
const body=svg=>svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const countNodes=n=>1+(n.children||[]).reduce((s,n)=>s+countNodes(n),0);
const PLAIN_KEYS=['terrains','units','markers','routes','events','initialState','encounters','anchors','width','height','camera','terrainBounds','playBounds','terrainDomainVersion'];
const gameplay=s=>JSON.stringify(Object.fromEntries(PLAIN_KEYS.map(k=>[k,s[k]])));
function pack(key,name,b,box,{feet=[],kind='architecture',extra={}}={}){
 const vector=compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.join(' ')}"><title>${name}</title><desc>Korean archive scenery. Pure editable vector; no image, extra ledge, interaction, or collision.</desc>${b}</svg>`),[x,y,w,h]=box,nodeCount=countNodes(vector.root);
 if(nodeCount>180)throw Error('Stage22 vector node budget '+key+' '+nodeCount);
 return{id:PREFIX+key,name,category:'architecture',environmentRole:kind==='rear-masonry'?'cliff':'building',visual:[],vector,collision:[],anchor:{x:0,y:0},sockets:[],material:'wood',breakable:false,oneWay:false,tags:['stage22-vertical','korean-archive','visual-only'],params:{artRevision:1,rearOnly:true,collisionSource:'none',footXs:feet,kind,nodeCount,...extra},bounds:{x,y,w,h},reference:{heightM:h/60,bounds:{x,y,w,h},foot:{x:0,y:0},scaleRange:[.7,1.4],backgroundRange:[.7,1.4]}};
}
function register(p,a){const i=p.library.findIndex(v=>v.id===a.id);if(i<0)p.library.push(a);else p.library[i]=a;return a;}
function actualY(stage,id,x){const t=stage.terrains.find(t=>t.id===id);if(!t)throw Error('Stage22 missing art support '+id);for(const i of t.properties?.honroWalkEdges||[]){const a=t.points[i],b=t.points[(i+1)%t.points.length];if(x>=Math.min(a.x,b.x)-.001&&x<=Math.max(a.x,b.x)+.001){const y=a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);if(Math.abs(y-v22Y(id,x))>.01)throw Error('Stage22 geometry source drift '+id);return y;}}throw Error('Stage22 foot outside actual walk edge '+id+' @ '+x);}
function place(p,s,a,key,support,x,{zone,scale=1,purpose}={}){
 register(p,a);const y=actualY(s,support,x),feet=a.params.footXs.map(dx=>({terrainId:support,x:N(x+dx*scale),y:actualY(s,support,x+dx*scale)}));if(feet.some(f=>Math.abs(f.y-y)>.01))throw Error('Stage22 building footprint is not flat: '+key);
 const e={id:ELEMENT+key,assetId:a.id,x,y,scale,rotation:0,snap:false,depthLayer:'L1',layer:'back',stage22Support:{terrainId:support,x,y},stage22Supports:feet};s.elements.push(e);s.design.space.scenery.push({id:e.id,elementId:e.id,assetId:a.id,roomId:'v22-'+zone,surfaceId:support,x,y,scale,footOffset:0,visualOnly:true,purpose});return e;
}
function muted(svg){const palette={'#b9ac89':'#93947c','#938d6c':'#727f72','#c2b793':'#b0aa87','#68776e':'#73827d','#293b3d':'#30494e','#76503c':'#6e5949','#a17b52':'#aa936b','#416353':'#486660'};return svg.replace(/#[0-9a-f]{6}/gi,c=>palette[c.toLowerCase()]||c);}
function archiveBuilding(key,{width,role='archive',roofType='gable',variant=0,cabinets=true}={}){
 // This is the same approved source used by21/22/24. Only values, appropriate
 // bay width, and horizontal bound folios vary; no exotic roof vocabulary.
 const a=koreanTownBuilding(PREFIX+key,{width,role,roofType,variant,collision:false}),l=-width/2,r=width/2;let b=muted(body(a.vector.source));
 if(cabinets){const cabinet=koreanArchiveCabinet(PREFIX+key+'-folios',{width:Math.min(130,width*.25),height:133,variant});b+=group('horizontal-bound-records',body(cabinet.vector.source),l+24,-145);}
 b+=poly([[l+4,-13],[r-5,-13],[r+12,-4],[l-13,-4]],'#8e9a88','plinth-upper-left-plane');b+=poly([[l-13,-4],[r+12,-4],[r+15,0],[l-15,0]],'#324b53','wide-contact-to-actual-floor');
 const [x,y,w,h]=a.vector.viewBox;return pack(key,role==='office'?'대조마당의 낮은 관아 대청':'석축에 붙은 판문 문서고',b,[x,y,w,h],{feet:[l-15,l+width*.33,l+width*.67,r+15],extra:{koreanType:a.params.koreanType,roofType,bayCount:a.params.bayCount,approvedSource:'tools/environment/korean-town-art.mjs; existing stages21/22/24'}});
}
function narrowRecordBay(key,{width=126,variant=0}={}){
 const l=-width/2,r=width/2,roof=koreanTownBuilding(PREFIX+key+'-roof',{width:width+20,role:'archive',roofType:'gable',collision:false}),roofSVG=roof.vector.source.match(/<g id="korean-gable-roof">[\s\S]*?<\/g>/)[0],defs=roof.vector.source.match(/<defs>[\s\S]*?<\/defs>/)[0];
 let b=defs+rect(l,-185,width,171,'#697768','single-deep-record-bay')+poly([[r-20,-185],[r,-175],[r,-14],[r-20,-14]],'#344d4f','east-cheek-shadow')+rect(l+13,-167,width-26,152,C.inside);
 const c=koreanArchiveCabinet(PREFIX+key+'-case',{width:width-36,height:126,variant});b+=group('one-horizontal-folio-cabinet',body(c.vector.source),l+18,-145);
 for(const x of [l+3,r-15])b+=rect(x,-188,12,174,C.wood)+rect(x+2,-180,3,156,C.woodLit)+poly([[x-7,-15],[x+18,-15],[x+22,0],[x-10,0]],'#7b8980');
 b+=rect(l-5,-185,width+10,17,C.woodDark)+rect(l-8,-173,width+16,6,'#597464')+`<g id="low-single-bay-eave" transform="matrix(1 0 0 0.5 0 -67.5)">${muted(roofSVG)}</g>`+poly([[l-4,-9],[r+4,-9],[r+8,0],[l-8,0]],'#7c8a83');
 return pack(key,'가파른 석축의 한 칸 기록함과 낮은 맞배 처마',b,[l-58,-261,width+116,264],{feet:[l-8,r+8],extra:{koreanType:'single-bay-record-shed',bayCount:1,eaveHeight:185,roofType:'gable',approvedSource:'koreanTownBuilding roof and koreanArchiveCabinet unchanged components'}});
}
function documentTable(){let b=poly([[-96,-61],[82,-61],[104,-46],[-88,-46]],'#a39571','wide-desk-top')+rect(-88,-46,192,12,'#685a40');for(const x of [-77,77])b+=poly([[x,-34],[x+13,-34],[x+17,0],[x-3,0]],C.woodDark);b+=rect(-63,-85,64,22,C.paper)+rect(-65,-88,68,5,'#496a61')+rect(-45,-87,5,25,'#74795a')+rect(12,-72,62,11,'#c6b792')+rect(14,-77,61,5,'#715e44');return pack('comparison-table','대조를 기다리는 두 포갑과 낮은 장부상',b,[-102,-96,215,101],{feet:[-80,91],kind:'prop'});}
function lantern(){let b=poly([[-11,0],[-7,-77],[7,-77],[13,0]],'#515645')+poly([[-28,-78],[-28,-118],[28,-118],[28,-78]],'#8e815d')+rect(-19,-110,38,24,'#c6b67a')+rect(-3,-113,5,31,'#615b3d')+poly([[-33,-119],[0,-136],[33,-119],[26,-113],[-27,-113]],'#384e4e')+poly([[-26,-3],[25,-3],[30,0],[-31,0]],'#73857d');return pack('record-lamp','문서곁의 낮은 나무 등잔',b,[-35,-141,70,144],{feet:[-31,30],kind:'prop',extra:{lightAnchor:{x:0,y:-96}}});}
function rearRail(stage,support,xs,key){const feet=xs.map(x=>({terrainId:support,x,y:actualY(stage,support,x)}));let b='';for(const p of feet){b+=poly([[p.x-5,p.y],[p.x-5,p.y-60],[p.x+5,p.y-60],[p.x+6,p.y]],'#5a6154')+line([[p.x-2,p.y-53],[p.x-2,p.y-3]],'#9a9779',2);}for(let i=1;i<feet.length;i++){const a=feet[i-1],z=feet[i];b+=line([[a.x,a.y-52],[z.x,z.y-52]],'#5e6a5d',9)+line([[a.x,a.y-56],[z.x,z.y-56]],'#a19e80',2.4);}const xmin=xs[0]-12,ymin=Math.min(...feet.map(p=>p.y))-69;return{asset:pack(key,'실제 경사를 따라가는 낮은 뒤난간',b,[xmin,ymin,xs.at(-1)-xmin+13,Math.max(...feet.map(p=>p.y))-ymin+6],{extra:{kind:'rear-rail',groundedSupports:feet,noDeck:true}}),feet};}

/** Back walls reach actual lower courts, with broad shaded sides instead of
 * decorative floating islands. Foreground jump throats remain distinct: no
 * bright rim, stair picture, balcony floor, or collision on these rear faces. */
function connectedRetainingWalls(stage){
 const feet=[],attachments=[],foot=(id,x)=>{const p={terrainId:id,x,y:actualY(stage,id,x)};feet.push(p);return p;},undert=(id)=>{const t=stage.terrains.find(t=>t.id===id),last=Math.max(...t.properties.honroWalkEdges)+1,points=t.points.slice(last+1);attachments.push({terrainId:id,points,contact:'rear face overlaps actual underside; no new walk rim'});return points;};
 let b='<defs><linearGradient id="v22-rear-depth" x1="700" y1="1300" x2="2900" y2="5350" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#384f52"/><stop offset=".62" stop-color="#2d464d"/><stop offset="1" stop-color="#203b43"/></linearGradient></defs>';
 const masses=[
  {id:'v22-west-gallery',lower:'v22-lower-court',xs:[550,1250],side:120,key:'west-gallery-foundation'},
  {id:'v22-report-approach',lower:'v22-lower-court',xs:[1180,2180],side:125,key:'lower-return-bearing'},
  {id:'v22-report-crossing',lower:'v22-lower-court',xs:[1800,3070],side:175,key:'central-document-terrace'},
  {id:'v22-register-mass',lower:'v22-west-gallery',xs:[680,1530],side:115,key:'register-back-buttress'},
  {id:'v22-east-register-rise',lower:'v22-report-crossing',xs:[2070,2400],side:70,key:'east-turn-recess'},
  {id:'v22-comparison-mass',lower:'v22-report-crossing',xs:[1830,2920],side:185,key:'upper-court-bearing'}
 ];
 for(const q of masses){const contour=undert(q.id),left=foot(q.lower,q.xs[0]),right=foot(q.lower,q.xs[1]),chain=contour.map(p=>[p.x,p.y-17]);b+=poly([...chain,[left.x,left.y+8],[right.x,right.y+8]],'url(#v22-rear-depth)',q.key);const start=contour[0];b+=poly([[start.x-q.side,start.y-10],[start.x+4,start.y-10],[right.x+3,right.y+7],[right.x-q.side,right.y+7]],'#223c44',q.key+'-receding-east-face');}
 // Few large sheltered planes. These stop short of routes and expose no tops.
 b+=poly([[1450,3910],[1650,3850],[2030,4490],[1810,4670],[1710,4290]],'#3c5254','C-bearing-upper-left-face');
 b+=poly([[2440,3458],[2740,3360],[2960,4500],[2680,4550]],'#344d50','C-one-broad-east-buttress');
 b+=poly([[870,2930],[1080,2840],[1110,3220],[910,3220]],'#405653','register-west-face');
 b+=poly([[2170,1900],[2410,1800],[2530,2843],[2340,2843]],'#3a5051','comparison-lower-stone-face');
 b+=poly([[2530,1820],[2780,1720],[2850,2843],[2650,2843]],'#2c4247','comparison-recessed-side');
 // Squared storage vents, not arched castle windows. Large quiet voids make
 // depth legible without adding crack noise or rows of identical wall tiles.
 for(const [x,y,w,h]of [[2420,3930,136,229],[1140,4530,113,250],[2560,2330,117,207]]){b+=rect(x,y,w,h,'#1d343c','recessed-square-service-opening')+poly([[x,y],[x+14,y+12],[x+14,y+h],[x,y+h]],'#53635b')+rect(x+34,y+16,8,h-18,'#465349')+rect(x+w-37,y+16,8,h-18,'#3c4d45');}
 return{asset:pack('connected-retaining-walls','관아의 실제 아래뜰에 닿는 여섯 후면 석축',b,[55,1590,3160,3740],{kind:'rear-masonry',extra:{groundedSupports:feet,terrainAttachments:attachments,noWalkRim:true,noProjectileCover:true,structuralMasses:6}}),feet,attachments};
}

function masonryPlanes(stage){
 const planes=[],records=[],byId=new Map(stage.terrains.map(t=>[t.id,t]));
 const add=(terrainId,key,ps,fill)=>planes.push({terrainId,id:ELEMENT+'stone-'+key,stage22VerticalArt:true,points:ps.map(p=>p.map(N)),fill});
 const block=(id,key,x,y,w,h,{follow=false,tone=0,side=.12}={})=>{const t=byId.get(id),xs=t.properties.honroWalkEdges.flatMap(i=>[t.points[i].x,t.points[i+1].x]),lo=Math.min(...xs),hi=Math.max(...xs),Y=(xx,dy)=>follow?actualY(stage,id,Math.max(lo,Math.min(hi,xx)))+y+dy:y+dy,pts=ps=>ps.map(([xx,yy])=>[x+w*xx,Y(x+w*xx,h*yy)]),colors=[['#687976','#929f91','#415a60'],['#5b7174','#84968e','#354f59'],['#74807a','#a2aa98','#485e62']][tone];
  const bevel=Math.min(18,h*.10)/h,edge=Math.min(29,w*.09)/w,foot=Math.min(13,h*.07)/h;
  add(id,key+'-body',pts([[0,bevel*.45],[edge*.6,0],[1-edge*.3,0],[1,bevel],[1,1-foot],[1-edge*.6,1],[edge*.3,1],[0,1-foot]]),colors[0]);
  add(id,key+'-upper-plane',pts([[0,bevel*.45],[edge*.6,0],[1-edge*.3,0],[1,bevel],[1-edge,bevel*1.25],[edge,bevel],[0,bevel*1.7]]),colors[1]);
  add(id,key+'-east-face',pts([[1-edge*.3,0],[1,bevel],[1,1-foot],[1-edge*.6,1],[1-edge,1-foot],[1-edge,bevel*1.25]]),colors[2]);
  add(id,key+'-bearing-shadow',pts([[0,1-foot*1.7],[1-edge,1-foot],[1,1-foot*1.7],[1,1-foot],[1-edge*.6,1],[edge*.3,1],[0,1-foot]]),'#263f4999');records.push({terrainId:id,key,box:{x,y,w,h},followWalkProfile:follow,tone});};
 for(const s of V22_LAYOUT.surfaces){const t=byId.get(s.id);add(s.id,s.id+'-continuous-cut-stone',t.points.map(p=>[p.x,p.y]),s.zone==='A'?'#465d62':'#4e666c');}
 // Each load-bearing place has a different course direction, block count and
 // scale. The exact solid clip crops all geometry beyond its collision edge.
 block('v22-lower-court','lower-clerk-plinth',240,5295,530,560,{tone:2});block('v22-lower-court','seal-gate-foundation',735,5284,680,624,{tone:0});block('v22-lower-court','great-ramp-wedge',1300,-5,720,520,{follow:true,tone:1});block('v22-lower-court','east-arrival-cap',1980,4546,700,560,{tone:0});block('v22-lower-court','lower-east-buttress',2640,4485,840,710,{tone:1});block('v22-lower-court','lower-base-west',120,5800,1520,1050,{tone:1});block('v22-lower-court','lower-base-middle',1600,5080,1430,1680,{tone:0});block('v22-lower-court','lower-base-east',3000,5100,1820,1640,{tone:1});
 block('v22-report-approach','return-high-block',1125,-6,265,220,{follow:true,tone:2});block('v22-report-approach','return-inclined-stone',1330,-10,277,230,{follow:true,tone:0});block('v22-report-approach','return-landing-stone',1580,4350,230,180,{tone:1});
 block('v22-report-crossing','report-desk-bearing',1350,3692,240,90,{tone:2});block('v22-report-crossing','report-desk-lower-stone',1350,3787,278,143,{tone:0});
 block('v22-report-crossing','report-upper-step',1510,-7,364,129,{follow:true,tone:0});block('v22-report-crossing','report-upper-step-base',1500,137,424,148,{follow:true,tone:1});
 block('v22-report-crossing','report-rising-upper-course',1830,-10,449,167,{follow:true,tone:0});block('v22-report-crossing','report-rising-lower-course',1810,165,477,263,{follow:true,tone:1});
 // The main archive is a three-course retaining plinth, not one tall prism.
 // Unequal courses have staggered vertical joints; no uniform wall tile grid.
 block('v22-report-crossing','record-plinth-cap-west',2260,2844,394,141,{tone:2});block('v22-report-crossing','record-plinth-cap-east',2660,2844,390,141,{tone:0});
 block('v22-report-crossing','record-plinth-middle-west',2210,2994,290,166,{tone:0});block('v22-report-crossing','record-plinth-middle-east',2506,2994,543,166,{tone:1});
 block('v22-report-crossing','record-plinth-base-west',2110,3169,597,332,{tone:1});block('v22-report-crossing','record-plinth-base-east',2713,3169,336,211,{tone:0});
 block('v22-west-gallery','west-entrance-cutstone',63,2742,317,361,{tone:0});block('v22-west-gallery','gallery-oblique-bearing',350,-10,433,241,{follow:true,tone:1});block('v22-west-gallery','gallery-return-stone',753,-9,390,192,{follow:true,tone:0});block('v22-west-gallery','gallery-clerk-foundation',1105,3248,596,171,{tone:2});
 block('v22-east-register-rise','east-rise-upper-stone',1775,-12,292,364,{follow:true,tone:0});block('v22-east-register-rise','east-rise-bottom-stone',2030,2630,210,207,{tone:1});
 block('v22-register-mass','register-west-ramp',550,-9,350,335,{follow:true,tone:1});block('v22-register-mass','register-west-foundation',851,-10,350,714,{follow:true,tone:0});block('v22-register-mass','register-archive-upper-plinth',1130,1893,247,166,{tone:2});block('v22-register-mass','register-archive-middle-plinth',1070,2068,347,210,{tone:0});block('v22-register-mass','register-archive-base',1030,2287,355,463,{tone:1});block('v22-register-mass','register-east-sloping-stone',1360,-8,370,429,{follow:true,tone:1});
 block('v22-comparison-mass','comparison-rise-stone',1480,-8,344,264,{follow:true,tone:0});block('v22-comparison-mass','comparison-west-monolith',1790,-7,378,559,{follow:true,tone:1});block('v22-comparison-mass','comparison-west-cap',2110,1194,490,148,{tone:2});block('v22-comparison-mass','comparison-exit-cap',2606,1194,394,148,{tone:0});
 block('v22-comparison-mass','comparison-middle-west',2040,1351,319,208,{tone:0});block('v22-comparison-mass','comparison-middle-east',2365,1351,640,208,{tone:1});
 block('v22-comparison-mass','comparison-lower-west',1980,1568,610,345,{tone:1});block('v22-comparison-mass','comparison-lower-exit',2596,1568,404,221,{tone:0});
 // The visible narrow cap is on the REAL walking edge, never a backdrop line.
 for(const s of V22_LAYOUT.surfaces)for(let i=1;i<s.top.length;i++){const a=s.top[i-1],z=s.top[i];add(s.id,s.id+'-true-top-'+i,[[a[0],a[1]],[z[0],z[1]],[z[0],z[1]+9],[a[0],a[1]+9]],'#b0b49a');add(s.id,s.id+'-top-bearing-'+i,[[a[0],a[1]+11],[z[0],z[1]+11],[z[0],z[1]+24],[a[0],a[1]+24]],'#344f59aa');}
 // Real gate paint is clipped to that gate, and vanishes with it on opening.
 for(const id of ['archive-door','upper-door']){const t=byId.get(id),x=Math.min(...t.points.map(p=>p.x)),y=Math.min(...t.points.map(p=>p.y)),h=Math.max(...t.points.map(p=>p.y))-y;add(id,id+'-wood',t.points.map(p=>[p.x,p.y]),'#665c42');add(id,id+'-sunward-post',[[x,y],[x+9,y],[x+9,y+h],[x,y+h]],'#aa9164');add(id,id+'-deep-side',[[x+33,y],[x+44,y],[x+44,y+h],[x+33,y+h]],'#2c3f3c');for(const dy of [75,h-92])add(id,id+'-crossbar-'+dy,[[x,y+dy],[x+44,y+dy],[x+44,y+dy+13],[x,y+dy+13]],'#a6996d');}
 return{planes,records};
}
/** C is an archive building section, not a dressed rock prism. The real
 * ramp remains one continuous slope. Inlaid transverse tread joints, stringer
 * and rear railing use that exact profile, with no stair silhouette outside it.
 * Every facade/window below the floor is closed and clipped to the live solid. */
function reportArchitecturePlanes(stage){
 const id='v22-report-crossing',planes=[],records=[],terrain=stage.terrains.find(t=>t.id===id),add=(key,ps,fill)=>planes.push({terrainId:id,id:ELEMENT+'archive-section-'+key,stage22VerticalArt:true,points:ps.map(p=>p.map(N)),fill}),box=(key,x,y,w,h,fill)=>add(key,[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],fill);
 add('continuous-enclosed-base',terrain.points.map(p=>[p.x,p.y]),'#465852');
 // Two closed storage storeys belong to the gabled archive above. Human-scale
 // bays and horizontal ties establish the large building before masonry detail.
 box('west-masonry-cheek',2240,2860,140,680,'#4b5d56');
 box('main-closed-facade',2362,2885,610,522,'#797d65');
 box('eastern-return-wall',2950,2880,88,568,'#3b514d');
 box('east-corner-light',2950,2880,12,530,'#88927a');
 const posts=[2396,2530,2663,2797,2931];
 for(const [j,y]of [2944,3166].entries()){
  box('story-'+j+'-deep-beam',2357,y-15,618,25,'#3d4436');box('story-'+j+'-timber-beam',2359,y-12,614,11,'#886e4c');box('story-'+j+'-top-light',2359,y-12,614,3,'#b4a078');
  for(let i=0;i<posts.length-1;i++){const x=posts[i]+15,w=posts[i+1]-x-5;
   box('story-'+j+'-bay-'+i+'-closed-wall',x,y+7,w,190,j===0?'#6f785f':'#5d6d5d');
   box('story-'+j+'-bay-'+i+'-header',x+12,y+19,w-24,37,'#384d42');
   // Closed square upper vents and plank panels, never dark traversable doors.
   for(const dx of [w*.28,w*.53,w*.76])box('story-'+j+'-bay-'+i+'-vent-'+N(dx),x+dx,y+20,4,34,'#899578');
   box('story-'+j+'-bay-'+i+'-shutter',x+11,y+72,w-22,99,i===1?'#918267':'#7c7a5d');
   box('story-'+j+'-bay-'+i+'-shutter-center',x+w*.5-2,y+73,5,97,'#4b5540');
   for(const dy of [89,142])box('story-'+j+'-bay-'+i+'-shutter-brace-'+dy,x+12,y+dy,w-24,6,'#b09b70');
  }
 }
 for(const [i,x]of posts.entries()){box('post-'+i,x-8,2924,18,438,'#5b4e38');box('post-'+i+'-light',x-6,2929,4,424,'#ae9164');box('post-'+i+'-side',x+6,2928,5,429,'#343f33');}
 box('lower-storey-sill',2357,3364,618,22,'#434e3f');box('lower-storey-sill-light',2357,3364,618,5,'#8c8c6c');
 // A stone is a fraction of actor height, instead of a several-person prism.
 // Only the plinth receives staggered courses; the whole facade is not tiled.
 const stone=(key,x,y,w,h,tone=0)=>{box(key+'-body',x,y,w,h,['#7b8877','#687d73','#89927e'][tone]);add(key+'-top',[[x,y],[x+w,y],[x+w-4,y+5],[x+3,y+5]],'#b1b29a');box(key+'-side',x+w-5,y+5,5,h-5,'#3d5955');box(key+'-bed',x+3,y+h-5,w-3,5,'#304a4b');};
 for(const [r,y]of [2864,2902].entries()){const cuts=r?[2320,2446,2601,2737,2878,3035]:[2288,2404,2546,2700,2842,3035];for(let i=1;i<cuts.length;i++)stone('upper-plinth-'+r+'-'+i,cuts[i-1]+3,y,cuts[i]-cuts[i-1]-6,32,(i+r)%3);}
 for(const [r,y]of [3394,3448,3502].entries()){const cuts=r===1?[2240,2385,2540,2677,2840,3040]:[2195,2340,2494,2653,2794,2940,3055];for(let i=1;i<cuts.length;i++)stone('foot-plinth-'+r+'-'+i,cuts[i-1]+3,y,cuts[i]-cuts[i-1]-6,46,(i+r)%3);}
 // The inclined front is an attached solid stair/ramp stringer. Its narrow
 // top joints are inlaid into the physical slope; no false horizontal steps.
 const flights=[[1510,1780],[1890,2300]],joints=[];
 for(const [n,[lo,hi]]of flights.entries()){
  const y0=actualY(stage,id,lo),y1=actualY(stage,id,hi);
  add('flight-'+n+'-stringer-body',[[lo,y0+13],[hi,y1+13],[hi,y1+100],[lo,y0+100]],'#71816e');
  add('flight-'+n+'-stringer-side',[[lo,y0+78],[hi,y1+78],[hi,y1+103],[lo,y0+103]],'#354f4a');
  add('flight-'+n+'-stringer-top',[[lo,y0+14],[hi,y1+14],[hi,y1+24],[lo,y0+24]],'#aaa991');
  // A few unequal closed masonry panels carry the inclined face beneath it.
  const xs=n?[lo,1980,2085,2195,hi]:[lo,1600,1692,hi];for(let i=1;i<xs.length;i++){const a=xs[i-1]+4,z=xs[i]-3,ay=actualY(stage,id,a),zy=actualY(stage,id,z);add('flight-'+n+'-bearing-'+i,[[a,ay+112],[z,zy+112],[z,zy+164],[a,ay+164]],i%2?'#657969':'#596e62');add('flight-'+n+'-bearing-foot-'+i,[[a,ay+158],[z,zy+158],[z,zy+166],[a,ay+166]],'#2d4946');}
  const count=Math.ceil(Math.hypot(hi-lo,y1-y0)/56);for(let i=1;i<count;i++){const x=lo+(hi-lo)*i/count,y=actualY(stage,id,x);box('flight-'+n+'-inlaid-joint-'+i,x,y+1,3,6,'#304943');joints.push({terrainId:id,x:N(x),y:N(y),depth:6,physicalProfile:'continuous-ramp',noNewStep:true});}
 }
 for(const [key,x,y,w]of [['report',1370,3700,140],['mid-turn',1780,3400,110]]){stone(key+'-landing-upper',x,y+14,w,35,2);stone(key+'-landing-lower',x+4,y+55,w-8,43,0);}
 const surface=V22_LAYOUT.surfaces.find(t=>t.id===id);for(let i=1;i<surface.top.length;i++){const a=surface.top[i-1],z=surface.top[i];add('true-profile-'+i,[[a[0],a[1]],[z[0],z[1]],[z[0],z[1]+7],[a[0],a[1]+7]],'#b3b69a');}
 records.push({terrainId:id,key:'closed-two-storey-archive-section',storyBeamYs:[2944,3166],storyHeight:222,postXs:posts,stoneCourseHeight:[32,46],maxStoneWidth:187,openDoorways:0,collisionClip:'current-solid'});
 return{planes,records,joints};
}
function actualUnderside(stage,id,x){const t=stage.terrains.find(t=>t.id===id),ys=[];for(let i=0;i<t.points.length;i++){const a=t.points[i],b=t.points[(i+1)%t.points.length];if(Math.abs(a.x-b.x)>.001&&x>=Math.min(a.x,b.x)-.001&&x<=Math.max(a.x,b.x)+.001)ys.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));}if(!ys.length)throw Error('Missing real underside '+id+' @ '+x);return Math.max(...ys);}
/** Rear timber continues from existing solid undersides to existing floors.
 * Closed lower storage walls and intermediate tie beams give the tall archive
 * a structural scale. Open gallery piers have no drawn or colliding deck. */
function reportLoadFrame(stage){
 const feet=[],heads=[],columns=[],foot=(support,x)=>{const p={terrainId:support,x,y:actualY(stage,support,x)};feet.push(p);return p;},head=(support,x)=>{const p={terrainId:support,x,y:actualUnderside(stage,support,x)};heads.push(p);return p;};let b='';
 const xs=[1840,2150,2480,2780,2940],pairs=xs.map(x=>({top:head('v22-report-crossing',x),base:foot('v22-lower-court',x)}));
 b+=poly([...pairs.map(p=>[p.top.x,p.top.y-15]),...pairs.slice().reverse().map(p=>[p.base.x,p.base.y])],'#3e5147','closed-lower-archive-wall');
 b+=poly([[2780,pairs[3].top.y-13],[2940,pairs[4].top.y-15],[2940,pairs[4].base.y],[2780,pairs[3].base.y]],'#2b423e','recessed-eastern-archive-wall');
 // These are flush structural ties in a wall, without a balcony or walk rim.
 for(const [i,y]of [3825,4140].entries()){b+=rect(1835,y,1110,24,'#344637','lower-storey-tie-'+i)+rect(1838,y+3,1104,5,'#798066');}
 for(const [i,q]of pairs.entries()){const x=q.top.x,y=q.top.y-13,h=q.base.y-y;b+=rect(x-12,y,25,h,'#4d503c','load-bearing-post-'+i)+rect(x-9,y+9,5,h-18,'#868569')+poly([[x-30,q.base.y-19],[x+26,q.base.y-19],[x+34,actualY(stage,q.base.terrainId,x+34)],[x-34,actualY(stage,q.base.terrainId,x-34)]],'#6a7d6d');columns.push({top:q.top,foot:q.base,width:25});}
 // Sparse closed storage shutters make the tall bearing structure a building.
 for(const [i,x]of [2230,2535,2815].entries())for(const y of [3690,3960,4260]){const top=actualUnderside(stage,'v22-report-crossing',x);if(y<top+72||y+134>actualY(stage,'v22-lower-court',x)-40)continue;b+=rect(x,y,88,124,'#586552','closed-rear-store-'+i+'-'+y)+rect(x+40,y+4,6,116,'#344936')+rect(x+5,y+29,78,5,'#8a8b67')+rect(x+5,y+89,78,5,'#798164');}
 // D's existing low gallery visibly stands on C's landing and B's return.
 const gallery=[{x:1165,support:'v22-report-approach'},{x:1390,support:'v22-report-crossing'},{x:1490,support:'v22-report-crossing'}];
 for(const [i,q]of gallery.entries()){const top=head('v22-west-gallery',q.x),base=foot(q.support,q.x),h=base.y-top.y;b+=rect(q.x-11,top.y-8,22,h+8,'#625741','gallery-post-'+i)+rect(q.x-8,top.y,5,h-10,'#ab956d')+poly([[q.x-13,base.y-12],[q.x+13,base.y-12],[q.x+14,actualY(stage,q.support,q.x+14)],[q.x-14,actualY(stage,q.support,q.x-14)]],'#81917f');columns.push({top,foot:base,width:22});const bx=q.x+38,by=Math.min(base.y-28,top.y+84);b+=poly([[q.x+7,top.y+12],[bx,by],[bx+8,by-8],[q.x+12,top.y+4]],'#786b4f');}
 return{asset:pack('report-archive-load-frame','아래뜰과 회랑을 잇는 문서고의 층보와 실제 지주',b,[1118,3280,1870,1430],{kind:'rear-masonry',extra:{kind:'archive-load-frame',groundedSupports:feet,undersideContacts:heads,columns,closedStorage:true,noDeck:true,noProjectileCover:true,intermediateTieYs:[3825,4140]}}),feet,heads,columns};
}

/** The remaining terraces share C's load-bearing architectural language,
 * with different uses and proportions. No foreground cliff prisms remain.
 * Closed wall sections are current-solid paint, never scenic collision. */
function builtTerracePlanes(stage){
 const planes=[],records=[],rampProfiles=[],add=(id,key,ps,fill)=>planes.push({terrainId:id,id:ELEMENT+'built-'+key,stage22VerticalArt:true,points:ps.map(p=>p.map(N)),fill}),box=(id,key,x,y,w,h,fill)=>add(id,key,[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],fill);
 const stone=(id,key,x,y,w,h,tone=0)=>{box(id,key,x,y,w,h,['#7c8977','#697f72','#89917c'][tone]);box(id,key+'-top',x+2,y,w-4,4,'#a9ae94');box(id,key+'-side',x+w-4,y+4,4,h-4,'#3b5550');box(id,key+'-bed',x,y+h-4,w,4,'#314c48');};
 const storey=(id,key,x,y,w,h,bays,{paper=false,dim=false}={})=>{box(id,key+'-wall',x,y,w,h,dim?'#576a59':paper?'#7f8169':'#6c735b');box(id,key+'-beam',x-5,y-13,w+10,19,'#4a4936');box(id,key+'-beam-light',x-3,y-12,w+6,4,'#a8946b');box(id,key+'-sill',x,y+h-16,w,16,'#404c3d');const dx=w/bays;
  for(let i=0;i<=bays;i++){const px=x+i*dx;box(id,key+'-post-'+i,px-7,y-12,15,h+11,'#62533c');box(id,key+'-post-light-'+i,px-5,y-5,4,h-2,'#a78b60');}
  for(let i=0;i<bays;i++){const px=x+i*dx+19,pw=dx-38,py=y+24,ph=h-60;if(pw<24)continue;box(id,key+'-closed-panel-'+i,px,py,pw,ph,paper?'#a39b7a':i%2?'#79805f':'#897e5d');box(id,key+'-panel-top-'+i,px,py,pw,8,'#4c5840');box(id,key+'-panel-center-'+i,px+pw*.5-2,py+8,5,ph-8,'#4f5840');for(const k of [.33,.72])box(id,key+'-panel-tie-'+i+'-'+k,px+2,py+ph*k,pw-4,5,paper?'#69725a':'#b1a176');}
  records.push({terrainId:id,key,kind:paper?'closed-paper-record-room':'closed-plank-record-room',storeyHeight:h,bays,closed:true});
 };
 for(const surface of V22_LAYOUT.surfaces.filter(s=>s.id!=='v22-report-crossing')){const id=surface.id,t=stage.terrains.find(t=>t.id===id);add(id,id+'-built-body',t.points.map(p=>[p.x,p.y]),id==='v22-lower-court'?'#3b514d':id==='v22-register-mass'?'#3d5148':'#4b6056');
  for(let i=1;i<surface.top.length;i++){const a=surface.top[i-1],b=surface.top[i],key=id+'-edge-'+i,flat=Math.abs(a[1]-b[1])<.01;
   // The visible traffic band is continuous. It does not draw stepped ledges
   // into the air or imply different collision from the authored incline.
   add(id,key+'-continuous-traffic-band',[[a[0],a[1]],[b[0],b[1]],[b[0],b[1]+17],[a[0],a[1]+17]],'#a1aa8e');
   add(id,key+'-bearing-band',[[a[0],a[1]+20],[b[0],b[1]+20],[b[0],b[1]+63],[a[0],a[1]+63]],'#77846e');
   add(id,key+'-deep-stringer',[[a[0],a[1]+62],[b[0],b[1]+62],[b[0],b[1]+76],[a[0],a[1]+76]],'#2e4a43');
   if(!flat)rampProfiles.push({terrainId:id,from:{x:a[0],y:a[1]},to:{x:b[0],y:b[1]},continuous:true,drawnStepCount:0});
   else if(b[0]-a[0]>140){let x=a[0]+3,n=0;while(x<b[0]-20){const w=Math.min([132,171,148,159][n%4],b[0]-x-3);stone(id,key+'-plinth-'+n,x,a[1]+25,w,34,n%3);x+=w+5;n++;}}
  }
 }
 // A is the grounded administrative foundation: broad lower clerk rooms and
 // an east store wing. Its deep buried base is quiet, without giant boulders.
 storey('v22-lower-court','lower-clerk-basement',380,5380,915,194,5,{paper:true});
 storey('v22-lower-court','lower-east-record-wing',1970,4637,1250,203,6,{dim:true});
 box('v22-lower-court','buried-west-foundation',0,5660,1590,940,'#354d48');box('v22-lower-court','buried-east-foundation',1610,4940,3200,1680,'#304a47');
 for(const [i,y]of [5590,5635].entries())for(const [j,x]of [360,515,684,850,1010,1166].entries())stone('v22-lower-court','clerk-foot-'+i+'-'+j,x,y,145+(j%2)*13,38,(i+j)%3);
 // B and E are solid circulation wings. Sparse upright timber members split
 // the inclined bearing body; there are no open holes through physical solids.
 for(const id of ['v22-report-approach','v22-east-register-rise']){const sf=V22_LAYOUT.surfaces.find(s=>s.id===id),xs=id==='v22-report-approach'?[1225,1435,1638]:[1840,1984,2140];for(const [i,x]of xs.entries()){const top=actualY(stage,id,x)+80,bottom=actualUnderside(stage,id,x);box(id,id+'-inset-post-'+i,x-7,top,15,Math.max(0,bottom-top),'#625a42');box(id,id+'-inset-post-light-'+i,x-5,top,4,Math.max(0,bottom-top-9),'#a08e65');}records.push({terrainId:id,key:'enclosed-circulation-wing',kind:'continuous-stone-ramp',profile:sf.top,drawnStepCount:0});}
 // D: a shallow timber sill under the occupied gallery, with short masonry
 // below; the west rise reads as its same supported returning corridor.
 box('v22-west-gallery','gallery-floor-timber',1010,3275,650,27,'#796b4d');box('v22-west-gallery','gallery-timber-bottom',1010,3296,650,14,'#384c3d');for(const [i,x]of [1020,1164,1320,1484].entries())stone('v22-west-gallery','gallery-low-foot-'+i,x,3315,137,38,i%3);
 // F is only the closed retaining fill beneath an external continuous
 // passage. Its windows have been removed; rear orthogonal buildings are
 // separately grounded on D and are never sheared/clipped into this slope.
 records.push({terrainId:'v22-register-mass',key:'external-register-passage',kind:'closed-retaining-fill-under-external-ramp',frontWindows:0,drawnStepCount:0});
 // G: a light upper record room and a dark lower storey support the low
 // comparison hall. The original same-level240-unit exit stays unaltered.
 storey('v22-comparison-mass','comparison-upper-record-room',2115,1287,807,177,5,{paper:true});
 storey('v22-comparison-mass','comparison-lower-record-room',2036,1515,899,182,5,{dim:true});
 for(const [r,y]of [1711,1761].entries())for(const [i,x]of [1970,2131,2303,2460,2632,2790].entries())stone('v22-comparison-mass','comparison-foot-'+r+'-'+i,x+(r?53:0),y,149,42,(i+r)%3);
 return{planes,records,rampProfiles};
}
function linkedTerraceFrames(stage){
 const groups=[{key:'east-return-bearing',top:'v22-east-register-rise',feet:'v22-report-crossing',xs:[1830,1990,2170],ties:[2895,3140],closed:false},{key:'comparison-archive-bearing',top:'v22-comparison-mass',feet:'v22-report-crossing',xs:[2050,2330,2610,2890],ties:[2130,2450,2730],closed:true},{key:'lower-return-bearing',top:'v22-report-approach',feet:'v22-lower-court',xs:[1450,1635,1730],ties:[4620,4900],closed:false}],rows=[];
 for(const q of groups){let b='';const columns=q.xs.map(x=>({top:{terrainId:q.top,x,y:actualUnderside(stage,q.top,x)},foot:{terrainId:q.feet,x,y:actualY(stage,q.feet,x)},width:25}));for(const c of columns)if(c.foot.y<=c.top.y)throw Error('Archive support must descend to an actual floor '+q.key);
  if(q.closed)b+=poly([...columns.map(c=>[c.top.x,c.top.y-9]),...columns.slice().reverse().map(c=>[c.foot.x,c.foot.y])],q.key.startsWith('comparison')?'#465446':'#3d5346',q.key+'-closed-bearing-wall');
  for(const [i,y]of q.ties.entries()){const first=columns.find(c=>c.top.y<y&&c.foot.y>y),last=columns.slice().reverse().find(c=>c.top.y<y&&c.foot.y>y);if(!first||!last||first===last)continue;b+=rect(first.top.x-12,y,last.top.x-first.top.x+24,19,'#414b36','flush-tie-'+i)+rect(first.top.x-9,y+2,last.top.x-first.top.x+18,4,'#8f8d67');}
  for(const [i,c]of columns.entries()){const x=c.top.x,y=c.top.y-8,h=c.foot.y-y;b+=rect(x-12,y,25,h,'#57523b','actual-bearing-post-'+i)+rect(x-9,y+8,5,h-15,'#9b8d67');const lo=x-17,hi=x+17;b+=poly([[lo+3,c.foot.y-16],[hi-3,c.foot.y-16],[hi,actualY(stage,c.foot.terrainId,hi)],[lo,actualY(stage,c.foot.terrainId,lo)]],'#7c8b76');if(!q.closed){const span=Math.min(85,h*.25);b+=poly([[x+8,y+12],[x+span,y+span],[x+span+7,y+span-8],[x+12,y+3]],'#71674a');}}
  if(q.closed)for(let i=1;i<columns.length;i++){const left=columns[i-1],right=columns[i],x=(left.top.x+right.top.x)/2-34,top=Math.max(left.top.y,right.top.y)+58,bottom=Math.min(left.foot.y,right.foot.y)-65;if(bottom-top<115)continue;const y=top+(bottom-top-115)*.42;b+=rect(x,y,69,111,'#6c7355','closed-bearing-shutter-'+i)+rect(x+31,y+2,5,107,'#384b35')+rect(x+3,y+29,63,5,'#9b9670')+rect(x+3,y+82,63,5,'#8a8d67');}
  const left=Math.min(...q.xs)-25,right=Math.max(...q.xs)+103,top=Math.min(...columns.map(c=>c.top.y))-18,bottom=Math.max(...columns.map(c=>c.foot.y))+10,feet=columns.map(c=>c.foot),heads=columns.map(c=>c.top);
  rows.push({asset:pack(q.key,'실제 아래층에 닿는 관아의 '+q.key,b,[left,top,right-left,bottom-top],{kind:'rear-masonry',extra:{kind:'archive-load-frame',groundedSupports:feet,undersideContacts:heads,columns,closedStorage:q.closed,noDeck:true,noProjectileCover:true}}),feet,heads,columns});
 }
 return rows;
}

/** F's architecture stands behind the real diagonal passage. Each rear
 * building is orthogonal: a level Korean roof, upright rooms, a level plinth,
 * and a broad foundation reaching the existing D surface. No windows are
 * painted into the triangular foreground collision. */
function registerRearPavilions(stage){
 const specs=[{key:'west-register-wing',x:792,baseY:2570,width:370,role:'archive',variant:1},{key:'middle-register-wing',x:1005,baseY:2205,width:330,role:'archive',variant:2},{key:'east-register-wing',x:1495,baseY:2410,width:288,role:'storehouse',variant:1}],out=[];
 for(const q of specs){const support='v22-west-gallery',left=q.x-q.width/2-17,right=q.x+q.width/2+17,footXs=[left,(left+right)/2,right],feet=footXs.map(x=>({terrainId:support,x,y:actualY(stage,support,x)})),a=koreanTownBuilding(PREFIX+q.key+'-upper',{width:q.width,role:q.role,roofType:'gable',variant:q.variant,collision:false});
  const ground=feet.map(p=>[p.x,p.y]);let b=poly([[left,q.baseY-7],[right,q.baseY-7],...ground.slice().reverse()],'#52604c','broad-grounded-rectangular-plinth');
  // A broad quiet return face replaces the old long, thin supporting sticks.
  b+=poly([[right-32,q.baseY],[right,q.baseY],[right,actualY(stage,support,right)],[right-32,actualY(stage,support,right-32)]],'#30483d','foundation-east-return');
  b+=rect(left+7,q.baseY+15,right-left-45,14,'#737c60','level-plinth-bearing-course');
  for(const [r,depth]of [44,93,141].entries()){const top=feet.map(p=>[p.x,p.y-depth]),bottom=feet.slice().reverse().map(p=>[p.x,p.y-depth+36]);b+=poly([...top,...bottom],r===1?'#5f725d':'#71816a','low-foundation-course-'+r);}
  // A few large orthogonal joints belong only to the short footing courses.
  for(const [i,x]of [left+(right-left)*.30,left+(right-left)*.66].entries()){const y=actualY(stage,support,x);b+=line([[x,y-138],[x,y-106]],'#324e42',4,'foot-joint-upper-'+i)+line([[x+24,actualY(stage,support,x+24)-90],[x+24,actualY(stage,support,x+24)-55]],'#324e42',4,'foot-joint-lower-'+i);}
  const upper=muted(body(a.vector.source)).replace(/#93947c/g,'#7c856b').replace(/#b0aa87/g,'#969b79').replace(/#73827d/g,'#667b70').replace(/#aa936b/g,'#8f9069');b+=group('level-korean-rear-building',upper,q.x,q.baseY);
  if(q.role==='archive'){const c=koreanArchiveCabinet(PREFIX+q.key+'-records',{width:90,height:113,variant:q.variant});b+=group('closed-record-cabinet',body(c.vector.source),q.x-q.width/2+25,q.baseY-125);}
  const top=q.baseY+a.bounds.y-8,bottom=Math.max(...feet.map(p=>p.y))+4,asset=pack(q.key,'외부 비탈 뒤에 층차를 둔 직교 한옥 기록동',b,[q.x+a.bounds.x-4,top,a.bounds.w+8,bottom-top],{kind:'rear-masonry',extra:{kind:'orthogonal-register-building',roofY:q.baseY-a.params.eaveHeight,floorY:q.baseY,wallOrientation:'vertical',roofOrientation:'horizontal',buildingSource:'koreanTownBuilding gable unchanged',groundedSupports:feet,foundationWidth:right-left,closedStorage:true,noDeck:true,noProjectileCover:true}});
  out.push({asset,feet,record:{key:q.key,x:q.x,floorY:q.baseY,width:q.width,foundationWidth:right-left,footSupport:support,feet,roofOrientation:'horizontal',wallOrientation:'vertical',frontRampTerrain:'v22-register-mass',collision:false}});
 }
 return out;
}

function buildingContact(stage,e,a){const id=e.stage22Support.terrainId,lo=e.x+Math.min(...a.params.footXs)*e.scale,hi=e.x+Math.max(...a.params.footXs)*e.scale,y=e.y,w=hi-lo;if(!Number.isFinite(w)||w<80)return[];const make=(key,ps,fill)=>({terrainId:id,id:e.id+'-'+key,stage22VerticalArt:true,points:ps.map(p=>p.map(N)),fill});return[
 make('wide-foot-shadow',[[lo-5,y+1],[hi+5,y+1],[hi-3,y+14],[lo+8,y+18]],'#1b343f'),make('left-bearing-stone',[[lo+5,y+18],[lo+w*.53,y+16],[lo+w*.51,y+52],[lo+12,y+57]],'#819288'),make('right-bearing-stone',[[lo+w*.56,y+16],[hi-8,y+16],[hi-13,y+49],[lo+w*.54,y+53]],'#627c7a'),make('plinth-dark-foot',[[lo+12,y+57],[hi-13,y+49],[hi-22,y+65],[lo+w*.3,y+74]],'#314e59')];}

export function applyStage22VerticalArt(project){
 const stage=project.stages.find(s=>s.metadata?.stageId===22);if(stage?.initialState?.honroVerticalStage22Revision!==1||!stage.design?.vertical22?.nodes)throw Error('Stage22 art requires authored fresh vertical geometry');
 const unchanged=gameplay(stage),others=JSON.stringify(project.stages.filter(s=>s!==stage));
 stage.elements=stage.elements.filter(e=>!e.id.startsWith(ELEMENT));stage.design.space.scenery=(stage.design.space.scenery||[]).filter(e=>!e.id.startsWith(ELEMENT));stage.design.space.lights=(stage.design.space.lights||[]).filter(e=>!e.id.startsWith(ELEMENT));stage.design.space.terrainPlanes=(stage.design.space.terrainPlanes||[]).filter(e=>!e.stage22VerticalArt);
 const wall=connectedRetainingWalls(stage);register(project,wall.asset);stage.elements.push({id:ELEMENT+'connected-retaining-walls',assetId:wall.asset.id,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back',stage22Supports:wall.feet});
 const materials=masonryPlanes(stage),section=reportArchitecturePlanes(stage);materials.planes=materials.planes.filter(p=>['archive-door','upper-door'].includes(p.terrainId));materials.records=[];const built=builtTerracePlanes(stage);materials.planes.push(...section.planes,...built.planes);materials.records.push(...section.records,...built.records);stage.design.space.terrainPlanes.push(...materials.planes);
 const linked=linkedTerraceFrames(stage);for(const r of linked){register(project,r.asset);stage.elements.push({id:ELEMENT+r.asset.id.slice(PREFIX.length),assetId:r.asset.id,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back',stage22Supports:r.feet});}
 const registerBuildings=registerRearPavilions(stage);for(const r of registerBuildings){register(project,r.asset);stage.elements.push({id:ELEMENT+r.asset.id.slice(PREFIX.length),assetId:r.asset.id,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back',stage22Supports:r.feet});}
 const frame=reportLoadFrame(stage);register(project,frame.asset);stage.elements.push({id:ELEMENT+'report-archive-load-frame',assetId:frame.asset.id,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back',stage22Supports:frame.feet});
 const specs=[
  [archiveBuilding('lower-clerk-office',{width:545,role:'office',roofType:'hip',variant:1,cabinets:false}),'lower-clerk-office','v22-lower-court',680,'A','Initial guardhouse on the broad lower forecourt.'],
  [narrowRecordBay('seal-record-bay',{width:122,variant:0}),'seal-record-bay','v22-lower-court',1200,'A','A compact record bay sits beside the original seal and closed real gate.'],
  [narrowRecordBay('report-record-bay',{width:118,variant:1}),'report-record-bay','v22-report-crossing',1440,'C','One human-sized bay exactly fits the140-wide report ledge; eaves overhang, posts do not.'],
  [archiveBuilding('main-document-archive',{width:535,variant:2}),'main-document-archive','v22-report-crossing',2670,'E','Broad gabled report archive anchored to the actual east return court.'],
  [archiveBuilding('west-open-gallery',{width:410,role:'pavilion',roofType:'gable',variant:1,cabinets:false}),'west-open-gallery','v22-west-gallery',1330,'D','Open rear gallery locates the cross-cover group without adding a platform or projectile cover.'],
  [narrowRecordBay('upper-register-bay',{width:146,variant:0}),'upper-register-bay','v22-register-mass',1220,'F','The narrow register court receives one full-height storage bay rather than a floating wide house.'],
  [archiveBuilding('comparison-hall',{width:700,role:'office',roofType:'hip',variant:3,cabinets:false}),'comparison-hall','v22-comparison-mass',2460,'G','A broad restrained hall backs the original defense and nearby exit; no new terminal walk.'],
  [documentTable(),'comparison-table','v22-comparison-mass',2475,'G','The two original ledgers meet at the unchanged comparison point.']
 ];
 const placed=[];for(const[a,key,support,x,zone,purpose]of specs){const e=place(project,stage,a,key,support,x,{zone,purpose});placed.push(e);stage.design.space.terrainPlanes.push(...buildingContact(stage,e,a));}
 for(const [key,support,x,zone]of [['seal-lamp','v22-lower-court',1010,'A'],['record-lamp','v22-report-crossing',2335,'E'],['gallery-lamp','v22-west-gallery',1048,'D'],['exit-lamp','v22-comparison-mass',2890,'H']]){const a=lantern(),e=place(project,stage,a,key,support,x,{zone,purpose:'Sparse low lamp, smaller than an actor and behind every combat element.'});stage.design.space.lights.push({id:e.id+'-light',x:e.x,y:e.y-96,roomId:'v22-'+zone,kind:'oil',radius:91,color:'#c2ad78',visualOnly:true});}
 for(const [support,xs,key]of [['v22-report-approach',[1167,1220,1435,1650,1743],'lower-return-rail'],['v22-east-register-rise',[1815,1860,2010,2140,2187],'register-rise-rail'],['v22-register-mass',[588,600,840,1040,1130],'optional-west-rail'],['v22-west-gallery',[95,350,530,700,1010],'west-gallery-return-rail'],['v22-comparison-mass',[1514,1560,1740,1880,1990],'comparison-ascent-rail'],['v22-report-crossing',[1510,1640,1780,1835,1890,2030,2160,2300],'continuous-report-passage-rail']]){const r=rearRail(stage,support,xs,key);register(project,r.asset);stage.elements.push({id:ELEMENT+key,assetId:r.asset.id,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back',stage22Supports:r.feet});}
 stage.environment.placements=[];stage.environment.groups=[];stage.environment.surfaces=[];stage.environment.skyVisible=true;stage.environment.atmosphere={preset:'valley',overrides:{skyTop:'#172f39',skyBottom:'#435b5c',hazeStrength:.30,mistStrength:.045,lightStrength:.055}};
 stage.design.vertical22Art={revision:1,iteration:4,registerArchitecture:{foreground:'continuous-external-passage-over-closed-retaining-fill',frontWindows:0,rearBuildings:registerBuildings.map(r=>r.record),thinRegisterFrameRemoved:true,noNewCollision:true},wholeArchitecture:{regions:['A','B','C','D','E','F','G','H'],rampProfiles:built.rampProfiles,columns:linked.flatMap(r=>r.columns),closedRoomSections:built.records,drawnStepCount:0},reportArchitecture:{closedStorageStoreys:2,storyHeight:222,stoneCourseHeight:[32,46],maxStoneWidth:187,rampJoints:section.joints,columns:frame.columns,undersideContacts:frame.heads,noNewCollision:true},status:'authored-awaiting-native-and-independent-review',source:'tools/environment/stage22-vertical-art.mjs',geometrySource:'tools/map-forge/stage22-vertical-geometry.mjs',nativeVectorOnly:true,style:'Korean administrative terraces: cut granite blocks, subdued gable and hip tile roofs, horizontal bound folios, square timber recesses. Upper-left key light, broad rear support shadows.',referenceSources:['tools/environment/korean-town-art.mjs: existing21/22/24 office/archive/cabinet assets','tools/environment/stage16-temple-art.mjs: broad plinth upper/side/shadow planes'],collisionPolicy:'Exact terrain/units/objectives/events/routes/gates unchanged. No scenic collision. Terrain paint is clipped to current solid by the shared renderer.',rearPolicy:'Six actual underside attachments descend to verified lower walking surfaces. No new front walk rim or decorative balcony deck.',terrainAttachments:wall.attachments,namedStoneMasses:materials.records,artAssetIds:[...new Set(stage.elements.filter(e=>e.id.startsWith(ELEMENT)).map(e=>e.assetId))],supports:stage.elements.filter(e=>e.id.startsWith(ELEMENT)).flatMap(e=>(e.stage22Supports||[]).map(p=>({elementId:e.id,...p}))),buildingElements:placed.map(e=>e.id),budgets:{maxNodesPerAsset:180,repeatedNoisePaths:0,decorativeCollisionBodies:0},views:[{id:'report-cross-cover',x:1740,y:3320,z:.55,w:1440,h:960},{id:'lower-seal-court',x:1270,y:5100,z:.57,w:1440,h:960},{id:'register-ascent',x:1580,y:2300,z:.55,w:1440,h:960},{id:'comparison-exit',x:2420,y:1180,z:.65,w:1440,h:960}]};
 if(gameplay(stage)!==unchanged||JSON.stringify(project.stages.filter(s=>s!==stage))!==others)throw Error('Stage22 visual author changed gameplay or another stage');return project;
}
