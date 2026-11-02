/** Executed in a real browser after the production app is loaded. */
async ({stage,width,height,mode})=>{
 await HonroCampaignLoader.ensureStage(stage);
 const a=HonroApp;a.frame=()=>{};a.profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(HONRO_PROJECT.stages[stage-1])};
 for(let i=1;i<stage;i++)a.profile.cleared[i]={};a.profile.settings.sound=false;a.profile.settings.music=false;
 a.launch(stage);for(let i=0;a.dialogue&&i<100;i++)HonroStory.finish(a);a.close();a.turnNotice=null;
 const e=a.engine,b=e.b,s=a.scene,u=e.active;Object.assign(s,{x:stage===11?2790:u.x+140,y:stage===11?5970:u.y-150,scale:width<900?.48:.82,manual:true,time:2,storyFrame:null,storyTween:null,goalFocus:null,cinematic:null});
 // Decode the exact fallback image requested by the renderer before any pixel comparison.
 const image=HonroAct1Background.imageFor(stage);
 const manifest=HonroAuthoredFarArt.manifest,spec=manifest?.stages?.[stage];
 if(image){await image.decode();if(!image.complete||image.naturalWidth<=0||!HonroAct1Background.ready(stage))throw Error('Fallback background did not decode');}
 else if(!spec)throw Error('No applicable background image');
 if(spec){const until=performance.now()+15000;while(!HonroAuthoredFarArt.ready(stage,b.honroPreviewFar,b)){if(performance.now()>until)throw Error('Authored background did not decode: '+JSON.stringify(HonroAuthoredFarArt.stats()));await new Promise(r=>setTimeout(r,40));}}
 if(HonroAuthoredFarArt.stats().errors.length)throw Error('Background decode errors');
 const snapshot=JSON.stringify(b),failures=[],requireCheck=(ok,message)=>{if(!ok)failures.push(message)};
 const method=s._screenRaster,canvas=s.canvas,ctx=canvas.getContext('2d',{willReadFrequently:true});
 const paint=()=>{s.render(e,0,'',.6,false,0);return ctx.getImageData(0,0,canvas.width,canvas.height).data;};
 s._screenRaster=()=>false;const direct=paint(),directAgain=paint();let directChanged=0;for(let i=0;i<direct.length;i++)if(direct[i]!==directAgain[i])directChanged++;requireCheck(!directChanged,`uncached reference changed ${directChanged} channels`);s._screenRaster=method;paint();paint();const cached=paint();
 let changed=0,max=0;for(let i=0;i<direct.length;i++){const d=Math.abs(direct[i]-cached[i]);if(d)changed++;max=Math.max(max,d)}
 requireCheck(!changed,`stationary cache pixel mismatch ${changed} max ${max}`);
 const initial=s.renderCacheStats();requireCheck(!(initial.screenWorldBytes>24000000||initial.screenBackgroundBytes>24000000||!initial.screenHits),'Cache budget/hit assertion failed');
 const motion=[],slots=['_screenWorldCache','_screenBackgroundCache','_screenForegroundCache'];let previous=Object.fromEntries(slots.map(k=>[k,s[k]?.canvas]));for(let i=0;i<8;i++){s.x+=3;s.scale+=.001;paint();const rebuilt=slots.filter(k=>s[k]?.canvas&&s[k].canvas!==previous[k]);previous=Object.fromEntries(slots.map(k=>[k,s[k]?.canvas]));motion.push({x:s.x,y:s.y,scale:s.scale,builds:s.renderCacheStats().screenBuilds,rebuilt});}const moving=s.renderCacheStats();requireCheck(moving.screenBuilds===initial.screenBuilds,`Moving/zoom screen cache allocated ${initial.screenBuilds}->${moving.screenBuilds}`);
 paint();const settled=s.renderCacheStats();requireCheck(settled.screenBuilds>moving.screenBuilds,'Settled screen cache not built');paint();requireCheck(s.renderCacheStats().screenBuilds===settled.screenBuilds,'Settled screen cache rebuilt');
 b.sceneVersion++;paint();requireCheck(s._screenWorldCache?.canvas===undefined,'Scene version did not evict');paint();requireCheck(!!s._screenWorldCache?.canvas,'Scene version did not rebuild');b.sceneVersion--;
 // Synthetic changing water is drawn by the actual liveWater hook each frame,
 // outside static screen cache. Its sampled pixel must change with no scene edit.
 const originalLive=s.liveWater,originalVersion=b.sceneVersion;let color='#ff0000';s.liveWater=function(c){c.save();c.fillStyle=color;c.fillRect(s.x-20,s.y-20,40,40);c.restore()};
 paint();paint();const before=Array.from(paint().slice(4*(Math.floor(canvas.height/2)*canvas.width+Math.floor(canvas.width/2)),4*(Math.floor(canvas.height/2)*canvas.width+Math.floor(canvas.width/2))+4));color='#0000ff';const live=paint(),off=4*(Math.floor(canvas.height/2)*canvas.width+Math.floor(canvas.width/2)),after=Array.from(live.slice(off,off+4));s.liveWater=originalLive;
 requireCheck(JSON.stringify(before)!==JSON.stringify(after)&&b.sceneVersion===originalVersion,'Live-water paint failed to update outside static cache');
 requireCheck(JSON.stringify(b)===snapshot,'Render and invalidation mutated battle');
 const fake={globalAlpha:1,globalCompositeOperation:'source-over',canvas:{width:3001,height:2000},getTransform:()=>ctx.getTransform()};let calls=0;
 requireCheck(s._screenRaster(fake,'large',3001,2000,()=>calls++,'_testLarge')===false&&s._screenRaster(fake,'large',3001,2000,()=>calls++,'_testLarge')===false&&!calls&&!s._testLarge.canvas,'6M pixel budget assertion failed');
 ctx.save();ctx.globalAlpha=.5;requireCheck(s._screenRaster(ctx,'alpha',20,20,()=>calls++,'_testAlpha')===false&&!calls,'alpha compositing bypass failed');ctx.restore();
 if(stage===1&&width===960&&devicePixelRatio===1){s.manual=false;s.x=u.x-50;s.y=u.y-50;for(let i=0;i<180;i++)s.render(e,1/60,'',.6,false,0);const key=s._screenWorldCache?.key,builds=s.renderCacheStats().screenBuilds;for(let i=0;i<5;i++)s.render(e,1/60,'',.6,false,0);requireCheck(s._screenWorldCache?.key===key&&s.renderCacheStats().screenBuilds===builds,'automatic follow did not settle');}
 return {stage,width,height,dpr:devicePixelRatio,backing:[canvas.width,canvas.height],decodedFallback:image?[image.naturalWidth,image.naturalHeight]:null,authored:!!spec,changed,max,directChanged,initial,moving,motion,settled,liveWater:{before,after},failures,mode};
}
