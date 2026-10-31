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
 const canvas=s.canvas,ctx=canvas.getContext('2d',{willReadFrequently:true}),original=s._screenRaster;
 const paint=()=>{s.render(e,0,'',.6,false,0);return ctx.getImageData(0,0,canvas.width,canvas.height).data;};
 s._screenRaster=()=>false;const direct=paint(),check=paint();let directDelta=0;for(let i=0;i<direct.length;i++)if(direct[i]!==check[i])directDelta++;
 const results={};for(const slot of ['_screenWorldCache','_screenBackgroundCache','_screenForegroundCache']){
  let calls=0;s[slot]=null;s._screenRaster=function(...args){if(args[5]!==slot)return false;calls++;return original.apply(this,args)};paint();paint();const cached=paint();let changed=0,max=0;for(let i=0;i<direct.length;i++){const d=Math.abs(direct[i]-cached[i]);if(d)changed++;max=Math.max(max,d)}results[slot]={calls,changed,max,cacheBuilt:!!s[slot]?.canvas};
 }
 s._screenRaster=original;return {stage,width,height,dpr:devicePixelRatio,backing:[canvas.width,canvas.height],directDelta,results,scope:'isolation diagnostic, same exact-channel criterion; not an acceptance threshold'};
}
