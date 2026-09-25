(function(G){'use strict';
G.HonroCamera={
 world(view,width,height,x,y){const z=view.scale??view.zoom;return{x:view.x+(x-width/2)/z,y:view.y+(y-height/2)/z};},
 screen(view,width,height,p){const z=view.scale??view.zoom;return{x:(p.x-view.x)*z+width/2,y:(p.y-view.y)*z+height/2};},
 axis(center,span,min,max){return span>=max-min?(min+max)/2:Math.max(min+span/2,Math.min(max-span/2,center));}
};
})(globalThis);
