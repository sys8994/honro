const playableFar60=descriptor.far60?createPlayableFar60({G,plate:descriptor.far60,authorize(app,e,scene,lease){
 const s=active.get(app);return s===lease&&app.stageId===60&&runtime(app)&&s.engine===e&&s.b===e.b&&
  app.engine===e&&app.scene===scene&&s.packet?.map?.id===e.b.honroAuthoredId;
}}):null;
function bindPlayableFar60(app,s){
 if(!playableFar60||app.stageId!==60||!s.engine||!app.scene)return;
 s.playableFar60=playableFar60.mount({app,engine:s.engine,scene:app.scene,lease:s});
}
