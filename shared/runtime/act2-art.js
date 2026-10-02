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
S.unitBody=function(c,u,charge){if(!u.honroAct2&&!u.honroSpirit)return body.call(this,c,u,charge);
 const kind=u.honroType;
 if(kind==='keeper'){body.call(this,c,u,charge);c.save();c.translate(u.x,u.y);c.scale((u.facing||1)*u.h/103,u.h/103);paint(c,paths.stole,'#9b8b69','#c0b28d',1.2);c.restore();return;}
 c.save();c.translate(u.x,u.y);c.scale((u.facing||1)*u.h/110,u.h/110);const t=this.time||0;
 if(u.honroSpirit){const viewer=this.battle?.units.find(v=>v.id===this.battle.active),visible=viewer?.spiritSight||u.manifested||u.revealSpiritToParty;c.globalAlpha*=visible?.94:.22;c.translate(0,Math.sin(t*1.7)*5);
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
 const ps=C.poly(t);c.save();c.beginPath();ps.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();const grad=c.createLinearGradient(t.x,t.y,t.x+t.w*.4,t.y+Math.min(t.h,1200));grad.addColorStop(0,t.honroCeiling?'#252a30':'#444b50');grad.addColorStop(.5,'#30373d');grad.addColorStop(1,'#161f27');c.fillStyle=grad;c.fill();c.strokeStyle=t.honroCeiling?'#737c7d':'#919d99';c.lineWidth=t.honroCeiling?2:3;c.stroke();
 // A few broad mineral planes, clipped to the physical rock mass.
 c.clip();c.globalAlpha=.17;c.fillStyle='#8b9290';c.beginPath();c.moveTo(t.x+t.w*.12,t.y);c.lineTo(t.x+t.w*.56,t.y);c.lineTo(t.x+t.w*.37,t.y+t.h*.7);c.lineTo(t.x+t.w*.21,t.y+t.h);c.closePath();c.fill();c.restore();
};
const tone=S.environmentTone;
S.environmentTone=function(c,w,h,b){tone?.call(this,c,w,h,b);if(b.honroStage<11||b.honroStage>20)return;
 c.save();c.translate(w/2,h/2);c.scale(this.scale,this.scale);c.translate(-this.x,-this.y);
 const radius=125;for(const m of b.honroMarkers||[])if(m.type==='act2-light'){
  if(Math.abs(m.x-this.x)>w/this.scale/2+radius||Math.abs(m.y-this.y)>h/this.scale/2+radius)continue;
  const q=c.createRadialGradient(m.x,m.y-50,5,m.x,m.y-50,radius);q.addColorStop(0,m.color+'45');q.addColorStop(1,m.color+'00');c.fillStyle=q;c.fillRect(m.x-radius,m.y-50-radius,radius*2,radius*2);
 }
 const target=G.HonroAct2.active(b)?G.HonroAct2.current(b):null;
 if(target){const m=b.honroMarkers.find(m=>m.id===target.id);if(m){c.strokeStyle='#d6c69c';c.lineWidth=2;c.beginPath();c.ellipse(m.x,m.y-3,32,9,0,0,Math.PI*2);c.stroke();}}
 const a=b.honroState?.act2,pulse=a?.pulseRound;if(pulse&&pulse!==this._act2Pulse){this._act2Pulse=pulse;this._act2PulseStart=this.time;}
 if(this._act2PulseStart!==undefined&&this.time-this._act2PulseStart<1.6){c.globalAlpha=Math.max(0,.12*(1-(this.time-this._act2PulseStart)/1.6));c.fillStyle='#b0c9d5';c.fillRect(this.x-w/this.scale/2,this.y-h/this.scale/2,w/this.scale,h/this.scale);}
 c.restore();
};
G.HonroAct2Art={paths};
})(globalThis);
