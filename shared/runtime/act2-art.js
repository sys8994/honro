(function(G){'use strict';
// Shared Canvas art: these retained paths are used by the game, Stage View,
// portraits, and Playtest. Collision comes exclusively from the map model.
const S=G.HonroScene.prototype,C=G.HONRO_CORE;
const path=d=>new Path2D(d),paint=(c,p,fill,stroke='#151d21',width=2)=>{if(fill){c.fillStyle=fill;c.fill(p);}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.stroke(p);}};
const paths={
 spiritSkull:path('M-11 -94 L-3 -101 7 -94 11 -84 5 -72 -3 -70 -12 -81Z'),
 spiritSocket:path('M-10 -87 L-3 -83 -5 -78 -11 -82Z M1 -84 L8 -88 7 -80 2 -78Z'),
 spiritJaw:path('M-8 -75 L-3 -72 5 -75 3 -67 -3 -65 -8 -69Z'),
 resonanceTendon:path('M-16 -76 Q-8 -64 -13 -51 L-8 -33 -15 -22 -20 -40 -23 -59Z M9 -70 L17 -62 18 -46 12 -29 8 -37 13 -52Z'),
 echoShoulder:path('M-25 -77 L-16 -81 -11 -71 -17 -56 -20 -43 -28 -49 -31 -62Z'),
 echoTendon:path('M-23 -73 L-17 -70 -23 -55 -23 -47 M9 -61 L18 -51 17 -37 9 -24'),
 // Keeper-only retained contours: tendons, overlapping cloth and loaded grips.
 cartPlanks:path('M-42 -49 L3 -46 M-38 -36 L1 -33 M10 -46 L43 -44 M7 -33 L40 -31'),
 cartIron:path('M-43 -58 L-36 -59 -32 -49 -39 -48Z M34 -56 L42 -55 39 -46 32 -46Z'),
 cartOre:path('M-31 -79 L-18 -75 -23 -66 -39 -65Z M-4 -86 L9 -80 0 -70 -13 -73Z M25 -82 L36 -69 24 -64 18 -74Z'),
 cartSpokes:path('M-36 -20 L-26 -3 M-41 -10 L-20 -12 M22 -17 L38 -3 M19 -8 L41 -13'),
 bellLip:path('M-23 -20 Q0 -14 23 -20 L22 -16 Q0 -10 -22 -16Z'),
 bellPanel:path('M-12 -60 L-5 -61 -4 -50 -12 -49Z M4 -61 L11 -60 13 -49 5 -50Z'),
 cart:path('M-49-63L35-70 49-57 38-18-35-18Z'),cartSide:path('M8-60L49-57 38-18 2-18Z'),
 cartLoad:path('M-43-65L-32-81-15-77-4-89 12-81 25-85 40-67 11-58Z'),
 cartRim:path('M-53-66L35-74 52-60 48-52 7-55-48-58Z'),
 cartBrace:path('M-35-58L-28-59-19-22-26-21Z M-8-59L-1-59 3-22-4-22Z M28-56L35-55 27-22 20-22Z'),
 wheel:path('M-41-19L-32-25-22-21-17-11-21-2-31 2-41-3-45-12Z M20-19L29-24 39-20 44-10 40 0 30 3 20-2 16-11Z'),
 wheelHub:path('M-35-16L-28-17-24-11-29-6-35-9Z M25-15L32-16 36-10 31-5 25-8Z'),
 pick:path('M-5-83L2-86 7-3 1 0-2-35Z'),
 pickHead:path('M-37-73Q-22-91-3-94L6-95Q24-94 40-81L21-84 8-85 6-76-5-77-9-85Q-24-82-37-73Z'),
 pickBlade:path('M-37-73Q-23-91-7-93L-9-86Q-24-82-37-73Z M8-91Q27-91 40-81L22-85 8-86Z'),
 lantern:path('M-32 0L-29-9 29-9 33 0Z M-25-9L-19-22-9-28H10L21-21 26-9Z M-8-28L-7-64H8L9-28Z M-22-64L-11-76H12L24-64Z M-25-76L-23-104-13-109H15L25-103 26-76Z'),
 lanternShade:path('M6-28L6-64 14-71 24-64 10-61 11-28Z M15-109L25-103 26-76 16-76Z M10-27L21-21 26-9 12-9Z'),
 lanternRoof:path('M-34-105Q-20-110-12-119L-5-121-4-127 1-133 6-127 6-121 14-118Q24-109 35-105L32-101-31-101Z'),
 window:path('M-15-82L-15-100-5-103 4-100V-82Z M15-99L21-97 21-83 15-82Z'),
 hoist:path('M-61 0L-43-173H-29L-42 0Z M42 0L27-173H42L60 0Z M-76-169H74V-151H-76Z M-41-144L43-52 40-34-48-130Z'),
 hoistShade:path('M-34-169L-29-169-42 0-48 0Z M35-169L42-169 60 0 52 0Z M-76-156H74V-151H-76Z'),
 hoistJoint:path('M-49-153L-27-153-29-141-48-141Z M25-153L46-153 47-141 27-141Z M-50-30L-39-29-42-15-52-16Z M40-30L54-31 56-19 42-18Z'),
 hoistWeight:path('M-15-79L9-85 24-68 29-32 18-11-24-11-31-30Z'),
 hoistWeightShade:path('M9-85L24-68 29-32 18-11 4-11 13-36Z'),
 wheelPaddle:path('M35-22L51-24 58-5 41 1Z'),
 wheelSpoke:path('M-4-5L40-7 43 2-3 5Z'),
 wheelCenter:path('M-10-6L-3-12 8-9 12 1 5 10-6 9-12 2Z'),
 // Original silhouettes informed by Korean bronze bell structure, not traced ornament.
 bell:path('M-17-63Q-18-76 0-79Q18-76 17-63L24-20Q0-12-24-20Z'),
 bellShade:path('M5-77Q18-75 17-63L24-20 9-18Z'),
 bellRim:path('M-24-24Q0-17 24-24L25-17Q0-10-25-17Z'),
 bellCrown:path('M-8-77L-10-87Q-3-97 5-86L4-79 M10-80L9-93 15-93 17-79'),
 resonance:path('M-28-13L-22-37-32-58-20-85-6-100 7-96 20-73 27-46 16-20 24-5 4-12-7 0-10-18Z'),
 resonancePlane:path('M-6-100L7-96 20-73 27-46 16-20 8-30 13-61 2-81Z'),
 resonanceGap:path('M-19-76Q-8-67 9-84L15-73Q1-54-17-64Z M-20-48Q-9-53 15-60L13-43Q-3-34-15-39Z'),
 echo:path('M-30-15L-24-42-35-55-27-81-9-99 8-104 18-88 16-73 31-59 28-39 13-18 18-3-3-12-17 1-13-20Z'),
 echoPlane:path('M8-104L18-88 16-73 31-59 28-39 13-18 18-3 3-14 8-39 15-53 3-69Z'),
 echoFace:path('M-20-75L-7-95 5-87-4-65-16-56-11-76Z'),
 echoJaw:path('M-22-45L-4-55 13-66 7-44-8-27-17-30-4-44Z'),
 striker:path('M-1 -68 L27 -63 27 -59 -1 -64Z')
};
function drawBell(c){
 paint(c,paths.bellCrown,'#8c9173','#b0af8a',1.8);
 paint(c,paths.bell,'#7d896b','#bdba91',1.8);paint(c,paths.bellShade,'#435a51',null);
 paint(c,paths.bellPanel,'#81724f','#b5a577',.7);paint(c,paths.bellRim,'#9e9872');paint(c,paths.bellLip,'#25322e','#b1a37a',.7);
 c.strokeStyle='#bbb38b';c.lineWidth=2;c.beginPath();c.moveTo(-16,-65);c.quadraticCurveTo(0,-60,16,-65);c.stroke();
 c.fillStyle='#41574e';c.strokeStyle='#b4a77a';c.beginPath();c.ellipse(-3,-40,7,8,0,0,Math.PI*2);c.fill();c.stroke();
}
const body=S.unitBody;
const drawUnit=S.unit;
S.unit=function(c,u,active,charge=0){
 if(!u.dead&&!u.portraitOnly&&this.battle&&u.honroSpirit&&!G.HonroAct2.visible(this.battle,u)){
  // No body, face, outline, name or HP bar. A few displaced translucent bands
  // suggest disturbed air while the unchanged unit remains in hit collision.
  c.save();c.translate(u.x,u.y-u.h*.5);const time=this.time||0;
  for(let j=0;j<5;j++){const phase=time*1.65+j*1.2,y=(j-2)*u.h*.16,drift=Math.sin(phase)*u.r*.25;c.globalAlpha=.07+.025*Math.sin(phase+.8);c.strokeStyle=j%2?'#b4c2be':'#728d96';c.lineWidth=2.5;c.beginPath();c.ellipse(drift,y,u.r*(.5+.15*Math.cos(phase)),u.h*.09,Math.sin(phase)*.14,.15,Math.PI*1.78);c.stroke();}
  c.restore();return;
 }
 return drawUnit.call(this,c,u,active,charge);
};
S.unitBody=function(c,u,charge){if(!u.honroAct2&&!u.honroSpirit)return body.call(this,c,u,charge);
 const kind=u.honroType;
 c.save();c.translate(u.x,u.y);c.scale((u.facing||1)*u.h/110,u.h/110);const t=this.time||0;
 const attack=Math.max(0,Math.min(1,u.anim||0)),step=u.moving?Math.sin(t*10)*3:0;
 if(kind==='keeper'){
  G.HonroKeeperRitualArt.draw(c,u,this.battle,t);
 }else if(u.honroSpirit){c.globalAlpha*=.94;c.translate(0,Math.sin(t*1.7)*5);c.rotate(-attack*.06);
  if(kind==='bellCluster'){
   // Linked, displaced bronze bodies make the cluster read as sound-bound
   // metal at game scale rather than three identical white ghost faces.
   c.strokeStyle='#9b987c';c.lineWidth=3;c.beginPath();c.moveTo(-27,-78);c.lineTo(0,-101);c.lineTo(29,-72);c.stroke();
   for(const [x,y,z] of [[-28,-14,.55],[28,-7,.58],[0,5,.88]]){c.save();c.translate(x,y+Math.sin(t*1.7+x)*2);c.rotate(Math.sin(t+x)*.045+attack*.12);c.scale(z,z);drawBell(c);c.restore();}
  }else if(kind==='echo'){
   paint(c,paths.echo,'#637879','#b4bca6',1.7);paint(c,paths.echoPlane,'#394f55',null);
   paint(c,paths.echoFace,'#c1bea4');paint(c,paths.echoJaw,'#9eaa97');
   paint(c,paths.echoShoulder,'#6e706a','#233136',1);paint(c,paths.echoTendon,null,'#a4a08a',1.8);paint(c,paths.spiritSkull,'#aa9f88','#344046',1);paint(c,paths.spiritSocket,'#19292d',null);paint(c,paths.spiritJaw,'#807666','#252f33',1);
  }else{
   paint(c,paths.resonance,'#788b80','#bec2a8',1.7);paint(c,paths.resonancePlane,'#425b5d',null);paint(c,paths.resonanceGap,'#203b43','#9cae9e',1.1);paint(c,paths.resonanceTendon,'#8b8172','#364847',1);paint(c,paths.spiritSkull,'#9c8c75','#33413c',1);paint(c,paths.spiritSocket,'#202c2b',null);paint(c,paths.spiritJaw,'#70634f','#263b38',1);
   c.strokeStyle='#c7b689';c.lineWidth=3;c.beginPath();c.moveTo(-4,-91);c.lineTo(2,-83);c.moveTo(-10,-29);c.lineTo(6,-32);c.stroke();
  }
 }else if(kind==='minecart'){
  c.rotate(Math.sin(t*8)*(u.moving?.018:.005));paint(c,paths.cartLoad,'#4e5c59','#9caa96',1.7);
  paint(c,paths.cart,'#766950','#b2a384',1.8);paint(c,paths.cartSide,'#3e4942',null);paint(c,paths.cartBrace,'#343e39','#9b9d83',1.2);paint(c,paths.cartRim,'#8a7a59');paint(c,paths.cartPlanks,null,'#342d28',1.4);paint(c,paths.cartIron,'#536267','#9a9b8b',.8);paint(c,paths.cartOre,'#82857b','#3b4848',.8);
  paint(c,paths.wheel,'#3e4a43','#a2a58d',2);paint(c,paths.cartSpokes,null,'#a39777',1.8);paint(c,paths.wheelHub,'#9d9571');
 }else if(kind==='picks'){
  for(const [x,y,a] of [[-27,-3,-.5],[23,-6,.6],[0,-14,.1]]){c.save();c.translate(x,y);c.rotate(a+Math.sin(t*2+x)*.05);paint(c,paths.pick,'#7d6b50','#b8ac8b',1.4);paint(c,paths.pickHead,'#536760','#aeb5a1',1.7);paint(c,paths.pickBlade,'#a2ad98',null);c.restore();}
 }else if(kind==='waterwheel'){
  c.save();c.translate(0,-55);c.rotate(t*.24);
  for(let j=0;j<8;j++){c.save();c.rotate(j*Math.PI/4);paint(c,paths.wheelSpoke,j%2?'#6b634d':'#847657','#192e30',1.8);paint(c,paths.wheelPaddle,j%2?'#576254':'#7b7d62','#a2a489',1.7);c.restore();}
  c.strokeStyle='#172d30';c.lineWidth=12;c.beginPath();c.arc(0,0,38,0,Math.PI*2);c.stroke();c.strokeStyle='#9d9470';c.lineWidth=7;c.stroke();
  paint(c,paths.wheelCenter,'#556359','#b4ac85',2);c.restore();
 }else if(kind==='stoneLantern'){
  // Octagonal shaft, lotus-bearing tiers, fire chamber and shallow stone roof.
  paint(c,paths.lantern,'#7c887b','#b3b9a1',1.8);paint(c,paths.lanternShade,'#475f59',null);
  paint(c,paths.window,'#243d3b','#a8ad8e',1.2);c.fillStyle='#bdb188';c.fillRect(-11,-96,7,12);
  paint(c,paths.lanternRoof,'#8c947e','#c0bda0',1.8);
 }else if(kind==='hoist'){
  paint(c,paths.hoist,'#75664c','#b7a883',2);paint(c,paths.hoistShade,'#3d4b43',null);paint(c,paths.hoistJoint,'#48584e','#a5a48b',1.3);
  c.save();c.translate(0,-143);c.scale(.8,.8);paint(c,paths.wheelCenter,'#928968','#b9b18f',2);c.restore();
  const sway=Math.sin(t*1.5)*10;c.strokeStyle='#aca68b';c.lineWidth=3;c.beginPath();c.moveTo(-5,-143);c.lineTo(sway-6,-70);c.moveTo(5,-143);c.lineTo(sway+6,-71);c.stroke();
  c.translate(sway,0);paint(c,paths.hoistWeight,'#5a6a60','#aab2a0',2);paint(c,paths.hoistWeightShade,'#354d48',null);
  c.strokeStyle='#a3997b';c.lineWidth=4;c.beginPath();c.moveTo(-20,-65);c.lineTo(-16,-29);c.lineTo(21,-30);c.lineTo(17,-68);c.stroke();
 }
 else{c.restore();return body.call(this,c,u,charge);}
 c.restore();
};
const terrain=S.terrain;
S.terrain=function(c,t){if(t.honroFireBarrier){
 const ps=C.poly(t),x=t.x,y=t.y,w=t.w,h=t.h;c.save();c.beginPath();ps.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle='#4f4432';c.fill();c.clip();
 // The solid is a blocked timber doorway. Charred planks and cross-braces
 // occupy that exact live polygon and disappear together when opened.
 for(let k=0;k<4;k++){const xx=x+k*w/4;c.fillStyle=k%2?'#746045':'#63553d';c.fillRect(xx+3,y+6,w/4-7,h-11);c.fillStyle='#a18a5f';c.fillRect(xx+6,y+15,3,h-30);c.fillStyle='#2d3c33';c.fillRect(xx+w/4-7,y+3,5,h-6);}
 c.lineCap='butt';for(const [a,z]of [[{x:x-5,y:y+h*.24},{x:x+w+4,y:y+h*.72}],[{x:x+3,y:y+h*.83},{x:x+w+7,y:y+h*.38}]]){c.strokeStyle='#293a31';c.lineWidth=23;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(z.x,z.y);c.stroke();c.strokeStyle='#8b7751';c.lineWidth=5;c.stroke();}c.restore();return;}
 if(t.honroLocationCeiling)return terrain.call(this,c,t);if(!t.honroCave&&!t.honroCeiling&&!(this.battle?.honroStage>=13&&this.battle?.honroStage<=19&&t.id==='act2-floor'))return terrain.call(this,c,t);
 if(G.HonroCaveRock&&this.battle)return G.HonroCaveRock.terrain(c,t,this.battle);
 const ps=C.poly(t);c.save();c.beginPath();ps.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();const grad=c.createLinearGradient(t.x,t.y,t.x+t.w*.4,t.y+Math.min(t.h,1200));grad.addColorStop(0,t.honroCeiling?'#252a30':'#444b50');grad.addColorStop(.5,'#30373d');grad.addColorStop(1,'#161f27');c.fillStyle=grad;c.fill();c.strokeStyle=t.honroCeiling?'#737c7d':'#919d99';c.lineWidth=t.honroCeiling?2:3;c.stroke();
 // A few broad mineral planes, clipped to the physical rock mass.
 c.clip();c.globalAlpha=.17;c.fillStyle='#8b9290';c.beginPath();c.moveTo(t.x+t.w*.12,t.y);c.lineTo(t.x+t.w*.56,t.y);c.lineTo(t.x+t.w*.37,t.y+t.h*.7);c.lineTo(t.x+t.w*.21,t.y+t.h);c.closePath();c.fill();c.restore();
};
// Guidance uses the same Euclidean foot-point radii as Act2.tick. These are
// screen cues only: no collision, geometry, progress or saved fields are added.
function holdGuide(b,s){
 if(!s||s.kind!=='hold'||!G.HonroAct2.revision2(b))return null;
 const m=b.honroMarkers.find(m=>m.id===s.id);if(!m||!(s.radius>0)||!(s.contestRadius>0))return null;
 const heroes=b.units.filter(u=>u.side===0&&!u.dead&&u.hp>0&&!u.summoned&&!u.enthrall);
 const guarded=heroes.some(u=>(!s.requiredClass||u.cls===s.requiredClass)&&Math.hypot(u.x-m.x,u.y-m.y)<s.radius);
 const contested=b.units.some(u=>u.side===1&&u.summonKind!=='eater'&&!u.eaterCapturedBy&&!u.dead&&Math.hypot(u.x-m.x,u.y-m.y)<s.contestRadius);
 const progress=b.honroState?.act2?.holds?.[s.id]?.progress||0;
 return{x:m.x,y:m.y,radius:s.radius,contestRadius:s.contestRadius,guarded,contested,progress,rounds:s.rounds,
  who:s.requiredClass?G.HONRO_CONTENT.hero[s.requiredClass].name:'동행 1명',status:contested?'적 진입 · 진행 멈춤':guarded?'방어 중':'범위 안으로 이동'};
}
function guideBadge(c,scene,x,y,lines,color){
 const z=Math.max(.05,scene.scale),{w,h}=scene.size(),sx=w/2+(x-scene.x)*z,sy=h/2+(y-scene.y)*z;
 if(sx<0||sx>w||sy<20||sy>h-lines.length*19-14)return;
 c.save();c.font='600 12px sans-serif';const width=Math.min(w-24,Math.max(...lines.map(t=>c.measureText(t).width))+20);
 const clamped=Math.max(width/2+12,Math.min(w-width/2-12,sx));c.translate(x+(clamped-sx)/z,y);c.scale(1/z,1/z);c.textAlign='center';c.textBaseline='middle';
 c.fillStyle='#10212bed';c.fillRect(-width/2,-13,width,lines.length*19+7);c.strokeStyle=color+'88';c.lineWidth=1;c.strokeRect(-width/2,-13,width,lines.length*19+7);
 lines.forEach((text,i)=>{c.fillStyle=i?'#c7cdc8':color;c.fillText(text,0,i*19,width-16);});c.restore();
}
function objectiveGuide(c,scene,b){
 if(scene.editorView||scene.skillPreview)return null;
 const s=G.HonroAct2.active(b)?G.HonroAct2.current(b):null;if(!s)return null;
 const z=Math.max(.05,scene.scale),hold=holdGuide(b,s);
 c.save();
 if(hold){
  const color=hold.contested?'#edab88':hold.guarded?'#b9d1b7':'#dfca98';
  c.beginPath();c.arc(hold.x,hold.y,hold.radius,0,Math.PI*2);c.fillStyle=color+'09';c.fill();c.strokeStyle=color+'ba';c.lineWidth=1.6/z;c.stroke();
  c.beginPath();c.arc(hold.x,hold.y,hold.contestRadius,0,Math.PI*2);c.setLineDash([5/z,7/z]);c.strokeStyle=hold.contested?'#edab88':'#cfb98b99';c.lineWidth=1.3/z;c.stroke();c.setLineDash([]);
  guideBadge(c,scene,hold.x,hold.y+43/z,[`${hold.who} 유지 · ${hold.progress}/${hold.rounds}${b.honroStage===12&&!b.honroCustom&&b.honroQuarryRevision===1?'라운드':'턴'} · ${hold.status}`,b.honroStage===12&&!b.honroCustom&&b.honroQuarryRevision===1?'실선: 방어 범위 / 점선 안에 적이 오면 중단':'실선: 방어 범위 / 점선: 적 진입 금지'],color);
 }else if(s.kind==='destroy'){
  const t=b.terrain.find(t=>t.id===s.id&&!t.broken);if(t){
   // Trace the real collision polygon, then bracket its bounds at a readable
   // screen width. Only the current actionable pin is highlighted.
   const ps=C.poly(t);c.beginPath();ps.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.strokeStyle='#f3d99bcc';c.lineWidth=1.6/z;c.stroke();
   const pad=7/z,l=t.x-pad,r=t.x+t.w+pad,top=t.y-pad,bottom=t.y+t.h+pad,arm=8/z;c.beginPath();
   for(const [x,dx]of [[l,1],[r,-1]])for(const [y,dy]of [[top,1],[bottom,-1]]){c.moveTo(x+dx*arm,y);c.lineTo(x,y);c.lineTo(x,y+dy*arm);}c.strokeStyle='#f3d99b';c.lineWidth=1.7/z;c.stroke();
   guideBadge(c,scene,t.x+t.w/2,bottom+23/z,[s.requiredClass?G.HONRO_CONTENT.hero[s.requiredClass].name+' · 사격 표적':'공격하여 파괴'],'#f3d99b');
  }
 }
 c.restore();return hold;
}
const tone=S.environmentTone;
S.environmentTone=function(c,w,h,b){tone?.call(this,c,w,h,b);if(b.honroStage<11||b.honroStage>20)return;
 c.save();c.translate(w/2,h/2);c.scale(this.scale,this.scale);c.translate(-this.x,-this.y);
 const radius=125;for(const m of b.honroMarkers||[])if(m.type==='act2-light'){
  if(Math.abs(m.x-this.x)>w/this.scale/2+radius||Math.abs(m.y-this.y)>h/this.scale/2+radius)continue;
  const q=c.createRadialGradient(m.x,m.y-50,5,m.x,m.y-50,radius);q.addColorStop(0,m.color+'45');q.addColorStop(1,m.color+'00');c.fillStyle=q;c.fillRect(m.x-radius,m.y-50-radius,radius*2,radius*2);
 }
 const target=G.HonroAct2.active(b)?G.HonroAct2.current(b):null;
 if(target){const m=b.honroMarkers.find(m=>m.id===target.id);if(m){c.strokeStyle='#d6c69c';c.lineWidth=2;c.beginPath();c.ellipse(m.x,m.y-3,32,9,0,0,Math.PI*2);c.stroke();}}
 objectiveGuide(c,this,b);
 const a=b.honroState?.act2,pulse=a?.pulseRound;if(pulse&&pulse!==this._act2Pulse){this._act2Pulse=pulse;this._act2PulseStart=this.time;}
 if(this._act2PulseStart!==undefined&&this.time-this._act2PulseStart<1.6){c.globalAlpha=Math.max(0,.12*(1-(this.time-this._act2PulseStart)/1.6));c.fillStyle='#b0c9d5';c.fillRect(this.x-w/this.scale/2,this.y-h/this.scale/2,w/this.scale,h/this.scale);}
 c.restore();
};
G.HonroAct2Art={paths,holdGuide,objectiveGuide};
})(globalThis);
