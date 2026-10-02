(function(G){'use strict';
// Simulation keeps its existing 0..width / 0..height coordinates. Neither
// camera focus nor visual coverage is a collision or projectile boundary.
const POLICY=Object.freeze({desiredTacticalWorldWidth:4200,minActorScreenHeight:7,
 smallestActorWorldHeight:66,maxZoom:1.65,focusSide:320,focusAbove:1800,focusBelow:240,overscanMargin:240});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function play(source){return{left:0,top:0,right:source.width,bottom:source.height};}
function focus(source){const p=play(source),authored=(source.camera||source.honroCamera)?.focusBounds;
 return authored?{...authored}:{left:p.left-POLICY.focusSide,top:p.top-POLICY.focusAbove,right:p.right+POLICY.focusSide,bottom:p.bottom+POLICY.focusBelow};}
function zoomLimits(width){const tactical=Math.max(1,width)/POLICY.desiredTacticalWorldWidth,
 readability=POLICY.minActorScreenHeight/POLICY.smallestActorWorldHeight;
 return{min:Math.min(POLICY.maxZoom,Math.max(tactical,readability)),max:POLICY.maxZoom,tactical,readability};}
function viewport(view,w,h){const z=view.scale??view.zoom;return{left:view.x-w/(2*z),right:view.x+w/(2*z),top:view.y-h/(2*z),bottom:view.y+h/(2*z)};}
function visual(source,w,h,scale=zoomLimits(w).min){const f=focus(source),z=Math.min(scale,zoomLimits(w).min),
 mx=w/(2*z)+POLICY.overscanMargin,my=h/(2*z)+POLICY.overscanMargin;
 return{left:f.left-mx,right:f.right+mx,top:f.top-my,bottom:f.bottom+my};}
function constrain(view,source){const f=focus(source);view.x=clamp(view.x,f.left,f.right);view.y=clamp(view.y,f.top,f.bottom);return view;}
function validate(st){const f=st.camera?.focusBounds;if(!f)return[];const p=play(st),valid=['left','right','top','bottom'].every(k=>Number.isFinite(f[k]))&&f.left<=p.left&&f.right>=p.right&&f.top<=p.top&&f.bottom>=p.bottom;
 return valid?[]:[{level:'err',text:st.id+': camera.focusBounds must be finite and contain Play Bounds'}];}
G.HonroBounds={POLICY,play,focus,zoomLimits,viewport,visual,constrain,validate};
})(globalThis);
