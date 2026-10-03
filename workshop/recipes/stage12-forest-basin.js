/* Replayable authoring recipe. Run through HonroWorkshopAPI preview/apply/export. */
(function(G){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),points=a=>a.map(([x,y])=>({x,y}));
function commands(project){
 const out=[],Q=G.HonroGeometry,M=G.HonroMapEngine;
 const rock=(id,w,h)=>{
  const p=[[-.50,.05],[-.53,-.38],[-.34,-.76],[-.06,-.92],[.05,-1],[.29,-.85],[.48,-.53],[.55,-.15],[.48,.02],[.27,.01],[.04,.17],[-.26,.25]].map(([x,y])=>({x:x*w,y:y*h}));
  const face=[p[1],p[2],p[3],p[4],p[5],p[6],{x:w*.38,y:-h*.18},{x:w*.03,y:-h*.06},{x:-w*.26,y:-h*.13}];
  const left=Math.min(...p.map(q=>q.x)),right=Math.max(...p.map(q=>q.x)),top=Math.min(...p.map(q=>q.y)),bottom=Math.max(...p.map(q=>q.y));
  const x=t=>Math.round((left+(right-left)*t)*1000)/1000,y=t=>Math.round((top+(bottom-top)*t)*1000)/1000;
  return{id,name:'화강암 · '+id,category:'rock',visual:[
   {points:p,fill:'#303c37',stroke:'#182a2b',lineWidth:3},
   {points:face,fill:'#526158',stroke:'#384940',lineWidth:1},
   {points:[p[6],p[7],p[8],{x:w*.38,y:-h*.18}],fill:'#3d4a42'},
   {type:'polyline',closed:false,points:[{x:x(.32),y:y(.18)},{x:x(.41),y:y(.41)},{x:x(.38),y:y(.60)},{x:x(.47),y:y(.78)}],fill:null,stroke:'#182a2b99',lineWidth:1.7,alpha:1},
   {type:'polyline',closed:false,points:[{x:x(.67),y:y(.30)},{x:x(.60),y:y(.48)},{x:x(.66),y:y(.57)}],fill:null,stroke:'#a0a9975a',lineWidth:1.3,alpha:1}
  ],collision:[p],collisionMode:'independent',anchor:{x:0,y:0},sockets:[],material:'rock',breakable:false,oneWay:false,layer:'prop',tags:['stage12','granite'],params:{},reference:{heightM:2,bounds:{x:left,y:top,w:right-left,h:bottom-top},foot:{x:0,y:bottom},scaleRange:[.4,4.5],backgroundRange:[.7,1.3]}};
 };
 for(const [id,w,h] of [['mockup-granite-large',510,250],['mockup-granite-small',135,130],['mockup-granite-shelf',360,160]])
  out.push(project.library.some(a=>a.id===id)?{op:'asset.update',id,values:rock(id,w,h)}:{op:'asset.add',asset:rock(id,w,h)});
 for(const sid of [1,2]){
  const old=project.stages[sid-1],stageId=old.id,add=c=>out.push({stageId,...c});
  for(const key of ['terrains','elements'])for(const o of old[key])add({op:'delete',id:o.id});
  for(const o of old.materials.filter(m=>!old.terrains.some(t=>t.id===(m.terrainId||m.support))))add({op:'delete',id:o.id});
  const st=clone(old);st.terrains=[];st.elements=[];st.materials=[];st.height=sid===1?2200:3300;if(sid===1)st.width=5400;
  add({op:'world.set',width:st.width,height:st.height,backdrop:sid===1?'forest':'valley'});
  const ground=(id,control,material='rock')=>{
   if(control.some((p,i)=>i&&p[0]<control[i-1][0])){
    const dense=[];for(let i=0;i<control.length-1;i++){const a=control[i],b=control[i+1],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/22);for(let j=0;j<n;j++)dense.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);}dense.push(control.at(-1),[control.at(-1)[0],st.height+200],[control[0][0],st.height+200]);
    add({op:'createTerrain',id,type:'solid',points:dense,material,properties:{surfaceKind:'rock'}});
    st.terrains.push({id,type:'solid',points:points(dense),baseMaterial:material,properties:{surfaceKind:'rock'}});return;
   }
   const c={op:'createTerrain',id,type:'ground',control,floor:st.height+200,material,spacing:18,roughness:1.4,seed:sid*41+st.terrains.length,properties:{surfaceKind:material==='soil'?'soil':'rock'}};
   add(c);st.terrains.push({id,type:'ground',control:points(control),floor:c.floor,baseMaterial:material,detail:{spacing:18,roughness:c.roughness,seed:c.seed},properties:c.properties});
  };
  const branch=(id,path,width)=>{
   const t=M.branch(id,path,width,{hp:340}),c={op:'createTerrain',id,type:'solid',points:t.vertices,material:'wood',oneWay:true,breakable:true,properties:{surfaceKind:'branch',route:false,hp:340,maxHp:340}};
   add(c);st.terrains.push({id,type:'solid',points:t.vertices,baseMaterial:'wood',oneWay:true,breakable:true,properties:c.properties});
  };
  const top=(x,ref,support)=>M.surfaceY(st.terrains.map(t=>Q.terrain(t,st.height)),x,ref,support).y;
  const element=(id,assetId,x,y,scale=1,layer='back',rotation=0)=>add({op:'placeElement',id,assetId,x,y,scale,layer,rotation,snap:false});
  const paint=(id,terrainId,kind,x1,x2,depth,reference)=>{
   add({op:'paintMaterial',id,terrainId,kind,x1,x2,depth,reference});
   if(kind==='grass'&&depth>=70){const t=Q.terrain(st.terrains.find(t=>t.id===terrainId),st.height),n=Math.ceil((x2-x1)/18),surface=Array.from({length:n+1},(_,i)=>{const x=x1+(x2-x1)*i/n;return[x,G.HONRO_CORE.topAt(t,x,reference)];}),bottom=surface.map(([x,y],i)=>[x,y+depth*(.18+.82*Math.sin(Math.PI*i/(surface.length-1)))]).reverse();
    add({op:'object.update',id,values:{kind:'grass-mass',support:terrainId,attached:true,surface,points:[...surface,...bottom],colors:['#4d733ade','#2d4b30c7'],alpha:1}});
   }
  };
  const water=(id,support,x1,x2,level)=>{
   // Explicit banks meet the horizontal water plane; the bottom is sampled from the real terrain.
   const ts=st.terrains.map(t=>Q.terrain(t,st.height)),raw=M.sampleSupport(ts,support,x1,x2,18,level),spans=[];let span=[];
   for(let i=1;i<raw.length;i++){const a=raw[i-1],b=raw[i],aWet=a[1]>=level,bWet=b[1]>=level,cross=aWet!==bWet?[a[0]+(b[0]-a[0])*(level-a[1])/(b[1]-a[1]),level]:null;
    if(aWet&&!span.length)span.push(a);if(!aWet&&bWet)span.push(cross);if(bWet)span.push(b);else if(aWet){span.push(cross);spans.push(span);span=[];}}
   if(span.length)spans.push(span);const bottom=spans.sort((a,b)=>(b.at(-1)[0]-b[0][0])-(a.at(-1)[0]-a[0][0]))[0];
   if(!bottom?.length)throw Error('No submerged basin for '+id);x1=bottom[0][0];x2=bottom.at(-1)[0];
   add({op:'paintMaterial',id,terrainId:support,kind:'water',x1,x2,depth:0,reference:level});
   add({op:'object.update',id,values:{kind:'water-pool',support,attached:true,conductive:true,surface:[[x1,level],[x2,level]],bottom,points:[[x1,level],[x2,level],...bottom.slice().reverse()]}});
  };
  let anchors,positions,markerPositions;
  if(sid===1){
   ground('forest-floor',[[0,1620],[260,1520],[470,1580],[640,1550],[910,1430],[1140,1470],[1350,1510],[1580,1460],[1730,1480],[1960,1530],[2180,1590],[2260,1660],[2410,1720],[2570,1720],[2740,1650],[2910,1600],[3060,1510],[3190,1450],[3320,1280],[3510,1170],[3690,1010],[3930,990],[4050,890],[4200,860]],'soil');
   branch('pine-branch-west',[[1400,1230],[1510,1280],[1710,1320],[1890,1330],[2030,1350]], [20,42,52,46,30]);
   // A real final encounter basin and firing ridge. The original 0..4200
   // contour stays byte-for-byte reproducible; no global coordinate scaling.
   ground('ridge-east-extension',[[4200,860],[4390,915],[4590,1040],[4780,1000],[4960,800],[5180,690],[5400,740]],'soil');
   branch('pine-branch-east',[[2110,1180],[2240,1140],[2410,1150],[2590,1170],[2690,1140]], [40,54,54,38,18]);
   element('forest-boulder-a','mockup-granite-large',910,1580,1,'prop');
   element('forest-boulder-b','mockup-granite-small',1630,1510,.9,'prop');
   element('central-pine','builtin:giantPine',2070,1570,2.35,'back');
   element('distant-pine-west','builtin:ancientPine',560,1570,2,'back');
   element('distant-pine-east','builtin:ancientPine',3700,1130,1.8,'back');
   element('abandoned-cart','cart',1160,top(1160),1.1,'prop');
   element('old-pass-gate','builtin:oldGate',5210,top(5210),.8,'back');
   element('east-ridge-pine','builtin:ancientPine',5050,top(5050),1.3,'back');
   paint('east-ridge-grass','ridge-east-extension','grass',4910,5320,38);
   water('creek-water','forest-floor',2260,2740,1660);
   paint('green-ridge','forest-floor','grass',3060,3890,165);
   paint('rock-ridge','forest-floor','rock',2860,3150,55);
   anchors={start:{x:250},cart:{x:1160},shrine:{x:1950},lookout:{x:2530,y:top(2530,1000,'pine-branch-east'),support:'pine-branch-east'},ridge:{x:3550},woodcutter:{x:3210},exit:{x:5210}};
   positions={'p-archer':[250,top(250)],'foe-0':[1310,top(1310)],'foe-3':[1480,top(1480)],'foe-1':[2530,800],'foe-2':[4780,top(4780)],'npc-woodcutter':[3210,top(3210)]};
   markerPositions=[[250,0],[1160,0],[640,0],[1950,0],[1830,0],[3550,0],[3400,0],[5210,0]];
   for(const [i,a,b,kind] of [[0,50,420,'grass'],[1,490,670,'moss'],[2,980,1250,'grass'],[3,1410,1680,'moss'],[4,1740,2010,'grass'],[5,2180,2250,'mud'],[6,2730,2830,'mud'],[7,2850,2990,'scree'],[8,3920,4190,'grass']])paint('ground-patch-'+i,'forest-floor',kind,a,b,28);
  }else{
   // Three solid masses leave the central airspace clear and the entire bier road connected.
   ground('canyon-ground',[[0,2960],[280,2980],[480,3020],[680,2960],[900,2920],[1170,2960],[1430,2940],[1620,3000],[1810,2950],[2050,2940],[2240,3005],[2490,3005],[2730,2960],[2940,2940],[3070,2900],[3200,2840],[3450,2820],[3660,2740],[3870,2610],[4100,2630],[4300,2490]],'soil');
   ground('left-high-ground',[[0,540],[280,590],[510,610],[590,670],[640,870],[740,960],[860,1080],[940,1220],[1030,1370],[1160,1490],[1120,1630],[1040,1680],[1100,1850],[1270,1910],[1420,2140],[1500,2240],[1260,2310],[1060,2440],[940,2520],[900,2590],[970,2730],[870,2860],[790,2940]],'rock');
   ground('right-cliff-ground',[[3440,2810],[3380,2610],[3470,2470],[3450,2260],[3550,2120],[3510,1960],[3690,1830],[3710,1640],[3830,1510],[3970,1500],[4100,1570],[4210,1550],[4270,1500],[4275,1380],[4170,1240],[4050,1230],[3930,1090],[3850,900],[3890,720],[4020,600],[4140,500],[4300,430]],'rock');
   add({op:'createTerrain',id:'left-grass-outcrop',type:'solid',points:[[720,1500],[900,1560],[1130,1550],[1190,1610],[1110,1780],[850,1800],[720,1740],[690,1620]],material:'rock'});
   st.terrains.push({id:'left-grass-outcrop',type:'solid',points:points([[720,1500],[900,1560],[1130,1550],[1190,1610],[1110,1780],[850,1800],[720,1740],[690,1620]]),baseMaterial:'rock'});
   branch('left-tree-branch-upper',[[1100,750],[1240,780],[1430,785],[1570,800],[1690,795]],[24,34,32,24,12]);
   branch('left-tree-branch-middle',[[960,1000],[1080,1070],[1260,1100],[1390,1140],[1500,1140]],[30,48,54,44,18]);
   branch('left-tree-branch-lower',[[1370,1790],[1460,1850],[1600,1860],[1700,1890]],[24,42,34,16]);
   branch('right-tree-branch-lower',[[2980,1510],[3140,1500],[3260,1470],[3350,1410]],[18,34,42,28]);
   branch('right-tree-branch-upper',[[3310,1240],[3400,1200],[3470,1080],[3490,1000]],[24,42,36,15]);
   element('left-pine-upper','builtin:ravinePine',860,1200,1.08,'back',23);
   element('left-pine-lower','builtin:ravinePine',1370,2150,.74,'back',22);
   element('right-pine','builtin:ravinePine',3550,1790,.9,'back',-44);
   for(const [id,asset,x,y,s] of [
    ['left-cliff-crown','mockup-granite-large',570,985,.85],['left-cliff-stone-a','mockup-granite-small',955,1320,1.1],['left-cliff-stone-b','mockup-granite-small',1020,1430,1],
    ['left-cliff-step','mockup-granite-shelf',1150,2070,1],['left-cliff-tooth','mockup-granite-shelf',1450,2210,1],
    ['basin-boulder-left','mockup-granite-large',970,3000,.65],['basin-boulder-mid','mockup-granite-large',1600,3220,.63],
    ['right-cliff-base','mockup-granite-large',3570,2570,.95],['right-cliff-ledge','mockup-granite-shelf',3640,2200,1],
    ['right-cliff-roof','mockup-granite-shelf',4050,1210,.95],['right-cliff-top','mockup-granite-small',4020,680,1]])element(id,asset,x,y,s,'prop');
   water('basin-water-west','canyon-ground',300,680,2980);
   water('basin-water','canyon-ground',2180,2800,2970);
   water('shelf-water','right-cliff-ground',3980,4270,1530);
   paint('green-left-outcrop','left-grass-outcrop','grass',720,1170,150,1500);
   paint('green-right-crown','right-cliff-ground','grass',3930,4290,80,650);
   anchors={archerPerch:{x:290,support:'left-high-ground'},procession:{x:1240,support:'canyon-ground'},leftBasin:{x:1700,support:'canyon-ground'},rightBasin:{x:2860,support:'canyon-ground'},rightShelf:{x:3380,y:1170},exit:{x:3340,support:'canyon-ground'}};
   positions={'p-archer':[290,top(290,600,'left-high-ground')],'objective':[1240,top(1240,2960,'canyon-ground')],'ally-bokman':[1130,top(1130,2960,'canyon-ground')],'ally-baeksan':[1460,top(1460,2960,'canyon-ground')],'npc-damheo':[1540,top(1540,2960,'canyon-ground')],'npc-yeonsil':[1350,top(1350,2960,'canyon-ground')],'foe-0':[1850,top(1850,2960,'canyon-ground')],'foe-3':[2010,top(2010,2960,'canyon-ground')],'foe-2':[2940,top(2940,2960,'canyon-ground')],'foe-5':[3200,top(3200,2860,'canyon-ground')],'foe-1':[3370,1010],'foe-4':[3190,1150]};
   markerPositions=[[290,600],[1700,2960],[1760,2960],[2860,2960],[2900,2960],[4020,600],[3900,800]];
   for(const [i,support,a,b,ref,kind] of [[0,'left-high-ground',40,510,600,'grass'],[1,'left-high-ground',720,870,1050,'moss'],[2,'left-high-ground',1130,1340,2050,'scree'],[3,'left-high-ground',1010,1210,2400,'moss'],[4,'canyon-ground',60,230,2960,'scree'],[5,'canyon-ground',780,1110,2950,'mud'],[6,'canyon-ground',1260,1450,2950,'grass'],[7,'canyon-ground',1780,2010,2960,'moss'],[8,'canyon-ground',2820,3100,2900,'grass'],[9,'right-cliff-ground',3580,3690,2080,'rock'],[10,'right-cliff-ground',3730,3900,1570,'moss']])paint('canyon-patch-'+i,support,kind,a,b,28,ref);
   for(const event of old.events){const e=clone(event);if(e.id==='procession-seen')e.when.progress=1200;if(e.id==='road-pressure'){e.when.any[0].progress=1520;e.action.x=1850;}if(e.id==='last-flight')e.when.any[0].progress=3140;add({op:'object.update',id:e.id,values:e});delete out.at(-1).values.id;}
  }
  for(const a of Object.values(anchors))if(a.y===undefined)a.y=top(a.x,undefined,a.support); // stable authored camera/objective positions
  for(const [id,[x,y]] of Object.entries(positions))add({op:'unit.update',id,values:{x,y,spawnX:x,spawnY:y}});
  old.markers.forEach((m,i)=>{const [x,ref]=markerPositions[i];add({op:'move',id:m.id,x,y:top(x,ref||undefined)});});
  // Sparse vegetation on exposed contours; every instance is deliberately authored, with stable IDs.
  let count=0;
  for(const t of st.terrains.filter(t=>t.type==='ground')){
   const vertices=Q.derive(t);
   for(let i=2;i<vertices.length-2;i+=12){const p=vertices[i],next=vertices[i+1];if(next.x-p.x<.1||Math.abs((next.y-p.y)/(next.x-p.x))>1.15)continue;
    const other=M.surfaceY(st.terrains.map(q=>Q.terrain(q,st.height)),p.x,p.y);
    if(!other||Math.abs(other.y-p.y)>3)continue;
    element('flora-'+count,(count%4===0?'builtin:fernPatch':'grass_tuft'),p.x,p.y,count%4===0?.42:.9,'prop');count++;
   }
  }
  const initialState={...clone(old.initialState),width:st.width,height:st.height,honroMapDesignRevision:1};
  if(sid===2)initialState.honroEscortGoalX=3340;
  add({op:'stage.update',values:{
   metadata:{...old.metadata,source:'Workshop mockup redesign 2026-09-25',designRevision:1},anchors,
   routes:sid===2?[{id:'bier-road',kind:'escort',points:points([[1200,2960],[1800,2960],[2400,3005],[2940,2940],[3340,2830]])}]:[],
   design:{title:sid===1?'큰 소나무 아래 얕은 물길':'양쪽 절벽 사이 상여의 길',question:sid===1?'바위와 얕은 물길을 따라 이동하거나 파괴 가능한 큰 가지를 사격점으로 사용한다.':'왼쪽 고지에서 설오가 엄호하고 상여는 분지 바닥을 따라 오른쪽 출구로 이동한다.',gameplay:['mockup-redesign','open-air','background-trees','breakable-branches','conductive-water']},
   detailStats:{groundTop:st.terrains.filter(t=>t.type==='ground').reduce((n,t)=>n+Q.derive(t).length,0),branchNodes:st.terrains.filter(t=>t.properties?.surfaceKind==='branch').reduce((n,t)=>n+t.points.length,0),solidNodes:st.terrains.filter(t=>t.type==='solid').reduce((n,t)=>n+t.points.length,0),scatterCount:count},initialState
  }});
 }
 out.push({stageId:'stage-10',op:'object.update',id:'landmark-3',values:{layer:'prop'}});
 return out;
}
G.HonroStage12Design={commands};
})(globalThis);
