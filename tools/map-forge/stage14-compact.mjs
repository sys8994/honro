/** Chapter14 compact candidate: retain the upper-house/hypnosis scene at 1:1
 * local scale, shorten only the empty flat entry, and reuse the existing east
 * crown descent and lowest ground as a small optional returnable district. */
const clone=x=>JSON.parse(JSON.stringify(x));
const WIDTH=4800,HEIGHT=5400,GROUND_DY=-3500,ROAD_DX=-2200,ROAD_DY=40;
export function stage14CompactX(x){return x<=0?x:x<=1400?x*2/7:x-1000;}
function upperSpatial(value){
 if(Array.isArray(value))return value.map(upperSpatial);if(!value||typeof value!=='object')return value;
 const out=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,upperSpatial(v)]));
 if(Number.isFinite(value.x)){out.x=stage14CompactX(value.x);if(Number.isFinite(value.w))out.w=stage14CompactX(value.x+value.w)-out.x;}
 for(const k of ['boundaryX','warningX','stepOffX','left','right','minX','maxX'])if(Number.isFinite(value[k]))out[k]=stage14CompactX(value[k]);return out;
}
function shift(value,dx,dy){if(Array.isArray(value))return value.map(v=>shift(v,dx,dy));if(!value||typeof value!=='object')return value;const out=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,shift(v,dx,dy)]));if(Number.isFinite(value.x))out.x+=dx;if(Number.isFinite(value.y))out.y+=dy;return out;}
function translateTerrain(t,dx,dy){return shift(t,dx,dy);}
function upperTerrain(t){return upperSpatial(t);}
function top(t,x){const ys=[];for(const i of t.properties.honroWalkEdges||[]){const a=t.points[i],b=t.points[(i+1)%t.points.length];if(a.x!==b.x&&x>=Math.min(a.x,b.x)-1e-6&&x<=Math.max(a.x,b.x)+1e-6)ys.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));}if(!ys.length)throw Error('No compact14 support '+t.id+' '+x);return Math.min(...ys);}
const polygon=t=>'M'+t.points.map(p=>`${p.x} ${p.y}`).join('L')+'Z';
function plane(project,assetId,t,{id,upper=false,dx=0,dy=0,order=0}){
 const a=project.library.find(a=>a.id===assetId);if(!a?.vector||a.collision?.length)throw Error('Native noncolliding Stage14 source required: '+assetId);
 const b=a.bounds,left=Math.max(b.x,Math.min(...t.points.map(p=>p.x))),right=Math.min(b.x+b.w,Math.max(...t.points.map(p=>p.x))),up=Math.max(b.y,Math.min(...t.points.map(p=>p.y))),down=Math.min(b.y+b.h,Math.max(...t.points.map(p=>p.y)));
 const cuts=upper?[left,...[0,1400].filter(x=>x>left&&x<right),right]:[left,right],symbols=clone(a.vector.symbols||{}),clips=clone(a.vector.clips||{}),symbol='compact14-source',mask='compact14-terrain-mask',children=[];
 if(symbols[symbol]||clips[mask])throw Error('Compact14 native definition collision');clips[mask]=[polygon(t)];symbols[symbol]={tag:'g',clipPath:mask,children:[clone(a.vector.root)]};
 const X=x=>upper?stage14CompactX(x):x+dx;
 for(let i=0;i<cuts.length-1;i++){const l=cuts[i],r=cuts[i+1],sx=(X(r)-X(l))/(r-l),tx=X(l)-sx*l,key='compact14-source-strip-'+i;clips[key]=[`M${l} ${up-2}H${r}V${down+2}H${l}Z`];children.push({tag:'g',transform:[sx,0,0,1,tx,dy],clipPath:key,pixelSnapClip:true,children:[{tag:'use',symbol}]});}
 const bounds={x:X(left),y:up+dy,w:X(right)-X(left),h:down-up},asset={...clone(a),id:'act2-compact:stage14-'+id,name:a.name+' · compact14',collision:[],visual:[],anchor:{x:0,y:0},sockets:[],bounds,reference:{...clone(a.reference||{}),bounds:clone(bounds),foot:{x:0,y:0},heightM:bounds.h/60,scaleRange:[1,1],backgroundRange:[1,1]},params:{...clone(a.params||{}),compact14Revision:1,compactSourceAssetId:a.id,compactSourceTerrainId:t.id,compactPlacement:{upperEntryCut:upper,dx,dy},semanticLayer:'BODY'},vector:{version:1,viewBox:[bounds.x,bounds.y,bounds.w,bounds.h],root:{tag:'g',children},clips,symbols,...(a.vector.gradients?{gradients:clone(a.vector.gradients)}:{})}};
 delete asset.params.surfaceCoverage;delete asset.params.surfaceJunction;delete asset.params.bodyTerrainIds;
 return{asset,element:{id:'compact14-art-'+id,assetId:asset.id,x:0,y:0,scale:1,rotation:0,snap:false,layer:'back',depthLayer:'L1',sortOrder:order}};
}
function environment(source){
 const env=clone(source.environment),ratio=HEIGHT/source.height;
 for(const z of env.zones||[]){z.from*=ratio;z.to*=ratio;z.blend=Math.min(z.blend,(z.to-z.from)*.45);}
 for(const g of env.groups||[])if(g.verticalMode!=='SKY')g.y*=ratio;
 // The original distant coverage margins are retained, never map-scaled.
 for(const s of env.surfaces||[])if(Number.isFinite(s.compositionWidth))s.compositionWidth=WIDTH;
 return env;
}
export function createStage14Compact(project){
 const source=project.stages.find(s=>s.metadata?.stageId===14);
 if(!source||source.width!==7600||source.height!==10400||source.initialState?.honroReviewedSceneRevision!==514)throw Error('Reviewed original Stage14 source required');
 const original=id=>{const t=source.terrains.find(t=>t.id===id);if(!t)throw Error('Missing Stage14 source terrain '+id);return t;},stage=clone(source);
 stage.width=WIDTH;stage.height=HEIGHT;stage.playBounds={left:0,top:0,right:WIDTH,bottom:HEIGHT};stage.terrainBounds=clone(source.terrainBounds);stage.environment=environment(source);
 const upper=upperTerrain(original('v14-upper-hamlet')),vault=upperTerrain(original('v14-cavern-vault')),road=translateTerrain(original('v14-east-crown-road'),ROAD_DX,ROAD_DY),ground=translateTerrain(original('v14-refuge-ground'),0,GROUND_DY);
 stage.terrains=[upper,road,ground,vault];for(const t of stage.terrains)if(t.playProjection?.bounds){t.playProjection.bounds={left:0,top:0,right:WIDTH,bottom:HEIGHT+240};if(t.playProjection.start)t.playProjection.start={x:0,y:t===ground?top(ground,0):t===upper?top(upper,0):t.playProjection.start.y};}
 stage.markers=upperSpatial(source.markers);stage.initialState=upperSpatial(source.initialState);stage.initialState.honroAct2CompactRevision=1;stage.initialState.honroVerticalStage14PopulationCap=30;
 // Preserve the physical scene: home/refuge/compulsion slope is a translation,
 // including all 90px walking / 60px horizontal / warning-action thresholds.
 stage.initialState.honroV4Hypnosis=upperSpatial(source.initialState.honroV4Hypnosis);
 stage.initialState.honroVerticalStage14Spec={entries:{}};
 const keep=new Set([...Array.from({length:10},(_,i)=>'v14-b'+(i+1)),'resident-spirit-1','v14-c1','v14-c2','v14-c3','v14-c6','v14-c7','14.market-spirit','v14-d1','v14-d2','v14-d3','v14-d4','v14-e1','v14-e2','v14-e3']);
 stage.units=source.units.filter(u=>u.team!=='enemy'||keep.has(u.id)).map(upperSpatial);
 const place=(id,x,support,air=0)=>{const u=stage.units.find(u=>u.id===id);u.x=x;u.y=top(support,x)-air;u.encounterGroup='compact14-'+(support===upper?'entry':support===road?'east-descent':'low-yard');u.stageOverrides={...u.stageOverrides,honroVerticalCell:u.encounterGroup,honroEncounterRole:u.encounterGroup,honroEncounterSupport:support.id};};
 for(const [id,x,air]of[['v14-c1',540,0],['v14-c2',790,0],['v14-c3',940,0],['v14-c6',500,260],['v14-c7',850,320],['14.market-spirit',680,190]])place(id,x,upper,air);
 for(const [id,x,air]of[['v14-d1',3400,0],['v14-d2',3700,0],['v14-d3',4000,0],['v14-d4',3600,240],['v14-e1',4350,0]])place(id,x,road,air);
 place('v14-e2',4500,ground);place('v14-e3',4650,ground,280);
 for(const [i,u]of stage.units.filter(u=>u.team==='player').entries()){u.x=70+i*90;u.y=top(upper,u.x);}
 const groups=new Map();for(const u of stage.units.filter(u=>u.team==='enemy')){const id=u.encounterGroup||'v14-attached-spirit';if(!groups.has(id))groups.set(id,[]);groups.get(id).push(u.id);}
 stage.encounters=[...groups].map(([id,unitIds])=>({id,key:id,behavior:'patrol',unitIds}));
 const activation={};for(const [cell,support,radius,maxHeight]of[['upper-tools',upper.id,1000,650],['upper-eaves',upper.id,1000,800],['compact14-entry',upper.id,850,650],['compact14-east-descent',road.id,900,650],['compact14-low-yard',ground.id,900,500]])activation[cell]={supports:[support],radius,maxHeight};stage.initialState.honroVerticalStage14Activation=activation;
 const pieces=[plane(project,'act2-traced:stage14-domain-v3',original(upper.id),{id:'upper-domain',upper:true}),plane(project,'act2-traced:stage14-upper-v2',original(upper.id),{id:'upper',upper:true}),plane(project,'act2-traced:stage14-domain-v3',original(vault.id),{id:'vault-domain',upper:true}),plane(project,'act2-traced:stage14-vault-v2',original(vault.id),{id:'vault',upper:true}),plane(project,'act2-traced:stage14-domain-v3',original(ground.id),{id:'low-domain',dy:GROUND_DY}),plane(project,'act2-traced:stage14-refuge-v2',original(ground.id),{id:'low',dy:GROUND_DY}),plane(project,'act2-traced:stage14-east-v1',original(road.id),{id:'east-descent',dx:ROAD_DX,dy:ROAD_DY})];
 // The lowest BODY covers the old crown road's buried tail at the natural
 // ground junction; it must not expose a second bright walking rim below it.
 pieces.sort((a,b)=>Number(a.asset.id.endsWith('-low-domain')||a.asset.id.endsWith('-low'))-Number(b.asset.id.endsWith('-low-domain')||b.asset.id.endsWith('-low')));
 const props=new Set(['v14-art-household-rock-upper','v14-art-entry-empty-home','v14-art-entry-wash-yard','v14-art-upper-home','v14-art-upper-east-wing','v14-art-upper-ondol-hearth']);
 stage.elements=source.elements.filter(e=>props.has(e.id)).map(upperSpatial).concat(pieces.map(p=>p.element));
 for(const id of['v14-art-west-refuge-empty-home','v14-art-west-refuge-water-jars','v14-art-river-home','v14-art-river-drying-cloth','v14-art-refuge-lamp']){const e=source.elements.find(e=>e.id===id);if(e)stage.elements.push(shift(e,0,GROUND_DY));}
 // No old inaccessible lower-district route/site remains in active metadata.
 const A=(x,t)=>({x,y:top(t,x),surfaceId:t.id}),entry=[A(70,upper),A(400,upper),A(1200,upper),A(1675,upper)],descent=[A(1980,upper),A(2000,upper),A(3080,upper),A(3120,road),A(3300,road),A(3880,road),A(4200,road),A(4350,road),A(4400,ground)];
 const routes=[{id:'compact14-entry',kind:'required',anchors:entry,requires:[]},{id:'compact14-east-descent',kind:'optional-walk',anchors:descent,requires:[]}];
 stage.routes=entry.concat(descent.slice(1));stage.anchors={spawn:clone(entry[0]),exit:{x:1675,y:2300}};
 const rooms=[{id:'compact14-upper',bounds:{x:0,y:1200,w:3150,h:3000},terrainIds:[upper.id],ceilingIds:[vault.id],sky:'cave'},{id:'compact14-east',bounds:{x:3100,y:3650,w:1700,h:1750},terrainIds:[road.id,ground.id],ceilingIds:[],sky:'cave'}];
 const surfaces=stage.terrains.filter(t=>t.properties?.honroWalkEdges?.length).map(t=>({id:t.id,terrainId:t.id,role:'floor',edgeIndices:clone(t.properties.honroWalkEdges),roomIds:[t===upper?'compact14-upper':'compact14-east']}));
 stage.design.space={version:1,geometryRevision:stage.initialState.honroAct2GeometryRevision,topologyId:'compact-upper-home-and-short-east-descent',rooms,surfaces,routes,connections:[],sites:{},encounterSites:stage.units.filter(u=>u.team==='enemy').map(u=>({id:u.id+'-site',unitId:u.id,surfaceId:u.stageOverrides?.honroEncounterSupport||upper.id,x:u.x,y:u.y,roomId:u.x>3100?'compact14-east':'compact14-upper',role:u.stageOverrides?.honroEncounterRole||'attached-spirit',patrol:[]})),landmarks:[],scenery:[],lights:[],views:[{id:'compact14-home',x:1980,y:2250,zoom:.7,width:1440,height:960},{id:'compact14-east',x:3970,y:4200,zoom:.55,width:1440,height:960}],terrainPlanes:[]};
 stage.design.vertical14={revision:2,status:'selected-layout',nodes:{entry:entry[0],home:{x:1980,y:2300,surfaceId:upper.id},refuge:{x:1675,y:2300,surfaceId:upper.id},lower:A(4400,ground)},routes};delete stage.design.vertical14Art;delete stage.design.vertical14Finish;delete stage.design.ceiling14;
 stage.design.compact14={revision:1,status:'selected-layout',sourceBounds:[7600,10400],bounds:[WIDTH,HEIGHT],initialEnemies:24,finite:0,primaryCore:{originalHome:{x:2980,y:2300},newHome:{x:1980,y:2300},localScale:1},scope:'upper scene retained at local scale; old lower family/refuge combat districts removed, existing east crown route and lowest ground reused as optional compact district',art:'native plane masks reuse only the four retained original physical masses; no generated terrain artwork'};
 stage.metadata.compactStatus='selected-layout';
 return{source:clone(source),stage,assets:pieces.map(p=>p.asset),artStats:{assets:pieces.length,serializedBytes:pieces.reduce((n,p)=>n+JSON.stringify(p.asset).length,0)},integrationNotes:['New entry only, after reviewed14 author. Preserve old live battles.','The required seven door-threat enemy IDs and all reviewed rows/step IDs are unchanged.','Run exact hypnosis/warning/separation/refuge tests and the retained east route before adoption.','No enemy count or route completion is difficulty proof.']};
}
