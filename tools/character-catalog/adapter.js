(function(G){'use strict';
const scenes=new WeakMap(),partyRenderers=new Map();
function setup(canvas){let scene=scenes.get(canvas);if(!scene){scene=new G.HonroScene(canvas);scene.partyVisual=new G.HonroPartyVisual(G.HONRO_PARTY,G.HonroVectorRig,scene.archerVisual);scenes.set(canvas,scene);}return scene;}
function draw(canvas,row,{phase=0,motion='idle',mode='scene',facing=1,light=false,hidden=false,pixels,clear=true,x,y}={}){
 const width=canvas.clientWidth||canvas.width,height=canvas.clientHeight||canvas.height,dpr=Math.min(devicePixelRatio||1,2);
 if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
 const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);if(clear){c.clearRect(0,0,width,height);if(light){c.fillStyle='#b9baaa';c.fillRect(0,0,width,height);}}
 const asset=G.HONRO_MONSTERS.assets[row.id]||G.HONRO_ACTORS.assets[row.id],ratioW=asset?asset.viewBox[2]/asset.baseHeight:row.id==='hoist'?1.6:row.id==='waterwheel'?1.2:row.excluded?0.8:1.5,ratioH=asset?asset.viewBox[3]/asset.baseHeight:row.id==='hoist'?1.8:1.3;
 const size=pixels||Math.min(height*.62/ratioH,width*.72/ratioW),foot=y??height*.86,cx=x??width/2,t=phase*(row.clips.find(c=>c.id===motion)?.duration||3);
 const u=structuredClone(row.unit);Object.assign(u,{x:row.context?u.x:0,y:row.context?u.y:0,facing,dead:false,eaterCapturedBy:undefined,angle:facing===1?0:180,anim:motion==='attack'?1-phase*.55:0,hurt:motion==='hit'?.7-phase*.29:0,moving:motion==='move'?1:0,jumping:motion==='jump_fall',airborne:motion==='jump_fall',vy:motion==='jump_fall'?(phase<.5?-200:200):0,walkPhase:phase*20,portraitOnly:false,spiritHidden:hidden,manifested:!hidden});
 c.save();c.translate(cx,foot);
 if(mode==='clip'&&row.layer==='현행 전용 벡터'){
  if(G.HONRO_PARTY[row.id]){if(!partyRenderers.has(row.id))partyRenderers.set(row.id,G.HonroVectorRig.createCanvasRenderer(G.HONRO_PARTY[row.id]));const a=G.HONRO_PARTY[row.id];partyRenderers.get(row.id).draw(c,{x:0,y:0,height:size*a.canvas.visualHeight/a.canvas.presentationHeight,animation:motion,time:phase,normalized:true,facing});}
  else{const v=G.HONRO_MONSTERS.assets[row.id]?G.HonroMonsterVisual:G.HonroActorVisual,a=v.assets[row.id],state=motion==='idle'?{}:motion==='move'?{move:true}:{[motion==='jump_fall'?'jump':motion]:phase};c.scale(size/a.baseHeight*facing,size/a.baseHeight);v.draw(c,row.id,{time:t,state,pixels:size});}
 }else{
  const scene=setup(canvas),presentation=row.type==='호환 그림'?u.h:(G.HonroPartyPresentationHeight?.(u)||u.h),scale=size/presentation;
  scene.time=t;scene.walkTime=t;scene.scale=scale;scene.skillPreview=true;
  const b={units:[u],projectiles:[],terrain:[],honroState:{act2:{}},honroStaging:{hidden:{}},honroStage:row.acts?.includes(2)?18:1,active:!hidden?u.id:'catalog-observer',round:1,sceneVersion:0};
  if(row.context)Object.assign(b,structuredClone(row.context),{units:[u],active:u.id,terrain:[]});
  if(row.context){const st=G.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===b.honroStage);b.width??=st.width;b.height??=st.height;}
  scene.battle=b;scene.actorEngine={b};scene.x=u.x;scene.y=u.y;
  const visuals=scene.partyVisual.visuals;
  for(const v of Object.values(visuals)){v.time=t;const s=v.state(u);s.releaseAt=motion==='attack'?t-phase*.56:-Infinity;s.hitAt=motion==='hit'?t-phase*.3:-Infinity;s.walkCycle=phase;s.selectedSkill=u.cls==='archer'?'A01':u.cls==='mage'?'M01':u.cls==='knight'?'S00':'O01';s.releaseSkill=s.selectedSkill;}
  c.scale(scale,scale);if(row.context)c.translate(-u.x,-u.y);scene.unit(c,u,false,0);
 }
 c.restore();return canvas;
}
G.HonroCatalogRenderer={draw};
})(globalThis);
