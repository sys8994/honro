(function(G){'use strict';
// The common scene renderer reads the canonical room references and live solid
// polygons. Every visible rim is a physical edge; only the rear ink masses and
// the overscan extension are visual-only. Old saves never enter this branch.
const C=G.HONRO_CORE,A=G.HonroEnvironmentArt,E=G.HonroEnvironment,terrainCache=new WeakMap(),roomCache=new WeakMap(),images={};
if(typeof Image!=='undefined')for(const [key,src]of Object.entries(G.HONRO_ACT2_FAR_DATA||{})){const image=new Image();image.src=src;images[key]=image;}
const active=b=>b?.honroStage>=11&&b.honroStage<=20&&b.honroMap?.space?.version===1;
const polygon=points=>{const p=new Path2D();points.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p;};
function roundedPolygon(points,radius=28,roundIndices=null){const p=new Path2D(),cuts=points.map((v,i)=>{const a=points[(i+points.length-1)%points.length],z=points[(i+1)%points.length],da=Math.hypot(v[0]-a[0],v[1]-a[1]),dz=Math.hypot(z[0]-v[0],z[1]-v[1]),r=roundIndices&&!roundIndices.has(i)?0:Math.min(radius,da*.14,dz*.14);return{v,enter:[v[0]+(a[0]-v[0])*r/(da||1),v[1]+(a[1]-v[1])*r/(da||1)],exit:[v[0]+(z[0]-v[0])*r/(dz||1),v[1]+(z[1]-v[1])*r/(dz||1)]};});p.moveTo(...cuts[0].exit);for(let i=1;i<=cuts.length;i++){const q=cuts[i%cuts.length];p.lineTo(...q.enter);p.quadraticCurveTo(...q.v,...q.exit);}p.closePath();return p;}
function pointIn(x,y,pts){let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],z=pts[j];if((a.y>y)!==(z.y>y)&&x<(z.x-a.x)*(y-a.y)/(z.y-a.y)+a.x)inside=!inside;}return inside;}
function surfaceEdges(t,b){const original=t.honroDomain?b.terrain.find(v=>v.id===t.id)||t:t,ps=C.poly(original),space=b.honroMap.space,ref=space.surfaces?.find(s=>s.terrainId===t.id),indices=ref?.edgeIndices||t.honroWalkEdges||[];const edges=indices.map(i=>[ps[i],ps[(i+1)%ps.length]]).filter(p=>p[0]&&p[1]&&(!t.honroDomain||!(Math.abs(p[0].x-p[1].x)<.001&&(p[0].x===0||p[0].x===b.width))));if(t.honroDomain){const ws=C.poly(t);for(let i=0;i<ws.length;i++){const a=ws[i],z=ws[(i+1)%ws.length],outside=Math.max(a.x,z.x)<=0||Math.min(a.x,z.x)>=b.width;if(outside&&Math.abs(z.x-a.x)>.001&&(t.honroCeiling?z.x<a.x:z.x>a.x)&&Math.abs((z.y-a.y)/(z.x-a.x))<1.36)edges.push([a,z]);}}return edges;}
function prepareTerrain(t,b){let q=terrainCache.get(t);if(q?.source===t.vertices&&q.version===b.sceneVersion)return q;const ps=C.poly(t),shape=polygon(ps.map(p=>[p.x,p.y])),surface=surfaceEdges(t,b),rim=new Path2D(),facets=[],blocks=[],wedges=[],masonry=[],lip=[],ceiling=!!t.honroCeiling,timber=!!(t.oneWay&&t.optional&&t.honroSurfaceRole==='shelf');
 const peers=G.HonroTerrainDomain.render(b).filter(s=>s.id!==t.id&&!s.broken&&!s.oneWay&&!s.honroElementCollision),buried=(x,y)=>peers.some(s=>x>s.x&&x<s.x+s.w&&y>s.y&&y<s.y+s.h&&pointIn(x,y,C.poly(s)));
 for(const [a,z]of surface){if(buried((a.x+z.x)/2,(a.y+z.y)/2+(ceiling?-3:3)))continue;rim.moveTo(a.x,a.y);rim.lineTo(z.x,z.y);if(!ceiling)lip.push(polygon([[a.x,a.y],[z.x,z.y],[z.x,z.y+18],[a.x,a.y+18]]));}
 // Three or four unequal broad fracture planes per physical mass. These have
 // no independent silhouette: clipping always uses the canonical polygon.
 const left=t.x,right=t.x+t.w,top=t.y,bottom=t.y+t.h,w=t.w,h=t.h;
 const range=surface.length?surface.flat().map(p=>p.y):[top];const y0=ceiling?Math.max(...range):Math.min(...range),sign=ceiling?-1:1;
 const anchors=[.015,.205,.515,.775],spans=[.30,.41,.31,.27];
 const at=x=>{const e=surface.find(([a,z])=>x>=Math.min(a.x,z.x)&&x<=Math.max(a.x,z.x));return e?e[0].y+(e[1].y-e[0].y)*(x-e[0].x)/(e[1].x-e[0].x||1):y0;};
 for(let i=0;i<anchors.length;i++){const x=left+w*anchors[i],wide=w*spans[i],depth=ceiling?Math.min(880,h*.65):Math.min(1900,h*.7),y=at(x)+sign*12,edgeY=at(Math.min(right,x+wide)),foot=depth*[.62,1,.73,.88][i];
  const sketches=[[[x,y],[x+wide,edgeY-sign*14],[x+wide*.81,edgeY+sign*foot*.44],[x+wide*.47,y+sign*foot],[x+wide*.13,y+sign*foot*.71]],[[x,y],[x+wide*.96,edgeY],[x+wide*.74,edgeY+sign*foot*.23],[x+wide*.46,y+sign*foot*.79],[x-wide*.04,y+sign*foot]],[[x,y],[x+wide,edgeY],[x+wide*.68,edgeY+sign*foot*.78],[x+wide*.25,y+sign*foot],[x+wide*.07,y+sign*foot*.46]],[[x,y],[x+wide,edgeY],[x+wide*.83,edgeY+sign*foot],[x+wide*.29,y+sign*foot*.71],[x+wide*.4,y+sign*foot*.20]]];facets.push(polygon(sketches[i]));}
 // Local stone blocks are tied to actual room changes and scenery supports,
 // not evenly-spaced stripes. Their entire shape is inside the live solid.
 if(!t.oneWay&&surface.length>1){const named=b.honroMap.space.rooms.filter(r=>r.terrainIds?.includes(t.id)||r.ceilingIds?.includes(t.id));
  for(const [j,room]of named.entries()){if(room.bounds.w<650)continue;const landmarks=(b.honroMap.space.scenery||[]).filter(v=>v.roomId===room.id&&/house|temple|hoist|bell|sluice/.test(v.assetId));const center=landmarks.length?landmarks.reduce((n,l)=>n+l.x,0)/landmarks.length:room.bounds.x+room.bounds.w*[.30,.67,.46][j%3],bw=Math.min(room.bounds.w*.82,landmarks.some(l=>/temple|bell/.test(l.assetId))?1750:1250),x0=Math.max(t.x,center-bw*.53),x1=Math.min(t.x+t.w,center+bw*.47),depth=ceiling?330+(j%3)*90:500+(j%3)*170,dir=ceiling?-1:1;
   const ridge=[x0,x0+(x1-x0)*.31,x0+(x1-x0)*.72,x1].map(x=>[x,at(x)]),a=ridge[0],z=ridge.at(-1),cut=x0+(x1-x0)*(.64-(j%2)*.13);
   const lower=[[x1-(x1-x0)*.12,z[1]+dir*depth*.63],[cut,a[1]+dir*depth],[x0+(x1-x0)*.07,a[1]+dir*depth*.79]];
   blocks.push({body:roundedPolygon([...ridge,...lower],30),side:roundedPolygon([[cut,at(cut)],[...z],lower[0],lower[1],[cut-(x1-x0)*.07,a[1]+dir*depth*.44]],24),contact:polygon([[cut-12,at(cut)+dir*15],[cut+12,at(cut)+dir*15],[cut-(x1-x0)*.055,a[1]+dir*depth*.44],[lower[1][0]+12,lower[1][1]],[lower[1][0]-10,lower[1][1]],[cut-(x1-x0)*.085,a[1]+dir*depth*.44]])});
  }
 }
 if([18,19].includes(b.honroStage)&&t.honroSurfaceRole==='floor'){const bell=(b.honroMap.space.landmarks||[]).find(l=>l.kind==='bell');if(bell)for(const side of [-1,1]){const cx=bell.x+side*650,left=cx-270,right=cx+270,top=[left,left+130,right-120,right].map(x=>[x,at(x)]),a=top[0],z=top.at(-1),depth=side<0?470:620,lower=[[right-80,z[1]+depth*.68],[cx+side*70,(a[1]+z[1])/2+depth],[left+55,a[1]+depth*.64]];wedges.push({body:polygon([...top,...lower]),side:polygon([[cx,at(cx)],[...z],lower[0],lower[1],[cx-45,at(cx)+depth*.4]]),contact:polygon([[cx-13,at(cx)+14],[cx+12,at(cx)+14],[cx-28,at(cx)+depth*.4],[lower[1][0]+12,lower[1][1]],[lower[1][0]-13,lower[1][1]],[cx-64,at(cx)+depth*.4]])});}}
 if(b.honroStage===16&&t.honroSurfaceRole==='floor'){const hall=b.honroMap.space.sites?.hall,hx=hall?.x??hall?.position?.x;const hy=Number.isFinite(hx)?at(hx):NaN,flat=surface.filter(([a,z])=>Math.abs(a.y-hy)<.5&&Math.abs(z.y-hy)<.5&&Math.abs((a.x+z.x)/2-hx)<1800);if(flat.length){const l=Math.min(...flat.flat().map(v=>v.x)),r=Math.max(...flat.flat().map(v=>v.x));for(const [i,depth]of [8,55,111].entries()){masonry.push({body:polygon([[l+18-i*13,hy+depth],[r-18+i*13,hy+depth],[r-10+i*13,hy+depth+43],[l+10-i*13,hy+depth+43]]),edge:polygon([[l+18-i*13,hy+depth],[r-18+i*13,hy+depth],[r-18+i*13,hy+depth+5],[l+18-i*13,hy+depth+5]])});}}}
 const joints=new Path2D();if(timber)for(let i=1;i<=3;i++){const x=t.x+t.w*[.24,.57,.81][i-1];joints.moveTo(x,at(x)+6);joints.lineTo(x-3,Math.min(t.y+t.h,at(x)+t.h*.86));}
 const authoredPlanes=(b.honroMap.space.terrainPlanes||[]).filter(p=>p.terrainId===t.id).map(p=>({fill:p.fill,path:polygon(p.points)}));
 q={source:t.vertices,version:b.sceneVersion,shape,rim,facets,blocks,wedges,masonry,lip,ceiling,timber,joints,authoredPlanes};terrainCache.set(t,q);return q;
}
function rock(c,b){const g=c.createLinearGradient(0,0,0,b.height+1300);g.addColorStop(0,'#333d49');g.addColorStop(.34,'#454d59');g.addColorStop(.69,'#323c49');g.addColorStop(1,'#152331');return g;}
function terrain(c,t,b){const q=prepareTerrain(t,b);c.save();
 if(t.oneWay&&t.optional){const floor=b.terrain.find(s=>s.honroSurfaceRole==='floor'&&!s.broken);if(floor){const left=t.x+24,right=t.x+t.w-24,ly=C.topAt(floor,left,b.height),ry=C.topAt(floor,right,b.height);c.strokeStyle='#343731';c.lineWidth=19;c.lineCap='butt';c.beginPath();c.moveTo(left,t.y+t.h-3);c.lineTo(left-20,Math.min(ly,t.y+600));c.moveTo(right,t.y+t.h-3);c.lineTo(right+18,Math.min(ry,t.y+600));c.moveTo(left,t.y+t.h+20);c.lineTo(right,Math.min(ry,t.y+600)-35);c.stroke();c.strokeStyle='#6c6350';c.lineWidth=4;c.beginPath();c.moveTo(left-6,t.y+t.h);c.lineTo(left-26,Math.min(ly,t.y+600));c.moveTo(right-6,t.y+t.h);c.lineTo(right+12,Math.min(ry,t.y+600));c.stroke();}}
 c.fillStyle=q.timber?A.gradient(c,0,t.y,0,t.y+t.h,[[0,'#776b52'],[.23,'#655640'],[.28,'#463e31'],[1,'#292e2a']]):rock(c,b);c.fill(q.shape);c.clip(q.shape);
 if(q.timber){
  // These existing optional decks already have open timber trestles. Match
  // the top/front material without changing their collision contract.
  c.strokeStyle='#222a26';c.lineWidth=3;c.stroke(q.joints);
 }else{
  // Preserve the broad fracture paths. Stronger paired light/shadow values
  // describe granite planes, rather than adding small polygon texture.
  q.facets.forEach((p,i)=>{c.fillStyle=['#7481901d','#0b182940','#9098a819','#07142342'][i%4];c.fill(p);});
  for(const block of q.blocks){c.fillStyle=q.ceiling?'#414c59':'#5b6572';c.fill(block.body);c.fillStyle=q.ceiling?'#192532':'#273443';c.fill(block.side);c.fillStyle='#091521a3';c.fill(block.contact);}
  for(const wedge of q.wedges){c.fillStyle='#75828da6';c.fill(wedge.body);c.fillStyle='#142431d4';c.fill(wedge.side);c.fillStyle='#091722bf';c.fill(wedge.contact);}
  for(const [i,row]of q.masonry.entries()){c.fillStyle=i%2?'#414c56':'#53616c';c.fill(row.body);c.fillStyle='#8c98924f';c.fill(row.edge);}
  // Optional broad authored planes remain clipped to the CURRENT solid.
  // Destroyed geometry cannot retain a detached decorative silhouette.
  for(const p of q.authoredPlanes){c.fillStyle=p.fill;c.fill(p.path);}
  // A local oil lamp warms only the neighbouring solid. The clipped bounce
  // shares the world's static cache; it never brightens actors or the cave.
  if(!q.ceiling)for(const light of b.honroMap.space.lights||[]){if(light.kind!=='oil'||!Number.isFinite(light.x)||!Number.isFinite(light.y)||light.x<t.x-160||light.x>t.x+t.w+160||light.y<t.y-220||light.y>t.y+t.h)continue;A.glow(c,light.x,light.y+74,155,118,light.color||'#d6aa70',.19);}
 }
 for(const p of q.lip){c.fillStyle=q.timber?'#b8a37a35':'#a1a9b130';c.fill(p);}c.strokeStyle=q.timber?'#a09172':q.ceiling?'#66748383':'#a8b5b9af';c.lineWidth=q.ceiling?3.5:4;c.lineJoin='bevel';c.stroke(q.rim);c.restore();}
function world(c,scene,w,h,fn){c.save();c.translate(w/2,h/2);c.scale(scene.scale,scene.scale);c.translate(-scene.x,-scene.y);fn();c.restore();}
function caveExtent(b){const roofs=b.terrain.filter(t=>t.honroCeiling&&!t.broken);if(!roofs.length)return null;return{left:Math.min(...roofs.map(t=>t.x)),right:Math.max(...roofs.map(t=>t.x+t.w))};}
// Local compositions are keyed to named rooms, not repeated at distance
// intervals. Each rear buttress stands on that room's canonical support and
// leaves an authored void around its action site. Profiles are original large
// granite masses in the approved illustration's broad-plane vocabulary.
const ROOM_ART={
 11:[['east-knot-court','shoulder',.14,1450,720,-1],['resident-bank','buttress',.10,1550,1050,1],['north-trace','quarry',.8,1900,1350,1]],
 12:[['rockfall-cut','quarry',.70,2300,1750,1],['sign-yard','shoulder',.7,1800,950,-1],['outer-mouth','buttress',.95,1500,2300,1]],
 13:[['mason-ledge','shoulder',.20,1450,1450,-1],['stone-threshold','quarry',.18,1900,2000,1],['inner-pocket','buttress',.88,1450,1250,1]],
 14:[['upper-homes','quarry',.42,2600,1600,-1],['middle-market','buttress',.55,1850,1370,1],['right-descent','wall',.50,2400,1550,1],['lower-family','shoulder',.78,1650,1150,-1]],
 15:[['wet-approach','shoulder',.23,1600,1050,-1],['sluice-neck','quarry',.28,1450,1550,-1],['open-shaft','buttress',.89,1650,2550,1],['temple-stair','shoulder',.88,1750,1500,1]],
 16:[['temple-court','wall',.44,2550,1550,-1],['monk-shelter','shoulder',.38,1500,1250,-1],['hall-terrace','quarry',.76,2050,1770,1],['record-gallery','buttress',.98,1200,1450,-1]],
 17:[['brace-workyard','buttress',.17,1650,1450,-1],['hoist-bay','quarry',.80,2500,2300,1],['work-notes','shoulder',.94,1450,1300,1]],
 18:[['bell-entry','shoulder',.2,1850,1550,-1],['chain-shoulder','buttress',.43,1550,2150,-1],['keeper-ledge','quarry',.68,2850,2700,1]],
 19:[['bell-entry','shoulder',.2,1850,1550,-1],['chain-shoulder','buttress',.43,1550,2150,-1],['keeper-ledge','quarry',.68,2850,2700,1]],
 20:[['blocked-mouth','buttress',.45,2300,1750,-1],['final-pass','shoulder',.6,1900,650,1]]
};
const ROCK_FORMS={
 wall:{outline:[[-.67,.15],[-.64,-.42],[-.49,-.69],[-.19,-.77],[.03,-.66],[.23,-.57],[.43,-.33],[.65,-.17],[.67,.16]],faces:[
 [[-.49,-.69],[-.19,-.77],[-.10,-.61],[-.22,-.38],[-.47,-.21],[-.58,-.34]],
 [[-.09,-.60],[.03,-.66],[.23,-.57],[.43,-.33],[.19,-.19],[-.01,-.24]],
 [[-.47,-.2],[-.22,-.38],[.03,-.22],[.13,.15],[-.47,.15]],
 [[.2,-.19],[.43,-.33],[.65,-.17],[.67,.16],[.35,.16]]],seams:[[[ -.1,-.61],[-.22,-.38],[-.47,-.21],[-.42,-.25],[-.28,-.42],[-.16,-.62]],[[.19,-.19],[.35,.16],[.29,.16],[.14,-.21]]]},
 shoulder:{outline:[[-.62,.15],[-.59,-.19],[-.48,-.38],[-.34,-.43],[-.3,-.69],[-.12,-.8],[.12,-.79],[.26,-.66],[.29,-.4],[.51,-.28],[.63,.14]],faces:[
 [[-.3,-.69],[-.12,-.8],[.07,-.72],[.06,-.43],[-.16,-.22],[-.29,-.3],[-.35,-.48]],
 [[-.56,-.19],[-.45,-.39],[-.24,-.4],[-.12,-.21],[-.24,.13],[-.52,.13]],
 [[.08,-.4],[.25,-.48],[.46,-.26],[.57,-.05],[.43,.14],[.06,.14],[-.03,-.17]]],seams:[[[.07,-.71],[.14,-.76],[.23,-.65],[.17,-.51],[.10,-.53],[.14,-.63]],[[ -.24,-.4],[-.12,-.21],[-.19,-.1],[-.23,-.13],[-.2,-.2],[-.28,-.39]]]},
 buttress:{outline:[[-.6,.15],[-.53,-.3],[-.37,-.43],[-.29,-.54],[-.3,-.87],[-.15,-.98],[.12,-1],[.29,-.88],[.32,-.65],[.27,-.35],[.49,-.2],[.61,.15]],faces:[
 [[-.29,-.84],[-.15,-.98],[.08,-.98],[.16,-.8],[.03,-.45],[-.13,-.25],[-.26,-.33],[-.22,-.63]],
 [[.16,-.81],[.29,-.88],[.32,-.65],[.27,-.35],[.15,-.28],[.02,-.44]],
 [[-.5,-.27],[-.35,-.47],[-.14,-.42],[-.05,-.23],[-.22,.13],[-.48,.13]],
 [[.08,-.24],[.26,-.35],[.47,-.18],[.55,.12],[.2,.13],[.13,-.07]]],seams:[[[.02,-.45],[.15,-.3],[.08,-.24],[-.05,-.23],[-.14,-.42],[-.1,-.46]],[[.08,-.97],[.16,-.8],[.09,-.63],[.03,-.65],[.09,-.81],[.02,-.98]],[[.13,-.07],[.2,.13],[.15,.13],[.09,-.03]]]},
 quarry:{outline:[[-.62,.15],[-.59,-.32],[-.48,-.4],[-.46,-.65],[-.29,-.73],[-.24,-.93],[.03,-1],[.27,-.96],[.34,-.8],[.31,-.5],[.49,-.4],[.58,-.14],[.6,.15]],faces:[
 [[-.24,-.93],[.03,-1],[.20,-.89],[.12,-.54],[-.04,-.39],[-.18,-.11],[-.32,-.08],[-.34,-.5]],
 [[.20,-.89],[.27,-.96],[.34,-.8],[.31,-.5],[.19,-.39],[.12,-.54]],
 [[-.58,-.3],[-.46,-.65],[-.31,-.7],[-.2,-.43],[-.32,-.19],[-.36,.14],[-.54,.14]],
 [[-.01,-.37],[.13,-.53],[.34,-.48],[.49,-.38],[.56,-.12],[.50,.15],[.25,.16],[.24,-.17]]],seams:[[[.2,-.89],[.15,-.67],[.09,-.63],[.10,-.73],[.14,-.89]],[[.12,-.54],[-.04,-.39],[-.10,-.25],[-.16,-.29],[-.1,-.43],[.06,-.57]],[[ -.2,-.43],[-.32,-.19],[-.37,-.2],[-.31,-.34],[-.26,-.46]]]}
};
function prepareRooms(b){const space=b.honroMap.space;let q=roomCache.get(b);if(q?.source===space&&q.version===b.sceneVersion)return q;const floor=b.terrain.find(t=>t.honroSurfaceRole==='floor'&&!t.broken),rooms=[];
 for(const [id,kind,u,width,height,flip]of (Array.isArray(space.rockCompositions)?space.rockCompositions:ROOM_ART[b.honroStage]||[])){const room=space.rooms.find(r=>r.id===id);if(!room||!floor)continue;const x=room.bounds.x+room.bounds.w*u,y=C.topAt(floor,x,room.bounds.y+room.bounds.h),form=ROCK_FORMS[kind],pp=(ps,soft=false)=>{const samples=[],softCorners=new Set();for(let i=0;i<ps.length;i++){const a=ps[i],next=ps[(i+1)%ps.length],count=a[1]>=0&&next[1]>=0?Math.max(1,Math.ceil(Math.abs(next[0]-a[0])*width/180)):1;if(soft&&a[1]<-.65&&i%2===0)softCorners.add(samples.length);for(let k=0;k<count;k++){const f=k/count,z=a[1]+(next[1]-a[1])*f,px=x+(a[0]+(next[0]-a[0])*f)*width*flip,py=z>=0?C.topAt(floor,Math.max(0,Math.min(b.width,px)),y)+z*height+80:y+z*height;samples.push([px,py]);}}return soft?roundedPolygon(samples,Math.min(15,width*.008),softCorners):polygon(samples);};
  rooms.push({id,box:{x:x-width*.7,y:y-height,w:width*1.4,h:height*1.2},shape:pp(form.outline,true),faces:form.faces.map(face=>pp(face)),seams:form.seams.map(face=>pp(face)),outdoor:room.sky==='open'});
 }
 q={source:space,version:b.sceneVersion,rooms};roomCache.set(b,q);return q;
}
function background(c,b,scene,w,h){if(!active(b))return false;const n=b.honroStage,open=[11,12,13,20].includes(n),img=images[n===20?'dawn':'clouded'];
 if(open){const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,n===20?'#3b4d5a':'#2f3d4e');sky.addColorStop(1,n===20?'#88908a':'#617079');c.fillStyle=sky;c.fillRect(0,0,w,h);if(img?.complete&&img.naturalWidth){const q=E.act1BackdropFrame(scene,w,h,b,img.naturalWidth,img.naturalHeight);c.drawImage(img,q.x,q.y,q.w,q.h);}}
 else{const dark=c.createLinearGradient(0,0,0,h);dark.addColorStop(0,'#0a121d');dark.addColorStop(.66,'#101c28');dark.addColorStop(1,'#172630');c.fillStyle=dark;c.fillRect(0,0,w,h);}
 const q=prepareRooms(b),extent=caveExtent(b),left=scene.x-w/scene.scale/2,right=scene.x+w/scene.scale/2,top=scene.y-h/scene.scale/2,bottom=scene.y+h/scene.scale/2;
 world(c,scene,w,h,()=>{
  if(open&&extent){const fade=500,entry=n!==20,start=entry?extent.left:extent.right-fade,end=entry?extent.left+fade:extent.right;
   const g=c.createLinearGradient(start,0,end,0);g.addColorStop(0,entry?'#0a121d00':'#0a121d');g.addColorStop(1,entry?'#0a121d':'#0a121d00');c.fillStyle=g;const shadeTop=G.HonroTerrainDomain.active(b)?Math.max(0,top):top;c.fillRect(entry?start:left,shadeTop,entry?right-start:end-left,Math.max(0,bottom-shadeTop));}
  for(const room of q.rooms){const box=room.box;if(box.x+box.w<left-300||box.x>right+300)continue;
   c.save();
   c.globalAlpha=1;c.fillStyle=A.gradient(c,0,box.y,0,box.y+box.h,[[0,room.outdoor?'#2c3d49':'#253440'],[.55,room.outdoor?'#283947':'#1b2b38'],[1,'#142431']]);c.fill(room.shape);c.clip(room.shape);room.faces.forEach((face,i)=>{c.fillStyle=i%2?'#101b26':'#40505e';c.globalAlpha=room.outdoor?.40:i===0?.42:.36;c.fill(face);});c.globalAlpha=.68;c.fillStyle='#0d1c28';for(const seam of room.seams)c.fill(seam);c.restore();
  }
  c.globalAlpha=1;
  const hanging=b.honroCaveHangingTarget,target=b.terrain.find(t=>t.id==='shaft-pin');
  if(hanging&&target&&!target.broken){c.strokeStyle='#746d58';c.lineWidth=4;c.beginPath();c.moveTo(hanging.x,hanging.roofY-4);c.lineTo(hanging.x+4,hanging.roofY+65);c.lineTo(target.x+target.w*.5,target.y+4);c.stroke();}
  const clue=b.honroCaveHangingClue;if(clue&&Number.isFinite(clue.x)&&Number.isFinite(clue.targetY)){c.save();c.strokeStyle='#746d58';c.lineWidth=5;c.beginPath();c.moveTo(clue.x,clue.roofY);c.lineTo(clue.x,clue.targetY);c.stroke();c.strokeStyle='#a29370';c.lineWidth=7;c.beginPath();c.ellipse(clue.x,clue.targetY+22,22,30,0,0,Math.PI*2);c.stroke();c.restore();}
  // Illumination stays behind terrain and actors. Limited local pools replace
  // repeated pillars and particles; the marker is the authored light source.
  const lights=b.honroMap.space.lights||[];for(const light of lights){const x=light.x,y=light.y;if(!Number.isFinite(x)||!Number.isFinite(y)||x<left-500||x>right+500)continue;A.glow(c,x,y-75,light.radius||280,(light.radius||280)*.75,light.color||'#c29959',.13);}
  if(n===19){const bell=(b.honroLandmarks||[]).find(l=>l.asset?.id==='act2:bell');if(bell)A.glow(c,bell.x,bell.y-500,850,1150,'#657d84',.07);}
 });
 scene.environmentStats={groups:q.rooms.length,visibleAssets:0,cachedPaths:q.rooms.length*3,backgroundAnimatedPrimitives:0,animatedPrimitives:0,...A.stats(),act2Spatial:true};return true;
}
// Extrapolate only intervals occupied by real boundary solids. Each is filled
// independently (union semantics), so overlapping floors never cancel holes.
function intervals(t,x){const ps=C.poly(t),ys=[];for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];if((a.x<=x&&z.x>x)||(z.x<=x&&a.x>x))ys.push(a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x));}ys.sort((a,z)=>a-z);const out=[];for(let i=0;i+1<ys.length;i+=2)out.push([ys[i],ys[i+1]]);return out;}
function enclosure(c,b,w,h,scene){const v=G.HonroBounds.visual(b,w,h,scene.scale),key=[b.sceneVersion,v.left,v.top,v.right,v.bottom].join(':'),cached=scene._act2Enclosure;let q=cached;
 if(!q||q.key!==key||q.terrain!==b.terrain){const paths=[],rims=[];for(const t of b.terrain){if(t.broken||t.oneWay||t.honroElementCollision)continue;for(const side of [-1,1]){const edge=side<0?0:b.width;if(t.x>edge||t.x+t.w<edge)continue;const outer=side<0?v.left:v.right,spans=intervals(t,edge-side*.5);for(const [top,bottom]of spans){if(bottom-top<2)continue;const d=Math.abs(outer-edge),mid=edge+side*Math.min(800,d*.4),bend=Math.min(150,d*.045),p=new Path2D();p.moveTo(edge-side*8,top<=1?v.top-20:top);p.lineTo(mid,top<=1?v.top-20:top+(side<0?-bend:bend));p.lineTo(outer,top<=1?v.top-20:top+(side<0?-bend*.6:bend*.8));p.lineTo(outer,bottom>=b.height?v.bottom+20:bottom+bend*.6);p.lineTo(mid,bottom>=b.height?v.bottom+20:bottom+bend);p.lineTo(edge-side*8,bottom);p.closePath();paths.push(p);}}
   if(t.y<1){const p=polygon([[Math.max(v.left,t.x),v.top-20],[Math.min(v.right,t.x+t.w),v.top-20],[Math.min(v.right,t.x+t.w),t.y+8],[Math.max(v.left,t.x),t.y+8]]);paths.push(p);}
   if(t.y+t.h>=b.height){paths.push(polygon([[t.x,b.height-5],[t.x+t.w,b.height-5],[t.x+t.w,v.bottom+20],[t.x,v.bottom+20]]));}
  }q={key,terrain:b.terrain,paths,rims};scene._act2Enclosure=q;scene._skirtBuilds=(scene._skirtBuilds||0)+1;}
 c.save();c.fillStyle=rock(c,b);for(const p of q.paths)c.fill(p);c.restore();scene.overscanStats={bounds:v,paths:q.paths.length,builds:scene._skirtBuilds,cave:true,canonical:true};
}
const releasedBells=new WeakMap(),chainCache=new WeakMap();
function appearanceKey(b){if(!active(b))return'';const done=b.honroState?.act2?.done||{};return [b.honroStage,!!done['upper-chain'],!!done['lower-chain'],!!done['clear-souls'],!!done['old-soul']].join(':');}
function element(c,asset,inst,scene){const b=scene?.battle;if(!active(b))return false;
 if(asset.id==='act2:old-soul-stone'&&b.honroStage===19){const done=b.honroState?.act2?.done||{};if(!done['clear-souls']&&!done['old-soul'])return true;}
 if(asset.id==='act2:bell'&&b.honroStage===19&&asset.vector){if(!asset.vector.gradients?.bronze||!Array.isArray(asset.vector.gradients.bronze.stops))return false;let quiet=releasedBells.get(asset);if(!quiet){quiet={...asset,vector:JSON.parse(JSON.stringify(asset.vector))};quiet.vector.gradients.bronze.stops=quiet.vector.gradients.bronze.stops.map(s=>({...s,color:E.mixColor(s.color,'#273636',.18)}));const light=quiet.vector.root.children?.find(n=>n.id==='left-bronze-light-plane');if(light)light.opacity=.07;releasedBells.set(asset,quiet);}G.HonroVectorArt.draw(c,quiet,inst);return true;}
 return false;
}
// Short tension members pin the bell laterally into stone. Nothing descends
// from the crown or ceiling, so the monument can never read as hanging.
function bellBindings(c,b){if(!active(b)||![18,19].includes(b.honroStage))return;const bell=(b.honroLandmarks||[]).find(l=>l.asset?.id==='act2:bell');if(!bell)return;const done=b.honroState?.act2?.done||{},released=b.honroStage===19,scale=bell.scale||1;
 c.save();c.strokeStyle=released?'#4c554c':'#77705a';c.lineWidth=7;c.lineCap='round';
 for(const side of [-1,1]){const x=bell.x+side*265*scale,y=bell.y-300*scale,near=bell.x+side*380*scale,floor=b.terrain.find(t=>t.honroSurfaceRole==='floor'&&!t.broken),foot=floor?C.topAt(floor,near,bell.y):bell.y;const cut=released||(side<0?done['upper-chain']:done['lower-chain']);c.beginPath();c.moveTo(x,y);if(cut){c.quadraticCurveTo(x+side*47*scale,y+80*scale,x+side*25*scale,y+135*scale);c.moveTo(near,foot-12);c.lineTo(near-side*24*scale,foot-36);}else c.lineTo(near,foot-12);c.stroke();}
 c.restore();
}
const oldLandmarkLayer=G.HonroScene.prototype._landmarkLayer;
G.HonroScene.prototype._landmarkLayer=function(c,landmarks,layer){oldLandmarkLayer.call(this,c,landmarks,layer);if(layer==='structural-back')bellBindings(c,this.battle);};
G.HonroAct2SpatialArt={active,background,terrain,prepareTerrain,prepareRooms,surfaceEdges,rock,enclosure,element,appearanceKey,bellBindings,images,ready:()=>Object.values(images).every(i=>i.complete&&i.naturalWidth)};
})(globalThis);
