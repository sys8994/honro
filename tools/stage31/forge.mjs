/** Parent-operated constrained authoring. Produces a DRAFT only, never campaign writes.
 * Bank, supported timber spans, scenery feet and enemy roles come from blueprint.json.
 * Renderer/physics are the game's existing compiler and vector renderer. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {Path2D} from '@napi-rs/canvas';
import {runtime} from '../../game/tests/helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const g=await runtime({legacyMaps:false}),P=g.HonroProductionContract,copy=v=>JSON.parse(JSON.stringify(v));
const spec=JSON.parse(await readFile(process.argv[2]||'tools/stage31/blueprint.json','utf8'));
if(spec.version!==1||spec.stageId!=='stage-31')throw Error('Only the declared Stage31 draft is supported');
let p=P.begin(copy(g.HONRO_PROJECT),spec.stageId),s=p.stages.find(s=>s.id===spec.stageId),card=p.production.cards[s.id];
const original=copy(s);card.intent=spec.intent;card.referenceStages=spec.references;card.budget=spec.budget;
// Explicitly replace the old draft geometry. The production source is untouched.
s.terrains=[];s.materials=[];s.elements=s.elements.filter(e=>['a4:dock','a4:boat'].includes(e.assetId));s.encounters=[];s.units=s.units.filter(u=>u.team!=='enemy');
card.encounters=spec.encounters.map(({members,...row})=>({...row,members:[]}));
card.assetExceptions=[
 {assetId:'a4:dock',reason:'Preserved actual Stage31 boarding dock; do not replace the existing boat event.'},
 {assetId:'a4:boat',reason:'Preserved actual event-controlled boat.'},
 {assetId:'a4-art:abandoned-skiff',reason:'Preserved original Act4 abandoned skiff, re-grounded in the lower channel.'},
 {assetId:'s31:timber-structure',reason:'Specialized generator derives timber beams and rear supports from actual walkway collision and bank feet. Uses existing Stage30 material language.'},
 {assetId:'s31:shore-material',reason:'Specialized generator derives broad wet-earth planes from the actual bank contour; not an independent ground skirt.'}
];
p=P.bankFromProfile(p,s.id,{...spec.bank,profile:spec.bank.profile.map(([x,y])=>({x,y}))});s=p.stages.find(s=>s.id===spec.stageId);card=p.production.cards[s.id];
const lineY=(ps,x)=>{for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}throw Error('No authored surface at '+x);};
const groundY=x=>lineY(spec.bank.profile,x);
const path=(d,fill,stroke,strokeWidth)=>({tag:'path',d,fill,...(stroke?{stroke,lineWidth:strokeWidth}: {})});
const polygon=(points,fill)=>path('M'+points.map(p=>p.join(' ')).join('L')+'Z',fill);
const vector=(id,children,bounds)=>({id,name:id,category:'architecture',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:['production-derived','visual-only'],params:{collisionSource:'authored-stage-terrain'},bounds:{x:bounds[0],y:bounds[1],w:bounds[2],h:bounds[3]},reference:{heightM:bounds[3]/60,bounds:{x:bounds[0],y:bounds[1],w:bounds[2],h:bounds[3]},foot:{x:0,y:0},scaleRange:[1,1],backgroundRange:[1,1]},vector:{version:1,viewBox:bounds,root:{tag:'g',fill:'none',stroke:'none',children}}});
const timber=[];
for(const span of spec.walkways){
 if(!span.id||span.support!==spec.bank.id||span.top.length<2||span.top.some((pt,i)=>pt.length!==2||pt.some(v=>!Number.isFinite(v))||i&&pt[0]<=span.top[i-1][0]))throw Error('Invalid structural span');
 if(span.top.some(([x,y])=>groundY(x)-y< -24||groundY(x)-y>700))throw Error('Walkway must sit above a reachable, grounded bearing surface');
 const top=span.top.map(([x,y])=>({x,y}));
 s.terrains.push({id:span.id,type:'solid',baseMaterial:'wood',oneWay:true,breakable:false,layer:'terrain',points:[...top,...top.slice().reverse().map(q=>({...q,y:q.y+24}))],properties:{honroProductionWalkway:true,honroWalkEdges:top.slice(1).map((_,i)=>i)},detail:{roughness:0,spacing:24,optimizeEpsilon:0}});
 for(const [i,x]of span.posts.entries()){
  const y=lineY(span.top,x)+15,foot=groundY(x);if(foot<y-12||foot-y>700)throw Error('Unsupported timber post');
  timber.push(polygon([[x-13,y],[x+12,y],[x+17,foot+9],[x-16,foot+4]],'#414e47'));
  timber.push(polygon([[x-8,y+7],[x-2,y+7],[x+4,foot],[x-4,foot]],'#8b8d77'));
  if(i&&foot-y>140){const prev=span.posts[i-1],prevTop=lineY(span.top,prev)+35;timber.push(path(`M${prev} ${prevTop}L${x} ${foot-25}`,'none','#4a5144',12));}
 }
 const rim=[...span.top.map(([x,y])=>[x,y+7]),...span.top.slice().reverse().map(([x,y])=>[x,y+37])];timber.push(polygon(rim,'#5a6051'));
 timber.push(path('M'+span.top.map(([x,y])=>[x,y+3].join(' ')).join('L'),'none','#a2a28a',7));
 for(let x=span.top[0][0]+40;x<span.top.at(-1)[0]-25;x+=103){const y=lineY(span.top,x);timber.push(path(`M${x} ${y+8}l-10 21`,'none','#354b49',5));}
}
const bank=spec.bank.profile,shore=[];
shore.push(polygon([...bank.map(([x,y])=>[x,y+3]),...bank.slice().reverse().map(([x,y])=>[x,y+13+Math.sin(x/430)*4])],'#94a08a80'));
// Interrupted soft alluvial patches, not repeated angular ribbons or a new skirt.
for(const [left,right,depth]of [[140,1450,230],[2020,3100,165],[3650,4710,270],[5050,6030,210]]){
 const w=right-left,a=groundY(left)+55,z=groundY(right)+45,mid=left+w*.53,m=groundY(mid);
 shore.push(path(`M${left} ${a} C${left+w*.24} ${a-25} ${mid} ${m+82} ${right} ${z} Q${right-w*.11} ${z+depth*.7} ${mid} ${m+depth} Q${left+w*.08} ${a+depth*.7} ${left} ${a}Z`,'#324e523d'));
 shore.push(path(`M${left+w*.1} ${a+20} Q${mid} ${m+120} ${right-w*.09} ${z+45} Q${mid} ${m+depth*.58} ${left+w*.1} ${a+20}Z`,'#81917b28'));
}
for(const a of [vector('s31:timber-structure',timber,[1400,1780,2150,540]),vector('s31:shore-material',shore,[0,1770,7200,1200])]){const old=p.library.findIndex(v=>v.id===a.id);if(old>=0)p.library[old]=a;else p.library.push(a);s.elements.push({id:a.id+'-instance',assetId:a.id,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:a.id==='s31:shore-material'?'front':'back'});}
// The shared no-outline style omits Path2D contour strokes. Material stems and
// braces must therefore be filled shapes, as in the existing legacy brush path.
function filledMaterialStrokes(node){const out=copy(node);if(out.tag==='g')out.children=out.children.map(filledMaterialStrokes);else if(out.fill==='none'&&out.stroke&&out.stroke!=='none'){out.d=new Path2D(out.d).stroke({width:out.lineWidth||1}).toSVGString();out.fill=out.stroke;out.stroke='none';}return out;}
const timberAsset=p.library.find(a=>a.id==='s31:timber-structure');timberAsset.vector.root=filledMaterialStrokes(timberAsset.vector.root);
for(let i=0;i<2;i++){const a=copy(p.library.find(a=>a.id==='stage30:ferry-reeds-'+i));a.id='s31:reeds-'+i;a.vector.root=filledMaterialStrokes(a.vector.root);delete a.vector.source;p.library.push(a);card.assetExceptions.push({assetId:a.id,reason:'Exact shared Stage30 reed shapes. Material stalk strokes are expanded to filled paths so the shared no-outline style does not remove their stems.'});}
const roofProfiles=new Map();
for(const structure of spec.structures||[]){
 const inst=spec.scenery.find(v=>v.id===structure.sceneryId);if(!inst||inst.assetId!==structure.assetId||structure.assetId!=='act1-scene:ferry-house')throw Error('Unsupported unreferenced roof geometry');
 const base=groundY(inst.x),top=structure.top.map(([x,y])=>[inst.x+x*inst.scale,base+y*inst.scale]);roofProfiles.set(structure.id,top);
 s.terrains.push({id:structure.id,type:'solid',baseMaterial:'wood',oneWay:true,breakable:false,layer:'terrain',points:[...top.map(([x,y])=>({x,y})),...top.slice().reverse().map(([x,y])=>({x,y:y+14}))],properties:{honroProductionRoof:true,sourceAssetId:structure.assetId,sourceOutline:structure.source},detail:{roughness:0,spacing:24,optimizeEpsilon:0}});
}

// Explicit materials follow real surface samples, not a differently shaped drawing.
s.materials.push({id:'s31-channel-rill',kind:'shallow-water',terrainId:spec.bank.id,x1:2480,x2:2910,depth:16,conductive:true});
const usedOriginalWater=original.materials.filter(m=>m.id.includes('estuary')||m.id.includes('dock-water'));s.materials.push(...usedOriginalWater);
for(const u of s.units)if(u.team==='player')u.y=groundY(u.x);
s.anchors={...s.anchors,spawn:{x:260,y:groundY(260)},start:{x:260,y:groundY(260)}};
s.initialState.honroActiveLimit=spec.budget.activeLimit;
s.design.act4.palette=copy(spec.palette);s.initialState.honroAct4Design=copy(s.design.act4);
s.initialState.honroPreviewFar={key:'act4Dawn'};
s.design.productionBlueprint={version:1,source:'tools/stage31/blueprint.json',status:'draft-not-approved',preserved:spec.preserved};
for(const group of spec.encounters)for(const unit of group.members){
 if(g.HonroWorld.archetypes[unit.kind]?.flying)throw Error('This grounded forge does not accept flying enemies without a separate air-volume contract');
 p=P.placeEnemy(p,s.id,{...unit,groupId:group.id,referenceY:unit.supportId===spec.bank.id?groundY(unit.x):lineY(roofProfiles.get(unit.supportId)||spec.walkways.find(w=>w.id===unit.supportId).top,unit.x)});
}
s=p.stages.find(s=>s.id===spec.stageId);card=p.production.cards[s.id];
for(const item of spec.scenery)p=P.placeScenery(p,s.id,{...item,supportId:spec.bank.id,referenceY:groundY(item.x)});
for(const [i,[x,scale]]of spec.reeds.entries())p=P.placeScenery(p,s.id,{id:'s31-reeds-'+i,assetId:'s31:reeds-'+i%2,x,scale,supportId:spec.bank.id,referenceY:groundY(x)});
s=p.stages.find(s=>s.id===spec.stageId);card=p.production.cards[s.id];
const routePoints=(surface,xs)=>xs.map(x=>({x,y:surface===spec.bank.id?groundY(x):lineY(spec.walkways.find(w=>w.id===surface).top,x),supportId:surface}));
card.routes=[
 {id:'low-channel',role:'primary',purpose:'제방을 내려가 잔교 아래의 갈대 물길을 통과하고 둘째 둑으로 오른다.',points:routePoints(spec.bank.id,[260,1000,1550,2180,2550,2900,3500,4070,4510,5320,5860,6180])},
 {id:'old-boardwalk',role:'alternate',purpose:'첫 둑에서 오래된 잔교로 올라 짧은 틈을 뛰어넘고 높은 사선을 얻는다. 실제 점프 검증 전에는 통과로 취급하지 않는다.',points:[...routePoints(spec.bank.id,[1300]),...routePoints('s31-west-boardwalk',[1500,1850,2230]),...routePoints('s31-east-boardwalk',[2490,2800,3120,3450]),...routePoints(spec.bank.id,[3500])]},
 {id:'dock-approach',role:'return',purpose:'마지막 둑에서 기존 배의 도착면으로 접근한다. 실제 승선은 기존 App 이벤트로 검수한다.',points:routePoints(spec.bank.id,[5580,5860,6180])}
];
card.requiredProbes=[
 {id:'low-channel-route',kind:'route',claim:'초기 위치에서 낮은 길을 정상 이동·점프로 통과한다.'},
 {id:'boardwalk-route',kind:'route',claim:'첫 둑에서 잔교 두 구간과 200 간격을 정상 점프로 연결한다.'},
 {id:'first-bank-low-shot',kind:'shot',claim:'첫 둑 뒤의 적에 대한 낮은 발사각은 제방에 막힌다.'},
 {id:'first-bank-high-shot',kind:'shot',claim:'위치 또는 각도를 바꾸어 첫 둑 뒤의 적에게 실탄이 닿는다.'},
 ...spec.encounters.map(e=>({id:e.id+'-action',kind:'enemy-action',claim:e.purpose})),
 {id:'boarding',kind:'objective',claim:'정상 전투·이동으로 적을 정리하고 기존 배가 도착한 뒤 실제 승선하여 장이 끝난다.'}
];
p.activeStageId=s.id;p.production.reviews[s.id]=[];p.production.probeResults??={};p.production.probeResults[s.id]=[];
const out=process.argv[3]||'_local/reports/stage31-direct/draft-01';await mkdir(out,{recursive:true});
await writeFile(out+'/stage31.draft.honro-map.json',JSON.stringify(p)+'\n');
const report=P.releaseStatus(p,s.id);await writeFile(out+'/audit.json',JSON.stringify(report,null,2)+'\n');
await writeFile(out+'/stage31.summary.json',JSON.stringify({stageId:s.id,source:spec,intent:card.intent,roles:card.encounters,routes:card.routes,audit:report},null,2)+'\n');
console.log(JSON.stringify({draft:out,enemyCount:report.enemyCount,blockingIssues:report.issues,exportAllowed:report.exportAllowed},null,2));
