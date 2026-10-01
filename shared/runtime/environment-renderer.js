(function(G){'use strict';
const Scene=G.HonroScene,E=G.HonroEnvironment,A=G.HonroEnvironmentArt,prepared=new WeakMap(),battleEnvironments=new WeakMap();
function polygon(points,close=true,soft=false){const p=new Path2D();if(soft){const first=points[0],last=points.at(-1);p.moveTo((last.x+first.x)/2,(last.y+first.y)/2);points.forEach((v,i)=>{const next=points[(i+1)%points.length];p.quadraticCurveTo(v.x,v.y,(v.x+next.x)/2,(v.y+next.y)/2);});}else points.forEach((v,i)=>i?p.lineTo(v.x,v.y):p.moveTo(v.x,v.y));if(close)p.closePath();return p;}
function prepare(env){
 if(prepared.has(env))return prepared.get(env);
 const groups=env.groups.map(group=>({group,surfaces:env.surfaces.filter(s=>s.groupId===group.id).map(s=>{
  const points=[...s.points,{x:s.points.at(-1).x,y:s.bottom},{x:s.points[0].x,y:s.bottom}];
  const planes=[];for(let i=1;i<s.points.length-1;i+=3){const p=s.points[i],next=s.points[i+1],span=next.x-p.x;planes.push(polygon([p,next,{x:p.x+span*.35,y:p.y+Math.min(1200,span*.8)}]));}
  return{...s,path:polygon(points),edge:polygon(s.points,false),planes,top:Math.min(...s.points.map(p=>p.y))};
 }),children:env.placements.filter(e=>e.groupId===group.id&&e.asset).map(e=>({...e,role:E.assetRole(e.asset),paths:(e.asset.visual||[]).map(s=>({...s,path:polygon(s.points,s.closed!==false,e.asset.id==='env:forest')}))}))}));
 groups.sort((a,b)=>E.depth({environment:env},b.group.depthLayer)-E.depth({environment:env},a.group.depthLayer));
 const data={groups,paths:groups.reduce((n,g)=>n+g.surfaces.reduce((m,s)=>m+2+s.planes.length,0)+g.children.reduce((m,e)=>m+e.paths.length,0),0)};prepared.set(env,data);return data;
}
function sky(c,w,h,st,a){c.fillStyle=A.gradient(c,0,0,0,h,[[0,a.skyTop],[.58,E.mixColor(a.skyTop,a.skyBottom,.67)],[1,a.skyBottom]]);c.fillRect(0,0,w,h);
 if(!E.preset(st).sky||st.environment.skyVisible===false)return;
 const [u,v]=a.keyLightDirection,x=w*u,y=h*v,r=Math.min(w,h)*.031;
 A.glow(c,x,y,r*8,r*8,a.glowColor,.20);c.fillStyle=A.color(a.keyLightColor,.65);c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
 A.fog(c,w*.30,h*.19,w*.65,h*.16,a.farFogColor,.22);
 A.fog(c,w*.81,h*.31,w*.62,h*.12,a.hazeColor,.18);
}
function surface(c,s,g,a){const f=E.FINISH[g.depthLayer],far=E.mixColor(a.shadowTint,a.hazeColor,f.haze*a.hazeStrength),lit=E.mixColor(far,a.ambientTint,.35),top=s.top;
 c.fillStyle=A.gradient(c,0,top,0,Math.max(1400,top+2000),[[0,lit],[.48,far],[1,E.mixColor(far,a.shadowTint,.34)]]);c.fill(s.path);
 // Major geological planes are cues inside the drawing, never camera pitch.
 c.save();c.clip(s.path);c.fillStyle=A.color(E.mixColor(lit,a.keyLightColor,.18),g.depthLayer==='L4'?.20:.25);for(const plane of s.planes)c.fill(plane);c.restore();
 c.strokeStyle=A.color(E.mixColor(lit,a.keyLightColor,.26),.40);c.lineWidth=g.depthLayer==='L2'?3:5;c.stroke(s.edge);
}
function child(c,e,g,st,view,w,h,a,time){const r=e.asset.reference,box=E.screenBounds(e.asset,e,view,w,h,st);if(box.x>w+60||box.x+box.w<-60||box.y>h+60||box.y+box.h<-60)return false;
 const sf=E.supportOf(st,e),y=(sf?E.surfaceY(sf,e.x):0)+e.y,scale=E.WORLD_UNITS_PER_METER*r.heightM/r.bounds.h*e.scale;
 c.save();c.translate(e.x,y);c.rotate(e.rotation||0);c.scale(scale,scale);c.translate(-r.foot.x,-r.foot.y);
 if(e.asset.renderer==='landmark'){c.globalAlpha*=1-E.FINISH[g.depthLayer].haze*.55;G.HonroElements.nativeLandmark.call(view,c,{...e,kind:e.asset.kind,x:0,y:0,size:1});}
 else if(e.role.role==='waterfall')A.waterfall(c,0,0,110,540,a,time);
 else {const fade=E.FINISH[g.depthLayer].haze*a.hazeStrength;for(const shape of e.paths){c.save();c.globalAlpha*=shape.alpha??1;if(shape.fill){const base=E.mixColor(shape.fill.slice(0,7),a.ambientTint,.19),dark=E.mixColor(base,a.hazeColor,fade),lit=E.mixColor(dark,a.keyLightColor,(1-fade)*.10);c.fillStyle=A.gradient(c,0,r.bounds.y,0,r.bounds.y+r.bounds.h,[[0,lit],[.65,dark],[1,E.mixColor(dark,a.shadowTint,.16)]]);c.fill(shape.path);}if(shape.stroke&&g.depthLayer==='L2'){c.strokeStyle=E.mixColor(shape.stroke.slice(0,7),a.hazeColor,fade+.15);c.lineWidth=shape.lineWidth||1;c.stroke(shape.path);}c.restore();}}
 if(e.role.role==='light')A.glow(c,0,-40,65,90,a.glowColor,.22+.025*Math.sin(time*.8));
 c.restore();return true;
}
function ensureBattle(b){if(b.honroEnvironment?.version===E.VERSION)return b.honroEnvironment;
 // Derive old-save/training scenery without mutating serialized battle state.
 const prior=battleEnvironments.get(b),key=[b.width,b.height,b.honroBackdrop,b.honroStage].join(':');
 if(prior&&prior.source===b.honroEnvironment&&prior.key===key)return prior.environment;
 const env=b.honroEnvironment,library=G.HONRO_PROJECT.library.map(a=>({...a}));
 for(const e of env?.placements||[])if(e.asset&&!library.some(a=>a.id===e.assetId))library.push(e.asset);
 const st={id:b.honroAuthoredId||'saved-stage',width:b.width,height:b.height,backdrop:b.honroBackdrop||'forest',metadata:{stageId:b.honroStage||1},environment:env,elements:[]},p={library,stages:[st]};E.upgradeComposition(p);
 const environment={...st.environment,placements:st.environment.placements.map(e=>({...e,asset:p.library.find(a=>a.id===e.assetId)}))};
 battleEnvironments.set(b,{source:b.honroEnvironment,key,environment});return environment;
}
Scene.prototype.background=function(c,w,h,b){const env=ensureBattle(b),st={width:b.width,height:b.height,backdrop:b.honroBackdrop,environment:env},a=E.atmosphereAt(st,this.y),data=prepare(env),time=A.time(this);sky(c,w,h,st,a);
 let visible=0,active=0,animated=1;
 for(const unit of data.groups){const g=unit.group;if(env.hiddenLayers?.includes(g.depthLayer))continue;const tr=E.groupTransform(this,w,h,st,g);if(tr.opacity<=.001)continue;active++;
  const z=env.zones.find(z=>z.id===g.zoneId),local=E.atmosphere(st,z);
  c.save();c.globalAlpha=tr.opacity;c.translate(tr.x,tr.y);c.scale(tr.scale,tr.scale);
  for(const s of unit.surfaces)surface(c,s,g,local);
  for(const e of unit.children)if(child(c,e,g,st,this,w,h,local,time)){visible++;animated+=e.role.role==='waterfall'?10:e.role.role==='light'?1:0;}
  // Local mist shares the parent's X/Y/zoom transform, including camera pans.
  if(g.depthLayer==='L3'&&unit.surfaces[0])for(const fraction of [.28,.72]){const x=st.width*fraction,y=E.surfaceY(unit.surfaces[0],x)+90;A.fog(c,x,y,Math.max(2400,st.width*.75),440,local.farFogColor,local.mistStrength,time,local.mistSpeed);animated++;}
  c.restore();
 }
 const [lx,ly]=a.keyLightDirection;A.shaft(c,w*lx,h*ly,w*.23,h*.80,a.keyLightColor,a.lightStrength,time);
 if(env.skyVisible===false)A.glow(c,w*lx,h*ly,w*.14,h*.24,a.glowColor,.13);
 this.environmentStats={groups:active,visibleAssets:visible,cachedPaths:data.paths,backgroundAnimatedPrimitives:animated,animatedPrimitives:animated,...A.stats()};
};
Scene.prototype.liveWater=function(c,b){const st={backdrop:b.honroBackdrop,environment:ensureBattle(b)},a=E.atmosphereAt(st,this.y),time=A.time(this),halfW=this.canvas.clientWidth/this.scale/2,halfH=this.canvas.clientHeight/this.scale/2;
 const visible=(x,y,w,h)=>x+w>this.x-halfW&&x<this.x+halfW&&y+h>this.y-halfH&&y<this.y+halfH;
 let pools=0,falls=0;
 for(const z of b.honroSurfaceZones||[])if(['water-pool','shallow-water'].includes(z.kind)&&z.points?.length){const q=A.poolData(z);if(!visible(q.left,q.top,q.right-q.left,q.bottom-q.top))continue;A.pool(c,z,a,time);pools++;
  const key=b.session+':'+z.id;if(!this._waterContacts||this._waterContactSession!==b.session){this._waterContacts=new Map();this._waterRipples=[];this._waterContactSession=b.session;}
  for(const u of b.units||[]){if(u.dead)continue;const id=key+':'+u.id,touch=u.x>=q.left&&u.x<=q.right&&u.y>=q.top-3&&u.y<q.top+85;if(this._waterContacts.get(id)===false&&touch)this._waterRipples.push({x:u.x,y:q.top,born:time});this._waterContacts.set(id,touch);}
 }
 for(const l of b.honroLandmarks||[])if(l.kind==='waterfall'){const scale=l.size||1,h=l.drop||196*scale;if(!visible(l.x-100*scale,l.y-h,200*scale,h+100))continue;A.waterfall(c,l.x,l.y-h,90*scale,h,a,time);falls++;}
 this._waterRipples=(this._waterRipples||[]).filter(r=>time-r.born<1.25).slice(-12);
 for(const r of this._waterRipples){const age=time-r.born;c.save();c.globalAlpha*=Math.max(0,.5-age*.4);c.strokeStyle=a.waterfallFoamColor;c.lineWidth=2;c.beginPath();c.ellipse(r.x,r.y+4,12+age*53,3+age*4,0,0,Math.PI*2);c.stroke();c.restore();}
 if(this.environmentStats)Object.assign(this.environmentStats,{pools,waterfalls:falls,animatedPrimitives:this.environmentStats.backgroundAnimatedPrimitives+pools*5+falls*10+this._waterRipples.length});
};
G.HonroEnvironmentRenderer={ensureBattle,prepare};
})(globalThis);
