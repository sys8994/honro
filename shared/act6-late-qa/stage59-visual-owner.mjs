const roles=['occultist','mage','knight','archer'], valid=u=>u&&u.side===0&&!u.dead&&!u.summoned&&u.hp>0;
const clamp=(x,l,h)=>Math.min(h,Math.max(l,x)), envelope=(uu)=>({l:Math.min(...uu.map(u=>u.x-u.r)),r:Math.max(...uu.map(u=>u.x+u.r)),t:Math.min(...uu.map(u=>u.y-u.h)),b:Math.max(...uu.map(u=>u.y))});
export function attachStage59Visual({G,app,engine:e,scene,permit,verify,image}={}){
 const b=e?.b, v=verify?.(permit,app,e,scene), B=G?.HonroBounds;
 if(!v||v.stage!==59||v.battle!==b||v.scene!==scene||app?.scene!==scene||app.engine!==e||
 b?.honroAuthoredId!=='stage-59'||b.honroStage!==59||b.mode!=='act6-isolated'||b.honroMapOrigin!=='act6-qa'||b.honroCustom!==false||
 typeof scene?.render!=='function'||typeof scene?.background!=='function'||!B)return null;
 const native=scene.render,bg=scene.background, living=b.units.filter(valid);
 if(living.length!==4||!roles.every(k=>living.some(u=>u.cls===k)))return null;
 let framed=false,last=null,farCount=0,detach=false;
 const own=()=>!detach&&app.stageId===59&&app.scene===scene&&app.engine===e&&e.b===b&&verify(permit,app,e,scene)===v;
 function paint(c,w,h,b0){
  const result=bg.call(this,c,w,h,b0);
  if(this!==scene||b0!==b||!own()||scene.editorView||!image||!image.complete||!(image.naturalWidth||image.width))return result;
  const imw=image.naturalWidth||image.width,imh=image.naturalHeight||image.height;
  if(imw!==1672||imh!==941)return result;
  // The pinned concept lives between the stock sky and the native rear/near
  // map passes. These are separate depth owners, not duplicated photo crops.
  const k=Math.max(w/imw,h/imh)*1.055, dw=imw*k,dh=imh*k;
  const u=clamp(.52+(scene.x/b.width-.5)*.24,.35,.7);
  c.save();try{c.globalAlpha=.80;c.drawImage(image,(w-dw)*u,(h-dh)*.48,dw,dh);farCount++;}finally{c.restore();}
  return result;
 }
 function render(eng,dt=0,selected='',power=.6,charging=false,effectDt=dt,paused=false){
  const draw=()=>native.call(this,eng,dt,selected,power,charging,effectDt,paused);
  if(this!==scene||eng!==e||!own()||b.phase!=='won'||!v.cleared()||b.projectiles?.length)return draw();
  const lease=G.HonroAttackCamera?.status?.(scene),t=performance.now();
  if(scene.manual||app.contacts?.size||lease?.manual||lease?.gesture){framed=true;last={reason:'manual'};return draw();}
  if(charging||app.dialogue||app.modal?.classList?.contains('open')||scene.storyFrame||scene.storyTween||scene.storyFrozen||
   scene.goalFocus||scene.skillPreview||scene.editorView||scene.focusUntil>t||scene.speakerUntil>t||G.HonroReinforcementCamera?.active?.(scene))return draw();
  if(!framed){
   const rc=scene.canvas.getBoundingClientRect(), w=rc.width,h=rc.height;
   const allies=living.filter(u=>valid(u)&&e.unit(u.id)===u&&e.grounded(u));
   if(!(w>=300&&h>=330)||!allies.length)return draw();
   // Sodan is the actual authored Garmjin placer. Nearest grounded teammates
   // join the shot only when they fit at a readable native zoom.
   const lead=roles.map(k=>allies.find(u=>u.cls===k)).find(Boolean);
   const sorted=allies.filter(u=>u!==lead).sort((u,z)=>Math.hypot(u.x-lead.x,u.y-lead.y)-Math.hypot(z.x-lead.x,z.y-lead.y));
   const group=[lead],zFloor=Math.max(.55,B.zoomLimits(w).min),zBase=clamp(scene.scale,zFloor,B.zoomLimits(w).max);
   const fit=({l,r,t,b})=>Math.min((w-96)/(r-l),(h-250)/(b-t));
   for(const u of sorted)if(fit(envelope([...group,u]))>=zFloor)group.push(u);
   const box=envelope(group), z=Math.min(zBase,fit(box));
   if(!Number.isFinite(z)||z<zFloor)return draw();
   const g={x:(box.l+box.r)/2,y:(box.t+box.b)/2-h*.08/z,scale:z,canvas:scene.canvas};
   B.constrain(g,b);
   const sx=x=>w/2+(x-g.x)*z,sy=y=>h/2+(y-g.y)*z;
   if(sx(box.l)<32||sx(box.r)>w-32||sy(box.t)<106||sy(box.b)>h-130)return draw();
   Object.assign(scene,{x:g.x,y:g.y,scale:z});framed=true;last={reason:'final-grounded-player-cluster',players:group.map(u=>({id:u.id,x:sx(u.x),head:sy(u.y-u.h),feet:sy(u.y),nativeHeight:u.h,contact:e.contactSurface(u.x,u.y-4,u.y+4)?.t.id})),zoom:z,view:[w,h]};
  }
  if(last?.reason!=='final-grounded-player-cluster')return draw();
  // Only the sealed result frame stays composed; stock flight/aim and manual
  // movement are never touched. Existing manual camera is always yielded.
  const previous=scene.manual;try{scene.manual=true;return draw();}finally{scene.manual=previous;}
 }
 scene.background=paint;scene.render=render;
 return Object.freeze({metrics:()=>({last,farCount}),detach(){if(detach)return;detach=true;if(scene.render===render)scene.render=native;if(scene.background===paint)scene.background=bg;}});
}
