      const normalFarLeases=new WeakMap();
      const normalFar=descriptor.farEarly?createStageFar({G,manifest:descriptor.farEarly,authorize(app,e,scene,lease){
        const s=active.get(app),b=e.b,id=b.honroStage;
        return s===lease&&normalFarLeases.get(e)===s&&s.normal51===true&&runtime(app)&&app.profile===app.normalProfile&&
          s.engine===e&&s.b===b&&app.engine===e&&app.scene===scene&&app.stageId===id&&e.stage.id===id&&
          normal51Provider.content(b)===e.stage&&b.mode==='campaign'&&b.honroMapOrigin==='campaign'&&
          b.honroAuthoredId==='stage-'+id&&b.honroCanonical===true&&b.honroCustom===false;
      },onError(error,id,kind){G.console?.warn('Act6 normal FAR unavailable: '+id+'/'+kind+' '+error?.message);}}):null;
      function mountNormalFar(app,e){
        const s=active.get(app),b=e?.b,id=b?.honroStage,scene=app.scene;
        if(!normalFar||id<51||id>57||!scene||!s?.normal51||s.engine!==e||s.b!==b||!s.packet?.trace||s.packet.trace.stageId!==id||s.normalFar)return;
        // Entrance collider identity: exact normal owner validated the signed rows
        // before App.mount; 54 and 57 can replace collision legitimately later.
        if(!Array.isArray(b.terrain)||!Array.isArray(b.honroWorldTerrain)||!normal51Provider.content(b))return;
        const play=fingerprints.get(JSON.stringify(b.terrain)),world=fingerprints.get(JSON.stringify(b.honroWorldTerrain));
        if((!play&&!(id===57&&b.terrain===s.prepared57?.terrain&&scope57(app,e,s)))||!world)return;
        normalFarLeases.set(e,s);
        s.normalFar=normalFar.mount({app,engine:e,scene,lease:s});
        if(!s.normalFar)normalFarLeases.delete(e);
      }
      function disposeNormalFar(app){
        const s=active.get(app),e=s?.engine;
        if(!s?.normalFar||!e)return;
        s.normalFar.dispose();normalFarLeases.delete(e);
      }
