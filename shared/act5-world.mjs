import {readFile} from 'node:fs/promises';
import {preserveCompound} from '../tools/vector-production/preserve-compound.mjs';
import {chapters,cast} from './data/act5/chapters.mjs';
import {combat} from './data/act5/combat.mjs';
import {terrain} from './data/act5/terrain.mjs';

const name = '저승이 닿은 산';
const panorama = ['forestFar','valleyFar','stillNight','root-interior','stillNight','act5Skywell','act5Skywell','act5Skywell','act5Skywell','act5BrokenRidge'];
export const far = [
 ['act5Skywell','../act5/skywell.webp'], ['act5BrokenRidge','../act5/broken-ridge.webp']
];
export const farStages = Object.fromEntries(panorama.map((key,i)=>[41+i,{key,portrait:key==='act5Skywell',kind:i===3||i>=5&&i<=8?'interior':'outdoor'}]));
// Dedicated illustrated atlas. Coordinates refer to the 1024 × 1536 painting,
// not battle terrain: changing this definition never moves gameplay entities.
const mapPins=[[135,221],[513,184],[862,173],[111,433],[313,495],[589,470],[751,658],[620,1220],[147,999],[792,1196]];
const mapLabels=['군영 들머리','산중 성책','버려진 성채','귀림','서낭고개','하늘우물 입구','부유 석단','우물 아래 길','역류 계곡','산이 끊긴 곳'];
const mapOffsets=[[-42,35],[0,38],[-70,38],[58,-30],[-20,38],[-30,-42],[45,-40],[40,35],[45,35],[0,40]];
export const journey={act:5,title:name,width:1024,height:1536,asset:'shared/assets/journey-maps/v1/act5.webp',
 stages:chapters.map((c,i)=>({stageNumber:41+i,stageId:'stage-'+(41+i),title:c.name,mapLabel:mapLabels[i],x:mapPins[i][0],y:mapPins[i][1],labelOffsetX:mapOffsets[i][0],labelOffsetY:mapOffsets[i][1]})),
 progressRoutes:[
  'M135 221 C260 265 338 229 410 210 Q463 198 513 184',
  'M513 184 C650 213 720 258 769 224 Q806 196 862 173',
  'M862 173 C800 270 640 286 480 270 S180 280 111 433',
  'M111 433 Q150 534 224 525 Q264 515 313 495',
  'M313 495 Q407 548 484 516 Q527 470 589 470',
  'M589 470 Q727 469 822 497 C925 535 867 603 751 658',
  'M751 658 Q850 681 880 717 C925 840 842 932 853 1011 Q871 1135 620 1220',
  'M620 1220 Q475 1200 267 1227 Q130 1212 150 1148 Q183 1060 147 999',
  'M147 999 Q183 1060 150 1148 Q130 1212 267 1227 Q461 1202 620 1220 Q701 1232 792 1196'
 ]};
export const clock = Object.fromEntries(chapters.map((chapter,i)=>[41+i,{
 day:5,start:chapter.clock,end:chapters[i+1]?.clock||'03:25',endRound:chapter.rounds[1],
 profile:i>=3?'act5-night':'default',moon:'act5',sky:![3,5,6,7,8].includes(i),clouds:.18
}]));

const crossings = {
 42:[['성책 사다리 오르기',[615,327],[635,213]]],
 43:[['성벽 돌계단 오르기',[264,322],[304,256]],['지휘소 돌계단 오르기',[757,218],[790,169]]],
 44:[['아래 골에서 뿌리 능선으로 오르기',[787,303],[805,226]]],
 46:[
  ['서쪽 밧줄로 첫 석단에 내려가기',[253,387],[280,483],'기억진목 쪽으로 올라가기'],
  ['밧줄로 중앙 큰 석단 건너기',[333,483],[588,497],'서쪽 첫 석단으로 건너가기'],
  ['동쪽 절벽으로 밧줄 건너기',[715,497],[824,487],'중앙 큰 석단으로 건너가기'],
  ['동쪽 밧줄로 출구 턱에 내려가기',[927,782],[865,912],'동쪽 상부 턱으로 올라가기'],
  ['동쪽 붕괴턱에서 출구 턱 오르기',[850,1286],[901,911],'출구에서 동쪽 붕괴턱으로 내려가기'],
  ['우물 바닥에서 동쪽 붕괴턱 오르기',[790,1425],[827,1286],'동쪽 붕괴턱에서 우물 바닥으로 내려가기'],
  ['중앙 고리에서 중간 석단 오르기',[513,940],[474,553],'중간 석단에서 중앙 고리로 내려가기'],
  ['중간 석단에서 중앙 큰 석단 오르기',[514,553],[560,497],'중앙 큰 석단에서 중간 석단으로 내려가기'],
  ['아래 제단에서 중앙 고리 오르기',[538,1080],[560,940],'중앙 고리에서 아래 제단으로 내려가기'],
  ['고리 왼쪽 밧줄로 서쪽 낮은 석단 오르기',[298,940],[319,660],'서쪽 낮은 석단에서 고리로 내려가기'],
  ['서쪽 낮은 석단에서 첫 석단 오르기',[350,660],[307,483],'첫 석단에서 서쪽 낮은 석단으로 내려가기'],
  ['왼쪽 절벽 네 번째 턱에서 오르기',[107,1214],[65,1017],'왼쪽 절벽 네 번째 턱으로 내려가기'],
  ['왼쪽 절벽 세 번째 턱에서 오르기',[103,1017],[61,812],'왼쪽 절벽 세 번째 턱으로 내려가기'],
  ['왼쪽 절벽 두 번째 턱에서 오르기',[100,812],[67,613],'왼쪽 절벽 두 번째 턱으로 내려가기'],
  ['왼쪽 절벽 첫 턱에서 기억진목으로 오르기',[97,613],[89,387],'기억진목에서 왼쪽 절벽 첫 턱으로 내려가기'],
  ['동쪽 중간 턱에서 위 절벽으로 오르기',[953,782],[922,487],'위 절벽에서 동쪽 중간 턱으로 내려가기']
 ],
 47:[['절벽의 이어진 돌계단 오르기',[781,585],[804,463]]],
 49:[['아래쪽 징검길로 내려가기',[148,1028],[169,1240]],['협곡 진목길 올라가기',[899,1220],[924,960]],['중층 돌계단 올라가기',[947,960],[961,685]],['상층 돌계단 올라가기',[972,685],[980,380]]],
 50:[['산문 아래 돌계단 오르기',[913,304],[930,212]],['산문 앞 돌계단 오르기',[963,206],[962,144]]]
};
const length = (a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function snap(lines,x,y) {
 const hits=[];
 for(const [,points] of lines)for(let i=1;i<points.length;i++){
  const [ax,ay]=points[i-1],[bx,by]=points[i];
  if(x>=ax&&x<=bx&&bx>ax)hits.push(ay+(x-ax)*(by-ay)/(bx-ax));
 }
 if(!hits.length)throw Error('No Act 5 support for '+[x,y]);
 return hits.sort((a,b)=>Math.abs(a-y)-Math.abs(b-y))[0];
}
function vectorPaths(node){
 const {sourcePath,children,...rest}=node;
 if(sourcePath)return {...rest,...preserveCompound(sourcePath)};
 return children?{...rest,children:children.map(vectorPaths)}:rest;
}
// Side walls and the lower catchment stop arrows and bodies. Interior shelves
// retain their authored one-way drops so the visible shaft stays open.
const solids={
 46:[
  ['left-cliff',[[0,0],[42,96],[48,245],[45,387],[35,611],[34,1008],[43,1214],[36,1370],[47,1536],[0,1536]]],
  ['right-cliff',[[1024,312],[968,374],[958,486],[966,775],[916,909],[930,1090],[888,1212],[803,1410],[849,1536],[1024,1536]]]
 ]
};
const groundIds=new Set(['lower-road','supply-road','gate-road','root-floor','pass-road']);
const layerIds=['far','mid','back','structural-back','terrain','interactive','prop','units','events','front','L2','L3','L4','L5'];
export async function makeAct5(){
 const imports=JSON.parse(await readFile(new URL('./assets/environment/act5/near-import.json',import.meta.url),'utf8'));
 if(imports.length!==chapters.length)throw Error('Act 5 terrain count does not match the chapter list');
 const campExterior=Object.fromEntries(await Promise.all([['west','camp-west-geology'],['east','camp-east-geology'],['deep','camp-deep-geology']].map(async([key,file])=>[key,JSON.parse(await readFile(new URL('./assets/environment/act5/'+file+'.json',import.meta.url),'utf8'))])));
 const stage43Continuity=Object.fromEntries(await Promise.all(['deep','west','contact'].map(async key=>[key,JSON.parse(await readFile(new URL('./assets/environment/act5/stage43-continuity-'+key+'.json',import.meta.url),'utf8'))])));
 const stage42Wall=JSON.parse(await readFile(new URL('./assets/environment/act5/stage42-registered-body.json',import.meta.url),'utf8'));
 const stage42Surface=JSON.parse(await readFile(new URL('./assets/environment/act5/stage42-surface.json',import.meta.url),'utf8'));
 const stage44CanopyBase=JSON.parse(await readFile(new URL('./assets/environment/act5/stage44-canopy-base-clip.json',import.meta.url),'utf8'));
 const stage44Canopy=JSON.parse(await readFile(new URL('./assets/environment/act5/stage44-upper-canopy.json',import.meta.url),'utf8'));
 const stage45DepthClips=JSON.parse(await readFile(new URL('./assets/environment/act5/stage45-depth-clips.json',import.meta.url),'utf8'));
 const stage45Clips=JSON.parse(await readFile(new URL('./assets/environment/act5/stage45-preserved-clips.json',import.meta.url),'utf8'));
 const stage46Tree=JSON.parse(await readFile(new URL('./assets/environment/act5/stage46-tree-completion.json',import.meta.url),'utf8'));
 const stage46ExteriorParts=await Promise.all([1,2,3,4,5].map(async part=>JSON.parse(await readFile(new URL('./assets/environment/act5/stage46-exterior-part-'+part+'.json',import.meta.url),'utf8'))));
 const stage46Protected=JSON.parse(await readFile(new URL('./assets/environment/act5/stage46-protected-clips.json',import.meta.url),'utf8'));
 const stage46Exterior=JSON.parse(await readFile(new URL('./assets/environment/act5/stage46-exterior-body.json',import.meta.url),'utf8'));
 const stage47Exterior=JSON.parse(await readFile(new URL('./assets/environment/act5/stage47-continuous-rock.json',import.meta.url),'utf8'));
 const stage48Seam=JSON.parse(await readFile(new URL('../art/stage48-continuity/source-seam.json',import.meta.url),'utf8'));
 const stage48Support=JSON.parse(await readFile(new URL('../art/stage48-continuity/support-mask-v9.json',import.meta.url),'utf8'));
 const stage48Composition=JSON.parse(await readFile(new URL('../art/stage48-continuity/composition-v12.json',import.meta.url),'utf8'));
 const stage48JointRegion=JSON.parse(await readFile(new URL('../art/stage48-continuity/joint-region-v12.json',import.meta.url),'utf8'));
 const stage48Joint=JSON.parse(await readFile(new URL('./assets/environment/act5/stage48-joint-v12.json',import.meta.url),'utf8'));
 const stage48Body=JSON.parse(await readFile(new URL('./assets/environment/act5/stage48-continuous-v11-bleed.json',import.meta.url),'utf8'));
 const stage45Body=JSON.parse(await readFile(new URL('./assets/environment/act5/stage45-root-body.json',import.meta.url),'utf8'));
 const stage44Roots=JSON.parse(await readFile(new URL('./assets/environment/act5/stage44-root-exterior.json',import.meta.url),'utf8'));
 const library=[],stages=[],content=[];
 for(const [i,chapter] of chapters.entries()){
  const id=41+i,source=imports[i],g=terrain[i];
  if(source.id!==id||!(/^[0-9a-f]{64}$/).test(source.sha256))throw Error('Invalid Act 5 terrain provenance '+id);
  const {vector,sha256}=source,scale=g.width/1024,height=Math.ceil(vector.viewBox[3]*g.width/vector.viewBox[2])+360;
  const toWorld=([x,y])=>({x:Math.round(x*scale*100)/100,y:Math.round(y*scale*100)/100});
  const contact=(x,y)=>toWorld([x,snap(g.lines,x,y)]);
  const spec=combat[i],start=contact(...g.start),exit=contact(...(spec.exit||g.exit));
  const sites=Object.fromEntries(Object.entries({...g.sites,...spec.sites}).map(([key,p])=>[key,contact(...p)]));
  if(spec.flow.some(([,key])=>key!=='roots'&&!sites[key]))throw Error('Missing Act 5 objective site: '+id);
  sites.roots??=sites.root;
  sites.exit=exit;
  const assetId='act5:near:'+id,view=vector.viewBox,bounds={x:0,y:0,w:view[2],h:view[3]};
  const artworkScale=g.width/view[2],enclosed=chapter.theme==='cave',backdrop=enclosed?'temple':chapter.theme;
  library.push({id:assetId,name:chapter.name+' · 근경',category:'rock',visual:[],collision:[],sockets:[],tags:['terrain','act5'],anchor:{x:0,y:0},params:{sourceSha256:sha256},
   ...(id===46?{shaftExterior:stage46Exterior,shaftProtected:stage46Protected,shaftExteriorParts:stage46ExteriorParts,shaftTree:stage46Tree}:{}),...(id===43?{nativeContinuity:stage43Continuity}:{}),...(id===47?{shaftExterior:stage47Exterior}:{}),...(id===48?{continuousBody:stage48Body,compositionMasks:stage48Composition,jointBody:stage48Joint,jointRegion:stage48JointRegion.clip,sourceSeam:stage48Seam.clip,sourceNativeClips:stage48Seam.sourceNativeClips,supportClip:stage48Support.clip}:{}),...(id===45?{continuousBody:stage45Body,depthClips:stage45DepthClips,preservedClips:stage45Clips}:{}),...(id===44?{rootExterior:stage44Roots,rootUpperClip:stage44CanopyBase,upperCanopy:stage44Canopy}:{}),...(id===41?{campExterior}:{}),...(id===42?{edgeWall:stage42Wall,edgeSurface:stage42Surface}:{}),bounds,reference:{heightM:view[3]*artworkScale/60,bounds,foot:{x:0,y:view[3]},scaleRange:[1,8],backgroundRange:[1,8]},vector:{...vector,root:vectorPaths(vector.root),...(Object.keys(vector.symbols).length?{symbols:Object.fromEntries(Object.entries(vector.symbols).map(([key,node])=>[key,vectorPaths(node)]))}:{})}});
  const path=(points)=>points.map(toWorld);
  const surfaces=g.lines.map(([key,points])=>({
   id:'a5-'+key,name:key,type:groundIds.has(key)?'ground':'platform',oneWay:!groundIds.has(key),
   control:path(points),thickness:38,floor:height-358,baseMaterial:'rock',breakable:false,
   detail:{interpolation:'linear',spacing:30,roughness:0},properties:{honroAct5Painted:true},layer:'terrain'
  }));
  for(const [key,points] of solids[id]||[])surfaces.push({id:'a5-'+key,name:key,type:'solid',points:path(points),
   oneWay:false,baseMaterial:'rock',breakable:false,layer:'terrain',properties:{honroAct5Painted:true}});
  const links=(crossings[id]||[]).flatMap(([label,from,to,back],j)=>[
   {id:'a5-cross-'+(2*j),label,...contact(...from),to:contact(...to)},
   {id:'a5-cross-'+(2*j+1),label:back||'이전 발판으로 돌아가기',...contact(...to),to:contact(...from)}]);
  for(const link of links)if(length([link.x,link.y],[link.to.x,link.to.y])>1560)throw Error('Act 5 crossing too long: '+id);
  const objectives=[];
  const units=cast.map((kind,j)=>({id:'p-'+kind,kind,team:'player',...contact(g.start[0]+j*11,g.start[1])}));
 const groups={},waves=[],required={};
  for(const [j,device] of (spec.devices||[]).entries()){
   const {key,x,y,label,hp}=device,unitId='a5-device-'+j,p=contact(x,y);
   (groups[key]??=[]).push(unitId);
   surfaces.push({id:unitId,name:label,type:'solid',baseMaterial:'wood',breakable:true,layer:'terrain',
    points:[{x:p.x-27,y:p.y-87},{x:p.x+27,y:p.y-87},{x:p.x+27,y:p.y},{x:p.x-27,y:p.y}],properties:{hp,maxHp:hp}});
   objectives.push({id:'a5-destroy-'+j,type:'destroy',targetId:unitId,label});
  }
  const wakeGroups={};
  let serial=0;
  for(const [index,pack] of spec.packs.entries()){
   const staged=[];
   if(pack.wake){
    const {keys=[],distance=255,height,after}=pack.wake;
    if(!Number.isFinite(distance)||distance<=0||after&&!spec.flow.some(([,key])=>key===after))
     throw Error('Invalid Act 5 engagement range: '+id+' '+pack.key);
    wakeGroups[index]={keys,distance:distance*scale,...(height===undefined?{}:{height:height*scale}),...(after?{after}:{})};
   }
   for(const {kind,label,x,y,special,lift,pattern} of pack.members){
    const id='a5-foe-'+serial++,pose=contact(x,y),flying=['bat','crow','lantern'].includes(kind);
    if(flying)pose.y-=lift===undefined?155+(serial%3)*47:lift*scale;
    (groups[pack.key]??=[]).push(id);
    if(spec.required?.[pack.key]?.includes(x))(required[pack.key]??=[]).push(id);
    staged.push(id);
    units.push({id,kind,label,team:'enemy',facing:-1,...pose,spawnIndex:serial,encounterGroup:pack.key,
     stageOverrides:{group:index,elite:special==='elite',honroAct5Role:special||'regular',
      ...(special==='commander'?{honroMidboss:true,fixed:true,loadout:['A02','A03','A07']}:{}),
      ...(special==='elite'?{honroMidboss:true}:{}),...(pattern?{honroMonsterPattern:pattern}:{}),
      ...(pack.wave?{dead:true,honroAct5Reserve:true}:{})}});
   }
   if(pack.wave){
    const {entry,fallback,...conditions}=pack.wave;
    waves.push({...conditions,id:pack.key+'-'+index,units:staged,
     ...(entry?{entry:contact(...entry)}:{}),...(fallback?{fallback:contact(...fallback)}:{})});
   }
  }
  const counted=units.filter(u=>u.team==='enemy'),initial=counted.filter(u=>!u.stageOverrides.dead).length;
  for(const [type,key,,blockers] of spec.flow){
   if(['fight','subdue'].includes(type)&&!groups[key]?.length)throw Error('Empty Act 5 combat objective '+id+' '+key);
   if(['escort','subdue'].includes(type)&&blockers&&!required[blockers]?.length)throw Error('Empty Act 5 objective guards '+id+' '+blockers);
  }
  for(const [key,positions] of Object.entries(spec.required||{})){
   if(required[key]?.length!==positions.length)throw Error('Act 5 priority targets do not match '+id+' '+key);
  }
  for(const wave of waves)if(!spec.flow.some(([,key])=>key===wave.key))throw Error('Unused Act 5 wave '+wave.id);
  const passages=spec.passages||{},checkpoints=new Set();
  for(const [key,routes] of Object.entries(passages)){
   if(!spec.flow.some(([type,site])=>type==='pass'&&site===key)||routes.length<2||
      new Set(routes.map(route=>route.id)).size!==routes.length)
    throw Error('Invalid Act 5 alternative passages: '+id+' '+key);
   for(const route of routes){
    if(!route.label||!route.id||!route.sites.length||route.sites.some(site=>!sites[site]||!spec.contest?.[site]))
     throw Error('Invalid Act 5 passage checkpoint: '+id+' '+route.id);
    for(const site of route.sites)checkpoints.add(site);
   }
  }
  const contest={};
  for(const [key,row] of Object.entries(spec.contest||{})){
   const guarded=checkpoints.has(key)||spec.flow.some(([type,site])=>['use','secure'].includes(type)&&site===key);
   if(!groups[row.group]?.length||!guarded||!Number.isFinite(row.radius)||row.radius<=0||
      row.height!==undefined&&(!Number.isFinite(row.height)||row.height<=0))
    throw Error('Invalid Act 5 contested location: '+id+' '+key);
   contest[key]={...row,radius:row.radius*scale,...(row.height===undefined?{}:{height:row.height*scale})};
  }
  for(const [key,alternates] of Object.entries(spec.reachAlternates||{}))
   if(!spec.flow.some(([type,site])=>type==='reach'&&site===key)||alternates.some(site=>!sites[site]))throw Error('Invalid Act 5 alternate reach: '+id+' '+key);
  for(const [key,label,x,y] of chapter.allies||[]){
   const localGuide=spec.encounterVersion&&key==='guide'&&(id===44||id===45);
   units.push({id:'a5-'+key,kind:'ally:scout',label,team:'ally',...contact(x,y),
    stageOverrides:{fixed:true,loadout:[],honroAct5Escort:true,...(localGuide?{honroAlly:false,honroCivilian:true}:{})}});
  }
  const marks=[...spec.flow.flatMap(([type,key,label],j)=>type==='use'?[{id:'a5-step-'+j,action:'act5',label,...sites[key]}]:[]),
   ...links.map(({to,...link})=>({...link,action:'act5'}))];
  stages.push({id:'stage-'+id,name:chapter.name,width:g.width,height,backdrop,
   metadata:{stageId:id,act:5,actStage:i+1,campaign:true},layers:layerIds.map(id=>({id,name:id,visible:true,locked:false})),
   terrainDomainVersion:1,playBounds:{left:0,top:0,right:g.width,bottom:height},
   terrainBounds:{left:-1800,top:-2400,right:g.width+1800,bottom:height+2200},
   terrains:surfaces,materials:[],elements:[{id:'a5-near',assetId,x:0,y:0,scale:artworkScale,rotation:0,layer:'structural-back',depthLayer:'L1',visualRole:'scenery'}],
   units,events:[],encounters:[],objectives,markers:marks,anchors:{spawn:start,exit},
   environment:{version:4,preset:enclosed?'enclosed':'forest',atmosphere:{preset:enclosed?'enclosed':chapter.theme==='gate'?'burned':'forest'},groups:[],surfaces:[],zones:[{id:'a5-depth',from:0,to:height,blend:300}],placements:[],skyVisible:clock[id].sky},
   meta:{notes:name,seed:5100+i},design:{act5:{encounterVersion:spec.encounterVersion??4,sites,links,groups,required,waves,
    ...(spec.encounterVersion?{wakeGroups,contest,reachAlternates:spec.reachAlternates||{},...(spec.passages?{passages}:{})}:{}),exitParty:spec.exitParty??2,flow:spec.flow,beats:chapter.beats}},
   initialState:{honroAct5:1,honroActionBudgetRevision:1,honroActiveLimit:spec.active,...(spec.encounterVersion?{honroMonsterReworkRevision:1}:{})}});
  content.push({id,act:5,actStage:i+1,name:chapter.name,place:chapter.name,theme:chapter.theme,level:25,w:g.width,h:height,active:spec.active,enemies:initial,enemyBudget:counted.length,
   combat:{targetHits:spec.hits,targetIncomingHpFraction:spec.incoming,midBossHits:spec.eliteHits,bossHits:spec.bossHits??12},
   requires:[id-1],playableRoster:cast,objective:'act5',goal:spec.flow[0][2],story:chapter.entry,outro:chapter.outro,
   guide:'목표 표식을 따라 이동하세요. 상호작용은 표시된 인물로 같은 층에서 사용합니다.',storySummary:chapter.outro[0][1],rounds:spec.rounds});
 }
 return {name,library,stages,content};
}
