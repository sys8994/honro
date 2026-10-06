(function(G){'use strict';
G.HonroCamera={
 // Keep the established tall-view framing, but bound the upward offset in
 // screen pixels so a short landscape canvas cannot put the actor below it.
 followY(unit,height,scale){return unit.y-Math.min(unit.h*2,Math.max(1,height)*.28/Math.max(.001,scale));},
 // On an automatic resize, leave the upper 30% clear for the battle header.
 // The existing follow target puts the feet at or above 78%; protect the
 // actual painted stature plus its health bar in the remaining 48% band.
 fitFollowScale(unit,height,scale){const stature=G.HonroPartyPresentationHeight?.(unit)||unit.h;return Math.min(scale,Math.max(1,height)*.48/Math.max(1,stature+16));},
 world(view,width,height,x,y){const z=view.scale??view.zoom;return{x:view.x+(x-width/2)/z,y:view.y+(y-height/2)/z};},
 screen(view,width,height,p){const z=view.scale??view.zoom;return{x:(p.x-view.x)*z+width/2,y:(p.y-view.y)*z+height/2};},
 axis(center,span,min,max){return span>=max-min?(min+max)/2:Math.max(min+span/2,Math.min(max-span/2,center));}
};
})(globalThis);
