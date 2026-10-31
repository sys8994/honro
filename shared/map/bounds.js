(function(G){'use strict';
// Simulation keeps its existing 0..width / 0..height coordinates. Neither
// camera focus nor visual coverage is a collision or projectile boundary.
const POLICY=Object.freeze({desiredTacticalWorldWidth:6800,minActorScreenHeight:3.75,
 smallestActorWorldHeight:66,maxZoom:1.65,focusSide:320,focusAbove:1800,focusBelow:240,overscanMargin:240});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function play(source){return source.playBounds||source.honroPlayBounds||{left:0,top:0,right:source.width,bottom:source.height};}
function terrain(source){return source.terrainBounds||source.honroTerrainBounds||play(source);}
function focus(source){const p=play(source),authored=(source.camera||source.honroCamera)?.focusBounds;
 return authored?{...authored}:{left:p.left-POLICY.focusSide,top:p.top-POLICY.focusAbove,right:p.right+POLICY.focusSide,bottom:p.bottom+POLICY.focusBelow};}
function zoomLimits(width){const tactical=Math.max(1,width)/POLICY.desiredTacticalWorldWidth,
 readability=POLICY.minActorScreenHeight/POLICY.smallestActorWorldHeight;
 return{min:Math.min(POLICY.maxZoom,Math.max(tactical,readability)),max:POLICY.maxZoom,tactical,readability};}
function viewport(view,w,h){const z=view.scale??view.zoom;return{left:view.x-w/(2*z),right:view.x+w/(2*z),top:view.y-h/(2*z),bottom:view.y+h/(2*z)};}
function visual(source,w,h,scale=zoomLimits(w).min){const f=focus(source),z=Math.min(scale,zoomLimits(w).min),
 mx=w/(2*z)+POLICY.overscanMargin,my=h/(2*z)+POLICY.overscanMargin;
 return{left:f.left-mx,right:f.right+mx,top:f.top-my,bottom:f.bottom+my};}
// Optional visual framing only. The declared art rectangle must contain all
// play positions; malformed options fail closed to the unchanged focus policy.
function containment(source){const v=(source.camera||source.honroCamera)?.viewportContainment,p=play(source);
 if(!v||v.version!==1||!['left','right','top','bottom'].every(k=>Number.isFinite(v[k]))||v.left>=v.right||v.top>=v.bottom||!Number.isFinite(v.right-v.left)||!Number.isFinite(v.bottom-v.top)||v.left>p.left||v.right<p.right||v.top>p.top||v.bottom<p.bottom)return null;
 return v;
}
function constrain(view,source){const f=focus(source);view.x=clamp(view.x,f.left,f.right);view.y=clamp(view.y,f.top,f.bottom);
 const a=containment(source),z=view.scale??view.zoom;if(!a||!Number.isFinite(z)||z<=0)return view;
 let r;try{r=view.canvas?.getBoundingClientRect?.();}catch{return view;}
 const w=r?.width??view.canvas?.clientWidth,h=r?.height??view.canvas?.clientHeight;
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)return view;
 const hw=w/(2*z),hh=h/(2*z);
 // Keep both axes of the existing overview/pinch policy when the complete
 // viewport cannot fit. Never increase zoom or change story ownership here.
 if(hw*2>a.right-a.left||hh*2>a.bottom-a.top)return view;
 view.x=clamp(view.x,a.left+hw,a.right-hw);view.y=clamp(view.y,a.top+hh,a.bottom-hh);return view;
}
function validate(st){const p0=play(st);if(p0.left!==0||p0.top!==0||p0.right!==st.width||p0.bottom!==st.height)return[{level:'err',text:st.id+': playBounds must match the stable simulation coordinate system'}];const option=st.camera?.viewportContainment,errors=option!==undefined&&!containment(st)?[{level:'err',text:st.id+': invalid camera.viewportContainment'}]:[];const f=st.camera?.focusBounds;if(!f)return errors;const p=play(st),valid=['left','right','top','bottom'].every(k=>Number.isFinite(f[k]))&&f.left<=p.left&&f.right>=p.right&&f.top<=p.top&&f.bottom>=p.bottom;
 return valid?errors:[...errors,{level:'err',text:st.id+': camera.focusBounds must be finite and contain Play Bounds'}];}
G.HonroBounds={POLICY,play,terrain,focus,zoomLimits,viewport,visual,constrain,validate};
})(globalThis);
