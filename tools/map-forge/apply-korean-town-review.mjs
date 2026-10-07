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
 const stone=P([...top,...bottom],'#737e69')+line(top,'#9ba48b',7)+line([[1900,2450],[2460,2250],[3540,2250]],'#566c5f',5);
 const e=element(p,s,asset('a3-korean:21:stair-retaining-wall','석축에 붙은 성벽 오름길',stone,[],[1690,1940,1920,730],'stone'),'korean-gate-retaining-wall',0,0);s.elements.unshift(s.elements.pop());
 const shop=p.library.find(a=>a.id===s.elements.find(e=>e.id==='entry-shop').assetId),peak=2640+Math.min(...shop.collision[0].map(p=>p.y));
 replace(p,s,'market-roof-stair',stairs('a3-korean:21:market-roof-stair',370,2495-peak,{thin:true}),{x:130,y:2495});
 for(const [i,x,y,w]of [[0,920,2640,180],[1,3700,2500,210],[2,5630,2500,230]])wallScenery(p,s,'korean-street-wall-'+i,x,y,w,i===1?'tile':'earth');
 const route=s.design.act3.optionalRoutes.find(r=>r.id==='gate-battlement');route.points=route.points.map(q=>q.x===3480?{...q,y:1960,support:'gate-wall-walk:collision:0'}:q);
 s.design.act3.koreanTown={revision:1,scope:'Gate masonry, low everyday street and courtyard hierarchy',roofChanges:rows.map(r=>r[0]).concat('gate-tower','market-roof-stair'),rearOnly:['west-gate-wing','east-gate-wing']};
}
function revise23(g,p,s,changes){
 koreanTownEnvironment(p,s,{ground:2720});
 const rows=[['west-shop','shop',620,'gable'],['cloth-hall','shop',620,'gable'],['market-house','office',680,'hip'],['granary','storehouse',700,'gable'],['customs-hall','office',820,'hip'],['east-house','house',540,'thatch'],['east-granary','storehouse',640,'gable']];rows.forEach(([id,role,w,roof],i)=>building(p,s,id,role,w,roof,i,changes));
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
 s.design.act3.optionalRoutes=[{id:'western-roof-gallery',points:[{x:40,y:2730,jumpTo:{x:100}},{x:150,y:2580-(80/380)*(2580-low)},{x:430,y:low},{x:650,y:low},{x:960,y:low},{x:1260,y:low},{x:1470,y:low},{x:1810,y:upper},{x:2280,y:upper},{x:2640,y:upper}]}];
 const loftGuard=s.units.find(u=>u.id==='a3-23-enemy-7');if(loftGuard){const old=clone(loftGuard),a=p.library.find(a=>a.id===s.elements.find(e=>e.id==='customs-hall').assetId);loftGuard.y=2730+Math.min(...a.collision[0].map(q=>q.y));changes.push({stage:23,unit:loftGuard.id,reason:'Seat the existing roof guard on the lower customs roof instead of the removed upper skeleton',before:old,after:clone(loftGuard)});}
 for(const [i,x,y,w]of [[0,1070,2730,185],[1,2950,2730,250],[2,5540,2730,180],[3,6740,2730,220]])wallScenery(p,s,'korean-quay-wall-'+i,x,y,w,i===1?'tile':'earth');
 s.design.act3.koreanTown={revision:1,scope:'Low canal market, masonry watergate and a single short roof route',removed:obsolete,pavilionSupport:{element:'korean-watergate-pavilion',foundation:'west-water-bridge',floor:2600},requiredQuayUnchanged:true};
}
function revise22(p,s,changes){
 let n=0;for(const a of p.library.filter(a=>a.id.startsWith('a3-22:')&&/archive-shelf-/.test(a.id))){const replacement=koreanArchiveCabinet(a.id,{width:a.bounds.w,height:a.bounds.h,variant:n++});a.vector=replacement.vector;a.params={...a.params,storage:'horizontal-bound-books-and-chests'};}
 s.design.act3.koreanTown={revision:1,scope:'Horizontal bound records and chests; rear wall/roof review follows',requiredFloorsUnchanged:true};
}
export async function buildKoreanTownReview({input=path.join(ROOT,'shared/data/campaign.json'),output=path.join(ROOT,'_local/reports/act3-korean-town/review-project.json')}={}){
 const g=await runtime({legacyMaps:false}),original=JSON.parse(await fs.readFile(input,'utf8')),p=clone(original),changes=[];
 for(const id of [21,22,23]){const s=p.stages.find(s=>s.metadata.stageId===id);if(!s)throw Error('Missing stage '+id);if(id===21)revise21(g,p,s,changes);if(id===22)revise22(p,s,changes);if(id===23)revise23(g,p,s,changes);}
 const authored=g.HonroMaps.finalize(p);if(JSON.stringify(authored.stages.slice(0,20))!==JSON.stringify(original.stages.slice(0,20)))throw Error('Act 1/2 changed');
 const before=g.HonroMaps.finalize(original);for(let i=23;i<30;i++)if(JSON.stringify(authored.stages[i])!==JSON.stringify(before.stages[i]))throw Error('Nonrepresentative stage changed '+(i+1));
 for(const id of [21,22,23]){const a=authored.stages.find(s=>s.metadata.stageId===id),b=before.stages.find(s=>s.metadata.stageId===id);for(const key of ['terrains','materials','markers','events','objectives','routes'])if(JSON.stringify(a[key])!==JSON.stringify(b[key]))throw Error(`Required ${key} changed in ${id}`);}
 await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,JSON.stringify(authored,null,2)+'\n');await fs.writeFile(path.join(path.dirname(output),'collision-change-list.json'),JSON.stringify({baseline:'c97e67d',reviewOnly:true,changes},null,2)+'\n');return{g,p:authored,changes,output};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const r=await buildKoreanTownReview();console.log(JSON.stringify({output:r.output,changes:r.changes.length,reviewOnly:true},null,2));}
