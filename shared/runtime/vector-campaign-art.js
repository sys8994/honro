(function(G){'use strict';
// Presentation over canonical polygons. Never edits terrain, actors, events or saves.
const V=G.HonroVectorCampaignArt,K=G.HonroEnvironmentVectorKit,S=G.HonroScene.prototype,C=G.HONRO_CORE;
const cache=new WeakMap(),landmarks=new WeakMap();
const displays=new WeakMap(),D=G.HonroTerrainDomain,domainRender=D.render;
function displayBattle(b){
 if(!V.active(b)||D.active(b)||!K.STAGE_STYLES[b.honroStage].foundations)return b;
 const source=domainRender(b),key=b.sceneVersion+':'+b.terrain.filter(t=>t.broken).map(t=>t.id).join(',');let q=displays.get(b);if(q?.key===key&&q.source===source)return q.battle;
 // Ask the existing domain policy for its coverage. Extend only the explicitly
 // named flat-bottom foundations, using their old closure as the extension base.
 const box=D.author({stages:[{width:b.width,height:b.height,terrains:[],metadata:{stageId:b.honroStage}}]}).stages[0].terrainBounds;
 const ids=K.STAGE_STYLES[b.honroStage].foundations,world=source.map(t=>{
  if(!ids.includes(t.id)||t.broken||t.oneWay)return t;
  const points=D.extend(C.poly(t),{width:b.width,height:t.y+t.h,terrainBounds:box,metadata:{stageId:b.honroStage}}),shape=G.HonroMapEngine.solid(t.id,points.map(p=>[p.x,p.y]));
  return{...t,vertices:shape.vertices,x:shape.x,y:shape.y,w:shape.w,h:shape.h};
 });
 const battle=Object.create(b);Object.assign(battle,{honroTerrainBounds:box,honroWorldTerrain:world,honroTerrainDomainVersion:1});displays.set(b,{key,source,battle});return battle;
}
D.render=function(b){return domainRender(displayBattle(b));};

function polygon(points){const p=new Path2D();points.forEach((a,i)=>i?p.lineTo(a.x,a.y):p.moveTo(a.x,a.y));p.closePath();return p;}
function inside(x,y,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],z=points[j];if((a.y>y)!==(z.y>y)&&x<(z.x-a.x)*(y-a.y)/(z.y-a.y)+a.x)yes=!yes;}return yes;}
function material(t,style){return t.mat==='wood'||t.surfaceKind==='branch'?'wood':t.mat==='water'||t.mat==='ice'||t.mat==='crystal'?'water':t.mat==='earth'||t.surfaceKind==='soil'?'earth':t.mat==='rock'||t.honroCeiling?'rock':style.ground;}
function canvasPaint(c,p){if(p.type==='color')return p.value;const g=c.createLinearGradient(...p.from,...p.to);for(const [offset,color] of p.stops)g.addColorStop(offset,color);return g;}
function contextView(c){const m=c.getTransform();return{x:-m.e/m.a,y:-m.f/m.d,w:c.canvas.width/m.a,h:c.canvas.height/m.d};}
// A bounded landform composition follows exposed faces, not the extended map box.
const INTERIOR_REVISION='landforms-3';
function hash01(text){let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0)/4294967295;}
function clipFace(face,box){let lo=0,hi=1;const dx=face.z.x-face.a.x,dy=face.z.y-face.a.y;
 for(const [p,q] of [[-dx,face.a.x-box.left],[dx,box.right-face.a.x],[-dy,face.a.y-box.top],[dy,box.bottom-face.a.y]]){if(Math.abs(p)<1e-8){if(q<0)return null;}else{const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return null;}}
 const a={x:face.a.x+lo*dx,y:face.a.y+lo*dy},z={x:face.a.x+hi*dx,y:face.a.y+hi*dy};return{...face,a,z,len:Math.hypot(z.x-a.x,z.y-a.y)};
}
function composeInterior(b,records,style){
 const limit=Math.min(80,(style.maxParts||48)+24),majorLimit=Math.min(30,Math.ceil(limit*.44)),middleLimit=Math.min(34,limit-majorLimit-8),plans=[];
 const region={left:-750,top:-650,right:b.width+750,bottom:b.height+2200},city=['city','ash'].includes(style.palette),cave=['cave','ink'].includes(style.palette);
 function add(level,r,id,x,y,scale,rotation=0,opacity=1){const definition=K.ASSETS[id];if(!definition)throw Error('Missing landform '+id);const [lo,hi]=definition.scaleRange;scale=Math.max(lo,Math.min(hi,scale));
  const instance={id:r.t.id+'/landform-'+r.features.length,assetId:id,palette:style.palette,opacity,transform:{x,y,scale,rotation}};r.features.push({level,instance});return instance;
 }
 for(const r of records.values()){
  r.features=[];r.partsByLOD={};r.landformCandidates=[];
  const t=r.t;if(t.oneWay||r.mat==='wood'||r.mat==='water'||t.honroQuestTarget||t.device||t.honroSeal||/^sb-(bell-|inner-)/.test(t.id)||['sf-settled-barge','sf-outbank-screen'].includes(t.id))continue;
  if(t.w<200||t.h<130)continue;
  for(const original of r.faces){const face=clipFace(original,region);if(!face||face.len<100)continue;
   // Soil flows start at the visible top; synthetic domain sides/bottoms never seed art.
   if((r.mat==='earth'||cave)&&(face.ny>-.55||face.a.y>b.height+200||face.z.y>b.height+200))continue;
   const count=Math.max(1,Math.min(6,Math.ceil(face.len/1250)));
   for(let i=0;i<count;i++){
    const seed=hash01(t.id+':'+face.a.x+':'+face.a.y+':'+i),f=(i+.22+seed*.48)/count,x=face.a.x+(face.z.x-face.a.x)*f,y=face.a.y+(face.z.y-face.a.y)*f;
    let depth=0;for(const d of [95,210,390,680,1080,1620,2320]){if(!inside(x-face.nx*d,y-face.ny*d,r.points))break;depth=d;}
    if(depth<210)continue;
    const onMap=x>=0&&x<=b.width&&y>=0&&y<=b.height+500;if((r.mat==='earth'||cave)&&!onMap)continue;const score=Math.sqrt(face.len)*Math.min(depth,1620)*(onMap?1.3:.55);
    r.landformCandidates.push({x,y,nx:face.nx,ny:face.ny,depth,seed,score,len:face.len});
   }
  }
  r.landformCandidates.sort(cave&&t.w>4000?(a,z)=>a.x-z.x:(a,z)=>z.score-a.score);const chosen=[];
  for(const c of r.landformCandidates){if(chosen.every(p=>Math.hypot(c.x-p.x,c.y-p.y)>(cave&&t.w>4000?2800:r.mat==='earth'?1750:1100))){chosen.push(c);if(chosen.length===(r.mat==='earth'?2:cave?3:5))break;}}
  r.landformCandidates=chosen;r.rank=chosen[0]?.score||0;if(chosen.length)plans.push(r);
 }
 plans.sort((a,z)=>z.rank-a.rank);let majors=0,middles=0,near=0;
 for(let round=0;round<5&&majors<majorLimit;round++)for(const r of plans){const c=r.landformCandidates[round];if(!c||majors>=majorLimit)continue;
  const earth=r.mat==='earth',wall=Math.abs(c.nx)>.55||c.ny>.5,angle=Math.atan2(-c.nx,-c.ny)*180/Math.PI;
  if(earth){
   const id=round===0?(style.palette==='wet'?'wet.silt-bank':'earth.slope-mass'):'earth.erosion-face';
   const scale=Math.max(K.ASSETS[id].scaleRange[0],Math.min(round===0?.98:.7,c.depth/880)),rotation=Math.max(-14,Math.min(14,angle*(round===0?.55:.8)+(round===0?-3:11)));
   add('major',r,id,c.x,c.y-(round===0?170:100),scale,rotation,round===0?.95:.8);majors++;
   if(middles<middleLimit&&style.palette!=='wet'&&c.depth>680&&round===0){add('middle',r,'earth.buried-exposure',c.x+220,c.y+145,.68,rotation,.7);middles++;}
   continue;
  }
  if(cave){
   // A low asymmetric shoulder carries the primary plane; most of the depth stays quiet.
   // Narrow supports get only a small buried lobe, never an enlarged cliff motif.
   const primary=r.t.w>1400&&c.depth>680,rotation=Math.max(-22,Math.min(22,angle*.45+(round%2?9:-8)));
   if(primary){add('major',r,'rock.stratified-mass',c.x-180,c.y-80,round===0?.9:.68,rotation,round===0?.78:.56);majors++;}
   if(middles<middleLimit){const side=c.seed>.5?1:-1,x=c.x+(primary?side*380:0),y=c.y+55;
    if(inside(x,y+110,r.points)){add('middle',r,'rock.buried-lobe',x,y,primary?.82:.65,rotation+(primary?-13:7),.68);middles++;}
   }
   continue;
  }
  const id=city&&!wall?'rock.foundation-ledge':wall?'rock.cavern-buttress':'rock.stratified-mass',def=K.ASSETS[id];
  const scale=Math.min(.95,c.depth/Math.max(500,def.bounds.h)),rotation=Math.max(-18,Math.min(18,angle));if(scale<def.scaleRange[0])continue;
  const surfaceOrigin=id==='rock.stratified-mass',d=surfaceOrigin?24:-def.bounds.y*scale*.64;
  add('major',r,id,c.x-c.nx*d,c.y-c.ny*d,scale,rotation,.8);majors++;
 }
 // Roots belong to existing tree feet, never to arbitrary empty soil cells.
 const roots=[...(style.scenery||[]).filter(p=>/^pine\./.test(p.assetId)).map(p=>{const a=b.honroMapAnchors?.[p.anchor]||{},x=p.x??a.x,t=b.terrain.find(t=>t.id===p.support&&!t.broken);return t&&Number.isFinite(x)?{x,y:C.topAt(t,x,t.y),support:t.id}:null;}),...(b.honroLandmarks||[]).filter(l=>/rooted-pine|ancientPine|giantPine/.test(l.asset?.id||l.kind||'')).map(l=>({x:l.x,y:l.y}))].filter(Boolean);
 if(!cave&&!city&&style.palette!=='wet')for(const tree of roots){if(near===5)break;const r=[...records.values()].find(r=>r.mat==='earth'&&(!tree.support||tree.support===r.t.id)&&inside(tree.x,tree.y+80,r.points));if(!r)continue;add('middle',r,'earth.root-scarp',tree.x,tree.y+10,.78,0,.8);near++;}
 // One world-space composition per material crosses adjacent collision polygons.
 // Each polygon clips the same nodes, so an internal seam cannot cut a soil shoulder.
 const byMaterial=new Map();for(const r of records.values()){if(!byMaterial.has(r.mat))byMaterial.set(r.mat,{features:[],scenes:{}});byMaterial.get(r.mat).features.push(...r.features);}
 for(const group of byMaterial.values())for(const level of ['major','middle'])group.scenes[level]=K.compileScene({instances:group.features.filter(p=>p.level===level).map(p=>p.instance)});
 for(const r of records.values())r.partsByLOD=byMaterial.get(r.mat).scenes;
 return{limit,major:majors,middle:middles+near,roots:near,total:majors+middles+near,regions:plans.length,revision:INTERIOR_REVISION};
}

function prepare(b){
 const source=G.HonroTerrainDomain.render(b),key=[b.sceneVersion,K.REGISTRY_VERSION,INTERIOR_REVISION,b.terrain.filter(t=>t.broken).map(t=>t.id).join(',')].join(':');
 let q=cache.get(b);if(q?.key===key&&q.source===source)return q;
 const style=K.STAGE_STYLES[b.honroStage],records=new Map(),solids=source.filter(t=>!t.broken&&!t.oneWay&&!t.honroElementCollision).map(t=>({t,points:C.poly(t)}));
 for(const [index,t] of source.entries()){
  if(t.broken)continue;const points=C.poly(t);if(points.length<3)continue;
  const path=polygon(points),mat=material(t,style),edges=new Path2D(),topPlane=new Path2D(),tops=[],faces=[];
  const area=points.reduce((sum,a,i)=>{const z=points[(i+1)%points.length];return sum+a.x*z.y-z.x*a.y;},0),sign=area>=0?1:-1;
  for(let i=0;i<points.length;i++){
   const a=points[i],z=points[(i+1)%points.length],dx=z.x-a.x,dy=z.y-a.y,len=Math.hypot(dx,dy);if(len<8)continue;
   const nx=sign*dy/len,ny=-sign*dx/len,mx=(a.x+z.x)/2,my=(a.y+z.y)/2;
   if(solids.some(other=>other.t.id!==t.id&&inside(mx+nx*3,my+ny*3,other.points)))continue;
   edges.moveTo(a.x,a.y);edges.lineTo(z.x,z.y);faces.push({a,z,len,nx,ny});
   if(ny<-.68&&Math.abs(dx)>65){tops.push({a,z,len,nx,ny});const insetA=8+(i%3)*2,insetZ=6+((i+1)%3)*3;topPlane.moveTo(a.x,a.y);topPlane.lineTo(z.x,z.y);topPlane.lineTo(z.x-nx*insetZ,z.y-ny*insetZ);topPlane.lineTo(a.x-nx*insetA,a.y-ny*insetA);topPlane.closePath();}
  }
  const asset={id:'campaign-ground',material:mat,bounds:{x:0,y:0,w:b.width,h:b.height}};
  records.set(t.id,{t,path,edges,topPlane,tops,faces,asset,mat,points});
 }
 const interior=composeInterior(b,records,style);
 const scenery=(style.scenery||[]).map(part=>{
  const anchor=b.honroMapAnchors?.[part.anchor]||{},x=part.x??anchor.x,support=b.terrain.find(t=>t.id===part.support&&!t.broken);if(!support||!Number.isFinite(x))return null;
  return{id:part.id,assetId:part.assetId,palette:style.palette,transform:{x,y:C.topAt(support,x,anchor.y??support.y),scale:part.scale}};
 }).filter(Boolean);
 const sceneryScene=K.compileScene({instances:scenery});
 for(const part of style.scenery||[])for(const [support,ids] of Object.entries(part.breakLinks||{}))if(b.terrain.find(t=>t.id===support)?.broken)sceneryScene.nodes=sceneryScene.nodes.filter(node=>!ids.some(id=>node.id===part.id+'/'+id));
 const architecture=K.compileArchitecture(style.architecture,b,{...K,palette:style.palette},C);for(const group of architecture.groups)if(group.clipD)group.clip=new Path2D(group.clipD);
 q={key,source,records,style,architecture,scenery:sceneryScene,interior,partCount:interior.total,builds:(q?.builds||0)+1};cache.set(b,q);return q;
}
function paintTerrain(c,t,b){
 const live=b.terrain.find(v=>v.id===t.id);if(t.broken||live?.broken)return;
 const q=prepare(b),r=q.records.get(t.id);if(!r||q.architecture.covered.has(t.id))return;
 c.save();c.fillStyle=canvasPaint(c,K.paintFor(r.asset,'body',q.style.palette));c.fill(r.path);
 c.save();c.clip(r.path);
 if(['cave','ink'].includes(q.style.palette)&&r.mat==='rock'&&r.t.y>=0&&r.t.h>900){const top=Math.min(...r.tops.map(f=>Math.min(f.a.y,f.z.y)));if(Number.isFinite(top)){const shade=K.paintFor(r.asset,'shade',q.style.palette).value,g=c.createLinearGradient(0,top+250,0,top+1450);g.addColorStop(0,shade+'00');g.addColorStop(1,shade+'66');c.fillStyle=g;c.fill(r.path);}}
 const view=contextView(c),density=Math.abs(c.getTransform().a);K.drawCanvas(c,r.partsByLOD.major,{viewBounds:view});if(density>=.45)K.drawCanvas(c,r.partsByLOD.middle,{viewBounds:view});
 c.save();c.globalAlpha*=r.mat==='earth'?.17:.11;c.fillStyle=canvasPaint(c,K.paintFor(r.asset,'light',q.style.palette));c.fill(r.topPlane);c.restore();
 // Small, broad grain faces follow a timber member; no repeating texture pass.
 if(r.mat==='wood'){c.strokeStyle=K.paintFor(r.asset,'light',q.style.palette).stops[0][1];c.globalAlpha=.22;c.lineWidth=3;const top=r.tops[0];if(top){c.beginPath();c.moveTo(top.a.x+6,top.a.y+8);c.quadraticCurveTo((top.a.x+top.z.x)/2,(top.a.y+top.z.y)/2+13,top.z.x-6,top.z.y+8);c.stroke();}}c.restore();
 // Quiet edge cue follows the exact exposed polygon. The debug toggle owns the strong outline.
 c.strokeStyle=K.paintFor(r.asset,'light',q.style.palette).stops[0][1];c.globalAlpha=.21;c.lineWidth=t.oneWay?2.4:1.6;c.lineJoin='round';c.stroke(r.edges);c.restore();
}
function replacement(l,b){
 if(!V.active(b))return null;
 const id=l.asset?.id||'',kind=l.kind||'';
 if(/guardian|sacred|bell|ritual|gate|waterfall|ferry|village|temple/i.test(id+' '+kind))return null;
 let assetId;
 if(/^(giantPine|ancientPine|pine)$/.test(kind)||/rooted-pine|cape-pine|east-pine|old-road-pine/.test(id))assetId=kind==='giantPine'?'pine.landmark':'pine.small';
 else if(/^(fernPatch|grass)$/.test(kind)||id==='grass_tuft')assetId='grass.sedge';
 else if(/mockup-granite-(large|small)/.test(id)&&!(l.collisionIds?.length))assetId=id.endsWith('large')?'rock.shoulder':'stone.round';
 if(!assetId)return null;
 const style=K.STAGE_STYLES[b.honroStage];if(l.collisionIds?.some(id=>b.terrain.find(t=>t.id===id)?.broken))return {nodes:[]};
 let prior=landmarks.get(l);const key=style.palette+':'+K.REGISTRY_VERSION;if(prior?.key===key)return prior.compiled;
 const definition=K.ASSETS[assetId]||K.COMPOSITIONS[assetId],height=l.asset?.bounds?.h*(l.scale||1)|| (assetId==='pine.landmark'?1000:540)*(l.size||1),nativeHeight=definition.bounds.h;
 const scale=Math.max(definition.scaleRange[0],Math.min(definition.scaleRange[1],height/nativeHeight));
 const compiled=K.compileScene({instances:[{id:l.id,assetId,palette:style.palette,transform:{x:l.x||0,y:l.y||0,scale,rotation:l.rotation||0,mirror:!!l.flip}}]});landmarks.set(l,{key,compiled});return compiled;
}
const priorStatic=S._drawStaticWorldCached;S._drawStaticWorldCached=function(c,b,w,h){return priorStatic.call(this,c,displayBattle(b),w,h);};
const priorSkirt=S.terrainSkirt;S.terrainSkirt=function(c,b,w,h){const display=displayBattle(b);if(display!==b){this.overscanStats={bounds:display.honroTerrainBounds,paths:0,unified:true,visualOnly:true};return;}return priorSkirt.call(this,c,b,w,h);};
const priorLayer=S._landmarkLayer;S._landmarkLayer=function(c,list,layer){priorLayer.call(this,c,list,layer);if(layer==='structural-back'&&V.active(this.battle)){const q=prepare(this.battle),view=contextView(c);K.drawCanvas(c,q.scenery,{viewBounds:view});for(const group of q.architecture.groups){c.save();if(group.clip)c.clip(group.clip);K.drawCanvas(c,group.compiled,{viewBounds:view});c.restore();}}};
const priorTerrain=S.terrain;S.terrain=function(c,t){if(!V.active(this.battle)||t.honroQuestTarget||t.device||t.honroSeal||([18,19].includes(this.battle.honroStage)&&/^sb-(bell-|inner-)/.test(t.id))||(this.battle.honroStage===30&&['sf-settled-barge','sf-outbank-screen'].includes(t.id)))return priorTerrain.call(this,c,t);return paintTerrain(c,t,this.battle);};
const priorLandmark=S.landmark;S.landmark=function(c,l){const replacementScene=replacement(l,this.battle);if(replacementScene){K.drawCanvas(c,replacementScene,{viewBounds:contextView(c)});return;}return priorLandmark.call(this,c,l);};
const targetArt=new WeakMap(),priorUnitBody=S.unitBody;
S.unitBody=function(c,u,charge=0){const id=V.active(this.battle)&&K.STAGE_STYLES[this.battle.honroStage].unitArt?.[u.id];if(!id)return priorUnitBody.call(this,c,u,charge);const asset=K.ASSETS[id],key=[id,u.x,u.y,u.h,K.REGISTRY_VERSION].join(':');let q=targetArt.get(u);if(q?.key!==key){q={key,compiled:K.compileScene({instances:[{id:u.id,assetId:id,palette:K.STAGE_STYLES[this.battle.honroStage].palette,transform:{x:u.x,y:u.y,scale:u.h/asset.bounds.h}}]})};targetArt.set(u,q);}K.drawCanvas(c,q.compiled);};
const priorVisible=S._landmarkVisible;S._landmarkVisible=function(l,view,pad=40){const q=replacement(l,this.battle);if(!q)return priorVisible.call(this,l,view,pad);return q.nodes.some(n=>n.bounds.x+n.bounds.w+pad>=view.left&&n.bounds.x-pad<=view.right&&n.bounds.y+n.bounds.h+pad>=view.top&&n.bounds.y-pad<=view.bottom);};
const priorBackground=S.background;S.background=function(c,w,h,b){if(V.active(b)&&b.honroStage===2&&b.honroMap?.stage2ImageFirst)G.HonroStage2ImageFirstArt.overwatch(this,w,h,b);const style=V.active(b)&&K.STAGE_STYLES[b.honroStage],far=style?.far,P=G.HonroPaintedPilots;if(!far||!P)return priorBackground.call(this,c,w,h,b);P.request([far]);if(!P.ready(far)){const raw=G.HonroVisualStyle.raw(c);raw.fillStyle='#59666a';raw.fillRect(0,0,w,h);return;}const image=P.images[far],raw=G.HonroVisualStyle.raw(c),scale=Math.max(w/image.naturalWidth,h/image.naturalHeight),width=image.naturalWidth*scale,height=image.naturalHeight*scale;raw.drawImage(image,(w-width)/2,(h-height)/2,width,height);raw.fillStyle='#334a502b';raw.fillRect(0,0,w,h);};
const priorKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return priorKey.call(this,b,w)+(V.active(b)?':shared-vector:'+K.REGISTRY_VERSION+':'+INTERIOR_REVISION+':'+K.STAGE_STYLES[b.honroStage].palette:'');};
G.HonroPaintedPresentation.providers.unshift({id:'shared-vector-campaign',active:V.active,naturalEdges:true,cachedWorld:true});
Object.assign(V,{prepare,stats:b=>{const q=prepare(b);return{stage:b.honroStage,style:q.style.place,palette:q.style.palette,polygons:q.records.size,parts:q.partCount,interior:q.interior,builds:q.builds,missingAssets:[],domain:G.HonroTerrainDomain.active(b),visualDomain:D.active(displayBattle(b)),scenery:q.scenery.nodes.length};}});
})(globalThis);
