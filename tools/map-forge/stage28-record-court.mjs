/** Fresh Stage 28 only. Raised county record court, west service lane and east
 * water yard. Serialized battles never pass through this source author. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {asset,put,P,R,line} from './act3-map-kit.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
export const COURT28_PROFILE=[[0,2700],[900,2700],[1320,2620],[2040,2620],[2540,2490],[3020,2490],[3400,2380],[4180,2380],[4540,2490],[5140,2490],[5570,2590],[7200,2590]];
export function court28Ground(x){for(let i=1;i<COURT28_PROFILE.length;i++){const a=COURT28_PROFILE[i-1],b=COURT28_PROFILE[i];if(x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return 2590;}
const point=x=>({x,y:court28Ground(x)});
function surface(id,top,{depth=38,oneWay=true,material='wood',role='veranda'}={}){return{id,name:id,type:'solid',points:[...top,...top.slice().reverse().map(([x,y])=>[x,y+depth])].map(([x,y])=>({x,y})),baseMaterial:material,oneWay,breakable:false,layer:'terrain',properties:{honroCourt28:true,honroSpaceSurfaceId:id,honroWalkEdges:top.slice(1).map((_,i)=>i),honroSurfaceRole:role,surfaceKind:material==='wood'?'wood':'granite'},detail:{spacing:18,roughness:0,seed:28,optimizeEpsilon:0}};}
function art(p,s,id,svg,bounds,solids=[]){const a=asset('stage28:record-court:'+id,id,svg,solids,bounds);a.params.rearOnly=!solids.length;a.tags.push('stage28-record-court');put(p,s,a,'s28-'+id,0,0);return a;}
function house(p,s,{id,x,y,w,h,open=false,burnt=false,low=false}){
 const left=x-w/2,right=x+w/2,eave=y-h,peak=eave-(low?72:125),roof=[[left-32,eave+7],[left-8,eave-2],[left+24,peak+5],[left+36,peak],[right-36,peak],[right-24,peak+5],[right+8,eave-2],[right+37,eave+9],[right+25,eave+29],[left-25,eave+29]];
 let body=R(left+14,eave+30,w-28,h-30,burnt?'#383e36':'#4e5345')+R(left+23,eave+43,w-46,39,'#333b34');
 if(!open){body+=R(left+32,eave+88,w-64,h-105,burnt?'#5c5947':'#82816b');for(const offset of [-.29,.24]){const xx=x+w*offset;body+=R(xx-48,y-162,96,151,'#303c37')+R(xx-42,y-153,84,137,'#a3a087')+R(xx-8,y-153,7,137,'#4c584a')+R(xx-42,y-87,84,7,'#4c584a');}}
 else {body+=R(left+34,eave+87,w*.27,h-105,'#73745d')+R(right-w*.22,eave+84,w*.18,h-100,'#686950');body+=R(x-128,y-142,256,121,'#293932')+R(x-113,y-128,226,107,'#806f4f')+R(x-113,y-79,226,8,'#b1a07a');}
 for(const xx of [left+21,left+w*.32,right-w*.29,right-38])body+=R(xx,eave+30,22,h-30,'#493d2c')+R(xx+3,eave+32,5,h-37,'#957e56')+P([[xx-9,y-18],[xx+30,y-18],[xx+35,y],[xx-14,y]],'#858877');
 body+=R(left+8,y-11,w-16,11,'#a3a084');
 // Eave beam, brackets and deep open doorway are large structural forms.
 body+=R(left+7,eave+25,w-14,17,'#796848')+R(left+18,eave+43,w-36,13,'#272f2b');
 for(const xx of [left+21,left+w*.32,right-w*.29,right-38])body+=P([[xx-12,eave+41],[xx+37,eave+41],[xx+31,eave+58],[xx+21,eave+66],[xx+4,eave+66],[xx-7,eave+57]],'#8a7956');
 if(open)body+=P([[left+34,eave+87],[left+34,y-22],[left+w*.27,y-22],[left+w*.27,eave+112]],'#5c6251')+R(right-w*.22+15,y-162,w*.13,113,'#373f35')+R(right-w*.22+20,y-151,w*.12,7,'#a29973');
 if(burnt){body+=P([[left+20,eave+31],[left+w*.18,eave+31],[left+w*.27,y],[left+20,y]],'#2c3531')+P([[right-84,eave+40],[right-60,eave-40],[right-38,eave-30],[right-41,y],[right-66,y]],'#242d2b');}
 art(p,s,id+'-rear',body,[left-40,peak-20,w+80,h+150]);
 let roofArt=P(roof,'#3b4d4c','#182b2c',4)+P([[left-20,eave+8],[left+30,peak+13],[right-30,peak+13],[right+20,eave+8],[right-12,eave+15],[right-43,peak+28],[left+43,peak+28],[left+15,eave+15]],'#657770')+line([[left-25,eave+25],[right+25,eave+25]],'#a09b79',5);
 // Visible tile courses express the real roof's drainage, rather than ornament.
 for(let xx=left+44;xx<right-30;xx+=55)roofArt+=line([[xx,peak+23],[xx+(xx<x?-16:16),eave+9]],'#7b8578',2.5);
 for(const t of [.45,.78]){const yy=peak+(eave-peak)*t;roofArt+=line([[left+28-40*t,yy],[right-28+40*t,yy]],'#435754',3);}
 roofArt+=line([[left+33,peak+2],[right-33,peak+2]],'#a09f86',5)+R(left-22,eave+29,w+44,9,'#263532');
 if(burnt)roofArt+=P([[x+75,peak+17],[x+157,peak+17],[x+138,peak+43],[x+191,eave+12],[x+92,eave+13],[x+111,peak+65]],'#273432')+line([[x+122,peak+33],[x+145,eave+8]],'#796b4f',8);
 // Existing platform rules: pass upward, land from above and drop back into the hall.
 const roofAsset=art(p,s,id+'-roof',roofArt,[left-40,peak-5,w+80,h+135],[roof]);roofAsset.oneWay=true;
 return id;
}
export function applyStage28RecordCourt(input){
 const p=clone(input),s=p.stages.find(s=>s.metadata?.stageId===28);if(!s)return p;
 
 // Idempotent final author runs after existing quest and city route authors.
 const gateSource=id=>clone(s.terrains.find(t=>t.id===id));const gates=[gateSource('fire-door'),gateSource('water-gate')];
 s.terrains=[{id:'a3-foundation',name:'Raised record court / service lanes',type:'solid',points:[[-9000,2700],...COURT28_PROFILE,[16200,2590],[16200,9000],[-9000,9000]].map(([x,y])=>({x,y})),baseMaterial:'earth',oneWay:false,breakable:false,layer:'terrain',properties:{honroCourt28:true,honroWalkEdges:Array.from({length:COURT28_PROFILE.length+1},(_,i)=>i)},detail:{spacing:24,roughness:0,seed:28,optimizeEpsilon:0}}];
 for(const [i,t]of gates.entries()){const x=i?5370:1860,y=court28Ground(x);t.points=[{x:x-65,y:y-290},{x:x+65,y:y-290},{x:x+65,y},{x:x-65,y}];s.terrains.push(t);}
 // Both paths are short, grounded alternatives to the open central approach.
 s.terrains.push(surface('s28-west-veranda',[[2200,2578.4],[2450,2380],[2750,2380],[2980,2490]]),surface('s28-east-loading-veranda',[[4480,2471.67],[4680,2340],[4950,2340],[5140,2490]]));
 s.materials=[];s.elements=[];p.library=p.library.filter(a=>!a.id.startsWith('stage28:record-court:'));
 // Rear limewashed walls identify an enclosed civic site without adding fake floors.
 let wall='';for(const [x1,x2]of [[90,550],[1430,1700],[2820,3080],[5560,5850],[6750,7100]]){const y=court28Ground((x1+x2)/2);wall+=R(x1,y-135,x2-x1,135,'#686c59')+R(x1+8,y-124,x2-x1-16,100,'#91917a')+P([[x1-13,y-139],[x2+13,y-139],[x2+20,y-122],[x1-20,y-122]],'#3d504d');}
 for(const [x,y,w]of [[100,2670,170],[330,2610,180],[1450,2530,165],[2840,2400,160],[5600,2535,145],[6780,2490,150]])wall+=P([[x,y],[x+w-12,y+3],[x+w,y+38],[x+8,y+43]],'#7b8070')+line([[x+8,y+43],[x+w,y+38]],'#525f54',3);
 art(p,s,'boundary-walls',wall,[70,2200,7100,550]);
 house(p,s,{id:'west-clerks-wing',x:1030,y:2700,w:780,h:285,burnt:true,low:true});
 house(p,s,{id:'raised-open-record-hall',x:3760,y:2380,w:1040,h:350,open:true,burnt:true});
 house(p,s,{id:'east-record-annex',x:4750,y:2490,w:560,h:300,open:true,low:true});
 house(p,s,{id:'water-yard-shed',x:6340,y:2590,w:650,h:260,open:true,low:true});
 // Fire-watch maintenance landings attach to side bays. Every beam is an existing
 // one-way platform; the hall below remains open and no invisible stair is added.
 const roofAccess=[['west',780,2515,220],['court-lower',3310,2220,200],['court-upper',3410,2050,200],['annex',4800,2240,180],['water',6150,2420,200]];
 for(const [id,x,y,w] of roofAccess){
  s.terrains.push(surface('s28-roof-access-'+id,[[x-w/2,y],[x+w/2,y]],{depth:16,role:'roof-access'}));
  const foot=court28Ground(x),brace=R(x-w/2+16,y+16,12,foot-y-16,'#574a35')+R(x+w/2-28,y+16,12,foot-y-16,'#574a35')+line([[x-w/2+22,y+83],[x+w/2-22,y+18]],'#81704d',9);
  art(p,s,'roof-access-support-'+id,brace,[x-w/2,y,w,foot-y]);
 }
 // A single pine roots the deserted civic precinct in a real hillside.
 const pine=p.library.find(a=>a.id==='act1-scene:rooted-pine');if(pine)put(p,s,pine,'s28-court-pine',2940,court28Ground(2940),.57);
 // Low masonry retaining face belongs to the mound; it is neither a floating tier nor a new collider.
 art(p,s,'court-plinth',P([[3020,2490],[3400,2380],[4180,2380],[4540,2490],[4540,2530],[4180,2430],[3400,2430],[3020,2535]],'#5d685d')+line([[3020,2494],[3400,2385],[4180,2385],[4540,2494]],'#a5a28b',7)+P([[3400,2430],[4180,2430],[4370,2485],[3210,2485]],'#394e45'),[3020,2380,1520,160]);
 let supports='';for(const [x,y,foot]of [[2450,2418,2513],[2730,2418,2490],[4700,2378,2490],[4930,2378,2490]])supports+=R(x-11,y,22,foot-y,'#514936')+R(x-7,y,4,foot-y,'#9b8961');
 art(p,s,'veranda-supports',supports,[2200,2340,3000,300]);
 // A stone-lined fire-water basin and open timber sluice explain the east control.
 let basin=P([[5840,2590],[5840,2484],[6090,2484],[6090,2590]],'#5d685f')+P([[5860,2497],[6072,2497],[6053,2530],[5874,2530]],'#2f5555')+line([[5840,2484],[6090,2484]],'#a6a489',8)+R(5968,2425,14,80,'#8a7954')+R(5930,2420,88,10,'#a18e63')+P([[5838,2550],[5585,2574],[5500,2590],[5562,2590],[5840,2564]],'#495e57');
 art(p,s,'fire-water-basin',basin,[5480,2400,650,210]);
 // Burnt material and a salvage shelf explain the fire, not decorative noise.
 art(p,s,'charred-west-fittings',P([[1740,2620],[1764,2504],[1778,2487],[1789,2620]],'#2c3530')+P([[1670,2618],[1812,2568],[1830,2582],[1705,2620]],'#554c38')+R(1500,2570,103,49,'#6b654a')+R(1494,2565,115,10,'#9d8e66'),[1480,2470,360,170]);
 art(p,s,'mound-stone-shoulders',P([[2580,2520],[2770,2510],[2960,2550],[3110,2500],[3280,2500],[3150,2620],[2850,2670]],'#344a43')+P([[2630,2518],[2770,2510],[2860,2538],[2790,2557]],'#59665a')+P([[4260,2450],[4410,2485],[4570,2510],[4730,2545],[4490,2630],[4340,2570]],'#384d43')+P([[4410,2485],[4570,2510],[4520,2540],[4440,2520]],'#63705e'),[2550,2450,2200,240]);
 // Furniture in separate work bays. Only the central saved case is actionable;
 // final evidence revision performs the approval/suppression comparison automatically.
 const papers=[[3860,court28Ground(3860),'petition'],[4700,court28Ground(4700),'approval'],[6020,court28Ground(6020),'suppression']];
 for(const [x,y,id]of papers){const table=R(x-70,y-72,140,14,'#9d875d')+R(x-57,y-58,12,58,'#4e4936')+R(x+46,y-58,12,58,'#4e4936')+P([[x-54,y-75],[x-39,y-113],[x+23,y-108],[x+44,y-74]],'#b9ad83')+R(x-27,y-105,4,27,'#625e46')+R(x-13,y-99,4,21,'#625e46');art(p,s,id+'-worktable',table,[x-80,y-120,160,130]);}
 for(const m of s.markers){if(m.id==='party-reunion')m.x=3500;m.y=court28Ground(m.x);}
 for(const [k,v]of Object.entries(s.anchors)){if(k==='splitSpawns'){for(const q of Object.values(v))q.y=court28Ground(q.x);}else if(v&&Number.isFinite(v.x))v.y=court28Ground(v.x);}
 for(const u of s.units)u.y=court28Ground(u.x);
 // East annex archer occupies a real reachable veranda, with a close guard beneath it.
 const archer=s.units.find(u=>u.id==='a3-28-decision-suppression-1');if(archer){archer.x=4900;archer.y=2340;archer.stageOverrides.honroEncounterSupport='s28-east-loading-veranda';}
 for(const group of s.design.act3.encounterPlan.groups)group.members=group.members.map((m,i)=>{const u=s.units.find(u=>u.id===`a3-28-${group.id}-${i}`);return u?{...m,x:u.x,y:u.y}:m;});
 s.initialState.honroRecordCourtRevision=1;
 s.design.act3.kind='raised-county-record-court';s.design.act3.primaryContour=clone(COURT28_PROFILE);s.design.act3.requiredRoute=COURT28_PROFILE.map(([x,y])=>({x,y,support:'a3-foundation'}));s.design.act3.optionalRoutes=[{id:'west-service-veranda',points:[[2200,2578.4],[2450,2380],[2750,2380],[2980,2490]].map(([x,y])=>({x,y}))},{id:'east-loading-veranda',points:[[4480,2471.67],[4680,2340],[4950,2340],[5140,2490]].map(([x,y])=>({x,y}))}];
 s.design.act3.mainBuildings=['west-clerks-wing','raised-open-record-hall','east-record-annex','water-yard-shed'];s.design.act3.bridges=[];s.design.act3.splitRoutes={A:[300,1120,1860,2540,3020,3500].map(x=>[x,court28Ground(x)]),B:[6700,6040,5370,4540,4180,3500].map(x=>[x,court28Ground(x)])};s.design.act3.departureGathering={x:3500,y:2380,radius:440};s.design.act3.recordCourt={revision:1,source:'tools/map-forge/stage28-record-court.mjs',scope:'Fresh entry only. User art approval pending. Existing objective IDs, fire limit, evidence and split party unchanged.'};
 delete s.design.cityTactical;delete s.design.space;delete s.design.act3.refinement;
 // Old a3 art remains available for serialized projects; unused source assets need not be deleted.
 return p;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file=process.argv[2]||'shared/data/campaign.json';await writeFile(file,JSON.stringify(applyStage28RecordCourt(JSON.parse(await readFile(file,'utf8'))),null,2)+'\n');}
