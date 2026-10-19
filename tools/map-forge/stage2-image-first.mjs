/** Stage2 approved quiet transparent near, independent shared far.
 * Source contacts are read inside actual rock/dirt top planes of the new art. */
const SCALE=2.2,WIDTH=1672,HEIGHT=941;
const profiles={
 'canyon-ground':[[0,628],[120,650],[300,684],[480,712],[700,741],[930,762],[1150,768],[1360,758],[1540,740],[1672,719]],
 'left-high-ground':[[0,110],[100,126],[220,143],[350,149],[425,145],[468,145],[487,153]],
 'left-shoulder-high':[[505,167],[535,179],[575,196],[610,205]],
 'left-inner-shelf':[[178,209],[215,219],[260,237],[300,246],[330,261]],
 'left-shoulder-low':[[565,365],[610,373],[665,380],[709,394]],
 'left-lower-shelf':[[740,535],[765,543],[788,560]],
 'left-toe':[[824,594],[850,602],[875,619]],
 'right-cliff-ground':[[1340,213],[1390,214],[1440,226],[1500,237],[1580,248],[1672,265]],
 'right-upper-shelf':[[1440,313],[1490,313],[1540,328],[1600,341],[1672,350]],
 'right-shoulder-middle':[[1265,394],[1295,400],[1325,412],[1342,426]],
 'right-shoulder-low':[[1147,568],[1190,575],[1238,587]],
 'right-front-shelf':[[1285,624],[1320,621],[1380,637],[1425,653]]
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
 const poses={'p-archer':contact(475,'left-high-ground'),'foe-0':contact(760),'foe-3':contact(1060),'foe-1':contact(1390,'right-cliff-ground',-60),'foe-4':{x:1110*SCALE,y:400*SCALE},'foe-2':contact(1430),'foe-5':contact(1270),objective:contact(300),'ally-bokman':contact(245),'ally-baeksan':contact(415),'npc-damheo':contact(370),'npc-yeonsil':contact(185)};
 for(const u of s.units){const p=poses[u.id];if(!p)continue;Object.assign(u,{x:p.x,y:p.y});if(Object.hasOwn(u,'spawnX'))u.spawnX=p.x;if(Object.hasOwn(u,'spawnY'))u.spawnY=p.y;}
 s.anchors={...s.anchors,archerPerch:contact(475,'left-high-ground'),procession:contact(300),leftBasin:contact(660),rightBasin:contact(1080),rightShelf:contact(1440,'right-cliff-ground'),exit:{x:3340,y:at(3340/SCALE),support:'canyon-ground'}};
 const markers=[contact(475,'left-high-ground'),contact(300),contact(550),contact(970),contact(1110),contact(1440,'right-cliff-ground'),contact(1500,'right-cliff-ground')];for(const[i,m]of s.markers.entries())Object.assign(m,markers[i]);
 const progress={'procession-seen':330,'road-pressure':650,'sniper-seen':870,'right-cliff':1120,'last-flight':1390};const rebase=(w,x)=>{if(!w)return;if(w.progress!==undefined)w.progress=x;if(w.any)w.any.forEach(v=>rebase(v,x));};for(const e of s.events){rebase(e.when,progress[e.id]*SCALE);if(e.id==='road-pressure'&&e.action?.type==='spawn')Object.assign(e.action,{...contact(720),spacing:175,maxDistance:230});}
 const waters=s.materials.filter(m=>m.conductive&&/water/.test(m.kind));s.materials=waters.map((m,i)=>({...m,kind:'shallow-water',terrainId:'canyon-ground',support:'canyon-ground',x1:[1120,1360][i]*SCALE,x2:[1190,1420][i]*SCALE,reference:at([1150,1390][i]),depth:7,alpha:.13,points:undefined,surface:undefined,bottom:undefined}));
 s.routes=[300,660,950,1200,3340/SCALE].map(x=>contact(x));s.design.act1Scene={version:2,scenery:[],rocks:[],replaced:[]};
 s.design.stage2ImageFirst={revision:3,quietLayers:1,highCliffs:1,overwatchView:{x:790*SCALE,y:425*SCALE,spanY:835*SCALE},far:'quietFar',image:'stage2QuietNear',source:{width:WIDTH,height:HEIGHT},transform:{x:0,y:0,scale:SCALE},artBounds:{left:0,top:0,right:s.width,bottom:s.height},walkRibbon:points(profiles['canyon-ground']),runtimeRoster:{'foe-0-cluster':contact(840),'foe-3-cluster':contact(1130),'foe-1-cluster':contact(1540,'right-cliff-ground',-60),'foe-4-cluster':{x:1200*SCALE,y:440*SCALE},'foe-2-cluster':contact(1500),'foe-5-cluster':contact(1350)},routes:{road:s.routes,left:[contact(475,'left-high-ground'),contact(560,'left-shoulder-high'),contact(630,'left-shoulder-low'),contact(760,'left-lower-shelf'),contact(850,'left-toe'),contact(960)],right:[contact(1460,'right-cliff-ground'),contact(1490,'right-upper-shelf'),contact(1310,'right-shoulder-middle'),contact(1190,'right-shoulder-low'),contact(1190)]}};
 Object.assign(s.initialState,{width:s.width,height:s.height,honroEscortGoalX:3340,honroStage2AirborneRevision:1});return project;
}
