/** Stage1: approved quiet transparent near art and an independent shared far.
 * Source contacts are measured within the new broad ground/wood top planes. */
const SCALE=2,WIDTH=1672,HEIGHT=941;
const ground=[[0,515],[80,537],[160,561],[260,582],[430,611],[600,631],[790,654],[980,673],[1120,689],[1230,702],[1320,700],[1420,678],[1540,653],[1672,636]];
const supports={
 'fc-choice-1-low-pine-root':[[78,443],[112,440],[142,448],[166,462]],
 'pine-branch-east':[[175,342],[210,326],[245,309],[285,298],[325,302],[370,319],[415,325]],
 'forest-boulder-a':[[238,451],[280,460],[320,479],[355,496]],
 'forest-boulder-b':[[690,551],[750,549],[830,555],[910,570],[990,583]]
};
const points=a=>a.map(([x,y])=>({x:x*SCALE,y:y*SCALE}));
const at=(x,line=ground)=>{for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i];if(x>=a[0]&&x<=b[0])return(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]))*SCALE;}throw Error('Stage1 quiet art contact outside '+x);};
const contact=(x,support='forest-floor')=>({x:x*SCALE,y:at(x,support==='forest-floor'?ground:supports[support]),support});
export function applyStage1ImageFirst(project){
 const s=project.stages.find(s=>s.metadata?.stageId===1);if(!s)return project;const prior=new Map(s.terrains.map(t=>[t.id,t]));
 s.width=WIDTH*SCALE;s.height=HEIGHT*SCALE;s.playBounds={left:0,top:0,right:s.width,bottom:s.height};s.terrainBounds={...s.playBounds};s.terrainDomainVersion=1;
 const floor={...prior.get('forest-floor'),id:'forest-floor',type:'solid',layer:'terrain',baseMaterial:'soil',oneWay:false,points:points([...ground,[WIDTH,HEIGHT],[0,HEIGHT]]),detail:{spacing:18,roughness:0,optimizeEpsilon:0,seed:1},properties:{...prior.get('forest-floor')?.properties,honroWalkEdges:ground.slice(1).map((_,i)=>i)}};
 s.terrains=[floor,...Object.entries(supports).map(([id,line])=>({...prior.get(id),id,name:prior.get(id)?.name||id,type:'solid',layer:'terrain',baseMaterial:id.startsWith('forest-boulder')?'rock':'wood',oneWay:true,breakable:id.startsWith('forest-boulder')?false:prior.get(id)?.breakable,points:points([...line,...line.toReversed().map(([x,y])=>[x,y+(id.startsWith('forest-boulder')?20:12)])]),detail:{spacing:18,roughness:0,optimizeEpsilon:0,seed:1},properties:{...prior.get(id)?.properties,honroWalkEdges:line.slice(1).map((_,i)=>i)}}))];
 // No invented west bough: this source has one visibly substantial natural arm.
 // Rear stone top contacts are one-way so the broad path in front stays open.
 s.elements=[];
 const poses={'p-archer':contact(45),'foe-0':contact(960),'foe-1':contact(245,'pine-branch-east'),'foe-2':contact(1530),'foe-3':contact(1330),'npc-woodcutter':contact(1450)};
 for(const u of s.units){const p=poses[u.id];if(!p)continue;Object.assign(u,{x:p.x,y:p.y});if(Object.hasOwn(u,'spawnX'))u.spawnX=p.x;if(Object.hasOwn(u,'spawnY'))u.spawnY=p.y;}
 s.anchors={...s.anchors,start:contact(45),cart:contact(1190),shrine:contact(120,'fc-choice-1-low-pine-root'),lookout:contact(320,'pine-branch-east'),ridge:contact(1510),woodcutter:contact(1450),exit:contact(1625)};
 const markerX=[45,1190,420,780,870,1510,1460,1625];for(const[i,m]of s.markers.entries())Object.assign(m,contact(markerX[i]));
 const progress={cart:1100,more:170,witness:1390,ridge:1500};for(const e of s.events){if(e.when?.progress!==undefined)e.when.progress=progress[e.id]*SCALE;if(e.id==='cart'&&e.action?.type==='spawn'){const n=e.action.n,make=(x,count)=>({...e.action,n:count,...contact(x),spacing:165,maxDistance:210});e.action={type:'multi',actions:[make(1030,Math.ceil(n/2)),make(1470,Math.floor(n/2))].filter(a=>a.n)};}}
 const water=s.materials.find(m=>m.id==='creek-water');s.materials=water?[{...water,kind:'shallow-water',terrainId:'forest-floor',support:'forest-floor',x1:1180*SCALE,x2:1320*SCALE,reference:at(1240),depth:9,alpha:.15,surface:undefined,bottom:undefined,points:undefined}]:[];
 s.routes=[45,430,790,1130,1370,1625].map(x=>contact(x));s.design.act1Scene={version:2,scenery:[],rocks:[],replaced:[]};
 s.design.forestChoice={version:3,supportId:'fc-choice-1-low-pine-root',treeX:145*SCALE,from:contact(100),to:contact(112,'fc-choice-1-low-pine-root'),required:false};
 s.design.stage1ImageFirst={revision:2,quietLayers:1,far:'quietFar',image:'stage1QuietNear',source:{width:WIDTH,height:HEIGHT},transform:{x:0,y:0,scale:SCALE},artBounds:{left:0,top:0,right:s.width,bottom:s.height},walkRibbon:points(ground),runtimeRoster:{'foe-0-cluster':contact(820,'forest-boulder-b'),'foe-1-cluster':contact(370,'pine-branch-east'),'foe-2-cluster':contact(1610),'foe-3-cluster':contact(1390)},
  // Art-space destruction mask only, never a terrain/collision paint clip.
  brokenBoughMask:[[188,342],[223,316],[290,277],[390,255],[530,278],[662,322],[755,369],[751,418],[676,446],[531,424],[399,383],[290,352],[220,358]],
  routes:{walk:s.routes,ascent:[contact(100),contact(112,'fc-choice-1-low-pine-root'),contact(190,'pine-branch-east'),contact(320,'pine-branch-east')],stone:[contact(800),contact(820,'forest-boulder-b')]}};
 Object.assign(s.initialState,{width:s.width,height:s.height});return project;
}
