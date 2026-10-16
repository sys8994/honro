/** Approved short-story/real-route projection. Fresh map authoring only.
 * Saved battles are never passed through this author. The existing geometry,
 * enemy identities and combat stats remain the source except the quiet funeral.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const clone=v=>JSON.parse(JSON.stringify(v));
const roles=['archer','mage','knight','occultist'];
const interact=(id,label,extra={})=>({id,label,kind:'interact',...extra});
const route=label=>({id:'route-exit',kind:'route',label});
// Only obsolete annotations from the explicitly authored route/funeral changes.
// Never sweep arbitrary invalid references or alter saved/physical battle data.
export function repairQuestSpaceReferences(s){
 const space=s.design?.space,id=s.metadata?.stageId;if(!space)return s;
 if(id===15){
  const old='fc15-west-descent',next='fc15-dry-basin-rim';
  if(s.terrains.some(t=>t.id===old))throw Error('Old descent still exists; do not rewrite its metadata');
  const terrain=s.terrains.find(t=>t.id===next);if(!terrain)throw Error('Missing authored dry basin rim');
  space.surfaces=space.surfaces.map(row=>row.id===old?{...row,id:next,terrainId:next,edgeIndices:[...terrain.properties.honroWalkEdges],roomIds:['carved-groove']}:row);
  for(const room of space.rooms){room.terrainIds=room.terrainIds.filter(id=>id!==old);if(room.id==='carved-groove'&&!room.terrainIds.includes(next))room.terrainIds.push(next);}
  for(const route of space.routes)for(const anchor of route.anchors||[])if(anchor.surfaceId===old){anchor.surfaceId=next;anchor.y=heightAt(s,next,anchor.x);}
 }
 if(id===19){
  const removed=new Set(Array.from({length:18},(_,i)=>'a2-enemy-'+i));
  if(s.units.some(u=>removed.has(u.id)))throw Error('Funeral enemies still exist; preserve their metadata');
  space.encounterSites=space.encounterSites.filter(row=>!removed.has(row.unitId));
 }
 return s;
}
export const REDESIGN_STEPS={
 12:[interact('sign','길표의 돌림진 한 축 풀기'),route('높은 작업굴 확보 후 이동 또는 열린 내리막으로 이탈')],
 13:[{id:'resident',label:'고립된 석공 구조',kind:'rescue'},interact('gate','석문 빗장 열기'),{id:'exit',label:'마을 안쪽으로 이동',kind:'reach'}],
 15:[interact('sluice','수문을 열어 낮은 길 드러내기',{optional:true}),interact('groove','마른 발판에서 옛 흔적과 새 작업 흔적 확인'),route('흔적 확인 후 배수한 아랫길 또는 고지로 통과')],
 16:[{id:'monk',label:'들린 승려 구조',kind:'rescue'},{id:'clear-rescue-threat',label:'구조 자리로 다가온 위협 제압',kind:'clear',defeatIds:['a2-enemy-4','tm-court-flank','a2-enemy-5','a2-enemy-9']},interact('witness','구조 자리에서 증언과 열쇠 받기'),interact('hall','받은 열쇠로 동쪽 기록방 열기'),interact('record','대종 금기 문서 조사')],
 19:[interact('route','임시 천도길 열기',{requiredClass:'mage'}),...Array.from({length:3},(_,i)=>[interact('separate-'+(i+1),['망치를 가져온 형과 혼 만나기','언니를 부르는 동생과 혼 만나기','이름 없는 혼 곁에 서기'][i],{requiredClass:'occultist',parallelGroup:'farewell'}),interact('send-'+(i+1),['동생의 혼 보내기','언니의 혼 보내기','이름 없는 혼 보내기'][i],{parallelGroup:'farewell',requiresDone:['separate-'+(i+1)]})]).flat(),interact('old-soul','종 받침의 오래된 표식 조사')]
};
export const heightAt=(s,id,x)=>{const t=s.terrains.find(q=>q.id===id);if(!t)throw Error(`Missing support ${s.id}/${id}`);const edges=t.properties?.honroWalkEdges||t.points.map((_,i)=>i),ys=[];for(const i of edges){const a=t.points[i],b=t.points[(i+1)%t.points.length];if(a.x===b.x||x<Math.min(a.x,b.x)-.01||x>Math.max(a.x,b.x)+.01)continue;ys.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));}if(!ys.length)throw Error(`No support ${id} at ${x}`);return Math.min(...ys);};
const upsert=(list,item)=>{const i=list.findIndex(q=>q.id===item.id);if(i<0)list.push(item);else list[i]=item;return item;};
function mark(s,id,x,y,label,extra={}){return upsert(s.markers,{id,type:s.metadata.stageId<=20?'act2':'act3',action:s.metadata.stageId<=20?'act2':'act3',x,y,label,...extra});}
function stripSteps(s,keep){const ids=new Set(keep.map(q=>q.id));s.markers=s.markers.filter(m=>!s.initialState.honroAct2Steps?.some(q=>q.id===m.id)&&!s.initialState.honroAct3Steps?.some(q=>q.id===m.id)||ids.has(m.id)||m.id.startsWith('wave'));s.initialState[s.metadata.stageId<21?'honroAct2Steps':'honroAct3Steps']=clone(keep);for(const q of keep){const m=s.markers.find(m=>m.id===q.id);if(m){m.label=q.label;if(q.requiredClass)m.requiredClass=q.requiredClass;else delete m.requiredClass;}}}
function ribbon(s,id,top,{material='rock',oneWay=true,depth=44,broken=false}={}){return upsert(s.terrains,{id,name:id,type:'solid',points:[...top,...top.slice().reverse().map(([x,y])=>[x,y+depth])].map(([x,y])=>({x,y})),baseMaterial:material,breakable:false,oneWay,layer:'terrain',properties:{honroQuestRoute:true,honroSpaceSurfaceId:id,honroSurfaceRole:'route-shelf',honroWalkEdges:top.slice(1).map((_,i)=>i),surfaceKind:material==='wood'?'wood':'granite',hp:99999,maxHp:99999,...(broken?{broken:true}:{})},detail:{spacing:18,roughness:0,seed:1,optimizeEpsilon:0}});}
function prop(p,s,id,x,y,kind='opening'){
 const aid='quest-redesign:'+kind,parts=kind==='opening'?[{tag:'path',fill:'#172425',d:'M-82 0 L-82 -144 Q0 -220 82 -144 L82 0 Z'},{tag:'path',fill:'none',stroke:'#707975',lineWidth:18,d:'M-105 0 L-99 -157 Q0 -245 99 -157 L105 0'},{tag:'path',fill:'#9c9779',d:'M-98 -8 L-82 -19 L83 -19 L98 -8 Z'}]:kind==='hammer'?[{tag:'path',fill:'#877255',d:'M-7 0 L1 -72 L11 -71 L4 0 Z'},{tag:'path',fill:'#77807b',d:'M-29 -84 L32 -79 L29 -55 L-31 -61 Z'}]:kind==='bowl'?[{tag:'path',fill:'#b0a07b',d:'M-30 -20 Q0 16 30 -20 Z'},{tag:'path',fill:'#575345',d:'M-30 -20 Q0 -34 30 -20 Q0 -7 -30 -20 Z'}]:[{tag:'path',fill:'#9b967d',d:'M-39 0 L-36 -53 L43 -51 L39 0 Z'},{tag:'path',fill:'none',stroke:'#343f3e',lineWidth:4,d:'M-25 -39 L26 -39 M-22 -25 L30 -25 M-19 -12 L13 -12'}];
 if(!p.library.some(a=>a.id===aid))p.library.push({id:aid,name:kind,category:'prop',visual:[],vector:{version:1,viewBox:kind==='opening'?[-120,-250,240,260]:[-50,-95,100,100],gradients:{},root:{tag:'g',children:parts}},collision:[],anchor:{x:0,y:0},sockets:[],tags:['quest-redesign'],params:{},material:'stone',breakable:false,bounds:kind==='opening'?{x:-120,y:-250,w:240,h:260}:{x:-50,y:-95,w:100,h:100},reference:{heightM:kind==='opening'?4:1.5,bounds:kind==='opening'?{x:-120,y:-250,w:240,h:260}:{x:-50,y:-95,w:100,h:100},foot:{x:0,y:0},scaleRange:[.5,2],backgroundRange:[.5,2]}});
 upsert(s.elements,{id,assetId:aid,x,y,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back'});
}
const party=(s,xs,support)=>roles.map((cls,i)=>({cls,x:xs[i],y:heightAt(s,support,xs[i])}));
const positions=(s,ids,xs,support,lifts=[])=>ids.map((id,i)=>({id,x:xs[i],y:heightAt(s,support,xs[i])-(lifts[i]||0)}));
function setEntry(s,fromStage,variants){s.initialState.honroEntryVariants={revision:1,fromStage,variants};}
function routeSpec(s,toStage,common,routes){s.initialState.honroRouteSpec={revision:1,toStage,common,routes};s.design??={};s.design.questRoutes={revision:1,toStage,common:clone(common),routes:clone(routes)};}
function civilian(s,id,label,x,y,extra={}){upsert(s.units,{id,kind:'object:civilian',team:'npc',x,y,facing:1,label,stageOverrides:{hp:950,maxHp:950,h:92,r:22,honroCivilian:true,fixed:true,honroProtected:false,...extra}});}
async function narrative(name,stop){const src=await readFile(new URL(`../../shared/runtime/${name}.js`,import.meta.url),'utf8'),a=src.indexOf('const chapters=')+15,b=src.indexOf(stop,a);return JSON.parse(src.slice(a,b));}
export async function authorAct23QuestRedesign(project,{minStage=11,maxStage=30}={}){
 const p=clone(project),chapters=await narrative('act2-drama',';\nfor(const'),act3=await narrative('act3-content',';\nconst roster');
 for(const s of p.stages){const id=s.metadata?.stageId;if(!s.metadata?.campaign||id<minStage||id>maxStage||id<11||id>30)continue;s.initialState??={};s.initialState.honroNarrativeRevision=1;
  if(REDESIGN_STEPS[id])stripSteps(s,REDESIGN_STEPS[id]);
  if(id===12){
   const d=chapters[1],old=s.initialState.honroQuarryContent||{},scene=(when,rows)=>rows.map(([who,text,meta={}])=>[who,text,{storyId:`act2-r3-${when}-12`,storyTitle:old.name||'돌아오는 산길',...meta}]);s.initialState.honroQuarryContent={...old,...clone(d),id:12,narration:[d.narration],steps:clone(REDESIGN_STEPS[12]),story:scene('entry',d.story),outro:scene('outro',d.outro)};
   mark(s,'route-upper-exit',8660,heightAt(s,'sq-back-road',8660),'높은 작업굴 출구');mark(s,'route-lower-exit',8350,5947.75,'열린 내리막 동굴 출구');mark(s,'route-exit',7370,4627.5,'높은 작업굴 또는 열린 내리막');
   prop(p,s,'quest-upper-quarry-mouth',8660,heightAt(s,'sq-back-road',8660));
   routeSpec(s,13,['sign'],[{id:'A',markerId:'route-upper-exit',defeatIds:['sq-g1','sq-g2','sq-g3','sq-g4','sq-g5'],requiresDone:[]},{id:'B',markerId:'route-lower-exit',requiresDone:[],requiresTerrainOpen:['sq-turning-veil']}]);
   for(const u of s.units.filter(u=>/^sq-g[1-5]$/.test(u.id)))u.stageOverrides.honroRouteGuard={x:8370,y:4440,radius:650,support:'sq-back-road'};
  }
  if([13,15,16].includes(id)){const [name,after,kind,count]=({13:['hold-gate','gate','picks',8],15:['hold-sluice','sluice','picks',8],16:['hold-hall','hall','stoneLantern',10]})[id];s.initialState.honroNarrativePressure=[{id:name,after,kind,count,eliteEvery:4}];}
  if(id===13){
   setEntry(s,12,{A:{heroes:party(s,[2900,3000,3100,3200],'forecourt-shot-ledge'),units:positions(s,['a2-enemy-0','a2-enemy-1','a2-enemy-2','a2-enemy-3','a2-enemy-4'],[2600,2730,3350,3480,3620],'act2-floor').concat(positions(s,['a2-enemy-7'],[3590],'act2-floor',[200])),lines:[['휘겸','저 아래 사람이 있소. 위에서 길을 열겠소.']]},B:{heroes:party(s,[900,1000,1100,1200],'act2-floor'),units:positions(s,['a2-enemy-0','a2-enemy-1','a2-enemy-2','a2-enemy-3','a2-enemy-4'],[1610,1750,2860,2980,3120],'act2-floor').concat(positions(s,['a2-enemy-7'],[3590],'act2-floor',[200])),lines:[['설오','안쪽에 사람이 있습니다. 먼저 붙은 혼부터 떼겠습니다.']]}});
  }
  if(id===14&&s.initialState.honroVerticalStage14Content){const d=chapters[3],old=s.initialState.honroVerticalStage14Content,scene=(when,rows)=>rows.map(([who,text,meta={}])=>[who,text,{storyId:`act2-r3-${when}-14`,storyTitle:old.name||'해가 닿지 않는 마을',...meta}]);s.initialState.honroVerticalStage14Content={...old,...clone(d),narration:[d.narration],steps:clone(old.steps),story:scene('entry',d.story),outro:scene('outro',d.outro)};}
  if(id===15){
   // A short dry connector joins the old west/east rock masses. It is not a
   // teleport or a request to jump across the entire water basin.
   ribbon(s,'fc15-safe-crown-descent',[[4300,3015],[4460,3155],[4660,3325],[4880,3590],[5110,3930],[5330,4245]],{material:'rock'});
   ribbon(s,'fc15-dry-basin-rim',[[5310,4245],[5500,4280],[5780,4290],[5970,4380],[6090,4410]],{material:'rock'});
   s.terrains=s.terrains.filter(t=>!['fc15-toe-east-rise','fc15-west-descent'].includes(t.id));
   // Receding water exposes a low bearing edge and its direct under-arch
   // approach. The runtime publishes it only at a safe simulation boundary.
   ribbon(s,'fc15-drained-ledge',[[5300,4535],[5480,4600],[5890,4600],[6100,4480],[6240,4395]],{oneWay:false,broken:true,depth:70});
   for(const archId of ['fc15-west-arch','fc15-east-arch']){const arch=s.terrains.find(t=>t.id===archId),firstBottom=Math.max(...arch.properties.honroWalkEdges)+2;for(let i=firstBottom;i<arch.points.length;i++){const v=arch.points[i];v.y=Math.min(v.y,heightAt(s,'act2-floor',v.x)-175);}}
   s.initialState.honroCaveHangingClue={x:5990,roofY:2163.6,targetY:4090};
   s.initialState.honroDrainRevealTerrains=['fc15-drained-ledge'];
   mark(s,'groove',6240,4395,'마른 발판의 옛 흔적과 새 작업 흔적');
   for(const e of s.elements)if(e.id==='a2-15-goal-5')Object.assign(e,{x:6240,y:4395});
   prop(p,s,'quest-new-cut-marks',6200,4380,'tablet');
   mark(s,'route-lower-exit',7530,4031,'배수한 아랫길 출구');mark(s,'route-upper-exit',7350,heightAt(s,'fc15-east-arch',7350),'고지 출구');mark(s,'route-exit',6240,4395,'배수한 아랫길 또는 고지로 통과');prop(p,s,'quest-upper-water-mouth',7350,heightAt(s,'fc15-east-arch',7350));
   routeSpec(s,16,['groove'],[{id:'A',markerId:'route-lower-exit',requiresDone:['sluice'],requiresTerrainActive:['fc15-drained-ledge']},{id:'B',markerId:'route-upper-exit',requiresDone:[]}]);
   s.design.questRoutes.traversal={A:[{x:320,y:heightAt(s,'act2-floor',320)},{x:2350,y:3800},{x:4300,y:4410},{x:5300,y:4535},{x:5480,y:4600},{x:5890,y:4600},{x:6100,y:4480},{x:6240,y:4395},{x:6360,y:heightAt(s,'act2-floor',6360)},{x:6700,y:4470},{x:7530,y:4031}],B:[{x:320,y:heightAt(s,'act2-floor',320)},{x:2600,y:heightAt(s,'act2-floor',2600),jumpTo:{x:2790,y:3748.3333333333335,support:'dry-shoulder',speed:.65}},{x:2950,y:3748.3333333333335},{x:3200,y:heightAt(s,'fc15-west-arch',3200)},{x:4200,y:heightAt(s,'fc15-west-arch',4200)},{x:4300,y:3015},{x:4460,y:3155},{x:4660,y:3325},{x:4880,y:3590},{x:5110,y:3930},{x:5330,y:4270},{x:5500,y:4280},{x:5780,y:4290},{x:5970,y:4380},{x:6100,y:heightAt(s,'fc15-water-toe',6100)},{x:6240,y:4395,jumpTo:{x:6320,y:heightAt(s,'fc15-east-arch',6320),support:'fc15-east-arch',speed:.45}},{x:6700,y:heightAt(s,'fc15-east-arch',6700)},{x:7350,y:heightAt(s,'fc15-east-arch',7350)}]};
  }
  if(id===16){
   mark(s,'clear-rescue-threat',3060,4995,'구조 자리로 다가온 위협 제압');mark(s,'witness',3080,4994,'구조 자리에서 증언과 열쇠 받기');
   const ids=['a2-enemy-4','tm-court-flank','a2-enemy-5','a2-enemy-9'];
   setEntry(s,15,{A:{heroes:party(s,[570,460,680,350],'act2-floor'),units:ids.map(id=>{const u=s.units.find(u=>u.id===id);return{id,x:u.x,y:u.y};}),lines:[['설오','아래 물길로 왔습니다. 저분부터 도와드리겠습니다.']]},B:{heroes:party(s,[2650,2750,2850,3380],'tm-shelter-veranda'),units:positions(s,ids,[3540,3700,3900,4050],'tm-processional-upper',[0,0,210,195]),lines:[['설오','옆 회랑으로 들어왔습니다. 그 손, 놓지 마십시오.']]}});
   s.units.find(u=>u.id==='objective').label='노승';for(const ev of s.events||[])if(ev.id==='temple-record-answer'){const raw=JSON.stringify(ev);Object.assign(ev,JSON.parse(raw.replaceAll('hold-hall','hall')));}
  }
  if(id===19){
   s.units=s.units.filter(u=>u.team!=='enemy');s.events=[];s.encounters=[];s.initialState.honroQuietFuneral=true;s.initialState.honroBellActivation={};
   const spots={'route':6550,'separate-1':6770,'send-1':6770,'separate-2':7010,'send-2':7010,'separate-3':7210,'send-3':7210,'old-soul':7340};
   s.markers=s.markers.filter(m=>Object.hasOwn(spots,m.id));for(const [id,x]of Object.entries(spots)){const q=REDESIGN_STEPS[19].find(q=>q.id===id);mark(s,id,x,heightAt(s,'act2-floor',x),q.label,q.requiredClass?{requiredClass:q.requiredClass}:{});}
   s.elements=s.elements.filter(e=>!e.id.startsWith('a2-19-goal-')&&!e.id.startsWith('a2-19-defense-')&&!e.id.startsWith('quest-funeral-')&&!e.id.startsWith('quest-mourning-')&&!['act2:ritual','act2:lamp'].includes(e.assetId)&&e.id!=='sb-art-lamp-basin');
   for(const [i,u]of s.units.filter(u=>u.team==='player').entries()){u.x=6240+i*100;u.y=heightAt(s,'act2-floor',u.x);}const old=s.units.find(u=>u.id==='objective');if(old){old.x=6140;old.y=heightAt(s,'act2-floor',6140);old.label='함께 온 가족';}
   civilian(s,'mourner-brother','동생을 잃은 형',6710,heightAt(s,'act2-floor',6710));civilian(s,'mourner-sister','언니를 잃은 동생',6950,heightAt(s,'act2-floor',6950));
   s.anchors.spawn={x:6240,y:heightAt(s,'act2-floor',6240)};s.anchors.start=clone(s.anchors.spawn);s.anchors.exit={x:7340,y:heightAt(s,'act2-floor',7340)};
  }
  if(id===20){const lead=s.units.find(u=>u.id==='objective');for(const [id,label,dx]of [['convoy-gilchan','길찬',-100],['convoy-mason','석공',-220]])civilian(s,id,label,lead.x+dx,heightAt(s,'act2-floor',lead.x+dx),{honroConvoyMember:{target:'objective',dx}});}
  if(id===29&&!s.initialState?.honroRecordCourtRevision){
   const steps=act3[8].steps;stripSteps(s,steps);for(const event of s.events||[])if(event.id==='act3-response-29-2')event.when={after:'act3-response-29-1'};
   ribbon(s,'quest-upper-sluice-ascent',[[3370,2780],[3620,2585],[3900,2370],[4200,2140]],{material:'stone'});
   ribbon(s,'quest-upper-sluice-exit',[[5090,2140],[5400,2140]],{material:'stone'});
   mark(s,'route-upper-exit',5340,2140,'높은 수문길 출구');mark(s,'route-lower-exit',5740,2780,'기둥 아래 점검다리 출구');mark(s,'route-exit',3410,2780,'높은 수문길 또는 아래 점검다리');
   routeSpec(s,30,['old-seal','hyeonmuk-letter'],[{id:'A',markerId:'route-upper-exit',requiresDone:[]},{id:'B',markerId:'route-lower-exit',requiresDone:[]}]);
   for(const [id,x]of [['a3-29-dark-lock-approach-0',4820],['a3-29-dark-lock-approach-2',4950]]){const u=s.units.find(u=>u.id===id);if(u){u.x=x;u.y=2140;}}
   s.design.questRoutes.traversal={A:[{x:3370,y:2780},{x:3620,y:2585},{x:3900,y:2370},{x:4200,y:2140},{x:5000,y:2140},{x:5340,y:2140}],B:[{x:3410,y:2780},{x:3880,y:2660},{x:4860,y:2660},{x:5370,y:2780},{x:5740,y:2780}]};
  }
  if(id===30){for(const row of positions(s,['sf-b1','sf-b2','sf-b5'],[3500,3610,3720],'sf-west-ford'))Object.assign(s.units.find(u=>u.id===row.id),row);const activation=s.initialState.honroEncounterDensityActivation?.['cape-front'];if(activation&&!activation.supports.includes('sf-west-ford'))activation.supports.push('sf-west-ford');setEntry(s,29,{A:{heroes:party(s,[2180,2280,2390,2500],'sf-cape-west-access'),units:positions(s,['sf-c1','sf-c2','sf-c5'],[3500,3610,3720],'sf-granite-cape'),markers:[{id:'transport-map',x:2650,y:heightAt(s,'sf-cape-west-access',2650)}],lines:[['휘겸','높은 수문길을 돌아왔소. 이 바위턱에서 기록을 맞춰 봅시다.']]},B:{heroes:party(s,[1900,2020,2140,2260],'sf-west-ford'),units:positions(s,['sf-c1','sf-c2','sf-c5'],[2680,2780,2880],'sf-west-ford'),markers:[{id:'transport-map',x:2390,y:heightAt(s,'sf-west-ford',2390)}],lines:[['설오','점검다리 끝이 여울로 이어졌습니다. 돌 위에서 기록을 펼치겠습니다.']]}});}
  if(id===29)s.initialState.honroAct3Steps=clone(act3[8].steps);
  const d=id<21?chapters[id-11]:act3[id-21];for(const q of s.objectives||[])if(q.type==='campaign')q.label=d.goal;
  repairQuestSpaceReferences(s);
 }
 return p;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const p=await authorAct23QuestRedesign(JSON.parse(await readFile('shared/data/campaign.json','utf8')));await writeFile('shared/data/campaign.json',JSON.stringify(p,null,2)+'\n');console.log('Authored Act 2/3 short narrative, funeral and three genuine route pairs.');}
