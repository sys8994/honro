/** Authored place-making only. No terrain, mission, unit, route, or water edits.
 * Front props attach to existing exposed floor edges; rear households share
 * finite WORLD groups and explicit, darker, non-colliding support terraces. */
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compileSVG} from './build-act2-art.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const PREFIX='a2-scene-';
export const ACT2_SCENE_ASSETS=[
 ['act2:scene-market-walkway','act2-scene-market-walkway.svg','마을 뒤편의 이어진 계단과 회랑'],
 ['act2:scene-upper-stair','act2-scene-upper-stair.svg','윗집을 잇는 뒤편 돌계단'],
 ['act2:scene-court-wall','act2-scene-court-wall.svg','기와 담장과 앞마당'],
 ['act2:scene-longhouse','act2-scene-longhouse.svg','마을의 툇마루 집'],
 ['act2:scene-market-awning','act2-scene-market-awning.svg','생활 장터 차양'],
 ['act2:scene-temple-corridor','act2-scene-temple-corridor.svg','기록실과 짧은 측면 회랑'],
 ['act2:scene-stone-threshold','act2-scene-stone-threshold.svg','내려앉은 산 아래 석문'],
 ['act2:scene-work-shelter','act2-scene-work-shelter.svg','석재와 공구 작업막']
];
const sceneVectors=new Map(await Promise.all(ACT2_SCENE_ASSETS.map(async ([id,file])=>[id,compileSVG(await readFile(path.join(root,'shared/assets/environment',file),'utf8'))])));
export function applyAct2SceneAssets(project){
 if(project.version>=4)project.version=Math.max(5,project.version);
 for(const [id,file,name]of ACT2_SCENE_ASSETS){
  const vector=sceneVectors.get(id),[x,y,w,h]=vector.viewBox;
  const asset={id,name,category:'architecture',environmentRole:'building',visual:[],vector,collision:[],anchor:{x:0,y:0},sockets:[],tags:['act2','scene-composition','visual-only'],params:{},bounds:{x,y,w,h},reference:{heightM:h/60,bounds:{x,y,w,h},foot:{x:0,y:id==='act2:scene-upper-stair'?-160:0},scaleRange:[.4,3],backgroundRange:[.7,1.3]}};
  const index=project.library.findIndex(a=>a.id===id);if(index<0)project.library.push(asset);else project.library[index]=asset;
 }
 return project;
}
function ground(st,x){const t=st.terrains.find(t=>t.id==='act2-floor');if(!t)throw Error('Missing canonical floor '+st.id);for(const i of t.properties.honroWalkEdges){const a=t.points[i],b=t.points[i+1];if(x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}throw Error('No canonical floor at '+st.id+'/'+x);}
function roomAt(st,x){return st.design.space.rooms.find(r=>x>=r.bounds.x&&x<=r.bounds.x+r.bounds.w)?.id;}
function front(st,key,assetId,x,scale=1){const id=PREFIX+st.metadata.stageId+'-'+key,y=ground(st,x),e={id,assetId,x,y,scale,rotation:0,snap:false,layer:'back',depthLayer:'L1'};
 st.elements.push(e);st.design.space.scenery.push({id,elementId:id,assetId,roomId:roomAt(st,x),surfaceId:'floor-main',x,y,scale,footOffset:0,visualOnly:true});return e;
}
function revise(st,assetId,changes,predicate=()=>true){for(const e of st.elements.filter(e=>e.assetId===assetId&&predicate(e))){Object.assign(e,changes);if(changes.x!==undefined)e.y=ground(st,e.x);const record=st.design.space.scenery.find(s=>s.elementId===e.id);if(record)Object.assign(record,{assetId:e.assetId,x:e.x,y:e.y,scale:e.scale,roomId:roomAt(st,e.x),footOffset:e.y-ground(st,e.x)});}}
function rear(st,key,x,y,points,items){const env=st.environment,id=PREFIX+st.metadata.stageId+'-'+key,supportId=id+'-support';
 const group={id,depthLayer:'L2',verticalMode:'WORLD',x,y};
 const pp=points.map(([x,y])=>({x,y})),contact=pp.map(p=>({x:p.x,y:ground(st,Math.max(0,Math.min(st.width,x+p.x)))-y+260})).reverse();
 const bottom=Math.max(...pp.map(p=>p.y),...contact.map(p=>p.y))+800;
 env.groups.push(group);env.surfaces.push({id:supportId,groupId:id,kind:'act2-rear-terrace',points:pp,bottom,artBottom:bottom,artBottomPoints:contact,visualOnly:true});
 for(const [key,assetId,localX,scale=1]of items){env.placements.push({id:id+'-'+key,assetId,depthLayer:'L2',groupId:id,supportId,x:localX,y:0,scale,rotation:0});}
}
// Rear terrace skirts are visual derivatives of the final collision floor.
// Recompute after optional terrain authors, without rebuilding props or rooms.
export function refreshAct2RearTerraceContacts(st){
 for(const surface of st.environment?.surfaces||[]){
  if(surface.kind!=='act2-rear-terrace')continue;
  const group=st.environment.groups.find(g=>g.id===surface.groupId);
  if(!group)throw Error('Missing rear terrace group '+surface.groupId);
  const contact=surface.points.map(p=>({x:p.x,y:ground(st,Math.max(0,Math.min(st.width,group.x+p.x)))-group.y+260})).reverse();
  const bottom=Math.max(...surface.points.map(p=>p.y),...contact.map(p=>p.y))+800;
  Object.assign(surface,{bottom,artBottom:bottom,artBottomPoints:contact});
 }
 return st;
}
function light(st,key,x,y,radius=260){st.design.space.lights.push({id:PREFIX+st.metadata.stageId+'-'+key,x,y,roomId:roomAt(st,x),kind:'oil',radius,color:'#bb9558'});}
function clean(st){st.elements=st.elements.filter(e=>!e.id.startsWith(PREFIX));for(const key of ['groups','surfaces','placements'])st.environment[key]=st.environment[key].filter(e=>!e.id.startsWith(PREFIX));st.design.space.scenery=st.design.space.scenery.filter(e=>!e.id.startsWith(PREFIX));st.design.space.lights=st.design.space.lights.filter(e=>!e.id.startsWith(PREFIX));}
export function applyAct2SceneComposition(project){
 applyAct2SceneAssets(project);
 for(const st of project.stages){const n=st.metadata.stageId;if(![13,14,16,17].includes(n)||!st.design?.space||st.initialState?.honroWorksiteVersion||st.initialState?.honroTempleVersion||st.initialState?.honroVerticalStage14Revision===1)continue;clean(st);
  if(n===13){
   // The portal intersects the existing thick roof and is occluded by the
   // canonical floor at its feet. It does not substitute a visual floor.
   front(st,'stone-boundary','act2:scene-stone-threshold',4350,.93);
   revise(st,'act2:hoist-frame',{scale:.85});
   front(st,'mason-workbench','act2:scene-work-shelter',2370,.78);
   revise(st,'act2:cave-house-lean',{x:2770,scale:.92});
   light(st,'gate-west-light',4080,ground(st,4350)-220,320);
   light(st,'gate-east-light',4640,ground(st,4350)-230,280);
  }
  if(n===14){
   // Long upper household edge, one compressed market clearing, then a
   // darker rear hamlet above the descent. The central cave stays open.
   front(st,'upper-porch','act2:scene-longhouse',1530,.91);
   front(st,'upper-cookstove','act2:stone-table',1850,.83);
   rear(st,'upper-homes',1740,2780,[[-1230,200],[-1050,12],[-730,-35],[-300,-35],[-170,-195],[220,-195],[390,-100],[820,150],[1120,425]],[
    ['rear-lean','act2:cave-house-lean',-550,1.07],['rear-home','act2:cave-house',30,1.15],['rear-cloth','act2:hanging-cloth',-245,.85],['household-stair','act2:scene-upper-stair',-170,1]
   ]);
   revise(st,'act2:cave-house-ruin',{assetId:'act2:scene-longhouse',x:4148,scale:.8});
   rear(st,'market-hamlet',4150,3810,[[-1070,-260],[-820,-385],[-470,-385],[-355,-250],[15,-250],[160,-135],[560,-135],[730,90],[980,470]],[
    ['left-home','act2:cave-house',-640,1.02],['porch-home','act2:scene-longhouse',-160,.82],['right-home','act2:cave-house-lean',370,1.02],['washing-line','act2:hanging-cloth',130,.8],['connected-rear-walk','act2:scene-market-walkway',0,1]
   ]);
   front(st,'market-awning','act2:scene-market-awning',4340,.65);
   front(st,'lower-house','act2:scene-longhouse',7440,.8);
   rear(st,'lower-homes',7490,5560,[[-730,255],[-470,-105],[-60,-105],[75,-220],[460,-220],[680,130]],[
    ['river-home','act2:cave-house',-255,.96],['river-store','act2:cave-house-lean',270,1.06],['river-household-stair','act2:scene-upper-stair',80,.74]
   ]);
   light(st,'market-lantern',4240,3940,330);light(st,'upper-lantern',1550,2830,300);
  }
  if(n===16){
   // Retain the approved hall scale. Broad framing comes from a court wing
   // and a short record-side corridor rather than enlarging the landmark.
   revise(st,'act2:temple',{scale:2.05,x:4510});
   front(st,'record-side-corridor','act2:scene-temple-corridor',5970,.78);
   rear(st,'court-wing',3350,4530,[[-1010,285],[-810,30],[-620,-45],[-140,-45],[55,60],[450,180],[640,0]],[
    ['monk-wing','act2:scene-temple-corridor',-390,.9],['court-memorial','act2:memorial',70,.85]
   ]);
   rear(st,'hall-side-gallery',5110,4290,[[-560,210],[-440,-20],[-130,-20],[15,155],[370,155],[660,350],[780,650]],[
    ['side-roof','act2:scene-temple-corridor',-100,.8]
   ]);
   front(st,'court-precinct-wall','act2:scene-court-wall',1500,.87);
   front(st,'court-offering-bench','act2:stone-table',1900,1.12);
   light(st,'corridor-lamp',5780,ground(st,5970)-155,310);
  }
  if(n===17){
   revise(st,'act2:hoist-frame',{scale:1.25,x:4790});
   revise(st,'act2:timber-rack',{scale:1.15},e=>e.x<3000);
   front(st,'sheltered-brace-bay','act2:scene-work-shelter',1960,1.1);
   front(st,'hoist-workbench','act2:stone-table',4320,.95);
   front(st,'hoist-stone-shed','act2:scene-work-shelter',5260,1.0);
   front(st,'axle-tool-bay','act2:scene-work-shelter',6470,.82);
   front(st,'notes-shelter','act2:scene-market-awning',7970,.82);
   rear(st,'hoist-rear-bay',4870,4230,[[-1180,440],[-940,10],[-680,-190],[-240,-190],[-80,-65],[360,-65],[600,85],[850,390]],[
    ['stonecutters-shelter','act2:scene-work-shelter',-440,1.12],['rear-frame','act2:hoist-frame',170,1.0],['timber-stack','act2:timber-rack',590,.9]
   ]);
   light(st,'work-lamp',5270,4380,310);
  }
 }
 return project;
}
