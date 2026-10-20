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
const INTERIOR_REVISION='ferry-authored-sections-35',M=G.HonroVectorCampaignMaterials;

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
  records.set(t.id,{t,path,edges,topPlane,tops,faces,asset,mat,points,historical:M.historical(t,b)});
 }
 const sculptures=M.makeSculptures(b,records);
 const scenery=(style.scenery||[]).map(part=>{
  const anchor=b.honroMapAnchors?.[part.anchor]||{},x=part.x??anchor.x,support=b.terrain.find(t=>t.id===part.support&&!t.broken);if(!support||!Number.isFinite(x))return null;
  return{id:part.id,assetId:part.assetId,palette:style.palette,transform:{x,y:C.topAt(support,x,anchor.y??support.y),scale:part.scale}};
 }).filter(Boolean);
 const sceneryScene=K.compileScene({instances:scenery});
 for(const part of style.scenery||[])for(const [support,ids] of Object.entries(part.breakLinks||{}))if(b.terrain.find(t=>t.id===support)?.broken)sceneryScene.nodes=sceneryScene.nodes.filter(node=>!ids.some(id=>node.id===part.id+'/'+id));
 const architecture=K.compileArchitecture(style.architecture,b,{...K,palette:style.palette},C);for(const group of architecture.groups)if(group.clipD)group.clip=new Path2D(group.clipD);
 q={key,source,records,style,architecture,scenery:sceneryScene,sculptures,partCount:sculptures.length,builds:(q?.builds||0)+1};cache.set(b,q);return q;
}
function paintTerrain(c,t,b){
 const live=b.terrain.find(v=>v.id===t.id);if(t.broken||live?.broken)return;
 const q=prepare(b),r=q.records.get(t.id);if(!r||q.architecture.covered.has(t.id))return;
 c.save();c.fillStyle=canvasPaint(c,K.paintFor(r.asset,'body',q.style.palette));c.fill(r.path);
 c.save();c.clip(r.path);
 if(['cave','ink'].includes(q.style.palette)&&r.mat==='rock'&&r.t.y>=0&&r.t.h>900){const top=Math.min(...r.tops.map(f=>Math.min(f.a.y,f.z.y)));if(Number.isFinite(top)){const shade=K.paintFor(r.asset,'shade',q.style.palette).value,g=c.createLinearGradient(0,top+250,0,top+1450);g.addColorStop(0,shade+'00');g.addColorStop(1,shade+'66');c.fillStyle=g;c.fill(r.path);}}
 const naturalSurface=b.honroStage===3&&t.id==='ferry-ground'&&G.HonroStage3VectorFront?.surface;
 const view=contextView(c);M.original(c,r.historical);if(!t.oneWay&&['earth','rock'].includes(r.mat))M.front(c,b,q.style,view);if(!t.oneWay&&r.mat!=='wood'&&r.mat!=='water')M.sculptures(c,q.sculptures,q.style.palette,view);if(r.mat==='earth')M.roots(c,b,q.style);
 if(!naturalSurface){c.save();c.globalAlpha*=r.mat==='earth'?.60:.28;c.fillStyle=r.mat==='earth'?'#a49470':canvasPaint(c,K.paintFor(r.asset,'light',q.style.palette));c.fill(r.topPlane);c.restore();}
 // Small, broad grain faces follow a timber member; no repeating texture pass.
 if(r.mat==='wood'){c.strokeStyle=K.paintFor(r.asset,'light',q.style.palette).stops[0][1];c.globalAlpha=.22;c.lineWidth=3;const top=r.tops[0];if(top){c.beginPath();c.moveTo(top.a.x+6,top.a.y+8);c.quadraticCurveTo((top.a.x+top.z.x)/2,(top.a.y+top.z.y)/2+13,top.z.x-6,top.z.y+8);c.stroke();}}c.restore();
 // Quiet edge cue follows the exact exposed polygon. The debug toggle owns the strong outline.
 if(naturalSurface)naturalSurface(c,b,view);else{c.strokeStyle=K.paintFor(r.asset,'light',q.style.palette).stops[0][1];c.globalAlpha=.21;c.lineWidth=t.oneWay?2.4:1.6;c.lineJoin='round';c.stroke(r.edges);}c.restore();
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
const priorLayer=S._landmarkLayer;S._landmarkLayer=function(c,list,layer){priorLayer.call(this,c,list,layer);if(layer==='structural-back'&&V.active(this.battle)){const q=prepare(this.battle),view=contextView(c);M.rear(c,this.battle,view);M.trees(c,this.battle,q.style.scenery||[],view);if(!(q.style.scenery||[]).some(p=>/^pine\./.test(p.assetId)))K.drawCanvas(c,q.scenery,{viewBounds:view});for(const group of q.architecture.groups){c.save();if(group.clip)c.clip(group.clip);K.drawCanvas(c,group.compiled,{viewBounds:view});c.restore();}}};
const priorTerrain=S.terrain;S.terrain=function(c,t){if(!V.active(this.battle)||t.honroQuestTarget||t.device||t.honroSeal||([18,19].includes(this.battle.honroStage)&&/^sb-(bell-|inner-)/.test(t.id))||(this.battle.honroStage===30&&['sf-settled-barge','sf-outbank-screen'].includes(t.id)))return priorTerrain.call(this,c,t);paintTerrain(c,t,this.battle);G.HonroCityGateArt?.drawTerrain(c,t,this.battle);};
const priorLandmark=S.landmark;S.landmark=function(c,l){if(V.active(this.battle)&&G.HonroCityGateArt?.draw(c,l,this.battle))return;if(V.active(this.battle)&&l.asset?.vector&&/^act1-scene:/.test(l.asset.id)){G.HonroVectorArt.draw(c,l.asset,l);return;}const replacementScene=replacement(l,this.battle);if(replacementScene){K.drawCanvas(c,replacementScene,{viewBounds:contextView(c)});return;}return priorLandmark.call(this,c,l);};
const targetArt=new WeakMap(),priorUnitBody=S.unitBody;
S.unitBody=function(c,u,charge=0){const id=V.active(this.battle)&&K.STAGE_STYLES[this.battle.honroStage].unitArt?.[u.id];if(!id)return priorUnitBody.call(this,c,u,charge);const asset=K.ASSETS[id],key=[id,u.x,u.y,u.h,K.REGISTRY_VERSION].join(':');let q=targetArt.get(u);if(q?.key!==key){q={key,compiled:K.compileScene({instances:[{id:u.id,assetId:id,palette:K.STAGE_STYLES[this.battle.honroStage].palette,transform:{x:u.x,y:u.y,scale:u.h/asset.bounds.h}}]})};targetArt.set(u,q);}K.drawCanvas(c,q.compiled);};
const priorVisible=S._landmarkVisible;S._landmarkVisible=function(l,view,pad=40){const q=replacement(l,this.battle);if(!q)return priorVisible.call(this,l,view,pad);return q.nodes.some(n=>n.bounds.x+n.bounds.w+pad>=view.left&&n.bounds.x-pad<=view.right&&n.bounds.y+n.bounds.h+pad>=view.top&&n.bounds.y-pad<=view.bottom);};
const priorBackground=S.background;S.background=function(c,w,h,b){if(V.active(b)&&b.honroStage===2&&b.honroMap?.stage2ImageFirst)G.HonroStage2ImageFirstArt.overwatch(this,w,h,b);const style=V.active(b)&&K.STAGE_STYLES[b.honroStage],far=style?.far,P=G.HonroPaintedPilots;if(!far||!P)return priorBackground.call(this,c,w,h,b);P.request([far]);if(!P.ready(far)){const raw=G.HonroVisualStyle.raw(c);raw.fillStyle='#59666a';raw.fillRect(0,0,w,h);return;}const image=P.images[far],raw=G.HonroVisualStyle.raw(c),scale=Math.max(w/image.naturalWidth,h/image.naturalHeight),width=image.naturalWidth*scale,height=image.naturalHeight*scale;raw.drawImage(image,(w-width)/2,(h-height)/2,width,height);raw.fillStyle='#334a502b';raw.fillRect(0,0,w,h);};
const priorKey=S._worldCacheKey;S._worldCacheKey=function(b,w){return priorKey.call(this,b,w)+(V.active(b)?':shared-vector:'+K.REGISTRY_VERSION+':'+INTERIOR_REVISION+':'+K.STAGE_STYLES[b.honroStage].palette:'');};
G.HonroPaintedPresentation.providers.unshift({id:'shared-vector-campaign',active:V.active,naturalEdges:true,cachedWorld:true});
Object.assign(V,{prepare,stats:b=>{const q=prepare(b);return{stage:b.honroStage,style:q.style.place,palette:q.style.palette,polygons:q.records.size,parts:q.partCount,materialRevision:INTERIOR_REVISION,builds:q.builds,missingAssets:[],domain:G.HonroTerrainDomain.active(b),visualDomain:D.active(displayBattle(b)),scenery:q.scenery.nodes.length};}});
})(globalThis);
