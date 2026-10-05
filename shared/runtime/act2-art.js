(function(G){'use strict';
// Shared Canvas art: these retained paths are used by the game, Stage View,
// portraits, and Playtest. Collision comes exclusively from the map model.
const S=G.HonroScene.prototype,C=G.HONRO_CORE;
const path=d=>new Path2D(d),paint=(c,p,fill,stroke='#151d21',width=2)=>{if(fill){c.fillStyle=fill;c.fill(p);}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.stroke(p);}};
const paths={
 cart:path('M-49-63L46-57 37-17-37-17Z M-54-68L52-62 49-52-51-57Z'),cartSide:path('M8-59L46-57 37-17 2-17Z'),wheel:path('M-31-23a13 13 0 1 0 0 26a13 13 0 1 0 0-26 M29-23a13 13 0 1 0 0 26a13 13 0 1 0 0-26'),
 pick:path('M-4-83L4-83 8 0-2 0Z M-40-73Q0-110 41-72L26-76Q0-86-26-75Z'),
 lantern:path('M-32 0L-26-15H26L33 0Z M-17-15L-14-77H14L17-15Z M-33-76L-25-107H25L33-76Z M-37-108L-19-128 0-137 19-129 37-108Z'),window:path('M-15-82L-15-102H15V-82Z'),
 hoist:path('M-61 0L-43-173H-29L-42 0Z M42 0L27-173H42L60 0Z M-76-169H74V-151H-76Z M-41-144L43-52 40-34-48-130Z'),hoistWeight:path('M-15-83L16-83 29-32 18-11-24-11-31-30Z'),
 soul:path('M-29-24Q-52-68-19-97Q0-124 21-98Q48-75 31-39L15-9 25 4 4-3-11 3-8-16Z'),face:path('M-12-80Q0-94 12-80L9-65Q0-55-9-65Z'),
 stole:path('M-24-72L-8-79-5-15-22-4Z M10-79L26-72 21-4 5-16Z')
};
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
 if(kind==='keeper'){body.call(this,c,u,charge);c.save();c.translate(u.x,u.y);c.scale((u.facing||1)*u.h/103,u.h/103);paint(c,paths.stole,'#9b8b69','#c0b28d',1.2);c.restore();return;}
 c.save();c.translate(u.x,u.y);c.scale((u.facing||1)*u.h/110,u.h/110);const t=this.time||0;
 if(u.honroSpirit){c.globalAlpha*=.94;c.translate(0,Math.sin(t*1.7)*5);
  if(kind==='bellCluster'){for(const [x,y,z] of [[-29,-11,.6],[28,-6,.62],[0,0,.83]]){c.save();c.translate(x,y);c.scale(z,z);paint(c,paths.soul,'#718794','#bac7c2',1.5);paint(c,paths.face,'#c6cec5',null);c.restore();}}
  else{paint(c,paths.soul,kind==='echo'?'#6f728e':'#778c94','#becbc1',1.7);paint(c,paths.face,'#d0d6c8','#7d8b86',.8);}
 }else if(kind==='minecart'){c.rotate(Math.sin(t*8)*(u.moving?.018:.005));paint(c,paths.cart,'#776a50','#aaa486',2);paint(c,paths.cartSide,'#3e473f',null);paint(c,paths.wheel,'#293c3d','#a0a590',3);}
 else if(kind==='picks'){for(const [x,y,a] of [[-27,-3,-.5],[23,-6,.6],[0,-14,.1]]){c.save();c.translate(x,y);c.rotate(a+Math.sin(t*2+x)*.05);paint(c,paths.pick,'#8e998e','#c1c2ad',1.7);c.restore();}}
 else if(kind==='waterwheel'){c.save();c.translate(0,-55);c.rotate(t*.24);c.strokeStyle='#93876a';c.lineWidth=10;c.beginPath();c.arc(0,0,47,0,Math.PI*2);c.stroke();c.strokeStyle='#424d46';c.lineWidth=5;for(let j=0;j<8;j++){c.rotate(Math.PI/4);c.beginPath();c.moveTo(0,0);c.lineTo(50,0);c.stroke();}c.restore();}
 else if(kind==='stoneLantern'){paint(c,paths.lantern,'#737d72','#a0a891',2);paint(c,paths.window,'#c8c39a',null);}
 else if(kind==='hoist'){paint(c,paths.hoist,'#70624d','#aea184',2);c.strokeStyle='#a0aaa0';c.lineWidth=3;c.beginPath();c.moveTo(0,-155);c.lineTo(Math.sin(t*1.5)*10,-65);c.stroke();c.translate(Math.sin(t*1.5)*10,0);paint(c,paths.hoistWeight,'#4c5c59','#9fab99',2);}
 else{c.restore();return body.call(this,c,u,charge);}
 c.restore();
};
const terrain=S.terrain;
S.terrain=function(c,t){if(!t.honroCave&&!t.honroCeiling&&!(this.battle?.honroStage>=13&&this.battle?.honroStage<=19&&t.id==='act2-floor'))return terrain.call(this,c,t);
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
 const contested=b.units.some(u=>u.side===1&&!u.dead&&Math.hypot(u.x-m.x,u.y-m.y)<s.contestRadius);
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
  guideBadge(c,scene,hold.x,hold.y+43/z,[`${hold.who} 유지 · ${hold.progress}/${hold.rounds}턴 · ${hold.status}`,'실선: 방어 범위 / 점선: 적 진입 금지'],color);
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
