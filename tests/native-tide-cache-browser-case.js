/** Actual Stage 33 tide observer and Scene screen cache; explicit test round. */
async ()=>{
 await HonroCampaignLoader.ensureStage(33);const a=HonroApp;a.frame=()=>{};a.profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(HONRO_PROJECT.stages[32])};for(let i=1;i<33;i++)a.profile.cleared[i]={};a.profile.settings.sound=false;a.profile.settings.music=false;a.launch(33);for(let i=0;a.dialogue&&i<100;i++)HonroStory.finish(a);a.close();a.turnNotice=null;
 const e=a.engine,b=e.b,P=HonroAct4TerrainPreview,q=P.eventAPI.memory(b),scene=a.scene;delete q.tide;delete q.waterVisualLevel;b.round=1;b.side=0;b.phase='aim';P.coast.tide(b);
 const first=q.tide?.surface;if(!Number.isFinite(first))throw Error('missing initial tide');scene.battle=b;Object.assign(scene,{x:1800,y:2100,scale:.65,manual:true});const {w,h,d}=scene.size(b),ctx=scene.ctx;
 const paint=()=>{ctx.setTransform(d*scene.scale,0,0,d*scene.scale,d*(w/2-scene.x*scene.scale),d*(h/2-scene.y*scene.scale));scene._drawStaticWorldCached(ctx,b,w,h)};
 paint();paint();paint();const old=scene._screenWorldCache?.canvas,version=b.sceneVersion;if(!old)throw Error('no settled tide cache');
 b.round=b.honroAct4Design.tide.warningRound;P.coast.tide(b);if(!(b.sceneVersion>version)||q.tide.surface===first)throw Error('tide did not advance geometry/version');paint();if(scene._screenWorldCache?.canvas===old)throw Error('tide change reused stale cache');paint();if(!scene._screenWorldCache?.canvas)throw Error('tide cache did not rebuild');
 const zones=(b.honroSurfaceZones||[]).filter(z=>String(z.id).startsWith('a4-live-'));return {first,second:q.tide.surface,oldVersion:version,newVersion:b.sceneVersion,zoneCount:zones.length,oldCacheReleased:old.width===1,cacheRebuilt:true,scope:'actual Stage 33 tide with explicit round; no mission proof'};
}
