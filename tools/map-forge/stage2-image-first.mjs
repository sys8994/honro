/** Stage2 only. New original place first; contacts measured within its ground.
 * No former terrain contour was used to generate or shape the artwork. */
const SCALE=2.4,WIDTH=1536,HEIGHT=1024;
const profiles={
 'canyon-ground':[[0,632],[180,635],[350,641],[550,645],[760,650],[960,650],[1160,648],[1360,644],[1536,642]],
 'left-high-ground':[[0,311],[120,312],[240,315],[335,322],[405,328]],
 'left-shoulder-high':[[235,382],[310,386],[375,392],[425,396]],
 'left-shoulder-middle':[[375,490],[430,480],[500,468],[565,456]],
 'left-shoulder-low':[[325,558],[390,565],[465,578],[545,590],[610,603]],
 'right-cliff-ground':[[1250,400],[1320,399],[1400,400],[1475,405],[1536,410]],
 'right-shoulder-high':[[1430,454],[1480,457],[1536,460]],
 'right-shoulder-middle':[[1425,506],[1480,507],[1536,512]],
 'right-shoulder-low':[[1300,571],[1380,564],[1450,568],[1536,579]]
};
const pts=a=>a.map(([x,y])=>({x:x*SCALE,y:y*SCALE}));
const at=(x,support='canyon-ground')=>{for(let i=1;i<profiles[support].length;i++){const a=profiles[support][i-1],b=profiles[support][i];if(x>=a[0]&&x<=b[0])return(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]))*SCALE;}throw Error('Stage2 artwork contact outside '+support+' '+x);};
const contact=(x,support='canyon-ground',dy=0)=>({x:x*SCALE,y:at(x,support)+dy,support});
export function applyStage2ImageFirst(project){
 const s=project.stages.find(s=>s.metadata?.stageId===2);if(!s)return project;
 const old=new Map(s.terrains.map(t=>[t.id,t]));s.width=WIDTH*SCALE;s.height=HEIGHT*SCALE;
 s.playBounds={left:0,top:0,right:s.width,bottom:s.height};s.terrainBounds={...s.playBounds};s.terrainDomainVersion=1;
 s.terrains=Object.entries(profiles).map(([id,line])=>{const floor=id==='canyon-ground';return{...old.get(id),id,name:old.get(id)?.name||id,type:'solid',layer:'terrain',baseMaterial:floor?'soil':'rock',oneWay:!floor,breakable:false,points:pts(floor?[...line,[WIDTH,HEIGHT],[0,HEIGHT]]:[...line,...line.toReversed().map(([x,y])=>[x,y+17])]),detail:{spacing:18,roughness:0,optimizeEpsilon:0,seed:2},properties:{...old.get(id)?.properties,surfaceKind:floor?'soil':'rock',honroWalkEdges:line.slice(1).map((_,i)=>i)}};});
 // The upper rock ribbons are behind the lower procession road in the new
 // painting. One-way contact tops keep that front road physically continuous.
 // They do not create an invisible wall or ceiling across the bier's route.
 s.elements=[];
 const poses={
  'p-archer':contact(180,'left-high-ground'),
  'foe-0':contact(480,'left-shoulder-middle'), 'foe-3':contact(800),
  'foe-1':contact(1370,'right-cliff-ground',-22), 'foe-4':{x:1170*SCALE,y:470*SCALE},
  'foe-2':contact(1310), 'foe-5':contact(1180),
  objective:contact(300),'ally-bokman':contact(245),'ally-baeksan':contact(425),
  'npc-damheo':contact(370),'npc-yeonsil':contact(185)
 };
 for(const u of s.units){const p=poses[u.id];if(!p)continue;Object.assign(u,{x:p.x,y:p.y});if(Object.hasOwn(u,'spawnX'))u.spawnX=p.x;if(Object.hasOwn(u,'spawnY'))u.spawnY=p.y;}
 s.anchors={...s.anchors,archerPerch:contact(180,'left-high-ground'),procession:contact(300),leftBasin:contact(630),rightBasin:contact(1040),rightShelf:contact(1350,'right-cliff-ground'),exit:{x:3340,y:at(3340/SCALE),support:'canyon-ground'}};
 const markers=[contact(180,'left-high-ground'),contact(300),contact(590),contact(970),contact(1080),contact(1350,'right-cliff-ground'),contact(1490,'right-cliff-ground')];for(const [i,m]of s.markers.entries())Object.assign(m,markers[i]);
 const progress={'procession-seen':300,'road-pressure':600,'sniper-seen':805,'right-cliff':1040,'last-flight':1310};
 const rebase=(when,value)=>{if(!when)return;if(when.progress!==undefined)when.progress=value;if(when.any)when.any.forEach(q=>rebase(q,value));};
 for(const e of s.events){rebase(e.when,progress[e.id]*SCALE);if(e.id==='road-pressure'&&e.action?.type==='spawn')Object.assign(e.action,{...contact(685),spacing:180,maxDistance:250});}
 const waters=s.materials.filter(m=>m.conductive&&/water/.test(m.kind));s.materials=waters.map((m,i)=>({...m,kind:'shallow-water',terrainId:'canyon-ground',support:'canyon-ground',x1:[670,1040][i]*SCALE,x2:[755,1110][i]*SCALE,reference:at([700,1070][i]),depth:8,alpha:.16,points:undefined,surface:undefined,bottom:undefined}));
 s.routes=[300,600,850,1100,3340/SCALE].map(x=>contact(x));
 s.design.act1Scene={version:2,scenery:[],rocks:[],replaced:[]};
 s.design.stage2ImageFirst={revision:1,image:'stage2Place',source:{width:WIDTH,height:HEIGHT},transform:{x:0,y:0,scale:SCALE},artBounds:{left:0,top:0,right:s.width,bottom:s.height},walkRibbon:pts(profiles['canyon-ground']),runtimeRoster:{
  'foe-0-cluster':contact(550,'left-shoulder-low'), 'foe-3-cluster':contact(875),
  'foe-1-cluster':contact(1280,'right-cliff-ground',-22), 'foe-4-cluster':{x:1220*SCALE,y:440*SCALE},
  'foe-2-cluster':contact(1380),'foe-5-cluster':contact(1250)
 },routes:{road:s.routes,left:[contact(375),contact(365,'left-shoulder-low'),contact(425,'left-shoulder-middle'),contact(410,'left-shoulder-high'),contact(360,'left-high-ground')],right:[contact(1460),contact(1460,'right-shoulder-low'),contact(1490,'right-shoulder-middle'),contact(1490,'right-shoulder-high'),contact(1490,'right-cliff-ground')]}};
 // Preserve the existing escort/airborne contract, action opportunity and caps.
 Object.assign(s.initialState,{width:s.width,height:s.height,honroEscortGoalX:3340,honroStage2AirborneRevision:1});
 return project;
}
