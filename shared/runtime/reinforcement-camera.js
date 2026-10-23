(function(G){'use strict';
// Presentation state belongs to the Scene, never the saved battle. Observe the
// committed units, not spawn requests: blocked/retried/atomic spawns produce no
// camera target until their actual new IDs exist. Prime on mount/Continue.
const states=new WeakMap(),view=s=>({x:s.x,y:s.y,scale:s.scale,manual:s.manual});
// honroSpirit/spiritHidden describe damage/visibility of real combat enemies.
// Visual-only actors are explicit proxies; staging-hidden actors are not in units.
const enemy=u=>u.side===1&&u.summonKind!=='eater'&&!u.honroTrainingStation&&!u.honroObjectiveTarget&&!u.honroVisualOnly&&!u.enthrall&&!u.eaterCapturedBy&&!u.dead&&u.hp>0&&Number.isFinite(u.x)&&Number.isFinite(u.y);
function prime(scene,b){states.set(scene,{battle:b,seen:new Set(b.units.map(u=>u.id)),shot:null,manualUntil:0,lastView:view(scene)});}
function active(scene){return !!states.get(scene)?.shot;}
function resume(scene,now){
 // A concurrent dialogue/turn may have changed its target during the insert.
 // Resume its response from the last rendered frame, without an expired tween.
 const m=scene.storyFrame?.motion;if(m)Object.assign(m,{x:scene.x,y:scene.y,z:Math.log(scene.scale),vx:0,vy:0,vz:0,time:now});
 if(scene.storyTween)Object.assign(scene.storyTween,{from:view(scene),start:now});
}
function cancel(scene){const s=states.get(scene);if(!s)return;s.manualUntil=performance.now()+1900;if(!s.shot)return;s.shot=null;scene.focusUntil=scene.speakerUntil=0;resume(scene,performance.now());}
function frame(scene,units,w,h,original){
 const rect=G.HonroStoryFraming?.safeRect?.(scene)||{x:w*.06,y:h*.24,w:w*.88,h:h*.48};
 // Keep the tactical controls clear even without a dialogue panel.
 const bottom=Math.min(rect.y+rect.h,h*.76),height=Math.max(30,bottom-rect.y);
 const left=Math.min(...units.map(u=>u.x-Math.max(u.r||22,22)))-100,right=Math.max(...units.map(u=>u.x+Math.max(u.r||22,22)))+100;
 const top=Math.min(...units.map(u=>u.y-(u.h||80)-25))-75,base=Math.max(...units.map(u=>u.y+15))+75;
 // Never zoom in for a single enemy. Prefer at least 1,200 world units of
 // context, and zoom out enough to include every member of this new batch.
 const scale=Math.max(.025,Math.min(original.scale,.72,rect.w/1200,rect.w/(right-left),height/(base-top)));
 return{x:(left+right)/2-(rect.x+rect.w/2-w/2)/scale,y:(top+base)/2-(rect.y+height/2-h/2)/scale,scale};
}
function blend(scene,from,to,t){if(t<=0){Object.assign(scene,{x:from.x,y:from.y,scale:from.scale});return;}if(t>=1){Object.assign(scene,{x:to.x,y:to.y,scale:to.scale});return;}const k=t*t*(3-2*t);scene.x=from.x+(to.x-from.x)*k;scene.y=from.y+(to.y-from.y)*k;scene.scale=Math.exp(Math.log(from.scale)+(Math.log(to.scale)-Math.log(from.scale))*k);}
function update(scene,e,w,h,now=performance.now()){
 const b=e.b;let s=states.get(scene);if(!s||s.battle!==b){prime(scene,b);return false;}
 const added=[],present=new Set();for(const u of b.units){if(!s.seen.has(u.id)&&enemy(u))added.push(u.id);present.add(u.id);}s.seen=present;
 if(scene.editorView||scene.skillPreview||b.mode==='practice'){s.shot=null;return false;}
 if(now<s.manualUntil){s.shot=null;s.manualHeld=true;return true;}
 if(s.manualHeld){s.manualHeld=false;resume(scene,now);}
 if(added.length){
  const old=s.shot,merge=old&&old.phase!=='return'&&now-old.started<450;
  s.shot={ids:merge?[...new Set([...old.ids,...added])]:added,original:old?.original||s.lastView||view(scene),from:view(scene),started:now,phase:'show'};
 }
 const q=s.shot;if(!q)return false;
 const reduced=G.matchMedia?.('(prefers-reduced-motion: reduce)').matches,pan=reduced?1:420;
 const units=b.units.filter(u=>q.ids.includes(u.id)&&enemy(u));
 if(q.phase==='show'&&(!units.length||now-q.started>=1500||['won','lost'].includes(b.phase))){q.phase='return';q.from=view(scene);q.started=now;}
 if(q.phase==='show')blend(scene,q.from,frame(scene,units,w,h,q.original),Math.min(1,(now-q.started)/pan));
 else{
  // Explicit story framing resumes smoothly, otherwise restore the player's
  // exact pre-insert view and its manual/follow mode. No target fallback.
  let to=scene.storyFrame?G.HonroStoryFraming.targetFrame(scene,e)?.camera:null;
  if(!to&&scene.storyTween?.kind==='static')to=scene.storyTween.to;
  blend(scene,q.from,to||q.original,Math.min(1,(now-q.started)/pan));
  if(now-q.started>=pan){s.shot=null;scene.manual=scene.storyFrame?true:scene.storyFrozen?false:q.original.manual;resume(scene,now);}
 }
 return true;
}
G.HonroReinforcementCamera={prime,update,active,cancel,frame,checkpoint:scene=>{const s=states.get(scene);if(s)s.lastView=view(scene);},blocksFocus:scene=>active(scene)||performance.now()<(states.get(scene)?.manualUntil||0),controlView:scene=>{const q=states.get(scene)?.shot;return q?{...q.original}:null;}};
})(globalThis);
