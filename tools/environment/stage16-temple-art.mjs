import {compileSVG} from './build-act2-art.mjs';

// Stage-local Korean temple architecture. One monumental hall, never a stack
// or repetition of the earlier small shrine. Structural reference:
// https://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=1123309150000
// https://encykorea.aks.ac.kr/Article/E0022722
// All assets are visual-only; authored terrain remains collision truth.
export const STAGE16_ART_PREFIX='stage16:temple-';
const n=v=>Math.round(v*100)/100;
const path=(d,fill,stroke='',width=1,id='')=>`<path${id?` id="${id}"`:''} d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`:''}/>`;
const poly=(points,fill,stroke='',width=1,id='')=>path('M'+points.map(p=>p.map(n).join(' ')).join('L')+'Z',fill,stroke,width,id);
const line=(points,stroke,width=1,id='')=>path('M'+points.map(p=>p.map(n).join(' ')).join('L'),'none',stroke,width,id);
const rect=(x,y,w,h,fill,id='')=>path(`M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}Z`,fill,'',1,id);
const ellipse=(x,y,rx,ry,fill)=>path(`M${n(x-rx)} ${n(y)}a${n(rx)} ${n(ry)} 0 1 0 ${n(rx*2)} 0a${n(rx)} ${n(ry)} 0 1 0 ${n(-rx*2)} 0Z`,fill);
const group=(x,y,sx,sy,body,id='')=>`<g${id?` id="${id}"`:''} transform="matrix(${n(sx)} 0 0 ${n(sy)} ${n(x)} ${n(y)})">${body}</g>`;
const nodeCount=t=>1+(t.children||[]).reduce((sum,v)=>sum+nodeCount(v),0);
const C={ink:'#111f28',deep:'#142630',shadow:'#1b3038',wood:'#62483f',woodLit:'#936c50',woodEdge:'#b1936a',woodDark:'#3f3632',red:'#805042',teal:'#3c6159',tealLit:'#628378',stone:'#627378',stoneLit:'#95a09a',stoneDark:'#344a56',roof:'#344b58',roofLit:'#59717c',roofDark:'#182e3b',gold:'#b6a078'};
function makeAsset(key,name,body,bounds,{role='architecture',category='architecture',extra={}}={}){
 const vector=compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.map(n).join(' ')}"><title>${name}</title>${body}</svg>`),count=nodeCount(vector.root);
 if(count>420)throw Error(`Stage 16 vector node budget exceeded: ${key} (${count})`);
 const [x,y,w,h]=bounds;
 return{id:STAGE16_ART_PREFIX+key,name,category,environmentRole:role,visual:[],vector,collision:[],anchor:{x:0,y:0},sockets:[],tags:['stage16-temple','visual-only','editable-native-vector'],params:{artRevision:3,collisionSource:'authored-stage-terrain',nodeCount:count,...extra},bounds:{x,y,w,h},reference:{heightM:h/60,bounds:{x,y,w,h},foot:{x:0,y:0},scaleRange:[.35,4],backgroundRange:[.35,4]}};
}

function hallRoof({width=3000,rise=420,ridge=1700,y=0,upper=false}={}){
 const e=width/2,r=ridge/2;
 let b=path(`M${-e} ${y+rise-50}Q${n(-e+125)} ${n(y+rise+6)} ${n(-e+300)} ${n(y+rise-35)}Q${n(-r-160)} ${n(y+rise*.52)} ${-r} ${y}L${r} ${y}Q${n(r+155)} ${n(y+rise*.54)} ${n(e-300)} ${n(y+rise-35)}Q${n(e-118)} ${n(y+rise+10)} ${e} ${y+rise-50}L${e-28} ${y+rise+26}Q${n(e-190)} ${n(y+rise+65)} ${n(e-353)} ${n(y+rise+30)}L${n(-e+338)} ${n(y+rise+30)}Q${n(-e+183)} ${n(y+rise+67)} ${-e+24} ${y+rise+25}Z`,C.roofDark,C.ink,11,'roof-volume');
 b+=path(`M${-e+18} ${y+rise-48}Q${-e+172} ${y+rise+1} ${-e+312} ${y+rise-49}Q${-r-152} ${n(y+rise*.52)} ${-r} ${y+7}L${r} ${y+7}Q${r+147} ${n(y+rise*.53)} ${e-314} ${y+rise-49}Q${e-166} ${y+rise-3} ${e-20} ${y+rise-49}L${e-44} ${y+rise-18}Q${e-208} ${y+rise+40} ${e-358} ${y+rise+3}L${-e+342} ${y+rise+3}Q${-e+172} ${y+rise+34} ${-e+20} ${y+rise-21}Z`,'url(#roof-face)','',1,'broad-grey-tile-plane');
 b+=path(`M${-r} ${y+12}L${n(r*.55)} ${y+12}Q${n(r*.75)} ${n(y+rise*.54)} ${n(r*.89)} ${y+rise-1}L${-e+352} ${y+rise-1}Q${-r-159} ${n(y+rise*.55)} ${-r} ${y+12}Z`,C.roofLit,'',1,'single-moon-facing-roof-plane');
 b+=path(`M${r} ${y+10}Q${r+150} ${n(y+rise*.56)} ${e-315} ${y+rise-46}Q${e-146} ${y+rise} ${e-20} ${y+rise-49}L${e-45} ${y+rise-17}Q${e-192} ${y+rise+37} ${e-357} ${y+rise+3}L${r-74} ${y+rise+3}Q${r+32} ${n(y+rise*.52)} ${r} ${y+10}Z`,C.roof,'',1,'right-hip-shadow');
 b+=path(`M${-e+7} ${y+rise-39}Q${-e+159} ${y+rise+28} ${-e+342} ${y+rise-5}L${e-352} ${y+rise-5}Q${e-171} ${y+rise+32} ${e-9} ${y+rise-39}`,'none','#899995',9,'continuous-eave-edge');
 b+=path(`M${-e+27} ${y+rise+18}Q${-e+167} ${y+rise+55} ${-e+339} ${y+rise+23}L${e-354} ${y+rise+23}Q${e-179} ${y+rise+62} ${e-29} ${y+rise+18}`,'none','#3c6564',12,'painted-double-eave');
 b+=path(`M${-r-25} ${y-4}Q${-r+25} ${y+8} ${-r+84} ${y+5}L${r-76} ${y+5}Q${r-24} ${y+7} ${r+26} ${y-6}L${r+21} ${y+16}L${-r-20} ${y+16}Z`,'#91a4a8',C.roofDark,4,'long-low-ridge-cap');
 let seams='';for(const f of [-.76,-.53,-.28,0,.28,.53,.77]){const a=r*f,z=(e-355)*f;seams+=`M${n(a)} ${y+27}Q${n(a+(z-a)*.31)} ${n(y+rise*.49)} ${n(z)} ${y+rise-15}`;}
 b+=path(seams,'none',upper?'#667d83':'#526a72',5,'sparse-tile-flow');
 b+=path(`M${n(-r*.94)} ${y+46}Q${n(-r*.51)} ${y+rise*.28} ${n(r*.18)} ${y+rise*.18}Q${n(r*.52)} ${y+rise*.36} ${n(r*.72)} ${y+rise*.61}Q${n(r*.07)} ${y+rise*.54} ${n(-r*.4)} ${y+rise*.71}Q${n(-r*.8)} ${y+rise*.75} ${n(-e+391)} ${y+rise-23}Q${n(-r-51)} ${y+rise*.49} ${n(-r*.94)} ${y+46}Z`,'#162f3a33','',1,'broad-aged-tile-wash');
 b+=path(`M${n(-r*.68)} ${y+rise*.32}Q${n(-r*.2)} ${y+rise*.47} ${n(r*.33)} ${y+rise*.34}M${n(-r*.82)} ${y+rise*.70}Q${n(-r*.08)} ${y+rise*.61} ${n(r*.68)} ${y+rise*.78}`,'none','#9aacaa20',14,'broad-tile-course-catchlight');
 b+=path(`M${-r+13} ${y+33}Q${-r-153} ${n(y+rise*.64)} ${-e+327} ${y+rise-15}M${r-13} ${y+33}Q${r+152} ${n(y+rise*.65)} ${e-327} ${y+rise-15}`,'none','#91a09f',8,'hip-ridge-spines');
 return b;
}

function column(x,top,bottom,w=63,{dim=false}={}){
 let b=path(`M${n(x-w*.39)} ${top}Q${n(x-w*.57)} ${n(top+(bottom-top)*.48)} ${n(x-w*.48)} ${bottom}L${n(x+w*.48)} ${bottom}Q${n(x+w*.53)} ${n(top+(bottom-top)*.45)} ${n(x+w*.39)} ${top}Z`,dim?C.woodDark:C.wood,C.ink,5);
 b+=path(`M${n(x-w*.33)} ${top+5}Q${n(x-w*.45)} ${n(top+(bottom-top)*.48)} ${n(x-w*.38)} ${bottom-5}L${n(x-w*.12)} ${bottom-5}Q${n(x-w*.19)} ${n(top+(bottom-top)*.48)} ${n(x-w*.09)} ${top+5}Z`,dim?'#685b46':C.woodLit);
 b+=path(`M${n(x-w*.78)} ${bottom-7}Q${x} ${bottom-22} ${n(x+w*.77)} ${bottom-7}L${n(x+w*.85)} ${bottom+13}L${n(x-w*.84)} ${bottom+13}Z`,C.stoneDark);
 b+=path(`M${n(x-w*.76)} ${bottom-8}Q${x} ${bottom-21} ${n(x+w*.75)} ${bottom-8}L${n(x+w*.62)} ${bottom}L${n(x-w*.64)} ${bottom}Z`,C.stoneLit);
 return b;
}
function bracket(x,y,s=1){return group(x,y,s,s,path('M-72-10H72V6H48L41 22H25V40H-25V22H-41L-48 6H-72Z',C.red,C.ink,3)+path('M-90-25Q-72-7-50-14L-30-21H30L50-14Q72-7 90-25L78-2L49 7H-49L-78-2Z',C.tealLit)+path('M-60 6H60L43 19H24V30H-24V19H-43Z',C.teal)+path('M-19-19H19V25H-19Z',C.gold)+line([[-58,-12],[-33,-8],[33,-8],[58,-12]],'#98a089',4));}
function latticeBay(x,y,w,h,{warm=false,open=false}={}){
 let b=rect(x,y,w,h,open?C.deep:C.woodDark);
 if(open){b+=rect(x+10,y+12,w-20,h-18,'url(#hall-recess)');return b;}
 b+=rect(x+13,y+17,w-26,h-31,warm?'#8f805a':'#647469');b+=rect(x+25,y+28,w-50,h-55,warm?'#b4a375':'#7c8978');
 let d='';for(const f of [.23,.5,.77])d+=`M${n(x+w*f)} ${y+18}V${y+h-17}`;for(const f of [.27,.55,.79])d+=`M${x+14} ${n(y+h*f)}H${x+w-14}`;
 b+=path(d,'none',C.woodDark,13);b+=line([[x+w*.5,y+16],[x+w*.5,y+h-16]],C.woodLit,5);return b;
}

function altarInterior(){
 let b='<defs><radialGradient id="altar-light" cx="0" cy="-402" r="365" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#af8d52" stop-opacity=".29"/><stop offset=".54" stop-color="#806443" stop-opacity=".13"/><stop offset="1" stop-color="#19303a" stop-opacity="0"/></radialGradient></defs>';
 b+=ellipse(0,-408,380,276,'url(#altar-light)');b+=path('M-335-622H337L308-594H-308Z','#34453d');b+=path('M-295-593V-263H-275V-593Z M275-593V-263H295V-593Z','#534f3e');
 b+=ellipse(0,-474,113,154,'#5e5c3d');b+=ellipse(0,-474,99,142,'#4d523b');b+=path('M-45-529Q-38-568 0-570Q37-568 44-529L37-489Q28-471 0-472Q-28-471-37-489Z','#948665');b+=path('M-33-549Q-30-585 0-587Q29-583 33-549L22-535H-22Z','#414941');
 b+=path('M-38-485Q-93-468-103-420L-127-338Q-164-305-194-287L-171-259H167L196-286Q162-309 125-338L99-421Q86-468 36-485Q9-460-38-485Z','#877b59');b+=path('M-38-477Q-76-458-79-410L-106-337L-43-304L16-321L-27-362L-12-448Z','#a18f66');b+=path('M38-477Q88-450 92-403L118-342L53-318L8-336L43-367L28-434Z','#5b6045');
 b+=path('M-108-337Q-51-319 1-329Q70-347 114-335L132-309Q56-295-11-303L-127-308Z','#a6956c');b+=path('M-169-279Q-83-304-5-289Q86-304 172-280L146-252H-146Z','#676c4c');b+=path('M-248-253H248L270-232H-273Z','#8c8561');b+=rect(-257,-231,514,27,'#4e5846');
 for(const [x,y]of [[-348,-310],[325,-327]]){b+=path(`M${x-17} ${y+82}L${x-10} ${y+20}H${x+10}L${x+17} ${y+82}Z`,'#675e42');b+=path(`M${x-34} ${y+14}Q${x} ${y+42} ${x+34} ${y+14}Z`,'#afa16f');b+=path(`M${x} ${y-22}Q${x-14} ${y} ${x-5} ${y+10}Q${x+13} ${y+13} ${x+10} ${y-2}Z`,'#d2b270');}return b;
}

export function createStage16GreatHall(){
 const defs='<defs><linearGradient id="roof-face" x1="0" y1="-1620" x2="0" y2="-620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#768b91"/><stop offset="1" stop-color="#294650"/></linearGradient><linearGradient id="hall-recess" x1="0" y1="-880" x2="0" y2="-150" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#13232d"/><stop offset="1" stop-color="#304139"/></linearGradient><linearGradient id="aged-wall" x1="-1200" y1="-900" x2="1200" y2="-150" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#6b7867"/><stop offset=".62" stop-color="#4b6057"/><stop offset="1" stop-color="#293f44"/></linearGradient></defs>';
 let b=defs;
 b+=path('M-1280-175H1265L1335-40H-1350Z',C.stoneDark,C.ink,7,'stone-plinth-volume');b+=path('M-1280-175H1265L1290-148H-1304Z',C.stoneLit,'',1,'upper-plinth-light');b+=path('M-1304-148H1290L1302-77H-1320Z',C.stone);b+=path('M-1333-76H1320L1353-27H-1366Z','#71817e');b+=path('M-1366-27H1353L1370-2H-1380Z',C.stoneDark);
 b+=path('M-1130-145V-82M-850-145V-82M-513-145V-82M-207-145V-82M205-145V-82M510-145V-82M847-145V-82M1130-145V-82','none','#43575e',5,'few-large-foundation-joints');
 b+=path('M-205-146H205V-111H226V-77H248V-42H272V-8H-272V-42H-248V-77H-226V-111H-205Z','#8c9990');b+=path('M-222-112H222M-244-78H244M-268-43H268','none',C.stoneDark,8);
 b+=rect(-1176,-790,2352,608,'url(#aged-wall)','lower-seven-bay-facade');b+=poly([[1032,-790],[1220,-746],[1233,-185],[1032,-185]],'#253c3f');const xs=[-1137,-813,-490,-165,165,490,813,1137];
 b+=rect(-1030,-700,2040,515,'url(#hall-recess)','single-deep-interior');for(const i of [0,1,5,6]){const x=xs[i]+47,w=xs[i+1]-xs[i]-94;b+=latticeBay(x,-643,w,432,{warm:i===1,open:i===5});}b+=altarInterior();
 for(const x of xs)b+=column(x,-723,-198,89);b+=rect(-1210,-773,2420,83,C.ink,'deep-eave-shadow');b+=rect(-1203,-733,2406,64,C.woodDark,'lower-structural-crossbeam');b+=rect(-1197,-725,2394,20,C.red);b+=rect(-1197,-682,2394,13,C.teal);for(const x of xs)b+=bracket(x,-710,1.18);for(const x of [-970,-650,-327,0,327,650,970])b+=bracket(x,-721,.76);
 b+=group(0,0,1,1,hallRoof({width:3020,rise:242,ridge:1990,y:-1008}),'lower-wide-eaved-roof');b+=path('M-1045-1320H1045L1071-1009H-1071Z','url(#aged-wall)','',1,'upper-hall-body');
 for(const [i,x]of [-924,-615,-308,0,308,615,924].entries())b+=latticeBay(x-107,-1169,214,141,{warm:i===1,open:i>1&&i<6});
 for(const x of [-1052,-769,-461,-154,154,461,769,1052])b+=column(x,-1225,-1012,65,{dim:true});b+=rect(-1090,-1280,2180,80,C.ink);b+=rect(-1084,-1235,2168,18,C.teal);for(const x of [-1042,-758,-455,-151,151,455,758,1042])b+=bracket(x,-1219,.93);
 b+=group(0,0,1,1,hallRoof({width:2800,rise:390,ridge:1540,y:-1676,upper:true}),'upper-hip-and-gable-roof');b+=poly([[-224,-758],[223,-758],[216,-653],[-216,-653]],C.woodDark,C.woodLit,10,'aged-unlettered-hall-board');b+=line([[-180,-734],[179,-734]],C.gold,6);b+=line([[-177,-678],[177,-678]],'#6b6d54',4);b+=path('M-1208-188H-274L-285-166H-1241Z M275-188H1199L1233-166H286Z',C.ink);
 return makeAsset('great-hall','잠운사 대법당: 넓은 겹처마와 일곱 칸 중층 전각',b,[-1535,-1710,3070,1730],{extra:{koreanType:'monumental-two-storey-buddhist-hall',bayCount:7,roofStoreys:2,monumental:true}});
}
export function createStage16StoneLamp(){
 let b=path('M-83-10L-64-36H58L86-8L67 0H-68Z',C.stoneDark,C.ink,5)+path('M-63-36H57L68-22H-76Z',C.stoneLit);b+=path('M-35-35L-28-116H25L35-35Z',C.stone,C.ink,5)+path('M-28-108H-10L-10-38H-33Z',C.stoneLit);b+=path('M-57-125L-41-147H41L58-125L43-113H-43Z',C.stoneLit,C.stoneDark,4);b+=path('M-42-149L-37-221H37L42-149Z',C.stoneDark,C.ink,5)+rect(-22,-210,44,54,'#b2a575')+rect(-9,-204,18,38,'#ddc48a');b+=path('M-77-221Q-44-220-25-246H24Q46-220 78-224L67-207H-66Z',C.roof,C.ink,5)+path('M-70-221Q-39-219-24-240H22Q43-220 70-224','none',C.stoneLit,5);b+=ellipse(0,-247,12,10,C.stoneDark);
 return makeAsset('stone-lamp','불빛을 낮게 품은 잠운사 석등',b,[-90,-265,180,272],{extra:{lightAnchor:{x:0,y:-183}}});
}
export function createStage16TempleAssets(){return{greatHall:createStage16GreatHall(),stoneLamp:createStage16StoneLamp()};}

function add(project,st,asset,key,x=0,y=0,extra={}){const ai=project.library.findIndex(v=>v.id===asset.id);if(ai<0)project.library.push(asset);else project.library[ai]=asset;const e={id:'s16-art-'+key,assetId:asset.id,x,y,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back',...extra};st.elements.push(e);return e;}
function walkEdges(st,t){const ids=t.properties?.honroWalkEdges||st.design?.space?.surfaces?.find(s=>s.terrainId===t.id)?.edgeIndices||[];return ids.map(i=>[t.points[i],t.points[(i+1)%t.points.length]]).filter(([a,z])=>a&&z&&Math.abs(z.x-a.x)>.01);}
function surfaceAt(st,t,x){for(const[a,z]of walkEdges(st,t))if(x>=Math.min(a.x,z.x)-.01&&x<=Math.max(a.x,z.x)+.01)return a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x);if(t.id==='act2-floor'){const ys=[];for(let i=0;i<t.points.length;i++){const a=t.points[i],z=t.points[(i+1)%t.points.length];if(Math.abs(z.x-a.x)>.01&&x>=Math.min(a.x,z.x)&&x<=Math.max(a.x,z.x))ys.push(a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x));}return ys.length?Math.min(...ys):null;}return null;}
function placeOn(project,st,asset,key,spec){const t=st.terrains.find(t=>t.id===spec.terrainId);if(!t)throw Error(`Stage 16 art ${key} needs ${spec.terrainId}`);const y=surfaceAt(st,t,spec.x);if(y===null)throw Error(`Stage 16 art ${key} has no actual surface at ${spec.x}`);return add(project,st,asset,key,spec.x,y,{scale:spec.scale??1,stage16Support:{terrainId:t.id,x:spec.x,y}});}
function extent(t){const xs=t.points.map(p=>p.x),ys=t.points.map(p=>p.y);return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};}
function softPoints(points,bend=.16){const out=[];for(let i=0;i<points.length;i++){const p=points[i],a=points[(i+points.length-1)%points.length],z=points[(i+1)%points.length],u=[p[0]+(a[0]-p[0])*bend,p[1]+(a[1]-p[1])*bend],v=[p[0]+(z[0]-p[0])*bend,p[1]+(z[1]-p[1])*bend];out.push(u);for(const f of [.25,.5,.75,1])out.push([(1-f)**2*u[0]+2*(1-f)*f*p[0]+f*f*v[0],(1-f)**2*u[1]+2*(1-f)*f*p[1]+f*f*v[1]]);}return out;}
function boundaryAt(t,x,ceiling=false){const hits=[];for(let i=0;i<t.points.length;i++){const a=t.points[i],z=t.points[(i+1)%t.points.length];if(Math.abs(z.x-a.x)>.01&&x>=Math.min(a.x,z.x)-.01&&x<=Math.max(a.x,z.x)+.01)hits.push(a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x));}if(!hits.length)throw Error(`No Stage 16 cavern boundary at ${x}`);return ceiling?Math.max(...hits):Math.min(...hits);}

function rearTempleCavern(st){
 const roof=st.terrains.find(t=>t.id==='cave-roof'),floor=st.terrains.find(t=>t.id==='act2-floor'),roofBox=extent(roof),floorBox=extent(floor),left=Math.max(roofBox.x,floorBox.x),right=Math.min(roofBox.x+roofBox.w,floorBox.x+floorBox.w);
 // Derive the rear wash from the full authored domain, not Play Bounds. This
 // removes the old 0/11000 vertical crop in wide and portrait camera sweeps.
 const xs=[...new Set([left,right,...roof.points.map(p=>p.x),...floor.points.map(p=>p.x),0,1100,1800,2100,2800,3300,4600,5700,6100,7300,8150,8750,9500,11000])].filter(x=>x>=left&&x<=right).sort((a,z)=>a-z);
 const up=xs.map(x=>[x,boundaryAt(roof,x,true)-20]),down=xs.slice().reverse().map(x=>[x,boundaryAt(floor,x)+35]);
 let b='<defs><linearGradient id="temple-depth" x1="5500" y1="1450" x2="5600" y2="6000" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#12252f"/><stop offset=".47" stop-color="#203742"/><stop offset="1" stop-color="#172e39"/></linearGradient><linearGradient id="high-cavern-shaft" x1="6020" y1="1330" x2="4950" y2="4180" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#a5b6b0" stop-opacity=".15"/><stop offset=".48" stop-color="#a5b6b0" stop-opacity=".06"/><stop offset="1" stop-color="#a5b6b0" stop-opacity="0"/></linearGradient><linearGradient id="rear-court-mist" x1="0" y1="3600" x2="0" y2="4440" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#708b88" stop-opacity="0"/><stop offset=".7" stop-color="#708b88" stop-opacity=".10"/><stop offset="1" stop-color="#708b88" stop-opacity="0"/></linearGradient></defs>';
 b+=poly([...up,...down],'url(#temple-depth)');
 b+=path('M1330 3550Q2200 3170 3110 2290Q3450 2560 3660 2870Q3280 3240 3220 3570L2980 4160Q2630 4610 2360 4990L1880 5260Q1840 4610 2050 4100Z','#2b424b');
 b+=path('M3300 2210Q3950 1690 4600 1400L4890 1610Q4530 2200 4440 2870Q4580 3430 4210 3960L3920 4440L3580 4350Q3900 3630 3710 3090Q3880 2590 3300 2210Z','#253c46');
 b+=path('M6300 1370Q6820 1340 7280 1640Q7550 2130 7850 2320L8080 3150Q7780 3490 7890 4130L8170 4760L7910 5230Q7480 4750 7310 4130Q7500 3510 7270 3010L7040 2550Q7020 1980 6300 1370Z','#2e4650');
 b+=path('M6900 1730Q7260 2150 7310 2640Q7580 3080 7570 3450L7350 4110L7530 4740L7770 5070L7960 5030Q7620 4340 7820 3810Q7650 3320 7810 2960Q7490 2440 7550 2240Z','#192f3b');
 b+=path('M8320 2420Q8700 2890 9180 3010L9570 3370Q9350 3700 9420 4090L9840 4570L10440 4810L10470 4930L9200 4840Q8980 4390 8730 4160L8700 3400Z','#293f48');
 b+=path('M2330 3790Q2570 3820 2700 3650L3150 3450L3770 3450L3990 3650Q4130 3770 4380 3740L4290 3820H2390Z','#304852');b+=path('M2470 3814H4220V4170H2470Z','#243c46');
 b+=path('M2550 3810H2585V4170H2550Z M2910 3790H2948V4170H2910Z M3280 3790H3318V4170H3280Z M3670 3790H3705V4170H3670Z M4090 3810H4127V4170H4090Z','#354d54');
 b+=path('M2410 4180H4280L4300 4250H2390Z','#324950');b+=path('M2920 4250H3040V4290H3130V4330H3220V4370H3320V4410H3440V4450H3510V4520H2830Z','#2c454d');b+=path('M2800 3900H2870V3970H2800Z M3750 3880H3800V3940H3750Z','#93896638');
 b+=path('M7130 3390L7380 3230H8140Q8290 3430 8570 3430L8500 3490H7100Z','#3a5159');b+=path('M7240 3480H8380V3870H7240Z','#243b44');
 b+=path('M7290 3480H7335V3870H7290Z M7630 3480H7670V3870H7630Z M7980 3480H8022V3870H7980Z M8310 3480H8356V3870H8310Z','#3c555a');b+=path('M7110 3860H8500L8700 3930L8930 4150L8890 4240L8630 4010H7110Z','#324b52');b+=path('M7390 3560H7460V3670H7390Z M8050 3560H8120V3670H8050Z','#c2a56d28');
 b+=path('M7210 3870L7130 4240L7310 4390L7450 4240L7390 3870Z M8310 3890L8230 4500L8420 4660L8590 4420L8490 3930Z','#263f49');
 b+=path('M7910 3910H8050V3970H8130V4030H8210V4090H8290V4150H8370V4210H8450V4270H8530V4340H8610V4410H8690V4490H8780V4560H8870V4630H9010L9010 4710H8910L7890 4020Z','#354e53');
 b+=path('M4330 3240Q4640 2920 4900 2780L5210 2980L5700 2800Q6240 2820 6600 3170L7030 3370L6980 4210L6680 4420H4510Z','#1b333e');
 b+=path('M2600 3850Q4050 3710 5100 3900T8530 3930L8650 4430H2480Z','url(#rear-court-mist)');b+=path('M5960 1330L6180 1320L5470 4110Q5250 4260 4810 4270Z','url(#high-cavern-shaft)');b+=path('M6300 1370L6370 1380L6020 3690L5780 3940Z','url(#high-cavern-shaft)');for(const[x,y,r]of [[5820,2270,7],[5570,2730,5],[5740,2900,4],[5310,3300,6],[5920,1790,4]])b+=ellipse(x,y,r,r*1.3,'#b8c4b81c');
 return makeAsset('rear-cavern-courts','암벽 안쪽 세 깊이로 물러난 잠운사 전각과 돌계단',b,[left-25,Math.min(...up.map(p=>p[1]))-25,right-left+50,Math.max(...down.map(p=>p[1]))-Math.min(...up.map(p=>p[1]))+50],{category:'terrain',role:'mountain',extra:{depthLevels:3,coverageSource:'full-authored-terrain-domain'}});
}
function timberBeam(a,z,width=44,lit=true){const dx=z.x-a.x,dy=z.y-a.y,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len,p=(v,d)=>[a.x+dx*v+nx*d,a.y+dy*v+ny*d];return poly([p(0,0),p(1,0),p(1,width),p(0,width)],C.woodDark,C.ink,5)+poly([p(0,4),p(1,4),p(1,15),p(0,15)],lit?C.woodLit:C.wood)+line([p(.01,width-9),p(.99,width-9)],C.teal,8);}
function supportBelow(st,x,y){const hits=st.terrains.filter(t=>!t.oneWay&&!t.properties?.honroCeiling&&t.properties?.honroSurfaceRole!=='wall').map(t=>({terrainId:t.id,y:surfaceAt(st,t,x)})).filter(p=>p.y!==null&&p.y>=y-1).sort((a,z)=>a.y-z.y);if(!hits.length)throw Error(`Stage 16 gallery has no physical support at ${x}/${y}`);return hits[0];}
function galleryFrame(st,{key,name,terrainIds,postXs,covered=false}){
 const ts=terrainIds.map(id=>st.terrains.find(t=>t.id===id));if(ts.some(t=>!t))throw Error('Missing Stage 16 gallery terrain: '+key);
 const edges=ts.flatMap(t=>walkEdges(st,t)),ps=edges.flat(),left=Math.min(...ps.map(p=>p.x)),right=Math.max(...ps.map(p=>p.x)),top=Math.min(...ps.map(p=>p.y));
 const feet=postXs.map(x=>{const ys=ts.map(t=>surfaceAt(st,t,x)).filter(y=>y!==null);if(!ys.length)throw Error(`Stage 16 gallery post misses all decks: ${key}/${x}`);const y=Math.min(...ys);return{x,top:y,...supportBelow(st,x,Math.max(...ys)+1)};});let b='';
 for(const p of feet){if(p.y-p.top<90)continue;b+=column(p.x,p.top+(covered?-320:30),p.y-9,69,{dim:true});if(covered)b+=bracket(p.x,p.top-324,.65);}
 for(const[a,z]of edges)b+=timberBeam({x:a.x,y:a.y+17},{x:z.x,y:z.y+17},57);
 for(const[i,t]of ts.entries())for(const[a,z]of walkEdges(st,t)){if(Math.abs(z.x-a.x)<240)continue;b+=line([[a.x+8,a.y-64],[z.x-8,z.y-64]],'#766e55',12);if(i===0||i===ts.length-1)for(const f of [.16,.62,.9]){const x=a.x+(z.x-a.x)*f,y=a.y+(z.y-a.y)*f;b+=line([[x,y-7],[x,y-66]],'#5c6150',16);}}
 if(covered){const upper=walkEdges(st,ts[0]),r=upper.map(([a])=>[a.x,a.y-353]);r.push([upper.at(-1)[1].x,upper.at(-1)[1].y-353]);const l=r[0],z=r.at(-1);b+=path(`M${l[0]-105} ${l[1]-15}Q${l[0]-30} ${l[1]+5} ${l[0]+60} ${l[1]-56}L${z[0]-95} ${z[1]-60}Q${z[0]+2} ${z[1]-12} ${z[0]+82} ${z[1]-32}L${z[0]+68} ${z[1]+9}L${l[0]-92} ${l[1]+27}Z`,C.roofDark,C.ink,6);b+=path(`M${l[0]-95} ${l[1]-12}Q${l[0]-20} ${l[1]+5} ${l[0]+61} ${l[1]-47}L${z[0]-97} ${z[1]-51}Q${z[0]+7} ${z[1]-6} ${z[0]+77} ${z[1]-29}L${z[0]+64} ${z[1]-4}L${l[0]-85} ${l[1]+11}Z`,C.roofLit);b+=line([[l[0]-91,l[1]+13],[z[0]+64,z[1]-2]],'#7e9693',6);}
 const bottom=Math.max(...feet.map(p=>p.y),...ps.map(p=>p.y));return{asset:makeAsset(key,name,b,[left-145,top-(covered?460:95),right-left+290,bottom-top+(covered?495:130)]),supports:feet,terrainIds};
}
function templeStoneFaces(st){
 const planes=st.design.space.terrainPlanes||(st.design.space.terrainPlanes=[]),put=(t,points,fill)=>planes.push({terrainId:t.id,stage16Art:true,points:points.map(p=>p.map(n)),fill}),band=(t,x,y,w,h,fill)=>put(t,[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],fill);
 for(const t of st.terrains){
  if(t.baseMaterial==='wood'||t.breakable||!['act2-floor','cave-roof'].includes(t.id)&&!t.id.startsWith('tm-'))continue;const q=extent(t),roof=!!t.properties?.honroCeiling;put(t,t.points.map(p=>[p.x,p.y]),roof?'#243b47':'#425b62');
  if(['act2-floor','cave-roof'].includes(t.id)){
   // Full terrain-domain range avoids the play-bounds rectangular color seam.
   const xs=[...new Set(t.points.map(p=>p.x))].sort((a,z)=>a-z),rim=xs.map(x=>[x,boundaryAt(t,x,roof)]),sgn=roof?-1:1;
   put(t,softPoints([...rim,...rim.slice().reverse().map(([x,y])=>[x,y+sgn*(650+170*Math.sin(x*.0007))])],.14),roof?'#2d4651':'#465f63');put(t,softPoints(rim.slice().reverse().map(([x,y])=>[x,y+sgn*(1220+170*Math.cos(x*.0005))]).concat(rim.map(([x,y])=>[x,y+sgn*(660+170*Math.sin(x*.0007))])),.19),roof?'#243e4a':'#395660');
   if(!roof){
    put(t,softPoints([[-1200,5390],[1700,5430],[2920,5400],[4090,5850],[4830,5960],[4200,6360],[2910,6580],[980,6220],[-1100,6390]],.23),'#536967');
    put(t,softPoints([[3650,5840],[5050,5880],[6590,5920],[7620,5710],[7490,6120],[6880,6310],[6130,6260],[5300,6510],[4580,6490]],.24),'#4e6465');
    put(t,softPoints([[7970,5640],[8790,4830],[10190,4700],[12500,4760],[12400,5520],[10410,5460],[9180,5300],[8530,5800]],.22),'#4d6364');
    put(t,softPoints([[1200,6250],[2810,6570],[4200,6370],[4640,6510],[3600,6760],[2500,6770]],.21),'#2d4b58');
   }continue;
  }
  if(t.id==='tm-great-hall-plinth'){
   band(t,4530,4270,2930,92,'#7a8984');band(t,4510,4375,2990,120,'#617877');band(t,4520,4510,2990,84,'#768a83');
   for(const[x,y,w,h]of [[4800,4620,660,160],[4870,4798,530,171],[5000,4988,442,178],[6750,4615,620,175],[6820,4808,580,167],[6890,4994,340,165]])band(t,x,y,w,h,'#6d827d');for(const[x,y,h]of [[4930,4270,91],[5480,4270,91],[6230,4270,91],[6900,4270,91],[5180,4375,119],[5925,4375,119],[6680,4375,119]])band(t,x,y,13,h,'#384f59');
   const inner=[[5500,5170],[5740,4670],[6100,4580],[6450,4630],[6740,5050]];for(let i=0;i<inner.length-1;i++){const a=inner[i],z=inner[i+1],dx=z[0]-a[0],dy=z[1]-a[1],len=Math.hypot(dx,dy),nx=dy/len,ny=-dx/len;for(let j=0;j<2;j++){const f0=j/2+.018,f1=(j+1)/2-.018,p=f=>[a[0]+dx*f,a[1]+dy*f],aa=p(f0),zz=p(f1);put(t,[aa,zz,[zz[0]+nx*135,zz[1]+ny*135],[aa[0]+nx*135,aa[1]+ny*135]],(i+j)%2?'#90a095':'#718a83');put(t,[aa,zz,[zz[0]+nx*14,zz[1]+ny*14],[aa[0]+nx*14,aa[1]+ny*14]],'#a5b2a3');}}
   put(t,softPoints([[4850,4265],[5190,4265],[5130,4440],[5250,4610],[5200,4890],[5050,5050],[5000,4810],[5020,4550],[4910,4430]],.2),'#405d644d');put(t,softPoints([[6430,4290],[7060,4290],[7220,4400],[7130,4530],[6780,4580],[6600,4480],[6360,4430]],.24),'#a4b4a329');put(t,softPoints([[6990,4690],[7300,4670],[7260,4930],[7180,5100],[6990,5070],[7060,4870]],.2),'#2948534d');
   put(t,[[4720,4510],[4875,4660],[5020,5180],[4710,4990]],'#344f59');put(t,[[7310,4490],[7420,4710],[7230,5140],[7060,5140],[7190,4810]],'#334f5a');
  }else if(['tm-processional-stair','tm-processional-bridge','tm-processional-upper','tm-east-stone-stair'].includes(t.id)){
   for(const[a,z]of walkEdges(st,t)){put(t,[[a.x,a.y+18],[z.x,z.y+18],[z.x,z.y+98],[a.x,a.y+98]],'#86938b');put(t,[[a.x,a.y+115],[z.x,z.y+115],[z.x,z.y+232],[a.x,a.y+232]],'#687e7b');}put(t,[[q.x,q.y+q.h*.7],[q.x+q.w*.7,q.y+q.h*.45],[q.x+q.w,q.y+q.h*.58],[q.x+q.w,q.y+q.h],[q.x,q.y+q.h]],'#304c58');
  }else{put(t,[[q.x,q.y],[q.x+q.w*.68,q.y],[q.x+q.w*.45,q.y+q.h*.62],[q.x,q.y+q.h*.81]],roof?'#3a535b':'#71867f');put(t,[[q.x+q.w*.68,q.y],[q.x+q.w,q.y],[q.x+q.w,q.y+q.h],[q.x+q.w*.25,q.y+q.h],[q.x+q.w*.45,q.y+q.h*.62]],'#2d4a56');}
 }
}
export function applyStage16TempleArt(project){
 const st=project.stages.find(s=>s.metadata?.stageId===16);if(!st)throw Error('Stage 16 missing');const art=st.design?.temple?.art;if(!art?.hall)throw Error('Stage 16 temple art needs the authored hall support');
 st.elements=st.elements.filter(e=>!e.id.startsWith('s16-art-'));project.library=project.library.filter(a=>!a.id.startsWith(STAGE16_ART_PREFIX));st.design.space.terrainPlanes=(st.design.space.terrainPlanes||[]).filter(p=>!p.stage16Art);st.design.space.rockCompositions=[];if(st.environment)st.environment.placements=(st.environment.placements||[]).filter(p=>p.assetId!=='env:cliff');
 templeStoneFaces(st);add(project,st,rearTempleCavern(st),'rear-cavern-courts');const assets=createStage16TempleAssets(),hall=placeOn(project,st,assets.greatHall,'great-hall',art.hall),supports=[];
 const galleries=[
  {key:'folded-west-cloister',name:'높은 암반에 기대어 두 층으로 접힌 서회랑',terrainIds:['tm-cloister-return','tm-cloister-stair','tm-cloister-turn','tm-cloister-foot','tm-cloister-link'],postXs:[3310,3650,3990,4300],covered:true},
  {key:'shelter-veranda',name:'돌계단 앞 승려 쉼터의 열린 툇마루',terrainIds:['tm-shelter-veranda','tm-shelter-step'],postXs:[2480,2790,3250]},
  {key:'hall-side-gallery',name:'대법당 측면에 이어 붙인 누마루와 짧은 층계',terrainIds:['tm-hall-side-gallery','tm-hall-gallery-step','tm-hall-gallery-foot'],postXs:[5010,5485,5690]},
  {key:'east-return-gallery',name:'동쪽 석축에 묶여 올라가는 넓은 회랑 층계',terrainIds:['tm-east-undercroft-stair','tm-east-stone-bridge'],postXs:[7490,7840,8270,8580]},
  {key:'processional-crossing',name:'큰 돌계단 사이를 잇는 열린 사찰 다리',terrainIds:['tm-processional-bridge'],postXs:[2840,3360]},
  {key:'archive-cloister',name:'동편 기록방의 긴 처마와 열린 회랑',terrainIds:['tm-archive-walk','tm-archive-return'],postXs:[9080,9490,9860,10320],covered:true},
  {key:'lower-prayer-ledge',name:'기단 아래 암반에 맞춘 낮은 기도굴 선반',terrainIds:['tm-lower-prayer-ledge'],postXs:[4810,5090]}
 ];for(const spec of galleries){const q=galleryFrame(st,spec);add(project,st,q.asset,spec.key);supports.push({terrainIds:q.terrainIds,feet:q.supports});}
 st.design.space.lights=(st.design.space.lights||[]).filter(l=>!l.stage16Art);for(const[i,spec]of(art.lamps||[]).entries()){const e=placeOn(project,st,assets.stoneLamp,'lamp-'+(spec.key||i),spec);st.design.space.lights.push({id:'s16-light-'+(spec.key||i),stage16Art:true,kind:'oil',x:e.x,y:e.y-183*e.scale,radius:spec.radius??300,color:'#c4ad77'});}
 st.design.templeArt={revision:3,nativeVectorOnly:true,hallSupport:hall.stage16Support,supports,artAssetIds:[...new Set(st.elements.filter(e=>e.id.startsWith('s16-art-')).map(e=>e.assetId))],source:'stage16-local-authored-terrain',budgets:{maxNodesPerAsset:420}};return project;
}
