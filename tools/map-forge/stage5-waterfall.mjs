import {authorStage5Lake} from './stage5-lake.mjs';
/** Fresh Stage 5 only. No live-save mutation: old battles keep their snapshots. */
const clone=v=>JSON.parse(JSON.stringify(v));
const points=a=>a.map(([x,y])=>({x,y}));
export function authorStage5Waterfall(project,g,{lake=true}={}){
 const p=clone(project),s=p.stages.find(s=>s.id==='stage-5');if(!s)throw Error('Stage 5 missing');
 const old=clone(s),template=old.terrains.find(t=>t.id==='valley-floor');
 const solid=(id,xy,{oneWay=false,properties={}}={})=>({...clone(template),id,name:id,points:points(xy),oneWay,playProjection:undefined,properties:{...template.properties,route:false,surfaceKind:'rock',...properties},detail:{spacing:18,roughness:0,seed:5,optimizeEpsilon:0}});
 // A single continuous valley bed includes the deeply carved plunge pool.
 s.terrains=[solid('valley-floor',[[0,3450],[1450,3450],[1900,3410],[2290,3370],[2500,3580],[2760,3780],[3290,3820],[3630,3700],[3950,3400],[4400,3370],[4400,4700],[0,4700]],{properties:{route:true,surfaceKind:'wet'}}),
 solid('western-bank',[[0,2235],[440,2250],[800,2360],[1120,2600],[1280,2790],[1630,2855],[1840,3000],[2160,3180],[2360,3370],[2320,3420],[2110,3270],[1750,3140],[1400,3110],[990,3040],[570,3080],[0,3100]],{properties:{route:true,surfaceKind:'wet'}}),
 // The right wall is actual rock, with a shallow dry recess cut into its face.
 solid('waterfall-cliff',[[3000,1340],[3290,1320],[3480,1290],[3770,1280],[4080,1250],[4400,1220],[4400,4700],[3490,4700],[3650,3900],[3830,3700],[3900,3280],[3740,2910],[3570,2630],[3010,2460],[3060,2405],[3630,2405],[3660,2240],[3540,2100],[3070,2140],[3040,1890],[2970,1650]]),
 // Grounded, unequal stone shoulders replace the seven floating platform row.
 solid('receiver-shoulder',[[1030,2534],[1170,2530],[1260,2590],[1330,2680],[1300,2810],[1120,2750],[1020,2640]]),
 solid('archer-step',[[1850,2840],[1970,2730],[2150,2600],[2320,2500],[2470,2460],[2580,2460],[2610,2630],[2470,2550],[2320,2590],[2150,2690],[1970,2820],[1850,2875]]),
 solid('waterfall-high-rib',[[2500,3090],[2510,2730],[2630,2480],[2800,2470],[2870,2570],[2790,3370],[2610,3550]]),
 solid('hidden-ledge',[[2840,2460],[2950,2410],[3290,2403.529411764706],[3630,2405],[3600,2570],[3240,2590],[2960,2560]],{oneWay:true}),
 // A broad western stepping shoulder is useful but never a mandatory skill gate.

 {...clone(old.terrains.find(t=>t.id==='waterfall-veil')),points:g.HONRO_CORE.waterfallBodyShape(g.HonroStage5WaterGeometry.closed),properties:{...clone(old.terrains.find(t=>t.id==='waterfall-veil').properties),honroWaterFluidVertices:g.HONRO_CORE.canonicalPolygon(clone(g.HonroStage5WaterGeometry.closed))}},
 clone(old.terrains.find(t=>t.id==='cliff-cleat'))];
 for(const k of ['playBounds','terrainBounds','terrainDomainVersion'])delete s[k];
 s.initialState.honroStage5WaterfallRevision=1;s.initialState.honroNarrativeRevision=1;
 s.units=s.units.filter(u=>u.id!=='npc-hwigyeom');
 Object.assign(s.anchors,{start:{x:330,y:2246.25,support:'western-bank'},receiver:{x:1450,y:2821.5714285714284,support:'western-bank'},basin:{x:2040,y:2679.4444444444443,support:'archer-step'},shotGap:{x:2400,y:2478.6666666666665,support:'archer-step'},waterfallFoot:{x:2990,y:3300,support:'valley-floor'},cleat:{x:3320,y:2403.529411764706,support:'hidden-ledge'},roost:{x:2340,y:2494.6666666666665,support:'archer-step'},exit:{x:3400,y:2404.038062283737,support:'hidden-ledge'}});
 const surface=(id,x)=>{const t=s.terrains.find(t=>t.id===id);for(let i=0;i<t.points.length;i++){const a=t.points[i],b=t.points[(i+1)%t.points.length];if(b.x>a.x&&x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}throw Error(`Missing ${id}/${x}`);};
 // Leave counts, species, HP, damage, XP and the action cap unchanged.
 const positions={'foe-0':[1080,'receiver-shoulder'],'foe-4':[1280,'receiver-shoulder'],'foe-8':[1590,'western-bank'],'foe-1':[1990,'archer-step'],'foe-5':[2190,'archer-step'],'foe-9':[2400,'archer-step'],'foe-2':[2350,2200],'foe-6':[2670,2190],'foe-3':[3170,'hidden-ledge'],'foe-7':[2580,'archer-step'],'npc-hwigyeom':[1850,'valley-floor']};
 for(const u of s.units){const q=positions[u.id];if(q){u.x=q[0];u.y=typeof q[1]==='string'?surface(q[1],u.x):q[1];}else if(u.team==='player')u.y=surface('western-bank',u.x);Object.assign(u,{spawnX:u.x,spawnY:u.y});}
 for(const m of s.markers){const key=m.id==='receiver-5'?'receiver':m.id==='marker-0'?'start':m.id==='marker-1'?'receiver':m.id==='marker-3'?'shotGap':m.id==='marker-5'?'cleat':m.id==='habitat-5-0'?'basin':m.id==='habitat-5-1'?'roost':null;if(key)Object.assign(m,{x:s.anchors[key].x,y:s.anchors[key].y});else if(m.type==='rest')m.y=surface(m.id==='marker-6'?'hidden-ledge':m.id==='marker-4'?'archer-step':'western-bank',m.x);}
 s.materials=[{id:'stage5-plunge-pool',terrainId:'valley-floor',x1:2290,x2:3960,kind:'water-pool',points:[[2290,3300],[3960,3300],[3950,3400],[3630,3700],[3290,3820],[2760,3780],[2500,3580],[2290,3370]],surface:[[2290,3300],[3960,3300]],bottom:[[2290,3370],[2500,3580],[2760,3780],[3290,3820],[3630,3700],[3950,3400]],surfaceY:3300,depth:0,honroCarvedBasin:true,reflections:[{x:3130,width:210,height:420},{x:3600,width:180,height:290}],alpha:.94,conductive:true,step:18},{id:'stage5-headwater',terrainId:'waterfall-cliff',x1:3000,x2:4400,kind:'water',surfaceY:1220,depth:0,alpha:.9,conductive:true,step:18}];
 s.materials.push({id:'stage5-downstream',terrainId:'valley-floor',kind:'water-pool',points:[[-6000,3300],[2400,3300],[2400,3464],[2290,3370],[1900,3410],[1450,3450],[0,3450],[-6000,3450]],surface:[[-6000,3300],[2400,3300]],bottom:[[-6000,3450],[0,3450],[1450,3450],[1900,3410],[2290,3370],[2400,3464]],conductive:true,honroCarvedBasin:true});
 s.elements=old.elements.filter(e=>e.id==='landmark-1'||e.id==='landmark-2'||e.id==='landmark-4');
 s.elements.push({id:'stage5-main-fall',kind:'waterfall',assetId:'builtin:waterfall',x:2990,y:3300,drop:2070,size:5,scale:5,layer:'prop',depthLayer:'L1',snap:false,rotation:0});
 s.elements.push({id:'stage5-side-fall',kind:'waterfall',assetId:'builtin:waterfall',x:3100,y:3300,drop:2070,size:4,scale:4,layer:'prop',depthLayer:'L1',snap:false,rotation:0});
 for(const [id,x,y,scale]of [['entry-pine',660,2306,.94],['bank-pine',980,2495,.65],['crest-pine',3870,1270,.83],['crest-small-pine',4230,1240,.6]])s.elements.push({id:'stage5-'+id,assetId:'act1-scene:rooted-pine',x,y,scale,rotation:0,snap:false,layer:'back',depthLayer:'L1'});
 s.elements.find(e=>e.id==='landmark-1').y=s.anchors.receiver.y;
 s.design={title:'큰 절벽의 낙수와 물뒤 동굴',question:'물길진에서 낙수를 비틀며 넓은 돌턱의 곡사와 동굴 앞 가까운 사격을 선택한다.',gameplay:['ritual-gate','grounded-rock-ascent','deep-plunge-pool','cave-window'],waterfall:{revision:1,headwater:{x:4400,y:1220},lip:{x:2990,y:1230},pool:{x:2990,y:3300},target:'cliff-cleat',legacyTargetId:true,requiredSkills:[],views:[{name:'waterfall-establish',x:2850,y:2250,scale:.4,width:1440,height:960}]}};
 s.routes=[];
 for(const m of s.markers)if(m.type==='hauntHabitat'){m.support='archer-step';m.label=m.kind==='crow'?'사격턱 위 새 둥지':'돌길의 젖은 풀숲';}
 s.objectives.forEach(o=>{if(o.type==='campaign')o.label='물길진에서 낙수를 비틀어 동굴의 주박목 파괴';});
 const ritual=s.markers.find(m=>m.id==='receiver-5');if(ritual)ritual.label='담허의 물길진';
 for(const m of s.markers)if(m.label)m.label=m.label.replaceAll('고리쇠','주박목').replaceAll('받이진','물길진');
 for(const u of s.units)if(u.honroSpawnReason)u.honroSpawnReason=u.honroSpawnReason.replaceAll('고리쇠','주박목').replaceAll('받이진','물길진');
 for(const e of s.events){if(e.text)e.text=e.text.replaceAll('고리쇠','주박목').replaceAll('주박목가','주박목이');}
 s.terrains.find(t=>t.id==='cliff-cleat').name='주박목';s.terrains.find(t=>t.id==='cliff-cleat').baseMaterial='wood';
 const ev=s.events.find(e=>e.id==='lower-beasts');if(ev){ev.when={progress:1900,after:'lower-beasts-warning',round:999999};ev.action={...ev.action,x:2130,y:surface('archer-step',2130),support:'archer-step',spacing:100,maxDistance:0};ev.entry={x:2130,y:surface('archer-step',2130)};}
 s.events=s.events.filter(e=>e.id!=='lower-beasts-warning');s.events.unshift({id:'lower-beasts-warning',once:true,when:{progress:1750},action:null,text:'오른쪽 돌길에서 사슴 발굽 소리가 가까워진다. 한 라운드 뒤 사격턱 아래로 올라온다.',lines:[]});
 // Remove obsolete cliff scenery rather than painting another disconnected wall.
 s.environment=clone(old.environment);s.environment.placements=[];s.environment.groups=s.environment.groups.filter(x=>x.depthLayer==='L4');s.environment.surfaces=s.environment.surfaces.filter(x=>s.environment.groups.some(g=>g.id===x.groupId));
 if(lake)authorStage5Lake(s,old,g);
 const result=g.HonroTerrainDomain.author(p);
 const cliff=result.stages.find(q=>q.id==='stage-5').terrains.find(t=>t.id==='waterfall-cliff');
 for(const q of cliff.points)if(q.x>(lake?5300:4400)&&q.y<2000)q.y=1240+(q.x-(lake?5300:4400))*.009;
 result.stages.find(q=>q.id==='stage-5').materials.find(m=>m.id==='stage5-headwater').points=[[3000,1220],[10400,1220],[10400,1294],[4400,1240],[4080,1250],[3770,1280],[3480,1290],[3290,1320],[3000,1340]];
 const head=result.stages.find(q=>q.id==='stage-5').materials.find(m=>m.id==='stage5-headwater');Object.assign(head,{kind:'water-pool',surface:[[3000,1220],[10400,1220]],bottom:[[3000,1340],[3290,1320],[3480,1290],[3770,1280],[4080,1250],[4400,1240],[10400,1294]],honroCarvedBasin:true});
 if(lake)for(const key of ['points','surface','bottom'])head[key]=head[key].map(([x,y])=>[x+900,y]);
 // The image-terrain paint experiment was reverted. Canonical vector replay
 // must not reapply its collision, marker or enemy-placement changes.
 const scoped={...result,stages:result.stages.filter(s=>s.id==='stage-5'),activeStageId:'stage-5'};g.HonroMaps.finalize(scoped);return result;
}
