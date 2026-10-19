/** Approved balanced forest. Uniform source coordinates, full 6000-world route. */
const WIDTH=1774,HEIGHT=887,SCALE=6000/WIDTH;
const ground=[[0,765],[100,761],[180,750],[260,735],[320,716],[370,697],[420,671],[465,643],[510,626],[550,615],[620,612],[700,614],[780,611],[860,603],[920,585],[970,565],[1010,540],[1050,520],[1100,511],[1180,505],[1260,504],[1340,502],[1390,492],[1430,476],[1470,448],[1510,421],[1550,400],[1575,380],[1575,351],[1620,343],[1670,313],[1710,289],[1774,261]];
const supports={
 'fc-choice-1-low-pine-root':[[280,677],[316,646],[352,631],[390,610],[414,618],[451,633]],
 'pine-branch-east':[[405,523],[426,527],[446,537],[470,552],[494,558],[513,566]],
 'forest-boulder-a':[[910,527],[940,500],[980,487],[1010,486]],
 'forest-boulder-b':[[1410,331],[1460,342],[1520,351],[1575,351],[1610,345]]
};
const points=a=>a.map(([x,y])=>({x:x*SCALE,y:y*SCALE}));
const at=(x,line=ground)=>{for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i];if(x>=a[0]&&x<=b[0]&&b[0]>a[0])return(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]))*SCALE;}throw Error('Stage1 balanced contact outside '+x);};
const contact=(x,support='forest-floor')=>({x:x*SCALE,y:at(x,support==='forest-floor'?ground:supports[support]),support});
export function applyStage1ImageFirst(project){
 const s=project.stages.find(s=>s.metadata?.stageId===1);if(!s)return project;const prior=new Map(s.terrains.map(t=>[t.id,t]));
 s.width=6000;s.height=3000;s.playBounds={left:0,top:0,right:s.width,bottom:s.height};s.terrainBounds={...s.playBounds};s.terrainDomainVersion=1;
 // Camera focus/zoom stays with HonroBounds, independent of the finite painting.
 s.camera={...s.camera};delete s.camera.focusBounds;
 const detail={spacing:18,roughness:0,optimizeEpsilon:0,seed:1};
 const floor={...prior.get('forest-floor'),id:'forest-floor',playProjection:undefined,type:'solid',layer:'terrain',baseMaterial:'soil',oneWay:false,points:points([...ground,[WIDTH,HEIGHT],[0,HEIGHT]]),detail,properties:{...prior.get('forest-floor')?.properties,honroWalkEdges:ground.slice(1).map((_,i)=>i)}};
 s.terrains=[floor,...Object.entries(supports).map(([id,line])=>{const wood=['fc-choice-1-low-pine-root','pine-branch-east'].includes(id),breakable=id==='pine-branch-east';return{...prior.get(id),id,name:prior.get(id)?.name||id,playProjection:undefined,type:'solid',layer:'terrain',baseMaterial:wood?'wood':'rock',oneWay:true,breakable,points:points([...line,...line.toReversed().map(([x,y])=>[x,y+12])]),detail,properties:{...prior.get(id)?.properties,hp:breakable?340:99999,maxHp:breakable?340:99999,honroWalkEdges:line.slice(1).map((_,i)=>i)}};})];
 // Existing painted roots, the broad boulder, and the upper bank. No new
 // platform art, gray vectors, repeated cards, or terrain texture clips.
 s.elements=[];
 const poses={'p-archer':contact(45),'foe-0':contact(1100),'foe-1':{x:650*SCALE,y:530*SCALE},'foe-2':contact(1690),'foe-3':contact(1430),'npc-woodcutter':contact(1660)};
 for(const u of s.units){const p=poses[u.id];if(!p)continue;Object.assign(u,{x:p.x,y:p.y});if(Object.hasOwn(u,'spawnX'))u.spawnX=p.x;if(Object.hasOwn(u,'spawnY'))u.spawnY=p.y;}
 s.anchors={...s.anchors,start:contact(45),cart:contact(1100),shrine:contact(400,'fc-choice-1-low-pine-root'),lookout:contact(440,'pine-branch-east'),ridge:contact(1690),woodcutter:contact(1660),exit:contact(1735)};
 const markerX=[45,1100,600,900,1040,1690,1660,1735];for(const[i,m]of s.markers.entries())Object.assign(m,contact(markerX[i]));
 const progress={cart:1020,more:250,witness:1600,ridge:1650};for(const e of s.events){if(e.when?.progress!==undefined)e.when.progress=progress[e.id]*SCALE;if(e.id==='cart'&&e.action?.type==='spawn'){const n=e.action.n,make=(x,count)=>({...e.action,n:count,...contact(x),spacing:165,maxDistance:210});e.action={type:'multi',actions:[make(1140,Math.ceil(n/2)),make(1460,Math.floor(n/2))].filter(a=>a.n)};}}
 const water=s.materials.find(m=>m.id==='creek-water');s.materials=water?[{...water,kind:'shallow-water',terrainId:'forest-floor',support:'forest-floor',x1:1020*SCALE,x2:1160*SCALE,reference:at(1100),depth:9,alpha:.15,surface:undefined,bottom:undefined,points:undefined}]:[];
 const walk=[45,320,440,550,780,1010,1180,1390,1550,1570,1590,1660,1735].map(x=>contact(x));s.routes=walk;
 s.design.act1Scene={...s.design.act1Scene,scenery:[],rocks:[],replaced:[]};
 s.design.forestChoice={version:3,supportId:'fc-choice-1-low-pine-root',treeX:400*SCALE,from:contact(440),to:contact(440,'fc-choice-1-low-pine-root'),required:false};
 s.design.stage1ImageFirst={revision:3,balancedForest:1,quietLayers:1,far:'quietFar',image:'stage1BalancedNear',source:{width:WIDTH,height:HEIGHT},transform:{x:0,y:0,scale:SCALE},artBounds:{left:0,top:0,right:s.width,bottom:s.height},fringe:{bottomStart:805,bottomVariation:12,bottomEnd:885},walkRibbon:points(ground),runtimeRoster:{'foe-0-cluster':contact(1040),'foe-1-cluster':{x:730*SCALE,y:515*SCALE},'foe-2-cluster':contact(1740),'foe-3-cluster':contact(1320)},
  brokenBoughMask:[[432,525],[462,538],[485,551],[519,550],[537,574],[508,579],[478,567],[451,551],[433,544]],
  routes:{walk,root:[contact(440),contact(438,'fc-choice-1-low-pine-root'),contact(370,'fc-choice-1-low-pine-root')],ascent:[contact(550),contact(505,'pine-branch-east'),contact(430,'pine-branch-east')],stone:[contact(1030),contact(990,'forest-boulder-a'),contact(945,'forest-boulder-a')],upper:[contact(1735),contact(1620),contact(1590,'forest-boulder-b'),contact(1440,'forest-boulder-b')]}};
 Object.assign(s.initialState,{width:s.width,height:s.height,routePoints:walk});return project;
}
