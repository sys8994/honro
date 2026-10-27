(function(G){'use strict';
// Reuse the existing guard's vector rig and clips; remove flesh from the old
// armour only. The current dead guard keeps its face and current insignia.
const V=G.HonroAct23V4,S=G.HonroAct23V4Chapter21,P=G.HonroScene.prototype,clone=x=>JSON.parse(JSON.stringify(x));
const original=G.HONRO_MONSTERS?.assets?.possessedGuard;if(!original)return;
const a=clone(original);a.id='v4.gate-empty-armor';a.palette={...a.palette,cloth:'#655948',clothLight:'#968265',bone:'#727b70',boneShade:'#3d4945'};
const head=a.parts.find(p=>p.id==='head');head.paths=[{d:'M-11 -108 Q0 -115 11 -107 L12 -94 5 -86 -6 -88 -12 -98Z',fill:'ink',stroke:'metal',width:1.6,lod:0}];
const torso=a.parts.find(p=>p.id==='torso');torso.paths.push({d:'M-9 -91 Q0 -95 10 -89 L7 -78 -7 -79Z',fill:'ink',width:0,lod:0});
// The same retained diamond is used by the later old banner. It is separate
// from the current guard's blue horizontal insignia and all village tags.
torso.paths.push({d:'M-4 -78 L3 -86 10 -78 3 -70Z M3 -82 L7 -78 3 -74 -1 -78Z',fill:'metalLight',stroke:'ink',width:1,lod:0});
const spearArmor=clone(a);spearArmor.id='v4.han-empty-spear';spearArmor.parts.find(p=>p.id==='weapon').paths=[];
const visual=G.HonroVectorParts.create({[a.id]:a,[spearArmor.id]:spearArmor}),body=P.unitBody;
P.unitBody=function(c,u,...args){if(!G.HonroAct23V4Chapter21Reviewed?.enabled()&&!(G.HonroAct23V4Chapter29Reviewed?.active(this.battle)&&u.honroV4ArmorIdentity==='old-empty'))return body.call(this,c,u,...args);if(u.id==='v4.gate-cart')return;if(u.honroV4Injured){body.call(this,c,u,...args);c.save();c.strokeStyle='#c3b99a';c.lineWidth=6;c.beginPath();c.moveTo(u.x-17,u.y-u.h*.62);c.lineTo(u.x+18,u.y-u.h*.72);c.stroke();c.restore();return;}if(!u.honroV4ArmorIdentity)return body.call(this,c,u,...args);
 if(u.honroV4ArmorIdentity==='current-dead'){body.call(this,c,u,...args);c.save();c.translate(u.x,u.y-u.h*.7);c.fillStyle='#8aa6b3';c.fillRect(-8,-3,16,5);c.restore();return;}
 c.save();c.translate(u.x,u.y);const rig=G.HonroAct23V4Chapter29Spear?.equipped(this.battle,u)?spearArmor:a,scale=u.h/rig.baseHeight;c.scale(scale*(u.facing||1),scale);visual.draw(c,rig.id,{time:this.time||0,state:u.dead?{}:visual.state(u),pixels:u.h*(this.scale||1)});c.restore();
};
const plugin=V.plugins.get(21);V.register(21,{...plugin,draw(scene,c,b,e){plugin.draw?.(scene,c,b,e);if(!S.active(b))return;const q=S.memory(b),cart=b.units.find(u=>u.id==='v4.gate-cart');if(cart){const stopped=S.cartStopped(b);c.save();c.translate(cart.x,cart.y);c.fillStyle='#6e5840';c.strokeStyle='#b09a73';c.lineWidth=3;c.fillRect(-84,-78,168,37);c.strokeRect(-84,-78,168,37);for(const x of[-58,58]){c.save();c.translate(x,-26);c.rotate(stopped?q.wheel:Math.sin(q.wheel)*.24);c.beginPath();c.arc(0,0,26,0,Math.PI*2);c.stroke();for(let i=0;i<4;i++){c.rotate(Math.PI/4);c.beginPath();c.moveTo(-25,0);c.lineTo(25,0);c.stroke();}c.restore();}c.restore();}
 if(q.wreck){c.save();scene.unitBody(c,{...b.units.find(u=>u.id===q.wreck.id),...q.wreck,dead:true,hp:0},0);c.restore();}

}});
G.HonroAct23V4Chapter21Art={asset:a,emblem:'old-sealed-diamond'};
})(globalThis);
