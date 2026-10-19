/** Three unique source paintings, independently placed at character scale.
 * World dimensions are campaign constraints, not an image resize target. */
const WIDTH=1774,HEIGHT=887,MAP_WIDTH=6000,MAP_HEIGHT=3000,SCALE=1.23;
const cardWidth=WIDTH*SCALE,overlap=(cardWidth*3-MAP_WIDTH)/2,step=cardWidth-overlap;
const entryLine=[[0,760],[80,749],[170,734],[250,726],[340,725],[430,716],[520,707],[600,692],[700,685],[800,676],[900,667],[940,654],[980,637],[1020,619],[1080,610],[1160,605],[1230,590],[1300,573],[1360,548],[1400,523],[1450,500],[1510,485],[1580,476],[1640,464],[1690,449],[1774,424]];
const middleLine=[[0,765],[100,761],[180,750],[260,735],[320,716],[370,697],[420,671],[465,643],[510,626],[550,615],[620,612],[700,614],[780,611],[860,603],[920,585],[970,565],[1010,540],[1050,520],[1100,511],[1180,505],[1260,504],[1340,502],[1390,492],[1430,476],[1470,448],[1510,421],[1550,400],[1575,380],[1575,351],[1620,343],[1670,313],[1710,289],[1774,261]];
const exitLine=[[0,747],[80,744],[160,733],[250,721],[340,714],[410,705],[480,685],[540,660],[600,630],[670,607],[750,587],[820,577],[900,566],[950,547],[990,526],[1040,509],[1100,504],[1190,501],[1270,500],[1340,486],[1400,456],[1460,419],[1520,389],[1570,372],[1600,349],[1600,326],[1650,308],[1710,282],[1774,255]];
const middleSupports={
 'fc-choice-1-low-pine-root':{wood:true,line:[[280,677],[316,646],[352,631],[390,610],[414,618],[451,633]]},
 'pine-branch-east':{wood:true,breakable:true,line:[[405,523],[426,527],[446,537],[470,552],[494,558],[513,566]]},
 'pine-crotch':{wood:true,line:[[435,401],[475,387],[515,380],[545,387],[570,403],[600,422]]},
 'pine-upper-bough':{wood:true,line:[[495,325],[530,331],[570,349],[620,368],[670,382],[700,390]]},
 'forest-boulder-a':{line:[[910,527],[940,500],[980,487],[1010,486]]},
 'forest-boulder-b':{line:[[1410,331],[1460,342],[1520,351],[1575,351],[1610,345]]}
};
const exitSupports={'exit-rock-shelf':{line:[[1225,270],[1280,272],[1330,285],[1380,301],[1420,311]]}};
const brokenBoughMask=[[432,525],[462,538],[485,551],[519,550],[537,574],[508,579],[478,567],[451,551],[433,544]];
function sourceY(x,line){for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i];if(x>=a[0]-1e-7&&x<=b[0]+1e-7&&b[0]>a[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}throw Error('Stage1 source contact outside '+x);}
function clipLine(line,left,right){return[[left,sourceY(left,line)],...line.filter(p=>p[0]>left&&p[0]<right),[right,sourceY(right,line)]];}
function profile(terrainId,line,oneWay,baseMaterial='soil',breakable=false){return{terrainId,baseMaterial,oneWay,breakable,sourceLine:line,sourceBody:oneWay?[...line,...line.toReversed().map(([x,y])=>[x,y+12])]:[...line,[line.at(-1)[0],HEIGHT],[line[0][0],HEIGHT]]};}
function makeSections(){
 const defs=[['entry','stage1ForestStartNear',entryLine,{}],['middle','stage1BalancedNear',middleLine,middleSupports],['exit','stage1ForestExitNear',exitLine,exitSupports]];
 const list=defs.map(([id,image,line,supports],i)=>({id,image,tone:'source',source:{width:WIDTH,height:HEIGHT},transform:{x:i*step,y:i?0:1600,scale:SCALE},fullLine:line,contacts:[],exterior:{mode:'fringe',collision:false,padding:192,edges:{left:i===0,right:i===2,bottom:true},bottomStart:805,bottomVariation:12,bottomEnd:885},damageMasks:id==='middle'?[{terrainId:'pine-branch-east',sourcePoints:brokenBoughMask}]:[],supports}));
 const seams=[(cardWidth+step)/2,(step+cardWidth+step*2)/2];
 for(let i=1;i<list.length;i++){const a=list[i-1],b=list[i],x=seams[i-1];b.transform.y=a.transform.y+sourceY((x-a.transform.x)/SCALE,a.fullLine)*SCALE-sourceY((x-b.transform.x)/SCALE,b.fullLine)*SCALE;}
 for(let i=0;i<list.length;i++){
  const s=list[i],q=s.transform,left=i?seams[i-1]:0,right=i===2?MAP_WIDTH:seams[i];s.ownership={left,right};
  const line=clipLine(s.fullLine,(left-q.x)/SCALE,(right-q.x)/SCALE),id=i===0?'forest-floor':'forest-'+s.id+'-floor';s.contacts.push(profile(id,line,false));
  for(const [terrainId,v]of Object.entries(s.supports))s.contacts.push(profile(terrainId,v.line,true,v.wood?'wood':'rock',!!v.breakable));
  s.joinFade={};if(i)s.joinFade.left=[(seams[i-1]-48-q.x)/SCALE,(seams[i-1]+48-q.x)/SCALE];if(i<2)s.joinFade.right=[(seams[i]-48-q.x)/SCALE,(seams[i]+48-q.x)/SCALE];
  // Align only the deep visual margin. These source-space alpha contours never
  // create collision or trim the walk surface/roots/standable rock caps.
  s.exterior.bottomPhaseOffset=q.x/(SCALE*WIDTH);
  if(i<2){const delta=(list[i+1].transform.y-q.y)/SCALE,j=(seams[i]-q.x)/SCALE;s.exterior.bottomContour=[[0,805,885],[1100,805,885],[1300,805+delta*.15,885+delta*.15],[1500,805+delta*.5,885+delta*.5],[j,805+delta,885+delta],[WIDTH,805+delta,885+delta]];}
  if(i===1)s.exterior.topContour=[[0,0],[1250,0],[1320,12],[1380,22],[1430,16],[1490,34],[1540,19],[1590,30],[1650,13],[1710,26],[1774,16]];
  if(i===2)s.exterior.topContour=[[0,0],[1450,0],[1520,18],[1560,30],[1600,13],[1640,25],[1680,18],[1730,32],[1774,20]];
  delete s.supports;delete s.fullLine;
 }
 return list;
}
const sections=makeSections(),middle=sections[1],last=sections[2];
const points=(a,section)=>a.map(([x,y])=>({x:section.transform.x+x*section.transform.scale,y:section.transform.y+y*section.transform.scale}));
function sourceContact(sectionId,x,support){const section=sections.find(s=>s.id===sectionId),p=section.contacts.find(p=>p.terrainId===support);return{...points([[x,sourceY(x,p.sourceLine)]],section)[0],support};}
function contact(x){const section=sections.find(s=>x>=s.ownership.left-1e-7&&x<=s.ownership.right+1e-7);if(!section)throw Error('Outside Stage1 play route '+x);const p=section.contacts[0],q=section.transform,local=(x-q.x)/q.scale;return{x,y:q.y+sourceY(local,p.sourceLine)*q.scale,support:p.terrainId};}
const mid=(x,id)=>sourceContact('middle',x,id),air=(id,x,y)=>({...points([[x,y]],sections.find(s=>s.id===id))[0]});
export function applyStage1ImageFirst(project){
 const s=project.stages.find(s=>s.metadata?.stageId===1);if(!s)return project;const prior=new Map(s.terrains.map(t=>[t.id,t]));
 s.width=MAP_WIDTH;s.height=MAP_HEIGHT;s.playBounds={left:0,top:0,right:s.width,bottom:s.height};s.terrainBounds={...s.playBounds};s.terrainDomainVersion=1;s.camera={...s.camera};delete s.camera.focusBounds;
 const detail={spacing:18,roughness:0,optimizeEpsilon:0,seed:1},ids=new Set();
 s.terrains=sections.flatMap(section=>{const q=section.transform;if(!Number.isFinite(q.x)||!Number.isFinite(q.y)||!(q.scale>0)||section.exterior.collision!==false)throw Error('Invalid image section '+section.id);return section.contacts.map(p=>{
  const id=p.terrainId;if(ids.has(id))throw Error('Duplicate section terrain '+id);ids.add(id);
  const t={...prior.get(id),id,name:prior.get(id)?.name||id,playProjection:undefined,type:'solid',layer:'terrain',baseMaterial:p.baseMaterial,oneWay:p.oneWay,breakable:!!p.breakable,points:points(p.sourceBody,section),detail,properties:{...prior.get(id)?.properties,honroWalkEdges:p.sourceLine.slice(1).map((_,i)=>i)}};
  if(p.oneWay)Object.assign(t.properties,{hp:p.breakable?340:99999,maxHp:p.breakable?340:99999});return t;
 });});
 s.elements=[];
 const poses={'p-archer':contact(150),'foe-0':contact(950),'foe-1':air('middle',750,450),'foe-2':sourceContact('exit',1360,'exit-rock-shelf'),'foe-3':contact(3415),'npc-woodcutter':contact(5860)};
 for(const u of s.units){const p=poses[u.id];if(!p)continue;Object.assign(u,{x:p.x,y:p.y});if(Object.hasOwn(u,'spawnX'))u.spawnX=p.x;if(Object.hasOwn(u,'spawnY'))u.spawnY=p.y;}
 s.anchors={...s.anchors,start:contact(150),cart:contact(3360),shrine:mid(400,'fc-choice-1-low-pine-root'),lookout:mid(560,'pine-upper-bough'),ridge:contact(5810),woodcutter:contact(5860),exit:contact(5950)};
 const markerX=[150,3360,2500,3000,3430,5810,5860,5950];for(const[i,m]of s.markers.entries())Object.assign(m,contact(markerX[i]));
 const progress={cart:3240,more:740,witness:5680,ridge:5790};for(const e of s.events){if(e.when?.progress!==undefined)e.when.progress=progress[e.id];if(e.id==='cart'&&e.action?.type==='spawn'){const n=e.action.n,make=(x,count)=>({...e.action,n:count,...contact(x),spacing:165,maxDistance:210});e.action={type:'multi',actions:[make(3500,Math.ceil(n/2)),make(4180,Math.floor(n/2))].filter(a=>a.n)};}}
 const water=s.materials.find(m=>m.id==='creek-water'),wetA=contact(middle.transform.x+1020*SCALE),wetB=contact(middle.transform.x+1160*SCALE);s.materials=water?[{...water,kind:'shallow-water',terrainId:wetA.support,support:wetA.support,x1:wetA.x,x2:wetB.x,reference:contact(middle.transform.x+1100*SCALE).y,depth:9,alpha:.15,surface:undefined,bottom:undefined,points:undefined}]:[];
 const walk=[150,600,1000,1500,1850,sections[0].ownership.right+70,2350,2585,2800,3170,3415,3750,middle.transform.x+1570*SCALE,middle.transform.x+1590*SCALE,4100,4500,5000,5500,last.transform.x+1580*SCALE,last.transform.x+1620*SCALE,5820,5950].map(contact);s.routes=walk;
 s.design.act1Scene={...s.design.act1Scene,scenery:[],rocks:[],replaced:[]};s.design.forestChoice={version:3,supportId:'fc-choice-1-low-pine-root',treeX:middle.transform.x+400*SCALE,from:contact(middle.transform.x+440*SCALE),to:mid(440,'fc-choice-1-low-pine-root'),required:false};
 s.design.stage1ImageFirst={revision:4,balancedForest:1,characterScaleSections:1,quietLayers:1,far:'quietFar',image:middle.image,source:middle.source,transform:middle.transform,fringe:middle.exterior,sections,artBounds:{left:0,top:0,right:s.width,bottom:s.height},scaleReference:{character:'seol_o',bodyHeightWorld:103.5,sourcePixelsPerH:103.5/SCALE},walkRibbon:sections.flatMap(s=>points(s.contacts[0].sourceLine,s)),runtimeRoster:{'foe-0-cluster':contact(1165),'foe-1-cluster':air('middle',820,455),'foe-2-cluster':contact(5720),'foe-3-cluster':contact(3560)},brokenBoughMask,
  routes:{walk,root:[contact(middle.transform.x+380*SCALE),{...mid(350,'fc-choice-1-low-pine-root'),jump:true},mid(370,'fc-choice-1-low-pine-root')],ascent:[contact(2585),{...mid(505,'pine-branch-east'),jump:true},mid(430,'pine-branch-east'),{...mid(475,'pine-crotch'),jump:true},mid(520,'pine-crotch'),{...mid(535,'pine-upper-bough'),jump:true},mid(560,'pine-upper-bough')],stone:[contact(middle.transform.x+1030*SCALE),{...mid(990,'forest-boulder-a'),jump:true},mid(945,'forest-boulder-a')],upper:[contact(middle.transform.x+1470*SCALE),{...mid(1510,'forest-boulder-b'),jump:true},mid(1440,'forest-boulder-b')],exitShelf:[contact(last.transform.x+1460*SCALE),{...sourceContact('exit',1410,'exit-rock-shelf'),jump:true},sourceContact('exit',1270,'exit-rock-shelf')]}};
 Object.assign(s.initialState,{width:s.width,height:s.height,routePoints:walk});return project;
}
