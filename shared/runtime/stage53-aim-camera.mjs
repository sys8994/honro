// Inert until a trusted, already-successful native 53 gate. No Battle writes.
export function createStage53AimCamera(G,{now=()=>performance.now()}={}){
 const bindings=new WeakMap();
 function attach({app,engine:e,scene,permit,verify}){
  const receipt=verify(permit,app,e,scene);
  if(!receipt||receipt.stage!==53||receipt.engine!==e||receipt.battle!==e.b||receipt.scene!==scene||e.b.honroStage!==53||e.b.honroAuthoredId!=='contact-q-03'||bindings.has(scene))return null;
  const b=e.b,native=scene.render, actor=e.active, B=G.HonroBounds, support='upper-threshold-footing';
  let armed=false,last=null;
  const same=()=>app.scene===scene&&app.engine===e&&app.stageId===53&&app.screen==='battle'&&!app.embedded&&!app.debugMode&&!app.customMap&&!app.training&&verify(permit,app,e,scene)===receipt&&e.b===b&&e.active===actor&&actor.id==='p-mage'&&actor.side===0&&!actor.dead;
  const ground=(x,y)=>e.contactSurface(x,y-4,y+4)?.t.id===support;
  function signal(result){
   if(!same()||result?.ok!==true||result.grounded!==true||result.destination!==12||Math.abs(actor.x-2640)>1||!e.grounded(actor)||!ground(actor.x,actor.y)||b.phase!=='aim'||b.projectiles?.length)return false;
   armed=true;return true;
  }
  const wrap=function(engine,dt=0,selected='',power=.6,charging=false,effectDt=dt,paused=false){
   const draw=()=>native.call(this,engine,dt,selected,power,charging,effectDt,paused);
   if(!armed||this!==scene||engine!==e||!same())return draw();
   const lease=G.HonroAttackCamera?.status?.(scene), t=now();
   if(scene.manual||lease?.manual||lease?.gesture||app.contacts?.size){armed=false;last={reason:'manual-owner'};return draw();}
   if(b.phase!=='aim'||b.projectiles?.length||!e.grounded(actor)||!ground(actor.x,actor.y)||b.honroState?.flags?.['act6.innerStakeAReady']){
    armed=false;last={reason:'native-action'};return draw();
   }
   if(paused||charging||app.done||app.dialogue||app.modal?.classList?.contains('open')||scene.storyFrame||scene.storyTween||scene.storyFrozen||scene.goalFocus||scene.editorView||scene.skillPreview||scene.focusUntil>t||scene.speakerUntil>t||G.HonroReinforcementCamera?.active?.(scene)){
    last={reason:'other-native-owner'};return draw();
   }
   const rect=scene.canvas?.getBoundingClientRect?.(), w=rect?.width??scene.canvas?.clientWidth,h=rect?.height??scene.canvas?.clientHeight;
   if(!(w>=300&&h>=330)||actor.x<2520||actor.x>2700){armed=false;return draw();}
   const anchors=[2450,2600].map(x=>({x,y:G.HONRO_CORE.topAt(b.terrain.find(p=>p.id===support),x)}));
   if(!anchors.every(({x,y})=>Number.isFinite(y)&&ground(x,y))){armed=false;return draw();}
   const left=Math.min(...anchors.map(p=>p.x),actor.x-actor.r),right=Math.max(...anchors.map(p=>p.x),actor.x+actor.r);
   const top=Math.min(...anchors.map(p=>p.y),actor.y-actor.h),bottom=Math.max(...anchors.map(p=>p.y),actor.y);
   const z=Math.min(scene.scale,(w-100)/(right-left)), limits=B.zoomLimits(w);
   if(!(z>=limits.min&&z<=limits.max)){armed=false;return draw();}
   const goal={x:(left+right)*.5,y:(top+bottom)*.5+h*.045/z,scale:z,canvas:scene.canvas};
   B.constrain(goal,b);
   const sx=x=>w/2+(x-goal.x)*z,sy=y=>h/2+(y-goal.y)*z;
   if(sx(left)<36||sx(right)>w-36||sy(top)<105||sy(bottom)>h-136){armed=false;return draw();}
   // Native paired-gate movement is discontinuous; its first permitted paint
   // must use the destination, rather than flying across 2,215 WU of blank air.
   scene.x=goal.x;scene.y=goal.y;scene.scale=z;
   last={reason:'verified-passage-destination',actor:{x:sx(actor.x),head:sy(actor.y-actor.h),feet:sy(actor.y)},target:anchors.map(({x,y})=>({x:sx(x),y:sy(y)})),camera:{x:scene.x,y:scene.y,z}};
   const originalManual=scene.manual;
   try{scene.manual=true;return draw();}finally{scene.manual=originalManual;}
  };
  scene.render=wrap;
  const api=Object.freeze({signal,read:()=>last,detach(){if(scene.render===wrap)scene.render=native;armed=false;bindings.delete(scene);}});
  bindings.set(scene,api);return api;
 }
 return Object.freeze({attach});
}
