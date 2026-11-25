(function(G){'use strict';
// Act 6-8 presentation only. Reads the serializable battle record b.honroDaedosa written by the
// stage owner (warning shapes, phase, charge, shelters) and draws exactly those shapes, so the
// telegraph and the resolved hit area come from the same data. No rules or state changes here.
const S=G.HonroScene?.prototype;if(!S)return;
const INK='#0d1214',WARN='#e6c58f',DANGER='#d98a6c',SAFE='#9fd3c1';
const seen=new WeakMap();
function stamp(b,key,scene){let m=seen.get(b);if(!m)seen.set(b,m={});if(m[key]===undefined)m[key]=scene.time||0;return (scene.time||0)-m[key];}
function dash(c,z,on,off){c.setLineDash([on/z,off/z]);}
function band(c,z,m,t,col){
 const x0=m.x0,x1=m.x1,y0=m.y0,y1=m.y1,pulse=.55+.25*Math.sin(t*5);
 c.fillStyle=col;c.globalAlpha=.16*pulse+.06;c.fillRect(x0,y0,x1-x0,y1-y0);
 c.globalAlpha=.85;c.strokeStyle=col;c.lineWidth=3/z;dash(c,z,18,9);c.strokeRect(x0,y0,x1-x0,y1-y0);
 // Folded ink line: a zig-zag down the middle shows where the sight-line will fold.
 c.setLineDash([]);c.globalAlpha=.7;c.strokeStyle=INK;c.lineWidth=5/z;c.beginPath();
 const mx=(x0+x1)/2;for(let i=0;i<=8;i++){const y=y0+(y1-y0)*i/8,x=mx+((i%2)?1:-1)*(x1-x0)*.18;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
}
function zone(c,z,m,t,col){
 band(c,z,m,t,col);
 const dir=m.pull<0?-1:1,y=(m.y0+m.y1)/2+40;c.globalAlpha=.9;c.fillStyle=col;
 for(let i=0;i<3;i++){const x=m.x0+(m.x1-m.x0)*(.25+.25*i)+dir*((t*60)%40);c.beginPath();c.moveTo(x+dir*22/z*3,y);c.lineTo(x-dir*10/z*3,y-12/z*3);c.lineTo(x-dir*10/z*3,y+12/z*3);c.closePath();c.fill();}
}
function circle(c,z,m,t,col){
 const pulse=.55+.25*Math.sin(t*6);c.globalAlpha=.18*pulse+.06;c.fillStyle=col;c.beginPath();c.arc(m.x,m.y,m.r,0,Math.PI*2);c.fill();
 c.globalAlpha=.9;c.strokeStyle=col;c.lineWidth=3/z;dash(c,z,14,8);c.beginPath();c.arc(m.x,m.y,m.r,0,Math.PI*2);c.stroke();
 c.setLineDash([]);c.strokeStyle=INK;c.globalAlpha=.6;c.lineWidth=4/z;c.beginPath();c.moveTo(m.x,m.y-m.r*1.6);c.lineTo(m.x,m.y);c.stroke();
}
function label(c,z,x,y,text,col){
 c.setLineDash([]);c.globalAlpha=1;c.font=`${Math.round(15/z)}px "Noto Serif KR", serif`;c.textAlign='center';c.textBaseline='bottom';
 c.lineWidth=4/z;c.strokeStyle='rgba(8,12,14,.85)';c.strokeText(text,x,y);c.fillStyle=col;c.fillText(text,x,y);
}
function draw(c,scene,e){
 const b=e?.b,d=b?.honroDaedosa;if(!d||b.honroStage!==58)return;
 const z=Math.max(.12,scene.scale||1),t=scene.time||0;c.save();c.lineCap='round';c.lineJoin='round';
 for(const s of d.shelters||[]){c.globalAlpha=.10+.05*Math.sin(t*3);c.fillStyle=SAFE;c.fillRect(s.x0,s.y0,s.x1-s.x0,s.y1-s.y0);c.globalAlpha=.7;c.strokeStyle=SAFE;c.lineWidth=2/z;dash(c,z,8,8);c.strokeRect(s.x0,s.y0,s.x1-s.x0,s.y1-s.y0);label(c,z,(s.x0+s.x1)/2,s.y0-8/z,s.label||'그늘',SAFE);}
 const m=d.mark;
 if(m){const col=m.kind==='circle'?DANGER:WARN;
  const boss=b.units.find(v=>v.id===d.boss);
  if(m.kind==='band')band(c,z,m,t,col);else if(m.kind==='zone')zone(c,z,m,t,col);else if(m.kind==='circle'||m.kind==='swap')circle(c,z,m,t,m.kind==='swap'?WARN:col);
  else if(m.kind==='rain')for(const q of m.circles)circle(c,z,q,t,DANGER);
  else if(m.kind==='great'){c.globalAlpha=.07+.04*Math.sin(t*4);c.fillStyle=DANGER;c.fillRect(m.x0,m.y0,m.x1-m.x0,m.y1-m.y0);}
  else if(m.kind==='tether'&&boss){const u=b.units.find(v=>v.id===m.target);if(u){c.globalAlpha=.9;c.strokeStyle=INK;c.lineWidth=4/z;dash(c,z,10,6);c.beginPath();c.moveTo(boss.x,boss.y-boss.h*.6);c.quadraticCurveTo((boss.x+u.x)/2,Math.min(boss.y,u.y)-160,u.x,u.y-u.h*.5);c.stroke();c.setLineDash([]);c.strokeStyle=WARN;c.lineWidth=1.6/z;c.stroke();c.globalAlpha=.35;c.strokeStyle=WARN;c.lineWidth=2/z;dash(c,z,6,10);c.beginPath();c.arc(boss.x,boss.y-boss.h*.5,m.reach,0,Math.PI*2);c.stroke();m.x=u.x;m.y=u.y-u.h;}}
  const lx=m.kind==='rain'?m.circles[0]?.x:m.kind==='circle'||m.kind==='swap'||m.kind==='tether'?m.x:(m.x0+m.x1)/2,ly=m.kind==='rain'?m.circles[0]?.y-m.circles[0]?.r:m.kind==='circle'||m.kind==='swap'?m.y-m.r:m.kind==='tether'?m.y-20:m.kind==='great'&&boss?boss.y-boss.h-70:m.y0;
  if(Number.isFinite(lx)&&Number.isFinite(ly))label(c,z,lx,ly-10/z,m.label+(m.neutralized?' · 진목에 묶임':''),col);}
 for(const q of d.extra||[]){circle(c,z,q,t,DANGER);label(c,z,q.x,q.y-q.r-10/z,q.label,DANGER);}
 if(d.phase===3&&d.charge>0&&!d.nodeDead){const u=b.units.find(v=>v.id===d.boss);if(u)label(c,z,u.x,u.y-u.h-46/z,`저편이 가까워진다 ${d.charge}/3`,DANGER);}
 c.restore();
}
// Boss body: an ink shadow that does not sit under him (cut loose by the old seal), entrance from
// that shadow, and a final frame where shadow and body meet before both fade.
const body=S.unitBody;
S.unitBody=function(c,u,...rest){
 if(u?.honroRigAsset!=='boss_daedosa')return body.call(this,c,u,...rest);
 const b=this.actorEngine?.b,d=b?.honroDaedosa,t=this.time||0,enter=d?stamp(b,'enter',this):9;
 const off=d?.shadowOffset??-70,a=Math.min(1,enter/1.2);
 c.save();c.globalAlpha=.32*(d?.dead?0:1);c.fillStyle=INK;c.beginPath();c.ellipse(u.x+off,u.y-2,u.r*2.2,9,0,0,Math.PI*2);c.fill();
 c.globalAlpha=.18;c.beginPath();c.ellipse(u.x+off*.55,u.y-u.h*.5,u.r*.9,u.h*.48,0,0,Math.PI*2);c.fill();c.restore();
 c.save();c.globalAlpha*=a;if(d?.exposed){c.shadowColor='rgba(230,197,143,.55)';c.shadowBlur=18;}
 const out=body.call(this,c,u,...rest);c.restore();return out;
};
const unit=S.unit;
S.unit=function(c,u,...rest){
 if(u?.honroRigAsset==='boss_daedosa'&&u.dead){
  const b=this.actorEngine?.b,dt=b?stamp(b,'death',this):9;if(dt>2.4)return;
  const p=Math.min(1,dt/1.6);c.save();c.globalAlpha=(1-p)*.9;
  c.fillStyle=INK;c.beginPath();c.ellipse(u.x,u.y-2,u.r*2.2*(1-p*.4),9,0,0,Math.PI*2);c.fill();
  c.globalAlpha=(1-p)*.75;const was=u.dead;u.dead=false;try{body.call(this,c,u,0);}finally{u.dead=was;}c.restore();return;
 }
 return unit.call(this,c,u,...rest);
};
G.HonroDaedosaFx={version:1,draw};
})(globalThis);
