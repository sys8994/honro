(function(G){'use strict';
// ACT1 outdoor art uses the same Canvas scene and live canonical terrain as
// gameplay. The authored support references are visual-only; old saves keep
// their own landscape, and ACT2 never enters this renderer.
const S=G.HonroScene.prototype,C=G.HONRO_CORE,A=G.HonroEnvironmentArt,terrainCache=new WeakMap(),sceneCache=new WeakMap();
const active=b=>b?.honroStage>=1&&b.honroStage<=10&&b.honroMap?.act1Scene?.version===1;
const guardianBranch=(b,t)=>b.honroStage===10&&b.honroMap?.act1Scene?.guardianTree?.branches?.includes(t.id);
function poly(points){const p=new Path2D();points.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p;}
function line(points){const p=new Path2D();points.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));return p;}
function liveTop(b,id,x,fallback){const t=b.terrain.find(t=>t.id===id&&!t.broken);return t?C.topAt(t,x,fallback):fallback;}
function pointIn(x,y,ps){let inside=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){const a=ps[i],z=ps[j];if((a.y>y)!==(z.y>y)&&x<(z.x-a.x)*(y-a.y)/(z.y-a.y)+a.x)inside=!inside;}return inside;}
function prepareTerrain(t,b){let q=terrainCache.get(t);if(q?.version===b.sceneVersion&&q.source===t.vertices)return q;const ps=C.poly(t),shape=poly(ps.map(p=>[p.x,p.y])),rim=new Path2D(),caps=[],planes=[],joints=[],edges=[],cliffPlanes=[];
 const peers=G.HonroTerrainDomain.render(b).filter(o=>o.id!==t.id&&!o.broken&&!o.oneWay&&!o.honroElementCollision),exposed=(x,y)=>!peers.some(o=>x>o.x&&x<o.x+o.w&&y>o.y&&y<o.y+o.h&&pointIn(x,y,C.poly(o)));
 for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];if(z.x<=a.x||Math.abs((z.y-a.y)/(z.x-a.x))>1.36||!exposed((a.x+z.x)/2,(a.y+z.y)/2-3))continue;edges.push([a,z]);rim.moveTo(a.x,a.y);rim.lineTo(z.x,z.y);}
 const at=x=>{const e=edges.find(([a,z])=>x>=a.x&&x<=z.x);return e?e[0].y+(e[1].y-e[0].y)*(x-e[0].x)/(e[1].x-e[0].x):C.topAt(t,x,t.y);};
 // Material strata and large cut faces stay clipped inside each actual solid.
 // Unequal authored sites, rather than a fixed polygon tiling, divide masses.
 const features=(b.honroMap.act1Scene.rocks||[]).filter(r=>r.supportId===t.id);
 const anchors=features.length?features.map(r=>({x:r.x,w:Math.min(r.width,t.w*.65),depth:Math.min(r.height*.64,t.h*.75)})):[{x:t.x+t.w*.30,w:t.w*.56,depth:Math.min(760,t.h*.76)},{x:t.x+t.w*.77,w:t.w*.39,depth:Math.min(580,t.h*.6)}];
 for(const [i,r]of anchors.entries()){const l=Math.max(t.x,r.x-r.w*.52),rr=Math.min(t.x+t.w,r.x+r.w*.48),m=l+(rr-l)*(.57-i%2*.16),y=at(l),ry=at(rr),my=at(m),d=r.depth;
  if(rr-l<45||d<18)continue;planes.push({lit:poly([[l,y],[m,my],[m-(rr-l)*.08,my+d*.24],[m-(rr-l)*.11,my+d*.59],[l+(rr-l)*.27,y+d*.72],[l+(rr-l)*.08,y+d*.43]]),shadow:poly([[m,my],[rr,ry],[rr-(rr-l)*.08,ry+d*.21],[rr-(rr-l)*.13,ry+d*.51],[m+(rr-l)*.12,my+d*.74],[m-(rr-l)*.05,my+d]]),contact:line([[m,my+9],[m-(rr-l)*.1,my+d*.58],[m-(rr-l)*.05,my+d]])});
 }
 // A subdued weathered soil/stone cap describes the route itself. It follows
 // every compiled edge, including tiny original roughness and slope breaks.
 for(const [a,z]of edges)caps.push(poly([[a.x,a.y],[z.x,z.y],[z.x,z.y+24],[a.x,a.y+24]]));
 // The canyon is a real tall collision mass. Four unequal fracture planes
 // span its entire face instead of ending in a shallow band at the crest.
 if(t.surfaceKind==='cliff'||b.honroStage===2&&/^(left-high-ground|right-cliff-ground)$/.test(t.id)){
  const mirror=t.id==='right-cliff-ground',map=ps=>poly(ps.map(([u,v])=>[t.x+(mirror?1-u:u)*t.w,t.y+v*t.h]));
  for(const ps of [ [[.05,.01],[.45,.02],[.35,.24],[.23,.37],[.26,.67],[.07,.91]], [[.45,.02],[.70,.11],[.65,.35],[.42,.52],[.31,.82],[.22,.94],[.26,.67],[.23,.37],[.35,.24]], [[.71,.11],[.94,.23],[.90,.54],[.75,.63],[.68,.94],[.36,.98],[.47,.68],[.66,.43]], [[.06,.45],[.22,.39],[.26,.67],[.16,.92],[.03,.99]] ])cliffPlanes.push(map(ps));
 }
 const wood=t.mat==='wood';if(wood){const n=Math.max(1,Math.min(12,Math.floor(t.w/90)));for(let i=1;i<n;i++){const x=t.x+t.w*i/n,y=at(x);joints.push(line([[x,y+6],[x-4,Math.min(t.y+t.h,y+80)]]));}}
 let branchBody=null,branchGrain=null;
 if(guardianBranch(b,t)&&edges.length){
  // The entire living-bough silhouette is the canonical collision polygon.
  // Follow its irregular top, thick trunk junction and tapered outward tip.
  branchBody=shape;branchGrain=new Path2D();const first=edges[0][0];branchGrain.moveTo(first.x+8,first.y+9);
  for(const [a,z]of edges)branchGrain.quadraticCurveTo((a.x+z.x)/2,(a.y+z.y)/2+24,z.x-3,z.y+12);
 }

 q={source:t.vertices,version:b.sceneVersion,shape,rim,caps,planes,joints,edges,cliffPlanes,wood,branchBody,branchGrain};terrainCache.set(t,q);return q;
}
function groundGradient(c,t,b){const earth=t.mat==='earth'||t.surfaceKind==='soil',tall=t.h>500,top=tall?Math.min(...b.terrain.filter(q=>!q.oneWay&&!q.broken&&q.mat===t.mat).map(q=>q.y)):t.y,bottom=tall?b.height+30:t.y+t.h;
 const g=c.createLinearGradient(0,top,0,Math.max(top+60,bottom));g.addColorStop(0,earth?'#5a655e':'#62707a');g.addColorStop(.3,earth?'#3b4b47':'#43545e');g.addColorStop(.68,earth?'#283c3d':'#2e414b');g.addColorStop(1,earth?'#18282a':'#17282b');return g;}
const oldGradient=G.HonroTerrainGradient;G.HonroTerrainGradient=(c,t,b)=>active(b)&&t.mat!=='wood'&&!t.honroSeal?groundGradient(c,t,b):oldGradient(c,t,b);
// Stage 1's reviewed geography keeps the shared renderer; these are a few authored
// geological faces and living-bough planes, not a new material/tiling system.
const stage1Beds=[
 ['#52635b',[[3070,1580],[3220,1370],[3320,1300],[3500,1300],[3470,1360],[3300,1392],[3235,1570],[3110,1650]]],
 ['#374d49',[[3300,1392],[3470,1360],[3500,1300],[3570,1330],[3540,1490],[3400,1550],[3375,1730],[3235,1790],[3235,1570]]],
 ['#5f6d62',[[3500,1300],[3620,1160],[3820,1160],[3790,1220],[3650,1250],[3590,1410],[3540,1490],[3570,1330]]],
 ['#455c55',[[3650,1250],[3790,1220],[3820,1160],[3890,1135],[3860,1340],[3760,1420],[3690,1630],[3530,1710],[3590,1410]]],
 ['#65776c',[[3820,1160],[3980,1000],[4100,900],[4200,860],[4320,890],[4290,960],[4120,1000],[4020,1130],[3890,1135]]],
 ['#293f3e',[[3890,1135],[4020,1130],[4120,1000],[4100,1250],[3960,1340],[3900,1540],[3690,1630],[3760,1420],[3860,1340]]],
 ['#4f665f',[[4120,1000],[4290,960],[4320,890],[4490,960],[4440,1090],[4280,1140],[4250,1380],[4100,1480],[3960,1510],[3960,1340],[4100,1250]]],
 ['#596d61',[[4490,960],[4660,1030],[4790,990],[4920,810],[5100,735],[5070,840],[4930,910],[4890,1060],[4730,1140],[4580,1110],[4440,1090]]],
 ['#344d49',[[4440,1090],[4580,1110],[4730,1140],[4690,1340],[4520,1460],[4300,1550],[4250,1380],[4280,1140]]],
 ['#536b61',[[4890,1060],[4930,910],[5070,840],[5100,735],[5270,710],[5400,760],[5500,890],[5280,920],[5160,1040],[5150,1230],[4930,1330],[4690,1340],[4730,1140]]]
];
// Shallow bedding planes share the face colour; no painted floating platforms.
stage1Beds.push(
 ['#82917b30',[[3290,1430],[3460,1405],[3570,1370],[3680,1395],[3625,1410],[3465,1432],[3310,1450]]],
 ['#84927e2b',[[3730,1285],[3850,1260],[4010,1268],[4120,1215],[4075,1250],[3930,1285],[3770,1300]]],
 ['#86937e24',[[4180,1110],[4325,1085],[4465,1110],[4530,1160],[4415,1125],[4270,1128],[4185,1140]]],
 ['#84927c2b',[[4650,1210],[4790,1190],[4920,1150],[5060,1165],[5030,1185],[4880,1200],[4800,1235],[4655,1228]]]
);
stage1Beds.push(
 ['#293f38',[[3390,1355],[3380,1470],[3340,1550],[3355,1630],[3335,1690],[3365,1640],[3356,1552],[3400,1478],[3402,1350]]],
 ['#29423b',[[3760,1230],[3740,1330],[3670,1438],[3678,1530],[3654,1600],[3690,1533],[3686,1440],[3752,1338],[3770,1228]]],
 ['#2b443c',[[4190,1015],[4160,1135],[4180,1210],[4130,1340],[4135,1410],[4150,1343],[4196,1210],[4174,1134],[4202,1018]]],
 ['#263f38',[[4830,1080],[4810,1160],[4740,1235],[4750,1290],[4770,1239],[4825,1170],[4840,1080]]],
 ['#80907844',[[3380,1470],[3390,1355],[3420,1351],[3400,1478],[3356,1552],[3355,1575],[3340,1550]]],
 ['#81927d33',[[3740,1330],[3760,1230],[3790,1227],[3752,1338],[3686,1440],[3678,1465],[3670,1438]]]
);
const stage1BedPaths=stage1Beds.map(([color,points])=>({color,path:poly(points),top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))}));
// Gate basin cut banks: connected tilted beds follow the two downhill shoulders.
const stage4BedPaths=[
 ['#4e6056',[[1200,2270],[1390,2380],[1580,2485],[1740,2600],[1700,2670],[1515,2560],[1420,2490],[1300,2450]]],
 ['#344b44',[[1300,2450],[1420,2490],[1515,2560],[1700,2670],[1820,2730],[1740,2850],[1530,2730],[1450,2590],[1260,2540]]],
 ['#586b5c',[[2510,2610],[2700,2507],[2880,2405],[3070,2280],[3180,2240],[3130,2320],[2980,2425],[2910,2520],[2710,2600],[2590,2670]]],
 ['#3a5149',[[2590,2670],[2710,2600],[2910,2520],[2980,2425],[3130,2320],[3220,2310],[3160,2450],[3030,2570],[2960,2720],[2720,2810]]],
 ['#5c6b5c',[[3180,2240],[3370,2155],[3560,2070],[3740,1995],[3890,1960],[3800,2040],[3650,2110],[3540,2210],[3370,2270],[3220,2310],[3130,2320]]],
 ['#42584c',[[3220,2310],[3370,2270],[3540,2210],[3650,2110],[3800,2040],[3890,1960],[4140,1905],[4090,2010],[3900,2110],[3770,2260],[3510,2390],[3360,2450],[3160,2450]]],
 ['#293f3b',[[3510,2390],[3770,2260],[3900,2110],[4090,2010],[4210,1990],[4110,2180],[3960,2290],[3830,2480],[3520,2570],[3360,2450]]]
].map(([color,points])=>({color,path:poly(points)}));
function livingBough(c,t,q){
 c.save();c.fillStyle='#283d31';c.fill(q.shape);c.clip(q.shape);
 const top=q.edges.length?[q.edges[0][0],...q.edges.map(e=>e[1])]:[];
 if(top.length){const underside=top.map(p=>{const ps=C.poly(t),hits=[];for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];if(a.x!==z.x&&p.x>=Math.min(a.x,z.x)&&p.x<=Math.max(a.x,z.x))hits.push(a.y+(z.y-a.y)*(p.x-a.x)/(z.x-a.x));}const bottom=Math.max(p.y+8,...hits);return[p.x,p.y+(bottom-p.y)*.42];});
  c.fillStyle='#66715b';c.fill(poly([...top.map(p=>[p.x,p.y]),...underside.reverse()]));
  const trunk=t.id==='pine-branch-west'?1682:2101;
  c.fillStyle='#425741';c.beginPath();c.moveTo(t.x,t.y+t.h);c.quadraticCurveTo(trunk,t.y+t.h*.22,t.x+t.w,t.y+t.h*.7);c.lineTo(t.x+t.w,t.y+t.h+40);c.closePath();c.fill();
 }
 c.strokeStyle='#91a07b';c.lineWidth=1.8;c.stroke(q.rim);
 const knot=t.id==='pine-branch-west'?{x:1680,y:1301}:{x:2240,y:1137};
 c.fillStyle='#182e2466';c.beginPath();c.ellipse(knot.x,knot.y,27,9,-.12,0,Math.PI*2);c.fill();
 c.strokeStyle='#6f7a5844';c.lineWidth=3;c.beginPath();c.moveTo(knot.x-190,knot.y+19);c.bezierCurveTo(knot.x-80,knot.y+35,knot.x-55,knot.y-16,knot.x+50,knot.y-3);c.bezierCurveTo(knot.x+100,knot.y+8,knot.x+175,knot.y+25,knot.x+220,knot.y+28);c.stroke();
 c.restore();
}
function canyonBough(c,t,q,root=false){
 if(!q.canyonLit){
  const top=q.edges.length?[q.edges[0][0],...q.edges.map(e=>e[1])]:[],ps=C.poly(t);
  const inner=top.map(p=>{const hits=[p.y+8];for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];if(a.x!==z.x&&p.x>=Math.min(a.x,z.x)&&p.x<=Math.max(a.x,z.x))hits.push(a.y+(z.y-a.y)*(p.x-a.x)/(z.x-a.x));}return[p.x,p.y+(Math.max(...hits)-p.y)*.4];});
  q.canyonLit=poly([...top.map(p=>[p.x,p.y]),...inner.reverse()]);
  const right=t.id.startsWith('right'),kx=t.x+t.w*(right?.72:.28),ky=C.topAt(t,kx,t.y)+24;
  q.canyonKnot=new Path2D();q.canyonKnot.moveTo(kx-110,ky+13);q.canyonKnot.bezierCurveTo(kx-40,ky+28,kx-20,ky-17,kx+24,ky-5);q.canyonKnot.bezierCurveTo(kx+55,ky+10,kx+80,ky+16,kx+120,ky+14);
 }
 c.save();c.fillStyle=root?'#303e31':'#354a38';c.fill(q.shape);c.clip(q.shape);c.fillStyle=root?'#6d7258':'#65745d';c.fill(q.canyonLit);
 if(root){
  if(!q.rootGrain){q.rootGrain=new Path2D();const xs=[.06,.27,.53,.79,.96].map(v=>t.x+t.w*v);q.rootGrain.moveTo(xs[0],C.topAt(t,xs[0],t.y)+24);for(let i=1;i<xs.length;i++){const x=xs[i],prev=xs[i-1],y=C.topAt(t,x,t.y)+27;q.rootGrain.quadraticCurveTo((prev+x)/2,C.topAt(t,(prev+x)/2,t.y)+43,x,y);}}
  c.strokeStyle='#273b2d88';c.lineWidth=7;c.stroke(q.rootGrain);c.strokeStyle='#8a8c6638';c.lineWidth=2;c.stroke(q.rootGrain);
 }
 c.strokeStyle='#263b2c88';c.lineWidth=4;c.stroke(q.canyonKnot);
 c.strokeStyle='#8d9b76';c.lineWidth=1.6;c.stroke(q.rim);c.restore();
}
function ferryDeck(c,t,q){
 const roof=t.id==='warehouse-roof';c.save();c.fillStyle=roof?'#283b3d':'#625d46';c.fill(q.shape);c.clip(q.shape);
 if(!q.ferryCap){const top=q.edges.length?[q.edges[0][0],...q.edges.map(e=>e[1])]:[];q.ferryCap=poly([...top.map(p=>[p.x,p.y]),...top.slice().reverse().map(p=>[p.x,p.y+(roof?12:17)])]);
  q.ferryBeam=poly([...top.map(p=>[p.x,p.y+34]),...top.slice().reverse().map(p=>[p.x,p.y+100])]);
  q.ferryJoints=[];for(let x=t.x+125;x<t.x+t.w-30;x+=roof?175:145){const y=C.topAt(t,x,t.y);q.ferryJoints.push(line([[x,y+3],[x-9,y+(roof?16:30)]]));}}
 if(!roof){c.fillStyle='#343c30';c.fill(q.ferryBeam);}c.fillStyle=roof?'#687b79':'#a49a78';c.fill(q.ferryCap);c.strokeStyle=roof?'#182c30':'#242e23';c.lineWidth=3;for(const p of q.ferryJoints)c.stroke(p);
 c.strokeStyle=roof?'#9aaba3':'#b7ac84';c.lineWidth=2.5;c.stroke(q.rim);c.restore();
}
function drawTerrainMaterial(c,t,b,{walkRim=true}={}){const q=prepareTerrain(t,b);c.save();
 if(guardianBranch(b,t)){
  // Use the authored collision silhouette and bright walkable top. The bark
  // palette never changes resistance or the one-way projectile passage rule.
  const tip=Math.abs(t.x-2500)>Math.abs(t.x+t.w-2500)?t.x:t.x+t.w;
  c.fillStyle=A.gradient(c,2500,t.y,tip,t.y+35,[[0,'#777568'],[.3,'#626957'],[1,'#394f43']]);c.fill(q.branchBody||q.shape);c.clip(q.branchBody||q.shape);
  c.strokeStyle='#253d34';c.lineWidth=4;if(q.branchGrain)c.stroke(q.branchGrain);
  c.strokeStyle='#c2c4a0';c.lineWidth=5;c.lineJoin='round';c.stroke(q.rim);c.restore();return;
 }
 const roof=/^(west-eave|east-eave|west-gallery|east-gallery|altar-platform)$/.test(t.id);c.fillStyle=/^climb-/.test(t.id)?'#405460':roof?'#2b3e48':q.wood?A.gradient(c,0,t.y,0,t.y+t.h,[[0,'#6b6d5b'],[.28,'#484d41'],[1,'#26352e']]):groundGradient(c,t,b);c.fill(q.shape);c.clip(q.shape);
 for(const [i,p]of q.cliffPlanes.entries()){c.fillStyle=['#a2b4bb28','#081e294f','#82979f24','#0e27335c'][i];c.fill(p);}
 for(const [i,f]of q.planes.entries()){c.fillStyle=q.wood?'#a5a27e1e':i%2?'#a2b0b71e':'#b0b9ba23';c.fill(f.lit);c.fillStyle=q.wood?'#16292369':'#10243155';c.fill(f.shadow);c.strokeStyle=q.wood?'#20352b50':'#172c3655';c.lineWidth=5;c.stroke(f.contact);}
 if(b.honroStage===1&&b.honroMap?.positioning&&['forest-floor','ridge-east-extension'].includes(t.id))for(const f of stage1BedPaths){c.fillStyle=f.color.length===7?A.gradient(c,0,f.top,0,f.bottom,[[0,f.color],[.65,f.color],[1,'#344b43']]):f.color;c.fill(f.path);}
 if(b.honroStage===4&&b.honroMap?.positioning&&t.id==='gate-basin')for(const f of stage4BedPaths){c.fillStyle=f.color;c.fill(f.path);}
 if(walkRim)for(const cap of q.caps){c.fillStyle=q.wood?'#bdad781d':t.mat==='earth'?'#87927637':'#b9c2bc24';c.fill(cap);}c.strokeStyle='#1a2b2960';c.lineWidth=3;for(const j of q.joints)c.stroke(j);
 if(walkRim){c.strokeStyle=q.wood?'#b7b298':/^climb-/.test(t.id)?'#95aaa3':'#b4c6c1';c.lineWidth=/^climb-/.test(t.id)?2:3.5;c.lineJoin='round';c.stroke(q.rim);}c.restore();}
const oldTerrain=S.terrain;S.terrain=function(c,t){const b=this.battle;if(b?.honroStage===7&&b.honroMap?.positioning&&t.mat==='wood'&&!t.honroElementCollision){canyonBough(c,t,prepareTerrain(t,b),true);return;}if(b?.honroStage===6&&b.honroMap?.positioning&&t.surfaceKind==='bridgeDeck'){ferryDeck(c,t,prepareTerrain(t,b));return;}if(b?.honroStage===4&&b.honroMap?.positioning&&t.surfaceKind==='defenseDeck'){ferryDeck(c,t,prepareTerrain(t,b));return;}if(b?.honroStage===3&&b.honroMap?.positioning&&(t.id==='warehouse-roof'||t.mat==='wood'&&/^(dock-|cargo-step-)/.test(t.id))){ferryDeck(c,t,prepareTerrain(t,b));return;}if(b?.honroStage===2&&b.honroMap?.positioning&&t.surfaceKind==='branch'){canyonBough(c,t,prepareTerrain(t,b));return;}if(b?.honroStage===1&&b.honroMap?.positioning&&t.surfaceKind==='branch'){livingBough(c,t,prepareTerrain(t,b));return;}if(!active(b)||t.honroElementCollision||t.honroSeal||t.mat==='crystal'||t.surfaceKind==='branch'||!t.indestructible)return oldTerrain.call(this,c,t);return drawTerrainMaterial(c,t,b);};
const FORMS={
 shoulder:{outline:[[-.66,.16],[-.61,-.17],[-.47,-.31],[-.30,-.35],[-.29,-.64],[-.14,-.76],[.08,-.78],[.25,-.62],[.31,-.35],[.48,-.27],[.64,.16]],faces:[[[ -.29,-.64],[-.14,-.76],[.02,-.73],[.09,-.52],[-.11,-.21],[-.29,-.30]],[[.09,-.52],[.25,-.62],[.31,-.35],[.48,-.27],[.58,.12],[.12,.15],[-.03,-.1]],[[-.6,-.15],[-.46,-.3],[-.29,-.30],[-.11,-.21],[-.24,.15],[-.57,.15]]]},
 buttress:{outline:[[-.61,.15],[-.58,-.27],[-.47,-.35],[-.40,-.65],[-.25,-.78],[-.20,-.93],[.03,-1],[.21,-.94],[.34,-.77],[.32,-.42],[.48,-.29],[.59,.15]],faces:[[[ -.20,-.93],[.03,-1],[.15,-.86],[.08,-.55],[-.05,-.39],[-.2,-.1],[-.31,-.21],[-.31,-.66]],[[.15,-.86],[.21,-.94],[.34,-.77],[.32,-.42],[.21,-.32],[.08,-.55]],[[-.57,-.23],[-.40,-.65],[-.25,-.78],[-.31,-.21],[-.22,.15],[-.55,.15]],[[.01,-.4],[.21,-.32],[.48,-.29],[.59,.15],[.16,.15],[.14,-.09]]]}
};
// Stage10's guardian tree keeps its original silhouette and playable branches.
// These are accumulated Korean courtyard offerings: tied cords, looped knots
// and weathered cloth strips, attached to the same tree in its local space.
let guardianOfferingsCache;
function prepareGuardianOfferings(){if(guardianOfferingsCache)return guardianOfferingsCache;
 const routes=[
  [-650,-1255,-95,-1060,92,[.12,.31,.38,.57,.64,.72,.91]],
  [-126,-1268,235,-1193,69,[.19,.42,.51,.67,.84]],
  [80,-1080,589,-1000,118,[.11,.24,.43,.49,.55,.73,.89]],
  [-414,-1185,-84,-664,93,[.17,.23,.48,.59,.67,.84]],
  [-52,-766,367,-870,106,[.11,.34,.42,.51,.75,.9]],
  [-390,-280,-83,-590,50,[.12,.28,.39,.5,.56,.72,.87]],
  [62,-513,279,-663,50,[.14,.3,.41,.48,.65,.85]],
  [-108,-594,99,-565,31,[.12,.24,.36,.55,.69,.82,.9]],
  [-119,-414,132,-388,36,[.09,.18,.33,.46,.63,.73,.84,.92]],
  [-132,-235,128,-263,28,[.1,.2,.32,.71,.82,.93]],
  [-727,-1286,-445,-1238,52,[.22,.51,.8]],
  [527,-1038,801,-1061,46,[.18,.61,.85]]
 ];
 const lengths=[136,211,94,163,124,188,108,233,151,176,119],widths=[13,17,10,15,12,19,11],colors=['#b6ad91','#c0beaa','#a79d7e','#c9c5ae','#ada68b','#bdb89f','#845c50'];
 const ropes=[],knots=[],cloth=[];
 const knot=(x,y,large)=>{const p=new Path2D(),inner=new Path2D(),r=large?20:13,kind=knots.length%4;
  const loops=kind===0?[[-.3,0,.87,.53,-.4],[.3,.06,.68,.46,.65]]:kind===1?[[0,0,.72,.91,.21]]:kind===2?[[-.24,-.11,.72,.52,-.8],[.22,.12,.73,.52,.4],[0,.2,.38,.67,-.1]]:[[0,0,.86,.58,-.18]];
  for(const[dx,dy,rx,ry,angle]of loops){const cx=x+dx*r,cy=y+dy*r,ring=(q,xx,yy,reverse=false)=>{q.moveTo(cx+xx*Math.cos(angle),cy+xx*Math.sin(angle));q.ellipse(cx,cy,xx,yy,angle,0,Math.PI*2,reverse);};ring(p,rx*r,ry*r);ring(p,rx*r*.43,ry*r*.4,true);ring(inner,rx*r*.82,ry*r*.78);ring(inner,rx*r*.53,ry*r*.5,true);}
  // Broad crossing wraps make the loop a tied cord mass, not a repeated bow icon.
  p.moveTo(x-6,y-10);p.lineTo(x+5,y-8);p.lineTo(x+8,y+10);p.lineTo(x-5,y+12);p.closePath();
  inner.moveTo(x-3,y-9);inner.lineTo(x+1,y-8);inner.lineTo(x+4,y+10);inner.lineTo(x,y+11);inner.closePath();
  knots.push({body:p,light:inner});};
 for(const [i,[ax,ay,bx,by,sag,sites]]of routes.entries()){
  const cx=(ax+bx)/2,cy=(ay+by)/2+sag,ribbon=width=>{const p=new Path2D();p.moveTo(ax,ay-width/2);p.quadraticCurveTo(cx,cy-width/2,bx,by-width/2);p.lineTo(bx,by+width/2);p.quadraticCurveTo(cx,cy+width/2,ax,ay+width/2);p.closePath();return p;};ropes.push({body:ribbon(10),light:ribbon(5.5)});knot(ax,ay,i<10);knot(bx,by,i<10);
  for(const [j,t]of sites.entries()){
   const x=ax+(bx-ax)*t,y=(1-t)*(1-t)*ay+2*(1-t)*t*cy+t*t*by;
   // Dense lower trunk bunches stop above Sodan's head and binding panel.
   const length=Math.min(lengths[(i*3+j)%lengths.length],i===9?70+(j%3)*15:i===5||i===6?130:240),w=widths[(i+j*2)%widths.length],lean=[-13,8,-6,17,-3][(i+j)%5],p=new Path2D();
   p.moveTo(x-w*.5,y-5);p.lineTo(x+w*.5,y-3);p.quadraticCurveTo(x+w*.7+lean*.3,y+length*.38,x+w*.25+lean,y+length-7);p.lineTo(x+lean-w*.12,y+length);p.lineTo(x+lean-w*.25,y+length-11);p.lineTo(x+lean-w*.62,y+length-4);p.quadraticCurveTo(x-w*.52+lean*.1,y+length*.4,x-w*.5,y-5);p.closePath();
   const fold=new Path2D();fold.moveTo(x+w*.06,y+13);fold.quadraticCurveTo(x+lean*.4,y+length*.43,x+lean-w*.17,y+length-15);fold.lineTo(x+lean-w*.17-2,y+length-15);fold.quadraticCurveTo(x+lean*.4-2,y+length*.43,x+w*.06-2,y+13);fold.closePath();
   cloth.push({body:p,fold,color:colors[(i*2+j)%colors.length]});
   if(j===1||j===4||i>=7&&i<10&&j%2===0)knot(x,y+3,j===4);
  }
 }
 return guardianOfferingsCache={ropes,knots,cloth};
}
function drawGuardianOfferings(c,l){
 const guardianOfferings=prepareGuardianOfferings();
 c=G.HonroVisualStyle?.context(c,'L1')||c;c.save();c.translate(l.x,l.y);c.rotate(l.rotation||0);c.scale(l.scale??1,l.scale??1);c.lineJoin='round';c.lineCap='round';
 for(const p of guardianOfferings.ropes){c.fillStyle='#303b30';c.fill(p.body);c.fillStyle='#aa9c77';c.fill(p.light);}
 for(const t of guardianOfferings.cloth){c.fillStyle=t.color;c.fill(t.body);c.fillStyle='#514d3a66';c.fill(t.fold);}
 for(const k of guardianOfferings.knots){c.fillStyle='#394234';c.fill(k.body);c.fillStyle='#b4a17c';c.fill(k.light);}
 c.restore();
}

function prepareScene(b){let q=sceneCache.get(b);if(q?.source===b.honroMap.act1Scene&&q.version===b.sceneVersion)return q;const art=b.honroMap.act1Scene,rocks=[];
 for(const r of art.rocks||[]){const t=b.terrain.find(t=>t.id===r.supportId&&!t.broken);if(!t)continue;const form=FORMS[r.kind]||FORMS.shoulder,base=liveTop(b,r.supportId,r.x,r.y),foundations=b.terrain.filter(t=>!t.broken&&!t.oneWay&&!t.honroElementCollision&&t.y+t.h>=b.height),foot=px=>{const hits=foundations.filter(t=>px>=t.x&&px<=t.x+t.w).map(t=>C.topAt(t,px,b.height)).filter(Number.isFinite);return hits.length?Math.max(base,Math.min(...hits)):b.height;},map=points=>poly(points.map(([x,y])=>{const px=r.x+x*r.width;return[px,y>=0?foot(px)+y*r.height+55:base+y*r.height];}));rocks.push({...r,shape:map(form.outline),faces:form.faces.map(map)});}
 const shelfNecks=[];
 if(b.honroStage===5){const joins=[['climb-1',2790,205],['climb-2',2990,180],['climb-3',2900,270],['climb-4',3090,160],['climb-5',3010,225],['climb-6',3140,175],['climb-7',3210,210]];
  for(const [id,wall,drop]of joins){const t=b.terrain.find(t=>t.id===id&&!t.broken);if(!t)continue;const x=t.x+t.w*.35,right=t.x+t.w-8,y=C.topAt(t,right,t.y);shelfNecks.push({body:poly([[x,y+24],[right,y+9],[wall,y+35],[wall+70,y+drop],[right-40,y+drop*.65],[x,y+80]]),face:poly([[right,y+9],[wall,y+35],[wall-28,y+83],[right-16,y+93]])});}
 }
 q={source:art,version:b.sceneVersion,rocks,shelfNecks,replaced:new Set(art.replaced||[]),scenery:new Map((art.scenery||[]).map(s=>[s.id,s]))};sceneCache.set(b,q);return q;
}
function supports(c,b){if(G.HonroStage3LocationArt?.active(b)&&G.HonroStage3LocationArt.ready(b)||G.HonroStage4LocationArt?.active(b)&&G.HonroStage4LocationArt.ready(b)||G.HonroStage6LocationArt?.active(b)&&G.HonroStage6LocationArt.ready(b))return;c=G.HonroVisualStyle?.context(c,'L1')||c;
 // The three homes keep their original anchors. Short rear legs bridge
 // their level sills to the sloped living bough; no extra walkable floor.
 if(b.honroStage===7&&b.honroMap?.positioning){c.save();c.strokeStyle='#303b2d';c.lineWidth=15;
  for(const [support,x,y,width]of [['tier-low',1180,3836,410],['tier-mid',3000,3000,390],['tier-crown',1730,1396.3333333333333,450]]){
   const t=b.terrain.find(t=>t.id===support);if(!t)continue;
   for(const dx of [-width*.45,-width*.15,width*.32]){const px=x+dx,foot=C.topAt(t,px,y);if(foot<=y+8)continue;c.beginPath();c.moveTo(px,y-5);c.lineTo(px,foot+12);c.stroke();c.strokeStyle='#78816a66';c.lineWidth=3;c.beginPath();c.moveTo(px-4,y);c.lineTo(px-4,foot);c.stroke();c.strokeStyle='#303b2d';c.lineWidth=15;}
  }c.restore();
 }
 // Real optional decks receive visibly open timber trestles. Gaps remain gaps;
 // these narrow, darker members are scenery and never suggest extra floor.
 if(![3,4,6,8,9,10].includes(b.honroStage))return;
 // Stage 6's surviving deck spans are carried by the original stone piers.
 // Two knee braces per pier make their cantilevers readable without painting
 // another floor or closing either broken span.
 if(b.honroStage===6&&b.honroMap?.positioning){
  c.save();c.lineCap='butt';
  for(const [id,x]of [['bridge-west',2010],['bridge-mid',3150],['bridge-east',4530]]){
   const t=b.terrain.find(t=>t.id===id);if(!t)continue;const y=C.topAt(t,x,t.y)+38;
   for(const side of [-1,1]){const end=Math.max(t.x+25,Math.min(t.x+t.w-25,x+side*290)),ey=C.topAt(t,end,t.y)+38;
    c.strokeStyle='#27372f';c.lineWidth=24;c.beginPath();c.moveTo(x+side*35,y+285);c.lineTo(end,ey);c.stroke();
    c.strokeStyle='#82795b';c.lineWidth=7;c.beginPath();c.moveTo(x+side*35-3,y+275);c.lineTo(end-3,ey+2);c.stroke();
   }
  }c.restore();
 }
 const floors=b.terrain.filter(t=>!t.broken&&!t.oneWay&&!t.honroElementCollision&&t.y+t.h>=b.height);
 for(const t of b.terrain){if(guardianBranch(b,t)||t.broken||t.honroSeal||t.honroElementCollision||(!t.oneWay&&!/gallery|eave|tier-|ramp-|bridge-/.test(t.id))||t.w<190)continue;
  const under=(x,y)=>{const hits=floors.flatMap(f=>C.terrainSurfaces(f,x)).filter(p=>p.y>y+24);return hits.length?Math.min(...hits.map(p=>p.y)):b.height;};
  const pos=[t.x+t.w*.2,t.x+t.w*.8];for(const [i,x]of pos.entries()){const top=C.topAt(t,x,t.y)+t.h*.18,foot=under(x,top),max=b.honroStage===7?500:950,bottom=foot;if(bottom-top<30||bottom-top>max)continue;
   c.strokeStyle=b.honroStage===7?'#263b3299':'#263741';c.lineWidth=b.honroStage===7?32:18;c.lineCap='butt';c.beginPath();c.moveTo(x,top);c.lineTo(x+(i?-22:19),bottom);c.stroke();c.strokeStyle='#7381744f';c.lineWidth=3;c.beginPath();c.moveTo(x-4,top);c.lineTo(x+(i?-26:15),bottom);c.stroke();
   if(bottom-top<900){c.strokeStyle='#3e514b';c.lineWidth=9;c.beginPath();c.moveTo(x,Math.min(bottom,top+40));c.lineTo(x+(i?-100:100),Math.min(bottom,top+240));c.stroke();}
  }
 }
}
const oldBackground=S.background;S.background=function(c,w,h,b){oldBackground.call(this,c,w,h,b);if(!active(b))return;const q=prepareScene(b);c.save();c.translate(w/2,h/2);c.scale(this.scale,this.scale);c.translate(-this.x,-this.y);
 for(const r of q.rocks){if(r.x+r.width<this.x-w/this.scale||r.x-r.width>this.x+w/this.scale)continue;c.save();c.fillStyle=A.gradient(c,0,r.y-r.height,0,r.y+100,[[0,'#344955'],[.6,'#2a4149'],[1,'#22363d']]);c.fill(r.shape);c.clip(r.shape);for(const [i,p]of r.faces.entries()){c.fillStyle=['#7e909d50','#10293577','#233b4388','#a0a79620'][i%4];c.fill(p);}c.restore();}
 // Retained rear shelf fractures leave the bright rim on actual collision only.
 for(const neck of q.shelfNecks){c.fillStyle='#203743';c.fill(neck.body);c.fillStyle='#667f8526';c.fill(neck.face);}
 for(const light of b.honroMap.act1Scene.lights||[])A.glow(c,light.x,light.y,light.radius||200,(light.radius||200)*.8,'#bc9458',.1);c.restore();if(this.environmentStats){this.environmentStats.act1Spatial=true;this.environmentStats.cachedPaths+=q.rocks.length*4+q.shelfNecks.length*2;}
};
const oldLayer=S._landmarkLayer;S._landmarkLayer=function(c,landmarks,layer){oldLayer.call(this,c,landmarks,layer);if(layer==='structural-back'&&active(this.battle))supports(c,this.battle);};
const oldLandmark=S.landmark;S.landmark=function(c,l){if(active(this.battle)){const q=prepareScene(this.battle);if(q.replaced.has(l.id))return;const record=q.scenery.get(l.id);if(record&&!this.battle.terrain.some(t=>t.id===record.supportId&&!t.broken))return;}oldLandmark.call(this,c,l);if(active(this.battle)&&this.battle.honroStage===10&&l.id==='a1-scene-10-guardian-tree')drawGuardianOfferings(c,l);};
G.HonroAct1SpatialArt={active,drawTerrainMaterial,prepareTerrain,prepareScene,groundGradient,supports,prepareGuardianOfferings,drawGuardianOfferings};
})(globalThis);
