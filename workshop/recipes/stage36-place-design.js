/* Replayable Stage 3–6 place design: landforms support routes and landmarks. */
(function(G){'use strict';
const copy=x=>JSON.parse(JSON.stringify(x)),pt=a=>a.map(([x,y])=>({x,y}));
const asset={id:'builtin:placeDetail',name:'산지 구조·흔적',category:'native',renderer:'landmark',kind:'placeDetail',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:['HONRO','place-design'],params:{},bounds:{x:-700,y:-1600,w:1400,h:1700}};
function height(points,x){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(a.x<=x&&x<=b.x&&a.x!==b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}return points.at(-1).y;}
function smooth(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
function relief(sid,old){
 const source=old.terrains[0],upper=source.points.slice(0,old.detailStats.groundTop),width=old.width,step=sid===3?36:sid===4?32:34;
 const pads={
  3:[{a:5300,b:5810,fade:190,y:1612},{a:3785,b:3935,fade:80,y:2181}],
  4:[{a:840,b:1190,fade:95,y:2270}],
  5:[{a:1350,b:1550,fade:80,y:2851}],
  6:[{a:3950,b:4200,fade:90,y:2940}]
 }[sid];
 const spurs={
  3:[[820,145,-20],[1630,125,13],[3320,160,17],[4500,180,-20],[4970,130,12]],
  4:[[1550,135,-14],[1850,130,14],[3070,160,-16],[3350,110,10]],
  5:[[880,130,-19],[1690,170,16],[2220,170,-13],[3720,130,17]],
  6:[[1120,135,-18],[2310,170,14],[4820,170,-16],[5760,160,13]]
 }[sid];
 const amplitude=sid===3?4:sid===4?4.5:sid===5?6:5;
 const yAt=x=>{
  let y=height(upper,x);
  for(const [cx,r,h] of spurs){const z=(x-cx)/r;y+=h*Math.exp(-z*z*2.1);}
  for(const p of pads){const left=smooth((x-(p.a-p.fade))/p.fade),right=smooth(((p.b+p.fade)-x)/p.fade),blend=left*right;y=y*(1-blend)+p.y*blend;}
  const preserve=pads.some(p=>x>=p.a-p.fade&&x<=p.b+p.fade);
  if(!preserve){const band=sid===5&&x>2480&&x<3510?.30:1;y+=amplitude*band*(Math.sin(x*.049+sid)*.65+Math.sin(x*.117+sid*2.7)*.25);}
  return Math.round(y*1000)/1000;
 };
 const positions=new Set([0,width]);for(let x=step;x<width;x+=step)positions.add(x);
 for(const p of pads)for(const x of[p.a-p.fade,p.a,p.b,p.b+p.fade])positions.add(x);
 for(const e of old.elements)if(e.y!==undefined)positions.add(e.x);
 for(const u of old.units)positions.add(u.x);
 for(const m of old.markers)if(m.x!==undefined)positions.add(m.x);
 for(const a of Object.values(old.anchors||{}))if(a.x!==undefined)positions.add(a.x);
 const top=[...positions].filter(x=>x>=0&&x<=width).sort((a,b)=>a-b).map(x=>({x,y:yAt(x)}));
 const tail=source.points.slice(old.detailStats.groundTop);
 return{oldTop:upper,top,points:[...top,...copy(tail)],at:x=>height(top,x)};
}
function commands(project){
 const out=[];if(!project.library.some(a=>a.id===asset.id))out.push({op:'asset.add',asset});
 const place=(stageId,id,assetId,x,y,scale=1,layer='back',extra={})=>{
  out.push({stageId,op:'placeElement',id,assetId,x,y,scale,layer,snap:false});
  if(Object.keys(extra).length)out.push({stageId,op:'object.update',id,values:extra});
 };
 for(const sid of[3,4,5,6]){
  const st=project.stages[sid-1];if(st.metadata?.placeRevision===1)continue;
  const stageId=st.id,add=c=>out.push({stageId,...c}),main=st.terrains[0],design=relief(sid,st),before=x=>height(design.oldTop,x),at=design.at;
  add({op:'object.update',id:main.id,values:{points:design.points}});
  // Existing actors, markers, landmarks and camera anchors keep their terrain relationship.
  for(const collection of['units','markers','elements'])for(const e of st[collection]){
   if(!Number.isFinite(e.x)||!Number.isFinite(e.y)||Math.abs(e.y-before(e.x))>24)continue;
   const values={y:at(e.x)};
   if(collection==='units'&&e.spawnY!==undefined)values.spawnY=values.y;
   add({op:'object.update',id:e.id,values});
  }
  const anchors=copy(st.anchors);for(const a of Object.values(anchors))if(a.support===main.id&&Number.isFinite(a.x))a.y=at(a.x);
  const details={...st.detailStats,groundTop:design.top.length};
  add({op:'stage.update',values:{metadata:{...st.metadata,source:'Workshop place redesign 2026-09-30',placeRevision:1,...(sid===3||sid===4?{waterForestRevision:1}:{})},anchors,detailStats:details}});
  // Authored material ribbons in 3/4 are attached to the terrain, not to old screen coordinates.
  if(sid===3||sid===4)for(const m of st.materials){if((m.terrainId||m.support)!==main.id||!m.surface)continue;
   if(m.kind==='water-pool'){
    const bottom=m.bottom.map(([x])=>[x,at(x)]),surface=copy(m.surface);
    add({op:'object.update',id:m.id,values:{bottom,points:[...surface,...bottom.slice().reverse()]}});
   }else{
    const surface=m.surface.map(([x])=>[x,at(x)]),bottom=(m.bottom||m.points.slice(m.surface.length).reverse()).map(([x,y])=>[x,y+at(x)-before(x)]);
    add({op:'object.update',id:m.id,values:{surface,bottom,points:[...surface,...bottom.slice().reverse()]}});
   }
  }
  const paint=(id,kind,x1,x2,depth=40,alpha=.8,extra={})=>{add({op:'paintMaterial',id,terrainId:main.id,kind,x1,x2,depth,alpha});if(Object.keys(extra).length)add({op:'object.update',id,values:extra});};
  const detail=(id,x,y,feature,extra={},layer='structural-back')=>place(stageId,id,'builtin:placeDetail',x,y,1,layer,{feature,...extra});
  if(sid===3){
   // The ferry crossing grades into marsh, while the warehouse has a true loading terrace.
   add({op:'object.update',id:'ferry-water',values:{conductive:true,flowDirection:1}});
   detail('place3-loading-wall',5540,at(5540),'terrace',{width:580,height:90},'prop');
   detail('place3-shrine-footing',3860,at(3860),'terrace',{width:180,height:52},'prop');
   detail('place3-cargo-trestle',4790,at(4790),'trestle',{width:270,height:220});
   for(const [id,x,deck] of[['place3-west-dock-posts',1550,2028],['place3-mid-dock-posts',2250,2090],['place3-east-dock-posts',2900,2128]])
    detail(id,x,at(x),'trestle',{width:155,height:at(x)-deck});
   // A lower, weathered gangway gives the ferry basin a real second level.
   // Its loss exposes the shallow water, while the permanent dock and bank remain traversable.
   add({op:'createTerrain',id:'ferry-side-gangway',type:'solid',points:[[2070,2298],[2130,2295],[2200,2293],[2270,2294],[2340,2297],[2420,2302],[2420,2332],[2340,2327],[2270,2324],[2200,2323],[2130,2325],[2070,2328]],material:'wood',oneWay:true,breakable:true,properties:{surfaceKind:'plank',route:false,hp:260,maxHp:260}});
   detail('place3-side-gangway-rig',2250,at(2250),'ferryWalk',{width:380,height:at(2250)-2296});
   for(const [id,assetId,x,scale] of[
    ['place3-reed-west','builtin:reedBank',2030,.68],['place3-reed-east','builtin:reedBank',2890,.60],
    ['place3-stone-west','mockup-granite-small',1120,.75],['place3-stone-mud','mockup-granite-large',3290,.65],
    ['place3-pine-ridge','builtin:ravinePine',4450,.9],['place3-scree-ridge','builtin:scree',4290,.8],
    ['place3-pine-behind-hall','builtin:ancientPine',5960,.68]])
    place(stageId,id,assetId,x,at(x),scale,assetId.includes('granite')?'prop':'back');
   paint('place3-bank-moss','moss',720,1190,36,.65);
   paint('place3-ferry-gravel','scree',3000,3480,32,.62);
  }else if(sid===4){
   // The burned homes belong in the charred, level basin rather than on the steep eastern slope.
   add({op:'move',id:'landmark-5',x:2200,y:at(2200)});
   add({op:'object.update',id:'landmark-5',values:{layer:'structural-back'}});
   add({op:'move',id:'landmark-10',x:1830,y:at(1830)});
   detail('place4-gate-footing',1030,at(1030),'terrace',{width:390,height:70},'prop');
   detail('place4-watch-buttress',3750,at(3750),'buttress',{width:135,height:at(3750)-1755});
   // The burned houses leave a usable beam above the cart choke, with the ground road intact.
   add({op:'createTerrain',id:'burned-gallery',type:'solid',points:[[2035,2556],[2090,2552],[2150,2548],[2210,2546],[2270,2549],[2340,2554],[2340,2585],[2270,2579],[2210,2576],[2150,2578],[2090,2582],[2035,2587]],material:'wood',oneWay:true,breakable:true,properties:{surfaceKind:'charredPlank',route:false,hp:280,maxHp:280}});
   detail('place4-burned-gallery-rig',2200,at(2200),'charredGallery',{width:305,height:at(2200)-2547});
   for(const [id,assetId,x,scale] of[
    ['place4-charred-pines','builtin:deadPines',2860,.74],['place4-fallen-rock','builtin:scree',2590,.72],
    ['place4-gate-pine','builtin:ravinePine',610,.9],['place4-watch-scree','builtin:scree',3410,.7],
    ['place4-yard-stone','mockup-granite-small',2050,.55]])
    place(stageId,id,assetId,x,at(x),scale,assetId.includes('granite')?'prop':'back');
   paint('place4-ash-edge','charred',2590,2960,44,.66);
   paint('place4-west-moss','moss',420,780,28,.5);
  }else if(sid===5){
   // Roof runoff, a single continuous falling sheet, and a shallow receiving basin.
   for(const t of st.terrains.filter(t=>/^climb-\d+$/.test(t.id))){
   const x1=t.points[0].x,x2=t.points[1].x,y=t.points[0].y,w=x2-x1;
    const n=Number(t.id.match(/\d+$/)?.[0]||0),skew=(n%3-1)*9,lip=(n%2?1:-1)*7;
    add({op:'object.update',id:t.id,values:{points:pt([[x1-13+skew,y+13],[x1+w*.16,y+2],[x1+w*.43,y+lip*.15],[x2-w*.23,y],[x2+12+skew,y+8],[x2+27,y+43],[x2-w*.12+skew,y+77],[x1+w*.47,y+105+lip],[x1+w*.11,y+75],[x1-22,y+42]])}});
   }
   const fall=st.elements.find(e=>e.assetId==='builtin:waterfall');
   add({op:'move',id:fall.id,x:2960,y:at(2960),scale:1.4});
   add({op:'object.update',id:fall.id,values:{drop:at(2960)-2050,layer:'prop'}});
   detail('place5-source-run',2960,2050,'waterRun',{trace:[[0,0],[175,-152],[360,-176],[610,-180]],width:52},'prop');
   detail('place5-cliff-mass',2240,at(2240),'rockFace',{vertices:[[-430,0],[-300,-500],[-90,-850],[210,-1230],[560,-1430],[870,-1340],[1000,-850],[820,-210],[540,0]]});
   detail('place5-scree-base',2460,at(2460),'rockFace',{vertices:[[-390,0],[-180,-130],[80,-170],[430,0]]},'back');
   for(const [id,assetId,x,scale] of[
    ['place5-left-pine','builtin:ravinePine',770,.95],['place5-slope-stone','mockup-granite-large',1730,.62],
    ['place5-basin-stone','mockup-granite-small',3510,.72],['place5-upper-pine','builtin:deadPines',3820,.54]])
    place(stageId,id,assetId,x,at(x),scale,assetId.includes('granite')?'prop':'back');
   paint('place5-upper-rock','rock',520,1180,45,.7);
   paint('place5-climb-scree','scree',1500,2300,70,.77);
   paint('place5-basin-rock','rock',2290,2700,28,.59);
   paint('place5-wet-bank','moss',3510,3880,45,.64);
   const level=3300,lo=waterEdge(design.top,level,2200,3100),hi=waterEdge(design.top,level,3300,3900);
   paint('place5-falls-pool','water',lo,hi,0,.84,{surfaceY:level,conductive:true,step:18});
  }else{
   // The broken bridge crosses a stream-cut ravine. Abutments, hanging ropes and rubble tie its decks to the rock.
   for(const [id,x,topY,width] of[
    ['place6-west-buttress',2010,1870,142],['place6-mid-buttress',3150,1810,115],['place6-east-buttress',4530,1940,142]])
    detail(id,x,at(x),'buttress',{width,height:at(x)-topY});
   detail('place6-bridge-rigging',2010,1870,'bridgeRigging',{trace:[[0,-122],[340,-148],[1140,-116],[2190,-40],[2540,30]]},'structural-back');
   for(const [id,assetId,x,scale] of[
    ['place6-west-rock','mockup-granite-large',930,.75],['place6-west-scree','builtin:scree',1680,.83],
    ['place6-mid-debris','builtin:fallenTree',2720,.85],['place6-east-rock','mockup-granite-large',4720,.70],
    ['place6-east-pine','builtin:ravinePine',5780,.8],['place6-east-scree','builtin:scree',4920,.7]])
    place(stageId,id,assetId,x,at(x),scale,assetId.includes('granite')?'prop':'back');
   paint('place6-west-road','scree',720,1540,45,.72);
   paint('place6-west-talus','rock',1560,2350,52,.67);
   paint('place6-stream-bed','mud',2380,4130,38,.64);
   paint('place6-east-talus','scree',4400,5340,53,.72);
   paint('place6-east-moss','moss',5350,6200,35,.61);
   const level=2980,lo=waterEdge(design.top,level,2400,3000),hi=waterEdge(design.top,level,3500,4200);
   paint('place6-ravine-water','water',lo,hi,0,.77,{surfaceY:level,conductive:true,step:18});
  }
 }
 return out;
}
function waterEdge(points,level,from,to){let best=from,delta=Infinity;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(a.x>to||b.x<from||(a.y-level)*(b.y-level)>0||a.y===b.y)continue;const x=a.x+(level-a.y)*(b.x-a.x)/(b.y-a.y);if(x<from||x>to)continue;const d=Math.abs(x-(from+to)/2);if(d<delta){best=x;delta=d;}}return Math.round(best*1000)/1000;}
G.HonroStage36Places={commands};
})(globalThis);
