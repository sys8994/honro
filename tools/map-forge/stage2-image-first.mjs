/** Stage2 approved quiet transparent near, independent shared far.
 * Source contacts are read inside actual rock/dirt top planes of the new art. */
const SCALE=2.2,WIDTH=1672,HEIGHT=941;
const profiles={
 'canyon-ground':[[0,566],[120,585],[300,614],[480,635],[700,661],[930,687],[1150,688],[1360,680],[1540,668],[1672,657]],
 'left-high-ground':[[75,366],[140,375],[205,400],[270,430],[310,458]],
 'left-shoulder-low':[[70,495],[130,502],[190,517],[250,530],[315,542],[355,552]],
 'left-shoulder-high':[[355,426],[405,438],[465,458],[500,475]],
 'right-cliff-ground':[[1350,430],[1400,438],[1450,455],[1500,480],[1540,495]],
 'right-shoulder-middle':[[1260,493],[1310,506],[1370,520],[1440,546]],
 'right-shoulder-low':[[1510,557],[1570,577],[1640,591],[1672,595]]
};
const points=a=>a.map(([x,y])=>({x:x*SCALE,y:y*SCALE}));
const at=(x,support='canyon-ground')=>{for(let i=1;i<profiles[support].length;i++){const a=profiles[support][i-1],b=profiles[support][i];if(x>=a[0]&&x<=b[0])return(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]))*SCALE;}throw Error('Stage2 quiet contact outside '+support+' '+x);};
const contact=(x,support='canyon-ground',dy=0)=>({x:x*SCALE,y:at(x,support)+dy,support});
export function applyStage2ImageFirst(project){
 const s=project.stages.find(s=>s.metadata?.stageId===2);if(!s)return project;const prior=new Map(s.terrains.map(t=>[t.id,t]));s.width=WIDTH*SCALE;s.height=HEIGHT*SCALE;s.playBounds={left:0,top:0,right:s.width,bottom:s.height};s.terrainBounds={...s.playBounds};s.terrainDomainVersion=1;
 s.terrains=Object.entries(profiles).map(([id,line])=>{const floor=id==='canyon-ground';return{...prior.get(id),id,name:prior.get(id)?.name||id,type:'solid',layer:'terrain',baseMaterial:floor?'soil':'rock',oneWay:!floor,breakable:false,points:points(floor?[...line,[WIDTH,HEIGHT],[0,HEIGHT]]:[...line,...line.toReversed().map(([x,y])=>[x,y+17])]),detail:{spacing:18,roughness:0,optimizeEpsilon:0,seed:2},properties:{...prior.get(id)?.properties,surfaceKind:floor?'soil':'rock',honroWalkEdges:line.slice(1).map((_,i)=>i)}};});
 // The whole original art stays intact. Only the actual rear rock top planes
 // have one-way contacts; the continuous front procession road has no wall.
 s.elements=[];
 const poses={'p-archer':contact(180,'left-high-ground'),'foe-0':contact(410,'left-shoulder-high'),'foe-3':contact(810),'foe-1':contact(1375,'right-cliff-ground',-32),'foe-4':{x:1170*SCALE,y:520*SCALE},'foe-2':contact(1430),'foe-5':contact(1290),objective:contact(300),'ally-bokman':contact(245),'ally-baeksan':contact(415),'npc-damheo':contact(370),'npc-yeonsil':contact(185)};
 for(const u of s.units){const p=poses[u.id];if(!p)continue;Object.assign(u,{x:p.x,y:p.y});if(Object.hasOwn(u,'spawnX'))u.spawnX=p.x;if(Object.hasOwn(u,'spawnY'))u.spawnY=p.y;}
 s.anchors={...s.anchors,archerPerch:contact(180,'left-high-ground'),procession:contact(300),leftBasin:contact(660),rightBasin:contact(1080),rightShelf:contact(1440,'right-cliff-ground'),exit:{x:3340,y:at(3340/SCALE),support:'canyon-ground'}};
 const markers=[contact(180,'left-high-ground'),contact(300),contact(550),contact(970),contact(1110),contact(1440,'right-cliff-ground'),contact(1500,'right-cliff-ground')];for(const[i,m]of s.markers.entries())Object.assign(m,markers[i]);
 const progress={'procession-seen':330,'road-pressure':650,'sniper-seen':870,'right-cliff':1120,'last-flight':1390};const rebase=(w,x)=>{if(!w)return;if(w.progress!==undefined)w.progress=x;if(w.any)w.any.forEach(v=>rebase(v,x));};for(const e of s.events){rebase(e.when,progress[e.id]*SCALE);if(e.id==='road-pressure'&&e.action?.type==='spawn')Object.assign(e.action,{...contact(720),spacing:175,maxDistance:230});}
 const waters=s.materials.filter(m=>m.conductive&&/water/.test(m.kind));s.materials=waters.map((m,i)=>({...m,kind:'shallow-water',terrainId:'canyon-ground',support:'canyon-ground',x1:[1120,1360][i]*SCALE,x2:[1190,1420][i]*SCALE,reference:at([1150,1390][i]),depth:7,alpha:.13,points:undefined,surface:undefined,bottom:undefined}));
 s.routes=[300,660,950,1200,3340/SCALE].map(x=>contact(x));s.design.act1Scene={version:2,scenery:[],rocks:[],replaced:[]};
 s.design.stage2ImageFirst={revision:2,quietLayers:1,far:'quietFar',image:'stage2QuietNear',source:{width:WIDTH,height:HEIGHT},transform:{x:0,y:0,scale:SCALE},artBounds:{left:0,top:0,right:s.width,bottom:s.height},walkRibbon:points(profiles['canyon-ground']),runtimeRoster:{'foe-0-cluster':contact(250,'left-shoulder-low'),'foe-3-cluster':contact(900),'foe-1-cluster':contact(1490,'right-cliff-ground',-32),'foe-4-cluster':{x:1230*SCALE,y:490*SCALE},'foe-2-cluster':contact(1500),'foe-5-cluster':contact(1350)},routes:{road:s.routes,left:[contact(250),contact(250,'left-shoulder-low'),contact(300,'left-high-ground'),contact(385,'left-shoulder-high')],right:[contact(1590),contact(1590,'right-shoulder-low'),contact(1420,'right-shoulder-middle'),contact(1450,'right-cliff-ground')]}};
 Object.assign(s.initialState,{width:s.width,height:s.height,honroEscortGoalX:3340,honroStage2AirborneRevision:1});return project;
}
