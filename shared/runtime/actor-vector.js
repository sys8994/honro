(function(G){'use strict';
const V=G.HonroVectorParts.create(G.HONRO_ACTORS?.assets||{}),S=G.HonroScene.prototype;
// Team overrides in authored maps must preserve a creature's species.
function monsterKind(u){if(!u||u.side!==2||u.boss||u.summoned||G.resolveRebuildCharacter?.(u))return null;const id=u.honroType==='beast'?(u.honroVariant||'stag'):u.honroType;return G.HonroMonsterVisual.assets[id]?id:null;}
function kind(u){
 if(!u)return null;
 // Summons share occultist class with Sodan, but must never resolve to her portrait.
 if(u.summoned)return V.assets['summon_'+(u.summonKind||'stalker')]?'summon_'+(u.summonKind||'stalker'):null;
 if(G.resolveRebuildCharacter?.(u))return null;
 if(u.honroType==='bier')return u.side===1||u.id==='boss'?'bier_boss':'bier';
 if(u.honroType==='gate')return'gate';
 if(u.honroType==='civilian'&&u.name==='부상자 운반대')return'stretcher';
 if(u.boss)return'colossus';
 if(u.id==='npc-woodcutter'||u.name==='나무꾼')return'woodcutter';
 if(u.honroCivilian&&(String(u.id).startsWith('resident-')||u.honroType==='civilian'))return'civilian';
 if(monsterKind(u))return null;
 if(u.honroAlly||u.allyRole){const id='ally_'+(u.allyRole||'guard');return V.assets[id]?id:'ally_guard';}
 return null;
}
function state(u,engine){
 const q=engine?.b.honroState?.allyQueue,active=q?.ids[q.index]===u.id;
 const st=V.state(u);
 if(active&&q.phase==='after'&&q.started)st.attack=Math.min(1,q.elapsed/.6);
 if(u.airborne||u.jumping)st.jump=u.vy<0?.35:.7;
 if(u.summoned)st.move=(u.moving||0)>.01;
 return st;
}
const previous=S.unitBody,render=S.render;
S.render=function(engine,...args){this.actorEngine=engine;return render.call(this,engine,...args);};
S.unitBody=function(c,u,charge=0){const actor=kind(u),id=actor||monsterKind(u);if(!id)return previous.call(this,c,u,charge);const visual=actor?V:G.HonroMonsterVisual,a=visual.assets[id],scale=u.h/a.baseHeight;c.save();c.translate(u.x,u.y);c.scale(scale*(u.facing||1),scale);const m=c.getTransform(),ratio=c.canvas.clientWidth?c.canvas.width/c.canvas.clientWidth:1,pixels=a.baseHeight*Math.hypot(m.c,m.d)/ratio;visual.draw(c,id,{time:this.time||0,state:actor?state(u,this.actorEngine):visual.state(u),pixels});c.restore();};
G.HonroActorVisual={...V,kind,monsterKind,state,legacyBody:previous};
})(globalThis);
