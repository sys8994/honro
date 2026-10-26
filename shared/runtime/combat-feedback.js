(function(G){'use strict';
const S=G.HonroScene.prototype,event=S.event,render=S.render,body=S.unitBody;
// One retained number per target and attack; projectile children retain shot IDs.
// This is presentation state, never battle state or a replayed save reward.
S.event=function(ev){
 if(ev.type==='level'&&ev.targetId&&ev.value>ev.previousLevel){
  this.levelUps??=new Map();const old=this.levelUps.get(ev.targetId);
  this.levelUps.set(ev.targetId,{before:old?Math.min(old.before,ev.previousLevel):ev.previousLevel,after:ev.value,age:0});
  return;
 }
 if(ev.type==='fx'&&ev.damage>0&&ev.targetId)this.settledHits?.delete(ev.targetId);
 if(ev.type==='fx'&&ev.damage>0&&ev.targetId&&ev.attackId){
  this.damageNumbers??=new Map();const key=ev.attackId+':'+ev.targetId,old=this.damageNumbers.get(key);
  this.damageNumbers.set(key,{...ev,total:(old?.total||0)+ev.damage,critical:!!(old?.critical||ev.critical),updated:this.time||0});
  if(this.damageNumbers.size>64)this.damageNumbers.delete(this.damageNumbers.keys().next().value);return;
 }return event.call(this,ev);
};
// Finish already-emitted hit feedback at a pause boundary without touching the
// serialized simulation. Projectiles, zones, pending attacks and warning FX stay.
S.settleHitFeedback=function(e,paused){
 this.settledHits??=new Map();
 // Expired summons can leave b.units before their hurt timer finishes. The
 // presentation map must not keep their removed unit objects alive.
 if(this.settledHits.size)for(const[id,hit]of this.settledHits)if(!e.b.units.includes(hit.unit))this.settledHits.delete(id);
 for(const u of e.b.units||[]){
  const old=this.settledHits.get(u.id);
  if(!(u.hurt>0)||old&&(old.unit!==u||u.hurt>old.hurt||u.hp<old.hp))this.settledHits.delete(u.id);
  if(paused&&u.hurt>0)this.settledHits.set(u.id,{unit:u,hurt:u.hurt,hp:u.hp});
  else if(this.settledHits.has(u.id))this.settledHits.get(u.id).hurt=u.hurt;
 }
 if(!paused)return;
 this.damageNumbers?.clear();
 const finished=f=>['swordCut','slash','inkLine','inkImpact'].includes(f.kind||f.name)||
  (f.kind||f.name)==='text'&&/^(?:치명! )?−?\d+$/.test(f.text||'');
 if(this.arcFx)this.arcFx.fxs=this.arcFx.fxs.filter(f=>!finished(f));
 this.effects=this.effects.filter(f=>!finished(f));
};
S.hitFlashVisible=function(u){return u.hurt>0&&!this.settledHits?.has(u.id);};
S.unitBody=function(c,u,charge=0){if(!u.elite||u.side!==1)return body.call(this,c,u,charge);
 c.save();c.translate(u.x,u.y);c.scale(1.12,1.12);c.translate(-u.x,-u.y);body.call(this,c,u,charge);c.restore();
};
// A brief ink seal and gilt/jade breath around the actual actor. Screen-space
// lettering stays legible at tactical zoom; this transient map is never saved.
S.drawLevelUps=function(e,dt){
 if(!this.levelUps?.size)return;
 const {w,h,d}=this.size(),c=this.ctx,reduced=G.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const header=document.querySelector?.('.battle-head')?.getBoundingClientRect?.().bottom||68;
 c.save();c.setTransform(d,0,0,d,0,0);c.lineJoin='round';
 for(const[id,f]of this.levelUps){
  f.age+=Math.max(0,dt);const u=e.unit(id);
  if(!u||u.dead||u.hp<=0||f.age>=1.35){this.levelUps.delete(id);continue;}
  const t=f.age/1.35,x=(u.x-this.x)*this.scale+w/2,y=(u.y-u.h*.48-this.y)*this.scale+h/2;
  if(x<-60||x>w+60||y<-80||y>h+80)continue;
  c.save();c.globalAlpha=Math.min(1,f.age/.09,(1.35-f.age)/.28);
  const r=Math.max(28,Math.min(52,u.h*this.scale*.6))+(reduced?0:Math.min(1,t*3)*13);
  c.strokeStyle='#131d20';c.lineWidth=7;c.beginPath();c.ellipse(x,y,r*.72,r,0,0,Math.PI*2);c.stroke();
  c.strokeStyle='#dbc28c';c.lineWidth=2;c.stroke();
  c.strokeStyle='#a6c4b5';c.lineWidth=1.5;c.beginPath();c.ellipse(x,y+u.h*this.scale*.45,r,Math.max(7,r*.2),0,0,Math.PI*2);c.stroke();
  // Four rising seal strokes echo a Korean talisman without filling the actor.
  for(const sign of[-1,1])for(const side of[-1,1]){const xx=x+sign*r*.55,yy=y+side*r*.58-(reduced?0:t*12);c.beginPath();c.moveTo(xx-sign*5,yy-7);c.lineTo(xx,yy-3);c.lineTo(xx-sign*4,yy+3);c.lineTo(xx+sign*3,yy+7);c.stroke();}
  const labelX=Math.max(96,Math.min(w-96,x)),labelY=Math.max(header+26,Math.min(h-90,y-r-16))-(reduced?0:Math.min(8,t*10));
  const count=f.after-f.before,label=`레벨업 · 경지 ${f.before} → ${f.after}${count>1?' (+'+count+')':''}`;
  c.font='800 17px "Noto Sans KR","Malgun Gothic",system-ui';c.textAlign='center';c.textBaseline='middle';c.strokeStyle='#101a1e';c.lineWidth=5;c.strokeText(label,labelX,labelY);c.fillStyle='#f5dfaa';c.fillText(label,labelX,labelY);
  c.font='600 11px "Noto Sans KR","Malgun Gothic",system-ui';c.strokeText('체력 · 기력 회복',labelX,labelY+20);c.fillStyle='#c4d8cb';c.fillText('체력 · 기력 회복',labelX,labelY+20);
  c.restore();
 }
 c.restore();
};
S.render=function(e,...args){const out=render.call(this,e,...args);
 this.drawLevelUps(e,args[4]??args[0]??0);
 if(!this.damageNumbers?.size)return out;
 for(const [key,f]of this.damageNumbers)if((this.time||0)-f.updated>1.5)this.damageNumbers.delete(key);
 if(!this.damageNumbers.size)return out;
 const {w,h,d}=this.size(),c=this.ctx;
 c.save();c.setTransform(d,0,0,d,0,0);c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
 const top=document.querySelector?.('.battle-head')?.getBoundingClientRect?.().bottom||80;
 for(const f of this.damageNumbers?.values()||[]){const age=(this.time||0)-f.updated;if(age>1.5)continue;
  const u=e.unit(f.targetId);if(u?.eaterCapturedBy)continue;const wx=u?.x??f.x,wy=u?u.y-u.h*(u.elite?1.12:1)-20:f.y,x=(wx-this.x)*this.scale+w/2,y=(wy-this.y)*this.scale+h/2-9-Math.min(22,age*20);
  if(x<-60||x>w+60||y<top-30||y>h+50)continue;
  c.save();c.translate(x,y);const bump=1+.14*Math.max(0,1-age/.16);c.scale(bump,bump);c.globalAlpha=Math.min(1,(1.5-age)/.4);
  c.font=(f.critical?'900 24':'800 20')+'px "Malgun Gothic",system-ui';c.strokeStyle='#102025';c.lineWidth=3;c.strokeText(String(Math.round(f.total)),0,0);c.fillStyle=f.critical?'#f5cd76':f.color;c.fillText(String(Math.round(f.total)),0,0);
  if(f.critical){c.font='700 9px "Malgun Gothic",system-ui';c.fillText('치명',0,-18);}c.restore();
 }
 c.restore();return out;
};
G.HonroCombatFeedback={attackKey:ev=>ev.attackId+':'+ev.targetId};
})(globalThis);
