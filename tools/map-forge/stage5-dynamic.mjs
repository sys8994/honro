import {readFileSync} from 'node:fs';
import {ravineArt} from './stage5-ravine-art.mjs';
import {authorStage5Encounters} from './stage5-encounters.mjs';
const proposal=JSON.parse(readFileSync(new URL('./stage5-dynamic-geometry.json',import.meta.url),'utf8'));
const artwork=JSON.parse(readFileSync(new URL('./stage5-dynamic-art.json',import.meta.url),'utf8')).vectors;
const clone=x=>JSON.parse(JSON.stringify(x)),DY=1000;
// The shared scenery policy omits Path2D contour strokes. Convert the approved
// pine's broad straight material strokes to filled ribbons at authoring time,
// using the same segment shape as the shared legacy material brush.
function materialRibbons(vector){
 const v=clone(vector),walk=node=>{if(node.tag==='g'){node.children=node.children.flatMap(walk);return[node];}if(node.fill!=='none'||!(node.lineWidth>=6)||!/^[ML0-9.,\s-]+$/i.test(node.d))return[node];
 const ps=node.d.match(/-?\d+(?:\.\d+)?/g).map(Number),points=[];for(let i=0;i<ps.length;i+=2)points.push([ps[i],ps[i+1]]);let d='';
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(!len)continue;const nx=-dy*node.lineWidth/2/len,ny=dx*node.lineWidth/2/len;d+=`M${a[0]+nx},${a[1]+ny}L${a[0]-nx},${a[1]-ny}L${b[0]-nx},${b[1]-ny}L${b[0]+nx},${b[1]+ny}Z`;}
 return[{tag:'path',d,fill:node.stroke,stroke:'none',...(node.transform?{transform:node.transform}:{})}];};v.root=walk(v.root)[0];return v;
}
export function authorStage5Dynamic(s,p,g){
 const base=clone(s.terrains.find(t=>t.id==='valley-floor')),veil=clone(s.terrains.find(t=>t.id==='waterfall-veil')),cleat=clone(s.terrains.find(t=>t.id==='cliff-cleat'));
 const pts=xy=>xy.map(([x,y])=>({x,y:y+DY}));
 const solid=(id,xy,options={})=>({...clone(base),id,name:id,type:'solid',points:pts(xy),oneWay:!!options.oneWay,baseMaterial:options.wood?'wood':'rock',breakable:false,playProjection:undefined,properties:{route:true,surfaceKind:options.wood?'bridgeDeck':'rock',...(options.ceiling?{honroCeiling:true}:{}),...options.properties},detail:{spacing:18,roughness:0,seed:5,optimizeEpsilon:0}});
 const floor=clone(proposal.terrain_polygons['lower-bank']),upper=proposal.terrain_polygons['upper-shoulder'];
 // This is buried rock, not an exposed platform underside. Reach the stable
 // simulation bottom so the common domain author continues the same mass.
 floor.at(-2)[1]=3300;floor.at(-1)[1]=3300;
 const top=(a,x)=>{for(let i=1;i<a.length;i++){const q=a[i-1],z=a[i];if(z[0]>q[0]&&x>=q[0]&&x<=z[0])return q[1]+(z[1]-q[1])*(x-q[0])/(z[0]-q[0])+DY;}throw Error('Missing dynamic support '+x);};
 const land=x=>top(floor,x),ridge=x=>top(upper,x),at=(x,y,support)=>({x,y,support});
 s.width=6400;s.height=4300;s.environment.zones.at(-1).to=4300;
 for(const key of ['playBounds','terrainBounds','terrainDomainVersion'])delete s[key];
 s.terrains=[solid('valley-floor',floor),solid('stage5-west-shoulder',upper),solid('stage5-ritual-cave',proposal.terrain_polygons['ritual-cave'],{ceiling:true}),solid('waterfall-cliff',proposal.terrain_polygons['east-cliff'].map(([x,y])=>[Math.min(6400,x),y])),solid('stage5-cave-brow',proposal.terrain_polygons['shot-brow']),
  solid('stage5-timber-low',[[2170,880],[2450,874],[2435,905],[2178,911]],{oneWay:true,wood:true}),
  solid('stage5-timber-mid',[[2540,712],[2690,681],[2810,687],[2820,705],[2660,722],[2545,740]],{oneWay:true,wood:true}),
  solid('stage5-timber-high',[[2950,500],[3310,494],[3295,525],[2958,531]],{oneWay:true,wood:true}),
  solid('stage5-fallen-log',[[1130,1630],[1190,1595],[1850,1490],[1880,1525],[1200,1640],[1170,1670]],{oneWay:true,wood:true}),veil,cleat];
 veil.points=g.HONRO_CORE.waterfallBodyShape(g.HonroStage5WaterGeometry.dynamic.closed);veil.properties.honroWaterFluidVertices=clone(g.HonroStage5WaterGeometry.dynamic.closed);
 cleat.points=pts([[5408,182],[5492,182],[5492,330],[5408,330]]);cleat.name='주박목';
 Object.assign(s.initialState,{honroStage5DynamicRevision:1,honroStage5FoundationRevision:2,width:s.width,height:s.height});
 const receiver=at(3460,2670,'valley-floor'),shot=at(3150,1496.6666666666667,'stage5-timber-high');
 Object.assign(s.anchors,{start:at(200,2420,'valley-floor'),receiver,basin:at(2860,land(2860),'valley-floor'),shotGap:shot,upperShot:shot,upperEntry:at(620,ridge(620),'stage5-west-shoulder'),lowerApproach:at(1980,land(1980),'valley-floor'),ritualWest:at(3360,2670,'valley-floor'),ritualEast:at(3530,2670,'valley-floor'),cleat:at(5450,1330,'waterfall-cliff'),exit:at(3460,2670,'valley-floor'),roost:at(2940,1500,'stage5-timber-high'),waterfallFoot:at(4300,2900,'valley-floor')});
 for(const u of s.units.filter(u=>u.team==='player')){u.x=u.cls==='mage'||u.kind==='mage'?320:200;u.y=2420;Object.assign(u,{spawnX:u.x,spawnY:u.y});}
 const markerAnchors={'marker-0':'start','marker-1':'receiver','receiver-5':'receiver','marker-3':'shotGap','marker-5':'cleat','habitat-5-0':'basin','habitat-5-1':'roost'};
 for(const m of s.markers){if(markerAnchors[m.id])Object.assign(m,s.anchors[markerAnchors[m.id]]);else if(m.type==='rest'){const x=m.id==='marker-2'?1830:3000;Object.assign(m,{x,y:m.id==='marker-2'?land(x):1499.1666666666667});}if(m.type==='hauntHabitat')m.support=m.kind==='crow'?'stage5-timber-high':'valley-floor';}
 const wave=s.events.find(e=>e.id==='lower-beasts');if(wave){Object.assign(wave.action,{x:1000,y:land(1000),support:'valley-floor',pursuitSupports:['valley-floor'],entryOptions:[{x:1000,y:land(1000)},{x:650,y:land(650)}]});wave.entry={x:1000,y:land(1000)};}
 const warning=s.events.find(e=>e.id==='lower-beasts-warning');if(warning)warning.when={progress:1800};if(wave)wave.when={progress:2100,after:'lower-beasts-warning',round:999999};
 s.materials=[{id:'stage5-plunge-pool',terrainId:'valley-floor',kind:'water-pool',x1:3900,x2:5350,surface:[[3900,2900],[5350,2900]],bottom:[[3900,2900],[4120,3200],[4700,3240],[5000,3050],[5350,2900]],points:[[3900,2900],[5350,2900],[5000,3050],[4700,3240],[4120,3200]],honroCarvedBasin:true,conductive:true},
  {id:'stage5-shallow-water',terrainId:'valley-floor',kind:'water-pool',x1:1245,x2:1830,surface:[[1245,2675],[1830,2675]],bottom:[[1245,2699],[1330,2750],[1540,2810],[1750,2770],[1830,2724]],points:[[1245,2675],[1830,2675],[1830,2724],[1750,2770],[1540,2810],[1330,2750],[1245,2699]],honroCarvedBasin:true,conductive:true},
  {id:'stage5-headwater',terrainId:'waterfall-cliff',kind:'water-pool',surface:[[4300,890],[12400,720]],bottom:[[4300,920],[4780,810],[5180,760],[12400,760]],points:[[4300,890],[12400,720],[12400,760],[5180,760],[4780,810],[4300,920]],honroCarvedBasin:true,conductive:true}];
 const path=xy=>'M'+xy.map(([x,y])=>`${x},${y+DY}`).join('L')+'Z',face=(xy,fill)=>({tag:'path',d:path(xy),fill});
 // Rear support is a visible rock face behind the lower walking shelf. It is
 // deliberately scenery; extending the upper collision would seal that route.
 const art=ravineArt(proposal.terrain_polygons,artwork);
 const assetIds=[];
 for(const [key,vector]of Object.entries(art)){const id='stage5-dynamic:'+key;assetIds.push(id);const a={id,name:'노송 폭포 · '+key,category:key==='old-pine'?'tree':key==='fallen-log'?'architecture':'rock',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],params:{},tags:['stage5','dynamic','vector'],vector:materialRibbons(vector),reference:{bounds:{x:vector.viewBox[0],y:vector.viewBox[1],w:vector.viewBox[2],h:vector.viewBox[3]},foot:{x:0,y:0},heightM:10,scaleRange:[.1,8],backgroundRange:[.7,1.3]}};const i=p.library.findIndex(a=>a.id===id);if(i<0)p.library.push(a);else p.library[i]=a;}
 s.elements=s.elements.filter(e=>e.id==='landmark-1');Object.assign(s.elements[0],{x:receiver.x,y:receiver.y});
 for(const key of Object.keys(art))s.elements.push({id:'stage5-art-'+key,assetId:'stage5-dynamic:'+key,x:0,y:0,scale:1,rotation:0,snap:false,layer:key==='western-backwall'?'structural-back':key==='cave-back'?'back':'prop',depthLayer:'L1',visualRole:'scenery'});
 for(const [id,x,scale,support]of [['entry-pine',850,.35,'stage5-west-shoulder'],['upper-pine',1500,.35,'stage5-west-shoulder'],['ridge-pine',2040,.32,'stage5-west-shoulder'],['cave-pine',3360,.3,'stage5-ritual-cave']]){
  const y=support==='stage5-ritual-cave'?top(proposal.terrain_polygons['ritual-cave'],x):ridge(x);s.elements.push({id:'stage5-'+id,assetId:'act1-scene:rooted-pine',x,y,scale,rotation:0,snap:false,layer:'back',depthLayer:'L1'});
 }
 // Three damp plant pockets separated by bare exposed rock keep the routes readable.
 for(const [key,assetId,x,scale,support]of [
  ['entry-root','env:rock',470,.7,'valley-floor'],['entry-fern','fern',560,2,'valley-floor'],
  ['reed-west','reed',1270,1.25,'valley-floor'],['reed-east','reed',1790,1.5,'valley-floor'],
  ['lower-fern','fern',2005,2,'valley-floor'],['bank-rock','env:rock',2240,.7,'valley-floor'],
  ['cave-fern','fern',3020,1.8,'valley-floor'],['cave-stone','rock_large',3610,.7,'valley-floor'],
  ['ridge-fern','fern',1170,1.6,'stage5-west-shoulder'],['ridge-rock','env:rock',1835,.7,'stage5-west-shoulder']
 ])s.elements.push({id:'stage5-pocket-'+key,assetId,x,y:support==='valley-floor'?land(x):ridge(x),scale,rotation:0,snap:false,layer:'back',depthLayer:'L1',visualRole:'scenery'});
 s.design={...s.design,title:'노송 잔교와 높은 폭포 절벽',question:'설오는 암반과 나무 발판을 올라 높은 사선을 열고, 담허는 낮은 물길을 지나 왼쪽으로 열린 동굴의 진을 지킨다.',dynamic:{revision:1,sourceGeometrySha256:'799c9eab8e5ec1944919c89eb287a2e4d996cbd07e5b94b4ab5cf7cbe0e9b6d0',yOffset:DY,assets:assetIds},geologyComposition:{version:2,instances:[]},positioning:{...s.design.positioning,cells:[],routes:{upper:[{...at(300,2420,'valley-floor'),jumpTo:{x:510,support:'stage5-west-shoulder',input:1}},at(620,ridge(620),'stage5-west-shoulder'),at(940,ridge(940),'stage5-west-shoulder'),at(1420,ridge(1420),'stage5-west-shoulder'),at(1970,ridge(1970),'stage5-west-shoulder'),{...at(2240,1878.5,'stage5-timber-low'),jumpTo:{x:2440,support:'stage5-cave-brow',input:1}},{...at(2540,1753,'stage5-cave-brow'),jumpTo:{x:2680,support:'stage5-timber-mid',input:.6}},{...at(2790,1688,'stage5-timber-mid'),jumpTo:{x:3000,support:'stage5-timber-high',input:1}},shot],lower:[700,1130,1540,1980,2500,2900,3200,3460].map(x=>at(x,land(x),'valley-floor')),ritual:[at(3360,2670,'valley-floor'),receiver,at(3530,2670,'valley-floor')]}},waterfall:{...s.design.waterfall,headwater:{x:5450,y:760},lip:{x:4300,y:920},pool:{x:4300,y:2900}}};
 for(const o of s.objectives)if(o.type==='campaign')o.label='물길진을 지키며 노송 잔교에서 높은 주박목 파괴';
 authorStage5Encounters(s,land,ridge);
 s.routes=[];
}
