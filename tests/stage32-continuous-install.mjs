export function installContinuousPlanePrototype(){
 const api=globalThis.HonroStage32CorrectionPlaneTest;if(!api)throw Error('Plane candidate absent');
 const sceneProto=globalThis.HonroScene.prototype,originalRender=sceneProto.render,release=sceneProto._releaseRasterCanvas,canvasProto=CanvasRenderingContext2D.prototype,drawImage=canvasProto.drawImage;
 let composing=false,active=false;
 sceneProto.render=function(...args){const prior=active,previous=globalThis.__stage32ActualScreenScale;active=args[0]?.battle?.honroStage===32; // fallback stage binding below is explicitly set by fixture
  active=active||globalThis.__stage32PlaneFixtureStage===32;globalThis.__stage32ActualScreenScale=this.scale;try{return originalRender.apply(this,args);}finally{active=prior;globalThis.__stage32ActualScreenScale=previous;}};
 sceneProto._releaseRasterCanvas=function(canvas,...args){api.release(canvas);return release.call(this,canvas,...args);};
 canvasProto.drawImage=function(image,...args){const result=drawImage.call(this,image,...args);if(active&&!composing){const plane=api.get(image),z=globalThis.__stage32ActualScreenScale,t=Math.max(0,Math.min(1,(z-.25)/.20)),weight=t*t*(3-2*t);if(plane&&weight){const start=performance.now();composing=true;this.save();try{this.globalAlpha*=weight;drawImage.call(this,plane,...args);}finally{this.restore();composing=false;}api.composed(performance.now()-start);}}return result;};
 return {stats:()=>api.stats(),scope:'Test-only corrected tile plane, same original numeric blit args and clipping. Actual Scene.scale weight; no weight in terrain cache key. Potential later-static-foreground occlusion must be independently checked.'};
}
