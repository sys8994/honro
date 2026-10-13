(function(G){'use strict';
const V=G.HonroVectorParts.create(G.HONRO_ACTORS?.assets||{}),S=G.HonroScene.prototype;
// Team overrides in authored maps must preserve a creature's species.
function monsterKind(u){if(!u||u.side!==2||u.boss||u.summoned||G.resolveRebuildCharacter?.(u))return null;return G.HonroMonsterVisual.species(u);}
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
 if(u.summonKind==='eater'&&(u.eaterSwallow||0)>0)st.attack=Math.max(0,Math.min(1,1-u.eaterSwallow/.9));
 const p=u.honroScenePose;if(p){st.move=p.kind==='move';st.attack=['point','guard','hold-bell'].includes(p.kind)?.16*Math.min(1,p.time/.4):undefined;st.hit=p.kind==='recoil'?.25:undefined;st.jump=['kneel','bow','inspect'].includes(p.kind)?.42:undefined;return st;}
 if(active&&q.phase==='after'&&q.started)st.attack=Math.min(1,q.elapsed/.6);
 if(u.airborne||u.jumping)st.jump=u.vy<0?.35:.7;
 if(u.summoned)st.move=(u.moving||0)>.01;
 return st;
}
const previous=S.unitBody,render=S.render,unit=S.unit,event=S.event;
S.event=function(ev){if(ev.type==='fx'&&ev.name==='eaterRelease'){this.eaterReleaseFx??=[];this.eaterReleaseFx.push({...ev,start:this.time||0});return;}return event.call(this,ev);};
S.unit=function(c,u,...args){if(u.eaterCapturedBy)return;return unit.call(this,c,u,...args);};
S.render=function(engine,...args){this.actorEngine=engine;return render.call(this,engine,...args);};
S.unitBody=function(c,u,charge=0){if(u.eaterCapturedBy)return;const actor=kind(u),id=actor||monsterKind(u);if(!id)return previous.call(this,c,u,charge);const visual=actor?V:G.HonroMonsterVisual,a=visual.assets[id],scale=u.h/a.baseHeight;c.save();c.translate(u.x,u.y);c.scale(scale*(u.facing||1),scale);const m=c.getTransform(),ratio=c.canvas.clientWidth?c.canvas.width/c.canvas.clientWidth:1,pixels=a.baseHeight*Math.hypot(m.c,m.d)/ratio;visual.draw(c,id,{time:this.time||0,state:actor?state(u,this.actorEngine):visual.state(u),pixels});if(u.summonKind==='eater'&&(u.eaterCaptureCount||0)>0){const n=Math.min(3,u.eaterCaptureCount);c.save();c.globalAlpha=.42;for(let i=0;i<n;i++){const x=(i-(n-1)/2)*6,y=-61+Math.sin((this.time||0)*2+i)*2;c.fillStyle='#9dac98';c.beginPath();c.ellipse(x,y,1.6,3,0,0,Math.PI*2);c.fill();}c.restore();}c.restore();};
G.HonroActorVisual={...V,kind,monsterKind,state,legacyBody:previous};
})(globalThis);
