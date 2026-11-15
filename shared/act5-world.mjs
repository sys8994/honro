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
const mapPins=[[160,820],[290,775],[440,684],[554,596],[682,560],[793,465],[910,485],[1040,405],[1190,355],[1370,308]];
export const journey={act:5,title:name,width:1536,height:1024,asset:'shared/assets/environment/act5/broken-ridge.webp',
 stages:chapters.map((c,i)=>({stageNumber:41+i,stageId:'stage-'+(41+i),title:c.name,mapLabel:c.name,x:mapPins[i][0],y:mapPins[i][1],labelOffsetX:i%2?30:-30,labelOffsetY:i%2?35:-35})),
 progressRoutes:mapPins.slice(1).map(([x,y],i)=>'M'+mapPins[i].join(' ')+'L'+x+' '+y)};
export const clock = Object.fromEntries(chapters.map((chapter,i)=>[41+i,{
 day:5,start:chapter.clock,end:chapters[i+1]?.clock||'03:25',endRound:chapter.rounds[1],
 profile:i>=3?'act5-night':'default',moon:'act5',sky:![3,5,6,7,8].includes(i),clouds:.18
}]));

const crossings = {
 42:[['성책 사다리 오르기',[615,327],[635,213]]],
 43:[['성벽 돌계단 오르기',[264,322],[304,256]],['지휘소 돌계단 오르기',[757,218],[790,169]]],
 44:[['아래 골에서 뿌리 능선으로 오르기',[787,303],[805,226]]],
 46:[['서쪽 절벽의 밧줄 내려가기',[253,387],[280,483]],['떠 있는 상층 석단 건너기',[333,483],[570,497]],['동쪽 절벽의 밧줄 건너기',[715,497],[824,487]],['비상 밧줄로 아래 절벽에 내려가기',[927,782],[885,911]],['동쪽 붕괴턱의 밧줄 오르기',[845,1286],[891,911]],['바닥 돌턱에서 비상 밧줄 오르기',[790,1425],[840,1286]],['중앙 고리에서 되돌아가는 밧줄',[523,940],[499,553]],['중앙 석단으로 되돌아가는 밧줄',[503,553],[561,497]],['아래 제단에서 중앙 고리로 돌아가기',[538,1080],[550,940]],['고리 왼쪽 비상 밧줄 오르기',[298,940],[318,660]],['부유 석단으로 돌아가는 밧줄',[322,660],[285,483]],['왼쪽 절벽 비상 밧줄 오르기',[107,1214],[99,1017]],['왼쪽 중층 비상 밧줄 오르기',[99,1017],[79,812]],['왼쪽 상층 비상 밧줄 오르기',[79,812],[71,613]],['기억진목 절벽으로 돌아가는 밧줄',[71,613],[89,387]]],
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
   bounds,reference:{heightM:view[3]*artworkScale/60,bounds,foot:{x:0,y:view[3]},scaleRange:[1,8],backgroundRange:[1,8]},vector:{...vector,root:vectorPaths(vector.root),...(Object.keys(vector.symbols).length?{symbols:Object.fromEntries(Object.entries(vector.symbols).map(([key,node])=>[key,vectorPaths(node)]))}:{})}});
  const path=(points)=>points.map(toWorld);
  const surfaces=g.lines.map(([key,points])=>({
   id:'a5-'+key,name:key,type:groundIds.has(key)?'ground':'platform',oneWay:!groundIds.has(key),
   control:path(points),thickness:38,floor:height-358,baseMaterial:'rock',breakable:false,
   detail:{interpolation:'linear',spacing:30,roughness:0},properties:{honroAct5Painted:true},layer:'terrain'
  }));
  for(const [key,points] of solids[id]||[])surfaces.push({id:'a5-'+key,name:key,type:'solid',points:path(points),
   oneWay:false,baseMaterial:'rock',breakable:false,layer:'terrain',properties:{honroAct5Painted:true}});
  const links=(crossings[id]||[]).flatMap(([label,from,to],j)=>[
   {id:'a5-cross-'+(2*j),label,...contact(...from),to:contact(...to)},
   {id:'a5-cross-'+(2*j+1),label:'이전 발판으로 돌아가기',...contact(...to),to:contact(...from)}]);
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
  let serial=0;
  for(const [index,pack] of spec.packs.entries()){
   const staged=[];
   for(const {kind,label,x,y,special} of pack.members){
    const id='a5-foe-'+serial++,pose=contact(x,y),flying=['bat','crow','lantern'].includes(kind);
    if(flying)pose.y-=155+(serial%3)*47;
    (groups[pack.key]??=[]).push(id);
    if(spec.required?.[pack.key]?.includes(x))(required[pack.key]??=[]).push(id);
    staged.push(id);
    units.push({id,kind,label,team:'enemy',facing:-1,...pose,spawnIndex:serial,encounterGroup:pack.key,
     stageOverrides:{group:index,elite:special==='elite',honroAct5Role:special||'regular',
      ...(special==='commander'?{honroMidboss:true,fixed:true,loadout:['A02','A03','A07']}:{}),
      ...(special==='elite'?{honroMidboss:true}:{}),...(pack.wave?{dead:true,honroAct5Reserve:true}:{})}});
   }
   if(pack.wave)waves.push({...pack.wave,id:pack.key+'-'+index,units:staged});
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
  for(const [key,label,x,y] of chapter.allies||[]){
   units.push({id:'a5-'+key,kind:'ally:scout',label,team:'ally',...contact(x,y),stageOverrides:{fixed:true,loadout:[],honroAct5Escort:true}});
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
   meta:{notes:name,seed:5100+i},design:{act5:{encounterVersion:4,sites,links,groups,required,waves,exitParty:spec.exitParty??2,flow:spec.flow,beats:chapter.beats}},
   initialState:{honroAct5:1,honroActionBudgetRevision:1,honroActiveLimit:spec.active}});
  content.push({id,act:5,actStage:i+1,name:chapter.name,place:chapter.name,theme:chapter.theme,level:25,w:g.width,h:height,active:spec.active,enemies:initial,enemyBudget:counted.length,
   combat:{targetHits:spec.hits,targetIncomingHpFraction:spec.incoming,midBossHits:spec.eliteHits,bossHits:spec.bossHits??12},
   requires:[id-1],playableRoster:cast,objective:'act5',goal:spec.flow[0][2],story:chapter.entry,outro:chapter.outro,
   guide:'목표 표식을 따라 이동하세요. 상호작용은 표시된 인물로 같은 층에서 사용합니다.',storySummary:chapter.outro[0][1],rounds:spec.rounds});
 }
 return {name,library,stages,content};
}
