/** Explicit review candidate for stages 21–23. Does not write the canonical campaign by default. */
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {runtime} from '../../game/tests/helpers.mjs';import {compileSVG} from '../environment/build-act2-art.mjs';import {koreanTownBuilding,koreanCourtyardWall,koreanArchiveCabinet,koreanTownEnvironment} from '../environment/korean-town-art.mjs';import {asset,deck,stairs,ramp,P,R,line,support} from './act3-map-kit.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),clone=x=>JSON.parse(JSON.stringify(x));
const body=svg=>svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
function putAsset(p,a){const i=p.library.findIndex(b=>b.id===a.id);if(i<0)p.library.push(a);else p.library[i]=a;return a;}
function element(p,s,a,id,x,y){putAsset(p,a);const e={id,assetId:a.id,x,y,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back'};s.elements.push(e);return e;}
function replace(p,s,id,a,position={}){const e=s.elements.find(e=>e.id===id);if(!e)throw Error('Missing element '+id);putAsset(p,a);Object.assign(e,{assetId:a.id,scale:1},position);return e;}
function remove(s,ids){s.elements=s.elements.filter(e=>!ids.includes(e.id));for(const key of ['mainBuildings','bridges'])s.design.act3[key]=(s.design.act3[key]||[]).filter(id=>!ids.includes(id));}
function groundY(g,p,s,x){const id=s.metadata.stageId===23?'city-foundation':'a3-foundation',t=g.HonroMaps.compile(s,p).terrain.find(t=>t.id===id);if(!t)throw Error('Foundation '+id);return Math.min(...g.HONRO_CORE.terrainSurfaces(t,x).map(q=>q.y));}
function gateCompound(id){
 const pavilion=koreanTownBuilding(id+'-pavilion',{width:650,role:'pavilion',roofType:'hip'}),height=540,w=1030,l=-w/2,r=w/2;
 const arch=`<path fill="#7d8370" d="M${l} 0V-${height}H${r}V0H143V-128C143-335-143-335-143-128V0Z"/>`,blocks=[];
 for(let row=0;row<5;row++)for(let col=0;col<7;col++){const x=l+12+col*145+(row%2)*11,y=-height+55+row*94;if(x<170&&x+129>-170&&y>-335)continue;blocks.push(P([[x,y+4],[x+119,y],[x+130,y+73],[x+3,y+77]],(row+col)%3===0?'#999b81':'#89907a'));}
 const svg=arch+blocks.join('')+`<path fill="#b0ac8e" d="M-184 0V-128C-184-392 184-392 184-128V0H143V-128C143-335-143-335-143-128V0Z"/>`+R(l-9,-height-15,w+18,19,'#b1ae91')+R(l,-height+4,w,9,'#51695e')+`<g transform="translate(0 -${height})">${body(pavilion.vector.source)}</g>`;
 const bounds=[l-13,pavilion.bounds.y-height,w+26,height-pavilion.bounds.y+3],a=asset(id,'읍성 석축과 단층 문루',svg,pavilion.collision.map(ps=>ps.map(v=>[v.x,v.y-height])),bounds,'stone');a.params={koreanType:'gate-on-masonry',rearStoneOnly:true,pavilionFloor:-height};return a;
}
function recordChange(changes,s,id,old,now,reason){changes.push({stage:s.metadata.stageId,element:id,reason,before:old?{assetId:old.assetId,x:old.x,y:old.y}:null,after:now?{assetId:now.assetId,x:now.x,y:now.y}:null});}
function building(p,s,id,role,width,roofType,variant,changes,position={}){const before=clone(s.elements.find(e=>e.id===id)),a=koreanTownBuilding(`a3-korean:${s.metadata.stageId}:${id}`,{role,width,roofType,variant});const after=replace(p,s,id,a,position);recordChange(changes,s,id,before,after,'Replace oversized hall and its roof solid with a low Korean building type');}
function wallScenery(p,s,id,x,y,width,cap='earth'){return element(p,s,koreanCourtyardWall('a3-korean:'+s.metadata.stageId+':'+id,{width,cap,gate:false}),id,x,y);}
function revise21(g,p,s,changes){
 koreanTownEnvironment(p,s,{ground:2540});
 const rows=[['entry-shop','shop',550,'gable'],['cloth-yard','shop',560,'thatch'],['west-gate-wing','office',680,'gable'],['east-gate-wing','office',580,'hip'],['tea-market','shop',560,'gable'],['east-stables','storehouse',480,'gable'],['office-porch','office',680,'hip'],['east-watch','house',410,'thatch']];
 rows.forEach(([id,role,w,roof],i)=>building(p,s,id,role,w,roof,i,changes));
 const before=clone(s.elements.find(e=>e.id==='gate-tower')),gate=replace(p,s,'gate-tower',gateCompound('a3-korean:21:gate-tower'));recordChange(changes,s,'gate-tower',before,gate,'Replace tall hall with stone gate base and one pavilion; battlement remains at y=1960');
 // The low gate wings are on the courtyard rear plane; no invisible roof
 // crosses the already-authored staircase in the front playable plane.
 for(const id of ['west-gate-wing','east-gate-wing']){const e=s.elements.find(e=>e.id===id),a=p.library.find(a=>a.id===e.assetId);a.collision=[];a.params.rearOnly=true;}
 remove(s,['rear-stair-piers']);
 const top=[[1730,2474],[2510,1996],[3570,1996]],bottom=[[3570,groundY(g,p,s,3570)],[2510,groundY(g,p,s,2510)],[1730,groundY(g,p,s,1730)]];
 const outline='M'+[...top,...bottom].map(q=>q.join(' ')).join(' L')+' Z';
 const stone=`<path fill="#737e69" fill-rule="evenodd" d="${outline} M2567 2500V2372C2567 2165 2853 2165 2853 2372V2500Z"/>`+line(top,'#9ba48b',7)+line([[1900,2450],[2460,2250],[3540,2250]],'#566c5f',5);
 const e=element(p,s,asset('a3-korean:21:stair-retaining-wall','석축에 붙은 성벽 오름길',stone,[],[1690,1940,1920,730],'stone'),'korean-gate-retaining-wall',0,0);s.elements.unshift(s.elements.pop());
 const shop=p.library.find(a=>a.id===s.elements.find(e=>e.id==='entry-shop').assetId),peak=2640+Math.min(...shop.collision[0].map(p=>p.y));
 replace(p,s,'market-roof-stair',stairs('a3-korean:21:market-roof-stair',370,2495-peak,{thin:true}),{x:130,y:2495});
 for(const [i,x,y,w]of [[0,920,2640,180],[1,3700,2500,210],[2,5630,2500,230]])wallScenery(p,s,'korean-street-wall-'+i,x,y,w,i===1?'tile':'earth');
 const route=s.design.act3.optionalRoutes.find(r=>r.id==='gate-battlement');route.points=route.points.map(q=>q.x===3480?{...q,y:1960,support:'gate-wall-walk:collision:0'}:q);
 s.design.act3.koreanTown={revision:1,scope:'Gate masonry, low everyday street and courtyard hierarchy',roofChanges:rows.map(r=>r[0]).concat('gate-tower','market-roof-stair'),rearOnly:['west-gate-wing','east-gate-wing']};
}
function limitedArchiveCutaway(id){
 const w=820,gap=260,roof=koreanTownBuilding(id+'-roof',{width:w,role:'archive',roofType:'gable'}),roofGroup=roof.vector.source.match(/<g id="korean-gable-roof">[\s\S]*?<\/g>/)[0],defs=roof.vector.source.match(/<defs>[\s\S]*?<\/defs>/)[0],parts=[defs];
 for(let level=0;level<3;level++){
  const floor=-level*gap,top=floor-235;
  for(const x of [-360,155])parts.push(R(x,top+25,205,198,'#645e44'),R(x+12,top+35,181,50,'#aaa984'),R(x+12,top+93,181,115,'#42614e'),R(x+98,top+94,6,114,'#73543a'),R(x+12,top+154,181,6,'#867b52'));
  for(const x of [-392,-128,130,370])parts.push(P([[x,top+12],[x+21,top+12],[x+24,floor-5],[x-2,floor-5]],'#76503b'),R(x+4,top+22,5,205,'#a28254'));
  parts.push(R(-407,top+10,814,15,'#775739'),R(-400,top+25,800,7,'#3e6453'));
  const cabinet=koreanArchiveCabinet(id+'-cabinet-'+level,{width:170,height:142,variant:level});parts.push(`<g transform="translate(-330 ${floor-145})">${body(cabinet.vector.source)}</g>`);
 }
 parts.push(`<g transform="translate(0 -${gap*2})">${roofGroup}</g>`,R(-420,-7,840,17,'#93967c'));
 const a=asset(id,'누형 관창 · 한정된 세 층의 보관회랑',parts.join(''),roof.collision.map(ps=>ps.map(q=>[q.x,q.y-gap*2])),[-458,roof.bounds.y-gap*2,916,-roof.bounds.y+gap*2+19]);
 a.params={koreanType:'limited-three-level-archive',collisionSource:'sampled-drawn-roof',floorHeights:[0,-260,-520],historicalScope:'Fantasy expansion of a raised Korean archive; not a historical reconstruction'};return a;
}
function addArchiveFlights(p,s){
 const cx=5070,cy=2730,rows=[['korean-customs-middle',[[-410,-260],[130,-260],[400,0],[440,0]]],['korean-customs-upper',[[-440,-260],[-410,-260],[-130,-520],[410,-520]]]];
 for(const [id,top]of rows){const poly=[...top,...top.slice().reverse().map(([x,y])=>[x,y+30])],a=asset('a3-korean:23:'+id,'열린 목재 계단과 보관회랑',P(poly,'#786348')+line(top,'#b7a176',5),[poly],[-450,-530,900,575]);a.oneWay=true;a.params={openStairAndGallery:true};element(p,s,a,id,cx,cy);}
 s.design.act3.optionalRoutes.push({id:'customs-upper-storage',points:[{x:5520,y:2730},{x:5480,y:2730},{x:5340,y:2605.19},{x:5200,y:2470},{x:4900,y:2470},{x:4660,y:2470},{x:4790,y:2349.29},{x:4940,y:2210},{x:5350,y:2210}]});
}
function revise23(g,p,s,changes){
 koreanTownEnvironment(p,s,{ground:2720});
 const rows=[['west-shop','shop',620,'gable'],['cloth-hall','shop',620,'gable'],['market-house','office',680,'hip'],['granary','storehouse',700,'gable'],['east-house','house',540,'thatch'],['east-granary','storehouse',640,'gable']];rows.forEach(([id,role,w,roof],i)=>building(p,s,id,role,w,roof,i,changes));
 const obsolete=['office-upper','gate-upper','upper-rear-posts','canal-upper-gallery-rear-piers','west-quay-tower','bridge-tower','canal-watch','central-roof-bridge','east-roof-bridge'];
 for(const id of obsolete){const e=s.elements.find(e=>e.id===id);if(e)recordChange(changes,s,id,e,null,'Remove oversized suspended gallery or unused upper link; required quay and escort remain');}remove(s,obsolete);
 const pavilion=koreanTownBuilding('a3-korean:23:watergate-pavilion',{width:600,role:'pavilion',roofType:'hip'});element(p,s,pavilion,'korean-watergate-pavilion',2015,2600);s.design.act3.mainBuildings.push('korean-watergate-pavilion');
 // Reuse the existing three-arch stone bridge. The new single pavilion is
 // actually seated on its deck, rather than held up by extra-tall timber posts.
 const first=p.library.find(a=>a.id===s.elements.find(e=>e.id==='west-shop').assetId),low=2730+Math.min(...first.collision[0].map(q=>q.y)),upper=2600+Math.min(...pavilion.collision[0].map(q=>q.y));
 replace(p,s,'roof-entry',stairs('a3-korean:23:roof-entry',380,2580-low,{thin:true}),{x:70,y:2580});
 replace(p,s,'roof-west-link',deck('a3-korean:23:low-roof-link',215,24,{rail:false}),{x:900,y:low});
 element(p,s,stairs('a3-korean:23:watergate-roof-access',360,low-upper,{thin:true}),'korean-watergate-roof-access',1450,low);
 replace(p,s,'west-roof-bridge',deck('a3-korean:23:watergate-roof-walk',890,30,{rail:false}),{x:1810,y:upper});
 // Short repair-walk supports end on the neighbouring real roofs. They
 // do not recreate the removed tower-height posts or add collision barriers.
 const compiled=g.HonroMaps.compile(s,p).terrain,braces=[],contacts=[];
 for(const [id,x,top]of [['west-roof-bridge',2450,upper+30],['west-roof-bridge',2605,upper+30],['korean-watergate-roof-access',1550,low-(100/360)*(low-upper)+34]]){
  const hits=compiled.filter(t=>t.honroElementId!==id&&t.honroElementId!=='roof-west-link').flatMap(t=>g.HONRO_CORE.terrainSurfaces(t,x).map(q=>({...q,element:t.honroElementId}))).filter(q=>q.y>=top&&q.y-top<180).sort((a,b)=>a.y-b.y);
  if(!hits.length)continue;const foot=hits[0].y;braces.push(R(x-7,top,14,foot-top,'#6a573b'),R(x-4,top,4,foot-top,'#a18a5e'),R(x-12,foot-5,24,5,'#84734c'));contacts.push({element:id,x,top,bottom:foot,support:hits[0].element});
 }
 const braceAsset=asset('a3-korean:23:roof-repair-braces','낮은 지붕 보수길의 짧은 받침',braces.join(''),[],[1430,upper,1250,400]);braceAsset.params={rearOnly:true,structuralSupports:contacts};element(p,s,braceAsset,'korean-roof-repair-braces',0,0);s.elements.unshift(s.elements.pop());
 for(const id of ['roof-entry','korean-watergate-roof-access']){const el=s.elements.find(e=>e.id===id),a=p.library.find(a=>a.id===el.assetId);a.material='wood';a.vector=compileSVG(a.vector.source.replaceAll('#627676','#746247').replaceAll('#aab29a','#b3a071'));}
 s.design.act3.optionalRoutes=[{id:'western-roof-gallery',points:[{x:40,y:2730,jumpTo:{x:100}},{x:150,y:2580-(80/380)*(2580-low)},{x:430,y:low},{x:650,y:low},{x:960,y:low},{x:1260,y:low},{x:1470,y:low},{x:1810,y:upper},{x:2280,y:upper},{x:2640,y:upper}]}];
 const oldCustoms=clone(s.elements.find(e=>e.id==='customs-hall')),newCustoms=replace(p,s,'customs-hall',limitedArchiveCutaway('a3-korean:23:customs-hall'));recordChange(changes,s,'customs-hall',oldCustoms,newCustoms,'Concentrate multi-storey play into one raised archive with actual 260-unit floors and open timber stairs');addArchiveFlights(p,s);
 const loftGuard=s.units.find(u=>u.id==='a3-23-enemy-7');if(loftGuard){const old=clone(loftGuard);loftGuard.y=2210;changes.push({stage:23,unit:loftGuard.id,reason:'Seat the existing upper guard on the third customs storage floor instead of the removed skeleton',before:old,after:clone(loftGuard)});}
 for(const [i,x,y,w]of [[0,1070,2730,185],[1,2950,2730,250],[2,5540,2730,180],[3,6740,2730,220]])wallScenery(p,s,'korean-quay-wall-'+i,x,y,w,i===1?'tile':'earth');
 s.design.act3.koreanTown={revision:1,scope:'Low canal market, masonry watergate, one short roof route and a limited three-storey archive',removed:obsolete,pavilionSupport:{element:'korean-watergate-pavilion',foundation:'west-water-bridge',floor:2600},requiredQuayUnchanged:true};
}
function revise22(p,s,changes){
 let n=0;for(const a of p.library.filter(a=>a.id.startsWith('a3-22:')&&/archive-shelf-/.test(a.id))){const replacement=koreanArchiveCabinet(a.id,{width:a.bounds.w,height:a.bounds.h,variant:n++});a.vector=replacement.vector;a.params={...a.params,storage:'horizontal-bound-books-and-chests'};}
 // Keep the three playable storage levels, but replace the enormous glowing
 // window walls with small upper paper lights and opaque lower timber doors.
 const parts=[R(500,1490,4740,1290,'#3b493b'),R(620,1515,1580,1255,'#796f50'),R(3500,1515,1600,1255,'#626e50'),R(2390,1500,910,1270,'#7d8a70'),P([[2430,1500],[2690,1500],[3160,2770],[2460,2770]],'#94997c')];
 for(const floor of [1940,2360,2770]){
  for(const left of [675,3515])for(let bay=0;bay<5;bay++){
   const x=left+bay*286,y=floor-254,w=202;
   parts.push(R(x-7,y-8,w+14,222,'#493d2c'),R(x,y,w,62,'#acaa83'),R(x,y+71,w,135,'#416454'),R(x+4,y+77,w*.48-7,123,'#4c6e58'),R(x+w*.51,y+77,w*.48-4,123,'#395a4b'),R(x+w*.5-3,y+71,6,135,'#6c4e36'));
   for(let j=1;j<5;j++)parts.push(R(x+w*j/5,y+4,4,54,'#676846'));parts.push(R(x+4,y+29,w-8,4,'#676846'),R(x+4,y+143,w-8,7,'#7f7752'),R(x+w*.46,y+157,6,17,'#a39564'),R(x+w*.55,y+157,6,17,'#a39564'));
  }
  for(const x of [540,1090,1640,2190,3450,3990,4540,5100])parts.push(P([[x,floor-405],[x+31,floor-405],[x+35,floor-9],[x-3,floor-9]],'#704b36'),R(x+5,floor-394,6,381,'#9a7950'),R(x-8,floor-15,51,15,'#84866c'));
  parts.push(R(526,floor-29,1700,24,'#675337'),R(3434,floor-29,1780,24,'#625036'),R(537,floor-29,1678,5,'#9b875e'),R(3444,floor-29,1758,5,'#93865d'));
 }
 parts.push(R(2620,2550,470,220,'#4e4e36'),R(2634,2565,218,196,'#4f6e55'),R(2867,2565,210,196,'#3e5b49'),R(2610,2544,490,16,'#9a8356'));
 // The panel bays do not overlap one another. Batch their identical fills
 // instead of spending a vector-tree node on every rectangular muntin.
 const paints=new Map();for(const part of parts){const fill=part.match(/fill="([^"]+)"/)[1],d=part.match(/d="([^"]+)"/)[1];if(!paints.has(fill))paints.set(fill,[]);paints.get(fill).push(d);}
 const rearSvg=[...paints].map(([fill,ds])=>`<path fill="${fill}" d="${ds.join(' ')}"/>`).join('');
 replace(p,s,'archive-rear',asset('a3-korean:22:archive-rear','판문과 작은 상부창을 둔 사고 뒤벽',rearSvg,[],[480,1490,4780,1295]));
 for(const [id,width,x] of [['archive-west-roof',1950,1350],['archive-east-roof',1870,4330]]){
  const old=clone(s.elements.find(e=>e.id===id)),full=koreanTownBuilding('a3-korean:22:'+id,{width,role:'office',roofType:'gable'});
  const roofGroup=full.vector.source.match(/<g id="korean-gable-roof">[\s\S]*?<\/g>/)?.[0],defs=full.vector.source.match(/<defs>[\s\S]*?<\/defs>/)?.[0];if(!roofGroup||!defs)throw Error('Missing Korean roof group');full.vector=compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${full.vector.viewBox.join(' ')}">${defs}${roofGroup}</svg>`);full.name='사고 익랑의 긴 맞배지붕';
  const now=replace(p,s,id,full,{x,y:1710});recordChange(changes,s,id,old,now,'Lower oversized roof cap and remove its obsolete closed front box; preserve the three storage floors and attic access');
 }
 const scroll=s.elements.find(e=>e.id==='archive-scrolls');if(scroll){const a=p.library.find(a=>a.id===scroll.assetId);a.vector=compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="2320 1100 1000 1720">${R(2370,1580,34,850,'#65563b')+R(3220,1580,34,850,'#65563b')+R(2345,1740,91,171,'#a79769')+R(3194,1740,91,171,'#a79769')+R(2340,1736,101,10,'#534631')+R(3189,1736,101,10,'#534631')}</svg>`);a.bounds={x:2320,y:1100,w:1000,h:1720};a.reference.bounds=a.bounds;}
 s.design.act3.koreanTown={revision:1,scope:'Korean archive board doors, small upper windows, horizontal folios and a limited fantasy multi-level storage plan',requiredFloorsUnchanged:true,roofBase:1710};
}

export async function buildKoreanTownReview({input=path.join(ROOT,'shared/data/campaign.json'),output=path.join(ROOT,'_local/reports/act3-korean-town/review-project.json')}={}){
 const g=await runtime({legacyMaps:false}),original=JSON.parse(await fs.readFile(input,'utf8')),p=clone(original),changes=[];
 for(const id of [21,22,23]){const s=p.stages.find(s=>s.metadata.stageId===id);if(!s)throw Error('Missing stage '+id);if(id===21)revise21(g,p,s,changes);if(id===22)revise22(p,s,changes);if(id===23)revise23(g,p,s,changes);}
 const authored=g.HonroMaps.finalize(p);if(JSON.stringify(authored.stages.slice(0,20))!==JSON.stringify(original.stages.slice(0,20)))throw Error('Act 1/2 changed');
 const before=g.HonroMaps.finalize(original);for(let i=23;i<30;i++)if(JSON.stringify(authored.stages[i])!==JSON.stringify(before.stages[i]))throw Error('Nonrepresentative stage changed '+(i+1));
 for(const id of [21,22,23]){const a=authored.stages.find(s=>s.metadata.stageId===id),b=before.stages.find(s=>s.metadata.stageId===id);for(const key of ['terrains','materials','markers','events','objectives','routes'])if(JSON.stringify(a[key])!==JSON.stringify(b[key]))throw Error(`Required ${key} changed in ${id}`);}
 const collisions=[];
 const solid=t=>Object.fromEntries(Object.entries(t).filter(([key])=>['id','type','x','y','w','h','points','oneWay','breakable','material','honroElementId'].includes(key)));
 for(const id of [21,22,23]){
  const old=g.HonroMaps.compile(before.stages.find(s=>s.metadata.stageId===id),before).terrain.map(solid);
  const now=g.HonroMaps.compile(authored.stages.find(s=>s.metadata.stageId===id),authored).terrain.map(solid);
  for(const tid of new Set([...old,...now].map(t=>t.id))){const a=old.find(t=>t.id===tid)||null,b=now.find(t=>t.id===tid)||null;if(JSON.stringify(a)!==JSON.stringify(b))collisions.push({stage:id,id:tid,before:a,after:b});}
 }
 await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,JSON.stringify(authored,null,2)+'\n');await fs.writeFile(path.join(path.dirname(output),'collision-change-list.json'),JSON.stringify({baseline:'c97e67d',reviewOnly:true,changes,compiledCollisions:collisions},null,2)+'\n');return{g,p:authored,changes,output};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const r=await buildKoreanTownReview();console.log(JSON.stringify({output:r.output,changes:r.changes.length,reviewOnly:true},null,2));}
