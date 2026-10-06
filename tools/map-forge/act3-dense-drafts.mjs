/** Review-only Workshop geometry. Never imported by the production build. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runtime} from '../../game/tests/helpers.mjs';
import {compileSVG} from '../environment/build-act2-art.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const pts=a=>a.map(([x,y])=>({x,y}));
const pathD=a=>'M'+a.map(p=>p.join(' ')).join(' L')+' Z';
const P=(a,fill,stroke='',width=2)=>`<path d="${pathD(a)}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}"`:''}/>`;
const R=(x,y,w,h,c)=>P([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],c);
const line=(a,c,w=2)=>`<path d="M${a.map(p=>p.join(' ')).join(' L')}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
function asset(id,name,svg,collision,bounds){const [x,y,w,h]=bounds;return{id,name,category:'architecture',visual:[],vector:compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.join(' ')}">${svg}</svg>`),collision:collision.map(pts),anchor:{x:0,y:0},sockets:[],tags:['inactive-act3-draft'],params:{},material:'wood',breakable:false,oneWay:false,bounds:{x,y,w,h},reference:{heightM:h/60,bounds:{x,y,w,h},foot:{x:0,y:0},scaleRange:[.4,2],backgroundRange:[.4,2]}};}
function house(id,w,h,{roof=110,wall='#aaa58d',timber='#514840',open=false,floors=1}={}){
 const l=-w/2,r=w/2,eave=-h,peak=eave-roof,coll=[],pieces=[];
 const roofPoly=[[l-45,eave-5],[l-8,eave-27],[-w*.2,peak+12],[0,peak],[w*.2,peak+12],[r+8,eave-27],[r+45,eave-5],[r+28,eave+19],[l-28,eave+19]];
 if(!open){const body=[[l,eave+15],[r,eave+15],[r,0],[l,0]];coll.push(body);pieces.push(P(body,wall));pieces.push(R(r-w*.16,eave+17,w*.16,h-17,'#777d72'));}
 else {for(const x of [l+25,r-45]){const col=[[x,eave+15],[x+20,eave+15],[x+20,0],[x,0]];coll.push(col);pieces.push(P(col,timber));}}
 pieces.push(R(l, -25,w,25,'#697776'),R(l+7,-22,w-14,8,'#9faaa0'));
 for(let floor=0;floor<floors;floor++){
  const y=eave+46+floor*(h-56)/floors,hh=(h-60)/floors;
  if(!open&&!/granary/.test(id)){for(let x=l+35;x<r-50;x+=104){pieces.push(R(x,y,68,Math.min(hh-30,143),'#3c4e4c'),R(x+5,y+5,58,Math.min(hh-40,133),'#b7b89c'));for(let z=13;z<67;z+=13)pieces.push(line([[x+z,y+5],[x+z,y+Math.min(hh-35,138)]],'#686e59',3));pieces.push(line([[x,y+48],[x+68,y+48]],'#5a635a',4));}
   for(let x=l+12;x<r;x+=Math.max(100,w/5))pieces.push(R(x,eave+23,13,h-50,timber));}
  pieces.push(R(l,eave+floor*(h/floors)+22,w,12,timber));
 }
 if(/granary/.test(id)){for(let x=l+20,i=0;x<r-20;x+=48,i++)pieces.push(R(x,eave+38,42,h-75,i%3===0?'#8e7856':'#76694d'),line([[x+7,eave+45],[x+7,-45]],'#a38c60',3));pieces.push(R(-95,eave+110,190,h-143,'#374c47'),R(-87,eave+118,81,h-158,'#998258'),R(7,eave+118,81,h-158,'#806f4c'));for(const y of [eave+146,eave+210,-88])pieces.push(R(-88,y,176,12,'#c2aa73'));}
 if(/cloth/.test(id)){pieces.push(P([[l+10,-200],[r-10,-200],[r+40,-110],[l-40,-110]],'#ac9974'));for(let x=l+10;x<r;x+=100)pieces.push(P([[x,-199],[x+46,-199],[x+65,-111],[x-18,-111]],'#657d76'));}
 pieces.push(P(roofPoly,'#263e48','#182d38',4),P([[l-25,eave-8],[-w*.2,peak+16],[0,peak+5],[w*.18,peak+18],[r+26,eave-8],[r-16,eave+1],[0,peak+31],[l+15,eave+3]],'#627c7b'));
 for(let x=l+20;x<r;x+=42){const y=peak+28+Math.abs(x)/(w/2)*(roof-24);pieces.push(line([[x,y],[x+(x<0?-21:21),eave+4]],'#80928a',2));}
 pieces.push(line([[l-38,eave+8],[r+38,eave+8]],'#a1aa94',5),R(l-10,eave+20,w+20,13,'#476c61'));coll.push(roofPoly);
 return asset(id,id,pieces.join(''),coll,[l-50,peak-10,w+100,h+roof+22]);
}
function bridge(id,w,h=55,{rail=true,color='#76614c'}={}){const body=[[0,0],[w,0],[w,h],[0,h]],pieces=[P(body,color),R(0,0,w,8,'#bea681')];for(let x=0;x<w;x+=40)pieces.push(line([[x,9],[x,h]],'#3e4842',2));if(rail){pieces.push(R(0,-56,w,9,'#7c7258'));for(let x=0;x<=w;x+=100)pieces.push(R(x,-64,9,64,'#a2956c'));}return asset(id,'다리 / 회랑',pieces.join(''),[body],[-5,-70,w+20,h+80]);}
function stairs(id,w,rise,steps=8){steps=Math.max(steps,Math.ceil(rise/16));const p=[[0,0]],parts=[];for(let i=0;i<steps;i++){const x=(i+1)*w/steps,y=-(i+1)*rise/steps;p.push([x-w/steps,y],[x,y]);parts.push(line([[x-w/steps,y+7],[x,y+7]],'#9caa9e',3));}p.push([w,100],[0,100]);return asset(id,'석조 계단',P(p,'#586e71')+parts.join(''),[p],[0,-rise,w,rise+105]);}
function env(st,lib,city=true){const E={version:4,preset:city?'forest':'enclosed',skyVisible:true,atmosphere:{preset:city?'temple':'enclosed',overrides:{skyTop:city?'#526f7e':'#17282e',skyBottom:city?'#b6b9a0':'#536965',hazeStrength:.28,mistStrength:.07,lightStrength:.12}},zones:[{id:'draft-world',from:0,to:st.height,blend:180}],groups:[],surfaces:[],placements:[]};
 if(city)for(const [layer,y,scale,step,offset]of [['L3',2000,.82,610,110],['L2',2380,.88,790,300]]){const group={id:'city-'+layer,depthLayer:layer,verticalMode:'WORLD',zoneId:'draft-world',x:0,y};E.groups.push(group);const support={id:group.id+'-ground',groupId:group.id,kind:'rear-ground',points:[{x:-18000,y:0},{x:st.width+18000,y:0}],bottom:18000};E.surfaces.push(support);for(let x=-5000,i=0;x<st.width+5000;x+=step,i++)E.placements.push({id:`city-${layer}-${i}`,assetId:['draft:sky-house','draft:sky-hall','draft:sky-granary-art','draft:sky-house','draft:sky-wall-art','draft:sky-gate-art'][i%6],depthLayer:layer,groupId:group.id,supportId:support.id,x:x+offset,y:0,scale:i%4===0?scale*1.08:scale,rotation:0});}
 st.environment=E;
}
function project(g,kind){const st=g.HonroMaps.emptyStage('draft-act3-'+kind,kind==='canal-city'?'수로 위 지붕도시 · 미승인 검수안':'기록고 절개실내 · 미승인 검수안',kind==='canal-city'?7800:5600,kind==='canal-city'?3400:3200);st.metadata={stageId:13,campaign:false,draft:true,templateStageId:13,templateReason:'Existing Workshop custom-map compiler requires an implemented stage template; template 13 supplies neutral custom-map mechanics; this is not campaign Stage 13 or Stage 21.'};st.meta.notes='Inactive review geometry; no normal campaign, story, balance, reward, or browser completion claim.';st.backdrop=kind==='canal-city'?'river':'temple';st.anchors={};st.routes=[];st.design={draft:{kind,status:'awaiting-user-map-review',campaignEnabled:false,mainBuildings:[],bridges:[],route:[],shotSamples:[]}};return{schema:'honro-map',version:6,environmentVersion:4,name:st.name,activeStageId:st.id,settings:{grid:20,snap:true,autosave:false,adaptiveLOD:true},library:[],stages:[st]};}
const put=(p,a,id,x,y,layer='back')=>{if(!p.library.some(q=>q.id===a.id))p.library.push(a);p.stages[0].elements.push({id,assetId:a.id,x,y,scale:1,rotation:0,snap:false,depthLayer:'L1',layer});return{id,x,y};};
function terrain(st,id,p,material='stone'){st.terrains.push({id,name:id,type:'solid',points:pts(p),baseMaterial:material,oneWay:false,breakable:false,layer:'terrain',properties:{}});}
function pool(st,id,x1,x2,y,bottom){st.materials.push({id,kind:'water-pool',conductive:true,points:[[x1,y],[x2,y],[x2,bottom],[x1,bottom]],surface:[[x1,y],[x2,y]],bottom:[[x1,bottom],[x2,bottom]],attached:true});}
function units(g,st,locations){st.units=locations.map(([kind,id,x,y,team])=>g.HonroUnits.record(kind,id,x,y,team));st.anchors.start={x:locations[0][2],y:locations[0][3]};}
export async function buildCity(g){const p=project(g,'canal-city'),s=p.stages[0];
 for(const [id,w,h,opt]of [['sky-house',640,300,{}],['sky-hall',920,570,{floors:2,wall:'#8b998f'}],['sky-gate',800,780,{open:true,wall:'#7c8c85'}]]){const a=house('draft:'+id,w,h,opt);a.collision=[];p.library.push(a);}
 for(const [short,file]of [['gate','eupseong-gate.svg'],['granary','granary-loading-wall.svg'],['wall','office-wall-entry.svg']]){const source=await readFile(path.join(root,'workshop/drafts/act3-town-assets',file),'utf8'),v=compileSVG(source),[x,y,w,h]=v.viewBox,a=asset('draft:sky-'+short+'-art',short,'',[],[x,y,w,h]);a.vector=v;p.library.push(a);}
 env(s,p.library,true);
 terrain(s,'city-foundation',[[0,2730],[1500,2730],[1500,2824.4],[2530,2824.4],[2530,2730],[3790,2730],[3860,2990],[4010,3130],[4590,3050],[4830,2920],[4830,2730],[6100,2730],[6100,3030],[6880,3030],[6880,2730],[7800,2730],[7800,3400],[0,3400]]);
 pool(s,'west-canal',1500,2530,2720,2824.4);pool(s,'grand-canal',3790,4830,2730,3100);s.materials.at(-1).bottom=[[3790,2920],[3860,2990],[4010,3130],[4590,3050],[4830,2920]];s.materials.at(-1).points=[[3790,2730],[4830,2730],...s.materials.at(-1).bottom.slice().reverse()];pool(s,'east-canal',6100,6880,2720,3030);
 // Every solid roof and wall below is rendered and collided from the same asset polygons.
 const buildings=[['west-shop',620,320,650,2730,{}],['cloth-hall',620,490,1260,2730,{wall:'#b8aa87'}],['west-quay-tower',430,270,1760,2530,{open:true}],['market-house',680,590,2760,2730,{wall:'#aab2a1'}],['granary',700,680,3410,2730,{wall:'#8d907f'}],['bridge-tower',440,290,4010,2440,{open:true}],['customs-hall',820,600,5070,2730,{floors:2}],['office-upper',600,500,5140,1690,{open:true}],['east-house',620,520,5740,2730,{wall:'#a89483'}],['canal-watch',400,240,6320,2470,{open:true}],['east-granary',710,440,7070,2730,{wall:'#a5ac93'}],['gate-upper',550,370,3000,1700,{open:true}]];
 for(const [id,w,h,x,y,opt]of buildings){put(p,house('draft:'+id,w,h,opt),id,x,y);s.design.draft.mainBuildings.push(id);}
 // Roof routes and low waterside causeways visibly span three separate canals.
 const bridges=[['west-water-bridge',1450,2600,1130],['west-roof-bridge',1550,2115,1160],['central-water-bridge',3740,2630,1140],['central-roof-bridge',3730,2030,1090],['east-water-bridge',6060,2600,860],['east-roof-bridge',6030,2100,830],['office-high-gallery',4850,1690,1100],['market-upper-gallery',2720,1700,610]];
 for(const [id,x,y,w]of bridges){put(p,bridge('draft:'+id,w),id,x,y);s.design.draft.bridges.push(id);}
 put(p,stairs('draft:roof-link-west',290,185,6),'roof-link-west',790,2340);
 put(p,stairs('draft:entry-stairs',360,410,6),'entry-stairs',70,2730);put(p,stairs('draft:west-quay-stairs',300,130,3),'west-quay-stairs',1170,2730);
 put(p,stairs('draft:office-stairs',440,510,7),'office-stairs',4460,2730);put(p,stairs('draft:east-stairs',420,420,6),'east-stairs',7350,2730);

 // Replace the two boxed upper placeholders with the shared open gallery art.
 // Decks are structural. Rear posts/brackets remain an explicitly rear plane.
 const ext=JSON.parse(await readFile(path.join(root,'workshop/drafts/act3-town-assets/dense-extension-manifest.json'),'utf8'));
 for(const [target,x,y]of [['office-upper',5250,1760],['gate-upper',3000,1770]]){const meta=ext.assets.find(a=>a.file==='open-two-storey-gallery.svg'),source=await readFile(path.join(root,'workshop/drafts/act3-town-assets',meta.file),'utf8'),vector=compileSVG(source),[bx,by,bw,bh]=vector.viewBox,a=asset('draft:'+target+'-gallery',meta.name,'',meta.suggestedSolids.map(q=>q.points),[bx,by,bw,bh]);a.vector=vector;a.params.collisionContract={file:meta.file,solids:meta.suggestedSolids};a.reference=meta.reference;p.library.push(a);const e=s.elements.find(e=>e.id===target);Object.assign(e,{assetId:a.id,x,y});}
 s.elements=s.elements.filter(e=>!['office-high-gallery','market-upper-gallery'].includes(e.id));s.design.draft.bridges=s.design.draft.bridges.filter(id=>!['office-high-gallery','market-upper-gallery'].includes(id));
 // Rear support posts meet the lower roofs. They are not front-plane barriers.
 let supports='';for(const [x,y,foot]of [[2780,1770,2090],[3210,1770,1990],[4840,1760,2070],[5460,1760,2130]])supports+=R(x,y,25,foot-y,'#74664c')+R(x+3,y,6,foot-y,'#ad9b70')+P([[x,foot],[x+35,foot],[x+41,foot+18],[x-6,foot+18]],'#8b9481');
 put(p,asset('draft:upper-rear-posts','상층 뒤기둥과 지붕 접지',supports,[],[2750,1700,2780,470]),'upper-rear-posts',0,0,'back');
 // Three open arches; pier feet meet the canonical west channel bed exactly.
 const bm=ext.assets.find(a=>a.file==='three-arch-stone-bridge.svg'),bs=await readFile(path.join(root,'workshop/drafts/act3-town-assets',bm.file),'utf8'),bv=compileSVG(bs),bb=bv.viewBox,ba=asset('draft:west-stone-bridge',bm.name,'',bm.suggestedSolids.map(q=>q.points),bb);ba.vector=bv;ba.reference=bm.reference;ba.material='stone';ba.params.collisionContract={file:bm.file,solids:bm.suggestedSolids};p.library.push(ba);Object.assign(s.elements.find(e=>e.id==='west-water-bridge'),{assetId:ba.id,x:2015,y:2824.4,scale:.85});
 // Quay blocks, loading crates and a timber cargo hoist give the water a purpose.
 let quay='';for(const [x,y,w,h]of [[2530,2650,170,80],[3690,2500,90,230],[4780,2560,85,180],[6040,2490,80,240]]){quay+=R(x,y,w,h,'#76877d')+R(x,y,w,12,'#b3b69a');for(let yy=y+38;yy<y+h;yy+=42)quay+=line([[x+4,yy],[x+w-5,yy]],'#455f60',3);}
 for(const [x,y]of [[2570,2600],[2640,2600],[4840,2680],[5940,2670]])quay+=R(x,y,60,50,'#9b8157')+line([[x+4,y+4],[x+56,y+46],[x+56,y+4],[x+4,y+46]],'#d0b786',4);
 quay+=R(3610,2330,20,270,'#6f6448')+R(3580,2320,200,18,'#9d8a61')+line([[3620,2490],[3740,2338]],'#9d8a61',14)+line([[3750,2338],[3750,2630]],'#c0af7b',4);
 put(p,asset('draft:canal-quays','수로 교대·하역벽·짐틀',quay,[],[2520,2300,3650,450]),'canal-quays',0,0,'back');
 // One upper spur is a sequence of ordinary jump landings, not a ladder mechanic.
 for(const [i,x,y]of [[0,5570,1920],[1,5510,1770],[2,5570,1620]])put(p,bridge('draft:office-step-'+i,160,30,{rail:false}),'office-step-'+i,x,y);
 units(g,s,[['archer','draft-seol-o',430,2373,'player'],['mage','draft-damheo',570,2316,'player'],['knight','draft-hwigyeom',715,2311,'player'],['occultist','draft-sodan',815,2346,'player'],['human','draft-guard-roof',2860,2044,'enemy'],['human','draft-guard-hall',5230,1493,'enemy'],['object:civilian','draft-quay-resident',2170,2600,'npc']]);
 s.design.draft.route=[{x:350,y:2410},{x:650,y:2300},{x:1030,y:2160},{x:1260,y:2130},{x:1510,y:2200},{x:1840,y:2115},{x:2280,y:2115},{x:2640,y:2050},{x:2920,y:2010},{x:3270,y:1980},{x:3730,y:2030},{x:4470,y:2030},{x:4800,y:2020},{x:5500,y:2130},{x:5920,y:2150},{x:6300,y:2100},{x:6760,y:2100},{x:7100,y:2180},{x:7570,y:2510}];
 s.design.draft.objectiveIdeas=['서쪽 수로의 주민 구조','관창 지붕을 거쳐 운송 장부 확보','상층 관아 회랑과 낮은 수로에서 서로 다른 사격각 확인'];
 s.design.draft.shotSamples=[{name:'open-roof-lane',from:[2200,2115],to:[2460,2115]},{name:'roof-blocked-low-lane',from:[3050,2730],to:[3650,2730]}];
 settleUnits(g,p);return g.HonroTerrainDomain.author(p);
}

function settleUnits(g,p){const s=p.stages[0],ts=g.HonroMaps.compile(s,p).terrain;function inside(x,y,ps){let k=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){const a=ps[i],b=ps[j];if((a.y>y)!=(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)k=!k;}return k;}for(const u of s.units){const hits=ts.flatMap(t=>g.HONRO_CORE.terrainSurfaces(t,u.x)).filter(q=>Math.abs(q.slope)<=1.35&&!ts.some(t=>inside(u.x,q.y-2,g.HONRO_CORE.poly(t)))).sort((a,b)=>Math.abs(a.y-u.y)-Math.abs(b.y-u.y));if(hits.length)u.y=hits[0].y;}s.anchors.start={x:s.units[0].x,y:s.units[0].y};}
function bookcase(id,w=280,h=285){const a=[];a.push(R(0,0,w,h,'#423f34'),R(8,8,w-16,h-16,'#263b3c'));
 for(let row=0;row<4;row++){const y=14+row*65;for(let x=16,j=0;x<w-25;x+=22,j++){const colors=['#b6ac83','#81856c','#b99068','#6e847b','#b7b594'];a.push(R(x,y+4+(j%3)*3,16,48-(j%3)*3,colors[(j+row)%5]),R(x+2,y+14,12,3,'#495b52'));}a.push(R(6,y+56,w-12,10,'#8a7957'));}a.push(R(0,0,12,h,'#8b7956'),R(w-12,0,12,h,'#675b42'));return asset(id,'뒤벽 서가',a.join(''),[],[0,0,w,h]);}
export async function buildArchive(g){const p=project(g,'great-archive'),s=p.stages[0];env(s,p.library,false);s.environment.atmosphere.overrides.skyTop='#374a4c';s.environment.atmosphere.overrides.skyBottom='#acb39a';
 terrain(s,'archive-foundation',[[0,2780],[5600,2780],[5600,3200],[0,3200]]);
 // Front wall is cut away. These shaded planes are explicitly the rear wall;
 // floors, stair flights, columns at the perimeter, and roof are real solids.
 let rear=R(500,1040,4740,1740,'#313f3e')+R(650,1130,1550,1645,'#635f4a')+R(3500,1120,1560,1655,'#586456');
 for(const x of [760,1260,1760,3720,4220,4720]){rear+=R(x,1310,225,360,'#87917a')+R(x+18,1328,189,321,'#c4c4a1');for(let j=1;j<5;j++)rear+=R(x+18+j*37,1328,5,321,'#56685e');for(let j=1;j<6;j++)rear+=R(x+18,1328+j*53,189,5,'#56685e');}
 rear+=R(2400,1060,920,1710,'#a1b1a1')+P([[2400,1070],[2760,1070],[3330,2750],[2450,2750]],'#c2c7ad')+R(2640,2580,490,200,'#5d8278');
 for(const x of [540,2200,3430,5160])rear+=R(x,1070,50,1680,'#46524b')+R(x+5,1080,8,1660,'#a6966d');
 for(const y of [1830,2250,2700])rear+=R(540,y,1790,35,'#74664b')+R(3400,y,1840,35,'#74664b');
 put(p,asset('draft:archive-rear','기록고 뒤벽 · 앞벽 절개',rear,[],[450,1000,4850,1790]),'archive-rear',0,0,'back');
 const roofs=[house('draft:archive-west-roof',1950,240,{roof:180,wall:'#a9a68d'}),house('draft:archive-east-roof',1870,240,{roof:180,wall:'#a9a68d'})];put(p,roofs[0],'archive-west-roof',1350,1330);put(p,roofs[1],'archive-east-roof',4330,1330);s.design.draft.mainBuildings=['archive-west-roof','archive-east-roof'];
 for(const [id,x,y,w]of [['ground-west',520,2770,1690],['ground-east',3390,2770,1840],['middle-west',1940,2360,600],['middle-atrium',2540,2360,950],['middle-east',3490,2360,1740],['upper-west',610,1940,1630],['upper-east',4290,1940,940],['upper-atrium',2230,1940,1220]]){put(p,bridge('draft:archive-'+id,w,60,{rail:id.includes('atrium')}),'archive-'+id,x,y);s.design.draft.bridges.push('archive-'+id);}
 put(p,stairs('draft:archive-west-stairs',940,420,14),'archive-west-stairs',1020,2780);put(p,stairs('draft:archive-east-stairs',900,420,14),'archive-east-stairs',3400,2360);
 // Optional west gallery uses the same climbable stair surfaces and ordinary movement.
 // West upper gallery is a draft optional zone; access is not part of the primary route probe yet.
 for(const [i,x,y]of [[0,560,2460],[1,2200,2440],[2,3640,2460],[3,3990,2460],[4,4460,2460],[5,4860,2460],[6,2040,2040],[7,4480,2040],[8,4860,2040],[9,740,1600],[10,1190,1600],[11,1670,1600],[12,4420,1600],[13,4850,1600]])put(p,bookcase('draft:archive-shelf-'+i,250,270),'archive-shelf-'+i,x,y+(y===1600?70:y===2040?50:y===2440?60:40),'back');


 // Reuse only the ground-level shelf subpaths. Each cabinet is attached to its
 // own actual floor; never paste the three-storey frame across mismatched floors.
 const archiveSource=await readFile(path.join(root,'workshop/drafts/act3-town-assets/archive-cutaway-frame.svg'),'utf8'),group=archiveSource.match(/<g id="left-bay-archive-shelves">([\s\S]*?)<\/g>/)[1];
 const low=group.replace(/<path([^>]*?)d="([^"]+)"([^>]*)\/>/g,(all,a,d,z)=>{const ds=d.split(/(?=M)/).filter(Boolean).filter(part=>{const ts=part.match(/[MLHVZ]|-?\d+(?:\.\d+)?/g)||[];let x=0,y=0,min=Infinity;for(let i=0;i<ts.length;){const c=ts[i++];if(c==='M'||c==='L'){x=+ts[i++];y=+ts[i++];}else if(c==='H')x=+ts[i++];else if(c==='V')y=+ts[i++];min=Math.min(min,y);}return min>=-220;});return ds.length?`<path${a}d="${ds.join(' ')}"${z}/>`:'';});
 const cabinet=asset('draft:archive-bundle-cabinet','종이묶음 장부서가',low+R(-620,-28,340,28,'#847754'),[],[-620,-220,340,220]);
 for(const [i,x,y]of [[0,1180,2770],[5,5480,2770],[9,1360,1940],[13,5470,1940]]){s.elements=s.elements.filter(e=>e.id!=='archive-shelf-'+i);put(p,cabinet,'archive-bundle-cabinet-'+i,x,y,'back');}
 // Readable hanging scrolls and lanterns, all decorative behind actors.
 let scrolls='';for(const x of [2390,3240]){scrolls+=line([[x,1130],[x,1810]],'#635f45',7)+R(x-52,1440,104,255,'#bdad81')+R(x-60,1438,120,12,'#564e35')+R(x-60,1693,120,12,'#564e35');for(let row=0;row<7;row++)scrolls+=R(x-29,1470+row*29,58-row%3*7,5,'#667061');}put(p,asset('draft:archive-scrolls','아트리움 현판',scrolls,[],[2320,1100,1000,720]),'archive-scrolls',0,0);
 pool(s,'courtyard-water',2670,3090,2730,2780);
 units(g,s,[['archer','draft-seol-o',700,2770,'player'],['mage','draft-damheo',810,2770,'player'],['knight','draft-hwigyeom',900,2770,'player'],['occultist','draft-sodan',990,2770,'player'],['human','draft-middle-guard',2900,2360,'enemy'],['human','draft-upper-guard',4700,1940,'enemy'],['object:civilian','draft-archivist',5020,1940,'npc']]);
 s.design.draft.route=[{x:700,y:2770},{x:990,y:2770},{x:1300,y:2640},{x:1640,y:2510},{x:2040,y:2360},{x:2480,y:2360},{x:2960,y:2360},{x:3320,y:2360},{x:3670,y:2230},{x:4040,y:2070},{x:4380,y:1940},{x:4950,y:1940}];s.design.draft.objectiveIdeas=['하층 소각 표적 무력화','큰 아트리움 연결교를 건너 상층 서리 보호','발코니 문서 확보 및 출구'];s.design.draft.sections=12;s.design.draft.shotSamples=[{name:'middle-atrium-open',from:[2700,2360],to:[3150,2360]}];return g.HonroTerrainDomain.author(p);
}
export async function buildDrafts({write=true}={}){const g=await runtime({legacyMaps:false}),city=await buildCity(g),archive=await buildArchive(g);if(write){const out=path.join(root,'workshop/drafts/act3-dense-city');await mkdir(out,{recursive:true});for(const [name,p]of [['canal-city',city],['great-archive',archive]])await writeFile(path.join(out,name+'.project.json'),JSON.stringify(p,null,2)+'\n');}return{g,city,archive};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const {g,city,archive}=await buildDrafts();for(const p of [city,archive]){const errors=g.HonroMaps.validate(p).filter(x=>x.level==='err');console.log(JSON.stringify({stages:p.stages.map(s=>s.id),errors},null,2));if(errors.length)process.exitCode=1;}}
