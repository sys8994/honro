/** Parent-operated constrained authoring. Produces a DRAFT only, never campaign writes.
 * Bank, supported timber spans, scenery feet and enemy roles come from blueprint.json.
 * Renderer/physics are the game's existing compiler and vector renderer. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {deduplicateAsset} from '../vector-production/deduplicate-vector.mjs';
import {extendBodyDomain} from '../vector-production/extend-body-domain.mjs';
import {Path2D} from '@napi-rs/canvas';
import {runtime} from '../../game/tests/helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const g=await runtime({legacyMaps:false}),P=g.HonroProductionContract,copy=v=>JSON.parse(JSON.stringify(v));
const sourceFile=process.argv[2]||'tools/stage31-production/blueprint.json';
const spec=JSON.parse(await readFile(sourceFile,'utf8'));
if(spec.version!==1||spec.stageId!=='stage-31')throw Error('Only the declared Stage31 draft is supported');
let p=P.begin(copy(g.HONRO_PROJECT),spec.stageId),s=p.stages.find(s=>s.id===spec.stageId),card=p.production.cards[s.id];
const original=copy(s);card.intent=spec.intent;card.referenceStages=spec.references;card.budget=spec.budget;card.cameraViews=spec.cameraViews||[];
// Explicitly replace the old draft geometry. The production source is untouched.
s.terrains=[];s.materials=[];s.elements=s.elements.filter(e=>['a4:dock','a4:boat'].includes(e.assetId));s.encounters=[];s.units=s.units.filter(u=>u.team!=='enemy');
card.encounters=spec.encounters.map(({members,...row})=>({...row,members:[]}));
card.assetExceptions=[
 {assetId:'act1-scene:ruined-court',reason:'Existing connected Korean court architecture reused for the abandoned landing terrace.'},
 {assetId:'a4:dock',reason:'Preserved actual Stage31 boarding dock; do not replace the existing boat event.'},
 {assetId:'a4:boat',reason:'Preserved actual event-controlled boat.'},
 {assetId:'a4-art:abandoned-skiff',reason:'Preserved original Act4 abandoned skiff, re-grounded in the lower channel.'},
 {assetId:'s31:timber-structure',reason:'Specialized generator derives timber beams and rear supports from actual walkway collision and bank feet. Uses existing Stage30 material language.'},
 {assetId:'s31:shore-material',reason:'Specialized generator derives broad wet-earth planes from the actual bank contour; not an independent ground skirt.'}
];
p=P.bankFromProfile(p,s.id,{...spec.bank,profile:spec.bank.profile.map(([x,y])=>({x,y}))});s=p.stages.find(s=>s.id===spec.stageId);card=p.production.cards[s.id];
const lineY=(ps,x)=>{for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}throw Error('No authored surface at '+x);};
const groundY=x=>lineY(spec.bank.profile,x);
const supportY=(id,x)=>id===spec.bank.id?groundY(x):lineY(spec.walkways.find(v=>v.id===id)?.top||[],x);
if(spec.harbor){const h=spec.harbor;if(h.x2-h.x1<600||h.y>=h.surface-10||[h.x1,(h.x1+h.x2)/2,h.x2].some(x=>Math.abs(groundY(x)-h.y)>2))throw Error('Landing terrace must be a broad dry supported bank');s.design.act4.waterPolicies=[{id:'31-dock-water',kind:'recover',x1:h.waterStart,x2:s.width,surface:h.surface,entryLeft:[h.x1,h.x2],entryRight:[h.x1,h.x2]}];const dock=s.elements.find(e=>e.assetId==='a4:dock');dock.y=h.y+43*dock.scale;const top=[[-250,-30],[-230,-43],[240,-43],[250,-30]].map(([x,y])=>({x:dock.x+x*dock.scale,y:dock.y+y*dock.scale}));s.terrains.push({id:'s31-landing-dock',type:'solid',baseMaterial:'wood',oneWay:true,breakable:false,layer:'terrain',points:[...top,...top.slice().reverse().map(p=>({...p,y:p.y+12}))],properties:{surfaceKind:'bridgeDeck',sourceAssetId:'a4:dock'},detail:{roughness:0,spacing:24,optimizeEpsilon:0}});}

const path=(d,fill,stroke,strokeWidth)=>({tag:'path',d,fill,...(stroke?{stroke,lineWidth:strokeWidth}: {})});
const polygon=(points,fill)=>path('M'+points.map(p=>p.join(' ')).join('L')+'Z',fill);
const vector=(id,children,bounds)=>({id,name:id,category:'architecture',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:['production-derived','visual-only'],params:{collisionSource:'authored-stage-terrain'},bounds:{x:bounds[0],y:bounds[1],w:bounds[2],h:bounds[3]},reference:{heightM:bounds[3]/60,bounds:{x:bounds[0],y:bounds[1],w:bounds[2],h:bounds[3]},foot:{x:0,y:0},scaleRange:[1,1],backgroundRange:[1,1]},vector:{version:1,viewBox:bounds,root:{tag:'g',fill:'none',stroke:'none',children}}});
const timber=[];
for(const span of spec.walkways){
 if(!span.id||span.support!==spec.bank.id||span.top.length<2||span.top.some((pt,i)=>pt.length!==2||pt.some(v=>!Number.isFinite(v))||i&&pt[0]<=span.top[i-1][0]))throw Error('Invalid structural span');
 if(span.joinGroundStart){const [x,y]=span.top[0];if(y-groundY(x)<0||y-groundY(x)>12)throw Error('Entry deck must meet the actual bank, not float above it');}
 if(span.top.some(([x,y])=>groundY(x)-y< -24||groundY(x)-y>700))throw Error('Walkway must sit above a reachable, grounded bearing surface');
 const top=span.top.map(([x,y])=>({x,y}));
 s.terrains.push({id:span.id,type:'solid',baseMaterial:'wood',oneWay:true,breakable:false,layer:'terrain',points:[...top,...top.slice().reverse().map(q=>({...q,y:q.y+24}))],properties:{surfaceKind:'bridgeDeck',honroProductionWalkway:true,honroWalkEdges:top.slice(1).map((_,i)=>i)},detail:{roughness:0,spacing:24,optimizeEpsilon:0}});
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
for(const a of [vector('s31:timber-structure',timber,[1100,1600,2800,1000]),vector('s31:shore-material',shore,[0,1770,7200,1200])]){const old=p.library.findIndex(v=>v.id===a.id);if(old>=0)p.library[old]=a;else p.library.push(a);s.elements.push({id:a.id+'-instance',assetId:a.id,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:a.id==='s31:shore-material'?'front':'back'});}
// The shared no-outline style omits Path2D contour strokes. Material stems and
// braces must therefore be filled shapes, as in the existing legacy brush path.
function filledMaterialStrokes(node){const out=copy(node);if(out.tag==='g')out.children=out.children.map(filledMaterialStrokes);else if(out.fill==='none'&&out.stroke&&out.stroke!=='none'){out.d=new Path2D(out.d).stroke({width:out.lineWidth||1}).toSVGString();out.fill=out.stroke;out.stroke='none';}return out;}
const timberAsset=p.library.find(a=>a.id==='s31:timber-structure');timberAsset.vector.root=filledMaterialStrokes(timberAsset.vector.root);
for(let i=0;i<2;i++){const a=copy(p.library.find(a=>a.id==='stage30:ferry-reeds-'+i));a.id='s31:reeds-'+i;a.vector.root=filledMaterialStrokes(a.vector.root);delete a.vector.source;a.reference.scaleRange??=[1,1];a.reference.backgroundRange??=[1,1];p.library.push(a);card.assetExceptions.push({assetId:a.id,reason:'Exact shared Stage30 reed shapes. Material stalk strokes are expanded to filled paths so the shared no-outline style does not remove their stems.'});}
const roofProfiles=new Map();
for(const structure of spec.structures||[]){
 const inst=spec.scenery.find(v=>v.id===structure.sceneryId);if(!inst||inst.assetId!==structure.assetId||structure.assetId!=='act1-scene:ferry-house')throw Error('Unsupported unreferenced roof geometry');
 const asset=p.library.find(a=>a.id===inst.assetId),node=asset.vector.root.children.find(v=>v.id==='one-connected-thatch-roof')?.children.find(v=>v.fill==='#675f4d');if(!node)throw Error('Missing actual source roof');const outline=[...node.d.matchAll(/[ML](-?\d+(?:\.\d+)?)[ ,]*(-?\d+(?:\.\d+)?)/g)].map(m=>[Number(m[1]),Number(m[2])]),chain=[];for(const v of outline){if(chain.length&&v[0]<=chain.at(-1)[0])break;chain.push(v);}if(chain.length<4)throw Error('Roof contour is not a verified monotone chain');
 const base=supportY(inst.supportId||spec.bank.id,inst.x),top=chain.map(([x,y])=>[inst.x+x*inst.scale,base+y*inst.scale]);roofProfiles.set(structure.id,top);
 s.terrains.push({id:structure.id,type:'solid',baseMaterial:'wood',oneWay:true,breakable:false,layer:'terrain',points:[...top.map(([x,y])=>({x,y})),...top.slice().reverse().map(([x,y])=>({x,y:y+14}))],properties:{surfaceKind:'roof',honroProductionRoof:true,sourceAssetId:structure.assetId,sourceOutline:structure.source},detail:{roughness:0,spacing:24,optimizeEpsilon:0}});
}

// Explicit materials follow real surface samples, not a differently shaped drawing.
s.materials.push({id:'s31-channel-rill',kind:'shallow-water',terrainId:spec.bank.id,x1:2480,x2:2910,depth:16,conductive:true});
const usedOriginalWater=original.materials.filter(m=>m.id.includes('estuary')||m.id.includes('dock-water'));s.materials.push(...usedOriginalWater);
if(spec.harbor)s.materials.push({id:'s31-local-river',kind:'water',terrainId:spec.bank.id,x1:spec.harbor.waterStart,x2:s.width,surfaceY:spec.harbor.surface,depth:600,conductive:true});
for(const u of s.units)if(u.team==='player')u.y=groundY(u.x);
s.anchors={...s.anchors,spawn:{x:260,y:groundY(260)},start:{x:260,y:groundY(260)}};
s.initialState.honroActiveLimit=spec.budget.activeLimit;
s.design.act4.palette=copy(spec.palette);s.initialState.honroAct4Design=copy(s.design.act4);
s.initialState.honroPreviewFar={key:'act4Dawn',mood:'blue-sea-mist-day-v1',frameZoom:1.35,frameAnchorY:.9};
s.initialState.honroSharedOutdoorMaterial=1;
s.design.sharedOutdoorArt={version:1,palette:{top:'#788b8b',body:'#536b73',deep:'#203743'},rocks:[{x:1380,width:550,height:400,supportId:spec.bank.id},{x:3550,width:620,height:700,supportId:spec.bank.id},{x:4900,width:750,height:520,supportId:spec.bank.id},{x:6180,width:550,height:530,supportId:spec.bank.id}]};
// The old full-width delta water made a dry bank look submerged. Preserve the distant painting and remove those two specific scenery groups.
s.environment.groups=s.environment.groups.filter(v=>!['a4-delta-mid','a4-delta-mid-water'].includes(v.id));
const groupIds=new Set(s.environment.groups.map(v=>v.id));s.environment.surfaces=s.environment.surfaces.filter(v=>groupIds.has(v.groupId));s.environment.placements=s.environment.placements.filter(v=>groupIds.has(v.groupId));
Object.assign(s.environment.atmosphere.overrides,{skyTop:'#809ba9',skyBottom:'#b3cbd3',ambientTint:'#809c9e',hazeColor:'#9eb7bf',farFogColor:'#b4c8cd',nearFogColor:'#9eb7b8',shadowTint:'#304751'});
s.design.productionBlueprint={version:1,source:sourceFile,status:'draft-not-approved',preserved:spec.preserved};
for(const group of spec.encounters)for(const unit of group.members){
 if(g.HonroWorld.archetypes[unit.kind]?.flying)throw Error('This grounded forge does not accept flying enemies without a separate air-volume contract');
 p=P.placeEnemy(p,s.id,{...unit,groupId:group.id,referenceY:unit.supportId===spec.bank.id?groundY(unit.x):lineY(roofProfiles.get(unit.supportId)||spec.walkways.find(w=>w.id===unit.supportId).top,unit.x)});
}
s=p.stages.find(s=>s.id===spec.stageId);card=p.production.cards[s.id];
for(const item of spec.scenery){const support=item.supportId||spec.bank.id,a=p.library.find(v=>v.id===item.assetId);if(/ferry-house|ruined-court/.test(item.assetId)){const box=a.reference.bounds,foot=a.reference.foot||{x:0,y:0},left=item.x+(box.x-foot.x)*item.scale,right=left+box.w*item.scale,ys=[0,.25,.5,.75,1].map(t=>supportY(support,left+(right-left)*t));if(Math.max(...ys)-Math.min(...ys)>32)throw Error('Full building footprint lacks level support: '+item.id);}p=P.placeScenery(p,s.id,{...item,supportId:support,referenceY:supportY(support,item.x)});}
for(const [i,[x,scale]]of spec.reeds.entries())p=P.placeScenery(p,s.id,{id:'s31-reeds-'+i,assetId:'s31:reeds-'+i%2,x,scale,supportId:spec.bank.id,referenceY:groundY(x)});
s=p.stages.find(s=>s.id===spec.stageId);card=p.production.cards[s.id];
const routePoints=(surface,xs)=>xs.map(x=>({x,y:surface===spec.bank.id?groundY(x):lineY(spec.walkways.find(w=>w.id===surface).top,x),supportId:surface}));
card.routes=[
 {id:'low-channel',role:'primary',purpose:'낮은 갈대 골을 지나 실제 둑을 올라 승선 마당에 합류한다.',points:routePoints(spec.bank.id,spec.bank.profile.filter(([x])=>x>=200&&x<=6100).map(([x])=>x))},
 {id:'old-boardwalk',role:'alternate',purpose:'지원 기둥이 있는 상부 잔교의 틈을 일반 점프로 연결한다. 실제 입력 검증 전에는 통과가 아니다.',points:spec.walkways.slice(0,3).flatMap(w=>routePoints(w.id,[w.top[0][0]+30,w.top.at(-1)[0]-30]))},
 
 {id:'dock-approach',role:'return',purpose:'넓은 둑에서 기존 배 도착면으로 접근한다. 승선은 App 이벤트로 별도 검수한다.',points:routePoints(spec.bank.id,[5400,5800,6100])}
];
card.requiredProbes=[
 {id:'low-channel-route',kind:'route',claim:'초기 위치에서 낮은 길을 정상 이동·점프로 통과한다.'},
 {id:'boardwalk-route',kind:'route',claim:'첫 둑에서 잔교 두 구간과 200 간격을 정상 점프로 연결한다.'},
 {id:'first-bank-low-shot',kind:'shot',claim:'첫 둑 뒤의 적에 대한 낮은 발사각은 제방에 막힌다.'},
 {id:'first-bank-high-shot',kind:'shot',claim:'위치 또는 각도를 바꾸어 첫 둑 뒤의 적에게 실탄이 닿는다.'},
 ...spec.encounters.map(e=>({id:e.id+'-action',kind:'enemy-action',claim:e.purpose})),
 {id:'boarding',kind:'objective',claim:'정상 전투·이동으로 적을 정리하고 기존 배가 도착한 뒤 실제 승선하여 장이 끝난다.'}
];
// Distinct actual Inkscape BODY and FORE assets; no raster ground fallback.
const loadArt=async file=>JSON.parse(await readFile(file,'utf8'));
const addArt=(asset,layer='front',instance={})=>{
 asset=deduplicateAsset(asset).asset;
 const prior=p.library.findIndex(a=>a.id===asset.id);if(prior<0)p.library.push(asset);else p.library[prior]=asset;
 card.assetExceptions.push({assetId:asset.id,reason:'Reference concept → actual Inkscape trace → bounded optimization/direct visual review. Separate semantic art, unchanged collision.'});
 s.elements.push({id:asset.id+'-instance',assetId:asset.id,x:0,y:0,scale:1,rotation:0,depthLayer:'L1',layer,...instance});
};
// Reusable traced skiff: preserve the existing noncolliding instance and its foot.
const village=await loadArt('art/stage36-vector-production/stage36-production-package.json');
const landingRuin=copy(village.library.find(a=>a.id==='a4-production:ironless-frame'));
if(!landingRuin||landingRuin.collision?.length)throw Error('Expected noncolliding traced empty frame');
landingRuin.id='s31v:landing-ruin';landingRuin.reference.scaleRange=[.1,4];landingRuin.reference.backgroundRange=[.1,4];p.library.push(landingRuin);
s.elements.find(e=>e.id==='s31-ruined-court').assetId=landingRuin.id;
card.assetExceptions.push({assetId:landingRuin.id,reason:'Reusable actual Inkscape ruined frame at original broad landing support; no roof collision or interactive event.'});
const skiff=await loadArt('art/stage33-vector-production/abandoned-skiff-asset.json');
const oldSkiff=p.library.find(a=>a.id==='a4-art:abandoned-skiff');
if(oldSkiff.collision?.length||skiff.collision?.length)throw Error('Scenic skiff must remain noncolliding');
skiff.id='s31v:abandoned-skiff';skiff.reference.scaleRange=copy(oldSkiff.reference.scaleRange);skiff.reference.backgroundRange=copy(oldSkiff.reference.backgroundRange);
p.library.push(skiff);s.elements.find(e=>e.id==='s31-abandoned-boat').assetId=skiff.id;
card.assetExceptions.push({assetId:skiff.id,reason:'Reusable actual Inkscape wooden skiff, fitted by ink bounds; original instance foot, scale and empty collision retained.'});
// Same traced ferry reused at Stage31's original local deck (-50 rather than40's -60).
// Paint translation only: arrival/boarding identity, dynamic position/scale and collider stay original.
const ferry=await loadArt('art/stage40-vector-production/boat-asset.json');
ferry.id='s31v:arrival-ferry';ferry.vector.root={tag:'g',transform:[1,0,0,1,0,10],children:[ferry.vector.root]};
ferry.bounds.y+=10;ferry.reference.bounds.y+=10;ferry.vector.viewBox[1]+=10;
ferry.params={...ferry.params,sourceAsset:'art/stage40-vector-production/boat-asset.json',stage31DeckLocalY:-50,paintOffsetY:10};
p.library.push(ferry);s.design.vectorArrivalBoatAssetId=ferry.id;
card.assetExceptions.push({assetId:ferry.id,reason:'Shared actual Inkscape ferry with +10 localY paint normalization to original Stage31 deck. Original a4:boat event identity and collision retained.'});
const bankReed=await loadArt('art/vector-common-production/reed-cluster-asset.json');
bankReed.id='s31v:bank-reed';bankReed.params.semanticLayer='REAR';bankReed.reference.scaleRange=[.1,4];bankReed.reference.backgroundRange=[.1,4];p.library.push(bankReed);
for(const e of s.elements.filter(e=>e.id.startsWith('s31-reeds-'))){const foot=e.productionSupport;e.assetId=bankReed.id;e.x=foot.x-bankReed.reference.foot.x*e.scale;e.y=foot.y-bankReed.reference.foot.y*e.scale+10;}
card.assetExceptions.push({assetId:bankReed.id,reason:'Reusable actual Inkscape reed cluster; roots buried ten world units at original grounded support, behind actors.'});
const body=await loadArt('art/stage31-vector-production/body-small-asset.json'),terrain=s.terrains.find(t=>t.id===spec.bank.id);
const extended=extendBodyDomain(body,{terrainPoints:terrain.points,topPoints:terrain.points.filter(v=>v.y<3000),left:16,right:7184,leftBreaks:[-6000,-4500,-3000,-1800,-900,16],rightBreaks:[7184,8200,9200,10200,11700,13200],baseColor:'#283344',deepTop:4250,deepBottom:27100});
for(const asset of extended.extensions)addArt(asset);addArt(extended.body);
s.design.vectorGround={version:1,baseColor:'#283344',visualDepth:'gameplay'};
s.design.vectorWaterContinuation={version:1,zoneId:'s31-local-river',side:'right'};
const reeds=await loadArt('art/vector-common-production/fore-reeds-asset.json');
const priorReeds=p.library.findIndex(a=>a.id===reeds.id);if(priorReeds<0)p.library.push(reeds);else p.library[priorReeds]=reeds;
card.assetExceptions.push({assetId:reeds.id,reason:'Reusable Inkscape foreground reeds, protected stem/head silhouettes verified at supersampled normal and maximum zoom.'});
const ridge=await loadArt('art/stage31-vector-production/fore-ridge-asset.json');
// Only the verified flat deep color is continued; the visible ridge is traced art.
ridge.vector.root={tag:'g',children:[ridge.vector.root,{tag:'path',d:'M-1000 6330H8200V27100H-1000Z',fill:'#0c2228',stroke:'none'}]};ridge.bounds.h=ridge.reference.bounds.h=24900;
for(const [side,edge,left,right]of [['left',-1000,-6000,-1000],['right',8200,8200,13200]]){
 const a=copy(ridge);a.id+='-'+side;a.vector.clips={side:[`M${left} 0H${right}V27100H${left}Z`]};a.vector.root={tag:'g',clipPath:'side',pixelSnapClip:true,children:[{tag:'g',transform:[-1,0,0,1,2*edge,0],children:[ridge.vector.root]}]};a.bounds=a.reference.bounds={x:left,y:2200,w:right-left,h:24900};a.vector.viewBox=[left,2200,right-left,24900];addArt(a);
}
for(const [i,[x,z]]of [[750,1.45],[2850,1.25],[4470,1.4],[6250,1.15]].entries())s.elements.push({id:'s31v-fore-reed-'+i,assetId:reeds.id,x:x-325*z,y:groundY(x)+1050-500*z,scale:z,rotation:0,depthLayer:'L1',layer:'front'});
addArt(ridge);
p.activeStageId=s.id;p.production.reviews[s.id]=[];p.production.probeResults??={};p.production.probeResults[s.id]=[];
const out=process.argv[3]||'_local/reports/stage31-direct/draft-01';await mkdir(out,{recursive:true});
await writeFile(out+'/stage31.draft.honro-map.json',JSON.stringify(p)+'\n');
const report=P.releaseStatus(p,s.id);await writeFile(out+'/audit.json',JSON.stringify(report,null,2)+'\n');
await writeFile(out+'/stage31.summary.json',JSON.stringify({stageId:s.id,source:spec,intent:card.intent,roles:card.encounters,routes:card.routes,audit:report},null,2)+'\n');
console.log(JSON.stringify({draft:out,enemyCount:report.enemyCount,blockingIssues:report.issues,exportAllowed:report.exportAllowed},null,2));
