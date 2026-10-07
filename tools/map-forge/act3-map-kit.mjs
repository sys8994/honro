/** Shared production authoring primitives. Every structural face uses its drawn polygon. */
import {compileSVG} from '../environment/build-act2-art.mjs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const pts=a=>a.map(([x,y])=>({x,y}));
export const pathD=a=>'M'+a.map(p=>p.join(' ')).join(' L')+' Z';
export const P=(a,fill,stroke='',width=2)=>`<path d="${pathD(a)}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}"`:''}/>`;
export const R=(x,y,w,h,c)=>P([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],c);
export const line=(a,c,w=2)=>`<path d="M${a.map(p=>p.join(' ')).join(' L')}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
export function asset(id,name,svg,collision,bounds,material='wood') {const[x,y,w,h]=bounds;return{id,name,category:'architecture',visual:[],vector:compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.join(' ')}">${svg}</svg>`),collision:collision.map(pts),anchor:{x:0,y:0},sockets:[],tags:['act3-production'],params:{collisionSource:'drawn-structural-polygons'},material,breakable:false,oneWay:false,bounds:{x,y,w,h},reference:{heightM:h/60,bounds:{x,y,w,h},foot:{x:0,y:0},scaleRange:[.35,2],backgroundRange:[.35,2]}};}
export function put(p,s,a,id,x,y,scale=1,layer='back'){if(!p.library.some(q=>q.id===a.id))p.library.push(a);s.elements.push({id,assetId:a.id,x,y,scale,rotation:0,snap:false,depthLayer:'L1',layer});return s.elements.at(-1);}
export function terrain(s,id,p,material='stone',properties={}){s.terrains.push({id,name:id,type:'solid',points:pts(p),baseMaterial:material,oneWay:false,breakable:false,layer:'terrain',properties});return s.terrains.at(-1);}
export function foundation(s,profile){terrain(s,'a3-foundation',[...profile,[s.width,s.height],[0,s.height]]);}
export function pool(s,id,x1,x2,y,bottom){s.materials.push({id,kind:'water-pool',conductive:true,points:[[x1,y],[x2,y],[x2,bottom],[x1,bottom]],surface:[[x1,y],[x2,y]],bottom:[[x1,bottom],[x2,bottom]],attached:true});}
export function deck(id,w,h=36,{rail=true,stone=false}={}){const body=[[0,0],[w,0],[w,h],[0,h]],parts=[P(body,stone?'#718081':'#766649'),R(0,0,w,7,stone?'#b1b5a2':'#b7a371')];for(let x=20;x<w;x+=80)parts.push(line([[x,8],[x,h]],stone?'#4b6265':'#4e5141',2));if(rail){parts.push(R(0,-65,w,8,'#685e48'));for(let x=0;x<=w;x+=135)parts.push(R(x,-78,10,78,'#97886a'),R(x-3,-80,16,6,'#c1b088'));}return asset(id,stone?'돌다리·성벽길':'회랑·누마루',parts.join(''),[body],[-5,-88,w+20,h+95],stone?'stone':'wood');}
export function stairs(id,w,rise,{left=false,thin=false}={}){const n=Math.ceil(rise/14),p=[[0,0]],parts=[];for(let i=0;i<n;i++){const x=(i+1)*w/n,y=-(i+1)*rise/n;p.push([x-w/n,y],[x,y]);parts.push(line([[x-w/n,y+5],[x,y+5]],'#aab29a',2));}if(thin){p.push([w,-rise+34],[0,34]);}else p.push([w,45],[0,45]);let all=P(p,'#627676')+parts.join('');if(left){const flip=p.map(([x,y])=>[w-x,y]);all=P(flip,'#627676')+parts.map(v=>`<g transform="matrix(-1 0 0 1 ${w} 0)">${v}</g>`).join('');return asset(id,'반대편 석계단',all,[flip],[0,-rise,w,rise+50],'stone');}return asset(id,'석계단',all,[p],[0,-rise,w,rise+50],'stone');}
export function ramp(id,w,rise,{left=false,thin=false}={}){let poly=[[0,0],[w,-rise],[w,-rise+(thin?36:rise+45)],[0,thin?36:45]];if(left)poly=poly.map(([x,y])=>[w-x,y]);const parts=[P(poly,'#627676'),line(left?[[w,0],[0,-rise]]:[[0,0],[w,-rise]],'#aab29a',7)];for(let x=40;x<w;x+=80){const y=left?-rise+x*rise/w:-x*rise/w;parts.push(line([[x,y+8],[x,y+30]],'#465f63',2));}return asset(id,'하역 경사로',parts.join(''),[poly],[0,-rise,w,rise+50],'stone');}
export function hall(id,w,h,{roof=110,floors=1,wall='#a5a98f',timber='#655442',style='hall',cutaway=true,floorBreaks=[]}={}){
 const l=-w/2,r=w/2,eave=-h,peak=eave-roof,parts=[],solids=[];
 const roofPoly=[[l-42,eave-6],[l-8,eave-30],[-w*.2,peak+12],[0,peak],[w*.2,peak+12],[r+8,eave-30],[r+42,eave-6],[r+30,eave+21],[l-30,eave+21]];
 // Geometry is intentionally unchanged. All material, window and joinery planes
 // below are rear artwork; only the original floor ranges and roof are solids.
 const burnt=style==='burnt',granary=style==='granary',market=style==='market';
 const shade=burnt?'#384b46':granary?'#65715e':market?'#6f7866':'#697d70';
 const plaster=burnt?'#797a61':wall, paper=market?'#c3b48e':'#b8b89b';
 const batch=(fill,ds)=>ds.length?`<path fill="${fill}" d="${ds.join(' ')}"/>`:'',box=(x,y,ww,hh)=>`M${x} ${y}h${ww}v${hh}h${-ww}Z`;
 const gradient=(name,y1,y2,top,bottom)=>`<linearGradient id="${name}" x1="${l}" y1="${y1}" x2="${r}" y2="${y2}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;
 parts.push('<defs>'+gradient('hall-plaster',eave,0,plaster,shade)+gradient('hall-roof',peak,eave,burnt?'#6f7970':granary?'#667d79':'#7b8e85',burnt?'#273b3d':'#2b4650')+'</defs>');
 parts.push(R(l,eave+20,w,h-20,'url(#hall-plaster)'),P([[l+w*.7,eave+34],[r-16,eave+34],[r-16,-1],[l+w*.78,-1]],shade));
 // Large limewash planes, side returns and an eave shadow replace a flat green wall.
 parts.push(P([[l+18,eave+52],[l+w*.52,eave+48],[l+w*.43,eave+86],[l+w*.24,eave+80],[l+18,eave+108]],burnt?'#68715c':plaster),R(l+16,eave+34,14,h-34,'#445d51'),R(r-30,eave+34,14,h-34,'#3e554d'));
 const recess=[],sheets=[],shutters=[],reveals=[],borders=[],muntins=[],paperLight=[],sillShadow=[],wallBands=[];
 const humanDoorX=w>=600?-54:Math.round(w*.18)-42;
 for(let f=0;f<floors;f++){
  const fy=-f*h/floors,hh=h/floors;
  // Rear-wall tiers use flush timber ties, never projecting/bright fake floors.
  // The lower windows sit at human eye height rather than following a high eave.
  const tierRows=hh>380?[{wy:fy-hh+69,wh:Math.min(104,hh*.24),attic:true},{wy:fy-190,wh:126,attic:false}]:[{wy:fy-Math.min(190,hh-65),wh:Math.min(126,hh-110),attic:false}];
  if(hh>380){const y=fy-Math.min(267,hh*.51);wallBands.push(box(l+19,y,w-38,11));parts.push(R(l+25,y+11,w-50,4,shade));}
  for(const row of tierRows)for(let x=l+34,j=0;x<r-70;x+=112,j++){
   const {wy,attic}=row,wh=Math.max(35,granary&&attic?66:row.wh),ww=granary&&attic?78:84;
   if(!attic&&f===0&&x+ww>humanDoorX-8&&x<humanDoorX+104)continue;
   const closed=!granary&&((j+f+(market?1:0))%4===2);
   recess.push(box(x-6,wy-7,ww+12,wh+17));borders.push(box(x-3,wy-4,ww+6,wh+8));
   (closed?shutters:sheets).push(box(x+4,wy+4,ww-8,wh-4));
   reveals.push(box(x+4,wy+4,ww-8,10),box(x+4,wy+13,7,wh-13));sillShadow.push(box(x,wy+wh+2,ww,7));
   if(closed){muntins.push(box(x+ww/2-3,wy+7,6,wh-9),box(x+8,wy+wh*.3,ww-16,7),box(x+8,wy+wh*.77,ww-16,7));paperLight.push(box(x+9,wy+7,3,wh-13));}
   else {for(let z=1;z<(granary?4:5);z++)muntins.push(box(x+z*ww/(granary?4:5),wy+14,3,wh-15));muntins.push(box(x+7,wy+Math.min(wh-11,wh*.53),ww-14,4));paperLight.push(box(x+ww-9,wy+15,3,wh-18));}
  }
  const gaps=floorBreaks.filter(q=>q.floor===f),ranges=[];let start=l;for(const q of gaps.sort((a,b)=>a.x1-b.x1)){ranges.push([start,q.x1]);start=q.x2;}ranges.push([start,r]);
  for(const [a,b]of ranges){if(b<=a)continue;const poly=[[a,fy],[b,fy],[b,fy+26],[a,fy+26]];parts.push(P(poly,f===0?'#62766c':'#6b5a3f'),R(a,fy,b-a,7,f===0?'#b0b397':'#bdab7e'),R(a,fy+20,b-a,6,'#344e44'));if(f>0||!cutaway)solids.push(poly);}
  parts.push(R(l,fy-hh+27,w,14,timber),R(l+15,fy-hh+41,w-30,24,'#4a5c47'));
 }
 parts.push(batch('#58664f',wallBands),batch('#344b43',recess),batch('#8e9070',borders),batch(paper,sheets),batch(burnt?'#4d513e':'#846c45',shutters),batch('#6c765a',reveals),batch('#60735d',muntins),batch('#c6bc94',paperLight),batch('#425643',sillShadow));
 const posts=[],postLight=[],postDark=[],braces=[],bracket=[],stones=[],stoneLight=[];
 const columnWidth=h>400?24:20,columns=w>1000?6:4;
 for(let i=0;i<columns;i++){
  const x=l+18+i*(w-54)/(columns-1);
  posts.push(box(x,eave+30,columnWidth,h-30));postLight.push(box(x+3,eave+35,5,h-40));postDark.push(box(x+columnWidth-6,eave+42,6,h-42));
  bracket.push(`M${x-8} ${eave+41}h${columnWidth+19}v10h-6v9h-${columnWidth+6}v-9h-7Z`);
  if(x<r-100)braces.push(`M${x+columnWidth-1} ${eave+45}h9l29 30l-6 8Z`);
  stones.push(`M${x-7} -18h${columnWidth+12}l5 18h-${columnWidth+22}Z`);stoneLight.push(`M${x-7} -18h${columnWidth+12}l2 6h-${columnWidth+16}Z`);
 }
 parts.push(batch(timber,posts),batch('#a98d5e',postLight),batch('#463f2e',postDark),batch('#675a3c',braces),batch('#365b4f',bracket),batch('#617468',stones),batch('#aab093',stoneLight));
 const dx=humanDoorX;
 parts.push(R(dx-10,-195,116,195,'#4c513c'),R(dx,-184,96,182,'#354b40'),R(dx+7,-175,39,169,burnt?'#514a34':'#876b43'),R(dx+50,-175,39,169,burnt?'#454934':'#725f3d'),R(dx-13,-198,122,10,'#9f8b60'),R(dx+45,-172,5,166,'#3e4130'),R(dx+35,-90,7,19,'#b5a173'),R(dx+54,-90,7,19,'#b5a173'));
 if(!cutaway){const body=[[l,eave+22],[r,eave+22],[r,0],[l,0]];solids.unshift(body);}
 if(granary){const boards=[],edges=[],dark=[],covers=[];for(let x=l+32,j=0;x<r-50;x+=82,j++){if(x+64>dx-12&&x<dx+108)continue;boards.push(box(x,-132,64,113));edges.push(box(x+3,-124,5,98));dark.push(box(x+58,-127,6,108));covers.push(box(x,-132,64,9));}parts.push(batch('#7e6a45',boards),batch('#a38b58',edges),batch('#4a4732',dark),batch('#c0a772',covers));}
 if(market){const light=[],dull=[],under=[];for(let x=l+35,j=0;x<r-80;x+=110,j++){(j%2?dull:light).push(pathD([[x,-185],[x+95,-185],[x+122,-113],[x-20,-113]]));under.push(box(x-14,-112,129,14));}parts.push(batch('#708e81',light),batch('#a28b68',dull),batch('#8c805d',under),R(l+33,-106,w-96,9,'#495a43'));}
 if(burnt){parts.push(P([[l+20,eave+20],[l+w*.22,eave+70],[l+w*.32,-14],[l+20,-14]],'#394b49'));for(const x of [l+22,l+w*.38,r-38])parts.push(P([[x,eave+30],[x+19,eave-70],[x+31,0],[x+7,0]],'#343f3b'));}
 parts.push(P(roofPoly,'url(#hall-roof)','#1c323a',4),P([[l-23,eave-8],[-w*.2,peak+17],[0,peak+7],[w*.18,peak+20],[r+25,eave-8],[r-13,eave+2],[0,peak+32],[l+14,eave+3]],burnt?'#526160':'#5f7978'));
 const ribs=[];for(let x=l+20;x<r;x+=54){const y=peak+29+Math.abs(x)/(w/2)*(roof-24);ribs.push(`M${x} ${y}L${x+(x<0?-20:20)} ${eave+5}`);}
 parts.push(`<path fill="none" stroke="#71877d" stroke-width="2" d="${ribs.join(' ')}"/>`);
 const courses=[];for(const t of [.48,.75]){const y=peak+roof*t,hw=w*(.17+t*.28);courses.push(`M${-hw} ${y}Q0 ${y+5} ${hw} ${y}l5 5Q0 ${y+10} ${-hw-5} ${y+5}Z`);}parts.push(batch('#2c4650',courses));
 parts.push(line([[l-34,eave+10],[r+34,eave+10]],'#9aab94',4),R(l-10,eave+23,w+20,11,'#385c4d'),R(l+8,eave+34,w-16,8,'#283f35'));solids.push(roofPoly);
 const a=asset(id,'실내가 열린 '+style,parts.join(''),solids,[l-50,peak-12,w+100,h+roof+45]);a.params.rearPlanes=['wall','windows','posts'];a.params.floorHeight=h/floors;a.params.style=style;return a;
}
export async function svgAsset(name){const dir=path.join(ROOT,'shared/assets/environment/act3-architecture');try{const m=JSON.parse(await readFile(path.join(dir,'production-manifest.json'),'utf8')),row=m.assets.find(a=>a.file===name);if(!row)return null;const v=compileSVG(await readFile(path.join(dir,name),'utf8')),a=asset(row.id,row.name,'',(row.suggestedSolids||[]).map(q=>q.points),v.viewBox);a.vector=v;a.reference=row.reference;a.params.collisionContract={file:name,solids:row.suggestedSolids};return a;}catch{return null;}}
export function marker(s,id,x,y,label,{action=false,requiredClass,target,type='act3'}={}){const m={id,type,x,y,label};if(action)m.action='act3';if(requiredClass)m.requiredClass=requiredClass;if(target)m.target=target;s.markers.push(m);return m;}
export function target(s,id,x,y,{hp=100,material='wood'}={}){const t=terrain(s,id,[[x-28,y-100],[x+28,y-100],[x+29,y],[x-29,y]],material,{hp,maxHp:hp,honroAct3Target:true,honroSeal:true});t.breakable=true;return t;}
export function gate(s,id,x,y,h=175){const t=terrain(s,id,[[x-22,y-h],[x+22,y-h],[x+22,y],[x-22,y]],'wood',{hp:100000,maxHp:100000,honroAct3Gate:true});t.breakable=true;return t;}
export function enemy(s,id,kind,x,y,cohort='street'){s.units.push({id,kind,team:'enemy',x,y,facing:-1,spawnIndex:s.units.filter(u=>u.team==='enemy').length,behavior:'patrol',stageOverrides:{honroCohort:cohort}});}
export function npc(s,id,x,y,{carrier=false}={}){s.units.push({id,kind:'object:civilian',team:'npc',x,y,facing:1,label:carrier?'기록 운반인':'주민',stageOverrides:{honroProtected:true,...(carrier?{fixed:false,maxMove:900,moveLeft:900}:{})}});}
export function players(s,x,y){for(const [i,kind]of ['archer','mage','knight','occultist'].entries())s.units.push({id:'p-'+kind,kind,team:'player',x:x+i*100,y,facing:1});s.anchors={spawn:{x,y},start:{x,y}};}
export function stage(g,id,name,width,height,kind){const s=g.HonroMaps.emptyStage('stage-'+id,name,width,height);s.metadata={stageId:id,act:3,actStage:id-20,campaign:true};s.initialState={honroAct3Revision:1,honroActiveLimit:3,honroState:{flags:{},collected:[],hold:0,lastRound:1,rescued:false,combatLog:[]}};s.meta={notes:`3-${id-20} ${name} · production architecture, ordinary movement`,seed:3000+id};s.design={act3:{version:1,kind,mainBuildings:[],bridges:[],requiredRoute:[],optionalRoutes:[],shotSamples:[],scope:'Canonical geometry; normal combat and mission completion require separate runtime verification.'}};s.routes=[];s.anchors={};return s;}
export function cityEnvironment(p,s,{mood='day',density=1,ground=2500,interior=false}={}) {
 const colors={day:['#526f7e','#c0c2a2'],late:['#5b6972','#c4aa87'],burnt:['#59646a','#a9a18c'],night:['#152b3a','#536e75'],garden:['#687f82','#c3c6a5'],inside:['#3a4e50','#95a595']}[mood]||['#526f7e','#c0c2a2'];
 const night=mood==='night',E={version:4,preset:interior?'enclosed':'forest',skyVisible:true,atmosphere:{preset:interior?'enclosed':'temple',overrides:{skyTop:colors[0],skyBottom:colors[1],hazeStrength:interior?.18:.27,mistStrength:interior?.035:.07,lightStrength:night?.06:.12,waterBaseColor:night?'#2b5165':'#426d73',waterHighlightColor:night?'#92b9c3':'#bdc5a4'}},zones:[{id:'act3-world',from:0,to:s.height,blend:200}],groups:[],surfaces:[],placements:[]};
 const mix=(color,target,weight)=>{const a=color.slice(1).match(/../g).map(x=>parseInt(x,16)),b=target.slice(1).match(/../g).map(x=>parseInt(x,16));return '#'+a.map((x,i)=>Math.round(x*(1-weight)+b[i]*weight).toString(16).padStart(2,'0')).join('');};
 if(!interior)for(const [layer,y,scale,step,offset]of [['L3',ground-450,.78,780/density,120],['L2',ground-150,.86,1130/density,420]]) {
  const tint=night?(layer==='L3'?'#405a63':'#49656a'):(layer==='L3'?'#80938c':'#768d83'),weight=layer==='L3'?.74:.58;
  const types=[hall(`a3-background-${mood}-${layer}-house`,660,330,{cutaway:false}),hall(`a3-background-${mood}-${layer}-office`,920,550,{floors:2,wall:'#8d9a8b',cutaway:false}),hall(`a3-background-${mood}-${layer}-granary`,780,430,{style:'granary',cutaway:false}),hall(`a3-background-${mood}-${layer}-market`,540,240,{style:'market',cutaway:false})];
  for(const a of types){a.collision=[];a.tags=['act3-rear-city'];a.vector=compileSVG(a.vector.source.replace(/#[0-9a-f]{6}/gi,c=>mix(c,tint,weight)));if(!p.library.some(b=>b.id===a.id))p.library.push(a);}
  const group={id:'a3-town-'+layer,depthLayer:layer,verticalMode:'WORLD',zoneId:'act3-world',x:0,y};E.groups.push(group);
  const sf={id:group.id+'-ground',groupId:group.id,kind:'rear-ground',points:[{x:-18000,y:0},{x:s.width+18000,y:0}],bottom:18000};E.surfaces.push(sf);
  // A continuous rear bank and masonry footing carries the whole skyline.
  // Its top is exactly the support surface; building roots never end in sky.
  const bankId=`a3-background-${mood}-${layer}-bank`,bank=asset(bankId,'도시 뒤기단과 강둑',R(0,0,3000,1500,mix('#4f675e',tint,.65))+R(0,0,3000,18,mix('#a1ac91',tint,.75))+line([[0,140],[3000,140]],mix('#364c48',tint,.7),3),[],[0,0,3000,1500],'stone');bank.reference.foot={x:0,y:0};bank.tags=['act3-rear-ground'];if(!p.library.some(a=>a.id===bankId))p.library.push(bank);
  for(let x=-18000,i=0;x<s.width+18000;x+=3000,i++)E.placements.push({id:`a3-bank-${layer}-${i}`,assetId:bankId,depthLayer:layer,groupId:group.id,supportId:sf.id,x,y:0,scale:1,rotation:0});
  for(let x=-6000,i=0;x<s.width+6000;x+=step,i++)E.placements.push({id:`a3-bg-${layer}-${i}`,assetId:types[(i+s.metadata.stageId%4)%types.length].id,depthLayer:layer,groupId:group.id,supportId:sf.id,x:x+offset,y:0,scale:scale*(i%3===0?1.08:.94),rotation:0});
 }
 s.environment=E;
}
export function inside(x,y,ps){let k=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){const a=ps[i],b=ps[j];if((a.y>y)!=(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)k=!k;}return k;}
export function support(g,ts,x,y){const hits=ts.flatMap(t=>g.HONRO_CORE.terrainSurfaces(t,x).map(q=>({...q,t}))).filter(q=>Math.abs(q.slope)<=1.35&&!ts.some(t=>inside(x,q.y-2,g.HONRO_CORE.poly(t)))).sort((a,b)=>Math.abs(a.y-y)-Math.abs(b.y-y));return hits.length?{x,y:hits[0].y,support:hits[0].t.id}:null;}
export function settle(g,p,s){const ts=g.HonroMaps.compile(s,p).terrain.filter(t=>!t.honroAct3Target&&!t.honroAct3Gate);for(const u of s.units){const q=support(g,ts,u.x,u.y);if(!q)throw Error(`${s.id} ${u.id} has no support`);u.y=q.y;}for(const m of s.markers){const q=support(g,ts,m.x,m.y);if(!q)throw Error(`${s.id} ${m.id} has no support`);m.y=q.y;}s.design.act3.requiredRoute=s.design.act3.requiredRoute.map(v=>({...v,...support(g,ts,v.x,v.y)}));for(const r of s.design.act3.optionalRoutes)r.points=r.points.map(v=>({...v,...support(g,ts,v.x,v.y)}));s.routes=s.design.act3.requiredRoute.map(({x,y})=>({x,y}));s.anchors.spawn={x:s.units[0].x,y:s.units[0].y};const exit=s.markers.findLast(m=>m.type==='exit')||s.markers.at(-1);s.anchors.exit={x:exit.x,y:exit.y};}
