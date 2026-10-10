(function(G){'use strict';
const Scene=G.HonroScene,E=G.HonroEnvironment,A=G.HonroEnvironmentArt,prepared=new WeakMap(),battleEnvironments=new WeakMap();
const act1Images={},act1Tones=new Map();
if(typeof Image!=='undefined')for(const [key,src] of Object.entries(G.HONRO_ACT1_FAR_DATA||{})){const img=new Image();img.src=src;act1Images[key]=img;}
const imageReady=img=>!!(img?.complete&&img.naturalWidth),act1ImageFor=stage=>act1Images[E.campaignMood(stage)?.variant];
const act1Ready=stage=>stage===undefined?['mountains','gorge','dawn'].every(k=>imageReady(act1Images[k])):imageReady(act1ImageFor(stage));
function tonedBackdrop(stage){const mood=E.campaignMood(stage),key=mood.variant;if(act1Tones.has(key))return act1Tones.get(key);
 const img=act1Images[key],cv=document.createElement('canvas'),tone=E.ACT1_FAR;cv.width=img.naturalWidth;cv.height=img.naturalHeight;
 const ctx=cv.getContext('2d');ctx.filter=`saturate(${key==='dawn'?.78:tone.saturation}) brightness(${tone.brightness[key]})`;ctx.drawImage(img,0,0);ctx.filter='none';
 ctx.globalAlpha=key==='dawn'?.025:tone.veilOpacity;ctx.fillStyle=tone.veil;ctx.fillRect(0,0,cv.width,cv.height);act1Tones.set(key,cv);return cv;
}
G.HonroAct1Background={images:act1Images,imageFor:act1ImageFor,ready:act1Ready,cacheSize:()=>act1Tones.size};
function paintedSky(c,w,h,b,view){const img=tonedBackdrop(b.honroStage),q=E.act1BackdropFrame(view,w,h,b,img.width,img.height);
 c.drawImage(img,q.x,q.y,q.w,q.h);
}
function polygon(points,close=true,soft=false){const p=new Path2D();if(soft){const first=points[0],last=points.at(-1);p.moveTo((last.x+first.x)/2,(last.y+first.y)/2);points.forEach((v,i)=>{const next=points[(i+1)%points.length];p.quadraticCurveTo(v.x,v.y,(v.x+next.x)/2,(v.y+next.y)/2);});}else points.forEach((v,i)=>i?p.lineTo(v.x,v.y):p.moveTo(v.x,v.y));if(close)p.closePath();return p;}
function graniteForms(s){const w=s.compositionWidth,crest=E.surfaceY(s,w*.51),pt=([x,y])=>({x:x*w,y:crest+y}),area=coords=>polygon(coords.map(pt)),stroke=coords=>polygon(coords.map(pt),false),mass=new Path2D();
 mass.moveTo(w*.20,crest+1000);mass.bezierCurveTo(w*.32,crest+720,w*.38,crest+260,w*.43,crest+150);mass.lineTo(w*.51,crest-5);mass.bezierCurveTo(w*.59,crest+440,w*.66,crest+820,w*.73,crest+1050);mass.bezierCurveTo(w*.78,crest+1650,w*.75,crest+2600,w*.69,crest+3200);mass.bezierCurveTo(w*.54,crest+3650,w*.42,crest+3350,w*.31,crest+2950);mass.bezierCurveTo(w*.23,crest+2300,w*.18,crest+1450,w*.20,crest+1000);mass.closePath();
 // Vertical ink washes describe the rain-soaked face; pale reserved planes
 // and broken horizontal joints keep it from reading as a faceted polygon.
 return{
  mass,
  cleft:area([[.492,75],[.515,105],[.513,330],[.535,550],[.518,930],[.496,1170],[.482,1030],[.504,560]]),
  dryFace:area([[.382,370],[.425,170],[.453,320],[.448,590],[.469,775],[.443,995],[.404,760],[.379,540]]),
  sideFace:area([[.548,360],[.575,530],[.617,650],[.665,970],[.614,1040],[.570,850],[.557,580]]),
  washes:[
   area([[.445,190],[.466,175],[.474,350],[.459,600],[.477,890],[.465,1090],[.448,850],[.455,520]]),
   area([[.528,260],[.543,370],[.537,600],[.550,875],[.537,1130],[.520,960],[.529,650]]),
   area([[.405,530],[.419,580],[.427,760],[.443,890],[.435,1010],[.411,800]])
  ],
  ledges:[
   stroke([[.350,510],[.379,500],[.407,520],[.428,508]]),
   stroke([[.445,710],[.461,690],[.486,703]]),
   stroke([[.523,1060],[.549,1044],[.580,1056]]),
   stroke([[.585,795],[.616,770],[.651,786]])
  ],
  striae:[
   stroke([[.442,320],[.446,450],[.438,610]]),stroke([[.463,248],[.470,410],[.463,552]]),
   stroke([[.483,348],[.479,530],[.488,686]]),stroke([[.505,170],[.512,360],[.501,525]]),
   stroke([[.537,410],[.528,592],[.537,768]]),stroke([[.552,495],[.563,676],[.557,843]]),
   stroke([[.574,632],[.583,791],[.577,927]]),stroke([[.597,790],[.611,937],[.604,1090]])
  ]
 };
}
function foothillForms(s){const w=s.compositionWidth,shift=s.inkVariant===2?.06:0;
 return[.17,.255,.39,.475,.62,.71].map((u,i)=>{const x=(u+shift)*w,y=E.surfaceY(s,x),p=new Path2D(),length=420+(i%3)*120;p.moveTo(x,y+25);p.bezierCurveTo(x+(i%2?35:-26),y+130,x+(i%2?-21:43),y+230,x+((i%3)-1)*55,y+length);return{path:p,width:34+(i%3)*17};});}
function prepare(env){
 if(prepared.has(env))return prepared.get(env);
 const groups=env.groups.map(group=>({group,surfaces:env.surfaces.filter(s=>s.groupId===group.id).map(s=>{
  const reach=group.depthLayer==='L2'?1100:group.depthLayer==='L3'?1350:1600;
  const drawBottom=Number.isFinite(s.artBottom)?s.artBottom:Math.max(...s.points.map(p=>p.y))+reach;
  const points=[...s.points,...(s.artBottomPoints||[{x:s.points.at(-1).x,y:drawBottom},{x:s.points[0].x,y:drawBottom}])];
  const stride=Math.max(4,Math.ceil((s.points.length-1)/3)),planes=[];for(let i=0;!['ink-granite','ink-foothill'].includes(s.kind)&&i<s.points.length-2;i+=stride){const run=s.points.slice(i,i+stride+1),first=run[0],last=run.at(-1),depth=s.kind==='ink-mountain'?840:s.kind==='cave-wall'?600:500;
   planes.push({light:polygon([...run,{x:last.x-(last.x-first.x)*.16,y:last.y+depth*.55},{x:first.x,y:first.y+depth*.42}]),
    shadow:polygon([run[Math.min(1,run.length-1)],...run.slice(2),{x:last.x,y:last.y+depth},{x:first.x+(last.x-first.x)*.48,y:first.y+depth*.40}])});}
  const shoulder=s.kind==='ink-mountain'?polygon([...s.points.map((p,i)=>({x:p.x,y:p.y+175+50*Math.sin(i*.42)})),{x:s.points.at(-1).x,y:drawBottom},{x:s.points[0].x,y:drawBottom}]):null;
  return{...s,path:polygon(points),edge:polygon(s.points,false),shoulder,planes,granite:s.kind==='ink-granite'?graniteForms(s):null,foothill:s.kind==='ink-foothill'?foothillForms(s):null,top:Math.min(...s.points.map(p=>p.y)),drawBottom};
 }),children:env.placements.filter(e=>e.groupId===group.id&&e.asset).map(e=>({...e,role:E.assetRole(e.asset),paths:(e.asset.visual||[]).map(s=>({...s,path:polygon(s.points,s.closed!==false,e.asset.id==='env:forest')}))}))}));
 groups.sort((a,b)=>E.depth({environment:env},b.group.depthLayer)-E.depth({environment:env},a.group.depthLayer));
 const data={groups,paths:groups.reduce((n,g)=>n+g.surfaces.reduce((m,s)=>m+2+(s.shoulder?1:0)+s.planes.length*2+(s.granite?7+s.granite.ledges.length+s.granite.striae.length:0)+(s.foothill?s.foothill.length:0),0)+g.children.reduce((m,e)=>m+e.paths.length,0),0)};prepared.set(env,data);return data;
}
function sky(c,w,h,st,a){c.fillStyle=A.gradient(c,0,0,0,h,[[0,a.skyTop],[.58,E.mixColor(a.skyTop,a.skyBottom,.67)],[1,a.skyBottom]]);c.fillRect(0,0,w,h);
 if(!E.preset(st).sky||st.environment.skyVisible===false)return;
 const [u,v]=a.keyLightDirection,x=w*u,y=h*v,r=Math.min(w,h)*.031;
 A.glow(c,x,y,r*8,r*8,a.glowColor,.20);c.fillStyle=A.color(a.keyLightColor,.65);c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
 A.fog(c,w*.30,h*.19,w*.65,h*.16,a.farFogColor,.22);
 A.fog(c,w*.81,h*.31,w*.62,h*.12,a.hazeColor,.18);
}
function surface(c,s,g,a){if(s.kind==='act2-rear-terrace'){c.save();c.fillStyle=A.gradient(c,0,s.top,0,s.drawBottom,[[0,'#354452'],[.38,'#263541'],[1,'#14242e']]);c.fill(s.path);c.clip(s.path);for(const [i,p]of s.planes.entries()){c.fillStyle=i%2?'#111e2a55':'#63738230';c.fill(p.light);c.fillStyle='#09192333';c.fill(p.shadow);}c.restore();return;}const f=E.FINISH[g.depthLayer],granite=!!s.granite,far=E.mixColor(a.shadowTint,a.hazeColor,f.haze*a.hazeStrength*(granite?.55:1)),lit=E.mixColor(far,a.ambientTint,.35),top=s.top,reach=g.depthLayer==='L2'?1000:g.depthLayer==='L3'?1250:granite?1840:1500;
 const mountain=s.kind==='ink-mountain'||granite;
 c.fillStyle=A.gradient(c,0,top,0,top+reach,[[0,A.color(far,mountain ? .90 : .75)],[.38,A.color(lit,mountain ? .73 : .50)],[1,A.color(a.farFogColor,0)]]);c.fill(s.path);
 // A few broad light and shadow facets survive maximum zoom-out. The cached
 // paths share the support contour, so they cannot detach during camera pans.
 c.save();c.clip(s.path);
 if(granite){const q=s.granite,crest=E.surfaceY(s,s.compositionWidth*.51);
  c.fillStyle=A.gradient(c,0,crest,0,crest+2550,[[0,A.color(E.mixColor(a.shadowTint,'#0b1920',.48),.84)],[.50,A.color(E.mixColor(a.shadowTint,'#0b1920',.48),.60)],[1,A.color(a.shadowTint,0)]]);c.fill(q.mass);
  c.fillStyle=A.gradient(c,0,crest,0,crest+1300,[[0,A.color(E.mixColor(a.shadowTint,'#09151a',.55),.65)],[.72,A.color(E.mixColor(a.shadowTint,'#09151a',.55),.55)],[1,A.color(a.shadowTint,0)]]);c.fill(q.cleft);
  c.fillStyle=A.color(E.mixColor(a.hazeColor,a.keyLightColor,.34),.29);c.fill(q.dryFace);
  c.fillStyle=A.color(E.mixColor(a.ambientTint,a.hazeColor,.30),.35);c.fill(q.sideFace);
  c.fillStyle=A.gradient(c,0,crest+150,0,crest+1300,[[0,A.color(E.mixColor(a.shadowTint,'#081419',.55),.56)],[.75,A.color(E.mixColor(a.shadowTint,'#081419',.55),.43)],[1,A.color(a.shadowTint,0)]]);for(const brush of q.washes)c.fill(brush);
  c.strokeStyle=A.color(E.mixColor(a.keyLightColor,a.hazeColor,.55),.29);c.lineWidth=13;c.lineCap='round';for(const mark of q.striae)c.stroke(mark);
  c.strokeStyle=A.color(E.mixColor(a.keyLightColor,a.hazeColor,.4),.33);c.lineWidth=19;c.lineCap='round';for(const joint of q.ledges)c.stroke(joint);
 }
 if(s.foothill){c.strokeStyle=A.gradient(c,0,s.top,0,s.top+900,[[0,A.color(E.mixColor(a.shadowTint,'#0b171e',.30),.37)],[.50,A.color(a.shadowTint,.19)],[1,A.color(a.shadowTint,0)]]);c.lineCap='round';for(const mark of s.foothill){c.lineWidth=mark.width;c.stroke(mark.path);}}
 if(s.shoulder){c.fillStyle=A.color(E.mixColor(far,a.shadowTint,.39),.45);c.fill(s.shoulder);}
 c.fillStyle=A.color(E.mixColor(lit,a.keyLightColor,.40),g.depthLayer==='L4'?.14:.17);for(const plane of s.planes)c.fill(plane.light);
 c.fillStyle=A.color(E.mixColor(far,a.shadowTint,.58),g.depthLayer==='L4'?.17:.20);for(const plane of s.planes)c.fill(plane.shadow);
 c.restore();
 c.strokeStyle=A.color(E.mixColor(lit,a.keyLightColor,.26),mountain ? .22 : .40);c.lineWidth=g.depthLayer==='L2'?3:5;c.stroke(s.edge);
}
function child(c,e,g,st,view,w,h,a,time){const r=e.asset.reference,box=E.screenBounds(e.asset,e,view,w,h,st);if(box.x>w+60||box.x+box.w<-60||box.y>h+60||box.y+box.h<-60)return false;
 const sf=E.supportOf(st,e),y=(sf?E.surfaceY(sf,e.x):0)+e.y,scale=E.WORLD_UNITS_PER_METER*r.heightM/r.bounds.h*e.scale;
 c.save();c.translate(e.x,y);c.rotate(e.rotation||0);c.scale(scale,scale);c.translate(-r.foot.x,-r.foot.y);
 if(e.asset.vector){c.globalAlpha*=1-E.FINISH[g.depthLayer].haze*.55;G.HonroVectorArt.draw(c,e.asset,{x:e.asset.anchor?.x||0,y:e.asset.anchor?.y||0,scale:1});}
 else if(e.asset.renderer==='landmark'){c.globalAlpha*=1-E.FINISH[g.depthLayer].haze*.55;G.HonroElements.nativeLandmark.call(view,c,{...e,kind:e.asset.kind,x:0,y:0,size:1});}
 else if(e.role.role==='waterfall')A.waterfall(c,0,0,110,540,a,time);
 else {const fade=E.FINISH[g.depthLayer].haze*a.hazeStrength;for(const [index,shape] of e.paths.entries()){c.save();c.globalAlpha*=shape.alpha??1;if(shape.fill){const base=E.mixColor(shape.fill.slice(0,7),a.ambientTint,.19),dark=E.mixColor(base,a.hazeColor,fade),lit=E.mixColor(dark,a.keyLightColor,(1-fade)*.10);c.fillStyle=index===0?A.gradient(c,0,r.bounds.y,0,r.bounds.y+r.bounds.h,[[0,lit],[.65,dark],[1,E.mixColor(dark,a.shadowTint,.16)]]):lit;c.fill(shape.path);}if(shape.stroke&&g.depthLayer==='L2'){c.strokeStyle=E.mixColor(shape.stroke.slice(0,7),a.hazeColor,fade+.15);c.lineWidth=shape.lineWidth||1;c.stroke(shape.path);}c.restore();}}
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
Scene.prototype.environmentTone=function(c,w,h,b){const mood=E.campaignMood(b.honroStage);if(!mood)return;c.save();c.globalCompositeOperation='multiply';c.globalAlpha*=mood.opacity;c.fillStyle=mood.tint;c.fillRect(0,0,w,h);c.restore();};
function customSpatialScenery(scene,c,w,h,b){const env=ensureBattle(b),custom=new Set(env.placements.filter(e=>!/^scenery-stage-\d+-\d+$/.test(e.id)).map(e=>e.id));if(!custom.size)return;
 const st={width:b.width,height:b.height,backdrop:b.honroBackdrop,environment:env},data=prepare(env),time=A.time(scene);let visible=0,active=0;
 for(const unit of data.groups){const g=unit.group;if(env.hiddenLayers?.includes(g.depthLayer)||!unit.children.some(e=>custom.has(e.id)))continue;const tr=E.groupTransform(scene,w,h,st,g),a=E.atmosphere(st,env.zones.find(z=>z.id===g.zoneId));active++;c.save();c.globalAlpha=tr.opacity;c.translate(tr.x,tr.y);c.scale(tr.scale,tr.scale);
  // Author-created finite supports remain physical WORLD scenery. Generated
  // mountain/forest supports are replaced by the approved spatial ink pass.
  const supports=new Set(unit.children.filter(e=>custom.has(e.id)).map(e=>e.supportId));for(const surfaceData of unit.surfaces)if(supports.has(surfaceData.id)&&!/^landscape-|^support-stage-/.test(surfaceData.id))surface(c,surfaceData,g,a);
  for(const e of unit.children)if(custom.has(e.id)&&child(c,e,g,st,scene,w,h,a,time))visible++;c.restore();
 }
 if(scene.environmentStats){scene.environmentStats.groups+=active;scene.environmentStats.visibleAssets+=visible;scene.environmentStats.cachedPaths+=data.paths;}
}
Scene.prototype.background=function(c,w,h,b){if(G.HonroAct2SpatialArt?.active(b)){
 const key=[this._worldCacheKey(b,w),this.x,this.y,this.scale,G.HonroAct2SpatialArt.ready()].join(':');
 const cached=G.HonroAct2SpatialArt.ready()&&this._screenRaster(c,key,w,h,cc=>{G.HonroAct2SpatialArt.background(cc,b,this,w,h);this._screenBackgroundStats={...this.environmentStats};},'_screenBackgroundCache',false);
 if(cached)this.environmentStats={...this._screenBackgroundStats};else G.HonroAct2SpatialArt.background(c,b,this,w,h);
 customSpatialScenery(this,c,w,h,b);return;}const env=ensureBattle(b),painted=(b.honroStage<21||env.skyVisible!==false)&&E.campaignMood(b.honroStage)&&act1Ready(b.honroStage);if(painted){paintedSky(c,w,h,b,this);
  // The authored far painting replaces only the generated backdrop. Workshop
  // scenery with its own ID still uses its support, depth and camera transform.
  const custom=new Set(env.placements.filter(e=>!/^scenery-stage-\d+-\d+$/.test(e.id)).map(e=>e.id));let visible=0,active=0,paths=0;
  if(custom.size){const st={width:b.width,height:b.height,backdrop:b.honroBackdrop,environment:env},data=prepare(env),time=A.time(this);paths=data.paths;
   for(const unit of data.groups){const g=unit.group;if(env.hiddenLayers?.includes(g.depthLayer)||!unit.children.some(e=>custom.has(e.id)))continue;const tr=E.groupTransform(this,w,h,st,g),a=E.atmosphere(st,env.zones.find(z=>z.id===g.zoneId));active++;c.save();c.globalAlpha=tr.opacity;c.translate(tr.x,tr.y);c.scale(tr.scale,tr.scale);for(const e of unit.children)if(custom.has(e.id)&&child(c,e,g,st,this,w,h,a,time))visible++;c.restore();}
  }
  if(b.honroCaveApproach)G.HonroCaveRock?.approach(c,b,this,w,h);
  if(b.honroStage===20)G.HonroCaveRock?.exit(c,b,this,w,h);
  this.environmentStats={groups:active,visibleAssets:visible,cachedPaths:paths,backgroundAnimatedPrimitives:0,animatedPrimitives:0,...A.stats()};return;}
 const st={width:b.width,height:b.height,backdrop:b.honroBackdrop,environment:env},a=E.atmosphereAt(st,this.y),data=prepare(env),time=A.time(this);sky(c,w,h,st,a);
 if(b.honroCaveEnvelope)G.HonroCaveRock?.background(c,b,this,w,h);
 if(b.honroCaveApproach)G.HonroCaveRock?.approach(c,b,this,w,h);
 if(b.honroStage===20)G.HonroCaveRock?.exit(c,b,this,w,h);
 let visible=0,active=0,animated=1;
 for(const unit of data.groups){const g=unit.group;if(env.hiddenLayers?.includes(g.depthLayer))continue;const tr=E.groupTransform(this,w,h,st,g),surface0=unit.surfaces[0];if(tr.opacity<=.001||surface0&&(tr.y+surface0.top*tr.scale>h+600||tr.y+surface0.drawBottom*tr.scale<0))continue;active++;
  const z=env.zones.find(z=>z.id===g.zoneId),local=E.atmosphere(st,z);
  c.save();c.globalAlpha=tr.opacity;c.translate(tr.x,tr.y);c.scale(tr.scale,tr.scale);
  for(const s of unit.surfaces)surface(c,s,g,local);
  for(const e of unit.children)if(child(c,e,g,st,this,w,h,local,time)){visible++;animated+=e.role.role==='waterfall'?10:e.role.role==='light'?1:0;}
  // Local mist shares the parent's X/Y/zoom transform, including camera pans.
  if(g.depthLayer==='L3'&&surface0){const x=st.width*.5,y=E.surfaceY(surface0,x)+90,screenY=tr.y+y*tr.scale;if(screenY>-220&&screenY<h+220){A.fog(c,x,y,Math.max(2400,st.width*.75),440,local.farFogColor,local.mistStrength,time,local.mistSpeed);animated++;if(['valley','bridge'].includes(st.backdrop)){A.fog(c,st.width*.37,y+285,st.width*.60,670,local.farFogColor,.32,time,local.mistSpeed*.5);animated++;}}}
  c.restore();
 }
 const [lx,ly]=a.keyLightDirection;if(env.skyVisible!==false){if(['valley','bridge'].includes(st.backdrop))A.glow(c,w*lx,h*(ly+.17),w*.19,h*.46,a.keyLightColor,a.lightStrength*.18);else A.shaft(c,w*lx,h*ly,w*.23,h*.80,a.keyLightColor,a.lightStrength,time);}
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
