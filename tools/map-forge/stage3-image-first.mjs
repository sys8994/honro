/** Approved whole ferry painting. Uniform world transform, source-measured
 * walking faces, independent far. No old roof/ground coordinate constraints. */
const SCALE=2.2,WIDTH=1944,HEIGHT=809;
const profiles={
 'ferry-ground':[[0,688],[150,720],[350,743],[550,761],[720,741],[840,634],[885,516],[975,517],[1080,543],[1190,568],[1280,567],[1390,526],[1490,490],[1550,456],[1615,423],[1660,401],[1740,399],[1860,405],[1944,410]],
 'ferry-side-gangway':[[0,550],[90,554],[185,563],[240,563],[280,560]],
 'dock-west':[[178,588],[250,597],[360,605],[470,607],[555,602],[640,588]],
 'dock-mid':[[592,550],[650,537],[740,519],[825,504],[879,505]],
 'dock-east':[[850,507],[885,509],[930,517]],
 'ferry-shoal':[[568,655],[605,659],[640,671],[675,681]],
 'cargo-step-1':[[1618,382],[1650,382],[1680,384]],
 'cargo-step-2':[[1795,371],[1830,370],[1870,373]],
 'warehouse-roof':[[1545,291],[1580,284],[1618,252],[1680,251],[1730,247],[1758,239],[1775,258],[1808,294],[1820,298]]
};
const points=a=>a.map(([x,y])=>({x:x*SCALE,y:y*SCALE}));
function at(x,id='ferry-ground'){const ps=profiles[id];for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i];if(x>=a[0]&&x<=b[0])return(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]))*SCALE;}throw Error('Stage3 source contact outside '+id+' '+x);}
const contact=(x,support='ferry-ground')=>({x:x*SCALE,y:at(x,support),support});
const air=(x,y)=>({x:x*SCALE,y:y*SCALE});
/** The flock owns the pier mouth, not a diagonal flight line across the bank.
 * One western scout and a three-height pocket leave the warehouse approach open.
 * Counts, clone identity, attention group and combat statistics are unchanged. */
export const STAGE3_FERRY_FLOCK={
 'foe-1-cluster':{...air(915,405),role:'잔교 끝 절벽 입구의 높은 측면 엄호'},
 'foe-4-cluster':{...air(790,475),role:'중앙 잔교 바로 위의 낮은 접근 견제'}
};
export function applyStage3FerryFlock(project){
 const s=project.stages.find(s=>s.metadata?.stageId===3);if(!s)return project;
 const roster=s.design?.stage3ImageFirst?.runtimeRoster;if(!roster)throw Error('Apply Stage3 image-first author before ferry flock patch');
 for(const [id,{x,y}]of Object.entries(STAGE3_FERRY_FLOCK))Object.assign(roster[id],{x,y});
 return project;
}
export function applyStage3ImageFirst(project){const s=project.stages.find(s=>s.metadata?.stageId===3);if(!s)return project;const prior=new Map(s.terrains.map(t=>[t.id,t]));s.width=WIDTH*SCALE;s.height=HEIGHT*SCALE;s.playBounds={left:0,top:0,right:s.width,bottom:s.height};s.terrainBounds={...s.playBounds};s.terrainDomainVersion=1;s.camera={...s.camera,focusBounds:{left:0,top:-1000,right:s.width,bottom:s.height}};
 s.terrains=Object.entries(profiles).map(([id,line])=>{const floor=id==='ferry-ground',wood=/^dock|^cargo-step-2$|roof/.test(id),soil=floor||id==='ferry-side-gangway';return{...prior.get(id),id,name:prior.get(id)?.name||id,type:'solid',layer:'terrain',baseMaterial:wood?'wood':soil?'soil':'rock',oneWay:!floor,breakable:false,points:points(floor?[...line,[WIDTH,HEIGHT],[0,HEIGHT]]:[...line,...line.toReversed().map(([x,y])=>[x,y+10])]),detail:{spacing:20,roughness:0,optimizeEpsilon:0,seed:3},properties:{...prior.get(id)?.properties,surfaceKind:wood?'wood':soil?'soil':'rock',honroWalkEdges:line.slice(1).map((_,i)=>i)}};});
 // Posts, rocks behind the path and the intact house are painted scenery;
 // only their exposed walking faces receive contacts. No full solid wall.
 s.elements=[];
 const poses={'p-archer':contact(85,'ferry-side-gangway'),'p-mage':contact(145,'ferry-side-gangway'),'npc-hwigyeom':contact(400,'dock-west'),'foe-0':contact(640,'dock-mid'),'foe-3':contact(900),'foe-1':air(760,385),'foe-4':air(510,425),'foe-2':contact(1535),'foe-5':contact(1725,'warehouse-roof'),'midboss-stage3':contact(630,'ferry-shoal')};
 for(const u of s.units){const p=poses[u.id];if(!p)continue;Object.assign(u,{x:p.x,y:p.y});if(Object.hasOwn(u,'spawnX'))u.spawnX=p.x;if(Object.hasOwn(u,'spawnY'))u.spawnY=p.y;}
 s.anchors={...s.anchors,start:poses['p-archer'],ferry:contact(520,'dock-west'),mudflat:contact(630,'ferry-shoal'),cargo:contact(1470),ledger:contact(1650,'cargo-step-1'),roof:contact(1725,'warehouse-roof'),exit:contact(1895)};
 const markers=[contact(120,'ferry-side-gangway'),contact(430,'dock-west'),contact(875,'dock-east'),contact(1000),contact(1240),contact(1670),contact(1900)];for(const[i,m]of s.markers.entries()){if(i<markers.length&&m.id!=='ledger')Object.assign(m,markers[i]);if(m.id==='ledger')Object.assign(m,s.anchors.ledger);if(m.id==='habitat-3-0')Object.assign(m,contact(1450));if(m.id==='habitat-3-1')Object.assign(m,contact(530,'dock-west'));}
 const progress={'midboss-stage3-seen':530,'dock-beasts':570,transfer:1440};for(const e of s.events){if(e.when?.progress!==undefined)e.when.progress=progress[e.id]*SCALE;if(e.id==='dock-beasts')Object.assign(e.action,{...contact(1040),spacing:180,maxDistance:260});}
 const originalWater=s.materials.find(m=>m.id==='ferry-water');s.materials=[{...originalWater,id:'ferry-water',kind:'water',support:'ferry-ground',terrainId:'ferry-ground',conductive:true,x1:0,x2:760*SCALE,surfaceY:642*SCALE,depth:90*SCALE,reference:750*SCALE,step:24,alpha:.2,surface:undefined,bottom:undefined,points:undefined}];
 s.routes=[s.anchors.start,contact(260,'ferry-side-gangway'),contact(360,'dock-west'),contact(590,'dock-west'),contact(660,'dock-mid'),contact(875,'dock-east'),contact(1000),contact(1240),contact(1470),s.anchors.ledger,s.anchors.exit];s.design.act1Scene={version:2,scenery:[],rocks:[],replaced:[]};delete s.design.stage3Hanok;delete s.design.forestChoice;
 s.design.stage3ImageFirst={storyThread:{from:air(1588,313),at:air(1620,315),to:air(1673,313),tail:air(1622,330)},revision:1,quietLayers:1,far:'quietFar',image:'stage3QuietNear',source:{width:WIDTH,height:HEIGHT},transform:{x:0,y:0,scale:SCALE},artBounds:{left:0,top:0,right:s.width,bottom:s.height},runtimeRoster:{'foe-0-cluster':contact(1090),'foe-3-cluster':contact(1200),'foe-1-cluster':air(1340,255),'foe-4-cluster':air(1110,370),'foe-2-cluster':contact(1640),'foe-5-cluster':contact(1885)},routes:{main:s.routes,roof:[contact(1770),contact(1820,'cargo-step-2'),contact(1810,'warehouse-roof'),contact(1725,'warehouse-roof')]},waterClip:points([[0,682],[200,674],[300,690],[430,709],[620,730],[725,740],[640,770],[350,752],[130,724],[0,735]])};
 Object.assign(s.initialState,{width:s.width,height:s.height,routePoints:s.routes});delete s.initialState.honroStage3HanokRevision;return applyStage3FerryFlock(project);
}
