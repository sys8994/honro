(function(G){'use strict';
const S=G.HonroScene.prototype,event=S.event,render=S.render,body=S.unitBody;
// One retained number per target and attack; projectile children retain shot IDs.
// This is presentation state, never battle state or a replayed save reward.
S.event=function(ev){
 if(ev.type==='fx'&&ev.damage>0&&ev.targetId&&ev.attackId){
  this.damageNumbers??=new Map();const key=ev.attackId+':'+ev.targetId,old=this.damageNumbers.get(key);
  this.damageNumbers.set(key,{...ev,total:(old?.total||0)+ev.damage,critical:!!(old?.critical||ev.critical),updated:this.time||0});
  if(this.damageNumbers.size>64)this.damageNumbers.delete(this.damageNumbers.keys().next().value);return;
 }return event.call(this,ev);
};
S.unitBody=function(c,u,charge=0){if(!u.elite||u.side!==1)return body.call(this,c,u,charge);
 c.save();c.translate(u.x,u.y);c.scale(1.12,1.12);c.translate(-u.x,-u.y);body.call(this,c,u,charge);c.restore();
};
S.render=function(e,...args){const out=render.call(this,e,...args),{w,h,d}=this.size(),c=this.ctx;
 c.save();c.setTransform(d,0,0,d,0,0);c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
 const top=document.querySelector?.('.battle-head')?.getBoundingClientRect?.().bottom||80;
 for(const f of this.damageNumbers?.values()||[]){const age=(this.time||0)-f.updated;if(age>1.5)continue;
  const u=e.unit(f.targetId),wx=u?.x??f.x,wy=u?u.y-u.h*(u.elite?1.12:1)-20:f.y,x=(wx-this.x)*this.scale+w/2,y=(wy-this.y)*this.scale+h/2-9-Math.min(22,age*20);
  if(x<-60||x>w+60||y<top-30||y>h+50)continue;
  c.save();c.translate(x,y);const bump=1+.14*Math.max(0,1-age/.16);c.scale(bump,bump);c.globalAlpha=Math.min(1,(1.5-age)/.4);
  c.font=(f.critical?'900 24':'800 20')+'px "Malgun Gothic",system-ui';c.strokeStyle='#102025';c.lineWidth=3;c.strokeText(String(Math.round(f.total)),0,0);c.fillStyle=f.critical?'#f5cd76':f.color;c.fillText(String(Math.round(f.total)),0,0);
  if(f.critical){c.font='700 9px "Malgun Gothic",system-ui';c.fillText('치명',0,-18);}c.restore();
 }
 c.restore();return out;
};
G.HonroCombatFeedback={attackKey:ev=>ev.attackId+':'+ev.targetId};
})(globalThis);
