(function(G){'use strict';
// The same retained vector renderer serves game, Stage View, portraits and the art lab.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function create(assets){const cache=new Map();
function sample(keys,t){if(t<=keys[0][0])return keys[0][1];for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){const a=keys[i-1],b=keys[i],f=(t-a[0])/(b[0]-a[0]),s=f*f*(3-2*f);return a[1]+(b[1]-a[1])*s;}return keys.at(-1)[1];}
function compile(id){if(cache.has(id))return cache.get(id);const a=assets[id],byId=new Map(a.parts.map(p=>[p.id,p]));const parts=a.parts.map(p=>{const chain=[];let q=p;while(q){chain.unshift(q);q=byId.get(q.parent);}return{...p,chain,paths:p.paths.map(v=>({...v,path:new Path2D(v.d)}))};});const value={asset:a,parts};cache.set(id,value);return value;}
function pose(a,time,state={}){
 const result=Object.fromEntries(a.parts.map(p=>[p.id,{x:0,y:0,rotate:0,scaleX:1,scaleY:1}]));
 function apply(name,t,weight=1){const clip=a.clips[name];if(!clip||weight<=0)return;for(const tr of clip.tracks){const value=sample(tr.keys,t),p=result[tr.part];if(tr.channel.startsWith('scale'))p[tr.channel]*=1+(value-1)*weight;else p[tr.channel]+=value*weight;}}
 apply('idle',((time%a.clips.idle.duration)+a.clips.idle.duration)%a.clips.idle.duration/a.clips.idle.duration);
 if(state.move)apply('move',((time%a.clips.move.duration)+a.clips.move.duration)%a.clips.move.duration/a.clips.move.duration);
 if(state.attack!==undefined)apply('attack',clamp(state.attack,0,1));
 if(state.hit!==undefined)apply('hit',clamp(state.hit,0,1));
 if(state.jump!==undefined)apply('jump_fall',clamp(state.jump,0,1));
 // Keep the existing enemy archer's aim response; the hand and bow share this joint.
 if(a.id==='human'&&Number.isFinite(state.aim))result['front-arm'].rotate-=(state.aim<90?state.aim:180-state.aim)*.72;
 if(a.aimPart&&Number.isFinite(state.aim))result[a.aimPart].rotate-=(state.aim<90?state.aim:180-state.aim)*(a.aimScale||.45);
 return result;
}
function state(u){return{move:(u.moving||0)>.01&&!u.airborne&&!u.jumping,attack:u.anim>.44?clamp((1-u.anim)/.56,0,1):undefined,hit:u.hurt>.4?clamp((.7-u.hurt)/.3,0,1):undefined,aim:u.angle};}
function draw(c,id,{time=0,state:st={},pixels=128,mode='paint',detail}={}){
 const q=compile(id),a=q.asset,poses=pose(a,time,st),lod=detail??(pixels>=120?2:pixels>=48?1:0);
 for(const p of q.parts){c.save();for(const joint of p.chain){const v=poses[joint.id],[x,y]=joint.pivot;c.translate(x+v.x,y+v.y);c.rotate(v.rotate*Math.PI/180);c.scale(v.scaleX,v.scaleY);c.translate(-x,-y);}
  for(const v of p.paths){if(v.lod>lod)continue;c.lineWidth=v.width;c.lineJoin='round';c.lineCap='round';
   if(mode==='wire'){c.strokeStyle=v.lod===0?'#e3c98f':v.lod===1?'#8fbfaf':'#677c90';c.lineWidth=.3;c.stroke(v.path);continue;}
   if(v.fill){c.fillStyle=mode==='silhouette'?'#ddd7c1':a.palette[v.fill];c.fill(v.path);}
   if(v.stroke&&(mode!=='silhouette'||v.lod===0)){c.strokeStyle=mode==='silhouette'?'#ddd7c1':a.palette[v.stroke];c.stroke(v.path);}
  }c.restore();
 }
 return{lod,parts:q.parts.length};
}
return{draw,pose,state,assets,cacheSize:()=>cache.size};}
G.HonroVectorParts={create};
const api=create(G.HONRO_MONSTERS?.assets||{}),{assets,draw,state}=api;
function kind(u){if(u.side!==1||u.boss||u.honroFinalBoss||u.id==='boss'||u.summoned)return null;const id=u.honroType==='beast'?(u.honroVariant||'stag'):u.honroType;return assets[id]?id:null;}
const previous=G.HonroScene.prototype.unitBody;
G.HonroScene.prototype.unitBody=function(c,u,charge=0){const id=kind(u);if(!id)return previous.call(this,c,u,charge);const a=assets[id],scale=u.h/a.baseHeight;c.save();c.translate(u.x,u.y);c.scale(scale*(u.facing||1),scale);const m=c.getTransform(),ratio=c.canvas.clientWidth?c.canvas.width/c.canvas.clientWidth:1,pixels=a.baseHeight*Math.hypot(m.c,m.d)/ratio;draw(c,id,{time:this.time||0,state:state(u),pixels});c.restore();};
G.HonroMonsterVisual={...api,kind,legacyBody:previous};
})(globalThis);
