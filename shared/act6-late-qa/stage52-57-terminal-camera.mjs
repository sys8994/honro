const IDs={52:'qa-act6-r4-02',53:'contact-q-03',56:'qa-act6-06',57:'a6-local-playable-07'};
const preference={52:['archer','mage','knight','occultist'],53:['mage'],56:['mage'],57:['mage','occultist','knight','archer']};
const bounds=rows=>({l:Math.min(...rows.map(u=>u.x-u.r)),r:Math.max(...rows.map(u=>u.x+u.r)),t:Math.min(...rows.map(u=>u.y-u.h)),b:Math.max(...rows.map(u=>u.y))});
export function attachEarlyAct6TerminalCamera({G,app,engine:e,scene,permit,verify}={}){
 const b=e?.b, stage=b?.honroStage,r=verify?.(permit,app,e,scene), B=G?.HonroBounds;
 if(!r||r.stage!==stage||r.battle!==b||r.scene!==scene||!IDs[stage]||b.honroAuthoredId!==IDs[stage]||
  b.mode!=='act6-isolated'||b.honroMapOrigin!=='act6-qa'||b.honroCustom!==false||!B)return null;
 const native=scene.render;
 let applied=false,released=false,metrics=null;
 const own=()=>app.stageId===stage&&app.engine===e&&app.scene===scene&&e.b===b&&verify(permit,app,e,scene)===r;
 function render(eng,dt,sel,pow,charging,effect,paused){
  const draw=()=>native.call(this,eng,dt,sel,pow,charging,effect,paused);
  if(released||this!==scene||eng!==e||!own()||b.phase!=='won'||!r.won()||b.projectiles?.length)return draw();
  const lease=G.HonroAttackCamera?.status?.(scene),now=performance.now();
  if(scene.manual||app.contacts?.size||lease?.manual||lease?.gesture){released=true;metrics={reason:'manual-owner'};return draw();}
  if(app.dialogue||app.modal?.classList?.contains('open')||scene.storyFrame||scene.storyFrozen||scene.storyTween||
    scene.skillPreview||scene.editorView||scene.goalFocus||charging||scene.focusUntil>now||scene.speakerUntil>now||G.HonroReinforcementCamera?.active?.(scene))return draw();
  if(!applied){
   const {width:w,height:h}=scene.canvas.getBoundingClientRect();
   if(w<300||h<330)return draw();
   const allies=b.units.filter(u=>u.side===0&&!u.dead&&!u.summoned&&u.hp>0&&e.unit(u.id)===u&&e.grounded(u)&&e.contactSurface(u.x,u.y-4,u.y+4)?.t);
   const lead=preference[stage].map(k=>allies.find(u=>u.cls===k)).find(Boolean);
   if(!lead)return draw();
   const zFloor=Math.max(.55,B.zoomLimits(w).min), zMax=Math.max(zFloor,Math.min(scene.scale,B.zoomLimits(w).max));
   const fit=({l,r,t,b})=>Math.min((w-90)/(r-l),(h-240)/(b-t));
   const group=[lead];
   for(const u of allies.filter(u=>u!==lead).sort((a,c)=>Math.hypot(a.x-lead.x,a.y-lead.y)-Math.hypot(c.x-lead.x,c.y-lead.y)))
    if(fit(bounds([...group,u]))>=zFloor)group.push(u);
   const a=bounds(group), z=Math.min(zMax,fit(a));
   if(!Number.isFinite(z)||z<zFloor)return draw();
   const proposed={x:(a.l+a.r)/2,y:(a.t+a.b)/2-h*.08/z,scale:z,canvas:scene.canvas};
   B.constrain(proposed,b);
   const px=x=>w/2+(x-proposed.x)*z,py=y=>h/2+(y-proposed.y)*z;
   if(px(a.l)<32||px(a.r)>w-32||py(a.t)<96||py(a.b)>h-116)return draw();
   Object.assign(scene,{x:proposed.x,y:proposed.y,scale:z});
   metrics={reason:'won-native-grounded',stage,lead:lead.id,z,players:group.map(u=>({id:u.id,x:px(u.x),head:py(u.y-u.h),feet:py(u.y),support:e.contactSurface(u.x,u.y-4,u.y+4).t.id}))};
   applied=true;
  }
  const old=scene.manual;try{scene.manual=true;return draw();}finally{scene.manual=old;}
 }
 scene.render=render;
 return Object.freeze({read:()=>metrics,detach(){released=true;if(scene.render===render)scene.render=native;}});
}
