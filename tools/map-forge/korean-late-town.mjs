/** Role-specific Act 3 chapters 24–30; never regenerates or edits earlier chapters. */
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {runtime} from '../../game/tests/helpers.mjs';
import {koreanTownBuilding,koreanCourtyardWall,koreanArchiveCabinet,koreanTownEnvironment} from '../environment/korean-town-art.mjs';
import {koreanRaisedCompound,koreanFoundry,koreanDock} from '../environment/korean-late-town-art.mjs';
import {asset,P,R,line} from './act3-map-kit.mjs';import {compileSVG} from '../environment/build-act2-art.mjs';
const clone=x=>JSON.parse(JSON.stringify(x)),body=svg=>svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
function at(profile,x){for(let i=1;i<profile.length;i++){const a=profile[i-1],b=profile[i];if(x<=b[0])return a[1]+(b[1]-a[1])*Math.max(0,x-a[0])/Math.max(1,b[0]-a[0]);}return profile.at(-1)[1];}
function put(p,s,a,id,x,y){const i=p.library.findIndex(q=>q.id===a.id);if(i<0)p.library.push(a);else p.library[i]=a;let e=s.elements.find(q=>q.id===id);if(e)Object.assign(e,{assetId:a.id,x,y,scale:1});else{s.elements.push(e={id,assetId:a.id,x,y,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back'});}return e;}
const descriptions={24:'후원 저택과 낮은 행랑',25:'판문으로 닫힌 기록각',26:'기와가 무너진 주조 공방과 가마',27:'소각 서고의 실제 지붕 대피길',28:'석축 위 외청 관아와 성벽',29:'석조 수문 위 낮은 누각',30:'창고와 열린 하역 정자가 있는 밤나루'};
const mainRows={
 24:[['family-main-hall',2590,1140,'office','rooms'],['family-shrine-hall',6040,1040,'office','rooms']],
 25:[['hidden-west-record-hall',2720,1180,'archive','rooms'],['hidden-east-record-hall',5215,760,'archive','masonry']],
 26:[['burnt-casting-house',3450,1120,'foundry','piers'],['east-smithy',5480,760,'foundry','piers']],
 27:[['fire-court-open-archive',2400,1220,'archive','rooms']],
 28:[['west-official-record-hall',2440,1140,'office','masonry'],['east-official-record-hall',6330,980,'office','masonry']],
 29:[['sealed-night-storage',2670,1040,'archive','rooms'],['great-sluice-pavilion',6020,970,'pavilion','piers']],
 30:[['main-ferry-pavilion',3110,1040,'dock','piers'],['old-road-loading-pavilion',6810,880,'dock','piers']]
};
function roleFor(id,stage,index){if(/pavilion|watch/.test(id))return 'pavilion';if(/store|granary|kiln|tool|loading/.test(id))return 'storehouse';if(/office|archive|record|study|guard|order|shrine/.test(id))return 'office';if(/shop|ticket|inn/.test(id))return 'shop';return stage===26?'storehouse':index%3===0?'house':'shop';}
export function applyKoreanLateTownProject(g,original,{stages=[24,25,26,27,28,29,30]}={}){
 const p=clone(original),changes=[];
 for(const id of stages){const s=p.stages.find(s=>s.metadata.stageId===id);if(!s||id<24||id>30)throw Error('Invalid late Korean stage '+id);if(s.design.act3.koreanTown?.late)throw Error('Late Korean town already applied: '+id);
  const q=s.design.act3.primaryContour,bank=g.HonroMaps.compile(s,p).terrain.find(t=>t.id==='a3-foundation');if(!q||!bank)throw Error('Missing required contour/foundation '+id);
  const ground=x=>Math.min(...g.HONRO_CORE.terrainSurfaces(bank,x).map(v=>v.y));
  const waterRanges=s.materials.filter(m=>m.kind==='water-pool').map(m=>{const xs=m.points.map(v=>Array.isArray(v)?v[0]:v.x);return[Math.min(...xs),Math.max(...xs)];});
  const overWater=x=>waterRanges.some(([l,r])=>x>l&&x<r);
  const supports=(x,width,floor)=>[-.40,-.13,.14,.40].map(k=>({x:width*k,y:Math.max(0,ground(x+width*k)-floor)}));
  const changed=(e,a,x,y,reason)=>{changes.push({stage:id,element:e.id,reason,before:clone(e),after:{assetId:a.id,x,y,scale:1}});return put(p,s,a,e.id,x,y);};
  koreanTownEnvironment(p,s,{ground:{24:2700,25:2920,26:2800,27:2700,28:2720,29:2700,30:2740}[id],night:id>=28,context:{24:'garden',25:'archive',26:'foundry',27:'archive',28:'rampart',29:'rampart',30:'ferry'}[id]});
  const oldWings=s.elements.filter(e=>s.design.act3.mainBuildings.includes(e.id)&&p.library.find(a=>a.id===e.assetId)?.params?.style);
  for(const [i,e]of oldWings.entries()){
   const old=p.library.find(a=>a.id===e.assetId),role=roleFor(e.id,id,i),width=Math.min(old.bounds.w-100,role==='house'?390:role==='storehouse'?440:role==='pavilion'?410:560),roofType=role==='house'?(i%2?'gable':'thatch'):role==='pavilion'||role==='office'&&i%2?'hip':'gable';
   let a=koreanTownBuilding(`a3-korean:${id}:${e.id}`,{width,role,roofType,variant:i,burnt:id===26||id===27&&i<5});
   const isRoof=id===27&&['first-roof-gallery','high-record-gallery','rear-roof-gallery'].includes(e.id);
   const peak=Math.min(...a.collision[0].map(v=>v.y)),x=e.x;
   const floor=isRoof?at(q,x)-peak:Math.min(at(q,x-width/2-80),at(q,x),at(q,x+width/2+80));
   const foot=ground(x),depth=Math.max(0,foot-floor);
   if(depth>30){const parts=[],l=-width/2,r=width/2;
    if(id===28||depth>200&&id!==30&&!overWater(x)){const terrace=[24,26,27,29].includes(id),xs=[x+l-12,...q.filter(v=>v[0]>x+l-12&&v[0]<x+r+13).map(v=>v[0]),x+r+13],base=terrace?xs.slice().reverse().map(xx=>[xx-x,Math.max(0,Math.min(depth,at(q,xx)+36-floor))]):[[r+13,depth],[l-12,depth]];parts.push(P([[l+14,0],[r-14,0],...base],id===28?'#738169':'#74836e'));if(id===28)for(let n=0;n<3;n++){const yy=15+n*Math.max(40,(depth-20)/3);parts.push(P([[l+24,yy],[l+width*.48,yy-4],[l+width*.48+5,Math.min(depth-5,yy+65)],[l+30,Math.min(depth-2,yy+69)]],n%2?'#939980':'#849178'));}}
    else for(const v of supports(x,width,floor))parts.push(R(v.x-17,0,34,v.y,'#697b68'),R(v.x-11,2,7,Math.max(0,v.y-2),'#a0a88a'));
    parts.push(body(a.vector.source));const solids=a.collision.map(poly=>poly.map(v=>[v.x,v.y]));
    if(isRoof){const plinth=[[l+14,0],[r-14,0],[r+13,depth],[l-12,depth]];solids.push(plinth);parts.unshift(P(plinth,'#6b7b66'));}
    const aa=asset(a.id,a.name+' · 지형에 붙은 기단',parts.join(''),solids,[a.bounds.x,a.bounds.y,a.bounds.w,depth-a.bounds.y+12]);aa.params={...a.params,structuralSupports:supports(x,width,floor),roofRoute:isRoof,solidPlinth:isRoof};a=aa;
   }
   changed(e,a,x,floor,isRoof?'Place drawn roof ridge at the existing escape deck and make its supporting plinth solid':'Low role-specific Korean building on a supported terrace; keep required contour unchanged');
  }
  for(const [i,[name,x,width,role,foundation]]of mainRows[id].entries()){
   const e=s.elements.find(e=>e.id===name);if(!e)throw Error('Missing main structure '+name);const floor=at(q,x),feet=supports(x,width,floor),baseDepth=Math.max(0,ground(x)-floor),aid=`a3-korean:${id}:${name}`;
   let a=role==='foundry'?koreanFoundry(aid,{width,baseDepth,supports:feet,variant:i}):role==='dock'?koreanDock(aid,{width,supports:feet,variant:i}):koreanRaisedCompound(aid,{width,role,roofType:role==='pavilion'?'hip':'gable',baseDepth,foundation,supports:feet,variant:i,burnt:id===27});
   if(id===29&&name==='great-sluice-pavilion'){
    const old=p.library.find(a=>a.id===e.assetId),piers=old.collision.filter(poly=>Math.min(...poly.map(v=>v.y))>=-385),shift=e.y-floor;
    const solids=piers.map(poly=>poly.map(v=>[v.x,v.y+shift])),stone=solids.map(poly=>P(poly,'#667e70')).join('');
    const xs=solids.flat().map(v=>v[0]),left=Math.min(a.bounds.x,...xs)-4,right=Math.max(a.bounds.x+a.bounds.w,...xs)+4;a.bounds={...a.bounds,x:left,w:right-left};a.reference.bounds=a.bounds;a.vector=compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${a.bounds.x} ${a.bounds.y} ${a.bounds.w} ${a.bounds.h}">${stone}${body(a.vector.source)}</svg>`);a.collision.push(...solids.map(poly=>poly.map(([x,y])=>({x,y}))));a.params.retainedSluicePierSolids=solids.length;
   }
   a.reference.foot={x:0,y:Math.max(0,baseDepth)};changed(e,a,x,floor,'Replace oversized main hall with a Korean '+role+' tied to the actual upper circulation floor');
  }
  // Rebuild only the actual route's rear supports. Old hall-specific posts
  // must not remain suspended after a facade has become narrower or moved.
  const rear=s.elements.find(e=>e.id==='grounded-rear-architecture');
  if(rear){const pieces=[];
   if(id===28){const wall=[...q.map(([x,y])=>[x,y+36]),...q.slice().reverse().map(([x])=>[x,ground(x)])];pieces.push(P(wall,'#6d7c69'));for(const x of [1550,2830,4230,5680,6800]){const y=at(q,x)+78,h=Math.max(20,ground(x)-y-30);pieces.push(P([[x,y],[x+124,y-8],[x+137,y+h],[x+8,y+h+9]],'#819078'));}}
   else for(let x=450;x<s.width-100;x+=470){const y=at(q,x)+36,end=ground(x);if(end-y>45)pieces.push(P([[x-17,y],[x+18,y],[x+27,end],[x-26,end]],id===30?'#695b41':'#687c6c'),R(x-10,y+6,6,Math.max(1,end-y-12),id===30?'#9a8258':'#97a088'));}
   if([24,26,27,29].includes(id)){
    let start=0;const spans=[];for(const [l,r]of waterRanges.sort((a,b)=>a[0]-b[0])){if(l>start)spans.push([start,l]);start=Math.max(start,r);}if(start<s.width)spans.push([start,s.width]);
    for(const [l,r]of spans){const xs=[l,...q.filter(v=>v[0]>l&&v[0]<r).map(v=>v[0]),r],top=xs.map(x=>[x,Math.min(ground(x),at(q,x)+36)]),base=xs.slice().reverse().map(x=>[x,ground(x)]);if(top.some(([x,y])=>ground(x)-y>30)){pieces.push(P([...top,...base],'#74836e'));const shade=xs.map(x=>[x,Math.min(ground(x),at(q,x)+125)]);pieces.push(P([...shade,...base],'#6b7b66'));}}
   }
   const a=asset(`a3-korean:${id}:grounded-route-supports`,'실제 회랑을 받치는 후경 기단',pieces.join(''),[],[0,1400,s.width,s.height-1380],'stone');a.params={rearOnly:true,requiredContourSupport:true};put(p,s,a,rear.id,0,0);
  }
  // Low walls explain courtyards without adding collision or painting new floors.
  for(const [i,x]of [780,s.width*.48,s.width-540].entries()){const y=at(q,x),a=koreanCourtyardWall(`a3-korean:${id}:courtyard-${i}`,{width:190+i*20,height:76,cap:id===24||id===28?'tile':'earth'});put(p,s,a,'korean-courtyard-'+i,x,y);}
  if(id===25){const old=s.elements.find(e=>e.id==='record-house-rear-cutaway');if(old){const a=p.library.find(a=>a.id===old.assetId),parts=[];for(const [x,y,w]of [[2100,2500,520],[2960,2500,480],[4840,2220,520]]){const c=koreanArchiveCabinet(a.id+'-'+x,{width:w,height:215});parts.push(`<g transform="translate(${x} ${y-215})">${body(c.vector.source)}</g>`);}a.vector=compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="970 1670 5270 1280">${parts.join('')}</svg>`);a.params.storage='horizontal-bound-books-and-chests';}}
  s.design.act3.koreanTown={revision:1,late:true,scope:descriptions[id],requiredContourUnchanged:true,mainStructures:mainRows[id].map(row=>row[0])};
 }
 const out=g.HonroMaps.finalize(p),before=g.HonroMaps.finalize(original);
 if(JSON.stringify(out.stages.slice(0,23))!==JSON.stringify(original.stages.slice(0,23)))throw Error('Latest canonical stages 1–23 changed');
 for(const s of out.stages){const old=before.stages.find(v=>v.id===s.id);if(!stages.includes(s.metadata.stageId)){if(JSON.stringify(s)!==JSON.stringify(old))throw Error('Unselected stage changed '+s.id);continue;}for(const key of ['terrains','materials','markers','events','objectives','routes','units','anchors'])if(JSON.stringify(s[key])!==JSON.stringify(old[key]))throw Error(`Required ${key} changed in ${s.id}`);if(JSON.stringify(s.design.act3.requiredRoute)!==JSON.stringify(old.design.act3.requiredRoute))throw Error('Required route changed');}
 const collisions=[],solid=t=>Object.fromEntries(Object.entries(t).filter(([k])=>['id','x','y','w','h','vertices','mat','oneWay','indestructible','honroElementId'].includes(k)));
 for(const id of stages){const a=g.HonroMaps.compile(before.stages.find(s=>s.metadata.stageId===id),before).terrain.map(solid),b=g.HonroMaps.compile(out.stages.find(s=>s.metadata.stageId===id),out).terrain.map(solid);for(const tid of new Set([...a,...b].map(t=>t.id))){const x=a.find(t=>t.id===tid)||null,y=b.find(t=>t.id===tid)||null;if(JSON.stringify(x)!==JSON.stringify(y))collisions.push({stage:id,id:tid,before:x,after:y});}}
 return{p:out,changes,collisions};
}
export async function buildKoreanLateReview({input=path.join(ROOT,'shared/data/campaign.json'),output=path.join(ROOT,'_local/reports/act3-korean-late/review-project.json'),stages}={}){const g=await runtime({legacyMaps:false}),original=JSON.parse(await fs.readFile(input,'utf8')),r=applyKoreanLateTownProject(g,original,{stages});await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,JSON.stringify(r.p,null,2)+'\n');await fs.writeFile(path.join(path.dirname(output),'collision-change-list.json'),JSON.stringify({input,reviewOnly:true,changes:r.changes,compiledCollisions:r.collisions},null,2)+'\n');return{...r,output};}
if(process.argv[1]===fileURLToPath(import.meta.url)){const arg=(k,d)=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1];};const r=await buildKoreanLateReview({input:arg('--input',undefined),output:arg('--output',undefined),stages:arg('--stages',null)?.split(',').map(Number)});console.log(JSON.stringify({output:r.output,changes:r.changes.length,collisions:r.collisions.length,reviewOnly:true}));}
