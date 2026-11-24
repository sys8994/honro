const earlyFar=descriptor.farEarly?createStageFar({G,manifest:descriptor.farEarly,authorize(app,e,scene,lease){
 const s=active.get(app);
 return s===lease&&runtime(app)&&s.engine===e&&s.b===e.b&&app.engine===e&&app.scene===scene&&
   (descriptor.farEarly.rows[app.stageId]?.runtimeAuthoringId??descriptor.farEarly.rows[app.stageId]?.authoringId)===e.b.honroAuthoredId;
},onError(error,id,kind){G.console?.warn('Act6 far place unavailable: '+id+'/'+kind+' '+error?.message);}}):null;
function bindEarlyFar(app,s){
 const e=s.engine,scene=app.scene;
 if(!earlyFar||!e||!scene||app.stageId<51||app.stageId>57)return;
 s.earlyFar=earlyFar.mount({app,engine:e,scene,lease:s});
}
