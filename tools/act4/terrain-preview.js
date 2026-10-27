(function(G){'use strict';
// Review-only authored maps. No campaign chapter registration, profile grant or
// persistence. Stage 30 supplies the existing combat budget until Act4 balance
// is authored; the visible chapter and geometry are independent.
const clone=x=>JSON.parse(JSON.stringify(x)),M=G.HonroMaps,C=G.HONRO_CORE;
const names={31:'강 끝의 갈대',35:'대숲의 옛길',36:'쇠가 없는 마을'};
const pts=a=>a.map(([x,y])=>({x,y}));
const polygon=(a,fill)=>({type:'polygon',points:pts(a),fill,stroke:null});
function asset(id,visual,collision=[]){const ps=visual.flatMap(s=>s.points),xs=ps.map(p=>p.x),ys=ps.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);return{id:'a4:'+id,name:id,category:'architecture',visual,collision,anchor:{x:0,y:0},sockets:[],tags:['act4-preview'],params:{},reference:{heightM:5,bounds:{x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y},foot:{x:0,y:0},scaleRange:[.1,4],backgroundRange:[.1,4]}};}
const extras=[];
// A few broad planes describe old timber, missing hardware and eaves. Door is
// a separate instance so a later physical fall cannot be claimed by static art.
extras.push(asset('empty-house',[
 polygon([[-440,0],[-440,-340],[350,-340],[350,0]],'#686c66'),
 polygon([[350,0],[350,-340],[470,-290],[470,0]],'#414f53'),
 polygon([[-500,-328],[-320,-485],[90,-520],[450,-340],[180,-365],[-270,-366]],'#384e57'),
 polygon([[-470,-336],[-280,-397],[215,-394],[465,-336],[180,-365],[-270,-366]],'#82918e'),
 polygon([[-350,0],[-350,-300],[-175,-300],[-175,0]],'#283c46'),
 ...[-430,-160,330].map(x=>polygon([[x,0],[x,-332],[x+22,-332],[x+22,0]],'#807a68')),
 polygon([[0,-170],[0,-265],[225,-265],[225,-170]],'#35474b'),
 polygon([[-470,0],[480,0],[495,26],[-480,26]],'#526267')
]));
extras.push(asset('door',[polygon([[-80,0],[-80,-280],[65,-280],[65,0]],'#857d67'),polygon([[-69,-7],[-69,-272],[-55,-272],[-55,-7]],'#a29c84'),polygon([[-78,-262],[-78,-244],[-48,-244],[-48,-262]],'#293d43'),polygon([[-78,-64],[-78,-46],[-48,-46],[-48,-64]],'#293d43')]));
extras.push(asset('reeds',Array.from({length:9},(_,i)=>{const x=(i-4)*28,h=100+(i*47%95);return [polygon([[x-2,0],[x-8,-h],[x-5,-h],[x+2,0]],'#718987'),polygon([[x-8,-h+12],[x-15,-h-12],[x-10,-h-31],[x-2,-h-13]],'#9da18e'),polygon([[x,-50],[x+35,-94],[x+30,-70]],'#799088')];}).flat()));
extras.push(asset('estuary-water',[
 polygon([[-900,-440],[8100,-440],[8100,6000],[-900,6000]],'#243f50'),
 polygon([[-900,40],[8100,40],[8100,400],[-900,400]],'#526f7c'),
 polygon([[-900,-440],[8100,-440],[8100,40],[-900,40]],'#789ca8'),
 ...[0,1,2,3,4].map(i=>polygon([[-900,-385+i*73],[8100,-390+i*73],[8100,-382+i*73],[-900,-378+i*73]],i%2?'#a7c2c6':'#91b0b8'))
]));
extras.push(asset('bamboo',Array.from({length:7},(_,i)=>{const x=(i-3)*48,h=600+(i*137%250);return [polygon([[x-8,0],[x-30,-h],[x-14,-h],[x+9,0]],i%2?'#567778':'#77938c'),...[-180-i*27,-360-i*19,-520-i*23].flatMap(y=>[polygon([[x,y],[x-82,y-56],[x-66,y-55],[x+5,y-3]],'#4e7170'),polygon([[x,y-8],[x+74,y-66],[x+57,y-58],[x-4,y+2]],'#65887e')])];}).flat()));
extras.push(asset('thick-bamboo',[
 polygon([[-85,0],[-102,-330],[-88,-550],[-40,-580],[7,-560],[55,-590],[100,-550],[88,0]],'#38595b'),
 ...[-70,-25,25,66].map((x,i)=>polygon([[x,0],[x-20,-540-i*12],[x-2,-540-i*12],[x+16,0]],i%2?'#789087':'#60847e'))
],[pts([[-85,0],[-102,-330],[-88,-550],[100,-550],[88,0]])]));
extras.push(asset('dock',[
 polygon([[-250,-30],[250,-30],[250,0],[-250,0]],'#7e8072'),
 ...[-210,190].map(x=>polygon([[x,-40],[x+26,-40],[x+26,210],[x,190]],'#45585a')),
 polygon([[-230,-43],[240,-43],[240,-30],[-230,-30]],'#a2a393')
]));
extras.push(asset('old-wall',[
 polygon([[-180,0],[-175,-93],[-105,-125],[-30,-105],[15,-132],[100,-102],[175,-80],[180,0]],'#526b71'),
 polygon([[-175,-93],[-105,-125],[-30,-105],[15,-132],[100,-102],[175,-80],[100,-73],[12,-103],[-40,-80],[-112,-99]],'#8b9a92'),
 ...[[-150,-65],[-70,-58],[22,-67],[105,-47],[-120,-25],[-15,-20],[82,-16]].map(([x,y])=>polygon([[x,y],[x+55,y-5],[x+62,y+16],[x+5,y+21]],'#6f8484'))
],[pts([[-180,0],[-175,-93],[-105,-125],[-30,-105],[15,-132],[100,-102],[175,-80],[180,0]])]));
extras.push(asset('boat',[
 polygon([[-260,-65],[-190,0],[170,12],[280,-70],[110,-32],[-150,-40]],'#596d70'),
 polygon([[-210,-56],[-174,-10],[157,1],[230,-53],[110,-32],[-150,-40]],'#83938e'),
 polygon([[-80,-49],[-80,-88],[130,-83],[140,-44]],'#576767')
]));
function ground(id,line,mat='rock'){return{id,type:'solid',baseMaterial:mat,breakable:false,oneWay:false,points:pts([...line,[line.at(-1)[0],3100],[line[0][0],3100]])};}
function solid(id,x,y,w,h,mat='rock'){return ground(id,[[x,y+h],[x,y],[x+w,y],[x+w,y+h]],mat);}
function create(n){
 if(![31,35,36].includes(n)&&G.HonroAct4CoastMaps)return G.HonroAct4CoastMaps.create(n);
 if(!names[n])throw Error('Act4 review map unavailable: '+n);
 const s=M.emptyStage('act4-preview-'+n,n+' · '+names[n],7200,3100);
 s.metadata={stageId:30,campaign:false,act4Preview:n};s.backdrop=n===31?'river':'forest';
 s.initialState={honroActiveLimit:3,honroAct4Preview:n};
 s.objectives=[];s.design={act4:{revision:1,chapter:n,combatBudgetStage:30,release:false,water:'visual/shallow only; recover/lethal pending separate verified implementation',dialogue:'reviewed seeds not yet bound'}};
 const lines={
 31:[[0,1920],[620,1930],[1100,1900],[1580,1840],[1920,1840],[2280,1970],[2700,2010],[3260,1980],[3710,1900],[4120,1870],[4540,1870],[4890,1950],[5250,1970],[5700,1910],[6150,1870],[6280,1870]],
 35:[[0,1910],[540,1910],[920,1800],[1380,1800],[1840,1850],[2180,2010],[2650,2030],[3080,1940],[3550,1820],[3900,1810],[4390,1910],[4820,1900],[5340,1730],[5790,1730],[6220,1840],[6680,1860],[7200,1800]],
 36:[[0,1800],[650,1810],[1120,1910],[1800,1970],[2450,2020],[3090,2040],[4200,2040],[4930,2010],[5550,1930],[6300,1830],[7200,1800]]
 };
 s.terrains=[ground('a4-'+n+'-land',lines[n],n===31?'earth':'rock')];
 // Finite raised shelves reconnect to the lower continuous route at both ends.
 if(n===31){const line=lines[n].filter(([x])=>x<3860||x>4490);line.splice(9,0,[3860,1900],[4000,1730],[4300,1730],[4490,1870]);line.sort((a,b)=>a[0]-b[0]);s.terrains=[ground('a4-31-land',line,'earth')];}
 if(n===35){s.terrains.push({id:'a4-35-wall',type:'platform',baseMaterial:'rock',oneWay:true,breakable:false,control:pts([[2750,2010],[3040,1800],[3220,1800],[3490,1835]]),thickness:90});s.terrains.push({id:'a4-35-shelf',type:'platform',baseMaterial:'wood',oneWay:true,breakable:false,control:pts([[4440,1910],[4810,1660],[5060,1660],[5340,1730]]),thickness:85});}
 const geom=s.terrains.map(t=>G.HonroGeometry.terrain(t,s.height));
 const floor=x=>G.HonroMapEngine.surfaceY(geom,x)?.y||2000;
 const put=(id,x,scale=1,y=floor(x),layer='back')=>s.elements.push({id:'a4-'+n+'-'+id+'-'+s.elements.length,assetId:'a4:'+id,x,y,scale,snap:false,rotation:0,depthLayer:'L1',layer});
 if(n===31){put('estuary-water',0,1,1900);for(const [x,z] of [[700,.7],[1200,.9],[1700,1.1],[2550,.6],[3500,.8],[4500,1],[5600,.8],[6150,.7]])put('reeds',x,z);put('dock',6150,.45,1890);put('boat',500,.6,1735);}
 if(n===35){for(const [x,z]of [[50,1.3],[500,1.1],[1770,1.2],[2000,.9],[2700,1.4],[3500,1.1],[4000,1.3],[4500,1.1],[5900,1.4],[6520,1.2],[7040,1.5]])put('bamboo',x,z);for(const x of [3125,4920])put('thick-bamboo',x,.35,floor(x));put('old-wall',900,.8);put('empty-house',6980,.4);}
 if(n===36){for(const [x,z,id]of [[1520,1.2,'a3-korean-town-21-L3-house-2'],[2570,1.35,'a3-korean-town-21-L3-house-0'],[4550,1.5,'act1-scene:ferry-house'],[5740,1.3,'a3-korean-town-21-L3-house-2']])s.elements.push({id:'a4-36-house-'+x,assetId:id,x,y:floor(x),scale:z,snap:false,rotation:0,depthLayer:'L1',layer:'back'});put('door',2370,1, floor(2370),'prop');}
 const party=['archer','mage','knight','occultist'];
 s.units=party.map((c,i)=>({...G.HonroUnits.record(c,c,260+i*120,floor(260+i*120),'player'),facing:1}));
 const groups=n===31?[[[1390,'hound'],[1640,'possessedGuard'],[1860,'possessedArcher']],[[4140,'possessedArcher'],[4490,'possessedGuard'],[4700,'hound']]]:n===35?[[[1460,'hound'],[1730,'possessedGuard']],[[2830,'possessedGuard'],[3490,'possessedArcher']],[[5360,'possessedGuard'],[5690,'possessedArcher']]]:[[[1220,'warden'],[1450,'hound']]];
 groups.forEach((group,i)=>{const ids=[];for(const [x,kind]of group){const id='a4-'+n+'-g'+i+'-'+ids.length;ids.push(id);s.units.push({...G.HonroUnits.record(kind,id,x,floor(x),'enemy'),encounterGroup:'a4-'+n+'-'+i,stageOverrides:{elite:false,group:100+i,awake:false,aggroUntil:0}});}s.encounters.push({id:'a4-'+n+'-'+i,key:'a4-'+n+'-'+i,unitIds:ids,behavior:'guard'});});
 if(n===36)Object.assign(s.units.find(u=>u.id==='a4-36-g0-0').stageOverrides,{elite:true,honroAct4RewardTag:'eq-hw-36'});
 s.environment=G.HonroEnvironment.makeEnvironment(s);
 s.environment.atmosphere={preset:'valley',overrides:{skyTop:'#809ba9',skyBottom:'#b3cbd3',ambientTint:n===36?'#8a8b80':'#809c9e',hazeColor:'#9eb7bf',farFogColor:'#b4c8cd',nearFogColor:'#9eb7b8',shadowTint:'#304751',keyLightColor:'#b5cbd2',lightStrength:.02,mistStrength:.29}};
 // The shared far image provides cloud detail; these world groups supply the
 // grounded distance silhouettes and move with the existing depth transforms.
 if(n!==31){
  const id='a4-'+n+'-rear',support=id+'-support';
  s.environment.groups.push({id,depthLayer:'L3',verticalMode:'WORLD',zoneId:'landscape',x:0,y:2040});
  s.environment.surfaces.push({id:support,groupId:id,kind:'rear-ground',points:pts([[-16000,0],[-6500,-90],[0,-20],[1900,70],[4200,-60],[7500,0],[18000,-100]]),bottom:29000});
  const layout=n===35?[[-7000,1.25],[-4900,1.6],[-3400,1.35],[-1800,1.5],[-500,1.25],[900,1.6],[2300,1.2],[3700,1.45],[5200,1.35],[6600,1.5],[8300,1.2],[10200,1.4],[12500,1.6]]:[[-4500,1],[-1200,.9],[1600,1.1],[5400,.9],[8500,1.1],[12000,.9]];
  for(const [x,z]of layout)s.environment.placements.push({id:'a4-far-'+x,assetId:n===35?'a4:bamboo':'a3-korean-town-21-L3-house-0',depthLayer:'L3',groupId:id,supportId:support,x,y:0,scale:z,rotation:0});
 }

 extras.find(a=>a.id==='a4:bamboo').reference.heightM=14;
 const project={...G.HONRO_PROJECT,stages:[s],activeStageId:s.id,library:[...G.HONRO_PROJECT.library,...clone(extras)]};
 G.HonroAct4ReviewArt?.install(s,project.library);
 return G.HonroTerrainDomain.author(project);
}
function launch(n){const app=G.HonroApp,project=create(n),map=project.stages[0];
 const owner=app.profile;app.launchMap(project,map.id,{story:false,profile:{settings:{music:false}}});const b=app.engine.b;
 b.honroAct4Preview=n;b.honroPreviewFar={key:'act4Dawn'};if(G.innerWidth<600)Object.assign(app.scene,{scale:.62,x:450,y:app.engine.active.y-40});
 // Stage30 is an explicit combat fixture, not an authored Act4 growth policy.
 app.stage.name=n+' · '+names[n];app.stage.goal=G.HONRO_ACT4_PREVIEW_SEEDS?.ui.find(v=>v[0]===`A4.S${n}.OBJECTIVE`)?.[1]||'';b.honroAct4Design=clone(map.design.act4);
 app.engine.checkEnd=()=>false;app.updateHUD(true);const goal=G.document?.getElementById('objective-text');if(goal)goal.textContent=app.stage.goal;
 return{project,b,owner};
}
const oldGradient=G.HonroTerrainGradient;G.HonroTerrainGradient=function(c,t,b){if(!b?.honroCustom||!b.honroAct4Preview||t.mat==='wood')return oldGradient(c,t,b);const top=Math.min(...b.terrain.filter(v=>!v.oneWay&&!v.honroElementCollision).map(v=>v.y));const base=t.oneWay?t.y:top;const g=c.createLinearGradient(0,base,0,base+(t.oneWay?160:1900));for(const [at,color]of [[0,'#71888e'],[.10,'#516c77'],[.32,'#3d5662'],[.7,'#243c4b'],[1,'#152a37']])g.addColorStop(at,color);return g;};
G.HonroAct4TerrainPreview={create,launch,names,revision:1,baseAssets:()=>clone(extras)};
})(globalThis);
